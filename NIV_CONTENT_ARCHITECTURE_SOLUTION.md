# NIV Content - Proper Architecture Solution

## THE PROBLEM

We built a sophisticated backend but:
1. Frontend doesn't use it
2. We DO need simple content creation (not everything needs research/narratives)
3. Media plans need the full workflow, social posts don't

---

## THE SOLUTION: TWO-TIER ARCHITECTURE

### TIER 1: Simple Content (Direct Generation)
**For:** Social posts, single press releases, images, simple announcements
**Process:** User describes → Generate immediately
**No need for:** Research, narrative selection, multi-piece orchestration

### TIER 2: Complex Content (Strategic Orchestration)
**For:** Media plans, presentations, multi-piece campaigns
**Process:** User requests → Research → Present narratives → User chooses → Generate all pieces
**Requires:** Full niv-content-intelligent-v2 workflow

---

## IMPLEMENTATION STRATEGY

### Frontend: Smart Routing (NIVContentOrchestratorProduction.tsx)

```typescript
// Content type classification
const CONTENT_COMPLEXITY = {
  simple: ['social-post', 'image', 'single-press-release', 'email'],
  complex: ['media-plan', 'presentation', 'campaign', 'multi-piece-content']
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!input.trim() || isThinking) return

  const userMessage = input.trim()
  setInput('')

  // Add user message
  const userMsg = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  }
  setMessages(prev => [...prev, userMsg])

  setIsThinking(true)

  try {
    // SMART ROUTING BASED ON CONTENT TYPE
    const contentType = conceptState.contentConcept.type

    if (CONTENT_COMPLEXITY.complex.includes(contentType)) {
      // COMPLEX FLOW: Use niv-content-intelligent-v2
      await handleComplexContent(userMessage)
    } else if (CONTENT_COMPLEXITY.simple.includes(contentType)) {
      // SIMPLE FLOW: Direct generation
      await handleSimpleContent(userMessage)
    } else {
      // NOT SURE YET: Use niv-content-intelligent-v2 to determine
      await handleComplexContent(userMessage) // Let backend decide
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setIsThinking(false)
  }
}
```

### Complex Content Handler (Uses niv-content-intelligent-v2)

```typescript
const handleComplexContent = async (userMessage: string) => {
  console.log('🎯 Complex content flow for:', conceptState.contentConcept.type)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        organizationContext: {
          conversationId: conceptState.conversationId,
          organizationId: organization?.id || 'OpenAI'
        }
      })
    }
  )

  const data = await response.json()

  // Handle backend responses
  if (data.mode === 'question') {
    // Backend needs more info
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: data.message,
      timestamp: new Date(),
      metadata: { awaitingResponse: true }
    }])
  }
  else if (data.mode === 'narrative_options') {
    // Backend presenting narrative choices
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: data.message,
      timestamp: new Date(),
      metadata: {
        narratives: data.narrativeOptions,
        awaitingChoice: true
      }
    }])

    // Show narrative selection UI
    setShowNarrativeSelector(true)
    setNarrativeOptions(data.narrativeOptions)
  }
  else if (data.mode === 'generation_complete') {
    // Backend generated all pieces
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: data.message,
      timestamp: new Date(),
      metadata: { generatedContent: data.generatedContent }
    }])

    // Display all generated pieces
    setGeneratedContent(data.generatedContent)
  }
  else {
    // Regular conversation
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: data.message,
      timestamp: new Date()
    }])
  }
}
```

### Simple Content Handler (Direct generation)

```typescript
const handleSimpleContent = async (userMessage: string) => {
  console.log('⚡ Simple content flow for:', conceptState.contentConcept.type)

  // Build context from conversation
  const context = {
    type: conceptState.contentConcept.type,
    prompt: userMessage,
    conversationHistory: messages.slice(-5), // Last 5 messages for context
    organization: {
      name: organization?.name || 'OpenAI',
      industry: organization?.industry
    }
  }

  // Call appropriate generation service directly
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mcp-content`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        tool: getContentTool(conceptState.contentConcept.type),
        parameters: context
      })
    }
  )

  const data = await response.json()

  // Show generated content immediately
  const generatedMsg = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: `Here's your ${conceptState.contentConcept.type}:`,
    timestamp: new Date(),
    metadata: {
      generatedContent: [{
        type: conceptState.contentConcept.type,
        content: data
      }]
    }
  }

  setMessages(prev => [...prev, generatedMsg])
  setGeneratedContent([{
    type: conceptState.contentConcept.type,
    content: data
  }])
}

