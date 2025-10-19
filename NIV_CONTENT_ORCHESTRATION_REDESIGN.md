# NIV Content Orchestration - Complete Redesign Architecture

## THE REAL PROBLEM
NIV Content Assistant is completely broken because:
1. **NOT CONNECTED TO CLAUDE** - Just hardcoded templates
2. **NO ORCHESTRATION** - Can't receive or process frameworks/opportunities
3. **NO MCP INTEGRATION** - Not using the proper content generation services
4. **FAKE CONVERSATION** - Ignores user input completely

## WHAT NIV CONTENT MUST BE

### Core Identity
**NIV Content Orchestrator** - The intelligent content execution engine that:
- **RECEIVES** Strategic Frameworks and Opportunities
- **PARSES** Complex data structures into actionable content needs
- **CONVERSES** With users to refine and personalize
- **ORCHESTRATES** Multiple MCPs and edge functions
- **GENERATES** Complete content packages
- **SAVES** Everything to Memory Vault

### Three Operating Modes

#### 1. Framework-Driven Mode
```typescript
// Receives NivStrategicFramework
interface FrameworkInput {
  strategy: {
    objective: string
    narrative: string
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  }
  tactics: {
    content_creation: ContentNeed[]
    media_outreach: MediaTarget[]
    stakeholder_engagement: Stakeholder[]
  }
  orchestration: {
    next_components: string[]
    workflow_type: string
    dependencies: string[]
  }
}

// NIV parses and creates content queue
const processFramework = (framework: NivStrategicFramework) => {
  // Extract all content needs
  const contentNeeds = [
    ...framework.tactics.immediate_actions.filter(a => a.includes('content')),
    ...framework.tactics.week_one_priorities.filter(p => p.includes('create')),
    ...framework.execution.content_requirements
  ]

  // Prioritize based on urgency
  const queue = prioritizeContent(contentNeeds, framework.strategy.urgency)

  // Auto-generate based on framework context
  queue.forEach(item => generateWithContext(item, framework))
}
```

#### 2. Opportunity-Driven Mode
```typescript
// Receives ExecutableOpportunity from Orchestrator V2
interface OpportunityInput {
  title: string
  category: OpportunityCategory // PRESS_RELEASE, SOCIAL_CAMPAIGN, etc.
  urgency: 'high' | 'medium' | 'low'
  playbook: {
    key_messages: string[]
    target_audience: string
    channels: string[]
    assets_needed: string[]
  }
  action_items: ActionItem[]
}

// NIV executes opportunity playbook
const executeOpportunity = (opportunity: ExecutableOpportunity) => {
  // Map category to content types
  const contentTypes = mapCategoryToContent(opportunity.category)

  // Generate each required piece
  contentTypes.forEach(type => {
    generateContent(type, {
      messages: opportunity.playbook.key_messages,
      audience: opportunity.playbook.target_audience,
      urgency: opportunity.urgency,
      context: opportunity
    })
  })
}
```

#### 3. Conversational Mode
```typescript
// Direct user interaction with REAL Claude
const handleUserInput = async (input: string, context: ConversationContext) => {
  // ACTUALLY CALL CLAUDE
  const response = await fetch('/api/claude-direct', {
    method: 'POST',
    body: JSON.stringify({
      messages: [
        { role: 'system', content: NIV_CONTENT_SYSTEM_PROMPT },
        ...context.conversationHistory,
        { role: 'user', content: input }
      ]
    })
  })

  // PARSE CLAUDE'S RESPONSE FOR INTENT
  const intent = detectContentIntent(response)

  // ROUTE TO APPROPRIATE MCP/EDGE FUNCTION
  if (intent.type) {
    await routeToContentService(intent)
  }
}
```

## THE ARCHITECTURE

### 1. Orchestration Layer
```typescript
interface NIVContentOrchestrator {
  // Input Reception
  receiveFramework(framework: NivStrategicFramework): void
  receiveOpportunity(opportunity: ExecutableOpportunity): void
  receiveUserMessage(message: string): void

  // Processing
  parseContentNeeds(input: any): ContentRequirement[]
  prioritizeQueue(needs: ContentRequirement[]): ContentQueue

  // Execution
  generateContent(type: ContentType, context: any): Promise<ContentItem>
  batchGenerate(queue: ContentQueue): Promise<ContentItem[]>

  // State Management
  conversationState: ConversationState
  contentQueue: ContentQueue
  activeFramework?: NivStrategicFramework
  activeOpportunity?: ExecutableOpportunity
}
```

