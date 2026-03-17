/**
 * LP Entity Simulation
 *
 * Simulates how a single entity responds to a scenario (Round 1)
 * or to prior round content (Round 2+).
 *
 * Includes: fetchWithRetry, robust JSON parsing, Claude fallback, concise prompts.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface EntitySimulationRequest {
  entity_id: string
  entity_name: string
  profile_id: string
  round_number: number
  phase?: { id: string; name: string; description: string; lens: string; focus_areas: string[] }
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

// === fetchWithRetry: exponential backoff with jitter ===
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 529])

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok || !RETRYABLE_STATUSES.has(response.status)) {
        return response
      }
      lastError = new Error(`HTTP ${response.status}`)
      console.warn(`[retry] Attempt ${attempt + 1}/${maxRetries + 1} got ${response.status}`)
    } catch (err: any) {
      lastError = err
      console.warn(`[retry] Attempt ${attempt + 1}/${maxRetries + 1} threw: ${err.message}`)
    }
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.random() * 1000
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastError || new Error('fetchWithRetry exhausted')
}

// === Robust JSON parsing ===

function repairJSON(text: string): string {
  return text
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
}

function tryParse(text: string): any {
  try { return JSON.parse(text) } catch {}
  try { return JSON.parse(repairJSON(text)) } catch {}
  return null
}

function robustParseJSON(content: string): any {
  // Layer 1: strip markdown fences
  let cleaned = content.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim()

  // Layer 2: direct parse
  let result = tryParse(cleaned)
  if (result) return result

  // Layer 3: string-aware bracket extraction
  const start = cleaned.indexOf('{')
  if (start === -1) return null

  let depth = 0, end = -1, inString = false, escaped = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break } }
  }

  if (end !== -1) {
    result = tryParse(cleaned.substring(start, end))
    if (result) return result
  }

  // Layer 4: truncation repair — close unclosed brackets
  let repair = cleaned.substring(start)
  const truncationPatterns = [
    /,\s*"[^"]*"?\s*:?\s*"?[^"]*$/,
    /,\s*"[^"]*"?\s*:?\s*\[[^\]]*$/,
    /,\s*"[^"]*"?\s*:?\s*\{[^}]*$/,
    /,\s*"[^"]*"?\s*:?\s*$/,
    /,\s*\{[^}]*$/,
    /,\s*"[^"]*$/,
  ]
  for (const pattern of truncationPatterns) {
    let attempt = repair.replace(pattern, '').replace(/,\s*$/, '')
    const openBraces = (attempt.match(/{/g) || []).length - (attempt.match(/}/g) || []).length
    const openBrackets = (attempt.match(/\[/g) || []).length - (attempt.match(/\]/g) || []).length
    for (let i = 0; i < openBrackets; i++) attempt += ']'
    for (let i = 0; i < openBraces; i++) attempt += '}'
    result = tryParse(attempt)
    if (result) return result
  }

  return null
}

// === Main handler ===

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

    // Build prompt
    const prompt = buildSimulationPrompt(
      profile,
      body.scenario,
      body.round_number,
      body.phase,
      body.prior_responses || [],
      body.themes_so_far || [],
      body.dominant_narratives || [],
      body.gaps_identified || [],
      body.entity_memory
    )

    // Try Gemini first, fall back to Claude
    let responseText = ''
    let modelUsed = 'unknown'

    if (GOOGLE_API_KEY) {
      try {
        const geminiResp = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
            }),
            signal: AbortSignal.timeout(45000)
          }
        )

        if (!geminiResp.ok) {
          throw new Error(`Gemini error ${geminiResp.status}`)
        }

        const geminiData = await geminiResp.json()
        responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
        modelUsed = 'gemini-2.5-flash'
      } catch (geminiErr: any) {
        console.warn(`⚠️ Gemini failed for ${body.entity_name}: ${geminiErr.message}`)
        // Fall through to Claude
      }
    }

    // Claude fallback
    if (!responseText && ANTHROPIC_API_KEY) {
      console.log(`🔄 Falling back to Claude for ${body.entity_name}`)
      try {
        const claudeResp = await fetchWithRetry(
          'https://api.anthropic.com/v1/messages',
          {
            method: 'POST',
            headers: {
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              temperature: 0.7,
              messages: [{ role: 'user', content: prompt }]
            }),
            signal: AbortSignal.timeout(45000)
          }
        )

        if (!claudeResp.ok) {
          throw new Error(`Claude error ${claudeResp.status}`)
        }

        const claudeData = await claudeResp.json()
        responseText = claudeData.content?.[0]?.text || ''
        modelUsed = 'claude-sonnet-4'
      } catch (claudeErr: any) {
        console.error(`❌ Claude also failed for ${body.entity_name}: ${claudeErr.message}`)
      }
    }

    if (!responseText) {
      throw new Error('Both Gemini and Claude failed — no AI response')
    }

    // Parse response with robust parser
    const result = parseSimulationResponse(responseText, body.entity_name, modelUsed)

    const duration = Date.now() - startTime
    console.log(`✅ ${body.entity_name}: ${result.response_decision} [${modelUsed}] (${duration}ms)`)

    return jsonResponse({
      ...result,
      processing_time_ms: duration
    })

  } catch (err: any) {
    console.error('❌ Entity simulation error:', err.message)
    return errorResponse(err.message || 'Simulation failed', 500)
  }
})

// === Concise prompt builder ===

function summarizeProfile(profile: any): string {
  const p = profile.profile || profile
  const identity = p.identity || {}
  const voice = p.voice || {}
  const priorities = p.priorities || {}
  const vulnerabilities = p.vulnerabilities || {}

  const lines: string[] = []
  lines.push(`Name: ${profile.entity_name}`)
  lines.push(`Type: ${profile.entity_type}`)

  // Identity — key fields only
  if (identity.sector) lines.push(`Sector: ${identity.sector}`)
  if (identity.description) lines.push(`Description: ${String(identity.description).substring(0, 150)}`)

  // Voice summary
  if (voice.tone) lines.push(`Voice tone: ${voice.tone}`)
  if (voice.style) lines.push(`Style: ${voice.style}`)

  // Top priorities (max 4)
  const prioList = priorities.strategic || priorities.top || priorities.list
  if (Array.isArray(prioList)) {
    lines.push(`Priorities: ${prioList.slice(0, 4).map((p: any) => typeof p === 'string' ? p : p.name || p.description || JSON.stringify(p)).join('; ')}`)
  } else if (typeof priorities === 'object' && Object.keys(priorities).length > 0) {
    const keys = Object.keys(priorities).slice(0, 4)
    lines.push(`Priorities: ${keys.map(k => `${k}: ${String(priorities[k]).substring(0, 60)}`).join('; ')}`)
  }

  // Vulnerabilities (max 3)
  if (Array.isArray(vulnerabilities)) {
    lines.push(`Vulnerabilities: ${vulnerabilities.slice(0, 3).map((v: any) => typeof v === 'string' ? v : v.name || v.description || '').join('; ')}`)
  } else if (vulnerabilities.list) {
    lines.push(`Vulnerabilities: ${vulnerabilities.list.slice(0, 3).join('; ')}`)
  } else if (typeof vulnerabilities === 'object' && Object.keys(vulnerabilities).length > 0) {
    lines.push(`Vulnerabilities: ${JSON.stringify(vulnerabilities).substring(0, 200)}`)
  }

  return lines.join('\n')
}

function buildSimulationPrompt(
  profile: any,
  scenario: any,
  roundNumber: number,
  phase: any,
  priorResponses: any[],
  themesSoFar: string[],
  dominantNarratives: string[],
  gapsIdentified: string[],
  entityMemory: any
): string {
  const phaseName = phase?.name || `Round ${roundNumber}`
  const phaseLens = phase?.lens || ''
  const phaseFocusAreas = phase?.focus_areas || []

  let prompt = `You are simulating how ${profile.entity_name} would respond to a scenario.

## Entity Profile
${summarizeProfile(profile)}

## Scenario
${JSON.stringify(scenario.scenario_data?.action || scenario.action || scenario, null, 2)}
`

  // Research intelligence — keep concise
  const researchCtx = scenario.scenario_data?.research_context || scenario.research_context
  if (researchCtx) {
    prompt += `\n## Intelligence Context\n`
    if (researchCtx.executive_summary) prompt += `${researchCtx.executive_summary}\n`
    if (researchCtx.situation?.key_developments?.length) {
      prompt += `Key developments: ${researchCtx.situation.key_developments.slice(0, 5).join('; ')}\n`
    }
    if (researchCtx.stakeholder_positions?.length) {
      prompt += `Known positions: ${researchCtx.stakeholder_positions.slice(0, 6).map((s: any) => `${s.name}: ${s.position || 'unknown'}`).join('; ')}\n`
    }
  }

  // Phase context
  prompt += `
## Phase: ${phaseName} (Round ${roundNumber})
${phase?.description || ''}
LENS: ${phaseLens}
Focus on: ${phaseFocusAreas.join(', ')}.
`

  if (roundNumber > 1 && priorResponses.length > 0) {
    // Inject only position_summary and key_claims from prior round
    prompt += `\n## Prior Responses\n`
    for (const r of priorResponses) {
      prompt += `**${r.entity_name}** (${r.response_decision}): ${r.position_summary}\n`
      if (r.key_claims?.length) prompt += `  Claims: ${r.key_claims.join('; ')}\n`
    }

    if (themesSoFar.length) prompt += `\nThemes: ${themesSoFar.join(', ')}\n`
    if (dominantNarratives.length) prompt += `Dominant narratives: ${dominantNarratives.join(', ')}\n`
    if (gapsIdentified.length) prompt += `Gaps: ${gapsIdentified.join(', ')}\n`

    if (entityMemory) {
      prompt += `\n## Your History\n`
      if (entityMemory.positions_taken?.length) {
        prompt += `Prior positions: ${entityMemory.positions_taken.map((p: any) => `R${p.round}: ${p.position}`).join('; ')}\n`
      }
      if (entityMemory.attacks_received?.length) {
        prompt += `Attacks: ${entityMemory.attacks_received.map((a: any) => `${a.from}: ${a.attack}`).join('; ')}\n`
      }
    }
  }

  prompt += `
## Task
Simulate ${profile.entity_name}'s response through the "${phaseName}" lens. Evolve from prior positions. Be specific to this phase.

Response decisions: respond | counter | amplify | fill_gap | differentiate | build | synthesize | wait | silent

Output ONLY valid JSON:
{
  "response_decision": "respond|counter|amplify|fill_gap|differentiate|build|synthesize|wait|silent",
  "decision_rationale": "Why this approach at this phase",
  "position_summary": "1-2 sentence stance (empty if silent/wait)",
  "key_claims": ["Specific claims for ${phaseFocusAreas.join(', ')}"],
  "thought_leadership": "Optional paragraph",
  "media_pitch": "Optional brief pitch",
  "social_response": "Optional social post",
  "entities_referenced": ["Names referenced"],
  "themes_championed": ["Narratives pushed"],
  "predicted_reactions": [{"entity_id": "name", "predicted_response": "prediction", "confidence": 0.7}]
}

Be authentic to this entity's voice and priorities.`

  return prompt
}

// === Response parser ===

function parseSimulationResponse(content: string, entityName: string, modelUsed: string): EntitySimulationResponse {
  const parsed = robustParseJSON(content)

  if (parsed) {
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
      model_used: modelUsed
    }
  }

  // Fallback for total parse failure
  console.warn(`JSON parse failed for ${entityName}, using fallback`)
  return {
    response_decision: 'respond',
    decision_rationale: 'Parse error - using generic response',
    position_summary: content.substring(0, 200),
    key_claims: [],
    entities_referenced: [],
    themes_championed: [],
    predicted_reactions: [],
    model_used: modelUsed
  }
}
