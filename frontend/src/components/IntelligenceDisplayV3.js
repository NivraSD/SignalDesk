import React, { useState, useEffect } from 'react';
import './IntelligenceDisplayV3.css';
import intelligenceOrchestratorV3 from '../services/intelligenceOrchestratorV3';
import { 
  RocketIcon, AlertIcon, TrendingUpIcon, TargetIcon, 
  ChartIcon, BuildingIcon
} from './Icons/NeonIcons';

const IntelligenceDisplayV3 = ({ organization, refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [intelligence, setIntelligence] = useState(null);
  const [activeTab, setActiveTab] = useState('executive');
  const [error, setError] = useState(null);

  console.log('🚀 IntelligenceDisplayV3 mounted with organization:', organization);

  useEffect(() => {
    console.log('📊 V3 useEffect triggered, organization:', organization);
    fetchIntelligence();
  }, [organization, refreshTrigger]);

  const fetchIntelligence = async () => {
    console.log('🔍 V3 fetchIntelligence called, organization:', organization);
    if (!organization?.name) {
      console.log('⚠️ No organization name, skipping fetch');
      // Try to get from localStorage as fallback
      const savedOrg = localStorage.getItem('signaldesk_onboarding');
      if (savedOrg) {
        const orgData = JSON.parse(savedOrg);
        console.log('📦 Found organization in localStorage:', orgData);
        if (orgData.organization?.name) {
          const result = await intelligenceOrchestratorV3.orchestrate(orgData.organization);
          if (result.success) {
            setIntelligence(result);
            if (!result.tabs?.[activeTab]) {
              setActiveTab('executive');
            }
          } else {
            setError(result.error);
          }
          setLoading(false);
          return;
        }
      }
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await intelligenceOrchestratorV3.orchestrate(organization);
      
      if (result.success) {
        setIntelligence(result);
        // Auto-switch to executive tab if current tab doesn't exist
        if (!result.tabs?.[activeTab]) {
          setActiveTab('executive');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'executive', name: 'Executive Brief', Icon: RocketIcon, color: '#ff00ff' },
    { id: 'entities', name: 'Entity Movements', Icon: TargetIcon, color: '#00ffcc' },
    { id: 'market', name: 'Market Dynamics', Icon: TrendingUpIcon, color: '#00ff88' },
    { id: 'strategy', name: 'Strategic Intel', Icon: ChartIcon, color: '#ffcc00' },
    { id: 'raw_intelligence', name: 'Raw Data', Icon: BuildingIcon, color: '#8800ff' }
  ];

  const renderExecutiveTab = (data) => {
    if (!data) return null;
    
    const urgencyColors = {
      immediate: '#ff0064',
      high: '#ff6600',
      medium: '#ffcc00',
      low: '#00ff88'
    };
    
    return (
      <div className="v3-executive-tab">
        <div className="executive-header">
          <div className="urgency-badge" style={{ backgroundColor: urgencyColors[data.urgency_level] }}>
            {data.urgency_level?.toUpperCase()}
          </div>
          {data.requires_action && (
            <div className="action-required-badge">
              <AlertIcon size={16} /> ACTION REQUIRED
            </div>
          )}
        </div>
        
        <h2 className="executive-headline">{data.headline}</h2>
        <p className="executive-summary">{data.summary}</p>
        
        {data.key_numbers && (
          <div className="key-numbers-grid">
            <div className="number-card">
              <div className="number">{data.key_numbers.entity_actions}</div>
              <div className="label">Entity Actions</div>
            </div>
            <div className="number-card critical">
              <div className="number">{data.key_numbers.critical_items}</div>
              <div className="label">Critical Items</div>
            </div>
            <div className="number-card">
              <div className="number">{data.key_numbers.hot_topics}</div>
              <div className="label">Hot Topics</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEntitiesTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-entities-tab">
        {data.competitor_actions?.length > 0 && (
          <div className="entity-section">
            <h3>Competitor Actions</h3>
            <div className="entity-cards">
              {data.competitor_actions.map((action, idx) => (
                <div key={idx} className="entity-action-card competitor">
                  <div className="entity-name">{action.entity}</div>
                  <div className="entity-action">{action.action}</div>
                  <div className="strategic-impact">{action.strategic_impact}</div>
                  {action.response_needed !== 'monitor only' && (
                    <div className="response-needed">{action.response_needed}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.regulatory_developments?.length > 0 && (
          <div className="entity-section">
            <h3>Regulatory Developments</h3>
            <div className="entity-cards">
              {data.regulatory_developments.map((dev, idx) => (
                <div key={idx} className="entity-action-card regulatory">
                  <div className="entity-name">{dev.entity}</div>
                  <div className="entity-action">{dev.development}</div>
                  <div className="compliance-impact">{dev.compliance_impact}</div>
                  <div className="timeline">{dev.timeline}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.stakeholder_positions?.length > 0 && (
          <div className="entity-section">
            <h3>Stakeholder Positions</h3>
            <div className="entity-cards">
              {data.stakeholder_positions.map((stake, idx) => (
                <div key={idx} className="entity-action-card stakeholder">
                  <div className="entity-name">{stake.entity}</div>
                  <div className="entity-position">{stake.position}</div>
                  <div className="influence-level">Influence: {stake.influence_level}</div>
                  <div className="engagement-strategy">{stake.engagement_strategy}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMarketTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-market-tab">
        {data.trending_opportunities?.length > 0 && (
          <div className="market-section">
            <h3>Trending Opportunities</h3>
            <div className="opportunity-cards">
              {data.trending_opportunities.map((opp, idx) => (
                <div key={idx} className="opportunity-card">
                  <div className="trend-name">{opp.trend}</div>
                  <div className="opportunity">{opp.opportunity}</div>
                  <div className="timing">Timing: {opp.timing}</div>
                  {opp.first_mover_advantage && (
                    <div className="first-mover">⚡ First Mover Advantage</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.emerging_risks?.length > 0 && (
          <div className="market-section">
            <h3>Emerging Risks</h3>
            <div className="risk-cards">
              {data.emerging_risks.map((risk, idx) => (
                <div key={idx} className={`risk-card probability-${risk.probability}`}>
                  <div className="risk-name">{risk.risk}</div>
                  <div className="risk-impact">{risk.impact}</div>
                  <div className="risk-probability">Probability: {risk.probability}</div>
                  <div className="mitigation">{risk.mitigation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStrategyTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-strategy-tab">
        {data.recommendations?.length > 0 && (
          <div className="recommendations-section">
            <h3>Strategic Recommendations</h3>
            <div className="recommendations-list">
              {data.recommendations.map((rec, idx) => (
                <div key={idx} className="recommendation-card">
                  <div className="priority-badge">Priority {rec.priority}</div>
                  <div className="action">{rec.action}</div>
                  <div className="rationale">{rec.rationale}</div>
                  <div className="meta">
                    <span className="owner">Owner: {rec.owner}</span>
                    <span className="timeline">Timeline: {rec.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.positioning && (
          <div className="positioning-section">
            <h3>Competitive Positioning</h3>
            <div className="positioning-card">
              <div className="position-status">
                <div className="label">Current Position</div>
                <div className="value">{data.positioning.current_position}</div>
              </div>
              <div className="position-metrics">
                <div className="metric">
                  <span>Narrative Control:</span>
                  <span className={`status ${data.positioning.narrative_control}`}>
                    {data.positioning.narrative_control}
                  </span>
                </div>
                <div className="metric">
                  <span>Momentum:</span>
                  <span className={`status ${data.positioning.momentum}`}>
                    {data.positioning.momentum}
                  </span>
                </div>
              </div>
              {data.positioning.key_advantages?.length > 0 && (
                <div className="advantages">
                  <h4>Key Advantages</h4>
                  <ul>
                    {data.positioning.key_advantages.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.positioning.vulnerabilities?.length > 0 && (
                <div className="vulnerabilities">
                  <h4>Vulnerabilities</h4>
                  <ul>
                    {data.positioning.vulnerabilities.map((vul, idx) => (
                      <li key={idx}>{vul}</li>
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

  const renderRawIntelligenceTab = (data) => {
    if (!data) return null;
    
    return (
      <div className="v3-raw-intelligence-tab">
        {data.actions?.length > 0 && (
          <div className="raw-section">
            <h3>Entity Actions (Raw)</h3>
            <div className="raw-items">
              {data.actions.map((action, idx) => (
                <div key={idx} className="raw-item">
                  <div className="raw-entity">{action.entity} ({action.entity_type})</div>
                  <div className="raw-action">{action.action}: {action.headline}</div>
                  <div className="raw-meta">
                    <span>{action.source}</span>
                    <span>{action.importance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.trends?.length > 0 && (
          <div className="raw-section">
            <h3>Topic Trends (Raw)</h3>
            <div className="raw-items">
              {data.trends.map((trend, idx) => (
                <div key={idx} className="raw-item">
                  <div className="raw-topic">{trend.topic}</div>
                  <div className="raw-momentum">
                    Momentum: {trend.momentum} ({trend.article_count} articles)
                  </div>
                  {trend.sample_headlines?.map((headline, hidx) => (
                    <div key={hidx} className="raw-headline">{headline}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    if (!intelligence?.tabs) return null;
    
    const tabData = intelligence.tabs[activeTab];
    
    switch (activeTab) {
      case 'executive':
        return renderExecutiveTab(tabData);
      case 'entities':
        return renderEntitiesTab(tabData);
      case 'market':
        return renderMarketTab(tabData);
      case 'strategy':
        return renderStrategyTab(tabData);
      case 'raw_intelligence':
        return renderRawIntelligenceTab(tabData);
      default:
        return <div>No data available for this tab</div>;
    }
  };

  if (loading) {
    return (
      <div className="intelligence-display-v3 loading">
        <div className="loading-spinner"></div>
        <p>Gathering intelligence with Claude 4...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intelligence-display-v3 error">
        <AlertIcon size={24} color="#ff0064" />
        <p>Intelligence gathering failed: {error}</p>
        <button onClick={fetchIntelligence}>Retry</button>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className="intelligence-display-v3 empty">
        <p>No intelligence data available</p>
      </div>
    );
  }

  return (
    <div className="intelligence-display-v3">
      {intelligence.alerts?.length > 0 && (
        <div className="critical-alerts-bar">
          <AlertIcon size={20} />
          <span>{intelligence.alerts.length} Critical Alert{intelligence.alerts.length > 1 ? 's' : ''}</span>
        </div>
      )}
      
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--tab-color': tab.color }}
          >
            <tab.Icon size={18} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
      
      <div className="intelligence-footer">
        <div className="statistics">
          <span>Entities: {intelligence.statistics?.entities_tracked || 0}</span>
          <span>Actions: {intelligence.statistics?.actions_captured || 0}</span>
          <span>Topics: {intelligence.statistics?.topics_monitored || 0}</span>
          <span>Critical: {intelligence.statistics?.critical_items || 0}</span>
        </div>
        <div className="timestamp">
          Last updated: {new Date(intelligence.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceDisplayV3;