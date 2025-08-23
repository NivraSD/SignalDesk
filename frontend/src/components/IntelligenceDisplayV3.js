import React, { useState, useEffect } from 'react';
import './IntelligenceDisplayV3.css';
import intelligenceOrchestratorV3 from '../services/intelligenceOrchestratorV3';
import { 
  RocketIcon, AlertIcon, TrendingUpIcon, TargetIcon, 
  ChartIcon, BuildingIcon
} from './Icons/NeonIcons';

const IntelligenceDisplayV3 = ({ organization, refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState({
    gathering: 0,
    analysis: 0,
    synthesis: 0,
    preparing: 0
  });
  const [intelligence, setIntelligence] = useState(null);
  const [activeTab, setActiveTab] = useState('executive');
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 IntelligenceDisplayV3 mounted at:', new Date().toISOString());
    console.log('📊 Initial organization:', organization);
  }, []); // Only log on actual mount

  useEffect(() => {
    console.log('📊 V3 useEffect triggered:', {
      organization: organization,
      refreshTrigger: refreshTrigger,
      hasOrgName: !!organization?.name
    });
    fetchIntelligence();
  }, [organization, refreshTrigger]);

  const fetchIntelligence = async () => {
    console.log('🔍 V3 fetchIntelligence called, organization:', organization);
    
    // Try to get organization from multiple sources
    let orgToUse = organization;
    
    if (!orgToUse?.name) {
      console.log('⚠️ No organization name, checking localStorage...');
      
      // Check signaldesk_organization first
      const savedOrgDirect = localStorage.getItem('signaldesk_organization');
      if (savedOrgDirect) {
        try {
          orgToUse = JSON.parse(savedOrgDirect);
          console.log('📦 Found organization in signaldesk_organization:', orgToUse);
        } catch (e) {
          console.error('Error parsing signaldesk_organization:', e);
        }
      }
      
      // If still no org, check signaldesk_onboarding
      if (!orgToUse?.name) {
        const savedOnboarding = localStorage.getItem('signaldesk_onboarding');
        if (savedOnboarding) {
          try {
            const onboardingData = JSON.parse(savedOnboarding);
            if (onboardingData.organization?.name) {
              orgToUse = onboardingData.organization;
              console.log('📦 Found organization in signaldesk_onboarding:', orgToUse);
            }
          } catch (e) {
            console.error('Error parsing signaldesk_onboarding:', e);
          }
        }
      }
      
      // Last resort: default to Toyota
      if (!orgToUse?.name) {
        console.log('🏭 Using default organization: Toyota');
        orgToUse = {
          name: 'Toyota',
          industry: 'automotive'
        };
      }
    }
    
    setLoading(true);
    setError(null);
    setLoadingPhase('Gathering');
    setLoadingProgress(0);
    setPhaseProgress({ gathering: 0, analysis: 0, synthesis: 0, preparing: 0 });
    
    console.log('🚀 Starting V3 orchestration with:', orgToUse);
    
    // Start all progress bars animation with overlapping phases
    let elapsed = 0;
    const totalDuration = 24000; // 24 seconds total
    const phaseTimings = {
      gathering: { start: 0, end: 8000 },     // 0-8s
      analysis: { start: 4000, end: 14000 },  // 4-14s  (overlaps with gathering)
      synthesis: { start: 10000, end: 20000 }, // 10-20s (overlaps with analysis)
      preparing: { start: 16000, end: 24000 }  // 16-24s (overlaps with synthesis)
    };
    
    const progressInterval = setInterval(() => {
      elapsed += 100;
      
      // Update overall progress
      setLoadingProgress(Math.min(95, (elapsed / totalDuration) * 100));
      
      // Update phase progress bars
      setPhaseProgress(prev => {
        const newProgress = { ...prev };
        
        Object.keys(phaseTimings).forEach(phase => {
          const timing = phaseTimings[phase];
          if (elapsed >= timing.start && elapsed <= timing.end) {
            const phaseElapsed = elapsed - timing.start;
            const phaseDuration = timing.end - timing.start;
            newProgress[phase] = Math.min(100, (phaseElapsed / phaseDuration) * 100);
          } else if (elapsed > timing.end) {
            newProgress[phase] = 100;
          }
        });
        
        return newProgress;
      });
      
      // Update current phase label based on dominant activity
      if (elapsed < 6000) setLoadingPhase('Gathering Intelligence');
      else if (elapsed < 12000) setLoadingPhase('Analyzing Patterns');
      else if (elapsed < 18000) setLoadingPhase('Synthesizing Insights');
      else setLoadingPhase('Preparing Report');
      
      if (elapsed >= totalDuration) {
        clearInterval(progressInterval);
      }
    }, 100);
    
    try {
      const result = await intelligenceOrchestratorV3.orchestrate(orgToUse);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setPhaseProgress({ gathering: 100, analysis: 100, synthesis: 100, preparing: 100 });
      
      console.log('📦 V3 Orchestration result:', {
        success: result.success,
        hasTabsData: !!result.tabs,
        tabKeys: result.tabs ? Object.keys(result.tabs) : [],
        error: result.error
      });
      
      // Debug: Log ALL tab data to see structure
      console.log('📊 ALL Tab Data:', result.tabs);
      if (result.tabs) {
        Object.keys(result.tabs).forEach(tabKey => {
          console.log(`📌 Tab [${tabKey}]:`, result.tabs[tabKey]);
        });
      }
      
      if (result.success) {
        setIntelligence(result);
        // Auto-switch to executive tab if current tab doesn't exist
        if (!result.tabs?.[activeTab]) {
          console.log('🔄 Switching to executive tab');
          setActiveTab('executive');
        }
      } else {
        console.error('❌ Orchestration failed:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ V3 fetchIntelligence error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        organization: orgToUse
      });
      clearInterval(progressInterval);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'executive', name: 'Executive', Icon: RocketIcon, color: '#ff00ff' },
    { id: 'positioning', name: 'Your Position', Icon: TargetIcon, color: '#00ffcc' },
    { id: 'between', name: 'Between Lines', Icon: TrendingUpIcon, color: '#00ff88' },
    { id: 'thought', name: 'Thought Leaders', Icon: ChartIcon, color: '#ffcc00' },
    { id: 'regulatory', name: 'Regulatory', Icon: AlertIcon, color: '#ff6600' },
    { id: 'forward', name: 'Forward Look', Icon: BuildingIcon, color: '#8800ff' }
  ];

  const renderExecutiveSummaryTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-executive-summary-tab">
        <div className="executive-header">
          <h2 className="executive-headline">{data.headline || 'Strategic Intelligence Summary'}</h2>
          <p className="executive-overview">
            {data.overview || `Monitoring ${intelligence?.statistics?.entities_tracked || 0} entities and ${intelligence?.statistics?.topics_monitored || 0} trends across competitive, market, regulatory, and media landscapes.`}
          </p>
        </div>
        
        <div className="executive-highlights">
          <h3>Key Highlights</h3>
          <div className="highlights-grid">
            {data.competitive_highlight && (
              <div className="highlight-card competitive">
                <h4>Competitive</h4>
                <p>{data.competitive_highlight}</p>
              </div>
            )}
            {data.market_highlight && (
              <div className="highlight-card market">
                <h4>Market</h4>
                <p>{data.market_highlight}</p>
              </div>
            )}
            {data.regulatory_highlight && (
              <div className="highlight-card regulatory">
                <h4>Regulatory</h4>
                <p>{data.regulatory_highlight}</p>
              </div>
            )}
            {data.media_highlight && (
              <div className="highlight-card media">
                <h4>Media</h4>
                <p>{data.media_highlight}</p>
              </div>
            )}
          </div>
        </div>
        
        {data.narrative_watch_points && (
          <div className="executive-actions">
            <h3>Narrative Watch Points</h3>
            <ol>
              {data.narrative_watch_points.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };
  
  const renderCompetitivePositioningTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-segment-tab positioning">
        {data.your_position && (
          <div className="segment-section highlight-section">
            <h3 className="section-title"><span className="neon-icon">⬢</span> Your Strategic Position</h3>
            <div className="narrative-content">
              <p>{data.your_position}</p>
            </div>
          </div>
        )}
        
        <div className="segment-section">
          <h3 className="section-title"><span className="neon-icon">◆</span> Competitor Moves & Signals</h3>
          <div className="intelligence-items">
            {data.competitor_moves?.map((move, idx) => (
              <div key={idx} className="intelligence-item strategic">
                <div className="item-entity">{move.competitor}</div>
                <div className="item-action">{move.action}</div>
                {move.personnel_signals && (
                  <div className="item-signals">💭 Personnel: {move.personnel_signals}</div>
                )}
                {move.what_theyre_not_saying && (
                  <div className="item-omissions">🤐 Not saying: {move.what_theyre_not_saying}</div>
                )}
                {move.differentiation_opportunity && (
                  <div className="item-opportunity">🎯 Your opportunity: {move.differentiation_opportunity}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {data.narrative_gaps && (
          <div className="segment-section opportunity-section">
            <h3 className="section-title"><span className="neon-icon">◉</span> Narrative Gaps You Could Own</h3>
            <div className="narrative-content">
              <p>{data.narrative_gaps}</p>
            </div>
          </div>
        )}
        
        {data.strategic_white_space && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">⟡</span> Unclaimed Territory</h3>
            <div className="narrative-content">
              <p>{data.strategic_white_space}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBetweenTheLinesTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-segment-tab between-lines">
        <div className="segment-section">
          <h3 className="section-title"><span className="neon-icon">👁</span> Hidden Signals</h3>
          <div className="intelligence-items">
            {data.hidden_signals?.map((signal, idx) => (
              <div key={idx} className="intelligence-item signal">
                <div className="signal-header">{signal.signal}</div>
                <div className="signal-source">📍 {signal.source}</div>
                <div className="signal-meaning">💡 {signal.why_it_matters}</div>
                <div className="signal-implication">🎯 {signal.strategic_implication}</div>
              </div>
            ))}
          </div>
        </div>
        
        {data.executive_tea_leaves && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">🍃</span> Executive Tea Leaves</h3>
            <div className="narrative-content">
              <p>{data.executive_tea_leaves}</p>
            </div>
          </div>
        )}
        
        {data.connecting_dots && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">🔗</span> Connecting the Dots</h3>
            <div className="narrative-content">
              <p>{data.connecting_dots}</p>
            </div>
          </div>
        )}
        
        {data.contrarian_view && (
          <div className="segment-section contrarian">
            <h3 className="section-title"><span className="neon-icon">🔄</span> Contrarian View</h3>
            <div className="narrative-content">
              <p>{data.contrarian_view}</p>
            </div>
          </div>
        )}
        
        {data.early_warnings && (
          <div className="segment-section warning">
            <h3 className="section-title"><span className="neon-icon">⚠️</span> Early Warning Signals</h3>
            <div className="narrative-content">
              <p>{data.early_warnings}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderThoughtLeadershipTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-segment-tab thought-leadership">
        <div className="segment-section">
          <h3 className="section-title"><span className="neon-icon">🎙</span> Influencer Signals</h3>
          <div className="intelligence-items">
            {data.influencer_signals?.map((signal, idx) => (
              <div key={idx} className="intelligence-item influencer">
                <div className="influencer-name">{signal.influencer}</div>
                <div className="influencer-signal">"{signal.signal}"</div>
                <div className="signal-platform">📍 {signal.platform}</div>
                <div className="signal-subtext">🔍 {signal.subtext}</div>
                <div className="signal-impact">💫 {signal.impact}</div>
              </div>
            ))}
          </div>
        </div>
        
        {data.executive_commentary && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">💬</span> Executive Commentary</h3>
            <div className="narrative-content">
              <p>{data.executive_commentary}</p>
            </div>
          </div>
        )}
        
        {data.thought_leader_consensus && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">🤝</span> Consensus vs Divergence</h3>
            <div className="narrative-content">
              <p>{data.thought_leader_consensus}</p>
            </div>
          </div>
        )}
        
        {data.contrarian_voices && (
          <div className="segment-section contrarian">
            <h3 className="section-title"><span className="neon-icon">🗣</span> Contrarian Voices</h3>
            <div className="narrative-content">
              <p>{data.contrarian_voices}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Keep the old renderCompetitiveTab for backward compatibility
  const renderCompetitiveTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-segment-tab competitive">
        <div className="segment-section">
          <h3 className="section-title"><span className="neon-icon">◆</span> Competitor Actions</h3>
          <div className="intelligence-items">
            {data.competitor_positioning?.map((action, idx) => (
              <div key={idx} className="intelligence-item">
                <div className="item-entity">{action.competitor}</div>
                <div className="item-action">{action.action}</div>
                <div className="item-details">{action.narrative_impact}</div>
              </div>
            ))}
          </div>
        </div>
        
        {data.narrative_implications && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">▶</span> Narrative Implications</h3>
            <div className="narrative-content">
              <p>{data.narrative_implications}</p>
            </div>
          </div>
        )}
        
        {data.perception_dynamics && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">⟐</span> Perception Dynamics</h3>
            <div className="narrative-content">
              <p>{data.perception_dynamics}</p>
            </div>
          </div>
        )}
        
        {data.reputation_considerations && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">⬢</span> Reputation Considerations</h3>
            <div className="narrative-content">
              <p>{data.reputation_considerations}</p>
            </div>
          </div>
        )}
        
        {data.narrative_positions?.length > 0 && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">▣</span> Narrative Positions</h3>
            <ul className="strategic-options">
              {data.narrative_positions.map((position, idx) => (
                <li key={idx}>{position}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  const renderNarrativeTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-narrative-tab">
        <div className="narrative-header">
          <h2 className="narrative-headline">Current Narrative Landscape</h2>
          <p className="narrative-summary">
            Analyzing {intelligence?.statistics?.entities_tracked || 0} entities and {intelligence?.statistics?.topics_monitored || 0} trending topics 
            to understand narrative control and messaging opportunities.
          </p>
        </div>
        
        {data.dominant_narratives && (
          <div className="dominant-narratives">
            <h3>Dominant Narratives</h3>
            {data.dominant_narratives.map((narrative, idx) => (
              <div key={idx} className="narrative-item">
                <div className="narrative-theme">{narrative.theme}</div>
                <div className="narrative-drivers">Driven by: {narrative.drivers.join(', ')}</div>
                <div className="our-position">
                  <span className="label">Our Position:</span>
                  <span className={`position ${narrative.our_position}`}>{narrative.our_position}</span>
                </div>
                {narrative.action_needed && (
                  <div className="pr-action">PR Action: {narrative.pr_response}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {data.narrative_threats && (
          <div className="narrative-threats">
            <h3>Narrative Threats</h3>
            {data.narrative_threats.map((threat, idx) => (
              <div key={idx} className="threat-card">
                <div className="threat-description">{threat.description}</div>
                <div className="threat-source">Source: {threat.source}</div>
                <div className="counter-message">Counter: {threat.counter_narrative}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderExecutiveTab = (data) => {
    if (!data) return null;
    
    const riskColors = {
      immediate: '#ff0064',
      high: '#ff6600',
      medium: '#ffcc00',
      low: '#00ff88'
    };
    
    // Synthesize information from ALL tabs if strategic data is missing
    const synthesizedHeadline = data.strategic_headline || 
      `Strategic Update: ${intelligence?.statistics?.entities_tracked || 0} entities tracked, ${intelligence?.statistics?.actions_captured || 0} actions detected`;
    
    const synthesizedSummary = data.strategic_summary || 
      `Monitoring ${intelligence?.statistics?.entities_tracked || 0} key entities across competitors, regulators, and stakeholders. ` +
      `${intelligence?.statistics?.actions_captured || 0} significant actions detected with ${intelligence?.statistics?.critical_items || 0} requiring attention. ` +
      `Market trends show ${intelligence?.statistics?.topics_monitored || 0} active topics being tracked for strategic implications.`;
    
    return (
      <div className="v3-executive-tab">
        <h2 className="executive-headline">{synthesizedHeadline}</h2>
        <p className="executive-summary">{synthesizedSummary}</p>
        
        {data.key_insights && (
          <div className="key-insights">
            <h3>Key Strategic Insights</h3>
            <ul>
              {data.key_insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
        )}
        
        {data.situation_assessment && (
          <div className="situation-assessment">
            <h3>Situation Assessment</h3>
            <div className="assessment-grid">
              <div className="assessment-item">
                <span className="label">Competitive Position:</span>
                <span className="value">{data.situation_assessment.position}</span>
              </div>
              <div className="assessment-item">
                <span className="label">Market Momentum:</span>
                <span className="value">{data.situation_assessment.momentum}</span>
              </div>
              <div className="assessment-item">
                <span className="label">Risk Level:</span>
                <span className="value" style={{ color: riskColors[data.situation_assessment.risk_level] || '#00ff88' }}>
                  {data.situation_assessment.risk_level}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {data.immediate_priorities && (
          <div className="immediate-priorities">
            <h3>Immediate Priorities</h3>
            <ol>
              {data.immediate_priorities.map((priority, idx) => (
                <li key={idx}>{priority}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  const renderEntitiesTab = (data) => {
    if (!data) return null;
    
    const totalEntities = 
      (data.competitor_actions?.length || 0) + 
      (data.regulatory_developments?.length || 0) + 
      (data.stakeholder_positions?.length || 0);
    
    return (
      <div className="v3-entities-tab">
        <div className="entities-overview">
          <p className="entities-context">
            Tracking {totalEntities} key entity movements across competitors, regulators, and stakeholders. 
            These actions directly impact market dynamics and strategic positioning.
          </p>
        </div>
        {data.competitor_actions?.length > 0 && (
          <div className="entity-section">
            <h3>Competitor Actions</h3>
            <div className="entity-cards">
              {data.competitor_actions.map((action, idx) => (
                <div key={idx} className="entity-action-card competitor">
                  <div className="entity-name">{action.entity}</div>
                  <div className="entity-action">{action.action}</div>
                  <div className="strategic-impact">{action.strategic_impact}</div>
                  {action.response_needed !== 'monitor only' && (
                    <div className="response-needed">{action.response_needed}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.regulatory_developments?.length > 0 && (
          <div className="entity-section">
            <h3>Regulatory Developments</h3>
            <div className="entity-cards">
              {data.regulatory_developments.map((dev, idx) => (
                <div key={idx} className="entity-action-card regulatory">
                  <div className="entity-name">{dev.entity}</div>
                  <div className="entity-action">{dev.development}</div>
                  <div className="compliance-impact">{dev.compliance_impact}</div>
                  <div className="timeline">{dev.timeline}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.stakeholder_positions?.length > 0 && (
          <div className="entity-section">
            <h3>Stakeholder Positions</h3>
            <div className="entity-cards">
              {data.stakeholder_positions.map((stake, idx) => (
                <div key={idx} className="entity-action-card stakeholder">
                  <div className="entity-name">{stake.entity}</div>
                  <div className="entity-position">{stake.position}</div>
                  <div className="influence-level">Influence: {stake.influence_level}</div>
                  <div className="engagement-strategy">{stake.engagement_strategy}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMarketTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-market-tab">
        <div className="market-overview">
          <p className="market-context">
            Current market intelligence reveals {data.trending_opportunities?.length || 0} emerging opportunities 
            and {data.emerging_risks?.length || 0} potential risks that could impact strategic positioning.
          </p>
        </div>
        
        {data.trending_opportunities?.length > 0 && (
          <div className="market-section">
            <h3>Emerging Opportunities</h3>
            <div className="opportunity-cards">
              {data.trending_opportunities.map((opp, idx) => (
                <div key={idx} className="opportunity-card">
                  <div className="trend-name">{opp.trend}</div>
                  <div className="opportunity">{opp.opportunity}</div>
                  <div className="timing">Timing: {opp.timing}</div>
                  {opp.first_mover_advantage && (
                    <div className="first-mover">⚡ First Mover Advantage</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.emerging_risks?.length > 0 && (
          <div className="market-section">
            <h3>Emerging Risks</h3>
            <div className="risk-cards">
              {data.emerging_risks.map((risk, idx) => (
                <div key={idx} className={`risk-card probability-${risk.probability}`}>
                  <div className="risk-name">{risk.risk}</div>
                  <div className="risk-impact">{risk.impact}</div>
                  <div className="risk-probability">Probability: {risk.probability}</div>
                  <div className="mitigation">{risk.mitigation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStrategyTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-strategy-tab">
        <div className="strategy-overview">
          <p className="strategy-context">
            Based on current intelligence, {data.recommendations?.length || 0} strategic actions recommended 
            to maintain competitive advantage and respond to market movements.
          </p>
        </div>
        {data.recommendations?.length > 0 && (
          <div className="recommendations-section">
            <h3>Strategic Recommendations</h3>
            <div className="recommendations-list">
              {data.recommendations.map((rec, idx) => (
                <div key={idx} className="recommendation-card">
                  <div className="priority-badge">Priority {rec.priority}</div>
                  <div className="action">{rec.action}</div>
                  <div className="rationale">{rec.rationale}</div>
                  <div className="meta">
                    <span className="owner">Owner: {rec.owner}</span>
                    <span className="timeline">Timeline: {rec.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.positioning && (
          <div className="positioning-section">
            <h3>Competitive Positioning</h3>
            <div className="positioning-card">
              <div className="position-status">
                <div className="label">Current Position</div>
                <div className="value">{data.positioning.current_position}</div>
              </div>
              <div className="position-metrics">
                <div className="metric">
                  <span>Narrative Control:</span>
                  <span className={`status ${data.positioning.narrative_control}`}>
                    {data.positioning.narrative_control}
                  </span>
                </div>
                <div className="metric">
                  <span>Momentum:</span>
                  <span className={`status ${data.positioning.momentum}`}>
                    {data.positioning.momentum}
                  </span>
                </div>
              </div>
              {data.positioning.key_advantages?.length > 0 && (
                <div className="advantages">
                  <h4>Key Advantages</h4>
                  <ul>
                    {data.positioning.key_advantages.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.positioning.vulnerabilities?.length > 0 && (
                <div className="vulnerabilities">
                  <h4>Vulnerabilities</h4>
                  <ul>
                    {data.positioning.vulnerabilities.map((vul, idx) => (
                      <li key={idx}>{vul}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResponseTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-response-tab">
        <div className="response-header">
          <h3>PR Response Priorities</h3>
          <p>Items requiring immediate communications response or monitoring.</p>
        </div>
        
        {data.immediate_responses?.length > 0 && (
          <div className="immediate-section">
            <h4 className="urgency-high">⚡ Immediate Response Required</h4>
            {data.immediate_responses.map((item, idx) => (
              <div key={idx} className="response-item urgent">
                <div className="response-trigger">{item.trigger}</div>
                <div className="response-recommendation">
                  <strong>Recommended Response:</strong> {item.response}
                </div>
                <div className="response-channels">Channels: {item.channels.join(', ')}</div>
                <div className="response-timeline">Timeline: {item.timeline}</div>
              </div>
            ))}
          </div>
        )}
        
        {data.monitor_only?.length > 0 && (
          <div className="monitor-section">
            <h4>👁 Monitor Only</h4>
            {data.monitor_only.map((item, idx) => (
              <div key={idx} className="response-item monitor">
                <div className="monitor-item">{item.description}</div>
                <div className="monitor-reason">Why monitor: {item.reason}</div>
                <div className="escalation-trigger">Escalate if: {item.escalation_trigger}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderMessagingTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-messaging-tab">
        <div className="messaging-header">
          <h3>Messaging Opportunities</h3>
          <p>Openings to advance our narrative and key messages.</p>
        </div>
        
        {data.opportunities?.map((opp, idx) => (
          <div key={idx} className="messaging-opportunity">
            <div className="opp-context">{opp.context}</div>
            <div className="opp-message">
              <strong>Our Message:</strong> {opp.message}
            </div>
            <div className="opp-talking-points">
              <strong>Key Talking Points:</strong>
              <ul>
                {opp.talking_points?.map((point, pidx) => (
                  <li key={pidx}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="opp-timing">Best Timing: {opp.timing}</div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderStakeholdersTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-stakeholders-tab">
        <div className="stakeholders-header">
          <h3>Stakeholder Sentiment & Positioning</h3>
        </div>
        
        {data.stakeholder_groups?.map((group, idx) => (
          <div key={idx} className="stakeholder-group">
            <h4>{group.name}</h4>
            <div className="sentiment-indicator">
              Sentiment: <span className={`sentiment ${group.sentiment}`}>{group.sentiment}</span>
            </div>
            <div className="key-concerns">Key Concerns: {group.concerns.join(', ')}</div>
            <div className="messaging-approach">
              Messaging Approach: {group.messaging_approach}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderMarketSegmentTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-segment-tab market">
        <div className="segment-section">
          <h3 className="section-title"><span className="neon-icon">◈</span> Trend Narratives</h3>
          <div className="intelligence-items">
            {data.trend_narratives?.map((trend, idx) => (
              <div key={idx} className="intelligence-item">
                <div className="item-trend">{trend.trend}</div>
                <div className="item-details">{trend.narrative}</div>
                <div className="item-momentum">Momentum: {trend.momentum} | Attention: {trend.attention_level}</div>
              </div>
            ))}
          </div>
        </div>
        
        {data.narrative_analysis && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">▶</span> Narrative Analysis</h3>
            <div className="narrative-content">
              <p>{data.narrative_analysis}</p>
            </div>
          </div>
        )}
        
        {data.perception_opportunities && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">◉</span> Perception Opportunities</h3>
            <div className="narrative-content">
              <p>{data.perception_opportunities}</p>
            </div>
          </div>
        )}
        
        {data.narrative_evolution && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">↗</span> Narrative Evolution</h3>
            <div className="narrative-content">
              <p>{data.narrative_evolution}</p>
            </div>
          </div>
        )}
        
        {data.reputation_landscape && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">⬡</span> Reputation Landscape</h3>
            <div className="narrative-content">
              <p>{data.reputation_landscape}</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderRegulatoryTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-segment-tab regulatory">
        {data.regulatory_narrative && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">⊞</span> Regulatory Narrative</h3>
            <div className="narrative-content">
              <p>{data.regulatory_narrative}</p>
            </div>
          </div>
        )}
        
        <div className="segment-section">
          <h3 className="section-title"><span className="neon-icon">◆</span> Regulatory Developments</h3>
          <div className="intelligence-items">
            {data.regulatory_developments?.map((dev, idx) => (
              <div key={idx} className="intelligence-item">
                <div className="item-entity">{dev.regulator}</div>
                <div className="item-action">{dev.development}</div>
                {dev.perception_impact && (
                  <div className="item-impact">Perception: {dev.perception_impact}</div>
                )}
                {dev.reputation_effect && (
                  <div className="item-impact">{dev.reputation_effect}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {data.narrative_implications && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">▶</span> Narrative Implications</h3>
            <div className="narrative-content">
              <p>{data.narrative_implications}</p>
            </div>
          </div>
        )}
        
        {data.perception_landscape && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">◎</span> Perception Landscape</h3>
            <div className="narrative-content">
              <p>{data.perception_landscape}</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderMediaTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-segment-tab media">
        {data.narrative_landscape && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">⬢</span> Narrative Landscape</h3>
            <div className="narrative-content">
              <p>{data.narrative_landscape}</p>
            </div>
          </div>
        )}
        
        <div className="segment-section">
          <h3 className="section-title"><span className="neon-icon">◆</span> Media Coverage</h3>
          <div className="intelligence-items">
            {data.media_coverage?.map((coverage, idx) => (
              <div key={idx} className="intelligence-item">
                <div className="item-source">{coverage.outlet}</div>
                <div className="item-headline">{coverage.topic}</div>
                <div className="item-sentiment">Sentiment: {coverage.sentiment}</div>
                <div className="item-narrative">{coverage.narrative}</div>
                <div className="item-reach">Influence: {coverage.influence}</div>
              </div>
            ))}
          </div>
        </div>
        
        {data.perception_analysis && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">◈</span> Perception Analysis</h3>
            <div className="narrative-content">
              <p>{data.perception_analysis}</p>
            </div>
          </div>
        )}
        
        {data.reputation_implications && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">▶</span> Reputation Implications</h3>
            <div className="narrative-content">
              <p>{data.reputation_implications}</p>
            </div>
          </div>
        )}
        
        {data.narrative_considerations && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">◎</span> Narrative Considerations</h3>
            <div className="narrative-content">
              <p>{data.narrative_considerations}</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderForwardTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-segment-tab forward">
        {data.future_narratives && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">⟡</span> Future Narratives</h3>
            <div className="narrative-content">
              <p>{data.future_narratives}</p>
            </div>
          </div>
        )}
        
        <div className="segment-section">
          <h3 className="section-title"><span className="neon-icon">◆</span> Narrative Predictions</h3>
          <div className="intelligence-items">
            {data.narrative_predictions?.map((pred, idx) => (
              <div key={idx} className="intelligence-item prediction">
                <div className="item-timeframe">{pred.timeframe}</div>
                <div className="item-prediction">{pred.narrative_shift}</div>
                <div className="item-probability">Likelihood: {pred.likelihood}%</div>
                <div className="item-indicators">Signals: {pred.signals}</div>
                {pred.reputation_impact && (
                  <div className="item-implications">{pred.reputation_impact}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {data.perception_scenarios && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">▶</span> Perception Scenarios</h3>
            <div className="narrative-content">
              <p>{data.perception_scenarios}</p>
            </div>
          </div>
        )}
        
        {data.narrative_preparation && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">⬢</span> Narrative Preparation</h3>
            <div className="narrative-content">
              <p>{data.narrative_preparation}</p>
            </div>
          </div>
        )}
        
        {data.reputation_considerations && (
          <div className="segment-section">
            <h3 className="section-title"><span className="neon-icon">✦</span> Reputation Considerations</h3>
            <div className="narrative-content">
              <p>{data.reputation_considerations}</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderTomorrowTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-tomorrow-tab">
        <div className="tomorrow-header">
          <h3>Tomorrow's Headlines</h3>
          <p>Anticipated developments requiring PR preparation.</p>
        </div>
        
        {data.anticipated_headlines?.map((headline, idx) => (
          <div key={idx} className="future-headline">
            <div className="headline-text">{headline.headline}</div>
            <div className="headline-probability">Probability: {headline.probability}%</div>
            <div className="pr-preparation">
              <strong>PR Preparation:</strong>
              <ul>
                {headline.preparation_steps?.map((step, sidx) => (
                  <li key={sidx}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="draft-statement">
              <strong>Draft Statement:</strong> {headline.draft_statement}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderPredictionsTab = (data) => {
    if (!data) {
      return (
        <div className="v3-predictions-tab">
          <div className="predictions-placeholder">
            <h3>Predictive Analysis Loading...</h3>
            <p>Cascade predictions and second-order effects will appear here once analysis completes.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="v3-predictions-tab">
        {data.cascades?.length > 0 && (
          <div className="cascades-section">
            <h3>Potential Cascades</h3>
            <div className="cascade-cards">
              {data.cascades.map((cascade, idx) => (
                <div key={idx} className="cascade-card">
                  <div className="cascade-trigger">
                    <span className="trigger-label">If:</span> {cascade.trigger}
                  </div>
                  <div className="cascade-arrow">→</div>
                  <div className="cascade-effects">
                    <span className="effect-label">Then:</span>
                    <ul>
                      {cascade.effects.map((effect, eidx) => (
                        <li key={eidx}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="cascade-probability">
                    Probability: <span className={`prob-${cascade.probability}`}>{cascade.probability}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.predictions?.length > 0 && (
          <div className="predictions-section">
            <h3>Strategic Predictions</h3>
            <div className="prediction-timeline">
              {data.predictions.map((pred, idx) => (
                <div key={idx} className="prediction-item">
                  <div className="prediction-timeframe">{pred.timeframe}</div>
                  <div className="prediction-content">
                    <div className="prediction-what">{pred.prediction}</div>
                    <div className="prediction-basis">Based on: {pred.basis}</div>
                    <div className="prediction-confidence">
                      Confidence: <span className={`conf-${pred.confidence}`}>{pred.confidence}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.second_order_effects?.length > 0 && (
          <div className="second-order-section">
            <h3>Second-Order Effects</h3>
            <div className="effects-list">
              {data.second_order_effects.map((effect, idx) => (
                <div key={idx} className="second-order-item">
                  <div className="effect-primary">{effect.primary_change}</div>
                  <div className="effect-secondary">
                    <span className="arrow">⟹</span>
                    {effect.secondary_impact}
                  </div>
                  <div className="effect-action">
                    Recommended action: {effect.recommended_action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    if (!intelligence?.tabs) {
      console.log('⚠️ No tabs data in intelligence');
      return <div>No intelligence data available</div>;
    }
    
    const tabData = intelligence.tabs[activeTab];
    console.log(`🎨 Rendering tab [${activeTab}] with data:`, tabData);
    
    switch (activeTab) {
      case 'executive':
        return renderExecutiveSummaryTab(tabData);
      case 'positioning':
        return renderCompetitivePositioningTab(tabData);
      case 'between':
        return renderBetweenTheLinesTab(tabData);
      case 'market':
        return renderMarketSegmentTab(tabData);
      case 'regulatory':
        return renderRegulatoryTab(tabData);
      case 'thought':
        return renderThoughtLeadershipTab(tabData);
      case 'forward':
        return renderForwardTab(tabData);
      
      // Keep PR-focused tabs as fallback
      case 'narrative':
        return renderNarrativeTab(tabData);
      case 'response':
        return renderResponseTab(tabData);
      case 'messaging':
        return renderMessagingTab(tabData);
      case 'stakeholders':
        return renderStakeholdersTab(tabData);
      case 'tomorrow':
        return renderTomorrowTab(tabData);
      case 'entities':
        return renderEntitiesTab(tabData);
      case 'strategy':
        return renderStrategyTab(tabData);
      case 'predictions':
        return renderPredictionsTab(tabData);
      default:
        return <div>No data available for this tab</div>;
    }
  };

  if (loading) {
    return (
      <div className="intelligence-display-v3 loading">
        <div className="intelligence-loading-container">
          <div className="intelligence-header">
            <h2 className="intelligence-title">INTELLIGENCE PROCESSING</h2>
            <div className="current-phase">{loadingPhase.toUpperCase()}</div>
          </div>
          
          <div className="phase-progress-grid">
            <div className={`phase-card ${phaseProgress.gathering > 0 ? 'active' : ''}`}>
              <div className="phase-header">
                <span className="phase-icon">📡</span>
                <span className="phase-label">GATHERING</span>
                <span className="phase-percent">{Math.round(phaseProgress.gathering)}%</span>
              </div>
              <div className="phase-track">
                <div className="phase-fill gathering" style={{ width: `${phaseProgress.gathering}%` }}></div>
              </div>
              <div className="phase-status">
                {phaseProgress.gathering === 100 ? 'COMPLETE' : phaseProgress.gathering > 0 ? 'PROCESSING' : 'PENDING'}
              </div>
            </div>
            
            <div className={`phase-card ${phaseProgress.analysis > 0 ? 'active' : ''}`}>
              <div className="phase-header">
                <span className="phase-icon">🔍</span>
                <span className="phase-label">ANALYSIS</span>
                <span className="phase-percent">{Math.round(phaseProgress.analysis)}%</span>
              </div>
              <div className="phase-track">
                <div className="phase-fill analysis" style={{ width: `${phaseProgress.analysis}%` }}></div>
              </div>
              <div className="phase-status">
                {phaseProgress.analysis === 100 ? 'COMPLETE' : phaseProgress.analysis > 0 ? 'PROCESSING' : 'PENDING'}
              </div>
            </div>
            
            <div className={`phase-card ${phaseProgress.synthesis > 0 ? 'active' : ''}`}>
              <div className="phase-header">
                <span className="phase-icon">🧠</span>
                <span className="phase-label">SYNTHESIS</span>
                <span className="phase-percent">{Math.round(phaseProgress.synthesis)}%</span>
              </div>
              <div className="phase-track">
                <div className="phase-fill synthesis" style={{ width: `${phaseProgress.synthesis}%` }}></div>
              </div>
              <div className="phase-status">
                {phaseProgress.synthesis === 100 ? 'COMPLETE' : phaseProgress.synthesis > 0 ? 'PROCESSING' : 'PENDING'}
              </div>
            </div>
            
            <div className={`phase-card ${phaseProgress.preparing > 0 ? 'active' : ''}`}>
              <div className="phase-header">
                <span className="phase-icon">📊</span>
                <span className="phase-label">PREPARING</span>
                <span className="phase-percent">{Math.round(phaseProgress.preparing)}%</span>
              </div>
              <div className="phase-track">
                <div className="phase-fill preparing" style={{ width: `${phaseProgress.preparing}%` }}></div>
              </div>
              <div className="phase-status">
                {phaseProgress.preparing === 100 ? 'COMPLETE' : phaseProgress.preparing > 0 ? 'PROCESSING' : 'PENDING'}
              </div>
            </div>
          </div>
          
          <div className="processing-stats">
            <div className="stat-item">
              <span className="stat-label">Processing Speed</span>
              <span className="stat-value">2.4 TB/s</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sources Analyzed</span>
              <span className="stat-value">{Math.round(loadingProgress * 12.5)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pattern Recognition</span>
              <span className="stat-value active">ACTIVE</span>
            </div>
          </div>
          
          <p className="loading-message">Powered by Claude Sonnet 4 Intelligence Engine</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intelligence-display-v3 error">
        <AlertIcon size={24} color="#ff0064" />
        <p>Intelligence gathering failed: {error}</p>
        <button onClick={fetchIntelligence}>Retry</button>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className="intelligence-display-v3 empty">
        <p>No intelligence data available</p>
      </div>
    );
  }

  return (
    <div className="intelligence-display-v3">
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--tab-color': tab.color }}
          >
            <tab.Icon size={18} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
      
      <div className="intelligence-footer">
        <div className="statistics">
          <span>Entities: {intelligence.statistics?.entities_tracked || 0}</span>
          <span>Actions: {intelligence.statistics?.actions_captured || 0}</span>
          <span>Topics: {intelligence.statistics?.topics_monitored || 0}</span>
          <span>Critical: {intelligence.statistics?.critical_items || 0}</span>
        </div>
        <div className="timestamp">
          Last updated: {new Date(intelligence.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceDisplayV3;