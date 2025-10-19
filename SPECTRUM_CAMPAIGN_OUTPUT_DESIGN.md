# Spectrum Campaign Output Design

## Core Principle
**Output = Actionable Campaign Blueprint between Synthesis and Framework**

- **More structured than Synthesis** (specific tactics, timelines, dependencies)
- **More strategic than Framework** (multi-track, multi-phase, system-level thinking)
- **Clear separation** between auto-executable content vs. manual actions

## Output Structure

### 1. Campaign Overview (Strategic Layer)
```typescript
interface SpectrumCampaign {
  // Campaign Identity
  campaign_id: string
  campaign_name: string                    // "AI Workplace Safety Narrative Capture"
  campaign_type: 'cascade' | 'void' | 'mirror' | 'trojan' | 'network'

  // Strategic Context
  strategic_initiative: string             // "Establish thought leadership in AI safety"
  trigger: {
    opportunity_type: string               // "narrative_void"
    detection: string                      // "50K searches/month, no authority, 48hr window"
    intelligence_source: string[]          // Links to intelligence findings
  }

  // Effort Estimation
  effort_profile: {
    duration: string                       // "6 weeks"
    sustained_effort: boolean              // true
    multipronged: boolean                  // true
    team_requirements: string[]            // ["PR", "Content", "Social", "Partnerships"]
    estimated_hours: number                // 120 hours total
  }

  // Success Definition
  objective: string                        // "Own 'AI workplace safety' conversation by week 6"
  success_metrics: {
    primary: string[]                      // ["Void fill rate: 70%+", "Media attribution"]
    cascade_indicators: string[]           // ["Pattern recognition", "Convergence momentum"]
  }
}
```

### 2. Multi-Track Execution Plan
```typescript
interface CampaignTracks {
  // TRACK 1: Visible (Traditional PR)
  visible_track: {
    purpose: string                        // "What competitors see"
    tactics: Tactic[]
    auto_executable: number                // Count of tactics we can generate
    manual_required: number                // Count requiring user action
  }

  // TRACK 2: Invisible (Cascade/Influence)
  invisible_track: {
    purpose: string                        // "What actually works"
    seeds: Seed[]                          // Unconnected narratives to plant
    convergence_plan: ConvergencePlan
    auto_executable: number
    manual_required: number
  }

  // TRACK 3: Insurance
  insurance_track: {
    purpose: string                        // "Backup if cascade fails"
    fallback_content: Tactic[]
    trigger_conditions: string[]           // When to activate
    auto_executable: number
    manual_required: number
  }
}
```

### 3. Phased Tactical Breakdown
```typescript
interface CampaignPhase {
  phase_number: number
  phase_name: string                       // "Week 1-2: Seed Phase"
  duration: string                         // "2 weeks"
  objective: string                        // "Deploy 15 unconnected narratives"
  success_criteria: string                 // "No one sees connection"

  tactics: CampaignTactic[]
}

interface CampaignTactic {
  tactic_id: string
  tactic_name: string                      // "Fund academic paper on AI safety protocols"
  track: 'visible' | 'invisible' | 'insurance'
  phase: number

  // CRITICAL: Execution Classification
  execution_type: 'auto_executable' | 'semi_auto' | 'manual_only'

  // Auto-Executable Content
  content_generation?: {
    content_type: string                   // "thought-leadership", "social-post", etc.
    can_generate: boolean                  // true
    generation_prompt: string              // What to tell NIV
    dependencies: string[]                 // Other tactics that must complete first
  }

  // Manual Actions Required
  manual_actions?: {
    action_type: string                    // "outreach", "partnership", "funding", "offline"
    description: string                    // "Contact Dr. Smith at Stanford to fund research"
    owner: string                          // "Partnerships Team"
    requirements: string[]                 // ["Budget approval", "Legal review"]
    estimated_effort: string               // "4-6 hours"
  }

  // Semi-Auto (We generate, they execute)
  semi_auto?: {
    signaldesk_generates: string           // "Email pitch to Dr. Smith"
    user_executes: string                  // "Send email, schedule meeting, negotiate terms"
  }

  // Timing and Dependencies
  timing: {
    start_date_relative: string            // "Day 1"
    duration: string                       // "1 week"
    dependencies: string[]                 // Tactic IDs that must complete first
  }

  // Context for Execution
  context: {
    why_this_matters: string               // Strategic rationale
    convergence_contribution: string       // How it contributes to cascade
    messaging_guidance: string             // Key messages to embed
  }
}
```

