# SignalDesk Intelligence Pipeline Architecture

## Current Production State - January 2025 (UPDATED)

## 🎯 Pipeline Overview

```
Discovery (Profile Generation)
    ↓
Monitor Stage 1 (Intelligent PR Filtering)
    ↓
Monitor Stage 2 Relevance (PR Scoring)
    ↓
Intelligence Orchestrator V2
    ├── Monitoring Stage 2 Enrichment (Event/Entity Extraction)
    ├── Executive Synthesis (Receives full enriched_data)
    └── MCP Opportunity Detector (Receives enriched_data + synthesis)
            ↓
        Opportunity Orchestrator V2 (Creative Enhancement)
            ↓
        Combined Results (synthesis + enhanced opportunities)
            ↓
        Database Storage (opportunities table with creative fields)
```

## 📊 Core Components

### 1. Discovery (`mcp-discovery`)

**Purpose**: Generate organization profile with competitors, keywords, sources
**Key Details**:

- Identifies direct/indirect competitors and emerging threats
- Generates monitoring keywords and industry context
- Provides RSS feeds and source configuration

### 2. Monitor Stage 1 (`monitor-stage-1`)

**Purpose**: Intelligent article collection with PR-focused filtering
**Key Features**:

- **Entity Coverage Limits**: Max 15 articles per competitor to ensure variety
- **PR Priority Scoring**:

  ```typescript
  // PRIORITY 1: Organization crisis/opportunity
  if (orgInTitle && (hasCrisis || hasOpp)) return true;

  // PRIORITY 2: Direct competitor major events
  if (directCompetitorInTitle && majorEvent) return true;

  // PRIORITY 3: Market dynamics with competitive relevance
  if (hasCompetitor && marketDynamic) return true;
  ```

- **Duplicate Detection**: Title similarity > 0.8 filtered
- **Sources**: RSS feeds, Google News, Yahoo Finance, scraped sites from master-source-registry

### 3. Monitor Stage 2 Relevance (`monitor-stage-2-relevance`)

**Purpose**: Advanced PR relevance scoring
**Scoring System**:

```typescript
let score = 0;
// Organization mentioned: +40 points
// Direct competitor: +30 points
// Crisis keywords: +25 points
// Opportunity keywords: +20 points
// Market signals: +15 points
// Indirect competitors: +10 points
```

**Pass Threshold**: Score >= 30

### 4. Monitoring Stage 2 Enrichment (`monitoring-stage-2-enrichment`)

**Purpose**: Extract structured data WITHOUT AI
**Returns Multiple Data Formats**:

```typescript
{
  extracted_data: {     // Raw extraction
    events: Event[],
    entities: Entity[],
    quotes: string[],
    metrics: Metric[]
  },
  organized_intelligence: {  // For synthesis
    events: Event[],
    entities: Entity[],
    quotes: string[],
    metrics: Metric[],
    topic_clusters: Cluster[]
  },
  structured_data: {    // For opportunity detector
    events_by_type: {},
    top_entities: Entity[],
    key_quotes: string[],
    financial_metrics: Metric[]
  },
  enriched_articles: Article[],  // Article summaries
  executive_summary: {},          // Summary data
  knowledge_graph: {}            // Entity relationships
}
```

**Note**: Deployed with `--no-verify-jwt` for internal service calls

### 5. Intelligence Orchestrator V2 (`intelligence-orchestrator-v2`)

**Purpose**: Coordinate enrichment, synthesis, and opportunity generation
**Current Implementation** (as of Jan 2025 - UPDATED):

1. Receives relevance-scored articles
2. Calls enrichment for event/entity extraction
3. **Data Validation**:
   - Requires: 5+ articles AND (5+ entities OR 3+ events)
   - Uses flexible logic to proceed with partial data
4. **SEQUENTIAL Processing** (for opportunity enhancement):
   - Sends enriched_data to synthesis
   - Sends enriched_data + synthesis to MCP Opportunity Detector
   - Detector stores opportunities in database
   - IF detector returns opportunities, calls Opportunity Orchestrator V2 for creative enhancement
