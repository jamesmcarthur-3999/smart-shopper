# Smart Shopper - Claude MCP Shopping Assistant

## ⚠️ IMPORTANT: MODEL CONTEXT PROTOCOL ARCHITECTURE

This project implements a **Model Context Protocol (MCP)** architecture where Claude directly interacts with dedicated MCP servers rather than using traditional REST APIs.

### Key Implementation Points:
- **NO traditional API middleware** - Claude uses MCP tools directly
- **Separate adapter-based MCP servers** for each data source
- **Follow /docs/Smart-Shopper-AI structure** for implementation

## Project Overview

Smart Shopper transforms a chat interface into an AI-powered shopping concierge that helps users find, compare, and visualize products through natural language. The system uses Claude's reasoning abilities with specialized MCP tools to deliver thoughtful, high-quality results.

## Technical Architecture

1. **MCP Server Structure** *(See `/docs/Smart-Shopper-AI/src/mcp-servers/`)*:
   - Each source has its own dedicated MCP server
   - Servers implement the `@modelcontextprotocol/sdk` interface
   - Adapters standardize data between sources
   - Multi-source server orchestrates parallel calls

2. **Claude Integration Pattern**:
   - Claude directly calls MCP tools using the provided protocol
   - Follows PLAN → tool_use → PATCH → REFLECT workflow
   - No middleware required between Claude and MCP servers

3. **Visual Canvas System**:
   - Client-side rendering of product data
   - Canvas operations (`add_card`, `update_grid`, etc.) control display
   - Semantic operations replace direct DOM manipulation

## Getting Started

1. **Review Documentation First**:
   - 📄 `/docs/project_instructions.md` - Core implementation guidelines
   - 📄 `/docs/mcp_quick_guide.md` - Understanding MCP tools
   - 📄 `/docs/Smart-Shopper-AI/` - Reference implementation

2. **Launch MCP Servers with Claude Desktop**:
   ```bash
   # First make sure your .env file contains all the required API keys
   node launch.js
   ```

   This launcher script will:
   - Build the MCP servers
   - Configure Claude Desktop
   - Launch Claude Desktop with MCP server connections

3. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Add API keys for SerpAPI, Search1API, Perplexity, and Claude

## Proper MCP Implementation

Smart Shopper uses real MCP connections, not simulated ones. This means:

1. Claude directly connects to MCP servers that expose specific tools:
   - `serpapi_search`: Search Google Shopping for products
   - `search1_query`: Search product database with filters
   - `perplexity_search`: Enrich product data with context
   - `multi_source_search`: Combine results from multiple sources
   - `add_card`, `update_grid`, `highlight_choice`, `undo_last`: Canvas operations

2. MCP servers are standalone processes that Claude communicates with via the MCP protocol

3. The PLAN → tool_use → PATCH → REFLECT workflow is natural to Claude, not simulated in UI

## MCP Tool Workflow

```
┌────────────┐     ┌──────────────┐     ┌───────────────┐
│            │     │ MCP SERVERS  │     │              │
│  Claude    │────▶│ - serpapi    │────▶│ Product      │
│  Assistant │     │ - search1api │     │ Canvas       │
│            │     │ - perplexity │     │              │
└────────────┘     └──────────────┘     └───────────────┘
      │                                         ▲
      │           PLAN → tool_use → PATCH      │
      └─────────────────────────────────────────┘
```

## Priority Guidelines

1. **User Experience** - Prioritize quality over speed; show Claude's thinking
2. **Clarify Ambiguity** - Ask questions before making API calls when needed
3. **MCP Architecture** - Never use raw REST calls; always use MCP tools
4. **Thoughtful Tools** - Use tools in a considered sequence, not just for speed
5. **Visual Clarity** - Communicate loading states and thinking processes

## MCP Tool Inventory

| Tool | Purpose | Implementation Path |
|------|---------|---------------------|
| `serpapi_search` | Google Shopping results | `/mcp-servers/serpapi/` |
| `search1_query` | Product database search | `/mcp-servers/search1api/` |
| `perplexity_search` | Context enrichment | `/mcp-servers/perplexity/` |
| `multi_source_search` | Combined search | `/mcp-servers/multi-source/` |
| `add_card` | Add/update product card | `/mcp-servers/canvas/` |
| `update_grid` | Change grid layout | `/mcp-servers/canvas/` |
| `highlight_choice` | Mark recommendation | `/mcp-servers/canvas/` |
| `undo_last` | Revert operation | `/mcp-servers/canvas/` |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the terms specified in [LICENSE](./LICENSE).
