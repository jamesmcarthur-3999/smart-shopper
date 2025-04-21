# Smart Shopper Error Codes

This document contains centralized error codes and retry strategies for the Smart Shopper application.

## MCP Tool Errors

| Code | Meaning | Retry Strategy |
|------|---------|----------------|
| `MCP_001` | SerpAPI request failed | Retry once with exponential backoff (2s) |
| `MCP_002` | SerpAPI rate limit exceeded | Wait 5s and retry once |
| `MCP_003` | SerpAPI invalid API key | Do not retry; check environment variables |
| `MCP_004` | SerpAPI malformed query | Do not retry; fix query parameters |
| `MCP_005` | Search1API request failed | Retry once with exponential backoff (2s) |
| `MCP_006` | Search1API rate limit exceeded | Wait 5s and retry once |
| `MCP_007` | Search1API invalid API key | Do not retry; check environment variables |
| `MCP_008` | Search1API malformed query | Do not retry; fix query parameters |
| `MCP_009` | Perplexity request failed | Retry once with exponential backoff (2s) |
| `MCP_010` | Perplexity rate limit exceeded | Wait 5s and retry once |
| `MCP_011` | Perplexity invalid API key | Do not retry; check environment variables |
| `MCP_012` | Perplexity malformed query | Do not retry; fix query parameters |
| `MCP_013` | Multi-source search failed | Retry individual sources that failed |
| `MCP_014` | All sources failed | Fall back to cached results if available |

## Canvas Operation Errors

| Code | Meaning | Retry Strategy |
|------|---------|----------------|
| `CANVAS_001` | Invalid card ID | Do not retry; check card ID |
| `CANVAS_002` | Duplicate card ID | Do not retry; use a unique ID |
| `CANVAS_003` | Grid layout invalid | Do not retry; check layout parameters |
| `CANVAS_004` | Too many cards for grid | Reduce number of cards or increase grid size |
| `CANVAS_005` | Highlight failed - card not found | Do not retry; check card ID |
| `CANVAS_006` | Undo operation failed - history empty | Do not retry; check undo parameters |

## General Application Errors

| Code | Meaning | Retry Strategy |
|------|---------|----------------|
| `APP_001` | Environment variable missing | Do not retry; check .env file |
| `APP_002` | Server connection failed | Retry with exponential backoff (max 3 times) |
| `APP_003` | Client-side rendering error | Reload the application |
| `APP_004` | WebSocket connection lost | Attempt reconnection with exponential backoff |
| `APP_005` | Local storage access failed | Fall back to in-memory storage |

## Network Errors

| Code | Meaning | Retry Strategy |
|------|---------|----------------|
| `NET_001` | Network request timeout | Retry once with increased timeout |
| `NET_002` | Network connection lost | Retry when connection is restored |
| `NET_003` | CORS error | Do not retry; check server configuration |
| `NET_004` | Request payload too large | Do not retry; reduce payload size |

## Authentication Errors

| Code | Meaning | Retry Strategy |
|------|---------|----------------|
| `AUTH_001` | API key expired | Do not retry; request new API key |
| `AUTH_002` | API key unauthorized | Do not retry; check permissions |
| `AUTH_003` | API key usage exceeded | Wait until next quota period and retry |

## Performance Monitoring

When an error occurs and a retry strategy is attempted, log the following information:

1. Error code
2. Original error message
3. Retry attempt number
4. Retry delay
5. Success/failure of retry
6. Total time to resolution

This information is used to track and improve system reliability and performance.

_Last updated: 2025-04-21_
