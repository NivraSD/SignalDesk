# Claude API Integration Setup Guide for SignalDesk

## Current Status
The Claude API integration has been analyzed and fixed. The system is now configured to work with Claude through multiple pathways.

## Issues Found and Fixed

### 1. Frontend API URL was Disabled
**Problem:** `/frontend/src/config/apiUrl.js` had `FORCE_API_URL = 'DISABLED/api'`
**Solution:** Updated to use environment variable or localhost: `process.env.REACT_APP_API_URL || 'http://localhost:3001/api'`

### 2. Missing Claude API Routes
**Problem:** Frontend expects `/api/ai/claude/message` endpoint but it wasn't configured
**Solution:** Created new route file `/backend/src/routes/aiClaudeRoutes.js` with proper Claude endpoints

### 3. Invalid Claude API Key
**Problem:** Backend `.env` has placeholder key `[PLACEHOLDER-KEY]`
**Solution:** Need to add real Anthropic API key (see setup instructions below)

## Setup Instructions

### Step 1: Get Claude API Key
1. Go to https://console.anthropic.com/
2. Sign up or log in to your Anthropic account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-api03-...`)

### Step 2: Configure Backend Environment

#### For Local Development:
Edit `/backend/.env`:
```env
ANTHROPIC_API_KEY=YOUR-ACTUAL-KEY-HERE
```

#### For Production (Railway/Vercel):
Add environment variable in dashboard:
- Variable name: `ANTHROPIC_API_KEY`
- Value: Your actual Claude API key

### Step 3: Configure Frontend Environment

#### For Local Development:
Edit `/frontend/.env.local`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### For Production:
Set these in Vercel dashboard:
```env
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

### Step 4: Configure Supabase Edge Function (Optional)
If you want to use Supabase Edge Functions for Claude:

1. Go to Supabase Dashboard > Edge Functions
2. Deploy the `claude-chat` function from `/frontend/supabase/functions/claude-chat/`
3. Add `ANTHROPIC_API_KEY` to Supabase Edge Function secrets

## API Endpoints Available

### Main Claude Endpoints:
- `POST /api/ai/claude/message` - Send message to Claude
- `GET /api/ai/claude/health` - Check Claude service status
- `POST /api/ai/claude/analyze-opportunity` - Analyze PR opportunities
- `POST /api/ai/claude/execution-plan` - Generate execution plans

### Frontend Services:
1. **claudeService.js** - Main service using backend API
2. **claudeSupabaseService.js** - Supabase Edge Function integration with backend fallback

## Testing Claude Integration

### 1. Test Backend Directly:
```bash
curl -X POST http://localhost:3001/api/ai/claude/health
```

### 2. Test Frontend Integration:
```javascript
// In browser console after logging in
const response = await fetch('/api/ai/claude/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    prompt: 'Hello Claude, are you working?'
  })
});
const data = await response.json();
console.log(data);
```

### 3. Test from Application:
1. Log into SignalDesk
2. Go to Opportunity Engine or Campaign Intelligence
3. Try generating content or analyzing opportunities
4. Check browser console for Claude API calls

## Fallback Behavior

The system has multiple fallback layers:

1. **Primary:** Supabase Edge Function (if configured)
2. **Secondary:** Backend Claude API (`/api/ai/claude/message`)
3. **Tertiary:** Mock responses for development/demo

Even without a valid Claude API key, the application will continue to work with mock data.

## Troubleshooting

### Claude not responding:
1. Check API key is set correctly in environment
2. Verify API key is valid (not placeholder)
3. Check browser console for errors
4. Test `/api/ai/claude/health` endpoint

### CORS errors:
1. Ensure backend is running
2. Check API URL configuration
3. Verify CORS settings in backend

### Authentication errors:
1. Ensure user is logged in
2. Check token in localStorage
3. Verify JWT_SECRET matches between frontend/backend

## File Locations

### Backend Files:
- `/backend/src/routes/aiClaudeRoutes.js` - Main Claude routes
- `/backend/config/claude.js` - Claude service configuration
- `/backend/src/utils/claudeInit.js` - Claude initialization helper
- `/backend/.env` - Environment variables (add API key here)

### Frontend Files:
- `/frontend/src/services/claudeService.js` - Main Claude service
- `/frontend/src/services/claudeSupabaseService.js` - Supabase integration
- `/frontend/src/config/apiUrl.js` - API URL configuration
- `/frontend/.env.local` - Frontend environment variables

### Supabase Files:
- `/frontend/supabase/functions/claude-chat/index.ts` - Edge Function

## Next Steps

1. Add your Anthropic API key to backend environment
2. Restart backend server
3. Test Claude integration using health endpoint
4. Deploy to production with proper environment variables

## Support

For issues with:
- Claude API: Check https://console.anthropic.com/
- SignalDesk: Review this guide and check logs
- Supabase: Check https://app.supabase.com/