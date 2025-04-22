/**
 * Smart Shopper Claude API Client
 * 
 * This module provides Claude API integration for the Smart Shopper application.
 * It handles making requests to the Claude API for shopping assistance and insights.
 */

const axios = require('axios');

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

Your response must be in JSON format with these sections:
- insights: Array of analysis points about the products
- canvas_operations: Array of operations to modify the product display
`;

    // Create a structured message with product data
    const userMessage = this._formatProductData(query, products, enrichment, context);

    try {
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
          timeout: 10000 // 10-second timeout
        }
      );

      // Parse the JSON response content
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(response.data.content[0].text);
      } catch (parseError) {
        console.error('Error parsing Claude response as JSON:', parseError);
        jsonResponse = {
          insights: [
            {
              type: 'error',
              content: 'Failed to parse Claude response as JSON.'
            }
          ],
          canvas_operations: []
        };
      }

      return jsonResponse;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      
      // Return a fallback response
      return {
        query,
        insights: [
          {
            type: 'error',
            content: `Error communicating with Claude: ${error.message}`
          }
        ],
        canvas_operations: []
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
        message += `- Source: ${product.source}\n`;
        
        if (product.rating) message += `- Rating: ${product.rating}\n`;
        if (product.reviews_count) message += `- Reviews: ${product.reviews_count}\n`;
        
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
Please analyze these products and provide:
1. Insights about the products, including patterns, price analysis, and quality assessment
2. Canvas operations to organize and highlight the most relevant products

Return your analysis as a JSON object with 'insights' and 'canvas_operations' arrays.`;

    return message;
  }
}

module.exports = ClaudeClient;
