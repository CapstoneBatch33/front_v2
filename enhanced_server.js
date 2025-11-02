const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { spawn } = require('child_process');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Configuration
const RASPBERRY_PI_URL = process.env.RASPBERRY_PI_URL || 'http://localhost:5000';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Function to query TinyLlama with streaming
const queryTinyLlamaStream = async (prompt) => {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: "tinyllama",
      prompt: prompt,
      stream: true,
      temperature: 0.7,
      top_p: 0.9,
    }, {
      responseType: 'stream',
    });

    let responseText = '';
    
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        try {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                responseText += data.response;
                process.stdout.write(data.response);
              }
            } catch (parseError) {
              console.log('Error parsing line:', line);
            }
          }
        } catch (e) {
          console.error('Error processing chunk:', e.message);
          responseText += chunk.toString();
        }
      });

      response.data.on('end', () => {
        console.log('\nStream ended, total response length:', responseText.length);
        resolve(responseText);
      });

      response.data.on('error', (error) => {
        console.error('Stream error:', error.message);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error with TinyLlama:", error);
    return "⚠️ Error: Unable to fetch the response.";
  }
};

// Function to get sensor data from Raspberry Pi
async function getSensorDataFromPi() {
  try {
    console.log(`Fetching sensor data from: ${RASPBERRY_PI_URL}/api/current-sensors`);
    const response = await axios.get(`${RASPBERRY_PI_URL}/api/current-sensors`, {
      timeout: 5000 // 5 second timeout
    });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      console.warn('Pi server returned unsuccessful response:', response.data);
      return getDefaultSensorData();
    }
  } catch (error) {
    console.error('Error fetching sensor data from Pi:', error.message);
    return getDefaultSensorData();
  }
}

// Default sensor data fallback
function getDefaultSensorData() {
  return {
    nitrogen: 50,
    phosphorus: 30,
    potassium: 80,
    ph_level: 6.5,
    soil_moisture: 45,
    temperature: 25,
    co2: 450,
    humidity: 65,
    light: 800
  };
}

// Endpoint to get current sensor data (proxy to Pi)
app.get('/api/sensor-data', async (req, res) => {
  try {
    const sensorData = await getSensorDataFromPi();
    res.json({
      success: true,
      data: sensorData,
      source: sensorData.timestamp ? 'raspberry_pi' : 'default'
    });
  } catch (error) {
    console.error('Error in sensor data endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch sensor data',
      data: getDefaultSensorData(),
      source: 'default'
    });
  }
});

// Endpoint to get sensor history (proxy to Pi)
app.get('/api/sensor-history', async (req, res) => {
  try {
    const response = await axios.get(`${RASPBERRY_PI_URL}/api/sensor-history`, {
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching sensor history from Pi:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sensor history from Pi',
      history: []
    });
  }
});

// Endpoint to save sensor reading (proxy to Pi)
app.post('/api/sensor-history', async (req, res) => {
  try {
    const response = await axios.post(`${RASPBERRY_PI_URL}/api/sensor-history`, req.body, {
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error saving sensor reading to Pi:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to save sensor reading to Pi'
    });
  }
});

// Endpoint to clear sensor history (proxy to Pi)
app.delete('/api/sensor-history', async (req, res) => {
  try {
    const response = await axios.delete(`${RASPBERRY_PI_URL}/api/sensor-history`, {
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error clearing sensor history on Pi:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to clear sensor history on Pi'
    });
  }
});

