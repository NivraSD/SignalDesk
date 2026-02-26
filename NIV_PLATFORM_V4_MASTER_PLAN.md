# NIV Platform V4 - Master Implementation Plan

**Objective:** Unify NIV into a single intelligent advisor that orchestrates total-spectrum communications campaigns and routes users to specialized tools with complete context.

---

## Executive Summary

### The Problem
- **Fragmented NIV instances**: Separate NIV for Intelligence Hub, Crisis Consultant, Strategy - confusing for users
- **Linear PR thinking**: Current Campaign Planner automates traditional PR (press releases, social posts)
- **No total-spectrum orchestration**: Missing CASCADE, VOID, MIRROR, TROJAN, NETWORK patterns
- **Lost context**: Tools don't talk to each other; users re-explain objectives multiple times

### The Solution: Two Major Upgrades

**1. Unified NIV Advisor (Platform-Level)**
- Single persistent chat accessible everywhere
- Uses orchestrator-robust backend (proven to work)
- Routes users to specialized tools with full context packages
- Extends tool access: knowledge-library-registry, niv-campaign-orchestrator, crisis tools

**2. Campaign Orchestrator V4 (Total-Spectrum Communications)**
- Replaces linear "press release + social" approach
- Implements multi-vector influence: different messages to different stakeholders that converge
- Grounds campaigns in academic research (Knowledge Library)
- Plans CASCADE seed planting, VOID strategic silence, MIRROR pre-positioning, etc.

---

## Part 1: Unified NIV Platform Architecture

### Current State (Fragmented)
```
Intelligence Hub → NIV (research/strategy)
Crisis Command Center → NIV Crisis Consultant (separate edge function)
Strategic Campaign Planner → Direct Claude API (no NIV)
Execute → NIV Content Intelligent V2 (separate instance)
```

### New State (Unified)
```
┌────────────────────────────────────────┐
│   NIV (Single Persistent Advisor)     │
│   Powered by: niv-orchestrator-robust  │
│                                        │
│   Capabilities:                        │
│   - Research & Discovery               │
│   - Narrative Analysis                 │
│   - Campaign Strategy                  │
│   - Crisis Assessment (advice only)    │
│   - Knowledge Base Access              │
└──────────────┬─────────────────────────┘
               │
               │ Routes Users With Context To:
               │
               ├──► Campaign Planner (with discovery context)
               ├──► Execute Tab (with content strategy)
               └──► Crisis Command Center (with assessment)
```

### What Gets Removed
- ❌ Separate NIV Crisis Consultant edge function
- ❌ Intelligence Hub NIV integration (redundant)
- ❌ Direct Claude API calls from Campaign Planner

### What Gets Extended
**niv-orchestrator-robust** (keep existing logic, add tools):

**Current Tools:**
- ✅ mcp-discovery
- ✅ niv-fireplexity
- ✅ journalist-registry
- ✅ Tool awareness

**Add These Tools:**
- ➕ knowledge-library-registry (CASCADE/MIRROR/etc research)
- ➕ niv-campaign-orchestrator (campaign blueprint generation)
- ➕ mcp-crisis (crisis detection)
- ➕ niv-crisis-consultant (crisis assessment - for advice only)

### New: Structured Output Format

**Problem:** orchestrator-robust only returns text - no way to trigger UI actions

**Solution:** Add action types to response:

```typescript
interface NIVResponse {
  response: string  // Conversational text (existing)
  action?: {        // NEW: Structured action data
    type: 'campaign_ready' | 'content_ready' | 'crisis_detected' | 'research_complete'
    data: any       // Context package for next tool
    ui_prompt: string  // Button text or user instruction
  }
}
```

**Example Outputs:**

**1. Campaign Ready**
```json
{
  "response": "Based on my research, I recommend a CASCADE campaign. I've identified narrative voids in AI education, found 5 stakeholder groups to target, and mapped convergence opportunities. Ready to build the campaign?",
  "action": {
    "type": "campaign_ready",
    "data": {
      "pattern": "CASCADE",
      "discoveryContext": {...},
      "research": {...},
      "narrativeOpportunities": [...],
      "stakeholderGroups": [...],
      "knowledgeBase": [relevant research items]
    },
    "ui_prompt": "Open Campaign Planner"
  }
}
```

**2. Content Strategy Ready**
```json
{
  "response": "I've prepared a content strategy for your thought leadership series. I've researched your competitive landscape, identified unique angles, and structured 5 pieces that build on each other.",
  "action": {
    "type": "content_ready",
    "data": {
      "contentStrategy": {...},
      "research": {...},
      "framework": {...}
    },
    "ui_prompt": "Generate Content"
  }
}
```

**3. Crisis Detected**
```json
{
  "response": "**CRISIS DETECTED**\n\nSeverity: High\nType: Data breach with media attention\nRecommended Pattern: MIRROR (pre-position as transparent)\n\n**You need Crisis Command Center for crisis management tools.** I can continue advising you, but execution happens there.\n\nWhat specific advice do you need right now?",
  "action": {
    "type": "crisis_detected",
    "severity": "high",
    "ui_prompt": "Go to Crisis Command Center"
  }
}
```

**4. Research Complete (No Special Action)**
```json
{
  "response": "Here's what I found about your competitors...",
  "action": null  // Just conversation, no handoff
}
```

---

## Part 2: Campaign Orchestrator V4 (Total-Spectrum Communications)

### Philosophy Shift (from STRATEGY_UPDATE.MD)

