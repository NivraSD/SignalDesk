import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { opportunityToGammaContent } from '../_shared/opportunity-to-gamma.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface GeneratePresentationRequest {
  opportunity_id: string
  organization_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { opportunity_id, organization_id }: GeneratePresentationRequest = await req.json()

    console.log(`📊 Generating presentation for opportunity: ${opportunity_id}`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 1. Load opportunity
    const { data: opportunity, error: loadError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunity_id)
      .eq('organization_id', organization_id)
      .single()

    if (loadError || !opportunity) {
      throw new Error(`Opportunity not found: ${loadError?.message}`)
    }

    console.log(`✅ Loaded opportunity: "${opportunity.title}"`)

    // Verify it's a V2 opportunity with execution plan
    if (opportunity.version !== 2 || !opportunity.execution_plan) {
      throw new Error('Only V2 opportunities with execution plans can generate presentations')
    }

    // Create clean folder name (same logic as OpportunitiesModule)
    const cleanTitle = opportunity.title.replace(/^Opportunity:\s*/i, '').trim()
    const campaignFolder = `Opportunities/${cleanTitle}`
    console.log(`📁 Campaign folder: ${campaignFolder}`)

    // 2. Transform opportunity to Gamma content
    console.log('🔄 Transforming opportunity to presentation format...')
    const presentationContent = opportunityToGammaContent(opportunity)

    console.log(`✅ Generated presentation content (${presentationContent.length} chars)`)
    console.log('Content preview:', presentationContent.substring(0, 500))

    // 3. Call gamma-presentation function - returns generationId for polling
    console.log('📊 Starting Gamma presentation generation...')

    const gammaResponse = await fetch(`${SUPABASE_URL}/functions/v1/gamma-presentation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        title: opportunity.title,
        content: presentationContent,
        topic: opportunity.title,
        format: 'presentation',
        slideCount: 12,
        capture: true, // Auto-saves to campaign_presentations table
        organization_id: organization_id,
        campaign_id: opportunity_id, // Link to opportunity
        campaign_folder: campaignFolder, // Pass the clean folder path
        options: {
          themeId: 'ysdv2wnyy9v8td0',
          imageSource: 'ai',
          tone: 'professional'
        }
      })
    })

    if (!gammaResponse.ok) {
      const errorText = await gammaResponse.text()
      console.error('Gamma API error:', errorText)
      throw new Error(`Gamma API failed: ${gammaResponse.status}`)
    }

    const gammaData = await gammaResponse.json()
    console.log('✅ Gamma presentation started:', gammaData)

    // Gamma returns generationId for polling (takes 30-60 seconds to complete)
    return new Response(
      JSON.stringify({
        success: true,
        generationId: gammaData.generationId,
        status: 'generating',
        estimatedTime: '30-60 seconds',
        message: 'Presentation generation started. Poll for status.',
        statusEndpoint: `${SUPABASE_URL}/functions/v1/gamma-presentation?generationId=${gammaData.generationId}`,
        opportunity_id,
        metadata: {
          format: 'presentation',
          slideCount: 12,
          needsPolling: true
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ Error generating presentation:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
