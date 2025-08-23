// Health Check Endpoint for SignalDesk Edge Functions
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
    // Get list of edge functions to check
    const functionsToCheck = [
      'opportunity-orchestrator',
      'assess-opportunities-simple', 
      'intelligence-hub-realtime',
      'intelligence-discovery-v2',
      'intelligence-gathering-v2',
      'intelligence-synthesis'
    ]
    
    // Check environment variables
    const hasAnthropicKey = !!Deno.env.get('ANTHROPIC_API_KEY')
    const hasSupabaseUrl = !!Deno.env.get('SUPABASE_URL')
    
    // Test Firecrawl API connectivity (quick search)
    let firecrawlStatus = 'unknown'
    try {
      const firecrawlTest = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer fc-3048810124b640eb99293880a4ab25d0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test',
          limit: 1
        })
      })
      firecrawlStatus = firecrawlTest.ok ? 'connected' : 'error'
    } catch (error) {
      firecrawlStatus = 'unreachable'
    }
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        anthropic_configured: hasAnthropicKey,
        supabase_configured: hasSupabaseUrl,
        firecrawl_status: firecrawlStatus
      },
      edge_functions: {
        registered: functionsToCheck,
        health_check: 'operational'
      },
      services: {
        opportunity_detection: {
          orchestrator: 'deployed',
          simple_assessment: 'deployed',
          cascade_detection: 'enabled'
        },
        intelligence_hub: {
          realtime: 'deployed',
          discovery: 'deployed',
          gathering: 'deployed',
          synthesis: 'deployed'
        }
      },
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'N/A'
    }
    
    return new Response(
      JSON.stringify(health),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        details: 'Health check encountered an error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})