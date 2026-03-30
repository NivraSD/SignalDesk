# Firecrawl-Enhanced Blueprint Generation Architecture

**Date:** 2025-10-14
**Status:** NEW SYSTEM DESIGN (not yet implemented)

---

## The Problem We're Solving

Current system only generates orchestration strategy properly. Other blueprint parts (goals, stakeholders, counter-narrative, execution, patterns) are either missing or poorly populated in the UI.

## The Solution

**Two-Phase Architecture:**
1. **Phase 1: Enhanced Data Extraction** - Use Firecrawl to extract rich structured data from sources
2. **Phase 2: Parallel Blueprint Generation** - Generate each blueprint section in parallel, then synthesize

---

## Phase 1: Enhanced Data Extraction Edge Functions

### New Function: `niv-blueprint-data-enricher`

**Purpose:** Take research synthesis and use Firecrawl to extract deeper intelligence

**Input:**
```typescript
{
  researchSynthesis: CampaignIntelligenceBrief,
  campaignGoal: string,
  organizationContext: {
    name: string,
    industry: string,
    competitors: string[]
  }
}
```

**Extraction Tasks (Parallel):**

#### 1. Competitor Deep Dive
```typescript
// For each competitor, scrape their site with extraction schema
await mcp_firecrawl.extract_intelligence({
  url: competitor.website,
  schema: {
    quotes: true,           // Executive quotes for messaging analysis
    metrics: true,          // Their claimed metrics/stats
    entities: true,         // Key people, products
    key_points: true        // Their positioning claims
  }
})
```

#### 2. Case Study Extraction
```typescript
// Find relevant case studies and extract structured data
const caseStudies = await knowledge_library_registry.search({
  query: `${industry} campaign case studies`,
  limit: 10
})

// Extract from top case studies
for (const study of caseStudies.slice(0, 5)) {
  await mcp_firecrawl.batch_scrape_articles({
    articles: [{ url: study.url, priority: 1 }],
    extractSchema: {
      campaign_goal: { type: 'string' },
      tactics_used: { type: 'array', items: { type: 'string' } },
      success_metrics: { type: 'object' },
      key_learnings: { type: 'array', items: { type: 'string' } },
      budget_range: { type: 'string' },
      timeline: { type: 'string' }
    }
  })
}
```

#### 3. Journalist Profile Extraction
```typescript
// Enhance journalist data with byline analysis
for (const journalist of researchSynthesis.channelIntelligence.journalists) {
  // Search for their recent articles
  const articles = await niv_fireplexity.search({
    query: `${journalist.name} ${journalist.outlet} articles`,
    timeWindow: '30d',
    maxResults: 5
  })

  // Extract their writing patterns
  await mcp_firecrawl.batch_scrape_articles({
    articles: articles.map(a => ({ url: a.url, priority: 1 })),
    extractSchema: {
      topics_covered: { type: 'array', items: { type: 'string' } },
      writing_angle: { type: 'string' },
      sources_quoted: { type: 'array', items: { type: 'string' } },
      typical_framing: { type: 'string' }
    }
  })
}
```

#### 4. Stakeholder Behavior Patterns
```typescript
// Extract from forums/communities where stakeholders congregate
const communities = researchSynthesis.stakeholders.flatMap(s =>
  s.informationDiet.primarySources.filter(src =>
    src.includes('reddit') || src.includes('forum') || src.includes('community')
  )
)

// Scrape recent discussions
await mcp_firecrawl.batch_scrape_articles({
  articles: communities.map(url => ({ url, priority: 1 })),
  extractSchema: {
    common_pain_points: { type: 'array', items: { type: 'string' } },
    objections_to_solutions: { type: 'array', items: { type: 'string' } },
    trust_signals: { type: 'array', items: { type: 'string' } },
    decision_criteria: { type: 'array', items: { type: 'string' } }
  }
})
```

