# Opportunity Engine Progress Improvements - Complete

## Issues Fixed

### 1. Gamma Polling Timeout
**Problem**: Gamma polling stopped after 60 seconds (12 attempts × 5s), but Gamma takes longer to generate

**Solution**:
- Increased polling to **2 minutes** (24 attempts × 5s)
- Added time-based progress display: "Gamma generating... (45s / 120s)"
- Shows warning if polling exhausted: "⚠️ Gamma still generating (check dashboard)"
- Handles error status from Gamma API

### 2. Generic "Executing..." Spinner
**Problem**: Only showed spinning loader with no visibility into what's happening

**Solution**: Added detailed progress tracking throughout execution:

#### Progress Stages:

1. **Initial Setup (10%)**
   - "Preparing campaign execution..."

2. **Content Generation (20-85%)**
   - Shows total pieces being generated
   - Simulates progress over ~90 seconds
   - Updates every 3 seconds: "Generating content... (~3/7 pieces)"
   - Final: "✅ Generated 7/7 content pieces"

3. **Gamma Presentation (90-98%)**
   - "Generating Gamma presentation..."
   - Time-based progress: "Gamma generating... (15s / 120s)"
   - Incremental progress bar from 90% to 98%
   - Success: "✅ Gamma presentation ready!"
   - Timeout warning: "⚠️ Gamma still generating (check dashboard)"

4. **Complete (100%)**
   - "✅ Campaign execution complete!"

## Implementation Details

### Progress Simulator for Content Generation
```typescript
// Simulates progress from 20% to 80% over ~90 seconds
let simulatedProgress = 20
progressInterval = setInterval(() => {
  if (simulatedProgress < 80) {
    simulatedProgress += 2
    const piecesEstimate = Math.floor((simulatedProgress - 20) / 60 * totalPieces)
    setGenerationProgress({
      current: `Generating content... (~${piecesEstimate}/${totalPieces} pieces)`,
      progress: simulatedProgress
    })
  }
}, 3000) // Update every 3 seconds
```

### Gamma Polling Improvements
```typescript
// Increased from 12 to 24 attempts (60s -> 120s)
const maxAttempts = 24
for (let i = 0; i < maxAttempts; i++) {
  setGenerationProgress({
    current: `Gamma generating... (${i * 5}s / ${maxAttempts * 5}s)`,
    progress: 90 + (i / maxAttempts) * 8 // 90-98%
  })

  await new Promise(resolve => setTimeout(resolve, 5000))

  const { data: statusData } = await supabase.functions.invoke('gamma-presentation', {
    body: { generationId: gammaData.generationId }
  })

  if (statusData?.status === 'completed' && statusData.gammaUrl) {
    presentationUrl = statusData.gammaUrl
    setGenerationProgress({ current: '✅ Gamma presentation ready!', progress: 98 })
    break
  }

  if (statusData?.status === 'error') {
    setGenerationProgress({ current: '⚠️ Gamma generation failed', progress: 90 })
    break
  }
}
```

### Cleanup
- Progress interval is properly cleaned up in `finally` block
- Prevents memory leaks
- Ensures UI state is reset after 3 seconds

## User Experience

### Before:
- Execute button shows "Executing..." with spinner
- No visibility into what's happening
- Gamma polling times out at 60 seconds
- User unsure if system is working

### After:
- **Stage 1**: "Preparing campaign execution..." (10%)
- **Stage 2**: "Generating content... (~3/7 pieces)" (20-85%)
  - Updates every 3 seconds
  - Shows estimated progress
- **Stage 3**: "✅ Generated 7/7 content pieces" (85%)
- **Stage 4**: "Gamma generating... (45s / 120s)" (90-98%)
  - Time-based progress
  - 2-minute timeout instead of 1 minute
- **Stage 5**: "✅ Gamma presentation ready!" (98%)
- **Stage 6**: "✅ Campaign execution complete!" (100%)

### Error Handling:
- Content generation error: "❌ Error: [message]"
- Gamma generation error: "⚠️ Gamma generation failed"
- Gamma timeout: "⚠️ Gamma still generating (check dashboard)"

## Testing

To test:
1. Open Opportunities module
2. Execute a V2 opportunity
3. Watch progress messages update throughout:
   - Initial preparation
   - Content generation with estimated pieces
   - Successful content completion
   - Gamma generation with time counter
   - Final completion
4. Verify Gamma now waits full 2 minutes for completion

## Technical Notes

- Progress simulation provides user feedback during long-running operations
- Actual content generation time: ~60-90 seconds for 5-10 pieces
- Gamma generation time: ~60-120 seconds
- Total execution time: ~2-4 minutes for full campaign
- All progress updates are non-blocking and don't affect actual generation

## Files Modified

- `/src/components/modules/OpportunitiesModule.tsx` (lines 180, 220-240, 272-333, 380-383)

## Benefits

1. **User Confidence**: Clear visibility into what's happening
2. **Better UX**: No more "is it stuck?" moments
3. **Realistic Timing**: Gamma now has enough time to complete
4. **Error Awareness**: Clear messaging when things fail
5. **Time Estimates**: Users know how long to expect
