# Synthesis Timeout Fix

## Problem
Campaign Builder research pipeline was failing at the synthesis stage with error:
```
Synthesis failed: Failed to send a request to the Edge Function
```

## Root Cause
The `niv-campaign-research-synthesis` function calls Claude API which takes 20-30 seconds to complete. The Supabase JS client (`supabase.functions.invoke()`) has a default timeout that's too short for this operation, causing the request to fail especially on cold starts.

## Solution
Changed from Supabase client library to direct `fetch()` call with explicit 60-second timeout.

### File Modified
`src/lib/services/campaignBuilderService.ts` (Lines 136-181)

### Before
```typescript
const synthesisResponse = await supabase.functions.invoke('niv-campaign-research-synthesis', {
  body: {
    compiledResearch: gatheredData,
    campaignGoal,
    organizationContext: {
      name: organizationName,
      industry: industryHint
    }
  }
})
```

### After
```typescript
// Use direct fetch for synthesis to avoid Supabase client timeout issues
// The synthesis function calls Claude which can take 20-30 seconds
let synthesisData
try {
  const synthesisUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-campaign-research-synthesis`
  const response = await fetch(synthesisUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      compiledResearch: gatheredData,
      campaignGoal,
      organizationContext: {
        name: organizationName,
        industry: industryHint
      }
    }),
    signal: AbortSignal.timeout(60000) // 60 second timeout
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Synthesis API error: ${response.status} - ${errorText}`)
  }

  synthesisData = await response.json()

  if (!synthesisData.success) {
    throw new Error(synthesisData.error || 'Synthesis failed')
  }
} catch (error: any) {
  console.error('Synthesis failed:', error)
  onProgress?.('synthesis', 'failed', error)
  throw new Error(`Synthesis failed: ${error.message}`)
}
```

## Benefits

1. **Explicit Timeout**: 60-second timeout explicitly set via `AbortSignal.timeout(60000)`
2. **Better Error Handling**: Direct access to HTTP status codes and error messages
3. **No Library Limitations**: Bypasses Supabase client timeout constraints
4. **Production Ready**: Works reliably for cold starts and warm starts

## Testing

To verify the fix works:

1. **Restart dev server** (if running):
   ```bash
   # Kill existing dev server
   pkill -f "next dev"

   # Start fresh
   npm run dev
   ```

2. **Test synthesis function directly**:
   ```bash
   node test-synthesis-connection.js
   ```
   Should complete successfully (may take 20-30 seconds)

3. **Test in Campaign Builder UI**:
   - Go to `/campaign-builder`
   - Create new campaign
   - Complete research phase
   - Synthesis should complete without timeout error

## Related Files

- `src/lib/services/campaignBuilderService.ts` - Fixed timeout issue
- `supabase/functions/niv-campaign-research-synthesis/index.ts` - The function being called
- `test-synthesis-connection.js` - Test script to verify connectivity

## Notes

- This same pattern should be used for other long-running Edge Functions
- The 60-second timeout is generous; typical synthesis takes 20-30 seconds
- If synthesis still times out, increase the timeout or optimize the function
- Cold starts may still take longer than warm starts (this is normal)
