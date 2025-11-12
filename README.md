# Frontend - Smart AI Load Balancer

The frontend provides a web interface for interacting with the distributed AI system.

## 🌐 Technology Stack

- **Next.js 14** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Styling
- **React Hooks** - State management

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

Or with pnpm:
```bash
pnpm install
```

### 2. Start Development Server
```bash
npm run dev
```

Or with pnpm:
```bash
pnpm dev
```

### 3. Access the Application
Open your browser to:
```
http://localhost:3000/smart-loadbalancer
```

## 📁 Project Structure

```
front_v2/
├── app/
│   ├── api/smart-loadbalancer/          # API routes
│   │   ├── query/route.ts               # Query endpoint
│   │   ├── status/route.ts              # Status endpoint
│   │   ├── chat/sessions/route.ts       # Chat endpoints
│   │   └── rag/                         # RAG endpoints
│   │       ├── documents/route.ts
│   │       └── search/route.ts
│   │
│   ├── smart-loadbalancer/              # Main UI
│   │   └── page.tsx                     # UI component
│   │
│   └── smart-loadbalancer-v4/           # Enhanced UI
│       └── page.tsx                     # V4 UI component
│
├── lib/
│   └── smart-loadbalancer-client.ts     # TypeScript API client
│
├── package.json                         # Dependencies
└── README.md                            # This file
```

## 🎯 Features

### Main Interface (`/smart-loadbalancer`)
- **Connection Status** - Shows server and client connectivity
- **Query Input** - Send prompts to the distributed AI system
- **Response Display** - View AI-generated responses
- **Client Information** - See connected clients and their models
- **Real-time Updates** - Status updates every 10 seconds

### Enhanced Interface (`/smart-loadbalancer-v4`)
- All main features plus:
- **Chat History** - Session-based conversations
- **RAG Support** - Document upload and retrieval
- **Multimodal Input** - Image support (if enabled)

## 📡 API Routes

### Query Processing
**Endpoint:** `POST /api/smart-loadbalancer/query`

**Request:**
```json
{
  "prompt": "What is artificial intelligence?",
  "session_id": "optional-session-id",
  "use_rag": false,
  "images": []
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI-generated response...",
  "session_id": "session-123",
  "metadata": {
    "context_used": ["RAG context", "Chat history"],
    "images_received": 0,
    "rag_enabled": false
  }
}
```

### Status Check
**Endpoint:** `POST /api/smart-loadbalancer/status`

**Request:**
```json
{
  "serverAddress": "localhost:5001"
}
```

**Response:**
```json
{
  "success": true,
  "status": {
    "total_clients": 2,
    "active_clients": 2,
    "available_models": ["llama3.2:1b", "llama3.2:3b"],
    "healthy": true
  }
}
```

### Chat Sessions
**List Sessions:** `GET /api/smart-loadbalancer/chat/sessions?limit=50`

**Create Session:** `POST /api/smart-loadbalancer/chat/sessions`
```json
{
  "title": "New Chat"
}
```

**Get Session:** `GET /api/smart-loadbalancer/chat/sessions/{id}`

**Delete Session:** `DELETE /api/smart-loadbalancer/chat/sessions/{id}`

### RAG Operations
**Add Document:** `POST /api/smart-loadbalancer/rag/documents`
```json
{
  "content": "Document content...",
  "title": "Document Title",
  "metadata": {}
}
```

**Search Documents:** `POST /api/smart-loadbalancer/rag/search`
```json
{
  "query": "search query",
  "top_k": 3
}
```

**Delete Document:** `DELETE /api/smart-loadbalancer/rag/documents/{id}`

## 🔧 Configuration

### Server Address
Default: `localhost:5001`

To change, update in the UI or modify:
```typescript
// lib/smart-loadbalancer-client.ts
const config = {
  serverAddress: 'localhost:5001'
}
```

### Timeouts
- Query timeout: 60 seconds
- Status check timeout: 10 seconds

Adjust in `lib/smart-loadbalancer-client.ts`:
```typescript
const config = {
  timeout: 60000  // milliseconds
}
```

## 🎨 UI Components

### Connection Status
Shows:
- ✅ Connected / ❌ Disconnected
- Number of active clients
- Available models

### Query Interface
- Text input for prompts
- Send button
- Loading indicator
- Response display

### Client Information
- Client ID
- Assigned model
- Performance score
- Last seen timestamp

## 🐛 Troubleshooting

### Can't Connect to Server
**Check HTTP wrapper is running:**
```bash
curl http://localhost:5001/health
```

**Expected response:**
```json
{
  "healthy": true,
  "connected_clients": 1
}
```

**If fails:**
- Ensure HTTP wrapper is running on port 5001
- Check firewall settings
- Verify server address in UI

### No Response from Query
**Possible causes:**
1. No clients connected to server
2. Server not running
3. Network timeout
4. Client processing error

**Check status:**
- Click "Connect" button
- View client count
- Check browser console for errors

### CORS Errors
The HTTP wrapper has CORS enabled for all origins in development.

For production, update `server/smart_load_balancer_http_wrapper_v4.py`:
```python
CORS(app, origins=['https://yourdomain.com'])
```

### Slow Responses
AI processing can take 10-30 seconds depending on:
- Model size (1B faster than 8B)
- Client hardware
- Query complexity
- Number of clients

## 📊 Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

## 🔐 Security Notes

**Development Mode:**
- No authentication
- CORS enabled for all origins
- HTTP (not HTTPS)

**For Production:**
- Add authentication (NextAuth.js)
- Restrict CORS origins
- Enable HTTPS
- Add rate limiting
- Validate all inputs
- Sanitize outputs

## 💡 Usage Tips

### Best Practices
1. **Clear Prompts** - Be specific in your queries
2. **Wait for Response** - AI processing takes time
3. **Check Status** - Ensure clients are connected
4. **Use Chat History** - For context-aware conversations
5. **Monitor Performance** - Watch response times

### Example Queries
```
"Explain quantum computing in simple terms"
"Write a Python function to sort a list"
"What are the benefits of fog computing?"
"Summarize the key points about AI ethics"
```

### Chat Sessions
1. Create a new session for each topic
2. Previous messages provide context
3. Delete old sessions to clean up
4. Update session titles for organization

### RAG Usage
1. Upload relevant documents first
2. Enable RAG in query options
3. System will search and use context
4. Better for domain-specific queries

## 🎓 Advanced Features

### TypeScript Client Library
Use the client library in your own components:

```typescript
import { SmartLoadBalancerClient } from '@/lib/smart-loadbalancer-client'

const client = new SmartLoadBalancerClient({
  serverAddress: 'localhost:5001'
})

// Send query
const response = await client.query('Your prompt here')

// Get status
const status = await client.getStatus()

// Create chat session
const session = await client.createChatSession('My Chat')
```

### Custom Components
Create your own UI using the API routes:

```typescript
// In your component
const response = await fetch('/api/smart-loadbalancer/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Your prompt' })
})

const data = await response.json()
```

### Styling
The UI uses Tailwind CSS. Customize in:
- `app/smart-loadbalancer/page.tsx`
- `tailwind.config.js`

## 📝 Environment Variables

Create `.env.local` for custom configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_TIMEOUT=60000
```

Access in code:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Static Export
```bash
npm run build
# Deploy the 'out' directory
```

## 📞 Support

For issues:
1. Check browser console for errors
2. Verify server is running
3. Check network connectivity
4. Review API responses
5. Check server logs

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Status shows "Connected"
- ✅ Client count is > 0
- ✅ Queries return responses
- ✅ No errors in console
- ✅ Response time is reasonable
