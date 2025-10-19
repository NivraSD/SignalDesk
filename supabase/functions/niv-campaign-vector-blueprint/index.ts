import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VectorBlueprintRequest {
  researchData: any
  campaignGoal: string
  selectedPositioning: any
  refinementRequest?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { researchData, campaignGoal, selectedPositioning, refinementRequest } = await req.json() as VectorBlueprintRequest

    console.log('VECTOR Blueprint Generator v2:', {
      goal: campaignGoal.substring(0, 50),
      positioning: selectedPositioning?.name,
      hasRefinement: !!refinementRequest
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in VECTOR campaign orchestration - sophisticated multi-channel influence operations.

## Core Philosophy
VECTOR campaigns don't "send messages" - they engineer system states where narratives become inevitable.
- Create convergence: Multiple independent-seeming sources reinforce same theme
- Own narrative voids: Become authority on topics about to explode
- Engineer discovery: People conclude on their own rather than being told

## Four Pillar Orchestration

**Pillar 1: OWNED ACTIONS** - What organization creates & distributes
**Pillar 2: RELATIONSHIP ORCHESTRATION** - Who to influence & what to create for them
**Pillar 3: EVENT ORCHESTRATION** - Where to show up & how to extract value
**Pillar 4: MEDIA ENGAGEMENT** - Which stories to pitch where & layered messaging

## Executable Content Types (ONLY use these)
- press-release, blog-post, thought-leadership, case-study, white-paper, ebook, qa-document
- social-post, linkedin-article, twitter-thread, instagram-caption, facebook-post
- email, newsletter, drip-sequence, cold-outreach
- executive-statement, board-presentation, investor-update, crisis-response, apology-statement
- media-pitch, media-kit, podcast-pitch, tv-interview-prep
- messaging, brand-narrative, value-proposition, competitive-positioning
- image, infographic, social-graphics, presentation, video
- talking-points

## Pattern Selection
- CASCADE: Build momentum over time (seeds → convergence → revelation)
- MIRROR: Position as solution before predictable crisis
- CHORUS: Multiple voices saying similar things independently
- TROJAN: Hide message inside what audience wants
- NETWORK: Influence influencers of influencers

## Critical Requirements
1. **Layered Messaging**: Same theme appears different across channels
2. **Convergence Strategy**: Show how pillars amplify each other
3. **Executable Content**: Specific enough for niv-content-intelligent-v2
4. **Real vs Mock Data**: Use real data (journalists, events) when available, mock with criteria when not
5. **SignalDesk Generates + User Executes**: Always specify what platform creates vs what user does

Output ONLY valid JSON matching this structure:

{
  "overview": {
    "campaignName": "Campaign name",
    "pattern": "CASCADE|MIRROR|CHORUS|TROJAN|NETWORK",
    "patternRationale": "Why this pattern fits",
    "duration": "12 weeks",
    "complexity": "High",
    "objective": "Behavioral objective"
  },

  "part1_goalFramework": {
    "primaryObjective": "Measurable objective",
    "behavioralGoals": [
      {
        "stakeholder": "Group",
        "desiredBehavior": "What they do",
        "currentState": "Where now",
        "successMetric": "How measure"
      }
    ],
    "kpis": ["kpi1", "kpi2", "kpi3"],
    "successCriteria": "Complete success",
    "riskAssessment": [
      {
        "risk": "Risk",
        "probability": "High/Med/Low",
        "impact": "Impact",
        "mitigation": "Strategy"
      }
    ]
  },

  "part2_stakeholderMapping": {
    "groups": [
      {
        "name": "Stakeholder name",
        "size": "Size estimate",
        "psychologicalProfile": {
          "values": ["value1", "value2"],
          "fears": ["fear1", "fear2"],
          "aspirations": ["asp1"],
          "decisionDrivers": ["driver1", "driver2"]
        },
        "informationDiet": {
          "primarySources": ["source1"],
          "trustedVoices": ["voice1"],
          "consumptionHabits": "How they consume"
        },
        "decisionTriggers": ["trigger1"],
        "currentPerception": "Current view",
        "targetPerception": "Target view",
        "barriers": ["barrier1"]
      }
    ],
    "stakeholderRelationships": "How groups influence each other",
    "priorityOrder": ["group1", "group2"]
  },

  "part3_orchestrationStrategy": {
    "phases": {
      "phase1_awareness": {
        "objective": "Phase goal",
        "duration": "Weeks 1-3",
        "stakeholderFocus": ["Primary stakeholders"],
        "messageTheme": "ONE narrative establishing",

        "pillar1_ownedActions": {
          "organizationalVoice": [
            {
              "who": "CEO/CTO/Team",
              "why": "Credibility with stakeholder X",
              "platforms": ["LinkedIn", "Blog"],
              "contentNeeds": [
                {
                  "contentType": "blog-post",
                  "topic": "Specific topic",
                  "coreMessage": "What conveys",
                  "targetStakeholder": "Who reaches",
                  "timing": "Week 1, Mon",
                  "signaldeskGenerates": "Full blog draft",
                  "userExecutes": "Publish + share in communities",
                  "successMetric": "50+ shares"
                }
              ]
            }
          ],
          "distributionStrategy": {
            "ownedChannels": ["Blog", "LinkedIn"],
            "engagementChannels": [
              {
                "platform": "Reddit r/Target",
                "engagementType": "Comment on threads",
                "cadence": "3-5/week",
                "tone": "Helpful peer",
                "signaldeskGenerates": "Comment templates"
              }
            ]
          }
        },

        "pillar2_relationshipOrchestration": {
          "tier1Influencers": [
            {
              "stakeholderSegment": "Segment name",
              "discoveryCriteria": [
                "Role criteria",
                "Reach criteria",
                "Activity criteria"
              ],
              "exampleTargets": [
                {
                  "name": "Real name OR [MOCK] description",
                  "source": "journalist_registry OR mock_recommendation",
                  "relevanceScore": 0.92,
                  "whyMock": "Reason if mock",
                  "userAction": "Search query if mock"
                }
              ],
              "engagementStrategy": {
                "objective": "What we want them to do",
                "approach": "Value-first",
                "contentToCreateForThem": [
                  {
                    "contentType": "white-paper",
                    "topic": "Their key issue",
                    "why": "They need data",
                    "signaldeskGenerates": "White paper draft",
                    "userExecutes": "Send via LinkedIn",
                    "timing": "Week 1"
                  }
                ],
                "touchpointCadence": ["Week 1: action", "Week 2: action"],
                "successMetric": "They cite us within 8 weeks"
              }
            }
          ]
        },

        "pillar3_eventOrchestration": {
          "tier1Events": [
            {
              "event": "Event name",
              "date": "Month Year",
              "source": "master_source_registry OR mock_recommendation",
              "relevanceScore": 0.95,
              "whyAttend": "Decision makers + media",
              "presenceStrategy": {
                "officialParticipation": "Panel proposal",
                "socialStrategy": "Live-tweet sessions",
                "contentSignaldeskGenerates": [
                  "panel-proposal",
                  "social-posts: 20 templates",
                  "one-pager: handout",
                  "email-templates: follow-up"
                ]
              },
              "preEventContent": {
                "blog-post": "Trends to watch",
                "why": "Position as thought leader"
              },
              "postEventContent": {
                "blog-post": "Key takeaways",
                "media-pitch": "Trend story pitch"
              }
            }
          ],
          "virtualEvents": [
            {
              "eventType": "Own webinar",
              "topic": "Panel discussion",
              "contentSignaldeskGenerates": [
                "webinar-script",
                "email-sequence",
                "social-posts",
                "blog-post: recap",
                "video-clips"
              ]
            }
          ]
        },

        "pillar4_mediaEngagement": {
          "messageArchitecture": "What narrative each tier validates",
          "outletStrategy": [
            {
              "outletTier": "Tier 1 - National",
              "outlets": [
                {
                  "name": "Publication",
                  "journalist": "Name from journalist_registry",
                  "beat": "Coverage area",
                  "source": "journalist_registry",
                  "whyThisOutlet": "Reaches decision makers"
                }
              ],
              "storiesToPitch": [
                {
                  "storyAngle": "Data story with hook",
                  "messagePillar": "Time savings",
                  "hook": "New data shows Y",
                  "timing": "Week 2",
                  "contentSignaldeskGenerates": {
                    "media-pitch": "Full pitch email",
                    "press-kit": "One-pager",
                    "talking-points": "If interview",
                    "follow-up-templates": "2 emails"
                  },
                  "supportingAssets": ["case-study", "white-paper"],
                  "successMetric": "1 story by Week 4",
                  "howSupportsStrategy": "Validates Pillar 1 claims, makes Pillar 2 more credible"
                }
              ]
            }
          ]
        },

        "convergenceStrategy": "How pillars amplify: Owned → Influencers share → Events legitimize → Media validates = Multiple sources create 'everyone talking'",
        "targetSystemState": "Stakeholders encounter message from 4 angles without seeing coordination",
        "transitionToNextPhase": "Once awareness + social proof, shift to deeper messaging"
      }
    }
  },

  "part4_counterNarrative": {
    "threatScenarios": [
      {
        "threat": "Competitor attacks",
        "earlyWarning": "opportunity_detector flags spike",
        "responseSLA": "4 hours to draft",
        "responsePlaybook": {
          "pillar1Owned": {
            "contentType": "blog-post + qa-document",
            "topic": "Our data/methodology",
            "signaldeskGenerates": "Response blog + Q&A + talking-points"
          },
          "pillar2Relationships": {
            "activation": "Alert advocates",
            "contentType": "case-study testimonials",
            "signaldeskGenerates": "Testimonial scripts"
          },
          "pillar4Media": {
            "action": "Proactive pitch",
            "signaldeskGenerates": "Rapid response pitch"
          }
        }
      }
    ]
  },

  "part5_executionRequirements": {
    "teamBandwidth": {
      "minimumViable": {
        "roles": [
          "1 person: SignalDesk content (10 hrs/week)",
          "1 person: Outreach (10 hrs/week)",
          "0.5 executive: Interviews (2-3 hrs/week)"
        ],
        "totalCommitment": "22-23 hours/week"
      }
    },
    "budgetConsiderations": {
      "optionalPaidAmplification": {
        "useCases": [
          "Boost influencer posts",
          "Promote white paper to LinkedIn segment"
        ],
        "estimatedBudget": "$2-5K over 12 weeks"
      },
      "eventCosts": {
        "tier1Events": "$5-10K (travel, booth)",
        "virtualEvents": "$0-500"
      }
    },
    "adaptationStrategy": {
      "leadingIndicators": [
        {
          "checkpoint": "Week 2",
          "metric": "Organic shares",
          "target": "10+ shares",
          "ifMiss": "Survey users → adjust messaging"
        }
      ],
      "pivotScenarios": [
        {
          "trigger": "Primary message <5% engagement after 4 weeks",
          "action": "Test secondary positioning"
        }
      ]
    }
  },

  "part6_patternGuidance": {
    "selectedPattern": {
      "patternName": "CASCADE|MIRROR|etc",
      "patternDescription": "What it does",
      "whenToUse": "Situation",
      "pillarEmphasis": {
        "pillar1Owned": "Heavy/Med/Light + why",
        "pillar2Relationships": "Heavy/Med/Light + why",
        "pillar3Events": "Heavy/Med/Light + why",
        "pillar4Media": "Heavy/Med/Light + why"
      },
      "timingStrategy": "Slow build vs rapid vs coordinated",
      "executionAdjustments": [
        "Specific tactic changes",
        "Content timing differences"
      ]
    }
  }
}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# Selected Positioning
**${selectedPositioning?.name || 'Not specified'}**
${selectedPositioning?.description || ''}
${selectedPositioning?.rationale || ''}

# STAKEHOLDERS WE ALREADY IDENTIFIED (USE THESE DIRECTLY):
${researchData?.stakeholders ? JSON.stringify(researchData.stakeholders, null, 2) : 'None identified'}

# JOURNALISTS WE ALREADY FOUND (USE THESE IN PILLAR 4):
${researchData?.channelIntelligence?.journalists ? JSON.stringify(researchData.channelIntelligence.journalists.slice(0, 15), null, 2) : 'None found'}

# NARRATIVES & COMPETITIVE LANDSCAPE (ADDRESS THESE):
${researchData?.narrativeLandscape ? JSON.stringify(researchData.narrativeLandscape, null, 2) : 'None identified'}

# PATTERN RECOMMENDATIONS FROM RESEARCH:
${researchData?.historicalInsights?.patternRecommendations ? JSON.stringify(researchData.historicalInsights.patternRecommendations, null, 2) : 'None'}

${refinementRequest ? `\n# Refinement Request\n${refinementRequest}\n` : ''}

## Instructions

DO NOT regenerate stakeholders or find new journalists. USE THE DATA PROVIDED ABOVE.

Your task: Create a Four-Pillar campaign blueprint that ADAPTS the research into executable strategy.

**Part 1**: Goal Framework - Map campaign goal to measurable KPIs

**Part 2**: Stakeholder Mapping - COPY the stakeholders from research above, add priority order and relationship mapping

**Part 3 - CRITICAL NEW STRUCTURE**: Four-Pillar Orchestration Strategy

For EACH phase, provide:

1. **Pillar 1 - Owned Actions**:
   - WHO in organization creates content (CEO, CTO, marketing team)
   - WHAT platforms they use (LinkedIn, blog, newsletter)
   - SPECIFIC content needs with:
     * contentType (exact ID like "blog-post", "linkedin-article")
     * topic (specific, not generic)
     * coreMessage (what it conveys)
     * timing (Week X, Day)
     * signaldeskGenerates: "What platform creates"
     * userExecutes: "What user does to distribute"
     * successMetric: "How measure success"
   - Distribution strategy (owned channels + engagement channels like Reddit, comment strategy)

2. **Pillar 2 - Relationship Orchestration**:
   - Tier 1 influencers:
     * Discovery criteria (role, reach, activity)
     * Example targets (use REAL journalists from research if available, otherwise [MOCK] with criteria)
     * Engagement strategy: objective, approach, no-ask period
     * Content TO CREATE FOR THEM (white-paper, infographic, toolkit)
     * Touchpoint cadence (Week 1: action, Week 2: action)
     * Success metric
   - Tier 2 amplifiers (community influencers, practitioners)

3. **Pillar 3 - Event Orchestration**:
   - Tier 1 events (major conferences):
     * Use real events from research if available, otherwise [MOCK] with criteria
     * Why attend (decision makers, media, narrative setting)
     * Presence strategy (panel, social, networking)
     * Content SignalDesk generates (panel proposal, tweets, handouts, follow-ups)
     * Pre-event content (blog previewing trends)
     * Post-event content (recap, media pitch)
   - Virtual events (webinars we host)

4. **Pillar 4 - Media Engagement**:
   **CRITICAL: Use the actual journalist names and outlets from the JOURNALISTS list above**
   - For EACH story to pitch:
     * journalist: Use actual name from the list (e.g., "Sarah Johnson")
     * outlet: Use actual outlet from the list (e.g., "TechCrunch")
     * beat: Their coverage area from the list
     * storyAngle: Specific hook relevant to their beat
     * contentSignaldeskGenerates: media-pitch, press-kit, talking-points
     * timing: Week X
     * successMetric: Specific goal
   - Group journalists by tier based on their outlets
   - Show HOW media coverage validates other pillars

**Convergence Strategy**:
For each phase, explain HOW the 4 pillars work together:
- Owned content provides ammunition
- Influencers share organically (seems independent)
- Events legitimize the conversation
- Media validates with third-party credibility
- Result: Stakeholders encounter same theme from multiple "independent" sources = system state achieved

**Part 4 - Counter-Narrative**:
Provide 2-3 threat scenarios with response playbooks across all pillars

**Part 5 - Execution Requirements**:
Team bandwidth, budget considerations, leading indicators, pivot scenarios

**Part 6 - Pattern Guidance**:
Explain how the selected pattern affects pillar emphasis and timing

## Data Guidelines

- Use REAL journalists from channelIntelligence when available
- Use [MOCK] with criteria when data unavailable
- For mock data: Provide user_action with search query
- Be specific with content types (exact IDs from approved list)
- Show signaldeskGenerates vs userExecutes separation
- Include timing (Week X) for all tactics

## Pattern Selection

Choose pattern based on:
- CASCADE: If building momentum over time with seed → convergence
- MIRROR: If predictable crisis/event coming
- CHORUS: If need multiple independent voices
- TROJAN: If audience resistant to direct message
- NETWORK: If target requires indirect influence chains

Provide detailed rationale for pattern choice.

Output valid JSON only.`

    // Retry logic for API timeouts
    let message
    let retries = 0
    const maxRetries = 2

    while (retries <= maxRetries) {
      try {
        console.log(`Attempt ${retries + 1}/${maxRetries + 1} to generate blueprint...`)

        message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10000, // Sufficient for full blueprint with all phases (prevents mid-JSON cutoff)
          temperature: 0.7,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: userPrompt
          }]
        })

        console.log('✅ Successfully received response from Claude')
        break // Success, exit retry loop

      } catch (apiError: any) {
        retries++
        console.error(`Attempt ${retries} failed:`, apiError.message)

        if (retries > maxRetries) {
          throw new Error(`Blueprint generation failed after ${maxRetries + 1} attempts: ${apiError.message}`)
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, retries), 10000)
        console.log(`Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let blueprint
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      blueprint = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text)
      throw new Error('Failed to parse VECTOR blueprint v2')
    }

    console.log('✅ VECTOR Blueprint v2 generated successfully')

    return new Response(
      JSON.stringify(blueprint),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('VECTOR Blueprint v2 error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function buildDetailedResearchContext(research: any): string {
  let context = ''

  // Stakeholders (from CampaignIntelligenceBrief)
  if (research?.stakeholders && research.stakeholders.length > 0) {
    context += `## Stakeholder Intelligence\n`
    context += `**${research.stakeholders.length} Key Stakeholder Groups Identified:**\n\n`

    research.stakeholders.forEach((s: any) => {
      context += `**${s.name}** (${s.size?.toLocaleString() || 'N/A'} people)\n`
      if (s.psychology) {
        context += `- Values: ${s.psychology.values?.join(', ')}\n`
        context += `- Fears: ${s.psychology.fears?.join(', ')}\n`
        context += `- Aspirations: ${s.psychology.aspirations?.join(', ')}\n`
        context += `- Decision Drivers: ${s.psychology.biases?.join(', ')}\n`
      }
      if (s.informationDiet) {
        context += `- Primary Sources: ${s.informationDiet.primarySources?.join(', ')}\n`
        context += `- Trusted Voices: ${s.informationDiet.trustedVoices?.join(', ')}\n`
      }
      if (s.decisionTriggers?.length > 0) {
        context += `- Decision Triggers: ${s.decisionTriggers.join(', ')}\n`
      }
      if (s.currentPerceptions) {
        context += `- Current Perception: ${s.currentPerceptions.ofOrganization}\n`
      }
      context += `\n`
    })
  }

  // Narrative Landscape
  if (research?.narrativeLandscape) {
    context += `## Narrative Landscape\n`

    if (research.narrativeLandscape.dominantNarratives?.length > 0) {
      context += `**Dominant Narratives:**\n`
      research.narrativeLandscape.dominantNarratives.forEach((n: any) => {
        context += `- ${n.narrative} (${n.source})\n`
      })
      context += `\n`
    }

    if (research.narrativeLandscape.narrativeVacuums?.length > 0) {
      context += `**Narrative Opportunities:**\n`
      research.narrativeLandscape.narrativeVacuums.forEach((v: any) => {
        context += `- ${v.opportunity}: ${v.rationale}\n`
      })
      context += `\n`
    }

    if (research.narrativeLandscape.competitivePositioning?.length > 0) {
      context += `**Competitive Landscape:**\n`
      research.narrativeLandscape.competitivePositioning.forEach((c: any) => {
        context += `- ${c.competitor}: ${c.positioning}\n`
      })
      context += `\n`
    }
  }

  // Channel Intelligence
  if (research?.channelIntelligence) {
    context += `## Channel Intelligence\n`

    if (research.channelIntelligence.journalists?.length > 0) {
      context += `**Key Journalists (${research.channelIntelligence.journalists.length}):** ${research.channelIntelligence.journalists.slice(0, 8).map((j: any) => `${j.name} (${j.outlet})`).join(', ')}\n\n`
    }

    if (research.channelIntelligence.publications?.length > 0) {
      context += `**Key Publications:** ${research.channelIntelligence.publications.map((p: any) => p.name).join(', ')}\n\n`
    }

    if (research.channelIntelligence.byStakeholder?.length > 0) {
      context += `**Channel Preferences by Stakeholder:**\n`
      research.channelIntelligence.byStakeholder.forEach((s: any) => {
        context += `- ${s.stakeholder}: ${s.channels?.slice(0, 3).map((c: any) => c.name).join(', ')}\n`
      })
      context += `\n`
    }
  }

  // Historical Insights
  if (research?.historicalInsights) {
    context += `## Historical Insights\n`

    if (research.historicalInsights.successfulCampaigns?.length > 0) {
      context += `**Successful Campaign Patterns:**\n`
      research.historicalInsights.successfulCampaigns.forEach((c: any) => {
        context += `- ${c.campaign}: ${c.approach}\n`
      })
      context += `\n`
    }

    if (research.historicalInsights.patternRecommendations?.length > 0) {
      context += `**Pattern Recommendations:**\n`
      research.historicalInsights.patternRecommendations.forEach((p: any) => {
        context += `- ${p.pattern}: ${p.rationale}\n`
      })
      context += `\n`
    }
  }

  // Key Insights
  if (research?.keyInsights?.length > 0) {
    context += `## Key Strategic Insights\n`
    research.keyInsights.forEach((i: any) => {
      context += `- [${i.significance.toUpperCase()}] ${i.insight}\n`
      context += `  Action: ${i.actionImplication}\n\n`
    })
  }

  return context || '## No research data available\n'
}
