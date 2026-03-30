# Stakeholder Orchestration Refactor - Complete Implementation Plan

## Overview

Moving from **4-phase temporal structure** to **stakeholder-centric orchestration with priority-sequenced execution**.

### Why This Refactor:
1. Current 4-phase structure (awareness→consideration→conversion→advocacy) is artificial
2. Psychological influence intelligence from Part 2 gets lost
3. User needs clear "what to do next" not "what happens in week 3"
4. Different stakeholders move at different speeds
5. Priority/sequence > arbitrary timeline

---

## Architecture Changes

### OLD FLOW:
```
Blueprint Part 3: Tactical Orchestration (4 phases)
  → Executor loops through phases
    → Generates content per phase
      → Saves to phases array in database
        → UI shows phase-based view
```

### NEW FLOW:
```
Blueprint Part 3: Stakeholder Orchestration Plans
  → Executor loops through stakeholders → levers → steps
    → Generates content per step
      → Saves to stakeholder orchestration structure
        → UI shows checklist interface with progress tracking
```

---

## Implementation Phases

### PHASE 1: Blueprint Generation (Foundation)
**Goal**: Generate new stakeholder orchestration structure in Part 3

**Files to Create/Modify:**
1. `/supabase/functions/niv-blueprint-stakeholder-orchestration/index.ts` (NEW)
   - Takes Part 1 (Strategic Foundation) + Part 2 (Psychological Influence)
   - Generates stakeholder orchestration plans
   - For each stakeholder:
     - Priority order
     - For each influence lever:
       - Priority order
       - Execution sequence (steps)
       - What Signaldesk auto-executes
       - What user must execute
       - Dependencies between steps

2. Update blueprint types in `/src/types/`
   ```typescript
   interface BlueprintV4 {
     part1_strategicFoundation: {...}
     part2_psychologicalInfluence: {...}
     part3_stakeholderOrchestration: {
       stakeholderOrchestrationPlans: StakeholderOrchestrationPlan[]
     }
   }

   interface StakeholderOrchestrationPlan {
     stakeholder: {
       name: string
       priority: number
       psychologicalProfile: any
     }
     influenceLevers: InfluenceLever[]
     progress: {
       totalLevers: number
       completedLevers: number
       percentComplete: number
     }
   }

   interface InfluenceLever {
     leverName: string
     leverType: string // "Social Proof", "Authority", "Reciprocity", etc.
     priority: number
     objective: string
     executionSequence: ExecutionStep[]
     completionCriteria: {
       required: string[]
       optional: string[]
     }
     progress: {
       totalSteps: number
       completedSteps: number
       currentStep: number
       percentComplete: number
     }
   }

   interface ExecutionStep {
     step: number
     label: string
     status: 'pending' | 'in_progress' | 'completed' | 'skipped'

     signaldeskAutoExecute?: {
       ownedContent: OwnedContentItem[]
       mediaEngagement: MediaEngagementItem[]
     }

     userMustExecute?: UserTask[]

     dependencies: string[]
     estimatedDuration: string
     started_at?: string
     completed_at?: string
   }

   interface OwnedContentItem {
     type: string
     purpose: string
     stakeholderResonance: string
     keyMessages: string[]
     estimatedTime: string
     status?: 'pending' | 'generating' | 'completed' | 'failed'
     content?: string
     generated_at?: string
   }

   interface UserTask {
     type: string
     title: string
     description: string
     why: string
     effort: 'low' | 'medium' | 'high'
     estimatedTime: string
     budget?: string
     resources: string[]
     status: 'pending' | 'completed' | 'skipped'
     completed_at?: string
     notes?: string
   }
   ```

**Testing:**
- Generate blueprint for test campaign
- Verify stakeholder orchestration structure
- Confirm influence levers are properly sequenced

**Estimated Time**: 1-2 days

---

### PHASE 2: Database Schema Update
**Goal**: Store new stakeholder orchestration structure

**Files to Create/Modify:**
1. `/migrations/003_stakeholder_orchestration.sql` (NEW)
   ```sql
   -- Update strategic_campaigns table
   ALTER TABLE strategic_campaigns
   DROP COLUMN phases;

   ALTER TABLE strategic_campaigns
   ADD COLUMN stakeholder_orchestration JSONB DEFAULT '[]'::jsonb;

   -- Structure:
   -- [
   --   {
   --     "stakeholder": {...},
   --     "influenceLevers": [
   --       {
   --         "leverName": "...",
   --         "priority": 1,
   --         "executionSequence": [
   --           {
   --             "step": 1,
   --             "status": "completed",
   --             "signaldeskAutoExecute": {...},
   --             "userMustExecute": [...]
   --           }
   --         ]
   --       }
   --     ]
   --   }
   -- ]

   -- Add progress tracking
   ALTER TABLE strategic_campaigns
   ADD COLUMN campaign_progress JSONB DEFAULT '{}'::jsonb;

   -- Structure:
   -- {
   --   "totalStakeholders": 3,
   --   "activeStakeholder": 1,
   --   "totalSteps": 24,
   --   "completedSteps": 5,
   --   "totalContentPieces": 30,
   --   "completedContentPieces": 8,
   --   "totalUserTasks": 12,
   --   "completedUserTasks": 2,
   --   "percentComplete": 25
   -- }
   ```

