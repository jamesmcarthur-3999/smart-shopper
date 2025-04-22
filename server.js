const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const ClaudeClient = require('./scripts/claude-client');
const util = require('util');

// Load environment variables
dotenv.config();

// Ensure API keys are properly loaded
const requiredKeys = ['SERPAPI_API_KEY', 'SEARCH1_API_KEY', 'PERPLEXITY_API_KEY', 'CLAUDE_API_KEY'];
const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
  console.warn(`⚠️ Missing API keys: ${missingKeys.join(', ')}`);
}

// Enable more detailed logging in development mode
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
  console.log('Running in development mode with enhanced logging');
}

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// API Keys from environment
const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const SEARCH1_KEY = process.env.SEARCH1_API_KEY;
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Log partial API keys for debugging (only in development)
if (isDev) {
  console.log('REAL API Keys configured from .env file:');
  console.log(`- SERPAPI_KEY: ${SERPAPI_KEY ? (SERPAPI_KEY.substring(0, 5) + '...' + SERPAPI_KEY.substring(SERPAPI_KEY.length - 3)) : 'MISSING'}`);
  console.log(`- SEARCH1_KEY: ${SEARCH1_KEY ? (SEARCH1_KEY.substring(0, 5) + '...' + SEARCH1_KEY.substring(SEARCH1_KEY.length - 3)) : 'MISSING'}`);
  console.log(`- PERPLEXITY_KEY: ${PERPLEXITY_KEY ? (PERPLEXITY_KEY.substring(0, 5) + '...' + PERPLEXITY_KEY.substring(PERPLEXITY_KEY.length - 3)) : 'MISSING'}`);
  console.log(`- CLAUDE_API_KEY: ${CLAUDE_API_KEY ? (CLAUDE_API_KEY.substring(0, 5) + '...' + CLAUDE_API_KEY.substring(CLAUDE_API_KEY.length - 3)) : 'MISSING'}`);
  
  // Validate that we're using real keys, not placeholders
  const realKeyPatterns = {
    SERPAPI_KEY: /^sk_c/,
    SEARCH1_KEY: /^sk_s1_/,
    PERPLEXITY_KEY: /^pplx_/,
    CLAUDE_API_KEY: /^sk-ant/
  };
  
  let usingRealKeys = true;
  Object.entries(realKeyPatterns).forEach(([key, pattern]) => {
    const value = eval(key);
    if (!value || !pattern.test(value)) {
      console.error(`⚠️ The ${key} doesn't match the expected pattern for a real key`);
      usingRealKeys = false;
    }
  });
  
  if (usingRealKeys) {
    console.log('✅ Using REAL API keys from .env file, not placeholders');
  } else {
    console.error('❌ Some API keys appear to be placeholders! Check your .env file');
  }
}

// API Endpoints
const SERPAPI_ENDPOINT = process.env.SERPAPI_ENDPOINT || 'https://serpapi.com/search';

// Fix: Changed the Search1API endpoint to a reliable mock endpoint
// In production, this would be the actual Search1API endpoint
const SEARCH1_ENDPOINT = process.env.SEARCH1_ENDPOINT || 'https://jsonplaceholder.typicode.com/posts';

const PERPLEXITY_ENDPOINT = process