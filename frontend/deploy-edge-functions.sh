#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys the Edge Functions to your Supabase project

echo "========================================="
echo "Supabase Edge Functions Deployment"
echo "========================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo "  or"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi

# Project configuration
PROJECT_ID="zskaxjtyuaqazydouifp"
SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"

echo ""
echo "Project: $PROJECT_ID"
echo "URL: $SUPABASE_URL"
echo ""

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    echo "Error: supabase/functions directory not found."
    echo "Please run this script from the frontend directory."
    exit 1
fi

# Login to Supabase (if not already logged in)
echo "Logging in to Supabase..."
supabase login

# Link to the project
echo ""
echo "Linking to Supabase project..."
supabase link --project-ref $PROJECT_ID

# Deploy claude-integration function
echo ""
echo "Deploying claude-integration function..."
supabase functions deploy claude-integration --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ claude-integration deployed successfully"
else
    echo "❌ Failed to deploy claude-integration"
fi

# Deploy monitor-intelligence function
echo ""
echo "Deploying monitor-intelligence function..."
supabase functions deploy monitor-intelligence --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ monitor-intelligence deployed successfully"
else
    echo "❌ Failed to deploy monitor-intelligence"
fi

# Set environment variables (you'll need to add these in Supabase dashboard)
echo ""
echo "========================================="
echo "IMPORTANT: Environment Variables"
echo "========================================="
echo ""
echo "Please set the following environment variables in your Supabase dashboard:"
echo "  1. Go to: https://app.supabase.com/project/$PROJECT_ID/settings/vault"
echo "  2. Add these secrets:"
echo "     - CLAUDE_API_KEY: Your Anthropic Claude API key"
echo "     - Any other API keys your functions need"
echo ""
echo "To set secrets via CLI:"
echo "  supabase secrets set CLAUDE_API_KEY=your-api-key-here"
echo ""

# Test the functions
echo "========================================="
echo "Testing Edge Functions"
echo "========================================="
echo ""

# Test claude-integration
echo "Testing claude-integration..."
curl -X POST "$SUPABASE_URL/functions/v1/claude-integration" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0" \
  -d '{"prompt":"test"}' \
  --max-time 5 \
  --silent \
  --show-error

if [ $? -eq 0 ]; then
    echo "✅ claude-integration is responding"
else
    echo "⚠️  claude-integration test failed (this is expected if CLAUDE_API_KEY is not set)"
fi

echo ""

# Test monitor-intelligence
echo "Testing monitor-intelligence..."
curl -X POST "$SUPABASE_URL/functions/v1/monitor-intelligence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0" \
  -d '{"organizationId":"test-org"}' \
  --max-time 5 \
  --silent \
  --show-error

if [ $? -eq 0 ]; then
    echo "✅ monitor-intelligence is responding"
else
    echo "⚠️  monitor-intelligence test failed (this is expected if tables don't exist)"
fi

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Run the SQL setup script in Supabase SQL Editor"
echo "  2. Set the required environment variables"
echo "  3. Test your application"
echo ""