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
  // Real API-powered MCPs (Supabase Edge Functions)
  intelligence: `${SUPABASE_URL}/functions/v1/github-intelligence`,
  media: `${SUPABASE_URL}/functions/v1/media-intelligence`, 
  news: `${SUPABASE_URL}/functions/v1/news-intelligence`,
  scraper: `${SUPABASE_URL}/functions/v1/scraper-intelligence`,
  
  // Legacy Vercel MCPs (will be migrated to real APIs)
  opportunities: Deno.env.get('MCP_OPPORTUNITIES_URL') || 'https://signaldesk-opportunities-kx25xtoju-nivra-sd.vercel.app/api',
  orchestrator: Deno.env.get('MCP_ORCHESTRATOR_URL') || 'https://signaldesk-orchestrator-45s67pqct-nivra-sd.vercel.app/api',
  relationships: Deno.env.get('MCP_RELATIONSHIPS_URL') || 'https://signaldesk-relationships.vercel.app/api',
  analytics: Deno.env.get('MCP_ANALYTICS_URL') || 'https://signaldesk-analytics-gx48otgi8-nivra-sd.vercel.app/api',
  content: Deno.env.get('MCP_CONTENT_URL') || 'https://signaldesk-content.vercel.app/api',
  campaigns: Deno.env.get('MCP_CAMPAIGNS_URL') || 'https://signaldesk-campaigns.vercel.app/api',
  memory: Deno.env.get('MCP_MEMORY_URL') || 'https://signaldesk-memory-c8pocnr1n-nivra-sd.vercel.app/api',
  monitor: Deno.env.get('MCP_MONITOR_URL') || 'https://signaldesk-monitor-1oq1q1rsi-nivra-sd.vercel.app/api',
  cascade: Deno.env.get('MCP_CASCADE_URL') || 'https://signaldesk-scraper.vercel.app/api',
  entities: Deno.env.get('MCP_ENTITIES_URL') || 'https://signaldesk-entities.vercel.app/api',
  crisis: Deno.env.get('MCP_CRISIS_URL') || 'https://signaldesk-crisis.vercel.app/api',
  social: Deno.env.get('MCP_SOCIAL_URL') || 'https://signaldesk-social.vercel.app/api',
  'stakeholder-groups': Deno.env.get('MCP_STAKEHOLDER_GROUPS_URL') || 'https://signaldesk-stakeholder-groups.vercel.app/api',
  narratives: Deno.env.get('MCP_NARRATIVES_URL') || 'https://signaldesk-narratives.vercel.app/api',
  regulatory: Deno.env.get('MCP_REGULATORY_URL') || 'https://signaldesk-regulatory.vercel.app/api'
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

    // Add organization context to params (use defaults if no org data)
    const enrichedParams = {
      ...params,
      organization: {
        id: organizationId,
        name: orgData?.name || 'Test Organization',
        industry: orgData?.industry || params.industry || 'technology',
        size: orgData?.size || 'medium',
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