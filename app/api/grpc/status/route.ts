import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { server_address } = await request.json()
    
    if (!server_address) {
      return NextResponse.json({ 
        success: false, 
        error: 'Server address is required' 
      }, { status: 400 })
    }

    console.log(`Getting REAL system status from: ${server_address}`)
    
    // Get real data from your Raspberry Pi using gRPC
    try {
      // First get health status
      const healthResult = await callRealGRPCClient("health_check", { server_address })
      
      if (!healthResult.success) {
        throw new Error("Health check failed")
      }
      
      // Then get available models
      const modelsResult = await callRealGRPCClient("get_models", { server_address })
      
      // Build real system status from actual Pi data
      const realSystemStatus = {
        timestamp: new Date().toISOString(),
        total_clients: 0, // Will be calculated from models
        active_clients: 0,
        total_models_deployed: modelsResult.models ? modelsResult.models.length : 0,
        active_tasks: 0,
        completed_tasks: 0, // This would need to be tracked by the Pi
        available_models: modelsResult.models ? modelsResult.models.map((m: any) => m.model_name) : [],
        clients: [] // Will be built from model data
      }
      
      // Extract unique clients from model data
      const clientsMap = new Map()
      
      if (modelsResult.models) {
        modelsResult.models.forEach((model: any) => {
          if (model.client_id && model.client_id !== "") {
            if (!clientsMap.has(model.client_id)) {
              clientsMap.set(model.client_id, {
                client_id: model.client_id,
                hostname: model.client_id.replace(/^client-\d+-/, ''), // Extract hostname from client_id
                ip_address: extractIPFromEndpoint(model.endpoint_url),
                performance_score: model.performance_score || 0,
                deployed_models: [],
                current_tasks: 0,
                last_seen: Math.floor(Date.now() / 1000),
                status: model.status === "running" ? "online" : "offline",
                specs: {
                  cpu_cores: 0, // Would need to be provided by Pi
                  cpu_frequency_ghz: 0,
                  ram_gb: 0,
                  gpu_info: "Unknown",
                  gpu_memory_gb: 0,
                  os_info: "Unknown",
                  performance_score: model.performance_score || 0
                }
              })
            }
            
            // Add model to client's deployed models
            const client = clientsMap.get(model.client_id)
            client.deployed_models.push(model.model_name)
          }
        })
      }
      
      realSystemStatus.clients = Array.from(clientsMap.values())
      realSystemStatus.total_clients = realSystemStatus.clients.length
      realSystemStatus.active_clients = realSystemStatus.clients.filter(c => c.status === "online").length
      
      return NextResponse.json({
        success: true,
        status: realSystemStatus,
        models: modelsResult.models || []
      })
      
    } catch (grpcError: any) {
      console.error('Real gRPC status check failed:', grpcError)
      
      // Return error with helpful message
      return NextResponse.json({
        success: false,
        error: `Failed to get real status from Pi: ${grpcError.message}`,
        status: {
          timestamp: new Date().toISOString(),
          total_clients: 0,
          active_clients: 0,
          total_models_deployed: 0,
          active_tasks: 0,
          completed_tasks: 0,
          available_models: [],
          clients: []
        },
        models: []
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Failed to get system status: ${error.message}`,
      status: {
        timestamp: new Date().toISOString(),
        total_clients: 0,
        active_clients: 0,
        total_models_deployed: 0,
        active_tasks: 0,
        completed_tasks: 0,
        available_models: [],
        clients: []
      },
      models: []
    }, { status: 500 })
  }
}

function extractIPFromEndpoint(endpoint_url: string): string {
  try {
    if (!endpoint_url) return "Unknown"
    const url = new URL(endpoint_url)
    return url.hostname
  } catch {
    // Try to extract IP with regex if URL parsing fails
    const match = endpoint_url.match(/(\d+\.\d+\.\d+\.\d+)/)
    return match ? match[1] : "Unknown"
  }
}

async function callRealGRPCClient(action: string, params: any): Promise<any> {
  const grpc = require('@grpc/grpc-js')
  const protoLoader = require('@grpc/proto-loader')
  const path = require('path')
  const fs = require('fs')

  return new Promise((resolve, reject) => {
    try {
      // Find the proto file
      const possibleProtoPaths = [
        path.join(process.cwd(), 'load_balancer.proto'),
        path.join(process.cwd(), '..', 'LB', 'load_balancer.proto'),
        path.join(process.cwd(), '..', 'load_balancer.proto')
      ]

      let protoPath = null
      for (const p of possibleProtoPaths) {
        if (fs.existsSync(p)) {
          protoPath = p
          break
        }
      }

      if (!protoPath) {
        reject(new Error('Proto file not found'))
        return
      }

      console.log(`Using proto file: ${protoPath}`)

      // Load the proto file
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      })

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
      const LoadBalancer = protoDescriptor.loadbalancer.LoadBalancer

      // Create client
      const client = new LoadBalancer(params.server_address, grpc.credentials.createInsecure())

      // Set deadline
      const deadline = new Date()
      deadline.setSeconds(deadline.getSeconds() + 15)

      if (action === 'health_check') {
        client.HealthCheck({}, { deadline }, (error: any, response: any) => {
          if (error) {
            console.error('gRPC Health Check Error:', error)
            reject(error)
          } else {
            console.log('gRPC Health Check Success:', response)
            resolve({
              success: true,
              health: {
                healthy: response.healthy,
                message: response.message,
                timestamp: response.timestamp
              }
            })
          }
          client.close()
        })
      } else if (action === 'get_models') {
        client.GetAvailableModels({}, { deadline }, (error: any, response: any) => {
          if (error) {
            console.error('gRPC Get Models Error:', error)
            reject(error)
          } else {
            console.log('gRPC Get Models Success:', response)
            
            const models = response.models.map((model: any) => ({
              model_name: model.model_name,
              model_type: model.model_type,
              status: model.status,
              endpoint_url: model.endpoint_url,
              client_id: model.client_id,
              performance_score: model.performance_score
            }))
            
            resolve({
              success: true,
              models: models
            })
          }
          client.close()
        })
      } else {
        reject(new Error(`Unknown action: ${action}`))
      }

    } catch (error) {
      console.error('gRPC Status Client Error:', error)
      reject(error)
    }
  })
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