# Smart Shopper - Claude MCP Shopping Assistant

## Overview

Smart Shopper is an AI-powered shopping assistant that transforms a simple chat interface into a comprehensive product research and recommendation system. Users can describe what they're looking for, and the app will:

1. Research products from multiple sources
2. Enrich results with additional context
3. Rank products using custom scoring criteria
4. Present results visually on an interactive canvas
5. All within a strict 1-second performance target

## Features

- **Natural Language Shopping**: Describe what you want in plain English
- **Multi-Source Search**: Combines results from Google Shopping (SerpAPI), Search1API, and more
- **Rich Visual Results**: Interactive product cards with prices, ratings, and images
- **AI Recommendations**: Intelligently highlights the best products for your needs
- **Sub-Second Performance**: Results appear in under 1 second

## Architecture

Smart Shopper is built on Anthropic's Model Context Protocol (MCP) architecture, which enables Claude to communicate directly with specialized servers:

- **MCP Client**: Claude acts as the MCP client
- **MCP Servers**: Custom servers for each data source and UI operation
- **No Middleware**: Direct communication rather than traditional API wrappers

### Key MCP Tools

1. **serpapi_search**: Fetches product results from Google Shopping
2. **search1_query**: Queries an Elastic product index with filters
3. **perplexity_search**: Enriches product data with additional context
4. **multi_source_search**: Aggregates results from multiple sources
5. **Canvas Operations**: `add_card`, `update_grid`, `highlight_choice`, and `undo_last`

### Workflow Pattern

All operations follow the PLAN → tool_use → PATCH → REFLECT workflow:

1. **PLAN**: Claude outlines steps and selects appropriate tools
2. **tool_use**: Execute up to 3 tools concurrently for efficiency
3. **PATCH**: Update the canvas or files with new information
4. **REFLECT**: Self-critique and improve approach if needed

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- API keys for:
  - Claude API
  - SerpAPI
  - Search1API
  - Perplexity API

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jamesmcarthur-3999/smart-shopper.git
   cd smart-shopper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your API keys.

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser to http://localhost:3001

### API Keys

You'll need to obtain API keys from the following services:

- Claude API: https://console.anthropic.com/keys
- SerpAPI: https://serpapi.com/dashboard
- Perplexity: https://www.perplexity.ai/settings/api
- Search1API: From your Search1 provider

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the server with nodemon for automatic reloading.

### File Structure

- `/public`: Client-side assets and application
- `/scripts`: Server utility scripts
- `/docs`: Project documentation
- `/server.js`: Main server implementation
- `/docs/Smart-Shopper-AI`: Reference MCP server implementations

## Troubleshooting

### Common Issues

1. **Authentication Errors (401)**:
   - Make sure your API keys are correctly set in the `.env` file
   - Check that your Claude API key has sufficient permissions

2. **"I couldn't connect to Claude's API" message**:
   - Verify the Claude API key is valid
   - Check your network connection

3. **Slow or missing product results**:
   - Verify SerpAPI and Search1API keys
   - Check console logs for specific error messages

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the terms specified in [LICENSE](./LICENSE).
