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

// Function to get sensor data from Python API
async function getSensorData() {
  try {
    const response = await axios.get('http://localhost:8080/api/sensor-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    // Return default values if API is not available
    return {
      nitrogen: 50,
      phosphorus: 30,
      potassium: 80,
      pH: 6.5,
      moisture: 45,
      temperature: 25,
      co2: 450
    };
  }
}

// Endpoint to handle farming questions and classification
app.post('/api/assistant', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).send({ error: "No question provided" });
  }

  console.log('Received question:', question);

  // Use default sensor data
  const sensorData = {
    nitrogen: 50,
    phosphorus: 30,
    potassium: 80,
    pH: 6.5,
    moisture: 45,
    temperature: 25,
    co2: 450
  };

  // System prompt for the farming assistant
  const system_prompt = "You are a highly knowledgeable and helpful assistant for farmers. You specialize in answering questions related to Wheat and Maize crops. " +
    "Your goal is to provide accurate, clear, and practical advice on farming practices, pest control, irrigation, " +
    "soil nutrition, and disease prevention. You are expected to give precise, actionable, and simple advice suitable for " +
    "farmers with varying levels of expertise.\n" +
    "When answering, ensure that your responses are easy to understand, include important details, and are framed in a way " +
    "that helps farmers implement the advice directly.\n" +
    "Additionally, after answering the question, classify it into one of the following categories: " +
    "1. Disease Detection, 2. General Query, 3. Irrigation Related, or 4. Soil Nutrition.\n" +
    "Always respond as a knowledgeable farming expert, providing helpful solutions for real-world farming challenges.\n\n" +
    "If you're uncertain about the question or its context, clarify before answering.";

  const answerPrompt = `${system_prompt}\nFarmer's Question: ${question}\nAnswer:`;

  console.log('Querying TinyLlama...');

  try {
    let fullResponse = await queryTinyLlamaStream(answerPrompt);
    console.log('\nAnswer generated, length:', fullResponse.length);

    // Extract only the answer part after "Answer:" if it exists
    let answer = fullResponse;
    if (answer.includes("Answer:")) {
      answer = answer.split("Answer:")[1].trim();
    }

    // Clean up the answer to remove classification text
    const classificationPatterns = [
      /Category:\s*\d+\.?\s*[\w\s]+/i,
      /This question falls under the category of\s*[\w\s]+/i,
      /This is a\s*(Disease Detection|General Query|Irrigation Related|Soil Nutrition)\s*question/i,
      /Classify this as\s*[\w\s]+/i,
      /Classification:\s*[\w\s]+/i,
    ];

    for (const pattern of classificationPatterns) {
      answer = answer.replace(pattern, '');
    }

    answer = answer.trim();
    console.log('Cleaned answer:', answer);

    // Classify the question separately
    console.log('Classifying question...');
    const classifyPrompt = `Classify the following question into one of these categories:\n1. Disease Detection\n2. General Query\n3. Irrigation Related\n4. Soil Nutrition\n\nQuestion: ${question}\nCategory:`;
    
    const category = await queryTinyLlamaStream(classifyPrompt);
    console.log('Question classified as:', category);

    const cleanCategory = category.trim().split('\n')[0].replace(/^\d+\.\s*/, '');

    res.json({ 
      answer, 
      category: cleanCategory
    });

    console.log('Response sent successfully');
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ 
      error: "Failed to process request", 
      answer: "I'm sorry, I couldn't process your request at this time. Please try again later.",
      category: "Error"
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