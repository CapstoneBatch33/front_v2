import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()
    
    if (!question) {
      return NextResponse.json({ 
        success: false, 
        error: 'No question provided' 
      }, { status: 400 })
    }

    console.log('Received question:', question)

    // Try to call your Node.js backend server first
    try {
      const backendResponse = await fetch('http://localhost:3001/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        // Increase timeout for TinyLlama processing (2 minutes)
        signal: AbortSignal.timeout(120000) // 120 second timeout
      })

      if (backendResponse.ok) {
        const data = await backendResponse.json()
        return NextResponse.json({
          success: true,
          answer: data.answer
        })
      } else {
        const errorText = await backendResponse.text()
        console.log('Backend server error:', backendResponse.status, errorText)
        throw new Error('Backend not available')
      }
    } catch (error: any) {
      // Only use fallback if it's a connection error, not a timeout
      if (error.name === 'TimeoutError') {
        console.log('Backend timeout - TinyLlama is taking too long')
        return NextResponse.json({
          success: false,
          error: 'The AI model is taking longer than expected. Please try a simpler question or wait a moment and try again.',
          answer: 'The AI model is taking longer than expected to respond. This can happen with complex questions. Please try:\n\n1. Asking a simpler, more direct question\n2. Waiting a moment and trying again\n3. Checking that Ollama is running properly'
        }, { status: 504 })
      }
      
      console.log('Backend connection error, using fallback responses:', error)
      
      // Fallback to mock responses when backend is not available
      const mockResponses = {
        moisture: "Based on current sensor readings, your soil moisture appears to be in a good range. Monitor daily and water when levels drop below 30%.",
        temperature: "Current temperature conditions are suitable for most crops. Ensure adequate ventilation if temperatures exceed 28°C.",
        ph: "Your soil pH levels are within acceptable range for most crops. Consider testing monthly for optimal results.",
        crops: "For this season, I recommend planting maize, tomatoes, and leafy greens based on your local conditions.",
        pests: "Common pests to watch for include aphids, corn borers, and spider mites. Regular inspection helps early detection.",
        fertilizer: "A balanced NPK fertilizer (10-10-10) applied at recommended rates should support healthy crop growth.",
        irrigation: "Water early morning or evening to reduce evaporation. Check soil moisture before watering.",
        disease: "Look for yellowing leaves, spots, or unusual growth patterns. Remove affected areas and improve air circulation.",
        default: "I'm here to help with your farming questions! Ask me about crops, soil, pests, irrigation, or plant diseases."
      }

      let answer = mockResponses.default

      const lowerQuestion = question.toLowerCase()
      
      if (lowerQuestion.includes('moisture') || lowerQuestion.includes('water')) {
        answer = mockResponses.moisture
      } else if (lowerQuestion.includes('temperature') || lowerQuestion.includes('temp')) {
        answer = mockResponses.temperature
      } else if (lowerQuestion.includes('ph') || lowerQuestion.includes('soil')) {
        answer = mockResponses.ph
      } else if (lowerQuestion.includes('crop') || lowerQuestion.includes('plant')) {
        answer = mockResponses.crops
      } else if (lowerQuestion.includes('pest') || lowerQuestion.includes('bug')) {
        answer = mockResponses.pests
      } else if (lowerQuestion.includes('fertilizer') || lowerQuestion.includes('nutrient')) {
        answer = mockResponses.fertilizer
      } else if (lowerQuestion.includes('irrigation') || lowerQuestion.includes('watering')) {
        answer = mockResponses.irrigation
      } else if (lowerQuestion.includes('disease') || lowerQuestion.includes('sick')) {
        answer = mockResponses.disease
      }

      return NextResponse.json({
        success: true,
        answer,
        fallback: true
      })
    }
    
  } catch (error: any) {
    console.error('Assistant API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `API error: ${error.message}`,
      answer: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    }, { status: 500 })
  }
}