# Phase-Campaign Architecture Design
## Leveraging niv-content-intelligent-v2's Multi-Type Orchestration

## Current Problem
The blueprint generates **tactical orchestration** with detailed actions, but we're:
1. Extracting each action as an individual piece
2. Making 20+ separate calls to niv-content-intelligent-v2
3. Each call has isolated context, losing strategic coherence
4. No coordination between owned content and media engagement

## The Insight
niv-content-intelligent-v2's `generate_media_plan` shows us the pattern:
- Takes ONE unified strategy
- Generates MULTIPLE content types in a coordinated pass
- Each piece shares the same strategic context
- Result: Coherent campaign, not random pieces

## Proposed Architecture

### Phase 1: Extract Phase Campaigns (Not Individual Pieces)

Instead of:
```typescript
// Current: Extract 20 individual pieces
extractContentInventory() → [
  { type: 'blog_post', stakeholder: 'Educators', ... },
  { type: 'linkedin_article', stakeholder: 'Students', ... },
  { type: 'media_pitch', journalist: 'TechCrunch', ... },
  // ... 17 more isolated pieces
]
```

Do this:
```typescript
// Proposed: Extract 4 phase campaigns
extractPhaseCampaigns() → [
  {
    phase: 'awareness',
    objective: 'Build awareness of equity gaps in education',
    narrative: 'Data-driven approach to improving student outcomes',
    stakeholders: ['Educators', 'Students', 'Parents'],
    ownedContent: [
      {
        type: 'blog-post',
        stakeholder: 'Educators',
        purpose: 'Educational blog explaining why equity matters',
        keyPoints: ['Resource disparities impact outcomes', 'Data shows 12% improvement']
      },
      {
        type: 'linkedin-article',
        stakeholder: 'Students',
        purpose: 'Student-focused article on fairness in education',
        keyPoints: ['Every student deserves equal opportunity']
      }
    ],
    mediaEngagement: [
      {
        type: 'media-pitch',
        journalists: ['EdWeek reporter', 'NYT education beat'],
        story: 'New data shows equity tools improve student outcomes by 12%',
        positioningMessage: 'First platform bringing equity analytics to K-12'
      }
    ],
    keyMessages: ['Equity is essential', 'Data drives decisions', 'Every student matters'],
    researchInsights: ['73% of educators report disparities', 'Growing parent demand for equity metrics'],
    timeline: 'Week 1-3'
  },
  // ... 3 more phase campaigns
]
```

### Phase 2: Call niv-content-intelligent-v2 Once Per Phase

```typescript
async function generatePhaseCampaign(phaseCampaign, blueprint, organizationContext) {
  // Build unified strategic request
  const campaignRequest = {
    message: `Generate a coordinated ${phaseCampaign.phase} phase campaign for "${blueprint.campaignGoal}"`,

    organizationContext: {
      organizationId: organizationContext.name,
      organizationName: organizationContext.name,
      industry: organizationContext.industry
    },

    campaignContext: {
      phase: phaseCampaign.phase,
      objective: phaseCampaign.objective,
      narrative: phaseCampaign.narrative,
      targetStakeholders: phaseCampaign.stakeholders,
      positioning: blueprint.positioning,
      keyMessages: phaseCampaign.keyMessages,
      researchInsights: phaseCampaign.researchInsights,
      timeline: phaseCampaign.timeline,
      currentDate: new Date().toISOString().split('T')[0],

      // The content types we need, with their purposes
      contentRequirements: {
        owned: phaseCampaign.ownedContent.map(c => ({
          type: c.type,
          stakeholder: c.stakeholder,
          purpose: c.purpose,
          keyPoints: c.keyPoints
        })),
        media: phaseCampaign.mediaEngagement.map(m => ({
          type: m.type,
          journalists: m.journalists,
          story: m.story,
          positioning: m.positioningMessage
        }))
      }
    },

    stage: 'campaign_generation'  // New stage for multi-type orchestration
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify(campaignRequest)
  })

  return response.json()  // Returns all content pieces for this phase
}
```

### Phase 3: Update niv-content-intelligent-v2 to Handle Campaign Requests

Add new stage to niv-content-intelligent-v2:

