# GEO-VECTOR Campaign Architecture

## Overview

GEO-VECTOR is **not a separate campaign type** - it's a VECTOR campaign augmented with AI query ownership intelligence. This architecture maintains human stakeholders as the primary target while adding AI visibility metrics to each tactical action.

## Core Philosophy

**Traditional comms drives AI visibility.** To improve AI platform citations, you still need to:
- Get media coverage in publications AI platforms trust
- Create authoritative content that AI platforms index
- Build social proof that AI platforms detect
- Publish documentation that AI platforms crawl
- **+ Optimize with schemas** for direct AI access

## The Complete Flow

### 1. User Input
**Campaign Builder**: User creates GEO-VECTOR campaign
- Organization: e.g., "Mitsui & Co."
- Campaign Goal: e.g., "Increase AI visibility for our commodity trading platform"
- Campaign Type: `GEO_VECTOR_CAMPAIGN`

### 2. Research Pipeline (2-3 minutes)
**Location**: `src/lib/services/campaignBuilderService.ts` → `startResearchPipeline()`

**Parallel Research Calls**:
1. **Organization Discovery** (`mcp-discovery`)
   - Organization profile
   - Industry analysis
   - Competitive landscape

2. **Narrative Environment** (`niv-fireplexity`)
   - Industry trends
   - Narrative landscape
   - Messaging opportunities

3. **Channel Intelligence** (`journalist-registry`)
   - Journalist database
   - Names, outlets, beats, tiers
   - Contact information

4. **Historical Patterns** (`knowledge-library-registry`)
   - Successful campaign patterns
   - Case studies
   - Timing insights

