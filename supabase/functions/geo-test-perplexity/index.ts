import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO Test Perplexity
 * Tests organization visibility in Perplexity Sonar responses with citations
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

    console.log(`🔮 Testing Perplexity visibility for ${organization_name} (${queries.length} queries)`)

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY')

    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured')
    }

    const signals: any[] = []
    let mentionCount = 0

    // Test queries
    for (const q of queries) {
      try {
        console.log(` 🔍 Testing: "${q.query}"`)

        const response = await fetch(
          'https://api.perplexity.ai/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [{
                role: 'user',
                content: `${q.query}\n\nProvide a comprehensive answer with sources.`
              }],
              temperature: 0.7,
              max_tokens: 1024,
              return_citations: true,
              return_images: false
            })
          }
        )

        if (!response.ok) {
          console.error('Perplexity API error:', await response.text())
          continue
        }

        const data = await response.json()
        const responseText = data.choices?.[0]?.message?.content || ''

        // Extract citations
        const citations = data.citations || []
        const sources = citations.map((url: string) => {
          try {
            const urlObj = new URL(url)
            return {
              url: url,
              title: urlObj.hostname,
              snippet: ''
            }
          } catch {
            return { url, title: url, snippet: '' }
          }
        })

        console.log(`  📚 Perplexity cited ${sources.length} sources`)
        if (sources.length > 0) {
          console.log(`     Sources: ${sources.map((s: any) => s.url).join(', ')}`)
        }

        const mentioned = responseText.toLowerCase().includes(organization_name.toLowerCase())
        const position = extractMentionPosition(responseText, organization_name)

        if (mentioned) {
          mentionCount++
          console.log(` ✅ Mentioned in position ${position}`)

          signals.push({
            type: 'ai_visibility',
            platform: 'perplexity',
            priority: position <= 3 ? 'high' : 'medium',
            data: {
              query: q.query,
              mentioned: true,
              position,
              context: extractContext(responseText, organization_name),
              sources,
              source_count: sources.length,
              source_domains: sources.map((s: any) => {
                try {
                  return new URL(s.url).hostname
                } catch {
                  return s.url
                }
              }).filter((h: string) => h)
            },
            recommendation: {
              action: position > 3 ? 'improve_ranking' : 'maintain_visibility',
              reasoning: `Brand mentioned in position ${position} on Perplexity${sources.length > 0 ? `. Sources cited: ${sources.slice(0, 3).map((s: any) => {
                try {
                  return new URL(s.url).hostname
                } catch {
                  return s.url
                }
              }).join(', ')}` : ''}`
            }
          })
        } else {
          console.log(` ❌ Not mentioned`)

          signals.push({
            type: 'visibility_gap',
            platform: 'perplexity',
            priority: q.priority === 'critical' ? 'critical' : 'high',
            data: {
              query: q.query,
              mentioned: false,
              sources,
              source_count: sources.length,
              source_domains: sources.map((s: any) => {
                try {
                  return new URL(s.url).hostname
                } catch {
                  return s.url
                }
              }).filter((h: string) => h)
            },
            recommendation: {
              action: 'improve_schema',
              reasoning: `Not visible on Perplexity for: "${q.query}"${sources.length > 0 ? `. Target these publications for PR: ${sources.slice(0, 3).map((s: any) => {
                try {
                  return new URL(s.url).hostname
                } catch {
                  return s.url
                }
              }).join(', ')}` : ''}`
            }
          })
        }

      } catch (error) {
        console.error('Perplexity query error:', error)
      }
    }

    console.log(`✅ Perplexity testing complete: ${mentionCount}/${queries.length} mentions`)

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'perplexity',
        queries_tested: queries.length,
        mentions: mentionCount,
        signals
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Perplexity test error:', error)
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
