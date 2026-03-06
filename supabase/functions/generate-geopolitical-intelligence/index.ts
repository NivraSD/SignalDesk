import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

    // Extract and truncate each research stream to 3500 chars
    const truncate = (data: any, limit = 3500): string => {
      if (!data) return 'No data available.'
      const text = data?.results || data?.answer || (typeof data === 'string' ? data : JSON.stringify(data))
      return typeof text === 'string' ? text.substring(0, limit) : JSON.stringify(text).substring(0, limit)
    }

    const situationContext = truncate(raw_research?.situation)
    const stakeholderContext = truncate(raw_research?.stakeholders)
    const impactContext = truncate(raw_research?.impact)
    const geopoliticalContext = truncate(raw_research?.geopolitical)
    const historicalContext = truncate(raw_research?.historical)
    const legalContext = truncate(raw_research?.legal)
    const mediaContext = truncate(raw_research?.media)

    const orgContext = organization_profile
      ? `Organization: ${organization_name}\nIndustry: ${industry}\nProfile: ${JSON.stringify(organization_profile).substring(0, 2000)}`
      : `Organization: ${organization_name}\nIndustry: ${industry}`

    const prompt = `You are a senior geopolitical intelligence analyst at a top-tier advisory firm. You produce intelligence memos that clients find genuinely insightful — not shallow summaries, but deep analytical briefings that reveal non-obvious dynamics, identify leverage points, and project credible scenarios.

${orgContext}

TRIGGERING EVENT:
Title: ${trigger_event.title}
Content: ${trigger_event.content}
Source: ${trigger_event.source || 'Intelligence Pipeline'}
Published: ${trigger_event.published_at || 'Recent'}

RAW INTELLIGENCE GATHERED (7 research streams):

1. SITUATION & TIMELINE:
${situationContext}

2. STAKEHOLDER & POWER DYNAMICS:
${stakeholderContext}

3. ECONOMIC & SECTOR IMPACT:
${impactContext}

4. GEOPOLITICAL CONTEXT & REGIONAL DYNAMICS:
${geopoliticalContext}

5. HISTORICAL PRECEDENTS & ANALOGUES:
${historicalContext}

6. LEGAL & REGULATORY FRAMEWORK:
${legalContext}

7. MEDIA NARRATIVE & PUBLIC OPINION:
${mediaContext}

Using all intelligence above, produce a comprehensive geopolitical intelligence memo in the following JSON format. Every text field should contain multi-paragraph analytical prose — not bullet points or single sentences. Write like a senior analyst briefing a board of directors. Be direct, analytical, and specific. Name names. Cite precedents. Quantify where possible. State confidence levels explicitly.

{
  "executive_summary": "3-5 paragraphs. The CEO brief. What happened, why it matters for ${organization_name}, what's at stake, the most likely trajectory, and the single most important thing to watch. Every sentence must earn its place.",

  "situation_assessment": {
    "current_situation": "2-3 paragraphs on what is happening right now. Be specific about dates, actors, and actions taken.",
    "historical_context": "2-3 paragraphs on precedents, background, and how we got here. Draw on analogues from similar past events.",
    "key_developments": [
      {"date": "Date or period", "event": "What happened", "significance": "Why it matters — not obvious restatement"}
    ],
    "key_actors": [
      {"name": "Entity/person name", "role": "Their formal role", "position": "Their current stance on this issue", "influence_level": "high/medium/low with brief justification"}
    ]
  },

  "geopolitical_context": {
    "regional_dynamics": "2-3 paragraphs on how this fits into the broader regional power landscape. Alliance structures, competing interests, historical tensions.",
    "international_implications": "2-3 paragraphs on global spillover effects. Which powers are watching, what precedents this sets, trade/diplomatic implications.",
    "power_balance_analysis": "How this event shifts the balance of power. Who gains leverage, who loses it, and what the new equilibrium looks like."
  },

  "stakeholder_analysis": {
    "stakeholders": [
      {
        "name": "Stakeholder name",
        "type": "government/corporate/NGO/media/multilateral",
        "position": "Current stance — be specific",
        "motivations": "What drives their behavior — not surface-level",
        "constraints": "What limits their options",
        "likely_moves": "Most probable next actions with reasoning",
        "relationship_to_client": "How they relate to ${organization_name} (ally/adversary/neutral/customer/regulator)"
      }
    ],
    "alignment_map": "Who aligns with whom and why. Identify natural coalitions and fracture lines.",
    "pressure_points": "Where leverage exists — for ${organization_name} and for others. What could shift positions."
  },

  "scenario_analysis": {
    "scenarios": [
      {
        "name": "Most Likely Outcome",
        "likelihood": "55%",
        "narrative": "2-3 paragraphs describing how this scenario unfolds. Be specific about sequence of events, timing, and causal mechanisms.",
        "key_drivers": "What makes this scenario happen — the 2-3 factors that matter most",
        "leading_indicators": ["Observable signals that this scenario is materializing"],
        "timeline": "When key milestones occur",
        "client_impact": "Specific implications for ${organization_name}'s operations, revenue, reputation, or strategic position"
      },
      {
        "name": "Escalation Scenario",
        "likelihood": "30%",
        "narrative": "2-3 paragraphs. What triggers escalation and how it cascades.",
        "key_drivers": "What would have to go wrong",
        "leading_indicators": ["Early warning signs"],
        "timeline": "Expected timeline if this path materializes",
        "client_impact": "How this scenario specifically affects ${organization_name}"
      },
      {
        "name": "Rapid Resolution / Wildcard",
        "likelihood": "15%",
        "narrative": "2-3 paragraphs. The scenario most analysts would miss.",
        "key_drivers": "What low-probability factor could produce this outcome",
        "leading_indicators": ["What to watch for"],
        "timeline": "Timeline if this materializes",
        "client_impact": "Implications for ${organization_name}"
      }
    ],
    "key_variables": "The 3-5 variables that determine which scenario plays out. Be specific about thresholds and trigger points.",
    "wildcards": "Low-probability events that could upend all three scenarios. Think second-order, non-obvious disruptions."
  },

  "impact_assessment": {
    "direct_impacts": "2-3 paragraphs on direct effects on ${organization_name}. Operations, supply chain, customer relationships, competitive position.",
    "second_order_effects": "2-3 paragraphs on indirect consequences. Market sentiment shifts, regulatory precedents, talent implications, reputational effects.",
    "timeline_of_effects": "When different impacts materialize — immediate (days), near-term (weeks), medium-term (months).",
    "risk_matrix": [
      {"risk": "Specific risk", "severity": "critical/high/medium/low", "likelihood": "high/medium/low", "mitigation": "Concrete mitigation action"}
    ]
  },

  "sources_and_confidence": {
    "confidence_level": "high/medium/low",
    "confidence_justification": "Why this confidence level — what strengthens and weakens our assessment",
    "key_sources": [
      {"source": "Source name/type", "reliability": "high/medium/low"}
    ],
    "intelligence_gaps": ["Specific things we don't know that would change our assessment"],
    "collection_priorities": ["What intelligence to collect next, in priority order"]
  }
}

CRITICAL INSTRUCTIONS:
- Scenarios must be genuinely distinct, not variations of the same theme. Likelihoods must sum to ~100%.
- Every prose section must be multi-paragraph. Single sentences are unacceptable.
- Name specific actors, cite specific precedents, reference specific data points from the research.
- Do not hedge with "could" or "might" — state your assessment and calibrate confidence explicitly.
- The executive summary should be readable standalone — a busy executive reads only this and understands the full picture.
- For ${organization_name} specifically: connect every insight back to concrete business implications.

Return ONLY valid JSON. No markdown fencing. No preamble.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
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
      researchData = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        researchData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse geopolitical intelligence output as JSON')
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
    console.error('Error in generate-geopolitical-intelligence:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
