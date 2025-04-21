/**
 * Smart Shopper AI - Configuration
 * 
 * This file contains the configuration for the Smart Shopper AI application,
 * including environment variables and default settings.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../lib/utils/logger';

const logger = createLogger('config');

// Load environment variables
dotenv.config();

/**
 * Environment-specific configuration type
 */
interface EnvironmentConfig {
  apiKeys: {
    serpapi: string;
    search1api: string;
    perplexity: string;
    claude: string;
  };
  endpoints: {
    serpapi: string;
    search1api: string;
    perplexity: string;
  };
  performance: {
    maxParallelCalls: number;
    timeoutMs: number;
    enableCaching: boolean;
    cacheTTL: number;
  };
  logging: {
    level: string;
  };
  server: {
    port: number;
  };
}

/**
 * Full configuration type
 */
export interface Config extends EnvironmentConfig {
  environment: string;
  version: string;
}

/**
 * Get environment variable with fallback
 * 
 * @param key - The environment variable key
 * @param defaultValue - The default value if not found
 * @returns The environment variable value or default
 */
function getEnvVar(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (!value) {
    logger.debug({ key, defaultValue }, 'Environment variable not found, using default');
    return defaultValue;
  }
  return value;
}

/**
 * Load environment-specific configuration
 * 
 * @returns The environment configuration
 */
function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    apiKeys: {
      serpapi: getEnvVar('SERPAPI_API_KEY', ''),
      search1api: getEnvVar('SEARCH1_API_KEY', ''),
      perplexity: getEnvVar('PPLX_API_KEY', ''),
      claude: getEnvVar('CLAUDE_API_KEY', ''),
    },
    endpoints: {
      serpapi: getEnvVar('SERPAPI_ENDPOINT', 'https://serpapi.com/search'),
      search1api: getEnvVar('SEARCH1_ENDPOINT', 'https://search1.smartshopper.dev/api/v1'),
      perplexity: getEnvVar('PERPLEXITY_ENDPOINT', 'https://api.perplexity.ai'),
    },
    performance: {
      maxParallelCalls: parseInt(getEnvVar('MAX_PARALLEL_CALLS', '3'), 10),
      timeoutMs: parseInt(getEnvVar('TIMEOUT_MS', '1000'), 10),
      enableCaching: getEnvVar('ENABLE_CACHING', 'true') === 'true',
      cacheTTL: parseInt(getEnvVar('CACHE_TTL', '600'), 10),
    },
    logging: {
      level: getEnvVar('LOG_LEVEL', 'info'),
    },
    server: {
      port: parseInt(getEnvVar('APP_PORT', '3000'), 10),
    },
  };
}

/**
 * Get package version from package.json
 * 
 * @returns The package version
 */
function getPackageVersion(): string {
  try {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '0.1.0';
  } catch (error) {
    logger.warn({ error }, 'Failed to read package.json version');
    return '0.1.0';
  }
}

/**
 * Check required API keys
 * 
 * @param config - The configuration to check
 */
function checkRequiredConfig(config: Config): void {
  const { apiKeys } = config;
  
  // Check if API keys are set
  if (!apiKeys.serpapi) {
    logger.warn('SERPAPI_API_KEY is not set. SerpAPI searches will not work.');
  }
  
  if (!apiKeys.search1api) {
    logger.warn('SEARCH1_API_KEY is not set. Search1API searches will not work.');
  }
  
  if (!apiKeys.perplexity) {
    logger.warn('PPLX_API_KEY is not set. Perplexity enrichment will not work.');
  }
}

// Load configuration
const envConfig = loadEnvironmentConfig();
const environment = getEnvVar('NODE_ENV', 'development');
const version = getPackageVersion();

// Create full configuration
const config: Config = {
  ...envConfig,
  environment,
  version,
};

// Check required configuration
checkRequiredConfig(config);

logger.info({ 
  environment: config.environment, 
  version: config.version,
  loggingLevel: config.logging.level,
  port: config.server.port,
  cachingEnabled: config.performance.enableCaching,
}, 'Configuration loaded');

export default config;
