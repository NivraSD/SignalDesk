import React from 'react';
import './IntelligenceDisplayV3.css';

const CleanIntelligenceDisplay = ({ intelligence, activeTab }) => {
  if (!intelligence?.tabs) {
    return <div className="no-data">No intelligence data available</div>;
  }
  
  const tabData = intelligence.tabs[activeTab];
  if (!tabData) {
    return <div className="no-data">No data for this tab</div>;
  }
  
  // Executive Summary - Clean and structured
  if (activeTab === 'executive') {
    return (
      <div className="clean-executive-tab">
        <div className="executive-metrics">
          <div className="metric">
            <span className="metric-value">{tabData.key_metrics?.entities_tracked || 0}</span>
            <span className="metric-label">Entities</span>
          </div>
          <div className="metric">
            <span className="metric-value">{tabData.key_metrics?.actions_captured || 0}</span>
            <span className="metric-label">Actions</span>
          </div>
          <div className="metric">
            <span className="metric-value">{tabData.key_metrics?.trends_identified || 0}</span>
            <span className="metric-label">Trends</span>
          </div>
          <div className="metric">
            <span className="metric-value">{tabData.key_metrics?.opportunities || 0}</span>
            <span className="metric-label">Opportunities</span>
          </div>
        </div>
        
        <div className="executive-overview">
          <h3>Overview</h3>
          <p>{tabData.overview}</p>
        </div>
        
        {tabData.top_actions && tabData.top_actions.length > 0 && (
          <div className="top-actions">
            <h3>Key Actions</h3>
            {tabData.top_actions.map((action, idx) => (
              <div key={idx} className="action-item">
                <span className="entity">{action.entity}:</span>
                <span className="action">{action.action}</span>
                <span className={`impact ${action.impact}`}>{action.impact}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Competitive Intelligence - Just the data
  if (activeTab === 'competitive') {
    return (
      <div className="clean-competitive-tab">
        <div className="tab-summary">{tabData.summary}</div>
        {tabData.competitor_actions && tabData.competitor_actions.length > 0 ? (
          <div className="competitor-actions">
            {tabData.competitor_actions.map((action, idx) => (
              <div key={idx} className="competitor-action">
                <div className="action-header">
                  <span className="competitor-name">{action.entity}</span>
                  <span className="action-time">{new Date(action.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="action-content">{action.action}</div>
                <div className="action-meta">
                  <span className="source">{action.source}</span>
                  {action.url && action.url !== '#' && (
                    <a href={action.url} target="_blank" rel="noopener noreferrer">Source</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No competitive actions detected</div>
        )}
      </div>
    );
  }
  
  // Market Trends - Clean list
  if (activeTab === 'market') {
    return (
      <div className="clean-market-tab">
        <div className="tab-summary">{tabData.summary}</div>
        {tabData.market_trends && tabData.market_trends.length > 0 ? (
          <div className="market-trends">
            {tabData.market_trends.map((trend, idx) => (
              <div key={idx} className="trend-item">
                <div className="trend-topic">{trend.topic}</div>
                <div className="trend-stats">
                  <span className="mentions">{trend.mentions} mentions</span>
                  <span className={`trend-direction ${trend.trend}`}>{trend.trend}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No trends detected</div>
        )}
      </div>
    );
  }
  
  // Positioning - SWOT style
  if (activeTab === 'positioning') {
    return (
      <div className="clean-positioning-tab">
        <div className="positioning-grid">
          <div className="position-quadrant strengths">
            <h3>Strengths</h3>
            {tabData.strengths?.map((s, idx) => (
              <div key={idx}>{s}</div>
            ))}
          </div>
          <div className="position-quadrant vulnerabilities">
            <h3>Vulnerabilities</h3>
            {tabData.vulnerabilities?.map((v, idx) => (
              <div key={idx}>{v}</div>
            ))}
          </div>
          <div className="position-quadrant opportunities">
            <h3>Opportunities</h3>
            {tabData.opportunities?.map((o, idx) => (
              <div key={idx}>{o}</div>
            ))}
          </div>
          <div className="position-quadrant threats">
            <h3>Threats</h3>
            {tabData.threats?.map((t, idx) => (
              <div key={idx}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Between the Lines
  if (activeTab === 'between') {
    return (
      <div className="clean-between-tab">
        {tabData.patterns && tabData.patterns.length > 0 && (
          <div className="section">
            <h3>Patterns Detected</h3>
            {tabData.patterns.map((p, idx) => (
              <div key={idx} className="pattern-item">• {p}</div>
            ))}
          </div>
        )}
        {tabData.implications && tabData.implications.length > 0 && (
          <div className="section">
            <h3>Implications</h3>
            {tabData.implications.map((i, idx) => (
              <div key={idx} className="implication-item">• {i}</div>
            ))}
          </div>
        )}
        {tabData.hidden_risks && tabData.hidden_risks.length > 0 && (
          <div className="section">
            <h3>Hidden Risks</h3>
            {tabData.hidden_risks.map((r, idx) => (
              <div key={idx} className="risk-item">⚠️ {r}</div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Regulatory
  if (activeTab === 'regulatory') {
    return (
      <div className="clean-regulatory-tab">
        <div className="compliance-status">{tabData.compliance_status}</div>
        {tabData.developments && tabData.developments.length > 0 ? (
          <div className="regulatory-developments">
            {tabData.developments.map((dev, idx) => (
              <div key={idx} className="development">
                <span className="regulator">{dev.regulator}:</span>
                <span className="action">{dev.action}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No regulatory developments</div>
        )}
      </div>
    );
  }
  
  // Thought Leadership
  if (activeTab === 'thought') {
    return (
      <div className="clean-thought-tab">
        {tabData.topics && tabData.topics.length > 0 ? (
          <div className="thought-topics">
            {tabData.topics.map((topic, idx) => (
              <div key={idx} className="thought-topic">
                <div className="topic-name">{topic.topic}</div>
                <div className="topic-opportunity">{topic.opportunity}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No thought leadership opportunities</div>
        )}
      </div>
    );
  }
  
  // Forward Looking
  if (activeTab === 'forward') {
    return (
      <div className="clean-forward-tab">
        <div className="timeline">
          <div className="time-period">
            <h4>Next 24 Hours</h4>
            <p>{tabData.next_24h}</p>
          </div>
          <div className="time-period">
            <h4>Next 7 Days</h4>
            <p>{tabData.next_7d}</p>
          </div>
          <div className="time-period">
            <h4>Next 30 Days</h4>
            <p>{tabData.next_30d}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Default fallback
  return (
    <div className="tab-content">
      <pre>{JSON.stringify(tabData, null, 2)}</pre>
    </div>
  );
};

export default CleanIntelligenceDisplay;