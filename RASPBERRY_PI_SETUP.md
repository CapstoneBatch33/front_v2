# Raspberry Pi Smart Farm Server Setup

## Installation Steps

1. **Install Python dependencies on Raspberry Pi:**
   ```bash
   pip install Flask Flask-CORS
   ```

2. **Copy the smart_farm_server.py to your Raspberry Pi**

3. **Run the server:**
   ```bash
   python smart_farm_server.py
   ```

## API Endpoints

The Flask server provides these endpoints:

- `POST /sensor-data` - Receives sensor data from ESP32
- `GET /sensor-data` - Returns current sensor readings
- `GET /sensor-history` - Returns all historical sensor data

## Data Storage

- **Latest data**: `data/sensor_data.json`
- **Historical data**: `data/sensor_history.csv`

## ESP32 Configuration

Your ESP32 code is already configured correctly. It will:
1. Connect to WiFi
2. Find the Raspberry Pi using mDNS (rpi-desktop.local)
3. Send sensor data every 5 seconds to `/sensor-data`

## Next.js Configuration

Update your environment variables or modify the IP in `app/api/sensor-data/route.ts`:

```typescript
const RASPBERRY_PI_IP = 'your-pi-ip-address' // or 'rpi-desktop.local'
```

## Testing

1. Start the Flask server on Pi
2. Upload and run ESP32 code
3. Check your Next.js dashboard - it should show real sensor data
4. Data will be stored in CSV format for historical tracking