import React, { useState, useEffect } from 'react';
import intelligenceOrchestratorV4 from '../services/intelligenceOrchestratorV4';
import cacheManager from '../utils/cacheManager';
import './IntelligenceDisplayV3.css';
import './IntelligenceHubV7.css';

// Intelligence Hub V7 - Elite PR Analysis Display
const IntelligenceHubV7 = ({ organization, onIntelligenceUpdate }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisType, setAnalysisType] = useState('');

  // Elite analysis views
  const views = [
    { id: 'dashboard', name: 'Strategic Dashboard', icon: '🎯' },
    { id: 'signals', name: 'Signal Analysis', icon: '📡' },
    { id: 'patterns', name: 'Pattern Recognition', icon: '🔗' },
    { id: 'stakeholders', name: 'Stakeholder Matrix', icon: '👥' },
    { id: 'implications', name: 'Strategic Implications', icon: '🎲' },
    { id: 'response', name: 'Response Strategy', icon: '⚡' },
    { id: 'insights', name: 'Elite Insights', icon: '💎' }
  ];

  useEffect(() => {
    if (organization) {
      runEliteAnalysis();
    }
  }, [organization]);

  const runEliteAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const completeProfile = cacheManager.getCompleteProfile() || organization;
      
      if (!completeProfile.stakeholders) {
        completeProfile.stakeholders = {
          competitors: organization.competitors || [],
          regulators: organization.regulators || [],
          media_outlets: organization.media_outlets || [],
          investors: organization.investors || [],
          analysts: organization.analysts || [],
          activists: organization.activists || []
        };
      }

      console.log('🎯 Running elite analysis for:', completeProfile.name);

      const result = await intelligenceOrchestratorV4.orchestrate(completeProfile);
      
      if (result.success) {
        setAnalysis(result.analysis);
        setAnalysisType(result.metadata?.analysis_type || 'synthesis');
        
        // Pass to Opportunity Engine
        if (onIntelligenceUpdate) {
          onIntelligenceUpdate(result);
        }
        
        // Cache the result
        cacheManager.saveSynthesis(result);
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Elite analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    if (!analysis) return null;
    
    switch(activeView) {
      case 'dashboard':
        return renderStrategicDashboard();
      case 'signals':
        return renderSignalAnalysis();
      case 'patterns':
        return renderPatternRecognition();
      case 'stakeholders':
        return renderStakeholderMatrix();
      case 'implications':
        return renderStrategicImplications();
      case 'response':
        return renderResponseStrategy();
      case 'insights':
        return renderEliteInsights();
      default:
        return renderStrategicDashboard();
    }
  };

  const renderStrategicDashboard = () => {
    return (
      <div className="strategic-dashboard">
        <div className="dashboard-header">
          <h2>Strategic Intelligence Dashboard</h2>
          <div className="analysis-badge">
            {analysisType === 'mcp-deep' ? '🧠 Deep Analysis' : '⚡ Fast Synthesis'}
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Threat Level Widget */}
          <div className="dashboard-widget threat-level">
            <h3>Threat Level</h3>
            <div className="threat-indicator">
              <div className={`threat-meter level-${getThreatLevel()}`}>
                {getThreatLevel().toUpperCase()}
              </div>
            </div>
            <div className="threat-details">
              {analysis.pattern_recognition?.length || 0} patterns detected
            </div>
          </div>

          {/* Opportunity Score Widget */}
          <div className="dashboard-widget opportunity-score">
            <h3>Opportunity Score</h3>
            <div className="score-display">
              <div className="score-value">{getOpportunityScore()}</div>
              <div className="score-label">/ 100</div>
            </div>
            <div className="opportunity-details">
              {analysis.elite_insights?.asymmetric_opportunities?.length || 0} unique opportunities
            </div>
          </div>

          {/* Response Required Widget */}
          <div className="dashboard-widget response-required">
            <h3>Response Required</h3>
            <div className={`response-urgency ${getResponseUrgency()}`}>
              {getResponseUrgency().toUpperCase()}
            </div>
            <div className="response-timeline">
              {analysis.response_strategy?.immediate_24h?.actions?.length || 0} immediate actions
            </div>
          </div>

          {/* Key Insights Widget */}
          <div className="dashboard-widget key-insights">
            <h3>Key Insights</h3>
            <div className="insights-list">
              {getTopInsights().map((insight, idx) => (
                <div key={idx} className="insight-item">
                  <span className="insight-icon">💡</span>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Summary */}
        <div className="action-summary">
          <h3>Recommended Actions</h3>
          <div className="action-timeline">
            <div className="timeline-item immediate">
              <div className="timeline-label">Next 24 Hours</div>
              <div className="timeline-actions">
                {analysis.response_strategy?.immediate_24h?.actions?.slice(0, 3).map((action, idx) => (
                  <div key={idx} className="action-chip">{action}</div>
                ))}
              </div>
            </div>
            <div className="timeline-item short-term">
              <div className="timeline-label">Next 7 Days</div>
              <div className="timeline-actions">
                {analysis.response_strategy?.short_term_7d?.actions?.slice(0, 3).map((action, idx) => (
                  <div key={idx} className="action-chip">{action}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSignalAnalysis = () => {
    const signals = analysis.signal_analysis || [];
    
    return (
      <div className="signal-analysis">
        <div className="view-header">
          <h2>Signal Analysis</h2>
          <div className="signal-count">{signals.length} signals analyzed</div>
        </div>

        <div className="signals-grid">
          {signals.map((signal, idx) => (
            <div key={idx} className="signal-card">
              <div className="signal-header">
                <div className="signal-title">{signal.signal}</div>
                <div className={`signal-magnitude magnitude-${signal.magnitude}`}>
                  {signal.magnitude}
                </div>
              </div>
              
              <div className="signal-analysis-grid">
                <div className="analysis-section">
                  <div className="analysis-label">What Happened</div>
                  <div className="analysis-content">{signal.what_happened}</div>
                </div>
                <div className="analysis-section">
                  <div className="analysis-label">So What?</div>
                  <div className="analysis-content">{signal.so_what}</div>
                </div>
                <div className="analysis-section">
                  <div className="analysis-label">Now What?</div>
                  <div className="analysis-content action">{signal.now_what}</div>
                </div>
              </div>
              
              <div className="signal-metrics">
                <div className="metric">
                  <span className="metric-label">Velocity:</span>
                  <span className={`metric-value velocity-${signal.velocity}`}>{signal.velocity}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Credibility:</span>
                  <span className="metric-value">{signal.credibility}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Relevance:</span>
                  <span className="metric-value">{signal.relevance}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {signals.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <div className="empty-message">No signals detected</div>
            <div className="empty-hint">Run analysis to detect signals</div>
          </div>
        )}
      </div>
    );
  };

  const renderPatternRecognition = () => {
    const patterns = analysis.pattern_recognition || [];
    
    return (
      <div className="pattern-recognition">
        <div className="view-header">
          <h2>Pattern Recognition</h2>
          <div className="pattern-count">{patterns.length} patterns identified</div>
        </div>

        <div className="patterns-container">
          {patterns.map((pattern, idx) => (
            <div key={idx} className="pattern-card">
              <div className="pattern-header">
                <div className="pattern-type">{pattern.type.replace(/_/g, ' ').toUpperCase()}</div>
                <div className="pattern-confidence">
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: `${pattern.confidence}%` }}></div>
                  </div>
                  <span className="confidence-value">{pattern.confidence}%</span>
                </div>
              </div>
              
              <div className="pattern-insight">
                <div className="insight-icon">🔍</div>
                <div className="insight-text">{pattern.insight}</div>
              </div>
              
              <div className="pattern-signals">
                <div className="signals-label">Connected Signals:</div>
                <div className="signals-list">
                  {pattern.signals_connected.slice(0, 3).map((signal, sidx) => (
                    <div key={sidx} className="connected-signal">{signal}</div>
                  ))}
                </div>
              </div>
              
              <div className="pattern-implications">
                <div className="implications-label">Implications:</div>
                {pattern.implications.map((implication, iidx) => (
                  <div key={iidx} className="implication-item">
                    <span className="implication-arrow">→</span>
                    {implication}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStakeholderMatrix = () => {
    const matrix = analysis.stakeholder_impact || {};
    
    return (
      <div className="stakeholder-matrix">
        <div className="view-header">
          <h2>Stakeholder Impact Matrix</h2>
        </div>

        <div className="matrix-grid">
          {Object.entries(matrix).map(([stakeholder, impact]) => (
            <div key={stakeholder} className="stakeholder-card">
              <div className="stakeholder-header">
                <div className="stakeholder-name">
                  {stakeholder.charAt(0).toUpperCase() + stakeholder.slice(1)}
                </div>
                <div className={`concern-level level-${impact.concern_level}`}>
                  {impact.concern_level} concern
                </div>
              </div>
              
              <div className="perception-shift">
                <div className="shift-label">Perception Shift:</div>
                <div className="shift-content">{impact.perception_shift}</div>
              </div>
              
              <div className="likely-questions">
                <div className="questions-label">Likely Questions:</div>
                {impact.likely_questions?.slice(0, 3).map((question, idx) => (
                  <div key={idx} className="question-item">• {question}</div>
                ))}
              </div>
              
              <div className="messaging-needs">
                <div className="needs-label">Messaging Needs:</div>
                <div className="needs-grid">
                  {impact.messaging_needs?.slice(0, 3).map((need, idx) => (
                    <div key={idx} className="need-chip">{need}</div>
                  ))}
                </div>
              </div>
              
              <div className="proof-points">
                <div className="proof-label">Proof Points Required:</div>
                <div className="proof-list">
                  {impact.proof_points_required?.slice(0, 3).map((proof, idx) => (
                    <div key={idx} className="proof-item">✓ {proof}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStrategicImplications = () => {
    const implications = analysis.strategic_implications || {};
    
    return (
      <div className="strategic-implications">
        <div className="view-header">
          <h2>Strategic Implications</h2>
        </div>

        <div className="implications-grid">
          {/* Reputation Section */}
          <div className="implication-section reputation">
            <h3>Reputation</h3>
            <div className="status-display">
              <div className="status-label">Current State:</div>
              <div className="status-value">{implications.reputation?.current_state}</div>
            </div>
            <div className="trajectory-display">
              <div className="trajectory-label">Trajectory:</div>
              <div className={`trajectory-value trajectory-${implications.reputation?.trajectory}`}>
                {implications.reputation?.trajectory}
              </div>
            </div>
            <div className="intervention-display">
              <div className="intervention-label">Intervention Required:</div>
              <div className={`intervention-value intervention-${implications.reputation?.intervention_required}`}>
                {implications.reputation?.intervention_required}
              </div>
            </div>
            {implications.reputation?.key_vulnerabilities?.length > 0 && (
              <div className="vulnerabilities">
                <div className="vuln-label">Key Vulnerabilities:</div>
                {implications.reputation.key_vulnerabilities.map((vuln, idx) => (
                  <div key={idx} className="vuln-item">⚠ {vuln}</div>
                ))}
              </div>
            )}
          </div>

          {/* Competitive Position Section */}
          <div className="implication-section competitive">
            <h3>Competitive Position</h3>
            <div className="position-display">
              <div className="position-label">Relative Strength:</div>
              <div className={`position-value strength-${implications.competitive_position?.relative_strength}`}>
                {implications.competitive_position?.relative_strength}
              </div>
            </div>
            <div className="momentum-display">
              <div className="momentum-label">Momentum:</div>
              <div className={`momentum-value momentum-${implications.competitive_position?.momentum}`}>
                {implications.competitive_position?.momentum}
              </div>
            </div>
            <div className="advantages">
              <div className="adv-label">Defendable Advantages:</div>
              {implications.competitive_position?.defendable_advantages?.map((adv, idx) => (
                <div key={idx} className="adv-item">✓ {adv}</div>
              ))}
            </div>
            <div className="flanks">
              <div className="flank-label">Exposed Flanks:</div>
              {implications.competitive_position?.exposed_flanks?.map((flank, idx) => (
                <div key={idx} className="flank-item">⚠ {flank}</div>
              ))}
            </div>
          </div>

          {/* Market Narrative Section */}
          <div className="implication-section narrative">
            <h3>Market Narrative</h3>
            <div className="narrative-control">
              <div className="control-section">
                <div className="control-label">We Control:</div>
                {implications.market_narrative?.we_control?.map((item, idx) => (
                  <div key={idx} className="control-item our-control">✓ {item}</div>
                ))}
              </div>
              <div className="control-section">
                <div className="control-label">They Control:</div>
                {implications.market_narrative?.they_control?.map((item, idx) => (
                  <div key={idx} className="control-item their-control">⚠ {item}</div>
                ))}
              </div>
              <div className="control-section">
                <div className="control-label">Contested Ground:</div>
                {implications.market_narrative?.contested_ground?.map((item, idx) => (
                  <div key={idx} className="control-item contested">⚔ {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResponseStrategy = () => {
    const strategy = analysis.response_strategy || {};
    
    return (
      <div className="response-strategy">
        <div className="view-header">
          <h2>Response Strategy</h2>
        </div>

        <div className="strategy-timeline">
          {Object.entries(strategy).map(([timeframe, plan]) => (
            <div key={timeframe} className="strategy-phase">
              <div className="phase-header">
                <div className="phase-timeframe">{formatTimeframe(timeframe)}</div>
                <div className={`phase-priority priority-${plan.priority}`}>
                  {plan.priority} Priority
                </div>
              </div>
              
              <div className="phase-content">
                <div className="actions-section">
                  <div className="section-label">Actions:</div>
                  <div className="actions-list">
                    {plan.actions?.map((action, idx) => (
                      <div key={idx} className="action-item">
                        <span className="action-number">{idx + 1}</span>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="messaging-section">
                  <div className="section-label">Key Messages:</div>
                  <div className="messages-list">
                    {plan.messaging?.map((message, idx) => (
                      <div key={idx} className="message-item">• {message}</div>
                    ))}
                  </div>
                </div>
                
                <div className="channels-section">
                  <div className="section-label">Channels:</div>
                  <div className="channels-grid">
                    {plan.channels?.map((channel, idx) => (
                      <div key={idx} className="channel-chip">{channel}</div>
                    ))}
                  </div>
                </div>
                
                <div className="metrics-section">
                  <div className="section-label">Success Metrics:</div>
                  <div className="metrics-list">
                    {plan.success_metrics?.map((metric, idx) => (
                      <div key={idx} className="metric-item">📊 {metric}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEliteInsights = () => {
    const insights = analysis.elite_insights || {};
    
    return (
      <div className="elite-insights">
        <div className="view-header">
          <h2>Elite Insights</h2>
          <div className="insights-badge">💎 Strategic Intelligence</div>
        </div>

        <div className="insights-container">
          {/* Hidden Connections */}
          {insights.hidden_connections?.length > 0 && (
            <div className="insight-section hidden-connections">
              <h3>🔗 Hidden Connections</h3>
              <div className="connections-list">
                {insights.hidden_connections.map((connection, idx) => (
                  <div key={idx} className="connection-item">
                    <div className="connection-icon">🔍</div>
                    <div className="connection-text">{connection}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-Obvious Risks */}
          {insights.non_obvious_risks?.length > 0 && (
            <div className="insight-section non-obvious-risks">
              <h3>⚠️ Non-Obvious Risks</h3>
              <div className="risks-list">
                {insights.non_obvious_risks.map((risk, idx) => (
                  <div key={idx} className="risk-item">
                    <div className="risk-icon">🎯</div>
                    <div className="risk-text">{risk}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asymmetric Opportunities */}
          {insights.asymmetric_opportunities?.length > 0 && (
            <div className="insight-section asymmetric-opportunities">
              <h3>🚀 Asymmetric Opportunities</h3>
              <div className="opportunities-list">
                {insights.asymmetric_opportunities.map((opp, idx) => (
                  <div key={idx} className="opportunity-item">
                    <div className="opp-icon">💡</div>
                    <div className="opp-text">{opp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Narrative Leverage Points */}
          {insights.narrative_leverage_points?.length > 0 && (
            <div className="insight-section leverage-points">
              <h3>🎪 Narrative Leverage Points</h3>
              <div className="leverage-list">
                {insights.narrative_leverage_points.map((point, idx) => (
                  <div key={idx} className="leverage-item">
                    <div className="leverage-icon">📍</div>
                    <div className="leverage-text">{point}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Blindspots */}
          {insights.strategic_blindspots?.length > 0 && (
            <div className="insight-section blindspots">
              <h3>🕳️ Strategic Blindspots</h3>
              <div className="blindspots-list">
                {insights.strategic_blindspots.map((blindspot, idx) => (
                  <div key={idx} className="blindspot-item">
                    <div className="blindspot-icon">👁️</div>
                    <div className="blindspot-text">{blindspot}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {Object.keys(insights).every(key => !insights[key]?.length) && (
          <div className="empty-state">
            <div className="empty-icon">💎</div>
            <div className="empty-message">No elite insights available</div>
            <div className="empty-hint">Deep analysis required for strategic insights</div>
          </div>
        )}
      </div>
    );
  };

  // Helper functions
  const getThreatLevel = () => {
    const criticalPatterns = analysis.pattern_recognition?.filter(p => p.confidence > 80).length || 0;
    if (criticalPatterns > 2) return 'critical';
    if (criticalPatterns > 0) return 'high';
    if (analysis.pattern_recognition?.length > 2) return 'medium';
    return 'low';
  };

  const getOpportunityScore = () => {
    const opportunities = analysis.elite_insights?.asymmetric_opportunities?.length || 0;
    const leveragePoints = analysis.elite_insights?.narrative_leverage_points?.length || 0;
    return Math.min(100, (opportunities * 20) + (leveragePoints * 15) + 30);
  };

  const getResponseUrgency = () => {
    return analysis.response_strategy?.immediate_24h?.priority || 'low';
  };

  const getTopInsights = () => {
    const insights = [];
    
    if (analysis.pattern_recognition?.length > 0) {
      insights.push(analysis.pattern_recognition[0].insight);
    }
    
    if (analysis.elite_insights?.hidden_connections?.length > 0) {
      insights.push(analysis.elite_insights.hidden_connections[0]);
    }
    
    if (analysis.elite_insights?.asymmetric_opportunities?.length > 0) {
      insights.push(analysis.elite_insights.asymmetric_opportunities[0]);
    }
    
    return insights.slice(0, 3);
  };

  const formatTimeframe = (timeframe) => {
    const mappings = {
      immediate_24h: 'Next 24 Hours',
      short_term_7d: 'Next 7 Days',
      medium_term_30d: 'Next 30 Days',
      long_term_90d: 'Next 90 Days'
    };
    return mappings[timeframe] || timeframe;
  };

  if (loading) {
    return (
      <div className="intelligence-display-v3 loading">
        <div className="intelligence-loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Running Elite Analysis</div>
          <div className="loading-subtext">Analyzing signals, identifying patterns, assessing implications...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intelligence-display-v3 error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button onClick={runEliteAnalysis} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="intelligence-hub-v7">
      <div className="hub-navigation">
        {views.map(view => (
          <button
            key={view.id}
            className={`nav-button ${activeView === view.id ? 'active' : ''}`}
            onClick={() => setActiveView(view.id)}
          >
            <span className="nav-icon">{view.icon}</span>
            <span className="nav-name">{view.name}</span>
          </button>
        ))}
      </div>
      
      <div className="hub-content">
        {analysis ? renderView() : (
          <div className="no-analysis">
            <div className="empty-icon">🎯</div>
            <div className="empty-message">No analysis available</div>
            <button onClick={runEliteAnalysis} className="action-button">
              Run Elite Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceHubV7;