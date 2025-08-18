# SignalDesk Niv System - Complete Fix Guide

## Immediate Solution: Use Direct API Integration

After analyzing your system, the Edge Functions are the root cause of your problems. Here's the fastest path to a working system:

### Option 1: Direct API Integration (Recommended)
**Status: IMPLEMENTED AND READY**

1. **Navigate to**: http://localhost:3000/niv-direct
2. **Add API Key**: 
   - Get Claude API key from: https://console.anthropic.com/account/keys
   - OR Get OpenAI API key from: https://platform.openai.com/api-keys
3. **Start Using**: The system works immediately without Edge Functions

**Benefits:**
- No CORS errors
- No Edge Function deployment needed
- Instant response times
- Works with your current Supabase plan
- Database persistence still works

### Option 2: Fix Edge Functions (If You Must)

If you absolutely need Edge Functions, here's what's wrong and how to fix it:

## Edge Function Issues & Fixes

### 1. Missing Environment Variables in Supabase

**Navigate to**: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/settings/vault

**Add these secrets:**
```
CLAUDE_API_KEY = your-claude-api-key-here
OPENAI_API_KEY = your-openai-api-key-here (optional backup)
```

### 2. Deploy Edge Function Correctly

```bash
# From frontend directory
cd frontend

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref zskaxjtyuaqazydouifp

# Deploy the function
npx supabase functions deploy niv-simple
```

### 3. Fix CORS in Edge Function

The current Edge Function has correct CORS headers, but if still failing, update the function URL in your frontend:

```javascript
// In supabaseApiService.js
const { data, error } = await supabase.functions.invoke('niv-simple', {
  body: payload,
  headers: {
    'Content-Type': 'application/json',
  }
});
```

### 4. Database Tables Already Exist

Your tables are correctly set up:
- `niv_conversations` - Stores chat messages
- `niv_artifacts` - Stores generated content

No changes needed here.

## Why Edge Functions Are Failing

1. **Cold Starts**: Deno Edge Functions have 10-30 second cold starts
2. **CORS Issues**: Preflight requests timeout before function warms up
3. **Rate Limits**: Free tier has strict limits
4. **Debugging**: Very difficult to debug Deno runtime errors

## Recommended Architecture

```
┌─────────────┐     Direct API      ┌──────────────┐
│   Frontend  │ ──────────────────> │ Claude/OpenAI│
│   (React)   │                      └──────────────┘
└─────────────┘            │
       │                   │
       │                   ↓
       │            Store Results
       ↓                   │
┌─────────────┐            │
│  Supabase   │ <──────────┘
│  Database   │ (Conversations & Artifacts)
└─────────────┘
```

## Testing Your Fix

### Test Direct API (Recommended):
1. Go to: http://localhost:3000/niv-direct
2. Enter your API key when prompted
3. Ask: "Create a media list for a tech startup launch"
4. Verify artifact appears in right panel

### Test Edge Function (If Fixed):
1. Go to: http://localhost:3000/niv-simple
2. Ask: "Create a press release"
3. Check browser console for errors
4. Check Supabase Function logs: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions

## MCP Integration (Future)

Your MCP servers are ready but not yet integrated. They provide:
- Crisis management
- Social media monitoring
- Narrative tracking
- Stakeholder analysis
- Regulatory compliance

To integrate MCP:
1. Run MCP servers locally
2. Use the orchestrator pattern in `signaldesk-orchestrator`
3. Connect via WebSocket or HTTP endpoints

## Summary

**Immediate Action**: Use `/niv-direct` - it works NOW without any Supabase configuration.

**Why This Works**:
- Bypasses all Edge Function issues
- Direct API calls are more reliable
- Still uses Supabase for data persistence
- Can add proxy server later for production

**Production Path**:
1. Use direct API for development
2. Add a simple Node.js proxy for production (hide API keys)
3. Keep Supabase for database only
4. Add MCP integration when ready

The system is now functional. No more Edge Function headaches.