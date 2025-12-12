# Intelligence Learning System - Design Document

## Executive Summary

NIV is uniquely positioned as a PR platform tracking multiple organizations across different industries. This creates an opportunity to build a **learning intelligence system** that gets smarter over time by validating predictions, detecting cross-organization patterns, and modeling how signals cascade across entities and industries.

**Core Insight:** Most intelligence platforms see one company's slice. NIV sees the whole graph.

---

## The Unique Position

```
MOST INTELLIGENCE PLATFORMS:
One company → tracks their competitors → sees their slice

SIGNALDESK:
Many companies → track their ecosystems → see the WHOLE GRAPH
├── Tennr tracks healthcare AI competitors
├── VaynerMedia tracks media/advertising shifts
├── Mitsui tracks commodities supply chains
└── Each provides a different lens on the same global news
```

### What We Can See That Others Can't

1. **Signal Amplification**: When the same entity appears across multiple orgs' targets
2. **Industry Cascade Patterns**: Tech news → Media coverage → Stock movement
3. **Cross-Sector Leading Indicators**: Commodities → Shipping → Retail
4. **Prediction Validation**: Which sources/signals actually predicted outcomes

---

## Current State (Gap Analysis)

### What We Have

- `raw_articles` - Thousands of articles from 50+ sources
- `target_article_matches` - Links between articles and intelligence targets
- `target_intelligence_facts` - Extracted facts with types, sentiment, entities, relationships
- `intelligence_targets` - Targets with `accumulated_context` dossiers
- `signals` - Pattern and connection signals
- Multiple organizations tracking different industries

### What's Missing

1. **Feedback Loops** - No way to know if a pattern/prediction was correct
2. **Outcome Tracking** - Did the detected "expansion" actually happen?
3. **Cross-Organization Patterns** - Company A's news often precedes Company B's action
4. **Temporal Learning** - How long between signal and outcome?
5. **Industry Cascade Modeling** - When X happens in industry A, what happens in industry B?

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTELLIGENCE LEARNING SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1: SIGNAL GENERATION (exists)                                         │
│  ══════════════════════════════════                                          │
│  Articles → Facts → Patterns → Signals                                       │
│                                                                              │
│  LAYER 2: OUTCOME TRACKING (needs building)                                  │
│  ════════════════════════════════════════                                    │
│  Signals → Predicted Outcome → Actual Outcome → Accuracy Score               │
│                                                                              │
│  LAYER 3: PATTERN LEARNING (needs building)                                  │
│  ═════════════════════════════════════════                                   │
│  Validated patterns → Feature extraction → Model training                    │
│                                                                              │
│  LAYER 4: CASCADE INTELLIGENCE (the goal)                                    │
│  ══════════════════════════════════════════                                  │
│  Cross-entity patterns → Industry propagation models → Early warning         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. Signal Outcomes (Prediction Validation)

```sql
CREATE TABLE signal_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- What we predicted
  predicted_outcome TEXT NOT NULL,        -- "Glencore will announce Chile expansion"
  predicted_timeframe INTERVAL,           -- "30 days"
  predicted_confidence FLOAT,             -- 0-1
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  prediction_expires_at TIMESTAMPTZ,      -- When to stop looking

  -- What actually happened
  actual_outcome TEXT,                    -- "Glencore announced $2B Chile investment"
  outcome_detected_at TIMESTAMPTZ,
  outcome_article_ids UUID[],             -- Evidence articles
  outcome_evidence TEXT,                  -- Summary of evidence

  -- Validation
  outcome_match FLOAT,                    -- 0-1 how close was prediction
  validated_by TEXT,                      -- 'auto' | 'user' | 'claude'
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,

  -- Learning features (extracted after validation)
  signal_to_outcome_days INT,             -- Days between signal and outcome
  was_accurate BOOLEAN,                   -- Did prediction come true?
  false_positive BOOLEAN,                 -- Signal was noise
  missed_opportunity BOOLEAN,             -- Outcome happened but we didn't signal

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_signal_outcomes_signal ON signal_outcomes(signal_id);
CREATE INDEX idx_signal_outcomes_org ON signal_outcomes(organization_id);
CREATE INDEX idx_signal_outcomes_pending ON signal_outcomes(prediction_expires_at)
  WHERE validated_at IS NULL;
CREATE INDEX idx_signal_outcomes_accurate ON signal_outcomes(was_accurate)
  WHERE was_accurate IS NOT NULL;
```

