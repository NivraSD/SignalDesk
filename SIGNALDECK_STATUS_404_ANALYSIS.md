# SignalDeck Status 404 Error - Root Cause Analysis

## User Report
"see logs.md i included console and signaldeck edge function"

## Console Logs Analysis

### Frontend Behavior (Good)
- Line 62: `⏳ SIGNALDECK GENERATING - Starting to poll` ✅
- Lines 63-96: Frontend polls status endpoint every 3 seconds ✅
- Line 75: Poll 13/40 gets response: `status: "processing"` ✅ (ONE successful response)
- Line 103: Poll 38/40 gets response: `status: "error"` ❌

### Edge Function Logs Analysis (Problem Identified)

**Status Endpoint IS Being Called:**
- Line 107: `🔍 Status check for generation: beb6d6b7-150a-4cb5-9a75-efed46dc7857`
- Lines 115, 155, 195, 219, 243, 267, 291: Multiple status checks logged

**BUT Returns 404:**
- Lines 63-102: `Failed to load resource: the server responded with a status of 404`
- Line 97-101: `GET https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/signaldeck-presentation/status/beb6d6b7-150a-4cb5-9a75-efed46dc7857 404 (Not Found)`

## Root Cause: In-Memory Store in Stateless Function

### The Architecture Problem

**File:** `supabase/functions/signaldeck-presentation/index.ts`

**Line 42:**
```typescript
// In-memory storage for generation status (in production, use Redis or database)
const generationStore = new Map<string, GenerationStatus>()
```

**Line 531-544: Status Check Code**
```typescript
if (generationId) {
  console.log('🔍 Status check for generation:', generationId)
  const status = generationStore.get(generationId)  // ← RETURNS NULL

  if (!status) {
    return new Response(
      JSON.stringify({
        success: false,
        status: 'not_found',
        message: 'Generation ID not found'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404  // ← THIS IS WHY WE GET 404
      }
    )
  }
  // ... return status if found
}
```

### Why It Fails

1. **Initial Request** (Create presentation):
   - Frontend calls `/signaldeck-presentation` with POST
   - Edge function spins up, creates new Map
   - Generates `generationId: beb6d6b7-150a-4cb5-9a75-efed46dc7857`
   - Stores in Map: `generationStore.set(generationId, { status: 'pending' })`
   - Starts async `generatePresentation()` in background
   - Returns immediately with generationId
   - ✅ Function instance stays alive for background work

2. **Status Check Requests** (3 seconds later):
   - Frontend polls `/signaldeck-presentation/status/beb6d6b7-...`
   - Supabase spins up a **NEW instance** of the function
   - This new instance has an **empty Map** (fresh in-memory storage)
   - `generationStore.get(generationId)` returns `null`
   - Returns 404 "Generation ID not found"
   - ❌ Fails because state doesn't persist across instances

### Why Poll 13 Sometimes Succeeds

The logs show:
```
Line 75: 📊 SignalDeck Poll 13/40: processing
```

This suggests that **occasionally** the status check hits the same function instance that's still running the background job. But most polls hit different instances with empty Maps.

## Second Problem: PowerPoint Builder Failure

### Error from Logs (Lines 522-544)

```
Error: Cannot find module 'pptxgenjs'
Require stack:
- /var/task/presentation-builder/builder.js
```

**Location:** `/api/build-presentation` endpoint on Vercel

**Root Cause:** The Next.js API route at `/api/build-presentation` is trying to run a Node.js script that requires `pptxgenjs`, but the dependency is not installed or not properly included in the Vercel deployment.

**Evidence:**
- Line 563: `📤 Calling builder API: https://signaldesk-v3.vercel.app/api/build-presentation`
- Line 522: `❌ Build presentation error: Error: Builder API failed: 500`
- Line 523: Full error shows `MODULE_NOT_FOUND` for `pptxgenjs`

## Solutions

### Solution 1: Use Database for Status Storage (Recommended)

Create a `presentation_generations` table in Supabase:

```sql
CREATE TABLE presentation_generations (
  id UUID PRIMARY KEY,
  organization_id TEXT,
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'error'
  progress INTEGER DEFAULT 0,
  file_url TEXT,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_generations_id ON presentation_generations(id);
CREATE INDEX idx_generations_org ON presentation_generations(organization_id);
```

