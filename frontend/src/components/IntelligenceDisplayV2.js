import React, { useState, useEffect } from 'react';
import './IntelligenceDisplay.css';
import claudeIntelligenceServiceV2 from '../services/claudeIntelligenceServiceV2';
import { CompetitorIcon, StakeholderIcon, MediaIcon, PredictiveIcon, RocketIcon, ScanIcon, AnalyzeIcon, SynthesizeIcon } from './Icons/NeonIcons';

const IntelligenceDisplayV2 = ({ organizationId, timeframe = '24h', refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [activeTab, setActiveTab] = useState('competitor');
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
    { id: 'competitor', name: 'Competitive PR', Icon: CompetitorIcon, color: '#ff00ff' },
    { id: 'stakeholder', name: 'Stakeholder Relations', Icon: StakeholderIcon, color: '#00ffcc' },
    { id: 'narrative', name: 'Media Narrative', Icon: MediaIcon, color: '#00ff88' },
    { id: 'predictive', name: 'PR Predictions', Icon: PredictiveIcon, color: '#8800ff' }
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