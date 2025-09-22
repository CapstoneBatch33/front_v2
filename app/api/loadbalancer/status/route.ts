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

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock system status - replace with actual gRPC calls
    const mockSystemStatus = {
      timestamp: new Date().toISOString(),
      total_clients: 3,
      active_clients: 2,
      total_models_deployed: 5,
      active_tasks: 1,
      completed_tasks: 47,
      available_models: ["llama2-7b", "llama2-13b", "yolo-v8", "stable-diffusion", "agricultural-classifier"],
      clients: [
        {
          client_id: "client-001-laptop-gaming",
          hostname: "gaming-laptop",
          ip_address: "192.168.1.101",
          performance_score: 85.2,
          deployed_models: ["llama2-13b", "stable-diffusion"],
          current_tasks: 1,
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
          client_id: "client-002-laptop-work",
          hostname: "work-laptop",
          ip_address: "192.168.1.102",
          performance_score: 45.8,
          deployed_models: ["llama2-7b", "yolo-v8"],
          current_tasks: 0,
          last_seen: Date.now() / 1000,
          status: "online",
          specs: {
            cpu_cores: 4,
            cpu_frequency_ghz: 2.8,
            ram_gb: 16,
            gpu_info: "Intel Integrated",
            gpu_memory_gb: 0,
            os_info: "Ubuntu 22.04",
            performance_score: 45.8
          }
        },
        {
          client_id: "client-003-desktop-ai",
          hostname: "ai-workstation",
          ip_address: "192.168.1.103",
          performance_score: 95.7,
          deployed_models: ["agricultural-classifier"],
          current_tasks: 0,
          last_seen: Date.now() / 1000 - 300, // 5 minutes ago
          status: "offline",
          specs: {
            cpu_cores: 16,
            cpu_frequency_ghz: 3.8,
            ram_gb: 64,
            gpu_info: "NVIDIA RTX 4090",
            gpu_memory_gb: 24,
            os_info: "Ubuntu 22.04",
            performance_score: 95.7
          }
        }
      ]
    }
    
    const mockModels = [
      {
        model_name: "llama2-7b",
        model_type: "ollama",
        status: "running",
        endpoint_url: "http://192.168.1.102:11434",
        client_id: "client-002-laptop-work",
        performance_score: 45.8
      },
      {
        model_name: "llama2-13b",
        model_type: "ollama",
        status: "running",
        endpoint_url: "http://192.168.1.101:11434",
        client_id: "client-001-laptop-gaming",
        performance_score: 85.2
      },
      {
        model_name: "stable-diffusion",
        model_type: "pytorch",
        status: "running",
        endpoint_url: "http://192.168.1.101:8080",
        client_id: "client-001-laptop-gaming",
        performance_score: 85.2
      },
      {
        model_name: "yolo-v8",
        model_type: "pytorch",
        status: "running",
        endpoint_url: "http://192.168.1.102:8081",
        client_id: "client-002-laptop-work",
        performance_score: 45.8
      },
      {
        model_name: "agricultural-classifier",
        model_type: "tensorflow",
        status: "stopped",
        endpoint_url: "",
        client_id: "",
        performance_score: 0
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