# Campaign Content Generation - Complete Implementation Roadmap

## What We're Building

Transform from **20+ isolated content pieces** to **4 coordinated phase campaigns** with proper Memory Vault organization.

## Architecture Documents Created

1. **CONTENT_EXECUTION_REDESIGN_PROPOSAL.md** - Problem analysis and solution overview
2. **PHASE_CAMPAIGN_ARCHITECTURE.md** - Technical architecture for multi-type orchestration
3. **MEMORY_VAULT_FOLDER_ARCHITECTURE.md** - Folder hierarchy and organization system

## Current Status ✅

### Completed
- [x] Date issue fixed (current date now included in all requests)
- [x] Enhanced context (research, positioning, psychological strategies)
- [x] Action descriptions included
- [x] Video content filtering
- [x] Database schema verified (`content_library.folder` exists)
- [x] Architecture fully designed
- [x] Phase-campaign extraction (extractPhaseCampaigns function)
- [x] Multi-type orchestration in niv-content-intelligent-v2 (campaign_generation stage)
- [x] Memory Vault folder creation (campaigns/{name}/phase-{n}-{name}/)
- [x] Both edge functions deployed

### Ready to Test
- [ ] Generate test VECTOR campaign
- [ ] Verify folder structure in content_library
- [ ] Check content coherence

### Pending Implementation
- [ ] ExecutionManager UI updates

## Implementation Steps

### Step 1: Extract Phase Campaigns (niv-campaign-executor)

**File**: `supabase/functions/niv-campaign-executor/index.ts`

**Replace**: `extractContentInventory()` function

**With**: `extractPhaseCampaigns()` function

```typescript
function extractPhaseCampaigns(
  blueprint: any,
  campaignType: string
): PhaseCampaign[] {
  const phaseCampaigns: PhaseCampaign[] = []

  if (campaignType === 'VECTOR_CAMPAIGN' && blueprint.part3_tacticalOrchestration) {
    const phases = [
      'phase1_awareness',
      'phase2_consideration',
      'phase3_conversion',
      'phase4_advocacy'
    ]

    phases.forEach((phaseKey, phaseNumber) => {
      const phaseData = blueprint.part3_tacticalOrchestration[phaseKey]
      if (!phaseData) return

      const phaseName = phaseKey.split('_')[1] // 'awareness', 'consideration', etc.

      // Extract owned content and media engagement together
      const ownedContent = extractOwnedContent(phaseData.pillar1_ownedActions)
      const mediaEngagement = extractMediaEngagement(phaseData.pillar4_mediaEngagement)

      phaseCampaigns.push({
        phase: phaseName,
        phaseNumber: phaseNumber + 1,
        objective: phaseData.objective,
        narrative: phaseData.convergencePoint,
        stakeholders: extractStakeholders(phaseData),
        ownedContent,
        mediaEngagement,
        keyMessages: phaseData.keyMessages || [],
        timeline: `Week ${phaseNumber * 3 + 1}-${(phaseNumber + 1) * 3}`
      })
    })
  }

  return phaseCampaigns
}
```

**Estimated time**: 2 hours

### Step 2: Add `campaign_generation` Stage (niv-content-intelligent-v2)

**File**: `supabase/functions/niv-content-intelligent-v2/index.ts`

**Add after line ~1800** (after other tool handlers):