### 2. Content Type Routing
```typescript
// Map content types to their MCPs/Edge Functions
const CONTENT_SERVICE_MAP = {
  'press-release': {
    service: '/api/supabase/functions/mcp-content',
    params: { type: 'press-release', style: 'ap-style' }
  },
  'social-post': {
    service: '/api/supabase/functions/mcp-social',
    params: { platforms: ['twitter', 'linkedin'] }
  },
  'executive-statement': {
    service: '/api/supabase/functions/mcp-executive',
    params: { tone: 'authoritative', attribution: true }
  },
  'crisis-response': {
    service: '/api/supabase/functions/mcp-crisis',
    params: { urgency: 'immediate', channels: 'all' }
  },
  'image': {
    service: '/api/supabase/functions/vertex-ai-visual',
    params: { type: 'image', model: 'imagen-3' }
  },
  'video': {
    service: '/api/supabase/functions/google-visual-generation',
    params: { type: 'video', duration: 30 }
  },
  'presentation': {
    service: '/api/supabase/functions/gamma-presentation',
    params: { slides: 10, style: 'professional' }
  },
  'media-list': {
    service: '/api/supabase/functions/mcp-media',
    params: { tier1: 10, tier2: 20 }
  }
}
```

### 3. Claude Integration (REAL)
```typescript
const NIV_CONTENT_SYSTEM_PROMPT = `
You are NIV, the Content Orchestrator for SignalDesk V3.

YOUR CAPABILITIES:
1. RECEIVE strategic frameworks and opportunities
2. PARSE complex data into content requirements
3. CONVERSE naturally with users about content needs
4. ORCHESTRATE multiple content generation services
5. GENERATE all content types via proper MCPs

WHEN YOU RECEIVE A FRAMEWORK:
- Extract all content_creation items from tactics
- Identify priority_content from execution
- Note the urgency and timeline
- Build a content queue with proper sequencing
- Say: "I've received the strategic framework for [objective]. I'll create [X] content pieces starting with [priority]."

WHEN YOU RECEIVE AN OPPORTUNITY:
- Read the category (PRESS_RELEASE, SOCIAL_CAMPAIGN, etc.)
- Extract key_messages and target_audience
- Map to appropriate content types
- Execute the playbook immediately
- Say: "Executing [category] opportunity: [title]. Creating [content types] for [audience]."

WHEN USER TALKS TO YOU:
- LISTEN to what they actually say
- ASK relevant follow-ups based on their input
- UNDERSTAND their content needs
- ROUTE to appropriate services
- GENERATE based on conversation context

AVAILABLE CONTENT TYPES:
- press-release (via mcp-content)
- social-post (via mcp-social)
- executive-statement (via mcp-executive)
- crisis-response (via mcp-crisis)
- thought-leadership (via mcp-content)
- email (via mcp-campaigns)
- qa-doc (via mcp-content)
- media-pitch (via mcp-media)
- messaging (via mcp-narratives)
- image (via vertex-ai-visual)
- video (via google-visual-generation)
- presentation (via gamma-presentation)
- media-list (via mcp-media)

CONVERSATION FLOW:
User: "I need a press release"
You: "I'll help create a press release. What's the announcement?"
User: "[provides context]"
You: "Got it. [Acknowledge specifics]. Who's the target audience - media, investors, or customers?"
User: "[answers]"
You: "Perfect. Creating a press release for [audience] about [topic]. Generating now..."
[ACTUALLY GENERATE VIA MCP]

NEVER:
- Return hardcoded templates
- Ignore user input
- Pretend to generate without calling services
- Ask generic questions that ignore context
`

// Real conversation handler
const handleConversation = async (
  userInput: string,
  context: ConversationContext
): Promise<ConversationResponse> => {

  // Build full conversation for Claude
  const messages = [
    { role: 'system', content: NIV_CONTENT_SYSTEM_PROMPT },

    // Include framework/opportunity if active
    ...(context.activeFramework ? [{
      role: 'system',
      content: `ACTIVE FRAMEWORK: ${JSON.stringify(context.activeFramework)}`
    }] : []),

    ...(context.activeOpportunity ? [{
      role: 'system',
      content: `ACTIVE OPPORTUNITY: ${JSON.stringify(context.activeOpportunity)}`
    }] : []),

    // Full conversation history
    ...context.conversationHistory,

    // Current user input
    { role: 'user', content: userInput }
  ]

  // CALL CLAUDE
  const response = await claudeAPI.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages,
    max_tokens: 1000
  })

  // PARSE RESPONSE
  const nivResponse = response.content[0].text

  // DETECT INTENT AND ROUTE
  const intent = detectIntent(nivResponse)
  if (intent.needsGeneration) {
    await routeToService(intent.contentType, intent.context)
  }

  return {
    message: nivResponse,
    intent,
    shouldGenerate: intent.needsGeneration
  }
}
```

