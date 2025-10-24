# Campaign Builder User Actions Implementation Analysis

## Overview
Campaign Builder implements a sophisticated two-layer action system:
1. **Signaldesk Auto-Execute Actions** - Automatically generated and executed by the system
2. **User Must Execute Actions** (additionalTactics) - Recommendations that require manual user execution

This document details how user actions are generated, structured, and presented.

---

## 1. WHERE USER ACTIONS ARE GENERATED

### Generation Pipeline

#### 1.1 Data Flow
```
Campaign Builder Wizard (Frontend)
    ↓
/api/generate-blueprint (Proxy Route)
    ↓
niv-campaign-blueprint-orchestrator (Supabase Edge Function)
    ├─ STEP 1: niv-campaign-blueprint-base
    │   └─ Generates: Overview, Goal Framework, Stakeholder Mapping, Message Architecture
    ├─ STEP 2: niv-blueprint-stakeholder-orchestration (async in database)
    │   └─ Generates: Stakeholder Orchestration Plans with campaign tactics
    └─ STEP 3: niv-campaign-execution-generator
        └─ Generates: Execution Requirements (team, budget, resources)

/api/finalize-blueprint (Proxy Route)
    ↓
niv-campaign-blueprint-finalize (Supabase Edge Function)
    └─ Fetches orchestration from database & merges all parts
```

#### 1.2 Key Edge Functions Responsible for User Actions

**niv-campaign-orchestration-generator** - PRIMARY GENERATOR
- Location: `/supabase/functions/niv-campaign-orchestration-generator/index.ts`
- Responsible for generating Part 3: Four-Pillar Orchestration Strategy
- Creates ALL user actions within the "additionalTactics" field

**niv-campaign-execution-generator** - SECONDARY ENRICHMENT
- Location: `/supabase/functions/niv-campaign-execution-generator/index.ts`
- Enriches user actions with execution requirements (effort, resources)
- Generates Part 5: Execution Requirements

---

## 2. HOW USER ACTIONS ARE STRUCTURED

### 2.1 Data Structure (TypeScript Interface)

From `BlueprintV3Presentation.tsx`:

```typescript
// Part 3: Stakeholder Orchestration (contains user actions)
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
        leverName?: string
        leverType?: string
        objective?: string
        mediaPitches?: Array<{...}>      // Auto-execute
        socialPosts?: Array<{...}>       // Auto-execute
        thoughtLeadership?: Array<{...}> // Auto-execute
        additionalTactics?: Array<{      // USER ACTIONS ← THIS IS IT
          type?: string                   // E.g., "partnership", "direct-outreach"
          who?: string                    // Person/role executing
          what?: string                   // Action description
          where?: string                  // Channel/location
          when?: string                   // Timing
          estimatedEffort?: string        // "2-3 hours"
          resources?: string[]            // Required tools/materials
        }>
      }
      completionCriteria?: string[]
    }>
  }>
}
```

### 2.2 Example Structure (Rendered Output)

