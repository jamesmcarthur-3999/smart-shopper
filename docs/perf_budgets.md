# Smart Shopper Performance Budgets

This document outlines the performance targets and budgets for the Smart Shopper application. Meeting these targets is crucial for delivering a responsive and efficient shopping assistant experience.

## Core Performance Metrics

| Metric | Target (p95) | Critical Threshold | Notes |
|--------|-------------|-------------------|-------|
| **Total Response Time** | ≤ 1000ms | 2000ms | End-to-end from user query to visual results |
| **Tool Call Latency** | ≤ 700ms | 1200ms | Maximum time for any individual MCP tool call |
| **Parallel Tool Calls** | ≤ 800ms | 1500ms | Maximum time for parallel tool calls (up to 3) |
| **Canvas Rendering** | ≤ 150ms | 300ms | Time to render results on canvas |
| **Result Enrichment** | ≤ 300ms | 600ms | Time for product data enrichment |
| **Claude Planning** | ≤ 200ms | 400ms | Time for Claude to plan and coordinate |

## Phase-Specific Budgets

### 1. Query Planning Phase

| Component | Budget (ms) | Notes |
|-----------|-------------|-------|
| Claude Query Analysis | 100 | Parsing user intent |
| Tool Selection | 50 | Choosing appropriate search tools |
| Parameter Optimization | 50 | Setting optimal tool parameters |
| **Total Planning Budget** | **200** | |

### 2. Data Retrieval Phase

| Component | Budget (ms) | Notes |
|-----------|-------------|-------|
| SerpAPI Call | 400 | Google Shopping results |
| Search1API Call | 300 | Elastic product index |
| Perplexity Call | 500 | Enrichment and citations |
| **Maximum Parallel Budget** | **700** | Using parallel tool calls |

### 3. Data Processing Phase

| Component | Budget (ms) | Notes |
|-----------|-------------|-------|
| Result Merging | 50 | Combining multiple sources |
| Result Ranking | 100 | Sorting by relevance |
| Data Enrichment | 100 | Adding context to products |
| **Total Processing Budget** | **250** | |

### 4. Rendering Phase

| Component | Budget (ms) | Notes |
|-----------|-------------|-------|
| Canvas Operations | 100 | add_card, update_grid, etc. |
| Visual Rendering | 50 | DOM updates and styling |
| **Total Rendering Budget** | **150** | |

## Payload Size Budgets

| Component | Target Size | Maximum Size | Notes |
|-----------|-------------|--------------|-------|
| SerpAPI Response | ≤ 50KB | 100KB | Limit fields to essentials |
| Search1API Response | ≤ 30KB | 60KB | Use pagination and limits |
| Perplexity Response | ≤ 15KB | 30KB | Constrain context size |
| Canvas Operations | ≤ 5KB per op | 10KB per op | Minimize payloads |
| **Total Payload Budget** | **≤ 100KB** | **200KB** | End-to-end transaction |

## Optimization Strategies

### 1. Tool Call Optimization
- Limit `fields` parameter in SerpAPI to `shopping_results.price,title,thumbnail,link,source`
- Set appropriate `limit` in Search1API (default: 10)
- Use `sonar-small-online` model with `small` context in Perplexity for fast responses

### 2. Parallelization Strategy
- Always parallelize up to 3 tool calls when possible
- Set explicit timeouts for each call (700ms default)
- Implement graceful degradation when timeouts occur

### 3. Caching Strategy
- Cache SerpAPI results for 10 minutes unless `no_cache:true` specified
- Cache enrichment data for similar products for 1 hour
- Cache canvas state locally for immediate re-renders

### 4. Progressive Enhancement
- Render basic results immediately (≤ 800ms)
- Enrich with additional data progressively
- Allow user interaction with initial results while enrichment completes

## Monitoring & Enforcement

- Log per-phase timing for every user request
- Alert on any p95 metric exceeding targets
- Implement circuit breakers for tools consistently exceeding budgets
- Provide visual indicator to user when performance targets are not met

_Last updated: 2025-04-21_