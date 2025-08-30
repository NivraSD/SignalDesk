import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './MultiStageIntelligence.css';
import intelligenceOrchestratorV4 from '../services/intelligenceOrchestratorV4';
import supabaseDataService from '../services/supabaseDataService';

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

// Define the elaborate 7-stage intelligence pipeline
const INTELLIGENCE_STAGES = [
  {
    id: 'extraction',
    name: 'Organization Data Extraction',
    description: 'Extracting comprehensive organization profile and stakeholder data...',
    duration: 25,
    focus: 'Data gathering and organization profiling'
  },
  {
    id: 'competitive',
    name: 'Competitive Intelligence Analysis',
    description: 'Conducting deep competitor analysis and threat assessment...',
    duration: 35,
    focus: 'Competitor actions, market positioning, competitive threats'
  },
  {
    id: 'stakeholders',
    name: 'Stakeholder Analysis',
    description: 'Analyzing customers, thought leaders, influencers, and key stakeholders...',
    duration: 35,
    focus: 'Customer sentiment, thought leader opinions, influencer narratives, employee sentiment'
  },
  {
    id: 'media',
    name: 'Media Landscape Mapping',
    description: 'Mapping journalist networks and media coverage patterns...',
    duration: 30,
    focus: 'Media relations, coverage analysis, journalist identification'
  },
  {
    id: 'regulatory',
    name: 'Regulatory Environment',
    description: 'Analyzing regulatory developments and compliance landscape...',
    duration: 25,
    focus: 'Compliance requirements, regulatory changes, policy implications'
  },
  {
    id: 'trends',
    name: 'Market Trends & Topic Analysis',
    description: 'Identifying trending narratives and conversation opportunities...',
    duration: 25,
    focus: 'Market trends, topic analysis, narrative gaps'
  },
  {
    id: 'synthesis',
    name: 'Strategic Synthesis & Pattern Recognition',
    description: 'Connecting insights and identifying strategic opportunities...',
    duration: 45,
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
  const accumulatedResultsRef = useRef({}); // Track accumulated results across stages
  
  // Initialize organization state
  const [organization] = useState(() => {
    // Initialize organization
    
    if (organizationProp && organizationProp.name) {
      return organizationProp;
    }
    
    // DISABLED: No localStorage - load from Edge Functions/Supabase only
    // const saved = localStorage.getItem('organization');
    // if (saved) {
    //   try {
    //     const org = JSON.parse(saved);
    //     return org;
    //   } catch (e) {
    //     console.error('Failed to parse organization:', e);
    //   }
    // }
    
    return null;
  });

  // Reset pipeline when organization changes
  useEffect(() => {
    // Reset all state when organization changes
    setCurrentStage(0);
    setStageResults({});
    setHasStarted(false);
    setIsComplete(false);
    setError(null);
    completionRef.current = false;
    runningRef.current = false;
    accumulatedResultsRef.current = {}; // Reset accumulated results
    console.log(`🔄 Reset pipeline for new organization: ${organization?.name}`);
  }, [organization?.name]);
  
  // Load existing data from Supabase on mount - ONLY ONCE
  useEffect(() => {
    // Add guard to prevent re-running
    if (hasStarted) {
      console.log('⚠️ Already started, skipping data load');
      return;
    }
    
    const loadExistingData = async () => {
      if (!organization?.name) return;
      
      console.log(`🔍 Checking Supabase for existing data for ${organization.name}...`);
      
      // Try to load existing analysis from Supabase
      const existingAnalysis = await supabaseDataService.loadCompleteAnalysis(organization.name);
      
      if (existingAnalysis && existingAnalysis.stageData) {
        console.log('✅ Found existing analysis in Supabase!');
        
        // Check if this analysis is recent (less than 5 minutes old)
        const synthesisData = existingAnalysis.stageData?.synthesis;
        const timestamp = synthesisData?.timestamp || synthesisData?.data?.timestamp;
        const isRecent = timestamp && (Date.now() - new Date(timestamp).getTime()) < 5 * 60 * 1000;
        
        if (isRecent) {
          console.log('📊 Using recent cached analysis (< 5 minutes old)');
          // Set the stage results from Supabase
          setStageResults(existingAnalysis.stageData);
          
          // Set final intelligence if synthesis exists
          if (existingAnalysis.tabs) {
            const finalIntel = {
              success: true,
              analysis: existingAnalysis.analysis,
              tabs: existingAnalysis.tabs,
              metadata: existingAnalysis.metadata
            };
            setFinalIntelligence(finalIntel);
            completionRef.current = true;
            setIsComplete(true);
            setHasStarted(true); // Prevent re-running pipeline
          }
        } else {
          console.log('🔄 Existing analysis is stale (> 5 minutes old), running fresh pipeline...');
          // Don't set isComplete to true - let the pipeline run
          setStageResults({});
          setFinalIntelligence(null);
          setIsComplete(false);
          completionRef.current = false;
        }
      } else {
        console.log('📝 No existing data in Supabase, ready to run new analysis');
      }
    };
    
    loadExistingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run ONLY on mount

  // Run individual stage with specialized analysis
  const runStage = useCallback(async (stageIndex, accumulatedResults = null) => {
    const stage = INTELLIGENCE_STAGES[stageIndex];
    
    // Use accumulated results or current state
    const currentResults = accumulatedResults || stageResults;
    
    // Check if this stage is already running or complete
    if (currentResults[stage.id] && (currentResults[stage.id].inProgress || currentResults[stage.id].completed)) {
      console.log(`⚠️ Stage ${stageIndex + 1} already processed, skipping`);
      setCurrentStage(stageIndex + 1);
      return currentResults;
    }
    
    console.log(`🔄 Starting stage ${stageIndex + 1}: ${stage.name}`);
    setStageProgress(0);
    
    try {
      // Mark stage as in-progress immediately
      setStageResults(prev => ({
        ...prev,
        [stage.id]: { inProgress: true }
      }));
      
      // Create stage-specific configuration with accumulated results
      const stageConfig = createStageConfig(stageIndex, organizationProfile || organization, currentResults);
      
      // Linear progress over ~25 seconds per stage (2.5 mins / 6 stages)
      const progressTimer = setInterval(() => {
        setStageProgress(prev => Math.min(90, prev + 3.6)); // ~90% in 25 seconds
      }, 1000);
      
      // Run specialized analysis through orchestrator
      console.log(`📡 Calling orchestrator for stage ${stageIndex + 1} with config:`, {
        stageId: stageConfig.stageConfig?.stageId,
        hasPreviousResults: !!stageConfig.stageConfig?.previousStageResults,
        previousStageCount: Object.keys(stageConfig.stageConfig?.previousStageResults || {}).length
      });
      
      const result = await intelligenceOrchestratorV4.orchestrate(stageConfig);
      
      clearInterval(progressTimer);
      setStageProgress(100);
      
      console.log(`📊 Stage ${stageIndex + 1} (${stage.name}) FULL result:`, result);
      console.log(`📊 Stage ${stageIndex + 1} (${stage.name}) result summary:`, {
        success: result?.success,
        hasData: !!result?.data,
        hasIntelligence: !!result?.intelligence,
        dataKeys: result?.data ? Object.keys(result.data) : [],
        resultKeys: result ? Object.keys(result) : [],
        actualData: result?.data ? JSON.stringify(result.data).slice(0, 500) : 'No data'
      });
      
      // Check if we actually got data
      if (!result) {
        console.error(`❌ Stage ${stageIndex + 1} returned null/undefined`);
        throw new Error(`Stage ${stageIndex + 1} returned no result`);
      }
      
      if (result.success) {
        // Stage complete
        
        // STAGE 1: Extract and save organization profile
        if (stageIndex === 0 && result.organization) {
          setOrganizationProfile(result.organization);
          // Don't save to localStorage - let the edge functions handle persistence
        }
        
        // Create the updated results object with this stage's data
        const updatedResults = {
          ...currentResults,
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
        
        // Store stage-specific results (replace inProgress marker)
        setStageResults(updatedResults);
        
        // Update accumulated results ref for next stage
        accumulatedResultsRef.current = updatedResults;
        
        // Save opportunities to localStorage for OpportunityEngine (if synthesis stage)
        if (stage.id === 'synthesis' && result.data?.consolidated_opportunities?.prioritized_list) {
          const opportunities = result.data.consolidated_opportunities.prioritized_list;
          console.log(`💾 Saving ${opportunities.length} opportunities to localStorage for OpportunityEngine`);
          localStorage.setItem('signaldesk_latest_intelligence', JSON.stringify({
            opportunities: opportunities,
            timestamp: Date.now(),
            organization: organization.name
          }));
        }
        
        // Progress to next stage (or complete if this was the last)
        // The completion will be handled by the useEffect when currentStage >= INTELLIGENCE_STAGES.length
        setTimeout(() => {
          setCurrentStage(stageIndex + 1);
        }, stageIndex === INTELLIGENCE_STAGES.length - 1 ? 1000 : 3000); // Shorter delay for completion
        
        // Return the updated results for the next stage to use
        return updatedResults;
        
      } else {
        throw new Error(`Stage ${stageIndex + 1} failed: ${result.error}`);
      }
    } catch (err) {
      console.error(`Stage ${stageIndex + 1} error:`, err.message);
      setError(`Stage ${stageIndex + 1} (${stage.name}) failed: ${err.message}`);
      
      // Create updated results with error
      const updatedResults = {
        ...currentResults,
        [stage.id]: { 
          error: err.message,
          inProgress: false,
          completed: true,
          failed: true,
          stageMetadata: { stageName: stage.name, focus: stage.focus }
        }
      };
      
      // Store error but continue to next stage after delay
      setStageResults(updatedResults);
      
      // Update accumulated results ref even on error
      accumulatedResultsRef.current = updatedResults;
      
      setTimeout(() => {
        setCurrentStage(stageIndex + 1);
      }, 2000);
      
      // Return the updated results even on error
      return updatedResults;
    }
  }, [organization, organizationProfile, startTime]);

  // Create specialized configuration for each stage
  const createStageConfig = (stageIndex, baseOrganization, accumulatedResults = null) => {
    const baseConfig = {
      organization: baseOrganization,
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
    // Use accumulated results if provided, otherwise use current state
    const resultsToUse = accumulatedResults || stageResults;
    return {
      ...baseConfig,
      stageConfig: {
        stageId: stage.id,
        stageName: stage.name,
        focus: stage.focus,
        isElaboratePipeline: true,
        previousStageResults: Object.keys(resultsToUse).length > 0 ? resultsToUse : null
      }
    };
  };

  // Complete analysis and synthesize all stage results with provided results
  const handleCompleteWithResults = (finalResults) => {
    // Prevent multiple calls using ref only (not isComplete state)
    if (completionRef.current) {
      console.log('⚠️ Pipeline already completing, skipping duplicate call');
      return;
    }
    
    // Set ref immediately to prevent any re-entry
    completionRef.current = true;
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`🎉 ELABORATE PIPELINE COMPLETE in ${totalTime} seconds`);
    console.log('📊 Final stage results:', Object.keys(finalResults));
    console.log('📊 Stage results detail:', finalResults);
    
    // Validate all stages completed
    const requiredStages = INTELLIGENCE_STAGES.map(s => s.id);
    const completedStages = Object.keys(finalResults);
    const hasAllStages = requiredStages.every(stage => completedStages.includes(stage));
    
    if (!hasAllStages) {
      console.warn('⚠️ Some stages incomplete, using available data:', {
        required: requiredStages,
        completed: completedStages,
        missing: requiredStages.filter(s => !completedStages.includes(s))
      });
      // Continue anyway with partial results instead of returning
    }
    
    // Update stageResults state with final accumulated results
    setStageResults(finalResults);
    
    // Synthesize elaborate intelligence from all stages (even if partial)
    const elaborateIntelligence = synthesizeElaborateResults(finalResults, organizationProfile || organization, totalTime);
    
    console.log('🎯 Setting final intelligence:', elaborateIntelligence);
    console.log('🔍 Intelligence structure:', {
      hasAnalysis: !!elaborateIntelligence.analysis,
      hasTabs: !!elaborateIntelligence.tabs,
      hasOpportunities: !!elaborateIntelligence.opportunities,
      keys: Object.keys(elaborateIntelligence)
    });
    
    setFinalIntelligence(elaborateIntelligence);
    
    // Set completion state immediately (no setTimeout needed)
    setIsComplete(true);
    console.log('✅ Component marked as complete, should render results now');
    if (onComplete) {
      console.log('📤 Calling onComplete callback with intelligence');
      onComplete(elaborateIntelligence);
    }
  };

  // Complete analysis and synthesize all stage results
  const handleComplete = () => {
    // Prevent multiple calls using ref only (not isComplete state)
    if (completionRef.current) {
      console.log('⚠️ Pipeline already completing, skipping duplicate call');
      return;
    }
    
    // Set ref immediately to prevent any re-entry
    completionRef.current = true;
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`🎉 ELABORATE PIPELINE COMPLETE in ${totalTime} seconds`);
    console.log('📊 Final stage results:', Object.keys(stageResults));
    console.log('📊 Stage results detail:', stageResults);
    
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
    
    console.log('🎯 Setting final intelligence:', elaborateIntelligence);
    console.log('🔍 Intelligence structure:', {
      hasAnalysis: !!elaborateIntelligence.analysis,
      hasTabs: !!elaborateIntelligence.tabs,
      hasOpportunities: !!elaborateIntelligence.opportunities,
      keys: Object.keys(elaborateIntelligence)
    });
    
    setFinalIntelligence(elaborateIntelligence);
    
    // Set completion state immediately (no setTimeout needed)
    setIsComplete(true);
    console.log('✅ Component marked as complete, should render results now');

    if (onComplete) {
      console.log('📤 Calling onComplete callback with intelligence');
      onComplete(elaborateIntelligence);
    }
  };

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
      if (stageResult?.data) {
        extractedData[stageId] = stageResult.data;
      }
    });
    
    console.log('📈 Extracted data from stages:', Object.keys(extractedData));
    
    // Create comprehensive intelligence combining all stages
    // First try to get tabs from synthesis stage which has the final aggregated data
    let intelligenceTabs = {};
    
    // Check if synthesis stage has the final intelligence structure
    // The synthesis stage returns: { data: results, tabs: tabs, opportunities: [...] }
    if (results.synthesis) {
      const synthesisResult = results.synthesis;
      console.log('🎯 Using synthesis data for tabs:', {
        hasData: !!synthesisResult.data,
        hasTabs: !!synthesisResult.tabs,
        hasOpportunities: !!synthesisResult.opportunities,
        tabKeys: synthesisResult.tabs ? Object.keys(synthesisResult.tabs) : [],
        opportunityCount: synthesisResult.opportunities?.length || 0,
        // Log the actual synthesis result structure
        synthesisKeys: Object.keys(synthesisResult),
        dataKeys: synthesisResult.data ? Object.keys(synthesisResult.data).slice(0, 10) : [],
        sampleTab: synthesisResult.tabs ? Object.keys(synthesisResult.tabs)[0] : null,
        // Log actual tab content
        executiveTabContent: synthesisResult.tabs?.executive ? 
          Object.keys(synthesisResult.tabs.executive).slice(0, 5) : 'no executive tab',
        competitiveTabContent: synthesisResult.tabs?.competitive ? 
          Object.keys(synthesisResult.tabs.competitive).slice(0, 5) : 'no competitive tab'
      });
      
      // Also log the raw synthesis result for debugging
      console.log('📦 Raw synthesis result:', synthesisResult);
      
      // The synthesis stage returns tabs directly at the top level
      if (synthesisResult.tabs) {
        intelligenceTabs = synthesisResult.tabs;
      } 
      // Also check in the data property
      else if (synthesisResult.data?.tabs) {
        intelligenceTabs = synthesisResult.data.tabs;
      }
      // Build from the synthesis results
      else if (synthesisResult.data) {
        const data = synthesisResult.data;
        intelligenceTabs = {
          executive: data.executive_summary || {},
          competitive: extractedData.competitive || {},
          media: extractedData.media || {},
          regulatory: extractedData.regulatory || {},
          market: extractedData.trends || {},
          synthesis: {
            patterns: data.patterns || [],
            cascade_predictions: data.cascade_predictions || [],
            strategic_recommendations: data.strategic_recommendations || {},
            elite_insights: data.elite_insights || {},
            action_matrix: data.action_matrix || {}
          }
        };
      }
    }
    
    // If no tabs from synthesis, try to build from individual stages
    if (!intelligenceTabs || Object.keys(intelligenceTabs).length === 0) {
      intelligenceTabs = generateTabsFromStageData(results);
    }
    
    // Ensure we always have some tabs for display
    if (!intelligenceTabs || Object.keys(intelligenceTabs).length === 0) {
      console.warn('⚠️ No tabs generated, using stage data directly');
      // Build tabs from raw stage data
      intelligenceTabs = {
        executive: {
          headline: `${orgProfile?.name || 'Organization'} Intelligence Analysis Complete`,
          overview: `Comprehensive analysis across ${Object.keys(results).length} intelligence dimensions`,
          statistics: {
            stages_completed: Object.keys(results).length,
            opportunities_identified: extractOpportunitiesFromAllStages(results).length
          }
        },
        competitive: extractedData.competitive || { summary: 'Competitive analysis in progress' },
        media: extractedData.media || { summary: 'Media landscape analysis in progress' },
        regulatory: extractedData.regulatory || { summary: 'Regulatory environment analysis in progress' },
        market: extractedData.trends || { summary: 'Market trends analysis in progress' },
        synthesis: extractedData.synthesis || { summary: 'Strategic synthesis in progress' }
      };
    }
    
    // Get opportunities from synthesis stage first, then fallback to extraction
    let opportunities = [];
    if (results.synthesis?.opportunities) {
      opportunities = results.synthesis.opportunities;
    } else if (results.synthesis?.data?.consolidated_opportunities?.prioritized_list) {
      opportunities = results.synthesis.data.consolidated_opportunities.prioritized_list;
    } else {
      opportunities = extractOpportunitiesFromAllStages(results);
    }
    
    const elaborateIntelligence = {
      success: true,
      analysis: primaryResult?.data || primaryResult?.analysis || extractedData.synthesis || extractedData.competitive || {},
      tabs: intelligenceTabs,
      opportunities: opportunities,
      stageInsights: generateStageInsights(results) || {},
      patterns: results.synthesis?.data?.patterns || identifyPatternsAcrossStages(results) || [],
      recommendations: results.synthesis?.data?.strategic_recommendations || generateStrategicRecommendations(results) || {},
      metadata: {
        organization: orgProfile?.name || 'Unknown',
        pipeline: 'elaborate-multi-stage',
        version: 'v2.0',
        stages: INTELLIGENCE_STAGES.length,
        duration: duration,
        stagesCompleted: Object.keys(results),
        timestamp: new Date().toISOString(),
        comprehensiveAnalysis: true
      }
    };
    
    console.log('✅ Elaborate intelligence synthesized:', {
      hasAnalysis: !!elaborateIntelligence.analysis,
      hasTabs: !!elaborateIntelligence.tabs,
      hasOpportunities: !!elaborateIntelligence.opportunities,
      opportunityCount: elaborateIntelligence.opportunities?.length || 0,
      tabKeys: elaborateIntelligence.tabs ? Object.keys(elaborateIntelligence.tabs) : [],
      analysisKeys: elaborateIntelligence.analysis ? Object.keys(elaborateIntelligence.analysis).slice(0, 5) : []
    });
    
    return elaborateIntelligence;
  };

  // Generate default tabs for display
  const generateDefaultTabs = (extractedData) => {
    const tabs = {};
    
    // Create competitive tab
    if (extractedData.competitive?.competitors) {
      tabs.competitive = {
        title: 'Competitive Analysis',
        content: extractedData.competitive,
        hasData: true
      };
    }
    
    // Create media tab
    if (extractedData.media?.media_landscape || extractedData.media?.media_coverage) {
      tabs.media = {
        title: 'Media Landscape',
        content: extractedData.media,
        hasData: true
      };
    }
    
    // Create regulatory tab
    if (extractedData.regulatory?.regulatory) {
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
    
    // Log what we're working with
    console.log('🔄 Generating tabs from stage data:', {
      stageCount: Object.keys(results).length,
      stages: Object.keys(results),
      synthesisData: results.synthesis?.data ? Object.keys(results.synthesis.data) : 'no synthesis data'
    });
    
    // Create executive summary from all stages
    const immediateActions = [];
    
    // Extract immediate actions from each stage
    if (results.competitive?.data?.recommendations?.immediate_actions) {
      immediateActions.push(...results.competitive.data.recommendations.immediate_actions);
    }
    if (results.synthesis?.data?.action_matrix?.immediate) {
      immediateActions.push(...results.synthesis.data.action_matrix.immediate);
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
      if (stageResult?.data && !stageResult.error) {
        // Extract the actual stage data
        const stageData = stageResult.data;
        
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
    
    Object.entries(results).forEach(([stageId, stageResult]) => {
      // Check for opportunities at top level
      if (stageResult.opportunities && Array.isArray(stageResult.opportunities)) {
        allOpportunities.push(...stageResult.opportunities.map(opp => ({
          ...opp,
          source: stageResult.stageMetadata?.stageName || 'Unknown Stage'
        })));
      }
      
      // Check for consolidated_opportunities in synthesis stage
      if (stageId === 'synthesis') {
        console.log('🔍 Synthesis stage data structure:', {
          hasData: !!stageResult.data,
          dataKeys: stageResult.data ? Object.keys(stageResult.data) : [],
          hasConsolidatedOpps: !!stageResult.data?.consolidated_opportunities,
          hasPrioritizedList: !!stageResult.data?.consolidated_opportunities?.prioritized_list,
          actualData: stageResult.data
        });
        
        if (stageResult.data?.consolidated_opportunities?.prioritized_list) {
          console.log('🎯 Found consolidated opportunities in synthesis stage!');
          const consolidatedOpps = stageResult.data.consolidated_opportunities.prioritized_list;
          allOpportunities.push(...consolidatedOpps.map(opp => ({
            ...opp,
            source: 'Strategic Synthesis',
            fromSynthesis: true
          })));
        }
      }
      
      // Also check if success=true and data has consolidated_opportunities (for edge function responses)
      if (stageResult.success && stageResult.data?.consolidated_opportunities?.prioritized_list) {
        console.log('🎯 Found opportunities in stage data!');
        const prioritizedOpps = stageResult.data.consolidated_opportunities.prioritized_list;
        if (!allOpportunities.some(o => o.fromSynthesis)) { // Avoid duplicates
          allOpportunities.push(...prioritizedOpps.map(opp => ({
            ...opp,
            source: 'Intelligence Synthesis',
            fromSynthesis: true
          })));
        }
      }
    });
    
    console.log(`📊 Extracted ${allOpportunities.length} total opportunities from all stages`);
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
    
    // Pattern 1: Cross-stage opportunity alignment
    const allOpportunities = extractOpportunitiesFromAllStages(results);
    if (allOpportunities.length > 3) {
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
    
    // Strategic opportunities
    const opportunities = extractOpportunitiesFromAllStages(results);
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
  
  // Clear window flags on mount to ensure fresh logging
  useEffect(() => {
    window._completionLogged = false;
    window._opportunitiesLogged = false;
    window._intelligenceStructureLogged = false;
    window._competitiveDataLogged = false;
    window._executiveDataLogged = false;
    
    return () => {
      // Clean up on unmount
      window._completionLogged = false;
      window._opportunitiesLogged = false;
      window._intelligenceStructureLogged = false;
      window._competitiveDataLogged = false;
      window._executiveDataLogged = false;
    };
  }, []);

  // Tab Render Functions - Pure Intelligence Analysis
  // Wrap in useCallback to prevent recreation on every render
  const renderExecutiveSummary = useCallback((intelligence) => {
    const { tabs = {}, patterns = [], statistics = {}, analysis = {}, metadata = {} } = intelligence;
    
    // Log what data we have for executive summary
    if (!window._executiveDataLogged) {
      console.log('📊 Executive summary data:', {
        hasTabsExecutive: !!tabs.executive,
        executiveKeys: tabs.executive ? Object.keys(tabs.executive) : [],
        hasAnalysis: !!analysis,
        analysisKeys: Object.keys(analysis).slice(0, 10),
        hasPatterns: patterns.length > 0,
        patternCount: patterns.length,
        metadataOrg: metadata.organization
      });
      window._executiveDataLogged = true;
    }
    
    return (
      <div className="executive-summary-content">
        <div className="summary-section">
          <h3>Current State Analysis</h3>
          <div className="narrative-block">
            {tabs.executive?.headline && (
              <div className="headline-metric">{tabs.executive.headline}</div>
            )}
            <p>
              {tabs.executive?.overview || analysis.overview ||
               `Intelligence gathering across ${metadata.stagesCompleted?.length || 6} analytical dimensions for ${metadata.organization || 'the organization'}.`}
            </p>
            {tabs.executive?.competitive_highlight && (
              <p className="competitive-highlight">
                <strong>Competitive:</strong> {tabs.executive.competitive_highlight}
              </p>
            )}
            {tabs.executive?.market_highlight && (
              <p className="market-highlight">
                <strong>Market:</strong> {tabs.executive.market_highlight}
              </p>
            )}
          </div>
        </div>
        
        <div className="summary-section">
          <h3>Intelligence Statistics</h3>
          <div className="position-grid">
            <div className="position-item">
              <span className="label">Entities Tracked:</span>
              <span className="value">{tabs.executive?.statistics?.entities_tracked || 0}</span>
            </div>
            <div className="position-item">
              <span className="label">Actions Captured:</span>
              <span className="value">{tabs.executive?.statistics?.actions_captured || 0}</span>
            </div>
            <div className="position-item">
              <span className="label">Topics Monitored:</span>
              <span className="value">{tabs.executive?.statistics?.topics_monitored || 0}</span>
            </div>
            <div className="position-item">
              <span className="label">Opportunities:</span>
              <span className="value">{tabs.executive?.statistics?.opportunities_identified || 0}</span>
            </div>
          </div>
        </div>
        
        {tabs.executive?.immediate_actions && tabs.executive.immediate_actions.length > 0 && (
          <div className="summary-section">
            <h3>Immediate Actions</h3>
            <ul className="actions-list">
              {tabs.executive.immediate_actions.slice(0, 5).map((action, idx) => (
                <li key={idx}>{action.action || action}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="summary-section">
          <h3>Convergence Patterns</h3>
          <div className="patterns-list">
            {patterns.slice(0, 3).map((pattern, idx) => (
              <div key={idx} className="pattern-item">
                <span className="pattern-type">{pattern.type || pattern}:</span>
                <span className="pattern-desc">{pattern.description || 'Pattern identified'}</span>
                {pattern.confidence && (
                  <span className="confidence">Confidence: {pattern.confidence}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
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
  }, []); // No dependencies, pure function
  
  const renderCompetitiveAnalysis = useCallback((intelligence) => {
    const { tabs = {}, analysis = {} } = intelligence;
    const competitiveData = tabs.competitive || analysis.competitive || {};
    
    // Log what data we have for competitive analysis
    if (!window._competitiveDataLogged) {
      console.log('🎯 Competitive data structure:', {
        hasTabsCompetitive: !!tabs.competitive,
        hasAnalysisCompetitive: !!analysis.competitive,
        competitiveKeys: Object.keys(competitiveData),
        hasCompetitors: !!competitiveData.competitors,
        hasCompetitorActions: !!competitiveData.competitor_actions
      });
      window._competitiveDataLogged = true;
    }
    
    return (
      <div className="competitive-analysis-content">
        <div className="analysis-section">
          <h3>Competitive Landscape</h3>
          <div className="landscape-overview">
            <p>{competitiveData.summary || competitiveData.overview || 'Monitoring competitive environment across multiple vectors.'}</p>
          </div>
        </div>
        
        <div className="analysis-section">
          <h3>Observed Competitor Actions</h3>
          <div className="actions-grid">
            {(tabs.competitive?.competitor_actions || competitiveData.competitor_actions || []).length > 0 ? (
              (tabs.competitive?.competitor_actions || competitiveData.competitor_actions || []).slice(0, 5).map((action, idx) => (
                <div key={idx} className="action-card">
                  <div className="competitor-name">{action.competitor || action.entity || 'Competitor'}</div>
                  <div className="action-description">{action.action || 'Active in market'}</div>
                  <div className="action-meta">
                    <span className="impact">Impact: {action.impact || 'Assessing'}</span>
                    {action.response && (
                      <span className="response">Response: {action.response}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No significant competitive moves detected in current timeframe.</p>
            )}
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
  }, []); // No dependencies, pure function
  
  const renderTrendingTopics = useCallback((intelligence) => {
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
  }, []); // No dependencies, pure function
  
  const renderStakeholders = useCallback((intelligence) => {
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
  }, []); // No dependencies, pure function
  
  const renderEarlySignals = useCallback((intelligence) => {
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
  }, []); // No dependencies, pure function

  const renderOpportunities = useCallback((intelligence) => {
    const { opportunities = [], tabs = {} } = intelligence;
    
    // Only log opportunities once to avoid spam
    if (!window._opportunitiesLogged) {
      console.log('🎯 Rendering opportunities:', {
        count: opportunities.length,
        fullOpportunities: opportunities, // Show ALL opportunities
        hasTabsData: !!tabs,
        tabKeys: Object.keys(tabs)
      });
      console.log('📋 Full opportunity details:', JSON.stringify(opportunities, null, 2));
      window._opportunitiesLogged = true;
    }
    
    return (
      <div className="opportunities-content">
        <div className="opportunities-section">
          <h3>Strategic PR Opportunities</h3>
          {opportunities && opportunities.length > 0 ? (
            <div className="opportunities-grid">
              {opportunities.map((opp, idx) => (
                <div key={idx} className="opportunity-card">
                  <div className="opportunity-header">
                    <span className="opportunity-type">{opp.type || 'Strategic'}</span>
                    <span className="opportunity-urgency urgency-{opp.urgency || 'medium'}">
                      {opp.urgency || 'Medium'} Priority
                    </span>
                  </div>
                  <h4 className="opportunity-title">{opp.opportunity || opp.title || opp.description}</h4>
                  {opp.pr_angle && (
                    <div className="opportunity-angle">
                      <strong>PR Angle:</strong> {opp.pr_angle}
                    </div>
                  )}
                  {opp.quick_summary && (
                    <div className="opportunity-summary">{opp.quick_summary}</div>
                  )}
                  <div className="opportunity-meta">
                    <span className="opportunity-source">Source: {opp.source || opp.source_stage || 'Synthesis'}</span>
                    {opp.confidence && (
                      <span className="opportunity-confidence">Confidence: {opp.confidence}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-opportunities">
              <p>No PR opportunities identified in this analysis cycle.</p>
              <p className="help-text">
                Opportunities are generated from the synthesis of all intelligence stages. 
                They should appear here once the pipeline completes successfully.
              </p>
            </div>
          )}
        </div>
        
        {tabs.synthesis?.consolidated_opportunities?.prioritized_list && (
          <div className="opportunities-section">
            <h3>Consolidated Strategic Recommendations</h3>
            <div className="recommendations-list">
              {tabs.synthesis.consolidated_opportunities.prioritized_list.map((rec, idx) => (
                <div key={idx} className="recommendation-item">
                  <span className="rec-number">{idx + 1}.</span>
                  <span className="rec-text">{rec.opportunity || rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, []); // No dependencies, pure function

  // Run stages sequentially - ONLY ONCE per organization
  useEffect(() => {
    // Guard against running when already running or complete
    if (runningRef.current || completionRef.current) {
      return;
    }
    
    console.log('🎯 ELABORATE PIPELINE - Stage trigger check:', {
      hasOrganization: !!organization,
      hasStarted,
      currentStage,
      totalStages: INTELLIGENCE_STAGES.length,
      hasError: !!error,
      isComplete,
      completionRef: completionRef.current
    });
    
    // Don't run if already complete or no organization
    if (completionRef.current || !organization) {
      console.log('✅ Pipeline complete or no organization');
      return;
    }
    
    // Mark as started for the first stage
    if (currentStage === 0 && !hasStarted) {
      console.log('🚀 Starting pipeline for the first time');
      setHasStarted(true);
      // Immediately trigger the first stage with empty accumulated results
      runningRef.current = true;
      runStage(0, {}).then(results => {
        accumulatedResultsRef.current = results || {};
      }).finally(() => { runningRef.current = false; });
      return;
    }
    
    // Don't run stages if there's an error
    if (error) {
      console.log('❌ Pipeline has error, not running stage');
      return;
    }
    
    // Check if current stage is already running
    const currentStageId = INTELLIGENCE_STAGES[currentStage]?.id;
    if (currentStageId && stageResults[currentStageId]?.inProgress) {
      console.log(`⏳ Stage ${currentStage + 1} is already running`);
      return;
    }
    
    // Run the current stage if within bounds
    if (currentStage >= 0 && currentStage < INTELLIGENCE_STAGES.length && hasStarted) {
      console.log(`🚀 RUNNING STAGE ${currentStage + 1}: ${INTELLIGENCE_STAGES[currentStage].name}`);
      runningRef.current = true;
      // Pass accumulated results to each stage
      runStage(currentStage, accumulatedResultsRef.current).then(results => {
        accumulatedResultsRef.current = results || accumulatedResultsRef.current;
      }).finally(() => { runningRef.current = false; });
    } else if (currentStage >= INTELLIGENCE_STAGES.length && !isComplete && !completionRef.current) {
      console.log('🎉 All stages done, completing pipeline...');
      console.log('📊 Current state before completion:', {
        currentStage,
        totalStages: INTELLIGENCE_STAGES.length,
        isComplete,
        completionRefCurrent: completionRef.current,
        stageResultsCount: Object.keys(stageResults).length,
        accumulatedResultsCount: Object.keys(accumulatedResultsRef.current).length
      });
      
      // Use accumulated results ref which has the most complete data
      // This ensures synthesis stage results are included
      if (Object.keys(accumulatedResultsRef.current).length >= INTELLIGENCE_STAGES.length) {
        console.log('✅ All stage results accumulated, proceeding with completion');
        handleCompleteWithResults(accumulatedResultsRef.current);
      } else {
        console.log('⏳ Waiting for all stage results to accumulate...');
        // Set a slight delay to ensure synthesis results are captured
        setTimeout(() => {
          handleCompleteWithResults(accumulatedResultsRef.current);
        }, 1000);
      }
    }
  }, [currentStage, organization?.name, hasStarted]); // Removed isComplete to prevent circular dependency

  // Memoize tab content to prevent infinite re-renders
  // Must be before any conditional returns per React rules
  const intelligenceTabs = useMemo(() => {
    if (!finalIntelligence) return {};
    
    // Debug: Log the structure of finalIntelligence to understand what data we have
    if (!window._intelligenceStructureLogged) {
      console.log('🔍 Final Intelligence Structure:', {
        keys: Object.keys(finalIntelligence),
        hasOpportunities: !!finalIntelligence.opportunities,
        opportunityCount: finalIntelligence.opportunities?.length,
        hasTabs: !!finalIntelligence.tabs,
        tabKeys: finalIntelligence.tabs ? Object.keys(finalIntelligence.tabs) : [],
        hasPatterns: !!finalIntelligence.patterns,
        patternCount: finalIntelligence.patterns?.length,
        // Check what's actually in the tabs
        executiveTab: finalIntelligence.tabs?.executive ? Object.keys(finalIntelligence.tabs.executive).slice(0, 5) : 'no executive tab',
        competitiveTab: finalIntelligence.tabs?.competitive ? Object.keys(finalIntelligence.tabs.competitive).slice(0, 5) : 'no competitive tab',
        analysisKeys: finalIntelligence.analysis ? Object.keys(finalIntelligence.analysis).slice(0, 5) : 'no analysis'
      });
      window._intelligenceStructureLogged = true;
    }
    
    return {
      executive: {
        label: 'Executive Summary',
        icon: '📊',
        content: renderExecutiveSummary(finalIntelligence)
      },
      competitive: {
        label: 'Competitive Analysis',
        icon: '⚔️',
        content: renderCompetitiveAnalysis(finalIntelligence)
      },
      trending: {
        label: 'Trending Topics',
        icon: '📈',
        content: renderTrendingTopics(finalIntelligence)
      },
      stakeholders: {
        label: 'Stakeholders & Regulatory',
        icon: '👥',
        content: renderStakeholders(finalIntelligence)
      },
      signals: {
        label: 'Early Signals',
        icon: '🔮',
        content: renderEarlySignals(finalIntelligence)
      },
      opportunities: {
        label: 'PR Opportunities',
        icon: '🎯',
        content: renderOpportunities(finalIntelligence)
      }
    };
  }, [finalIntelligence, renderExecutiveSummary, renderCompetitiveAnalysis, 
      renderTrendingTopics, renderStakeholders, renderEarlySignals, renderOpportunities]); // Include render functions
  
  // Monitor completion state - only log once
  useEffect(() => {
    if (isComplete && finalIntelligence && !window._completionLogged) {
      console.log('🎨 RENDER TRIGGER: Both isComplete and finalIntelligence are set!');
      console.log('Final intelligence available:', {
        hasData: !!finalIntelligence,
        keys: finalIntelligence ? Object.keys(finalIntelligence) : [],
        tabCount: finalIntelligence?.tabs ? Object.keys(finalIntelligence.tabs).length : 0
      });
      window._completionLogged = true;
    }
  }, [isComplete, finalIntelligence]);

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
    // Removed console.log from render to prevent infinite loop
    
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
            {Object.entries(intelligenceTabs).map(([key, tab]) => (
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
            {intelligenceTabs[activeTab]?.content}
          </div>
          
          {/* Opportunity Engine Link - Separate from Intelligence */}
          {finalIntelligence.opportunities && finalIntelligence.opportunities.length > 0 && (
            <div className="opportunity-engine-link">
              <div className="separator-line" />
              <div className="opportunity-notice">
                <span className="notice-icon">💡</span>
                <span className="notice-text">
                  {finalIntelligence.opportunities.length} strategic opportunities identified. 
                  View in Opportunity Engine for actionable recommendations.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show elaborate pipeline progress
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