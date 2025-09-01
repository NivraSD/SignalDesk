// Enhanced tab rendering functions to properly display rich Claude analysis
// This file contains the improved rendering logic for all 6 tabs

export const renderExecutiveSummaryEnhanced = (intelligence) => {
  const { tabs = {} } = intelligence;
  const executiveTab = tabs.executive || {};
  
  // Debug logging to see what we're actually getting
  console.log('🔍 EXECUTIVE TAB ENHANCED DEBUG:', {
    hasIntelligence: !!intelligence,
    hasTabs: !!tabs,
    tabKeys: Object.keys(tabs),
    hasExecutiveTab: !!executiveTab,
    executiveKeys: Object.keys(executiveTab),
    headline: executiveTab.headline,
    overview: executiveTab.overview?.substring(0, 100),
    hasNarrativeHealth: !!executiveTab.narrative_health,
    narrativeHealthKeys: Object.keys(executiveTab.narrative_health || {}),
    hasKeyConnections: !!executiveTab.key_connections,
    keyConnectionsCount: executiveTab.key_connections?.length || 0,
    hasStatistics: !!executiveTab.statistics,
    immediateActionsCount: executiveTab.immediate_actions?.length || 0
  });
  
  return (
    <div className="executive-summary-content">
      {/* Executive Intelligence Summary from enriched tabs */}
      <div className="summary-section">
        <h3>Executive Intelligence Summary</h3>
        <div className="narrative-block">
          {executiveTab.headline && (
            <p className="headline">{executiveTab.headline}</p>
          )}
          {executiveTab.overview && (
            <p>{executiveTab.overview}</p>
          )}
          {executiveTab.immediate_actions && executiveTab.immediate_actions.length > 0 && (
            <div className="key-insights">
              <h4>Immediate Actions</h4>
              <ul>
                {executiveTab.immediate_actions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Narrative Health Assessment */}
      {executiveTab.narrative_health && Object.keys(executiveTab.narrative_health).length > 0 && (
        <div className="summary-section">
          <h3>Narrative Health Assessment</h3>
          <div className="narrative-block">
            {executiveTab.narrative_health.current_perception && (
              <p><strong>Current Perception:</strong> {executiveTab.narrative_health.current_perception}</p>
            )}
            {executiveTab.narrative_health.sentiment_trajectory && (
              <p><strong>Sentiment Trajectory:</strong> {executiveTab.narrative_health.sentiment_trajectory}</p>
            )}
            {executiveTab.narrative_health.narrative_control && (
              <p><strong>Narrative Control:</strong> {executiveTab.narrative_health.narrative_control}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Key Connections */}
      {executiveTab.key_connections && executiveTab.key_connections.length > 0 && (
        <div className="summary-section">
          <h3>Cross-Dimensional Connections</h3>
          <div className="patterns-list">
            {executiveTab.key_connections.map((connection, idx) => (
              <div key={idx} className="pattern-item">
                <span className="pattern-desc">{connection}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Statistics */}
      {executiveTab.statistics && (
        <div className="summary-section">
          <h3>Intelligence Statistics</h3>
          <div className="position-grid">
            <div className="position-item">
              <span className="label">Entities Tracked:</span>
              <span className="value">{executiveTab.statistics.entities_tracked || 0}</span>
            </div>
            <div className="position-item">
              <span className="label">Actions Captured:</span>
              <span className="value">{executiveTab.statistics.actions_captured || 0}</span>
            </div>
            <div className="position-item">
              <span className="label">Topics Monitored:</span>
              <span className="value">{executiveTab.statistics.topics_monitored || 0}</span>
            </div>
            <div className="position-item">
              <span className="label">Opportunities:</span>
              <span className="value">{executiveTab.statistics.opportunities_identified || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const renderCompetitiveAnalysisEnhanced = (intelligence) => {
  const { tabs = {} } = intelligence;
  const competitiveTab = tabs.competitive || {};
  
  return (
    <div className="competitive-analysis-content">
      {/* Comparative Position from Claude */}
      {competitiveTab.comparative_position && Object.keys(competitiveTab.comparative_position).length > 0 && (
        <div className="competitive-section">
          <h3>Comparative Position Analysis</h3>
          <div className="narrative-block">
            {competitiveTab.comparative_position.vs_competitors && (
              <p><strong>Vs Competitors:</strong> {competitiveTab.comparative_position.vs_competitors}</p>
            )}
            {competitiveTab.comparative_position.gaps_identified && competitiveTab.comparative_position.gaps_identified.length > 0 && (
              <div>
                <h4>Gaps Identified:</h4>
                <ul>
                  {competitiveTab.comparative_position.gaps_identified.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
            {competitiveTab.comparative_position.strengths_highlighted && competitiveTab.comparative_position.strengths_highlighted.length > 0 && (
              <div>
                <h4>Strengths:</h4>
                <ul>
                  {competitiveTab.comparative_position.strengths_highlighted.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            {competitiveTab.comparative_position.narrative_comparison && (
              <p><strong>Narrative Comparison:</strong> {competitiveTab.comparative_position.narrative_comparison}</p>
            )}
          </div>
        </div>
      )}
      
      <div className="competitive-section">
        <h3>Competitor Actions Tracked</h3>
        <div className="actions-grid">
          {competitiveTab.competitor_actions?.map((action, idx) => (
            <div key={idx} className="action-card">
              <div className="competitor-name">{action.competitor}</div>
              <div className="action-desc">{action.action}</div>
              <div className="action-impact">Impact: {action.impact}</div>
              <div className="response">Response: {action.response}</div>
            </div>
          )) || <p>No recent competitor actions detected</p>}
        </div>
      </div>
      
      {/* Competitive Gaps */}
      {competitiveTab.competitive_gaps && competitiveTab.competitive_gaps.length > 0 && (
        <div className="competitive-section">
          <h3>Competitive Gaps</h3>
          <div className="gaps-list">
            {competitiveTab.competitive_gaps.map((gap, idx) => (
              <div key={idx} className="gap-item">
                <span>{typeof gap === 'object' ? gap.insight : gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Competitive Opportunities */}
      {competitiveTab.competitive_opportunities && competitiveTab.competitive_opportunities.length > 0 && (
        <div className="competitive-section">
          <h3>Competitive Opportunities</h3>
          <div className="opportunities-list">
            {competitiveTab.competitive_opportunities.map((opp, idx) => (
              <div key={idx} className="opportunity-item">
                <span>{opp.title || opp.description || opp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* PR Strategy */}
      {competitiveTab.pr_strategy && (
        <div className="competitive-section">
          <h3>Recommended PR Strategy</h3>
          <div className="narrative-block">
            <p>{competitiveTab.pr_strategy}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const renderMarketAnalysisEnhanced = (intelligence) => {
  const { tabs = {} } = intelligence;
  const marketTab = tabs.market || {};
  
  return (
    <div className="trending-topics-content">
      {/* Market Dynamics from Claude */}
      {marketTab.market_dynamics && (
        <div className="topics-section">
          <h3>Market Dynamics Assessment</h3>
          <div className="narrative-block">
            <p>{marketTab.market_dynamics}</p>
          </div>
        </div>
      )}
      
      <div className="topics-section">
        <h3>Market Trends</h3>
        <div className="trends-grid">
          {marketTab.market_trends?.map((trend, idx) => (
            <div key={idx} className="trend-card">
              <div className="trend-topic">{trend.topic}</div>
              <div className="trend-metrics">
                <span className="mentions">Mentions: {trend.mentions}</span>
                <span className="trajectory">Trend: {trend.trend}</span>
                {trend.interpretation && (
                  <div className="interpretation">{trend.interpretation}</div>
                )}
              </div>
            </div>
          )) || <p>Analyzing market trends...</p>}
        </div>
      </div>
      
      {/* Emerging Narratives */}
      {marketTab.emerging_narratives && marketTab.emerging_narratives.length > 0 && (
        <div className="topics-section">
          <h3>Emerging Narratives</h3>
          <div className="narratives-list">
            {marketTab.emerging_narratives.map((narrative, idx) => (
              <div key={idx} className="narrative-item">
                <span>{narrative}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Market Opportunities */}
      {marketTab.opportunities && marketTab.opportunities.length > 0 && (
        <div className="topics-section">
          <h3>Market Opportunities</h3>
          <div className="opportunities-list">
            {marketTab.opportunities.map((opp, idx) => (
              <div key={idx} className="opportunity-item">
                <span>{opp.title || opp.description || opp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Perception Gaps */}
      {marketTab.perception_gaps && marketTab.perception_gaps.length > 0 && (
        <div className="topics-section">
          <h3>Perception Gaps</h3>
          <div className="gaps-list">
            {marketTab.perception_gaps.map((gap, idx) => (
              <div key={idx} className="gap-item">
                <span>{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Market Position */}
      {marketTab.market_position && (
        <div className="topics-section">
          <h3>Market Position</h3>
          <div className="narrative-block">
            <p>{marketTab.market_position}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const renderRegulatoryAnalysisEnhanced = (intelligence) => {
  const { tabs = {} } = intelligence;
  const regulatoryTab = tabs.regulatory || {};
  
  return (
    <div className="stakeholders-content">
      {/* Regulatory Climate from Claude */}
      {regulatoryTab.regulatory_climate && (
        <div className="stakeholder-section">
          <h3>Regulatory Climate Assessment</h3>
          <div className="narrative-block">
            <p>{regulatoryTab.regulatory_climate}</p>
          </div>
        </div>
      )}
      
      <div className="stakeholder-section">
        <h3>Regulatory Developments</h3>
        <div className="regulatory-grid">
          {regulatoryTab.regulatory_developments?.map((dev, idx) => (
            <div key={idx} className="regulatory-item">
              <div className="regulator">{dev.regulator || dev.source || 'Regulatory Body'}</div>
              <div className="action">{dev.action || dev.development || dev.description}</div>
              {dev.impact && <div className="impact">Impact: {dev.impact}</div>}
            </div>
          )) || (
            <p className="regulatory-status">
              {regulatoryTab.regulatory_stance || 'Monitoring regulatory environment'}
            </p>
          )}
        </div>
      </div>
      
      {/* Regulatory Opportunities */}
      {regulatoryTab.regulatory_opportunities && regulatoryTab.regulatory_opportunities.length > 0 && (
        <div className="stakeholder-section">
          <h3>Regulatory Opportunities</h3>
          <div className="opportunities-list">
            {regulatoryTab.regulatory_opportunities.map((opp, idx) => (
              <div key={idx} className="opportunity-item">
                <span>{opp.title || opp.description || opp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Compliance Requirements */}
      {regulatoryTab.compliance_requirements && regulatoryTab.compliance_requirements.length > 0 && (
        <div className="stakeholder-section">
          <h3>Compliance Requirements</h3>
          <div className="requirements-list">
            {regulatoryTab.compliance_requirements.map((req, idx) => (
              <div key={idx} className="requirement-item">
                <span>{req.requirement || req.description || req}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Regulatory Risks */}
      {regulatoryTab.regulatory_risks && regulatoryTab.regulatory_risks.length > 0 && (
        <div className="stakeholder-section">
          <h3>Regulatory Risks</h3>
          <div className="risks-list">
            {regulatoryTab.regulatory_risks.map((risk, idx) => (
              <div key={idx} className="risk-item">
                <span>{typeof risk === 'object' ? risk.insight : risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const renderMediaAnalysisEnhanced = (intelligence) => {
  const { tabs = {} } = intelligence;
  const mediaTab = tabs.media || {};
  
  return (
    <div className="tab-content media-analysis">
      <h3>Media Landscape Analysis</h3>
      
      {/* Media Environment from Claude */}
      {mediaTab.media_environment && (
        <div className="analysis-section">
          <h4>Media Environment Assessment</h4>
          <p>{mediaTab.media_environment}</p>
        </div>
      )}
      
      {/* Sentiment Trend */}
      {mediaTab.sentiment_trend && (
        <div className="analysis-section">
          <h4>Sentiment Trajectory</h4>
          <p><strong>{mediaTab.sentiment_trend}</strong></p>
          {mediaTab.narrative_control && (
            <p>Narrative Control Level: <strong>{mediaTab.narrative_control}</strong></p>
          )}
        </div>
      )}
      
      {/* Media Coverage */}
      {mediaTab.media_coverage && mediaTab.media_coverage.length > 0 && (
        <div className="analysis-section">
          <h4>Recent Coverage</h4>
          <div className="coverage-list">
            {mediaTab.media_coverage.map((item, idx) => (
              <div key={idx} className="coverage-item">
                <span className="outlet">{item.outlet || item.source}</span>
                <span className="topic">{item.topic || item.headline}</span>
                {item.sentiment && <span className="sentiment">{item.sentiment}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Journalist Interest */}
      {mediaTab.journalist_interest && mediaTab.journalist_interest.length > 0 && (
        <div className="analysis-section">
          <h4>Journalist Interest Areas</h4>
          <div className="interest-list">
            {mediaTab.journalist_interest.map((interest, idx) => (
              <div key={idx} className="interest-item">
                <span>{typeof interest === 'object' ? interest.topic : interest}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Media Opportunities */}
      {mediaTab.media_opportunities && mediaTab.media_opportunities.length > 0 && (
        <div className="analysis-section">
          <h4>Media Opportunities</h4>
          <div className="opportunities-list">
            {mediaTab.media_opportunities.map((opp, idx) => (
              <div key={idx} className="opportunity-item">
                <span>{opp.title || opp.description || opp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Media Strategy */}
      {mediaTab.media_strategy && (
        <div className="analysis-section">
          <h4>Recommended Media Strategy</h4>
          <p>{mediaTab.media_strategy}</p>
        </div>
      )}
    </div>
  );
};

export const renderForwardLookingEnhanced = (intelligence) => {
  const { tabs = {} } = intelligence;
  const forwardTab = tabs.forward || {};
  
  return (
    <div className="forward-looking-content">
      {/* Weak Signals from Claude */}
      {forwardTab.weak_signals && forwardTab.weak_signals.length > 0 && (
        <div className="forward-section">
          <h3>Weak Signals Detected</h3>
          <div className="signals-grid">
            {forwardTab.weak_signals.map((signal, idx) => (
              <div key={idx} className="signal-item">
                <span className="signal-indicator">📡</span>
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Pre-Cascade Indicators */}
      {forwardTab.pre_cascade_indicators && forwardTab.pre_cascade_indicators.length > 0 && (
        <div className="forward-section">
          <h3>Pre-Cascade Indicators</h3>
          <div className="indicators-grid">
            {forwardTab.pre_cascade_indicators.map((indicator, idx) => (
              <div key={idx} className="indicator-item">
                <span className="indicator-icon">⚡</span>
                <span>{indicator}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Trajectory Assessment */}
      {forwardTab.trajectory && (
        <div className="forward-section">
          <h3>Strategic Trajectory</h3>
          <div className="narrative-block">
            <p>{forwardTab.trajectory}</p>
          </div>
        </div>
      )}
      
      <div className="forward-section">
        <h3>Early Warning Signals</h3>
        <div className="signals-grid">
          {forwardTab.early_warnings?.map((warning, idx) => (
            <div key={idx} className="signal-item">
              <span className="signal-indicator">⚠️</span>
              <span>{warning}</span>
            </div>
          )) || <p>Monitoring for emerging signals...</p>}
        </div>
      </div>
      
      {/* Predictions */}
      {forwardTab.predictions && forwardTab.predictions.length > 0 && (
        <div className="forward-section">
          <h3>Cascade Predictions</h3>
          <div className="predictions-list">
            {forwardTab.predictions.map((prediction, idx) => (
              <div key={idx} className="prediction-item">
                <span>{prediction}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Monitoring Priorities */}
      {forwardTab.monitoring_priorities && forwardTab.monitoring_priorities.length > 0 && (
        <div className="forward-section">
          <h3>Monitoring Priorities</h3>
          <div className="priorities-list">
            {forwardTab.monitoring_priorities.map((priority, idx) => (
              <div key={idx} className="priority-item">
                <span className="priority-number">{idx + 1}.</span>
                <span>{priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Narrative Risks & Assets */}
      <div className="forward-section">
        <h3>Narrative Assessment</h3>
        <div className="narrative-grid">
          {forwardTab.narrative_risks && forwardTab.narrative_risks.length > 0 && (
            <div className="narrative-column">
              <h4>Risks</h4>
              {forwardTab.narrative_risks.map((risk, idx) => (
                <div key={idx} className="narrative-item risk">
                  <span>• {risk}</span>
                </div>
              ))}
            </div>
          )}
          {forwardTab.narrative_assets && forwardTab.narrative_assets.length > 0 && (
            <div className="narrative-column">
              <h4>Assets</h4>
              {forwardTab.narrative_assets.map((asset, idx) => (
                <div key={idx} className="narrative-item asset">
                  <span>• {asset}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Proactive Strategy */}
      {forwardTab.proactive_strategy && (
        <div className="forward-section">
          <h3>Proactive Strategy</h3>
          <div className="narrative-block">
            <p>{forwardTab.proactive_strategy}</p>
          </div>
        </div>
      )}
    </div>
  );
};