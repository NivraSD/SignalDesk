/**
 * LP Output Processor
 * Extracts watch conditions + playbooks from completed simulations
 * so they feed into daily monitoring (Phase 2.5)
 *
 * Input: { simulation_id: string, force?: boolean }
 * Output: { success, watch_conditions_count, playbooks_count }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')

// ═══════════════════════════════════════════
// Shared helpers (matching lp-scenario-builder)
// ═══════════════════════════════════════════

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 2000
): Promise<Response> {
  const retryableStatuses = [429, 500, 502, 503, 529]
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)
    if (response.ok || !retryableStatuses.includes(response.status)) {
      return response
    }
    if (attempt < maxRetries) {
      const jitter = Math.random() * 0.5 + 1
      const delay = Math.round(baseDelay * Math.pow(2, attempt) * jitter)
      console.log(`⚠️ API returned ${response.status}, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    } else {
      return response
    }
  }
  throw new Error('Unexpected: retry loop exited without returning')
}

function parseJSON(text: string): any {
  let clean = text.trim()

  try { return JSON.parse(clean) } catch (_) { /* continue */ }

  // Strip markdown fences
  if (clean.includes('```json')) {
    const match = clean.match(/```json\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  } else if (clean.includes('```')) {
    const match = clean.match(/```\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  }

  try { return JSON.parse(clean) } catch (_) { /* continue */ }

  // Bracket extraction — try array first, then object
  const firstBracket = clean.indexOf('[')
  const lastBracket = clean.lastIndexOf(']')
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    try { return JSON.parse(clean.substring(firstBracket, lastBracket + 1)) } catch (_) { /* continue */ }
  }

  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(clean.substring(firstBrace, lastBrace + 1)) } catch (_) { /* continue */ }
  }

  throw new Error('Failed to parse JSON from AI response')
}

async function callGemini(prompt: string, maxTokens = 8000): Promise<any> {
  if (!GOOGLE_API_KEY) throw new Error('No Google API key configured')

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens }
      })
    }
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Gemini error: ${response.status} ${errText.slice(0, 200)}`)
  }

  const result = await response.json()
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return parseJSON(content)
}

