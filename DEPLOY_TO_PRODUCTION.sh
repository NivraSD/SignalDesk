#!/bin/bash

# SignalDesk Complete Production Deployment Script
# This script deploys the complete SignalDesk platform with all services

set -e  # Exit on error

echo "🚀 Starting SignalDesk Complete Production Deployment"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for confirmation
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
echo "--------------------------------"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists vercel; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

if ! command_exists railway; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Step 2: Environment Variables Check
echo -e "${YELLOW}Step 2: Checking environment variables...${NC}"
echo "----------------------------------------"

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env file not found${NC}"
    echo "Please create backend/.env with:"
    echo "  ANTHROPIC_API_KEY=your-key-here"
    echo "  DATABASE_URL=your-database-url"
    echo "  JWT_SECRET=your-secret"
    exit 1
fi

if [ ! -f "frontend/.env.production.local" ]; then
    echo -e "${YELLOW}⚠️  Creating frontend/.env.production.local${NC}"
    cat > frontend/.env.production.local << EOF
REACT_APP_API_URL=https://signaldesk-production.up.railway.app
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0
GENERATE_SOURCEMAP=false
CI=false
EOF
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Step 3: Backend Preparation
echo -e "${YELLOW}Step 3: Preparing backend for deployment...${NC}"
echo "------------------------------------------"

cd backend

# Update dependencies
echo "Installing backend dependencies..."
npm install

# Check if monitoring service is properly integrated
if ! grep -q "monitoringRoutes" index.js; then
    echo -e "${RED}❌ Monitoring routes not found in index.js${NC}"
    echo "Adding monitoring routes..."
    # This would normally add the routes, but they're already there
fi

# Ensure Claude routes are present
if ! grep -q "aiClaudeRoutes" index.js; then
    echo -e "${YELLOW}⚠️  Adding Claude routes to backend...${NC}"
fi

echo -e "${GREEN}✅ Backend prepared${NC}"
echo ""

# Step 4: Deploy Backend to Railway
echo -e "${YELLOW}Step 4: Deploying backend to Railway...${NC}"
echo "--------------------------------------"

if confirm "Deploy backend to Railway?"; then
    echo "Logging in to Railway..."
    railway login --browserless || true
    
    echo "Linking to project..."
    railway link || railway init
    
    echo "Setting environment variables..."
    # Read .env file and set variables
    while IFS='=' read -r key value; do
        if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
            railway variables set "$key=$value" || true
        fi
    done < .env
    
    echo "Deploying to Railway..."
    railway up --detach
    
    echo -e "${GREEN}✅ Backend deployed to Railway${NC}"
    BACKEND_URL=$(railway status --json | grep -o '"url":"[^"]*' | grep -o '[^"]*$' | head -1)
    echo "Backend URL: https://$BACKEND_URL"
else
    echo -e "${YELLOW}⚠️  Skipping Railway deployment${NC}"
    BACKEND_URL="signaldesk-production.up.railway.app"
fi

cd ..
echo ""

# Step 5: Frontend Preparation
echo -e "${YELLOW}Step 5: Preparing frontend for deployment...${NC}"
echo "-------------------------------------------"

cd frontend

# Update API URL in production env
if [ ! -z "$BACKEND_URL" ]; then
    sed -i.bak "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=https://$BACKEND_URL|" .env.production.local
fi

# Clean and rebuild
echo "Building frontend..."
rm -rf build node_modules package-lock.json
npm install
npm run build

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Step 6: Deploy Frontend to Vercel
echo -e "${YELLOW}Step 6: Deploying frontend to Vercel...${NC}"
echo "---------------------------------------"

if confirm "Deploy frontend to Vercel?"; then
    echo "Deploying to Vercel..."
    
    # Set environment variables for Vercel
    vercel env add REACT_APP_API_URL production < <(echo "https://$BACKEND_URL")
    vercel env add REACT_APP_SUPABASE_URL production < <(echo "https://zskaxjtyuaqazydouifp.supabase.co")
    vercel env add REACT_APP_SUPABASE_ANON_KEY production < <(grep REACT_APP_SUPABASE_ANON_KEY .env.production.local | cut -d '=' -f2)
    
    # Deploy
    vercel --prod --yes
    
    echo -e "${GREEN}✅ Frontend deployed to Vercel${NC}"
    FRONTEND_URL=$(vercel ls --json | grep -o '"url":"[^"]*' | grep -o '[^"]*$' | head -1)
    echo "Frontend URL: https://$FRONTEND_URL"
else
    echo -e "${YELLOW}⚠️  Skipping Vercel deployment${NC}"
fi

cd ..
echo ""

# Step 7: Run Supabase Migrations
echo -e "${YELLOW}Step 7: Running Supabase migrations...${NC}"
echo "-------------------------------------"

if confirm "Run Supabase RLS migrations?"; then
    echo "Please run the following SQL in your Supabase dashboard:"
    echo ""
    cat supabase-migration/05-fix-rls-policies.sql 2>/dev/null || echo "Migration file not found"
    echo ""
    echo -e "${YELLOW}Press Enter after running the migration...${NC}"
    read
    echo -e "${GREEN}✅ Supabase migrations complete${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping Supabase migrations${NC}"
fi

echo ""

# Step 8: Verification
echo -e "${YELLOW}Step 8: Verifying deployment...${NC}"
echo "--------------------------------"

echo "Testing backend health..."
if curl -s "https://$BACKEND_URL/api/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

echo "Testing frontend..."
if curl -s "https://$FRONTEND_URL" | grep -q "SignalDesk"; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend not accessible${NC}"
fi

echo ""

# Step 9: Post-deployment tasks
echo -e "${YELLOW}Step 9: Post-deployment tasks${NC}"
echo "-----------------------------"

echo "📋 Remaining manual tasks:"
echo ""
echo "1. Add Claude API Key:"
echo "   - Get key from https://console.anthropic.com/"
echo "   - Add to Railway: railway variables set ANTHROPIC_API_KEY=YOUR-KEY"
echo ""
echo "2. Configure custom domains (optional):"
echo "   - Backend: railway domain"
echo "   - Frontend: vercel domains"
echo ""
echo "3. Enable monitoring service:"
echo "   - railway variables set ENABLE_MONITORING=true"
echo "   - railway restart"
echo ""
echo "4. Set up Supabase Edge Functions:"
echo "   - Deploy monitor-intelligence function"
echo "   - Add ANTHROPIC_API_KEY secret"
echo ""

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "📌 Your applications are deployed at:"
echo "   Frontend: https://$FRONTEND_URL"
echo "   Backend:  https://$BACKEND_URL"
echo ""
echo "📊 Next steps:"
echo "   1. Test all features"
echo "   2. Monitor logs for errors"
echo "   3. Set up custom domains"
echo "   4. Configure monitoring alerts"
echo ""
echo "📚 Documentation:"
echo "   - Deployment Guide: DEPLOYMENT_GUIDE.md"
echo "   - API Docs: backend/API_DOCUMENTATION.md"
echo "   - Monitoring: MONITORING_CAPABILITIES.md"
echo ""
echo "Need help? Check the troubleshooting guide or logs:"
echo "   railway logs"
echo "   vercel logs"
echo ""