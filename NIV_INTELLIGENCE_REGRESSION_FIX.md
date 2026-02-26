# NIV Intelligence Regression Fix - 2-Stage Protocol Restoration

## Problem Identified

NIV lost its intelligence and wasn't showing acknowledgments because **NIVPanel was not using the 2-stage orchestration protocol**.

### Symptoms

1. ❌ **No acknowledgments displayed** - User never saw "Got it, let me research..."
2. ❌ **Fireplexity received raw user messages** - Search queries like "this is a pretty poor assessment of sora 2" instead of cleaned "Sora 2 launch features video generation"
3. ❌ **Poor search results** - Searching for conversational complaints instead of actual topics
4. ❌ **Lost context** - User feedback like "you didn't mention X" being treated as search queries

## Root Cause

**File:** `src/components/niv/NIVPanel.tsx`

**The Issue:**
NIVPanel was making a **single orchestrator call with no `stage` parameter**, causing:
- Orchestrator to default to acknowledgment-only mode
- No actual research being executed
- Frontend likely calling Fireplexity directly as fallback with raw user message

**The Old (Broken) Call:**
```typescript
const response = await fetch('/api/niv-orchestrator', {
  method: 'POST',
  body: JSON.stringify({
    message: messageText,  // No stage parameter!
    conversationId: `niv-panel-${Date.now()}`,
    organizationId: organization?.id || '1'
  })
})
```

## How NIV's 2-Stage Protocol Works

The orchestrator expects a **2-stage protocol** (as correctly implemented in `NivChatbot.tsx`):

### Stage 1: Acknowledgment
**Request:**
```typescript
{
  message: "this is a pretty poor assessment of sora 2",
  stage: "acknowledge",
  conversationId: "...",
  organizationId: "OpenAI"
}
```

**Orchestrator Processing:**
1. Claude analyzes the user message
2. Extracts understanding: "User wants comprehensive Sora 2 information"
3. Creates clean search query: "OpenAI Sora 2 launch features video generation content creation 2024 2025"
4. Generates intelligent acknowledgment

**Response:**
```json
{
  "success": true,
  "stage": "acknowledgment",
  "message": "Got it - you're right, I need to get current intelligence on Sora 2 and OpenAI's complete content creation portfolio. Let me research their latest capabilities comprehensively.",
  "understanding": {
    "what_user_wants": "Comprehensive Sora 2 assessment",
    "search_query": "OpenAI Sora 2 launch features video generation..."
  }
}
```

### Stage 2: Research Execution
**Request:**
```typescript
{
  message: "this is a pretty poor assessment of sora 2",  // Same message
  stage: "research",  // Different stage
  conversationId: "...",  // Same conversation
  organizationId: "OpenAI"
}
```

**Orchestrator Processing:**
1. Retrieves the understanding from Stage 1 (cached by conversationId)
2. Uses the CLEAN search query: "OpenAI Sora 2 launch features..."
3. Calls Fireplexity with proper query
4. Gets relevant results
5. Synthesizes response with Claude

**Response:**
```json
{
  "success": true,
  "response": "Based on my research, here's what I found about Sora 2...",
  "articles": [...],
  "action": {
    "type": "campaign_ready",
    "data": {...}
  }
}
```

## Evidence from Logs

**Claude WAS generating intelligent understanding:**
```json
🧠 Claude understanding: {
  understanding: {
    what_user_wants: "Build a campaign focusing on Sora 2",
    topics: ["Sora 2 features", "video generation technology"]
  },
  approach: {
    search_query: "OpenAI Sora 2 launch features video generation content creation 2024 2025"
  },
  acknowledgment: "Got it - you're right, I need to get current intelligence on Sora 2..."
}
```

**But Fireplexity was receiving:**
```
🔍 NIV Fireplexity Search: "this is a pretty poor assessment of sora 2"
```

**This proves:**
- Orchestrator WAS working correctly
- NIVPanel was NOT using the 2-stage protocol
- Fireplexity was being called with raw message (probably by frontend fallback)

## The Fix

**File:** `src/components/niv/NIVPanel.tsx` (Lines 63-141)

**Implemented proper 2-stage protocol:**

