import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO Test Gemini
 * Tests organization visibility in Gemini responses with search grounding
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

    console.log(`🌟 Testing Gemini visibility for ${organization_name} (${queries.length} queries)`)

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key not configured')
    }

    const signals: any[] = []
    let mentionCount = 0

    // Test queries
    for (const q of queries) {
      try {
        console.log(` 🔍 Testing: "${q.query}"`)

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
                parts: [{ text: `${q.query}\n\nProvide comprehensive recommendations with sources.` }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024
              },
              tools: [{
                google_search: {}
              }]
            })
          }
        )

        if (!response.ok) {
          console.error('Gemini API error:', await response.text())
          continue
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

        console.log(`  📚 Gemini cited ${sources.length} sources`)
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
            platform: 'gemini',
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
                  return null
                }
              }).filter((h: string | null) => h)
            },
            recommendation: {
              action: position > 3 ? 'improve_ranking' : 'maintain_visibility',
              reasoning: `Brand mentioned in position ${position} on Gemini${sources.length > 0 ? `. Sources cited: ${sources.map((s: any) => {
                try {
                  return new URL(s.url).hostname
                } catch {
                  return ''
                }
              }).filter((h: string) => h).join(', ')}` : ''}`
            }
          })
        } else {
          console.log(` ❌ Not mentioned`)

          signals.push({
            type: 'visibility_gap',
            platform: 'gemini',
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
                  return null
                }
              }).filter((h: string | null) => h)
            },
            recommendation: {
              action: 'improve_schema',
              reasoning: `Not visible on Gemini for: "${q.query}"${sources.length > 0 ? `. Target these publications for PR: ${sources.slice(0, 3).map((s: any) => {
                try {
                  return new URL(s.url).hostname
                } catch {
                  return ''
                }
              }).filter((h: string) => h).join(', ')}` : ''}`
            }
          })
        }

      } catch (error) {
        console.error('Gemini query error:', error)
      }
    }

    console.log(`✅ Gemini testing complete: ${mentionCount}/${queries.length} mentions`)

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'gemini',
        queries_tested: queries.length,
        mentions: mentionCount,
        signals
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Gemini test error:', error)
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
