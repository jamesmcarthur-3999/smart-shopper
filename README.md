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

2. **Launch MCP Servers**:
   ```bash
   # Start all MCP servers
   cd docs/Smart-Shopper-AI
   npm install
   npm start
   ```

3. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Add API keys for SerpAPI, Search1API, and Perplexity

4. **Start Frontend**:
   ```bash
   npm install
   npm run dev
   ```

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

## Canvas Operations

| Operation | Purpose | Parameters |
|-----------|---------|------------|
| `add_card` | Add/update product | `id`, `title`, `price`, `img_url`, `source` |
| `update_grid` | Change layout | `items[]`, `layout` |
| `highlight_choice` | Mark recommendation | `id`, `reason` |
| `undo_last` | Revert operation | `n` |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the terms specified in [LICENSE](./LICENSE).
