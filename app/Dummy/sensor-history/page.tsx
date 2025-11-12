"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import { History, Download, Trash2, Calendar, TrendingUp, TrendingDown, AlertCircle, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface SensorReading {
  timestamp: string;
  datetime: string;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  co2: number;
  light: number;
  location?: string;
  notes?: string;
}

export default function SensorHistoryPage() {
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>([])
  const [filteredHistory, setFilteredHistory] = useState<SensorReading[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [parameterFilter, setParameterFilter] = useState("all")

  useEffect(() => {
    loadSensorHistory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [sensorHistory, dateFilter, locationFilter, parameterFilter])

  const loadSensorHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sensor-history')
      const data = await response.json()
      
      if (data.success) {
        setSensorHistory(data.history)
        toast.success(`Loaded ${data.history.length} sensor readings`)
      } else {
        toast.error("Failed to load sensor history")
      }
    } catch (error) {
      toast.error(`Error loading history: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...sensorHistory]

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString()
      filtered = filtered.filter(reading => 
        new Date(reading.datetime).toDateString() === filterDate
      )
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(reading => 
        reading.location === locationFilter
      )
    }

    setFilteredHistory(filtered)
  }

  const clearHistory = async () => {
    if (!confirm("Are you sure you want to clear all sensor history? This cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/sensor-history', { method: 'DELETE' })
      const data = await response.json()
      
      if (data.success) {
        setSensorHistory([])
        toast.success("Sensor history cleared")
      } else {
        toast.error("Failed to clear history")
      }
    } catch (error) {
      toast.error(`Error clearing history: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    const csvContent = [
      "Timestamp,Temperature,Humidity,Soil Moisture,CO2,Light,Location,Notes",
      ...filteredHistory.map(reading => 
        `${reading.datetime},${reading.temperature},${reading.humidity},${reading.soil_moisture},${reading.co2},${reading.light},"${reading.location || ''}","${reading.notes || ''}"`
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sensor-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Data exported successfully")
  }

  const getUniqueLocations = () => {
    const locations = [...new Set(sensorHistory.map(r => r.location).filter(Boolean))]
    return locations
  }

  const calculateTrends = () => {
    if (filteredHistory.length < 2) return null

    const recent = filteredHistory.slice(0, 5)
    const older = filteredHistory.slice(5, 10)

    if (older.length === 0) return null

    const recentAvg = {
      temperature: recent.reduce((sum, r) => sum + r.temperature, 0) / recent.length,
      humidity: recent.reduce((sum, r) => sum + r.humidity, 0) / recent.length,
      soil_moisture: recent.reduce((sum, r) => sum + r.soil_moisture, 0) / recent.length,
    }

    const olderAvg = {
      temperature: older.reduce((sum, r) => sum + r.temperature, 0) / older.length,
      humidity: older.reduce((sum, r) => sum + r.humidity, 0) / older.length,
      soil_moisture: older.reduce((sum, r) => sum + r.soil_moisture, 0) / older.length,
    }

    return {
      temperature: recentAvg.temperature - olderAvg.temperature,
      humidity: recentAvg.humidity - olderAvg.humidity,
      soil_moisture: recentAvg.soil_moisture - olderAvg.soil_moisture,
    }
  }

  const trends = calculateTrends()

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-2">Sensor History & Analytics</h1>
        <p className="text-muted-foreground mb-8">Analyze timestamped sensor data and trends over time</p>
      </motion.div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="date-filter">Filter by Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location-filter">Filter by Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {getUniqueLocations().map(location => (
                    <SelectItem key={location} value={location || ""}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadSensorHistory} disabled={isLoading} className="mr-2">
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={exportData} disabled={filteredHistory.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="destructive" onClick={clearHistory} disabled={isLoading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredHistory.length} of {sensorHistory.length} total readings
          </div>
        </CardContent>
      </Card>

      {/* Trends Summary */}
      {trends && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Recent Trends (Last 5 vs Previous 5 readings)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(trends).map(([param, change]) => (
                <div key={param} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : change < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {param.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={`text-lg font-bold ${
                    change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {change > 0 ? '+' : ''}{change.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Temperature & Humidity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredHistory.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="datetime" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" />
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Soil Conditions Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredHistory.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="datetime" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="soil_moisture" stroke="#22c55e" strokeWidth={2} name="Soil Moisture (%)" />
                    <Line type="monotone" dataKey="humidity" stroke="#a855f7" strokeWidth={2} name="Humidity (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environmental Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredHistory.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="datetime" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="co2" stroke="#f59e0b" strokeWidth={2} name="CO₂ (ppm)" />
                    <Line type="monotone" dataKey="light" stroke="#06b6d4" strokeWidth={2} name="Light (lux)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reading Frequency by Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    Object.entries(
                      filteredHistory.reduce((acc, reading) => {
                        const date = new Date(reading.datetime).toDateString()
                        acc[date] = (acc[date] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([date, count]) => ({ date, count }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="text-center py-12">
            <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No sensor data available</h3>
            <p className="text-muted-foreground mb-4">
              {dateFilter || locationFilter !== "all" 
                ? "No data matches your current filters" 
                : "Start timestamping sensor readings from the dashboard to see historical data here"
              }
            </p>
            <Button onClick={() => setDateFilter("")} variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detailed History Table */}
      {filteredHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Detailed Reading History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredHistory.map((reading, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {reading.datetime}
                      </div>
                      {reading.location && (
                        <Badge variant="outline" className="mt-1">{reading.location}</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm mb-3">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Temperature</span>
                      <span className="font-medium">{reading.temperature}°C</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Humidity</span>
                      <span className="font-medium">{reading.humidity}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Soil Moisture</span>
                      <span className="font-medium">{reading.soil_moisture}%</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-muted-foreground">CO₂</span>
                      <span className="font-medium">{reading.co2}ppm</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Light</span>
                      <span className="font-medium">{reading.light}lux</span>
                    </div>
                  </div>
                  
                  {reading.notes && (
                    <div className="text-sm p-2 bg-muted rounded border-l-4 border-primary">
                      <span className="text-muted-foreground">Notes: </span>
                      <span className="italic">{reading.notes}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}