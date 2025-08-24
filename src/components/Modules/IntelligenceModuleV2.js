import React, { useState, useEffect } from 'react';
import './IntelligenceModuleV2.css';

const IntelligenceModuleV2 = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [intelligenceData, setIntelligenceData] = useState({
    organization: null,
    trackingSummary: [],
    monitoringStatus: {},
    latestInsights: [],
    alertCount: 0
  });

  useEffect(() => {
    loadIntelligenceData();
    // Set up interval to refresh data
    const interval = setInterval(loadIntelligenceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadIntelligenceData = async () => {
    setLoading(true);
    
    // Load configuration from localStorage
    const savedOnboarding = localStorage.getItem('signaldesk_onboarding');
    const savedOrg = localStorage.getItem('signaldesk_organization');
    
    if (!savedOnboarding) {
      setLoading(false);
      return;
    }

    const config = JSON.parse(savedOnboarding);
    const org = savedOrg ? JSON.parse(savedOrg) : null;
    
    // Build tracking summary based on what user configured
    const trackingSummary = [];
    
    // 1. Goals being tracked
    if (config.goals) {
      const activeGoals = Object.entries(config.goals)
        .filter(([_, active]) => active)
        .map(([goal]) => goal);
      
      if (activeGoals.length > 0) {
        trackingSummary.push({
          category: 'Strategic Goals',
          icon: '🎯',
          items: activeGoals.map(goal => ({
            name: goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            status: 'monitoring',
            lastUpdate: 'Active monitoring'
          }))
        });
      }
    }
    
    // 2. Stakeholders being monitored
    if (config.stakeholders && config.stakeholders.length > 0) {
      const stakeholderMap = {
        'tech_journalists': { name: 'Tech Media', icon: '📰' },
        'industry_analysts': { name: 'Industry Analysts', icon: '📊' },
        'investors': { name: 'VC Community', icon: '💰' },
        'customers': { name: 'Customer Base', icon: '👥' },
        'partners': { name: 'Partner Network', icon: '🤝' },
        'competitors': { name: 'Competitors', icon: '🎯' },
        'regulators': { name: 'Regulatory Bodies', icon: '⚖️' },
        'influencers': { name: 'Industry Influencers', icon: '⭐' }
      };
      
      trackingSummary.push({
        category: 'Stakeholder Groups',
        icon: '👥',
        items: config.stakeholders.map(id => {
          const stakeholder = stakeholderMap[id] || { name: id, icon: '👤' };
          return {
            name: stakeholder.name,
            icon: stakeholder.icon,
            status: 'active',
            lastUpdate: 'Monitoring conversations'
          };
        })
      });
    }
    
    // 3. Industry Intelligence
    if (org?.industry) {
      trackingSummary.push({
        category: 'Industry Intelligence',
        icon: '🏢',
        items: [
          {
            name: `${org.industry.charAt(0).toUpperCase() + org.industry.slice(1)} Sector`,
            status: 'tracking',
            lastUpdate: 'Market trends analysis active'
          },
          {
            name: 'Competitive Landscape',
            status: 'scanning',
            lastUpdate: 'Monitoring key players'
          }
        ]
      });
    }
    
    // 4. Check for any MCP responses in localStorage
    const mcpData = localStorage.getItem('signaldesk_mcp_responses');
    let latestInsights = [];
    
    if (mcpData) {
      try {
        const responses = JSON.parse(mcpData);
        // Convert MCP responses to insights
        if (responses.orchestrator) {
          latestInsights.push({
            source: 'Strategic Orchestrator',
            insight: 'System initialized and monitoring active',
            timestamp: new Date().toISOString()
          });
        }
        if (responses.opportunities) {
          latestInsights.push({
            source: 'Opportunity Scanner',
            insight: `${responses.opportunities.length || 0} opportunities identified`,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.log('Could not parse MCP responses');
      }
    }
    
    // Default insights if no MCP data yet
    if (latestInsights.length === 0) {
      latestInsights = [
        {
          source: 'System',
          insight: 'Intelligence gathering systems are initializing',
          timestamp: new Date().toISOString()
        }
      ];
    }
    
    setIntelligenceData({
      organization: org,
      trackingSummary,
      monitoringStatus: {
        active: trackingSummary.reduce((sum, cat) => sum + cat.items.length, 0),
        categories: trackingSummary.length,
        lastRefresh: new Date().toLocaleTimeString()
      },
      latestInsights,
      alertCount: 0
    });
    
    setLoading(false);
  };

  const renderOverview = () => {
    return (
      <div className="tab-content">
        <div className="overview-header">
          <h3>Intelligence Overview</h3>
          <p className="overview-subtitle">
            Monitoring {intelligenceData.monitoringStatus.active} items across {intelligenceData.monitoringStatus.categories} categories
          </p>
        </div>
        
        {intelligenceData.trackingSummary.length > 0 ? (
          <>
            {/* Monitoring Status Bar */}
            <div className="monitoring-status-bar">
              <div className="status-item">
                <span className="status-label">Active Monitors</span>
                <span className="status-value">{intelligenceData.monitoringStatus.active}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Last Refresh</span>
                <span className="status-value">{intelligenceData.monitoringStatus.lastRefresh}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Alerts</span>
                <span className="status-value">{intelligenceData.alertCount}</span>
              </div>
            </div>

            {/* Tracking Summary Grid */}
            <div className="tracking-grid">
              {intelligenceData.trackingSummary.map((category, idx) => (
                <div key={idx} className="tracking-category">
                  <div className="category-header">
                    <span className="category-icon">{category.icon}</span>
                    <h4>{category.category}</h4>
                    <span className="item-count">{category.items.length} items</span>
                  </div>
                  <div className="category-items">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="tracking-item">
                        {item.icon && <span className="item-icon">{item.icon}</span>}
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-status">{item.lastUpdate}</span>
                        </div>
                        <span className={`status-indicator ${item.status}`}>●</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Latest Insights */}
            {intelligenceData.latestInsights.length > 0 && (
              <div className="latest-insights">
                <h4>Latest Insights</h4>
                <div className="insights-list">
                  {intelligenceData.latestInsights.map((insight, idx) => (
                    <div key={idx} className="insight-item">
                      <div className="insight-header">
                        <span className="insight-source">{insight.source}</span>
                        <span className="insight-time">
                          {new Date(insight.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="insight-content">{insight.insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>🔄 No monitoring configured yet</p>
            <p className="empty-subtitle">Complete onboarding to set up intelligence monitoring</p>
          </div>
        )}
      </div>
    );
  };

  const renderMonitoring = () => {
    return (
      <div className="tab-content">
        <h3>Active Monitoring</h3>
        
        <div className="monitoring-details">
          {intelligenceData.trackingSummary.map((category, idx) => (
            <div key={idx} className="monitoring-category-detail">
              <h4>{category.icon} {category.category}</h4>
              <div className="monitoring-list">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="monitoring-item-detail">
                    <div className="item-left">
                      {item.icon && <span className="item-icon">{item.icon}</span>}
                      <span className="item-name">{item.name}</span>
                    </div>
                    <div className="item-right">
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                      <span className="item-update">{item.lastUpdate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {intelligenceData.trackingSummary.length === 0 && (
          <div className="empty-state">
            <p>No active monitoring configured</p>
          </div>
        )}
      </div>
    );
  };

  const renderInsights = () => {
    // This tab could show deeper insights, trends, and analysis
    return (
      <div className="tab-content">
        <h3>Intelligence Insights</h3>
        
        <div className="insights-dashboard">
          {/* Key Metrics */}
          <div className="metrics-row">
            <div className="metric-card">
              <span className="metric-label">Total Monitors</span>
              <span className="metric-value">{intelligenceData.monitoringStatus.active}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Categories</span>
              <span className="metric-value">{intelligenceData.monitoringStatus.categories}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Active Alerts</span>
              <span className="metric-value">{intelligenceData.alertCount}</span>
            </div>
          </div>
          
          {/* Insights Timeline */}
          <div className="insights-timeline">
            <h4>Recent Intelligence Activity</h4>
            {intelligenceData.latestInsights.length > 0 ? (
              <div className="timeline-items">
                {intelligenceData.latestInsights.map((insight, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{insight.source}</strong>
                        <span>{new Date(insight.timestamp).toLocaleString()}</span>
                      </div>
                      <p>{insight.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-insights">No insights available yet. System is gathering intelligence...</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="module-container intelligence-module">
      <div className="module-header">
        <h2>🔍 Intelligence Hub</h2>
        <div className="module-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'monitoring' ? 'active' : ''}
            onClick={() => setActiveTab('monitoring')}
          >
            Monitoring
          </button>
          <button 
            className={activeTab === 'insights' ? 'active' : ''}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        </div>
      </div>
      
      <div className="module-content">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading intelligence data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'monitoring' && renderMonitoring()}
            {activeTab === 'insights' && renderInsights()}
          </>
        )}
      </div>
    </div>
  );
};

export default IntelligenceModuleV2;