const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Configuration
const config = {
  nextjs_port: 3000,
  backend_port: 3001,
  pi_port: 5000,
  ollama_port: 11434
};

// Function to log with timestamp and color
function logWithColor(text, color) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${text}${colors.reset}`);
}

// Check if a port is available
async function checkPort(port, service) {
  try {
    const response = await axios.get(`http://localhost:${port}`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Python is installed
function checkPythonInstalled() {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['--version'], { shell: true });
    
    pythonProcess.on('error', (err) => {
      logWithColor('Python is not installed or not in PATH. Please install Python 3.x', colors.red);
      reject(false);
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        logWithColor('Python is available', colors.green);
        resolve(true);
      } else {
        logWithColor('Python check failed', colors.red);
        reject(false);
      }
    });
  });
}

// Check if Node.js dependencies are installed
function checkNodeDependencies() {
  if (!fs.existsSync('node_modules')) {
    logWithColor('Node modules not found. Please run: npm install', colors.red);
    return false;
  }
  
  if (!fs.existsSync('package.json')) {
    logWithColor('package.json not found. Please ensure you are in the correct directory', colors.red);
    return false;
  }
  
  logWithColor('Node.js dependencies are available', colors.green);
  return true;
}

// Install Python dependencies
async function installPythonDeps() {
  logWithColor('Installing Python dependencies...', colors.yellow);
  
  return new Promise((resolve, reject) => {
    const pipProcess = spawn('pip', ['install', 'flask', 'flask-cors', 'pandas'], { 
      shell: true,
      stdio: 'pipe'
    });
    
    pipProcess.stdout.on('data', (data) => {
      logWithColor(`Pip: ${data}`, colors.cyan);
    });
    
    pipProcess.stderr.on('data', (data) => {
      logWithColor(`Pip Error: ${data}`, colors.red);
    });
    
    pipProcess.on('close', (code) => {
      if (code === 0) {
        logWithColor('Python dependencies installed successfully', colors.green);
        resolve(true);
      } else {
        logWithColor('Failed to install Python dependencies', colors.red);
        reject(false);
      }
    });
  });
}

// Start Next.js development server
function startNextJS() {
  logWithColor('Starting Next.js development server...', colors.green);
  
  const nextProcess = spawn('npm', ['run', 'dev'], { 
    shell: true,
    stdio: 'pipe'
  });
  
  nextProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready') || output.includes('compiled') || output.includes('Local:')) {
      logWithColor(`Next.js: ${output.trim()}`, colors.green);
    }
  });
  
  nextProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('warn') && !error.includes('Warning')) {
      logWithColor(`Next.js Error: ${error.trim()}`, colors.red);
    }
  });
  
  nextProcess.on('close', (code) => {
    logWithColor(`Next.js process exited with code ${code}`, colors.yellow);
  });
  
  return nextProcess;
}

// Start Enhanced Node.js backend server
function startEnhancedNodeServer() {
  logWithColor('Starting Enhanced Node.js backend server...', colors.blue);
  
  const nodeProcess = spawn('node', ['enhanced_server.js'], { 
    shell: true,
    stdio: 'pipe',
    env: {
      ...process.env,
      RASPBERRY_PI_URL: `http://localhost:${config.pi_port}`,
      OLLAMA_URL: `http://localhost:${config.ollama_port}`
    }
  });
  
  nodeProcess.stdout.on('data', (data) => {
    logWithColor(`Backend: ${data.toString().trim()}`, colors.blue);
  });
  
  nodeProcess.stderr.on('data', (data) => {
    logWithColor(`Backend Error: ${data.toString().trim()}`, colors.red);
  });
  
  nodeProcess.on('close', (code) => {
    logWithColor(`Backend process exited with code ${code}`, colors.yellow);
  });
  
  return nodeProcess;
}

// Start Raspberry Pi server (local simulation)
function startPiServer() {
  logWithColor('Starting Raspberry Pi server (local simulation)...', colors.magenta);
  
  const piProcess = spawn('python', ['pi_server.py'], { 
    shell: true,
    stdio: 'pipe'
  });
  
  piProcess.stdout.on('data', (data) => {
    logWithColor(`Pi Server: ${data.toString().trim()}`, colors.magenta);
  });
  
  piProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('WARNING') && !error.includes('127.0.0.1')) {
      logWithColor(`Pi Server Error: ${error.trim()}`, colors.red);
    }
  });
  
  piProcess.on('close', (code) => {
    logWithColor(`Pi server process exited with code ${code}`, colors.yellow);
  });
  
  return piProcess;
}

