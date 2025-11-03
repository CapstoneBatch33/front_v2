#!/usr/bin/env python3
"""
Simple Python server to receive ESP32 sensor data and serve it to the dashboard.
This server receives POST requests from ESP32 and serves the latest data via GET requests.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store the latest sensor data
latest_sensor_data = {
    'temperature': 22.0,
    'pH': 6.5,
    'moisture': 45.0,
    'nitrogen': 50,
    'phosphorus': 30,
    'potassium': 60,
    'timestamp': datetime.now().isoformat()
}

# Lock for thread-safe access to sensor data
data_lock = threading.Lock()

@app.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    """Receive sensor data from ESP32"""
    global latest_sensor_data
    
    try:
        # Get JSON data from ESP32
        sensor_data = request.get_json()
        
        if sensor_data:
            print(f"Received sensor data: {sensor_data}")
            
            # Update latest sensor data with thread safety
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

@app.route('/sensor-data', methods=['GET'])
def get_sensor_data():
    """Serve latest sensor data to dashboard"""
    global latest_sensor_data
    
    try:
        # Return latest sensor data with thread safety
        with data_lock:
            data_copy = latest_sensor_data.copy()
        
        return jsonify(data_copy), 200
        
    except Exception as e:
        print(f"Error serving sensor data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'last_data_update': latest_sensor_data.get('timestamp', 'never')
    }), 200

@app.route('/', methods=['GET'])
def index():
    """Simple index page"""
    return jsonify({
        'message': 'ESP32 Sensor Data Server',
        'endpoints': {
            'POST /sensor-data': 'Receive sensor data from ESP32',
            'GET /sensor-data': 'Get latest sensor data',
            'GET /health': 'Health check'
        },
        'latest_data': latest_sensor_data
    }), 200

def cleanup_old_data():
    """Background task to mark data as stale if not updated"""
    global latest_sensor_data
    
    while True:
        time.sleep(30)  # Check every 30 seconds
        
        with data_lock:
            # Check if data is older than 1 minute
            try:
                last_update = datetime.fromisoformat(latest_sensor_data['timestamp'])
                if (datetime.now() - last_update).total_seconds() > 60:
                    print("Warning: Sensor data is stale (>1 minute old)")
            except:
                pass

if __name__ == '__main__':
    # Start background cleanup task
    cleanup_thread = threading.Thread(target=cleanup_old_data, daemon=True)
    cleanup_thread.start()
    
    print("Starting ESP32 Sensor Data Server...")
    print("Endpoints:")
    print("  POST /sensor-data - Receive data from ESP32")
    print("  GET /sensor-data  - Serve data to dashboard")
    print("  GET /health       - Health check")
    print("  GET /             - Server info")
    
    # Run the server
    app.run(host='0.0.0.0', port=5000, debug=True)