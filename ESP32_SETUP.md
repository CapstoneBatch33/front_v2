# ESP32 Sensor Connection Setup

## How the ESP32 Connection Works

The dashboard now properly checks for ESP32 connectivity by:

1. **Trying to connect to ESP32** at the configured IP address
2. **Checking the response source** - distinguishes between real ESP32 data and mock data
3. **Showing connection status** - displays whether sensors are actively transmitting
4. **Updating every 5 seconds** - matches ESP32 transmission frequency

## Setup Instructions

### 1. Configure ESP32 IP Address

**Option A: Using the Dashboard Settings**
- Click the "Settings" button next to "Refresh" in the ESP32 connection card
- Enter your ESP32's IP address and port
- Click "Save & Test Connection"

**Option B: Using Environment Variables**
- Edit `.env.local` file in the project root
- Set `ESP32_IP=your.esp32.ip.address`
- Set `ESP32_PORT=80` (or your ESP32's port)

### 2. ESP32 Requirements

Your ESP32 should:
- Be connected to the same WiFi network as your laptop
- Serve sensor data at: `http://[ESP32_IP]:[PORT]/sensor-data`
- Return JSON data in this format:

```json
{
  "temperature": 25.5,
  "pH": 6.8,
  "moisture": 45,
  "nitrogen": 55,
  "phosphorus": 32,
  "potassium": 78,
  "humidity": 65,
  "timestamp": "2024-11-03T10:30:00Z"
}
```

### 3. Finding Your ESP32's IP Address

**Method 1: Router Admin Panel**
- Access your router's admin interface (usually 192.168.1.1 or 192.168.0.1)
- Look for connected devices
- Find your ESP32 device

**Method 2: ESP32 Serial Monitor**
- Connect ESP32 to your computer via USB
- Open Arduino IDE Serial Monitor
- The IP address should be printed when ESP32 connects to WiFi

**Method 3: Network Scanner**
- Use tools like `nmap` or "Advanced IP Scanner"
- Scan your local network (e.g., 192.168.1.0/24)

### 4. Testing the Connection

1. Open the dashboard
2. Look at the "ESP32 Sensor Connection" card
3. Status indicators:
   - **Connected + Transmitting Data**: ESP32 is working properly
   - **Checking...**: Testing connection
   - **Disconnected**: Using simulated data (ESP32 not reachable)

### 5. Troubleshooting

**If connection shows "Disconnected":**
- Verify ESP32 is powered on and connected to WiFi
- Check if ESP32 IP address is correct
- Ensure ESP32 and laptop are on same network
- Test ESP32 endpoint directly: `http://[ESP32_IP]/sensor-data`
- Check ESP32 code has the correct endpoint `/sensor-data`

**If getting timeout errors:**
- ESP32 might be slow to respond (current timeout: 3 seconds)
- Check ESP32 web server code for delays
- Ensure ESP32 isn't overloaded with other tasks

## Weather Data Integration

The dashboard now includes real weather data based on your location:

### Features:
- **Real wind speed and direction** from your current location
- **Live weather conditions** (temperature, humidity)
- **Location-based data** using browser geolocation
- **Automatic fallback** to demo data if location is denied

### Setup:
1. **Allow location access** when prompted by the browser
2. **Optional: Get OpenWeatherMap API key**:
   - Visit: https://openweathermap.org/api
   - Sign up for free account
   - Add your API key to `.env.local`: `OPENWEATHER_API_KEY=your_key_here`
3. **Without API key**: Uses demo weather data (still shows location-based info)

## Current Status

- ✅ ESP32 connection detection working
- ✅ Real vs mock data differentiation
- ✅ Connection status indicators
- ✅ 5-second update frequency
- ✅ Settings dialog for easy configuration
- ✅ Proper error handling and fallbacks
- ✅ Real weather data with location access
- ✅ Live wind speed and direction display