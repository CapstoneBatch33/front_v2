import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { server_address } = await request.json()
    
    if (!server_address) {
      return NextResponse.json({ 
        success: false, 
        error: 'Server address is required' 
      }, { status: 400 })
    }

    // Call Python gRPC client for health check
    const result = await callPythonGRPCClient('health', { server_address })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to load balancer' 
    }, { status: 500 })
  }
}

async function callPythonGRPCClient(action: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Path to your Python gRPC client script
    const pythonScript = path.join(process.cwd(), '..', 'scripts', 'grpc_bridge.py')
    
    // Try to use virtual environment python first, then fallback to system python
    const pythonCommands = [
      path.join(process.cwd(), '..', 'venv', 'bin', 'python'),  // Linux venv
      path.join(process.cwd(), '..', 'venv', 'Scripts', 'python.exe'),  // Windows venv
      'python3',  // System python3
      'python'    // System python
    ]
    
    let pythonCmd = 'python3'  // Default fallback
    
    // Find the first available python command
    for (const cmd of pythonCommands) {
      try {
        if (require('fs').existsSync(cmd)) {
          pythonCmd = cmd
          break
        }
      } catch (e) {
        // Continue to next option
      }
    }
    
    const python = spawn(pythonCmd, [pythonScript, action, JSON.stringify(params)], {
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), '..'),
        PATH: process.env.PATH
      }
    })
    
    let stdout = ''
    let stderr = ''
    
    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${stdout}`))
        }
      } else {
        reject(new Error(`Python script failed: ${stderr}`))
      }
    })
    
    python.on('error', (error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`))
    })
  })
}