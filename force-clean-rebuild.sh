#!/bin/bash

echo "🧹 Force Clean Rebuild Script"
echo "=============================="
echo ""

# Kill any running React processes
echo "1️⃣ Stopping any running React processes..."
pkill -f "react-scripts" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Clean build artifacts
echo "2️⃣ Cleaning build artifacts..."
rm -rf build/
rm -rf node_modules/.cache/

# Clear npm cache
echo "3️⃣ Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies (just to be sure)
echo "4️⃣ Reinstalling dependencies..."
npm install --legacy-peer-deps

# Build fresh
echo "5️⃣ Building fresh production build..."
CI=false npm run build

echo ""
echo "✅ Clean rebuild complete!"
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "The browser cache may also need clearing:"
echo "  Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "  Or open Developer Tools > Network > Disable cache"