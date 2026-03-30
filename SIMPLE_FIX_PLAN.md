# Simple Fix Plan: Framework → Execute Flow

## What You Described (The Right Approach)

> "When frameworks are generated in the UI there is a button in the Niv chat to execute. So when a user clicks execute I feel like it should just send the framework to nivcontentintelligentv2 and the strategicplanning component, and then nivcontentintelligentv2 saves the content in folder in memoryvault. When strategicframework saves to memoryvault it should probably start a folder where the framework itself is just 1 file saved in it."

This is **exactly** how media plans work already! We just need to replicate that pattern for strategic frameworks.

## What Already Exists

### 1. NIV Canvas Has "Execute Campaign" Button ✅
**File**: `NivCanvasComponent.tsx` lines 735-749

```typescript
<button onClick={() => {
  window.postMessage({
    type: 'niv-launch-orchestration',
    framework: message.structured.framework,
    sessionId: 'canvas-session'
  }, '*')
}}>
  🚀 Execute Campaign
</button>
```

### 2. Media Plan Folder Pattern Already Works ✅
**File**: `niv-content-intelligent-v2/index.ts` lines 1776-1810

When creating a media plan, it:
1. Creates folder: `media-plans/${folder-name}`
2. Saves strategy document to folder
3. Saves all generated content (press release, pitch, etc.) to same folder
4. Returns folder location

**Exact code:**
```typescript
const mediaPlanFolder = `media-plans/${folder}`

// Save strategy document first
await saveToContentLibrary({
  content_type: 'strategy-document',
  title: `${strategy.subject} - Strategy`,
  content: '# Media Strategy...',
  folder: mediaPlanFolder,
  metadata: { mediaPlan: true }
})

// Save each piece of content
for (const piece of generatedContent) {
  await saveToContentLibrary({
    content_type: piece.type,
    title: `${strategy.subject} - ${piece.type}`,
    content: piece.content,
    folder: mediaPlanFolder
  })
}
```

### 3. Framework Already Saves to Memory Vault ✅
**File**: `niv-orchestrator-robust/index.ts` lines 2817-2895

Framework gets saved to `niv_strategies` table AND `content_library` table.

## What's Missing (Simple Fixes)

### Missing #1: Framework Doesn't Save to Folder
**Currently**: Framework saves as standalone item
**Should**: Framework saves to folder `strategic-frameworks/${framework-title}/`

### Missing #2: Execute Button Doesn't Do Anything
**Currently**: Sends `window.postMessage` but no one is listening
**Should**: Open Execute tab with framework pre-loaded

### Missing #3: Execute Tab Doesn't Accept Framework
**Currently**: Execute tab starts fresh every time
**Should**: Execute tab can receive framework and pass to niv-content-intelligent-v2

### Missing #4: Framework Format Mismatch
**Currently**: Framework has nested structure that content generator can't use
**Should**: Map framework to format content generator expects

## Implementation Steps

### Step 1: Make Framework Save to Folder (30 min)

**File**: `niv-orchestrator-robust/index.ts` around line 2817

**Add**:
```typescript
// Generate folder name from framework title
const folderName = structuredFramework.strategy?.objective
  ?.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .substring(0, 50) || `framework-${Date.now()}`

const frameworkFolder = `strategic-frameworks/${folderName}`

// When saving to content_library, add folder
const memoryVaultPayload = {
  strategy: {
    organization_id: organizationId,
    title: structuredFramework.strategy?.objective || 'Strategic Framework',
    content_type: 'strategic-framework',
    folder: frameworkFolder,  // ADD THIS
    // ... rest of existing fields
  }
}
```

### Step 2: Listen for Execute Button (15 min)

**File**: `src/components/modules/ExecuteModule.tsx` or wherever Execute tab lives

**Add**:
```typescript
useEffect(() => {
  const handleOrchestration = (event: MessageEvent) => {
    if (event.data.type === 'niv-launch-orchestration') {
      const framework = event.data.framework
      console.log('📥 Received framework for execution:', framework)

      // Set framework in state
      setFramework(framework)

      // Switch to Execute tab
      // (if not already there)
    }
  }

  window.addEventListener('message', handleOrchestration)
  return () => window.removeEventListener('message', handleOrchestration)
}, [])
```

### Step 3: Pass Framework to Execute Tab (30 min)

