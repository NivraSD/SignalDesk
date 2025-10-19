# NIV Content - Complete Rebuild Plan
## Based on niv-orchestrator-robust Pattern

---

## Problem Statement
NIV Content doesn't understand conversations. It doesn't build context message-by-message like niv-orchestrator-robust does.

---

## Solution Architecture

### 1. ConceptState - Track Conversation Context

```typescript
interface ContentConceptState {
  conversationId: string
  stage: 'exploring' | 'defining' | 'refining' | 'ready'

  concept: {
    contentType?: string        // 'media-plan', 'social-post', 'press-release'
    subject?: string            // 'Sora 2', 'new feature'
    purpose?: string            // 'launch', 'announcement'
    narrative?: string          // chosen narrative from options
    targetMedia?: string[]      // ['TechCrunch', 'The Verge']
    keyMessages?: string[]      // key messages from research
  }

  elementsDiscussed: string[]
  elementsConfirmed: string[]
  elementsNeeded: string[]
  confidence: number            // 0-100

  researchHistory: Array<{
    timestamp: Date
    query: string
    results: any
  }>

  userPreferences: {
    wants: string[]
    doesNotWant: string[]
    examples: string[]
    constraints: string[]
  }

  fullConversation: Array<{
    role: string
    content: string
    timestamp: Date
  }>

  lastUpdate: number
}

// Store states (like niv-robust lines 50)
const conceptStates = new Map<string, ContentConceptState>()
```

### 2. Message Processing Flow

```
User Message
    ↓
getConceptState(conversationId)
    ↓
updateConceptState(conversationId, message)
  - Extract wants/doesn't want/constraints via regex
  - Extract contentType, subject, purpose
  - Update confidence score
  - Store in fullConversation
    ↓
callClaudeWithFullContext(message, state)
  - Shows Claude ENTIRE conversation
  - Shows current state
  - Shows research history
  - Claude decides: ask question, research, present narratives, or generate
    ↓
Execute Claude's decision
    ↓
Return response to user
```

### 3. Core Functions

#### A. getConceptState()
```typescript
function getConceptState(conversationId: string): ContentConceptState {
  if (!conceptStates.has(conversationId)) {
    conceptStates.set(conversationId, {
      conversationId,
      stage: 'exploring',
      concept: {},
      elementsDiscussed: [],
      elementsConfirmed: [],
      elementsNeeded: ['contentType', 'subject'],
      confidence: 0,
      researchHistory: [],
      userPreferences: {
        wants: [],
        doesNotWant: [],
        examples: [],
        constraints: []
      },
      fullConversation: [],
      lastUpdate: Date.now()
    })
  }
  return conceptStates.get(conversationId)!
}
```

#### B. updateConceptState()
```typescript
function updateConceptState(
  conversationId: string,
  message: string,
  toolResults?: any
): ContentConceptState {
  const state = getConceptState(conversationId)

  // Store full conversation
  state.fullConversation.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  // Extract via regex (EXACTLY like niv-robust lines 115-135)
  const messageLower = message.toLowerCase()

  // Track wants
  if (messageLower.includes('i want') || messageLower.includes('we need')) {
    const match = message.match(/(?:i want|we need)\s+([^.!?]+)/i)
    if (match) state.userPreferences.wants.push(match[1].trim())
  }

  // Track doesn't want
  if (messageLower.includes("don't want") || messageLower.includes('avoid')) {
    state.userPreferences.doesNotWant.push(message)
  }

  // Extract content type
  if (messageLower.includes('media plan')) {
    state.concept.contentType = 'media-plan'
    state.elementsDiscussed.push('contentType')
  } else if (messageLower.includes('social post')) {
    state.concept.contentType = 'social-post'
    state.elementsDiscussed.push('contentType')
  } else if (messageLower.includes('press release')) {
    state.concept.contentType = 'press-release'
    state.elementsDiscussed.push('contentType')
  }

  // Extract subject (what it's about)
  const forMatch = message.match(/(?:for|about)\s+([^.!?]+)/i)
  if (forMatch && !state.concept.subject) {
    state.concept.subject = forMatch[1].trim()
    state.elementsDiscussed.push('subject')
  }

  // Store research
  if (toolResults) {
    state.researchHistory.push({
      timestamp: new Date(),
      query: message,
      results: toolResults
    })
  }

  // Update confidence
  const elementCount = Object.keys(state.concept).length
  state.confidence = Math.min(100, elementCount * 25)

  // Update stage
  if (state.confidence < 25) state.stage = 'exploring'
  else if (state.confidence < 75) state.stage = 'defining'
  else if (state.confidence < 100) state.stage = 'refining'
  else state.stage = 'ready'

  state.lastUpdate = Date.now()

  return state
}
```

#### C. callClaudeWithFullContext() - THE CORE INTELLIGENCE

