/**
 * Smart Shopper AI - SerpAPI MCP Server
 * 
 * This file implements the Model Context Protocol server for SerpAPI,
 * which provides product search results from Google Shopping.
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { z } from 'zod';
import axios from 'axios';
import dotenv from 'dotenv';

import { 
  createLogger, 
  Cache, 
  handleError,
  startMeasurement,
  endMeasurement,
  PERFORMANCE_BUDGETS,
  validateSerpApiParams
} from '../../lib/utils';
import { SerpApiParams, SearchResults, Product } from '../../types';

// Load environment variables
dotenv.config();

const logger = createLogger('serpapi-server');
const cache = new Cache<SearchResults>('serpapi', { ttl: 600 }); // Cache for 10 minutes

// API key from environment
const API_KEY = process.env.SERPAPI_API_KEY;
const BASE_URL = 'https://serpapi.com/search';

// Check if API key is available
if (!API_KEY) {
  logger.error('SERPAPI_API_KEY environment variable is not set');
  process.exit(1);
}

/**
 * Transforms SerpAPI response to our standard SearchResults format
 * 
 * @param data - The SerpAPI response data
 * @param query - The original search query
 * @param latency - The latency of the API call
 * @returns Standardized search results
 */
function transformResults(data: any, query: string, latency: number): SearchResults {
  const shoppingResults = data.shopping_results || [];
  
  // Transform products
  const products: Product[] = shoppingResults.map((item: any, index: number) => ({
    id: `serpapi-${Date.now()}-${index}`,
    title: item.title || '',
    price: item.price || '',
    originalPrice: item.extracted_price ? `$${item.extracted_price}` : undefined,
    currency: item.price ? item.price.charAt(0) : '$',
    description: item.snippet || '',
    brand: item.source || '',
    images: [item.thumbnail || ''],
    thumbnail: item.thumbnail || '',
    link: item.link || '',
    rating: item.rating ? parseFloat(item.rating) : undefined,
    reviewCount: item.reviews ? parseInt(item.reviews.replace(/,/g, ''), 10) : undefined,
    inStock: item.in_stock !== false,
    shipping: item.shipping || '',
    seller: item.source || '',
    source: 'SerpAPI',
    sourceId: item.position ? `serpapi-${item.position}` : `serpapi-${index}`,
    attributes: {
      position: item.position || index,
    },
    timestamp: Date.now(),
  }));
  
  return {
    products,
    totalCount: data.shopping_results_count || products.length,
    facets: {}, // SerpAPI doesn't return facets
    source: 'SerpAPI',
    latency,
    timestamp: Date.now(),
  };
}

/**
 * Searches for products using SerpAPI
 * 
 * @param params - Search parameters
 * @returns Search results
 */
async function searchProducts(params: SerpApiParams): Promise<SearchResults> {
  const { q, fields, no_cache = false } = params;
  
  // Start measuring performance
  startMeasurement('serpapi_search', PERFORMANCE_BUDGETS.TOOL_CALL);
  
  try {
    // Generate cache key
    const cacheKey = `serpapi-${q}-${JSON.stringify(params)}`;
    
    // Check cache if not explicitly disabled
    if (!no_cache && cache.has(cacheKey)) {
      logger.info({ query: q }, 'Returning cached SerpAPI results');
      const cachedResults = cache.get(cacheKey);
      endMeasurement('serpapi_search');
      return cachedResults as SearchResults;
    }
    
    // Build SerpAPI query parameters
    const queryParams = new URLSearchParams({
      q,
      engine: 'google_shopping',
      api_key: API_KEY,
      no_cache: String(no_cache),
    });
    
    // Add fields if specified
    if (fields) {
      queryParams.append('fields', fields);
    }
    
    // Extract filters from params
    if (params.filters) {
      if (params.filters.minPrice) {
        queryParams.append('price_min', params.filters.minPrice.toString());
      }
      if (params.filters.maxPrice) {
        queryParams.append('price_max', params.filters.maxPrice.toString());
      }
      // Add other filters as needed
    }
    
    logger.info({ query: q }, 'Searching SerpAPI');
    
    // Make API call
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}?${queryParams.toString()}`);
    const latency = Date.now() - startTime;
    
    logger.info(
      { query: q, latency, resultCount: response.data.shopping_results?.length || 0 },
      'SerpAPI search completed'
    );
    
    // Transform results
    const results = transformResults(response.data, q, latency);
    
    // Cache results if caching is enabled
    if (!no_cache) {
      cache.set(cacheKey, results);
    }
    
    endMeasurement('serpapi_search');
    return results;
  } catch (error) {
    logger.error({ error, query: q }, 'SerpAPI search failed');
    endMeasurement('serpapi_search');
    throw handleError(error, 'SRP');
  }
}

/**
 * Initialize the MCP server
 */
async function main() {
  // Create the server
  const server = new Server({
    name: 'serpapi-server',
    version: '0.1.0',
  });
  
  // Add tool for product search
  server.tool(
    'serpapi_search',
    'Search for products using Google Shopping via SerpAPI',
    z.object({
      query: z.string().describe('Search query for products'),
      fields: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
      num_results: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .default(5)
        .describe('Number of results to return'),
      no_cache: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, bypasses cache and performs a fresh search'),
      filters: z
        .object({
          price: z.string().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          brand: z.union([z.string(), z.array(z.string())]).optional(),
          category: z.union([z.string(), z.array(z.string())]).optional(),
          inStock: z.boolean().optional(),
        })
        .optional()
        .describe('Filters to apply to the search'),
    }),
    async (args) => {
      try {
        // Validate parameters
        const { value, error } = validateSerpApiParams({
          q: args.query,
          fields: args.fields,
          no_cache: args.no_cache,
          filters: args.filters,
        });
        
        if (error) {
          throw error;
        }
        
        // Search products
        const results = await searchProducts(value);
        
        return {
          products: results.products.slice(0, args.num_results || 5),
          totalCount: results.totalCount,
          source: results.source,
          latency: results.latency,
        };
      } catch (error) {
        logger.error({ error }, 'Error in serpapi_search tool');
        throw error;
      }
    }
  );
  
  // Set up transport and start the server
  const transport = new StdioServerTransport();
  server.connect(transport);
  
  logger.info('SerpAPI MCP server started');
}

// Start the server
main().catch((error) => {
  logger.error({ error }, 'Failed to start SerpAPI MCP server');
  process.exit(1);
});

// Export for testing
export { searchProducts, transformResults };