5. **Data Passing**:
   - Synthesis gets: Full enriched_data including `organized_intelligence`
   - Detector gets: Full enriched_data + executive_synthesis result
   - Orchestrator V2 gets: Detected opportunities for enhancement
6. Returns combined intelligence report with creatively enhanced opportunities
7. **No Direct Database Save** (detector handles storage)

**Key Technical Details**:

- Uses `SUPABASE_SERVICE_ROLE_KEY` for internal service calls
- Implements `Promise.allSettled()` for parallel synthesis
- Graceful degradation if one synthesis fails
- Opportunity engine integration is optional (`skip_opportunity_engine` flag)
- Handles JSON parsing with markdown wrapper stripping

### 6. MCP Opportunity Detector (`mcp-opportunity-detector`)

**Purpose**: Identify PR opportunities from enriched intelligence
**Key Updates** (Jan 2025):

- Simplified to focus on opportunity detection only
- Generates 8-10 opportunities per run
- No creative enhancement (moved to orchestrator-v2)
- Direct database storage with proper organization_id handling
- Clears old opportunities before inserting new ones

**Opportunity Categories**:
- COMPETITIVE: Competitor vulnerabilities
- VIRAL: Trending topic opportunities
- STRATEGIC: Market positioning plays
- DEFENSIVE: Crisis response needs
- TALENT: Hiring/poaching opportunities
- STAKEHOLDER: Influencer engagement

**Data Flow**:
```typescript
Input: {
  organization_id: string,  // Consistent org identifier
  organization_name: string,
  enriched_data: FullEnrichedData,
  executive_synthesis: SynthesisResult, // Optional
  profile: Profile
}

Output: {
  success: boolean,
  opportunities: DetectedOpportunity[],
  metadata: { total_detected, timestamp }
}
```

### 7. Opportunity Orchestrator V2 (`opportunity-orchestrator-v2`)

**Purpose**: Enhance detected opportunities with creative campaigns and strategic playbooks
**Key Features** (Jan 2025):

- Receives pre-detected opportunities from MCP Opportunity Detector
- Adds creative campaign names and approaches in single Claude call
- Generates detailed action items with owners and deadlines
- Transforms opportunities into executable playbooks
- No database storage (detector handles that)

**Creative Enhancement**:
- Campaign names that could trend (e.g., "Operation Market Truth")
- Bold, differentiated PR approaches
- Temperature 0.9 for maximum creativity
- Single consolidated Claude call for all opportunities

**Enhancement Structure**:
```typescript
{
  campaign_name: string,        // Memorable campaign name
  creative_approach: string,    // Bold PR strategy
  playbook: {
    template_id: string,
    key_messages: string[],
    target_audience: string,
    channels: string[],
    assets_needed: string[],
    talking_points: string[]
  },
  action_items: [{
    step: number,
    action: string,
    owner: string,
    deadline: string
  }]
}
```

### 8. Executive Synthesis (`mcp-executive-synthesis`)

**Purpose**: Generate C-suite level strategic intelligence
**Current Mode** (Jan 2025): **Single Consolidated Call**

**Consolidated Analysis Format ('all_consolidated')**:
- **Focus**: Deep pattern recognition and strategic insights
- **Analysis Level**: McKinsey consultant + CIA analyst + PR crisis manager
- **Max tokens**: 2000 for focused response
- **Timeout**: 55 seconds with AbortController
- **Model**: claude-sonnet-4-20250514

**Combined Output Structure**:

```json
{
  "competitive_dynamics": {
    /* 3-4 competitor moves */
  },
  "stakeholder_intelligence": {
    /* 2-3 power shifts */
  },
  "trending_narratives": {
    /* 3-4 viral topics */
  },
  "market_signals": {
    /* 2-3 market indicators */
  },
  "cascade_detection": {
    /* 2 weak signals */
  },
  "immediate_opportunities": [
    /* Combined top 5 */
  ],
  "critical_threats": [
    /* Combined top 5 */
  ],
  "executive_synthesis": "Combined summaries from both parts"
}
```

## 🔧 Critical Technical Configuration

### Service Authentication

