# Strategic Planning Module V3 - Complete

## What Changed

**Old Model (Obsolete):**
- Phases = Awareness → Consideration → Conversion → Advocacy
- Phase-based content organization
- Separate strategic planning vs. execution

**New Model:**
- **Priorities 1-4 ARE the phases**
- Priority-based content organization matching blueprint structure
- Unified strategic planning + execution orchestrator

---

## New Component: StrategicPlanningModuleV3

**Location:** `src/components/modules/StrategicPlanningModuleV3.tsx`

### Features Built

#### 1. **Three View Modes**

**By Priority (Default View):**
```
Priority 1: Launch Critical
├─ Stakeholder: Industry Analysts
│   ├─ Media Pitch: "Why vertical integration matters" → Kyle Wiggers (TechCrunch)
│   │   [Generate] button
│   ├─ Social Post: LinkedIn announcement by CEO
│   │   [Generate] button
│   └─ Thought Leadership: "The chip revolution" by CTO → VentureBeat
│       [Generate] button
├─ Stakeholder: Tech Influencers
│   └─ ... (similar structure)
└─ [Generate All (12)] button per stakeholder
```

**By Stakeholder:**
- Groups all content by stakeholder across all priorities
- Shows stakeholder priority level
- Same generate functionality

**Progress Dashboard:**
- Overall completion percentage
- Total/Generated/Pending/Generating counts
- Progress bars by priority level
- Visual progress tracking

#### 2. **Content Item Cards**

Each content item shows:
- **Type indicator** with emoji (📰 media pitch, 📱 social, ✍️ thought leadership, 👤 user action)
- **Topic/angle** - what the content is about
- **Target** - who/where (journalist at outlet, person on platform, etc.)
- **Status indicator** - pending/generating/generated/published
- **Generate button** - triggers content generation (disabled for user actions)
- **View button** - appears after generation

#### 3. **Batch Generation**

- "Generate All" button per stakeholder
- Generates all pending items for that stakeholder in sequence
- Progress indication during batch generation
- Individual item generation also available

#### 4. **Progress Tracking**

- Real-time progress updates
- Percentage completion overall
- Progress by priority level
- Item counts (total, generated, pending, in-progress)

---

## Data Flow

### Input (from Blueprint)
```typescript
blueprint.part3_stakeholderOrchestration.stakeholderOrchestrationPlans[]
  └─ stakeholder (name, priority, psychologicalProfile)
  └─ influenceLevers[]
      └─ campaign
          ├─ mediaPitches[]
          ├─ socialPosts[]
          ├─ thoughtLeadership[]
          └─ additionalTactics[] (user must execute)
```

### Processing
1. Parse blueprint into flat ContentItem[] array
2. Each item contains:
   - Stakeholder info (name, priority)
   - Lever info (name, priority)
   - Content details (type, topic, target)
   - Generation status

### Organization
- Group by stakeholder priority (1-4)
- Within each priority, group by stakeholder
- Within each stakeholder, show all content items

---

## What's Still Needed

### 1. **MemoryVault Integration** ⚠️

Currently missing - needs to:
```typescript
// When generating content, fetch:
const orgProfile = await memoryVault.getOrganizationProfile(orgId)
const brandGuidelines = await memoryVault.getBrandGuidelines(orgId)
const previousContent = await memoryVault.getCampaignContent(sessionId)

// Pass to generation:
await generateContent({
  contentType: item.type,
  topic: item.topic,
  stakeholder: item.stakeholder,
  orgProfile,
  brandGuidelines,
  context: item.details
})
```

### 2. **Content Generation Integration**

Replace the TODO in `handleGenerate()`:
```typescript
const handleGenerate = async (item: ContentItem) => {
  const supabase = createClient()

  // Call nivContentIntelligentV2
  const { data, error } = await supabase.functions.invoke('niv-content-intelligent-v2', {
    body: {
      sessionId,
      orgId,
      contentType: mapContentType(item.type),
      request: buildGenerationRequest(item),
      selectedContentType: mapContentType(item.type)
    }
  })

  if (error) throw error

  // Update item with generated content
  setContentItems(prev => prev.map(i =>
    i.id === item.id
      ? {
          ...i,
          status: 'generated',
          generatedContent: data.content,
          generatedAt: new Date()
        }
      : i
  ))
}
```

### 3. **Content Viewer Modal**

When user clicks "View" on generated content:
- Show modal with full generated content
- Edit capability
- Copy to clipboard
- Publish/share options
- Save to MemoryVault

### 4. **Database Persistence**

Save execution state to Supabase:
```sql
CREATE TABLE campaign_execution_items (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES campaign_builder_sessions(id),
  stakeholder TEXT,
  stakeholder_priority INTEGER,
  content_type TEXT,
  topic TEXT,
  target TEXT,
  details JSONB,
  status TEXT,
  generated_content TEXT,
  generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. **Wire It Up to Blueprint**

Update BlueprintV3Presentation.tsx button handler:
```typescript
const handleViewInStrategicPlanning = () => {
  // Navigate to strategic planning with blueprint data
  router.push(`/strategic-planning/${sessionId}`)

  // Or render in modal/sidebar:
  setShowStrategicPlanning(true)
}

// In render:
{showStrategicPlanning && (
  <StrategicPlanningModuleV3
    blueprint={blueprint}
    sessionId={sessionId}
    orgId={orgId}
  />
)}
```

---

## Key Design Decisions

1. **Priorities = Phases**: Aligns with new blueprint structure
2. **Flat content array**: Easier to filter/search/track than nested structure
3. **Three views**: Flexibility in how users navigate execution
4. **On-demand generation**: User controls what gets generated and when
5. **Batch capability**: Efficient for generating multiple items
6. **Visual progress**: Clear visibility into campaign execution status

---

## Next Steps

1. **Immediate**: Integrate actual content generation (nivContentIntelligentV2)
2. **Next**: Add MemoryVault integration for org context
3. **Then**: Build content viewer/editor modal
4. **Finally**: Database persistence for execution state

---

## How to Use

```tsx
import StrategicPlanningModuleV3 from '@/components/modules/StrategicPlanningModuleV3'

// In your component:
<StrategicPlanningModuleV3
  blueprint={blueprintData}
  sessionId={sessionId}
  orgId={orgId}
  onExecute={(items) => {
    // Optional callback when execution starts
    console.log('Executing items:', items)
  }}
/>
```

The component handles everything else internally - parsing, organizing, generating, and tracking progress.
