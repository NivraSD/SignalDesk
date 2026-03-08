/**
 * LP Scenario Builder
 * Guided dialogue to extract structured scenarios for Liminal Propagation simulation
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'
import {
  PROBE_SETS,
  getNextProbe,
  getAspectCategories,
  TYPE_DETECTION_PROMPT,
  STAKEHOLDER_INFERENCE_PROMPT,
  EXTERNAL_TRIGGER_TYPES
} from './probes.ts'
import type {
  ScenarioType,
  TriggerSource,
  LPScenario,
  ScenarioBuilderRequest,
  ScenarioBuilderResponse,
  StakeholderCategory
} from './types.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')

// Retry helper
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

// Parse JSON defensively
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

  // Bracket extraction
  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(clean.substring(firstBrace, lastBrace + 1)) } catch (_) { /* continue */ }
  }

  throw new Error('Failed to parse JSON from AI response')
}

// Call Gemini for analysis
async function callGemini(prompt: string): Promise<any> {
  if (!GOOGLE_API_KEY) throw new Error('No Google API key configured')

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return parseJSON(content)
}

// Call Claude for analysis (fallback)
async function callClaude(prompt: string): Promise<any> {
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
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Claude error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.content?.[0]?.text || ''
  return parseJSON(content)
}

// Call AI (Gemini primary, Claude fallback)
async function callAI(prompt: string): Promise<any> {
  try {
    return await callGemini(prompt)
  } catch (err) {
    console.warn(`Gemini failed: ${err.message}, trying Claude...`)
    return await callClaude(prompt)
  }
}

// Detect scenario type from description
async function detectScenarioType(
  description: string
): Promise<{ type: ScenarioType; trigger_source: TriggerSource; confidence: number; aspects: string[]; reasoning: string }> {
  const prompt = `${TYPE_DETECTION_PROMPT}

Description:
${description}`

  const result = await callAI(prompt)
  const type = result.type as ScenarioType
  // Determine trigger source from AI or from type
  const triggerSource: TriggerSource = result.trigger_source === 'external'
    || EXTERNAL_TRIGGER_TYPES.includes(type)
    ? 'external' : 'internal'

  return {
    type,
    trigger_source: triggerSource,
    confidence: result.confidence || 0.5,
    aspects: result.aspects || [],
    reasoning: result.reasoning || ''
  }
}

// Infer stakeholders from scenario
async function inferStakeholders(
  scenario: Partial<LPScenario>
): Promise<{
  stakeholders: { [key in StakeholderCategory]?: string[] };
  aspect_mapping: { [aspect: string]: string[] }
}> {
  const prompt = `${STAKEHOLDER_INFERENCE_PROMPT}

Scenario Type: ${scenario.type}
Action: ${JSON.stringify(scenario.action)}
Timing: ${JSON.stringify(scenario.timing)}
Known Vulnerabilities: ${JSON.stringify(scenario.known_vulnerabilities)}
Aspects Identified: ${scenario._dialogue_state?.aspects_identified?.join(', ') || 'None yet'}`

  return await callAI(prompt)
}

// Extract aspects from user response
async function extractAspects(response: string, scenarioType: ScenarioType): Promise<string[]> {
  const categories = getAspectCategories(scenarioType)

  const prompt = `Extract key aspects from this response that would matter to stakeholders.

Response: ${response}

Aspect categories for ${scenarioType}: ${categories.join(', ')}

Return JSON array of aspect strings (specific to this response, not generic):
["aspect1", "aspect2"]`

  try {
    const result = await callAI(prompt)
    return Array.isArray(result) ? result : []
  } catch {
    return []
  }
}

