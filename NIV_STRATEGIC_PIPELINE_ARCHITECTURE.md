# NIV Strategic Pipeline Architecture
## From Research Tool to Strategic Orchestrator

### Vision
Transform NIV from a sophisticated research assistant into a strategic advisor that drives actionable execution across the entire SignalDesk platform.

---

## Current State vs. Desired State

### Current Flow
```
User Query → NIV → Research (Fireplexity) → Raw Intelligence → User Reads → Manual Action
```

### Desired Flow
```
User Query → NIV → Research → Strategic Framework → Discovery Context → Strategic Orchestrator → Execution Pipeline → Component Handoff → Automated Action
```

---

## Core Architecture Components

### 1. NIV Discovery Context (Critical Foundation)
Similar to MCP-Discovery in the Intelligence Pipeline, NIV must provide rich context for downstream processing:

```typescript
interface NivDiscoveryContext {
  // Organization Profile (like MCP-Discovery)
  organization: {
    id: string
    name: string
    industry: string
    positioning: string
    strengths: string[]
    vulnerabilities: string[]
  }

  // Competitive Landscape
  competitors: {
    direct: CompetitorProfile[]
    indirect: CompetitorProfile[]
    emerging: CompetitorProfile[]
  }

  // Market Environment
  market: {
    trends: Trend[]
    opportunities: Opportunity[]
    threats: Threat[]
    regulatory: RegulatoryItem[]
  }

  // Strategic Assets
  assets: {
    narratives: string[]
    keyMessages: string[]
    channels: Channel[]
    stakeholders: Stakeholder[]
  }

  // Historical Context
  history: {
    recentCampaigns: Campaign[]
    successPatterns: Pattern[]
    lessonsLearned: Lesson[]
  }

  // Session Context (maintains conversation awareness)
  session: {
    conversationId: string
    userIntent: string
    previousDecisions: Decision[]
    constraints: Constraint[]
  }
}
```

### 2. NIV Strategic Framework Generator

NIV outputs structured frameworks, not just research:

```typescript
interface NivStrategicFramework {
  // Discovery context flows through
  discoveryContext: NivDiscoveryContext

  // Strategic Core
  strategy: {
    objective: string
    rationale: string
    successMetrics: Metric[]
    risks: Risk[]
  }

  // Narrative Architecture
  narrative: {
    coreStory: string
    supportingMessages: Message[]
    proofPoints: ProofPoint[]
    positioning: PositionStatement
  }

  // Execution Blueprint
  execution: {
    channels: {
      primary: ChannelStrategy[]
      secondary: ChannelStrategy[]
    }
    timeline: {
      phases: Phase[]
      milestones: Milestone[]
      dependencies: Dependency[]
    }
    resources: {
      required: Resource[]
      optional: Resource[]
    }
  }

  // Intelligence Support
  intelligence: {
    competitorMoves: CompetitorAction[]
    marketSignals: Signal[]
    timingConsiderations: TimingFactor[]
    opportunities: OpportunityWindow[]
  }

  // Handoff Instructions
  handoff: {
    targetComponent: 'campaign' | 'plan' | 'execute' | 'opportunity'
    executionType: string // e.g., "product-launch", "crisis-response"
    priority: 'urgent' | 'high' | 'normal' | 'low'
    specialInstructions: string[]
  }
}
```

### 3. Strategic Orchestrator MCP (Context-Aware Claude)

A Claude-powered orchestrator that understands the full context:

```typescript
// mcp-strategic-orchestrator/index.ts
const ORCHESTRATOR_SYSTEM_PROMPT = `You are the Strategic Orchestrator for SignalDesk.

You receive strategic frameworks from NIV that include:
1. Full discovery context about the organization
2. Strategic objectives and rationale
3. Narrative and messaging architecture
4. Execution blueprints with timelines

Your role is to:
1. Interpret the strategic framework
2. Orchestrate specialized MCPs to develop detailed execution plans
3. Ensure all context flows through to execution
4. Maintain awareness of organizational constraints and history
5. Generate comprehensive, actionable outputs for components

You have access to:
- Campaign MCP: For campaign development
- Content MCP: For content creation
- Media MCP: For media strategy
- Analytics MCP: For measurement planning
- Crisis MCP: For risk mitigation

