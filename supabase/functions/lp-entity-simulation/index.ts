/**
 * LP Entity Simulation
 *
 * Simulates how a single entity responds to a scenario (Round 1)
 * or to prior round content (Round 2+).
 *
 * Key insight: This is stakeholder-orchestration run FROM the entity's perspective.
 * Same structure, flipped viewpoint.
 *
 * The chain:
 * 1. Relevance assessment — Does this scenario affect this entity?
 * 2. Impact analysis — How does it affect their priorities/vulnerabilities?
 * 3. Response decision (respond | wait | silent)
 * 4. Strategy selection (defend, attack, capture, redirect, align, differentiate)
 * 5. Multi-channel response generation
 * 6. Cascade prediction — Who else will this response affect?
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')

interface EntitySimulationRequest {
  entity_id: string
  entity_name: string
  profile_id: string
  round_number: number
  scenario: any
  prior_responses?: any[]
  themes_so_far?: string[]
  dominant_narratives?: string[]
  gaps_identified?: string[]
  entity_memory?: any
}

interface EntitySimulationResponse {
  response_decision: string
  decision_rationale: string
  position_summary: string
  key_claims: string[]
  thought_leadership?: string
  media_pitch?: string
  social_response?: string
  entities_referenced: string[]
  themes_championed: string[]
  predicted_reactions: Array<{
    entity_id: string
    predicted_response: string
    confidence: number
  }>
  model_used: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body: EntitySimulationRequest = await req.json()

    if (!body.entity_id || !body.scenario) {
      return errorResponse('entity_id and scenario required', 400)
    }

    console.log(`🎭 Entity Simulation: ${body.entity_name} (Round ${body.round_number})`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Load entity profile
    const { data: profile, error: profileError } = await supabase
      .from('lp_entity_profiles')
      .select('*')
      .eq('id', body.profile_id)
      .single()

    if (profileError || !profile) {
      return errorResponse(`Entity profile not found: ${profileError?.message}`, 404)
    }

    // Run simulation
    const result = await simulateEntityResponse(
      profile,
      body.scenario,
      body.round_number,
      body.prior_responses || [],
      body.themes_so_far || [],
      body.dominant_narratives || [],
      body.gaps_identified || [],
      body.entity_memory
    )

    const duration = Date.now() - startTime
    console.log(`✅ ${body.entity_name}: ${result.response_decision} (${duration}ms)`)

    return jsonResponse({
      ...result,
      processing_time_ms: duration
    })

  } catch (err: any) {
    console.error('❌ Entity simulation error:', err.message)
    return errorResponse(err.message || 'Simulation failed', 500)
  }
})

async function simulateEntityResponse(
  profile: any,
  scenario: any,
  roundNumber: number,
  priorResponses: any[],
  themesSoFar: string[],
  dominantNarratives: string[],
  gapsIdentified: string[],
  entityMemory: any
): Promise<EntitySimulationResponse> {

  if (!GOOGLE_API_KEY) {
    throw new Error('No GOOGLE_API_KEY configured')
  }

  // Build the prompt
  const prompt = buildSimulationPrompt(
    profile,
    scenario,
    roundNumber,
    priorResponses,
    themesSoFar,
    dominantNarratives,
    gapsIdentified,
    entityMemory
  )

  // Call Gemini
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
      })
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini error ${response.status}: ${text.substring(0, 200)}`)
  }

  const result = await response.json()
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse response
  return parseSimulationResponse(content, profile.entity_name)
}

function buildSimulationPrompt(
  profile: any,
  scenario: any,
  roundNumber: number,
  priorResponses: any[],
  themesSoFar: string[],
  dominantNarratives: string[],
  gapsIdentified: string[],
  entityMemory: any
): string {
  const entityProfile = profile.profile || profile

  let prompt = `You are simulating how ${profile.entity_name} would respond to a scenario.

## Entity Profile
Name: ${profile.entity_name}
Type: ${profile.entity_type}

Identity: ${JSON.stringify(entityProfile.identity || {}, null, 2)}

Voice: ${JSON.stringify(entityProfile.voice || {}, null, 2)}

Priorities: ${JSON.stringify(entityProfile.priorities || {}, null, 2)}

Patterns: ${JSON.stringify(entityProfile.patterns || {}, null, 2)}

Vulnerabilities: ${JSON.stringify(entityProfile.vulnerabilities || {}, null, 2)}

Current Context: ${JSON.stringify(entityProfile.current_context || {}, null, 2)}

## Scenario
${JSON.stringify(scenario, null, 2)}

## Simulation Context
Round: ${roundNumber}
`

  if (roundNumber > 1 && priorResponses.length > 0) {
    prompt += `
## Prior Round Responses
${priorResponses.map(r => `
**${r.entity_name}** (${r.response_decision}):
Position: ${r.position_summary}
Key Claims: ${r.key_claims?.join(', ') || 'None'}
Themes: ${r.themes_championed?.join(', ') || 'None'}
`).join('\n')}

## Themes Emerging: ${themesSoFar.join(', ') || 'None yet'}
## Dominant Narratives: ${dominantNarratives.join(', ') || 'None yet'}
## Gaps (opportunities): ${gapsIdentified.join(', ') || 'None identified'}
`

    if (entityMemory) {
      prompt += `
## Your History in This Simulation
Prior Positions: ${entityMemory.positions_taken?.map((p: any) => `Round ${p.round}: ${p.position}`).join('; ') || 'None'}
Attacks Received: ${entityMemory.attacks_received?.map((a: any) => `From ${a.from}: ${a.attack}`).join('; ') || 'None'}
Credibility: ${entityMemory.credibility_trajectory || 'stable'}
`
    }
  }

  prompt += `
## Your Task
Simulate ${profile.entity_name}'s response to this scenario. Think like their leadership team would think.

Consider:
1. How does this scenario affect YOUR priorities and vulnerabilities?
2. What's your strategic interest here?
3. Who in the discourse are you aligned with? Opposed to?
4. What narrative serves YOUR interests?
5. Should you respond at all, or stay silent?

## Response Decision Options
- **respond**: Active, substantive response
- **counter**: Directly challenge another entity's position
- **amplify**: Support/boost an ally's position
- **fill_gap**: Address something no one else covered
- **differentiate**: Stand out from similar positions
- **build**: Add to a growing narrative you support
- **synthesize**: Unify multiple threads into your framing
- **wait**: Hold position, observe
- **silent**: No strategic value in responding

Output ONLY valid JSON:
{
  "response_decision": "respond|counter|amplify|fill_gap|differentiate|build|synthesize|wait|silent",
  "decision_rationale": "Why this entity chose this response approach",
  "position_summary": "1-2 sentence summary of their stance (empty if silent/wait)",
  "key_claims": ["Specific claims they would make"],
  "thought_leadership": "A paragraph of thought leadership content they might publish (optional, only if responding)",
  "media_pitch": "A brief media pitch angle (optional)",
  "social_response": "A social media response (optional)",
  "entities_referenced": ["Names of entities they reference or respond to"],
  "themes_championed": ["Key themes/narratives they're pushing"],
  "predicted_reactions": [
    {
      "entity_id": "entity name",
      "predicted_response": "How they expect others to react",
      "confidence": 0.0-1.0
    }
  ]
}

Be authentic to this entity's voice, priorities, and patterns. Don't be generic.`

  return prompt
}

function parseSimulationResponse(content: string, entityName: string): EntitySimulationResponse {
  // Clean and parse JSON
  let clean = content.trim()

  if (clean.includes('```json')) {
    const match = clean.match(/```json\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  } else if (clean.includes('```')) {
    const match = clean.match(/```\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  }

  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1)
  }

  try {
    const parsed = JSON.parse(clean)
    return {
      response_decision: parsed.response_decision || 'respond',
      decision_rationale: parsed.decision_rationale || '',
      position_summary: parsed.position_summary || '',
      key_claims: parsed.key_claims || [],
      thought_leadership: parsed.thought_leadership,
      media_pitch: parsed.media_pitch,
      social_response: parsed.social_response,
      entities_referenced: parsed.entities_referenced || [],
      themes_championed: parsed.themes_championed || [],
      predicted_reactions: parsed.predicted_reactions || [],
      model_used: 'gemini-2.5-flash'
    }
  } catch (e) {
    // Fallback for parse errors
    console.warn(`JSON parse failed for ${entityName}, using fallback`)
    return {
      response_decision: 'respond',
      decision_rationale: 'Parse error - using generic response',
      position_summary: content.substring(0, 200),
      key_claims: [],
      entities_referenced: [],
      themes_championed: [],
      predicted_reactions: [],
      model_used: 'gemini-2.5-flash'
    }
  }
}
