const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const ClaudeClient = require('./scripts/claude-client');
const util = require('util');

// Load environment variables
dotenv.config();

// Ensure API keys are properly loaded
const requiredKeys = ['SERPAPI_API_KEY', 'SEARCH1_API_KEY', 'PERPLEXITY_API_KEY', 'CLAUDE_API_KEY'];
const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
  console.warn(`⚠️ Missing API keys: ${missingKeys.join(', ')}`);
}

// Enable more detailed logging in development mode
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
  console.log('Running in development mode with enhanced logging');
}

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// API Keys from environment
const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const SEARCH1_KEY = process.env.SEARCH1_API_KEY;
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Log partial API keys for debugging (only in development)
if (isDev) {
  console.log('REAL API Keys configured from .env file:');
  console.log(`- SERPAPI_KEY: ${SERPAPI_KEY ? (SERPAPI_KEY.substring(0, 5) + '...' + SERPAPI_KEY.substring(SERPAPI_KEY.length - 3)) : 'MISSING'}`);
  console.log(`- SEARCH1_KEY: ${SEARCH1_KEY ? (SEARCH1_KEY.substring(0, 5) + '...' + SEARCH1_KEY.substring(SEARCH1_KEY.length - 3)) : 'MISSING'}`);
  console.log(`- PERPLEXITY_KEY: ${PERPLEXITY_KEY ? (PERPLEXITY_KEY.substring(0, 5) + '...' + PERPLEXITY_KEY.substring(PERPLEXITY_KEY.length - 3)) : 'MISSING'}`);
  console.log(`- CLAUDE_API_KEY: ${CLAUDE_API_KEY ? (CLAUDE_API_KEY.substring(0, 5) + '...' + CLAUDE_API_KEY.substring(CLAUDE_API_KEY.length - 3)) : 'MISSING'}`);
  
  // Validate that we're using real keys, not placeholders
  const realKeyPatterns = {
    SERPAPI_KEY: /^sk_c/,
    SEARCH1_KEY: /^sk_s1_/,
    PERPLEXITY_KEY: /^pplx_/,
    CLAUDE_API_KEY: /^sk_ant/
  };
  
  let usingRealKeys = true;
  Object.entries(realKeyPatterns).forEach(([key, pattern]) => {
    const value = eval(key);
    if (!value || !pattern.test(value)) {
      console.error(`⚠️ The ${key} doesn't match the expected pattern for a real key`);
      usingRealKeys = false;
    }
  });
  
  if (usingRealKeys) {
    console.log('✅ Using REAL API keys from .env file, not placeholders');
  } else {
    console.error('❌ Some API keys appear to be placeholders! Check your .env file');
  }
}

// API Endpoints
const SERPAPI_ENDPOINT = process.env.SERPAPI_ENDPOINT || 'https://serpapi.com/search';
const SEARCH1_ENDPOINT = process.env.SEARCH1_ENDPOINT || 'https://api.search1.com/search';
const PERPLEXITY_ENDPOINT = process.env.PERPLEXITY_ENDPOINT || 'https://api.perplexity.ai/search';

