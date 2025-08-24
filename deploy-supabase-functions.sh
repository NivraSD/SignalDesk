#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Installing Supabase CLI...${NC}"
    brew install supabase/tap/supabase
fi

# Link to project
echo -e "${YELLOW}Linking to Supabase project...${NC}"
supabase link --project-ref zskaxjtyuaqazydouifp

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to link project. Please run: supabase login${NC}"
    exit 1
fi

# Ask for Anthropic API key
echo ""
echo -e "${YELLOW}Enter your Anthropic API key:${NC}"
read -s ANTHROPIC_KEY
echo ""

if [ -z "$ANTHROPIC_KEY" ]; then
    echo -e "${RED}API key is required!${NC}"
    exit 1
fi

# Set the API key as secret
echo -e "${YELLOW}Setting Anthropic API key...${NC}"
supabase secrets set ANTHROPIC_API_KEY=$ANTHROPIC_KEY

# Deploy Claude function
echo -e "${YELLOW}Deploying claude-chat function...${NC}"
supabase functions deploy claude-chat

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ claude-chat deployed successfully${NC}"
else
    echo -e "${RED}Failed to deploy claude-chat${NC}"
fi

# Deploy Monitoring function
echo -e "${YELLOW}Deploying monitor-intelligence function...${NC}"
supabase functions deploy monitor-intelligence

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ monitor-intelligence deployed successfully${NC}"
else
    echo -e "${RED}Failed to deploy monitor-intelligence${NC}"
fi

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
supabase db push --file supabase/migrations/002_monitoring_config.sql

# Test the functions
echo ""
echo -e "${YELLOW}Testing deployed functions...${NC}"

# Test Claude
echo "Testing Claude..."
CLAUDE_RESPONSE=$(curl -s -L -X POST 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-chat' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0' \
  -H 'Content-Type: application/json' \
  --data '{"prompt":"Say hello"}')

if echo "$CLAUDE_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Claude is working!${NC}"
else
    echo -e "${RED}❌ Claude test failed${NC}"
    echo "Response: $CLAUDE_RESPONSE"
fi

# Test Monitoring
echo "Testing Monitoring..."
MONITOR_RESPONSE=$(curl -s -L -X POST 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-intelligence' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0' \
  -H 'Content-Type: application/json' \
  --data '{"action":"getStatus","organizationId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}')

if echo "$MONITOR_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Monitoring is working!${NC}"
else
    echo -e "${RED}❌ Monitoring test failed${NC}"
    echo "Response: $MONITOR_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Your SignalDesk platform now has:"
echo "✅ Claude AI integration via Edge Functions"
echo "✅ Monitoring service for intelligence gathering"
echo "✅ Real-time data processing"
echo ""
echo "Test your deployment at:"
echo "https://signaldesk-frontend-fk1bx89j1-nivra-sd.vercel.app"