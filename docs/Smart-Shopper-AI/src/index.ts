/**
 * Smart Shopper AI - Main Entry Point
 * 
 * This is the main entry point for the Smart Shopper AI application,
 * which orchestrates the various Model Context Protocol servers.
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { createLogger } from './lib/utils';

// Load environment variables
dotenv.config();

const logger = createLogger('smart-shopper');
const servers: Record<string, ChildProcess> = {};

/**
 * Server configuration
 */
interface ServerConfig {
  name: string;
  path: string;
  port: number;
  env?: Record<string, string>;
}

/**
 * Available MCP servers
 */
const SERVERS: ServerConfig[] = [
  {
    name: 'serpapi',
    path: path.join(__dirname, 'mcp-servers/serpapi'),
    port: 3001,
  },
  {
    name: 'search1api',
    path: path.join(__dirname, 'mcp-servers/search1api'),
    port: 3002,
  },
  {
    name: 'perplexity',
    path: path.join(__dirname, 'mcp-servers/perplexity'),
    port: 3003,
  },
  {
    name: 'multi-source',
    path: path.join(__dirname, 'mcp-servers/multi-source'),
    port: 3004,
  },
];

/**
 * Start a server
 * 
 * @param config - Server configuration
 * @returns Promise that resolves when server is started
 */
function startServer(config: ServerConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info({ server: config.name }, 'Starting server');
    
    // Merge environment variables
    const env = {
      ...process.env,
      PORT: String(config.port),
      ...(config.env || {}),
    };
    
    // Start server process
    const server = spawn('node', [config.path], {
      env,
      stdio: 'pipe',
    });
    
    servers[config.name] = server;
    
    // Handle process events
    server.stdout.on('data', (data) => {
      logger.info({ server: config.name }, data.toString().trim());
    });
    
    server.stderr.on('data', (data) => {
      logger.error({ server: config.name }, data.toString().trim());
    });
    
    server.on('error', (error) => {
      logger.error({ server: config.name, error }, 'Server error');
      reject(error);
    });
    
    server.on('exit', (code, signal) => {
      if (code !== 0) {
        logger.error({ server: config.name, code, signal }, 'Server exited with non-zero code');
      } else {
        logger.info({ server: config.name }, 'Server exited');
      }
      
      delete servers[config.name];
    });
    
    // Give some time for the server to start
    setTimeout(() => {
      if (server.killed) {
        reject(new Error(`Server ${config.name} failed to start`));
      } else {
        logger.info({ server: config.name, port: config.port }, 'Server started');
        resolve();
      }
    }, 1000);
  });
}

/**
 * Stop a server
 * 
 * @param name - Server name
 */
function stopServer(name: string): void {
  const server = servers[name];
  
  if (!server) {
    return;
  }
  
  logger.info({ server: name }, 'Stopping server');
  
  try {
    server.kill();
  } catch (error) {
    logger.error({ server: name, error }, 'Error stopping server');
  }
}

/**
 * Stop all servers
 */
function stopAllServers(): void {
  Object.keys(servers).forEach(stopServer);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting Smart Shopper AI');
    
    // Check for required environment variables
    const requiredEnvVars = ['SERPAPI_API_KEY', 'SEARCH1_API_KEY', 'PPLX_API_KEY'];
    const missingEnvVars = requiredEnvVars.filter(name => !process.env[name]);
    
    if (missingEnvVars.length > 0) {
      logger.error({ missingEnvVars }, 'Missing required environment variables');
      process.exit(1);
    }
    
    // Start each server sequentially
    for (const server of SERVERS) {
      await startServer(server);
    }
    
    logger.info('All servers started successfully');
    
    // Handle process termination
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down');
      stopAllServers();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down');
      stopAllServers();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ error }, 'Error starting Smart Shopper AI');
    stopAllServers();
    process.exit(1);
  }
}

// Start the application
main();
