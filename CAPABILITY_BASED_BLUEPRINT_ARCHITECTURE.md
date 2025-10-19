# Capability-Based Blueprint Architecture

**Date:** 2025-10-14
**Context:** Redesigning blueprint generation to be capability-driven, not section-driven

---

## Core Philosophy

The blueprint should be **strategic instructions** that leverage psychological research, NOT premature content generation.

### Current Problem
- Blueprint tries to generate content (wrong layer)
- Doesn't deeply use psychological insights from research
- niv-content-intelligent-v2 can't optimally process the structure

### New Approach
- Research synthesis → Strategic blueprint (influence strategies based on psychology)
- Blueprint → Structured instructions (what to create, for whom, why it works)
- niv-content-intelligent-v2 → Actual content generation

---

## Edge Function Capabilities (Not Sections)

### 1. **Psychological Influence Mapper** (`niv-blueprint-influence-mapper`)

**Purpose:** Convert stakeholder psychology + positioning into influence strategies

**Input:**
- CampaignIntelligenceBrief (stakeholders with psychology, fears, aspirations, decision triggers)
- **Selected positioning** (name, tagline, keyMessages, differentiators, targetAudiences, opportunities, risks)
- Campaign goal

**What it does:**
- For each stakeholder group:
  - Map their psychology → influence levers
  - **Align positioning messages with their psychological triggers**
  - Map their fears → counter-narratives needed + positioning differentiators that address fears
  - Map their aspirations → aspirational messaging angles **using positioning tagline/messages**
  - Map positioning opportunities → tactical moments
  - Map their decision triggers → tactical timing windows
  - Map their information diet → optimal channels

**Key insight:** Positioning tells us WHAT to say. Psychology tells us HOW to say it to each stakeholder.

**Output:**
```json
{
  "influenceStrategies": [
    {
      "stakeholder": "Enterprise IT Directors",
      "psychologicalProfile": {
        "primaryFear": "System downtime",
        "aspirationalGoal": "Innovation leader in org",
        "decisionTrigger": "Peer validation + ROI proof"
      },
      "positioningAlignment": {
        "coreMessage": "Enterprise-grade reliability meets rapid innovation",
        "keyMessagesForThisStakeholder": [
          "99.99% uptime guaranteed (addresses fear)",
          "Deploy new features 10x faster (addresses aspiration)",
          "Trusted by 50+ F500 companies (provides peer validation)"
        ],
        "differentiatorsThatResonateHere": [
          "Only platform with real-time rollback",
          "Built by former AWS engineers"
        ]
      },
      "influenceLevers": [
        {
          "lever": "Fear mitigation",
          "positioningMessage": "Enterprise-grade reliability",
          "approach": "Show redundancy/uptime proof using positioning differentiators",
          "channels": ["Technical blogs", "Case studies"],
          "trustedVoices": ["CIOs at similar companies", "Gartner analysts"]
        },
        {
          "lever": "Aspiration activation",
          "positioningMessage": "Innovation enabler",
          "approach": "Position as innovation catalyst using 'deploy 10x faster' message",
          "channels": ["LinkedIn thought leadership", "Executive briefings"],
          "trustedVoices": ["Innovation-focused executives"]
        }
      ],
      "touchpointStrategy": {
        "phase1_awareness": {
          "objective": "Establish credibility on uptime concerns",
          "channels": ["Reddit r/sysadmin", "IT blogs", "LinkedIn"],
          "messageFraming": "Peer-to-peer technical validation"
        },
        "phase2_consideration": {
          "objective": "Demonstrate ROI + peer adoption",
          "channels": ["Case studies", "Webinars with customers"],
          "messageFraming": "Evidence-based decision support"
        }
      }
    }
  ]
}
```

**Why this is better:**
- Directly uses psychological research
- Creates influence strategies, not generic tactics
- Structures data for content generation

---

### 2. **Tactical Orchestration Engine** (`niv-blueprint-tactical-orchestrator`)

**Purpose:** Generate the Four-Pillar orchestration strategy based on influence strategies

**Input:**
- Influence strategies (from mapper)
- Available resources (journalists, events from research)
- Campaign goal + duration

**What it does:**
- For each phase (awareness, consideration, conversion, advocacy):
  - **Pillar 1 (Owned):** What org creates, who creates it, platform strategy
  - **Pillar 2 (Relationships):** Who to influence, what content THEY need (not what we say)
  - **Pillar 3 (Events):** Where to show up, what to prepare/distribute
  - **Pillar 4 (Media):** Which journalists, what angles align with their beats

