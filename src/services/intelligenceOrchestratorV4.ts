interface OrchestratorConfig {
  organization_id: string;
  organization_name: string;
  profile?: any;
  stages?: string[];
  skip_enrichment?: boolean;
  skip_synthesis?: boolean;
  skip_opportunity_engine?: boolean;
}

class IntelligenceOrchestratorV4 {
  async orchestrate(config: OrchestratorConfig) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    try {
      console.log('🚀 Starting full intelligence pipeline...');
      
      // STEP 1: Generate profile with mcp-discovery if not provided
      let profile = config.profile;
      if (!profile) {
        console.log('📋 Step 1: Generating organization profile...');
        const discoveryResponse = await fetch(
          `${supabaseUrl}/functions/v1/mcp-discovery`,
          {
            method: 'POST',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
              tool: 'create_organization_profile',
              arguments: {
                organization_name: config.organization_name,
                industry_hint: 'Auto-detect'
              }
            })
          }
        );
        
        if (discoveryResponse.ok) {
          const discoveryResult = await discoveryResponse.json();
          profile = discoveryResult.profile || discoveryResult.content?.[0] || {};
          console.log('✅ Profile generated:', {
            industry: profile.industry,
            competitors: profile.competitors?.length || 0,
            hasProfile: !!discoveryResult.profile
          });
        } else {
          console.warn('⚠️ Discovery failed, continuing without profile');
        }
      }
      
      // STEP 2: Call monitor-stage-1 to collect articles
      console.log('📰 Step 2: Collecting articles from monitor-stage-1...');
      const monitorResponse = await fetch(
        `${supabaseUrl}/functions/v1/monitor-stage-1?t=${Date.now()}`,
        {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            organization_name: config.organization_name,
            profile: profile
          })
        }
      );
      
      let monitoringData = null;
      if (monitorResponse.ok) {
        monitoringData = await monitorResponse.json();
        console.log('✅ Articles collected:', {
          total: monitoringData.total_articles || 0,
          findings: monitoringData.findings?.length || 0
        });
      } else {
        console.error('❌ Monitor-stage-1 failed:', await monitorResponse.text());
        return {
          success: false,
          error: 'Failed to collect articles from monitor-stage-1'
        };
      }
      
      // STEP 3: Score articles with monitor-stage-2-relevance (optional, orchestrator does this too)
      // Skipping since orchestrator-v2 calls relevance internally
      
      // STEP 4: Call intelligence-orchestrator-v2 with the monitoring data
      console.log('🧠 Step 3: Processing with intelligence-orchestrator-v2...');
      const response = await fetch(
        `${supabaseUrl}/functions/v1/intelligence-orchestrator-v2?t=${Date.now()}`,
        {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            ...config,
            profile: profile,
            monitoring_data: monitoringData // THIS IS THE KEY - passing the articles!
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Orchestration failed:', errorText);
        throw new Error(`Orchestration failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Pipeline complete:', {
        success: result.success,
        hasExecutiveSynthesis: !!result.executive_synthesis,
        hasOpportunities: !!result.opportunities,
        opportunityCount: result.opportunities?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ Pipeline error:', error);
      throw error;
    }
  }
}

export default new IntelligenceOrchestratorV4();