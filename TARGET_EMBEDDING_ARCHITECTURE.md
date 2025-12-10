# Target-Centric Embedding Architecture

## Overview

A pre-computed signal matching system that uses Voyage AI embeddings to connect articles to organization intelligence targets. All heavy computation happens in background jobs, making query-time operations fast and timeout-safe.

## Core Concept

```
Articles (global)  ←--embedding match--→  Targets (per-org)
                            ↓
                   target_article_matches
                            ↓
                   Fast query at runtime
```

**Key Principles:**
- Articles embedded ONCE globally (org-agnostic)
- Targets embedded ONCE per org (re-embed on change)
- Matches pre-computed in background (no query-time Claude calls)
- Query-time: just SELECT from pre-computed matches

## Database Schema

### 1. Add embedding column to raw_articles

```sql
-- Enable pgvector extension (if not already)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE raw_articles
ADD COLUMN embedding vector(1024),
ADD COLUMN embedded_at TIMESTAMPTZ;

-- Index for fast similarity search
CREATE INDEX idx_raw_articles_embedding
ON raw_articles USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for finding unembedded articles
CREATE INDEX idx_raw_articles_needs_embedding
ON raw_articles(scrape_status, embedded_at)
WHERE embedding IS NULL AND scrape_status = 'completed';
```

### 2. Add embedding column to intelligence_targets

```sql
ALTER TABLE intelligence_targets
ADD COLUMN embedding vector(1024),
ADD COLUMN embedding_context TEXT,  -- The text that was embedded
ADD COLUMN embedded_at TIMESTAMPTZ;

-- Index for similarity search
CREATE INDEX idx_intelligence_targets_embedding
ON intelligence_targets USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 20);
```

### 3. New table: target_article_matches

```sql
CREATE TABLE target_article_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES raw_articles(id) ON DELETE CASCADE,

  -- Match details
  similarity_score FLOAT NOT NULL,        -- 0-1, higher = more similar
  match_type TEXT NOT NULL,               -- 'semantic', 'keyword', 'entity'
  match_reason TEXT,                      -- Human-readable explanation

  -- Signal categorization
  signal_strength TEXT,                   -- 'strong', 'moderate', 'weak'
  signal_category TEXT,                   -- 'competitor_move', 'market_trend', 'regulatory', etc.

  -- Metadata
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                 -- Optional: auto-expire old matches

  -- Prevent duplicates
  UNIQUE(target_id, article_id)
);

-- Indexes for common queries
CREATE INDEX idx_target_matches_org_time
ON target_article_matches(organization_id, matched_at DESC);

CREATE INDEX idx_target_matches_target
ON target_article_matches(target_id, similarity_score DESC);

CREATE INDEX idx_target_matches_article
ON target_article_matches(article_id);
```

### 4. New table: embedding_jobs (optional, for tracking)

```sql
CREATE TABLE embedding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,                 -- 'articles', 'targets', 'matching'
  status TEXT DEFAULT 'pending',          -- 'pending', 'running', 'completed', 'failed'
  items_total INTEGER,
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Edge Functions

### 1. batch-embed-articles

**Purpose:** Embed articles that have been scraped but not yet embedded.

**Trigger:** Cron job every 15-30 minutes, or after batch-metadata-orchestrator completes.

**Process:**
1. Query articles where `embedding IS NULL AND scrape_status = 'completed'`
2. Batch articles (50-100 at a time)
3. Build embedding input: `title + description + topics`
4. Call Voyage AI batch embed API
5. Update `raw_articles.embedding` and `embedded_at`

**Input for embedding (per article):**
```
Title: {title}
Source: {source_name}
Description: {description}
Topics: {extracted_metadata.topics.join(', ')}
```

**Code outline:**
```typescript
// supabase/functions/batch-embed-articles/index.ts

const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY');
const BATCH_SIZE = 50;

