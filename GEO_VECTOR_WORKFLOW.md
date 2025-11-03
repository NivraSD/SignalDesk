# GEO-VECTOR Campaign Workflow (Mirroring VECTOR)

**Date:** November 3, 2025
**Purpose:** Define GEO-VECTOR workflow parallel to existing VECTOR campaigns

---

## Existing VECTOR Campaign Flow

```
1. INTELLIGENCE (campaignBuilderService.startResearchPipeline)
   ├─ mcp-discovery (organization profile)
   ├─ niv-fireplexity (stakeholder intelligence)
   ├─ niv-fireplexity (narrative landscape)
   ├─ journalist-registry (channel intelligence)
   ├─ knowledge-library-registry (historical patterns)
   └─ niv-campaign-research-synthesis → CampaignIntelligenceBrief

2. POSITIONING (user selects or AI generates)
   └─ Stored in campaign_builder_sessions.selected_positioning

3. BLUEPRINT (niv-campaign-vector-blueprint)
   ├─ Takes: researchData + campaignGoal + selectedPositioning
   ├─ Generates: Complete VECTOR blueprint with 4 pillars
   │   ├─ Part 1: Goal Framework
   │   ├─ Part 2: Stakeholder Mapping
   │   ├─ Part 3: Four-Pillar Orchestration (Owned, Relationships, Events, Media)
   │   ├─ Part 4: Resource Requirements
   │   └─ Part 5: Execution Roadmap
   └─ Stored in campaign_builder_sessions.blueprint

4. EXECUTE (ExecuteTab + niv-content-intelligent-v2)
   └─ User generates specific content from blueprint

5. STRATEGIC PLANNING (StrategicPlanningModuleV3Complete)
   ├─ Displays blueprint in 4-pillar structure
   ├─ Shows content needs for each phase
   └─ User executes actions
```

---

## GEO-VECTOR Campaign Flow (New)

```
1. INTELLIGENCE (GEO-specific research)
   ├─ mcp-discovery (organization profile) ← SAME
   ├─ niv-geo-intelligence-monitor (AI platform testing) ← NEW
   │   └─ Tests target queries on ChatGPT, Claude, Perplexity, Gemini
   ├─ niv-geo-source-analyzer ← NEW
   │   └─ Identifies which sources AI platforms cite (Reddit, YouTube, docs, etc.)
   └─ niv-geo-research-synthesis → GeoIntelligenceBrief ← NEW

2. OBJECTIVE SELECTION (replaces Positioning for GEO)
   ├─ User selects: drive_sales | thought_leadership | technical_adoption
   ├─ User provides constraints:
   │   ├─ time_per_week
   │   ├─ technical_capability
   │   └─ current_presence (G2, YouTube, docs, etc.)
   └─ niv-geo-content-selector → Selected content types (8-12) ← ALREADY BUILT ✅

3. BLUEPRINT (niv-geo-vector-orchestrator) ← WE'RE BUILDING THIS
   ├─ Takes: geoResearchData + objective + selectedContentTypes
   ├─ Generates: Complete GEO-VECTOR blueprint
   │   ├─ Strategic Foundation (objective, target queries, success metrics)
   │   ├─ GEO Source Analysis (Reddit priority, YouTube gaps, schema needs)
   │   ├─ Three-Tier Tactical Plan:
   │   │   ├─ AUTOMATED (SignalDesk generates, user deploys)
   │   │   └─ USER-ASSISTED (SignalDesk provides scripts, user executes)
   │   ├─ Resource Requirements
   │   └─ Execution Roadmap (12 weeks)
   └─ Stored in campaign_builder_sessions.blueprint

4. EXECUTE (ExecuteTab + niv-content-intelligent-v2) ← SAME
   └─ Generates content from selected types

5. STRATEGIC PLANNING (GeoVectorPlanningView) ← NEW UI
   ├─ Displays blueprint in 2-tier structure (Automated / User-Assisted)
   ├─ Shows deliverables for each content type
   └─ User executes actions
```

---

## Key Differences

| Aspect | VECTOR | GEO-VECTOR |
|--------|--------|------------|
| **Target Audience** | Humans (journalists, stakeholders, influencers) | AI Platforms (ChatGPT, Claude, Perplexity, Gemini) |
| **Intelligence** | Stakeholders, narratives, journalists | AI platform testing, source analysis |
| **Strategy Selection** | Positioning (narrative approach) | Objective (business goal) |
| **Tactical Structure** | 4 Pillars (Owned, Relationships, Events, Media) | 2 Tiers (Automated, User-Assisted) |
| **Content Selection** | AI chooses from 44 types based on strategy | AI chooses 8-12 types based on objective + constraints |
| **Success Metrics** | Media coverage, stakeholder perception | AI citation rate, visibility increase |
| **Timeline** | 12 weeks with 4 phases | 12 weeks with continuous execution |

