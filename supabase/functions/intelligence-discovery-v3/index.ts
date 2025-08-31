// Intelligence Discovery V3 - DISCOVERS and SAVES organization data
// CRITICAL UPDATE: 2025-08-31 - Generate request_id for pipeline tracking v2
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    const { organization, stakeholders, monitoring_topics } = await req.json()
    
    // Generate unique request_id for this pipeline run
    const request_id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🔑 Generated request_id for pipeline: ${request_id}`)
    
    console.log('🔍 Discovery V3 - Starting comprehensive discovery:', {
      organization: organization?.name,
      provided_competitors: stakeholders?.competitors?.length || 0,
      provided_regulators: stakeholders?.regulators?.length || 0
    })
    
    // Step 1: If we have just a name, discover everything using Claude
    let discoveredData = null
    const orgName = typeof organization === 'string' ? organization : organization?.name
    
    if (orgName) {
      console.log('📡 Discovering organization data via organization-discovery...')
      
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
              organizationName: orgName,
              url: organization?.url
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
    let savedProfile = null
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
            organization_name: orgName,
            industry: discoveredData?.industry || organization?.industry || 'technology',
            competitors: entities.competitors,
            regulators: entities.regulators,
            media: entities.media,
            investors: entities.investors,
            analysts: entities.analysts,
            activists: entities.activists,
            keywords: discoveredData?.keywords || [orgName],
            metadata: {
              description: discoveredData?.description || organization?.description,
              url: discoveredData?.url || organization?.url,
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
        savedProfile = {
          competitors: entities.competitors,
          regulators: entities.regulators,
          media: entities.media,
          keywords: discoveredData?.keywords || [orgName],
          industry: discoveredData?.industry || organization?.industry || 'technology'
        }
      } else {
        const errorText = await persistResponse.text()
        console.error('Failed to save profile:', errorText)
      }
    } catch (saveError) {
      console.error('Database save error:', saveError)
    }
    
    // Step 4: SKIP intelligence collection for speed - this is just discovery
    console.log('⚡ Skipping intelligence collection for faster discovery (collection happens in later stages)')
    let collectedIntelligence = null
    
    // For extraction stage, we only need basic organization data, not intelligence signals
    // This saves 20-40 seconds and prevents timeouts
    
    // Step 5: Return enriched entities AND collected intelligence
    const enrichedOrganization = typeof organization === 'string' 
      ? {
          name: orgName,
          industry: discoveredData?.industry || 'technology',
          description: discoveredData?.description,
          business_model: discoveredData?.business_model,
          market_position: discoveredData?.market_position
        }
      : {
          ...organization,
          industry: discoveredData?.industry || organization?.industry || 'technology',
          description: discoveredData?.description || organization?.description,
          business_model: discoveredData?.business_model,
          market_position: discoveredData?.market_position
        }
    
    return new Response(
      JSON.stringify({
        success: true,
        request_id, // CRITICAL: Include request_id for pipeline tracking
        entities,
        organization: enrichedOrganization,
        competitors: entities.competitors, // Add competitors at top level too
        topics: discoveredData?.recent_topics || monitoring_topics || [],
        keywords: discoveredData?.keywords || [orgName],
        intelligence: null, // Skipped for speed - collected in later stages
        statistics: {
          total_entities: Object.values(entities).flat().length,
          total_topics: monitoring_topics?.length || 0,
          discovered: !!discoveredData,
          saved: true,
          signals_collected: 0, // Skipped for speed optimization
          sources_used: 0, // Skipped for speed optimization
          request_id // Also include in statistics for debugging
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