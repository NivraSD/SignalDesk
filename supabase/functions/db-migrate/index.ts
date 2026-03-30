import postgres from 'https://deno.land/x/postgresjs@v3.4.4/mod.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, {
    max: 1,
  })

  try {
    console.log('Adding missing columns to intelligence_targets table...')

    // Add all missing columns and fix constraints
    await sql`
      ALTER TABLE intelligence_targets
      ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS threat_level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'competitor',
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'
    `

    // Fix target_type column - make nullable and set default
    try {
      await sql`ALTER TABLE intelligence_targets ALTER COLUMN target_type DROP NOT NULL`
      console.log('Made target_type nullable')
    } catch (e) {
      console.log('target_type already nullable or does not exist')
    }

    try {
      await sql`ALTER TABLE intelligence_targets ALTER COLUMN target_type SET DEFAULT 'competitor'`
      console.log('Set default for target_type')
    } catch (e) {
      console.log('Could not set default for target_type')
    }

    console.log('Columns added successfully!')

    await sql.end()

    return new Response(
      JSON.stringify({ success: true, message: 'active column added to intelligence_targets' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    await sql.end()
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
