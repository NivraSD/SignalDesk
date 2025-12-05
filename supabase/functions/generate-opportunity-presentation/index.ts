import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { opportunityToGammaContentWithDirection } from '../_shared/opportunity-to-gamma.ts'
import { getGammaOptionsFromDirection } from '../_shared/opportunity-creative-direction.ts'

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

    // 2. Transform opportunity to Gamma content WITH creative direction
    console.log('🔄 Analyzing opportunity for creative direction...')
    const { content: presentationContent, creativeDirection } = opportunityToGammaContentWithDirection(opportunity)

    console.log(`🎨 Creative Direction Selected:`)
    console.log(`   Narrative Style: ${creativeDirection.narrativeStyle}`)
    console.log(`   Tone: ${creativeDirection.tone}`)
    console.log(`   Image Model: ${creativeDirection.imageModel}`)
    console.log(`   Visual Style: ${creativeDirection.visualStyle}`)
    console.log(`   Color Mood: ${creativeDirection.colorMood}`)

    console.log(`✅ Generated presentation content (${presentationContent.length} chars)`)
    console.log('Content preview:', presentationContent.substring(0, 500))

    // 3. Get Gamma options based on creative direction
    const gammaOptions = getGammaOptionsFromDirection(creativeDirection)

    // Determine slide count based on narrative style
    const slideCountByStyle: Record<string, number> = {
      urgency: 8,        // Shorter, punchy
      conquest: 10,      // Medium, strategic
      visionary: 12,     // Longer, expansive
      collaborative: 10, // Medium, balanced
      momentum: 10,      // Medium, building
      transformation: 12 // Longer, comprehensive
    }
    const slideCount = slideCountByStyle[creativeDirection.narrativeStyle] || 10

    // 4. Call gamma-presentation function with dynamic options
    console.log('📊 Starting Gamma presentation generation...')
    console.log(`   Using image model: ${gammaOptions.imageOptions.model}`)
    console.log(`   Using tone: ${gammaOptions.tone}`)
    console.log(`   Slide count: ${slideCount}`)

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
        slideCount: slideCount,
        capture: true,
        organization_id: organization_id,
        campaign_id: opportunity_id,
        campaign_folder: campaignFolder,
        options: {
          imageSource: 'ai',
          tone: gammaOptions.tone,
          cardSplit: 'auto',
          // Pass creative direction metadata for debugging/tracking
          _creativeDirection: {
            narrativeStyle: creativeDirection.narrativeStyle,
            visualStyle: creativeDirection.visualStyle,
            colorMood: creativeDirection.colorMood,
            hookStrategy: creativeDirection.hookStrategy
          }
        },
        // Image options with dynamic model selection
        imageOptions: gammaOptions.imageOptions
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
        creativeDirection: {
          narrativeStyle: creativeDirection.narrativeStyle,
          tone: creativeDirection.tone,
          visualStyle: creativeDirection.visualStyle,
          imageModel: creativeDirection.imageModel,
          openingHook: creativeDirection.openingHook,
          closingCTA: creativeDirection.closingCTA
        },
        metadata: {
          format: 'presentation',
          slideCount: slideCount,
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
