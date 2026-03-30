# Target Intelligence System - Design Document

## Executive Summary

A redesigned intelligence system that accumulates knowledge about tracked targets (competitors, stakeholders, partners) over time, enabling detection of real patterns, movement, and connections rather than one-shot analysis of daily news.

**Core Philosophy:** Build a "dossier" for each target. Every article match adds to the dossier. AI analyzes the accumulated intelligence to find meaningful patterns.

---

## Current State (Problems)

### What Exists
- `intelligence_targets` table with `accumulated_context` and `baseline_metrics` (unused)
- `target_article_matches` linking articles to targets via embedding similarity
- `connection-detector` and `pattern-detector` doing one-shot Claude analysis

### Why It's "Half-Baked"
1. **No Memory**: Each analysis starts fresh with today's articles
2. **No Accumulation**: `accumulated_context` field exists but is never populated
3. **No Real Patterns**: Can't detect trends without historical data
4. **No Real Connections**: Finds connections in single articles, not emerging relationships
5. **Inefficient**: Sends raw articles to Claude instead of leveraging embeddings

---

## Proposed Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TARGET INTELLIGENCE SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1: SIGNAL MATCHING (existing)                                         │
│  ═══════════════════════════════════                                         │
│  batch-embed-articles → batch-match-signals → target_article_matches         │
│                                                                              │
│  LAYER 2: FACT EXTRACTION (new)                                              │
│  ═══════════════════════════════                                             │
│  target_article_matches → extract-target-facts → target_intelligence_facts   │
│                                     ↓                                        │
│                         Update accumulated_context                           │
│                                                                              │
│  LAYER 3: PATTERN ANALYSIS (redesigned)                                      │
│  ══════════════════════════════════════                                      │
│  accumulated_context → analyze-target-patterns → signals (predictive)        │
│                                                                              │
│  LAYER 4: CONNECTION DETECTION (redesigned)                                  │
│  ══════════════════════════════════════════                                  │
│  Cross-target accumulated_context → detect-connections → signals (connection)│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. New Table: `target_intelligence_facts`

Stores individual facts extracted from articles for each target.

```sql
CREATE TABLE target_intelligence_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES raw_articles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES target_article_matches(id) ON DELETE SET NULL,

  -- Fact details
  fact_type TEXT NOT NULL,              -- See fact_type enum below
  fact_summary TEXT NOT NULL,           -- "Glencore announced expansion into Chilean copper"
  fact_details JSONB,                   -- Structured data specific to fact_type

  -- Entities and relationships
  entities_mentioned TEXT[],            -- ["Chile", "Codelco", "Copper mining"]
  relationships_detected JSONB,         -- [{entity: "Codelco", type: "partner", confidence: 0.8}]

  -- Sentiment and scoring
  sentiment_score FLOAT,                -- -1.0 (negative) to 1.0 (positive)
  confidence_score FLOAT NOT NULL,      -- 0-1, how confident in extraction
  significance_score FLOAT,             -- 0-100, how important is this fact

  -- Context
  geographic_region TEXT,               -- "Latin America", "Asia Pacific", etc.
  industry_sector TEXT,                 -- "Mining", "Energy", "Finance", etc.

  -- Source tracking
  article_title TEXT,
  article_source TEXT,
  article_published_at TIMESTAMPTZ,

  -- Metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  extraction_model TEXT,                -- "claude-sonnet-4", etc.

  -- Prevent duplicate facts from same article
  UNIQUE(target_id, article_id)
);

-- Indexes
CREATE INDEX idx_tif_target_time ON target_intelligence_facts(target_id, extracted_at DESC);
CREATE INDEX idx_tif_org_time ON target_intelligence_facts(organization_id, extracted_at DESC);
CREATE INDEX idx_tif_fact_type ON target_intelligence_facts(target_id, fact_type);
CREATE INDEX idx_tif_entities ON target_intelligence_facts USING gin(entities_mentioned);
```

### Fact Types Enum