**Key difference from current:**
- Doesn't generate content descriptions
- Creates STRUCTURED REQUESTS for niv-content-intelligent-v2

**Output:**
```json
{
  "phase1_awareness": {
    "pillar1_ownedActions": {
      "organizationalVoice": [
        {
          "creator": "CTO",
          "platform": "LinkedIn + Engineering Blog",
          "contentRequests": [
            {
              "contentType": "blog-post",
              "targetStakeholder": "Enterprise IT Directors",
              "psychologicalLever": "Fear mitigation - uptime concerns",
              "messageFraming": "Technical peer validation",
              "requiredElements": {
                "toneOfVoice": "Technical expert to expert",
                "positioningMessage": "Enterprise-grade reliability",
                "keyPoints": [
                  "Redundancy architecture (positioning differentiator)",
                  "99.99% uptime proof (positioning key message)",
                  "Peer testimonials from F500 companies (positioning proof)"
                ],
                "callToAction": "Download technical whitepaper",
                "proofPoints": [
                  "Customer uptime data",
                  "Architecture diagrams",
                  "Built by former AWS engineers (positioning differentiator)"
                ]
              },
              "timing": "Week 1, Tuesday",
              "distributionChannels": ["LinkedIn", "Reddit r/sysadmin", "HackerNews"],
              "successMetric": "50+ shares in target communities"
            }
          ]
        }
      ]
    },
    "pillar2_relationshipOrchestration": {
      "tier1Influencers": [
        {
          "profile": {
            "stakeholderSegment": "IT Director influencers",
            "discoveryCriteria": ["10K+ LinkedIn followers", "Regular tech blog author", "Works at F500"],
            "exampleTargets": ["Sarah Chen (LinkedIn)", "Mike Roberts (CIO.com contributor)"]
          },
          "engagementStrategy": {
            "objective": "Get them to validate our uptime claims",
            "contentToCreateForThem": [
              {
                "contentType": "white-paper",
                "purpose": "Give them data-driven content they can reference",
                "psychologicalLever": "Make them look knowledgeable to their audience",
                "requiredElements": {
                  "format": "Technical deep-dive with original research",
                  "dataPoints": ["Industry uptime benchmarks", "Cost of downtime calculator"],
                  "shareableAssets": ["Infographic", "Key stats they can tweet"]
                },
                "deliveryMethod": "Direct outreach via LinkedIn",
                "timing": "Week 1"
              }
            ]
          }
        }
      ]
    }
  }
}
```

**Why this is better:**
- Content requests are structured for niv-content-intelligent-v2
- Includes psychological context (why this message works)
- Specifies required elements, not the content itself

---

### 3. **Counter-Narrative Scenario Planner** (`niv-blueprint-scenario-planner`)

**Purpose:** Generate threat scenarios and response playbooks

**Input:**
- Competitive positioning from research
- Narrative vacuums/risks
- Campaign positioning

**What it does:**
- Identify likely counter-narratives
- Create response playbooks with content needs
- Map threats to mitigation strategies

**Output:**
```json
{
  "threatScenarios": [
    {
      "threat": "Competitor claims our uptime is inflated",
      "likelihood": "High",
      "earlyWarning": "Social media monitoring for 'uptime' + brand mentions",
      "responseSLA": "4 hours to draft, 6 hours to publish",
      "responsePlaybook": {
        "pillar1": {
          "contentRequest": {
            "contentType": "crisis-response + qa-document",
            "psychologicalLever": "Transparency builds trust",
            "requiredElements": {
              "toneOfVoice": "Calm, factual, data-driven",
              "dataProof": ["Third-party monitoring dashboard", "Customer testimonials"],
              "format": "Blog post + FAQ + executive statement"
            }
          }
        },
        "pillar2": {
          "activationStrategy": "Alert advocate influencers with pre-drafted testimonials",
          "contentRequest": {
            "contentType": "advocate-testimonial-kit",
            "requiredElements": ["Tweet templates", "Key talking points", "Data screenshots"]
          }
        }
      }
    }
  ]
}
```

---

### 4. **Resource Requirements Calculator** (`niv-blueprint-resource-calculator`)

**Purpose:** Calculate bandwidth, budget, and adaptation metrics

**Input:**
- Tactical orchestration output
- Organization context

**What it does:**
- Count content pieces across all phases/pillars
- Estimate time per piece type
- Calculate budget needs
- Define leading indicators

