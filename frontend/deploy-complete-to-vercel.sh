#!/bin/bash

echo "🚀 SignalDesk Complete Deployment Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in frontend directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 2: Setting up environment variables...${NC}"
cat > .env.production << 'EOF'
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0
REACT_APP_API_URL=
REACT_APP_ENABLE_CLAUDE=true
REACT_APP_ENABLE_MONITORING=true
EOF

echo -e "${GREEN}✓ Environment variables configured${NC}"

echo -e "${YELLOW}Step 3: Building production bundle...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed! Please fix errors and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

echo -e "${YELLOW}Step 4: Deploying to Vercel...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

# Deploy to Vercel
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Deploy Supabase Edge Functions:"
    echo "   supabase functions deploy claude-chat"
    echo "   supabase functions deploy monitor-intelligence"
    echo ""
    echo "2. Set Anthropic API key in Supabase:"
    echo "   supabase secrets set ANTHROPIC_API_KEY=your-key-here"
    echo ""
    echo "3. Run database migrations:"
    echo "   supabase db push"
    echo ""
    echo "Your app should now be live with:"
    echo "✓ Claude AI integration"
    echo "✓ Monitoring service"
    echo "✓ All latest features"
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi