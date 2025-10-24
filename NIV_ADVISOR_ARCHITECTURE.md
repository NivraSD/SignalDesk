# NIV Advisor Architecture Plan
**Date:** October 23, 2025
**Purpose:** Unified conversational advisor for Command Center that can research, advise, strategize, and execute content generation

---

## 1. Current State Inventory

### A. niv-orchestrator-robust ✅ (RESEARCH & STRATEGY)
**Location:** `/supabase/functions/niv-orchestrator-robust/`

**Capabilities:**
- ✅ **Research via niv-fireplexity** - Direct integration, proven to work
- ✅ **Pattern recognition** - Detects query types:
  - CASCADE campaigns (viral, multi-vector)
  - MIRROR campaigns (crisis prevention, reputation defense)
  - Crisis situations (urgent, breaking, damage control)
  - Competitive analysis
  - Situational awareness
  - Opportunity identification
  - Strategic counsel
- ✅ **Self-orchestration** - Query decomposition, information gap detection
- ✅ **Conversation state management** - Tracks concept development across messages
- ✅ **Organization profile integration** - Loads from mcp-discovery
- ✅ **Strategic framework generation** - Builds campaign concepts

**Identity/Persona:**
- "Former VP of Communications at multiple tech unicorns"
- "Led crisis management for 50+ major incidents"
- Natural conversational style, not robotic
- Thinks like an intelligence analyst when researching

**What Works:**
- Research quality is good (direct niv-fireplexity calls)
- Conversational flow is natural
- Pattern matching is sophisticated

**What's Problematic:**
- Too focused on "strategic frameworks" for every request
- Doesn't know about niv-content-intelligent-v2's 34+ content types
- Doesn't know how to package requests for content generation
- Missing the `campaign_generation` execution pattern

---

### B. niv-content-intelligent-v2 ✅ (CONTENT GENERATION)
**Location:** `/supabase/functions/niv-content-intelligent-v2/`

**Capabilities:**
- ✅ **34+ content types:**
  - Written: Press Release, Blog, Thought Leadership, Case Study, White Paper, eBook, Q&A
  - Social: LinkedIn, Twitter, Instagram, Facebook, general social
  - Email: Campaigns, Newsletters, Drip Sequences, Cold Outreach
  - Executive: Statements, Board Presentations, Investor Updates
  - Crisis: Crisis Response, Apology Statement
  - Media: Pitch, Media List (149+ journalists), Media Kit, Podcast Pitch, TV Prep
  - Strategy: Messaging Framework, Brand Narrative, Value Prop, Competitive Positioning
  - Visual: Images (Vertex AI), Infographics, Social Graphics, Video Scripts

- ✅ **Complex workflows:**
  - Presentations: `create_presentation_outline` → user approval → `generate_presentation` (Gamma)
  - Media Plans: `create_strategy_document` → user approval → `generate_media_plan` (7 pieces)

- ✅ **Campaign generation mode:** Accepts pre-structured campaign context
- ✅ **Acknowledgment mode:** Quick responses

**What Works:**
- Content quality is excellent when given proper context
- Multi-step workflows with user approval work well
- Tool-based architecture is clean

**What's Problematic:**
- **NOT A RESEARCHER** - Returns irrelevant results (American Express credit cards when asked about OpenAI)
- Expects content requests, not open-ended research questions
- Was calling niv-research-intelligent (broken middleman) instead of niv-fireplexity directly
- System prompt is content-creation focused, not advisory

---

### C. Crisis Management ✅ (SPECIALIZED)
**Location:** `/supabase/functions/niv-crisis-advisor/`

**Capabilities:**
- ✅ Directive crisis action guidance
- ✅ References loaded crisis plans
- ✅ Time-sensitive instructions (WHO, WHEN, WHY format)
- ✅ Integrates with team status and social signals

**What Works:**
- Highly specialized, action-oriented
- Good for active crisis management

**Use Case:**
- Should be invoked when niv-orchestrator detects crisis patterns

---

