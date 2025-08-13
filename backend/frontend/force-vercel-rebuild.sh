#!/bin/bash

# Force Vercel to rebuild with correct API URL
# This script will clear cache and trigger a clean deployment

echo "==============================================="
echo "🚀 FORCING VERCEL REBUILD WITH CORRECT API URL"
echo "==============================================="
echo ""
echo "CORRECT Backend URL: https://signaldesk-production.up.railway.app"
echo "WRONG URL to remove: https://signaldesk-api-production.up.railway.app"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "📝 Step 1: Remove any old builds locally"
rm -rf build/
rm -rf .vercel/
rm -rf node_modules/.cache/

echo ""
echo "📝 Step 2: Install dependencies fresh"
npm ci

echo ""
echo "📝 Step 3: Build locally to test"
REACT_APP_API_URL=https://signaldesk-production.up.railway.app/api npm run build

echo ""
echo "📝 Step 4: Check the build for wrong URLs"
echo "Searching for wrong URL in build..."
if grep -r "signaldesk-api-production" build/ 2>/dev/null; then
    echo "❌ ERROR: Wrong URL found in build! The build still contains the incorrect URL."
    echo "This means Vercel environment variables are overriding our config."
    echo ""
    echo "MANUAL FIX REQUIRED:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > Environment Variables"
    echo "4. Find REACT_APP_API_URL"
    echo "5. Change it from: https://signaldesk-api-production.up.railway.app/api"
    echo "6. Change it to: https://signaldesk-production.up.railway.app/api"
    echo "7. Click Save"
    echo "8. Redeploy from Vercel dashboard"
else
    echo "✅ Build looks good - no wrong URLs found"
fi

echo ""
echo "📝 Step 5: Deploy to Vercel"
echo "Deploying with correct environment variable..."
REACT_APP_API_URL=https://signaldesk-production.up.railway.app/api vercel --prod

echo ""
echo "==============================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "==============================================="
echo ""
echo "IMPORTANT: If the wrong URL still appears:"
echo ""
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Select your project: frontend-p0rvzi1f9-nivra-sd"
echo "3. Go to: Settings > Environment Variables"
echo "4. Look for REACT_APP_API_URL"
echo "5. If it exists and has the wrong URL, update it to:"
echo "   https://signaldesk-production.up.railway.app/api"
echo "6. Click 'Save'"
echo "7. Go to Deployments tab"
echo "8. Click the three dots on the latest deployment"
echo "9. Click 'Redeploy'"
echo "10. Check 'Use existing build cache' is UNCHECKED"
echo "11. Click 'Redeploy'"
echo ""
echo "Alternative: Use Vercel CLI to set env var:"
echo "vercel env rm REACT_APP_API_URL production"
echo "vercel env add REACT_APP_API_URL production"
echo "Then enter: https://signaldesk-production.up.railway.app/api"
echo ""