import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sensorData, farmerData } = body

    // Create a Python script execution
    const pythonScript = `
import sys
import json
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Rectangle
import numpy as np
from datetime import datetime
import io
import base64

def create_soil_health_card(farmer_data, soil_test_results):
    # Create figure with specific dimensions (A4 landscape)
    fig, ax = plt.subplots(1, 1, figsize=(11.7, 8.3))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Colors
    green_header = '#4CAF50'
    orange_header = '#FF9800'
    light_green = '#E8F5E8'

    # Header Section
    header_rect = Rectangle((2, 85), 96, 12, facecolor=green_header, edgecolor='black', linewidth=1)
    ax.add_patch(header_rect)
    ax.text(50, 91, 'SOIL HEALTH CARD', ha='center', va='center', fontsize=16, weight='bold', color='white')

    # Farmer Details Section
    farmer_header = Rectangle((2, 75), 48, 8, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(farmer_header)
    ax.text(26, 79, "Farmer's Details", ha='center', va='center', fontsize=12, weight='bold', color='white')

    farmer_fields = [
        ('Name', farmer_data.get('name', 'Smart Farm User')),
        ('Address', farmer_data.get('address', 'Smart Farm Location')),
        ('Village', farmer_data.get('village', 'Digital Farm')),
        ('District', farmer_data.get('district', 'Smart Agriculture')),
        ('PIN', farmer_data.get('pin', '000000')),
        ('Mobile Number', farmer_data.get('mobile', '+91-XXXXXXXXXX'))
    ]

    y_pos = 73
    for field, value in farmer_fields:
        farmer_field_rect = Rectangle((2, y_pos-2), 24, 2, facecolor='white', edgecolor='black', linewidth=0.5)
        ax.add_patch(farmer_field_rect)
        ax.text(3, y_pos-1, field, ha='left', va='center', fontsize=8)

        farmer_value_rect = Rectangle((26, y_pos-2), 24, 2, facecolor='white', edgecolor='black', linewidth=0.5)
        ax.add_patch(farmer_value_rect)
        ax.text(27, y_pos-1, str(value), ha='left', va='center', fontsize=8)
        y_pos -= 2

    # Soil Test Results Section
    test_header = Rectangle((52, 75), 46, 8, facecolor=green_header, edgecolor='black', linewidth=1)
    ax.add_patch(test_header)
    ax.text(75, 79, 'SOIL TEST RESULTS', ha='center', va='center', fontsize=12, weight='bold', color='white')

    headers = ['S.No.', 'Parameter', 'Value', 'Unit', 'Rating']
    header_widths = [4, 18, 8, 8, 8]
    x_start = 52

    for i, (header, width) in enumerate(zip(headers, header_widths)):
        header_rect = Rectangle((x_start, 73), width, 4, facecolor=light_green, edgecolor='black', linewidth=0.5)
        ax.add_patch(header_rect)
        ax.text(x_start + width/2, 75, header, ha='center', va='center', fontsize=7, weight='bold')
        x_start += width

    def get_rating(param, value):
        try:
            val = float(value)
            if param == 'temperature':
                return 'Optimal' if 20 <= val <= 30 else 'Good' if 15 <= val <= 35 else 'Poor'
            elif param == 'ph':
                return 'Optimal' if 6.0 <= val <= 7.5 else 'Good' if 5.5 <= val <= 8.0 else 'Poor'
            elif param == 'moisture':
                return 'Optimal' if 40 <= val <= 70 else 'Good' if 30 <= val <= 80 else 'Poor'
            elif param in ['nitrogen', 'phosphorus', 'potassium']:
                return 'High' if val >= 50 else 'Medium' if val >= 25 else 'Low'
            else:
                return 'Normal'
        except:
            return 'N/A'

    test_params = [
        ('1', 'Temperature', soil_test_results.get('temperature', '0'), '°C', get_rating('temperature', soil_test_results.get('temperature', '0'))),
        ('2', 'pH Level', soil_test_results.get('ph_level', soil_test_results.get('pH', '0')), '', get_rating('ph', soil_test_results.get('ph_level', soil_test_results.get('pH', '0')))),
        ('3', 'Soil Moisture', soil_test_results.get('soil_moisture', soil_test_results.get('moisture', '0')), '%', get_rating('moisture', soil_test_results.get('soil_moisture', soil_test_results.get('moisture', '0')))),
        ('4', 'Nitrogen', soil_test_results.get('nitrogen', '0'), 'ppm', get_rating('nitrogen', soil_test_results.get('nitrogen', '0'))),
        ('5', 'Phosphorus', soil_test_results.get('phosphorus', '0'), 'ppm', get_rating('phosphorus', soil_test_results.get('phosphorus', '0'))),
        ('6', 'Potassium', soil_test_results.get('potassium', '0'), 'ppm', get_rating('potassium', soil_test_results.get('potassium', '0')))
    ]

    y_pos = 73
    for param_data in test_params:
        x_start = 52
        for i, (data, width) in enumerate(zip(param_data, header_widths)):
            cell_rect = Rectangle((x_start, y_pos-2), width, 2, facecolor='white', edgecolor='black', linewidth=0.5)
            ax.add_patch(cell_rect)
            ax.text(x_start + width/2, y_pos-1, str(data), ha='center', va='center', fontsize=7)
            x_start += width
        y_pos -= 2

    # Sample Details
    sample_header = Rectangle((2, 52), 48, 3, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(sample_header)
    ax.text(26, 53.5, 'Soil Sample Details', ha='center', va='center', fontsize=10, weight='bold', color='white')

    current_date = datetime.now().strftime('%d/%m/%Y')
    sample_fields = [
        ('Sample Number', f"SHC{datetime.now().strftime('%Y%m%d')}001"),
        ('Collection Date', current_date),
        ('Farm Size', '1.0 acres'),
        ('Location', 'IoT Sensor Farm'),
        ('Type', 'Smart Irrigation')
    ]

    y_pos = 51
    for field, value in sample_fields:
        sample_field_rect = Rectangle((2, y_pos-2), 24, 2, facecolor='white', edgecolor='black', linewidth=0.5)
        ax.add_patch(sample_field_rect)
        ax.text(3, y_pos-1, field, ha='left', va='center', fontsize=8)

        sample_value_rect = Rectangle((26, y_pos-2), 24, 2, facecolor='white', edgecolor='black', linewidth=0.5)
        ax.add_patch(sample_value_rect)
        ax.text(27, y_pos-1, str(value), ha='left', va='center', fontsize=7)
        y_pos -= 2

    # Recommendations
    rec_header = Rectangle((52, 35), 46, 3, facecolor=green_header, edgecolor='black', linewidth=1)
    ax.add_patch(rec_header)
    ax.text(75, 36.5, 'Fertilizer Recommendations', ha='center', va='center', fontsize=10, weight='bold', color='white')

    nitrogen = float(soil_test_results.get('nitrogen', 50))
    phosphorus = float(soil_test_results.get('phosphorus', 30))
    potassium = float(soil_test_results.get('potassium', 80))
    
    rec_text = f"Based on NPK levels (N:{nitrogen:.0f}, P:{phosphorus:.0f}, K:{potassium:.0f}):\\n"
    if nitrogen < 30:
        rec_text += "• High Nitrogen fertilizer recommended\\n"
    if phosphorus < 25:
        rec_text += "• Phosphorus supplement needed\\n"
    if potassium < 50:
        rec_text += "• Potassium enhancement required\\n"
    
    rec_rect = Rectangle((52, 20), 46, 15, facecolor='white', edgecolor='black', linewidth=0.5)
    ax.add_patch(rec_rect)
    ax.text(75, 27.5, rec_text, ha='center', va='center', fontsize=8)

    # General recommendations
    general_header = Rectangle((2, 25), 48, 3, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(general_header)
    ax.text(26, 26.5, 'General Recommendations', ha='center', va='center', fontsize=10, weight='bold', color='white')

    general_text = "• Apply organic manure 5 tons/ha\\n• Use biofertilizers\\n• Maintain proper irrigation\\n• Monitor soil pH regularly"
    general_rect = Rectangle((2, 10), 48, 15, facecolor='white', edgecolor='black', linewidth=0.5)
    ax.add_patch(general_rect)
    ax.text(26, 17.5, general_text, ha='center', va='center', fontsize=8)

    ax.text(50, 5, 'Healthy Soil for a Healthy Farm', ha='center', va='center', fontsize=11, weight='bold')

    # Convert to base64
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    plt.close(fig)
    
    return image_base64

# Read input data
input_data = json.loads(sys.stdin.read())
farmer_data = input_data.get('farmerData', {})
sensor_data = input_data.get('sensorData', {})

# Generate health card
try:
    image_base64 = create_soil_health_card(farmer_data, sensor_data)
    print(json.dumps({"success": True, "image": image_base64}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`

    return new Promise((resolve) => {
      const python = spawn('python', ['-c', pythonScript])
      
      let output = ''
      let error = ''

      python.stdin.write(JSON.stringify({ sensorData, farmerData }))
      python.stdin.end()

      python.stdout.on('data', (data) => {
        output += data.toString()
      })

      python.stderr.on('data', (data) => {
        error += data.toString()
      })

      python.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output.trim())
            resolve(NextResponse.json(result))
          } catch (parseError) {
            resolve(NextResponse.json({ 
              success: false, 
              error: 'Failed to parse Python output',
              details: output 
            }, { status: 500 }))
          }
        } else {
          resolve(NextResponse.json({ 
            success: false, 
            error: 'Python script execution failed',
            details: error || 'Unknown error',
            code 
          }, { status: 500 }))
        }
      })
    })

  } catch (error) {
    console.error('Health card generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate health card',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}