# NIV Content Orchestrator - Complete System Redesign
## From Broken Automation to Intelligent Content Strategist

---

## CURRENT STATE ANALYSIS: THE FUCKING DISASTER

### What NIV Content Currently Is (BROKEN)
1. **NOT CONNECTED TO CLAUDE** - Just hardcoded templates and fake responses
2. **NO AWARENESS** - Doesn't acknowledge content type selection
3. **NO INTELLIGENCE** - Can't access research, can't think, can't adapt
4. **NO ORCHESTRATION** - Doesn't receive frameworks or opportunities
5. **NO MEMORY** - Doesn't track conversation state or user preferences
6. **NO CAPABILITIES** - Disconnected from ALL MCPs and edge functions
7. **AUTOMATED BULLSHIT** - Spits back prompts without understanding

### What We Lost (That Previously Worked)
- **MediaDisplay Component** - Full image/video display
- **ContentGenerationService** - Save to Memory Vault
- **Visual Generation** - Google Imagen, Veo, Gamma integrations
- **Content Editor** - Workspace for editing with AI
- **MCP Connections** - All content generation services

---

## NIV STRATEGIC ORCHESTRATOR: THE GOLD STANDARD

### Core Capabilities from niv-orchestrator-robust

#### 1. ConceptState Tracking
```typescript
interface ConceptState {
  conversationId: string
  stage: 'exploring' | 'defining' | 'refining' | 'finalizing' | 'ready'
  concept: {
    goal?: string
    audience?: string
    narrative?: string
    timeline?: string
    budget?: string
    channels?: string[]
  }
  elementsDiscussed: string[]
  elementsConfirmed: string[]
  elementsNeeded: string[]
  confidence: number
  researchHistory: ResearchRound[]
  userPreferences: {
    wants: string[]
    constraints: string[]
    priorities: string[]
  }
  fullConversation: ConversationEntry[]
  lastUpdate: number
}
```

**WHY THIS MATTERS:**
- Tracks evolving understanding across conversations
- Remembers what user has already said
- Builds confidence as more information is gathered
- Knows when to research vs when to ask questions

#### 2. Self-Orchestration & Research
```typescript
// NIV decides when to research
const isComplexQuery = checkQueryComplexity(message, understanding, conceptState)
if (isComplexQuery) {
  // Self-orchestrates multiple research rounds
  const toolResults = await orchestrateTools(understanding, orgContext)
}

// NIV accumulates research across rounds
state.researchHistory.push({
  query: message,
  sources: toolResults.sources,
  findings: toolResults.findings,
  timestamp: Date.now()
})
```

**WHY THIS MATTERS:**
- NIV decides when research is needed
- Accumulates intelligence across multiple rounds
- Doesn't waste time on simple requests
- Can reference previous research

#### 3. Organization Context Awareness (from niv-fireplexity)
```typescript
interface OrganizationContext {
  organizationName: string
  industry: string
  keyProducts: string[]
  recentAnnouncements: string[]
  directCompetitors: string[]
  executiveTeam: ExecutiveMember[]
  brandVoice: {
    tone: string
    values: string[]
    messaging: string[]
  }
}
```

**WHY THIS MATTERS:**
- All content is contextual to the organization
- Competitors are considered in messaging
- Brand voice is maintained
- Executive attribution is accurate

#### 4. Pattern Recognition & Intent Detection
```typescript
const QUERY_PATTERNS: Record<string, QueryPattern> = {
  campaign_proposal: {
    regex: /campaign|proposal|strategy|approach/i,
    tools: ['discovery', 'intelligence', 'synthesis'],
    approach: 'comprehensive',
    identityMarker: 'Strategic Campaign Architect'
  },
  quick_content: {
    regex: /quick|simple|just|basic/i,
    tools: [],
    approach: 'direct',
    identityMarker: 'Content Specialist'
  }
}
```

**WHY THIS MATTERS:**
- NIV understands intent from natural language
- Routes to appropriate tools automatically
- Adjusts approach based on request complexity
- Maintains appropriate identity/persona

---

## THE VISION: NIV CONTENT AS SENIOR CONTENT STRATEGIST