2. Update `/create-strategic-campaigns-table.sql`

**Testing:**
- Create table with new schema
- Insert test campaign with stakeholder orchestration
- Query and verify structure

**Estimated Time**: 0.5 days

---

### PHASE 3: Executor Refactor
**Goal**: Process stakeholder orchestration instead of phases

**Files to Modify:**
1. `/supabase/functions/niv-campaign-executor/index.ts`

**Key Changes:**

```typescript
// OLD: Loop through phases
for (const phaseCampaign of phaseCampaigns) {
  await generatePhaseContent(phaseCampaign)
}

// NEW: Loop through stakeholders → levers → steps
for (const stakeholderPlan of stakeholderOrchestrationPlans) {
  for (const lever of stakeholderPlan.influenceLevers) {
    for (const step of lever.executionSequence) {
      // Only generate if step is not blocked by dependencies
      if (!isStepBlocked(step)) {
        await generateStepContent(stakeholderPlan.stakeholder, lever, step)
      }
    }
  }
}
```

**New Functions to Add:**

```typescript
// Extract stakeholder orchestration from blueprint
function extractStakeholderOrchestration(blueprint: any) {
  if (!blueprint.part3_stakeholderOrchestration) {
    throw new Error('No stakeholder orchestration in blueprint')
  }

  return blueprint.part3_stakeholderOrchestration.stakeholderOrchestrationPlans
}

// Check if step dependencies are met
function isStepBlocked(
  step: ExecutionStep,
  completedSteps: string[]
): boolean {
  return step.dependencies.some(dep => !completedSteps.includes(dep))
}

// Generate content for a specific step
async function generateStepContent(
  stakeholder: any,
  lever: InfluenceLever,
  step: ExecutionStep
) {
  console.log(`\n📍 Generating content for:`)
  console.log(`   Stakeholder: ${stakeholder.name}`)
  console.log(`   Lever: ${lever.leverName}`)
  console.log(`   Step: ${step.step} - ${step.label}`)

  if (!step.signaldeskAutoExecute) {
    console.log('   ⏭️ No auto-execute content in this step')
    return null
  }

  const generatedContent: any[] = []

  // Generate owned content
  if (step.signaldeskAutoExecute.ownedContent) {
    for (const contentItem of step.signaldeskAutoExecute.ownedContent) {
      const content = await generateContentDirectly(
        contentItem.type,
        await craftStrategicBrief({
          contentType: contentItem.type,
          stakeholder: stakeholder.name,
          purpose: contentItem.purpose,
          stakeholderResonance: contentItem.stakeholderResonance,
          influenceLever: lever.leverName,
          leverObjective: lever.objective,
          keyMessages: contentItem.keyMessages,
          psychologicalProfile: stakeholder.psychologicalProfile
        }),
        {
          stakeholder: stakeholder.name,
          influenceLever: lever.leverName,
          step: step.step
        }
      )

      generatedContent.push({
        type: contentItem.type,
        stakeholder: stakeholder.name,
        lever: lever.leverName,
        step: step.step,
        content: content
      })
    }
  }

  // Generate media engagement
  if (step.signaldeskAutoExecute.mediaEngagement) {
    // Similar to owned content
  }

  return generatedContent
}

// Update saveToStrategicCampaigns to use new structure
async function saveToStrategicCampaigns(
  supabase: any,
  sessionId: string,
  blueprintId: string,
  blueprint: any,
  sessionData: any,
  campaignSummary: any,
  stakeholderOrchestrationPlans: any[],
  allGeneratedContent: any[],
  organizationContext: any,
  positioning: string,
  campaignFolder: string
) {
  console.log('💎 Saving to strategic_campaigns table...')

  // Get org UUID
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', organizationContext.name)
    .maybeSingle()

  if (!org) {
    console.warn('⚠️ Organization not found, skipping save')
    return
  }

  // Build stakeholder orchestration with content mapped to steps
  const stakeholderOrchestration = stakeholderOrchestrationPlans.map(plan => {
    const influenceLevers = plan.influenceLevers.map(lever => {
      const executionSequence = lever.executionSequence.map(step => {
        // Find content generated for this step
        const stepContent = allGeneratedContent.filter(c =>
          c.stakeholder === plan.stakeholder.name &&
          c.lever === lever.leverName &&
          c.step === step.step
        )

        // Update content items with generated content
        const updatedAutoExecute = step.signaldeskAutoExecute ? {
          ...step.signaldeskAutoExecute,
          ownedContent: step.signaldeskAutoExecute.ownedContent?.map(item => {
            const generated = stepContent.find(c => c.type === item.type)
            return {
              ...item,
              status: generated ? 'completed' : 'pending',
              content: generated?.content,
              generated_at: generated ? new Date().toISOString() : undefined
            }
          })
        } : undefined

        return {
          ...step,
          signaldeskAutoExecute: updatedAutoExecute,
          status: stepContent.length > 0 ? 'completed' : 'pending'
        }
      })

      return {
        ...lever,
        executionSequence
      }
    })

    return {
      ...plan,
      influenceLevers
    }
  })

  // Calculate campaign progress
  const totalSteps = stakeholderOrchestration.reduce((sum, plan) =>
    sum + plan.influenceLevers.reduce((leverSum, lever) =>
      leverSum + lever.executionSequence.length, 0
    ), 0
  )

  const completedSteps = stakeholderOrchestration.reduce((sum, plan) =>
    sum + plan.influenceLevers.reduce((leverSum, lever) =>
      leverSum + lever.executionSequence.filter(s => s.status === 'completed').length, 0
    ), 0
  )

  await supabase.from('strategic_campaigns').insert({
    organization_id: org.id,
    blueprint_id: sessionId,
    campaign_name: sessionData.campaign_goal?.substring(0, 100) || 'Campaign',
    campaign_goal: sessionData.campaign_goal,
    industry: organizationContext.industry,
    positioning: positioning,
    core_narrative: campaignSummary?.coreNarrative || '',
    start_date: new Date().toISOString().split('T')[0],
    stakeholder_orchestration: stakeholderOrchestration,
    campaign_summary: campaignSummary,
    campaign_progress: {
      totalStakeholders: stakeholderOrchestration.length,
      activeStakeholder: 1,
      totalSteps: totalSteps,
      completedSteps: completedSteps,
      totalContentPieces: allGeneratedContent.length,
      completedContentPieces: allGeneratedContent.length,
      totalUserTasks: stakeholderOrchestration.reduce((sum, plan) =>
        sum + plan.influenceLevers.reduce((leverSum, lever) =>
          leverSum + lever.executionSequence.reduce((stepSum, step) =>
            stepSum + (step.userMustExecute?.length || 0), 0
          ), 0
        ), 0
      ),
      completedUserTasks: 0,
      percentComplete: Math.round((completedSteps / totalSteps) * 100)
    },
    architecture: 'STAKEHOLDER_ORCHESTRATION',
    status: 'in-progress',
    total_content_pieces: allGeneratedContent.length
  })

  console.log('✅ Saved to strategic_campaigns table')
}
```

