# Intelligence Pipeline Architecture
## From Raw Articles to Executive Intelligence

## Overview

This architecture connects V5 Batch Scraper (source discovery + scraping) to the downstream intelligence pipeline (synthesis, opportunities, connections, predictions).

**Problem Statement:**
- V5 scraper delivers ~1000 tagged articles daily from 88 sources
- These need to be transformed into executive intelligence for each organization
- Must filter by industry relevance before enrichment to avoid processing 200+ irrelevant articles

**Solution:**
A multi-stage pipeline that filters → enriches → synthesizes → detects patterns → generates opportunities

---

## Pipeline Stages

### Stage 1: Article Discovery & Scraping ✅ COMPLETE
**Functions:** `batch-scraper-v5-orchestrator-rss`, `batch-scraper-v5-orchestrator-cse`, `batch-scraper-v5-worker`

**Input:** Source registry (88 sources)
**Output:** `raw_articles` table with full content + industry tags
**Status:** Production-ready, 969 articles scraped, 814 tagged (83%)

**Daily Volume:** ~1000 articles from:
- 44 RSS sources (Tier 2/3: Industry publications)
- 44 Google CSE sources (Tier 1: Bloomberg, WSJ, Reuters, etc.)

### Stage 2: Industry Classification ✅ COMPLETE
**Function:** `batch-article-tagger`

**Input:** Untagged articles in `raw_articles`
**Output:** Articles with `raw_metadata.industries` array
**Status:** Production-ready

**Enables:** Fast filtering by industry before enrichment
```sql
-- Get only technology articles for tech org
SELECT * FROM raw_articles
WHERE raw_metadata->'industries' ? 'technology'
  AND scrape_status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days';
```

### Stage 3: Article Enrichment (NEW - TO BUILD)
**Proposed Function:** `batch-article-enrichment-v2`

**Purpose:** Extract structured intelligence from article content

**Input:**
- Organization ID
- Organization industry
- Filtered articles (20-50 per org, industry-matched)

**Process:**
1. Filter `raw_articles` by:
   - Industry match (trade publications OR Tier 1 with matching tags)
   - Time window (last 7 days)
   - Not already enriched for this org
2. Call LLM to extract:
   - Events (product launches, partnerships, crises, etc.)
   - Entities (companies, people, locations mentioned)
   - Quotes (key statements)
   - Metrics (numbers, dates, financial data)
   - Sentiment (positive/negative/neutral)
   - Relevance to org (0-100 score)
3. Store in `enriched_articles` table

**Output Schema:**
```sql
CREATE TABLE enriched_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  raw_article_id UUID REFERENCES raw_articles(id),

  -- Core content
  title TEXT,
  url TEXT,
  source_name TEXT,
  published_at TIMESTAMPTZ,

  -- Enrichment
  relevance_score INTEGER, -- 0-100
  sentiment VARCHAR(20), -- positive, negative, neutral, mixed
  category VARCHAR(50), -- partnership, crisis, product_launch, etc.

  -- Extracted structured data
  events JSONB, -- [{type, title, date, entities_involved}]
  entities JSONB, -- [{name, type, role, mentions}]
  quotes JSONB, -- [{text, speaker, context}]
  metrics JSONB, -- [{value, unit, context}]

  -- Target matching (which intelligence targets mentioned?)
  matched_targets UUID[], -- Array of intelligence_target IDs

  -- Metadata
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, raw_article_id)
);

CREATE INDEX idx_enriched_org_date ON enriched_articles(organization_id, created_at DESC);
CREATE INDEX idx_enriched_relevance ON enriched_articles(relevance_score DESC);
CREATE INDEX idx_enriched_category ON enriched_articles(category);
CREATE INDEX idx_enriched_targets ON enriched_articles USING GIN(matched_targets);
```

