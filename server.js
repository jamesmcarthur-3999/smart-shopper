const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// API Keys from environment
const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const SEARCH1_KEY = process.env.SEARCH1_API_KEY;
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;

// API Endpoints
const SERPAPI_ENDPOINT = process.env.SERPAPI_ENDPOINT;
const SEARCH1_ENDPOINT = process.env.SEARCH1_ENDPOINT;
const PERPLEXITY_ENDPOINT = process.env.PERPLEXITY_ENDPOINT;

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
    
    // Mock response for now (would be actual API call)
    const mockResponse = {
      status: 'success',
      results: [
        {
          id: 'serp_1',
          title: 'Example Product 1',
          price: '$99.99',
          img_url: 'https://example.com/img1.jpg',
          source: 'SerpAPI',
          link: 'https://example.com/product1'
        },
        {
          id: 'serp_2',
          title: 'Example Product 2',
          price: '$149.99',
          img_url: 'https://example.com/img2.jpg',
          source: 'SerpAPI',
          link: 'https://example.com/product2'
        }
      ],
      metadata: {
        total_results: 100,
        engine: 'google_shopping',
        cached: !no_cache
      }
    };
    
    // Simulate API response time
    setTimeout(() => {
      res.json(mockResponse);
    }, 150); // 150ms delay
  } catch (error) {
    console.error('Error in SerpAPI MCP tool:', error);
    res.status(500).json({ error: 'MCP_001: SerpAPI request failed' });
  }
});

// Search1API MCP Tool
app.post('/api/mcp/search1_query', async (req, res) => {
  try {
    const { q, filters = {}, facets = [], boost = null } = req.body;
    
    // Log request
    console.log(`Search1API query: ${q}`);
    
    // Mock response for now
    const mockResponse = {
      status: 'success',
      results: [
        {
          id: 'search1_1',
          title: 'Premium Product A',
          price: '$129.99',
          img_url: 'https://example.com/premium1.jpg',
          source: 'Search1API',
          link: 'https://example.com/premium1',
          rating: 4.7,
          reviews_count: 128
        },
        {
          id: 'search1_2',
          title: 'Premium Product B',
          price: '$89.99',
          img_url: 'https://example.com/premium2.jpg',
          source: 'Search1API',
          link: 'https://example.com/premium2',
          rating: 4.5,
          reviews_count: 94
        }
      ],
      facets: {
        brand: [
          { value: 'BrandA', count: 24 },
          { value: 'BrandB', count: 18 }
        ],
        price_range: [
          { value: 'Under $50', count: 12 },
          { value: '$50-$100', count: 45 },
          { value: 'Over $100', count: 67 }
        ]
      }
    };
    
    // Simulate API response time
    setTimeout(() => {
      res.json(mockResponse);
    }, 120); // 120ms delay
  } catch (error) {
    console.error('Error in Search1API MCP tool:', error);
    res.status(500).json({ error: 'MCP_005: Search1API request failed' });
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
    
    // Mock response for now
    const mockResponse = {
      status: 'success',
      results: {
        query: query,
        enrichment: [
          {
            topic: 'Product Features',
            content: 'This product category typically features high-durability materials, water resistance up to 30 meters, and battery life ranging from 10-14 hours of continuous use.',
            sources: [
              'https://example.com/product-guide'
            ]
          },
          {
            topic: 'Consumer Reviews',
            content: 'Recent consumer surveys show 87% satisfaction with products in this category, with particular emphasis on ease-of-use and value for money.',
            sources: [
              'https://example.com/consumer-report-2024'
            ]
          }
        ],
        recommendations: [
          {
            id: 'pplx_1',
            title: 'Most Recommended Option',
            reasons: ['Best value for money', 'Highest customer satisfaction']
          }
        ]
      }
    };
    
    // Simulate API response time
    setTimeout(() => {
      res.json(mockResponse);
    }, 180); // 180ms delay
  } catch (error) {
    console.error('Error in Perplexity MCP tool:', error);
    res.status(500).json({ error: 'MCP_009: Perplexity request failed' });
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
      }));
    }
    
    if (sources.includes('search1')) {
      requests.push(axios.post('http://localhost:' + PORT + '/api/mcp/search1_query', { 
        q: query 
      }));
    }
    
    if (sources.includes('perplexity')) {
      requests.push(axios.post('http://localhost:' + PORT + '/api/mcp/perplexity_search', { 
        query 
      }));
    }
    
    // Combine results from all sources
    Promise.all(requests)
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
        res.status(500).json({ error: 'MCP_013: Multi-source search failed' });
      });
  } catch (error) {
    console.error('Error in multi-source search setup:', error);
    res.status(500).json({ error: 'MCP_013: Multi-source search failed' });
  }
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Smart Shopper MCP server running on port ${PORT}`);
  console.log(`API Keys configured: ${Boolean(SERPAPI_KEY)} | ${Boolean(SEARCH1_KEY)} | ${Boolean(PERPLEXITY_KEY)}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
