# Memory Vault V2 - NIV Integration Updates
**Date:** October 26, 2025
**Purpose:** Document new integration points added after Phase 2 enhancements

---

## What's New Since Original Integration Guide

The original NIV integration guide covered basic brand context usage. We've since added:

### Phase 2 - OpenMemory Enhancements (Oct 26, 2025)
1. ✅ **Salience Scoring** - Time-based relevance decay
2. ✅ **Composite Retrieval Scoring** - Multi-factor ranking algorithm
3. ✅ **Explainable Retrieval** - Transparent reasoning for recommendations
4. ✅ **Salience Boosting** - Automatic promotion of accessed content

### Campaign Attribution System (Oct 26, 2025)
1. ✅ **Content Fingerprinting** - Automatic on export
2. ✅ **Attribution Tracking** - AI-powered media coverage detection
3. ✅ **Success Learning** - Salience boost for proven campaigns (1.5x)
4. ✅ **Waypoint Graphs** - Link similar successful strategies
5. ✅ **AI Learnings Extraction** - Claude analyzes outcomes

---

## New Integration Points for NIV

### 1. Composite Scoring for Template Search

**What Changed:**
NIV memory vault API now uses composite scoring instead of simple similarity search.

**Formula:**
```
score = 0.4 × similarity +
        0.2 × salience +
        0.1 × recency +
        0.1 × relationship +
        0.2 × execution_success
```

**How NIV Benefits:**
- Finds proven templates first (execution success)
- Prioritizes recently-used patterns (salience + recency)
- Surfaces related content (relationship)
- Still uses semantic similarity as primary factor

**Implementation:**

```typescript
// NIV content generation - finding best template
const searchResponse = await supabase.functions.invoke('niv-memory-vault', {
  body: {
    action: 'search',
    query: 'press release for product launch',
    organizationId: org.id,
    contentType: 'press-release',
    limit: 5
  }
})

// Response now includes composite scores and explanations
searchResponse.data.results.forEach(result => {
  console.log('📄 Template:', result.title)
  console.log('⭐ Score:', result.composite_score) // 0-5 range
  console.log('💡 Why:', result.retrieval_reason)
  // "Proven successful • High relevance • Recently used"
})
```

**API Response Structure:**
```typescript
{
  results: [
    {
      id: "uuid",
      title: "Product Launch Press Release",
      content: "...",
      content_type: "press-release",

      // Composite scoring
      composite_score: 4.2,        // 0-5 total score
      similarity_score: 0.92,      // Semantic match
      salience_score: 0.85,        // Time-based relevance
      recency_score: 0.78,         // How recent
      relationship_score: 0.5,     // Connected content
      execution_score: 0.9,        // Proven success

      // Explainability
      retrieval_reason: "Proven successful • High relevance • Recently used",

      // Metadata
      executed: true,
      last_accessed_at: "2025-10-20T...",
      access_count: 15
    }
  ]
}
```

---

### 2. Salience Awareness

**What Changed:**
All content now has salience scores that decay over time unless accessed.

**Decay Rates (Daily):**
- Press releases: 0.5%
- Social posts: 1.0%
- Thought leadership: 0.2%
- Templates: 0.3%
- Brand assets: 0.2%

**How NIV Benefits:**
- Old, unused content naturally fades from results
- Recently-used templates stay prominent
- Popular content maintains relevance

**No Code Changes Required:**
Salience scoring happens automatically. NIV just gets better results.

**Optional - Boost Salience on Use:**
```typescript
// After NIV uses a template successfully
await supabase.rpc('boost_salience_on_access', {
  content_id: templateId,
  boost_amount: 0.05  // +5% salience
})
// Template now more likely to appear in future searches
```

---

### 3. Explainable Retrieval

**What Changed:**
Every search result includes a human-readable explanation of WHY it was retrieved.

**How NIV Can Use This:**

```typescript
// In NIV UI - show why template was recommended
const template = searchResponse.data.results[0]

return (
  <div className="template-card">
    <h3>{template.title}</h3>
    <div className="explanation">
      <Lightbulb className="w-4 h-4" />
      {template.retrieval_reason}
    </div>
    <div className="metrics">
      <span>Relevance: {(template.similarity_score * 100).toFixed(0)}%</span>
      <span>Success Rate: {(template.execution_score * 100).toFixed(0)}%</span>
      <span>Used {template.access_count} times</span>
    </div>
  </div>
)
```

**Explanation Patterns:**
- "Proven successful • High relevance • Recently used"
- "Perfect match • Frequently used"
- "Highly relevant • Fresh content"
- "Similar successful campaigns"

**Benefits:**
- Users trust recommendations more
- Transparent AI decisions
- Learn what factors drive selection

---

### 4. Campaign Attribution Integration

**What Changed:**
Content exported from Memory Vault automatically gets fingerprinted for attribution tracking.

**How This Affects NIV:**

