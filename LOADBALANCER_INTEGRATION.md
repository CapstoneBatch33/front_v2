# AI Load Balancer Frontend Integration

This document explains how to integrate the frontend with your AI Load Balancer system.

## 🎯 What's Included

### New Page: `/test_loadBalancer`
A comprehensive test console for your AI Load Balancer with:

- **Connection Testing** - Test connectivity to your Raspberry Pi server
- **System Overview** - Real-time dashboard showing clients, models, and tasks
- **Client Management** - View all connected laptops and their capabilities
- **Model Monitoring** - Track deployed AI models across the network
- **AI Testing** - Test different AI models with custom prompts
- **Sensor Integration** - Test agricultural sensor data processing
- **Results Tracking** - View test results and performance metrics

### Features

#### 🔗 Connection Management
- Configure server address (your Raspberry Pi IP)
- Test connection health
- Real-time connection status

#### 📊 System Monitoring
- Total clients and active status
- Deployed models count
- Active/completed tasks
- System health indicators

#### 💻 Client Overview
- View all connected laptops
- System specifications (CPU, RAM, GPU)
- Performance scores
- Deployed models per client
- Online/offline status

#### 🤖 AI Model Testing
- Test LLaMA models with custom prompts
- Computer vision model testing
- Agricultural classifier testing
- Configurable parameters (temperature, max tokens)
- Real-time processing time tracking

#### 🌱 Sensor Data Testing
- Input agricultural sensor data
- Temperature, humidity, soil moisture, pH testing
- AI-powered analysis and recommendations
- Health score calculation

#### 📈 Results Dashboard
- Test history with timestamps
- Success/failure tracking
- Processing time metrics
- Client assignment information

## 🚀 Getting Started

### 1. Access the Test Page
Navigate to: `http://localhost:3000/test_loadBalancer`

### 2. Configure Connection
1. Enter your Raspberry Pi IP address (e.g., `192.168.1.100:50051`)
2. Click "Connect" to test the connection
3. Once connected, the dashboard will populate with real-time data

### 3. Test AI Models
1. Go to the "Testing" tab
2. Select an available AI model
3. Enter a test prompt
4. Configure parameters if needed
5. Click "Run AI Test"
6. View results in the "Results" tab

### 4. Test Sensor Processing
1. In the "Testing" tab, find the "Sensor Data Testing" section
2. Enter sensor values (temperature, humidity, etc.)
3. Click "Process Sensor Data"
4. View AI analysis and recommendations

## 🔧 Integration with Real Load Balancer

Currently, the frontend uses mock data for demonstration. To connect to your actual AI Load Balancer:

### Option 1: Direct HTTP/REST Integration
If you add HTTP endpoints to your Python server:

1. Update the API routes in `/app/api/loadbalancer/*/route.ts`
2. Replace mock responses with actual HTTP calls to your server
3. Handle authentication and error cases

### Option 2: gRPC Integration (Recommended)
For direct gRPC integration:

1. Install gRPC dependencies:
```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

2. Copy your `load_balancer.proto` file to the frontend
3. Create gRPC client in the API routes
4. Update the LoadBalancerClient class in `/lib/loadbalancer-client.ts`

### Example gRPC Integration

```typescript
// app/api/grpc-proxy/health/route.ts
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'

const packageDefinition = protoLoader.loadSync('load_balancer.proto')
const proto = grpc.loadPackageDefinition(packageDefinition)

export async function POST(request: NextRequest) {
  const { server_address } = await request.json()
  
  const client = new proto.LoadBalancer(
    server_address, 
    grpc.credentials.createInsecure()
  )
  
  try {
    const response = await new Promise((resolve, reject) => {
      client.HealthCheck({}, (error, response) => {
        if (error) reject(error)
        else resolve(response)
      })
    })
    
    return NextResponse.json({ success: true, health: response })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
```

## 🎨 UI Components Used

The test page uses your existing UI components:
- Cards, Buttons, Inputs from Radix UI
- Tailwind CSS for styling
- Lucide React icons
- Sonner for toast notifications
- Tabs for organized layout

## 📱 Responsive Design

The interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices (with adapted layout)

## 🔄 Real-time Updates

- System status refreshes every 10 seconds when connected
- Real-time connection status indicators
- Live performance metrics
- Automatic error handling and reconnection

## 🧪 Testing Scenarios

### AI Model Tests
- **LLaMA Models**: Test agricultural advice and analysis
- **Computer Vision**: Test crop monitoring and detection
- **Sensor Analysis**: Test environmental data processing

### Performance Testing
- **Load Testing**: Send multiple requests simultaneously
- **Latency Testing**: Measure response times across different models
- **Failover Testing**: Test behavior when clients disconnect

## 🔒 Security Considerations

For production deployment:
- Add authentication to API routes
- Implement rate limiting
- Use HTTPS for all communications
- Validate all input data
- Add CORS configuration

## 🐛 Troubleshooting

### Connection Issues
- Verify Raspberry Pi IP address
- Check if port 50051 is open
- Ensure load balancer server is running
- Check network connectivity

### Model Not Available
- Verify models are deployed on clients
- Check client connection status
- Restart load balancer if needed

### Slow Response Times
- Check client system resources
- Monitor network latency
- Verify model deployment status

## 📊 Monitoring Integration

The test page can be extended to integrate with:
- Grafana dashboards (port 3000)
- Prometheus metrics (port 9090)
- Custom logging systems
- Performance monitoring tools

## 🚀 Future Enhancements

Potential additions:
- Model deployment interface
- Client management controls
- Advanced performance analytics
- Custom model configuration
- Batch testing capabilities
- Export test results
- Integration with your existing sensor dashboard

---

This integration provides a complete testing and monitoring interface for your AI Load Balancer system while maintaining compatibility with your existing frontend architecture.