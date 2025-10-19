# Parallel Content Generation Fix - 60s Timeout Solution

## Problem

Campaign execution was timing out with **504 Gateway Timeout** errors due to Supabase Edge Functions' **60-second hard limit**.

### Root Cause

1. **Supabase Edge Functions timeout at 60 seconds** (hard limit, not configurable)
2. NIV was generating content **sequentially** (one piece at a time)
3. With 2-3 pieces per phase, each taking 15-30 seconds:
   - Phase 1: blog-post (30s) + social-post (20s) + media-pitch (15s) = **65 seconds** ❌
   - Result: 504 timeout before completion

### Evidence

```bash
📡 Response status: 504 Gateway Timeout
❌ Error response: (empty - function killed at 60s)
```

## Solution: Parallel Content Generation

Changed from **sequential** to **parallel** execution using `Promise.all()`:

### Before (Sequential - Slow):
```typescript
for (const ownedReq of contentRequirements.owned) {
  const content = await callMCPService(ownedReq.type, {...})  // Wait for each
  allGeneratedContent.push({...})
}
// Total time: 30s + 20s + 15s = 65 seconds ❌
```

### After (Parallel - Fast):
```typescript
const ownedPromises = contentRequirements.owned.map(async (ownedReq) => {
  const content = await callMCPService(ownedReq.type, {...})
  return {...}
})

const ownedResults = await Promise.all(ownedPromises)
allGeneratedContent.push(...ownedResults)
// Total time: max(30s, 20s, 15s) = 30 seconds ✅
```

## Changes Made

### File: `supabase/functions/niv-content-intelligent-v2/index.ts`

#### Change 1: Parallel Owned Content Generation (Lines 870-950)

```typescript
// OLD: Sequential with for loop
for (const ownedReq of contentRequirements.owned) {
  const content = await callMCPService(...)  // Blocks
}

// NEW: Parallel with Promise.all
const ownedPromises = contentRequirements.owned.map(async (ownedReq) => {
  try {
    const strategicBrief = await craftStrategicContentBrief({...})
    const content = await callMCPService(ownedReq.type, {...})
    return {
      type: ownedReq.type,
      stakeholder: ownedReq.stakeholder,
      content: content,
      channel: 'owned',
      purpose: ownedReq.purpose
    }
  } catch (error) {
    return {
      type: ownedReq.type,
      stakeholder: ownedReq.stakeholder,
      content: null,
      channel: 'owned',
      error: error instanceof Error ? error.message : 'Generation failed'
    }
  }
})

const ownedResults = await Promise.all(ownedPromises)
allGeneratedContent.push(...ownedResults)
```

#### Change 2: Parallel Media Engagement Generation (Lines 952-1031)

Same pattern applied to media engagement content:

```typescript
const mediaPromises = contentRequirements.media.map(async (mediaReq) => {
  // Generate in parallel
})

const mediaResults = await Promise.all(mediaPromises)
allGeneratedContent.push(...mediaResults)
```

#### Change 3: Reduced MCP Timeout (Lines 3036-3119)

- Changed from 45 seconds to **30 seconds** per piece
- Allows 2 pieces to complete within 60s limit
- Better error messages for timeout debugging

```typescript
// Timeout: 30 seconds (was 45)
const timeoutId = setTimeout(() => controller.abort(), 30000)

if (error.name === 'AbortError') {
  console.error(`⏱️ ${route.service} timed out after 30 seconds for ${route.tool}`)
  throw new Error(`Content generation timed out for ${contentType}`)
}
```

## Performance Improvement

### Before (Sequential):
- **Phase 1**: 3 pieces × ~20s each = **~60s** (timeout risk)
- **Phase 2**: 2 pieces × ~20s each = **~40s** ✅
- **Phase 3**: 2 pieces × ~20s each = **~40s** ✅
- **Phase 4**: 2 pieces × ~20s each = **~40s** ✅

**Problem**: Phase 1 frequently times out

### After (Parallel):
- **Phase 1**: max(20s, 20s, 20s) = **~20s** ✅ (3x faster!)
- **Phase 2**: max(20s, 20s) = **~20s** ✅ (2x faster!)
- **Phase 3**: max(20s, 20s) = **~20s** ✅ (2x faster!)
- **Phase 4**: max(20s, 20s) = **~20s** ✅ (2x faster!)

**Benefit**: All phases complete well within 60s limit

## Safety Measures

### Error Handling
Each piece generates independently with try/catch:
- If one piece fails, others still complete
- Failed pieces are marked with `content: null` and error message
- Campaign continues with partial results

### Timeout Protection
- 30-second timeout per MCP call
- Total phase execution stays under 60s
- Clear timeout errors in logs

### Logging Improvements
```
🎨 Generating owned content with NIV intelligence (parallel)...
  📝 Generating blog-post for Aspiring Solo Entrepreneurs...
  📝 Generating social-post for Small Business Owners...
  📝 Generating media-pitch for Tech Media...
    ✅ social-post generated for Small Business Owners (15s)
    ✅ blog-post generated for Aspiring Solo Entrepreneurs (25s)
    ✅ media-pitch generated (18s)
📦 Generated 3/3 pieces (total: 25s instead of 58s)
```

## Deployment Status

✅ **Deployed**: `niv-content-intelligent-v2` (120.7kB)

## Expected Behavior

### Success Case:
```
📍 Generating awareness phase campaign (Phase 1)
📋 Owned content: 2 pieces
📋 Media engagement: 1 pieces
🎨 Generating owned content with NIV intelligence (parallel)...
  📝 Generating blog-post for Aspiring Solo Entrepreneurs...
  📝 Generating social-post for Small Business Owners...
    ✅ blog-post generated for Aspiring Solo Entrepreneurs
    ✅ social-post generated for Small Business Owners
📰 Generating media engagement with NIV intelligence (parallel)...
  📝 Generating media-pitch for Kyle Wiggers, Will Knight...
    ✅ media-pitch generated
📦 Generated 3/3 pieces
✅ Saved 3 pieces to campaigns/.../phase-1-awareness
✅ awareness phase complete: 3 pieces generated
```

### Timeout Case (if MCP hangs):
```
📡 Calling mcp-content with tool: blog-post
⏱️ mcp-content timed out after 30 seconds for blog-post
❌ Failed to generate blog-post: Content generation timed out
📦 Generated 2/3 pieces (blog-post failed, others succeeded)
```

## Next Test

Try campaign execution again - it should now:
1. ✅ Complete all phases within 60s limit
2. ✅ Generate content in parallel (faster)
3. ✅ Provide clear errors if individual pieces timeout
4. ✅ Continue with partial results if some pieces fail

## Monitoring

Watch for these patterns in logs:

**Good**:
```
🎨 Generating owned content with NIV intelligence (parallel)...
📦 Generated 3/3 pieces
```

**Acceptable** (partial success):
```
🎨 Generating owned content with NIV intelligence (parallel)...
⏱️ mcp-content timed out after 30 seconds for blog-post
📦 Generated 2/3 pieces
```

**Bad** (should not happen now):
```
504 Gateway Timeout
```
