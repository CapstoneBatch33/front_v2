"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Bot, User, Loader2, Leaf, Droplets, Thermometer, Upload, Sun, Cloud, Wind, Tractor, Image as ImageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { classifyImage, loadModel } from "@/lib/model-loader"

// Function to fetch real sensor data
const fetchSensorData = async () => {
  try {
    const response = await fetch('/api/sensor-data')
    const result = await response.json()
    
    if (result.success) {
      return {
        moisture: result.data.soil_moisture || 0,
        temperature: result.data.temperature || 0,
        humidity: result.data.humidity || 0,
        co2: result.data.co2 || 0,
        light: result.data.light || 0,
        nitrogen: result.data.nitrogen || 0,
        phosphorus: result.data.phosphorus || 0,
        potassium: result.data.potassium || 0
      }
    }
  } catch (error) {
    console.error('Error fetching sensor data:', error)
  }
  
  // Fallback to default values
  return {
    moisture: 0,
    temperature: 0,
    humidity: 0,
    co2: 0,
    light: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0
  }
}

// Mock AI responses
const mockResponses: Record<string, string> = {
  default: "I'm your Smart Farming Assistant. How can I help you today?",
  greeting:
    "Hello there, farmer! I'm your digital farming companion, ready to help your crops thrive. Ask me about soil conditions, pest management, or anything else happening in your fields! 🌱",
  moisture: "Based on your current soil moisture reading, your soil is in the optimal range. No irrigation is needed at this time. I recommend checking again tomorrow morning. Remember: happy soil, happy plants!",
  temperature: "The current temperature is ideal for most crops. Your plants are enjoying this weather! If temperatures rise above 28°C, consider providing some shade for your more sensitive green friends.",
  humidity: "Your current humidity level is good for most crops. Maintaining humidity between 40-80% helps prevent fungal diseases while keeping plants hydrated. Monitor closely during hot weather!",
  crops:
    "For your region and current season, I recommend planting: \n\n1. Maize/Corn - Thrives in your warm weather and will make excellent use of your soil conditions\n2. Tomatoes - Perfect match for your soil pH, and they'll love the current temperature range\n3. Leafy greens - Quick harvest cycle and great for crop rotation\n\nWould you like specific planting instructions for any of these green companions?",
  pests:
    "Based on your region and current conditions, keep your eyes peeled for these common troublemakers:\n\n1. Aphids - The tiny thieves that love to gather on the undersides of leaves\n2. Corn borers - Sneaky pests that leave small holes in stalks as their calling card\n3. Spider mites - These become more common in dry conditions, like tiny drought-loving ninjas\n\nWould you like some organic control methods to keep these visitors in check?",
  fertilizer:
    "Based on your soil data, I recommend a balanced NPK fertilizer (10-10-10) applied at 2.5kg per 100 square meters. Think of it as a nutritious feast for your soil! Apply in the early morning or evening for best results, when your plants are most ready to enjoy their meal.",
  plantDisease:
    "Let me analyze this plant image for you! I can detect various plant diseases and provide treatment recommendations.",
}

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  isLoading?: boolean
  withData?: boolean
  image?: string
  diseaseData?: {
    class: string,
    confidence: number
  }
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: mockResponses.greeting,
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [currentSensorData, setCurrentSensorData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState([
    "Best crops for this season?",
    "What's my soil moisture level?",
    "Help me with common pests?",
    "What fertilizer should I use?",
    "Scan a plant leaf for diseases",
  ])
  
  // Weather forecast data for character
  const [weatherForecast, setWeatherForecast] = useState([
    { day: "Today", condition: "Sunny", temp: "24°C", icon: <Sun className="h-5 w-5 text-yellow-500" /> },
    { day: "Tomorrow", condition: "Partly Cloudy", temp: "22°C", icon: <Cloud className="h-5 w-5 text-blue-400" /> },
    { day: "Wednesday", condition: "Windy", temp: "20°C", icon: <Wind className="h-5 w-5 text-blue-500" /> },
  ])
  
  // Farm tips for added character
  const [farmTip, setFarmTip] = useState("Rotate your crops to improve soil health and reduce pest problems naturally!")
  
  const farmTips = [
    "Rotate your crops to improve soil health and reduce pest problems naturally!",
    "Companion planting can help deter pests - try planting marigolds near your tomatoes!",
    "Morning is the best time to water your plants - less evaporation and time to dry before evening.",
    "Mulching helps retain soil moisture and suppresses weeds. Less work, healthier plants!",
    "Consider planting cover crops in the off-season to prevent soil erosion.",
    "Coffee grounds make excellent compost material and many plants love the acidity!",
    "Regular scanning of plant leaves can help detect diseases before they spread to the entire crop.",
  ]

  // Load the model and fetch sensor data when the component mounts
  useEffect(() => {
    loadModel().catch(err => console.error("Error loading model:", err));
    fetchInitialSensorData();
  }, []);

  const fetchInitialSensorData = async () => {
    const sensorData = await fetchSensorData();
    setCurrentSensorData(sensorData);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // Change the farm tip periodically for added character
  useEffect(() => {
    const interval = setInterval(() => {
      const randomTip = farmTips[Math.floor(Math.random() * farmTips.length)]
      setFarmTip(randomTip)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsTyping(true)

    try {
      // Call the real AI assistant API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: currentInput }),
      })

      const result = await response.json()

      if (result.answer) {
        // Update sensor data if provided
        if (result.sensorData) {
          setCurrentSensorData(result.sensorData)
        }

        const botMessage: Message = {
          id: Date.now().toString(),
          content: result.answer,
          sender: "bot",
          timestamp: new Date(),
          withData: currentInput.toLowerCase().includes("moisture") || 
                   currentInput.toLowerCase().includes("temperature") || 
                   currentInput.toLowerCase().includes("ph") ||
                   currentInput.toLowerCase().includes("sensor"),
        }

        setMessages((prev) => [...prev, botMessage])

        // Update suggestions based on category
        if (result.category) {
          updateSuggestionsBasedOnCategory(result.category)
        }
      } else {
        throw new Error('No response from AI assistant')
      }
    } catch (error) {
      console.error('Error calling AI assistant:', error)
      
      // Fallback to mock response
      let responseContent = mockResponses.default
      let withData = false

      if (currentInput.toLowerCase().includes("moisture") || currentInput.toLowerCase().includes("water")) {
        responseContent = `Based on your current soil moisture reading of ${currentSensorData?.moisture || 42}%, your soil is in the optimal range. No irrigation is needed at this time.`
        withData = true
      } else if (currentInput.toLowerCase().includes("temperature")) {
        responseContent = `The current temperature is ${currentSensorData?.temperature || 24}°C, which is ideal for most crops.`
        withData = true
      } else if (currentInput.toLowerCase().includes("ph")) {
        responseContent = `Your soil pH is currently ${currentSensorData?.pH || 6.2}, which is slightly acidic and good for most crops.`
        withData = true
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        content: responseContent,
        sender: "bot",
        timestamp: new Date(),
        withData,
      }

      setMessages((prev) => [...prev, botMessage])
    }

    setIsTyping(false)
  }

  const updateSuggestionsBasedOnCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'irrigation related':
        setSuggestions([
          "When should I water my crops?",
          "What's the ideal soil moisture?",
          "How to improve water retention?",
          "Show me irrigation recommendations",
        ])
        break
      case 'soil nutrition':
        setSuggestions([
          "What fertilizer should I use?",
          "How to improve soil nutrients?",
          "What's my NPK levels?",
          "Organic vs synthetic fertilizers?",
        ])
        break
      case 'disease detection':
        setSuggestions([
          "Scan a plant leaf for diseases",
          "Common plant diseases in my area?",
          "How to prevent plant diseases?",
          "Organic disease treatments?",
        ])
        break
      default:
        setSuggestions([
          "Best crops for this season?",
          "What's my soil moisture level?",
          "Help me with common pests?",
          "What fertilizer should I use?",
        ])
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a message showing the uploaded image
    const userMessage: Message = {
      id: Date.now().toString(),
      content: "I'd like to check if this plant has any diseases.",
      sender: "user",
      timestamp: new Date(),
      image: URL.createObjectURL(file),
    }

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessingImage(true);

    // Add a loading message from the bot
    const loadingMessage: Message = {
      id: Date.now().toString() + "-loading",
      content: "Analyzing your plant image...",
      sender: "bot",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Create an image element to use with the model
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = async () => {
        // Import the model functions dynamically
        const { classifyImage } = await import('@/lib/model-loader');
        
        // Process the image with the model
        const result = await classifyImage(img);
        
        // Remove the loading message
        setMessages((prev) => prev.filter(msg => msg.id !== loadingMessage.id));
        
        // Format the disease name for display
        const formattedDiseaseName = result.class
          .replace(/_/g, ' ')
          .replace(/___/g, ' - ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        
        // Create a response with the disease information
        const botMessage: Message = {
          id: Date.now().toString(),
          content: `${mockResponses.plantDisease} I've identified this as **${formattedDiseaseName}** with ${(result.confidence * 100).toFixed(2)}% confidence.`,
          sender: "bot",
          timestamp: new Date(),
          diseaseData: result,
        }

        setMessages((prev) => [...prev, botMessage]);
        
        // Add treatment recommendations based on the disease
        setTimeout(() => {
          const treatmentMessage: Message = {
            id: Date.now().toString(),
            content: getTreatmentRecommendation(result.class),
            sender: "bot",
            timestamp: new Date(),
          }
          
          setMessages((prev) => [...prev, treatmentMessage]);
        }, 1000);
        
        setIsProcessingImage(false);
      };
    } catch (error) {
      console.error("Error processing image:", error);
      
      // Remove the loading message
      setMessages((prev) => prev.filter(msg => msg.id !== loadingMessage.id));
      
      // Add an error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I couldn't analyze that image. Please try again with a clearer photo of the plant leaf.",
        sender: "bot",
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, errorMessage]);
      setIsProcessingImage(false);
    }
  }

  // Function to get treatment recommendations based on the disease
  const getTreatmentRecommendation = (diseaseClass: string) => {
    // Map of disease classes to treatment recommendations
    const treatments: Record<string, string> = {
      'Apple___Apple_scab': 'For Apple Scab, I recommend:\n\n1. Remove and destroy infected leaves\n2. Apply fungicides like captan or myclobutanil\n3. Ensure proper spacing between trees for air circulation\n4. Consider resistant apple varieties for future plantings',
      
      'Apple___Black_rot': 'To treat Black Rot in apples:\n\n1. Prune out diseased branches and cankers\n2. Remove mummified fruits from trees\n3. Apply fungicides during the growing season\n4. Maintain good orchard sanitation',
      
      'Corn_(maize)___Common_rust_': 'For Corn Rust management:\n\n1. Plant rust-resistant corn varieties\n2. Apply fungicides like azoxystrobin or pyraclostrobin\n3. Ensure proper field drainage\n4. Rotate crops to reduce disease pressure',
      
      // Add more disease treatments as needed
      
      'default': 'For this plant condition, I recommend:\n\n1. Remove affected leaves to prevent spread\n2. Ensure proper watering (avoid overhead irrigation)\n3. Improve air circulation around plants\n4. Consider applying an appropriate fungicide or treatment\n5. Monitor closely for any changes in condition'
    };
    
    return treatments[diseaseClass] || treatments['default'];
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <Tractor className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold mb-1">AI Farming Assistant</h1>
            <p className="text-muted-foreground italic">"Growing wisdom for your growing plants"</p>
          </div>
        </div>
        <div className="mt-2 p-3 bg-amber-100 rounded-lg border border-amber-200 text-amber-800 text-sm">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <p className="font-medium">Farmer's Tip of the Day:</p>
          </div>
          <p className="mt-1 pl-7">{farmTip}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-[75vh] flex flex-col shadow-lg">
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="bg-primary/10 p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-green-500">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" />
                    <AvatarFallback className="bg-green-100">
                      <Bot className="h-6 w-6 text-green-700" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">Farm AI Assistant</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                      <p className="text-xs text-muted-foreground">Online • Updated with latest agricultural data</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 overflow-y-auto h-[calc(75vh-150px)]">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex mb-5 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                        <Avatar className={`h-10 w-10 ${message.sender === "user" ? "border-2 border-primary" : "border-2 border-green-500"}`}>
                          <AvatarFallback className={message.sender === "user" ? "bg-primary/20" : "bg-green-100"}>
                            {message.sender === "user" ? 
                              <User className="h-5 w-5 text-primary" /> : 
                              <Bot className="h-5 w-5 text-green-700" />
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div
                            className={`rounded-lg p-4 ${
                              message.sender === "user" 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            }`}
                          >
                            {message.isLoading ? (
                              <div className="flex items-center gap-3">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{message.content}</span>
                              </div>
                            ) : (
                              <>
                                <p className="whitespace-pre-line">{message.content}</p>
                                
                                {/* Display uploaded image if present */}
                                {message.image && (
                                  <div className="mt-2 rounded-md overflow-hidden">
                                    <img 
                                      src={message.image} 
                                      alt="Uploaded plant" 
                                      className="max-h-60 w-auto object-contain"
                                    />
                                  </div>
                                )}
                                
                                {/* Display sensor data visualization if applicable */}
                                {message.withData && currentSensorData && (
                                  <div className="mt-3 grid grid-cols-3 gap-2">
                                    <div className="bg-background/80 p-2 rounded flex flex-col items-center">
                                      <Droplets className="h-5 w-5 text-blue-500 mb-1" />
                                      <span className="text-xs text-muted-foreground">Moisture</span>
                                      <span className="font-medium">{currentSensorData.moisture}%</span>
                                    </div>
                                    <div className="bg-background/80 p-2 rounded flex flex-col items-center">
                                      <Thermometer className="h-5 w-5 text-red-500 mb-1" />
                                      <span className="text-xs text-muted-foreground">Temp</span>
                                      <span className="font-medium">{currentSensorData.temperature}°C</span>
                                    </div>
                                    <div className="bg-background/80 p-2 rounded flex flex-col items-center">
                                      <Leaf className="h-5 w-5 text-green-500 mb-1" />
                                      <span className="text-xs text-muted-foreground">pH</span>
                                      <span className="font-medium">{currentSensorData.pH}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Display disease data if present */}
                                {message.diseaseData && (
                                  <div className="mt-3 bg-background/80 p-3 rounded-md">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Leaf className="h-5 w-5 text-green-600" />
                                      <span className="font-medium">Disease Analysis</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="text-sm">
                                        <p className="text-muted-foreground">Detected:</p>
                                        <p className="font-medium">
                                          {message.diseaseData.class.replace(/_/g, ' ').replace(/___/g, ' - ')}
                                        </p>
                                      </div>
                                      <div className="text-sm">
                                        <p className="text-muted-foreground">Confidence:</p>
                                        <p className="font-medium">
                                          {(message.diseaseData.confidence * 100).toFixed(2)}%
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <div
                            className={`text-xs text-muted-foreground mt-1 ${
                              message.sender === "user" ? "text-right" : ""
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                  >
                    {isProcessingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isTyping || isProcessingImage}
                  />
                  <Button 
                    className="shrink-0" 
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping || isProcessingImage}
                  >
                    {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                  
                  {/* Hidden file input for image upload */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isProcessingImage}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar with suggestions and weather */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Suggested Questions</h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => {
                      setInput(suggestion)
                      if (suggestion.toLowerCase().includes("scan")) {
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Weather Forecast</h3>
              <div className="space-y-2">
                {weatherForecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      {day.icon}
                      <span>{day.day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{day.condition}</span>
                      <Badge variant="outline">{day.temp}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}