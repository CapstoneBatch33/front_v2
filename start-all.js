const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Function to log with timestamp and color
function logWithColor(text, color) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${text}${colors.reset}`);
}

// Check if Python is installed
function checkPythonInstalled() {
  try {
    const pythonProcess = spawn('python', ['--version']);
    pythonProcess.on('error', (err) => {
      logWithColor('Python is not installed or not in PATH. Please install Python 3.x', colors.red);
      process.exit(1);
    });
    return true;
  } catch (error) {
    logWithColor('Python is not installed or not in PATH. Please install Python 3.x', colors.red);
    process.exit(1);
  }
}

// Start Next.js development server
function startNextJS() {
  logWithColor('Starting Next.js development server...', colors.green);
  
  const nextProcess = spawn('npm', ['run', 'dev'], { 
    shell: true,
    stdio: 'pipe'
  });
  
  nextProcess.stdout.on('data', (data) => {
    logWithColor(`Next.js: ${data}`, colors.green);
  });
  
  nextProcess.stderr.on('data', (data) => {
    logWithColor(`Next.js Error: ${data}`, colors.red);
  });
  
  nextProcess.on('close', (code) => {
    logWithColor(`Next.js process exited with code ${code}`, colors.yellow);
  });
  
  return nextProcess;
}

// Start Node.js backend server
function startNodeServer() {
  logWithColor('Starting Node.js backend server...', colors.blue);
  
  const nodeProcess = spawn('node', ['server.js'], { 
    shell: true,
    stdio: 'pipe'
  });
  
  nodeProcess.stdout.on('data', (data) => {
    logWithColor(`Node Server: ${data}`, colors.blue);
  });
  
  nodeProcess.stderr.on('data', (data) => {
    logWithColor(`Node Server Error: ${data}`, colors.red);
  });
  
  nodeProcess.on('close', (code) => {
    logWithColor(`Node.js process exited with code ${code}`, colors.yellow);
  });
  
  return nodeProcess;
}

// Start Python sensor simulator
function startSensorSimulator() {
  logWithColor('Starting Python sensor simulator...', colors.magenta);
  
  const pythonProcess = spawn('python', ['data/sensor_sim.py'], { 
    shell: true,
    stdio: 'pipe'
  });
  
  pythonProcess.stdout.on('data', (data) => {
    logWithColor(`Sensor Simulator: ${data}`, colors.magenta);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    logWithColor(`Sensor Simulator Error: ${data}`, colors.red);
  });
  
  pythonProcess.on('close', (code) => {
    logWithColor(`Sensor simulator process exited with code ${code}`, colors.yellow);
  });
  
  return pythonProcess;
}

// Start Python API server
function startPythonAPI() {
  logWithColor('Starting Python API server...', colors.cyan);
  
  const pythonProcess = spawn('python', ['data/sensor_api.py'], { 
    shell: true,
    stdio: 'pipe'
  });
  
  pythonProcess.stdout.on('data', (data) => {
    // Only log non-empty lines
    if (data.toString().trim()) {
      logWithColor(`Python API: ${data}`, colors.cyan);
    }
  });
  
  pythonProcess.stderr.on('data', (data) => {
    const message = data.toString();
    // Only log actual errors, not access logs
    if (!message.includes('" 200 -')) {
      logWithColor(`Python API Error: ${message}`, colors.red);
    }
  });
  
  pythonProcess.on('close', (code) => {
    logWithColor(`Python API process exited with code ${code}`, colors.yellow);
  });
  
  return pythonProcess;
}

// Main function to start all services
function startAllServices() {
  logWithColor('Starting all services...', colors.yellow);
  
  // Check if Python is installed
  checkPythonInstalled();
  
  // Start all services
  const pythonAPI = startPythonAPI();
  const sensorSim = startSensorSimulator();
  const nodeServer = startNodeServer();
  const nextJS = startNextJS();
  
  // Handle process termination
  process.on('SIGINT', () => {
    logWithColor('Shutting down all services...', colors.yellow);
    
    pythonAPI.kill();
    sensorSim.kill();
    nodeServer.kill();
    nextJS.kill();
    
    process.exit(0);
  });
}

// Start everything
startAllServices();