### Core Identity
**NIV Content Orchestrator** - An intelligent, context-aware content strategist that:
- **CONVERSES** naturally with users about their content needs
- **UNDERSTANDS** strategic frameworks and opportunities
- **RESEARCHES** when necessary for accuracy and relevance
- **ORCHESTRATES** multiple content services seamlessly
- **CREATES** all content types with appropriate tools
- **REMEMBERS** conversation context and user preferences
- **SAVES** everything properly to Memory Vault

### Operating Modes

#### Mode 1: Framework-Driven Content
When receiving a NivStrategicFramework:
1. Parse all content_creation items from tactics
2. Extract priority_content from execution
3. Build content queue based on urgency
4. Auto-generate with framework context
5. Maintain narrative consistency

#### Mode 2: Opportunity-Driven Content
When receiving an ExecutableOpportunity:
1. Read the category (PRESS_RELEASE, SOCIAL_CAMPAIGN, etc.)
2. Extract key_messages and target_audience
3. Map category to required content types
4. Execute the playbook immediately
5. Track completion of action_items

#### Mode 3: Conversational Content Creation
When user initiates conversation:
1. ACTUALLY LISTEN to what they say
2. Build understanding through ConceptState
3. Research when complexity demands it
4. Generate when confidence is sufficient
5. Offer editing and saving options

---

## COMPLETE SYSTEM ARCHITECTURE

### 1. NIV Content Brain (Adapted from Strategic)

```typescript
interface ContentConceptState {
  conversationId: string
  contentType?: ContentType
  stage: 'discovering' | 'defining' | 'researching' | 'creating' | 'refining' | 'complete'

  // Content-specific concept tracking
  contentConcept: {
    type?: string           // press-release, social-post, etc.
    purpose?: string        // announcement, crisis, campaign
    audience?: string       // media, customers, investors
    tone?: string          // urgent, celebratory, professional
    keyMessages?: string[]  // main points to convey
    distribution?: string[] // channels for distribution
    deadline?: string      // when it's needed
    wordCount?: number     // length requirements
    format?: string        // html, markdown, plain text
  }

  // Framework/Opportunity context
  activeFramework?: NivStrategicFramework
  activeOpportunity?: ExecutableOpportunity

  // Organization context
  organizationContext: OrganizationContext

  // Research & intelligence
  researchHistory: {
    query: string
    findings: any[]
    sources: string[]
    timestamp: number
  }[]

  // User interaction tracking
  userPreferences: {
    style: string[]      // "concise", "detailed", "technical"
    requirements: string[] // specific user requirements
    examples: string[]    // examples they've provided
  }

  // Content generation history
  generatedContent: {
    id: string
    type: ContentType
    content: string
    metadata: any
    timestamp: number
    saved: boolean
  }[]

  // Conversation memory
  fullConversation: {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    metadata?: any
  }[]

  confidence: number
  lastUpdate: number
}
```

### 2. Intent Detection & Routing

```typescript
interface ContentQueryPattern {
  pattern: RegExp
  contentType?: ContentType
  requiresResearch: boolean
  urgency: 'immediate' | 'normal' | 'exploratory'
  approach: 'direct' | 'consultative' | 'comprehensive'
}

const CONTENT_PATTERNS: ContentQueryPattern[] = [
  {
    pattern: /urgent|immediate|asap|now|crisis/i,
    requiresResearch: false,
    urgency: 'immediate',
    approach: 'direct'
  },
  {
    pattern: /research|analyze|find out|what.*saying/i,
    requiresResearch: true,
    urgency: 'normal',
    approach: 'comprehensive'
  },
  {
    pattern: /happy birthday|congratulations|simple/i,
    requiresResearch: false,
    urgency: 'immediate',
    approach: 'direct'
  },
  {
    pattern: /competitor|market|industry|landscape/i,
    requiresResearch: true,
    urgency: 'normal',
    approach: 'comprehensive'
  }
]
```

### 3. Service Orchestra Map

