import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichmentRequest {
  researchData: any // CampaignIntelligenceBrief
  selectedPositioning: any
  selectedPattern?: string
  campaignGoal: string
  orgId: string
}

interface EnrichedBlueprintData {
  // Core inputs (passed through)
  campaignGoal: string
  positioning: any
  researchData: any

  // Enriched data
  journalists: {
    tier1: any[]
    tier2: any[]
    gaps?: any
  }
  knowledgeLibrary: {
    foundational: any[]
    pattern_specific: any[]
    methodologies: any[]
  }
  channels: any[]

  // Structured data for AI generation
  stakeholdersByPhase: {
    awareness: any[]
    consideration: any[]
    conversion: any[]
    advocacy: any[]
  }
  channelsByStakeholder: Map<string, string[]>
  influenceLeverTemplates: any[]
  patternGuidance: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      researchData,
      selectedPositioning,
      selectedPattern,
      campaignGoal,
      orgId
    } = await req.json() as EnrichmentRequest

    console.log('🔍 Blueprint Enrichment:', {
      stakeholderCount: researchData?.stakeholders?.length || 0,
      positioning: selectedPositioning?.name,
      pattern: selectedPattern,
      goal: campaignGoal.substring(0, 50)
    })

    const startTime = Date.now()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Call journalist-registry
    console.log('📰 Fetching journalists from registry...')
    const journalistData = await enrichJournalists(researchData, supabase)

    // STEP 2: Call knowledge-library-registry
    console.log('📚 Fetching knowledge library...')
    const knowledgeData = await enrichKnowledge(selectedPattern, supabase)

    // STEP 3: Enrich with Firecrawl if gaps detected
    if (journalistData.gaps && journalistData.gaps.hasGaps) {
      console.log('🔥 Detected journalist gaps, triggering Firecrawl enrichment...')
      await enrichWithFirecrawl(journalistData.gaps, researchData, supabase)
    }

    // STEP 4: Structure data for AI generation
    console.log('🏗️ Structuring data for AI generation...')
    const structuredData = structureDataForAI(
      researchData,
      selectedPositioning,
      journalistData,
      knowledgeData,
      selectedPattern
    )

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Enrichment complete in ${elapsedTime}ms`)

    return new Response(
      JSON.stringify({
        enrichedData: structuredData,
        metadata: {
          tier1JournalistCount: journalistData.tier1.length,
          tier2JournalistCount: journalistData.tier2.length,
          knowledgeSourceCount: knowledgeData.foundational.length + knowledgeData.pattern_specific.length,
          gaps: journalistData.gaps,
          elapsedTime: `${elapsedTime}ms`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Enrichment error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to enrich blueprint data'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// STEP 1: Enrich journalists
async function enrichJournalists(researchData: any, supabase: any) {
  try {
    // Extract industry/beat from research
    const industry = researchData?.narrativeLandscape?.industry || 'technology'
    const stakeholders = researchData?.stakeholders || []

    // Get journalists already in research
    const researchJournalists = researchData?.channelIntelligence?.journalists || []

    // Call journalist-registry edge function
    const registryUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/journalist-registry`
    const registryKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    const response = await fetch(registryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${registryKey}`
      },
      body: JSON.stringify({
        industry,
        tier: 'tier1',
        count: 15 // Request 15 tier1 journalists
      })
    })

    if (!response.ok) {
      console.warn('Journalist registry call failed, using research data only')
      return {
        tier1: researchJournalists.filter((j: any) => j.tier === 'tier1' || !j.tier),
        tier2: researchJournalists.filter((j: any) => j.tier === 'tier2'),
        gaps: null
      }
    }

    const registryData = await response.json()

    // Merge with research journalists
    const tier1Set = new Set(researchJournalists.map((j: any) => j.name))
    const enrichedTier1 = [
      ...researchJournalists.filter((j: any) => j.tier === 'tier1' || !j.tier),
      ...(registryData.journalists || [])
        .filter((j: any) => !tier1Set.has(j.name))
        .slice(0, 10) // Add up to 10 from registry
    ]

    // Check for gaps
    const requestedCount = 15
    const currentCount = enrichedTier1.length
    const hasGaps = currentCount < requestedCount

    return {
      tier1: enrichedTier1,
      tier2: researchJournalists.filter((j: any) => j.tier === 'tier2'),
      gaps: hasGaps ? {
        hasGaps: true,
        currentCount,
        requestedCount,
        missingCount: requestedCount - currentCount,
        industry,
        suggestions: registryData.gap_analysis?.suggestions || []
      } : null
    }

  } catch (error) {
    console.error('Error enriching journalists:', error)
    // Fallback to research data
    const researchJournalists = researchData?.channelIntelligence?.journalists || []
    return {
      tier1: researchJournalists.filter((j: any) => j.tier === 'tier1' || !j.tier),
      tier2: researchJournalists.filter((j: any) => j.tier === 'tier2'),
      gaps: null
    }
  }
}

// STEP 2: Enrich knowledge library
async function enrichKnowledge(selectedPattern: string | undefined, supabase: any) {
  try {
    // Call knowledge-library-registry edge function
    const registryUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/knowledge-library-registry`
    const registryKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    const response = await fetch(registryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${registryKey}`
      },
      body: JSON.stringify({
        pattern: selectedPattern || 'CHORUS', // Default to CHORUS if not selected yet
        research_area: 'all',
        priority_filter: 'high'
      })
    })

    if (!response.ok) {
      console.warn('Knowledge library call failed, using empty knowledge')
      return {
        foundational: [],
        pattern_specific: [],
        methodologies: []
      }
    }

    const knowledgeData = await response.json()

    return {
      foundational: knowledgeData.data?.foundational || [],
      pattern_specific: knowledgeData.data?.pattern_specific || [],
      methodologies: knowledgeData.data?.tools || []
    }

  } catch (error) {
    console.error('Error enriching knowledge:', error)
    return {
      foundational: [],
      pattern_specific: [],
      methodologies: []
    }
  }
}

// STEP 3: Enrich with Firecrawl (if gaps detected)
async function enrichWithFirecrawl(gaps: any, researchData: any, supabase: any) {
  try {
    console.log('🔥 Firecrawl enrichment triggered for gaps:', gaps)

    // For now, log that we would trigger Firecrawl
    // Actual Firecrawl integration would go here
    // This would scrape:
    // - Journalist LinkedIn profiles
    // - Recent articles by journalists in this beat
    // - Event pages for details
    // - Competitor press releases

    // TODO: Implement Firecrawl integration when ready
    console.log('⚠️ Firecrawl integration not yet implemented, skipping...')

  } catch (error) {
    console.error('Error with Firecrawl enrichment:', error)
    // Non-blocking - continue without Firecrawl data
  }
}

// STEP 4: Structure data for AI generation
function structureDataForAI(
  researchData: any,
  positioning: any,
  journalistData: any,
  knowledgeData: any,
  selectedPattern?: string
): EnrichedBlueprintData {

  const stakeholders = researchData?.stakeholders || []
  const channelIntelligence = researchData?.channelIntelligence || {}

  // Organize stakeholders by phase based on their decision journey
  const stakeholdersByPhase = {
    awareness: stakeholders, // All stakeholders start in awareness
    consideration: stakeholders.filter((s: any) =>
      s.decisionTriggers?.some((t: string) =>
        t.toLowerCase().includes('research') ||
        t.toLowerCase().includes('evaluate') ||
        t.toLowerCase().includes('compare')
      )
    ),
    conversion: stakeholders.filter((s: any) =>
      s.decisionTriggers?.some((t: string) =>
        t.toLowerCase().includes('approval') ||
        t.toLowerCase().includes('budget') ||
        t.toLowerCase().includes('decide')
      )
    ),
    advocacy: stakeholders.filter((s: any) =>
      s.role?.toLowerCase().includes('executive') ||
      s.role?.toLowerCase().includes('director') ||
      s.role?.toLowerCase().includes('leader')
    )
  }

  // Map channels to stakeholders
  const channelsByStakeholder = new Map<string, string[]>()
  const byStakeholder = channelIntelligence.byStakeholder || []

  byStakeholder.forEach((cs: any) => {
    const channels = [
      ...(cs.informationDiet || []),
      ...(cs.trustedVoices || [])
    ].filter((c: string) => c && c.trim())

    channelsByStakeholder.set(cs.stakeholder, channels)
  })

  // Create influence lever templates from psychology
  const influenceLeverTemplates = stakeholders.map((s: any) => ({
    stakeholder: s.name || s.role,
    psychologicalProfile: s.psychology || {},
    primaryFear: s.psychology?.fears?.[0] || 'Unknown',
    primaryAspiration: s.psychology?.aspirations?.[0] || 'Unknown',
    decisionTriggers: s.decisionTriggers || [],
    channels: channelsByStakeholder.get(s.name || s.role) || []
  }))

  // Prepare pattern guidance from knowledge library
  const patternGuidance = {
    pattern: selectedPattern || 'CHORUS',
    research: knowledgeData.pattern_specific || [],
    methodologies: knowledgeData.methodologies || [],
    foundational: knowledgeData.foundational || []
  }

  return {
    campaignGoal: researchData.goal || '',
    positioning,
    researchData,
    journalists: journalistData,
    knowledgeLibrary: knowledgeData,
    channels: channelIntelligence.byChannel || [],
    stakeholdersByPhase,
    channelsByStakeholder,
    influenceLeverTemplates,
    patternGuidance
  }
}