**Filtering Strategy:**
```sql
-- STEP 1: Get trade publications (auto-match by source industry)
WITH trade_articles AS (
  SELECT ra.*, sr.tier
  FROM raw_articles ra
  JOIN source_registry sr ON ra.source_id = sr.id
  WHERE sr.industries @> ARRAY['technology']::text[]
    AND ra.scrape_status = 'completed'
    AND ra.created_at > NOW() - INTERVAL '7 days'
),

-- STEP 2: Get Tier 1 articles filtered by industry tag
tier1_articles AS (
  SELECT ra.*, 1 as tier
  FROM raw_articles ra
  WHERE ra.raw_metadata->'industries' ? 'technology'
    AND ra.scrape_status = 'completed'
    AND ra.source_name IN ('Bloomberg', 'Wall Street Journal', 'Reuters')
    AND ra.created_at > NOW() - INTERVAL '7 days'
)

-- COMBINE
SELECT * FROM trade_articles
UNION ALL
SELECT * FROM tier1_articles
ORDER BY tier ASC, created_at DESC
LIMIT 50;
```

**Performance:**
- Input: 20-50 articles per org
- Processing: ~2-3 seconds per article with Claude Haiku
- Total: ~2 minutes for 50 articles
- Cost: ~$0.50 per org per week

### Stage 4: Target Intelligence Population (NEW - TO BUILD)
**Proposed Function:** `populate-target-intelligence`

**Purpose:** Match enriched articles to intelligence targets and populate the intelligence repository

**Input:** Newly enriched articles for an organization

**Process:**
1. Load organization's intelligence targets (competitors, stakeholders, topics)
2. For each enriched article:
   - Check if any target entities are mentioned in article.entities
   - If match found:
     - Extract relevant information about that target
     - Calculate relevance score for target
     - Store in `target_intelligence` table
3. Update `target_activity_metrics` for each target

**Output:** `target_intelligence` records (one per target per article)

**Schema:** Already defined in `20251119_intelligence_repository.sql`

**Example:**
```javascript
// Article: "BHP announces partnership with Tesla for battery metals"
// Organization: KARV (commodities trading)
// Intelligence Targets: ["BHP", "Rio Tinto", "Glencore"]

// Result: Creates target_intelligence record:
{
  organization_id: "karv-uuid",
  target_id: "bhp-target-uuid",
  target_name: "BHP",
  target_type: "competitor",
  article_id: "enriched-article-uuid",
  article_title: "BHP announces partnership with Tesla...",
  sentiment: "positive",
  category: "partnership",
  relevance_score: 95,
  key_entities: ["Tesla", "battery metals"],
  key_topics: ["electric vehicles", "sustainability"],
  extracted_facts: {
    partnership_value: "$500M",
    duration: "5 years",
    announced_date: "2025-11-20"
  }
}
```

### Stage 5: Pattern Detection (EXISTING - ENHANCE)
**Existing Function:** `connection-detector`

**Purpose:** Detect relationships and patterns between entities

**Input:** `target_intelligence` records for an organization

**Current Capabilities:**
- Co-occurrence detection (entities appearing together)
- Temporal correlation (entities active at same time)
- Thematic overlap (entities discussed in same contexts)

**Outputs:**
- `entity_connections` - Relationships between targets
- `connection_signals` - Detected patterns worth investigating

**Enhancement Needed:** Integrate with `prediction_signals` table

### Stage 6: Signal Detection & Prediction (NEW - TO BUILD)
**Proposed Function:** `signal-detector-and-predictor`

**Purpose:** Analyze target activity for anomalies and generate predictions

**Input:**
- `target_intelligence` records (recent activity)
- `target_activity_metrics` (baseline data)
- `industry_intelligence_profiles` (what patterns matter)

**Detection Logic:**

**1. Momentum Detection**
```sql
-- Detect targets with activity spike
SELECT
  ti.target_id,
  ti.target_name,
  COUNT(*) as mentions_7d,
  tam.avg_mentions_per_week,
  (COUNT(*) / NULLIF(tam.avg_mentions_per_week, 0)) as momentum_multiplier
FROM target_intelligence ti
JOIN target_activity_metrics tam ON ti.target_id = tam.target_id
WHERE ti.mention_date > NOW() - INTERVAL '7 days'
GROUP BY ti.target_id, ti.target_name, tam.avg_mentions_per_week
HAVING COUNT(*) > tam.avg_mentions_per_week * 3 -- 3x normal activity
```

