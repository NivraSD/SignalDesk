# Real-Time Intelligence - Rebuild Plan

## Philosophy

**Real-time intelligence should be a FASTER, FOCUSED version of the full intelligence pipeline - not a dumbed-down keyword matcher.**

The system's core value is:
- ✅ Contextualization
- ✅ Analysis
- ✅ Relevance determination
- ✅ Synthesis that creates value

**Not**: Keyword matching and data dumps

---

## Current State vs Target State

### Current (Broken)
```
niv-fireplexity-monitor
  ↓
Execute searches → Filter by keywords → Dump alerts
```

### Target (Intelligence-Quality)
```
Real-Time Intelligence Pipeline
  ↓
Execute searches → Filter by date → Deduplicate →
Claude assessment → Event extraction → Synthesis →
Actionable alerts with context
```

---

## Architecture Design

### Core Principle: Reuse Intelligence Pipeline Components

The intelligence pipeline already does this perfectly:
1. **monitor-stage-1**: Multi-source collection
2. **monitor-stage-2-relevance**: Claude-powered filtering
3. **monitoring-stage-2-enrichment**: Event/entity extraction
4. **mcp-executive-synthesis**: Strategic synthesis
5. **mcp-opportunity-detector**: Opportunity detection

**Real-time should follow the SAME flow, just:**
- Use Fireplexity instead of RSS (faster, more targeted)
- Focus on last 1-6 hours (not 48 hours)
- Run more frequently (every 15-30 min vs daily)
- Shorter window = faster processing
- Simpler synthesis (breaking news summary vs full strategic report)

---

## New Architecture: `real-time-intelligence-orchestrator`

### Input
```typescript
{
  organization_name: string,
  time_window: '1hour' | '6hours' | '24hours',  // Default: 6hours
  auto_refresh: boolean,  // For future automation
  route_to_opportunities: boolean
}
```

### Flow

#### Stage 1: Smart Search (Fireplexity)
```typescript
// Use niv-fireplexity for targeted real-time search
// Build company-specific queries from mcp-discovery (ALREADY DONE ✅)
const queries = buildCompanySpecificQueries(orgName, profile)

// Execute parallel searches (ALREADY DONE ✅)
const rawResults = await executeFireplexitySearches(queries)
```

#### Stage 2: Date & Deduplication Filter
```typescript
// NEW: Filter to time window
const timeWindow = parseTimeWindow('6hours') // 6 hours ago
const recentResults = rawResults.filter(r => {
  const publishDate = new Date(r.published || r.date || 0)
  return publishDate > timeWindow
})

// NEW: Check against seen_articles table
const { data: seenArticles } = await supabase
  .from('seen_articles')
  .select('url')
  .eq('organization_id', orgName)
  .gte('seen_at', timeWindow.toISOString())

const newResults = recentResults.filter(r =>
  !seenArticles.find(s => s.url === r.url)
)

console.log(`🔍 Filtered: ${rawResults.length} → ${newResults.length} new articles in last 6h`)
```

#### Stage 3: Claude Assessment & Filtering
```typescript
// NEW: Use Claude Haiku for fast assessment
const prompt = `You are analyzing real-time breaking news for ${orgName}.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

ARTICLES FOUND (${newResults.length} total):
${newResults.map((a, i) => `${i+1}. "${a.title}" - ${a.source} (${a.published})`).join('\n')}

Tasks:
1. Which articles are TRULY breaking news (last 6 hours)?
2. Which are relevant to ${orgName}'s business?
3. Which are noise/spam/old news resurfaced?
4. For relevant articles, extract key facts in 1 sentence

Return JSON:
{
  "breaking_news": [
    {
      "index": 1,
      "relevance": "high|medium",
      "key_fact": "One sentence summary",
      "category": "crisis|opportunity|competitive|regulatory|general",
      "urgency": "immediate|this_week",
      "confidence": 85
    }
  ],
  "noise": [2, 5, 8], // Article indices to filter out
  "context": "Brief note about what's happening overall"
}`

const assessment = await callClaude({
  model: 'claude-3-5-haiku-20241022', // Fast & cheap
  max_tokens: 2000,
  messages: [{ role: 'user', content: prompt }]
})
```

