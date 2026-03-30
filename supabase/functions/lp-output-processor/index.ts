/**
 * LP Output Processor
 *
 * Takes simulation fulcrums + round data and generates:
 * - Watch conditions: trigger signals to monitor
 * - Playbooks: tactical response plans if watch conditions fire
 *
 * Saves to lp_watch_conditions and lp_playbooks tables.
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

// Normalize fulcrum type to safe values (handles CHECK constraint if it exists)
const VALID_FULCRUM_TYPES = new Set(['narrative_shift', 'regulatory', 'market', 'reputational', 'political', 'alliance'])
function safeFulcrumType(raw: string): string {
  const normalized = (raw || '').toLowerCase().replace(/[\s_-]+/g, '_')
  if (VALID_FULCRUM_TYPES.has(normalized)) return normalized
  // Map common variants
  if (normalized.includes('narrat')) return 'narrative_shift'
  if (normalized.includes('regulat') || normalized.includes('legal') || normalized.includes('policy')) return 'regulatory'
  if (normalized.includes('market') || normalized.includes('econom') || normalized.includes('financ')) return 'market'
  if (normalized.includes('reput') || normalized.includes('brand') || normalized.includes('trust')) return 'reputational'
  if (normalized.includes('politic') || normalized.includes('govern') || normalized.includes('election')) return 'political'
  if (normalized.includes('allian') || normalized.includes('partner') || normalized.includes('coalition')) return 'alliance'
  return 'reputational' // safe default
}

async function callAI(prompt: string): Promise<{ text: string; model: string }> {
  const t0 = Date.now()
  const elapsed = () => ((Date.now() - t0) / 1000).toFixed(1)

  // v3: direct fetch, no retry wrapper, Gemini 2.0 Flash (faster)
  if (GOOGLE_API_KEY) {
    console.log('[v3] Calling Gemini 2.5 Flash...')
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 16000 }
          }),
          signal: AbortSignal.timeout(60000)
        }
      )
      console.log(`[v3] Gemini responded: ${resp.status} after ${elapsed()}s`)
      if (resp.ok) {
        const data = await resp.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text) return { text, model: 'gemini-2.5-flash' }
      }
    } catch (err: any) {
      console.warn(`[v3] Gemini failed after ${elapsed()}s:`, err.message)
    }
  }

  if (ANTHROPIC_API_KEY) {
    console.log(`[v3] Calling Claude after ${elapsed()}s...`)
    try {
      const resp = await fetch(
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
            max_tokens: 16000,
            temperature: 0.5,
            messages: [{ role: 'user', content: prompt }]
          }),
          signal: AbortSignal.timeout(70000)
        }
      )
      console.log(`[v3] Claude responded: ${resp.status} after ${elapsed()}s`)
      if (resp.ok) {
        const data = await resp.json()
        const text = data.content?.[0]?.text || ''
        if (text) return { text, model: 'claude-sonnet-4' }
      }
    } catch (err: any) {
      console.warn(`[v3] Claude failed after ${elapsed()}s:`, err.message)
    }
  }

  throw new Error(`No AI model available (elapsed: ${elapsed()}s)`)
}

// === Main handler ===

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { simulation_id } = await req.json()
    if (!simulation_id) return errorResponse('simulation_id required', 400)

    console.log(`📋 Processing outputs for simulation ${simulation_id}`)

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
    const fulcrums = simulation.fulcrums || []

    if (fulcrums.length === 0) {
      return errorResponse('No fulcrums found — run fulcrum identification first', 400)
    }

    // Delete any existing watch conditions for this simulation (re-processing)
    await supabase.from('lp_watch_conditions').delete().eq('simulation_id', simulation_id)

    // Build CONCISE context from rounds — just decisions, not full summaries
    const roundContext = rounds.map((round: any) => {
      const responses = round.entity_responses || []
      const active = responses.filter((r: any) => r.response_decision !== 'silent')
      return `R${round.round_number} (${round.cross_analysis?.phase_name || '?'}): ${active.map((r: any) => `${r.entity_name}=${r.response_decision}`).join(', ')}`
    }).join('\n')

    const fulcrumContext = fulcrums.map((f: any) =>
      `[${f.fulcrum_id}] ${f.type}: ${f.description} (target: ${f.target_entity || 'N/A'})`
    ).join('\n')

    const prompt = `Generate watch conditions and playbooks for these simulation fulcrums. Output ONLY valid JSON.

Entities: ${(simulation.entities || []).map((e: any) => e.entity_name).join(', ')}
Narratives: ${(simulation.dominant_narratives || []).slice(0, 3).join(', ')}
Rounds: ${roundContext}

Fulcrums:
${fulcrumContext}

For EACH fulcrum, output a watch_condition and playbook. JSON format:
{"outputs":[{"fulcrum_id":"f_1","watch_condition":{"condition_name":"Short name","fulcrum_type":"narrative_shift|regulatory|market|reputational|political|alliance","trigger_description":"Observable trigger event","target_entity":"Entity to monitor","effort_level":"critical|high|medium|low","impact_level":"critical|high|medium|low"},"playbook":{"playbook_name":"Action name","headline_response":"First thing to say/do","talking_points":["Point 1","Point 2","Point 3"],"positioning_statement":"2 sentence position","media_angle":"Pitch angle","social_draft":"Ready-to-post message","sequence_notes":"72hr action plan","cascade_prediction":"What happens next","priority":"critical|high|medium|low"}}]}

Be specific but CONCISE. Each field should be 1-2 sentences max. Talking points: 3 bullet points, each under 20 words. Return one output per fulcrum.`

    const { text, model } = await callAI(prompt)
    console.log(`[v3] AI text (${text.length} chars): ${text.substring(0, 300)}...`)

    const parsed = robustParseJSON(text)
    console.log(`[v3] Parsed keys: ${parsed ? Object.keys(parsed).join(',') : 'NULL'}`)

    if (!parsed?.outputs || !Array.isArray(parsed.outputs)) {
      console.error(`[v3] Parse failed. Raw text last 200: ${text.substring(text.length - 200)}`)
      return errorResponse('Failed to parse AI output', 500)
    }

    console.log(`✅ Generated ${parsed.outputs.length} watch condition + playbook pairs [${model}]`)

    // Save to DB
    const savedConditions: any[] = []

    for (const output of parsed.outputs) {
      const wc = output.watch_condition
      const pb = output.playbook
      if (!wc || !pb) continue

      // Insert watch condition (matches actual lp_watch_conditions schema)
      const { data: wcRow, error: wcErr } = await supabase
        .from('lp_watch_conditions')
        .insert({
          simulation_id,
          organization_id: simulation.organization_id || null,
          fulcrum_id: output.fulcrum_id || 'unknown',
          fulcrum_type: safeFulcrumType(wc.fulcrum_type),
          condition_text: wc.condition_name || wc.condition_text || 'Unnamed condition',
          condition_context: wc.trigger_description || wc.condition_context || '',
          target_entity: wc.target_entity || wc.monitoring_source || null,
          status: 'active',
          effort_level: wc.effort_level || wc.priority || 'medium',
          impact_level: wc.impact_level || 'medium',
          scenario_context: wc.scenario_context || wc.threshold || null
        })
        .select()
        .single()

      if (wcErr || !wcRow) {
        console.error(`Watch condition insert failed:`, wcErr?.message)
        continue
      }

      // Insert playbook linked to watch condition (matches actual lp_playbooks schema)
      const { data: pbRow, error: pbErr } = await supabase
        .from('lp_playbooks')
        .insert({
          watch_condition_id: wcRow.id,
          simulation_id,
          organization_id: simulation.organization_id || null,
          title: pb.playbook_name || pb.title || 'Unnamed playbook',
          headline_response: pb.headline_response || null,
          talking_points: Array.isArray(pb.talking_points) ? pb.talking_points : (typeof pb.talking_points === 'string' ? [pb.talking_points] : []),
          positioning_statement: pb.positioning_statement || null,
          media_angle: pb.media_angle || null,
          social_draft: pb.social_draft || null,
          sequence_notes: typeof pb.sequence_notes === 'string' ? pb.sequence_notes : JSON.stringify(pb.sequence_notes || ''),
          cascade_prediction: Array.isArray(pb.cascade_prediction) ? pb.cascade_prediction : (typeof pb.cascade_prediction === 'string' ? [pb.cascade_prediction] : []),
          response_urgency: ['critical', 'high', 'medium', 'low'].includes(pb.priority) ? pb.priority : 'medium',
          fulcrum_type: safeFulcrumType(wc.fulcrum_type),
          target_entity: wc.target_entity || null,
          status: 'ready'
        })
        .select()
        .single()

      if (pbErr) {
        console.error(`Playbook insert failed:`, pbErr.message)
      }

      savedConditions.push({
        ...wcRow,
        lp_playbooks: pbRow ? [pbRow] : []
      })
    }

    console.log(`📋 Saved ${savedConditions.length} watch conditions + playbooks`)

    return jsonResponse({
      success: true,
      watch_conditions: savedConditions,
      model_used: model
    })

  } catch (err: any) {
    console.error('❌ Output processing error:', err.message)
    return errorResponse(err.message || 'Output processing failed', 500)
  }
})
