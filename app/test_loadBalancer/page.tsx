"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Activity, 
  Brain, 
  Camera, 
  Cpu, 
  Database, 
  Eye, 
  HardDrive, 
  Loader2, 
  Monitor, 
  Network, 
  Play, 
  RefreshCw, 
  Server, 
  Settings, 
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react"
import { toast } from "sonner"

interface SystemSpecs {
  cpu_cores: number
  cpu_frequency_ghz: number
  ram_gb: number
  gpu_info: string
  gpu_memory_gb: number
  os_info: string
  performance_score: number
}

interface ClientInfo {
  client_id: string
  hostname: string
  ip_address: string
  performance_score: number
  deployed_models: string[]
  current_tasks: number
  last_seen: number
  status: "online" | "offline"
  specs: SystemSpecs
}

interface ModelInfo {
  model_name: string
  model_type: string
  status: string
  endpoint_url: string
  client_id: string
  performance_score: number
}

interface AIRequest {
  model_name: string
  prompt: string
  parameters: Record<string, string>
  input_type: string
}

interface AIResponse {
  request_id: string
  success: boolean
  response_text: string
  processing_time: number
  model_used: string
  client_id: string
}

interface SystemStatus {
  timestamp: string
  total_clients: number
  active_clients: number
  total_models_deployed: number
  active_tasks: number
  completed_tasks: number
  available_models: string[]
  clients: ClientInfo[]
}

