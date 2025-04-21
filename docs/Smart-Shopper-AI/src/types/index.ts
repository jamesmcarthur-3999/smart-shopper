/**
 * Smart Shopper AI - Core Types
 * 
 * This file contains the core TypeScript type definitions used across the application.
 */

/**
 * Product model representing a shopping item
 */
export interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  currency?: string;
  description?: string;
  brand?: string;
  category?: string;
  images: string[];
  thumbnail: string;
  link: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  shipping?: string;
  seller?: string;
  source: string;
  sourceId: string;
  attributes?: Record<string, string | number | boolean>;
  timestamp: number;
}

/**
 * Search filters for product queries
 */
export interface SearchFilters {
  price?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string | string[];
  category?: string | string[];
  rating?: number;
  inStock?: boolean;
  freeShipping?: boolean;
  discount?: boolean;
  [key: string]: any;
}

/**
 * Search facets for product queries
 */
export type SearchFacets = string[];

/**
 * Boost parameters for search relevance
 */
export interface BoostParams {
  field: string;
  factor: number;
}

/**
 * Pagination parameters for search queries
 */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
  page?: number;
}

/**
 * Base search query parameters
 */
export interface SearchQueryParams {
  q: string;
  filters?: SearchFilters;
  facets?: SearchFacets;
  boost?: BoostParams;
  pagination?: PaginationParams;
}

/**
 * Search results including products and metadata
 */
export interface SearchResults {
  products: Product[];
  totalCount: number;
  facets?: Record<string, any>;
  nextCursor?: string;
  source: string;
  latency: number;
  timestamp: number;
}

/**
 * SerpAPI specific search parameters
 */
export interface SerpApiParams extends SearchQueryParams {
  fields?: string;
  no_cache?: boolean;
}

/**
 * Search1API specific search parameters
 */
export interface Search1ApiParams extends SearchQueryParams {
  // Add any Search1API-specific parameters here
}

/**
 * Perplexity specific search parameters
 */
export interface PerplexityParams {
  query: string;
  model?: string;
  context_size?: string;
  domain_filter?: string[];
  include_domains?: boolean;
}

/**
 * Product enrichment information from Perplexity
 */
export interface ProductEnrichment {
  productId: string;
  insights: string;
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  comparisons?: {
    productId: string;
    title: string;
    advantages: string[];
    disadvantages: string[];
  }[];
  citations: {
    url: string;
    title: string;
  }[];
}

/**
 * Error response format
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

/**
 * Multi-source search parameters
 */
export interface MultiSourceParams {
  query: string;
  sources?: string[];
  filters?: SearchFilters;
  limit?: number;
}
