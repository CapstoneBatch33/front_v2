# 🌱 Smart Farm Dashboard & AI Chatbot

A comprehensive smart farming solution with real-time sensor monitoring, data visualization, and an AI-powered farming assistant chatbot.

## 🚀 Features

- **📊 Real-time Dashboard** - Monitor soil moisture, temperature, pH, and other vital metrics
- **🤖 AI Farming Assistant** - Chat with TinyLlama for farming advice and recommendations
- **📈 Data Visualization** - Interactive charts and graphs for sensor data analysis
- **🖼️ Plant Disease Detection** - Upload plant images for AI-powered disease identification
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices
- **🔄 Live Data Updates** - Real-time sensor data from IoT devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Python Flask
- **AI**: Ollama (TinyLlama), TensorFlow.js
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts
- **Styling**: Tailwind CSS, Framer Motion

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **Ollama** - [Download here](https://ollama.ai/)
- **Git** - [Download here](https://git-scm.com/)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd smart-farm-dashboard
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Install and Setup Ollama
```bash
# Install Ollama (follow instructions for your OS from https://ollama.ai)

# Start Ollama service
ollama serve

# Pull the TinyLlama model (in a new terminal)
ollama pull tinyllama

# Test Ollama (optional)
ollama run tinyllama "Hello, how are you?"
```

## 🚀 Running the Application

You have two options to run the complete system:

### Option A: Automated Startup (Recommended)
```bash
npm run start-chatbot
```
This will start all services automatically.

### Option B: Manual Startup

#### Terminal 1: Start Ollama Service
```bash
ollama serve
```

#### Terminal 2: Start Python Backend (Sensor Data)
```bash
python smart_farm_server.py
```

#### Terminal 3: Start Node.js Backend (AI Chatbot)
```bash
node ollama-server.js
```

#### Terminal 4: Start Next.js Frontend
```bash
npm run dev
```

## 🌐 Access the Application

Once all services are running:

- **🏠 Main Dashboard**: http://localhost:3000
- **🤖 AI Chatbot**: http://localhost:3000/chatbot
- **📊 Sensor History**: http://localhost:3000/sensor-history
- **🔧 Backend API**: http://localhost:3001
- **🐍 Python API**: http://localhost:8080

## 📱 How to Use

### Dashboard Features
1. **Real-time Monitoring**: View live sensor data on the main dashboard
2. **Historical Data**: Check sensor trends and patterns over time
3. **Health Cards**: Generate soil health reports and recommendations

### AI Chatbot Features
1. **Ask Questions**: Type farming-related questions in natural language
2. **Get Recommendations**: Receive personalized advice based on your sensor data
3. **Image Analysis**: Upload plant photos to detect diseases
4. **Smart Suggestions**: Get contextual suggestions based on your queries

### Example Questions for the AI Chatbot
- "What's the best fertilizer for corn?"
- "How often should I water my tomatoes?"
- "What are signs of plant disease?"
- "What crops should I plant this season?"
- "My soil pH is 6.2, is that good?"

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory:
```env
# Optional: Add any API keys or configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
PYTHON_API_URL=http://localhost:8080
```

### Sensor Configuration
Edit `smart_farm_server.py` to configure your sensor endpoints and data sources.

### AI Model Configuration
Edit `ollama-server.js` to customize the AI assistant's behavior and responses.

## 🧪 Testing

### Test the Complete Setup
```bash
npm run test-chatbot
```

### Test Individual Components
```bash
# Test frontend only
npm run dev

# Test Python backend
python smart_farm_server.py

# Test Node.js backend
node ollama-server.js
```

## 📊 API Endpoints

### Frontend API Routes
- `GET /api/sensor-data` - Get current sensor readings
- `GET /api/sensor-history` - Get historical sensor data
- `POST /api/assistant` - Chat with AI assistant

### Python Backend (Port 8080)
- `GET /api/sensor-data` - Real sensor data from IoT devices
- `POST /api/generate-health-card` - Generate soil health reports

### Node.js Backend (Port 3001)
- `POST /api/assistant` - AI chatbot powered by Ollama
- `GET /api/sensor-data` - Proxy to Python backend

## 🚨 Troubleshooting

### Common Issues

#### 1. Ollama Not Working
```bash
# Check if Ollama is installed
ollama --version

# Start Ollama service
ollama serve

# Pull the model again
ollama pull tinyllama
```

#### 2. Port Already in Use
```bash
# Kill processes on specific ports
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### 3. Python Dependencies Issues
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 4. Node.js Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error Messages

| Error | Solution |
|-------|----------|
| "Connection refused" | Make sure all servers are running |
| "Model not found" | Run `ollama pull tinyllama` |
| "Port 3000 in use" | Kill the process or use a different port |
| "Python module not found" | Install requirements: `pip install -r requirements.txt` |

## 📁 Project Structure

```
smart-farm-dashboard/
├── app/                          # Next.js app directory
│   ├── dashboard/               # Dashboard page
│   ├── chatbot/                # AI chatbot page
│   ├── api/                    # API routes
│   └── globals.css             # Global styles
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components
│   └── navbar.tsx              # Navigation component
├── lib/                        # Utility libraries
│   ├── utils.ts               # Helper functions
│   └── model-loader.js        # AI model loader
├── public/                     # Static assets
├── data/                       # Data files
├── ollama-server.js           # AI chatbot backend
├── smart_farm_server.py       # Sensor data backend
├── start-chatbot.js           # Startup script
├── package.json               # Node.js dependencies
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Run the test script: `npm run test-chatbot`
3. Check server logs in each terminal
4. Ensure all prerequisites are installed correctly

## 🎯 Quick Start Checklist

- [ ] Node.js installed
- [ ] Python installed  
- [ ] Ollama installed and running
- [ ] Dependencies installed (`npm install` & `pip install -r requirements.txt`)
- [ ] TinyLlama model downloaded (`ollama pull tinyllama`)
- [ ] All servers running (Python, Node.js, Ollama, Next.js)
- [ ] Accessing dashboard at http://localhost:3000

---

**Happy Farming! 🌾🚜**