export default function LoadBalancerTestPage() {
  const [serverAddress, setServerAddress] = useState("192.168.1.100:50051")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [testResults, setTestResults] = useState<any[]>([])
  
  // AI Test Form State
  const [selectedModel, setSelectedModel] = useState("")
  const [testPrompt, setTestPrompt] = useState("")
  const [testParameters, setTestParameters] = useState({
    temperature: "0.7",
    max_tokens: "200"
  })
  
  // Sensor Test State
  const [sensorData, setSensorData] = useState({
    temperature: "25.5",
    humidity: "65.0",
    soil_moisture: "35.2",
    ph_level: "6.8"
  })

  // Connection Test
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
        await refreshSystemStatus()
      } else {
        setIsConnected(false)
        const errorMsg = data.error || "Unknown connection error"
        toast.error(`Connection failed: ${errorMsg}`)
        
        // Show helpful error messages
        if (errorMsg.includes("Failed to import gRPC modules")) {
          toast.error("Please run setup_ai_environment.py first to generate gRPC files")
        } else if (errorMsg.includes("Connection refused")) {
          toast.error("Make sure the load balancer server is running on the Raspberry Pi")
        }
      }
    } catch (error) {
      setIsConnected(false)
      toast.error(`Connection error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh System Status
  const refreshSystemStatus = async () => {
    if (!isConnected) return
    
    try {
      const response = await fetch('/api/grpc/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_address: serverAddress })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSystemStatus(data.status)
        setAvailableModels(data.models || [])
      }
    } catch (error) {
      toast.error(`Failed to refresh status: ${error}`)
    }
  }

  // Test AI Model
  const testAIModel = async () => {
    if (!selectedModel || !testPrompt) {
      toast.error("Please select a model and enter a prompt")
      return
    }

    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/grpc/ai-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_address: serverAddress,
          model_name: selectedModel,
          prompt: testPrompt,
          parameters: testParameters,
          input_type: "text"
        })
      })
      
      const data = await response.json()
      const endTime = Date.now()
      
      const result = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: "AI Model Test",
        model: selectedModel,
        prompt: testPrompt.substring(0, 50) + "...",
        success: data.success,
        response: data.response_text || data.error,
        processing_time: data.processing_time || (endTime - startTime) / 1000,
        client_id: data.client_id || "unknown"
      }
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 results
      
      if (data.success) {
        toast.success(`AI test completed in ${result.processing_time.toFixed(2)}s`)
      } else {
        toast.error(`AI test failed: ${data.error}`)
      }
    } catch (error) {
      toast.error(`AI test error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Test Sensor Data Processing
  const testSensorProcessing = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/grpc/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_address: serverAddress,
          sensor_data: sensorData
        })
      })
      
      const data = await response.json()
      const endTime = Date.now()
      
      const result = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: "Sensor Data Test",
        model: "dhenu2-agricultural-analysis",
        prompt: `Temp: ${sensorData.temperature}°C, Humidity: ${sensorData.humidity}%`,
        success: data.success,
        response: JSON.stringify(data.analysis) || data.error,
        processing_time: (endTime - startTime) / 1000,
        client_id: "sensor-processor"
      }
      
      setTestResults(prev => [result, ...prev.slice(0, 9)])
      
      if (data.success) {
        toast.success(`Sensor analysis completed in ${result.processing_time.toFixed(2)}s`)
      } else {
        toast.error(`Sensor analysis failed: ${data.error}`)
      }
    } catch (error) {
      toast.error(`Sensor test error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh system status
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(refreshSystemStatus, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [isConnected])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "running":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "offline":
      case "stopped":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getResultIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Load Balancer Test Console</h1>
          <p className="text-muted-foreground">
            Test and monitor your distributed AI load balancer system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Badge variant="default" className="bg-green-500">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="h-5 w-5 mr-2" />
            Connection Setup
          </CardTitle>
          <CardDescription>
            Configure connection to your AI Load Balancer server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="server-address">Server Address</Label>
              <Input
                id="server-address"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                placeholder="192.168.1.100:50051"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={testConnection} 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {isConnected ? "Reconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus?.total_clients || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus?.active_clients || 0} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deployed Models</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus?.total_models_deployed || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {availableModels.filter(m => m.status === "running").length} running
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus?.active_tasks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus?.completed_tasks || 0} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">Healthy</div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  System Status
                  <Button variant="outline" size="sm" onClick={refreshSystemStatus}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemStatus ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Last Updated:</span>
                      <span>{new Date(systemStatus.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available Models:</span>
                      <span>{systemStatus.available_models.join(", ")}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading system status...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connected Clients</CardTitle>
                <CardDescription>
                  View all clients connected to the load balancer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {systemStatus?.clients.map((client) => (
                      <Card key={client.client_id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(client.status)}
                              <span className="font-medium">{client.hostname}</span>
                              <Badge variant="outline">{client.client_id.substring(0, 8)}</Badge>
                            </div>
                            <Badge variant="secondary">
                              Score: {client.performance_score.toFixed(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">IP:</span>
                              <p>{client.ip_address}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">CPU:</span>
                              <p>{client.specs.cpu_cores} cores @ {client.specs.cpu_frequency_ghz}GHz</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">RAM:</span>
                              <p>{client.specs.ram_gb} GB</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">GPU:</span>
                              <p>{client.specs.gpu_memory_gb}GB</p>
                            </div>
                          </div>
                          
                          {client.deployed_models.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-muted-foreground">Deployed Models:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {client.deployed_models.map((model) => (
                                  <Badge key={model} variant="outline" className="text-xs">
                                    {model}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )) || (
                      <p className="text-muted-foreground text-center py-8">
                        No clients connected
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available AI Models</CardTitle>
                <CardDescription>
                  View and manage deployed AI models across the network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableModels.map((model) => (
                    <Card key={model.model_name}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(model.status)}
                            <span className="font-medium">{model.model_name}</span>
                          </div>
                          <Badge variant="outline">{model.model_type}</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={model.status === "running" ? "text-green-500" : "text-red-500"}>
                              {model.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Client:</span>
                            <span>{model.client_id || "Not deployed"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Performance:</span>
                            <span>{model.performance_score.toFixed(1)}</span>
                          </div>
                          {model.endpoint_url && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Endpoint:</span>
                              <span className="text-xs font-mono">{model.endpoint_url}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <p className="text-muted-foreground text-center py-8 col-span-2">
                      No models available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Model Testing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI Model Testing
                  </CardTitle>
                  <CardDescription>
                    Test AI model inference across the network
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="model-select">Select Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels
                          .filter(m => m.status === "running")
                          .map((model) => (
                            <SelectItem key={model.model_name} value={model.model_name}>
                              {model.model_name} ({model.model_type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="test-prompt">Test Prompt</Label>
                    <Textarea
                      id="test-prompt"
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder="Enter your test prompt here..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        value={testParameters.temperature}
                        onChange={(e) => setTestParameters(prev => ({
                          ...prev,
                          temperature: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-tokens">Max Tokens</Label>
                      <Input
                        id="max-tokens"
                        value={testParameters.max_tokens}
                        onChange={(e) => setTestParameters(prev => ({
                          ...prev,
                          max_tokens: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={testAIModel} 
                    disabled={isLoading || !selectedModel || !testPrompt}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run AI Test
                  </Button>
                </CardContent>
              </Card>

              {/* Sensor Data Testing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Sensor Data Testing
                  </CardTitle>
                  <CardDescription>
                    Test agricultural sensor data processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        value={sensorData.temperature}
                        onChange={(e) => setSensorData(prev => ({
                          ...prev,
                          temperature: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="humidity">Humidity (%)</Label>
                      <Input
                        id="humidity"
                        value={sensorData.humidity}
                        onChange={(e) => setSensorData(prev => ({
                          ...prev,
                          humidity: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="soil-moisture">Soil Moisture (%)</Label>
                      <Input
                        id="soil-moisture"
                        value={sensorData.soil_moisture}
                        onChange={(e) => setSensorData(prev => ({
                          ...prev,
                          soil_moisture: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ph-level">pH Level</Label>
                      <Input
                        id="ph-level"
                        value={sensorData.ph_level}
                        onChange={(e) => setSensorData(prev => ({
                          ...prev,
                          ph_level: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={testSensorProcessing} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Process Sensor Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Test Results
                </CardTitle>
                <CardDescription>
                  View recent test results and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {testResults.map((result) => (
                      <Card key={result.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getResultIcon(result.success)}
                              <span className="font-medium">{result.type}</span>
                              <Badge variant="outline">{result.model}</Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Prompt:</span>
                              <p className="mt-1">{result.prompt}</p>
                            </div>
                            
                            <div className="text-sm">
                              <span className="text-muted-foreground">Response:</span>
                              <p className="mt-1 p-2 bg-muted rounded text-xs">
                                {result.response}
                              </p>
                            </div>
                            
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Processing Time: {result.processing_time.toFixed(2)}s</span>
                              <span>Client: {result.client_id}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )) || (
                      <p className="text-muted-foreground text-center py-8">
                        No test results yet. Run some tests to see results here.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!isConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Not Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect to your AI Load Balancer server to start testing
              </p>
              <Button onClick={testConnection} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Connect Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}