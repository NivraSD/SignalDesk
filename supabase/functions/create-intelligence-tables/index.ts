import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create tables
    const tables = [];
    
    // Organization Profiles table
    const { error: profileError } = await supabase.from('organization_profiles').select('id').limit(1);
    if (profileError?.message?.includes('does not exist')) {
      const { error } = await supabase.rpc('query', {
        query: `
          CREATE TABLE organization_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_name TEXT UNIQUE NOT NULL,
            organization_id TEXT,
            profile_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      }).catch(() => ({ error: 'Table creation via RPC not available' }));
      
      tables.push({
        name: 'organization_profiles',
        created: !error,
        error: error
      });
    } else {
      tables.push({
        name: 'organization_profiles',
        created: false,
        message: 'Already exists'
      });
    }
    
    // Intelligence Stage Data table
    const { error: stageError } = await supabase.from('intelligence_stage_data').select('id').limit(1);
    if (stageError?.message?.includes('does not exist')) {
      const { error } = await supabase.rpc('query', {
        query: `
          CREATE TABLE intelligence_stage_data (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_name TEXT NOT NULL,
            stage_name TEXT NOT NULL,
            stage_data JSONB,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      }).catch(() => ({ error: 'Table creation via RPC not available' }));
      
      tables.push({
        name: 'intelligence_stage_data',
        created: !error,
        error: error
      });
    } else {
      tables.push({
        name: 'intelligence_stage_data',
        created: false,
        message: 'Already exists'
      });
    }
    
    // Intelligence Targets table
    const { error: targetsError } = await supabase.from('intelligence_targets').select('id').limit(1);
    if (targetsError?.message?.includes('does not exist')) {
      const { error } = await supabase.rpc('query', {
        query: `
          CREATE TABLE intelligence_targets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_name TEXT UNIQUE NOT NULL,
            competitors JSONB,
            stakeholders JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      }).catch(() => ({ error: 'Table creation via RPC not available' }));
      
      tables.push({
        name: 'intelligence_targets',
        created: !error,
        error: error
      });
    } else {
      tables.push({
        name: 'intelligence_targets',
        created: false,
        message: 'Already exists'
      });
    }

    // Since we can't create tables via Edge Functions directly,
    // return instructions for manual creation
    const needsCreation = tables.some(t => t.error && !t.message);
    
    if (needsCreation) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Tables need to be created manually',
          instructions: 'Please go to your Supabase dashboard > SQL Editor and run the migration script',
          tables: tables,
          sql: `
-- Create Organization Profiles table
CREATE TABLE IF NOT EXISTS organization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    organization_id TEXT,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Intelligence Stage Data table
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_stage_org ON intelligence_stage_data(organization_name, stage_name);

-- Create Intelligence Targets table
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (for testing)
CREATE POLICY "Allow anon access to organization_profiles" ON organization_profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to intelligence_stage_data" ON intelligence_stage_data
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to intelligence_targets" ON intelligence_targets
    FOR ALL USING (true) WITH CHECK (true);
          `
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tables checked/created',
        tables: tables
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});