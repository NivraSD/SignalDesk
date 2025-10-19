# NIV Campaign Orchestrator V4 - Complete Rebuild Plan

## Executive Summary

The current MVP Campaign Planner (StrategicCampaignPlanner.tsx) was a proof-of-concept that automated traditional PR thinking. **V4 obsoletes traditional PR entirely** by orchestrating influence at the system level.

### The Fundamental Shift (from STRATEGY_UPDATE.MD)

**Traditional PR (what we're NOT doing):**
- Detect opportunity → Create content → Distribute → Hope for coverage
- One message to many channels
- Direct messaging: "Company X is innovative"
- Compete in crowded channels
- Linear thinking in a network world

**Total-Spectrum Communications (what V4 does):**
- **Multiple simultaneous influence vectors** - Different messages to different stakeholders that naturally converge
- **Indirect influence** - Engineer discovery, not announcements ("I discovered Company X is innovative")
- **Narrative voids** - Own conversations before they explode, don't compete where everyone else is
- **Network-level influence** - Target influencers of influencers, not end audiences
- **Orchestrate system states** - Create conditions where our narrative becomes inevitable

### The Five Core Patterns

1. **CASCADE**: Plant 15-20 unconnected seeds across academics, niche communities, adjacent industries → Pattern emerges → Convergence → Revelation (product becomes answer to existing conversation)

2. **VOID**: Strategic silence when everyone expects you to speak → Speculation builds → Perfect entry when void is loudest

3. **MIRROR**: Predict inevitable crisis → Pre-position as solution → When crisis hits, you're the safe alternative

4. **TROJAN**: Hide message inside what they want → They extract your message themselves → No resistance

5. **NETWORK**: Map influence chains → Target influencer's influencer's influencer → Idea reaches target as trusted wisdom

### What NIV Campaign Orchestrator V4 Must Do

1. **Think in systems, not messages** - "How do I create conditions where 5 different stakeholder groups naturally converge on my narrative?"
2. **Plan multi-vector campaigns** - Academics get one message, investors another, culture a third - all reinforcing without seeming connected
3. **Find narrative voids** - Identify unowned conversations about to explode
4. **Map indirect routes** - Don't pitch Fortune 500 CEOs; influence the MBA professors who teach their advisors
5. **Orchestrate emergence** - Small, coordinated actions that trigger large system shifts

---

## Current State Analysis

### What the MVP Has (StrategicCampaignPlanner.tsx)
✅ **Working**:
- 3-step wizard (intake → analysis → blueprint)
- Pattern recommendation (CASCADE, VOID, MIRROR, TROJAN, NETWORK)
- Campaign blueprint generation
- Content generation integration
- Campaign save to Supabase

❌ **Problems**:
- **Linear thinking** - Single message, single channel approach
- **Direct messaging** - "Send press release and hope" mentality
- **No multi-vector orchestration** - Doesn't plan simultaneous campaigns to different stakeholders
- **No void detection** - Can't identify unowned conversations about to explode
- **No network mapping** - Doesn't find indirect influence paths
- **Generic content** - Based on campaign title, not stakeholder-specific seed planting
- **No emergence planning** - Doesn't create conditions for narrative convergence

### What V4 Needs (from V4_MCP_ANALYSIS.md)

**Existing MCPs We Can Use**:
- ✅ niv-fireplexity (research)
- ✅ niv-content-intelligent-v2 (content generation)
- ✅ monitor-stage-1 (monitoring)
- ✅ mcp-discovery (audience/landscape research)
- ✅ mcp-social-intelligence (social signals)
- ✅ mcp-crisis (crisis detection)
- ✅ journalist-registry (media relationships)

**New Infrastructure Needed**:
- 📚 KnowledgeLibraryRegistry edge function (**ALREADY BUILT** - see Research_Library.md)
- 🎯 NIV Campaign Orchestrator edge function (the brain)

---

## Architecture Overview

```
NIV Campaign Orchestrator V4 - Total-Spectrum Orchestration
├── Phase 1: System Analysis (Not "Research")
│   ├── Narrative Void Detection (niv-fireplexity)
│   │   └── Find unowned conversations about to explode
│   ├── Stakeholder Mapping (mcp-discovery)
│   │   └── Academics, niche communities, adjacent industries, investors, culture
│   ├── Network Path Tracing (mcp-social-intelligence)
│   │   └── Map influencer → influencer → influencer chains
│   └── Pattern Research (KnowledgeLibraryRegistry)
│       └── Academic grounding for CASCADE/VOID/MIRROR/TROJAN/NETWORK
│
├── Phase 2: Pattern Selection (Not "Strategy")
│   ├── CASCADE: Multi-vector seed planting opportunity?
│   ├── VOID: Strategic silence moment approaching?
│   ├── MIRROR: Predictable crisis we can pre-position against?
│   ├── TROJAN: Desired vehicle with embedded message?
│   └── NETWORK: Indirect influence chain accessible?
│
├── Phase 3: Multi-Vector Blueprint (Not "Content Plan")
│   ├── Vector 1: Academic Track
│   │   └── Fund research, sponsor papers, plant concepts
│   ├── Vector 2: Niche Community Track
│   │   └── Unbranded discussions, community contributions
│   ├── Vector 3: Adjacent Industry Track
│   │   └── Case studies, tools, methodologies
│   ├── Vector 4: Investor/Finance Track
│   │   └── Market disruption narrative
│   ├── Vector 5: Cultural Track
│   │   └── Art, education, social impact
│   └── Convergence Plan
│       └── When/how vectors naturally connect
│
├── Phase 4: Seed Deployment (Not "Content Generation")
│   ├── Stakeholder-Specific Messages
│   │   └── Each vector gets unique message that reinforces others
│   ├── Indirect Positioning
│   │   └── Engineer discovery, not announcements
│   ├── Timing Orchestration
│   │   └── Sequential or simultaneous based on pattern
│   └── Connection Concealment
│       └── Seeds appear unconnected until convergence
│
└── Phase 5: Emergence Monitoring (Not "Performance")
    ├── Pattern Detection (monitor-stage-1)
    │   └── Are seeds connecting? Is convergence happening?
    ├── Void Status
    │   └── Is silence building speculation?
    ├── Network Penetration
    │   └── Has influence reached indirect targets?
    └── Adaptive Triggers
        └── When to reveal connection, when to add fuel
```

---

## Phase 1: Deploy Knowledge Library Registry

### Step 1.1: Use Existing Implementation

**IMPORTANT**: The Knowledge Library Registry is **already fully built** in `Research_Library.md`. This file contains:
- Complete edge function implementation ready to deploy
- All foundational psychology research (Cialdini, Kahneman, Berger, Centola, etc.)
- Pattern-specific knowledge for CASCADE, MIRROR, CHORUS, TROJAN
- 50+ case studies with metrics
- Industry intelligence (Edelman, PRSA, Cision)
- Tools and methodologies
- 147+ curated research resources

**No need to rebuild from scratch** - just deploy the existing code.

### Step 1.2: Deploy to Supabase

**File**: Copy `Research_Library.md` → `/supabase/functions/knowledge-library-registry/index.ts`

**What's already in Research_Library.md:**
- Complete Deno edge function code
- TIER1_KNOWLEDGE: foundational_psychology, network_science, trust_credibility, framing_narrative, behavioral_economics
- INDUSTRY_INTELLIGENCE: pr_communications, consultancy_insights, media_consumption
- PATTERN_KNOWLEDGE: CASCADE, MIRROR, CHORUS, TROJAN with academic_foundations, case_studies, methodologies
- EMERGING_RESEARCH: ai_communications, platform_evolution
- TOOLS_METHODOLOGIES: network_analysis, sentiment_analysis, research_databases
- Full API handler with filtering by pattern, priority, research_area

**Deployment command:**
```bash
# Copy the file to correct location
cp Research_Library.md supabase/functions/knowledge-library-registry/index.ts

# Deploy to Supabase
supabase functions deploy knowledge-library-registry
```

**Testing:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/knowledge-library-registry' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"pattern": "CASCADE", "priority_filter": "critical"}'
```

---

## Phase 2: Build NIV Campaign Orchestrator Edge Function

### Step 2.1: Create Orchestrator

**File**: `/supabase/functions/niv-campaign-orchestrator/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

// Available content types from ExecuteTabProduction
const CONTENT_TYPES = {
  // Core PR Content
  'press-release': { category: 'Media', description: 'Traditional press release' },
  'media-pitch': { category: 'Media', description: 'Pitch to journalists' },
  'media-kit': { category: 'Media', description: 'Complete media package' },

  // Thought Leadership
  'thought-leadership': { category: 'Content', description: 'Long-form article' },
  'white-paper': { category: 'Content', description: 'Technical deep-dive' },
  'case-study': { category: 'Content', description: 'Customer success story' },

  // Executive Communications
  'executive-statement': { category: 'Executive', description: 'CEO/leadership statement' },
  'board-presentation': { category: 'Executive', description: 'Board-level deck' },
  'investor-update': { category: 'Executive', description: 'Investor communication' },

  // Social & Community
  'social-post': { category: 'Social', description: 'Social media content' },
  'linkedin-post': { category: 'Social', description: 'LinkedIn-specific' },
  'twitter-thread': { category: 'Social', description: 'Twitter thread' },

  // Email & Outreach
  'email': { category: 'Email', description: 'Email campaign' },
  'newsletter': { category: 'Email', description: 'Regular newsletter' },
  'cold-outreach': { category: 'Email', description: 'Cold email template' },

  // Visual & Interactive
  'infographic': { category: 'Visual', description: 'Data visualization' },
  'presentation': { category: 'Visual', description: 'Slide deck' },
  'video': { category: 'Visual', description: 'Video script' },

  // Strategy & Messaging
  'messaging': { category: 'Strategy', description: 'Messaging framework' },
  'brand-narrative': { category: 'Strategy', description: 'Brand story' },
  'competitive-positioning': { category: 'Strategy', description: 'Positioning doc' },

  // Media Relations
  'media-list': { category: 'Media', description: 'Journalist identification' },
  'podcast-pitch': { category: 'Media', description: 'Podcast outreach' },
  'tv-interview-prep': { category: 'Media', description: 'Interview preparation' },

  // Crisis
  'crisis-response': { category: 'Executive', description: 'Crisis communication' },
  'apology-statement': { category: 'Executive', description: 'Apology/correction' }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      objective, // User's PR objective
      organizationId,
      stage = 'discovery' // discovery, analysis, blueprint, execution
    } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    console.log(`🎯 NIV Campaign Orchestrator - Stage: ${stage}`)

    // STAGE 1: DISCOVERY & RESEARCH
    if (stage === 'discovery') {
      return await conductDiscovery(objective, organizationId, supabase)
    }

    // STAGE 2: STRATEGIC ANALYSIS
    if (stage === 'analysis') {
      return await analyzeStrategy(objective, organizationId, supabase)
    }

    // STAGE 3: CAMPAIGN BLUEPRINT
    if (stage === 'blueprint') {
      return await generateBlueprint(objective, organizationId, supabase)
    }

    // STAGE 4: CONTENT ORCHESTRATION
    if (stage === 'execution') {
      return await orchestrateContent(objective, organizationId, supabase)
    }

  } catch (error: any) {
    console.error('Campaign orchestrator error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// DISCOVERY PHASE
async function conductDiscovery(objective: any, orgId: string, supabase: any) {
  console.log('📚 Phase 1: Discovery & Research')

  // Step 1: Get organization context via mcp-discovery
  const orgContext = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      organizationId: orgId,
      query: `Understand organization landscape for: ${objective.objective}`
    })
  }).then(r => r.json())

  // Step 2: Research target audience & competitors via niv-fireplexity
  const audienceResearch = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      query: `Research audience psychology and behaviors for: ${objective.targetAudience.join(', ')}`,
      organizationId: orgId
    })
  }).then(r => r.json())

  // Step 3: Get academic grounding from KnowledgeLibraryRegistry
  const knowledgeBase = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-library-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      pattern: null, // Get foundational knowledge
      priority_filter: 'critical'
    })
  }).then(r => r.json())

  return new Response(JSON.stringify({
    success: true,
    stage: 'discovery_complete',
    discovery: {
      organization_context: orgContext,
      audience_research: audienceResearch,
      knowledge_base: knowledgeBase.data.foundational,
      next_stage: 'analysis'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// ANALYSIS PHASE
async function analyzeStrategy(objective: any, orgId: string, supabase: any) {
  console.log('🧠 Phase 2: Strategic Analysis')

  // Use Claude with discovery context to recommend pattern
  // This is where the orchestrator decides which psychological pattern to use
  // Based on: org context, audience research, knowledge base

  // ... Claude API call with full context

  return new Response(JSON.stringify({
    success: true,
    stage: 'analysis_complete',
    recommendation: {
      pattern: 'CASCADE',
      confidence: 85,
      rationale: {/* ... */},
      academic_basis: [/* references from knowledge base */],
      next_stage: 'blueprint'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// BLUEPRINT GENERATION PHASE
async function generateBlueprint(objective: any, orgId: string, supabase: any) {
  console.log('📋 Phase 3: Campaign Blueprint')

  // Get pattern-specific knowledge
  const patternKnowledge = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-library-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      pattern: objective.recommendedPattern, // e.g., 'CASCADE'
      priority_filter: 'critical'
    })
  }).then(r => r.json())

  // Use Claude to generate blueprint with:
  // - Full content type library (CONTENT_TYPES)
  // - Pattern-specific case studies
  // - Tactical specificity

  // ... Claude API call with enhanced context

  return new Response(JSON.stringify({
    success: true,
    stage: 'blueprint_complete',
    blueprint: {
      campaign_name: 'The Silent Symphony',
      pattern: 'CASCADE',
      phases: [
        {
          phase_number: 1,
          phase_name: 'Week 1-2: Community Seeding',
          tactics: [
            {
              tactic_name: 'Developer community case studies',
              content_type: 'case-study', // Specific type!
              description: 'Technical walkthroughs showing problem-solving with tool',
              execution_type: 'auto',
              target_communities: ['r/programming', 'HackerNews', 'Dev.to']
            },
            {
              tactic_name: 'Tech analyst briefing materials',
              content_type: 'white-paper', // Not just "thought-leadership"!
              description: 'Data-rich research showing adoption patterns',
              execution_type: 'auto',
              target_analysts: ['Gartner', 'Forrester']
            },
            {
              tactic_name: 'Media list: Developer tool journalists',
              content_type: 'media-list', // Use journalist-registry
              description: 'Identify journalists covering developer tools',
              execution_type: 'auto',
              outlet_types: ['TechCrunch', 'The Information', 'Protocol']
            }
          ]
        }
      ],
      content_orchestration_plan: {/* How each tactic will be generated */}
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// CONTENT ORCHESTRATION PHASE
async function orchestrateContent(objective: any, orgId: string, supabase: any) {
  console.log('🎨 Phase 4: Content Orchestration')

  const blueprint = objective.blueprint
  const results = []

  // For each auto-executable tactic in blueprint
  for (const phase of blueprint.phases) {
    for (const tactic of phase.tactics.filter((t: any) => t.execution_type === 'auto')) {

      // Route to appropriate content generator based on content_type
      const contentResult = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          message: `Generate ${tactic.tactic_name}: ${tactic.description}`,
          organizationContext: {
            organizationId: orgId,
            conversationId: `campaign-${Date.now()}`
          },

          // Pass FULL tactical context
          preloadedStrategy: {
            subject: blueprint.campaign_name,
            narrative: objective.strategic_thesis,
            key_messages: objective.key_messages,
            target_audiences: tactic.target_communities || tactic.target_analysts || objective.targetAudience,

            // Pattern-specific context
            pattern: blueprint.pattern,
            phase: phase.phase_name,
            tactic_details: tactic
          },

          // Specify EXACT content type (not generic)
          requestedContentType: tactic.content_type,
          autoExecute: true,
          saveFolder: `campaigns/${blueprint.pattern}/${blueprint.campaign_name}`
        })
      })

      results.push(await contentResult.json())
    }
  }

  return new Response(JSON.stringify({
    success: true,
    stage: 'execution_complete',
    results: results,
    summary: {
      total_tactics: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
```

---

## Phase 3: Frontend Component (New NIV Campaign UI)

### Step 3.1: Replace StrategicCampaignPlanner with NIVCampaignOrchestrator

**File**: `/src/components/campaign/NIVCampaignOrchestrator.tsx`

```typescript
'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'

export default function NIVCampaignOrchestrator() {
  const { organization } = useAppStore()
  const [stage, setStage] = useState<'intake' | 'discovery' | 'analysis' | 'blueprint' | 'execution'>('intake')

  const [objective, setObjective] = useState({
    objective: '',
    targetAudience: [],
    currentPosition: '',
    desiredPosition: ''
  })

  const [discovery, setDiscovery] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [blueprint, setBlueprint] = useState(null)
  const [executionResults, setExecutionResults] = useState(null)

  const handleStartDiscovery = async () => {
    setStage('discovery')

    // Call NIV Campaign Orchestrator - Discovery phase
    const response = await fetch('/api/supabase/functions/niv-campaign-orchestrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objective,
        organizationId: organization?.id,
        stage: 'discovery'
      })
    })

    const result = await response.json()
    setDiscovery(result.discovery)
    setStage('analysis')
  }

  // ... similar handlers for analysis, blueprint, execution

  return (
    <div className="p-6">
      {/* Multi-stage UI showing:
          - Discovery progress (org context, audience research, knowledge base)
          - Analysis with academic citations
          - Blueprint with specific content types
          - Execution with real-time generation progress
      */}
    </div>
  )
}
```

---

## Implementation Timeline

### Week 1: Foundation
- ✅ Day 1-2: Build KnowledgeLibraryRegistry edge function
- ✅ Day 3-4: Populate knowledge base (academic papers, case studies)
- ✅ Day 5: Test knowledge base API

### Week 2: Orchestrator Core
- ✅ Day 6-7: Build NIV Campaign Orchestrator edge function
- ✅ Day 8-9: Implement discovery & analysis phases
- ✅ Day 10: Implement blueprint generation with full content types

### Week 3: Content Integration
- ✅ Day 11-12: Implement intelligent content orchestration
- ✅ Day 13-14: Integrate with existing MCPs (fireplexity, discovery, etc.)
- ✅ Day 15: Test full pipeline

### Week 4: Frontend & Polish
- ✅ Day 16-17: Build new NIVCampaignOrchestrator UI component
- ✅ Day 18-19: Add progress tracking, visualizations
- ✅ Day 20-21: End-to-end testing, refinement

---

## Key Improvements Over MVP

### 1. **Intelligent Research Phase**
**Before**: User fills form → generate blueprint
**After**: User fills form → Discovery (org context, audience research, knowledge base) → Analysis → Blueprint

### 2. **Academic Grounding**
**Before**: Generic recommendations
**After**: Every recommendation backed by academic research, case studies, proven methodologies

### 3. **Full Content Arsenal**
**Before**: Maps everything to 5 basic types (thought-leadership, press-release, etc.)
**After**: Intelligently selects from 30+ content types based on tactic needs

### 4. **Context Preservation**
**Before**: NIV gets "generate thought-leadership" + campaign title
**After**: NIV gets full tactical context (phase, pattern, specific description, target audience)

### 5. **Self-Directed Orchestrator**
**Before**: Fixed workflow (intake → pattern → blueprint)
**After**: Orchestrator decides what research it needs, which MCPs to call, optimal content routing

---

## Success Metrics

### Quality Metrics
- ✅ Content diversity: 15+ different content types used per campaign
- ✅ Academic citations: Every pattern recommendation includes 3+ research references
- ✅ Tactical specificity: No generic "thought leadership", specific tactic descriptions

### Performance Metrics
- ✅ Discovery phase: <30 seconds
- ✅ Blueprint generation: <60 seconds
- ✅ Content generation: <5 minutes for 15 pieces

### User Experience
- ✅ Clear progress tracking through all phases
- ✅ Academic rationale visible for each recommendation
- ✅ Content quality superior to MVP (specific vs. generic)

---

## Migration Plan

### Phase 1: Build in Parallel
- Keep existing StrategicCampaignPlanner working
- Build new NIVCampaignOrchestrator alongside
- Test V4 extensively before switchover

### Phase 2: Feature Flag
- Add feature flag to toggle between MVP and V4
- Roll out to test users first
- Gather feedback

### Phase 3: Full Migration
- Make V4 default
- Deprecate StrategicCampaignPlanner
- Update documentation

---

## Next Steps

1. **Review this plan** - Confirm architecture aligns with vision
2. **Prioritize knowledge base** - Which academic papers/case studies are must-haves?
3. **Build KnowledgeLibraryRegistry** - Start with 20-30 critical resources
4. **Build NIV Campaign Orchestrator** - Core orchestration logic
5. **Frontend integration** - New UI that shows the intelligence

**Ready to start building?**
