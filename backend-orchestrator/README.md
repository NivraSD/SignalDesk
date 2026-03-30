# SignalDesk Backend Orchestrator

This is the backend orchestration service for Niv AI PR Strategist with full MCP integration.

## Architecture

```
Frontend → Vercel Backend → Claude/OpenAI APIs
                         → MCP Servers
                         → Supabase Database
```

## Features

- ✅ Real AI responses from Claude/OpenAI
- ✅ MCP orchestration and coordination
- ✅ Automatic artifact creation
- ✅ Database persistence
- ✅ Intelligent MCP triggering
- ✅ Fallback handling

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your actual keys
```

3. **Get your API keys**:
- Claude API: https://console.anthropic.com/account/keys
- OpenAI API: https://platform.openai.com/api-keys
- Supabase Service Key: Dashboard → Settings → API → service_role key

4. **Test locally**:
```bash
npm run dev
# Server runs at http://localhost:3000
```

5. **Deploy to Vercel**:
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
```

## API Endpoints

### POST /api/niv-chat
Main orchestration endpoint for Niv chat.

**Request body**:
```json
{
  "message": "I need a press release for our Series A funding",
  "messages": [], // Previous conversation history
  "sessionId": "session-123",
  "userId": "user-456",
  "organizationId": "org-789"
}
```

**Response**:
```json
{
  "response": "Full AI response with MCP insights",
  "chatMessage": "Brief message for chat UI",
  "shouldSave": true,
  "artifact": {
    "id": "artifact_123",
    "type": "press-release",
    "title": "Press Release: Series A Funding",
    "content": "Full press release content"
  },
  "mcpsTriggered": ["narratives", "social"],
  "mcpInsights": {
    "narratives": { "insight": "..." },
    "social": { "insight": "..." }
  }
}
```

## MCP Integration

The orchestrator automatically detects which MCPs to trigger based on message content:

- **Crisis MCP**: crisis, emergency, urgent, scandal
- **Social MCP**: social media, viral, trending, influencer
- **Narratives MCP**: narrative, story, messaging, framing
- **Stakeholder MCP**: stakeholder, investor, employee, coalition
- **Regulatory MCP**: regulation, compliance, legal, policy

## Frontend Integration

Update your frontend service to use the deployed backend:

```javascript
// In supabaseApiService.js or similar
async callNivChat({ message, messages = [] }) {
  const response = await fetch('https://your-app.vercel.app/api/niv-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      messages,
      sessionId: this.sessionId,
      userId: this.userId,
    })
  });
  
  return response.json();
}
```

## Monitoring

View logs in Vercel dashboard:
- Go to: https://vercel.com/dashboard
- Select your project
- Click "Functions" tab
- View real-time logs

## Troubleshooting

1. **CORS errors**: Already configured in vercel.json
2. **Timeout errors**: Function timeout set to 30 seconds
3. **API key errors**: Verify keys in Vercel environment variables
4. **MCP connection errors**: MCPs will gracefully fail and continue

## Next Steps

1. Deploy MCP servers (can be separate Vercel projects or other services)
2. Update MCP_*_URL environment variables with deployed URLs
3. Test full orchestration flow
4. Monitor and optimize based on usage