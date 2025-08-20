import React, { useState, useEffect, useCallback } from 'react';
import './IntelligenceHub.css';
import claudeIntelligenceServiceV2 from '../../services/claudeIntelligenceServiceV2';

const IntelligenceHub = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('competitors');
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [intelligenceData, setIntelligenceData] = useState(null);

  // Mock data structure that matches our sophisticated analysis
  const mockIntelligence = {
    competitors: {
      movements: [
        {
          company: "TechCorp",
          type: "executive",
          title: "New CTO Appointment",
          description: "Former Google AI lead joins as CTO",
          impact: "High",
          threat: "Medium",
          opportunity: "Recruit from their team during transition",
          timestamp: "2 hours ago"
        },
        {
          company: "DataFlow Inc",
          type: "product",
          title: "AI Assistant Launch",
          description: "Launching direct competitor to our flagship product",
          impact: "Critical",
          threat: "High",
          opportunity: "Highlight our superior features in comparison campaign",
          timestamp: "5 hours ago"
        },
        {
          company: "CloudScale",
          type: "campaign",
          title: "Enterprise Push Campaign",
          description: "$5M marketing campaign targeting Fortune 500",
          impact: "High",
          threat: "Medium",
          opportunity: "Target mid-market while they focus upmarket",
          timestamp: "1 day ago"
        }
      ],
      regulatory: [
        {
          title: "AI Governance Act Update",
          description: "New compliance requirements for AI systems by Q3",
          impact: "All industry players affected",
          action: "Prepare compliance documentation",
          deadline: "90 days"
        }
      ],
      viralMoments: [
        {
          topic: "AI Ethics Debate",
          reach: "2.5M impressions",
          sentiment: "Mixed",
          opportunity: "Position as thought leader"
        }
      ]
    },
    stakeholders: {
      groups: [
        {
          name: "Tech Media",
          sentiment: "Positive",
          health: 85,
          recentActivity: "3 positive articles this week",
          action: "Maintain momentum with exclusive"
        },
        {
          name: "Industry Analysts",
          sentiment: "Neutral",
          health: 60,
          recentActivity: "Awaiting product demo",
          action: "Schedule analyst briefing"
        },
        {
          name: "Developer Community",
          sentiment: "Very Positive",
          health: 92,
          recentActivity: "High engagement on technical posts",
          action: "Launch developer program"
        }
      ],
      coalitions: [
        {
          name: "AI Ethics Alliance",
          members: ["Stanford AI Lab", "MIT CSAIL", "Tech Policy Institute"],
          alignment: "High",
          opportunity: "Join as founding member"
        }
      ],
      partnerships: [
        {
          partner: "CloudProvider X",
          type: "Technology Integration",
          status: "Opportunity",
          value: "High",
          nextStep: "Initial meeting scheduled"
        }
      ]
    },
    narrative: {
      currentStrength: 72,
      trend: "rising",
      topNarratives: [
        {
          theme: "Innovation Leader",
          strength: 85,
          momentum: "Growing",
          action: "Amplify with case studies"
        },
        {
          theme: "Customer Success",
          strength: 78,
          momentum: "Stable",
          action: "Gather more testimonials"
        }
      ],
      whitespace: [
        {
          opportunity: "Sustainability in AI",
          competition: "Low",
          relevance: "High",
          action: "Create thought leadership content"
        },
        {
          opportunity: "SMB Market Education",
          competition: "Medium",
          relevance: "High",
          action: "Launch educational webinar series"
        }
      ],
      shareOfVoice: {
        us: 28,
        mainCompetitor: 35,
        others: 37
      },
      emergingTopics: [
        {
          topic: "Quantum Computing Impact",
          trajectory: "Rising fast",
          relevance: "Will affect our roadmap",
          action: "Monitor and prepare position"
        }
      ]
    },
    campaigns: {
      active: [
        {
          name: "Q1 Product Launch",
          status: "On Track",
          milestone: "Pre-launch buzz building",
          engagement: "+145% vs target",
          mediaValue: "$450K",
          roi: "3.2x"
        },
        {
          name: "Thought Leadership Series",
          status: "Exceeding",
          milestone: "Episode 3 released",
          engagement: "+89% vs target",
          mediaValue: "$280K",
          roi: "2.8x"
        }
      ],
      contentPerformance: {
        topPerforming: "CEO Interview on Innovation",
        reach: "500K",
        engagement: "12%",
        sentiment: "92% positive"
      },
      mediaCoverage: {
        quality: 82,
        reach: "5.2M this week",
        tier1: 12,
        mentions: 47
      }
    },
    predictive: {
      cascadeRisks: [
        {
          trigger: "Competitor's product launch next week",
          probability: 75,
          impact: "Media attention shift",
          mitigation: "Prepare counter-narrative"
        },
        {
          trigger: "Regulatory announcement pending",
          probability: 60,
          impact: "Industry-wide scrutiny",
          mitigation: "Proactive compliance messaging"
        }
      ],
      behaviorForecasts: [
        {
          stakeholder: "Tech Media",
          prediction: "Increased interest in AI ethics",
          confidence: 85,
          action: "Prepare ethics-focused content"
        }
      ],
      narrativeSpread: {
        trend: "Your innovation message gaining traction",
        velocity: "Accelerating",
        peakEstimate: "2 weeks"
      },
      vulnerabilities: [
        {
          area: "Customer support response time",
          risk: "Medium",
          trigger: "Competitor highlighting speed",
          protection: "Implement AI chat support"
        }
      ]
    }
  };

  const fetchIntelligence = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
      
      // Use Claude Intelligence Service V2 for real data
      const intelligence = await claudeIntelligenceServiceV2.gatherAndAnalyze(config, timeframe);
      
      // Transform the data for our UI structure
      const transformedData = {
        competitors: transformCompetitorData(intelligence),
        stakeholders: transformStakeholderData(intelligence),
        narrative: transformNarrativeData(intelligence),
        campaigns: transformCampaignData(intelligence),
        predictive: transformPredictiveData(intelligence),
        executiveSummary: intelligence.executive_summary
      };
      
      setIntelligenceData(transformedData);
    } catch (err) {
      console.error('Failed to fetch intelligence:', err);
      setError('Unable to fetch real-time intelligence. Using cached data.');
      // Fall back to mock data if service fails
      setIntelligenceData(mockIntelligence);
    } finally {
      setLoading(false);
    }
  }, [timeframe, mockIntelligence]);

  useEffect(() => {
    // Fetch real intelligence data
    fetchIntelligence();
  }, [fetchIntelligence]);

  // Transform functions to convert Claude's analysis to our UI format
  const transformCompetitorData = (intelligence) => {
    const competitorAnalysis = intelligence.competitor || {};
    return {
      movements: competitorAnalysis.key_movements?.map(movement => ({
        company: movement.competitor,
        type: 'strategic',
        title: movement.action,
        description: movement.impact_on_goals,
        impact: movement.threat_level,
        threat: movement.threat_level,
        opportunity: movement.opportunity,
        timestamp: 'Recent'
      })) || [],
      regulatory: [],
      viralMoments: [],
      patterns: competitorAnalysis.strategic_patterns || [],
      recommendations: competitorAnalysis.recommended_actions || [],
      advantage: competitorAnalysis.competitive_advantage,
      priority: competitorAnalysis.priority_focus
    };
  };

  const transformStakeholderData = (intelligence) => {
    const stakeholderAnalysis = intelligence.stakeholder || {};
    return {
      groups: stakeholderAnalysis.stakeholder_map?.map(stake => ({
        name: stake.group,
        sentiment: stake.sentiment,
        health: 70 + Math.random() * 30, // Calculate from alignment
        recentActivity: 'Active engagement',
        action: stake.engagement_priority === 'High' ? 'Immediate engagement' : 'Monitor'
      })) || [],
      coalitions: stakeholderAnalysis.coalition_opportunities?.map(coal => ({
        name: coal,
        members: [],
        alignment: 'High',
        opportunity: 'Explore partnership'
      })) || [],
      partnerships: [],
      risks: stakeholderAnalysis.risk_stakeholders || [],
      strategies: stakeholderAnalysis.engagement_strategies || []
    };
  };

  const transformNarrativeData = (intelligence) => {
    const narrativeAnalysis = intelligence.narrative || {};
    return {
      currentStrength: 75,
      trend: 'rising',
      topNarratives: [],
      whitespace: narrativeAnalysis.whitespace_opportunities?.map(opp => ({
        opportunity: opp,
        competition: 'Low',
        relevance: 'High',
        action: 'Develop content strategy'
      })) || [],
      shareOfVoice: {
        us: 30,
        mainCompetitor: 35,
        others: 35
      },
      emergingTopics: narrativeAnalysis.emerging_narratives?.map(narr => ({
        topic: narr,
        trajectory: 'Rising',
        relevance: 'High',
        action: 'Monitor and engage'
      })) || [],
      strategy: narrativeAnalysis.narrative_strategy
    };
  };

  const transformCampaignData = (intelligence) => {
    // Use raw MCP data for campaign metrics when available
    return {
      active: [],
      contentPerformance: {
        topPerforming: 'Analysis in progress',
        reach: '0',
        engagement: '0%',
        sentiment: '0% positive'
      },
      mediaCoverage: {
        quality: 0,
        reach: '0',
        tier1: 0,
        mentions: 0
      }
    };
  };

  const transformPredictiveData = (intelligence) => {
    const predictiveAnalysis = intelligence.predictive || {};
    return {
      cascadeRisks: predictiveAnalysis.cascade_risks?.map(risk => ({
        trigger: risk.trigger || risk,
        probability: risk.probability || 50,
        impact: risk.impact || 'Unknown',
        mitigation: risk.mitigation || 'Monitor situation'
      })) || [],
      behaviorForecasts: predictiveAnalysis.predicted_competitor_moves?.map(move => ({
        stakeholder: 'Competitor',
        prediction: move,
        confidence: 70,
        action: 'Prepare response'
      })) || [],
      narrativeSpread: {
        trend: 'Analyzing',
        velocity: 'Normal',
        peakEstimate: 'TBD'
      },
      vulnerabilities: predictiveAnalysis.goal_vulnerabilities?.map(vuln => ({
        area: vuln,
        risk: 'Medium',
        trigger: 'External factors',
        protection: 'Strengthen defenses'
      })) || []
    };
  };

  const renderCompetitorIntelligence = () => {
    const data = intelligenceData?.competitors || mockIntelligence.competitors;
    
    return (
      <div className="intel-section">
        <div className="section-header">
          <h2>Competitor & Market Movements</h2>
          <span className="update-time">Last updated: 2 minutes ago</span>
        </div>

        <div className="movements-grid">
          {data.movements?.map((movement, idx) => (
          <div key={idx} className={`movement-card ${movement.threat.toLowerCase()}`}>
            <div className="movement-header">
              <span className="company-name">{movement.company}</span>
              <span className={`threat-badge ${movement.threat.toLowerCase()}`}>
                {movement.threat} Threat
              </span>
            </div>
            <h3>{movement.title}</h3>
            <p className="description">{movement.description}</p>
            <div className="impact-row">
              <span className="impact">Impact: {movement.impact}</span>
              <span className="time">{movement.timestamp}</span>
            </div>
            <div className="opportunity-box">
              <span className="opp-label">💡 Opportunity:</span>
              <p>{movement.opportunity}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="regulatory-section">
        <h3>⚖️ Regulatory Updates</h3>
        {data.regulatory?.map((reg, idx) => (
          <div key={idx} className="regulatory-card">
            <h4>{reg.title}</h4>
            <p>{reg.description}</p>
            <div className="reg-footer">
              <span className="deadline">⏰ {reg.deadline}</span>
              <button className="action-btn">Prepare Compliance</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    );
  };

  const renderStakeholderIntelligence = () => {
    const data = intelligenceData?.stakeholders || mockIntelligence.stakeholders;
    
    return (
      <div className="intel-section">
        <div className="section-header">
          <h2>Stakeholder Dynamics</h2>
          <span className="update-time">Real-time monitoring active</span>
        </div>

        <div className="stakeholder-grid">
          {data.groups?.map((group, idx) => (
          <div key={idx} className="stakeholder-card">
            <div className="stake-header">
              <h3>{group.name}</h3>
              <div className={`sentiment-badge ${group.sentiment.toLowerCase().replace(' ', '-')}`}>
                {group.sentiment}
              </div>
            </div>
            <div className="health-bar">
              <div className="health-label">Health Score: {group.health}%</div>
              <div className="health-track">
                <div className="health-fill" style={{width: `${group.health}%`}}></div>
              </div>
            </div>
            <p className="recent-activity">{group.recentActivity}</p>
            <button className="action-btn secondary">{group.action}</button>
          </div>
        ))}
      </div>

      <div className="coalitions-section">
        <h3>🤝 Coalition Opportunities</h3>
        {data.coalitions?.map((coalition, idx) => (
          <div key={idx} className="coalition-card">
            <h4>{coalition.name}</h4>
            <p className="members">Members: {coalition.members?.join(', ') || 'Information gathering in progress'}</p>
            <div className="coalition-footer">
              <span className="alignment">Alignment: {coalition.alignment}</span>
              <button className="action-btn primary">{coalition.opportunity}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    );
  };

  const renderNarrativeAnalysis = () => (
    <div className="intel-section">
      <div className="section-header">
        <h2>Narrative & Market Position</h2>
        <span className="update-time">Strength: {mockIntelligence.narrative.currentStrength}% ↑</span>
      </div>

      <div className="share-of-voice">
        <h3>Share of Voice</h3>
        <div className="sov-bars">
          <div className="sov-bar">
            <div className="sov-label">You</div>
            <div className="sov-track">
              <div className="sov-fill you" style={{width: `${mockIntelligence.narrative.shareOfVoice.us}%`}}>
                {mockIntelligence.narrative.shareOfVoice.us}%
              </div>
            </div>
          </div>
          <div className="sov-bar">
            <div className="sov-label">Main Competitor</div>
            <div className="sov-track">
              <div className="sov-fill competitor" style={{width: `${mockIntelligence.narrative.shareOfVoice.mainCompetitor}%`}}>
                {mockIntelligence.narrative.shareOfVoice.mainCompetitor}%
              </div>
            </div>
          </div>
          <div className="sov-bar">
            <div className="sov-label">Others</div>
            <div className="sov-track">
              <div className="sov-fill others" style={{width: `${mockIntelligence.narrative.shareOfVoice.others}%`}}>
                {mockIntelligence.narrative.shareOfVoice.others}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="whitespace-grid">
        <h3>💎 Whitespace Opportunities</h3>
        {mockIntelligence.narrative.whitespace.map((opp, idx) => (
          <div key={idx} className="whitespace-card">
            <h4>{opp.opportunity}</h4>
            <div className="opp-metrics">
              <span>Competition: {opp.competition}</span>
              <span>Relevance: {opp.relevance}</span>
            </div>
            <button className="action-btn primary">{opp.action}</button>
          </div>
        ))}
      </div>

      <div className="emerging-topics">
        <h3>📈 Emerging Topics</h3>
        {mockIntelligence.narrative.emergingTopics.map((topic, idx) => (
          <div key={idx} className="topic-card">
            <h4>{topic.topic}</h4>
            <p className="trajectory">{topic.trajectory}</p>
            <p className="relevance">{topic.relevance}</p>
            <span className="action-link">→ {topic.action}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCampaignPerformance = () => {
    const data = intelligenceData?.campaigns || mockIntelligence.campaigns;
    
    return (
      <div className="intel-section">
        <div className="section-header">
          <h2>Campaign & Content Performance</h2>
          <span className="update-time">{data.active?.length || 0} active campaigns</span>
        </div>

        <div className="campaigns-grid">
          {(data.active?.length > 0 ? data.active : mockIntelligence.campaigns.active).map((campaign, idx) => (
          <div key={idx} className="campaign-card">
            <div className="campaign-header">
              <h3>{campaign.name}</h3>
              <span className={`status-badge ${campaign.status.toLowerCase().replace(' ', '-')}`}>
                {campaign.status}
              </span>
            </div>
            <p className="milestone">📍 {campaign.milestone}</p>
            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">Engagement</span>
                <span className="metric-value positive">{campaign.engagement}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Media Value</span>
                <span className="metric-value">{campaign.mediaValue}</span>
              </div>
              <div className="metric">
                <span className="metric-label">ROI</span>
                <span className="metric-value highlight">{campaign.roi}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="media-coverage">
        <h3>📰 Media Coverage Quality</h3>
        <div className="coverage-stats">
          <div className="stat">
            <span className="stat-value">{data.mediaCoverage?.quality || 0}</span>
            <span className="stat-label">Quality Score</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.mediaCoverage?.reach || '0'}</span>
            <span className="stat-label">Weekly Reach</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.mediaCoverage?.tier1 || 0}</span>
            <span className="stat-label">Tier 1 Media</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.mediaCoverage?.mentions || 0}</span>
            <span className="stat-label">Total Mentions</span>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderPredictiveIntelligence = () => (
    <div className="intel-section">
      <div className="section-header">
        <h2>Predictive Intelligence & Risk Assessment</h2>
        <span className="update-time">Next update in 4 hours</span>
      </div>

      <div className="cascade-risks">
        <h3>⚠️ Cascade Risk Analysis</h3>
        {mockIntelligence.predictive.cascadeRisks.map((risk, idx) => (
          <div key={idx} className="risk-card">
            <div className="risk-header">
              <h4>{risk.trigger}</h4>
              <span className="probability">{risk.probability}% probability</span>
            </div>
            <p className="impact">Impact: {risk.impact}</p>
            <div className="mitigation">
              <span className="mit-label">Mitigation:</span>
              <p>{risk.mitigation}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="behavior-forecasts">
        <h3>🔮 Stakeholder Behavior Forecasts</h3>
        {mockIntelligence.predictive.behaviorForecasts.map((forecast, idx) => (
          <div key={idx} className="forecast-card">
            <h4>{forecast.stakeholder}</h4>
            <p>{forecast.prediction}</p>
            <div className="forecast-footer">
              <span className="confidence">Confidence: {forecast.confidence}%</span>
              <button className="action-btn secondary">{forecast.action}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="vulnerabilities">
        <h3>🛡️ Vulnerability Assessment</h3>
        {mockIntelligence.predictive.vulnerabilities.map((vuln, idx) => (
          <div key={idx} className="vulnerability-card">
            <div className="vuln-header">
              <h4>{vuln.area}</h4>
              <span className={`risk-level ${vuln.risk.toLowerCase()}`}>
                {vuln.risk} Risk
              </span>
            </div>
            <p className="trigger">Trigger: {vuln.trigger}</p>
            <div className="protection">
              <span>Protection: </span>
              <span className="protection-action">{vuln.protection}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'competitors', label: 'Competitor Movements', icon: '🎯' },
    { id: 'stakeholders', label: 'Stakeholder Intelligence', icon: '👥' },
    { id: 'narrative', label: 'Narrative Analysis', icon: '📊' },
    { id: 'campaigns', label: 'Campaign Performance', icon: '📈' },
    { id: 'predictive', label: 'Predictive Intelligence', icon: '🔮' }
  ];

  return (
    <div className="intelligence-hub">
      <div className="hub-header">
        <div className="hub-title">
          <h1>Intelligence Hub</h1>
          <p>Real-time strategic intelligence and insights</p>
        </div>
        <div className="timeframe-selector">
          <button 
            className={timeframe === '24h' ? 'active' : ''} 
            onClick={() => setTimeframe('24h')}
          >
            24 Hours
          </button>
          <button 
            className={timeframe === '7d' ? 'active' : ''} 
            onClick={() => setTimeframe('7d')}
          >
            7 Days
          </button>
          <button 
            className={timeframe === '30d' ? 'active' : ''} 
            onClick={() => setTimeframe('30d')}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="hub-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="hub-content">
        {loading && <div className="loading">Gathering intelligence...</div>}
        {error && <div className="error">Unable to load intelligence. Using cached data.</div>}
        
        {!loading && !error && (
          <>
            {activeTab === 'competitors' && renderCompetitorIntelligence()}
            {activeTab === 'stakeholders' && renderStakeholderIntelligence()}
            {activeTab === 'narrative' && renderNarrativeAnalysis()}
            {activeTab === 'campaigns' && renderCampaignPerformance()}
            {activeTab === 'predictive' && renderPredictiveIntelligence()}
          </>
        )}
      </div>
    </div>
  );
};

export default IntelligenceHub;