**Traditional PR (What We're NOT Doing):**
- Detect opportunity → Create content → Distribute → Hope
- One message to many channels
- Direct messaging: "Company X is innovative"
- Compete in crowded channels

**Total-Spectrum Communications (What V4 Does):**
- **Multiple simultaneous influence vectors** - Different messages to different stakeholders that converge
- **Indirect influence** - Engineer discovery, not announcements ("I discovered Company X is innovative")
- **Narrative voids** - Own conversations before they explode
- **Network-level thinking** - Target influencers of influencers
- **Orchestrate system states** - Create conditions where narrative becomes inevitable

### The Five Core Patterns

**1. CASCADE**
Plant 15-20 unconnected seeds across:
- Academics (fund research, sponsor papers)
- Niche communities (unbranded discussions)
- Adjacent industries (case studies, tools)
- Investors (market disruption narrative)
- Culture (art, education, social impact)

→ Pattern emerges → Convergence → Product becomes answer to existing conversation

**2. VOID**
Strategic silence when everyone expects you to speak → Speculation builds → Perfect entry when void is loudest

**3. MIRROR**
Predict inevitable crisis → Pre-position as solution → When crisis hits, you're the safe alternative

**4. TROJAN**
Hide message inside what they want → They extract your message themselves → No resistance

**5. NETWORK**
Map influence chains → Target influencer's influencer's influencer → Idea reaches target as trusted wisdom

### Campaign Orchestrator Architecture

```
niv-campaign-orchestrator (NEW Edge Function)
├── Phase 1: System Analysis
│   ├── Narrative Void Detection (niv-fireplexity)
│   ├── Stakeholder Mapping (mcp-discovery)
│   ├── Network Path Tracing (mcp-social-intelligence)
│   └── Pattern Research (knowledge-library-registry)
│
├── Phase 2: Pattern Selection
│   ├── CASCADE opportunity?
│   ├── VOID moment approaching?
│   ├── MIRROR predictable crisis?
│   ├── TROJAN desired vehicle?
│   └── NETWORK indirect chain?
│
├── Phase 3: Multi-Vector Blueprint
│   ├── Vector 1: Academic Track
│   ├── Vector 2: Niche Community Track
│   ├── Vector 3: Adjacent Industry Track
│   ├── Vector 4: Investor/Finance Track
│   ├── Vector 5: Cultural Track
│   └── Convergence Plan
│
├── Phase 4: Seed Deployment
│   ├── Stakeholder-Specific Messages
│   ├── Indirect Positioning
│   ├── Timing Orchestration
│   └── Connection Concealment
│
└── Phase 5: Emergence Monitoring
    ├── Pattern Detection (monitor-stage-1)
    ├── Void Status
    ├── Network Penetration
    └── Adaptive Triggers
```

### Knowledge Library Integration

**Already Built:** Research_Library.md contains complete edge function with:
- Foundational psychology (Cialdini, Kahneman, Berger, Centola)
- Pattern-specific research (CASCADE, MIRROR, CHORUS, TROJAN)
- 50+ case studies with metrics
- Industry intelligence (Edelman, PRSA, Cision)
- 147+ curated resources

**How NIV Uses It:**

```typescript
// Step 1: NIV determines pattern from user objective
const pattern = analyzeObjective(userRequest) // "CASCADE"

// Step 2: Get critical research for that pattern
const knowledge = await fetch('knowledge-library-registry', {
  body: {
    pattern: pattern,
    priority_filter: 'critical'  // Only 5-10 must-know items
  }
})

// Step 3: NIV reviews and asks itself "what else do I need?"
const specificNeeds = await claude.analyze({
  objective: userRequest,
  availableResearch: knowledge.data.foundational.map(k => k.title),
  question: "Which research areas are most relevant?"
})

// Step 4: Get targeted deep-dive
const targetedKnowledge = await fetch('knowledge-library-registry', {
  body: {
    pattern: pattern,
    tags: specificNeeds.relevantTags  // e.g. ['network_effects', 'tipping_points']
  }
})

// Step 5: Use knowledge to evaluate landscape findings
// and build campaign grounded in proven research
```

### Campaign Planner UI Enhancement

**Current:** 3-step wizard (Intake → Analysis → Blueprint)

**Enhanced:**
```
┌─────────────────────────────────────────┐
│  Strategic Campaign Planner             │
├─────────────────────────────────────────┤
│                                         │
│  [Coming from NIV?]                     │
│  ✓ Discovery complete                   │
│  ✓ Research loaded                      │
│  ✓ Pattern recommended: CASCADE         │
│                                         │
│  OR                                     │
│                                         │
│  [ Start Fresh ]                        │
│  Need help? → Opens NIV for guidance   │
│                                         │
└─────────────────────────────────────────┘
```

**Two Modes:**

**Express Mode:** User knows what they want
- Fill form → Generate campaign
- Uses V4 enhancements but skips NIV conversation

**Guided Mode:** User needs help
- "Need help?" → Opens NIV
- NIV does discovery
- Returns with pre-filled context
- User reviews/adjusts → Generate

---

## Part 3: Implementation Phases

### Phase 1: Deploy Knowledge Library (Week 1, Day 1-2)

**Already Built:** Research_Library.md is complete edge function

**Tasks:**
1. Copy Research_Library.md → `/supabase/functions/knowledge-library-registry/index.ts`
2. Deploy: `supabase functions deploy knowledge-library-registry`
3. Test API endpoints
4. Verify filtering works (pattern, priority, tags)

**Time:** 1-2 days

---

### Phase 2: Extend NIV Orchestrator Robust (Week 1, Day 3-5)

**Goal:** Add tools and structured outputs, keep existing logic

**File:** `/supabase/functions/niv-orchestrator-robust/index.ts`

**Tasks:**

**2.1: Add New Tools**
```typescript
// In tool definitions section
const AVAILABLE_TOOLS = [
  // Existing tools (keep as-is)
  {
    name: "mcp-discovery",
    description: "Organization landscape research"
  },
  {
    name: "niv-fireplexity",
    description: "Web research and competitive intelligence"
  },
  {
    name: "journalist-registry",
    description: "Media relationship mapping"
  },

  // NEW TOOLS
  {
    name: "knowledge-library-registry",
    description: "Access academic research, case studies, and proven methodologies for CASCADE, MIRROR, VOID, TROJAN, and NETWORK patterns. Query by pattern, priority (critical/high/medium/low), or specific tags.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          enum: ["CASCADE", "MIRROR", "CHORUS", "TROJAN", "VOID", "NETWORK"],
          description: "Strategic pattern to get research for"
        },
        priority_filter: {
          type: "string",
          enum: ["critical", "high", "medium", "low"],
          description: "Filter by research priority"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Specific research areas (e.g. 'network_effects', 'tipping_points')"
        }
      }
    }
  },
  {
    name: "niv-campaign-orchestrator",
    description: "Generate total-spectrum campaign blueprint with multi-vector seed planting strategy. Takes objective, research context, and recommended pattern. Returns full campaign blueprint with phases, vectors, timing, and content.",
    input_schema: {
      type: "object",
      properties: {
        objective: { type: "string", description: "Campaign objective" },
        context: { type: "object", description: "Discovery and research context" },
        pattern: { type: "string", description: "Recommended pattern (CASCADE, VOID, etc)" }
      },
      required: ["objective", "context", "pattern"]
    }
  },
  {
    name: "mcp-crisis",
    description: "Crisis detection and severity assessment"
  }
]
```

**2.2: Add Tool Implementations**
```typescript
// Add to tool execution switch
case 'knowledge-library-registry':
  console.log('📚 Querying Knowledge Library:', toolInput)
  const knowledgeResponse = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-library-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify(toolInput)
  })
  const knowledgeData = await knowledgeResponse.json()
  toolResults.push({
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: JSON.stringify(knowledgeData)
  })
  break

case 'niv-campaign-orchestrator':
  console.log('🎯 Generating Campaign Blueprint:', toolInput)
  const campaignResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-campaign-orchestrator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify(toolInput)
  })
  const campaignData = await campaignResponse.json()
  toolResults.push({
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: JSON.stringify(campaignData)
  })
  break

case 'mcp-crisis':
  console.log('🚨 Crisis Detection:', toolInput)
  const crisisResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-crisis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify(toolInput)
  })
  const crisisData = await crisisResponse.json()
  toolResults.push({
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: JSON.stringify(crisisData)
  })
  break
```

**2.3: Add Structured Output Detection**
```typescript
// After Claude generates final response
const responseText = finalMessage.content[0].text

// Detect if response indicates special action
let action = null

// Check for campaign ready
if (responseText.toLowerCase().includes('campaign') &&
    (responseText.includes('CASCADE') || responseText.includes('VOID') ||
     responseText.includes('MIRROR') || responseText.includes('TROJAN') ||
     responseText.includes('NETWORK'))) {

  // Extract campaign context from conversation state
  const campaignContext = extractCampaignContext(state)

  if (campaignContext) {
    action = {
      type: 'campaign_ready',
      data: campaignContext,
      ui_prompt: 'Open Campaign Planner'
    }
  }
}

// Check for content ready
if (responseText.toLowerCase().includes('content strategy') ||
    responseText.toLowerCase().includes('ready to generate')) {
  action = {
    type: 'content_ready',
    data: {
      contentStrategy: state.concept,
      research: state.researchHistory
    },
    ui_prompt: 'Generate Content'
  }
}

// Check for crisis
if (responseText.toLowerCase().includes('crisis') &&
    (responseText.includes('CRISIS DETECTED') || responseText.includes('severity'))) {
  action = {
    type: 'crisis_detected',
    severity: 'high', // Extract from response
    ui_prompt: 'Go to Crisis Command Center'
  }
}

return new Response(JSON.stringify({
  response: responseText,
  action: action,  // NEW: Include action data
  conversation: state.fullConversation
}), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

**Helper Function:**
```typescript
function extractCampaignContext(state: ConceptState) {
  // Extract campaign-relevant data from conversation state
  const campaignKeywords = ['CASCADE', 'VOID', 'MIRROR', 'TROJAN', 'NETWORK']
  const pattern = state.fullConversation
    .map(c => c.content)
    .join(' ')
    .split(' ')
    .find(word => campaignKeywords.includes(word.toUpperCase()))

  if (!pattern) return null

  return {
    pattern: pattern.toUpperCase(),
    objective: state.concept.goal || '',
    discoveryContext: {
      audience: state.concept.audience,
      narrative: state.concept.narrative,
      timeline: state.concept.timeline
    },
    research: state.researchHistory.slice(-3), // Last 3 research rounds
    userPreferences: state.userPreferences,
    conversationSummary: state.fullConversation.slice(-10) // Last 10 messages
  }
}
```

**Time:** 3 days

---

### Phase 3: Build Campaign Orchestrator Edge Function (Week 2)

**Goal:** Create the multi-vector campaign blueprint generator

**File:** `/supabase/functions/niv-campaign-orchestrator/index.ts`

**Architecture:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

interface CampaignRequest {
  objective: string
  context: {
    discoveryContext: any
    research: any[]
    userPreferences: any
  }
  pattern: 'CASCADE' | 'VOID' | 'MIRROR' | 'TROJAN' | 'NETWORK'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { objective, context, pattern } = await req.json() as CampaignRequest

    console.log(`🎯 Campaign Orchestrator: ${pattern} campaign for "${objective}"`)

    // Phase 1: System Analysis
    const analysis = await conductSystemAnalysis(objective, context, pattern)

    // Phase 2: Multi-Vector Blueprint
    const blueprint = await generateMultiVectorBlueprint(analysis, pattern)

    // Phase 3: Return structured campaign
    return new Response(JSON.stringify({
      success: true,
      campaign: {
        pattern: pattern,
        objective: objective,
        analysis: analysis,
        blueprint: blueprint
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Campaign Orchestrator error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function conductSystemAnalysis(
  objective: string,
  context: any,
  pattern: string
) {
  // Get pattern-specific knowledge from library
  const knowledgeResponse = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-library-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      pattern: pattern,
      priority_filter: 'critical'
    })
  })
  const knowledge = await knowledgeResponse.json()

  // Identify narrative voids (if CASCADE)
  let narrativeVoids = null
  if (pattern === 'CASCADE') {
    const voidResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        query: `Find unowned conversations and narrative voids related to: ${objective}`,
        focus: 'void_detection'
      })
    })
    narrativeVoids = await voidResponse.json()
  }

  return {
    knowledge: knowledge.data,
    narrativeVoids: narrativeVoids,
    stakeholderGroups: identifyStakeholders(context, pattern),
    networkPaths: context.research.filter((r: any) => r.type === 'network')
  }
}

async function generateMultiVectorBlueprint(analysis: any, pattern: string) {
  // Use Claude to generate multi-vector campaign blueprint
  // grounded in research and pattern-specific methodologies

  const prompt = buildPatternPrompt(pattern, analysis)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  })

  const data = await response.json()
  const blueprintText = data.content[0].text

  // Parse structured blueprint from Claude's response
  return parseBlueprint(blueprintText, pattern)
}

function buildPatternPrompt(pattern: string, analysis: any): string {
  const basePrompt = `You are generating a ${pattern} campaign blueprint.

PATTERN: ${pattern}

ACADEMIC GROUNDING:
${JSON.stringify(analysis.knowledge.pattern_specific, null, 2)}

CASE STUDIES:
${JSON.stringify(analysis.knowledge.pattern_specific.filter((k: any) => k.type === 'case_study'), null, 2)}
`

  const patternPrompts = {
    CASCADE: `
Generate a CASCADE campaign with multi-vector seed planting:

NARRATIVE VOIDS DETECTED:
${JSON.stringify(analysis.narrativeVoids, null, 2)}

STAKEHOLDER GROUPS:
${JSON.stringify(analysis.stakeholderGroups, null, 2)}

Create a campaign that:
1. Plants 15-20 unconnected seeds across 5 stakeholder groups
2. Each seed appears unrelated but shares subtle pattern
3. Seeds naturally converge over 4-6 weeks
4. Product/message becomes answer to emerging conversation

Structure your response as:
- Phase 1 (Weeks 1-2): Seed Planting
  - Academic Track: [specific actions]
  - Niche Community Track: [specific actions]
  - Adjacent Industry Track: [specific actions]
  - Investor Track: [specific actions]
  - Cultural Track: [specific actions]
- Phase 2 (Weeks 3-4): Pattern Emergence
  - What patterns people will notice
  - How to amplify without revealing connection
- Phase 3 (Weeks 5-6): Convergence
  - Trigger event that makes pattern obvious
  - How media/audience will investigate
- Phase 4 (Week 7): Revelation
  - Confirmation strategy
  - Position as answer to conversation
`,

    VOID: `
Generate a VOID campaign using strategic silence:

Identify:
1. Moment when everyone expects response (competitor launch, industry event, crisis)
2. Duration of strategic silence (24-72 hours typical)
3. Speculation that will build
4. Perfect entry timing
5. Message that reframes entire conversation

Structure as timeline with silence strategy and entry plan.
`,

    MIRROR: `
Generate a MIRROR campaign that pre-positions against predictable crisis:

Identify:
1. Likely crisis/event in industry (statistically certain)
2. Pre-positioning actions (1-2 weeks before)
3. When crisis hits, how you're already the safe option
4. Competition's crisis becomes your opportunity

Structure as pre-crisis preparation and post-crisis positioning.
`,

    TROJAN: `
Generate a TROJAN campaign embedding message in desired vehicle:

Identify:
1. What audience genuinely wants (tool, event, content, contest)
2. Your message embedded naturally in that vehicle
3. How they extract your message through participation
4. No resistance because they chose to engage

Structure as vehicle design and message embedding strategy.
`,

    NETWORK: `
Generate a NETWORK campaign targeting influencer chains:

Map:
1. Final target audience (e.g. Fortune 500 CEOs)
2. Who influences them (e.g. executive advisors)
3. Who influences the influencers (e.g. MBA professors)
4. Who we can actually reach (e.g. academics)

Structure as 3-5 degree influence chain with specific actions at each level.
`
  }

  return basePrompt + (patternPrompts[pattern as keyof typeof patternPrompts] || '')
}

function identifyStakeholders(context: any, pattern: string): string[] {
  // Based on pattern and context, identify relevant stakeholder groups
  const allStakeholders = [
    'academics',
    'niche_communities',
    'adjacent_industries',
    'investors',
    'culture_influencers',
    'media',
    'customers',
    'employees',
    'regulators'
  ]

  // Pattern-specific stakeholder priorities
  if (pattern === 'CASCADE') {
    return ['academics', 'niche_communities', 'adjacent_industries', 'investors', 'culture_influencers']
  }

  // Default: return all
  return allStakeholders
}

function parseBlueprint(text: string, pattern: string) {
  // Parse Claude's structured response into campaign blueprint
  // This will extract phases, tactics, timing, content types, etc.

  return {
    pattern: pattern,
    phases: extractPhases(text),
    vectors: extractVectors(text),
    timing: extractTiming(text),
    metrics: extractMetrics(text)
  }
}

function extractPhases(text: string): any[] {
  // Extract phase structure from text
  // Look for "Phase 1", "Phase 2", etc.
  const phases = []
  const phaseRegex = /Phase (\d+)[:\s]+([^\n]+)/gi
  let match

  while ((match = phaseRegex.exec(text)) !== null) {
    phases.push({
      number: parseInt(match[1]),
      name: match[2].trim()
    })
  }

  return phases
}

function extractVectors(text: string): any[] {
  // Extract influence vectors (stakeholder tracks)
  const vectors = []
  const trackKeywords = ['Academic Track', 'Community Track', 'Industry Track', 'Investor Track', 'Cultural Track']

  for (const track of trackKeywords) {
    if (text.includes(track)) {
      vectors.push({
        name: track,
        // Extract actions for this track
      })
    }
  }

  return vectors
}

function extractTiming(text: string): any {
  // Extract timeline information
  return {
    duration: '6-8 weeks', // Extract from text
    phases: [] // Extract phase durations
  }
}

function extractMetrics(text: string): any[] {
  // Extract success metrics
  return [
    'Seeds planted across 5 stakeholder groups',
    'Pattern recognition by week 4',
    'Media investigation by week 6',
    'Narrative ownership established'
  ]
}
```

**Time:** 5 days (Week 2)

---

### Phase 4: Frontend NIV Panel (Week 3)

**Goal:** Create persistent NIV sidebar accessible everywhere

**File:** `/src/components/niv/NIVPanel.tsx`

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { Bot, X, ExternalLink, Sparkles } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'

interface NIVMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  action?: {
    type: 'campaign_ready' | 'content_ready' | 'crisis_detected'
    data: any
    ui_prompt: string
  }
}

