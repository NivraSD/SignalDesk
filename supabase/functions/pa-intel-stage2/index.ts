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
      industry,
      trigger_event,
      raw_research,
      stage1  // Output from pa-intel-stage1
    } = await req.json()

    if (!stage1) throw new Error('stage1 data is required — pa-intel-stage1 must complete first')

    const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('GOOGLE_API_KEY not configured')

    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const extractText = (data: any, limit = 3000): string => {
      if (!data) return 'No data available.'
      const text = data?.summary || data?.results || data?.answer || (typeof data === 'string' ? data : JSON.stringify(data))
      return typeof text === 'string' ? text.substring(0, limit) : JSON.stringify(text).substring(0, limit)
    }

    const geopoliticalResearch = extractText(raw_research?.geopolitical)
    const historicalResearch = extractText(raw_research?.historical)
    const legalResearch = extractText(raw_research?.legal)
    const impactResearch = extractText(raw_research?.impact)

    // Compact Stage 1 summary to feed as context
    const curSit = stage1.situation_assessment?.current_situation
    const curSitText = typeof curSit === 'string' ? curSit.substring(0, 800) : 'N/A'
    const histCtx = stage1.situation_assessment?.historical_context
    const histText = typeof histCtx === 'string' ? histCtx.substring(0, 400) : ''
    const actors = Array.isArray(stage1.situation_assessment?.key_actors)
      ? stage1.situation_assessment.key_actors.map((a: any) => `${a.name} (${a.role}) - ${a.position || ''} [${a.status || 'active'}]`).join('; ')
      : 'N/A'
    const stakeholders = Array.isArray(stage1.stakeholder_analysis?.stakeholders)
      ? stage1.stakeholder_analysis.stakeholders.map((s: any) => `${s.name} (${s.type || ''}): ${typeof s.position === 'string' ? s.position.substring(0, 100) : ''}`).join('; ')
      : 'N/A'

    const stage1Summary = `STAGE 1 FINDINGS (treat as established facts for this analysis):
Current Situation: ${curSitText}
${histText ? `Historical Context: ${histText}\n` : ''}Key Actors: ${actors}
Stakeholders: ${stakeholders}`

    const prompt = `You are a senior geopolitical intelligence analyst producing Stage 2 of an intelligence memo. Stage 1 (situation assessment, stakeholders) has already been completed and is provided as context.

TODAY'S DATE: ${currentDate}

MANDATORY FACTUAL GROUNDING:
- US President: Donald Trump (second term, inaugurated January 20, 2025).
- US Vice President: JD Vance. Secretary of State: Marco Rubio. Defense Secretary: Pete Hegseth. Treasury Secretary: Scott Bessent.
- UK PM: Keir Starmer. French President: Macron. German Chancellor: Friedrich Merz. Chinese President: Xi Jinping.
- Iran: Supreme Leader Khamenei was killed in US/Israeli strikes in late February 2026. Iran's leadership is in flux.

CRITICAL RULES:
1. Build on Stage 1 findings — do NOT contradict them. Stage 1 is your ground truth.
2. Base scenarios and impact analysis ONLY on the research data and Stage 1 findings.
3. If a war or conflict is described as active in Stage 1, your scenarios must reflect that reality — do NOT create scenarios where "diplomacy prevails" if the research shows active combat.
4. Scenarios must be genuinely distinct. Likelihoods must sum to ~100%.
5. Every prose section must be multi-paragraph. Connect insights back to ${organization_name}.
6. Do NOT invent events, statistics, or developments not in the research.

${stage1Summary}

TRIGGERING EVENT: ${trigger_event.title}

ADDITIONAL RESEARCH DATA:

1. GEOPOLITICAL CONTEXT & REGIONAL DYNAMICS:
${geopoliticalResearch}

2. HISTORICAL PRECEDENTS:
${historicalResearch}

3. LEGAL & REGULATORY FRAMEWORK:
${legalResearch}

4. ECONOMIC & SECTOR IMPACT:
${impactResearch}

Based on Stage 1 findings and the research above, generate Stage 2 as a JSON object with this structure:

{
  "geopolitical_context": {
    "regional_dynamics": "2-3 paragraphs on broader regional power landscape, alliances, tensions — grounded in research.",
    "international_implications": "2-3 paragraphs on global spillover effects, which powers are involved, trade/diplomatic implications.",
    "power_balance_analysis": "How this shifts the balance of power. Who gains, who loses."
  },

  "scenario_analysis": {
    "scenarios": [
      {
        "name": "Most Likely Outcome",
        "likelihood": "55%",
        "narrative": "2-3 paragraphs. How this unfolds based on evidence in the research. Specific sequence, timing, causal mechanisms.",
        "key_drivers": "2-3 factors from the research that make this scenario most probable",
        "leading_indicators": ["Observable signals from research"],
        "timeline": "When key milestones occur",
        "client_impact": "Specific implications for ${organization_name}"
      },
      {
        "name": "Escalation Scenario",
        "likelihood": "30%",
        "narrative": "2-3 paragraphs. What triggers escalation based on research evidence.",
        "key_drivers": "What would have to change",
        "leading_indicators": ["Early warning signs"],
        "timeline": "Expected timeline",
        "client_impact": "How this affects ${organization_name}"
      },
      {
        "name": "De-escalation / Wildcard",
        "likelihood": "15%",
        "narrative": "2-3 paragraphs. Only if research evidence supports the possibility.",
        "key_drivers": "What factor could produce this",
        "leading_indicators": ["What to watch"],
        "timeline": "Timeline if this materializes",
        "client_impact": "Implications for ${organization_name}"
      }
    ],
    "key_variables": "3-5 variables from research that determine which scenario plays out.",
    "wildcards": "Low-probability disruptions grounded in research evidence."
  },

  "impact_assessment": {
    "direct_impacts": "2-3 paragraphs on direct effects on ${organization_name} — operations, supply chain, customers, competitive position.",
    "second_order_effects": "2-3 paragraphs on indirect consequences — market sentiment, regulatory precedents, talent, reputation.",
    "timeline_of_effects": "Immediate (days), near-term (weeks), medium-term (months).",
    "risk_matrix": [
      {"risk": "Specific risk from research", "severity": "critical/high/medium/low", "likelihood": "high/medium/low", "mitigation": "Concrete action"}
    ]
  },

  "sources_and_confidence": {
    "confidence_level": "high/medium/low",
    "confidence_justification": "What strengthens and weakens our assessment based on research quality",
    "key_sources": [
      {"source": "Source from research", "reliability": "high/medium/low"}
    ],
    "intelligence_gaps": ["What we don't know that would change our assessment"],
    "collection_priorities": ["What to collect next"]
  }
}

Return ONLY valid JSON. No markdown fencing, no preamble.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 12000,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error: ${response.status} ${errText}`)
    }

    const result = await response.json()
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const finishReason = result.candidates?.[0]?.finishReason || 'unknown'

    if (!content) {
      throw new Error(`Empty response from Gemini (finishReason: ${finishReason})`)
    }

    let stage2Data
    let cleaned = content.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim()

    try {
      stage2Data = JSON.parse(cleaned)
    } catch (parseErr) {
      // Try extracting JSON object with string-aware brace matching
      const start = cleaned.indexOf('{')
      if (start === -1) throw new Error('No JSON found in Stage 2 response')
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
      if (end === -1) {
        // Truncated JSON — try to repair by closing open braces
        let repair = cleaned.substring(start)
        repair = repair.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '')
        const opens = (repair.match(/{/g) || []).length
        const closes = (repair.match(/}/g) || []).length
        for (let i = 0; i < opens - closes; i++) repair += '}'
        try {
          stage2Data = JSON.parse(repair)
          console.log('Stage 2: repaired truncated JSON')
        } catch {
          throw new Error(`Incomplete JSON in Stage 2 (content length: ${content.length}, finishReason: ${finishReason})`)
        }
      } else {
        stage2Data = JSON.parse(cleaned.substring(start, end))
      }
    }

    console.log('Stage 2 complete:', Object.keys(stage2Data).join(', '))

    return new Response(
      JSON.stringify({ success: true, stage2: stage2Data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('pa-intel-stage2 error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
