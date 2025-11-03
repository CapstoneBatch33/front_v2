#!/usr/bin/env python3
"""
Test script to verify Pi server endpoints
"""

import requests
import json
import time

PI_SERVER = "http://rpi-desktop.local:5000"  # Change this to your Pi's IP if needed

def test_endpoint(url, method='GET', data=None):
    """Test a specific endpoint"""
    try:
        if method == 'GET':
            response = requests.get(url, timeout=5)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=5)
        
        print(f"{method} {url}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        print("-" * 50)
        return response.status_code == 200
    except Exception as e:
        print(f"{method} {url}")
        print(f"Error: {e}")
        print("-" * 50)
        return False

def main():
    print("Testing Pi Server Endpoints")
    print("=" * 50)
    
    # Test basic connectivity
    print("1. Testing basic connectivity...")
    if not test_endpoint(f"{PI_SERVER}/"):
        print("❌ Cannot reach Pi server!")
        return
    
    # Test sensor data GET endpoint
    print("2. Testing sensor data GET endpoint...")
    test_endpoint(f"{PI_SERVER}/sensor-data", 'GET')
    
    # Test heartbeat GET endpoint
    print("3. Testing heartbeat GET endpoint...")
    heartbeat_works = test_endpoint(f"{PI_SERVER}/esp32-heartbeat", 'GET')
    
    if not heartbeat_works:
        print("❌ Heartbeat endpoint not working!")
        print("This means you're not running the pi_server_with_heartbeat.py")
        print("Please replace your current Pi server with pi_server_with_heartbeat.py")
        return
    
    # Test sensor data POST (simulate ESP32)
    print("4. Testing sensor data POST (simulating ESP32)...")
    test_data = {
        "nitrogen": 45,
        "phosphorus": 30,
        "potassium": 60,
        "moisture": 55.5,
        "temperature": 28.7,
        "pH": 6.4
    }
    test_endpoint(f"{PI_SERVER}/sensor-data", 'POST', test_data)
    
    # Test heartbeat POST (simulate ESP32)
    print("5. Testing heartbeat POST (simulating ESP32)...")
    heartbeat_data = {
        "esp32_id": "TEST:MAC:ADDRESS",
        "uptime": 12345,
        "wifi_rssi": -45,
        "free_heap": 200000
    }
    test_endpoint(f"{PI_SERVER}/esp32-heartbeat", 'POST', heartbeat_data)
    
    # Check heartbeat status after POST
    print("6. Checking heartbeat status after simulated heartbeat...")
    test_endpoint(f"{PI_SERVER}/esp32-heartbeat", 'GET')
    
    print("✅ Test completed!")
    print("\nIf all endpoints work, your Pi server is correctly configured.")
    print("If heartbeat endpoint returns 404, you need to update your Pi server.")

if __name__ == "__main__":
    main()