---

## Database Schema Match

### VECTOR Campaigns

```sql
campaign_builder_sessions:
  - id
  - organization_id
  - campaign_goal
  - current_stage: 'intent' | 'research' | 'positioning' | 'blueprint' | 'execute'
  - research_findings: CampaignIntelligenceBrief
  - selected_positioning: { name, approach, rationale }
  - blueprint: VectorBlueprint (4 pillars)
  - status: 'active' | 'completed'
```

### GEO-VECTOR Campaigns (Same table, different blueprint structure)

```sql
campaign_builder_sessions:
  - id
  - organization_id
  - campaign_goal
  - campaign_type: 'vector' | 'geo_vector' ← ADD THIS
  - current_stage: 'intent' | 'geo_research' | 'objective_selection' | 'blueprint' | 'execute'
  - research_findings: GeoIntelligenceBrief
  - selected_objective: 'drive_sales' | 'thought_leadership' | 'technical_adoption'
  - selected_content_types: { automated: [...], user_assisted: [...] }
  - blueprint: GeoVectorBlueprint (2 tiers)
  - status: 'active' | 'completed'
```

---

## Implementation: niv-geo-vector-orchestrator

### Input Structure

```typescript
{
  // From GEO research
  geoIntelligenceBrief: {
    organizationProfile: { /* mcp-discovery */ },
    aiPlatformResults: {
      chatgpt: { queries_tested, citation_rate, sources_cited },
      claude: { /* ... */ },
      perplexity: { /* ... */ },
      gemini: { /* ... */ }
    },
    sourceOpportunities: {
      reddit: { priority: 'critical', communities: [...], current_presence: 'none' },
      youtube: { priority: 'high', content_gaps: [...] },
      schemas: { priority: 'high', missing_schemas: [...] }
    }
  },

  // From objective selection
  objective: 'drive_sales',
  constraints: {
    time_per_week: 2,
    technical_capability: 'medium'
  },

  // From content selector
  selectedContentTypes: {
    automated: [
      { id: 'schema-optimization', citation_rate: 75 },
      { id: 'case-study', citation_rate: 55 },
      // ... 6 more
    ],
    user_assisted: [
      { id: 'comparison-copy', citation_rate: 65, time_per_week: 1 },
      { id: 'doc-outline', citation_rate: 70, time_per_week: 2 }
    ]
  },

  // Context
  campaignGoal: string,
  organizationName: string
}
```

### Output Structure (GeoVectorBlueprint)

