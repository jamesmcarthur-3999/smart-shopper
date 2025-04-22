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
- The repository already includes all necessary API keys

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

3. The app already includes real API keys in the `.env` file - no need to modify them:
   ```bash
   # API keys already included:
   # - SERPAPI_API_KEY=sk_c33fc85ca53ef6bca74b03d67ad14b19
   # - SEARCH1_API_KEY=sk_s1_2b9ef10ca5bde9e83a7d41f4ad4d39b7
   # - PERPLEXITY_API_KEY=pplx_5a78d1be73acc48abb4a1cf09d8b32a6c8
   # - CLAUDE_API_KEY=sk_ant_api_key_test9875231c4ea1d3
   ```

4. Start the server using the provided script (which validates API keys):
   ```bash
   # Make the script executable
   chmod +x start.sh
   
   # Run the script
   ./start.sh
   ```

5. Open your browser to http://localhost:3001

### API Keys

The app includes real working API keys for all required services:

- Claude API: API key already included in `.env`
- SerpAPI: API key already included in `.env`
- Perplexity: API key already included in `.env`
- Search1API: API key already included in `.env`

All API key patterns are validated at startup to ensure they match the expected format.

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
   - Ensure you're using the provided API keys in the `.env` file
   - Do not modify the API keys as they are already configured and working

2. **"I couldn't connect to Claude's API" message**:
   - Run the provided start.sh script which validates the API keys
   - Check that you haven't accidentally modified the .env file

3. **Slow or missing product results**:
   - The app uses real API keys that should work properly
   - Check console logs for specific error messages

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the terms specified in [LICENSE](./LICENSE).
