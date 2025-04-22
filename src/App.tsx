import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Type definitions
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

// Claude Assistant Response Interface
interface ClaudeAssistResponse {
  query: string;
  recommendations: Array<{
    id: string;
    content: string;
  }>;
  insights: Array<{
    type: string;
    content: string;
  }>;
  canvas_operations: CanvasOperation[];
}

// Message Types for Chat Interface
type MessageType = 'user' | 'assistant' | 'plan' | 'tool' | 'reflect' | 'product-display';

interface Message {
  id: string;
  type: MessageType;
  content: string | React.ReactNode;
  timestamp: Date;
}

interface ProductDisplayMessage extends Message {
  type: 'product-display';
  products: Product[];
  highlightedProductId?: string;
  highlightReason?: string;
  gridLayout: GridLayout;
}

const App: React.FC = () => {
  // State for chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for products and canvas
  const [products, setProducts] = useState<Product[]>([]);
  const [enrichment, setEnrichment] = useState<EnrichmentItem[]>([]);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [highlightReason, setHighlightReason] = useState<string | null>(null);
  const [gridLayout, setGridLayout] = useState<GridLayout>({ columns: 3 });
  const [displayedProductIds, setDisplayedProductIds] = useState<string[]>([]);
  const [operationHistory, setOperationHistory] = useState<CanvasOperation[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add a welcome message when the component mounts
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      content: 'Hello! I\'m your Smart Shopper assistant. Describe what you\'re looking for, and I\'ll help you find the best products.',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Execute canvas operation
  const executeCanvasOperation = useCallback(async (operation: CanvasOperation) => {
    try {
      // Call the canvas operations MCP tool
      await axios.post('/api/mcp/canvas_ops', operation);
      
      // Process the operation locally
      processCanvasOperation(operation);
    } catch (error) {
      console.error('Error executing canvas operation:', error);
    }
  }, [processCanvasOperation]);

  // Add a PLAN message to the chat
  const addPlanMessage = (planContent: string) => {
    const planMessage: Message = {
      id: `plan-${Date.now()}`,
      type: 'plan',
      content: planContent,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, planMessage]);
  };

  // Add a tool usage message to the chat
  const addToolMessage = (toolName: string, params: any) => {
    const toolMessage: Message = {
      id: `tool-${Date.now()}`,
      type: 'tool',
      content: (
        <div>
          <div className="font-medium">Using tool: {toolName}</div>
          <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(params, null, 2)}
          </pre>
        </div>
      ),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, toolMessage]);
  };

  // Add a product display message to the chat
  const addProductDisplayMessage = (displayedProducts: Product[]) => {
    if (displayedProducts.length === 0) return;
    
    const productMessage: ProductDisplayMessage = {
      id: `products-${Date.now()}`,
      type: 'product-display',
      content: 'Product Results:',
      products: displayedProducts,
      highlightedProductId: highlightedProductId || undefined,
      highlightReason: highlightReason || undefined,
      gridLayout,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, productMessage]);
  };

  // Add a REFLECT message to the chat
  const addReflectMessage = (reflectContent: string) => {
    const reflectMessage: Message = {
      id: `reflect-${Date.now()}`,
      type: 'reflect',
      content: reflectContent,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, reflectMessage]);
  };

  // Process search query
  const handleSearch = async (query: string) => {
    setIsLoading(true);
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: query,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add PLAN message
    addPlanMessage(
      `I'll help you find ${query}. I'll search for products, analyze the results, and recommend the best options.`
    );
    
    try {
      // Add tool usage message
      addToolMessage('multi_source_search', {
        query,
        sources: ['serpapi', 'search1', 'perplexity'],
        max_results: 12
      });
      
      // Call the multi-source MCP tool
      const response = await axios.post('/api/mcp/multi_source_search', {
        query,
        sources: ['serpapi', 'search1', 'perplexity'],
        max_results: 12,
        sort_by: 'relevance'
      });
      
      // Process product results
      if (response.data.results) {
        setProducts(response.data.results);
        setDisplayedProductIds(response.data.results.map((p: Product) => p.id));
        
        // Add product display to the chat
        addProductDisplayMessage(response.data.results);
      }
      
      // Process enrichment
      if (response.data.enrichment) {
        setEnrichment(response.data.enrichment);
      }
      
      // Get Claude assistance
      await getClaudeAssistance(query);
      
      // Add REFLECT message
      addReflectMessage(
        `I've found ${response.data.results?.length || 0} products matching "${query}". ` +
        `I've highlighted the best option based on price, ratings, and features.`
      );
      
    } catch (error) {
      console.error('Error processing query:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error while searching for products. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Claude AI assistance
  const getClaudeAssistance = useCallback(async (query: string) => {
    if (!query.trim() || products.length === 0) return;
    
    try {
      // Add tool usage message
      addToolMessage('claude_assist', {
        query,
        products: products.length,
        enrichment: enrichment.length
      });
      
      const response = await axios.post('/api/mcp/claude_assist', {
        query,
        products,
        enrichment,
        context: {
          displayed_products: displayedProductIds,
          grid_layout: gridLayout
        }
      });
      
      const assistResponse: ClaudeAssistResponse = response.data.response;
      
      // Add Claude's insights to the chat
      if (assistResponse.insights && assistResponse.insights.length > 0) {
        const insightsMessage: Message = {
          id: `insights-${Date.now()}`,
          type: 'assistant',
          content: assistResponse.insights.map(insight => insight.content).join('\n\n'),
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, insightsMessage]);
      }
      
      // Apply canvas operations
      if (assistResponse.canvas_operations && assistResponse.canvas_operations.length > 0) {
        // Execute each operation in sequence
        for (const op of assistResponse.canvas_operations) {
          await executeCanvasOperation(op);
          
          // If it's a highlight operation, mention it in the chat
          if (op.op === 'highlight_choice' && op.reason) {
            const highlightMessage: Message = {
              id: `highlight-${Date.now()}`,
              type: 'assistant',
              content: `I recommend this product: ${op.reason}`,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, highlightMessage]);
          }
        }
        
        // Update product display in chat
        const filteredProducts = displayedProductIds.length > 0
          ? products.filter(p => displayedProductIds.includes(p.id))
          : products;
          
        addProductDisplayMessage(filteredProducts);
      }
    } catch (error) {
      console.error('Error getting Claude assistance:', error);
    }
  }, [products, enrichment, displayedProductIds, gridLayout, executeCanvasOperation]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    handleSearch(inputValue);
    setInputValue('');
  };

  // Render product grid for product display messages
  const renderProductGrid = (message: ProductDisplayMessage) => {
    const { products, highlightedProductId, highlightReason, gridLayout } = message;
    
    // Dynamic grid columns based on layout
    const gridClass = `grid-cols-1 md:grid-cols-${Math.min(gridLayout.columns, 2)} lg:grid-cols-${gridLayout.columns}`;

    return (
      <div className={`product-grid grid ${gridClass} gap-4 mt-2`}>
        {products.map(product => (
          <div
            key={product.id}
            className={`border rounded-lg p-3 hover:shadow-lg transition-shadow ${
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
            <div className="h-32 bg-gray-100 flex items-center justify-center mb-3">
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
            <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.title}</h3>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-bold text-sm">{product.price}</span>
              <span className="text-gray-500 text-xs">{product.source}</span>
            </div>
            {product.rating && (
              <div className="mt-1 text-xs text-gray-600">
                Rating: {product.rating} ({product.reviews_count || 0} reviews)
              </div>
            )}
            {product.link && (
              <div className="mt-2">
                <a 
                  href={product.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  View product
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render individual message
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'user':
        return (
          <div className="flex justify-end mb-4">
            <div className="bg-blue-500 text-white rounded-lg py-2 px-4 max-w-[80%]">
              {message.content}
            </div>
          </div>
        );
        
      case 'assistant':
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 rounded-lg py-2 px-4 max-w-[80%]">
              {message.content}
            </div>
          </div>
        );
        
      case 'plan':
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-indigo-100 text-indigo-800 rounded-lg py-2 px-4 max-w-[80%] border-l-4 border-indigo-500">
              <div className="font-bold mb-1">PLAN</div>
              {message.content}
            </div>
          </div>
        );
        
      case 'tool':
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 text-gray-800 rounded-lg py-2 px-4 max-w-[80%] border-l-4 border-amber-500 font-mono text-sm">
              {message.content}
            </div>
          </div>
        );
        
      case 'reflect':
        return (
          <div className="flex justify-start mb-4">
            <div className="bg-green-100 text-green-800 rounded-lg py-2 px-4 max-w-[80%] border-l-4 border-green-500">
              <div className="font-bold mb-1">REFLECT</div>
              {message.content}
            </div>
          </div>
        );
        
      case 'product-display':
        const productMessage = message as ProductDisplayMessage;
        return (
          <div className="flex justify-start mb-4 w-full">
            <div className="bg-white border border-gray-200 rounded-lg py-3 px-4 max-w-full w-full">
              <div className="font-medium mb-2">Product Results</div>
              {renderProductGrid(productMessage)}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6">
        <h1 className="text-xl font-bold text-blue-600">Smart Shopper</h1>
        <p className="text-sm text-gray-600">AI-powered shopping assistant</p>
      </header>
      
      <div className="flex-grow overflow-hidden flex flex-col" ref={chatContainerRef}>
        {/* Chat messages */}
        <div className="flex-grow overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {messages.map(message => (
              <div key={message.id}>
                {renderMessage(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input area */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe what you're looking for..."
              className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Thinking...
                </span>
              ) : (
                'Send'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;