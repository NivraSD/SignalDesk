# NIV Command Center Vision

**Date:** 2025-10-14
**Purpose:** Transform NIV from a floating chatbot into a unified Command Center for the SignalDesk platform

---

## The Problem

**Current State Issues:**
- Empty canvas on launch = no clear starting point
- NIV identity crisis (trying to be everything, essential to nothing)
- Tabs are independent (good!) but no orchestration layer
- No "home base" to understand what needs attention
- Users forget context between sessions

**Root Cause:** NIV is positioned as "just another component" when it should be the platform's nervous system.

---

## The Solution: NIV Command Center

**Core Concept:** NIV becomes Mission Control - a unified dashboard that:
1. Shows what matters NOW (urgent opportunities, trending threats, active campaigns)
2. Suggests what to do NEXT (context-aware action prompts)
3. Routes you to the RIGHT TAB (with pre-loaded context)
4. Provides STRATEGIC THINKING (advisor mode via chat)

**Identity:** NIV = Strategic Advisor + Smart Router + System Overview

---

## Command Center Layout

```
┌──────────────────── COMMAND CENTER ─────────────────────┐
│                                                          │
│  📊 Daily Intelligence Brief   ⚡ Live Activity Feed     │
│  ┌────────────────────┐        ┌──────────────────────┐ │
│  │ 🔥 URGENT (Next 24h)│        │ 2m ago: New opp      │ │
│  │ ├─ 2 opportunities  │        │   Oracle vulnerability│ │
│  │ └─ 1 expiring soon  │        │                      │ │
│  │                     │        │ 5m ago: Intel done   │ │
│  │ 📈 TRENDING         │        │   12 articles, 3     │ │
│  │ ├─ AI Safety +23%  │        │   threats found      │ │
│  │ └─ 3 journalists   │        │                      │ │
│  │    asking questions │        │ 12m ago: Journalist  │ │
│  │                     │        │   WSJ enterprise     │ │
│  │ 💡 OPPORTUNITIES    │        │   strategy           │ │
│  │ ├─ 8 active         │        │                      │ │
│  │ ├─ High urgency: 2 │        │ 1h ago: Campaign     │ │
│  │ └─ [View All]       │        │   Infrastructure Day2│ │
│  │                     │        │   3/5 pieces live    │ │
│  │ 🎯 ACTIVE CAMPAIGNS │        └──────────────────────┘ │
│  │ ├─ 3 campaigns      │                                 │
│  │ ├─ "Infrastructure" │                                 │
│  │ │   Day 2 of 7      │                                 │
│  │ └─ [View All]       │                                 │
│  │                     │                                 │
│  │ ⚠️ MONITORING       │                                 │
│  │ ├─ No crisis alerts │                                 │
│  │ └─ Sentiment: 72%   │                                 │
│  │    positive (↑3%)   │                                 │
│  └────────────────────┘                                 │
│                                                          │
│  🚀 Suggested Actions                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ → Respond to Oracle story                        │   │
│  │   High-value competitive opportunity (Score: 88) │   │
│  │   [Start Strategic Planning]                     │   │
│  │                                                   │   │
│  │ → Review pending opportunities                   │   │
│  │   2 opportunities expire in 18 hours             │   │
│  │   [Open Opportunities Tab]                       │   │
│  │                                                   │   │
│  │ → Continue Q4 Product Launch campaign            │   │
│  │   Research complete, ready for blueprint phase   │   │
│  │   [Resume Campaign Builder]                      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  💬 NIV Strategic Advisor                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [Conversation History]                            │   │
│  │                                                   │   │
│  │ NIV: I analyzed the Oracle story. Strategic take:│   │
│  │      OPPORTUNITY: Oracle over-extended           │   │
│  │      RISK: Looks defensive if too aggressive     │   │
│  │      RECOMMENDATION: Position as infra leader    │   │
│  │                                                   │   │
│  │      Ready to build a campaign?                  │   │
│  │      [Yes, open Campaign Builder]  [Just draft]  │   │
│  │                                                   │   │
│  │ Ask NIV: _______________________________ [Send]  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  📊 Platform Analytics (collapsible)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │ This Week:                                        │   │
│  │ • Opportunities Detected: 23 (↑8)                │   │
│  │ • Campaigns Active: 3                            │   │
│  │ • Content Generated: 18 pieces                   │   │
│  │ • Intelligence Scans: 47                         │   │
│  │ • Avg Response Time: 4.2 hours                   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Daily Intelligence Brief
**Purpose:** One glance shows everything that needs attention

**Sections:**
- 🔥 **URGENT** (Next 24 hours)
  - High-priority opportunities
  - Expiring windows
  - Crisis alerts

- 📈 **TRENDING**
  - Narrative momentum shifts
  - Journalist inquiries
  - Competitive movements

- 💡 **OPPORTUNITIES**
  - Active count
  - Urgency breakdown
  - Quick link to Opportunities tab

- 🎯 **ACTIVE CAMPAIGNS**
  - In-progress campaigns
  - Phase/day status
  - Quick link to Campaign tab

- ⚠️ **MONITORING**
  - Crisis indicators
  - Sentiment tracking
  - Risk alerts

**Data Sources:**
- Opportunities table (real-time)
- Intelligence pipeline results
- Campaign status
- Real-time monitoring feeds

---

### 2. Live Activity Feed
**Purpose:** Never miss what just happened

**Shows:**
- New opportunities detected (with score)
- Intelligence scans completed
- Journalist inquiries logged
- Campaign milestones reached
- Content published
- Crisis alerts triggered

**Implementation:**
- Real-time updates (polling or websocket)
- Last 10-20 events
- Click to view details
- Filterable by type

---

### 3. Suggested Actions
**Purpose:** NIV tells you what to do next based on context

**How it works:**
- Analyzes current state (opportunities, campaigns, intelligence)
- Identifies high-priority actions
- Presents 3-5 recommended next steps
- Each action has a clear CTA button

**Example Actions:**
```
┌─ Action 1 ────────────────────────┐
│ Respond to Oracle story           │
│ High-value competitive opp (88)   │
│ [Start Strategic Planning]        │
└───────────────────────────────────┘

