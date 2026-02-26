# Deploying Supabase Edge Functions for SignalDesk

## Prerequisites

1. **Install Supabase CLI** (if not already installed):
```bash
brew install supabase/tap/supabase
```

2. **Login to Supabase**:
```bash
supabase login
```
This will open your browser to authenticate.

## Step 1: Link Your Project

```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
supabase link --project-ref zskaxjtyuaqazydouifp
```

When prompted, enter your database password (if you have one set).

## Step 2: Set Your Anthropic API Key

You need to set your Anthropic API key as a secret in Supabase:

```bash
supabase secrets set ANTHROPIC_API_KEY=your-actual-anthropic-api-key-here
```

Replace `your-actual-anthropic-api-key-here` with your real Anthropic API key.

## Step 3: Deploy the Edge Functions

Deploy both functions:

```bash
# Deploy Claude Chat function
supabase functions deploy claude-chat

# Deploy Monitoring Intelligence function  
supabase functions deploy monitor-intelligence
```

## Step 4: Run Database Migrations

Create the monitoring_config table:

```bash
supabase db push --file supabase/migrations/002_monitoring_config.sql
```

## Step 5: Verify Deployment

Test if the functions are working:

```bash
# Test Claude function
curl -L -X POST 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-chat' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0' \
  -H 'Content-Type: application/json' \
  --data '{"prompt":"Hello Claude, are you working?"}'

# Test Monitoring function
curl -L -X POST 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-intelligence' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0' \
  -H 'Content-Type: application/json' \
  --data '{"action":"getStatus","organizationId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'
```

## Alternative: Quick Deploy Script

I've created a script to do all of this automatically:

```bash
chmod +x deploy-supabase-functions.sh
./deploy-supabase-functions.sh
```

## Troubleshooting

### If you get "Project not linked" error:
```bash
supabase init
supabase link --project-ref zskaxjtyuaqazydouifp
```

### If you get authentication errors:
```bash
supabase login
```

### If you don't have your Anthropic API key:
1. Go to https://console.anthropic.com/
2. Navigate to API Keys
3. Create a new key or copy an existing one
4. Use it in the `supabase secrets set` command

### To view function logs:
```bash
supabase functions logs claude-chat
supabase functions logs monitor-intelligence
```

## Success Indicators

When successfully deployed, you should see:
- ✅ "Function deployed successfully" messages
- ✅ The test curls return JSON responses
- ✅ Claude responds to prompts
- ✅ Monitoring status returns properly

Your SignalDesk platform will now have:
- Working Claude AI integration
- Active monitoring service
- Real-time intelligence gathering
- Proper authentication flow