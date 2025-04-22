# MCP Quick-Guide for Smart Shopper (Claude-Powered Shopping App)

This quick-guide explains how Smart Shopper implements **MCP (Model Context Protocol)** to enable Claude AI to connect with our product search tools.

---

## 📚 What Is MCP and How Smart Shopper Uses It

Model Context Protocol (MCP) is an open standard that lets AI models like Claude interact directly with external tools and data sources. In Smart Shopper:

1. **Claude AI Is Central**: Claude functions as the core reasoning engine that:
   - Plans the approach to a user's query
   - Determines which tools to use
   - Processes the results
   - Makes product recommendations

2. **MCP Tools Are Claude's Tools**: Our custom MCP servers provide Claude with:
   - Product search capabilities (SerpAPI, Search1API)
   - Enrichment data (Perplexity)
   - Canvas manipulation operations

3. **Visible Thought Process**: The user sees Claude's complete workflow:
   - PLAN: Claude outlines its approach
   - tool_use: Claude calls our MCP tools
   - PATCH: Claude updates the canvas
   - REFLECT: Claude evaluates and refines

---

## 🌐 Smart Shopper's MCP Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SMART SHOPPER APP                       │
│                                                             │
│  ┌───────────┐          ┌───────────────────────────────┐  │
│  │           │          │                               │  │
│  │  User     │◄─────────►        Claude AI Model        │  │
│  │ Interface │          │  (Reasoning & Orchestration)  │  │
│  │           │          │                               │  │
│  └───────────┘          └─────────────┬─────────────────┘  │
│                                        │                    │
│                                        ▼                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │                   MCP TOOLS                         │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐     │    │
│  │  │ SerpAPI  │  │ Search1   │  │ Perplexity   │     │    │
│  │  │ Server   │  │ Server    │  │ Server       │     │    │
│  │  └──────────┘  └───────────┘  └──────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐     │    │
│  │  │ add_card │  │update_grid│  │highlight_    │     │    │
│  │  │ Tool     │  │Tool       │  │choice Tool   │     │    │
│  │  └──────────┘  └───────────┘  └──────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

- Claude AI directly uses MCP tools to access external data sources
- Each MCP server provides a specific capability to Claude
- Claude demonstrates its thinking process in the user interface

---

## 🔑 API Keys & Tool Usage

All API keys are securely stored in environment variables:

```
SERPAPI_API_KEY=<key>
SEARCH1_API_KEY=<key>
PERPLEXITY_API_KEY=<key>
CLAUDE_API_KEY=<key>
```

Claude directly accesses these keys through our MCP servers to make API calls. The workflow is:

1. User asks a shopping question
2. Claude determines which tools to use
3. Claude calls the appropriate MCP tools
4. MCP tools use API keys to fetch data
5. Claude processes the results and updates the canvas

---

## ⚙️ MCP Tool Descriptions 

### 1. Product Search Tools

#### SerpAPI MCP Tool
```javascript
// Example of Claude using SerpAPI
await serpapi_search({
  query: "running shoes under $100", 
  num_results: 5, 
  fields: "price,title,img_url"
});
```

#### Search1API MCP Tool
```javascript
// Example of Claude using Search1API 
await search1_query({
  q: "running shoes",
  filters: {"price": "<100"},
  facets: ["brand", "size"],
  boost: {"field": "rating", "factor": 1.2}
});
```

#### Perplexity MCP Tool
```javascript
// Example of Claude using Perplexity
await perplexity_search({
  query: "best running shoe materials", 
  model: "sonar-small-online", 
  context_size: "medium"
});
```

### 2. Canvas Operation Tools

```javascript
// Example of Claude adding a product card
await add_card({
  id: "product123",
  title: "Nike Air Zoom Pegasus",
  price: "$95.99",
  img_url: "https://example.com/shoe.jpg",
  source: "SerpAPI"
});

// Example of Claude updating the grid
await update_grid({
  items: ["product123", "product456", "product789"],
  layout: {columns: 3, gap: "1rem"}
});

// Example of Claude highlighting a recommendation
await highlight_choice({
  id: "product123",
  reason: "Best combination of price and cushioning"
});
```

---

## 🛑 Common Pitfalls & Fixes

| Pitfall | Fix |
| ------- | --- |
| Not showing Claude's thinking | Ensure PLAN and REFLECT stages are visible in UI |
| Slow response times | Use parallel tool calls (up to 3 at once) |
| Missing product details | Check all MCP servers are running and accessible |
| Poor recommendations | Give Claude enough context in its system prompt |
| Security concerns | Never hardcode API keys; always use environment variables |

---

### ✅ Success Criteria

Smart Shopper succeeds when:

1. Claude's thinking process is transparent to users
2. API calls are made through MCP tools, not direct REST
3. The app provides helpful, relevant product recommendations
4. The canvas displays rich, interactive product information
5. Response times remain under 1 second (p95)
6. API keys remain secure in environment variables

_Last updated: 2025-04-21_