export default function NIVPanel() {
  const { organization } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<NIVMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId] = useState(`niv-${Date.now()}`)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message
    const newMessages = [
      ...messages,
      { role: 'user' as const, content: userMessage, timestamp: new Date().toISOString() }
    ]
    setMessages(newMessages)

    try {
      // Call orchestrator-robust
      const { data, error } = await supabase.functions.invoke('niv-orchestrator-robust', {
        body: {
          conversationId: conversationId,
          message: userMessage,
          organizationId: organization?.id,
          organizationName: organization?.name,
          conversationHistory: messages
        }
      })

      if (error) throw error

      // Add assistant message
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          action: data.action // Include action if present
        }
      ])
    } catch (err: any) {
      console.error('NIV error:', err)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Error: ${err.message}`,
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'campaign_ready':
        // Navigate to Campaign Planner with context
        window.location.href = `/campaign-planner?context=${encodeURIComponent(JSON.stringify(action.data))}`
        break

      case 'content_ready':
        // Navigate to Execute with strategy
        window.location.href = `/execute?strategy=${encodeURIComponent(JSON.stringify(action.data))}`
        break

      case 'crisis_detected':
        // Show alert and guide to Crisis Command Center
        alert('Crisis detected! Opening Crisis Command Center...')
        window.location.href = '/crisis'
        break
    }
  }

  return (
    <>
      {/* Floating NIV Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 z-50"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* NIV Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[600px] bg-white border border-gray-200 rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-indigo-50">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-800">NIV Advisor</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-indigo-300" />
                <p className="text-sm">How can I help you today?</p>
                <p className="text-xs mt-2">I can help with research, campaign strategy, content planning, and crisis assessment.</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {/* Action Button */}
                  {msg.action && (
                    <button
                      onClick={() => handleAction(msg.action)}
                      className="mt-2 flex items-center gap-2 bg-white text-indigo-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-indigo-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {msg.action.ui_prompt}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bot className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Add to Layout:**
```typescript
// src/app/layout.tsx
import NIVPanel from '@/components/niv/NIVPanel'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <NIVPanel /> {/* Always available */}
      </body>
    </html>
  )
}
```

**Time:** 3 days

---

### Phase 5: Update Campaign Planner Integration (Week 3-4)

**Goal:** Campaign Planner can receive context from NIV

**File:** `/src/components/prototype/StrategicCampaignPlanner.tsx`

**Changes:**

**5.1: Accept Context from URL**
```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function StrategicCampaignPlanner() {
  const searchParams = useSearchParams()
  const [nivContext, setNivContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if coming from NIV
    const contextParam = searchParams.get('context')
    if (contextParam) {
      try {
        const context = JSON.parse(decodeURIComponent(contextParam))
        setNivContext(context)
        console.log('📦 Received context from NIV:', context)
      } catch (err) {
        console.error('Failed to parse NIV context:', err)
      }
    }
    setLoading(false)
  }, [searchParams])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {nivContext ? (
        <PreFilledCampaignWizard context={nivContext} />
      ) : (
        <EmptyCampaignWizard />
      )}
    </div>
  )
}
```

**5.2: Pre-Fill Form with NIV Context**
```typescript
function PreFilledCampaignWizard({ context }: { context: any }) {
  const [objective, setObjective] = useState({
    objective: context.objective || '',
    targetAudience: context.discoveryContext?.audience || [],
    timeline: context.discoveryContext?.timeline || '',
    // ... pre-fill from context
  })

  const [recommendation, setRecommendation] = useState({
    pattern: context.pattern || '',
    reasoning: `Based on NIV's research and analysis`,
    // ... use context data
  })

  return (
    <div>
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-indigo-900">Coming from NIV</span>
        </div>
        <p className="text-sm text-indigo-700 mt-1">
          NIV has completed discovery and recommends a {context.pattern} campaign.
          Review the pre-filled information and generate your campaign blueprint.
        </p>
      </div>

      {/* Existing 3-step wizard with pre-filled data */}
      <CampaignWizard
        initialObjective={objective}
        initialRecommendation={recommendation}
        nivResearch={context.research}
      />
    </div>
  )
}
```

**5.3: Call Campaign Orchestrator Instead of Direct Claude**
```typescript
// Replace existing blueprint generation
const generateBlueprint = async () => {
  setGenerating(true)

  try {
    // Call niv-campaign-orchestrator instead of direct Claude API
    const { data, error } = await supabase.functions.invoke('niv-campaign-orchestrator', {
      body: {
        objective: objective.objective,
        context: {
          discoveryContext: nivContext?.discoveryContext || {},
          research: nivContext?.research || [],
          userPreferences: nivContext?.userPreferences || {}
        },
        pattern: recommendation.pattern
      }
    })

    if (error) throw error

    setBlueprint(data.campaign.blueprint)
    setStep(3)
  } catch (err: any) {
    console.error('Blueprint generation error:', err)
    alert('Failed to generate blueprint')
  } finally {
    setGenerating(false)
  }
}
```

**Time:** 2-3 days

---

## Testing & Validation

### Test Scenarios

**Scenario 1: CASCADE Campaign from NIV**
1. Open NIV: "We're launching an AI product for developers"
2. NIV does discovery (mcp-discovery, niv-fireplexity)
3. NIV accesses knowledge-library-registry for CASCADE research
4. NIV: "I recommend CASCADE campaign with 5 vectors"
5. User: "Yes, build it"
6. NIV: [Action button: "Open Campaign Planner"]
7. Campaign Planner opens pre-filled
8. User reviews multi-vector blueprint
9. Generates content for each vector

**Scenario 2: Crisis Detection**
1. User: "We had a data breach"
2. NIV calls mcp-crisis, assesses severity
3. NIV: "**CRISIS DETECTED.** Go to Crisis Command Center"
4. User navigates to Crisis Command Center
5. Uses crisis management tools there

**Scenario 3: Content Strategy**
1. User: "I need thought leadership on AI safety"
2. NIV researches landscape
3. NIV: "Here's a 5-piece strategy. Ready to generate?"
4. User: "Yes"
5. NIV: [Action button: "Generate Content"]
6. Execute tab opens with strategy pre-loaded

---

## Migration Strategy

### Phase 1: Build in Parallel (Weeks 1-3)
- New features don't break existing functionality
- Old NIV instances continue working
- Users can opt into new NIV

### Phase 2: Soft Launch (Week 4)
- Enable NIV panel for all users
- Keep old tools functional
- Gather feedback

### Phase 3: Full Migration (Week 5)
- Remove separate NIV Crisis Consultant
- Remove Intelligence Hub NIV connection
- NIV Panel becomes primary interface

---

## Success Metrics

### Technical Metrics
- NIV response time < 5 seconds
- Tool routing accuracy > 95%
- Context preservation across handoffs
- Campaign generation success rate

### User Metrics
- Time to campaign blueprint (target: < 10 minutes)
- User satisfaction with NIV guidance
- Adoption rate of multi-vector campaigns
- Reduction in "how do I..." support tickets

### Business Metrics
- 3-5x improvement in campaign effectiveness (from STRATEGY_UPDATE.MD)
- 70% reduction in content volume (quality > quantity)
- Narrative ownership of conversations
- System-level influence vs message-level tactics

---

## Risk Mitigation

### Technical Risks
- **Risk:** orchestrator-robust becomes bottleneck with new tools
- **Mitigation:** Monitor performance, optimize tool calls, add caching

- **Risk:** Knowledge Library queries slow down NIV
- **Mitigation:** Cache critical research items, lazy-load deep-dive research

- **Risk:** Context packages become too large
- **Mitigation:** Implement compression, only pass essential data

### User Experience Risks
- **Risk:** Users confused by action buttons
- **Mitigation:** Clear UI prompts, onboarding tooltips

- **Risk:** NIV advice conflicts with existing tools
- **Mitigation:** Consistent language, clear handoff points

---

## Part 2.5: Intelligent Content Type Selection

### The Problem (Current State)

**From recent testing:** Campaign generated 15 pieces but they were repetitive and generic:
- 10× "thought-leadership" (lazy default)
- 2× "media-pitch"
- 2× "social-post"
- 1× "press-release"
- 1× "media-list"

**Root Cause:** Simple mapping function that defaults to basic types instead of thinking like a PR professional about the full arsenal available.

### The Arsenal We're Underutilizing

**30+ Content Types Available** (from ExecuteTabProduction):

```typescript
const FULL_CONTENT_ARSENAL = {
  // MEDIA & PR (11 types)
  'press-release': 'Traditional media announcement',
  'media-pitch': 'Direct journalist outreach',
  'media-kit': 'Complete press package',
  'media-list': 'Journalist identification and targeting',
  'podcast-pitch': 'Podcast guest/topic pitch',
  'tv-interview-prep': 'TV appearance briefing',
  'thought-leadership': 'Long-form expert content',
  'case-study': 'Customer success story',
  'white-paper': 'Technical deep-dive document',

  // SOCIAL MEDIA (5 types)
  'social-post': 'Generic social content',
  'linkedin-post': 'Professional network post',
  'twitter-thread': 'Multi-tweet narrative',
  'instagram-caption': 'Visual storytelling text',
  'facebook-post': 'Community-focused content',

  // EMAIL & CAMPAIGNS (4 types)
  'email': 'Email campaign',
  'newsletter': 'Regular update email',
  'drip-sequence': 'Automated email series',
  'cold-outreach': 'Initial contact template',

  // EXECUTIVE & CRISIS (5 types)
  'executive-statement': 'CEO/leadership statement',
  'board-presentation': 'Board-level deck',
  'investor-update': 'Shareholder communication',
  'crisis-response': 'Crisis statement',
  'apology-statement': 'Public apology',

  // STRATEGY & MESSAGING (4 types)
  'messaging': 'Messaging framework',
  'brand-narrative': 'Brand story document',
  'value-proposition': 'Value prop statement',
  'competitive-positioning': 'Competitive positioning doc',

  // VISUAL CONTENT (5 types)
  'image': 'Visual asset',
  'infographic': 'Data visualization',
  'social-graphics': 'Social media visuals',
  'presentation': 'Slide deck',
  'video': 'Video script'
}
```

### The Solution: Context-Aware Content Type Intelligence

**Principle:** Match content type to stakeholder group, channel, and objective - not just default to "thought-leadership."

#### Implementation in Campaign Orchestrator

**File:** `/supabase/functions/niv-campaign-orchestrator/index.ts`

Add intelligent content type selection:

```typescript
function selectContentTypesForVector(
  vector: {
    stakeholder_group: string
    message: string
    channel: string
    pattern: string
  },
  knowledgeBase: any
): string[] {

  const contentTypes = []

  // ACADEMICS - Credibility and depth matter
  if (vector.stakeholder_group === 'academics') {
    contentTypes.push(
      'white-paper',              // Technical depth
      'case-study',               // Evidence-based
      'thought-leadership',       // Expert positioning
      'podcast-pitch'             // Academic podcast outreach
    )
  }

  // NICHE COMMUNITIES - Authenticity and participation
  if (vector.stakeholder_group === 'niche_communities') {
    contentTypes.push(
      'twitter-thread',           // Community conversation
      'case-study',               // Real-world application
      'video',                    // Tutorial/demo
      'social-post'               // Community engagement
    )
  }

  // ADJACENT INDUSTRIES - Collaboration and tools
  if (vector.stakeholder_group === 'adjacent_industries') {
    contentTypes.push(
      'white-paper',              // Technical integration guide
      'case-study',               // Cross-industry application
      'webinar-pitch',            // Partnership opportunity
      'thought-leadership'        // Industry insights
    )
  }

  // INVESTORS - ROI and market positioning
  if (vector.stakeholder_group === 'investors') {
    contentTypes.push(
      'investor-update',          // Financial narrative
      'board-presentation',       // Strategic overview
      'competitive-positioning',  // Market differentiation
      'executive-statement'       // Leadership vision
    )
  }

  // CULTURE - Story and impact
  if (vector.stakeholder_group === 'culture') {
    contentTypes.push(
      'brand-narrative',          // Story-driven
      'social-graphics',          // Visual storytelling
      'video',                    // Emotional connection
      'instagram-caption'         // Cultural moment
    )
  }

  // MEDIA - Newsworthiness and angles
  if (vector.channel === 'media') {
    contentTypes.push(
      'media-pitch',              // Journalist outreach
      'press-release',            // Official announcement
      'media-kit',                // Complete package
      'tv-interview-prep',        // Broadcast opportunity
      'podcast-pitch'             // Audio storytelling
    )
  }

  // Pattern-specific additions
  if (vector.pattern === 'CASCADE') {
    // Seeds need to be diverse and unconnected
    contentTypes.push(
      'infographic',              // Shareable data
      'twitter-thread',           // Conversation starter
      'case-study'                // Proof point
    )
  }

  if (vector.pattern === 'VOID') {
    // Silence followed by perfect entry
    contentTypes.push(
      'executive-statement',      // Leadership voice
      'media-kit',                // Complete story ready
      'social-graphics'           // Visual impact
    )
  }

  if (vector.pattern === 'MIRROR') {
    // Pre-positioning before crisis
    contentTypes.push(
      'white-paper',              // Thought leadership on topic
      'executive-statement',      // Leadership position
      'third-party-audit',        // Credibility marker
      'investor-update'           // Transparency signal
    )
  }

  if (vector.pattern === 'TROJAN') {
    // Vehicle with embedded message
    contentTypes.push(
      'infographic',              // Desired shareable
      'video',                    // Desired tutorial
      'case-study',               // Desired solution
      'white-paper'               // Desired knowledge
    )
  }

  if (vector.pattern === 'NETWORK') {
    // Indirect influence chain
    contentTypes.push(
      'white-paper',              // Academic citation
      'case-study',               // MBA teaching material
      'thought-leadership',       // Blog/journal article
      'podcast-pitch'             // Influencer appearance
    )
  }

  // Remove duplicates, prioritize by impact
  return [...new Set(contentTypes)].slice(0, 3)  // 3 types per vector
}
```

#### Enhanced Blueprint Prompt

Update the Campaign Orchestrator prompt to explicitly specify content types:

```typescript
const prompt = `Generate a ${pattern} campaign blueprint.

AVAILABLE CONTENT TYPES (use full spectrum, not just press releases):

MEDIA & PR:
- press-release, media-pitch, media-kit, media-list
- podcast-pitch, tv-interview-prep
- thought-leadership, case-study, white-paper

SOCIAL MEDIA:
- social-post, linkedin-post, twitter-thread
- instagram-caption, facebook-post

EMAIL & CAMPAIGNS:
- email, newsletter, drip-sequence, cold-outreach

EXECUTIVE & CRISIS:
- executive-statement, board-presentation, investor-update
- crisis-response, apology-statement

STRATEGY & MESSAGING:
- messaging, brand-narrative, value-proposition
- competitive-positioning

VISUAL CONTENT:
- image, infographic, social-graphics
- presentation, video

INSTRUCTIONS:
1. Match content type to stakeholder group
2. Consider channel and objective
3. Use diverse types (not just thought-leadership)
4. Think like a PR professional with full arsenal

For each vector, specify:
- stakeholder_group: 'academics' | 'niche_communities' | etc
- message: (stakeholder-specific message)
- content_type: (ONE of the types above, matched to stakeholder)
- channel: (where this will be distributed)
- timing: (when to deploy)
- rationale: (why this content type for this stakeholder)

Example for CASCADE campaign:
Vector 1 (Academics):
- content_type: "white-paper"
- rationale: "Academic stakeholders need technical depth and citations"

Vector 2 (Niche Communities):
- content_type: "twitter-thread"
- rationale: "Developer communities live on Twitter, thread format enables discussion"

Vector 3 (Adjacent Industries):
- content_type: "case-study"
- rationale: "Adjacent industries need proof of cross-application"

DO NOT default to thought-leadership for everything.
DO use the full spectrum of 30+ content types.
`
```

#### Update Opportunity Orchestrator V2

**File:** `/supabase/functions/opportunity-orchestrator-v2/index.ts`

Replace simple category mapping with intelligent selection:

```typescript
// OLD (Lazy Mapping)
const contentType = 'thought-leadership'  // Default for everything

