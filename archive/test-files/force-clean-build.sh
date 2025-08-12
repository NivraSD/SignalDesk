#!/bin/bash

echo "========================================="
echo "FORCE CLEAN BUILD FOR VERCEL DEPLOYMENT"
echo "========================================="

# Clean all caches and build artifacts
echo "1. Cleaning build artifacts..."
rm -rf build/
rm -rf node_modules/.cache/
rm -rf .next/
rm -rf .vercel/

echo "2. Clearing npm cache..."
npm cache clean --force

echo "3. Reinstalling dependencies..."
rm -rf node_modules/
rm package-lock.json
npm install

echo "4. Creating build timestamp..."
echo "{\"buildTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"forceRebuild\": true}" > public/build-info.json

echo "5. Running production build..."
npm run build

echo "========================================="
echo "Build complete! Now deploy to Vercel:"
echo "vercel --prod"
echo "========================================="