// Initialize Claude client with detailed error handling
try {
  var claudeClient = new ClaudeClient({
    apiKey: CLAUDE_API_KEY,
    maxTokens: 1024,
    model: 'claude-3-sonnet-20240229' // Explicitly set model version
  });
  console.log('Claude client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Claude client:', error);
  claudeClient = null;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance monitoring
const startTime = new Map();

app.use((req, res, next) => {
  startTime.set(req.url, Date.now());
  next();
});

app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(...args) {
    const duration = Date.now() - startTime.get(req.url);
    console.log(`Request to ${req.url} took ${duration}ms`);
    return originalSend.apply(res, args);
  };
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SerpAPI MCP Tool
app.post('/api/mcp/serpapi_search', async (req, res) => {
  try {
    const { query, num_results = 10, fields = 'price,title,img_url,source,link', no_cache = false } = req.body;
    
    // Log request
    console.log(`SerpAPI search: ${query}`);
    console.log(`Using SerpAPI key: ${SERPAPI_KEY.substring(0, 5)}...`);
    
    // Build SerpAPI request params
    const params = {
      q: query,
      engine: 'google_shopping',
      api_key: SERPAPI_KEY,
      num: num_results,
      no_cache: no_cache
    };
    
    // Make API request to SerpAPI with timeout to ensure p95 latency ≤ 1 second
    const response = await axios.get(SERPAPI_ENDPOINT, { 
      params,
      timeout: 950 // 950ms timeout to ensure we stay under 1s total latency
    });
    
    // Transform response to match our expected format
    const results = response.data.shopping_results || [];
    const transformedResults = results.map((item, index) => ({
      id: `serp_${index + 1}`,
      title: item.title,
      price: item.price,
      img_url: item.thumbnail,
      source: 'SerpAPI',
      link: item.link,
      rating: item.rating,
      reviews_count: item.reviews
    }));
    
    // Send response
    res.json({
      status: 'success',
      results: transformedResults,
      metadata: {
        total_results: response.data.search_information?.total_results || results.length,
        engine: 'google_shopping',
        cached: !no_cache
      }
    });
  } catch (error) {
    console.error('Error in SerpAPI MCP tool:', error);
    // Send error response with appropriate status code
    res.status(error.response?.status || 500).json({ 
      error: 'MCP_001: SerpAPI request failed',
      details: error.message
    });
  }
});

// Search1API MCP Tool
app.post('/api/mcp/search1_query', async (req, res) => {
  try {
    const { q, filters = {}, facets = [], boost = null } = req.body;
    
    // Log request
    console.log(`Search1API query: ${q}`);
    console.log(`Using Search1API key: ${SEARCH1_KEY.substring(0, 5)}...`);
    
    // Build Search1API request body
    const requestBody = {
      query: q,
      filters,
      facets,
      boost,
      api_key: SEARCH1_KEY
    };
    
    // Make API request to Search1API with timeout
    const response = await axios.post(SEARCH1_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEARCH1_KEY}`
      },
      timeout: 950 // 950ms timeout
    });
    
    // Transform response to match our expected format
    const results = response.data.hits || [];
    const transformedResults = results.map((item, index) => ({
      id: `search1_${index + 1}`,
      title: item.title || item.name,
      price: item.price_formatted || `$${item.price}`,
      img_url: item.image_url || item.thumbnail,
      source: 'Search1API',
      link: item.product_url || item.url,
      rating: item.rating,
      reviews_count: item.reviews_count || item.review_count
    }));
    
    // Extract facets from response
    const transformedFacets = {};
    if (response.data.facets) {
      Object.keys(response.data.facets).forEach(facetName => {
        transformedFacets[facetName] = response.data.facets[facetName].map(f => ({
          value: f.value,
          count: f.count
        }));
      });
    }
    
    // Send response
    res.json({
      status: 'success',
      results: transformedResults,
      facets: transformedFacets
    });
  } catch (error) {
    console.error('Error in Search1API MCP tool:', error);
    res.status(error.response?.status || 500).json({ 
      error: 'MCP_005: Search1API request failed',
      details: error.message
    });
  }
});

// Perplexity MCP Tool
app.post('/api/mcp/perplexity_search', async (req, res) => {
  try {
    const { 
      query, 
      model = 'sonar-small-online', 
      context_size = 'medium', 
      domain_filter = [] 
    } = req.body;
    
    // Log request
    console.log(`Perplexity search: ${query}`);
    console.log(`Using Perplexity key: ${PERPLEXITY_KEY.substring(0, 5)}...`);
    
    // Build Perplexity request body
    const requestBody = {
      query,
      model,
      context_size,
      domain_filter
    };
    
    // Make API request to Perplexity with timeout
    const response = await axios.post(PERPLEXITY_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_KEY}`
      },
      timeout: 950 // 950ms timeout
    });
    
    // Transform response into enrichment format
    const enrichment = [];
    
    if (response.data.answer) {
      // Extract product features from the answer
      enrichment.push({
        topic: 'Product Features',
        content: response.data.answer.text.substring(0, 200), // Limit to avoid overly long content
        sources: response.data.answer.web_search_citations || []
      });
    }
    
    if (response.data.topics) {
      response.data.topics.forEach(topic => {
        enrichment.push({
          topic: topic.name,
          content: topic.summary || topic.description,
          sources: topic.sources || []
        });
      });
    }
    
    // If enrichment is still empty, create a default entry
    if (enrichment.length === 0 && response.data) {
      enrichment.push({
        topic: 'Product Information',
        content: 'Information about this product category is limited. Consider trying a more specific search.',
        sources: []
      });
    }
    
    // Add recommendations if available
    const recommendations = [];
    if (response.data.recommendations) {
      response.data.recommendations.forEach((rec, index) => {
        recommendations.push({
          id: `pplx_${index + 1}`,
          title: rec.title || rec.name,
          reasons: rec.reasons || [rec.description || 'Recommended based on your search']
        });
      });
    }
    
    // Send response
    res.json({
      status: 'success',
      results: {
        query,
        enrichment,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error in Perplexity MCP tool:', error);
    res.status(error.response?.status || 500).json({ 
      error: 'MCP_009: Perplexity request failed',
      details: error.message
    });
  }
});

// Multi-source search MCP Tool
app.post('/api/mcp/multi_source_search', async (req, res) => {
  try {
    const { 
      query, 
      sources = ['serpapi', 'search1', 'perplexity'], 
      max_results = 20, 
      sort_by = 'relevance' 
    } = req.body;
    
    // Log request
    console.log(`Multi-source search: ${query} (sources: ${sources.join(', ')})`);
    
    // Create parallel requests to appropriate endpoints
    const requests = [];
    
    if (sources.includes('serpapi')) {
      requests.push(axios.post('http://localhost:' + PORT + '/api/mcp/serpapi_search', { 
        query, 
        num_results: max_results 
      }).catch(error => {
        console.error('SerpAPI search failed:', error.message);
        return { data: { results: [] } }; // Return empty results on error
      }));
    }
    
    if (sources.includes('search1')) {
      requests.push(axios.post('http://localhost:' + PORT + '/api/mcp/search1_query', { 
        q: query 
      }).catch(error => {
        console.error('Search1API query failed:', error.message);
        return { data: { results: [] } }; // Return empty results on error
      }));
    }
    
    if (sources.includes('perplexity')) {
      requests.push(axios.post('http://localhost:' + PORT + '/api/mcp/perplexity_search', { 
        query 
      }).catch(error => {
        console.error('Perplexity search failed:', error.message);
        return { data: { results: { enrichment: [] } } }; // Return empty enrichment on error
      }));
    }
    
    // Combine results from all sources with timeout to ensure p95 latency ≤ 1 second
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: exceeded 950ms')), 950);
    });
    
    Promise.race([Promise.all(requests), timeoutPromise])
      .then(responses => {
        // Combine and process results
        const combinedResults = {
          status: 'success',
          query: query,
          results: [],
          enrichment: null,
          facets: {}
        };
        
        // Process each source response
        responses.forEach(response => {
          const data = response.data;
          
          // Add product results
          if (data.results && Array.isArray(data.results)) {
            combinedResults.results.push(...data.results);
          }
          
          // Add enrichment if available
          if (data.results && data.results.enrichment) {
            combinedResults.enrichment = data.results.enrichment;
          }
          
          // Add facets if available
          if (data.facets) {
            Object.assign(combinedResults.facets, data.facets);
          }
        });
        
        // Sort results based on sort_by parameter
        if (sort_by === 'price_asc') {
          combinedResults.results.sort((a, b) => {
            const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
            const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
            return priceA - priceB;
          });
        } else if (sort_by === 'price_desc') {
          combinedResults.results.sort((a, b) => {
            const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
            const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
            return priceB - priceA;
          });
        } else if (sort_by === 'rating') {
          combinedResults.results.sort((a, b) => {
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            return ratingB - ratingA;
          });
        }
        
        // Limit to max_results
        combinedResults.results = combinedResults.results.slice(0, max_results);
        
        res.json(combinedResults);
      })
      .catch(error => {
        console.error('Error in multi-source search:', error);
        res.status(500).json({ 
          error: 'MCP_013: Multi-source search failed',
          details: error.message
        });
      });
  } catch (error) {
    console.error('Error in multi-source search setup:', error);
    res.status(500).json({ 
      error: 'MCP_013: Multi-source search failed',
      details: error.message
    });
  }
});

