import React, { useState, useEffect } from 'react';
import './IntelligenceDisplay.css';
import claudeIntelligenceServiceV2 from '../services/claudeIntelligenceServiceV2';
import { CompetitorIcon, StakeholderIcon, MediaIcon, PredictiveIcon, RocketIcon, ScanIcon, AnalyzeIcon, SynthesizeIcon } from './Icons/NeonIcons';

const IntelligenceDisplayV2 = ({ organizationId, timeframe = '24h', refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingStage, setLoadingStage] = useState('');

  useEffect(() => {
    fetchIntelligence();
  }, [timeframe, refreshTrigger]);

  const fetchIntelligence = async () => {
    setLoading(true);
    setLoadingStage('initializing');
    
    try {
      const config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
      console.log('🎯 Fetching PR intelligence...');
      
      // Simulate loading stages for better UX
      setTimeout(() => setLoadingStage('scanning'), 1000);
      setTimeout(() => setLoadingStage('analyzing'), 3000);
      setTimeout(() => setLoadingStage('synthesizing'), 5000);
      
      const intelligence = await claudeIntelligenceServiceV2.gatherAndAnalyze(config, timeframe, { forceRefresh: true });
      console.log('✅ Intelligence received:', intelligence);
      setIntelligenceData(intelligence);
    } catch (err) {
      console.error('❌ Intelligence fetch failed:', err);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Executive Overview', Icon: RocketIcon, color: '#ff00ff' },
    { id: 'competition', name: 'Competition', Icon: CompetitorIcon, color: '#00ffcc' },
    { id: 'stakeholders', name: 'Stakeholders', Icon: StakeholderIcon, color: '#00ff88' },
    { id: 'topics', name: 'Topics & Trends', Icon: MediaIcon, color: '#ffcc00' },
    { id: 'predictions', name: 'Predictions', Icon: PredictiveIcon, color: '#8800ff' }
  ];

  const renderTabContent = (tabData, tabType) => {
    if (!tabData) {
      return (
        <div className="intelligence-section">
          <div className="empty-state">
            <p>No {tabType} intelligence available yet</p>
          </div>
        </div>
      );
    }

    // Handle tab-specific rendering
    switch (tabType) {
      case 'overview':
        return renderOverviewTab(tabData);
      case 'competition':
        return renderCompetitionTab(tabData);
      case 'stakeholders':
        return renderStakeholdersTab(tabData);
      case 'topics':
        return renderTopicsTab(tabData);
      case 'predictions':
        return renderPredictionsTab(tabData);
      default:
        return renderLegacyAnalysis(tabData, tabType);
    }
  };

  const renderOverviewTab = (data) => {
    return (
      <div className="intelligence-section overview-tab">
        {data.executive_summary && (
          <div className="executive-summary-panel">
            <h3>📊 Executive Summary</h3>
            <p>{data.executive_summary}</p>
          </div>
        )}
        
        {data.critical_alerts && data.critical_alerts.length > 0 && (
          <div className="alerts-panel">
            <h3>🚨 Critical Alerts</h3>
            <div className="alerts-grid">
              {data.critical_alerts.map((alert, idx) => (
                <div key={idx} className={`alert-card severity-${alert.severity}`}>
                  <div className="alert-type">{alert.type}</div>
                  <div className="alert-message">{alert.message}</div>
                  {alert.action_required && <div className="action-required">Action Required</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.key_insights && (
          <div className="insights-panel">
            <h3>💡 Key Insights</h3>
            <div className="insights-grid">
              {data.key_insights.map((insight, idx) => (
                <div key={idx} className={`insight-card impact-${insight.impact}`}>
                  <div className="insight-type">{insight.type}</div>
                  <div className="insight-content">{insight.insight}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.recommended_actions && (
          <div className="actions-panel">
            <h3>📋 Recommended Actions</h3>
            <div className="actions-list">
              {data.recommended_actions.map((action, idx) => (
                <div key={idx} className={`action-item priority-${action.priority}`}>
                  <div className="action-priority">{action.priority}</div>
                  <div className="action-content">
                    <div className="action-text">{action.action}</div>
                    <div className="action-rationale">{action.rationale}</div>
                    <div className="action-owner">Owner: {action.owner}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCompetitionTab = (data) => {
    return (
      <div className="intelligence-section competition-tab">
        {data.competitive_landscape && (
          <div className="landscape-panel">
            <h3>🎯 Competitive Landscape</h3>
            <p>{data.competitive_landscape.summary}</p>
          </div>
        )}
        
        {data.competitor_profiles && Object.keys(data.competitor_profiles).length > 0 && (
          <div className="competitors-panel">
            <h3>🏢 Competitor Analysis</h3>
            <div className="competitor-cards">
              {Object.entries(data.competitor_profiles).map(([name, profile]) => (
                <div key={name} className="competitor-card">
                  <h4>{name}</h4>
                  {profile.threat_assessment && (
                    <div className="threat-level">Threat: {profile.threat_assessment.level}</div>
                  )}
                  {profile.latest_developments && profile.latest_developments.length > 0 && (
                    <div className="developments">
                      <h5>Latest Developments</h5>
                      <ul>
                        {profile.latest_developments.slice(0, 3).map((dev, idx) => (
                          <li key={idx}>{dev.title || dev}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStakeholdersTab = (data) => {
    return (
      <div className="intelligence-section stakeholders-tab">
        {data.stakeholder_landscape && (
          <div className="landscape-panel">
            <h3>👥 Stakeholder Landscape</h3>
            <p>{data.stakeholder_landscape.overview}</p>
          </div>
        )}
        
        {data.group_analysis && Object.keys(data.group_analysis).length > 0 && (
          <div className="groups-panel">
            <h3>📊 Stakeholder Groups</h3>
            <div className="stakeholder-groups">
              {Object.entries(data.group_analysis).map(([group, analysis]) => (
                <div key={group} className="stakeholder-group">
                  <h4>{group.charAt(0).toUpperCase() + group.slice(1)}</h4>
                  {analysis.sentiment && (
                    <div className="sentiment">Sentiment: {analysis.sentiment.sentiment}</div>
                  )}
                  {analysis.key_concerns && analysis.key_concerns.length > 0 && (
                    <div className="concerns">
                      <h5>Key Concerns</h5>
                      <ul>
                        {analysis.key_concerns.map((concern, idx) => (
                          <li key={idx}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTopicsTab = (data) => {
    return (
      <div className="intelligence-section topics-tab">
        {data.topic_dashboard && (
          <div className="dashboard-panel">
            <h3>📈 Topic Trends</h3>
            <div className="trends-grid">
              {data.topic_dashboard.trending_up && data.topic_dashboard.trending_up.length > 0 && (
                <div className="trend-section">
                  <h4>🔼 Trending Up</h4>
                  <ul>
                    {data.topic_dashboard.trending_up.map((topic, idx) => (
                      <li key={idx}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.topic_dashboard.trending_down && data.topic_dashboard.trending_down.length > 0 && (
                <div className="trend-section">
                  <h4>🔽 Trending Down</h4>
                  <ul>
                    {data.topic_dashboard.trending_down.map((topic, idx) => (
                      <li key={idx}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {data.topic_deep_dives && Object.keys(data.topic_deep_dives).length > 0 && (
          <div className="topics-panel">
            <h3>🎯 Topic Analysis</h3>
            <div className="topic-cards">
              {Object.entries(data.topic_deep_dives).map(([topic, analysis]) => (
                <div key={topic} className="topic-card">
                  <h4>{topic}</h4>
                  <div className="topic-status">Status: {analysis.status}</div>
                  {analysis.impact_assessment && (
                    <div className="impact">Impact: {analysis.impact_assessment.level}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPredictionsTab = (data) => {
    return (
      <div className="intelligence-section predictions-tab">
        {data.predictive_scenarios && data.predictive_scenarios.length > 0 && (
          <div className="scenarios-panel">
            <h3>🔮 Predictive Scenarios</h3>
            <div className="scenarios-grid">
              {data.predictive_scenarios.map((scenario, idx) => (
                <div key={idx} className="scenario-card">
                  <h4>{scenario.scenario}</h4>
                  <div className="probability">Probability: {scenario.probability}%</div>
                  <p>{scenario.description}</p>
                  {scenario.triggers && scenario.triggers.length > 0 && (
                    <div className="triggers">
                      <h5>Triggers</h5>
                      <ul>
                        {scenario.triggers.slice(0, 3).map((trigger, tidx) => (
                          <li key={tidx}>{trigger}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scenario.cascade_effects && scenario.cascade_effects.length > 0 && (
                    <div className="effects">
                      <h5>Cascade Effects</h5>
                      <ul>
                        {scenario.cascade_effects.slice(0, 3).map((effect, eidx) => (
                          <li key={eidx}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.early_warnings && data.early_warnings.signals_detected && (
          <div className="warnings-panel">
            <h3>⚠️ Early Warning Signals</h3>
            <ul>
              {data.early_warnings.signals_detected.map((signal, idx) => (
                <li key={idx}>{signal}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderLegacyAnalysis = (analysisData, type) => {
    // Handle legacy format for backward compatibility
    const analysis = analysisData.primary_analysis || analysisData;
    const secondOpinion = analysisData.second_opinion;
    
    return (
      <div className="intelligence-section">
        {/* Key Insights */}
        {analysis.key_insights && (
          <div className="insights-panel">
            <h3>🎯 Key PR Insights</h3>
            <div className="insights-grid">
              {analysis.key_insights.map((insight, idx) => (
                <div key={idx} className="insight-card">
                  <div className="insight-icon">💡</div>
                  <div className="insight-content">
                    <p>{insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PR Recommendations */}
        {analysis.recommendations && (
          <div className="recommendations-panel">
            <h3>📋 PR Action Items</h3>
            <div className="recommendations-list">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="recommendation-item">
                  <div className="rec-number">{idx + 1}</div>
                  <div className="rec-content">
                    <p>{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Analysis */}
        {analysis.analysis && (
          <div className="analysis-panel">
            <h3>📊 Strategic Analysis</h3>
            <div className="analysis-content">
              <p>{analysis.analysis}</p>
            </div>
          </div>
        )}

        {/* Risks & Opportunities */}
        <div className="risk-opp-grid">
          {analysis.risks && (
            <div className="risks-panel">
              <h3>⚠️ PR Risks</h3>
              <ul className="risk-list">
                {analysis.risks.map((risk, idx) => (
                  <li key={idx} className="risk-item">{risk}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analysis.opportunities && (
            <div className="opportunities-panel">
              <h3>✨ PR Opportunities</h3>
              <ul className="opportunity-list">
                {analysis.opportunities.map((opp, idx) => (
                  <li key={idx} className="opportunity-item">{opp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Confidence Level */}
        {(analysis.confidence_level || analysisData.consensus_level) && (
          <div className="confidence-panel">
            <h4>Confidence Level</h4>
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ 
                  width: `${analysis.confidence_level || analysisData.consensus_level}%`,
                  backgroundColor: getConfidenceColor(analysis.confidence_level || analysisData.consensus_level)
                }}
              ></div>
              <span className="confidence-value">
                {analysis.confidence_level || analysisData.consensus_level}%
              </span>
            </div>
          </div>
        )}

        {/* Second Opinion if available */}
        {secondOpinion && (
          <div className="second-opinion-panel">
            <h3>🔍 Alternative Perspective</h3>
            <div className="second-opinion-content">
              {secondOpinion.assessment && <p>{secondOpinion.assessment}</p>}
              {secondOpinion.confidence_level && (
                <div className="confidence-note">
                  Confidence in primary analysis: {secondOpinion.confidence_level}%
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getConfidenceColor = (level) => {
    if (level >= 80) return '#00ff88';
    if (level >= 60) return '#ffcc00';
    if (level >= 40) return '#ff8800';
    return '#ff4444';
  };

  const renderContent = () => {
    if (!intelligenceData) return null;
    
    // Check if we have the new tab format
    if (intelligenceData.tabs) {
      const tabData = intelligenceData.tabs[activeTab];
      return renderTabContent(tabData, activeTab);
    }
    
    // Fall back to legacy format
    const data = intelligenceData[activeTab];
    return renderTabContent(data, activeTab);
  };

  return (
    <div className="intelligence-display intelligence-v2">
      {/* Header with Tabs */}
      <div className="intel-header">
        <div className="intel-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`intel-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ '--tab-color': tab.color }}
            >
              <span className="tab-icon">
                <tab.Icon size={18} color={activeTab === tab.id ? tab.color : 'rgba(255,255,255,0.6)'} />
              </span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="intel-content">
        {loading ? (
          <div className="loading-state enhanced">
            <div className="loading-stages">
              <div className={`loading-stage ${loadingStage === 'initializing' ? 'active' : loadingStage && loadingStage !== 'initializing' ? 'completed' : ''}`}>
                <div className="stage-icon">
                  <RocketIcon size={32} color={loadingStage === 'initializing' ? '#00ff88' : 'rgba(255,255,255,0.4)'} />
                </div>
                <div className="stage-content">
                  <h4>Initializing Intelligence Engine</h4>
                  <p>Connecting to data sources...</p>
                </div>
                <div className="stage-progress">
                  <div className="progress-bar">
                    <div className={`progress-fill ${loadingStage === 'initializing' ? 'animating' : loadingStage && loadingStage !== 'initializing' ? 'complete' : ''}`}></div>
                  </div>
                </div>
              </div>

              <div className={`loading-stage ${loadingStage === 'scanning' ? 'active' : ['analyzing', 'synthesizing'].includes(loadingStage) ? 'completed' : ''}`}>
                <div className="stage-icon">
                  <ScanIcon size={32} color={loadingStage === 'scanning' ? '#00ffcc' : ['analyzing', 'synthesizing'].includes(loadingStage) ? '#00ff88' : 'rgba(255,255,255,0.4)'} />
                </div>
                <div className="stage-content">
                  <h4>Scanning Media Landscape</h4>
                  <p>Analyzing competitors, news, and social signals...</p>
                </div>
                <div className="stage-progress">
                  <div className="progress-bar">
                    <div className={`progress-fill ${loadingStage === 'scanning' ? 'animating' : ['analyzing', 'synthesizing'].includes(loadingStage) ? 'complete' : ''}`}></div>
                  </div>
                </div>
              </div>

              <div className={`loading-stage ${loadingStage === 'analyzing' ? 'active' : loadingStage === 'synthesizing' ? 'completed' : ''}`}>
                <div className="stage-icon">
                  <AnalyzeIcon size={32} color={loadingStage === 'analyzing' ? '#00ff88' : loadingStage === 'synthesizing' ? '#00ff88' : 'rgba(255,255,255,0.4)'} />
                </div>
                <div className="stage-content">
                  <h4>Analyzing PR Opportunities</h4>
                  <p>Identifying trends and strategic insights...</p>
                </div>
                <div className="stage-progress">
                  <div className="progress-bar">
                    <div className={`progress-fill ${loadingStage === 'analyzing' ? 'animating' : loadingStage === 'synthesizing' ? 'complete' : ''}`}></div>
                  </div>
                </div>
              </div>

              <div className={`loading-stage ${loadingStage === 'synthesizing' ? 'active' : ''}`}>
                <div className="stage-icon">
                  <SynthesizeIcon size={32} color={loadingStage === 'synthesizing' ? '#8800ff' : 'rgba(255,255,255,0.4)'} />
                </div>
                <div className="stage-content">
                  <h4>Synthesizing Intelligence Report</h4>
                  <p>Generating actionable recommendations...</p>
                </div>
                <div className="stage-progress">
                  <div className="progress-bar">
                    <div className={`progress-fill ${loadingStage === 'synthesizing' ? 'animating' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="loading-footer">
              <div className="pulse-animation"></div>
              <p className="loading-message">Building comprehensive PR intelligence report</p>
              <p className="loading-sub">Analysis typically completes in 30-60 seconds</p>
            </div>
          </div>
        ) : intelligenceData ? (
          renderContent()
        ) : (
          <div className="empty-state">
            <p>Click refresh to gather PR intelligence</p>
            <button onClick={fetchIntelligence} className="refresh-btn primary">
              Start Intelligence Gathering
            </button>
          </div>
        )}
      </div>

      {/* Executive Summary Footer */}
      {intelligenceData?.executive_summary && (
        <div className="executive-summary">
          <h3>🎯 Executive PR Summary</h3>
          <div className="summary-grid">
            {intelligenceData.executive_summary.primary_analysis?.key_insights && (
              <div className="summary-section">
                <h4>Top PR Priorities</h4>
                <ul>
                  {intelligenceData.executive_summary.primary_analysis.key_insights.slice(0, 3).map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
            {intelligenceData.executive_summary.primary_analysis?.recommendations && (
              <div className="summary-section">
                <h4>Immediate PR Actions</h4>
                <ul>
                  {intelligenceData.executive_summary.primary_analysis.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx}>{rec}</li>
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

export default IntelligenceDisplayV2;