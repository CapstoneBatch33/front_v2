import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Rectangle
import numpy as np
from datetime import datetime
import io
import base64

def create_soil_health_card(farmer_data, soil_test_results, recommendations):
    """
    Generate a Soil Health Card similar to the government format
    Returns base64 encoded image
    """
    # Create figure with specific dimensions (A4 landscape)
    fig, ax = plt.subplots(1, 1, figsize=(11.7, 8.3))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Colors
    green_header = '#4CAF50'
    orange_header = '#FF9800'
    light_green = '#E8F5E8'
    light_orange = '#FFF3E0'

    # Header Section
    header_rect = Rectangle((2, 85), 96, 12, facecolor=green_header, edgecolor='black', linewidth=1)
    ax.add_patch(header_rect)

    # Title
    ax.text(50, 91, 'SOIL HEALTH CARD', ha='center', va='center', fontsize=16, weight='bold', color='white')

    # Farmer Details Section
    farmer_header = Rectangle((2, 75), 48, 8, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(farmer_header)
    ax.text(26, 79, "Farmer's Details", ha='center', va='center', fontsize=12, weight='bold', color='white')

    # Farmer details fields
    farmer_fields = [
        ('Name', farmer_data.get('name', 'Smart Farm User')),
        ('Address', farmer_data.get('address', 'Smart Farm Location')),
        ('Village', farmer_data.get('village', 'Digital Farm')),
        ('Sub-District', farmer_data.get('sub_district', 'IoT District')),
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

    # Test results table headers
    headers = ['S.\nNo.', 'Parameter', 'Test\nValue', 'Unit', 'Rating']
    header_widths = [4, 18, 8, 8, 8]
    x_start = 52

    for i, (header, width) in enumerate(zip(headers, header_widths)):
        header_rect = Rectangle((x_start, 73), width, 4, facecolor=light_green, edgecolor='black', linewidth=0.5)
        ax.add_patch(header_rect)
        ax.text(x_start + width/2, 75, header, ha='center', va='center', fontsize=7, weight='bold')
        x_start += width

    # Get rating based on value
    def get_rating(param, value):
        try:
            val = float(value)
            if param == 'temperature':
                if 20 <= val <= 30: return 'Optimal'
                elif 15 <= val <= 35: return 'Good'
                else: return 'Poor'
            elif param == 'humidity':
                if 40 <= val <= 80: return 'Optimal'
                elif 30 <= val <= 90: return 'Good'
                else: return 'Poor'
            elif param == 'moisture':
                if 40 <= val <= 70: return 'Optimal'
                elif 30 <= val <= 80: return 'Good'
                else: return 'Poor'
            elif param in ['nitrogen', 'phosphorus', 'potassium']:
                if val >= 50: return 'High'
                elif val >= 25: return 'Medium'
                else: return 'Low'
            else:
                return 'Normal'
        except:
            return 'N/A'

    # Test results data
    test_params = [
        ('1', 'Temperature', soil_test_results.get('temperature', '0'), '°C', get_rating('temperature', soil_test_results.get('temperature', '0'))),
        ('2', 'Humidity', soil_test_results.get('humidity', '0'), '%', get_rating('humidity', soil_test_results.get('humidity', '0'))),
        ('3', 'Soil Moisture', soil_test_results.get('soil_moisture', soil_test_results.get('moisture', '0')), '%', get_rating('moisture', soil_test_results.get('soil_moisture', soil_test_results.get('moisture', '0')))),
        ('4', 'Nitrogen', soil_test_results.get('nitrogen', '0'), 'ppm', get_rating('nitrogen', soil_test_results.get('nitrogen', '0'))),
        ('5', 'Phosphorus', soil_test_results.get('phosphorus', '0'), 'ppm', get_rating('phosphorus', soil_test_results.get('phosphorus', '0'))),
        ('6', 'Potassium', soil_test_results.get('potassium', '0'), 'ppm', get_rating('potassium', soil_test_results.get('potassium', '0'))),
        ('7', 'Timestamp', soil_test_results.get('timestamp', soil_test_results.get('datetime', 'Current')), '', 'Current')
    ]

    y_pos = 73
    for param_data in test_params:
        x_start = 52
        for i, (data, width) in enumerate(zip(param_data, header_widths)):
            cell_rect = Rectangle((x_start, y_pos-2), width, 2, facecolor='white', edgecolor='black', linewidth=0.5)
            ax.add_patch(cell_rect)
            # Truncate long timestamp values
            display_data = str(data)
            if i == 2 and len(display_data) > 10:  # Test Value column
                display_data = display_data[:10] + '...'
            ax.text(x_start + width/2, y_pos-1, display_data, ha='center', va='center', fontsize=7)
            x_start += width
        y_pos -= 2

    # Soil Sample Details Section
    sample_header = Rectangle((2, 52), 48, 3, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(sample_header)
    ax.text(26, 53.5, 'Soil Sample Details', ha='center', va='center', fontsize=10, weight='bold', color='white')

    current_date = datetime.now().strftime('%d/%m/%Y')
    sample_fields = [
        ('Soil Sample Number', f"SHC{datetime.now().strftime('%Y%m%d')}001"),
        ('Sample Collected on', current_date),
        ('Survey No.', 'SMART-001'),
        ('Farm Size', '1.0 acres'),
        ('Geo Position (GPS)', 'IoT Sensor Location'),
        ('Irrigated / Rainfed', 'Smart Irrigation')
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

    # Fertilizer Recommendations Table
    fert_header = Rectangle((52, 45), 46, 3, facecolor=green_header, edgecolor='black', linewidth=1)
    ax.add_patch(fert_header)
    ax.text(75, 46.5, 'Fertilizer Recommendations for Reference Yield', ha='center', va='center', fontsize=9, weight='bold', color='white')

    # Generate recommendations based on soil test results
    def generate_recommendations(soil_data):
        nitrogen = float(soil_data.get('nitrogen', 50))
        phosphorus = float(soil_data.get('phosphorus', 30))
        potassium = float(soil_data.get('potassium', 80))
        
        if nitrogen < 30:
            n_rec = "High Nitrogen needed - Urea 300kg/ha"
        elif nitrogen < 50:
            n_rec = "Medium Nitrogen - Urea 200kg/ha"
        else:
            n_rec = "Low Nitrogen - Urea 100kg/ha"
            
        return {
            'crop_1': 'Mixed Vegetables',
            'yield_1': '4.0 t/ha',
            'fert_combo1_1': n_rec,
            'fert_combo2_1': f'NPK Complex based on N:{nitrogen:.0f} P:{phosphorus:.0f} K:{potassium:.0f}'
        }

    recs = generate_recommendations(soil_test_results)

    # Fertilizer table headers
    fert_headers = ['Sl.\nNo.', 'Crop & Variety', 'Ref.\nYield', 'Fertilizer Combination-1\nfor N P K', 'Fertilizer Combination-2\nfor N P K']
    fert_widths = [3, 12, 6, 12.5, 12.5]
    x_start = 52

    for header, width in zip(fert_headers, fert_widths):
        header_rect = Rectangle((x_start, 42), width, 3, facecolor=light_green, edgecolor='black', linewidth=0.5)
        ax.add_patch(header_rect)
        ax.text(x_start + width/2, 43.5, header, ha='center', va='center', fontsize=6, weight='bold')
        x_start += width

    # Fertilizer recommendations data
    fert_data = [
        ('1', recs['crop_1'], recs['yield_1'], recs['fert_combo1_1'], recs['fert_combo2_1']),
        ('2', '', '', '', ''),
        ('3', '', '', '', '')
    ]

    y_pos = 42
    for fert_row in fert_data:
        x_start = 52
        for i, (data, width) in enumerate(zip(fert_row, fert_widths)):
            cell_height = 4 if i >= 3 else 3
            cell_rect = Rectangle((x_start, y_pos-cell_height), width, cell_height, facecolor='white', edgecolor='black', linewidth=0.5)
            ax.add_patch(cell_rect)
            font_size = 5 if i >= 3 else 6
            ax.text(x_start + width/2, y_pos-cell_height/2, str(data), ha='center', va='center', fontsize=font_size)
            x_start += width
        y_pos -= 4

    # Secondary & Micro Nutrients Recommendations
    micro_header = Rectangle((2, 32), 32, 3, facecolor=green_header, edgecolor='black', linewidth=1)
    ax.add_patch(micro_header)
    ax.text(18, 33.5, 'Secondary & Micro Nutrients Recommendations', ha='center', va='center', fontsize=8, weight='bold', color='white')

    micro_params = [
        ('1', 'Sulphur (S)', '20 kg/ha'),
        ('2', 'Zinc (Zn)', '5 kg/ha'),
        ('3', 'Boron (B)', '1 kg/ha'),
        ('4', 'Iron (Fe)', '10 kg/ha'),
        ('5', 'Manganese (Mn)', '5 kg/ha'),
        ('6', 'Copper (Cu)', '2 kg/ha')
    ]

    micro_headers = ['S.\nNo.', 'Parameter', 'Recommendations for\nSoil Applications']
    micro_widths = [3, 10, 19]
    x_start = 2

    for header, width in zip(micro_headers, micro_widths):
        header_rect = Rectangle((x_start, 29), width, 3, facecolor=light_green, edgecolor='black', linewidth=0.5)
        ax.add_patch(header_rect)
        ax.text(x_start + width/2, 30.5, header, ha='center', va='center', fontsize=7, weight='bold')
        x_start += width

    y_pos = 29
    for param_data in micro_params:
        x_start = 2
        for data, width in zip(param_data, micro_widths):
            cell_rect = Rectangle((x_start, y_pos-2.5), width, 2.5, facecolor='white', edgecolor='black', linewidth=0.5)
            ax.add_patch(cell_rect)
            ax.text(x_start + width/2, y_pos-1.25, str(data), ha='center', va='center', fontsize=7)
            x_start += width
        y_pos -= 2.5

    # General Recommendations
    general_header = Rectangle((2, 11), 32, 2, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(general_header)
    ax.text(18, 12, 'General Recommendations', ha='center', va='center', fontsize=9, weight='bold', color='white')

    general_recs = [
        ('1', 'Organic Manure', '5 tons/ha'),
        ('2', 'Biofertilizer', 'Azotobacter + PSB'),
        ('3', 'Lime / Gypsum', 'Gypsum 250 kg/ha')
    ]

    y_pos = 10
    for rec_data in general_recs:
        sno_rect = Rectangle((2, y_pos-3), 3, 3, facecolor='white', edgecolor='black', linewidth=0.5)
        ax.add_patch(sno_rect)
        ax.text(3.5, y_pos-1.5, rec_data[0], ha='center', va='center', fontsize=7)

        param_rect = Rectangle((5, y_pos-3), 10, 3, facecolor='white', edgecolor='black', linewidth=0.5)
        ax.add_patch(param_rect)
        ax.text(10, y_pos-1.5, rec_data[1], ha='center', va='center', fontsize=7)

        rec_rect = Rectangle((15, y_pos-3), 19, 3, facecolor='white', edgecolor='black', linewidth=0.5)
        ax.add_patch(rec_rect)
        ax.text(24.5, y_pos-1.5, rec_data[2], ha='center', va='center', fontsize=7)

        y_pos -= 3

    # Bottom text
    ax.text(50, 5, 'Healthy Soil\nfor\na Healthy Farm', ha='center', va='center', fontsize=11, weight='bold')

    # Convert to base64
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    plt.close(fig)
    
    return image_base64