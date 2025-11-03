import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Rectangle
import numpy as np
from datetime import datetime

def create_soil_health_card(farmer_data, soil_test_results, recommendations):
    """
    Generate a Soil Health Card similar to the government format

    Parameters:
    farmer_data: dict with farmer details
    soil_test_results: dict with soil test parameters
    recommendations: dict with fertilizer recommendations
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

    # Government logo placeholder (left) with sapling emoji
    # logo_rect = Rectangle((3, 86), 8, 10, facecolor='white', edgecolor='black', linewidth=1)
    # ax.add_patch(logo_rect)
    # ax.text(7, 91, '🌱', ha='center', va='center', fontsize=20, weight='bold')

    # Title
    ax.text(50, 91, 'SOIL HEALTH CARD', ha='center', va='center', fontsize=16, weight='bold', color='white')

    # Farmer Details Section
    farmer_header = Rectangle((2, 75), 48, 8, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(farmer_header)
    ax.text(26, 79, "Farmer's Details", ha='center', va='center', fontsize=12, weight='bold', color='white')

    # Farmer details fields
    farmer_fields = [
        ('Name', farmer_data.get('name', '')),
        ('Address', farmer_data.get('address', '')),
        ('Village', farmer_data.get('village', '')),
        ('Sub-District', farmer_data.get('sub_district', '')),
        ('District', farmer_data.get('district', '')),
        ('PIN', farmer_data.get('pin', '')),
        ('Aadhaar Number', farmer_data.get('aadhaar', '')),
        ('Mobile Number', farmer_data.get('mobile', ''))
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

    # Updated test results data with only the specified parameters
    test_params = [
        ('1', 'Timestamp', soil_test_results.get('timestamp', ''), '', soil_test_results.get('timestamp_rating', '')),
        ('2', 'Temperature', soil_test_results.get('temperature_c', ''), '°C', soil_test_results.get('temperature_rating', '')),
        ('3', 'Humidity', soil_test_results.get('humidity_percent', ''), '%', soil_test_results.get('humidity_rating', '')),
        ('4', 'Soil Moisture', soil_test_results.get('soil_moisture_percent', ''), '%', soil_test_results.get('soil_moisture_rating', '')),
        ('5', 'pH Level', soil_test_results.get('ph_level', ''), '', soil_test_results.get('ph_rating', '')),
        ('6', 'CO2', soil_test_results.get('co2_ppm', ''), 'ppm', soil_test_results.get('co2_rating', '')),
        ('7', 'NPK', soil_test_results.get('npk_percent', ''), '%', soil_test_results.get('npk_rating', ''))
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

    # Soil Sample Details Section - Moved up
    sample_header = Rectangle((2, 52), 48, 3, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(sample_header)
    ax.text(26, 53.5, 'Soil Sample Details', ha='center', va='center', fontsize=10, weight='bold', color='white')

    sample_fields = [
        ('Soil Sample Number', farmer_data.get('sample_number', '')),
        ('Sample Collected on', farmer_data.get('collection_date', '')),
        ('Survey No.', farmer_data.get('survey_no', '')),
        ('Khasra No. / Dag No.', farmer_data.get('khasra_no', '')),
        ('Farm Size', farmer_data.get('farm_size', '')),
        ('Geo Position (GPS)', f"Latitude: {farmer_data.get('latitude', '')}, Longitude: {farmer_data.get('longitude', '')}"),
        ('Irrigated / Rainfed', farmer_data.get('irrigation_type', ''))
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

    # Fertilizer Recommendations Table (Right side) - Moved up below soil test results with 2 entries gap
    fert_header = Rectangle((52, 45), 46, 3, facecolor=green_header, edgecolor='black', linewidth=1)
    ax.add_patch(fert_header)
    ax.text(75, 46.5, 'Fertilizer Recommendations for Reference Yield', ha='center', va='center', fontsize=9, weight='bold', color='white')

    # Fertilizer table headers - Increased widths for better text fit
    fert_headers = ['Sl.\nNo.', 'Crop & Variety', 'Ref.\nYield', 'Fertilizer Combination-1\nfor N P K', 'Fertilizer Combination-2\nfor N P K']
    fert_widths = [3, 12, 6, 12.5, 12.5]  # Adjusted widths
    x_start = 52

    for header, width in zip(fert_headers, fert_widths):
        header_rect = Rectangle((x_start, 42), width, 3, facecolor=light_green, edgecolor='black', linewidth=0.5)
        ax.add_patch(header_rect)
        ax.text(x_start + width/2, 43.5, header, ha='center', va='center', fontsize=6, weight='bold')
        x_start += width

    # Fertilizer recommendations data - Increased row height for better text fit
    fert_data = [
        ('1', recommendations.get('crop_1', 'Paddy (Dhan)'), recommendations.get('yield_1', '6.0 t/ha'),
         recommendations.get('fert_combo1_1', 'Urea 260kg + DAP 110kg + MOP 100kg'), recommendations.get('fert_combo2_1', 'NPK 19:19:19 200kg + Urea 80kg')),
        ('2', recommendations.get('crop_2', ''), recommendations.get('yield_2', ''),
         recommendations.get('fert_combo1_2', ''), recommendations.get('fert_combo2_2', '')),
        ('3', recommendations.get('crop_3', ''), recommendations.get('yield_3', ''),
         recommendations.get('fert_combo1_3', ''), recommendations.get('fert_combo2_3', '')),
        ('4', recommendations.get('crop_4', ''), recommendations.get('yield_4', ''),
         recommendations.get('fert_combo1_4', ''), recommendations.get('fert_combo2_4', '')),
        ('5', recommendations.get('crop_5', ''), recommendations.get('yield_5', ''),
         recommendations.get('fert_combo1_5', ''), recommendations.get('fert_combo2_5', '')),
        ('6', recommendations.get('crop_6', ''), recommendations.get('yield_6', ''),
         recommendations.get('fert_combo1_6', ''), recommendations.get('fert_combo2_6', ''))
    ]

    y_pos = 42
    for fert_row in fert_data:
        x_start = 52
        for i, (data, width) in enumerate(zip(fert_row, fert_widths)):
            # Increased height for fertilizer combination columns
            cell_height = 4 if i >= 3 else 3
            cell_rect = Rectangle((x_start, y_pos-cell_height), width, cell_height, facecolor='white', edgecolor='black', linewidth=0.5)
            ax.add_patch(cell_rect)
            # Smaller font for long fertilizer text
            font_size = 5 if i >= 3 else 6
            ax.text(x_start + width/2, y_pos-cell_height/2, str(data), ha='center', va='center', fontsize=font_size)
            x_start += width
        y_pos -= 4  # Consistent spacing

    # Secondary & Micro Nutrients Recommendations - Moved down to align with fertilizer recommendations gap
    micro_header = Rectangle((2, 32), 32, 3, facecolor=green_header, edgecolor='black', linewidth=1)
    ax.add_patch(micro_header)
    ax.text(18, 33.5, 'Secondary & Micro Nutrients Recommendations', ha='center', va='center', fontsize=8, weight='bold', color='white')

    # Micro nutrients table
    micro_params = [
        ('1', 'Sulphur (S)', recommendations.get('sulphur_rec', '20 kg/ha')),
        ('2', 'Zinc (Zn)', recommendations.get('zinc_rec', '5 kg/ha')),
        ('3', 'Boron (B)', recommendations.get('boron_rec', '1 kg/ha')),
        ('4', 'Iron (Fe)', recommendations.get('iron_rec', '10 kg/ha')),
        ('5', 'Manganese (Mn)', recommendations.get('manganese_rec', '5 kg/ha')),
        ('6', 'Copper (Cu)', recommendations.get('copper_rec', '2 kg/ha'))
    ]

    # Micro nutrients headers - Increased width for recommendations
    micro_headers = ['S.\nNo.', 'Parameter', 'Recommendations for\nSoil Applications']
    micro_widths = [3, 10, 19]  # Increased recommendation column width
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

    # General Recommendations - Adjusted position accordingly
    general_header = Rectangle((2, 11), 32, 2, facecolor=orange_header, edgecolor='black', linewidth=1)
    ax.add_patch(general_header)
    ax.text(18, 12, 'General Recommendations', ha='center', va='center', fontsize=9, weight='bold', color='white')

    general_recs = [
        ('1', 'Organic Manure', recommendations.get('organic_manure', '5 tons/ha')),
        ('2', 'Biofertilizer', recommendations.get('biofertilizer', 'Azotobacter + PSB')),
        ('3', 'Lime / Gypsum', recommendations.get('lime_gypsum', 'Gypsum 250 kg/ha'))
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

    # Only keep the "Healthy Soil for a Healthy Farm" text in the bottom center
    ax.text(50, 5, 'Healthy Soil\nfor\na Healthy Farm', ha='center', va='center', fontsize=11, weight='bold')

    plt.tight_layout()
    return fig

# Example usage
def generate_sample_card():
    # Sample farmer data
    farmer_data = {
        'name': 'Rajesh Kumar',
        'address': 'Village Rampur',
        'village': 'Rampur',
        'sub_district': 'Tehsil ABC',
        'district': 'District XYZ',
        'pin': '123456',
        'aadhaar': '1234-5678-9012',
        'mobile': '9876543210',
        'sample_number': 'SHC2024001',
        'collection_date': '15/03/2024',
        'survey_no': '123/4',
        'khasra_no': '567',
        'farm_size': '2.5 acres',
        'latitude': '28.6139',
        'longitude': '77.2090',
        'irrigation_type': 'Irrigated'
    }

    # Updated soil test results with the new parameters
    soil_test_results = {
        'timestamp': '2024-03-15 10:30:00',
        'timestamp_rating': 'Current',
        'temperature_c': '25.5',
        'temperature_rating': 'Normal',
        'humidity_percent': '68',
        'humidity_rating': 'Good',
        'soil_moisture_percent': '42',
        'soil_moisture_rating': 'Adequate',
        'ph_level': '7.2',
        'ph_rating': 'Normal',
        'co2_ppm': '420',
        'co2_rating': 'Normal',
        'npk_percent': '2.5',
        'npk_rating': 'Medium'
    }

    # Sample recommendations
    recommendations = {
        'sulphur_rec': '20 kg/ha',
        'zinc_rec': '5 kg/ha',
        'boron_rec': '1 kg/ha',
        'iron_rec': '10 kg/ha',
        'manganese_rec': '5 kg/ha',
        'copper_rec': '2 kg/ha',
        'organic_manure': '5 tons/ha',
        'biofertilizer': 'Azotobacter + PSB',
        'lime_gypsum': 'Gypsum 250 kg/ha',
        'crop_1': 'Paddy (Dhan)',
        'yield_1': '6.0 t/ha',
        'fert_combo1_1': 'Urea 260kg + DAP 110kg + MOP 100kg',
        'fert_combo2_1': 'NPK 19:19:19 200kg + Urea 80kg'
    }

    # Generate the card
    fig = create_soil_health_card(farmer_data, soil_test_results, recommendations)

    # Save the card
    plt.savefig('updated_soil_health_card.png', dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.show()

# Run the example
if __name__ == "__main__":
    generate_sample_card()