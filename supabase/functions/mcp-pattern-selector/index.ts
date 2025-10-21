import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PatternSelectorRequest {
  enrichedData: any
  campaignGoal: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { enrichedData, campaignGoal } = await req.json() as PatternSelectorRequest

    console.log('🎨 MCP Pattern Selector:', {
      goal: campaignGoal.substring(0, 50),
      stakeholderCount: enrichedData?.researchData?.stakeholders?.length || 0
    })

    const startTime = Date.now()

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    // Retry logic for JSON parsing issues
    let patternSelection
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} to select pattern...`)

    const systemPrompt = `You are an expert in campaign pattern selection for VECTOR campaigns.

## Your Task
Select the optimal pattern (CASCADE, MIRROR, CHORUS, TROJAN, or NETWORK) for this campaign.

## The 5 Patterns

**CASCADE**: Viral chain reaction through social amplification
- Best for: Consumer awareness, social causes, community mobilization
- Mechanics: Shareable content → social proof → exponential spread
- Example: ALS Ice Bucket Challenge

**MIRROR**: Unified response to crisis or competitive attack
- Best for: Crisis response, defensive positioning, reputation management
- Mechanics: Consistent messaging across all channels simultaneously
- Example: Johnson & Johnson Tylenol crisis response

**CHORUS**: Coordinated multi-voice advocacy
- Best for: B2B influence, enterprise sales, industry positioning
- Mechanics: Owned + influencers + media + events all singing same message
- Example: Salesforce Dreamforce ecosystem

**TROJAN**: Indirect persuasion through trusted intermediaries
- Best for: Skeptical audiences, complex technical solutions, change management
- Mechanics: Plant message in trusted third-party content
- Example: AWS case studies published by customers

**NETWORK**: Deep relationship cultivation with key nodes
- Best for: Enterprise deals, partnership development, advisory board building
- Mechanics: 1-on-1 influence of decision makers and connectors
- Example: McKinsey partner network cultivation

## Your Responsibilities
1. Analyze campaign goal and stakeholder landscape
2. Match to pattern based on:
   - Stakeholder decision journey
   - Trust dynamics (who influences whom)
   - Channel preferences
   - Timeline and urgency
   - Message complexity
3. Select PRIMARY pattern
4. Recommend ALTERNATIVE pattern (backup)
5. Explain rationale using research evidence

Output ONLY valid JSON:
{
  "selectedPattern": {
    "pattern": "CASCADE | MIRROR | CHORUS | TROJAN | NETWORK",
    "rationale": "Why this pattern fits (2-3 sentences with research evidence)",
    "confidence": 0.85,
    "pillarEmphasis": {
      "pillar1_owned": "low | medium | high",
      "pillar2_relationships": "low | medium | high",
      "pillar3_events": "low | medium | high",
      "pillar4_media": "low | medium | high"
    },
    "timeline": "Weeks 1-12",
    "keyMechanics": ["Mechanism 1", "Mechanism 2", "Mechanism 3"]
  },
  "alternativePattern": {
    "pattern": "Different pattern",
    "rationale": "When to pivot to this",
    "confidence": 0.65
  },
  "riskFactors": [
    "Risk 1 that could derail this pattern",
    "Risk 2 to watch for"
  ]
}`

    const historicalInsights = enrichedData?.researchData?.historicalInsights || {}
    const stakeholders = enrichedData?.researchData?.stakeholders || []
    const narrativeLandscape = enrichedData?.researchData?.narrativeLandscape || {}
    const knowledgeLibrary = enrichedData?.knowledgeLibrary || {}

    const userPrompt = `# Campaign Goal
${campaignGoal}

# STAKEHOLDER LANDSCAPE
${stakeholders.map((s: any) => `
**${s.name || s.role}**
- Psychology: ${s.psychology?.fears?.[0] || 'Unknown'} (fear), ${s.psychology?.aspirations?.[0] || 'Unknown'} (aspiration)
- Decision Triggers: ${(s.decisionTriggers || []).join(', ')}
- Influence: ${s.influenceLevel || 'medium'}
`).join('\n')}

# HISTORICAL INSIGHTS
${JSON.stringify(historicalInsights, null, 2)}

# NARRATIVE LANDSCAPE
${JSON.stringify(narrativeLandscape, null, 2)}

# PATTERN-SPECIFIC RESEARCH
${JSON.stringify(knowledgeLibrary.pattern_specific?.slice(0, 5) || [], null, 2)}

