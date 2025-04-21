/**
 * Environment variable generator script for Smart Shopper
 * This script creates a browser-safe env-config.js file with public environment variables
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// List of environment variables that should be exposed to the browser
const ALLOWED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'REACT_APP_API_URL',
  'ENABLE_CACHING', 
  'DEFAULT_GRID_LAYOUT',
  'MAX_CARDS_PER_VIEW',
  'ENABLE_ANIMATIONS',
  'SERPAPI_ENDPOINT',
  'SEARCH1_ENDPOINT',
  'PERPLEXITY_ENDPOINT'
];

// Create public/env-config.js with safe environment variables
const generateConfig = () => {
  try {
    const publicEnvObj = {};
    
    // Add allowed environment variables to the public config object
    ALLOWED_ENV_VARS.forEach(key => {
      if (process.env[key]) {
        publicEnvObj[key] = process.env[key];
      }
    });
    
    // Add all REACT_APP_* environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('REACT_APP_')) {
        publicEnvObj[key] = process.env[key];
      }
    });
    
    // Default values for required variables
    if (!publicEnvObj.NODE_ENV) publicEnvObj.NODE_ENV = 'development';
    if (!publicEnvObj.PORT) publicEnvObj.PORT = '3000';
    if (!publicEnvObj.ENABLE_CACHING) publicEnvObj.ENABLE_CACHING = 'true';
    if (!publicEnvObj.MAX_CARDS_PER_VIEW) publicEnvObj.MAX_CARDS_PER_VIEW = '12';
    
    // Create the content for env-config.js
    const configContent = `window.env = ${JSON.stringify(publicEnvObj, null, 2)};`;
    
    // Ensure public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write the config file
    const configPath = path.join(publicDir, 'env-config.js');
    fs.writeFileSync(configPath, configContent);
    
    console.log(`Environment configuration generated at ${configPath}`);
    console.log(`Exposed variables: ${Object.keys(publicEnvObj).join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('Error generating environment configuration:', error);
    return false;
  }
};

// Run the generator
generateConfig();