### D. Execution Pattern (from Strategic Planning & Opportunity Engine) ✅
**How they send to content generator:**

```typescript
// Call niv-content-intelligent-v2 with:
{
  stage: 'campaign_generation',
  campaignContext: {
    campaignSummary: {
      organizationName: string,
      industry: string,
      campaignGoal: string,
      positioning: string,
      coreNarrative: string,
      keyMessages: string[]
    },
    phase: string,              // e.g., "Awareness", "Consideration"
    phaseNumber: number,         // 1, 2, 3
    objective: string,           // What this phase aims to achieve
    narrative: string,           // Core narrative for this phase
    keyMessages: string[],       // Messages for this phase
    positioning: string,         // How to position
    targetStakeholders: string[],// Who to reach
    contentRequirements: {
      owned: [{
        type: string,           // "blog-post", "social-post", etc.
        stakeholder: string,    // Who it's for
        purpose: string,        // Why we're creating it
        keyPoints: string[]     // Specific points to cover
      }],
      media: [{
        type: string,
        stakeholder: string,
        purpose: string,
        keyPoints: string[]
      }]
    },
    researchInsights: string[], // Optional research findings
    currentDate: string,
    campaignFolder: string,     // Where to save
    blueprintId: string         // Reference to strategy
  }
}
```

**Key Insight:**
Strategic Planning and Opportunity Engine don't do research themselves - they just package the execution request with all the context niv-content-intelligent-v2 needs.

---

## 2. The Problem

**Current Command Center setup:**
- Calls `niv-content-intelligent-v2` directly
- User asks: "What's happening with Anthropic?"
- niv-content-intelligent-v2 tries to research → returns junk (credit cards, Trump-NATO)
- Claude says "these results don't look relevant"

**Why it fails:**
niv-content-intelligent-v2 is a **CONTENT GENERATOR**, not a **RESEARCH ADVISOR**

**What we need:**
A conversational advisor that can:
1. **Research** - Answer "what's happening with Anthropic?"
2. **Advise** - Discuss strategy, provide counsel
3. **Strategize** - Help develop campaign concepts
4. **Package** - Structure requests correctly for content generation
5. **Execute** - Send to niv-content-intelligent-v2 with proper `campaignContext`

---

## 3. Proposed Solution: NIV Advisor (Unified)

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         Command Center → NIV Advisor                │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  NEW: niv-advisor (Master Orchestrator)             │
│                                                      │
│  Base: niv-orchestrator-robust (proven research)    │
│  + Knowledge of niv-content-intelligent-v2 tools    │
│  + campaign_generation packaging capability         │
│  + Crisis detection → niv-crisis-advisor routing    │
│  - Remove "strategic framework" obsession           │
│                                                      │
│  Modes:                                             │
│  1. Research & Advice (conversational)              │
│  2. Strategy Development (collaborative)            │
│  3. Content Execution (packaged handoff)            │
└─────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
    ┌─────────┐     ┌──────────────────┐    ┌──────────┐
    │ niv-    │     │ niv-content-     │    │ niv-     │
    │ fire-   │     │ intelligent-v2   │    │ crisis-  │
    │ plexity │     │ (generation)     │    │ advisor  │
    └─────────┘     └──────────────────┘    └──────────┘
    (research)      (34+ content types)     (crisis)
