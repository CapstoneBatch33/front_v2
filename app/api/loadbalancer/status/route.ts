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

    console.log(`Redirecting to REAL gRPC status for: ${server_address}`)
    
    // Use the real gRPC status endpoint instead of hardcoded data
    try {
      const response = await fetch('http://localhost:3000/api/grpc/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ server_address })
      })
      
      const result = await response.json()
      return NextResponse.json(result)
      
    } catch (error: any) {
      console.error('Failed to get real status:', error)
      
      // Return error instead of mock data
      return NextResponse.json({
        success: false,
        error: `Failed to get real status from Pi: ${error.message}`,
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