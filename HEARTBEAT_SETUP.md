# ESP32 Heartbeat System Setup

## Overview

I've reverted the previous changes and implemented a proper heartbeat system to solve your issues:

### Problems Fixed:
- ✅ **No more random values** - Removed mock data generation
- ✅ **Proper connection detection** - Uses heartbeat to determine if ESP32 is alive
- ✅ **Real-time status** - Shows actual ESP32 connection status

## How the Heartbeat System Works

### ESP32 Side:
- **Sensor data**: Sent every 5 seconds to `/sensor-data`
- **Heartbeat**: Sent every 10 seconds to `/esp32-heartbeat`
- **Heartbeat includes**: MAC address, uptime, WiFi signal strength, free memory

### Pi Server Side:
- **Receives both** sensor data and heartbeat signals
- **Tracks connection**: ESP32 considered "alive" if heartbeat received within 30 seconds
- **Serves status**: Dashboard can check ESP32 connection via `/esp32-heartbeat` endpoint

### Dashboard Side:
- **Checks heartbeat** instead of just data availability
- **Shows connected** only when ESP32 is actively sending heartbeats
- **No random data** - Only shows real ESP32 values or static fallback

## Setup Instructions

### 1. Update Your ESP32 Code

Replace your current ESP32 code with `esp32_with_heartbeat.ino`:

**Key changes:**
- Adds heartbeat functionality (every 10 seconds)
- Includes ESP32 status info (MAC, uptime, WiFi signal, memory)
- Better error handling and reconnection logic

### 2. Update Your Pi Server

Replace your current Python server with `pi_server_with_heartbeat.py`:

**Key features:**
- Handles both `/sensor-data` and `/esp32-heartbeat` endpoints
- Tracks ESP32 connection status
- Provides heartbeat status to dashboard
- Background monitoring with warnings

### 3. Install and Run

```bash
# Install dependencies
pip install flask flask-cors

# Run the server
python pi_server_with_heartbeat.py
```

## Testing the System

### 1. Test ESP32 Connection
```bash
# Check if Pi server is receiving heartbeats
curl http://rpi-desktop.local:5000/esp32-heartbeat

# Should return:
{
  "esp32_alive": true,
  "last_heartbeat": "2024-11-03T21:15:30",
  "seconds_since_heartbeat": 5,
  "heartbeat_count": 42,
  "esp32_id": "AA:BB:CC:DD:EE:FF"
}
```

### 2. Test Dashboard Connection
- Open dashboard
- Should show "Connected + Transmitting Data" with green badge
- Should display your real sensor values: temp=28.7°C, pH=6.4, etc.
- No random values should appear

### 3. Test Disconnection
- Power off ESP32
- Wait 30 seconds
- Dashboard should show "Disconnected"
- Power on ESP32
- Dashboard should show "Connected" within 10-30 seconds

## Expected Behavior

### When ESP32 is Connected:
- **Dashboard**: Green "Connected + Transmitting Data" badge
- **Values**: Real sensor data (temp=28.7, pH=6.4, moisture=55.5, etc.)
- **Updates**: Every 5 seconds with real data
- **Pi logs**: "Received sensor data" and "Received heartbeat" messages

### When ESP32 is Disconnected:
- **Dashboard**: Red "Disconnected" badge
- **Values**: Static fallback values (temp=22, pH=6.5, etc.)
- **Pi logs**: "WARNING: ESP32 heartbeat is stale" after 30 seconds

## Troubleshooting

### If dashboard still shows random values:
1. **Clear browser cache** and refresh
2. **Check Pi server logs** for sensor data reception
3. **Verify ESP32 is sending** consistent data

### If dashboard shows disconnected but ESP32 is working:
1. **Check Pi server heartbeat endpoint**: `curl http://rpi-desktop.local:5000/esp32-heartbeat`
2. **Verify ESP32 heartbeat code** is running (check serial monitor)
3. **Check network connectivity** between ESP32 and Pi

### If ESP32 can't find Pi:
1. **Check mDNS resolution** in ESP32 serial monitor
2. **Try Pi's IP address** instead of hostname
3. **Verify Pi hostname**: `hostname` should return "rpi-desktop"

## Current Status

- ✅ Reverted to Pi-based connection (not Python server)
- ✅ Added heartbeat system for reliable connection detection
- ✅ Removed random mock data generation
- ✅ Real-time connection status based on heartbeat
- ✅ Enhanced ESP32 code with better error handling
- ✅ Comprehensive Pi server with monitoring