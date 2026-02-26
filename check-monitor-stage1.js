const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkMonitorStage1() {
  // Check various naming patterns for monitor stage 1
  const possibleTables = [
    'monitor_stage_1',
    'monitor_stage_1_results',
    'monitoring_stage_1',
    'monitoring_stage_1_results',
    'stage_1_results',
    'monitor_stage1',
    'monitoring_stage1'
  ];

  console.log('Checking for Monitor Stage 1 data:');
  console.log('================================');

  for (const table of possibleTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        console.log('✅ Found table: ' + table + ' with ' + count + ' records');

        // Get sample data
        if (count > 0) {
          const { data: sample } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(2);

          if (sample && sample.length > 0) {
            console.log('  Latest record:');
            console.log('    Created: ' + new Date(sample[0].created_at).toLocaleString());
            console.log('    Organization: ' + (sample[0].organization_id || 'N/A'));
            console.log('    Fields: ' + Object.keys(sample[0]).join(', '));

            // Check data structure
            if (sample[0].results) {
              console.log('    Results type: ' + typeof sample[0].results);
              if (Array.isArray(sample[0].results)) {
                console.log('    Results count: ' + sample[0].results.length);
              }
            }
          }
        }
      }
    } catch (e) {
      // Table doesn't exist, continue
    }
  }

  // Also check for any table with 'monitor' in the name
  console.log('\nChecking all tables with monitor in name...');
  const allTables = [
    'monitoring_results',
    'monitoring_data',
    'monitor_results',
    'intelligence_monitoring'
  ];

  for (const table of allTables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (typeof count === 'number') {
        console.log(table + ': ' + count + ' records');
      }
    } catch (e) {
      // Continue
    }
  }
}

checkMonitorStage1();