# Frontend Migration to New Functions - Complete ✅

## Summary

All frontend code has been updated to use the new Firecrawl-powered functions with master-source-registry integration and deduplication.

## Files Updated

### 1. Batch Intelligence Pipeline

#### `src/lib/services/intelligenceService.ts` ✅
**Line 67:** Changed function call

**Before:**
```typescript
const monitoringResponse = await supabase.functions.invoke('monitor-stage-1', {
  body: {
    organization_name: orgName,
    profile: data.profile
  }
})
```

**After:**
```typescript
const monitoringResponse = await supabase.functions.invoke('monitor-stage-1-fireplexity', {
  body: {
    organization: orgName,
    profile: data.profile
    // recency_window defaults to 24 hours
    // skip_deduplication defaults to false
  }
})
```

**Impact:**
- Used by: IntelligenceModule
- Triggers: Executive synthesis, opportunities, predictions pipeline
- New behavior: 24-hour window with deduplication, Firecrawl search, 100+ sources

---

#### `src/services/intelligenceOrchestratorV4.ts` ✅
**Line 59:** Changed function URL

**Before:**
```typescript
const monitorResponse = await fetch(
  `${supabaseUrl}/functions/v1/monitor-stage-1?t=${Date.now()}`,
  // ...
)
```

**After:**
```typescript
const monitorResponse = await fetch(
  `${supabaseUrl}/functions/v1/monitor-stage-1-fireplexity?t=${Date.now()}`,
  // ...
)
```

**Impact:**
- Used by: Alternative intelligence orchestrator
- Same pipeline as intelligenceService.ts
- Now uses Firecrawl + master-source-registry

---

### 2. Real-time Monitoring

#### `supabase/functions/real-time-alert-router/index.ts` ✅
**Line 141:** Changed function call