### 2. Entity Signal Amplification (Cross-Org Detection)

```sql
CREATE TABLE entity_signal_amplification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The entity being amplified
  entity_name TEXT NOT NULL,
  entity_type TEXT,                       -- company, person, regulator, etc.

  -- Amplification metrics
  signal_count INT DEFAULT 0,             -- Total signals mentioning this entity
  organization_count INT DEFAULT 0,       -- Across how many organizations
  target_count INT DEFAULT 0,             -- Across how many targets

  -- Temporal tracking
  first_signal_at TIMESTAMPTZ,
  latest_signal_at TIMESTAMPTZ,
  signals_last_24h INT DEFAULT 0,
  signals_last_7d INT DEFAULT 0,

  -- Scoring
  avg_signal_strength FLOAT,
  amplification_score FLOAT,              -- Computed: higher = more orgs seeing same thing
  velocity_score FLOAT,                   -- How fast signals are accumulating

  -- Context
  industries TEXT[],                      -- Which industries are seeing this
  signal_types TEXT[],                    -- What types of signals (expansion, crisis, etc.)

  -- The insight
  insight_summary TEXT,                   -- "4 orgs tracking different industries all see OpenAI activity"

  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entity_name)
);

-- Refresh this table periodically
CREATE INDEX idx_amplification_score ON entity_signal_amplification(amplification_score DESC);
CREATE INDEX idx_amplification_recent ON entity_signal_amplification(latest_signal_at DESC);
```

### 3. Cascade Patterns (Learned Sequences)

```sql
CREATE TABLE cascade_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  pattern_name TEXT NOT NULL,             -- "Regulatory Investigation Cascade"
  pattern_description TEXT,

  -- Trigger definition
  trigger_signal_type TEXT NOT NULL,      -- What starts the cascade
  trigger_entity_types TEXT[],            -- competitor, regulator, etc.
  trigger_industries TEXT[],              -- Which industries this applies to
  trigger_keywords TEXT[],                -- Keywords that identify this trigger

  -- Expected cascade sequence
  cascade_steps JSONB NOT NULL,           -- Array of {entity_type, expected_delay_days, expected_action}
  /*
    Example:
    [
      {"step": 1, "entity_type": "target_company", "delay_days": 0, "action": "investigation_announced"},
      {"step": 2, "entity_type": "stock", "delay_days": 1, "action": "price_drop"},
      {"step": 3, "entity_type": "competitor", "delay_days": 7, "action": "market_position_statement"},
      {"step": 4, "entity_type": "regulator", "delay_days": 30, "action": "industry_wide_review"}
    ]
  */

  -- Learned metrics
  times_observed INT DEFAULT 0,
  times_predicted INT DEFAULT 0,
  times_accurate INT DEFAULT 0,
  accuracy_rate FLOAT,                    -- times_accurate / times_predicted
  avg_cascade_duration_days FLOAT,
  confidence FLOAT,                       -- Overall confidence in this pattern

  -- Example instances (for reference/training)
  example_instances JSONB,                -- Array of {signal_ids, outcome_ids, dates}

  -- Metadata
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_observed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_cascade_trigger ON cascade_patterns(trigger_signal_type);
CREATE INDEX idx_cascade_confidence ON cascade_patterns(confidence DESC) WHERE is_active = true;
```

### 4. Signal Accuracy Metrics (Per-Target Learning)

