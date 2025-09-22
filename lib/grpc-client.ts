/**
 * gRPC Client for AI Load Balancer
 * Handles communication between frontend and Python gRPC server
 */

export interface GRPCClientConfig {
  serverAddress: string
  timeout?: number
}

export class GRPCLoadBalancerClient {
  private serverAddress: string
  private timeout: number

  constructor(config: GRPCClientConfig) {
    this.serverAddress = config.serverAddress
    this.timeout = config.timeout || 30000
  }

  /**
   * Test connection to load balancer
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch('/api/grpc/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          server_address: this.serverAddress 
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Health check failed: ${error}`)
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<any> {
    try {
      const response = await fetch('/api/grpc/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          server_address: this.serverAddress 
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Status check failed: ${error}`)
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<any> {
    try {
      const response = await fetch('/api/grpc/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          server_address: this.serverAddress 
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Get models failed: ${error}`)
    }
  }

  /**
   * Send AI request
   */
  async processAIRequest(request: {
    model_name: string
    prompt: string
    parameters?: Record<string, string>
    input_type?: string
    input_data?: string
  }): Promise<any> {
    try {
      const response = await fetch('/api/grpc/ai-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_address: this.serverAddress,
          ...request
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`AI request failed: ${error}`)
    }
  }

  /**
   * Process sensor data
   */
  async processSensorData(sensorData: {
    sensor_id: string
    sensor_type: string
    readings: Array<{
      parameter: string
      value: number
      unit: string
      timestamp: number
    }>
    timestamp: number
    location: string
  }): Promise<any> {
    try {
      const response = await fetch('/api/grpc/sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_address: this.serverAddress,
          sensor_data: sensorData
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Sensor data processing failed: ${error}`)
    }
  }

  /**
   * Deploy model to client
   */
  async deployModel(modelName: string, clientId?: string): Promise<any> {
    try {
      const response = await fetch('/api/grpc/deploy-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          server_address: this.serverAddress,
          model_name: modelName,
          client_id: clientId
        }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Model deployment failed: ${error}`)
    }
  }
}