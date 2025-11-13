import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO Test Gemini
 * Tests organization visibility in Gemini with meta-analysis
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

    console.log(`🔮 Running Gemini meta-analysis for ${organization_name}`)

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key not configured')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: meta_analysis_prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          },
          tools: [{
            google_search: {}
          }]
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${errorText}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract grounding sources
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata
    const sources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      url: chunk.web?.uri || '',
      title: chunk.web?.title || '',
      snippet: chunk.web?.snippet || ''
    })) || []

    console.log(`📚 Gemini cited ${sources.length} sources`)

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

    console.log(`✅ Gemini meta-analysis complete`)

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'gemini',
        meta_analysis: analysis,
        sources: sources,  // Grounding sources from Google Search
        raw_response: responseText,
        signals: parseMetaAnalysisToSignals(analysis, organization_name, sources)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Gemini test error:', error)
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
function parseMetaAnalysisToSignals(analysis: any, organizationName: string, sources: any[]): any[] {
  if (!analysis) return []

  const signals: any[] = []

  // Add visibility signals from query results
  if (analysis.query_results && Array.isArray(analysis.query_results)) {
    for (const result of analysis.query_results) {
      if (result.target_mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'gemini',
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
          platform: 'gemini',
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
      platform: 'gemini',
      priority: 'high',
      data: {
        ...analysis.competitive_intelligence,
        grounding_sources: sources  // Include Google Search sources
      }
    })
  }

  // Add source intelligence signal
  if (analysis.source_intelligence) {
    signals.push({
      type: 'source_intelligence',
      platform: 'gemini',
      priority: 'high',
      data: {
        ...analysis.source_intelligence,
        grounding_sources: sources  // Include Google Search sources
      }
    })
  }

  // Add recommendation signals
  if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
    for (const rec of analysis.recommendations) {
      signals.push({
        type: 'recommendation',
        platform: 'gemini',
        priority: rec.priority || 'medium',
        data: rec
      })
    }
  }

  return signals
}
