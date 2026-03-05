import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      report_id,
      organization_id,
      organization_name,
      organization_profile,
      industry,
      trigger_event,
      raw_research
    } = await req.json()

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    // Build research context from raw fireplexity results
    const situationContext = raw_research?.situation?.results || raw_research?.situation?.answer || JSON.stringify(raw_research?.situation || {})
    const stakeholderContext = raw_research?.stakeholders?.results || raw_research?.stakeholders?.answer || JSON.stringify(raw_research?.stakeholders || {})
    const impactContext = raw_research?.impact?.results || raw_research?.impact?.answer || JSON.stringify(raw_research?.impact || {})

    const orgContext = organization_profile
      ? `Organization: ${organization_name}\nIndustry: ${industry}\nProfile: ${JSON.stringify(organization_profile).substring(0, 2000)}`
      : `Organization: ${organization_name}\nIndustry: ${industry}`

    const prompt = `You are a senior strategic intelligence analyst producing a report for ${organization_name}, a ${industry} organization.

${orgContext}

TRIGGERING EVENT:
Title: ${trigger_event.title}
Content: ${trigger_event.content}
Source: ${trigger_event.source || 'Intelligence Pipeline'}
Published: ${trigger_event.published_at || 'Recent'}

RAW INTELLIGENCE GATHERED:

SITUATION RESEARCH:
${typeof situationContext === 'string' ? situationContext : JSON.stringify(situationContext).substring(0, 4000)}

STAKEHOLDER RESEARCH:
${typeof stakeholderContext === 'string' ? stakeholderContext : JSON.stringify(stakeholderContext).substring(0, 4000)}

IMPACT RESEARCH:
${typeof impactContext === 'string' ? impactContext : JSON.stringify(impactContext).substring(0, 4000)}

Using the intelligence above, produce a structured analysis in the following JSON format. Write in direct, analytical prose. No hedging. State what's happening, what it means, what's uncertain, and why. Calibrate confidence explicitly.

{
  "situation_assessment": {
    "what_happened": "Factual account of the event, citing sources where possible",
    "context": "What preceded this, why now, precipitating factors",
    "key_actors": [
      {
        "name": "Entity/person name",
        "position": "Their current stance",
        "role": "Their role in this situation"
      }
    ],
    "current_state": "Current state of play as of today"
  },
  "stakeholder_map": {
    "summary": "Overview of the stakeholder landscape",
    "stakeholders": [
      {
        "name": "Stakeholder name",
        "position": "Current position on this issue",
        "incentive": "Primary incentive driving their behavior",
        "constraints": "Key constraints limiting their options",
        "relationship": "Relationship to ${organization_name} (direct/indirect/none)",
        "likely_next_move": "Most probable next action"
      }
    ],
    "alignment_opportunities": "Where ${organization_name} can find alignment",
    "risks": "Where the stakeholder dynamics pose risk"
  },
  "impact_analysis": {
    "direct_impacts": "Direct impacts on ${organization_name}'s operations/interests",
    "indirect_effects": "Second-order effects that may materialize",
    "severity_assessment": "Overall severity rating and breakdown",
    "timeline": "When different impacts are expected to materialize",
    "historical_analogues": "Comparison to similar past events if relevant"
  },
  "sources_confidence": {
    "confidence_level": "high/medium/low",
    "key_sources": ["List of key sources used"],
    "intelligence_gaps": ["What we don't know yet"],
    "recommended_collection": "What additional intelligence would strengthen this assessment"
  }
}

Return ONLY valid JSON. No markdown fencing.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${errText}`)
    }

    const result = await response.json()
    const content = result.content?.[0]?.text || ''

    // Parse JSON from response
    let researchData
    try {
      // Try direct parse first
      researchData = JSON.parse(content)
    } catch {
      // Try extracting JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        researchData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse research output as JSON')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        research_data: researchData,
        report_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in generate-public-affairs-research:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
