# NIV Workflow Implementation Plan
## Research & Strategic Framework Generation with Intelligence Module Handoff

---

## Executive Summary
Transform NIV into a research and strategy system that handles complex multi-step information gathering, generates strategic frameworks, and seamlessly hands off to the Intelligence module for sophisticated campaign creation. NIV focuses on research and initial strategy, while the Intelligence module handles execution and campaign generation.

---

## Core Architecture Principle
**NIV's Role:** Research gathering, strategic analysis, framework generation
**Intelligence Module's Role:** Receive NIV frameworks, create detailed campaigns, generate content, build media lists, export deliverables

---

## Core Capabilities to Implement

### 1. **Multi-Step Research Workflow** (Priority 1)
Enable NIV to decompose research requests into sequential/parallel information gathering steps

### 2. **Self-Messaging for Complete Context Building** (Priority 1)
Allow NIV to recognize information gaps and automatically query for missing data

### 3. **Strategic Framework Generation** (Priority 1)
Create structured strategic frameworks that can be handed off to Intelligence module

### 4. **Intelligence Module Handoff Protocol** (Priority 1)
Standardized handoff mechanism to pass frameworks from NIV chat to Intelligence module

### 5. **AG UI Event Protocol Integration** (Priority 2)
Standardize NIV-to-Intelligence communication using AG UI event patterns

---

## Phase 1: NIV Research & Framework Architecture (Week 1)

### 1.1 NIV Strategic Framework Structure
```typescript
// types/niv-strategic-framework.ts
interface NivStrategicFramework {
  id: string
  sessionId: string
  organizationId: string
  timestamp: Date

  // Research findings that led to this framework
  research: {
    sources: ResearchSource[]
    competitors: CompetitorInsight[]
    marketSignals: MarketSignal[]
    opportunities: OpportunitySignal[]
    keyFindings: string[]
  }

  // Strategic analysis and recommendations
  strategy: {
    objective: string
    rationale: string
    positioning: string
    keyMessages: string[]
    narratives: string[]
    timingConsiderations: string
    urgencyLevel: 'immediate' | 'high' | 'medium' | 'low'
  }

  // Handoff instructions for Intelligence module
  handoff: {
    targetModule: 'intelligence'
    campaignType: 'crisis-response' | 'opportunity' | 'competitive' | 'thought-leadership'
    suggestedTactics: string[]
    requiredAssets: string[]
    priority: 'urgent' | 'high' | 'normal'
    context: any // Full research context for Intelligence module
  }
}

interface NivWorkflow {
  id: string
  sessionId: string
  status: 'researching' | 'analyzing' | 'framework-building' | 'ready-for-handoff'

  // Research workflow steps
  steps: ResearchStep[]
  currentStep: number

  // Accumulated context
  context: {
    research: any[]
    competitorData: any[]
    marketIntelligence: any[]
  }

  // Final output
  framework?: NivStrategicFramework
}

interface ResearchStep {
  id: string
  type: 'initial-research' | 'competitor-scan' | 'deep-dive' | 'synthesis'
  status: 'pending' | 'in-progress' | 'completed'

  description: string
  query: string

  // Self-messaging for gaps
  informationGaps?: {
    identified: string[]
    queries: string[]
    priority: 'high' | 'medium' | 'low'
  }

  results?: {
    data: any
    relevance: number
    keyInsights: string[]
  }
}
```

### 1.2 NIV Framework Generator
```typescript
// supabase/functions/niv-framework-generator/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const FRAMEWORK_PROMPT = `You are NIV's strategic framework generator.
Based on research findings, create a strategic framework for the Intelligence module.

Your framework should include:
1. Key findings summary from research
2. Strategic objective and rationale
3. Positioning recommendations
4. Key messages and narratives
5. Campaign type recommendation
6. Suggested tactics for Intelligence module

