// Quick Scenario — lightweight "what would happen if..." simulation
// Returns 3 scenarios (best/likely/worst) with entity reactions in ~10-15s
// Designed to be embedded anywhere: opportunities, signals, research, standalone

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

interface QuickScenarioRequest {
  prompt: string              // "What would happen if Palantir lost the NHS contract?"
  entity_names?: string[]     // Optional: specific entities to analyze
  context?: string            // Optional: opportunity/signal context
  organization_id?: string    // Optional: for org-specific context
  max_entities?: number       // Default 8
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(30000)
    }
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown')
    throw new Error(`Gemini ${res.status}: ${errText.substring(0, 200)}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }),
    signal: AbortSignal.timeout(30000)
  })

  if (!res.ok) {
    throw new Error(`Claude ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  const startTime = Date.now()

  try {
    const body: QuickScenarioRequest = await req.json()
    const { prompt, entity_names, context, organization_id, max_entities = 8 } = body

    if (!prompt) {
      return errorResponse('prompt is required', 400)
    }

    console.log(`⚡ Quick Scenario: "${prompt.substring(0, 80)}..."`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Load entity profiles for the requested entities (or top profiles if none specified)
    let profileSnippets: string[] = []

    if (entity_names && entity_names.length > 0) {
      // Fetch profiles for specified entities
      const { data: profiles } = await supabase
        .from('lp_entity_profiles')
        .select('entity_name, entity_type, profile')
        .in('entity_name', entity_names)
        .limit(max_entities)

      if (profiles) {
        profileSnippets = profiles.map(p => {
          const prof = p.profile || {}
          const identity = prof.identity?.core_identity || ''
          const priorities = prof.priorities?.stated?.slice(0, 3)?.join(', ') || ''
          const responses = prof.response_patterns
            ? `Crisis response: ${prof.response_patterns.to_crisis || 'unknown'}`
            : ''
          return `**${p.entity_name}** (${p.entity_type}): ${identity}${priorities ? ` | Priorities: ${priorities}` : ''}${responses ? ` | ${responses}` : ''}`
        })
      }
    }

    // Load org context if available
    let orgContext = ''
    if (organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, industry, description')
        .eq('id', organization_id)
        .single()

      if (org) {
        orgContext = `\nOrganization context: ${org.name} (${org.industry || 'General'}). ${org.description || ''}`
      }
    }

    const today = new Date().toISOString().split('T')[0]

    const systemPrompt = `You are a strategic intelligence analyst. Today is ${today}.

The user is asking: "${prompt}"

${orgContext}
${context ? `\nAdditional context:\n${context}` : ''}
${profileSnippets.length > 0 ? `\nEntity profiles:\n${profileSnippets.join('\n')}` : ''}

Generate 3 scenarios analyzing what would happen. Return valid JSON matching this exact schema:

{
  "scenarios": [
    {
      "name": "Best Case",
      "likelihood": "low|medium|high",
      "likelihood_pct": 20,
      "summary": "2-3 sentence overview of this scenario",
      "entity_reactions": [
        {
          "entity": "Entity Name",
          "reaction": "What they would likely do",
          "sentiment": "positive|negative|neutral",
          "impact": "high|medium|low"
        }
      ],
      "cascade_effects": ["First-order effect", "Second-order effect"],
      "recommended_actions": ["What to do if this happens"]
    },
    {
      "name": "Most Likely",
      "likelihood": "high",
      "likelihood_pct": 55,
      "summary": "...",
      "entity_reactions": [...],
      "cascade_effects": [...],
      "recommended_actions": [...]
    },
    {
      "name": "Worst Case",
      "likelihood": "low|medium",
      "likelihood_pct": 25,
      "summary": "...",
      "entity_reactions": [...],
      "cascade_effects": [...],
      "recommended_actions": [...]
    }
  ],
  "overall_assessment": "1-2 sentence bottom line assessment",
  "key_variable": "The single most important factor that determines which scenario plays out"
}

Rules:
- Be specific and grounded, not generic. Reference real dynamics and incentives.
- Each scenario should have 3-6 entity reactions (use the profiles if provided, otherwise infer key stakeholders).
- Likelihood percentages should sum to ~100%.
- Keep it concise — this is rapid analysis, not a full report.
- cascade_effects: 2-3 per scenario, showing second/third-order consequences.
- recommended_actions: 1-2 per scenario, actionable and specific.`

    // Try Gemini first, fallback to Claude
    let rawResult: string
    let model = 'gemini'
    try {
      rawResult = await callGemini(systemPrompt)
    } catch (geminiErr: any) {
      console.log(`Gemini failed (${geminiErr.message}), trying Claude...`)
      model = 'claude'
      rawResult = await callClaude(systemPrompt)
    }

    // Parse the JSON response
    let result: any
    try {
      result = JSON.parse(rawResult)
    } catch {
      // Try to extract JSON from markdown fences
      const match = rawResult.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (match) {
        result = JSON.parse(match[1])
      } else {
        // Try bracket extraction
        const bracketMatch = rawResult.match(/\{[\s\S]*\}/)
        if (bracketMatch) {
          result = JSON.parse(bracketMatch[0])
        } else {
          throw new Error('Could not parse AI response as JSON')
        }
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(`⚡ Quick Scenario complete in ${duration}s (${model})`)

    return jsonResponse({
      success: true,
      ...result,
      meta: {
        model,
        duration_seconds: duration,
        entities_used: profileSnippets.length,
        prompt: prompt.substring(0, 100)
      }
    })

  } catch (error: any) {
    console.error('Quick Scenario error:', error)
    return errorResponse(error.message, 500)
  }
})
