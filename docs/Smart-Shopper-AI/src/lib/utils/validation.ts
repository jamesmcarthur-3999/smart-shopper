/**
 * Smart Shopper AI - Validation Utility
 * 
 * This file contains utilities for validating input parameters and ensuring
 * that they conform to the expected schemas.
 */

import Joi from 'joi';
import { createLogger } from './logger';
import { createErrorResponse } from './error-handler';
import { 
  SearchQueryParams, 
  SerpApiParams, 
  Search1ApiParams,
  PerplexityParams, 
  MultiSourceParams 
} from '../../types';

const logger = createLogger('validation');

/**
 * Create a validator function for the given schema
 * 
 * @param schema - The Joi schema to validate against
 * @param source - The error source for error reporting
 * @returns A validation function
 */
export function createValidator<T>(schema: Joi.ObjectSchema, source: string) {
  return (input: any): { value: T; error?: any } => {
    const { error, value } = schema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      logger.debug({ input, error: error.message }, 'Validation failed');
      return { 
        value: value as T,
        error: createErrorResponse(
          source as any,
          201, // Validation error code
          'Invalid input parameters',
          error.details
        )
      };
    }
    
    return { value: value as T };
  };
}

// Common schema components
const filtersSchema = Joi.object({
  price: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  brand: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  category: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  inStock: Joi.boolean().optional(),
  freeShipping: Joi.boolean().optional(),
  discount: Joi.boolean().optional(),
}).unknown(true);

const facetsSchema = Joi.array().items(Joi.string());

const boostSchema = Joi.object({
  field: Joi.string().required(),
  factor: Joi.number().min(0.1).max(10).required(),
});

const paginationSchema = Joi.object({
  cursor: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(50).default(10).optional(),
  page: Joi.number().integer().min(1).optional(),
});

// Basic search query schema
const searchQuerySchema = Joi.object({
  q: Joi.string().required(),
  filters: filtersSchema.optional(),
  facets: facetsSchema.optional(),
  boost: boostSchema.optional(),
  pagination: paginationSchema.optional(),
});

// SerpAPI schema
const serpApiSchema = searchQuerySchema.keys({
  fields: Joi.string().optional(),
  no_cache: Joi.boolean().default(false).optional(),
});

// Search1API schema (extending the basic search query)
const search1ApiSchema = searchQuerySchema.keys({
  // Add any Search1API-specific fields here
});

// Perplexity schema
const perplexitySchema = Joi.object({
  query: Joi.string().required(),
  model: Joi.string().valid(
    'sonar-small-online',
    'sonar-medium-online',
    'sonar-large-online'
  ).default('sonar-small-online').optional(),
  context_size: Joi.string().valid(
    'small',
    'medium',
    'large'
  ).default('medium').optional(),
  domain_filter: Joi.array().items(Joi.string()).optional(),
  include_domains: Joi.boolean().default(true).optional(),
});

// Multi-source schema
const multiSourceSchema = Joi.object({
  query: Joi.string().required(),
  sources: Joi.array().items(Joi.string()).optional(),
  filters: filtersSchema.optional(),
  limit: Joi.number().integer().min(1).max(50).default(10).optional(),
});

// Create validators
export const validateSearchQuery = createValidator<SearchQueryParams>(
  searchQuerySchema, 
  'API'
);

export const validateSerpApiParams = createValidator<SerpApiParams>(
  serpApiSchema, 
  'SRP'
);

export const validateSearch1ApiParams = createValidator<Search1ApiParams>(
  search1ApiSchema, 
  'SCH'
);

export const validatePerplexityParams = createValidator<PerplexityParams>(
  perplexitySchema, 
  'PPX'
);

export const validateMultiSourceParams = createValidator<MultiSourceParams>(
  multiSourceSchema, 
  'API'
);

export default {
  validateSearchQuery,
  validateSerpApiParams,
  validateSearch1ApiParams,
  validatePerplexityParams,
  validateMultiSourceParams,
};
