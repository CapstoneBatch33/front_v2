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

    console.log(`Getting system status from: ${server_address}`)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock system status with agricultural AI models
    const mockSystemStatus = {
      timestamp: new Date().toISOString(),
      total_clients: 2,
      active_clients: 2,
      total_models_deployed: 4,
      active_tasks: 0,
      completed_tasks: 12,
      available_models: ["llama-3.2-11b-vision", "dhenu2-1b-instruct", "dhenu2-3b-instruct", "dhenu2-8b-instruct", "yolo-v8"],
      clients: [
        {
          client_id: "client-001-gaming-laptop",
          hostname: "gaming-laptop",
          ip_address: "192.168.1.101",
          performance_score: 85.2,
          deployed_models: ["dhenu2-8b-instruct", "llama-3.2-11b-vision"],
          current_tasks: 0,
          last_seen: Date.now() / 1000,
          status: "online",
          specs: {
            cpu_cores: 8,
            cpu_frequency_ghz: 3.2,
            ram_gb: 32,
            gpu_info: "NVIDIA RTX 4080",
            gpu_memory_gb: 16,
            os_info: "Windows 11",
            performance_score: 85.2
          }
        },
        {
          client_id: "client-002-work-laptop",
          hostname: "work-laptop",
          ip_address: "192.168.1.102",
          performance_score: 45.8,
          deployed_models: ["dhenu2-1b-instruct", "yolo-v8"],
          current_tasks: 0,
          last_seen: Date.now() / 1000,
          status: "online",
          specs: {
            cpu_cores: 4,
            cpu_frequency_ghz: 2.8,
            ram_gb: 16,
            gpu_info: "Intel Integrated",
            gpu_memory_gb: 0,
            os_info: "Windows 11",
            performance_score: 45.8
          }
        }
      ]
    }
    
    const mockModels = [
      {
        model_name: "llama-3.2-11b-vision",
        model_type: "huggingface",
        status: "running",
        endpoint_url: "http://192.168.1.101:8001",
        client_id: "client-001-gaming-laptop",
        performance_score: 85.2
      },
      {
        model_name: "dhenu2-1b-instruct",
        model_type: "huggingface",
        status: "running",
        endpoint_url: "http://192.168.1.102:8002",
        client_id: "client-002-work-laptop",
        performance_score: 45.8
      },
      {
        model_name: "dhenu2-3b-instruct",
        model_type: "huggingface",
        status: "not_deployed",
        endpoint_url: "",
        client_id: "",
        performance_score: 0
      },
      {
        model_name: "dhenu2-8b-instruct",
        model_type: "huggingface",
        status: "running",
        endpoint_url: "http://192.168.1.101:8004",
        client_id: "client-001-gaming-laptop",
        performance_score: 85.2
      },
      {
        model_name: "yolo-v8",
        model_type: "pytorch",
        status: "running",
        endpoint_url: "http://192.168.1.102:8081",
        client_id: "client-002-work-laptop",
        performance_score: 45.8
      }
    ]
    
    return NextResponse.json({
      success: true,
      status: mockSystemStatus,
      models: mockModels
    })
    
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get system status' 
    }, { status: 500 })
  }
}

async function callPythonGRPCClient(action: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), '..', 'scripts', 'grpc_bridge.py')
    
    // Try to use virtual environment python first
    const pythonCommands = [
      path.join(process.cwd(), '..', 'venv', 'bin', 'python'),
      path.join(process.cwd(), '..', 'venv', 'Scripts', 'python.exe'),
      'python3',
      'python'
    ]
    
    let pythonCmd = 'python3'
    for (const cmd of pythonCommands) {
      try {
        if (require('fs').existsSync(cmd)) {
          pythonCmd = cmd
          break
        }
      } catch (e) {}
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