```sql
CREATE TABLE signal_accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What we're measuring
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  signal_type TEXT,                       -- pattern type or 'all'

  -- Accuracy metrics
  total_predictions INT DEFAULT 0,
  accurate_predictions INT DEFAULT 0,
  false_positives INT DEFAULT 0,
  missed_outcomes INT DEFAULT 0,
  accuracy_rate FLOAT,

  -- Timing metrics
  avg_lead_time_days FLOAT,               -- How far in advance we predict
  median_lead_time_days FLOAT,

  -- Confidence calibration
  avg_predicted_confidence FLOAT,
  actual_accuracy_at_confidence JSONB,    -- {0.5: 0.45, 0.7: 0.68, 0.9: 0.82}

  -- Trend
  accuracy_trend TEXT,                    -- improving, declining, stable
  accuracy_last_30d FLOAT,
  accuracy_last_90d FLOAT,

  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(target_id, signal_type)
);
```

### 5. Cross-Organization Patterns

```sql
CREATE TABLE cross_org_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  pattern_name TEXT NOT NULL,
  pattern_type TEXT,                      -- 'leading_indicator', 'correlated', 'inverse'

  -- The relationship
  source_industry TEXT,                   -- Industry where signal originates
  source_entity_type TEXT,
  target_industry TEXT,                   -- Industry that responds
  target_entity_type TEXT,

  -- Timing
  typical_lag_days INT,                   -- How long between source and target
  lag_std_dev FLOAT,

  -- Strength
  correlation_strength FLOAT,             -- -1 to 1
  times_observed INT,
  confidence FLOAT,

  -- Description
  description TEXT,                       -- "Commodity price spikes precede shipping cost increases by 14 days"

  -- Evidence
  example_instances JSONB,

  -- Metadata
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_validated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);
```

---

## Edge Functions

### 1. `generate-outcome-predictions`

**Purpose:** After signals are created, generate specific, verifiable predictions.

**Schedule:** Daily, after pattern analysis completes.

```typescript
// Pseudocode
async function generateOutcomePredictions() {
  const recentSignals = await getSignalsLast24Hours();

  for (const signal of recentSignals) {
    // Skip if already has prediction
    if (await hasOutcomePrediction(signal.id)) continue;

    const prediction = await claude.analyze({
      prompt: `Given this intelligence signal about ${signal.target_name}:

        Signal Type: ${signal.signal_type}
        Title: ${signal.title}
        Description: ${signal.description}
        Evidence: ${signal.evidence}

        Generate a specific, verifiable prediction:
        1. What specific outcome should we watch for?
        2. In what timeframe (days)?
        3. What evidence would confirm this?
        4. What evidence would refute this?
        5. Confidence level (0-1)?

        Be specific and measurable. "Company will announce X" not "Company might do something."`,
    });

    await saveOutcomePrediction({
      signal_id: signal.id,
      predicted_outcome: prediction.outcome,
      predicted_timeframe: `${prediction.days} days`,
      predicted_confidence: prediction.confidence,
      prediction_expires_at: addDays(now(), prediction.days * 1.5),
    });
  }
}
```

### 2. `validate-outcome-predictions`

**Purpose:** Check if past predictions came true by searching recent articles.

**Schedule:** Daily.

```typescript
async function validateOutcomePredictions() {
  // Get predictions that are due for validation
  const pendingPredictions = await getPredictionsInWindow();

  for (const prediction of pendingPredictions) {
    // Search recent articles for evidence of outcome
    const searchResults = await searchArticlesForOutcome({
      query: prediction.predicted_outcome,
      target_id: prediction.target_id,
      since: prediction.predicted_at,
      until: prediction.prediction_expires_at,
    });

    if (searchResults.length > 0) {
      // Use Claude to evaluate if outcome matches prediction
      const evaluation = await claude.evaluate({
        prompt: `Prediction: "${prediction.predicted_outcome}"

          Potential evidence found:
          ${searchResults
            .map((a) => `- ${a.title}: ${a.description}`)
            .join("\n")}

          Questions:
          1. Did the predicted outcome occur? (yes/no/partial)
          2. How closely does the evidence match? (0-1)
          3. Summary of what actually happened
          4. Was this a true positive, false positive, or inconclusive?`,
      });

      await updatePrediction(prediction.id, {
        actual_outcome: evaluation.summary,
        outcome_match: evaluation.match_score,
        outcome_article_ids: searchResults.map((a) => a.id),
        was_accurate: evaluation.match_score >= 0.7,
        validated_by: "auto",
        validated_at: now(),
        signal_to_outcome_days: daysBetween(
          prediction.predicted_at,
          searchResults[0].published_at
        ),
      });
    } else if (isPastExpiration(prediction)) {
      // Prediction window closed with no evidence
      await updatePrediction(prediction.id, {
        was_accurate: false,
        false_positive: true,
        validated_by: "auto",
        validated_at: now(),
        validation_notes: "No evidence found within prediction window",
      });
    }
  }
}
```

