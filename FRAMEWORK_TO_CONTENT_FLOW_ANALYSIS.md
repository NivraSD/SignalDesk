# NIV Strategic Framework → Memory Vault → Content Generation Flow Analysis

## Current State Assessment

### 1. NIV Strategic Framework (niv-orchestrator-robust)

**What it generates:**
```typescript
{
  strategy: {
    objective: string,
    rationale: string,
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  },
  narrative: {
    positioning_statement: string,
    key_messages: string[],
    story_elements: string[]
  },
  tactics: {
    campaign_elements: object,
    content_creation: string[],
    media_outreach: string[],
    strategic_plays: string[]
  },
  execution: {
    timeline: object,
    immediate_actions: string[]
  },
  intelligence: {
    key_findings: string[],
    supporting_data: { articles: [] },
    gaps_identified: string[]
  },
  orchestration: {
    next_components: string[],  // ['content', 'campaign', 'planning', 'media']
    priority: string
  }
}
```

**How it saves to Memory Vault** (lines 2817-2895):
- Calls `/niv-memory-vault?action=save`
- Maps framework structure to `niv_strategies` table schema
- Sets workflow flags based on `orchestration.next_components`
- **Issue**: Complex nested structure doesn't map cleanly to flat table

### 2. Memory Vault (niv-memory-vault)

**What it stores:**
```typescript
content_library table:
- content_type: 'strategic-framework'
- title: string
- content: JSON string (entire framework)
- metadata: object
- tags: ['niv-generated', 'strategic-framework']
- status: 'approved'
```

**Legacy niv_strategies table:**
- Flat columns for strategy fields
- workflow_* JSONB columns for orchestration
- research_* columns for intelligence
- **Issue**: Two storage mechanisms, unclear which is source of truth

### 3. NIV Content Intelligent V2 (niv-content-intelligent-v2)

**What it expects:**
```typescript
approvedStrategy: {
  subject: string,              // Main topic
  narrative: string,            // Story/positioning
  target_audiences: string[],   // Who we're targeting
  key_messages: string[],       // Core messages
  media_targets: string[],      // Specific outlets/journalists
  timeline: string             // Execution timeline
}
```

**How it generates content** (lines 1722-1739):
```typescript
await callMCPService(contentType, {
  organization: string,
  subject: strategy.subject,
  narrative: strategy.narrative,
  strategy: conversationState.strategyChosen,
  keyPoints: strategy.key_messages,
  targetAudiences: strategy.target_audiences,
  mediaTargets: strategy.media_targets,
  timeline: strategy.timeline,
  research: researchResults?.synthesis,
  userPreferences: conversationState.userPreferences,
  conversationContext: conversationState.fullConversation.slice(-5)
})
```

## Problems Identified

### Problem 1: Schema Mismatch
**Strategic Framework Output** vs **Content Generator Input**

| Framework Field | Content Generator Expects | Current Mapping |
|----------------|---------------------------|----------------|
| `strategy.objective` | `subject` | ❌ Missing |
| `narrative.positioning_statement` | `narrative` | ❌ Wrong field |
| `narrative.key_messages` | `key_messages` | ✅ Good |
| `tactics.media_outreach` | `media_targets` | ⚠️ Wrong format |
| `execution.timeline` | `timeline` | ⚠️ Object vs String |
| N/A | `target_audiences` | ❌ Missing |

### Problem 2: Memory Vault Doesn't Orchestrate
Memory Vault saves the framework but doesn't:
- Trigger content generation automatically
- Pass framework to content generator
- Manage workflow state transitions

### Problem 3: Content Requests Are Invalid
Framework suggests content types that don't exist in MCP tools:
- "Executive briefing document" → Not a real content type
- "Stakeholder engagement plan" → Not a content type
- Generic suggestions vs actual deliverables

### Problem 4: No Handoff Mechanism
No clear way to:
1. Load framework from Memory Vault into Content Generator
2. Convert framework structure to content generator format
3. Track which content pieces have been generated
4. Link generated content back to source framework

## Recommended Solution Architecture

### Option A: Direct Handoff (Simplest)

**Flow:**
```
NIV Strategic Framework
  ↓ (generates framework)
Returns framework in response
  ↓ (user clicks "Generate Content")
Frontend passes framework to Content Generator
  ↓
Content Generator maps fields internally
  ↓
Generates content, saves to Memory Vault
```

**Pros:**
- No Memory Vault orchestration needed
- Direct data flow, easier to debug
- Frontend controls the workflow

**Cons:**
- Framework not persisted before content generation
- Can't resume if interrupted
- No audit trail of what triggered what

### Option B: Memory Vault as Orchestrator (Most Robust)

**Flow:**
```
NIV Strategic Framework
  ↓
Saves to Memory Vault (standardized format)
  ↓
Memory Vault returns strategyId + orchestration triggers
  ↓
Frontend calls Content Generator with strategyId
  ↓
Content Generator loads framework from Memory Vault
  ↓
Maps framework → content generator format
  ↓
Generates content, links to strategyId
```

**Pros:**
- Full persistence and audit trail
- Can resume/retry content generation
- Clear lineage: framework → content pieces
- Supports multi-session workflows

**Cons:**
- More complex orchestration
- Need Memory Vault retrieval API
- Need field mapping layer

### Option C: Hybrid (Recommended)

