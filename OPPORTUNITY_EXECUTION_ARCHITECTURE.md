# Opportunity Execution Architecture

## Current State Analysis

### Opportunity Structure (from Database)
```typescript
{
  id: string
  organization_id: string
  title: string
  description: string
  score: number
  urgency: 'low' | 'medium' | 'high'
  time_window: string
  category: 'STRATEGIC' | 'COMPETITIVE' | 'CRISIS' | 'TREND'

  data: {
    playbook: {
      campaign_name: string              // e.g., "APAC AI Atlas"
      channels: string[]                 // e.g., ["APAC business media", "Regional tech publications"]
      key_messages: string[]             // Main messaging points
      target_audience: string            // e.g., "Media and stakeholders"
      creative_approach: string          // Multi-channel creative strategy
      assets_needed: string[]            // Required content pieces
      template_id: string                // e.g., "strategic"
    }

    recommended_action: {
      who: {
        owner: string                    // Primary owner
        team: string[]                   // Involved teams
      }
      what: {
        primary_action: string           // Main objective
        specific_tasks: string[]         // Actionable steps
        deliverables: string[]           // Content to create
      }
      when: {
        ideal_launch: string             // Timeline
        duration: string                 // Campaign length
        start_immediately: boolean
      }
      where: {
        channels: string[]               // Distribution channels
        platforms: string[]              // Social platforms
      }
    }

    action_items: Array<{
      step: number
      owner: string
      action: string
      deadline: string
    }>

    context: {
      events: Array<{...}>               // Triggering intelligence
      organization_id: string
      detection_timestamp: string
    }

    confidence: number
    expected_impact: string
    success_metrics: string[]
  }
}
```

### Framework Structure (from NIV)
```typescript
{
  strategy: {
    objective: string
    narrative: string
    proof_points: string[]
    urgency: string
    content_needs: {
      priority_content: string[]         // e.g., ["Press Release", "Social Campaign", "Media Pitch"]
      optional_content: string[]
      dependencies: Array<{...}>
    }
  }

  executionPlan: {
    autoExecutableContent: {
      contentTypes: string[]             // Direct mapping to content generators
      estimatedDuration: string
      prerequisites: string[]
    }
  }
}
```

## Key Differences

### 1. **Granularity**
- **Framework**: High-level strategy → simple content type list
- **Opportunity**: Detailed playbook → multi-channel creative campaign

### 2. **Creative Component**
- **Framework**: "Create a press release" (simple)
- **Opportunity**: "Create 'Local Leaders' LinkedIn series featuring APAC business transformations with ChatGPT. Launch region-specific Twitter case studies with data visualization. Develop Instagram Stories showcasing local language capabilities..." (complex creative strategy)

### 3. **Execution Context**
- **Framework**: Strategic planning → deliberate execution
- **Opportunity**: Real-time response → time-sensitive execution

## The Challenge

### Current Framework Execution
```
User generates framework
  ↓
Framework has priority_content: ["Press Release", "Social Posts", "Media Pitch"]
  ↓
User clicks "Execute" → Goes to NIV Content Orchestrator
  ↓
NIV Content Orchestrator:
  - Acknowledges: "I'll create a press release"
  - User provides details
  - Routes to appropriate service
  - Generates content
```

**This works because**:
- Content types are SIMPLE and DIRECT
- One content type = one conversation
- No creative campaign layer

### Opportunity Execution Challenge
```
User clicks "Execute" on opportunity
  ↓
Opportunity has:
  playbook.creative_approach: "Create 'Local Leaders' LinkedIn series + Twitter case studies + Instagram Stories..."
  playbook.assets_needed: ["APAC AI leadership report", "Regional localization case studies", "Market opportunity analysis"]
  recommended_action.what.deliverables: ["APAC AI leadership report", "Regional localization case studies", "Market opportunity analysis"]
  ↓
Question: What do we send to NIV Content Orchestrator?
```

**The problem**:
- Opportunity is a CAMPAIGN, not a single content type
- Creative approach is a strategy description, not executable tasks
- Assets needed mix strategic documents with creative content
- No clear 1:1 mapping to content generators

## Proposed Solutions

### Option 1: Campaign Decomposition (Recommended)
**Treat opportunities as mini-strategic frameworks**