**2. Sentiment Shift Detection**
```sql
-- Detect dramatic sentiment changes
SELECT
  target_id,
  target_name,
  MODE() WITHIN GROUP (ORDER BY sentiment) as recent_sentiment,
  tam.typical_sentiment
FROM target_intelligence ti
JOIN target_activity_metrics tam USING (target_id)
WHERE mention_date > NOW() - INTERVAL '7 days'
GROUP BY target_id, target_name, tam.typical_sentiment
HAVING MODE() WITHIN GROUP (ORDER BY sentiment) != tam.typical_sentiment
```

**3. Category Clustering**
```sql
-- Detect unusual concentration of event types
SELECT
  target_id,
  target_name,
  category,
  COUNT(*) as category_count
FROM target_intelligence
WHERE mention_date > NOW() - INTERVAL '14 days'
GROUP BY target_id, target_name, category
HAVING COUNT(*) >= 3 -- Same category 3+ times = pattern
```

**Output:** `prediction_signals` records

**Example Prediction Signal:**
```javascript
{
  organization_id: "karv-uuid",
  target_id: "bhp-uuid",
  target_name: "BHP",
  signal_type: "momentum",
  signal_strength: 85, // 0-100
  confidence_score: 78,
  pattern_description: "BHP mentioned 15x in past 7 days vs 2x avg - 7.5x increase",
  baseline_comparison: {
    previous_avg: 2,
    current_count: 15,
    timeframe: "7days"
  },
  supporting_article_ids: [...],
  sentiment_distribution: {positive: 10, negative: 3, neutral: 2},
  sentiment_trend: "improving",
  category_distribution: {partnership: 8, product: 4, regulatory: 3},
  should_predict: true,
  prediction_type: "competitive_threat",
  recommendation: "BHP appears to be ramping up partnerships and product launches. Recommend monitoring for supply chain impacts."
}
```

### Stage 7: Executive Synthesis (EXISTING - ENHANCE)
**Existing Function:** `mcp-executive-synthesis`

**Purpose:** Create executive-friendly intelligence summaries

**Current Input:** Enriched articles with extracted data
**Proposed New Input:**
- Enriched articles
- Target intelligence summaries
- Prediction signals
- Connection signals

**Enhancement:** Structure synthesis around signals:
```javascript
{
  executive_summary: "...",

  // SIGNALS-DRIVEN SECTIONS
  critical_alerts: [
    {
      signal: "BHP momentum spike (85 strength)",
      prediction: "Potential competitive threat",
      recommended_action: "Monitor supply chain impacts",
      urgency: "HIGH",
      timeframe: "7 days"
    }
  ],

  emerging_patterns: [...],

  // TRADITIONAL SECTIONS (enhanced with signal context)
  competitive_landscape: {
    key_developments: [...],
    related_signals: [...] // Link to prediction_signals
  },

  market_trends: {
    trending_topics: [...],
    related_signals: [...] // Link to connection_signals
  }
}
```