// Canvas Operations MCP Tool
app.post('/api/mcp/canvas_ops', async (req, res) => {
  try {
    const operation = req.body;
    
    // Log the operation
    console.log(`Canvas operation received: ${operation.op}`);
    
    // Validate operation type
    if (!operation.op) {
      return res.status(400).json({
        error: 'MCP_020: Invalid canvas operation',
        details: 'Operation type (op) is required'
      });
    }
    
    // Process operation based on type
    switch (operation.op) {
      case 'add_card':
        // Validate required fields
        if (!operation.id || !operation.title || !operation.price || !operation.source) {
          return res.status(400).json({
            error: 'MCP_021: Invalid add_card operation',
            details: 'Missing required fields (id, title, price, source)'
          });
        }
        break;
        
      case 'update_grid':
        // Validate required fields
        if (!operation.items || !Array.isArray(operation.items)) {
          return res.status(400).json({
            error: 'MCP_022: Invalid update_grid operation',
            details: 'Missing or invalid items array'
          });
        }
        break;
        
      case 'highlight_choice':
        // Validate required fields
        if (!operation.id) {
          return res.status(400).json({
            error: 'MCP_023: Invalid highlight_choice operation',
            details: 'Missing required field (id)'
          });
        }
        break;
        
      case 'undo_last':
        // No validation needed
        break;
        
      default:
        return res.status(400).json({
          error: 'MCP_024: Unknown canvas operation',
          details: `Operation type '${operation.op}' is not supported`
        });
    }
    
    // Return success response
    // In a full implementation, this would update some server-side state
    // or trigger other side effects based on the operation
    res.json({
      status: 'success',
      operation: operation.op,
      message: 'Canvas operation processed successfully'
    });
  } catch (error) {
    console.error('Error in canvas operations MCP tool:', error);
    res.status(500).json({
      error: 'MCP_025: Canvas operation failed',
      details: error.message
    });
  }
});