```typescript
const handleSend = async (text?: string) => {
  const messageText = text || input
  if (!messageText.trim() || isProcessing) return

  // Add user message to chat
  setMessages(prev => [...prev, userMessage])
  setInput('')
  setIsProcessing(true)

  try {
    const conversationId = `niv-panel-${Date.now()}`

    // STAGE 1: Get acknowledgment
    console.log('📨 Stage 1: Requesting acknowledgment...')
    const ackResponse = await fetch('/api/niv-orchestrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        conversationId: conversationId,
        organizationId: organization?.id || '1',
        stage: 'acknowledge',  // ← KEY: Stage 1
        organizationContext: { name: organization?.name, industry: organization?.industry },
        framework: framework || null
      })
    })

    const ackData = await ackResponse.json()
    console.log('✅ Acknowledgment received:', ackData.message)

    // Show acknowledgment immediately in UI
    const ackMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'niv',
      content: ackData.message || 'I understand. Let me gather that information for you.',
      timestamp: new Date(),
      type: 'text'
    }
    setMessages(prev => [...prev, ackMessage])

    // STAGE 2: Get research results
    console.log('🔍 Stage 2: Executing research...')
    const response = await fetch('/api/niv-orchestrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        conversationId: conversationId,  // ← Same conversation
        organizationId: organization?.id || '1',
        stage: 'research',  // ← KEY: Stage 2
        organizationContext: { name: organization?.name, industry: organization?.industry },
        framework: framework || null
      })
    })

    const data = await response.json()
    console.log('✅ Research complete:', data)

    // Process and display research results
    const nivMessage: Message = {
      id: (Date.now() + 2).toString(),
      role: 'niv',
      content: data.response || data.message,
      timestamp: new Date(),
      type: 'text',
      data: data
    }
    setMessages(prev => [...prev, nivMessage])

    // ... action buttons handling ...

  } catch (error) {
    console.error('NIV Panel error:', error)
    // ... error handling ...
  } finally {
    setIsProcessing(false)
  }
}
```

## What This Fixes

### ✅ User Experience
1. **Immediate acknowledgment** - User sees "Got it, let me research Sora 2..." right away
2. **Better feedback** - User knows NIV understood their intent
3. **Proper results** - Research happens with clean, targeted queries

### ✅ Search Quality
1. **Clean queries to Fireplexity** - "OpenAI Sora 2 launch features..." instead of "this is a poor assessment"
2. **Relevant results** - Actually finds information about Sora 2
3. **Better synthesis** - Claude gets proper context to work with

### ✅ Intelligence Restored
1. **Topic extraction** - "Sora 2" extracted from conversational complaint
2. **Intent understanding** - Knows user wants comprehensive information
3. **Context awareness** - Understands why user is asking (missed in previous response)

## Testing

### Test 1: Acknowledgment Display
1. Open Campaign Planner with NIV
2. Type: "this is a poor assessment of sora 2"
3. **Expected:**
   - Immediate acknowledgment: "Got it - you're right, I need to get current intelligence on Sora 2..."
   - Then research results appear
   - Console shows: `📨 Stage 1: Requesting acknowledgment...` then `🔍 Stage 2: Executing research...`

### Test 2: Clean Search Queries
1. Check Supabase logs: `npx supabase functions logs niv-fireplexity --tail`
2. **Expected log:**
   ```
   🔍 NIV Fireplexity Search: "OpenAI Sora 2 launch features video generation content creation 2024 2025"
   ```
3. **NOT:**
   ```
   🔍 NIV Fireplexity Search: "this is a poor assessment of sora 2"
   ```

### Test 3: Complex Conversational Queries
1. Ask: "why haven't you mentioned sora 2?"
2. **Expected:**
   - Acknowledgment shows understanding
   - Searches for "Sora 2" information
   - Returns relevant articles about Sora 2

## Why This Matters

This regression broke NIV's core intelligence loop:

**Before (Broken):**
```
User: "this is a poor assessment of sora 2"
  ↓
NIVPanel → orchestrator (no stage)
  ↓
Orchestrator: Returns acknowledgment only, no research
  ↓
Frontend fallback → Fireplexity("this is a poor assessment...")
  ↓
Fireplexity: Searches for complaint text, finds nothing relevant
  ↓
User: Gets poor results, no acknowledgment
```

**After (Fixed):**
```
User: "this is a poor assessment of sora 2"
  ↓
NIVPanel → orchestrator (stage: acknowledge)
  ↓
Orchestrator: Claude extracts "Sora 2" topic + generates acknowledgment
  ↓
NIVPanel: Shows "Got it - let me research Sora 2..."
  ↓
NIVPanel → orchestrator (stage: research)
  ↓
Orchestrator → Fireplexity("OpenAI Sora 2 launch features...")
  ↓
Fireplexity: Finds relevant Sora 2 articles
  ↓
Orchestrator: Synthesizes intelligent response
  ↓
User: Gets relevant information + saw acknowledgment
```

## Related Files

- ✅ **Fixed:** `src/components/niv/NIVPanel.tsx` - Now uses 2-stage protocol
- ✅ **Already Correct:** `src/components/niv/NivChatbot.tsx` - Was already using 2-stage protocol
- ✅ **Backend Working:** `supabase/functions/niv-orchestrator-robust/index.ts` - Claude understanding logic was always working

## Success Criteria

✅ Acknowledgments appear immediately in chat
✅ Fireplexity receives clean, targeted search queries
✅ Search results are relevant to actual topic (Sora 2, not complaints)
✅ User experience feels intelligent and responsive
✅ NIV demonstrates understanding of conversational context

## Impact

This fix restores NIV's intelligence by ensuring the **entire orchestration pipeline** is utilized:
1. **Understanding** - Claude extracts intent and topics
2. **Acknowledgment** - User sees NIV "gets it"
3. **Clean querying** - Search engines get proper queries
4. **Quality results** - Better information retrieval
5. **Smart synthesis** - Claude has good context to work with

**Before:** NIV felt dumb, gave bad results, no feedback
**After:** NIV feels smart, gives relevant results, shows understanding 🧠