```typescript
{
  type: 'geo_vector',

  strategicFoundation: {
    primaryObjective: 'drive_sales',
    targetQueries: [
      'best CRM for startups',
      'affordable project management tools',
      // ... from research
    ],
    aiPlatformPriorities: {
      chatgpt: { importance: 'critical', rationale: '60% of target audience uses', optimization_focus: 'schemas + case studies' },
      perplexity: { importance: 'high', rationale: 'High citation of comparison content', optimization_focus: 'G2 profile + docs' },
      claude: { importance: 'medium', /* ... */ },
      gemini: { importance: 'medium', /* ... */ }
    },
    successMetrics: [
      '35-50% visibility increase in 10 weeks',
      '80% schema deployment',
      '5+ customer case studies published',
      'Top 3 ranking for target queries on 2+ platforms'
    ]
  },

  geoSourceAnalysis: {
    sourceImportance: {
      reddit: {
        priority: 'critical',
        communities: ['r/startups', 'r/entrepreneur'],
        current_presence: 'none',
        opportunity_score: 95,
        reasoning: '65% of AI responses for startup tools cite Reddit discussions'
      },
      g2_capterra: {
        priority: 'critical',
        current_presence: 'basic_profile',
        opportunity_score: 85,
        reasoning: '70% of comparison queries cite review platforms'
      },
      schemas: {
        priority: 'high',
        missing_schemas: ['Product', 'FAQ', 'AggregateRating'],
        opportunity_score: 90,
        reasoning: '75% citation rate when properly implemented'
      },
      youtube: {
        priority: 'medium',
        content_gaps: ['product demos', 'integration tutorials'],
        opportunity_score: 65,
        reasoning: '45% of how-to queries include video content'
      }
    }
  },

  threeTierTacticalPlan: {
    automated: [
      {
        content_type: 'schema-optimization',
        priority: 1,
        timeline: 'Week 1',
        what_signaldesk_does: 'Generates Product + FAQ + Organization schemas with all fields',
        user_action: 'Add one-line script tag to website <head>',
        deliverables: {
          product_schema: { /* complete schema JSON */ },
          faq_schema: { questions: [...], answers: [...] },
          deployment_script: '<script src="https://signaldesk.com/api/schema/ORG_ID.js"></script>',
          verification_url: 'https://signaldesk.com/verify/ORG_ID'
        },
        citation_rate: 75,
        time_to_impact: '2-4 weeks',
        execution_method: 'one_click',
        success_metric: 'Schema visible to all 4 AI platforms'
      },
      {
        content_type: 'case-study',
        priority: 2,
        timeline: 'Weeks 2-4',
        what_signaldesk_does: 'Writes 3 customer success stories (1500 words each)',
        user_action: 'Review for accuracy, publish to website',
        deliverables: {
          quantity: 3,
          topics: [
            'How Startup X reduced onboarding time by 60%',
            'How Agency Y scaled from 10 to 100 clients',
            'How Enterprise Z improved team productivity 3x'
          ],
          publishing_schedule: '1 per week',
          seo_optimization: true
        },
        citation_rate: 55,
        time_to_impact: '2-4 weeks',
        execution_method: 'generate_and_review',
        success_metric: 'Cited in 3+ AI platform responses'
      },
      // ... 6 more automated actions
    ],

    userAssisted: [
      {
        content_type: 'comparison-copy',
        priority: 1,
        timeline: 'Week 2',
        what_signaldesk_does: [
          'Writes optimized G2 profile description (500 words)',
          'Lists 20 feature highlights',
          'Creates review request email templates (3 variations)',
          'Provides customer outreach strategy'
        ],
        user_action: [
          'Copy-paste description to G2 profile',
          'Update feature list on profile',
          'Send review requests to 10-15 happy customers',
          'Respond to reviews (weekly)'
        ],
        deliverables: {
          profile_description: '...',
          feature_highlights: [...],
          review_request_templates: {
            email_1: '...',
            email_2: '...',
            email_3: '...'
          },
          response_templates: {
            positive_review: '...',
            negative_review: '...',
            neutral_review: '...'
          }
        },
        citation_rate: 65,
        time_to_impact: '2-4 weeks',
        time_estimate: '1 hour setup + 30 min/week',
        success_metric: '10+ reviews in 4 weeks, cited by AI platforms'
      },
      {
        content_type: 'doc-outline',
        priority: 2,
        timeline: 'Weeks 3-5',
        what_signaldesk_does: [
          'Creates documentation structure (10 pages)',
          'Writes FAQ section (20 questions)',
          'Generates use case guides (5 scenarios)',
          'Creates comparison tables (vs 3 competitors)'
        ],
        user_action: [
          'Fill in technical implementation details',
          'Add code examples (if applicable)',
          'Review for technical accuracy',
          'Publish to docs site'
        ],
        deliverables: {
          doc_structure: { /* outline */ },
          faq_content: [...],
          use_case_guides: [...],
          comparison_tables: [...]
        },
        citation_rate: 70,
        time_to_impact: '2-4 weeks',
        time_estimate: '4-6 hours total',
        success_metric: 'Docs cited in 5+ technical queries'
      }
    ]
  },

  executionRoadmap: {
    week1: {
      automated: [
        'Deploy schemas (one-click)',
        'Generate + publish blog post 1'
      ],
      user_assisted: [
        'Verify schema deployment',
        'Setup G2 profile'
      ]
    },
    week2: {
      automated: [
        'Generate case study 1',
        'Generate blog posts 2-3',
        'Generate press release'
      ],
      user_assisted: [
        'Publish case study 1',
        'Send review requests to 5 customers'
      ]
    },
    // ... weeks 3-12
  },

  resourceRequirements: {
    automated_content: {
      count: 8,
      effort: 'Minimal (SignalDesk auto-generates)',
      user_time: '2-3 hours/week for review + publishing'
    },
    user_assisted_content: {
      count: 2,
      effort: 'Moderate (3-4 hours/week)',
      breakdown: [
        { type: 'G2 profile', time: '1 hour setup + 30 min/week' },
        { type: 'Documentation', time: '4-6 hours one-time' }
      ]
    },
    total_timeline: '12 weeks',
    expected_impact: '35-50% visibility increase',
    budget_required: '$0 (all organic content)',
    tools_needed: [
      'Website access (for schema deployment)',
      'G2/Capterra admin access',
      'Docs platform access'
    ]
  }
}
```

---

## Next Step: Build niv-geo-vector-orchestrator

This edge function will:
1. Take GEO research + objective + selected content types
2. Use Claude to generate the complete GeoVectorBlueprint
3. Return structured JSON matching the above schema
4. Save to campaign_builder_sessions.blueprint

**Prompt structure:**
- Similar to niv-campaign-vector-blueprint
- But focused on AI platform optimization vs human influence
- Specific deliverables for each content type
- Clear separation of automated vs user-assisted actions

---

*Workflow Documentation Complete: November 3, 2025*
*Ready to implement niv-geo-vector-orchestrator*
