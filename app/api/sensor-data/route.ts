import { NextRequest, NextResponse } from 'next/server'

// ESP32 connection settings
const ESP32_IP = process.env.ESP32_IP || '192.168.1.100' // Change this to your ESP32's IP
const ESP32_PORT = process.env.ESP32_PORT || '80'

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from ESP32 first
    try {
      const esp32Response = await fetch(`http://${ESP32_IP}:${ESP32_PORT}/sensor-data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000) // 3 second timeout for ESP32
      })
      
      if (esp32Response.ok) {
        const esp32Data = await esp32Response.json()
        return NextResponse.json({
          success: true,
          source: 'esp32',
          data: {
            temperature: parseFloat(esp32Data.temperature) || 22,
            ph_level: parseFloat(esp32Data.pH || esp32Data.ph_level) || 6.5,
            soil_moisture: parseFloat(esp32Data.moisture || esp32Data.soil_moisture) || 45,
            nitrogen: parseFloat(esp32Data.nitrogen) || 50,
            phosphorus: parseFloat(esp32Data.phosphorus) || 30,
            potassium: parseFloat(esp32Data.potassium) || 80,
            humidity: parseFloat(esp32Data.humidity) || 65,
            timestamp: esp32Data.timestamp || new Date().toISOString()
          }
        })
      }
    } catch (esp32Error) {
      console.log('ESP32 connection failed:', esp32Error instanceof Error ? esp32Error.message : 'Unknown error')
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