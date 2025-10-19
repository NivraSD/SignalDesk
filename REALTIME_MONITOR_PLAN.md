# Real-Time Monitor Architecture Plan

## Problem Statement
Real-time intelligence monitor is timing out at 200+ seconds because it runs all stages internally within a single 150s edge function timeout. Meanwhile, the working intelligence pipeline completes in 112s by calling stages separately from the frontend.

## Critical Requirements
1. **Date Verification**: MUST only show articles from the selected time window (1h, 6h, or 24h)
2. **No Timeouts**: Complete under 150 seconds
3. **Comprehensive Output**: Must include breaking_summary, critical_alerts, watch_list, opportunities_count, articles_analyzed
4. **Crisis Detection**: Route to mcp-opportunity-detector for crisis/opportunity detection
5. **Opportunity Generation**: Route to opportunity-orchestrator-v2 for full opportunity playbooks

---

## SOLUTION 1: Frontend Call Pattern (Recommended)

### Pattern: Call Stages Separately (Like intelligenceService.ts)
**Why**: Each edge function gets its own 150s timeout when called from frontend

```typescript
// Pseudocode for src/app/api/realtime-monitor/route.ts

export async function POST(request: NextRequest) {
  const { organization_id, recency_window } = await request.json()

  // STAGE 1: Discovery (44s) - Get organization profile
  const profileResponse = await supabase.functions.invoke('mcp-discovery', {
    body: {
      tool: 'create_organization_profile',
      arguments: {
        organization_name: organization_id,
        save_to_persistence: true
      }
    }
  })
  const profile = profileResponse.data.profile

  // STAGE 2: Monitor-Stage-1 (78-119s) - Fetch recent articles
  // ✅ Already filters to 48 hours max (lines 717-727 in monitor-stage-1/index.ts)
  const monitorResponse = await supabase.functions.invoke('monitor-stage-1', {
    body: {
      organization_name: organization_id,
      profile: profile
    }
  })
  const articles = monitorResponse.data.articles // Already 48h filtered

  // STAGE 3: Monitor-Stage-2-Relevance (73-77s) - Score & Firecrawl top 25
  const relevanceResponse = await supabase.functions.invoke('monitor-stage-2-relevance', {
    body: {
      articles: articles,
      profile: profile,
      organization_name: organization_id,
      top_k: 10  // ⚠️ REDUCED FROM 25 FOR SPEED - only top 10 articles for real-time
    }
  })
  const relevantArticles = relevanceResponse.data.findings

  // STAGE 4: Monitoring-Stage-2-Enrichment (varies) - Extract events/entities
  const enrichmentResponse = await supabase.functions.invoke('monitoring-stage-2-enrichment', {
    body: {
      articles: relevantArticles,
      profile: profile,
      organization_name: organization_id,
      articles_limit: 10  // ⚠️ REDUCED - only enrich top 10
    }
  })
  const enrichedData = enrichmentResponse.data

  // STAGE 5: Real-Time Synthesis (NEW - 30-40s) - Create breaking summary
  // ⚠️ NOT mcp-executive-synthesis (that's for 5-personality reports)
  // ⚠️ Create new: real-time-synthesis edge function
  const synthesisResponse = await supabase.functions.invoke('real-time-synthesis', {
    body: {
      enriched_data: enrichedData,
      profile: profile,
      organization_name: organization_id,
      time_window: recency_window,
      verification_mode: 'strict_date_check'  // ✅ CRITICAL: Verify dates
    }
  })
  const realtimeSynthesis = synthesisResponse.data

  // STAGE 6A: Crisis Detection (30-40s) - CRITICAL for real-time alerts
  const crisisResponse = await supabase.functions.invoke('mcp-crisis', {
    body: {
      tool: 'detect_crisis_signals',
      arguments: {
        sources: ['news', 'social'],
        keywords: [organization_id, ...profile.competitors?.slice(0, 5) || []],
        sensitivity: 'high',
        timeWindow: recency_window === '1hour' ? '1h' : recency_window === '6hours' ? '6h' : '24h'
      }
    }
  })

  // STAGE 6B: Opportunity Detection (30-50s) - Detect opportunities (parallel with crisis)
  const [crisisDetection, opportunityResponse] = await Promise.all([
    supabase.functions.invoke('mcp-crisis', {
      body: {
        tool: 'detect_crisis_signals',
        arguments: {
          sources: ['news', 'social'],
          keywords: [organization_id, ...profile.competitors?.slice(0, 5) || []],
          sensitivity: 'high',
          timeWindow: recency_window === '1hour' ? '1h' : recency_window === '6hours' ? '6h' : '24h'
        }
      }
    }),
    supabase.functions.invoke('mcp-opportunity-detector', {
      body: {
        method: 'tools/call',
        params: {
          name: 'detect_opportunities',
          arguments: {
            enriched_data: enrichedData,
            organization: { name: organization_id },
            focus: 'real_time'  // Flag for real-time mode
          }
        }
      }
    })
  ])

  const crisisSignals = crisisDetection.data || {}
  const opportunities = opportunityResponse.data.opportunities || []

  // STAGE 7: Opportunity Orchestration (optional - 40-60s)
  // Only for top 3 opportunities to save time
  const topOpportunities = opportunities.slice(0, 3)
  const orchestratedOpportunities = []

  for (const opp of topOpportunities) {
    const orchResponse = await supabase.functions.invoke('opportunity-orchestrator-v2', {
      body: {
        opportunity: opp,
        enriched_data: enrichedData,
        profile: profile
      }
    })
    orchestratedOpportunities.push(orchResponse.data)
  }

  // FINAL: Transform & Return
  return NextResponse.json({
    success: true,
    time_window: recency_window,

    // Article metadata
    articles_analyzed: enrichedData.enriched_articles?.length || 0,
    new_articles: relevantArticles.length,

    // Breaking summary (from real-time-synthesis)
    breaking_summary: realtimeSynthesis.breaking_summary,

    // Critical alerts (merged from synthesis + crisis detection + opportunities)
    alerts: [
      // Crisis alerts from mcp-crisis (highest priority)
      ...(crisisSignals.warningSignals || []).map(signal => ({
        type: 'crisis',
        severity: crisisSignals.riskLevel > 7 ? 'critical' : 'high',
        title: `Crisis Signal: ${signal}`,
        summary: `Detected crisis signal with risk level ${crisisSignals.riskLevel}/10`,
        action: crisisSignals.recommendedActions?.[0] || 'Monitor closely',
        timeline: 'Immediate',
        category: 'crisis'
      })),
      // Alerts from synthesis
      ...(realtimeSynthesis.critical_alerts || []),
      // Urgent opportunities
      ...opportunities.filter(o => o.urgency === 'immediate').map(o => ({
        type: o.crisis ? 'crisis' : 'opportunity',
        severity: 'critical',
        title: o.title,
        summary: o.summary,
        action: o.recommended_action,
        timeline: o.time_to_act,
        sources: o.source_urls || []
      }))
    ],

    // Watch list (from real-time-synthesis)
    watch_list: realtimeSynthesis.watch_list || [],

    // Opportunities (from orchestrator)
    opportunities: orchestratedOpportunities,
    opportunities_count: orchestratedOpportunities.length,

    // Crises (from both mcp-crisis and opportunity detector)
    crises: [
      // Crisis signals from mcp-crisis
      {
        id: `crisis-${Date.now()}`,
        type: 'crisis_detection',
        severity: crisisSignals.riskLevel > 7 ? 'critical' : crisisSignals.riskLevel > 5 ? 'high' : 'medium',
        signals: crisisSignals.warningSignals || [],
        risk_level: crisisSignals.riskLevel || 0,
        recommended_actions: crisisSignals.recommendedActions || [],
        detected_at: new Date().toISOString()
      },
      // Crises from opportunity detector
      ...opportunities.filter(o => o.crisis).map(o => ({
        id: o.id,
        type: 'opportunity_crisis',
        severity: o.urgency === 'immediate' ? 'critical' : 'high',
        title: o.title,
        summary: o.summary,
        recommended_action: o.recommended_action
      }))
    ],
    crises_count: (crisisSignals.warningSignals?.length || 0) + opportunities.filter(o => o.crisis).length,
    critical_crises_count: (crisisSignals.riskLevel > 7 ? 1 : 0) + opportunities.filter(o => o.crisis && o.urgency === 'immediate').length,

    // Crisis risk level (from mcp-crisis)
    crisis_risk_level: crisisSignals.riskLevel || 0,
    crisis_status: crisisSignals.status || 'monitoring',

    // Metadata
    execution_time_ms: Date.now() - startTime,
    date_verification: realtimeSynthesis.date_verification  // ✅ Proof of date check
  })
}
```