#### Stage 4: Event Extraction (Reuse Existing)
```typescript
// Use EXISTING monitoring-stage-2-enrichment
// It already does Claude-powered event/entity extraction
const filteredArticles = assessment.breaking_news.map(bn =>
  newResults[bn.index]
)

const enrichmentResponse = await fetch(
  `${supabaseUrl}/functions/v1/monitoring-stage-2-enrichment`,
  {
    method: 'POST',
    body: JSON.stringify({
      articles: filteredArticles,
      profile,
      organization_name,
      coverage_report: {
        context: assessment.context,
        source: 'real-time-intelligence'
      }
    })
  }
)
```

#### Stage 5: Real-Time Synthesis
```typescript
// NEW: Simpler synthesis focused on breaking developments
const synthesisPrompt = `You are creating a REAL-TIME INTELLIGENCE BRIEF for ${orgName}.

TIME WINDOW: Last 6 hours
DATE: ${new Date().toISOString()}

ENRICHED INTELLIGENCE:
- ${enrichedData.events.length} events detected
- ${enrichedData.entities.length} entities mentioned
- ${enrichedData.quotes.length} key quotes

EVENTS:
${enrichedData.events.map(e => `- [${e.type}] ${e.entity}: ${e.description}`).join('\n')}

Create a CONCISE real-time intelligence brief:

{
  "breaking_summary": "2-3 sentence summary of key developments in last 6 hours",
  "critical_alerts": [
    {
      "title": "Action-oriented headline",
      "summary": "What happened and why it matters",
      "source_urls": ["url1", "url2"],
      "category": "crisis|opportunity|competitive",
      "urgency": "immediate|this_week",
      "recommended_action": "Specific action to take",
      "time_to_act": "Timeline (e.g., 'Next 24 hours')"
    }
  ],
  "watch_list": [
    {
      "item": "Topic or entity to monitor",
      "why": "Reason to watch",
      "next_check": "When to check again"
    }
  ],
  "context": "How these developments fit into broader trends"
}`

const synthesis = await callClaude({
  model: 'claude-sonnet-4-20250514', // Use Sonnet for synthesis
  max_tokens: 3000,
  messages: [{ role: 'user', content: synthesisPrompt }]
})
```

