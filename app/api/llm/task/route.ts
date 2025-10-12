import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { server_address, action, model_name, prompt, task_id } = await request.json()
    
    if (!server_address) {
      return NextResponse.json({ 
        success: false, 
        error: 'Server address is required' 
      }, { status: 400 })
    }

    console.log(`LLM Task API - Action: ${action}`)
    
    if (action === 'create_task') {
      // Create new LLM inference task
      if (!model_name || !prompt) {
        return NextResponse.json({
          success: false,
          error: 'Model name and prompt are required for task creation'
        }, { status: 400 })
      }

      try {
        const result = await callLLMTaskAPI("create_task", { 
          server_address, 
          model_name, 
          prompt 
        })
        
        return NextResponse.json({
          success: true,
          task_id: result.task_id,
          message: `Task created for ${model_name}`,
          assigned_client: result.assigned_client
        })
        
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: `Failed to create task: ${error.message}`
        }, { status: 500 })
      }
      
    } else if (action === 'get_status') {
      // Get task status
      if (!task_id) {
        return NextResponse.json({
          success: false,
          error: 'Task ID is required for status check'
        }, { status: 400 })
      }

      try {
        const result = await callLLMTaskAPI("get_status", { 
          server_address, 
          task_id 
        })
        
        return NextResponse.json({
          success: true,
          task_id: task_id,
          status: result.status,
          progress: result.progress,
          result: result.result,
          client_id: result.client_id
        })
        
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: `Failed to get task status: ${error.message}`
        }, { status: 500 })
      }
      
    } else if (action === 'get_assignments') {
      // Get current LLM model assignments
      try {
        const result = await callLLMTaskAPI("get_assignments", { server_address })
        
        return NextResponse.json({
          success: true,
          assignments: result.assignments,
          model_info: result.model_info
        })
        
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: `Failed to get assignments: ${error.message}`
        }, { status: 500 })
      }
      
    } else {
      return NextResponse.json({
        success: false,
        error: `Unknown action: ${action}`
      }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error('LLM Task API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `API error: ${error.message}`
    }, { status: 500 })
  }
}

async function callLLMTaskAPI(action: string, params: any): Promise<any> {
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
      deadline.setSeconds(deadline.getSeconds() + 30)

      if (action === 'create_task') {
        // For now, we'll simulate task creation
        // In a full implementation, this would call a gRPC method
        const task_id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        resolve({
          task_id: task_id,
          assigned_client: `client_for_${params.model_name}`,
          status: 'created'
        })
        
      } else if (action === 'get_status') {
        // Simulate task status check
        resolve({
          status: 'completed',
          progress: 100,
          result: `Sample response for task ${params.task_id}`,
          client_id: 'client_sample'
        })
        
      } else if (action === 'get_assignments') {
        // Get model assignments via existing API
        client.GetAvailableModels({}, { deadline }, (error: any, response: any) => {
          if (error) {
            reject(error)
          } else {
            // Process model assignments
            const assignments: any = {}
            const model_info: any = {}
            
            response.models.forEach((model: any) => {
              if (model.client_id && model.model_name.includes('dhenu')) {
                assignments[model.client_id] = model.model_name
                model_info[model.model_name] = {
                  size: model.model_name.includes('8b') ? '8B' : 
                        model.model_name.includes('3b') ? '3B' : '1B',
                  status: model.status,
                  endpoint: model.endpoint_url
                }
              }
            })
            
            resolve({
              assignments: assignments,
              model_info: model_info
            })
          }
          client.close()
        })
        
      } else {
        reject(new Error(`Unknown action: ${action}`))
      }

    } catch (error) {
      console.error('LLM Task API Error:', error)
      reject(error)
    }
  })
}