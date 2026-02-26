# Intelligent Memory Vault Implementation Plan

## Overview
Transform Memory Vault from dumb keyword search into an AI-powered knowledge system that understands, learns, and recommends.

## Phase 1: Semantic Search (Week 1)
**Goal:** Replace keyword matching with meaning-based search

### 1.1 Add Vector Support
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns
ALTER TABLE content_library ADD COLUMN embedding vector(1536);
ALTER TABLE opportunities ADD COLUMN embedding vector(1536);

-- Create vector indexes for fast search
CREATE INDEX ON content_library USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON opportunities USING ivfflat (embedding vector_cosine_ops);
```

### 1.2 Create Embedding Generator
```typescript
// supabase/functions/generate-embeddings/index.ts
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1,
      messages: [{
        role: 'user',
        content: `Generate a semantic embedding for: ${text}`
      }],
      // Use embedding endpoint when available
    })
  })

  // For now, use OpenAI embeddings as Claude doesn't have embedding API yet
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  })

  const data = await embeddingResponse.json()
  return data.data[0].embedding
}
```

### 1.3 Update Memory Vault Save
```typescript
// When saving content, generate embedding
async function saveContent(content: ContentItem) {
  // Generate embedding from title + summary + first 500 chars
  const textForEmbedding = `${content.title}\n${content.content.substring(0, 500)}`
  const embedding = await generateEmbedding(textForEmbedding)

  await supabase.from('content_library').insert({
    ...content,
    embedding
  })
}
```

### 1.4 Semantic Search Function
```typescript
async function semanticSearch(query: string, limit: number = 5) {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query)

  // Search by cosine similarity
  const { data } = await supabase.rpc('match_content', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit
  })

  return data
}
```

**Speed Gain:** 10x faster search (vector index vs full table scan)

---

## Phase 2: AI Content Analysis (Week 2)
**Goal:** Understand what each piece of content actually means

### 2.1 Add Analysis Schema
```sql
-- Add AI analysis columns
ALTER TABLE content_library ADD COLUMN ai_summary TEXT;
ALTER TABLE content_library ADD COLUMN ai_themes TEXT[];
ALTER TABLE content_library ADD COLUMN ai_stakeholders TEXT[];
ALTER TABLE content_library ADD COLUMN ai_strategic_intent TEXT;
ALTER TABLE content_library ADD COLUMN ai_mentioned_companies TEXT[];
ALTER TABLE content_library ADD COLUMN ai_tone TEXT;
ALTER TABLE content_library ADD COLUMN ai_timeframe TEXT;

