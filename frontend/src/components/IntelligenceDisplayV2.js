import React, { useState, useEffect } from 'react';
import './IntelligenceDisplay.css';
import claudeIntelligenceServiceV2 from '../services/claudeIntelligenceServiceV2';
import { 
  CompetitorIcon, StakeholderIcon, MediaIcon, PredictiveIcon, RocketIcon, 
  ScanIcon, AnalyzeIcon, SynthesizeIcon, AlertIcon, InsightIcon, 
  ActionIcon, ChartIcon, BuildingIcon, TargetIcon, TrendingUpIcon 
} from './Icons/NeonIcons';

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
    console.log(`📂 Rendering ${tabType} tab with data:`, {
      tabType,
      dataKeys: Object.keys(tabData || {}),
      hasExecutiveSummary: !!tabData?.executive_summary,
      executiveSummaryType: typeof tabData?.executive_summary
    });
    
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
    // Extract the actual summary text from the nested structure
    const summaryText = typeof data.executive_summary === 'string' 
      ? data.executive_summary 
      : data.executive_summary?.primary_analysis?.analysis || 
        data.executive_summary?.analysis || 
        'No executive summary available';
    
    // Extract insights and recommendations from the nested structure
    const insights = data.key_insights || 
      data.executive_summary?.primary_analysis?.key_insights || 
      data.executive_summary?.key_insights || [];
    
    const recommendations = data.recommended_actions || 
      data.executive_summary?.primary_analysis?.recommendations || 
      data.executive_summary?.recommendations || [];
    
    const alerts = data.critical_alerts || [];
    
    return (
      <div className="intelligence-section overview-tab">
        {summaryText && (
          <div className="executive-summary-panel">
            <div className="panel-header">
              <ChartIcon size={20} color="#00ffcc" />
              <h3>Executive Summary</h3>
            </div>
            <p>{summaryText}</p>
          </div>
        )}
        
        {alerts.length > 0 && (
          <div className="alerts-panel">
            <div className="panel-header">
              <AlertIcon size={20} color="#ff0064" />
              <h3>Critical Alerts</h3>
            </div>
            <div className="alerts-grid">
              {alerts.map((alert, idx) => (
                <div key={idx} className={`alert-card severity-${alert.severity || 'medium'}`}>
                  <div className="alert-type">{alert.type || 'Alert'}</div>
                  <div className="alert-message">{typeof alert === 'string' ? alert : alert.message}</div>
                  {alert.action_required && <div className="action-required">Action Required</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {insights.length > 0 && (
          <div className="insights-panel">
            <div className="panel-header">
              <InsightIcon size={20} color="#00ffcc" />
              <h3>Key Insights</h3>
            </div>
            <div className="insights-grid">
              {insights.map((insight, idx) => (
                <div key={idx} className={`insight-card impact-${insight.impact || 'medium'}`}>
                  <div className="insight-type">{insight.type || 'Insight'}</div>
                  <div className="insight-content">{typeof insight === 'string' ? insight : insight.insight || insight.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {recommendations.length > 0 && (
          <div className="actions-panel">
            <div className="panel-header">
              <ActionIcon size={20} color="#00ff88" />
              <h3>Recommended Actions</h3>
            </div>
            <div className="actions-list">
              {recommendations.map((action, idx) => {
                const actionText = typeof action === 'string' ? action : action.action || action.recommendation;
                const priority = action.priority || 'medium';
                const rationale = action.rationale || '';
                const owner = action.owner || 'PR Team';
                
                return (
                  <div key={idx} className={`action-item priority-${priority}`}>
                    <div className="action-priority">{priority}</div>
                    <div className="action-content">
                      <div className="action-text">{actionText}</div>
                      {rationale && <div className="action-rationale">{rationale}</div>}
                      <div className="action-owner">Owner: {owner}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCompetitionTab = (data) => {
    // Handle both nested and flat data structures
    const landscapeSummary = data.competitive_landscape?.summary || 
      data.competitive_landscape?.primary_analysis?.analysis ||
      data.competitive_landscape?.analysis ||
      (typeof data.competitive_landscape === 'string' ? data.competitive_landscape : null);
    
    const profiles = data.competitor_profiles || 
      data.competitive_landscape?.competitor_profiles || {};
    
    // Also check for competitive_opportunities or other competitive data
    const opportunities = data.competitive_opportunities || 
      data.competitive_landscape?.opportunities || [];
    
    return (
      <div className="intelligence-section competition-tab">
        {landscapeSummary && (
          <div className="landscape-panel">
            <div className="panel-header">
              <TargetIcon size={20} color="#ff00ff" />
              <h3>Competitive Landscape</h3>
            </div>
            <p>{landscapeSummary}</p>
          </div>
        )}
        
        {Object.keys(profiles).length > 0 && (
          <div className="competitors-panel">
            <div className="panel-header">
              <BuildingIcon size={20} color="#ff00ff" />
              <h3>Competitor Analysis</h3>
            </div>
            <div className="competitor-cards">
              {Object.entries(profiles).map(([name, profile]) => {
                const threatLevel = profile.threat_assessment?.level || 
                  profile.threat_level || 
                  profile.market_position?.position || 
                  'medium';
                
                const developments = profile.latest_developments || 
                  profile.recent_news || 
                  profile.developments || [];
                
                return (
                  <div key={name} className="competitor-card">
                    <h4>{name}</h4>
                    <div className="threat-level">Threat: {threatLevel}</div>
                    
                    {profile.market_position && (
                      <div className="market-position">
                        Position: {profile.market_position.position || 'competitive'}
                        {profile.market_position.trend && ` (${profile.market_position.trend})`}
                      </div>
                    )}
                    
                    {developments.length > 0 && (
                      <div className="developments">
                        <h5>Latest Developments</h5>
                        <ul>
                          {developments.slice(0, 3).map((dev, idx) => (
                            <li key={idx}>{dev.title || dev.headline || dev}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {profile.opportunities && profile.opportunities.length > 0 && (
                      <div className="opportunities">
                        <h5>Opportunities</h5>
                        <ul>
                          {profile.opportunities.slice(0, 2).map((opp, idx) => (
                            <li key={idx}>{opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {opportunities.length > 0 && (
          <div className="opportunities-panel">
            <div className="panel-header">
              <TrendingUpIcon size={20} color="#00ff88" />
              <h3>Competitive Opportunities</h3>
            </div>
            <ul className="opportunities-list">
              {opportunities.map((opp, idx) => (
                <li key={idx}>{typeof opp === 'string' ? opp : opp.opportunity || opp.description}</li>
              ))}
            </ul>
          </div>
        )}
        
        {data.competitive_landscape?.threats && data.competitive_landscape.threats.length > 0 && (
          <div className="threats-panel">
            <div className="panel-header">
              <AlertIcon size={20} color="#ff0064" />
              <h3>Reputation Threats</h3>
            </div>
            <ul className="threats-list">
              {data.competitive_landscape.threats.map((threat, idx) => (
                <li key={idx}>{threat}</li>
              ))}
            </ul>
          </div>
        )}
        
        {data.competitive_landscape?.second_opinion && (
          <div className="second-opinion-panel">
            <div className="panel-header">
              <InsightIcon size={20} color="#8800ff" />
              <h3>Alternative Competitive Analysis</h3>
            </div>
            <p>{data.competitive_landscape.second_opinion.assessment || data.competitive_landscape.second_opinion}</p>
            {data.competitive_landscape.second_opinion.confidence_level && (
              <div className="confidence-note">
                Confidence: {data.competitive_landscape.second_opinion.confidence_level}%
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStakeholdersTab = (data) => {
    // Extract rich stakeholder analysis
    const sentimentOverview = data.sentiment_overview;
    const groupPriorities = data.group_priorities || {};
    const engagementStrategy = data.engagement_strategy || [];
    const messagingFrameworks = data.messaging_frameworks || {};
    const secondOpinion = data.second_opinion;
    
    // Legacy fallbacks
    const groupAnalysis = groupPriorities || data.group_analysis || {};
    const sentimentData = data.sentiment || {};
    
    return (
      <div className="intelligence-section stakeholders-tab">
        {sentimentOverview && (
          <div className="landscape-panel">
            <h3>👥 Stakeholder Sentiment Overview</h3>
            <p>{sentimentOverview}</p>
          </div>
        )}
        
        {engagementStrategy.length > 0 && (
          <div className="engagement-panel">
            <h3>📋 Engagement Strategy</h3>
            <ul>
              {engagementStrategy.map((strategy, idx) => (
                <li key={idx}>{strategy}</li>
              ))}
            </ul>
          </div>
        )}
        
        {secondOpinion && (
          <div className="second-opinion-panel">
            <h3>🔄 Alternative Perspective</h3>
            <p>{secondOpinion.assessment || secondOpinion}</p>
          </div>
        )}
        
        {Object.keys(groupAnalysis).length > 0 && (
          <div className="groups-panel">
            <h3>📊 Stakeholder Groups</h3>
            <div className="stakeholder-groups">
              {Object.entries(groupAnalysis).map(([group, analysis]) => {
                const sentiment = analysis.sentiment?.sentiment || 
                  analysis.sentiment || 
                  sentimentData[group]?.sentiment || 
                  'neutral';
                
                const concerns = analysis.key_concerns || 
                  analysis.concerns || 
                  analysis.topics || [];
                
                const opportunities = analysis.opportunities || [];
                
                return (
                  <div key={group} className="stakeholder-group">
                    <h4>{group.charAt(0).toUpperCase() + group.slice(1)}</h4>
                    <div className="sentiment">Sentiment: {sentiment}</div>
                    
                    {concerns.length > 0 && (
                      <div className="concerns">
                        <h5>Key Concerns</h5>
                        <ul>
                          {concerns.map((concern, idx) => (
                            <li key={idx}>{typeof concern === 'string' ? concern : concern.topic || concern.concern}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {opportunities.length > 0 && (
                      <div className="opportunities">
                        <h5>Engagement Opportunities</h5>
                        <ul>
                          {opportunities.map((opp, idx) => (
                            <li key={idx}>{typeof opp === 'string' ? opp : opp.opportunity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {Object.keys(sentimentData).length > 0 && Object.keys(groupAnalysis).length === 0 && (
          <div className="sentiment-panel">
            <h3>📊 Sentiment Analysis</h3>
            <div className="sentiment-breakdown">
              {Object.entries(sentimentData).map(([source, data]) => (
                <div key={source} className="sentiment-item">
                  <h4>{source}</h4>
                  <div className="sentiment-value">{data.sentiment || data}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTopicsTab = (data) => {
    // Extract rich narrative analysis
    const trendingOverview = data.trending_overview;
    const narrativeOpportunities = data.narrative_opportunities || [];
    const contentAngles = data.content_angles || [];
    const mediaRisks = data.media_risks || [];
    const secondOpinion = data.second_opinion;
    
    // Legacy support
    const trendingTopics = data.trending_topics || [];
    const mediaCoverage = data.media_coverage || [];
    const emergingTopics = data.emerging_topics || [];
    
    // For dashboard display
    const dashboard = data.topic_dashboard || {};
    const trendingUp = dashboard.trending_up || [];
    const trendingDown = dashboard.trending_down || [];
    const stable = dashboard.stable || [];
    const deepDives = data.topic_deep_dives || {};
    
    return (
      <div className="intelligence-section topics-tab">
        {(trendingUp.length > 0 || trendingDown.length > 0 || stable.length > 0) && (
          <div className="dashboard-panel">
            <h3>📈 Topic Trends</h3>
            <div className="trends-grid">
              {trendingUp.length > 0 && (
                <div className="trend-section">
                  <h4>🔼 Trending Up</h4>
                  <ul>
                    {trendingUp.map((topic, idx) => (
                      <li key={idx}>{typeof topic === 'string' ? topic : topic.name || topic.topic}</li>
                    ))}
                  </ul>
                </div>
              )}
              {trendingDown.length > 0 && (
                <div className="trend-section">
                  <h4>🔽 Trending Down</h4>
                  <ul>
                    {trendingDown.map((topic, idx) => (
                      <li key={idx}>{typeof topic === 'string' ? topic : topic.name || topic.topic}</li>
                    ))}
                  </ul>
                </div>
              )}
              {stable.length > 0 && (
                <div className="trend-section">
                  <h4>➡️ Stable Topics</h4>
                  <ul>
                    {stable.map((topic, idx) => (
                      <li key={idx}>{typeof topic === 'string' ? topic : topic.name || topic.topic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {Object.keys(deepDives).length > 0 && (
          <div className="topics-panel">
            <h3>🎯 Topic Analysis</h3>
            <div className="topic-cards">
              {Object.entries(deepDives).map(([topic, analysis]) => {
                const status = analysis.status || analysis.trend || 'active';
                const impact = analysis.impact_assessment?.level || analysis.impact || 'medium';
                const sentiment = analysis.sentiment || 'neutral';
                const volume = analysis.volume || analysis.mentions || 0;
                
                return (
                  <div key={topic} className="topic-card">
                    <h4>{topic}</h4>
                    <div className="topic-status">Status: {status}</div>
                    <div className="impact">Impact: {impact}</div>
                    {sentiment !== 'neutral' && <div className="sentiment">Sentiment: {sentiment}</div>}
                    {volume > 0 && <div className="volume">Mentions: {volume}</div>}
                    
                    {analysis.key_points && analysis.key_points.length > 0 && (
                      <div className="key-points">
                        <h5>Key Points</h5>
                        <ul>
                          {analysis.key_points.slice(0, 3).map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {emergingTopics.length > 0 && (
          <div className="emerging-panel">
            <h3>🌟 Emerging Topics</h3>
            <ul className="emerging-list">
              {emergingTopics.map((topic, idx) => (
                <li key={idx}>{typeof topic === 'string' ? topic : topic.name || topic.topic}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderPredictionsTab = (data) => {
    // Extract rich predictive analysis
    const scenarioOverview = data.scenario_overview;
    const likelyScenarios = data.likely_scenarios || data.scenarios || [];
    const cascadeEffects = data.cascade_effects || [];
    const proactiveStrategies = data.proactive_strategies || [];
    const secondOpinion = data.second_opinion;
    
    // Legacy support
    const scenarios = likelyScenarios; // Use the same variable
    const predictions = data.predictions || [];
    const warnings = data.early_warnings || data.warnings || {};
    const signals = warnings.signals_detected || warnings.signals || [];
    
    return (
      <div className="intelligence-section predictions-tab">
        {scenarioOverview && (
          <div className="overview-panel">
            <h3>🔮 Predictive Intelligence Overview</h3>
            <p>{scenarioOverview}</p>
          </div>
        )}
        
        {cascadeEffects.length > 0 && (
          <div className="cascade-panel">
            <h3>⚠️ Cascade Effects</h3>
            <ul>
              {cascadeEffects.map((effect, idx) => (
                <li key={idx}>{effect}</li>
              ))}
            </ul>
          </div>
        )}
        
        {proactiveStrategies.length > 0 && (
          <div className="strategies-panel">
            <h3>🎯 Proactive PR Strategies</h3>
            <ul>
              {proactiveStrategies.map((strategy, idx) => (
                <li key={idx}>{strategy}</li>
              ))}
            </ul>
          </div>
        )}
        
        {secondOpinion && (
          <div className="second-opinion-panel">
            <h3>🔄 Alternative Future Scenario</h3>
            <p>{secondOpinion.assessment || secondOpinion}</p>
          </div>
        )}
        
        {likelyScenarios.length > 0 && (
          <div className="scenarios-panel">
            <h3>🔮 Predictive Scenarios</h3>
            <div className="scenarios-grid">
              {scenarios.map((scenario, idx) => {
                const scenarioName = scenario.scenario || scenario.name || `Scenario ${idx + 1}`;
                const probability = scenario.probability || scenario.likelihood || 50;
                const description = scenario.description || scenario.analysis || '';
                const triggers = scenario.triggers || scenario.indicators || [];
                const effects = scenario.cascade_effects || scenario.impacts || scenario.effects || [];
                
                return (
                  <div key={idx} className="scenario-card">
                    <h4>{scenarioName}</h4>
                    <div className="probability">Probability: {probability}%</div>
                    {description && <p>{description}</p>}
                    
                    {triggers.length > 0 && (
                      <div className="triggers">
                        <h5>Triggers</h5>
                        <ul>
                          {triggers.slice(0, 3).map((trigger, tidx) => (
                            <li key={tidx}>{typeof trigger === 'string' ? trigger : trigger.indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {effects.length > 0 && (
                      <div className="effects">
                        <h5>Cascade Effects</h5>
                        <ul>
                          {effects.slice(0, 3).map((effect, eidx) => (
                            <li key={eidx}>{typeof effect === 'string' ? effect : effect.impact}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {predictions.length > 0 && (
          <div className="predictions-panel">
            <h3>📊 Market Predictions</h3>
            <div className="predictions-list">
              {predictions.map((prediction, idx) => (
                <div key={idx} className="prediction-item">
                  <h4>{prediction.title || prediction.prediction}</h4>
                  {prediction.timeframe && <div className="timeframe">Timeframe: {prediction.timeframe}</div>}
                  {prediction.confidence && <div className="confidence">Confidence: {prediction.confidence}%</div>}
                  {prediction.rationale && <p>{prediction.rationale}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {signals.length > 0 && (
          <div className="warnings-panel">
            <h3>⚠️ Early Warning Signals</h3>
            <ul>
              {signals.map((signal, idx) => (
                <li key={idx}>{typeof signal === 'string' ? signal : signal.signal || signal.warning}</li>
              ))}
            </ul>
          </div>
        )}
        
        {warnings.risk_factors && warnings.risk_factors.length > 0 && (
          <div className="risks-panel">
            <h3>🚨 Risk Factors</h3>
            <ul>
              {warnings.risk_factors.map((risk, idx) => (
                <li key={idx}>{typeof risk === 'string' ? risk : risk.factor}</li>
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