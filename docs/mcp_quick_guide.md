# MCP Quick-Guide for Claude (Smart Shopper App Tools)

This quick-guide ensures Claude clearly understands how to correctly use the Smart Shopper-specific **MCP (Model Context Protocol)** tools powered by the provided API keys. 

---

## 📚 What Are MCP Tools?
In the Smart Shopper context, MCP tools are custom servers built specifically to access external APIs (SerpAPI, Perplexity, Search1API) securely and efficiently. Claude interacts exclusively via these MCP servers, using provided API keys directly.

---

## 🌐 Why MCP for Smart Shopper?
- **Real-Time Data**: Always current results; no mock data or placeholders.
- **Secure API Access**: API keys safely stored in environment variables; usage directly permitted.
- **Optimized Performance**: Allows parallel tool calls to meet latency targets (≤ 1 second).

---

## 🔑 API Keys & Usage
API keys are securely set via environment variables and can be used directly by Claude without additional approval:
- `CLAUDE_API_KEY`
- `SERPAPI_API_KEY`
- `SEARCH1_API_KEY`
- `PPLX_API_KEY`

---

## ⚙️ MCP Tool Descriptions & Usage

### SerpAPI MCP Tool
- **Purpose**: Fetch product results from Google Shopping
- **Key Params**: `query`, `num_results`, `fields`
- **Example Call**:
```json
{"method":"serpapi_search","params":{"query":"running shoes under $100","num_results":5,"fields":"price,title,img_url"}}
```

### Perplexity MCP Tool
- **Purpose**: Enrich product data and provide citations
- **Key Params**: `query`, `model`, `context_size`
- **Example Call**:
```json
{"method":"perplexity_search","params":{"query":"best running shoe materials","model":"sonar-small-online","context_size":"medium"}}
```

### Search1API MCP Tool
- **Purpose**: Elastic search product indexing and querying
- **Key Params**: `q`, `filters`, `facets`, `boost`
- **Example Call**:
```json
{"method":"search1_query","params":{"q":"running shoes","filters":{"price":"<100"},"facets":["brand","size"],"boost":{"field":"rating","factor":1.2}}}
```

---
## 🔄 Extending with New Sources
To scale beyond SerpAPI, Perplexity, and Search1API, follow these patterns:

### 1. Config-Driven Source Registry
Maintain a registry (`/config/sources.json` or `/config/sources.yaml`) listing each source's MCP tool and default params:
```yaml
sources:
  - id: serpapi
    tool: serpapi_search
    defaultParams:
      num_results: 5
      fields: price,title,img_url
  - id: amazon
    tool: amazon_search
    defaultParams:
      region: us
  - id: ebay
    tool: ebay_search
    defaultParams:
      buyingOptions:
        - FIXED_PRICE
```
*When adding a new API, simply append a new entry.*

### 2. Adapter-Based Tool Structure
On the MCP server side, organize each integration as an adapter module:
```
/adapters
  ├── serpapi.js
  ├── amazon.js
  └── ebay.js
```
Each adapter exports a `search(query, opts)` function returning `Array<{id,title,price,url,thumbnail,source_id}>`. The MCP server's handler loads the registry, invokes `adapter.search(...)`, and normalizes responses.

### 3. Unified Multi-Source Tool
Implement a `multi_source_search` MCP tool that:
1. Reads the source registry
2. Launches parallel adapter searches
3. Merges and sorts results by relevance or price
4. Returns a single unified list

**Example Call**:
```json
{"method":"multi_source_search","params":{"query":"wedding shoes under $200"}}
```

### 4. Fallback & Prioritization
Within `multi_source_search`:
- **Prioritize** sources by reliability or order defined in registry
- **Fallback**: if a source fails, continue with others
- **Rate-limit**: use token buckets per adapter

### 5. Adding Future Sources
1. Create adapter (`/adapters/<source>.js`) implementing the `search` interface.
2. Add entry to `/config/sources.json` with `id`, `tool`, and `defaultParams`.
3. Restart the MCP server; Claude can immediately `tool_use` the new source by invoking `multi_source_search`.

---

## 🛑 Common Pitfalls & Fixes
| Pitfall | Fix |
| ------- | --- |
| Incorrect params or schemas | Verify params against `/docs/tool_schemas.json`. |
| Placeholder/mock data used | Always execute live MCP calls with real API keys. |
| Latency issues | Parallelize up to 3 calls; keep payload minimal. |

---

### ✅ Success
Claude confidently uses Smart Shopper MCP tools, real API keys, and adheres strictly to the project's latency and accuracy requirements, avoiding mock data or placeholders entirely.

_Last updated: 2025-04-21_