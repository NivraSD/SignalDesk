# Stakeholder Prediction System - Feasibility Analysis (Beta)

## Executive Summary

**Can we build this prediction system with current infrastructure?**
**YES - 70% there already. Beta-ready in 3-4 weeks.**

Your existing intelligence pipeline (`mcp-executive-synthesis`, `niv-intelligence-pipeline`) provides the foundation. The prediction layer is primarily **pattern recognition + behavioral modeling on top of existing data collection**.

---

## What You Already Have ✅

### 1. Intelligence Gathering Infrastructure (COMPLETE)

**Current System**:
```typescript
// niv-intelligence-pipeline/index.ts
- Discovery (organization profiling) ✅
- Enhanced Fireplexity search ✅
- PR filtering & relevance scoring ✅
- Article enrichment ✅
- Executive synthesis (Claude-powered) ✅
```

**Covers Prediction Requirements**:
- ✅ News monitoring (real-time via Fireplexity)
- ✅ Competitive intelligence gathering
- ✅ Stakeholder identification (from discovery profiles)
- ✅ Event extraction and categorization
- ✅ Entity relationship mapping (knowledge graphs)

### 2. Existing Database Tables (ALREADY DEPLOYED)

**From your SQL migrations**:
```sql
-- Organizations & Discovery
CREATE TABLE organizations ✅
CREATE TABLE mcp_discovery ✅ (has stakeholders, competitors, keywords)

-- Intelligence Storage
CREATE TABLE intelligence_runs ✅
CREATE TABLE real_time_intelligence ✅
CREATE TABLE fireplexity_results ✅

-- Opportunities (pattern storage ready)
CREATE TABLE opportunities ✅
CREATE TABLE opportunity_detections ✅

-- Content Library (for historical analysis)
CREATE TABLE content_library ✅

-- Journalist Registry (media stakeholders)
CREATE TABLE journalist_registry ✅
```

**What's Missing**: Only 3 new tables needed (see below)

### 3. AI/ML Capabilities (OPERATIONAL)

**Executive Synthesis Function**:
```typescript
// mcp-executive-synthesis/index.ts
✅ Claude Sonnet 4 integration
✅ Pattern extraction from events
✅ Entity relationship detection
✅ Behavioral analysis from enriched data
✅ Strategic insight generation
```

**This is 80% of prediction intelligence** - you're already extracting:
- Stakeholder actions/movements
- Competitive dynamics
- Narrative shifts
- Market signals

### 4. Social Intelligence (LIMITED but FUNCTIONAL)

```typescript
// mcp-social-intelligence/index.ts
✅ Social monitoring framework exists
⚠️ API access limited (Reddit, HN work; Twitter/LinkedIn restricted)
```

**Prediction System Workaround**: Focus on:
- Public data (Reddit, HN, Glassdoor)
- News velocity as proxy for social sentiment
- Analyst reports and public statements

---

## What's Needed for Prediction System (30% Gap)

### Phase 1: Database Extensions (Week 1)

**3 New Tables** (based on predictions.md):

