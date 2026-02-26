# VECTOR Campaign Builder - Complete Specification

## Executive Summary

The VECTOR Campaign Builder is an advanced, multi-stage campaign planning and execution system that guides users from campaign intent through research, positioning, strategy selection, blueprint generation, and content execution. It supports both traditional PR campaigns and advanced multi-stakeholder VECTOR campaigns.

## System Architecture Overview

```
User Intent → Research → Positioning → Approach Selection → Blueprint → Execution → Memory Vault
     ↓           ↓            ↓              ↓                ↓            ↓
  Refinement  Refinement  Refinement    Refinement      Refinement   Refinement
     Loop        Loop        Loop          Loop            Loop         Loop
```

## Stage-by-Stage Flow

### Stage 1: Campaign Intent Capture

**User Input:**
- Campaign goal/objective (free text)
- Timeline/urgency (optional)
- Constraints or requirements (optional)

**System Output:**
- Acknowledgment of intent
- Clarifying questions if needed
- Ready to proceed to research

**Refinement Options:**
- User can clarify or modify goal
- System asks intelligent follow-up questions

### Stage 2: Strategic Research

**System Actions:**
Uses existing MCP architecture (similar to `enhanced-mcp-architecture.md`) with parallel agents:

1. **Stakeholder Intelligence Agent**
   - Identifies 3-5 key stakeholder groups
   - For each: psychology, values, fears, information sources
   - Current perceptions of organization/industry/topic
   - Decision-making triggers and objection patterns

2. **Narrative Environment Agent**
   - Current dominant narratives in space
   - Narrative vacuums and opportunities
   - Competitive positioning landscape
   - Cultural/social context

3. **Channel Intelligence Agent**
   - Where each stakeholder group consumes information
   - Trust levels by source/channel
   - Optimal reach strategies per group
   - Cross-channel amplification opportunities

4. **Historical Pattern Agent**
   - Similar successful campaigns
   - What worked and why
   - Pattern recommendations
   - Risk factors to avoid

**System Output:**
Structured "Campaign Intelligence Brief" with:
```json
{
  "stakeholders": [
    {
      "name": "string",
      "size": "number",
      "psychology": {
        "values": ["string"],
        "fears": ["string"],
        "aspirations": ["string"],
        "biases": ["string"]
      },
      "informationDiet": {
        "primarySources": ["string"],
        "trustedVoices": ["string"],
        "consumptionPatterns": "string"
      },
      "currentPerceptions": {
        "ofOrganization": "string",
        "ofIndustry": "string",
        "ofTopic": "string"
      },
      "decisionTriggers": ["string"],
      "objectionPatterns": ["string"]
    }
  ],
  "narrativeLandscape": {
    "dominantNarratives": ["string"],
    "narrativeVacuums": ["string"],
    "competitivePositioning": ["string"],
    "culturalContext": "string"
  },
  "channelIntelligence": {
    "byStakeholder": [
      {
        "stakeholder": "string",
        "channels": ["string"],
        "trustLevels": {},
        "optimalTiming": "string"
      }
    ]
  },
  "historicalInsights": {
    "successfulCampaigns": ["string"],
    "patternRecommendations": ["string"],
    "riskFactors": ["string"]
  }
}
```

**Refinement Options:**
- "Tell me more about [stakeholder group]"
- "What about [different angle/topic]?"
- "Look deeper into [specific aspect]"
- "Show alternative research perspectives"

### Stage 3: Positioning Options

**System Actions:**
Analyzes research + campaign goal to generate 2-4 strategic positioning options

**System Output:**
```json
{
  "positions": [
    {
      "name": "Innovation Leader",
      "tagline": "First to market with breakthrough technology",
      "rationale": "Research shows stakeholders value cutting-edge solutions...",
      "strengths": ["string"],
      "risks": ["string"],
      "bestFor": ["stakeholder groups"],
      "narrativeAngle": "string"
    }
  ]
}
```

**Example Positions:**
- Innovation Leader
- Trusted Alternative
- Customer Champion
- Industry Disruptor
- Sustainability Pioneer
- Value Optimizer

**Refinement Options:**
- "Show more aggressive/conservative positions"
- "Combine elements of option X and Y"
- "Create positioning that emphasizes [specific value]"
- "What if we positioned as [user suggestion]?"

### Stage 4: Campaign Approach Selection

**System Output:**
Two distinct campaign approaches based on selected positioning:

#### Option A: PR Campaign (Traditional)
```json
{
  "type": "PR_CAMPAIGN",
  "approach": "traditional",
  "overview": "string",
  "tactics": [
    "Press releases",
    "Media outreach",
    "Spokesperson positioning",
    "Event-based activities"
  ],
  "timeline": "string",
  "resourceRequirements": "string",
  "expectedOutcomes": ["string"],
  "bestFor": "Straightforward announcements, established narratives"
}
```

