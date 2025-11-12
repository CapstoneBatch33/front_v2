from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import csv
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create necessary directories
os.makedirs("data", exist_ok=True)

# File paths
json_file = "data/sensor_data.json"
csv_file = "data/sensor_history.csv"

# Initialize CSV file with headers if it doesn't exist
def init_csv():
    if not os.path.exists(csv_file):
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'nitrogen', 'phosphorus', 'potassium', 'moisture', 'temperature', 'humidity'])

@app.route("/")
def home():
    return "Smart Farm Server is running!"

@app.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    try:
        data = request.get_json()
        print("Received sensor data:", data)
        
        # Add timestamp
        timestamp = datetime.now().isoformat()
        data['timestamp'] = timestamp
        
        # Save latest data to JSON file
        with open(json_file, 'w') as f:
            json.dump(data, f, indent=4)
        
        # Append to CSV file
        with open(csv_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                timestamp,
                data.get('nitrogen', 0),
                data.get('phosphorus', 0),
                data.get('potassium', 0),
                data.get('moisture', 0),
                data.get('temperature', 0),
                data.get('humidity', 0)
            ])
        
        return jsonify({"message": "Data received successfully"}), 200
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/sensor-data', methods=['GET'])
def get_current_sensor_data():
    try:
        # Try to read from JSON file first (latest data)
        if os.path.exists(json_file):
            with open(json_file, 'r') as f:
                data = json.load(f)
            return jsonify(data), 200
        
        # If JSON doesn't exist, read last row from CSV
        if os.path.exists(csv_file):
            with open(csv_file, 'r') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                if rows:
                    latest_row = rows[-1]
                    return jsonify(latest_row), 200
        
        # No data available
        return jsonify({"error": "No sensor data available"}), 404
        
    except Exception as e:
        print("Error reading sensor data:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/sensor-history', methods=['GET'])
def get_sensor_history():
    try:
        if not os.path.exists(csv_file):
            return jsonify({"error": "No historical data available"}), 404
        
        history = []
        with open(csv_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                history.append(row)
        
        return jsonify(history), 200
        
    except Exception as e:
        print("Error reading sensor history:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Smart Farm Flask server...")
    init_csv()
    app.run(host="0.0.0.0", port=5000, debug=True)