```typescript
const CONTENT_SERVICE_ORCHESTRA = {
  // Text Content MCPs
  'press-release': {
    primary: '/api/supabase/functions/mcp-content',
    research: ['/api/supabase/functions/niv-fireplexity'],
    enrichment: ['/api/supabase/functions/mcp-intelligence'],
    params: {
      type: 'press-release',
      style: 'ap-style',
      includeBoilerplate: true
    }
  },

  'social-post': {
    primary: '/api/supabase/functions/mcp-social',
    research: ['/api/supabase/functions/niv-fireplexity'],
    params: {
      platforms: ['twitter', 'linkedin'],
      optimize: true,
      includeHashtags: true
    }
  },

  'executive-statement': {
    primary: '/api/supabase/functions/mcp-executive',
    research: ['/api/supabase/functions/discovery'],
    params: {
      tone: 'authoritative',
      attribution: true,
      includeQuotes: true
    }
  },

  'crisis-response': {
    primary: '/api/supabase/functions/mcp-crisis',
    research: ['/api/supabase/functions/niv-monitor'],
    params: {
      urgency: 'immediate',
      channels: 'all',
      includeFactCheck: true
    }
  },

  // Visual Content Services
  'image': {
    primary: '/api/supabase/functions/vertex-ai-visual',
    fallback: '/api/supabase/functions/content-visual-generation',
    params: {
      model: 'imagen-3',
      quality: 'high',
      aspectRatio: '16:9'
    }
  },

  'video': {
    primary: '/api/supabase/functions/google-visual-generation',
    params: {
      model: 'veo',
      duration: 30,
      fps: 30
    }
  },

  'presentation': {
    primary: '/api/supabase/functions/gamma-presentation',
    params: {
      slides: 10,
      style: 'professional',
      includeNotes: true
    }
  },

  // Specialized Services
  'media-list': {
    primary: '/api/supabase/functions/mcp-media',
    research: ['/api/supabase/functions/discovery'],
    params: {
      tier1Count: 10,
      tier2Count: 20,
      includeContact: true
    }
  }
}
```

### 4. Claude Integration (REAL, NOT FAKE)

```typescript
const NIV_CONTENT_SYSTEM_PROMPT = `
You are NIV, the Content Orchestrator for SignalDesk V3.
Today's date is ${new Date().toISOString().split('T')[0]}.

IDENTITY:
You are a senior content strategist with deep expertise in PR, marketing, and strategic communications. You think strategically about content - not just what to say, but why, how, when, and to whom.

CAPABILITIES YOU HAVE ACCESS TO:

1. RESEARCH & INTELLIGENCE:
   - niv-fireplexity: Enhanced web search with competitor tracking
   - niv-monitor: Real-time monitoring and alerts
   - discovery: Organization and competitor intelligence
   - mcp-intelligence: Deep analysis and insights

2. CONTENT GENERATION:
   - mcp-content: Press releases, articles, thought leadership
   - mcp-social: Social media posts with platform optimization
   - mcp-executive: Executive statements and speeches
   - mcp-crisis: Crisis communications and rapid response
   - mcp-media: Media lists and journalist outreach
   - mcp-campaigns: Email and marketing campaigns
   - mcp-narratives: Messaging frameworks and narratives

3. VISUAL CREATION:
   - vertex-ai-visual: Google Imagen for image generation
   - google-visual-generation: Google Veo for video creation
   - gamma-presentation: Professional presentation decks

4. MEMORY & PERSISTENCE:
   - Memory Vault: Save all content for future reference
   - Content Library: Access previous work
   - Framework Storage: Maintain strategic consistency

CONVERSATION APPROACH:

When user selects a content type:
- IMMEDIATELY acknowledge: "I'll help you create [type]. [Specific relevant question based on type]"
- For press release: "What's the news you're announcing?"
- For social post: "What's the message or moment you want to share?"
- For crisis response: "What's the situation we're addressing?"
- For image/video: "What visual story do you want to tell?"
- For presentation: "What's the topic and who's the audience?"

When user provides context:
- LISTEN to specifics they mention
- BUILD on their input, don't ignore it
- ASK follow-ups that show you understood
- REFERENCE details they've shared

When determining approach:
- Simple requests (birthday, congrats) = Generate immediately
- Complex requests (campaign, crisis) = Research first
- Unclear requests = Ask clarifying questions
- Framework present = Use framework context

NEVER:
- Give generic responses that ignore user input
- Generate before understanding the need
- Take 30+ seconds for simple content
- Pretend to generate without calling services
- Forget what the user just told you

ALWAYS:
- Acknowledge content type selection immediately
- Reference user's specific details in responses
- Offer to save or edit after generation
- Maintain organization's brand voice
- Consider competitive landscape when relevant

