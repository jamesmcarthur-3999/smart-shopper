/**
 * Smart Shopper AI - Error Handler Utility
 * 
 * This file contains error handling utilities based on the project's error code documentation.
 */

import { ErrorResponse } from '../../types';
import logger from './logger';

// Error code prefixes
const ERROR_PREFIX = 'SS';
const SOURCE_PREFIXES = {
  API: 'API',
  SRP: 'SRP', // SerpAPI
  SCH: 'SCH', // Search1API
  PPX: 'PPX', // Perplexity
  CNV: 'CNV', // Canvas
  MCP: 'MCP', // MCP Server
};

// Error categories based on our error_codes.md
const ERROR_CATEGORIES = {
  CONFIG: { range: [100, 199], retry: false },
  VALIDATION: { range: [200, 299], retry: false },
  RATE_LIMIT: { range: [300, 399], retry: true },
  SERVICE: { range: [400, 499], retry: true },
  INTERNAL: { range: [500, 599], retry: true },
};

/**
 * Creates a standardized error code
 * 
 * @param source - The error source (e.g., API, SRP)
 * @param code - The numeric error code
 * @returns The formatted error code (e.g., SS-API-100)
 */
export function createErrorCode(source: keyof typeof SOURCE_PREFIXES, code: number): string {
  return `${ERROR_PREFIX}-${SOURCE_PREFIXES[source]}-${code}`;
}

/**
 * Determines if an error is retryable based on its code
 * 
 * @param errorCode - The error code to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(errorCode: string): boolean {
  const parts = errorCode.split('-');
  if (parts.length !== 3) {
    return false;
  }
  
  const code = parseInt(parts[2], 10);
  if (isNaN(code)) {
    return false;
  }
  
  for (const category of Object.values(ERROR_CATEGORIES)) {
    if (code >= category.range[0] && code <= category.range[1]) {
      return category.retry;
    }
  }
  
  return false;
}

/**
 * Creates a standardized error response
 * 
 * @param source - The error source
 * @param code - The error code
 * @param message - The error message
 * @param details - Optional additional error details
 * @returns A standardized error response object
 */
export function createErrorResponse(
  source: keyof typeof SOURCE_PREFIXES,
  code: number,
  message: string,
  details?: any
): ErrorResponse {
  const errorCode = createErrorCode(source, code);
  const retryable = isRetryableError(errorCode);
  
  logger.error({ errorCode, message, details, retryable }, 'Error occurred');
  
  return {
    code: errorCode,
    message,
    details,
    retryable,
  };
}

/**
 * Standard error handler that converts various error types to our standard format
 * 
 * @param error - The error to handle
 * @param defaultSource - The default error source if not specified
 * @param defaultCode - The default error code if not specified
 * @returns A standardized error response
 */
export function handleError(
  error: any,
  defaultSource: keyof typeof SOURCE_PREFIXES = 'API',
  defaultCode: number = 500
): ErrorResponse {
  if (error.code && error.message && 'retryable' in error) {
    // Already in our format
    return error as ErrorResponse;
  }
  
  // Handle Axios errors
  if (error.isAxiosError) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'API request failed';
    const details = error.response?.data;
    
    // Map HTTP status codes to our error codes
    let mappedCode;
    if (status === 429) {
      mappedCode = 300; // Rate limit
    } else if (status >= 400 && status < 500) {
      mappedCode = 200; // Validation errors
    } else if (status >= 500) {
      mappedCode = 400; // Service errors
    } else {
      mappedCode = defaultCode;
    }
    
    return createErrorResponse(defaultSource, mappedCode, message, details);
  }
  
  // Handle standard errors
  return createErrorResponse(
    defaultSource,
    defaultCode,
    error.message || 'An unknown error occurred',
    error.stack
  );
}

export default {
  createErrorCode,
  createErrorResponse,
  isRetryableError,
  handleError,
};