```

### Persona & Background

**NIV = 25+ years in corporate communications and public affairs**
- Worked across multinational corporations in technology, healthcare, financial services, consumer goods
- Led communications through every type of crisis: data breaches, product recalls, executive scandals, regulatory investigations
- Launched hundreds of campaigns from grassroots to global scale
- Has the battle scars to know what actually works vs. what looks good in a deck
- Deep knowledge of academic research (Cialdini, Kahneman, Centola) and industry benchmarks (Edelman, PRSA, Cision)
- References real case studies naturally: J&J Tylenol, ALS Ice Bucket, Old Spice, Boeing 737 MAX

### Capabilities

**1. Research & Intelligence** (from niv-orchestrator-robust)
- Direct niv-fireplexity integration for current news/competitive intelligence
- Pattern recognition (crisis, competitive, opportunity, CASCADE, MIRROR, etc.)
- Organization context awareness via mcp-discovery
- Self-orchestration for complex queries

**2. Strategic Consultation** (enhanced from niv-orchestrator-robust)
- Conversational strategy development grounded in proven frameworks
- Help users think through positioning, messaging, timing
- **Tactical knowledge access** - When developing campaign strategies, call knowledge-library-registry for:
  - Relevant case studies (e.g., ALS Ice Bucket for viral campaigns)
  - Academic frameworks (e.g., Centola's 25% tipping point for CASCADE)
  - Proven methodologies (e.g., STEPPS framework for contagious content)
- **Remove automatic framework generation** - only offer when explicitly requested
- Focus on advice grounded in experience, not generic templates

**3. Content Awareness** (NEW)
- Know ALL 34+ content types from niv-content-intelligent-v2
- Understand presentation workflow (outline → approval → Gamma)
- Understand media plan workflow (strategy → approval → generation)
- Guide users to appropriate content types

**4. Execution Packaging** (NEW - from Strategic Planning pattern)
- When user is ready to create content, package the request
- Build proper `campaignContext` object
- Call niv-content-intelligent-v2 with `stage: 'campaign_generation'`
- Handle both single content items and full campaigns

**5. Crisis Routing** (exists, enhance)
- Detect crisis patterns (already has this)
- Route to niv-crisis-advisor when appropriate
- Integrate crisis responses back into conversation

### Conversation Flow Examples

**Example 1: Pure Research**
```
User: "What's happening with Anthropic?"
NIV: [Calls niv-fireplexity]
     "Here's what I found in the last 48 hours:
      - Dario Amodei announced Claude 4 with extended context
      - New partnership with AWS for training infrastructure
      - Series D funding round led by Google

      What would you like to do with this information?"
User: "Just wanted to stay informed"
NIV: "Got it. I'll keep you posted if anything major develops."
```

**Example 2: Research → Strategy → Content**
```
User: "What's happening with Anthropic?"
NIV: [Research, presents findings]
User: "We should respond to their Claude 4 announcement"
NIV: "Good instinct. A few strategic approaches:
     1. Thought leadership on why context windows matter
     2. Customer case study showing our superior results
     3. Competitive positioning blog

     Which direction resonates?"
User: "Let's do #1"
NIV: "Perfect. I can help you create:
     - Blog post (full article, 800-1200 words)
     - LinkedIn article (professional network distribution)
     - Twitter thread (viral-optimized breakdown)
     - White paper (deep technical dive)

     What format works best for your audience?"
User: "Blog post"
NIV: [Packages request with campaignContext]
     [Calls niv-content-intelligent-v2 with stage: 'campaign_generation']
     [Returns generated blog post]
