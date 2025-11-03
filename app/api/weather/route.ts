import { NextRequest, NextResponse } from 'next/server'

// OpenWeatherMap API (free tier)
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'demo_key'
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Check if we have a valid API key
    if (WEATHER_API_KEY === 'demo_key') {
      // Return mock data when no API key is configured
      const mockWeatherData = {
        wind_speed: Math.round((Math.random() * 15 + 5) * 10) / 10, // 5-20 km/h
        wind_direction: Math.floor(Math.random() * 360), // 0-359 degrees
        temperature: Math.round((Math.random() * 15 + 15) * 10) / 10, // 15-30°C
        humidity: Math.floor(Math.random() * 40 + 40), // 40-80%
        weather_condition: ['sunny', 'cloudy', 'partly_cloudy'][Math.floor(Math.random() * 3)],
        location: 'Demo Location'
      }

      return NextResponse.json({
        success: true,
        source: 'mock',
        data: mockWeatherData
      })
    }

    // Fetch real weather data from OpenWeatherMap
    const weatherResponse = await fetch(
      `${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    )

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`)
    }

    const weatherData = await weatherResponse.json()

    // Convert wind speed from m/s to km/h
    const windSpeedKmh = Math.round((weatherData.wind?.speed || 0) * 3.6 * 10) / 10

    const processedData = {
      wind_speed: windSpeedKmh,
      wind_direction: weatherData.wind?.deg || 0,
      temperature: Math.round((weatherData.main?.temp || 20) * 10) / 10,
      humidity: weatherData.main?.humidity || 50,
      weather_condition: getWeatherCondition(weatherData.weather?.[0]?.main || 'Clear'),
      location: `${weatherData.name}, ${weatherData.sys?.country || ''}`
    }

    return NextResponse.json({
      success: true,
      source: 'openweather',
      data: processedData
    })

  } catch (error) {
    console.error('Weather API error:', error)
    
    // Return mock data on error
    const mockWeatherData = {
      wind_speed: Math.round((Math.random() * 15 + 5) * 10) / 10,
      wind_direction: Math.floor(Math.random() * 360),
      temperature: Math.round((Math.random() * 15 + 15) * 10) / 10,
      humidity: Math.floor(Math.random() * 40 + 40),
      weather_condition: 'sunny',
      location: 'Unknown Location'
    }

    return NextResponse.json({
      success: true,
      source: 'mock_fallback',
      data: mockWeatherData
    })
  }
}

// Helper function to map OpenWeatherMap conditions to our conditions
function getWeatherCondition(condition: string): string {
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'sunny'
    case 'clouds':
      return 'cloudy'
    case 'rain':
    case 'drizzle':
      return 'rainy'
    case 'snow':
      return 'snowy'
    case 'thunderstorm':
      return 'stormy'
    case 'mist':
    case 'fog':
      return 'foggy'
    default:
      return 'partly_cloudy'
  }
}