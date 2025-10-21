import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface StakeholderOrchestrationRequest {
  part1_strategicFoundation: any
  part2_psychologicalInfluence: any
  sessionId?: string
  orgId?: string
}

// Multi-channel tactic: WHO → WHAT → WHERE
interface MediaPitch {
  who: string  // Journalist name
  outlet: string  // Publication
  beat: string  // Coverage area
  what: string  // Story angle/topic
  when: string  // Timing (e.g., "Week 1", "After product launch")
}

interface SocialPost {
  who: string  // Person posting (e.g., "CEO", "Brand account", "Head of Product")
  platform: string  // WHERE: LinkedIn, Twitter, etc.
  what: string  // Post topic/angle
  keyMessages: string[]
  when: string  // Timing
}

interface ThoughtLeadership {
  who: string  // Author (e.g., "CEO", "CTO")
  what: string  // Article title/topic
  where: string  // Publication target (e.g., "TechCrunch", "Company blog", "Harvard Business Review")
  keyPoints: string[]
  when: string  // Timing
}

interface AdditionalTactic {
  type: string  // "webinar", "podcast", "event", "partnership", etc.
  who: string  // Who executes
  what: string  // Description
  where: string  // Platform/venue
  when: string  // Timing
  estimatedEffort?: string
  resources?: string[]
}

// Each lever has a multi-touchpoint campaign
interface LeverCampaign {
  leverName: string  // From Part 2 (e.g., "Fear Mitigation: Job Security")
  leverType: string  // "Fear Mitigation", "Aspiration Activation", "Decision Trigger", etc.
  objective: string  // What this lever achieves

  // Multi-channel execution
  mediaPitches: MediaPitch[]  // WHO → WHAT → WHERE for media
  socialPosts: SocialPost[]  // WHO → WHAT → WHERE for social
  thoughtLeadership: ThoughtLeadership[]  // WHO → WHAT → WHERE for content
  additionalTactics: AdditionalTactic[]  // Other tactics user must execute
}

interface InfluenceLever {
  leverName: string
  leverType: string
  priority: number
  objective: string
  campaign: LeverCampaign  // The multi-channel campaign for this lever
  completionCriteria: string[]
}

interface StakeholderOrchestrationPlan {
  stakeholder: {
    name: string
    priority: number
    psychologicalProfile: any
  }
  influenceLevers: InfluenceLever[]
  progress: {
    totalLevers: number
    completedLevers: number
    percentComplete: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { part1_strategicFoundation, part2_psychologicalInfluence, sessionId, orgId } = await req.json() as StakeholderOrchestrationRequest

    console.log('🎯 Generating stakeholder orchestration...')
    console.log('   Session:', sessionId)
    console.log('   Org:', orgId)
    console.log('   Part1 keys:', Object.keys(part1_strategicFoundation || {}))
    console.log('   Part2 keys:', Object.keys(part2_psychologicalInfluence || {}))

    if (!part1_strategicFoundation || !part2_psychologicalInfluence) {
      throw new Error('Missing required parts: need part1_strategicFoundation and part2_psychologicalInfluence')
    }

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Build comprehensive prompt for Claude
    const prompt = buildOrchestrationPrompt(part1_strategicFoundation, part2_psychologicalInfluence)

    console.log('📡 Calling Claude for orchestration generation...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 12000,  // Reduced from 16000 to speed up generation
        temperature: 0.5,
        system: 'You are a JSON generator. Return ONLY valid JSON with no markdown code blocks, no explanations, no preamble. Start with { and end with }. Be concise and efficient.',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    const rawText = data.content[0].text

    console.log('✅ Claude response received')

    // Extract JSON from response
    let orchestrationPlans: StakeholderOrchestrationPlan[]

    try {
      // Remove markdown code blocks if present
      let cleanText = rawText.trim()
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '')
      }

      // Try to find JSON object - look for first { and last }
      const firstBrace = cleanText.indexOf('{')
      const lastBrace = cleanText.lastIndexOf('}')

      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const jsonText = cleanText.substring(firstBrace, lastBrace + 1)
        const parsed = JSON.parse(jsonText)
        orchestrationPlans = parsed.stakeholderOrchestrationPlans || parsed
      } else {
        throw new Error('No JSON object found in response')
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response as JSON:', parseError)
      console.error('Raw response:', rawText.substring(0, 1000))
      console.error('Raw response length:', rawText.length)
      throw new Error('Failed to parse orchestration plans from Claude response')
    }

    console.log('✅ Parsed orchestration plans')
    console.log('   Stakeholders:', orchestrationPlans.length)
    console.log('   Total influence levers:', orchestrationPlans.reduce((sum, p) => sum + p.influenceLevers.length, 0))

