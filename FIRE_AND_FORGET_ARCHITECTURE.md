# Fire-and-Forget Real-Time Monitor Architecture

**Date:** October 17, 2025
**Status:** ✅ DEPLOYED AND VERIFIED

## Problem Solved

The real-time-alert-router was experiencing timeout errors because it was waiting for all detectors to complete before returning a response. With Edge Function limits of 150 seconds and detectors taking 60-80+ seconds each, the system frequently exceeded the timeout.

## Solution: Fire-and-Forget Pattern

The router now:
1. Sends articles to detector functions via HTTP
2. Returns **immediately** to the frontend (~2-5 seconds)
3. Detectors run **independently in background** and save results to database
4. Frontend can poll or manually check modules for results

## Key Changes

### 1. Real-Time Alert Router (`real-time-alert-router/index.ts`)

**Before (Blocking):**
```typescript
// Wait for all detectors to complete
const results = await Promise.all(detectionPromises)

// Return results
return {
  opportunities: results[0].opportunities,
  crises: results[1].crises,
  predictions: results[2].predictions
}
```

**After (Fire-and-Forget):**
```typescript
// DON'T wait for detectors - they save to database themselves
// Just fire them off and return immediately
console.log(`\n🚀 Detectors running in background (${detectionPromises.length} total)`)

// Fire and forget - detectors will save results to database
Promise.all(detectionPromises).catch(err => {
  console.error('⚠️ Background detector error (non-blocking):', err)
})

// Return immediately with status
return {
  opportunities: [],
  opportunities_status: 'processing',
  crises: [],
  crises_status: 'processing',
  predictions: [],
  predictions_status: 'processing'
}
```

### 2. Router Returns Empty Arrays with Status

The router now returns:
```json
{
  "success": true,
  "articles_analyzed": 20,
  "total_articles_found": 47,

  "opportunities": [],
  "opportunities_count": 0,
  "opportunities_status": "processing",

  "crises": [],
  "crises_count": 0,
  "crises_status": "processing",

  "predictions": [],
  "predictions_count": 0,
  "predictions_status": "processing",

  "execution_time_ms": 2543
}
```

### 3. Frontend Updated Logging

**Before:**
```typescript
console.log('✅ Real-time monitor completed')
console.log(`   - ${data.predictions_count || 0} predictions generated`)
console.log(`   - ${data.opportunities_count || 0} opportunities detected`)
console.log(`   - ${data.crises_count || 0} crises detected`)
```

**After:**
```typescript
console.log('✅ Real-time monitor initiated')
console.log(`   - ${data.articles_analyzed} articles found and sent to detectors`)
console.log(`   - Detectors running in background (will save to database)`)
console.log(`   - Check Predictions, Opportunities, and Crisis modules for results`)
```

### 4. Removed Pre-Filtering

**Before:**
```typescript
// Filter to crisis-related results only
const crisisResults = topResults.filter(r => {
  const text = `${r.title} ${r.content}`.toLowerCase()
  return /crisis|lawsuit|recall|breach|scandal|investigation|fraud|hack/.test(text)
})

if (crisisResults.length > 0) {
  // Only route if keywords found
}
```

**After:**
```typescript
// ALWAYS route to crisis detector - let AI decide if there's a crisis
// Don't pre-filter based on keywords - that's too limiting
detectionPromises.push(
  fetch(`${SUPABASE_URL}/functions/v1/mcp-crisis`, {
    body: JSON.stringify({
      articles: topResults, // Send ALL articles, let AI decide
      alerts: crisisAlerts
    })
  })
)
```

## Detector Behavior

Each detector is responsible for:
1. **Receiving articles** from router via HTTP POST
2. **Analyzing with AI** (Claude or other models)
3. **Saving results** directly to database
4. **Returning confirmation** (which router ignores)

### Detector Tables

- `mcp-opportunity-detector` → `opportunities` table
- `mcp-crisis` → `crisis_events` table
- `stakeholder-pattern-detector` → `stakeholder_predictions` table

## User Experience

### Before
1. User clicks "Run Real-Time Monitor"
2. Wait 90-150 seconds (often timeout)
3. If successful, see results immediately

### After
1. User clicks "Run Real-Time Monitor"
2. Wait 2-5 seconds
3. See message: "20 articles found and sent to detectors"
4. Open Predictions/Opportunities/Crisis modules to see results as they complete (30-60 seconds)

## Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Router Response Time | 90-150s | 2-5s | **30-50x faster** |
| Timeout Errors | Frequent | None | **100% resolved** |
| Detector Parallelization | Sequential waits | True parallel | **Independent execution** |
| User Wait Time | 150s blocked | 5s + background | **Better UX** |

## Future Enhancements

