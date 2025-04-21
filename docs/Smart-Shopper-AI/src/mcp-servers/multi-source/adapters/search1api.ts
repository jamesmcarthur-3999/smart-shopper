/**
 * Search1API Adapter for Multi-Source Search
 * 
 * This adapter interfaces with the Search1API MCP server to standardize
 * product search results for the multi-source search tool.
 */

import axios from 'axios';
import { ProductSearchResult, Source, Facet } from '../../../types';
import { createLogger, tokenBucket } from '../../../lib/utils';
import { serializeError } from 'serialize-error';

const logger = createLogger('multi-source:search1api');

// Token bucket for rate limiting
const rateLimiter = tokenBucket('search1api', {
  maxTokens: 20,
  refillRate: 20, // tokens per minute
  refillInterval: 60000 / 20, // milliseconds per token
});

/**
 * Search for products using Search1API
 * 
 * @param query - Search query
 * @param options - Search options
 * @returns Promise resolving to product search results
 */
export async function search(
  query: string,
  options: {
    filters?: Record<string, any>;
    facets?: string[];
    boost?: { field: string; factor: number };
    cursor?: string;
    limit?: number;
    timeout?: number;
  } = {}
): Promise<ProductSearchResult> {
  const {
    filters = {},
    facets = ['brand', 'category', 'price_range', 'rating'],
    boost = { field: 'rating', factor: 1.2 },
    cursor,
    limit = 10,
    timeout = 800,
  } = options;

  // Check rate limit
  if (!await rateLimiter.consume(1)) {
    logger.warn({ query }, 'Search1API search rate limit exceeded');
    throw new Error('RATE_LIMIT_EXCEEDED:Search1API search rate limit exceeded');
  }

  try {
    logger.info({ query }, 'Searching Search1API');
    
    // Prepare parameters
    const params = {
      q: query,
      filters,
      facets,
      boost,
      cursor,
      limit,
    };

    // Call the Search1API MCP server
    const response = await axios.post('http://localhost:3002/tool/search1_query', params, {
      timeout,
    });

    // Extract and standardize products
    const products = (response.data.products || []).map((product: any) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail || (product.images && product.images.length > 0 ? product.images[0] : ''),
      link: product.link,
      description: product.description || '',
      rating: product.rating,
      reviewCount: product.reviewCount,
      brand: product.brand || '',
      source: 'search1api',
      sourceId: product.sourceId || product.id,
      facets: prepareFacets(product.attributes || {}),
    }));

    logger.info(
      { query, productCount: products.length, latency: response.data.latency },
      'Search1API search completed'
    );

    return {
      products,
      totalCount: response.data.totalCount || products.length,
      facets: response.data.facets || {},
      source: 'search1api',
      sourceDisplayName: 'Smart Shopper Index',
      latency: response.data.latency || 0,
      cursor: response.data.cursor,
    };
  } catch (error) {
    const serializedError = serializeError(error);
    logger.error({ error: serializedError, query }, 'Search1API search failed');
    
    // Return empty result with error information
    return {
      products: [],
      totalCount: 0,
      facets: {},
      source: 'search1api',
      sourceDisplayName: 'Smart Shopper Index',
      latency: 0,
      error: {
        message: serializedError.message || 'Unknown error',
        code: (error as any).code || 'UNKNOWN',
        source: 'search1api',
      },
    };
  }
}

/**
 * Prepare product attributes as facets
 * 
 * @param attributes - Product attributes
 * @returns Facets object
 */
function prepareFacets(attributes: Record<string, any>): Record<string, Facet[]> {
  const result: Record<string, Facet[]> = {};
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    
    // Handle array values
    if (Array.isArray(value)) {
      result[key] = value.map(v => ({
        value: v,
        count: 1,
        label: String(v),
      }));
    } 
    // Handle scalar values
    else {
      result[key] = [{
        value: value,
        count: 1,
        label: String(value),
      }];
    }
  });
  
  return result;
}

/**
 * Source definition for Search1API
 */
export const source: Source = {
  id: 'search1api',
  name: 'Smart Shopper Index',
  search,
  priority: 2,
};

export default source;
