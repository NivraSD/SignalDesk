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
      organization_name,
      organization_profile,
      industry,
      trigger_event,
      raw_research
    } = await req.json()

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    // Extract research — pass the summary/results text, not raw JSON blobs
    const extractText = (data: any, limit = 3000): string => {
      if (!data) return 'No data available.'
      const text = data?.summary || data?.results || data?.answer || (typeof data === 'string' ? data : JSON.stringify(data))
      return typeof text === 'string' ? text.substring(0, limit) : JSON.stringify(text).substring(0, limit)
    }

    const situationResearch = extractText(raw_research?.situation)
    const stakeholderResearch = extractText(raw_research?.stakeholders)
    const impactResearch = extractText(raw_research?.impact)
    const mediaResearch = extractText(raw_research?.media)

    const orgContext = organization_profile
      ? `Organization: ${organization_name}\nIndustry: ${industry}\nProfile: ${JSON.stringify(organization_profile).substring(0, 1500)}`
      : `Organization: ${organization_name}\nIndustry: ${industry}`

    const prompt = `You are a senior geopolitical intelligence analyst at a top-tier advisory firm. You produce intelligence memos grounded STRICTLY in the research data provided.

TODAY'S DATE: ${currentDate}

MANDATORY FACTUAL GROUNDING:
- US President: Donald Trump (second term, inaugurated January 20, 2025). The Biden administration ended January 2025.
- US Vice President: JD Vance
- US Secretary of State: Marco Rubio
- US Treasury Secretary: Scott Bessent
- US Defense Secretary: Pete Hegseth
- UK Prime Minister: Keir Starmer (Labour, since July 2024)
- French President: Emmanuel Macron
- German Chancellor: Friedrich Merz (CDU, since February 2025)
- Chinese President: Xi Jinping
- Federal Reserve Chair: Jerome Powell
- Iran: Supreme Leader Ali Khamenei was killed in US/Israeli strikes in late February 2026. Iran's leadership is in flux. Do NOT refer to Khamenei as alive or currently leading Iran.

CRITICAL ANTI-HALLUCINATION RULES:
1. Base your analysis ONLY on the research data provided below. Do NOT rely on your training data for facts about current events.
2. If the research data says something happened, treat it as fact. If your training data conflicts with the research, the RESEARCH IS CORRECT.
3. NEVER invent events, dates, casualties, or developments not mentioned in the research.
4. NEVER describe ongoing negotiations, diplomatic talks, or peace processes unless the research explicitly mentions them.
5. If a conflict or war is described in the research as active/ongoing, do NOT soften it into "tensions" or "potential escalation" — reflect the actual severity.
6. If you are unsure about something, say "based on available intelligence" rather than fabricating details.
7. Name specific actors, cite specific events FROM THE RESEARCH. Do not generalize.

${orgContext}

TRIGGERING EVENT:
Title: ${trigger_event.title}
Content: ${trigger_event.content}
Source: ${trigger_event.source || 'Intelligence Pipeline'}
Published: ${trigger_event.published_at || 'Recent'}

RESEARCH DATA:

1. SITUATION & TIMELINE:
${situationResearch}

2. STAKEHOLDER & POWER DYNAMICS:
${stakeholderResearch}

3. ECONOMIC & SECTOR IMPACT:
${impactResearch}

4. MEDIA NARRATIVE & PUBLIC OPINION:
${mediaResearch}

Based STRICTLY on the research above, generate Stage 1 of a geopolitical intelligence memo. Every claim must trace back to the research data. Do not invent facts.

{
  "situation_assessment": {
    "current_situation": "2-3 paragraphs on what is happening RIGHT NOW according to the research. Specific dates, actors, actions.",
    "historical_context": "2-3 paragraphs on how we got here, drawing from the research data.",
    "key_developments": [
      {"date": "Date from research", "event": "What happened per research", "significance": "Why it matters"}
    ],
    "key_actors": [
      {"name": "Person/entity from research", "role": "Their role", "position": "Their current stance per research", "influence_level": "high/medium/low", "status": "Active/deceased/unknown — check research carefully"}
    ]
  },

  "stakeholder_analysis": {
    "stakeholders": [
      {
        "name": "Stakeholder from research — governments, leaders, factions, international bodies, militaries. Do NOT include ${organization_name} itself as a stakeholder.",
        "type": "government/military/multilateral/NGO/corporate",
        "position": "Current stance per research",
        "motivations": "What drives their behavior per research",
        "constraints": "What limits them",
        "likely_moves": "Probable next actions based on research evidence",
        "relationship_to_client": "How this stakeholder's actions affect ${organization_name}"
      }
    ],
    "alignment_map": "Who aligns with whom based on the research. Map alliances, rivalries, and blocs.",
    "pressure_points": "Where leverage or vulnerability exists that ${organization_name} should monitor."
  }
}

Return ONLY valid JSON. No markdown fencing, no preamble, no explanation.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${errText}`)
    }

    const result = await response.json()
    const content = result.content?.[0]?.text || ''
    const stopReason = result.stop_reason || 'unknown'

    if (!content) {
      throw new Error(`Empty response from Claude (stop_reason: ${stopReason})`)
    }

    // Parse JSON
    let stage1Data
    let cleaned = content.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim()

    try {
      stage1Data = JSON.parse(cleaned)
    } catch {
      // Try extracting JSON object
      const start = cleaned.indexOf('{')
      if (start === -1) throw new Error('No JSON found in Stage 1 response')
      let depth = 0, end = -1
      let inString = false, escaped = false
      for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i]
        if (escaped) { escaped = false; continue }
        if (ch === '\\') { escaped = true; continue }
        if (ch === '"') { inString = !inString; continue }
        if (inString) continue
        if (ch === '{') depth++
        else if (ch === '}') { depth--; if (depth === 0) { end = i + 1; break } }
      }
      if (end === -1) throw new Error(`Incomplete JSON in Stage 1 (content length: ${content.length}, stopReason: ${stopReason})`)
      stage1Data = JSON.parse(cleaned.substring(start, end))
    }

    console.log('Stage 1 complete:', Object.keys(stage1Data).join(', '))

    return new Response(
      JSON.stringify({ success: true, stage1: stage1Data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('pa-intel-stage1 error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
