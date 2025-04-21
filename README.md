# Smart Shopper - AI-Powered Shopping Assistant

Smart Shopper is an AI-powered shopping assistant that leverages Claude and custom MCP tools to provide intelligent product recommendations, comparisons, and enriched information - all within 1 second of a user query.

## Core Features

- **Natural Language Shopping**: Users express their shopping needs conversationally
- **Sub-Second Response**: All recommendations appear within 1 second
- **Rich Visual Experience**: Products displayed in customizable, interactive layouts
- **Data-Enriched Results**: Product data enhanced with reviews, comparisons, and context
- **AI-Powered Recommendations**: Claude analyzes results and provides insights

## Technical Architecture

Smart Shopper is built on a Model Context Protocol (MCP) architecture with these key components:

1. **Claude AI**: Powers natural language understanding and coordinates the shopping experience
2. **MCP Tool Stack**: Custom servers that securely access external APIs for product data:
   - SerpAPI for Google Shopping results
   - Search1API for product indexing
   - Perplexity for enrichment and context
3. **Canvas Operations**: Interactive display for product cards, comparisons, and galleries
4. **React Frontend**: Modern UI for natural language input and product display

## MCP Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `serpapi_search` | Fetch Google Shopping results | `query`, `num_results`, `fields` |
| `search1_query` | Query product database | `q`, `filters`, `facets`, `boost` |
| `perplexity_search` | Enrich product information | `query`, `model`, `context_size` |
| `multi_source_search` | Aggregate results from all sources | `query`, `sources`, `max_results`, `sort_by` |
| `canvas_ops` | Manipulate product display | `op`, operation-specific parameters |
| `claude_assist` | Get AI shopping assistance | `query`, `products`, `enrichment`, `context` |

## Canvas Operations

The canvas supports these operations:

- `add_card`: Add or update a product card
- `update_grid`: Change the grid layout and displayed products
- `highlight_choice`: Highlight a recommended product
- `undo_last`: Undo previous operations

## Performance Optimizations

- Parallel API calls to meet the ≤ 1 second latency requirement
- Timeout mechanisms to ensure responses are always fast
- Efficient state management in the React frontend
- Caching options for repeated queries

## Getting Started

1. Clone the repository
2. Create a `.env` file with your API keys (see `.env.example`)
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

## API Keys Required

- `SERPAPI_API_KEY`: For Google Shopping results
- `SEARCH1_API_KEY`: For product database access
- `PERPLEXITY_API_KEY`: For enrichment and context

## Contributing

See the [CONTRIBUTING.md](./CONTRIBUTING.md) file for contribution guidelines.

## License

See the [LICENSE](./LICENSE) file for details.