Focus on strategy, not execution. The Intelligence module will handle campaign creation.`

async function generateStrategicFramework(
  research: any,
  organizationContext: any
): Promise<NivStrategicFramework> {
  const framework = await callClaude({
    systemPrompt: FRAMEWORK_PROMPT,
    context: {
      research: research,
      organization: organizationContext
    },
    tools: [
      {
        name: 'create_framework',
        description: 'Generate strategic framework from research',
        parameters: {
          objective: 'string',
          rationale: 'string',
          keyMessages: 'array',
          campaignType: 'string',
          suggestedTactics: 'array'
        }
      }
    ]
  })

  return {
    ...framework,
    handoff: {
      targetModule: 'intelligence',
      context: research,
      priority: determinePriority(framework)
    }
  }
}

async function executeResearchWorkflow(request: string) {
  const steps = []

  // Step 1: Initial research
  const initialResearch = await nivFireplexity(request)
  steps.push({ type: 'initial-research', results: initialResearch })

  // Step 2: Identify gaps
  const gaps = await identifyInformationGaps(initialResearch, request)

  // Step 3: Self-query for missing information
  if (gaps.length > 0) {
    for (const gap of gaps) {
      const additionalResearch = await nivFireplexity(gap.query)
      steps.push({ type: 'deep-dive', query: gap.query, results: additionalResearch })
    }
  }

  // Step 4: Synthesize and create framework
  const framework = await generateStrategicFramework(steps, organizationContext)

  return framework
}
```

---

## Phase 2: Self-Messaging Architecture (Week 1-2)

### 2.1 Self-Query Detection System
```typescript
// niv-orchestrator-robust modifications
interface SelfQueryTrigger {
  type: 'missing-info' | 'clarification' | 'deep-dive' | 'validation'
  topic: string
  priority: 'high' | 'medium' | 'low'
  query: string
}

async function detectSelfQueryNeeds(
  currentContext: any,
  userRequest: string
): Promise<SelfQueryTrigger[]> {
  const SELF_QUERY_PROMPT = `Analyze if we need additional information.

  Current context: ${JSON.stringify(currentContext)}
  User request: ${userRequest}

  Identify:
  1. Missing critical information
  2. Areas needing deeper investigation
  3. Assumptions that need validation
  4. Related topics to explore

  Return specific follow-up queries needed.`

  const triggers = await callClaude({
    systemPrompt: SELF_QUERY_PROMPT,
    tools: [{
      name: 'identify_queries',
      description: 'Identify self-queries needed'
    }]
  })

  return triggers
}
```

### 2.2 Self-Messaging Queue
```typescript
// services/niv-self-messaging.ts
export class NivSelfMessaging {
  private queue: SelfQueryTrigger[] = []
  private processing: boolean = false

  async addSelfQuery(trigger: SelfQueryTrigger) {
    this.queue.push(trigger)
    if (!this.processing) {
      this.processQueue()
    }
  }

  async processQueue() {
    this.processing = true

    while (this.queue.length > 0) {
      const query = this.queue.shift()

      // Execute self-query
      const response = await this.executeSelfQuery(query)

      // Add to context
      await this.updateContext(query, response)

      // Check if response triggers new queries
      const newTriggers = await detectSelfQueryNeeds(
        this.currentContext,
        query.query
      )

      if (newTriggers.length > 0) {
        this.queue.push(...newTriggers)
      }
    }

    this.processing = false
  }

  private async executeSelfQuery(trigger: SelfQueryTrigger) {
    // Route to appropriate handler based on type
    if (trigger.type === 'missing-info') {
      return await nivFireplexity(trigger.query)
    } else if (trigger.type === 'deep-dive') {
      return await nivDeepResearch(trigger.query)
    }
    // ... other types
  }
}
```

---

## Phase 3: Intelligence Module Handoff System (Week 2)