**File**: `ExecuteTabProduction.tsx`

**Add prop**:
```typescript
interface ExecuteTabProductionProps {
  framework?: NivStrategicFramework  // ALREADY EXISTS!
  opportunity?: any
}
```

**It's already there!** Just need to use it.

**Add logic to pre-populate from framework**:
```typescript
// When framework exists, show it
{framework && (
  <div className="p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg mb-4">
    <h3 className="font-semibold mb-2">📋 Strategic Framework Loaded</h3>
    <p className="text-sm text-gray-400">{framework.strategy?.objective}</p>
    <button
      onClick={() => handleGenerateFromFramework(framework)}
      className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm"
    >
      Generate Content from Framework
    </button>
  </div>
)}
```

### Step 4: Map Framework to Content Generator Format (1 hour)

**File**: Create `src/lib/framework-mapper.ts`

```typescript
import type { NivStrategicFramework } from '@/types/niv-strategic-framework'

export function mapFrameworkToContentFormat(framework: NivStrategicFramework) {
  // Extract fields from framework structure
  const strategy = framework.strategy || {}
  const narrative = framework.narrative || {}
  const tactics = framework.tactics || {}
  const intelligence = framework.intelligence || {}

  return {
    // Core fields that content generator expects
    subject: strategy.objective || 'Strategic Initiative',
    narrative: strategy.narrative || narrative.positioning_statement || '',

    // Build target audiences from discovery and intelligence
    target_audiences: extractTargetAudiences(framework),

    // Key messages from narrative
    key_messages: narrative.key_messages || [],

    // Media targets from tactics
    media_targets: extractMediaTargets(tactics.media_outreach),

    // Timeline from execution
    timeline: formatTimeline(framework.execution?.timeline),

    // Additional context
    chosen_approach: strategy.rationale || '',
    tactical_recommendations: tactics.strategic_plays || [],

    // Pass full framework for reference
    _fullFramework: framework
  }
}

function extractTargetAudiences(framework: NivStrategicFramework): string[] {
  // Look for audiences in various places
  const audiences: string[] = []

  // From tactics
  if (framework.tactics?.stakeholder_engagement) {
    audiences.push(...framework.tactics.stakeholder_engagement.slice(0, 3))
  }

  // From intelligence (competitors become "competitor audiences")
  if (framework.intelligence?.competitor_moves) {
    audiences.push('Competitor audience')
  }

  // Default if nothing found
  if (audiences.length === 0) {
    audiences.push('Industry stakeholders', 'Media contacts', 'General public')
  }

  return audiences
}

function extractMediaTargets(mediaOutreach?: string[]): string[] {
  if (!mediaOutreach || mediaOutreach.length === 0) {
    return ['Tier 1 media outlets', 'Industry publications', 'Trade media']
  }
  return mediaOutreach.slice(0, 5)
}

function formatTimeline(timeline?: any): string {
  if (!timeline) return 'Immediate execution recommended'
  if (typeof timeline === 'string') return timeline

  // If it's an object with phases
  if (timeline.immediate) {
    return `Immediate: ${timeline.immediate.join(', ')}`
  }

  return 'Phased execution plan available'
}
```

### Step 5: Call Content Generator with Framework (45 min)

**File**: `ExecuteTabProduction.tsx`

**Add handler**:
```typescript
const handleGenerateFromFramework = async (framework: NivStrategicFramework) => {
  // Map framework to content generator format
  const mappedFramework = mapFrameworkToContentFormat(framework)

  // Get folder name from framework
  const folderName = framework.strategy?.objective
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 50) || `framework-${Date.now()}`

  const frameworkFolder = `strategic-frameworks/${folderName}`

  // Call niv-content-intelligent-v2 with framework
  const response = await fetch('/api/supabase/functions/niv-content-intelligent-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'from_framework',  // NEW MODE
      framework: mappedFramework,
      frameworkFolder: frameworkFolder,  // Tell it where to save
      organizationId: organization?.id
    })
  })

  const result = await response.json()

  if (result.success) {
    console.log('✅ Content generation started with framework context')
    setShowQueue(true)  // Show the generation queue
  }
}
```

### Step 6: Update Content Generator to Accept Framework (1 hour)

**File**: `supabase/functions/niv-content-intelligent-v2/index.ts`

**Add at the start of request handling** (around line 600):

