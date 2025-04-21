/**
 * Type definitions for Smart Shopper AI
 */

// Product and Search Types

/**
 * Product data structure
 */
export interface Product {
  /** Unique identifier */
  id: string;
  
  /** Product title */
  title: string;
  
  /** Formatted price (e.g. "$19.99") */
  price: string;
  
  /** Original price before discount (if any) */
  originalPrice?: string;
  
  /** Currency symbol */
  currency?: string;
  
  /** Product description */
  description?: string;
  
  /** Brand or manufacturer */
  brand?: string;
  
  /** Array of image URLs */
  images?: string[];
  
  /** Thumbnail image URL */
  thumbnail?: string;
  
  /** Product URL */
  link?: string;
  
  /** Rating (0-5) */
  rating?: number;
  
  /** Number of reviews */
  reviewCount?: number;
  
  /** Whether the product is in stock */
  inStock?: boolean;
  
  /** Shipping information */
  shipping?: string;
  
  /** Seller or store name */
  seller?: string;
  
  /** Data source identifier */
  source: string;
  
  /** Source-specific ID */
  sourceId: string;
  
  /** Additional attributes */
  attributes?: Record<string, any>;
  
  /** Timestamp of retrieval */
  timestamp: number;
}

/**
 * Facet value with count
 */
export interface Facet {
  /** Facet value */
  value: string | number | boolean;
  
  /** Count of items with this facet value */
  count: number;
  
  /** Display label */
  label: string;
}

/**
 * Search results from a single source
 */
export interface SearchResults {
  /** Array of product results */
  products: Product[];
  
  /** Total count of matching products */
  totalCount: number;
  
  /** Facets for filtering */
  facets?: Record<string, Facet[]>;
  
  /** Data source identifier */
  source: string;
  
  /** Search latency in milliseconds */
  latency: number;
  
  /** Pagination cursor */
  cursor?: string;
  
  /** Timestamp of search */
  timestamp: number;
}

/**
 * Search parameters for SerpAPI
 */
export interface SerpApiParams {
  /** Search query */
  q: string;
  
  /** Fields to return */
  fields?: string;
  
  /** Skip cache */
  no_cache?: boolean;
  
  /** Filters to apply */
  filters?: Record<string, any>;
}

/**
 * Search parameters for Search1API
 */
export interface Search1Params {
  /** Search query */
  q: string;
  
  /** Filters to apply */
  filters?: Record<string, any>;
  
  /** Facets to return */
  facets?: string[];
  
  /** Boost parameters */
  boost?: {
    field: string;
    factor: number;
  };
  
  /** Pagination cursor */
  cursor?: string;
  
  /** Results limit */
  limit?: number;
}

// Enrichment Types

/**
 * Citation information
 */
export interface Citation {
  /** Citation ID */
  id: string;
  
  /** Source title */
  title: string;
  
  /** Source URL */
  url: string;
  
  /** Text snippet */
  snippet?: string;
  
  /** Source domain */
  domain: string;
  
  /** Timestamp of retrieval */
  timestamp: number;
}

/**
 * Enrichment result
 */
export interface EnrichmentResult {
  /** Enrichment content */
  content: string;
  
  /** Citations */
  citations: Citation[];
  
  /** Model used */
  model: string;
  
  /** Latency in milliseconds */
  latency: number;
  
  /** Timestamp of enrichment */
  timestamp: number;
  
  /** Error information if any */
  error?: {
    message: string;
    code: string;
    source: string;
  };
}

// Multi-Source Search Types

/**
 * Product search result from a single source
 */
export interface ProductSearchResult {
  /** Product results */
  products: any[];
  
  /** Total count */
  totalCount: number;
  
  /** Facets if available */
  facets?: Record<string, Facet[]>;
  
  /** Source identifier */
  source: string;
  
  /** Source display name */
  sourceDisplayName?: string;
  
  /** Search latency */
  latency: number;
  
  /** Pagination cursor */
  cursor?: string;
  
  /** Error information if any */
  error?: {
    message: string;
    code: string;
    source: string;
  };
}

/**
 * Source metadata in multi-source results
 */
export interface SourceInfo {
  /** Source identifier */
  id: string;
  
  /** Source display name */
  name: string;
  
  /** Count of results from this source */
  count: number;
  
  /** Source latency */
  latency: number;
  
  /** Error information if any */
  error?: {
    message: string;
    code: string;
    source: string;
  };
}

/**
 * Combined multi-source search result
 */
export interface MultiSourceSearchResult {
  /** Merged product results */
  products: any[];
  
  /** Total count */
  totalCount: number;
  
  /** Source information */
  sources: SourceInfo[];
  
  /** Enrichment data if available */
  enrichment?: EnrichmentResult | null;
  
  /** Overall latency */
  latency: number;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Source definition interface
 */
export interface Source {
  /** Source identifier */
  id: string;
  
  /** Source display name */
  name: string;
  
  /** Priority (lower is higher priority) */
  priority: number;
  
  /** Search function */
  search?: (query: string, options?: any) => Promise<ProductSearchResult>;
  
  /** Enrichment function */
  enrich?: (query: string, options?: any) => Promise<EnrichmentResult>;
  
  /** Product enhancement function */
  enhanceProducts?: (products: any[], enrichment: EnrichmentResult) => any[];
}

// Canvas Operation Types

/**
 * Canvas operation error
 */
export interface CanvasOpError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Operation ID that failed */
  opId: string;
}

/**
 * Canvas operation result
 */
export interface CanvasOpResult {
  /** Success flag */
  success: boolean;
  
  /** Operation ID */
  opId: string;
  
  /** Error information if failed */
  error?: CanvasOpError;
  
  /** Result data if any */
  data?: any;
}
