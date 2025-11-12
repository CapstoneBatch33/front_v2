import { NextRequest, NextResponse } from 'next/server'

/**
 * Smart Load Balancer Query API
 * Communicates with the Python smart_load_balancer_server.py
 */

export async function POST(request: NextRequest) {
  try {
    const { prompt, serverAddress = 'localhost:5001', session_id, use_rag, images } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Forward the request to the Python smart load balancer HTTP wrapper
    // The wrapper communicates with the gRPC server internally
    const response = await fetch(`http://${serverAddress}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt,
        session_id,
        use_rag: use_rag || false,
        images: images || []
      }),
      signal: AbortSignal.timeout(120000), // 2 minute timeout for AI processing
    })

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      response: data.response,
      session_id: data.session_id,
      metadata: data.metadata || {},
    })
  } catch (error) {
    console.error('Smart load balancer query error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
