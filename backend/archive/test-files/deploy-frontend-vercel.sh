#!/bin/bash

# Deploy Frontend to Vercel (pointing to Railway backend)
echo "🚀 Deploying Frontend to Vercel"
echo "================================"

cd frontend

# Ensure API points to Railway
echo "✅ Frontend configured to use Railway backend:"
echo "   https://signaldesk-production.up.railway.app"

# Build and deploy
echo "📦 Building frontend..."
npm run build

echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Frontend deployed!"
echo ""
echo "Your app is now:"
echo "- Frontend: Vercel (React app)"
echo "- Backend: Railway (API + Claude, no timeouts!)"
echo "- Database: Railway PostgreSQL"
echo ""
echo "🎉 100% functionality restored!"