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
import { Separator } from "@/components/ui/separator"
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
  FileText,
  Settings,
  Menu,
  Edit2,
  Check
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  messages?: Message[]
}

export default function SmartLoadBalancerV4Page() {
  const [serverAddress, setServerAddress] = useState("localhost:5000")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [totalClients, setTotalClients] = useState(0)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  
  // RAG state
  const [useRAG, setUseRAG] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState("")
  const [newDocContent, setNewDocContent] = useState("")
  const [ragStats, setRagStats] = useState<any>(null)
  
  // Chat history state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // UI state
  const [showSidebar, setShowSidebar] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://${serverAddress}/health`)
      const data = await response.json()
      
      if (data.healthy) {
        setIsConnected(true)
        toast.success("Connected to Smart Load Balancer!")
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
        setRagStats(data.rag_stats)
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
    const currentPrompt = prompt
    setPrompt("")
    setUploadedImages([])
    
    try {
      const response = await fetch(`http://${serverAddress}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
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
          await loadChatSessions()
        }
        
        toast.success("Query processed!")
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

  const deleteChatSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    try {
      const response = await fetch(`http://${serverAddress}/chat/sessions/${sessionId}/title`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadChatSessions()
        setEditingSessionId(null)
        toast.success("Title updated")
      }
    } catch (error) {
      toast.error(`Failed to update title: ${error}`)
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
        await refreshStatus()
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
    <div className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Sidebar - Chat History */}
      <div className={cn(
        "flex flex-col border-r bg-muted/10 transition-all duration-300",
        showSidebar ? "w-80" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Chat History</h2>
            <Button size="sm" onClick={createNewChat} disabled={!isConnected}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {isConnected ? (
            <Badge variant="default" className="bg-green-500 w-full justify-center">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="w-full justify-center">
              <WifiOff className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {chatSessions.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm py-8">
                No chat sessions yet
              </p>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.session_id}
                  className={cn(
                    "group relative rounded-lg p-3 cursor-pointer transition-colors",
                    currentSessionId === session.session_id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  )}
                  onClick={() => loadChatSession(session.session_id)}
                >
                  {editingSessionId === session.session_id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateSessionTitle(session.session_id, editingTitle)
                          } else if (e.key === "Escape") {
                            setEditingSessionId(null)
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateSessionTitle(session.session_id, editingTitle)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{session.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {session.message_count || 0} messages
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingSessionId(session.session_id)
                              setEditingTitle(session.title)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => deleteChatSession(session.session_id, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Smart AI Load Balancer</h1>
                <p className="text-sm text-muted-foreground">
                  Distributed AI with RAG & Chat History
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{totalClients} clients</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{availableModels.length} models</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="rag-toggle"
                  checked={useRAG}
                  onCheckedChange={setUseRAG}
                />
                <Label htmlFor="rag-toggle" className="text-sm cursor-pointer">
                  RAG {ragStats && `(${ragStats.total_documents || 0} docs)`}
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-b p-4 bg-muted/30">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
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

                <Separator />

                <div className="space-y-2">
                  <Label>Add Document to RAG</Label>
                  <Input
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Document title..."
                  />
                  <Textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Document content..."
                    rows={4}
                  />
                  <Button onClick={addRAGDocument} size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messages Area */}
        {isConnected ? (
          <>
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                    <p className="text-muted-foreground text-sm">
                      Ask anything about your farm, crops, or get AI-powered insights
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex gap-4",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl p-4",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {msg.images.map((img, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={img}
                                alt="Uploaded"
                                className="h-32 w-32 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {msg.role === "assistant" && msg.content.includes("PROCESSING_DETAILS_START") ? (
                            // Structured response with processing details
                            <div className="space-y-3">
                              {(() => {
                                const parts = msg.content.split("PROCESSING_DETAILS_START")
                                const mainAnswer = parts[0].trim()
                                const processingDetails = parts[1] ? parts[1].trim() : ""
                                
                                // Function to render markdown-style text
                                const renderMarkdown = (text: string) => {
                                  return text.split('\n').map((line, idx) => {
                                    // Convert **text** to bold
                                    const parts = line.split(/(\*\*.*?\*\*)/)
                                    return (
                                      <span key={idx}>
                                        {parts.map((part, pIdx) => {
                                          if (part.startsWith('**') && part.endsWith('**')) {
                                            return <strong key={pIdx}>{part.slice(2, -2)}</strong>
                                          }
                                          return <span key={pIdx}>{part}</span>
                                        })}
                                        {idx < text.split('\n').length - 1 && <br />}
                                      </span>
                                    )
                                  })
                                }
                                
                                return (
                                  <>
                                    <div className="text-sm leading-relaxed">
                                      {renderMarkdown(mainAnswer)}
                                    </div>
                                    {processingDetails && (
                                      <details className="mt-4">
                                        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-muted/50">
                                          📊 View Processing Details
                                        </summary>
                                        <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-muted overflow-hidden">
                                          <pre className="text-xs font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                            {processingDetails}
                                          </pre>
                                        </div>
                                      </details>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          ) : (
                            // Regular text response - also render markdown
                            <div className="text-sm leading-relaxed">
                              {(() => {
                                const renderMarkdown = (text: string) => {
                                  return text.split('\n').map((line, idx) => {
                                    const parts = line.split(/(\*\*.*?\*\*)/)
                                    return (
                                      <span key={idx}>
                                        {parts.map((part, pIdx) => {
                                          if (part.startsWith('**') && part.endsWith('**')) {
                                            return <strong key={pIdx}>{part.slice(2, -2)}</strong>
                                          }
                                          return <span key={pIdx}>{part}</span>
                                        })}
                                        {idx < text.split('\n').length - 1 && <br />}
                                      </span>
                                    )
                                  })
                                }
                                return renderMarkdown(msg.content)
                              })()}
                            </div>
                          )}
                        </div>
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-background">
              <div className="max-w-3xl mx-auto space-y-3">
                {/* Image Upload Preview */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt="Upload preview"
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => removeImage(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
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
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    className="resize-none min-h-[44px] max-h-[200px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendQuery()
                      }
                    }}
                  />
                  <Button 
                    onClick={sendQuery} 
                    disabled={isLoading || !prompt.trim()}
                    size="icon"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Not Connected</h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Connect to your Smart Load Balancer server to start
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="connect-address">Server Address</Label>
                      <Input
                        id="connect-address"
                        value={serverAddress}
                        onChange={(e) => setServerAddress(e.target.value)}
                        placeholder="localhost:5001"
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={testConnection} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Network className="h-4 w-4 mr-2" />
                      )}
                      Connect Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