## Instructions

Analyze this campaign and select the optimal pattern:

1. **Assess stakeholder dynamics:**
   - Who are the key decision makers?
   - Who influences them?
   - What trust relationships exist?

2. **Match to pattern:**
   - CASCADE: Need viral spread through social proof?
   - MIRROR: Facing crisis or competitive attack?
   - CHORUS: Need coordinated multi-channel influence?
   - TROJAN: Skeptical audience needs indirect persuasion?
   - NETWORK: Deep 1-on-1 relationships with key nodes?

3. **Consider timeline:**
   - Urgent (weeks): MIRROR or CASCADE
   - Medium (months): CHORUS or TROJAN
   - Long-term (quarters): NETWORK

4. **Set pillar emphasis:**
   - CASCADE: high owned, medium relationships, low events, high media
   - MIRROR: high owned, medium relationships, low events, high media
   - CHORUS: medium owned, high relationships, high events, high media
   - TROJAN: medium owned, high relationships, medium events, low media
   - NETWORK: low owned, high relationships, high events, medium media

5. **Identify risks:**
   - What could derail this pattern?
   - When should we pivot to alternative?

Output valid JSON with your selection, rationale using research evidence, and alternative pattern.

**CRITICAL: Your response must be ONLY valid JSON. No markdown, no explanations, just pure JSON.**
- Use double quotes for all strings
- Escape any quotes inside strings with backslash
- No trailing commas
- No comments
- Ensure all braces and brackets are properly closed`

    // Use tool calling to force valid JSON schema
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      tools: [{
        name: 'select_campaign_pattern',
        description: 'Select optimal campaign pattern based on stakeholder analysis and campaign goals',
        input_schema: {
          type: 'object',
          properties: {
            selectedPattern: {
              type: 'object',
              properties: {
                pattern: { type: 'string', enum: ['CASCADE', 'MIRROR', 'CHORUS', 'TROJAN', 'NETWORK'] },
                rationale: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                pillarEmphasis: {
                  type: 'object',
                  properties: {
                    pillar1_owned: { type: 'string', enum: ['low', 'medium', 'high'] },
                    pillar2_relationships: { type: 'string', enum: ['low', 'medium', 'high'] },
                    pillar3_events: { type: 'string', enum: ['low', 'medium', 'high'] },
                    pillar4_media: { type: 'string', enum: ['low', 'medium', 'high'] }
                  },
                  required: ['pillar1_owned', 'pillar2_relationships', 'pillar3_events', 'pillar4_media']
                },
                timeline: { type: 'string' },
                keyMechanics: { type: 'array', items: { type: 'string' } }
              },
              required: ['pattern', 'rationale', 'confidence', 'pillarEmphasis', 'timeline', 'keyMechanics']
            },
            alternativePattern: {
              type: 'object',
              properties: {
                pattern: { type: 'string', enum: ['CASCADE', 'MIRROR', 'CHORUS', 'TROJAN', 'NETWORK'] },
                rationale: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['pattern', 'rationale', 'confidence']
            },
            riskFactors: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['selectedPattern', 'alternativePattern', 'riskFactors']
        }
      }],
      tool_choice: { type: 'tool', name: 'select_campaign_pattern' },
      messages: [{ role: 'user', content: userPrompt }]
    })

    // Extract tool call result (guaranteed valid JSON from Claude)
    const content = message.content.find((block: any) => block.type === 'tool_use')

    if (!content || content.type !== 'tool_use') {
      throw new Error('No tool use response from Claude')
    }

    // Tool use returns already-parsed JSON object - no parsing needed!
    patternSelection = content.input

    console.log('✅ Tool use returned valid pattern selection:', patternSelection.selectedPattern.pattern)

        // Validate structure
        if (!patternSelection.selectedPattern || !patternSelection.selectedPattern.pattern) {
          throw new Error('No pattern selected')
        }

        // Success!
        console.log(`✅ Valid pattern selection generated on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`⚠️ Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('❌ All attempts failed. Last error:', error.message)
          throw new Error(`Failed to select pattern after ${maxAttempts} attempts: ${error.message}`)
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Pattern selected: ${patternSelection.selectedPattern.pattern} (${elapsedTime}ms, ${attempts} attempts)`)

    return new Response(
      JSON.stringify(patternSelection),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Pattern selector error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to select pattern'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
