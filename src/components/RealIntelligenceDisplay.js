import React from 'react';
import './RealIntelligenceDisplay.css';

const RealIntelligenceDisplay = ({ intelligence, tab }) => {
  // Helper to determine data quality
  const getQualityIndicator = (item) => {
    if (!item) return { class: 'no-data', label: 'No Data', color: '#666' };
    
    const relevance = item.relevance || 0;
    const hasRealSource = item.source && !item.source.includes('Analysis') && !item.source.includes('Industry');
    const hasUrl = item.url && item.url !== '#';
    
    if (relevance >= 0.8 && hasRealSource && hasUrl) {
      return { class: 'high-quality', label: 'HIGH', color: '#00ff88' };
    } else if (relevance >= 0.5 && hasRealSource) {
      return { class: 'medium-quality', label: 'MED', color: '#ffcc00' };
    } else if (hasRealSource || hasUrl) {
      return { class: 'low-quality', label: 'LOW', color: '#ff8800' };
    } else {
      return { class: 'simulated', label: 'SIM', color: '#ff0088' };
    }
  };

  // Helper to get source icon
  const getSourceIcon = (source) => {
    if (!source) return '❓';
    const sourceLower = source.toLowerCase();
    
    if (sourceLower.includes('reuters') || sourceLower.includes('bloomberg')) return '📰';
    if (sourceLower.includes('techcrunch') || sourceLower.includes('verge')) return '💻';
    if (sourceLower.includes('twitter') || sourceLower.includes('x.com')) return '𝕏';
    if (sourceLower.includes('linkedin')) return '💼';
    if (sourceLower.includes('reddit')) return '🔗';
    if (sourceLower.includes('youtube')) return '📺';
    if (sourceLower.includes('analysis') || sourceLower.includes('market')) return '📊';
    return '🌐';
  };

  // Render competitive intelligence items
  const renderCompetitorActions = (actions) => {
    if (!actions || actions.length === 0) {
      return (
        <div className="no-intelligence">
          <p>🔍 No real competitor intelligence available</p>
          <p className="refresh-hint">Intelligence updates every 30 minutes</p>
        </div>
      );
    }

    // Filter out simulated data
    const realActions = actions.filter(a => 
      a.source && 
      !a.source.includes('Market Analysis') && 
      a.url && 
      a.url !== '#'
    );

    if (realActions.length === 0) {
      return (
        <div className="no-intelligence">
          <p>⏳ Gathering real-time intelligence...</p>
          <p className="refresh-hint">No simulated data shown</p>
        </div>
      );
    }

    return (
      <div className="real-intelligence-items">
        {realActions.map((action, idx) => {
          const quality = getQualityIndicator(action);
          return (
            <div key={idx} className={`intelligence-item ${quality.class}`}>
              <div className="item-header">
                <div className="item-entity">
                  <span className="entity-name">{action.entity || 'Unknown'}</span>
                  <span className="quality-badge" style={{ backgroundColor: quality.color }}>
                    {quality.label}
                  </span>
                  {action.relevance && (
                    <span className="relevance-score">
                      {Math.round(action.relevance * 100)}%
                    </span>
                  )}
                </div>
                <div className="item-meta">
                  <span className="source-icon">{getSourceIcon(action.source)}</span>
                  <span className="source-name">{action.source}</span>
                  {action.timestamp && (
                    <span className="timestamp">
                      {new Date(action.timestamp).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="item-content">
                <div className="item-action">{action.action}</div>
                {action.description && (
                  <div className="item-description">{action.description}</div>
                )}
              </div>
              
              <div className="item-footer">
                {action.impact && (
                  <span className={`impact-badge impact-${action.impact}`}>
                    {action.impact.toUpperCase()} IMPACT
                  </span>
                )}
                {action.url && action.url !== '#' && (
                  <a href={action.url} target="_blank" rel="noopener noreferrer" 
                     className="source-link">
                    View Source →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render market trends
  const renderMarketTrends = (trends) => {
    if (!trends || trends.length === 0) {
      return (
        <div className="no-intelligence">
          <p>📈 No market trends detected</p>
        </div>
      );
    }

    return (
      <div className="trend-grid">
        {trends.map((trend, idx) => (
          <div key={idx} className="trend-card">
            <div className="trend-header">
              <h4>{trend.topic}</h4>
              <span className={`trend-direction trend-${trend.trend}`}>
                {trend.trend === 'increasing' ? '↑' : trend.trend === 'decreasing' ? '↓' : '→'}
              </span>
            </div>
            {trend.mentions && (
              <div className="trend-mentions">{trend.mentions} mentions</div>
            )}
            {trend.sentiment && (
              <div className={`trend-sentiment sentiment-${trend.sentiment}`}>
                Sentiment: {trend.sentiment}
              </div>
            )}
            {trend.key_developments && trend.key_developments.length > 0 && (
              <div className="trend-developments">
                {trend.key_developments.slice(0, 3).map((dev, i) => (
                  <div key={i} className="development">• {dev}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Main render based on tab type
  switch (tab) {
    case 'competitive':
      return renderCompetitorActions(intelligence?.tabs?.competitive?.competitor_actions);
    
    case 'market':
      return renderMarketTrends(intelligence?.tabs?.market?.market_trends);
    
    case 'positioning':
      return (
        <div className="positioning-content">
          {intelligence?.tabs?.positioning?.competitor_moves && 
            renderCompetitorActions(intelligence.tabs.positioning.competitor_moves)}
        </div>
      );
    
    default:
      return (
        <div className="intelligence-stats">
          <h3>Intelligence Quality Metrics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">
                {intelligence?.statistics?.actions_captured || 0}
              </div>
              <div className="stat-label">Real Actions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {intelligence?.statistics?.entities_tracked || 0}
              </div>
              <div className="stat-label">Entities Tracked</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {intelligence?.statistics?.topics_monitored || 0}
              </div>
              <div className="stat-label">Topics Monitored</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {intelligence?.statistics?.critical_items || 0}
              </div>
              <div className="stat-label">Critical Items</div>
            </div>
          </div>
        </div>
      );
  }
};

export default RealIntelligenceDisplay;