// NEW (Intelligent Selection)
function selectContentTypeForOpportunity(
  opportunity: TotalSpectrumOpportunity,
  knowledgeBase: any
): string[] {

  const contentTypes = []

  // Analyze opportunity context
  const { category, pattern, target_audience, urgency } = opportunity

  // Match content type to opportunity characteristics
  if (urgency === 'critical') {
    // Fast-turnaround content
    contentTypes.push('executive-statement', 'social-post', 'media-pitch')
  }

  if (category === 'CASCADE_READY') {
    // Diverse seed content
    contentTypes.push('white-paper', 'case-study', 'twitter-thread', 'infographic')
  }

  if (category === 'VOID_WINDOW') {
    // Perfect entry content
    contentTypes.push('executive-statement', 'media-kit', 'social-graphics')
  }

  if (category === 'MIRROR_CRISIS') {
    // Pre-positioning content
    contentTypes.push('white-paper', 'third-party-audit', 'investor-update')
  }

  if (category === 'TROJAN_VEHICLE') {
    // Desired vehicle content
    contentTypes.push('infographic', 'video', 'case-study', 'white-paper')
  }

  if (category === 'NETWORK_PATH') {
    // Indirect influence content
    contentTypes.push('white-paper', 'thought-leadership', 'podcast-pitch')
  }

  // Target audience refinement
  if (target_audience?.includes('media')) {
    contentTypes.push('media-pitch', 'press-release', 'media-kit')
  }

  if (target_audience?.includes('investors')) {
    contentTypes.push('investor-update', 'board-presentation')
  }

  if (target_audience?.includes('developers')) {
    contentTypes.push('case-study', 'white-paper', 'twitter-thread')
  }

  if (target_audience?.includes('executives')) {
    contentTypes.push('executive-statement', 'board-presentation')
  }

  // Remove duplicates, return prioritized list
  return [...new Set(contentTypes)].slice(0, 5)
}
```

### Testing Criteria

**Before (V3 Current State):**
```
Campaign: "Launch AI Platform"
Generated:
- 10× thought-leadership
- 2× media-pitch
- 2× social-post
- 1× press-release
```

**After (V4 With Intelligence):**
```
Campaign: "Launch AI Platform" (CASCADE pattern)

