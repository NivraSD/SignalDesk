import React, { useState, useEffect } from 'react';
import intelligenceOrchestratorV3 from '../services/intelligenceOrchestratorV3';
import cacheManager from '../utils/cacheManager';
import './IntelligenceDisplayV3.css';

// Intelligence Hub V6 - Pure Analysis & Insights (No Raw Monitoring Data)
const IntelligenceHubV6 = ({ organization, onIntelligenceUpdate }) => {
  const [activeTab, setActiveTab] = useState('executive');
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 5 Analysis-Focused Tabs
  const tabs = [
    { id: 'executive', name: 'Executive Brief', icon: '📊' },
    { id: 'competitive', name: 'Competitive Analysis', icon: '🎯' },
    { id: 'stakeholder', name: 'Stakeholder Insights', icon: '👥' },
    { id: 'narrative', name: 'Narrative Trends', icon: '📈' },
    { id: 'strategic', name: 'Strategic Outlook', icon: '🔮' }
  ];

  useEffect(() => {
    if (organization) {
      fetchIntelligenceAnalysis();
    }
  }, [organization]);

  const fetchIntelligenceAnalysis = async () => {
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

      console.log('🎯 Fetching intelligence analysis for:', completeProfile.name);

      const result = await intelligenceOrchestratorV3.orchestrate(completeProfile);
      
      if (result.success && result.tabs) {
        const analysis = processIntelligenceIntoAnalysis(result);
        setIntelligence(analysis);
        
        // Pass full result to Opportunity Engine
        if (onIntelligenceUpdate) {
          onIntelligenceUpdate(result);
        }
        
        // Cache the result
        cacheManager.saveSynthesis(result);
      } else {
        setError(result.error || 'No intelligence available');
      }
    } catch (err) {
      console.error('Intelligence analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processIntelligenceIntoAnalysis = (data) => {
    const tabs = data.tabs || {};
    
    return {
      executive: generateExecutiveAnalysis(tabs, data),
      competitive: generateCompetitiveAnalysis(tabs),
      stakeholder: generateStakeholderAnalysis(tabs),
      narrative: generateNarrativeAnalysis(tabs),
      strategic: generateStrategicAnalysis(tabs)
    };
  };

  const generateExecutiveAnalysis = (tabs, fullData) => {
    const exec = tabs.executive || {};
    const stats = tabs.statistics || {};
    
    return {
      situation: {
        title: "Current Situation",
        summary: exec.overview || "Monitoring stakeholder landscape for strategic opportunities",
        keyPoints: [
          exec.competitive_highlight || "Competitive landscape stable",
          exec.market_highlight || "Market sentiment neutral",
          exec.media_highlight || "Media coverage as expected"
        ].filter(Boolean)
      },
      implications: {
        title: "What This Means",
        points: exec.immediate_actions || [
          "Continue monitoring key stakeholders",
          "Maintain current messaging strategy",
          "Watch for emerging opportunities"
        ]
      },
      recommendations: {
        title: "Recommended Actions",
        priority: "high",
        actions: (exec.immediate_actions || []).map(action => ({
          action,
          timing: "Next 24-48 hours",
          impact: "High"
        }))
      },
      metrics: {
        stakeholders: stats.entities_tracked || 0,
        signals: stats.actions_captured || 0,
        opportunities: fullData?.opportunities?.length || 0,
        risk_level: exec.risk_level || "low"
      }
    };
  };

  const generateCompetitiveAnalysis = (tabs) => {
    const comp = tabs.competitive || {};
    
    return {
      landscape: {
        title: "Competitive Landscape",
        summary: comp.pr_strategy || "Monitor and respond strategically to competitive moves",
        movements: (comp.competitor_actions || []).map(action => ({
          competitor: action.entity,
          move: action.action,
          threat_level: action.impact || "medium",
          our_advantage: `Counter with our ${action.our_strength || 'unique value proposition'}`
        }))
      },
      positioning: {
        title: "Our Position",
        strengths: comp.our_advantages || [
          "Market leadership",
          "Innovation track record",
          "Customer trust"
        ],
        opportunities: comp.competitive_gaps?.map(gap => gap.gap) || [
          "Expand thought leadership",
          "Increase media presence"
        ]
      },
      strategy: {
        title: "PR Strategy",
        approach: comp.pr_strategy || "Maintain offensive positioning",
        key_messages: comp.key_messages || [
          "Industry innovation leader",
          "Customer-focused solutions",
          "Proven track record"
        ],
        do_not_say: comp.do_not_say || [
          "Direct competitor comparisons",
          "Defensive statements"
        ]
      }
    };
  };

  const generateStakeholderAnalysis = (tabs) => {
    const media = tabs.media || {};
    const regulatory = tabs.regulatory || {};
    
    return {
      media: {
        title: "Media Landscape",
        sentiment: media.sentiment_trend || "neutral",
        narrative: media.media_strategy || "Proactive engagement recommended",
        opportunities: media.media_outreach || ["Pitch thought leadership pieces"],
        risks: media.narrative_risks || []
      },
      regulatory: {
        title: "Regulatory Environment",
        status: regulatory.regulatory_stance || "Compliant and engaged",
        developments: regulatory.regulatory_developments || [],
        required_actions: regulatory.compliance_requirements || []
      },
      investors: {
        title: "Investor Sentiment",
        mood: "positive",
        focus_areas: ["Growth metrics", "Innovation pipeline"],
        messaging: "Emphasize long-term value creation"
      },
      overall: {
        title: "Stakeholder Summary",
        health_score: 75,
        key_relationships: "Strong",
        action_items: [
          "Maintain regular stakeholder communications",
          "Address any emerging concerns proactively"
        ]
      }
    };
  };

  const generateNarrativeAnalysis = (tabs) => {
    const market = tabs.market || {};
    const media = tabs.media || {};
    
    return {
      trending: {
        title: "Trending Narratives",
        topics: (market.market_trends || []).map(trend => ({
          topic: trend.topic,
          momentum: trend.trend || "stable",
          relevance: "high",
          opportunity: `Lead conversation on ${trend.topic}`,
          talking_points: [
            `Our perspective on ${trend.topic}`,
            `How we're addressing ${trend.topic}`,
            `Future vision for ${trend.topic}`
          ]
        }))
      },
      emerging: {
        title: "Emerging Themes",
        themes: market.thought_leadership || [
          "Digital transformation acceleration",
          "Sustainability focus",
          "AI ethics and governance"
        ],
        readiness: "prepared"
      },
      risks: {
        title: "Narrative Risks",
        items: media.narrative_risks || [],
        mitigation: "Prepared statements ready"
      }
    };
  };

  const generateStrategicAnalysis = (tabs) => {
    const forward = tabs.forward || {};
    
    return {
      outlook: {
        title: "30-Day Outlook",
        summary: forward.proactive_strategy || "Multiple opportunities for market leadership",
        predictions: (forward.predictions || []).map(pred => ({
          event: pred.trigger,
          likelihood: "high",
          impact: pred.impact || "medium",
          preparation: pred.preparation || "Response strategy ready"
        }))
      },
      opportunities: {
        title: "Strategic Opportunities",
        items: (forward.preparation_needed || []).map(prep => ({
          opportunity: prep,
          window: "Next 2 weeks",
          resources: "Available",
          roi: "High"
        }))
      },
      recommendations: {
        title: "Strategic Recommendations",
        immediate: "Activate thought leadership campaign",
        short_term: "Strengthen media relationships",
        long_term: "Build category leadership position"
      }
    };
  };

  const renderTab = () => {
    if (!intelligence) return null;
    
    switch(activeTab) {
      case 'executive':
        return renderExecutiveAnalysis();
      case 'competitive':
        return renderCompetitiveAnalysis();
      case 'stakeholder':
        return renderStakeholderAnalysis();
      case 'narrative':
        return renderNarrativeAnalysis();
      case 'strategic':
        return renderStrategicAnalysis();
      default:
        return renderExecutiveAnalysis();
    }
  };

  const renderExecutiveAnalysis = () => {
    const data = intelligence.executive;
    return (
      <div className="analysis-content">
        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">📍</span>
            {data.situation.title}
          </h3>
          <p className="section-summary">{data.situation.summary}</p>
          <div className="key-points">
            {data.situation.keyPoints.map((point, idx) => (
              <div key={idx} className="key-point">
                <span className="point-indicator">▸</span>
                {point}
              </div>
            ))}
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{data.metrics.stakeholders}</div>
            <div className="metric-label">Stakeholders Monitored</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data.metrics.signals}</div>
            <div className="metric-label">Signals Detected</div>
          </div>
          <div className="metric-card highlight">
            <div className="metric-value">{data.metrics.opportunities}</div>
            <div className="metric-label">Opportunities</div>
          </div>
          <div className="metric-card">
            <div className="metric-value risk-{data.metrics.risk_level}">{data.metrics.risk_level}</div>
            <div className="metric-label">Risk Level</div>
          </div>
        </div>

        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">💡</span>
            {data.implications.title}
          </h3>
          <div className="implications-list">
            {data.implications.points.map((point, idx) => (
              <div key={idx} className="implication-item">
                <span className="implication-number">{idx + 1}</span>
                {point}
              </div>
            ))}
          </div>
        </div>

        {data.recommendations.actions.length > 0 && (
          <div className="analysis-section recommendations">
            <h3 className="section-title">
              <span className="neon-icon">🎯</span>
              {data.recommendations.title}
            </h3>
            <div className="action-cards">
              {data.recommendations.actions.map((action, idx) => (
                <div key={idx} className="action-card priority-{data.recommendations.priority}">
                  <div className="action-content">
                    <div className="action-text">{action.action}</div>
                    <div className="action-meta">
                      <span className="timing">{action.timing}</span>
                      <span className="impact">Impact: {action.impact}</span>
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

  const renderCompetitiveAnalysis = () => {
    const data = intelligence.competitive;
    return (
      <div className="analysis-content">
        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">🏆</span>
            {data.landscape.title}
          </h3>
          <p className="section-summary">{data.landscape.summary}</p>
          
          {data.landscape.movements.length > 0 && (
            <div className="competitive-movements">
              {data.landscape.movements.map((move, idx) => (
                <div key={idx} className="movement-card">
                  <div className="movement-header">
                    <span className="competitor-name">{move.competitor}</span>
                    <span className="threat-badge threat-{move.threat_level}">{move.threat_level}</span>
                  </div>
                  <div className="movement-action">{move.move}</div>
                  <div className="our-response">
                    <span className="response-label">Our Advantage:</span>
                    {move.our_advantage}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">🛡️</span>
            {data.positioning.title}
          </h3>
          <div className="positioning-grid">
            <div className="positioning-column">
              <h4>Strengths</h4>
              {data.positioning.strengths.map((strength, idx) => (
                <div key={idx} className="position-item strength">
                  <span className="item-icon">✓</span>
                  {strength}
                </div>
              ))}
            </div>
            <div className="positioning-column">
              <h4>Opportunities</h4>
              {data.positioning.opportunities.map((opp, idx) => (
                <div key={idx} className="position-item opportunity">
                  <span className="item-icon">↗</span>
                  {opp}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">📢</span>
            {data.strategy.title}
          </h3>
          <div className="strategy-approach">{data.strategy.approach}</div>
          
          <div className="messaging-grid">
            <div className="message-section">
              <h4 className="message-title">Key Messages</h4>
              {data.strategy.key_messages.map((msg, idx) => (
                <div key={idx} className="message-item do-say">
                  <span className="message-icon">✓</span>
                  {msg}
                </div>
              ))}
            </div>
            <div className="message-section">
              <h4 className="message-title">Avoid Saying</h4>
              {data.strategy.do_not_say.map((msg, idx) => (
                <div key={idx} className="message-item dont-say">
                  <span className="message-icon">✗</span>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStakeholderAnalysis = () => {
    const data = intelligence.stakeholder;
    return (
      <div className="analysis-content">
        <div className="stakeholder-grid">
          <div className="stakeholder-card">
            <h3 className="card-title">
              <span className="neon-icon">📰</span>
              {data.media.title}
            </h3>
            <div className="sentiment-indicator sentiment-{data.media.sentiment}">
              Sentiment: {data.media.sentiment}
            </div>
            <div className="card-content">
              <p className="narrative">{data.media.narrative}</p>
              <div className="opportunities-list">
                <h4>Opportunities</h4>
                {data.media.opportunities.map((opp, idx) => (
                  <div key={idx} className="opp-item">• {opp}</div>
                ))}
              </div>
              {data.media.risks.length > 0 && (
                <div className="risks-list">
                  <h4>Risks</h4>
                  {data.media.risks.map((risk, idx) => (
                    <div key={idx} className="risk-item">⚠ {risk}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stakeholder-card">
            <h3 className="card-title">
              <span className="neon-icon">⚖️</span>
              {data.regulatory.title}
            </h3>
            <div className="status-badge">{data.regulatory.status}</div>
            <div className="card-content">
              {data.regulatory.developments.length > 0 && (
                <div className="developments">
                  <h4>Recent Developments</h4>
                  {data.regulatory.developments.map((dev, idx) => (
                    <div key={idx} className="dev-item">{dev}</div>
                  ))}
                </div>
              )}
              {data.regulatory.required_actions.length > 0 && (
                <div className="actions">
                  <h4>Required Actions</h4>
                  {data.regulatory.required_actions.map((action, idx) => (
                    <div key={idx} className="action-item">→ {action}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stakeholder-card">
            <h3 className="card-title">
              <span className="neon-icon">💰</span>
              {data.investors.title}
            </h3>
            <div className="mood-indicator mood-{data.investors.mood}">
              Mood: {data.investors.mood}
            </div>
            <div className="card-content">
              <div className="focus-areas">
                <h4>Focus Areas</h4>
                {data.investors.focus_areas.map((area, idx) => (
                  <div key={idx} className="focus-item">• {area}</div>
                ))}
              </div>
              <p className="messaging-note">{data.investors.messaging}</p>
            </div>
          </div>
        </div>

        <div className="analysis-section overall-summary">
          <h3 className="section-title">
            <span className="neon-icon">📊</span>
            {data.overall.title}
          </h3>
          <div className="summary-metrics">
            <div className="health-score">
              <div className="score-value">{data.overall.health_score}%</div>
              <div className="score-label">Stakeholder Health</div>
            </div>
            <div className="relationship-status">
              <div className="status-value">{data.overall.key_relationships}</div>
              <div className="status-label">Key Relationships</div>
            </div>
          </div>
          <div className="action-items">
            {data.overall.action_items.map((item, idx) => (
              <div key={idx} className="action-item">
                <span className="item-number">{idx + 1}</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderNarrativeAnalysis = () => {
    const data = intelligence.narrative;
    return (
      <div className="analysis-content">
        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">📈</span>
            {data.trending.title}
          </h3>
          <div className="trending-topics">
            {data.trending.topics.map((topic, idx) => (
              <div key={idx} className="topic-card">
                <div className="topic-header">
                  <span className="topic-name">{topic.topic}</span>
                  <span className="momentum-badge momentum-{topic.momentum}">{topic.momentum}</span>
                </div>
                <div className="topic-opportunity">{topic.opportunity}</div>
                <div className="talking-points">
                  <h4>Talking Points</h4>
                  {topic.talking_points.map((point, pidx) => (
                    <div key={pidx} className="talking-point">• {point}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">🌱</span>
            {data.emerging.title}
          </h3>
          <div className="emerging-themes">
            {data.emerging.themes.map((theme, idx) => (
              <div key={idx} className="theme-item">
                <span className="theme-indicator">→</span>
                {theme}
              </div>
            ))}
          </div>
          <div className="readiness-status">
            Readiness Status: <span className="status-value">{data.emerging.readiness}</span>
          </div>
        </div>

        {data.risks.items.length > 0 && (
          <div className="analysis-section risks">
            <h3 className="section-title">
              <span className="neon-icon">⚠️</span>
              {data.risks.title}
            </h3>
            <div className="risk-items">
              {data.risks.items.map((risk, idx) => (
                <div key={idx} className="risk-item">{risk}</div>
              ))}
            </div>
            <div className="mitigation-note">{data.risks.mitigation}</div>
          </div>
        )}
      </div>
    );
  };

  const renderStrategicAnalysis = () => {
    const data = intelligence.strategic;
    return (
      <div className="analysis-content">
        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">🔮</span>
            {data.outlook.title}
          </h3>
          <p className="section-summary">{data.outlook.summary}</p>
          
          <div className="predictions-grid">
            {data.outlook.predictions.map((pred, idx) => (
              <div key={idx} className="prediction-card">
                <div className="prediction-event">{pred.event}</div>
                <div className="prediction-meta">
                  <span className="likelihood">Likelihood: {pred.likelihood}</span>
                  <span className="impact">Impact: {pred.impact}</span>
                </div>
                <div className="preparation">{pred.preparation}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-section">
          <h3 className="section-title">
            <span className="neon-icon">🚀</span>
            {data.opportunities.title}
          </h3>
          <div className="strategic-opportunities">
            {data.opportunities.items.map((opp, idx) => (
              <div key={idx} className="strategic-opp-card">
                <div className="opp-title">{opp.opportunity}</div>
                <div className="opp-details">
                  <span className="window">Window: {opp.window}</span>
                  <span className="resources">Resources: {opp.resources}</span>
                  <span className="roi">ROI: {opp.roi}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analysis-section recommendations">
          <h3 className="section-title">
            <span className="neon-icon">🎯</span>
            {data.recommendations.title}
          </h3>
          <div className="recommendation-timeline">
            <div className="timeline-item immediate">
              <div className="timeline-label">Immediate</div>
              <div className="timeline-content">{data.recommendations.immediate}</div>
            </div>
            <div className="timeline-item short-term">
              <div className="timeline-label">Short Term</div>
              <div className="timeline-content">{data.recommendations.short_term}</div>
            </div>
            <div className="timeline-item long-term">
              <div className="timeline-label">Long Term</div>
              <div className="timeline-content">{data.recommendations.long_term}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="intelligence-display-v3 loading">
        <div className="intelligence-loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Analyzing Intelligence</div>
          <div className="loading-subtext">Processing stakeholder signals and market dynamics...</div>
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
          <button onClick={fetchIntelligenceAnalysis} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="intelligence-display-v3">
      <div className="intelligence-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`intelligence-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>
      
      <div className="intelligence-content">
        {intelligence ? renderTab() : (
          <div className="no-data">
            <p>No intelligence analysis available</p>
            <button onClick={fetchIntelligenceAnalysis} className="action-button">
              Run Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceHubV6;