#### Option B: VECTOR Campaign (Advanced)
```json
{
  "type": "VECTOR_CAMPAIGN",
  "approach": "advanced_multi_stakeholder",
  "overview": "string",
  "tactics": [
    "Multi-vector stakeholder orchestration",
    "Sequential narrative deployment",
    "Psychological influence design",
    "Cross-channel coordination"
  ],
  "timeline": "string",
  "resourceRequirements": "string",
  "expectedOutcomes": ["string"],
  "bestFor": "Complex stakeholder landscapes, behavior change goals"
}
```

**Refinement Options:**
- "Show me the other approach"
- "Can we do a hybrid?"
- "What if we add [specific tactic] to this approach?"

**Navigation:**
- User can go back to positioning
- User can restart with different goal

### Stage 5: Blueprint Generation

Different blueprints based on approach selection:

#### PR Campaign Blueprint

```json
{
  "type": "PR_CAMPAIGN",
  "positioning": "string",
  "overview": {
    "goal": "string",
    "timeline": "string",
    "keyMessages": ["string"]
  },
  "mediaStrategy": {
    "targetMedia": ["string"],
    "pitchAngles": ["string"],
    "newsHooks": ["string"]
  },
  "spokespersonStrategy": {
    "primarySpokesperson": "string",
    "talkingPoints": ["string"],
    "mediaTraining": ["string"]
  },
  "contentPlan": {
    "pressRelease": { "title": "string", "outline": "string" },
    "mediaPitch": { "subject": "string", "outline": "string" },
    "factSheet": { "outline": "string" },
    "socialPosts": { "count": 5, "themes": ["string"] }
  },
  "timeline": {
    "phases": [
      {
        "name": "string",
        "duration": "string",
        "activities": ["string"]
      }
    ]
  },
  "measurementPlan": {
    "kpis": ["string"],
    "trackingMethod": "string"
  }
}
```

#### VECTOR Campaign Blueprint

**Full 4-Part Structure:**

