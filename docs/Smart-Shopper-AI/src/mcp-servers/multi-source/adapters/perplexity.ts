/**
 * Perplexity Adapter for Multi-Source Search
 * 
 * This adapter interfaces with the Perplexity MCP server to provide
 * product data enrichment and citations for the multi-source search tool.
 */

import axios from 'axios';
import { EnrichmentResult, Source, Citation } from '../../../types';
import { createLogger, tokenBucket } from '../../../lib/utils';
import { serializeError } from 'serialize-error';

const logger = createLogger('multi-source:perplexity');

// Token bucket for rate limiting
const rateLimiter = tokenBucket('perplexity', {
  maxTokens: 5,
  refillRate: 5, // tokens per minute
  refillInterval: 60000 / 5, // milliseconds per token
});

/**
 * Enrich product data using Perplexity
 * 
 * @param query - Enrichment query
 * @param options - Enrichment options
 * @returns Promise resolving to enrichment result
 */
export async function enrich(
  query: string,
  options: {
    model?: string;
    context_size?: string;
    domain_filter?: string[];
    no_cache?: boolean;
    timeout?: number;
  } = {}
): Promise<EnrichmentResult> {
  const {
    model = 'sonar-small-online',
    context_size = 'medium',
    domain_filter,
    no_cache = false,
    timeout = 1500, // Longer timeout for enrichment
  } = options;

  // Check rate limit
  if (!await rateLimiter.consume(1)) {
    logger.warn({ query }, 'Perplexity enrichment rate limit exceeded');
    throw new Error('RATE_LIMIT_EXCEEDED:Perplexity enrichment rate limit exceeded');
  }

  try {
    logger.info({ query, model }, 'Enriching with Perplexity');
    
    // Prepare parameters
    const params = {
      query,
      model,
      context_size,
      domain_filter,
      no_cache,
    };

    // Call the Perplexity MCP server
    const response = await axios.post('http://localhost:3003/tool/perplexity_search', params, {
      timeout,
    });

    logger.info(
      { query, latency: response.data.latency, citationCount: response.data.citations?.length || 0 },
      'Perplexity enrichment completed'
    );

    return {
      content: response.data.content || '',
      citations: response.data.citations || [],
      model: response.data.model || model,
      latency: response.data.latency || 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    const serializedError = serializeError(error);
    logger.error({ error: serializedError, query }, 'Perplexity enrichment failed');
    
    // Return empty result with error information
    return {
      content: '',
      citations: [],
      model,
      latency: 0,
      timestamp: Date.now(),
      error: {
        message: serializedError.message || 'Unknown error',
        code: (error as any).code || 'UNKNOWN',
        source: 'perplexity',
      },
    };
  }
}

/**
 * Enhance product data with enrichment information
 * 
 * @param products - Product data to enhance
 * @param enrichment - Enrichment information
 * @returns Enhanced product data
 */
export function enhanceProducts(products: any[], enrichment: EnrichmentResult): any[] {
  if (!enrichment.content || products.length === 0) {
    return products;
  }

  // Simple enhancement adding content to the first product's description
  // In a real implementation, this would do more sophisticated parsing and matching
  const enhancedProducts = [...products];
  
  if (enhancedProducts[0]) {
    enhancedProducts[0] = {
      ...enhancedProducts[0],
      description: enrichment.content,
      enriched: true,
      citations: enrichment.citations || [],
    };
  }
  
  return enhancedProducts;
}

/**
 * Source definition for Perplexity
 */
export const source: Source = {
  id: 'perplexity',
  name: 'Product Enrichment',
  enrich,
  enhanceProducts,
  priority: 3,
};

export default source;