async function embedArticles() {
  // Get unembedded articles
  const { data: articles } = await supabase
    .from('raw_articles')
    .select('id, title, description, source_name, extracted_metadata')
    .is('embedding', null)
    .eq('scrape_status', 'completed')
    .limit(BATCH_SIZE);

  if (!articles?.length) return { processed: 0 };

  // Build texts for embedding
  const texts = articles.map(a => {
    const topics = a.extracted_metadata?.topics?.join(', ') || '';
    return `Title: ${a.title}\nSource: ${a.source_name}\nDescription: ${a.description || ''}\nTopics: ${topics}`;
  });

  // Call Voyage AI
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'voyage-3-lite',
      input: texts
    })
  });

  const { data: embeddings } = await response.json();

  // Update articles with embeddings
  for (let i = 0; i < articles.length; i++) {
    await supabase
      .from('raw_articles')
      .update({
        embedding: embeddings[i].embedding,
        embedded_at: new Date().toISOString()
      })
      .eq('id', articles[i].id);
  }

  return { processed: articles.length };
}
```

### 2. batch-embed-targets

**Purpose:** Embed intelligence targets. Run when targets are added/updated.

**Trigger:**
- After target creation/update (via database trigger or API call)
- Periodic re-embed for stale targets (weekly)

**Process:**
1. Query targets where `embedding IS NULL` or `embedded_at < updated_at`
2. Build rich context for each target
3. Call Voyage AI
4. Update target embeddings

**Input for embedding (per target):**
```
Target: {name}
Type: {target_type}
Priority: {priority}
Description: {description}
Context: {context}
Keywords: {keywords.join(', ')}
Organization Industry: {org.industry}
```

**Code outline:**
```typescript
// supabase/functions/batch-embed-targets/index.ts

async function embedTargets(organizationId?: string) {
  // Get targets needing embedding
  let query = supabase
    .from('intelligence_targets')
    .select(`
      id, name, target_type, priority, description, context, keywords,
      organizations(name, industry)
    `)
    .eq('is_active', true);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  // Filter to unembedded or stale
  query = query.or('embedding.is.null,embedded_at.lt.updated_at');

  const { data: targets } = await query.limit(100);

  if (!targets?.length) return { processed: 0 };

  // Build rich context for each target
  const texts = targets.map(t => {
    return `Target: ${t.name}
Type: ${t.target_type}
Priority: ${t.priority}
Description: ${t.description || ''}
Context: ${t.context || ''}
Keywords: ${(t.keywords || []).join(', ')}
Industry: ${t.organizations?.industry || ''}`;
  });

  // Call Voyage AI and update
  // ... similar to batch-embed-articles
}
```

### 3. batch-match-signals

**Purpose:** Match articles to targets, create pre-computed signal matches.

**Trigger:** Cron job every 15-30 minutes.

**Process:**
1. Get recently embedded articles (last 24h, not yet matched)
2. For each organization with active targets:
   a. Get org's target embeddings
   b. Find articles similar to each target (vector similarity)
   c. Insert matches above threshold into `target_article_matches`

**Matching logic:**
```typescript
// supabase/functions/batch-match-signals/index.ts

const SIMILARITY_THRESHOLD = 0.35;  // Tune based on testing
const MAX_MATCHES_PER_TARGET = 50;

async function matchSignals() {
  // Get organizations with targets
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .in('id',
      supabase.from('intelligence_targets')
        .select('organization_id')
        .eq('is_active', true)
    );

  for (const org of orgs) {
    await matchOrgSignals(org.id);
  }
}