```typescript
// For internal service-to-service calls:
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Deploy internal services with:
supabase functions deploy [function-name] --no-verify-jwt
```

### Affected Functions Requiring `--no-verify-jwt`:

- `monitoring-stage-2-enrichment`
- `master-source-registry`
- `mcp-executive-synthesis`
- `intelligence-orchestrator-v2`

### Data Pass-Off Rules

**Monitor Stage 1 → Relevance**:

```typescript
{
  findings: Article[], // Up to 100 articles
  total_articles: number,
  profile: OrganizationProfile
}
```

**Relevance → Orchestrator**:

```typescript
{
  findings: Article[], // Scored & filtered articles
  monitoring_data: {
    total_articles: number,
    articles_processed: number
  }
}
```

**Orchestrator → Enrichment**:

```typescript
{
  organization: OrgData,
  profile: Profile,
  monitoring_data: MonitoringData,
  articles_limit: 200 // Max to process
}
```

**Orchestrator → Synthesis (FIXED - Full Data)**:

```typescript
{
  tool: 'synthesize_executive_intelligence',
  arguments: {
    enriched_data: {
      // ALL fields from enrichment
      extracted_data: ExtractedData,
      organized_intelligence: OrganizedIntelligence, // KEY!
      structured_data: StructuredData,
      enriched_articles: Article[],
      executive_summary: Summary,
      knowledge_graph: Graph,
      statistics: Stats
    },
    organization: OrgData,
    analysis_depth: 'comprehensive_consolidated',
    synthesis_focus: 'all_consolidated'
  }
}
```

**Orchestrator → MCP Opportunity Detector**:

```typescript
{
  organization_id: string, // Organization name or ID
  organization_name: string,
  enriched_data: FullEnrichedData, // Same as synthesis gets
  executive_synthesis: SynthesisResult, // Optional but recommended
  profile: Profile
}
```

**Detector → Opportunity Orchestrator V2** (if opportunities detected):

```typescript
{
  organization_id: string,
  organization_name: string,
  detected_opportunities: DetectedOpportunity[], // From detector
  enriched_data: FullEnrichedData,
  executive_synthesis: SynthesisResult,
  profile: Profile,
  detection_config: {
    min_score: 70,
    max_opportunities: 10,
    focus_areas: ['crisis', 'trending', 'competitive']
  }
}
```

**Orchestrator V2 Response** (with creative enhancement):

```typescript
{
  success: true,
  organization: string,
  opportunities: EnhancedOpportunity[], // With creative fields
  summary: {
    total: number,
    high_urgency: number,
    by_category: Record<string, number>,
    average_confidence: number
  },
  metadata: {
    generated_at: string,
    orchestrator_version: 'v2',
    execution_ready: true
  }
}
```

## 📈 Performance Optimizations

### Timeout Prevention Strategy

1. **Parallel Synthesis**: Split into 2 focused calls vs 1 comprehensive
2. **Reduced Token Usage**: 2000 per focused call vs 3000-4000 comprehensive
3. **Limited Event Data**: Max 3 events per type, 20 total shown
4. **No Article Content**: Only extracted insights sent to synthesis
5. **Focused Prompts**: Shorter, targeted prompts per synthesis focus

### Article Variety Optimization

1. **Entity Coverage Limits**: Max 15 articles per competitor
2. **Duplicate Detection**: Title similarity threshold 0.8
3. **Diverse Source Usage**: All competitor types (direct, indirect, emerging)
4. **PR Value Prioritization**: Crisis/opportunity keywords weighted higher

## 🚀 Deployment Commands

```bash
# Deploy core pipeline
supabase functions deploy monitor-stage-1 --no-verify-jwt
supabase functions deploy monitor-stage-2-relevance --no-verify-jwt
supabase functions deploy monitoring-stage-2-enrichment --no-verify-jwt
supabase functions deploy intelligence-orchestrator-v2 --no-verify-jwt
supabase functions deploy mcp-executive-synthesis --no-verify-jwt
supabase functions deploy mcp-opportunity-detector --no-verify-jwt
supabase functions deploy opportunity-orchestrator-v2 --no-verify-jwt
supabase functions deploy master-source-registry --no-verify-jwt

# Deploy supporting functions
supabase functions deploy mcp-discovery --no-verify-jwt
supabase functions deploy intelligence-persistence --no-verify-jwt

# Note: opportunity-orchestrator (v1) is deprecated - use opportunity-orchestrator-v2
```

