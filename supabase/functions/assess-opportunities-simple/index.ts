// Simplified Supabase Edge Function: Opportunity Assessment
// Works without database dependencies for testing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    const { organizationId, forceRefresh = false } = await req.json()

    console.log(`🎯 Assessing opportunities for organization: ${organizationId}`)

    // Generate mock opportunities without database dependency
    const mockOpportunities = [
      {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        opportunity_type: 'trending',
        title: 'AI Ethics Discussion Trending',
        description: 'Major tech conference next week focusing on AI ethics - perfect timing for thought leadership',
        base_score: 85,
        adjusted_score: 85,
        urgency: 'high',
        window_end: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        keywords: ['AI', 'ethics', 'technology'],
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        opportunity_type: 'competitor_gap',
        title: 'Competitor Vulnerability Detected',
        description: 'Competitor facing criticism over data practices - opportunity to highlight our privacy-first approach',
        base_score: 78,
        adjusted_score: 78,
        urgency: 'high',
        window_end: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        keywords: ['privacy', 'competitor', 'data'],
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        opportunity_type: 'news_hook',
        title: 'Breaking: Industry Report Release',
        description: 'Gartner releasing annual industry report - chance to provide expert commentary',
        base_score: 75,
        adjusted_score: 75,
        urgency: 'medium',
        window_end: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(),
        keywords: ['industry', 'report', 'gartner'],
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        opportunity_type: 'journalist_interest',
        title: 'WSJ Reporter Seeking Sources',
        description: 'Wall Street Journal tech reporter looking for expert sources on enterprise AI adoption',
        base_score: 82,
        adjusted_score: 82,
        urgency: 'high',
        window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        keywords: ['WSJ', 'AI', 'enterprise'],
        relevant_journalists: ['Sarah Chen - WSJ Tech'],
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: mockOpportunities,
        fromCache: false,
        message: `Found ${mockOpportunities.length} opportunities (demo mode)`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in assess-opportunities function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 with error in body to avoid CORS issues
      }
    )
  }
})