-- Same for opportunities
ALTER TABLE opportunities ADD COLUMN ai_summary TEXT;
ALTER TABLE opportunities ADD COLUMN ai_themes TEXT[];
-- ... etc
```

### 2.2 Content Analyzer Function
```typescript
// supabase/functions/analyze-content/index.ts
async function analyzeContent(content: string, title: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // Fast and cheap for analysis
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Analyze this content and extract key information:

TITLE: ${title}

CONTENT:
${content}

Extract and return as JSON:
{
  "summary": "2-3 sentence summary of what this content is about",
  "key_themes": ["theme1", "theme2", "theme3"],
  "strategic_intent": "what this content is trying to achieve",
  "target_stakeholders": ["stakeholder1", "stakeholder2"],
  "mentioned_companies": ["company1", "company2"],
  "mentioned_people": ["person1", "person2"],
  "tone": "aggressive|collaborative|defensive|opportunistic",
  "timeframe": "when this is relevant (e.g., 'Q4 2024', 'immediate', 'ongoing')",
  "action_items": ["action1", "action2"],
  "success_metrics": ["metric1", "metric2"]
}`
      }]
    })
  })

  const result = await response.json()
  const analysis = JSON.parse(result.content[0].text)
  return analysis
}
```

### 2.3 Auto-Analyze on Save
```typescript
// Update save function to analyze
async function saveContentWithAnalysis(content: ContentItem) {
  // Generate embedding
  const embedding = await generateEmbedding(content.title + ' ' + content.content)

  // Generate AI analysis
  const analysis = await analyzeContent(content.content, content.title)

  // Save with enriched data
  await supabase.from('content_library').insert({
    ...content,
    embedding,
    ai_summary: analysis.summary,
    ai_themes: analysis.key_themes,
    ai_stakeholders: analysis.target_stakeholders,
    ai_strategic_intent: analysis.strategic_intent,
    ai_mentioned_companies: analysis.mentioned_companies,
    ai_tone: analysis.tone,
    ai_timeframe: analysis.timeframe
  })
}
```

**Speed Gain:** Claude gets 200-char summary instead of 5000-char raw content (25x less to read)

---

## Phase 3: Smart Search & Recommendations (Week 3)
**Goal:** Combine semantic search + AI analysis + usage patterns

### 3.1 Hybrid Search Function
```typescript
async function intelligentSearch(query: string, context: SearchContext) {
  // 1. Semantic search for relevant content
  const semanticResults = await semanticSearch(query, 10)

  // 2. Keyword search for exact matches (backup)
  const keywordResults = await keywordSearch(query, 5)

  // 3. Contextual filtering
  const filtered = filterByContext(semanticResults, context)

  // 4. Score and rank
  const scored = scoreResults(filtered, {
    semanticSimilarity: 0.4,
    usageFrequency: 0.2,
    successRate: 0.2,
    recency: 0.1,
    relevanceToContext: 0.1
  })

  // 5. Deduplicate and return top N
  return deduplicateAndLimit(scored, context.limit)
}

interface SearchContext {
  organizationId: string
  currentCampaign?: string
  userIntent?: 'research' | 'template' | 'inspiration'
  stakeholder?: string
  contentType?: string
  limit: number
}
```

### 3.2 Contextual Recommendations
```typescript
async function getRecommendations(context: {
  currentQuery: string
  organizationId: string
  recentActivity: string[]
}) {
  const recommendations = []

  // Find similar successful content
  const similar = await supabase.rpc('find_similar_successful_content', {
    query_embedding: await generateEmbedding(context.currentQuery),
    min_success_rate: 0.7,
    org_id: context.organizationId
  })

  // Find content used together
  const coOccurrence = await findContentUsedTogether(context.recentActivity)

  // Find trending patterns
  const trending = await findTrendingContent(context.organizationId)

  return {
    similar_successful: similar.slice(0, 3),
    often_used_together: coOccurrence.slice(0, 3),
    trending_now: trending.slice(0, 3)
  }
}
```

### 3.3 Smart Summary for Claude
```typescript
// Instead of returning raw content, return intelligence
function formatIntelligentResults(results: any[]) {
  return results.map(r => ({
    id: r.id,
    title: r.title,

    // AI-generated summary (fast to read)
    quick_summary: r.ai_summary,

    // Key extracted info
    themes: r.ai_themes,
    strategic_intent: r.ai_strategic_intent,
    stakeholders: r.ai_stakeholders,

    // Success metrics
    usage_score: calculateUsageScore(r),
    success_indicators: r.success_rate > 0.7 ? '✅ High success rate' : '',

    // Why it's relevant
    relevance_reason: `Matches themes: ${r.matching_themes.join(', ')}`,

    // Only include full content if needed
    full_content: r.content // Claude can ask for this if needed
  }))
}
```

**Speed Gain:** Claude gets compact, pre-analyzed data - makes decisions 5x faster

---

## Phase 4: Usage Intelligence & Learning (Week 4)
**Goal:** Learn from what works and surface it

### 4.1 Track Usage
```sql
-- Usage tracking table
CREATE TABLE content_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_library(id),
  organization_id TEXT,
  action TEXT, -- 'viewed', 'used', 'executed', 'adapted'
  context JSONB, -- What campaign, stakeholder, etc
  outcome TEXT, -- 'successful', 'neutral', 'unsuccessful'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated metrics
CREATE TABLE content_metrics (
  content_id UUID PRIMARY KEY REFERENCES content_library(id),
  total_views INT DEFAULT 0,
  total_uses INT DEFAULT 0,
  total_executions INT DEFAULT 0,
  success_rate FLOAT,
  avg_rating FLOAT,
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Track When Content is Used
```typescript
async function trackContentUsage(contentId: string, action: string, outcome?: string) {
  await supabase.from('content_usage').insert({
    content_id: contentId,
    organization_id: currentOrg,
    action,
    outcome,
    context: {
      campaign: currentCampaign,
      stakeholder: currentStakeholder
    }
  })

  // Update aggregated metrics
  await supabase.rpc('update_content_metrics', { content_id: contentId })
}
```

### 4.3 Surface High-Performing Content
```typescript
async function getTopPerformingContent(params: {
  contentType?: string
  theme?: string
  stakeholder?: string
  limit: number
}) {
  return await supabase
    .from('content_library')
    .select(`
      *,
      metrics:content_metrics(success_rate, total_uses)
    `)
    .gte('metrics.success_rate', 0.7)
    .gte('metrics.total_uses', 3)
    .order('metrics.success_rate', { ascending: false })
    .limit(params.limit)
}
```

**Speed Gain:** Pre-computed metrics = instant ranking

---

## Phase 5: Content Relationships (Week 5)
**Goal:** Understand how content evolves and relates

### 5.1 Relationship Tracking
```sql
CREATE TABLE content_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES content_library(id),
  target_id UUID REFERENCES content_library(id),
  relationship_type TEXT, -- 'evolved_from', 'adapted_to', 'similar_to', 'used_with'
  strength FLOAT, -- 0-1 confidence
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Auto-Detect Relationships
```typescript
async function detectRelationships(newContentId: string) {
  const newContent = await getContent(newContentId)
  const newEmbedding = newContent.embedding

  // Find semantically similar
  const similar = await supabase.rpc('find_similar_content', {
    query_embedding: newEmbedding,
    threshold: 0.85,
    exclude_id: newContentId
  })

  // Create similarity relationships
  for (const sim of similar) {
    await supabase.from('content_relationships').insert({
      source_id: newContentId,
      target_id: sim.id,
      relationship_type: 'similar_to',
      strength: sim.similarity
    })
  }

  // Detect evolution (if new content references old)
  if (newContent.metadata?.based_on) {
    await supabase.from('content_relationships').insert({
      source_id: newContentId,
      target_id: newContent.metadata.based_on,
      relationship_type: 'evolved_from',
      strength: 1.0
    })
  }
}
```

### 5.3 Relationship-Based Recommendations
```typescript
async function getRelatedContent(contentId: string) {
  return await supabase
    .from('content_relationships')
    .select(`
      target:target_id(id, title, ai_summary),
      relationship_type,
      strength
    `)
    .eq('source_id', contentId)
    .gte('strength', 0.7)
    .order('strength', { ascending: false })
}
```

---

## Phase 6: Proactive Intelligence (Week 6)
**Goal:** Memory Vault suggests things before you ask

### 6.1 Pattern Detection
```typescript
async function detectPatterns(organizationId: string) {
  // Detect recurring needs
  const patterns = await supabase.rpc('detect_usage_patterns', {
    org_id: organizationId,
    lookback_days: 90
  })

  return patterns.map(p => ({
    pattern: p.pattern_type,
    frequency: p.occurrence_count,
    suggestion: generateSuggestion(p)
  }))
}

// Examples of detected patterns:
// - "You create competitor response content every earnings season"
// - "Your investor presentations always include these 3 themes"
// - "Content about ESG performs 2x better than average"
```

### 6.2 Proactive Suggestions
```typescript
async function getProactiveSuggestions(context: {
  organizationId: string
  currentActivity: string
  recentContent: string[]
}) {
  const suggestions = []

  // Based on current activity
  if (context.currentActivity === 'opportunity_execution') {
    const similarSuccessful = await findSimilarSuccessfulOpportunities(context.organizationId)
    suggestions.push({
      type: 'template',
      message: `💡 Similar opportunities had 85% success when they included these elements:`,
      content: similarSuccessful
    })
  }

  // Based on gaps
  const gaps = await detectContentGaps(context.organizationId)
  if (gaps.length > 0) {
    suggestions.push({
      type: 'gap',
      message: `📋 You're missing content for: ${gaps.join(', ')}`,
      action: 'create_from_template'
    })
  }

  // Based on trends
  const trends = await detectTrends(context.organizationId)
  suggestions.push({
    type: 'trend',
    message: `📈 Trending: ${trends[0].theme} (${trends[0].growth}% increase)`,
    content: trends[0].examples
  })

  return suggestions
}
```

---

## Complete Speed Comparison

### Before (Dumb Search):
```
User query → SQL ILIKE search (1-2s)
  → Return 5000 chars × 5 results = 25,000 chars
  → Claude reads all (2-3s)
  → Claude analyzes on-the-fly (2-3s)
  → Claude generates response (1-2s)
TOTAL: 6-10 seconds
```

### After (Intelligent Memory):
```
User query → Generate embedding (100ms)
  → Vector search with pre-computed scores (200ms)
  → Return pre-analyzed summaries (200 chars × 5 = 1,000 chars)
  → Claude reads compact data (300ms)
  → Claude generates response (500ms)
TOTAL: 1.1 seconds
```

**9x faster!**

---

## Cost Comparison

### Current:
- Every search: Read 25,000 chars
- Claude analyzes raw content: $$$
- **~$0.02 per search**

### With Intelligence:
- Embeddings: $0.0001 per item (one-time)
- Analysis: $0.001 per item (one-time, Haiku)
- Search: Read 1,000 chars
- **~$0.002 per search** (10x cheaper)

Plus: Pre-computation means faster response = happier users!

---

## Implementation Priority

1. **Week 1: Semantic Search** ← Start here (biggest speed win)
2. **Week 2: AI Analysis** ← Second (quality win)
3. **Week 3: Smart Recommendations** ← Third (UX win)
4. **Week 4-6: Advanced features** ← Nice to have

Want me to start with Phase 1 (Semantic Search)?
