SYSTEM ARCHITECTURE
┌─────────────────────────────────────────────────────────────┐
│ USER INTERACTION LAYER │
│ - Campaign Builder generates content │
│ - User exports content (no direct publishing) │
│ - User views campaign performance dashboard │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ FINGERPRINTING LAYER (NEW) │
│ - Content fingerprinted on export │
│ - Multi-sector embeddings generated │
│ - Key phrases and angles extracted │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ EXISTING INTELLIGENCE MONITORING │
│ - Already monitors 130+ sources │
│ - Detects news, social, competitor activity │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ ATTRIBUTION LAYER (NEW) │
│ - Matches detected content to fingerprints │
│ - Records campaign coverage automatically │
│ - Calculates performance metrics │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ SEMANTIC MEMORY LAYER (NEW) │
│ - Multi-sector embeddings (episodic, semantic, etc.) │
│ - Waypoint graphs connecting related strategies │
│ - Outcome tracking from attribution data │
│ - Temporal decay and salience scoring │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ EXISTING MEMORY VAULT + DATABASE │
│ - niv_strategies table (existing) │
│ - PostgreSQL + pgvector (existing) │
│ - Enhanced with new semantic tables │
└─────────────────────────────────────────────────────────────┘

```

**The Learning Loop:**
```

Campaign Created → Fingerprinted → Exported →
Detected in Wild → Attributed → Performance Recorded →
Outcome Stored in Semantic Memory → Future Campaigns Learn

