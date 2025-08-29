import React, { useState, useEffect } from 'react';
import './IntelligenceDisplay.css';
import claudeIntelligenceServiceV2 from '../services/claudeIntelligenceServiceV2';

const IntelligenceDisplay = ({ organizationId }) => {
  const [loading, setLoading] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [activeTab, setActiveTab] = useState('competitors');
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    fetchIntelligence();
  }, [timeframe]);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
      console.log('🎯 Fetching intelligence for Railway V2...');
      const intelligence = await claudeIntelligenceServiceV2.gatherAndAnalyze(config, timeframe, { forceRefresh: true });
      console.log('✅ Intelligence received:', intelligence);
      console.log('🔍 Competitor data:', intelligence?.competitor);
      console.log('🔍 Stakeholder data:', intelligence?.stakeholder);
      console.log('🔍 Executive summary:', intelligence?.executive_summary);
      setIntelligenceData(intelligence);
    } catch (err) {
      console.error('❌ Intelligence fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'competitors', name: 'Competitors', icon: '⚔️', color: '#ff00ff' },
    { id: 'stakeholders', name: 'Stakeholders', icon: '👥', color: '#00ffcc' },
    { id: 'narrative', name: 'Narrative', icon: '📊', color: '#00ff88' },
    { id: 'predictive', name: 'Predictive', icon: '🔮', color: '#8800ff' }
  ];

  const renderCompetitorIntelligence = () => {
    const data = intelligenceData?.competitor || {};
    
    // Debug: Show raw data if no formatted movements
    if (!data.key_movements || data.key_movements.length === 0) {
      return (
        <div className="intelligence-section">
          <div className="debug-panel">
            <h3>📊 Raw Competitor Intelligence Data</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      );
    }
    
    return (
      <div className="intelligence-section">
        <div className="intel-cards">
          {data.key_movements?.map((movement, idx) => (
            <div key={idx} className="intel-card competitor-card">
              <div className="card-header">
                <span className="card-icon">⚡</span>
                <h3>{movement.competitor}</h3>
                <span className={`threat-level ${movement.threat_level?.toLowerCase()}`}>
                  {movement.threat_level}
                </span>
              </div>
              <div className="card-body">
                <h4>{movement.action}</h4>
                <p>{movement.impact_on_goals}</p>
                {movement.opportunity && (
                  <div className="opportunity-box">
                    <span className="opp-label">Opportunity:</span>
                    <span className="opp-text">{movement.opportunity}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.recommended_actions && (
          <div className="actions-panel">
            <h3>📋 Recommended Actions</h3>
            <ul className="action-list">
              {data.recommended_actions.map((action, idx) => (
                <li key={idx} className="action-item">
                  <span className="action-number">{idx + 1}</span>
                  <span className="action-text">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderStakeholderIntelligence = () => {
    const data = intelligenceData?.stakeholder || {};
    return (
      <div className="intelligence-section">
        <div className="stakeholder-grid">
          {data.stakeholder_map?.map((stakeholder, idx) => (
            <div key={idx} className="stakeholder-item">
              <div className="stakeholder-header">
                <h4>{stakeholder.group}</h4>
                <span className={`sentiment sentiment-${stakeholder.sentiment?.toLowerCase()}`}>
                  {stakeholder.sentiment}
                </span>
              </div>
              <div className="stakeholder-metrics">
                <div className="metric">
                  <span className="metric-label">Influence</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill" 
                      style={{ width: `${stakeholder.influence_level * 20}%` }}
                    ></div>
                  </div>
                </div>
                <div className="engagement-priority">
                  {stakeholder.engagement_priority}
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.immediate_actions && (
          <div className="immediate-actions">
            <h3>⚡ Immediate Actions</h3>
            {data.immediate_actions.map((action, idx) => (
              <div key={idx} className="immediate-action-item">
                {action}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNarrativeIntelligence = () => {
    const data = intelligenceData?.narrative || {};
    return (
      <div className="intelligence-section">
        <div className="narrative-insights">
          {data.messaging_recommendations?.map((msg, idx) => (
            <div key={idx} className="narrative-card">
              <div className="narrative-icon">💬</div>
              <div className="narrative-content">
                <p>{msg}</p>
              </div>
            </div>
          ))}
        </div>

        {data.whitespace_opportunities && (
          <div className="whitespace-panel">
            <h3>🎯 Whitespace Opportunities</h3>
            <div className="whitespace-grid">
              {data.whitespace_opportunities.map((opp, idx) => (
                <div key={idx} className="whitespace-item">
                  {opp}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPredictiveIntelligence = () => {
    const data = intelligenceData?.predictive || {};
    return (
      <div className="intelligence-section">
        <div className="predictive-grid">
          {data.predicted_competitor_moves?.map((move, idx) => (
            <div key={idx} className="prediction-card">
              <div className="prediction-header">
                <span className="prediction-icon">🔮</span>
                <h4>Predicted Move</h4>
              </div>
              <p>{move}</p>
            </div>
          ))}
        </div>

        {data.proactive_recommendations && (
          <div className="proactive-panel">
            <h3>🚀 Proactive Recommendations</h3>
            <div className="proactive-list">
              {data.proactive_recommendations.map((rec, idx) => (
                <div key={idx} className="proactive-item">
                  <span className="proactive-number">{idx + 1}</span>
                  <span className="proactive-text">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'competitors':
        return renderCompetitorIntelligence();
      case 'stakeholders':
        return renderStakeholderIntelligence();
      case 'narrative':
        return renderNarrativeIntelligence();
      case 'predictive':
        return renderPredictiveIntelligence();
      default:
        return renderCompetitorIntelligence();
    }
  };

  // Show raw data for debugging
  if (intelligenceData && !intelligenceData.competitor?.key_movements?.length) {
    return (
      <div className="intelligence-display">
        <div className="debug-panel">
          <h3>🔍 Intelligence Data Structure (Debug View)</h3>
          <p>Data is being fetched but may not be in expected format. Raw data:</p>
          <pre>{JSON.stringify(intelligenceData, null, 2).substring(0, 2000)}...</pre>
          <button onClick={fetchIntelligence} className="refresh-btn">
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="intelligence-display">
      {/* Tab Navigation */}
      <div className="intel-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`intel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--tab-color': tab.color }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
        
        <div className="timeframe-selector">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="intel-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Gathering intelligence...</p>
          </div>
        ) : intelligenceData ? (
          renderContent()
        ) : (
          <div className="empty-state">
            <p>No intelligence data available</p>
            <button onClick={fetchIntelligence} className="refresh-btn">
              Refresh Intelligence
            </button>
          </div>
        )}
      </div>

      {/* Executive Summary */}
      {intelligenceData?.executive_summary && (
        <div className="executive-summary">
          <h3>📊 Executive Summary</h3>
          <div className="summary-content">
            {intelligenceData.executive_summary.key_insight && (
              <div className="key-insight">
                <span className="insight-label">Key Insight:</span>
                <p>{intelligenceData.executive_summary.key_insight}</p>
              </div>
            )}
            {intelligenceData.executive_summary.immediate_priorities && (
              <div className="priorities">
                <span className="priority-label">Immediate Priorities:</span>
                <ol>
                  {intelligenceData.executive_summary.immediate_priorities.map((priority, idx) => (
                    <li key={idx}>{priority}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceDisplay;