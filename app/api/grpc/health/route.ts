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
    // Path to your Python gRPC client script (adjust based on your project structure)
    const pythonScript = path.join(process.cwd(), '..', 'scripts', 'grpc_bridge.py')
    
    const python = spawn('python3', [pythonScript, action, JSON.stringify(params)])
    
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