### 3.1 NIV to Intelligence Handoff Protocol
```typescript
// protocols/niv-intelligence-handoff.ts
export enum HandoffEventType {
  // NIV events
  NIV_FRAMEWORK_READY = 'niv:framework:ready',
  NIV_HANDOFF_INITIATED = 'niv:handoff:initiated',

  // Intelligence module events
  INTELLIGENCE_RECEIVED = 'intelligence:framework:received',
  INTELLIGENCE_PROCESSING = 'intelligence:campaign:processing',
  INTELLIGENCE_COMPLETE = 'intelligence:campaign:complete',

  // Bidirectional events
  REQUEST_MORE_CONTEXT = 'handoff:context:request',
  CONTEXT_PROVIDED = 'handoff:context:provided'
}

interface NivHandoffPayload {
  framework: NivStrategicFramework
  sessionId: string
  organizationId: string

  // What Intelligence module should do
  action: {
    type: 'generate-campaign' | 'analyze-opportunity' | 'create-response'
    urgency: 'immediate' | 'high' | 'normal'
    deliverables: string[] // ['press-release', 'social-posts', 'media-list']
  }

  // Context from NIV's research
  context: {
    research: any[]
    competitors: any[]
    marketSignals: any[]
    userIntent: string
  }
}

interface IntelligenceModuleResponse {
  received: boolean
  processingTime: number

  campaign?: {
    id: string
    title: string
    components: CampaignComponent[]
    status: 'draft' | 'ready' | 'executing'
  }

  needsMoreInfo?: {
    missing: string[]
    questions: string[]
  }
}
```

### 3.2 Intelligence Module Integration
```typescript
// components/modules/IntelligenceStrategy.tsx
export const IntelligenceStrategy = ({ organization }) => {
  const [nivFramework, setNivFramework] = useState<NivStrategicFramework | null>(null)
  const [campaign, setCampaign] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Listen for NIV handoffs
  useEffect(() => {
    const handleNivHandoff = (event: MessageEvent) => {
      if (event.data.type === HandoffEventType.NIV_FRAMEWORK_READY) {
        const payload: NivHandoffPayload = event.data.payload
        setNivFramework(payload.framework)

        // Auto-trigger campaign generation if urgent
        if (payload.action.urgency === 'immediate') {
          generateCampaignFromFramework(payload)
        }
      }
    }

    window.addEventListener('message', handleNivHandoff)
    return () => window.removeEventListener('message', handleNivHandoff)
  }, [])

  const generateCampaignFromFramework = async (handoff: NivHandoffPayload) => {
    setIsGenerating(true)

    // Send to campaign generation API with full NIV context
    const response = await fetch('/api/intelligence/generate-campaign', {
      method: 'POST',
      body: JSON.stringify({
        framework: handoff.framework,
        context: handoff.context,
        deliverables: handoff.action.deliverables,
        organizationId: handoff.organizationId
      })
    })

    const campaignData = await response.json()
    setCampaign(campaignData)
    setIsGenerating(false)

    // Notify NIV of completion
    window.postMessage({
      type: HandoffEventType.INTELLIGENCE_COMPLETE,
      payload: { campaign: campaignData }
    }, '*')
  }

  return (
    <div className="intelligence-strategy">
      {/* NIV Framework Display */}
      {nivFramework && (
        <div className="niv-framework-card">
          <h3>Strategic Framework from NIV</h3>
          <div className="framework-summary">
            <p><strong>Objective:</strong> {nivFramework.strategy.objective}</p>
            <p><strong>Rationale:</strong> {nivFramework.strategy.rationale}</p>
            <p><strong>Urgency:</strong> {nivFramework.strategy.urgencyLevel}</p>
          </div>

          {!campaign && (
            <button
              onClick={() => generateCampaignFromFramework({
                framework: nivFramework,
                action: { type: 'generate-campaign', urgency: 'normal', deliverables: ['all'] },
                context: nivFramework.research
              })}
              disabled={isGenerating}
            >
              Generate Full Campaign
            </button>
          )}
        </div>
      )}

      {/* Generated Campaign Display */}
      {campaign && (
        <CampaignDisplay
          campaign={campaign}
          framework={nivFramework}
        />
      )}
    </div>
  )
}
```

---

## Phase 4: NIV Chat to Intelligence UI Flow (Week 2-3)

