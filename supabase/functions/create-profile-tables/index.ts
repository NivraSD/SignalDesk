// One-time function to create the organization_profiles table
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Create organization_profiles table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS organization_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_name VARCHAR(255) UNIQUE NOT NULL,
          profile_data JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_organization_profiles_name ON organization_profiles(organization_name);

        CREATE TABLE IF NOT EXISTS stage_data (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_name VARCHAR(255) NOT NULL,
          stage VARCHAR(100) NOT NULL,
          data JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(organization_name, stage)
        );

        CREATE INDEX IF NOT EXISTS idx_stage_data_org ON stage_data(organization_name);
        CREATE INDEX IF NOT EXISTS idx_stage_data_stage ON stage_data(stage);
      `
    }).catch(() => ({ error: 'SQL execution not available' }))

    if (createError) {
      console.log('RPC not available, trying direct table creation')
      
      // Try a simpler approach - just check if we can insert
      const testProfile = {
        organization_name: 'test-org-' + Date.now(),
        profile_data: { test: true },
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('organization_profiles')
        .upsert(testProfile)
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Table might not exist',
          error: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }

      // Clean up test entry
      await supabase
        .from('organization_profiles')
        .delete()
        .eq('organization_name', testProfile.organization_name)

      return new Response(JSON.stringify({
        success: true,
        message: 'Table exists and is working'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Tables created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})