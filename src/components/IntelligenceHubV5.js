import React, { useState, useEffect } from 'react';
import intelligenceOrchestratorV3 from '../services/intelligenceOrchestratorV3';
import { getUnifiedOrganization } from '../utils/unifiedDataLoader';
import cacheManager from '../utils/cacheManager';
import './IntelligenceDisplayV3.css';

// Intelligence Hub V5 - Focused on stakeholder monitoring that feeds Opportunity Engine
const IntelligenceHubV5 = ({ organization, onIntelligenceUpdate }) => {
  const [activeTab, setActiveTab] = useState('executive');
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 5 Focused tabs for stakeholder intelligence
  const tabs = [
    { id: 'executive', name: 'Executive Summary', icon: '📊' },
    { id: 'competitors', name: 'Competitors', icon: '🎯' },
    { id: 'stakeholders', name: 'Stakeholders', icon: '👥' },
    { id: 'trending', name: 'Trending Topics', icon: '🔥' },
    { id: 'cascade', name: 'Cascade Predictions', icon: '🌊' }
  ];

  useEffect(() => {
    if (organization) {
      fetchStakeholderIntelligence();
    }
  }, [organization]);

  const fetchStakeholderIntelligence = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get complete stakeholder profile from onboarding
      const completeProfile = cacheManager.getCompleteProfile() || organization;
      
      if (!completeProfile.stakeholders) {
        // Ensure we have stakeholders from onboarding
        completeProfile.stakeholders = {
          competitors: organization.competitors || [],
          regulators: organization.regulators || [],
          media_outlets: organization.media_outlets || [],
          investors: organization.investors || [],
          analysts: organization.analysts || [],
          activists: organization.activists || []
        };
      }

      console.log('🎯 Fetching intelligence for stakeholders:', completeProfile.stakeholders);

      // Use orchestrator to get intelligence on ALL stakeholder types
      const result = await intelligenceOrchestratorV3.orchestrate(completeProfile);
      
      if (result.success) {
        const processedIntelligence = processIntelligenceForDisplay(result);
        setIntelligence(processedIntelligence);
        
        // Pass intelligence to Opportunity Engine
        if (onIntelligenceUpdate) {
          onIntelligenceUpdate(processedIntelligence);
        }
        
        // Cache for opportunity detection
        cacheManager.saveSynthesis(processedIntelligence);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Intelligence fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processIntelligenceForDisplay = (rawIntelligence) => {
    // Structure intelligence for 5 focused tabs
    return {
      executive: generateExecutiveSummary(rawIntelligence),
      competitors: extractCompetitorIntelligence(rawIntelligence),
      stakeholders: extractStakeholderIntelligence(rawIntelligence),
      trending: extractTrendingTopics(rawIntelligence),
      cascade: generateCascadePredictions(rawIntelligence),
      raw: rawIntelligence // Keep raw data for opportunity detection
    };
  };

  const generateExecutiveSummary = (intel) => {
    const actions = intel.entity_actions?.all || [];
    const trends = intel.topic_trends?.all || [];
    
    return {
      headline: `${actions.length} stakeholder actions | ${trends.length} trending topics`,
      keyFindings: [
        actions.length > 0 ? `${actions[0].entity}: ${actions[0].action}` : 'No significant activity',
        trends.length > 0 ? `${trends[0].topic} trending (${trends[0].mentions} mentions)` : 'No trends detected'
      ],
      prImplications: [
        actions.filter(a => a.type === 'competitor').length > 0 ? 
          'Competitor activity requires response' : null,
        trends.filter(t => t.trend === 'increasing').length > 0 ?
          'Trending topics present thought leadership opportunity' : null
      ].filter(Boolean),
      metrics: {
        stakeholdersMonitored: new Set(actions.map(a => a.entity)).size,
        actionsDetected: actions.length,
        trendsIdentified: trends.length,
        urgentItems: actions.filter(a => a.impact === 'high').length
      }
    };
  };

  const extractCompetitorIntelligence = (intel) => {
    const competitorActions = intel.entity_actions?.all?.filter(a => 
      a.type === 'competitor' || a.relevance > 0.7
    ) || [];
    
    return {
      recentMoves: competitorActions.map(action => ({
        competitor: action.entity,
        action: action.action,
        source: action.source,
        timestamp: action.timestamp,
        impact: action.impact,
        prResponse: `Position against ${action.entity}'s ${action.action}`
      })),
      analysis: {
        whatHappened: competitorActions.map(a => `${a.entity}: ${a.action}`),
        whatItMeans: analyzeCompetitorImplications(competitorActions),
        prImplications: generatePRResponses(competitorActions)
      }
    };
  };

  const extractStakeholderIntelligence = (intel) => {
    const stakeholderActions = intel.entity_actions?.all || [];
    
    // Group by stakeholder type
    const grouped = {
      media: stakeholderActions.filter(a => a.type === 'media'),
      regulators: stakeholderActions.filter(a => a.type === 'regulator'),
      investors: stakeholderActions.filter(a => a.type === 'investor'),
      analysts: stakeholderActions.filter(a => a.type === 'analyst'),
      activists: stakeholderActions.filter(a => a.type === 'activist')
    };
    
    return {
      byType: grouped,
      analysis: {
        mediaActivity: grouped.media.length > 0 ? 
          'Media actively covering industry' : 'Low media activity',
        regulatoryRisk: grouped.regulators.length > 0 ?
          'Regulatory attention detected' : 'No regulatory concerns',
        investorSentiment: grouped.investors.length > 0 ?
          'Investor activity noted' : 'Stable investor environment'
      },
      prImplications: {
        media: grouped.media.length > 0 ? 
          'Opportunity for media engagement' : 'Need to generate media interest',
        regulatory: grouped.regulators.length > 0 ?
          'Prepare regulatory messaging' : 'Maintain compliance messaging',
        investors: 'Keep investor relations informed'
      }
    };
  };

  const extractTrendingTopics = (intel) => {
    const trends = intel.topic_trends?.all || [];
    
    return {
      topics: trends.map(trend => ({
        topic: trend.topic,
        momentum: trend.trend,
        mentions: trend.mentions,
        sources: trend.sources || [],
        opportunity: `Lead conversation on ${trend.topic}`,
        prAngle: `Position as thought leader on ${trend.topic}`
      })),
      analysis: {
        hotTopics: trends.filter(t => t.mentions > 10).map(t => t.topic),
        emergingThemes: trends.filter(t => t.trend === 'increasing').map(t => t.topic),
        decliningInterest: trends.filter(t => t.trend === 'decreasing').map(t => t.topic)
      }
    };
  };

  const generateCascadePredictions = (intel) => {
    const actions = intel.entity_actions?.all || [];
    const trends = intel.topic_trends?.all || [];
    
    const predictions = [];
    
    // Predict based on competitor actions
    actions.filter(a => a.type === 'competitor' && a.impact === 'high').forEach(action => {
      predictions.push({
        trigger: `${action.entity}'s ${action.action}`,
        immediate: 'Media will seek industry response (24-48 hrs)',
        nearTerm: 'Other competitors likely to follow (1-2 weeks)',
        longTerm: 'Market dynamics may shift (1-3 months)',
        prStrategy: 'Get ahead with differentiated messaging now'
      });
    });
    
    // Predict based on trends
    trends.filter(t => t.trend === 'increasing' && t.mentions > 5).forEach(trend => {
      predictions.push({
        trigger: `${trend.topic} trending`,
        immediate: 'Media seeking expert commentary (now)',
        nearTerm: 'Topic will peak in 3-5 days',
        longTerm: 'Will become industry standard discussion',
        prStrategy: 'Establish thought leadership immediately'
      });
    });
    
    return {
      predictions,
      analysis: {
        immediateOpportunities: predictions.filter(p => p.immediate).length,
        strategicWindows: predictions.map(p => p.trigger)
      }
    };
  };

  const analyzeCompetitorImplications = (actions) => {
    if (actions.length === 0) return 'No significant competitive threats';
    
    const implications = [];
    if (actions.some(a => a.impact === 'high')) {
      implications.push('High-impact competitive moves require immediate response');
    }
    if (actions.length > 3) {
      implications.push('Multiple competitors active - market dynamics shifting');
    }
    return implications.join('. ');
  };

  const generatePRResponses = (actions) => {
    return actions.slice(0, 3).map(a => 
      `Develop messaging to counter ${a.entity}'s ${a.action}`
    );
  };

  const renderTab = () => {
    if (!intelligence) return <div>No intelligence data available</div>;
    
    switch(activeTab) {
      case 'executive':
        return renderExecutiveSummary();
      case 'competitors':
        return renderCompetitorsSummary();
      case 'stakeholders':
        return renderStakeholdersSummary();
      case 'trending':
        return renderTrendingTopics();
      case 'cascade':
        return renderCascadePredictions();
      default:
        return <div>Select a tab</div>;
    }
  };

  const renderExecutiveSummary = () => {
    const data = intelligence.executive;
    return (
      <div className="executive-summary-clean">
        <h2>{data.headline}</h2>
        
        <div className="key-metrics">
          <div className="metric">
            <span className="value">{data.metrics.stakeholdersMonitored}</span>
            <span className="label">Stakeholders</span>
          </div>
          <div className="metric">
            <span className="value">{data.metrics.actionsDetected}</span>
            <span className="label">Actions</span>
          </div>
          <div className="metric">
            <span className="value">{data.metrics.trendsIdentified}</span>
            <span className="label">Trends</span>
          </div>
          <div className="metric urgent">
            <span className="value">{data.metrics.urgentItems}</span>
            <span className="label">Urgent</span>
          </div>
        </div>
        
        <div className="key-findings">
          <h3>Key Findings</h3>
          {data.keyFindings.map((finding, idx) => (
            <div key={idx} className="finding">{finding}</div>
          ))}
        </div>
        
        {data.prImplications.length > 0 && (
          <div className="pr-implications">
            <h3>PR Implications</h3>
            {data.prImplications.map((implication, idx) => (
              <div key={idx} className="implication">• {implication}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCompetitorsSummary = () => {
    const data = intelligence.competitors;
    return (
      <div className="competitors-summary">
        <h2>Competitor Intelligence</h2>
        
        <div className="recent-moves">
          <h3>Recent Competitor Activity</h3>
          {data.recentMoves.length > 0 ? (
            data.recentMoves.map((move, idx) => (
              <div key={idx} className="competitor-move">
                <div className="move-header">
                  <span className="competitor-name">{move.competitor}</span>
                  <span className="move-impact">{move.impact}</span>
                </div>
                <div className="move-action">{move.action}</div>
                <div className="move-response">PR Response: {move.prResponse}</div>
              </div>
            ))
          ) : (
            <div>No recent competitor activity detected</div>
          )}
        </div>
        
        <div className="analysis-section">
          <h3>Analysis</h3>
          <div className="analysis-item">
            <strong>What Happened:</strong>
            {data.analysis.whatHappened.join('; ') || 'No activity'}
          </div>
          <div className="analysis-item">
            <strong>What It Means:</strong>
            {data.analysis.whatItMeans}
          </div>
          <div className="analysis-item">
            <strong>PR Implications:</strong>
            {data.analysis.prImplications.join('; ')}
          </div>
        </div>
      </div>
    );
  };

  const renderStakeholdersSummary = () => {
    const data = intelligence.stakeholders;
    return (
      <div className="stakeholders-summary">
        <h2>Stakeholder Activity</h2>
        
        {Object.entries(data.byType).map(([type, actions]) => (
          <div key={type} className="stakeholder-group">
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            {actions.length > 0 ? (
              actions.slice(0, 3).map((action, idx) => (
                <div key={idx} className="stakeholder-action">
                  {action.entity}: {action.action}
                </div>
              ))
            ) : (
              <div className="no-activity">No {type} activity</div>
            )}
          </div>
        ))}
        
        <div className="stakeholder-analysis">
          <h3>PR Implications</h3>
          {Object.entries(data.prImplications).map(([type, implication]) => (
            <div key={type} className="implication">
              <strong>{type}:</strong> {implication}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrendingTopics = () => {
    const data = intelligence.trending;
    return (
      <div className="trending-topics">
        <h2>Trending Topics</h2>
        
        {data.topics.map((topic, idx) => (
          <div key={idx} className="trending-topic">
            <div className="topic-header">
              <span className="topic-name">{topic.topic}</span>
              <span className="topic-mentions">{topic.mentions} mentions</span>
              <span className={`momentum ${topic.momentum}`}>{topic.momentum}</span>
            </div>
            <div className="pr-angle">PR Angle: {topic.prAngle}</div>
          </div>
        ))}
        
        <div className="trending-analysis">
          <h3>Analysis</h3>
          <div>Hot Topics: {data.analysis.hotTopics.join(', ') || 'None'}</div>
          <div>Emerging: {data.analysis.emergingThemes.join(', ') || 'None'}</div>
        </div>
      </div>
    );
  };

  const renderCascadePredictions = () => {
    const data = intelligence.cascade;
    return (
      <div className="cascade-predictions">
        <h2>Cascade Predictions</h2>
        
        {data.predictions.map((prediction, idx) => (
          <div key={idx} className="cascade-prediction">
            <div className="trigger">Trigger: {prediction.trigger}</div>
            <div className="timeline">
              <div className="immediate">→ Immediate: {prediction.immediate}</div>
              <div className="near-term">→ Near Term: {prediction.nearTerm}</div>
              <div className="long-term">→ Long Term: {prediction.longTerm}</div>
            </div>
            <div className="strategy">Strategy: {prediction.prStrategy}</div>
          </div>
        ))}
        
        {data.predictions.length === 0 && (
          <div>No cascade effects predicted</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="intelligence-hub loading">
        <div className="loading-spinner"></div>
        <div>Gathering stakeholder intelligence...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intelligence-hub error">
        <div>Error: {error}</div>
        <button onClick={fetchStakeholderIntelligence}>Retry</button>
      </div>
    );
  }

  return (
    <div className="intelligence-hub-v5">
      <div className="hub-header">
        <h1>Intelligence Hub</h1>
        <button onClick={fetchStakeholderIntelligence} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>
      
      <div className="hub-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>
      
      <div className="hub-content">
        {renderTab()}
      </div>
    </div>
  );
};

export default IntelligenceHubV5;