```typescript
// Handle campaign generation (multi-content orchestration)
if (stage === 'campaign_generation' && campaignContext) {
  console.log('🎯 Campaign Generation Mode - Multi-Type Orchestration')

  const {
    phase,
    objective,
    narrative,
    keyMessages,
    contentRequirements,
    researchInsights,
    currentDate,
    campaignFolder
  } = campaignContext

  const allGeneratedContent = []

  // Generate owned content with shared context
  if (contentRequirements.owned) {
    for (const ownedReq of contentRequirements.owned) {
      try {
        const content = await callMCPService(ownedReq.type, {
          organization: orgProfile.organizationName,
          subject: `${phase} phase: ${ownedReq.purpose}`,
          narrative: narrative,
          keyPoints: keyMessages,
          targetAudiences: [ownedReq.stakeholder],
          research: researchInsights?.join('; ') || '',
          specificKeyPoints: ownedReq.keyPoints,
          currentDate: currentDate,
          fullContext: campaignContext
        })

        allGeneratedContent.push({
          type: ownedReq.type,
          stakeholder: ownedReq.stakeholder,
          content: content,
          channel: 'owned',
          purpose: ownedReq.purpose
        })

        console.log(`✅ Generated ${ownedReq.type} for ${ownedReq.stakeholder}`)
      } catch (error) {
        console.error(`❌ Failed to generate ${ownedReq.type}:`, error)
      }
    }
  }

  // Generate media engagement with shared context
  if (contentRequirements.media) {
    for (const mediaReq of contentRequirements.media) {
      try {
        const content = await callMCPService(mediaReq.type, {
          organization: orgProfile.organizationName,
          subject: mediaReq.story,
          narrative: `${narrative} ${mediaReq.positioning}`,
          keyPoints: keyMessages,
          mediaTargets: mediaReq.journalists,
          research: researchInsights?.join('; ') || '',
          currentDate: currentDate,
          fullContext: campaignContext
        })

        allGeneratedContent.push({
          type: mediaReq.type,
          journalists: mediaReq.journalists,
          content: content,
          channel: 'media',
          story: mediaReq.story
        })

        console.log(`✅ Generated ${mediaReq.type} for ${mediaReq.journalists?.join(', ')}`)
      } catch (error) {
        console.error(`❌ Failed to generate ${mediaReq.type}:`, error)
      }
    }
  }

  // Save all content to Memory Vault with folder organization
  const phaseFolder = `${campaignFolder}/phase-${campaignContext.phaseNumber}-${phase}`

  // Save phase strategy document
  await supabase.from('content_library').insert({
    organization_id: organizationId,
    content_type: 'phase_strategy',
    title: `Phase ${campaignContext.phaseNumber}: ${phase} - Strategy`,
    content: JSON.stringify({
      phase,
      objective,
      narrative,
      keyMessages,
      stakeholders: campaignContext.targetStakeholders,
      timeline: campaignContext.timeline
    }),
    folder: phaseFolder,
    metadata: {
      campaign_folder: campaignFolder,
      blueprint_id: campaignContext.blueprintId,
      phase,
      phase_number: campaignContext.phaseNumber
    },
    tags: ['phase_strategy', phase, campaignContext.campaignType],
    status: 'saved'
  })

  // Save each content piece
  for (const content of allGeneratedContent) {
    await supabase.from('content_library').insert({
      organization_id: organizationId,
      content_type: content.type,
      title: `${phase} - ${content.type} - ${content.stakeholder || content.journalists?.[0] || 'general'}`,
      content: content.content,
      folder: phaseFolder,
      metadata: {
        campaign_folder: campaignFolder,
        blueprint_id: campaignContext.blueprintId,
        phase,
        phase_number: campaignContext.phaseNumber,
        stakeholder: content.stakeholder,
        channel: content.channel,
        generated_at: new Date().toISOString()
      },
      tags: [content.type, phase, content.stakeholder || 'media', content.channel],
      status: 'saved'
    })
  }

  console.log(`✅ Saved ${allGeneratedContent.length} pieces to ${phaseFolder}`)

  return new Response(JSON.stringify({
    success: true,
    phase: phase,
    generatedContent: allGeneratedContent,
    folder: phaseFolder,
    metadata: {
      objective,
      stakeholders: campaignContext.targetStakeholders,
      timeline: campaignContext.timeline
    }
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
```

**Estimated time**: 3 hours

### Step 3: Update Campaign Executor to Use Phase Campaigns

**File**: `supabase/functions/niv-campaign-executor/index.ts`

**Replace**: The content generation loop (lines ~160-182)

**With**: Phase-campaign orchestration:

