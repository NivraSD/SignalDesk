# 🚀 Deploy Niv Backend Orchestrator to Vercel

## Prerequisites
1. Vercel account (free at vercel.com)
2. API keys ready:
   - Claude API key
   - OpenAI API key (optional)
   - Supabase service key

## Step-by-Step Deployment

### 1. Install Dependencies
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend-orchestrator
npm install
```

### 2. Install Vercel CLI
```bash
npm i -g vercel
```

### 3. Login to Vercel
```bash
vercel login
# Follow the prompts to authenticate
```

### 4. Deploy to Vercel
```bash
vercel --prod
```

When prompted:
- Set up and deploy: Y
- Which scope: Choose your account
- Link to existing project: N
- Project name: `signaldesk-orchestrator` (or press enter for default)
- Directory: `.` (current directory)
- Override settings: N

### 5. Set Environment Variables

After deployment, go to your Vercel dashboard:

1. Visit: https://vercel.com/dashboard
2. Click on your `signaldesk-orchestrator` project
3. Go to "Settings" tab
4. Click "Environment Variables" in sidebar
5. Add these variables:

```
CLAUDE_API_KEY = [your Claude API key]
OPENAI_API_KEY = [your OpenAI API key]
SUPABASE_URL = https://zskaxjtyuaqazydouifp.supabase.co
SUPABASE_SERVICE_KEY = [your Supabase service key]
```

To get your Supabase service key:
- Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/settings/api
- Copy the `service_role` key (NOT the anon key)

### 6. Redeploy with Environment Variables
```bash
vercel --prod
```

### 7. Get Your Backend URL

Your backend will be available at:
```
https://signaldesk-orchestrator.vercel.app
```

(Or whatever URL Vercel assigns - check the deployment output)

### 8. Update Frontend Environment

Create/update `/frontend/.env`:
```
REACT_APP_BACKEND_URL=https://signaldesk-orchestrator.vercel.app
```

### 9. Test the Deployment

Test directly with curl:
```bash
curl -X POST https://signaldesk-orchestrator.vercel.app/api/niv-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I need a press release for our Series A funding"}'
```

### 10. View Logs

To monitor your deployment:
1. Go to Vercel dashboard
2. Click your project
3. Click "Functions" tab
4. Click on `api/niv-chat`
5. View real-time logs

## Troubleshooting

### If deployment fails:
```bash
# Check logs
vercel logs

# Try development mode first
vercel dev
```

### If API calls fail:
1. Check environment variables are set correctly
2. Verify API keys are valid
3. Check function logs in Vercel dashboard

### CORS issues:
Already handled in vercel.json, but if issues persist:
- Verify frontend is using correct backend URL
- Check browser console for specific error

## Next Steps

Once deployed:
1. ✅ Backend orchestrator is live
2. ✅ Frontend can call it
3. ✅ Claude/OpenAI integration works
4. ✅ Database saves work

To add MCP integration:
1. Deploy each MCP server (can be separate Vercel projects)
2. Update environment variables with MCP URLs
3. MCPs will automatically be triggered based on message content

## Success Indicators

You'll know it's working when:
- `/api/niv-chat` returns AI responses
- Console shows "mcpsTriggered" array (even if empty initially)
- Artifacts are created for strategic content
- Conversations save to Supabase database