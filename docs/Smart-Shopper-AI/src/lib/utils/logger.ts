/**
 * Smart Shopper AI - Logger Utility
 * 
 * This file contains a centralized logging utility using pino.
 */

import pino from 'pino';

// Get environment variables
const logLevel = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';

// Create the logger instance
const logger = pino({
  level: logLevel,
  transport: isProduction
    ? undefined 
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
  base: undefined,
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

/**
 * Creates a child logger with a specific component context
 * 
 * @param component - The component name to tag logs with
 * @returns A child logger instance
 */
export function createLogger(component: string) {
  return logger.child({ component });
}

export default logger;