**Current Flow (No Changes Needed):**
```typescript
// 1. NIV generates content
const content = await generatePressRelease(params)

// 2. Save to Memory Vault (already doing this)
const saved = await saveToMemoryVault({
  type: 'press-release',
  title: params.title,
  content: content,
  organization_id: org.id
})

// 3. User exports from Memory Vault UI
// → Fingerprint automatically created
// → 90-day tracking window starts
// → Media coverage detected automatically
```

**Future Enhancement - Direct Fingerprinting:**
```typescript
// If NIV wants to track content immediately without export
const saved = await saveToMemoryVault({
  type: 'press-release',
  content: content,
  organization_id: org.id,
  createFingerprint: true  // NEW: Immediate fingerprinting
})

// Returns fingerprint ID for tracking
console.log('📌 Fingerprint:', saved.fingerprintId)
```

**Attribution Flow:**
```
NIV generates content
↓
Saved to Memory Vault
↓
User exports content (copy/email/download)
↓
Fingerprint created automatically
   - 5-10 key phrases extracted
   - Semantic embeddings generated
   - 90-day tracking window
↓
Intelligence monitoring detects articles
↓
AI matches articles to fingerprints
   - Exact phrase: 95% confidence
   - Semantic: 75-85% confidence
   - Contextual: 65-75% confidence
↓
Attribution recorded in Memory Vault
↓
Campaign marked successful
↓
Content salience boosted 1.5x
↓
Future NIV searches prioritize this pattern
```

---

### 5. Success-Driven Learning Loop

**What's New:**
Successful campaigns automatically get higher salience and create "waypoint" links to similar successful campaigns.

**How NIV Benefits:**

```typescript
// NIV searches for press release templates
const templates = await searchMemoryVault({
  query: 'product launch press release',
  type: 'press-release'
})

// Templates that led to successful campaigns appear FIRST
// Because:
// 1. Execution score = 0.9 (20% of total score)
// 2. Salience boosted 1.5x after success
// 3. Waypoint graphs link to other successful patterns

// User picks a proven winner, not just similar content
```

**Success Criteria (Automatic):**
- **Success**: 10+ media placements, 80%+ avg confidence
- **Partial**: 5-9 placements
- **Minimal**: 1-4 placements
- **Failed**: 0 placements

**Salience Boost on Success:**
```sql
-- Happens automatically when campaign marked successful
UPDATE content_library
SET salience_score = LEAST(salience_score * 1.5, 1.0)
WHERE id = successful_campaign_id
```

**Waypoint Graphs:**
- Successful campaigns link to other successful campaigns
- NIV can follow these links to find proven patterns
- "Campaigns like this succeeded" recommendations

---

### 6. Performance Feedback Integration

**What's New:**
Memory Vault tracks execution results and uses them for future recommendations.

**How to Integrate with NIV:**

```typescript
// After user executes NIV-generated content
async function recordContentExecution(contentId: string, result: {
  executed: boolean
  feedback?: string
  metrics?: {
    placements?: number
    reach?: number
    engagement?: number
  }
}) {
  await supabase
    .from('content_library')
    .update({
      executed: result.executed,
      executed_at: new Date().toISOString(),
      result: {
        value: result.feedback,
        notes: JSON.stringify(result.metrics)
      }
    })
    .eq('id', contentId)
}

// Usage in NIV
await recordContentExecution(savedContentId, {
  executed: true,
  feedback: 'Great response - 12 tier-1 placements',
  metrics: {
    placements: 12,
    reach: 5000000,
    engagement: 850
  }
})
```

**How This Improves NIV:**
- Templates with proven results rank higher
- Execution success = 20% of composite score
- Failed patterns naturally fade (low salience, no boosts)
- Users see what actually worked

---

## Updated NIV Integration Checklist

### Phase 1 - Basic Integration (Original Guide) ✅
- [x] Import brand context cache
- [x] Fetch brand context before generation
- [x] Include brand context in prompts
- [x] Auto-save generated content
- [x] Optional: Subscribe to intelligence updates

### Phase 2 - Enhanced Integration (NEW - Oct 26, 2025)
- [ ] **Use composite scoring API** - Switch from simple search to composite scoring
- [ ] **Show retrieval explanations** - Display `retrieval_reason` in UI
- [ ] **Track execution results** - Record when content performs well
- [ ] **Monitor attribution** - Link to attribution analytics in Memory Vault
- [ ] **Leverage success patterns** - Use execution scores to prioritize templates

---

## Implementation Priority

### High Priority (Do Now)
1. **Switch to composite scoring API** - Better template recommendations immediately
2. **Show retrieval explanations** - Builds user trust in NIV recommendations

### Medium Priority (This Week)
3. **Track execution results** - Capture whether content worked
4. **Show success metrics** - Display execution scores in template selection

### Low Priority (Future)
5. **Attribution dashboard links** - Connect NIV to attribution analytics
6. **Custom waypoint queries** - "Show me similar successful campaigns"

---

## Code Examples

### Example 1: Enhanced Template Search with Composite Scoring

