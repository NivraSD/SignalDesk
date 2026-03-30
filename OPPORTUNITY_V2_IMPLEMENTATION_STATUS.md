# Opportunity Engine V2 - Implementation Status

## ✅ COMPLETED

### 1. Database Schema ✓
**Files Created:**
- `supabase/migrations/20251021_expand_content_types.sql`
- `supabase/migrations/20251021_update_opportunities_v2.sql`

**What Changed:**
- **campaign_execution_items** table now supports:
  - `press_release`, `blog_post`, `image`, `video`, `presentation`
  - `email_campaign`, `webinar`, `event`, `partnership_outreach`
  - New fields: `platform`, `content_brief`, `urgency`

- **opportunities** table now has:
  - `strategic_context` - Full strategic analysis
  - `execution_plan` - Complete stakeholder campaigns
  - `presentation_url` - Auto-generated Gamma link
  - `presentation_data` - Gamma metadata
  - `auto_executable` - Can this be one-click executed?
  - `executed` - Has it been executed?
  - `campaign_session_id` - Link to execution
  - `version` - Track V1 vs V2 format

**Action Required:**
```
Run these SQL files manually in your database
```

### 2. TypeScript Types ✓
**File Created:** `supabase/functions/mcp-opportunity-detector/types-v2.ts`

**Exports:**
- `ContentType` - All platform content types
- `ContentBrief` - Detailed brief structure
- `ContentItem` - Individual content piece
- `StakeholderCampaign` - Campaign for one stakeholder
- `ExecutionPlan` - Complete execution plan
- `StrategicContext` - Strategic opportunity analysis
- `OpportunityV2` - Complete V2 opportunity format
- Helper functions for effort estimation

### 3. V2 Detection Prompt ✓
**File Created:** `supabase/functions/mcp-opportunity-detector/prompt-v2.ts`

**Exports:**
- `buildOpportunityDetectionPromptV2()` - Generates V2 prompt
- `OPPORTUNITY_SYSTEM_PROMPT_V2` - System prompt for Claude

**What It Does:**
- Instructs Claude to output complete execution plans
- Provides detailed example with all required fields
- Specifies content brief quality requirements
- Maps opportunities to platform content types

---

## 🚧 IN PROGRESS

### Update mcp-opportunity-detector

**Current file:** `supabase/functions/mcp-opportunity-detector/index.ts`

**Changes Needed:**
1. Import V2 types and prompt
2. Add V2 detection function that calls Claude with new prompt
3. Save opportunities in V2 format to database
4. Return V2 format to caller

**Sample Implementation:**

```typescript
import { OpportunityV2, StakeholderCampaign, ContentItem } from './types-v2.ts'
import { buildOpportunityDetectionPromptV2, OPPORTUNITY_SYSTEM_PROMPT_V2 } from './prompt-v2.ts'

async function detectOpportunitiesV2(
  extractedData: any,
  organizationName: string,
  organizationId: string
): Promise<OpportunityV2[]> {

  const prompt = buildOpportunityDetectionPromptV2({
    organizationName,
    events: extractedData.events.all,
    topics: extractedData.topics,
    quotes: extractedData.quotes,
    entities: extractedData.entities,
    discoveryTargets: extractedData.discoveryTargets,
    organizationProfile: extractedData.organizationProfile
  })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000, // More tokens for detailed briefs
      temperature: 0.7,
      system: OPPORTUNITY_SYSTEM_PROMPT_V2,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const content = data.content?.[0]?.text || ''

  // Parse V2 opportunities
  let opportunities: OpportunityV2[] = []
  try {
    let cleanContent = content.trim()
    if (cleanContent.includes('```json')) {
      const match = cleanContent.match(/```json\s*([\s\S]*?)```/)
      if (match) cleanContent = match[1].trim()
    }
    opportunities = JSON.parse(cleanContent)
  } catch (e) {
    console.error('Failed to parse V2 opportunities:', e)
    return []
  }

  // Validate V2 format
  opportunities = opportunities.filter(opp =>
    opp.strategic_context &&
    opp.execution_plan &&
    opp.execution_plan.stakeholder_campaigns?.length > 0
  )

  console.log(`✅ Detected ${opportunities.length} V2 opportunities`)

  return opportunities
}

// In main handler:
const opportunitiesV2 = await detectOpportunitiesV2(
  extractedData,
  organization_name,
  organization_id
)

