/**
 * Type definitions for Smart Shopper canvas operations
 * These operations are used to manipulate the visual product display
 */

/**
 * Product card data structure
 */
export interface ProductCard {
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

/**
 * Layout configuration for grid display
 */
export interface GridLayout {
  columns: number;
  rows?: number;
  gap?: string;
  itemWidth?: string;
  itemHeight?: string;
}

/**
 * Add a product card to the canvas
 */
export interface AddCardOperation {
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

/**
 * Update the grid layout and displayed items
 */
export interface UpdateGridOperation {
  op: 'update_grid';
  items: string[]; // Array of product card IDs to display
  layout?: GridLayout;
}

/**
 * Highlight a specific product card as the recommended choice
 */
export interface HighlightChoiceOperation {
  op: 'highlight_choice';
  id: string; // Product card ID to highlight
  reason?: string; // Optional reason for highlighting this choice
}

/**
 * Undo the last N canvas operations
 */
export interface UndoLastOperation {
  op: 'undo_last';
  n?: number; // Number of operations to undo (default: 1)
}

/**
 * Union type of all canvas operations
 */
export type CanvasOperation = 
  | AddCardOperation
  | UpdateGridOperation
  | HighlightChoiceOperation
  | UndoLastOperation;