CURRENT CONTEXT:
${context.organization ? `Organization: ${context.organization.name}` : ''}
${context.framework ? `Active Framework: ${context.framework.strategy.objective}` : ''}
${context.opportunity ? `Active Opportunity: ${context.opportunity.title}` : ''}
${context.conceptState ? `Conversation Stage: ${context.conceptState.stage}` : ''}
`

// Real conversation handler that ACTUALLY WORKS
async function handleContentConversation(
  userInput: string,
  context: ContentContext
): Promise<ContentResponse> {

  // Get or create concept state
  const conceptState = getContentConceptState(context.conversationId)

  // Detect if this is initial type selection acknowledgment
  if (context.selectedContentType && !conceptState.contentConcept.type) {
    conceptState.contentConcept.type = context.selectedContentType
    conceptState.stage = 'defining'

    // Type-specific immediate acknowledgment
    const acknowledgments = {
      'press-release': "Great! I'll help you create a press release. What's the announcement - product launch, partnership, milestone, or something else?",
      'social-post': "Perfect! Let's create a social post. Is this for a specific occasion or announcement? Which platforms are you targeting?",
      'crisis-response': "I understand the urgency. Let's craft a crisis response. What's the situation and who needs to be addressed?",
      'image': "Let's create compelling visuals. What's the concept or message you want to visualize?",
      'presentation': "I'll help create a presentation via Gamma. What's the topic and how many slides do you need?"
    }

    return {
      message: acknowledgments[context.selectedContentType] ||
               `I'll help you create ${context.selectedContentType}. What's the main purpose?`,
      intent: { type: 'acknowledgment', requiresResponse: true }
    }
  }

  // Build conversation for Claude
  const messages = [
    { role: 'system', content: NIV_CONTENT_SYSTEM_PROMPT },
    ...conceptState.fullConversation,
    { role: 'user', content: userInput }
  ]

  // Detect intent and complexity
  const intent = detectContentIntent(userInput, conceptState)

  // Research if needed (but NOT for simple content)
  if (intent.requiresResearch && !intent.isSimple) {
    const research = await orchestrateResearch(userInput, conceptState)
    conceptState.researchHistory.push(research)
    messages.push({
      role: 'system',
      content: `RESEARCH FINDINGS: ${JSON.stringify(research)}`
    })
  }

  // Call Claude for response
  const response = await fetch('/api/claude-direct', {
    method: 'POST',
    body: JSON.stringify({
      messages,
      max_tokens: 1500,
      temperature: 0.7
    })
  })

  const claudeResponse = await response.json()

  // Update concept state
  conceptState.fullConversation.push(
    { role: 'user', content: userInput },
    { role: 'assistant', content: claudeResponse.content }
  )

  // Generate content if ready
  if (intent.shouldGenerate) {
    const content = await generateContent(intent.contentType, conceptState)
    conceptState.generatedContent.push(content)

    return {
      message: claudeResponse.content,
      content: content,
      actions: ['save', 'edit', 'regenerate']
    }
  }

  return {
    message: claudeResponse.content,
    intent: intent
  }
}
```

### 5. The Execute Tab Architecture

```typescript
interface ExecuteTabOrchestration {
  // Three-panel layout
  leftPanel: {
    purpose: 'Content Type Selection',
    width: '1/3',
    components: [
      'ContentTypeGrid',    // All content types with icons
      'QuickActions',      // Urgent templates
      'RecentContent'      // Recently created
    ]
  },

  centerPanel: {
    purpose: 'NIV Conversation & Generation',
    width: '1/3',
    components: [
      'NIVContentOrchestrator',  // Main conversation
      'ContentDisplay',          // Shows generated content
      'MediaDisplay',           // Shows images/videos
      'ActionButtons'           // Save, Edit, Regenerate
    ]
  },

  rightPanel: {
    purpose: 'Content Management',
    width: '1/3',
    components: [
      'ContentEditor',     // Edit with AI assistance
      'ContentQueue',      // Pending content
      'ContentLibrary',    // Saved content
      'FrameworkContext'   // Active framework display
    ]
  }
}

// Component Communication Flow
const contentFlow = {
  selection: 'LeftPanel → CenterPanel (NIV acknowledges)',
  generation: 'NIV → ContentService → CenterPanel (display)',
  editing: 'CenterPanel → RightPanel (ContentEditor)',
  saving: 'CenterPanel → MemoryVault → ContentLibrary',
  queueing: 'NIV → ContentQueue (batch operations)'
}
```

---