Always preserve the discovery context as you orchestrate execution.`

async function orchestrateStrategy(
  framework: NivStrategicFramework,
  claudeContext: any
) {
  // Claude understands the full context
  const orchestrationPlan = await claude.analyze({
    systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
    framework: framework,
    discoveryContext: framework.discoveryContext,
    instruction: `
      Based on this strategic framework and discovery context:
      1. Identify which MCPs need to be engaged
      2. Determine the sequence and dependencies
      3. Define what each MCP should produce
      4. Plan how outputs will be integrated
    `
  })

  // Execute orchestration with full context awareness
  const results = await executeOrchestrationPlan(
    orchestrationPlan,
    framework.discoveryContext
  )

  // Synthesize into unified execution plan
  return await synthesizeExecutionPlan(results, framework)
}
```

### 4. Component Handoff Protocol

Standardized handoff that preserves all context:

```typescript
interface ComponentHandoff {
  // Source tracking
  source: {
    component: 'niv'
    sessionId: string
    timestamp: string
  }

  // Full context preservation
  context: {
    discovery: NivDiscoveryContext
    framework: NivStrategicFramework
    orchestration: OrchestrationResult
  }

  // Component-specific payload
  payload: {
    // For Campaign Intelligence
    campaign?: {
      brief: string
      category: string
      type: string
      timeline: Timeline
      assets: Asset[]
      stakeholders: Stakeholder[]
    }

    // For Plan component
    project?: {
      phases: Phase[]
      tasks: Task[]
      milestones: Milestone[]
      dependencies: Dependency[]
      resources: Resource[]
    }

    // For Execute component
    content?: {
      pieces: ContentPiece[]
      calendar: ContentCalendar
      templates: Template[]
      guidelines: Guideline[]
    }

    // For Opportunity Engine
    opportunity?: {
      window: OpportunityWindow
      trigger: Trigger
      response: ResponsePlan
      timeline: Timeline
    }
  }

  // Execution instructions
  instructions: {
    immediate: string[]
    scheduled: string[]
    conditional: string[]
  }

  // Tracking and feedback
  tracking: {
    expectedOutcomes: Outcome[]
    successMetrics: Metric[]
    feedbackLoop: string // How results flow back to NIV
  }
}
```

---

## Implementation Flow

### Phase 1: Enhanced NIV Output Structure
Update NIV to generate discovery context and frameworks:

```typescript
// niv-orchestrator-robust/index.ts additions
async function processUserQuery(message: string, context: any) {
  // Step 1: Research (existing)
  const research = await performResearch(message, context)

  // Step 2: Generate Discovery Context (NEW)
  const discoveryContext = await generateDiscoveryContext(
    research,
    context.organizationId,
    context.sessionId
  )

  // Step 3: Create Strategic Framework (NEW)
  const framework = await createStrategicFramework(
    research,
    discoveryContext,
    message
  )

  // Step 4: Return structured output
  return {
    research: research,
    discovery: discoveryContext,
    framework: framework,
    handoffReady: true
  }
}
```

### Phase 2: Build Strategic Orchestrator MCP

```typescript
// mcp-strategic-orchestrator/tools.ts
const orchestratorTools = [
  {
    name: "analyze_framework",
    description: "Understand strategic intent and requirements"
  },
  {
    name: "develop_campaign",
    description: "Create detailed campaign from strategy"
  },
  {
    name: "generate_content_plan",
    description: "Develop content calendar and assets"
  },
  {
    name: "map_stakeholders",
    description: "Identify and plan stakeholder engagement"
  },
  {
    name: "create_timeline",
    description: "Build execution timeline with dependencies"
  },
  {
    name: "identify_risks",
    description: "Assess risks and mitigation strategies"
  },
  {
    name: "synthesize_plan",
    description: "Combine all elements into unified plan"
  }
]
```

### Phase 3: Component Integration

Each component receives and processes handoffs:

```javascript
// CampaignIntelligence.js
const NivHandoffReceiver = ({ handoff }) => {
  useEffect(() => {
    if (handoff && handoff.source.component === 'niv') {
      // Auto-populate with full context
      const { discovery, framework, campaign } = handoff.context

      // Set campaign parameters
      setCampaignBrief(campaign.brief)
      setOrganizationContext(discovery.organization)
      setCompetitorContext(discovery.competitors)

      // Preserve strategic rationale
      setStrategicRationale(framework.strategy.rationale)

      // Trigger generation with context
      generateWithFullContext(handoff)
    }
  }, [handoff])
}
```

---

## Example User Journey

### 1. User Input to NIV
**User**: "We need to respond to Microsoft's new AI partnership announcement. They're moving into our space. What should we do?"

### 2. NIV Research Phase
- Gathers intelligence on Microsoft partnership
- Analyzes competitive implications
- Identifies market reactions
- Finds opportunity windows

