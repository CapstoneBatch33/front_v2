import { NextRequest, NextResponse } from 'next/server'

// Raspberry Pi connection settings
const RASPBERRY_PI_IP = process.env.RASPBERRY_PI_IP || 'rpi-desktop.local'
const RASPBERRY_PI_PORT = process.env.RASPBERRY_PI_PORT || '5000'

export async function GET(request: NextRequest) {
  try {
    // Call the simple heartbeat status endpoint
    const piResponse = await fetch(`http://${RASPBERRY_PI_IP}:${RASPBERRY_PI_PORT}/heartbeat-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    
    if (piResponse.ok) {
      const heartbeatData = await piResponse.json()
      
      // Simple logic: ESP32 is alive if heartbeat is within 15 seconds
      const isAlive = heartbeatData.esp32_alive === true
      
      return NextResponse.json({
        success: true,
        esp32_alive: isAlive,
        seconds_since: heartbeatData.seconds_since_heartbeat || 999,
        reason: heartbeatData.reason || 'File-based check'
      })
    }
    
    // If Pi server is unreachable, ESP32 is definitely dead
    return NextResponse.json({
      success: false,
      esp32_alive: false,
      reason: 'Cannot reach Pi server'
    })
    
  } catch (error) {
    console.error('Simple heartbeat check error:', error)
    return NextResponse.json({
      success: false,
      esp32_alive: false,
      reason: 'Network error'
    })
  }
}