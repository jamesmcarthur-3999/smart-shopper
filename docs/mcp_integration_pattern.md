# MCP Integration Pattern for Smart Shopper

This guide explains how to correctly implement the Model Context Protocol (MCP) pattern in the Smart Shopper project.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Claude Assistant                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Model Context Protocol (MCP)                    │
└───────────┬───────────────────┬────────────────────┬────────────────┘
            │                   │                    │
            ▼                   ▼                    ▼
┌───────────────────┐  ┌────────────────┐  ┌─────────────────────────┐
│  SerpAPI Server   │  │ Search1 Server │  │    Perplexity Server    │
└───────────────────┘  └────────────────┘  └─────────────────────────┘
```

## Key Implementation Principles

1. **Direct Claude Integration**
   - Claude communicates directly with MCP servers
   - No intermediary REST API or middleware

2. **Dedicated MCP Servers**
   - Each data source has its own dedicated MCP server
   - Servers implement the `@modelcontextprotocol/sdk` interface

3. **Standardized Adapter Pattern**
   - Each source has an adapter that normalizes data formats
   - Common interfaces for product data across all sources

4. **Multi-source Orchestration**
   - Multi-source server coordinates parallel calls
   - Handles merging, ranking, and enrichment

## Correct Implementation Examples

### 1. MCP Server Setup

```typescript
// Example from docs/Smart-Shopper-AI/src/mcp-servers/serpapi/index.ts
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { z } from 'zod';

// Create the server
const server = new Server({
  name: 'serpapi-server',
  version: '0.1.0',
});

// Define a tool
server.tool(
  'serpapi_search',
  'Search for products using SerpAPI',
  z.object({
    query: z.string().describe('Search query'),
    num_results: z.number().int().optional().default(10),
    // ... other parameters
  }),
  async (args) => {
    // Implementation
    return results;
  }
);

// Set up transport and start the server
const transport = new StdioServerTransport();
server.connect(transport);
```

### 2. Adapter Pattern

```typescript
// Example adapter from docs/Smart-Shopper-AI/src/mcp-servers/multi-source/adapters/serpapi.ts
import { ProductSearchResult, Source } from '../../../types';

export async function search(
  query: string,
  options: {
    num_results?: number;
    fields?: string;
    no_cache?: boolean;
    filters?: Record<string, any>;
    timeout?: number;
  } = {}
): Promise<ProductSearchResult> {
  // Implementation
}

export const source: Source = {
  id: 'serpapi',
  name: 'Google Shopping',
  search,
  priority: 1,
};

export default source;
```

### 3. Claude's MCP Tool Usage

```
### PLAN
I'll search for wireless headphones using three sources in parallel to find the best options.

1. Use SerpAPI for broad market coverage
2. Use Search1API for specialized product database
3. Use Perplexity for enrichment and context

I'll execute these searches in parallel for efficiency, then combine and rank the results.

serpapi_search(query="wireless headphones under $150", num_results=5)
search1_query(q="wireless headphones", filters={"price": "<150"})
perplexity_search(query="best wireless headphones features and battery life")
```

## Common Implementation Mistakes to Avoid

❌ **Creating traditional REST API middleware**
   - Don't build an Express/Node.js server as an intermediary
   - Claude should use MCP tools directly

❌ **Custom Claude client libraries**
   - Don't create a separate client for Claude
   - The assistant already knows how to use MCP tools

❌ **Monolithic architecture**
   - Don't combine all tools into one server
   - Use separate MCP servers for each data source
   
❌ **Synchronous processing**
   - Don't process tools sequentially when they can be parallel
   - Use parallel execution when appropriate

## Workflow Process

For every user query, Claude follows this workflow:

1. **PLAN**: Outline the steps and tools needed
2. **tool_use**: Call the appropriate MCP tools
3. **PATCH**: Update the display via canvas operations
4. **REFLECT**: Self-critique and refine if needed

Claude should show its thinking process throughout, especially for complex searches. If clarification is needed, Claude should ask before making API calls.

## Loading Experience Best Practices

- Show clear loading indicators when tools are in use
- Communicate Claude's thinking process
- Allow sufficient time for thoughtful analysis
- Don't rush to show results without proper context

## Reference Implementation

Refer to the example implementation in the `docs/Smart-Shopper-AI` directory:

- `/src/mcp-servers/serpapi/` - SerpAPI MCP server
- `/src/mcp-servers/search1api/` - Search1API MCP server
- `/src/mcp-servers/perplexity/` - Perplexity MCP server
- `/src/mcp-servers/multi-source/` - Multi-source orchestration

This pattern should be followed for all new MCP tool implementations.
