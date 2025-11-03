"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Droplets, Thermometer, Leaf, CloudSun, Tractor, AlertTriangle, Sun, Wind, Clock, Save, History, Wifi, WifiOff, Download, FileText, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Function to fetch real sensor data from ESP32 via backend
const fetchCurrentSensorData = async () => {
  try {
    const response = await fetch('/api/sensor-data')
    const result = await response.json()
    
    if (result.success) {
      return {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        moisture: result.data.soil_moisture || 45,
        temperature: result.data.temperature || 22,
        pH: result.data.ph_level?.toString() || "6.5",
        co2: result.data.co2 || 450,
        light: result.data.light || 800,
        humidity: result.data.humidity || 65,
        nitrogen: result.data.nitrogen || 50,
        phosphorus: result.data.phosphorus || 30,
        potassium: result.data.potassium || 80,
        source: result.source || 'unknown' // Track data source
      }
    }
  } catch (error) {
    console.error('Error fetching sensor data:', error)
  }
  
  // Fallback to default values
  return {
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    moisture: 45,
    temperature: 22,
    pH: "6.5",
    co2: 450,
    light: 800,
    humidity: 65,
    nitrogen: 50,
    phosphorus: 30,
    potassium: 80,
    source: 'fallback'
  }
}

// Generate initial mock data for charts (24 hours)
const generateInitialMockData = () => {
  const now = new Date()
  const data = []

  for (let i = 0; i < 24; i++) {
    const time = new Date(now)
    time.setHours(now.getHours() - 23 + i)

    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      moisture: Math.floor(Math.random() * 20) + 30,
      temperature: Math.floor(Math.random() * 10) + 18,
      pH: (Math.random() * 2 + 5).toFixed(1),
      nitrogen: Math.floor(Math.random() * 40) + 30,
      phosphorus: Math.floor(Math.random() * 30) + 15,
      potassium: Math.floor(Math.random() * 40) + 60,
    })
  }

  return data
}

// Status indicators
const getStatusColor = (value: number, type: string) => {
  switch (type) {
    case "moisture":
      return value < 35 ? "destructive" : value > 45 ? "yellow" : "green"
    case "temperature":
      return value < 20 ? "blue" : value > 25 ? "destructive" : "green"
    case "pH":
      return value < 6.0 ? "yellow" : value > 6.8 ? "yellow" : "green"
    case "nitrogen":
      return value < 40 ? "destructive" : value > 60 ? "yellow" : "green"
    case "phosphorus":
      return value < 20 ? "destructive" : value > 40 ? "yellow" : "green"
    case "potassium":
      return value < 60 ? "destructive" : value > 100 ? "yellow" : "green"
    default:
      return "green"
  }
}

const getStatusText = (color: string) => {
  switch (color) {
    case "green":
      return "Optimal"
    case "yellow":
      return "Warning"
    case "destructive":
      return "Critical"
    case "blue":
      return "Low"
    default:
      return "Unknown"
  }
}

// Convert wind direction degrees to compass direction
const getWindDirection = (degrees: number) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