┌─ Action 2 ────────────────────────┐
│ Review pending opportunities      │
│ 2 expire in 18 hours              │
│ [Open Opportunities]              │
└───────────────────────────────────┘

┌─ Action 3 ────────────────────────┐
│ Continue Q4 campaign              │
│ Research complete, ready for      │
│ blueprint phase                   │
│ [Resume Campaign Builder]         │
└───────────────────────────────────┘
```

**Smart Detection:**
- Incomplete workflows (campaign in research phase)
- Time-sensitive opportunities
- Recommended follow-ups
- Strategic moments

---

### 4. NIV Chat Integration
**Purpose:** Strategic advisor embedded in command center

**Features:**
- Conversation history
- Context-aware (knows about opportunities, campaigns, intel)
- Can route to other tabs with pre-loaded context
- Asks clarifying questions
- Presents strategic tradeoffs

**Example Interaction:**
```
You: "Should we respond to the Oracle story?"

NIV: "Let me think through this strategically:

     OPPORTUNITY:
     - Oracle is over-extended ($5.9B in debt)
     - Creates infrastructure leader positioning
     - 88 confidence score, 24-48hr window

     RISKS:
     - Could look defensive/reactive
     - Might draw attention to dependency

     RECOMMENDATION:
     Focus on "OpenAI as catalyst" angle rather
     than "Oracle vulnerability" angle. Position
     as infrastructure transformation story.

     Want me to open Campaign Builder with this
     framework pre-loaded?"

You: "Yes"

NIV: [Opens Campaign tab with]:
     - Oracle intelligence summary
     - Infrastructure leader messaging framework
     - Suggested campaign structure
     - Related opportunities linked

     "I'll stay here if you need to workshop
     the messaging. Call me anytime."
