import React, { useState, useEffect } from 'react';
import intelligenceOrchestratorV4 from '../services/intelligenceOrchestratorV4';
import './IntelligenceHubV8.css';

/**
 * Intelligence Hub V8 - Analysis-Driven, Not Visual-Driven
 * 6 Agreed Tabs: Executive, Competitive, Market, Regulatory, Media, Forward
 */
const IntelligenceHubV8 = ({ organization, onIntelligenceUpdate }) => {
  const [activeTab, setActiveTab] = useState('executive');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // The 6 agreed tabs for proper intelligence analysis
  const tabs = [
    { id: 'executive', name: 'Executive Summary', icon: '📊' },
    { id: 'competitive', name: 'Competitive', icon: '🎯' },
    { id: 'market', name: 'Market', icon: '📈' },
    { id: 'regulatory', name: 'Regulatory', icon: '⚖️' },
    { id: 'media', name: 'Media', icon: '📰' },
    { id: 'forward', name: 'Forward Looking', icon: '🔮' }
  ];

  useEffect(() => {
    if (organization) {
      runIntelligenceAnalysis();
    }
  }, [organization]);

  const runIntelligenceAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the organization data directly - no cacheManager
      const completeProfile = organization;
      
      // Ensure we have ALL stakeholders from the organization data
      if (!completeProfile.stakeholders) {
        completeProfile.stakeholders = {
          competitors: completeProfile.competitors || [],
          regulators: completeProfile.regulators || [],
          media_outlets: completeProfile.media_outlets || [],
          investors: completeProfile.investors || [],
          analysts: completeProfile.analysts || [],
          activists: completeProfile.activists || [],
          critics: completeProfile.critics || []
        };
      }

      console.log('🎯 Running intelligence analysis with organization:', {
        name: completeProfile.name,
        competitors: completeProfile.competitors?.length || 0,
        stakeholders: completeProfile.stakeholders ? Object.keys(completeProfile.stakeholders) : []
      });

      const result = await intelligenceOrchestratorV4.orchestrate(completeProfile);
      
      if (result.success) {
        // Process the tabs data for display
        const processedAnalysis = processAnalysisForDisplay(result);
        setAnalysis(processedAnalysis);
        
        // Pass to Opportunity Engine
        if (onIntelligenceUpdate) {
          onIntelligenceUpdate(result);
        }
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('❌ Intelligence analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processAnalysisForDisplay = (result) => {
    // If we have synthesis tabs, use them
    if (result.tabs) {
      return result.tabs;
    }
    
    // Otherwise, generate from analysis
    if (result.analysis) {
      return {
        executive: generateExecutiveFromAnalysis(result.analysis),
        competitive: generateCompetitiveFromAnalysis(result.analysis),
        market: generateMarketFromAnalysis(result.analysis),
        regulatory: generateRegulatoryFromAnalysis(result.analysis),
        media: generateMediaFromAnalysis(result.analysis),
        forward: generateForwardFromAnalysis(result.analysis)
      };
    }
    
    return null;
  };

  const generateExecutiveFromAnalysis = (analysis) => {
    return {
      headline: `${analysis.signal_analysis?.length || 0} critical signals detected`,
      competitive_highlight: analysis.signal_analysis?.[0]?.signal || 'No competitive activity',
      market_highlight: analysis.pattern_recognition?.[0]?.insight || 'Market stable',
      immediate_actions: analysis.response_strategy?.immediate_24h?.actions || [],
      statistics: {
        entities_tracked: 6, // All stakeholder types
        actions_captured: analysis.signal_analysis?.length || 0,
        topics_monitored: analysis.pattern_recognition?.length || 0
      }
    };
  };

  const generateCompetitiveFromAnalysis = (analysis) => {
    return {
      competitor_actions: analysis.signal_analysis?.filter(s => 
        s.signal?.toLowerCase().includes('compet')
      ) || [],
      competitive_gaps: [],
      pr_strategy: analysis.strategic_implications?.competitive_position?.momentum || 'Monitor',
      key_messages: analysis.response_strategy?.immediate_24h?.messaging || []
    };
  };

  const generateMarketFromAnalysis = (analysis) => {
    return {
      market_trends: analysis.pattern_recognition?.map(p => ({
        topic: p.type,
        trend: 'emerging',
        mentions: p.signals_connected?.length || 0,
        sources: []
      })) || [],
      opportunities: analysis.strategic_implications?.market_narrative?.narrative_opportunities || []
    };
  };

  const generateRegulatoryFromAnalysis = (analysis) => {
    return {
      regulatory_developments: [],
      compliance_requirements: [],
      regulatory_risks: analysis.elite_insights?.non_obvious_risks || [],
      regulatory_stance: 'Maintain compliance messaging'
    };
  };

  const generateMediaFromAnalysis = (analysis) => {
    return {
      media_coverage: [],
      sentiment_trend: analysis.stakeholder_impact?.media?.perception_shift || 'Neutral',
      journalist_interest: [],
      media_strategy: analysis.stakeholder_impact?.media?.messaging_needs?.join(', ') || 'Monitor coverage'
    };
  };

  const generateForwardFromAnalysis = (analysis) => {
    return {
      predictions: analysis.pattern_recognition?.map(p => ({
        trigger: p.insight,
        immediate_impact: p.implications?.[0] || 'Monitor',
        near_term: p.implications?.[1] || 'Prepare response',
        long_term: 'Strategic adjustment needed'
      })) || [],
      proactive_strategy: analysis.response_strategy?.short_term_7d?.actions?.join(', ') || 'Continue monitoring'
    };
  };

  const renderTab = () => {
    if (loading) return <div className="loading">Running intelligence analysis...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!analysis) return <div className="no-data">No analysis data available</div>;

    switch(activeTab) {
      case 'executive':
        return renderExecutive();
      case 'competitive':
        return renderCompetitive();
      case 'market':
        return renderMarket();
      case 'regulatory':
        return renderRegulatory();
      case 'media':
        return renderMedia();
      case 'forward':
        return renderForward();
      default:
        return <div>Select a tab</div>;
    }
  };

  const renderExecutive = () => {
    const data = analysis.executive;
    if (!data) return <div>No executive summary available</div>;

    return (
      <div className="executive-analysis">
        <h2 className="headline">{data.headline}</h2>
        
        <div className="key-highlights">
          <div className="highlight competitive">
            <strong>Competitive:</strong> {data.competitive_highlight}
          </div>
          <div className="highlight market">
            <strong>Market:</strong> {data.market_highlight}
          </div>
        </div>

        {data.immediate_actions?.length > 0 && (
          <div className="immediate-actions">
            <h3>Immediate Actions Required:</h3>
            <ul>
              {data.immediate_actions.map((item, idx) => (
                <li key={idx}>
                  {typeof item === 'string' ? item : (
                    <>
                      <strong>{item.action}</strong>
                      {item.priority && <span className="priority"> ({item.priority})</span>}
                      {item.timeline && <span className="timeline"> - {item.timeline}</span>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="statistics">
          <div className="stat">
            <span className="stat-value">{data.statistics?.entities_tracked || 0}</span>
            <span className="stat-label">Entities Tracked</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.statistics?.actions_captured || 0}</span>
            <span className="stat-label">Actions Captured</span>
          </div>
          <div className="stat">
            <span className="stat-value">{data.statistics?.topics_monitored || 0}</span>
            <span className="stat-label">Topics Monitored</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCompetitive = () => {
    const data = analysis.competitive;
    if (!data) return <div>No competitive analysis available</div>;

    return (
      <div className="competitive-analysis">
        <h2>Competitive Intelligence</h2>
        
        {data.competitor_actions?.length > 0 ? (
          <div className="competitor-actions">
            <h3>Recent Competitor Actions:</h3>
            {data.competitor_actions.map((action, idx) => (
              <div key={idx} className="action-item">
                <div className="action-entity">{action.entity}</div>
                <div className="action-description">{action.action}</div>
                {action.source && <div className="action-source">Source: {action.source}</div>}
                {action.pr_response && <div className="action-response">PR Response: {action.pr_response}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p>No recent competitor activity detected</p>
        )}

        {data.pr_strategy && (
          <div className="pr-strategy">
            <h3>PR Strategy:</h3>
            <p>{data.pr_strategy}</p>
          </div>
        )}

        {data.key_messages?.length > 0 && (
          <div className="key-messages">
            <h3>Key Messages:</h3>
            <ul>
              {data.key_messages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderMarket = () => {
    const data = analysis.market;
    if (!data) return <div>No market analysis available</div>;

    return (
      <div className="market-analysis">
        <h2>Market Intelligence</h2>
        
        {data.market_trends?.length > 0 ? (
          <div className="market-trends">
            <h3>Market Trends:</h3>
            {data.market_trends.map((trend, idx) => (
              <div key={idx} className="trend-item">
                <div className="trend-topic">{trend.topic}</div>
                <div className="trend-status">
                  Trend: {trend.trend} | Mentions: {trend.mentions}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No significant market trends detected</p>
        )}

        {data.opportunities?.length > 0 && (
          <div className="market-opportunities">
            <h3>Market Opportunities:</h3>
            <ul>
              {data.opportunities.map((opp, idx) => (
                <li key={idx}>{opp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderRegulatory = () => {
    const data = analysis.regulatory;
    if (!data) return <div>No regulatory analysis available</div>;

    return (
      <div className="regulatory-analysis">
        <h2>Regulatory Intelligence</h2>
        
        {data.regulatory_developments?.length > 0 ? (
          <div className="regulatory-developments">
            <h3>Recent Developments:</h3>
            {data.regulatory_developments.map((dev, idx) => (
              <div key={idx} className="development-item">
                {dev.development || dev}
              </div>
            ))}
          </div>
        ) : (
          <p>No new regulatory developments</p>
        )}

        {data.regulatory_risks?.length > 0 && (
          <div className="regulatory-risks">
            <h3>Regulatory Risks:</h3>
            <ul>
              {data.regulatory_risks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="regulatory-stance">
          <h3>Recommended Stance:</h3>
          <p>{data.regulatory_stance || 'Maintain compliance messaging'}</p>
        </div>
      </div>
    );
  };

  const renderMedia = () => {
    const data = analysis.media;
    if (!data) return <div>No media analysis available</div>;

    return (
      <div className="media-analysis">
        <h2>Media Intelligence</h2>
        
        <div className="media-sentiment">
          <h3>Sentiment Trend:</h3>
          <p>{data.sentiment_trend || 'Neutral'}</p>
        </div>

        {data.media_coverage?.length > 0 ? (
          <div className="media-coverage">
            <h3>Recent Coverage:</h3>
            {data.media_coverage.map((coverage, idx) => (
              <div key={idx} className="coverage-item">
                {coverage.outlet}: {coverage.headline || coverage}
              </div>
            ))}
          </div>
        ) : (
          <p>No recent media coverage</p>
        )}

        <div className="media-strategy">
          <h3>Media Strategy:</h3>
          <p>{data.media_strategy || 'Monitor media coverage'}</p>
        </div>
      </div>
    );
  };

  const renderForward = () => {
    const data = analysis.forward;
    if (!data) return <div>No forward-looking analysis available</div>;

    return (
      <div className="forward-analysis">
        <h2>Forward Looking Intelligence</h2>
        
        {data.predictions?.length > 0 ? (
          <div className="predictions">
            <h3>Cascade Predictions:</h3>
            {data.predictions.map((pred, idx) => (
              <div key={idx} className="prediction-item">
                <div className="prediction-trigger">
                  <strong>If:</strong> {pred.trigger}
                </div>
                <div className="prediction-impacts">
                  <div>📍 Immediate: {pred.immediate_impact}</div>
                  <div>📅 Near-term: {pred.near_term}</div>
                  <div>🎯 Long-term: {pred.long_term}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No cascade predictions available</p>
        )}

        <div className="proactive-strategy">
          <h3>Proactive Strategy:</h3>
          <p>{data.proactive_strategy || 'Continue monitoring for opportunities'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="intelligence-hub-v8">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTab()}
      </div>

      {/* Refresh Button */}
      <button 
        className="refresh-analysis"
        onClick={runIntelligenceAnalysis}
        disabled={loading}
      >
        🔄 Refresh Analysis
      </button>
    </div>
  );
};

export default IntelligenceHubV8;