### Timing Estimate
- Discovery: 44s
- Monitor-Stage-1: 78-119s (can run in parallel with discovery? NO - needs profile)
- Monitor-Stage-2-Relevance: 73-77s (parallel with enrichment? NO - relevance feeds enrichment)
- Monitoring-Stage-2-Enrichment: 40-60s (reduced from 300 articles to 10)
- Real-Time Synthesis: 30-40s
- Opportunity Detection: 30-50s
- Opportunity Orchestration (3 opps): 40-60s

**Sequential Total**: ~335-410s ❌ TOO SLOW
**But**: Each stage has its own 150s timeout when called from Next.js route ✅

### Optimizations
1. **Reduce top_k from 25 to 10** - Only process top 10 most relevant articles
2. **Limit enrichment to 10 articles** - Skip deep analysis for real-time speed
3. **Only orchestrate top 3 opportunities** - Don't generate full playbooks for all
4. **Run some stages in parallel where possible**:
   - After enrichment completes, call real-time-synthesis AND opportunity-detector in parallel
   - After opportunity detection, orchestrate top 3 in parallel

### Parallel Optimization
```typescript
// After enrichment, run synthesis + detection in parallel
const [synthesisResponse, opportunityResponse] = await Promise.all([
  supabase.functions.invoke('real-time-synthesis', {...}),
  supabase.functions.invoke('mcp-opportunity-detector', {...})
])

// Orchestrate top 3 opportunities in parallel
const orchestrationPromises = topOpportunities.map(opp =>
  supabase.functions.invoke('opportunity-orchestrator-v2', {...})
)
const orchestratedResults = await Promise.all(orchestrationPromises)
```

