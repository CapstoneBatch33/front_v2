from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import csv
from datetime import datetime
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Make directory for data storage
os.makedirs("data", exist_ok=True)
data_file = "data/sensor_data.json"
csv_file = "data/sensor_history.csv"

# Initialize CSV file with headers if it doesn't exist
def init_csv():
    if not os.path.exists(csv_file):
        headers = ['timestamp', 'datetime', 'temperature', 'humidity', 'soil_moisture', 
                  'ph_level', 'co2', 'light', 'nitrogen', 'phosphorus', 'potassium', 'location', 'notes']
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)

init_csv()

@app.route('/')
def home():
    return jsonify({
        "message": "Smart Farming Pi Server is Running!",
        "endpoints": {
            "/sensor-data": "POST - Receive sensor data from ESP32",
            "/get-data": "GET - Get latest sensor data",
            "/api/sensor-history": "GET - Get all sensor history",
            "/api/current-sensors": "GET - Get current sensor readings for frontend"
        }
    })

@app.route('/sensor-data', methods=['POST'])
def receive_data():
    """Receive sensor data from ESP32 and store it"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid data format"}), 400
    
    # Add timestamp
    timestamp = datetime.now()
    data['timestamp'] = timestamp.isoformat()
    data['datetime'] = timestamp.strftime("%d/%m/%Y, %I:%M:%S %p")
    
    # Save to JSON file (latest reading)
    with open(data_file, 'w') as f:
        json.dump(data, f, indent=4)
    
    # Append to CSV file (history)
    try:
        with open(csv_file, 'a', newline='') as f:
            writer = csv.writer(f)
            row = [
                data.get('timestamp', ''),
                data.get('datetime', ''),
                data.get('temperature', 0),
                data.get('humidity', 0),
                data.get('soil_moisture', 0),
                data.get('ph_level', 0),
                data.get('co2', 0),
                data.get('light', 0),
                data.get('nitrogen', 0),
                data.get('phosphorus', 0),
                data.get('potassium', 0),
                data.get('location', 'Raspberry Pi'),
                data.get('notes', '')
            ]
            writer.writerow(row)
    except Exception as e:
        print(f"Error writing to CSV: {e}")
    
    print("Received Data:", data)
    return jsonify({"message": "Data received successfully", "timestamp": data['timestamp']}), 200

@app.route('/get-data', methods=['GET'])
def get_data():
    """Get the latest sensor data"""
    if os.path.exists(data_file):
        with open(data_file, 'r') as f:
            data = json.load(f)
        return jsonify(data), 200
    else:
        return jsonify({"error": "No sensor data found"}), 404

@app.route('/api/current-sensors', methods=['GET'])
def get_current_sensors():
    """Get current sensor data in the format expected by the frontend"""
    if os.path.exists(data_file):
        with open(data_file, 'r') as f:
            data = json.load(f)
        
        # Format data for frontend compatibility
        formatted_data = {
            "success": True,
            "data": {
                "temperature": float(data.get('temperature', 22)),
                "humidity": float(data.get('humidity', 65)),
                "soil_moisture": float(data.get('soil_moisture', 45)),
                "ph_level": float(data.get('ph_level', 6.5)),
                "co2": float(data.get('co2', 450)),
                "light": float(data.get('light', 800)),
                "nitrogen": float(data.get('nitrogen', 50)),
                "phosphorus": float(data.get('phosphorus', 30)),
                "potassium": float(data.get('potassium', 80)),
                "timestamp": data.get('timestamp', datetime.now().isoformat()),
                "location": data.get('location', 'Raspberry Pi Farm')
            }
        }
        return jsonify(formatted_data), 200
    else:
        # Return default values if no data available
        return jsonify({
            "success": False,
            "error": "No sensor data available",
            "data": {
                "temperature": 22,
                "humidity": 65,
                "soil_moisture": 45,
                "ph_level": 6.5,
                "co2": 450,
                "light": 800,
                "nitrogen": 50,
                "phosphorus": 30,
                "potassium": 80,
                "timestamp": datetime.now().isoformat(),
                "location": "Raspberry Pi Farm"
            }
        }), 200

@app.route('/api/sensor-history', methods=['GET'])
def get_sensor_history():
    """Get sensor history from CSV file"""
    try:
        if os.path.exists(csv_file):
            df = pd.read_csv(csv_file)
            # Convert to list of dictionaries
            history = df.to_dict('records')
            # Sort by timestamp (newest first)
            history = sorted(history, key=lambda x: x.get('timestamp', ''), reverse=True)
            return jsonify({
                "success": True,
                "history": history,
                "count": len(history)
            }), 200
        else:
            return jsonify({
                "success": True,
                "history": [],
                "count": 0
            }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to read sensor history: {str(e)}",
            "history": []
        }), 500

@app.route('/api/sensor-history', methods=['POST'])
def save_sensor_reading():
    """Save a timestamped sensor reading"""
    try:
        data = request.get_json()
        sensor_data = data.get('sensor_data', {})
        notes = data.get('notes', '')
        
        timestamp = datetime.now()
        
        # Prepare row for CSV
        row = [
            timestamp.isoformat(),
            timestamp.strftime("%d/%m/%Y, %I:%M:%S %p"),
            sensor_data.get('temperature', 0),
            sensor_data.get('humidity', 0),
            sensor_data.get('soil_moisture', sensor_data.get('moisture', 0)),
            sensor_data.get('ph_level', sensor_data.get('pH', 0)),
            sensor_data.get('co2', 0),
            sensor_data.get('light', 0),
            sensor_data.get('nitrogen', 0),
            sensor_data.get('phosphorus', 0),
            sensor_data.get('potassium', 0),
            sensor_data.get('location', 'Raspberry Pi Farm'),
            notes
        ]
        
        # Append to CSV
        with open(csv_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(row)
        
        return jsonify({
            "success": True,
            "message": "Sensor reading saved successfully",
            "reading": {
                "timestamp": timestamp.isoformat(),
                "datetime": timestamp.strftime("%d/%m/%Y, %I:%M:%S %p"),
                **sensor_data,
                "notes": notes
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to save sensor reading: {str(e)}"
        }), 500

@app.route('/api/sensor-history', methods=['DELETE'])
def clear_sensor_history():
    """Clear all sensor history"""
    try:
        # Reinitialize CSV with just headers
        init_csv()
        return jsonify({
            "success": True,
            "message": "Sensor history cleared successfully"
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to clear sensor history: {str(e)}"
        }), 500

if __name__ == "__main__":
    print("Starting Smart Farming Pi Server...")
    print("Endpoints available:")
    print("  POST /sensor-data - Receive data from ESP32")
    print("  GET /get-data - Get latest sensor data")
    print("  GET /api/current-sensors - Get current sensors for frontend")
    print("  GET /api/sensor-history - Get sensor history")
    print("  POST /api/sensor-history - Save timestamped reading")
    print("  DELETE /api/sensor-history - Clear sensor history")
    app.run(host="0.0.0.0", port=5000, debug=True)