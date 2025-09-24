"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Droplets, Thermometer, Leaf, CloudSun, Tractor, AlertTriangle, Sun, Wind, Clock, Save, History, Brain, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Mock data for sensors
const generateMockData = () => {
  const now = new Date()
  const data = []

  for (let i = 0; i < 24; i++) {
    const time = new Date(now)
    time.setHours(now.getHours() - 23 + i)

    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      moisture: Math.floor(Math.random() * 20) + 30, // 30-50%
      temperature: Math.floor(Math.random() * 10) + 18, // 18-28°C
      pH: (Math.random() * 2 + 5).toFixed(1), // 5.0-7.0
      co2: Math.floor(Math.random() * 200) + 400, // 400-600 ppm
      light: Math.floor(Math.random() * 500) + 500, // 500-1000 lux
      humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
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
    case "co2":
      return value > 550 ? "yellow" : "green"
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

export default function Dashboard() {
  const [data, setData] = useState(generateMockData())
  const [alerts, setAlerts] = useState<string[]>([])
  const [weatherCondition, setWeatherCondition] = useState("sunny")
  const [tractorPosition, setTractorPosition] = useState(0)
  const [activeSensor, setActiveSensor] = useState<string | null>(null)
  
  // Load balancer integration
  const [serverAddress, setServerAddress] = useState("192.168.1.100:50051")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Timestamping functionality
  const [timestampNotes, setTimestampNotes] = useState("")
  const [sensorHistory, setSensorHistory] = useState<any[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)

  // Current values (last data point)
  const currentValues = data[data.length - 1]

  // Load sensor history on component mount
  useEffect(() => {
    loadSensorHistory()
  }, [])

  // Update data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = [
        ...data.slice(1),
        {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          moisture: Math.floor(Math.random() * 20) + 30,
          temperature: Math.floor(Math.random() * 10) + 18,
          pH: (Math.random() * 2 + 5).toFixed(1),
          co2: Math.floor(Math.random() * 200) + 400,
          light: Math.floor(Math.random() * 500) + 500,
          humidity: Math.floor(Math.random() * 30) + 40,
        },
      ]

      setData(newData)

      // Check for alerts
      const latest = newData[newData.length - 1]
      if (latest.moisture < 35) {
        setAlerts((prev) => [...prev, `Low soil moisture detected: ${latest.moisture}%`])
      }
      if (latest.temperature > 25) {
        setAlerts((prev) => [...prev, `High temperature detected: ${latest.temperature}°C`])
      }

      // Limit alerts to last 5
      if (alerts.length > 5) {
        setAlerts(alerts.slice(-5))
      }

      // Update weather condition randomly
      if (Math.random() > 0.9) {
        const conditions = ["sunny", "cloudy", "rainy"]
        setWeatherCondition(conditions[Math.floor(Math.random() * conditions.length)])
      }

      // Move tractor
      setTractorPosition((prev) => (prev + 5) % 100)
    }, 5000)

    return () => clearInterval(interval)
  }, [data, alerts])

  // Load balancer connection test
  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/grpc/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_address: serverAddress })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsConnected(true)
        toast.success("Connected to AI Load Balancer!")
      } else {
        setIsConnected(false)
        toast.error(`Connection failed: ${data.error}`)
      }
    } catch (error) {
      setIsConnected(false)
      toast.error(`Connection error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

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
            co2: currentReading.co2,
            light: currentReading.light,
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
        
        // Send to AI load balancer for analysis if connected
        if (isConnected) {
          await analyzeWithAI(currentReading)
        }
      } else {
        toast.error(`Failed to timestamp reading: ${result.error}`)
      }
    } catch (error) {
      toast.error(`Error timestamping reading: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Analyze sensor data with AI
  const analyzeWithAI = async (sensorData: any) => {
    try {
      const response = await fetch('/api/grpc/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_address: serverAddress,
          sensor_data: {
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            soil_moisture: sensorData.moisture,
            ph_level: sensorData.pH,
            co2: sensorData.co2,
            light: sensorData.light,
            sensor_id: 'dashboard_sensor',
            location: 'Farm Dashboard'
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAiAnalysis(result.analysis)
        toast.success("AI analysis completed!")
        
        // Add AI recommendations to alerts
        if (result.recommendations && result.recommendations.length > 0) {
          setAlerts(prev => [...prev, ...result.recommendations.map((rec: string) => `AI Recommendation: ${rec}`)])
        }
      } else {
        toast.warning(`AI analysis failed: ${result.error}`)
      }
    } catch (error) {
      console.error('AI analysis error:', error)
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">{currentValues.temperature}°C</p>
                <p className="text-muted-foreground">Humidity: {currentValues.humidity}%</p>
              </div>
              <div className="text-4xl">
                {weatherCondition === "sunny" && <Sun className="h-12 w-12 text-yellow-500 animate-pulse-slow" />}
                {weatherCondition === "cloudy" && <CloudSun className="h-12 w-12 text-blue-300 animate-pulse-slow" />}
                {weatherCondition === "rainy" && <Droplets className="h-12 w-12 text-blue-500 animate-pulse-slow" />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Wind: {Math.floor(Math.random() * 10) + 5} km/h</p>
              <div className="flex items-center gap-2 mt-1">
                <Wind className="h-4 w-4" />
                <div className="bg-secondary/20 h-2 rounded-full w-full">
                  <div
                    className="bg-secondary h-2 rounded-full"
                    style={{ width: `${Math.floor(Math.random() * 50) + 10}%` }}
                  ></div>
                </div>
              </div>
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

      {/* Load Balancer Connection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            AI Load Balancer Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Raspberry Pi IP:Port"
              value={serverAddress}
              onChange={(e) => setServerAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={testConnection} disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardContent>
      </Card>

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
              {isConnected && (
                <Button variant="outline" onClick={() => analyzeWithAI(currentValues)} className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis
                </Button>
              )}
            </div>
            {sensorHistory.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Total readings stored: {sensorHistory.length} | Last reading: {sensorHistory[0]?.datetime}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Health Score</h4>
                <div className="flex items-center gap-2">
                  <Progress value={aiAnalysis.detailed_analysis?.health_score * 10 || 0} className="flex-1" />
                  <span className="text-sm font-medium">{(aiAnalysis.detailed_analysis?.health_score * 10 || 0).toFixed(1)}%</span>
                </div>
              </div>
              {aiAnalysis.detailed_analysis?.alerts && aiAnalysis.detailed_analysis.alerts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">AI Alerts</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.detailed_analysis.alerts.map((alert: string, index: number) => (
                      <li key={index} className="text-sm p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Sensor Data */}
      <Tabs defaultValue="knobs" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="knobs">Sensor Knobs</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="field">Field View</TabsTrigger>
        </TabsList>

        <TabsContent value="knobs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
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
                name: "Soil pH",
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
                name: "CO₂ Level",
                value: currentValues.co2,
                unit: "ppm",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8,8 A4,4 0 1,1 8,16 A4,4 0 1,1 8,8" />
                    <path d="M16,8 A4,4 0 1,1 16,16 A4,4 0 1,1 16,8" />
                    <path d="M12,4 L12,20" />
                  </svg>
                ),
                type: "co2",
                min: 300,
                max: 800,
                optimal: [400, 550],
                color: "purple"
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
                    {/* Knob Display */}
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      {/* Knob Background */}
                      <svg className="w-full h-full" viewBox="0 0 120 120">
                        {/* Background Arc */}
                        <path
                          d="M 20 60 A 40 40 0 1 1 100 60"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        {/* Optimal Range Arc */}
                        <path
                          d={`M ${20 + ((sensor.optimal[0] - sensor.min) / (sensor.max - sensor.min)) * 80} ${60 - Math.sin(Math.acos((((sensor.optimal[0] - sensor.min) / (sensor.max - sensor.min)) * 80 - 40) / 40)) * 40} A 40 40 0 0 1 ${20 + ((sensor.optimal[1] - sensor.min) / (sensor.max - sensor.min)) * 80} ${60 - Math.sin(Math.acos((((sensor.optimal[1] - sensor.min) / (sensor.max - sensor.min)) * 80 - 40) / 40)) * 40}`}
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="4"
                          strokeLinecap="round"
                          opacity="0.3"
                        />
                        {/* Value Arc */}
                        <path
                          d={`M 20 60 A 40 40 0 ${percentage > 50 ? 1 : 0} 1 ${20 + (percentage / 100) * 80} ${60 - Math.sin(Math.acos(((percentage / 100) * 80 - 40) / 40)) * 40}`}
                          fill="none"
                          stroke={
                            statusColor === "green" ? "hsl(var(--primary))" :
                            statusColor === "yellow" ? "hsl(var(--accent))" :
                            statusColor === "destructive" ? "hsl(var(--destructive))" :
                            "hsl(var(--secondary))"
                          }
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Needle */}
                        <line
                          x1="60"
                          y1="60"
                          x2={60 + Math.cos((angle * Math.PI) / 180) * 35}
                          y2={60 + Math.sin((angle * Math.PI) / 180) * 35}
                          stroke="hsl(var(--foreground))"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        {/* Center Dot */}
                        <circle cx="60" cy="60" r="4" fill="hsl(var(--foreground))" />
                      </svg>
                      
                      {/* Value Display */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center mt-8">
                          <div className="text-2xl font-bold">{sensor.value}</div>
                          <div className="text-sm text-muted-foreground">{sensor.unit}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{sensor.min}</span>
                        <span>{sensor.max}</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
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
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                Timestamped Sensor History
              </CardTitle>
              <CardDescription>
                View historical sensor readings with timestamps and notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sensorHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sensorHistory.map((reading, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{reading.datetime}</div>
                          <Badge variant="outline">{reading.location}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm mb-2">
                          <div>Temp: {reading.temperature}°C</div>
                          <div>Humidity: {reading.humidity}%</div>
                          <div>Moisture: {reading.soil_moisture}%</div>
                          <div>pH: {reading.ph_level}</div>
                          <div>CO₂: {reading.co2}ppm</div>
                          <div>Light: {reading.light}lux</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <CardTitle>Soil pH</CardTitle>
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
                <CardTitle>CO₂ Levels</CardTitle>
                <CardDescription>24-hour history (ppm)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[350, 650]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="co2"
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
          </div>
        </TabsContent>

        <TabsContent value="gauges">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Soil Moisture",
                value: currentValues.moisture,
                unit: "%",
                icon: <Droplets className="h-6 w-6" />,
                type: "moisture",
                min: 0,
                max: 100,
                optimal: [35, 45],
              },
              {
                name: "Temperature",
                value: currentValues.temperature,
                unit: "°C",
                icon: <Thermometer className="h-6 w-6" />,
                type: "temperature",
                min: 0,
                max: 40,
                optimal: [20, 25],
              },
              {
                name: "Soil pH",
                value: Number.parseFloat(currentValues.pH),
                unit: "",
                icon: <Leaf className="h-6 w-6" />,
                type: "pH",
                min: 0,
                max: 14,
                optimal: [6.0, 6.8],
              },
              {
                name: "CO₂ Level",
                value: currentValues.co2,
                unit: "ppm",
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8,8 A4,4 0 1,1 8,16 A4,4 0 1,1 8,8" />
                    <path d="M16,8 A4,4 0 1,1 16,16 A4,4 0 1,1 16,8" />
                    <path d="M12,4 L12,20" />
                  </svg>
                ),
                type: "co2",
                min: 300,
                max: 800,
                optimal: [400, 550],
              },
            ].map((sensor) => {
              const statusColor = getStatusColor(sensor.value, sensor.type)
              const percentage = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100

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
                    <div className="text-center mb-4">
                      <span className="text-4xl font-bold">{sensor.value}</span>
                      <span className="text-xl">{sensor.unit}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-${statusColor}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, percentage))}%`,
                            backgroundColor:
                              statusColor === "green"
                                ? "hsl(var(--primary))"
                                : statusColor === "yellow"
                                  ? "hsl(var(--accent))"
                                  : statusColor === "destructive"
                                    ? "hsl(var(--destructive))"
                                    : statusColor === "blue"
                                      ? "hsl(var(--secondary))"
                                      : "",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{sensor.min}</span>
                        <span>{sensor.max}</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        Optimal range: {sensor.optimal[0]} - {sensor.optimal[1]} {sensor.unit}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="field">
          <Card>
            <CardHeader>
              <CardTitle>Field View</CardTitle>
              <CardDescription>Visual representation of your farm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-[500px] bg-gradient-to-b from-blue-50 to-green-100 rounded-lg overflow-hidden border border-border">
                {/* Sky */}
                <div className="absolute inset-0 h-1/3 bg-gradient-to-b from-blue-300 to-blue-100">
                  {/* Sun */}
                  <div className="absolute top-10 right-20">
                    <Sun className="h-16 w-16 text-yellow-400 animate-pulse-slow" />
                  </div>

                  {/* Clouds */}
                  <motion.div
                    className="absolute top-16 left-10"
                    animate={{ x: [0, 100, 0] }}
                    transition={{ duration: 60, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <svg className="h-12 w-24 text-white" viewBox="0 0 100 50" fill="currentColor">
                      <path d="M10,30 Q25,10 40,30 T70,30 Q85,10 100,30 T130,30 Q145,10 160,30 V50 H10 Z" />
                    </svg>
                  </motion.div>
                </div>

                {/* Field */}
                <div className="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-b from-green-300 to-green-500">
                  {/* Crops */}
                  <div className="absolute inset-0 flex items-end">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="flex-1 flex justify-center">
                        <div
                          className="w-4 bg-green-700"
                          style={{
                            height: `${Math.random() * 30 + 50}px`,
                            marginBottom: "0px",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Tractor */}
                  <motion.div className="absolute bottom-10" style={{ left: `${tractorPosition}%` }}>
                    <Tractor className="h-16 w-16 text-accent" />
                  </motion.div>

                  {/* Sensor Nodes */}
                  {[
                    { x: 20, y: 70, type: "moisture" },
                    { x: 50, y: 60, type: "temperature" },
                    { x: 80, y: 65, type: "pH" },
                  ].map((sensor, i) => (
                    <div
                      key={i}
                      className="absolute w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{ left: `${sensor.x}%`, top: `${sensor.y}%` }}
                      onClick={() => setActiveSensor(activeSensor === sensor.type ? null : sensor.type)}
                    >
                      {sensor.type === "moisture" && <Droplets className="h-4 w-4 text-blue-500" />}
                      {sensor.type === "temperature" && <Thermometer className="h-4 w-4 text-red-500" />}
                      {sensor.type === "pH" && <Leaf className="h-4 w-4 text-green-500" />}

                      {/* Popup */}
                      {activeSensor === sensor.type && (
                        <div className="absolute bottom-full mb-2 w-48 bg-white p-3 rounded-lg shadow-lg z-10">
                          <div className="font-medium mb-1">
                            {sensor.type === "moisture" && "Soil Moisture"}
                            {sensor.type === "temperature" && "Temperature"}
                            {sensor.type === "pH" && "Soil pH"}
                          </div>
                          <div className="text-sm mb-2">
                            {sensor.type === "moisture" && `${currentValues.moisture}%`}
                            {sensor.type === "temperature" && `${currentValues.temperature}°C`}
                            {sensor.type === "pH" && currentValues.pH}
                          </div>
                          <Progress
                            value={
                              sensor.type === "moisture"
                                ? (currentValues.moisture - 30) * 5
                                : sensor.type === "temperature"
                                  ? (currentValues.temperature - 18) * 10
                                  : (Number.parseFloat(currentValues.pH) - 5) * 50
                            }
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-4">
                <Button variant="outline" size="sm">
                  Zoom In
                </Button>
                <Button variant="outline" size="sm">
                  Zoom Out
                </Button>
                <Button variant="outline" size="sm">
                  Reset View
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