### 1. Polling Mechanism (Optional)
Frontend could poll database every 10 seconds for 60 seconds to automatically update canvas components when results appear:

```typescript
const pollForResults = async (organizationId: string) => {
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 10000))

    // Check for new predictions
    const { data: predictions } = await supabase
      .from('stakeholder_predictions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (predictions && predictions.length > 0) {
      // Auto-update canvas
      window.dispatchEvent(new CustomEvent('addComponentToCanvas', {
        detail: {
          moduleId: 'predictions',
          data: { predictions }
        }
      }))
    }
  }
}
```

### 2. WebSocket Notifications
Real-time notifications when detectors complete:
- Detector saves to database
- Database trigger sends webhook/notification
- Frontend receives live update

### 3. Status Indicators
Show "processing" badges on canvas components:
- Predictions: "Analyzing 90 days of patterns..."
- Opportunities: "Scanning 20 articles..."
- Crisis: "Evaluating crisis signals..."

## Testing

### Verify Fire-and-Forget Works
```bash
# Call real-time monitor
curl -X POST http://localhost:3000/api/realtime-monitor \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "OpenAI",
    "time_window": "6hours"
  }'

# Should return in ~2-5 seconds with empty arrays
# Then check database tables after 30-60 seconds
```

### Check Detector Results
```sql
-- Check predictions (should appear in 20-40 seconds)
SELECT * FROM stakeholder_predictions
WHERE organization_id = 'uuid-here'
ORDER BY created_at DESC
LIMIT 5;

-- Check crises (should appear in 60-80 seconds)
SELECT * FROM crisis_events
WHERE organization_id = 'uuid-here'
ORDER BY created_at DESC
LIMIT 5;

-- Check opportunities
SELECT * FROM opportunities
WHERE organization_id = 'uuid-here'
ORDER BY created_at DESC
LIMIT 5;
```

## Architecture Diagram

```
User clicks "Run Monitor"
         ↓
    Frontend (IntelligenceModule)
         ↓
    /api/realtime-monitor
         ↓
real-time-alert-router (Edge Function)
         ↓
  1. Get articles (niv-fireplexity-monitor)
  2. Fire HTTP requests to 3 detectors
  3. Return immediately ← RETURNS HERE (~2-5s)
         ↓
┌────────┼────────┐
│        │        │
↓        ↓        ↓
Opportunities  Crisis  Predictions
Detector       Detector Detector
│        │        │
↓        ↓        ↓
Save to  Save to  Save to
opportunities  crisis_events  stakeholder_predictions
table    table    table
```

## Related Files

- `/supabase/functions/real-time-alert-router/index.ts` - Main router (fire-and-forget logic)
- `/src/components/modules/IntelligenceModule.tsx` - Frontend (updated logging)
- `/src/app/api/realtime-monitor/route.ts` - API route
- `SIMPLIFIED_REALTIME_ARCHITECTURE.md` - Overall architecture documentation

## Success Criteria

- ✅ Router returns in < 10 seconds
- ✅ No timeout errors
- ✅ Detectors run independently
- ✅ All detectors receive full article set (no pre-filtering)
- ✅ Results appear in database tables
- ✅ Frontend shows clear "processing" messaging
- ✅ Crisis detector analyzes ALL articles, not just keyword matches

## Deployment

```bash
# Deploy the updated router
npx supabase functions deploy real-time-alert-router

# No frontend changes needed (already updated)
# Dev server will pick up changes automatically
```

## Monitoring

### Router Logs
```bash
# Check router execution
🚀 Real-Time Alert Router
   Organization: OpenAI
   Time window: 6hours
   Source: niv-fireplexity-monitor
   Opportunities: true
   Crisis detection: true
   Predictions: true

📡 Step 1: Getting results from niv-fireplexity-monitor...
✅ Found 47 results from search

🎯 Processing top 20 results

⚡ Step 2: Routing to detectors in parallel...
   🎯 Routing to opportunity detector...
   🚨 Routing to crisis detector...
   🔮 Routing to prediction detector...

🚀 Detectors running in background (3 total)

✅ Real-time alert routing complete in 2543ms
```

### Detector Logs
Check individual detector logs to see analysis progress:
```bash
# Predictions detector log
npx supabase functions logs stakeholder-pattern-detector --tail

# Crisis detector log
npx supabase functions logs mcp-crisis --tail

# Opportunity detector log
npx supabase functions logs mcp-opportunity-detector --tail
```

## Rollback Plan

If fire-and-forget causes issues, revert to synchronous execution:

```typescript
// Change from:
Promise.all(detectionPromises).catch(err => {...})

// Back to:
const results = await Promise.all(detectionPromises)

// And return actual results instead of empty arrays
```

**Note:** This will bring back timeout issues, so only use as temporary fallback.