```json
{
  "type": "VECTOR_CAMPAIGN",
  "positioning": "string",
  "automaticPattern": "CASCADE|MIRROR|CHORUS|TROJAN|NETWORK",

  // PART 1: Campaign Goal & Success Framework
  "campaignGoal": {
    "primaryObjective": "string",
    "behavioralOutcome": "string (what specific action/belief change)",
    "successMetrics": [
      {
        "metric": "string",
        "target": "string",
        "measurement": "string"
      }
    ],
    "timeline": {
      "duration": "string",
      "keyMilestones": [
        { "date": "string", "milestone": "string" }
      ]
    },
    "urgencyWindow": "string"
  },

  // PART 2: Stakeholder Mapping (Deep Psychology)
  "stakeholderMapping": {
    "groups": [
      {
        "name": "string",
        "priority": "primary|secondary|tertiary",
        "size": "number",
        "psychographicProfile": {
          "values": ["string"],
          "fears": ["string"],
          "aspirations": ["string"],
          "cognitiveBiases": ["string"],
          "identityTriggers": ["string"]
        },
        "informationEcosystem": {
          "primarySources": ["string"],
          "trustedVoices": ["string"],
          "consumptionPatterns": "string",
          "shareDrivers": ["string"]
        },
        "currentState": {
          "awarenessLevel": "none|low|moderate|high",
          "currentPerception": "string",
          "existingBeliefs": ["string"],
          "knownObjections": ["string"]
        },
        "decisionJourney": {
          "currentStage": "unaware|aware|considering|decided|advocate",
          "movementTriggers": ["string"],
          "validationNeeds": ["string"],
          "socialProofRequirements": ["string"]
        },
        "influencePathways": {
          "directInfluencers": ["string"],
          "peerNetworks": ["string"],
          "authorityFigures": ["string"]
        }
      }
    ],
    "stakeholderInterplay": {
      "sequencingStrategy": "string (e.g., Group A shift enables Group B)",
      "crossGroupDynamics": ["string"]
    }
  },

  // PART 3: Sequential Communications Strategy Per Group
  "communicationsStrategy": {
    "byStakeholder": [
      {
        "stakeholder": "string",
        "engagementPhases": [
          {
            "phase": "1_AWARENESS",
            "objective": "string",
            "duration": "string",
            "narrative": {
              "coreMessage": "string",
              "framingStrategy": "string",
              "emotionalTone": "string",
              "proofPoints": ["string"]
            },
            "channels": [
              {
                "channel": "string",
                "rationale": "string",
                "format": "string",
                "frequency": "string"
              }
            ],
            "validationSources": ["string"],
            "successIndicators": ["string"]
          },
          {
            "phase": "2_CONSIDERATION",
            "objective": "string",
            "duration": "string",
            "narrative": {
              "coreMessage": "string (builds on awareness)",
              "deepeningStrategy": "string",
              "evidenceProvision": ["string"],
              "objectionHandling": ["string"]
            },
            "channels": ["..."],
            "socialProofDeployment": ["string"],
            "successIndicators": ["string"]
          },
          {
            "phase": "3_CONVERSION",
            "objective": "string",
            "duration": "string",
            "narrative": {
              "actionTrigger": "string",
              "urgencyCreation": "string",
              "barrierRemoval": ["string"],
              "finalValidation": ["string"]
            },
            "channels": ["..."],
            "callToAction": "string",
            "successIndicators": ["string"]
          },
          {
            "phase": "4_ADVOCACY",
            "objective": "string",
            "duration": "string",
            "narrative": {
              "amplificationMessage": "string",
              "shareableAssets": ["string"],
              "communityBuilding": "string"
            },
            "channels": ["..."],
            "viralMechanics": ["string"],
            "successIndicators": ["string"]
          }
        ],
        "crossChannelCoordination": "string",
        "timingStrategy": "string"
      }
    ],
    "narrativeEvolution": {
      "overallArc": "string",
      "thematicProgression": ["string"],
      "momentumBuilding": "string"
    }
  },

  // PART 4: Tactical Execution Synthesis
  "executionSynthesis": {
    "contentInventory": {
      "totalPieces": "number",
      "byType": [
        {
          "type": "string",
          "count": "number",
          "purpose": "string",
          "targetStakeholder": "string",
          "phase": "string",
          "priority": "high|medium|low",
          "specs": {
            "format": "string",
            "length": "string",
            "tone": "string",
            "keyElements": ["string"]
          }
        }
      ]
    },
    "distributionPlan": {
      "byPhase": [
        {
          "phase": "string",
          "startDate": "string",
          "content": [
            {
              "piece": "string",
              "channel": "string",
              "timing": "string",
              "stakeholder": "string"
            }
          ]
        }
      ],
      "channelStrategy": {
        "owned": ["string"],
        "earned": ["string"],
        "shared": ["string"],
        "paid": ["string (if applicable)"]
      }
    },
    "orchestrationCalendar": {
      "weeks": [
        {
          "week": "number",
          "focus": "string",
          "activations": ["string"]
        }
      ]
    },
    "measurementFramework": {
      "byStakeholder": [
        {
          "stakeholder": "string",
          "kpis": ["string"],
          "trackingMethod": "string",
          "optimizationTriggers": ["string"]
        }
      ],
      "overallMetrics": ["string"]
    },
    "contingencyPlans": {
      "scenarios": [
        {
          "risk": "string",
          "response": "string",
          "preparedAssets": ["string"]
        }
      ]
    }
  },

  // Pattern Mechanics (Internal - drives execution)
  "patternMechanics": {
    "selectedPattern": "string",
    "rationale": "string",
    "implementation": {
      "sequenceLogic": "string",
      "amplificationStrategy": "string",
      "coordinationPoints": ["string"]
    }
  }
}
```

**Refinement Options:**
- "Adjust timeline to be [faster/slower]"
- "Add more focus on [stakeholder/channel/tactic]"
- "Change approach for [specific group]"
- "Show alternative narrative for [phase]"

### Stage 6: Content Execution

**System Actions:**
Takes blueprint → generates actual content pieces

**Integration with `niv-content-intelligent-v2`:**

The execution stage needs to pass structured context to the content generator:

```typescript
// For each content piece in executionSynthesis.contentInventory
{
  contentType: "press_release" | "social_post" | "media_pitch" | etc.,
  targetStakeholder: "string",
  phase: "awareness|consideration|conversion|advocacy",
  specs: {
    format: "string",
    length: "string",
    tone: "string",
    keyElements: ["string"]
  },
  context: {
    campaignGoal: "string",
    positioning: "string",
    stakeholderProfile: {...},
    narrativeStrategy: {...},
    proofPoints: ["string"]
  }
}
```

**`niv-content-intelligent-v2` Enhancements Needed:**

1. **Accept VECTOR Campaign Context**
```typescript
interface VectorContentRequest {
  campaignId: string;
  blueprintContext: VectorBlueprint;
  contentPiece: {
    type: string;
    targetStakeholder: string;
    phase: string;
    specs: any;
  };
  organizationId: string;
  organizationContext: {
    name: string;
    industry: string;
    positioning: string;
  };
}
```

2. **Content Generation Strategy**
   - Use stakeholder psychology to inform tone/framing
   - Align with phase-specific narrative objectives
   - Include appropriate proof points and validation
   - Match channel specifications

