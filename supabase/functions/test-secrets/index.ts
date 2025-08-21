// Test function to verify secrets are accessible
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // Get all relevant environment variables
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Check if they exist and their format
    const result = {
      anthropic_key: {
        exists: !!ANTHROPIC_API_KEY,
        length: ANTHROPIC_API_KEY?.length || 0,
        starts_with: ANTHROPIC_API_KEY?.substring(0, 15) || 'NOT_SET',
        ends_with: ANTHROPIC_API_KEY?.substring(ANTHROPIC_API_KEY.length - 5) || 'NOT_SET',
      },
      supabase_url: {
        exists: !!SUPABASE_URL,
        value: SUPABASE_URL || 'NOT_SET'
      },
      service_role: {
        exists: !!SUPABASE_SERVICE_ROLE_KEY,
        length: SUPABASE_SERVICE_ROLE_KEY?.length || 0
      },
      env_vars_available: Object.keys(Deno.env.toObject()).sort(),
      timestamp: new Date().toISOString()
    }
    
    console.log('Secret check result:', result)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error checking secrets:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})