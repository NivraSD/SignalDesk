# Opportunity Engine V2: Execution-Aligned Architecture

## Vision
Transform the opportunity engine into the **strategic core** of SignalDesk - detecting opportunities and auto-generating complete, executable campaign plans with all content ready to deploy.

---

## Current vs. Proposed Architecture

### CURRENT STATE ❌
**Opportunity Detector outputs:**
```typescript
{
  title: "Opportunity title",
  description: "What the opportunity is",
  recommended_action: {
    what: { primary_action, specific_tasks, deliverables },
    who: { owner, team },
    when: { timing },
    where: { channels }
  }
}
```

**Problems:**
- Generic deliverables not mapped to platform content types
- No content briefs or execution detail
- Can't auto-execute
- Disconnected from niv-content-intelligent-v2
- No comprehensive presentation for stakeholders

---

### PROPOSED STATE ✅
**Opportunity Detector outputs:**
```typescript
{
  // Core Opportunity
  title: "Crisis response opportunity: Competitor's security breach",
  strategic_context: {
    what_happened: "Competitor X suffered data breach affecting 10M users",
    why_its_an_opportunity: "Market trust vacuum we can fill with security narrative",
    time_window: "3-5 days (before narrative solidifies)",
    expected_impact: "15-20% increase in security-conscious prospects"
  },

  // EXECUTION INVENTORY (mapped to platform content types)
  execution_plan: {
    stakeholder_campaigns: [
      {
        stakeholder: "Security-conscious CISOs",
        priority: 1,
        content_items: [
          {
            type: "thought_leadership",
            topic: "What the breach teaches us about enterprise security",
            target: "TechCrunch, SecurityWeek",
            content_brief: {
              angle: "Expert analysis positioning us as security leaders",
              key_points: [...],
              tone: "Authoritative but empathetic",
              cta: "Download our security whitepaper"
            }
          },
          {
            type: "social_post",
            platform: "linkedin",
            topic: "Security architecture that prevents breaches like Competitor X",
            content_brief: {
              hook: "10M users affected. Here's what went wrong...",
              body_points: [...],
              cta: "Book a security audit"
            }
          },
          {
            type: "media_pitch",
            topic: "Our CEO available to comment on enterprise security trends",
            target: "WSJ, Bloomberg, Reuters",
            content_brief: {
              headline: "How companies can avoid Competitor X's mistakes",
              expert_quotes: [...],
              data_points: [...],
              urgency: "Story is hot right now - today/tomorrow"
            }
          }
        ]
      },
      {
        stakeholder: "Existing customers (reassurance)",
        priority: 1,
        content_items: [
          {
            type: "social_post",
            platform: "twitter",
            topic: "Our security commitment to customers",
            content_brief: {...}
          },
          {
            type: "user_action",
            action_type: "email_campaign",
            topic: "Proactive security update to customers",
            content_brief: {...}
          }
        ]
      }
    ],

    // Timeline
    execution_timeline: {
      immediate: ["Social posts", "Media pitches"],
      week_1: ["Thought leadership articles"],
      week_2: ["Customer email campaign", "Webinar"]
    }
  },

  // GAMMA PRESENTATION (auto-generated)
  presentation: {
    gamma_url: "https://gamma.app/docs/...",
    slides: [
      {
        section: "The Opportunity",
        content: "What happened, why it matters, time window"
      },
      {
        section: "Strategic Approach",
        content: "How we'll position ourselves, key messages"
      },
      {
        section: "Execution Plan",
        content: "Content inventory, stakeholders, timeline"
      },
      {
        section: "Expected Impact",
        content: "Metrics, KPIs, success criteria"
      }
    ]
  },

  // METADATA
  detection_metadata: {
    trigger_events: [...],
    confidence_score: 0.87,
    category: "competitive_crisis",
    auto_executable: true
  }
}
```

---

## Platform Content Types Alignment

### Content Types Available on Platform

| Content Type | Platform Capability | NIV Generator Support | Strategic Planning Support |
|--------------|--------------------|-----------------------|---------------------------|
| `media_pitch` | ✅ Campaign Builder | ❌ Not yet | ✅ Execution Items |
| `social_post` | ✅ Campaign Builder | ✅ LinkedIn/Twitter/Instagram | ✅ Execution Items |
| `thought_leadership` | ✅ Campaign Builder | ✅ Blog posts | ✅ Execution Items |
| `press_release` | ❌ Not in campaign builder | ✅ NIV generates | ❌ Not in execution items |
| `blog_post` | ❌ Not in campaign builder | ✅ NIV generates | Can map to `thought_leadership` |
| `image` | ❌ Not in campaign builder | ✅ Vertex AI | ❌ Not in execution items |
| `presentation` | ❌ Not in campaign builder | ✅ Gamma outlines | ❌ Not in execution items |
| `user_action` | ✅ Campaign Builder | ❌ Generic | ✅ Execution Items |

