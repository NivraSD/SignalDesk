#!/bin/bash

# SignalDesk Edge Functions Deployment Script
# This script deploys both niv-chat and strategic-planning functions to Supabase

set -e

echo "🚀 Starting SignalDesk Edge Functions deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
echo "🔐 Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first:"
    echo "supabase login"
    exit 1
fi

echo "✅ Supabase CLI is ready"

# Link to the correct project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref zskaxjtyuaqazydouifp

# Deploy niv-chat function
echo "📡 Deploying niv-chat function..."
supabase functions deploy niv-chat

# Deploy strategic-planning function
echo "📊 Deploying strategic-planning function..."
supabase functions deploy strategic-planning

# Set environment variables (you'll need to run this manually with your actual keys)
echo "🔑 Setting up environment variables..."
echo "Please run the following commands with your actual API keys:"
echo ""
echo "supabase secrets set ANTHROPIC_API_KEY=your_actual_anthropic_api_key"
echo "supabase secrets set SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co"
echo "supabase secrets set SUPABASE_ANON_KEY=your_actual_supabase_anon_key"
echo "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key"
echo ""

echo "🎉 Deployment completed successfully!"
echo ""
echo "Your Edge Functions are now available at:"
echo "• niv-chat: https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-chat"
echo "• strategic-planning: https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/strategic-planning"
echo ""
echo "Next steps:"
echo "1. Set your environment variables using the commands above"
echo "2. Test both functions to ensure they're working"
echo "3. Update your frontend to use the correct endpoints"