import { NextRequest, NextResponse } from 'next/server'

/**
 * Smart Load Balancer Status API
 * Gets the current status of connected clients and models
 */

export async function POST(request: NextRequest) {
  try {
    const { serverAddress = 'localhost:5001' } = await request.json()

    const response = await fetch(`http://${serverAddress}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      status: data,
    })
  } catch (error) {
    console.error('Smart load balancer status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
