/**
 * Type definitions for Smart Shopper canvas operations
 * 
 * These types reflect the operations described in §5 of the Project Instructions
 * Last updated: 2025-04-21
 */

export interface ProductCard {
  /** Unique identifier for the card */
  id: string;
  
  /** Product title */
  title: string;
  
  /** Product price as formatted string */
  price: string;
  
  /** URL of the product image */
  img_url: string;
  
  /** Source of the product information */
  source: string;
  
  /** Optional product description */
  description?: string;
  
  /** Optional product rating (0-5) */
  rating?: number;
  
  /** Optional product review count */
  review_count?: number;
  
  /** Optional additional attributes as key-value pairs */
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Add a product card to the canvas
 */
export interface AddCardOp {
  type: 'add_card';
  
  /** Card data */
  card: ProductCard;
}

/**
 * Canvas grid layout options
 */
export type GridLayout = 'list' | 'grid' | 'comparison' | 'gallery';

/**
 * Update the canvas grid layout
 */
export interface UpdateGridOp {
  type: 'update_grid';
  
  /** Array of item IDs to include in the grid */
  items: string[];
  
  /** Grid layout type */
  layout: GridLayout;
}

/**
 * Highlight a product as selected/recommended
 */
export interface HighlightChoiceOp {
  type: 'highlight_choice';
  
  /** ID of the product to highlight */
  id: string;
}

/**
 * Undo the last n canvas operations
 */
export interface UndoLastOp {
  type: 'undo_last';
  
  /** Number of operations to undo */
  n: number;
}

/**
 * Union type for all canvas operations
 */
export type CanvasOperation = 
  | AddCardOp
  | UpdateGridOp
  | HighlightChoiceOp
  | UndoLastOp;

/**
 * Canvas state interface
 */
export interface CanvasState {
  /** Map of product cards by ID */
  cards: Record<string, ProductCard>;
  
  /** Current grid layout */
  layout: GridLayout;
  
  /** Current ordered list of item IDs in the grid */
  grid: string[];
  
  /** Currently highlighted item ID, if any */
  highlighted?: string;
  
  /** Stack of operations for undo */
  operationStack: CanvasOperation[];
}