```typescript
// Check if this is a framework-initiated generation
const { mode, framework, frameworkFolder } = await req.json()

if (mode === 'from_framework' && framework) {
  console.log('📋 Content generation from strategic framework')

  // Pre-populate conversation state
  conversationState.approvedStrategy = framework
  conversationState.strategyChosen = framework.chosen_approach || 'framework-based'
  conversationState.frameworkFolder = frameworkFolder  // Store folder location
  conversationState.stage = 'ready_to_generate'  // Skip to content gen

  // Return immediate confirmation
  return new Response(JSON.stringify({
    success: true,
    message: 'Framework loaded. What content would you like to generate?',
    stage: 'ready_to_generate',
    strategy: framework
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
```

**Update save logic** to use frameworkFolder (around line 1776):

```typescript
// Use frameworkFolder if from framework, otherwise use default
const saveFolder = conversationState.frameworkFolder || `media-plans/${folder}`

console.log(`💾 Auto-saving to folder: ${saveFolder}`)

// Save strategy document first
await saveToContentLibrary({
  content_type: 'strategy-document',
  title: `${strategy.subject} - Strategy`,
  content: generateStrategyContent(strategy),
  folder: saveFolder,
  metadata: {
    fromFramework: !!conversationState.frameworkFolder,
    strategyChosen: conversationState.strategyChosen
  }
})

// Save each piece
for (const piece of generatedContent) {
  await saveToContentLibrary({
    content_type: piece.type,
    title: `${strategy.subject} - ${piece.type}`,
    content: piece.content,
    folder: saveFolder
  })
}
```

### Step 7: Also Send to Strategic Planning Component (15 min)

**File**: Back in `NivCanvasComponent.tsx` button handler

**Update the Execute button** (line 736):

```typescript
<button onClick={() => {
  const framework = message.structured.framework

  // 1. Send to Execute tab (content generation)
  window.postMessage({
    type: 'niv-launch-orchestration',
    framework: framework,
    sessionId: 'canvas-session'
  }, '*')

  // 2. ALSO send to Strategic Planning component
  window.postMessage({
    type: 'addComponentToCanvas',
    detail: {
      moduleId: 'plan',
      action: 'window',
      framework: framework
    }
  }, '*')

  console.log('🚀 Framework sent to both Execute and Planning')
}}>
  🚀 Execute Campaign
</button>
```

## Summary of Changes

| File | Change | Time |
|------|--------|------|
| `niv-orchestrator-robust/index.ts` | Add folder when saving framework | 30min |
| `ExecuteModule.tsx` | Listen for execute message | 15min |
| `ExecuteTabProduction.tsx` | Show framework, add generate handler | 30min |
| `src/lib/framework-mapper.ts` | Create mapper utility (NEW FILE) | 1hr |
| `ExecuteTabProduction.tsx` | Call content generator with framework | 45min |
| `niv-content-intelligent-v2/index.ts` | Accept framework mode | 1hr |
| `NivCanvasComponent.tsx` | Update execute button to send to both | 15min |

**Total: ~4 hours**

## What This Gets You

1. ✅ Strategic frameworks save to their own folder
2. ✅ "Execute" button actually does something
3. ✅ Execute tab receives framework automatically
4. ✅ Content generator understands framework format
5. ✅ All generated content goes to same folder as framework
6. ✅ Strategic Planning component also gets framework
7. ✅ Memory Vault shows organized folders (already works)

## Testing Steps

1. Generate a strategic framework in NIV Canvas
2. Click "Execute Campaign" button
3. Verify Execute tab opens with framework pre-loaded
4. Select a content type (press-release)
5. Generate content
6. Check Memory Vault → should see folder `strategic-frameworks/{name}/`
7. Folder should contain: framework + generated content
8. Verify Strategic Planning also received framework

## This Matches Your Vision Exactly

> "When a user clicks execute I feel like it should just send the framework to nivcontentintelligentv2 and the strategicplanning component"

✅ Sends to both

> "nivcontentintelligentv2 saves the content in folder in memoryvault"

✅ Uses existing folder pattern from media plans

> "When strategicframework saves to memoryvault it should probably start a folder where the framework itself is just 1 file saved in it"

✅ Creates `strategic-frameworks/{name}/` folder

This is the simple, clean approach that mirrors what already works with media plans!
