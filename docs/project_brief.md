# Smart Shopper Project Brief

## Project Overview

Smart Shopper is an AI-powered shopping assistant that leverages Claude to deliver fast, interactive, and visually rich shopping experiences. The application enables users to describe their shopping needs in natural language and receive personalized product recommendations, comparisons, and enriched information within 1 second.

## Core Value Proposition

- **Natural Language Shopping**: Users can express complex shopping requirements conversationally
- **Sub-Second Response**: All recommendations appear within 1 second of the user query
- **Rich Visual Experience**: Products displayed in customizable, interactive layouts
- **Data-Enriched Results**: Product data enhanced with reviews, comparisons, and context
- **Zero-Friction Decision Making**: All information needed to make a purchase decision in one view

## Technical Architecture

Smart Shopper is built on a Model Context Protocol (MCP) architecture with these key components:

1. **Claude AI**: Powers natural language understanding and coordinates the shopping experience
2. **MCP Tool Stack**: Custom servers that securely access external APIs for product data
3. **Interactive Canvas**: Visual display area for product cards, comparisons, and galleries
4. **Chat Interface**: Natural language input for users to express shopping needs

## Core Functionality Requirements

### 1. Product Search & Discovery

- Natural language query parsing with intent recognition
- Multi-source product search (SerpAPI, Search1API)
- Parallel search execution for improved performance
- Result aggregation and deduplication across sources

### 2. Product Data Enrichment

- Additional context and metadata via Perplexity
- Product comparison and feature extraction
- Price analysis and value assessment
- Review sentiment analysis and summarization

### 3. Visual Presentation

- Responsive product grid with multiple view options
- Comparison tables for feature-by-feature analysis
- Visual highlighting of recommended products
- Easy navigation between different product views

### 4. User Experience

- Sub-second response time for all operations
- Clear explanations for recommendations
- Interactive refinement of search criteria
- Seamless transition from discovery to purchase

## Technical Constraints

- **Latency**: p95 response time ≤ 1 second for all operations
- **Tooling**: Exclusive use of MCP tools (no direct API calls)
- **Security**: API keys maintained via environment variables
- **Infrastructure**: Client-side rendering with server-side data fetching

## Success Metrics

- **Speed**: 95% of queries return visual results in under 1 second
- **Relevance**: Top 3 recommended products match user intent
- **Engagement**: Users receive sufficient information to make purchase decisions
- **Conversion**: Clear path to purchase for recommended products

## Development Approach

Smart Shopper follows the PLAN → tool_use → PATCH → REFLECT workflow:

1. **PLAN**: Outline steps and select appropriate tools for each user query
2. **tool_use**: Execute up to 3 parallel tool calls for optimal performance
3. **PATCH**: Update the canvas with new visual product information
4. **REFLECT**: Self-critique and refine results as needed

## Project Timeline

- **Phase 1** (Current): Core infrastructure and initial product search
- **Phase 2**: Enhanced product enrichment and comparison features
- **Phase 3**: Advanced personalization and recommendation algorithms
- **Phase 4**: Performance optimization and scaling

## Technical Documentation

Additional technical documentation can be found in:
- `/docs/project_instructions.md`: Detailed Claude implementation guide
- `/docs/tool_schemas.json`: JSON Schema definitions for all MCP tools
- `/docs/canvas_op_schema.ts`: TypeScript definitions for canvas operations
- `/docs/error_codes.md`: Error handling and retry strategies
- `/docs/perf_budgets.md`: Performance targets and budgets

_Last updated: 2025-04-21_