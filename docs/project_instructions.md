# Smart Shopper – Claude Project Instructions (Full Version v2.0)

---
## 🚀 Mission
Create a smart shopping assistant application built around the Claude AI model. The app uses Claude's capabilities with our custom MCP tools to research, enrich, rank, and visually present products on an interactive canvas, delivering compelling results in ≤ **1 second**.

Repo: <https://github.com/jamesmcarthur-3999/smart-shopper> (branch: `trunk`).

---
## 1 · Architecture Overview
Smart Shopper uses the following architecture:

1. **Frontend Application**: 
   - Chat interface modeled after Claude's UI
   - Interactive canvas for product display
   - Shows Claude's thinking processes (PLAN, tool use, REFLECT)

2. **Claude AI Integration**:
   - Direct integration with Claude API
   - Claude performs the reasoning and orchestration
   - Uses MCP tools to access external data

3. **MCP Server Layer**:
   - Custom MCP servers for each data source
   - Provides standardized interface for Claude
   - Handles API keys and external connections

This architecture allows Claude to remain at the center of the experience while leveraging our custom MCP tools for shopping-specific functionality.

---
## 2 · Priority Cheat‑Sheet (memorize)
1. **Claude + MCP tools** – Claude AI is the brain of the system using our MCP tools.
2. **PLAN → tool_use → PATCH → REFLECT** workflow – Clearly show Claude's thinking.
3. **Max 3 parallel search calls; p95 latency ≤ 1 s**.
4. **Keys via env‑vars** – All API keys stored securely in environment variables.
5. **Interactive canvas** – Rich product visualization using semantic canvas operations.
6. **Quality over speed** – Ask clarifying questions before making API calls.

---
## 3 · Tool Inventory (via MCP)
| Tool | Purpose | Key Params |
|------|---------|------------|
| `serpapi_search` | Google Shopping scrape | `query`, `fields`, `no_cache` |
| `search1_query` | Elastic product index | `q`, `filters`, `facets`, `boost` |
| `perplexity_search` | Enrichment & citations | `query`, `model`, `context_size`, `domain_filter` |
| `add_card` | Add product to canvas | `id`, `title`, `price`, `img_url`, `source` |
| `update_grid` | Update canvas layout | `items[]`, `layout` |
| `highlight_choice` | Highlight product | `id`, `reason` |
| `undo_last` | Revert canvas operation | `n` |

### Parallel Call Example
Claude can call multiple MCP tools concurrently to optimize response time:

```jsonc
{
  "parallel_tool_calls": true,
  "tools": [
    {"tool":"serpapi_search", "params":{"query":"blush wedding shoes size 8"}},
    {"tool":"search1_query", "params":{"q":"wedding shoes", "filters":{"price":"<200"}}},
    {"tool":"perplexity_search", "params":{"query":"best materials for wedding shoes"}}
  ]
}
```

---
## 4 · Golden Workflow
Smart Shopper follows a strict workflow pattern to showcase Claude's thinking:

1. **### PLAN** – Claude outlines steps & chosen tools.
2. **tool_use** – Claude calls up to 3 tools concurrently via MCP.
3. **PATCH** – Claude updates the canvas with product results.
4. **### REFLECT** – Claude self-critiques and refines results if needed.

This workflow should be clearly visible in the UI, giving users insight into Claude's thought process as it works to find the best products.

---
## 5 · Canvas Ops API
Our canvas operations API provides a semantic interface for Claude to control product visualization:

* `add_card` {`id`, `title`, `price`, `img_url`, `source`}  
* `update_grid` {`items[]`, `layout`}  
* `highlight_choice` {`id`, `reason`}  
* `undo_last` {`n`}  

Claude uses these operations to create a rich, interactive product display.

---
## 6 · Claude Integration Tips
* API flags: `parallel_tool_calls:true`, `anthropic-beta:token-efficient-tools-2025-02-19`, `include_citations:true`.
* Use Claude 3.5 Sonnet or higher for best performance.
* System prompt should explain available tools and expected workflow.
* Claude's thinking process should be clearly visible to users.
* Every product recommendation should include Claude's reasoning.

---
## 7 · Non‑Negotiable Guardrails
| ID | Rule |
|----|------|
| G1 | Claude is the reasoning engine using MCP tools. |
| G2 | Show the complete PLAN → tool_use → PATCH → REFLECT workflow. |
| G3 | Maintain env‑based secrets; never hardcode API keys. |
| G4 | Keep p95 latency ≤ 1 s; parallelize wisely. |
| G5 | Ask clarifying questions before searching when needed. |
| G6 | Quality over speed; thoughtful recommendations over quick results. |

---
## 8 · Success Definition
* User submits a shopping request → Claude thinks, uses tools, and presents a polished canvas of relevant products.
* User sees Claude's complete thought process, from planning to reflection.
* Canvas displays rich product information with thoughtful recommendations.
* Follow-up questions refine results without starting over.

---
_© 2025 Smart Shopper — internal use only._