**Output: Enhanced Intelligence Brief**
```typescript
{
  // Original research synthesis
  ...researchSynthesis,

  // NEW: Enhanced data from Firecrawl extraction
  enhancedIntelligence: {
    competitorInsights: [
      {
        competitor: "CompanyX",
        claimedMetrics: ["50% faster", "$2M saved"],
        executiveQuotes: ["We're the market leader in..."],
        positioningClaims: ["First to market", "Enterprise-grade"],
        vulnerabilities: ["No mobile app mentioned", "Complex pricing"]
      }
    ],

    provenCampaignTactics: [
      {
        tactic: "Thought leadership series",
        successRate: "high",
        typicalBudget: "$5-10K",
        timeline: "8-12 weeks",
        bestFor: ["B2B", "Enterprise"],
        evidence: "3 case studies"
      }
    ],

    journalistProfiles: [
      {
        journalist: "Sarah Johnson",
        outlet: "TechCrunch",
        recentTopics: ["AI safety", "Enterprise AI", "Startup funding"],
        typicalAngle: "Skeptical but fair",
        quotedSourceTypes: ["Founders", "VCs", "Researchers"],
        pitchingStrategy: "Data-driven stories with new research"
      }
    ],

    stakeholderBehaviors: [
      {
        stakeholder: "Enterprise IT Buyers",
        painPoints: ["Integration complexity", "Budget justification"],
        objectionPatterns: ["Vendor lock-in", "ROI uncertainty"],
        trustSignals: ["Analyst reports", "Peer recommendations"],
        decisionProcess: "3-6 month eval, multiple stakeholders"
      }
    ]
  }
}
```

---

## Phase 2: Parallel Blueprint Section Generators

Instead of ONE massive blueprint generator, create **6 specialized generators** that run in parallel:

### Generator 1: `niv-blueprint-goals`
**Input:** Enhanced intelligence + campaign goal
**Output:** Part 1 - Goal Framework
```typescript
{
  part1_goalFramework: {
    primaryObjective: "Measurable objective based on stakeholder behaviors",
    behavioralGoals: [
      {
        stakeholder: "Enterprise IT Buyers",
        currentBehavior: "Considering competitors only",
        desiredBehavior: "Include us in RFP shortlist",
        measurementMethod: "RFP mentions tracked",
        successMetric: "3+ enterprise RFPs in 90 days",
        // NEW: Based on extracted decision criteria
        keyInfluencers: ["Gartner analysts", "Peer CIOs"],
        typicalTimeline: "90-120 days based on case study analysis"
      }
    ],
    kpis: [
      "Website traffic from target accounts (derived from stakeholder sources)",
      "Content engagement from decision-makers",
      "Inbound RFP requests"
    ],
    successCriteria: "Based on proven campaign benchmarks from case studies",
    riskAssessment: [
      {
        risk: "Competitor launches similar messaging",
        probability: "Medium (extracted from competitor analysis)",
        mitigation: "Differentiate on [extracted vulnerability]"
      }
    ]
  }
}
```

### Generator 2: `niv-blueprint-stakeholders`
**Input:** Enhanced intelligence (stakeholder behaviors)
**Output:** Part 2 - Stakeholder Mapping
```typescript
{
  part2_stakeholderMapping: {
    groups: [
      {
        name: "Enterprise IT Buyers",
        size: "Estimated 50,000 in North America",
        // ENHANCED with extracted behavior patterns
        psychologicalProfile: {
          values: ["Risk mitigation", "Peer validation"],
          fears: ["Vendor lock-in (from forum analysis)", "Budget overrun"],
          aspirations: ["Career advancement", "Smooth deployment"],
          decisionDrivers: ["ROI proof", "Reference customers"]
        },
        // ENHANCED with extracted community intelligence
        realWorldBehaviors: {
          whereTheyDiscuss: ["r/sysadmin", "Spiceworks forums"],
          commonQuestions: ["Integration time?", "Support SLAs?"],
          dealBreakers: ["No API", "Unclear pricing"],
          peersTheyTrust: ["Senior SysAdmins with 10+ years"]
        },
        // ENHANCED with extracted competitor data
        competitiveContext: {
          competitorPerceptions: {
            "CompanyX": "Market leader but expensive",
            "CompanyY": "Cheap but unreliable"
          },
          narrativeGap: "Need: reliable AND affordable solution"
        }
      }
    ],
    stakeholderRelationships: "Enhanced with extracted influence patterns",
    priorityOrder: ["Based on case study success patterns"]
  }
}
```

