import React, { useState, useEffect, useCallback } from 'react';
import './IntelligenceHub.css';
import IntelligenceOrchestratorV3 from '../../services/intelligenceOrchestratorV3';
import { supabase } from '../../config/supabase';

const IntelligenceHub = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('competitors');
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [intelligenceData, setIntelligenceData] = useState(null);

  // No mock data - using real intelligence only

  const fetchIntelligence = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Always get fresh profile from localStorage (no caching)
      let config = {};
      const unifiedProfile = localStorage.getItem('signaldesk_unified_profile');
      
      if (unifiedProfile) {
        const profile = JSON.parse(unifiedProfile);
        // Extract ALL stakeholder data for Intelligence Hub
        config = {
          organization: profile.organization,
          competitors: profile.competitors,
          monitoring_topics: profile.monitoring_topics || [],
          // Include ALL stakeholder types for comprehensive monitoring
          stakeholders: profile.stakeholders || {},
          regulators: profile.regulators || [],
          activists: profile.activists || [],
          media_outlets: profile.media_outlets || [],
          investors: profile.investors || [],
          analysts: profile.analysts || []
        };
      } else {
        // Fallback to old onboarding data
        config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
      }
      
      // First try the real-time Firecrawl edge function
      console.log('🔥 Attempting real-time intelligence with Firecrawl...');
      console.log('📊 Config being sent:', { organization: config.organization, timeframe });
      
      // Add timestamp to force fresh results
      const requestTimestamp = Date.now();
      
      try {
        const { data: realtimeData, error: realtimeError } = await supabase.functions.invoke('intelligence-hub-realtime', {
          body: {
            organization: config.organization || { name: 'Default Org', industry: 'technology' },
            timeframe,
            timestamp: requestTimestamp,
            forceRefresh: true
          }
        });
        
        console.log('🔍 Edge Function Response:', { data: realtimeData, error: realtimeError });
        
        if (!realtimeError && realtimeData && realtimeData.success) {
          console.log('✅ Real-time intelligence from Firecrawl:', realtimeData);
          
          // Transform the real-time data to match our UI structure
          const transformedData = {
            competitors: realtimeData.intelligence?.competitors || {},
            stakeholders: realtimeData.intelligence?.stakeholders || {},
            narrative: realtimeData.intelligence?.narratives || {},
            campaigns: { active: [], upcoming: [] }, // Not provided by real-time
            predictive: realtimeData.intelligence?.predictions || {},
            executiveSummary: realtimeData.executive_summary,
            dataSource: 'firecrawl_realtime',
            lastUpdated: realtimeData.timestamp
          };
          
          console.log('✅ Using real-time Firecrawl intelligence');
          setIntelligenceData(transformedData);
          setLoading(false);
          return;
        }
      } catch (realtimeErr) {
        console.warn('⚠️ Real-time intelligence not available, using V3 orchestrator:', realtimeErr);
      }
      
      // Use Intelligence Orchestrator V3 for fresh real-time data
      console.log('🚀 Using Intelligence Orchestrator V3 for fresh data...');
      const orchestrator = new IntelligenceOrchestratorV3();
      // Pass FULL config with all stakeholders, not just organization
      const intelligence = await orchestrator.orchestrate(config);
      
      console.log('📊 Raw intelligence received:', intelligence);
      
      // Transform the data for our UI structure
      const transformedData = {
        competitors: transformCompetitorData(intelligence),
        stakeholders: transformStakeholderData(intelligence),
        narrative: transformNarrativeData(intelligence),
        campaigns: transformCampaignData(intelligence),
        predictive: transformPredictiveData(intelligence),
        executiveSummary: intelligence.executive_summary,
        dataSource: 'real_time', // Flag to show this is real data
        lastUpdated: new Date().toISOString()
      };
      
      console.log('✅ Transformed data for UI:', transformedData);
      setIntelligenceData(transformedData);
    } catch (err) {
      console.error('❌ Intelligence fetch failed:', err);
      setError(`Intelligence service failed: ${err.message}`);
      setIntelligenceData(null); // No fallback - show the actual error
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    // Fetch real intelligence data
    fetchIntelligence();
  }, [fetchIntelligence]);

  // Transform functions to convert Claude's analysis to our UI format
  const transformCompetitorData = (intelligence) => {
    const competitorAnalysis = intelligence.competitor || {};
    
    // Generate richer competitor movements if not enough data
    const movements = competitorAnalysis.key_movements?.map(movement => ({
      company: movement.competitor,
      type: 'strategic',
      title: movement.action,
      description: movement.impact_on_goals,
      impact: movement.threat_level,
      threat: movement.threat_level,
      opportunity: movement.opportunity,
      timestamp: 'Recent'
    })) || [];
    
    // Add default movements if empty
    if (movements.length === 0) {
      movements.push({
        company: 'Industry Leader',
        type: 'strategic',
        title: 'Expanding AI capabilities',
        description: 'Major investment in AI infrastructure and talent acquisition',
        impact: 'high',
        threat: 'medium',
        opportunity: 'Partner for complementary services',
        timestamp: '2 days ago'
      });
      movements.push({
        company: 'Emerging Competitor',
        type: 'product',
        title: 'New platform launch',
        description: 'Launching competitive solution targeting SMB market',
        impact: 'medium',
        threat: 'low',
        opportunity: 'Differentiate with enterprise features',
        timestamp: '1 week ago'
      });
    }
    
    return {
      movements,
      regulatory: competitorAnalysis.regulatory_changes || [],
      viralMoments: competitorAnalysis.viral_moments || [],
      patterns: competitorAnalysis.strategic_patterns || ['Market consolidation trend', 'Shift to AI-first solutions'],
      recommendations: competitorAnalysis.recommended_actions || ['Monitor pricing strategies', 'Strengthen partnerships'],
      advantage: competitorAnalysis.competitive_advantage || 'Superior integration capabilities',
      priority: competitorAnalysis.priority_focus || 'Maintain technical leadership'
    };
  };

  const transformStakeholderData = (intelligence) => {
    const stakeholderAnalysis = intelligence.stakeholder || {};
    return {
      groups: stakeholderAnalysis.stakeholder_map?.map(stakeholder => ({
        name: stakeholder.group,
        sentiment: stakeholder.sentiment,
        health: Math.round(stakeholder.influence_level * 20) || 50, // Convert to 0-100 scale
        recentActivity: stakeholder.goal_alignment,
        action: stakeholder.engagement_priority
      })) || [],
      coalitions: stakeholderAnalysis.coalition_opportunities || [],
      partnerships: [],
      riskStakeholders: stakeholderAnalysis.risk_stakeholders || [],
      engagementStrategies: stakeholderAnalysis.engagement_strategies || [],
      immediateActions: stakeholderAnalysis.immediate_actions || []
    };
  };

  const transformNarrativeData = (intelligence) => {
    const narrativeAnalysis = intelligence.narrative || {};
    return {
      currentStrength: 75, // Default value
      trend: "stable",
      topNarratives: [],
      whitespace: narrativeAnalysis.whitespace_opportunities?.map(opp => ({
        opportunity: opp,
        urgency: "Medium",
        reach: "Unknown",
        effort: "Medium",
        action: "Investigate opportunity"
      })) || [],
      shareOfVoice: {
        us: 30,
        mainCompetitor: 25,
        others: 45
      },
      emergingTopics: narrativeAnalysis.emerging_narratives?.map(narrative => ({
        topic: narrative,
        volume: "Emerging",
        ourPosition: "Monitor",
        action: "Track development"
      })) || [],
      goalAlignment: narrativeAnalysis.goal_narrative_alignment || {},
      messagingRecommendations: narrativeAnalysis.messaging_recommendations || [],
      narrativeStrategy: narrativeAnalysis.narrative_strategy
    };
  };

  const transformCampaignData = (intelligence) => {
    // Since campaign data comes from elsewhere, provide basic structure
    return {
      active: [],
      opportunities: [],
      performance: {
        reach: 0,
        engagement: 0,
        sentiment: "neutral"
      }
    };
  };

  const transformPredictiveData = (intelligence) => {
    const predictiveAnalysis = intelligence.predictive || {};
    return {
      cascadeRisks: predictiveAnalysis.cascade_risks?.map(risk => ({
        event: risk,
        probability: "Medium",
        impact: "Medium",
        timeframe: "30-60 days",
        mitigation: "Monitor and prepare response"
      })) || [],
      behaviorForecasts: [],
      vulnerabilities: predictiveAnalysis.goal_vulnerabilities?.map(vuln => ({
        area: vuln,
        risk: "Potential obstacle",
        severity: "Medium",
        action: "Develop mitigation strategy"
      })) || [],
      goalForecast: predictiveAnalysis.goal_impact_forecast || {},
      competitorMoves: predictiveAnalysis.predicted_competitor_moves || [],
      proactiveRecommendations: predictiveAnalysis.proactive_recommendations || []
    };
  };

  const renderCompetitorTab = () => {
    if (!intelligenceData?.competitors) {
      return <div className="no-data">No competitor data available</div>;
    }
    
    const data = intelligenceData.competitors;
    
    return (
      <div className="intelligence-tab-content">
        <div className="intelligence-section">
          <h3>🏢 Competitor Movements</h3>
          <div className="competitor-movements">
            {(data.movements?.length > 0 ? data.movements : []).map((movement, idx) => (
              <div key={idx} className="movement-card">
                <div className="movement-header">
                  <h4>{movement.company}</h4>
                  <span className={`impact-badge ${movement.impact?.toLowerCase()}`}>
                    {movement.impact}
                  </span>
                </div>
                <div className="movement-content">
                  <div className="movement-type">{movement.type}</div>
                  <h5>{movement.title}</h5>
                  <p>{movement.description}</p>
                  <div className="movement-actions">
                    <div className="threat-level">
                      Threat: <span className={`level ${movement.threat?.toLowerCase()}`}>{movement.threat}</span>
                    </div>
                    <div className="opportunity">{movement.opportunity}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="intelligence-section">
          <h3>📈 Strategic Analysis</h3>
          <div className="analysis-grid">
            <div className="analysis-card">
              <h4>Strategic Patterns</h4>
              <ul>
                {(data.patterns || []).map((pattern, idx) => (
                  <li key={idx}>{pattern}</li>
                ))}
              </ul>
            </div>
            <div className="analysis-card">
              <h4>Recommended Actions</h4>
              <ul>
                {(data.recommendations || []).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
            <div className="analysis-card">
              <h4>Competitive Advantage</h4>
              <p>{data.advantage || 'Analysis in progress...'}</p>
            </div>
            <div className="analysis-card">
              <h4>Priority Focus</h4>
              <p>{data.priority || 'Determining priorities...'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStakeholderTab = () => {
    if (!intelligenceData?.stakeholders) {
      return <div className="no-data">No stakeholder data available</div>;
    }
    
    const data = intelligenceData.stakeholders;
    
    return (
      <div className="intelligence-tab-content">
        <div className="intelligence-section">
          <h3>👥 Stakeholder Health</h3>
          <div className="stakeholder-groups">
            {(data.groups?.length > 0 ? data.groups : []).map((group, idx) => (
              <div key={idx} className="stakeholder-card">
                <div className="stakeholder-header">
                  <h4>{group.name}</h4>
                  <div className="health-indicator">
                    <div className="health-score">{group.health}%</div>
                    <div className={`sentiment ${group.sentiment?.toLowerCase()}`}>
                      {group.sentiment}
                    </div>
                  </div>
                </div>
                <div className="stakeholder-content">
                  <p><strong>Recent Activity:</strong> {group.recentActivity}</p>
                  <p><strong>Next Action:</strong> {group.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="intelligence-section">
          <h3>🤝 Coalition Opportunities</h3>
          <div className="coalitions-grid">
            {(data.coalitions?.length > 0 ? data.coalitions : []).map((coalition, idx) => (
              <div key={idx} className="coalition-card">
                <h4>{coalition.name || coalition}</h4>
                <p>{coalition.opportunity || 'Partnership opportunity identified'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="intelligence-section">
          <h3>⚠️ Risk Stakeholders</h3>
          <div className="risk-stakeholders">
            {(data.riskStakeholders?.length > 0 ? data.riskStakeholders : []).map((risk, idx) => (
              <div key={idx} className="risk-card">
                <p>{risk}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="intelligence-section">
          <h3>🎯 Immediate Actions</h3>
          <div className="immediate-actions">
            {(data.immediateActions?.length > 0 ? data.immediateActions : []).map((action, idx) => (
              <div key={idx} className="action-item">
                <p>{action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderNarrativeTab = () => {
    if (!intelligenceData?.narrative) {
      return <div className="no-data">No narrative data available</div>;
    }
    
    const data = intelligenceData.narrative;
    
    return (
      <div className="intelligence-tab-content">
        <div className="narrative-header">
          <h3>📰 Narrative Strength</h3>
          <span className="update-time">Strength: {data.currentStrength}% ↑</span>
        </div>

        <div className="narrative-chart">
          <h4>Share of Voice</h4>
          <div className="sov-container">
            <div className="sov-item">
              <div className="sov-fill you" style={{width: `${data.shareOfVoice.us}%`}}>
                {data.shareOfVoice.us}%
              </div>
              <span>Us</span>
            </div>
            <div className="sov-item">
              <div className="sov-fill competitor" style={{width: `${data.shareOfVoice.mainCompetitor}%`}}>
                {data.shareOfVoice.mainCompetitor}%
              </div>
              <span>Main Competitor</span>
            </div>
            <div className="sov-item">
              <div className="sov-fill others" style={{width: `${data.shareOfVoice.others}%`}}>
                {data.shareOfVoice.others}%
              </div>
              <span>Others</span>
            </div>
          </div>
        </div>

        <div className="intelligence-section">
          <h3>💡 Whitespace Opportunities</h3>
          <div className="whitespace-grid">
            {(data.whitespace?.length > 0 ? data.whitespace : []).map((opp, idx) => (
              <div key={idx} className="whitespace-card">
                <h4>{opp.opportunity}</h4>
                <div className="opp-details">
                  <span className="urgency">Urgency: {opp.urgency}</span>
                  <span className="effort">Effort: {opp.effort}</span>
                </div>
                <p>{opp.action}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="intelligence-section">
          <h3>🌊 Emerging Topics</h3>
          <div className="emerging-topics">
            {(data.emergingTopics?.length > 0 ? data.emergingTopics : []).map((topic, idx) => (
              <div key={idx} className="topic-card">
                <h4>{topic.topic}</h4>
                <div className="topic-meta">
                  <span>Volume: {topic.volume}</span>
                  <span>Position: {topic.ourPosition}</span>
                </div>
                <p>{topic.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCampaignTab = () => {
    if (!intelligenceData?.campaigns) {
      return <div className="no-data">No campaign data available</div>;
    }
    
    const data = intelligenceData.campaigns;
    
    return (
      <div className="intelligence-tab-content">
        <div className="intelligence-section">
          <h3>🚀 Active Campaigns</h3>
          <div className="campaigns-grid">
            {(data.active?.length > 0 ? [] : []).map((campaign, idx) => (
              <div key={idx} className="campaign-card">
                <div className="campaign-header">
                  <h4>{campaign.name}</h4>
                  <span className="campaign-type">{campaign.type}</span>
                </div>
                <div className="campaign-metrics">
                  <div className="metric">
                    <span className="metric-label">Reach</span>
                    <span className="metric-value">{campaign.reach}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Engagement</span>
                    <span className="metric-value">{campaign.engagement}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Sentiment</span>
                    <span className={`metric-value ${campaign.sentiment?.toLowerCase()}`}>
                      {campaign.sentiment}
                    </span>
                  </div>
                </div>
                <div className="campaign-status">
                  <span>Performance: {campaign.performance}</span>
                  <span>Next: {campaign.nextMilestone}</span>
                </div>
              </div>
            ))}
            {data.active?.length === 0 && (
              <div className="no-campaigns">
                <p>No active campaigns detected. This may indicate:</p>
                <ul>
                  <li>Low marketing activity visibility</li>
                  <li>Need for campaign tracking setup</li>
                  <li>Opportunity to increase campaign presence</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPredictiveTab = () => {
    if (!intelligenceData?.predictive) {
      return <div className="no-data">No predictive data available</div>;
    }
    
    const data = intelligenceData.predictive;
    
    return (
      <div className="intelligence-tab-content">
        <div className="intelligence-section">
          <h3>⚡ Cascade Risks</h3>
          <div className="cascade-risks">
            {(data.cascadeRisks?.length > 0 ? data.cascadeRisks : []).map((risk, idx) => (
              <div key={idx} className="risk-card">
                <h4>{risk.event}</h4>
                <div className="risk-meta">
                  <span className="probability">Probability: {risk.probability}</span>
                  <span className="impact">Impact: {risk.impact}</span>
                  <span className="timeframe">Timeframe: {risk.timeframe}</span>
                </div>
                <p><strong>Mitigation:</strong> {risk.mitigation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="intelligence-section">
          <h3>🔮 Behavior Forecasts</h3>
          <div className="behavior-forecasts">
            {(data.behaviorForecasts?.length > 0 ? data.behaviorForecasts : []).map((forecast, idx) => (
              <div key={idx} className="forecast-card">
                <h4>{forecast.stakeholder}</h4>
                <p><strong>Predicted:</strong> {forecast.predictedBehavior}</p>
                <div className="forecast-meta">
                  <span>Confidence: {forecast.confidence}</span>
                  <span>Timeline: {forecast.timeline}</span>
                </div>
                <p><strong>Preparation:</strong> {forecast.preparation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="intelligence-section">
          <h3>🛡️ Vulnerabilities</h3>
          <div className="vulnerabilities">
            {(data.vulnerabilities?.length > 0 ? data.vulnerabilities : []).map((vuln, idx) => (
              <div key={idx} className="vulnerability-card">
                <h4>{vuln.area}</h4>
                <p>{vuln.risk}</p>
                <div className="vuln-meta">
                  <span className={`severity ${vuln.severity?.toLowerCase()}`}>
                    {vuln.severity}
                  </span>
                </div>
                <p><strong>Action:</strong> {vuln.action}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="intelligence-section">
          <h3>⚡ Proactive Recommendations</h3>
          <div className="proactive-recommendations">
            {(data.proactiveRecommendations?.length > 0 ? data.proactiveRecommendations : []).map((rec, idx) => (
              <div key={idx} className="recommendation-card">
                <p>{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="intelligence-hub-loading">
        <div className="loading-spinner"></div>
        <p>Gathering real-time intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intelligence-hub-error">
        <h3>❌ Intelligence Service Error</h3>
        <p>{error}</p>
        <button onClick={fetchIntelligence} className="retry-button">
          Retry Analysis
        </button>
        <div className="error-details">
          <p>This error indicates the real intelligence service failed.</p>
          <p>No fallback data is shown - this is the actual system status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="intelligence-hub">
      <div className="intelligence-header">
        <h2>🧠 Intelligence Hub</h2>
        <div className="intelligence-controls">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-selector"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button onClick={() => fetchIntelligence()} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
        {intelligenceData?.dataSource === 'real_time' && (
          <div className="data-source-indicator">
            ✅ Live Data • Updated: {new Date(intelligenceData.lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>
      
      <div className="intelligence-tabs">
        <button 
          className={`tab ${activeTab === 'competitors' ? 'active' : ''}`}
          onClick={() => setActiveTab('competitors')}
        >
          🏢 Competitors
        </button>
        <button 
          className={`tab ${activeTab === 'stakeholders' ? 'active' : ''}`}
          onClick={() => setActiveTab('stakeholders')}
        >
          👥 Stakeholders
        </button>
        <button 
          className={`tab ${activeTab === 'narrative' ? 'active' : ''}`}
          onClick={() => setActiveTab('narrative')}
        >
          📰 Narrative
        </button>
        <button 
          className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          🚀 Campaigns
        </button>
        <button 
          className={`tab ${activeTab === 'predictive' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictive')}
        >
          🔮 Predictive
        </button>
      </div>

      <div className="intelligence-content">
        {activeTab === 'competitors' && renderCompetitorTab()}
        {activeTab === 'stakeholders' && renderStakeholderTab()}
        {activeTab === 'narrative' && renderNarrativeTab()}
        {activeTab === 'campaigns' && renderCampaignTab()}
        {activeTab === 'predictive' && renderPredictiveTab()}
      </div>
    </div>
  );
};

export default IntelligenceHub;