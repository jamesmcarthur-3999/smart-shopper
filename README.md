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

3. Create a `.env` file with your API keys (you can use the provided `.env.example` as a template):
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your actual API keys.

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser to http://localhost:3001

### API Keys

You'll need to obtain and configure API keys for the following services:

- **Claude API**: Get from [Anthropic Console](https://console.anthropic.com/)
- **SerpAPI**: Sign up at [SerpAPI](https://serpapi.com/)
- **Perplexity API**: Get from [Perplexity API](https://docs.perplexity.ai/)
- **Search1API**: For development, the app will use JSONPlaceholder if this API is unavailable

For local development, the app includes fallback mock data mechanisms if APIs are unavailable.

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
   - Check that you have valid API keys in your `.env` file
   - Ensure the keys match the expected formats (see `.env.example`)

2. **"I couldn't connect to Claude's API" message**:
   - Verify your Claude API key is correctly formatted and active

3. **Search1API connection errors**:
   - The app now uses JSONPlaceholder as a fallback for development

4. **Slow or missing product results**:
   - Check console logs for specific error messages
   - In development mode, the app will provide mock data when APIs fail

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the terms specified in [LICENSE](./LICENSE).
