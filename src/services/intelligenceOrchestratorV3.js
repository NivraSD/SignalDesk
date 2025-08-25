/**
 * Intelligence Orchestrator V3 - Clean Entity-Focused Flow
 * Simplified 3-phase intelligence pipeline optimized for entity tracking
 */

class IntelligenceOrchestratorV3 {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
    
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
  async orchestrate(config) {
    // Extract organization and stakeholders from config
    const organization = config.organization || config;
    console.log(`🚀 V3 Orchestration starting for ${organization.name}`);
    
    try {
      // PHASE 1: DISCOVERY (Who and what to monitor)
      console.log('🔍 Phase 1: Discovery - Identifying entities to monitor');
      console.log('📡 Discovery - What we received:', {
        competitors: config.competitors,
        regulators: config.regulators,
        activists: config.activists,
        media_outlets: config.media_outlets,
        investors: config.investors,
        analysts: config.analysts,
        monitoring_topics: config.monitoring_topics
      });
      console.log('📡 Discovery Request being sent:', {
        url: `${this.supabaseUrl}/functions/v1/intelligence-discovery-v3`,
        organization: organization,
        stakeholders: {
          competitors: config.competitors || [],
          regulators: config.regulators || [],
          activists: config.activists || [],
          media_outlets: config.media_outlets || [], // Keep consistent field name
          investors: config.investors || [],
          analysts: config.analysts || []
        },
        monitoring_topics: config.monitoring_topics || []
      });
      
      const discoveryResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-discovery-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({ 
          organization,
          // Pass ALL stakeholder data from onboarding
          stakeholders: {
            competitors: config.competitors || [],
            regulators: config.regulators || [],
            activists: config.activists || [],
            media_outlets: config.media_outlets || [], // Keep consistent field name
            investors: config.investors || [],
            analysts: config.analysts || []
          },
          monitoring_topics: config.monitoring_topics || []
        })
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
        entities: discoveryData.entities || discoveryData.discovery || {},
        organization: organization
      });
      
      const gatheringResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-gathering-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({ 
          entities: discoveryData.entities || discoveryData.discovery || {},
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
      
      // The gathering response has entity_actions and topic_trends at the root level
      const intelligence = {
        entity_actions: gatheringData.entity_actions || { all: [] },
        topic_trends: gatheringData.topic_trends || { all: [] }
      };
      
      console.log('📊 Intelligence to synthesize:', {
        entity_actions_count: intelligence.entity_actions?.all?.length || 0,
        topic_trends_count: intelligence.topic_trends?.all?.length || 0,
        has_data: !!(intelligence.entity_actions?.all?.length || intelligence.topic_trends?.all?.length)
      });
      
      if (!gatheringData.success) {
        throw new Error(gatheringData.error || 'Gathering failed');
      }
      
      console.log('✅ Gathering complete:', {
        actions_captured: intelligence.entity_actions?.all?.length || 0,
        topics_monitored: intelligence.topic_trends?.all?.length || 0,
        critical_items: gatheringData.statistics?.critical_items || 0
      });

      // PHASE 3: SYNTHESIS (Analyze with Claude 4)
      console.log('🧠 Phase 3: Synthesis - Analyzing intelligence with Claude 4');
      console.log('📊 Intelligence data being sent to synthesis:', {
        entity_actions_count: intelligence.entity_actions?.all?.length || 0,
        topic_trends_count: intelligence.topic_trends?.all?.length || 0,
        sample_action: intelligence.entity_actions?.all?.[0],
        sample_trend: intelligence.topic_trends?.all?.[0],
        full_intelligence: intelligence
      });
      console.log('📡 Synthesis Request:', {
        url: `${this.supabaseUrl}/functions/v1/intelligence-synthesis-v3`,
        organization: organization
      });
      
      const synthesisResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-synthesis-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          intelligence: intelligence,
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
      console.log('📡 Synthesis Response received:', {
        success: synthesisData.success,
        hasError: !!synthesisData.error,
        hasTabs: !!synthesisData.tabs,
        tabKeys: synthesisData.tabs ? Object.keys(synthesisData.tabs) : [],
        hasAlerts: !!synthesisData.alerts,
        alertCount: synthesisData.alerts?.length || 0
      });
      console.log('🎯 Full Synthesis Data:', synthesisData);
      
      // Log a detailed sample of each tab's data
      if (synthesisData.tabs) {
        if (synthesisData.tabs.executive) {
          console.log('📊 Executive tab:', {
            headline: synthesisData.tabs.executive.headline,
            overview: synthesisData.tabs.executive.overview?.substring(0, 100),
            immediate_actions: synthesisData.tabs.executive.immediate_actions?.length || 0,
            has_competitive_highlight: !!synthesisData.tabs.executive.competitive_highlight,
            has_market_highlight: !!synthesisData.tabs.executive.market_highlight
          });
        }
        if (synthesisData.tabs.competitive) {
          console.log('🎯 Competitive tab:', {
            actions_count: synthesisData.tabs.competitive.competitor_actions?.length || 0,
            first_action: synthesisData.tabs.competitive.competitor_actions?.[0]
          });
        }
      } else {
        console.log('⚠️ No tabs in synthesis response!');
      }
      
      if (!synthesisData.success) {
        throw new Error(synthesisData.error || 'Synthesis failed');
      }
      
      console.log('✅ Synthesis complete:', {
        has_immediate_actions: synthesisData.tabs?.executive?.immediate_actions?.length > 0,
        alert_count: synthesisData.alerts?.length || 0,
        opportunities_count: synthesisData.opportunities?.length || 0,
        tabs: Object.keys(synthesisData.tabs || {})
      });

      // Save synthesis data for Opportunity Engine
      if (synthesisData.opportunities && synthesisData.opportunities.length > 0) {
        console.log('💾 Saving synthesis with opportunities for Opportunity Engine');
        localStorage.setItem('signaldesk_last_synthesis', JSON.stringify(synthesisData));
      }

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
      
      // Return error state with new comprehensive structure
      return {
        success: false,
        error: error.message,
        tabs: {
          executive: {
            headline: 'Intelligence gathering failed',
            overview: error.message,
            competitive_highlight: 'No data available',
            market_highlight: 'No data available',
            regulatory_highlight: 'No data available', 
            media_highlight: 'No data available',
            immediate_actions: []
          },
          competitive: {
            competitor_actions: [],
            competitive_implications: [],
            pr_strategy: '',
            key_messages: [],
            do_not_say: []
          },
          market: {
            market_trends: [],
            opportunities: [],
            market_implications: [],
            market_narrative: '',
            thought_leadership: []
          },
          regulatory: {
            regulatory_developments: [],
            compliance_requirements: [],
            regulatory_stance: '',
            stakeholder_messages: []
          },
          media: {
            media_coverage: [],
            social_trends: [],
            reputation_impact: '',
            sentiment_trend: '',
            narrative_risks: [],
            media_strategy: '',
            media_outreach: [],
            social_response: ''
          },
          forward: {
            predictions: [],
            preparation_needed: [],
            proactive_strategy: '',
            prepared_statements: []
          }
        },
        alerts: [],
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