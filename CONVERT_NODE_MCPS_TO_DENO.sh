#!/bin/bash

# Convert Node.js MCP Servers to Deno Edge Functions
# This script converts MCP servers from Node.js to Deno runtime

echo "🔄 Converting Node.js MCPs to Deno Edge Functions"
echo "======================================="

# Define source and destination paths
NODE_MCP_DIR="/Users/jonathanliebowitz/Desktop/signaldesk/backend/mcp-servers"
DENO_FUNC_DIR="/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions"

# MCPs to convert
MCPS_TO_CONVERT=(
  "signaldesk-campaigns:mcp-campaigns"
  "signaldesk-memory:mcp-memory"
)

echo ""
echo "📦 Converting MCPs..."

for MCP_PAIR in "${MCPS_TO_CONVERT[@]}"; do
  SOURCE_NAME="${MCP_PAIR%%:*}"
  DEST_NAME="${MCP_PAIR##*:}"
  
  echo ""
  echo "Converting $SOURCE_NAME → $DEST_NAME..."
  
  SOURCE_FILE="$NODE_MCP_DIR/$SOURCE_NAME/src/index.ts"
  DEST_DIR="$DENO_FUNC_DIR/$DEST_NAME"
  DEST_FILE="$DEST_DIR/index.ts"
  
  # Create destination directory
  mkdir -p "$DEST_DIR"
  
  # Read source file and convert imports
  cat "$SOURCE_FILE" | \
    # Convert Node.js imports to Deno
    sed "s|from '@modelcontextprotocol/sdk/server/index.js'|from 'https://esm.sh/@modelcontextprotocol/sdk@0.5.0/server/index.js'|g" | \
    sed "s|from '@modelcontextprotocol/sdk/server/stdio.js'|from 'https://esm.sh/@modelcontextprotocol/sdk@0.5.0/server/stdio.js'|g" | \
    sed "s|from '@modelcontextprotocol/sdk/types.js'|from 'https://esm.sh/@modelcontextprotocol/sdk@0.5.0/types.js'|g" | \
    sed "s|from 'pg'|from 'https://esm.sh/pg@8.11.3'|g" | \
    sed "s|from 'dotenv'|// dotenv not needed in Deno|g" | \
    sed "s|import { fileURLToPath } from 'url'|// fileURLToPath not needed in Deno|g" | \
    sed "s|import path from 'path'|// path not needed in Deno|g" | \
    # Remove Node.js specific code
    sed '/const __filename = fileURLToPath/d' | \
    sed '/const __dirname = path.dirname/d' | \
    sed '/dotenv.config/d' | \
    # Convert to Deno serve function
    sed '1s|^|import { serve } from "https://deno.land/std@0.168.0/http/server.ts";\nimport { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";\n|' | \
    # Replace process.env with Deno.env
    sed 's|process\.env\.|Deno.env.get("|g' | \
    sed 's|Deno\.env\.get("\([^"]*\)")|Deno.env.get("\1")|g' \
    > "$DEST_FILE.tmp"
  
  # Now wrap the MCP server code in a Deno serve handler
  cat > "$DEST_FILE" << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

EOF

  # Extract tools and handlers from source
  echo "// Extracted from $SOURCE_NAME" >> "$DEST_FILE"
  
  # Extract TOOLS array
  awk '/^const TOOLS: Tool\[\] = \[/,/^\];/' "$SOURCE_FILE" | \
    sed 's|Tool\[\]|any\[\]|g' >> "$DEST_FILE"
  
  echo "" >> "$DEST_FILE"
  
  # Add HTTP handler wrapper
  cat >> "$DEST_FILE" << 'EOF'

// HTTP handler for Supabase Edge Function
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tool, arguments: args } = await req.json();
    
    if (tool === 'list_tools') {
      return new Response(
        JSON.stringify({ tools: TOOLS, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // TODO: Implement tool handlers based on source
    const result = { 
      message: `Tool ${tool} called`, 
      args,
      success: true 
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
EOF
  
  # Clean up temp file
  rm -f "$DEST_FILE.tmp"
  
  echo "✓ Created $DEST_FILE"
done

echo ""
echo "======================================="
echo "✅ Conversion complete!"
echo ""
echo "Note: The converted files have basic structure but need:"
echo "1. Tool handler implementations to be manually ported"
echo "2. Database queries to be adapted for Supabase"
echo "3. Testing before deployment"
echo ""
echo "To deploy converted MCPs:"
echo "cd /Users/jonathanliebowitz/Desktop/signaldesk-v3"
echo "npx supabase functions deploy mcp-campaigns"
echo "npx supabase functions deploy mcp-memory"