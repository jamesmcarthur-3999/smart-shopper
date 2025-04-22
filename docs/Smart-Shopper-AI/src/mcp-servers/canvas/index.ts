/**
 * Smart Shopper AI - Canvas Operations MCP Server
 * 
 * This file implements the Model Context Protocol server for Canvas Operations,
 * which provides tools for manipulating the product display canvas.
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { z } from 'zod';
import dotenv from 'dotenv';

import { 
  createLogger,
  handleError
} from '../../lib/utils';

// Load environment variables
dotenv.config();

const logger = createLogger('canvas-server');

/**
 * Initialize the MCP server
 */
async function main() {
  // Create the server
  const server = new Server({
    name: 'canvas-operations-server',
    version: '0.1.0',
  });
  
  // Add card operation
  server.tool(
    'add_card',
    'Add or update a product card on the canvas',
    z.object({
      id: z.string().describe('Unique ID for the product card'),
      title: z.string().describe('Product title'),
      price: z.string().describe('Product price as string'),
      img_url: z.string().optional().describe('Product image URL'),
      source: z.string().describe('Source of the product data'),
      link: z.string().optional().describe('Link to the product'),
      rating: z.number().optional().describe('Product rating'),
      reviews_count: z.number().optional().describe('Number of reviews'),
      description: z.string().optional().describe('Product description'),
      metadata: z.record(z.any()).optional().describe('Additional metadata')
    }),
    async (args) => {
      try {
        logger.info({ cardId: args.id }, 'Adding/updating product card');
        
        // In a real implementation, this would communicate with the frontend
        // For now, we just log the operation and return success
        
        return {
          status: 'success',
          operation: 'add_card',
          cardId: args.id
        };
      } catch (error) {
        logger.error({ error, cardId: args.id }, 'Error in add_card operation');
        throw handleError(error, 'CNV');
      }
    }
  );
  
  // Update grid operation
  server.tool(
    'update_grid',
    'Update the product grid layout',
    z.object({
      items: z.array(z.string()).describe('Array of product IDs to display'),
      layout: z.object({
        columns: z.number().int().min(1).max(6).describe('Number of columns in the grid'),
        rows: z.number().int().min(1).optional().describe('Number of rows in the grid'),
        gap: z.string().optional().describe('Gap between grid items'),
        itemWidth: z.string().optional().describe('Width of each item'),
        itemHeight: z.string().optional().describe('Height of each item')
      }).optional().describe('Grid layout configuration')
    }),
    async (args) => {
      try {
        logger.info({ itemCount: args.items.length }, 'Updating product grid');
        
        return {
          status: 'success',
          operation: 'update_grid',
          itemCount: args.items.length
        };
      } catch (error) {
        logger.error({ error }, 'Error in update_grid operation');
        throw handleError(error, 'CNV');
      }
    }
  );
  
  // Highlight choice operation
  server.tool(
    'highlight_choice',
    'Highlight a recommended product',
    z.object({
      id: z.string().describe('ID of the product to highlight'),
      reason: z.string().optional().describe('Reason for recommending this product')
    }),
    async (args) => {
      try {
        logger.info({ productId: args.id }, 'Highlighting product choice');
        
        return {
          status: 'success',
          operation: 'highlight_choice',
          productId: args.id
        };
      } catch (error) {
        logger.error({ error, productId: args.id }, 'Error in highlight_choice operation');
        throw handleError(error, 'CNV');
      }
    }
  );
  
  // Undo last operation
  server.tool(
    'undo_last',
    'Undo the last n canvas operations',
    z.object({
      n: z.number().int().min(1).default(1).optional().describe('Number of operations to undo')
    }),
    async (args) => {
      try {
        logger.info({ count: args.n || 1 }, 'Undoing last operations');
        
        return {
          status: 'success',
          operation: 'undo_last',
          count: args.n || 1
        };
      } catch (error) {
        logger.error({ error }, 'Error in undo_last operation');
        throw handleError(error, 'CNV');
      }
    }
  );
  
  // Set up transport and start the server
  const transport = new StdioServerTransport();
  server.connect(transport);
  
  logger.info('Canvas Operations MCP server started');
}

// Start the server
main().catch((error) => {
  logger.error({ error }, 'Failed to start Canvas Operations MCP server');
  process.exit(1);
});