**Output:**
```json
{
  "teamBandwidth": {
    "contentCreation": {
      "totalPieces": 47,
      "breakdown": {
        "blog-post": 8,
        "social-post": 20,
        "white-paper": 3,
        "case-study": 2
      },
      "estimatedHours": {
        "signaldesk_platform": "15 hrs/week (AI-assisted generation)",
        "user_review_editing": "8 hrs/week",
        "executive_participation": "3 hrs/week (interviews, quotes)"
      }
    }
  },
  "leadingIndicators": [
    {
      "checkpoint": "Week 2",
      "metric": "Organic shares of uptime content",
      "target": "50+ shares in IT communities",
      "measurementMethod": "Social listening for shared URLs",
      "pivotTrigger": "If <20 shares, shift messaging from technical to business value"
    }
  ]
}
```

---

### 5. **Pattern Selector & Guidance** (`niv-blueprint-pattern-selector`)

**Purpose:** Select optimal campaign pattern and provide execution guidance

**Input:**
- Campaign goal
- Historical insights from research
- Timeline/urgency

**What it does:**
- Analyze goal/context → recommend pattern
- Explain pattern pillar emphasis
- Provide execution adjustments

**Output:**
```json
{
  "selectedPattern": {
    "pattern": "CHORUS",
    "rationale": "Multiple independent voices needed for B2B credibility",
    "pillarEmphasis": {
      "pillar1_owned": "Medium - Foundation content",
      "pillar2_relationships": "Heavy - Key to pattern success",
      "pillar3_events": "Medium - Legitimacy building",
      "pillar4_media": "Heavy - Third-party validation critical"
    },
    "timingStrategy": "Coordinate Pillar 2 (influencers) and Pillar 4 (media) in same week for convergence effect",
    "executionAdjustments": [
      "Front-load relationship building (2 weeks before owned content)",
      "Time media pitches to coincide with influencer posts",
      "Create shareable assets influencers want to use"
    ]
  }
}
```

---

## Orchestrator & Compilation

### 6. **Blueprint Orchestrator** (`niv-blueprint-orchestrator-v2`)

**Purpose:** Coordinate all capability functions and compile final blueprint

**Flow:**
1. Call functions in parallel:
   - `niv-blueprint-influence-mapper`
   - `niv-blueprint-pattern-selector`
2. Pass results to:
   - `niv-blueprint-tactical-orchestrator` (needs influence strategies + pattern)
   - `niv-blueprint-scenario-planner` (needs influence strategies)
3. Calculate resources:
   - `niv-blueprint-resource-calculator` (needs tactical output)
4. Compile into 6-part blueprint structure

**Why parallel:**
- Influence mapper and pattern selector are independent
- Speeds up generation
- Cleaner separation of concerns

---

## How This Flows to niv-content-intelligent-v2

### Current Problem:
Blueprint says: "Create a blog post about our reliability"

niv-content-intelligent-v2 receives: Generic instruction with no psychological context

### New Approach:
Blueprint says:
```json
{
  "contentType": "blog-post",
  "targetStakeholder": "Enterprise IT Directors",
  "psychologicalLever": "Fear mitigation - uptime concerns",
  "messageFraming": "Technical peer validation",
  "requiredElements": {
    "toneOfVoice": "Technical expert to expert",
    "keyPoints": ["Redundancy architecture", "99.99% uptime proof"],
    "proofPoints": ["Customer uptime data", "Architecture diagrams"],
    "callToAction": "Download technical whitepaper"
  }
}
```

niv-content-intelligent-v2 receives: **Rich context about WHO, WHY, and HOW**

---

## Benefits of This Architecture

1. **Psychological depth:** Actually uses the research insights
2. **Clean separation:** Strategy (blueprint) vs. execution (content generation)
3. **Better content:** niv-content-intelligent-v2 has context to create persuasive content
4. **Maintainable:** Each capability function has a single responsibility
5. **Testable:** Can test influence mapping separate from tactical generation
6. **Parallelizable:** Functions can run concurrently

---

## Implementation Priority

1. **Phase 1:** Build core capability functions
   - niv-blueprint-influence-mapper
   - niv-blueprint-tactical-orchestrator
   - niv-blueprint-orchestrator-v2

2. **Phase 2:** Add supporting functions
   - niv-blueprint-scenario-planner
   - niv-blueprint-resource-calculator
   - niv-blueprint-pattern-selector

3. **Phase 3:** Update niv-content-intelligent-v2
   - Accept rich structured requests
   - Use psychological context in generation

---

## Timeout Mitigation Strategy

### Critical Design Principle: AVOID TIMEOUTS

**Problem:** Current blueprint generation can timeout (max_tokens exhausted, API timeouts, long generation times)

