#!/bin/bash

# Deploy Supabase Edge Functions with Proper Configuration
# This script deploys all Edge Functions to your Supabase project

echo "🚀 Deploying Supabase Edge Functions"
echo "====================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Installing..."
    brew install supabase/tap/supabase
fi

# Navigate to frontend directory where supabase functions are located
cd frontend

# Check if we're logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "📝 Please login to Supabase:"
    supabase login
fi

# Link to the project if not already linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "🔗 Linking to your Supabase project..."
    echo "Your project ref is: zskaxjtyuaqazydouifp"
    supabase link --project-ref zskaxjtyuaqazydouifp
fi

# Set the Anthropic API key as a secret (you'll be prompted to enter it)
echo ""
echo "🔑 Setting up secrets for Edge Functions..."
echo "You'll need to enter your Anthropic API key when prompted:"
echo "(Get it from: https://console.anthropic.com/settings/keys)"
echo ""

# Check if secret already exists
if supabase secrets list | grep -q "ANTHROPIC_API_KEY"; then
    echo "✅ ANTHROPIC_API_KEY secret already exists"
else
    echo "Please enter your Anthropic API key:"
    read -s ANTHROPIC_KEY
    echo "$ANTHROPIC_KEY" | supabase secrets set ANTHROPIC_API_KEY
    echo "✅ Secret set successfully"
fi

# Deploy each function
echo ""
echo "📦 Deploying Edge Functions..."

FUNCTIONS=("claude-chat" "claude-integration" "monitor-intelligence" "niv-chat")

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo "  → Deploying $func..."
        supabase functions deploy $func --no-verify-jwt
        if [ $? -eq 0 ]; then
            echo "    ✅ $func deployed successfully"
        else
            echo "    ❌ Failed to deploy $func"
        fi
    else
        echo "  ⚠️  Function $func not found, skipping..."
    fi
done

echo ""
echo "🔍 Verifying deployments..."
supabase functions list

echo ""
echo "📋 Testing Edge Functions..."
echo "You can test your functions with:"
echo ""
echo "curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-chat \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\": \"Hello, Claude!\"}'

echo ""
echo "✨ Edge Functions deployment complete!"
echo ""
echo "⚠️  Important Notes:"
echo "1. Functions are deployed with --no-verify-jwt for easier testing"
echo "2. For production, remove this flag and implement proper auth"
echo "3. Monitor function logs at: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions"