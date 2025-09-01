import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './MultiStageIntelligence.css';
import intelligenceOrchestratorV4 from '../services/intelligenceOrchestratorV4';
import supabaseDataService from '../services/supabaseDataService';
import { 
  renderExecutiveSummaryEnhanced,
  renderCompetitiveAnalysisEnhanced,
  renderMarketAnalysisEnhanced,
  renderRegulatoryAnalysisEnhanced,
  renderMediaAnalysisEnhanced,
  renderForwardLookingEnhanced
} from './MultiStageIntelligenceEnhanced';

/**
 * Multi-Stage Intelligence Analysis - ELABORATE PIPELINE
 * Deep, thorough analysis that takes 2-3 minutes for complete intelligence gathering
 * 
 * ARCHITECTURE:
 * 1. Organization Data Extraction → saves comprehensive organization profile
 * 2. Competitive Intelligence Analysis → dedicated deep-dive into competitors 
 * 3. Media Landscape Mapping → journalists, outlets, coverage analysis
 * 4. Regulatory & Stakeholder Environment → compliance, analysts, investors
 * 5. Market Trends & Topic Analysis → trending narratives, conversation gaps
 * 6. Strategic Synthesis → pattern recognition, hidden connections, actionable insights
 * 
 * Each stage builds on previous data and performs specialized analysis
 * Quality over speed - designed for comprehensive strategic intelligence
 */

// Define the elaborate 6-stage intelligence pipeline
const INTELLIGENCE_STAGES = [
  {
    id: 'extraction',
    name: 'Organization Data Extraction',
    description: 'Extracting comprehensive organization profile and stakeholder data...',
    duration: 30,
    focus: 'Data gathering and organization profiling'
  },
  {
    id: 'competitive',
    name: 'Competitive Intelligence Analysis',
    description: 'Conducting deep competitor analysis and threat assessment...',
    duration: 45,
    focus: 'Competitor actions, market positioning, competitive threats'
  },
  {
    id: 'media',
    name: 'Media Landscape Mapping',
    description: 'Mapping journalist networks and media coverage patterns...',
    duration: 40,
    focus: 'Media relations, coverage analysis, journalist identification'
  },
  {
    id: 'regulatory',
    name: 'Regulatory & Stakeholder Environment',
    description: 'Analyzing regulatory developments and stakeholder sentiment...',
    duration: 35,
    focus: 'Compliance requirements, analyst opinions, investor relations'
  },
  {
    id: 'trends',
    name: 'Market Trends & Topic Analysis',
    description: 'Identifying trending narratives and conversation opportunities...',
    duration: 30,
    focus: 'Market trends, topic analysis, narrative gaps'
  },
  {
    id: 'synthesis',
    name: 'Strategic Synthesis & Pattern Recognition',
    description: 'Connecting insights and identifying strategic opportunities...',
    duration: 50,
    focus: 'Pattern recognition, strategic implications, actionable recommendations'
  }
];

