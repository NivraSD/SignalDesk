#!/bin/bash

# SignalDesk Frontend - Vercel Deployment Script
# This script deploys the frontend to Vercel with Supabase-only configuration

echo "🚀 SignalDesk Frontend Deployment to Vercel"
echo "==========================================="
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in frontend directory. Please run from /frontend"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "✅ Pre-deployment checks:"
echo ""

# Check for Railway references in source
RAILWAY_REFS=$(grep -r "railway" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "\/\/" | wc -l)
if [ $RAILWAY_REFS -gt 0 ]; then
    echo "⚠️  Warning: Found $RAILWAY_REFS potential Railway references in source code"
    echo "   Run: grep -r 'railway' src/ to check"
else
    echo "✅ No Railway references found in source code"
fi

# Check environment files
if [ -f ".env.production" ]; then
    echo "✅ .env.production file exists"
else
    echo "⚠️  Warning: .env.production file not found"
fi

if [ -f "vercel.json" ]; then
    echo "✅ vercel.json configuration exists"
else
    echo "❌ Error: vercel.json not found"
    exit 1
fi

echo ""
echo "🔨 Building application locally to verify..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Check build for Railway references
BUILD_RAILWAY_REFS=$(grep -r "railway" build/ 2>/dev/null | wc -l)
if [ $BUILD_RAILWAY_REFS -gt 0 ]; then
    echo "⚠️  Warning: Found $BUILD_RAILWAY_REFS Railway references in build output"
else
    echo "✅ No Railway references in build output"
fi

echo ""
echo "📊 Build Statistics:"
du -sh build/
echo ""

echo "Ready to deploy to Vercel!"
echo ""
echo "Choose deployment option:"
echo "1) Deploy to preview (staging)"
echo "2) Deploy to production"
echo "3) Cancel"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🚀 Deploying to preview environment..."
        vercel
        ;;
    2)
        echo "🚀 Deploying to production..."
        vercel --prod
        ;;
    3)
        echo "❌ Deployment cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Post-deployment checklist:"
echo "1. Check the deployment URL"
echo "2. Test login with Supabase authentication"
echo "3. Verify all routes work correctly"
echo "4. Check browser console for errors"
echo "5. Test key features (UnifiedPlatform, etc.)"
echo ""
echo "If you encounter issues, check:"
echo "- Vercel dashboard for build logs"
echo "- Environment variables in Vercel project settings"
echo "- Browser network tab for failed API calls"