### Generator 3: `niv-blueprint-orchestration`
**Input:** Enhanced intelligence (ALL of it)
**Output:** Part 3 - Four-Pillar Orchestration
```typescript
{
  part3_orchestrationStrategy: {
    phases: {
      phase1_awareness: {
        objective: "Based on extracted stakeholder decision journey",
        duration: "Based on case study timelines",

        pillar1_ownedActions: {
          // ENHANCED with proven tactics from case studies
          contentNeeds: [
            {
              contentType: "white-paper",
              topic: "ROI Calculator (proven in 3 case studies)",
              purpose: "Address extracted pain point: budget justification",
              targetStakeholder: "Enterprise IT Buyers",
              timing: "Week 1",
              signaldeskGenerates: "White paper with calculator",
              userExecutes: "Gate behind form, promote in communities",
              successMetric: "50+ downloads (benchmark from case studies)",
              // NEW: Enhanced with extraction data
              mustInclude: {
                dataPoints: ["Based on competitor claimed metrics"],
                trustSignals: ["Reference Gartner if available"],
                addressObjections: ["From forum analysis"]
              }
            }
          ]
        },

        pillar2_relationshipOrchestration: {
          // ENHANCED with extracted analyst/influencer data
          tier1Influencers: [
            {
              name: "Industry Analyst Name (if found in extraction)",
              source: "Extracted from competitive analysis",
              relevance: "Quoted by target journalists",
              engagementStrategy: {
                approach: "Briefing with differentiated data",
                contentForThem: "Exclusive research findings",
                // NEW: Based on their extracted preferences
                preferredFormat: "Zoom briefing with slide deck",
                followUpCadence: "Quarterly updates"
              }
            }
          ]
        },

        pillar4_mediaEngagement: {
          // ENHANCED with journalist profile extraction
          outletStrategy: [
            {
              journalist: "Sarah Johnson",
              outlet: "TechCrunch",
              beat: "Enterprise AI",
              // NEW: Extracted from byline analysis
              recentFocus: ["AI safety regulations", "Enterprise adoption"],
              typicalSources: ["Founders", "Technical experts"],
              // NEW: Customized pitch based on extraction
              storyAngle: "Data-driven story about AI ROI (matches her style)",
              hook: "New research shows [data from our research]",
              timing: "Week 2 (after white paper launch)",
              pitchCustomization: {
                leadWith: "Exclusive data (she prefers this)",
                includeExperts: "CTO + customer",
                formatPreference: "Email pitch + press kit"
              }
            }
          ]
        }
      }
    }
  }
}
```

### Generator 4: `niv-blueprint-counter-narrative`
**Input:** Enhanced intelligence (competitor + narrative data)
**Output:** Part 4 - Counter-Narrative Strategy
```typescript
{
  part4_counterNarrative: {
    threatScenarios: [
      {
        threat: "Competitor attacks our pricing",
        // NEW: Based on extracted competitor messaging
        likelySource: "CompanyX (they emphasize 'enterprise-grade' = expensive justification)",
        earlyWarningSignals: [
          "Blog posts about 'hidden costs of cheap solutions'",
          "Sales team mentions in forums (extracted pattern)"
        ],
        // NEW: Response based on extracted vulnerabilities
        responsePlaybook: {
          pillar1Owned: {
            contentType: "blog-post + comparison-chart",
            topic: "Total Cost of Ownership Analysis",
            // NEW: Leverage extracted competitor weakness
            keyPoint: "Include CompanyX integration costs (from extraction)",
            signaldeskGenerates: "TCO calculator with real data"
          },
          pillar2Relationships: {
            activation: "Alert analyst who covers pricing",
            // NEW: Based on extracted analyst preferences
            contentType: "Briefing deck with pricing breakdown"
          }
        }
      }
    ]
  }
}
```

### Generator 5: `niv-blueprint-execution`
**Input:** Parts 1-4 + Enhanced intelligence (case study data)
**Output:** Part 5 - Execution Requirements
```typescript
{
  part5_executionRequirements: {
    teamBandwidth: {
      // NEW: Based on extracted case study resource requirements
      minimumViable: {
        roles: [
          "1 person: Content (10 hrs/week) - from case study benchmarks",
          "1 person: Outreach (8 hrs/week) - realistic based on pilot data",
          "0.5 executive: Briefings (3 hrs/week)"
        ],
        totalCommitment: "21 hours/week (proven in similar campaigns)"
      }
    },
    budgetConsiderations: {
      // NEW: Based on extracted case study budgets
      benchmarks: {
        similar_campaigns: "$15-25K for 12 weeks",
        breakdown: {
          paid_amplification: "$5-8K (optional)",
          tools: "$2-3K (monitoring, design)",
          events: "$5-10K (if attending conferences)"
        }
      }
    },
    // NEW: Risk indicators from case study analysis
    leadingIndicators: [
      {
        checkpoint: "Week 2",
        metric: "White paper downloads",
        target: "50+ (benchmark from case studies)",
        source: "Proven in 3 similar campaigns",
        ifMiss: "Survey downloaders, adjust messaging"
      }
    ]
  }
}
```