---

## SOLUTION 2: Real-Time Synthesis Edge Function

### Purpose
Create lightweight synthesis ONLY for real-time UI display (NOT full executive synthesis)

### Input
```typescript
{
  enriched_data: {
    enriched_articles: [...],  // Top 10 articles with deep analysis
    extracted_data: {
      events: [...],
      entities: [...],
      quotes: [...],
      metrics: [...]
    },
    organized_intelligence: {...},
    knowledge_graph: {...},
    profile: {...}
  },
  organization_name: "Tesla",
  time_window: "6hours",
  verification_mode: "strict_date_check"
}
```

### Output Format
```typescript
{
  breaking_summary: string,  // 2-3 sentences: "What happened in the last 6 hours?"

  critical_alerts: [
    {
      urgency: "immediate" | "this_week" | "this_month",
      category: "crisis" | "opportunity" | "threat",
      title: string,
      summary: string,
      recommended_action: string,
      time_to_act: string,
      source_urls: string[]
    }
  ],

  watch_list: [
    {
      entity: string,  // Competitor/stakeholder name
      event: string,   // What they did
      implication: string,  // Why it matters
      urgency: "high" | "medium" | "low"
    }
  ],

  date_verification: {
    time_window_requested: "6hours",
    articles_in_window: 8,
    articles_outside_window: 0,  // ✅ MUST BE 0
    newest_article_date: "2025-10-01T14:30:00Z",
    oldest_article_date: "2025-10-01T08:15:00Z",
    verification_passed: true  // ✅ CRITICAL
  },

  metadata: {
    articles_analyzed: 10,
    events_extracted: 25,
    entities_mentioned: 15,
    timestamp: "2025-10-01T14:35:00Z"
  }
}
```