Vector 1 (Academics):
- white-paper: "AI Architecture Patterns"
- case-study: "University Research Application"
- podcast-pitch: "Academic AI Podcast"

Vector 2 (Developer Communities):
- twitter-thread: "Quick integration guide"
- case-study: "Production deployment story"
- video: "Tutorial walkthrough"

Vector 3 (Adjacent Industries):
- white-paper: "Industry Integration Guide"
- case-study: "Cross-industry application"
- thought-leadership: "Future of AI Integration"

Vector 4 (Investors):
- investor-update: "Market opportunity narrative"
- board-presentation: "Strategic overview"
- competitive-positioning: "Market differentiation"

Vector 5 (Culture/Education):
- brand-narrative: "Democratizing AI story"
- social-graphics: "Visual impact"
- video: "AI education series"

Result: 15 pieces, 12 DIFFERENT content types, each matched to stakeholder needs
```

### Success Metrics

- ✅ **Content Type Diversity**: Using 12+ different types per campaign (vs 5 current)
- ✅ **Stakeholder Alignment**: Each content type matched to stakeholder needs
- ✅ **Pattern Optimization**: Content types support pattern mechanics (CASCADE seeds, VOID entry, etc.)
- ✅ **No Lazy Defaults**: Zero instances of "just use thought-leadership for everything"

---

## Part 3: Opportunity Engine Updates

### Current State

**opportunity-orchestrator-v2** maps opportunities to action types:
- PRESS_RELEASE
- SOCIAL_CAMPAIGN
- EXECUTIVE_OUTREACH
- CRISIS_RESPONSE
- CONTENT_CREATION
- PARTNERSHIP_PLAY
- TALENT_MOVE
- MARKET_POSITION

**Problem:** These are traditional PR categories, not total-spectrum patterns.

### What Needs to Change

**New Opportunity Categories (Aligned with Total-Spectrum):**

```typescript
type OpportunityCategory =
  // Pattern-Based Opportunities
  | 'CASCADE_READY'        // Narrative void detected, multi-vector seed planting opportunity
  | 'VOID_WINDOW'          // Strategic silence moment approaching
  | 'MIRROR_CRISIS'        // Predictable crisis to pre-position against
  | 'TROJAN_VEHICLE'       // Desired vehicle found with message embedding opportunity
  | 'NETWORK_PATH'         // Indirect influence chain accessible

  // Traditional Opportunities (Keep for backward compatibility)
  | 'PRESS_RELEASE'
  | 'SOCIAL_CAMPAIGN'
  | 'CONTENT_CREATION'
  | 'CRISIS_RESPONSE'
  | 'EXECUTIVE_OUTREACH'
