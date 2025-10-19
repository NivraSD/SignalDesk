const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function createTables() {
  console.log('Creating real-time intelligence tables...\n')

  // Create seen_articles table
  console.log('Creating seen_articles table...')
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS seen_articles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        url text NOT NULL,
        title text,
        seen_at timestamptz NOT NULL DEFAULT now(),
        source text,
        UNIQUE(organization_id, url, source)
      );
      CREATE INDEX IF NOT EXISTS idx_seen_articles_org_date ON seen_articles(organization_id, seen_at DESC);
    `
  })

  if (error1) {
    console.log('❌ seen_articles:', error1.message)
  } else {
    console.log('✅ seen_articles created')
  }

  // Create real_time_intelligence_briefs table
  console.log('Creating real_time_intelligence_briefs table...')
  const { error: error2 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS real_time_intelligence_briefs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        time_window text,
        articles_analyzed int,
        events_detected int,
        alerts_generated int,
        synthesis jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_rt_briefs_org_date ON real_time_intelligence_briefs(organization_id, created_at DESC);
    `
  })

  if (error2) {
    console.log('❌ real_time_intelligence_briefs:', error2.message)
  } else {
    console.log('✅ real_time_intelligence_briefs created')
  }

  // Create crises table
  console.log('Creating crises table...')
  const { error: error3 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS crises (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id text NOT NULL,
        title text NOT NULL,
        description text,
        severity text NOT NULL,
        impact text,
        source_events jsonb,
        response_timeframe text,
        response_strategy jsonb,
        status text DEFAULT 'detected',
        detected_at timestamptz NOT NULL DEFAULT now(),
        acknowledged_at timestamptz,
        resolved_at timestamptz,
        metrics jsonb,
        stakeholders_affected text[],
        media_coverage_urls text[]
      );
      CREATE INDEX IF NOT EXISTS idx_crises_org_severity ON crises(organization_id, severity, detected_at DESC);
      CREATE INDEX IF NOT EXISTS idx_crises_status ON crises(status, detected_at DESC);
    `
  })

  if (error3) {
    console.log('❌ crises:', error3.message)
  } else {
    console.log('✅ crises created')
  }

  console.log('\nVerifying tables...')
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Verify
  for (const table of ['seen_articles', 'real_time_intelligence_briefs', 'crises']) {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: verified`)
    }
  }
}

createTables()
