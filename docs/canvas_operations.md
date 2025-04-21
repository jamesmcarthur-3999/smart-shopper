# Canvas Operations Guide

Canvas Operations provide a structured way to manipulate the Smart Shopper product display programmatically. This guide explains how to use Canvas Operations with the Claude AI integration.

## Overview

The Canvas is the visual area where products are displayed to the user. Canvas Operations allow structured manipulation of this display area through well-defined operations rather than direct DOM manipulation.

## Available Operations

Smart Shopper supports these Canvas Operations:

### 1. `add_card`

Adds a new product card to the canvas or updates an existing one.

```json
{
  "op": "add_card",
  "id": "product_123",
  "title": "Wireless Headphones",
  "price": "$129.99",
  "img_url": "https://example.com/headphones.jpg",
  "source": "SerpAPI",
  "link": "https://example.com/buy-headphones",
  "rating": 4.5,
  "reviews_count": 256
}
```

**Required fields**: `id`, `title`, `price`, `source`  
**Optional fields**: `img_url`, `link`, `rating`, `reviews_count`, `description`, `metadata`

### 2. `update_grid`

Updates the grid layout and controls which products are displayed.

```json
{
  "op": "update_grid",
  "items": ["product_123", "product_456", "product_789"],
  "layout": {
    "columns": 3,
    "gap": "1rem"
  }
}
```

**Required fields**: `items` (array of product IDs)  
**Optional fields**: `layout` (object with grid configuration)

### 3. `highlight_choice`

Highlights a specific product as the recommended choice.

```json
{
  "op": "highlight_choice",
  "id": "product_123",
  "reason": "Best value for money with highest customer satisfaction"
}
```

**Required fields**: `id` (product ID to highlight)  
**Optional fields**: `reason` (text explaining why this product is highlighted)

### 4. `undo_last`

Undoes the last N canvas operations.

```json
{
  "op": "undo_last",
  "n": 2
}
```

**Required fields**: none  
**Optional fields**: `n` (number of operations to undo, defaults to 1)

## Using Canvas Operations with Claude AI

The Claude AI Assistant can generate Canvas Operations based on product data and user queries. The typical flow is:

1. User submits a natural language query
2. Multi-source search retrieves product data
3. Claude analyzes the data and generates Canvas Operations
4. Frontend executes these operations to update the display

Example Claude response with Canvas Operations:

```json
{
  "query": "noise cancelling headphones under $200",
  "insights": [
    {
      "type": "summary",
      "content": "Found 12 noise cancelling headphones under $200, with prices ranging from $89.99 to $199.99."
    }
  ],
  "canvas_operations": [
    {
      "op": "update_grid",
      "items": ["headphone_1", "headphone_2", "headphone_3", "headphone_4", "headphone_5", "headphone_6"],
      "layout": {
        "columns": 3
      }
    },
    {
      "op": "highlight_choice",
      "id": "headphone_3",
      "reason": "Best balance of noise cancellation quality and battery life in your budget"
    }
  ]
}
```

## Implementation Details

The Canvas Operations API endpoint is at `/api/mcp/canvas_ops`. It validates operations and returns a success or error response. The frontend processes these operations using the `processCanvasOperation` function.

## Best Practices

1. **Use stable IDs**: Ensure product IDs remain stable across multiple searches and sessions
2. **Minimal payloads**: Include only the necessary fields for each operation
3. **Progressive enhancement**: Start with the basic display and enhance with operations
4. **Error handling**: Always handle potential failures in Canvas Operations

## Debugging Canvas Operations

Canvas Operations can be debugged by:

1. Viewing the operation history in the React component state
2. Checking the network requests to `/api/mcp/canvas_ops`
3. Monitoring the console for operation-specific logs

_Last updated: 2025-04-21_
