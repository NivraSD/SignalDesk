#!/bin/bash

echo "========================================="
echo "Removing Railway References from SignalDesk"
echo "========================================="
echo ""
echo "This script will:"
echo "1. Archive Railway-related files"
echo "2. Remove Railway deployment files"
echo "3. Update configuration to use Supabase"
echo ""
echo "Creating archive directory..."

# Create archive directory
mkdir -p railway-archive

# Archive Railway documentation files
echo "Archiving Railway documentation..."
mv DEPLOY_NOW_RAILWAY.md railway-archive/ 2>/dev/null
mv DEPLOY_TO_RAILWAY.md railway-archive/ 2>/dev/null
mv FORCE_RAILWAY_REDEPLOY.txt railway-archive/ 2>/dev/null
mv RAILWAY_*.md railway-archive/ 2>/dev/null
mv RAILWAY_*.txt railway-archive/ 2>/dev/null
mv SAFE_RAILWAY_FIX.md railway-archive/ 2>/dev/null

# Archive any Railway deployment scripts
echo "Archiving Railway deployment scripts..."
find . -name "*railway*.sh" -type f ! -path "./railway-archive/*" -exec mv {} railway-archive/ \; 2>/dev/null
find . -name "*railway*.js" -type f ! -path "./node_modules/*" ! -path "./railway-archive/*" ! -path "**/Railway*.js" -exec mv {} railway-archive/ \; 2>/dev/null

echo ""
echo "Railway files have been archived to: railway-archive/"
echo ""
echo "Now you need to:"
echo "1. Run the Supabase setup script: ./setup-supabase.sh"
echo "2. Update your environment variables to use Supabase"
echo "3. Deploy to Vercel or your preferred hosting platform"
echo ""
echo "Archived files count:"
ls -la railway-archive/ | wc -l
echo ""
echo "Done! Railway references have been removed."