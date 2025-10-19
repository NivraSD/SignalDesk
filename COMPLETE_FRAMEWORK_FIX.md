# Complete Framework Fix: Structure + Auto-Execute

## The Core Problems

### Problem 1: Framework Structure Doesn't Match Content Generator

**Content Generator Expects** (flat, simple):
```typescript
{
  subject: "AI Leadership Strategy",
  narrative: "Position as AI safety leader...",
  target_audiences: ["Industry stakeholders", "Media", "Investors"],
  key_messages: ["Message 1", "Message 2"],
  media_targets: ["TechCrunch", "WSJ", "Bloomberg"],
  timeline: "2 weeks"
}
```

**Framework Currently Outputs** (nested, complex):
```typescript
{
  strategy: {
    objective: "...",
    narrative: "...",
    rationale: "..."
  },
  tactics: {
    campaign_elements: {
      media_outreach: ["Tier 1 media briefing..."],
      content_creation: ["press-release", "media-pitch"]
    }
  },
  intelligence: { ... },
  discovery: { ... }
}
```

### Problem 2: Missing Fields

Content generator **requires**:
- `subject` ❌ (framework has `strategy.objective`)
- `narrative` ⚠️ (framework has `strategy.narrative` but it's generic)
- `target_audiences` ❌ (framework doesn't have this)
- `key_messages` ❌ (framework doesn't have this)
- `media_targets` ⚠️ (framework has `tactics.campaign_elements.media_outreach` but wrong format)
- `timeline` ⚠️ (framework doesn't have this in string format)

## The Solution: Add Content-Ready Fields to Framework

Instead of trying to map complex nested structure, **add the exact fields content generator needs directly to the framework**.

### Updated Framework Structure

```typescript
{
  // EXISTING (keep all of this)
  strategy: { ... },
  tactics: { ... },
  intelligence: { ... },
  discovery: { ... },
  orchestration: { ... },

  // NEW: Content-ready format (for niv-content-intelligent-v2)
  contentStrategy: {
    subject: string,              // Same as strategy.objective
    narrative: string,            // Rich narrative for content
    target_audiences: string[],   // Who we're targeting
    key_messages: string[],       // Core messages
    media_targets: string[],      // Specific outlets
    timeline: string,             // Execution timeline
    chosen_approach: string,      // Strategic approach
    tactical_recommendations: string[]  // Tactics
  }
}
```

This way:
- ✅ Framework keeps its rich structure for Planning component
- ✅ Framework has flat structure ready for Content generator
- ✅ No mapping needed - just pass `framework.contentStrategy`
- ✅ Same pattern as media plans

## Implementation

### Step 1: Update Framework Generator to Include Content-Ready Fields (45 min)

**File**: `supabase/functions/niv-orchestrator-robust/framework-generator.ts`

**Add after line 352** (before `return framework`):

```typescript
  // Add content-ready format for niv-content-intelligent-v2
  // This mirrors the media plan strategy format
  const contentStrategy = {
    // Core subject
    subject: framework.strategy.objective,

    // Rich narrative combining positioning and key story elements
    narrative: buildContentNarrative(framework),

    // Target audiences extracted from various sources
    target_audiences: buildTargetAudiences(framework),

    // Key messages for consistent communication
    key_messages: buildKeyMessages(framework),

    // Specific media targets
    media_targets: buildMediaTargets(framework),

    // Timeline in content-friendly format
    timeline: buildContentTimeline(framework),

    // Strategic approach
    chosen_approach: framework.strategy.rationale,

    // Tactical recommendations
    tactical_recommendations: framework.tactics.strategic_plays || []
  }

  return {
    ...framework,
    contentStrategy  // ADD THIS
  }
}

// Helper functions for building content-ready fields
function buildContentNarrative(framework: NivStrategicFramework): string {
  const strategy = framework.strategy
  const intelligence = framework.intelligence

  let narrative = strategy.narrative || ''

  // Enrich with context from intelligence
  if (intelligence.key_findings && intelligence.key_findings.length > 0) {
    narrative += `\n\nKey Context: ${intelligence.key_findings.slice(0, 2).join('. ')}`
  }

  // Add competitive context if available
  if (intelligence.competitor_moves && intelligence.competitor_moves.length > 0) {
    narrative += `\n\nMarket Context: ${intelligence.competitor_moves[0]}`
  }

  return narrative.trim()
}

function buildTargetAudiences(framework: NivStrategicFramework): string[] {
  const audiences: string[] = []

  // From stakeholder engagement tactics
  if (framework.tactics?.campaign_elements?.stakeholder_engagement) {
    const stakeholders = framework.tactics.campaign_elements.stakeholder_engagement
    // Extract audience types from stakeholder descriptions
    stakeholders.forEach(s => {
      if (s.toLowerCase().includes('investor')) audiences.push('Investors')
      if (s.toLowerCase().includes('employee')) audiences.push('Employees')
      if (s.toLowerCase().includes('customer')) audiences.push('Customers')
      if (s.toLowerCase().includes('partner')) audiences.push('Partners')
    })
  }

  // From discovery data
  if (framework.discovery?.stakeholders) {
    if (framework.discovery.stakeholders.executives?.length > 0) audiences.push('Industry Executives')
    if (framework.discovery.stakeholders.investors?.length > 0) audiences.push('Investor Community')
    if (framework.discovery.stakeholders.regulators?.length > 0) audiences.push('Regulators')
  }

  // Default audiences if none found
  if (audiences.length === 0) {
    audiences.push('Industry Stakeholders', 'Media & Analysts', 'General Public')
  }

  // Remove duplicates
  return [...new Set(audiences)].slice(0, 5)
}

function buildKeyMessages(framework: NivStrategicFramework): string[] {
  const messages: string[] = []

  // Start with strategic objective as first message
  if (framework.strategy.objective) {
    messages.push(framework.strategy.objective)
  }

  // Add top intelligence findings as supporting messages
  if (framework.intelligence.key_findings) {
    messages.push(...framework.intelligence.key_findings.slice(0, 3))
  }

  // Add strategic plays as messages
  if (framework.tactics.strategic_plays) {
    messages.push(...framework.tactics.strategic_plays.slice(0, 2))
  }

  // Ensure we have at least 3 messages
  while (messages.length < 3) {
    messages.push(`Strategic messaging point ${messages.length + 1}`)
  }

  return messages.slice(0, 5)
}

function buildMediaTargets(framework: NivStrategicFramework): string[] {
  const targets: string[] = []

  // Extract from media outreach tactics
  if (framework.tactics?.campaign_elements?.media_outreach) {
    const outreach = framework.tactics.campaign_elements.media_outreach

    // Parse targets from descriptions
    outreach.forEach(item => {
      if (item.toLowerCase().includes('tier 1')) {
        targets.push('TechCrunch', 'The Verge', 'WSJ', 'Bloomberg')
      }
      if (item.toLowerCase().includes('analyst')) {
        targets.push('Gartner', 'Forrester', 'IDC')
      }
      if (item.toLowerCase().includes('trade')) {
        targets.push('Industry trade publications')
      }
    })
  }

  // Use discovery keywords to suggest relevant publications
  if (framework.discovery?.industry) {
    const industry = framework.discovery.industry.toLowerCase()
    if (industry.includes('tech')) {
      targets.push('TechCrunch', 'VentureBeat', 'Ars Technica')
    }
    if (industry.includes('finance')) {
      targets.push('Bloomberg', 'Financial Times', 'CNBC')
    }
  }

  // Default targets if none found
  if (targets.length === 0) {
    targets.push('Major tech publications', 'Industry trade media', 'Business press')
  }

  // Remove duplicates
  return [...new Set(targets)].slice(0, 8)
}

function buildContentTimeline(framework: NivStrategicFramework): string {
  const urgency = framework.strategy.urgency

  // Map urgency to timeline
  switch (urgency) {
    case 'immediate':
      return '24-48 hours for initial rollout, 1 week for full campaign'
    case 'high':
      return '1 week for preparation, 2-3 weeks for execution'
    case 'medium':
      return '2-4 weeks phased rollout'
    case 'low':
      return '1-2 months strategic deployment'
    default:
      return '2-3 weeks recommended execution window'
  }
}
```

### Step 2: Update TypeScript Types (15 min)

**File**: `supabase/functions/niv-orchestrator-robust/framework-generator.ts` (top of file)

**Update the interface:**

```typescript
export interface NivStrategicFramework {
  id: string
  sessionId: string
  organizationId: string
  created_at: Date

  strategy: {
    executive_summary: string
    objective: string
    narrative: string
    rationale: string
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  }

  tactics: {
    campaign_elements: {
      media_outreach: string[]
      content_creation: string[]  // Valid content type IDs
      stakeholder_engagement: string[]
    }
    immediate_actions: string[]
    week_one_priorities: string[]
    strategic_plays: string[]
  }

  intelligence: {
    key_findings: string[]
    competitor_moves: string[]
    market_opportunities: string[]
    risk_factors: string[]
    supporting_data: {
      articles: any[]
      quotes: any[]
      metrics: any[]
    }
  }

  discovery: {
    organizationName: string
    industry: string
    competitors: string[]
    keywords: string[]
    stakeholders: {
      executives: string[]
      investors: string[]
      regulators: string[]
    }
    market_position: string
    recent_events: any[]
    monitoring_priorities: string[]
  }

  conversationContext: {
    originalQuery: string
    conversationHistory: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: Date
    }>
    researchSteps: Array<{
      query: string
      findings: string[]
      sources: number
    }>
    userPreferences: {
      wants: string[]
      doesNotWant: string[]
      constraints: string[]
      examples: string[]
    }
  }

  orchestration: {
    components_to_activate: string[]
    workflow_type: 'crisis-response' | 'opportunity' | 'competitive' | 'thought-leadership' | 'launch'
    priority: 'urgent' | 'high' | 'normal'
    dependencies: string[]
  }

  // NEW: Content-ready format for niv-content-intelligent-v2
  contentStrategy: {
    subject: string
    narrative: string
    target_audiences: string[]
    key_messages: string[]
    media_targets: string[]
    timeline: string
    chosen_approach: string
    tactical_recommendations: string[]
  }
}
```

### Step 3: Update Auto-Execute to Use Content Strategy (15 min)

**File**: `supabase/functions/framework-auto-execute/index.ts` (from previous plan)

**Replace the mapping function:**

```typescript
// OLD (complex mapping):
function mapFrameworkToContentFormat(framework: any) {
  // ... 50 lines of mapping logic
}

// NEW (simple extraction):
function getContentStrategy(framework: any) {
  // Just use the pre-built contentStrategy field!
  return framework.contentStrategy || {
    subject: framework.strategy?.objective || 'Strategic Initiative',
    narrative: framework.strategy?.narrative || '',
    target_audiences: ['Industry stakeholders'],
    key_messages: framework.intelligence?.key_findings?.slice(0, 3) || [],
    media_targets: ['Major publications'],
    timeline: '2-3 weeks',
    chosen_approach: framework.strategy?.rationale || '',
    tactical_recommendations: framework.tactics?.strategic_plays || []
  }
}
```

**Update the content generation loop:**

```typescript
// Get content-ready strategy
const contentStrategy = getContentStrategy(framework)

for (const contentType of contentTypes) {
  try {
    console.log(`📝 Generating ${contentType.label}...`)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        conversationId: `auto-exec-${Date.now()}-${contentType.id}`,
        message: `Generate a ${contentType.label}`,
        organizationId: organizationId,

        // Just pass the contentStrategy - it's already in the right format!
        preloadedStrategy: contentStrategy,
        requestedContentType: contentType.id,
        autoExecute: true,
        saveFolder: frameworkFolder
      })
    })
    // ... rest of loop
  }
}
```

### Step 4: Test the Complete Flow (30 min)

1. Generate a strategic framework
2. Verify `framework.contentStrategy` exists with all required fields
3. Click "Execute Campaign"
4. Verify content generation uses contentStrategy correctly
5. Check Memory Vault for organized folder with all content

## Summary of Changes

| File | Change | Time |
|------|--------|------|
| `framework-generator.ts` | Add contentStrategy field + helper functions | 45 min |
| `framework-generator.ts` | Update TypeScript interface | 15 min |
| `framework-auto-execute/index.ts` | Use contentStrategy instead of mapping | 15 min |
| Testing | End-to-end validation | 30 min |
| **TOTAL** | | **~2 hours** |

## Why This Works

1. **Framework includes both formats**:
   - Rich nested structure for Planning component
   - Flat content-ready structure for Content generator

2. **No runtime mapping needed**:
   - Framework generator builds both at creation time
   - Auto-execute just passes `framework.contentStrategy`

3. **Matches media plan pattern**:
   - Media plans already use this flat structure
   - Content generator already knows how to process it

4. **Future-proof**:
   - New content types just read from `contentStrategy`
   - Planning component still gets full framework
   - Easy to add more fields to contentStrategy later

## Result

```typescript
// Generated framework
{
  // Rich structure for planning
  strategy: { objective, narrative, rationale, urgency },
  tactics: { campaign_elements, immediate_actions, ... },
  intelligence: { key_findings, competitor_moves, ... },

  // Content-ready format (NEW!)
  contentStrategy: {
    subject: "AI Leadership Strategy",
    narrative: "Position as AI safety leader. Key Context: AI regulation momentum growing...",
    target_audiences: ["Investors", "Industry Executives", "Media & Analysts"],
    key_messages: ["AI Leadership Strategy", "First to market with safety framework", ...],
    media_targets: ["TechCrunch", "WSJ", "Bloomberg", "Gartner", ...],
    timeline: "1 week for preparation, 2-3 weeks for execution",
    chosen_approach: "Strategic positioning based on competitive analysis",
    tactical_recommendations: ["Establish thought leadership", ...]
  }
}
```

**Then auto-execute just does:**

```typescript
const response = await contentGenerator({
  preloadedStrategy: framework.contentStrategy  // Perfect match!
})
```

This is the missing piece!
