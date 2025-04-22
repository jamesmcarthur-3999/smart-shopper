/**
 * Smart Shopper API Key Management
 * 
 * This module provides utilities for validating and managing API keys
 * in a secure manner. It ensures the application has all required 
 * credentials to function properly.
 */

/**
 * Validate API key format
 * 
 * @param {string} key API key to validate
 * @param {RegExp} pattern Expected pattern for the key
 * @returns {boolean} Whether the key is valid
 */
function validateKeyFormat(key, pattern) {
  if (!key) return false;
  return pattern.test(key);
}

/**
 * Get API key or throw error if missing
 * 
 * @param {string} key API key to retrieve from env
 * @param {RegExp} pattern Expected pattern for the key
 * @param {string} serviceDescription Description of the service
 * @returns {string} The validated API key
 */
function getApiKey(key, pattern, serviceDescription) {
  const apiKey = process.env[key];
  
  if (!apiKey) {
    throw new Error(`Missing ${key} - unable to access ${serviceDescription}`);
  }
  
  if (pattern && !validateKeyFormat(apiKey, pattern)) {
    console.warn(`Warning: ${key} doesn't match expected pattern`);
  }
  
  return apiKey;
}

/**
 * Initialize all API keys and validate their format
 * 
 * @returns {Object} Object containing all validated API keys
 */
function initializeApiKeys() {
  const keyPatterns = {
    'SERPAPI_API_KEY': /^sk_c/,
    'SEARCH1_API_KEY': /^sk_s1_/,
    'PERPLEXITY_API_KEY': /^pplx_/,
    'CLAUDE_API_KEY': /^sk-ant/
  };
  
  const serviceDescriptions = {
    'SERPAPI_API_KEY': 'Google Shopping results via SerpAPI',
    'SEARCH1_API_KEY': '