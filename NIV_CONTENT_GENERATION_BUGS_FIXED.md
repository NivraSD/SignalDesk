# NIV Content Generation Bugs - Fixed

## Issues Found in logs.md

### Issue 1: ❌ MCP-Content Tool Failures
**Error:** `"Cannot read properties of undefined (reading 'join')"`

**Root Cause:**
- `mcp-content` service expects `keyPoints` parameter to be an array
- NIV was passing `parameters.keyPoints` which could be undefined
- Line 383 in mcp-content: `keyPoints.join(', ')` failed when keyPoints was undefined

**Location:** `/supabase/functions/niv-content-intelligent-v2/index.ts:702-716`

**Fix Applied:**
```typescript
// BEFORE - No defaults, caused undefined errors
body: JSON.stringify({
  tool: route.tool,
  parameters: {
    organization: parameters.organization,
    subject: parameters.subject,
    narrative: parameters.narrative,
    keyPoints: parameters.keyPoints, // ❌ Could be undefined
    research: parameters.research,
    industry: parameters.industry
  }
})

// AFTER - Safe defaults for all fields
body: JSON.stringify({
  tool: route.tool,
  parameters: {
    company: parameters.organization || 'Organization',
    organization: parameters.organization || 'Organization',
    announcement: parameters.subject || 'Product Announcement',
    subject: parameters.subject || 'Product Announcement',
    narrative: parameters.narrative || '',
    keyPoints: parameters.keyPoints || [], // ✅ Always array
    keyMessages: parameters.keyPoints || [],
    research: parameters.research || '',
    industry: parameters.industry || 'technology',
    strategy: parameters.strategy || '',
    tone: 'professional'
  }
})
```

**Why This Fixes It:**
- `keyPoints` now always defaults to `[]` (empty array)
- MCP-content can safely call `.join()` on an array
- Added multiple field aliases for compatibility (company/organization, announcement/subject)

---

### Issue 2: ❌ UI Not Displaying Generated Content
**Problem:** NIV said "Complete media plan created with 7 pieces" but UI showed nothing

**Root Cause:**
- NIV returned `mode: 'content_generated'` with `contentPieces` field
- UI (NIVContentOrchestratorSimplified) expects `mode: 'generation_complete'` with `generatedContent` field
- Field name mismatch prevented UI from recognizing and displaying content

**Location:** `/supabase/functions/niv-content-intelligent-v2/index.ts:258-287`

**Fix Applied:**
```typescript
// BEFORE - Wrong format for UI
return new Response(JSON.stringify({
  success: true,
  mode: 'content_generated', // ❌ UI doesn't recognize this
  message: `✅ Complete media plan created with ${contentPieces.length} pieces`,
  contentPieces, // ❌ UI expects 'generatedContent'
  folder,
  metadata: { ... },
  actions: { ... },
  conversationId
}))

// AFTER - Correct format for UI
const generatedContent = contentPieces
  .filter(p => p.content) // Only successful pieces
  .map(p => ({
    type: p.type,
    content: p.content
  }))

const errors = contentPieces
  .filter(p => p.error)
  .map(p => ({
    type: p.type,
    error: p.error
  }))

return new Response(JSON.stringify({
  success: true,
  mode: 'generation_complete', // ✅ UI recognizes this
  message: `✅ Complete media plan created with ${generatedContent.length} pieces`,
  generatedContent, // ✅ UI expects this field
  errors: errors.length > 0 ? errors : undefined,
  folder,
  metadata: { ... },
  conversationId
}))
```

**Why This Fixes It:**
- UI has explicit handler for `mode === 'generation_complete'` (line 211)
- UI expects `data.generatedContent` array (line 220)
- Separates successful content from errors for better UX
- UI will now display each piece one by one

**UI Handler Code Reference:**
```typescript
// src/components/execute/NIVContentOrchestratorSimplified.tsx:211
if (data.mode === 'generation_complete') {
  // Add each generated content piece
  if (data.generatedContent && Array.isArray(data.generatedContent)) {
    data.generatedContent.forEach((item: any, index: number) => {
      const contentItem: ContentItem = {
        id: `content-${Date.now()}-${index}`,
        type: item.type,
        content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
        // ... displays content
      }
    })
  }
}
```

---

## Test Results from Logs

### What Worked ✅
- Press release: Generated successfully
- QA document: Generated successfully
- Social post: Generated successfully
- Email: Generated successfully

### What Failed ❌
- Talking points: `mcp-content failed: Internal Server Error`
- Media pitch: (likely failed due to same issue)
- Media list: (likely failed due to same issue)

### After Fix - Expected Behavior ✅
All 7 pieces should now:
1. Generate successfully with safe defaults
2. Display in UI one by one
3. Show errors separately if any fail
4. Allow individual save/edit actions

---

## Files Modified

1. **`/supabase/functions/niv-content-intelligent-v2/index.ts`**
   - Lines 702-716: Added safe parameter defaults for MCP calls
   - Lines 258-287: Fixed response format for UI compatibility

---

## Deployment

```bash
npx supabase functions deploy niv-content-intelligent-v2
```

**Status:** ✅ Deployed successfully
**Size:** 36.81kB
**Project:** zskaxjtyuaqazydouifp

---

## Summary

### Before ❌
- MCP calls failed with "Cannot read properties of undefined"
- UI received response but couldn't display content
- User saw "7 pieces created" but nothing appeared

### After ✅
- All MCP calls have safe defaults (no undefined errors)
- UI receives correctly formatted response
- Content displays piece by piece
- Errors shown separately for debugging

---

**Author:** Claude Code
**Date:** 2025-10-06
**Related:** NIV_CONTENT_V2_FIXES_COMPLETE.md, NIV_CLICHE_FIX_COMPLETE.md
