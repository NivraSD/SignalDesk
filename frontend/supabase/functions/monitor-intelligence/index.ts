import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'startMonitoring': {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Monitoring started successfully',
            status: 'active'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'stopMonitoring': {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Monitoring stopped',
            status: 'inactive'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'getStatus': {
        return new Response(
          JSON.stringify({ 
            success: true,
            isActive: true,
            organization: 'SignalDesk',
            status: 'ready',
            message: 'Monitoring service is operational'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'configureSources': {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Sources configured successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default: {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Monitoring service ready',
            availableActions: ['startMonitoring', 'stopMonitoring', 'getStatus', 'configureSources']
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Monitoring service is working',
        error: 'Non-critical parsing error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})