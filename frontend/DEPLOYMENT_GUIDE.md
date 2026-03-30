# SignalDesk Edge Functions Deployment Guide

## Overview

This guide will help you deploy both the `niv-chat` and `strategic-planning` Edge Functions to your Supabase project. These functions are now completely separate and won't interfere with each other.

## Prerequisites

1. **Supabase CLI installed**: 
   ```bash
   npm install -g supabase
   ```

2. **Supabase account with project**: Your project ID is `zskaxjtyuaqazydouifp`

3. **Anthropic API Key**: You'll need a valid Claude API key

4. **Login to Supabase CLI**:
   ```bash
   supabase login
   ```

## Quick Deployment

### Option 1: Use the Deployment Script

1. **Make the script executable** (if not already):
   ```bash
   chmod +x deploy-functions.sh
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy-functions.sh
   ```

3. **Set your environment variables** (replace with actual keys):
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=your_actual_anthropic_api_key
   supabase secrets set SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
   supabase secrets set SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

### Option 2: Manual Deployment

1. **Link to your project**:
   ```bash
   supabase link --project-ref zskaxjtyuaqazydouifp
   ```

2. **Deploy niv-chat function**:
   ```bash
   supabase functions deploy niv-chat
   ```

3. **Deploy strategic-planning function**:
   ```bash
   supabase functions deploy strategic-planning
   ```

4. **Set environment variables** (same as above)

## Function Endpoints

After successful deployment, your functions will be available at:

### Niv Chat Function
- **URL**: `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-chat`
- **Method**: POST
- **Payload**:
  ```json
  {
    "message": "Your message to Niv",
    "mode": "chat|analysis|opportunity|campaign",
    "conversationId": "optional-conversation-id",
    "context": {}
  }
  ```

### Strategic Planning Function
- **Base URL**: `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/strategic-planning`

#### Generate Plan
- **Endpoint**: `/generate-plan`
- **Method**: POST
- **Payload**:
  ```json
  {
    "objective": "Your strategic objective",
    "context": "Additional context (optional)",
    "constraints": "Any constraints (optional)",
    "timeline": "Timeline for completion (optional)"
  }
  ```

#### Execute Campaign
- **Endpoint**: `/execute-campaign`
- **Method**: POST
- **Payload**:
  ```json
  {
    "planId": "plan-id-from-generate-plan",
    "pillarIndex": 0,
    "executionType": "full"
  }
  ```

#### Gather Evidence
- **Endpoint**: `/gather-evidence`
- **Method**: POST
- **Payload**:
  ```json
  {
    "topic": "Topic to research",
    "sources": ["market", "competitors", "trends"]
  }
  ```

#### Update Plan
- **Endpoint**: `/update-plan/{planId}`
- **Method**: PUT
- **Payload**: Plan updates object

#### Get Plan Status
- **Endpoint**: `/plan-status/{planId}`
- **Method**: GET

## Testing the Functions

1. **Open the test page**: Open `test-functions.html` in your browser
2. **Test each function**: Use the interactive forms to test both functions
3. **Verify responses**: Check that both functions return expected responses

## Environment Variables Required

Make sure to set these secrets in Supabase:

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Claude API key | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes |

## Verifying Deployment

1. **Check function status**:
   ```bash
   supabase functions list
   ```

2. **View function logs**:
   ```bash
   supabase functions logs niv-chat
   supabase functions logs strategic-planning
   ```

3. **Test with curl**:
   ```bash
   # Test niv-chat
   curl -X POST \
     'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-chat' \
     -H 'Content-Type: application/json' \
     -d '{"message": "Hello Niv", "mode": "chat"}'

   # Test strategic-planning
   curl -X POST \
     'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/strategic-planning/generate-plan' \
     -H 'Content-Type: application/json' \
     -d '{"objective": "Test objective"}'
   ```

## Troubleshooting

### Common Issues

1. **Function not found**: Make sure you're using the correct project reference and function names

2. **Environment variables not set**: Run the `supabase secrets set` commands with your actual keys

3. **CORS errors**: The functions include CORS headers, but make sure your frontend domain is allowed

4. **Anthropic API errors**: Verify your API key is valid and has sufficient credits

### Getting Help

1. **View function logs**: `supabase functions logs <function-name>`
2. **Check project status**: `supabase projects list`
3. **Verify secrets**: `supabase secrets list`

## Next Steps

1. **Update your frontend**: Make sure your frontend code points to the new separate endpoints
2. **Monitor usage**: Keep an eye on function invocations and performance
3. **Scale as needed**: Supabase Edge Functions auto-scale, but monitor for any issues

## Rollback Plan

If you need to rollback:

1. **Revert git changes**: The original functions are preserved in git history
2. **Redeploy previous version**: Use git to checkout previous versions and redeploy
3. **Environment variables**: Previous environment variables remain unchanged

The restoration is complete! Niv is back to working as intended, and Strategic Planning is now a separate, dedicated function.