#!/bin/bash

echo "Removing console.log statements from MCP servers..."

# Function to remove console statements from a file
remove_console_logs() {
    local file=$1
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.with-logs"
    
    # Remove or comment out console.log and console.error lines
    # But keep the error handling intact
    sed -i '' '/console\.log/d' "$file"
    sed -i '' 's/console\.error/\/\/ console.error/g' "$file"
}

# Process all MCP index.ts files
for mcp_dir in /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-*/; do
    if [ -f "$mcp_dir/src/index.ts" ]; then
        remove_console_logs "$mcp_dir/src/index.ts"
    fi
done

echo "Console statements removed. Rebuilding MCPs..."

# Rebuild all MCPs
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers

for mcp in signaldesk-memory signaldesk-campaigns signaldesk-media signaldesk-analytics signaldesk-content signaldesk-intelligence signaldesk-monitor signaldesk-opportunities signaldesk-relationships signaldesk-scraper; do
    echo "Building $mcp..."
    cd "$mcp"
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ $mcp built successfully"
    else
        echo "✗ $mcp build failed"
    fi
    cd ..
done

echo ""
echo "Done! MCPs rebuilt without console output."
echo "Please restart Claude Desktop now."