**Support for Targeted Execution:**

```typescript
// NEW: Support generating content for specific stakeholder/lever/step
interface ExecutorRequest {
  blueprintId: string
  blueprint: any
  campaignType: 'STAKEHOLDER_ORCHESTRATION'
  orgId: string
  organizationContext: any

  executionTarget?: {
    mode: 'full' | 'targeted'
    stakeholder?: string
    lever?: string
    step?: number
    items?: any[]
  }
}

// In main handler:
if (executionTarget?.mode === 'targeted') {
  // Generate only specific items
  const targetPlan = stakeholderOrchestrationPlans.find(p =>
    p.stakeholder.name === executionTarget.stakeholder
  )

  const targetLever = targetPlan?.influenceLevers.find(l =>
    l.leverName === executionTarget.lever
  )

  const targetStep = targetLever?.executionSequence.find(s =>
    s.step === executionTarget.step
  )

  if (targetStep) {
    const content = await generateStepContent(
      targetPlan.stakeholder,
      targetLever,
      targetStep
    )

    return { success: true, content }
  }
}
```

**Testing:**
- Test full campaign execution
- Test targeted execution (specific step)
- Verify content maps to correct stakeholder/lever/step
- Confirm progress tracking works

**Estimated Time**: 2-3 days

---

### PHASE 4: Strategic Planning UI (Campaign Management Hub)
**Goal**: Build interactive checklist interface for campaign execution

**Files to Create:**