```

**Enhanced Opportunity Structure:**

```typescript
interface TotalSpectrumOpportunity {
  id: string
  title: string
  description: string

  // Pattern Classification
  category: OpportunityCategory
  pattern?: 'CASCADE' | 'VOID' | 'MIRROR' | 'TROJAN' | 'NETWORK'

  // Execution Strategy
  execution_type: 'multi_vector' | 'autonomous' | 'assisted' | 'manual'

  // Multi-Vector Playbook (for CASCADE, NETWORK, etc.)
  vectors?: Array<{
    stakeholder_group: 'academics' | 'niche_communities' | 'adjacent_industries' | 'investors' | 'culture'
    message: string
    channel: string
    timing: string
  }>

  // Traditional Playbook (for direct opportunities)
  playbook: {
    key_messages: string[]
    target_audience: string
    channels: string[]
    content_types: string[]  // Now aware of 30+ types from ExecuteTabProduction
  }

  // Knowledge Base References
  grounding_research?: Array<{
    title: string
    relevance: string
    application: string
  }>

  // Timing
  urgency: 'critical' | 'high' | 'medium' | 'low'
  time_window: string
  optimal_execution_time?: string  // For VOID: "48 hours after event"

  // Organization
  organization_id: string

  // Metadata
  confidence: number
  created_at: string
  status: 'active' | 'in_progress' | 'completed'
}
```

### Implementation: Update opportunity-orchestrator-v2

**File:** `/supabase/functions/opportunity-orchestrator-v2/index.ts`

**Changes:**

**1. Add Pattern Detection**
```typescript
async function detectPatternOpportunities(
  signal: any,
  organizationId: string
): Promise<OpportunityCategory | null> {

  // CASCADE: Narrative void + stakeholder access
  if (signal.type === 'narrative_void' && signal.stakeholder_reach) {
    return 'CASCADE_READY'
  }

  // VOID: Expected response moment
  if (signal.type === 'competitor_move' || signal.type === 'industry_event') {
    const expectationLevel = await assessResponseExpectation(signal)
    if (expectationLevel === 'high') {
      return 'VOID_WINDOW'
    }
  }

  // MIRROR: Predictable crisis approaching
  if (signal.type === 'risk_signal' || signal.type === 'industry_pattern') {
    const predictability = await assessCrisisPredictability(signal)
    if (predictability > 0.7) {
      return 'MIRROR_CRISIS'
    }
  }

  // TROJAN: High-desire vehicle available
  if (signal.type === 'audience_desire' || signal.type === 'trending_format') {
    return 'TROJAN_VEHICLE'
  }

  // NETWORK: Influence path identified
  if (signal.type === 'influencer_mapping' && signal.path_length >= 2) {
    return 'NETWORK_PATH'
  }

  // Default: Traditional opportunity
  return null
}
```

**2. Generate Multi-Vector Playbooks**
```typescript
async function generateCascadePlaybook(
  signal: any,
  knowledge: any
): Promise<any> {

  // Get CASCADE research from knowledge library
  const cascadeResearch = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-library-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      pattern: 'CASCADE',
      priority_filter: 'critical'
    })
  }).then(r => r.json())

  // Use Claude to generate multi-vector strategy
  const prompt = `Based on this opportunity:
${JSON.stringify(signal, null, 2)}

And this CASCADE research:
${JSON.stringify(cascadeResearch.data.pattern_specific, null, 2)}

Generate a multi-vector seed planting strategy with:
1. 15-20 seeds across 5 stakeholder groups
2. Specific messages for each group (appear unconnected)
3. Convergence timeline (4-6 weeks)
4. Content types for each seed (use full spectrum: thought-leadership, case-study, white-paper, social-post, podcast-pitch, etc.)

Return JSON with vectors array.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  })

  const data = await response.json()
  const playbook = parsePlaybook(data.content[0].text)

  return {
    vectors: playbook.vectors,
    convergence_plan: playbook.convergence,
    timing: playbook.timing,
    grounding_research: cascadeResearch.data.pattern_specific.slice(0, 3)
  }
}
```

