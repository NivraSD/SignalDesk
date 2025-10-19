const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function testMonitorStage1() {
  console.log('Testing Monitor Stage 1 Coverage Report...\n');
  
  const profile = {
    organization_name: "Tesla",
    industry: "automotive",
    competition: {
      direct_competitors: ["Ford", "GM", "Volkswagen", "Toyota"],
      indirect_competitors: ["Rivian", "Lucid Motors", "NIO"],
      emerging_threats: ["Apple", "Xiaomi"]
    },
    stakeholders: {
      regulators: ["NHTSA", "EPA", "SEC"],
      major_investors: ["Vanguard", "BlackRock"],
      executives: ["Elon Musk"]
    },
    monitoring_config: {
      keywords: ["EV", "electric vehicle", "autopilot", "battery"]
    }
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        organization_name: "Tesla",
        profile: profile
      })
    });

    if (!response.ok) {
      console.error('Error:', response.status, response.statusText);
      const error = await response.text();
      console.error('Details:', error);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Monitor Stage 1 Response:');
    console.log('   Total articles:', result.total_articles);
    console.log('   Claude assessed:', result.metadata?.claude_assessed || 0);
    
    const coverageReport = result.metadata?.coverage_report;
    
    if (coverageReport) {
      console.log('\n📊 COVERAGE REPORT FOUND:');
      console.log('   Context:', coverageReport.context);
      console.log('   Message for synthesis:', coverageReport.message_for_synthesis);
      
      if (coverageReport.found) {
        console.log('\n   Targets Found:');
        Object.entries(coverageReport.found).forEach(([category, items]) => {
          console.log(`     ${category}:`, Object.keys(items).slice(0, 3).join(', '), '...');
        });
      }
      
      if (coverageReport.gaps) {
        console.log('\n   Coverage Gaps:');
        Object.entries(coverageReport.gaps).forEach(([category, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            console.log(`     ${category}:`, items.slice(0, 3).join(', '), '...');
          }
        });
      }
      
      if (coverageReport.priorities) {
        console.log('\n   Priority articles (first 10):', coverageReport.priorities.slice(0, 10));
      }
      
      console.log('\n📋 Full Coverage Report Structure:');
      console.log(JSON.stringify(coverageReport, null, 2));
      
    } else {
      console.log('\n❌ NO COVERAGE REPORT FOUND IN RESPONSE');
      console.log('Metadata keys:', Object.keys(result.metadata || {}));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testMonitorStage1();