export default function Dashboard() {
  const [data, setData] = useState(generateInitialMockData())
  const [currentSensorData, setCurrentSensorData] = useState<any>(null)
  const [alerts, setAlerts] = useState<string[]>([])
  const [weatherCondition, setWeatherCondition] = useState("sunny")
  const [tractorPosition, setTractorPosition] = useState(0)
  const [activeSensor, setActiveSensor] = useState<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  
  // Timestamping functionality
  const [timestampNotes, setTimestampNotes] = useState("")
  const [sensorHistory, setSensorHistory] = useState<any[]>([])
  
  // Health card generation
  const [isGeneratingHealthCard, setIsGeneratingHealthCard] = useState(false)
  const [selectedDataForHealthCard, setSelectedDataForHealthCard] = useState<any>(null)
  const [showHealthCardDialog, setShowHealthCardDialog] = useState(false)
  const [healthCardForm, setHealthCardForm] = useState({
    dataSource: 'current', // 'current' or 'timestamped'
    selectedReading: null as any,
    farmerDetails: {
      name: '',
      address: '',
      village: '',
      subDistrict: '',
      district: '',
      pin: '',
      aadhaar: '',
      mobile: '',
      farmSize: '',
      surveyNo: '',
      khasraNo: '',
      latitude: '',
      longitude: '',
      irrigationType: 'Irrigated'
    }
  })
  
  // Connection status
  const [sensorConnectionStatus, setSensorConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [lastDataReceived, setLastDataReceived] = useState<Date | null>(null)
  const [showConnectionSettings, setShowConnectionSettings] = useState(false)
  const [esp32Settings, setEsp32Settings] = useState({
    ip: '192.168.1.100',
    port: '80'
  })
  
  // Weather data state
  const [weatherData, setWeatherData] = useState<any>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking')
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)

  // Current values (use real sensor data if available, otherwise last data point)
  const currentValues = currentSensorData || data[data.length - 1]

  // Get user location and fetch weather data
  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied')
      return
    }

    try {
      setLocationPermission('checking')
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        })
      })

      const location = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }
      
      setUserLocation(location)
      setLocationPermission('granted')
      await fetchWeatherData(location.lat, location.lon)
      
    } catch (error) {
      console.error('Location access denied or failed:', error)
      setLocationPermission('denied')
      // Fetch weather with mock location (London as fallback)
      await fetchWeatherData(51.5074, -0.1278)
    }
  }

  // Fetch weather data from API
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      const result = await response.json()
      
      if (result.success) {
        setWeatherData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
    }
  }

  // Load sensor history and get location on component mount
  useEffect(() => {
    loadSensorHistory()
    fetchRealSensorData() // Initial fetch
    getUserLocation() // Get location and weather data
  }, [])

  // Fetch real sensor data from ESP32 sensors
  const fetchRealSensorData = async () => {
    try {
      setSensorConnectionStatus('checking')
      const sensorData = await fetchCurrentSensorData()
      setCurrentSensorData(sensorData)
      
      // Check if we got real ESP32 data or mock data
      if (sensorData.source === 'esp32') {
        setSensorConnectionStatus('connected')
        setLastDataReceived(new Date())
      } else {
        setSensorConnectionStatus('disconnected')
      }
      
      // Update chart data with sensor reading
      setData(prevData => [
        ...prevData.slice(1),
        sensorData
      ])
      
    } catch (error) {
      console.error('Failed to fetch real sensor data:', error)
      setSensorConnectionStatus('disconnected')
    }
  }

  // Update data every 5 seconds to match ESP32 transmission frequency
  useEffect(() => {
    const interval = setInterval(async () => {
      // Fetch real sensor data
      await fetchRealSensorData()

      // Check for alerts using current values
      const latest = currentValues
      if (latest.moisture < 35) {
        setAlerts((prev) => [...prev, `Low soil moisture detected: ${latest.moisture}%`])
      }
      if (latest.temperature > 25) {
        setAlerts((prev) => [...prev, `High temperature detected: ${latest.temperature}°C`])
      }
      if (latest.pH && parseFloat(latest.pH) < 6.0) {
        setAlerts((prev) => [...prev, `Low soil pH detected: ${latest.pH}`])
      }

      // Limit alerts to last 5
      setAlerts(prev => prev.slice(-5))

      // Update weather data periodically (every 5 minutes)
      if (Math.random() > 0.98 && userLocation) { // Very low chance to avoid too many API calls
        fetchWeatherData(userLocation.lat, userLocation.lon)
      } else if (!weatherData && Math.random() > 0.9) {
        // Fallback: Update weather condition randomly if no real data
        const conditions = ["sunny", "cloudy", "rainy"]
        setWeatherCondition(conditions[Math.floor(Math.random() * conditions.length)])
      }

      // Move tractor
      setTractorPosition((prev) => (prev + 5) % 100)
    }, 5000) // 5 seconds to match ESP32 transmission

    return () => clearInterval(interval)
  }, [currentValues])



  // Load sensor history
  const loadSensorHistory = async () => {
    try {
      const response = await fetch('/api/sensor-history')
      const data = await response.json()
      
      if (data.success) {
        setSensorHistory(data.history)
      }
    } catch (error) {
      console.error('Failed to load sensor history:', error)
    }
  }

  // Export sensor history to CSV
  const exportToCSV = () => {
    if (sensorHistory.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = ['Timestamp', 'Temperature (°C)', 'pH Level', 'Soil Moisture (%)', 'Nitrogen (ppm)', 'Phosphorus (ppm)', 'Potassium (ppm)', 'Notes']
    const csvContent = [
      headers.join(','),
      ...sensorHistory.map(row => [
        row.datetime || row.timestamp,
        row.temperature || '',
        row.ph_level || row.pH || '',
        row.soil_moisture || row.moisture || '',
        row.nitrogen || '',
        row.phosphorus || '',
        row.potassium || '',
        `"${row.notes || ''}"` // Wrap notes in quotes to handle commas
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sensor_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("CSV file downloaded successfully!")
  }

  // Open health card dialog
  const openHealthCardDialog = (useCurrentData = true, selectedReading = null) => {
    setHealthCardForm(prev => ({
      ...prev,
      dataSource: useCurrentData ? 'current' : 'timestamped',
      selectedReading: selectedReading
    }))
    setShowHealthCardDialog(true)
  }

  // Generate soil health card with form data
  const generateHealthCard = async () => {
    // Validate required fields
    const { farmerDetails, dataSource, selectedReading } = healthCardForm
    if (!farmerDetails.name || !farmerDetails.address || !farmerDetails.mobile) {
      toast.error("Please fill in all required fields (Name, Address, Mobile)")
      return
    }

    setIsGeneratingHealthCard(true)
    try {
      const sensorData = dataSource === 'current' ? {
        temperature: currentValues.temperature,
        ph_level: currentValues.ph_level,
        pH: currentValues.ph_level,
        soil_moisture: currentValues.soil_moisture,
        moisture: currentValues.soil_moisture,
        nitrogen: currentValues.nitrogen,
        phosphorus: currentValues.phosphorus,
        potassium: currentValues.potassium,
        timestamp: new Date().toISOString()
      } : {
        temperature: selectedReading.temperature,
        ph_level: selectedReading.ph_level,
        pH: selectedReading.ph_level,
        soil_moisture: selectedReading.soil_moisture,
        moisture: selectedReading.soil_moisture,
        nitrogen: selectedReading.nitrogen,
        phosphorus: selectedReading.phosphorus,
        potassium: selectedReading.potassium,
        timestamp: selectedReading.datetime || selectedReading.timestamp
      }

      const farmerData = {
        name: farmerDetails.name,
        address: farmerDetails.address,
        village: farmerDetails.village,
        sub_district: farmerDetails.subDistrict,
        district: farmerDetails.district,
        pin: farmerDetails.pin,
        aadhaar: farmerDetails.aadhaar,
        mobile: farmerDetails.mobile,
        farm_size: farmerDetails.farmSize,
        survey_no: farmerDetails.surveyNo,
        khasra_no: farmerDetails.khasraNo,
        latitude: farmerDetails.latitude,
        longitude: farmerDetails.longitude,
        irrigation_type: farmerDetails.irrigationType
      }

      const response = await fetch('/api/generate-health-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensorData, farmerData })
      })

      const result = await response.json()

      if (result.success) {
        // Create download link for the image
        const link = document.createElement('a')
        link.href = `data:image/png;base64,${result.image}`
        link.download = `soil_health_card_${farmerDetails.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`
        link.click()
        
        toast.success("Soil Health Card generated and downloaded successfully!")
        setShowHealthCardDialog(false)
        
        // Reset form
        setHealthCardForm(prev => ({
          ...prev,
          farmerDetails: {
            name: '',
            address: '',
            village: '',
            subDistrict: '',
            district: '',
            pin: '',
            aadhaar: '',
            mobile: '',
            farmSize: '',
            surveyNo: '',
            khasraNo: '',
            latitude: '',
            longitude: '',
            irrigationType: 'Irrigated'
          }
        }))
      } else {
        toast.error(`Failed to generate health card: ${result.error}`)
      }
    } catch (error) {
      toast.error(`Error generating health card: ${error}`)
    } finally {
      setIsGeneratingHealthCard(false)
    }
  }

  // Timestamp current sensor readings
  const timestampReading = async () => {
    setIsLoading(true)
    try {
      const currentReading = currentValues
      
      // Save to local history
      const response = await fetch('/api/sensor-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensor_data: {
            temperature: currentReading.temperature,
            humidity: currentReading.humidity,
            moisture: currentReading.moisture,
            pH: currentReading.pH,
            nitrogen: currentReading.nitrogen,
            phosphorus: currentReading.phosphorus,
            potassium: currentReading.potassium,
            location: 'Farm Dashboard'
          },
          notes: timestampNotes
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success("Sensor reading timestamped successfully!")
        setTimestampNotes("")
        loadSensorHistory()
      } else {
        toast.error(`Failed to timestamp reading: ${result.error}`)
      }
    } catch (error) {
      toast.error(`Error timestamping reading: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-2">Farm Sensor Dashboard</h1>
        <p className="text-muted-foreground mb-8">Real-time monitoring of your farm's vital statistics</p>
      </motion.div>

      {/* Weather and Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-blue-500" />
              Weather Conditions
              {locationPermission === 'granted' && (
                <Badge variant="outline" className="text-green-600 text-xs">
                  Live Location
                </Badge>
              )}
              {locationPermission === 'checking' && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  Getting Location...
                </Badge>
              )}
            </CardTitle>
            {weatherData?.location && (
              <CardDescription className="text-xs">
                {weatherData.location}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">
                  {weatherData?.temperature || currentValues.temperature}°C
                </p>
                <p className="text-muted-foreground">
                  Humidity: {weatherData?.humidity || currentValues.humidity}%
                </p>
              </div>
              <div className="text-4xl">
                {((weatherData?.weather_condition || weatherCondition) === "sunny") && <Sun className="h-12 w-12 text-yellow-500 animate-pulse-slow" />}
                {((weatherData?.weather_condition || weatherCondition) === "cloudy") && <CloudSun className="h-12 w-12 text-blue-300 animate-pulse-slow" />}
                {((weatherData?.weather_condition || weatherCondition) === "rainy") && <Droplets className="h-12 w-12 text-blue-500 animate-pulse-slow" />}
                {((weatherData?.weather_condition || weatherCondition) === "partly_cloudy") && <CloudSun className="h-12 w-12 text-gray-400 animate-pulse-slow" />}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Wind: {weatherData?.wind_speed || (Math.floor(Math.random() * 10) + 5)} km/h
                  {weatherData?.wind_direction && (
                    <span className="ml-1">
                      ({getWindDirection(weatherData.wind_direction)})
                    </span>
                  )}
                </p>
                {locationPermission === 'denied' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={getUserLocation}
                    className="text-xs h-6 px-2"
                  >
                    Enable Location
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Wind className="h-4 w-4" />
                <div className="bg-secondary/20 h-2 rounded-full w-full">
                  <div
                    className="bg-secondary h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((weatherData?.wind_speed || 10) * 3, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              {weatherData?.source && (
                <p className="text-xs text-muted-foreground mt-1">
                  {weatherData.source === 'openweather' ? 'Real weather data' : 
                   weatherData.source === 'mock' ? 'Demo weather data (no API key)' : 
                   'Simulated weather data'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <ul className="space-y-2">
                {alerts.map((alert, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 text-sm p-2 bg-destructive/10 rounded-md"
                  >
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    {alert}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No alerts at this time</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {sensorConnectionStatus === 'connected' ? 
                <Wifi className="h-5 w-5 text-green-500" /> : 
                sensorConnectionStatus === 'checking' ?
                <Wifi className="h-5 w-5 text-yellow-500 animate-pulse" /> :
                <WifiOff className="h-5 w-5 text-red-500" />
              }
              ESP32 Sensor Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    sensorConnectionStatus === 'connected' ? "default" : 
                    sensorConnectionStatus === 'checking' ? "secondary" : 
                    "destructive"
                  }>
                    {sensorConnectionStatus === 'connected' ? "Connected" : 
                     sensorConnectionStatus === 'checking' ? "Checking..." : 
                     "Disconnected"}
                  </Badge>
                  {sensorConnectionStatus === 'connected' && (
                    <Badge variant="outline" className="text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Transmitting Data
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {sensorConnectionStatus === 'connected' ? 
                    `ESP32 sensors actively transmitting every 5 seconds` : 
                   sensorConnectionStatus === 'checking' ? 
                    "Testing ESP32 connection..." : 
                    "ESP32 not responding - using simulated data"}
                </p>
                {lastDataReceived && sensorConnectionStatus === 'connected' && (
                  <p className="text-xs text-muted-foreground">
                    Last data received: {lastDataReceived.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchRealSensorData} variant="outline" size="sm">
                  Refresh
                </Button>
                <Button 
                  onClick={() => setShowConnectionSettings(true)} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>





      {/* Main Sensor Data */}
      <Tabs defaultValue="knobs" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="knobs">Sensor Knobs</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="knobs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Temperature",
                value: currentValues.temperature,
                unit: "°C",
                icon: <Thermometer className="h-6 w-6" />,
                type: "temperature",
                min: 0,
                max: 40,
                optimal: [20, 25],
                color: "red"
              },
              {
                name: "pH Level",
                value: Number.parseFloat(currentValues.pH),
                unit: "",
                icon: <Leaf className="h-6 w-6" />,
                type: "pH",
                min: 0,
                max: 14,
                optimal: [6.0, 6.8],
                color: "green"
              },
              {
                name: "Soil Moisture",
                value: currentValues.moisture,
                unit: "%",
                icon: <Droplets className="h-6 w-6" />,
                type: "moisture",
                min: 0,
                max: 100,
                optimal: [35, 45],
                color: "blue"
              },
              {
                name: "Nitrogen",
                value: currentValues.nitrogen,
                unit: "ppm",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">N</text>
                  </svg>
                ),
                type: "nitrogen",
                min: 0,
                max: 100,
                optimal: [40, 60],
                color: "orange"
              },
              {
                name: "Phosphorus",
                value: currentValues.phosphorus,
                unit: "ppm",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">P</text>
                  </svg>
                ),
                type: "phosphorus",
                min: 0,
                max: 80,
                optimal: [20, 40],
                color: "purple"
              },
              {
                name: "Potassium",
                value: currentValues.potassium,
                unit: "ppm",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">K</text>
                  </svg>
                ),
                type: "potassium",
                min: 0,
                max: 120,
                optimal: [60, 100],
                color: "teal"
              },
            ].map((sensor) => {
              const statusColor = getStatusColor(sensor.value, sensor.type)
              const percentage = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100
              const angle = (percentage / 100) * 270 - 135 // Convert to degrees for knob

              return (
                <Card key={sensor.name} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {sensor.icon}
                        {sensor.name}
                      </span>
                      <Badge variant={statusColor as "default" | "destructive" | "secondary" | "outline"}>
                        {getStatusText(statusColor)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Circular Progress Ring */}
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background Circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="8"
                        />
                        {/* Progress Circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke={
                            statusColor === "green" ? "#22c55e" :
                            statusColor === "yellow" ? "#eab308" :
                            statusColor === "destructive" ? "#ef4444" :
                            statusColor === "blue" ? "#3b82f6" :
                            "#22c55e"
                          }
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(percentage / 100) * 314.16} 314.16`}
                          className="transition-all duration-500 ease-in-out"
                        />
                      </svg>
                      
                      {/* Value Display */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{sensor.value}</div>
                          <div className="text-xs text-muted-foreground">{sensor.unit}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-muted-foreground px-2">
                        <span>{sensor.min}</span>
                        <span>{sensor.max}</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-center px-2">
                        Optimal: {sensor.optimal[0]} - {sensor.optimal[1]} {sensor.unit}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-500" />
                    Timestamped Sensor History
                  </CardTitle>
                  <CardDescription>
                    View historical sensor readings with timestamps and notes
                  </CardDescription>
                </div>
                {sensorHistory.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={exportToCSV}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => openHealthCardDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Health Card
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sensorHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Temperature Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory.slice(-20).reverse()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="datetime" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                              />
                              <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">pH Level Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory.slice(-20).reverse()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="datetime" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                              />
                              <Line type="monotone" dataKey="ph_level" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Soil Moisture Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory.slice(-20).reverse()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="datetime" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                              />
                              <Line type="monotone" dataKey="soil_moisture" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Nitrogen Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory.slice(-20).reverse()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="datetime" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                              />
                              <Line type="monotone" dataKey="nitrogen" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Phosphorus Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory.slice(-20).reverse()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="datetime" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                              />
                              <Line type="monotone" dataKey="phosphorus" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Potassium Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensorHistory.slice(-20).reverse()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="datetime" 
                                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              />
                              <YAxis />
                              <Tooltip 
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                              />
                              <Line type="monotone" dataKey="potassium" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sensorHistory.map((reading, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{reading.datetime}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{reading.location}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openHealthCardDialog(false, reading)}
                              className="flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Health Card
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm mb-2">
                          <div>Temp: {reading.temperature}°C</div>
                          <div>pH: {reading.ph_level}</div>
                          <div>Moisture: {reading.soil_moisture}%</div>
                          <div>Nitrogen: {reading.nitrogen}ppm</div>
                          <div>Phosphorus: {reading.phosphorus}ppm</div>
                          <div>Potassium: {reading.potassium}ppm</div>
                        </div>
                        {reading.notes && (
                          <div className="text-sm text-muted-foreground italic">
                            Notes: {reading.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No timestamped readings yet</p>
                  <p className="text-sm">Use the "Timestamp Reading" button to start collecting data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Temperature</CardTitle>
                <CardDescription>24-hour history (°C)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[15, 30]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>pH Level</CardTitle>
                <CardDescription>24-hour history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[5, 7.5]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="pH"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Soil Moisture</CardTitle>
                <CardDescription>24-hour history (%)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[20, 60]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="moisture"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nitrogen</CardTitle>
                <CardDescription>24-hour history (ppm)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="nitrogen"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phosphorus</CardTitle>
                <CardDescription>24-hour history (ppm)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 80]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="phosphorus"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Potassium</CardTitle>
                <CardDescription>24-hour history (ppm)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 120]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="potassium"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>




      </Tabs>

      {/* Timestamping Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Timestamp Current Readings
          </CardTitle>
          <CardDescription>
            Capture and store current sensor values with AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about current conditions, activities, or observations..."
                value={timestampNotes}
                onChange={(e) => setTimestampNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-4">
              <Button onClick={timestampReading} disabled={isLoading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? "Saving..." : "Timestamp Reading"}
              </Button>
              <Button variant="outline" onClick={loadSensorHistory} className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Refresh History
              </Button>
              <Button 
                variant="outline" 
                onClick={() => openHealthCardDialog(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Health Card
              </Button>
            </div>
            {sensorHistory.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Total readings stored: {sensorHistory.length} | Last reading: {sensorHistory[0]?.datetime}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ESP32 Connection Settings Dialog */}
      <Dialog open={showConnectionSettings} onOpenChange={setShowConnectionSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ESP32 Connection Settings</DialogTitle>
            <DialogDescription>
              Configure your ESP32 sensor connection. Make sure your ESP32 is on the same network as your laptop.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="esp32-ip">ESP32 IP Address</Label>
              <Input
                id="esp32-ip"
                value={esp32Settings.ip}
                onChange={(e) => setEsp32Settings(prev => ({ ...prev, ip: e.target.value }))}
                placeholder="192.168.1.100"
              />
              <p className="text-xs text-muted-foreground">
                Find your ESP32's IP address from your router's admin panel or serial monitor
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="esp32-port">ESP32 Port</Label>
              <Input
                id="esp32-port"
                value={esp32Settings.port}
                onChange={(e) => setEsp32Settings(prev => ({ ...prev, port: e.target.value }))}
                placeholder="80"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-800 mb-1">Setup Instructions:</p>
              <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                <li>Ensure ESP32 is connected to your WiFi network</li>
                <li>ESP32 should serve sensor data at: <code>http://[IP]:[PORT]/sensor-data</code></li>
                <li>Data should be in JSON format with fields: temperature, pH, moisture, etc.</li>
              </ol>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowConnectionSettings(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowConnectionSettings(false)
                  fetchRealSensorData() // Test connection with new settings
                }}
              >
                Save & Test Connection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Health Card Generation Dialog */}
      <Dialog open={showHealthCardDialog} onOpenChange={setShowHealthCardDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Soil Health Card</DialogTitle>
          <DialogDescription>
            Fill in the farmer details and select data source to generate a professional soil health card.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Data Source Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Data Source</Label>
            <Select 
              value={healthCardForm.dataSource} 
              onValueChange={(value) => setHealthCardForm(prev => ({ ...prev, dataSource: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Sensor Values</SelectItem>
                <SelectItem value="timestamped">Timestamped Historical Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Historical Data Selection */}
          {healthCardForm.dataSource === 'timestamped' && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Historical Reading</Label>
              <Select 
                value={healthCardForm.selectedReading ? sensorHistory.indexOf(healthCardForm.selectedReading).toString() : ''} 
                onValueChange={(value) => setHealthCardForm(prev => ({ 
                  ...prev, 
                  selectedReading: sensorHistory[parseInt(value)] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a timestamped reading" />
                </SelectTrigger>
                <SelectContent>
                  {sensorHistory.map((reading, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {`Timestamp: `}
                      {reading.datetime} 
                      {reading.notes && `, Notes: ${reading.notes},`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Farmer Details Form */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Farmer Details</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={healthCardForm.farmerDetails.name}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, name: e.target.value }
                  }))}
                  placeholder="Enter farmer name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={healthCardForm.farmerDetails.mobile}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, mobile: e.target.value }
                  }))}
                  placeholder="Enter mobile number"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={healthCardForm.farmerDetails.address}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, address: e.target.value }
                  }))}
                  placeholder="Enter complete address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="village">Village</Label>
                <Input
                  id="village"
                  value={healthCardForm.farmerDetails.village}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, village: e.target.value }
                  }))}
                  placeholder="Enter village name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subDistrict">Sub-District</Label>
                <Input
                  id="subDistrict"
                  value={healthCardForm.farmerDetails.subDistrict}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, subDistrict: e.target.value }
                  }))}
                  placeholder="Enter sub-district"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={healthCardForm.farmerDetails.district}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, district: e.target.value }
                  }))}
                  placeholder="Enter district"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pin">PIN Code</Label>
                <Input
                  id="pin"
                  value={healthCardForm.farmerDetails.pin}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, pin: e.target.value }
                  }))}
                  placeholder="Enter PIN code"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar Number</Label>
                <Input
                  id="aadhaar"
                  value={healthCardForm.farmerDetails.aadhaar}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, aadhaar: e.target.value }
                  }))}
                  placeholder="Enter Aadhaar number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="farmSize">Farm Size</Label>
                <Input
                  id="farmSize"
                  value={healthCardForm.farmerDetails.farmSize}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, farmSize: e.target.value }
                  }))}
                  placeholder="e.g., 2.5 acres"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="surveyNo">Survey Number</Label>
                <Input
                  id="surveyNo"
                  value={healthCardForm.farmerDetails.surveyNo}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, surveyNo: e.target.value }
                  }))}
                  placeholder="Enter survey number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="khasraNo">Khasra/Dag Number</Label>
                <Input
                  id="khasraNo"
                  value={healthCardForm.farmerDetails.khasraNo}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, khasraNo: e.target.value }
                  }))}
                  placeholder="Enter Khasra/Dag number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={healthCardForm.farmerDetails.latitude}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, latitude: e.target.value }
                  }))}
                  placeholder="Enter latitude"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={healthCardForm.farmerDetails.longitude}
                  onChange={(e) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, longitude: e.target.value }
                  }))}
                  placeholder="Enter longitude"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="irrigationType">Irrigation Type</Label>
                <Select 
                  value={healthCardForm.farmerDetails.irrigationType} 
                  onValueChange={(value) => setHealthCardForm(prev => ({
                    ...prev,
                    farmerDetails: { ...prev.farmerDetails, irrigationType: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Irrigated">Irrigated</SelectItem>
                    <SelectItem value="Rainfed">Rainfed</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowHealthCardDialog(false)}
              disabled={isGeneratingHealthCard}
            >
              Cancel
            </Button>
            <Button 
              onClick={generateHealthCard}
              disabled={isGeneratingHealthCard || !healthCardForm.farmerDetails.name || !healthCardForm.farmerDetails.address || !healthCardForm.farmerDetails.mobile}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isGeneratingHealthCard ? "Generating..." : "Generate Health Card"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  )
}