```

**Example 2b: Viral Campaign with Knowledge Library**
```
User: "We need this product launch to go viral"
NIV: [Detects CASCADE pattern]
     [Calls knowledge-library-registry with pattern: 'CASCADE']
     [Receives: STEPPS framework, ALS Ice Bucket case study, Centola's 25% tipping point]

     "Let me ground this in what actually works. The most validated framework
     for viral content is Jonah Berger's STEPPS - Social Currency, Triggers,
     Emotion, Public visibility, Practical value, Stories.

     The ALS Ice Bucket Challenge hit all six, raising $115M in 8 weeks.
     Your launch has emotion and practical value, but we're missing the
     public visibility mechanism - there's no way for people to show they participated.

     Also, research from Damon Centola shows you need 25% of a network to adopt
     before you hit tipping point. That means we need concentrated effort in
     a specific community, not broad scattershot.

     I see three approaches:
     1. Challenge-based (like Ice Bucket - nomination chains)
     2. Badge/Achievement-based (public display of participation)
     3. Creator toolkit (make it easy to remix and share)

     Which feels right for your audience?"
```

**Example 3: Crisis Detection**
```
User: "We just had a major data breach"
NIV: [Detects crisis pattern]
     [Routes to niv-crisis-advisor]
     "This is urgent. First action:
      ACTION: Activate crisis team via emergency protocol
      WHO: You (CEO) and Head of Security
      WHEN: Next 5 minutes
      WHY: Section 2.1 of your crisis plan requires team activation within 15 minutes

      Once team is assembled, I can help you draft:
      - Crisis response statement
      - Internal communication
      - Customer notification
      - Media holding statement"
```

**Example 4: Media Plan**
```
User: "We're launching our new API next month, need a media plan"
NIV: "Let me help you build this out. First, tell me about the API -
     what problem does it solve and who's it for?"
User: [Explains API]
NIV: "Got it. For developer-focused API launches, I typically see three approaches:
     1. Technical community first (HackerNews, Reddit, dev newsletters)
     2. Enterprise media (TechCrunch, VentureBeat for business angle)
     3. Hybrid (seed technical, harvest business press)

     Given your target (enterprise developers), I'd recommend #3.

     Here's a strategy structure:
     [Creates strategy document with timeline, media targets, key messages]

     Does this look right?"
User: "Yes, let's do it"
NIV: [Calls niv-content-intelligent-v2 with full media plan generation]
     [Returns 7 pieces: press release, media pitch, media list, Q&A, social posts, etc.]
```

---

## 4. Implementation Plan

### Phase 1: Create niv-advisor base (2-3 hours)
1. Copy niv-orchestrator-robust → niv-advisor
2. Keep all research capabilities (niv-fireplexity integration)
3. Keep pattern recognition (CASCADE, MIRROR, CHORUS, TROJAN, crisis, competitive, etc.)
4. Keep conversation state management
5. **Keep knowledge-library-registry integration** (already exists in niv-orchestrator-robust)
6. **Remove strategic framework auto-generation logic** - make it conversational, not automatic

### Phase 2: Update persona & knowledge usage (1-2 hours)
1. Update system prompt with 25-year corporate comms background
2. Add knowledge of Tier 1 frameworks (Cialdini, Kahneman, Centola, STEPPS, etc.)
3. Add familiarity with case studies (J&J Tylenol, ALS Ice Bucket, Boeing 737 MAX, etc.)
4. Update knowledge-library-registry calls to be tactical:
   - Call when user wants to develop campaign strategy (CASCADE, MIRROR, viral, crisis prevention)
   - Use results to ground advice in proven frameworks
   - Reference naturally in conversation, not academically

### Phase 3: Add content awareness (2-3 hours)
1. Import niv-content-intelligent-v2 system prompt knowledge
2. Add awareness of all 34+ content types (no tool definitions needed - just knowledge)
3. Update advisor personality to include content expertise
4. Add logic to suggest appropriate content types based on user goals

### Phase 4: Add execution packaging (2-3 hours)
1. Add `package_for_generation` internal function
2. Build `campaignContext` objects from conversation state
3. Add decision logic: when to package vs. continue advising
4. Implement handoff to niv-content-intelligent-v2 with `stage: 'campaign_generation'`
5. Handle both single content pieces and full campaign generation

### Phase 5: Update Command Center integration (1 hour)
1. Change `/src/app/api/niv-orchestrator/route.ts` to call `niv-advisor` instead of `niv-content-intelligent-v2`
2. Keep acknowledgment mode (two-step: acknowledge → full response)
3. Test full flow

### Phase 6: Crisis integration (1 hour)
1. When crisis pattern detected, offer to route to niv-crisis-advisor
2. Present directive actions from crisis advisor
3. Integrate back into conversation for content generation if needed

### Phase 7: Testing & refinement (2-3 hours)
1. Test research queries (e.g., "What's happening with Anthropic?")
2. Test content requests (single pieces like blog posts)
3. Test complex workflows (presentations, media plans)
4. Test campaign strategy with knowledge library (viral, CASCADE, crisis prevention)
5. Test crisis scenarios
6. Refine prompts based on results

---

## 5. Tactical Knowledge Library Usage

### When to Call knowledge-library-registry

**DO call when:**
✅ User wants to develop a campaign strategy (CASCADE, MIRROR, viral, etc.)
✅ User asks for crisis prevention or reputation defense approach
✅ User needs help designing a grassroots or movement-building campaign
✅ Discussing launch strategy and need proven frameworks
✅ Building competitive positioning and want case study reference

**DON'T call when:**
❌ Simple research question ("What's happening with Anthropic?") → Use niv-fireplexity
❌ Single content piece request ("Write a blog post") → Just execute
❌ User just wants advice on timing/messaging → Give advice from experience
❌ Casual conversation about strategy → Have the conversation first

### Pattern-Based Triggers

From niv-orchestrator-robust, knowledge library is called when these patterns detected:

```typescript
// CASCADE campaigns - viral, multi-vector, grassroots
Pattern: /cascade|viral|seed.*planting|multi.*vector|tipping.*point|grassroots/i
Knowledge: CASCADE case studies, STEPPS framework, tipping point research
Narration: "Let me ground this in proven CASCADE research..."

// MIRROR campaigns - crisis prevention, reputation defense
Pattern: /mirror|crisis.*prevention|pre.*position|inoculation|reputation.*defense/i
Knowledge: MIRROR frameworks, crisis case studies, inoculation theory
Narration: "Accessing crisis prevention frameworks..."
```

### How to Use the Knowledge

**Pattern (from vector campaigns):**
1. Detect strategy development intent
2. Call knowledge-library-registry with pattern (CASCADE, MIRROR, etc.)
3. Receive: academic frameworks, case studies, proven methodologies
4. **Don't dump research on user** - synthesize it into conversational advice
5. Reference frameworks naturally: "Berger's STEPPS framework shows..."
6. Cite case studies as proof points: "The ALS Ice Bucket Challenge raised $115M because..."
7. Ground recommendations in research: "Centola's work shows you need 25% adoption..."

**Example API call:**
```typescript
await fetch('knowledge-library-registry', {
  body: {
    pattern: 'CASCADE',  // or MIRROR, CHORUS, etc.
    priority_filter: 'critical'  // Get the most important research
  }
})

// Returns:
{
  foundational: [STEPPS, Centola tipping point, etc.],
  pattern_specific: [ALS Ice Bucket case, Old Spice case, etc.],
  tools: [Gephi for network analysis, etc.]
}
```

**How NIV uses it:**
- Reads the frameworks and case studies
- Synthesizes into 2-3 strategic approaches grounded in research
- References naturally: "Research shows...", "The Ice Bucket Challenge succeeded because..."
- Uses to validate or challenge user's initial ideas
- Not academic - conversational and practical

---

## 6. Key Design Principles

### DO:
✅ Be conversational and consultative
✅ Research when needed (niv-fireplexity)
✅ Help users think through strategy
✅ Suggest appropriate content types
✅ Package execution requests properly
✅ Know when to hand off to content generator
✅ Maintain conversation context across messages

### DON'T:
❌ Force "strategic frameworks" on every request
❌ Generate content yourself (hand to niv-content-intelligent-v2)
❌ Try to research using niv-research-intelligent (broken middleman)
❌ Return junk research results (we fixed this - use niv-fireplexity directly)
❌ Be robotic or formulaic

---

## 7. System Prompt Structure (High-Level)

```
You are NIV, a Senior Strategic Communications Advisor with 25+ years of experience.

YOUR BACKGROUND:
- Corporate communications and public affairs across multinational corporations
- Sectors: Technology, healthcare, financial services, consumer goods
- Led communications through every type of crisis: data breaches, product recalls,
  executive scandals, regulatory investigations
- Launched hundreds of campaigns from grassroots to global scale
- Deep knowledge of academic research: Cialdini's influence principles, Kahneman's
  cognitive biases, Centola's 25% tipping point, Berger's STEPPS framework
- Industry benchmarks: Edelman Trust Barometer, PRSA standards, Cision journalist insights
- Real-world case studies: J&J Tylenol crisis (gold standard response), ALS Ice Bucket
  Challenge (viral success), Boeing 737 MAX (complex crisis recovery)

YOUR CAPABILITIES:
1. Research & Intelligence (via niv-fireplexity)
2. Strategic Consultation (help users think through positioning, messaging, timing)
3. Content Expertise (know all 34+ types, guide users to right formats)
4. Execution Packaging (structure requests for content generation)
5. Crisis Management (detect and route to specialized crisis advisor)

CONVERSATION MODES:

RESEARCH MODE:
- User asks about news, competitors, market trends
- Call niv-fireplexity for current information
- Present findings clearly
- Ask what they want to do with the information

ADVISORY MODE:
- User is thinking through strategy
- Help them explore options, grounded in proven frameworks when relevant
- **Tactical knowledge access:** When developing campaign strategies (CASCADE, MIRROR, viral, etc.),
  call knowledge-library-registry for relevant case studies and frameworks
- Synthesize research into 2-3 concrete approaches
- Reference naturally: "Berger's STEPPS framework shows...", "The Ice Bucket Challenge succeeded because..."
- Don't force frameworks - have a conversation
- Guide toward clarity on goals, audience, messaging

CONTENT MODE:
- User is ready to create something
- Suggest appropriate formats from 34+ types
- For simple requests: package and send to niv-content-intelligent-v2
- For complex (presentations, media plans): follow multi-step workflow

CRISIS MODE:
- Detect urgent/crisis patterns
- Route to niv-crisis-advisor for directive action
- Integrate response back into conversation

AVAILABLE CONTENT TYPES:
[Full list of 34+ types]

EXECUTION PATTERN:
When user is ready to generate content:
1. Build campaignContext from conversation
2. Call niv-content-intelligent-v2 with stage: 'campaign_generation'
3. Return results to user

CRISIS ROUTING:
When crisis detected:
1. Call niv-crisis-advisor with crisis details
2. Present directive actions
3. Offer to generate crisis content (statements, FAQs, etc.)
```

---

## 7. Success Criteria

**Research Queries:**
- ✅ "What's happening with Anthropic?" → Returns relevant, current news
- ✅ "Latest news on AI regulation" → Returns quality results
- ✅ No more credit card or irrelevant junk results

**Advisory Queries:**
- ✅ "Should we respond to competitor's launch?" → Thoughtful strategic counsel
- ✅ "How should we position our new feature?" → Explores options, doesn't force frameworks

**Content Execution:**
- ✅ "Create a blog post about our API" → Packages properly, generates quality content
- ✅ "I need a media plan for product launch" → Multi-step workflow with user approval
- ✅ "Make a presentation on our Q4 results" → Outline → approval → Gamma generation

**Crisis Handling:**
- ✅ "We just had a data breach" → Routes to crisis advisor, gets directive actions
- ✅ Offers to generate crisis content after immediate actions

**Conversation Quality:**
- ✅ Maintains context across messages
- ✅ Natural, consultative tone
- ✅ Knows when to research vs. advise vs. execute
- ✅ Doesn't repeat itself or ask redundant questions

---

## 8. Next Steps

1. **Review this plan** - Does this match your vision?
2. **Prioritize phases** - Which parts are most critical?
3. **Start implementation** - Begin with Phase 1 (base advisor)
4. **Iterate** - Test and refine based on real usage

---

## 9. Open Questions

1. Should NIV Advisor have access to Memory Vault for pulling past campaigns/content?
2. Should it integrate with SignalDeck for competitive positioning intelligence?
3. ~~How much "personality" do we want?~~ **RESOLVED:** 25-year veteran across multiple sectors, conversational and practical
4. Should it proactively monitor for opportunities like the Opportunity Engine does?
5. What's the handoff pattern for long-running content generation (progress updates)?
6. ~~Should knowledge library be used, and if so, how?~~ **RESOLVED:** Yes, tactically when developing campaign strategies (Option 1: On-demand)

---

**Status:** Ready for review and approval
**Next Action:** Get user feedback, then start Phase 1
