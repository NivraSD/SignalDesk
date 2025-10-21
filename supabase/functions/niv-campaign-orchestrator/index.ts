// NIV Campaign Orchestrator V4 - Total-Spectrum Communications
// Generates CASCADE, MIRROR, CHORUS, TROJAN, NETWORK campaign blueprints
// Grounded in academic research from Knowledge Library Registry

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CampaignRequest {
  concept: {
    goal?: string
    audience?: string
    narrative?: string
    timeline?: string
    budget?: string
    constraints?: string[]
  }
  pattern: 'CASCADE' | 'MIRROR' | 'CHORUS' | 'TROJAN' | 'NETWORK'
  knowledge: any  // From Knowledge Library Registry
  organizationContext: any
  researchFindings?: any
}

interface CampaignBlueprint {
  pattern: string
  strategy: {
    objective: string
    narrative: string
    keyMessages: string[]
  }
  vectors: Array<{
    stakeholder_group: string
    message: string
    channel: string
    timing: string
    content_types: string[]
    concealment: string
  }>
  timeline: {
    total_duration: string
    phases: Array<{
      name: string
      duration: string
      activities: string[]
    }>
    convergence_date?: string
  }
  contentStrategy: {
    autoExecutableContent: {
      contentTypes: string[]
      totalPieces: number
    }
  }
  executionPlan: {
    vectors: any[]
    autoExecutableContent: any
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: CampaignRequest = await req.json()
    console.log(`🎯 Campaign Orchestrator: Generating ${request.pattern} campaign blueprint`)

    const { concept, pattern, knowledge, organizationContext, researchFindings } = request

    // Build context for Claude from knowledge base
    const knowledgeContext = buildKnowledgeContext(knowledge, pattern)
    const researchContext = buildResearchContext(researchFindings)

    // Generate campaign blueprint using Claude with pattern-specific guidance
    const blueprint = await generateCampaignBlueprint(
      concept,
      pattern,
      knowledgeContext,
      researchContext,
      organizationContext
    )

    if (!blueprint) {
      throw new Error('Failed to generate campaign blueprint')
    }

    console.log(`✅ Campaign blueprint generated:`)
    console.log(`   Pattern: ${blueprint.pattern}`)
    console.log(`   Vectors: ${blueprint.vectors?.length || 0}`)
    console.log(`   Content Types: ${blueprint.contentStrategy?.autoExecutableContent?.contentTypes?.length || 0}`)

    return new Response(
      JSON.stringify({
        success: true,
        blueprint: blueprint,
        pattern: pattern,
        action: {
          type: 'campaign_ready',
          ui_prompt: 'Open Campaign Planner to review and execute',
          data: {
            pattern: pattern,
            blueprint: blueprint
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Campaign Orchestrator error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function buildKnowledgeContext(knowledge: any, pattern: string): string {
  if (!knowledge || !knowledge.data) {
    return ''
  }

  const { foundational, pattern_specific, industry_intelligence } = knowledge.data

  let context = `\n# ACADEMIC FOUNDATION FOR ${pattern} CAMPAIGNS\n\n`

  // Add pattern-specific research
  if (pattern_specific && pattern_specific.length > 0) {
    context += `## ${pattern} Research & Case Studies:\n`
    pattern_specific.slice(0, 10).forEach((item: any) => {
      context += `\n**${item.title}**`
      if (item.author) context += ` by ${item.author}`
      context += `\n`
      if (item.key_concepts) {
        context += `Key Concepts: ${item.key_concepts.join(', ')}\n`
      }
      if (item.metrics) {
        context += `Metrics: ${JSON.stringify(item.metrics)}\n`
      }
    })
  }

  // Add foundational psychology
  if (foundational && foundational.length > 0) {
    context += `\n## Foundational Principles:\n`
    foundational.slice(0, 5).forEach((item: any) => {
      context += `\n**${item.title}**`
      if (item.author) context += ` by ${item.author}`
      if (item.key_concepts) {
        context += `\n- ${item.key_concepts.join('\n- ')}\n`
      }
    })
  }

  // Add industry benchmarks
  if (industry_intelligence && industry_intelligence.length > 0) {
    context += `\n## Industry Intelligence:\n`
    industry_intelligence.slice(0, 3).forEach((item: any) => {
      context += `\n**${item.title}**`
      if (item.key_concepts) {
        context += `\n- ${item.key_concepts.join('\n- ')}\n`
      }
    })
  }

  return context
}

function buildResearchContext(researchFindings: any): string {
  if (!researchFindings) {
    return ''
  }

  let context = '\n# CURRENT LANDSCAPE RESEARCH\n\n'

  if (researchFindings.intelligencePipeline) {
    context += `## Intelligence Synthesis:\n${researchFindings.intelligencePipeline.synthesis}\n\n`
  }

  if (researchFindings.articles && researchFindings.articles.length > 0) {
    context += `## Key Articles:\n`
    researchFindings.articles.slice(0, 5).forEach((article: any) => {
      context += `\n- ${article.title || article.headline}\n`
      if (article.description) {
        context += `  ${article.description}\n`
      }
    })
  }

  return context
}

async function generateCampaignBlueprint(
  concept: any,
  pattern: string,
  knowledgeContext: string,
  researchContext: string,
  organizationContext: any
): Promise<CampaignBlueprint | null> {

  const patternGuidance = getPatternGuidance(pattern)

  const prompt = `You are a senior PR strategist generating a ${pattern} total-spectrum communications campaign.

${patternGuidance}

${knowledgeContext}

${researchContext}

## CAMPAIGN CONCEPT
Goal: ${concept.goal || 'Not specified'}
Audience: ${concept.audience || 'Not specified'}
Narrative: ${concept.narrative || 'Not specified'}
Timeline: ${concept.timeline || '6-8 weeks'}
Budget: ${concept.budget || 'Not specified'}

## YOUR TASK

Generate a complete ${pattern} campaign blueprint with:

1. **Strategy**: Overall objective, narrative arc, key messages
2. **Multi-Vector Execution**: Different messages to different stakeholders that naturally converge
3. **Timeline**: Phased approach with convergence point
4. **Content Strategy**: Specific content types for each vector

## STAKEHOLDER GROUPS (choose 3-5 relevant ones):
- academics: White papers, research, credibility
- niche_communities: Forums, Reddit, specialized groups
- adjacent_industries: Cross-sector influence
- investors: Financial narrative, market positioning
- culture_education: Broader societal conversation
- media: Traditional coverage amplification
- employees: Internal champions, advocacy

## CONTENT TYPES AVAILABLE (use diverse types, not just press releases):

**Media & PR**: press-release, media-pitch, media-kit, media-list, podcast-pitch, tv-interview-prep, thought-leadership, case-study, white-paper

**Social Media**: social-post, linkedin-post, twitter-thread, instagram-caption, facebook-post

**Email**: email, newsletter, drip-sequence, cold-outreach

**Executive**: executive-statement, board-presentation, investor-update, crisis-response, apology-statement

**Strategy**: messaging, brand-narrative, value-proposition, competitive-positioning

**Visual**: image, infographic, social-graphics, presentation, video

## CRITICAL INSTRUCTIONS

1. **Apply the academic research** - Reference the frameworks and case studies provided
2. **Think multi-vector** - Different messages to different stakeholders, not one message to all
3. **Be specific** - Exact stakeholder groups, channels, content types, timing
4. **Plan convergence** - How do these independent seeds come together?
5. **Use diverse content types** - Match content type to stakeholder and channel

Respond with a JSON object in this exact structure:

{
  "pattern": "${pattern}",
  "strategy": {
    "objective": "Clear, measurable campaign objective",
    "narrative": "Overarching narrative that ties everything together",
    "keyMessages": ["Message 1", "Message 2", "Message 3"]
  },
  "vectors": [
    {
      "stakeholder_group": "academics",
      "message": "Specific message for this group",
      "channel": "academic journals, conferences",
      "timing": "Week 1-2",
      "content_types": ["white-paper", "case-study"],
      "concealment": "Appears as independent research, no direct brand connection"
    }
  ],
  "timeline": {
    "total_duration": "8 weeks",
    "phases": [
      {
        "name": "Phase 1: Seed Planting",
        "duration": "Weeks 1-3",
        "activities": ["Activity 1", "Activity 2"]
      }
    ],
    "convergence_date": "Week 6 (optional)"
  },
  "contentStrategy": {
    "autoExecutableContent": {
      "contentTypes": ["white-paper", "twitter-thread", "media-pitch", "case-study"],
      "totalPieces": 12
    }
  },
  "executionPlan": {
    "vectors": [/* same as vectors array above */],
    "autoExecutableContent": {
      "contentTypes": ["list of all content types"],
      "stakeholderMapping": {
        "academics": ["white-paper", "case-study"],
        "niche_communities": ["twitter-thread", "social-post"]
      }
    }
  }
}

RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status)
      return null
    }

    const data = await response.json()
    const responseText = data.content[0].text

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response')
      return null
    }

    const blueprint = JSON.parse(jsonMatch[0])
    return blueprint

  } catch (error) {
    console.error('Error generating blueprint:', error)
    return null
  }
}

function getPatternGuidance(pattern: string): string {
  const guidance: Record<string, string> = {
    CASCADE: `## CASCADE PATTERN GUIDANCE

**Philosophy**: Plant 15-20 unconnected seeds → Pattern emerges → Natural convergence → Product becomes answer to existing conversation

**Key Principles** (from research):
- Damon Centola's 25% tipping point for social change
- Weak ties (Granovetter) spread information faster than strong ties
- Multiple independent sources create legitimacy
- Timing: Seeds need 4-6 weeks to germinate before convergence

**Execution**:
1. Plant seeds in 5+ disconnected communities
2. Each seed appears independent (no obvious brand connection)
3. Seeds reference each other naturally over time
4. Product launch becomes the inevitable answer`,

    MIRROR: `## MIRROR PATTERN GUIDANCE

**Philosophy**: Predict inevitable crisis → Pre-position as solution → When crisis hits, you're the safe alternative

**Key Principles** (from research):
- Inoculation Theory (McGuire): Prebunk, don't debunk
- Social Amplification of Risk (Kasperson)
- Crisis Communication Theory (Coombs SCCT framework)
- Early warning systems detect issues before explosion

**Execution**:
1. Identify predictable industry crisis
2. Pre-position as having solved it already
3. Build credibility before crisis hits
4. When crisis explodes, you're the proven alternative`,

    CHORUS: `## CHORUS PATTERN GUIDANCE

**Philosophy**: Authentic grassroots that looks grassroots but amplifies strategically

**Key Principles** (from research):
- Authenticity markers (real people, real stories)
- FTC disclosure requirements (stay legal)
- Micro-influencers > Macro-influencers for engagement
- Community norms matter (Reddit vs Twitter vs LinkedIn)

**Execution**:
1. Identify genuine advocates (customers, employees)
2. Amplify their authentic voices
3. Support with resources, not scripts
4. Stay within ethical boundaries (PRSA Code)`,

    TROJAN: `## TROJAN PATTERN GUIDANCE

**Philosophy**: Hide message inside what they want → They extract message themselves → No resistance

**Key Principles** (from research):
- Narrative Transportation Theory
- Elaboration Likelihood Model (peripheral route)
- Indirect persuasion reduces counter-arguing
- Stories > Arguments

**Execution**:
1. Identify what target audience craves
2. Embed your message in that vehicle
3. Make message discovery feel like their insight
4. No obvious persuasion attempt`,

    NETWORK: `## NETWORK PATTERN GUIDANCE

**Philosophy**: Map influence chains → Target influencer's influencer → Idea reaches target as trusted wisdom

**Key Principles** (from research):
- Three degrees of influence (Christakis & Fowler)
- Network centrality measures
- Bridge connections (Granovetter)
- Influence flows through trusted paths

**Execution**:
1. Map target audience's influence network
2. Identify 2-3 degrees removed influencers
3. Plant idea at source
4. Let it flow naturally through trusted channels`
  }

  return guidance[pattern] || guidance['CASCADE']
}
