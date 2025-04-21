/**
 * Smart Shopper AI - Search1API MCP Server
 * 
 * This file implements the Model Context Protocol server for Search1API,
 * which provides Elastic product index querying capabilities.
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
  PERFORMANCE_BUDGETS
} from '../../lib/utils';
import { Search1Params, SearchResults, Product, Facet } from '../../types';

// Load environment variables
dotenv.config();

const logger = createLogger('search1api-server');
const cache = new Cache<SearchResults>('search1api', { ttl: 300 }); // Cache for 5 minutes

// API key from environment
const API_KEY = process.env.SEARCH1_API_KEY;
const BASE_URL = 'https://api.search1api.com/v1';

// Check if API key is available
if (!API_KEY) {
  logger.error('SEARCH1_API_KEY environment variable is not set');
  process.exit(1);
}

/**
 * Converts filter object to Search1API filter parameters
 * 
 * @param filters - Filter object
 * @returns Filter parameters for Search1API
 */
function buildFilterParams(filters: Record<string, any> = {}): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Process each filter
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    
    // Handle special case for price ranges
    if (key === 'price' && typeof value === 'string') {
      // Parse price ranges like "<200" or "100-300"
      if (value.startsWith('<')) {
        result['price_max'] = value.substring(1);
      } else if (value.startsWith('>')) {
        result['price_min'] = value.substring(1);
      } else if (value.includes('-')) {
        const [min, max] = value.split('-');
        result['price_min'] = min;
        result['price_max'] = max;
      } else {
        result[key] = value;
      }
    } 
    // Handle arrays (multi-select filters)
    else if (Array.isArray(value)) {
      result[key] = value.join(',');
    } 
    // Handle regular values
    else {
      result[key] = String(value);
    }
  });
  
  return result;
}

/**
 * Transforms Search1API response to our standard SearchResults format
 * 
 * @param data - The Search1API response data
 * @param query - The original search query
 * @param latency - The latency of the API call
 * @returns Standardized search results
 */
function transformResults(data: any, query: string, latency: number): SearchResults {
  const items = data.items || [];
  
  // Transform products
  const products: Product[] = items.map((item: any, index: number) => ({
    id: item.id || `search1-${Date.now()}-${index}`,
    title: item.title || '',
    price: item.price ? `$${item.price}` : '',
    originalPrice: item.original_price ? `$${item.original_price}` : undefined,
    currency: '$', // Assuming USD
    description: item.description || '',
    brand: item.brand || '',
    images: item.images || [],
    thumbnail: item.thumbnail || (item.images && item.images.length > 0 ? item.images[0] : ''),
    link: item.url || '',
    rating: item.rating || undefined,
    reviewCount: item.review_count || undefined,
    inStock: item.in_stock !== false,
    shipping: item.shipping || '',
    seller: item.seller || '',
    source: 'Search1API',
    sourceId: `search1-${item.id || index}`,
    attributes: item.attributes || {},
    timestamp: Date.now(),
  }));
  
  // Transform facets
  const facets: Record<string, Facet[]> = {};
  if (data.facets) {
    Object.entries(data.facets).forEach(([key, values]: [string, any]) => {
      if (Array.isArray(values)) {
        facets[key] = values.map((value: any) => ({
          value: value.value,
          count: value.count,
          label: value.label || value.value,
        }));
      }
    });
  }
  
  return {
    products,
    totalCount: data.total_count || products.length,
    facets,
    source: 'Search1API',
    latency,
    cursor: data.next_cursor,
    timestamp: Date.now(),
  };
}

/**
 * Searches for products using Search1API
 * 
 * @param params - Search parameters
 * @returns Search results
 */
async function searchProducts(params: Search1Params): Promise<SearchResults> {
  const { q, filters = {}, facets = [], boost, cursor, limit = 10 } = params;
  
  // Start measuring performance
  startMeasurement('search1_query', PERFORMANCE_BUDGETS.TOOL_CALL);
  
  try {
    // Generate cache key
    const cacheKey = `search1-${q}-${JSON.stringify(params)}`;
    
    // Check cache if cursor is not specified (first page)
    if (!cursor && cache.has(cacheKey)) {
      logger.info({ query: q }, 'Returning cached Search1API results');
      const cachedResults = cache.get(cacheKey);
      endMeasurement('search1_query');
      return cachedResults as SearchResults;
    }
    
    // Build query parameters
    const queryParams: Record<string, string> = {
      q,
      limit: String(limit),
    };
    
    // Add cursor for pagination if specified
    if (cursor) {
      queryParams.cursor = cursor;
    }
    
    // Add facets if specified
    if (facets.length > 0) {
      queryParams.facets = facets.join(',');
    }
    
    // Add boost if specified
    if (boost) {
      queryParams.boost_field = boost.field;
      queryParams.boost_factor = String(boost.factor);
    }
    
    // Add filters
    const filterParams = buildFilterParams(filters);
    Object.assign(queryParams, filterParams);
    
    logger.info({ query: q }, 'Searching Search1API');
    
    // Make API call
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/search`, {
      params: queryParams,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    const latency = Date.now() - startTime;
    
    logger.info(
      { query: q, latency, resultCount: response.data.items?.length || 0 },
      'Search1API search completed'
    );
    
    // Transform results
    const results = transformResults(response.data, q, latency);
    
    // Cache results if not a pagination request
    if (!cursor) {
      cache.set(cacheKey, results);
    }
    
    endMeasurement('search1_query');
    return results;
  } catch (error) {
    logger.error({ error, query: q }, 'Search1API search failed');
    endMeasurement('search1_query');
    throw handleError(error, 'S1A');
  }
}

/**
 * Initialize the MCP server
 */
async function main() {
  // Create the server
  const server = new Server({
    name: 'search1api-server',
    version: '0.1.0',
  });
  
  // Add tool for product search
  server.tool(
    'search1_query',
    'Query the elastic product index',
    z.object({
      q: z.string().describe('Search query'),
      filters: z
        .record(z.any())
        .optional()
        .describe('Filters to apply to the search'),
      facets: z
        .array(z.string())
        .optional()
        .describe('Facets to return with the search results'),
      boost: z
        .object({
          field: z.string().describe('Field to boost'),
          factor: z
            .number()
            .min(0.1)
            .max(10)
            .describe('Boost factor'),
        })
        .optional()
        .describe('Boost parameters for relevance scoring'),
      cursor: z
        .string()
        .optional()
        .describe('Cursor for pagination'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .default(10)
        .describe('Maximum number of results to return'),
    }),
    async (args) => {
      try {
        // Search products
        const results = await searchProducts({
          q: args.q,
          filters: args.filters,
          facets: args.facets,
          boost: args.boost,
          cursor: args.cursor,
          limit: args.limit,
        });
        
        return {
          products: results.products,
          totalCount: results.totalCount,
          facets: results.facets,
          source: results.source,
          latency: results.latency,
          cursor: results.cursor,
        };
      } catch (error) {
        logger.error({ error }, 'Error in search1_query tool');
        throw error;
      }
    }
  );
  
  // Set up transport and start the server
  const transport = new StdioServerTransport();
  server.connect(transport);
  
  logger.info('Search1API MCP server started');
}

// Start the server
main().catch((error) => {
  logger.error({ error }, 'Failed to start Search1API MCP server');
  process.exit(1);
});

// Export for testing
export { searchProducts, transformResults, buildFilterParams };