### 3. NIV Discovery Context Generation
```json
{
  "organization": {
    "name": "OpenAI",
    "positioning": "AI safety and capability leader",
    "strengths": ["GPT-4", "First mover", "Developer ecosystem"]
  },
  "competitors": {
    "direct": ["Microsoft", "Anthropic", "Google"],
    "emerging": ["New partnership entity"]
  },
  "market": {
    "trends": ["Partnership consolidation", "Enterprise AI adoption"],
    "opportunities": ["Differentiation on openness", "Developer loyalty"]
  }
}
```

### 4. NIV Strategic Framework
```json
{
  "strategy": {
    "objective": "Reinforce leadership position despite competitive move",
    "rationale": "Microsoft partnership validates market but doesn't diminish our technical lead"
  },
  "narrative": {
    "coreStory": "OpenAI remains the innovation leader while others follow",
    "keyMessages": ["Technical superiority", "Open ecosystem", "Developer first"]
  },
  "execution": {
    "channels": ["developer blog", "media interviews", "product demo"],
    "timeline": {
      "phases": ["immediate response", "sustained campaign", "product proof"]
    }
  },
  "handoff": {
    "targetComponent": "campaign",
    "executionType": "competitive-response",
    "priority": "high"
  }
}
```

### 5. Strategic Orchestrator Processing
- Receives framework with full discovery context
- Engages Campaign MCP for response campaign
- Engages Content MCP for blog posts and demos
- Engages Media MCP for interview placement
- Synthesizes into comprehensive plan

### 6. Component Handoff
Campaign Intelligence receives:
- Complete context about the competitive situation
- Pre-structured campaign framework
- Timeline and dependencies
- Success metrics
- All ready for execution

---

## Key Advantages

### 1. **Context Preservation**
Discovery context flows through entire pipeline, ensuring nothing is lost in translation.

### 2. **Claude Awareness**
Strategic Orchestrator (Claude) has full visibility into organization context, history, and constraints.

### 3. **Structured Handoffs**
Components receive actionable, structured data rather than raw research.

### 4. **Strategic Coherence**
NIV provides strategic rationale that guides all downstream execution.

### 5. **Feedback Loops**
Results flow back to NIV for learning and improvement.

### 6. **Disconnected from Legacy**
Uses Firecrawl Observer instead of old Intelligence Pipeline for opportunity detection.

---

## UI/UX Rendering Architecture

### Display Strategy: Dual-Mode Presentation

#### Mode 1: NIV Chat Interface (Right Panel)
The existing NIV chat remains for conversation and strategic development:
```typescript
interface NivChatDisplay {
  // Conversation flow
  messages: Message[]

  // Strategic framework preview
  frameworkPreview: {
    objective: string
    keyActions: string[]
    readyToExecute: boolean
  }

  // Action buttons
  actions: {
    sendToCampaign: boolean
    sendToPlan: boolean
    sendToExecute: boolean
    refineStrategy: boolean
  }
}
```

#### Mode 2: Component-Integrated Display (Main Content Area)

Each component gets a dedicated NIV output section that replaces or enhances existing displays:

### Intelligence Component Integration

```typescript
// SimpleIntelligence.tsx modifications
const IntelligenceComponent = () => {
  const [activeView, setActiveView] = useState<'pipeline' | 'campaign' | 'strategic'>('pipeline')
  const [nivOutput, setNivOutput] = useState<NivStrategicFramework | null>(null)

  return (
    <div className="intelligence-container">
      {/* Tab Navigation */}
      <div className="view-tabs">
        <button onClick={() => setActiveView('pipeline')}>
          Intelligence Pipeline
        </button>
        <button onClick={() => setActiveView('campaign')}>
          Campaign Intelligence
        </button>
        <button onClick={() => setActiveView('strategic')}>
          NIV Strategic {nivOutput && '✓'}
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeView === 'pipeline' && <ExistingPipelineDisplay />}
        {activeView === 'campaign' && <CampaignIntelligence />}
        {activeView === 'strategic' && <NivStrategicDisplay output={nivOutput} />}
      </div>
    </div>
  )
}
```

### NIV Strategic Display Component

