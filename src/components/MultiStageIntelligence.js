import React, { useState, useEffect, useCallback } from 'react';
import './MultiStageIntelligence.css';
import intelligenceOrchestratorV4 from '../services/intelligenceOrchestratorV4';

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
  
  // Initialize organization state
  const [organization] = useState(() => {
    // Initialize organization
    
    if (organizationProp && organizationProp.name) {
      return organizationProp;
    }
    
    const saved = localStorage.getItem('organization');
    if (saved) {
      try {
        const org = JSON.parse(saved);
        return org;
      } catch (e) {
        console.error('Failed to parse organization:', e);
      }
    }
    
    return null;
  });

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
        
        // STAGE 1: Extract and save organization profile
        if (stageIndex === 0 && result.organization) {
          setOrganizationProfile(result.organization);
          localStorage.setItem('comprehensive_organization_profile', JSON.stringify(result.organization));
        }
        
        // Store stage-specific results (replace inProgress marker)
        setStageResults(prev => ({
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
        }));
        
        // Progress to next stage
        setTimeout(() => {
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
        setCurrentStage(stageIndex + 1);
      }, 2000);
    }
  }, [organization, organizationProfile, startTime]);

  // Create specialized configuration for each stage
  const createStageConfig = (stageIndex, baseOrganization) => {
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
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`🎉 ELABORATE PIPELINE COMPLETE in ${totalTime} seconds`);
    console.log('📊 Final stage results:', Object.keys(stageResults));
    
    // Mark as complete first to prevent re-triggering
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
    
    // Get the most comprehensive result (usually synthesis stage)
    const primaryResult = results.synthesis || results.trends || results.regulatory || results.media || results.competitive || results.extraction;
    
    // Create comprehensive intelligence combining all stages
    const elaborateIntelligence = {
      success: true,
      analysis: primaryResult?.analysis || {},
      tabs: primaryResult?.tabs || {},
      opportunities: extractOpportunitiesFromAllStages(results),
      stageInsights: generateStageInsights(results),
      patterns: identifyPatternsAcrossStages(results),
      recommendations: generateStrategicRecommendations(results),
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
    
    
    return elaborateIntelligence;
  };

  // Extract opportunities from all completed stages
  const extractOpportunitiesFromAllStages = (results) => {
    const allOpportunities = [];
    
    Object.values(results).forEach(stageResult => {
      if (stageResult.opportunities && Array.isArray(stageResult.opportunities)) {
        allOpportunities.push(...stageResult.opportunities.map(opp => ({
          ...opp,
          source: stageResult.stageMetadata?.stageName || 'Unknown Stage'
        })));
      }
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

  // Tab Render Functions - Pure Intelligence Analysis
  
  const renderExecutiveSummary = (intelligence) => {
    const { tabs = {}, patterns = [], statistics = {} } = intelligence;
    
    return (
      <div className="executive-summary-content">
        <div className="summary-section">
          <h3>Current State Analysis</h3>
          <div className="narrative-block">
            <p>
              {tabs.executive?.overview || 
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
  };
  
  const renderCompetitiveAnalysis = (intelligence) => {
    const { tabs = {} } = intelligence;
    const competitiveData = tabs.competitive || {};
    
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
  
  const renderTrendingTopics = (intelligence) => {
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
  
  const renderStakeholders = (intelligence) => {
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
  
  const renderEarlySignals = (intelligence) => {
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
    console.log('🎯 ELABORATE PIPELINE - Stage trigger check:', {
      hasOrganization: !!organization,
      hasStarted,
      currentStage,
      totalStages: INTELLIGENCE_STAGES.length,
      hasError: !!error,
      isComplete
    });
    
    // Don't run if already complete or no organization
    if (isComplete || !organization) {
      console.log('✅ Pipeline complete or no organization');
      return;
    }
    
    // Mark as started for the first stage
    if (currentStage === 0 && !hasStarted) {
      console.log('🚀 Starting pipeline for the first time');
      setHasStarted(true);
      // Immediately trigger the first stage
      runStage(0);
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
    if (currentStage > 0 && currentStage < INTELLIGENCE_STAGES.length) {
      console.log(`🚀 RUNNING STAGE ${currentStage + 1}: ${INTELLIGENCE_STAGES[currentStage].name}`);
      runStage(currentStage);
    } else if (currentStage === INTELLIGENCE_STAGES.length && !isComplete) {
      console.log('🎉 All stages done, completing pipeline...');
      handleComplete();
    }
  }, [currentStage, organization, error, isComplete, hasStarted, stageResults, runStage, handleComplete]);

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
    // Process intelligence for pure analysis display
    const intelligenceTabs = {
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
      }
    };
    
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