### 4. Content Generation Queue (Auto-Executable)
```typescript
interface AutoExecutableQueue {
  total_pieces: number                     // 12 pieces
  estimated_time: string                   // "2-3 hours with NIV"

  content_pieces: Array<{
    piece_id: string
    piece_name: string                     // "Thought leadership: AI Safety Framework"
    content_type: string                   // Maps to NIV content types
    phase: number                          // Which phase this belongs to
    track: string                          // Which track this supports
    priority: 'immediate' | 'scheduled' | 'conditional'

    // Generation Context
    generation_context: {
      campaign_messaging: string[]         // Key messages to include
      strategic_angle: string              // How it fits cascade
      tone: string                         // Voice/style
      channels: string[]                   // Where it will be used
    }

    // Scheduling
    schedule: {
      generate_by: string                  // "Day 3"
      publish_on: string                   // "Day 5"
      conditional_triggers?: string[]      // "Only if seed #1 gets 500+ views"
    }

    // Dependencies
    depends_on: string[]                   // Other content that must exist first
    enables: string[]                      // Content that can't happen until this exists
  }>

  // Bulk Generation Options
  bulk_generate: {
    available: boolean                     // Can we generate all at once?
    recommended: boolean                   // Should we?
    rationale: string                      // Why/why not
  }
}
```

### 5. Manual Action Plan (User-Executed)
```typescript
interface ManualActionPlan {
  total_actions: number                    // 8 actions
  estimated_effort: string                 // "40 hours over 6 weeks"

  actions: Array<{
    action_id: string
    action_name: string                    // "Secure academic research partnership"
    action_type: 'outreach' | 'partnership' | 'event' | 'funding' | 'offline'
    phase: number
    track: string

    // What SignalDesk Provides
    signaldesk_support: {
      provides: string[]                   // ["Email template", "Talking points", "Research brief"]
      auto_generated: boolean              // Can NIV generate support materials?
    }

    // What User Must Do
    user_execution: {
      description: string                  // Detailed action steps
      owner: string                        // Who should do this
      estimated_hours: number              // Time commitment
      skills_required: string[]            // ["Business development", "Budget authority"]
      dependencies: string[]               // What must happen first
    }

    // Success Tracking
    completion_criteria: string            // How to know it's done
    impact_on_cascade: string              // What happens if skipped

    // Timing
    timing: {
      start_by: string                     // "Week 1, Day 2"
      complete_by: string                  // "Week 2, Day 5"
      time_sensitive: boolean              // Can't delay
    }
  }>
}
```

### 6. Convergence Monitoring Plan
```typescript
interface ConvergenceMonitoring {
  // What to Watch For
  indicators: Array<{
    indicator_name: string                 // "Pattern recognition emerging"
    what_to_monitor: string                // "Mentions of 'cognitive partnership' phrase"
    tools: string[]                        // ["Social listening", "Google Trends"]
    threshold: string                      // "50+ independent uses"
    phase_expected: number                 // Should happen by phase 3
  }>

  // Trigger Conditions
  triggers: Array<{
    trigger_id: string
    condition: string                      // "When phrase hits 1000 mentions"
    action: string                         // "Release whitepaper"
    content_id?: string                    // Link to auto-executable content
    manual_action_id?: string              // Link to manual action
  }>

  // Adjustment Signals
  pivot_indicators: Array<{
    signal: string                         // "Seeds not gaining traction by week 3"
    recommended_adjustment: string         // "Shift to insurance track"
    decision_point: string                 // "Week 3, Day 1"
  }>
}
```

## Complete Output Example

### Campaign: "AI Workplace Safety Narrative Capture"

**Overview:**
- Type: CASCADE PATTERN
- Strategic Initiative: Establish thought leadership in AI workplace safety
- Duration: 6 weeks (sustained, multipronged effort)
- Team: PR, Content, Social Media, Partnerships
- Effort: 120 hours total (80 hours manual, 40 hours content generation)

