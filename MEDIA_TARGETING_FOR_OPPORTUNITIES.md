# Media Targeting Architecture in SignalDesk V3

## Overview
Media targeting is generated throughout the Campaign Builder pipeline, with data flowing from research → positioning → blueprint → execution. The system uses AI-powered analysis to identify relevant journalists, outlets, and media opportunities based on campaign goals and research context.

---

## 1. HOW MEDIA TARGETS ARE IDENTIFIED AND STRUCTURED

### A. Data Flow Pipeline
```
Research Data (journalists, outlets, beats)
    ↓
Campaign Intelligence Brief (channelIntelligence)
    ↓
PR Campaign Blueprint (mediaTargeting structure)
    ↓
Execution Manager (content pieces with media pitches)
    ↓
Opportunities (playbook-based action items)
```

### B. Media Target Structure

#### In PR Campaign Blueprint (`niv-campaign-pr-blueprint/index.ts`)
```javascript
"mediaTargeting": {
  "tier1Outlets": [
    {
      "outlet": "Outlet name",
      "journalist": "Name or beat",
      "angle": "Why this outlet",
      "timing": "When to pitch"
    }
  ],
  "tier2Outlets": ["outlet1", "outlet2"],
  "industryPublications": ["pub1", "pub2"]
}
```

**Key Fields:**
- `outlet`: Publication name
- `journalist`: Contact name or beat (e.g., "Technology Reporter")
- `angle`: Customized story angle for this outlet
- `timing`: Recommended pitch timing (e.g., "Week 1", "Day 3")

#### In Execution Manager (`ExecutionManager.tsx`)
Media targets are converted to executable content pieces:
```typescript
// From tier1Outlets
if (bp.mediaTargeting?.tier1Outlets) {
  bp.mediaTargeting.tier1Outlets.slice(0, 5).forEach((outlet: any, i: number) => {
    pieces.push({
      id: `media_pitch_${i + 1}`,
      type: `Media Pitch - ${outlet.outlet}`,
      status: 'pending',
      metadata: { priority: 'high', outlet: outlet.outlet }
    })
  })
}
```

#### In Vector Campaign Blueprint (V3 Structure)
More sophisticated multi-channel approach:
```typescript
// pillar4_mediaEngagement in tactical orchestration
{
  journalists: ["Name", "Name"],
  story: "Story angle",
  outlet: "Publication name",
  beat: "Section/beat",
  when: "Phase timing"
}
```

---

## 2. WHAT DATA/LOGIC IS USED TO DETERMINE RELEVANT MEDIA TARGETS

### A. Research-Based Intelligence

**Channel Intelligence from Research Phase:**
```javascript
// From niv-campaign-research-synthesis/index.ts
channelIntelligence: {
  byStakeholder: [
    {
      stakeholder: "string",
      channels: [
        {
          name: "string",
          type: "social|broadcast|online|print|trade",
          reach: "number",
          relevanceScore: "number"
        }
      ]
    }
  ],
  journalists: [  // CRITICAL - feeds into media targeting
    {
      name: "string",
      outlet: "string",
      beat: "string",
      tier: "1|2|3",
      relevanceScore: "number",
      recentArticles: ["string"]
    }
  ],
  outlets: ["outlet1", "outlet2"]
}
```

### B. AI-Driven Analysis Logic

**From PR Blueprint Generator System Prompt:**
```
1. Use research context:
   - Organization context (industry, size, positioning)
   - Key stakeholders and their media habits
   - Narrative environment and current coverage
   - Channel intelligence and identified outlets
   - Competitive landscape

2. Match reporters to story angles:
   - Journalist's beat matches campaign topic
   - Recent coverage indicates interest
   - Tier suggests reach/credibility impact
   - Outlet's audience aligns with target stakeholders

3. Tier-based strategy:
   - Tier 1: Major national/global publications
   - Tier 2: Established industry/trade media
   - Tier 3+: Specialist/niche publications and online media
```

