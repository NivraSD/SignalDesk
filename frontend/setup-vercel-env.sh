#!/bin/bash

# Vercel Environment Setup Script for SignalDesk
# This script configures all necessary environment variables for Vercel deployment

set -e

echo "🚀 Setting up Vercel Environment Variables for SignalDesk"
echo "========================================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Link the project
echo "📎 Linking Vercel project..."
vercel link --yes

# Set Supabase environment variables
echo "🔧 Setting Supabase environment variables..."

# Core Supabase configuration
vercel env add REACT_APP_SUPABASE_URL production preview development << EOF
https://zskaxjtyuaqazydouifp.supabase.co
EOF

vercel env add REACT_APP_SUPABASE_ANON_KEY production preview development << EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0
EOF

# Build configuration
echo "🏗️ Setting build configuration..."

vercel env add CI production preview << EOF
false
EOF

vercel env add GENERATE_SOURCEMAP production << EOF
false
EOF

vercel env add NODE_OPTIONS production preview << EOF
--max-old-space-size=4096
EOF

# Build metadata
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_ID="vercel_$(date +%s)"

vercel env add REACT_APP_BUILD_TIME production preview << EOF
$BUILD_TIME
EOF

vercel env add REACT_APP_BUILD_ID production preview << EOF
$BUILD_ID
EOF

# Optional: Claude API configuration (if needed)
echo ""
echo "Do you want to configure Claude API? (y/n)"
read -r CONFIGURE_CLAUDE

if [[ $CONFIGURE_CLAUDE =~ ^[Yy]$ ]]; then
    echo "Enter your Anthropic API key:"
    read -s ANTHROPIC_API_KEY
    
    vercel env add REACT_APP_CLAUDE_API_KEY production << EOF
$ANTHROPIC_API_KEY
EOF
    
    vercel env add REACT_APP_CLAUDE_MODEL production preview << EOF
claude-3-opus-20240229
EOF
    
    echo "✅ Claude API configured"
fi

echo ""
echo "📋 Environment variables configured:"
echo ""
vercel env ls

echo ""
echo "✅ Vercel environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy Supabase Edge Functions: cd supabase && ./deploy-functions.sh"
echo "2. Deploy to Vercel: vercel --prod"
echo "3. Verify deployment: npm run verify:prod"
echo ""