### Claude Prompt Structure
```typescript
const prompt = `YOU ARE A REAL-TIME INTELLIGENCE ANALYST

CRITICAL: You are analyzing ONLY articles from the last ${time_window}.
VERIFY: Every article date MUST be within the time window.
REJECT: Any article outside the time window.

TIME WINDOW: Last ${time_window} (from ${windowStart} to ${windowEnd})

ARTICLES TO ANALYZE (${enriched_articles.length} total):
${enriched_articles.map((a, i) => `
${i+1}. "${a.title}"
   Published: ${a.published_at}
   ⚠️ AGE CHECK: ${calculateAge(a.published_at)} ${isWithinWindow(a.published_at, time_window) ? '✅ IN WINDOW' : '❌ OUTSIDE WINDOW - REJECT'}
   Summary: ${a.summary?.substring(0, 200)}
   Key Events: ${a.events?.map(e => e.description).join('; ')}
`).join('\n')}

PRE-EXTRACTED EVENTS (from enrichment):
${events.map(e => `- [${e.type}] ${e.entity}: ${e.description}`).join('\n')}

YOUR TASK:
1. VERIFY all articles are within ${time_window} window
2. Create a breaking_summary (2-3 sentences): What happened?
3. Identify critical_alerts requiring immediate action
4. Create watch_list of entities to monitor

RESPOND IN JSON FORMAT:
{
  "breaking_summary": "In the last ${time_window}, [concise summary of top 2-3 developments]",
  "critical_alerts": [...],
  "watch_list": [...],
  "date_verification": {
    "articles_analyzed": ${enriched_articles.length},
    "articles_in_window": [COUNT ONLY ARTICLES IN WINDOW],
    "articles_rejected": [COUNT ARTICLES OUTSIDE WINDOW],
    "verification_passed": [true if all articles in window, false otherwise]
  }
}

⚠️ CRITICAL: If any article is outside the time window, set verification_passed: false
`
```

---

## DATE VERIFICATION FLOW

### Stage 1: Monitor-Stage-1 Filters
✅ Already implemented (lines 717-727)
- Filters all articles to last 48 hours
- Logs distribution: 1h, 6h, 12h, 24h, 48h

### Stage 2: Real-Time Synthesis Verification
⚠️ NEW - Must implement
```typescript
function verifyArticleDates(articles, timeWindow) {
  const now = new Date()
  const windowMs = timeWindow === '1hour' ? 3600000 :
                   timeWindow === '6hours' ? 21600000 :
                   86400000  // 24 hours

  const cutoff = new Date(now.getTime() - windowMs)

  const inWindow = articles.filter(a => new Date(a.published_at) > cutoff)
  const rejected = articles.filter(a => new Date(a.published_at) <= cutoff)

  if (rejected.length > 0) {
    console.warn(`⚠️ DATE VERIFICATION FAILED: ${rejected.length} articles outside ${timeWindow} window`)
    rejected.forEach(a => {
      console.warn(`   - "${a.title}" published at ${a.published_at}`)
    })
  }

  return {
    in_window: inWindow,
    rejected: rejected,
    verification_passed: rejected.length === 0,
    newest_date: inWindow[0]?.published_at,
    oldest_date: inWindow[inWindow.length - 1]?.published_at
  }
}
```

### Stage 3: Claude Double-Check
✅ Include in synthesis prompt
- Claude verifies each article date
- Claude reports which articles are in/out of window
- Claude sets verification_passed flag

### Stage 4: UI Display
```typescript
// In IntelligenceModule.tsx
{realtimeResults.date_verification && !realtimeResults.date_verification.verification_passed && (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
    ⚠️ Date Verification Failed: Some articles are outside the selected time window
  </div>
)}
```

---

## FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME MONITOR FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Frontend IntelligenceModule.tsx
  │
  │ handleRealtimeMonitor()
  │
  ▼
