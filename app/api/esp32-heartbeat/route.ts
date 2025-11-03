import { NextRequest, NextResponse } from 'next/server'

// Raspberry Pi connection settings
const RASPBERRY_PI_IP = process.env.RASPBERRY_PI_IP || 'rpi-desktop.local'
const RASPBERRY_PI_PORT = process.env.RASPBERRY_PI_PORT || '5000'

export async function GET(request: NextRequest) {
  try {
    // Check ESP32 heartbeat status from Raspberry Pi
    const piResponse = await fetch(`http://${RASPBERRY_PI_IP}:${RASPBERRY_PI_PORT}/esp32-heartbeat`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    
    if (piResponse.ok) {
      const heartbeatData = await piResponse.json()
      return NextResponse.json({
        success: true,
        data: {
          esp32_alive: heartbeatData.esp32_alive || false,
          last_heartbeat: heartbeatData.last_heartbeat || null,
          seconds_since_heartbeat: heartbeatData.seconds_since_heartbeat || null,
          heartbeat_count: heartbeatData.heartbeat_count || 0
        }
      })
    } else if (piResponse.status === 404) {
      // Pi server doesn't have heartbeat endpoint - assume ESP32 is disconnected
      console.log('Pi server does not have heartbeat endpoint')
      return NextResponse.json({
        success: true,
        data: {
          esp32_alive: false,
          last_heartbeat: null,
          seconds_since_heartbeat: null,
          heartbeat_count: 0,
          error: 'Heartbeat endpoint not available on Pi server'
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Could not reach Raspberry Pi',
      data: {
        esp32_alive: false,
        last_heartbeat: null,
        seconds_since_heartbeat: null,
        heartbeat_count: 0
      }
    }, { status: 503 })
    
  } catch (error) {
    console.error('ESP32 heartbeat check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Heartbeat check failed',
      data: {
        esp32_alive: false,
        last_heartbeat: null,
        seconds_since_heartbeat: null,
        heartbeat_count: 0
      }
    }, { status: 500 })
  }
}