const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { spawn } = require('child_process');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Function to query TinyLlama with streaming
const queryTinyLlamaStream = async (prompt) => {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "tinyllama",  // Specify the TinyLlama model (or adjust for your setup)
      prompt: prompt,
      stream: true,
      temperature: 0.7,
      top_p: 0.9,
    }, {
      responseType: 'stream',  // Ensures we get a stream response
    });

    let responseText = '';
    
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        try {
          // Ollama returns JSON objects in each chunk
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                responseText += data.response;
                // For debugging
                process.stdout.write(data.response);
              }
            } catch (parseError) {
              // If this specific line isn't valid JSON, log and continue
              console.log('Error parsing line:', line);
            }
          }
        } catch (e) {
          // If overall chunk processing fails, just append the raw chunk
          console.error('Error processing chunk:', e.message);
          responseText += chunk.toString();
        }
      });

      response.data.on('end', () => {
        console.log('\nStream ended, total response length:', responseText.length);
        resolve(responseText);  // Resolve the full response once the stream ends
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

  // Comment out sensor data fetching to reduce module reloading
  // const sensorData = await getSensorData();
  // console.log('Current sensor data:', sensorData);
  
  // Use default sensor data instead
  const sensorData = {
    nitrogen: 50,
    phosphorus: 30,
    potassium: 80,
    pH: 6.5,
    moisture: 45,
    temperature: 25,
    co2: 450
  };
  
  // Step 1: Generate the answer from TinyLlama with sensor data context
  const system_prompt = 
      "You are a highly knowledgeable and helpful assistant for farmers. You specialize in answering questions related Wheat and Maize crops." 
      "Your goal is to provide accurate, clear, and practical advice on farming practices, pest control, irrigation, " 
      "soil nutrition, and disease prevention. You are expected to give precise, actionable, and simple advice suitable for " 
      "farmers with varying levels of expertise.\n" 
      "When answering, ensure that your responses are easy to understand, include important details, and are framed in a way " 
      "that helps farmers implement the advice directly.\n" 
      "Additionally, after answering the question, classify it into one of the following categories: " 
      "1. Disease Detection, 2. General Query, 3. Irrigation Related, or 4. Soil Nutrition.\n" 
      "Always respond as a knowledgeable farming expert, providing helpful solutions for real-world farming challenges.\n\n" 
      "If you're uncertain about the question or its context, clarify before answering.";

  // Include sensor data in the prompt
  const sensorContext = `Current sensor readings:\n` +
    `- Soil Moisture: ${sensorData.moisture}%\n` +
    `- Temperature: ${sensorData.temperature}°C\n` +
    `- Soil pH: ${sensorData.pH}\n` +
    `- Nitrogen: ${sensorData.nitrogen} mg/kg\n` +
    `- Phosphorus: ${sensorData.phosphorus} mg/kg\n` +
    `- Potassium: ${sensorData.potassium} mg/kg\n` +
    `- CO2 Level: ${sensorData.co2} ppm\n\n`;
    
    
  //add sensor context to the prompt when the sensor values are working
  //const answerPrompt = `${system_prompt}\n${sensorContext}\nFarmer's Question: ${question}\nAnswer:`;

  const answerPrompt = `${system_prompt}\nFarmer's Question: ${question}\nAnswer:`;
  console.log('Full prompt for TinyLlama:', answerPrompt);

  try {
    console.log('Generating answer...');
    let fullResponse = await queryTinyLlamaStream(answerPrompt);
    console.log('\nAnswer generated, length:', fullResponse.length);
    
    // Extract only the answer part after "Answer:" if it exists in the response
    let answer = fullResponse;
    
    // If the response contains "Answer:" prefix from the prompt, remove it
    if (answer.includes("Answer:")) {
      answer = answer.split("Answer:")[1].trim();
    }
    
    // Clean up the answer to remove any classification text that might be included
    // Look for patterns that indicate the model is trying to classify in the answer
    const classificationPatterns = [
      /Category:\s*\d+\.?\s*[\w\s]+/i,
      /This question falls under the category of\s*[\w\s]+/i,
      /This is a\s*(Disease Detection|General Query|Irrigation Related|Soil Nutrition)\s*question/i,
      /Classify this as\s*[\w\s]+/i,
      /Based on the passage above[\s\S]*$/i,
      /Classification:\s*[\w\s]+/i,
      /This falls under[\s\S]*$/i
    ];
    
    // Remove any classification text from the answer
    for (const pattern of classificationPatterns) {
      answer = answer.replace(pattern, '');
    }
    
    // Additional cleanup to ensure we only get the clean answer
    // Remove any text after common classification indicators
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
    
    // Trim any trailing whitespace and remove any numbered category markers
    answer = answer.replace(/\d+\.\s*(Disease Detection|General Query|Irrigation Related|Soil Nutrition)/gi, '');
    answer = answer.trim();
    
    // Remove any trailing punctuation that might indicate the start of classification
    answer = answer.replace(/[.\s]+$/g, '.'); // Replace multiple periods or spaces at the end with a single period
    
    console.log('Cleaned answer:', answer);
    
    // Step 2: Classify the question separately
    console.log('Classifying question...');
    const classifyPrompt = `Classify the following question into one of these categories:\n1. Disease Detection\n2. General Query\n3. Irrigation Related\n4. Soil Nutrition\n\nQuestion: ${question}\nCategory:`;
    const category = await queryTinyLlamaStream(classifyPrompt);
    console.log('Question classified as:', category);

    // Clean up the category text to extract just the category
    const cleanCategory = category.trim().split('\n')[0].replace(/^\d+\.\s*/, '');

    // Respond with both the answer and category (without sensor data to prevent reloading)
    res.json({ 
      answer, 
      category: cleanCategory
      // sensorData removed to prevent frequent reloading
    });
    console.log('Response sent successfully');
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ 
      error: "Failed to process request", 
      answer: "I'm sorry, I couldn't process your request at this time. Please try again later.",
      category: "Error"
      // sensorData removed to prevent frequent reloading
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
});