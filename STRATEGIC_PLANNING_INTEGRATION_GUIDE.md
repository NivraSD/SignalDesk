# Strategic Planning Integration Guide

## How to Wire Up the Strategic Planning Module

### Option 1: Add as New Stage in Campaign Builder (Recommended)

**File:** `src/components/campaign-builder/CampaignBuilderWizard.tsx`

1. **Update handleExecutionStart:**

```typescript
const handleExecutionStart = async () => {
  console.log('🚀 Opening Strategic Planning...')

  if (!session || !session.blueprint) {
    console.error('❌ No blueprint available')
    setError('No blueprint available')
    return
  }

  if (!organization) {
    setError('No organization selected')
    return
  }

  // Transition to strategic planning stage
  setSession(prev => ({
    ...prev!,
    stage: 'strategic_planning'
  }))
}
```

2. **Add strategic_planning case to render:**

```typescript
case 'strategic_planning':
  return (
    <div className="h-full">
      <StrategicPlanningModuleV3Complete
        blueprint={session.blueprint!}
        sessionId={session.sessionId}
        orgId={organization.id}
      />
    </div>
  )
```

3. **Import the component:**

```typescript
import StrategicPlanningModuleV3Complete from '@/components/modules/StrategicPlanningModuleV3Complete'
```

---

### Option 2: Modal/Sidebar Approach

**File:** `src/components/campaign-builder/CampaignBuilderWizard.tsx`

1. **Add state:**

```typescript
const [showStrategicPlanning, setShowStrategicPlanning] = useState(false)
```

2. **Update handleExecutionStart:**

```typescript
const handleExecutionStart = async () => {
  setShowStrategicPlanning(true)
}
```

3. **Add to render (after main content):**

```typescript
{showStrategicPlanning && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-gray-900 rounded-xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Strategic Execution Plan</h2>
        <button
          onClick={() => setShowStrategicPlanning(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <StrategicPlanningModuleV3Complete
          blueprint={session!.blueprint!}
          sessionId={session!.sessionId}
          orgId={organization!.id}
        />
      </div>
    </div>
  </div>
)}
```

---

### Option 3: Separate Route/Page

**File:** `src/app/strategic-planning/[sessionId]/page.tsx` (create new)

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StrategicPlanningModuleV3Complete from '@/components/modules/StrategicPlanningModuleV3Complete'

export default function StrategicPlanningPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [blueprint, setBlueprint] = useState(null)
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [sessionId])

  const loadSession = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('campaign_builder_sessions')
      .select('blueprint, organization_id')
      .eq('id', sessionId)
      .single()

    if (error) {
      console.error('Error loading session:', error)
      setLoading(false)
      return
    }

    setBlueprint(data.blueprint)
    setOrgId(data.organization_id)
    setLoading(false)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!blueprint) {
    return <div>Blueprint not found</div>
  }

  return (
    <div className="h-screen">
      <StrategicPlanningModuleV3Complete
        blueprint={blueprint}
        sessionId={sessionId}
        orgId={orgId}
      />
    </div>
  )
}
```

**Then update handleExecutionStart:**

```typescript
const handleExecutionStart = async () => {
  // Navigate to strategic planning page
  router.push(`/strategic-planning/${session.sessionId}`)
}
```

---

## Recommended Approach

**Use Option 1 (Add as Stage)** because:
- Keeps everything in the wizard flow
- Natural progression: Intent → Research → Blueprint → Strategic Planning
- User doesn't lose context
- Easy back/forward navigation

---

## Database Migration

Before using, run the migration:

```bash
supabase db push
```

Or manually apply:
```bash
psql $DATABASE_URL -f supabase/migrations/20251020_create_campaign_execution_items.sql
```

---

## Testing the Complete Flow

1. **Create campaign in Campaign Builder**
2. **Generate blueprint** (VECTOR_CAMPAIGN)
3. **Click "View in Strategic Planning"**
4. **Module loads** and parses blueprint into execution items
5. **Items saved to database** (campaign_execution_items table)
6. **Click "Generate" on any item**
   - Fetches org context from MemoryVault
   - Calls nivContentIntelligentV2
   - Saves generated content to database
   - Updates status to "generated"
7. **Click "View" on generated item**
   - Opens ContentViewerModal
   - Can edit, copy, download
   - Can mark as published
8. **Use "Generate All" for batch generation**
9. **Track progress** in Progress view
10. **Switch between Priority/Stakeholder/Progress views**

---

## What Each File Does

### Database
- **`supabase/migrations/20251020_create_campaign_execution_items.sql`**
  - Creates campaign_execution_items table
  - Stores individual content items with status
  - RLS policies for security

### Core Logic
- **`src/lib/memoryVaultIntegration.ts`**
  - Fetches org profile, brand guidelines
  - Fetches campaign context
  - Fetches previous generated content
  - Builds complete generation context

### Components
- **`src/components/modules/StrategicPlanningModuleV3Complete.tsx`**
  - Main orchestrator component
  - Parses blueprint into execution items
  - Saves/loads from database
  - Handles generation workflow
  - Three view modes (Priority, Stakeholder, Progress)

- **`src/components/execution/ContentViewerModal.tsx`**
  - Displays generated content
  - Edit/copy/download functionality
  - Publish workflow
  - Strategic context display

---

## Content Generation Flow

```
User clicks "Generate" on item
  ↓
StrategicPlanningModuleV3Complete.handleGenerate()
  ↓
1. Update status to 'generating'
  ↓
2. buildGenerationContext(sessionId, orgId, contentType)
   ├─ getOrganizationProfile()
   ├─ getBrandGuidelines()
   ├─ getCampaignContext()
   └─ getPreviousContent()
  ↓
3. buildGenerationRequest(item, context)
   ├─ Add org info
   ├─ Add campaign goal
   ├─ Add key messages
   └─ Add type-specific details
  ↓
4. Call nivContentIntelligentV2 edge function
  ↓
5. Receive generated content
  ↓
6. Update database (status, content, timestamp)
  ↓
7. Update local state
  ↓
User can view/edit/publish
```

---

## Key Features Implemented

✅ Priority-based organization (1-4)
✅ Stakeholder grouping
✅ Individual item generation
✅ Batch generation per stakeholder
✅ Database persistence
✅ MemoryVault integration
✅ Content viewer/editor
✅ Progress tracking
✅ Three view modes
✅ Copy/download functionality
✅ Publish workflow
✅ Error handling & retry

---

## What's Not Included

❌ Timeline/Gantt view (can add if needed)
❌ Task dependencies (out of scope for now)
❌ Team assignment (future feature)
❌ Notifications (future feature)
❌ Content scheduling/publishing to actual platforms (future feature)

The system is ready to use for on-demand content generation with full MemoryVault context!
