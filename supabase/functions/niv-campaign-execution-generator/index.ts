import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExecutionRequest {
  blueprintBase: any
  orchestrationStrategy: any
  organizationContext: {
    name: string
    industry: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { blueprintBase, orchestrationStrategy, organizationContext } = await req.json() as ExecutionRequest

    console.log('⚙️ Execution Generator:', {
      pattern: blueprintBase.overview?.pattern,
      phases: Object.keys(orchestrationStrategy.phases || {}).length,
      org: organizationContext.name
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in VECTOR campaign execution and system-level measurement.

## Your Task
Generate Part 5: Execution Requirements & System-Level Success Metrics

## Critical Requirements

**Beyond Vanity Metrics:**
VECTOR campaigns don't measure success by impressions or clicks. They measure:
- **Convergence Score**: How often stakeholders encounter message from multiple independent sources
- **Narrative Ownership**: % of search results, social mentions, media coverage we control
- **Indirect Attribution**: Competitors/media adopting our framing without credit
- **Stakeholder Behavior Change**: Actual actions taken (not just awareness)
- **System State Achievement**: When narrative becomes "common knowledge"

**Team & Resources:**
Calculate realistic bandwidth needs:
- Content creation hours per week
- Relationship management hours per week
- Event preparation/attendance hours
- Media outreach hours
- Tool/platform costs

**Adaptation Strategy:**
How to pivot based on:
- Pillar performance (which is working, which isn't)
- Stakeholder behavior signals
- Narrative environment shifts
- Resource constraints

Output ONLY valid JSON.`

    // Count content pieces across all pillars and phases
    let totalContentPieces = 0
    let mediaOutreachCount = 0
    let eventCount = 0
    let influencerCount = 0

    if (orchestrationStrategy.phases) {
      Object.values(orchestrationStrategy.phases).forEach((phase: any) => {
        // Pillar 1: Owned content
        if (phase.pillar1_ownedActions?.organizationalVoice) {
          phase.pillar1_ownedActions.organizationalVoice.forEach((voice: any) => {
            totalContentPieces += voice.contentNeeds?.length || 0
          })
        }

        // Pillar 2: Relationship content
        if (phase.pillar2_relationshipOrchestration?.tier1Influencers) {
          influencerCount += phase.pillar2_relationshipOrchestration.tier1Influencers.length
          phase.pillar2_relationshipOrchestration.tier1Influencers.forEach((influencer: any) => {
            totalContentPieces += influencer.engagementStrategy?.contentToCreateForThem?.length || 0
          })
        }

        // Pillar 3: Event content
        if (phase.pillar3_eventOrchestration?.tier1Events) {
          eventCount += phase.pillar3_eventOrchestration.tier1Events.length
        }

        // Pillar 4: Media content
        if (phase.pillar4_mediaEngagement?.outletStrategy) {
          phase.pillar4_mediaEngagement.outletStrategy.forEach((tier: any) => {
            mediaOutreachCount += tier.storiesToPitch?.length || 0
          })
        }
      })
    }

    const workloadContext = `## Estimated Workload
- Total content pieces to create: ${totalContentPieces}
- Influencer relationships to manage: ${influencerCount}
- Events to participate in: ${eventCount}
- Media pitches to execute: ${mediaOutreachCount}`

    const userPrompt = `# Campaign Overview
${JSON.stringify(blueprintBase.overview, null, 2)}

# Campaign Duration
${blueprintBase.overview?.duration || '12 weeks'}

# Core Message
${blueprintBase.messageArchitecture?.coreMessage || 'N/A'}

# Organization Context
- Name: ${organizationContext.name}
- Industry: ${organizationContext.industry}

${workloadContext}

## Generate Part 5: Execution Requirements & System Metrics

Create execution plan and system-level measurement framework:

\`\`\`json
{
  "part5_executionRequirements": {
    "teamBandwidth": {
      "roles": [
        {
          "role": "Campaign Director",
          "hoursPerWeek": 15,
          "responsibilities": [
            "Strategic oversight",
            "Stakeholder relationship management",
            "Performance monitoring"
          ],
          "canBeOutsourced": false
        },
        {
          "role": "Content Creator",
          "hoursPerWeek": 20,
          "responsibilities": [
            "Pillar 1 content production (SignalDesk provides drafts)",
            "Content adaptation across channels",
            "Social media engagement"
          ],
          "canBeOutsourced": true,
          "outsourcingOptions": "Fractional content agency or freelancer"
        },
        {
          "role": "Relationship Manager",
          "hoursPerWeek": 10,
          "responsibilities": [
            "Pillar 2 influencer outreach",
            "Pillar 4 journalist relationship building",
            "Partnership coordination"
          ],
          "canBeOutsourced": false,
          "why": "Requires authentic relationship building"
        },
        {
          "role": "Event Coordinator",
          "hoursPerWeek": 8,
          "responsibilities": [
            "Pillar 3 event research and registration",
            "Speaker prep and materials",
            "Event follow-up"
          ],
          "canBeOutsourced": true
        }
      ],
      "totalHoursPerWeek": 53,
      "minimumTeamSize": "2-3 people",
      "recommendedTeamSize": "3-4 people with outsourced content support"
    },

    "budgetRequirements": {
      "essential": [
        {
          "category": "Content Creation Tools",
          "items": [
            "SignalDesk Platform: $X/month (content generation + execution)",
            "Design tools (Canva Pro): $30/month",
            "Video editing (if needed): $50/month"
          ],
          "totalMonthly": 0,
          "notes": "SignalDesk handles bulk of content creation"
        },
        {
          "category": "Media & Event",
          "items": [
            "Event registrations: $2000-5000/quarter",
            "Media database access (if needed): $200/month",
            "Press release distribution (optional): $500/release"
          ],
          "totalMonthly": 1500
        }
      ],
      "optional": [
        {
          "category": "Amplification",
          "items": [
            "LinkedIn/Twitter ads: $1000-3000/month",
            "Influencer partnerships: $500-2000/month",
            "Freelance content support: $2000-4000/month"
          ],
          "notes": "Depends on organic traction"
        }
      ],
      "totalMinimumMonthly": 1500,
      "totalRecommendedMonthly": 3000
    },

    "toolsAndPlatforms": {
      "core": [
        {
          "tool": "SignalDesk",
          "purpose": "Campaign blueprint + content generation + execution tracking",
          "cost": "$X/month"
        },
        {
          "tool": "CRM (HubSpot/Notion)",
          "purpose": "Journalist & influencer relationship tracking",
          "cost": "$0-100/month"
        }
      ],
      "monitoring": [
        {
          "tool": "Google Alerts + Social listening",
          "purpose": "Track narrative spread and convergence",
          "cost": "$0-200/month"
        },
        {
          "tool": "Analytics (Google Analytics + LinkedIn)",
          "purpose": "Track owned channel performance",
          "cost": "$0/month"
        }
      ]
    },

    "weeklyExecutionRhythm": {
      "monday": [
        "Review previous week performance metrics",
        "Identify content for week ahead (SignalDesk generates)",
        "Schedule influencer outreach"
      ],
      "tuesdayThursday": [
        "Publish owned content (Pillar 1)",
        "Execute relationship touchpoints (Pillar 2)",
        "Media outreach activities (Pillar 4)"
      ],
      "friday": [
        "Event prep for following week (Pillar 3)",
        "Social engagement and community participation",
        "Performance review and adaptation"
      ]
    },

    "systemLevelSuccessMetrics": {
      "convergenceScore": {
        "definition": "How often target stakeholders encounter campaign message from 3+ independent sources within 7 days",
        "measurement": [
          "Survey sample of 50-100 target stakeholders monthly",
          "Ask: 'In past week, where did you encounter information about [topic]?'",
          "Calculate: % who name 3+ sources (owned, influencer, event, media)",
          "Target: 30% by Week 6, 50% by Week 12"
        ],
        "why": "This measures system-level narrative penetration, not just reach"
      },

      "narrativeOwnership": {
        "definition": "% of information environment we control when stakeholder researches topic",
        "measurement": [
          "Google search: '[campaign topic]' - count top 10 results we own/influenced",
          "LinkedIn search: same analysis",
          "Reddit/community mentions: % of threads where we're cited",
          "Target: 40% of top 10 search results by Week 8"
        ],
        "why": "When stakeholders research, they find OUR framing everywhere"
      },

      "indirectAttribution": {
        "definition": "Competitors, media, influencers adopting our framing without crediting us",
        "measurement": [
          "Track: Competitor decks/blogs using our terminology",
          "Track: Media articles framing debate our way (even if not quoting us)",
          "Track: Influencers using our 'invented' phrases",
          "Target: 5+ instances of indirect adoption by Week 12"
        ],
        "why": "Ultimate success: our narrative becomes 'common knowledge'"
      },

      "stakeholderBehaviorChange": {
        "definition": "Target stakeholders taking desired actions (not just aware)",
        "measurement": [
          "Primary KPI from Goal Framework: ${blueprintBase.part1_goalFramework?.primaryObjective || 'N/A'}",
          "Behavioral goals: ${blueprintBase.part1_goalFramework?.behavioralGoals?.map((bg: any) => bg.desiredBehavior).join(', ') || 'N/A'}",
          "Track: Tool adoption, event attendance, policy advocacy, partnership requests"
        ],
        "why": "Awareness means nothing without behavior change"
      },

      "pillarPerformanceTracking": {
        "pillar1_owned": {
          "metrics": [
            "Content publish rate (target: 100% on schedule)",
            "Engagement rate (shares, comments, saves)",
            "Traffic to owned properties",
            "Conversion to desired action"
          ]
        },
        "pillar2_relationships": {
          "metrics": [
            "Influencer activation rate (% who share/cite us)",
            "Influencer content reach (their audience size × engagement)",
            "New relationship conversions (cold → warm → advocate)"
          ]
        },
        "pillar3_events": {
          "metrics": [
            "Event participation rate (% of target events attended)",
            "Speaking/panel placements secured",
            "Post-event conversations initiated",
            "Event coverage/amplification"
          ]
        },
        "pillar4_media": {
          "metrics": [
            "Media pitch response rate",
            "Story placements secured (Tier 1, 2, 3)",
            "Media sentiment (positive/neutral/negative)",
            "Journalist relationship progression"
          ]
        }
      }
    },

    "adaptationStrategy": {
      "performanceReviewCadence": "Weekly pillar review, bi-weekly system metrics check",

      "pivotTriggers": [
        {
          "trigger": "Pillar 1 content engagement <50% of target for 2 consecutive weeks",
          "diagnosis": "Message resonance issue or distribution problem",
          "adaptations": [
            "A/B test different message angles",
            "Shift distribution channels",
            "Increase engagement tactics (commenting, community participation)"
          ]
        },
        {
          "trigger": "Pillar 2 influencer activation rate <30%",
          "diagnosis": "Relationship approach not resonating or wrong targets",
          "adaptations": [
            "Shift from content sharing to more personal value-add",
            "Re-evaluate influencer selection criteria",
            "Increase touchpoint frequency with fewer influencers"
          ]
        },
        {
          "trigger": "Pillar 4 media pitch response rate <10%",
          "diagnosis": "Story angles not newsworthy or wrong journalists",
          "adaptations": [
            "Add exclusive data/research to pitches",
            "Shift to relationship building vs direct pitching",
            "Target different journalist beats or tiers"
          ]
        },
        {
          "trigger": "Convergence Score not increasing by Week 6",
          "diagnosis": "System-level issue: pillars not reinforcing each other",
          "adaptations": [
            "Audit cross-pillar message consistency",
            "Increase coordination (owned content supports media pitches)",
            "Focus on 2-3 highest-performing pillars vs spreading thin"
          ]
        },
        {
          "trigger": "Unexpected competitor narrative or crisis",
          "diagnosis": "External threat requires defensive posture",
          "adaptations": [
            "Activate Part 4 Counter-Narrative Strategy",
            "Reallocate resources to defensive content",
            "Accelerate Pillar 4 media outreach with counter-story"
          ]
        }
      ],

      "resourceReallocation": {
        "ifBudgetConstrained": [
          "Focus on Pillar 1 + Pillar 2 (highest ROI, lowest cost)",
          "Use SignalDesk to scale content creation with minimal human hours",
          "Prioritize organic relationship building over paid amplification",
          "Target fewer, higher-value events vs attending everything"
        ],
        "ifTimeConstrained": [
          "Leverage SignalDesk automation for all content drafts",
          "Focus on relationship touchpoints that scale (Twitter replies vs 1-on-1 coffees)",
          "Prioritize media outreach to journalists already covering topic",
          "Skip Pillar 3 events if team bandwidth doesn't allow quality participation"
        ]
      },

      "phaseTransitionDecisions": {
        "howToKnowWhenToProgress": [
          "Phase 1 → 2: Convergence Score >20%, 1+ media placement, influencer amplification happening",
          "Phase 2 → 3: Stakeholders actively engaging (asking questions, attending events)",
          "Phase 3 → 4: Desired behaviors starting (tool trials, partnership inquiries)",
          "Don't force progression if system state not achieved"
        ]
      }
    },

    "signaldeskAutomation": {
      "whatSignaldeskHandles": [
        "All content draft generation (Pillar 1, 2, 3, 4)",
        "Media pitch templates with data/research",
        "Influencer outreach templates",
        "Event content (panel proposals, talking points)",
        "Crisis response templates (Part 4 activation)",
        "Performance tracking and recommendations"
      ],
      "whatTeamExecutes": [
        "Content review and brand voice refinement",
        "Authentic relationship building (can't be automated)",
        "Event attendance and networking",
        "Strategic decisions and pivots",
        "Media and influencer follow-up",
        "Internal stakeholder alignment"
      ]
    }
  }
}
\`\`\`

**CRITICAL REQUIREMENTS:**
1. Calculate realistic team bandwidth based on actual content inventory
2. Include system-level metrics (convergence, narrative ownership, indirect attribution)
3. Provide clear adaptation strategy with pivot triggers
4. Show what SignalDesk automates vs what requires human execution
5. Include budget requirements (minimum and recommended)
6. Define weekly execution rhythm
7. Explain how to measure success beyond vanity metrics

Generate comprehensive execution plan with system-level measurement framework.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let execution
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      execution = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text.substring(0, 500))
      throw new Error('Failed to parse execution requirements')
    }

    console.log('✅ Execution requirements generated successfully')

    return new Response(
      JSON.stringify(execution),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Execution generator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