**Before:**
```typescript
const searchResponse = await fetch(
  `${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor`,
  // ...
)
```

**After:**
```typescript
const searchResponse = await fetch(
  `${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor-v2`,
  // ...
)
```

**Impact:**
- Used by: Real-time crisis/opportunity detection
- Triggered by: `/api/realtime-monitor` API route
- New behavior: 6-hour window with deduplication, Firecrawl search, 100+ sources
- **Deployed:** Yes ✅

---

## No Changes Needed

These files reference the functions but don't need updates:

### `src/app/api/realtime-monitor/route.ts`
- Calls `real-time-alert-router` (which we updated above)
- No direct function calls to old monitors
- Works automatically with updated router

### Display Components
- `src/components/modules/IntelligenceModule.tsx`
- `src/components/modules/SimpleIntelligence.tsx`
- Just display pipeline stage names ("PR Filtering")
- No function calls to update

---

## Migration Flow

### Batch Intelligence (Daily)
```
User clicks "Run Intelligence" in IntelligenceModule
  ↓
intelligenceService.ts: startPipeline()
  ↓
Calls: monitor-stage-1-fireplexity ✅ NEW
  ↓
Returns: Articles with deduplication
  ↓
Continues: relevance → enrichment → synthesis → opportunities
```

### Real-time Monitoring (Every 6 hours)
```
Cron job triggers: /api/realtime-monitor
  ↓
API route calls: real-time-alert-router
  ↓
Router calls: niv-fireplexity-monitor-v2 ✅ NEW
  ↓
Returns: Articles with deduplication
  ↓
Routes to: Crisis detector, Opportunity detector, Prediction generator
```

---

## What Users Will See

### Batch Intelligence
**Old (monitor-stage-1):**
```
📰 Step 2: Collecting articles from monitor-stage-1...
✅ Found 40 articles from 20 RSS feeds
```

**New (monitor-stage-1-fireplexity):**
```
📰 Step 2: Collecting articles from monitor-stage-1-fireplexity...
📚 Fetching sources from master-source-registry...
✅ Loaded 127 trusted source domains
🔍 Step 4: Checking for previously processed articles...
   ✓ Filtered: 85 found → 50 new (35 already processed)
✅ Found 50 NEW articles from 100+ sources via Firecrawl
```

### Real-time Monitoring
**Old (niv-fireplexity-monitor):**
```
📡 Step 1: Calling niv-fireplexity-monitor (RSS-based)...
✅ Found 25 articles from 20 RSS feeds
```

**New (niv-fireplexity-monitor-v2):**
```
📡 Step 1: Calling niv-fireplexity-monitor-v2 (Firecrawl + 100+ sources)...
🔍 Step 5: Checking for previously processed articles...
   ✓ Filtered: 42 scored → 30 new (12 already processed)
✅ Found 30 NEW articles from 100+ sources
```

---

## Testing Checklist

### Test Batch Intelligence
1. Go to Intelligence Module
2. Click "Run Intelligence" for Tesla
3. Watch logs for:
   - ✅ "monitor-stage-1-fireplexity" (not "monitor-stage-1")
   - ✅ "Loaded XX trusted source domains" (XX > 100)
   - ✅ Deduplication stats showing
4. Run again immediately
5. Verify:
   - ✅ Most articles marked as "already processed"
   - ✅ Only NEW articles returned

### Test Real-time Monitoring
1. Trigger real-time monitor for Tesla
2. Watch logs for:
   - ✅ "niv-fireplexity-monitor-v2" (not "niv-fireplexity-monitor")
   - ✅ Deduplication stats showing
3. Run again within 6 hours
4. Verify:
   - ✅ Overlap articles marked as "already processed"
   - ✅ Only NEW articles trigger alerts

---

## Performance Expectations

### Batch Intelligence (24-hour window)
| Metric | Old (RSS) | New (Firecrawl) |
|--------|-----------|-----------------|
| Sources | 20 feeds | 100+ domains |
| Articles found | 30-50 | 60-100 |
| Duplicates (Day 2) | 0 (no tracking) | 30-40 skipped |
| Processing time | 5-10s | 15-25s |
| Coverage | RSS only | RSS + Web search |

### Real-time (6-hour window)
| Metric | Old (RSS) | New (Firecrawl) |
|--------|-----------|-----------------|
| Sources | 20 feeds | 100+ domains |
| Articles found | 15-30 | 30-50 |
| Duplicates (2nd run) | 0-5 | 10-15 skipped |
| Processing time | 8-12s | 10-15s |
| Fresh news | RSS lag | Near real-time |

---

## Rollback Plan

If issues arise, easy rollback:

### Batch Intelligence
```typescript
// In src/lib/services/intelligenceService.ts line 67
await supabase.functions.invoke('monitor-stage-1', { // Change back
  body: { organization_name: orgName, profile: data.profile }
})
```

### Real-time Monitoring
```typescript
// In supabase/functions/real-time-alert-router/index.ts line 141
const searchResponse = await fetch(
  `${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor`, // Change back
  // ...
)
```

Then redeploy:
```bash
supabase functions deploy real-time-alert-router
```

---

## Monitoring

### Check Function Invocations
Dashboard: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions

Watch for:
- `monitor-stage-1-fireplexity` invocations increasing
- `monitor-stage-1` invocations dropping to zero
- `niv-fireplexity-monitor-v2` invocations increasing
- `niv-fireplexity-monitor` invocations dropping to zero

### Check Deduplication Effectiveness
```sql
-- View deduplication stats by organization
SELECT
  organization_id,
  COUNT(*) as total_processed,
  MAX(processed_at) as last_processed
FROM processed_articles
WHERE created_at > now() - interval '7 days'
GROUP BY organization_id
ORDER BY total_processed DESC;

-- Check duplicate rate
SELECT
  organization_id,
  DATE(created_at) as date,
  COUNT(*) as articles_marked,
  COUNT(DISTINCT article_url) as unique_articles
FROM processed_articles
WHERE created_at > now() - interval '7 days'
GROUP BY organization_id, DATE(created_at)
ORDER BY date DESC;
```

---

## Summary

✅ **3 files updated**
✅ **1 function redeployed**
✅ **No breaking changes**
✅ **Easy rollback available**
✅ **Deduplication active**
✅ **100+ sources now in use**

All intelligence pipelines now use:
- Firecrawl search (finds articles RSS misses)
- Master-source-registry (100+ curated sources)
- Automatic deduplication (prevents duplicate processing)
- 24-hour default window (perfect for daily runs)

---

**Migration Status:** ✅ COMPLETE
**Last Updated:** 2025-10-23
**Deployment:** Live in production