```typescript
// New intermediate layer
function decomposeOpportunityCampaign(opportunity: Opportunity): ExecutionQueue {
  const { playbook, recommended_action } = opportunity.data

  // Parse creative approach into executable content pieces
  const creativeContent = parseCreativeApproach(playbook.creative_approach)
  // e.g., ["LinkedIn series post", "Twitter case study", "Instagram Story"]

  // Combine with assets needed
  const strategicAssets = playbook.assets_needed
  // e.g., ["APAC AI leadership report", "Regional localization case studies"]

  return {
    campaign_name: playbook.campaign_name,
    campaign_context: {
      key_messages: playbook.key_messages,
      target_audience: playbook.target_audience,
      channels: playbook.channels
    },
    content_queue: [
      // Strategic assets first
      ...strategicAssets.map(asset => ({
        type: mapAssetToContentType(asset),  // "APAC AI leadership report" → "thought-leadership"
        title: asset,
        priority: 'high',
        context: {
          campaign: playbook.campaign_name,
          messaging: playbook.key_messages
        }
      })),
      // Creative content second
      ...creativeContent.map(content => ({
        type: content.platform,  // "linkedin", "twitter", "instagram"
        title: content.description,
        priority: 'medium',
        context: {
          campaign: playbook.campaign_name,
          creative_strategy: content.approach
        }
      }))
    ]
  }
}
```

**Flow**:
```
User clicks "Execute Opportunity"
  ↓
Campaign Decomposer analyzes opportunity
  ↓
Creates ExecutionQueue with 5-10 content pieces
  ↓
NIV Content Orchestrator receives queue
  ↓
NIV shows: "I'll create 7 pieces for the APAC AI Atlas campaign:
  1. APAC AI Leadership Report
  2. Regional Localization Case Study
  3. LinkedIn Series Post (Local Leaders)
  4. Twitter Case Study
  5. Instagram Story
  6. Media Pitch
  7. Q&A Document

Would you like to start with #1 or generate all?"
  ↓
User can generate individually or in bulk
```

### Option 2: Campaign Mode (Alternative)
**Create a dedicated "Campaign Orchestrator" mode**

```typescript
// New NIV mode
interface CampaignExecutionMode {
  mode: 'campaign'
  campaign: {
    name: string
    creative_strategy: string
    deliverables: ContentDeliverable[]
    context: OpportunityContext
  }
}
```

**Flow**:
```
User clicks "Execute Opportunity"
  ↓
NIV enters "Campaign Mode"
  ↓
NIV: "I'm executing the APAC AI Atlas campaign. This is a strategic opportunity with creative multi-channel approach.

I'll need to create:
- Strategic Content: AI leadership report, case studies
- Creative Content: LinkedIn series, Twitter threads, Instagram stories

Let's start with the foundation. What aspects of OpenAI's APAC expansion should we emphasize in the leadership report?"
  ↓
NIV guides user through campaign creation
```

### Option 3: Simplified Mapping (Easiest)
**Just extract deliverables and treat like framework**

```typescript
function convertOpportunityToFramework(opportunity: Opportunity): NivStrategicFramework {
  return {
    strategy: {
      objective: opportunity.title,
      narrative: opportunity.description,
      proof_points: opportunity.data.context.events.map(e => e.description),
      urgency: opportunity.urgency,
      content_needs: {
        priority_content: opportunity.data.recommended_action.what.deliverables,
        // Ignore creative_approach for now
      }
    }
  }
}
```

**Pros**: Simple, works immediately
**Cons**: Loses creative campaign strategy, not utilizing full opportunity richness

## Recommendation

**Use Option 1: Campaign Decomposition** with these enhancements:

### 1. Creative Approach Parser
```typescript
function parseCreativeApproach(creative: string): CreativeContent[] {
  // Use Claude to parse creative strategy into executable pieces
  const prompt = `Parse this creative strategy into executable content pieces:

  "${creative}"

  Return JSON array with:
  - platform: "linkedin" | "twitter" | "instagram" | "media"
  - content_type: "series" | "post" | "thread" | "story" | "pitch"
  - description: Brief description
  - approach: Creative angle
  `

  // Returns structured content pieces
}
```

### 2. Enhanced NIV Campaign Acknowledgment
```typescript
// In NIV Content Orchestrator
if (opportunity) {
  const queue = decomposeOpportunity(opportunity)

  setMessages([{
    role: 'assistant',
    content: `I'm executing the **${queue.campaign_name}** campaign.