3. **Quality Assurance**
   - Check alignment with positioning
   - Verify phase-appropriate messaging
   - Ensure stakeholder-specific framing

**System Output:**
Generated content organized by:
- Stakeholder group
- Phase
- Channel
- Priority

**Refinement Options:**
- "Regenerate [specific piece] with [different approach]"
- "Make [piece] more [adjective]"
- "Add [element] to [piece]"
- "Create additional content for [stakeholder/channel]"

### Stage 7: Memory Vault Integration

**After Blueprint Generation:**
Save to memory vault as structured campaign template

```typescript
{
  type: "campaign_blueprint",
  campaign_type: "PR_CAMPAIGN" | "VECTOR_CAMPAIGN",
  positioning: "string",
  stakeholder_count: number,
  pattern_used: "string (if VECTOR)",
  organization_id: "string",
  created_at: "timestamp",
  metadata: {
    goal: "string",
    industry: "string",
    stakeholder_groups: ["string"],
    timeline: "string"
  },
  blueprint_data: {...}, // Full blueprint
  research_data: {...}, // Original research
  success_metrics: [...] // For future learning
}
```

**After Content Execution:**
Save generated content with rich context

```typescript
{
  type: "campaign_content",
  campaign_id: "string",
  content_type: "string",
  target_stakeholder: "string",
  phase: "string",
  organization_id: "string",
  created_at: "timestamp",
  metadata: {
    positioning: "string",
    narrative_objective: "string",
    channels: ["string"]
  },
  content_data: "string",
  context_used: {...}, // What informed generation
  performance_data: null // Will be updated later
}
```

**Memory Vault Enhancements Needed:**

1. **New Collection: `campaign_blueprints`**
   - Stores full campaign plans
   - Searchable by positioning, industry, stakeholder types
   - Links to generated content

2. **New Collection: `campaign_content`**
   - Stores all generated content pieces
   - Links back to blueprint
   - Tags for retrieval (stakeholder, phase, type)

3. **Pattern Learning System**
   - Track which patterns work for which scenarios
   - Stakeholder psychology insights
   - Successful positioning strategies
   - Content performance by phase

4. **Retrieval Strategy**
   - "Show me campaigns similar to [current goal]"
   - "What positioning worked for [industry]?"
   - "Find content that converted [stakeholder type]"
   - "Show campaigns using [pattern]"

## Technical Architecture

### Edge Functions Required

#### 1. `niv-campaign-builder-orchestrator`
**Purpose:** Main router for all campaign builder interactions

**Input:**
```typescript
{
  sessionId: string;
  currentStage: 'intent' | 'research' | 'positioning' | 'approach' | 'blueprint' | 'execution';
  userMessage: string;
  campaignContext: {
    goal?: string;
    research?: CampaignIntelligenceBrief;
    positioning?: PositioningOption;
    approach?: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN';
    blueprint?: PRBlueprint | VectorBlueprint;
  };
  conversationHistory: Message[];
  organizationId: string;
  organizationContext: {
    name: string;
    industry: string;
  };
}
```

**Output:**
```typescript
{
  action: 'refine' | 'regenerate' | 'navigate' | 'execute' | 'complete';
  nextStage: string;
  response: string;
  updatedContext: any;
  requiresInput: boolean;
}
```

**Logic:**
- Analyzes user message intent (refinement, navigation, execution)
- Routes to appropriate sub-function
- Maintains conversation context
- Handles stage transitions

#### 2. `niv-campaign-research`
**Purpose:** Orchestrates parallel research agents

**Input:**
```typescript
{
  campaignGoal: string;
  organizationId: string;
  organizationContext: {
    name: string;
    industry: string;
  };
  refinementRequest?: string; // For deep-dives
}
```

**Output:**
```typescript
CampaignIntelligenceBrief {
  stakeholders: Stakeholder[];
  narrativeLandscape: NarrativeLandscape;
  channelIntelligence: ChannelIntelligence;
  historicalInsights: HistoricalInsights;
}
```

**Research Agent Orchestration:**

The `niv-campaign-research` function orchestrates 6 parallel research agents, each using specific MCP tools:

1. **Organization Context Agent**
   - **Tool**: `mcp-discovery`
   - **Call**: `POST /functions/v1/mcp-discovery` with `{ organization: orgName, industry_hint: industry }`
   - **Returns**: Comprehensive org profile with competitors, stakeholders, sources, monitoring config
   - **Used For**: Understanding competitive landscape, identifying key stakeholders, getting industry context