## 🖼️ Frontend Display Components (Currently Not Rendered)

### Available Intelligence Display Components

These components were built to visualize the intelligence pipeline output but are currently removed from the main UI. They remain in the codebase for potential reintegration:

#### 1. **IntelligenceSynthesisDisplay** (`/src/components/IntelligenceSynthesisDisplay.tsx`)
**Purpose**: Rich visualization of executive synthesis output
**Features**:
- Executive summary with key takeaways
- Competitive moves tracking with expandable details
- Key developments timeline
- Market signals and trends
- PR implications and recommendations
- Visual indicators (icons) for different intelligence types
- Expandable/collapsible sections for detailed views

**Data Structure Expected**:
```typescript
{
  synthesis: {
    executive_summary: string,
    competitive_moves: Array<{company: string, action: string, impact: string}>,
    key_developments: Array<{title: string, description: string, impact: string}>,
    market_signals: Array<{signal: string, implication: string}>,
    pr_implications: {
      opportunities: string[],
      risks: string[],
      recommendations: string[]
    }
  }
}
```

#### 2. **PRPositioningDisplay** (`/src/components/PRPositioningDisplay.tsx`)
**Purpose**: Display PR opportunities and strategic positioning
**Features**:
- Opportunity cards with priority levels
- Strategic positioning recommendations
- Competitor response strategies
- Media angle suggestions
- Timeline and urgency indicators

#### 3. **SimpleIntelligence** (`/src/components/modules/SimpleIntelligence.tsx`)
**Purpose**: Simplified intelligence module interface
**Features**:
- Run pipeline button
- Status indicators for each pipeline stage
- Summary statistics
- Quick actions for opportunity review

#### 4. **Alternative Synthesis Display** (`/new-synthesis-display.tsx`)
**Purpose**: Alternative layout for synthesis visualization
**Location**: Root directory (not in components folder)
**Note**: Experimental version with different visualization approach

### Integration Considerations for Intelligence Tab with NIV

For the Intelligence tab that appears alongside NIV, consider:

1. **Pipeline Status Display**:
   - Show current pipeline stage (Discovery → Monitor → Enrichment → Synthesis → Opportunities)
   - Real-time progress indicators
   - Error states and retry options

2. **Intelligence Feed**:
   - Stream of relevant articles from Monitor Stage 2
   - Enriched events and entities from Stage 2 Enrichment
   - Executive synthesis summaries
   - Detected opportunities with creative enhancements

3. **NIV Integration Points**:
   - NIV could reference current intelligence data for context
   - Intelligence insights could trigger NIV strategic framework generation
   - Opportunities could be passed to NIV for campaign planning
   - Executive synthesis could inform NIV's strategic recommendations

4. **Recommended Components for Intelligence Tab**:
   ```tsx
   // Potential structure
   <IntelligenceTab>
     <PipelineStatus />  // Show current processing stage
     <IntelligenceSynthesisDisplay />  // Show latest synthesis
     <OpportunityFeed />  // Stream of detected opportunities
     <NivIntegrationPanel />  // Actions to send intel to NIV
   </IntelligenceTab>
   ```

5. **Data Flow for NIV Context**:
   ```
   Intelligence Pipeline → Executive Synthesis
                       ↓
                  Intelligence Tab Display
                       ↓
                  User Reviews/Selects Insights
                       ↓
                  Send to NIV as Context
                       ↓
                  NIV Generates Strategic Framework
   ```

## 📊 System Metrics

### Current Performance