```sql
-- fact_type values and what they capture
COMMENT ON TABLE target_intelligence_facts IS '
Fact types:
- expansion: Geographic or market expansion
- contraction: Market exit, downsizing, facility closure
- partnership: New or strengthened partnership/alliance
- acquisition: M&A activity (acquiring or being acquired)
- product_launch: New product, service, or offering
- leadership_change: Executive moves, board changes
- financial: Earnings, funding, financial performance
- legal_regulatory: Lawsuits, regulatory actions, compliance
- crisis: Negative events, scandals, PR issues
- strategy: Strategic announcements, pivots, restructuring
- hiring: Significant hiring, talent moves
- technology: Tech investments, digital transformation
- market_position: Market share changes, competitive moves
';
```

### 2. Update: `intelligence_targets.accumulated_context`

Define a structured schema for the accumulated_context JSONB field:

```typescript
interface AccumulatedContext {
  // Activity metrics
  total_facts: number;
  facts_last_7d: number;
  facts_last_30d: number;
  last_fact_at: string;  // ISO timestamp

  // Activity timeline (rolling 90 days, aggregated by week)
  activity_timeline: {
    period: string;      // "2024-W48"
    fact_count: number;
    avg_sentiment: number;
    dominant_type: string;
  }[];

  // Fact type distribution
  fact_type_distribution: {
    [key: string]: number;  // e.g., {"expansion": 5, "partnership": 3}
  };

  // Sentiment tracking
  sentiment: {
    current: number;          // Recent average (-1 to 1)
    trend: 'improving' | 'declining' | 'stable';
    history: {period: string; score: number}[];
  };

  // Geographic activity
  geographic_activity: {
    [region: string]: {
      fact_count: number;
      recent_facts: number;  // Last 30 days
      dominant_type: string;
    };
  };

  // Relationship map (entities this target is connected to)
  relationship_map: {
    [entity: string]: {
      relationship_types: string[];   // ["partner", "competitor", "supplier"]
      mention_count: number;
      last_mentioned: string;
      sentiment_avg: number;
    };
  };

  // Topic clusters (from extracted facts)
  topic_clusters: {
    [topic: string]: number;  // e.g., {"copper mining": 8, "sustainability": 3}
  };

  // Key recent facts (last 5 significant)
  recent_highlights: {
    date: string;
    summary: string;
    type: string;
    significance: number;
  }[];

  // Computed insights
  insights: {
    primary_activity: string;      // "Geographic expansion"
    activity_level: 'high' | 'medium' | 'low';
    notable_shift: string | null;  // "Increased Asia activity"
    risk_indicators: string[];
  };

  // Last analysis timestamp
  last_analyzed_at: string;
  analysis_version: string;
}
```

### 3. Update: `intelligence_targets.baseline_metrics`

Define what baseline means for comparison:

```typescript
interface BaselineMetrics {
  // Established when target has 30+ facts
  established_at: string;

  // Normal activity levels
  avg_facts_per_week: number;
  avg_sentiment: number;

  // Typical distribution
  typical_fact_types: {[type: string]: number};  // Percentages
  typical_regions: {[region: string]: number};

  // Key relationships at baseline
  established_relationships: string[];

  // Used for anomaly detection
  sentiment_std_dev: number;
  activity_std_dev: number;
}
```

---

## Edge Functions

### 1. `extract-target-facts` (NEW)

**Purpose:** Extract structured facts from matched articles, update accumulated context.

**Trigger:** After `batch-match-signals` completes, or via cron every 30 min.

**Process:**
1. Get recent matches without extracted facts
2. Batch articles by target (efficient Claude usage)
3. Extract facts using Claude
4. Save to `target_intelligence_facts`
5. Update `intelligence_targets.accumulated_context`

```typescript
// supabase/functions/extract-target-facts/index.ts

interface ExtractedFact {
  fact_type: string;
  fact_summary: string;
  entities_mentioned: string[];
  relationships: {entity: string; type: string; confidence: number}[];
  sentiment_score: number;
  confidence_score: number;
  significance_score: number;
  geographic_region?: string;
  industry_sector?: string;
}

async function extractFactsForTarget(
  target: IntelligenceTarget,
  articles: Article[],
  orgContext: string
): Promise<ExtractedFact[]> {

  const prompt = `You are an intelligence analyst building a dossier on "${target.name}" (${target.target_type}).

ORGANIZATION CONTEXT:
${orgContext}

