#!/usr/bin/env python3
"""
Test script to simulate ESP32 sending sensor data to the Raspberry Pi server
This script helps verify the integration is working correctly
"""

import requests
import json
import time
import random
from datetime import datetime

# Configuration
PI_SERVER_URL = "http://localhost:5000/sensor-data"
BACKEND_API_URL = "http://localhost:3001/api/sensor-data"

def generate_realistic_sensor_data():
    """Generate realistic sensor data similar to what ESP32 would send"""
    return {
        "temperature": round(random.uniform(18, 32), 1),
        "humidity": round(random.uniform(40, 85), 1),
        "soil_moisture": round(random.uniform(25, 75), 1),
        "ph_level": round(random.uniform(5.5, 8.0), 1),
        "co2": random.randint(300, 700),
        "light": random.randint(100, 1200),
        "nitrogen": random.randint(20, 100),
        "phosphorus": random.randint(10, 60),
        "potassium": random.randint(30, 150),
        "location": "ESP32 Test Node"
    }

def test_pi_server_connection():
    """Test connection to Pi server"""
    try:
        response = requests.get("http://localhost:5000/", timeout=5)
        print("✅ Pi Server is running")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Pi Server connection failed: {e}")
        return False

def test_backend_connection():
    """Test connection to backend server"""
    try:
        response = requests.get("http://localhost:3001/api/health", timeout=5)
        print("✅ Backend Server is running")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend Server connection failed: {e}")
        return False

def send_test_data():
    """Send test sensor data to Pi server"""
    data = generate_realistic_sensor_data()
    
    try:
        response = requests.post(PI_SERVER_URL, json=data, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Data sent successfully: {data}")
            return True
        else:
            print(f"❌ Failed to send data. Status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending data: {e}")
        return False

def verify_data_retrieval():
    """Verify data can be retrieved from backend"""
    try:
        response = requests.get(BACKEND_API_URL, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Data retrieval successful")
                print(f"   Temperature: {data['data'].get('temperature')}°C")
                print(f"   Humidity: {data['data'].get('humidity')}%")
                print(f"   Soil Moisture: {data['data'].get('soil_moisture')}%")
                return True
            else:
                print("❌ Data retrieval failed - no success flag")
                return False
        else:
            print(f"❌ Data retrieval failed. Status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error retrieving data: {e}")
        return False

def main():
    print("🧪 ESP32 Integration Test")
    print("=" * 40)
    
    # Test connections
    pi_ok = test_pi_server_connection()
    backend_ok = test_backend_connection()
    
    if not pi_ok or not backend_ok:
        print("\n❌ Some services are not running. Please start them first:")
        print("   python pi_server.py")
        print("   node enhanced_server.js")
        return
    
    print("\n📡 Testing data transmission...")
    
    # Send test data
    if send_test_data():
        time.sleep(2)  # Wait for data to be processed
        
        # Verify data retrieval
        if verify_data_retrieval():
            print("\n🎉 Integration test PASSED!")
            print("Your ESP32 can now send data using this format.")
        else:
            print("\n❌ Integration test FAILED at data retrieval step")
    else:
        print("\n❌ Integration test FAILED at data transmission step")

if __name__ == "__main__":
    main()