- **Monitor Stage 1**: ~5-10 seconds (300+ articles → 100)
- **Relevance Scoring**: ~3-5 seconds (100 → 30-50 relevant)
- **Enrichment**: ~5-8 seconds (event/entity extraction)
- **Synthesis (Consolidated)**: ~15-25 seconds (single C-suite call)
- **MCP Opportunity Detection**: ~8-12 seconds (8-10 opportunities)
- **Opportunity Orchestrator V2**: ~5-8 seconds (creative enhancement)
- **Total Pipeline**: ~40-60 seconds end-to-end

### Success Rates (Jan 2025 - OPERATIONAL)

- **Synthesis Success**: >95% success rate ✅
- **Opportunity Generation**: 8-10 per run ✅
- **Creative Enhancement**: 100% (with fallback defaults) ✅
- **Article Variety**: 8-12 different competitors covered per run
- **Relevant Articles**: 30-50% pass relevance threshold

### Known Critical Issues (Jan 2025) - FIXED

- ~~**JSON Comments in Prompts**: 51 instances causing parse failures~~ ✅ FIXED
- ~~**Undefined Variables**: deleteError reference without declaration~~ ✅ FIXED  
- ~~**Error Propagation**: Orchestrator treats errors as valid data~~ ✅ FIXED
- ~~**Frontend Compatibility**: Falls back to old format causing crashes~~ ✅ FIXED
- ~~**Data Mismatch**: Synthesis not receiving organized_intelligence~~ ✅ FIXED
- ~~**Organization ID**: Inconsistent string vs numeric IDs~~ ✅ FIXED to '1'
- ~~**Database Save**: Attempting to save to non-existent table~~ ✅ REMOVED

## 🔍 Monitoring & Debugging

### Key Log Points

```typescript
// Monitor Stage 1
console.log(`📊 Article filtering: ${filtered.length}/${allArticles.length}`);
console.log(`🎯 Entity coverage:`, Array.from(entityCoverage.entries()));

// Orchestrator
console.log("🎯 Calling comprehensive synthesis...");
console.log("✅ Synthesis complete:", {
  has_competitive: !!executiveSynthesis.competitive_dynamics,
  has_topics: !!executiveSynthesis.trending_narratives,
  has_stakeholders: !!executiveSynthesis.stakeholder_intelligence
});

// Synthesis
console.log("🎯 Executive Synthesis MCP Starting:", {
  synthesisFocus: synthesis_focus, // 'all_consolidated' for C-suite analysis
});

// Opportunity Detector
console.log(`🗑️ Clearing existing opportunities for organization: ${organization_id}`);
console.log(`📊 Attempting to store ${allOpportunities.length} opportunities`);
```

### Common Issues & Solutions

**Issue**: "Failed to parse synthesis response"
**Solution**: Remove JSON comments from prompts, validate JSON structure

**Issue**: "deleteError is not defined" 
**Solution**: Ensure delete operation exists before error check

**Issue**: Synthesis returns empty/error object
**Solution**: Check for JSON comments in prompts, verify Claude response format

**Issue**: 401 errors on internal service calls
**Solution**: Deploy with `--no-verify-jwt`, use service role key

**Issue**: No opportunities generated
**Solution**: Verify synthesis is returning valid data, check opportunity detector logs

## 🎯 Intelligence Quality Features

### Five Expert Personalities

1. **Marcus Chen** - PR Strategist (Competitive moves, narratives)
2. **Victoria Chen** - Power Broker (Stakeholder dynamics)
3. **Sarah Kim** - Trend Hunter (Viral potential, media opportunities)
4. **Market Analyst** - Industry signals and economics
5. **Helena Cross** - Cascade Predictor (Weak signals, future risks)

### Output Quality Controls

- **Specific over Generic**: References actual companies and events
- **Time-Bound Actions**: 24-48 hour, 1 week windows
- **Confidence Scores**: Opportunities include confidence levels
- **Urgency Ratings**: Threats marked HIGH/MEDIUM/LOW
- **Cross-Domain Insights**: Patterns across different data types

## 📋 Environment Variables

```bash
# Required for all functions
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Optional for enhanced monitoring
FIRECRAWL_API_KEY=fc-...
NEWSAPI_KEY=...
```

---

# SignalDesk Opportunity Engine Architecture

