# Smart Farming System - Complete Setup Guide

This system integrates a Next.js frontend, Node.js backend with AI assistant, and Raspberry Pi sensor data collection.

## System Architecture

```
ESP32 Sensors → Raspberry Pi → Backend API → Frontend Dashboard
                     ↓
                CSV Storage ← AI Assistant (Ollama)
```

## Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Ollama** (for AI assistant)

### Installation Commands

#### Windows
```bash
# Install Node.js from https://nodejs.org
# Install Python from https://python.org
# Install Ollama from https://ollama.ai

# Install Python packages
pip install -r requirements.txt

# Install Node.js packages
npm install
```

#### Linux/Mac
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python packages
pip3 install -r requirements.txt

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install Node.js packages
npm install
```

## Quick Start

### Option 1: Start Everything Automatically
```bash
node enhanced_start_all.js
```

This will start:
- Raspberry Pi server (port 5000)
- Backend API server (port 3001)
- Next.js frontend (port 3000)
- Sensor data simulator

### Option 2: Start Services Manually

#### 1. Start Raspberry Pi Server
```bash
python pi_server.py
```

#### 2. Start Backend API
```bash
node enhanced_server.js
```

#### 3. Start Frontend
```bash
npm run dev
```

#### 4. Start Ollama (for AI assistant)
```bash
ollama serve
ollama pull tinyllama
```

## System Components

### 1. Raspberry Pi Server (`pi_server.py`)
- **Port**: 5000
- **Purpose**: Receives sensor data from ESP32, stores in CSV
- **Endpoints**:
  - `POST /sensor-data` - Receive ESP32 data
  - `GET /api/current-sensors` - Get latest sensor readings
  - `GET /api/sensor-history` - Get historical data
  - `POST /api/sensor-history` - Save timestamped reading
  - `DELETE /api/sensor-history` - Clear history

### 2. Backend API (`enhanced_server.js`)
- **Port**: 3001
- **Purpose**: Proxy to Pi server + AI assistant
- **Features**:
  - Real sensor data integration
  - AI farming assistant with Ollama
  - Question classification
  - Sensor data context in AI responses

### 3. Frontend Dashboard (Next.js)
- **Port**: 3000
- **Features**:
  - Real-time sensor monitoring
  - Interactive charts and gauges
  - AI chatbot integration
  - Historical data analysis
  - Timestamped readings

## ESP32 Integration

### ESP32 Code Example
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* serverURL = "http://YOUR_PI_IP:5000/sensor-data";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
}

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<300> doc;
    doc["temperature"] = 25.5;
    doc["humidity"] = 60.0;
    doc["soil_moisture"] = 45.0;
    doc["ph_level"] = 6.8;
    doc["co2"] = 420;
    doc["light"] = 750;
    doc["nitrogen"] = 55;
    doc["phosphorus"] = 35;
    doc["potassium"] = 85;
    doc["location"] = "Field Sensor 1";
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      Serial.println("Data sent successfully");
    } else {
      Serial.println("Error sending data");
    }
    
    http.end();
  }
}

void loop() {
  sendSensorData();
  delay(30000); // Send every 30 seconds
}
```

## Configuration

### Environment Variables
Create a `.env.local` file:
```
RASPBERRY_PI_URL=http://localhost:5000
OLLAMA_URL=http://localhost:11434
```

### Raspberry Pi IP Configuration
Update the Pi IP in `enhanced_server.js`:
```javascript
const RASPBERRY_PI_URL = process.env.RASPBERRY_PI_URL || 'http://192.168.1.100:5000';
```

## Data Storage

### CSV Format (`data/sensor_history.csv`)
```csv
timestamp,datetime,temperature,humidity,soil_moisture,ph_level,co2,light,nitrogen,phosphorus,potassium,location,notes
2024-01-01T12:00:00.000Z,1/1/2024 12:00:00 PM,25.5,60.0,45.0,6.8,420,750,55,35,85,Field Sensor 1,Normal readings
```

### JSON Format (`data/sensor_data.json`)
```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "soil_moisture": 45.0,
  "ph_level": 6.8,
  "co2": 420,
  "light": 750,
  "nitrogen": 55,
  "phosphorus": 35,
  "potassium": 85,
  "location": "Field Sensor 1",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "datetime": "1/1/2024, 12:00:00 PM"
}
```

## API Endpoints

### Backend API (Port 3001)
- `GET /api/health` - Health check
- `GET /api/sensor-data` - Current sensor data
- `GET /api/sensor-history` - Historical data
- `POST /api/sensor-history` - Save reading
- `DELETE /api/sensor-history` - Clear history
- `POST /api/assistant` - AI farming assistant
- `GET /api/test-pi` - Test Pi connection

### Pi Server API (Port 5000)
- `GET /` - Server status
- `POST /sensor-data` - Receive ESP32 data
- `GET /get-data` - Latest sensor data
- `GET /api/current-sensors` - Formatted sensor data
- `GET /api/sensor-history` - Historical data
- `POST /api/sensor-history` - Save timestamped reading
- `DELETE /api/sensor-history` - Clear history

## Troubleshooting

### Common Issues

#### 1. Python Dependencies
```bash
pip install flask flask-cors pandas requests numpy
```

#### 2. Node.js Dependencies
```bash
npm install
```

#### 3. Ollama Not Working
```bash
# Start Ollama service
ollama serve

# Pull TinyLlama model
ollama pull tinyllama
```

#### 4. Port Conflicts
- Frontend: Change port in `package.json`
- Backend: Change `port` variable in `enhanced_server.js`
- Pi Server: Change `port` parameter in `pi_server.py`

#### 5. Pi Connection Issues
- Check Pi IP address
- Ensure Pi server is running
- Check firewall settings
- Verify network connectivity

### Logs and Debugging

#### View Backend Logs
```bash
node enhanced_server.js
```

#### View Pi Server Logs
```bash
python pi_server.py
```

#### View Frontend Logs
```bash
npm run dev
```

## Production Deployment

### Raspberry Pi Setup
1. Install Raspberry Pi OS
2. Install Python and dependencies
3. Copy `pi_server.py` to Pi
4. Set up as systemd service:

```bash
sudo nano /etc/systemd/system/farming-pi.service
```

```ini
[Unit]
Description=Smart Farming Pi Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smart-farming
ExecStart=/usr/bin/python3 pi_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable farming-pi.service
sudo systemctl start farming-pi.service
```

### Frontend Deployment
```bash
npm run build
npm start
```

## Features

### Real-time Monitoring
- Live sensor data updates every 10 seconds
- Interactive gauges and charts
- Alert system for critical values
- Connection status indicators

### AI Assistant
- Context-aware responses using current sensor data
- Question classification (Disease, Irrigation, Nutrition, General)
- Farming expertise for wheat and maize crops
- Integration with Ollama TinyLlama model

### Data Management
- Automatic CSV storage of all readings
- Timestamped entries with notes
- Historical data visualization
- Export functionality

### Multi-device Support
- Responsive web interface
- Mobile-friendly design
- Cross-platform compatibility

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all services are running
3. Check network connectivity
4. Review log files for errors

## License

This project is open source and available under the MIT License.