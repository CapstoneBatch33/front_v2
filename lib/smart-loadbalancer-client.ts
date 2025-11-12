/**
 * Smart Load Balancer Client
 * Handles communication with the Python smart_load_balancer_server.py
 */

export interface SmartLoadBalancerConfig {
  serverAddress: string
  timeout?: number
}

export interface QueryResponse {
  success: boolean
  response?: string
  session_id?: string
  metadata?: {
    total_clients?: number
    models_used?: string[]
    processing_time?: number
    summary_method?: string
    context_used?: string[]
    images_received?: number
    rag_enabled?: boolean
  }
  error?: string
}

export interface ImageData {
  image_base64: string
  mime_type: string
  filename?: string
}

export interface ChatSession {
  session_id: string
  title: string
  messages: ChatMessage[]
  created_at: number
  updated_at: number
}

export interface ChatMessage {
  message_id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  images?: ImageData[]
}

export interface Document {
  doc_id: string
  content: string
  title: string
  metadata?: Record<string, string>
}

export interface RAGSearchResult {
  success: boolean
  documents?: Document[]
  scores?: number[]
  error?: string
}

export interface ClientInfo {
  client_id: string
  hostname: string
  ip_address: string
  specs: {
    cpu_cores: number
    cpu_frequency_ghz: number
    ram_gb: number
    gpu_info: string
    gpu_memory_gb: number
    os_info: string
    performance_score: number
  }
  assigned_model: string
  last_seen: number
}

export interface StatusResponse {
  success: boolean
  status?: {
    total_clients: number
    active_clients: number
    available_models: string[]
    clients: ClientInfo[]
  }
  error?: string
}

export class SmartLoadBalancerClient {
  private config: SmartLoadBalancerConfig

  constructor(config: SmartLoadBalancerConfig) {
    this.config = {
      timeout: 60000, // 60 seconds for AI processing
      ...config,
    }
  }

  /**
   * Send a query to be processed by the distributed AI system
   */
  async query(
    prompt: string,
    options?: {
      session_id?: string
      use_rag?: boolean
      images?: ImageData[]
    }
  ): Promise<QueryResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!)

      const response = await fetch('/api/smart-loadbalancer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          serverAddress: this.config.serverAddress,
          session_id: options?.session_id,
          use_rag: options?.use_rag || false,
          images: options?.images || [],
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - AI processing took too long',
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get all chat sessions
   */
  async getChatSessions(limit: number = 50): Promise<{ success: boolean; sessions?: ChatSession[]; error?: string }> {
    try {
      const response = await fetch(`/api/smart-loadbalancer/chat/sessions?limit=${limit}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Create a new chat session
   */
  async createChatSession(title: string = 'New Chat'): Promise<{ success: boolean; session_id?: string; error?: string }> {
    try {
      const response = await fetch('/api/smart-loadbalancer/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get chat history for a session
   */
  async getChatHistory(sessionId: string): Promise<{ success: boolean; session?: ChatSession; error?: string }> {
    try {
      const response = await fetch(`/api/smart-loadbalancer/chat/sessions/${sessionId}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Delete a chat session
   */
  async deleteChatSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/smart-loadbalancer/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Add a document to RAG store
   */
  async addDocument(content: string, title: string, metadata?: Record<string, string>): Promise<{ success: boolean; doc_id?: string; error?: string }> {
    try {
      const response = await fetch('/api/smart-loadbalancer/rag/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title, metadata }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Search documents in RAG store
   */
  async searchDocuments(query: string, topK: number = 3): Promise<RAGSearchResult> {
    try {
      const response = await fetch('/api/smart-loadbalancer/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: topK }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Delete a document from RAG store
   */
  async deleteDocument(docId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/smart-loadbalancer/rag/documents/${docId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get the current status of the load balancer system
   */
  async getStatus(): Promise<StatusResponse> {
    try {
      const response = await fetch('/api/smart-loadbalancer/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverAddress: this.config.serverAddress,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Test connection to the load balancer
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const result = await this.getStatus()
    return {
      success: result.success,
      error: result.error,
    }
  }
}