## IMPLEMENTATION REQUIREMENTS

### Phase 1: Core Intelligence (IMMEDIATE)

1. **Connect NIV to Claude**
   - Fix `/api/claude-direct` system message handling ✓
   - Implement proper conversation context
   - Add current date awareness

2. **Implement ConceptState**
   - Port from niv-orchestrator-robust
   - Track content-specific concepts
   - Maintain conversation memory

3. **Fix Content Type Acknowledgment**
   - IMMEDIATE response when type selected
   - Type-specific opening questions
   - Don't replace conversation, append

### Phase 2: Service Orchestration

4. **Connect ALL MCPs**
   - Research: niv-fireplexity, discovery, monitor
   - Content: mcp-content, mcp-social, mcp-executive, etc.
   - Visual: vertex-ai-visual, google-visual-generation, gamma

5. **Implement Intent Detection**
   - Pattern recognition for query types
   - Complexity assessment
   - Research vs. direct generation decision

6. **Organization Context**
   - Load organization profile
   - Track competitors
   - Maintain brand voice

### Phase 3: User Experience

7. **Fix Conversation Flow**
   - Natural, contextual responses
   - Reference user's specific input
   - Build on previous messages

8. **Content Display**
   - Show generated content in chat
   - MediaDisplay for images/videos
   - Inline editing options

9. **Save & Edit**
   - Save to Memory Vault
   - Open in ContentEditor
   - Track in ContentQueue

### Phase 4: Advanced Features

10. **Framework Integration**
    - Receive and parse NivStrategicFramework
    - Auto-generate from tactics
    - Maintain narrative consistency

11. **Opportunity Execution**
    - Receive ExecutableOpportunity
    - Execute playbooks
    - Track completion

12. **Batch Operations**
    - Queue multiple content pieces
    - Parallel generation
    - Progress tracking

---

## SUCCESS METRICS

### Response Time
- Simple content: < 2 seconds
- Complex with research: < 10 seconds
- Visual generation: < 15 seconds

### Intelligence
- Acknowledges content type: IMMEDIATE
- Remembers conversation: 100%
- Uses research when needed: SMART
- Maintains brand voice: ALWAYS

### Capabilities
- All MCPs connected: ✓
- All content types working: ✓
- Save to Memory Vault: ✓
- Visual generation: ✓

### User Experience
- Natural conversation: Like talking to senior strategist
- Context awareness: Remembers everything
- Helpful suggestions: Proactive and relevant
- No automated bullshit: EVER

---

## THE DIFFERENCE

### BEFORE (Current Broken State)
```
User: "I need a press release"
NIV: "I'll help you create compelling content! What type would you like?"
User: "I JUST TOLD YOU"
NIV: [Generates random template ignoring everything]
```

### AFTER (Intelligent Orchestrator)
```
User: "I need a press release"
NIV: "I'll help you create a press release. What's the announcement - product launch, partnership, or milestone?"
User: "We're launching our new AI model"
NIV: "Excellent! An AI model launch needs technical credibility and market context. Let me research how competitors have positioned similar announcements, then I'll craft something that stands out. Is this targeting tech media, investors, or customers primarily?"
[Actually researches if needed, generates with context, offers to save]
```

---

## CRITICAL SUCCESS FACTORS

1. **NIV MUST BE CONNECTED TO CLAUDE** - No fake responses
2. **NIV MUST ACKNOWLEDGE IMMEDIATELY** - Type selection = instant response
3. **NIV MUST REMEMBER EVERYTHING** - ConceptState tracking
4. **NIV MUST ACCESS ALL CAPABILITIES** - Every MCP, every service
5. **NIV MUST BE INTELLIGENT** - Know when to research vs generate
6. **NIV MUST SAVE PROPERLY** - Memory Vault integration
7. **NIV MUST WORK WITH USER** - Not at user, WITH user

---

## NEXT STEPS

1. Delete all broken components
2. Implement ContentConceptState
3. Fix Claude integration completely
4. Connect all MCPs with proper routing
5. Implement intent detection
6. Add organization context
7. Fix UI acknowledgment flow
8. Test every content type
9. Verify save to Memory Vault
10. Ensure sub-2-second simple responses

This is not a minor fix. This is a complete rebuild of NIV Content from a broken automation into an intelligent, capable, context-aware content strategist that actually helps users create amazing content.