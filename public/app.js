/**
 * Smart Shopper - Client-side JavaScript
 * 
 * This file implements the client-side functionality for the Smart Shopper application,
 * handling user input, MCP tool calls through the API, and canvas rendering.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const chatForm = document.getElementById('chatForm');
  const userInput = document.getElementById('userInput');
  const chatMessages = document.getElementById('chatMessages');
  const productCanvas = document.getElementById('productCanvas');
  const canvasPlaceholder = document.getElementById('canvasPlaceholder');
  
  // Store products and canvas state
  const state = {
    products: [],
    highlightedProduct: null,
    canvasLayout: {
      columns: 3,
      gap: '1rem'
    }
  };
  
  // Add event listener for form submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const query = userInput.value.trim();
    if (!query) return;
    
    // Clear input
    userInput.value = '';
    
    // Add user message to chat
    addChatMessage(query, 'user');
    
    // Show thinking indicator
    const thinkingId = showThinking();
    
    try {
      // Process the shopping request
      await processShoppingRequest(query);
    } catch (error) {
      console.error('Error processing shopping request:', error);
      addChatMessage('Sorry, I encountered an error while processing your request. Please try again.', 'assistant');
    } finally {
      // Remove thinking indicator
      hideThinking(thinkingId);
    }
  });
  
  /**
   * Process a shopping request from the user
   * 
   * @param {string} query The user's shopping query
   */
  async function processShoppingRequest(query) {
    try {
      // Start with the PLAN phase
      addChatMessage(`I'll help you find ${query}. Let me search for some options...`, 'assistant');
      
      // Use multi-source search to get product results (tool_use phase)
      const searchResponse = await axios.post('/api/mcp/multi_source_search', {
        query,
        sources: ['serpapi', 'search1', 'perplexity'],
        max_results: 12,
        sort_by: 'relevance'
      });
      
      if (!searchResponse.data || searchResponse.data.status !== 'success') {
        throw new Error('Failed to retrieve search results');
      }
      
      // Store products
      state.products = searchResponse.data.results || [];
      
      // Get enrichment data if available
      const enrichment = searchResponse.data.enrichment || [];
      
      // Get Claude assistance (REFLECT phase)
      const assistResponse = await axios.post('/api/mcp/claude_assist', {
        query,
        products: state.products,
        enrichment,
        context: { 
          preferences: {} // This could be populated with user preferences
        }
      });
      
      if (!assistResponse.data || assistResponse.data.status !== 'success') {
        throw new Error('Failed to get Claude assistance');
      }
      
      // Process Claude's response
      const claudeResponse = assistResponse.data.response;
      
      // Send Claude's insights to the chat
      if (claudeResponse.insights && claudeResponse.insights.length > 0) {
        const insightsMessage = claudeResponse.insights
          .map(insight => insight.content)
          .join('\n\n');
        
        addChatMessage(insightsMessage, 'assistant');
      } else {
        addChatMessage(`Here are some options for "${query}". Take a look at the results I found.`, 'assistant');
      }
      
      // Process canvas operations (PATCH phase)
      if (claudeResponse.canvas_operations && claudeResponse.canvas_operations.length > 0) {
        processCanvasOperations(claudeResponse.canvas_operations);
      } else {
        // Default rendering if no specific operations provided
        renderProductGrid(state.products);
      }
      
    } catch (error) {
      console.error('Error in shopping request:', error);
      throw error;
    }
  }
  
  /**
   * Process canvas operations received from Claude
   * 
   * @param {Array} operations Canvas operations to process
   */
  function processCanvasOperations(operations) {
    // Process each operation in sequence
    operations.forEach(operation => {
      switch (operation.op) {
        case 'add_card':
          addProductCard(operation);
          break;
          
        case 'update_grid':
          updateProductGrid(operation);
          break;
          
        case 'highlight_choice':
          highlightProduct(operation);
          break;
          
        case 'undo_last':
          // For simplicity, we'll just re-render the grid
          renderProductGrid(state.products);
          break;
          
        default:
          console.warn(`Unknown canvas operation: ${operation.op}`);
      }
    });
  }
  
  /**
   * Render a grid of product cards
   * 
   * @param {Array} products Array of product objects
   * @param {Object} layout Optional layout configuration
   */
  function renderProductGrid(products, layout = null) {
    // Hide placeholder if visible
    if (canvasPlaceholder) {
      canvasPlaceholder.style.display = 'none';
    }
    
    // Update layout if provided
    if (layout) {
      state.canvasLayout = {
        ...state.canvasLayout,
        ...layout
      };
    }
    
    // Clear existing content
    productCanvas.innerHTML = '';
    
    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'product-grid';
    grid.style.gridTemplateColumns = `repeat(${state.canvasLayout.columns}, 1fr)`;
    grid.style.gap = state.canvasLayout.gap;
    
    // Add products to grid
    products.forEach(product => {
      const card = createProductCard(product);
      grid.appendChild(card);
    });
    
    // Add grid to canvas
    productCanvas.appendChild(grid);
  }
  
  /**
   * Create a product card element
   * 
   * @param {Object} product Product data
   * @returns {HTMLElement} Product card element
   */
  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.id = product.id;
    
    // Check if this product should be highlighted
    if (state.highlightedProduct === product.id) {
      card.classList.add('highlighted');
    }
    
    // Create card content
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.img_url || 'placeholder.jpg'}" alt="${product.title}" onerror="this.src='placeholder.jpg'">
      </div>
      <div class="product-details">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">${product.price}</div>
        <div class="product-meta">
          ${product.rating ? `
            <div class="product-rating">
              <span>★</span>
              <span>${product.rating}</span>
            </div>
          ` : ''}
          <div class="product-source">${product.source}</div>
        </div>
        ${state.highlightedProduct === product.id && product.highlightReason ? `
          <div class="recommendation-badge">
            ${product.highlightReason}
          </div>
        ` : ''}
      </div>
    `;
    
    // Add click event to open product link if available
    if (product.link) {
      card.addEventListener('click', () => {
        window.open(product.link, '_blank');
      });
      card.style.cursor = 'pointer';
    }
    
    return card;
  }
  
  /**
   * Add a single product card to the canvas
   * 
   * @param {Object} operation Operation data
   */
  function addProductCard(operation) {
    // Hide placeholder if visible
    if (canvasPlaceholder) {
      canvasPlaceholder.style.display = 'none';
    }
    
    // Convert operation to product format
    const product = {
      id: operation.id,
      title: operation.title,
      price: operation.price,
      img_url: operation.img_url,
      source: operation.source,
      link: operation.link,
      rating: operation.rating,
      reviews_count: operation.reviews_count,
      description: operation.description
    };
    
    // Check if product already exists
    const existingIndex = state.products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      // Update existing product
      state.products[existingIndex] = {
        ...state.products[existingIndex],
        ...product
      };
    } else {
      // Add new product
      state.products.push(product);
    }
    
    // Re-render grid
    renderProductGrid(state.products);
  }
  
  /**
   * Update the product grid layout
   * 
   * @param {Object} operation Operation data
   */
  function updateProductGrid(operation) {
    // Filter products to only include those in the items array
    let productsToDisplay = state.products;
    if (operation.items && Array.isArray(operation.items)) {
      productsToDisplay = state.products.filter(p => operation.items.includes(p.id));
    }
    
    // Render grid with specified layout
    renderProductGrid(productsToDisplay, operation.layout);
  }
  
  /**
   * Highlight a recommended product
   * 
   * @param {Object} operation Operation data
   */
  function highlightProduct(operation) {
    // Update state
    state.highlightedProduct = operation.id;
    
    // Find the product
    const product = state.products.find(p => p.id === operation.id);
    if (product) {
      // Add highlight reason
      product.highlightReason = operation.reason || 'Recommended';
    }
    
    // Re-render grid to reflect changes
    renderProductGrid(state.products);
  }
  
  /**
   * Add a message to the chat display
   * 
   * @param {string} text Message text
   * @param {string} sender 'user', 'assistant', or 'system'
   */
  function addChatMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Process text to handle newlines
    contentDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  /**
   * Show thinking indicator
   * 
   * @returns {string} ID of the thinking indicator for later removal
   */
  function showThinking() {
    const id = 'thinking-' + Date.now();
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message assistant thinking';
    thinkingDiv.id = id;
    
    thinkingDiv.innerHTML = `
      <span>Thinking</span>
      <div class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;
    
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return id;
  }
  
  /**
   * Hide thinking indicator
   * 
   * @param {string} id ID of the thinking indicator to remove
   */
  function hideThinking(id) {
    const thinkingDiv = document.getElementById(id);
    if (thinkingDiv) {
      thinkingDiv.remove();
    }
  }
});
