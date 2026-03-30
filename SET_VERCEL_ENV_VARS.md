# 🔐 Set Environment Variables for Backend Orchestrator

## Your Backend is DEPLOYED! 🎉

URL: https://backend-orchestrator-97qony2kc-nivra-sd.vercel.app

## Now Set Environment Variables:

### 1. Go to Vercel Dashboard
Open: https://vercel.com/nivra-sd/backend-orchestrator/settings/environment-variables

### 2. Add These Variables:

Click "Add New" for each:

#### CLAUDE_API_KEY
- Key: `CLAUDE_API_KEY`
- Value: Your Claude API key from https://console.anthropic.com/account/keys
- Environment: Production, Preview, Development

#### OPENAI_API_KEY (Optional)
- Key: `OPENAI_API_KEY`  
- Value: Your OpenAI key from https://platform.openai.com/api-keys
- Environment: Production, Preview, Development

#### SUPABASE_URL
- Key: `SUPABASE_URL`
- Value: `https://zskaxjtyuaqazydouifp.supabase.co`
- Environment: Production, Preview, Development

#### SUPABASE_SERVICE_KEY
- Key: `SUPABASE_SERVICE_KEY`
- Value: Get from https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/settings/api
- Copy the `service_role` key (the long one, NOT anon)
- Environment: Production, Preview, Development

### 3. Save All Variables
Click "Save" after adding each one

### 4. Redeploy to Apply Variables
After adding all variables, redeploy:
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend-orchestrator
vercel --prod --yes
```

Or in Vercel dashboard, click "Redeploy" button

### 5. Update Frontend to Use Backend

Create/edit `/Users/jonathanliebowitz/Desktop/SignalDesk/frontend/.env`:
```
REACT_APP_BACKEND_URL=https://backend-orchestrator-97qony2kc-nivra-sd.vercel.app
```

Then restart your frontend:
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
npm start
```

### 6. Test It!

Test the backend directly:
```bash
curl -X POST https://backend-orchestrator-97qony2kc-nivra-sd.vercel.app/api/niv-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I need a press release for our Series A funding"}'
```

You should get an AI response (or error about missing API key if not set yet).

## What's Working Now:

✅ Backend deployed to Vercel  
✅ Proper orchestration architecture  
✅ Ready for Claude/OpenAI integration  
✅ MCP trigger detection built in  
✅ Database saving configured  

## Next Steps:

1. Set the environment variables above
2. Frontend will automatically use the backend
3. MCPs can be deployed separately later
4. Everything orchestrates through this backend

## Monitoring:

View logs at: https://vercel.com/nivra-sd/backend-orchestrator/functions

This is your REAL Niv system - not a workaround!