### 4.1 NIV Chat Component Updates
```typescript
// components/niv/NivChatbot.tsx
export const NivChatbot = () => {
  const [messages, setMessages] = useState([])
  const [currentFramework, setCurrentFramework] = useState<NivStrategicFramework | null>(null)
  const [isResearching, setIsResearching] = useState(false)

  const handleSendMessage = async (message: string) => {
    setIsResearching(true)

    // NIV performs research
    const response = await fetch('/api/niv/research', {
      method: 'POST',
      body: JSON.stringify({ message, organizationId })
    })

    const { research, framework } = await response.json()

    // Display research findings in chat
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: research.summary,
      data: research
    }])

    // If framework was generated, show handoff button
    if (framework) {
      setCurrentFramework(framework)
    }

    setIsResearching(false)
  }

  const sendToIntelligence = () => {
    // Send framework to Intelligence module
    window.postMessage({
      type: HandoffEventType.NIV_FRAMEWORK_READY,
      payload: {
        framework: currentFramework,
        sessionId: sessionId,
        organizationId: organizationId,
        action: {
          type: 'generate-campaign',
          urgency: determineUrgency(currentFramework),
          deliverables: ['press-release', 'social-posts', 'media-list']
        },
        context: currentFramework.research
      }
    }, '*')

    // Visual feedback
    toast.success('Strategic framework sent to Intelligence module')
  }

  return (
    <div className="niv-chat">
      <div className="messages">
        {messages.map((msg, idx) => (
          <Message key={idx} {...msg} />
        ))}
      </div>

      {/* Strategic Framework Ready */}
      {currentFramework && (
        <div className="framework-ready">
          <div className="framework-preview">
            <h4>Strategic Framework Ready</h4>
            <p>{currentFramework.strategy.objective}</p>
            <div className="key-points">
              {currentFramework.strategy.keyMessages.map(msg => (
                <span className="tag">{msg}</span>
              ))}
            </div>
          </div>
          <button
            className="send-to-intelligence"
            onClick={sendToIntelligence}
          >
            Send to Intelligence Module →
          </button>
        </div>
      )}

      <ChatInput onSend={handleSendMessage} disabled={isResearching} />
    </div>
  )
}
```

### 4.2 Intelligence Module Campaign Generator
```typescript
// api/intelligence/generate-campaign.ts
export const generateCampaignFromNivFramework = async (req: Request) => {
  const { framework, context, deliverables, organizationId } = await req.json()

  // Use framework to create sophisticated campaign
  const campaignPrompt = `
    You are creating a comprehensive PR campaign based on strategic framework.

    Framework Objective: ${framework.strategy.objective}
    Key Messages: ${framework.strategy.keyMessages.join(', ')}
    Campaign Type: ${framework.handoff.campaignType}

    Research Context: ${JSON.stringify(context)}

    Generate:
    ${deliverables.map(d => `- ${d}`).join('\n')}

    Make the campaign immediately executable with specific tactics, timelines, and content.
  `

  // Call campaign MCPs with framework context
  const campaign = await orchestrateCampaignGeneration({
    prompt: campaignPrompt,
    framework: framework,
    mcps: ['mcp-campaigns', 'mcp-content', 'mcp-media', 'mcp-social'],
    organizationId: organizationId
  })

  return {
    campaign: campaign,
    framework: framework,
    generatedAt: new Date(),
    status: 'ready-for-review'
  }
}
```

---

## Phase 5: Complete User Journey Example (Week 3)

