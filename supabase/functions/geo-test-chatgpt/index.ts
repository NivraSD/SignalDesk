import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO Test ChatGPT
 * Tests organization visibility in ChatGPT (GPT-4o) responses
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

    console.log(`💬 Testing ChatGPT visibility for ${organization_name} (${queries.length} queries)`)

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const signals: any[] = []
    let mentionCount = 0

    // Test queries
    for (const q of queries) {
      try {
        console.log(` 🔍 Testing: "${q.query}"`)

        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [{
                role: 'user',
                content: `${q.query}\n\nProvide a comprehensive answer.`
              }],
              temperature: 0.7,
              max_tokens: 1024
            })
          }
        )

        if (!response.ok) {
          console.error('OpenAI API error:', await response.text())
          continue
        }

        const data = await response.json()
        const responseText = data.choices?.[0]?.message?.content || ''

        const mentioned = responseText.toLowerCase().includes(organization_name.toLowerCase())
        const position = extractMentionPosition(responseText, organization_name)

        if (mentioned) {
          mentionCount++
          console.log(` ✅ Mentioned in position ${position}`)

          signals.push({
            type: 'ai_visibility',
            platform: 'chatgpt',
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
              reasoning: `Brand mentioned in position ${position} on ChatGPT (GPT-4o)`
            }
          })
        } else {
          console.log(` ❌ Not mentioned`)

          signals.push({
            type: 'visibility_gap',
            platform: 'chatgpt',
            priority: q.priority === 'critical' ? 'critical' : 'high',
            data: {
              query: q.query,
              mentioned: false
            },
            recommendation: {
              action: 'improve_schema',
              reasoning: `Not visible on ChatGPT (GPT-4o) for: "${q.query}"`
            }
          })
        }

      } catch (error) {
        console.error('ChatGPT query error:', error)
      }
    }

    console.log(`✅ ChatGPT testing complete: ${mentionCount}/${queries.length} mentions`)

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'chatgpt',
        queries_tested: queries.length,
        mentions: mentionCount,
        signals
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ ChatGPT test error:', error)
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