### 3. `compute-entity-amplification`

**Purpose:** Find entities appearing across multiple organizations' signals.

**Schedule:** Every 6 hours.

```typescript
async function computeEntityAmplification() {
  // Get all entities mentioned in recent signals across all orgs
  const entityMentions = await sql`
    SELECT
      unnest(s.entities_mentioned) as entity_name,
      s.organization_id,
      s.signal_type,
      s.created_at,
      o.industry
    FROM signals s
    JOIN organizations o ON s.organization_id = o.id
    WHERE s.created_at > NOW() - INTERVAL '30 days'
  `;

  // Group by entity
  const entityStats = groupBy(entityMentions, "entity_name");

  for (const [entity, mentions] of Object.entries(entityStats)) {
    const orgCount = new Set(mentions.map((m) => m.organization_id)).size;
    const industries = [...new Set(mentions.map((m) => m.industry))];

    // Calculate amplification score
    // Higher score = more orgs seeing same thing = more significant
    const amplificationScore = calculateAmplification({
      orgCount,
      totalMentions: mentions.length,
      recency: avgRecency(mentions),
      velocity: mentionVelocity(mentions),
    });

    await upsertAmplification({
      entity_name: entity,
      signal_count: mentions.length,
      organization_count: orgCount,
      industries,
      amplification_score: amplificationScore,
      insight_summary:
        orgCount >= 3
          ? `${orgCount} organizations across ${industries.join(
              ", "
            )} are tracking ${entity} activity`
          : null,
    });
  }
}
```

### 4. `detect-cascade-patterns`

**Purpose:** Learn temporal sequences from validated outcomes.

**Schedule:** Weekly.

```typescript
async function detectCascadePatterns() {
  // Get validated outcomes with timing data
  const validatedOutcomes = await getValidatedOutcomesLast90Days();

  // Find sequences: Entity A signal → Entity A outcome → Entity B signal → Entity B outcome
  const sequences = findTemporalSequences(validatedOutcomes, {
    maxGapDays: 60,
    minOccurrences: 3,
  });

  // Cluster into patterns
  for (const sequence of sequences) {
    const existingPattern = await findSimilarPattern(sequence);

    if (existingPattern) {
      // Update existing pattern with new observation
      await updatePattern(existingPattern.id, {
        times_observed: existingPattern.times_observed + 1,
        example_instances: [
          ...existingPattern.example_instances,
          sequence.instance,
        ],
        avg_cascade_duration_days: recalculateAvg(existingPattern, sequence),
        confidence: recalculateConfidence(existingPattern),
      });
    } else if (sequence.occurrences >= 3) {
      // Create new pattern
      await createPattern({
        pattern_name: generatePatternName(sequence),
        trigger_signal_type: sequence.trigger.type,
        cascade_steps: sequence.steps,
        times_observed: sequence.occurrences,
        confidence: calculateInitialConfidence(sequence),
      });
    }
  }
}
```

---

## UI Components