```typescript
// components/niv/NivStrategicDisplay.tsx
const NivStrategicDisplay = ({ output }: { output: NivStrategicFramework }) => {
  if (!output) {
    return <EmptyState message="Ask NIV to develop a strategy" />
  }

  return (
    <div className="niv-strategic-display">
      {/* Executive Summary Card */}
      <div className="executive-summary">
        <h2>{output.strategy.objective}</h2>
        <p className="rationale">{output.strategy.rationale}</p>
        <div className="metrics">
          {output.strategy.successMetrics.map(metric => (
            <MetricBadge key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      {/* Strategic Narrative */}
      <div className="narrative-section">
        <h3>Core Narrative</h3>
        <div className="story-card">
          <p className="core-story">{output.narrative.coreStory}</p>
          <div className="messages">
            {output.narrative.supportingMessages.map(msg => (
              <MessageCard key={msg.id} message={msg} />
            ))}
          </div>
        </div>
      </div>

      {/* Execution Timeline */}
      <div className="timeline-section">
        <h3>Execution Plan</h3>
        <Timeline phases={output.execution.timeline.phases} />
        <ChannelStrategy channels={output.execution.channels} />
      </div>

      {/* Intelligence Context */}
      <div className="intelligence-support">
        <h3>Supporting Intelligence</h3>
        <div className="intel-grid">
          <CompetitorMoves moves={output.intelligence.competitorMoves} />
          <MarketSignals signals={output.intelligence.marketSignals} />
          <OpportunityWindows windows={output.intelligence.opportunities} />
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button className="primary" onClick={() => sendToCampaign(output)}>
          Generate Campaign
        </button>
        <button onClick={() => sendToPlan(output)}>
          Create Project Plan
        </button>
        <button onClick={() => sendToExecute(output)}>
          Build Content
        </button>
        <button onClick={() => refineWithNiv(output)}>
          Refine Strategy
        </button>
      </div>
    </div>
  )
}
```

### Campaign Intelligence Enhancement

When NIV hands off to Campaign Intelligence:

```javascript
// CampaignIntelligence.js modifications
const CampaignIntelligence = () => {
  const [nivContext, setNivContext] = useState(null)
  const [showNivInsights, setShowNivInsights] = useState(false)

  // Receive from NIV
  useEffect(() => {
    const handleNivHandoff = (event) => {
      if (event.data.type === 'niv-handoff') {
        setNivContext(event.data.payload)
        setShowNivInsights(true)

        // Auto-populate campaign fields
        populateCampaignFromNiv(event.data.payload)
      }
    }

    window.addEventListener('message', handleNivHandoff)
    return () => window.removeEventListener('message', handleNivHandoff)
  }, [])

  return (
    <div className="campaign-intelligence">
      {/* NIV Context Banner */}
      {nivContext && (
        <div className="niv-context-banner">
          <div className="context-summary">
            <h4>NIV Strategic Context</h4>
            <p>{nivContext.framework.strategy.objective}</p>
            <button onClick={() => setShowNivInsights(!showNivInsights)}>
              {showNivInsights ? 'Hide' : 'Show'} NIV Insights
            </button>
          </div>
        </div>
      )}

      {/* NIV Insights Panel */}
      {showNivInsights && nivContext && (
        <div className="niv-insights-panel">
          <div className="insights-grid">
            <div className="insight-card">
              <h5>Competitive Context</h5>
              <ul>
                {nivContext.discovery.competitors.direct.map(comp => (
                  <li key={comp.id}>{comp.name}: {comp.recentMove}</li>
                ))}
              </ul>
            </div>
            <div className="insight-card">
              <h5>Timing Considerations</h5>
              <p>{nivContext.framework.intelligence.timingConsiderations[0]}</p>
            </div>
            <div className="insight-card">
              <h5>Key Messages</h5>
              <ul>
                {nivContext.framework.narrative.supportingMessages.map(msg => (
                  <li key={msg.id}>{msg.text}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Existing Campaign Form - Now Pre-populated */}
      <div className="campaign-form">
        {/* ... existing form fields ... */}
      </div>

      {/* Generated Campaign Display */}
      {generatedCampaign && (
        <div className="campaign-output">
          {/* Show NIV influence badge */}
          {nivContext && (
            <div className="niv-enhanced-badge">
              ✨ Enhanced with NIV Strategic Intelligence
            </div>
          )}
          {/* ... existing campaign display ... */}
        </div>
      )}
    </div>
  )
}
```

### Opportunities Module Integration

```typescript
// OpportunitiesModule.tsx modifications
const OpportunitiesModule = () => {
  const [opportunities, setOpportunities] = useState([])
  const [nivOpportunity, setNivOpportunity] = useState(null)

  return (
    <div className="opportunities-module">
      {/* NIV-Generated Opportunity Card */}
      {nivOpportunity && (
        <div className="niv-opportunity featured">
          <div className="opportunity-header">
            <span className="badge niv">NIV Strategic</span>
            <h3>{nivOpportunity.title}</h3>
          </div>
          <div className="opportunity-body">
            <p className="rationale">{nivOpportunity.rationale}</p>
            <div className="timing">
              <Clock /> {nivOpportunity.window}
            </div>
            <div className="actions">
              <button onClick={() => executeOpportunity(nivOpportunity)}>
                Execute Now
              </button>
              <button onClick={() => scheduleLater(nivOpportunity)}>
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Opportunities */}
      <div className="opportunities-grid">
        {opportunities.map(opp => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    </div>
  )
}
```