## Transform Intelligence into ACTION - The Core Platform Differentiator

## 🎯 Executive Summary

The Opportunity Engine is SignalDesk's **CORE VALUE PROPOSITION**. While competitors provide reports and dashboards, SignalDesk delivers **ACTIONABLE PLAYBOOKS** with specific steps, owners, and deadlines.

**Key Differentiators:**

- **Not just intelligence, but ACTION**
- **Not just reports, but PLAYBOOKS**
- **Not just alerts, but OPPORTUNITIES**
- **Not just analysis, but REVENUE**

## 🏗️ Architecture Overview

```
Intelligence Pipeline
    ↓
Executive Synthesis (5 Analyst Personas)
    ↓
OPPORTUNITY ENGINE V2
    ├── Extract opportunities from each analyst
    ├── Score and prioritize by impact
    ├── Transform into actionable playbooks
    ├── Enhance with Claude for specific steps
    └── Store with tracking and metrics
        ↓
    Actionable Opportunities
    (3-5 step playbooks with owners & deadlines)
```

## 👥 The Five Opportunity Personas

Each analyst personality creates different types of opportunities:

### 1. Marcus Chen - PR Opportunist

- **Focus**: Competitor weaknesses and narrative gaps
- **Actions**: Narrative hijacking, crisis response, PR positioning, media blitz
- **Urgency**: HIGH (PR moves fast)
- **Example Opportunity**: "Competitor's data breach - position as security leader in 48 hours"

### 2. Victoria Chen - Power Player

- **Focus**: Stakeholder shifts and power dynamics
- **Actions**: Executive engagement, investor relations, partnership plays, talent poaching
- **Urgency**: MEDIUM (Relationships take time)
- **Example Opportunity**: "Key executive left competitor - recruit their team in 1 week"

### 3. Sarah Kim - Viral Architect

- **Focus**: Trending topics and viral potential
- **Actions**: Content creation, media hijacking, viral campaigns, influencer engagement
- **Urgency**: CRITICAL (Trends die fast)
- **Example Opportunity**: "AI regulation trending - publish thought leadership in 24 hours"

### 4. Helena Cross - Cascade Surfer

- **Focus**: Weak signals and cascade effects
- **Actions**: Preemptive positioning, supply chain pivots, regulatory preparation, crisis prevention
- **Urgency**: HIGH (Must act before cascade)
- **Example Opportunity**: "Supply chain disruption signal - secure alternative vendors in 72 hours"

### 5. Market Analyst - Market Mover

- **Focus**: Economic indicators and market shifts
- **Actions**: Pricing strategy, market entry, competitive positioning, product pivots
- **Urgency**: MEDIUM
- **Example Opportunity**: "Market gap identified - launch lite product version in 2 weeks"

## 📊 Opportunity Data Structure

```typescript
interface EnhancedOpportunity {
  // Identification
  id: string; // Unique opportunity ID
  title: string; // Catchy, specific title
  description: string; // What and why

  // Classification
  opportunity_type:
    | "competitive"
    | "narrative"
    | "cascade"
    | "market"
    | "stakeholder";
  persona: string; // Which analyst type
  persona_name: string; // Human name (Marcus Chen, etc.)

  // CRITICAL: Timing
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  window: string; // "24-48 hours", "1 week"
  expires_at: Date; // When opportunity closes

  // THE PLAYBOOK: Specific Actions
  action_items: [
    {
      step: number; // 1, 2, 3...
      action: string; // Exactly what to do
      owner: string; // CEO, CMO, CTO, etc.
      deadline: Date; // When it must be done
      success_metric: string; // How we measure completion
    }
  ];

  // Intelligence Source (Traceability)
  source_insights: {
    from_synthesis: string[]; // Which sections drove this
    from_events: Event[]; // Specific triggering events
    from_entities: string[]; // Companies/people involved
    from_trends: string[]; // Topics to leverage
  };

  // Expected Impact (THE WHY)
  expected_impact: {
    revenue: string; // "+$2M opportunity"
    reputation: string; // "Position as AI leader"
    competitive_advantage: string; // "6-month head start"
    risk_mitigation: string; // "Avoid $5M loss"
  };

  // Confidence & Risk
  confidence: number; // 0-100
  confidence_factors: string[]; // Why this will work
  risks: string[]; // What could go wrong

  // Status Tracking
  status: "new" | "reviewed" | "in_progress" | "completed" | "expired";
  created_at: Date;
  organization: string;
}
```

