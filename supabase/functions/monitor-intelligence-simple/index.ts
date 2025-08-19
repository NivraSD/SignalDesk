// Simplified Supabase Edge Function: Intelligence Monitoring
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
    const { organizationId, targetId, targetType } = await req.json()

    console.log(`🔍 Starting monitoring for org: ${organizationId}`)

    // Generate mock intelligence findings without database dependency
    const mockFindings = [
      {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        target_id: targetId || 'mock-target-1',
        finding_type: 'competitor_news',
        title: 'Competitor Announces New Product Feature',
        content: 'Major competitor released AI-powered analytics dashboard',
        source_url: 'https://techcrunch.com/example',
        relevance_score: 0.85,
        sentiment: 'neutral',
        metadata: {
          source: 'rss',
          keywords: ['competitor', 'product', 'AI']
        },
        action_required: false,
        processed: false,
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        target_id: targetId || 'mock-target-2',
        finding_type: 'topic_trend',
        title: 'AI Ethics Discussion Gaining Momentum',
        content: 'Industry leaders calling for ethical AI frameworks',
        source_url: 'https://wired.com/example',
        relevance_score: 0.75,
        sentiment: 'positive',
        metadata: {
          source: 'monitoring',
          keywords: ['AI', 'ethics', 'regulation']
        },
        action_required: true,
        processed: false,
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        target_id: targetId || 'mock-target-3',
        finding_type: 'stakeholder_activity',
        title: 'Key Journalist Publishing Series on Industry',
        content: 'Sarah Chen from WSJ starting 5-part series on enterprise AI',
        source_url: 'https://wsj.com/example',
        relevance_score: 0.90,
        sentiment: 'neutral',
        metadata: {
          source: 'stakeholder_monitor',
          journalist: 'Sarah Chen',
          outlet: 'Wall Street Journal'
        },
        action_required: true,
        processed: false,
        created_at: new Date().toISOString()
      }
    ]

    return new Response(
      JSON.stringify({
        success: true,
        targets_processed: 3,
        findings_count: mockFindings.length,
        findings: mockFindings,
        message: `Monitoring complete. Found ${mockFindings.length} new findings (demo mode).`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in monitor-intelligence function:', error)
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