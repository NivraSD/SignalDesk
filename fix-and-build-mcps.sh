#!/bin/bash

echo "==================================="
echo "SignalDesk MCP Fix and Build Script"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/jonathanliebowitz/Desktop/SignalDesk"
MCP_DIR="$BASE_DIR/mcp-servers"

echo -e "${YELLOW}Step 1: Backing up current MCP files...${NC}"
for mcp in signaldesk-memory signaldesk-campaigns signaldesk-media; do
  if [ -f "$MCP_DIR/$mcp/src/index.ts" ]; then
    cp "$MCP_DIR/$mcp/src/index.ts" "$MCP_DIR/$mcp/src/index.ts.backup"
    echo -e "${GREEN}✓ Backed up $mcp/src/index.ts${NC}"
  fi
done

echo -e "\n${YELLOW}Step 2: Copying fixed Memory MCP...${NC}"
if [ -f "$MCP_DIR/signaldesk-memory/src/index-fixed.ts" ]; then
  cp "$MCP_DIR/signaldesk-memory/src/index-fixed.ts" "$MCP_DIR/signaldesk-memory/src/index.ts"
  echo -e "${GREEN}✓ Updated Memory MCP with fixed version${NC}"
else
  echo -e "${RED}✗ Fixed Memory MCP file not found${NC}"
fi

echo -e "\n${YELLOW}Step 3: Building MCPs...${NC}"
for mcp in signaldesk-memory signaldesk-campaigns signaldesk-media signaldesk-analytics signaldesk-content signaldesk-intelligence signaldesk-monitor signaldesk-opportunities signaldesk-relationships signaldesk-scraper; do
  echo -e "\n${YELLOW}Building $mcp...${NC}"
  cd "$MCP_DIR/$mcp"
  
  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies for $mcp..."
    npm install
  fi
  
  # Build the project
  npm run build
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully built $mcp${NC}"
  else
    echo -e "${RED}✗ Failed to build $mcp${NC}"
  fi
done

echo -e "\n${YELLOW}Step 4: Verifying builds...${NC}"
for mcp in signaldesk-memory signaldesk-campaigns signaldesk-media signaldesk-analytics signaldesk-content signaldesk-intelligence signaldesk-monitor signaldesk-opportunities signaldesk-relationships signaldesk-scraper; do
  if [ -f "$MCP_DIR/$mcp/dist/index.js" ]; then
    echo -e "${GREEN}✓ $mcp: Built successfully${NC}"
  else
    echo -e "${RED}✗ $mcp: Build output not found${NC}"
  fi
done

echo -e "\n${YELLOW}Step 5: Creating test script...${NC}"
cat > "$BASE_DIR/test-mcps.sh" << 'EOF'
#!/bin/bash

echo "Testing MCP Servers..."
echo "======================"

# Test Memory MCP
echo -e "\nTesting Memory MCP..."
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-memory/dist/index.js 2>&1 | head -20

# Test Campaigns MCP
echo -e "\nTesting Campaigns MCP..."
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-campaigns/dist/index.js 2>&1 | head -20

# Test Media MCP
echo -e "\nTesting Media MCP..."
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-media/dist/index.js 2>&1 | head -20

echo -e "\nTest complete!"
EOF

chmod +x "$BASE_DIR/test-mcps.sh"
echo -e "${GREEN}✓ Created test script at $BASE_DIR/test-mcps.sh${NC}"

echo -e "\n${GREEN}==================================="
echo "Fix and Build Complete!"
echo "===================================${NC}"
echo ""
echo "Next steps:"
echo "1. Run the SQL script in Supabase: fix-mcp-database.sql"
echo "2. Restart Claude Desktop to reload the MCP servers"
echo "3. Test the MCPs using: ./test-mcps.sh"
echo ""
echo "The MCPs should now connect to Supabase with the correct schema."