**Stakeholder Intelligence**:
- Previously: Attempted web research (failed - stakeholders aren't news topics)
- **Now**: Inferred from org profile + campaign goal during synthesis
- Output: 3-5 detailed stakeholder personas with psychology, fears, aspirations

**Synthesis** (`niv-campaign-research-synthesis`):
- Combines all research into intelligence brief
- Identifies human stakeholders (VCs, buyers, analysts, etc.)
- Maps influence levers
- Prepares for blueprint generation

**Output**: `researchData` object with full intelligence brief

---

### 3. GEO Intelligence Layer (30-60 seconds)
**Location**: `src/components/campaign-builder/CampaignBuilderWizard.tsx` (lines 657-688)

**API Call**: `/api/geo/intelligence`
**Edge Function**: `niv-geo-campaign-intelligence`

**Process**:

#### Step 3.1: Query Discovery
**Calls**: `geo-query-discovery` edge function
- Inputs: Organization name, industry, campaign goal
- Uses Claude to generate contextual queries
- Considers: Industry patterns, competitors, service lines
- Output: 20-30 prioritized queries categorized by intent

**Example Queries**:
```json
{
  "query": "best commodity trading platform",
  "category": "transactional",
  "priority": "high",
  "intent": "commercial"
}
```

#### Step 3.2: AI Citation Analysis
**Claude Analysis** of AI platform behavior:
- **ChatGPT (GPT-4o)**:
  - Highly cited: TechCrunch (80%), ArsTechnica, G2
  - Citation rates: Schemas 75%, Docs 70%, Media 65%
  - Query types: Product comparisons, how-to, best [category]

- **Claude (Anthropic)**:
  - Highly cited: Academic papers, thoughtful analysis
  - Citation rates: Analysis 65%, Technical docs 70%
  - Query types: Deep analysis, ethical considerations

- **Perplexity**:
  - Highly cited: Research papers (75%), News (70%)
  - Citation rates: Diverse, authority-focused
  - Query types: Research-oriented, data-driven

- **Gemini (Google)**:
  - Highly cited: Google-indexed, structured data
  - Citation rates: Schemas 75%, High-authority 60%
  - Query types: Factual, definitions, comparisons

#### Step 3.3: Content Type Mapping
Maps traditional comms tactics to AI citation potential:
```json
{
  "tacticType": "media_pitch",
  "priority": 1,
  "targetQueries": ["best enterprise trading platform"],
  "citationImpact": "high",
  "rationale": "TechCrunch cited in 80% of enterprise software queries",
  "targetOutlets": ["TechCrunch", "Bloomberg"]
}
```

#### Step 3.4: Schema Opportunity Identification
Identifies direct AI optimization opportunities:
```json
{
  "type": "Product",
  "priority": 1,
  "impactScore": 90,
  "targetQueries": ["commodity trading software", "trading platform comparison"],
  "platforms": ["ChatGPT", "Gemini"],
  "rationale": "Product schema has 75% citation rate across all platforms"
}
```

**Output**: `geoIntelligence` object
```typescript
{
  targetQueries: Query[],           // AI queries to own
  citationSources: Source[],        // Which publications AI trusts
  schemaOpportunities: Schema[],    // Direct optimization opportunities
  contentRecommendations: Rec[],    // Tactic type recommendations
  queryOwnershipMap: Map            // Tactic → query mapping
}
```

---

### 4. Blueprint Generation (2-3 minutes)
**Location**: `src/components/campaign-builder/CampaignBuilderWizard.tsx` (lines 701-722)

**API Call**: `/api/generate-blueprint`
**Edge Functions**:
1. `niv-campaign-blueprint-orchestrator`
2. `niv-blueprint-stakeholder-orchestration`

**Key Parameters**:
```typescript
{
  blueprintType: 'VECTOR_CAMPAIGN',  // Use VECTOR orchestrator!
  researchData: researchData,        // Stakeholder intelligence
  geoIntelligence: geoIntelligence,  // AUGMENTATION LAYER
  selectedPositioning: positioning,
  campaignGoal: goal,
  organizationContext: { name, industry }
}
```

#### Step 4.1: Base Generation
**Function**: `niv-campaign-blueprint-orchestrator`
- Receives research data + GEO intelligence
- Generates Part 1 (goal framework) and Part 2 (stakeholder mapping)
- **Passes geoIntelligence through** to stakeholder orchestration
- Returns partial blueprint immediately

#### Step 4.2: Stakeholder Orchestration
**Function**: `niv-blueprint-stakeholder-orchestration`
- Runs in background (long-running)
- Receives Part 1 + Part 2 + **geoIntelligence** (optional)

**Prompt Augmentation** (if geoIntelligence present):
```
### GEO Intelligence (AI Query Ownership):
This is a GEO-VECTOR campaign. For each tactical action, add "aiQueryImpact" field:

Target Queries: [list of queries to own]
Citation Sources: [which publications AI trusts]
Schema Opportunities: [direct optimization tactics]

IMPORTANT:
1. Add schema opportunities as Priority 1 tactics
2. For EVERY tactical action, add aiQueryImpact field with:
   - targetQueries: Which queries this helps you own
   - citationProbability: high/medium/low
   - timeline: When AI platforms will cite this
   - platforms: ChatGPT, Claude, Perplexity, Gemini
   - rationale: Why this tactic owns those queries
```

**Tactical Generation** (with GEO):
```json
{
  "stakeholder": "Enterprise Buyers",
  "influenceLevers": [
    {
      "leverName": "Authority Building",
      "priority": 1,
      "campaign": {
        "mediaPitches": [
          {
            "who": "Sarah Johnson",
            "outlet": "TechCrunch",
            "beat": "Enterprise Software",
            "what": "How Mitsui is revolutionizing commodity trading with AI",
            "when": "Week 1",
            "aiQueryImpact": {
              "targetQueries": [
                "best commodity trading platform",
                "enterprise trading software"
              ],
              "citationProbability": "high",
              "timeline": "2-4 weeks",
              "platforms": ["ChatGPT", "Perplexity"],
              "rationale": "TechCrunch cited in 80% of enterprise software queries on ChatGPT"
            }
          }
        ],
        "socialPosts": [
          {
            "who": "CEO",
            "platform": "LinkedIn",
            "what": "The future of commodity trading",
            "keyMessages": ["AI-powered", "Real-time analytics"],
            "when": "Week 1",
            "aiQueryImpact": {
              "targetQueries": ["commodity trading trends"],
              "citationProbability": "medium",
              "timeline": "1-2 weeks",
              "platforms": ["ChatGPT"],
              "rationale": "LinkedIn posts cited in 40% of thought leadership queries"
            }
          }
        ]
      }
    }
  ]
}
```

**Polling** (lines 726-750):
- Frontend polls database every 2 seconds
- Checks for `part3_stakeholderorchestration` completion
- Max 120 attempts (4 minutes timeout)

#### Step 4.3: Finalization
**API Call**: `/api/finalize-blueprint`
- Merges all parts into complete blueprint
- Adds execution requirements
- Validates structure
- Returns complete blueprint with **aiQueryImpact on all tactics**

---

### 5. Blueprint Parsing (Immediate)
**Location**: `src/components/modules/StrategicPlanningModuleV3Complete.tsx` (lines 298-470)

**Function**: `parseBlueprint(blueprint)`

**Detection**:
```typescript
if ((blueprint as any).threeTierTacticalPlan) {
  // This was OLD GEO-VECTOR structure - now unused
  // GEO-VECTOR now uses VECTOR structure with aiQueryImpact
}

if (blueprint.part3_stakeholderOrchestration) {
  // VECTOR structure (including GEO-VECTOR)
  // Parse stakeholder orchestration plans
}
```

**Extraction** (for VECTOR/GEO-VECTOR):
```typescript
blueprint.part3_stakeholderOrchestration.stakeholderOrchestrationPlans.forEach(plan => {
  plan.influenceLevers.forEach(lever => {
    // Extract media pitches
    lever.campaign.mediaPitches.forEach(pitch => {
      items.push({
        id: uuid(),
        type: 'media_pitch',
        stakeholder: plan.stakeholder.name,
        leverName: lever.leverName,
        leverPriority: lever.priority,
        topic: pitch.what,
        target: `${pitch.who} (${pitch.outlet})`,
        details: {
          ...pitch,
          aiQueryImpact: pitch.aiQueryImpact  // GEO augmentation!
        },
        status: 'pending'
      })
    })

    // Extract social posts (same pattern)
    // Extract thought leadership (same pattern)
    // Extract additional tactics (same pattern)
  })
})
```

---

### 6. Strategic Planning Display
**Location**: `src/components/modules/StrategicPlanningModuleV3Complete.tsx`

#### View Selection (lines 1239-1516)
**Conditional Rendering**:
```typescript
if ((blueprint as any).threeTierTacticalPlan) {
  // OLD GEO structure - shouldn't happen anymore
  return <GeoTierView />
} else {
  // VECTOR structure (pure VECTOR or GEO-VECTOR)
  return <PriorityView />
}
```

#### Priority-Based View (VECTOR & GEO-VECTOR)
**Organization**: Groups by lever priority (1-4), then stakeholder

**Priority 1**: Fear Mitigation
**Priority 2**: Aspiration Activation
**Priority 3**: Social Proof
**Priority 4**: Authority/Credibility

**Tactical Card Structure** (lines 1442-1520):
```tsx
<div className="tactical-card">
  {/* Standard VECTOR display */}
  <div className="header">
    <span>📰 Media Pitch</span>
    <StatusIcon status={item.status} />
  </div>

  <p className="topic">{item.topic}</p>
  <p className="target">{item.target}</p>

  {/* GEO-VECTOR augmentation (conditional) */}
  {item.details?.aiQueryImpact && (
    <div className="ai-query-impact">
      <div className="header">
        <span>🤖 AI Query Ownership</span>
        <Badge probability={item.details.aiQueryImpact.citationProbability} />
      </div>

      {/* Target queries */}
      <div className="query-badges">
        {item.details.aiQueryImpact.targetQueries.slice(0, 3).map(query => (
          <span className="query-badge">"{query}"</span>
        ))}
      </div>

      {/* Platforms & timeline */}
      <p className="metadata">
        {item.details.aiQueryImpact.platforms.join(', ')} •
        {item.details.aiQueryImpact.timeline}
      </p>
    </div>
  )}

  {/* Action buttons */}
  <div className="actions">
    <button onClick={() => handleGenerate(item)}>Generate</button>
    <button onClick={() => setViewingItem(item)}>View</button>
  </div>
</div>
```

#### Visual Hierarchy
```
┌─ Priority 1: Fear Mitigation ─────────────────────────────┐
│  ⚡ Auto-Execute All (5 items)                   3/5 done │
├───────────────────────────────────────────────────────────┤
│  ▶ Enterprise Buyers (5 items)                            │
│    ┌─ Media Pitch ─────────────────────────────────────┐ │
│    │ 📰 Media Pitch                        [Generate]  │ │
│    │ Pitch Sarah Johnson at TechCrunch                 │ │
│    │ Target: Enterprise CTOs                           │ │
│    │ ─────────────────────────────────────────────────│ │
│    │ 🤖 AI Query Ownership         [high probability] │ │
│    │ "best commodity trading platform"                 │ │
│    │ "enterprise trading software"                     │ │
│    │ ChatGPT, Perplexity • 2-4 weeks                  │ │
│    └───────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

### 7. Content Generation
**Location**: `src/components/modules/StrategicPlanningModuleV3Complete.tsx` (lines 558-727)

**When User Clicks "Generate"**:

#### Step 7.1: Build Context
```typescript
const context = await buildGenerationContext(sessionId, orgId, item.type)
// Returns: orgProfile, campaignContext, researchInsights
```

#### Step 7.2: Build Request
```typescript
const request = buildGenerationRequest(item, context)
// Includes: what to write, who it's for, specific instructions
```

#### Step 7.3: Call NIV
**API**: `niv-content-intelligent-v2`
```typescript
{
  message: request,
  stage: 'campaign_generation',
  campaignContext: {
    campaignSummary,
    contentRequirements: {
      owned: [socialPosts, thoughtLeadership],
      media: [mediaPitches]
    }
  }
}
```

#### Step 7.4: Save to Content Library
```typescript
await supabase
  .from('content_library')
  .upsert({
    id: item.id,
    session_id: sessionId,
    organization_id: orgId,
    content_type: item.type,
    title: item.topic,
    content: generatedContent,
    status: 'draft',
    folder: `Campaigns/${campaignName}/Priority ${item.stakeholderPriority}/${item.stakeholder}`,
    metadata: {
      stakeholder: item.stakeholder,
      lever_priority: item.leverPriority,
      aiQueryImpact: item.details?.aiQueryImpact  // Preserved!
    }
  })
```

**Note**: The `aiQueryImpact` metadata is preserved in the content library for future AI citation tracking.

---

## Key Data Structures

### Research Data
```typescript
interface ResearchData {
  intelligenceBrief: {
    stakeholders: Array<{
      name: string
      priority: number
      psychology: {
        primaryFear: string
        primaryAspiration: string
        decisionTrigger: string
      }
      informationDiet: string[]
      currentPerceptions: string[]
    }>
    narrativeLandscape: {
      dominantNarratives: string[]
      narrativeVacuums: string[]
    }
    channelIntelligence: {
      journalists: Array<{
        name: string
        outlet: string
        beat: string
        tier: number
      }>
    }
    historicalPatterns: {
      successfulTactics: string[]
      timing: string[]
    }
  }
}
```

### GEO Intelligence
```typescript
interface GeoIntelligence {
  targetQueries: Array<{
    query: string
    priority: 'high' | 'medium' | 'low'
    platforms: string[]
    currentVisibility: 'none' | 'low' | 'medium' | 'high'
    intent: 'transactional' | 'commercial' | 'informational'
  }>

  citationSources: Array<{
    domain: string
    citationRate: number
    platforms: string[]
    contentTypes: string[]
    rationale: string
  }>

  schemaOpportunities: Array<{
    type: string
    priority: number
    impactScore: number
    targetQueries: string[]
    platforms: string[]
    rationale: string
  }>

  contentRecommendations: Array<{
    tacticType: string
    priority: number
    targetQueries: string[]
    citationImpact: 'high' | 'medium' | 'low'
    rationale: string
    targetOutlets: string[]
  }>
}
```

### AI Query Impact (augmentation on tactics)
```typescript
interface AIQueryImpact {
  targetQueries: string[]           // Queries this tactic helps you own
  citationProbability: string       // 'high' | 'medium' | 'low'
  timeline: string                  // '1-2 weeks', '2-4 weeks', etc.
  platforms: string[]               // ['ChatGPT', 'Claude', 'Perplexity', 'Gemini']
  rationale: string                 // Why this tactic owns those queries
}
```

### Tactical Action (complete)
```typescript
interface TacticalAction {
  // Standard VECTOR fields
  who: string                       // Person executing
  what: string                      // Description
  where: string                     // Platform/venue
  when: string                      // Timing

  // Context
  stakeholder: string               // Target stakeholder
  leverName: string                 // Influence lever
  leverPriority: number             // 1-4

  // GEO-VECTOR augmentation (optional)
  aiQueryImpact?: AIQueryImpact     // Only present for GEO-VECTOR campaigns
}
```

---

## File Map

### Edge Functions (Supabase)
```
supabase/functions/
├── niv-geo-campaign-intelligence/     # GEO intelligence generator
│   └── index.ts
├── geo-query-discovery/               # Query discovery (called by GEO intelligence)
│   └── index.ts
├── niv-campaign-blueprint-orchestrator/   # VECTOR orchestrator (accepts geoIntelligence)
│   └── index.ts
├── niv-blueprint-stakeholder-orchestration/   # Tactical generation (adds aiQueryImpact)
│   └── index.ts
└── niv-campaign-research-synthesis/   # Research synthesis (stakeholder inference)
    └── index.ts
```

### API Routes (Frontend)
```
src/app/api/
├── geo/
│   ├── intelligence/                  # GEO intelligence API
│   │   └── route.ts
│   └── select-content/                # OLD - unused now
│       └── route.ts
└── generate-blueprint/                # Blueprint generation proxy
    └── route.ts
```

### Components
```
src/components/
├── campaign-builder/
│   ├── CampaignBuilderWizard.tsx     # Main flow orchestration (lines 623-822)
│   └── GeoVectorBlueprintPresentation.tsx   # Blueprint display (unused now)
└── modules/
    └── StrategicPlanningModuleV3Complete.tsx  # Execution view (lines 1239-1520)
```

### Services
```
src/lib/services/
├── campaignBuilderService.ts         # Research pipeline (lines 71-123)
└── intelligenceService.ts            # Intelligence hub (separate from campaigns)
```

---

## Backward Compatibility

### Pure VECTOR Campaigns (unchanged)
**Flow**:
```
Research → VECTOR Orchestrator (geoIntelligence = undefined) → Blueprint
```

**Output**:
- Tactics WITHOUT aiQueryImpact field
- UI doesn't show AI query ownership section
- Everything works exactly as before

### GEO-VECTOR Campaigns (new)
**Flow**:
```
Research → GEO Intelligence → VECTOR Orchestrator (geoIntelligence present) → Blueprint
```

**Output**:
- Tactics WITH aiQueryImpact field
- UI shows AI query ownership section
- Same execution quality as pure VECTOR

---

## Testing Checklist

### ✅ Unit Tests
- [ ] GEO intelligence generation
- [ ] Query discovery integration
- [ ] AI citation analysis
- [ ] Schema opportunity scoring

### ✅ Integration Tests
- [ ] Research → GEO → Blueprint flow
- [ ] Pure VECTOR still works
- [ ] GEO-VECTOR augmentation works
- [ ] Polling and finalization

### ✅ UI Tests
- [ ] AI query impact displays correctly
- [ ] Citation probability badges work
- [ ] Query badges render
- [ ] Conditional rendering (only shows for GEO)

### ✅ End-to-End Test
- [ ] Create GEO-VECTOR campaign
- [ ] Research completes
- [ ] GEO intelligence generates
- [ ] Blueprint includes aiQueryImpact
- [ ] Strategic planning displays correctly
- [ ] Content generation preserves metadata

---

## Deployment Checklist

### Edge Functions
- [x] `niv-geo-campaign-intelligence` deployed
- [x] `geo-query-discovery` deployed (pre-existing)
- [x] `niv-campaign-blueprint-orchestrator` deployed (modified)
- [x] `niv-blueprint-stakeholder-orchestration` deployed (modified)

### Frontend
- [x] Campaign wizard updated
- [x] Strategic planning updated
- [x] API routes created
- [x] Build succeeds
- [x] Changes pushed to Git

### Database
- No schema changes required
- Content library already stores metadata JSON

---

## Future Enhancements

### Phase 5: AI Citation Tracking
- Monitor actual AI platform citations
- Compare predicted vs actual citation rates
- Adjust citation probability scores based on real data
- Dashboard showing query ownership progress

### Phase 6: Schema Auto-Execution
- Automatically generate and deploy schemas
- Integration with website CMS
- Schema validation and testing
- Rollback capabilities

### Phase 7: Query Performance Analytics
- Track query rankings over time
- A/B test different tactical approaches
- Identify which content types drive best citations
- ROI analysis: effort vs AI visibility gain

---

## Troubleshooting

### "Failed to generate GEO intelligence"
- **Check**: `niv-geo-campaign-intelligence` is deployed
- **Check**: `geo-query-discovery` is accessible
- **Check**: API route `/api/geo/intelligence` exists
- **Debug**: Check edge function logs in Supabase dashboard

### "Stakeholder orchestration timed out"
- **Issue**: Blueprint generation taking > 4 minutes
- **Solution**: Check Anthropic API key, may need to increase timeout
- **Debug**: Check `niv-blueprint-stakeholder-orchestration` logs

### "aiQueryImpact not showing in UI"
- **Check**: Campaign type is GEO_VECTOR_CAMPAIGN
- **Check**: Blueprint has `aiQueryImpact` field in tactics
- **Debug**: Console log `item.details?.aiQueryImpact` in tactical cards

### "Pure VECTOR campaigns broken"
- **Issue**: Shouldn't happen - backward compatible
- **Check**: `geoIntelligence` parameter is optional
- **Check**: Prompt only includes GEO section when `geoIntelligence` present
- **Debug**: Check if pure VECTOR has `aiQueryImpact` fields (shouldn't)

---

## Summary

GEO-VECTOR is a **unified architecture** that maintains the quality of VECTOR campaigns while adding AI query ownership intelligence. It's not a separate system - it's an augmentation layer that makes every tactic more effective by showing its dual impact: human reach AND AI visibility.

**Key Innovation**: We don't treat AI platforms as stakeholders - we recognize that influencing AI requires influencing the sources AI trusts. Every traditional comms tactic now shows how it contributes to AI query ownership.