### 5.1 Example: Competitive Response Workflow
```typescript
// User journey: "Microsoft just announced a partnership with our competitor. What should we do?"

// Step 1: NIV Chat - Research Phase
const nivChatFlow = {
  userMessage: "Microsoft just announced a partnership with our competitor. What should we do?",

  nivResearchSteps: [
    {
      step: 'initial-research',
      action: 'Search for partnership announcement details',
      tools: ['niv-fireplexity', 'mcp-discovery'],
      output: 'Found 12 articles about Microsoft-Competitor partnership'
    },
    {
      step: 'gap-detection',
      action: 'Identify missing information',
      gaps: ['Partnership terms', 'Market implications', 'Customer reactions'],
      selfQueries: [
        'What are the specific terms of the partnership?',
        'How are customers reacting on social media?',
        'What do industry analysts say?'
      ]
    },
    {
      step: 'deep-research',
      action: 'Fill information gaps',
      tools: ['niv-fireplexity', 'web-search'],
      output: 'Complete picture of partnership and implications'
    },
    {
      step: 'framework-generation',
      action: 'Create strategic framework',
      output: {
        objective: 'Position as superior independent alternative',
        keyMessages: [
          'Independence means flexibility',
          'Direct customer relationship',
          'No vendor lock-in'
        ],
        urgencyLevel: 'high',
        campaignType: 'competitive-response'
      }
    }
  ],

  nivChatDisplay: `
    NIV: I've analyzed the Microsoft partnership announcement. Here's what I found:

    **Key Facts:**
    - Partnership focuses on enterprise AI integration
    - Exclusive features for Microsoft customers
    - Launching in Q2 2025

    **Market Impact:**
    - Analysts predict 15% market share shift
    - Customers expressing vendor lock-in concerns
    - Opportunity window: Next 2 weeks critical

    **Strategic Framework Ready:**
    Objective: Position as superior independent alternative
    [Send to Intelligence Module →]
  `
}

// Step 2: Intelligence Module - Campaign Generation
const intelligenceModuleFlow = {
  receivedFramework: nivChatFlow.nivResearchSteps[3].output,

  campaignGeneration: {
    prompt: 'Generate competitive response campaign using NIV framework',
    mcpsUsed: [
      'mcp-campaigns: Structure campaign timeline',
      'mcp-content: Create press release and blog post',
      'mcp-media: Build journalist target list',
      'mcp-social: Generate social response strategy'
    ],
    output: {
      campaign: {
        title: 'Independence Advantage Campaign',
        components: [
          {
            type: 'press-release',
            headline: 'Company Remains Committed to Open Ecosystem',
            content: '...'
          },
          {
            type: 'social-posts',
            platforms: ['Twitter', 'LinkedIn'],
            posts: [...]
          },
          {
            type: 'media-list',
            journalists: 47,
            beats: ['enterprise tech', 'AI', 'business']
          }
        ],
        timeline: {
          immediate: 'CEO statement on Twitter',
          day1: 'Press release to media',
          day2_7: 'Sustained social campaign',
          week2: 'Customer webinar'
        }
      }
    }
  },

  intelligenceDisplay: `
    **Campaign: Independence Advantage**

    ✅ Press Release: Ready
    ✅ Social Posts: 12 posts scheduled
    ✅ Media List: 47 journalists identified
    ✅ Timeline: 2-week execution plan

    [Export Campaign] [Edit Components] [Execute Now]
  `
}
```

### 5.2 Clear Separation of Responsibilities
```typescript
// Architecture: NIV Research → Strategic Framework → Intelligence Execution

interface SystemArchitecture {
  niv: {
    location: 'Right panel chat interface',
    responsibilities: [
      'Real-time research and monitoring',
      'Information gap detection and self-querying',
      'Strategic analysis and synthesis',
      'Framework generation with key messages',
      'Handoff preparation for Intelligence'
    ],
    doesNot: [
      'Generate detailed campaigns',
      'Create content',
      'Build media lists',
      'Handle execution'
    ]
  },

  intelligence: {
    location: 'Main content area',
    responsibilities: [
      'Receive NIV strategic frameworks',
      'Generate comprehensive campaigns',
      'Create all content types',
      'Build targeted media lists',
      'Manage execution timelines',
      'Export deliverables'
    ],
    receivesFromNiv: {
      framework: 'Strategic direction and objectives',
      context: 'Research findings and market intelligence',
      urgency: 'Timeline and priority indicators',
      suggestions: 'Tactical recommendations'
    }
  },

  workflow: {
    step1: 'User asks NIV for research/strategy',
    step2: 'NIV researches, self-queries gaps, builds context',
    step3: 'NIV generates strategic framework',
    step4: 'User clicks "Send to Intelligence"',
    step5: 'Intelligence receives framework with full context',
    step6: 'Intelligence generates sophisticated campaign',
    step7: 'User reviews and exports campaign'
  }
}
```