This is a ${opportunity.category} opportunity with ${opportunity.urgency} urgency.

**Campaign Overview:**
${opportunity.description}

**Key Messages:**
${queue.campaign_context.key_messages.map((m, i) => `${i+1}. ${m}`).join('\n')}

**Content to Create (${queue.content_queue.length} pieces):**
${queue.content_queue.map((c, i) => `${i+1}. ${c.title} (${c.type})`).join('\n')}

Would you like to:
- Generate all ${queue.content_queue.length} pieces automatically
- Start with the first piece and review each
- Customize the content plan first`,
    metadata: {
      opportunity,
      queue,
      showCampaignActions: true
    }
  }])
}
```

### 3. Bulk Generation Support
```typescript
// Add to NIV Content Orchestrator
const handleBulkGenerate = async (queue: ExecutionQueue) => {
  for (const contentPiece of queue.content_queue) {
    await generateContent(contentPiece.type, {
      ...contentPiece.context,
      organization: organization?.name,
      campaign: queue.campaign_name
    })
  }
}
```

## Implementation Plan

### Phase 1: Basic Opportunity Execution (1-2 hours)
1. Create `decomposeOpportunity()` function
2. Map `assets_needed` to content types
3. Pass opportunity to NIV Content Orchestrator
4. NIV shows campaign overview + content queue

### Phase 2: Creative Approach Parsing (2-3 hours)
1. Create creative approach parser (Claude-powered)
2. Extract platform-specific content from creative strategy
3. Merge strategic + creative content into unified queue

### Phase 3: Enhanced UX (1-2 hours)
1. Add campaign mode acknowledgment
2. Add bulk generation option
3. Add campaign context tracking
4. Show progress through campaign execution

### Phase 4: Opportunity-Specific Optimizations (2-3 hours)
1. Add urgency-based prioritization
2. Add time-window awareness
3. Add success metrics tracking
4. Add campaign naming/organization in Memory Vault

## Files to Modify

1. `/src/components/modules/OpportunitiesModule.tsx`
   - Add "Execute" button to opportunities
   - Pass opportunity to NIV

2. `/src/components/execute/NIVContentOrchestratorProduction.tsx`
   - Add opportunity handling (similar to framework)
   - Add campaign mode acknowledgment
   - Add bulk generation

3. `/src/lib/opportunity-decomposer.ts` (new file)
   - `decomposeOpportunity()`
   - `parseCreativeApproach()`
   - `mapAssetToContentType()`

4. `/src/types/opportunity-execution.ts` (new file)
   - `ExecutionQueue` interface
   - `CreativeContent` interface
   - `ContentDeliverable` interface

## Example User Flow

```
User: [Clicks "Execute" on APAC AI Atlas opportunity]

NIV: I'm executing the APAC AI Atlas campaign.

This is a STRATEGIC opportunity with LOW urgency (1-2 week window).

**Campaign Overview:**
Capitalize on AI imaging market growth in APAC with localized ChatGPT success stories

**Key Messages:**
1. OpenAI leads APAC AI transformation through localized solutions
2. Position as the localized AI leader for APAC's imaging market growth

**Content to Create (7 pieces):**
1. APAC AI Leadership Report (thought-leadership)
2. Regional Localization Case Studies (case-study)
3. Market Opportunity Analysis (white-paper)
4. LinkedIn Series: Local Leaders (social-post)
5. Twitter Case Studies with Data Viz (social-post)
6. Instagram Stories: Language Capabilities (social-post)
7. APAC Media Pitch (media-pitch)

Would you like to:
- Generate all 7 pieces automatically
- Start with the first piece and review each
- Customize the content plan first

User: Generate all automatically

NIV: Perfect! I'll create all 7 pieces for the APAC AI Atlas campaign.
[Shows progress bar: Creating 1/7...]

[5 minutes later]

NIV: ✅ Campaign complete! I've created all 7 pieces:
[Shows each piece with preview + save buttons]

All content has been saved to Memory Vault under "Campaigns/APAC AI Atlas/"
```

## Summary

**The answer**: Yes, we need to adjust opportunity output, but not the structure—we need to add a **decomposition layer** that:
1. Parses the creative approach into executable content pieces
2. Maps strategic assets to content types
3. Creates an execution queue
4. Presents it to NIV as a structured campaign

This preserves the rich creative strategy from opportunities while making them executable through NIV Content Orchestrator.
