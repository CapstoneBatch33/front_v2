# Python Server Setup for ESP32 Integration

## Current Situation

Based on your logs, you have:
- ✅ ESP32 sending data every 5 seconds to `192.168.1.152:5000`
- ✅ Python server receiving POST requests with sensor data
- ❌ Dashboard can't connect because it needs a GET endpoint

## Quick Fix

Your Python server needs to serve the latest sensor data via a GET endpoint so the dashboard can retrieve it.

### Option 1: Use the Provided Python Server

1. **Replace your current Python server** with `python_server_example.py`
2. **Install dependencies**:
   ```bash
   pip install flask flask-cors
   ```
3. **Run the server**:
   ```bash
   python python_server_example.py
   ```

### Option 2: Add GET Endpoint to Your Existing Server

Add this to your existing Python server:

```python
from flask import Flask, jsonify

# Store latest sensor data (global variable)
latest_sensor_data = {}

@app.route('/sensor-data', methods=['GET'])
def get_sensor_data():
    """Serve latest sensor data to dashboard"""
    return jsonify(latest_sensor_data), 200

# In your existing POST handler, update latest_sensor_data:
@app.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    global latest_sensor_data
    sensor_data = request.get_json()
    
    # Your existing code...
    
    # Add this line to store the latest data:
    latest_sensor_data = sensor_data
    
    return jsonify({'status': 'success'}), 200
```

## Testing the Connection

1. **Test Python server directly**:
   ```bash
   curl http://192.168.1.152:5000/sensor-data
   ```
   Should return JSON with your sensor data.

2. **Check dashboard connection**:
   - Open the dashboard
   - Look for "Connected + Transmitting Data" status
   - Should show green badge with pulsing dot

## Environment Configuration

Update your `.env.local`:
```
PYTHON_SERVER_IP=192.168.1.152
PYTHON_SERVER_PORT=5000
```

## Expected Data Format

Your Python server should return JSON like this:
```json
{
  "temperature": 28.7,
  "pH": 6.4,
  "moisture": 55.5,
  "nitrogen": 45,
  "phosphorus": 30,
  "potassium": 60,
  "timestamp": "2024-11-03T21:03:50"
}
```

## Troubleshooting

### If dashboard still shows "Disconnected":

1. **Check Python server GET endpoint**:
   ```bash
   curl http://192.168.1.152:5000/sensor-data
   ```

2. **Check CORS headers** (if needed):
   ```python
   from flask_cors import CORS
   CORS(app)
   ```

3. **Check server logs** for connection attempts from dashboard

4. **Verify IP/Port** in dashboard settings or `.env.local`

### If ESP32 stops sending data:

1. **Check ESP32 serial monitor** for errors
2. **Verify WiFi connection** on ESP32
3. **Check Python server logs** for POST requests

## Current Status After Fix

- ✅ ESP32 → Python Server (POST /sensor-data)
- ✅ Python Server → Dashboard (GET /sensor-data)  
- ✅ Dashboard shows real connection status
- ✅ Real sensor data displayed in dashboard
- ✅ 5-second update frequency maintained