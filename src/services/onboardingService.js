import { supabase } from '../config/supabase';

/**
 * Onboarding Service
 * Stores initial configuration in MemoryVault and configures all systems
 */
class OnboardingService {
  /**
   * Process complete onboarding data
   */
  async completeOnboarding(onboardingData) {
    try {
      console.log('Processing onboarding data:', onboardingData);
      
      // 1. Store organization profile
      const orgResult = await this.storeOrganization(onboardingData.organization);
      const orgId = orgResult.id;
      
      // 2. Store objectives
      await this.storeObjectives(orgId, onboardingData.objectives);
      
      // 3. Configure opportunity detection
      await this.configureOpportunities(orgId, onboardingData.opportunities);
      
      // 4. Set up intelligence monitoring
      await this.configureIntelligence(orgId, onboardingData.intelligence);
      
      // 5. Activate MCPs
      await this.activateMCPs(orgId, onboardingData.mcps);
      
      // 6. Initialize MemoryVault with initial patterns
      await this.initializeMemoryVault(orgId, onboardingData);
      
      return {
        success: true,
        organizationId: orgId,
        message: 'Onboarding completed successfully'
      };
    } catch (error) {
      console.error('Onboarding failed:', error);
      throw error;
    }
  }
  
  /**
   * Store organization profile in MemoryVault
   */
  async storeOrganization(orgData) {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: orgData.name,
        industry: orgData.industry,
        market_position: orgData.position,
        differentiators: orgData.differentiators,
        competitors: orgData.competitors,
        settings: {
          onboarding_completed: true,
          onboarding_date: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Store in MemoryVault
    await this.storeInMemoryVault(data.id, 'organization', 'profile', orgData);
    
    return data;
  }
  
  /**
   * Store PR objectives
   */
  async storeObjectives(orgId, objectives) {
    // Store objectives in dedicated table
    const { error } = await supabase
      .from('pr_objectives')
      .insert({
        organization_id: orgId,
        primary_objectives: objectives.primary,
        success_metrics: objectives.metrics,
        active: true
      });
    
    if (error) throw error;
    
    // Store in MemoryVault for pattern recognition
    await this.storeInMemoryVault(orgId, 'objectives', 'current', objectives);
  }
  
  /**
   * Configure opportunity detection preferences
   */
  async configureOpportunities(orgId, opportunities) {
    // Map old opportunity types to new persona-based types
    const mappedTypes = {
      competitive_opportunist: opportunities.types.competitor_weakness || false,
      narrative_navigator: opportunities.types.narrative_vacuum || false,
      cascade_predictor: opportunities.types.cascade_events || true, // Always enable cascade
      crisis_preventer: opportunities.types.crisis_prevention || false,
      viral_virtuoso: opportunities.types.trending_topics || false
    };
    
    // Store opportunity configuration
    const { error } = await supabase
      .from('opportunity_config')
      .insert({
        organization_id: orgId,
        enabled_types: opportunities.types,
        opportunity_types: mappedTypes, // New persona-based types
        response_time: opportunities.response_time,
        risk_tolerance: opportunities.risk_tolerance,
        minimum_confidence: opportunities.minimum_confidence || 70,
        active: true
      });
    
    if (error) throw error;
    
    // Store in MemoryVault with enhanced config
    const enhancedConfig = {
      ...opportunities,
      opportunity_types: mappedTypes,
      minimum_confidence: opportunities.minimum_confidence || 70
    };
    await this.storeInMemoryVault(orgId, 'opportunities', 'config', enhancedConfig);
    
    // Also store in localStorage for immediate use
    localStorage.setItem('signaldesk_opportunity_profile', JSON.stringify(enhancedConfig));
  }
  
  /**
   * Configure intelligence monitoring
   */
  async configureIntelligence(orgId, intelligence) {
    // Store intelligence targets
    const targets = [];
    
    // Add competitors as targets
    for (const competitor of intelligence.competitors_to_track || []) {
      targets.push({
        organization_id: orgId,
        name: competitor,
        type: 'competitor',
        priority: 'high',
        keywords: [],
        active: true
      });
    }
    
    // Add topics as targets
    for (const topic of intelligence.topics_to_monitor || []) {
      targets.push({
        organization_id: orgId,
        name: topic,
        type: 'topic',
        priority: 'medium',
        keywords: intelligence.keywords || [],
        active: true
      });
    }
    
    if (targets.length > 0) {
      const { error } = await supabase
        .from('intelligence_targets')
        .insert(targets);
      
      if (error) throw error;
    }
    
    // Store in MemoryVault
    await this.storeInMemoryVault(orgId, 'intelligence', 'targets', intelligence);
  }
  
  /**
   * Activate selected MCPs
   */
  async activateMCPs(orgId, mcps) {
    const activeMCPs = Object.entries(mcps)
      .filter(([_, active]) => active)
      .map(([mcp, _]) => mcp);
    
    // Store MCP configuration
    const { error } = await supabase
      .from('mcp_config')
      .insert({
        organization_id: orgId,
        active_mcps: activeMCPs,
        config: mcps,
        last_sync: null
      });
    
    if (error) throw error;
    
    // Initialize sync status for each active MCP
    const syncStatuses = activeMCPs.map(mcp => ({
      organization_id: orgId,
      mcp_name: mcp,
      sync_status: 'idle',
      last_sync: null
    }));
    
    await supabase
      .from('mcp_sync_status')
      .insert(syncStatuses);
    
    // Store in MemoryVault
    await this.storeInMemoryVault(orgId, 'mcps', 'active', activeMCPs);
  }
  
  /**
   * Initialize MemoryVault with initial patterns
   */
  async initializeMemoryVault(orgId, onboardingData) {
    // Create initial patterns based on industry and position
    const initialPatterns = this.generateInitialPatterns(onboardingData);
    
    for (const pattern of initialPatterns) {
      await this.storeInMemoryVault(orgId, 'patterns', pattern.type, pattern.data);
    }
    
    // Store complete onboarding snapshot
    await this.storeInMemoryVault(orgId, 'onboarding', 'complete', onboardingData);
  }
  
  /**
   * Generate initial patterns based on onboarding data
   */
  generateInitialPatterns(data) {
    const patterns = [];
    
    // Industry-specific patterns
    const industryPatterns = {
      technology: {
        best_announcement_day: 'Tuesday',
        optimal_time: '10am ET',
        media_preference: 'data-driven stories'
      },
      healthcare: {
        best_announcement_day: 'Wednesday',
        optimal_time: '9am ET',
        media_preference: 'patient impact stories'
      },
      finance: {
        best_announcement_day: 'Tuesday',
        optimal_time: '8am ET',
        media_preference: 'market impact analysis'
      }
    };
    
    if (industryPatterns[data.organization.industry]) {
      patterns.push({
        type: 'industry_timing',
        data: industryPatterns[data.organization.industry]
      });
    }
    
    // Position-specific patterns
    const positionPatterns = {
      leader: {
        messaging: 'thought leadership',
        response_speed: 'measured',
        opportunity_focus: 'maintain position'
      },
      challenger: {
        messaging: 'differentiation',
        response_speed: 'aggressive',
        opportunity_focus: 'competitive wins'
      },
      disruptor: {
        messaging: 'innovation',
        response_speed: 'rapid',
        opportunity_focus: 'narrative change'
      }
    };
    
    if (positionPatterns[data.organization.position]) {
      patterns.push({
        type: 'position_strategy',
        data: positionPatterns[data.organization.position]
      });
    }
    
    return patterns;
  }
  
  /**
   * Store data in MemoryVault
   */
  async storeInMemoryVault(orgId, domain, type, data) {
    const { error } = await supabase
      .from('memory_vault')
      .insert({
        organization_id: orgId,
        domain,
        type,
        data,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('MemoryVault storage error:', error);
      // Non-critical, don't throw
    }
  }
  
  /**
   * Check if organization has completed onboarding
   */
  async checkOnboardingStatus(orgId) {
    const { data, error } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single();
    
    if (error) return false;
    
    return data?.settings?.onboarding_completed || false;
  }
  
  /**
   * Get onboarding data for organization
   */
  async getOnboardingData(orgId) {
    const { data, error } = await supabase
      .from('memory_vault')
      .select('*')
      .eq('organization_id', orgId)
      .eq('domain', 'onboarding')
      .eq('type', 'complete')
      .single();
    
    if (error) throw error;
    
    return data?.data || null;
  }
}

export default new OnboardingService();