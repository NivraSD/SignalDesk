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
  geoIntelligence?: {  // LEGACY: Old GEO-VECTOR format
    targetQueries: any[]
    citationSources: any[]
    schemaOpportunities: any[]
    contentRecommendations: any[]
    queryOwnershipMap: any
  }
  campaign_intelligence?: {  // NEW: Meta-analysis format
    targetQueries: Array<{ query: string, intent: string, priority: string }>
    competitiveIntelligence: {
      dominant_players: Array<{ name: string, mentions: number, platforms: string[], reasons: string[] }>
      total_competitors: number
      success_patterns: string
    }
    sourceStrategy: {
      priority_sources: Array<{ domain: string, mentions: number, platforms: string[] }>
      total_sources: number
    }
    platformAnalyses: any
  }
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
    const { part1_strategicFoundation, part2_psychologicalInfluence, sessionId, orgId, geoIntelligence, campaign_intelligence } = await req.json() as StakeholderOrchestrationRequest

    console.log('🎯 Generating stakeholder orchestration...')
    console.log('   Session:', sessionId)
    console.log('   Org:', orgId)
    console.log('   Part1 keys:', Object.keys(part1_strategicFoundation || {}))
    console.log('   Part2 keys:', Object.keys(part2_psychologicalInfluence || {}))
    console.log('   GEO Intelligence (legacy):', geoIntelligence ? '✅ Present' : '❌ Not present')
    console.log('   Campaign Intelligence (new):', campaign_intelligence ? '✅ Present (GEO-VECTOR campaign)' : '❌ Not present')

    if (!part1_strategicFoundation || !part2_psychologicalInfluence) {
      throw new Error('Missing required parts: need part1_strategicFoundation and part2_psychologicalInfluence')
    }

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Fetch company profile to ground content in reality
    let companyProfile: any = null
    if (orgId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, description, industry, company_profile')
          .eq('id', orgId)
          .single()

        if (org) {
          companyProfile = {
            name: org.name,
            description: org.description,
            industry: org.industry,
            ...(org.company_profile || {})
          }
          console.log('   ✅ Loaded company profile for grounding:', companyProfile.name)
        }
      } catch (err) {
        console.warn('   ⚠️ Could not fetch company profile:', err.message)
      }
    }

    // Build comprehensive prompt for Claude (with optional GEO intelligence)
    const prompt = buildOrchestrationPrompt(part1_strategicFoundation, part2_psychologicalInfluence, geoIntelligence, campaign_intelligence, companyProfile)

    console.log('📡 Calling Claude for orchestration generation...')

    // Try with primary model, fallback to Sonnet 4.5 if needed
    const models = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929']
    let response
    let lastError

    for (const model of models) {
      try {
        console.log(`  Trying model: ${model}`)
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 64000,  // Increased for comprehensive orchestration plans with multiple stakeholders and campaigns
            temperature: 0.5,
            system: 'You are a JSON generator. Return ONLY valid JSON with no markdown code blocks, no explanations, no preamble. Start with { and end with }.',
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        })

        if (response.ok) {
          console.log(`  ✅ Success with ${model}`)
          break
        } else {
          const errorText = await response.text()
          lastError = errorText
          console.log(`  ❌ ${model} failed: ${errorText.substring(0, 200)}`)
          continue
        }
      } catch (err) {
        lastError = err.message
        console.log(`  ❌ ${model} error: ${err.message}`)
        continue
      }
    }

    if (!response || !response.ok) {
      throw new Error(`All Claude models failed. Last error: ${lastError}`)
    }

    const data = await response.json()
    const rawText = data.content[0].text

    console.log('✅ Claude response received')
    console.log('   Response length:', rawText.length, 'characters')

    // Log token usage
    if (data.usage) {
      console.log('   Token usage:', JSON.stringify(data.usage))
    }

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
      console.error('❌ Failed to parse Claude response as JSON:', parseError.message)
      console.error('   Parse error at position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown')
      console.error('   Response length:', rawText.length, 'characters')
      console.error('   First 500 chars:', rawText.substring(0, 500))
      console.error('   Last 500 chars:', rawText.substring(rawText.length - 500))

      // Show the area around the error if we can find it
      const posMatch = parseError.message.match(/position (\d+)/)
      if (posMatch) {
        const errorPos = parseInt(posMatch[1])
        const start = Math.max(0, errorPos - 200)
        const end = Math.min(rawText.length, errorPos + 200)
        console.error('   Context around error:', rawText.substring(start, end))
      }

      throw new Error(`Failed to parse orchestration plans: ${parseError.message}`)
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