// Save to database
for (const opp of opportunitiesV2) {
  await supabase.from('opportunities').insert({
    organization_id,
    title: opp.title,
    description: opp.description,
    strategic_context: opp.strategic_context,
    execution_plan: opp.execution_plan,
    time_window: opp.strategic_context.time_window,
    expected_impact: opp.strategic_context.expected_impact,
    score: opp.score,
    urgency: opp.urgency,
    category: opp.category,
    confidence_factors: opp.confidence_factors,
    auto_executable: opp.auto_executable,
    version: 2,
    status: 'active'
  })
}
```

---

## 📋 TODO - Next Steps

### Phase 1: Core Detection (CURRENT)
- [ ] Update `mcp-opportunity-detector/index.ts` with V2 detection
- [ ] Test V2 opportunity generation
- [ ] Verify database storage
- [ ] Update UI to display V2 opportunities

### Phase 2: Gamma Generation
**Create:** `supabase/functions/generate-opportunity-presentation/index.ts`

```typescript
// Takes OpportunityV2, generates Gamma presentation
async function generateOpportunityPresentation(
  opportunity: OpportunityV2,
  organizationId: string
) {
  // Build presentation outline from opportunity
  const outline = buildPresentationOutline(opportunity)

  // Call niv-content-intelligent-v2 to generate Gamma
  const gammaResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Generate a Gamma presentation for this opportunity`,
      context: {
        opportunity,
        outline,
        organization_id: organizationId
      }
    })
  })

  const { presentation_url, presentation_data } = await gammaResponse.json()

  // Update opportunity with presentation
  await supabase
    .from('opportunities')
    .update({
      presentation_url,
      presentation_data
    })
    .eq('id', opportunity.opportunity_id)

  return presentation_url
}
```

### Phase 3: Auto-Execution
**Create:** `supabase/functions/execute-opportunity/index.ts`

```typescript
// One-click execution of opportunity
async function executeOpportunity(opportunityId: string, orgId: string) {
  // 1. Load opportunity
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single()

  // 2. Create campaign session
  const { data: session } = await supabase
    .from('campaign_builder_sessions')
    .insert({
      organization_id: orgId,
      campaign_goal: opportunity.title,
      blueprint: convertOpportunityToBlueprint(opportunity)
    })
    .select()
    .single()

  // 3. Create execution items from opportunity.execution_plan
  const executionItems = opportunity.execution_plan.stakeholder_campaigns
    .flatMap(campaign =>
      campaign.content_items.map(item => ({
        session_id: session.id,
        organization_id: orgId,
        stakeholder_name: campaign.stakeholder_name,
        stakeholder_priority: campaign.stakeholder_priority,
        lever_name: campaign.lever_name,
        lever_priority: campaign.lever_priority,
        content_type: item.type,
        topic: item.topic,
        target: item.target,
        platform: item.platform,
        content_brief: item.brief,
        urgency: item.urgency,
        details: item,
        status: 'pending'
      }))
    )

  await supabase
    .from('campaign_execution_items')
    .insert(executionItems)

  // 4. Auto-generate all content
  for (const item of executionItems) {
    await generateContentForItem(item, orgId)
  }

  // 5. Mark opportunity as executed
  await supabase
    .from('opportunities')
    .update({
      executed: true,
      campaign_session_id: session.id
    })
    .eq('id', opportunityId)

  return session.id
}

async function generateContentForItem(item: any, orgId: string) {
  await supabase
    .from('campaign_execution_items')
    .update({ status: 'generating' })
    .eq('id', item.id)

  try {
    // Call niv-content-intelligent-v2 with the content brief
    const content = await callNIVContentGenerator({
      type: item.content_type,
      topic: item.topic,
      brief: item.content_brief,
      platform: item.platform,
      organization_id: orgId
    })

    await supabase
      .from('campaign_execution_items')
      .update({
        status: 'generated',
        generated_content: content,
        generated_at: new Date().toISOString()
      })
      .eq('id', item.id)
  } catch (error) {
    await supabase
      .from('campaign_execution_items')
      .update({
        status: 'failed',
        generation_error: error.message
      })
      .eq('id', item.id)
  }
}
```

### Phase 4: UI Updates
**Update:** `src/components/modules/OpportunitiesModule.tsx`

Add:
- Display of strategic context
- Execution plan visualization
- Gamma presentation viewer
- "Execute Opportunity" button
- Progress tracking for auto-generation

---

## 🎯 Quick Start Guide

### Step 1: Run SQL Migrations
```bash
# Run these manually in your database client
supabase/migrations/20251021_expand_content_types.sql
supabase/migrations/20251021_update_opportunities_v2.sql
```

### Step 2: Update Opportunity Detector
Edit `supabase/functions/mcp-opportunity-detector/index.ts`:
- Import V2 types and prompts
- Add `detectOpportunitiesV2()` function
- Use V2 format for saving to database

### Step 3: Test V2 Detection
```bash
# Run real-time monitor to trigger opportunity detection
# Check opportunities table for version=2 records
# Verify execution_plan and strategic_context fields are populated
```

### Step 4: Deploy
```bash
supabase functions deploy mcp-opportunity-detector --no-verify-jwt
```

---

## 📊 V2 Opportunity Example

See `OPPORTUNITY_ENGINE_V2_PROPOSAL.md` for complete example of V2 output format.

Key differences from V1:
- ✅ Complete execution plan with 10-50 content items
- ✅ Detailed briefs for each content piece
- ✅ Mapped to platform content types
- ✅ Auto-executable
- ✅ Gamma presentation ready
- ✅ Success metrics defined
- ✅ Timeline structured

---

## 🚀 Benefits

1. **One-Click Execution**: Approve opportunity → Generate all content automatically
2. **Strategic Clarity**: Gamma presentation for stakeholder buy-in
3. **Platform Alignment**: All content types match execution capabilities
4. **Quality Briefs**: Detailed enough for AI generation to succeed
5. **Measurable**: Success metrics built into every opportunity

---

## Questions?

Review:
- `OPPORTUNITY_ENGINE_V2_PROPOSAL.md` - Full architecture
- `types-v2.ts` - Type definitions
- `prompt-v2.ts` - Detection prompt
- Migration SQL files - Database changes