### Plan Component Integration

```typescript
// PlanComponent.tsx modifications
const PlanComponent = () => {
  const [projects, setProjects] = useState([])
  const [nivProject, setNivProject] = useState(null)

  return (
    <div className="plan-component">
      {nivProject && (
        <div className="niv-project-card">
          <div className="project-header">
            <h3>{nivProject.name}</h3>
            <span className="source">Generated from NIV Strategy</span>
          </div>

          {/* Interactive Timeline */}
          <div className="project-timeline">
            <GanttChart
              phases={nivProject.phases}
              milestones={nivProject.milestones}
              dependencies={nivProject.dependencies}
            />
          </div>

          {/* Task Board */}
          <div className="task-board">
            {nivProject.phases.map(phase => (
              <div key={phase.id} className="phase-column">
                <h4>{phase.name}</h4>
                {phase.tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    context={nivProject.context}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Resource Allocation */}
          <div className="resources">
            <ResourceAllocation resources={nivProject.resources} />
          </div>
        </div>
      )}
    </div>
  )
}
```

### Visual Design System

```css
/* NIV Strategic Display Styles */
.niv-strategic-display {
  --niv-primary: #7C3AED;
  --niv-secondary: #A78BFA;
  --niv-accent: #F3E8FF;
}

.executive-summary {
  background: linear-gradient(135deg, var(--niv-primary), var(--niv-secondary));
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.narrative-section .story-card {
  background: var(--niv-accent);
  border-left: 4px solid var(--niv-primary);
  padding: 1.5rem;
  border-radius: 8px;
}

.timeline-section {
  display: grid;
  gap: 1rem;
}

.intel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

/* NIV Context Banner */
.niv-context-banner {
  background: linear-gradient(90deg, #F3E8FF, #EDE9FE);
  border: 1px solid var(--niv-primary);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

/* NIV Enhanced Badge */
.niv-enhanced-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--niv-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
}
```

### Data Flow for Display

```typescript
// State management for NIV outputs across components
interface NivGlobalState {
  // Current strategic framework
  activeFramework: NivStrategicFramework | null

  // Component-specific outputs
  outputs: {
    campaign?: CampaignOutput
    plan?: ProjectPlan
    content?: ContentPlan
    opportunity?: OpportunityResponse
  }

  // Display preferences
  display: {
    showNivInsights: boolean
    autoPopulate: boolean
    preserveContext: boolean
  }

  // Session tracking
  session: {
    conversationId: string
    organizationId: string
    lastUpdate: Date
  }
}
```

---

## Implementation Priorities

### Immediate (Week 1)
1. Define `NivDiscoveryContext` interface
2. Update NIV to generate discovery context
3. Create basic framework generator

### Short-term (Week 2-3)
1. Build `mcp-strategic-orchestrator`
2. Implement Claude-aware orchestration
3. Create handoff protocol

### Medium-term (Week 4-6)
1. Update Campaign Intelligence for handoffs
2. Integrate Plan and Execute components
3. Implement Firecrawl Observer for opportunities

### Long-term (Week 7+)
1. Add feedback loops
2. Implement learning system
3. Scale to all components

---

## Success Metrics

### Technical Metrics
- Context preservation rate: >95%
- Handoff success rate: >90%
- Component auto-population: 100%

### Business Metrics
- Time from query to action: <5 minutes
- Strategic coherence score: >8/10
- User intervention required: <20%

### Quality Metrics
- Strategic rationale clarity: High
- Execution plan completeness: >90%
- Component satisfaction: >85%

---

## Risk Mitigation

### Risk: Context Loss
**Mitigation**: Implement context validation at each handoff point

### Risk: Over-Automation
**Mitigation**: Maintain human review gates at critical decisions

### Risk: Component Incompatibility
**Mitigation**: Standardize handoff protocol across all components

### Risk: Claude Hallucination
**Mitigation**: Ground all decisions in discovery context and research

---

## Conclusion

This architecture transforms NIV from a research tool into a true strategic advisor that:
1. Understands organizational context deeply
2. Generates actionable strategic frameworks
3. Orchestrates comprehensive execution plans
4. Seamlessly hands off to specialized components
5. Maintains context and coherence throughout

The key innovation is treating NIV's output as a **Discovery Context** (like MCP-Discovery) that flows through the entire pipeline, ensuring Claude and all components have full awareness of the strategic situation.