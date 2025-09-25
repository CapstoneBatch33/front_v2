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

    console.log(`Redirecting to REAL gRPC health check for: ${server_address}`)
    
    // Use the real gRPC health endpoint instead of hardcoded data
    try {
      const response = await fetch('/api/grpc/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ server_address })
      })
      
      const result = await response.json()
      return NextResponse.json(result)
      
    } catch (error: any) {
      console.error('Failed to get real health status:', error)
      
      return NextResponse.json({
        success: false,
        error: `Failed to connect to Pi: ${error.message}`
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Failed to connect to load balancer: ${error.message}` 
    }, { status: 500 })
  }
}