PHASE 1: DATABASE SCHEMA
Step 1.1: Enable pgvector Extension
sql-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;
Step 1.2: Semantic Memory Tables
sql-- Multi-sector embeddings for strategies (enhances Memory Vault)
CREATE TABLE strategy_embeddings (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
strategy_id UUID REFERENCES niv_strategies(id) ON DELETE CASCADE,
org_id UUID REFERENCES organizations(id),

-- OpenMemory's 5-sector embeddings
episodic_embedding vector(768), -- "What happened" - events, campaigns
semantic_embedding vector(768), -- "What it means" - concepts, patterns
procedural_embedding vector(768), -- "How to do it" - processes, workflows
emotional_embedding vector(768), -- "Sentiment/tone" - stakeholder feelings
reflective_embedding vector(768), -- "Meta insights" - patterns across strategies

-- OpenMemory's HMD metadata
salience FLOAT DEFAULT 1.0, -- Importance score (0-1), increases with use
decay_rate FLOAT DEFAULT 0.02, -- How fast relevance decays over time
access_count INTEGER DEFAULT 0, -- How often accessed
last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

-- Sector classification
primary_sectors TEXT[], -- Which sectors are most relevant

created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waypoint graph for associative memory (how strategies relate)
CREATE TABLE strategy_waypoints (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID REFERENCES organizations(id),
from_strategy_id UUID REFERENCES niv_strategies(id) ON DELETE CASCADE,
to_strategy_id UUID REFERENCES niv_strategies(id) ON DELETE CASCADE,

weight FLOAT DEFAULT 1.0, -- Connection strength (0-1)
link_type TEXT NOT NULL, -- 'similar_pattern', 'temporal', 'causal', 'stakeholder'

created_at TIMESTAMPTZ DEFAULT NOW(),

UNIQUE(from_strategy_id, to_strategy_id, link_type)
);

-- Outcome tracking for learning (fed by attribution system)
CREATE TABLE strategy_outcomes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
strategy_id UUID REFERENCES niv_strategies(id) ON DELETE CASCADE,
org_id UUID REFERENCES organizations(id),

outcome_type TEXT NOT NULL, -- 'success', 'partial', 'failed', 'ongoing'
effectiveness_score FLOAT, -- 0-5 rating based on attribution data
key_learnings TEXT[], -- What we learned from this campaign
success_factors JSONB, -- What worked (e.g., coverage count, reach, patterns)
failure_factors JSONB, -- What didn't work

-- Link to attribution data
total_coverage INTEGER DEFAULT 0,
total_reach BIGINT DEFAULT 0,
avg_confidence FLOAT,

recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector indexes for fast semantic search
CREATE INDEX strategy_embeddings_episodic_idx ON strategy_embeddings
USING ivfflat (episodic_embedding vector_cosine_ops)
WHERE episodic_embedding IS NOT NULL;

CREATE INDEX strategy_embeddings_semantic_idx ON strategy_embeddings
USING ivfflat (semantic_embedding vector_cosine_ops)
WHERE semantic_embedding IS NOT NULL;

CREATE INDEX strategy_embeddings_procedural_idx ON strategy_embeddings
USING ivfflat (procedural_embedding vector_cosine_ops)
WHERE procedural_embedding IS NOT NULL;

CREATE INDEX strategy_embeddings_reflective_idx ON strategy_embeddings
USING ivfflat (reflective_embedding vector_cosine_ops)
WHERE reflective_embedding IS NOT NULL;

-- Standard indexes
CREATE INDEX strategy_embeddings_strategy_id_idx ON strategy_embeddings(strategy_id);
CREATE INDEX strategy_embeddings_org_id_idx ON strategy_embeddings(org_id);
CREATE INDEX strategy_embeddings_salience_idx ON strategy_embeddings(salience DESC);
CREATE INDEX strategy_waypoints_from_idx ON strategy_waypoints(from_strategy_id);
CREATE INDEX strategy_waypoints_to_idx ON strategy_waypoints(to_strategy_id);
CREATE INDEX strategy_waypoints_org_idx ON strategy_waypoints(org_id);
CREATE INDEX strategy_outcomes_strategy_id_idx ON strategy_outcomes(strategy_id);
CREATE INDEX strategy_outcomes_org_id_idx ON strategy_outcomes(org_id);

-- Row Level Security
ALTER TABLE strategy_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY strategy_embeddings_org_isolation ON strategy_embeddings
FOR ALL USING (org_id = auth.uid()::uuid);

CREATE POLICY strategy_waypoints_org_isolation ON strategy_waypoints
FOR ALL USING (org_id = auth.uid()::uuid);

CREATE POLICY strategy_outcomes_org_isolation ON strategy_outcomes
FOR ALL USING (org_id = auth.uid()::uuid);
Step 1.3: Campaign Attribution Tables
sql-- Fingerprints created when content is exported
CREATE TABLE campaign_fingerprints (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID REFERENCES organizations(id),
campaign_id UUID, -- References your campaigns table
content_id UUID, -- ID of generated content

-- Fingerprint data for matching
key_phrases TEXT[], -- Unique 3-7 word phrases from content
semantic_embedding vector(768), -- Embedding of full content
headline_embedding vector(768), -- Embedding of headline/key message
unique_angles JSONB, -- Specific positioning/angles

-- Content metadata
content_type TEXT, -- 'press_release', 'social_post', 'article', 'email_campaign'
content_preview TEXT, -- First 500 chars for display

-- Tracking info
export_status TEXT DEFAULT 'exported', -- 'exported', 'matched', 'expired'
exported_at TIMESTAMPTZ DEFAULT NOW(),
expected_channels TEXT[], -- Where user said they'd post (optional)
known_urls TEXT[], -- URLs user provided (optional)

-- Attribution window (how long to actively search)
tracking_start TIMESTAMPTZ DEFAULT NOW(),
tracking_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days',

created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track when content is exported
CREATE TABLE content_exports (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID REFERENCES organizations(id),
content_id UUID NOT NULL,
fingerprint_id UUID REFERENCES campaign_fingerprints(id),

export_format TEXT, -- 'pdf', 'docx', 'txt', 'html'
exported_at TIMESTAMPTZ DEFAULT NOW(),

-- Optional user-provided tracking info
intended_channels TEXT[], -- User said they'll post to these channels
intended_urls TEXT[], -- User said they'll post to these URLs
notes TEXT -- User's notes about distribution plan
);

-- Attribution records (detected coverage)
CREATE TABLE campaign_attributions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
org_id UUID REFERENCES organizations(id),
fingerprint_id UUID REFERENCES campaign_fingerprints(id),
campaign_id UUID,

-- The detected content
source_type TEXT NOT NULL, -- 'news', 'twitter', 'linkedin', 'blog', 'known_url'
source_url TEXT NOT NULL,
source_outlet TEXT, -- e.g., 'TechCrunch', '@journalist'
content_title TEXT,
content_text TEXT,
published_at TIMESTAMPTZ,

-- Attribution confidence
confidence_score FLOAT NOT NULL, -- 0-1
match_type TEXT NOT NULL, -- 'exact_phrase', 'semantic', 'contextual', 'user_verified'
match_details JSONB, -- What matched (phrases, similarity scores, etc.)

-- Impact metrics
estimated_reach BIGINT, -- Estimated audience size
sentiment TEXT, -- 'positive', 'neutral', 'negative'
key_messages_present TEXT[], -- Which campaign messages appeared

-- User verification
user_verified BOOLEAN DEFAULT false,
verified_at TIMESTAMPTZ,
verification_note TEXT,

created_at TIMESTAMPTZ DEFAULT NOW(),

UNIQUE(fingerprint_id, source_url) -- Don't duplicate same coverage
);

-- Indexes for attribution
CREATE INDEX fingerprints_campaign_idx ON campaign_fingerprints(campaign_id);
CREATE INDEX fingerprints_org_idx ON campaign_fingerprints(org_id);
CREATE INDEX fingerprints_status_idx ON campaign_fingerprints(export_status, tracking_end);
CREATE INDEX fingerprints_semantic_idx ON campaign_fingerprints
USING ivfflat (semantic_embedding vector_cosine_ops)
WHERE semantic_embedding IS NOT NULL;

CREATE INDEX exports_content_idx ON content_exports(content_id);
CREATE INDEX exports_fingerprint_idx ON content_exports(fingerprint_id);

CREATE INDEX attributions_campaign_idx ON campaign_attributions(campaign_id);
CREATE INDEX attributions_fingerprint_idx ON campaign_attributions(fingerprint_id);
CREATE INDEX attributions_org_idx ON campaign_attributions(org_id);
CREATE INDEX attributions_created_idx ON campaign_attributions(created_at DESC);
CREATE INDEX attributions_confidence_idx ON campaign_attributions(confidence_score DESC);

-- RLS for attribution tables
ALTER TABLE campaign_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY fingerprints_org_isolation ON campaign_fingerprints
FOR ALL USING (org_id = auth.uid()::uuid);

CREATE POLICY exports_org_isolation ON content_exports
FOR ALL USING (org_id = auth.uid()::uuid);

CREATE POLICY attributions_org_isolation ON campaign_attributions
FOR ALL USING (org_id = auth.uid()::uuid);
Step 1.4: PostgreSQL Functions for Vector Search
sql-- Search strategies by semantic similarity across sectors
CREATE OR REPLACE FUNCTION search_strategy_embeddings(
query_embedding vector(768),
sector_name text,
org_filter uuid,
strategy_type_filter text,
match_count int,
match_threshold float
)
RETURNS TABLE (
strategy_id uuid,
similarity float,
salience float,
created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY EXECUTE format('
SELECT
e.strategy_id,
1 - (e.%I <=> $1) as similarity,
e.salience,
e.created_at
FROM strategy_embeddings e
JOIN niv_strategies s ON s.id = e.strategy_id
WHERE e.org_id = $2
AND e.%I IS NOT NULL
AND 1 - (e.%I <=> $1) > $4
AND ($3 IS NULL OR s.strategy_type = $3)
ORDER BY e.%I <=> $1
LIMIT $5
',
sector_name || '\_embedding',
sector_name || '\_embedding',
sector_name || '\_embedding',
sector_name || '\_embedding'
)
USING query_embedding, org_filter, strategy_type_filter, match_threshold, match_count;
END;

$$
;

-- Find similar strategies for creating waypoints
CREATE OR REPLACE FUNCTION find_similar_strategies(
  query_embedding vector(768),
  org_filter uuid,
  exclude_strategy uuid,
  match_count int,
  match_threshold float
)
RETURNS TABLE (
  strategy_id uuid,
  similarity float
)
LANGUAGE sql
AS
$$

SELECT
strategy_id,
1 - (semantic_embedding <=> query_embedding) as similarity
FROM strategy_embeddings
WHERE org_id = org_filter
AND strategy_id != exclude_strategy
AND semantic_embedding IS NOT NULL
AND 1 - (semantic_embedding <=> query_embedding) > match_threshold
ORDER BY semantic_embedding <=> query_embedding
LIMIT match_count;

$$
;

-- Search fingerprints for attribution matching
CREATE OR REPLACE FUNCTION match_content_to_fingerprints(
  content_embedding vector(768),
  org_filter uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  fingerprint_id uuid,
  campaign_id uuid,
  similarity float,
  key_phrases text[],
  content_type text
)
LANGUAGE sql
AS
$$

SELECT
id as fingerprint_id,
campaign_id,
1 - (semantic_embedding <=> content_embedding) as similarity,
key_phrases,
content_type
FROM campaign_fingerprints
WHERE org_id = org_filter
AND export_status IN ('exported', 'matched')
AND tracking_end > NOW()
AND semantic_embedding IS NOT NULL
AND 1 - (semantic_embedding <=> content_embedding) > match_threshold
ORDER BY semantic_embedding <=> content_embedding
LIMIT match_count;

$$
;

PHASE 2: EDGE FUNCTIONS - SEMANTIC MEMORY
Function 2.1: semantic-memory-add
Purpose: Generate embeddings when strategy is saved to Memory Vault
File: supabase/functions/semantic-memory-add/index.ts
typescriptimport { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RequestBody {
  strategyId: string;
  orgId: string;
}

Deno.serve(async (req) => {
  try {
    const { strategyId, orgId }: RequestBody = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get the strategy from Memory Vault
    const { data: strategy, error: fetchError } = await supabase
      .from('niv_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch strategy: ${fetchError.message}`);

    // 2. Classify into sectors using AI
    const sectors = await classifyIntoSectors(strategy.content, strategy.strategy_type);

    // 3. Generate multi-sector embeddings
    const embeddings = await generateSectorEmbeddings(strategy.content, sectors);

    // 4. Store embeddings
    const { data: embedding, error: embError } = await supabase
      .from('strategy_embeddings')
      .insert({
        strategy_id: strategyId,
        org_id: orgId,
        episodic_embedding: embeddings.episodic || null,
        semantic_embedding: embeddings.semantic || null,
        procedural_embedding: embeddings.procedural || null,
        emotional_embedding: embeddings.emotional || null,
        reflective_embedding: embeddings.reflective || null,
        primary_sectors: sectors
      })
      .select()
      .single();

    if (embError) throw new Error(`Failed to store embeddings: ${embError.message}`);

    // 5. Create waypoints to similar strategies (async, don't wait)
    createWaypoints(supabase, strategyId, orgId, embeddings.semantic)
      .catch(err => console.error('Waypoint creation failed:', err));

    return new Response(JSON.stringify({
      success: true,
      embeddingId: embedding.id,
      sectors
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in semantic-memory-add:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function classifyIntoSectors(content: any, strategyType: string): Promise<string[]> {
  const contentStr = typeof content === 'string'
    ? content
    : JSON.stringify(content).slice(0, 2000);

  const prompt = `Analyze this ${strategyType} strategy and classify it into applicable memory sectors.

Content: ${contentStr}

Return a JSON array of applicable sectors from:
["episodic", "semantic", "procedural", "emotional", "reflective"]

- episodic: Events, campaigns, what happened (timeline/history)
- semantic: Concepts, patterns, what it means (understanding/knowledge)
- procedural: Processes, how-to, workflows (execution steps)
- emotional: Sentiment, stakeholder feelings (tone/reactions)
- reflective: Meta-insights, patterns across strategies (high-level learnings)

Return only the JSON array, no explanation.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content!);
  return result.sectors || [];
}

async function generateSectorEmbeddings(
  content: any,
  sectors: string[]
): Promise<Record<string, number[]>> {
  const contentStr = typeof content === 'string'
    ? content
    : JSON.stringify(content);

  const embeddings: Record<string, number[]> = {};

  // Generate embedding for each sector with context
  for (const sector of sectors) {
    const contextualContent = addSectorContext(contentStr, sector);

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: contextualContent
    });

    embeddings[sector] = response.data[0].embedding;
  }

  return embeddings;
}

function addSectorContext(content: string, sector: string): string {
  const contexts: Record<string, string> = {
    episodic: `[Event/Campaign History] ${content}`,
    semantic: `[Concept/Pattern Meaning] ${content}`,
    procedural: `[Process/Workflow Steps] ${content}`,
    emotional: `[Stakeholder Sentiment] ${content}`,
    reflective: `[Strategic Insight/Meta-Pattern] ${content}`
  };
  return contexts[sector] || content;
}

async function createWaypoints(
  supabase: any,
  strategyId: string,
  orgId: string,
  semanticEmbedding: number[] | null
) {
  if (!semanticEmbedding) return;

  // Find top 5 most similar strategies
  const { data: similar } = await supabase.rpc('find_similar_strategies', {
    query_embedding: semanticEmbedding,
    org_filter: orgId,
    exclude_strategy: strategyId,
    match_count: 5,
    match_threshold: 0.7
  });

  if (!similar || similar.length === 0) return;

  // Create waypoint links
  const waypoints = similar.map((s: any) => ({
    org_id: orgId,
    from_strategy_id: strategyId,
    to_strategy_id: s.strategy_id,
    weight: s.similarity,
    link_type: 'similar_pattern'
  }));

  await supabase
    .from('strategy_waypoints')
    .insert(waypoints);
}
Function 2.2: semantic-memory-query
Purpose: Query semantic memory for relevant past strategies
File: supabase/functions/semantic-memory-query/index.ts
typescriptimport { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface QueryRequest {
  query: string;
  orgId: string;
  sectors?: string[];
  strategyType?: string | null;
  limit?: number;
  minScore?: number;
}

Deno.serve(async (req) => {
  try {
    const {
      query,
      orgId,
      sectors = ['semantic', 'procedural', 'reflective'],
      strategyType = null,
      limit = 10,
      minScore = 0.3
    }: QueryRequest = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Generate query embedding
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
    const queryEmbedding = response.data[0].embedding;

    // 2. Search across specified sectors
    const results = await Promise.all(
      sectors.map(sector =>
        searchSector(supabase, orgId, sector, queryEmbedding, limit, strategyType)
      )
    );

    // 3. Merge and rank by composite score
    const allResults = results.flat();
    const ranked = rankByCompositeScore(allResults, minScore);

    // 4. Expand with waypoints (1-hop)
    const topResults = ranked.slice(0, 5);
    const expanded = await expandWithWaypoints(supabase, topResults);

    // 5. Get full strategy data
    const strategyIds = [...new Set([
      ...ranked.map(r => r.strategy_id),
      ...expanded.map(e => e.to_strategy_id)
    ])];

    const { data: strategies } = await supabase
      .from('niv_strategies')
      .select('*')
      .in('id', strategyIds);

    // 6. Enrich with scores and reasoning
    const enriched = strategies?.map(s => {
      const matchInfo = ranked.find(r => r.strategy_id === s.id);
      const isWaypoint = !matchInfo && expanded.some(e => e.to_strategy_id === s.id);

      return {
        ...s,
        relevance_score: matchInfo?.composite_score || 0,
        matched_sector: matchInfo?.sector || (isWaypoint ? 'waypoint' : 'unknown'),
        similarity: matchInfo?.similarity || 0,
        salience: matchInfo?.salience || 0,
        is_waypoint: isWaypoint
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);

    return new Response(JSON.stringify(enriched), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in semantic-memory-query:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function searchSector(
  supabase: any,
  orgId: string,
  sector: string,
  embedding: number[],
  limit: number,
  strategyType: string | null
) {
  const { data, error } = await supabase.rpc('search_strategy_embeddings', {
    query_embedding: embedding,
    sector_name: sector,
    org_filter: orgId,
    strategy_type_filter: strategyType,
    match_count: limit,
    match_threshold: 0.3
  });

  if (error) {
    console.error(`Error searching ${sector} sector:`, error);
    return [];
  }

  return data.map((d: any) => ({
    ...d,
    sector
  }));
}

function rankByCompositeScore(results: any[], minScore: number) {
  const now = Date.now();

  return results
    .map(r => {
      // Calculate recency score (exponential decay)
      const ageMs = now - new Date(r.created_at).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recency = Math.exp(-0.02 * ageDays);

      // OpenMemory's composite formula:
      // 0.6 × similarity + 0.2 × salience + 0.1 × recency + 0.1 × link_weight
      r.composite_score =
        0.6 * r.similarity +
        0.2 * (r.salience || 1.0) +
        0.1 * recency +
        0.1 * (r.link_weight || 0);

      return r;
    })
    .filter(r => r.composite_score >= minScore)
    .sort((a, b) => b.composite_score - a.composite_score);
}

async function expandWithWaypoints(supabase: any, topResults: any[]) {
  if (topResults.length === 0) return [];

  const strategyIds = topResults.map(r => r.strategy_id);

  const { data: waypoints } = await supabase
    .from('strategy_waypoints')
    .select('to_strategy_id, weight')
    .in('from_strategy_id', strategyIds)
    .order('weight', { ascending: false })
    .limit(10);

  return waypoints || [];
}

PHASE 3: EDGE FUNCTIONS - CAMPAIGN ATTRIBUTION
Function 3.1: campaign-fingerprint-create
Purpose: Create fingerprint when content is exported
File: supabase/functions/campaign-fingerprint-create/index.ts
typescriptimport { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface FingerprintRequest {
  campaignId: string;
  contentId: string;
  content: string;
  contentType: string;
  orgId: string;
  exportFormat?: string;
  intendedChannels?: string[];
  intendedUrls?: string[];
}

Deno.serve(async (req) => {
  try {
    const body: FingerprintRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Extract key phrases
    const keyPhrases = await extractKeyPhrases(body.content);

    // 2. Identify unique angles
    const uniqueAngles = await identifyAngles(body.content);

    // 3. Generate embeddings
    const embeddings = await generateFingerprints(body.content);

    // 4. Store fingerprint
    const { data: fingerprint, error: fpError } = await supabase
      .from('campaign_fingerprints')
      .insert({
        org_id: body.orgId,
        campaign_id: body.campaignId,
        content_id: body.contentId,
        key_phrases: keyPhrases,
        semantic_embedding: embeddings.semantic,
        headline_embedding: embeddings.headline,
        unique_angles: uniqueAngles,
        content_type: body.contentType,
        content_preview: body.content.slice(0, 500),
        expected_channels: body.intendedChannels || [],
        known_urls: body.intendedUrls || [],
        exported_at: new Date().toISOString(),
        tracking_end: new Date(Date.now() + 90*24*60*60*1000).toISOString()
      })
      .select()
      .single();

    if (fpError) throw new Error(`Failed to create fingerprint: ${fpError.message}`);

    // 5. Record export event
    await supabase
      .from('content_exports')
      .insert({
        org_id: body.orgId,
        content_id: body.contentId,
        fingerprint_id: fingerprint.id,
        export_format: body.exportFormat || 'unknown',
        intended_channels: body.intendedChannels || [],
        intended_urls: body.intendedUrls || []
      });

    return new Response(JSON.stringify({
      success: true,
      fingerprintId: fingerprint.id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in campaign-fingerprint-create:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function extractKeyPhrases(content: string): Promise<string[]> {
  const prompt = `Extract 5-10 distinctive key phrases from this content that would uniquely identify it if seen in media coverage.

Content: ${content.slice(0, 2000)}

Return phrases that are:
- 3-7 words long
- Unique/distinctive (not generic)
- Likely to be quoted or referenced
- Include specific claims, data points, or unique positioning

Return as JSON object: {"phrases": ["phrase1", "phrase2", ...]`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  const result = JSON.parse(response.content[0].text);
  return result.phrases || [];
}

async function identifyAngles(content: string): Promise<any> {
  const prompt = `Identify the unique angles and positioning in this content.

Content: ${content.slice(0, 2000)}

Extract:
- Main narrative angle
- Key data points/statistics mentioned
- Unique claims or differentiators
- Quoted individuals (if any)
- Specific company/product names

Return as JSON object.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(response.content[0].text);
}

async function generateFingerprints(content: string) {
  // Extract headline/first paragraph for headline embedding
  const headline = content.split('\n')[0].slice(0, 500);

  // Generate both embeddings in parallel
  const [semanticResp, headlineResp] = await Promise.all([
    openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content.slice(0, 8000) // Full content
    }),
    openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: headline // Just headline
    })
  ]);

  return {
    semantic: semanticResp.data[0].embedding,
    headline: headlineResp.data[0].embedding
  };
}
Function 3.2: campaign-attribution-check
Purpose: Check if detected content matches any fingerprints
File: supabase/functions/campaign-attribution-check/index.ts
typescriptimport { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface AttributionCheckRequest {
  orgId: string;
  articleContent: string;
  articleTitle: string;
  articleUrl: string;
  sourceType: string; // 'news', 'twitter', 'linkedin', etc.
  sourceOutlet?: string;
  publishedAt?: string;
  estimatedReach?: number;
}

Deno.serve(async (req) => {
  try {
    const body: AttributionCheckRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get active fingerprints for this org
    const { data: fingerprints } = await supabase
      .from('campaign_fingerprints')
      .select('*')
      .eq('org_id', body.orgId)
      .in('export_status', ['exported', 'matched'])
      .gte('tracking_end', new Date().toISOString());

    if (!fingerprints || fingerprints.length === 0) {
      return new Response(JSON.stringify({
        match: false,
        reason: 'no_active_fingerprints'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Check exact phrase matches (HIGH confidence)
    for (const fingerprint of fingerprints) {
      const exactMatches = findExactPhraseMatches(
        body.articleContent,
        fingerprint.key_phrases
      );

      if (exactMatches.length >= 2) {
        const attribution = await recordAttribution(supabase, {
          fingerprintId: fingerprint.id,
          campaignId: fingerprint.campaign_id,
          orgId: body.orgId,
          sourceType: body.sourceType,
          sourceUrl: body.articleUrl,
          sourceOutlet: body.sourceOutlet,
          contentTitle: body.articleTitle,
          contentText: body.articleContent,
          publishedAt: body.publishedAt,
          confidence: 0.95,
          matchType: 'exact_phrase',
          matchDetails: { matched_phrases: exactMatches },
          estimatedReach: body.estimatedReach
        });

        return new Response(JSON.stringify({
          match: true,
          attribution
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Check semantic similarity (MEDIUM confidence)
    const articleEmbedding = await generateEmbedding(body.articleContent);

    const { data: semanticMatches } = await supabase.rpc('match_content_to_fingerprints', {
      content_embedding: articleEmbedding,
      org_filter: body.orgId,
      match_threshold: 0.75,
      match_count: 3
    });

    if (semanticMatches && semanticMatches.length > 0) {
      const match = semanticMatches[0];

      // Check timing - published within reasonable window of campaign
      const daysSinceCampaign = daysBetween(
        new Date(match.exported_at || Date.now()),
        new Date(body.publishedAt || Date.now())
      );

      if (daysSinceCampaign <= 30) {
        const attribution = await recordAttribution(supabase, {
          fingerprintId: match.fingerprint_id,
          campaignId: match.campaign_id,
          orgId: body.orgId,
          sourceType: body.sourceType,
          sourceUrl: body.articleUrl,
          sourceOutlet: body.sourceOutlet,
          contentTitle: body.articleTitle,
          contentText: body.articleContent,
          publishedAt: body.publishedAt,
          confidence: match.similarity,
          matchType: 'semantic',
          matchDetails: {
            similarity: match.similarity,
            days_since_campaign: daysSinceCampaign
          },
          estimatedReach: body.estimatedReach
        });

        return new Response(JSON.stringify({
          match: true,
          attribution
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 4. Check contextual signals for remaining fingerprints (LOWER confidence)
    for (const fingerprint of fingerprints.slice(0, 5)) {
      const contextMatch = await checkContextualMatch(
        body.articleTitle,
        body.articleContent,
        body.sourceOutlet || '',
        body.publishedAt || new Date().toISOString(),
        fingerprint
      );

      if (contextMatch.score > 0.65) {
        const attribution = await recordAttribution(supabase, {
          fingerprintId: fingerprint.id,
          campaignId: fingerprint.campaign_id,
          orgId: body.orgId,
          sourceType: body.sourceType,
          sourceUrl: body.articleUrl,
          sourceOutlet: body.sourceOutlet,
          contentTitle: body.articleTitle,
          contentText: body.articleContent,
          publishedAt: body.publishedAt,
          confidence: contextMatch.score,
          matchType: 'contextual',
          matchDetails: contextMatch.details,
          estimatedReach: body.estimatedReach
        });

        return new Response(JSON.stringify({
          match: true,
          attribution
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // No match found
    return new Response(JSON.stringify({
      match: false,
      reason: 'no_sufficient_match'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in campaign-attribution-check:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

function findExactPhraseMatches(articleText: string, keyPhrases: string[]): string[] {
  const lowerArticle = articleText.toLowerCase();
  return keyPhrases.filter(phrase =>
    lowerArticle.includes(phrase.toLowerCase())
  );
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000)
  });
  return response.data[0].embedding;
}

function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function checkContextualMatch(
  articleTitle: string,
  articleContent: string,
  articleSource: string,
  articlePublishedAt: string,
  fingerprint: any
) {
  const prompt = `Determine if this article is likely from this campaign.

CAMPAIGN INFO:
- Key angles: ${JSON.stringify(fingerprint.unique_angles)}
- Key phrases: ${fingerprint.key_phrases.join(', ')}
- Expected channels: ${fingerprint.expected_channels?.join(', ') || 'unknown'}
- Content type: ${fingerprint.content_type}
- Exported: ${fingerprint.exported_at}

ARTICLE INFO:
- Title: ${articleTitle}
- Content: ${articleContent.slice(0, 1000)}
- Source: ${articleSource}
- Published: ${articlePublishedAt}

Return JSON:
{
  "is_match": true/false,
  "confidence": 0-1,
  "reasoning": "brief explanation",
  "matched_elements": ["what matched"]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });

  const result = JSON.parse(response.content[0].text);

  return {
    score: result.is_match ? result.confidence : 0,
    details: {
      reasoning: result.reasoning,
      matched_elements: result.matched_elements
    }
  };
}

async function recordAttribution(supabase: any, data: any) {
  // Check if attribution already exists
  const { data: existing } = await supabase
    .from('campaign_attributions')
    .select('id')
    .eq('fingerprint_id', data.fingerprintId)
    .eq('source_url', data.sourceUrl)
    .single();

  if (existing) {
    return { id: existing.id, status: 'already_exists' };
  }

  // Create new attribution
  const { data: attribution, error } = await supabase
    .from('campaign_attributions')
    .insert({
      org_id: data.orgId,
      fingerprint_id: data.fingerprintId,
      campaign_id: data.campaignId,
      source_type: data.sourceType,
      source_url: data.sourceUrl,
      source_outlet: data.sourceOutlet,
      content_title: data.contentTitle,
      content_text: data.contentText,
      published_at: data.publishedAt,
      confidence_score: data.confidence,
      match_type: data.matchType,
      match_details: data.matchDetails,
      estimated_reach: data.estimatedReach
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to record attribution: ${error.message}`);

  // Update fingerprint status
  await supabase
    .from('campaign_fingerprints')
    .update({ export_status: 'matched' })
    .eq('id', data.fingerprintId);

  return attribution;
}
Function 3.3: campaign-performance-get
Purpose: Get campaign performance metrics from attributions
File: supabase/functions/campaign-performance-get/index.ts
typescriptimport { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PerformanceRequest {
  campaignId: string;
  orgId: string;
}

Deno.serve(async (req) => {
  try {
    const { campaignId, orgId }: PerformanceRequest = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all attributions for this campaign
    const { data: attributions } = await supabase
      .from('campaign_attributions')
      .select(`
        *,
        fingerprint:campaign_fingerprints(
          key_phrases,
          content_type,
          expected_channels
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('org_id', orgId)
      .order('published_at', { ascending: false });

    if (!attributions) {
      return new Response(JSON.stringify({
        error: 'No attributions found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate metrics
    const metrics = {
      total_coverage: attributions.length,
      high_confidence_matches: attributions.filter(a => a.confidence_score > 0.8).length,
      total_reach: attributions.reduce((sum, a) => sum + (a.estimated_reach || 0), 0),

      sentiment_breakdown: {
        positive: attributions.filter(a => a.sentiment === 'positive').length,
        neutral: attributions.filter(a => a.sentiment === 'neutral').length,
        negative: attributions.filter(a => a.sentiment === 'negative').length
      },

      coverage_by_type: groupBy(attributions, 'source_type'),
      top_outlets: getTopOutlets(attributions),

      timeline: buildTimeline(attributions),

      avg_confidence: attributions.length
        ? attributions.reduce((sum, a) => sum + a.confidence_score, 0) / attributions.length
        : 0,

      verified_count: attributions.filter(a => a.user_verified).length,
      pending_verification: attributions.filter(a =>
        !a.user_verified && a.confidence_score < 0.9
      ).length
    };

    return new Response(JSON.stringify({
      campaignId,
      attributions,
      metrics
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in campaign-performance-get:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

function groupBy(arr: any[], key: string) {
  return arr.reduce((acc, item) => {
    const group = item[key] || 'unknown';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});
}

function getTopOutlets(attributions: any[]) {
  const outlets = attributions
    .filter(a => a.source_outlet)
    .reduce((acc: any, a) => {
      acc[a.source_outlet] = (acc[a.source_outlet] || 0) + 1;
      return acc;
    }, {});

  return Object.entries(outlets)
    .map(([outlet, count]) => ({ outlet, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);
}

function buildTimeline(attributions: any[]) {
  return attributions
    .filter(a => a.published_at)
    .map(a => ({
      date: a.published_at,
      outlet: a.source_outlet,
      type: a.source_type,
      confidence: a.confidence_score,
      reach: a.estimated_reach
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

PHASE 4: CLOSE THE LEARNING LOOP
Function 4.1: campaign-outcome-record
Purpose: Record campaign outcome in semantic memory after completion
File: supabase/functions/campaign-outcome-record/index.ts
typescriptimport { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface OutcomeRequest {
  campaignId: string;
  strategyId: string;
  orgId: string;
}

Deno.serve(async (req) => {
  try {
    const { campaignId, strategyId, orgId }: OutcomeRequest = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get campaign performance
    const performance = await getCampaignPerformance(supabase, campaignId, orgId);

    // 2. Get original strategy
    const { data: strategy } = await supabase
      .from('niv_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    // 3. Extract learnings using AI
    const learnings = await extractLearnings(performance, strategy);

    // 4. Determine outcome type
    const outcomeType = determineOutcomeType(performance);
    const effectivenessScore = calculateEffectiveness(performance);

    // 5. Record outcome
    const { data: outcome } = await supabase
      .from('strategy_outcomes')
      .insert({
        strategy_id: strategyId,
        org_id: orgId,
        outcome_type: outcomeType,
        effectiveness_score: effectivenessScore,
        key_learnings: learnings,
        success_factors: {
          coverage_count: performance.total_coverage,
          reach: performance.total_reach,
          avg_confidence: performance.avg_confidence,
          top_outlets: performance.top_outlets,
          pattern_used: strategy.content.campaign_pattern,
          sentiment_positive_rate: performance.sentiment_breakdown.positive /
            (performance.total_coverage || 1)
        },
        failure_factors: identifyFailureFactors(performance),
        total_coverage: performance.total_coverage,
        total_reach: performance.total_reach,
        avg_confidence: performance.avg_confidence
      })
      .select()
      .single();

    // 6. Update semantic memory salience
    await supabase
      .from('strategy_embeddings')
      .update({
        salience: supabase.raw('LEAST(salience * 1.5, 1.0)'), // Boost but cap at 1.0
        access_count: supabase.raw('access_count + 1'),
        last_accessed_at: new Date().toISOString()
      })
      .eq('strategy_id', strategyId);

    // 7. Create waypoints to similar successful campaigns
    if (outcomeType === 'success') {
      await createSuccessWaypoints(supabase, strategyId, orgId);
    }

    return new Response(JSON.stringify({
      success: true,
      outcome
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in campaign-outcome-record:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function getCampaignPerformance(supabase: any, campaignId: string, orgId: string) {
  const { data: attributions } = await supabase
    .from('campaign_attributions')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('org_id', orgId);

  return {
    total_coverage: attributions?.length || 0,
    total_reach: attributions?.reduce((sum: number, a: any) =>
      sum + (a.estimated_reach || 0), 0) || 0,
    avg_confidence: attributions?.length
      ? attributions.reduce((sum: number, a: any) =>
          sum + a.confidence_score, 0) / attributions.length
      : 0,
    sentiment_breakdown: {
      positive: attributions?.filter((a: any) => a.sentiment === 'positive').length || 0,
      neutral: attributions?.filter((a: any) => a.sentiment === 'neutral').length || 0,
      negative: attributions?.filter((a: any) => a.sentiment === 'negative').length || 0
    },
    top_outlets: getTopOutlets(attributions || [])
  };
}

function getTopOutlets(attributions: any[]) {
  const outlets = attributions
    .filter(a => a.source_outlet)
    .reduce((acc: any, a) => {
      acc[a.source_outlet] = (acc[a.source_outlet] || 0) + 1;
      return acc;
    }, {});

  return Object.entries(outlets)
    .map(([outlet, count]) => ({ outlet, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5);
}

function determineOutcomeType(performance: any): string {
  if (performance.total_coverage >= 10 && performance.avg_confidence > 0.8) {
    return 'success';
  } else if (performance.total_coverage >= 5) {
    return 'partial';
  } else if (performance.total_coverage >= 1) {
    return 'minimal';
  } else {
    return 'failed';
  }
}

function calculateEffectiveness(performance: any): number {
  let score = 0;

  // Coverage component (0-2 points)
  score += Math.min(performance.total_coverage / 10, 1) * 2;

  // Reach component (0-2 points)
  score += Math.min(performance.total_reach / 1000000, 1) * 2;

  // Confidence component (0-1 point)
  score += performance.avg_confidence;

  return Math.min(score, 5);
}

function identifyFailureFactors(performance: any): any {
  const factors: any = {};

  if (performance.total_coverage < 3) {
    factors.low_coverage = true;
  }

  if (performance.avg_confidence < 0.7) {
    factors.low_confidence_matches = true;
  }

  if (performance.sentiment_breakdown.negative > performance.sentiment_breakdown.positive) {
    factors.negative_sentiment = true;
  }

  return factors;
}

async function extractLearnings(performance: any, strategy: any): Promise<string[]> {
  const prompt = `Analyze this campaign outcome and extract 3-5 key learnings.

CAMPAIGN STRATEGY:
Type: ${strategy.strategy_type}
Pattern: ${strategy.content?.campaign_pattern || 'unknown'}
Key Messages: ${JSON.stringify(strategy.content?.key_messages || [])}

PERFORMANCE:
- Coverage: ${performance.total_coverage} articles/mentions
- Reach: ${performance.total_reach.toLocaleString()}
- Avg Confidence: ${(performance.avg_confidence * 100).toFixed(0)}%
- Sentiment: ${performance.sentiment_breakdown.positive} positive, ${performance.sentiment_breakdown.negative} negative
- Top outlets: ${performance.top_outlets.map((o: any) => o.outlet).join(', ')}

Extract key learnings as brief, actionable insights (1 sentence each).
What worked? What didn't? What should we do differently next time?

Return as JSON: {"learnings": ["learning1", "learning2", ...]`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });

  const result = JSON.parse(response.content[0].text);
  return result.learnings || [];
}

async function createSuccessWaypoints(supabase: any, strategyId: string, orgId: string) {
  // Find other successful strategies
  const { data: successfulStrategies } = await supabase
    .from('strategy_outcomes')
    .select('strategy_id, effectiveness_score')
    .eq('org_id', orgId)
    .eq('outcome_type', 'success')
    .neq('strategy_id', strategyId)
    .gte('effectiveness_score', 3.5)
    .order('effectiveness_score', { ascending: false })
    .limit(5);

  if (!successfulStrategies || successfulStrategies.length === 0) return;

  // Create waypoints to other successful campaigns
  const waypoints = successfulStrategies.map((s: any) => ({
    org_id: orgId,
    from_strategy_id: strategyId,
    to_strategy_id: s.strategy_id,
    weight: s.effectiveness_score / 5, // Normalize to 0-1
    link_type: 'successful_pattern'
  }));

  await supabase
    .from('strategy_waypoints')
    .insert(waypoints);
}

PHASE 5: INTEGRATION POINTS
Integration 5.1: Update Existing Memory Vault Function
Add this to your existing niv-memory-vault function (or wherever strategies are saved):
typescript// EXISTING CODE: After strategy is saved to niv_strategies table
const { data: strategy } = await supabase
  .from('niv_strategies')
  .insert({
    org_id,
    strategy_type,
    content,
    metadata
  })
  .select()
  .single();

// NEW: Generate semantic embeddings asynchronously
fetch(`${SUPABASE_URL}/functions/v1/semantic-memory-add`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    strategyId: strategy.id,
    orgId: org_id
  })
}).catch(err => console.error('Embedding generation failed:', err));

return strategy;
Integration 5.2: Update Content Export Flow
Add fingerprinting when user exports content:
typescript// In your content export handler (wherever user clicks "Download" or "Export")

async function handleContentExport(contentId: string, format: string) {
  const supabase = createClient(...);

  // Get the content
  const { data: content } = await supabase
    .from('generated_content') // Or wherever your content is stored
    .select('*')
    .eq('id', contentId)
    .single();

  // CREATE FINGERPRINT before export
  await fetch(`${SUPABASE_URL}/functions/v1/campaign-fingerprint-create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      campaignId: content.campaign_id,
      contentId: content.id,
      content: content.text,
      contentType: content.type,
      orgId: content.org_id,
      exportFormat: format
    })
  });

  // Then return the file for download as usual
  return generateExportFile(content, format);
}
Integration 5.3: Update Intelligence Monitoring
Add attribution checking to your existing monitoring:
typescript// In your existing monitor-stage-1, monitor-stage-2, or wherever articles are processed

async function processArticle(article: any, orgId: string) {
  // Your existing article processing...

  // NEW: Check for campaign attribution
  const attributionResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/campaign-attribution-check`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orgId,
        articleContent: article.content,
        articleTitle: article.title,
        articleUrl: article.url,
        sourceType: 'news',
        sourceOutlet: article.source,
        publishedAt: article.published_at,
        estimatedReach: estimateReach(article.source)
      })
    }
  );

  const attribution = await attributionResponse.json();

  if (attribution.match) {
    // Notify user of campaign coverage
    await notifyUser({
      type: 'campaign_coverage',
      orgId,
      campaignId: attribution.attribution.campaign_id,
      message: `Your campaign got coverage in ${article.source}`,
      url: article.url
    });
  }

  return article;
}

function estimateReach(source: string): number {
  // Estimate based on known outlet sizes
  const estimates: Record<string, number> = {
    'TechCrunch': 10000000,
    'The Verge': 8000000,
    'Wired': 5000000,
    // ... add more
  };
  return estimates[source] || 100000; // Default estimate
}
Integration 5.4: Enhance NIV Strategic Framework
Query semantic memory before generating strategies:
typescript// In niv-strategic-framework or niv-blueprint-orchestrator-v3

async function generateFramework(goal: string, orgId: string) {
  const discovery = await mcpDiscovery(orgId);
  const research = await nivFireplexity(goal);

  // NEW: Query similar past frameworks
  const pastFrameworksResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/semantic-memory-query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: goal,
        orgId,
        sectors: ['procedural', 'reflective'],
        strategyType: 'niv_framework',
        limit: 5
      })
    }
  );

  const pastFrameworks = await pastFrameworksResponse.json();

  // Extract learnings from successful past campaigns
  const learnings = pastFrameworks
    .filter((f: any) => f.relevance_score > 0.5)
    .map((f: any) => ({
      pattern: f.content?.campaign_pattern,
      what_worked: f.content?.success_factors,
      relevance: f.relevance_score
    }));

  // Generate strategy with historical context
  return await generateStrategy({
    goal,
    discovery,
    research,
    past_learnings: learnings // NEW: Inform with history
  });
}


$$
