/**
 * Smart Shopper AI - Cache Utility
 * 
 * This file contains a simple caching mechanism to improve performance and
 * reduce the number of API calls made to external services.
 */

import NodeCache from 'node-cache';
import { createLogger } from './logger';

const logger = createLogger('cache');

// Default TTL values in seconds
const DEFAULT_CACHE_TTL = 600; // 10 minutes
const DEFAULT_STATS_INTERVAL = 60; // 1 minute

/**
 * Cache configuration options
 */
export interface CacheOptions {
  ttl?: number;
  checkperiod?: number;
  statsInterval?: number;
}

/**
 * Cache utility class for storing and retrieving data
 */
export class Cache<T = any> {
  private cache: NodeCache;
  private name: string;
  private statsInterval: number;
  private hits: number = 0;
  private misses: number = 0;
  private statsTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new cache instance
   * 
   * @param name - Unique name for this cache
   * @param options - Cache configuration options
   */
  constructor(name: string, options: CacheOptions = {}) {
    this.name = name;
    this.statsInterval = options.statsInterval || DEFAULT_STATS_INTERVAL;
    
    this.cache = new NodeCache({
      stdTTL: options.ttl || DEFAULT_CACHE_TTL,
      checkperiod: options.checkperiod || Math.floor((options.ttl || DEFAULT_CACHE_TTL) / 10),
      useClones: false,
    });

    // Start stats reporting
    this.startStatsReporting();

    logger.debug({ name, options }, 'Cache initialized');
  }

  /**
   * Sets a value in the cache
   * 
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Optional TTL in seconds
   * @returns Success status
   */
  set(key: string, value: T, ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl);
    logger.debug({ key, ttl, success }, 'Cache set');
    return success;
  }

  /**
   * Gets a value from the cache
   * 
   * @param key - The cache key
   * @returns The cached value or undefined if not found
   */
  get(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    
    if (value === undefined) {
      this.misses++;
      logger.debug({ key, hit: false }, 'Cache miss');
    } else {
      this.hits++;
      logger.debug({ key, hit: true }, 'Cache hit');
    }
    
    return value;
  }

  /**
   * Checks if a key exists in the cache
   * 
   * @param key - The cache key
   * @returns Whether the key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Deletes a key from the cache
   * 
   * @param key - The cache key to delete
   * @returns Whether the key was deleted
   */
  delete(key: string): boolean {
    const deleted = this.cache.del(key);
    logger.debug({ key, deleted: deleted > 0 }, 'Cache delete');
    return deleted > 0;
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.flushAll();
    logger.info('Cache cleared');
  }

  /**
   * Gets cache statistics
   * 
   * @returns Cache statistics
   */
  getStats() {
    const stats = {
      name: this.name,
      keys: this.cache.keys().length,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 
        ? this.hits / (this.hits + this.misses) 
        : 0,
      memory: this.cache.getStats(),
    };
    
    return stats;
  }

  /**
   * Starts the stats reporting timer
   */
  private startStatsReporting() {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
    }
    
    this.statsTimer = setInterval(() => {
      const stats = this.getStats();
      if (stats.hits + stats.misses > 0) {
        logger.info({ stats }, 'Cache statistics');
      }
    }, this.statsInterval * 1000);
  }

  /**
   * Stops the stats reporting timer
   */
  shutdown() {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
    logger.debug('Cache shutdown');
  }
}

export default Cache;