2. **Stakeholder Intelligence Agent**
   - **Tools**: `mcp-discovery` (initial list) + `niv-fireplexity` (recent activity)
   - **Process**:
     1. Get stakeholder list from discovery profile
     2. For each stakeholder group, call `niv-fireplexity` with `timeWindow: '48h'` to find recent mentions
     3. Synthesize psychological profile based on recent behavior patterns
   - **Used For**: Deep psychological profiling - values, fears, information diet, decision triggers

3. **Narrative Environment Agent**
   - **Tools**: `niv-fireplexity` (48h-7d) + `knowledge-library-registry` (framing research)
   - **Process**:
     1. Call `niv-fireplexity` with industry/topic queries, `timeWindow: '7d'`
     2. Call `knowledge-library-registry` for framing research and narrative theory
     3. Identify dominant narratives, vacuums, and positioning opportunities
   - **Used For**: Mapping current discourse, finding narrative opportunities, understanding cultural context

4. **Channel Intelligence Agent**
   - **Tools**: `master-source-registry` + `journalist-registry`
   - **Process**:
     1. Call `master-source-registry` with `{ industry }` to get industry-specific sources
     2. Call `journalist-registry` with `{ industry, tier: 'tier1', count: 20 }` for key contacts
     3. Map channels to stakeholder groups based on consumption patterns
   - **Used For**: Identifying optimal channels per stakeholder, finding journalist contacts, prioritizing outlets

5. **Historical Pattern Agent**
   - **Tool**: `knowledge-library-registry`
   - **Call**: `POST /functions/v1/knowledge-library-registry` with `{ pattern, research_area: 'case_studies' }`
   - **Returns**: Relevant case studies, academic research, proven methodologies
   - **Used For**: Learning from similar campaigns, pattern recommendations, risk identification

6. **Competitive Movement Agent**
   - **Tool**: `niv-fireplexity`
   - **Process**:
     1. Get competitor list from mcp-discovery
     2. For each top 5 competitors, call `niv-fireplexity` with `timeWindow: '24h'`
     3. Identify recent announcements, strategic moves, positioning changes
   - **Used For**: Real-time competitive intelligence, identifying threats/opportunities

**Agent Synthesis:**
After all agents complete, synthesize findings into unified `CampaignIntelligenceBrief`

**MCP Tools Reference:**
- **`mcp-discovery`**: Creates comprehensive organization profiles with competitors, stakeholders, sources
- **`niv-fireplexity`**: Time-filtered web search (24h, 48h, 7d windows) with relevance scoring
- **`knowledge-library-registry`**: Academic research, case studies, methodologies for each pattern
- **`journalist-registry`**: Tier-1 journalist database with outlet metadata and beat coverage
- **`master-source-registry`**: Industry-specific news sources, RSS feeds, priority outlets

#### 3. `niv-positioning-generator`
**Purpose:** Creates positioning options from research

**Input:**
```typescript
{
  campaignGoal: string;
  researchFindings: CampaignIntelligenceBrief;
  organizationContext: any;
  refinementRequest?: string;
}
```

**Output:**
```typescript
{
  positions: PositioningOption[];
  rationale: string;
}
```

#### 4. `niv-pr-campaign-generator`
**Purpose:** Generates traditional PR campaign blueprint

**Input:**
```typescript
{
  campaignGoal: string;
  positioning: PositioningOption;
  research: CampaignIntelligenceBrief;
  organizationContext: any;
}
```

**Output:**
```typescript
PRBlueprint {
  // Structure shown in Stage 5
}
```

#### 5. `niv-vector-campaign-generator`
**Purpose:** Generates advanced VECTOR campaign blueprint

**Input:**
```typescript
{
  campaignGoal: string;
  positioning: PositioningOption;
  research: CampaignIntelligenceBrief;
  organizationContext: any;
}
```

**Output:**
```typescript
VectorBlueprint {
  // Full 4-part structure shown in Stage 5
}
```

**Internal Logic:**
- Automatically selects appropriate pattern (CASCADE, MIRROR, etc.)
- Builds stakeholder journey maps
- Creates sequential engagement phases
- Synthesizes tactical execution plan

#### 6. `niv-campaign-executor`
**Purpose:** Generates content from blueprint

**Input:**
```typescript
{
  blueprintId: string;
  blueprint: PRBlueprint | VectorBlueprint;
  contentPieces: string[]; // Which pieces to generate
  organizationContext: any;
}
```

**Output:**
```typescript
{
  generatedContent: [
    {
      id: string;
      type: string;
      targetStakeholder?: string;
      phase?: string;
      content: string;
      metadata: any;
    }
  ]
}
```

**Calls:**
- `niv-content-intelligent-v2` for each content piece
- Passes rich VECTOR context

### Database Schema

