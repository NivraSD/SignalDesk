# NIV Advisor Conversation Persistence Fix

## Root Causes

### 1. No Conversation Persistence
**Problem**: NIV Panel creates brand new conversationId for EVERY message
```typescript
// Line 75 - NIVPanel.tsx
const conversationId = `niv-${Date.now()}` // NEW ID EVERY TIME!
```

**Impact**:
- NIV has zero memory of previous messages
- Each query is treated as standalone
- User says "we were talking about ed-tech" → NIV has no clue
- No learning or context building

### 2. Conversation History Never Sent
**Problem**: Messages stored locally but never sent to backend
```typescript
// NIVPanel.tsx - Line 82-92
body: JSON.stringify({
  message: messageText,
  conversationId: conversationId, // NEW ID!
  // NO conversation history sent
})
```

**Impact**:
- Backend gets empty conversation history
- Can't reference previous messages
- Can't build on prior research
- Can't maintain conversation flow

### 3. API Route Hardcoded Empty Array
**Problem**: API route sends empty conversation history regardless
```typescript
// /src/app/api/niv-orchestrator/route.ts - Line 51
conversationHistory: [], // ALWAYS EMPTY!
```

**Impact**:
- Even if frontend sent history, it wouldn't be forwarded
- NIV Advisor edge function gets no context
- Cannot maintain conversation state

### 4. Outdated AI Model Keywords
**Problem**: Keywords still reference old models
```typescript
// mcp_discovery table still has:
Keywords: OpenAI, ChatGPT, GPT-4o, GPT-4o-mini, o1
```

**Missing**:
- Claude Sonnet 4, Sonnet 4.5, Sonnet 3.7
- GPT-5 (rumored)
- Sora 2.0
- Gemini 2.0

## Solution: Comprehensive Conversation Persistence

### Change 1: NIV Panel - Persistent ConversationId

**File**: `/src/components/niv/NIVPanel.tsx`

**Current (lines 75-92)**:
```typescript
const conversationId = `niv-${Date.now()}` // NEW ID EVERY MESSAGE!

const ackResponse = await fetch('/api/niv-orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: messageText,
    conversationId: conversationId,
    organizationId: organization?.id || '1',
    organizationContext: {
      name: organization?.name || 'Unknown',
      industry: organization?.industry || 'Technology',
      competitors: organization?.competitors || []
    },
    stage: 'acknowledge'
  })
})
```

**Fix: Add persistent conversationId and build history**:
```typescript
// Add to component state (after line 35)
const [conversationId] = useState(`niv-${Date.now()}`) // PERSISTENT ID!

// Function to convert messages to conversation history format
const buildConversationHistory = () => {
  return messages
    .filter(m => m.role !== 'niv' || !m.content.includes('Hi, I\'m NIV')) // Skip welcome
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
}

// Update API calls (lines 79-126) to include history
const conversationHistory = buildConversationHistory()

const ackResponse = await fetch('/api/niv-orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: messageText,
    conversationId: conversationId, // SAME ID THROUGHOUT SESSION!
    conversationHistory: conversationHistory, // SEND FULL HISTORY!
    organizationId: organization?.id || '1',
    organizationContext: {
      name: organization?.name || 'Unknown',
      industry: organization?.industry || 'Technology',
      competitors: organization?.competitors || []
    },
    stage: 'acknowledge'
  })
})
```

### Change 2: API Route - Forward Conversation History

**File**: `/src/app/api/niv-orchestrator/route.ts`

**Current (line 51)**:
```typescript
conversationHistory: [], // HARDCODED EMPTY!
```

**Fix**:
```typescript
const { message, conversationId, organizationId, organizationContext, framework, stage, conversationHistory } = body

// ... in fetch body:
conversationHistory: conversationHistory || [], // FORWARD FROM FRONTEND!
```

### Change 3: Update AI Model Keywords

**Database**: Update `mcp_discovery` table

**Current**:
```
Keywords: OpenAI, ChatGPT, GPT-4o, GPT-4o-mini, o1
```

**Updated**:
```sql
UPDATE mcp_discovery
SET keywords = ARRAY[
  'OpenAI', 'ChatGPT',
  'GPT-4o', 'GPT-4o-mini', 'GPT-4.5', 'GPT-5',
  'o1', 'o3', 'o1-preview', 'o1-mini',
  'Sora', 'Sora 2.0', 'Sora video'
]
WHERE organization_name = 'OpenAI';

UPDATE mcp_discovery
SET keywords = ARRAY[
  'Anthropic', 'Claude',
  'Claude 3.5 Sonnet', 'Claude 3.7 Sonnet', 'Claude Sonnet 4', 'Claude Sonnet 4.5',
  'Claude 3.5 Opus', 'Claude Opus 4',
  'Claude 3.5 Haiku'
]
WHERE organization_name = 'Anthropic';

UPDATE mcp_discovery
SET keywords = ARRAY[
  'Google', 'Google AI', 'DeepMind',
  'Gemini', 'Gemini 2.0', 'Gemini Ultra', 'Gemini Pro',
  'Gemini Flash', 'Gemini Nano'
]
WHERE organization_name = 'Google';
```

## Expected Results

### Before Fix:
```
User: "look again for openai recent developments"
NIV: [Searches with conversationId niv-1761302769901]
     [Gets empty conversation history]
     [Finds nothing about Sonnet 4.5]

User: "what are you talking about. we were talking about ed-tech"
NIV: [NEW conversationId niv-1761302657823]
     [No memory of ed-tech conversation]
     [Confused response]
```

### After Fix:
```
User: "look again for openai recent developments"
NIV: [Searches with conversationId niv-SESSION-START]
     [Gets empty conversation history - first message]
     [Finds Sonnet 4.5, GPT-5 rumors, Sora updates]

User: "what about anthropic?"
NIV: [SAME conversationId niv-SESSION-START]
     [Gets full history: previous OpenAI question + response]
     [Knows context: discussing AI companies]
     [Can compare to previous OpenAI research]

User: "now let's focus on ed-tech positioning"
NIV: [SAME conversationId niv-SESSION-START]
     [Remembers all previous discussion]
     [Can reference earlier points]
     [Maintains conversation thread]
```

## Testing Checklist

- [ ] ConversationId persists across multiple messages
- [ ] Conversation history sent to backend
- [ ] API route forwards history to edge function
- [ ] NIV references previous messages correctly
- [ ] Research builds on prior queries
- [ ] Finds Sonnet 4.5 when searching "Anthropic recent"
- [ ] Finds GPT-5 news when searching "OpenAI recent"
- [ ] Multi-turn conversation maintains context
- [ ] User can say "as we discussed earlier" and NIV remembers

## Implementation Priority

**CRITICAL - Do First**:
1. NIV Panel conversation persistence (conversationId + history)
2. API Route forwarding (remove hardcoded empty array)

**HIGH - Do Soon**:
3. Update AI model keywords in mcp_discovery

**MEDIUM - Nice to Have**:
4. Add conversation history truncation (keep last 20 messages like orchestrator-robust)
5. Store conversation state in Supabase for multi-session persistence