// Claude AI Assistant MCP Tool
app.post('/api/mcp/claude_assist', async (req, res) => {
  try {
    const { query, products, enrichment, context } = req.body;
    
    // Log request
    console.log(`Claude assistance request for query: ${query}`);
    
    // Check if Claude client is properly initialized
    if (!claudeClient || !CLAUDE_API_KEY) {
      console.warn('Claude client not available, using fallback response');
      
      // Return a helpful error response with HTTP 401 Unauthorized
      return res.status(401).json({
        error: 'MCP_031: Claude API authentication failed',
        details: 'API key missing or invalid. Please check your CLAUDE_API_KEY environment variable.',
        fallback: {
          query,
          insights: [
            {
              type: 'error',
              content: `I couldn't connect to Claude's API to analyze these products. Here's a simple overview instead.`
            },
            {
              type: 'summary',
              content: `Based on your search for \"${query}\", I found ${products?.length || 0} products with an average price of ${calculateAveragePrice(products)}.`
            }
          ],
          canvas_operations: [
            {
              op: 'update_grid',
              items: products?.map(p => p.id) || [],
              layout: {
                columns: 3,
                gap: '1rem'
              }
            }
          ]
        }
      });
    }
    
    // Log detailed request in development mode
    if (isDev) {
      console.log('Claude request details:');
      console.log(`- Query: \"${query}\"`);
      console.log(`- Products: ${products?.length || 0} items`);
      console.log(`- Enrichment: ${enrichment?.length || 0} items`);
    }
    
    // Use Claude client to get shopping assistance
    try {
      const assistResponse = await claudeClient.getShoppingAssistance({
        query,
        products,
        enrichment,
        context
      });
      
      console.log('Claude API request successful');
      
      // Send Claude's response
      return res.json({
        status: 'success',
        response: assistResponse
      });
    } catch (claudeError) {
      console.error('Error calling Claude API:', claudeError);
      
      // Determine appropriate status code
      let statusCode = 500;
      if (claudeError.response) {
        statusCode = claudeError.response.status;
        if (isDev) {
          console.error('Claude API error response:', claudeError.response.data);
        }
      }
      
      // Return error with appropriate status
      return res.status(statusCode).json({
        error: 'MCP_032: Claude API request failed',
        details: claudeError.message,
        statusCode
      });
    }
  } catch (error) {
    console.error('Error in Claude AI Assistant MCP tool:', error);
    res.status(500).json({ 
      error: 'MCP_030: Claude assistance request failed',
      details: error.message
    });
  }
});

// Helper functions for Claude AI Assistant
function calculateAveragePrice(products) {
  if (!products || products.length === 0) {
    return '$0.00';
  }
  
  const prices = products.map(p => parseFloat(p.price.replace(/[^0-9.]/g, '')))
    .filter(price => !isNaN(price));
    
  if (prices.length === 0) {
    return '$0.00';
  }
  
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  return `$${avgPrice.toFixed(2)}`;
}

function getMostCommonSource(products) {
  if (!products || products.length === 0) {
    return 'unknown sources';
  }
  
  const sourceCounts = {};
  products.forEach(p => {
    if (p.source) {
      sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
    }
  });
  
  let mostCommonSource = null;
  let highestCount = 0;
  
  Object.keys(sourceCounts).forEach(source => {
    if (sourceCounts[source] > highestCount) {
      mostCommonSource = source;
      highestCount = sourceCounts[source];
    }
  });
  
  return mostCommonSource || 'unknown sources';
}

// Catch-all route to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Smart Shopper MCP server running on port ${PORT}`);
  console.log(`API Keys configured: ${Boolean(SERPAPI_KEY)} | ${Boolean(SEARCH1_KEY)} | ${Boolean(PERPLEXITY_KEY)} | ${Boolean(CLAUDE_API_KEY)}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});