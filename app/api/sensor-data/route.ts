import { NextRequest, NextResponse } from 'next/server'

// Raspberry Pi connection settings (receives data from ESP32)
const RASPBERRY_PI_IP = process.env.RASPBERRY_PI_IP || 'rpi-desktop.local'
const RASPBERRY_PI_PORT = process.env.RASPBERRY_PI_PORT || '5000'

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from Raspberry Pi (which receives ESP32 data)
    try {
      const piResponse = await fetch(`http://${RASPBERRY_PI_IP}:${RASPBERRY_PI_PORT}/sensor-data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000) // 2 second timeout for Pi
      })
      
      if (piResponse.ok) {
        const sensorData = await piResponse.json()
        return NextResponse.json({
          success: true,
          source: 'esp32_via_pi',
          data: {
            temperature: parseFloat(sensorData.temperature) || 22,
            ph_level: parseFloat(sensorData.pH || sensorData.ph_level) || 6.5,
            soil_moisture: parseFloat(sensorData.moisture || sensorData.soil_moisture) || 45,
            nitrogen: parseFloat(sensorData.nitrogen) || 50,
            phosphorus: parseFloat(sensorData.phosphorus) || 30,
            potassium: parseFloat(sensorData.potassium) || 80,
            humidity: parseFloat(sensorData.humidity) || 65,
            timestamp: sensorData.timestamp || new Date().toISOString(),
            last_heartbeat: sensorData.last_heartbeat || null
          }
        })
      }
    } catch (piError) {
      console.log('Raspberry Pi connection failed:', piError instanceof Error ? piError.message : 'Unknown error')
    }

    // Return static fallback data (no random generation)
    const fallbackData = {
      temperature: 22.0,
      ph_level: 6.5,
      soil_moisture: 45,
      nitrogen: 50,
      phosphorus: 30,
      potassium: 80,
      humidity: 65,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      source: 'fallback',
      data: fallbackData
    })

  } catch (error) {
    console.error('Sensor data fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        source: 'error',
        error: 'Failed to fetch sensor data',
        data: {
          temperature: 22,
          ph_level: 6.5,
          soil_moisture: 45,
          nitrogen: 50,
          phosphorus: 30,
          potassium: 80,
          humidity: 65,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}