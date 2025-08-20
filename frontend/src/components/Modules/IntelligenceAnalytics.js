import React, { useState, useEffect } from 'react';
import './IntelligenceCommand.css';
import intelligenceGatheringService from '../../services/intelligenceGatheringService';

const IntelligenceAnalytics = () => {
  const [activeView, setActiveView] = useState('competitors');
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  const [organizationData, setOrganizationData] = useState(null);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  useEffect(() => {
    loadOrganization();
    performIntelligenceAnalysis();
  }, [timeframe]);

  const loadOrganization = () => {
    const org = localStorage.getItem('signaldesk_organization');
    if (org) {
      setOrganizationData(JSON.parse(org));
    }
  };

  const performIntelligenceAnalysis = async () => {
    setLoading(true);
    try {
      const config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
      
      // Gather intelligence with 24-hour lookback
      const intelligence = await intelligenceGatheringService.gatherIntelligence({
        ...config,
        timeframe: timeframe,
        lookback: timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720
      });
      
      // Process into analytical insights
      const analysis = await analyzeIntelligence(intelligence, config);
      setIntelligenceData(analysis);
      setLastAnalysis(new Date());
    } finally {
      setLoading(false);
    }
  };

  const analyzeIntelligence = async (raw, config) => {
    return {
      competitors: analyzeCompetitorMovements(raw),
      stakeholders: analyzeStakeholderActivity(raw, config),
      narrative: analyzeNarrativeMarket(raw),
      campaigns: analyzeCampaignPerformance(raw),
      predictive: generatePredictiveInsights(raw)
    };
  };

  const analyzeCompetitorMovements = (raw) => {
    const movements = [];
    const executiveMoves = [];
    const productLaunches = [];
    const campaigns = [];
    const regulatory = [];

    // Extract competitor intelligence
    if (raw.competitiveIntel) {
      raw.competitiveIntel.forEach(intel => {
        if (intel.data?.executiveChanges?.length > 0) {
          executiveMoves.push({
            company: intel.title,
            change: intel.data.executiveChanges[0],
            impact: 'High',
            recommendation: 'Monitor for strategic shifts'
          });
        }
        
        if (intel.data?.moveType === 'product_launch') {
          productLaunches.push({
            company: intel.title,
            product: intel.insight,
            timing: 'Recent',
            threat: 'Medium'
          });
        }

        if (intel.insight?.toLowerCase().includes('campaign')) {
          campaigns.push({
            company: intel.title,
            campaign: intel.insight,
            strategy: 'Analyze messaging approach'
          });
        }
      });
    }

    // Add regulatory changes
    if (raw.realTimeAlerts) {
      raw.realTimeAlerts.forEach(alert => {
        if (alert.insight?.toLowerCase().includes('regulat') || 
            alert.insight?.toLowerCase().includes('compliance')) {
          regulatory.push({
            change: alert.title,
            impact: alert.insight,
            deadline: 'Review required'
          });
        }
      });
    }

    return {
      executiveMoves,
      productLaunches,
      campaigns,
      regulatory,
      summary: {
        totalMovements: executiveMoves.length + productLaunches.length,
        criticalActions: executiveMoves.length,
        marketShifts: campaigns.length
      }
    };
  };

  const analyzeStakeholderActivity = (raw, config) => {
    const stakeholders = {};
    const coalitions = [];
    const opportunities = [];
    
    // Analyze each stakeholder group
    if (raw.stakeholderInsights) {
      raw.stakeholderInsights.forEach(insight => {
        const group = insight.stakeholder || 'general';
        
        if (!stakeholders[group]) {
          stakeholders[group] = {
            name: group,
            sentiment: 'neutral',
            activity: [],
            health: 85,
            engagement: []
          };
        }

        // Calculate sentiment
        const text = (insight.insight || '').toLowerCase();
        if (text.includes('positive') || text.includes('support')) {
          stakeholders[group].sentiment = 'positive';
        } else if (text.includes('negative') || text.includes('concern')) {
          stakeholders[group].sentiment = 'negative';
        }

        stakeholders[group].activity.push({
          type: insight.type,
          detail: insight.insight,
          relevance: insight.relevance
        });
      });
    }

    // Identify coalition formations
    Object.entries(stakeholders).forEach(([key1, s1]) => {
      Object.entries(stakeholders).forEach(([key2, s2]) => {
        if (key1 !== key2 && s1.sentiment === s2.sentiment) {
          coalitions.push({
            groups: [key1, key2],
            alignment: s1.sentiment,
            potential: 'Partnership opportunity'
          });
        }
      });
    });

    // Find partnership opportunities
    if (raw.opportunityInsights) {
      raw.opportunityInsights.forEach(opp => {
        if (opp.type === 'partnership' || opp.insight?.includes('partner')) {
          opportunities.push({
            partner: opp.title,
            opportunity: opp.insight,
            action: opp.suggestedAction
          });
        }
      });
    }

    return {
      groups: Object.values(stakeholders),
      coalitions: coalitions.slice(0, 3),
      opportunities,
      healthScore: 78,
      summary: {
        activeGroups: Object.keys(stakeholders).length,
        positiveGroups: Object.values(stakeholders).filter(s => s.sentiment === 'positive').length,
        opportunities: opportunities.length
      }
    };
  };

  const analyzeNarrativeMarket = (raw) => {
    const narratives = [];
    const trends = [];
    const whitespace = [];
    let shareOfVoice = 0;
    
    // Extract trending narratives
    if (raw.industryTrends) {
      raw.industryTrends.forEach(trend => {
        trends.push({
          topic: trend.title,
          momentum: trend.growth || 'Rising',
          volume: trend.mentions || 0,
          sentiment: 'neutral'
        });
      });
    }

    // Calculate share of voice
    const totalMentions = raw.competitiveIntel?.reduce((sum, c) => 
      sum + (c.data?.mentions || 0), 0) || 0;
    const ourMentions = raw.stakeholderInsights?.filter(i => 
      i.insight?.includes(organizationData?.name)).length || 0;
    
    if (totalMentions > 0) {
      shareOfVoice = Math.round((ourMentions / totalMentions) * 100);
    }

    // Identify whitespace opportunities
    const coveredTopics = new Set();
    raw.competitiveIntel?.forEach(intel => {
      const topics = intel.insight?.toLowerCase().match(/\b\w+\b/g) || [];
      topics.forEach(t => coveredTopics.add(t));
    });

    const potentialTopics = ['innovation', 'sustainability', 'diversity', 'community', 
                             'partnership', 'growth', 'efficiency', 'customer success'];
    
    potentialTopics.forEach(topic => {
      if (!coveredTopics.has(topic)) {
        whitespace.push({
          angle: topic,
          opportunity: `Uncovered angle in ${topic}`,
          priority: 'Medium'
        });
      }
    });

    // Find emerging topics
    const emerging = trends.filter(t => t.momentum === 'Rising').map(t => ({
      topic: t.topic,
      timing: 'Early stage',
      advantage: 'First-mover opportunity'
    }));

    return {
      currentNarratives: narratives,
      trends: trends.slice(0, 5),
      whitespace: whitespace.slice(0, 4),
      emerging,
      shareOfVoice,
      sentiment: 'positive',
      summary: {
        narrativeStrength: shareOfVoice > 30 ? 'Strong' : 'Building',
        opportunities: whitespace.length,
        trendingTopics: trends.length
      }
    };
  };

  const analyzeCampaignPerformance = (raw) => {
    // Since we don't have active campaigns yet, we'll analyze potential campaigns
    const potentialCampaigns = [];
    const contentMetrics = {
      reach: 0,
      engagement: 0,
      quality: 0
    };
    const mediaValue = 0;

    // Analyze content opportunities based on intelligence
    if (raw.opportunityInsights) {
      raw.opportunityInsights.forEach(opp => {
        potentialCampaigns.push({
          theme: opp.title,
          angle: opp.insight,
          timing: 'Opportunity window open',
          priority: opp.relevance === 'high' ? 'Launch immediately' : 'Plan for Q2'
        });
      });
    }

    // Calculate potential media value
    const mediaCoverage = raw.stakeholderInsights?.filter(i => 
      i.stakeholder === 'media' || i.stakeholder === 'tech_journalists') || [];
    
    const coverageQuality = mediaCoverage.length > 0 ? 75 : 0;

    return {
      activeCampaigns: [],
      potentialCampaigns: potentialCampaigns.slice(0, 3),
      contentMetrics,
      mediaCoverage: {
        articles: mediaCoverage.length,
        quality: coverageQuality,
        reach: 'Calculating...'
      },
      mediaValue,
      roi: 'N/A',
      summary: {
        opportunities: potentialCampaigns.length,
        readiness: 'Ready to launch'
      }
    };
  };

  const generatePredictiveInsights = (raw) => {
    const predictions = [];
    const cascadeEffects = [];
    const vulnerabilities = [];

    // Predict competitor moves
    if (raw.competitiveIntel?.length > 0) {
      predictions.push({
        type: 'Competitor Action',
        prediction: 'Increased competitive activity expected in next 30 days',
        probability: 75,
        impact: 'Medium',
        recommendation: 'Prepare differentiation messaging'
      });
    }

    // Predict stakeholder behavior
    const positiveStakeholders = raw.stakeholderInsights?.filter(i => 
      i.insight?.includes('positive') || i.insight?.includes('support')).length || 0;
    
    if (positiveStakeholders > 3) {
      predictions.push({
        type: 'Stakeholder Support',
        prediction: 'Coalition building opportunity identified',
        probability: 80,
        impact: 'High',
        recommendation: 'Initiate partnership discussions'
      });
    }

    // Identify cascade effects
    raw.realTimeAlerts?.forEach(alert => {
      if (alert.relevance === 'high') {
        cascadeEffects.push({
          trigger: alert.title,
          effect: 'May influence industry narrative',
          timeline: '3-5 days',
          action: 'Prepare response strategy'
        });
      }
    });

    // Assess vulnerabilities
    if (shareOfVoice < 20) {
      vulnerabilities.push({
        area: 'Market Visibility',
        risk: 'Low share of voice',
        mitigation: 'Increase content frequency'
      });
    }

    // Regulatory forecasting
    const regulatoryRisk = raw.realTimeAlerts?.some(a => 
      a.insight?.includes('regulat') || a.insight?.includes('compliance')) ? 'Medium' : 'Low';

    return {
      predictions: predictions.slice(0, 3),
      cascadeEffects: cascadeEffects.slice(0, 2),
      vulnerabilities,
      behaviorForecast: {
        stakeholders: 'Stable',
        market: 'Growing interest',
        competitors: 'Active'
      },
      regulatoryForecast: {
        risk: regulatoryRisk,
        horizon: '6 months',
        preparation: regulatoryRisk === 'Medium' ? 'Review compliance' : 'Monitor'
      },
      summary: {
        riskScore: vulnerabilities.length * 20,
        opportunityScore: predictions.filter(p => p.impact === 'High').length * 30
      }
    };
  };

  const renderCompetitorIntelligence = () => (
    <div className="intelligence-view competitor-view">
      <div className="view-header">
        <h2>Competitor & Market Intelligence</h2>
        <p>Executive movements, product launches, campaigns, and regulatory changes</p>
      </div>
      
      {intelligenceData?.competitors && (
        <>
          {/* Executive Movements */}
          {intelligenceData.competitors.executiveMoves.length > 0 && (
            <div className="intel-section">
              <h3>👔 Executive Movements</h3>
              <div className="intel-cards">
                {intelligenceData.competitors.executiveMoves.map((move, i) => (
                  <div key={i} className="intel-card">
                    <div className="card-company">{move.company}</div>
                    <div className="card-detail">{move.change.title}</div>
                    <div className="card-impact">Impact: {move.impact}</div>
                    <div className="card-action">→ {move.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Launches */}
          {intelligenceData.competitors.productLaunches.length > 0 && (
            <div className="intel-section">
              <h3>🚀 New Products & Services</h3>
              <div className="intel-cards">
                {intelligenceData.competitors.productLaunches.map((launch, i) => (
                  <div key={i} className="intel-card">
                    <div className="card-company">{launch.company}</div>
                    <div className="card-detail">{launch.product}</div>
                    <div className="card-timing">Timing: {launch.timing}</div>
                    <div className="card-threat">Threat Level: {launch.threat}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaigns */}
          {intelligenceData.competitors.campaigns.length > 0 && (
            <div className="intel-section">
              <h3>📢 Active Campaigns</h3>
              <div className="intel-cards">
                {intelligenceData.competitors.campaigns.map((campaign, i) => (
                  <div key={i} className="intel-card">
                    <div className="card-company">{campaign.company}</div>
                    <div className="card-detail">{campaign.campaign}</div>
                    <div className="card-action">→ {campaign.strategy}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regulatory Changes */}
          {intelligenceData.competitors.regulatory.length > 0 && (
            <div className="intel-section">
              <h3>⚖️ Regulatory Updates</h3>
              <div className="intel-cards">
                {intelligenceData.competitors.regulatory.map((reg, i) => (
                  <div key={i} className="intel-card regulatory">
                    <div className="card-title">{reg.change}</div>
                    <div className="card-detail">{reg.impact}</div>
                    <div className="card-deadline">Action: {reg.deadline}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="intel-summary">
            <div className="summary-stat">
              <span className="stat-value">{intelligenceData.competitors.summary.totalMovements}</span>
              <span className="stat-label">Total Movements</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{intelligenceData.competitors.summary.criticalActions}</span>
              <span className="stat-label">Critical Actions</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{intelligenceData.competitors.summary.marketShifts}</span>
              <span className="stat-label">Market Shifts</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStakeholderIntelligence = () => (
    <div className="intelligence-view stakeholder-view">
      <div className="view-header">
        <h2>Stakeholder Intelligence</h2>
        <p>Activity, sentiment, coalitions, and partnership opportunities</p>
      </div>

      {intelligenceData?.stakeholders && (
        <>
          {/* Stakeholder Groups */}
          <div className="intel-section">
            <h3>👥 Stakeholder Activity</h3>
            <div className="stakeholder-grid">
              {intelligenceData.stakeholders.groups.map((group, i) => (
                <div key={i} className={`stakeholder-card ${group.sentiment}`}>
                  <div className="stakeholder-header">
                    <span className="stakeholder-name">{group.name}</span>
                    <span className={`sentiment-badge ${group.sentiment}`}>
                      {group.sentiment}
                    </span>
                  </div>
                  <div className="stakeholder-health">
                    Health Score: {group.health}%
                  </div>
                  <div className="stakeholder-activities">
                    {group.activity.slice(0, 2).map((act, j) => (
                      <div key={j} className="activity-item">
                        • {act.detail}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coalition Formations */}
          {intelligenceData.stakeholders.coalitions.length > 0 && (
            <div className="intel-section">
              <h3>🤝 Coalition Formations</h3>
              <div className="coalition-list">
                {intelligenceData.stakeholders.coalitions.map((coalition, i) => (
                  <div key={i} className="coalition-item">
                    <div className="coalition-groups">
                      {coalition.groups.join(' + ')}
                    </div>
                    <div className="coalition-alignment">
                      Alignment: {coalition.alignment}
                    </div>
                    <div className="coalition-potential">{coalition.potential}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partnership Opportunities */}
          {intelligenceData.stakeholders.opportunities.length > 0 && (
            <div className="intel-section">
              <h3>💡 Partnership Opportunities</h3>
              <div className="opportunity-cards">
                {intelligenceData.stakeholders.opportunities.map((opp, i) => (
                  <div key={i} className="opportunity-card">
                    <div className="opp-partner">{opp.partner}</div>
                    <div className="opp-detail">{opp.opportunity}</div>
                    <div className="opp-action">→ {opp.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="intel-summary">
            <div className="summary-stat">
              <span className="stat-value">{intelligenceData.stakeholders.summary.activeGroups}</span>
              <span className="stat-label">Active Groups</span>
            </div>
            <div className="summary-stat positive">
              <span className="stat-value">{intelligenceData.stakeholders.summary.positiveGroups}</span>
              <span className="stat-label">Positive Sentiment</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{intelligenceData.stakeholders.summary.opportunities}</span>
              <span className="stat-label">Opportunities</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderNarrativeAnalysis = () => (
    <div className="intelligence-view narrative-view">
      <div className="view-header">
        <h2>Narrative & Market Analysis</h2>
        <p>Share of voice, trending topics, whitespace opportunities</p>
      </div>

      {intelligenceData?.narrative && (
        <>
          {/* Share of Voice */}
          <div className="intel-section">
            <h3>📊 Market Position</h3>
            <div className="share-of-voice">
              <div className="sov-chart">
                <div className="sov-bar" style={{width: `${intelligenceData.narrative.shareOfVoice}%`}}>
                  {intelligenceData.narrative.shareOfVoice}%
                </div>
              </div>
              <div className="sov-label">Share of Voice</div>
              <div className="narrative-strength">
                Narrative Strength: {intelligenceData.narrative.summary.narrativeStrength}
              </div>
            </div>
          </div>

          {/* Trending Topics */}
          {intelligenceData.narrative.trends.length > 0 && (
            <div className="intel-section">
              <h3>📈 Trending Topics</h3>
              <div className="trend-list">
                {intelligenceData.narrative.trends.map((trend, i) => (
                  <div key={i} className="trend-item">
                    <div className="trend-topic">{trend.topic}</div>
                    <div className="trend-momentum">{trend.momentum}</div>
                    <div className="trend-volume">Volume: {trend.volume}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Whitespace Opportunities */}
          {intelligenceData.narrative.whitespace.length > 0 && (
            <div className="intel-section">
              <h3>🎯 Whitespace Opportunities</h3>
              <div className="whitespace-grid">
                {intelligenceData.narrative.whitespace.map((space, i) => (
                  <div key={i} className="whitespace-card">
                    <div className="whitespace-angle">{space.angle}</div>
                    <div className="whitespace-opp">{space.opportunity}</div>
                    <div className="whitespace-priority">Priority: {space.priority}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emerging Topics */}
          {intelligenceData.narrative.emerging.length > 0 && (
            <div className="intel-section">
              <h3>🌱 Emerging Before Mainstream</h3>
              <div className="emerging-list">
                {intelligenceData.narrative.emerging.map((topic, i) => (
                  <div key={i} className="emerging-item">
                    <div className="emerging-topic">{topic.topic}</div>
                    <div className="emerging-timing">{topic.timing}</div>
                    <div className="emerging-advantage">{topic.advantage}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCampaignPerformance = () => (
    <div className="intelligence-view campaign-view">
      <div className="view-header">
        <h2>Campaign & Content Intelligence</h2>
        <p>Performance metrics, media coverage, and ROI analysis</p>
      </div>

      {intelligenceData?.campaigns && (
        <>
          {/* Potential Campaigns */}
          <div className="intel-section">
            <h3>💡 Campaign Opportunities</h3>
            <div className="campaign-cards">
              {intelligenceData.campaigns.potentialCampaigns.map((campaign, i) => (
                <div key={i} className="campaign-card">
                  <div className="campaign-theme">{campaign.theme}</div>
                  <div className="campaign-angle">{campaign.angle}</div>
                  <div className="campaign-timing">{campaign.timing}</div>
                  <div className="campaign-priority">{campaign.priority}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Coverage */}
          <div className="intel-section">
            <h3>📰 Media Coverage Analysis</h3>
            <div className="media-stats">
              <div className="media-stat">
                <span className="stat-value">{intelligenceData.campaigns.mediaCoverage.articles}</span>
                <span className="stat-label">Articles</span>
              </div>
              <div className="media-stat">
                <span className="stat-value">{intelligenceData.campaigns.mediaCoverage.quality}%</span>
                <span className="stat-label">Quality Score</span>
              </div>
              <div className="media-stat">
                <span className="stat-value">{intelligenceData.campaigns.mediaCoverage.reach}</span>
                <span className="stat-label">Reach</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="intel-summary">
            <div className="summary-message">
              {intelligenceData.campaigns.summary.opportunities} campaign opportunities identified. 
              System {intelligenceData.campaigns.summary.readiness}.
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPredictiveIntelligence = () => (
    <div className="intelligence-view predictive-view">
      <div className="view-header">
        <h2>Predictive Intelligence</h2>
        <p>Forecasts, cascade effects, and vulnerability assessment</p>
      </div>

      {intelligenceData?.predictive && (
        <>
          {/* Predictions */}
          <div className="intel-section">
            <h3>🔮 Predictions</h3>
            <div className="prediction-cards">
              {intelligenceData.predictive.predictions.map((pred, i) => (
                <div key={i} className="prediction-card">
                  <div className="pred-header">
                    <span className="pred-type">{pred.type}</span>
                    <span className="pred-prob">{pred.probability}% likely</span>
                  </div>
                  <div className="pred-text">{pred.prediction}</div>
                  <div className="pred-impact">Impact: {pred.impact}</div>
                  <div className="pred-action">→ {pred.recommendation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cascade Effects */}
          {intelligenceData.predictive.cascadeEffects.length > 0 && (
            <div className="intel-section">
              <h3>🌊 Cascade Effects</h3>
              <div className="cascade-list">
                {intelligenceData.predictive.cascadeEffects.map((cascade, i) => (
                  <div key={i} className="cascade-item">
                    <div className="cascade-trigger">Trigger: {cascade.trigger}</div>
                    <div className="cascade-effect">→ {cascade.effect}</div>
                    <div className="cascade-timeline">Timeline: {cascade.timeline}</div>
                    <div className="cascade-action">Action: {cascade.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerabilities */}
          {intelligenceData.predictive.vulnerabilities.length > 0 && (
            <div className="intel-section">
              <h3>⚠️ Vulnerability Assessment</h3>
              <div className="vulnerability-list">
                {intelligenceData.predictive.vulnerabilities.map((vuln, i) => (
                  <div key={i} className="vulnerability-item">
                    <div className="vuln-area">{vuln.area}</div>
                    <div className="vuln-risk">{vuln.risk}</div>
                    <div className="vuln-mitigation">→ {vuln.mitigation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forecasts */}
          <div className="intel-section">
            <h3>📊 Behavior & Regulatory Forecast</h3>
            <div className="forecast-grid">
              <div className="forecast-card">
                <h4>Stakeholder Behavior</h4>
                <div>{intelligenceData.predictive.behaviorForecast.stakeholders}</div>
              </div>
              <div className="forecast-card">
                <h4>Market Trajectory</h4>
                <div>{intelligenceData.predictive.behaviorForecast.market}</div>
              </div>
              <div className="forecast-card">
                <h4>Competitor Activity</h4>
                <div>{intelligenceData.predictive.behaviorForecast.competitors}</div>
              </div>
              <div className="forecast-card regulatory">
                <h4>Regulatory Risk</h4>
                <div>Risk: {intelligenceData.predictive.regulatoryForecast.risk}</div>
                <div>Horizon: {intelligenceData.predictive.regulatoryForecast.horizon}</div>
                <div>{intelligenceData.predictive.regulatoryForecast.preparation}</div>
              </div>
            </div>
          </div>

          {/* Risk & Opportunity Scores */}
          <div className="intel-summary">
            <div className="summary-stat">
              <span className="stat-value">{intelligenceData.predictive.summary.riskScore}%</span>
              <span className="stat-label">Risk Score</span>
            </div>
            <div className="summary-stat positive">
              <span className="stat-value">{intelligenceData.predictive.summary.opportunityScore}%</span>
              <span className="stat-label">Opportunity Score</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="intelligence-analytics">
      <div className="analytics-header">
        <div className="header-left">
          <h1>Intelligence Analytics</h1>
          <p>Strategic intelligence and market analysis for {organizationData?.name || 'your organization'}</p>
        </div>
        <div className="header-right">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-selector"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button 
            onClick={performIntelligenceAnalysis} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>

      <div className="analytics-nav">
        <button 
          className={`nav-button ${activeView === 'competitors' ? 'active' : ''}`}
          onClick={() => setActiveView('competitors')}
        >
          🎯 Competitors & Market
        </button>
        <button 
          className={`nav-button ${activeView === 'stakeholders' ? 'active' : ''}`}
          onClick={() => setActiveView('stakeholders')}
        >
          👥 Stakeholders
        </button>
        <button 
          className={`nav-button ${activeView === 'narrative' ? 'active' : ''}`}
          onClick={() => setActiveView('narrative')}
        >
          📈 Narrative Analysis
        </button>
        <button 
          className={`nav-button ${activeView === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveView('campaigns')}
        >
          📢 Campaigns
        </button>
        <button 
          className={`nav-button ${activeView === 'predictive' ? 'active' : ''}`}
          onClick={() => setActiveView('predictive')}
        >
          🔮 Predictive
        </button>
      </div>

      <div className="analytics-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Analyzing intelligence data from the last {timeframe}...</p>
          </div>
        ) : (
          <>
            {activeView === 'competitors' && renderCompetitorIntelligence()}
            {activeView === 'stakeholders' && renderStakeholderIntelligence()}
            {activeView === 'narrative' && renderNarrativeAnalysis()}
            {activeView === 'campaigns' && renderCampaignPerformance()}
            {activeView === 'predictive' && renderPredictiveIntelligence()}
          </>
        )}
      </div>

      {lastAnalysis && (
        <div className="analytics-footer">
          Last analysis: {lastAnalysis.toLocaleTimeString()} | 
          Data sources: {organizationData?.industry || 'Multiple'} industry feeds
        </div>
      )}
    </div>
  );
};

export default IntelligenceAnalytics;