// Endpoint to handle farming questions and classification
app.post('/api/assistant', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).send({ error: "No question provided" });
  }

  console.log('Received question:', question);

  // Get real sensor data from Pi
  const sensorData = await getSensorDataFromPi();
  console.log('Current sensor data:', sensorData);
  
  // System prompt for farming assistant
  const system_prompt = 
      "You are a highly knowledgeable and helpful assistant for farmers. You specialize in answering questions related to Wheat and Maize crops. " +
      "Your goal is to provide accurate, clear, and practical advice on farming practices, pest control, irrigation, " +
      "soil nutrition, and disease prevention. You are expected to give precise, actionable, and simple advice suitable for " +
      "farmers with varying levels of expertise.\n" +
      "When answering, ensure that your responses are easy to understand, include important details, and are framed in a way " +
      "that helps farmers implement the advice directly.\n" +
      "Additionally, after answering the question, classify it into one of the following categories: " +
      "1. Disease Detection, 2. General Query, 3. Irrigation Related, or 4. Soil Nutrition.\n" +
      "Always respond as a knowledgeable farming expert, providing helpful solutions for real-world farming challenges.\n\n" +
      "If you're uncertain about the question or its context, clarify before answering.";

  // Include sensor data in the prompt
  const sensorContext = `Current sensor readings from your farm:\n` +
    `- Soil Moisture: ${sensorData.soil_moisture}%\n` +
    `- Temperature: ${sensorData.temperature}°C\n` +
    `- Humidity: ${sensorData.humidity}%\n` +
    `- Soil pH: ${sensorData.ph_level}\n` +
    `- Nitrogen: ${sensorData.nitrogen} mg/kg\n` +
    `- Phosphorus: ${sensorData.phosphorus} mg/kg\n` +
    `- Potassium: ${sensorData.potassium} mg/kg\n` +
    `- CO2 Level: ${sensorData.co2} ppm\n` +
    `- Light Level: ${sensorData.light} lux\n\n`;
    
  const answerPrompt = `${system_prompt}\n${sensorContext}\nFarmer's Question: ${question}\nAnswer:`;
  console.log('Full prompt for TinyLlama:', answerPrompt);

  try {
    console.log('Generating answer...');
    let fullResponse = await queryTinyLlamaStream(answerPrompt);
    console.log('\nAnswer generated, length:', fullResponse.length);
    
    // Clean up the answer
    let answer = fullResponse;
    
    if (answer.includes("Answer:")) {
      answer = answer.split("Answer:")[1].trim();
    }
    
    // Remove classification text from answer
    const classificationPatterns = [
      /Category:\s*\d+\.?\s*[\w\s]+/i,
      /This question falls under the category of\s*[\w\s]+/i,
      /This is a\s*(Disease Detection|General Query|Irrigation Related|Soil Nutrition)\s*question/i,
      /Classify this as\s*[\w\s]+/i,
      /Based on the passage above[\s\S]*$/i,
      /Classification:\s*[\w\s]+/i,
      /This falls under[\s\S]*$/i
    ];
    
    for (const pattern of classificationPatterns) {
      answer = answer.replace(pattern, '');
    }
    
    const endMarkers = [
      "Category:", 
      "Classification:", 
      "This question falls under", 
      "This is a Disease Detection", 
      "This is a General Query", 
      "This is an Irrigation Related", 
      "This is a Soil Nutrition"
    ];
    
    for (const marker of endMarkers) {
      if (answer.includes(marker)) {
        answer = answer.substring(0, answer.indexOf(marker)).trim();
      }
    }
    
    answer = answer.replace(/\d+\.\s*(Disease Detection|General Query|Irrigation Related|Soil Nutrition)/gi, '');
    answer = answer.trim();
    answer = answer.replace(/[.\s]+$/g, '.');
    
    console.log('Cleaned answer:', answer);
    
    // Classify the question separately
    console.log('Classifying question...');
    const classifyPrompt = `Classify the following question into one of these categories:\n1. Disease Detection\n2. General Query\n3. Irrigation Related\n4. Soil Nutrition\n\nQuestion: ${question}\nCategory:`;
    const category = await queryTinyLlamaStream(classifyPrompt);
    console.log('Question classified as:', category);

    const cleanCategory = category.trim().split('\n')[0].replace(/^\d+\.\s*/, '');

    // Respond with answer, category, and current sensor data
    res.json({ 
      answer, 
      category: cleanCategory,
      sensorData: sensorData,
      timestamp: new Date().toISOString()
    });
    console.log('Response sent successfully');
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ 
      error: "Failed to process request", 
      answer: "I'm sorry, I couldn't process your request at this time. Please try again later.",
      category: "Error",
      sensorData: sensorData
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      raspberry_pi: RASPBERRY_PI_URL,
      ollama: OLLAMA_URL
    }
  });
});

// Test Pi connection endpoint
app.get('/api/test-pi', async (req, res) => {
  try {
    const response = await axios.get(`${RASPBERRY_PI_URL}/`, { timeout: 5000 });
    res.json({
      success: true,
      message: 'Successfully connected to Raspberry Pi',
      pi_response: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Raspberry Pi',
      details: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Enhanced Backend server is running on http://localhost:${port}`);
  console.log(`Raspberry Pi URL: ${RASPBERRY_PI_URL}`);
  console.log(`Ollama URL: ${OLLAMA_URL}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  /api/health - Health check');
  console.log('  GET  /api/test-pi - Test Pi connection');
  console.log('  GET  /api/sensor-data - Get current sensor data');
  console.log('  GET  /api/sensor-history - Get sensor history');
  console.log('  POST /api/sensor-history - Save sensor reading');
  console.log('  DELETE /api/sensor-history - Clear sensor history');
  console.log('  POST /api/assistant - AI farming assistant');
});