1. `/src/components/strategic-planning/StrategicPlanningView.tsx` (REPLACE existing)
2. `/src/components/strategic-planning/CampaignChecklistView.tsx` (NEW)
3. `/src/components/strategic-planning/StakeholderChecklistSection.tsx` (NEW)
4. `/src/components/strategic-planning/InfluenceLeverChecklist.tsx` (NEW)
5. `/src/components/strategic-planning/ExecutionStep.tsx` (NEW)
6. `/src/components/strategic-planning/ContentItem.tsx` (NEW)
7. `/src/components/strategic-planning/UserTask.tsx` (NEW)
8. `/src/components/strategic-planning/ContentLibraryView.tsx` (NEW)

**Key Features:**

1. **Execution Mode Selector**
   - Focused: One stakeholder at a time
   - Batch: Generate all Step 1 content
   - Custom: Pick specific items

2. **Campaign Progress Overview**
   - Overall completion percentage
   - Steps completed / total
   - Content pieces generated
   - User tasks completed

3. **Stakeholder Checklist**
   - Expandable sections per stakeholder
   - Priority order display
   - Progress per stakeholder

4. **Influence Lever Breakdown**
   - Steps shown as checklist items
   - Clear status indicators (pending/in-progress/completed/blocked)
   - Dependencies shown

5. **Auto-Execute vs User Tasks**
   - Clear visual separation
   - "Generate Now" buttons for Signaldesk content
   - Checkboxes for user tasks
   - Effort/time/budget shown

6. **Content Library**
   - Organized by stakeholder/lever
   - View/edit/regenerate options
   - Export functionality

**API Endpoints to Create:**

1. `/api/strategic-campaigns/[id]/generate-content` (POST)
   - Calls executor with targeted execution
   - Returns generated content

2. `/api/strategic-campaigns/[id]/update-task` (PATCH)
   - Marks user task as complete
   - Updates step status

3. `/api/strategic-campaigns/[id]/progress` (GET)
   - Returns current campaign progress
   - Used for real-time updates

**Testing:**
- Load existing campaign
- Test execution mode switching
- Generate content for specific step
- Mark user tasks complete
- Verify progress updates

**Estimated Time**: 3-4 days

---

### PHASE 5: Campaign Builder Integration
**Goal**: Wire up new blueprint generation to Campaign Builder UI

**Files to Modify:**
1. `/src/app/campaign-builder/page.tsx`
2. Campaign builder flow components

**Changes:**
- Update to call new stakeholder orchestration blueprint generator
- Display new structure in builder preview
- Update "Execute Campaign" button to use new executor

**Testing:**
- Create new campaign end-to-end
- Verify blueprint structure
- Test execution from builder

**Estimated Time**: 1 day

---

## Total Estimated Timeline

- Phase 1: Blueprint Generation - **1-2 days**
- Phase 2: Database Schema - **0.5 days**
- Phase 3: Executor Refactor - **2-3 days**
- Phase 4: Strategic Planning UI - **3-4 days**
- Phase 5: Campaign Builder Integration - **1 day**

**Total: 8-11 days** (1.5-2 weeks)

---

## Migration Strategy

### For Existing Campaigns:

Option A: Keep old structure for existing, new structure for new campaigns
- Least risky
- Executor handles both structures
- UI shows different views based on structure

Option B: Migrate existing campaigns
- Create migration script
- Transform phases → stakeholder orchestration
- Higher risk but cleaner

**Recommendation: Option A initially, then Option B once new system is proven**

---

## Testing Strategy

### Unit Tests:
- Blueprint generation functions
- Executor content generation
- Progress calculation
- Dependency checking

### Integration Tests:
- Full campaign generation flow
- Targeted content generation
- Task completion flow
- Progress updates

### End-to-End Tests:
- Create campaign in builder
- Execute in Strategic Planning
- Complete user tasks
- Verify content library

---

## Rollout Plan

### Week 1:
- Phase 1: Blueprint Generation
- Phase 2: Database Schema
- Initial testing

### Week 2:
- Phase 3: Executor Refactor
- Phase 4: Strategic Planning UI
- Phase 5: Campaign Builder Integration

### Week 3:
- Comprehensive testing
- Bug fixes
- Documentation

---

## Success Criteria

✅ Blueprint generates stakeholder orchestration structure
✅ Executor processes orchestration correctly
✅ Content maps to correct stakeholder/lever/step
✅ UI shows clear checklist interface
✅ User can generate targeted content
✅ User can mark tasks complete
✅ Progress tracking works correctly
✅ Existing campaigns still work (backward compatibility)

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1: Blueprint Generation
3. Implement phases sequentially
4. Test thoroughly at each phase
5. Deploy to production

---

## Questions to Resolve

1. **Backward Compatibility**: Do we need to support old phase-based campaigns?
2. **Execution Mode Default**: Should we default to "focused" or "batch" mode?
3. **User Task Management**: Do we need task assignment/collaboration features?
4. **Analytics**: What metrics do we track per stakeholder/lever?
5. **Export Format**: What format should campaign exports use?

