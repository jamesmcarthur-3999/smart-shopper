import React, { useState } from 'react';
import axios from 'axios';

interface Product {
  id: string;
  title: string;
  price: string;
  img_url?: string;
  source: string;
  link?: string;
  rating?: number;
  reviews_count?: number;
}

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichment, setEnrichment] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the multi-source MCP tool
      const response = await axios.post('/api/mcp/multi_source_search', {
        query,
        sources: ['serpapi', 'search1', 'perplexity'],
        max_results: 12,
        sort_by: 'relevance'
      });
      
      if (response.data.results) {
        setProducts(response.data.results);
      }
      
      if (response.data.enrichment) {
        setEnrichment(response.data.enrichment);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center text-blue-600">Smart Shopper</h1>
        <p className="text-center text-gray-600">AI-powered shopping assistant</p>
      </header>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex w-full max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're looking for..."
            className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="text-red-600 text-center mb-4">{error}</div>
      )}
      
      {/* Product Enrichment Section */}
      {enrichment && (
        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Product Insights</h2>
          {enrichment.map((item: any, index: number) => (
            <div key={`enrichment-${index}`} className="mb-3">
              <h3 className="font-medium">{item.topic}</h3>
              <p className="text-sm">{item.content}</p>
              {item.sources && item.sources.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Source: <a href={item.sources[0]} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">{item.sources[0]}</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Product Grid */}
      <div className="product-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div
            key={product.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="h-40 bg-gray-100 flex items-center justify-center mb-4">
              {product.img_url ? (
                <img
                  src={product.img_url}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-400">No image available</div>
              )}
            </div>
            <h3 className="font-medium text-lg mb-2">{product.title}</h3>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-bold">{product.price}</span>
              <span className="text-gray-500 text-sm">{product.source}</span>
            </div>
            {product.rating && (
              <div className="mt-2 text-sm text-gray-600">
                Rating: {product.rating} ({product.reviews_count || 0} reviews)
              </div>
            )}
            {product.link && (
              <div className="mt-3">
                <a 
                  href={product.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  View product
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {products.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-12">
          <p>Search for products to see results here</p>
        </div>
      )}
    </div>
  );
};

export default App;
