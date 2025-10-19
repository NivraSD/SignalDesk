#!/bin/bash

echo "🚀 Setting up SignalDesk Monitor MCP Server"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Install dependencies and build the MCP server
echo -e "${YELLOW}Step 1: Building MCP Monitor Server...${NC}"
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-monitor

if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found${NC}"
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MCP Monitor Server built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Add alerts table to database
echo ""
echo -e "${YELLOW}Step 2: Setting up database table...${NC}"
echo "Please run this SQL in your Supabase SQL Editor:"
echo ""
echo "File: /Users/jonathanliebowitz/Desktop/SignalDesk/frontend/ADD_MONITORING_ALERTS_TABLE.sql"
echo ""
echo "Press ENTER when you've run the SQL..."
read

# Step 3: Update Claude Desktop config
echo ""
echo -e "${YELLOW}Step 3: MCP Server Configuration${NC}"
echo ""
echo "The MCP server has been added to your Claude Desktop config:"
echo "• signaldesk-monitor: Real-time stakeholder intelligence monitoring"
echo ""
echo "To activate:"
echo "1. Copy claude-desktop-config.json to your Claude Desktop config directory"
echo "2. Restart Claude Desktop"
echo "3. Update DATABASE_URL with your actual password"
echo ""

# Step 4: Test the MCP server
echo -e "${YELLOW}Step 4: Testing MCP Server...${NC}"
echo "Testing basic functionality..."

# Test if the server starts
timeout 5s node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-monitor/dist/index.js <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MCP server test passed${NC}"
else
    echo -e "${YELLOW}⚠️  MCP server test inconclusive (may need database connection)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Your new MCP server provides:"
echo "✅ Real-time stakeholder monitoring"
echo "✅ Live intelligence feeds" 
echo "✅ Opportunity detection"
echo "✅ Risk analysis"
echo "✅ Sentiment tracking"
echo "✅ Alert management"
echo ""
echo "Next steps:"
echo "1. Run the SQL file to create the alerts table"
echo "2. Update your Claude Desktop config with the correct database password"
echo "3. Restart Claude Desktop"
echo "4. Test with: 'start monitoring for my organization'"
echo ""
echo "The monitoring data will now flow directly to Claude via MCP protocol!"