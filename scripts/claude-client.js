/**
 * Smart Shopper Claude API Client
 * 
 * This module provides Claude API integration for the Smart Shopper application.
 * It handles making requests to the Claude API for shopping assistance and insights.
 */

const axios = require('axios');
const util = require('util');

class ClaudeClient {
  /**
   * Initialize a new Claude client
   * 
   * @param {Object} config Configuration options
   * @param {string} config.apiKey Claude API key
   * @param {number} config.maxTokens Maximum tokens for completion (default: 1024)
   * @param {string} config.model Claude model to use (default: 'claude-3-sonnet-20240229')
   */
  constructor(config) {
    this.apiKey = config.apiKey;
    this.maxTokens = config.maxTokens || 1024;
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
    
    // Debug logging for API key
    console.log(`Claude API key initialized: ${this.apiKey ? (this.apiKey.substring(0, 5) + '...' + this.apiKey.substring(this.apiKey.length - 3)) : 'MISSING'}`);
  }

  /**
   * Get shopping assistance from Claude
   * 
   * @param {Object} params Input parameters
   * @param {string} params.query User's shopping query
   * @param {Array} params.products Product results to analyze
   * @param {Array} params.enrichment Additional context/enrichment data
   * @param {Object} params.context Additional context (e.g., user preferences)
   * @returns {Promise<Object>} Claude's shopping assistance response
   */
  async getShoppingAssistance(params) {
    const { query, products, enrichment, context } = params;

    // Construct the system prompt
    const systemPrompt = `You are a shopping assistant for Smart Shopper. 
Your task is to help the user find the best products based on their query: "${query}".
Analyze the provided products and enrichment data to provide insights, recommendations, and canvas operations.

Follow this workflow:
1. PLAN - Analyze the products and determine the best approach
2. REFLECT - Provide insights about the products, including patterns, price ranges, and quality assessment
3. PATCH - Provide canvas operations to organize and highlight the most relevant products

Your response must be in JSON format with these sections:
- insights: Array of analysis points about the products (1-3 key observations)
- canvas_operations: Array of operations to modify the product display including:
  - update_grid: to organize products (include only the most relevant products)
  - highlight_choice: to emphasize your top recommendation(s) with a reason
`;

    // Create a structured message with product data
    const userMessage = this._formatProductData(query, products, enrichment, context);

    try {
      console.log(`Making Claude API request for query: "${query}" with ${products?.length || 0} products`);
      
      // Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Claude request payload:', {
          model: this.model,
          max_tokens: this.maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage.substring(0, 100) + '...' }]
        });
      }

      // Make API call to Claude
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: this.model,
          max_tokens: this.maxTokens,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000 // 30-second timeout
        }
      );

      console.log('Claude API response status:', response.status);
      
      // Debug response structure in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Claude API response structure:', util.inspect(response.data, { depth: 3, colors: true }));
      }

      // Parse the JSON response content
      let jsonResponse;
      try {
        // Extract the content from the response
        const content = response.data.content[0].text;
        jsonResponse = JSON.parse(content);
        
        console.log('Successfully parsed Claude response as JSON');
      } catch (parseError) {
        console.error('Error parsing Claude response as JSON:', parseError);
        console.error('Raw response content:', response.data?.content);
        
        // Provide a fallback response
        jsonResponse = {
          insights: [
            {
              type: 'error',
              content: 'I had trouble processing these products in a structured way. Let me describe what I found instead.'
            },
            {
              type: 'summary',
              content: `I found ${products?.length || 0} products related to "${query}". The prices range from ${this._getPriceRange(products)}.`
            }
          ],
          canvas_operations: [
            {
              op: 'update_grid',
              items: products?.map(p => p.id) || [],
              layout: { columns: 3 }
            }
          ]
        };
      }

      return jsonResponse;
    } catch (error) {
      console.error('Error calling Claude API:', error.message);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Claude API error response data:', error.response.data);
        console.error('Claude API error response status:', error.response.status);
        console.error('Claude API error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Claude API error request:', error.request);
      }
      
      // Return a fallback response
      return {
        query,
        insights: [
          {
            type: 'error',
            content: `I encountered an error while analyzing these products (${error.message}). Let me share what I can based on the raw data.`
          },
          {
            type: 'summary',
            content: `I found ${products?.length || 0} products related to "${query}". ${this._getFallbackInsight(products)}`
          }
        ],
        canvas_operations: [
          {
            op: 'update_grid',
            items: products?.map(p => p.id) || [],
            layout: { columns: 3 }
          }
        ]
      };
    }
  }

  /**
   * Format product data for Claude API request
   * 
   * @private
   * @param {string} query User's shopping query
   * @param {Array} products Product results to analyze
   * @param {Array} enrichment Additional context/enrichment data
   * @param {Object} context Additional context (e.g., user preferences)
   * @returns {string} Formatted message content for Claude
   */
  _formatProductData(query, products, enrichment, context) {
    let message = `Shopping query: "${query}"\n\n`;
    
    // Add products
    message += `### Products (${products?.length || 0})\n`;
    if (products && products.length > 0) {
      message += 'Here are the product search results:\n\n';
      products.forEach((product, index) => {
        message += `Product ${index + 1}:\n`;
        message += `- ID: ${product.id}\n`;
        message += `- Title: ${product.title}\n`;
        message += `- Price: ${product.price}\n`;
        message += `- Source: ${product.source || 'Unknown'}\n`;
        
        if (product.rating) message += `- Rating: ${product.rating}\n`;
        if (product.reviews_count) message += `- Reviews: ${product.reviews_count}\n`;
        if (product.description) message += `- Description: ${product.description}\n`;
        
        message += '\n';
      });
    } else {
      message += 'No products found for this query.\n\n';
    }
    
    // Add enrichment data
    message += `### Enrichment\n`;
    if (enrichment && enrichment.length > 0) {
      enrichment.forEach(item => {
        message += `${item.topic || 'Information'}:\n`;
        message += `${item.content}\n\n`;
        
        if (item.sources && item.sources.length > 0) {
          message += 'Sources:\n';
          item.sources.forEach(source => {
            message += `- ${source.title || source.url || 'Unknown source'}\n`;
          });
          message += '\n';
        }
      });
    } else {
      message += 'No enrichment data available.\n\n';
    }
    
    // Add context information
    message += `### Context\n`;
    if (context) {
      if (context.preferences) {
        message += `User preferences: ${JSON.stringify(context.preferences)}\n`;
      }
      if (context.history) {
        message += `Shopping history: ${JSON.stringify(context.history)}\n`;
      }
    } else {
      message += 'No additional context available.\n';
    }
    
    // Instructions for the response format
    message += `\n### Response Instructions
Analyze these products and provide:
1. Insights about the products, including patterns, price analysis, and quality assessment
2. Canvas operations to organize and highlight the most relevant products

Return your analysis as a JSON object with 'insights' and 'canvas_operations' arrays.`;

    return message;
  }

  /**
   * Get price range from products
   * 
   * @private
   * @param {Array} products Product list
   * @returns {string} Price range string
   */
  _getPriceRange(products) {
    if (!products || products.length === 0) {
      return 'unknown';
    }
    
    const prices = products
      .map(p => parseFloat(p.price?.replace(/[^0-9.]/g, '')))
      .filter(price => !isNaN(price));
      
    if (prices.length === 0) {
      return 'unknown';
    }
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return `$${minPrice.toFixed(2)} to $${maxPrice.toFixed(2)}`;
  }

  /**
   * Get fallback insight for products
   * 
   * @private
   * @param {Array} products Product list
   * @returns {string} Fallback insight
   */
  _getFallbackInsight(products) {
    if (!products || products.length === 0) {
      return 'No product details available.';
    }
    
    // Get most common source
    const sources = {};
    products.forEach(p => {
      if (p.source) {
        sources[p.source] = (sources[p.source] || 0) + 1;
      }
    });
    
    let topSource = 'various sources';
    let topCount = 0;
    
    Object.entries(sources).forEach(([source, count]) => {
      if (count > topCount) {
        topSource = source;
        topCount = count;
      }
    });
    
    // Get average rating if available
    const ratings = products
      .map(p => parseFloat(p.rating))
      .filter(rating => !isNaN(rating));
      
    let ratingInfo = '';
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      ratingInfo = ` The average rating is ${avgRating.toFixed(1)}/5.`;
    }
    
    return `Most products are from ${topSource}.${ratingInfo}`;
  }
}

module.exports = ClaudeClient;
