/**
 * Smart Shopper AI - Multi-Source MCP Server
 * 
 * This file implements the Model Context Protocol server for multi-source search,
 * which combines results from multiple product data sources and enriches them.
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import pTimeout from 'p-timeout';

import { 
  createLogger,
  Cache,
  handleError,
  startMeasurement,
  endMeasurement,
  PERFORMANCE_BUDGETS,
} from '../../lib/utils';
import { 
  ProductSearchResult, 
  MultiSourceSearchResult,
  Source 
} from '../../types';

// Import adapters
import serpapi from './adapters/serpapi';
import search1api from './adapters/search1api';
import perplexity from './adapters/perplexity';

// Load environment variables
dotenv.config();

const logger = createLogger('multi-source-server');
const cache = new Cache<MultiSourceSearchResult>('multi-source', { ttl: 300 }); // Cache for 5 minutes

// Load configuration
const configPath = path.resolve(__dirname, '../../../config/sources.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;

// Register sources
const sources: Record<string, Source> = {
  serpapi,
  search1api,
  perplexity,
};

/**
 * Merge product results from multiple sources
 * 
 * @param results - Array of search results from different sources
 * @param strategy - Merge strategy
 * @param maxResults - Maximum number of results to return
 * @returns Merged product list
 */
function mergeResults(
  results: ProductSearchResult[],
  strategy: string = 'interleave',
  maxResults: number = 10
): any[] {
  // Filter out empty results or those with errors
  const validResults = results.filter(r => r.products && r.products.length > 0 && !r.error);
  
  if (validResults.length === 0) {
    return [];
  }
  
  // If only one valid result, just return its products
  if (validResults.length === 1) {
    return validResults[0].products.slice(0, maxResults);
  }
  
  // Sort sources by priority
  validResults.sort((a, b) => {
    const aSource = sources[a.source];
    const bSource = sources[b.source];
    return (aSource?.priority || 99) - (bSource?.priority || 99);
  });
  
  // Apply merge strategy
  switch (strategy) {
    case 'interleave': {
      // Round-robin from each source
      const merged: any[] = [];
      let index = 0;
      
      while (merged.length < maxResults) {
        const sourceIndex = index % validResults.length;
        const source = validResults[sourceIndex];
        const productIndex = Math.floor(index / validResults.length);
        
        if (productIndex < source.products.length) {
          merged.push(source.products[productIndex]);
        }
        
        index++;
        if (merged.length >= maxResults || index >= validResults.length * 100) {
          break; // Prevent infinite loops
        }
      }
      
      return merged;
    }
    
    case 'sequential': {
      // Sequential merge - all from first source, then second, etc.
      const merged: any[] = [];
      
      for (const result of validResults) {
        merged.push(...result.products);
        if (merged.length >= maxResults) {
          break;
        }
      }
      
      return merged.slice(0, maxResults);
    }
    
    case 'priority': {
      // Use only the highest priority source that has results
      return validResults[0].products.slice(0, maxResults);
    }
    
    default:
      // Default to interleave
      return mergeResults(results, 'interleave', maxResults);
  }
}

/**
 * Perform multi-source product search
 * 
 * @param query - Search query
 * @param options - Search options
 * @returns Multi-source search results
 */