**Objective:** Own "AI workplace safety" conversation by creating cascade of unconnected narratives that converge into OpenAI as the obvious authority.

---

### Multi-Track Strategy

**TRACK 1: Visible (Traditional PR)**
- Purpose: What competitors see and expect
- Auto-Executable: 5 pieces
- Manual Actions: 2 actions

**TRACK 2: Invisible (Cascade Influence)**
- Purpose: What actually creates narrative ownership
- Seeds: 15 unconnected narratives
- Auto-Executable: 8 pieces
- Manual Actions: 5 actions

**TRACK 3: Insurance**
- Purpose: Direct messaging if cascade fails
- Trigger: Week 4 if convergence not detected
- Auto-Executable: 3 pieces

---

### Phase 1: Seed Deployment (Week 1-2)

#### Objective
Deploy 15 unconnected narratives. Success = No one sees connection.

#### Tactics

##### Tactic 1: Academic Research Funding
- **Track:** Invisible
- **Execution:** MANUAL ONLY
- **Action:** Secure partnership with Stanford AI Lab to fund research on "cognitive partnership frameworks"
- **What You Do:**
  1. Contact Dr. Maya Chen (maya.chen@stanford.edu)
  2. Propose $50K research grant for 6-month study
  3. Negotiate terms to include OpenAI mention in acknowledgments
  4. Secure budget approval from leadership
- **What SignalDesk Provides:**
  - ✅ AUTO: Email pitch template
  - ✅ AUTO: Research partnership proposal
  - ✅ AUTO: Budget justification document
- **Owner:** Partnerships Team
- **Effort:** 8-12 hours
- **Timing:** Start Day 1, Complete by Day 10
- **Dependencies:** None
- **Cascade Impact:** CRITICAL - This seed becomes the academic foundation

##### Tactic 2: Thought Leadership Article
- **Track:** Invisible
- **Execution:** AUTO-EXECUTABLE
- **Content:** "The Future of Human-AI Collaboration: Cognitive Partnership Models"
- **What SignalDesk Does:**
  - ✅ AUTO: Generate 2000-word article
  - ✅ AUTO: Include phrase "cognitive partnership" 3-5 times naturally
  - ✅ AUTO: No mention of OpenAI (appears independent)
- **What You Do:**
  - Publish on Medium/LinkedIn
  - Submit to AI publications
- **Owner:** Content Team
- **Effort:** 2 hours (review and publish)
- **Timing:** Generate Day 2, Publish Day 4
- **Dependencies:** None
- **Cascade Impact:** HIGH - Establishes thought leadership seed

##### Tactic 3: Art Installation Sponsorship
- **Track:** Invisible
- **Execution:** SEMI-AUTO
- **Action:** Sponsor AI art exhibition exploring "cognitive partnership"
- **What SignalDesk Provides:**
  - ✅ AUTO: Sponsorship proposal
  - ✅ AUTO: Exhibition brief (what themes to highlight)
  - ✅ AUTO: Social media posts for sponsorship announcement
- **What You Do:**
  - Contact galleries/curators
  - Negotiate sponsorship terms
  - Coordinate logistics
- **Owner:** Brand/Marketing
- **Effort:** 10-15 hours
- **Timing:** Start Day 3, Complete by Week 2
- **Dependencies:** None
- **Cascade Impact:** MEDIUM - Creates cultural seed

##### Tactic 4: Parent Education Forum
- **Track:** Invisible
- **Execution:** MANUAL ONLY
- **Action:** Start online discussion in parenting forums about AI in education
- **What SignalDesk Provides:**
  - ✅ AUTO: Discussion starter posts (10 variations)
  - ✅ AUTO: Response templates to common questions
  - ✅ AUTO: Resource list to share
- **What You Do:**
  - Create authentic forum accounts
  - Post organically in 5-7 parenting communities
  - Engage in discussions naturally
  - Introduce "cognitive partnership" concept
- **Owner:** Community/Social
- **Effort:** 5-8 hours
- **Timing:** Start Day 5, Ongoing through Week 2
- **Dependencies:** None
- **Cascade Impact:** MEDIUM - Plants seed in unexpected audience

... [12 more tactics across 3 tracks]

---