```typescript
{
  stakeholderOrchestrationPlans: [
    {
      stakeholder: {
        name: "VP of Product at TechCorp",
        priority: 1,
        psychologicalProfile: {
          primaryFear: "Being disrupted by new technologies",
          primaryAspiration: "Leading innovation in their space",
          decisionTrigger: "Proof that competitors are adopting"
        }
      },
      influenceLevers: [
        {
          leverName: "Direct Executive Engagement",
          leverType: "relationship",
          priority: 1,
          objective: "Position CEO as trusted advisor for tech strategy",
          campaign: {
            mediaPitches: [...],    // 3-5 auto-execute media pitches
            socialPosts: [...],     // 8-10 auto-execute LinkedIn posts
            thoughtLeadership: [...], // 2-3 auto-execute articles
            additionalTactics: [    // USER ACTIONS
              {
                type: "executive-coffee",
                who: "CEO / VP Sales",
                what: "Schedule 30-min coffee chat to discuss tech trends in their vertical",
                where: "LinkedIn → Direct message or email intro",
                when: "Week 2, after thought leadership published",
                estimatedEffort: "1-2 hours (including prep)",
                resources: ["Talking points (SignalDesk generates)", "Recent case studies"]
              },
              {
                type: "analyst-briefing",
                who: "Product Marketing Manager",
                what: "Set up Gartner/Forrester analyst briefing to position company as innovator",
                where: "Virtual meeting (Zoom setup)",
                when: "Week 3",
                estimatedEffort: "3-4 hours (prep + briefing + follow-up)",
                resources: ["Presentation deck (SignalDesk generates)", "Data slides", "ROI calculator"]
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### 2.3 Frontend Display Structure

From `BlueprintV3Presentation.tsx` lines 722-761:

```typescript
{/* Additional Tactics (User Must Execute) */}
{campaign.additionalTactics && campaign.additionalTactics.length > 0 && (
  <div className="bg-amber-900/10 border border-amber-500/20 rounded p-3">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-amber-400">👤</span>
      <p className="text-sm font-semibold text-amber-300">User Must Execute</p>
      <span className="text-xs text-gray-500">({campaign.additionalTactics.length})</span>
    </div>
    <div className="space-y-2">
      {campaign.additionalTactics.map((tactic, k) => (
        <div key={k} className="bg-zinc-900/30 rounded p-2 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-amber-900/40 text-amber-300 rounded">
              {tactic.type}
            </span>
          </div>
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
          <p className="text-gray-500">WHAT</p>
          <p className="text-white mb-1">{tactic.what}</p>
          {tactic.estimatedEffort && (
            <p className="text-gray-600 text-[10px]">Effort: {tactic.estimatedEffort}</p>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 3. TYPES OF USER ACTIONS RECOMMENDED

### 3.1 Action Categories (from orchestration generator)

The system generates user actions across multiple categories:

#### **Pillar 1: Owned Actions - User Execution**
- **Community Engagement**: Comment on relevant Reddit/HN threads
- **Distribution**: Share content in target communities
- **Platform Management**: Respond to comments, engage in discussions

```typescript
distributionStrategy: {
  engagementChannels: [
    {
      platform: "Reddit r/[Topic]",
      engagementType: "Comment on threads",
      cadence: "3-5/week",
      tone: "Helpful peer",
      signaldeskGenerates: "10 comment templates"
      // USER MUST: Actually post the comments and engage
    }
  ]
}
```

#### **Pillar 2: Relationship Orchestration - USER REQUIRED**
These are fundamentally human activities that require personal touch:

```typescript
tier1Influencers: [
  {
    stakeholderSegment: "Decision makers in target market",
    exampleTargets: [
      {
        name: "John Smith",
        userAction: "LinkedIn message with personalized intro"
      }
    ],
    contentToCreateForThem: [
      {
        contentType: "white-paper",
        signaldeskGenerates: "White paper with citations",
        userExecutes: "Send via LinkedIn with personalized note",  // ← USER ACTION
        timing: "Week 1"
      }
    ],
    touchpointCadence: [
      "Week 1: Send relevant research with no ask",
      "Week 3: Comment value-add on their LinkedIn post",
      "Week 5: Pitch the data story with exclusive angle",
      "Week 7: Share early survey results before public"
    ]
  }
]
```

**User Actions in this Pillar:**
- Direct LinkedIn/email outreach to influencers
- Personalized note writing (can use templates)
- Value-first engagement (sharing research without asking for anything)
- Relationship nurturing (30-60 day cadence)
- Pitch delivery for specific asks

#### **Pillar 3: Event Orchestration - USER REQUIRED**
All event activities require human execution:

```typescript
tier1Events: [
  {
    event: "TechCrunch Disrupt 2024",
    date: "September 2024",
    presenceStrategy: {
      officialParticipation: "Panel proposal",  // ← USER ACTION: Apply for panel
      socialStrategy: "Live-tweet sessions"     // ← USER ACTION: Attend and live-tweet
    }
  }
]
```

**User Actions in this Pillar:**
- Submit speaker/panel proposals
- Attend events in person or virtually
- Actively participate in discussions
- Network with attendees
- Live-tweet key sessions
- Follow up with contacts met at events

#### **Pillar 4: Media Engagement - HYBRID (Some Auto)**
Some are auto-executed, some require user follow-up:

```typescript
journalistNurturing: [
  {
    journalist: "Jane Reporter",
    outlet: "TechNews Daily",
    relationshipStage: "Cold → Warm",
    touchpoints: [
      "Week 1: Send relevant research with no ask",
      // SignalDesk generates the email ↓
      "Week 3: Comment value-add on their LinkedIn post",
      // USER ACTION: Actually go comment on their post ↓
      "Week 5: Pitch the data story with exclusive angle",
      // USER ACTION: Send personalized pitch email ↓
      "Week 7: Share early survey results before public"
      // USER ACTION: Share exclusive data ↓
    ]
  }
]
```

**User Actions in this Pillar:**
- Personalized pitch delivery (despite template)
- LinkedIn engagement on journalist's posts
- Exclusive data sharing
- Interview scheduling and execution
- Follow-up and relationship maintenance

---

## 4. COMPLETE RECOMMENDED ACTION TYPES

Based on the system analysis, here are all recommended user action types:

### **Relationship Building (30% of actions)**
1. **Direct Outreach**
   - Cold LinkedIn message with personalized opener
   - Email introduction via mutual connection
   - Direct phone call (when relationship warm enough)

2. **Value-First Engagement**
   - Share relevant research/article without asking for anything
   - Comment thoughtfully on their recent posts
   - Send curated news digest on their topic of interest

3. **Pitch Delivery**
   - Personalized email pitch for collaboration
   - Executive coffee chat to discuss partnership
   - One-on-one demo or consultation call

### **Event Participation (20% of actions)**
1. **Proposal Submission**
   - Submit speaker proposal to conference
   - Apply for panel participation
   - Request to present at industry meetup

2. **Active Participation**
   - Attend conference in person
   - Live-tweet key sessions
   - Participate in Q&A sessions
   - Network in sponsor booth

3. **Post-Event Follow-up**
   - Connect with contacts on LinkedIn
   - Share event key takeaways
   - Schedule follow-up meetings

### **Community Engagement (25% of actions)**
1. **Thread Participation**
   - Comment on relevant Reddit threads
   - Answer questions on HackerNews
   - Respond to LinkedIn posts in target communities

2. **Content Sharing**
   - Share blog posts in community channels
   - Post articles to relevant Slack communities
   - Cross-post to niche forums

3. **Community Building**
   - Start discussion on relevant topic
   - Moderate Q&A in community groups
   - Co-host webinars with community

### **Direct Engagement (15% of actions)**
1. **Executive Outreach**
   - Schedule coffee chat with decision maker
   - Request executive meeting at conference
   - Invite to exclusive briefing

2. **Analyst Relations**
   - Set up Gartner/Forrester briefing
   - Participate in analyst surveys
   - Join analyst community programs

3. **Partnership Development**
   - Propose joint content initiative
   - Discuss co-marketing opportunity
   - Negotiate integration partnership

### **Content Distribution (10% of actions)**
1. **Influencer Content Creation**
   - Create guest blog post for influencer's publication
   - Record podcast interview
   - Contribute to industry roundtable

2. **Exclusive Content Sharing**
   - Share beta access to product
   - Provide early research data
   - Offer case study participation

---

## 5. HOW USER ACTIONS FIT IN THE BLUEPRINT WORKFLOW

### Execution Inventory Section (BlueprintV3Presentation.tsx, lines 991-1164)

The "Execution Inventory" section shows:

```
Priority 1: Launch Critical
├─ Stakeholder 1
│  ├─ Media Pitches: 3 items (Signaldesk Auto-Execute)
│  ├─ Social Posts: 8 items (Signaldesk Auto-Execute)
│  ├─ Thought Leadership: 2 items (Signaldesk Auto-Execute)
│  └─ User Actions: 5 items (👤 User Must Execute) ← YOUR FOCUS
├─ Stakeholder 2
│  ├─ Media Pitches: 2 items
│  ├─ Social Posts: 5 items
│  ├─ Thought Leadership: 1 item
│  └─ User Actions: 3 items
...
```

This provides a **content summary** view before users drill down into details.

---

## 6. IMPLEMENTATION FOR OPPORTUNITY ENGINE

### Recommended Approach

#### Step 1: Create Similar Data Structure
```typescript
// In your Opportunity intelligence schema
opportunityOrchestration: {
  opportunityActions?: Array<{
    type: string           // "partnership", "outreach", "event", etc.
    who: string           // Person/role executing
    what: string          // Action description
    where: string         // Channel (LinkedIn, email, in-person)
    when: string          // Timing relative to opportunity
    estimatedEffort: string // "2-3 hours"
    priority: number      // 1-4 based on impact
    resources: string[]   // Required materials
    successMetric: string // How to measure completion
  }>
}
```

#### Step 2: Generation Strategy
```
Generate opportunity actions by:
1. Analyzing opportunity stage (Discovery → Negotiation → Closing)
2. Mapping to key stakeholders for that opportunity
3. Recommending human interactions that move the deal forward
4. Distinguishing from auto-execute system actions
5. Providing effort estimates and resource requirements
```

#### Step 3: Frontend Display (Recommended)
```typescript
// Similar to Campaign Builder's "User Must Execute" section
// Show amber/yellow cards for user actions with:
// - Clear action type badge
// - WHO (role executing)
// - WHERE (channel)
// - WHEN (timing)
// - WHAT (description)
// - Estimated effort and resources
// - Success metric
```

#### Step 4: Integration with Workflow
```
1. In Opportunity Summary: Show count of user actions
2. In Execution Planning: Break down by phase/stage
3. In Opportunity Progress: Track completion of user actions
4. In Recommendations: Suggest next user action based on current stage
```

---

## 7. KEY INSIGHTS FOR IMPLEMENTATION

### Critical Success Factors

1. **Clear Separation of Concerns**
   - Explicitly mark what's auto vs. user-executed
   - Use consistent visual language (amber/yellow for user actions)
   - Show effort estimates upfront

2. **Actionable Recommendations**
   - Every user action should have clear WHO, WHAT, WHERE, WHEN
   - Provide templates/scripts for standard actions
   - Include success criteria

3. **Hierarchical Organization**
   - Group actions by stakeholder/phase
   - Show priority levels
   - Enable filtering by effort/impact

4. **Progress Tracking**
   - Allow users to mark actions as complete
   - Track engagement metrics
   - Provide feedback on effectiveness

5. **Resource Support**
   - Generate email templates for outreach
   - Create talking points for calls
   - Provide background research for each contact

---

## 8. REFERENCES

### Source Files
- **Frontend Display**: `/src/components/campaign-builder/BlueprintV3Presentation.tsx` (lines 722-761)
- **Data Structure**: Same file, `BlueprintV3Data` interface
- **Generation**: `/supabase/functions/niv-campaign-orchestration-generator/index.ts`
- **Finalization**: `/supabase/functions/niv-campaign-blueprint-finalize/index.ts`

### Related Components
- `ExecutionInventory` section: BlueprintV3Presentation.tsx (lines 991-1164)
- Execution flow: `CampaignBuilderWizard.tsx` (lines 722-748)
- Memory persistence: Campaign Builder Sessions table

---

## Summary

Campaign Builder's user actions system:
1. **Generates** through specialized orchestration edge functions
2. **Structures** data with type, effort, timing, and resource fields
3. **Presents** with clear visual distinction (amber "User Must Execute" cards)
4. **Organizes** by stakeholder priority and campaign phase
5. **Integrates** with auto-execute content to create multi-channel campaigns

The same pattern can be adapted for Opportunity Engine to recommend strategic human actions that complement automated system activities.
