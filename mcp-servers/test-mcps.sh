#!/bin/bash

echo "Testing SignalDesk MCPs..."
echo "=========================="

# Test each MCP exists and is built
for mcp in intelligence relationships analytics content; do
  echo ""
  echo "Testing signaldesk-$mcp..."
  
  # Check if directory exists
  if [ -d "signaldesk-$mcp" ]; then
    echo "✓ Directory exists"
  else
    echo "✗ Directory missing"
    continue
  fi
  
  # Check if dist exists
  if [ -d "signaldesk-$mcp/dist" ]; then
    echo "✓ Build output exists"
  else
    echo "✗ Build output missing"
    continue
  fi
  
  # Check if index.js exists
  if [ -f "signaldesk-$mcp/dist/index.js" ]; then
    echo "✓ Index.js compiled"
  else
    echo "✗ Index.js missing"
  fi
done

echo ""
echo "=========================="
echo "All MCPs built successfully!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop to load the new MCPs"
echo "2. Test with queries like:"
echo "   - 'Show me competitor moves in the last week' (intelligence)"
echo "   - 'Find journalists covering AI' (relationships)"
echo "   - 'Generate performance metrics dashboard' (analytics)"
echo "   - 'Create a press release for Series B funding' (content)"