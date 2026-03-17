/**
 * LP Simulation Orchestrator — SETUP ONLY
 *
 * Creates simulation record, identifies entities, returns config.
 * The CLIENT drives rounds by calling lp-run-simulation-round repeatedly.
 * This avoids the edge function timeout that killed monolithic simulations.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'
import type { SimulationRequest, SimulationConfig, SimulationEntity, ScenarioMode } from './types.ts'
import { getPhasesForMode } from './types.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const DEFAULT_CONFIG: SimulationConfig = {
  max_rounds: 5,
  min_rounds: 2,
  stabilization_threshold: 0.8,
  parallel_batch_size: 8,
  entity_timeout_ms: 45000
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const body: SimulationRequest = await req.json()

    if (!body.scenario_id) {
      return errorResponse('scenario_id is required', 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Load scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('lp_scenarios')
      .select('*')
      .eq('id', body.scenario_id)
      .single()

    if (scenarioError || !scenario) {
      return errorResponse(`Scenario not found: ${scenarioError?.message}`, 404)
    }

    console.log(`📋 Scenario: ${scenario.title || scenario.scenario_type}`)

    // Build config
    const config: SimulationConfig = {
      ...DEFAULT_CONFIG,
      max_rounds: body.max_rounds || DEFAULT_CONFIG.max_rounds,
      min_rounds: body.min_rounds || DEFAULT_CONFIG.min_rounds,
      stabilization_threshold: body.stabilization_threshold || DEFAULT_CONFIG.stabilization_threshold
    }

    // Identify entities
    const entities = await identifyEntities(
      supabase, scenario, body.organization_id,
      body.entity_ids, body.include_client, body.entity_names
    )

    if (entities.length === 0) {
      return errorResponse('No entities found for simulation', 400)
    }

    console.log(`👥 ${entities.length} entities identified`)

    // Detect scenario mode
    const scenarioData = scenario.scenario_data || scenario
    const scenarioMode = detectScenarioMode(scenarioData)
    const phases = getPhasesForMode(scenarioMode)
    const effectiveMaxRounds = Math.min(config.max_rounds, phases.length)

    // Create simulation record
    const { data: simulation, error: simError } = await supabase
      .from('lp_simulations')
      .insert({
        scenario_id: body.scenario_id,
        organization_id: body.organization_id,
        status: 'running',
        config: { ...config, max_rounds: effectiveMaxRounds },
        entities,
        rounds_completed: 0
      })
      .select()
      .single()

    if (simError) {
      return errorResponse(`Failed to create simulation: ${simError.message}`, 500)
    }

    console.log(`🆔 Simulation ${simulation.id} created — ${scenarioMode} mode, ${effectiveMaxRounds} max rounds`)

    // Return everything the client needs to drive rounds
    return jsonResponse({
      simulation_id: simulation.id,
      scenario,
      scenario_mode: scenarioMode,
      entities,
      config: { ...config, max_rounds: effectiveMaxRounds },
      phases: phases.slice(0, effectiveMaxRounds)
    })

  } catch (err: any) {
    console.error('❌ Setup error:', err.message)
    return errorResponse(err.message || 'Setup failed', 500)
  }
})

/**
 * Identify which entities should participate in the simulation
 */