### Proposed Unified Content Type System

```typescript
enum ContentType {
  // Core content (execution items)
  MEDIA_PITCH = 'media_pitch',
  SOCIAL_POST = 'social_post',
  THOUGHT_LEADERSHIP = 'thought_leadership',

  // Extended content (should be added to execution items)
  PRESS_RELEASE = 'press_release',
  BLOG_POST = 'blog_post',
  IMAGE = 'image',
  VIDEO = 'video',
  PRESENTATION = 'presentation',

  // Actions
  EMAIL_CAMPAIGN = 'email_campaign',
  WEBINAR = 'webinar',
  EVENT = 'event',
  PARTNERSHIP_OUTREACH = 'partnership_outreach',
  USER_ACTION = 'user_action' // Generic catch-all
}
```

**Update campaign_execution_items table:**
```sql
ALTER TABLE campaign_execution_items
DROP CONSTRAINT campaign_execution_items_content_type_check;

ALTER TABLE campaign_execution_items
ADD CONSTRAINT campaign_execution_items_content_type_check
CHECK (content_type IN (
  'media_pitch',
  'social_post',
  'thought_leadership',
  'press_release',
  'blog_post',
  'image',
  'presentation',
  'email_campaign',
  'webinar',
  'event',
  'user_action'
));
```

---

## Implementation Plan

### Phase 1: Enhanced Opportunity Detection ⭐ PRIORITY

**Update `mcp-opportunity-detector`:**

1. **New output format** aligned with execution:
```typescript
interface OpportunityV2 {
  // Strategic context
  opportunity_id: string
  title: string
  strategic_context: {
    trigger_events: string[]
    market_dynamics: string
    why_now: string
    time_window: string
    expected_impact: string
  }

  // EXECUTION-READY PLAN
  execution_plan: {
    stakeholder_campaigns: StakeholderCampaign[]
    execution_timeline: Timeline
    success_metrics: Metric[]
  }

  // Auto-generation ready
  content_briefs_ready: boolean
  auto_executable: boolean
}

interface StakeholderCampaign {
  stakeholder_name: string
  stakeholder_priority: 1 | 2 | 3 | 4
  lever_name: string
  lever_priority: 1 | 2 | 3 | 4
  content_items: ContentBrief[]
}

interface ContentBrief {
  type: ContentType
  topic: string
  target?: string
  platform?: 'linkedin' | 'twitter' | 'instagram'
  brief: {
    angle: string
    key_points: string[]
    tone: string
    length: string
    cta: string
    urgency: 'immediate' | 'this_week' | 'this_month'
  }
}
```

2. **Update Claude prompt** to generate execution-ready opportunities:
```typescript
const OPPORTUNITY_DETECTION_PROMPT = `
You are detecting PR opportunities from today's intelligence.

