# Real Weather Data Integration

## Overview

The dashboard now displays real weather data including wind speed, direction, temperature, and humidity based on your current location using the browser's geolocation API and OpenWeatherMap API.

## How It Works

### 1. Location Access
- **Browser Geolocation**: Requests user's current location
- **Permission Handling**: Gracefully handles denied/granted permissions
- **Fallback Location**: Uses London coordinates if location access is denied

### 2. Weather Data Sources
- **OpenWeatherMap API**: Real weather data when API key is provided
- **Demo Mode**: Realistic mock data when no API key is configured
- **Fallback**: Simulated data if all else fails

### 3. Data Display
- **Wind Speed**: Real wind speed in km/h with direction (N, NE, E, etc.)
- **Temperature**: Location-based temperature (overrides sensor temperature in weather card)
- **Humidity**: Real humidity from weather service
- **Weather Icons**: Dynamic icons based on actual weather conditions

## Setup Instructions

### Option 1: With Real Weather Data (Recommended)

1. **Get OpenWeatherMap API Key** (Free):
   - Visit: https://openweathermap.org/api
   - Sign up for a free account
   - Copy your API key

2. **Configure API Key**:
   - Edit `.env.local` file
   - Set: `OPENWEATHER_API_KEY=your_actual_api_key_here`

3. **Allow Location Access**:
   - When prompted by browser, click "Allow"
   - Dashboard will show "Live Location" badge

### Option 2: Demo Mode (No API Key Required)

1. **Keep Default Setting**:
   - Leave `OPENWEATHER_API_KEY=demo_key` in `.env.local`
   - Still shows realistic weather data (but not real)

2. **Allow Location Access** (Optional):
   - Improves demo data accuracy
   - Shows your actual location name

## Features

### Real-Time Updates
- **Wind Speed**: Updates with actual local wind conditions
- **Wind Direction**: Shows compass direction (N, NE, E, SE, etc.)
- **Weather Icons**: Changes based on actual weather (sunny, cloudy, rainy, etc.)
- **Location Display**: Shows city and country name

### Visual Indicators
- **Live Location Badge**: Green badge when using real location
- **Getting Location Badge**: Animated badge while accessing location
- **Enable Location Button**: Appears if location access was denied
- **Data Source Indicator**: Shows whether data is real or demo

### Progressive Enhancement
- **Works Without Location**: Falls back to demo location (London)
- **Works Without API Key**: Uses realistic mock data
- **Works Offline**: Graceful fallback to simulated data

## API Endpoint

### `/api/weather?lat={latitude}&lon={longitude}`

**Parameters:**
- `lat`: Latitude coordinate
- `lon`: Longitude coordinate

**Response:**
```json
{
  "success": true,
  "source": "openweather", // or "mock" or "mock_fallback"
  "data": {
    "wind_speed": 12.5,
    "wind_direction": 225,
    "temperature": 18.3,
    "humidity": 65,
    "weather_condition": "cloudy",
    "location": "London, GB"
  }
}
```

## Privacy & Performance

### Privacy
- **Location data never stored**: Only used for weather API calls
- **No tracking**: Location is only used locally
- **User control**: Can deny location access anytime

### Performance
- **Cached requests**: Location cached for 5 minutes
- **Minimal API calls**: Weather updated every ~5 minutes, not every 5 seconds
- **Fast fallbacks**: Quick response even when APIs fail
- **Timeout protection**: 5-second timeout prevents hanging

## Troubleshooting

### Location Issues
- **"Enable Location" button**: Click to retry location access
- **Browser settings**: Check if location is blocked for the site
- **HTTPS required**: Geolocation only works on HTTPS (or localhost)

### Weather Data Issues
- **Check API key**: Ensure OpenWeatherMap API key is valid
- **API limits**: Free tier has 1000 calls/day limit
- **Network issues**: Will fallback to mock data automatically

### Visual Issues
- **No wind direction**: Check if API is returning wind data
- **Wrong location**: Browser might be using IP-based location
- **Outdated data**: Weather updates every few minutes, not real-time

## Current Status

✅ **Working Features:**
- Real wind speed and direction from user location
- Browser geolocation integration
- OpenWeatherMap API integration
- Graceful fallbacks for all failure scenarios
- Visual indicators for data source and location status
- Privacy-friendly implementation (no data storage)
- Performance optimized (minimal API calls)