**Update Code:**

```typescript
// Instead of:
generationStore.set(generationId, { status: 'pending' })

// Use:
await supabase
  .from('presentation_generations')
  .insert({
    id: generationId,
    organization_id: request.organization_id,
    status: 'pending',
    progress: 0,
    metadata: { outline: request.approved_outline }
  })

// Status checks become:
const { data } = await supabase
  .from('presentation_generations')
  .select('*')
  .eq('id', generationId)
  .single()

if (!data) {
  return 404
}

return {
  success: true,
  generationId: data.id,
  status: data.status,
  fileUrl: data.file_url,
  progress: data.progress,
  error: data.error
}
```

### Solution 2: Use Supabase Realtime for Status Updates (Advanced)

Instead of polling, use Supabase's realtime subscriptions. The frontend would listen for changes to the `presentation_generations` table.

**Frontend:**
```typescript
const channel = supabase
  .channel(`generation:${generationId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'presentation_generations',
    filter: `id=eq.${generationId}`
  }, (payload) => {
    // Update UI with new status
    console.log('Status update:', payload.new.status)
    if (payload.new.status === 'completed') {
      showDownloadLink(payload.new.file_url)
    }
  })
  .subscribe()
```

### Solution 3: Fix PowerPoint Builder Dependencies

**Check if `/api/build-presentation` exists:**
```bash
ls -la src/app/api/build-presentation/
```

**If it exists, ensure dependencies are installed:**
```bash
npm install pptxgenjs
```

**If the endpoint doesn't exist**, we need to create it OR switch to using Gamma presentation API instead of trying to build PowerPoint files directly.

## Current Status

### What Works ✅
1. User requests presentation → outline created
2. User approves outline → generation triggered
3. Frontend starts polling
4. Edge function receives initial request and starts background job
5. Claude generates presentation content successfully

### What's Broken ❌
1. Status checks return 404 (in-memory Map doesn't persist)
2. PowerPoint builder fails (missing `pptxgenjs` dependency)
3. User never sees completion status or download link

## Immediate Action Required

**Priority 1: Fix Status Persistence**
- Implement database-backed status storage
- Replace all `generationStore.set()` with Supabase inserts/updates
- Replace all `generationStore.get()` with Supabase queries

**Priority 2: Fix or Replace PowerPoint Builder**
- Option A: Install `pptxgenjs` and fix the builder
- Option B: Use Gamma presentation API (which already works)
- Option C: Remove PowerPoint generation feature temporarily

## Testing Plan

After fixes:
1. User: "Create a presentation about quantum computing"
2. Verify: Outline appears in UI
3. User: "Generate the PowerPoint"
4. Verify: `presentation_generations` table has row with status='pending'
5. Wait 3 seconds
6. Verify: Frontend poll gets 200 response with status='processing'
7. Wait 15-30 seconds
8. Verify: Status updates to 'completed' with file_url
9. Verify: UI shows download link
10. User: Clicks download link
11. Verify: PowerPoint file downloads

## Related Files

1. `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/signaldeck-presentation/index.ts`
   - Lines 42: In-memory Map declaration
   - Lines 412-416: Status set to 'pending'
   - Lines 422-426: Status set to 'processing' (40%)
   - Lines 455-459: Status set to 'processing' (60%)
   - Lines 471-475: Status set to 'processing' (75%)
   - Lines 495-500: Status set to 'completed'
   - Lines 505-509: Status set to 'error'
   - Lines 529-556: Status check handler

2. `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/components/execute/NIVContentOrchestratorProduction.tsx`
   - Lines 1961-2037: `pollSignalDeckStatus()` function
   - Lines 1196-1217: Handler that starts polling

3. `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/api/build-presentation/`
   - Missing or has wrong dependencies

## Previous Related Fixes

- `SIGNALDECK_POLLING_FIX.md` - Added frontend polling (works)
- `SIGNALDECK_ORGID_FIX.md` - Fixed backend variable naming (works)
- `VERCEL_BUILD_FIX.md` - Fixed Vercel deployment (works)

This is the final piece needed to make PowerPoint generation work end-to-end.
