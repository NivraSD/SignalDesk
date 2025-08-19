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

// MCP Server endpoints (configured via environment variables)
const MCP_SERVERS = {
  opportunities: Deno.env.get('MCP_OPPORTUNITIES_URL') || 'http://localhost:3010',
  orchestrator: Deno.env.get('MCP_ORCHESTRATOR_URL') || 'http://localhost:3011',
  cascade: Deno.env.get('MCP_CASCADE_URL') || 'http://localhost:3012',
  alerting: Deno.env.get('MCP_ALERTING_URL') || 'http://localhost:3013',
  memory: Deno.env.get('MCP_MEMORY_URL') || 'http://localhost:3014',
  competitive: Deno.env.get('MCP_COMPETITIVE_URL') || 'http://localhost:3015',
  execution: Deno.env.get('MCP_EXECUTION_URL') || 'http://localhost:3016'
}

async function callMCPServer(server: string, method: string, params: any) {
  const url = MCP_SERVERS[server]
  if (!url) {
    throw new Error(`Unknown MCP server: ${server}`)
  }

  try {
    const response = await fetch(`${url}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: crypto.randomUUID()
      })
    })

    if (!response.ok) {
      throw new Error(`MCP server returned ${response.status}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message || 'MCP server error')
    }

    return data.result
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: MCPRequest = await req.json()
    const { server, method, params, organizationId } = request

    if (!organizationId) {
      throw new Error('organizationId is required')
    }

    console.log(`🔌 MCP Bridge: Calling ${server}.${method} for org ${organizationId}`)

    // Get organization configuration
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !orgData) {
      throw new Error('Organization not found')
    }

    // Add organization context to params
    const enrichedParams = {
      ...params,
      organization: {
        id: organizationId,
        name: orgData.name,
        industry: orgData.industry,
        size: orgData.size,
        configuration: orgData.configuration
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
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: 'MCP servers not available. Using fallback processing.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 with fallback message instead of error
      }
    )
  }
})