```typescript
// In niv-content-intelligent-v2/index.ts

if (stage === 'campaign_generation' && campaignContext) {
  console.log('🎯 Campaign Generation Mode')

  const { contentRequirements, phase, narrative, keyMessages } = campaignContext
  const allContent = []

  // Generate owned content (coordinated)
  for (const ownedReq of contentRequirements.owned) {
    const content = await callMCPService(ownedReq.type, {
      organization: orgProfile.organizationName,
      subject: `${phase} phase content for ${ownedReq.stakeholder}`,
      narrative: narrative,
      keyPoints: keyMessages,
      targetAudiences: [ownedReq.stakeholder],
      research: campaignContext.researchInsights?.join('; '),
      purpose: ownedReq.purpose,
      specificKeyPoints: ownedReq.keyPoints,
      fullContext: campaignContext  // Everything available for context
    })

    allContent.push({
      type: ownedReq.type,
      stakeholder: ownedReq.stakeholder,
      content: content,
      channel: 'owned'
    })
  }

  // Generate media engagement (coordinated)
  for (const mediaReq of contentRequirements.media) {
    const content = await callMCPService(mediaReq.type, {
      organization: orgProfile.organizationName,
      subject: mediaReq.story,
      narrative: narrative + ' ' + mediaReq.positioning,
      keyPoints: keyMessages,
      mediaTargets: mediaReq.journalists,
      research: campaignContext.researchInsights?.join('; '),
      fullContext: campaignContext
    })

    allContent.push({
      type: mediaReq.type,
      journalists: mediaReq.journalists,
      content: content,
      channel: 'media'
    })
  }

  return {
    success: true,
    phase: phase,
    generatedContent: allContent,
    metadata: {
      objective: campaignContext.objective,
      stakeholders: campaignContext.targetStakeholders,
      timeline: campaignContext.timeline
    }
  }
}
```

## Benefits of This Approach

### 1. **Strategic Coherence**
- All content in a phase shares the same narrative, key messages, research insights
- Owned content and media pitches tell the same story
- Content naturally progresses stakeholders through the journey

### 2. **Reduced Complexity on Blueprint**
- Blueprint defines HIGH-LEVEL strategy (objectives, narratives, stakeholders)
- Doesn't need to specify every individual piece
- Multi-type orchestration figures out HOW to execute the strategy

### 3. **Better Context**
- Each piece has full phase context
- Research insights inform all content
- Positioning is consistent across channels

### 4. **Leverages Existing Infrastructure**
- Uses niv-content-intelligent-v2's callMCPService pattern
- Reuses mcp-content routing
- No new services needed

### 5. **Natural Grouping for UI**
```
✓ Phase 1: Awareness Campaign (6 pieces generated)
  Owned Content:
    - Educational blog for Educators
    - LinkedIn article for Students
    - Parent guide for Parents
  Media Engagement:
    - EdWeek pitch: "New data shows equity impact"
    - NYT pitch: "Districts see 12% improvement"
  Social Amplification:
    - Twitter thread on equity data
```

## Implementation Plan

### Step 1: Update niv-campaign-executor
- Replace `extractContentInventory()` with `extractPhaseCampaigns()`
- Group by phase, consolidate content types
- Bundle owned + media per phase

### Step 2: Add campaign_generation stage to niv-content-intelligent-v2
- Handle multi-type requests with shared context
- Call callMCPService in coordinated sequence
- Return grouped results

### Step 3: Update ExecutionManager UI
- Display by phase → channel → content
- Show phase objectives and timelines
- Indicate stakeholder journey progression

### Step 4: Test & Refine
- Generate a campaign
- Verify content coherence
- Adjust context sharing as needed

## Example: Education Equity Campaign

**Input to executor:**
```json
{
  "blueprintId": "abc-123",
  "blueprint": { /* Blueprint V3 with 4-phase tactical orchestration */ },
  "campaignType": "VECTOR_CAMPAIGN",
  "orgId": "1"
}
```

**Extracted phase campaigns:**
```javascript
[
  {
    phase: 'awareness',
    objective: 'Build awareness of equity gaps',
    ownedContent: [
      { type: 'blog-post', stakeholder: 'Educators', purpose: '...' },
      { type: 'linkedin-article', stakeholder: 'Students', purpose: '...' }
    ],
    mediaEngagement: [
      { type: 'media-pitch', journalists: ['EdWeek'], story: '...' }
    ]
  },
  // ... 3 more phases
]
```

**Calls to niv-content-intelligent-v2:**
```
1. POST /niv-content-intelligent-v2 { stage: 'campaign_generation', phase: 'awareness', ... }
   → Returns 5 pieces (2 owned + 2 media + 1 social)

2. POST /niv-content-intelligent-v2 { stage: 'campaign_generation', phase: 'consideration', ... }
   → Returns 6 pieces

3. POST /niv-content-intelligent-v2 { stage: 'campaign_generation', phase: 'conversion', ... }
   → Returns 4 pieces

4. POST /niv-content-intelligent-v2 { stage: 'campaign_generation', phase: 'advocacy', ... }
   → Returns 5 pieces
```

**Total:** 4 coordinated campaigns instead of 20+ isolated pieces

## Key Differences from Current Approach

| Aspect | Current (Per-Piece) | Proposed (Phase-Campaign) |
|--------|---------------------|---------------------------|
| Extraction | 20 individual pieces | 4 phase campaigns |
| API Calls | 20 calls to niv-content-intelligent-v2 | 4 calls to niv-content-intelligent-v2 |
| Context | Each piece isolated | Phase-level shared context |
| Coherence | Random assortment | Coordinated campaigns |
| UI Display | Flat list | Phased journey |
| Blueprint Burden | Must specify every detail | High-level strategy only |

## Next Steps

1. Implement `extractPhaseCampaigns()` function
2. Add `campaign_generation` stage to niv-content-intelligent-v2
3. Test with real blueprint
4. Update ExecutionManager UI
5. Deploy

Ready to implement?
