#!/bin/bash

# Fix Placeholder MCPs with Real Implementations
# This script copies real implementations over placeholder MCPs

echo "🔧 Fixing Placeholder MCPs"
echo "======================================="

# Define source and destination
SOURCE_DIR="/Users/jonathanliebowitz/Desktop/signaldesk/supabase/functions"
DEST_DIR="/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions"

# Ensure destination directory exists
mkdir -p "$DEST_DIR"

# Copy real implementations to v3
echo ""
echo "📦 Copying Real MCP Implementations..."

# 1. Copy opportunity-orchestrator to mcp-opportunities
echo "✓ Fixing mcp-opportunities..."
mkdir -p "$DEST_DIR/mcp-opportunities"
cp "$SOURCE_DIR/opportunity-orchestrator/index.ts" "$DEST_DIR/mcp-opportunities/index.ts"

# 2. Copy all other real MCPs
REAL_MCPS=(
  "mcp-discovery"
  "mcp-executive-synthesis"
  "mcp-intelligence"
  "mcp-media"
  "mcp-orchestrator"
  "mcp-monitor"
  "mcp-analytics"
  "mcp-scraper"
  "mcp-bridge"
)

for MCP in "${REAL_MCPS[@]}"; do
  echo "✓ Copying $MCP..."
  mkdir -p "$DEST_DIR/$MCP"
  cp -r "$SOURCE_DIR/$MCP/"* "$DEST_DIR/$MCP/" 2>/dev/null || true
done

echo ""
echo "📋 Status Report:"
echo "======================================="

# Check file sizes to verify
echo ""
echo "Real MCPs (should be >5KB):"
for MCP in "${REAL_MCPS[@]}"; do
  if [ -f "$DEST_DIR/$MCP/index.ts" ]; then
    SIZE=$(ls -lh "$DEST_DIR/$MCP/index.ts" | awk '{print $5}')
    echo "  ✓ $MCP: $SIZE"
  else
    echo "  ✗ $MCP: MISSING"
  fi
done

echo ""
echo "Fixed MCPs:"
if [ -f "$DEST_DIR/mcp-opportunities/index.ts" ]; then
  SIZE=$(ls -lh "$DEST_DIR/mcp-opportunities/index.ts" | awk '{print $5}')
  echo "  ✓ mcp-opportunities: $SIZE (was placeholder)"
fi

echo ""
echo "======================================="
echo "✅ Files prepared in: $DEST_DIR"
echo ""
echo "To deploy to Supabase, run:"
echo ""
echo "cd /Users/jonathanliebowitz/Desktop/signaldesk-v3"
echo ""
echo "# Deploy individual MCPs:"
echo "npx supabase functions deploy mcp-opportunities"
echo "npx supabase functions deploy mcp-discovery"
echo "npx supabase functions deploy mcp-intelligence"
echo "# etc..."
echo ""
echo "# Or deploy all at once:"
echo "for MCP in mcp-*; do"
echo "  npx supabase functions deploy \"\$MCP\""
echo "done"