```typescript
// Create campaign folder
const campaignFolderName = generateCampaignFolderName(
  sessionData.campaign_goal,
  blueprintId
)
const campaignFolder = `campaigns/${campaignFolderName}`

// Save blueprint to Memory Vault with folder
await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-memory?action=save-blueprint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  },
  body: JSON.stringify({
    blueprintId,
    blueprint,
    campaignType,
    orgId,
    sessionData: {
      campaignGoal: sessionData.campaign_goal,
      researchFindings: research_data,
      selectedPositioning: sessionData.selected_positioning
    },
    folder: campaignFolder,
    metadata: {
      industry: organizationContext.industry,
      stakeholderGroups: blueprint.part1_strategicFoundation?.targetStakeholders?.map((s: any) => s.name),
      timelineWeeks: blueprint.overview?.timeline_weeks || 12
    }
  })
})

// Extract phase campaigns instead of individual pieces
const phaseCampaigns = extractPhaseCampaigns(blueprint, campaignType)

console.log(`📦 Extracted ${phaseCampaigns.length} phase campaigns`)

// Generate content for each phase campaign
const allGeneratedContent = []

for (const phaseCampaign of phaseCampaigns) {
  console.log(`🎨 Generating ${phaseCampaign.phase} phase campaign...`)

  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-content-intelligent-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        message: `Generate coordinated ${phaseCampaign.phase} phase campaign`,
        organizationContext: {
          organizationId: organizationContext.name,
          organizationName: organizationContext.name,
          industry: organizationContext.industry
        },
        stage: 'campaign_generation',
        campaignContext: {
          blueprintId,
          campaignType,
          campaignFolder,
          phase: phaseCampaign.phase,
          phaseNumber: phaseCampaign.phaseNumber,
          objective: phaseCampaign.objective,
          narrative: phaseCampaign.narrative,
          targetStakeholders: phaseCampaign.stakeholders,
          positioning: positioning,
          keyMessages: phaseCampaign.keyMessages,
          researchInsights: research_data.keyInsights || [],
          timeline: phaseCampaign.timeline,
          currentDate: new Date().toISOString().split('T')[0],
          contentRequirements: {
            owned: phaseCampaign.ownedContent,
            media: phaseCampaign.mediaEngagement
          }
        }
      })
    }
  )

  if (response.ok) {
    const phaseResult = await response.json()
    allGeneratedContent.push(...phaseResult.generatedContent)
    console.log(`✅ ${phaseCampaign.phase} phase complete (${phaseResult.generatedContent.length} pieces)`)
  } else {
    console.error(`❌ ${phaseCampaign.phase} phase failed:`, await response.text())
  }
}

return new Response(
  JSON.stringify({
    success: true,
    campaignFolder,
    phasesGenerated: phaseCampaigns.length,
    totalContentPieces: allGeneratedContent.length,
    content: allGeneratedContent
  }),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
)
```

**Estimated time**: 2 hours

### Step 4: Update ExecutionManager UI

**File**: `src/components/campaign-builder/ExecutionManager.tsx`

**Add**: Hierarchical display instead of flat list

- Group content by phase
- Show folder structure
- Display phase objectives
- Track progress per phase

**Estimated time**: 3 hours

## Total Implementation Time: ~10 hours

## Testing Plan

1. **Generate a test campaign** with Blueprint V3
2. **Verify folder structure** in content_library
3. **Check content coherence** - do all pieces in a phase tell the same story?
4. **Test UI display** - is the hierarchy clear?
5. **Verify Memory Vault retrieval** - can we find content by folder?

## Expected Results

### Before
```
✓ Blog post
✓ LinkedIn article
✓ Media pitch
✓ Twitter thread
... (17 more isolated pieces)
```

### After
```
📁 Equity Engine Campaign (campaigns/equity-engine-20251016-abc123)
   📄 Blueprint V3
   📄 Research Findings

   📂 Phase 1: Awareness (5 pieces)
      ✓ Educational blog for Educators
      ✓ LinkedIn article for Students
      ✓ Media pitch: EdWeek
      ✓ Media pitch: NYT
      ✓ Twitter thread for Parents

   📂 Phase 2: Consideration (4 pieces)
      ✓ Case study: Springfield District
      ✓ White paper: Equity Impact
      ✓ Media pitch: WSJ
      ✓ LinkedIn article for Administrators

   📂 Phase 3: Conversion (pending)
   📂 Phase 4: Advocacy (pending)
```

## Benefits Delivered

1. ✅ **Strategic Coherence** - Content tells a unified story
2. ✅ **Less Blueprint Burden** - Multi-type orchestration handles details
3. ✅ **Proper Organization** - Memory Vault folders for retrieval
4. ✅ **Stakeholder Journey** - Clear progression through phases
5. ✅ **Current Dates** - All content uses 2025
6. ✅ **Rich Context** - Research, positioning, psychological strategies included

## Ready to Start?

We have:
- ✅ Complete architecture designed
- ✅ Database schema verified
- ✅ Implementation plan with time estimates
- ✅ Testing plan defined
- ✅ Expected results documented

Next step: Implement `extractPhaseCampaigns()` function in niv-campaign-executor.

Shall we proceed?