Next.js Route: /api/realtime-monitor
  │
  ├─► Discovery (44s)
  │    └─► profile
  │
  ├─► Monitor-Stage-1 (78-119s)
  │    ├─► Fetches articles
  │    └─► ✅ Filters to 48h max
  │
  ├─► Monitor-Stage-2-Relevance (73-77s)
  │    ├─► Scores articles
  │    ├─► Firecrawl top 10 (reduced from 25)
  │    └─► findings
  │
  ├─► Monitoring-Stage-2-Enrichment (40-60s)
  │    ├─► Extract events/entities (only 10 articles)
  │    └─► enriched_data
  │
  ├─► PARALLEL ─────────────────────────────────────┐
  │   │                                              │
  │   ├─► Real-Time Synthesis (30-40s)              │
  │   │    ├─► ✅ Verify dates                      │
  │   │    ├─► breaking_summary                     │
  │   │    ├─► critical_alerts                      │
  │   │    └─► watch_list                           │
  │   │                                              │
  │   ├─► MCP Crisis Detection (30-40s) ⚠️ NEW      │
  │   │    ├─► detect_crisis_signals                │
  │   │    ├─► Risk level (1-10)                    │
  │   │    ├─► Warning signals                      │
  │   │    └─► Recommended actions                  │
  │   │                                              │
  │   └─► MCP Opportunity Detector (30-50s)         │
  │        ├─► Detect crises (duplicate check)      │
  │        └─► Detect opportunities                 │
  │                                                  │
  └──────────────────────────────────────────────┘
  │
  └─► Opportunity Orchestrator (40-60s)
       ├─► Only top 3 opportunities
       └─► Generate playbooks in parallel

Total Time: ~335-410s sequential
            ~280-350s with parallelization
            Each stage gets own 150s timeout ✅
```

---

## IMPLEMENTATION CHECKLIST

### 1. Create New Edge Function: real-time-synthesis
- [ ] Copy template from mcp-executive-synthesis
- [ ] Simplify output (no 5 personalities)
- [ ] Add date verification logic
- [ ] Add breaking_summary generation
- [ ] Add critical_alerts extraction
- [ ] Add watch_list creation
- [ ] Test with enriched data

### 2. Update /api/realtime-monitor Route
- [ ] Remove call to real-time-intelligence-orchestrator-v2
- [ ] Add sequential stage calls (like intelligenceService.ts)
- [ ] Reduce top_k to 10 for relevance stage
- [ ] Reduce articles_limit to 10 for enrichment
- [ ] Add parallel execution for synthesis + crisis detection + opportunity detection
- [ ] Add parallel execution for opportunity orchestration (top 3)
- [ ] Merge crisis signals from mcp-crisis into alerts/crises arrays
- [ ] Transform response to match UI expectations

### 3. Add Crisis Detection (mcp-crisis)
- [ ] Call mcp-crisis with detect_crisis_signals tool
- [ ] Pass time_window parameter (1h/6h/24h)
- [ ] Extract risk_level, warning_signals, recommended_actions
- [ ] Merge crisis signals into alerts array (highest priority)
- [ ] Include crisis_risk_level in response metadata
- [ ] Display crisis status in UI

### 4. Add Date Verification
- [ ] Add verifyArticleDates() helper function
- [ ] Log rejected articles
- [ ] Include verification results in response
- [ ] Update UI to show verification status

### 5. Optimize for Speed
- [ ] Profile each stage timing
- [ ] Identify bottlenecks
- [ ] Consider caching profile data
- [ ] Consider caching recent articles

---

## SUCCESS CRITERIA

✅ Real-time monitor completes without timeout
✅ All articles are within selected time window (1h/6h/24h)
✅ Breaking summary accurately reflects recent developments
✅ Critical alerts are actionable and current
✅ Opportunities are detected and orchestrated (top 3)
✅ Crises are detected and flagged
✅ UI displays all required data
✅ Date verification passes and is shown to user
