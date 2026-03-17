import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent'
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages'

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4000 }
    })
  })

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!res.ok) throw new Error(`Claude error: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

serve(async (req: Request) => {
  const corsRes = handleCors(req)
  if (corsRes) return corsRes

  try {
    const { report_content, title, organization_name, urgency } = await req.json()

    if (!report_content) {
      return errorResponse('report_content is required', 400)
    }

    const geminiKey = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY')
    const claudeKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!geminiKey && !claudeKey) {
      return errorResponse('No AI API key configured', 500)
    }

    const prompt = `You are a senior intelligence analyst creating a concise executive 1-pager from a detailed research report.

REPORT TITLE: ${title || 'Intelligence Brief'}
ORGANIZATION: ${organization_name || 'Client'}
URGENCY: ${urgency || 'standard'}

FULL REPORT:
${report_content}

---

Create a structured 1-page executive summary in JSON format. This must be scannable in under 2 minutes by a C-suite executive. Be specific and factual — use names, numbers, dates from the report. No filler language.

Return ONLY valid JSON in this exact structure:
{
  "headline": "One-line situational headline (max 15 words)",
  "bottom_line": "2-3 sentence BLUF (Bottom Line Up Front) — the single most important takeaway",
  "key_facts": [
    "Fact 1 with specific detail",
    "Fact 2 with specific detail",
    "Fact 3 with specific detail",
    "Fact 4 with specific detail"
  ],
  "stakeholder_snapshot": [
    { "name": "Actor/Entity name", "position": "Their stance in 5-8 words" },
    { "name": "Actor/Entity name", "position": "Their stance in 5-8 words" },
    { "name": "Actor/Entity name", "position": "Their stance in 5-8 words" }
  ],
  "scenarios": [
    { "label": "Most Likely", "description": "What probably happens next (1-2 sentences)", "probability": "60%" },
    { "label": "Best Case", "description": "Optimistic outcome (1 sentence)", "probability": "25%" },
    { "label": "Worst Case", "description": "Risk scenario (1 sentence)", "probability": "15%" }
  ],
  "recommended_actions": [
    "Immediate action 1 (this week)",
    "Immediate action 2 (this week)",
    "Near-term action (30 days)"
  ],
  "watch_indicators": [
    "Leading indicator to monitor #1",
    "Leading indicator to monitor #2"
  ],
  "confidence_level": "High/Medium/Low",
  "sources_count": 0
}

Return ONLY the JSON, no markdown fences or extra text.`

    let rawResponse: string
    try {
      rawResponse = geminiKey ? await callGemini(prompt, geminiKey) : await callClaude(prompt, claudeKey!)
    } catch (primaryErr) {
      console.error('Primary AI failed:', primaryErr)
      if (geminiKey && claudeKey) {
        rawResponse = await callClaude(prompt, claudeKey)
      } else {
        throw primaryErr
      }
    }

    // Parse JSON — try direct, strip fences, bracket extraction
    let onePager: any
    try {
      onePager = JSON.parse(rawResponse)
    } catch {
      const fenceMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenceMatch) {
        onePager = JSON.parse(fenceMatch[1].trim())
      } else {
        const braceStart = rawResponse.indexOf('{')
        const braceEnd = rawResponse.lastIndexOf('}')
        if (braceStart !== -1 && braceEnd > braceStart) {
          onePager = JSON.parse(rawResponse.substring(braceStart, braceEnd + 1))
        } else {
          throw new Error('Failed to parse AI response as JSON')
        }
      }
    }

    return jsonResponse({
      success: true,
      one_pager: onePager
    })
  } catch (err) {
    console.error('pa-one-pager error:', err)
    return errorResponse(err.message || 'Failed to generate one-pager', 500)
  }
})
