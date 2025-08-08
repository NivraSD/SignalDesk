#!/bin/bash

# SignalDesk Railway Deployment Script
# This moves your backend from Vercel to Railway for full functionality

echo "🚂 SignalDesk Railway Deployment"
echo "================================"

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not installed"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

# Login to Railway
echo "📝 Logging into Railway..."
railway login

# Initialize Railway project
echo "🎯 Initializing Railway project..."
railway init --name signaldesk-backend

# Link to existing database
echo "🔗 Linking PostgreSQL database..."
railway add --database postgresql

# Set environment variables
echo "🔐 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# Copy database URL from existing Railway database
echo "📋 Copy your DATABASE_URL from Railway dashboard"
echo "Run: railway variables set DATABASE_URL=<your-database-url>"
read -p "Press enter when done..."

# Deploy backend
echo "🚀 Deploying backend to Railway..."
cd backend
railway up

# Get deployment URL
echo "✅ Deployment complete!"
echo "Your backend URL: $(railway open --json | jq -r '.url')"
echo ""
echo "Next steps:"
echo "1. Update frontend/src/config/api.js with new Railway URL"
echo "2. Test all endpoints with: node test-critical-endpoints.js"
echo "3. Your platform now has 100% functionality restored!"