```sql
-- Stakeholder Behavioral Profiles
CREATE TABLE stakeholder_profiles (
  id SERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  stakeholder_name VARCHAR(255),
  stakeholder_type VARCHAR(50), -- 'regulator', 'activist', 'investor', etc.
  influence_score DECIMAL(3,2),
  predictability_score DECIMAL(3,2),
  typical_response_time_days INTEGER,
  behavioral_profile JSONB, -- From executive synthesis
  historical_actions JSONB, -- Past actions extracted from news
  trigger_patterns JSONB, -- What triggers them (from pattern detection)
  network_connections JSONB, -- Who they're connected to
  last_action_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Action Predictions
CREATE TABLE stakeholder_predictions (
  id SERIAL PRIMARY KEY,
  stakeholder_id INTEGER REFERENCES stakeholder_profiles(id),
  predicted_action VARCHAR(255),
  probability DECIMAL(3,2),
  expected_timeframe VARCHAR(50), -- '7 days', '30 days', etc
  trigger_signals JSONB, -- What signals led to this prediction
  confidence_level VARCHAR(20), -- 'high', 'medium', 'low'
  supporting_evidence JSONB, -- Links to intelligence data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Historical Action Patterns (for ML training)
CREATE TABLE stakeholder_action_history (
  id SERIAL PRIMARY KEY,
  stakeholder_id INTEGER REFERENCES stakeholder_profiles(id),
  action_type VARCHAR(100),
  action_details TEXT,
  preceded_by_signals JSONB, -- What signals came before (from intelligence)
  lead_time_days INTEGER, -- How many days from signal to action
  impact_magnitude VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
  outcome JSONB,
  action_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**RLS Policies**:
```sql
-- Lock down to organization access
ALTER TABLE stakeholder_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_access" ON stakeholder_profiles
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));
```

### Phase 2: Pattern Detection Engine (Week 2)

**New Edge Function**: `stakeholder-pattern-detector`

```typescript
// supabase/functions/stakeholder-pattern-detector/index.ts
import { createClient } from '@supabase/supabase-js'

// Pattern library from predictions.md
const STAKEHOLDER_PATTERNS = {
  regulatoryEnforcement: {
    type: 'regulator',
    earlySignals: {
      T90: ['Peer company enforcement', 'Industry investigations'],
      T60: ['Congressional hearings', 'Regulator speeches'],
      T30: ['Informal inquiries', 'Document requests'],
      T14: ['Wells notice', 'Settlement discussions'],
      T7: ['Enforcement filed', 'Public announcement']
    },
    avgLeadTime: 45,
    reliability: 0.78
  },

  activistCampaign: {
    type: 'activist',
    earlySignals: {
      T90: ['Initial stake building <5%', 'White papers'],
      T60: ['Stake increase 5-10%', 'Private engagement'],
      T30: ['13D filing', 'Public criticism'],
      T14: ['Proxy fight', 'Media campaign'],
      T7: ['Shareholder proposal', 'Board nominations']
    },
    avgLeadTime: 60,
    reliability: 0.82
  }
  // ... more patterns from predictions.md
}

export async function detectPatterns(intelligenceData: any) {
  const supabase = createClient(...)

  // 1. Get stakeholders from discovery profile
  const { data: orgProfile } = await supabase
    .from('mcp_discovery')
    .select('stakeholders, competition')
    .eq('organization_id', intelligenceData.organizationId)
    .single()

  // 2. Get recent intelligence events (already extracted by mcp-executive-synthesis)
  const { data: recentEvents } = await supabase
    .from('real_time_intelligence')
    .select('events, entities, insights')
    .eq('organization_id', intelligenceData.organizationId)
    .gte('created_at', 'NOW() - INTERVAL \'90 days\'')

  // 3. Match events to patterns
  const predictions = []
  for (const stakeholder of orgProfile.stakeholders) {
    for (const pattern of STAKEHOLDER_PATTERNS) {
      const matchScore = calculatePatternMatch(
        recentEvents.events,
        pattern.earlySignals
      )

      if (matchScore > 0.6) {
        predictions.push({
          stakeholder: stakeholder.name,
          pattern: pattern.name,
          probability: matchScore * pattern.reliability,
          expectedTimeframe: calculateTimeframe(matchScore, pattern.avgLeadTime),
          signals: extractMatchingSignals(recentEvents, pattern),
          confidence: matchScore > 0.8 ? 'high' : 'medium'
        })
      }
    }
  }

  // 4. Store predictions
  await supabase.from('stakeholder_predictions').insert(predictions)

  return predictions
}

