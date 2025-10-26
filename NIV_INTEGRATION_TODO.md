# NIV Integration TODO - Phase 2 Enhancements
**Created:** October 26, 2025
**Status:** Ready for Implementation

---

## What We've Built But Haven't Integrated with NIV Yet

Since the original NIV integration guide, we've added significant new capabilities to Memory Vault that NIV isn't using yet:

### ✅ Built and Deployed
1. **Composite Retrieval Scoring** - Multi-factor ranking (similarity + salience + recency + execution)
2. **Explainable Retrieval** - Human-readable reasons for recommendations
3. **Salience Scoring** - Time-based relevance decay
4. **Campaign Attribution** - Automatic performance tracking
5. **Success Learning Loop** - Proven campaigns get priority
6. **Waypoint Graphs** - Links between successful strategies

### ⏳ Not Yet Integrated with NIV
All of the above features exist in Memory Vault but NIV content generation isn't using them yet.

---

## Critical Path: What to Add to NIV Integration

### Priority 1: Switch to Composite Scoring API (IMMEDIATE)

**Current State:**
NIV probably uses basic Memory Vault search or doesn't use it at all for template discovery.

**What to Add:**
```typescript
// Instead of basic search, use composite scoring
const { data } = await supabase.functions.invoke('niv-memory-vault', {
  body: {
    action: 'search',
    query: 'press release for product launch',
    organizationId: org.id,
    contentType: 'press-release',
    limit: 5
  }
})

// Now get results ranked by:
// - Semantic similarity (40%)
// - Time-based salience (20%)
// - Recency (10%)
// - Proven success (20%)
// - Related content (10%)
```

**Impact:**
- Better template recommendations immediately
- Proven successful templates appear first
- Recently-used patterns prioritized
- Old stale content fades naturally

**Files to Update:**
- Any NIV function that searches for templates/examples
- Template selection components
- Content generation prep steps

---

### Priority 2: Show Retrieval Explanations (HIGH)

**Current State:**
Users don't know WHY templates were recommended.

**What to Add:**
```typescript
// Display the retrieval_reason field
<div className="template-card">
  <h3>{template.title}</h3>

  {/* NEW: Show WHY this template was recommended */}
  <div className="explanation">
    <Lightbulb className="w-4 h-4" />
    {template.retrieval_reason}
    {/* e.g., "Proven successful • High relevance • Recently used" */}
  </div>

  <div className="metrics">
    <span>Relevance: {(template.similarity_score * 100).toFixed(0)}%</span>
    <span>Success: {(template.execution_score * 100).toFixed(0)}%</span>
  </div>
</div>
```

**Impact:**
- Builds user trust in AI recommendations
- Transparent decision-making
- Educational for users

**Files to Update:**
- Template selection UI components
- NIV content generation interfaces
- Any place showing Memory Vault search results

---

### Priority 3: Track Execution Results (HIGH)

**Current State:**
NIV generates content but doesn't tell Memory Vault whether it worked.

**What to Add:**
```typescript
// After user publishes/sends NIV-generated content
async function recordExecution(contentId: string, result: {
  executed: boolean
  feedback?: string
  metrics?: { placements?: number, reach?: number }
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

// Usage - when user marks content as "sent" or "published"
await recordExecution(savedContentId, {
  executed: true,
  feedback: 'Great media response - 8 placements',
  metrics: { placements: 8, reach: 2500000 }
})
```

**Impact:**
- Creates feedback loop for AI learning
- Successful templates rank higher in future
- Failed patterns naturally fade
- Institutional knowledge building

**Files to Update:**
- Content execution/publishing flows
- Campaign completion handlers
- Any user feedback capture points

---

### Priority 4: Link to Attribution Analytics (MEDIUM)

**Current State:**
NIV generates content but users don't see performance tracking.

**What to Add:**
```typescript
// After saving NIV content
const saved = await saveToMemoryVault({
  type: 'press-release',
  content: generatedContent,
  organization_id: org.id
})

// Show link to attribution tracking
return {
  content: generatedContent,
  contentId: saved.id,

  // NEW: Link to attribution analytics
  analyticsUrl: `/memory-vault?tab=analytics&contentId=${saved.id}`,
  trackingEnabled: true
}
```

**In UI:**
```typescript
<div className="content-generated">
  <h3>Content Generated Successfully!</h3>

  {/* NEW: Link to attribution tracking */}
  <a href={result.analyticsUrl} className="link">
    📊 Track Performance in Memory Vault →
  </a>
  <p className="text-sm text-gray-400">
    After you export this content, we'll automatically track media coverage
    and attribute it back to this campaign.
  </p>
</div>
```

**Impact:**
- Users aware of attribution tracking
- Easy access to performance analytics
- Closes the learning loop visually

**Files to Update:**
- NIV content generation success screens
- Content save confirmation UIs
- Memory Vault links in NIV flows

---

### Priority 5: Show Success Patterns (MEDIUM)

**Current State:**
NIV doesn't highlight which templates have proven track records.

**What to Add:**
```typescript
// In template selection
{templates.map(template => (
  <div className="template-card">
    <h3>{template.title}</h3>

    {/* NEW: Show success indicators */}
    {template.execution_score > 0.7 && (
      <div className="success-badge">
        ✓ Proven Successful ({template.access_count}× used)
      </div>
    )}

    {template.attribution?.placements > 0 && (
      <div className="attribution-stats">
        📰 {template.attribution.placements} media placements
        📊 {(template.attribution.reach / 1000000).toFixed(1)}M reach
      </div>
    )}
  </div>
))}
```

