# NIV Frontend Integration Fix - Content Not Displaying

## Problem
Backend logs showed all 7 content pieces generated successfully, but **UI wasn't displaying them**.

## Root Cause
**Frontend was calling the wrong backend function!**

- **Backend generating content:** `niv-content-intelligent-v2` ✅
- **Frontend calling:** `niv-orchestrator-robust` ❌

The NIV Canvas Component (`NivCanvasComponent.tsx`) was hardcoded to use `niv-orchestrator-robust`, which doesn't return content in the `generation_complete` format.

## Files Modified

### 1. `/src/components/niv/NivCanvasComponent.tsx`

**Changed API calls from `niv-orchestrator-robust` to `niv-content-intelligent-v2`:**

#### Line 190 - Acknowledgment call:
```typescript
// BEFORE
const ackResponse = await fetch('/api/supabase/functions/niv-orchestrator-robust', {
  ...
  body: JSON.stringify({
    message: currentInput,
    sessionId: 'canvas-session',
    stage: 'acknowledge',
    context: { ... }
  })
})

// AFTER
const ackResponse = await fetch('/api/supabase/functions/niv-content-intelligent-v2', {
  ...
  body: JSON.stringify({
    message: currentInput,
    conversationHistory,
    stage: 'acknowledge',
    organizationContext: {
      conversationId: 'canvas-session',
      organizationId: organization?.id || '1',
      name: organization?.name || 'Organization',
      industry: organization?.industry || 'technology'
    }
  })
})
```

#### Line 225 - Full response call:
```typescript
// BEFORE
const response = await fetch('/api/supabase/functions/niv-orchestrator-robust', {
  ...
})

// AFTER
const response = await fetch('/api/supabase/functions/niv-content-intelligent-v2', {
  ...
})
```

#### Lines 256-293 - Added content display handler:
```typescript
// Handle content generation complete
if (data.mode === 'generation_complete' && data.generatedContent) {
  console.log('✅ Content Generated:', data.generatedContent)

  // Display completion message
  const nivResponse: Message = {
    id: (Date.now() + 2).toString(),
    role: 'niv',
    content: data.message || `✅ Generated ${data.generatedContent.length} content pieces`,
    timestamp: new Date()
  }
  setMessages(prev => [...prev, nivResponse])

  // Display each content piece
  data.generatedContent.forEach((item: any, index: number) => {
    const contentMsg: Message = {
      id: (Date.now() + 3 + index).toString(),
      role: 'niv',
      content: `**${item.type.replace('-', ' ').toUpperCase()}**\n\n${item.content}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, contentMsg])
  })

  // Show errors if any
  if (data.errors && data.errors.length > 0) {
    const errorMsg: Message = {
      id: (Date.now() + 100).toString(),
      role: 'niv',
      content: `⚠️ ${data.errors.length} piece(s) had errors:\n${data.errors.map((e: any) => `• ${e.type}: ${e.error}`).join('\n')}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, errorMsg])
  }

  setIsTyping(false)
  return
}
```

### 2. `/src/app/api/supabase/functions/niv-content-intelligent-v2/route.ts` (NEW)

Created proxy API route for NIV Content Intelligent v2:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing')
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(body)
      }
    )

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('NIV Content v2 proxy error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}
```

## How It Works Now

### User Flow:
1. User types: "i need a media plan for our agent builder launch"
2. NIV presents strategic options
3. User selects: "developer first approach"
4. **NIV now correctly calls `niv-content-intelligent-v2`**
5. Backend generates all 7 pieces (press release, media pitch, etc.)
6. **Frontend receives `mode: 'generation_complete'` response**
7. **UI displays each piece one by one in chat**

### Response Flow:
```
User Message
  ↓
Frontend: NivCanvasComponent
  ↓
API Proxy: /api/supabase/functions/niv-content-intelligent-v2
  ↓
Supabase Edge Function: niv-content-intelligent-v2
  ↓
Calls MCP Services (mcp-content)
  ↓
Returns: { mode: 'generation_complete', generatedContent: [...] }
  ↓
Frontend displays content in chat
```

## Testing

### Before Fix ❌
- Backend logs: "✅ press-release generated"
- Frontend: Nothing appears
- User sees: Empty response

### After Fix ✅
- Backend logs: "✅ press-release generated"
- Frontend receives: `{ mode: 'generation_complete', generatedContent: [...]}`
- User sees: Each content piece displayed in chat

## Related Fixes

This fix complements:
1. **NIV_CONTENT_GENERATION_BUGS_FIXED.md** - Fixed MCP parameter errors
2. **NIV_CONTENT_V2_FIXES_COMPLETE.md** - Fixed confirmation detection
3. **NIV_CLICHE_FIX_COMPLETE.md** - Fixed "democratize" clichés

## Status
✅ **Complete** - Frontend now properly connected to backend content generation

---

**Author:** Claude Code
**Date:** 2025-10-06
**Test:** Try "i need a media plan for agent builder" → select option → see all 7 pieces display
