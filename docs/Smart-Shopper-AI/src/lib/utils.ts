/**
 * Utility functions for Smart Shopper AI
 */

import pino from 'pino';
import { SerpApiParams, Search1Params } from '../types';
import { serializeError } from 'serialize-error';
import Joi from 'joi';

// Performance budgets in milliseconds
export const PERFORMANCE_BUDGETS = {
  TOOL_CALL: 800, // Maximum time for a tool call
  PARALLEL_CALLS: 1000, // Maximum time for parallel tool calls
  TOTAL_RESPONSE: 1000, // Maximum total response time
};

// Performance measurement
const measurements: Record<string, { startTime: number; endTime?: number }> = {};

/**
 * Start measuring performance for a specific operation
 * 
 * @param operation - Operation name
 * @param budget - Time budget in milliseconds
 */
export function startMeasurement(operation: string, budget: number): void {
  measurements[operation] = {
    startTime: Date.now(),
  };
}

/**
 * End measuring performance for a specific operation
 * 
 * @param operation - Operation name
 * @returns Duration in milliseconds
 */
export function endMeasurement(operation: string): number {
  if (!measurements[operation]) {
    return 0;
  }

  measurements[operation].endTime = Date.now();
  const duration = measurements[operation].endTime - measurements[operation].startTime;
  
  return duration;
}

/**
 * Get duration of a measurement
 * 
 * @param operation - Operation name
 * @returns Duration in milliseconds or undefined if not finished
 */
export function getMeasurement(operation: string): number | undefined {
  const measurement = measurements[operation];
  if (!measurement || !measurement.endTime) {
    return undefined;
  }
  
  return measurement.endTime - measurement.startTime;
}

/**
 * Create a logger with a specific name
 * 
 * @param name - Logger name
 * @returns Pino logger
 */
export function createLogger(name: string) {
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });
}

/**
 * Simple in-memory cache
 */
interface CacheOptions {
  ttl: number; // Time to live in seconds
}

export class Cache<T> {
  private cache: Map<string, { value: T; expires: number }> = new Map();
  private name: string;
  private ttl: number;
  private logger = createLogger('cache');

  constructor(name: string, options: CacheOptions) {
    this.name = name;
    this.ttl = options.ttl;
  }

  /**
   * Set a value in the cache
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Optional custom TTL
   */
  set(key: string, value: T, ttl?: number): void {
    const expireTime = Date.now() + (ttl || this.ttl) * 1000;
    this.cache.set(key, { value, expires: expireTime });
    this.logger.debug({ cache: this.name, key }, 'Cache set');
  }

  /**
   * Get a value from the cache
   * 
   * @param key - Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      this.logger.debug({ cache: this.name, key }, 'Cache expired');
      return undefined;
    }
    
    this.logger.debug({ cache: this.name, key }, 'Cache hit');
    return item.value;
  }

  /**
   * Check if a key exists in the cache
   * 
   * @param key - Cache key
   * @returns Whether the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   * 
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.logger.debug({ cache: this.name, key }, 'Cache deleted');
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.debug({ cache: this.name }, 'Cache cleared');
  }
}

/**
 * Token bucket rate limiter
 */
interface TokenBucketOptions {
  maxTokens: number;
  refillRate: number; // tokens per minute
  refillInterval: number; // milliseconds per token
}

export function tokenBucket(name: string, options: TokenBucketOptions) {
  const logger = createLogger(`rate-limiter:${name}`);
  let tokens = options.maxTokens;
  let lastRefill = Date.now();
  
  // Set up token refill
  const refillTokens = () => {
    const now = Date.now();
    const elapsedTime = now - lastRefill;
    const tokensToAdd = Math.floor(elapsedTime / options.refillInterval);
    
    if (tokensToAdd > 0) {
      tokens = Math.min(options.maxTokens, tokens + tokensToAdd);
      lastRefill = now - (elapsedTime % options.refillInterval);
      logger.debug({ tokens }, 'Tokens refilled');
    }
  };
  
  /**
   * Consume tokens from the bucket
   * 
   * @param count - Number of tokens to consume
   * @returns Whether tokens were successfully consumed
   */
  const consume = async (count: number): Promise<boolean> => {
    refillTokens();
    
    if (tokens >= count) {
      tokens -= count;
      logger.debug({ tokens, consumed: count }, 'Tokens consumed');
      return true;
    }
    
    logger.warn({ tokens, requested: count }, 'Rate limit exceeded');
    return false;
  };
  
  return { consume };
}

/**
 * Handle errors and transform them to a standard format
 * 
 * @param error - The error to handle
 * @param sourceCode - Source code for the error
 * @returns Standardized error
 */
export function handleError(error: any, sourceCode: string = 'UNK') {
  const serialized = serializeError(error);
  const errorCode = serialized.code || 'ERR_UNKNOWN';
  const errorMessage = serialized.message || 'Unknown error';
  
  return new Error(`${sourceCode}_${errorCode}: ${errorMessage}`);
}

/**
 * Validate SerpAPI parameters
 * 
 * @param params - Parameters to validate
 * @returns Validated parameters or error
 */
export function validateSerpApiParams(params: SerpApiParams) {
  const schema = Joi.object({
    q: Joi.string().required(),
    fields: Joi.string(),
    no_cache: Joi.boolean(),
    filters: Joi.object({
      price: Joi.string(),
      minPrice: Joi.number(),
      maxPrice: Joi.number(),
      brand: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
      category: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
      inStock: Joi.boolean(),
    }),
  });
  
  return schema.validate(params);
}

/**
 * Validate Search1API parameters
 * 
 * @param params - Parameters to validate
 * @returns Validated parameters or error
 */
export function validateSearch1Params(params: Search1Params) {
  const schema = Joi.object({
    q: Joi.string().required(),
    filters: Joi.object().pattern(Joi.string(), Joi.any()),
    facets: Joi.array().items(Joi.string()),
    boost: Joi.object({
      field: Joi.string().required(),
      factor: Joi.number().min(0.1).max(10).required(),
    }),
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(50),
  });
  
  return schema.validate(params);
}

/**
 * Truncate a string to a maximum length
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.slice(0, maxLength - 3) + '...';
}
