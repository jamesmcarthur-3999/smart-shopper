/**
 * Port management script for Smart Shopper
 * This script checks if ports 3000 and 3001 are in use and kills any processes using them
 */

const { execSync } = require('child_process');
const process = require('process');
const os = require('os');

// Ports to check
const PORTS = [3000, 3001];

// Function to check if a port is in use and optionally kill the process
const checkPort = (port) => {
  try {
    console.log(`🔍 Checking for processes using ports ${PORTS.join(' and ')}...`);
    
    let cmd;
    let processInfo;
    
    // Different commands based on operating system
    if (os.platform() === 'win32') {
      // Windows
      cmd = `netstat -ano | findstr :${port}`;
      try {
        processInfo = execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      } catch (e) {
        // If the command fails, it likely means no process is using the port
        return { inUse: false, pid: null };
      }
      
      // Extract PID from the output (last column in netstat)
      const pidMatch = processInfo.match(/(\d+)$/m);
      if (pidMatch && pidMatch[1]) {
        return { inUse: true, pid: pidMatch[1] };
      }
    } else {
      // macOS, Linux, etc.
      cmd = `lsof -i:${port} -t`;
      try {
        const pid = execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
        if (pid) {
          return { inUse: true, pid };
        }
      } catch (e) {
        // If the command fails, it likely means no process is using the port
        return { inUse: false, pid: null };
      }
    }
    
    return { inUse: false, pid: null };
  } catch (error) {
    console.error(`Error checking port ${port}:`, error.message);
    return { inUse: false, pid: null, error: error.message };
  }
};

// Function to kill a process by PID
const killProcess = (pid) => {
  try {
    if (os.platform() === 'win32') {
      execSync(`taskkill /F /PID ${pid}`);
    } else {
      execSync(`kill -9 ${pid}`);
    }
    return true;
  } catch (error) {
    console.error(`Error killing process ${pid}:`, error.message);
    return false;
  }
};

// Main execution
const main = () => {
  // Check each port
  for (const port of PORTS) {
    const { inUse, pid } = checkPort(port);
    
    if (inUse && pid) {
      console.log(`⚠️ Port ${port} is in use by process ${pid}. Attempting to kill...`);
      const killed = killProcess(pid);
      if (killed) {
        console.log(`✅ Successfully killed process using port ${port}`);
      } else {
        console.error(`❌ Failed to kill process using port ${port}`);
        console.error(`   Please manually kill the process and try again.`);
        process.exit(1);
      }
    } else {
      console.log(`✓ No process found using port ${port}`);
    }
  }
  
  console.log('✅ Port check complete. Safe to start the application.');
};

// Run the script
main();