**Flow:**
```
NIV Strategic Framework
  ↓
Saves to Memory Vault (background, non-blocking)
  ↓
Returns framework in response immediately
  ↓
Frontend passes BOTH framework + strategyId to Content Generator
  ↓
Content Generator uses in-memory framework, links to strategyId
  ↓
Saves generated content with strategy_id reference
```

**Pros:**
- Fast (no Memory Vault lookup delay)
- Persisted (can resume later)
- Clean lineage tracking
- Works even if Memory Vault save fails

**Cons:**
- Framework passed in two places (memory + vault)
- Slight data redundancy

## Implementation Plan (Option C - Hybrid)

### Phase 1: Standardize Framework Output

**Create mapper in niv-orchestrator-robust:**
```typescript
function mapFrameworkToContentFormat(framework: StrategyFramework) {
  return {
    subject: framework.strategy?.objective || 'Strategic Initiative',
    narrative: framework.narrative?.positioning_statement || framework.narrative?.story_elements?.[0] || '',
    target_audiences: extractAudiences(framework), // New function
    key_messages: framework.narrative?.key_messages || [],
    media_targets: extractMediaTargets(framework.tactics?.media_outreach), // New function
    timeline: formatTimeline(framework.execution?.timeline), // New function
    chosen_approach: framework.strategy?.rationale || '',
    tactical_recommendations: framework.tactics?.strategic_plays || []
  }
}
```

**Return in framework response:**
```typescript
return {
  framework: structuredFramework,  // Original structure
  contentGeneratorFormat: mapFrameworkToContentFormat(structuredFramework), // Mapped
  strategyId: memoryVaultData.id,  // From Memory Vault save
  readyForContent: true
}
```

### Phase 2: Update Content Generator to Accept Framework

**Add new conversation mode in niv-content-intelligent-v2:**
```typescript
// Accept framework directly in request
const { framework, strategyId } = await req.json()

if (framework && !conversationState.approvedStrategy) {
  // Pre-populate from framework
  conversationState.approvedStrategy = framework
  conversationState.strategyId = strategyId
  conversationState.stage = 'strategy_review'

  // Skip strategy creation, go straight to content generation
}
```

**Add strategy retrieval:**
```typescript
// If strategyId provided without framework, load from Memory Vault
if (strategyId && !framework) {
  const vaultResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-memory-vault?action=get&id=${strategyId}`)
  const strategy = await vaultResponse.json()
  conversationState.approvedStrategy = mapVaultToContentFormat(strategy.data)
}
```

### Phase 3: Update Memory Vault Schema

**Ensure content_library stores proper metadata:**
```typescript
metadata: {
  framework_structure: 'v2',  // Version tracking
  orchestration: {
    content_types_requested: ['press-release', 'media-pitch', ...],
    content_generated: {
      'press-release': 'content-id-123',
      'media-pitch': 'content-id-456'
    },
    workflow_status: 'in_progress' | 'complete'
  },
  original_framework: structuredFramework  // Full original
}
```

### Phase 4: Frontend Orchestration

**When user approves framework:**
```typescript
// NivCanvasComponent.tsx
const handleGenerateContent = async (framework: StrategyFramework) => {
  const response = await fetch('/api/supabase/functions/niv-content-intelligent-v2', {
    method: 'POST',
    body: JSON.stringify({
      mode: 'from_framework',
      framework: framework.contentGeneratorFormat,
      strategyId: framework.strategyId,
      conversationId: 'canvas-session'
    })
  })

  // Content generator now has everything it needs
}
```

## Content Type Validation

### Valid MCP Content Types
Based on niv-content-intelligent-v2 tools:
- `press-release`
- `media-pitch`
- `media-list`
- `qa-document`
- `talking-points`
- `social-post`
- `email`

### Framework Should Request Only These
Update strategic framework prompt to ONLY suggest these 7 types, not:
- ❌ "Executive briefing"
- ❌ "Stakeholder engagement plan"
- ❌ "Internal communications strategy"

**Fix in niv-orchestrator-robust prompt:**
```typescript
**TACTICAL CONTENT (choose from these ONLY):**
- Press Release: Core announcement
- Media Pitch: Personalized journalist outreach
- Media List: Target journalists with contact info
- Q&A Document: Anticipated questions and answers
- Talking Points: Executive messaging guide
- Social Posts: Multi-platform content
- Email Campaign: Sequenced outreach

DO NOT suggest content types outside this list.
```

## Success Metrics

### After Implementation
1. ✅ Framework fields map 1:1 to content generator inputs
2. ✅ Content generator can accept framework directly
3. ✅ Memory Vault tracks framework → content lineage
4. ✅ Generated content references source strategy
5. ✅ Framework only requests valid content types
6. ✅ Can resume content generation from saved framework
7. ✅ Planning component can read framework from vault

## Next Steps

1. **Immediate**: Fix content type suggestions in framework prompt
2. **Phase 1**: Implement `mapFrameworkToContentFormat()` function
3. **Phase 2**: Add framework acceptance to content generator
4. **Phase 3**: Update Memory Vault metadata schema
5. **Phase 4**: Wire up frontend handoff
6. **Testing**: Full flow test with real framework → content generation

## Notes

- NIV Content Intelligent V2 is working well - don't change its core logic
- Strategic Framework is now working well - just needs output mapping
- Memory Vault needs to be a "dumb pipe" for storage, not complex orchestrator
- Frontend should control workflow transitions
- Keep it simple: framework in → content out