    // Count total tactics across all channels
    const totalTactics = orchestrationPlans.reduce((sum, plan) => {
      return sum + plan.influenceLevers.reduce((leverSum, lever) => {
        const campaign = lever.campaign || {}
        return leverSum +
          (campaign.mediaPitches?.length || 0) +
          (campaign.socialPosts?.length || 0) +
          (campaign.thoughtLeadership?.length || 0) +
          (campaign.additionalTactics?.length || 0)
      }, 0)
    }, 0)

    console.log('   Total tactics:', totalTactics)

    const plansWithProgress = orchestrationPlans

    // Save to database if sessionId provided
    if (sessionId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      await supabase
        .from('campaign_builder_sessions')
        .update({
          part3_stakeholderorchestration: {
            stakeholderOrchestrationPlans: plansWithProgress
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      console.log('✅ Saved to database:', sessionId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        part3_stakeholderOrchestration: {
          stakeholderOrchestrationPlans: plansWithProgress
        },
        metadata: {
          totalStakeholders: plansWithProgress.length,
          totalLevers: plansWithProgress.reduce((sum, p) => sum + p.influenceLevers.length, 0),
          totalTactics: totalTactics
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

function buildOrchestrationPrompt(part1: any, part2: any): string {
  const currentDate = new Date().toISOString().split('T')[0]

  // Extract key info - adapt to actual Part 1 and Part 2 structure
  // Part 1 = goalFramework, Part 2 = stakeholderMapping with groups[]
  const stakeholders = part2.groups || part1.targetStakeholders || []
  const influenceStrategies = part2.influenceStrategies || part2.groups || []

  return `You are an expert campaign strategist. Your task is to create a stakeholder orchestration plan using a multi-channel, WHO → WHAT → WHERE approach.

**TODAY'S DATE:** ${currentDate}

## INPUTS

### Stakeholders (from Part 1):
${JSON.stringify(stakeholders, null, 2)}

### Influence Strategies (from Part 2):
Each stakeholder has ~4 psychological influence levers (fear mitigation, aspiration activation, decision triggers, etc.)
${JSON.stringify(influenceStrategies, null, 2)}

## YOUR TASK

For EACH stakeholder's psychological influence levers (from Part 2), create a MULTI-CHANNEL CAMPAIGN with:

### 1. MEDIA PITCHES (Signaldesk auto-executes)
- **WHO**: Specific journalist name
- **OUTLET**: Specific publication
- **BEAT**: Their coverage area
- **WHAT**: Exact story angle aligned to this lever
- **WHEN**: Timing

### 2. SOCIAL POSTS (Signaldesk auto-executes)
- **WHO**: Person posting (CEO, brand account, CMO, etc.)
- **PLATFORM**: LinkedIn, Twitter, Instagram, etc.
- **WHAT**: Post topic/angle
- **KEY MESSAGES**: 2-3 bullet points
- **WHEN**: Timing

### 3. THOUGHT LEADERSHIP (Signaldesk auto-executes)
- **WHO**: Author (CEO, CTO, subject matter expert)
- **WHAT**: Article title/topic
- **WHERE**: Target publication (TechCrunch, HBR, company blog, Medium, etc.)
- **KEY POINTS**: Main arguments/insights
- **WHEN**: Timing

### 4. ADDITIONAL TACTICS (User must execute)
- **TYPE**: webinar, podcast, event, partnership, etc.
- **WHO**: Who from the organization executes
- **WHAT**: Description of tactic
- **WHERE**: Platform/venue
- **WHEN**: Timing
- **ESTIMATED EFFORT**: Time/resources needed

## CRITICAL GUIDELINES

1. **Use Part 2 Levers**: Each stakeholder in Part 2 has ~4 influence levers. Use those EXACT levers as your foundation.

2. **Multi-Channel for Each Lever**: Every lever gets 2 media pitches, 2-3 social posts, 1 thought leadership piece, and 1 additional tactic. Keep it focused and efficient.

3. **Align Content to Signaldesk Capabilities**: Only include content Signaldesk can actually generate:
   - Media pitches ✅
   - Social posts ✅
   - Thought leadership articles ✅
   - Blog posts ✅
   - Case studies ✅
   - White papers ✅

   NOT auto-executable (user must do):
   - Webinars, events, partnerships, video production, product changes

4. **Be SPECIFIC**:
   - Actual journalist names from the research
   - Exact story angles, not generic topics
   - Real publication targets
   - Specific people from the org (CEO, CMO, etc.)

5. **Timing Matters**: Sequence tactics logically (can't amplify what doesn't exist, can't pitch media without foundational content)

## OUTPUT FORMAT

Return ONLY valid JSON with this EXACT structure:

\`\`\`json
{
  "stakeholderOrchestrationPlans": [
    {
      "stakeholder": {
        "name": "Technical Leaders & CTOs",
        "priority": 1,
        "psychologicalProfile": {
          "primaryFear": "Making wrong technical decisions that impact company trajectory",
          "primaryAspiration": "Be recognized as visionary technical leader",
          "decisionTrigger": "Peer validation from respected technical leaders"
        }
      },
      "influenceLevers": [
        {
          "leverName": "Fear Mitigation: De-risk AI Coding Decision",
          "leverType": "Fear Mitigation",
          "priority": 1,
          "objective": "Show that Codex is the safe, proven choice for enterprise AI coding",
          "campaign": {
            "leverName": "Fear Mitigation: De-risk AI Coding Decision",
            "leverType": "Fear Mitigation",
            "objective": "Show that Codex is the safe, proven choice for enterprise AI coding",
            "mediaPitches": [
              {
                "who": "Kyle Wiggers",
                "outlet": "TechCrunch",
                "beat": "AI and developer tools",
                "what": "How Fortune 500 companies are de-risking AI coding adoption",
                "when": "Week 1"
              },
              {
                "who": "Ron Miller",
                "outlet": "TechCrunch",
                "beat": "Enterprise technology",
                "what": "Case study: Successful AI coding deployment at scale",
                "when": "Week 2"
              }
            ],
            "socialPosts": [
              {
                "who": "CEO",
                "platform": "LinkedIn",
                "what": "Enterprise AI coding adoption best practices",
                "keyMessages": [
                  "Security and compliance are non-negotiable",
                  "Phased rollout reduces risk"
                ],
                "when": "Week 1"
              },
              {
                "who": "Head of Engineering",
                "platform": "LinkedIn",
                "what": "Lessons from deploying AI coding at scale",
                "keyMessages": [
                  "Start with pilot team",
                  "Measure baseline metrics first"
                ],
                "when": "Week 2"
              }
            ],
            "thoughtLeadership": [
              {
                "who": "CTO",
                "what": "De-risking AI Coding Adoption: A Technical Leader's Guide",
                "where": "Harvard Business Review",
                "keyPoints": [
                  "Framework for evaluating AI tools",
                  "Security and ROI considerations"
                ],
                "when": "Week 3"
              }
            ],
            "additionalTactics": [
              {
                "type": "webinar",
                "who": "CTO + Customer",
                "what": "Enterprise AI Coding Deployment Playbook",
                "where": "Company webinar platform",
                "when": "Week 4",
                "estimatedEffort": "8 hours",
                "resources": ["Webinar platform"]
              }
            ]
          },
          "completionCriteria": [
            "2+ tier-1 media placements",
            "CTO thought leadership published",
            "Webinar completed"
          ]
        }
      ]
    }
  ]
}
\`\`\`

## KEY PRINCIPLES

1. **Use Part 2 Influence Levers as Foundation**: Don't invent new levers - use the exact psychological levers from Part 2 (fear mitigation, aspiration activation, decision triggers, objection handling).

2. **WHO → WHAT → WHERE for Everything**:
   - Media: WHO = specific journalist, WHAT = exact story angle, WHERE = outlet
   - Social: WHO = person posting, WHAT = post topic, WHERE = platform
   - Thought leadership: WHO = author, WHAT = article title, WHERE = publication
   - Other tactics: WHO = person executing, WHAT = description, WHERE = venue/platform

3. **Multi-Channel by Default**: Each lever should have 2 media pitches, 2-3 social posts, 1 thought leadership piece, and 1 additional tactic. Quality over quantity.

4. **Align to Signaldesk Capabilities**:
   - Signaldesk AUTO-EXECUTES: media pitches, social posts, thought leadership, blog posts, case studies
   - User MUST EXECUTE: webinars, events, videos, product changes, partnerships

5. **Use Real Journalist Names**: Pull from the channelIntelligence.journalists[] data in Part 2. Use actual names, outlets, and beats.

6. **Specific, Not Generic**: "How [Company] reduced code review time by 40% with AI coding" NOT "AI coding best practices"

7. **Logical Timing**: Week 1 = foundation content, Week 2-3 = amplification, Week 4+ = advanced tactics

## CRITICAL REMINDERS

- Return ONLY valid JSON, no markdown wrapper, no explanations
- Each stakeholder gets ALL their influence levers from Part 2 (usually 3-4 levers)
- Each lever gets a complete multi-channel campaign
- Be specific with WHO, WHAT, WHERE - no placeholders like "[Customer Name]" unless you truly don't have the data

Generate the complete stakeholder orchestration plan now in valid JSON format.`
}
