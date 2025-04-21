# Smart Shopper AI - Local Development

This directory contains the local development files for the Smart Shopper AI project, focusing on MCP (Model Context Protocol) server implementations.

## Directory Structure

```
/Smart-Shopper-AI
  /mcp-servers
    /serpapi        - Google Shopping search implementation
    /search1api     - Elastic product index implementation 
    /perplexity     - Product data enrichment implementation
    /multi-source   - Unified search across all sources
  /lib
    /utils          - Shared utilities
    /schemas        - JSON schemas for validation
  /config           - Configuration files
  /tests            - Test files
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   cp ../env_example .env
   # Edit .env with your API keys
   ```

3. Run a specific MCP server:
   ```
   npm run start:serpapi
   # or
   npm run start:search1api
   # or
   npm run start:perplexity
   ```

## Development Guidelines

- All MCP servers must implement the interfaces defined in the JSON schemas
- Respect the 1-second latency target for all operations
- Handle errors gracefully according to the error codes document
- Include appropriate logging for debugging
- Write tests for all functionality

## Testing With Claude

To test these MCP servers with Claude Desktop:

1. Build the server:
   ```
   npm run build:all
   ```

2. Configure Claude Desktop to use the local MCP server in `claude_desktop_config.json`

See the MCP Quick Guide for more information on using these MCP servers with Claude.