### 1. Amplification Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CROSS-ORG SIGNAL AMPLIFICATION                                    [Today] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔥 HIGH AMPLIFICATION (3+ orgs seeing same entity)                         │
│  ───────────────────────────────────────────────────                         │
│  • "OpenAI" - Mentioned in 4 orgs' signals (Tennr, VaynerMedia, +2)         │
│    First signal: 6 hours ago | Pattern: "Product Launch → Industry Shift"   │
│    [View Signals] [Track Cascade]                                            │
│                                                                              │
│  • "FTC" - Mentioned in 3 orgs' signals                                     │
│    Industries: Healthcare AI, Media, Commodities                             │
│    Signal types: regulatory, legal_regulatory                                │
│    [View Signals] [Track Cascade]                                            │
│                                                                              │
│  📈 EMERGING (2 orgs, velocity increasing)                                  │
│  ─────────────────────────────────────────                                  │
│  • "Anthropic" - 2 orgs, 5 signals in last 24h (was 1/day avg)              │
│  • "EU AI Act" - 2 orgs, regulatory signals clustering                       │
│                                                                              │
│  ⚡ CASCADE ALERTS (Active pattern matches)                                 │
│  ──────────────────────────────────────────                                  │
│  • Glencore expansion signal (3 days ago)                                    │
│    Pattern: "Competitor Expansion → Partner Response"                        │
│    Expected: Trafigura or Codelco statement in 4-7 days                     │
│    Confidence: 73% (based on 8 past occurrences)                            │
│    [Set Alert] [View Pattern]                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Prediction Accuracy Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SIGNAL ACCURACY METRICS                                      [Last 90 Days]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  OVERALL ACCURACY                                                            │
│  ────────────────                                                            │
│  Total Predictions: 147  |  Accurate: 89  |  Rate: 60.5%                    │
│                                                                              │
│  ████████████████████░░░░░░░░░░ 60.5%                                       │
│                                                                              │
│  BY SIGNAL TYPE                           BY TARGET TYPE                     │
│  ─────────────────                        ───────────────                    │
│  expansion:     72% (18/25)               competitors:  65%                  │
│  partnership:   68% (15/22)               stakeholders: 58%                  │
│  acquisition:   45% (9/20)                topics:       62%                  │
│  leadership:    55% (11/20)               partners:     71%                  │
│                                                                              │
│  PREDICTION TIMING                                                           │
│  ─────────────────                                                           │
│  Avg lead time: 12.3 days                                                    │
│  Median lead time: 8 days                                                    │
│  Range: 1-45 days                                                            │
│                                                                              │
│  CONFIDENCE CALIBRATION                                                      │
│  ──────────────────────                                                      │
│  When we predicted 90% confidence → Actually right 82%                       │
│  When we predicted 70% confidence → Actually right 68%                       │
│  When we predicted 50% confidence → Actually right 45%                       │
│  (Well calibrated: predicted confidence ≈ actual accuracy)                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Cascade Pattern Library

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CASCADE PATTERN LIBRARY                                    [12 Patterns]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🏆 HIGH CONFIDENCE (>70%)                                                  │
│  ─────────────────────────                                                  │
│  1. "Regulatory Investigation Cascade"                     85% confidence    │
│     Trigger: legal_regulatory signal on company                              │
│     Sequence: Investigation → Stock drop (1d) → Competitor statement (7d)    │
│              → Industry review (30d)                                         │
│     Observed: 12 times | Avg duration: 35 days                              │
│     [View Examples] [Set Alert]                                              │
│                                                                              │
│  2. "Executive Departure Ripple"                           78% confidence    │
│     Trigger: leadership_change signal (departure)                            │
│     Sequence: Departure → Analyst coverage (2d) → Competitor recruiting (14d)│
│     Observed: 8 times | Avg duration: 18 days                               │
│     [View Examples] [Set Alert]                                              │
│                                                                              │
│  📊 EMERGING PATTERNS (3-5 observations)                                    │
│  ────────────────────────────────────────                                   │
│  3. "Commodity Price → Shipping Cost"                      62% confidence    │
│  4. "AI Announcement → Media Cycle"                        58% confidence    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Start collecting training data

- [ ] Create `signal_outcomes` table
- [ ] Build `generate-outcome-predictions` function
- [ ] Add prediction display to Signals UI
- [ ] Manual validation buttons ("Came True" / "Didn't Happen")

### Phase 2: Auto-Validation (Week 3-4)

