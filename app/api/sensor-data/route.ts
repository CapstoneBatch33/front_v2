import { NextRequest, NextResponse } from 'next/server'

// Python server connection settings (receives data from ESP32)
const PYTHON_SERVER_IP = process.env.PYTHON_SERVER_IP || '192.168.1.152' // Your Python server IP
const PYTHON_SERVER_PORT = process.env.PYTHON_SERVER_PORT || '5000' // Your Python server port

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from Python server (which receives ESP32 data)
    try {
      const pythonResponse = await fetch(`http://${PYTHON_SERVER_IP}:${PYTHON_SERVER_PORT}/sensor-data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000) // 2 second timeout for Python server
      })
      
      if (pythonResponse.ok) {
        const sensorData = await pythonResponse.json()
        return NextResponse.json({
          success: true,
          source: 'esp32_via_python',
          data: {
            temperature: parseFloat(sensorData.temperature) || 22,
            ph_level: parseFloat(sensorData.pH || sensorData.ph_level) || 6.5,
            soil_moisture: parseFloat(sensorData.moisture || sensorData.soil_moisture) || 45,
            nitrogen: parseFloat(sensorData.nitrogen) || 50,
            phosphorus: parseFloat(sensorData.phosphorus) || 30,
            potassium: parseFloat(sensorData.potassium) || 80,
            humidity: parseFloat(sensorData.humidity) || 65,
            timestamp: sensorData.timestamp || new Date().toISOString()
          }
        })
      }
    } catch (pythonError) {
      console.log('Python server connection failed:', pythonError instanceof Error ? pythonError.message : 'Unknown error')
    }

    // Fallback to mock data with realistic variations
    const mockData = {
      temperature: Math.round((Math.random() * 8 + 18) * 10) / 10, // 18-26°C
      ph_level: Math.round((Math.random() * 2 + 5.5) * 10) / 10, // 5.5-7.5
      soil_moisture: Math.round(Math.random() * 30 + 35), // 35-65%
      nitrogen: Math.round(Math.random() * 40 + 30), // 30-70 ppm
      phosphorus: Math.round(Math.random() * 30 + 15), // 15-45 ppm
      potassium: Math.round(Math.random() * 40 + 60), // 60-100 ppm
      humidity: Math.round(Math.random() * 30 + 50), // 50-80%
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      source: 'mock',
      data: mockData
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