import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO Test ChatGPT
 * Tests organization visibility in ChatGPT with meta-analysis
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization_name, meta_analysis_prompt } = await req.json()

    if (!organization_name || !meta_analysis_prompt) {
      throw new Error('organization_name and meta_analysis_prompt required')
    }

    console.log(`🔮 Running ChatGPT meta-analysis for ${organization_name}`)

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: meta_analysis_prompt
        }],
        max_tokens: 4096,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ChatGPT API error:', errorText)
      throw new Error(`ChatGPT API error: ${errorText}`)
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content || ''

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    let analysis = null
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('Failed to parse meta-analysis JSON:', e)
      }
    }

    console.log(`✅ ChatGPT meta-analysis complete`)

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'chatgpt',
        meta_analysis: analysis,
        raw_response: responseText,
        signals: parseMetaAnalysisToSignals(analysis, organization_name)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ ChatGPT test error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to parse meta-analysis into signals
function parseMetaAnalysisToSignals(analysis: any, organizationName: string): any[] {
  if (!analysis) return []

  const signals: any[] = []

  // Add visibility signals from query results
  if (analysis.query_results && Array.isArray(analysis.query_results)) {
    for (const result of analysis.query_results) {
      if (result.target_mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'chatgpt',
          priority: result.target_rank <= 3 ? 'high' : 'medium',
          data: {
            query: result.query,
            mentioned: true,
            rank: result.target_rank,
            organizations_mentioned: result.organizations_mentioned,
            why_appeared: result.why_these_appeared,
            sources_cited: result.sources_cited || [],
            what_needed: result.what_target_needs
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'chatgpt',
          priority: 'high',
          data: {
            query: result.query,
            mentioned: false,
            organizations_mentioned: result.organizations_mentioned,
            why_others_appeared: result.why_these_appeared,
            what_needed: result.what_target_needs
          }
        })
      }
    }
  }

  // Add competitive intelligence signal
  if (analysis.competitive_intelligence) {
    signals.push({
      type: 'competitive_intelligence',
      platform: 'chatgpt',
      priority: 'high',
      data: analysis.competitive_intelligence
    })
  }

  // Add source intelligence signal
  if (analysis.source_intelligence) {
    signals.push({
      type: 'source_intelligence',
      platform: 'chatgpt',
      priority: 'high',
      data: analysis.source_intelligence
    })
  }

  // Add recommendation signals
  if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
    for (const rec of analysis.recommendations) {
      signals.push({
        type: 'recommendation',
        platform: 'chatgpt',
        priority: rec.priority || 'medium',
        data: rec
      })
    }
  }

  return signals
}
