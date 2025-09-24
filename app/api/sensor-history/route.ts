import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

// Simple file-based storage for sensor history
const HISTORY_FILE = path.join(process.cwd(), 'sensor_history.json');

interface SensorReading {
  timestamp: string;
  datetime: string;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  ph_level: number;
  co2: number;
  light: number;
  location?: string;
  notes?: string;
}

function loadHistory(): SensorReading[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading sensor history:', error);
  }
  return [];
}

function saveHistory(history: SensorReading[]): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving sensor history:', error);
  }
}

export async function GET() {
  try {
    const history = loadHistory();
    return NextResponse.json({
      success: true,
      history: history.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      history: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sensor_data, notes } = await request.json();

    if (!sensor_data) {
      return NextResponse.json({
        success: false,
        error: "Sensor data is required"
      }, { status: 400 });
    }

    const now = new Date();
    const reading: SensorReading = {
      timestamp: now.toISOString(),
      datetime: now.toLocaleString(),
      temperature: parseFloat(sensor_data.temperature) || 0,
      humidity: parseFloat(sensor_data.humidity) || 0,
      soil_moisture: parseFloat(sensor_data.moisture || sensor_data.soil_moisture) || 0,
      ph_level: parseFloat(sensor_data.pH || sensor_data.ph_level) || 0,
      co2: parseFloat(sensor_data.co2) || 0,
      light: parseFloat(sensor_data.light) || 0,
      location: sensor_data.location || 'Farm Dashboard',
      notes: notes || ''
    };

    const history = loadHistory();
    history.push(reading);
    
    // Keep only last 1000 readings
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    saveHistory(history);

    return NextResponse.json({
      success: true,
      message: "Sensor reading saved successfully",
      reading: reading,
      total_readings: history.length
    });

  } catch (error: any) {
    console.error("Error saving sensor reading:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      fs.unlinkSync(HISTORY_FILE);
    }
    
    return NextResponse.json({
      success: true,
      message: "Sensor history cleared successfully"
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}