async function multiSourceSearch(
  query: string,
  options: {
    sources?: string[];
    parallel?: boolean;
    mergeStrategy?: string;
    maxResults?: number;
    maxParallel?: number;
    timeoutMs?: number;
    fallbackOnTimeout?: boolean;
    resultsPerSource?: number;
    includeEnrichment?: boolean;
    filters?: Record<string, any>;
    no_cache?: boolean;
  } = {}
): Promise<MultiSourceSearchResult> {
  const {
    sources: sourceIds = config.multi_source.defaultSources,
    parallel = config.multi_source.parallel,
    mergeStrategy = config.multi_source.mergeStrategy,
    maxResults = config.multi_source.maxResults,
    maxParallel = config.multi_source.maxParallel,
    timeoutMs = config.multi_source.timeoutMs,
    fallbackOnTimeout = config.multi_source.fallbackOnTimeout,
    resultsPerSource = config.multi_source.resultsPerSource,
    includeEnrichment = true,
    filters = {},
    no_cache = false,
  } = options;

  // Start measuring performance
  startMeasurement('multi_source_search', PERFORMANCE_BUDGETS.TOOL_CALL);
  
  try {
    // Generate cache key
    const cacheKey = `multi-source-${query}-${JSON.stringify(options)}`;
    
    // Check cache if not explicitly disabled
    if (!no_cache && cache.has(cacheKey)) {
      logger.info({ query }, 'Returning cached multi-source results');
      const cachedResults = cache.get(cacheKey);
      endMeasurement('multi_source_search');
      return cachedResults as MultiSourceSearchResult;
    }
    
    logger.info({ query, sourceIds }, 'Performing multi-source search');
    
    // Filter to available sources
    const selectedSources = sourceIds
      .filter(id => sources[id])
      .map(id => sources[id])
      .sort((a, b) => (a.priority || 99) - (b.priority || 99))
      .slice(0, maxParallel);
    
    if (selectedSources.length === 0) {
      throw new Error('No valid sources selected for search');
    }
    
    // Prepare search promises
    const searchPromises: Promise<ProductSearchResult>[] = selectedSources
      .filter(source => source.search) // Only include sources with search capability
      .map(source => {
        const sourceConfig = config.sources.find((s: any) => s.id === source.id) || {};
        const defaultParams = sourceConfig.defaultParams || {};
        
        // Merge default params with provided options
        const searchOptions = {
          ...defaultParams,
          filters,
          limit: resultsPerSource,
          timeout: timeoutMs,
        };
        
        // Create a timeout promise
        return pTimeout(
          source.search(query, searchOptions),
          timeoutMs,
          () => {
            logger.warn({ query, source: source.id }, 'Search timeout');
            if (fallbackOnTimeout) {
              return {
                products: [],
                totalCount: 0,
                source: source.id,
                sourceDisplayName: source.name,
                latency: timeoutMs,
                error: {
                  message: 'Search timeout',
                  code: 'TIMEOUT',
                  source: source.id,
                },
              };
            }
            throw new Error(`${source.id} search timeout`);
          }
        );
      });
    
    // Execute searches
    const startTime = Date.now();
    const searchResults = parallel
      ? await Promise.all(searchPromises)
      : await sequentialSearch(searchPromises);
    
    // Merge results
    const mergedProducts = mergeResults(searchResults, mergeStrategy, maxResults);
    
    // Perform enrichment if requested and if we have results
    let enrichedProducts = mergedProducts;
    let enrichmentResult = null;
    
    if (includeEnrichment && mergedProducts.length > 0 && sources.perplexity && sources.perplexity.enrich) {
      try {
        // Prepare enrichment query based on top product
        const topProduct = mergedProducts[0];
        const enrichmentQuery = `Tell me about ${topProduct.title}. Include details about key features, price comparisons, and user reviews.`;
        
        // Get enrichment
        enrichmentResult = await sources.perplexity.enrich(enrichmentQuery, {
          timeout: timeoutMs * 2, // Allow more time for enrichment
        });
        
        // Enhance products with enrichment data
        if (sources.perplexity.enhanceProducts) {
          enrichedProducts = sources.perplexity.enhanceProducts(mergedProducts, enrichmentResult);
        }
      } catch (error) {
        logger.warn({ error, query }, 'Enrichment failed, continuing with base results');
      }
    }
    
    const latency = Date.now() - startTime;
    
    logger.info(
      { query, latency, productCount: enrichedProducts.length, sourceCount: searchResults.length },
      'Multi-source search completed'
    );
    
    // Prepare final result
    const result: MultiSourceSearchResult = {
      products: enrichedProducts,
      totalCount: enrichedProducts.length,
      sources: searchResults.map(r => ({
        id: r.source,
        name: r.sourceDisplayName || r.source,
        count: r.products?.length || 0,
        latency: r.latency || 0,
        error: r.error,
      })),
      enrichment: enrichmentResult,
      latency,
      timestamp: Date.now(),
    };
    
    // Cache result if caching is enabled
    if (!no_cache) {
      cache.set(cacheKey, result);
    }
    
    endMeasurement('multi_source_search');
    return result;
  } catch (error) {
    logger.error({ error, query }, 'Multi-source search failed');
    endMeasurement('multi_source_search');
    throw handleError(error, 'MSS');
  }
}

/**
 * Execute search promises sequentially
 * 
 * @param promises - Array of search promises
 * @returns Array of search results
 */
async function sequentialSearch(promises: Promise<ProductSearchResult>[]): Promise<ProductSearchResult[]> {
  const results: ProductSearchResult[] = [];
  
  for (const promise of promises) {
    try {
      const result = await promise;
      results.push(result);
    } catch (error) {
      logger.error({ error }, 'Sequential search failed for a source');
    }
  }
  
  return results;
}

/**
 * Initialize the MCP server
 */
async function main() {
  // Create the server
  const server = new Server({
    name: 'multi-source-server',
    version: '0.1.0',
  });
  
  // Add tool for multi-source search
  server.tool(
    'multi_source_search',
    'Search for products across multiple sources',
    z.object({
      query: z.string().describe('Search query'),
      sources: z
        .array(z.string())
        .optional()
        .describe('IDs of sources to search'),
      parallel: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to search sources in parallel'),
      merge_strategy: z
        .enum(['interleave', 'sequential', 'priority'])
        .optional()
        .default('interleave')
        .describe('Strategy for merging results from multiple sources'),
      max_results: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(10)
        .describe('Maximum number of results to return'),
      max_parallel: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .default(3)
        .describe('Maximum number of parallel searches'),
      timeout_ms: z
        .number()
        .int()
        .min(100)
        .max(5000)
        .optional()
        .default(800)
        .describe('Timeout in milliseconds'),
      fallback_on_timeout: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to fallback to available results on timeout'),
      results_per_source: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .default(3)
        .describe('Number of results to request from each source'),
      include_enrichment: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to include enrichment data'),
      filters: z
        .record(z.any())
        .optional()
        .describe('Filters to apply to the search'),
      no_cache: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, bypasses cache and performs a fresh search'),
    }),
    async (args) => {
      try {
        // Perform multi-source search
        const results = await multiSourceSearch(args.query, {
          sources: args.sources,
          parallel: args.parallel,
          mergeStrategy: args.merge_strategy,
          maxResults: args.max_results,
          maxParallel: args.max_parallel,
          timeoutMs: args.timeout_ms,
          fallbackOnTimeout: args.fallback_on_timeout,
          resultsPerSource: args.results_per_source,
          includeEnrichment: args.include_enrichment,
          filters: args.filters,
          no_cache: args.no_cache,
        });
        
        return {
          products: results.products,
          totalCount: results.totalCount,
          sources: results.sources,
          enrichment: results.enrichment,
          latency: results.latency,
        };
      } catch (error) {
        logger.error({ error }, 'Error in multi_source_search tool');
        throw error;
      }
    }
  );
  
  // Set up transport and start the server
  const transport = new StdioServerTransport();
  server.connect(transport);
  
  logger.info('Multi-source MCP server started');
}

// Start the server
main().catch((error) => {
  logger.error({ error }, 'Failed to start multi-source MCP server');
  process.exit(1);
});

// Export for testing
export { multiSourceSearch, mergeResults };