// Start sensor simulator (optional)
function startSensorSimulator() {
  logWithColor('Starting sensor data simulator...', colors.cyan);
  
  // Create a simple sensor simulator
  const simulatorCode = `
import requests
import json
import time
import random
from datetime import datetime

PI_URL = "http://localhost:5000/sensor-data"

def generate_sensor_data():
    return {
        "temperature": round(random.uniform(18, 30), 1),
        "humidity": round(random.uniform(40, 80), 1),
        "soil_moisture": round(random.uniform(30, 70), 1),
        "ph_level": round(random.uniform(5.5, 7.5), 1),
        "co2": random.randint(350, 600),
        "light": random.randint(200, 1000),
        "nitrogen": random.randint(20, 80),
        "phosphorus": random.randint(10, 50),
        "potassium": random.randint(40, 120),
        "location": "ESP32 Sensor Node"
    }

def main():
    print("Starting sensor data simulator...")
    while True:
        try:
            data = generate_sensor_data()
            response = requests.post(PI_URL, json=data, timeout=5)
            if response.status_code == 200:
                print(f"Sent sensor data: {data}")
            else:
                print(f"Failed to send data: {response.status_code}")
        except Exception as e:
            print(f"Error sending data: {e}")
        
        time.sleep(30)  # Send data every 30 seconds

if __name__ == "__main__":
    main()
`;

  // Write simulator to file
  fs.writeFileSync('sensor_simulator.py', simulatorCode);
  
  const simProcess = spawn('python', ['sensor_simulator.py'], { 
    shell: true,
    stdio: 'pipe'
  });
  
  simProcess.stdout.on('data', (data) => {
    logWithColor(`Simulator: ${data.toString().trim()}`, colors.cyan);
  });
  
  simProcess.stderr.on('data', (data) => {
    logWithColor(`Simulator Error: ${data.toString().trim()}`, colors.red);
  });
  
  simProcess.on('close', (code) => {
    logWithColor(`Sensor simulator process exited with code ${code}`, colors.yellow);
  });
  
  return simProcess;
}

// Wait for service to be ready
async function waitForService(port, serviceName, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`http://localhost:${port}`, { timeout: 1000 });
      logWithColor(`${serviceName} is ready!`, colors.green);
      return true;
    } catch (error) {
      if (i === 0) {
        logWithColor(`Waiting for ${serviceName} to start...`, colors.yellow);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  logWithColor(`${serviceName} failed to start within timeout`, colors.red);
  return false;
}

// Main function to start all services
async function startAllServices() {
  logWithColor('=== Smart Farming System Startup ===', colors.white);
  
  try {
    // Check prerequisites
    logWithColor('Checking prerequisites...', colors.yellow);
    
    await checkPythonInstalled();
    
    if (!checkNodeDependencies()) {
      process.exit(1);
    }
    
    // Install Python dependencies
    try {
      await installPythonDeps();
    } catch (error) {
      logWithColor('Warning: Could not install Python dependencies automatically', colors.yellow);
      logWithColor('Please run: pip install flask flask-cors pandas', colors.yellow);
    }
    
    logWithColor('Starting services...', colors.yellow);
    
    // Start Pi server first
    const piServer = startPiServer();
    await waitForService(config.pi_port, 'Pi Server');
    
    // Start backend server
    const backendServer = startEnhancedNodeServer();
    await waitForService(config.backend_port, 'Backend Server');
    
    // Start Next.js
    const nextJS = startNextJS();
    await waitForService(config.nextjs_port, 'Next.js');
    
    // Start sensor simulator (optional)
    setTimeout(() => {
      const simulator = startSensorSimulator();
    }, 5000); // Start simulator after 5 seconds
    
    logWithColor('=== All services started successfully! ===', colors.green);
    logWithColor(`Frontend: http://localhost:${config.nextjs_port}`, colors.green);
    logWithColor(`Backend API: http://localhost:${config.backend_port}`, colors.green);
    logWithColor(`Pi Server: http://localhost:${config.pi_port}`, colors.green);
    
    // Handle process termination
    process.on('SIGINT', () => {
      logWithColor('Shutting down all services...', colors.yellow);
      
      piServer.kill();
      backendServer.kill();
      nextJS.kill();
      
      // Clean up simulator file
      if (fs.existsSync('sensor_simulator.py')) {
        fs.unlinkSync('sensor_simulator.py');
      }
      
      process.exit(0);
    });
    
  } catch (error) {
    logWithColor(`Startup failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Start everything
startAllServices();