/**
 * Claude API Client for Smart Shopper
 * 
 * This utility provides a simple interface for communicating with the Claude API
 * via the MCP protocol, specifically for product analysis and recommendations.
 */

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// API key
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Claude API endpoint
const CLAUDE_ENDPOINT = process.env.CLAUDE_ENDPOINT || 'https://api.anthropic.com/v1/messages';

// Claude model to use
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';

/**
 * Claude Client for Smart Shopper
 */
class ClaudeClient {
  /**
   * Create a new Claude Client
   * @param {Object} options Configuration options
   * @param {string} options.apiKey Claude API key (defaults to env var)
   * @param {string} options.endpoint Claude API endpoint (defaults to env var or standard endpoint)
   * @param {string} options.model Claude model to use (defaults to env var or latest model)
   * @param {number} options.maxTokens Maximum tokens to generate (defaults to 1024)
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey || CLAUDE_API_KEY;
    this.endpoint = options.endpoint || CLAUDE_ENDPOINT;
    this.model = options.model || CLAUDE_MODEL;
    this.maxTokens = options.maxTokens || 1024;
    
    if (!this.apiKey) {
      throw new Error('Claude API key is required. Provide it in constructor or set CLAUDE_API_KEY env var.');
    }
  }
  
  /**
   * Get shopping assistance from Claude
   * @param {Object} params Request parameters
   * @param {string} params.query User's shopping query
   * @param {Array} params.products Product data from search results
   * @param {Array} params.enrichment Enrichment data from Perplexity
   * @param {Object} params.context Additional context for Claude
   * @returns {Promise<Object>} Claude's shopping assistance response
   */
  async getShoppingAssistance(params) {
    const { query, products, enrichment, context } = params;
    
    try {
      // Create system prompt
      const systemPrompt = `
You are an AI shopping assistant for Smart Shopper. Your task is to help users find the best products based on their query and the provided product data.

Follow these rules:
1. Analyze the products and identify the best options based on price, ratings, and features
2. Provide brief, helpful insights about the product category
3. Generate canvas operations to highlight your recommendations
4. Keep all responses under 150 words
5. Focus on being helpful and direct
6. All responses must be JSON-formatted for the frontend to parse

Your response format must be:
{
  "query": "the user's query",
  "insights": [
    {
      "type": "summary|analysis|recommendation",
      "content": "helpful insight text"
    }
  ],
  "canvas_operations": [
    {
      "op": "add_card|update_grid|highlight_choice|undo_last",
      // operation-specific parameters
    }
  ]
}
`;

      // User message with product data
      const userMessage = `
I'm looking for: "${query}"

Available products:
${JSON.stringify(products, null, 2)}

Product enrichment:
${JSON.stringify(enrichment, null, 2)}

Additional context:
${JSON.stringify(context, null, 2)}

Please analyze these products and provide recommendations.
`;

      // Make API request to Claude
      const response = await axios.post(this.endpoint, {
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.5,
        top_p: 0.9,
        anthropic_version: "2023-06-01"
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-beta': 'token-efficient-tools-2025-02-19'
        },
        timeout: 950 // 950ms timeout to stay under 1s latency requirement
      });
      
      // Extract the assistant's message
      const assistantMessage = response.data.content[0].text;
      
      // Parse JSON response - handle both raw JSON and JSON embedded in text
      let jsonResponse;
      try {
        // Try to parse the entire response as JSON
        jsonResponse = JSON.parse(assistantMessage);
      } catch (e) {
        // If that fails, try to extract JSON from the text
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            jsonResponse = JSON.parse(jsonMatch[0]);
          } catch (e2) {
            throw new Error('Failed to parse Claude response as JSON');
          }
        } else {
          throw new Error('Claude response does not contain valid JSON');
        }
      }
      
      return jsonResponse;
    } catch (error) {
      console.error('Error getting shopping assistance from Claude:', error);
      
      // Return fallback response in case of error
      return {
        query,
        insights: [
          {
            type: 'error',
            content: 'Sorry, I encountered an error analyzing these products. Please try again or refine your search.'
          }
        ],
        canvas_operations: []
      };
    }
  }
}

module.exports = ClaudeClient;
