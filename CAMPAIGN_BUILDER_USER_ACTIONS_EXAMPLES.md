# Campaign Builder User Actions - Real Examples & Quick Reference

## Quick Navigation
- [Generation Pipeline](#generation-pipeline)
- [Data Structure](#data-structure)
- [Real Examples](#real-examples)
- [Frontend Display](#frontend-display)
- [Implementation Checklist](#implementation-checklist)

---

## Generation Pipeline

### Where User Actions Get Created

**File: `/supabase/functions/niv-campaign-orchestration-generator/index.ts`**

This is the **main generator** that creates user actions. It's called during blueprint generation:

```
User submits campaign goal
    ↓
CampaignBuilderWizard calls /api/generate-blueprint
    ↓
niv-campaign-blueprint-orchestrator coordinates:
    1. niv-campaign-blueprint-base (Parts 1-2)
    2. niv-campaign-orchestration-generator (Part 3) ← CREATES USER ACTIONS
    3. niv-campaign-execution-generator (Part 5)
    ↓
Blueprint stored in campaign_builder_sessions table
    ↓
Frontend displays via BlueprintV3Presentation component
```

### The AI Prompt That Generates Them

From the orchestration generator (lines 34-350):

```typescript
const systemPrompt = `You are an expert in VECTOR campaign orchestration...

## Your Task
Generate Part 3: Four-Pillar Orchestration Strategy across 4 phases.

## Four Pillars
1. **OWNED ACTIONS**: What organization creates & distributes
2. **RELATIONSHIP ORCHESTRATION**: Who to influence & what to create for them  ← GENERATES USER ACTIONS HERE
3. **EVENT ORCHESTRATION**: Where to show up & how to extract value          ← AND HERE
4. **MEDIA ENGAGEMENT**: Which journalists to pitch, what stories           ← AND HERE

## CRITICAL: Pillar 4 Media Engagement Requirements
You MUST include for each phase:
- Real Journalists from Research
- Complete Media Playbooks
- Journalist Nurturing Plans
- **Execution Requirements** (who does what)
...`
```

**Key Section - Where additionalTactics Come From:**

```typescript
// From the prompt (lines 200-220):
contentToCreateForThem: [
  {
    contentType: "white-paper",
    topic: "Their key issue",
    why: "They need this data",
    signaldeskGenerates: "White paper with citations",
    userExecutes: "Send via LinkedIn with note",  // ← THIS IS A USER ACTION
    timing: "Week 1"
  }
]
```

---

## Data Structure

### TypeScript Interface (from BlueprintV3Presentation.tsx)

```typescript
// The container structure
part3_stakeholderOrchestration?: {
  stakeholderOrchestrationPlans?: Array<{
    stakeholder?: {
      name?: string
      priority?: number
      psychologicalProfile?: {
        primaryFear?: string
        primaryAspiration?: string
        decisionTrigger?: string
      }
    }
    influenceLevers?: Array<{
      leverName?: string
      leverType?: string
      priority?: number
      objective?: string
      campaign?: {
        // The four action types:
        mediaPitches?: Array<{...}>      // Auto-execute
        socialPosts?: Array<{...}>       // Auto-execute
        thoughtLeadership?: Array<{...}> // Auto-execute
        
        // USER ACTIONS - THIS IS THE ONE WE CARE ABOUT
        additionalTactics?: Array<{
          type?: string                   // "executive-coffee", "analyst-briefing", etc.
          who?: string                    // "CEO / VP Sales"
          what?: string                   // Action description
          where?: string                  // "LinkedIn → Direct message"
          when?: string                   // "Week 2, after thought leadership published"
          estimatedEffort?: string        // "1-2 hours (including prep)"
          resources?: string[]            // ["Talking points", "Case studies"]
        }>
      }
      completionCriteria?: string[]
    }>
  }>
}
```

### Minimal User Action Object

```typescript
{
  type: "executive-coffee",
  who: "CEO / VP Sales",
  what: "Schedule 30-min coffee chat to discuss tech trends",
  where: "LinkedIn → Direct message or email intro",
  when: "Week 2",
  estimatedEffort: "1-2 hours",
  resources: ["Talking points", "Recent case studies"]
}
```

---

## Real Examples

### Example 1: B2B SaaS Campaign for Security Software

**Context:**
- Company: CyberSecure (security software vendor)
- Goal: Launch new vulnerability management platform
- Target: Security decision makers at Fortune 500 companies
- Pattern: VECTOR campaign (multi-channel influence)

**Generated User Actions:**

```json
{
  "stakeholder": {
    "name": "CISO at Global Bank",
    "priority": 1,
    "psychologicalProfile": {
      "primaryFear": "Major breach causing regulatory fines",
      "primaryAspiration": "Transform security from cost center to competitive advantage",
      "decisionTrigger": "Peer adoption + analyst validation"
    }
  },
  "influenceLevers": [
    {
      "leverName": "Executive Thought Leadership",
      "leverType": "owned",
      "additionalTactics": [
        {
          "type": "executive-coffee",
          "who": "CEO / VP Sales",
          "what": "30-min call to discuss their vulnerability management challenges and how others are solving it",
          "where": "LinkedIn → Cold message with mutual connection introduction",
          "when": "Week 1 (after case studies published in security communities)",
          "estimatedEffort": "1.5 hours (30-min call + 30-min prep + 30-min follow-up)",
          "resources": [
            "Talking points (SignalDesk generates)",
            "3 relevant case studies",
            "Industry benchmark data on remediation timelines"
          ]
        },
        {
          "type": "analyst-briefing",
          "who": "Product Marketing Manager",
          "what": "Schedule Gartner Peer Insights briefing to position as emerging leader",
          "where": "Virtual (Zoom) or in-person if Gartner event nearby",
          "when": "Week 3 (coordinate with media coverage cycle)",
          "estimatedEffort": "4 hours (prep + briefing + follow-up)",
          "resources": [
            "Executive presentation deck (SignalDesk generates with ROI data)",
            "Product roadmap overview",
            "Customer success metrics"
          ]
        }
      ]
    },
    {
      "leverName": "Analyst & Industry Authority",
      "leverType": "relationship",
      "additionalTactics": [
        {
          "type": "industry-conference-panel",
          "who": "CEO / Chief Product Officer",
          "what": "Submit proposal for 'Vulnerability Management in 2025' panel at InfoSec conference",
          "where": "RSA Conference (virtual or San Francisco)",
          "when": "Week 2 (deadline typically 6-8 weeks before event)",
          "estimatedEffort": "3 hours (proposal writing + follow-up + coordination)",
          "resources": [
            "Panel proposal template (SignalDesk generates)",
            "Speaking points (3 min intro + Q&A prep)",
            "Conference marketing materials"
          ]
        },
        {
          "type": "analyst-relationship-nurture",
          "who": "Sales or Marketing lead",
          "what": "Multi-touch engagement with Gartner/Forrester analysts covering vulnerability management",
          "where": "Email + LinkedIn + Analyst Briefing program",
          "when": "Weeks 1, 3, 5, 7 (staggered touchpoints)",
          "estimatedEffort": "5 hours total (20 min per week × 4 weeks)",
          "resources": [
            "Week 1: Research summary (no ask)",
            "Week 3: Comment on their recent LinkedIn post",
            "Week 5: Exclusive data/study invitation",
            "Week 7: Formal briefing + follow-up call"
          ]
        }
      ]
    }
  ]
}
```

### Example 2: B2C Consumer Product Launch

**Context:**
- Company: FitFlow (wellness app)
- Goal: Launch premium subscription tier to 18-35 fitness enthusiasts
- Pattern: VECTOR campaign with influencer orchestration

**Generated User Actions:**

```json
{
  "stakeholder": {
    "name": "Mid-tier Fitness Influencer (50K-200K followers)",
    "priority": 2,
    "psychologicalProfile": {
      "primaryFear": "Losing relevance to newer, bigger influencers",
      "primaryAspiration": "Become go-to expert for their niche",
      "decisionTrigger": "Exclusive access + community validation"
    }
  },
  "influenceLevers": [
    {
      "leverName": "Value-First Content Partnership",
      "leverType": "relationship",
      "additionalTactics": [
        {
          "type": "content-collaboration-outreach",
          "who": "Community Manager or Partnerships Lead",
          "what": "Propose joint content series: '30-Day Transformation Challenge' co-hosted with influencer",
          "where": "LinkedIn DM → Email with detailed opportunity",
          "when": "Week 1",
          "estimatedEffort": "2.5 hours (research influencer + craft personalized pitch + follow-up)",
          "resources": [
            "Personalized pitch email (SignalDesk generates)",
            "Joint content idea deck (SignalDesk generates)",
            "Partnership benefits summary (exclusivity, revenue share, etc.)"
          ]
        },
        {
          "type": "exclusive-early-access",
          "who": "Product or Marketing Manager",
          "what": "Provide 3-month premium access + revenue share for first 100 referrals",
          "where": "Email follow-up to initial contact",
          "when": "Week 2 (after initial interest)",
          "estimatedEffort": "1.5 hours (contract setup + onboarding call + asset provision)",
          "resources": [
            "Influencer agreement template",
            "Exclusive landing page URL",
            "Tracking/analytics dashboard access"
          ]
        }
      ]
    },
    {
      "leverName": "Community Engagement",
      "leverType": "owned",
      "additionalTactics": [
        {
          "type": "community-comment-participation",
          "who": "Community Managers (rotating)",
          "what": "Daily participation in their Discord/Slack communities: answer questions, share helpful tips, moderate discussions",
          "where": "r/fitness, r/bodyweightfitness, specific Discord fitness communities",
          "when": "Ongoing (start Week 1)",
          "estimatedEffort": "2.5 hours/week = ~10 hours/month for 4 weeks",
          "resources": [
            "Comment templates (SignalDesk generates 20 variations)",
            "FAQ document for common questions",
            "Moderation guidelines"
          ]
        }
      ]
    }
  ]
}
```

---

## Frontend Display

### How It Looks in BlueprintV3Presentation.tsx (Lines 722-761)

```typescript
{/* Additional Tactics (User Must Execute) */}
{campaign.additionalTactics && campaign.additionalTactics.length > 0 && (
  <div className="bg-amber-900/10 border border-amber-500/20 rounded p-3">
    {/* Header */}
    <div className="flex items-center gap-2 mb-2">
      <span className="text-amber-400">👤</span>  {/* Person emoji for "user action" */}
      <p className="text-sm font-semibold text-amber-300">User Must Execute</p>
      <span className="text-xs text-gray-500">({campaign.additionalTactics.length})</span>
    </div>
    
    {/* List of actions */}
    <div className="space-y-2">
      {campaign.additionalTactics.map((tactic, k) => (
        <div key={k} className="bg-zinc-900/30 rounded p-2 text-xs">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-amber-900/40 text-amber-300 rounded">
              {tactic.type}  {/* e.g., "executive-coffee" */}
            </span>
          </div>
          
          {/* WHO, WHERE, WHEN grid */}
          <div className="grid grid-cols-3 gap-2 mb-1">
            <div>
              <p className="text-gray-500">WHO</p>
              <p className="text-amber-300 font-medium">{tactic.who}</p>
            </div>
            <div>
              <p className="text-gray-500">WHERE</p>
              <p className="text-amber-300">{tactic.where}</p>
            </div>
            <div>
              <p className="text-gray-500">WHEN</p>
              <p className="text-amber-300">{tactic.when}</p>
            </div>
          </div>
          
          {/* WHAT description */}
          <p className="text-gray-500">WHAT</p>
          <p className="text-white mb-1">{tactic.what}</p>
          
          {/* Effort estimate */}
          {tactic.estimatedEffort && (
            <p className="text-gray-600 text-[10px]">
              Effort: {tactic.estimatedEffort}
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

### Visual Result:

```
┌──────────────────────────────────────────────────────────────┐
│ 👤 User Must Execute (5 items)                               │
├──────────────────────────────────────────────────────────────┤
│ ╭ executive-coffee                                           │
│ │ WHO:   CEO / VP Sales                                      │
│ │ WHERE: LinkedIn → Direct message                           │
│ │ WHEN:  Week 2, after thought leadership published          │
│ │ WHAT:  Schedule 30-min coffee chat to discuss tech trends  │
│ │        in their vertical and how others are addressing it  │
│ │ Effort: 1-2 hours (including prep)                        │
│ ╰──────────────────────────────────────────────────────────┤
│ ╭ analyst-briefing                                           │
│ │ WHO:   Product Marketing Manager                           │
│ │ WHERE: Virtual meeting (Zoom setup)                        │
│ │ WHEN:  Week 3                                              │
│ │ WHAT:  Set up Gartner/Forrester analyst briefing to        │
│ │        position company as innovator                       │
│ │ Effort: 3-4 hours (prep + briefing + follow-up)           │
│ ╰──────────────────────────────────────────────────────────┤
│ ╭ industry-panel-proposal                                    │
│ │ WHO:   CEO / Chief Product Officer                         │
│ │ WHERE: RSA Conference (San Francisco)                      │
│ │ WHEN:  Week 2 (deadline 6-8 weeks before event)           │
│ │ WHAT:  Submit proposal for panel on emerging vulnerabilities
│ │ Effort: 3 hours (proposal + follow-up + coordination)     │
│ ╰──────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### For Opportunity Engine User Actions

- [ ] **Define Data Structure**
  - [ ] Type (relationship-building, event, proposal, etc.)
  - [ ] Who (role/person executing)
  - [ ] What (action description)
  - [ ] Where (channel: email, phone, in-person, etc.)
  - [ ] When (timing relative to opportunity phase)
  - [ ] EstimatedEffort (hours: "2-3 hours")
  - [ ] Priority (1-4 scale)
  - [ ] Resources (templates, data, contacts)
  - [ ] SuccessMetric (how to measure completion)

- [ ] **Create Generation Prompt**
  - [ ] Analyze opportunity stage (Discovery, Qualification, Proposal, Negotiation, Closing)
  - [ ] Identify key stakeholders and decision-makers
  - [ ] Recommend high-impact human interactions
  - [ ] Distinguish from automated system actions
  - [ ] Include effort estimates and required resources

- [ ] **Build Frontend Component**
  - [ ] Use amber/yellow color scheme for user actions (follow Campaign Builder pattern)
  - [ ] Display WHO, WHAT, WHERE, WHEN in grid layout
  - [ ] Show action type as badge
  - [ ] Display effort estimate
  - [ ] Link to supporting resources (templates, talking points)
  - [ ] Add checkbox for completion tracking

- [ ] **Integrate with Workflow**
  - [ ] Show action count in opportunity summary
  - [ ] Group by phase or priority
  - [ ] Enable filtering/sorting
  - [ ] Track completion progress
  - [ ] Provide feedback on effectiveness

- [ ] **Create Supporting Resources**
  - [ ] Email templates for common outreach
  - [ ] Talking points for calls/meetings
  - [ ] Background research on contacts
  - [ ] Meeting agenda templates
  - [ ] Follow-up email sequences

---

## Key Code Locations

| Component | Purpose | Location |
|-----------|---------|----------|
| Data Structure | TypeScript interface | `BlueprintV3Presentation.tsx` (lines 6-254) |
| Frontend Display | Render user actions | `BlueprintV3Presentation.tsx` (lines 722-761) |
| Generation AI Prompt | Creates actions | `niv-campaign-orchestration-generator/index.ts` (lines 34-350) |
| Execution Inventory | Summary view | `BlueprintV3Presentation.tsx` (lines 991-1164) |
| Workflow | Full campaign flow | `CampaignBuilderWizard.tsx` (lines 1-1522) |

---

## Quick Tips for Implementation

1. **Keep It Simple**: Start with these core action types:
   - Direct outreach (LinkedIn, email)
   - Executive meetings (coffee chats, briefings)
   - Event participation (conferences, webinars)
   - Community engagement (comments, posts)

2. **Use Campaign Builder as Template**: The UI pattern with amber "User Must Execute" cards is proven effective

3. **Always Include Effort Estimates**: Users need to know time commitment upfront

4. **Provide Resources**: Don't just recommend actions—generate supporting materials

5. **Make it Trackable**: Allow users to mark actions as complete and see impact

6. **Progressive Disclosure**: Show summary counts first, details on drill-down

7. **Timing Context**: Show when actions should happen relative to other activities
