/**
 * Intelligence Orchestrator V3 - Clean Entity-Focused Flow
 * Simplified 3-phase intelligence pipeline optimized for entity tracking
 */

class IntelligenceOrchestratorV3 {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';
    
    console.log('🔧 V3 Orchestrator initialized:', {
      url: this.supabaseUrl,
      hasKey: !!this.supabaseKey,
      keyLength: this.supabaseKey?.length,
      keyPreview: this.supabaseKey?.substring(0, 20) + '...'
    });
  }

  /**
   * Run the complete V3 intelligence flow
   * Phase 1: Discovery - Identify WHO and WHAT to monitor
   * Phase 2: Gathering - Track entity actions and trends
   * Phase 3: Synthesis - Analyze and structure for display
   */
  async orchestrate(organization) {
    console.log(`🚀 V3 Orchestration starting for ${organization.name}`);
    
    try {
      // PHASE 1: DISCOVERY (Who and what to monitor)
      console.log('🔍 Phase 1: Discovery - Identifying entities to monitor');
      console.log('📡 Discovery Request:', {
        url: `${this.supabaseUrl}/functions/v1/intelligence-discovery-v3`,
        organization: organization,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey.substring(0, 20)}...`
        }
      });
      
      const discoveryResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-discovery-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({ organization })
      });

      console.log('📡 Discovery Response Status:', discoveryResponse.status);
      
      if (!discoveryResponse.ok) {
        const errorText = await discoveryResponse.text();
        console.error('❌ Discovery Error Response:', errorText);
        throw new Error(`Discovery failed: ${discoveryResponse.status} - ${errorText}`);
      }

      const discoveryData = await discoveryResponse.json();
      console.log('📡 Discovery Data:', discoveryData);
      
      if (!discoveryData.success) {
        throw new Error(discoveryData.error || 'Discovery failed');
      }
      
      console.log('✅ Discovery complete:', {
        total_entities: discoveryData.statistics?.total_entities || 0,
        total_topics: discoveryData.statistics?.total_topics || 0
      });

      // PHASE 2: GATHERING (Track entity actions)
      console.log('📡 Phase 2: Gathering - Tracking entity actions and trends');
      console.log('📡 Gathering Request:', {
        url: `${this.supabaseUrl}/functions/v1/intelligence-gathering-v3`,
        discovery: discoveryData.discovery,
        organization: organization
      });
      
      const gatheringResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-gathering-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({ 
          discovery: discoveryData.discovery,
          organization 
        })
      });

      console.log('📡 Gathering Response Status:', gatheringResponse.status);
      
      if (!gatheringResponse.ok) {
        const errorText = await gatheringResponse.text();
        console.error('❌ Gathering Error Response:', errorText);
        throw new Error(`Gathering failed: ${gatheringResponse.status} - ${errorText}`);
      }

      const gatheringData = await gatheringResponse.json();
      console.log('📡 Gathering Data:', gatheringData);
      
      if (!gatheringData.success) {
        throw new Error(gatheringData.error || 'Gathering failed');
      }
      
      console.log('✅ Gathering complete:', {
        actions_captured: gatheringData.statistics?.actions_captured || 0,
        topics_monitored: gatheringData.statistics?.topics_monitored || 0,
        critical_items: gatheringData.statistics?.critical_items || 0
      });

      // PHASE 3: SYNTHESIS (Analyze with Claude 4)
      console.log('🧠 Phase 3: Synthesis - Analyzing intelligence with Claude 4');
      console.log('📡 Synthesis Request:', {
        url: `${this.supabaseUrl}/functions/v1/intelligence-synthesis-v3`,
        intelligence: gatheringData.intelligence,
        organization: organization
      });
      
      const synthesisResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-synthesis-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          intelligence: gatheringData.intelligence,
          organization
        })
      });

      console.log('📡 Synthesis Response Status:', synthesisResponse.status);
      
      if (!synthesisResponse.ok) {
        const errorText = await synthesisResponse.text();
        console.error('❌ Synthesis Error Response:', errorText);
        throw new Error(`Synthesis failed: ${synthesisResponse.status} - ${errorText}`);
      }

      const synthesisData = await synthesisResponse.json();
      console.log('📡 Synthesis Data:', synthesisData);
      
      if (!synthesisData.success) {
        throw new Error(synthesisData.error || 'Synthesis failed');
      }
      
      console.log('✅ Synthesis complete:', {
        requires_attention: synthesisData.requires_attention,
        alert_count: synthesisData.alerts?.length || 0,
        tabs: Object.keys(synthesisData.tabs || {})
      });

      // Return the complete, formatted intelligence
      return {
        success: true,
        ...synthesisData,
        metadata: {
          organization: organization.name,
          timestamp: new Date().toISOString(),
          pipeline_version: 'v3',
          phases_completed: {
            discovery: true,
            gathering: true,
            synthesis: true
          }
        }
      };

    } catch (error) {
      console.error('❌ V3 Orchestration error:', error);
      console.error('Error Stack:', error.stack);
      console.error('Error Details:', {
        message: error.message,
        supabaseUrl: this.supabaseUrl,
        hasKey: !!this.supabaseKey,
        organization: organization
      });
      
      // Return error state with empty structure
      return {
        success: false,
        error: error.message,
        tabs: {
          executive: {
            headline: 'Intelligence gathering failed',
            summary: error.message,
            requires_action: false,
            urgency_level: 'low'
          }
        },
        alerts: [],
        requires_attention: false,
        statistics: {
          entities_tracked: 0,
          actions_captured: 0,
          topics_monitored: 0,
          critical_items: 0
        }
      };
    }
  }
}

export default new IntelligenceOrchestratorV3();