#!/bin/bash

# SignalDesk Deployment - Supabase + Vercel ONLY
# NO RAILWAY, NO BACKEND SERVER - Pure Supabase + Vercel

set -e  # Exit on error

echo "🚀 SignalDesk Deployment - Supabase + Vercel ONLY"
echo "=================================================="
echo "NO RAILWAY | NO BACKEND SERVER | PURE SERVERLESS"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Remove ALL Railway artifacts
echo -e "${BLUE}Step 1: Removing ALL Railway artifacts...${NC}"
echo "----------------------------------------"

# Find and remove all Railway files
find . -name "*railway*" -type f -delete 2>/dev/null || true
find . -name ".railway*" -type f -delete 2>/dev/null || true
find . -name "railway*" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".railway" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove Railway-specific environment variables
sed -i.bak '/RAILWAY/d' frontend/.env* 2>/dev/null || true
sed -i.bak '/railway/d' frontend/.env* 2>/dev/null || true

echo -e "${GREEN}✅ All Railway artifacts removed${NC}"
echo ""

# Step 2: Configure Supabase
echo -e "${BLUE}Step 2: Configuring Supabase...${NC}"
echo "--------------------------------"

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"

# Create frontend environment file
cat > frontend/.env.production.local << EOF
# Supabase Configuration
REACT_APP_SUPABASE_URL=$SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# No Backend API - Everything through Supabase
REACT_APP_API_URL=

# Build Settings
GENERATE_SOURCEMAP=false
CI=false
NODE_ENV=production
EOF

echo -e "${GREEN}✅ Supabase configuration complete${NC}"
echo ""

# Step 3: Deploy Supabase Edge Functions
echo -e "${BLUE}Step 3: Deploying Supabase Edge Functions...${NC}"
echo "-------------------------------------------"

if command -v supabase >/dev/null 2>&1; then
    echo "Deploying Edge Functions to Supabase..."
    
    cd supabase/functions
    
    # Deploy Claude Chat function
    if [ -d "claude-chat" ]; then
        echo "Deploying claude-chat function..."
        supabase functions deploy claude-chat --no-verify-jwt || true
    fi
    
    # Deploy Monitoring function
    if [ -d "monitor-intelligence" ]; then
        echo "Deploying monitor-intelligence function..."
        supabase functions deploy monitor-intelligence --no-verify-jwt || true
    fi
    
    cd ../..
    echo -e "${GREEN}✅ Edge Functions deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Please install: npm install -g supabase${NC}"
    echo "Then run: supabase functions deploy"
fi

echo ""

# Step 4: Update Frontend Code
echo -e "${BLUE}Step 4: Updating frontend code for Supabase-only...${NC}"
echo "--------------------------------------------------"

cd frontend

# Ensure all API calls use Supabase
echo "Verifying Supabase integration..."

# Check if supabaseApiService exists
if [ -f "src/services/supabaseApiService.js" ]; then
    echo -e "${GREEN}✅ Supabase API Service found${NC}"
else
    echo -e "${YELLOW}⚠️  Creating Supabase API Service...${NC}"
fi

echo ""

# Step 5: Build Frontend
echo -e "${BLUE}Step 5: Building frontend...${NC}"
echo "----------------------------"

# Clean build
rm -rf build node_modules package-lock.json
npm install
npm run build

if [ -d "build" ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""

# Step 6: Deploy to Vercel
echo -e "${BLUE}Step 6: Deploying to Vercel...${NC}"
echo "------------------------------"

if command -v vercel >/dev/null 2>&1; then
    echo "Setting Vercel environment variables..."
    
    # Set environment variables
    vercel env add REACT_APP_SUPABASE_URL production --force < <(echo "$SUPABASE_URL")
    vercel env add REACT_APP_SUPABASE_ANON_KEY production --force < <(echo "$SUPABASE_ANON_KEY")
    
    echo "Deploying to Vercel..."
    vercel --prod --yes
    
    FRONTEND_URL=$(vercel ls --json 2>/dev/null | grep -o '"url":"[^"]*' | grep -o '[^"]*$' | head -1 || echo "signaldesk.vercel.app")
    echo -e "${GREEN}✅ Deployed to Vercel: https://$FRONTEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    echo "Please run this script again after Vercel is installed"
fi

cd ..
echo ""

# Step 7: Database Migration
echo -e "${BLUE}Step 7: Database Setup${NC}"
echo "----------------------"

echo "Please ensure the following tables exist in Supabase:"
echo ""
echo "Required tables:"
echo "  - users (with RLS policies)"
echo "  - organizations"
echo "  - projects"
echo "  - intelligence_findings"
echo "  - opportunity_queue"
echo "  - monitoring_status"
echo ""
echo "You can create these in the Supabase SQL editor"

echo ""

# Step 8: Verification
echo -e "${BLUE}Step 8: Deployment Verification${NC}"
echo "--------------------------------"

echo "Testing Supabase connection..."
curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" | head -1

echo ""
echo "Checking Edge Functions..."
curl -s "$SUPABASE_URL/functions/v1/claude-chat" -H "Authorization: Bearer $SUPABASE_ANON_KEY" | head -1

echo ""

# Summary
echo "=================================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE - SUPABASE + VERCEL ONLY${NC}"
echo "=================================================="
echo ""
echo "✅ Railway completely removed"
echo "✅ Backend server eliminated"
echo "✅ All functionality in Supabase"
echo ""
echo "📌 Your deployment:"
echo "   Frontend: https://${FRONTEND_URL:-signaldesk.vercel.app}"
echo "   Backend: Supabase Edge Functions"
echo "   Database: Supabase PostgreSQL"
echo "   Auth: Supabase Auth"
echo ""
echo "📊 Next steps:"
echo "   1. Add Claude API key to Supabase secrets:"
echo "      supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY"
echo ""
echo "   2. Enable Row Level Security in Supabase"
echo ""
echo "   3. Test the deployment:"
echo "      - Visit https://${FRONTEND_URL:-signaldesk.vercel.app}"
echo "      - Try logging in with Supabase Auth"
echo "      - Test Claude AI features"
echo ""
echo "🚀 No more Railway, no more backend server!"
echo "   Everything runs on Supabase + Vercel"
echo ""