```

**Key Behaviors:**
- ✅ Asks strategic questions ("Why?", "What's the risk?")
- ✅ Presents options with tradeoffs
- ✅ Routes to appropriate tab with context
- ✅ Doesn't execute (tabs do deep work)
- ✅ Remains accessible throughout

---

### 5. Platform Analytics (Optional)
**Purpose:** Quick performance snapshot

**Metrics:**
- Opportunities detected (trend)
- Campaigns active
- Content pieces generated
- Intelligence scans run
- Average response time
- Success rate metrics

**Visualization:**
- Simple bar charts or sparklines
- Week-over-week trends
- Collapsible to save space

---

## User Journeys

### Journey 1: Morning Briefing
```
9:00 AM - User opens SignalDesk

1. Command Center loads (default home)
2. Daily Brief shows:
   - 🔥 2 urgent opportunities
   - 📈 3 competitive threats overnight
   - 🎯 3 active campaigns

3. Suggested Actions highlights:
   - "Respond to Oracle story" (top priority)

4. User clicks: "Start Strategic Planning"

5. NIV responds in chat:
   "I analyzed the Oracle/OpenAI story. Here's
   my strategic take: [analysis]. Ready to build
   a campaign around this?"

6. User: "Yes"

7. NIV opens Campaign Builder with:
   - Pre-loaded intelligence
   - Suggested framework
   - Opportunity linked
```

**Time to action:** < 1 minute
**Friction removed:** No hunting, no context-switching

---

### Journey 2: Continuing Work
```
2:00 PM - User returns to SignalDesk

1. Command Center shows:
   - "Continue Q4 campaign" in Suggested Actions
   - Research phase completed 1 hour ago

2. User clicks: "Resume Campaign Builder"

3. Opens directly to Blueprint phase with:
   - All research data loaded
   - Next step clearly marked
   - NIV available for questions

4. User works in Campaign Builder

5. Needs strategic input on positioning

6. Opens NIV chat (still visible)

7. NIV: "Based on your research, I see three
   positioning options: [presents tradeoffs]"
```

**Workflow continuity:** Seamless
**Context preserved:** Complete

---

### Journey 3: Reactive Response
```
Live Activity Feed shows:
"2m ago: New opportunity - Competitor vulnerability"

1. User notices in Live Feed

2. Clicks on notification

3. Opens opportunity detail

4. NIV automatically appears:
   "This is a high-value competitive window.
   Three strategic approaches: [presents options]

   Which direction interests you?"

5. User selects approach

6. NIV: "Smart. I'll set up a Crisis response
   campaign in Execute tab with:
   - Counter-narrative framework
   - 3 competitor weaknesses
   - Recommended channels

   [Opens Execute tab with everything loaded]"
```

**Response time:** Minutes, not hours
**Decision quality:** Strategic, not reactive

---

## Technical Architecture

### Component Structure

```
src/components/command-center/
├── CommandCenter.tsx          # Main container
├── DailyBrief.tsx            # Intelligence brief widget
├── LiveActivityFeed.tsx       # Real-time activity
├── SuggestedActions.tsx       # Smart action prompts
├── NivChatIntegrated.tsx      # Embedded chat
├── PlatformAnalytics.tsx      # Metrics dashboard
└── widgets/
    ├── OpportunitiesWidget.tsx
    ├── CampaignsWidget.tsx
    ├── MonitoringWidget.tsx
    └── TrendingWidget.tsx
```

### Data Flow

```
┌─────────────────────────────────────────────┐
│             Command Center                  │
│  (Aggregates from all sources)              │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
    ┌───────┐ ┌────────┐ ┌──────────┐
    │Opps DB│ │Intel   │ │Campaigns │
    └───────┘ │Pipeline│ └──────────┘
              └────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
    ┌───────┐ ┌─────┐  ┌──────┐
    │Monitor│ │MemVlt│  │Execute│
    └───────┘ └─────┘  └──────┘
