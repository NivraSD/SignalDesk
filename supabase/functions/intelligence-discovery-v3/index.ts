// Intelligence Discovery V3 - DISCOVERS and SAVES organization data
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization, stakeholders, monitoring_topics } = await req.json()
    
    console.log('🔍 Discovery V3 - Starting comprehensive discovery:', {
      organization: organization?.name,
      provided_competitors: stakeholders?.competitors?.length || 0,
      provided_regulators: stakeholders?.regulators?.length || 0
    })
    
    // Step 1: If we have just a name, discover everything using Claude
    let discoveredData = null
    if (organization?.name && (!stakeholders || Object.keys(stakeholders).length === 0)) {
      console.log('📡 No stakeholders provided - discovering via organization-discovery...')
      
      try {
        const discoveryResponse = await fetch(
          'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/organization-discovery',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || ''
            },
            body: JSON.stringify({
              organizationName: organization.name,
              url: organization.url
            })
          }
        )
        
        if (discoveryResponse.ok) {
          const result = await discoveryResponse.json()
          discoveredData = result.organization
          console.log('✅ Discovered comprehensive organization data')
        }
      } catch (e) {
        console.log('Could not discover organization:', e)
      }
    }
    
    // Step 2: Merge discovered data with provided stakeholders
    const entities = {
      competitors: discoveredData?.competitors || stakeholders?.competitors || [],
      regulators: discoveredData?.stakeholders?.regulators || stakeholders?.regulators || [],
      activists: discoveredData?.stakeholders?.activists || stakeholders?.activists || [],
      media: discoveredData?.stakeholders?.media || stakeholders?.media || stakeholders?.media_outlets || [],
      investors: discoveredData?.stakeholders?.investors || stakeholders?.investors || [],
      analysts: discoveredData?.stakeholders?.analysts || stakeholders?.analysts || []
    }
    
    // Step 3: Save complete profile to database
    console.log('💾 Saving complete profile to database...')
    try {
      const persistResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'saveProfile',
            organization_name: organization.name,
            industry: discoveredData?.industry || organization.industry || 'technology',
            competitors: entities.competitors,
            regulators: entities.regulators,
            media: entities.media,
            investors: entities.investors,
            analysts: entities.analysts,
            activists: entities.activists,
            keywords: discoveredData?.keywords || [organization.name],
            metadata: {
              description: discoveredData?.description || organization.description,
              url: discoveredData?.url || organization.url,
              business_model: discoveredData?.business_model,
              market_position: discoveredData?.market_position,
              headquarters: discoveredData?.headquarters,
              founded: discoveredData?.founded,
              employee_range: discoveredData?.employee_range,
              revenue_range: discoveredData?.revenue_range,
              executives: discoveredData?.executives,
              products: discoveredData?.products,
              target_customers: discoveredData?.target_customers,
              recent_topics: discoveredData?.recent_topics || monitoring_topics,
              key_narratives: discoveredData?.key_narratives,
              vulnerabilities: discoveredData?.vulnerabilities,
              opportunities: discoveredData?.opportunities
            }
          })
        }
      )
      
      if (persistResponse.ok) {
        console.log('✅ Complete profile saved to database')
      } else {
        const errorText = await persistResponse.text()
        console.error('Failed to save profile:', errorText)
      }
    } catch (saveError) {
      console.error('Database save error:', saveError)
    }
    
    // Step 4: Return enriched entities for immediate use
    const enrichedOrganization = {
      ...organization,
      industry: discoveredData?.industry || organization.industry || 'technology',
      description: discoveredData?.description || organization.description,
      business_model: discoveredData?.business_model,
      market_position: discoveredData?.market_position
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        entities,
        organization: enrichedOrganization,
        topics: discoveredData?.recent_topics || monitoring_topics || [],
        keywords: discoveredData?.keywords || [organization.name],
        statistics: {
          total_entities: Object.values(entities).flat().length,
          total_topics: monitoring_topics?.length || 0,
          discovered: !!discoveredData,
          saved: true
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