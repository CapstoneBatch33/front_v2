#!/usr/bin/env python3
"""
Test connection to your server.py
"""

import requests
import json

SERVER_IP = "192.168.1.152"
SERVER_PORT = "5000"
BASE_URL = f"http://{SERVER_IP}:{SERVER_PORT}"

print("=== TESTING CONNECTION TO YOUR SERVER ===")
print(f"Server: {BASE_URL}")

def test_endpoint(endpoint, method='GET'):
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == 'GET':
            response = requests.get(url, timeout=5)
        
        print(f"\n✅ {method} {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
            
        return response.status_code == 200
    except Exception as e:
        print(f"\n❌ {method} {endpoint}")
        print(f"Error: {e}")
        return False

# Test all endpoints
print("\n1. Testing server status...")
test_endpoint("/")

print("\n2. Testing sensor data...")
test_endpoint("/sensor-data")

print("\n3. Testing heartbeat status...")
test_endpoint("/heartbeat-status")

print("\n=== EXPECTED RESULTS ===")
print("✅ All endpoints should return 200 OK")
print("✅ Sensor data should show your ESP32 values")
print("✅ Heartbeat should show recent timestamp")
print("\nIf any fail, check if server.py is running on 192.168.1.152:5000")