# UPDATE VERCEL ENVIRONMENT VARIABLES NOW

## Go to Vercel Dashboard
https://vercel.com/dashboard

Find your SignalDesk project → Settings → Environment Variables

## UPDATE These Variables:

```
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co

REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8
```

## After Updating:
1. Click "Save" for each variable
2. Go to Deployments tab
3. Click the three dots on the latest deployment
4. Select "Redeploy"
5. ✅ Check "Use existing Build Cache" should be UNCHECKED to force fresh build

## What's Working:
- ✅ Supabase Edge Functions (already using new keys)
- ✅ Anthropic API (working)
- ✅ All backend services
- ❌ Frontend (waiting for Vercel env update)

## Quick Deploy Command (after updating env vars):
You can also trigger from command line if you have Vercel CLI:
```bash
vercel --prod --force
```