#!/usr/bin/env python3
"""
Raspberry Pi server to receive ESP32 sensor data and heartbeat signals.
Serves data to the Next.js dashboard with connection status.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime, timedelta
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store the latest sensor data and heartbeat info
latest_sensor_data = {
    'temperature': 22.0,
    'pH': 6.5,
    'moisture': 45.0,
    'nitrogen': 50,
    'phosphorus': 30,
    'potassium': 60,
    'timestamp': datetime.now().isoformat()
}

esp32_heartbeat = {
    'last_heartbeat': None,
    'heartbeat_count': 0,
    'esp32_id': None,
    'uptime': 0,
    'wifi_rssi': 0,
    'free_heap': 0
}

# Lock for thread-safe access
data_lock = threading.Lock()

@app.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    """Receive sensor data from ESP32"""
    global latest_sensor_data
    
    try:
        sensor_data = request.get_json()
        
        if sensor_data:
            print(f"Received sensor data: {sensor_data}")
            
            with data_lock:
                latest_sensor_data.update({
                    'temperature': float(sensor_data.get('temperature', 22.0)),
                    'pH': float(sensor_data.get('pH', 6.5)),
                    'moisture': float(sensor_data.get('moisture', 45.0)),
                    'nitrogen': int(sensor_data.get('nitrogen', 50)),
                    'phosphorus': int(sensor_data.get('phosphorus', 30)),
                    'potassium': int(sensor_data.get('potassium', 60)),
                    'timestamp': datetime.now().isoformat()
                })
            
            return jsonify({'status': 'success', 'message': 'Data received'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'No data received'}), 400
            
    except Exception as e:
        print(f"Error receiving sensor data: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/esp32-heartbeat', methods=['POST'])
def receive_heartbeat():
    """Receive heartbeat from ESP32"""
    global esp32_heartbeat
    
    try:
        heartbeat_data = request.get_json()
        
        if heartbeat_data:
            print(f"Received heartbeat: {heartbeat_data}")
            
            with data_lock:
                esp32_heartbeat.update({
                    'last_heartbeat': datetime.now(),
                    'heartbeat_count': esp32_heartbeat['heartbeat_count'] + 1,
                    'esp32_id': heartbeat_data.get('esp32_id', 'unknown'),
                    'uptime': int(heartbeat_data.get('uptime', 0)),
                    'wifi_rssi': int(heartbeat_data.get('wifi_rssi', 0)),
                    'free_heap': int(heartbeat_data.get('free_heap', 0))
                })
            
            return jsonify({'status': 'success', 'message': 'Heartbeat received'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'No heartbeat data'}), 400
            
    except Exception as e:
        print(f"Error receiving heartbeat: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/sensor-data', methods=['GET'])
def get_sensor_data():
    """Serve latest sensor data to dashboard"""
    global latest_sensor_data, esp32_heartbeat
    
    try:
        with data_lock:
            data_copy = latest_sensor_data.copy()
            # Add heartbeat info to sensor data
            if esp32_heartbeat['last_heartbeat']:
                data_copy['last_heartbeat'] = esp32_heartbeat['last_heartbeat'].isoformat()
            else:
                data_copy['last_heartbeat'] = None
        
        return jsonify(data_copy), 200
        
    except Exception as e:
        print(f"Error serving sensor data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/esp32-heartbeat', methods=['GET'])
def get_heartbeat_status():
    """Get ESP32 heartbeat status for dashboard"""
    global esp32_heartbeat
    
    try:
        with data_lock:
            heartbeat_copy = esp32_heartbeat.copy()
        
        # Calculate if ESP32 is alive (heartbeat within last 30 seconds)
        esp32_alive = False
        seconds_since_heartbeat = None
        
        if heartbeat_copy['last_heartbeat']:
            time_diff = datetime.now() - heartbeat_copy['last_heartbeat']
            seconds_since_heartbeat = int(time_diff.total_seconds())
            esp32_alive = seconds_since_heartbeat < 30  # Consider alive if heartbeat within 30 seconds
        
        response_data = {
            'esp32_alive': esp32_alive,
            'last_heartbeat': heartbeat_copy['last_heartbeat'].isoformat() if heartbeat_copy['last_heartbeat'] else None,
            'seconds_since_heartbeat': seconds_since_heartbeat,
            'heartbeat_count': heartbeat_copy['heartbeat_count'],
            'esp32_id': heartbeat_copy['esp32_id'],
            'uptime': heartbeat_copy['uptime'],
            'wifi_rssi': heartbeat_copy['wifi_rssi'],
            'free_heap': heartbeat_copy['free_heap']
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error getting heartbeat status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    with data_lock:
        esp32_alive = False
        if esp32_heartbeat['last_heartbeat']:
            time_diff = datetime.now() - esp32_heartbeat['last_heartbeat']
            esp32_alive = time_diff.total_seconds() < 30
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'esp32_connected': esp32_alive,
        'last_sensor_update': latest_sensor_data.get('timestamp', 'never'),
        'last_heartbeat': esp32_heartbeat['last_heartbeat'].isoformat() if esp32_heartbeat['last_heartbeat'] else 'never'
    }), 200

@app.route('/', methods=['GET'])
def index():
    """Simple index page"""
    with data_lock:
        esp32_alive = False
        if esp32_heartbeat['last_heartbeat']:
            time_diff = datetime.now() - esp32_heartbeat['last_heartbeat']
            esp32_alive = time_diff.total_seconds() < 30
    
    return jsonify({
        'message': 'ESP32 Sensor Data Server with Heartbeat',
        'endpoints': {
            'POST /sensor-data': 'Receive sensor data from ESP32',
            'GET /sensor-data': 'Get latest sensor data',
            'POST /esp32-heartbeat': 'Receive heartbeat from ESP32',
            'GET /esp32-heartbeat': 'Get ESP32 connection status',
            'GET /health': 'Health check'
        },
        'esp32_status': {
            'alive': esp32_alive,
            'heartbeat_count': esp32_heartbeat['heartbeat_count'],
            'last_heartbeat': esp32_heartbeat['last_heartbeat'].isoformat() if esp32_heartbeat['last_heartbeat'] else 'never'
        },
        'latest_data': latest_sensor_data
    }), 200

def monitor_esp32():
    """Background task to monitor ESP32 connection"""
    while True:
        time.sleep(10)  # Check every 10 seconds
        
        with data_lock:
            if esp32_heartbeat['last_heartbeat']:
                time_diff = datetime.now() - esp32_heartbeat['last_heartbeat']
                if time_diff.total_seconds() > 30:
                    print(f"WARNING: ESP32 heartbeat is stale ({int(time_diff.total_seconds())} seconds old)")
                elif time_diff.total_seconds() > 60:
                    print("ERROR: ESP32 appears to be disconnected (no heartbeat for >1 minute)")

if __name__ == '__main__':
    # Start background monitoring task
    monitor_thread = threading.Thread(target=monitor_esp32, daemon=True)
    monitor_thread.start()
    
    print("Starting ESP32 Sensor Data Server with Heartbeat...")
    print("Endpoints:")
    print("  POST /sensor-data     - Receive data from ESP32")
    print("  GET /sensor-data      - Serve data to dashboard")
    print("  POST /esp32-heartbeat - Receive heartbeat from ESP32")
    print("  GET /esp32-heartbeat  - Get ESP32 connection status")
    print("  GET /health           - Health check")
    print("  GET /                 - Server info")
    
    # Run the server
    app.run(host='0.0.0.0', port=5000, debug=True)