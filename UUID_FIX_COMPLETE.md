# UUID Fix Complete - Prediction & Opportunity Systems

**Date:** October 17, 2025
**Status:** ✅ FIXED AND DEPLOYED

## Problem Summary

The real-time intelligence orchestrator was saving data with `organization_id` set to organization **names** (strings like "OpenAI") instead of **UUIDs** (`7a2835cb-11ee-4512-acc3-b6caf8eb03ff`). This caused:

1. **Stakeholder Prediction System** couldn't find intelligence data (searched by UUID, data saved with name)
2. **Opportunity Engine** received wrong organization_id format, causing storage issues

## Fixes Applied

### 1. Real-Time Intelligence Brief Storage (Lines 589-602)
**Before:**
```typescript
await supabase.from('real_time_intelligence_briefs').insert({
  organization_id: organization_name,  // ❌ String name
  organization_name: organization_name,
  // ...
});
```

**After:**
```typescript
// Get UUID first
const { data: orgData } = await supabase
  .from('organizations')
  .select('id')
  .eq('name', organization_name)
  .single();

const organizationId = orgData?.id || organization_name;

await supabase.from('real_time_intelligence_briefs').insert({
  organization_id: organizationId,  // ✅ UUID
  organization_name: organization_name,
  // ...
});
```

### 2. Opportunity Detector Call (Line 391)
**Before:**
```typescript
body: JSON.stringify({
  organization_id: organization_name,  // ❌ String name
  organization_name,
  // ...
})
```

**After:**
```typescript
body: JSON.stringify({
  organization_id: organizationId,  // ✅ UUID
  organization_name,
  // ...
})
```

### 3. Opportunity Orchestrator-V2 Call (Line 414)
**Before:**
```typescript
body: JSON.stringify({
  organization_id: organization_name,  // ❌ String name
  organization_name,
  // ...
})
```

**After:**
```typescript
body: JSON.stringify({
  organization_id: organizationId,  // ✅ UUID
  organization_name,
  // ...
})
```

## Implementation Details

### UUID Lookup Strategy
The fix retrieves the UUID once in Stage 6 and reuses it for:
- Intelligence brief storage
- Opportunity detector call
- Opportunity orchestrator-v2 call

This avoids duplicate database queries and ensures consistency.

### Fallback Handling
```typescript
const organizationId = orgData?.id || organization_name;
```
If UUID lookup fails, falls back to the organization name to maintain backward compatibility.

## Data Flow Fixed

### Stakeholder Prediction System
```
Real-Time Monitor runs
    ↓
Intelligence saved with UUID (7a2835cb-11ee-4512-acc3-b6caf8eb03ff)
    ↓
real_time_intelligence_briefs table
    ↓
Stakeholder Pattern Detector searches by UUID
    ↓
✅ Finds data and generates predictions
```

### Opportunity Engine
```
Real-Time Monitor detects opportunities
    ↓
Calls mcp-opportunity-detector with UUID
    ↓
Detector processes and clears old opportunities by UUID
    ↓
Calls opportunity-orchestrator-v2 with UUID
    ↓
Orchestrator enhances opportunities
    ↓
✅ Saves to opportunities table with correct UUID
```

## Verification Checklist

- [x] UUID lookup added before Stage 6
- [x] Intelligence brief storage uses UUID
- [x] Opportunity detector receives UUID
- [x] Opportunity orchestrator-v2 receives UUID
- [x] Function deployed successfully
- [x] Organization record verified (OpenAI UUID exists)
- [x] Discovery profile updated with UUID

## Testing Instructions

1. **Run Real-Time Monitor** from the UI
   - Select OpenAI organization
   - Choose 6 hours time window
   - Enable "Route to Opportunities" if needed

2. **Verify Intelligence Data**
   ```sql
   SELECT * FROM real_time_intelligence_briefs
   WHERE organization_id = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
   ORDER BY created_at DESC LIMIT 1;
   ```

3. **Check Predictions**
   ```sql
   SELECT * FROM stakeholder_predictions
   WHERE organization_id = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
   AND status = 'active';
   ```

4. **Verify Opportunities**
   ```sql
   SELECT * FROM opportunities
   WHERE organization_id = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
   ORDER BY created_at DESC;
   ```

## Expected Behavior

After running the Real-Time Monitor:

1. **Intelligence Brief**: Saved with UUID, includes events and entities
2. **Stakeholder Predictions**: Generated automatically from intelligence events
3. **Opportunities**: Created and enhanced with proper UUID linking

## Files Modified

- `/supabase/functions/real-time-intelligence-orchestrator/index.ts`
  - Added UUID lookup in Stage 6 (lines 365-372)
  - Updated intelligence brief storage (line 592)
  - Updated opportunity detector call (line 391)
  - Updated opportunity orchestrator-v2 call (line 414)

## Related Systems

- **Stakeholder Pattern Detector**: Now receives intelligence data
- **MCP Opportunity Detector**: Now receives correct UUID
- **Opportunity Orchestrator V2**: Now receives correct UUID
- **Real-Time Intelligence Briefs**: Now uses UUID for linking

## Next Steps

1. Refresh browser to clear stale localStorage
2. Run Real-Time Monitor
3. Open Predictions tab to see stakeholder forecasts
4. Check Opportunities tab for PR opportunities
