# Real-Time Intelligence Architecture
*Unified system for real-time crisis detection and opportunity identification*

**Created:** January 2025
**Problem:** Multiple real-time sources (Observer, Social, News) need unified triage and routing
**Solution:** Consolidated Real-Time Intelligence Layer

---

## The Complete Picture

### Current Intelligence Sources

```
SCHEDULED (Current Pipeline - Runs on demand):
├── RSS Feeds (Monitor Stage 1)
├── Google News API (Monitor Stage 1)
├── Yahoo Finance (Monitor Stage 1)
└── Scraped sites (Monitor Stage 1)
    ↓
Monitor Stage 2 Relevance → Enrichment → Synthesis → Opportunities

REAL-TIME (New System - Continuous monitoring):
├── Firecrawl Observer (Hourly) → Website changes
├── Social Intelligence (On-demand) → Twitter/Reddit signals
└── NIV-Fireplexity (NEW - Continuous) → Breaking news search
    ↓
Real-Time Triage Agent → Crisis/Opportunity Routing
```

---

## Problem: Firecrawl Observer is NOT Enough

### What Observer Covers:
✅ Website changes (competitor product pages, regulatory sites)
✅ Structural updates (new pages added, content removed)
✅ Specific URL monitoring

### What Observer MISSES:
❌ **Breaking news** (doesn't appear on websites immediately)
❌ **Social media virality** (happening on Twitter/Reddit, not websites)
❌ **News articles** (published on news sites, not monitored websites)
❌ **Multi-source stories** (same story across multiple outlets)

### Example Scenario:
```
Timeline of Crisis:
10:00 AM - Bloomberg publishes "Tesla recalls 1M vehicles"
10:05 AM - Twitter explodes with negative sentiment
10:15 AM - Other news outlets pick up story
10:30 AM - Regulatory site mentions investigation
11:00 AM - Tesla updates their website

Observer only sees: 11:00 AM website update (1 hour late!)
Fireplexity would see: 10:00 AM breaking news (immediate)
Social would see: 10:05 AM sentiment spike (5 min later)
```

---

## Solution: Unified Real-Time Intelligence System

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         REAL-TIME INTELLIGENCE LAYER                │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Observer    │  │   Social     │  │Fireplexity│ │
│  │  (Hourly)    │  │ (Continuous) │  │(15-min)   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬────┘ │
│         │                  │                 │      │
│         └──────────────────┴─────────────────┘      │
│                            ↓                        │
│              ┌─────────────────────────┐            │
│              │  UNIFIED TRIAGE AGENT   │            │
│              │  - Deduplication        │            │
│              │  - Classification       │            │
│              │  - Severity scoring     │            │
│              │  - Cross-source fusion  │            │
│              └──────────┬──────────────┘            │
│                         │                           │
│         ┌───────────────┼───────────────┐           │
│         ↓               ↓               ↓           │
│    ┌────────┐    ┌──────────┐    ┌─────────┐      │
│    │ Crisis │    │Opportunity│    │  Info   │      │
│    │  NIV   │    │ Detector  │    │  Feed   │      │
│    └────────┘    └──────────┘    └─────────┘      │
└─────────────────────────────────────────────────────┘
```

---

## Component 1: NIV-Fireplexity Real-Time Monitor

### File: `supabase/functions/niv-fireplexity-monitor/index.ts`

**Purpose:** Continuous breaking news monitoring using Fireplexity

### Configuration

```typescript
interface FireplexityMonitorConfig {
  organization_id: string
  organization_name: string

  // What to monitor
  queries: string[]  // ["Tesla", "Tesla recall", "Elon Musk Tesla", etc.]

  // How often to check
  check_interval: '5min' | '15min' | '30min' | '1hour'

  // Filtering
  relevance_threshold: number  // 0-100, only return if relevance > threshold
  recency_window: string  // "15min", "1hour", "24hours"

  // Alerting
  alert_on: {
    crisis_keywords: string[]
    opportunity_keywords: string[]
    sentiment_shift: boolean
    volume_spike: boolean
  }
}
```

### Implementation

```typescript
serve(async (req) => {
  const config = await req.json()

  // Build search queries
  const queries = buildMonitoringQueries(config)

  // Search each query via Fireplexity
  const allResults = []

  for (const query of queries) {
    const results = await callNivFireplexity({
      query,
      searchMode: 'focused',
      recency: config.recency_window
    })

    allResults.push(...results.results)
  }

  // Deduplicate (same article from multiple queries)
  const deduplicated = deduplicateResults(allResults)

  // Filter by relevance
  const relevant = deduplicated.filter(r =>
    r.relevance_score >= config.relevance_threshold
  )

  // Check for alerts
  const alerts = detectAlerts(relevant, config.alert_on)

  // Save to database
  await saveFireplexityResults({
    organization_id: config.organization_id,
    results: relevant,
    alerts,
    timestamp: new Date()
  })

  // If alerts detected, trigger real-time triage
  if (alerts.length > 0) {
    await triggerRealTimeTriage(alerts, 'fireplexity')
  }

  return new Response(JSON.stringify({
    success: true,
    results_found: relevant.length,
    alerts_triggered: alerts.length
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Query Building Strategy

```typescript
function buildMonitoringQueries(config: FireplexityMonitorConfig): string[] {
  const { organization_name, profile } = config

  const queries = [
    // Core brand monitoring
    `"${organization_name}"`,
    `${organization_name} news`,
    `${organization_name} breaking`,

    // Crisis detection
    `${organization_name} recall`,
    `${organization_name} lawsuit`,
    `${organization_name} investigation`,
    `${organization_name} scandal`,
    `${organization_name} breach`,
    `${organization_name} incident`,

    // Executive monitoring
    ...profile.executives.map(exec => `"${exec.name}" ${organization_name}`),

    // Competitor monitoring (breaking news)
    ...profile.competitors.map(comp => `"${comp}" breaking news`),
    ...profile.competitors.map(comp => `"${comp}" announcement`),

    // Industry trends
    `${profile.industry} breakthrough`,
    `${profile.industry} regulation`,
    `${profile.industry} market shift`
  ]

  return queries
}
```

### Alert Detection

```typescript
function detectAlerts(results: any[], alertConfig: any): Alert[] {
  const alerts = []

  // Crisis keyword detection
  const crisisKeywords = alertConfig.crisis_keywords || [
    'recall', 'lawsuit', 'investigation', 'breach', 'scandal',
    'fraud', 'death', 'injury', 'fire', 'explosion', 'leak'
  ]

  for (const result of results) {
    const content = result.content.toLowerCase()
    const title = result.title.toLowerCase()

    // Check crisis keywords
    const crisisMatch = crisisKeywords.some(kw =>
      content.includes(kw) || title.includes(kw)
    )

    if (crisisMatch) {
      alerts.push({
        type: 'crisis',
        severity: determineSeverity(result, crisisKeywords),
        source: 'fireplexity',
        title: result.title,
        url: result.url,
        content: result.content,
        detected_at: new Date(),
        keywords_matched: crisisKeywords.filter(kw =>
          content.includes(kw) || title.includes(kw)
        )
      })
    }

    // Check opportunity keywords
    const oppKeywords = alertConfig.opportunity_keywords || [
      'partnership', 'merger', 'acquisition', 'funding',
      'expansion', 'launch', 'winner', 'growth', 'revenue'
    ]

    const oppMatch = oppKeywords.some(kw =>
      content.includes(kw) || title.includes(kw)
    )

    if (oppMatch && !crisisMatch) {
      alerts.push({
        type: 'opportunity',
        severity: 'medium',
        source: 'fireplexity',
        title: result.title,
        url: result.url,
        content: result.content,
        detected_at: new Date()
      })
    }
  }

  // Volume spike detection
  if (results.length > 10) {  // More than 10 articles in window
    alerts.push({
      type: 'volume_spike',
      severity: 'high',
      source: 'fireplexity',
      title: `${results.length} articles detected in monitoring window`,
      content: 'Unusual volume of news coverage',
      detected_at: new Date()
    })
  }

  return alerts
}
```

---

## Component 2: Unified Real-Time Triage Agent

### File: `supabase/functions/real-time-triage/index.ts`

**Purpose:** Consolidate alerts from Observer, Social, and Fireplexity

### Key Features

```typescript
interface RealTimeAlert {
  id: string
  source: 'observer' | 'social' | 'fireplexity'
  type: 'crisis' | 'opportunity' | 'info'
  severity: 'critical' | 'high' | 'medium' | 'low'

  // Source-specific data
  observer_change?: ObserverChange
  social_signals?: SocialSignal[]
  news_results?: FireplexityResult[]

  // Unified fields
  title: string
  summary: string
  detected_at: Date
  organization_id: string

  // Cross-source correlation
  related_alerts?: string[]  // IDs of related alerts from other sources
  correlation_score?: number  // How related are they (0-100)
}
```

### Cross-Source Correlation

```typescript
async function correlateAlerts(newAlert: RealTimeAlert): Promise<RealTimeAlert> {
  // Load recent alerts from all sources (past 1 hour)
  const recentAlerts = await loadRecentAlerts(newAlert.organization_id, '1hour')

  // Find related alerts
  const related = []

  for (const existingAlert of recentAlerts) {
    const correlation = calculateCorrelation(newAlert, existingAlert)

    if (correlation > 70) {
      related.push({
        alert_id: existingAlert.id,
        correlation_score: correlation,
        source: existingAlert.source
      })
    }
  }

  // If highly correlated (same event from multiple sources), merge
  if (related.length > 0) {
    newAlert.related_alerts = related
    newAlert.correlation_score = Math.max(...related.map(r => r.correlation_score))

    // Upgrade severity if multiple sources confirm
    if (related.length >= 2) {
      newAlert.severity = upgradeSeverity(newAlert.severity)
      console.log(`⬆️ Upgraded severity due to ${related.length} correlated sources`)
    }
  }

  return newAlert
}

function calculateCorrelation(alert1: RealTimeAlert, alert2: RealTimeAlert): number {
  let score = 0

  // Same organization
  if (alert1.organization_id === alert2.organization_id) {
    score += 30
  }

  // Similar timing (within 30 min)
  const timeDiff = Math.abs(
    new Date(alert1.detected_at).getTime() -
    new Date(alert2.detected_at).getTime()
  ) / (1000 * 60)

  if (timeDiff < 30) {
    score += 20
  }

  // Similar keywords
  const keywords1 = extractKeywords(alert1.summary)
  const keywords2 = extractKeywords(alert2.summary)
  const commonKeywords = keywords1.filter(k => keywords2.includes(k))

  score += Math.min(30, commonKeywords.length * 10)

  // Same type
  if (alert1.type === alert2.type) {
    score += 20
  }

  return Math.min(100, score)
}
```

### Multi-Source Intelligence Fusion

```typescript
serve(async (req) => {
  const alert = await req.json()

  // Step 1: Correlate with existing alerts
  const correlatedAlert = await correlateAlerts(alert)

  // Step 2: If this is a correlated event, enhance with multi-source data
  if (correlatedAlert.related_alerts && correlatedAlert.related_alerts.length > 0) {
    console.log(`🔗 Correlated event detected from ${correlatedAlert.related_alerts.length + 1} sources`)

    // Gather all related data
    const allData = await gatherRelatedData(correlatedAlert)

    // Create enriched alert with multi-source context
    const enrichedAlert = {
      ...correlatedAlert,
      multi_source_context: {
        observer_data: allData.observer || null,
        social_data: allData.social || null,
        news_data: allData.news || null,

        timeline: buildTimeline(allData),
        confidence: calculateConfidence(allData),

        // Summary across sources
        summary: `
          Detected via ${allData.sources.join(', ')}
          ${allData.observer ? `Website: ${allData.observer.summary}` : ''}
          ${allData.social ? `Social: ${allData.social.signal_count} signals, ${allData.social.sentiment} sentiment` : ''}
          ${allData.news ? `News: ${allData.news.article_count} articles` : ''}
        `
      }
    }

    // Step 3: AI Triage with multi-source context
    const triageDecision = await triageWithMultiSourceContext(enrichedAlert)

    // Step 4: Route to appropriate systems
    await routeBasedOnTriage(triageDecision, enrichedAlert)

  } else {
    // Single-source alert - use standard triage
    const triageDecision = await triageSingleSource(alert)
    await routeBasedOnTriage(triageDecision, alert)
  }

  return new Response('OK', { status: 200 })
})
```

---

## Component 3: Real-Time Monitoring Orchestrator

### File: `supabase/functions/real-time-monitor-orchestrator/index.ts`

**Purpose:** Coordinate all real-time monitoring sources

### Monitoring Schedule

```typescript
const MONITORING_SCHEDULE = {
  // Fireplexity News Monitoring
  fireplexity: {
    interval: '15min',  // Check every 15 minutes
    queries_per_run: 20,  // Max queries to execute
    recency_window: '30min'  // Only new articles from last 30 min
  },

  // Social Intelligence Monitoring
  social: {
    interval: '1hour',  // Twitter/Reddit hourly (rate limits)
    platforms: ['twitter', 'reddit'],
    time_range: '1h'
  },

  // Observer (managed by Firecrawl)
  observer: {
    critical_targets: '15min',
    high_value: '1hour',
    standard: '6hours'
  }
}
```

### Orchestrator Implementation

```typescript
// Runs on Supabase cron job
serve(async (req) => {
  const { source, organization_id } = await req.json()

  switch (source) {
    case 'fireplexity':
      await runFireplexityMonitoring(organization_id)
      break

    case 'social':
      await runSocialMonitoring(organization_id)
      break

    case 'all':
      // Run all sources (used by cron)
      await Promise.all([
        runFireplexityMonitoring(organization_id),
        runSocialMonitoring(organization_id)
      ])
      break
  }

  return new Response('OK', { status: 200 })
})

async function runFireplexityMonitoring(org_id: string) {
  // Load monitoring config
  const config = await loadMonitoringConfig(org_id)

  // Call Fireplexity monitor
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor`,
    {
      method: 'POST',
      body: JSON.stringify({
        organization_id: org_id,
        organization_name: config.organization_name,
        queries: config.fireplexity_queries,
        check_interval: MONITORING_SCHEDULE.fireplexity.interval,
        relevance_threshold: 70,
        recency_window: MONITORING_SCHEDULE.fireplexity.recency_window
      })
    }
  )

  const result = await response.json()
  console.log(`✅ Fireplexity: ${result.results_found} results, ${result.alerts_triggered} alerts`)
}

async function runSocialMonitoring(org_id: string) {
  // Call existing social intelligence
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-social-intelligence`,
    {
      method: 'POST',
      body: JSON.stringify({
        tool: 'monitor_all_platforms',
        arguments: {
          organization_id: org_id,
          time_range: MONITORING_SCHEDULE.social.time_range,
          platforms: MONITORING_SCHEDULE.social.platforms,
          include_sentiment: true
        }
      })
    }
  )

  const result = await response.json()

  // Check for crisis/opportunity signals
  if (result.results.sentiment_analysis) {
    const sentiment = result.results.sentiment_analysis

    // Negative sentiment spike = potential crisis
    if (sentiment.negative_percentage >= 40 && result.results.signals.length >= 5) {
      await triggerRealTimeTriage({
        source: 'social',
        type: 'crisis',
        severity: 'high',
        social_signals: result.results.signals,
        summary: `Negative sentiment spike: ${sentiment.negative_percentage}% negative`
      })
    }
  }

  console.log(`✅ Social: ${result.results.total_signals} signals`)
}
```

---

## Database Schema for Real-Time Intelligence

### New Tables

```sql
-- Real-Time Alerts (all sources)
CREATE TABLE real_time_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- Source
  source TEXT NOT NULL, -- observer, social, fireplexity
  source_data JSONB NOT NULL,

  -- Classification
  alert_type TEXT NOT NULL, -- crisis, opportunity, info
  severity TEXT NOT NULL, -- critical, high, medium, low
  confidence INTEGER NOT NULL, -- 0-100

  -- Content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_content JSONB,

  -- Correlation
  related_alerts UUID[], -- IDs of correlated alerts
  correlation_score INTEGER, -- 0-100
  is_multi_source BOOLEAN DEFAULT false,

  -- Triage
  triage_decision JSONB,
  routed_to TEXT[], -- crisis_niv, opportunity_detector, etc.
  routed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'new', -- new, triaged, routed, actioned
  actioned_at TIMESTAMPTZ,
  outcome TEXT,

  detected_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_real_time_alerts_org ON real_time_alerts(organization_id);
CREATE INDEX idx_real_time_alerts_source ON real_time_alerts(source);
CREATE INDEX idx_real_time_alerts_type ON real_time_alerts(alert_type);
CREATE INDEX idx_real_time_alerts_severity ON real_time_alerts(severity);
CREATE INDEX idx_real_time_alerts_detected ON real_time_alerts(detected_at DESC);

-- Fireplexity Monitoring Results
CREATE TABLE fireplexity_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- Query
  query TEXT NOT NULL,
  search_mode TEXT NOT NULL,
  recency_window TEXT NOT NULL,

  -- Results
  results JSONB[] DEFAULT '{}',
  results_count INTEGER DEFAULT 0,

  -- Alerts generated
  alerts_triggered INTEGER DEFAULT 0,
  alert_ids UUID[],

  -- Timing
  executed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fireplexity_monitoring_org ON fireplexity_monitoring(organization_id);
CREATE INDEX idx_fireplexity_monitoring_executed ON fireplexity_monitoring(executed_at DESC);

-- Monitoring Configuration
CREATE TABLE monitoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  organization_name TEXT NOT NULL,

  -- Fireplexity queries
  fireplexity_queries TEXT[] DEFAULT '{}',
  fireplexity_enabled BOOLEAN DEFAULT true,
  fireplexity_interval TEXT DEFAULT '15min',

  -- Social monitoring
  social_enabled BOOLEAN DEFAULT true,
  social_platforms TEXT[] DEFAULT '{twitter,reddit}',
  social_interval TEXT DEFAULT '1hour',

  -- Observer targets
  observer_enabled BOOLEAN DEFAULT false,
  observer_targets JSONB[] DEFAULT '{}',

  -- Alerting
  crisis_keywords TEXT[] DEFAULT '{}',
  opportunity_keywords TEXT[] DEFAULT '{}',
  alert_threshold INTEGER DEFAULT 70,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_monitoring_config_org ON monitoring_config(organization_id);
```

---

## Supabase Cron Jobs

### Setup Automatic Monitoring

```sql
-- Run real-time monitoring every 15 minutes
SELECT cron.schedule(
  'real-time-fireplexity-monitoring',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/real-time-monitor-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
    body := '{"source": "fireplexity"}'
  );
  $$
);

-- Run social monitoring every hour
SELECT cron.schedule(
  'real-time-social-monitoring',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/real-time-monitor-orchestrator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}',
    body := '{"source": "social"}'
  );
  $$
);
```

---

## UI Integration

### Real-Time Intelligence Dashboard

```typescript
// New module: Real-Time Intelligence
const RealTimeIntelligenceDashboard = () => {
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([])
  const [activeSource, setActiveSource] = useState<'all' | 'observer' | 'social' | 'fireplexity'>('all')

  return (
    <div className="p-6">
      {/* Header with source filters */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-bold">Real-Time Intelligence</h2>

        <div className="flex gap-2">
          <SourceToggle
            active={activeSource === 'all'}
            onClick={() => setActiveSource('all')}
            icon={Activity}
            label="All Sources"
            count={alerts.length}
          />
          <SourceToggle
            active={activeSource === 'fireplexity'}
            onClick={() => setActiveSource('fireplexity')}
            icon={Zap}
            label="Breaking News"
            count={alerts.filter(a => a.source === 'fireplexity').length}
          />
          <SourceToggle
            active={activeSource === 'social'}
            onClick={() => setActiveSource('social')}
            icon={MessageCircle}
            label="Social Media"
            count={alerts.filter(a => a.source === 'social').length}
          />
          <SourceToggle
            active={activeSource === 'observer'}
            onClick={() => setActiveSource('observer')}
            icon={Eye}
            label="Website Changes"
            count={alerts.filter(a => a.source === 'observer').length}
          />
        </div>
      </div>

      {/* Multi-source correlation indicator */}
      <div className="mb-6">
        {alerts.filter(a => a.is_multi_source).length > 0 && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-purple-400">
                {alerts.filter(a => a.is_multi_source).length} correlated events detected across multiple sources
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Alert timeline */}
      <div className="space-y-3">
        {alerts
          .filter(a => activeSource === 'all' || a.source === activeSource)
          .map(alert => (
            <RealTimeAlertCard
              key={alert.id}
              alert={alert}
              onAction={(action) => handleAlertAction(alert, action)}
            />
          ))}
      </div>
    </div>
  )
}

const RealTimeAlertCard = ({ alert, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
    >
      {/* Multi-source indicator */}
      {alert.is_multi_source && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="purple">
            <Sparkles className="w-3 h-3 mr-1" />
            Confirmed by {alert.related_alerts.length + 1} sources
          </Badge>
        </div>
      )}

      {/* Source badges */}
      <div className="flex items-center gap-2 mb-2">
        <SourceBadge source={alert.source} />
        {alert.related_alerts?.map(related => (
          <SourceBadge key={related} source={related.source} variant="related" />
        ))}
      </div>

      {/* Content */}
      <h3 className="font-semibold text-white mb-1">{alert.title}</h3>
      <p className="text-sm text-gray-400 mb-3">{alert.summary}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {alert.alert_type === 'crisis' && (
          <button
            onClick={() => onAction('activate_crisis')}
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm"
          >
            Activate Crisis Center
          </button>
        )}

        {alert.alert_type === 'opportunity' && (
          <button
            onClick={() => onAction('create_opportunity')}
            className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm"
          >
            Create Opportunity
          </button>
        )}

        <button
          onClick={() => onAction('view_details')}
          className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded text-sm"
        >
          View Details
        </button>
      </div>
    </motion.div>
  )
}
```

---

## Cost Analysis

### Current Costs (Scheduled Pipeline)
- Monitor Stage 1: Runs on-demand, ~$0.05/run
- News API: ~$44/month (free tier)
- Total: ~$50/month

### New Real-Time Costs
```
Fireplexity Monitoring:
- 96 runs/day (every 15 min) × 20 queries = 1,920 queries/day
- ~57,600 queries/month
- Estimated: $200-300/month

Social Intelligence:
- 24 runs/day (hourly) × Twitter+Reddit
- Twitter rate limited (free tier)
- Reddit free
- Estimated: $0/month

Observer (when enabled):
- 50 targets × hourly checks = 1,200 checks/day
- ~36,000 checks/month
- Estimated: $200-500/month

Real-Time Triage:
- ~100 AI calls/day (most filtered pre-AI)
- ~3,000 calls/month
- Estimated: $30-50/month

TOTAL REAL-TIME: $430-850/month
TOTAL WITH SCHEDULED: $480-900/month
```

### Cost Optimization
- Fireplexity: Only monitor high-priority queries every 15min, others hourly
- Observer: Start with 10 critical targets, expand based on ROI
- Triage: Pre-filter 90% of noise before AI call
- Social: Use free tiers, rate-limit carefully

---

## Implementation Priority

### Phase 1: Fireplexity Real-Time (Week 1)
- [ ] Create `niv-fireplexity-monitor` function
- [ ] Implement query building and alert detection
- [ ] Set up database tables
- [ ] Test with manual runs

### Phase 2: Unified Triage (Week 2)
- [ ] Create `real-time-triage` function
- [ ] Implement cross-source correlation
- [ ] Test multi-source fusion
- [ ] Deploy triage agent

### Phase 3: Orchestration (Week 3)
- [ ] Create `real-time-monitor-orchestrator`
- [ ] Set up Supabase cron jobs
- [ ] Integrate with existing systems
- [ ] Test automated monitoring

### Phase 4: UI Integration (Week 4)
- [ ] Create Real-Time Intelligence Dashboard
- [ ] Add alert action handlers
- [ ] Connect to Crisis/Opportunity systems
- [ ] Production testing

---

## Success Metrics

### Coverage Metrics
- ✅ Breaking news detected within 15 minutes
- ✅ Website changes detected within 1 hour
- ✅ Social sentiment spikes detected within 1 hour
- ✅ 90%+ of major events detected via at least 2 sources

### Accuracy Metrics
- ✅ >85% triage accuracy
- ✅ >90% of multi-source alerts are genuine
- ✅ <10% false positive rate
- ✅ Cross-source correlation >80% accurate

### Performance Metrics
- ✅ <5 seconds triage time per alert
- ✅ <30 seconds end-to-end (detection → routing)
- ✅ 99% uptime for real-time monitoring

### User Impact Metrics
- ✅ <20 real-time alerts per day (after filtering)
- ✅ >80% of alerts are actionable
- ✅ Average 1 hour faster crisis detection vs scheduled pipeline
- ✅ 5-10 high-value opportunities detected per week

---

## Conclusion

The **Unified Real-Time Intelligence System** combines:

1. **Firecrawl Observer** → Website changes (hourly)
2. **NIV-Fireplexity** → Breaking news (15-min)
3. **Social Intelligence** → Sentiment/virality (hourly)

All three feed into a **Unified Triage Agent** that:
- Deduplicates across sources
- Correlates related events
- Classifies and scores severity
- Routes to Crisis NIV or Opportunity Detector

This creates **complete coverage** - you won't miss a crisis or opportunity, regardless of where it first appears.

---

*Architecture Created: January 2025*
*Status: Ready for Implementation*
*Priority: Implement Fireplexity monitoring first (highest value, lowest cost)*