// Apply user response to scenario
async function applyResponseToScenario(
  scenario: Partial<LPScenario>,
  probeId: string,
  response: string,
  scenarioType: ScenarioType
): Promise<Partial<LPScenario>> {
  const probe = PROBE_SETS[scenarioType]?.probes.find(p => p.id === probeId)
  if (!probe) return scenario

  // Parse field path (e.g., "action.what" -> nested update)
  const fieldPath = probe.field.split('.')
  const updated = { ...scenario }

  // Simple field mapping
  if (fieldPath.length === 1) {
    if (fieldPath[0] === 'known_vulnerabilities') {
      updated.known_vulnerabilities = [
        ...(updated.known_vulnerabilities || []),
        response
      ]
    } else if (fieldPath[0] === 'timing') {
      updated.timing = {
        ...updated.timing,
        context: [response],
        urgency: response.toLowerCase().includes('immediate') ? 'immediate' :
          response.toLowerCase().includes('urgent') ? 'short_term' : 'medium_term'
      } as LPScenario['timing']
    }
  } else if (fieldPath.length === 2) {
    const [parent, child] = fieldPath
    if (parent === 'action') {
      const arrayFields = ['claims', 'capabilities', 'changes', 'rationale', 'details', 'impact_hypothesis']
      updated.action = {
        ...updated.action,
        [child]: arrayFields.includes(child) ? [response] : response
      } as LPScenario['action']

      // Map probability options to enum values
      if (child === 'what' && updated.trigger_source === 'external') {
        const lower = response.toLowerCase()
        if (lower.includes('confirmed') || lower.includes('already')) {
          updated.action.probability = 'confirmed'
        } else if (lower.includes('likely') || lower.includes('75')) {
          updated.action.probability = 'likely'
        } else if (lower.includes('possible') || lower.includes('25')) {
          updated.action.probability = 'possible'
        } else if (lower.includes('speculative')) {
          updated.action.probability = 'speculative'
        }
      }
    } else if (parent === 'distribution') {
      updated.distribution = {
        ...updated.distribution,
        [child]: child === 'exclusions' || child === 'phases' ? [response] : response
      } as LPScenario['distribution']
    } else if (parent === 'timing') {
      updated.timing = {
        ...updated.timing,
        [child]: response
      } as LPScenario['timing']
    }
  }

  // Extract aspects if probe indicates
  if (probe.extract_aspects) {
    const aspects = await extractAspects(response, scenarioType)
    updated._dialogue_state = {
      ...updated._dialogue_state,
      aspects_identified: [
        ...(updated._dialogue_state?.aspects_identified || []),
        ...aspects
      ]
    } as LPScenario['_dialogue_state']
  }

  // Track answered probes
  updated._dialogue_state = {
    ...updated._dialogue_state,
    questions_asked: [
      ...(updated._dialogue_state?.questions_asked || []),
      probeId
    ]
  } as LPScenario['_dialogue_state']

  return updated
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body: ScenarioBuilderRequest = await req.json()
    console.log('🎭 Scenario Builder invoked:', JSON.stringify({
      org_id: body.organization_id,
      scenario_id: body.scenario_id,
      has_initial: !!body.initial_description,
      has_response: !!body.user_response
    }))

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // CASE 1: New scenario - initial description provided
    if (body.initial_description && !body.scenario_id) {
      console.log('📝 Starting new scenario from description...')

      // Detect scenario type
      const detection = await detectScenarioType(body.initial_description)
      console.log(`🔍 Detected type: ${detection.type} (conf: ${detection.confidence})`)

      // Initialize scenario
      const scenarioId = `scen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      const resolvedType = body.scenario_type_hint || detection.type
      const triggerSource = EXTERNAL_TRIGGER_TYPES.includes(resolvedType) ? 'external' : detection.trigger_source
      const scenario: Partial<LPScenario> = {
        scenario_id: scenarioId,
        type: resolvedType,
        trigger_source: triggerSource,
        org_id: body.organization_id,
        created_at: new Date().toISOString(),
        action: {
          what: body.initial_description,
          ...(triggerSource === 'external' ? { trigger_description: body.initial_description } : {})
        },
        timing: { urgency: triggerSource === 'external' ? 'short_term' : 'medium_term' },
        known_vulnerabilities: [],
        stakeholder_seed: {},
        aspect_mapping: {},
        ...(body.research_context ? { research_context: body.research_context } : {}),
        _dialogue_state: {
          phase: 'probing',
          questions_asked: [],
          aspects_identified: detection.aspects,
          confidence: detection.confidence
        }
      }

      // Save to database
      const { error: saveError } = await supabase
        .from('lp_scenarios')
        .insert({
          id: scenarioId,
          organization_id: body.organization_id,
          type: scenario.type,
          scenario_data: scenario,
          status: 'building',
          created_at: scenario.created_at
        })

      if (saveError) {
        console.error('⚠️ Failed to save scenario:', saveError.message)
        // Continue anyway - scenario is in response
      }

      // Get first probe
      const nextProbe = getNextProbe(scenario.type!, [], true)

      const response: ScenarioBuilderResponse = {
        success: true,
        scenario,
        phase: 'probing',
        detected_type: detection.type,
        confidence: detection.confidence,
        next_question: nextProbe?.question,
        suggestions: {
          aspects: detection.aspects
        }
      }

      return jsonResponse(response)
    }

    // CASE 2: Continue dialogue - user response to probe
    if (body.scenario_id && body.user_response) {
      console.log(`💬 Continuing scenario ${body.scenario_id}...`)

      // Load existing scenario
      const { data: existing, error: loadError } = await supabase
        .from('lp_scenarios')
        .select('*')
        .eq('id', body.scenario_id)
        .single()

      if (loadError || !existing) {
        return errorResponse(`Scenario not found: ${body.scenario_id}`, 404)
      }

      let scenario = existing.scenario_data as Partial<LPScenario>
      const scenarioType = scenario.type!

      // Find which probe we're answering (first unanswered = the one we just asked)
      const answeredProbes = scenario._dialogue_state?.questions_asked || []
      const currentProbe = getNextProbe(scenarioType, answeredProbes, true)

      if (currentProbe) {
        // Apply response to scenario
        scenario = await applyResponseToScenario(
          scenario,
          currentProbe.id,
          body.user_response,
          scenarioType
        )
      }

      // Get next probe
      const nextProbe = getNextProbe(scenarioType, scenario._dialogue_state?.questions_asked || [], true)

      // Check if we're done with probing
      if (!nextProbe) {
        console.log('✅ All probes answered, moving to stakeholder inference...')

        // Infer stakeholders
        if (!body.skip_stakeholder_suggestions) {
          const stakeholderResult = await inferStakeholders(scenario)
          scenario.stakeholder_seed = stakeholderResult.stakeholders
          scenario.aspect_mapping = stakeholderResult.aspect_mapping
        }

        scenario._dialogue_state = {
          ...scenario._dialogue_state,
          phase: 'complete',
          confidence: 0.85
        } as LPScenario['_dialogue_state']

        // Update in database
        await supabase
          .from('lp_scenarios')
          .update({
            scenario_data: scenario,
            status: 'ready'
          })
          .eq('id', body.scenario_id)

        const response: ScenarioBuilderResponse = {
          success: true,
          scenario,
          phase: 'complete',
          ready_for_simulation: true,
          suggestions: {
            stakeholders: Object.entries(scenario.stakeholder_seed || {}).map(([cat, entities]) => ({
              category: cat as StakeholderCategory,
              entities: entities as string[]
            })),
            aspects: scenario._dialogue_state?.aspects_identified || []
          }
        }

        return jsonResponse(response)
      }

      // Save progress
      await supabase
        .from('lp_scenarios')
        .update({ scenario_data: scenario })
        .eq('id', body.scenario_id)

      const response: ScenarioBuilderResponse = {
        success: true,
        scenario,
        phase: 'probing',
        next_question: nextProbe.question,
        question_options: nextProbe.options,
        confidence: scenario._dialogue_state?.confidence
      }

      return jsonResponse(response)
    }

    // CASE 3: Load existing scenario
    if (body.scenario_id && !body.user_response) {
      const { data: existing, error: loadError } = await supabase
        .from('lp_scenarios')
        .select('*')
        .eq('id', body.scenario_id)
        .single()

      if (loadError || !existing) {
        return errorResponse(`Scenario not found: ${body.scenario_id}`, 404)
      }

      const scenario = existing.scenario_data as Partial<LPScenario>
      const phase = scenario._dialogue_state?.phase || 'probing'
      const nextProbe = phase === 'probing'
        ? getNextProbe(scenario.type!, scenario._dialogue_state?.questions_asked || [], true)
        : null

      const response: ScenarioBuilderResponse = {
        success: true,
        scenario,
        phase: phase as ScenarioBuilderResponse['phase'],
        ready_for_simulation: phase === 'complete',
        next_question: nextProbe?.question
      }

      return jsonResponse(response)
    }

    return errorResponse('Provide initial_description for new scenario, or scenario_id to continue', 400)

  } catch (err) {
    console.error('❌ Scenario Builder error:', err.message)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
