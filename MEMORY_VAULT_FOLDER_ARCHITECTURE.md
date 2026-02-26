# Memory Vault Folder Architecture for Campaign Content

## Current System (Reference)
niv-content-intelligent-v2's media plan system:
```
folder: `media-plans/${subject}-${year}`

Example: "media-plans/sora-2-launch-2025/"
  - strategy-document
  - press-release
  - media-pitch
  - media-list
  - qa-document
  - talking-points
  - social-post
  - email
```

## Proposed Hierarchy for Blueprint Campaigns

### Level 1: Campaign Folder (Created when blueprint is saved)
```
Format: `campaigns/${campaignName}-${timestamp}/`

Example: "campaigns/equity-engine-oct2025-abc123/"
```

### Level 2: Blueprint + Phase Subfolders
```
campaigns/equity-engine-oct2025-abc123/
  ├── blueprint.json              # The complete Blueprint V3
  ├── research-findings.json      # Research that informed the blueprint
  ├── phase-1-awareness/          # Content for awareness phase
  ├── phase-2-consideration/      # Content for consideration phase
  ├── phase-3-conversion/         # Content for conversion phase
  └── phase-4-advocacy/           # Content for advocacy phase
```

### Level 3: Content Within Each Phase
```
campaigns/equity-engine-oct2025-abc123/
  ├── blueprint.json
  │
  ├── phase-1-awareness/
  │   ├── phase-strategy.json     # Phase objective, narrative, key messages
  │   ├── blog-post-educators.md
  │   ├── linkedin-article-students.md
  │   ├── media-pitch-edweek.md
  │   ├── media-pitch-nyt.md
  │   └── twitter-thread-parents.md
  │
  ├── phase-2-consideration/
  │   ├── phase-strategy.json
  │   ├── case-study-district-success.md
  │   ├── white-paper-equity-impact.md
  │   ├── media-pitch-wsj.md
  │   └── linkedin-article-administrators.md
  │
  ├── phase-3-conversion/
  │   ├── phase-strategy.json
  │   ├── product-demo-video-script.md
  │   ├── roi-calculator.md
  │   ├── email-sequence-5-emails.md
  │   └── sales-deck-outline.md
  │
  └── phase-4-advocacy/
      ├── phase-strategy.json
      ├── user-testimonial-template.md
      ├── social-advocacy-toolkit.md
      └── referral-program-content.md
```

## Implementation in Code

### Step 1: Create Campaign Folder When Blueprint is Saved

In `niv-campaign-executor/index.ts` (after blueprint is saved):

```typescript
// After successfully saving blueprint to database
const campaignFolderName = generateCampaignFolderName(
  sessionData.campaignGoal,
  blueprintId
)

// Save blueprint to Memory Vault with folder
await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-memory?action=save-blueprint`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    blueprintId,
    blueprint,
    campaignType,
    orgId,
    sessionData,
    folder: `campaigns/${campaignFolderName}`,  // NEW: Folder hierarchy
    metadata: {
      industry,
      stakeholderGroups,
      timelineWeeks,
      pattern
    }
  })
})

// Also save research findings to same folder
await supabase.from('content_library').insert({
  organization_id: orgId,
  content_type: 'campaign_research',
  title: `${campaignGoal} - Research Findings`,
  content: JSON.stringify(research_data),
  folder: `campaigns/${campaignFolderName}`,  // Same folder
  metadata: {
    blueprint_id: blueprintId,
    campaign_type: campaignType
  },
  tags: ['research', 'campaign', campaignType],
  status: 'saved'
})
```

### Step 2: Create Phase Folders When Content is Generated

In `niv-content-intelligent-v2/index.ts` (in campaign_generation stage):

```typescript
// When generating phase campaign
const campaignFolderName = campaignContext.campaignFolder // Passed from executor
const phaseFolder = `${campaignFolderName}/phase-${phaseNumber}-${phaseName}`

// Save phase strategy document
await supabase.from('content_library').insert({
  organization_id: organizationId,
  content_type: 'phase_strategy',
  title: `Phase ${phaseNumber}: ${phaseName} - Strategy`,
  content: JSON.stringify({
    phase: phaseName,
    objective: campaignContext.objective,
    narrative: campaignContext.narrative,
    keyMessages: campaignContext.keyMessages,
    targetStakeholders: campaignContext.targetStakeholders,
    timeline: campaignContext.timeline
  }),
  folder: phaseFolder,
  metadata: {
    campaign_folder: campaignFolderName,
    phase: phaseName,
    phase_number: phaseNumber
  },
  tags: ['phase_strategy', phaseName, campaignType],
  status: 'saved'
})

// Save each content piece to phase folder
for (const content of allGeneratedContent) {
  await supabase.from('content_library').insert({
    organization_id: organizationId,
    content_type: content.type,
    title: `${phaseName} - ${content.type} - ${content.stakeholder}`,
    content: content.content,
    folder: phaseFolder,  // All content in this phase goes here
    metadata: {
      campaign_folder: campaignFolderName,
      blueprint_id: blueprintId,
      phase: phaseName,
      phase_number: phaseNumber,
      stakeholder: content.stakeholder,
      channel: content.channel  // 'owned' or 'media'
    },
    tags: [content.type, phaseName, content.stakeholder, content.channel],
    status: 'saved'
  })
}
```

### Step 3: Helper Functions

```typescript
function generateCampaignFolderName(campaignGoal: string, blueprintId: string): string {
  const slug = campaignGoal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const shortId = blueprintId.split('-')[0]

  return `${slug}-${timestamp}-${shortId}`
}

