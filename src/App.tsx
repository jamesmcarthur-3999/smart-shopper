import React, { useState, useEffect, useCallback } from 'react';
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

interface EnrichmentItem {
  topic: string;
  content: string;
  sources?: string[];
}

interface GridLayout {
  columns: number;
  rows?: number;
  gap?: string;
  itemWidth?: string;
  itemHeight?: string;
}

// Canvas Operations Interfaces
interface AddCardOperation {
  op: 'add_card';
  id: string;
  title: string; 
  price: string;
  img_url?: string;
  source: string;
  link?: string;
  rating?: number;
  reviews_count?: number;
  description?: string;
  metadata?: Record<string, any>;
}

interface UpdateGridOperation {
  op: 'update_grid';
  items: string[]; // Array of product card IDs to display
  layout?: GridLayout;
}

interface HighlightChoiceOperation {
  op: 'highlight_choice';
  id: string;
  reason?: string;
}

interface UndoLastOperation {
  op: 'undo_last';
  n?: number;
}

type CanvasOperation = 
  | AddCardOperation
  | UpdateGridOperation
  | HighlightChoiceOperation
  | UndoLastOperation;

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichment, setEnrichment] = useState<EnrichmentItem[]>([]);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [highlightReason, setHighlightReason] = useState<string | null>(null);
  const [gridLayout, setGridLayout] = useState<GridLayout>({ columns: 3 });
  const [displayedProductIds, setDisplayedProductIds] = useState<string[]>([]);
  const [operationHistory, setOperationHistory] = useState<CanvasOperation[]>([]);

  // Handle canvas operations
  const processCanvasOperation = useCallback((operation: CanvasOperation) => {
    // Add operation to history for undo capability
    setOperationHistory(prev => [...prev, operation]);
    
    switch (operation.op) {
      case 'add_card':
        // Check if product already exists, update it if it does
        setProducts(prev => {
          const existingIndex = prev.findIndex(p => p.id === operation.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              id: operation.id,
              title: operation.title,
              price: operation.price,
              img_url: operation.img_url,
              source: operation.source,
              link: operation.link,
              rating: operation.rating,
              reviews_count: operation.reviews_count
            };
            return updated;
          } else {
            // Add new product
            return [...prev, {
              id: operation.id,
              title: operation.title,
              price: operation.price,
              img_url: operation.img_url,
              source: operation.source,
              link: operation.link,
              rating: operation.rating,
              reviews_count: operation.reviews_count
            }];
          }
        });
        break;
        
      case 'update_grid':
        // Update displayed product IDs
        setDisplayedProductIds(operation.items);
        
        // Update grid layout if provided
        if (operation.layout) {
          setGridLayout(operation.layout);
        }
        break;
        
      case 'highlight_choice':
        // Highlight a product
        setHighlightedProductId(operation.id);
        setHighlightReason(operation.reason || null);
        break;
        
      case 'undo_last':
        // Undo the last n operations
        const n = operation.n || 1;
        setOperationHistory(prev => {
          const newHistory = [...prev];
          newHistory.splice(-n); // Remove the last n operations (including this undo op)
          return newHistory;
        });
        // TODO: Implement actual state reversal based on operation history
        break;
    }
  }, []);

  // Filtered products based on displayed IDs
  const filteredProducts = displayedProductIds.length > 0
    ? products.filter(p => displayedProductIds.includes(p.id))
    : products;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setProducts([]);
    setEnrichment([]);
    setHighlightedProductId(null);
    setHighlightReason(null);
    
    try {
      console.log('Searching for:', query);
      // Call the multi-source MCP tool
      const response = await axios.post('/api/mcp/multi_source_search', {
        query,
        sources: ['serpapi', 'search1', 'perplexity'],
        max_results: 12,
        sort_by: 'relevance'
      });
      
      console.log('Search response:', response.data);
      
      if (response.data.results) {
        setProducts(response.data.results);
        // By default, display all products
        setDisplayedProductIds(response.data.results.map((p: Product) => p.id));
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

  // Dynamic grid columns based on layout
  const gridClass = `grid-cols-1 md:grid-cols-${Math.min(gridLayout.columns, 2)} lg:grid-cols-${gridLayout.columns}`;

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
      {enrichment && enrichment.length > 0 && (
        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Product Insights</h2>
          {enrichment.map((item, index) => (
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
      <div className={`product-grid grid ${gridClass} gap-6`}>
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${
              highlightedProductId === product.id 
                ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50' 
                : 'border-gray-200'
            }`}
          >
            {highlightedProductId === product.id && highlightReason && (
              <div className="bg-blue-100 text-blue-800 text-sm p-2 rounded mb-2">
                {highlightReason}
              </div>
            )}
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
      
      {/* Empty State */}
      {products.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-12">
          <p>Search for products to see results here</p>
        </div>
      )}
    </div>
  );
};

export default App;