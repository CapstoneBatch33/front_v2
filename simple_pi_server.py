#!/usr/bin/env python3
"""
SUPER SIMPLE Pi server - saves heartbeat timestamp to file
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# File to store heartbeat timestamp
HEARTBEAT_FILE = "esp32_heartbeat.txt"
SENSOR_DATA_FILE = "sensor_data.json"

# Store latest sensor data
latest_sensor_data = {
    'temperature': 22.0,
    'pH': 6.5,
    'moisture': 45.0,
    'nitrogen': 50,
    'phosphorus': 30,
    'potassium': 60
}

@app.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    """Receive sensor data from ESP32"""
    global latest_sensor_data
    
    try:
        sensor_data = request.get_json()
        
        if sensor_data:
            print(f"Received sensor data: {sensor_data}")
            
            # Update latest sensor data
            latest_sensor_data.update({
                'temperature': float(sensor_data.get('temperature', 22.0)),
                'pH': float(sensor_data.get('pH', 6.5)),
                'moisture': float(sensor_data.get('moisture', 45.0)),
                'nitrogen': int(sensor_data.get('nitrogen', 50)),
                'phosphorus': int(sensor_data.get('phosphorus', 30)),
                'potassium': int(sensor_data.get('potassium', 60))
            })
            
            # Save to file
            with open(SENSOR_DATA_FILE, 'w') as f:
                json.dump(latest_sensor_data, f)
            
            return jsonify({'status': 'success', 'message': 'Data received'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'No data received'}), 400
            
    except Exception as e:
        print(f"Error receiving sensor data: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/esp32-heartbeat', methods=['POST'])
def receive_heartbeat():
    """Receive heartbeat from ESP32 - SAVE TIMESTAMP TO FILE"""
    try:
        heartbeat_data = request.get_json()
        
        if heartbeat_data:
            print(f"Received heartbeat: {heartbeat_data}")
            
            # Save current timestamp to file (SIMPLE!)
            current_time = time.time()
            with open(HEARTBEAT_FILE, 'w') as f:
                f.write(str(current_time))
            
            print(f"💓 Heartbeat saved to file: {current_time}")
            
            return jsonify({'status': 'success', 'message': 'Heartbeat received'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'No heartbeat data'}), 400
            
    except Exception as e:
        print(f"Error receiving heartbeat: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/sensor-data', methods=['GET'])
def get_sensor_data():
    """Serve latest sensor data to dashboard"""
    try:
        # Try to load from file
        if os.path.exists(SENSOR_DATA_FILE):
            with open(SENSOR_DATA_FILE, 'r') as f:
                data = json.load(f)
        else:
            data = latest_sensor_data
        
        return jsonify(data), 200
        
    except Exception as e:
        print(f"Error serving sensor data: {e}")
        return jsonify(latest_sensor_data), 200

@app.route('/heartbeat-status', methods=['GET'])
def get_heartbeat_status():
    """SIMPLE heartbeat check - read timestamp from file"""
    try:
        if not os.path.exists(HEARTBEAT_FILE):
            return jsonify({
                'esp32_alive': False,
                'reason': 'No heartbeat file found'
            }), 200
        
        # Read timestamp from file
        with open(HEARTBEAT_FILE, 'r') as f:
            last_heartbeat_time = float(f.read().strip())
        
        # Check if heartbeat is recent (within 15 seconds)
        current_time = time.time()
        seconds_since = current_time - last_heartbeat_time
        
        esp32_alive = seconds_since < 15  # 15 seconds threshold
        
        print(f"🔍 Heartbeat check: {seconds_since:.1f}s ago, alive={esp32_alive}")
        
        return jsonify({
            'esp32_alive': esp32_alive,
            'seconds_since_heartbeat': int(seconds_since),
            'last_heartbeat_time': last_heartbeat_time,
            'current_time': current_time
        }), 200
        
    except Exception as e:
        print(f"Error checking heartbeat: {e}")
        return jsonify({
            'esp32_alive': False,
            'reason': f'Error: {str(e)}'
        }), 200

@app.route('/', methods=['GET'])
def index():
    """Simple index page"""
    try:
        # Check heartbeat status
        esp32_alive = False
        if os.path.exists(HEARTBEAT_FILE):
            with open(HEARTBEAT_FILE, 'r') as f:
                last_heartbeat_time = float(f.read().strip())
            seconds_since = time.time() - last_heartbeat_time
            esp32_alive = seconds_since < 15
    except:
        esp32_alive = False
    
    return jsonify({
        'message': 'SIMPLE ESP32 Server',
        'esp32_status': 'ALIVE' if esp32_alive else 'DEAD',
        'endpoints': {
            'POST /sensor-data': 'Receive sensor data from ESP32',
            'GET /sensor-data': 'Get latest sensor data',
            'POST /esp32-heartbeat': 'Receive heartbeat (saves to file)',
            'GET /heartbeat-status': 'Check if ESP32 is alive (reads from file)'
        }
    }), 200

if __name__ == '__main__':
    print("🚀 Starting SIMPLE ESP32 Server...")
    print("📁 Heartbeat file:", HEARTBEAT_FILE)
    print("📁 Sensor data file:", SENSOR_DATA_FILE)
    print("🔗 Endpoints:")
    print("  POST /sensor-data     - Receive data from ESP32")
    print("  GET /sensor-data      - Serve data to dashboard")
    print("  POST /esp32-heartbeat - Receive heartbeat (saves timestamp to file)")
    print("  GET /heartbeat-status - Check ESP32 status (reads timestamp from file)")
    
    app.run(host='0.0.0.0', port=5000, debug=True)