### 4. Unified Generation Pipeline
```typescript
class ContentGenerationPipeline {
  async generate(
    type: ContentType,
    context: GenerationContext
  ): Promise<ContentItem> {

    // 1. Pre-generation intelligence gathering
    if (context.needsResearch) {
      const intelligence = await gatherIntelligence(context)
      context.intelligence = intelligence
    }

    // 2. Route to appropriate service
    const service = CONTENT_SERVICE_MAP[type]
    const response = await fetch(service.service, {
      method: 'POST',
      body: JSON.stringify({
        ...service.params,
        ...context,
        framework: context.activeFramework,
        opportunity: context.activeOpportunity
      })
    })

    // 3. Process response
    const content = await response.json()

    // 4. Save to Memory Vault
    await saveToMemoryVault(content)

    // 5. Return formatted content
    return formatContent(content, type)
  }

  async batchGenerate(
    queue: ContentQueue
  ): Promise<ContentBatch> {
    // Parallel generation for efficiency
    const promises = queue.items.map(item =>
      this.generate(item.type, item.context)
    )

    const results = await Promise.allSettled(promises)

    return {
      successful: results.filter(r => r.status === 'fulfilled'),
      failed: results.filter(r => r.status === 'rejected'),
      total: queue.items.length
    }
  }
}
```

## IMPLEMENTATION PLAN

### Phase 1: Delete and Clean
```bash
# Remove broken components
rm src/components/execute/NIVContentAssistantConversational.tsx
rm src/components/execute/ContentQueue.tsx  # If broken
rm src/components/execute/ContentLibrary.tsx # If broken
```

### Phase 2: Create Core Orchestrator
```typescript
// src/components/execute/NIVContentOrchestrator.tsx
export const NIVContentOrchestrator: React.FC<Props> = ({
  framework,
  opportunity,
  onContentGenerated
}) => {
  const [conversation, setConversation] = useState<Message[]>([])
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Receive and process framework
  useEffect(() => {
    if (framework) {
      processFramework(framework)
    }
  }, [framework])

  // Receive and process opportunity
  useEffect(() => {
    if (opportunity) {
      executeOpportunity(opportunity)
    }
  }, [opportunity])

  // Handle user messages
  const handleUserMessage = async (message: string) => {
    // Add to conversation
    setConversation(prev => [...prev, { role: 'user', content: message }])

    // Get Claude's response
    const response = await handleConversation(message, {
      conversationHistory: conversation,
      activeFramework: framework,
      activeOpportunity: opportunity
    })

    // Add NIV's response
    setConversation(prev => [...prev, { role: 'assistant', content: response.message }])

    // Generate if needed
    if (response.shouldGenerate) {
      await generateContent(response.intent)
    }
  }

  return (
    <div className="niv-content-orchestrator">
      {/* Conversation UI */}
      {/* Queue UI */}
      {/* Generated Content UI */}
    </div>
  )
}
```

### Phase 3: Service Integration
```typescript
// src/lib/content-services.ts
export const ContentServices = {
  // Text content via MCP
  async generateTextContent(type: string, context: any) {
    return fetch('/api/supabase/functions/mcp-content', {
      method: 'POST',
      body: JSON.stringify({ type, ...context })
    })
  },

  // Visual content via Vertex AI
  async generateVisual(type: 'image' | 'video', context: any) {
    return fetch('/api/supabase/functions/vertex-ai-visual', {
      method: 'POST',
      body: JSON.stringify({ type, ...context })
    })
  },

  // Presentations via Gamma
  async generatePresentation(context: any) {
    return fetch('/api/supabase/functions/gamma-presentation', {
      method: 'POST',
      body: JSON.stringify(context)
    })
  },

  // Media lists via MCP
  async generateMediaList(context: any) {
    return fetch('/api/supabase/functions/mcp-media', {
      method: 'POST',
      body: JSON.stringify(context)
    })
  }
}
```

## SUCCESS CRITERIA
- [ ] NIV receives and processes strategic frameworks
- [ ] NIV receives and executes opportunities
- [ ] NIV converses naturally with users (via Claude)
- [ ] NIV routes to correct MCPs/edge functions
- [ ] NIV generates all content types properly
- [ ] NIV saves everything to Memory Vault
- [ ] Response time < 2 seconds for conversation
- [ ] Generation time < 10 seconds for content

## WHAT CHANGES

### BEFORE (BROKEN)
- Hardcoded templates
- Fake conversation
- No orchestration
- No MCP integration
- Ignores user input

### AFTER (WORKING)
- Real Claude conversation
- Framework/opportunity awareness
- Full orchestration pipeline
- All MCPs integrated
- Responsive to users

## CRITICAL REQUIREMENTS
1. **MUST** parse frameworks and opportunities correctly
2. **MUST** use real Claude API for conversation
3. **MUST** route to proper MCPs based on content type
4. **MUST** maintain conversation context
5. **MUST** generate content based on actual user input
6. **MUST** save to Memory Vault