/**
 * Intelligence Orchestrator V4 - Elite Analysis Architecture
 * Fast collection via Edge Function + Deep analysis via MCP
 */

class IntelligenceOrchestratorV4 {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';
    
    // NO CACHE - Supabase Edge Functions are the SINGLE SOURCE OF TRUTH
    this.cache = null;
    console.log('🎯 V4 Elite Orchestrator - Edge Function Mode (No Cache)');
  }

  /**
   * Run elaborate multi-stage intelligence analysis
   * Integrates with stage-specific Edge Functions and Opportunity Engine
   */
  async orchestrate(config) {
    const organization = config.organization || config;
    const stageConfig = config.stageConfig || {};
    
    console.log(`🚀 V4 Elaborate Analysis for ${organization.name}`);
    console.log(`📊 Stage focus: ${stageConfig.focus || 'comprehensive'}`);
    
    // Check if this is a stage-specific request
    if (stageConfig.isElaboratePipeline && stageConfig.stageId) {
      return await this.runElaborateStage(stageConfig, organization, config);
    }
    
    // Otherwise run comprehensive analysis
    return await this.runComprehensiveAnalysis(organization, config);
  }

  /**
   * Run stage-specific analysis for elaborate pipeline
   */
  async runElaborateStage(stageConfig, organization, config) {
    console.log(`🎯 Running Elaborate Stage: ${stageConfig.stageName}`);
    
    // Debug logging
    console.log('🔍 DEBUG runElaborateStage params:', {
      stageConfig,
      organization,
      organizationType: typeof organization,
      hasOrgName: !!organization?.name,
      config,
      configHasOrg: !!config?.organization
    });
    
    try {
      let stageResult;
      
      // Route to appropriate stage-specific Edge Function
      switch (stageConfig.stageId) {
        case 'extraction':
          stageResult = await this.runOrganizationExtraction(organization, config);
          break;
        case 'competitive':
          stageResult = await this.runCompetitiveStage(organization, config);
          break;
        case 'media':
          stageResult = await this.runMediaStage(organization, config);
          break;
        case 'regulatory':
          stageResult = await this.runRegulatoryStage(organization, config);
          break;
        case 'trends':
          stageResult = await this.runTrendsStage(organization, config);
          break;
        case 'synthesis':
          stageResult = await this.runSynthesisStage(organization, config, stageConfig.previousStageResults);
          break;
        default:
          // Fallback to comprehensive analysis
          stageResult = await this.runComprehensiveAnalysis(organization, config);
      }

      // Generate opportunities for this stage if not synthesis
      if (stageConfig.stageId !== 'synthesis' && stageResult.success) {
        console.log('🔍 Generating opportunities for stage:', stageConfig.stageId);
        const opportunities = await this.generateStageOpportunities(stageResult, organization, stageConfig);
        stageResult.opportunities = opportunities;
      }

      return stageResult;
      
    } catch (error) {
      console.error(`❌ Elaborate Stage ${stageConfig.stageId} error:`, error);
      return {
        success: false,
        error: error.message,
        stageId: stageConfig.stageId,
        analysis: this.getEmptyAnalysis()
      };
    }
  }

  /**
   * Stage 1: Organization Data Extraction
   */
  async runOrganizationExtraction(organization, config) {
    console.log('🏢 Stage 1: Organization Data Extraction & Discovery');
    
    // Ensure organization has a name
    const orgName = organization?.name || config?.organization?.name || 'Default Organization';
    const safeOrganization = {
      ...organization,
      name: orgName
    };
    
    // STEP 1: Discovery - Extract and save comprehensive organization data
    console.log(`🔍 Step 1: Discovering organization profile for: ${orgName}`);
    
    // Add timeout wrapper
    const fetchWithTimeout = async (url, options, timeout = 30000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeout/1000} seconds`);
        }
        throw error;
      }
    };
    
    const discoveryResponse = await fetchWithTimeout(`${this.supabaseUrl}/functions/v1/intelligence-discovery-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        organization: safeOrganization,
        stakeholders: {
          competitors: config.competitors || [],
          regulators: config.regulators || [],
          activists: config.activists || [],
          media_outlets: config.media_outlets || [],
          investors: config.investors || [],
          analysts: config.analysts || []
        },
        monitoring_topics: config.monitoring_topics || []
      })
    });

    if (!discoveryResponse.ok) {
      const errorText = await discoveryResponse.text();
      console.error('❌ Discovery failed:', discoveryResponse.status, errorText);
      // Don't throw - continue with what we have
    } else {
      console.log('📥 Discovery response received, parsing...');
      const discoveryData = await discoveryResponse.json();
      console.log('✅ Discovery complete:', {
        hasEntities: !!discoveryData.entities,
        entities: Object.keys(discoveryData.entities || {}),
        saved: discoveryData.statistics?.saved
      });
      
      // Update config with discovered entities
      if (discoveryData.entities) {
        config = { ...config, ...discoveryData.entities };
        organization = discoveryData.organization || organization;
      }
    }
    
    // STEP 2: Collection - Gather signals using discovered entities
    console.log('📡 Step 2: Collecting intelligence signals...');
    const collectionResponse = await fetchWithTimeout(`${this.supabaseUrl}/functions/v1/intelligence-collection-v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({ 
        organization,
        entities: {
          competitors: config.competitors || [],
          regulators: config.regulators || [],
          activists: config.activists || [],
          media_outlets: config.media_outlets || [],
          investors: config.investors || [],
          analysts: config.analysts || []
        }
      })
    });

    if (!collectionResponse.ok) {
      const errorText = await collectionResponse.text();
      console.error('❌ Collection failed:', collectionResponse.status, errorText);
      throw new Error(`Organization extraction failed: ${collectionResponse.status} - ${errorText}`);
    }

    console.log('📥 Collection response received, parsing...');
    const collectionData = await collectionResponse.json();
    console.log('✅ Collection data parsed:', {
      hasIntelligence: !!collectionData.intelligence,
      signalCount: collectionData.intelligence?.raw_signals?.length || 0
    });
    
    // Transform into enriched organization profile with guaranteed name
    const enrichedOrganization = {
      ...safeOrganization,  // Use safeOrganization to ensure name is present
      signals_collected: collectionData.intelligence?.raw_signals?.length || 0,
      data_sources: collectionData.intelligence?.metadata?.sources || [],
      extraction_timestamp: new Date().toISOString(),
      stakeholder_mapping: {
        competitors: config.competitors || [],
        regulators: config.regulators || [],
        media_outlets: config.media_outlets || [],
        investors: config.investors || [],
        analysts: config.analysts || []
      }
    };

    // SAVE RESULTS TO SUPABASE - SINGLE SOURCE OF TRUTH
    const stageData = {
      organization: enrichedOrganization,
      intelligence: collectionData.intelligence,
      analysis: {
        extraction_summary: `Extracted ${collectionData.intelligence?.raw_signals?.length || 0} signals from ${collectionData.intelligence?.metadata?.sources?.length || 0} sources`,
        stakeholder_count: Object.values(enrichedOrganization.stakeholder_mapping).flat().length
      }
    };
    
    try {
      await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'saveStageData',
          organization_name: enrichedOrganization.name,
          stage: 'extraction',
          stage_data: stageData
        })
      });
      console.log('✅ Saved extraction stage data to Supabase');
    } catch (error) {
      console.error('❌ Failed to save extraction stage data:', error);
    }

    return {
      success: true,
      organization: enrichedOrganization,
      intelligence: collectionData.intelligence,
      analysis: stageData.analysis,
      tabs: this.generateExtractionTabs(enrichedOrganization, collectionData),
      data: stageData
    };
  }

  /**
   * Stage 2: Competitive Intelligence Analysis
   */
  async runCompetitiveStage(organization, config) {
    console.log('🎯 Stage 2: Competitive Intelligence Analysis');
    
    // Debug logging to understand what's being passed
    console.log('🔍 DEBUG runCompetitiveStage inputs:', {
      organizationParam: organization,
      organizationType: typeof organization,
      organizationKeys: organization ? Object.keys(organization) : null,
      configParam: config,
      configType: typeof config,
      configKeys: config ? Object.keys(config) : null,
      hasOrgName: !!organization?.name,
      hasConfigOrgName: !!config?.organization?.name
    });
    
    // Ensure organization has a name
    const orgName = organization?.name || config?.organization?.name || 'Default Organization';
    const safeOrganization = {
      ...organization,
      name: orgName
    };
    
    // Load profile from Supabase edge function - SINGLE SOURCE OF TRUTH
    let savedProfile = null;
    
    console.log(`📊 Loading organization profile from edge function for: ${orgName}`);
    try {
      const persistResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'getProfile',
          organization_name: orgName
        })
      });
      
      if (persistResponse.ok) {
        const result = await persistResponse.json();
        if (result.success && result.profile) {
          const orgData = result.profile;
          savedProfile = {
            name: orgData.organization?.name || orgData.name,
            industry: orgData.organization?.industry || orgData.industry,
            competitors: orgData.competitors || [],
            regulators: orgData.stakeholders?.regulators || [],
            media: orgData.stakeholders?.media || [],
            investors: orgData.stakeholders?.investors || [],
            analysts: orgData.stakeholders?.analysts || [],
            activists: orgData.stakeholders?.activists || [],
            keywords: orgData.keywords || [],
            metadata: {
              description: orgData.organization?.description || orgData.description,
              headquarters: orgData.organization?.headquarters || orgData.headquarters,
              founded: orgData.organization?.founded || orgData.founded,
              products: orgData.products || [],
              executives: orgData.executives || []
            }
          };
          console.log('✅ Loaded profile from edge function with', savedProfile.competitors?.length || 0, 'competitors');
        }
      }
    } catch (e) {
      console.error('Error loading profile from edge function:', e);
    }
    
    // Use saved competitors if not provided
    if (savedProfile?.competitors && (!config.competitors || config.competitors.length === 0)) {
      config.competitors = savedProfile.competitors;
    }
    
    // Skip backend persistence calls that cause 500 errors
    console.log('📊 Skipping backend persistence calls to avoid 500 errors');
    
    // Pass the full saved profile to the stage with guaranteed name
    // CRITICAL: Ensure organization object is properly structured
    const organizationData = savedProfile || safeOrganization || {};
    
    // Validate and ensure organization has required fields
    if (!organizationData.name) {
      console.warn('⚠️ Organization missing name, using fallback');
      organizationData.name = orgName || 'Default Organization';
    }
    
    const requestBody = {
      organization: {
        ...organizationData,
        name: orgName || organizationData.name || 'Default Organization' // Triple fallback
      },
      competitors: savedProfile?.competitors || config?.competitors || [],
      savedProfile: savedProfile // Include full profile for reference
    };
    
    // Final validation before sending
    if (!requestBody.organization?.name) {
      console.error('❌ CRITICAL: Organization name still missing after all fallbacks');
      requestBody.organization.name = 'Fallback Organization';
    }
    
    console.log('📤 Sending to competitor stage:', {
      hasProfile: !!savedProfile,
      competitorCount: requestBody.competitors?.length || 0,
      competitors: requestBody.competitors?.slice(0, 3),
      organizationName: requestBody.organization?.name,
      fullRequestBody: requestBody
    });
    
    const competitorResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-stage-1-competitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!competitorResponse.ok) {
      const errorText = await competitorResponse.text();
      console.error('❌ Competitor stage failed:', competitorResponse.status, errorText);
      throw new Error(`Competitive analysis failed: ${competitorResponse.status}`);
    }

    const competitorData = await competitorResponse.json();
    
    const returnData = {
      success: true,
      competitors: competitorData.data?.competitors || [],
      competitive_landscape: competitorData.data?.competitive_landscape || {},
      analysis: {
        competitors_analyzed: competitorData.data?.metadata?.competitors_analyzed || 0,
        stage_duration: competitorData.data?.metadata?.duration || 0
      },
      tabs: this.generateCompetitiveTabs(competitorData.data),
      // Store raw data for synthesis stage
      data: competitorData.data
    };
    
    // SAVE RESULTS TO SUPABASE - SINGLE SOURCE OF TRUTH
    try {
      await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'saveStageData',
          organization_name: orgName,
          stage: 'competitive',
          stage_data: returnData.data
        })
      });
      console.log('✅ Saved competitive stage data to Supabase');
    } catch (error) {
      console.error('❌ Failed to save competitive stage data:', error);
    }
    
    console.log('🔄 Stage 2 (competitive) returning data:', {
      hasData: !!competitorData.data,
      hasCompetitors: !!competitorData.data?.competitors,
      competitorsStructure: competitorData.data?.competitors ? Object.keys(competitorData.data.competitors) : null,
      hasTabs: !!returnData.tabs
    });
    
    return returnData;
  }

  /**
   * Stage 3: Media Landscape Mapping  
   */
  async runMediaStage(organization, config) {
    console.log('📰 Stage 3: Media Landscape Mapping');
    
    // Ensure organization has a name
    const orgName = organization?.name || config?.organization?.name || 'Default Organization';
    const safeOrganization = {
      ...organization,
      name: orgName
    };
    
    // Load profile from Supabase edge function - SINGLE SOURCE OF TRUTH
    console.log(`📊 Loading media profile from edge function for: ${orgName}`);
    let savedProfile = null;
    
    try {
      const persistResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'getProfile',
          organization_name: orgName
        })
      });
      
      if (persistResponse.ok) {
        const result = await persistResponse.json();
        if (result.success && result.profile) {
          savedProfile = {
            name: result.profile.organization?.name || result.profile.name,
            media: result.profile.stakeholders?.media || [],
            keywords: result.profile.keywords || []
          };
          console.log('✅ Retrieved saved profile from edge function with media outlets:', savedProfile?.media?.length || 0);
          
          // Use saved media outlets if not provided
          if (savedProfile?.media && (!config.media_outlets || config.media_outlets.length === 0)) {
            config.media_outlets = savedProfile.media;
          }
        }
      }
    } catch (e) {
      console.error('Could not retrieve saved profile from edge function:', e);
    }
    
    const mediaResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-stage-2-media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        organization: savedProfile || safeOrganization,
        media_outlets: savedProfile?.media || config.media_outlets || [],
        savedProfile: savedProfile // Include full profile for reference
      })
    });

    if (!mediaResponse.ok) {
      throw new Error(`Media analysis failed: ${mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json();
    
    const returnData = {
      success: true,
      media_landscape: mediaData.data || {},
      analysis: {
        media_mapped: mediaData.data?.outlets_analyzed || 0,
        journalists_identified: mediaData.data?.journalists?.length || 0
      },
      tabs: this.generateMediaTabs(mediaData.data),
      data: mediaData.data
    };
    
    // SAVE RESULTS TO SUPABASE - SINGLE SOURCE OF TRUTH
    try {
      await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'saveStageData',
          organization_name: orgName,
          stage: 'media',
          stage_data: returnData.data
        })
      });
      console.log('✅ Saved media stage data to Supabase');
    } catch (error) {
      console.error('❌ Failed to save media stage data:', error);
    }
    
    return returnData;
  }

  /**
   * Stage 4: Regulatory & Stakeholder Environment
   */
  async runRegulatoryStage(organization, config) {
    console.log('⚖️ Stage 4: Regulatory & Stakeholder Analysis');
    
    // Ensure organization has a name
    const orgName = organization?.name || config?.organization?.name || 'Default Organization';
    const safeOrganization = {
      ...organization,
      name: orgName
    };
    
    // FIRST: Retrieve saved organization profile with regulators, analysts, investors
    console.log(`📊 Retrieving saved stakeholders from database for: ${orgName}`);
    let savedProfile = null;
    try {
      const persistResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'getProfile',
          organization_name: orgName
        })
      });
      
      if (persistResponse.ok) {
        const result = await persistResponse.json();
        savedProfile = result.profile;
        console.log('✅ Retrieved saved profile with stakeholders:', {
          regulators: savedProfile?.regulators?.length || 0,
          analysts: savedProfile?.analysts?.length || 0,
          investors: savedProfile?.investors?.length || 0
        });
        
        // Use saved stakeholders if not provided
        if (!config.regulators || config.regulators.length === 0) {
          config.regulators = savedProfile?.regulators || [];
        }
        if (!config.analysts || config.analysts.length === 0) {
          config.analysts = savedProfile?.analysts || [];
        }
        if (!config.investors || config.investors.length === 0) {
          config.investors = savedProfile?.investors || [];
        }
      }
    } catch (e) {
      console.error('Could not retrieve saved profile:', e);
    }
    
    const regulatoryResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-stage-3-regulatory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        organization: safeOrganization,
        regulators: config.regulators || savedProfile?.regulators || [],
        analysts: config.analysts || savedProfile?.analysts || [],
        investors: config.investors || savedProfile?.investors || []
      })
    });

    if (!regulatoryResponse.ok) {
      throw new Error(`Regulatory analysis failed: ${regulatoryResponse.status}`);
    }

    const regulatoryData = await regulatoryResponse.json();
    
    const returnData = {
      success: true,
      regulatory: regulatoryData.data || {},
      analysis: {
        regulators_tracked: regulatoryData.data?.regulators?.length || 0,
        compliance_items: regulatoryData.data?.compliance?.length || 0
      },
      tabs: this.generateRegulatoryTabs(regulatoryData.data),
      data: regulatoryData.data
    };
    
    // SAVE RESULTS TO SUPABASE - SINGLE SOURCE OF TRUTH
    try {
      await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'saveStageData',
          organization_name: orgName,
          stage: 'regulatory',
          stage_data: returnData.data
        })
      });
      console.log('✅ Saved regulatory stage data to Supabase');
    } catch (error) {
      console.error('❌ Failed to save regulatory stage data:', error);
    }
    
    return returnData;
  }

  /**
   * Stage 5: Market Trends & Topic Analysis
   */
  async runTrendsStage(organization, config) {
    console.log('📈 Stage 5: Market Trends & Topic Analysis');
    
    // Ensure organization has a name
    const orgName = organization?.name || config?.organization?.name || 'Default Organization';
    const safeOrganization = {
      ...organization,
      name: orgName
    };
    
    // FIRST: Retrieve saved topics and keywords from database
    console.log('📊 Retrieving saved topics and previous intelligence...');
    let savedProfile = null;
    let savedIntelligence = [];
    
    try {
      // Get organization profile
      const profileResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'getProfile',
          organization_name: orgName
        })
      });
      
      if (profileResponse.ok) {
        const result = await profileResponse.json();
        savedProfile = result.profile;
        console.log('✅ Retrieved saved profile with keywords:', savedProfile?.keywords?.length || 0);
        
        // Use saved keywords/topics if not provided
        if (!config.monitoring_topics || config.monitoring_topics.length === 0) {
          config.monitoring_topics = savedProfile?.keywords || savedProfile?.topics || [];
        }
      }
      
      // Also retrieve recent intelligence to extract trending topics
      const intelligenceResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'retrieve',
          organization_name: orgName,
          limit: 50,
          since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
      
      if (intelligenceResponse.ok) {
        const result = await intelligenceResponse.json();
        savedIntelligence = result.data || [];
        console.log(`✅ Retrieved ${savedIntelligence.length} recent intelligence items for trend analysis`);
      }
    } catch (e) {
      console.error('Could not retrieve saved data:', e);
    }
    
    const trendsResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-stage-4-trends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        organization: safeOrganization,
        monitoring_topics: config.monitoring_topics || savedProfile?.keywords || [],
        recent_intelligence: savedIntelligence
      })
    });

    if (!trendsResponse.ok) {
      throw new Error(`Trends analysis failed: ${trendsResponse.status}`);
    }

    const trendsData = await trendsResponse.json();
    
    const returnData = {
      success: true,
      trending_topics: trendsData.data?.trends || [],
      conversation_gaps: trendsData.data?.gaps || [],
      analysis: {
        trends_identified: trendsData.data?.trends?.length || 0,
        gaps_found: trendsData.data?.gaps?.length || 0
      },
      tabs: this.generateTrendsTabs(trendsData.data),
      data: trendsData.data
    };
    
    // SAVE RESULTS TO SUPABASE - SINGLE SOURCE OF TRUTH
    try {
      await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'saveStageData',
          organization_name: orgName,
          stage: 'trends',
          stage_data: returnData.data
        })
      });
      console.log('✅ Saved trends stage data to Supabase');
    } catch (error) {
      console.error('❌ Failed to save trends stage data:', error);
    }
    
    return returnData;
  }

  /**
   * Stage 6: Strategic Synthesis & Pattern Recognition
   */
  async runSynthesisStage(organization, config, previousStageResults) {
    console.log('🧠 Stage 6: Strategic Synthesis & Pattern Recognition');
    console.log('📊 Previous stage results structure:', {
      hasResults: !!previousStageResults,
      stageCount: Object.keys(previousStageResults || {}).length,
      stages: Object.keys(previousStageResults || {}),
      sampleStage: previousStageResults ? Object.keys(previousStageResults)[0] : null
    });
    
    // Ensure organization has a name
    const orgName = organization?.name || config?.organization?.name || 'Default Organization';
    const safeOrganization = {
      ...organization,
      name: orgName
    };
    
    // IMPORTANT: Retrieve saved intelligence from database
    console.log('📊 Retrieving saved intelligence from database...');
    let savedIntelligence = null;
    try {
      const persistResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'retrieve',
          organization_name: organization.name,
          limit: 200,
          since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        })
      });
      
      if (persistResponse.ok) {
        const result = await persistResponse.json();
        savedIntelligence = result.data;
        console.log(`✅ Retrieved ${result.count} saved intelligence items`);
      }
    } catch (e) {
      console.error('Could not retrieve saved intelligence:', e);
    }
    
    // Transform stage results to the format expected by synthesis Edge Function
    const transformedResults = {};
    if (previousStageResults) {
      // Map our stage keys to what the synthesis function expects, using .data property
      if (previousStageResults.competitive?.data) {
        transformedResults.competitors = previousStageResults.competitive.data;
      }
      if (previousStageResults.media?.data) {
        transformedResults.media = previousStageResults.media.data;
      }
      if (previousStageResults.regulatory?.data) {
        transformedResults.regulatory = previousStageResults.regulatory.data;
      }
      if (previousStageResults.trends?.data) {
        transformedResults.trends = previousStageResults.trends.data;
      }
      if (previousStageResults.extraction?.data) {
        transformedResults.extraction = previousStageResults.extraction.data;
      }
    }
    
    console.log('📊 Transformed results for synthesis:', {
      originalKeys: Object.keys(previousStageResults || {}),
      transformedKeys: Object.keys(transformedResults),
      hasCompetitors: !!transformedResults.competitors,
      hasMedia: !!transformedResults.media
    });
    
    // Build entity actions from all stage results
    const entityActions = [];
    const topicTrends = [];
    
    // Add competitor actions
    if (transformedResults.competitors?.competitors) {
      ['direct', 'indirect', 'emerging'].forEach(type => {
        if (transformedResults.competitors.competitors[type]) {
          transformedResults.competitors.competitors[type].forEach(comp => {
            entityActions.push({
              entity: comp.name,
              type: 'competitor',
              action: comp.recent_activity || `${type} competitive activity`,
              impact: comp.threat_level || 'medium',
              relevance: 0.8,
              source: 'competitive intelligence',
              timestamp: new Date().toISOString()
            });
          });
        }
      });
    }
    
    // Add trending topics from trends stage
    if (transformedResults.trends?.trending_topics) {
      transformedResults.trends.trending_topics.forEach(topic => {
        topicTrends.push({
          topic: topic.topic || topic.name || topic,
          trend: 'rising',
          mentions: 10,
          sentiment: 'neutral'
        });
      });
    }
    
    // Use the V4 synthesis function for clean, structured intelligence
    const synthesisResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-synthesis-v4`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        organization: safeOrganization,
        intelligence: {
          entity_actions: { all: entityActions },
          topic_trends: { all: topicTrends }
        }
      })
    });

    if (!synthesisResponse.ok) {
      const errorText = await synthesisResponse.text();
      console.error('❌ Synthesis V4 Edge Function failed:', {
        status: synthesisResponse.status,
        statusText: synthesisResponse.statusText,
        url: synthesisResponse.url,
        error: errorText,
        requestBody: {
          organizationName: orgName,
          entityActionsCount: entityActions.length,
          topicTrendsCount: topicTrends.length
        }
      });
      throw new Error(`Synthesis V4 failed: ${synthesisResponse.status} ${synthesisResponse.statusText} - ${errorText}`);
    }

    const synthesisData = await synthesisResponse.json();
    
    // Generate comprehensive opportunities using the opportunity orchestrator
    const opportunities = await this.generateComprehensiveOpportunities(synthesisData.data, organization);
    
    const returnData = {
      success: true,
      patterns: synthesisData.data?.patterns || [],
      elite_insights: synthesisData.data?.insights || {},
      opportunities,
      analysis: synthesisData.data?.analysis || {},
      tabs: synthesisData.data?.tabs || this.generateSynthesisTabs(synthesisData.data),
      data: synthesisData.data
    };
    
    // SAVE RESULTS TO SUPABASE - SINGLE SOURCE OF TRUTH
    try {
      await fetch(`${this.supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'saveStageData',
          organization_name: orgName,
          stage: 'synthesis',
          stage_data: returnData.data
        })
      });
      console.log('✅ Saved synthesis stage data to Supabase');
    } catch (error) {
      console.error('❌ Failed to save synthesis stage data:', error);
    }
    
    return returnData;
  }

  /**
   * Generate opportunities for individual stage using opportunity engine
   */
  async generateStageOpportunities(stageResult, organization, stageConfig) {
    console.log(`🔍 Generating opportunities for ${stageConfig.stageName}`);
    
    try {
      const opportunityResponse = await fetch(`${this.supabaseUrl}/functions/v1/opportunity-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          organization,
          stageData: stageResult,
          stageConfig,
          mode: 'stage-specific'
        })
      });

      if (opportunityResponse.ok) {
        const opportunityData = await opportunityResponse.json();
        return opportunityData.opportunities || [];
      } else {
        const errorText = await opportunityResponse.text();
        console.error('❌ Stage Opportunity Engine failed:', {
          status: opportunityResponse.status,
          statusText: opportunityResponse.statusText,
          url: opportunityResponse.url,
          error: errorText,
          stage: stageConfig?.stageName,
          organizationName: organization?.name
        });
        
        if (opportunityResponse.status === 503) {
          console.warn('⚠️ Opportunity Engine temporarily unavailable (503), continuing without stage opportunities');
        }
      }
    } catch (error) {
      console.error('Stage opportunity generation error:', error);
    }
    
    return [];
  }

  /**
   * Generate comprehensive opportunities using full synthesis data
   */
  async generateComprehensiveOpportunities(synthesisData, organization) {
    console.log('🎯 Generating comprehensive opportunities via Opportunity Engine');
    
    try {
      const opportunityResponse = await fetch(`${this.supabaseUrl}/functions/v1/opportunity-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          organization,
          synthesisData,
          mode: 'comprehensive'
        })
      });

      if (opportunityResponse.ok) {
        const opportunityData = await opportunityResponse.json();
        console.log(`✅ Generated ${opportunityData.opportunities?.length || 0} comprehensive opportunities`);
        return opportunityData.opportunities || [];
      } else {
        const errorText = await opportunityResponse.text();
        console.error('❌ Comprehensive Opportunity Engine failed:', {
          status: opportunityResponse.status,
          statusText: opportunityResponse.statusText,
          url: opportunityResponse.url,
          error: errorText,
          organizationName: organization?.name
        });
        
        if (opportunityResponse.status === 503) {
          console.warn('⚠️ Comprehensive Opportunity Engine temporarily unavailable (503), continuing without opportunities');
        }
      }
    } catch (error) {
      console.error('Comprehensive opportunity generation error:', error);
    }
    
    return [];
  }

  /**
   * Fallback: Run comprehensive analysis (original V4 behavior)
   */
  async runComprehensiveAnalysis(organization, config) {
    console.log('📊 Running comprehensive analysis (V4 fallback)');
    
    try {
      // PHASE 1: FAST COLLECTION (30s limit)
      console.log('📡 Phase 1: Fast Intelligence Collection');
      
      const collectionResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-collection-v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({ 
          organization,
          entities: {
            competitors: config.competitors || organization.competitors || [],
            regulators: config.regulators || organization.regulators || [],
            activists: config.activists || organization.activists || [],
            media_outlets: config.media_outlets || organization.media_outlets || [],
            investors: config.investors || organization.investors || [],
            analysts: config.analysts || organization.analysts || []
          }
        })
      });

      if (!collectionResponse.ok) {
        throw new Error(`Collection failed: ${collectionResponse.status}`);
      }

      const collectionData = await collectionResponse.json();
      console.log('✅ Collection complete:', {
        signals: collectionData.intelligence?.raw_signals?.length || 0,
        sources: collectionData.intelligence?.metadata?.sources || []
      });

      // PHASE 2: DEEP ANALYSIS - Direct to Edge Function synthesis
      console.log('🧠 Phase 2: Deep Analysis via Edge Function');
      const analysisResult = await this.callEdgeSynthesis(collectionData.intelligence, organization);

      // PHASE 3: FORMAT FOR DISPLAY
      const formattedResult = this.formatForDisplay(analysisResult, collectionData);
      
      return {
        success: true,
        ...formattedResult,
        metadata: {
          organization: organization.name,
          timestamp: new Date().toISOString(),
          pipeline_version: 'v4-comprehensive',
          analysis_type: analysisResult.analysis_type || 'synthesis'
        }
      };

    } catch (error) {
      console.error('❌ V4 Comprehensive Analysis error:', error);
      
      return {
        success: false,
        error: error.message,
        analysis: this.getEmptyAnalysis()
      };
    }
  }

  // MCP analysis removed - using Edge Functions only for Vercel deployment

  async callEdgeSynthesis(intelligence, organization) {
    // Transform raw signals into format expected by synthesis
    // Since raw signals don't have entity field, we'll create entity actions from all signals
    const transformedIntelligence = {
      entity_actions: {
        all: (intelligence.raw_signals || []).map(signal => ({
          entity: signal.entity || signal.source || 'Industry',
          type: signal.entity_type || signal.type || 'general',
          action: signal.title || 'No title',
          description: signal.content || signal.description || '',
          source: signal.source || 'Unknown',
          url: signal.url || signal.raw?.url || '',
          timestamp: signal.published || new Date().toISOString(),
          impact: 'medium',
          relevance: 0.7
        }))
      },
      topic_trends: {
        all: this.extractTopicTrends(intelligence.raw_signals || [])
      }
    };

    const synthesisResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-synthesis-v4`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        intelligence: transformedIntelligence,
        organization
      })
    });

    if (!synthesisResponse.ok) {
      throw new Error(`Synthesis failed: ${synthesisResponse.status}`);
    }

    const synthesisData = await synthesisResponse.json();
    return {
      ...synthesisData,
      analysis_type: 'edge-synthesis'
    };
  }

  extractTopicTrends(signals) {
    const topicCounts = new Map();
    const trendKeywords = ['AI', 'sustainability', 'privacy', 'security', 'innovation', 'growth'];
    
    if (signals && signals.length > 0) {
      signals.forEach(signal => {
        const text = ((signal.title || '') + ' ' + (signal.content || '')).toLowerCase();
        trendKeywords.forEach(keyword => {
          if (text.includes(keyword.toLowerCase())) {
            const count = topicCounts.get(keyword) || 0;
            topicCounts.set(keyword, count + 1);
          }
        });
      });
    }

    return Array.from(topicCounts.entries()).map(([topic, count]) => ({
      topic,
      trend: count > 3 ? 'increasing' : 'stable',
      mentions: count,
      sources: [...new Set((signals || []).filter(s => 
        ((s.title || '') + ' ' + (s.content || '')).toLowerCase().includes(topic.toLowerCase())
      ).map(s => s.source || 'Unknown'))]
    }));
  }

  formatForDisplay(analysisResult, collectionData) {
    // If we have MCP deep analysis, use that structure
    if (analysisResult.analysis_type === 'mcp-deep') {
      return {
        analysis: analysisResult,
        raw_count: collectionData.intelligence?.raw_signals?.length || 0
      };
    }

    // Otherwise format synthesis result for elite display
    return {
      analysis: {
        signal_analysis: this.extractSignalAnalysis(analysisResult),
        pattern_recognition: this.extractPatterns(analysisResult),
        stakeholder_impact: this.extractStakeholderImpact(analysisResult),
        strategic_implications: this.extractStrategicImplications(analysisResult),
        response_strategy: this.extractResponseStrategy(analysisResult),
        elite_insights: this.extractEliteInsights(analysisResult)
      },
      tabs: analysisResult.tabs,
      opportunities: analysisResult.opportunities,
      raw_count: collectionData.intelligence?.raw_signals?.length || 0
    };
  }

  extractSignalAnalysis(result) {
    const signals = [];
    
    if (result.tabs?.executive?.immediate_actions) {
      result.tabs.executive.immediate_actions.forEach(action => {
        signals.push({
          signal: action,
          what_happened: action,
          so_what: 'Requires strategic response',
          now_what: 'Develop action plan',
          magnitude: 'high',
          velocity: 'fast',
          credibility: 85,
          relevance: 90
        });
      });
    }

    return signals;
  }

  extractPatterns(result) {
    const patterns = [];
    
    if (result.tabs?.competitive?.competitor_actions?.length > 2) {
      patterns.push({
        type: 'competitive_acceleration',
        signals_connected: result.tabs.competitive.competitor_actions.map(a => a.action),
        insight: 'Multiple competitors moving simultaneously',
        confidence: 85,
        implications: ['Market inflection point', 'Window for differentiation closing']
      });
    }

    if (result.tabs?.market?.market_trends?.length > 0) {
      patterns.push({
        type: 'narrative_shift',
        signals_connected: result.tabs.market.market_trends.map(t => t.topic),
        insight: 'Market narrative evolving',
        confidence: 75,
        implications: ['Opportunity to lead conversation', 'Risk of being left behind']
      });
    }

    return patterns;
  }

  extractStakeholderImpact(result) {
    return {
      customers: {
        perception_shift: result.tabs?.executive?.competitive_highlight || 'Monitoring competition',
        concern_level: 'medium',
        likely_questions: ['How does this affect us?'],
        messaging_needs: ['Reassurance', 'Differentiation'],
        proof_points_required: ['Success stories', 'Roadmap']
      },
      media: {
        perception_shift: result.tabs?.media?.sentiment_trend || 'Following story',
        concern_level: 'medium',
        likely_questions: ['What\'s your response?'],
        messaging_needs: ['Clear position', 'Thought leadership'],
        proof_points_required: ['Data', 'Expert commentary']
      },
      investors: {
        perception_shift: 'Evaluating impact',
        concern_level: 'low',
        likely_questions: ['How does this affect growth?'],
        messaging_needs: ['Strategic vision', 'Financial stability'],
        proof_points_required: ['Metrics', 'Projections']
      }
    };
  }

  extractStrategicImplications(result) {
    return {
      reputation: {
        current_state: result.tabs?.executive?.headline || 'Stable',
        trajectory: 'stable',
        intervention_required: result.tabs?.executive?.immediate_actions?.length > 0 ? 'respond' : 'monitor',
        key_vulnerabilities: result.tabs?.competitive?.competitive_gaps || []
      },
      competitive_position: {
        relative_strength: 'challenger',
        momentum: 'maintaining',
        defendable_advantages: ['Market presence', 'Customer trust'],
        exposed_flanks: result.tabs?.competitive?.competitive_gaps?.map(g => g.gap) || []
      },
      market_narrative: {
        we_control: ['Our story', 'Customer success'],
        they_control: result.tabs?.competitive?.competitor_actions?.map(a => a.entity) || [],
        contested_ground: ['Market leadership', 'Innovation'],
        narrative_opportunities: result.tabs?.market?.opportunities || []
      }
    };
  }

  extractResponseStrategy(result) {
    const hasUrgentActions = result.tabs?.executive?.immediate_actions?.length > 0;
    
    return {
      immediate_24h: {
        priority: hasUrgentActions ? 'high' : 'medium',
        actions: result.tabs?.executive?.immediate_actions || ['Monitor situation'],
        messaging: result.tabs?.competitive?.key_messages || ['Stay on message'],
        channels: ['Internal', 'Social monitoring'],
        success_metrics: ['Response time', 'Message consistency']
      },
      short_term_7d: {
        priority: 'medium',
        actions: ['Develop comprehensive response', 'Media outreach'],
        messaging: result.tabs?.competitive?.pr_strategy ? [result.tabs.competitive.pr_strategy] : [],
        channels: ['Press release', 'Blog'],
        success_metrics: ['Media coverage', 'Sentiment']
      }
    };
  }

  extractEliteInsights(result) {
    const insights = {
      hidden_connections: [],
      non_obvious_risks: [],
      asymmetric_opportunities: [],
      narrative_leverage_points: [],
      strategic_blindspots: []
    };

    // Extract non-obvious insights from the data
    if (result.tabs?.competitive?.competitor_actions?.length > 3) {
      insights.hidden_connections.push('Coordinated competitive movement suggests industry shift');
    }

    if (result.tabs?.market?.market_trends?.some(t => t.trend === 'increasing')) {
      insights.asymmetric_opportunities.push('First-mover advantage on emerging trends');
    }

    if (result.tabs?.forward?.predictions?.length > 0) {
      insights.narrative_leverage_points.push(...result.tabs.forward.predictions.map(p => p.trigger));
    }

    return insights;
  }

  getEmptyAnalysis() {
    return {
      signal_analysis: [],
      pattern_recognition: [],
      stakeholder_impact: {
        customers: this.getEmptyStakeholderImpact(),
        media: this.getEmptyStakeholderImpact(),
        investors: this.getEmptyStakeholderImpact()
      },
      strategic_implications: {
        reputation: { current_state: 'Unknown', trajectory: 'stable', intervention_required: 'monitor', key_vulnerabilities: [] },
        competitive_position: { relative_strength: 'unknown', momentum: 'maintaining', defendable_advantages: [], exposed_flanks: [] },
        market_narrative: { we_control: [], they_control: [], contested_ground: [], narrative_opportunities: [] }
      },
      response_strategy: {
        immediate_24h: { priority: 'low', actions: [], messaging: [], channels: [], success_metrics: [] },
        short_term_7d: { priority: 'low', actions: [], messaging: [], channels: [], success_metrics: [] }
      },
      elite_insights: {
        hidden_connections: [],
        non_obvious_risks: [],
        asymmetric_opportunities: [],
        narrative_leverage_points: [],
        strategic_blindspots: []
      }
    };
  }

  getEmptyStakeholderImpact() {
    return {
      perception_shift: 'No data',
      concern_level: 'low',
      likely_questions: [],
      messaging_needs: [],
      proof_points_required: []
    };
  }

  // Stage-specific tab generation methods

  generateExtractionTabs(organization, collectionData) {
    return {
      executive: {
        headline: `Organization Data Extracted: ${organization.name}`,
        overview: `Collected ${organization.signals_collected} signals from ${organization.data_sources?.length || 0} sources`,
        competitive_highlight: `${organization.stakeholder_mapping?.competitors?.length || 0} competitors mapped`,
        market_highlight: `${organization.stakeholder_mapping?.media_outlets?.length || 0} media outlets identified`,
        immediate_actions: ['Review stakeholder mapping', 'Validate data sources', 'Configure monitoring']
      },
      organizational: {
        profile: organization,
        stakeholders: organization.stakeholder_mapping || {},
        data_quality: {
          signals_collected: organization.signals_collected,
          sources_active: organization.data_sources?.length || 0,
          coverage_assessment: 'Comprehensive'
        }
      }
    };
  }

  generateCompetitiveTabs(competitorData) {
    // Handle the actual structure from intelligence-stage-1-competitors Edge Function
    const allCompetitors = [
      ...(competitorData?.competitors?.direct || []),
      ...(competitorData?.competitors?.indirect || []),
      ...(competitorData?.competitors?.emerging || [])
    ];

    return {
      executive: {
        headline: `Competitive Analysis: ${allCompetitors.length} competitors analyzed`,
        competitive_highlight: competitorData?.competitive_landscape?.market_dynamics?.competition_intensity 
          ? `Competition intensity: ${competitorData.competitive_landscape.market_dynamics.competition_intensity}` 
          : 'Analysis complete',
        immediate_actions: this.extractCompetitiveActions(competitorData)
      },
      competitive: {
        competitor_actions: allCompetitors.map(c => ({
          entity: c.name,
          action: c.recent_actions?.[0]?.description || 'Monitoring',
          impact: c.threat_level || 'medium'
        })),
        competitive_landscape: competitorData?.competitive_landscape || {},
        threat_assessment: {
          direct_threats: competitorData?.competitors?.direct?.length || 0,
          indirect_threats: competitorData?.competitors?.indirect?.length || 0,
          emerging_threats: competitorData?.competitors?.emerging?.length || 0
        }
      }
    };
  }

  generateMediaTabs(mediaData) {
    return {
      executive: {
        headline: `Media Mapping: ${mediaData?.journalists?.length || 0} journalists identified`,
        media_highlight: mediaData?.coverage_summary || 'Media landscape mapped',
        immediate_actions: this.extractMediaActions(mediaData)
      },
      media: {
        media_coverage: mediaData?.coverage || [],
        journalists: mediaData?.journalists || [],
        outlets: mediaData?.outlets || [],
        narrative_opportunities: mediaData?.opportunities || []
      }
    };
  }

  generateRegulatoryTabs(regulatoryData) {
    return {
      executive: {
        headline: `Regulatory Environment: ${regulatoryData?.regulators?.length || 0} bodies tracked`,
        regulatory_highlight: regulatoryData?.summary || 'Environment stable',
        immediate_actions: this.extractRegulatoryActions(regulatoryData)
      },
      regulatory: {
        regulatory_developments: regulatoryData?.developments || [],
        compliance_requirements: regulatoryData?.compliance || [],
        stakeholder_sentiment: regulatoryData?.sentiment || {}
      }
    };
  }

  generateTrendsTabs(trendsData) {
    return {
      executive: {
        headline: `Market Trends: ${trendsData?.trends?.length || 0} trends identified`,
        market_highlight: trendsData?.summary || 'Trends analyzed',
        immediate_actions: this.extractTrendsActions(trendsData)
      },
      market: {
        market_trends: trendsData?.trends || [],
        conversation_gaps: trendsData?.gaps || [],
        opportunities: trendsData?.opportunities || []
      }
    };
  }

  generateSynthesisTabs(synthesisData) {
    return {
      executive: {
        headline: `Strategic Synthesis Complete: ${synthesisData?.patterns?.length || 0} patterns identified`,
        overview: synthesisData?.summary || 'Comprehensive analysis complete',
        immediate_actions: this.extractSynthesisActions(synthesisData)
      },
      synthesis: {
        patterns: synthesisData?.patterns || [],
        insights: synthesisData?.insights || {},
        strategic_implications: synthesisData?.implications || {},
        recommendations: synthesisData?.recommendations || []
      }
    };
  }

  // Action extraction helpers for each stage
  
  extractCompetitiveActions(competitorData) {
    const actions = [];
    
    // Handle the actual structure from intelligence-stage-1-competitors Edge Function
    if (competitorData?.competitors) {
      const allCompetitors = [
        ...(competitorData.competitors.direct || []),
        ...(competitorData.competitors.indirect || []),
        ...(competitorData.competitors.emerging || [])
      ];
      
      allCompetitors.forEach(competitor => {
        if (competitor.threat_level === 'high') {
          actions.push(`Respond to ${competitor.name} threat`);
        }
      });
    }
    return actions.slice(0, 3);
  }

  extractMediaActions(mediaData) {
    const actions = [];
    if (mediaData?.opportunities) {
      mediaData.opportunities.forEach(opp => {
        if (opp.priority === 'high') {
          actions.push(`Pursue ${opp.title}`);
        }
      });
    }
    return actions.slice(0, 3);
  }

  extractRegulatoryActions(regulatoryData) {
    const actions = [];
    if (regulatoryData?.developments) {
      regulatoryData.developments.forEach(dev => {
        if (dev.urgency === 'high') {
          actions.push(`Address ${dev.requirement}`);
        }
      });
    }
    return actions.slice(0, 3);
  }

  extractTrendsActions(trendsData) {
    const actions = [];
    if (trendsData?.opportunities) {
      trendsData.opportunities.forEach(opp => {
        if (opp.type === 'thought_leadership') {
          actions.push(`Lead on ${opp.topic}`);
        }
      });
    }
    return actions.slice(0, 3);
  }

  extractSynthesisActions(synthesisData) {
    const actions = [];
    if (synthesisData?.recommendations) {
      synthesisData.recommendations.forEach(rec => {
        if (rec.priority === 'immediate') {
          actions.push(rec.title);
        }
      });
    }
    return actions.slice(0, 5);
  }

}

const orchestratorInstance = new IntelligenceOrchestratorV4();
export default orchestratorInstance;