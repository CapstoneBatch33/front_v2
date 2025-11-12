const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Function to query TinyLlama with streaming
const queryTinyLlamaStream = async (prompt) => {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "tinyllama",  // Specify the TinyLlama model
      prompt: prompt,
      stream: true,
      temperature: 0.3,  // Lower temperature for more focused responses
      top_p: 0.9,
      num_predict: 200,  // Limit response length
      stop: ["\n\nQuestion:", "\nQuestion:", "Question:", "\n\n\n"],  // Stop sequences
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

// Function to get sensor data from Python API
async function getSensorData() {
  try {
    const response = await axios.get('http://localhost:8080/api/sensor-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    // Return default values if API is not available
    return {
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      humidity: 0,
      moisture: 0,
      temperature: 0,
      co2: 0
    };
  }
}

// Endpoint to handle farming questions
app.post('/api/assistant', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).send({ error: "No question provided" });
  }

  console.log('Received question:', question);

  // Check for simple greetings or casual messages
  const lowerQuestion = question.toLowerCase().trim();
  
  // More flexible greeting detection
  const isGreeting = /^(hi+|hello+|hey+|greetings?|good\s+(morning|afternoon|evening|day))[\s!.]*$/i.test(lowerQuestion);
  
  // Handle greetings directly without calling the model
  if (isGreeting) {
    const greetingResponse = "Hello! I'm your farming assistant for Wheat and Maize crops. How can I help you today? You can ask me about:\n\n• Planting and growing tips\n• Pest and disease management\n• Irrigation and watering\n• Soil nutrition and fertilizers\n• Harvesting advice";
    console.log('Greeting detected, sending quick response');
    return res.json({ answer: greetingResponse });
  }

  // System prompt for the farming assistant - simplified to prevent rambling
  const system_prompt = "You are a helpful farming expert specializing in Wheat and Maize crops. " +
    "Answer the farmer's question directly and concisely with practical advice they can use immediately. " +
    "Use simple language and include specific details like quantities and timings when relevant. " +
    "Keep your answer focused and under 200 words.";

  const answerPrompt = `${system_prompt}\n\nQuestion: ${question}\n\nAnswer:`;

  try {
    let fullResponse = await queryTinyLlamaStream(answerPrompt);
    console.log('\nAnswer generated, length:', fullResponse.length);

    // Clean up the response - but DON'T crop it
    let answer = fullResponse.trim();
    
    // Remove any repeated "Answer:" labels at the start
    if (answer.startsWith("Answer:")) {
      answer = answer.substring(7).trim();
    }

    console.log('Final answer:', answer);

    res.json({ answer });

    console.log('Response sent successfully');
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ 
      error: "Failed to process request", 
      answer: "I'm sorry, I couldn't process your request at this time. Please try again later."
    });
  }
});

// Add endpoint to get sensor data directly
app.get('/api/sensor-data', async (req, res) => {
  try {
    const sensorData = await getSensorData();
    res.json(sensorData);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  console.log('Make sure Ollama is running on http://localhost:11434');
  console.log('To start Ollama: ollama serve');
  console.log('To pull TinyLlama: ollama pull tinyllama');
});