async function callClaude(prompt: string, maxTokens = 8000): Promise<any> {
  if (!ANTHROPIC_API_KEY) throw new Error('No Anthropic API key configured')

  const response = await fetchWithRetry(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    }
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Claude error: ${response.status} ${errText.slice(0, 200)}`)
  }

  const result = await response.json()
  const content = result.content?.[0]?.text || ''
  return parseJSON(content)
}

async function callAI(prompt: string, maxTokens = 8000): Promise<any> {
  try {
    return await callGemini(prompt, maxTokens)
  } catch (err) {
    console.warn(`Gemini failed: ${err.message}, trying Claude...`)
    return await callClaude(prompt, maxTokens)
  }
}

// ═══════════════════════════════════════════
// Voyage AI batch embedding
// ═══════════════════════════════════════════

async function batchEmbed(texts: string[]): Promise<(number[] | null)[]> {
  if (!VOYAGE_API_KEY || texts.length === 0) {
    return texts.map(() => null)
  }

  // Truncate each text to 8000 chars for embedding
  const truncated = texts.map(t => t.slice(0, 8000))

  try {
    const response = await fetchWithRetry(
      'https://api.voyageai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VOYAGE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'voyage-3-large',
          input: truncated,
          input_type: 'document'
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error(`Voyage API error: ${response.status} ${errText.slice(0, 200)}`)
      return texts.map(() => null)
    }

    const data = await response.json()
    return data.data.map((d: { embedding: number[] }) => d.embedding)
  } catch (err) {
    console.error('Voyage embed error:', err.message)
    return texts.map(() => null)
  }
}

// ═══════════════════════════════════════════
// Prompt builder
// ═══════════════════════════════════════════

function buildExtractionPrompt(
  fulcrums: any[],
  scenarioAction: string,
  scenarioType: string,
  orgName: string,
  orgIndustry: string,
  entityNames: string[]
): string {
  return `You are an intelligence analyst extracting actionable watch conditions from a completed narrative simulation.

## Context
- Organization: ${orgName} (${orgIndustry || 'unspecified industry'})
- Scenario: ${scenarioAction}
- Scenario type: ${scenarioType}
- Entities in simulation: ${entityNames.join(', ')}

## Fulcrums from Simulation
${fulcrums.map((f, i) => `
### Fulcrum ${i + 1}: ${f.description}
- Type: ${f.type}
- Target: ${f.target_entity || 'none'}
- Confidence: ${f.confidence || 'unknown'}
- Effort: ${f.effort_level || 'unknown'}
- Impact: ${f.impact_level || 'unknown'}
- Cascade predictions: ${(f.cascade_prediction || []).join('; ') || 'none'}
- Rationale: ${f.rationale || ''}
`).join('\n')}

## Your Task
For each fulcrum, produce 1-3 watch conditions. Each watch condition is a CONCRETE, OBSERVABLE event that ${orgName} should monitor for in real news/media. Each watch condition gets a paired playbook with actual draft content.

## Output Format
Return a JSON array:
[
  {
    "fulcrum_index": 0,
    "watch_conditions": [
      {
        "condition_text": "A concrete event to watch for (e.g., 'Microsoft announces partnership with competitor X in AI diagnostics')",
        "condition_context": "Why this matters — how it connects to the fulcrum",
        "target_entity": "Entity name to watch (from the simulation entities)",
        "confidence": 0.7,
        "playbook": {
          "title": "Response: [Event Description]",
          "headline_response": "1-2 sentence public response draft that ${orgName} could issue",
          "talking_points": ["Bullet 1 for spokesperson", "Bullet 2", "Bullet 3"],
          "positioning_statement": "How this connects to ${orgName}'s strategic narrative",
          "media_angle": "Press pitch framing for proactive outreach (or null if not applicable)",
          "social_draft": "Ready-to-post social media text (or null if not applicable)",
          "response_urgency": "immediate|hours|days|weeks",
          "sequence_notes": "What to do first, second, third",
          "cascade_prediction": ["If this happens, then X", "Then Y might follow"]
        }
      }
    ]
  }
]

Rules:
- Watch conditions must be SPECIFIC and OBSERVABLE — not vague ("industry shifts")
- Playbook content must be ACTUAL DRAFTS, not placeholders
- Match target_entity to one of the simulation entity names when relevant
- 1-3 watch conditions per fulcrum based on complexity
- Return valid JSON array only`
}

// ═══════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { simulation_id, force } = body

    if (!simulation_id) {
      return errorResponse('simulation_id is required', 400)
    }

    console.log(`🔄 LP Output Processor: simulation=${simulation_id}, force=${!!force}`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // ── Step 1: Load simulation ──
    const { data: simulation, error: simError } = await supabase
      .from('lp_simulations')
      .select('*')
      .eq('id', simulation_id)
      .single()

    if (simError || !simulation) {
      return errorResponse(`Simulation not found: ${simulation_id}`, 404)
    }

    if (!['stabilized', 'max_rounds_reached'].includes(simulation.status)) {
      return errorResponse(
        `Simulation status is '${simulation.status}' — must be stabilized or max_rounds_reached`,
        400
      )
    }

    // ── Step 2: Check processed_at ──
    if (simulation.processed_at && !force) {
      console.log('📋 Already processed, returning existing watch conditions')
      const { data: existing } = await supabase
        .from('lp_watch_conditions')
        .select('*, lp_playbooks(*)')
        .eq('simulation_id', simulation_id)

      return jsonResponse({
        success: true,
        already_processed: true,
        processed_at: simulation.processed_at,
        watch_conditions_count: existing?.length || 0,
        watch_conditions: existing || []
      })
    }

    const fulcrums = simulation.fulcrums || []
    if (fulcrums.length === 0) {
      return errorResponse('Simulation has no fulcrums to process', 400)
    }

    // ── Step 3: Load scenario + org context ──
    const [scenarioRes, orgRes] = await Promise.all([
      supabase
        .from('lp_scenarios')
        .select('id, type, scenario_data')
        .eq('id', simulation.scenario_id)
        .single(),
      supabase
        .from('organizations')
        .select('id, name, industry')
        .eq('id', simulation.organization_id)
        .single()
    ])

    const scenario = scenarioRes.data
    const org = orgRes.data
    const scenarioAction = scenario?.scenario_data?.action?.what || 'Unknown scenario'
    const scenarioType = scenario?.type || scenario?.scenario_data?.type || 'unknown'
    const orgName = org?.name || 'Organization'
    const orgIndustry = org?.industry || ''

    // ── Step 4: Build entity name map ──
    const entities = simulation.entities || []
    const entityMap = new Map<string, string>()
    for (const e of entities) {
      if (e.entity_id && e.entity_name) {
        entityMap.set(e.entity_id, e.entity_name)
      }
    }
    const entityNames = entities.map((e: any) => e.entity_name).filter(Boolean)

    // Resolve entity UUIDs in fulcrums to names
    const resolvedFulcrums = fulcrums.map((f: any) => ({
      ...f,
      target_entity: f.target_entity
        ? (entityMap.get(f.target_entity) || f.target_entity)
        : f.target_entity
    }))

    // ── Step 5: Call AI to extract watch conditions + playbooks ──
    console.log(`🤖 Extracting watch conditions from ${resolvedFulcrums.length} fulcrums...`)
    const prompt = buildExtractionPrompt(
      resolvedFulcrums,
      scenarioAction,
      scenarioType,
      orgName,
      orgIndustry,
      entityNames
    )

    const aiResult = await callAI(prompt, 8000)
    const fulcrumOutputs: any[] = Array.isArray(aiResult) ? aiResult : [aiResult]

    // ── Step 6: Flatten into watch conditions + playbooks ──
    const allConditions: any[] = []
    for (const fo of fulcrumOutputs) {
      const fulcrumIdx = fo.fulcrum_index ?? 0
      const sourceFulcrum = resolvedFulcrums[fulcrumIdx] || resolvedFulcrums[0]

      for (const wc of (fo.watch_conditions || [])) {
        allConditions.push({
          condition_text: wc.condition_text,
          condition_context: wc.condition_context,
          target_entity: wc.target_entity,
          confidence: wc.confidence || sourceFulcrum?.confidence || 0.5,
          fulcrum_id: sourceFulcrum?.fulcrum_id || `fulcrum_${fulcrumIdx}`,
          fulcrum_type: sourceFulcrum?.type,
          effort_level: sourceFulcrum?.effort_level,
          impact_level: sourceFulcrum?.impact_level,
          scenario_context: {
            scenario_title: scenarioAction,
            scenario_type: scenarioType
          },
          playbook: wc.playbook
        })
      }
    }

    console.log(`📝 Extracted ${allConditions.length} watch conditions`)

    if (allConditions.length === 0) {
      return errorResponse('AI produced no watch conditions', 500)
    }

    // ── Step 7: Batch embed condition texts ──
    console.log('🔢 Embedding condition texts...')
    const conditionTexts = allConditions.map(c =>
      `Watch for: ${c.condition_text}. Context: ${c.condition_context || ''}. Target: ${c.target_entity || ''}`
    )
    const embeddings = await batchEmbed(conditionTexts)

    // ── Step 8: Delete existing (if re-processing) ──
    if (force && simulation.processed_at) {
      console.log('🗑️ Deleting existing watch conditions for re-processing...')
      await supabase
        .from('lp_watch_conditions')
        .delete()
        .eq('simulation_id', simulation_id)
      // Playbooks cascade-delete via FK
    }

    // ── Step 9: Insert watch conditions + playbooks ──
    let insertedConditions = 0
    let insertedPlaybooks = 0

    for (let i = 0; i < allConditions.length; i++) {
      const c = allConditions[i]
      const embedding = embeddings[i]

      const { data: wcRow, error: wcError } = await supabase
        .from('lp_watch_conditions')
        .insert({
          simulation_id,
          organization_id: simulation.organization_id,
          fulcrum_id: c.fulcrum_id,
          fulcrum_type: c.fulcrum_type,
          condition_text: c.condition_text,
          condition_context: c.condition_context,
          target_entity: c.target_entity,
          embedding: embedding ? JSON.stringify(embedding) : null,
          confidence: c.confidence,
          effort_level: c.effort_level,
          impact_level: c.impact_level,
          scenario_context: c.scenario_context,
          status: 'active'
        })
        .select('id')
        .single()

      if (wcError) {
        console.error(`⚠️ Failed to insert watch condition ${i}:`, wcError.message)
        continue
      }

      insertedConditions++

      // Insert paired playbook
      if (c.playbook && wcRow) {
        const pb = c.playbook
        const { error: pbError } = await supabase
          .from('lp_playbooks')
          .insert({
            watch_condition_id: wcRow.id,
            simulation_id,
            organization_id: simulation.organization_id,
            title: pb.title || `Response: ${c.condition_text.slice(0, 60)}`,
            headline_response: pb.headline_response,
            talking_points: pb.talking_points || [],
            positioning_statement: pb.positioning_statement,
            media_angle: pb.media_angle || null,
            social_draft: pb.social_draft || null,
            response_urgency: pb.response_urgency || 'days',
            sequence_notes: pb.sequence_notes,
            fulcrum_type: c.fulcrum_type,
            target_entity: c.target_entity,
            cascade_prediction: pb.cascade_prediction || [],
            status: 'ready'
          })

        if (pbError) {
          console.error(`⚠️ Failed to insert playbook for condition ${i}:`, pbError.message)
        } else {
          insertedPlaybooks++
        }
      }
    }

    // ── Step 10: Mark simulation as processed ──
    await supabase
      .from('lp_simulations')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', simulation_id)

    console.log(`✅ Done: ${insertedConditions} conditions, ${insertedPlaybooks} playbooks`)

    return jsonResponse({
      success: true,
      watch_conditions_count: insertedConditions,
      playbooks_count: insertedPlaybooks,
      total_fulcrums: fulcrums.length
    })

  } catch (err) {
    console.error('❌ LP Output Processor error:', err.message)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
