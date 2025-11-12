"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Brain, 
  Loader2, 
  Network, 
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Users,
  Cpu
} from "lucide-react"
import { toast } from "sonner"
import { SmartLoadBalancerClient, type ClientInfo } from "@/lib/smart-loadbalancer-client"

export default function SmartLoadBalancerPage() {
  const [serverAddress, setServerAddress] = useState("localhost:5001")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [totalClients, setTotalClients] = useState(0)
  const [activeClients, setActiveClients] = useState(0)

  const client = new SmartLoadBalancerClient({ serverAddress })

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const result = await client.testConnection()
      
      if (result.success) {
        setIsConnected(true)
        toast.success("Connected to Smart Load Balancer!")
        await refreshStatus()
      } else {
        setIsConnected(false)
        toast.error(`Connection failed: ${result.error}`)
      }
    } catch (error) {
      setIsConnected(false)
      toast.error(`Connection error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStatus = async () => {
    try {
      const result = await client.getStatus()
      
      if (result.success && result.status) {
        setClients(result.status.clients)
        setAvailableModels(result.status.available_models)
        setTotalClients(result.status.total_clients)
        setActiveClients(result.status.active_clients)
      }
    } catch (error) {
      console.error("Failed to refresh status:", error)
    }
  }

  const sendQuery = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setIsLoading(true)
    setResponse("")
    
    try {
      const result = await client.query(prompt)
      
      if (result.success && result.response) {
        setResponse(result.response)
        toast.success("Query processed successfully!")
        
        if (result.metadata) {
          console.log("Processing metadata:", result.metadata)
        }
      } else {
        toast.error(`Query failed: ${result.error}`)
        setResponse(`Error: ${result.error}`)
      }
    } catch (error) {
      toast.error(`Query error: ${error}`)
      setResponse(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(refreshStatus, 10000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart AI Load Balancer</h1>
          <p className="text-muted-foreground">
            Distributed fog computing with intelligent model assignment
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
            Connect to your Smart Load Balancer server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="server-address">Server Address (HTTP Wrapper)</Label>
              <Input
                id="server-address"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                placeholder="localhost:5001"
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
                  <Network className="h-4 w-4 mr-2" />
                )}
                {isConnected ? "Reconnect" : "Connect"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <>
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  {activeClients} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableModels.length}</div>
                <p className="text-xs text-muted-foreground">
                  AI models ready
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">Healthy</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshStatus}
                  className="mt-1 h-6 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Query Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Query Interface
              </CardTitle>
              <CardDescription>
                Send queries to be processed across all connected clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Your Prompt</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your question or prompt here..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={sendQuery} 
                disabled={isLoading || !prompt.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Process Query
              </Button>

              {response && (
                <div className="mt-4">
                  <Label>Response</Label>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4 mt-2">
                    <pre className="whitespace-pre-wrap text-sm">{response}</pre>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Clients</CardTitle>
              <CardDescription>
                View all clients and their assigned models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <Card key={client.client_id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium">{client.hostname}</span>
                              <Badge variant="outline">{client.client_id.substring(0, 8)}</Badge>
                            </div>
                            <Badge variant="secondary">
                              Score: {client.specs.performance_score.toFixed(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">IP:</span>
                              <p>{client.ip_address}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">CPU:</span>
                              <p>{client.specs.cpu_cores} cores</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">RAM:</span>
                              <p>{client.specs.ram_gb} GB</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Model:</span>
                              <p className="font-mono text-xs">{client.assigned_model}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No clients connected yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {!isConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Not Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect to your Smart Load Balancer server to start
              </p>
              <Button onClick={testConnection} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Network className="h-4 w-4 mr-2" />
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