TARGET PROFILE:
Name: ${target.name}
Type: ${target.target_type}
Priority: ${target.priority}
Description: ${target.description || 'N/A'}

ARTICLES TO ANALYZE:
${articles.map((a, i) => `
[${i+1}] "${a.title}" (${a.source_name}, ${a.published_at})
${a.description || a.full_content?.substring(0, 500) || ''}
`).join('\n')}

TASK: Extract intelligence facts about ${target.name} from these articles.

For EACH article that contains relevant information about ${target.name}, extract:
1. fact_type: One of [expansion, contraction, partnership, acquisition, product_launch, leadership_change, financial, legal_regulatory, crisis, strategy, hiring, technology, market_position]
2. fact_summary: One sentence describing what happened (be specific)
3. entities_mentioned: Other companies, people, or places involved
4. relationships: Any relationships revealed (e.g., [{entity: "Company X", type: "partner", confidence: 0.8}])
5. sentiment_score: -1.0 (very negative) to 1.0 (very positive) for ${target.name}
6. confidence_score: 0-1, how confident you are this fact is accurate
7. significance_score: 0-100, how important is this for tracking ${target.name}
8. geographic_region: If applicable (e.g., "Asia Pacific", "Europe", "Latin America")
9. industry_sector: Primary sector (e.g., "Energy", "Mining", "Finance")

RULES:
- Only extract facts that are DIRECTLY about or significantly involve ${target.name}
- If an article doesn't mention or relate to ${target.name}, skip it
- Be specific in summaries - include names, numbers, locations
- Relationships should only include clearly stated connections

Return JSON array:
[
  {
    "article_index": 1,
    "fact_type": "expansion",
    "fact_summary": "Glencore announced plans to invest $2B in Chilean copper operations",
    "entities_mentioned": ["Chile", "Copper"],
    "relationships": [{"entity": "Codelco", "type": "potential_partner", "confidence": 0.6}],
    "sentiment_score": 0.7,
    "confidence_score": 0.9,
    "significance_score": 85,
    "geographic_region": "Latin America",
    "industry_sector": "Mining"
  }
]

Return [] if no articles contain relevant facts about ${target.name}.`;

  const response = await callClaude(prompt);
  return parseFactsResponse(response);
}

async function updateAccumulatedContext(
  targetId: string,
  newFacts: ExtractedFact[]
): Promise<void> {
  // Get current accumulated context
  const { data: target } = await supabase
    .from('intelligence_targets')
    .select('accumulated_context')
    .eq('id', targetId)
    .single();

  const context = target?.accumulated_context || initializeContext();

  // Update metrics
  context.total_facts += newFacts.length;
  context.last_fact_at = new Date().toISOString();

  // Update fact type distribution
  for (const fact of newFacts) {
    context.fact_type_distribution[fact.fact_type] =
      (context.fact_type_distribution[fact.fact_type] || 0) + 1;

    // Update geographic activity
    if (fact.geographic_region) {
      if (!context.geographic_activity[fact.geographic_region]) {
        context.geographic_activity[fact.geographic_region] = {
          fact_count: 0, recent_facts: 0, dominant_type: ''
        };
      }
      context.geographic_activity[fact.geographic_region].fact_count++;
      context.geographic_activity[fact.geographic_region].recent_facts++;
    }

    // Update relationship map
    for (const rel of fact.relationships || []) {
      if (!context.relationship_map[rel.entity]) {
        context.relationship_map[rel.entity] = {
          relationship_types: [],
          mention_count: 0,
          last_mentioned: '',
          sentiment_avg: 0
        };
      }
      const entityMap = context.relationship_map[rel.entity];
      entityMap.mention_count++;
      entityMap.last_mentioned = new Date().toISOString();
      if (!entityMap.relationship_types.includes(rel.type)) {
        entityMap.relationship_types.push(rel.type);
      }
    }

    // Update entities/topics
    for (const entity of fact.entities_mentioned || []) {
      context.topic_clusters[entity] = (context.topic_clusters[entity] || 0) + 1;
    }
  }

  // Update sentiment
  const avgSentiment = newFacts.reduce((sum, f) => sum + f.sentiment_score, 0) / newFacts.length;
  context.sentiment.history.push({
    period: new Date().toISOString().split('T')[0],
    score: avgSentiment
  });
  context.sentiment.current = avgSentiment;

  // Keep only last 90 days of history
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  context.sentiment.history = context.sentiment.history.filter(
    h => new Date(h.period) > cutoff
  );

  // Update recent highlights (keep top 5 by significance)
  const newHighlights = newFacts
    .filter(f => f.significance_score >= 70)
    .map(f => ({
      date: new Date().toISOString(),
      summary: f.fact_summary,
      type: f.fact_type,
      significance: f.significance_score
    }));

  context.recent_highlights = [...newHighlights, ...context.recent_highlights]
    .sort((a, b) => b.significance - a.significance)
    .slice(0, 5);

  // Save updated context
  await supabase
    .from('intelligence_targets')
    .update({
      accumulated_context: context,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetId);
}
```

