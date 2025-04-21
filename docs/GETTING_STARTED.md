# Getting Started with Smart Shopper

This guide helps new developers understand and set up the Smart Shopper project, focusing on the Model Context Protocol (MCP) architecture and Claude integration.

## First Steps

1. **Read these documents first:**
   - [README.md](../README.md) - Project overview
   - [docs/project_instructions.md](./project_instructions.md) - Core implementation guidelines
   - [docs/mcp_quick_guide.md](./mcp_quick_guide.md) - MCP tools overview
   - [docs/mcp_integration_pattern.md](./mcp_integration_pattern.md) - MCP implementation pattern

2. **Understand the architecture:**
   - Review the example implementation in [docs/Smart-Shopper-AI](./Smart-Shopper-AI/)
   - Note how Claude directly uses MCP tools without middleware
   - Understand the adapter pattern in [multi-source adapters](./Smart-Shopper-AI/src/mcp-servers/multi-source/adapters/)

## Setting Up Your Environment

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to required API keys

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jamesmcarthur-3999/smart-shopper.git
   cd smart-shopper
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env to add your API keys:
   # - SERPAPI_API_KEY
   # - SEARCH1_API_KEY
   # - PERPLEXITY_API_KEY
   # - CLAUDE_API_KEY
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start MCP servers:**
   ```bash
   cd docs/Smart-Shopper-AI
   npm install
   npm start
   ```

5. **Start the frontend:**
   ```bash
   cd ..  # Return to project root
   npm run dev
   ```

## Project Structure

```
smart-shopper/
├── docs/
│   ├── Smart-Shopper-AI/      # Reference MCP implementation
│   │   ├── src/
│   │   │   ├── mcp-servers/   # Individual MCP servers
│   │   │   │   ├── serpapi/
│   │   │   │   ├── search1api/
│   │   │   │   ├── perplexity/
│   │   │   │   └── multi-source/
│   │   │   │       └── adapters/  # Source adapters
│   │   │   ├── lib/          # Shared utilities
│   │   │   └── types/        # Type definitions
│   ├── project_instructions.md
│   ├── mcp_quick_guide.md
│   └── tool_schemas.json
├── public/                  # Static assets
├── src/                     # Frontend application
│   ├── App.tsx              # Main React component
│   └── ...
└── server.js               # Development server
```

## Understanding MCP Tools

### SerpAPI MCP Tool
Fetches product results from Google Shopping.

```typescript
// Example usage
serpapi_search({
  query: "running shoes under $100",
  num_results: 5,
  fields: "price,title,img_url"
})
```

### Search1API MCP Tool
Queries the product database with advanced filtering.

```typescript
// Example usage
search1_query({
  q: "running shoes",
  filters: { price: "<100" },
  facets: ["brand", "size"],
  boost: { field: "rating", factor: 1.2 }
})
```

### Perplexity MCP Tool
Enriches product data with additional context.

```typescript
// Example usage
perplexity_search({
  query: "best running shoe materials",
  model: "sonar-small-online",
  context_size: "medium"
})
```

### Multi-Source MCP Tool
Orchestrates searches across multiple sources.

```typescript
// Example usage
multi_source_search({
  query: "running shoes under $100",
  sources: ["serpapi", "search1", "perplexity"],
  max_results: 10,
  sort_by: "relevance"
})
```

## Claude Integration Workflow

Claude follows a specific workflow when interacting with the MCP tools:

1. **PLAN**: Outline the steps and tools needed
   ```
   ### PLAN
   To find the best running shoes under $100, I'll:
   1. Search Google Shopping for broad market coverage
   2. Query our product database for detailed specifications
   3. Get enrichment data about running shoe materials
   ```

2. **tool_use**: Call the appropriate MCP tools
   ```
   Calling serpapi_search with query="running shoes under $100"...
   Calling search1_query with q="running shoes" and filters={"price": "<100"}...
   Calling perplexity_search with query="best running shoe materials"...
   ```

3. **PATCH**: Update the display via canvas operations
   ```
   // Update the product grid
   update_grid({
     items: ["product_1", "product_2", "product_3"],
     layout: { columns: 3 }
   })

   // Highlight the recommended product
   highlight_choice({
     id: "product_2",
     reason: "Best balance of cushioning and price"
   })
   ```

4. **REFLECT**: Self-critique and refine if needed
   ```
   ### REFLECT
   I've presented 3 running shoe options under $100, highlighting the one with
   the best reviews. Next time, I could improve by asking for the user's 
   specific activities (trail running vs road running) to provide more targeted
   recommendations.
   ```

## Canvas Operations

Canvas operations control the visual display of products:

- `add_card`: Add or update a product card
- `update_grid`: Change the grid layout and displayed products
- `highlight_choice`: Highlight a recommended product
- `undo_last`: Undo previous operations

## Best Practices

1. **Thoughtful Claude Integration:**
   - Allow Claude to show its thinking process
   - Use clear loading indicators during tool calls
   - Let Claude ask clarifying questions when needed

2. **Performance Considerations:**
   - Use parallel tool calls when appropriate
   - Keep payload sizes minimal
   - Consider caching for repeated queries

3. **Quality Over Speed:**
   - Prioritize thoughtful, high-quality results
   - Don't rush searches at the expense of relevance
   - Allow sufficient time for Claude to analyze results

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Claude not using MCP tools | Ensure MCP servers are running and check Claude's access |
| Slow response times | Check for unnecessary sequential tool calls; parallelize where possible |
| Missing product information | Verify API key access and check error handling in adapters |
| Low quality results | Allow Claude more context/thinking time and implement better ranking |

## Next Steps

After getting familiar with the project:

1. Review the [reference implementation](./Smart-Shopper-AI/) in detail
2. Implement a new feature or improvement
3. Consider extending with additional data sources

For more details, see the [project guidelines](./project_instructions.md).
