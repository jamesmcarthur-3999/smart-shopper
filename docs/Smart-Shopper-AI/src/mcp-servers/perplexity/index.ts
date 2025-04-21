/**
 * Smart Shopper AI - Perplexity MCP Server
 * 
 * This file implements the Model Context Protocol server for Perplexity,
 * which provides product data enrichment and citations.
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
import { EnrichmentResult, Citation } from '../../types';

// Load environment variables
dotenv.config();

const logger = createLogger('perplexity-server');
const cache = new Cache<EnrichmentResult>('perplexity', { ttl: 3600 }); // Cache for 1 hour

// API key from environment
const API_KEY = process.env.PPLX_API_KEY;
const BASE_URL = 'https://api.perplexity.ai';

// Check if API key is available
if (!API_KEY) {
  logger.error('PPLX_API_KEY environment variable is not set');
  process.exit(1);
}

/**
 * Generates citations from Perplexity response
 * 
 * @param data - The Perplexity response data
 * @returns Array of citations
 */
function extractCitations(data: any): Citation[] {
  if (!data.references || !Array.isArray(data.references)) {
    return [];
  }

  return data.references.map((ref: any, index: number) => ({
    id: `perplexity-citation-${index}`,
    title: ref.title || 'Unknown Source',
    url: ref.url || '',
    snippet: ref.snippet || '',
    domain: extractDomain(ref.url || ''),
    timestamp: Date.now(),
  }));
}

/**
 * Extract domain from URL
 * 
 * @param url - URL to extract domain from
 * @returns Domain string
 */
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.startsWith('www.') ? domain.substring(4) : domain;
  } catch (e) {
    return '';
  }
}

/**
 * Enriches product data using Perplexity
 * 
 * @param query - The enrichment query
 * @param options - Additional options
 * @returns Enrichment result
 */
async function enrichProductData(
  query: string,
  options: {
    model?: string;
    contextSize?: string;
    domainFilter?: string[];
    noCache?: boolean;
  } = {}
): Promise<EnrichmentResult> {
  const { 
    model = 'sonar-small-online', 
    contextSize = 'medium', 
    domainFilter, 
    noCache = false 
  } = options;

  // Start measuring performance
  startMeasurement('perplexity_search', PERFORMANCE_BUDGETS.TOOL_CALL);

  try {
    // Generate cache key
    const cacheKey = `perplexity-${query}-${model}-${contextSize}-${JSON.stringify(domainFilter || [])}`;
    
    // Check cache if not explicitly disabled
    if (!noCache && cache.has(cacheKey)) {
      logger.info({ query }, 'Returning cached Perplexity results');
      const cachedResults = cache.get(cacheKey);
      endMeasurement('perplexity_search');
      return cachedResults as EnrichmentResult;
    }

    logger.info({ query, model }, 'Querying Perplexity');

    // Prepare request payload
    const payload = {
      model,
      query,
      search_focus: "internet",
      max_sources: 10,
      context_size: contextSize,
      ...(domainFilter && domainFilter.length > 0 ? { domain_filter: domainFilter } : {})
    };

    // Make API call
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/query`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    const latency = Date.now() - startTime;

    // Extract citations and content
    const citations = extractCitations(response.data);
    
    logger.info(
      { query, latency, citationCount: citations.length },
      'Perplexity enrichment completed'
    );

    // Prepare result
    const result: EnrichmentResult = {
      content: response.data.text || '',
      citations,
      model,
      latency,
      timestamp: Date.now(),
    };

    // Cache result if caching is enabled
    if (!noCache) {
      cache.set(cacheKey, result);
    }

    endMeasurement('perplexity_search');
    return result;
  } catch (error) {
    logger.error({ error, query }, 'Perplexity enrichment failed');
    endMeasurement('perplexity_search');
    throw handleError(error, 'PPL');
  }
}

/**
 * Initialize the MCP server
 */
async function main() {
  // Create the server
  const server = new Server({
    name: 'perplexity-server',
    version: '0.1.0',
  });

  // Add tool for product enrichment
  server.tool(
    'perplexity_search',
    'Enrich product data and provide citations',
    z.object({
      query: z.string().describe('Search query for product enrichment'),
      model: z
        .enum(['sonar-small-online', 'sonar-medium-online', 'sonar-large-online'])
        .optional()
        .default('sonar-small-online')
        .describe('Perplexity model to use'),
      context_size: z
        .enum(['small', 'medium', 'large'])
        .optional()
        .default('medium')
        .describe('Amount of context to use'),
      domain_filter: z
        .array(z.string())
        .optional()
        .describe('Domains to filter results to'),
      no_cache: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, bypasses cache and performs a fresh search'),
    }),
    async (args) => {
      try {
        // Enrich product data
        const result = await enrichProductData(args.query, {
          model: args.model,
          contextSize: args.context_size,
          domainFilter: args.domain_filter,
          noCache: args.no_cache,
        });

        return {
          content: result.content,
          citations: result.citations,
          model: result.model,
          latency: result.latency,
        };
      } catch (error) {
        logger.error({ error }, 'Error in perplexity_search tool');
        throw error;
      }
    }
  );

  // Set up transport and start the server
  const transport = new StdioServerTransport();
  server.connect(transport);

  logger.info('Perplexity MCP server started');
}

// Start the server
main().catch((error) => {
  logger.error({ error }, 'Failed to start Perplexity MCP server');
  process.exit(1);
});

// Export for testing
export { enrichProductData, extractCitations };
