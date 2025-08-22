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
  const [intelligence, setIntelligence] = useState(null);
  const [activeTab, setActiveTab] = useState('executive');
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 IntelligenceDisplayV3 mounted with organization:', organization);
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
    setLoadingPhase('Discovery');
    setLoadingProgress(0);
    
    console.log('🚀 Starting V3 orchestration with:', orgToUse);
    
    // Simulate progress through phases
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 2, 95));
    }, 200);
    
    // Update phases based on timing
    const gatheringTimeout = setTimeout(() => setLoadingPhase('Gathering'), 2000);
    const synthesizingTimeout = setTimeout(() => setLoadingPhase('Synthesizing'), 5000);
    
    try {
      const result = await intelligenceOrchestratorV3.orchestrate(orgToUse);
      clearInterval(progressInterval);
      clearTimeout(gatheringTimeout);
      clearTimeout(synthesizingTimeout);
      setLoadingProgress(100);
      
      console.log('📦 V3 Orchestration result:', {
        success: result.success,
        hasTabsData: !!result.tabs,
        tabKeys: result.tabs ? Object.keys(result.tabs) : [],
        error: result.error
      });
      
      // Debug: Log the actual executive and predictions data
      if (result.tabs?.executive) {
        console.log('🎯 Executive Tab Data:', result.tabs.executive);
      }
      if (result.tabs?.predictions) {
        console.log('🔮 Predictions Tab Data:', result.tabs.predictions);
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
      clearTimeout(gatheringTimeout);
      clearTimeout(synthesizingTimeout);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'executive', name: 'Executive Brief', Icon: RocketIcon, color: '#ff00ff' },
    { id: 'entities', name: 'Entity Movements', Icon: TargetIcon, color: '#00ffcc' },
    { id: 'market', name: 'Market Dynamics', Icon: TrendingUpIcon, color: '#00ff88' },
    { id: 'strategy', name: 'Strategic Intel', Icon: ChartIcon, color: '#ffcc00' },
    { id: 'predictions', name: 'Cascades & Predictions', Icon: BuildingIcon, color: '#8800ff' }
  ];

  const renderExecutiveTab = (data) => {
    if (!data) return null;
    
    const urgencyColors = {
      immediate: '#ff0064',
      high: '#ff6600',
      medium: '#ffcc00',
      low: '#00ff88'
    };
    
    return (
      <div className="v3-executive-tab">
        <h2 className="executive-headline">{data.strategic_headline || data.headline}</h2>
        <p className="executive-summary">{data.strategic_summary || data.summary}</p>
        
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
                <span className="value" style={{ color: urgencyColors[data.situation_assessment.risk_level] }}>
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
    
    return (
      <div className="v3-entities-tab">
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
        {data.trending_opportunities?.length > 0 && (
          <div className="market-section">
            <h3>Trending Opportunities</h3>
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

  const renderPredictionsTab = (data) => {
    if (!data) return null;
    
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
    if (!intelligence?.tabs) return null;
    
    const tabData = intelligence.tabs[activeTab];
    
    switch (activeTab) {
      case 'executive':
        return renderExecutiveTab(tabData);
      case 'entities':
        return renderEntitiesTab(tabData);
      case 'market':
        return renderMarketTab(tabData);
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
        <div className="loading-container">
          <div className="phase-indicator">
            <div className="phase-name">{loadingPhase}</div>
            <div className="phase-steps">
              <div className={`step ${loadingPhase === 'Discovery' ? 'active' : loadingProgress > 30 ? 'complete' : ''}`}>
                <span className="step-icon">🔍</span>
                <span className="step-label">Discovery</span>
              </div>
              <div className={`step ${loadingPhase === 'Gathering' ? 'active' : loadingProgress > 60 ? 'complete' : ''}`}>
                <span className="step-icon">📡</span>
                <span className="step-label">Gathering</span>
              </div>
              <div className={`step ${loadingPhase === 'Synthesizing' ? 'active' : ''}`}>
                <span className="step-icon">🧠</span>
                <span className="step-label">Synthesizing</span>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${loadingProgress}%` }}></div>
            </div>
          </div>
          <p className="loading-message">Analyzing with Claude Sonnet 4...</p>
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
      {intelligence.alerts?.length > 0 && (
        <div className="critical-alerts-bar">
          <AlertIcon size={20} />
          <span>{intelligence.alerts.length} Critical Alert{intelligence.alerts.length > 1 ? 's' : ''}</span>
        </div>
      )}
      
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