### Auto-Executable Content Queue

**Ready to Generate (8 pieces, 2-3 hours total)**

1. **Thought Leadership Article** - "Cognitive Partnership Models" (2000 words)
   - Generate immediately
   - Publish Day 4

2. **Social Post Series** - LinkedIn posts on AI collaboration (10 posts)
   - Generate Day 2
   - Schedule across Week 1-2

3. **Email Template** - Academic partnership pitch
   - Generate immediately
   - Use for Tactic 1

4. **Research Proposal** - Stanford partnership document
   - Generate immediately
   - Use for Tactic 1

... [4 more pieces]

**Bulk Generate Options:**
- ✅ Recommended: Generate all 8 pieces now
- Rationale: These need time for review/approval before use
- Estimated time: 2-3 hours with NIV Content Orchestrator

---

### Manual Action Checklist

**Week 1-2: 5 Actions, 40 hours estimated**

- [ ] **Action 1:** Secure Stanford research partnership (8-12 hrs)
  - Owner: Partnerships
  - SignalDesk provides: Email template, proposal, budget doc
  - You do: Contact, negotiate, close deal

- [ ] **Action 2:** Sponsor art exhibition (10-15 hrs)
  - Owner: Brand/Marketing
  - SignalDesk provides: Sponsorship proposal, social posts
  - You do: Contact galleries, negotiate, coordinate

- [ ] **Action 3:** Start parent forum discussions (5-8 hrs)
  - Owner: Community/Social
  - SignalDesk provides: Discussion posts, responses, resources
  - You do: Post organically, engage naturally

... [2 more actions]

---

### Convergence Monitoring

**What to Watch For:**

**Week 3-4: Pattern Recognition**
- Monitor: Mentions of "cognitive partnership" across platforms
- Threshold: 50+ independent uses
- Tool: Social listening, Google Trends
- Signal: Pattern is emerging naturally

**Week 4-5: Connection Detection**
- Monitor: Media/influencers noticing pattern
- Threshold: 3+ articles/posts wondering about trend
- Tool: Media monitoring
- Signal: Ready for convergence trigger

**Trigger Conditions:**

1. **Trigger:** "Cognitive partnership" hits 1000 mentions
   - **Action:** Release whitepaper revealing framework
   - **Content:** AUTO-EXECUTABLE (already in queue)

2. **Trigger:** Competitor notices pattern
   - **Action:** Shift messaging to insurance track
   - **Content:** Activate backup content

**Pivot Indicators:**

- **Signal:** Seeds not gaining traction by Week 3
- **Decision:** Shift budget to insurance track (traditional PR)
- **Decision Point:** Week 3, Day 1 review

---

### Campaign Completion

**Week 6: Revelation Phase**

Final tactics to execute when cascade converges...

**Deliverables:**
- 15 auto-generated content pieces (saved to Memory Vault)
- 8 completed manual actions
- Narrative ownership established
- System state changed

---

## Save to Memory Vault Structure

```
/Memory Vault
  /Campaigns
    /AI Workplace Safety Narrative Capture
      /Campaign Strategy
        - campaign_blueprint.md (this document)
        - execution_timeline.md
        - success_metrics.md
      /Track 1 - Visible
        - tactic_1_content.md
        - tactic_2_content.md
      /Track 2 - Invisible
        - seed_1_content.md
        - seed_2_content.md
        - convergence_plan.md
      /Track 3 - Insurance
        - backup_content.md
      /Manual Actions
        - partnership_templates.md
        - outreach_scripts.md
      /Monitoring
        - convergence_indicators.md
        - trigger_conditions.md
```

## Benefits of This Approach

1. **Clear Separation**: Auto-executable vs. manual actions explicitly categorized
2. **Actionable**: Every tactic has clear owner, effort, timing
3. **Trackable**: Can monitor progress through phases
4. **Flexible**: Can generate all content or piece-by-piece
5. **Strategic**: Maintains multi-track, cascade thinking
6. **Realistic**: Acknowledges sustained effort required
7. **Orchestratable**: Auto-executable content flows through NIV
8. **Saveable**: Complete campaign preserved in Memory Vault

This sits perfectly between Synthesis (strategic thinking) and Framework (execution plan).
