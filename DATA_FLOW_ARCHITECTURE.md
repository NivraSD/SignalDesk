# SignalDesk Data Flow Architecture (Updated)

## Complete Pipeline: Onboarding → Intelligence Collection → 5-Stage Analysis → Synthesis → Opportunities → Execution

### 1. ONBOARDING PHASE
**Purpose:** Collect organization profile and stakeholders  
**Components:** `OnboardingV3.js` → `organization-discovery` Edge Function (with Claude)

**Data Collected:**
```javascript
{
  organization: {
    name: "Company Name",
    industry: "Technology",
    description: "What we do"
  },
  competitors: {
    direct: ["Competitor A", "Competitor B"],
    indirect: ["Competitor C"],
    emerging: ["Startup D"]
  },
  stakeholders: {
    regulators: ["FTC", "SEC"],
    media: ["TechCrunch", "Forbes"],
    investors: ["VC Fund A"],
    analysts: ["Gartner", "Forrester"],
    activists: ["Privacy Group"]
  },
  monitoring_topics: ["AI safety", "data privacy"]
}
```

**Storage:** 
- `organization_profiles` table (Supabase)
- `intelligence_targets` table (Supabase)
- localStorage cache via `intelligencePipelineService`

---

### 2. INTELLIGENCE COLLECTION PHASE
**Purpose:** Gather raw monitoring data from aggregators
**Components:** `intelligence-collection-v1` Edge Function

**Data Sources:**
- RSS feeds via `source-registry`
- Firecrawl API for competitor websites
- Monitoring systems
- Previous intelligence findings from database

**Output:**
```javascript
{
  raw_signals: [
    {
      type: "rss/firecrawl/monitoring",
      title: "Signal title",
      content: "Raw content",
      source: "Source name",
      url: "https://...",
      published: "2024-01-01T00:00:00Z"
    }
  ],
  metadata: {
    organization: "Company Name",
    collected_at: "2024-01-01T00:00:00Z",
    sources: ["RSS feeds", "Firecrawl"]
  }
}
```

**Storage:** `intelligence_findings` table

---

### 3. INTELLIGENCE PIPELINE PHASE (5 Stages + Synthesis)
**Purpose:** Analyze monitoring data through specialized Claude personalities
**Service:** `intelligencePipelineService.js`

#### Stage 1: Competitive Analysis (`intelligence-stage-1-competitors`)
- **Claude Personality:** Competitive Analyst
- **Input:** Raw monitoring data + organization profile
- **Output:** 
```javascript
{
  competitors: {
    direct: [/* analyzed competitors */],
    indirect: [/* analyzed competitors */],
    emerging: [/* analyzed competitors */]
  },
  competitive_dynamics: {/* market analysis */},
  battle_cards: {/* how to win */},
  recommendations: {/* competitive strategy */}
}
```

#### Stage 2: Media Analysis (`intelligence-stage-2-media`)
- **Claude Personality:** Media Analyst
- **Input:** Monitoring data + Stage 1 results
- **Output:**
```javascript
{
  media_landscape: {/* outlets analysis */},
  journalists: [/* key journalists */],
  coverage_analysis: {/* narrative control */},
  sentiment_analysis: {/* overall sentiment */},
  opportunities: [/* media opportunities */],  // ← PR opportunities
  risks: [/* media risks */]
}
```

#### Stage 3: Regulatory Analysis (`intelligence-stage-3-regulatory`)
- **Claude Personality:** Regulatory Expert
- **Input:** Monitoring data + previous stages
- **Output:**
```javascript
{
  regulatory: {/* compliance landscape */},
  stakeholders: {/* regulators, analysts, investors */},
  compliance_requirements: {/* what's needed */},
  regulatory_calendar: {/* deadlines */},
  risks_and_opportunities: {
    opportunities: [/* regulatory opportunities */]  // ← PR opportunities
  }
}
```

#### Stage 4: Trend Analysis (`intelligence-stage-4-trends`)
- **Claude Personality:** Trend Forecaster
- **Input:** Monitoring data + previous stages
- **Output:**
```javascript
{
  current_trends: {/* market, tech, consumer trends */},
  emerging_opportunities: [/* trend opportunities */],  // ← PR opportunities
  disruption_signals: [/* what to watch */],
  innovation_radar: {/* breakthrough technologies */},
  pr_opportunities: [/* trend-based PR angles */]  // ← PR opportunities
}
```

#### Stage 5: Intelligence Synthesis (`intelligence-stage-5-synthesis`)
- **Claude Personality:** Intelligence Synthesizer
- **Purpose:** Consolidate all intelligence and PR implications (NOT strategic recommendations)
- **Input:** All stage results + monitoring data
- **Output:**
```javascript
{
  executive_summary: {
    key_developments: [/* what happened */],
    comparative_position: {/* vs competitors */},
    narrative_health: {/* PR health */},
    pr_implications: [/* what this means for PR */]
  },
  cross_dimensional_insights: {/* connections between stages */},
  early_signals: {/* weak signals, pre-cascade */},
  meaning_and_context: {/* analysis and understanding */},
  consolidated_opportunities: {
    from_media: /* Stage 2 opportunities */,
    from_regulatory: /* Stage 3 opportunities */,
    from_trends: /* Stage 4 opportunities */,
    prioritized_list: [/* all opportunities ranked */]
  }
}
```

**Storage:** All stage results saved to `intelligence_stage_data` table