### Generator 6: `niv-blueprint-patterns`
**Input:** Enhanced intelligence (case study patterns)
**Output:** Part 6 - Pattern Guidance
```typescript
{
  part6_patternGuidance: {
    selectedPattern: {
      patternName: "CASCADE",
      // NEW: Pattern selection based on extracted case study success
      evidenceBase: {
        successfulCampaigns: [
          {
            campaign: "CompanyZ market entry (from case study extraction)",
            approach: "Started with thought leadership → analyst → media cascade",
            timeline: "16 weeks to first tier-1 coverage",
            result: "3 Gartner mentions, 2 TechCrunch articles",
            keyTactic: "White paper → webinar → analyst briefing sequence"
          }
        ],
        whyItFits: "Your stakeholders trust peer validation + analyst endorsement (from behavior extraction)",
        patternModifications: "Add forums engagement (not in original pattern, but extracted as important)"
      },
      pillarEmphasis: {
        pillar1Owned: "Heavy (foundation required - proven in case studies)",
        pillar2Relationships: "Heavy (analysts critical for your space)",
        pillar3Events: "Medium (expensive but validated in case studies)",
        pillar4Media: "Medium-Heavy (comes after analyst validation)"
      },
      timingStrategy: {
        approach: "Slow build (12-16 weeks typical for your space)",
        evidence: "3 case studies show enterprise campaigns need 3-4 months",
        criticalPath: "White paper → Analyst briefing → Media pitch (proven sequence)"
      }
    }
  }
}
```

---

## Phase 3: Final Synthesis

### New Function: `niv-blueprint-synthesizer`

**Purpose:** Take all 6 parallel outputs and create coherent complete blueprint

**Input:**
```typescript
{
  part1_goals: Output from niv-blueprint-goals,
  part2_stakeholders: Output from niv-blueprint-stakeholders,
  part3_orchestration: Output from niv-blueprint-orchestration,
  part4_counterNarrative: Output from niv-blueprint-counter-narrative,
  part5_execution: Output from niv-blueprint-execution,
  part6_patterns: Output from niv-blueprint-patterns,
  enhancedIntelligence: Output from niv-blueprint-data-enricher
}
```

**Tasks:**
1. Check consistency across sections
2. Ensure journalist names match between orchestration and counter-narrative
3. Verify timeline alignment between patterns and execution
4. Cross-reference metrics across goals and execution
5. Add metadata about data sources and extraction quality

**Output:**
```typescript
{
  overview: {
    campaignName: "Generated from goals",
    pattern: "From patterns section",
    duration: "From patterns + execution alignment",
    dataQuality: {
      extractionSuccess: "95% of planned extractions completed",
      caseStudiesAnalyzed: 5,
      competitorProfilesDeep: 3,
      journalistProfilesEnhanced: 12,
      confidenceLevel: "High - backed by extraction data"
    }
  },
  part1_goalFramework: { /* from generator 1 */ },
  part2_stakeholderMapping: { /* from generator 2 */ },
  part3_orchestrationStrategy: { /* from generator 3 */ },
  part4_counterNarrative: { /* from generator 4 */ },
  part5_executionRequirements: { /* from generator 5 */ },
  part6_patternGuidance: { /* from generator 6 */ },

  // NEW: Synthesis metadata
  synthesis: {
    crossReferences: {
      journalistsInOrchestration: 12,
      journalistsInCounterNarrative: 12,
      consistencyCheck: "PASS"
    },
    extractionProvenance: {
      competitorData: ["CompanyX.com", "CompanyY.com"],
      caseStudies: ["url1", "url2", "url3"],
      journalistBylines: ["url1", "url2", ...],
      communityForums: ["reddit.com/r/sysadmin", ...]
    },
    generationMetadata: {
      totalTime: "~45 seconds (parallel generation)",
      extractionTime: "~30 seconds",
      generationTime: "~15 seconds (parallel)",
      synthesisTime: "~5 seconds"
    }
  }
}
```