```typescript
// File: src/lib/niv/find-best-template.ts
import { createClient } from '@supabase/supabase-js'

export async function findBestTemplate(params: {
  organizationId: string
  contentType: string
  query: string
  showExplanations?: boolean
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // NEW: Use composite scoring API
  const { data, error } = await supabase.functions.invoke('niv-memory-vault', {
    body: {
      action: 'search',
      query: params.query,
      organizationId: params.organizationId,
      contentType: params.contentType,
      limit: 5,
      includeExplanations: params.showExplanations ?? true
    }
  })

  if (error) {
    console.error('Template search error:', error)
    return []
  }

  return data.results.map((result: any) => ({
    id: result.id,
    title: result.title,
    content: result.content,

    // Composite scoring
    score: result.composite_score,
    explanation: result.retrieval_reason,

    // Individual factors
    relevance: result.similarity_score,
    freshness: result.salience_score,
    successRate: result.execution_score,
    popularity: result.access_count,

    // Metadata
    lastUsed: result.last_accessed_at,
    executed: result.executed
  }))
}
```

### Example 2: Showing Explainable Recommendations in UI

```typescript
// In NIV content generation UI
function TemplateSelector({ templates }: { templates: Template[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-300">Recommended Templates</h3>
      {templates.map(template => (
        <div key={template.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-white">{template.title}</h4>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400">{template.score.toFixed(1)}/5</span>
            </div>
          </div>

          {/* NEW: Show explanation */}
          <div className="flex items-center gap-2 mb-3 text-sm text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded">
            <Lightbulb className="w-4 h-4" />
            {template.explanation}
          </div>

          {/* NEW: Show success metrics */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Relevance: {(template.relevance * 100).toFixed(0)}%</span>
            {template.executed && (
              <span className="text-emerald-400">
                ✓ Success Rate: {(template.successRate * 100).toFixed(0)}%
              </span>
            )}
            <span>Used {template.popularity}× this month</span>
          </div>

          <button
            onClick={() => useTemplate(template)}
            className="mt-3 w-full px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded transition-colors"
          >
            Use This Template
          </button>
        </div>
      ))}
    </div>
  )
}
```

### Example 3: Recording Execution Results

```typescript
// After content is published/sent
async function recordNIVContentExecution(params: {
  contentId: string
  executed: boolean
  result?: {
    feedback: string
    placements?: number
    reach?: number
  }
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('content_library')
    .update({
      executed: params.executed,
      executed_at: new Date().toISOString(),
      result: params.result ? {
        value: params.result.feedback,
        notes: JSON.stringify({
          placements: params.result.placements,
          reach: params.result.reach
        })
      } : null
    })
    .eq('id', params.contentId)

  if (!error) {
    console.log('✅ Execution recorded - will improve future recommendations')
  }
}

// Usage
await recordNIVContentExecution({
  contentId: savedId,
  executed: true,
  result: {
    feedback: 'Excellent response - featured in WSJ',
    placements: 8,
    reach: 2500000
  }
})
```

---

## Performance Impact

### Original Integration
| Operation | Time | Impact |
|-----------|------|--------|
| Get brand context (cached) | < 1ms | None |
| Save to Memory Vault | 106-200ms | Minimal |
| Intelligence extraction | 4-6s | None (background) |

### NEW - Phase 2 Enhancements
| Operation | Time | Impact |
|-----------|------|--------|
| Composite scoring search | +50ms | Minimal (better results) |
| Salience boost on access | 20ms | Minimal (optional) |
| Explainable retrieval | 0ms | None (included in search) |
| Attribution fingerprinting | 2-3s | None (on export, not generation) |

**Total Added Latency:** < 50ms (composite scoring only)

---

## Benefits Summary

### For NIV Content Generation
1. **Better Templates First** - Proven successful patterns prioritized
2. **Transparent Recommendations** - Users see WHY templates were suggested
3. **Self-Improving System** - Success feedback improves future recommendations
4. **Fresh Content** - Salience decay prevents stale templates
5. **Performance Tracking** - Know what works via attribution analytics

### For Users
1. **Trust in AI** - Explainable recommendations build confidence
2. **Better Outcomes** - Templates with proven track records
3. **Zero Extra Work** - Everything automatic
4. **Learning Organization** - Success patterns preserved and reused

### For SignalDesk Platform
1. **Institutional Memory** - Proven patterns captured automatically
2. **Quality Improvement Loop** - Success → Higher ranking → More usage
3. **Data-Driven Optimization** - Attribution metrics guide recommendations
4. **Competitive Advantage** - AI that learns from real campaign results

---

## Next Steps

1. **Update NIV search functions** to use composite scoring API
2. **Add retrieval explanations** to template selection UI
3. **Implement execution tracking** when content is published
4. **Link to attribution analytics** from generated content
5. **Monitor performance impact** (should be < 50ms added latency)

**The enhanced system provides massive value with minimal integration effort!**