function calculatePatternMatch(events: any[], patternSignals: any): number {
  // Score based on how many T90, T60, T30 signals are present
  let score = 0
  let totalWeight = 0

  for (const [period, signals] of Object.entries(patternSignals)) {
    const periodDays = parseInt(period.replace('T', ''))
    const weight = periodDays < 30 ? 2 : 1 // Recent signals weighted more

    const recentEvents = events.filter(e =>
      daysSince(e.date) <= periodDays
    )

    const matchedSignals = signals.filter(signal =>
      recentEvents.some(event =>
        event.description.toLowerCase().includes(signal.toLowerCase())
      )
    )

    score += (matchedSignals.length / signals.length) * weight
    totalWeight += weight
  }

  return score / totalWeight // Normalized 0-1 score
}
```

### Phase 3: Stakeholder Profiling Agent (Week 3)

**New Edge Function**: `stakeholder-profiler`

Uses existing `mcp-executive-synthesis` to build behavioral profiles:

```typescript
// supabase/functions/stakeholder-profiler/index.ts
export async function profileStakeholder(stakeholder: any, orgId: string) {
  // 1. Search for stakeholder in intelligence history
  const { data: mentions } = await supabase
    .from('real_time_intelligence')
    .select('events, entities, quotes')
    .eq('organization_id', orgId)
    .contains('entities', [{ name: stakeholder.name }])
    .order('created_at', { ascending: false })
    .limit(50)

  // 2. Use Claude to analyze behavioral patterns
  const profile = await synthesizeProfile(mentions, stakeholder)

  // 3. Calculate metrics
  const behaviorProfile = {
    consistency_score: calculateConsistency(mentions),
    avg_reaction_days: calculateAvgReactionTime(mentions),
    influence_network: extractNetworkConnections(mentions),
    typical_triggers: extractTriggers(mentions),
    communication_style: analyzeCommunicationStyle(mentions.quotes)
  }

  // 4. Store profile
  await supabase.from('stakeholder_profiles').upsert({
    organization_id: orgId,
    stakeholder_name: stakeholder.name,
    stakeholder_type: stakeholder.type,
    behavioral_profile: behaviorProfile,
    historical_actions: extractActions(mentions),
    predictability_score: behaviorProfile.consistency_score
  })

  return behaviorProfile
}

async function synthesizeProfile(mentions: any[], stakeholder: any) {
  // Use mcp-executive-synthesis logic
  const prompt = `Analyze this stakeholder's behavioral patterns:

  Stakeholder: ${stakeholder.name}
  Type: ${stakeholder.type}

  Historical Actions:
  ${mentions.map(m => m.events).flat().join('\n')}

  Provide:
  1. Typical response patterns
  2. Common triggers for action
  3. Predictability assessment (high/medium/low)
  4. Estimated response timeframes
  `

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  return await response.json()
}
```

### Phase 4: Frontend UI (Week 3-4)

**New Tab**: `Predictions` (or integrate into Intelligence tab)

```typescript
// src/components/predictions/StakeholderPredictionDashboard.tsx
import { useEffect, useState } from 'react'

