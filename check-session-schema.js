const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  // Try to get ANY session to see what columns exist
  const { data: sessions, error } = await supabase
    .from('campaign_builder_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.log('Error fetching session:', error.message);
    return;
  }

  if (sessions && sessions.length > 0) {
    const session = sessions[0];
    console.log('✅ Session found! ID:', session.id);
    console.log('\nAll columns in session:');
    Object.keys(session).forEach(key => {
      if (key.toLowerCase().includes('part')) {
        console.log(`  ${key}: ${session[key] ? 'HAS DATA' : 'null/empty'}`);
      }
    });

    // Check specifically for the orchestration column
    const orchestrationKeys = Object.keys(session).filter(k =>
      k.includes('orchestration') || k.includes('Orchestration')
    );
    console.log('\nOrchestration-related columns:', orchestrationKeys);
  } else {
    console.log('No sessions found');
  }
}

checkSchema();
