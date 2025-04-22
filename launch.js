/**
 * Smart Shopper Launcher
 * 
 * This script launches the Smart Shopper environment with proper MCP server connections.
 * It starts all required MCP servers and opens Claude Desktop with the correct configuration.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  }
};

// Log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check if Claude Desktop is installed
function checkClaudeDesktop() {
  return new Promise((resolve) => {
    if (process.platform === 'darwin') {
      // macOS
      exec('ls /Applications | grep Claude.app', (error, stdout) => {
        resolve(!error && stdout.includes('Claude.app'));
      });
    } else if (process.platform === 'win32') {
      // Windows
      exec('dir "%LOCALAPPDATA%\\Programs\\Claude" /b', (error, stdout) => {
        resolve(!error && stdout.includes('Claude.exe'));
      });
    } else {
      // Linux or other platforms
      log('Claude Desktop is not officially supported on this platform.', colors.fg.yellow);
      resolve(false);
    }
  });
}

// Check for required environment variables
function checkEnvironmentVariables() {
  const requiredVars = [
    'SERPAPI_API_KEY',
    'SEARCH1_API_KEY',
    'PERPLEXITY_API_KEY',
    'CLAUDE_API_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    log(`Missing required environment variables: ${missing.join(', ')}`, colors.fg.red);
    log('Please add these variables to your .env file.', colors.fg.yellow);
    return false;
  }
  
  return true;
}

// Ensure the MCP servers are built
function buildMcpServers() {
  return new Promise((resolve, reject) => {
    log('Building MCP servers...', colors.fg.cyan);
    
    const build = spawn('npm', ['run', 'build'], {
      cwd: path.join(__dirname, 'docs', 'Smart-Shopper-AI'),
      shell: true
    });
    
    build.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    build.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    build.on('close', (code) => {
      if (code === 0) {
        log('MCP servers built successfully!', colors.fg.green);
        resolve();
      } else {
        log(`MCP server build failed with code ${code}`, colors.fg.red);
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

// Copy config file to Claude Desktop config location
function installConfigFile() {
  return new Promise((resolve, reject) => {
    const sourcePath = path.join(__dirname, 'claude_desktop_config.json');
    let destPath;
    
    if (process.platform === 'darwin') {
      // macOS
      destPath = path.join(process.env.HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    } else if (process.platform === 'win32') {
      // Windows
      destPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
    } else {
      // Linux or other platforms
      log('Cannot determine config location for this platform.', colors.fg.yellow);
      reject(new Error('Unsupported platform'));
      return;
    }
    
    // Ensure the target directory exists
    const targetDir = path.dirname(destPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      log(`Claude Desktop configuration installed to ${destPath}`, colors.fg.green);
      resolve();
    } catch (error) {
      log(`Error installing config file: ${error.message}`, colors.fg.red);
      reject(error);
    }
  });
}

// Launch Claude Desktop
function launchClaudeDesktop() {
  return new Promise((resolve) => {
    let claudePath;
    
    if (process.platform === 'darwin') {
      // macOS
      claudePath = '/Applications/Claude.app/Contents/MacOS/Claude';
    } else if (process.platform === 'win32') {
      // Windows
      claudePath = '%LOCALAPPDATA%\\Programs\\Claude\\Claude.exe';
    } else {
      // Linux or other platforms
      log('Claude Desktop is not officially supported on this platform.', colors.fg.yellow);
      resolve(false);
      return;
    }
    
    log('Launching Claude Desktop...', colors.fg.cyan);
    
    const claude = spawn(claudePath, [], {
      detached: true,
      stdio: 'ignore',
      shell: true
    });
    
    claude.unref();
    log('Claude Desktop launched!', colors.fg.green);
    resolve(true);
  });
}

// Main function
async function main() {
  log('\n╔════════════════════════════════════════════╗', colors.fg.cyan);
  log('║       Smart Shopper Launcher                ║', colors.fg.cyan);
  log('╚════════════════════════════════════════════╝\n', colors.fg.cyan);
  
  // Check environment variables
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }
  
  // Check for Claude Desktop
  const hasClaudeDesktop = await checkClaudeDesktop();
  if (!hasClaudeDesktop) {
    log('Claude Desktop not found. Please install it first.', colors.fg.red);
    log('Download from: https://claude.ai/desktop', colors.fg.yellow);
    process.exit(1);
  }
  
  try {
    // Build MCP servers
    await buildMcpServers();
    
    // Install config file
    await installConfigFile();
    
    // Launch Claude Desktop
    await launchClaudeDesktop();
    
    log('\n✓ Smart Shopper is ready to use!', colors.fg.green + colors.bright);
    log('  Open Claude Desktop and start your shopping experience.', colors.fg.green);
    log('  The MCP servers will be automatically connected.\n', colors.fg.green);
    
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, colors.fg.red);
    process.exit(1);
  }
}

// Run the main function
main();
