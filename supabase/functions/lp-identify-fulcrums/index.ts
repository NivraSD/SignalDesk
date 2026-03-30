/**
 * LP Identify Fulcrums
 *
 * Analyzes completed simulation rounds to identify strategic fulcrums:
 * - validator_path: entity whose validation would cascade support
 * - unoccupied_position: gap no entity claimed, client can own
 * - wedge_issue: topic that splits a coalition
 * - preemption: move client can make before competitors
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// === Shared utilities ===

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 529])

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok || !RETRYABLE_STATUSES.has(response.status)) return response
      lastError = new Error(`HTTP ${response.status}`)
      console.warn(`[retry] Attempt ${attempt + 1} got ${response.status}`)
    } catch (err: any) {
      lastError = err
      console.warn(`[retry] Attempt ${attempt + 1} threw: ${err.message}`)
    }
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.random() * 1000
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastError || new Error('fetchWithRetry exhausted')
}

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
  let cleaned = content.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim()
  let result = tryParse(cleaned)
  if (result) return result

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

  // Truncation repair
  let repair = cleaned.substring(start)
  const patterns = [
    /,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, /,\s*"[^"]*"?\s*:?\s*\[[^\]]*$/,
    /,\s*"[^"]*"?\s*:?\s*\{[^}]*$/, /,\s*"[^"]*"?\s*:?\s*$/,
    /,\s*\{[^}]*$/, /,\s*"[^"]*$/,
  ]
  for (const pattern of patterns) {
    let attempt = repair.replace(pattern, '').replace(/,\s*$/, '')
    const ob = (attempt.match(/{/g) || []).length - (attempt.match(/}/g) || []).length
    const oq = (attempt.match(/\[/g) || []).length - (attempt.match(/\]/g) || []).length
    for (let i = 0; i < oq; i++) attempt += ']'
    for (let i = 0; i < ob; i++) attempt += '}'
    result = tryParse(attempt)
    if (result) return result
  }
  return null
}

async function callAI(prompt: string): Promise<{ text: string; model: string }> {
  const startTime = Date.now()
  const remainingMs = () => 140000 - (Date.now() - startTime)

  // Try Gemini: 2 attempts max, 25s timeout each
  if (GOOGLE_API_KEY && remainingMs() > 30000) {
    try {
      const resp = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 8000 }
          }),
          signal: AbortSignal.timeout(25000)
        },
        1 // max 1 retry (2 attempts)
      )
      if (resp.ok) {
        const data = await resp.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text) return { text, model: 'gemini-2.5-flash' }
      }
    } catch (err: any) {
      console.warn(`Gemini failed after ${((Date.now() - startTime) / 1000).toFixed(1)}s:`, err.message)
    }
  }

  // Try Claude: single attempt with remaining time
  if (ANTHROPIC_API_KEY && remainingMs() > 10000) {
    try {
      const timeout = Math.min(remainingMs() - 5000, 60000)
      console.log(`Trying Claude with ${(timeout / 1000).toFixed(0)}s timeout`)
      const resp = await fetchWithRetry(
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
            max_tokens: 8000,
            temperature: 0.5,
            messages: [{ role: 'user', content: prompt }]
          }),
          signal: AbortSignal.timeout(timeout)
        },
        0 // no retries
      )
      if (resp.ok) {
        const data = await resp.json()
        const text = data.content?.[0]?.text || ''
        if (text) return { text, model: 'claude-sonnet-4' }
      }
    } catch (err: any) {
      console.warn(`Claude failed after ${((Date.now() - startTime) / 1000).toFixed(1)}s:`, err.message)
    }
  }

  throw new Error(`No AI model available (elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s)`)
}

// === Main handler ===

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { simulation_id } = await req.json()
    if (!simulation_id) return errorResponse('simulation_id required', 400)

    console.log(`🔍 Identifying fulcrums for simulation ${simulation_id}`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Load simulation + rounds
    const [simRes, roundsRes] = await Promise.all([
      supabase.from('lp_simulations').select('*').eq('id', simulation_id).single(),
      supabase.from('lp_simulation_rounds').select('*').eq('simulation_id', simulation_id).order('round_number')
    ])

    if (simRes.error || !simRes.data) {
      return errorResponse(`Simulation not found: ${simRes.error?.message}`, 404)
    }

    const simulation = simRes.data
    const rounds = roundsRes.data || []

    if (rounds.length === 0) {
      return errorResponse('No rounds found', 400)
    }

    // Build analysis prompt — summarize each round's key movements
    const roundSummaries = rounds.map((round: any) => {
      const responses = round.entity_responses || []
      const analysis = round.cross_analysis || {}
      const active = responses.filter((r: any) => r.response_decision !== 'silent')

      return `### Round ${round.round_number}: ${analysis.phase_name || 'Unknown'}
Entities responding: ${active.length}/${responses.length}
${active.slice(0, 8).map((r: any) =>
  `- **${r.entity_name}** (${r.response_decision}): ${r.position_summary || 'No position'}`
).join('\n')}
${analysis.coalitions?.length ? `Coalitions: ${analysis.coalitions.map((c: any) => `${c.name} [${c.members?.length || 0} members]`).join(', ')}` : ''}
${analysis.gaps?.length ? `Gaps: ${analysis.gaps.map((g: any) => g.description).join('; ')}` : ''}
Stabilization: ${(analysis.stabilization_score || 0).toFixed(2)}`
    }).join('\n\n')

    // Final round analysis for influence rankings
    const finalAnalysis = rounds[rounds.length - 1]?.cross_analysis || {}
    const influenceRankings = (finalAnalysis.influence_rankings || [])
      .slice(0, 8)
      .map((r: any) => `${r.entity_name}: score ${r.score?.toFixed(1) || 0}`)
      .join(', ')

    const prompt = `You are a strategic analyst. Analyze this multi-round stakeholder simulation and identify EXACTLY 5 strategic fulcrums — actionable leverage points for the client.

You MUST return exactly 5 fulcrums, one of each type listed below. Do not return fewer than 5.

## Simulation Summary
Scenario: ${JSON.stringify(simulation.dominant_narratives || []).substring(0, 200)}
Rounds completed: ${rounds.length}
Entities: ${(simulation.entities || []).map((e: any) => e.entity_name).join(', ')}

## Round-by-Round Analysis
${roundSummaries}

## Influence Rankings (Final)
${influenceRankings || 'None computed'}

## Gaps Identified
${(simulation.gaps_identified || []).join('; ') || 'None'}

## Coalitions
${(simulation.key_coalitions || []).map((c: any) => `${c.name}: ${(c.members || []).join(', ')} — ${c.shared_position}`).join('\n') || 'None'}

## Required Fulcrum Types (one of each)
1. **validator_path**: An entity whose endorsement/validation would cascade support from others. Identify WHO and WHY their validation matters.
2. **unoccupied_position**: A narrative gap no entity claimed. The client can own this space.
3. **wedge_issue**: A topic that could split an existing coalition. Identify the coalition and the fracture line.
4. **preemption**: A strategic move the client can make before competitors. Time-sensitive opportunity.
5. **validator_path**: A SECOND validator — a different entity whose support would unlock a different constituency.

Output ONLY valid JSON with exactly 5 fulcrums. Keep each fulcrum concise (2-3 sentences per field):
{
  "fulcrums": [
    {
      "fulcrum_id": "f_1",
      "type": "validator_path",
      "description": "2-3 sentence description",
      "target_entity": "Entity name",
      "rationale": "Why this is a leverage point",
      "cascade_prediction": ["What happens if client acts on this"],
      "effort_level": "low|medium|high",
      "impact_level": "low|medium|high",
      "confidence": 0.0-1.0
    },
    { "fulcrum_id": "f_2", "type": "unoccupied_position", "..." : "..." },
    { "fulcrum_id": "f_3", "type": "wedge_issue", "..." : "..." },
    { "fulcrum_id": "f_4", "type": "preemption", "..." : "..." },
    { "fulcrum_id": "f_5", "type": "validator_path", "..." : "..." }
  ]
}

Be specific. Reference actual entity names and positions from the simulation. You MUST return all 5 fulcrums.`

    const { text, model } = await callAI(prompt)
    console.log(`[LP] Raw AI response (${text.length} chars, first 500): ${text.substring(0, 500)}`)

    let parsed = robustParseJSON(text)

    // Handle case where AI returns array directly or uses different key
    if (parsed && !parsed.fulcrums) {
      if (Array.isArray(parsed)) {
        parsed = { fulcrums: parsed }
      } else if (parsed.results && Array.isArray(parsed.results)) {
        parsed = { fulcrums: parsed.results }
      } else if (parsed.data && Array.isArray(parsed.data)) {
        parsed = { fulcrums: parsed.data }
      }
    }

    if (!parsed?.fulcrums || !Array.isArray(parsed.fulcrums)) {
      console.error('Failed to parse fulcrums. Parsed result:', JSON.stringify(parsed)?.substring(0, 300))
      console.error('Raw text (last 200):', text.substring(text.length - 200))
      return jsonResponse({ fulcrums: [], model_used: model, error: 'Parse failed' })
    }

    // Normalize type names flexibly — keep all fulcrums that have a description
    const typeMap: Record<string, string> = {
      validator_path: 'validator_path', validator: 'validator_path', validation: 'validator_path',
      unoccupied_position: 'unoccupied_position', unoccupied: 'unoccupied_position', gap: 'unoccupied_position', narrative_gap: 'unoccupied_position',
      wedge_issue: 'wedge_issue', wedge: 'wedge_issue', fracture: 'wedge_issue', split: 'wedge_issue', coalition_fracture: 'wedge_issue',
      preemption: 'preemption', preemptive: 'preemption', first_mover: 'preemption', timing: 'preemption',
      narrative_ownership: 'unoccupied_position', narrative_shift: 'unoccupied_position',
      regulatory: 'preemption', regulatory_alignment: 'validator_path',
      coalition: 'wedge_issue', coalition_building: 'wedge_issue',
      differentiation: 'unoccupied_position', positioning: 'unoccupied_position',
    }
    const fulcrums = parsed.fulcrums
      .filter((f: any) => f.description)
      .map((f: any) => ({ ...f, type: typeMap[f.type?.toLowerCase()] || 'unoccupied_position' }))
      .map((f: any, i: number) => ({
        fulcrum_id: f.fulcrum_id || `f_${i + 1}`,
        type: f.type,
        description: f.description,
        target_entity: f.target_entity || null,
        rationale: f.rationale || '',
        cascade_prediction: Array.isArray(f.cascade_prediction) ? f.cascade_prediction : [],
        effort_level: ['low', 'medium', 'high'].includes(f.effort_level) ? f.effort_level : 'medium',
        impact_level: ['low', 'medium', 'high'].includes(f.impact_level) ? f.impact_level : 'medium',
        confidence: typeof f.confidence === 'number' ? Math.min(1, Math.max(0, f.confidence)) : 0.5
      }))

    console.log(`✅ Identified ${fulcrums.length}/${parsed.fulcrums.length} fulcrums [${model}]`)
    if (fulcrums.length < parsed.fulcrums.length) {
      const dropped = parsed.fulcrums.filter((f: any) => !f.description)
      console.warn(`Dropped ${dropped.length} fulcrums without description`)
    }

    return jsonResponse({ fulcrums, model_used: model })

  } catch (err: any) {
    console.error('❌ Fulcrum identification error:', err.message)
    return errorResponse(err.message || 'Fulcrum identification failed', 500)
  }
})
