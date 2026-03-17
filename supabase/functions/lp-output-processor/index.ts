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

async function callAI(prompt: string): Promise<{ text: string; model: string }> {
  if (GOOGLE_API_KEY) {
    try {
      const resp = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 6000 }
          }),
          signal: AbortSignal.timeout(50000)
        }
      )
      if (resp.ok) {
        const data = await resp.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (text) return { text, model: 'gemini-2.5-flash' }
      }
    } catch (err: any) {
      console.warn('Gemini failed:', err.message)
    }
  }

  if (ANTHROPIC_API_KEY) {
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
          max_tokens: 6000,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: AbortSignal.timeout(50000)
      }
    )
    if (resp.ok) {
      const data = await resp.json()
      const text = data.content?.[0]?.text || ''
      if (text) return { text, model: 'claude-sonnet-4' }
    }
  }

  throw new Error('No AI model available')
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

    // Build context from rounds
    const roundContext = rounds.map((round: any) => {
      const responses = round.entity_responses || []
      const active = responses.filter((r: any) => r.response_decision !== 'silent')
      return `Round ${round.round_number} (${round.cross_analysis?.phase_name || 'Unknown'}): ${active.map((r: any) => `${r.entity_name}: ${r.position_summary || r.decision_rationale}`).join('; ')}`
    }).join('\n')

    const fulcrumContext = fulcrums.map((f: any) =>
      `[${f.fulcrum_id}] ${f.type}: ${f.description}${f.target_entity ? ` (target: ${f.target_entity})` : ''} — ${f.rationale}`
    ).join('\n')

    const prompt = `You are a strategic communications advisor. Generate watch conditions and playbooks for each fulcrum identified in this simulation.

## Simulation Context
Entities: ${(simulation.entities || []).map((e: any) => e.entity_name).join(', ')}
Dominant narratives: ${(simulation.dominant_narratives || []).join(', ')}

## Round Summary
${roundContext}

## Fulcrums to Process
${fulcrumContext}

For EACH fulcrum, generate:
1. A **watch condition**: a specific, observable trigger signal to monitor
2. A **playbook**: tactical response plan if the trigger fires

Output ONLY valid JSON:
{
  "outputs": [
    {
      "fulcrum_id": "f_1",
      "watch_condition": {
        "condition_name": "Short descriptive name",
        "trigger_description": "Specific observable event that signals this fulcrum is activating",
        "monitoring_source": "media monitoring|regulatory filings|social listening|industry events|financial reports|etc",
        "threshold": "When to trigger (e.g., '2+ media mentions in 48hrs', 'official statement published')",
        "priority": "critical|high|medium|low"
      },
      "playbook": {
        "playbook_name": "Action-oriented name",
        "headline_response": "One sentence: the first thing the client should say/do",
        "talking_points": ["3-5 specific, ready-to-use talking points"],
        "positioning_statement": "2-3 sentence positioning statement for the client",
        "media_angle": "How to pitch this to media",
        "social_draft": "Ready-to-post social media message",
        "sequence_notes": "Step-by-step: what to do in what order over 72 hours",
        "cascade_prediction": "What happens after the client executes this playbook",
        "priority": "critical|high|medium|low"
      }
    }
  ]
}

Be specific and actionable. Reference actual entity names. Every talking point should be usable as-is.`

    const { text, model } = await callAI(prompt)
    const parsed = robustParseJSON(text)

    if (!parsed?.outputs || !Array.isArray(parsed.outputs)) {
      return errorResponse('Failed to parse AI output', 500)
    }

    console.log(`✅ Generated ${parsed.outputs.length} watch condition + playbook pairs [${model}]`)

    // Save to DB
    const savedConditions: any[] = []

    for (const output of parsed.outputs) {
      const wc = output.watch_condition
      const pb = output.playbook
      if (!wc || !pb) continue

      // Insert watch condition
      const { data: wcRow, error: wcErr } = await supabase
        .from('lp_watch_conditions')
        .insert({
          simulation_id,
          fulcrum_id: output.fulcrum_id || 'unknown',
          condition_name: wc.condition_name || 'Unnamed condition',
          trigger_description: wc.trigger_description || '',
          monitoring_source: wc.monitoring_source || null,
          threshold: wc.threshold || null,
          status: 'active',
          priority: ['critical', 'high', 'medium', 'low'].includes(wc.priority) ? wc.priority : 'medium'
        })
        .select()
        .single()

      if (wcErr || !wcRow) {
        console.error(`Watch condition insert failed:`, wcErr?.message)
        continue
      }

      // Insert playbook linked to watch condition
      const { data: pbRow, error: pbErr } = await supabase
        .from('lp_playbooks')
        .insert({
          watch_condition_id: wcRow.id,
          simulation_id,
          playbook_name: pb.playbook_name || 'Unnamed playbook',
          headline_response: pb.headline_response || null,
          talking_points: Array.isArray(pb.talking_points) ? pb.talking_points : [],
          positioning_statement: pb.positioning_statement || null,
          media_angle: pb.media_angle || null,
          social_draft: pb.social_draft || null,
          sequence_notes: pb.sequence_notes || null,
          cascade_prediction: pb.cascade_prediction || null,
          priority: ['critical', 'high', 'medium', 'low'].includes(pb.priority) ? pb.priority : 'medium'
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