async function matchOrgSignals(orgId: string) {
  // Get org's targets with embeddings
  const { data: targets } = await supabase
    .from('intelligence_targets')
    .select('id, name, target_type, priority, embedding')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .not('embedding', 'is', null);

  if (!targets?.length) return;

  // Get recent articles with embeddings (not already matched to this org)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const target of targets) {
    // Vector similarity search
    const { data: matches } = await supabase.rpc('match_articles_to_target', {
      target_embedding: target.embedding,
      similarity_threshold: SIMILARITY_THRESHOLD,
      max_results: MAX_MATCHES_PER_TARGET,
      since: cutoff
    });

    // Insert matches
    const matchRecords = matches.map(m => ({
      organization_id: orgId,
      target_id: target.id,
      article_id: m.id,
      similarity_score: m.similarity,
      match_type: 'semantic',
      signal_strength: m.similarity > 0.5 ? 'strong' : m.similarity > 0.4 ? 'moderate' : 'weak'
    }));

    await supabase
      .from('target_article_matches')
      .upsert(matchRecords, { onConflict: 'target_id,article_id' });
  }
}
```

**Database function for vector search:**
```sql
CREATE OR REPLACE FUNCTION match_articles_to_target(
  target_embedding vector(1024),
  similarity_threshold float,
  max_results int,
  since timestamptz
)
RETURNS TABLE (
  id uuid,
  title text,
  source_name text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ra.id,
    ra.title,
    ra.source_name,
    1 - (ra.embedding <=> target_embedding) as similarity
  FROM raw_articles ra
  WHERE ra.embedding IS NOT NULL
    AND ra.embedded_at > since
    AND 1 - (ra.embedding <=> target_embedding) > similarity_threshold
  ORDER BY ra.embedding <=> target_embedding
  LIMIT max_results;
$$;
```

### 4. article-selector-v5 (replacement)

**Purpose:** Fast query of pre-computed matches. No Claude calls, no timeout risk.

**Process:**
1. Query `target_article_matches` for org
2. Join with articles and targets
3. Return organized by target

**Code outline:**
```typescript
// supabase/functions/article-selector-v5/index.ts

async function selectArticles(organizationId: string, options: {
  hours?: number,
  minSimilarity?: number,
  limit?: number
}) {
  const cutoff = new Date(Date.now() - (options.hours || 24) * 60 * 60 * 1000);

  const { data: matches } = await supabase
    .from('target_article_matches')
    .select(`
      similarity_score,
      signal_strength,
      match_type,
      intelligence_targets(id, name, target_type, priority),
      raw_articles(id, title, url, description, source_name, published_at, full_content)
    `)
    .eq('organization_id', organizationId)
    .gte('matched_at', cutoff.toISOString())
    .gte('similarity_score', options.minSimilarity || 0.35)
    .order('similarity_score', { ascending: false })
    .limit(options.limit || 100);

  // Group by target for organized response
  const byTarget = {};
  for (const match of matches) {
    const targetId = match.intelligence_targets.id;
    if (!byTarget[targetId]) {
      byTarget[targetId] = {
        target: match.intelligence_targets,
        articles: []
      };
    }
    byTarget[targetId].articles.push({
      ...match.raw_articles,
      similarity: match.similarity_score,
      signal_strength: match.signal_strength
    });
  }

  return {
    organization_id: organizationId,
    matches_by_target: Object.values(byTarget),
    total_matches: matches.length
  };
}
```

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SCRAPING PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Discovery → Scraping → Metadata Extraction                              │
│                              ↓                                           │
│                    raw_articles (completed)                              │
└─────────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       EMBEDDING PIPELINE (NEW)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  batch-embed-articles (cron: */15)                                       │
│  - Embeds articles where embedding IS NULL                               │
│  - Updates raw_articles.embedding                                        │
│                                                                          │
│  batch-embed-targets (on change + weekly)                                │
│  - Embeds new/updated intelligence targets                               │
│  - Updates intelligence_targets.embedding                                │
│                                                                          │
│  batch-match-signals (cron: */15)                                        │
│  - Matches articles to targets via vector similarity                     │
│  - Creates target_article_matches records                                │
└─────────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        QUERY LAYER (FAST)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  article-selector-v5                                                     │
│  - Simple SELECT from target_article_matches                             │
│  - No Claude calls, no embedding at query time                           │
│  - Returns articles organized by target                                  │
│                              ↓                                           │
│  mcp-executive-synthesis                                                 │
│  - Receives target-organized articles                                    │
│  - Generates brief organized BY TARGET                                   │
│                              ↓                                           │
│  pattern-detector / connection-detector                                  │
│  - Can query matches for specific targets                                │
│  - "Find patterns for competitor X"                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Cron Schedule

```sql
-- Embed new articles (every 15 minutes)
SELECT cron.schedule('embed-articles', '*/15 * * * *', $$
  SELECT net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/batch-embed-articles',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

-- Embed targets (every hour, only processes changed ones)
SELECT cron.schedule('embed-targets', '5 * * * *', $$
  SELECT net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/batch-embed-targets',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);

-- Match signals (every 15 minutes, offset from embed)
SELECT cron.schedule('match-signals', '10,25,40,55 * * * *', $$
  SELECT net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/batch-match-signals',
    headers := '{"Authorization": "Bearer SERVICE_KEY"}'::jsonb
  );
$$);
```

## Cost Estimates

### Voyage AI Embedding Costs

| Item | Tokens/Item | Items/Day | Daily Tokens | Cost (voyage-3-lite @ $0.02/1M) |
|------|-------------|-----------|--------------|----------------------------------|
| Articles | ~150 | 500-1500 | 75K-225K | $0.002-$0.005 |
| Targets | ~200 | 10-50 | 2K-10K | <$0.001 |
| **Total** | | | | **~$0.01/day** |

### Performance

| Operation | Time | Frequency |
|-----------|------|-----------|
| Embed 50 articles | ~2s | Every 15 min |
| Embed 50 targets | ~1s | Hourly |
| Match 1 org's targets | ~1s | Every 15 min |
| article-selector-v5 query | ~50ms | On demand |

## Integration with Existing Systems

### mcp-executive-synthesis

Update to receive target-organized data:

```typescript
// Before: Flat list of articles
const articles = await articleSelector({ org_id });
const brief = await synthesize(articles);

// After: Target-organized articles
const { matches_by_target } = await articleSelectorV5({ org_id });
const brief = await synthesize(matches_by_target);
// Brief now has sections per target:
// "## Competitor: Acme Corp\n- Signal 1...\n- Signal 2..."
```

### pattern-detector

Can now query patterns for specific targets:

```sql
SELECT
  t.name as target,
  COUNT(*) as signal_count,
  array_agg(DISTINCT ra.source_name) as sources
FROM target_article_matches m
JOIN intelligence_targets t ON m.target_id = t.id
JOIN raw_articles ra ON m.article_id = ra.id
WHERE m.organization_id = $1
  AND m.matched_at > NOW() - INTERVAL '7 days'
GROUP BY t.id, t.name
HAVING COUNT(*) >= 3
ORDER BY signal_count DESC;
```

### connection-detector

Find connections between targets:

```sql
-- Articles that match multiple targets = potential connections
SELECT
  ra.id,
  ra.title,
  array_agg(t.name) as connected_targets
FROM raw_articles ra
JOIN target_article_matches m ON ra.id = m.article_id
JOIN intelligence_targets t ON m.target_id = t.id
WHERE m.organization_id = $1
GROUP BY ra.id, ra.title
HAVING COUNT(DISTINCT m.target_id) > 1;
```

## Migration Path

1. **Phase 1: Schema** - Add columns and tables (no code changes)
2. **Phase 2: Embedding** - Deploy batch-embed-articles, batch-embed-targets
3. **Phase 3: Matching** - Deploy batch-match-signals
4. **Phase 4: Query** - Deploy article-selector-v5, update downstream
5. **Phase 5: Cleanup** - Deprecate article-selector-v4

## Files to Create

```
supabase/functions/
├── batch-embed-articles/
│   └── index.ts
├── batch-embed-targets/
│   └── index.ts
├── batch-match-signals/
│   └── index.ts
└── article-selector-v5/
    └── index.ts

supabase/migrations/
├── 20251210_add_embedding_columns.sql
├── 20251210_create_target_matches_table.sql
└── 20251210_create_vector_search_function.sql
```

## Next Steps

1. Create migration files for schema changes
2. Implement batch-embed-articles function
3. Implement batch-embed-targets function
4. Implement batch-match-signals function
5. Implement article-selector-v5
6. Update mcp-executive-synthesis to use target-organized data
7. Set up cron jobs
8. Test end-to-end pipeline