#### Table: `campaign_builder_sessions`
```sql
CREATE TABLE campaign_builder_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  user_id text,

  -- Session State
  current_stage text NOT NULL, -- 'intent', 'research', 'positioning', 'approach', 'blueprint', 'execution'
  status text NOT NULL, -- 'active', 'completed', 'abandoned'

  -- Campaign Data
  campaign_goal text NOT NULL,
  research_findings jsonb,
  selected_positioning jsonb,
  selected_approach text, -- 'PR_CAMPAIGN' or 'VECTOR_CAMPAIGN'
  blueprint jsonb,

  -- Conversation
  conversation_history jsonb DEFAULT '[]'::jsonb,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_campaign_sessions_org ON campaign_builder_sessions(org_id);
CREATE INDEX idx_campaign_sessions_status ON campaign_builder_sessions(status);
```

#### Table: `campaign_blueprints`
```sql
CREATE TABLE campaign_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES campaign_builder_sessions(id),
  org_id text NOT NULL,

  -- Blueprint Type
  campaign_type text NOT NULL, -- 'PR_CAMPAIGN' or 'VECTOR_CAMPAIGN'
  pattern_used text, -- For VECTOR campaigns

  -- Core Data
  positioning text NOT NULL,
  blueprint_data jsonb NOT NULL,
  research_data jsonb NOT NULL,

  -- Metadata for Learning
  goal_category text,
  industry text,
  stakeholder_groups text[],
  timeline_weeks integer,

  -- Status
  status text DEFAULT 'draft', -- 'draft', 'approved', 'in_execution', 'completed'

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blueprints_org ON campaign_blueprints(org_id);
CREATE INDEX idx_blueprints_type ON campaign_blueprints(campaign_type);
CREATE INDEX idx_blueprints_industry ON campaign_blueprints(industry);
```

#### Table: `campaign_content`
```sql
CREATE TABLE campaign_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id uuid REFERENCES campaign_blueprints(id),
  org_id text NOT NULL,

  -- Content Details
  content_type text NOT NULL, -- 'press_release', 'social_post', 'media_pitch', etc.
  target_stakeholder text,
  phase text, -- 'awareness', 'consideration', 'conversion', 'advocacy'
  channel text,

  -- Content
  content_data text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Context Used for Generation
  generation_context jsonb,

  -- Performance Tracking
  performance_metrics jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_content_blueprint ON campaign_content(blueprint_id);
CREATE INDEX idx_content_org ON campaign_content(org_id);
CREATE INDEX idx_content_type ON campaign_content(content_type);
```

#### Memory Vault Collections

Add to existing memory vault schema:

```typescript
// Collection: campaign_templates
{
  id: string;
  type: "campaign_blueprint";
  campaign_type: "PR_CAMPAIGN" | "VECTOR_CAMPAIGN";
  positioning: string;
  industry: string;
  stakeholder_types: string[];
  pattern: string; // if VECTOR
  blueprint_summary: string; // LLM-generated summary
  success_indicators: string[];
  metadata: {
    org_id: string;
    created_at: string;
    goal_category: string;
    timeline_weeks: number;
  };
  embedding: number[]; // For similarity search
}

// Collection: campaign_learnings
{
  id: string;
  type: "campaign_learning";
  insight: string; // "Positioning X worked well for stakeholder Y because..."
  evidence: string[];
  campaign_ids: string[];
  metadata: {
    industry: string;
    stakeholder_type: string;
    positioning: string;
    pattern: string;
  };
  embedding: number[];
}
```

## UI Component Architecture

### Main Component: `CampaignBuilderWizard.tsx`

```typescript
interface CampaignBuilderWizardProps {
  organizationId: string;
  organizationContext: {
    name: string;
    industry: string;
  };
  onComplete?: (blueprint: any) => void;
}

export default function CampaignBuilderWizard({
  organizationId,
  organizationContext,
  onComplete
}: CampaignBuilderWizardProps)
```

**State Management:**
```typescript
const [sessionId, setSessionId] = useState<string>()
const [currentStage, setCurrentStage] = useState<Stage>('intent')
const [campaignContext, setCampaignContext] = useState<CampaignContext>({})
const [conversationHistory, setConversationHistory] = useState<Message[]>([])
const [isProcessing, setIsProcessing] = useState(false)
const [userInput, setUserInput] = useState('')
```

**Component Structure:**
```
CampaignBuilderWizard/
├── StageIndicator
│   └── Shows: Intent → Research → Positioning → Approach → Blueprint → Execute
│
├── StageContent (conditional rendering)
│   ├── IntentCapture
│   ├── ResearchPresentation
│   ├── PositioningSelection
│   ├── ApproachSelection
│   ├── BlueprintReview
│   └── ExecutionManager
│
├── ConversationDisplay
│   └── Shows all messages with refinement history
│
├── InputSection
│   ├── Text input for refinements/questions
│   ├── Quick action buttons (context-sensitive)
│   └── Submit button
│
└── NavigationControls
    ├── Back button (with stage history)
    ├── Next button (when applicable)
    └── Restart button
```