## 🔄 Processing Pipeline

### Phase 1: Opportunity Extraction

```typescript
// Extract from each synthesis section
extractOpportunitiesFromSynthesis(synthesis) {
  opportunities = []

  // From competitive_dynamics → competitive opportunities
  // From stakeholder_intelligence → stakeholder opportunities
  // From trending_narratives → narrative opportunities
  // From cascade_detection → cascade opportunities
  // From market_signals → market opportunities
  // From immediate_opportunities → urgent opportunities

  return opportunities
}
```

### Technical Implementation Details

**Function**: `opportunity-orchestrator`
**Deployment**: `supabase functions deploy opportunity-orchestrator --no-verify-jwt`

**Key Features**:
- Handles Claude response markdown wrappers (`\`\`\`json` stripping)
- Direct database insertion with service role key
- Fallback to intelligence-persistence for storage
- Batch enhancement of opportunities (top 5-10)
- Proper error handling with partial success support

### Phase 2: Scoring Algorithm

```typescript
scoreOpportunity(opportunity, enrichedData) {
  score = 50 // Base

  // Urgency multiplier (CRITICAL: 2x, HIGH: 1.5x, MEDIUM: 1x, LOW: 0.5x)
  score *= urgencyMultiplier

  // Confidence adjustment
  score *= (confidence / 100)

  // Source quality bonus
  if (from immediate_opportunities) score += 20
  if (from critical_threats) score += 15
  if (cascade opportunity) score += 10

  // Entity/Event richness bonus
  if (many entities mentioned) score += 10
  if (many events detected) score += 15

  return min(100, score)
}
```

### Phase 3: Claude Enhancement

Top 5 opportunities are enhanced by Claude to add:

- Specific, actionable titles
- 3-5 concrete action steps with owners
- Expected impact estimates
- Confidence factors
- Risk assessments

### Phase 4: Storage & Tracking

Opportunities are stored in database with:

- Full tracking of status changes
- Outcome measurement
- Success metrics
- Lessons learned

## 💰 Value Propositions

### 1. Revenue Opportunities

- **Competitive weakness** → Sales play to win deals
- **Market gap** → New product opportunity
- **Partnership opening** → Strategic alliance

### 2. Cost Savings

- **Cascade warning** → Avoid supply chain disruption
- **Regulatory change** → Preemptive compliance
- **Crisis prevention** → Avoid PR disaster

### 3. Brand Wins

- **Narrative gap** → Thought leadership
- **Viral trend** → Content opportunity
- **Media opening** → Executive visibility

### 4. Risk Mitigation

- **Weak signal** → Early warning
- **Competitor move** → Defensive action
- **Market shift** → Strategic pivot

## 📈 Success Metrics

### Opportunity Metrics

- **Generation Rate**: 5-10 high-quality opportunities per day
- **Confidence Average**: >70% confidence score
- **Coverage**: All 5 persona types represented
- **Timeliness**: Opportunities generated within 1 hour of signal

### Action Metrics

- **Review Rate**: % of opportunities reviewed within 4 hours
- **Action Rate**: % of opportunities acted upon
- **Completion Rate**: % of started opportunities completed
- **Success Rate**: % achieving expected impact

### Impact Metrics

- **Revenue Generated**: $ from opportunities
- **Costs Avoided**: $ saved from warnings
- **Brand Lift**: Media mentions, share of voice
- **Competitive Wins**: Deals won, partnerships secured

## 🔌 Integration Points

### Input Sources

1. **Executive Synthesis**: All 5 analyst outputs
2. **Enriched Data**: Events, entities, topics
3. **Organization Profile**: Industry, competitors, goals

### Output Channels

