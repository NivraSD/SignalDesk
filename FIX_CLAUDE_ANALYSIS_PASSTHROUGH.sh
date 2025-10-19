#!/bin/bash

echo "🔧 FIXING CLAUDE ANALYSIS PASSTHROUGH"
echo "====================================="
echo "This script ensures Claude analyses from each stage are properly stored"
echo "and retrieved by the synthesis stage"
echo ""

# Step 1: Create the database table
echo "📊 Step 1: Creating claude_analyses table..."
PGPASSWORD=MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV psql -h crossover.proxy.rlwy.net -p 56706 -U postgres -d railway << 'EOF'
-- Create table for storing Claude's rich analyses from each stage
CREATE TABLE IF NOT EXISTS claude_analyses (
  id SERIAL PRIMARY KEY,
  organization_name VARCHAR(255) NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  request_id VARCHAR(255) NOT NULL,
  claude_analysis JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(organization_name, stage_name, request_id)
);

-- Index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_claude_analyses_org_request 
  ON claude_analyses(organization_name, request_id);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_claude_analyses_created 
  ON claude_analyses(created_at);

-- Enable RLS
ALTER TABLE claude_analyses ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users
CREATE POLICY IF NOT EXISTS "claude_analyses_policy" 
  ON claude_analyses
  FOR ALL 
  USING (true)
  WITH CHECK (true);

\d claude_analyses
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database table created successfully"
else
    echo "⚠️ Database table may already exist (this is OK)"
fi

# Step 2: Deploy the storage function
echo ""
echo "📦 Step 2: Deploying claude-analysis-storage function..."
cd /Users/jonathanliebowitz/Desktop/SignalDesk
supabase functions deploy claude-analysis-storage

# Step 3: Create a simple test to verify storage
echo ""
echo "🧪 Step 3: Creating test script..."
cat > /Users/jonathanliebowitz/Desktop/SignalDesk/test-claude-storage.sh << 'TESTSCRIPT'
#!/bin/bash

echo "Testing Claude Analysis Storage..."

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"
REQUEST_ID="test-$(date +%s)"

# Store a test Claude analysis
echo "Storing test analysis..."
curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/claude-analysis-storage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "{
    \"action\": \"store\",
    \"organization_name\": \"TestOrg\",
    \"stage_name\": \"competitive\",
    \"request_id\": \"${REQUEST_ID}\",
    \"claude_analysis\": {
      \"executive_summary\": \"Test Claude analysis\",
      \"insights\": [\"Rich insight 1\", \"Rich insight 2\"],
      \"opportunities\": [\"Opportunity 1\", \"Opportunity 2\"],
      \"metadata\": {
        \"model\": \"claude-sonnet-4\",
        \"duration\": 5000
      }
    }
  }" | python3 -m json.tool

echo ""
echo "Retrieving test analysis..."
curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/claude-analysis-storage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "{
    \"action\": \"retrieve\",
    \"organization_name\": \"TestOrg\",
    \"request_id\": \"${REQUEST_ID}\"
  }" | python3 -m json.tool

TESTSCRIPT

chmod +x /Users/jonathanliebowitz/Desktop/SignalDesk/test-claude-storage.sh

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "📝 Next Steps:"
echo "1. Update each stage function to store Claude analysis:"
echo "   - Add request_id generation (use timestamp or UUID)"
echo "   - After Claude analysis, store to claude-analysis-storage"
echo "   - Pass request_id forward to next stage"
echo ""
echo "2. Update synthesis stage to retrieve all Claude analyses:"
echo "   - Call claude-analysis-storage with 'retrieve' action"
echo "   - Use the rich Claude analyses instead of basic data"
echo ""
echo "3. Test with: ./test-claude-storage.sh"
echo ""
echo "Example code to add to each stage:"
echo "----------------------------------------"
cat << 'EXAMPLE'
// Generate request ID at pipeline start
const requestId = requestData.request_id || `pipeline-${Date.now()}`;

// After Claude analysis completes
if (claudeAnalysis) {
  await fetch(
    'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-analysis-storage',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        action: 'store',
        organization_name: organization.name,
        stage_name: 'competitive', // or 'media', 'regulatory', etc.
        claude_analysis: claudeAnalysis,
        request_id: requestId
      })
    }
  );
}

// Pass request_id to next stage
return new Response(JSON.stringify({
  success: true,
  data: results,
  request_id: requestId, // IMPORTANT: Pass this forward!
  ...
}), ...)
EXAMPLE
echo "----------------------------------------"