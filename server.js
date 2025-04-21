const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic MCP handler template
app.post('/api/mcp/:tool', async (req, res) => {
  const { tool } = req.params;
  const params = req.body;
  
  console.log(`MCP tool request: ${tool}`, params);
  
  try {
    let response;
    
    switch (tool) {
      case 'serpapi_search':
        // TODO: Implement actual SerpAPI integration
        response = { results: [] };
        break;
        
      case 'search1_query':
        // TODO: Implement actual Search1API integration
        response = { results: [] };
        break;
        
      case 'perplexity_search':
        // TODO: Implement actual Perplexity integration
        response = { results: [] };
        break;
        
      default:
        return res.status(400).json({ error: `Unsupported MCP tool: ${tool}` });
    }
    
    res.json(response);
  } catch (error) {
    console.error(`Error processing MCP tool ${tool}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Smart Shopper MCP server running on port ${PORT}`);
});
