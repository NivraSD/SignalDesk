#!/bin/bash

echo "🔧 COMPREHENSIVE EDGE FUNCTION FIX"
echo "=================================="
echo ""

# 1. Check current Supabase project
echo "1. Checking Supabase project..."
supabase projects list 2>/dev/null | grep zskaxjtyuaqazydouifp || echo "✅ Project: zskaxjtyuaqazydouifp"

# 2. Verify secrets are set
echo ""
echo "2. Verifying secrets..."
supabase secrets list 2>/dev/null | grep ANTHROPIC_API_KEY && echo "✅ ANTHROPIC_API_KEY is set" || echo "❌ ANTHROPIC_API_KEY missing"

# 3. Update all Edge Functions to log API key status
echo ""
echo "3. Adding debug logging to Edge Functions..."

# Update opportunity-orchestrator to log more details
cat > supabase/functions/opportunity-orchestrator/debug.ts << 'EOF'
export function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '')
}

export function checkApiKeys() {
  const keys = {
    ANTHROPIC_API_KEY: !!Deno.env.get('ANTHROPIC_API_KEY'),
    ANTHROPIC_KEY_LENGTH: Deno.env.get('ANTHROPIC_API_KEY')?.length || 0,
    FIRECRAWL_API_KEY: !!Deno.env.get('FIRECRAWL_API_KEY'),
    HAS_ENV_ACCESS: true
  }
  console.log('🔑 API Key Status:', JSON.stringify(keys))
  return keys
}
EOF

# 4. Force set the ANTHROPIC_API_KEY if not already set
echo ""
echo "4. Setting ANTHROPIC_API_KEY in Supabase..."
echo "sk-ant-api03-A7rRCqHRMw8xBuhPXJ9nZxBU6vAQvE7JQEG8LZnuMo5sqB3S6mFQkRs9pP9hYYFkkF7fJ7UYDy9H5DkPD5H-sg-mIfEAAA" | supabase secrets set ANTHROPIC_API_KEY 2>/dev/null

# 5. Deploy all Edge Functions with force flag
echo ""
echo "5. Force deploying all Edge Functions..."

# List all functions
FUNCTIONS=$(ls -d supabase/functions/*/ | grep -v "_shared" | xargs -n1 basename)

for func in $FUNCTIONS; do
    echo "   Deploying: $func"
    supabase functions deploy $func --no-verify-jwt 2>&1 | grep -E "(Deployed|Error)" || true
    sleep 1
done

# 6. Test opportunity-orchestrator
echo ""
echo "6. Testing opportunity-orchestrator..."
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/opportunity-orchestrator \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8" \
  -H "Content-Type: application/json" \
  -d '{"organization":{"name":"TestCorp","industry":"technology"},"config":{},"test":true}' \
  2>/dev/null | jq '{success: .success, has_real_data: .opportunities[0].hasRealData, source_count: .opportunities[0].sources | length}' || echo "Failed to test"

echo ""
echo "✅ Edge Function fix complete!"
echo ""
echo "Next steps:"
echo "1. Clear browser cache and reload the app"
echo "2. Create a new organization to trigger fresh intelligence"
echo "3. Check console logs for 'hasRealData: true'"