**Storage:**
- Store in `intelligence_summaries` table (create if doesn't exist)
- Link to organization + time period
- Include references to signals and enriched articles

### Stage 8: Opportunity Detection (EXISTING - ENHANCE)
**Existing Function:** `mcp-opportunities`

**Purpose:** Generate actionable opportunities from intelligence

**Current Personas:**
- PR Opportunist (Marcus Chen) - Narrative hijacking, crisis response
- Power Player (Victoria Chen) - Stakeholder shifts, partnerships
- Viral Architect (Sarah Kim) - Trending topics, viral campaigns
- Cascade Surfer (Helena Cross) - Weak signals, cascade effects
- Market Mover - Economic indicators, market shifts

**Enhancement:** Feed from prediction signals
```javascript
// Input: prediction_signal (competitive_threat type)
// Output: Opportunity

{
  persona: "cascade_surfer",
  persona_name: "Helena Cross",
  title: "Preempt BHP supply chain shift",
  opportunity_type: "cascade",
  urgency: "HIGH",
  time_window: "7-14 days",

  action_items: [
    {
      step: 1,
      action: "Contact top 5 suppliers mentioned in BHP partnership articles",
      owner: "COO",
      deadline: "2025-11-25",
      success_metric: "At least 2 meetings scheduled"
    },
    {
      step: 2,
      action: "Draft counter-positioning for battery metals market",
      owner: "CMO",
      deadline: "2025-11-27",
      success_metric: "PR campaign ready to launch"
    }
  ],

  source_insights: {
    from_signals: ["bhp-momentum-signal-uuid"],
    from_events: [{type: "partnership", title: "BHP-Tesla deal"}],
    from_entities: ["BHP", "Tesla", "battery metals"]
  },

  expected_impact: {
    revenue: "Protect $15M annual supply contracts",
    competitive_advantage: "3-month head start on competitors",
    risk_mitigation: "Avoid being locked out of key supplier relationships"
  }
}
```

### Stage 9: Connection & Prediction Generation (NEW - TO BUILD)
**Proposed Function:** `generate-predictions-from-signals`

**Purpose:** Convert high-strength prediction signals into formal predictions

**Input:** `prediction_signals` where `should_predict = true`

**Process:**
1. Load signals with strength >= 70
2. For each signal:
   - Analyze historical patterns for this target
   - Consider industry context from `industry_intelligence_profiles`
   - Generate prediction with timeframe and confidence
   - Create action recommendations
3. Store in `predictions` table (create if doesn't exist)

**Output Schema:**
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  -- Prediction details
  prediction_type VARCHAR(100), -- competitive_threat, market_shift, crisis_building, opportunity
  prediction_title TEXT,
  prediction_description TEXT,

  -- Timing
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  timeframe_days INTEGER, -- How far out is prediction
  expires_at TIMESTAMPTZ, -- When this prediction is no longer relevant

  -- Confidence
  confidence_score INTEGER, -- 0-100
  signal_strength INTEGER, -- From source signal

  -- Source signal
  source_signal_id UUID REFERENCES prediction_signals(id),
  source_target_id UUID REFERENCES intelligence_targets(id),
  source_target_name TEXT,

  -- Supporting evidence
  supporting_intelligence UUID[], -- target_intelligence IDs
  supporting_connections UUID[], -- entity_connections IDs

  -- Impact assessment
  potential_impact JSONB, -- {revenue, reputation, competitive, operational}

  -- Recommendations
  recommended_actions JSONB, -- [{action, owner, deadline}]

  -- Status tracking
  status VARCHAR(50) DEFAULT 'active', -- active, confirmed, refuted, expired
  confirmed_at TIMESTAMPTZ,
  confirmation_details TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_org ON predictions(organization_id);
CREATE INDEX idx_predictions_type ON predictions(prediction_type);
CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_predictions_confidence ON predictions(confidence_score DESC);
CREATE INDEX idx_predictions_timeframe ON predictions(timeframe_days ASC);
```

---

## Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 1-2: SOURCE DISCOVERY                  │
│  batch-scraper-v5-orchestrator-rss (60s)                       │
│  batch-scraper-v5-orchestrator-cse (13s)                       │
│  batch-scraper-v5-worker (20s/25 articles)                     │
│  batch-article-tagger (4s/20 articles)                         │
│                                                                 │
│  Output: raw_articles (1000/day, industry-tagged)              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   STAGE 3: ARTICLE ENRICHMENT                   │
│  batch-article-enrichment-v2 (NEW)                             │
│                                                                 │
│  For each organization:                                        │
│  1. Filter raw_articles by industry (20-50 articles)           │
│  2. Extract events, entities, quotes, metrics                  │
│  3. Calculate relevance score                                  │
│  4. Store in enriched_articles                                 │
│                                                                 │
│  Processing: ~2 minutes per org                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              STAGE 4: TARGET INTELLIGENCE POPULATION            │
│  populate-target-intelligence (NEW)                            │
│                                                                 │
│  For each enriched article:                                    │
│  1. Match to intelligence targets                              │
│  2. Extract target-specific information                        │
│  3. Store in target_intelligence                               │
│  4. Update target_activity_metrics                             │
│                                                                 │
│  Output: target_intelligence records                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  STAGE 5-6: PATTERN DETECTION                   │
│  connection-detector (EXISTING)                                │
│  signal-detector-and-predictor (NEW)                           │
│                                                                 │
│  1. Detect entity relationships                                │
│  2. Find momentum spikes                                       │
│  3. Detect sentiment shifts                                    │
│  4. Identify category clustering                               │
│                                                                 │
│  Output: entity_connections, connection_signals,               │
│          prediction_signals                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                STAGE 7-9: INTELLIGENCE GENERATION               │
│  mcp-executive-synthesis (EXISTING, enhanced)                  │
│  mcp-opportunities (EXISTING, enhanced)                        │
│  generate-predictions-from-signals (NEW)                       │
│                                                                 │
│  1. Create executive summary (signal-driven)                   │
│  2. Generate opportunities (persona-based)                     │
│  3. Convert signals to predictions                             │
│                                                                 │
│  Output: intelligence_summaries, opportunities, predictions    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Daily Workflow

### Option A: Sequential (Simple)
```bash
# 1. Scrape & tag articles (15 minutes total)
curl -X POST "$SUPABASE_URL/functions/v1/batch-scraper-v5-orchestrator-rss"
curl -X POST "$SUPABASE_URL/functions/v1/batch-scraper-v5-orchestrator-cse"
/tmp/scrape_loop.sh  # Until queue empty
/tmp/tag_all_articles.sh  # Until all tagged

# 2. Process each organization (2 minutes per org)
for org_id in $(cat org_ids.txt); do
  # Enrich articles for this org
  curl -X POST "$SUPABASE_URL/functions/v1/batch-article-enrichment-v2" \
    -d "{\"organization_id\": \"$org_id\"}"

  # Populate target intelligence
  curl -X POST "$SUPABASE_URL/functions/v1/populate-target-intelligence" \
    -d "{\"organization_id\": \"$org_id\"}"

  # Detect patterns
  curl -X POST "$SUPABASE_URL/functions/v1/connection-detector" \
    -d "{\"organization_id\": \"$org_id\"}"

  curl -X POST "$SUPABASE_URL/functions/v1/signal-detector-and-predictor" \
    -d "{\"organization_id\": \"$org_id\"}"

  # Generate intelligence
  curl -X POST "$SUPABASE_URL/functions/v1/mcp-executive-synthesis" \
    -d "{\"organization_id\": \"$org_id\"}"

  curl -X POST "$SUPABASE_URL/functions/v1/mcp-opportunities" \
    -d "{\"organization_id\": \"$org_id\"}"

  curl -X POST "$SUPABASE_URL/functions/v1/generate-predictions-from-signals" \
    -d "{\"organization_id\": \"$org_id\"}"
done
```

### Option B: Orchestrated (Recommended)
```bash
# 1. Scrape & tag (15 minutes)
curl -X POST "$SUPABASE_URL/functions/v1/batch-scraper-v5-orchestrator-rss"
curl -X POST "$SUPABASE_URL/functions/v1/batch-scraper-v5-orchestrator-cse"
/tmp/scrape_loop.sh
/tmp/tag_all_articles.sh

# 2. Process all orgs with single orchestrator
curl -X POST "$SUPABASE_URL/functions/v1/intelligence-pipeline-orchestrator" \
  -d "{\"run_all_orgs\": true}"
```

**New Function:** `intelligence-pipeline-orchestrator`
- Queries all active organizations
- For each org, runs stages 3-9 in sequence
- Handles errors gracefully (skip failed org, continue with others)
- Returns summary of all orgs processed

---

## Key Design Decisions

### 1. Two-Phase Processing
**Phase 1 (Global):** Scrape all sources once daily
**Phase 2 (Per-Org):** Process articles for each organization separately

**Rationale:**
- Scraping is source-centric (same for all orgs)
- Intelligence is org-centric (different filters, targets, context)
- This avoids re-scraping the same articles 10x for 10 orgs

### 2. Industry Filtering First
**Filter BEFORE enrichment, not after**

**Rationale:**
- Enrichment is expensive (~2-3s per article with LLM)
- Processing 200 irrelevant Tier 1 articles wastes time and money
- Industry tags are cheap (already done by batch-article-tagger)

### 3. Signal-Driven Intelligence
**Predictions and opportunities generated FROM signals, not from raw articles**

**Rationale:**
- Signals represent detected patterns (momentum, shifts, clustering)
- More reliable than one-off article analysis
- Baseline comparison enables anomaly detection
- Industry context shapes what patterns matter

### 4. Incremental Processing
**Only enrich NEW articles, not all articles every day**

**Strategy:**
```sql
-- Get articles not yet enriched for this org
SELECT ra.*
FROM raw_articles ra
LEFT JOIN enriched_articles ea
  ON ra.id = ea.raw_article_id
  AND ea.organization_id = 'org-uuid'
WHERE ra.created_at > NOW() - INTERVAL '7 days'
  AND ea.id IS NULL  -- Not yet enriched for this org
  AND (
    -- Industry match logic
    ra.raw_metadata->'industries' ? 'technology'
    OR EXISTS (
      SELECT 1 FROM source_registry sr
      WHERE sr.id = ra.source_id
        AND sr.industries @> ARRAY['technology']::text[]
    )
  )
LIMIT 50;
```

---

## Performance Estimates

### Daily Processing (10 organizations)

**Phase 1: Scraping (same for all orgs)**
- RSS discovery: 60s
- CSE discovery: 13s
- Worker (1000 articles): 13 minutes
- Tagging (1000 articles): 4 minutes
- **Total: ~18 minutes**

**Phase 2: Per-Org Intelligence (x10 orgs)**
- Article enrichment (50 articles): 2 minutes
- Target population: 30s
- Pattern detection: 20s
- Signal detection: 15s
- Synthesis: 45s
- Opportunities: 30s
- Predictions: 20s
- **Per org: ~5 minutes**
- **Total for 10 orgs: 50 minutes**

**Grand Total: ~68 minutes (1 hour 8 minutes)**

### Cost Estimates (per org per day)

**LLM Costs:**
- Article enrichment: 50 articles × $0.01 = $0.50
- Signal detection: $0.05
- Synthesis: $0.10
- Opportunities: $0.10
- **Total per org: ~$0.75/day = $22.50/month**

**For 10 orgs: $225/month in LLM costs**

---

## Database Storage Estimates

### Per Organization Per Week

**enriched_articles:**
- Articles per week: ~350 (50/day × 7)
- Size per article: ~5KB (with JSONB)
- Total: ~1.75MB/org/week

**target_intelligence:**
- Assume 50% of articles mention targets
- Average 2 targets per article
- Records per week: 350 articles × 0.5 × 2 = 350
- Size per record: ~3KB
- Total: ~1MB/org/week

**prediction_signals:**
- Assume 5-10 signals per week
- Size per signal: ~2KB
- Total: ~20KB/org/week

**predictions:**
- Assume 2-3 predictions per week
- Size per prediction: ~3KB
- Total: ~9KB/org/week

**Grand Total: ~3MB per org per week**
**For 10 orgs: 30MB/week = 1.5GB/year**

---

## Functions to Build

### Priority 1 (Required for MVP)
1. ✅ `batch-article-tagger` - DONE
2. 🔨 `batch-article-enrichment-v2` - Extract structured intelligence
3. 🔨 `populate-target-intelligence` - Match articles to targets
4. 🔨 `signal-detector-and-predictor` - Detect patterns and anomalies
5. 🔨 `intelligence-pipeline-orchestrator` - Coordinate all stages

### Priority 2 (Enhancements)
6. 🔄 `mcp-executive-synthesis` - Enhance with signal integration
7. 🔄 `mcp-opportunities` - Enhance with signal feeds
8. 🔨 `generate-predictions-from-signals` - Convert signals to predictions

### Priority 3 (Nice to Have)
9. 🔨 `prediction-tracker` - Track prediction outcomes over time
10. 🔨 `signal-feedback-loop` - Learn from confirmed/refuted predictions

---

## Next Steps

1. **Create enriched_articles table migration**
2. **Create predictions table migration**
3. **Build batch-article-enrichment-v2**
4. **Build populate-target-intelligence**
5. **Build signal-detector-and-predictor**
6. **Build intelligence-pipeline-orchestrator**
7. **Test end-to-end with one org**
8. **Scale to multiple orgs**

Legend:
- ✅ Complete
- 🔨 To build
- 🔄 To enhance