### C. Campaign-Specific Matching

The PR Blueprint generator receives:
```typescript
interface PRBlueprintRequest {
  researchData: any              // Full campaign research
  campaignGoal: string           // Strategic objective
  selectedPositioning: any       // Brand positioning
  refinementRequest?: string     // Optional user refinement
}
```

System uses campaign goal + positioning to select relevant:
- Story angles tailored to each outlet
- Timing based on outlet's publishing cadence
- Journalist fit based on beat and recent work

---

## 3. API ENDPOINTS AND FUNCTIONS FOR MEDIA RECOMMENDATIONS

### A. Direct API Endpoints

#### 1. **niv-campaign-pr-blueprint** (Supabase Function)
**Purpose:** Generate media targets as part of PR campaign blueprint

**Endpoint:** `POST /functions/v1/niv-campaign-pr-blueprint`

**Request:**
```javascript
{
  "researchData": {
    "channelIntelligence": {
      "journalists": [...],
      "outlets": [...]
    },
    "organizationContext": {...},
    "stakeholderIntelligence": {...}
  },
  "campaignGoal": "Launch product with thought leadership angle",
  "selectedPositioning": {
    "name": "Positioning option",
    "description": "Full description"
  },
  "refinementRequest": "Optional: Focus more on trade publications" // Optional
}
```

**Response:**
```javascript
{
  "mediaTargeting": {
    "tier1Outlets": [
      {
        "outlet": "Wall Street Journal",
        "journalist": "Technology Reporter",
        "angle": "Industry disruption story",
        "timing": "Week 1"
      }
    ],
    "tier2Outlets": ["TechCrunch", "VentureBeat"],
    "industryPublications": ["Industry Weekly", "Sector Digest"]
  },
  // ... other blueprint sections
}
```

#### 2. **Media List Builder Service** (`backend/api/media/list-builder.js`)
**Purpose:** Template-based media list generation with Claude AI

**Endpoint:** `POST /api/media/list-builder`

**Request:**
```javascript
{
  "industry": "Technology",
  "topic": "AI Product Launch",
  "geographic": "National",
  "tier": "All tiers",
  "publicationType": "All types",
  "campaignGoals": "Media coverage and thought leadership"
}
```

**Response Structure:**
```javascript
{
  "success": true,
  "mediaList": "Structured text list",
  "structured": {
    "topTier": [
      {
        "outlet": "Publication name",
        "beat": "Reporter beat",
        "why": "Why relevant",
        "angle": "Recommended angle",
        "tips": "Pitching tips",
        "reach": "Audience metrics"
      }
    ],
    "trade": [],
    "digital": [],
    "broadcast": [],
    "influencers": []
  }
}
```

### B. MCP Server: signaldesk-media

**Location:** `/mcp-servers/signaldesk-media/src/index.ts`

**Tools Available:**

#### 1. **find_journalists**
```typescript
Tool: 'find_journalists'
Input: {
  beat: string              // e.g., "technology"
  publication?: string      // Optional: specific outlet
  location?: string         // Optional: geographic focus
  recentCoverage?: boolean  // Default: true
  limit?: number            // Default: 10
}
Output: Array of journalists with:
  - name, publication, beat
  - email, twitter
  - recentArticle
  - relevanceScore (1-10)
```

#### 2. **analyze_journalist**
```typescript
Tool: 'analyze_journalist'
Input: {
  journalistName: string
  publication?: string
}
Output: {
  beats: ["topic1", "topic2"],
  writingStyle: "description",
  publicationFrequency: "2-3 articles/week",
  preferredFormats: ["features", "interviews"],
  recentTopics: [...],
  pitchingAdvice: "tips",
  bestTimeToContact: "optimal window"
}
```

