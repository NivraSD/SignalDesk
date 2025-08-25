// Intelligence Gathering V3 - Real-time Entity Actions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { entities } = await req.json()
    
    // For now, return mock data to test the flow
    // In production, this would use Firecrawl/RSS to get real data
    const mockActions = [
      {
        entity: entities.competitors?.[0]?.name || 'Competitor',
        action: 'announced new product launch',
        source: 'TechCrunch',
        url: 'https://techcrunch.com/example',
        timestamp: new Date().toISOString(),
        relevance: 0.9
      },
      {
        entity: entities.competitors?.[0]?.name || 'Competitor',
        action: 'reported quarterly earnings beat',
        source: 'Reuters',
        url: 'https://reuters.com/example',
        timestamp: new Date().toISOString(),
        relevance: 0.8
      }
    ]

    const mockTrends = [
      {
        topic: 'AI regulation',
        trend: 'increasing',
        mentions: 150,
        sources: ['WSJ', 'FT', 'Bloomberg']
      },
      {
        topic: 'sustainability',
        trend: 'stable',
        mentions: 75,
        sources: ['Guardian', 'BBC']
      }
    ]

    return new Response(
      JSON.stringify({
        success: true,
        entity_actions: {
          all: mockActions,
          by_entity: {
            [entities.competitors?.[0]?.name || 'Competitor']: mockActions
          }
        },
        topic_trends: {
          all: mockTrends
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Gathering error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        entity_actions: { all: [] },
        topic_trends: { all: [] }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
