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
    const { organization_name, queries } = await req.json()

    if (!organization_name || !queries) {
      throw new Error('organization_name and queries required')
    }

    console.log(`🤖 Testing Claude visibility for ${organization_name} (${queries.length} queries)`)

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

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
