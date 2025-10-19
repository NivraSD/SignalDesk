#!/bin/bash

# SignalDesk Frontend Deployment Script for Vercel
# This script ensures proper configuration and deployment

echo "================================================"
echo "SignalDesk Frontend Deployment to Vercel"
echo "================================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Display current configuration
echo "📋 Current Configuration:"
echo "   Backend API: https://signaldesk-production.up.railway.app/api"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/
rm -rf .vercel/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Run: vercel --prod"
echo "2. When prompted:"
echo "   - Set up and deploy: Y"
echo "   - Select scope: Your account"
echo "   - Link to existing project: N (first time) or Y (subsequent deploys)"
echo "   - Project name: signaldesk-frontend"
echo "   - Directory: ./"
echo "   - Override settings: N"
echo ""
echo "3. After deployment, go to Vercel Dashboard:"
echo "   https://vercel.com/dashboard"
echo ""
echo "4. Navigate to your project settings"
echo "5. Go to 'Environment Variables' section"
echo "6. Add these variables (if not already set):"
echo "   - REACT_APP_API_URL = https://signaldesk-production.up.railway.app/api"
echo "   - Any Claude API keys or other secrets"
echo ""
echo "7. Redeploy if you added new environment variables"
echo ""
echo "================================================"
echo "Manual deployment command:"
echo "vercel --prod"
echo "================================================"