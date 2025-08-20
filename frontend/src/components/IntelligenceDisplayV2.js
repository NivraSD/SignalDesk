import React, { useState, useEffect } from 'react';
import './IntelligenceDisplay.css';
import claudeIntelligenceServiceV2 from '../services/claudeIntelligenceServiceV2';

const IntelligenceDisplayV2 = ({ organizationId }) => {
  const [loading, setLoading] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [activeTab, setActiveTab] = useState('competitor');
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    fetchIntelligence();
  }, [timeframe]);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
      console.log('🎯 Fetching PR intelligence...');
      const intelligence = await claudeIntelligenceServiceV2.gatherAndAnalyze(config, timeframe, { forceRefresh: true });
      console.log('✅ Intelligence received:', intelligence);
      setIntelligenceData(intelligence);
    } catch (err) {
      console.error('❌ Intelligence fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'competitor', name: 'Competitive PR', icon: '⚔️', color: '#ff00ff' },
    { id: 'stakeholder', name: 'Stakeholder Relations', icon: '👥', color: '#00ffcc' },
    { id: 'narrative', name: 'Media Narrative', icon: '📰', color: '#00ff88' },
    { id: 'predictive', name: 'PR Predictions', icon: '🔮', color: '#8800ff' }
  ];

  const renderAnalysis = (analysisData, type) => {
    if (!analysisData) {
      return (
        <div className="intelligence-section">
          <div className="empty-state">
            <p>No {type} intelligence available yet</p>
          </div>
        </div>
      );
    }

    // Handle different analysis structures
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
    const data = intelligenceData?.[activeTab];
    return renderAnalysis(data, activeTab);
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
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>
        
        <div className="intel-controls">
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
          <button onClick={fetchIntelligence} className="refresh-btn" disabled={loading}>
            {loading ? '⌛' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="intel-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Synthesizing PR intelligence from multiple sources...</p>
            <p className="loading-sub">This may take 30-60 seconds for comprehensive analysis</p>
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