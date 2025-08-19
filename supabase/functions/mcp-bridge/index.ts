// Supabase Edge Function: MCP Bridge
// Connects to MCP servers for advanced intelligence processing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MCPRequest {
  server: string // Which MCP server to call
  method: string // Which method to invoke
  params: any // Parameters for the method
  organizationId: string
}

// MCP Server endpoints - Using REAL Supabase Edge Functions (no fallback data)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://zskaxjtyuaqazydouifp.supabase.co'

const MCP_SERVERS = {
  // ALL Real API-powered MCPs (Supabase Edge Functions) - NO FALLBACK DATA
  intelligence: `${SUPABASE_URL}/functions/v1/pr-intelligence`,
  media: `${SUPABASE_URL}/functions/v1/media-intelligence`, 
  news: `${SUPABASE_URL}/functions/v1/news-intelligence`,
  scraper: `${SUPABASE_URL}/functions/v1/scraper-intelligence`,
  opportunities: `${SUPABASE_URL}/functions/v1/opportunities-intelligence`,
  orchestrator: `${SUPABASE_URL}/functions/v1/orchestrator-intelligence`,
  relationships: `${SUPABASE_URL}/functions/v1/relationships-intelligence`,
  analytics: `${SUPABASE_URL}/functions/v1/analytics-intelligence`,
  monitor: `${SUPABASE_URL}/functions/v1/monitor-intelligence`,
  crisis: `${SUPABASE_URL}/functions/v1/crisis-intelligence`,
  social: `${SUPABASE_URL}/functions/v1/social-intelligence`,
  
  // Aliases for different naming conventions
  'media-monitoring': `${SUPABASE_URL}/functions/v1/media-intelligence`,
  'competitor-analysis': `${SUPABASE_URL}/functions/v1/pr-intelligence`,
  'opportunity-scanner': `${SUPABASE_URL}/functions/v1/opportunities-intelligence`,
  'media_monitoring': `${SUPABASE_URL}/functions/v1/media-intelligence`,
  'competitor_analysis': `${SUPABASE_URL}/functions/v1/pr-intelligence`,
  'opportunity_scanner': `${SUPABASE_URL}/functions/v1/opportunities-intelligence`
}

async function callMCPServer(server: string, method: string, params: any) {
  const serverUrl = MCP_SERVERS[server]
  
  if (!serverUrl) {
    throw new Error(`Unknown MCP server: ${server}`)
  }
  
  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: method,
        params: params
      })
    })

    if (!response.ok) {
      throw new Error(`MCP server ${server} returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || `MCP server ${server} error`)
    }

    return data.data
  } catch (error) {
    console.error(`Error calling MCP server ${server}:`, error)
    throw error
  }
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
    // Skip JWT verification - this is a public bridge for MCPs
    // The actual authentication happens in the frontend
    
    // Initialize Supabase client with service role key for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: MCPRequest = await req.json()
    const { server, method, params, organizationId } = request

    if (!organizationId) {
      throw new Error('organizationId is required')
    }

    console.log(`🔌 MCP Bridge: Calling ${server}.${method} for org ${organizationId}`)

    // Try to get organization configuration, but don't fail if not found
    let orgData = null
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()
      
      if (!error && data) {
        orgData = data
      }
    } catch (e) {
      console.log('Organization not in database, using defaults')
    }

    // Add organization context to params (merge with existing if present)
    const enrichedParams = {
      ...params,
      organization: {
        id: organizationId,
        name: params.organization?.name || orgData?.name || 'Test Organization',
        industry: params.organization?.industry || orgData?.industry || params.industry || 'technology',
        size: params.organization?.size || orgData?.size || 'medium',
        configuration: orgData?.configuration || {}
      }
    }

    // Call the appropriate MCP server
    const result = await callMCPServer(server, method, enrichedParams)

    // Store results if needed
    if (server === 'opportunities' && method === 'assess') {
      // Store discovered opportunities
      if (result.opportunities && result.opportunities.length > 0) {
        const { error: insertError } = await supabase
          .from('opportunity_queue')
          .insert(result.opportunities.map((opp: any) => ({
            ...opp,
            organization_id: organizationId,
            discovered_at: new Date().toISOString()
          })))
        
        if (insertError) {
          console.error('Error storing opportunities:', insertError)
        }
      }
    } else if (server === 'cascade' && method === 'predict') {
      // Store cascade predictions
      if (result.predictions) {
        const { error: insertError } = await supabase
          .from('cascade_predictions')
          .insert({
            organization_id: organizationId,
            event_data: params.event,
            predictions: result.predictions,
            created_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.error('Error storing cascade predictions:', insertError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: result,
        server: server,
        method: method
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in MCP bridge:', error)
    
    // FAIL FAST - NO FALLBACK DATA
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        service: 'MCP Bridge',
        message: `${server} MCP service unavailable - no fallback data available`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503 // Service unavailable when MCPs fail
      }
    )
  }
})