const MultiStageIntelligence = ({ organization: organizationProp, onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [stageResults, setStageResults] = useState({});
  const [organizationProfile, setOrganizationProfile] = useState(null);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [finalIntelligence, setFinalIntelligence] = useState(null);
  const [stageProgress, setStageProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('executive');
  const [hasStarted, setHasStarted] = useState(false);
  const completionRef = useRef(false);
  const runningRef = useRef(false); // Prevent multiple simultaneous runs
  
  // Initialize organization state - ALWAYS from prop or will be loaded from edge function
  const [organization, setOrganization] = useState(organizationProp || null);
  const [loadingOrg, setLoadingOrg] = useState(!organizationProp);

  // Load organization and existing data from edge function - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    // Add guard to prevent re-running
    if (hasStarted) {
      console.log('⚠️ Already started, skipping data load');
      return;
    }
    
    const loadFromEdgeFunction = async () => {
      // If no organization prop, load from edge function
      if (!organization) {
        setLoadingOrg(true);
        console.log('🔍 Loading organization from edge function (single source of truth)...');
        
        try {
          // CRITICAL: Check localStorage FIRST for the organization name
          const savedOrgData = localStorage.getItem('organizationData');
          const savedOrgName = localStorage.getItem('selectedOrganization');
          
          let orgName = organizationProp?.name || savedOrgName || 'Default Organization';
          
          // If we have saved data in localStorage, use it directly
          if (savedOrgData) {
            try {
              const parsedOrg = JSON.parse(savedOrgData);
              if (parsedOrg.name) {
                console.log('📱 Using organization from localStorage:', parsedOrg.name);
                setOrganization(parsedOrg);
                setLoadingOrg(false);
                return; // Exit early, we have what we need
              }
            } catch (e) {
              console.warn('Could not parse localStorage org data');
            }
          }
          
          // Otherwise continue with edge function lookup
          if (orgName) {
            console.log(`📊 Loading organization profile for: ${orgName}`);
            const response = await fetch(
              `${supabaseDataService.supabaseUrl}/functions/v1/intelligence-persistence`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseDataService.supabaseKey}`
                },
                body: JSON.stringify({
                  action: 'getProfile',
                  organization_name: orgName  // Pass the specific org name
                })
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.profile) {
                console.log('✅ Loaded organization from edge function:', data.profile);
                // Ensure the organization has a name
                const org = data.profile.organization || data.profile;
                if (!org.name && orgName) {
                  org.name = orgName;
                }
                setOrganization(org);
              } else {
                console.log('⚠️ No organization profile found, creating basic structure');
                // Create a basic organization structure with the name
                setOrganization({
                  name: orgName,
                  industry: 'Technology',
                  competitors: [],
                  stakeholders: {}
                });
              }
            } else {
              console.log('⚠️ Failed to load profile, creating basic structure');
              // Create a basic organization structure with the name
              setOrganization({
                name: orgName,
                  industry: 'Technology',
                  competitors: [],
                  stakeholders: {}
              });
            }
          } else {
            console.log('⚠️ No organization name provided, creating default');
            // If no orgName, create a default organization
            setOrganization({
              name: 'Default Organization',
              industry: 'Technology',
              competitors: [],
              stakeholders: {}
            });
          }
        } catch (error) {
          console.error('❌ Failed to load from edge function:', error);
          // On error, ensure we have a valid organization structure
          const orgName = organizationProp?.name || 'Default Organization';
          setOrganization({
            name: orgName,
            industry: 'Technology',
            competitors: [],
            stakeholders: {}
          });
        } finally {
          setLoadingOrg(false);
        }
      }
      
      // DISABLED: Don't load existing analysis - always run fresh
      if (organization?.name) {
        console.log(`🚀 Organization loaded: ${organization.name} - Running FRESH pipeline`);
        
        // Clear any existing state to ensure fresh run
        setStageResults({});
        setIsComplete(false);
        completionRef.current = false;
        runningRef.current = false;
        
        // Optional: Clear old data from Supabase
        // await supabaseDataService.clearAnalysis(organization.name);
        
        console.log('📝 Ready to run COMPLETE fresh analysis pipeline - no cache loading');
      }
    };
    
    loadFromEdgeFunction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]); // Re-run if organization changes

  // Run individual stage with specialized analysis
  const runStage = useCallback(async (stageIndex) => {
    const stage = INTELLIGENCE_STAGES[stageIndex];
    
    // Check if this stage is already running or complete
    if (stageResults[stage.id] && (stageResults[stage.id].inProgress || stageResults[stage.id].completed)) {
      console.log(`⚠️ Stage ${stageIndex + 1} already processed, skipping`);
      setCurrentStage(stageIndex + 1);
      return;
    }
    
    console.log(`🔄 Starting stage ${stageIndex + 1}: ${stage.name}`);
    setStageProgress(0);
    
    try {
      // Mark stage as in-progress immediately
      setStageResults(prev => ({
        ...prev,
        [stage.id]: { inProgress: true }
      }));
      
      // Create stage-specific configuration
      const stageConfig = createStageConfig(stageIndex, organizationProfile || organization);
      
      // Linear progress over ~25 seconds per stage (2.5 mins / 6 stages)
      const progressTimer = setInterval(() => {
        setStageProgress(prev => Math.min(90, prev + 3.6)); // ~90% in 25 seconds
      }, 1000);
      
      // Run specialized analysis through orchestrator
      const result = await intelligenceOrchestratorV4.orchestrate(stageConfig);
      
      clearInterval(progressTimer);
      setStageProgress(100);
      
      if (result.success) {
        // Stage complete
        console.log(`✅ Stage ${stageIndex + 1} (${stage.id}) completed with:`, {
          hasData: !!result.data,
          hasTabs: !!result.tabs,
          hasAnalysis: !!result.analysis,
          hasOpportunities: !!result.opportunities,
          opportunityCount: result.opportunities?.length || 0,
          hasConsolidatedOps: !!result.data?.consolidated_opportunities,
          consolidatedCount: result.data?.consolidated_opportunities?.prioritized_list?.length || 0,
          dataKeys: result.data ? Object.keys(result.data).slice(0, 5) : [],
          tabCount: result.tabs ? Object.keys(result.tabs).length : 0
        });
        
        // Special detailed logging for synthesis stage
        if (stage.id === 'synthesis') {
          console.log('🔬 SYNTHESIS STAGE DETAILED TABS:', {
            hasTabs: !!result.tabs,
            tabKeys: result.tabs ? Object.keys(result.tabs) : [],
            executiveTab: result.tabs?.executive ? {
              keys: Object.keys(result.tabs.executive),
              headline: result.tabs.executive.headline,
              overviewPreview: result.tabs.executive.overview?.substring(0, 100),
              hasNarrativeHealth: !!result.tabs.executive.narrative_health,
              hasKeyConnections: !!result.tabs.executive.key_connections,
              hasStatistics: !!result.tabs.executive.statistics,
              immediateActionsCount: result.tabs.executive.immediate_actions?.length || 0
            } : 'NO EXECUTIVE TAB',
            competitiveTab: result.tabs?.competitive ? Object.keys(result.tabs.competitive).slice(0, 5) : 'NO COMPETITIVE TAB',
            marketTab: result.tabs?.market ? Object.keys(result.tabs.market).slice(0, 5) : 'NO MARKET TAB'
          });
        }
        
        if (stage.id === 'synthesis') {
          console.log('🎯 SYNTHESIS STAGE OPPORTUNITIES CHECK:', {
            directOpportunities: result.opportunities,
            consolidatedPath: result.data?.consolidated_opportunities?.prioritized_list,
            analysisPath: result.analysis?.consolidated_opportunities?.prioritized_list,
            totalFound: (result.opportunities?.length || 0) + 
                       (result.data?.consolidated_opportunities?.prioritized_list?.length || 0)
          });
        }
        
        // STAGE 1: Extract and save organization profile
        if (stageIndex === 0 && result.organization) {
          setOrganizationProfile(result.organization);
          // Don't save to localStorage - let the edge functions handle persistence
        }
        
        // Store stage-specific results (replace inProgress marker)
        setStageResults(prev => {
          const updated = {
            ...prev,
            [stage.id]: {
              ...result,
              inProgress: false,
              completed: true,
              stageMetadata: {
                stageName: stage.name,
                focus: stage.focus,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString()
              }
            }
          };
          console.log(`📊 Stage ${stageIndex + 1} (${stage.id}) results stored. Total stages accumulated:`, Object.keys(updated).length);
          console.log('📋 Current accumulated stages:', Object.keys(updated));
          console.log('🔍 Stage data has:', {
            hasData: !!result.data,
            hasAnalysis: !!result.analysis,
            hasTabs: !!result.tabs
          });
          return updated;
        });
        
        // Progress to next stage
        setTimeout(() => {
          runningRef.current = false; // Clear running flag before next stage
          setCurrentStage(stageIndex + 1);
        }, 1000);
        
      } else {
        throw new Error(`Stage ${stageIndex + 1} failed: ${result.error}`);
      }
    } catch (err) {
      console.error(`Stage ${stageIndex + 1} error:`, err.message);
      setError(`Stage ${stageIndex + 1} (${stage.name}) failed: ${err.message}`);
      
      // Store error but continue to next stage after delay
      setStageResults(prev => ({
        ...prev,
        [stage.id]: { 
          error: err.message,
          inProgress: false,
          completed: true,
          failed: true,
          stageMetadata: { stageName: stage.name, focus: stage.focus }
        }
      }));
      
      setTimeout(() => {
        runningRef.current = false; // Clear running flag even on error
        setCurrentStage(stageIndex + 1);
      }, 2000);
    }
  }, [organization, organizationProfile, startTime]);

  // Create specialized configuration for each stage
  const createStageConfig = (stageIndex, baseOrganization) => {
    // CRITICAL FIX: Always ensure we have a proper organization name
    // The baseOrganization might be just a profile object without a name field
    const orgName = baseOrganization?.name || 
                    baseOrganization?.organization?.name || 
                    organizationProp?.name || 
                    organization?.name || 
                    'Default Organization';
    
    // Ensure organization always has a name
    const safeOrganization = {
      ...baseOrganization,
      name: orgName  // Force the name to always be present
    };
    
    // If the name is still "Default Organization", log a warning
    if (orgName === 'Default Organization') {
      console.warn('⚠️ Using default organization name - no real name found');
    }
    
    const baseConfig = {
      organization: safeOrganization,
      competitors: baseOrganization?.competitors || baseOrganization?.stakeholders?.competitors || [],
      regulators: baseOrganization?.regulators || baseOrganization?.stakeholders?.regulators || [],
      activists: baseOrganization?.activists || baseOrganization?.stakeholders?.activists || [],
      media_outlets: baseOrganization?.media_outlets || baseOrganization?.stakeholders?.media_outlets || [],
      investors: baseOrganization?.investors || baseOrganization?.stakeholders?.investors || [],
      analysts: baseOrganization?.analysts || baseOrganization?.stakeholders?.analysts || [],
      monitoring_topics: baseOrganization?.monitoring_topics || []
    };

    // Add stage-specific focus parameters
    const stage = INTELLIGENCE_STAGES[stageIndex];
    
    // Debug log to track stage results being passed
    console.log(`🎯 Creating config for Stage ${stageIndex + 1} (${stage.id}):`, {
      hasStageResults: Object.keys(stageResults).length > 0,
      stageResultsKeys: Object.keys(stageResults),
      stageResultsCount: Object.keys(stageResults).length
    });
    
    return {
      ...baseConfig,
      stageConfig: {
        stageId: stage.id,
        stageName: stage.name,
        focus: stage.focus,
        isElaboratePipeline: true,
        previousStageResults: Object.keys(stageResults).length > 0 ? stageResults : null
      }
    };
  };

  // Complete analysis and synthesize all stage results
  const handleComplete = useCallback(() => {
    // Prevent multiple calls using ref
    if (completionRef.current || isComplete) {
      console.log('⚠️ Pipeline already complete or completing, skipping');
      return;
    }
    
    // Set ref immediately to prevent any re-entry
    completionRef.current = true;
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`🎉 ELABORATE PIPELINE COMPLETE in ${totalTime} seconds`);
    console.log('📊 Final stage results:', Object.keys(stageResults));
    
    // Mark as complete to update UI
    setIsComplete(true);
    
    // Validate all stages completed
    const requiredStages = INTELLIGENCE_STAGES.map(s => s.id);
    const completedStages = Object.keys(stageResults);
    const hasAllStages = requiredStages.every(stage => completedStages.includes(stage));
    
    if (!hasAllStages) {
      console.warn('⚠️ Some stages incomplete, using available data:', {
        required: requiredStages,
        completed: completedStages,
        missing: requiredStages.filter(s => !completedStages.includes(s))
      });
      // Continue anyway with partial results instead of returning
    }

    // Synthesize elaborate intelligence from all stages (even if partial)
    const elaborateIntelligence = synthesizeElaborateResults(stageResults, organizationProfile || organization, totalTime);
    
    setFinalIntelligence(elaborateIntelligence);

    if (onComplete) {
      onComplete(elaborateIntelligence);
    }
  }, [startTime, stageResults, organization, organizationProfile, onComplete]);

  // Advanced synthesis of all stage results
  const synthesizeElaborateResults = (results, orgProfile, duration) => {
    console.log('🔄 ELABORATE SYNTHESIS: Combining insights from all stages...');
    console.log('📊 Stage results structure:', Object.keys(results).map(key => ({
      stage: key,
      hasData: !!results[key]?.data,
      hasAnalysis: !!results[key]?.analysis,
      hasTabs: !!results[key]?.tabs,
      dataKeys: results[key]?.data ? Object.keys(results[key].data).slice(0, 5) : [],
      isError: !!results[key]?.error
    })));
    
    // Get the most comprehensive result (usually synthesis stage)
    const primaryResult = results.synthesis || results.trends || results.regulatory || results.media || results.competitive || results.extraction;
    
    // Extract the actual data from Edge Function responses
    const extractedData = {};
    Object.entries(results).forEach(([stageId, stageResult]) => {
      // Different stages return data in different formats
      if (stageResult?.data) {
        extractedData[stageId] = stageResult.data;
      } else if (stageResult?.analysis) {
        // Most stages return analysis instead of data
        extractedData[stageId] = stageResult.analysis;
      } else if (stageResult?.intelligence) {
        // Extraction stage returns intelligence
        extractedData[stageId] = stageResult.intelligence;
      }
    });
    
    console.log('📈 Extracted data from stages:', Object.keys(extractedData));
    
    // Create comprehensive intelligence combining all stages
    // PRIORITIZE Claude synthesis analysis over opportunities
    const synthesisStage = results.synthesis || {};
    const claudeAnalysis = synthesisStage.data || synthesisStage.analysis || {};
    
    console.log('🧠 SYNTHESIS STAGE CONTENT:', {
      hasSynthesis: !!results.synthesis,
      synthesisKeys: Object.keys(synthesisStage),
      hasData: !!synthesisStage.data,
      dataKeys: synthesisStage.data ? Object.keys(synthesisStage.data).slice(0, 10) : [],
      hasAnalysis: !!synthesisStage.analysis,
      analysisKeys: synthesisStage.analysis ? Object.keys(synthesisStage.analysis).slice(0, 10) : [],
      hasTabs: !!synthesisStage.tabs,
      tabCount: synthesisStage.tabs ? Object.keys(synthesisStage.tabs).length : 0
    });
    
    const elaborateIntelligence = {
      success: true,
      // Prioritize Claude's synthesized analysis
      analysis: claudeAnalysis,
      // Get tabs from synthesis or generate from all data
      tabs: synthesisStage.tabs || primaryResult?.tabs || generateDefaultTabs(extractedData) || generateTabsFromStageData(results),
      // Remove opportunities - focus on analysis only
      opportunities: [],
      // Get insights from individual stages
      stageInsights: generateStageInsights(results),
      // Extract patterns identified by Claude
      patterns: claudeAnalysis.patterns || identifyPatternsAcrossStages(results),
      // Get Claude's recommendations
      recommendations: claudeAnalysis.recommendations || generateStrategicRecommendations(results),
      // Add raw stage data for debugging
      rawStageData: extractedData,
      metadata: {
        organization: orgProfile?.name || 'Unknown',
        pipeline: 'elaborate-multi-stage',
        version: 'v2.0',
        stages: INTELLIGENCE_STAGES.length,
        duration: duration,
        stagesCompleted: Object.keys(results),
        timestamp: new Date().toISOString(),
        comprehensiveAnalysis: true,
        hasClaudeAnalysis: !!claudeAnalysis && Object.keys(claudeAnalysis).length > 0
      }
    };
    
    
    return elaborateIntelligence;
  };

  // Generate default tabs for display
  const generateDefaultTabs = (extractedData) => {
    const tabs = {};
    
    // Create extraction tab (Stage 1)
    if (extractedData.extraction) {
      tabs.extraction = {
        title: 'Organization Profile',
        content: extractedData.extraction,
        hasData: true
      };
    }
    
    // Create competitive tab (Stage 2)
    if (extractedData.competitive) {
      tabs.competitive = {
        title: 'Competitive Analysis',
        content: extractedData.competitive,
        hasData: true
      };
    }
    
    // Create media tab (Stage 3)
    if (extractedData.media) {
      tabs.media = {
        title: 'Media Landscape',
        content: extractedData.media,
        hasData: true
      };
    }
    
    // Create regulatory tab (Stage 4)
    if (extractedData.regulatory) {
      tabs.regulatory = {
        title: 'Regulatory Analysis',
        content: extractedData.regulatory,
        hasData: true
      };
    }
    
    // Create trends tab
    if (extractedData.trends?.current_trends || extractedData.trends) {
      tabs.trends = {
        title: 'Market Trends',
        content: extractedData.trends,
        hasData: true
      };
    }
    
    // Create synthesis tab
    if (extractedData.synthesis) {
      tabs.synthesis = {
        title: 'Executive Summary',
        content: extractedData.synthesis,
        hasData: true
      };
    }
    
    console.log('📁 Generated tabs:', Object.keys(tabs));
    return tabs;
  };

  // Generate tabs directly from stage data if default tabs fail
  const generateTabsFromStageData = (results) => {
    const tabs = {};
    
    // Create executive summary from all stages
    const immediateActions = [];
    
    // Extract immediate actions from each stage - check both data and analysis fields
    const competitiveData = results.competitive?.data || results.competitive?.analysis;
    const synthesisData = results.synthesis?.data || results.synthesis?.analysis;
    
    if (competitiveData?.recommendations?.immediate_actions) {
      immediateActions.push(...competitiveData.recommendations.immediate_actions);
    }
    if (synthesisData?.action_matrix?.immediate) {
      immediateActions.push(...synthesisData.action_matrix.immediate);
    }
    
    tabs.executive = {
      headline: 'Multi-Stage Intelligence Analysis Complete',
      overview: `Analysis completed across ${Object.keys(results).length} intelligence dimensions`,
      competitive_highlight: results.competitive?.data?.competitors?.direct?.[0]?.name || 'No major competitors identified',
      market_highlight: results.trends?.data?.current_trends?.[0]?.trend || 'Market conditions stable',
      immediate_actions: immediateActions.slice(0, 5),
      statistics: {
        stages_completed: Object.keys(results).length,
        data_points_analyzed: Object.values(results).reduce((acc, r) => acc + (r.data ? 1 : 0), 0),
        entities_tracked: results.extraction?.data?.stakeholder_mapping ? 
          Object.values(results.extraction.data.stakeholder_mapping).flat().length : 0,
        actions_captured: immediateActions.length,
        topics_monitored: results.trends?.data?.current_trends?.length || 0
      }
    };
    
    // Process each stage result
    Object.entries(results).forEach(([stageId, stageResult]) => {
      // Check both data and analysis fields, also check tabs field
      const stageData = stageResult?.data || stageResult?.analysis || stageResult?.intelligence;
      const stageTabs = stageResult?.tabs;
      
      if ((stageData || stageTabs) && !stageResult.error) {
        // Use existing tabs if available
        if (stageTabs) {
          Object.assign(tabs, stageTabs);
        }
        
        // Also create tabs from data
        if (stageId === 'competitive' && stageData?.competitors) {
          tabs.competitive = {
            competitors: stageData.competitors,
            battle_cards: stageData.battle_cards,
            competitive_dynamics: stageData.competitive_dynamics,
            recommendations: stageData.recommendations,
            summary: `Analyzed ${stageData.competitors?.direct?.length || 0} direct competitors`
          };
        }
        
        if (stageId === 'media' && (stageData?.media_landscape || stageData?.journalists)) {
          tabs.media = {
            media_landscape: stageData.media_landscape,
            journalists: stageData.journalists,
            media_coverage: stageData.media_coverage,
            recommendations: stageData.recommendations,
            summary: stageData.media_landscape?.summary || 'Media landscape analyzed'
          };
        }
        
        if (stageId === 'regulatory' && stageData?.regulatory) {
          tabs.regulatory = {
            regulatory: stageData.regulatory,
            compliance_requirements: stageData.compliance_requirements,
            upcoming_changes: stageData.upcoming_changes,
            summary: 'Regulatory environment assessed'
          };
        }
        
        if (stageId === 'trends' && (stageData?.current_trends || stageData?.emerging_opportunities)) {
          tabs.market = {
            current_trends: stageData.current_trends,
            emerging_opportunities: stageData.emerging_opportunities,
            market_dynamics: stageData.market_dynamics,
            summary: `${stageData.current_trends?.length || 0} trends identified`
          };
        }
        
        // Add forward-looking tab
        if (stageId === 'synthesis' && stageData) {
          tabs.forward = {
            predictions: stageData.cascade_predictions,
            opportunities: stageData.strategic_recommendations,
            timeline: stageData.action_matrix,
            summary: 'Strategic forecast generated'
          };
        }
      }
    });
    
    // Ensure all tabs have some content
    if (!tabs.market) {
      tabs.market = { summary: 'Market analysis pending', current_trends: [] };
    }
    if (!tabs.regulatory) {
      tabs.regulatory = { summary: 'Regulatory analysis pending', regulatory: {} };
    }
    if (!tabs.media) {
      tabs.media = { summary: 'Media analysis pending', media_landscape: {} };
    }
    if (!tabs.forward) {
      tabs.forward = { summary: 'Strategic synthesis pending', predictions: [] };
    }
    
    console.log('📑 Generated tabs from stage data:', Object.keys(tabs));
    return tabs;
  };

  // Extract opportunities from all completed stages
  const extractOpportunitiesFromAllStages = (results) => {
    const allOpportunities = [];
    
    // REMOVED: No longer extracting opportunities
    return []; // Always return empty - we don't want opportunities
    
    Object.entries(results).forEach(([stageId, stageResult]) => {
      console.log(`📋 Checking stage '${stageId}' for opportunities:`, {
        hasDirectOps: !!stageResult.opportunities,
        directCount: stageResult.opportunities?.length || 0,
        hasDataField: !!stageResult.data,
        hasConsolidatedInData: !!stageResult.data?.consolidated_opportunities,
        consolidatedInDataCount: stageResult.data?.consolidated_opportunities?.prioritized_list?.length || 0,
        hasAnalysisField: !!stageResult.analysis,
        hasConsolidatedInAnalysis: !!stageResult.analysis?.consolidated_opportunities,
        consolidatedInAnalysisCount: stageResult.analysis?.consolidated_opportunities?.prioritized_list?.length || 0
      });
      // Check for opportunities in different possible locations
      
      // 1. Direct opportunities array
      if (stageResult.opportunities && Array.isArray(stageResult.opportunities)) {
        allOpportunities.push(...stageResult.opportunities.map(opp => ({
          ...opp,
          source: stageResult.stageMetadata?.stageName || 'Unknown Stage'
        })));
      }
      
      // 2. Synthesis stage: consolidated_opportunities.prioritized_list
      if (stageResult.data?.consolidated_opportunities?.prioritized_list) {
        const synthOps = stageResult.data.consolidated_opportunities.prioritized_list;
        allOpportunities.push(...synthOps.map(opp => ({
          title: opp.opportunity || opp.title,
          description: opp.quick_summary || opp.pr_angle || opp.description,
          urgency: opp.urgency,
          type: opp.type,
          confidence: opp.confidence,
          source: 'Strategic Synthesis'
        })));
      }
      
      // 3. Also check in analysis field
      if (stageResult.analysis?.consolidated_opportunities?.prioritized_list) {
        const analysisOps = stageResult.analysis.consolidated_opportunities.prioritized_list;
        allOpportunities.push(...analysisOps.map(opp => ({
          title: opp.opportunity || opp.title,
          description: opp.quick_summary || opp.pr_angle || opp.description,
          urgency: opp.urgency,
          type: opp.type,
          confidence: opp.confidence,
          source: 'Analysis Synthesis'
        })));
      }
    });
    
    console.log('📊 FINAL OPPORTUNITY EXTRACTION:', {
      totalOpportunities: allOpportunities.length,
      opportunitiesList: allOpportunities.slice(0, 3),
      sources: [...new Set(allOpportunities.map(o => o.source))]
    });
    return allOpportunities;
  };

  // Generate insights from each stage
  const generateStageInsights = (results) => {
    const insights = {};
    
    Object.entries(results).forEach(([stageId, result]) => {
      if (result.stageMetadata) {
        insights[stageId] = {
          stageName: result.stageMetadata.stageName,
          focus: result.stageMetadata.focus,
          keyFindings: extractKeyFindings(result),
          completedAt: result.stageMetadata.timestamp,
          success: !result.error
        };
      }
    });
    
    return insights;
  };

  // Extract key findings from stage result
  const extractKeyFindings = (stageResult) => {
    const findings = [];
    
    // Extract from tabs if available
    if (stageResult.tabs) {
      Object.entries(stageResult.tabs).forEach(([tabName, tabData]) => {
        if (tabData.immediate_actions?.length > 0) {
          findings.push(`${tabName}: ${tabData.immediate_actions.length} immediate actions identified`);
        }
      });
    }
    
    // Extract from opportunities
    if (stageResult.opportunities?.length > 0) {
      findings.push(`${stageResult.opportunities.length} strategic opportunities identified`);
    }
    
    return findings.slice(0, 3); // Top 3 findings per stage
  };

  // Identify patterns across multiple stages
  const identifyPatternsAcrossStages = (results) => {
    const patterns = [];
    
    // Pattern 1: Cross-stage analysis alignment (opportunity extraction removed)
    if (Object.keys(results).length > 3) {
      patterns.push({
        type: 'opportunity_convergence',
        description: 'Multiple stages identified aligned strategic opportunities',
        confidence: 85,
        implications: ['Strong signal for strategic focus', 'High-probability success area']
      });
    }
    
    // Pattern 2: Competitive pressure across stages
    const competitiveReferences = Object.values(results).filter(r => 
      r.tabs?.competitive?.competitor_actions?.length > 0 || 
      (r.analysis && JSON.stringify(r.analysis).toLowerCase().includes('competitor'))
    ).length;
    
    if (competitiveReferences > 2) {
      patterns.push({
        type: 'competitive_pressure',
        description: 'Competitive threats identified across multiple analysis areas',
        confidence: 90,
        implications: ['Requires immediate strategic response', 'Market dynamics shifting']
      });
    }
    
    return patterns;
  };

  // Generate strategic recommendations based on all stages
  const generateStrategicRecommendations = (results) => {
    const recommendations = [];
    
    // Immediate actions from all stages
    const immediateActions = [];
    Object.values(results).forEach(result => {
      if (result.tabs?.executive?.immediate_actions) {
        immediateActions.push(...result.tabs.executive.immediate_actions);
      }
    });
    
    if (immediateActions.length > 0) {
      recommendations.push({
        priority: 'immediate',
        category: 'tactical',
        title: 'Execute Critical Actions',
        description: `${immediateActions.length} immediate actions identified across analysis`,
        actions: immediateActions.slice(0, 5) // Top 5 most critical
      });
    }
    
    // REMOVED: No longer extracting opportunities  
    const opportunities = []; // Always empty - we focus on Claude analysis only
    if (opportunities.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'strategic', 
        title: 'Capitalize on Market Opportunities',
        description: `${opportunities.length} strategic opportunities identified`,
        actions: opportunities.map(opp => opp.title || opp.description).slice(0, 3)
      });
    }
    
    return recommendations;
  };

  // Get current stage status and progress
  const getStageStatus = (index) => {
    if (index < currentStage) return 'complete';
    if (index === currentStage && currentStage < INTELLIGENCE_STAGES.length) return 'running';
    return 'waiting';
  };

  // Calculate realistic stage progress
  const getCurrentStageProgress = () => {
    if (currentStage >= INTELLIGENCE_STAGES.length) return 100;
    return stageProgress;
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Estimate remaining time based on stage durations
  const estimateRemainingTime = () => {
    if (currentStage >= INTELLIGENCE_STAGES.length) return '0:00';
    
    const remainingStages = INTELLIGENCE_STAGES.slice(currentStage);
    const totalRemainingSeconds = remainingStages.reduce((sum, stage) => sum + stage.duration, 0);
    
    // Adjust for current stage progress
    const currentStageRemaining = INTELLIGENCE_STAGES[currentStage] ? 
      Math.floor(INTELLIGENCE_STAGES[currentStage].duration * (1 - stageProgress / 100)) : 0;
    
    const adjustedRemaining = totalRemainingSeconds - INTELLIGENCE_STAGES[currentStage]?.duration + currentStageRemaining;
    
    return formatTime(adjustedRemaining);
  };

  // Stage summary for completed stages
  const getStageSummary = (stageId, result) => {
    if (result.error) {
      return `❌ Error: ${result.error}`;
    }

    const stageInsights = {
      extraction: () => `✅ Organization profile extracted and saved`,
      competitive: () => {
        const actions = result.tabs?.competitive?.competitor_actions?.length || 0;
        return `🎯 ${actions} competitive actions analyzed`;
      },
      media: () => {
        const coverage = result.tabs?.media?.media_coverage?.length || 0;
        return `📰 ${coverage} media coverage items analyzed`;
      },
      regulatory: () => {
        const developments = result.tabs?.regulatory?.regulatory_developments?.length || 0;
        return `⚖️ ${developments} regulatory developments tracked`;
      },
      trends: () => {
        const trends = result.tabs?.market?.market_trends?.length || 0;
        return `📈 ${trends} market trends identified`;
      },
      synthesis: () => {
        const patterns = result.patterns?.length || 0;
        const opportunities = result.opportunities?.length || 0;
        return `🧠 ${patterns} patterns, ${opportunities} opportunities identified`;
      }
    };

    return stageInsights[stageId] ? stageInsights[stageId]() : '✅ Analysis complete';
  };

  // Update elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Tab Render Functions - Pure Intelligence Analysis
  
  const renderExecutiveSummary = (intelligence) => {
    const { tabs = {}, patterns = [], statistics = {}, analysis = {}, rawStageData = {} } = intelligence;
    
    // Get Claude synthesis analysis from rawStageData or analysis
    const claudeSynthesis = rawStageData?.synthesis || analysis;
    
    // Debug what we're actually getting (commented to reduce console spam)
    // console.log('🔍 RENDERING SYNTHESIS DEBUG:', {
    //   hasClaudeSynthesis: !!claudeSynthesis,
    //   claudeSynthesisKeys: Object.keys(claudeSynthesis || {}),
    //   hasExecutiveSummary: !!claudeSynthesis?.executive_summary,
    //   hasRawStageData: !!rawStageData,
    //   rawStageDataKeys: Object.keys(rawStageData || {}),
    //   hasAnalysis: !!analysis,
    //   analysisKeys: Object.keys(analysis || {}).slice(0, 10)
    // });
    
    return (
      <div className="executive-summary-content">
        {/* Claude Executive Summary - with fallback */}
        {(claudeSynthesis?.executive_summary || claudeSynthesis?.data) && (
          <div className="summary-section">
            <h3>Executive Intelligence Summary</h3>
            <div className="narrative-block">
              <p className="headline">{claudeSynthesis.executive_summary.headline}</p>
              <p>{claudeSynthesis.executive_summary.narrative}</p>
              {claudeSynthesis.executive_summary.key_insights && (
                <div className="key-insights">
                  <h4>Key Insights</h4>
                  <ul>
                    {claudeSynthesis.executive_summary.key_insights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="summary-section">
          <h3>Current State Analysis</h3>
          <div className="narrative-block">
            <p>
              {tabs.executive?.overview || claudeSynthesis?.executive_summary?.narrative ||
               'Intelligence gathering across 6 analytical dimensions reveals a complex operational environment.'}
            </p>
            {tabs.executive?.headline && (
              <div className="headline-metric">{tabs.executive.headline}</div>
            )}
          </div>
        </div>
        
        <div className="summary-section">
          <h3>Comparative Position</h3>
          <div className="position-grid">
            <div className="position-item">
              <span className="label">Market Position:</span>
              <span className="value">{tabs.positioning?.strengths?.length > 0 ? 'Competitive' : 'Developing'}</span>
            </div>
            <div className="position-item">
              <span className="label">Narrative Control:</span>
              <span className="value">{tabs.market?.summary || 'Monitoring'}</span>
            </div>
            <div className="position-item">
              <span className="label">Threat Level:</span>
              <span className="value">{tabs.competitive?.summary || 'Moderate'}</span>
            </div>
          </div>
        </div>
        
        <div className="summary-section">
          <h3>Convergence Patterns</h3>
          <div className="patterns-list">
            {/* Use Claude's patterns if available */}
            {(claudeSynthesis?.patterns || patterns).slice(0, 5).map((pattern, idx) => (
              <div key={idx} className="pattern-item">
                <span className="pattern-type">
                  {typeof pattern === 'string' ? 'Pattern:' : (pattern.type || 'Insight:')}
                </span>
                <span className="pattern-desc">
                  {typeof pattern === 'string' ? pattern : (pattern.description || pattern.insight || 'Pattern identified')}
                </span>
                {pattern.confidence && (
                  <span className="confidence">Confidence: {pattern.confidence}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Claude Strategic Recommendations */}
        {claudeSynthesis?.strategic_recommendations && (
          <div className="summary-section">
            <h3>Strategic Recommendations</h3>
            <div className="recommendations-list">
              {Object.entries(claudeSynthesis.strategic_recommendations).map(([category, items], idx) => (
                <div key={idx} className="recommendation-category">
                  <h4>{category.replace(/_/g, ' ').toUpperCase()}</h4>
                  {Array.isArray(items) ? (
                    <ul>
                      {items.slice(0, 3).map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{items}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="summary-section">
          <h3>Risk Indicators</h3>
          <div className="risk-grid">
            {tabs.between?.hidden_risks?.map((risk, idx) => (
              <div key={idx} className="risk-indicator">
                <span className="risk-label">⚠️ {risk}</span>
              </div>
            )) || <p>No immediate risks detected in current analysis window.</p>}
          </div>
        </div>
      </div>
    );
  };
  
  const renderCompetitiveAnalysis = (intelligence) => {
    const { tabs = {} } = intelligence;
    const competitiveData = tabs.competitive || {};
    
    // Debug what competitive data we actually have (commented to reduce console spam)
    // console.log('🎯 COMPETITIVE TAB DATA:', {
    //   hasCompetitive: !!tabs.competitive,
    //   competitiveKeys: Object.keys(competitiveData),
    //   hasCompetitorActions: !!competitiveData.competitor_actions,
    //   competitorActionsCount: competitiveData.competitor_actions?.length || 0,
    //   hasBattleCards: !!competitiveData.battle_cards,
    //   hasCompetitors: !!competitiveData.competitors,
    //   sampleData: JSON.stringify(competitiveData).slice(0, 200)
    // });
    
    return (
      <div className="competitive-analysis-content">
        <div className="analysis-section">
          <h3>Competitive Landscape</h3>
          <div className="landscape-overview">
            <p>{competitiveData.summary || 'Monitoring competitive environment across multiple vectors.'}</p>
          </div>
        </div>
        
        <div className="analysis-section">
          <h3>Observed Competitor Actions</h3>
          <div className="actions-grid">
            {competitiveData.competitor_actions?.slice(0, 5).map((action, idx) => (
              <div key={idx} className="action-card">
                <div className="competitor-name">{action.entity}</div>
                <div className="action-description">{action.action}</div>
                <div className="action-meta">
                  <span className="impact">Impact: {action.impact || 'Assessing'}</span>
                  {action.timestamp && (
                    <span className="timing">
                      {new Date(action.timestamp).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )) || <p>No significant competitive moves detected in current timeframe.</p>}
          </div>
        </div>
        
        <div className="analysis-section">
          <h3>Market Positioning Shifts</h3>
          <div className="positioning-analysis">
            {tabs.positioning?.threats?.map((threat, idx) => (
              <div key={idx} className="threat-item">
                <span className="threat-indicator">→</span>
                <span>{threat}</span>
              </div>
            )) || <p>Market positions remain relatively stable.</p>}
          </div>
        </div>
        
        <div className="analysis-section">
          <h3>Coordination Patterns</h3>
          <div className="coordination-analysis">
            {tabs.between?.patterns?.filter(p => p.includes('competitor') || p.includes('Competitive')).map((pattern, idx) => (
              <div key={idx} className="pattern-observation">
                <span>• {pattern}</span>
              </div>
            )) || <p>No coordinated competitive activity detected.</p>}
          </div>
        </div>
      </div>
    );
  };
  
  const renderMarketAnalysis = (intelligence) => {
    const { tabs = {} } = intelligence;
    const marketData = tabs.market || {};
    const thoughtData = tabs.thought || {};
    
    return (
      <div className="trending-topics-content">
        <div className="topics-section">
          <h3>Rising Narratives</h3>
          <div className="trends-grid">
            {marketData.market_trends?.map((trend, idx) => (
              <div key={idx} className="trend-card">
                <div className="trend-topic">{trend.topic}</div>
                <div className="trend-metrics">
                  <span className="mentions">Mentions: {trend.mentions}</span>
                  <span className="trajectory">{trend.trend}</span>
                  <span className="sentiment">Sentiment: {trend.sentiment}</span>
                </div>
              </div>
            )) || <p>Scanning for emerging narratives...</p>}
          </div>
        </div>
        
        <div className="topics-section">
          <h3>Topic Velocity Analysis</h3>
          <div className="velocity-analysis">
            {marketData.summary && (
              <p className="velocity-summary">{marketData.summary}</p>
            )}
          </div>
        </div>
        
        <div className="topics-section">
          <h3>Narrative White Space</h3>
          <div className="whitespace-grid">
            {thoughtData.topics?.map((topic, idx) => (
              <div key={idx} className="whitespace-opportunity">
                <div className="topic-name">{topic.topic}</div>
                <div className="opportunity-desc">{topic.opportunity}</div>
              </div>
            )) || <p>Analyzing unclaimed narrative territories...</p>}
          </div>
        </div>
        
        <div className="topics-section">
          <h3>Topic Lifecycle Stage</h3>
          <div className="lifecycle-indicators">
            {thoughtData.recommended_angles?.map((angle, idx) => (
              <div key={idx} className="lifecycle-item">
                <span className="stage-indicator">📍</span>
                <span>{angle}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderRegulatoryAnalysis = (intelligence) => {
    const { tabs = {} } = intelligence;
    const regulatoryData = tabs.regulatory || {};
    
    return (
      <div className="stakeholders-content">
        <div className="stakeholder-section">
          <h3>Stakeholder Sentiment Mapping</h3>
          <div className="sentiment-grid">
            {tabs.positioning?.vulnerabilities?.map((vuln, idx) => (
              <div key={idx} className="sentiment-item">
                <span className="stakeholder-indicator">👥</span>
                <span>{vuln}</span>
              </div>
            )) || <p>Stakeholder sentiment analysis in progress...</p>}
          </div>
        </div>
        
        <div className="stakeholder-section">
          <h3>Regulatory Developments</h3>
          <div className="regulatory-grid">
            {regulatoryData.developments?.map((dev, idx) => (
              <div key={idx} className="regulatory-item">
                <div className="regulator">{dev.regulator}</div>
                <div className="action">{dev.action}</div>
                <div className="impact">Impact: {dev.impact}</div>
              </div>
            )) || (
              <p className="regulatory-status">
                {regulatoryData.compliance_status || 'No regulatory developments in current window'}
              </p>
            )}
          </div>
        </div>
        
        <div className="stakeholder-section">
          <h3>Coalition Formations</h3>
          <div className="coalition-analysis">
            <p>Monitoring for stakeholder alignment patterns...</p>
          </div>
        </div>
        
        <div className="stakeholder-section">
          <h3>Power Dynamics</h3>
          <div className="power-flow">
            <p>Analyzing influence flows and decision-making centers...</p>
          </div>
        </div>
      </div>
    );
  };
  
  const renderMediaAnalysis = (intelligence) => {
    const { tabs = {} } = intelligence;
    const mediaData = tabs.media || {};
    
    return (
      <div className="tab-content media-analysis">
        <h3>Media Landscape Analysis</h3>
        
        {/* Media Environment */}
        {mediaData.media_environment && (
          <div className="analysis-section">
            <h4>Media Environment</h4>
            <p>{mediaData.media_environment}</p>
          </div>
        )}
        
        {/* Sentiment Trend */}
        {mediaData.sentiment_trend && (
          <div className="analysis-section">
            <h4>Sentiment Trajectory</h4>
            <div className="sentiment-indicator">
              <span className={`sentiment-badge ${mediaData.sentiment_trend.toLowerCase()}`}>
                {mediaData.sentiment_trend}
              </span>
            </div>
          </div>
        )}
        
        {/* Media Coverage */}
        {mediaData.media_coverage && mediaData.media_coverage.length > 0 && (
          <div className="analysis-section">
            <h4>Recent Coverage</h4>
            <div className="coverage-list">
              {mediaData.media_coverage.slice(0, 5).map((item, idx) => (
                <div key={idx} className="coverage-item">
                  <div className="coverage-source">{item.source}</div>
                  <div className="coverage-title">{item.title || item.topic}</div>
                  <div className="coverage-sentiment">{item.sentiment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Media Opportunities */}
        {mediaData.media_opportunities && mediaData.media_opportunities.length > 0 && (
          <div className="analysis-section">
            <h4>Media Opportunities</h4>
            <div className="opportunities-list">
              {mediaData.media_opportunities.map((opp, idx) => (
                <div key={idx} className="opportunity-item">
                  <div className="opp-title">{opp.opportunity || opp}</div>
                  {opp.pr_angle && <div className="opp-angle">{opp.pr_angle}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Narrative Control */}
        {mediaData.narrative_control && (
          <div className="analysis-section">
            <h4>Narrative Control</h4>
            <div className="control-level">
              Level: <span className={`control-badge ${mediaData.narrative_control}`}>
                {mediaData.narrative_control}
              </span>
            </div>
            {mediaData.media_strategy && (
              <div className="strategy-text">{mediaData.media_strategy}</div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const renderForwardAnalysis = (intelligence) => {
    const { tabs = {}, patterns = [] } = intelligence;
    const forwardData = tabs.forward || {};
    
    return (
      <div className="early-signals-content">
        <div className="signals-section">
          <h3>Weak Signals Detected</h3>
          <div className="signals-grid">
            {tabs.between?.patterns?.map((pattern, idx) => (
              <div key={idx} className="signal-card">
                <div className="signal-indicator">📡</div>
                <div className="signal-description">{pattern}</div>
              </div>
            )) || <p>Scanning for weak signals...</p>}
          </div>
        </div>
        
        <div className="signals-section">
          <h3>Cascade Predictions</h3>
          <div className="cascade-timeline">
            <div className="timeline-item">
              <span className="timeframe">Next 24 Hours:</span>
              <span className="prediction">{forwardData.next_24h || 'Monitoring developments'}</span>
            </div>
            <div className="timeline-item">
              <span className="timeframe">Next 7 Days:</span>
              <span className="prediction">{forwardData.next_7d || 'Tracking pattern evolution'}</span>
            </div>
            <div className="timeline-item">
              <span className="timeframe">Next 30 Days:</span>
              <span className="prediction">{forwardData.next_30d || 'Projecting strategic shifts'}</span>
            </div>
          </div>
        </div>
        
        <div className="signals-section">
          <h3>Amplification Factors</h3>
          <div className="amplification-grid">
            {tabs.between?.implications?.map((imp, idx) => (
              <div key={idx} className="amplification-factor">
                <span className="factor-indicator">⚡</span>
                <span>{imp}</span>
              </div>
            )) || <p>Identifying potential amplification vectors...</p>}
          </div>
        </div>
        
        <div className="signals-section">
          <h3>Historical Pattern Matches</h3>
          <div className="pattern-matches">
            {patterns.filter(p => p.confidence > 70).map((pattern, idx) => (
              <div key={idx} className="pattern-match">
                <div className="match-type">{pattern.type}</div>
                <div className="match-desc">{pattern.description}</div>
                <div className="match-confidence">Match Confidence: {pattern.confidence}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Run stages sequentially - ONLY ONCE per organization
  useEffect(() => {
    // Prevent re-runs if pipeline is complete or running
    if (isComplete) {
      console.log('✅ Pipeline complete or no organization');
      return;
    }
    
    if (runningRef.current) {
      return;
    }
    
    console.log('🎯 ELABORATE PIPELINE - Stage trigger check:', {
      hasOrganization: !!organization,
      hasStarted,
      currentStage,
      totalStages: INTELLIGENCE_STAGES.length,
      hasError: !!error,
      isComplete
    });
    
    // Don't run if no organization
    if (!organization) {
      console.log('⏳ No organization yet');
      return;
    }
    
    // Mark as started for the first stage
    if (currentStage === 0 && !hasStarted) {
      console.log('🚀 Starting pipeline for the first time');
      setHasStarted(true);
      runningRef.current = true;
      // Immediately trigger the first stage
      runStage(0);
      return;
    }
    
    // Don't run stages if there's an error
    if (error) {
      console.log('❌ Pipeline has error, not running stage');
      runningRef.current = false;
      return;
    }
    
    // Don't check stageResults here - it causes re-renders
    // The runStage function handles checking if already running
    
    // Run the current stage if within bounds and started
    if (hasStarted && currentStage >= 0 && currentStage < INTELLIGENCE_STAGES.length) {
      console.log(`🚀 RUNNING STAGE ${currentStage + 1}: ${INTELLIGENCE_STAGES[currentStage].name}`);
      runningRef.current = true;
      runStage(currentStage);
    } else if (currentStage === INTELLIGENCE_STAGES.length && !isComplete) {
      console.log('🎉 All stages done, completing pipeline...');
      handleComplete();
    }
  }, [currentStage, organization, error, isComplete, hasStarted]); // Removed runStage, handleComplete, stageResults from deps

  // Define tab metadata (must be before any returns for hooks rules)
  const tabMetadata = {
    executive: { label: 'Executive Summary', icon: '📊' },
    competitive: { label: 'Competitive', icon: '⚔️' },
    market: { label: 'Market', icon: '📈' },
    regulatory: { label: 'Regulatory', icon: '⚖️' },
    media: { label: 'Media', icon: '📰' },
    forward: { label: 'Forward Look', icon: '🔮' }
  };
  
  // Render current tab content only when needed (must be called before any returns)
  const currentTabContent = useMemo(() => {
    if (!finalIntelligence || !activeTab) return null;
    
    switch(activeTab) {
      case 'executive':
        return renderExecutiveSummaryEnhanced(finalIntelligence);
      case 'competitive':
        return renderCompetitiveAnalysisEnhanced(finalIntelligence);
      case 'market':
        return renderMarketAnalysisEnhanced(finalIntelligence);
      case 'regulatory':
        return renderRegulatoryAnalysisEnhanced(finalIntelligence);
      case 'media':
        return renderMediaAnalysisEnhanced(finalIntelligence);
      case 'forward':
        return renderForwardLookingEnhanced(finalIntelligence);
      default:
        return <div>No content available for this tab</div>;
    }
  }, [finalIntelligence, activeTab]); // Only re-render when these change

  // Show initialization message
  if (!organization) {
    return (
      <div className="multi-stage-intelligence">
        <div className="analysis-header">
          <h1>Initializing Elaborate Intelligence Pipeline</h1>
          <p className="analysis-subtitle">
            Loading organization data for comprehensive analysis...
          </p>
        </div>
      </div>
    );
  }

  // Show completed intelligence display with tabbed interface
  if (isComplete && finalIntelligence) {
    // Debug what tabs we actually have
    // Log final intelligence structure once (commented to reduce console spam)
    // console.log('📊 FINAL INTELLIGENCE TABS STRUCTURE:', {
    //   hasFinalIntelligence: !!finalIntelligence,
    //   hasTabs: !!finalIntelligence.tabs,
    //   tabKeys: Object.keys(finalIntelligence.tabs || {}),
    //   tabStructure: Object.entries(finalIntelligence.tabs || {}).map(([key, value]) => ({
    //     tab: key,
    //     hasData: !!value,
    //     keys: Object.keys(value || {}).slice(0, 5)
    //   })),
    //   hasRawStageData: !!finalIntelligence.rawStageData,
    //   rawStageKeys: Object.keys(finalIntelligence.rawStageData || {})
    // });
    
    return (
      <div className="multi-stage-intelligence completed">
        <div className="intelligence-results">
          <div className="results-header">
            <h2>Intelligence Analysis Complete</h2>
            <div className="completion-stats">
              <span className="stat">6 Stages Analyzed</span>
              <span className="stat">{Math.floor((Date.now() - startTime) / 1000)}s Duration</span>
              <span className="stat">{Object.keys(stageResults).length} Data Points</span>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            {Object.entries(tabMetadata).map(([key, tab]) => (
              <button
                key={key}
                className={`tab-button ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="tab-content-area">
            {currentTabContent}
          </div>
          
          {/* Claude Analysis Summary */}
          {finalIntelligence.metadata?.hasClaudeAnalysis && (
            <div className="claude-analysis-footer">
              <div className="separator-line" />
              <div className="analysis-notice">
                <span className="notice-icon">🧠</span>
                <span className="notice-text">
                  Claude synthesis complete across {finalIntelligence.metadata.stagesCompleted.length} intelligence stages.
                  Analysis duration: {Math.round(finalIntelligence.metadata.duration / 1000)}s
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show elaborate pipeline progress
  // Show loading state while fetching organization from edge function
  if (loadingOrg) {
    return (
      <div className="multi-stage-intelligence">
        <div className="loading-container">
          <h2>Loading Organization Profile...</h2>
          <p>Fetching from intelligence edge function (single source of truth)</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Show message if no organization found
  if (!organization) {
    return (
      <div className="multi-stage-intelligence">
        <div className="no-org-container">
          <h2>No Organization Profile Found</h2>
          <p>Please complete onboarding to configure your organization profile.</p>
          <button onClick={() => window.location.href = '/onboarding'} className="action-button">
            Complete Setup
          </button>
        </div>
      </div>
    );
  }

  // Debug function to test opportunity flow
  const runOpportunityDebugTest = async () => {
    console.log('🔍 STARTING OPPORTUNITY DEBUG TEST');
    console.log('Running minimal pipeline: Extraction + Synthesis only');
    
    // Clear existing results
    setStageResults({});
    setCurrentStage(0);
    setIsComplete(false);
    
    try {
      // Run extraction stage
      const extractionConfig = createStageConfig(0, organization);
      console.log('📦 Running extraction with config:', extractionConfig);
      const extractionResult = await intelligenceOrchestratorV4.orchestrate(extractionConfig);
      console.log('✅ Extraction complete:', {
        hasData: !!extractionResult.data,
        hasOrganization: !!extractionResult.organization
      });
      
      // Create minimal previous results for synthesis
      const minimalPreviousResults = {
        extraction: extractionResult.data || {},
        stage1: { competitors: { direct: [] } },
        stage2: { media_coverage: {} },
        stage3: { regulatory_status: {} },
        stage4: { trends: [] }
      };
      
      // Run synthesis stage directly
      const synthesisConfig = {
        organization: extractionResult.organization || organization,
        stageConfig: {
          stageId: 'synthesis',
          stageName: 'Strategic Synthesis',
          focus: 'synthesis',
          isElaboratePipeline: true,
          previousStageResults: minimalPreviousResults
        }
      };
      
      console.log('🎯 Running synthesis with config:', synthesisConfig);
      const synthesisResult = await intelligenceOrchestratorV4.orchestrate(synthesisConfig);
      console.log('✅ Synthesis complete:', {
        hasData: !!synthesisResult.data,
        hasOpportunities: !!synthesisResult.opportunities,
        opportunityCount: synthesisResult.opportunities?.length || 0,
        hasConsolidated: !!synthesisResult.data?.consolidated_opportunities,
        consolidatedCount: synthesisResult.data?.consolidated_opportunities?.prioritized_list?.length || 0
      });
      
      // Store results
      setStageResults({
        extraction: extractionResult,
        synthesis: synthesisResult
      });
      
      // Focus on Claude synthesis analysis
      console.log('🏆 SYNTHESIS DEBUG TEST COMPLETE:', {
        hasClaudeAnalysis: !!synthesisResult?.data,
        analysisKeys: synthesisResult?.data ? Object.keys(synthesisResult.data) : [],
        executiveSummary: synthesisResult?.data?.executive_summary,
        patterns: synthesisResult?.data?.patterns?.length || 0,
        recommendations: synthesisResult?.data?.strategic_recommendations ? Object.keys(synthesisResult.data.strategic_recommendations) : []
      });
      
      // Force completion
      setIsComplete(true);
      setCurrentStage(2);
      
      // Trigger synthesis callback
      const elaborateIntelligence = synthesizeElaborateResults(
        { extraction: extractionResult, synthesis: synthesisResult },
        extractionResult.organization || organization,
        10
      );
      
      setFinalIntelligence(elaborateIntelligence);
      if (onComplete) {
        onComplete(elaborateIntelligence);
      }
      
    } catch (error) {
      console.error('❌ Debug test failed:', error);
      setError(`Debug test failed: ${error.message}`);
    }
  };

  return (
    <div className="multi-stage-intelligence">
      <div className="analysis-header">
        <h1>Elaborate Intelligence Analysis in Progress</h1>
        <p className="analysis-subtitle">
          Conducting comprehensive 6-stage analysis of {organization?.name || 'your organization'}'s 
          complete strategic landscape. This elaborate process takes 2-3 minutes to ensure 
          maximum depth and strategic insight quality.
        </p>
        <div className="pipeline-metadata">
          <span className="pipeline-version">Elaborate Pipeline v2.0</span>
          <span className="pipeline-stages">{INTELLIGENCE_STAGES.length} Stages</span>
          {/* Debug button - only show in development */}
          <button 
            onClick={runOpportunityDebugTest}
            style={{
              marginLeft: '20px',
              padding: '8px 16px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🧠 Debug Synthesis
          </button>
        </div>
      </div>

      <div className="stages-container">
        {INTELLIGENCE_STAGES.map((stage, index) => {
          const status = getStageStatus(index);
          const progress = index === currentStage ? getCurrentStageProgress() : 
                          index < currentStage ? 100 : 0;
          const result = stageResults[stage.id];

          return (
            <div key={stage.id} className={`stage-item elaborate ${status}`}>
              <div className="stage-header">
                <span className="stage-number">Stage {index + 1}</span>
                <span className="stage-name">{stage.name}</span>
                <span className="stage-duration">{stage.duration}s</span>
                {status === 'complete' && <span className="stage-check">✓</span>}
              </div>
              
              <div className="stage-progress-bar">
                <div 
                  className="stage-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="stage-details">
                <div className="stage-focus">
                  <strong>Focus:</strong> {stage.focus}
                </div>
                
                {status === 'running' && (
                  <div className="stage-activity">
                    <p className="stage-description">{stage.description}</p>
                    <div className="stage-progress-text">{Math.floor(progress)}% complete</div>
                  </div>
                )}
                
                {status === 'complete' && result && (
                  <p className="stage-summary">
                    {getStageSummary(stage.id, result)}
                  </p>
                )}
                
                {status === 'waiting' && (
                  <p className="stage-waiting">Awaiting previous stage completion...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="analysis-footer">
        <div className="time-stats">
          <span className="elapsed-time">
            Elapsed: {formatTime(elapsedTime)}
          </span>
          <span className="remaining-time">
            Estimated remaining: {estimateRemainingTime()}
          </span>
          <span className="stage-indicator">
            Stage {Math.min(currentStage + 1, INTELLIGENCE_STAGES.length)} of {INTELLIGENCE_STAGES.length}
          </span>
        </div>
        
        {error && (
          <div className="analysis-error">
            <p>Pipeline Error: {error}</p>
            <button onClick={() => window.location.reload()}>Restart Analysis</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiStageIntelligence;