# Quick Fix for Connection Issues

## The Problem

Your ESP32 is getting 404 errors for heartbeat, and the dashboard shows "connected" even when ESP32 is off.

## Root Cause

You're still running your old Pi server that doesn't have the heartbeat endpoint (`/esp32-heartbeat`).

## Quick Fix Steps

### 1. Test Your Current Pi Server

Run this test script on your Pi:

```bash
python test_pi_server.py
```

**Expected result if you have the OLD server:**
- ✅ Sensor data endpoints work
- ❌ Heartbeat endpoint returns 404

**Expected result if you have the NEW server:**
- ✅ All endpoints work
- ✅ Heartbeat endpoint returns ESP32 status

### 2. Replace Your Pi Server

**Stop your current Pi server** (Ctrl+C) and run the new one:

```bash
python pi_server_with_heartbeat.py
```

### 3. Update Your ESP32 Code

Replace your ESP32 code with `esp32_with_heartbeat.ino` to add heartbeat functionality.

### 4. Test the Fix

1. **Power on ESP32** - Should see both sensor data and heartbeat messages in Pi logs
2. **Check dashboard** - Should show "Connected + Transmitting Data"
3. **Power off ESP32** - Wait 30 seconds, dashboard should show "Disconnected"
4. **Power on ESP32** - Dashboard should show "Connected" within 10-30 seconds

## Expected Logs

### Pi Server Logs (when ESP32 is ON):
```
Received sensor data: {'nitrogen': 45, 'phosphorus': 30, ...}
Received heartbeat: {'esp32_id': 'AA:BB:CC:DD:EE:FF', ...}
```

### Pi Server Logs (when ESP32 is OFF):
```
WARNING: ESP32 heartbeat is stale (35 seconds old)
```

### ESP32 Serial Monitor (when working):
```
Sensor data sent successfully
Response: {"status": "success", "message": "Data received"}
Heartbeat sent successfully
Heartbeat response: {"status": "success", "message": "Heartbeat received"}
```

## Verification Commands

Test these URLs in your browser or with curl:

```bash
# Should return sensor data
curl http://rpi-desktop.local:5000/sensor-data

# Should return ESP32 heartbeat status
curl http://rpi-desktop.local:5000/esp32-heartbeat

# Should return server info
curl http://rpi-desktop.local:5000/
```

## If Still Not Working

1. **Check Pi server is running the NEW version:**
   - Look for "ESP32 Sensor Data Server with Heartbeat" in startup message
   - Should have endpoints listed including `/esp32-heartbeat`

2. **Check ESP32 serial monitor:**
   - Should show successful heartbeat responses (not 404)
   - Should resolve Pi's IP address via mDNS

3. **Check dashboard browser console:**
   - Should show "ESP32 heartbeat: ALIVE" when connected
   - Should show "ESP32 heartbeat: DEAD" when disconnected

## Current Status After Fix

- ✅ ESP32 sends heartbeat every 10 seconds
- ✅ Pi server tracks ESP32 connection status
- ✅ Dashboard shows real connection status based on heartbeat
- ✅ No more false "connected" status when ESP32 is off
- ✅ Proper logging and monitoring