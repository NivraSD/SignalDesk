# Memory Vault Playbook System Design

## Overview
Playbooks are pre-synthesized, compact guides that tell NIV Content how to create specific types of content based on past successful patterns. They replace expensive real-time analysis with cached intelligence.

## Schema Design

### Playbook Structure
```typescript
interface Playbook {
  id: string
  organization_id: string

  // Identification
  content_type: string  // "media-pitch", "thought-leadership", etc.
  topic: string         // "energy", "aviation", "general"

  // Metadata
  created_at: string
  updated_at: string
  version: number
  based_on: {
    content_count: number      // How many pieces analyzed
    date_range: {
      from: string
      to: string
    }
    avg_execution_score: number  // Average success rate
  }

  // The Intelligence (compact, actionable)
  guidance: {
    // What messaging works
    proven_hooks: Array<{
      hook: string              // "Lead with specific data/numbers"
      success_rate: number      // 0.75 (75%)
      example: string           // "DOE invokes authority over $2B grid..."
    }>

    // Voice and tone
    brand_voice: {
      tone: string              // "Authoritative but accessible"
      style_points: string[]    // ["Use active voice", "Short paragraphs"]
      avoid: string[]           // ["Jargon", "Hype", "Superlatives"]
    }

    // Structure that works
    proven_structure: {
      format: string            // "Problem → Solution → CTA"
      sections: Array<{
        name: string
        purpose: string
        length: string          // "2-3 paragraphs"
      }>
    }

    // Key insights
    success_patterns: string[]  // ["Include data in first paragraph", ...]
    failure_patterns: string[]  // ["Avoid generic sustainability claims", ...]

    // Contextual data
    typical_length: {
      words: { min: number, max: number, optimal: number }
    }
  }

  // Target audience intelligence
  audience: {
    primary: string[]           // ["Energy policy journalists"]
    tier_1_contacts: Array<{
      name: string
      outlet: string
      beat: string
      response_rate?: number
    }>
    engagement_patterns: string[]  // ["Responds well to data-driven pitches"]
  }

  // Reference examples (NOT full content, just pointers)
  top_performers: Array<{
    id: string                  // Reference to content_library
    title: string
    execution_score: number
    why_successful: string      // Brief explanation
  }>

  // Company positioning for this topic
  company_context?: {
    positioning: string         // "Infrastructure financing leader"
    key_differentiators: string[]
    relevant_products: string[]
  }
}
```

### Storage Options

**Option A: New `playbooks` table** (Recommended)
```sql
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  content_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  playbook JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  UNIQUE(organization_id, content_type, topic)
);

CREATE INDEX idx_playbooks_org_type_topic
  ON playbooks(organization_id, content_type, topic);
```

**Option B: Store in `content_library` with special type**
- Pro: Uses existing structure
- Con: Mixes data types, harder to query

**Decision: Go with Option A (dedicated table)**

## Playbook Generation Strategy

### When to Generate

1. **On-demand (First request)**
   ```
   User requests: media-pitch + energy
   → Check cache: No playbook exists
   → Generate now (takes 3-5 seconds)
   → Cache for future
   → Return playbook
   ```

2. **Background job (Scheduled)**
   ```
   Run nightly:
   → Find active content_type + topic combinations
   → Regenerate playbooks that are stale (>7 days old)
   → Only if sufficient data (min 3 pieces of content)
   ```

3. **Triggered by success**
   ```
   User marks content as "successful" (execution_score > 0.8)
   → Queue playbook refresh for that type + topic
   → Ensures playbooks reflect latest wins
   ```

### Minimum Data Requirements

To generate a playbook:
- **Minimum 3 pieces** of content for that type + topic
- At least **1 piece** with execution tracking
- Prefer content from **last 90 days** (but include older if limited data)
- Fallback to "general" topic if specific topic has insufficient data

### Synthesis Process

