import { NextRequest, NextResponse } from 'next/server'

// Pi server connection settings
const PI_SERVER_IP = process.env.PI_SERVER_IP || '192.168.1.152'
const PI_SERVER_PORT = process.env.PI_SERVER_PORT || '5000'

export async function GET(request: NextRequest) {
  try {
    // Call the simple heartbeat status endpoint
    const piResponse = await fetch(`http://${PI_SERVER_IP}:${PI_SERVER_PORT}/heartbeat-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    
    if (piResponse.ok) {
      const heartbeatData = await piResponse.json()
      
      // Simple logic: ESP32 is alive based on Pi server's calculation
      const isAlive = heartbeatData.esp32_alive === true
      const secondsSince = heartbeatData.seconds_since_heartbeat || 999
      const lastHeartbeat = heartbeatData.last_heartbeat || 'Never'
      const currentTime = heartbeatData.current_time || 'Unknown'
      
      console.log(`💓 SIMPLE Heartbeat Check:`)
      console.log(`   Current: ${currentTime}`)
      console.log(`   Last HB: ${lastHeartbeat}`)
      console.log(`   Seconds: ${secondsSince}`)
      console.log(`   Alive: ${isAlive}`)
      
      return NextResponse.json({
        success: true,
        esp32_alive: isAlive,
        seconds_since: secondsSince,
        last_heartbeat: lastHeartbeat,
        current_time: currentTime,
        reason: isAlive ? 'Recent heartbeat detected' : `No heartbeat for ${secondsSince} seconds`
      })
    }
    
    // If Pi server is unreachable, ESP32 is definitely dead
    console.log('❌ Cannot reach Pi server - ESP32 considered DEAD')
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