**Solutions:**

### 1. **Keep Each Function Focused & Fast**
- Influence mapper: ~10-15 seconds (just mapping, not generating content)
- Tactical orchestrator: ~20-30 seconds (structured requests, not content)
- Scenario planner: ~10 seconds (3-5 scenarios max)
- Resource calculator: ~5 seconds (mostly arithmetic)
- Pattern selector: ~5 seconds (decision tree logic)

**Total parallel time: ~30 seconds** (influence + pattern run concurrently)
**Total sequential time: ~20-30 seconds** (tactical orchestrator is longest)
**Total end-to-end: ~50-60 seconds**

### 2. **Parallel Execution Where Possible**
```typescript
// Run these concurrently (independent inputs)
const [influenceStrategies, patternGuidance] = await Promise.all([
  callInfluenceMapper(research, positioning, goal),
  callPatternSelector(research, goal)
])

// Then run these (depend on above)
const [tacticalPlan, scenarios] = await Promise.all([
  callTacticalOrchestrator(influenceStrategies, patternGuidance, research),
  callScenarioPlanner(influenceStrategies, research)
])

// Finally calculate resources (depends on tactical plan)
const resources = await callResourceCalculator(tacticalPlan)
```

### 3. **Limit Output Tokens Per Function**
- Influence mapper: max_tokens: 3000
- Tactical orchestrator: max_tokens: 6000 (largest, but still manageable)
- Scenario planner: max_tokens: 2000
- Resource calculator: max_tokens: 1500
- Pattern selector: max_tokens: 1500

**Total tokens: ~14,000** (much less than single 16K blueprint generation)

### 4. **Streaming Not Required**
- Each function returns structured JSON
- No need for streaming (faster, simpler)
- Orchestrator can show progress: "Mapping influence strategies... ✓"

### 5. **Retry Logic for Individual Functions**
```typescript
async function callWithRetry(fn, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries) throw error
      console.log(`Retry ${i + 1}/${maxRetries}...`)
      await sleep(1000 * Math.pow(2, i)) // Exponential backoff
    }
  }
}
```

### 6. **Fail-Fast on Individual Functions**
- If influence mapper fails → can't continue (it's foundational)
- If scenario planner fails → continue without counter-narratives (not critical)
- If resource calculator fails → use default estimates

### 7. **Progress Updates to Frontend**
```typescript
// Orchestrator sends progress updates
await supabase.from('blueprint_generation_progress').update({
  status: 'influence_mapping_complete',
  progress: 30
}).eq('id', blueprintId)
```

Frontend can show:
- ⏳ Mapping influence strategies... (0-30%)
- ⏳ Generating tactical orchestration... (30-70%)
- ⏳ Planning scenarios... (70-85%)
- ⏳ Calculating resources... (85-95%)
- ✅ Compiling blueprint... (95-100%)

### 8. **Database-Backed Progress (Optional)**
If we're really paranoid about timeouts:
```typescript
// Store partial results in database as we go
await savePartialBlueprint(blueprintId, {
  influenceStrategies: result1,
  patternGuidance: result2,
  status: 'tactical_orchestration_in_progress'
})

// If timeout occurs, can resume from last checkpoint
```

### 9. **Emergency Fallback**
If orchestrator times out entirely:
- Frontend can detect timeout
- Show "Generation taking longer than expected. Check back in 30 seconds"
- Backend continues processing
- Poll for completion

### 10. **Testing Under Load**
- Test with FULL 4-phase orchestration (all pillars)
- Measure actual times for each function
- Set appropriate timeouts per function (30s each max)
- Set orchestrator timeout to 2 minutes total

---

## Timeout Benchmarks to Monitor

| Function | Target Time | Max Acceptable | Action if Exceeded |
|----------|-------------|----------------|-------------------|
| Influence Mapper | 15s | 30s | Reduce stakeholder count or simplify |
| Tactical Orchestrator | 25s | 45s | Generate 2 phases at a time, not 4 |
| Scenario Planner | 10s | 20s | Limit to 3 scenarios max |
| Resource Calculator | 5s | 10s | Use templates |
| Pattern Selector | 5s | 10s | Use decision tree |
| **Total Pipeline** | 60s | 120s | Split into 2 sequential calls |

---

## Next Steps

1. Build influence mapper prototype with timeout monitoring
2. Test with real CampaignIntelligenceBrief data
3. Measure actual execution times
4. Implement orchestrator with parallel execution
5. Add progress tracking
6. Test end-to-end: Research → Blueprint → Content generation
