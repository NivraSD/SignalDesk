# Campaign Execution Timeout Issue - Analysis & Fix

## Problem

Campaign execution is failing with a 504 timeout error. The user reported:
- Frontend shows: `❌ Content generation failed: {"error":"Executor failed: 504 - ""}`
- NIV starts generating content but seems to stop mid-execution

## Root Cause Analysis

From the logs (`logs.md`), I identified the exact failure point:

### What's Happening:

1. **Phase 1 (Awareness)** starts execution ✅
2. NIV generates the strategic brief ✅
3. NIV calls `mcp-content` with tool: `blog-post` ✅
4. **`mcp-content` never responds** ❌
5. NIV waits indefinitely (no timeout)
6. Executor times out after ~60 seconds
7. Frontend receives 504 error

### Evidence from Logs:

```
Line 11: 📡 Calling mcp-content with tool: blog-post
Line 3: Context preview: { narrative: "", positioning: "AI-Powered Entrepreneurship", ... }
[NO RESPONSE OR ERROR LOGGED]
[Next log is "shutdown" indicating timeout]
```

### Previous Successful Execution (Phase 2):

```
Line 659: ❌ Failed to generate case-study-series: Error: Unknown content type: case-study-series
Line 675: ⚠️ Unknown content type: "case-study-series" (normalized to "case-study-series")
```

This shows that:
- Unknown content types fail immediately with error (good)
- But known content types (`blog-post`) that `mcp-content` can't handle just hang (bad)

## The Real Issue: MCP-Content Bottleneck

You correctly identified that **mcp-content is being asked to make multiple different content types**, and it's likely:

1. **Getting stuck or confused** when processing complex requests
2. **Taking too long** to generate content (>60 seconds)
3. **No timeout mechanism** to fail gracefully
4. **No response** even on error

### Current Architecture (Problematic):

```
Executor → NIV → mcp-content (HANGS)
  ↓          ↓
60s timeout  No timeout = infinite wait
```

## Fixes Applied

### Fix 1: Add Timeout to MCP Service Calls ✅

**File**: `supabase/functions/niv-content-intelligent-v2/index.ts:3036-3123`

**What Changed**:
- Added 45-second timeout using AbortController
- Clear timeout on success or error
- Better error messages for timeout vs other errors

```typescript
// Create timeout controller - 45 seconds for content generation
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 45000)

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/${route.service}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    signal: controller.signal,  // NEW: Abort signal
    body: JSON.stringify({...})
  }
)

// Clear timeout on success
clearTimeout(timeoutId)

// ... handle response ...

} catch (error) {
  clearTimeout(timeoutId)

  if (error.name === 'AbortError') {
    console.error(`⏱️ ${route.service} timed out after 45 seconds for ${route.tool}`)
    throw new Error(`Content generation timed out for ${contentType}`)
  }

  throw error
}
```

**Benefits**:
- NIV will fail fast (45s) instead of hanging indefinitely
- Error will propagate up with clear timeout message
- Executor can continue with next phase or fail gracefully
- Better logs: `⏱️ mcp-content timed out after 45 seconds for blog-post`

### Fix 2: Better Error Logging ✅

Added success logging to confirm when MCP responds:
```typescript
console.log(`✅ ${route.service} responded successfully for ${route.tool}`)
```

This helps us see exactly which content types succeed vs timeout.

## Expected Behavior After Fix

### Before (Hanging):
```
📡 Calling mcp-content with tool: blog-post
[HANGS FOREVER]
[Executor timeout at 60s]
❌ 504 Error
```

### After (Fast Fail):
```
📡 Calling mcp-content with tool: blog-post
[Wait up to 45s]
⏱️ mcp-content timed out after 45 seconds for blog-post
❌ Failed to generate blog-post: Content generation timed out
[Continue to next piece or fail gracefully]
```

## Deployment Status

✅ **Deployed**: `niv-content-intelligent-v2` (120.7kB)

## Next Steps for Investigation

If timeouts continue, we need to investigate **why `mcp-content` is hanging**:

### Potential Causes:

1. **MCP-Content is stuck in an infinite loop** when processing certain content types
2. **Anthropic API calls are timing out** inside mcp-content
3. **MCP-Content has no timeout** on its own API calls
4. **Request payload is too large** or malformed
5. **Concurrent requests** are causing deadlock (though we process sequentially)

### Debug Steps:

1. **Check mcp-content logs** directly:
   ```bash
   # View mcp-content logs
   supabase functions logs mcp-content --limit 50
   ```

2. **Test mcp-content directly** with the same payload NIV sends:
   ```javascript
   // Test blog-post generation directly
   fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-content', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer SERVICE_KEY'
     },
     body: JSON.stringify({
       tool: 'blog-post',
       parameters: {
         organization: 'OpenAI',
         subject: 'Create an actionable guide...',
         // ... rest of params from NIV
       }
     })
   })
   ```

3. **Add timeout to mcp-content itself**:
   - Find where mcp-content calls Anthropic API
   - Add AbortController timeout there too
   - Set to 40 seconds (less than NIV's 45s)

4. **Consider breaking up large requests**:
   - If strategic brief is too long (>200 chars shown in logs)
   - May need to truncate or summarize for MCP

## Monitoring

After this fix, look for these log patterns:

### Success:
```
📡 Calling mcp-content with tool: blog-post
✅ mcp-content responded successfully for blog-post
✅ blog-post generated for Aspiring Solo Entrepreneurs
```

### Timeout (new clear error):
```
📡 Calling mcp-content with tool: blog-post
⏱️ mcp-content timed out after 45 seconds for blog-post
❌ Failed to generate blog-post: Content generation timed out
```

### Unknown type (already working):
```
⚠️ Unknown content type: "case-study-series" (normalized to "case-study-series")
❌ Failed to generate case-study-series: Error: Unknown content type: case-study-series
```

## Summary

**Immediate Fix**: ✅ Added 45-second timeout to prevent infinite hangs
**Root Cause**: `mcp-content` is taking too long or hanging on blog-post generation
**Next Action**: Investigate why mcp-content hangs on blog-post (likely Anthropic API timeout inside mcp-content)

The timeout fix will at least make the system **fail fast and informatively** instead of hanging for 60+ seconds with no feedback.