For each opportunity, you MUST provide:
1. Strategic context (why it's an opportunity)
2. Complete execution plan with specific content items
3. Map each content item to these types:
   - media_pitch: Pitches to journalists
   - social_post: LinkedIn/Twitter/Instagram posts
   - thought_leadership: Blog posts, articles, op-eds
   - press_release: Formal announcements
   - email_campaign: Email to customers/prospects
   - webinar: Educational events
   - user_action: Other tactics

For EACH content item, provide a detailed brief with:
- Specific topic/angle
- Key talking points
- Target audience/outlet
- Tone and style
- Call to action
- Timing/urgency

Output JSON that can be directly executed by our content generation system.
`;
```

### Phase 2: Gamma Presentation Generation

**Create `generate-opportunity-presentation` edge function:**

```typescript
// Takes opportunity V2 format
// Generates comprehensive Gamma presentation
// Stores presentation URL in opportunities table

async function generateOpportunityPresentation(opportunity: OpportunityV2) {
  // 1. Build presentation outline
  const outline = {
    title: opportunity.title,
    sections: [
      {
        title: "The Opportunity",
        slides: [
          {
            title: "What Happened",
            content: opportunity.strategic_context.trigger_events
          },
          {
            title: "Why It Matters",
            content: opportunity.strategic_context.why_now
          },
          {
            title: "Time Window",
            content: opportunity.strategic_context.time_window
          }
        ]
      },
      {
        title: "Strategic Approach",
        slides: [
          {
            title: "Target Stakeholders",
            content: opportunity.execution_plan.stakeholder_campaigns.map(...)
          },
          {
            title: "Key Messages",
            content: extractKeyMessages(opportunity)
          }
        ]
      },
      {
        title: "Execution Plan",
        slides: [
          {
            title: "Content Inventory",
            content: formatContentInventory(opportunity.execution_plan)
          },
          {
            title: "Timeline",
            content: opportunity.execution_plan.execution_timeline
          }
        ]
      },
      {
        title: "Expected Impact",
        slides: [
          {
            title: "Success Metrics",
            content: opportunity.execution_plan.success_metrics
          }
        ]
      }
    ]
  }

  // 2. Call Gamma API
  const gammaResponse = await callGamma(outline)

  // 3. Store presentation URL
  await supabase
    .from('opportunities')
    .update({
      presentation_url: gammaResponse.url,
      presentation_data: gammaResponse
    })
    .eq('id', opportunity.opportunity_id)

  return gammaResponse.url
}
```

### Phase 3: Auto-Execution Pipeline

**Create execution orchestrator:**

```typescript
// When user approves an opportunity:
// 1. Create campaign_builder_session
// 2. Generate campaign_execution_items from opportunity.execution_plan
// 3. Auto-generate all content through niv-content-intelligent-v2
// 4. Track status in real-time

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

  // 3. Create execution items
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
        details: item.brief,
        status: 'pending'
      }))
    )

  await supabase
    .from('campaign_execution_items')
    .insert(executionItems)

  // 4. Auto-generate content for each item
  for (const item of executionItems) {
    await generateContentForItem(item, orgId)
  }

  return session.id
}

async function generateContentForItem(item: ExecutionItem, orgId: string) {
  // Update status
  await supabase
    .from('campaign_execution_items')
    .update({ status: 'generating' })
    .eq('id', item.id)

  try {
    // Call NIV content generator with memory vault context
    const context = await buildGenerationContext(orgId)

    const content = await callNIVContentGenerator({
      type: item.content_type,
      topic: item.topic,
      brief: item.details,
      context: context,
      organization_id: orgId
    })

    // Save generated content
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

---

## Database Schema Updates

### 1. Extend `opportunities` table

```sql
ALTER TABLE opportunities
ADD COLUMN presentation_url TEXT,
ADD COLUMN presentation_data JSONB,
ADD COLUMN execution_plan JSONB,
ADD COLUMN auto_executable BOOLEAN DEFAULT false,
ADD COLUMN executed BOOLEAN DEFAULT false,
ADD COLUMN campaign_session_id UUID REFERENCES campaign_builder_sessions(id);
```

### 2. Update `campaign_execution_items` content types

```sql
-- See "Proposed Unified Content Type System" section above
```

---

## User Experience Flow

### Discovery → Strategy → Execution

1. **Real-time monitor runs** → Detects opportunity
2. **Opportunity appears** in Opportunities dashboard with:
   - Strategic context
   - Complete execution plan
   - Auto-generated Gamma presentation
3. **User reviews** Gamma presentation
4. **User clicks "Execute Opportunity"**
5. **System automatically**:
   - Creates campaign session
   - Generates all content items
   - Shows execution progress
6. **User reviews** generated content
7. **User publishes** or refines content

---

## Example: Complete Opportunity Output

```json
{
  "opportunity_id": "opp_123",
  "title": "Capitalize on Competitor's Product Recall",
  "score": 92,
  "urgency": "high",
  "time_window": "2-3 days",

  "strategic_context": {
    "trigger_events": [
      "Competitor X issued recall of flagship product",
      "10,000 units affected",
      "Safety concerns cited by regulatory agency"
    ],
    "market_dynamics": "Customer trust shaken, market looking for alternatives",
    "why_now": "Window before competitor recovers or competitors move",
    "expected_impact": "20-30% increase in consideration among affected segment"
  },

  "execution_plan": {
    "stakeholder_campaigns": [
      {
        "stakeholder_name": "Affected customers (Competitor X users)",
        "stakeholder_priority": 1,
        "lever_name": "Safety & Reliability Narrative",
        "lever_priority": 1,
        "content_items": [
          {
            "type": "social_post",
            "platform": "linkedin",
            "topic": "Our commitment to product safety and quality",
            "brief": {
              "angle": "Empathetic leadership - safety first",
              "key_points": [
                "Express concern for affected users",
                "Highlight our safety record",
                "Explain our quality process",
                "Offer migration assistance"
              ],
              "tone": "Empathetic but confident",
              "length": "150-200 words",
              "cta": "Learn about our safety standards",
              "urgency": "immediate"
            }
          },
          {
            "type": "thought_leadership",
            "topic": "The hidden costs of cutting corners on product safety",
            "target": "Industry blogs, LinkedIn articles",
            "brief": {
              "angle": "Industry expert perspective on safety standards",
              "key_points": [
                "Common shortcuts that lead to recalls",
                "True cost of quality vs. cost of failure",
                "How we approach safety",
                "Regulatory landscape"
              ],
              "tone": "Authoritative, educational",
              "length": "800-1000 words",
              "cta": "Download our safety whitepaper",
              "urgency": "this_week"
            }
          },
          {
            "type": "email_campaign",
            "topic": "Special offer for Competitor X customers",
            "target": "Competitor X customer list (if available)",
            "brief": {
              "angle": "Help affected customers transition smoothly",
              "key_points": [
                "Acknowledge the situation",
                "Offer discounted migration",
                "Highlight safety differences",
                "Easy switching process"
              ],
              "tone": "Helpful, not opportunistic",
              "length": "200-250 words",
              "cta": "Schedule a demo",
              "urgency": "this_week"
            }
          }
        ]
      },
      {
        "stakeholder_name": "Media & Industry Analysts",
        "stakeholder_priority": 1,
        "lever_name": "Thought Leadership",
        "lever_priority": 1,
        "content_items": [
          {
            "type": "media_pitch",
            "topic": "CEO available to discuss industry safety standards",
            "target": "TechCrunch, The Verge, WSJ",
            "brief": {
              "angle": "Expert commentary on recall implications for industry",
              "key_points": [
                "What this recall means for industry",
                "Our approach to safety",
                "Regulatory trends",
                "Future of product safety"
              ],
              "tone": "Expert, neutral but confident",
              "length": "Pitch: 100 words, Interview: 20-30 min",
              "cta": "Interview our CEO",
              "urgency": "immediate"
            }
          }
        ]
      }
    ],

    "execution_timeline": {
      "immediate": [
        "Social posts on safety commitment",
        "Media pitches for CEO interviews"
      ],
      "week_1": [
        "Thought leadership article published",
        "Email campaign to competitor customers"
      ],
      "week_2": [
        "Webinar on product safety",
        "Case study of our quality process"
      ]
    },

    "success_metrics": [
      { "metric": "Website traffic from competitor X users", "target": "+40%" },
      { "metric": "Demo requests", "target": "+50 this week" },
      { "metric": "Media mentions", "target": "3-5 tier-1 outlets" },
      { "metric": "Social engagement", "target": "2x normal" }
    ]
  },

  "presentation": {
    "gamma_url": "https://gamma.app/docs/capitalize-competitor-recall-xyz",
    "slides_count": 12
  },

  "metadata": {
    "detected_at": "2025-01-21T10:30:00Z",
    "confidence_score": 0.92,
    "category": "competitive_crisis",
    "auto_executable": true
  }
}
```

---

## Benefits

1. **Strategic Clarity**: Every opportunity comes with full strategic context via Gamma
2. **Execution Ready**: All content items mapped to platform capabilities
3. **Auto-Execution**: One-click to generate all content
4. **Unified System**: Opportunity → Campaign → Execution → Content
5. **Stakeholder Buy-in**: Professional Gamma presentations for approval
6. **Platform Cohesion**: Everything speaks the same content type language

---

## Next Steps

1. ✅ Review and approve this architecture
2. ⏭️ Update `campaign_execution_items` table with new content types
3. ⏭️ Enhance `mcp-opportunity-detector` to output V2 format
4. ⏭️ Build `generate-opportunity-presentation` function
5. ⏭️ Create auto-execution orchestrator
6. ⏭️ Update Opportunities UI to show execution plans
7. ⏭️ Build "Execute Opportunity" flow in frontend

---

## Questions for Discussion

1. Should we auto-generate Gamma for EVERY opportunity, or only high-scoring ones?
2. Should execution be fully automatic, or require user approval for each content item?
3. What additional content types should we support? (Video, podcast, etc.)
4. Should we integrate with actual publishing platforms (LinkedIn API, etc.)?
5. How do we handle opportunity versioning/iteration?
