# URGENT: Check Vercel Environment Variables

## The Issue
Your latest deployment has 401 errors because Vercel is still using the OLD Supabase keys.

## Check Your Vercel Environment Variables

Go to: https://vercel.com/nivra-sd/signaldesk/settings/environment-variables

**Make sure these are set correctly:**

```
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co

REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8
```

**OLD KEY (should NOT be in Vercel):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0
```

## After Updating
1. Save the environment variables
2. Go to Deployments tab  
3. Find the latest deployment (signaldesk-1yputw3wj-nivra-sd.vercel.app)
4. Click the three dots → "Redeploy"
5. **UNCHECK "Use existing Build Cache"**
6. Click "Redeploy"

This will rebuild with the correct keys and fix the 401 errors.