export default function StakeholderPredictionDashboard({ orgId }) {
  const [predictions, setPredictions] = useState([])
  const [stakeholders, setStakeholders] = useState([])
  const [loading, setLoading] = useState(false)

  // Initial profiling
  const buildProfiles = async () => {
    setLoading(true)

    // Call stakeholder-profiler for each stakeholder
    const response = await fetch('/api/predictions/build-profiles', {
      method: 'POST',
      body: JSON.stringify({ organizationId: orgId })
    })

    const data = await response.json()
    setStakeholders(data.profiles)
    setLoading(false)
  }

  // Real-time prediction updates
  useEffect(() => {
    if (!orgId) return

    const interval = setInterval(async () => {
      const response = await fetch(`/api/predictions/detect?orgId=${orgId}`)
      const data = await response.json()
      setPredictions(data.predictions)
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(interval)
  }, [orgId])

  return (
    <div className="prediction-dashboard">
      {loading ? (
        <BuildingProfiles />
      ) : (
        <>
          <StakeholderMap stakeholders={stakeholders} predictions={predictions} />
          <PredictionTimeline predictions={predictions} />
          <RiskAlerts predictions={predictions.filter(p => p.confidence === 'high')} />
          <RecommendedActions predictions={predictions} />
        </>
      )}
    </div>
  )
}

function PredictionTimeline({ predictions }) {
  // Sort by timeframe
  const sorted = predictions.sort((a, b) =>
    parseInt(a.expected_timeframe) - parseInt(b.expected_timeframe)
  )

  return (
    <div className="timeline">
      {sorted.map(pred => (
        <div key={pred.id} className="prediction-card">
          <h4>{pred.stakeholder.name}</h4>
          <p className="action">{pred.predicted_action}</p>
          <div className="meta">
            <span className="probability">{(pred.probability * 100).toFixed(0)}%</span>
            <span className="timeframe">{pred.expected_timeframe}</span>
            <span className="confidence">{pred.confidence}</span>
          </div>
          <div className="signals">
            <h5>Supporting Evidence:</h5>
            {pred.trigger_signals.map((signal, i) => (
              <div key={i} className="signal">{signal}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## What We Can't Do (API Limitations)

### Social Media Monitoring - Workarounds

**Limited**:
- ❌ Twitter API (expensive, restricted)
- ❌ LinkedIn API (enterprise only)
- ❌ Facebook/Instagram (heavily restricted)

**Available**:
- ✅ Reddit API (free, works well)
- ✅ Hacker News (public, no API needed)
- ✅ Glassdoor (web scraping with Firecrawl)
- ✅ SEC EDGAR (public filings)
- ✅ Federal Register (regulatory actions)
- ✅ Patent databases (USPTO free API)

**Strategy for Beta**:
- Focus on **public regulatory and financial signals** (high reliability)
- Use **news velocity as sentiment proxy** (already have via Fireplexity)
- Add **Glassdoor monitoring for employee sentiment** (Firecrawl)
- Monitor **Reddit/HN for crisis signals** (already functional)

---

## Beta Implementation Plan (3-4 Weeks)

### Week 1: Database + Pattern Library
- **Day 1-2**: Create 3 new tables, add RLS policies
- **Day 3-4**: Build pattern library (copy from predictions.md)
- **Day 5**: Test pattern matching against existing intelligence

### Week 2: Pattern Detection Engine
- **Day 1-3**: Build `stakeholder-pattern-detector` edge function
- **Day 4-5**: Integrate with existing intelligence pipeline

### Week 3: Profiling + Learning
- **Day 1-3**: Build `stakeholder-profiler` edge function
- **Day 4-5**: Historical action extraction from existing data

### Week 4: Frontend + Beta Launch
- **Day 1-3**: Build prediction dashboard UI
- **Day 4**: Integration testing
- **Day 5**: Beta launch with "BETA" badge

---

## Success Metrics for Beta

### Technical Targets
```yaml
Prediction Accuracy: >60% (for beta)
Pattern Match Rate: >70%
Stakeholder Coverage: >80% of discovery targets
Prediction Lead Time: 14-60 days
False Positive Rate: <30%
```

### Business Metrics
```yaml
Time to Profile Build: <2 minutes
Predictions per Organization: 5-10 average
User Engagement: 1+ check per day
Crisis Prevention Rate: >40%
```

---

## Advantages of Current Infrastructure

1. **Intelligence Already Flowing**
   - You're already extracting events, entities, and patterns
   - Executive synthesis is doing 80% of prediction intelligence
   - Just need to **store it differently** (in prediction tables)

2. **Pattern Matching is Deterministic**
   - Don't need complex ML models for beta
   - Rule-based matching on existing patterns
   - Claude already doing behavioral analysis

3. **Data Quality is High**
   - PR filtering ensures relevance
   - Relevance scoring prioritizes signals
   - Deep analysis provides context

4. **Fast to Market**
   - Reuse existing functions
   - Add 3 tables + 2 edge functions
   - Simple UI layer on top

---

## Risk Mitigation

### Risk 1: Low Prediction Accuracy
**Mitigation**:
- Start with high-reliability patterns (regulators, activists)
- Show confidence scores clearly
- Label as "BETA - Experimental"
- Learn from user feedback

### Risk 2: Data Sparsity
**Mitigation**:
- Focus on organizations with >90 days of intelligence history
- Use discovery profile to seed stakeholder list
- Backfill from existing `real_time_intelligence` table

### Risk 3: Social API Limitations
**Mitigation**:
- Focus on public data sources (regulators, filings, news)
- Use news velocity as sentiment proxy
- Add Glassdoor for employee signals
- Emphasize regulatory/financial predictions (more reliable anyway)

---

## Recommendation: BUILD IT

**Why This Works**:
1. ✅ 70% of infrastructure already exists
2. ✅ Core intelligence gathering operational
3. ✅ Pattern detection is rule-based (simple)
4. ✅ Claude already doing behavioral analysis
5. ✅ 3-4 weeks to beta (fast)

**Beta Feature Set**:
- Stakeholder behavioral profiles
- Regulatory action predictions (highest accuracy)
- Activist campaign predictions (second highest)
- Competitor move predictions (third)
- Risk alerts for high-confidence predictions

**MVP User Flow**:
1. User runs intelligence pipeline (already works)
2. System auto-generates stakeholder profiles (new)
3. Pattern detector finds matching signals (new)
4. User sees predictions in new "Predictions" tab (new)
5. System learns from outcomes (post-beta)

**Launch as "BETA - Experimental"**:
- Set expectations correctly
- Gather feedback early
- Iterate based on real usage
- Build credibility with accuracy over time

**Next Steps**:
1. Create the 3 database tables (1 hour)
2. Build pattern detection function (2 days)
3. Build stakeholder profiler (2 days)
4. Build prediction UI (3 days)
5. Test with 2-3 real organizations (3 days)
6. Launch beta with "EXPERIMENTAL" badge

---

## Appendix: Free Data Sources for Predictions

### Regulatory Intelligence (High Reliability)
- **SEC EDGAR**: Free API, real-time filings
- **Federal Register**: Free API, regulatory actions
- **Congress.gov**: Free API, legislation tracking
- **State regulatory sites**: Public, scrapable

### Corporate Actions (Medium Reliability)
- **SEC 13D/F filings**: Activist position building
- **Insider trading data**: Executive sentiment
- **Patent filings**: USPTO free API
- **Press releases**: Via Fireplexity

### Market Sentiment (Low-Medium Reliability)
- **Reddit**: Free API, social sentiment
- **Hacker News**: Public, no API
- **Glassdoor**: Firecrawl scraping, employee sentiment
- **News velocity**: Already have via Fireplexity

### Stakeholder Actions (Medium-High Reliability)
- **Proxy statements**: SEC filings
- **Shareholder proposals**: SEC filings
- **Executive moves**: LinkedIn + news
- **Analyst reports**: News mentions

---

## Technical Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                     EXISTING INTELLIGENCE                   │
│                                                            │
│  niv-intelligence-pipeline → mcp-executive-synthesis       │
│         ↓                              ↓                   │
│    real_time_intelligence    →    organized_intelligence   │
│    (events, entities, quotes)     (knowledge graphs)       │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       │ NEW: Feed into
                       ↓
┌────────────────────────────────────────────────────────────┐
│                  PREDICTION LAYER (NEW)                     │
│                                                            │
│  stakeholder-profiler      stakeholder-pattern-detector    │
│         ↓                              ↓                   │
│  stakeholder_profiles      stakeholder_predictions         │
│  (behavioral analysis)     (pattern matches)               │
│         ↓                              ↓                   │
│  stakeholder_action_history                                │
│  (learning database)                                       │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       │ Display in
                       ↓
┌────────────────────────────────────────────────────────────┐
│                    PREDICTIONS UI (NEW)                     │
│                                                            │
│  StakeholderMap  →  PredictionTimeline  →  RiskAlerts     │
│  (network viz)      (actions forecast)     (high prob)    │
└────────────────────────────────────────────────────────────┘
```

---

**Status**: READY TO BUILD
**Confidence**: HIGH
**Time to Beta**: 3-4 WEEKS
**Resource Requirements**: MINIMAL (reuse existing infrastructure)