// Map content types to MCP tools
const getContentTool = (type: string): string => {
  const toolMap: Record<string, string> = {
    'social-post': 'generate_social_posts',
    'single-press-release': 'generate_press_release',
    'image': 'generate_image',
    'email': 'generate_email'
  }
  return toolMap[type] || 'generate_content'
}
```

---

## CONTENT TYPE DEFINITIONS IN FRONTEND

```typescript
const CONTENT_MODE_EXPERTISE: Record<string, {
  complexity: 'simple' | 'complex'
  expertise: string
  questions?: string[]
  components?: string[]
  workflow?: string[]
}> = {
  'social-post': {
    complexity: 'simple',
    expertise: 'Platform optimization, engagement, viral mechanics',
    questions: [
      "Which platforms?",
      "What's the core message?"
    ]
  },
  'single-press-release': {
    complexity: 'simple',
    expertise: 'AP style, newsworthiness',
    questions: [
      "What's the announcement?",
      "Who should we quote?"
    ]
  },
  'image': {
    complexity: 'simple',
    expertise: 'Visual composition, brand aesthetics',
    questions: [
      "What's the concept?",
      "What's the usage?"
    ]
  },
  'media-plan': {
    complexity: 'complex',
    expertise: 'PR strategy, media relations, multi-channel campaigns',
    components: [
      'Press Release',
      'Media List (15+ journalists)',
      'Media Pitch',
      'Q&A Document',
      'Social Posts (3 platforms)'
    ],
    workflow: [
      '1. Market research & competitive analysis',
      '2. Narrative angle selection',
      '3. Multi-piece content generation',
      '4. Coordinated distribution'
    ],
    questions: [
      "What's the product/announcement?",
      "Target media (tech, business, mainstream)?",
      "Key narrative angle?"
    ]
  },
  'presentation': {
    complexity: 'complex',
    expertise: 'Storytelling, data visualization, persuasion',
    components: [
      'Title slide',
      'Problem statement',
      'Solution overview',
      'Key benefits',
      'Supporting data',
      'Call to action'
    ],
    workflow: [
      '1. Topic research',
      '2. Structure selection (problem-solution, data-driven, story-arc)',
      '3. Slide generation',
      '4. Visual design'
    ]
  }
}
```

---

## UPDATED BACKEND (niv-content-intelligent-v2)

Keep the sophisticated workflow for complex content, but return appropriate responses:

```typescript
// In callClaudeWithFullContext response

if (decision.decision === 'generate_content') {
  // Check if simple or complex
  if (state.concept.contentType === 'social-post' || state.concept.contentType === 'single-press-release') {
    // Simple content - generate single piece
    return await generateSimpleContent(state, orgProfile)
  } else {
    // Complex content - orchestrate multiple pieces
    return await orchestrateContentGeneration(state, orgProfile)
  }
}
```

---

## UI COMPONENTS NEEDED

### 1. Narrative Selector (for complex content)
```tsx
{showNarrativeSelector && narrativeOptions && (
  <div className="p-4 bg-blue-50 rounded-lg space-y-3">
    <p className="font-medium">Choose your narrative angle:</p>
    {narrativeOptions.map((option: any) => (
      <button
        key={option.id}
        onClick={() => selectNarrative(option)}
        className="w-full p-3 text-left border rounded hover:bg-blue-100"
      >
        <div className="font-medium">{option.narrative}</div>
        <div className="text-sm text-gray-600">{option.angle}</div>
        <div className="text-xs text-gray-500 mt-1">
          Target: {option.targetMedia?.join(', ')}
        </div>
      </button>
    ))}
  </div>
)}
```

### 2. Multi-Piece Content Display (for complex content)
```tsx
{generatedContent.length > 0 && (
  <div className="space-y-4">
    <h3 className="font-bold">Generated Content Pieces ({generatedContent.length})</h3>
    {generatedContent.map((piece: any, idx: number) => (
      <div key={idx} className="border rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="font-medium">{piece.type}</span>
          <button onClick={() => savePiece(piece)}>Save</button>
        </div>
        <div className="prose prose-sm">
          {renderContent(piece)}
        </div>
      </div>
    ))}
  </div>
)}
```

### 3. Research Display (for complex content)
```tsx
{currentResearch && (
  <div className="p-3 bg-gray-50 rounded text-sm">
    <div className="font-medium mb-1">Research: {currentResearch.articles?.length} articles</div>
    <div className="text-gray-600">{currentResearch.synthesis}</div>
  </div>
)}
```

---

## THE FLOW

### Simple Content (Social Post):
```
User: "create a social post about our new AI feature"
  ↓
Frontend detects: type='social-post' (simple)
  ↓
Call mcp-content directly with context
  ↓
Display generated post immediately
  ↓
Done
```

### Complex Content (Media Plan):
```
User: "create a media plan for sora 2 launch"
  ↓
Frontend detects: type='media-plan' (complex)
  ↓
Call niv-content-intelligent-v2
  ↓
Backend: Extracts subject, does research
  ↓
Backend: Presents 3 narrative options
  ↓
Frontend: Shows narrative selector UI
  ↓
User chooses narrative
  ↓
Send choice to backend
  ↓
Backend: Generates 5 pieces in parallel
  ↓
Frontend: Shows all 5 pieces in multi-piece UI
  ↓
Done
```

---

## IMMEDIATE IMPLEMENTATION STEPS

1. **Add complexity classification to frontend**
2. **Implement handleComplexContent() to call niv-content-intelligent-v2**
3. **Implement handleSimpleContent() for direct generation**
4. **Add narrative selector UI component**
5. **Add multi-piece content display component**
6. **Update content type definitions with complexity flags**
7. **Test both flows**

---

## WHY THIS WORKS

✅ **Simple content stays simple** - Direct generation, fast
✅ **Complex content gets full workflow** - Research, narratives, orchestration
✅ **Frontend knows the difference** - Routes intelligently
✅ **Backend is utilized properly** - For complex content that needs it
✅ **User experience is appropriate** - Fast for simple, strategic for complex

The key is **smart routing at the frontend** based on content complexity.
