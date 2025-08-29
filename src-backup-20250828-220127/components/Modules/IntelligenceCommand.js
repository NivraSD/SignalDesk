import React, { useState, useEffect } from 'react';
import './IntelligenceCommand.css';
import intelligenceGatheringService from '../../services/intelligenceGatheringService';

const IntelligenceCommand = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [organizationData, setOrganizationData] = useState(null);
  const [intelligenceData, setIntelligenceData] = useState({
    monitoring: {},
    stakeholder: {},
    narrative: {},
    campaign: {},
    predictive: {}
  });

  useEffect(() => {
    loadOrganization();
    startIntelligenceGathering();
    const interval = setInterval(refreshIntelligence, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadOrganization = () => {
    const org = localStorage.getItem('signaldesk_organization');
    if (org) {
      setOrganizationData(JSON.parse(org));
    }
  };

  const startIntelligenceGathering = async () => {
    setLoading(true);
    try {
      await refreshIntelligence();
    } finally {
      setLoading(false);
    }
  };

  const refreshIntelligence = async () => {
    const config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
    
    // Gather intelligence from all MCPs
    const intelligence = await intelligenceGatheringService.gatherIntelligence(config);
    
    // Process into our 5 key areas
    processIntelligenceData(intelligence);
    setLastUpdate(new Date());
  };

  const processIntelligenceData = (raw) => {
    // Transform raw MCP data into strategic intelligence
    setIntelligenceData({
      monitoring: extractMonitoringAlerts(raw),
      stakeholder: extractStakeholderIntelligence(raw),
      narrative: extractNarrativeAnalysis(raw),
      campaign: extractCampaignPerformance(raw),
      predictive: extractPredictiveInsights(raw)
    });
  };

  const extractMonitoringAlerts = (raw) => {
    const alerts = [];
    
    // Crisis signals
    if (raw.realTimeAlerts) {
      alerts.push(...raw.realTimeAlerts.map(a => ({
        type: 'crisis',
        severity: a.relevance === 'high' ? 'critical' : 'warning',
        title: a.title,
        description: a.insight,
        action: a.suggestedAction,
        timestamp: a.timestamp
      })));
    }

    // Competitor movements
    if (raw.competitiveIntel) {
      raw.competitiveIntel.forEach(c => {
        if (c.type === 'competitive') {
          alerts.push({
            type: 'competitor',
            severity: 'info',
            title: `${c.title} Activity`,
            description: c.insight,
            action: c.suggestedAction,
            timestamp: c.timestamp
          });
        }
      });
    }

    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      alerts: alerts.slice(0, 10)
    };
  };

  const extractStakeholderIntelligence = (raw) => {
    const stakeholders = {};
    
    if (raw.stakeholderInsights) {
      raw.stakeholderInsights.forEach(insight => {
        const key = insight.stakeholder?.toLowerCase().replace(/ /g, '_') || 'general';
        if (!stakeholders[key]) {
          stakeholders[key] = {
            name: insight.stakeholder,
            sentiment: 'neutral',
            activity: [],
            opportunities: []
          };
        }
        
        stakeholders[key].activity.push({
          title: insight.title,
          insight: insight.insight,
          action: insight.suggestedAction
        });

        if (insight.actionable) {
          stakeholders[key].opportunities.push(insight.suggestedAction);
        }
      });
    }

    return stakeholders;
  };

  const extractNarrativeAnalysis = (raw) => {
    return {
      currentNarratives: raw.industryTrends?.slice(0, 5) || [],
      sentimentTrend: 'positive',
      shareOfVoice: 32,
      whitespaceOpportunities: raw.mediaOpportunities?.length || 0,
      emergingTopics: raw.industryTrends?.filter(t => t.relevance === 'high') || []
    };
  };

  const extractCampaignPerformance = (raw) => {
    return {
      activeCampaigns: 0,
      totalReach: 0,
      engagementRate: 0,
      mediaValue: 0,
      topContent: []
    };
  };

  const extractPredictiveInsights = (raw) => {
    const predictions = [];

    // Cascade predictions based on current events
    if (raw.competitiveIntel?.length > 0) {
      predictions.push({
        type: 'cascade',
        probability: 75,
        timeframe: '48 hours',
        prediction: 'Competitor activity likely to trigger media inquiries',
        recommendation: 'Prepare spokesperson statements'
      });
    }

    if (raw.industryTrends?.length > 3) {
      predictions.push({
        type: 'narrative',
        probability: 60,
        timeframe: '1 week',
        prediction: 'Industry narrative shifting toward AI regulation',
        recommendation: 'Position as thought leader on responsible AI'
      });
    }

    return {
      predictions,
      riskScore: 35,
      opportunityScore: 78
    };
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'monitoring', label: 'Real-Time Monitoring', icon: '🚨' },
    { id: 'stakeholder', label: 'Stakeholder Intel', icon: '👥' },
    { id: 'narrative', label: 'Narrative Analysis', icon: '📈' },
    { id: 'campaign', label: 'Campaign Performance', icon: '🎯' },
    { id: 'predictive', label: 'Predictive Intelligence', icon: '🔮' }
  ];

  const renderDashboard = () => (
    <div className="dashboard-grid">
      {/* Alert Summary Card */}
      <div className="dashboard-card alert-card">
        <div className="card-header">
          <h3>🚨 Active Alerts</h3>
          <span className="badge critical">{intelligenceData.monitoring.critical || 0} Critical</span>
        </div>
        <div className="card-content">
          <div className="alert-summary">
            <div className="alert-stat">
              <span className="stat-value">{intelligenceData.monitoring.total || 0}</span>
              <span className="stat-label">Total Alerts</span>
            </div>
            <div className="alert-stat">
              <span className="stat-value">{intelligenceData.predictive.riskScore || 0}%</span>
              <span className="stat-label">Risk Score</span>
            </div>
          </div>
          {intelligenceData.monitoring.alerts?.slice(0, 3).map((alert, i) => (
            <div key={i} className={`alert-item ${alert.severity}`}>
              <span className="alert-type">{alert.type}</span>
              <span className="alert-title">{alert.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stakeholder Activity Card */}
      <div className="dashboard-card stakeholder-card">
        <div className="card-header">
          <h3>👥 Stakeholder Activity</h3>
          <span className="badge">{Object.keys(intelligenceData.stakeholder).length} Active</span>
        </div>
        <div className="card-content">
          {Object.entries(intelligenceData.stakeholder).slice(0, 4).map(([key, data]) => (
            <div key={key} className="stakeholder-item">
              <div className="stakeholder-name">{data.name}</div>
              <div className="stakeholder-activity">
                {data.activity?.[0]?.title || 'Monitoring...'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Narrative Trends Card */}
      <div className="dashboard-card narrative-card">
        <div className="card-header">
          <h3>📈 Narrative Trends</h3>
          <span className="badge success">
            {intelligenceData.narrative.shareOfVoice || 0}% Share
          </span>
        </div>
        <div className="card-content">
          <div className="trend-chart">
            <div className="trend-bar" style={{height: '60%'}}></div>
            <div className="trend-bar" style={{height: '75%'}}></div>
            <div className="trend-bar" style={{height: '45%'}}></div>
            <div className="trend-bar" style={{height: '80%'}}></div>
            <div className="trend-bar" style={{height: '65%'}}></div>
          </div>
          <div className="narrative-stats">
            <div className="stat">
              <span className="stat-label">Sentiment</span>
              <span className="stat-value positive">Positive</span>
            </div>
            <div className="stat">
              <span className="stat-label">Opportunities</span>
              <span className="stat-value">{intelligenceData.narrative.whitespaceOpportunities || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Insights Card */}
      <div className="dashboard-card predictive-card">
        <div className="card-header">
          <h3>🔮 Predictive Intelligence</h3>
          <span className="badge info">
            {intelligenceData.predictive.opportunityScore || 0}% Opportunity
          </span>
        </div>
        <div className="card-content">
          {intelligenceData.predictive.predictions?.slice(0, 2).map((pred, i) => (
            <div key={i} className="prediction-item">
              <div className="prediction-header">
                <span className="prediction-type">{pred.type}</span>
                <span className="prediction-prob">{pred.probability}% likely</span>
              </div>
              <div className="prediction-text">{pred.prediction}</div>
              <div className="prediction-action">→ {pred.recommendation}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="dashboard-card actions-card">
        <div className="card-header">
          <h3>⚡ Quick Actions</h3>
        </div>
        <div className="card-content">
          <button className="action-button primary">
            📝 Create Press Release
          </button>
          <button className="action-button">
            📧 Draft Media Pitch
          </button>
          <button className="action-button">
            📊 Generate Report
          </button>
          <button className="action-button">
            🎯 Launch Campaign
          </button>
        </div>
      </div>

      {/* Performance Metrics Card */}
      <div className="dashboard-card metrics-card">
        <div className="card-header">
          <h3>📊 Key Metrics</h3>
        </div>
        <div className="card-content">
          <div className="metric-grid">
            <div className="metric">
              <span className="metric-value">24</span>
              <span className="metric-label">Media Mentions</span>
              <span className="metric-change positive">↑ 12%</span>
            </div>
            <div className="metric">
              <span className="metric-value">8.2K</span>
              <span className="metric-label">Reach</span>
              <span className="metric-change positive">↑ 34%</span>
            </div>
            <div className="metric">
              <span className="metric-value">92%</span>
              <span className="metric-label">Sentiment</span>
              <span className="metric-change neutral">→ 0%</span>
            </div>
            <div className="metric">
              <span className="metric-value">$45K</span>
              <span className="metric-label">Media Value</span>
              <span className="metric-change positive">↑ 18%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="monitoring-view">
      <div className="section-header">
        <h2>Real-Time Monitoring & Alerts</h2>
        <div className="header-actions">
          <button className="refresh-button" onClick={refreshIntelligence}>
            🔄 Refresh
          </button>
          <span className="last-update">Updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="alerts-container">
        {intelligenceData.monitoring.alerts?.map((alert, i) => (
          <div key={i} className={`alert-card ${alert.severity}`}>
            <div className="alert-header">
              <span className="alert-icon">
                {alert.type === 'crisis' ? '🚨' : 
                 alert.type === 'competitor' ? '🎯' : '📢'}
              </span>
              <div className="alert-meta">
                <h4>{alert.title}</h4>
                <span className="alert-time">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <p className="alert-description">{alert.description}</p>
            <div className="alert-action">
              <strong>Recommended Action:</strong> {alert.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'monitoring':
        return renderMonitoring();
      // Add other views as needed
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="intelligence-command">
      <div className="command-sidebar">
        <div className="sidebar-header">
          <h2>Intelligence Hub</h2>
          {organizationData && (
            <div className="org-info">
              <span className="org-name">{organizationData.name}</span>
              <span className="org-industry">{organizationData.industry}</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-indicator active"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>

      <div className="command-content">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Gathering intelligence...</p>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default IntelligenceCommand;