### Sub-Components

#### `IntentCapture.tsx`
```typescript
interface IntentCaptureProps {
  onSubmit: (goal: string) => void;
  isProcessing: boolean;
}

// Features:
// - Large text area for campaign goal
// - Optional fields for timeline/constraints
// - Example prompts
// - Submit button
```

#### `ResearchPresentation.tsx`
```typescript
interface ResearchPresentationProps {
  research: CampaignIntelligenceBrief;
  onRefine: (request: string) => void;
  onAccept: () => void;
}

// Features:
// - Tabbed view: Stakeholders | Narratives | Channels | History
// - Expandable sections for detail
// - "Tell me more about..." quick buttons
// - Accept & Continue button
```

#### `PositioningSelection.tsx`
```typescript
interface PositioningSelectionProps {
  positions: PositioningOption[];
  onSelect: (position: PositioningOption) => void;
  onRefine: (request: string) => void;
}

// Features:
// - Card-based layout for each position
// - Strengths/risks display
// - "Show more options" button
// - Select & Continue
```

#### `ApproachSelection.tsx`
```typescript
interface ApproachSelectionProps {
  prApproach: PRApproachOverview;
  vectorApproach: VectorApproachOverview;
  onSelect: (approach: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN') => void;
}

// Features:
// - Side-by-side comparison
// - Detailed view for each
// - Ability to switch views
// - Select & Generate Blueprint
```

#### `BlueprintReview.tsx`
```typescript
interface BlueprintReviewProps {
  blueprint: PRBlueprint | VectorBlueprint;
  type: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN';
  onRefine: (request: string) => void;
  onApprove: () => void;
  onExecute: () => void;
}

// Features:
// - Structured display of blueprint
// - Expandable/collapsible sections
// - Edit icons for requesting refinements
// - Approve & Execute buttons
// - Download/export options
```

#### `ExecutionManager.tsx`
```typescript
interface ExecutionManagerProps {
  blueprint: any;
  contentPieces: ContentPiece[];
  onGenerate: (pieces: string[]) => void;
  onRefineContent: (pieceId: string, request: string) => void;
}

// Features:
// - Content piece checklist
// - Generation progress
// - Preview of generated content
// - Regenerate buttons
// - Export options
```

## Integration Points

### 1. With NIV Orchestrator
- Campaign builder can be triggered from NIV chat
- NIV can reference campaign blueprints in conversations
- Shared conversation context

### 2. With Intelligence Module
- Research stage uses same MCP tools
- Can leverage existing intelligence findings
- Stakeholder data flows between systems

### 3. With Opportunities Module
- Opportunities can trigger campaign creation
- Campaign execution can create new opportunities
- Bidirectional relationship

### 4. With Execute Module
- Generated content flows to Execute workspace
- Can trigger distribution from there
- Media lists, social scheduling, etc.

### 5. With Memory Vault
- Blueprints saved as templates
- Content saved with context
- Learning system improves future campaigns
- Retrieval for similar scenarios

## API Routes

### Next.js API Routes

#### `/api/campaign-builder/orchestrator` (POST)
Main orchestration endpoint
```typescript
Body: {
  sessionId?: string;
  currentStage: string;
  userMessage: string;
  campaignContext: any;
  conversationHistory: Message[];
  organizationId: string;
}

Response: {
  sessionId: string;
  action: string;
  nextStage: string;
  response: string;
  updatedContext: any;
  requiresInput: boolean;
}
```

#### `/api/campaign-builder/session` (GET, POST, PUT)
Session management
```typescript
GET ?sessionId=xxx
Response: { session: CampaignBuilderSession }

POST
Body: { organizationId: string, campaignGoal: string }
Response: { sessionId: string }

PUT
Body: { sessionId: string, updates: any }
Response: { success: boolean }
```

#### `/api/campaign-builder/blueprint` (GET, POST)
Blueprint operations
```typescript
GET ?blueprintId=xxx
Response: { blueprint: any }

POST
Body: { sessionId: string, blueprint: any }
Response: { blueprintId: string }
```

