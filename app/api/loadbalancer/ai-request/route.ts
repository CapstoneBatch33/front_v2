import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { server_address, model_name, prompt, parameters } = await request.json()
    
    if (!server_address || !model_name || !prompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 })
    }

    console.log(`Redirecting to REAL AI request for: ${server_address} with model: ${model_name}`)
    
    // Use the real gRPC AI request endpoint instead of hardcoded responses
    try {
      const response = await fetch('/api/grpc/ai-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          server_address, 
          model_name, 
          prompt, 
          parameters: parameters || {} 
        })
      })
      
      const result = await response.json()
      return NextResponse.json(result)
      
    } catch (error: any) {
      console.error('Failed to make real AI request:', error)
      
      return NextResponse.json({
        success: false,
        error: `AI request failed: ${error.message}`,
        response_text: `Error: Failed to connect to Pi for AI processing`
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('AI request error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Failed to process AI request: ${error.message}`,
      response_text: `Error: ${error.message}`
    }, { status: 500 })
  }
}