// Intelligence Discovery V3 - Uses stakeholders from onboarding
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization, stakeholders, monitoring_topics } = await req.json()
    
    console.log('🔍 Discovery V3 - Processing onboarding data:', {
      organization: organization?.name,
      competitors: stakeholders?.competitors?.length || 0,
      regulators: stakeholders?.regulators?.length || 0,
      activists: stakeholders?.activists?.length || 0,
      media: stakeholders?.media?.length || 0,
      topics: monitoring_topics?.length || 0
    })
    
    // Return the stakeholders in the format gathering expects
    const entities = {
      competitors: stakeholders?.competitors || [],
      regulators: stakeholders?.regulators || [],
      activists: stakeholders?.activists || [],
      media: stakeholders?.media || [],
      investors: stakeholders?.investors || [],
      analysts: stakeholders?.analysts || []
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        entities,
        topics: monitoring_topics || [],
        statistics: {
          total_entities: Object.values(entities).flat().length,
          total_topics: monitoring_topics?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Discovery error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        entities: {}
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
