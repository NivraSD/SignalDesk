#!/bin/bash

# Setup Vercel Environment Variables for Supabase Integration
# This script configures all required environment variables for successful deployment

echo "🚀 Setting up Vercel Environment Variables for Supabase Integration"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm i -g vercel
fi

# Get Supabase credentials from .env file if it exists
if [ -f "frontend/.env" ]; then
    echo "📄 Reading from frontend/.env file..."
    source frontend/.env
else
    echo "⚠️  No .env file found. You'll need to enter credentials manually."
fi

# Prompt for Supabase credentials if not found
if [ -z "$REACT_APP_SUPABASE_URL" ]; then
    echo "Enter your Supabase URL:"
    read REACT_APP_SUPABASE_URL
fi

if [ -z "$REACT_APP_SUPABASE_ANON_KEY" ]; then
    echo "Enter your Supabase Anon Key:"
    read REACT_APP_SUPABASE_ANON_KEY
fi

echo ""
echo "📝 Setting the following environment variables in Vercel:"
echo "  - REACT_APP_SUPABASE_URL"
echo "  - REACT_APP_SUPABASE_ANON_KEY"
echo ""

# Navigate to frontend directory
cd frontend

# Set environment variables for all environments (production, preview, development)
echo "Setting variables for Production..."
vercel env add REACT_APP_SUPABASE_URL production <<< "$REACT_APP_SUPABASE_URL"
vercel env add REACT_APP_SUPABASE_ANON_KEY production <<< "$REACT_APP_SUPABASE_ANON_KEY"

echo "Setting variables for Preview..."
vercel env add REACT_APP_SUPABASE_URL preview <<< "$REACT_APP_SUPABASE_URL"
vercel env add REACT_APP_SUPABASE_ANON_KEY preview <<< "$REACT_APP_SUPABASE_ANON_KEY"

echo "Setting variables for Development..."
vercel env add REACT_APP_SUPABASE_URL development <<< "$REACT_APP_SUPABASE_URL"
vercel env add REACT_APP_SUPABASE_ANON_KEY development <<< "$REACT_APP_SUPABASE_ANON_KEY"

echo ""
echo "✅ Environment variables have been set in Vercel!"
echo ""
echo "🔍 Verifying configuration..."
vercel env ls

echo ""
echo "📋 Next Steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Test the deployment with the verification script"
echo "3. Check https://vercel.com/[your-team]/[your-project]/settings/environment-variables"
echo ""
echo "✨ Setup complete!"