/**
 * Kill processes using specific ports
 * 
 * This script finds and terminates any processes using 
 * port 3000 (React app) and 3001 (API server) before starting
 */

const { execSync } = require('child_process');

// Ports to check and kill
const PORTS = [3000, 3001];

console.log('🔍 Checking for processes using ports 3000 and 3001...');

PORTS.forEach(port => {
  try {
    // Find process ID using the port
    // Using different commands for macOS and Linux/Windows
    let cmd;
    if (process.platform === 'darwin') {
      // macOS
      cmd = `lsof -i :${port} -t`;
    } else if (process.platform === 'win32') {
      // Windows
      cmd = `netstat -ano | findstr :${port}`;
    } else {
      // Linux
      cmd = `lsof -i :${port} -t`;
    }

    const result = execSync(cmd, { encoding: 'utf8' }).trim();
    
    if (result) {
      const pids = result.split('\n');
      
      pids.forEach(pid => {
        if (pid) {
          console.log(`🛑 Killing process ${pid} using port ${port}`);
          try {
            if (process.platform === 'win32') {
              execSync(`taskkill /F /PID ${pid}`);
            } else {
              execSync(`kill -9 ${pid}`);
            }
            console.log(`✅ Process ${pid} killed successfully`);
          } catch (error) {
            console.error(`❌ Failed to kill process ${pid}: ${error.message}`);
          }
        }
      });
    } else {
      console.log(`✓ No process found using port ${port}`);
    }
  } catch (error) {
    // If the execSync command fails, it means no process is using the port
    console.log(`✓ No process found using port ${port}`);
  }
});

console.log('✅ Port check complete. Safe to start the application.');