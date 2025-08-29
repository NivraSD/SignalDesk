/**
 * Supabase Data Service
 * Handles fetching and storing intelligence data in Supabase
 */

class SupabaseDataService {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error('⚠️ Supabase configuration missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.');
    }
  }

  /**
   * Fetch stage data from Supabase
   */
  async getStageData(organizationName, stageName = null) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/intelligence-persistence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify({
            action: 'getStageData',
            organization_name: organizationName,
            stage: stageName,
            limit: 10
          })
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch stage data:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} stage records from Supabase`);
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching stage data:', error);
      return null;
    }
  }

  /**
   * Fetch organization profile from Supabase
   */
  async getOrganizationProfile(organizationName) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/intelligence-persistence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify({
            action: 'getProfile',
            organization_name: organizationName
          })
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch organization profile:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success && result.profile) {
        console.log(`✅ Loaded organization profile from Supabase`);
        // Also cache in localStorage for quick access
        localStorage.setItem('signaldesk_organization', JSON.stringify(result.profile));
        return result.profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching organization profile:', error);
      return null;
    }
  }

  /**
   * Fetch latest synthesis from Supabase
   */
  async getSynthesis(organizationName) {
    try {
      const stageData = await this.getStageData(organizationName, 'synthesis');
      
      if (stageData && stageData.length > 0) {
        // Get the most recent synthesis
        const latestSynthesis = stageData[0];
        console.log('✅ Loaded synthesis from Supabase:', latestSynthesis.created_at);
        
        // Cache in localStorage
        localStorage.setItem('signaldesk_synthesis', JSON.stringify(latestSynthesis.stage_data));
        
        return latestSynthesis.stage_data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching synthesis:', error);
      return null;
    }
  }

  /**
   * Load complete intelligence analysis from Supabase
   */
  async loadCompleteAnalysis(organizationName) {
    console.log(`📊 Loading complete analysis for ${organizationName} from Supabase...`);
    
    const stages = ['extraction', 'competitive', 'media', 'regulatory', 'trends', 'synthesis'];
    const stageResults = {};
    
    for (const stage of stages) {
      const data = await this.getStageData(organizationName, stage);
      if (data && data.length > 0) {
        stageResults[stage] = data[0].stage_data;
        console.log(`  ✅ Loaded ${stage} stage data`);
      }
    }
    
    if (Object.keys(stageResults).length > 0) {
      console.log(`✅ Loaded ${Object.keys(stageResults).length} stages from Supabase`);
      
      // Reconstruct the full intelligence object
      const fullIntelligence = {
        success: true,
        analysis: stageResults.synthesis || stageResults.competitive || {},
        tabs: this.reconstructTabsFromStageData(stageResults),
        stageData: stageResults,
        metadata: {
          loadedFromSupabase: true,
          timestamp: new Date().toISOString(),
          organization: organizationName
        }
      };
      
      // Cache the complete profile
      localStorage.setItem('signaldesk_complete_profile', JSON.stringify(fullIntelligence));
      
      return fullIntelligence;
    }
    
    return null;
  }

  /**
   * Reconstruct tabs from stage data
   */
  reconstructTabsFromStageData(stageResults) {
    const tabs = {};
    
    // Executive tab
    if (stageResults.synthesis) {
      tabs.executive = {
        headline: stageResults.synthesis.executive_summary?.headline || 'Analysis Complete',
        overview: stageResults.synthesis.executive_summary?.overview,
        immediate_actions: stageResults.synthesis.action_matrix?.immediate || [],
        statistics: stageResults.synthesis.metadata?.statistics || {}
      };
    }
    
    // Competitive tab
    if (stageResults.competitive) {
      tabs.competitive = {
        competitors: stageResults.competitive.competitors,
        battle_cards: stageResults.competitive.battle_cards,
        competitive_dynamics: stageResults.competitive.competitive_dynamics,
        summary: `Analyzed ${stageResults.competitive.competitors?.direct?.length || 0} competitors`
      };
    }
    
    // Media tab
    if (stageResults.media) {
      tabs.media = {
        media_landscape: stageResults.media.media_landscape,
        media_coverage: stageResults.media.media_coverage,
        journalists: stageResults.media.journalists
      };
    }
    
    // Regulatory tab
    if (stageResults.regulatory) {
      tabs.regulatory = {
        regulatory: stageResults.regulatory.regulatory,
        compliance_requirements: stageResults.regulatory.compliance_requirements
      };
    }
    
    // Market tab
    if (stageResults.trends) {
      tabs.market = {
        current_trends: stageResults.trends.current_trends,
        emerging_opportunities: stageResults.trends.emerging_opportunities
      };
    }
    
    // Forward tab
    if (stageResults.synthesis) {
      tabs.forward = {
        predictions: stageResults.synthesis.cascade_predictions,
        opportunities: stageResults.synthesis.strategic_recommendations,
        timeline: stageResults.synthesis.action_matrix
      };
    }
    
    return tabs;
  }
}

export default new SupabaseDataService();