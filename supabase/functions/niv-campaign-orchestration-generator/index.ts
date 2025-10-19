import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrchestrationRequest {
  blueprintBase: any // Output from base generator
  researchData: any
  campaignGoal: string
  selectedPositioning: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { blueprintBase, researchData, campaignGoal, selectedPositioning } = await req.json() as OrchestrationRequest

    console.log('🎯 Orchestration Generator:', {
      pattern: blueprintBase.overview?.pattern,
      stakeholders: blueprintBase.part2_stakeholderMapping?.groups?.length || 0,
      journalists: researchData?.channelIntelligence?.journalists?.length || 0
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in VECTOR campaign orchestration - sophisticated multi-channel influence operations.

## Your Task
Generate Part 3: Four-Pillar Orchestration Strategy across 4 phases.

## Core Philosophy
VECTOR campaigns engineer system states where narratives become inevitable:
- Create convergence: Multiple independent-seeming sources reinforce same theme
- Own narrative voids: Become authority on topics about to explode
- Engineer discovery: People conclude on their own rather than being told

## Four Pillars
1. **OWNED ACTIONS**: What organization creates & distributes
2. **RELATIONSHIP ORCHESTRATION**: Who to influence & what to create for them
3. **EVENT ORCHESTRATION**: Where to show up & how to extract value
4. **MEDIA ENGAGEMENT**: Which journalists to pitch, what stories, how it validates strategy

## CRITICAL: Pillar 4 Media Engagement Requirements

You MUST include for each phase:

**Real Journalists from Research:**
- Use actual journalist names, outlets, beats from provided data
- Map journalists to appropriate story angles based on their coverage
- Include their recent topics to show relevance

**Complete Media Playbooks:**
- Story angle (specific hook with data)
- Message pillar (what narrative this validates)
- Timing (coordinated with other pillars)
- Multiple outlets for each story
- Content SignalDesk generates:
  * Full media pitch email
  * Press kit (one-pager with stats)
  * Talking points (for interviews)
  * Follow-up email templates (2-3)
- Supporting assets (from Pillar 1 content)
- Success metric (1 story by Week X)
- **HOW THIS SUPPORTS STRATEGY** - How media coverage amplifies other pillars

**Journalist Nurturing Plans:**
- Specific journalist names
- Relationship stage (cold → warm)
- Multi-touchpoint cadence:
  * Week 1: Send relevant research
  * Week 3: Comment on their post
  * Week 5: Pitch the story
  * Week 7: Share exclusive data
- Email templates for each touchpoint
- Objective: Become go-to source

## Messaging Layers
For EACH phase, show:
- How core message appears through owned content (authentic, educational)
- How message appears through relationships (peer validation)
- How message appears through events (authority, legitimacy)
- How message appears through media (third-party credibility)

## Convergence Strategy
Explain HOW pillars amplify each other:
- Owned content → becomes supporting assets for media pitches
- Media coverage → gives influencers credibility to share
- Event presence → validates media narrative
- Result: stakeholders encounter message from 4 angles = system state

## Executable Content Types
blog-post, linkedin-article, twitter-thread, white-paper, case-study, media-pitch, press-kit, talking-points, infographic, email-sequence, panel-proposal, webinar-script

Output ONLY valid JSON.`

    // Extract journalist intelligence
    const journalists = researchData?.channelIntelligence?.journalists || []
    const journalistContext = journalists.length > 0
      ? `\n## Available Journalists (${journalists.length} total)\n${journalists.slice(0, 15).map((j: any) =>
          `- ${j.name} (${j.outlet}) - Beat: ${j.beat || 'General'}, Tier: ${j.tier || 'Unknown'}`
        ).join('\n')}\n\n**USE THESE REAL JOURNALISTS** in your media engagement strategy. Map them to appropriate story angles based on their beat.`
      : '\n## No journalist data available - use [MOCK] format with discovery criteria\n'

    const userPrompt = `# Campaign Foundation
${JSON.stringify(blueprintBase, null, 2)}

# Selected Positioning (USER CHOSE THIS - ALIGN ALL TACTICS TO IT)
**${selectedPositioning?.name || 'Not specified'}**
${selectedPositioning?.description || ''}
${selectedPositioning?.rationale || ''}

Target Audiences: ${selectedPositioning?.targetAudiences?.join(', ') || 'Not specified'}
Key Differentiators: ${selectedPositioning?.differentiators?.join(', ') || 'None'}

# Research Data
${journalistContext}

${researchData?.narrativeLandscape ? `## Narrative Landscape
${JSON.stringify(researchData.narrativeLandscape, null, 2)}` : ''}

## Generate Part 3: Four-Pillar Orchestration Strategy

Create orchestration across 4 phases (Awareness, Consideration, Conversion, Advocacy).

For EACH phase, provide ALL 4 pillars with:

**Phase Structure:**
\`\`\`json
{
  "part3_orchestrationStrategy": {
    "phases": {
      "phase1_awareness": {
        "objective": "Specific phase goal",
        "duration": "Weeks 1-3",
        "stakeholderFocus": ["Primary stakeholders"],
        "messageTheme": "ONE core narrative for this phase",

        "messagingLayers": {
          "ownedLayer": "How message appears in our content (authentic, educational)",
          "relationshipLayer": "How message appears when shared by influencers (peer validation)",
          "eventLayer": "How message appears at events (authority, legitimacy)",
          "mediaLayer": "How message appears in press (third-party credibility)"
        },

        "pillar1_ownedActions": {
          "strategicPurpose": "Why this pillar matters for system state",
          "organizationalVoice": [
            {
              "who": "CEO/CTO/Team",
              "why": "Their credibility with which stakeholder",
              "platforms": ["LinkedIn", "Blog"],
              "contentNeeds": [
                {
                  "contentType": "blog-post",
                  "topic": "Specific topic",
                  "coreMessage": "What this conveys",
                  "targetStakeholder": "Who this reaches",
                  "timing": "Week 1, Monday",
                  "signaldeskGenerates": "Full blog post draft with SEO",
                  "userExecutes": "Publish + share in 3 communities",
                  "successMetric": "50+ shares in target communities"
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
                "signaldeskGenerates": "10 comment templates"
              }
            ]
          }
        },

        "pillar2_relationshipOrchestration": {
          "strategicPurpose": "Why relationships matter for convergence",
          "tier1Influencers": [
            {
              "stakeholderSegment": "Who they influence",
              "discoveryCriteria": ["Role", "Reach", "Recent activity"],
              "exampleTargets": [
                {
                  "name": "Real name OR [MOCK] description",
                  "source": "journalist_registry OR mock",
                  "relevanceScore": 0.92,
                  "whyMock": "If mock, explain why",
                  "userAction": "Search query if mock"
                }
              ],
              "engagementStrategy": {
                "objective": "What we want them to do",
                "approach": "Value-first relationship",
                "noAskPeriod": "4-6 weeks",
                "contentToCreateForThem": [
                  {
                    "contentType": "white-paper",
                    "topic": "Their key issue",
                    "why": "They need this data",
                    "signaldeskGenerates": "White paper with citations",
                    "userExecutes": "Send via LinkedIn with note",
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
          "strategicPurpose": "Why events legitimize the narrative",
          "tier1Events": [
            {
              "event": "Event name",
              "date": "Month Year",
              "source": "master_source_registry OR mock",
              "relevanceScore": 0.95,
              "whyAttend": "Decision makers + media present",
              "presenceStrategy": {
                "officialParticipation": "Panel proposal",
                "socialStrategy": "Live-tweet sessions",
                "contentSignaldeskGenerates": [
                  "panel-proposal: Description + talking points",
                  "social-posts: 20 templates",
                  "one-pager: Handout",
                  "email-templates: Follow-up"
                ]
              },
              "preEventContent": {
                "blog-post": "Trends to watch at [Event]",
                "why": "Position as thought leader BEFORE event"
              },
              "postEventContent": {
                "blog-post": "Key takeaways",
                "media-pitch": "Trend story for journalists"
              }
            }
          ]
        },

        "pillar4_mediaEngagement": {
          "strategicPurpose": "Third-party validation that makes other pillars credible",
          "messageArchitecture": "What narrative each tier validates",

          "outletStrategy": [
            {
              "outletTier": "Tier 1 - National",
              "outlets": [
                {
                  "name": "Publication name",
                  "journalist": "REAL NAME from journalist list above",
                  "beat": "Their coverage area",
                  "source": "journalist_registry",
                  "recentCoverage": ["Topics they covered"],
                  "whyThisOutlet": "Reaches decision makers"
                }
              ],
              "storiesToPitch": [
                {
                  "storyAngle": "Data story: Specific trend with numbers",
                  "messagePillar": "Time savings",
                  "hook": "New data from X sources shows Y",
                  "timing": "Week 2 (after case studies published)",
                  "outlets": ["Publication 1", "Publication 2"],

                  "contentSignaldeskGenerates": {
                    "mediaPitch": "Full pitch email with subject, lede, data points",
                    "pressKit": "One-pager with stats, quotes, infographic",
                    "talkingPoints": "If they want interview with exec",
                    "followUpTemplates": "2 follow-up email templates"
                  },

                  "supportingAssets": [
                    "case-study: Customer results from Pillar 1",
                    "white-paper: Research doc from Pillar 2",
                    "infographic: Before/after viz"
                  ],

                  "successMetric": "1 story placement by Week 4",

                  "howThisSupportsStrategy": "Media coverage validates Pillar 1 claims. Policy makers (Pillar 2) see coverage and become receptive. Event speakers (Pillar 3) cite media coverage. Creates perception: everyone is talking about this."
                }
              ]
            }
          ],

          "journalistNurturing": [
            {
              "journalist": "REAL NAME from list",
              "outlet": "Their publication",
              "relationshipStage": "Cold → Warm",
              "touchpoints": [
                "Week 1: Send relevant research with no ask",
                "Week 3: Comment value-add on their LinkedIn post",
                "Week 5: Pitch the data story with exclusive angle",
                "Week 7: Share early survey results before public"
              ],
              "contentSignaldeskGenerates": "Email template for each touchpoint",
              "objective": "Become go-to source for our topic",
              "successMetric": "They reach out asking for expert quote"
            }
          ]
        },

        "convergenceStrategy": "Owned content provides ammunition → Influencers share organically → Events legitimize conversation → Media validates with third-party credibility = Multiple 'independent' sources create perception of inevitability",

        "targetSystemState": "Stakeholders encounter message from 4 angles without seeing coordination. When they Google the topic, they find: our blog post, influencer commentary, event coverage, media article - all reinforcing same narrative",

        "transitionToNextPhase": "Once awareness + social proof established (metrics: 50+ influencer shares, 1+ media placement), shift to deeper messaging about HOW it works"
      },

      "phase2_consideration": {
        // Same complete structure with different message theme and tactics
      },

      "phase3_conversion": {
        // Same complete structure
      },

      "phase4_advocacy": {
        // Same complete structure
      }
    }
  }
}
\`\`\`

**CRITICAL REQUIREMENTS:**
1. Use REAL journalist names from the list provided
2. Show messaging layers for each phase
3. Include "howThisSupportsStrategy" for media pitches
4. Show convergence strategy for each phase
5. Make all content executable with signaldeskGenerates + userExecutes
6. Include multi-touchpoint journalist nurturing plans

Generate comprehensive orchestration strategy with full strategic depth.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10000, // Reduced to fit within 2-minute timeout (4 phases × 4 pillars)
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

    let orchestration
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      orchestration = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text.substring(0, 500))
      throw new Error('Failed to parse orchestration strategy')
    }

    console.log('✅ Orchestration strategy generated successfully')

    return new Response(
      JSON.stringify(orchestration),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Orchestration generator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
