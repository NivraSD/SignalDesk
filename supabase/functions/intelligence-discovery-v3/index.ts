// Intelligence Discovery V3 - Entity Identification Phase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization, industry, competitors: providedCompetitors } = await req.json()
    
    // Get API key at runtime
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    console.log('🔑 Discovery V3 - API key available:', !!ANTHROPIC_API_KEY)
    
    if (!ANTHROPIC_API_KEY) {
      console.log('⚠️ No API key, using fallback entities')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API key not configured',
          entities: getDefaultEntities(industry)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If competitors provided, use them directly
    if (providedCompetitors && providedCompetitors.length > 0) {
      console.log('✅ Using provided competitors:', providedCompetitors)
      return new Response(
        JSON.stringify({
          success: true,
          entities: {
            competitors: providedCompetitors,
            regulators: [],
            media: [],
            analysts: []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Otherwise, discover entities with Claude
    const prompt = `Identify key entities to monitor for ${organization} in the ${industry || 'technology'} industry.
    
    Return JSON with:
    {
      "competitors": [{"name": "Company", "domain": "example.com", "focus": "what to monitor"}],
      "regulators": [{"name": "Agency", "domain": "example.gov", "focus": "regulations"}],
      "media": [{"name": "Publication", "domain": "example.com", "focus": "coverage"}],
      "analysts": [{"name": "Firm", "domain": "example.com", "focus": "reports"}]
    }`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text
    
    // Parse JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const entities = jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultEntities(industry)

    return new Response(
      JSON.stringify({
        success: true,
        entities
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Discovery error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        entities: getDefaultEntities('technology')
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getDefaultEntities(industry: string) {
  // Minimal fallback - should rarely be used
  return {
    competitors: [
      { name: 'Competitor A', domain: 'example.com', focus: 'market share' }
    ],
    regulators: [],
    media: [],
    analysts: []
  }
}
