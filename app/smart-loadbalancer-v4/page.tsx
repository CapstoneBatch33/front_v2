"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  Loader2, 
  Network, 
  Send,
  RefreshCw,
  CheckCircle,
  Wifi,
  WifiOff,
  Users,
  MessageSquare,
  Database,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  FileText
} from "lucide-react"
import { toast } from "sonner"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: number
  images?: string[]
}

interface ChatSession {
  session_id: string
  title: string
  created_at: number
  updated_at: number
  message_count: number
}

interface RAGDocument {
  doc_id: string
  title: string
  content: string
  created_at: number
}

export default function SmartLoadBalancerV4Page() {
  const [serverAddress, setServerAddress] = useState("localhost:5001")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [totalClients, setTotalClients] = useState(0)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  
  // RAG state
  const [useRAG, setUseRAG] = useState(false)
  const [ragDocuments, setRagDocuments] = useState<RAGDocument[]>([])
  const [newDocTitle, setNewDocTitle] = useState("")
  const [newDocContent, setNewDocContent] = useState("")
  
  // Chat history state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://${serverAddress}/health`)
      const data = await response.json()
      
      if (data.healthy) {
        setIsConnected(true)
        toast.success("Connected to Smart Load Balancer v4!")
        await refreshStatus()
        await loadChatSessions()
      } else {
        setIsConnected(false)
        toast.error("Server not healthy")
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
      const response = await fetch(`http://${serverAddress}/status`)
      const data = await response.json()
      
      if (data.total_clients !== undefined) {
        setTotalClients(data.total_clients)
        setAvailableModels(data.available_models || [])
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
    
    const userMessage: Message = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined
    }
    
    setMessages(prev => [...prev, userMessage])
    
    try {
      const response = await fetch(`http://${serverAddress}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          session_id: currentSessionId,
          use_rag: useRAG,
          images: uploadedImages
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: Date.now()
        }
        
        setMessages(prev => [...prev, assistantMessage])
        
        if (data.session_id && !currentSessionId) {
          setCurrentSessionId(data.session_id)
        }
        
        toast.success("Query processed!")
        setPrompt("")
        setUploadedImages([])
      } else {
        toast.error(`Query failed: ${data.error}`)
      }
    } catch (error) {
      toast.error(`Query error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadChatSessions = async () => {
    try {
      const response = await fetch(`http://${serverAddress}/chat/sessions`)
      const data = await response.json()
      
      if (data.success) {
        setChatSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error)
    }
  }

  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`http://${serverAddress}/chat/sessions/${sessionId}`)
      const data = await response.json()
      
      if (data.success && data.session) {
        setCurrentSessionId(sessionId)
        setMessages(data.session.messages || [])
        toast.success("Chat session loaded")
      }
    } catch (error) {
      toast.error(`Failed to load session: ${error}`)
    }
  }

  const createNewChat = async () => {
    try {
      const response = await fetch(`http://${serverAddress}/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCurrentSessionId(data.session_id)
        setMessages([])
        await loadChatSessions()
        toast.success("New chat created")
      }
    } catch (error) {
      toast.error(`Failed to create chat: ${error}`)
    }
  }

  const deleteChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`http://${serverAddress}/chat/sessions/${sessionId}`, {
        method: "DELETE"
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null)
          setMessages([])
        }
        await loadChatSessions()
        toast.success("Chat deleted")
      }
    } catch (error) {
      toast.error(`Failed to delete chat: ${error}`)
    }
  }

  const addRAGDocument = async () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) {
      toast.error("Please enter both title and content")
      return
    }

    try {
      const response = await fetch(`http://${serverAddress}/rag/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          content: newDocContent
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Document added to RAG")
        setNewDocTitle("")
        setNewDocContent("")
        // Refresh documents list if needed
      }
    } catch (error) {
      toast.error(`Failed to add document: ${error}`)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
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
          <h1 className="text-3xl font-bold">Smart AI Load Balancer v4</h1>
          <p className="text-muted-foreground">
            Enhanced with RAG, Chat History, and Multimodal Support
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="server-address">Server Address</Label>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableModels.length}</div>
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

          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="rag">
                <Database className="h-4 w-4 mr-2" />
                RAG Documents
              </TabsTrigger>
              <TabsTrigger value="history">
                <FileText className="h-4 w-4 mr-2" />
                Chat History
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      AI Chat Interface
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="rag-mode"
                          checked={useRAG}
                          onCheckedChange={setUseRAG}
                        />
                        <Label htmlFor="rag-mode" className="text-sm">
                          Use RAG
                        </Label>
                      </div>
                      <Button size="sm" variant="outline" onClick={createNewChat}>
                        <Plus className="h-4 w-4 mr-1" />
                        New Chat
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Messages */}
                  <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No messages yet. Start a conversation!
                        </p>
                      ) : (
                        messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {msg.images && msg.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {msg.images.map((img, imgIdx) => (
                                    <img
                                      key={imgIdx}
                                      src={img}
                                      alt="Uploaded"
                                      className="h-20 w-20 object-cover rounded"
                                    />
                                  ))}
                                </div>
                              )}
                              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Image Upload Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={img}
                            alt="Upload preview"
                            className="h-20 w-20 object-cover rounded"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeImage(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="space-y-2">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your message..."
                      rows={3}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendQuery()
                        }
                      }}
                    />
                    <div className="flex space-x-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Add Images
                      </Button>
                      <Button 
                        onClick={sendQuery} 
                        disabled={isLoading || !prompt.trim()}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RAG Tab */}
            <TabsContent value="rag" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add Document to RAG</CardTitle>
                  <CardDescription>
                    Add documents to enhance AI responses with context
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="doc-title">Document Title</Label>
                    <Input
                      id="doc-title"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="Enter document title..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-content">Document Content</Label>
                    <Textarea
                      id="doc-content"
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      placeholder="Enter document content..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                  <Button onClick={addRAGDocument} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chat History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Sessions</CardTitle>
                  <CardDescription>
                    View and manage your chat history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {chatSessions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No chat sessions yet
                        </p>
                      ) : (
                        chatSessions.map((session) => (
                          <Card key={session.session_id} className="cursor-pointer hover:bg-muted/50">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div 
                                  className="flex-1"
                                  onClick={() => loadChatSession(session.session_id)}
                                >
                                  <h4 className="font-medium">{session.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {session.message_count} messages • {new Date(session.updated_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteChatSession(session.session_id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!isConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Not Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect to your Smart Load Balancer v4 server to start
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
