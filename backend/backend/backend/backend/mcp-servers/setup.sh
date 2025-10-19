#!/bin/bash

# SignalDesk MCP Servers Setup Script

echo "🚀 Setting up SignalDesk MCP Servers..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites checked"

# Install dependencies for each server
echo -e "${YELLOW}Installing dependencies for MCP servers...${NC}"

servers=("signaldesk-memory" "signaldesk-campaigns" "signaldesk-media")

for server in "${servers[@]}"; do
    echo -e "${GREEN}Setting up $server...${NC}"
    cd "$server" || exit
    
    # Install dependencies
    npm install
    
    # Build TypeScript
    npm run build
    
    cd ..
done

echo -e "${GREEN}✅ All MCP servers set up successfully!${NC}"

# Create database tables if needed
echo -e "${YELLOW}Creating database tables...${NC}"

cat << 'EOF' > init-mcp-tables.sql
-- MemoryVault tables
CREATE TABLE IF NOT EXISTS memoryvault_items (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign tables
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    objectives JSONB,
    start_date DATE,
    end_date DATE,
    target_audience TEXT,
    budget DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_tasks (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    assignee VARCHAR(255),
    dependencies JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media/Journalist tables
CREATE TABLE IF NOT EXISTS journalists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    publication VARCHAR(255),
    beat VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    twitter VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_lists (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    topic TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_outreach (
    id SERIAL PRIMARY KEY,
    journalist_id VARCHAR(255),
    user_id VARCHAR(255),
    status VARCHAR(50),
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(journalist_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memoryvault_user ON memoryvault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_category ON memoryvault_items(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_journalists_beat ON journalists(beat);
CREATE INDEX IF NOT EXISTS idx_journalists_publication ON journalists(publication);
EOF

echo -e "${GREEN}Database tables SQL generated in init-mcp-tables.sql${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Update the DATABASE_URL in claude-desktop-config.json with your actual database connection"
echo "2. Run the SQL script: psql -U postgres -d signaldesk -f init-mcp-tables.sql"
echo "3. Copy the mcpServers config to your Claude Desktop config:"
echo "   - Mac: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "   - Windows: %APPDATA%/Claude/claude_desktop_config.json"
echo "4. Restart Claude Desktop"
echo ""
echo "🎉 Setup complete!"