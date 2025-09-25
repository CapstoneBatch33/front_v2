import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { server_address, sensor_data } = await request.json()
    
    if (!server_address || !sensor_data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 })
    }

    console.log(`Redirecting to REAL sensor data processing for: ${server_address}`)
    
    // Use the real gRPC sensor data endpoint instead of hardcoded processing
    try {
      const response = await fetch('/api/grpc/sensor-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          server_address, 
          sensor_data 
        })
      })
      
      const result = await response.json()
      return NextResponse.json(result)
      
    } catch (error: any) {
      console.error('Failed to process real sensor data:', error)
      
      return NextResponse.json({
        success: false,
        error: `Sensor data processing failed: ${error.message}`,
        analysis: {
          summary: "Failed to process sensor data",
          detailed_analysis: {
            averages: {},
            trends: {},
            alerts: [`Error: ${error.message}`],
            health_score: 0
          }
        },
        recommendations: ["Check connection to load balancer", "Verify sensor data format"]
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Sensor data processing error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Failed to process sensor data: ${error.message}` 
    }, { status: 500 })
  }
}