#### Stage 6: Optional Opportunity & Crisis Detection (Parallel Tracks)
```typescript
// Real-time intelligence can route to BOTH opportunity AND crisis detection
// These run in parallel since they analyze the same enriched data

let opportunityResult = null
let crisisResult = null

// TRACK A: Opportunity Detection (2-stage process)
if (route_to_opportunities && enrichedData.events.length > 0) {
  console.log('🎯 Track A - Stage 1: Detecting opportunity signals...')

  // STAGE A1: Call mcp-opportunity-detector for signal-based detection
  const detectorResponse = await fetch(
    `${supabaseUrl}/functions/v1/mcp-opportunity-detector`,
    {
      method: 'POST',
      body: JSON.stringify({
        organization_id: orgName,
        organization_name: orgName,
        enriched_data: enrichedData,
        profile
      })
    }
  )

  const detectorResult = await detectorResponse.json()
  console.log(`✅ Detected ${detectorResult.opportunities?.length || 0} opportunity signals`)

  // STAGE A2: Call opportunity-orchestrator-v2 to enhance into strategic playbooks
  if (detectorResult.opportunities && detectorResult.opportunities.length > 0) {
    console.log('🎨 Track A - Stage 2: Transforming into strategic playbooks...')

    const orchestratorResponse = await fetch(
      `${supabaseUrl}/functions/v1/opportunity-orchestrator-v2`,
      {
        method: 'POST',
        body: JSON.stringify({
          organization_id: orgName,
          organization_name: orgName,

          // Pass detected opportunities for enhancement
          detected_opportunities: detectorResult.opportunities,

          // Pass enriched data for context
          enriched_data: enrichedData,

          // Pass synthesis for strategic context
          executive_synthesis: synthesis,

          profile: profile,

          // Detection config
          detection_config: {
            min_score: 70,
            max_opportunities: 10,
            focus_areas: ['crisis', 'trending', 'competitive', 'regulatory', 'milestone']
          }
        })
      }
    )

    const orchestratorResult = await orchestratorResponse.json()
    console.log(`✅ Generated ${orchestratorResult.opportunities?.length || 0} strategic opportunities`)

    // Return the orchestrated opportunities (these are saved to DB by orchestrator-v2)
    opportunityResult = orchestratorResult
  }
}

// TRACK B: Crisis Detection & Response (parallel to opportunities)
// NOTE: Crisis detection should ALWAYS run for real-time monitoring
// This is the whole point - catching crises early!
const crisisEvents = enrichedData.events.filter(e =>
  e.type === 'crisis' || e.type === 'regulatory' ||
  e.category === 'crisis' || e.severity === 'high' || e.severity === 'critical'
)

if (crisisEvents.length > 0) {
  console.log(`🚨 Track B: Detecting crisis signals from ${crisisEvents.length} events...`)

  // Call mcp-crisis for crisis assessment and response generation
  const crisisResponse = await fetch(
    `${supabaseUrl}/functions/v1/mcp-crisis`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'detect_crisis_signals',
          arguments: {
            events: crisisEvents,
            enriched_data: enrichedData,
            organization: orgName,
            timeWindow: '6h',
            sensitivity: 'high' // Real-time monitoring should be sensitive
          }
        }
      })
    }
  )

  if (crisisResponse.ok) {
    const crisisData = await crisisResponse.json()

    // If crises detected, assess severity and generate response
    if (crisisData.crises && crisisData.crises.length > 0) {
      console.log(`🚨 ${crisisData.crises.length} crisis signals detected`)

      // For each crisis, assess severity
      const assessedCrises = []
      for (const crisis of crisisData.crises) {
        const assessmentResponse = await fetch(
          `${supabaseUrl}/functions/v1/mcp-crisis`,
          {
            method: 'POST',
            body: JSON.stringify({
              method: 'tools/call',
              params: {
                name: 'assess_crisis_severity',
                arguments: {
                  situation: crisis.description,
                  metrics: crisis.metrics,
                  stakeholdersAffected: crisis.stakeholders
                }
              }
            })
          }
        )

        if (assessmentResponse.ok) {
          const assessment = await assessmentResponse.json()
          assessedCrises.push({
            ...crisis,
            severity_assessment: assessment.severity,
            impact_assessment: assessment.impact,
            recommended_response_timeframe: assessment.timeframe
          })
        }
      }

      // Generate crisis response strategies for critical/high severity
      const criticalCrises = assessedCrises.filter(c =>
        c.severity_assessment === 'critical' || c.severity_assessment === 'high'
      )

      if (criticalCrises.length > 0) {
        console.log(`🚨 ${criticalCrises.length} critical/high crises require immediate response`)

        const responseStrategies = []
        for (const crisis of criticalCrises) {
          const responseResponse = await fetch(
            `${supabaseUrl}/functions/v1/mcp-crisis`,
            {
              method: 'POST',
              body: JSON.stringify({
                method: 'tools/call',
                params: {
                  name: 'generate_crisis_response',
                  arguments: {
                    crisisType: crisis.type,
                    severity: crisis.severity_assessment,
                    audiencesAffected: crisis.audiences,
                    responseTimeframe: crisis.recommended_response_timeframe || 'within_1h'
                  }
                }
              })
            }
          )

          if (responseResponse.ok) {
            const strategy = await responseResponse.json()
            responseStrategies.push(strategy)
          }
        }

        crisisResult = {
          crises_detected: assessedCrises.length,
          critical_crises: criticalCrises.length,
          crises: assessedCrises,
          response_strategies: responseStrategies
        }

        // Save to crises table
        for (const crisis of assessedCrises) {
          await supabase.from('crises').insert({
            organization_id: orgName,
            title: crisis.title,
            description: crisis.description,
            severity: crisis.severity_assessment,
            impact: crisis.impact_assessment,
            source_events: crisis.events,
            detected_at: new Date().toISOString(),
            response_timeframe: crisis.recommended_response_timeframe,
            status: 'detected'
          })
        }
      }
    }
  }
}

console.log(`✅ Stage 6 complete:`, {
  opportunities: opportunityResult?.opportunities?.length || 0,
  crises: crisisResult?.crises_detected || 0,
  critical_crises: crisisResult?.critical_crises || 0
})
```

