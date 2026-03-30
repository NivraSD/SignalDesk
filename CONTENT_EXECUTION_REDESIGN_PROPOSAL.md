# Content Execution Redesign Proposal

## Current Issues

### 1. **Content Not Reflecting Request**
- **Problem**: We're sending generic prompts like "Generate a Blog post for Educators and Teachers (awareness phase)" without enough context
- **Root Cause**: The `buildContentRequest()` function (lines 644-696) doesn't include:
  - Current date/time context
  - Specific action details from the blueprint
  - The actual description/purpose from the tactical orchestration
  - Research findings that informed the strategy

### 2. **Random Content Types Without Journey Logic**
- **Problem**: Extracting individual content pieces loses the journey narrative
- **Root Cause**: Current approach extracts `pillar1_ownedActions` and `pillar4_mediaEngagement` as isolated pieces
- **Result**: A "Blog post", "LinkedIn article", "Media pitch" without showing HOW they work together to move stakeholders through awareness → consideration → conversion → advocacy

### 3. **Missing niv-content-intelligent-v2 Capabilities**
- **Problem**: Not leveraging the powerful campaign generation features
- **Capabilities We're Missing**:
  - `generate_media_plan` - Creates 7-piece coordinated campaigns (press release, media pitch, media list, Q&A, talking points, social post, email)
  - `create_strategy_document` - Creates strategic frameworks
  - Campaign-aware generation with research synthesis
  - Auto-saves to content_library with folder organization

### 4. **Date Issue**
- **Problem**: Content shows "2024" instead of "2025"
- **Root Cause**: No current date context passed to content generation

## Proposed Solution

### Architecture Change: Phase-Based Campaign Execution

Instead of extracting individual content pieces, execute **phase-based campaigns** that leverage niv-content-intelligent-v2's multi-content generation:

```
CURRENT (Per-Piece):
Blueprint → Extract 20 individual pieces → Generate each separately → Save

PROPOSED (Phase-Campaign):
Blueprint → Extract 4 phase campaigns → Generate each phase as coordinated campaign → Save
```

### New Flow

```typescript
// Phase 1 - Awareness Campaign
{
  phase: 'awareness',
  stakeholders: ['Educators', 'Students', 'Parents'],
  objective: '...from blueprint...',
  narrative: '...from blueprint...',
  channels: {
    owned: [
      { type: 'blog_post', description: '...',  target: 'Educators' },
      { type: 'linkedin_article', description: '...', target: 'Students' }
    ],
    media: [
      { type: 'media_pitch', journalists: [...], story: '...' }
    ]
  },
  timeline: 'Week 1-3',
  keyMessages: [...],
  research: { ...synthesis from research_data... }
}
```

Then call niv-content-intelligent-v2 with:
```json
{
  "message": "Generate a coordinated awareness phase campaign for [Campaign Goal]",
  "campaignContext": {
    "phase": "awareness",
    "objective": "...",
    "stakeholders": [...],
    "channels": { "owned": [...], "media": [...] },
    "researchFindings": "...",
    "currentDate": "2025-10-16"
  },
  "stage": "full"
}
```

### Benefits

1. **Strategic Coherence**: Content pieces work together as a campaign
2. **Better Context**: Claude sees the full phase strategy, not isolated pieces
3. **Research Integration**: Include research synthesis in generation context
4. **Date Awareness**: Pass current date for temporal context
5. **Progressive Engagement**: Clear stakeholder journey through phases
6. **Folder Organization**: Save as "Phase 1 - Awareness Campaign" with sub-items

### Implementation Plan

#### Option A: Phase-Campaign Executor (Recommended)
Create new `extractPhaseCampaigns()` function:
- Groups content by phase
- Bundles owned + media for each phase
- Calls niv-content-intelligent-v2 once per phase with full campaign context
- Saves with hierarchical organization

#### Option B: Enhanced Per-Piece with Better Context
Keep per-piece generation but:
- Add current date to system prompt
- Include full action description from blueprint
- Add research synthesis to context
- Group results by phase in UI

### Date Fix (Immediate)

Add to niv-content-intelligent-v2 system prompt:
```typescript
const currentDate = new Date().toISOString().split('T')[0] // 2025-10-16

NIV_CONTENT_SYSTEM_PROMPT = `...
IMPORTANT TEMPORAL CONTEXT:
- Current Date: ${currentDate}
- Always use current year (2025) in content
- Reference recent events appropriately
...`
```

## Recommended Implementation

**Phase 1** (Immediate - 30 min):
1. Fix date issue in niv-content-intelligent-v2
2. Add research synthesis to buildContentRequest()
3. Include action descriptions in content requests

**Phase 2** (Strategic - 2 hours):
1. Implement extractPhaseCampaigns() function
2. Create phase-campaign generation flow
3. Update ExecutionManager to show phase-based organization
4. Test with real blueprint

## Example: Transformed Output

### Current Output
```
✓ Blog post for Educators
✓ LinkedIn article for Students
✓ Media pitch for TechCrunch
✓ Twitter thread for Parents
```

### Proposed Output
```
✓ Phase 1: Awareness Campaign (4 pieces)
  - Educational blog: "Why Equity Matters in Schools" (Educators)
  - Student engagement: LinkedIn article on fairness (Students)
  - Media story: TechCrunch pitch on education innovation

✓ Phase 2: Consideration Campaign (5 pieces)
  - Case study: Success story with metrics
  - Webinar: Interactive Q&A (requires user execution)
  - Media deep-dive: NYT feature pitch
```

## Questions for User

1. **Do you want phase-based campaigns or enhanced per-piece?**
2. **Should we use niv-content-intelligent-v2's media plan capabilities for each phase?**
3. **How should we display the stakeholder journey in the UI?**
4. **Do you want the system to automatically skip non-executable content (webinars, events) or show them as "user action required"?**