```typescript
async function synthesizePlaybook(
  organizationId: string,
  contentType: string,
  topic: string
): Promise<Playbook> {

  // 1. Gather relevant content
  const content = await semanticSearch({
    organization_id: organizationId,
    content_type: contentType,
    topic_query: topic,
    min_items: 3,
    max_items: 20,
    sort_by: ['execution_score DESC', 'created_at DESC']
  })

  // 2. Get brand guidelines (if exist)
  const brandGuidelines = await getBrandGuidelines(organizationId)

  // 3. Get company context for this topic
  const companyContext = await getCompanyContext(organizationId, topic)

  // 4. Use Claude to synthesize patterns
  const synthesis = await callClaude({
    system: "You are a strategic communications analyst synthesizing patterns from successful content.",
    prompt: `
      TASK: Create a playbook for writing ${contentType} about ${topic}

      CONTENT TO ANALYZE (${content.length} pieces):
      ${content.map(c => `
        Title: ${c.title}
        Success: ${c.execution_score || 'Not tracked'}
        Content: ${c.content.substring(0, 1000)}
        ${c.feedback ? `Feedback: ${c.feedback}` : ''}
      `).join('\n---\n')}

      ${brandGuidelines ? `BRAND GUIDELINES:\n${brandGuidelines}` : ''}

      ${companyContext ? `COMPANY CONTEXT:\n${companyContext}` : ''}

      SYNTHESIZE into a compact playbook with:
      1. What messaging hooks work best? (with success rates if trackable)
      2. What voice/tone to use?
      3. What structure works? (format, sections, flow)
      4. What patterns lead to success?
      5. What patterns lead to failure?
      6. Typical length and format specs?
      7. Target audience insights?

      BE SPECIFIC. Use examples from the content. Cite success rates.
      KEEP IT COMPACT (max 500 words total).
    `,
    format: 'json'  // Request structured JSON output
  })

  // 5. Build playbook object
  return {
    id: generateId(),
    organization_id: organizationId,
    content_type: contentType,
    topic: topic,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    based_on: {
      content_count: content.length,
      date_range: {
        from: content[content.length - 1].created_at,
        to: content[0].created_at
      },
      avg_execution_score: calculateAverage(content.map(c => c.execution_score))
    },
    guidance: synthesis.guidance,
    audience: synthesis.audience,
    top_performers: content
      .filter(c => c.execution_score > 0.7)
      .slice(0, 3)
      .map(c => ({
        id: c.id,
        title: c.title,
        execution_score: c.execution_score,
        why_successful: synthesis.whySuccessful[c.id] || 'Strong performance'
      })),
    company_context: synthesis.company_context
  }
}
```

## Integration with NIV Content

### Current Flow (After agentic loop fix)
```
NIV Content → search_memory_vault → Ad-hoc summary → Claude
```

### New Flow (With playbooks)
```
NIV Content → getPlaybook(type, topic) → Cached playbook → Claude
```

### Implementation

Replace the ad-hoc summary generation with playbook retrieval:

```typescript
// In search_memory_vault handler (niv-content-intelligent-v2/index.ts)

// Instead of creating ad-hoc summary:
const playbookSummary = formatAdHocSummary(results)

// Use playbook system:
const playbook = await getOrCreatePlaybook({
  organizationId,
  contentType: toolUse.input.content_type,
  topic: inferTopic(toolUse.input.query),  // Extract topic from query
  fallbackToResults: results  // Use if no playbook exists yet
})

const playbookSummary = formatPlaybookForClaude(playbook)
```

## API Design

### New Edge Function: `generate-playbook`

```typescript
// supabase/functions/generate-playbook/index.ts

serve(async (req) => {
  const { organizationId, contentType, topic, force = false } = await req.json()

  // Check cache (unless force=true)
  if (!force) {
    const cached = await getPlaybook(organizationId, contentType, topic)
    if (cached && !isStale(cached)) {
      return Response.json(cached)
    }
  }

  // Generate new playbook
  const playbook = await synthesizePlaybook(organizationId, contentType, topic)

  // Save to database
  await savePlaybook(playbook)

  return Response.json(playbook)
})
```

### Helper Functions

```typescript
// In niv-content-intelligent-v2/index.ts or shared module

async function getOrCreatePlaybook(params: {
  organizationId: string
  contentType: string
  topic: string
  fallbackToResults?: any[]
}): Promise<Playbook | AdHocSummary> {

  // Try to get cached playbook
  const cached = await getPlaybook(
    params.organizationId,
    params.contentType,
    params.topic
  )

  if (cached && !isStale(cached, 7)) { // 7 days
    return cached
  }

  // Check if we have enough data to generate playbook
  const contentCount = await countContent(
    params.organizationId,
    params.contentType,
    params.topic
  )

  if (contentCount >= 3) {
    // Generate playbook asynchronously (don't block)
    generatePlaybookAsync(params.organizationId, params.contentType, params.topic)

    // Return cached (even if stale) for now
    if (cached) return cached
  }

  // Fallback to ad-hoc summary
  return createAdHocSummary(params.fallbackToResults)
}

function isStale(playbook: Playbook, days: number): boolean {
  const age = Date.now() - new Date(playbook.updated_at).getTime()
  return age > days * 24 * 60 * 60 * 1000
}

function inferTopic(query: string): string {
  // Simple keyword extraction
  const keywords = ['energy', 'aviation', 'technology', 'finance']
  const lower = query.toLowerCase()

  for (const keyword of keywords) {
    if (lower.includes(keyword)) return keyword
  }

  return 'general'
}
```

## Next Steps

1. Create `playbooks` table migration
2. Build `generate-playbook` edge function
3. Create helper functions for get/cache/synthesize
4. Integrate into NIV Content's Memory Vault search
5. Add manual trigger in Memory Vault UI (optional)
6. Schedule background job for refresh (optional)

## Success Metrics

- **Cache hit rate**: % of requests served from cache
- **Generation time**: How long to create playbook
- **Playbook freshness**: Age of playbooks being used
- **Content improvement**: Do playbooks lead to better content?

---

*This is a living document. Update as we build and learn.*