function buildOrchestrationPrompt(part1: any, part2: any, geoIntelligence?: any, campaign_intelligence?: any, companyProfile?: any): string {
  const currentDate = new Date().toISOString().split('T')[0]

  // Extract key info - adapt to actual Part 1 and Part 2 structure
  // Part 1 = goalFramework, Part 2 = stakeholderMapping with groups[]
  const stakeholders = part2.groups || part1.targetStakeholders || []
  const influenceStrategies = part2.influenceStrategies || part2.groups || []

  // Build NEW campaign intelligence section (competitive landscape + outlets + schema)
  let geoSection = ''

  if (campaign_intelligence) {
    const topCompetitors = campaign_intelligence.competitiveIntelligence?.dominant_players?.slice(0, 10).map((c: any) =>
      `- ${c.name}: ${c.mentions} mentions across ${c.platforms.join(', ')}\n  Why they win: ${c.reasons.slice(0, 2).join('; ')}`
    ).join('\n') || 'None identified'

    // Get MORE sources (15) to ensure diversity in outlet selection
    const topSources = campaign_intelligence.sourceStrategy?.priority_sources?.slice(0, 15).map((s: any, idx: number) =>
      `${idx + 1}. ${s.domain}: Cited by ${s.platforms.join(', ')}`
    ).join('\n') || 'None identified'

    geoSection = `

### 🎯 AI Query Ownership Strategy

This is a GEO-VECTOR campaign. Focus your tactics on:
1. **Competitive Landscape** - Who wins AI citations and why
2. **Key Outlets** - Where to target PR for AI platform authority
3. **Schema Opportunities** - Structured data to implement

---

#### 1. COMPETITIVE LANDSCAPE (Who Wins AI Citations for This Campaign Goal)

**Target Queries:**
${campaign_intelligence.targetQueries?.map((q: any) => `- "${q.query}" (${q.priority} priority)`).join('\n')}

**Dominant Competitors:**
${topCompetitors}

**Success Patterns:**
${campaign_intelligence.competitiveIntelligence?.success_patterns || 'Analysis pending'}

**Total Competitors Identified:** ${campaign_intelligence.competitiveIntelligence?.total_competitors || 0}

---

#### 2. KEY OUTLETS TO TARGET (Publications AI Platforms Trust)

**Priority Publications for PR:**
${topSources}

**Total Sources Analyzed:** ${campaign_intelligence.sourceStrategy?.total_sources || 0}

**Why These Matter:** AI platforms cite these publications most frequently for queries in this space. Getting featured here dramatically increases citation probability.

---

#### 3. SCHEMA OPPORTUNITIES

[Schema recommendations will be added based on competitive analysis above]

**CRITICAL DIVERSITY INSTRUCTIONS:**
- You MUST use at least 10 DIFFERENT publications across the entire campaign - NO outlet should appear more than 2 times total
- Pick outlets from the full list above (1-15) - spread your pitches across different domains
- If you only see 2-3 sources cited, EXPAND to include tier-1 industry publications like: Forbes, Bloomberg, Financial Times, The Economist, MIT Tech Review, Harvard Business Review, Fast Company, Entrepreneur, Inc Magazine, AdWeek, Campaign (UK), PRWeek, Ragan, The Drum, Digiday
- For Saudi Arabia/MENA focus, include: Arab News, Gulf News, Zawya, MEED, The National (UAE), Al Arabiya English, Asharq Business
- Every stakeholder/lever should target DIFFERENT outlets - check your work before finalizing
`
  } else if (geoIntelligence) {
    // Legacy format
    geoSection = `

### GEO Intelligence (AI Query Ownership - AUGMENTATION):
This is a GEO-VECTOR campaign. For each tactical action, you MUST add AI query ownership metadata showing how this tactic helps own target AI queries.

**Target Queries We Want to Own:**
${JSON.stringify(geoIntelligence.targetQueries?.slice(0, 15) || [], null, 2)}

**Citation Sources (which publications AI platforms trust):**
${JSON.stringify(geoIntelligence.citationSources?.slice(0, 10) || [], null, 2)}

**Gap Analysis:**
${geoIntelligence.synthesis?.gapAnalysis || 'Analysis pending'}

**Owned vs Unowned Queries:**
- Currently Own: ${geoIntelligence.ownedQueries?.length || 0} queries
- Don't Own (OPPORTUNITY): ${geoIntelligence.unownedQueries?.length || 0} queries

**SYNTHESIZED SCHEMA OPPORTUNITIES (MUST ADD AS additionalTactics):**
${JSON.stringify(geoIntelligence.synthesis?.schemaOpportunities || [], null, 2)}

**SYNTHESIZED CONTENT RECOMMENDATIONS:**
${JSON.stringify(geoIntelligence.synthesis?.contentRecommendations || [], null, 2)}

**Priority Actions:**
${geoIntelligence.synthesis?.priorityActions?.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n') || 'None'}

**CRITICAL INSTRUCTIONS FOR GEO-VECTOR:**
1. For EACH schema opportunity from synthesis, create an additionalTactic with:
   - type: "geo_schema_update"
   - who: "Technical team"
   - what: The schema opportunity title
   - where: "Website schema markup"
   - when: "Week 1" (schema is Priority 1)
   - schemaData: The full schema opportunity object
   - estimatedEffort: "1 hour"

2. For EVERY tactical action (media pitch, social post, thought leadership), add "aiQueryImpact" field with:
   - targetQueries: Which UNOWNED queries this helps you own
   - citationProbability: "high" | "medium" | "low"
   - timeline: When AI platforms will start citing this
   - platforms: Which AI platforms (ChatGPT, Claude, Perplexity, Gemini)
   - rationale: Why this tactic helps own those queries
`
  }

  // Build company context section for grounding
  const companyContextSection = companyProfile ? `

### COMPANY PROFILE (GROUND ALL CONTENT IN THIS REALITY):
**Company Name:** ${companyProfile.name || 'Not specified'}
**Description:** ${companyProfile.description || 'Not specified'}
**Industry:** ${companyProfile.industry || 'Not specified'}
**Services/Products:** ${companyProfile.services?.join(', ') || companyProfile.product_lines?.join(', ') || 'Not specified'}
**Key Markets:** ${companyProfile.key_markets?.join(', ') || 'Not specified'}
**Geographic Presence:** ${companyProfile.geographic_presence?.join(', ') || companyProfile.headquarters || 'Not specified'}
**Known Achievements/Case Studies:** ${companyProfile.achievements?.join(', ') || companyProfile.case_studies?.join(', ') || 'None specified - DO NOT FABRICATE'}
**Leadership:** ${companyProfile.leadership?.map((l: any) => typeof l === 'string' ? l : `${l.name || l.title}`).join(', ') || 'Not specified'}

## ⚠️ CRITICAL ANTI-HALLUCINATION RULES ⚠️

**YOU MUST NOT:**
1. **NEVER invent case studies, pilots, or success stories** that don't exist in the company profile above
2. **NEVER fabricate statistics, percentages, or specific numbers** (e.g., "40% efficiency gains")
3. **NEVER claim the company operates in markets** they're not in (check Geographic Presence)
4. **NEVER create fictional partnerships, clients, or testimonials**
5. **NEVER reference products or services** not listed in the company profile
6. **NEVER invent proprietary methodologies** or frameworks with trademarked names

**YOU MUST:**
1. **Ground all story angles in REAL capabilities** listed in the company profile
2. **Use aspirational/forward-looking language** for things the company wants to achieve (e.g., "seeking to expand into UK market" NOT "successfully serving UK healthcare")
3. **For markets they DON'T operate in yet:** Frame pitches around market entry, expansion plans, or industry expertise
4. **When suggesting case studies:** ONLY reference ones explicitly listed, or say "to be developed based on customer results"
5. **For statistics:** Use qualitative language ("many organizations", "growing demand") unless specific numbers are provided above

**EXAMPLE OF CORRECT vs INCORRECT:**
❌ WRONG: "NHS pilot success: How [Trust Name] achieved 40% procurement efficiency gains with AI automation"
✅ CORRECT: "How AI-powered fax automation is transforming healthcare intake processes in the US - and what UK healthcare can learn"

❌ WRONG: "Tennr's established UK healthcare partnerships drive NHS modernization"
✅ CORRECT: "US healthcare automation leader Tennr explores UK market expansion opportunities"

` : `

## ⚠️ ANTI-HALLUCINATION WARNING ⚠️
No company profile was provided. Generate GENERIC industry-focused content.
DO NOT invent specific case studies, statistics, or achievements.
Use aspirational language about what could be achieved, not claims of past success.

`

  return `You are an expert campaign strategist. Your task is to create a stakeholder orchestration plan using a multi-channel, WHO → WHAT → WHERE approach.

**TODAY'S DATE:** ${currentDate}

## INPUTS

### Stakeholders (from Part 1):
${JSON.stringify(stakeholders, null, 2)}

### Influence Strategies (from Part 2):
Each stakeholder has ~4 psychological influence levers (fear mitigation, aspiration activation, decision triggers, etc.)
${JSON.stringify(influenceStrategies, null, 2)}${companyContextSection}${geoSection}

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

1. **Use Part 2 Levers**: Each stakeholder in Part 2 has EXACTLY 4 influence levers with priorities 1-4. Use those EXACT levers as your foundation. MAINTAIN the priority numbers (1, 2, 3, 4) from Part 2 - do not change them!
   - Priority 1 = Fear Mitigation
   - Priority 2 = Aspiration Activation
   - Priority 3 = Social Proof
   - Priority 4 = Authority/Credibility

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

5. **MANDATORY OUTLET DIVERSITY**:
   - HARD RULE: No outlet can appear more than 2 times in the ENTIRE campaign
   - Track outlets as you generate: keep a mental list and check before adding each media pitch
   - Use at least 12 UNIQUE outlets across the campaign
   - Spread across: Global business (Bloomberg, Forbes, FT), Tech (TechCrunch, Wired, MIT Tech), Industry-specific (PRWeek, Campaign, AdWeek), Regional (Arab News, Gulf News, The National)
   - If you catch yourself reusing an outlet, STOP and pick a different one

6. **Timing Matters**: Sequence tactics logically (can't amplify what doesn't exist, can't pitch media without foundational content)

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
                "when": "Week 1",
                "aiQueryImpact": {
                  "targetQueries": ["best AI coding tools for enterprise", "enterprise AI coding adoption"],
                  "citationProbability": "high",
                  "timeline": "2-4 weeks",
                  "platforms": ["ChatGPT", "Perplexity"],
                  "rationale": "TechCrunch cited in 80% of enterprise software queries on ChatGPT"
                }
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

1. **Use Part 2 Influence Levers as Foundation**: Don't invent new levers - use the EXACT 4 psychological levers from Part 2 with their exact priority numbers (1=Fear Mitigation, 2=Aspiration Activation, 3=Social Proof, 4=Authority).

2. **WHO → WHAT → WHERE for Everything**:
   - Media: WHO = specific journalist, WHAT = exact story angle, WHERE = outlet
   - Social: WHO = person posting, WHAT = post topic, WHERE = platform
   - Thought leadership: WHO = author, WHAT = article title, WHERE = publication
   - Other tactics: WHO = person executing, WHAT = description, WHERE = venue/platform

3. **Multi-Channel by Default**: Each lever should have 2 media pitches, 2-3 social posts, 1 thought leadership piece, and 1 additional tactic. Quality over quantity.

4. **Align to Signaldesk Capabilities**:
   - Signaldesk AUTO-EXECUTES: media pitches, social posts, thought leadership, blog posts, case studies
   - User MUST EXECUTE: webinars, events, videos, product changes, partnerships

5. **AI Query Impact (GEO-VECTOR campaigns only)**:
   - If GEO Intelligence is provided above, add "aiQueryImpact" field to EVERY tactical action
   - Map each tactic to target queries it will help you own
   - Show citation probability based on publication/content type
   - If no GEO Intelligence provided, OMIT the aiQueryImpact field entirely (pure VECTOR campaign)

6. **Use Real Journalist Names**: Pull from the channelIntelligence.journalists[] data in Part 2. Use actual names, outlets, and beats.

7. **Specific, Not Generic**: "How [Company] reduced code review time by 40% with AI coding" NOT "AI coding best practices"

8. **Logical Timing**: Week 1 = foundation content, Week 2-3 = amplification, Week 4+ = advanced tactics

## CRITICAL REMINDERS

- Return ONLY valid JSON, no markdown wrapper, no explanations
- Each stakeholder gets ALL 4 influence levers from Part 2 (Priority 1, 2, 3, 4 - DO NOT SKIP ANY)
- Each lever gets a complete multi-channel campaign
- Be specific with WHO, WHAT, WHERE - no placeholders like "[Customer Name]" unless you truly don't have the data
- VERIFY you have created exactly 4 levers per stakeholder with priorities 1, 2, 3, and 4 before returning

Generate the complete stakeholder orchestration plan now in valid JSON format.`
}
