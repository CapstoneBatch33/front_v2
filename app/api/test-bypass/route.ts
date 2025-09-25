import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint to bypass any auth issues
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "API is working - no auth required",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: "POST endpoint working",
      received: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}