**3. Update Persona Mappings**
```typescript
const PERSONA_PATTERN_MAPPING = {
  'Marcus Chen': {
    patterns: ['PRESS_RELEASE', 'CRISIS_RESPONSE'],
    traditional: true  // Still thinks in old PR terms
  },
  'Victoria Chen': {
    patterns: ['NETWORK_PATH', 'EXECUTIVE_OUTREACH'],
    focus: 'Indirect influence through relationship chains'
  },
  'Sarah Kim': {
    patterns: ['CASCADE_READY', 'TROJAN_VEHICLE'],
    focus: 'Viral mechanics and hidden messaging'
  },
  'Helena Cross': {
    patterns: ['VOID_WINDOW', 'CASCADE_READY'],
    focus: 'Strategic silence and trend surfing'
  },
  'Emma Rodriguez': {
    patterns: ['MIRROR_CRISIS', 'MARKET_POSITION'],
    focus: 'Pre-positioning and competitive response'
  }
}
```

---

## Part 4: Execution Orchestration Updates

### Current State

**framework-auto-execute** generates content from strategic frameworks.

**Problems:**
1. Only handles traditional content types (10 types)
2. Not aware of multi-vector campaigns
3. No pattern-specific content generation
4. Linear execution (not orchestrated seed planting)

### What Needs to Change

**Enhanced Execution Flow:**

