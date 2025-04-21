/**
 * SerpAPI Adapter for Multi-Source Search
 * 
 * This adapter interfaces with the SerpAPI MCP server to standardize
 * product search results for the multi-source search tool.
 */

import axios from 'axios';
import { ProductSearchResult, Source } from '../../../types';
import { createLogger, tokenBucket } from '../../../lib/utils';
import { serializeError } from 'serialize-error';

const logger = createLogger('multi-source:serpapi');

// Token bucket for rate limiting
const rateLimiter = tokenBucket('serpapi', {
  maxTokens: 10,
  refillRate: 10, // tokens per minute
  refillInterval: 60000 / 10, // milliseconds per token
});

/**
 * Search for products using SerpAPI
 * 
 * @param query - Search query
 * @param options - Search options
 * @returns Promise resolving to product search results
 */
export async function search(
  query: string,
  options: {
    num_results?: number;
    fields?: string;
    no_cache?: boolean;
    filters?: Record<string, any>;
    timeout?: number;
  } = {}
): Promise<ProductSearchResult> {
  const {
    num_results = 5,
    fields = 'shopping_results.price,title,thumbnail,link,source,reviews,rating',
    no_cache = false,
    filters = {},
    timeout = 800,
  } = options;

  // Check rate limit
  if (!await rateLimiter.consume(1)) {
    logger.warn({ query }, 'SerpAPI search rate limit exceeded');
    throw new Error('RATE_LIMIT_EXCEEDED:SerpAPI search rate limit exceeded');
  }

  try {
    logger.info({ query }, 'Searching SerpAPI');
    
    // Prepare parameters
    const params = {
      query,
      num_results,
      fields,
      no_cache,
      ...filters,
    };

    // Call the SerpAPI MCP server
    const response = await axios.post('http://localhost:3001/tool/serpapi_search', params, {
      timeout,
    });

    // Extract and standardize products
    const products = (response.data.products || []).map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      link: product.link,
      description: product.description || '',
      rating: product.rating,
      reviewCount: product.reviewCount,
      brand: product.brand || product.seller || '',
      source: 'serpapi',
      sourceId: product.sourceId || product.id,
    }));

    logger.info(
      { query, productCount: products.length, latency: response.data.latency },
      'SerpAPI search completed'
    );

    return {
      products,
      totalCount: response.data.totalCount || products.length,
      source: 'serpapi',
      sourceDisplayName: 'Google Shopping',
      latency: response.data.latency || 0,
    };
  } catch (error) {
    const serializedError = serializeError(error);
    logger.error({ error: serializedError, query }, 'SerpAPI search failed');
    
    // Return empty result with error information
    return {
      products: [],
      totalCount: 0,
      source: 'serpapi',
      sourceDisplayName: 'Google Shopping',
      latency: 0,
      error: {
        message: serializedError.message || 'Unknown error',
        code: (error as any).code || 'UNKNOWN',
        source: 'serpapi',
      },
    };
  }
}

/**
 * Source definition for SerpAPI
 */
export const source: Source = {
  id: 'serpapi',
  name: 'Google Shopping',
  search,
  priority: 1,
};

export default source;