#### Stage 7: Save State & Return
```typescript
// Save to seen_articles table
for (const article of filteredArticles) {
  await supabase.from('seen_articles').insert({
    organization_id: orgName,
    url: article.url,
    title: article.title,
    seen_at: new Date().toISOString(),
    source: 'real-time-intelligence'
  })
}

// Save synthesis to database
await supabase.from('real_time_intelligence_briefs').insert({
  organization_id: orgName,
  time_window: '6hours',
  articles_analyzed: filteredArticles.length,
  events_detected: enrichedData.events.length,
  alerts_generated: synthesis.critical_alerts.length,
  synthesis: synthesis,
  created_at: new Date().toISOString()
})

return {
  success: true,
  time_window: '6hours',
  articles_analyzed: filteredArticles.length,
  new_articles: filteredArticles.length,
  breaking_summary: synthesis.breaking_summary,
  critical_alerts: synthesis.critical_alerts,
  watch_list: synthesis.watch_list,

  // Opportunity detection results
  opportunities: opportunityResult?.opportunities || [],
  opportunities_count: opportunityResult?.opportunities?.length || 0,

  // Crisis detection results
  crises: crisisResult?.crises || [],
  crises_count: crisisResult?.crises_detected || 0,
  critical_crises_count: crisisResult?.critical_crises || 0,
  crisis_response_strategies: crisisResult?.response_strategies || []
}
```

---

## Database Schema Changes

### New Table: `seen_articles`
```sql
CREATE TABLE seen_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  url text NOT NULL,
  title text,
  seen_at timestamptz NOT NULL DEFAULT now(),
  source text, -- 'real-time-intelligence' or 'intelligence-pipeline'

  UNIQUE(organization_id, url, source)
);

CREATE INDEX idx_seen_articles_org_date ON seen_articles(organization_id, seen_at DESC);
```

### New Table: `real_time_intelligence_briefs`
```sql
CREATE TABLE real_time_intelligence_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  time_window text, -- '1hour', '6hours', '24hours'
  articles_analyzed int,
  events_detected int,
  alerts_generated int,
  synthesis jsonb, -- Full synthesis from Claude
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rt_briefs_org_date ON real_time_intelligence_briefs(organization_id, created_at DESC);
```

### New Table: `crises`
```sql
CREATE TABLE crises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'
  impact text, -- Impact assessment from mcp-crisis
  source_events jsonb, -- Events that triggered this crisis
  response_timeframe text, -- 'immediate', 'within_1h', 'within_6h', 'within_24h'
  response_strategy jsonb, -- Generated response from mcp-crisis
  status text DEFAULT 'detected', -- 'detected', 'acknowledged', 'responding', 'resolved'
  detected_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,

  -- Metadata
  metrics jsonb, -- Volume, sentiment, reach data
  stakeholders_affected text[], -- Affected stakeholder groups
  media_coverage_urls text[] -- Links to media coverage
);

CREATE INDEX idx_crises_org_severity ON crises(organization_id, severity, detected_at DESC);
CREATE INDEX idx_crises_status ON crises(status, detected_at DESC);
```

---

## Lessons from NIV-Fireplexity (Strategic Framework Builder)

Looking at how NIV AI assistant uses Fireplexity:

```typescript
// niv-fireplexity does:
1. Execute targeted search
2. Process results with Claude
3. Synthesize into structured framework
4. Iterate based on user feedback

// Key lessons:
- Uses Claude to UNDERSTAND and SYNTHESIZE, not just filter
- Provides context and relationships
- Structured, actionable output
- Confidence scores on everything
```

**Apply to real-time intelligence:**
- Don't just find articles, UNDERSTAND what's happening
- Connect events across articles
- Provide strategic context
- Give confidence on assessments

---

## Cost Analysis

### Per Real-Time Run (6-hour window)