---

## Implementation Plan

### Step 1: Build Data Enricher (Week 1)
- [ ] Create `niv-blueprint-data-enricher` edge function
- [ ] Implement competitor extraction
- [ ] Implement case study extraction
- [ ] Implement journalist profile extraction
- [ ] Implement community behavior extraction
- [ ] Test with real campaign goal

### Step 2: Build Parallel Generators (Week 2)
- [ ] Create `niv-blueprint-goals` edge function
- [ ] Create `niv-blueprint-stakeholders` edge function
- [ ] Create `niv-blueprint-orchestration` edge function (rewrite existing)
- [ ] Create `niv-blueprint-counter-narrative` edge function (rewrite existing)
- [ ] Create `niv-blueprint-execution` edge function (rewrite existing)
- [ ] Create `niv-blueprint-patterns` edge function (rewrite existing)

### Step 3: Build Synthesizer (Week 3)
- [ ] Create `niv-blueprint-synthesizer` edge function
- [ ] Implement consistency checking
- [ ] Implement cross-reference validation
- [ ] Add provenance tracking

### Step 4: Update Orchestrator (Week 3)
- [ ] Update `niv-campaign-blueprint-orchestrator` to:
  1. Call data enricher first
  2. Call 6 generators in parallel
  3. Call synthesizer last
  4. Return complete blueprint

### Step 5: Frontend Updates (Week 4)
- [ ] Update `BlueprintPresentation.tsx` to show all 6 sections properly
- [ ] Add "Data Sources" tab showing extraction provenance
- [ ] Add confidence indicators based on extraction quality

---

## Expected Benefits

### Data Quality
- **Competitor analysis:** Real quotes, metrics, positioning from their sites (not assumed)
- **Tactics:** Proven from actual case studies (not generic advice)
- **Journalist targeting:** Based on real byline analysis (not guessed)
- **Stakeholder insights:** From actual community discussions (not assumptions)

### Blueprint Completeness
- **All 6 sections** properly populated (not just orchestration)
- **Cross-referenced** data (journalist names consistent across sections)
- **Evidence-based** recommendations (every tactic cites source)
- **Realistic** timelines and budgets (from case study benchmarks)

### Speed
- **Parallel generation:** 15 seconds vs 90+ seconds sequential
- **Extraction:** 30 seconds upfront investment
- **Total:** ~45 seconds for complete, evidence-based blueprint

### User Trust
- **Provenance tracking:** "This tactic worked in 3 similar campaigns [links]"
- **Data transparency:** "Based on 5 competitor analyses + 12 journalist profiles"
- **Confidence scoring:** "High confidence (95% extraction success)"

---

## Cost Analysis

### Firecrawl Extraction Costs (per campaign)
- Competitor sites: 3 URLs × $0.01 = $0.03
- Case studies: 5 URLs × $0.01 = $0.05
- Journalist bylines: 12 journalists × 5 articles × $0.01 = $0.60
- Community forums: 5 URLs × $0.01 = $0.05
- **Total extraction:** ~$0.75 per campaign

### Claude API Costs (parallel generation)
- Data enricher: ~2K tokens input, 3K output = $0.08
- 6 parallel generators: ~6K tokens input each, ~5K output each = 6 × $0.10 = $0.60
- Synthesizer: ~20K tokens input, 2K output = $0.20
- **Total generation:** ~$0.88 per campaign

### Total Cost per Blueprint
**$1.63** for evidence-based, extraction-enhanced blueprint
(vs current $0.30 for partial/generic blueprint)

**ROI:** 5x cost increase for 10x quality increase = worthwhile

---

## Next Steps

1. **You decide:** Should we proceed with this architecture?
2. **Prioritize:** Which generator should we build first to prove value?
3. **Test:** Run extraction on a real campaign goal to validate data quality
4. **Iterate:** Build one section at a time, test in UI, refine

This architecture solves:
✅ Only orchestration showing (all 6 sections generated in parallel)
✅ Generic advice (evidence-based from extractions)
✅ Inconsistent data (synthesizer validates cross-references)
✅ Slow generation (parallel = 3x faster)
