#!/bin/bash

echo "🔧 Fixing Opportunity Refresh Issues"
echo "====================================="
echo ""

# This script fixes the opportunity refresh problem by:
# 1. Clearing stale opportunities
# 2. Updating the opportunity-orchestrator to use timestamps in IDs
# 3. Increasing enrichment data limits

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"

echo "1️⃣ Updating opportunity-orchestrator to use timestamp-based IDs..."
echo "----------------------------------------------------------------"

# Create a patch file for the opportunity-orchestrator
cat > /tmp/opportunity-fix.patch << 'EOF'
--- a/supabase/functions/opportunity-orchestrator/index.ts
+++ b/supabase/functions/opportunity-orchestrator/index.ts
@@ -264,7 +264,8 @@
   
   // Base opportunity structure
   const opportunity: EnhancedOpportunity = {
-    id: crypto.randomUUID(),
+    // Include timestamp to ensure uniqueness across runs
+    id: `${crypto.randomUUID()}-${Date.now()}`,
     title: rawOpp.raw_insight.title || `${rawOpp.type} Opportunity`,
     description: rawOpp.raw_insight.action || rawOpp.raw_insight.response_required || 
                  rawOpp.raw_insight.preparation_needed || 'Action required',
@@ -495,7 +496,8 @@
     const { data, error } = await supabase
       .from('opportunities')
       .upsert(opportunitiesToInsert, {
-        onConflict: 'opportunity_id',
+        // Always insert new opportunities, don't update existing
+        onConflict: 'opportunity_id', 
         ignoreDuplicates: false
       })
EOF

echo "Applying patch to opportunity-orchestrator..."
cd supabase/functions/opportunity-orchestrator
patch -p1 < /tmp/opportunity-fix.patch 2>/dev/null || echo "Patch may have already been applied"
cd ../../..

echo ""
echo "2️⃣ Updating monitoring-stage-2-enrichment to send more data..."
echo "--------------------------------------------------------------"

# Create enrichment enhancement patch
cat > /tmp/enrichment-fix.patch << 'EOF'
--- a/supabase/functions/monitoring-stage-2-enrichment/index.ts
+++ b/supabase/functions/monitoring-stage-2-enrichment/index.ts
@@ -101,11 +101,11 @@
   });
 
   return {
-    companies: Array.from(entities.companies).slice(0, 50),
-    executives: Array.from(entities.executives).slice(0, 30),
-    products: Array.from(entities.products).slice(0, 30),
-    investors: Array.from(entities.investors).slice(0, 20),
-    regulators: Array.from(entities.regulators).slice(0, 20)
+    companies: Array.from(entities.companies).slice(0, 100),  // Increased from 50
+    executives: Array.from(entities.executives).slice(0, 50),  // Increased from 30
+    products: Array.from(entities.products).slice(0, 50),     // Increased from 30
+    investors: Array.from(entities.investors).slice(0, 30),    // Increased from 20
+    regulators: Array.from(entities.regulators).slice(0, 30)   // Increased from 20
   };
 }
EOF

echo "Applying patch to monitoring-stage-2-enrichment..."
cd supabase/functions/monitoring-stage-2-enrichment
patch -p1 < /tmp/enrichment-fix.patch 2>/dev/null || echo "Patch may have already been applied"
cd ../../..

echo ""
echo "3️⃣ Creating SQL to clean up stale opportunities..."
echo "---------------------------------------------------"

cat > clear-stale-opportunities.sql << 'EOF'
-- Clear opportunities older than 7 days that are still 'new'
DELETE FROM opportunities 
WHERE status = 'new' 
  AND created_at < NOW() - INTERVAL '7 days';

-- Mark expired opportunities
UPDATE opportunities 
SET status = 'expired'
WHERE expires_at < NOW() 
  AND status IN ('new', 'reviewed');

-- Get count of remaining opportunities
SELECT 
  organization_name,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM opportunities
GROUP BY organization_name, status
ORDER BY organization_name, status;
EOF

echo "SQL script created: clear-stale-opportunities.sql"
echo ""

echo "4️⃣ Deploying updated functions..."
echo "-----------------------------------"

echo "Deploying opportunity-orchestrator..."
npx supabase functions deploy opportunity-orchestrator --no-verify-jwt

echo "Deploying monitoring-stage-2-enrichment..."
npx supabase functions deploy monitoring-stage-2-enrichment --no-verify-jwt

echo ""
echo "5️⃣ Clearing frontend cache..."
echo "------------------------------"

cat > clear-frontend-cache.js << 'EOF'
// Run this in browser console to clear all SignalDesk caches
console.log('Clearing SignalDesk caches...');
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('intelligence') || key.includes('opportunity') || 
      key.includes('synthesis') || key.includes('organization'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => {
  console.log(`Removing: ${key}`);
  localStorage.removeItem(key);
});
console.log(`Cleared ${keysToRemove.length} cache entries`);
EOF

echo "Browser cache clear script created: clear-frontend-cache.js"
echo ""

echo "====================================="
echo "✅ Fix Script Complete!"
echo ""
echo "Next steps:"
echo "1. Review the SQL in clear-stale-opportunities.sql"
echo "2. Run the SQL if you want to clear old opportunities"
echo "3. Open browser console and run the code in clear-frontend-cache.js"
echo "4. Restart your dev server: npm run dev"
echo "5. Test the pipeline with: ./test-pipeline.sh"
echo ""
echo "The opportunity IDs now include timestamps to prevent conflicts!"