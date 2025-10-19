# URGENT: Update Vercel Environment Variables

## The Problem
The Supabase project keys were regenerated (possibly by accident), breaking all authentication and API calls.

## What You Need to Do

1. Go to: https://vercel.com/nivra-sd/signaldesk/settings/environment-variables
   (or find your project in Vercel dashboard → Settings → Environment Variables)

2. Update these environment variables:

```
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8
```

3. After updating, redeploy from Vercel dashboard or push any small change to trigger rebuild.

## Current Status
- ✅ Supabase Edge Functions: Working with new keys
- ✅ Anthropic API: Working  
- ❌ Frontend on Vercel: Still using OLD keys
- ❌ Authentication: Will fail until Vercel env vars are updated

## The Original Issue
Before the previous agent's intervention, you just had a cached build issue. The agent somehow triggered a key regeneration in Supabase while trying to "fix" things, breaking everything.