#### 3. **create_media_list**
```typescript
Tool: 'create_media_list'
Input: {
  listName: string
  topic: string
  tier1Publications?: string[]
  targetBeats?: string[]
}
Output: {
  listId: string
  listName: string
  topic: string
  journalistCount: number
  journalists: [
    {
      name, publication, beat,
      email, whyRelevant
    }
  ]
}
```

#### 4. **generate_pitch**
```typescript
Tool: 'generate_pitch'
Input: {
  journalistName: string
  storyAngle: string
  companyInfo?: string
  pitchType: "exclusive|embargo|immediate|follow-up"
}
Output: Personalized email pitch with:
  - Subject line
  - Compelling opening
  - News value statement
  - Key data/points
  - Call to action
```

#### 5. **track_outreach**
```typescript
Tool: 'track_outreach'
Input: {
  action: "log|update|report"
  journalistId?: string
  status?: "sent|opened|responded|declined|published"
  notes?: string
}
Output:
  - Tracks outreach activity
  - Returns outreach reports with metrics
```

### C. Research Phase Functions

#### **niv-campaign-research-synthesis** (Supabase Function)
**Purpose:** Synthesize research including journalist/outlet discovery

**Key Output - channelIntelligence:**
```javascript
{
  "journalists": [
    {
      "name": "Reporter Name",
      "outlet": "Publication",
      "beat": "Technology/Innovation",
      "tier": 1,
      "relevanceScore": 8.5,
      "recentArticles": ["Article 1", "Article 2"]
    }
  ],
  "outlets": ["Outlet1", "Outlet2", "Outlet3"],
  "byStakeholder": [
    {
      "stakeholder": "Stakeholder name",
      "channels": [
        {
          "name": "Channel name",
          "type": "online|print|broadcast|social",
          "reach": 5000000,
          "relevanceScore": 8.2
        }
      ]
    }
  ]
}
```

---

## 4. INTEGRATION WITH OPPORTUNITIES

### A. Current Opportunity Structure

**From opportunities table schema:**
```sql
opportunities {
  id UUID
  organization_id TEXT
  title TEXT
  description TEXT
  data JSONB                    -- Could contain media_targets
  category TEXT                 -- Types: PRESS_RELEASE, CRISIS_RESPONSE, etc.
  execution_plan JSONB          -- V2 execution plan
  version INTEGER               -- 1 = legacy, 2 = execution-ready
  campaign_session_id UUID      -- Link to campaign session
  strategic_context JSONB       -- V2 strategic context
  auto_executable BOOLEAN
  executed BOOLEAN
}
```

### B. Opportunity with Media Playbook

**From opportunity-orchestrator-v2/index.ts:**
```typescript
interface ExecutableOpportunity {
  category: 'PRESS_RELEASE' | 'CRISIS_RESPONSE' | etc.
  
  playbook: {
    template_id?: string
    key_messages: string[]
    target_audience: string
    channels: string[]           // Includes "Email to journalists"
    assets_needed: string[]
  }
  
  action_items: [
    {
      step: number
      action: string             // Could be "Identify media targets"
      owner: string
      deadline: string
    }
  ]
}
```

---

## 5. HOW TO ADD MEDIA TARGETING TO OPPORTUNITIES

### A. Option 1: Minimal Addition (Add media_targets to data JSONB)

```sql
-- No schema change needed - use existing data column
UPDATE opportunities
SET data = jsonb_set(
  COALESCE(data, '{}'),
  '{media_targets}',
  '[
    {
      "outlet": "Publication name",
      "journalist": "Name or beat",
      "angle": "Story angle",
      "timing": "When to pitch"
    }
  ]'
)
WHERE id = opportunity_id;
```

### B. Option 2: Structured Approach (Add media_targets column)

```sql
-- Add dedicated column
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS media_targets JSONB,
ADD COLUMN IF NOT EXISTS media_targets_generated_at TIMESTAMPTZ;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_media_targets 
ON opportunities USING GIN (media_targets);

-- Add comment
COMMENT ON COLUMN opportunities.media_targets IS 
'Media targets identified for PR/outreach: array of {outlet, journalist, angle, timing, tier}';
```