**Impact:**
- Users see proven winners
- Data-driven template selection
- Social proof for AI recommendations

**Files to Update:**
- Template selection components
- Content library browse views
- Search results displays

---

## Quick Win: What Can Be Done in 30 Minutes

### Immediate Integration (No UI Changes)

1. **Switch API endpoint** - Change Memory Vault search calls to use composite scoring
2. **Log explanations** - Console.log the `retrieval_reason` to verify it works
3. **Test composite scoring** - Generate content and check if better templates appear

```typescript
// Before (basic search)
const templates = await searchMemoryVault({ query: 'press release' })

// After (composite scoring)
const { data } = await supabase.functions.invoke('niv-memory-vault', {
  body: {
    action: 'search',
    query: 'press release',
    organizationId: org.id,
    limit: 5
  }
})

console.log('Top template:', data.results[0].title)
console.log('Why recommended:', data.results[0].retrieval_reason)
console.log('Success rate:', data.results[0].execution_score)
```

**Impact:**
- Better recommendations immediately
- No UI changes required
- Zero risk

---

## Implementation Checklist

### Week 1: Core Integration
- [ ] Update all Memory Vault search calls to use `niv-memory-vault` edge function
- [ ] Add composite scoring parameters to search requests
- [ ] Console.log retrieval explanations to verify they work
- [ ] Test that proven templates appear first

### Week 2: UI Enhancements
- [ ] Add retrieval explanation badges to template cards
- [ ] Show success metrics (execution score, usage count) in UI
- [ ] Add "Proven Successful" indicators for high-performing templates
- [ ] Update template selection UI with composite score visualization

### Week 3: Feedback Loop
- [ ] Implement execution tracking when content is published
- [ ] Add user feedback capture for generated content
- [ ] Link generated content to attribution analytics
- [ ] Create "View Performance" buttons in NIV flows

### Week 4: Advanced Features
- [ ] Add "Similar successful campaigns" recommendations
- [ ] Show attribution stats in template selection
- [ ] Implement salience boosting for frequently-used templates
- [ ] Create success pattern dashboard

---

## Testing Plan

### Phase 1: Verify Composite Scoring Works
1. Generate content with NIV using updated search
2. Console.log the results and scores
3. Verify proven templates appear first
4. Check retrieval_reason makes sense

### Phase 2: Verify Execution Tracking Works
1. Mark NIV-generated content as executed
2. Check content_library table for updated execution fields
3. Generate content again - verify executed content ranks higher
4. Confirm salience boosted for successful content

### Phase 3: Verify Attribution Integration
1. Export NIV-generated content from Memory Vault
2. Verify fingerprint created automatically
3. Check attribution analytics shows the content
4. Confirm links work from NIV to analytics

---

## Expected Outcomes

### Immediate Benefits (Week 1)
- ✅ Better template recommendations
- ✅ Proven patterns prioritized
- ✅ Zero performance impact (< 50ms)

### Short-term Benefits (Week 2-3)
- ✅ User trust in recommendations increases
- ✅ Transparent AI decision-making
- ✅ Success patterns captured automatically

### Long-term Benefits (Month 1+)
- ✅ Self-improving system via feedback loop
- ✅ Institutional knowledge preserved
- ✅ Campaign attribution tracking active
- ✅ Data-driven content optimization

---

## Questions to Answer Before Starting

1. **Where does NIV currently search for templates?**
   - Which files/functions need updating?
   - Are there multiple search points?

2. **How does NIV currently save generated content?**
   - Already using `/api/content-library/save`?
   - If yes, great! Already integrated.
   - If no, need to add this first.

3. **Where do users mark content as "executed"?**
   - Is there a publish/send button?
   - Campaign completion flow?
   - Manual tracking interface?

4. **What UI components show template selection?**
   - Which files need updating for explanations?
   - Where to add success indicators?

---

## Files That Likely Need Updates

Based on common NIV patterns:

### Backend/API Files
- `src/lib/niv/*` - Content generation functions
- `supabase/functions/niv-content-intelligent-v2/` - Main NIV generation
- Any files that search Memory Vault for templates

### Frontend/UI Files
- Template selection components
- Content generation success screens
- Memory Vault integration points
- Campaign/content management UIs

### Integration Points
- Content save flows
- Template search functions
- Execution tracking handlers
- Analytics linking

---

## Support & Documentation

**Reference Documents:**
- `MEMORY_VAULT_NIV_INTEGRATION_GUIDE.md` - Original integration plan
- `MEMORY_VAULT_NIV_INTEGRATION_UPDATES.md` - Detailed new integration guide
- `MEMORY_VAULT_OPENMEMORY_ENHANCEMENTS.md` - Technical details on Phase 2
- `CAMPAIGN_ATTRIBUTION_IMPLEMENTATION_GUIDE.md` - Attribution system details

**Key API Endpoints:**
- `niv-memory-vault` - Main search with composite scoring
- `/api/content-library/save` - Save content with intelligence extraction
- `campaign-performance-get` - Fetch attribution analytics

**Need Help?**
Check console logs - we added extensive logging to all new features for debugging.
