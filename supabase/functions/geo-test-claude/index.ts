import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO Test Claude
 * Tests organization visibility in Claude responses
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization_name, queries, meta_analysis_prompt } = await req.json()

    if (!organization_name) {
      throw new Error('organization_name required')
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

    // NEW: If meta_analysis_prompt is provided, use that instead of individual queries
    if (meta_analysis_prompt) {
      console.log(`🔮 Running Claude meta-analysis for ${organization_name}`)

      try {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: meta_analysis_prompt
          }]
        })

        const responseText = message.content[0].type === 'text'
          ? message.content[0].text
          : ''

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

        console.log(`✅ Claude meta-analysis complete`)

        return new Response(
          JSON.stringify({
            success: true,
            platform: 'claude',
            meta_analysis: analysis,
            raw_response: responseText,
            signals: parseMetaAnalysisToSignals(analysis, organization_name)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        console.error('Claude meta-analysis error:', error)
        throw error
      }
    }

    // FALLBACK: Old individual query approach (backwards compatible)
    if (!queries) {
      throw new Error('queries or meta_analysis_prompt required')
    }

    console.log(`🤖 Testing Claude visibility for ${organization_name} (${queries.length} queries)`)

    const signals: any[] = []
    let mentionCount = 0

    // Test queries
    for (const q of queries) {
      try {
        console.log(` 🔍 Testing: "${q.query}"`)

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `${q.query}\n\nPlease provide a comprehensive answer with specific product/service recommendations.`
          }]
        })

        const responseText = message.content[0].type === 'text'
          ? message.content[0].text
          : ''

        const mentioned = responseText.toLowerCase().includes(organization_name.toLowerCase())
        const position = extractMentionPosition(responseText, organization_name)

        if (mentioned) {
          mentionCount++
          console.log(` ✅ Mentioned in position ${position}`)

          signals.push({
            type: 'ai_visibility',
            platform: 'claude',
            priority: position <= 3 ? 'high' : 'medium',
            data: {
              query: q.query,
              mentioned: true,
              position,
              context: extractContext(responseText, organization_name),
              response_length: responseText.length
            },
            recommendation: {
              action: position > 3 ? 'improve_ranking' : 'maintain_visibility',
              reasoning: `Brand mentioned in position ${position} for query: "${q.query}"`
            }
          })
        } else {
          console.log(` ❌ Not mentioned`)

          signals.push({
            type: 'visibility_gap',
            platform: 'claude',
            priority: q.priority === 'critical' ? 'critical' : 'high',
            data: {
              query: q.query,
              mentioned: false,
              competitors_mentioned: extractCompetitors(responseText)
            },
            recommendation: {
              action: 'improve_schema',
              reasoning: `Not mentioned for important query: "${q.query}". Consider schema optimization.`
            }
          })
        }

      } catch (error) {
        console.error('Claude API error:', error)
      }
    }

    console.log(`✅ Claude testing complete: ${mentionCount}/${queries.length} mentions`)

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'claude',
        queries_tested: queries.length,
        mentions: mentionCount,
        signals
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Claude test error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper functions
function parseMetaAnalysisToSignals(analysis: any, organizationName: string): any[] {
  if (!analysis) return []

  const signals: any[] = []

  // Add visibility signals from query results
  if (analysis.query_results && Array.isArray(analysis.query_results)) {
    for (const result of analysis.query_results) {
      if (result.target_mentioned) {
        signals.push({
          type: 'ai_visibility',
          platform: 'claude',
          priority: result.target_rank <= 3 ? 'high' : 'medium',
          data: {
            query: result.query,
            mentioned: true,
            rank: result.target_rank,
            organizations_mentioned: result.organizations_mentioned,
            why_appeared: result.why_these_appeared,
            sources_cited: result.sources_cited,
            what_needed: result.what_target_needs
          }
        })
      } else {
        signals.push({
          type: 'visibility_gap',
          platform: 'claude',
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
      platform: 'claude',
      priority: 'high',
      data: analysis.competitive_intelligence
    })
  }

  // Add source intelligence signal
  if (analysis.source_intelligence) {
    signals.push({
      type: 'source_intelligence',
      platform: 'claude',
      priority: 'high',
      data: analysis.source_intelligence
    })
  }

  // Add recommendation signals
  if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
    for (const rec of analysis.recommendations) {
      signals.push({
        type: 'recommendation',
        platform: 'claude',
        priority: rec.priority || 'medium',
        data: rec
      })
    }
  }

  return signals
}

function extractMentionPosition(text: string, name: string): number {
  const sentences = text.split(/[.!?]+/)
  for (let i = 0; i < sentences.length; i++) {
    if (sentences[i].toLowerCase().includes(name.toLowerCase())) {
      return i + 1
    }
  }
  return 999
}

function extractContext(text: string, name: string): string {
  const sentences = text.split(/[.!?]+/)
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(name.toLowerCase())) {
      return sentence.trim()
    }
  }
  return ''
}

function extractCompetitors(text: string): string[] {
  const competitors: string[] = []
  const commonCompetitors = ['Salesforce', 'HubSpot', 'Microsoft', 'Google', 'Amazon', 'Oracle']

  for (const comp of commonCompetitors) {
    if (text.includes(comp)) {
      competitors.push(comp)
    }
  }

  return competitors
}
