# Smart Shopper Installation Guide

This guide will help you set up the Smart Shopper application with Claude Desktop using the proper Model Context Protocol (MCP) implementation.

## Prerequisites

Before you begin, make sure you have the following:

1. **Node.js** (v16 or later)
2. **Claude Desktop** - [Download here](https://claude.ai/desktop)
3. API keys for:
   - SerpAPI
   - Search1API
   - Perplexity
   - Claude (Anthropic)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/jamesmcarthur-3999/smart-shopper.git
cd smart-shopper
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file and add your API keys
nano .env  # or use any text editor
```

Fill in the following required fields in your `.env` file:

```
SERPAPI_API_KEY=your_serpapi_key_here
SEARCH1_API_KEY=your_search1api_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. Install Dependencies

```bash
# Install main project dependencies
npm install

# Install MCP server dependencies
cd docs/Smart-Shopper-AI
npm install
cd ../..
```

### 4. Build MCP Servers

```bash
cd docs/Smart-Shopper-AI
npm run build
cd ../..
```

### 5. Launch Smart Shopper

Use our launcher script to configure and start everything:

```bash
node launch.js
```

This script will:
- Check for required API keys
- Verify Claude Desktop is installed
- Build MCP servers if needed
- Install the configuration for Claude Desktop
- Launch Claude Desktop with Smart Shopper MCP connections

## Using Smart Shopper

Once Claude Desktop launches, you can start shopping by:

1. Typing natural language queries like "I need running shoes under $100"
2. Watching as Claude uses the MCP tools to search for and display products
3. Following Claude's recommendations and insights
4. Refining your search with follow-up questions

## Understanding the Architecture

Smart Shopper uses a proper Model Context Protocol (MCP) implementation:

- Claude connects directly to MCP servers for each data source
- No custom UI or middleware is needed - Claude uses the tools natively
- The PLAN → tool_use → PATCH → REFLECT workflow is handled by Claude itself

If you want to understand more about the MCP implementation:
- Review `/docs/project_instructions.md`
- Check out the MCP servers in `/docs/Smart-Shopper-AI/src/mcp-servers/`

## Troubleshooting

If you encounter issues:

1. **Claude Desktop doesn't start**: Make sure Claude Desktop is installed correctly
2. **MCP tools don't appear**: Check the Claude Desktop logs in:
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\Logs\mcp*.log`
3. **API errors**: Verify your API keys are correctly set in the `.env` file

For more help, see the [Smart Shopper documentation](./docs/GETTING_STARTED.md).
