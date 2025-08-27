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
  const [activeTab, setActiveTab] = useState('market_activity'); // Default to V5 first tab (entity-focused)
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
      
      // Update activeTab if current tab doesn't exist in new data
      if (intelligence?.tabs && !intelligence.tabs[activeTab]) {
        const firstTab = Object.keys(intelligence.tabs)[0];
        console.log(`📂 Switching to first available tab: ${firstTab}`);
        setActiveTab(firstTab);
      }
    } catch (err) {
      console.error('❌ Intelligence fetch failed:', err);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  // Dynamically determine tabs based on the data structure
  const getTabsFromData = () => {
    if (!intelligenceData?.tabs) {
      // Default V5 tabs if no data yet
      return [
        { id: 'market_activity', name: 'Market Activity', Icon: TrendingUpIcon, color: '#ff00ff' },
        { id: 'competitor_intelligence', name: 'Competitor Intel', Icon: CompetitorIcon, color: '#00ffcc' },
        { id: 'social_pulse', name: 'Social Pulse', Icon: MediaIcon, color: '#00ff88' },
        { id: 'industry_signals', name: 'Industry Signals', Icon: ChartIcon, color: '#ffcc00' },
        { id: 'media_coverage', name: 'Media Coverage', Icon: InsightIcon, color: '#8800ff' }
      ];
    }
    
    const tabKeys = Object.keys(intelligenceData.tabs);
    
    // V6 PR Impact tabs
    if (tabKeys.includes('narrative_landscape')) {
      return [
        { id: 'narrative_landscape', name: 'Narrative Landscape', Icon: RocketIcon, color: '#ff00ff' },
        { id: 'competitive_dynamics', name: 'Competitive Dynamics', Icon: CompetitorIcon, color: '#00ffcc' },
        { id: 'stakeholder_sentiment', name: 'Stakeholder Sentiment', Icon: StakeholderIcon, color: '#00ff88' },
        { id: 'media_momentum', name: 'Media Momentum', Icon: MediaIcon, color: '#ffcc00' },
        { id: 'strategic_signals', name: 'Strategic Signals', Icon: ChartIcon, color: '#8800ff' }
      ];
    }
    
    // V5 Analytical tabs
    if (tabKeys.includes('market_activity')) {
      return [
        { id: 'market_activity', name: 'Market Activity', Icon: TrendingUpIcon, color: '#ff00ff' },
        { id: 'competitor_intelligence', name: 'Competitor Intel', Icon: CompetitorIcon, color: '#00ffcc' },
        { id: 'social_pulse', name: 'Social Pulse', Icon: MediaIcon, color: '#00ff88' },
        { id: 'industry_signals', name: 'Industry Signals', Icon: ChartIcon, color: '#ffcc00' },
        { id: 'media_coverage', name: 'Media Coverage', Icon: InsightIcon, color: '#8800ff' }
      ];
    }
    
    // Legacy tabs
    return [
      { id: 'overview', name: 'Overview', Icon: RocketIcon, color: '#ff00ff' },
      { id: 'competition', name: 'Competition', Icon: CompetitorIcon, color: '#00ffcc' },
      { id: 'stakeholders', name: 'Stakeholders', Icon: StakeholderIcon, color: '#00ff88' },
      { id: 'topics', name: 'Topics & Media', Icon: MediaIcon, color: '#ffcc00' },
      { id: 'predictions', name: 'Predictions', Icon: PredictiveIcon, color: '#8800ff' }
    ];
  };
  
  const tabs = getTabsFromData();

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

    // Handle tab-specific rendering for V6 PR Impact or V5 analytical structure
    switch (tabType) {
      // V6 PR Impact tabs
      case 'narrative_landscape':
        return renderNarrativeLandscapeTab(tabData);
      case 'competitive_dynamics':
        return renderCompetitiveDynamicsTab(tabData);
      case 'stakeholder_sentiment':
        return renderStakeholderSentimentTab(tabData);
      case 'media_momentum':
        return renderMediaMomentumTab(tabData);
      case 'strategic_signals':
        return renderStrategicSignalsTab(tabData);
      // V5 Analytical tabs
      case 'market_activity':
        return renderMarketActivityTab(tabData);
      case 'competitor_intelligence':
        return renderCompetitorIntelTab(tabData);
      case 'social_pulse':
        return renderSocialPulseTab(tabData);
      case 'industry_signals':
        return renderIndustrySignalsTab(tabData);
      case 'media_coverage':
        return renderMediaCoverageTab(tabData);
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

  // New V5 Analytical Tab Render Functions
  // V6 PR Impact Tab Renderers
  const renderNarrativeLandscapeTab = (data) => {
    const hasData = data && (data.current_position || data.key_developments?.length > 0);
    
    return (
      <div className="intelligence-section narrative-landscape-tab">
        <div className="narrative-status-panel" style={{ '--accent-color': '#ff00ff' }}>
          <div className="panel-header">
            <RocketIcon size={20} color="#ff00ff" />
            <h3>Narrative Position</h3>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
            {data.current_position || 'Analyzing your organization\'s position in the current narrative landscape...'}
          </p>
          <div className="narrative-metrics">
            <div className="metric">
              <span className="label">Narrative Control</span>
              <span className={`value control-${data.narrative_control || 'contested'}`}>
                {(data.narrative_control || 'contested').toUpperCase()}
              </span>
            </div>
            <div className="metric">
              <span className="label">Attention Flow</span>
              <span className={`value flow-${data.attention_flow || 'neutral'}`}>
                {(data.attention_flow || 'neutral').replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {data.key_developments && data.key_developments.length > 0 ? (
          <div className="developments-panel">
            <h4>🎯 Key PR Developments</h4>
            <div className="developments-list">
              {data.key_developments.map((dev, idx) => (
                <div key={idx} className={`development-card impact-${dev.pr_impact || 'neutral'}`}>
                  <div className="development-header">
                    <span className={`impact-badge ${dev.pr_impact || 'neutral'}`}>
                      {(dev.pr_impact || 'neutral').toUpperCase()}
                    </span>
                    <span className="source">Source: {dev.source || 'Analysis'}</span>
                  </div>
                  <div className="development-content">
                    {dev.development || 'Development details pending...'}
                  </div>
                  {dev.impact_description && (
                    <div className="impact-description">
                      → {dev.impact_description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="developments-panel">
            <h4>🎯 Key PR Developments</h4>
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Monitoring for narrative developments...
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCompetitiveDynamicsTab = (data) => {
    const hasThreats = data.narrative_threats?.length > 0;
    const hasOpportunities = data.narrative_opportunities?.length > 0;
    
    return (
      <div className="intelligence-section competitive-dynamics-tab">
        <div className="positioning-panel" style={{ '--accent-color': '#00ffcc' }}>
          <div className="panel-header">
            <CompetitorIcon size={20} color="#00ffcc" />
            <h3>PR Positioning</h3>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6' }}>
            {data.pr_positioning || 'Analyzing your competitive PR positioning and narrative dynamics...'}
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: hasThreats && hasOpportunities ? '1fr 1fr' : '1fr', gap: '20px' }}>
          {hasThreats ? (
            <div className="threats-panel">
              <h4>⚠️ Narrative Threats</h4>
              <div className="threats-list">
                {data.narrative_threats.map((threat, idx) => (
                  <div key={idx} className={`threat-card urgency-${threat.urgency || 'medium'}`}>
                    <div className="threat-header">
                      <span className="competitor">From: {threat.competitor || 'Competitor'}</span>
                      <span className={`urgency-badge ${threat.urgency || 'medium'}`}>
                        {(threat.urgency || 'medium').toUpperCase()}
                      </span>
                    </div>
                    <div className="threat-content">
                      {threat.threat || 'Threat details pending...'}
                    </div>
                    {threat.pr_impact && (
                      <div className="pr-impact">
                        → Impact: {threat.pr_impact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="threats-panel">
              <h4>⚠️ Narrative Threats</h4>
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                No immediate threats detected
              </div>
            </div>
          )}
          
          {hasOpportunities ? (
            <div className="opportunities-panel">
              <h4>💡 PR Opportunities</h4>
              <div className="opportunities-list">
                {data.narrative_opportunities.map((opp, idx) => (
                  <div key={idx} className={`opportunity-card value-${opp.pr_value || 'medium'}`}>
                    <div className="opportunity-header">
                      <span className={`value-badge ${opp.pr_value || 'medium'}`}>
                        {(opp.pr_value || 'medium').toUpperCase()} VALUE
                      </span>
                      <span className="timing">Timing: {opp.timing || 'Monitor'}</span>
                    </div>
                    <div className="opportunity-content">
                      {opp.opportunity || 'Opportunity details pending...'}
                    </div>
                    {opp.trigger && (
                      <div className="trigger">
                        Trigger: {opp.trigger}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="opportunities-panel">
              <h4>💡 PR Opportunities</h4>
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                Scanning for opportunities...
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStakeholderSentimentTab = (data) => {
    return (
      <div className="intelligence-section stakeholder-sentiment-tab">
        <div className="sentiment-overview-panel" style={{ '--accent-color': '#00ff88' }}>
          <div className="panel-header">
            <StakeholderIcon size={20} color="#00ff88" />
            <h3>Sentiment Trajectory</h3>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
            {data.pr_implications || 'Monitoring stakeholder sentiment and engagement priorities...'}
          </p>
          <div className="sentiment-metrics">
            <div className="metric">
              <span className="label">Overall Trajectory</span>
              <span className={`value trajectory-${data.overall_trajectory || 'stable'}`}>
                {(data.overall_trajectory || 'stable').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {data.sentiment_drivers && data.sentiment_drivers.length > 0 ? (
          <div className="drivers-panel">
            <h4>👥 Stakeholder Groups</h4>
            <div className="drivers-list">
              {data.sentiment_drivers.map((driver, idx) => (
                <div key={idx} className={`driver-card priority-${driver.pr_priority || 'medium'}`}>
                  <div className="driver-header">
                    <span className="stakeholder-group">
                      {(driver.stakeholder_group || 'Group').toUpperCase()}
                    </span>
                    <span className={`priority-badge ${driver.pr_priority || 'medium'}`}>
                      {(driver.pr_priority || 'medium').toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <div className="driver-content">
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                      <span className={`sentiment-indicator ${driver.sentiment || 'neutral'}`}>
                        Sentiment: {(driver.sentiment || 'neutral').toUpperCase()}
                      </span>
                      <span className={`trending-indicator ${driver.trending || 'stable'}`}>
                        {driver.trending === 'up' ? '↑' : driver.trending === 'down' ? '↓' : '→'} {(driver.trending || 'stable').toUpperCase()}
                      </span>
                    </div>
                    {driver.key_concerns && driver.key_concerns.length > 0 && (
                      <div className="pr-implications">
                        Key Concerns: {driver.key_concerns.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="drivers-panel">
            <h4>👥 Stakeholder Groups</h4>
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Analyzing stakeholder sentiment...
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMediaMomentumTab = (data) => {
    return (
      <div className="intelligence-section media-momentum-tab">
        <div className="momentum-panel" style={{ '--accent-color': '#ffcc00' }}>
          <div className="panel-header">
            <MediaIcon size={20} color="#ffcc00" />
            <h3>Media Momentum</h3>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
            Tracking media coverage patterns and PR amplification opportunities
          </p>
          <div className="momentum-metrics">
            <div className="metric">
              <span className="label">Coverage Trajectory</span>
              <span className={`value coverage-${data.coverage_trajectory || 'stable'}`}>
                {(data.coverage_trajectory || 'stable').replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div className="metric">
              <span className="label">Narrative Alignment</span>
              <span className={`value alignment-${data.narrative_alignment || 'mixed'}`}>
                {(data.narrative_alignment || 'mixed').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {data.pr_leverage_points && data.pr_leverage_points.length > 0 ? (
          <div className="leverage-panel">
            <h4>🎯 PR Leverage Points</h4>
            <div className="leverage-list">
              {data.pr_leverage_points.map((point, idx) => (
                <div key={idx} className={`leverage-card momentum-${point.momentum || 'stable'}`}>
                  <div className="leverage-header">
                    <span className="topic" style={{ fontWeight: '600' }}>
                      {point.topic || 'Topic'}
                    </span>
                    <span className={`value-badge ${point.momentum || 'stable'}`}>
                      {(point.momentum || 'stable').toUpperCase()}
                    </span>
                  </div>
                  <div className="leverage-content">
                    {point.relevance_to_us && (
                      <div style={{ marginBottom: '8px', color: '#ffffff' }}>
                        {point.relevance_to_us}
                      </div>
                    )}
                    {point.pr_opportunity && (
                      <div className="pr-opportunity">
                        → Opportunity: {point.pr_opportunity}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="leverage-panel">
            <h4>🎯 PR Leverage Points</h4>
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Identifying media opportunities...
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStrategicSignalsTab = (data) => {
    return (
      <div className="intelligence-section strategic-signals-tab">
        <div className="signals-panel" style={{ '--accent-color': '#8800ff' }}>
          <div className="panel-header">
            <ChartIcon size={20} color="#8800ff" />
            <h3>Strategic Signals</h3>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
            {data.regulatory_implications || 'Monitoring regulatory environment and industry shifts affecting your PR strategy...'}
          </p>
        </div>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          {data.industry_narrative_shifts && data.industry_narrative_shifts.length > 0 ? (
          <div className="shifts-panel">
            <h4>🔄 Industry Narrative Shifts</h4>
            <div className="shifts-list">
              {data.industry_narrative_shifts.map((shift, idx) => (
                <div key={idx} className={`shift-card impact-${shift.pr_impact || 'neutral'}`}>
                  <div className="shift-header">
                    <span className={`impact-badge ${shift.pr_impact || 'neutral'}`}>
                      {(shift.pr_impact || 'neutral').toUpperCase()} IMPACT
                    </span>
                  </div>
                  <div className="shift-content">
                    {shift.shift || 'Shift details pending...'}
                  </div>
                  {shift.preparation_needed && (
                    <div className="preparation-needed">
                      → Preparation: {shift.preparation_needed}
                    </div>
                  )}
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="shifts-panel">
              <h4>🔄 Industry Narrative Shifts</h4>
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                Monitoring industry narratives...
              </div>
            </div>
          )}
          
          {data.pr_action_triggers && data.pr_action_triggers.length > 0 ? (
            <div className="triggers-panel">
              <h4>⚡ PR Action Triggers</h4>
              <div className="triggers-list">
                {data.pr_action_triggers.map((trigger, idx) => (
                  <div key={idx} className={`trigger-card urgency-${trigger.response_urgency || 'monitor'}`}>
                    <div className="trigger-header">
                      <span className={`response-badge ${trigger.response_urgency || 'monitor'}`}>
                        {(trigger.response_urgency || 'monitor').toUpperCase()}
                      </span>
                    </div>
                    <div className="trigger-content">
                      <div style={{ marginBottom: '8px', color: '#ffffff' }}>
                        {trigger.signal || 'Signal details pending...'}
                      </div>
                      {trigger.pr_implication && (
                        <div className="pr-implications">
                          → Implication: {trigger.pr_implication}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="triggers-panel">
              <h4>⚡ PR Action Triggers</h4>
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                Monitoring for action triggers...
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMarketActivityTab = (data) => {
    return (
      <div className="intelligence-section market-activity-tab">
        <div className="summary-panel">
          <div className="panel-header">
            <TrendingUpIcon size={20} color="#ff00ff" />
            <h3>Market Activity Overview</h3>
          </div>
          <p>{data.summary || 'No market activity data available'}</p>
          {data.statistics && (
            <div className="stats-row">
              <div className="stat">
                <span className="stat-value">{data.statistics.total_articles || 0}</span>
                <span className="stat-label">Articles</span>
              </div>
              <div className="stat">
                <span className="stat-value">{data.statistics.sources || 0}</span>
                <span className="stat-label">Sources</span>
              </div>
              <div className="stat">
                <span className="stat-value">{data.statistics.time_range || 'N/A'}</span>
                <span className="stat-label">Time Range</span>
              </div>
            </div>
          )}
        </div>

        {data.key_findings && data.key_findings.length > 0 && (
          <div className="findings-panel">
            <div className="panel-header">
              <InsightIcon size={20} color="#00ffcc" />
              <h3>Key Market Events</h3>
            </div>
            <div className="findings-grid">
              {data.key_findings.map((finding, idx) => (
                <div key={idx} className="finding-card">
                  <div className="finding-category">{finding.category || 'Event'}</div>
                  <div className="finding-content">{finding.finding}</div>
                  <div className="finding-meta">
                    <span className="finding-source">{finding.source}</span>
                    {finding.timestamp && (
                      <span className="finding-time">
                        {new Date(finding.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCompetitorIntelTab = (data) => {
    return (
      <div className="intelligence-section competitor-intel-tab">
        <div className="summary-panel">
          <div className="panel-header">
            <CompetitorIcon size={20} color="#00ffcc" />
            <h3>Competitor Intelligence</h3>
          </div>
          <p>{data.summary || 'No competitor intelligence available'}</p>
          {data.competitors_tracked && (
            <div className="tracked-competitors">
              <strong>Tracked Competitors:</strong> {data.competitors_tracked.join(', ')}
            </div>
          )}
        </div>

        {data.movements && data.movements.length > 0 && (
          <div className="movements-panel">
            <div className="panel-header">
              <TargetIcon size={20} color="#ff00ff" />
              <h3>Competitor Movements ({data.total_actions || data.movements.length})</h3>
            </div>
            <div className="movements-timeline">
              {data.movements.map((movement, idx) => (
                <div key={idx} className="movement-item">
                  <div className="movement-competitor">{movement.competitor}</div>
                  <div className="movement-action">{movement.action}</div>
                  <div className="movement-meta">
                    <span className="movement-source">{movement.source}</span>
                    {movement.timestamp && (
                      <span className="movement-time">
                        {new Date(movement.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSocialPulseTab = (data) => {
    return (
      <div className="intelligence-section social-pulse-tab">
        <div className="summary-panel">
          <div className="panel-header">
            <MediaIcon size={20} color="#00ff88" />
            <h3>Social Media Pulse</h3>
          </div>
          <p>{data.summary || 'No social media data available'}</p>
        </div>

        {data.sentiment_breakdown && (
          <div className="sentiment-panel">
            <div className="panel-header">
              <ChartIcon size={20} color="#00ffcc" />
              <h3>Sentiment Analysis ({data.total_posts || 0} posts)</h3>
            </div>
            <div className="sentiment-chart">
              <div className="sentiment-bar">
                <div 
                  className="sentiment-positive" 
                  style={{ width: `${(data.sentiment_breakdown.positive / data.total_posts) * 100 || 0}%` }}
                >
                  {data.sentiment_breakdown.positive} Positive
                </div>
                <div 
                  className="sentiment-neutral" 
                  style={{ width: `${(data.sentiment_breakdown.neutral / data.total_posts) * 100 || 0}%` }}
                >
                  {data.sentiment_breakdown.neutral} Neutral
                </div>
                <div 
                  className="sentiment-negative" 
                  style={{ width: `${(data.sentiment_breakdown.negative / data.total_posts) * 100 || 0}%` }}
                >
                  {data.sentiment_breakdown.negative} Negative
                </div>
              </div>
            </div>
          </div>
        )}

        {data.trending_topics && data.trending_topics.length > 0 && (
          <div className="trending-panel">
            <div className="panel-header">
              <TrendingUpIcon size={20} color="#ffcc00" />
              <h3>Trending Topics</h3>
            </div>
            <div className="trending-topics">
              {data.trending_topics.map((topic, idx) => (
                <span key={idx} className="trending-topic">{topic}</span>
              ))}
            </div>
          </div>
        )}

        {data.key_discussions && data.key_discussions.length > 0 && (
          <div className="discussions-panel">
            <div className="panel-header">
              <InsightIcon size={20} color="#ff00ff" />
              <h3>Key Discussions</h3>
            </div>
            <div className="discussions-grid">
              {data.key_discussions.map((discussion, idx) => (
                <div key={idx} className="discussion-card">
                  <div className="discussion-topic">{discussion.topic}</div>
                  <div className="discussion-platform">{discussion.platform}</div>
                  <div className="discussion-metrics">
                    <span className={`sentiment-${discussion.sentiment}`}>
                      {discussion.sentiment}
                    </span>
                    <span className="engagement">{discussion.engagement} engagement</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderIndustrySignalsTab = (data) => {
    return (
      <div className="intelligence-section industry-signals-tab">
        <div className="summary-panel">
          <div className="panel-header">
            <ChartIcon size={20} color="#ffcc00" />
            <h3>Industry Signals</h3>
          </div>
          <p>{data.summary || 'No industry signals detected'}</p>
        </div>

        {data.indicators && data.indicators.length > 0 && (
          <div className="indicators-panel">
            <div className="panel-header">
              <TrendingUpIcon size={20} color="#00ffcc" />
              <h3>Market Indicators</h3>
            </div>
            <div className="indicators-grid">
              {data.indicators.map((indicator, idx) => (
                <div key={idx} className="indicator-card">
                  <div className="indicator-signal">{indicator.signal}</div>
                  <div className="indicator-metric">{indicator.metric}</div>
                  <div className="indicator-trend">{indicator.trend}</div>
                  <div className="indicator-source">{indicator.source}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.hiring_activity && (
          <div className="hiring-panel">
            <div className="panel-header">
              <BuildingIcon size={20} color="#00ff88" />
              <h3>Hiring Activity</h3>
            </div>
            <div className="hiring-stats">
              <div className="hiring-stat">
                <span className="stat-value">{data.hiring_activity.total_postings || 0}</span>
                <span className="stat-label">Total Job Postings</span>
              </div>
              <div className="hiring-stat">
                <span className="stat-value">{data.hiring_activity.growth_rate || 'N/A'}</span>
                <span className="stat-label">Growth Rate</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMediaCoverageTab = (data) => {
    return (
      <div className="intelligence-section media-coverage-tab">
        <div className="summary-panel">
          <div className="panel-header">
            <InsightIcon size={20} color="#8800ff" />
            <h3>Media Coverage Analysis</h3>
          </div>
          <p>{data.summary || 'No media coverage data available'}</p>
          <div className="coverage-stats">
            <div className="stat">
              <span className="stat-value">{data.coverage_volume || 0}</span>
              <span className="stat-label">Articles</span>
            </div>
            <div className="stat">
              <span className="stat-value">{data.source_count || 0}</span>
              <span className="stat-label">Sources</span>
            </div>
            <div className="stat">
              <span className={`stat-value sentiment-${data.sentiment_trend}`}>
                {data.sentiment_trend || 'neutral'}
              </span>
              <span className="stat-label">Sentiment Trend</span>
            </div>
          </div>
        </div>

        {data.top_narratives && data.top_narratives.length > 0 && (
          <div className="narratives-panel">
            <div className="panel-header">
              <MediaIcon size={20} color="#ff00ff" />
              <h3>Top Narratives</h3>
            </div>
            <div className="narratives-grid">
              {data.top_narratives.map((narrative, idx) => (
                <div key={idx} className="narrative-card">
                  <div className="narrative-text">{narrative.narrative}</div>
                  <div className="narrative-meta">
                    <span className="narrative-frequency">{narrative.frequency} mentions</span>
                    <div className="narrative-sources">
                      {narrative.sources?.slice(0, 3).map((source, sidx) => (
                        <span key={sidx} className="source-tag">{source}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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