// Example: "equity-engine-20251016-abc123"
```

## Database Schema Requirements

Ensure `content_library` table has `folder` column:

```sql
ALTER TABLE content_library ADD COLUMN IF NOT EXISTS folder TEXT;

CREATE INDEX IF NOT EXISTS idx_content_library_folder
  ON content_library(folder);

CREATE INDEX IF NOT EXISTS idx_content_library_org_folder
  ON content_library(organization_id, folder);
```

## Benefits

### 1. **Clear Organization**
```
campaigns/
  equity-engine-oct2025/
    ├── blueprint.json
    └── phase-1-awareness/
        ├── blog-post-educators.md
        └── media-pitch-edweek.md
```

Instead of flat list:
```
content_library:
  - blog-post-educators (no context)
  - media-pitch-edweek (no context)
  - random-other-content
```

### 2. **Easy Retrieval**
```typescript
// Get all content for a campaign
const campaignContent = await supabase
  .from('content_library')
  .select('*')
  .eq('organization_id', orgId)
  .like('folder', 'campaigns/equity-engine-oct2025%')

// Get specific phase content
const awarenessContent = await supabase
  .from('content_library')
  .select('*')
  .eq('organization_id', orgId)
  .eq('folder', 'campaigns/equity-engine-oct2025/phase-1-awareness')
```

### 3. **Historical Context**
- See the blueprint that generated this content
- Understand the phase strategy
- Know which stakeholder journey it belongs to

### 4. **Reusability**
```typescript
// Find similar campaigns for learning
const similarCampaigns = await supabase
  .from('content_library')
  .select('*')
  .eq('organization_id', orgId)
  .eq('content_type', 'campaign_blueprint')
  .contains('metadata->stakeholder_groups', ['Educators', 'Students'])

// Copy successful phase strategies
const successfulAwarenessPhases = await supabase
  .from('content_library')
  .select('*')
  .eq('content_type', 'phase_strategy')
  .eq('metadata->phase', 'awareness')
```

## UI Display (ExecutionManager)

### Current: Flat List
```
Generated Content:
- Blog post for Educators
- LinkedIn article for Students
- Media pitch for EdWeek
```

### Proposed: Hierarchical Display
```
📁 Equity Engine Campaign (campaigns/equity-engine-oct2025-abc123)
   📄 Blueprint V3 (saved)
   📄 Research Findings (saved)

   📂 Phase 1: Awareness (3/5 pieces generated)
      ✓ Educational blog for Educators
      ✓ LinkedIn article for Students
      ✓ Media pitch: EdWeek reporter
      ⏳ Twitter thread for Parents (generating...)
      ⏳ Media pitch: NYT education beat (pending)

   📂 Phase 2: Consideration (0/4 pieces)
      ⏸️ Case study (awaiting Phase 1 completion)
      ⏸️ White paper (awaiting Phase 1 completion)
      ...

   📂 Phase 3: Conversion (not started)
   📂 Phase 4: Advocacy (not started)
```

## Migration Path

### Immediate (Phase 1 Implementation)
1. Add `folder` column to content_library
2. Update niv-campaign-executor to create campaign folder on blueprint save
3. Update niv-content-intelligent-v2 to save phase content to subfolders

### Future Enhancements
1. Add folder browser to UI
2. Campaign templates based on successful folders
3. Export entire campaign folder as zip
4. Version control for campaign iterations

## Example Flow

1. **User creates campaign in Campaign Builder**
   - Research → Positioning → Blueprint generated
   - Blueprint saved to `campaigns/equity-engine-oct2025-abc123/blueprint.json`

2. **User clicks "Execute Campaign"**
   - Executor extracts 4 phase campaigns
   - Calls niv-content-intelligent-v2 for Phase 1 (awareness)
   - Content saved to `campaigns/equity-engine-oct2025-abc123/phase-1-awareness/`

3. **Phase 1 completes**
   - UI shows folder structure
   - User can review all awareness content together
   - User can download phase folder

4. **User triggers Phase 2**
   - Content saved to `campaigns/equity-engine-oct2025-abc123/phase-2-consideration/`
   - Links back to same blueprint

5. **Campaign complete**
   - Full folder with 4 phases + blueprint + research
   - Can be cloned as template for similar campaigns
   - Learnings extracted automatically

## File Naming Convention

```
Format: `${contentType}-${stakeholder}-${uniquifier}.md`

Examples:
- blog-post-educators-equity-matters.md
- linkedin-article-students-fairness.md
- media-pitch-edweek-district-success.md
- case-study-springfield-12pct-improvement.md
```

## Metadata Tracking

Every content piece includes:
```json
{
  "campaign_folder": "campaigns/equity-engine-oct2025-abc123",
  "blueprint_id": "abc-123-def-456",
  "phase": "awareness",
  "phase_number": 1,
  "stakeholder": "Educators",
  "channel": "owned",
  "generated_at": "2025-10-16T10:30:00Z",
  "part_of_campaign": true
}
```

This allows:
- Linking content back to blueprint
- Understanding campaign progression
- Measuring performance by phase
- Learning from successful campaigns