### 2. `analyze-target-patterns` (REDESIGNED)

**Purpose:** Analyze accumulated intelligence to detect patterns and generate predictions.

**Key Difference:** Instead of analyzing raw articles, analyzes the `accumulated_context`.

```typescript
// supabase/functions/analyze-target-patterns/index.ts

interface PatternAnalysis {
  pattern_type: 'trajectory' | 'anomaly' | 'trend' | 'shift' | 'milestone';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  time_horizon: string;
  business_implication: string;
  recommended_action?: string;
}

async function analyzeTargetPatterns(
  target: IntelligenceTarget,
  orgContext: string
): Promise<PatternAnalysis[]> {

  const ctx = target.accumulated_context;
  const baseline = target.baseline_metrics;

  // Skip targets without enough data
  if (!ctx || ctx.total_facts < 5) {
    return [];
  }

  const prompt = `You are an intelligence analyst reviewing accumulated intelligence on "${target.name}".

ORGANIZATION CONTEXT:
${orgContext}

TARGET: ${target.name} (${target.target_type})
Priority: ${target.priority}

ACCUMULATED INTELLIGENCE SUMMARY:
═══════════════════════════════════

Total Facts Collected: ${ctx.total_facts}
Facts Last 7 Days: ${ctx.facts_last_7d}
Facts Last 30 Days: ${ctx.facts_last_30d}

