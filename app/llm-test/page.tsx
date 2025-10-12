"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Brain, Cpu, Zap, Users, Clock, CheckCircle, AlertCircle, Loader2, Send, RefreshCw } from "lucide-react"

interface LLMAssignment {
  client_id: string
  model_name: string
  model_size: string
  status: string
  endpoint?: string
}

interface LLMTask {
  task_id: string
  model_name: string
  prompt: string
  status: string
  result?: string
  created_at: number
  client_id?: string
}

export default function LLMTestPage() {
  const [serverAddress, setServerAddress] = useState("192.168.1.8:50051")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // LLM Assignments
  const [assignments, setAssignments] = useState<Record<string, LLMAssignment>>({})
  const [modelInfo, setModelInfo] = useState<Record<string, any>>({})
  
  // Task Management
  const [tasks, setTasks] = useState<LLMTask[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [prompt, setPrompt] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Test connection and load assignments
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
        await loadAssignments()
      } else {
        setIsConnected(false)
        toast.error(`Connection failed: ${data.error}`)
      }
    } catch (error: any) {
      setIsConnected(false)
      toast.error(`Connection error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Load LLM model assignments
  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/llm/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          server_address: serverAddress,
          action: 'get_assignments'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Transform assignments data
        const assignmentMap: Record<string, LLMAssignment> = {}
        
        Object.entries(data.assignments || {}).forEach(([clientId, modelName]: [string, any]) => {
          const modelData = data.model_info?.[modelName] || {}
          assignmentMap[clientId] = {
            client_id: clientId,
            model_name: modelName,
            model_size: modelData.size || 'Unknown',
            status: modelData.status || 'unknown',
            endpoint: modelData.endpoint
          }
        })
        
        setAssignments(assignmentMap)
        setModelInfo(data.model_info || {})
        
        // Set default selected model
        if (Object.keys(assignmentMap).length > 0 && !selectedModel) {
          setSelectedModel(Object.values(assignmentMap)[0].model_name)
        }
        
        console.log('📊 LLM Assignments loaded:', assignmentMap)
      } else {
        toast.error(`Failed to load assignments: ${data.error}`)
      }
    } catch (error: any) {
      toast.error(`Assignment loading error: ${error.message}`)
    }
  }

  // Submit LLM task
  const submitTask = async () => {
    if (!selectedModel || !prompt.trim()) {
      toast.error("Please select a model and enter a prompt")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/llm/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_address: serverAddress,
          action: 'create_task',
          model_name: selectedModel,
          prompt: prompt.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const newTask: LLMTask = {
          task_id: data.task_id,
          model_name: selectedModel,
          prompt: prompt.trim(),
          status: 'submitted',
          created_at: Date.now(),
          client_id: data.assigned_client
        }
        
        setTasks(prev => [newTask, ...prev])
        setPrompt("")
        
        toast.success(`Task submitted to ${selectedModel}`)
        
        // Start polling for result
        pollTaskStatus(data.task_id)
        
      } else {
        toast.error(`Task submission failed: ${data.error}`)
      }
    } catch (error: any) {
      toast.error(`Submission error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Poll task status
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 20
    let attempts = 0
    
    const poll = async () => {
      try {
        const response = await fetch('/api/llm/task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server_address: serverAddress,
            action: 'get_status',
            task_id: taskId
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setTasks(prev => prev.map(task => 
            task.task_id === taskId 
              ? { ...task, status: data.status, result: data.result }
              : task
          ))
          
          if (data.status === 'completed' || data.status === 'failed') {
            return // Stop polling
          }
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000) // Poll every 3 seconds
        }
        
      } catch (error) {
        console.error('Polling error:', error)
      }
    }
    
    poll()
  }

  // Sample prompts for different models
  const getSamplePrompts = (modelSize: string) => {
    const prompts = {
      '1B': [
        "What are the best practices for rice cultivation?",
        "How to prevent pest attacks in wheat crops?",
        "What is the ideal soil pH for tomato farming?"
      ],
      '3B': [
        "Provide a detailed crop rotation plan for a 10-acre farm with wheat and rice.",
        "What are the integrated pest management strategies for cotton farming?",
        "Explain the nutritional requirements for dairy cattle in different seasons."
      ],
      '8B': [
        "Analyze the impact of climate change on wheat production in North India and suggest adaptation strategies.",
        "Develop a comprehensive business plan for setting up a 50-acre organic farm.",
        "Compare different irrigation technologies for water-scarce regions and their economic viability."
      ]
    }
    return prompts[modelSize as keyof typeof prompts] || prompts['1B']
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🌾 LLM Distributed Testing</h1>
          <p className="text-muted-foreground">Test distributed LLM models across multiple clients</p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      {/* Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Server Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="server">Load Balancer Address</Label>
              <Input
                id="server"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                placeholder="192.168.1.8:50051"
              />
            </div>
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isConnected ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Connecting..." : isConnected ? "Connected" : "Connect"}
            </Button>
            {isConnected && (
              <Button 
                onClick={loadAssignments} 
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Model Assignments */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              LLM Model Assignments
            </CardTitle>
            <CardDescription>
              Current distribution of LLM models across clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(assignments).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No LLM models assigned yet</p>
                <p className="text-sm">Connect clients to see model assignments</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.values(assignments).map((assignment) => (
                  <Card key={assignment.client_id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {assignment.model_size} Model
                        </Badge>
                        <Badge variant={assignment.status === 'running' ? 'default' : 'secondary'}>
                          {assignment.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">
                        {assignment.model_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        Client: {assignment.client_id.slice(-8)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedModel(assignment.model_name)}
                      >
                        Select for Testing
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Submission */}
      {isConnected && Object.keys(assignments).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Submit LLM Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="model">Selected Model</Label>
              <select
                id="model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a model...</option>
                {Object.values(assignments).map((assignment) => (
                  <option key={assignment.model_name} value={assignment.model_name}>
                    {assignment.model_name} ({assignment.model_size}) - {assignment.client_id.slice(-8)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your agricultural question or prompt..."
                rows={4}
              />
            </div>

            {selectedModel && (
              <div>
                <Label>Sample Prompts</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getSamplePrompts(modelInfo[selectedModel]?.size || '1B').map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(sample)}
                      className="text-xs"
                    >
                      {sample.slice(0, 30)}...
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={submitTask}
              disabled={isSubmitting || !selectedModel || !prompt.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Submitting Task..." : "Submit Task"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Task Results */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Task Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.task_id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {task.model_name}
                        </Badge>
                        <Badge variant={
                          task.status === 'completed' ? 'default' :
                          task.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1">Prompt:</p>
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {task.prompt}
                      </p>
                    </div>

                    {task.result && (
                      <div>
                        <p className="text-sm font-medium mb-1">Response:</p>
                        <div className="text-sm bg-green-50 border border-green-200 p-3 rounded">
                          {task.result}
                        </div>
                      </div>
                    )}

                    {task.status === 'submitted' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing on {task.client_id}...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}