```typescript
async function callClaudeWithFullContext(
  message: string,
  state: ContentConceptState
): Promise<ClaudeDecision> {

  // Build conversation context (like Strategic Framework)
  const conversationContext = state.fullConversation.map(msg =>
    `[${msg.role.toUpperCase()}]: ${msg.content}`
  ).join('\n\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are NIV, a strategic content consultant.

COMPLETE CONVERSATION HISTORY:
${conversationContext}

CURRENT MESSAGE: "${message}"

CURRENT STATE:
- Stage: ${state.stage}
- Content Type: ${state.concept.contentType || 'not specified'}
- Subject: ${state.concept.subject || 'not specified'}
- Purpose: ${state.concept.purpose || 'not specified'}
- Narrative: ${state.concept.narrative || 'not chosen'}
- Confidence: ${state.confidence}%

USER PREFERENCES FROM CONVERSATION:
- Wants: ${state.userPreferences.wants.join(', ') || 'none'}
- Does NOT want: ${state.userPreferences.doesNotWant.join(', ') || 'none'}
- Constraints: ${state.userPreferences.constraints.join(', ') || 'none'}

RESEARCH DONE:
${state.researchHistory.map(r =>
  `- ${r.query}: ${r.results.keyFindings?.length || 0} findings`
).join('\n') || 'No research yet'}

YOUR JOB:
Read the ENTIRE conversation. Understand what the user ACTUALLY wants.
Decide what to do next.

DECISION OPTIONS:

A) **ask_question** - You need 1-2 specific things before proceeding
   Example: They said "media plan for Sora 2" but no launch date
   Response: "Got it - media plan for Sora 2. When's the launch date?"

B) **do_research** - Complex request needs market intelligence
   Example: Media plan needs competitive positioning research
   Response: "Let me research the AI video market and competitor positioning..."

C) **present_narratives** - Research done, show narrative options
   Example: After research, present 2-3 narrative angles
   Response: "Based on research, I see 3 angles: 1) Democratizing... 2) Creator... 3) Hollywood..."

D) **generate_content** - Have everything needed, create now
   Example: Simple social post with subject known
   Response: "Here's your social post: ..."

RULES:
- If they told you something, DON'T ask again
- For media plans: acknowledge → research → present narratives → user chooses → generate
- For simple content (social post): if you have subject, generate immediately
- Be conversational, not robotic
- Read what they ACTUALLY said

Return ONLY JSON:
{
  "decision": "ask_question" | "do_research" | "present_narratives" | "generate_content",
  "reasoning": "why you made this decision",
  "response": "your message to the user (conversational)",
  "question": "specific question" (if ask_question),
  "researchQuery": "specific query" (if do_research),
  "narrativeOptions": [
    {
      "id": 1,
      "narrative": "Democratizing video creation",
      "angle": "Make Hollywood-quality accessible",
      "targetMedia": ["TechCrunch", "The Verge"],
      "rationale": "Taps into creator economy"
    }
  ] (if present_narratives),
  "contentPlan": {
    "pieces": [...]
  } (if generate_content)
}`
      }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text

  return JSON.parse(text)
}
```

### 4. Content Generation Orchestration

When Claude decides to generate, create specific instructions for each piece:

```typescript
async function orchestrateContentGeneration(
  state: ContentConceptState
): Promise<Response> {

  // ONE Claude call to plan all content pieces
  const planResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Create specific parameters for each content piece.

FULL CONTEXT:
- Subject: ${state.concept.subject}
- Content Type: ${state.concept.contentType}
- Narrative: ${state.concept.narrative}
- Target Media: ${state.concept.targetMedia?.join(', ')}
- Key Messages: ${state.concept.keyMessages?.join(', ')}
- Research: ${JSON.stringify(state.researchHistory.map(r => r.results.keyFindings?.slice(0, 5)))}

For a ${state.concept.contentType}, create instructions for EACH piece.

EXAMPLE for media-plan:
- Press Release
- Media List
- Media Pitch
- Q&A Document
- Social Posts

For EACH piece, extract specific parameters from the context:

Return ONLY JSON:
{
  "pieces": [
    {
      "type": "press-release",
      "service": "mcp-content",
      "tool": "generate_press_release",
      "parameters": {
        "headline": "OpenAI Launches Sora 2, Democratizing Video Creation",
        "keyPoints": ["Point from narrative", "Point from research"],
        "quotes": [{"speaker": "CEO", "quote": "..."}],
        "tone": "exciting"
      }
    },
    {
      "type": "media-list",
      "service": "mcp-media",
      "tool": "generate_media_list",
      "parameters": {
        "targetOutlets": ["TechCrunch", "The Verge"],
        "beatCategories": ["AI/Tech", "Creator Economy"],
        "focus": "Video AI launch"
      }
    },
    {
      "type": "media-pitch",
      "service": "mcp-content",
      "tool": "generate_media_pitch",
      "parameters": {
        "headline": "Exclusive: Sora 2 democratizes video creation",
        "pitch": "pitch based on narrative",
        "dataPoints": ["from research"]
      }
    },
    {
      "type": "qa-document",
      "service": "mcp-content",
      "tool": "generate_qa_document",
      "parameters": {
        "topic": "Sora 2 Launch",
        "questions": ["anticipated questions from research"]
      }
    },
    {
      "type": "social-post",
      "service": "mcp-content",
      "tool": "generate_social_posts",
      "parameters": {
        "message": "based on narrative",
        "platforms": ["twitter", "linkedin"]
      }
    }
  ]
}`
      }]
    })
  })

  const planData = await planResponse.json()
  const plan = JSON.parse(planData.content[0].text)

  // Generate all pieces in PARALLEL
  const generationPromises = plan.pieces.map((piece: any) =>
    fetch(`${SUPABASE_URL}/functions/v1/${piece.service}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        tool: piece.tool,
        parameters: piece.parameters
      })
    }).then(r => r.json())
  )

  const results = await Promise.allSettled(generationPromises)

  // Collect successful generations
  const generatedContent: any[] = []
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      generatedContent.push({
        type: plan.pieces[idx].type,
        content: result.value
      })
    }
  })

  return new Response(JSON.stringify({
    success: true,
    mode: 'generation_complete',
    message: `Generated ${generatedContent.length} pieces for your ${state.concept.contentType}`,
    generatedContent: generatedContent
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
```

---

## Implementation Steps

### Step 1: State Management ✅
- [ ] Create ContentConceptState interface
- [ ] Implement conceptStates Map
- [ ] Implement getConceptState()
- [ ] Implement updateConceptState() with regex extraction
- [ ] Test state persistence across messages

### Step 2: Intelligent Decision Making ✅
- [ ] Implement callClaudeWithFullContext()
- [ ] Handle "ask_question" decision
- [ ] Handle "do_research" decision (call niv-fireplexity)
- [ ] Handle "present_narratives" decision
- [ ] Handle "generate_content" decision
- [ ] Test each decision path

### Step 3: Content Orchestration ✅
- [ ] Implement orchestrateContentGeneration()
- [ ] Claude creates specific parameters for each piece
- [ ] Parallel generation of all pieces
- [ ] Map content types to services
- [ ] Test parallel generation

### Step 4: Frontend Integration ✅
- [ ] Update NIVContentOrchestratorSimplified
- [ ] Handle new response modes
- [ ] Display narrative options
- [ ] Handle narrative selection
- [ ] Display multiple generated pieces
- [ ] Test end-to-end flow

### Step 5: Testing ✅
- [ ] Test simple: "create a social post about X"
- [ ] Test complex: "create a media plan for Sora 2 launch"
- [ ] Test conversation building across 3+ messages
- [ ] Test narrative selection
- [ ] Test parallel generation of 5+ pieces
- [ ] Fix any issues

---

## Expected Flows

### Flow 1: Simple Content (Social Post)
```
User: "create a social post about our new feature"
NIV: [extracts: contentType=social-post, subject=new feature]
     [Claude decides: generate_content - has enough info]
     "Here's your social post about the new feature: [content]"
```

### Flow 2: Complex Content (Media Plan)
```
User: "create a media plan for Sora 2 launch"
NIV: [extracts: contentType=media-plan, subject=Sora 2, purpose=launch]
     [Claude decides: do_research - needs market intel]
     "Got it - media plan for Sora 2 launch. Let me research the market..."
     [calls niv-fireplexity]
     [Claude decides: present_narratives - research done]
     "Based on research, I see 3 narrative angles:
      1. Democratizing video creation - Make Hollywood-quality accessible
      2. Creator empowerment - Give creators professional tools
      3. Hollywood accessibility - Bring studio capabilities to everyone
      Which resonates?"

User: "Option 1"
NIV: [updates: narrative="Democratizing video creation"]
     [Claude decides: generate_content - has everything]
     "Perfect. Generating complete media plan targeting TechCrunch, The Verge
      to support the 'democratizing video creation' narrative..."
     [orchestrates generation of 5 pieces in parallel]
     "Here are your 5 pieces:
      1. Press Release
      2. Media List (15 journalists)
      3. Media Pitch
      4. Q&A Document
      5. Social Posts (3 platforms)"
```

---

## Key Differences from niv-orchestrator-robust

1. **No Strategic Framework call** - NIV Content generates directly
2. **Content-specific state** - tracks contentType, narrative, not campaign
3. **Simpler decisions** - 4 options vs complex campaign orchestration
4. **Direct generation** - calls content services instead of framework
5. **Parallel orchestration** - generates all pieces simultaneously

---

## Files to Create/Modify

### Backend
- `/supabase/functions/niv-content-intelligent-v2/index.ts` - Complete rebuild

### Frontend
- `/src/components/execute/NIVContentOrchestratorSimplified.tsx` - Update handlers

### No Changes Needed
- Content services (mcp-content, mcp-media, etc.) - receive parameters as before

---

## Success Criteria

✅ NIV understands conversation across multiple messages
✅ NIV builds context message-by-message
✅ NIV asks smart questions based on what's genuinely missing
✅ NIV does research when needed
✅ NIV presents narrative options for complex content
✅ NIV generates all pieces in parallel with proper context
✅ Each content piece is informed by the full conversation
✅ No double responses
✅ Conversation flows naturally like talking to a consultant

---

## Ready to Build?

This plan provides the complete blueprint. The implementation will mirror niv-orchestrator-robust's intelligence while being adapted for content creation.