ACTIVITY BY TYPE:
${Object.entries(ctx.fact_type_distribution || {})
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

SENTIMENT:
- Current: ${ctx.sentiment?.current?.toFixed(2) || 'N/A'} (-1 to 1 scale)
- Trend: ${ctx.sentiment?.trend || 'N/A'}
- Recent history: ${ctx.sentiment?.history?.slice(-5).map(h => `${h.period}: ${h.score.toFixed(2)}`).join(', ') || 'N/A'}

GEOGRAPHIC ACTIVITY:
${Object.entries(ctx.geographic_activity || {})
  .map(([region, data]) => `- ${region}: ${data.fact_count} facts, recent: ${data.recent_facts}`)
  .join('\n') || 'None tracked'}

KEY RELATIONSHIPS:
${Object.entries(ctx.relationship_map || {})
  .sort((a, b) => b[1].mention_count - a[1].mention_count)
  .slice(0, 10)
  .map(([entity, data]) => `- ${entity}: ${data.mention_count} mentions, types: ${data.relationship_types.join(', ')}`)
  .join('\n') || 'None detected'}

RECENT SIGNIFICANT EVENTS:
${ctx.recent_highlights?.map(h => `- [${h.date.split('T')[0]}] ${h.summary} (${h.type})`).join('\n') || 'None'}

${baseline ? `
BASELINE COMPARISON (established ${baseline.established_at}):
- Normal activity: ${baseline.avg_facts_per_week} facts/week
- Normal sentiment: ${baseline.avg_sentiment}
- Current vs baseline: ${ctx.facts_last_7d > baseline.avg_facts_per_week * 1.5 ? 'ELEVATED ACTIVITY' : ctx.facts_last_7d < baseline.avg_facts_per_week * 0.5 ? 'REDUCED ACTIVITY' : 'Normal'}
` : 'No baseline established yet (need 30+ facts)'}

TASK: Identify meaningful patterns in this intelligence.

Look for:
1. TRAJECTORY: Is the target expanding, contracting, pivoting?
2. ANOMALIES: Unusual activity compared to baseline or recent patterns
3. TRENDS: Consistent direction over time (sentiment, geography, activity type)
4. SHIFTS: Recent changes from historical patterns
5. MILESTONES: Significant events that mark a change

Return 1-4 pattern analyses as JSON:
[
  {
    "pattern_type": "trajectory|anomaly|trend|shift|milestone",
    "title": "Clear, specific title",
    "description": "What the pattern is and what it means",
    "evidence": ["Specific data points from above"],
    "confidence": 0.7,
    "time_horizon": "1-month|3-months|6-months",
    "business_implication": "What this means for our organization",
    "recommended_action": "Suggested response"
  }
]

RULES:
- Only report patterns with real evidence from the data above
- Be specific - cite numbers and facts
- If no meaningful patterns exist, return []
- Focus on actionable intelligence`;

  const response = await callClaude(prompt);
  return parsePatternResponse(response);
}
```

### 3. `detect-cross-target-connections` (REDESIGNED)

**Purpose:** Find connections BETWEEN targets based on accumulated intelligence.

```typescript
// supabase/functions/detect-cross-target-connections/index.ts

interface CrossTargetConnection {
  connection_type: 'shared_relationship' | 'market_convergence' | 'timing_correlation' | 'competitive_clash' | 'supply_chain';
  title: string;
  targets_involved: string[];
  shared_elements: string[];
  description: string;
  evidence: string[];
  strength: number;
  business_implication: string;
}

async function detectCrossTargetConnections(
  targets: IntelligenceTarget[],
  orgContext: string
): Promise<CrossTargetConnection[]> {

  // Pre-filter: Only targets with accumulated context
  const enrichedTargets = targets.filter(t =>
    t.accumulated_context && t.accumulated_context.total_facts >= 3
  );

  if (enrichedTargets.length < 2) {
    return [];
  }

  // Build relationship overlap matrix
  const relationshipOverlaps = findRelationshipOverlaps(enrichedTargets);
  const geographicOverlaps = findGeographicOverlaps(enrichedTargets);
  const activityCorrelations = findActivityCorrelations(enrichedTargets);

  const prompt = `You are an intelligence analyst looking for CONNECTIONS between tracked targets.

ORGANIZATION CONTEXT:
${orgContext}

TRACKED TARGETS WITH ACCUMULATED INTELLIGENCE:
${enrichedTargets.map(t => `
═══ ${t.name} (${t.target_type}) ═══
Facts collected: ${t.accumulated_context.total_facts}
Primary activity: ${t.accumulated_context.insights?.primary_activity || 'Various'}
Key relationships: ${Object.keys(t.accumulated_context.relationship_map || {}).slice(0, 5).join(', ')}
Active regions: ${Object.keys(t.accumulated_context.geographic_activity || {}).join(', ')}
Recent focus: ${t.accumulated_context.recent_highlights?.[0]?.summary || 'N/A'}
`).join('\n')}

PRE-COMPUTED OVERLAPS:
═══════════════════════

Shared Relationships (entities both targets interact with):
${relationshipOverlaps.map(o =>
  `- ${o.targets.join(' & ')}: Both connected to ${o.sharedEntities.join(', ')}`
).join('\n') || 'None detected'}

Geographic Overlaps (targets active in same regions):
${geographicOverlaps.map(o =>
  `- ${o.targets.join(' & ')}: Both active in ${o.regions.join(', ')}`
).join('\n') || 'None detected'}

Activity Timing (targets with correlated activity patterns):
${activityCorrelations.map(c =>
  `- ${c.targets.join(' & ')}: ${c.correlation > 0 ? 'Activity moves together' : 'Inverse activity'}`
).join('\n') || 'Not enough data'}

TASK: Identify meaningful CONNECTIONS between these targets.

Look for:
1. SHARED RELATIONSHIPS: Targets linked through common entities (partners, suppliers, customers)
2. MARKET CONVERGENCE: Multiple targets moving into same space
3. TIMING CORRELATION: Activity patterns that suggest coordination or reaction
4. COMPETITIVE CLASH: Targets competing in same area
5. SUPPLY CHAIN: Upstream/downstream relationships

Return 0-4 connections as JSON:
[
  {
    "connection_type": "shared_relationship|market_convergence|timing_correlation|competitive_clash|supply_chain",
    "title": "Clear title",
    "targets_involved": ["Target A", "Target B"],
    "shared_elements": ["Entity X", "Region Y"],
    "description": "What the connection is",
    "evidence": ["Specific data points"],
    "strength": 0.8,
    "business_implication": "Why this matters to us"
  }
]

RULES:
- Only report connections with clear evidence
- Targets must be from the list above
- Focus on actionable intelligence`;

  const response = await callClaude(prompt);
  return parseConnectionResponse(response);
}

// Helper functions for pre-computing overlaps
function findRelationshipOverlaps(targets: IntelligenceTarget[]): Overlap[] {
  const overlaps = [];

  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const t1Entities = Object.keys(targets[i].accumulated_context?.relationship_map || {});
      const t2Entities = Object.keys(targets[j].accumulated_context?.relationship_map || {});

      const shared = t1Entities.filter(e => t2Entities.includes(e));

      if (shared.length > 0) {
        overlaps.push({
          targets: [targets[i].name, targets[j].name],
          sharedEntities: shared
        });
      }
    }
  }

  return overlaps;
}
```

---

## Pipeline Integration

### Updated Pipeline Flow

```
DAILY PIPELINE:
═══════════════

1. Discovery (existing)
   └→ New articles discovered

2. Scraping (existing)
   └→ Articles scraped, metadata extracted

3. Embedding (existing)
   └→ Articles embedded

4. Signal Matching (existing)
   └→ target_article_matches created

5. Fact Extraction (NEW) ← ADD TO PIPELINE
   └→ target_intelligence_facts created
   └→ accumulated_context updated

6. Pattern Analysis (REDESIGNED) ← RUNS WEEKLY OR ON-DEMAND
   └→ Analyzes accumulated_context
   └→ Creates predictive signals

7. Connection Detection (REDESIGNED) ← RUNS WEEKLY OR ON-DEMAND
   └→ Cross-target analysis
   └→ Creates connection signals
```

### Cron Schedule

```sql
-- Existing: Every 15 minutes
-- batch-embed-articles
-- batch-match-signals

-- NEW: Every 30 minutes (after matching)
SELECT cron.schedule('extract-target-facts', '15,45 * * * *', $$
  SELECT net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/extract-target-facts',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

-- NEW: Weekly pattern analysis (Sunday 2 AM UTC)
SELECT cron.schedule('analyze-target-patterns', '0 2 * * 0', $$
  SELECT net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/analyze-target-patterns',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

-- NEW: Weekly connection detection (Sunday 3 AM UTC)
SELECT cron.schedule('detect-cross-connections', '0 3 * * 0', $$
  SELECT net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/detect-cross-target-connections',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);
```

---

## Data Flow Examples

### Example 1: Building a Target Dossier

```
Day 1:
- Article matches Glencore (similarity 0.72)
- extract-target-facts extracts:
  {
    fact_type: "expansion",
    fact_summary: "Glencore announces $2B copper investment in Chile",
    entities_mentioned: ["Chile", "Copper", "Codelco"],
    relationships: [{entity: "Codelco", type: "potential_partner", confidence: 0.6}],
    sentiment_score: 0.7,
    significance_score: 85,
    geographic_region: "Latin America"
  }
- accumulated_context updated:
  - geographic_activity["Latin America"].fact_count++
  - relationship_map["Codelco"] created
  - topic_clusters["Copper"]++

Day 5:
- Another article matches Glencore
- Extract fact about Codelco partnership formalization
- relationship_map["Codelco"].mention_count++
- relationship_map["Codelco"].relationship_types = ["potential_partner", "partner"]

Day 30 (Weekly Analysis):
- analyze-target-patterns runs
- Sees: Latin America activity spike, Codelco relationship strengthening
- Generates prediction:
  {
    pattern_type: "trajectory",
    title: "Glencore South American Copper Expansion",
    description: "Intelligence suggests Glencore is making significant moves in Chilean copper...",
    evidence: ["5 expansion facts in Latin America in 30 days", "Codelco mentioned 4 times"],
    business_implication: "May affect copper supply negotiations",
    recommended_action: "Monitor Codelco partnership developments"
  }
```

### Example 2: Detecting Cross-Target Connections

```
Target A (Competitor): Glencore
- relationship_map: {"Codelco": 4 mentions, "Chile": 6 mentions}
- geographic_activity: {"Latin America": 8 facts}

Target B (Competitor): Trafigura
- relationship_map: {"Codelco": 2 mentions, "Peru": 5 mentions}
- geographic_activity: {"Latin America": 6 facts}

detect-cross-target-connections finds:
{
  connection_type: "market_convergence",
  title: "Glencore and Trafigura Converging on South American Copper",
  targets_involved: ["Glencore", "Trafigura"],
  shared_elements: ["Codelco", "Latin America", "Copper"],
  description: "Both competitors showing increased activity in South American copper markets...",
  business_implication: "Increased competition may affect our sourcing options"
}
```

---

## Cost Estimates

### Claude API Usage

| Function | Tokens/Call | Frequency | Daily Cost |
|----------|-------------|-----------|------------|
| extract-target-facts | ~2000 | 48/day (30 min) | ~$0.10 |
| analyze-target-patterns | ~3000 | 1/week | ~$0.02/week |
| detect-cross-connections | ~4000 | 1/week | ~$0.02/week |

**Total: ~$0.15/day** (vs current ~$0.50/day for one-shot analysis)

### Storage

| Table | Rows/Day | Size/Row | Daily Growth |
|-------|----------|----------|--------------|
| target_intelligence_facts | ~100 | ~2KB | ~200KB |
| accumulated_context updates | N/A | N/A | Negligible |

---

## Migration Plan

### Phase 1: Schema (Day 1)
1. Create `target_intelligence_facts` table
2. Add indexes
3. No code changes required

### Phase 2: Fact Extraction (Day 2-3)
1. Deploy `extract-target-facts` function
2. Test with single org
3. Add to pipeline orchestrator
4. Set up cron

### Phase 3: Backfill (Day 4)
1. Process existing `target_article_matches`
2. Build initial `accumulated_context` for each target
3. Establish baselines for targets with 30+ facts

### Phase 4: Pattern Analysis (Day 5-6)
1. Deploy redesigned `analyze-target-patterns`
2. Remove old pattern-detector from pipeline
3. Test weekly analysis

### Phase 5: Connection Detection (Day 7)
1. Deploy redesigned `detect-cross-target-connections`
2. Remove old connection-detector from pipeline
3. Test weekly analysis

### Phase 6: Cleanup (Day 8+)
1. Archive old pattern-detector and connection-detector
2. Update documentation
3. Monitor and tune

---

## Files to Create/Modify

```
NEW FILES:
├── supabase/migrations/
│   └── 20251211_target_intelligence_facts.sql
├── supabase/functions/
│   ├── extract-target-facts/
│   │   └── index.ts
│   ├── analyze-target-patterns/
│   │   └── index.ts          (complete rewrite)
│   └── detect-cross-target-connections/
│       └── index.ts          (complete rewrite)

MODIFY:
├── supabase/functions/
│   └── daily-pipeline-orchestrator/
│       └── index.ts          (add fact extraction stage)
└── TARGET_EMBEDDING_ARCHITECTURE.md (update for new flow)
```

---

## Success Metrics

1. **Accumulation**: Each target should accumulate 10+ facts/month
2. **Pattern Quality**: Patterns should cite specific evidence from accumulated data
3. **Connection Quality**: Connections should involve pre-computed overlaps
4. **Efficiency**: Total Claude cost should decrease (fewer tokens, smarter queries)
5. **Actionability**: Generated signals should have clear business implications

---

## Open Questions

1. **Baseline Establishment**: When to "lock" a baseline (after 30 facts? 60 days?)
2. **Fact Deduplication**: How to handle similar facts from different articles?
3. **Context Pruning**: When to remove old data from accumulated_context?
4. **User Triggers**: Should users be able to request on-demand analysis?
5. **Visualization**: How to display accumulated intelligence in UI?