```
Opportunity Detected
↓
Pattern Identified (CASCADE, VOID, etc.)
↓
[IF MULTI-VECTOR]
├─→ Generate Vector 1 Content (Academics)
├─→ Generate Vector 2 Content (Niche Communities)
├─→ Generate Vector 3 Content (Adjacent Industries)
├─→ Generate Vector 4 Content (Investors)
└─→ Generate Vector 5 Content (Culture)
    ↓
    Schedule with Timing Orchestration
    (Seeds appear unconnected, planted over weeks)

[IF TRADITIONAL]
└─→ Generate Content (existing flow)
```

### Implementation: Create campaign-execution-orchestrator

**File:** `/supabase/functions/campaign-execution-orchestrator/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ExecutionRequest {
  source: 'opportunity' | 'campaign' | 'framework'
  sourceId: string
  executionPlan: {
    type: 'multi_vector' | 'traditional'
    pattern?: string
    vectors?: any[]
    contentTypes?: string[]
  }
  organizationId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request = await req.json() as ExecutionRequest

    console.log(`🎬 Campaign Execution: ${request.executionPlan.type} (${request.executionPlan.pattern || 'traditional'})`)

    if (request.executionPlan.type === 'multi_vector') {
      // Execute multi-vector campaign
      return await executeMultiVectorCampaign(request)
    } else {
      // Execute traditional campaign
      return await executeTraditionalCampaign(request)
    }

  } catch (error: any) {
    console.error('Execution error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function executeMultiVectorCampaign(request: ExecutionRequest) {
  const { vectors } = request.executionPlan
  const results = []

  // Execute each vector
  for (const vector of vectors || []) {
    console.log(`📍 Executing ${vector.stakeholder_group} vector`)

    // Generate content for this vector
    const content = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        message: vector.message,
        organizationContext: {
          conversationId: `vector-${vector.stakeholder_group}-${Date.now()}`,
          organizationId: request.organizationId
        },
        requestedContentType: vector.content_type,
        autoExecute: true,
        saveFolder: `Campaigns/${request.executionPlan.pattern}/${vector.stakeholder_group}`,

        // Pass vector context
        campaignContext: {
          vector: vector.stakeholder_group,
          pattern: request.executionPlan.pattern,
          timing: vector.timing,
          channel: vector.channel,
          concealment: 'unconnected_seed' // Ensure appears independent
        }
      })
    })

    const contentResult = await content.json()
    results.push({
      vector: vector.stakeholder_group,
      content: contentResult,
      scheduled_for: vector.timing
    })
  }

  // Store execution plan for monitoring
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await supabase.from('campaign_executions').insert({
    source_type: request.source,
    source_id: request.sourceId,
    pattern: request.executionPlan.pattern,
    execution_type: 'multi_vector',
    vectors_executed: results.length,
    status: 'in_progress',
    organization_id: request.organizationId,
    execution_data: {
      vectors: results,
      convergence_date: calculateConvergenceDate(results)
    }
  })

  return new Response(JSON.stringify({
    success: true,
    execution: {
      type: 'multi_vector',
      vectors_executed: results.length,
      results: results,
      message: `${results.length} vectors executed for ${request.executionPlan.pattern} campaign`
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function executeTraditionalCampaign(request: ExecutionRequest) {
  // Use existing framework-auto-execute logic
  // But with enhanced content type awareness

  const contentTypes = request.executionPlan.contentTypes || ['press-release', 'social-post']
  const results = []

  for (const contentType of contentTypes) {
    const content = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        message: `Generate ${contentType} for campaign`,
        organizationContext: {
          conversationId: `traditional-${contentType}-${Date.now()}`,
          organizationId: request.organizationId
        },
        requestedContentType: contentType,
        autoExecute: true,
        saveFolder: `Campaigns/Traditional`
      })
    })

    results.push(await content.json())
  }

  return new Response(JSON.stringify({
    success: true,
    execution: {
      type: 'traditional',
      content_generated: results.length,
      results: results
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function calculateConvergenceDate(vectors: any[]): string {
  // Based on vector timing, calculate when convergence should happen
  // Typically 4-6 weeks after first seed
  const now = new Date()
  now.setDate(now.getDate() + 42) // 6 weeks
  return now.toISOString()
}
```

### Integration Points

**1. Opportunity → Execution**
```typescript
// In opportunity-orchestrator-v2
if (opportunity.execution_type === 'multi_vector') {
  // Trigger execution orchestrator
  await fetch(`${SUPABASE_URL}/functions/v1/campaign-execution-orchestrator`, {
    method: 'POST',
    body: JSON.stringify({
      source: 'opportunity',
      sourceId: opportunity.id,
      executionPlan: {
        type: 'multi_vector',
        pattern: opportunity.pattern,
        vectors: opportunity.vectors
      },
      organizationId: opportunity.organization_id
    })
  })
}
```

**2. Campaign Planner → Execution**
```typescript
// In StrategicCampaignPlanner.tsx
const executeAllContent = async () => {
  const response = await supabase.functions.invoke('campaign-execution-orchestrator', {
    body: {
      source: 'campaign',
      sourceId: campaignId,
      executionPlan: {
        type: blueprint.pattern ? 'multi_vector' : 'traditional',
        pattern: blueprint.pattern,
        vectors: blueprint.vectors,
        contentTypes: blueprint.contentTypes
      },
      organizationId: currentOrgId
    }
  })
}
```

**3. Framework → Execution**
```typescript
// Keep existing framework-auto-execute for backward compatibility
// But enhance it to use campaign-execution-orchestrator for complex executions
```

---

## Updated Implementation Timeline

### Week 1: Foundation
- Day 1-2: Deploy Knowledge Library
- Day 3-5: Extend orchestrator-robust with tools + structured outputs

### Week 2: Campaign & Opportunity
- Day 1-3: Build niv-campaign-orchestrator
- Day 4-5: **Update opportunity-orchestrator-v2 with pattern detection**

### Week 3: Execution & Frontend
- Day 1-2: **Build campaign-execution-orchestrator**
- Day 3-5: Create NIV Panel frontend

### Week 4: Integration
- Day 1-2: Integrate Campaign Planner with NIV context
- Day 3-4: **Connect opportunity engine to execution orchestrator**
- Day 5: End-to-end testing

### Week 5: Launch
- Soft launch, monitoring, iteration

---

## Next Steps

1. **Week 1:** Deploy Knowledge Library, extend orchestrator-robust
2. **Week 2:** Build Campaign Orchestrator + Update Opportunity Engine
3. **Week 3:** Build Execution Orchestrator + NIV Panel frontend
4. **Week 4:** Integrate all pieces, test end-to-end
5. **Week 5:** Soft launch, gather feedback, iterate

---

## Appendix: File Structure

```
supabase/functions/
├── knowledge-library-registry/
│   └── index.ts (READY - from Research_Library.md)
├── niv-orchestrator-robust/
│   ├── index.ts (EXTEND - add tools + structured outputs)
│   └── self-orchestration.ts (KEEP AS-IS)
├── niv-campaign-orchestrator/
│   └── index.ts (NEW - build this)
└── niv-content-intelligent-v2/
    └── index.ts (KEEP AS-IS)

src/components/
├── niv/
│   └── NIVPanel.tsx (NEW - persistent chat)
├── prototype/
│   └── StrategicCampaignPlanner.tsx (ENHANCE - accept NIV context)
└── crisis/
    └── CrisisAIAssistant.tsx (DEPRECATE - NIV handles crisis)
```

---

**End of Master Plan**
