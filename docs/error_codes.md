# Smart Shopper Error Codes & Retry Policies

This document centralizes all error codes, their meanings, and recommended retry strategies for the Smart Shopper MCP tool stack.

## Error Code Format

Error codes follow the format: `SS-{SOURCE}-{CODE}` where:
- `SS` is the Smart Shopper prefix
- `{SOURCE}` is a 3-letter code for the error source (e.g., API, SRP for SerpAPI)
- `{CODE}` is a numeric code specific to the error

## Error Categories

| Category | Range | Severity |
|----------|-------|----------|
| 1xx | 100-199 | Configuration errors (no retry) |
| 2xx | 200-299 | Validation errors (no retry) |
| 3xx | 300-399 | Rate limiting (retry with backoff) |
| 4xx | 400-499 | Temporary API service errors (retry) |
| 5xx | 500-599 | Internal MCP server errors (retry once) |

## Error Codes & Retry Policies

| Error Code | Description | Retry Strategy |
|------------|-------------|----------------|
| SS-API-100 | Missing or invalid API key | No retry; escalate to user for key verification |
| SS-API-101 | Invalid tool parameter | No retry; check schema and fix parameters |
| SS-SRP-201 | Invalid SerpAPI search query | No retry; reformulate query |
| SS-SRP-301 | SerpAPI rate limit exceeded | Retry with exponential backoff (initial: 2s, max: 10s) |
| SS-SRP-401 | SerpAPI temporary service error | Retry up to 3 times with 1s delay |
| SS-SCH-201 | Invalid Search1 query syntax | No retry; check query format |
| SS-SCH-301 | Search1 API rate limit exceeded | Retry with exponential backoff (initial: 1s, max: 5s) |
| SS-SCH-401 | Search1 API temporary error | Retry up to 3 times with 1s delay |
| SS-PPX-201 | Invalid Perplexity request | No retry; check parameters |
| SS-PPX-301 | Perplexity API rate limit | Retry with exponential backoff (initial: 2s, max: 8s) |
| SS-PPX-401 | Perplexity temporary service error | Retry up to 2 times with 2s delay |
| SS-CNV-101 | Invalid canvas operation | No retry; check operation parameters |
| SS-CNV-201 | Canvas operation on non-existent item | No retry; check item ID exists |
| SS-MCP-500 | Internal MCP server error | Retry once after 1s; then notify user if persistent |
| SS-MCP-501 | MCP server timeout | Retry once with simplified query; then adjust parameters |

## Fallback Strategies

When encountering persistent errors:

1. **SerpAPI failures**: Fall back to Search1API with `boost` parameter for relevance
2. **Search1API failures**: Fall back to SerpAPI with more specific query 
3. **Perplexity failures**: Continue without enrichment, note to user
4. **Multiple source failures**: Display partial results with clear indication of incomplete data

## Performance Degradation Handling

If any search tool exceeds the 1s latency target:

1. Reduce `num_results` / `limit` parameters
2. Set stricter `fields` parameter to minimize payload
3. Fall back to cached results if available
4. Note latency issue to user if all options exhausted

## Error Logging

All errors should be logged with:
- Error code
- Source tool and parameters (sanitized)
- Timestamp
- Response time
- Retry attempt number

## Updating This Document

Add new error codes as they are encountered. For each new error:
1. Assign appropriate code in the correct range
2. Document clear retry/recovery strategy
3. Update MCP server handlers to recognize new codes

_Last updated: 2025-04-21_