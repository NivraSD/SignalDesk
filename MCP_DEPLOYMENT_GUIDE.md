# SignalDesk MCP Deployment Guide

## Overview
This guide explains how to deploy your MCP servers so they work with your deployed Vercel platform.

## Three Deployment Options

### Option 1: Deploy MCPs to Vercel (Recommended for Production)

This is the simplest and most reliable approach for production.

```bash
# Deploy each MCP to Vercel
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers

# Deploy priority MCPs
cd signaldesk-opportunities && vercel --prod && cd ..
cd signaldesk-orchestrator && vercel --prod && cd ..
cd signaldesk-intelligence && vercel --prod && cd ..
cd signaldesk-media && vercel --prod && cd ..
```

**Pros:**
- No tunneling needed
- Always available
- Automatic scaling
- Vercel handles HTTPS

**Cons:**
- Each MCP needs its own Vercel project
- Harder to debug locally

**URLs will be:**
- `https://signaldesk-opportunities-[your-username].vercel.app`
- `https://signaldesk-orchestrator-[your-username].vercel.app`
- etc.

### Option 2: Local MCPs with Tunneling (Best for Development)

Run MCPs locally and expose them via tunnel.

#### Step 1: Install Dependencies
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers
npm install express cors
```

#### Step 2: Install a Tunnel Service
```bash
# Option A: ngrok (most reliable)
brew install ngrok
ngrok config add-authtoken YOUR_TOKEN  # Get token from ngrok.com

# Option B: localtunnel (free, no signup)
npm install -g localtunnel

# Option C: Cloudflare Tunnel
brew install cloudflare/cloudflare/cloudflared
```

#### Step 3: Start Local MCP Servers
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers
node run-local-mcps.js
```

#### Step 4: Start Tunnels
```bash
# In a new terminal
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers
./setup-tunnel.sh
```

#### Step 5: Update Supabase Edge Function
Copy the tunnel URLs and update your mcp-bridge Edge Function:

```bash
supabase secrets set MCP_OPPORTUNITIES_URL=https://abc123.ngrok.io
supabase secrets set MCP_ORCHESTRATOR_URL=https://def456.ngrok.io
# ... etc

# Redeploy the Edge Function
supabase functions deploy mcp-bridge
```

**Pros:**
- Easy local debugging
- Quick iteration
- No Vercel deployment needed

**Cons:**
- Tunnel must stay running
- URLs change on restart (unless using paid ngrok)

### Option 3: Hybrid Approach (Recommended)

Deploy critical MCPs to Vercel, run others locally with tunnels as needed.

```bash
# Deploy critical MCPs to Vercel
cd signaldesk-opportunities && vercel --prod && cd ..
cd signaldesk-orchestrator && vercel --prod && cd ..

# Run others locally when needed
node run-local-mcps.js
```

## Testing MCP Connectivity

### 1. Test Direct MCP Access
```bash
# Test a deployed MCP
curl https://signaldesk-opportunities-[username].vercel.app/api \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"method": "discover", "params": {"industry": "tech"}}'
```

### 2. Test via mcp-bridge
```bash
# Test through Supabase Edge Function
curl https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-bridge \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "server": "opportunities",
    "method": "discover",
    "params": {"industry": "tech"},
    "organizationId": "test-org"
  }'
```

### 3. Test from Frontend
Open your deployed frontend and check the Network tab when using features that call MCPs.

## Environment Variable Configuration

### For Vercel MCPs
Each MCP deployed to Vercel needs these environment variables:

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add DATABASE_URL  # If using direct database access
```

### For Supabase Edge Function
Update mcp-bridge environment variables:

```bash
# List current secrets
supabase secrets list

# Set MCP URLs (use your actual deployed URLs)
supabase secrets set MCP_OPPORTUNITIES_URL=https://signaldesk-opportunities-nivra-sd.vercel.app
supabase secrets set MCP_ORCHESTRATOR_URL=https://signaldesk-orchestrator-nivra-sd.vercel.app
# ... etc for each MCP

# Deploy the updated function
supabase functions deploy mcp-bridge
```

## Quick Start Commands

### Deploy All MCPs to Vercel (One-Time Setup)
```bash
#!/bin/bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers

for mcp in signaldesk-*/; do
  if [ -f "$mcp/vercel.json" ]; then
    echo "Deploying $mcp..."
    cd "$mcp"
    vercel --prod --yes
    cd ..
  fi
done
```

### Run Local MCPs with Tunnels (Development)
```bash
# Terminal 1: Start MCP servers
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers
node run-local-mcps.js

# Terminal 2: Start ngrok tunnel
ngrok http 3010 --region us

# Copy the https URL and update Supabase
```

## Troubleshooting

### MCP Not Responding
1. Check if the MCP is deployed: `curl https://[mcp-url]/api`
2. Check Vercel logs: `vercel logs [project-name]`
3. Check Supabase Edge Function logs: `supabase functions logs mcp-bridge`

### CORS Errors
- MCPs already have CORS headers configured
- Check browser console for specific error
- Ensure Edge Function has proper CORS headers

### Tunnel Connection Issues
- Ensure tunnel is still running
- Check if URL has changed (free ngrok changes URLs)
- Update Supabase secrets with new URL

## Current Status

Based on your setup:
- **Frontend**: Deployed at `https://signaldesk.vercel.app` ✅
- **Backend**: Deployed at `https://backend-orchestrator.vercel.app` ✅
- **Edge Functions**: Deployed on Supabase ✅
- **MCPs**: Ready to deploy (choose your approach above)

## Next Steps

1. **Choose your deployment approach** (Vercel, Local+Tunnel, or Hybrid)
2. **Deploy or start your MCPs** using the commands above
3. **Update mcp-bridge environment variables** with your MCP URLs
4. **Test the connection** from your frontend
5. **Monitor logs** to ensure everything is working

## Important URLs to Remember

- **Supabase Dashboard**: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Frontend**: https://signaldesk.vercel.app
- **Backend API**: https://backend-orchestrator.vercel.app
- **Edge Functions**: https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/

---

*Last Updated: August 19, 2025*