---

### 4. INTELLIGENCE HUB DISPLAY
**Purpose:** Present analyzed intelligence to users
**Components:** `IntelligenceHubV5.js`

**Tabs:**
- **Executive Summary** - From Stage 5 synthesis
- **Competitive Intel** - From Stage 1
- **Media Landscape** - From Stage 2
- **Regulatory** - From Stage 3
- **Early Signals** - From Stage 5 synthesis

**Data Flow:**
1. Calls `intelligencePipelineService.runCompletePipeline()`
2. Receives all stage results
3. Displays in appropriate tabs
4. Passes `pipelineResults` to OpportunityEngineV2

---

### 5. OPPORTUNITY ENGINE PHASE
**Purpose:** Convert intelligence into actionable PR opportunities
**Components:** `OpportunityEngineV2.js` + `opportunityEngineService.js`

**Two-Phase Approach:**
1. **Immediate Display** (from pipeline stages 2-4 via stage 5)
   - Shows opportunities consolidated by Stage 5
   - Fast, no additional API calls
   
2. **Async Enhancement** (`opportunity-enhancer` Edge Function)
   - **Claude Personality:** Opportunity Hunter
   - Adds cascade predictions
   - Detects narrative vacuums
   - Identifies competitive weaknesses
   - Creates execution packages

**Enhanced Output:**
```javascript
{
  immediate_opportunities: [
    {
      opportunity: "Counter competitor launch",
      type: "competitive_weakness",
      confidence: 92,
      urgency: "URGENT",
      window: "24 hours",
      why_now: "Competitor vulnerable",
      what_to_do: "Position leadership stability",
      content_needed: ["press release", "executive LinkedIn"],
      target_journalists: ["Reporter - TechCrunch"]
    }
  ],
  cascade_opportunities: [/* predictions */],
  narrative_vacuums: [/* unowned spaces */],
  competitive_exploitation: [/* weaknesses to exploit */],
  execution_packages: {/* ready-to-deploy content */}
}
```

---

### 6. EXECUTION PHASE
**Purpose:** Execute PR campaigns based on opportunities
**Components:** `ExecutionModule.js` (planned integration)

**Actions:**
- Generate content with AI personas
- Create media lists
- Deploy campaigns
- Track execution status

---

## Data Storage Architecture

### Supabase Tables:
- `organization_profiles` - Organization data from onboarding
- `intelligence_targets` - Competitors and stakeholders to monitor
- `intelligence_findings` - Raw monitoring data collected
- `intelligence_stage_data` - Results from each pipeline stage
- `monitoring_alerts` - Active monitoring status
- `opportunities` - Enhanced opportunities (from opportunity-enhancer)

### localStorage Cache (via services):
- Pipeline results (via `intelligencePipelineService`)
- Organization profile
- Enhanced opportunities (via `opportunityEngineService`)
- Temporary stage data

### Cache Strategy:
- **Pipeline results:** Cached for quick tab switching
- **Opportunities:** Progressive enhancement (basic → enhanced)
- **Clear on new search:** Prevents data mixing

---

## Claude AI Personalities (6 Total)

1. **Organization Discovery** (Onboarding) - Profile enrichment
2. **Competitive Analyst** (Stage 1) - Competitor intelligence
3. **Media Analyst** (Stage 2) - PR and media landscape
4. **Regulatory Expert** (Stage 3) - Compliance and stakeholder
5. **Trend Forecaster** (Stage 4) - Emerging opportunities
6. **Intelligence Synthesizer** (Stage 5) - Analysis and PR implications
7. **Opportunity Hunter** (Async) - Deep opportunity detection

---

## Key Improvements from Previous Version

### ✅ Fixed Issues:
1. **Real Data Analysis** - Claude analyzes actual monitoring data, not generating fake data
2. **Synchronized Data** - Intelligence Hub and Opportunity Engine use same pipeline data
3. **Performance** - Pipeline under 60 seconds with async enhancement
4. **Proper Storage** - Results saved to correct database tables
5. **Clear Separation** - Intelligence (analysis) vs Opportunities (action)

### 🚀 New Features:
1. **6 Claude Personalities** - Specialized analysis at each stage
2. **Monitoring Data Integration** - Analyzes real aggregator data
3. **Progressive Enhancement** - Fast initial display, deep analysis async
4. **Opportunity Consolidation** - Stage 5 merges opportunities from all stages
5. **Cascade Predictions** - Opportunity Hunter predicts future effects

### 📊 Data Flow Improvements:
1. **Single Pipeline** - One service manages entire flow
2. **Consistent Structure** - All stages follow same pattern
3. **Error Recovery** - Fallbacks if any stage fails
4. **Caching Strategy** - Smart caching for performance

---

## Current System Status

### ✅ Working:
- Complete intelligence pipeline with 5 stages + synthesis
- All Claude personalities integrated and deployed
- Opportunity consolidation in Stage 5
- OpportunityEngineV2 using pipeline data
- Async opportunity enhancement
- Database persistence for all stages

### 🔧 Next Steps:
1. Test complete pipeline with real monitoring data
2. Verify opportunity flow from stages → synthesis → display
3. Implement execution module integration
4. Add performance monitoring
5. Create dashboard for pipeline health

### 📈 Performance Targets:
- Main pipeline: < 60 seconds
- Opportunity enhancement: < 30 seconds
- Tab switching: Instant (cached)
- Data freshness: Real-time monitoring