**Goal:** Close the feedback loop automatically

- [ ] Build `validate-outcome-predictions` function
- [ ] Semantic search for outcome evidence
- [ ] Claude evaluation of prediction vs outcome
- [ ] Accuracy metrics computation

### Phase 3: Cross-Org Intelligence (Week 5-6)

**Goal:** See what multiple organizations see

- [ ] Create `entity_signal_amplification` table
- [ ] Build `compute-entity-amplification` function
- [ ] Amplification Dashboard UI
- [ ] Alert system for high-amplification entities

### Phase 4: Cascade Detection (Week 7-8)

**Goal:** Learn temporal sequences

- [ ] Create `cascade_patterns` table
- [ ] Build `detect-cascade-patterns` function
- [ ] Pattern Library UI
- [ ] Cascade alerts ("Based on pattern X, expect Y in Z days")

### Phase 5: Confidence Calibration (Week 9-10)

**Goal:** Weight signals by past accuracy

- [ ] Per-target accuracy tracking
- [ ] Per-signal-type accuracy tracking
- [ ] Confidence calibration curves
- [ ] Adjusted signal scoring based on historical accuracy

### Phase 6: Advanced Learning (Future)

**Goal:** True ML-based pattern recognition

- [ ] Feature extraction from validated outcomes
- [ ] Embeddings for pattern similarity
- [ ] Anomaly detection (unusual patterns)
- [ ] Time-series forecasting

---

## Success Metrics

| Metric                 | Target       | How to Measure                          |
| ---------------------- | ------------ | --------------------------------------- |
| Prediction accuracy    | >65%         | Validated outcomes / Total predictions  |
| Lead time              | >7 days avg  | Days between signal and outcome         |
| Confidence calibration | <10% error   | Predicted confidence vs actual accuracy |
| Pattern detection      | 10+ patterns | Cascade patterns with >70% confidence   |
| Cross-org detection    | 5+ weekly    | High-amplification entities detected    |
| User validation        | >50%         | Predictions with user validation        |

---

## The Long-Term Vision

```
TODAY:
"Glencore mentioned expansion in Chile" (single fact)

WITH LEARNING SYSTEM:
"Glencore Chile expansion signal detected.

  HISTORICAL CONTEXT:
  - Similar signals from Glencore preceded actual deals 73% of the time
  - Average lead time: 45 days
  - Your competitor target (Mitsui) responded to last 2 Glencore expansions

  CASCADE PREDICTION:
  Based on 'Commodity Expansion Cascade' pattern (85% confidence):
  - Day 7-14: Expect Codelco partnership announcement
  - Day 14-21: Expect competitor (Trafigura/Mitsui) response
  - Day 30-45: Expect deal closure or expansion details

  CROSS-ORG SIGNAL:
  2 other organizations are also tracking Glencore activity this week.
  Amplification score: HIGH

  RECOMMENDED ACTIONS:
  1. Set alert for Codelco news
  2. Monitor Mitsui investor communications
  3. Review Chile regulatory filings"
```

---

## Open Questions

1. **Privacy Boundaries**: Should cross-org patterns be visible to individual orgs?
2. **Data Retention**: How long to keep outcome data for training?
3. **Pattern Ownership**: If Org A's signals contribute to a pattern, who benefits?
4. **Accuracy Thresholds**: At what accuracy do we trust automated predictions?
5. **Human-in-Loop**: Which validations require human review?

---

## Files to Create

```
NEW FILES:
├── supabase/migrations/
│   └── 20251212_intelligence_learning_system.sql
├── supabase/functions/
│   ├── generate-outcome-predictions/index.ts
│   ├── validate-outcome-predictions/index.ts
│   ├── compute-entity-amplification/index.ts
│   └── detect-cascade-patterns/index.ts
├── src/components/intelligence/
│   ├── AmplificationDashboard.tsx
│   ├── PredictionAccuracyDashboard.tsx
│   └── CascadePatternLibrary.tsx
└── INTELLIGENCE_LEARNING_SYSTEM_DESIGN.md (this file)
```
