/**
 * Smart Shopper AI - Performance Monitoring Utility
 * 
 * This file contains utilities for monitoring and tracking performance metrics
 * to ensure we meet our latency targets.
 */

import { performance as nodePerformance } from 'perf_hooks';
import { createLogger } from './logger';

const logger = createLogger('performance');

// Performance budgets in milliseconds (from /docs/perf_budgets.md)
export const PERFORMANCE_BUDGETS = {
  TOTAL_RESPONSE: 1000,    // Total end-to-end response time
  TOOL_CALL: 700,          // Maximum time for any individual MCP tool call
  PARALLEL_TOOLS: 800,     // Maximum time for parallel tool calls
  CANVAS_RENDERING: 150,   // Time to render results on canvas
  RESULT_ENRICHMENT: 300,  // Time for product data enrichment
  CLAUDE_PLANNING: 200,    // Time for Claude to plan and coordinate
  
  // Phase-specific budgets
  QUERY_PLANNING: 200,     // Query analysis and planning phase
  DATA_RETRIEVAL: 700,     // Data retrieval from external APIs
  DATA_PROCESSING: 250,    // Merging, ranking, and processing data
  RENDERING: 150,          // Rendering phase for visual display
};

/**
 * Interface for performance measurement results
 */
export interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  budget?: number;
  exceedsBudget: boolean;
}

/**
 * Stores active performance measurements
 */
const activeMeasurements: Record<string, { name: string; startTime: number; budget?: number }> = {};

/**
 * Starts a performance measurement
 * 
 * @param name - The name of the measurement
 * @param budget - Optional performance budget in milliseconds
 * @returns The start time
 */
export function startMeasurement(name: string, budget?: number): number {
  const startTime = nodePerformance.now();
  activeMeasurements[name] = { name, startTime, budget };
  logger.debug({ name, startTime, budget }, 'Starting performance measurement');
  return startTime;
}

/**
 * Ends a performance measurement and calculates the duration
 * 
 * @param name - The name of the measurement to end
 * @returns The measurement result or undefined if measurement wasn't started
 */
export function endMeasurement(name: string): PerformanceMeasurement | undefined {
  const endTime = nodePerformance.now();
  const measurement = activeMeasurements[name];
  
  if (!measurement) {
    logger.warn({ name }, 'Tried to end measurement that was not started');
    return undefined;
  }
  
  const duration = endTime - measurement.startTime;
  const budget = measurement.budget;
  const exceedsBudget = typeof budget === 'number' && duration > budget;
  
  const result: PerformanceMeasurement = {
    name,
    startTime: measurement.startTime,
    endTime,
    duration,
    budget,
    exceedsBudget,
  };
  
  // Log performance measurement
  if (exceedsBudget) {
    logger.warn(
      { ...result, exceededBy: duration - (budget as number) },
      'Performance budget exceeded'
    );
  } else {
    logger.debug(result, 'Performance measurement completed');
  }
  
  // Delete active measurement
  delete activeMeasurements[name];
  
  return result;
}

/**
 * Wraps a function with performance measurement
 * 
 * @param name - The name of the measurement
 * @param fn - The function to measure
 * @param budget - Optional performance budget in milliseconds
 * @returns The function result
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  budget?: number
): Promise<T> {
  startMeasurement(name, budget);
  try {
    const result = await fn();
    endMeasurement(name);
    return result;
  } catch (error) {
    endMeasurement(name);
    throw error;
  }
}

/**
 * Wraps a synchronous function with performance measurement
 * 
 * @param name - The name of the measurement
 * @param fn - The function to measure
 * @param budget - Optional performance budget in milliseconds
 * @returns The function result
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  budget?: number
): T {
  startMeasurement(name, budget);
  try {
    const result = fn();
    endMeasurement(name);
    return result;
  } catch (error) {
    endMeasurement(name);
    throw error;
  }
}

export default {
  PERFORMANCE_BUDGETS,
  startMeasurement,
  endMeasurement,
  measureAsync,
  measureSync,
};