| Component | Model | Cost |
|-----------|-------|------|
| Fireplexity searches (15 queries) | - | $0.20 |
| Claude assessment (filter ~30 articles) | Haiku | $0.05 |
| Enrichment (process ~10 relevant) | Sonnet | $0.30 |
| Real-time synthesis | Sonnet | $0.30 |
| **Opportunity detection (optional, 2-stage):** | | |
| → mcp-opportunity-detector | Sonnet | $1.00 |
| → opportunity-orchestrator-v2 | Sonnet | $1.00 |
| **Crisis detection (runs when crisis events detected):** | | |
| → mcp-crisis detect_crisis_signals | Sonnet | $0.20 |
| → mcp-crisis assess_crisis_severity (per crisis) | Sonnet | $0.10 |
| → mcp-crisis generate_crisis_response (per crisis) | Sonnet | $0.30 |
| **Total base (no opportunities/crises)** | | **$0.85** |
| **Total with opportunities** | | **$2.85** |
| **Total with crisis response (3 crises)** | | **$2.05** |
| **Total with both (full detection)** | | **$4.05** |

### Comparison
- Full intelligence pipeline: ~$3.00 per run (with opportunities)
- Real-time intelligence (base): ~$0.85 per run (70% cheaper!)
- Real-time intelligence (with opportunities): ~$2.85 per run
- Real-time intelligence (with crises): ~$2.05 per run
- Real-time intelligence (full detection): ~$4.05 per run
- Current broken monitor: ~$0.20 (but useless)

**ROI**:
- **Base mode**: 70% cheaper, just intelligence briefs
- **Opportunity mode**: Similar cost to full pipeline, for strategic opportunities
- **Crisis mode**: Mid-cost, CRITICAL for early warning and response
- **Full mode**: Higher cost but comprehensive - opportunities + crises + intelligence

**Recommendation by use case**:
1. **Routine monitoring (every 30 min)**: Base mode only ($0.85)
2. **High-priority times (product launches, earnings)**: Full mode ($4.05)
3. **Crisis watch**: Base + Crisis mode ($2.05)
4. **Growth focus**: Base + Opportunity mode ($2.85)

---

## Implementation Plan

### Phase 1: Core Rebuild (2-3 hours)
1. Create `real-time-intelligence-orchestrator` edge function
2. Implement date filtering and deduplication
3. Add Claude assessment layer
4. Reuse enrichment stage (no changes needed)
5. Create simple synthesis layer

### Phase 2: State Management (1 hour)
1. Create `seen_articles` table
2. Create `real_time_intelligence_briefs` table
3. Implement save/load logic

### Phase 3: UI Integration (1 hour)
1. Update Real-Time tab to call new orchestrator
2. Display synthesis results properly
3. Show article links and sources
4. Add "new since last check" indicator

### Phase 4: Polish (1 hour)
1. Add confidence scores
2. Improve error handling
3. Add retry logic
4. Performance optimization

**Total estimated time: 5-6 hours**

---

## Success Criteria

Real-time intelligence should match intelligence pipeline on:

✅ Uses Claude for analysis (not keyword matching)
✅ Filters by actual publish dates (last 1-6 hours)
✅ Deduplicates across runs (doesn't show same article twice)
✅ Provides context and synthesis (not just raw alerts)
✅ Includes source links and attribution
✅ Generates actionable insights
✅ Routes to opportunity engine properly
✅ Presents results in organized, readable format

**Quality bar**: A user should get similar strategic value from real-time intelligence as from full intelligence pipeline, just focused on breaking developments instead of comprehensive analysis.

---

## Next Steps

1. **Approve architecture**: Confirm this approach matches your vision
2. **Create orchestrator**: Build `real-time-intelligence-orchestrator` edge function
3. **Test with OpenAI**: Validate results match quality expectations
4. **Migrate UI**: Update Real-Time tab to use new system
5. **Deprecate old monitor**: Remove or archive `niv-fireplexity-monitor`

**Timeline**: Can complete in 1 coding session (5-6 hours focused work)

---

**Key Insight**: We're not building a new system - we're **assembling existing high-quality components** (Fireplexity search + enrichment + synthesis) into a faster, focused pipeline for breaking news. This is much better than trying to reinvent the wheel with keyword matching.
