# STUPIDLY SIMPLE ESP32 Connection Detection

## How It Works (Super Simple!)

1. **ESP32 sends heartbeat** → Pi server saves timestamp to file `esp32_heartbeat.txt`
2. **Dashboard checks** → Reads timestamp from file via Pi server
3. **If timestamp is older than 15 seconds** → ESP32 is DEAD
4. **If timestamp is recent** → ESP32 is ALIVE

No complex logic, no race conditions, just a simple file with a timestamp!

## Setup Steps

### 1. Replace Your Pi Server

Stop your current server and run the simple one:

```bash
# Stop current server (Ctrl+C)
python simple_pi_server.py
```

### 2. Keep Your ESP32 Code

Your current ESP32 code should work fine - it's already sending heartbeats to `/esp32-heartbeat`.

### 3. Test the System

**Check if it's working:**
```bash
# Should show ESP32 status
curl http://rpi-desktop.local:5000/

# Should show heartbeat status
curl http://rpi-desktop.local:5000/heartbeat-status
```

## Expected Behavior

### When ESP32 is ON:
- **Pi server logs**: `💓 Heartbeat saved to file: 1699048234.567`
- **Dashboard console**: `✅ ESP32 ALIVE (heartbeat within 15 seconds)`
- **Dashboard status**: Green "Connected + Transmitting Data"

### When ESP32 is OFF:
- **Pi server logs**: `🔍 Heartbeat check: 25.3s ago, alive=false`
- **Dashboard console**: `❌ ESP32 DEAD (no recent heartbeat)`
- **Dashboard status**: Red "Disconnected"

## Files Created

The Pi server creates these simple files:
- `esp32_heartbeat.txt` - Contains timestamp of last heartbeat
- `sensor_data.json` - Contains latest sensor data

## Debug Commands

```bash
# Check heartbeat file directly
cat esp32_heartbeat.txt

# Check sensor data file
cat sensor_data.json

# Test heartbeat endpoint
curl http://rpi-desktop.local:5000/heartbeat-status
```

## Why This Works

- **No complex database** - Just a text file with timestamp
- **No race conditions** - Simple read/write operations
- **No timing issues** - Clear 15-second threshold
- **Easy to debug** - You can see the files and timestamps directly

## Troubleshooting

### If ESP32 shows as DEAD when it's ON:
1. Check ESP32 serial monitor - should show successful heartbeat responses
2. Check if `esp32_heartbeat.txt` file exists and is being updated
3. Check timestamp in file: `cat esp32_heartbeat.txt`

### If files aren't being created:
1. Check Pi server has write permissions in its directory
2. Check ESP32 is actually sending heartbeats (not just sensor data)

This is as simple as it gets! 🎯