#### `/api/campaign-builder/execute` (POST)
Content execution
```typescript
Body: {
  blueprintId: string;
  contentPieces: string[];
}

Response: {
  generatedContent: GeneratedContent[];
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Get one complete stage working end-to-end

**Tasks:**
1. Create database schema
2. Build `niv-campaign-builder-orchestrator` edge function (basic routing)
3. Build `niv-campaign-research` edge function
4. Create `IntentCapture` component
5. Create `ResearchPresentation` component
6. Implement Stage 1 → Stage 2 flow with refinement

**Success Criteria:**
- User can input campaign goal
- System runs research and presents findings
- User can ask for refinements
- Research updates based on feedback

### Phase 2: Positioning & Approach (Week 2)
**Tasks:**
1. Build `niv-positioning-generator` edge function
2. Create `PositioningSelection` component
3. Create `ApproachSelection` component
4. Implement Stage 3 → Stage 4 flow

**Success Criteria:**
- System generates positioning options
- User can refine and select
- System presents PR vs VECTOR choice
- Navigation works (back to positioning)

### Phase 3: Blueprint Generation (Week 3)
**Tasks:**
1. Build `niv-pr-campaign-generator` edge function
2. Build `niv-vector-campaign-generator` edge function
3. Implement automatic pattern selection logic
4. Create `BlueprintReview` component with refinement
5. Implement Stage 5 flow

**Success Criteria:**
- Both PR and VECTOR blueprints generate correctly
- Full 4-part VECTOR structure implemented
- User can refine sections
- Blueprint updates properly

### Phase 4: Content Execution (Week 4)
**Tasks:**
1. Build `niv-campaign-executor` edge function
2. Enhance `niv-content-intelligent-v2` to accept VECTOR context
3. Create `ExecutionManager` component
4. Implement Stage 6 flow
5. Content regeneration/refinement

**Success Criteria:**
- Content generates from blueprint
- Rich context flows to content generator
- User can refine individual pieces
- Generated content matches blueprint specs

### Phase 5: Memory Vault & Learning (Week 5)
**Tasks:**
1. Implement blueprint saving to memory vault
2. Implement content saving with context
3. Build retrieval/search functionality
4. Implement pattern learning system
5. Add "Similar campaigns" feature

**Success Criteria:**
- Blueprints saved and retrievable
- Content linked to blueprints
- System learns from patterns
- Future campaigns benefit from history

### Phase 6: Polish & Integration (Week 6)
**Tasks:**
1. Full UI polish and refinement
2. Integration with other modules
3. Performance optimization
4. Error handling and edge cases
5. Documentation and examples

**Success Criteria:**
- Smooth UX throughout
- Works with NIV, Intelligence, Execute modules
- Fast response times
- Handles errors gracefully

## Key Differences: PR vs VECTOR Campaigns

| Aspect | PR Campaign | VECTOR Campaign |
|--------|-------------|-----------------|
| **Complexity** | Single narrative, broad audience | Multi-stakeholder, sequential phases |
| **Timeline** | Standard PR cycle | Orchestrated over time |
| **Stakeholder Analysis** | Basic segmentation | Deep psychological profiling |
| **Narrative Strategy** | One core message | Phase-specific narrative evolution |
| **Content Approach** | Traditional PR materials | Stakeholder-specific, phase-aligned |
| **Channels** | Standard media/social | Optimized per stakeholder/phase |
| **Measurement** | Traditional PR metrics | Behavioral change indicators |
| **Blueprint Size** | Moderate | Comprehensive (4-part structure) |
| **Best For** | Announcements, launches | Complex behavior change, multi-audience |

## Success Metrics

### System Performance
- Average time per stage: < 30 seconds
- Blueprint generation: < 60 seconds
- Content generation per piece: < 20 seconds
- User satisfaction: > 4.5/5

### Usage Metrics
- Campaigns created per week
- PR vs VECTOR ratio
- Refinement requests per stage
- Completion rate (intent → execution)

### Learning Metrics
- Pattern effectiveness over time
- Positioning success rates
- Stakeholder accuracy improvements
- Content quality improvements

## Open Questions / Future Enhancements

1. **Collaboration Features**
   - Multi-user campaign building
   - Comments and approvals
   - Role-based access

2. **Campaign Monitoring**
   - Real-time performance tracking
   - Automated optimization suggestions
   - A/B testing frameworks

3. **Advanced Patterns**
   - Custom pattern creation
   - Hybrid pattern combinations
   - Industry-specific patterns

4. **Integration Expansions**
   - CRM integration
   - Marketing automation
   - Analytics platforms

5. **AI Enhancements**
   - Image generation for content
   - Video script generation
   - Voice/podcast content

## Conclusion

This VECTOR Campaign Builder represents a significant evolution from tactical PR generation to strategic campaign orchestration. The phased approach with refinement at each stage ensures user control while leveraging AI for deep analysis and generation. The dual-path (PR vs VECTOR) approach serves both traditional and advanced use cases, while the memory vault integration enables continuous learning and improvement.

**Next Step:** Begin Phase 1 implementation with research stage development.