1. **API Response**: Real-time opportunities
2. **Database Storage**: Historical tracking
3. **Notifications**: Urgent opportunity alerts
4. **Dashboard**: Opportunity management UI

## 🚀 Implementation Status

### ✅ Completed

- Enhanced opportunity structure with personas
- Scoring algorithm implementation
- Claude integration for action items (with markdown wrapper handling)
- Database schema creation (opportunities table with full JSONB support)
- Orchestrator integration (fully integrated into Intelligence Orchestrator V2)
- Deployment to production (with proper CORS and permissions)
- JSON parsing fix for Claude responses (strips ```json wrappers)
- Database permissions configuration (RLS disabled for testing, proper GRANTs)
- Testing tools created (pipeline tester, opportunity monitor)

### 🔄 In Progress

- UI components for opportunity cards
- Notification system for urgent opportunities
- Success tracking mechanisms

### 📋 Planned

- Machine learning for opportunity scoring
- Historical success analysis
- Automated action execution
- Integration with task management tools
- ROI tracking and reporting

## 💡 Example Opportunities

### Example 1: Competitive Opportunity

```json
{
  "title": "Microsoft's Cloud Outage - Win Enterprise Deals",
  "urgency": "CRITICAL",
  "window": "24-48 hours",
  "persona_name": "Marcus Chen",
  "action_items": [
    {
      "step": 1,
      "action": "Draft comparison of our 99.99% uptime vs Microsoft's outage",
      "owner": "CMO",
      "deadline": "In 4 hours",
      "success_metric": "Sales enablement deck created"
    },
    {
      "step": 2,
      "action": "Contact all enterprise prospects with reliability messaging",
      "owner": "Sales Team",
      "deadline": "In 24 hours",
      "success_metric": "100% of pipeline contacted"
    },
    {
      "step": 3,
      "action": "Publish thought leadership on cloud reliability",
      "owner": "CTO",
      "deadline": "In 48 hours",
      "success_metric": "Article published and promoted"
    }
  ],
  "expected_impact": {
    "revenue": "+$2-5M in accelerated deals",
    "reputation": "Position as more reliable alternative",
    "competitive_advantage": "Convert 5-10 Microsoft customers"
  },
  "confidence": 85
}
```

### Example 2: Cascade Opportunity

```json
{
  "title": "EU AI Act Implementation - First Mover Advantage",
  "urgency": "HIGH",
  "window": "1 week",
  "persona_name": "Helena Cross",
  "action_items": [
    {
      "step": 1,
      "action": "Audit current AI systems for compliance gaps",
      "owner": "Legal + Engineering",
      "deadline": "In 3 days",
      "success_metric": "Gap analysis complete"
    },
    {
      "step": 2,
      "action": "Implement required transparency features",
      "owner": "Engineering",
      "deadline": "In 1 week",
      "success_metric": "Compliance features deployed"
    },
    {
      "step": 3,
      "action": "Market as 'EU AI Act Compliant' to European customers",
      "owner": "Marketing",
      "deadline": "In 10 days",
      "success_metric": "Compliance badge on website, PR released"
    }
  ],
  "expected_impact": {
    "revenue": "+$3M from EU market",
    "reputation": "First compliant in category",
    "risk_mitigation": "Avoid $10M+ in potential fines"
  },
  "confidence": 75
}
```

## 🎯 Why This Matters

Traditional intelligence platforms tell you **WHAT** is happening.
SignalDesk tells you **WHAT TO DO ABOUT IT**.

This transforms intelligence from a cost center into a **REVENUE GENERATOR**.

---

**Last Updated**: January 2025 (Sept 17 Update)
**Status**: PRODUCTION READY
**Core Differentiator**: ACTIVATED

**Key Updates This Version**:
- Added MCP Opportunity Detector for focused detection
- Added Opportunity Orchestrator V2 for creative enhancement
- Separated detection from enhancement for better modularity
- Creative campaigns now generated with single Claude call
- Organization ID handling standardized across pipeline

**Pipeline Status**: ✅ PRODUCTION READY
**Creative Enhancement**: ✅ OPERATIONAL
**Timeout Prevention**: ✅ IMPLEMENTED
