/**
 * LP Profile Builder - Focused, lightweight entity profile generation
 *
 * For LP simulation, we need: identity, voice, priorities, patterns, vulnerabilities
 * We DON'T need: full org profiles, MCP tool chains, complex orchestration
 *
 * Data sources (parallel, 10s timeout each):
 * 1. Fireplexity: company overview + recent news
 * 2. Fireplexity: leadership + executive quotes
 * 3. Fireplexity: crisis history + controversies
 * 4. Fireplexity: competitor positioning + market stance
 *
 * Total budget: 45s max (Supabase limit is 60s)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')

const SOURCE_TIMEOUT_MS = 10_000
const TOTAL_TIMEOUT_MS = 45_000

interface ProfileRequest {
  name: string
  entity_type?: string
  organization_id?: string
  force_refresh?: boolean
}

// Simple timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) =>
      setTimeout(() => {
        console.warn(`⏱️ ${label} timed out after ${ms}ms`)
        resolve(null)
      }, ms)
    )
  ])
}

// Search via LP Simple Search
async function simpleSearch(query: string, label: string): Promise<any[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/lp-simple-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        query,
        limit: 6,
        timeframe: '90d'
      })
    })

    if (!response.ok) {
      throw new Error(`Search ${response.status}`)
    }

    const data = await response.json()
    const results = data.results || []
    console.log(`✅ ${label}: ${results.length} results`)
    return results
  } catch (err: any) {
    console.warn(`⚠️ ${label} failed: ${err.message}`)
    return []
  }
}

// Parallel data gathering - 4 focused searches
async function gatherProfileData(entityName: string): Promise<{
  overview: any[]
  leadership: any[]
  crisisHistory: any[]
  positioning: any[]
  sourcesSucceeded: string[]
}> {
  const searches = [
    {
      label: 'overview',
      query: `"${entityName}" company overview business model products services 2024 2025`
    },
    {
      label: 'leadership',
      query: `"${entityName}" CEO executive leadership quotes statements strategy`
    },
    {
      label: 'crisis_history',
      query: `"${entityName}" controversy crisis lawsuit scandal response`
    },
    {
      label: 'positioning',
      query: `"${entityName}" vs competitors market position differentiation strategy`
    }
  ]

  const results = await Promise.all(
    searches.map(s =>
      withTimeout(
        simpleSearch(s.query, s.label),
        SOURCE_TIMEOUT_MS,
        s.label
      )
    )
  )

  const sourcesSucceeded: string[] = []
  if (results[0]?.length) sourcesSucceeded.push('overview')
  if (results[1]?.length) sourcesSucceeded.push('leadership')
  if (results[2]?.length) sourcesSucceeded.push('crisis_history')
  if (results[3]?.length) sourcesSucceeded.push('positioning')

  return {
    overview: results[0] || [],
    leadership: results[1] || [],
    crisisHistory: results[2] || [],
    positioning: results[3] || [],
    sourcesSucceeded
  }
}

// Build synthesis prompt
function buildPrompt(entityName: string, entityType: string, data: any): string {
  const sections: string[] = []

  sections.push(`Build a behavioral profile for LP simulation: ${entityName} (${entityType})`)

  if (data.overview.length) {
    const items = data.overview.slice(0, 5).map((r: any) =>
      `- ${r.title}: ${r.snippet?.substring(0, 200) || ''}`
    ).join('\n')
    sections.push(`\n## Company Overview\n${items}`)
  }

  if (data.leadership.length) {
    const items = data.leadership.slice(0, 5).map((r: any) =>
      `- ${r.title}: ${r.snippet?.substring(0, 200) || ''}`
    ).join('\n')
    sections.push(`\n## Leadership & Voice\n${items}`)
  }

  if (data.crisisHistory.length) {
    const items = data.crisisHistory.slice(0, 5).map((r: any) =>
      `- ${r.title}: ${r.snippet?.substring(0, 200) || ''}`
    ).join('\n')
    sections.push(`\n## Crisis History & Response Patterns\n${items}`)
  }

  if (data.positioning.length) {
    const items = data.positioning.slice(0, 5).map((r: any) =>
      `- ${r.title}: ${r.snippet?.substring(0, 200) || ''}`
    ).join('\n')
    sections.push(`\n## Competitive Positioning\n${items}`)
  }

  return sections.join('\n')
}

const SYSTEM_PROMPT = `You are building behavioral profiles for a PR simulation engine. Given research about an entity, synthesize a profile that predicts HOW they will respond to scenarios.

Output ONLY valid JSON:
{
  "entity_id": "slug-name",
  "entity_type": "company",
  "identity": {
    "name": "string",
    "role": "their market role",
    "relationships": ["key relationships"]
  },
  "voice": {
    "tone": "how they communicate",
    "style": "communication characteristics",
    "avoids": "topics they avoid",
    "signature_phrases": ["common phrases"]
  },
  "priorities": {
    "stated": ["public priorities"],
    "inferred": ["behavior-based priorities"],
    "weights": {"priority": 0.0-1.0}
  },
  "perspective": {
    "worldview": "core belief",
    "biases": ["known biases"],
    "blind_spots": ["areas they ignore"]
  },
  "patterns": {
    "crisis_response": "how they handle crises",
    "competitive_response": "how they respond to competitors",
    "market_shift_response": "how they adapt",
    "timing_tendencies": "response speed patterns"
  },
  "vulnerabilities": {
    "known": ["public vulnerabilities"],
    "sensitivities": ["defensive topics"],
    "past_mistakes": ["historical missteps"]
  },
  "current_context": {
    "recent_positions": [{"topic": "string", "stance": "string", "date": "string"}],
    "active_pressures": ["current challenges"],
    "recent_events": ["recent news"]
  }
}

Be specific. Where data is sparse, make reasonable inferences marked as such.`

// Synthesize profile with Gemini
async function synthesizeProfile(entityName: string, entityType: string, data: any): Promise<any> {
  if (!GOOGLE_API_KEY) {
    throw new Error('No GOOGLE_API_KEY configured')
  }

  const prompt = buildPrompt(entityName, entityType, data)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 4000 }
      })
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini error ${response.status}: ${text.substring(0, 200)}`)
  }

  const result = await response.json()
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse JSON defensively with multiple fallback strategies
  let clean = content.trim()

  // Strip markdown fences
  if (clean.includes('```json')) {
    const match = clean.match(/```json\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  } else if (clean.includes('```')) {
    const match = clean.match(/```\s*([\s\S]*?)```/)
    if (match) clean = match[1].trim()
  }

  // Extract JSON object
  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1)
  }

  // Try direct parse first
  try {
    return JSON.parse(clean)
  } catch (e1) {
    // Try fixing common JSON errors
    let fixed = clean
      // Remove trailing commas before ] or }
      .replace(/,(\s*[\]}])/g, '$1')
      // Fix unescaped newlines in strings
      .replace(/(?<=":[ ]*"[^"]*)\n([^"]*")/g, '\\n$1')

    try {
      return JSON.parse(fixed)
    } catch (e2) {
      // Return minimal valid profile as fallback
      console.warn(`⚠️ JSON parse failed for ${entityName}, using fallback profile`)
      return {
        entity_id: entityName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        entity_type: entityType,
        identity: { name: entityName, role: 'Unknown', relationships: [] },
        voice: { tone: 'Unknown', style: 'Unknown', avoids: 'Unknown', signature_phrases: [] },
        priorities: { stated: [], inferred: [], weights: {} },
        perspective: { worldview: 'Unknown', biases: [], blind_spots: [] },
        patterns: { crisis_response: 'Unknown', competitive_response: 'Unknown', market_shift_response: 'Unknown', timing_tendencies: 'Unknown' },
        vulnerabilities: { known: [], sensitivities: [], past_mistakes: [] },
        current_context: { recent_positions: [], active_pressures: [], recent_events: [] },
        _parse_error: true,
        _raw_sample: content.substring(0, 500)
      }
    }
  }
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const body: ProfileRequest = await req.json()
    console.log(`🎭 LP Profile Builder: ${body.name}`)

    if (!body.name) {
      return errorResponse('name is required', 400)
    }

    const entityType = body.entity_type || 'company'
    const orgId = body.organization_id || '00000000-0000-0000-0000-000000000000'
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Cache check
    if (!body.force_refresh) {
      const { data: cached } = await supabase
        .from('lp_entity_profiles')
        .select('*')
        .eq('organization_id', orgId)
        .ilike('entity_name', body.name)
        .eq('entity_type', entityType)
        .gt('expires_at', new Date().toISOString())
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (cached) {
        console.log(`✅ Cache hit: ${body.name} (v${cached.version})`)
        return jsonResponse({
          success: true,
          profile: cached.profile,
          metadata: {
            data_tier: cached.data_tier,
            data_sources: cached.data_sources,
            confidence: cached.confidence_score,
            cached: true,
            build_time_ms: Date.now() - startTime,
            version: cached.version
          }
        })
      }
    }

    // Gather data (parallel)
    console.log('🔍 Gathering profile data...')
    const data = await gatherProfileData(body.name)

    // Determine tier
    const totalSources = data.sourcesSucceeded.length
    const dataTier = totalSources >= 3 ? 'rich' : totalSources >= 2 ? 'medium' : 'cold_start'

    // Synthesize
    console.log('🤖 Synthesizing profile...')
    const profile = await synthesizeProfile(body.name, entityType, data)

    // Calculate confidence
    let confidence = 0.3
    if (dataTier === 'rich') confidence += 0.3
    else if (dataTier === 'medium') confidence += 0.15
    if (data.leadership.length) confidence += 0.1
    if (data.crisisHistory.length) confidence += 0.1
    confidence = Math.min(confidence, 0.95)

    // Save to DB
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

    const { data: existing } = await supabase
      .from('lp_entity_profiles')
      .select('version')
      .eq('organization_id', orgId)
      .ilike('entity_name', body.name)
      .eq('entity_type', entityType)
      .limit(1)
      .single()

    const version = (existing?.version || 0) + 1

    const { error: upsertError } = await supabase
      .from('lp_entity_profiles')
      .upsert({
        organization_id: orgId,
        entity_name: body.name,
        entity_type: entityType,
        profile,
        data_tier: dataTier,
        data_sources: data.sourcesSucceeded,
        confidence_score: confidence,
        model_used: 'gemini-2.5-flash',
        api_calls_made: 5, // 4 fireplexity + 1 synthesis
        built_at: new Date().toISOString(),
        expires_at: expiresAt,
        version,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,entity_name,entity_type'
      })

    if (upsertError) {
      console.error('⚠️ Save failed:', upsertError.message)
    }

    const buildTime = Date.now() - startTime
    console.log(`✅ Profile built in ${buildTime}ms — tier:${dataTier} conf:${confidence.toFixed(2)}`)

    return jsonResponse({
      success: true,
      profile,
      metadata: {
        data_tier: dataTier,
        data_sources: data.sourcesSucceeded,
        confidence,
        cached: false,
        build_time_ms: buildTime,
        version
      }
    })

  } catch (err: any) {
    console.error('❌ LP Profile Builder error:', err.message)
    return errorResponse(err.message || 'Internal error', 500)
  }
})