```

**All modules feed Command Center:**
- Opportunities: Active opps, urgency, scores
- Intelligence: Threats, trends, journalist activity
- Campaigns: Status, phase, next actions
- Monitor: Crisis alerts, sentiment
- MemoryVault: Historical context
- Execute: Content status, publishing

**Command Center feeds NIV:**
- Full context awareness
- Smart action suggestions
- Routing with pre-loaded data

**NIV routes to modules:**
- Opens tab with context
- Pre-populates forms/data
- Maintains availability

---

### API Integration

```typescript
// Command Center fetches aggregated data
GET /api/command-center/brief
→ Returns: {
    urgent: [...opportunities],
    trending: [...trends],
    campaigns: [...activeCampaigns],
    monitoring: {...alerts}
  }

// Live activity feed
GET /api/command-center/activity
→ Returns: [
    { type: 'opportunity', ...data },
    { type: 'intel_complete', ...data },
    { type: 'journalist_inquiry', ...data }
  ]

// Suggested actions (AI-powered)
GET /api/command-center/suggestions
→ Returns: [
    {
      title: "Respond to Oracle story",
      priority: "high",
      action: "open_campaign_builder",
      context: {...preloadedData}
    }
  ]
```

---

### State Management

```typescript
// Global state hook
useCommandCenter() {
  const brief = useDailyBrief()        // Daily intelligence
  const activity = useActivityFeed()    // Live events
  const suggestions = useSuggestions()  // AI suggestions
  const nivSession = useNivChat()       // Chat state

  return {
    brief,
    activity,
    suggestions,
    nivSession,
    refreshAll: () => {...}
  }
}
```

---

## Implementation Phases

### Phase 1: Basic Command Center (Week 1)
**Goal:** Launch functional home base

**Tasks:**
- [ ] Create CommandCenter.tsx component
- [ ] Build DailyBrief widget
  - [ ] Opportunities section
  - [ ] Campaigns section
  - [ ] Monitoring section
- [ ] Embed NivChatbot (move from floating to integrated)
- [ ] Add "Home" button to navigation
- [ ] Set Command Center as default route

**MVP Features:**
- Static daily brief (no real-time updates yet)
- Basic NIV chat embedded
- Manual refresh button
- Links to other tabs

---

### Phase 2: Intelligence Integration (Week 2)
**Goal:** Real data feeding command center

**Tasks:**
- [ ] Create /api/command-center/brief endpoint
- [ ] Integrate opportunities query
- [ ] Integrate campaigns status
- [ ] Add live activity feed component
- [ ] Implement auto-refresh (30s polling)
- [ ] Add sentiment monitoring widget

**Features:**
- Real opportunities shown
- Real campaigns status
- Live activity updates
- Auto-refresh every 30 seconds

---

### Phase 3: Smart Suggestions (Week 3)
**Goal:** AI-powered action recommendations

**Tasks:**
- [ ] Create SuggestedActions component
- [ ] Build suggestion algorithm:
  - [ ] Detect incomplete workflows
  - [ ] Prioritize by urgency/score
  - [ ] Generate contextual CTAs
- [ ] Implement routing with context
- [ ] Add workflow continuity tracking

**Features:**
- 3-5 smart action suggestions
- One-click to appropriate tab
- Pre-loaded context on navigation
- Workflow state persistence

---

### Phase 4: Advanced Features (Week 4+)
**Goal:** Polish and advanced capabilities

**Tasks:**
- [ ] Platform analytics dashboard
- [ ] Websocket for real-time updates
- [ ] NIV context-aware prompts
- [ ] Customizable widget layout
- [ ] Notification preferences
- [ ] Historical brief archive

**Features:**
- Real-time updates (no polling)
- Analytics visualizations
- Customizable dashboard
- NIV gets smarter over time

---

## Success Metrics

### User Engagement
- **Time to first action:** < 1 minute (from login to starting work)
- **Command Center usage:** 80%+ of users start here
- **NIV chat engagement:** 60%+ of sessions interact with NIV
- **Workflow completion:** 50% higher completion rate

### System Performance
- **Brief load time:** < 2 seconds
- **Activity feed latency:** < 5 seconds
- **Suggestion accuracy:** 70%+ accepted/clicked
- **Context preservation:** 95%+ successful handoffs

### Business Value
- **Response time:** 50% faster opportunity response
- **Decision quality:** Strategic thinking before execution
- **Platform stickiness:** Daily active usage increases
- **User satisfaction:** "I know what to do next"

---

## Key Principles

### 1. Command Center = Home
- Opens automatically on launch
- Always accessible via "Home" button
- Can minimize but never closes
- Other tabs are "deep work modes"

### 2. NIV Lives Here
- Not a floating chatbot anymore
- Embedded in command center
- Context-aware of all modules
- Routes with intelligence

### 3. Glanceable Intelligence
- Daily brief = 5-second scan
- Live activity = know what just happened
- Suggested actions = know what to do next
- No hunting, no wondering

### 4. Strategic Before Tactical
- NIV asks "why?" before "how?"
- Presents tradeoffs, not just options
- Routes to execution after thinking
- Maintains strategic context

### 5. Workflow Continuity
- System remembers what you were doing
- Suggested actions include "continue" tasks
- Context preserved across sessions
- No starting from scratch

---

## Design Philosophy

### Visual Language
- **Clean & Scannable:** Grid layout, clear sections
- **Status Colors:** Red (urgent), Yellow (trending), Green (healthy)
- **Action-Oriented:** Every item has a clear CTA
- **Contextual Depth:** Summary → Detail on click

### Information Hierarchy
```
Level 1: At-a-glance metrics (Daily Brief)
Level 2: Suggested next actions
Level 3: NIV strategic discussion
Level 4: Live activity feed
Level 5: Detailed analytics (collapsible)
```

### Interaction Patterns
- **Click metric → Open detail**
- **Click suggested action → Route to tab**
- **Ask NIV → Get strategic guidance**
- **NIV recommends → One-click execute**

---

## Migration from Current State

### What Changes
- ❌ **Remove:** Floating NIV chatbot
- ✅ **Add:** Command Center as default home
- ✅ **Move:** NIV chat into command center
- ✅ **Keep:** All existing tabs (Intelligence, Opportunities, etc.)

### What Stays the Same
- ✅ All tabs work independently
- ✅ Canvas system for multiple windows
- ✅ NIV orchestrator backend
- ✅ Data models and APIs

### Migration Path
1. Build Command Center alongside existing UI
2. Add "Home" tab to navigation
3. Make Command Center optional first
4. Gather feedback
5. Set as default home
6. Remove floating chatbot

---

## Questions & Decisions

### To Decide:
- [ ] Should Command Center be dismissible or always-on?
- [ ] Real-time updates via websocket or polling?
- [ ] Should analytics be always visible or collapsible?
- [ ] How much NIV chat history to show (last 5 messages? 10?)
- [ ] Should users be able to customize widget layout?

### To Validate:
- [ ] Are 3-5 suggested actions enough or too few?
- [ ] Should Live Activity show all events or be filterable?
- [ ] Does embedding NIV chat feel natural or cluttered?
- [ ] Should Command Center replace the current home page entirely?

---

## Conclusion

**The Vision:** Transform NIV from a floating chatbot into the brain of the platform - a Command Center that shows you what matters, tells you what to do, helps you think strategically, and routes you to the right tool with the right context.

**The Impact:** Users open SignalDesk and immediately know:
1. What needs their attention
2. What to do next
3. How to think about it strategically
4. Where to execute it efficiently

**The Result:** SignalDesk becomes not just a collection of tools, but an intelligent system that actively helps users succeed.

---

**Next Steps:**
1. Review this vision doc
2. Approve/modify the approach
3. Start Phase 1 implementation
4. Build basic Command Center
5. Test with real data
6. Iterate based on usage