### C. Approach: Generate Media Targets When Opportunity is Created

**In opportunity generator function, add:**
```typescript
// After creating base opportunity, call media targeting
const mediaTargets = await generateMediaTargets({
  category: opportunity.category,
  title: opportunity.title,
  description: opportunity.description,
  organizationContext: org,
  campaignGoal: opportunity.playbook?.key_messages?.[0],
  stakeholders: opportunity.playbook?.target_audience
});

opportunity.media_targets = mediaTargets;
```

### D. Helper Function: Generate Media Targets for Opportunity

```typescript
async function generateMediaTargets(context: {
  category: string
  title: string
  description: string
  organizationContext: any
  campaignGoal: string
  stakeholders: string
}): Promise<MediaTarget[]> {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  });

  const prompt = `Generate media targets for this ${context.category} opportunity:
  
Title: ${context.title}
Description: ${context.description}
Campaign Goal: ${context.campaignGoal}
Target Stakeholders: ${context.stakeholders}
Industry: ${context.organizationContext.industry}
Organization: ${context.organizationContext.name}

Return JSON array with 5-10 media targets:
[
  {
    "outlet": "Publication name",
    "journalist": "Name or beat",
    "beat": "Coverage area",
    "angle": "Customized story angle",
    "timing": "When to contact",
    "tier": 1,
    "rationale": "Why this journalist/outlet"
  }
]

Focus on quality over quantity. Match journalist beats to the opportunity.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  const jsonText = message.content[0].type === 'text' 
    ? message.content[0].text 
    : '[]';
  
  return JSON.parse(jsonText.match(/\[[\s\S]*\]/)[0]);
}
```

---

## 6. KEY DATA SOURCES FOR MEDIA TARGETING

1. **Research channelIntelligence:**
   - Identified journalists with beats matching campaign topic
   - Outlet coverage analysis
   - Stakeholder-specific channels

2. **Campaign Blueprint:**
   - Story angles crafted for positioning
   - Timeline and phases
   - Key messages

3. **MCP signaldesk-media Server:**
   - Journalist discovery by beat
   - Journalist analysis for customization
   - Media list creation
   - Pitch generation

4. **List Builder Template Service:**
   - Industry-specific outlet templates
   - Tier-based outlet classification
   - Geographic filtering

---

## 7. SUMMARY - MEDIA TARGETING FLOW FOR OPPORTUNITIES

```
Opportunity Detection
  ↓
Extract: Category, Title, Goal, Stakeholders
  ↓
[CALL] generateMediaTargets() with context
  ↓
Claude AI generates customized media targets
  ↓
Store in opportunities.data.media_targets or opportunities.media_targets
  ↓
ExecutionManager displays as "Media Pitch" content pieces
  ↓
Track outreach via MCP signaldesk-media tools
```

---

## Files to Reference

### Core Media Targeting Generation
- `/supabase/functions/niv-campaign-pr-blueprint/index.ts` - PR blueprint with media section
- `/supabase/functions/niv-campaign-research-synthesis/index.ts` - Research → channelIntelligence
- `/backend/api/media/list-builder.js` - Template-based media list generation

### Execution & Display
- `/src/components/campaign-builder/ExecutionManager.tsx` - Converts media targets to content pieces
- `/src/components/campaign-builder/BlueprintV3Presentation.tsx` - Shows media engagement pillars

### Opportunities
- `/supabase/functions/opportunity-orchestrator-v2/index.ts` - Opportunity creation with playbooks
- `/supabase/migrations/20251021_update_opportunities_v2.sql` - Opportunities schema

### Media Intelligence
- `/mcp-servers/signaldesk-media/src/index.ts` - MCP server with journalist discovery tools
- `/supabase/functions/niv-campaign-research-synthesis/index.ts` - Research with outlet/journalist extraction