---

## Implementation Timeline

### Week 1: Core Workflow System
- [ ] Create workflow types and interfaces
- [ ] Build workflow orchestrator edge function
- [ ] Implement basic workflow decomposition
- [ ] Add workflow execution engine
- [ ] Create workflow UI components

### Week 2: Self-Messaging & Events
- [ ] Implement self-query detection
- [ ] Build self-messaging queue system
- [ ] Integrate AG UI event protocol
- [ ] Add SSE streaming support
- [ ] Create event monitoring UI

### Week 3: Plan Generation & Testing
- [ ] Build plan generator from context
- [ ] Create interactive plan builder UI
- [ ] Implement workflow examples
- [ ] Test multi-step scenarios
- [ ] Add error recovery

### Week 4: Integration & Polish
- [ ] Connect to existing NIV components
- [ ] Implement component handoffs
- [ ] Add workflow persistence (optional)
- [ ] Performance optimization
- [ ] Documentation and training

---

## Key Benefits

### 1. **Clear Separation of Concerns**
NIV focuses on research and strategy, Intelligence module handles sophisticated campaign execution.

### 2. **Self-Improving Research**
NIV automatically identifies and fills information gaps through self-messaging.

### 3. **Context-Rich Handoffs**
Strategic frameworks carry full research context to Intelligence module.

### 4. **Sophisticated Campaign Generation**
Intelligence module uses MCPs to create comprehensive, executable campaigns.

### 5. **Seamless User Experience**
Natural flow from NIV chat research to Intelligence campaign generation.

---

## Success Metrics

### Technical Metrics
- Framework generation time: <30 seconds
- Self-query accuracy: >80%
- Handoff success rate: >95%
- Campaign generation time: <60 seconds

### User Experience Metrics
- Time from research to campaign: <3 minutes
- Context preservation in handoff: >95%
- Reduced back-and-forth: -50%

### Quality Metrics
- Strategic framework clarity: >9/10
- Campaign completeness: >90%
- Research comprehensiveness: >85%

---

## Risk Mitigation

### Risk: Infinite Self-Query Loops
**Mitigation**:
- Max query depth limit (e.g., 5 levels)
- Similarity detection to prevent duplicate queries
- Time-based circuit breakers

### Risk: Context Overload
**Mitigation**:
- Context pruning algorithms
- Relevance scoring for information
- Summarization at each step

### Risk: Workflow Complexity
**Mitigation**:
- Start with simple 2-3 step workflows
- Gradual complexity increase
- User approval gates for complex flows

---

## Next Actions

1. **Review & Approve Plan**
   - Validate approach with team
   - Identify any missing requirements
   - Set implementation priorities

2. **Begin Phase 1 Implementation**
   - Create workflow types
   - Build orchestrator edge function
   - Test with simple workflows

3. **Prepare Testing Scenarios**
   - Define test cases for multi-step prompts
   - Create evaluation criteria
   - Set up monitoring

4. **Resource Allocation**
   - Assign development resources
   - Set up testing environment
   - Plan deployment strategy

---

## Conclusion

This implementation plan establishes a clear architecture where:
- **NIV** serves as the research and strategic framework generator in the chat interface
- **Intelligence Module** receives frameworks and creates sophisticated campaigns in the main UI
- **Self-messaging** ensures NIV builds complete context before generating frameworks
- **Handoff protocol** preserves all research and strategic context for campaign generation

The separation of concerns ensures each component excels at its core function: NIV for research and strategy, Intelligence for execution and campaign creation. This architecture provides users with a natural workflow from initial research question to fully executable campaign in under 3 minutes.