async function identifyEntities(
  supabase: any,
  scenario: any,
  organizationId: string,
  overrideEntityIds?: string[],
  includeClient?: boolean,
  overrideEntityNames?: string[]
): Promise<SimulationEntity[]> {
  const entities: SimulationEntity[] = []

  // If explicit entity IDs provided, use those
  if (overrideEntityIds && overrideEntityIds.length > 0) {
    const { data: profiles } = await supabase
      .from('lp_entity_profiles')
      .select('id, entity_name, entity_type')
      .in('id', overrideEntityIds)

    for (const profile of profiles || []) {
      entities.push({
        entity_id: profile.id,
        entity_name: profile.entity_name,
        entity_type: profile.entity_type,
        profile_id: profile.id,
        relevance_score: 1.0,
        included: true
      })
    }
    return entities
  }

  // If explicit entity names provided (from UI selection), look them up globally
  if (overrideEntityNames && overrideEntityNames.length > 0) {
    console.log(`🎯 Looking up ${overrideEntityNames.length} user-selected entities by name`)

    for (const name of overrideEntityNames) {
      if (!name) continue

      // Exact match first (case-insensitive)
      let { data: profile } = await supabase
        .from('lp_entity_profiles')
        .select('id, entity_name, entity_type')
        .ilike('entity_name', name)
        .limit(1)

      // Fuzzy fallback
      if (!profile || profile.length === 0) {
        const fuzzy = await supabase
          .from('lp_entity_profiles')
          .select('id, entity_name, entity_type')
          .ilike('entity_name', `%${name}%`)
          .limit(1)
        profile = fuzzy.data
      }

      const match = profile?.[0]
      if (match && !entities.find(e => e.entity_id === match.id)) {
        entities.push({
          entity_id: match.id,
          entity_name: match.entity_name,
          entity_type: match.entity_type,
          profile_id: match.id,
          relevance_score: 1.0,
          included: true
        })
        console.log(`  ✅ "${name}" → ${match.entity_name} (${match.id})`)
      } else if (!match) {
        // Create placeholder profile
        const placeholderId = crypto.randomUUID()
        const { data: created, error: insertErr } = await supabase
          .from('lp_entity_profiles')
          .insert({
            id: placeholderId,
            organization_id: organizationId,
            entity_name: name,
            entity_type: 'company',
            profile: {
              identity: { name, description: `${name} - auto-generated for simulation` },
              voice: {}, priorities: {}, patterns: {}, vulnerabilities: {}, current_context: {}
            },
            confidence_score: 0.3,
            model_used: 'placeholder',
            api_calls_made: 0,
            built_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .select('id, entity_name, entity_type')
          .single()

        if (created && !insertErr) {
          entities.push({
            entity_id: created.id,
            entity_name: created.entity_name,
            entity_type: created.entity_type,
            profile_id: created.id,
            relevance_score: 0.7,
            included: true
          })
          console.log(`  🆕 "${name}" → created placeholder (${created.id})`)
        } else {
          console.log(`  ⚠️ Failed to create placeholder for "${name}": ${insertErr?.message}`)
        }
      }
    }

    if (entities.length > 0) {
      console.log(`👥 Matched ${entities.length}/${overrideEntityNames.length} entities`)
      return entities.slice(0, 8)
    }
  }

  // Auto-detect from scenario stakeholders
  const scenarioData = scenario.scenario_data || scenario
  const stakeholderSeed = scenarioData.stakeholder_seed || {}

  const stakeholderNames: string[] = []
  if (typeof stakeholderSeed === 'object' && !Array.isArray(stakeholderSeed)) {
    for (const [_cat, names] of Object.entries(stakeholderSeed)) {
      if (Array.isArray(names)) stakeholderNames.push(...names)
    }
  } else if (Array.isArray(stakeholderSeed)) {
    for (const s of stakeholderSeed) {
      stakeholderNames.push(typeof s === 'string' ? s : s.name || '')
    }
  }

  for (const name of stakeholderNames) {
    if (!name) continue
    const { data: profile } = await supabase
      .from('lp_entity_profiles')
      .select('id, entity_name, entity_type')
      .ilike('entity_name', `%${name}%`)
      .limit(1)
      .single()

    if (profile && !entities.find(e => e.entity_id === profile.id)) {
      entities.push({
        entity_id: profile.id,
        entity_name: profile.entity_name,
        entity_type: profile.entity_type,
        profile_id: profile.id,
        relevance_score: 0.8,
        included: true
      })
    }
  }

  // Fallback to industry profiles if too few
  if (entities.length < 3) {
    const { data: industryProfiles } = await supabase
      .from('lp_entity_profiles')
      .select('id, entity_name, entity_type')
      .eq('entity_type', 'company')
      .limit(10)

    for (const profile of industryProfiles || []) {
      if (!entities.find(e => e.entity_id === profile.id)) {
        entities.push({
          entity_id: profile.id,
          entity_name: profile.entity_name,
          entity_type: profile.entity_type,
          profile_id: profile.id,
          relevance_score: 0.5,
          included: entities.length < 10
        })
      }
    }
  }

  if (includeClient && organizationId) {
    const { data: clientProfile } = await supabase
      .from('lp_entity_profiles')
      .select('id, entity_name, entity_type')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'company')
      .limit(1)
      .single()

    if (clientProfile && !entities.find(e => e.entity_id === clientProfile.id)) {
      entities.push({
        entity_id: clientProfile.id,
        entity_name: clientProfile.entity_name,
        entity_type: 'client',
        profile_id: clientProfile.id,
        relevance_score: 1.0,
        included: true
      })
    }
  }

  return entities
}

function detectScenarioMode(scenarioData: any): ScenarioMode {
  const type = (scenarioData.type || scenarioData.scenario_type || '').toLowerCase()
  const action = scenarioData.action || {}
  const what = (action.what || action.trigger_description || '').toLowerCase()
  const rationale = (action.rationale || []).join(' ').toLowerCase()

  if (scenarioData.scenario_mode) return scenarioData.scenario_mode as ScenarioMode

  const faitAccompliTypes = ['crisis', 'incident', 'breach', 'announcement', 'event', 'decision']
  if (faitAccompliTypes.some(t => type.includes(t))) return 'fait_accompli'

  const speculativeTypes = ['proposal', 'regulation', 'policy', 'potential', 'what_if', 'hypothetical']
  if (speculativeTypes.some(t => type.includes(t))) return 'speculative'

  const text = `${what} ${rationale}`
  const pastIndicators = ['announced', 'launched', 'released', 'passed', 'enacted', 'signed', 'acquired', 'merged', 'collapsed', 'filed', 'published', 'revealed', 'happened', 'occurred']
  const futureIndicators = ['proposed', 'considering', 'planning', 'might', 'could', 'would', 'potential', 'draft', 'expected', 'rumored', 'exploring', 'may', 'if ']

  const pastScore = pastIndicators.filter(w => text.includes(w)).length
  const futureScore = futureIndicators.filter(w => text.includes(w)).length

  if (pastScore > futureScore) return 'fait_accompli'
  if (futureScore > pastScore) return 'speculative'
  return 'speculative'
}
