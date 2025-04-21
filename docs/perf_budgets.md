# Smart Shopper Performance Budgets

This document outlines the performance targets and budgets for the Smart Shopper application.

## Latency Targets

| Phase | Operation | p95 Target | p99 Target | Absolute Maximum |
|-------|-----------|------------|------------|------------------|
| Planning | Query parsing & intent recognition | 150ms | 200ms | 300ms |
| Execution | MCP tool call (single) | 300ms | 400ms | 600ms |
| Execution | Parallel MCP tool calls (up to 3) | 400ms | 500ms | 800ms |
| Aggregation | Result processing & ranking | 100ms | 150ms | 200ms |
| Rendering | Initial canvas display | 150ms | 200ms | 300ms |
| Total | End-to-end response time | 800ms | 900ms | 1,000ms |

## Payload Size Budgets

| Component | Target Size | Maximum Size |
|-----------|-------------|--------------|
| MCP API Request | < 5KB | 10KB |
| MCP API Response | < 20KB | 50KB |
| Initial HTML | < 100KB | 150KB |
| JavaScript Bundle (main) | < 250KB | 350KB |
| JavaScript Bundle (vendors) | < 500KB | 800KB |
| CSS | < 50KB | 80KB |
| Images (per product card) | < 30KB | 50KB |
| Total Page Size | < 1MB | 1.5MB |

## CPU & Memory Budgets

| Resource | Target Usage | Maximum Usage |
|----------|--------------|---------------|
| JavaScript Execution Time (initial load) | < 350ms | 500ms |
| JavaScript Execution Time (interaction) | < 50ms | 100ms |
| Memory Usage (client) | < 75MB | 150MB |
| Memory Usage (server, per request) | < 200MB | 500MB |
| Server CPU (per request) | < 100ms | 250ms |

## Animation & Interaction Budgets

| Interaction | Target Response | Maximum Response |
|-------------|-----------------|------------------|
| Search Input | 16ms (60fps) | 33ms (30fps) |
| Grid Layout Changes | 100ms | 200ms |
| Card Hover Effects | 16ms (60fps) | 33ms (30fps) |
| Card Selection | 50ms | 100ms |
| Filter Application | 150ms | 300ms |

## Third-Party Service Budgets

| Service | Target Response | Timeout |
|---------|-----------------|---------|
| SerpAPI | 250ms | 500ms |
| Search1API | 250ms | 500ms |
| Perplexity | 350ms | 700ms |

## Caching Strategy

| Resource | Cache Duration | Cache Strategy |
|----------|----------------|----------------|
| Product Data | 4 hours | Stale-while-revalidate |
| API Responses | 1 hour | Cache-first |
| Image Assets | 1 week | Cache-first |
| Static Assets | 1 month | Cache-first |

## Monitoring & Thresholds

Performance degradations will trigger the following alert thresholds:

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| p95 Response Time | > 900ms | > 1,200ms |
| p99 Response Time | > 1,000ms | > 1,500ms |
| Error Rate | > 1% | > 5% |
| Client-Side JS Errors | > 0.1% of sessions | > 1% of sessions |
| Memory Leaks | > 5% growth over 10 minutes | > 10% growth over 10 minutes |

## Implementation Guidelines

1. Always use the performance monitoring utility to track operation durations
2. Log performance metrics for every MCP tool call and client rendering operation
3. Use `no_cache: false` for MCP tools unless explicitly required
4. Implement parallel tool calls when multiple data sources are needed
5. Ensure all returned fields are actually used in the UI
6. Apply proper pagination with sensible defaults (10-20 items per page)
7. Use debouncing for search input (150ms-300ms)
8. Compress all assets (gzip, Brotli)
9. Implement code splitting for React components
10. Optimize images using WebP or AVIF formats where possible

_Last updated: 2025-04-21_
