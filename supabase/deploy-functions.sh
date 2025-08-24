#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys all Edge Functions to your Supabase project

echo "🚀 Deploying Supabase Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Set your project ID
PROJECT_ID="zskaxjtyuaqazydouifp"

# Login to Supabase (if not already logged in)
echo "📝 Logging in to Supabase..."
supabase login

# Link to your project
echo "🔗 Linking to project: $PROJECT_ID"
supabase link --project-ref $PROJECT_ID

# Deploy claude-chat function
echo "🤖 Deploying claude-chat function..."
supabase functions deploy claude-chat \
  --no-verify-jwt

# Deploy monitor-intelligence function  
echo "📊 Deploying monitor-intelligence function..."
supabase functions deploy monitor-intelligence \
  --no-verify-jwt

# Deploy niv-chat function
echo "💬 Deploying niv-chat function..."
supabase functions deploy niv-chat \
  --no-verify-jwt

# Set environment secrets
echo "🔐 Setting environment secrets..."
echo "Please enter your Anthropic API key:"
read -s ANTHROPIC_API_KEY
supabase secrets set ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# Optional: Set MCP server URL if you have one
echo "Do you have an MCP server URL? (y/n)"
read HAS_MCP
if [ "$HAS_MCP" = "y" ]; then
    echo "Enter your MCP server URL:"
    read MCP_SERVER_URL
    supabase secrets set MCP_SERVER_URL=$MCP_SERVER_URL
    supabase secrets set USE_MCP=true
fi

echo "✅ Edge Functions deployed successfully!"
echo ""
echo "Function URLs:"
echo "  - Claude Chat: https://$PROJECT_ID.supabase.co/functions/v1/claude-chat"
echo "  - Monitor Intelligence: https://$PROJECT_ID.supabase.co/functions/v1/monitor-intelligence" 
echo "  - Niv Chat: https://$PROJECT_ID.supabase.co/functions/v1/niv-chat"
echo ""
echo "To test the functions, you can use the test script: ./test-functions.sh"