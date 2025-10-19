# Fix Edge Functions Deployment

## Current Issues

### 1. API Key Mismatch
- Test HTML was using old/expired Supabase anon key
- **Fixed**: Updated to use correct key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8`

### 2. Missing Environment Variables in Supabase
The Edge Functions need these environment variables set in Supabase:
- `ANTHROPIC_API_KEY` - Required for Claude synthesis
- `OPENAI_API_KEY` - Optional, for OpenAI fallback

## How to Fix

### Option 1: Set Environment Variables via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project (zskaxjtyuaqazydouifp)
3. Go to Settings → Edge Functions
4. Add secrets:
   ```
   ANTHROPIC_API_KEY=your_actual_anthropic_key
   ```

### Option 2: Set via Supabase CLI
```bash
# Install Supabase CLI if not installed
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref zskaxjtyuaqazydouifp

# Set the secret
supabase secrets set ANTHROPIC_API_KEY=your_actual_anthropic_key

# Deploy the functions
supabase functions deploy ai-industry-expansion
supabase functions deploy claude-intelligence-synthesizer-v2
```

### Option 3: Use Vercel Edge Functions Instead
Since the frontend is deployed on Vercel, you could:
1. Move the Edge Functions to Vercel's API routes
2. Set environment variables in Vercel dashboard
3. Update frontend to call Vercel endpoints instead of Supabase

## Testing After Fix

### Test AI Industry Expansion (Already Working)
```bash
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/ai-industry-expansion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8" \
  -d '{"name":"Toyota Motor Corporation","website":"https://www.toyota.com","description":"Global automotive manufacturer"}'
```

### Test Claude Synthesis (Needs Fix)
```bash
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-intelligence-synthesizer-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8" \
  -d '{"intelligence_type":"competitor","organization":{"name":"Toyota","industry":"automotive"},"goals":{},"mcp_data":{},"timeframe":"24h"}'
```

## What's Working Now

### ✅ Frontend Services
- `organizationProfileService.js` - Builds and caches profiles with localStorage persistence
- `tabIntelligenceService.js` - Generates differentiated tab content
- `claudeIntelligenceServiceV2.js` - Orchestrates the complete flow

### ✅ AI Industry Expansion
- Correctly identifies Toyota as automotive
- Correctly identifies KARV as PR/communications
- Returns industry-appropriate competitors and keywords

### ❌ Claude Synthesis (Needs Anthropic Key)
- Times out because ANTHROPIC_API_KEY is not set in Supabase
- Will work once environment variable is configured

## Memory Persistence Fix

The memory system now uses consistent keys:
- Profile key: `signaldesk_profile_${organization.name.toLowerCase().replace(/\s+/g, '_')}`
- Memory key: `signaldesk_memory_${organization.name.toLowerCase().replace(/\s+/g, '_')}`

This ensures profiles and memories persist across sessions even without database IDs.

## Next Steps

1. **Set ANTHROPIC_API_KEY in Supabase** (required for Claude synthesis)
2. **Deploy database schema** (optional but recommended)
   ```bash
   ./deploy-profile-schema.sh
   ```
3. **Test complete flow** using `test-profile-system-fixed.html`