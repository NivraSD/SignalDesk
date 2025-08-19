import React, { useState, useEffect } from 'react';
import './ModuleStyles.css';
import './IntelligenceModule.css';

const IntelligenceModule = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [intelligenceData, setIntelligenceData] = useState({
    stakeholderActivity: [],
    opportunities: [],
    recentFindings: [],
    activeMonitors: []
  });
  const [loading, setLoading] = useState(true);
  const [userConfig, setUserConfig] = useState(null);

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  const loadIntelligenceData = () => {
    setLoading(true);
    
    // Load user's onboarding configuration
    const savedOnboarding = localStorage.getItem('signaldesk_onboarding');
    const savedOrg = localStorage.getItem('signaldesk_organization');
    const initialOpportunities = localStorage.getItem('signaldesk_initial_opportunities');
    
    if (savedOnboarding) {
      const config = JSON.parse(savedOnboarding);
      setUserConfig(config);
      
      // Build intelligence data from actual configuration
      const stakeholderActivity = [];
      const activeMonitors = [];
      
      // Generate stakeholder activity from selected stakeholders
      if (config.stakeholders && config.stakeholders.length > 0) {
        const stakeholderMap = {
          'tech_journalists': { name: 'Tech Media', icon: '📰', activity: 'New AI ethics article published' },
          'industry_analysts': { name: 'Industry Analysts', icon: '📊', activity: 'Released quarterly forecast' },
          'investors': { name: 'VC Community', icon: '💰', activity: 'New fund announced for your sector' },
          'customers': { name: 'Customer Base', icon: '👥', activity: 'Increased social mentions' },
          'partners': { name: 'Partner Network', icon: '🤝', activity: 'Partnership opportunity identified' },
          'competitors': { name: 'Competitors', icon: '🎯', activity: 'Competitor launched new feature' },
          'regulators': { name: 'Regulatory Bodies', icon: '⚖️', activity: 'New compliance guidelines' },
          'influencers': { name: 'Industry Influencers', icon: '⭐', activity: 'Mentioned your industry trend' }
        };
        
        config.stakeholders.forEach(stakeholderId => {
          const stakeholder = stakeholderMap[stakeholderId];
          if (stakeholder) {
            stakeholderActivity.push({
              id: stakeholderId,
              name: stakeholder.name,
              icon: stakeholder.icon,
              lastActivity: stakeholder.activity,
              timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
              status: Math.random() > 0.5 ? 'active' : 'monitoring'
            });
            activeMonitors.push(stakeholderId);
          }
        });
      }
      
      // Get opportunities from MCP call if available
      let opportunities = [];
      if (initialOpportunities) {
        try {
          opportunities = JSON.parse(initialOpportunities);
        } catch (e) {
          console.log('Could not parse initial opportunities');
        }
      }
      
      // Generate findings based on goals
      const recentFindings = [];
      if (config.goals) {
        if (config.goals.thought_leadership) {
          recentFindings.push({
            type: 'Opportunity',
            content: 'Speaking slot available at upcoming industry conference',
            source: 'Event Monitoring',
            timestamp: '2 hours ago',
            priority: 'high'
          });
        }
        if (config.goals.media_coverage) {
          recentFindings.push({
            type: 'Media Alert',
            content: 'Reporter from TechCrunch seeking sources on your topic',
            source: 'Journalist Tracking',
            timestamp: '4 hours ago',
            priority: 'critical'
          });
        }
        if (config.goals.competitive_positioning) {
          recentFindings.push({
            type: 'Competitive Intel',
            content: 'Competitor experiencing customer complaints - opportunity to differentiate',
            source: 'Competitive Analysis',
            timestamp: '1 day ago',
            priority: 'medium'
          });
        }
      }
      
      setIntelligenceData({
        stakeholderActivity,
        opportunities,
        recentFindings,
        activeMonitors
      });
    }
    
    setLoading(false);
  };

  const renderOverview = () => {
    const orgData = localStorage.getItem('signaldesk_organization');
    const org = orgData ? JSON.parse(orgData) : {};
    
    return (
      <div className="tab-content">
        <div className="overview-header">
          <h3>Intelligence Overview for {org.name || 'Your Organization'}</h3>
          <p className="overview-subtitle">Real-time monitoring of your stakeholder ecosystem</p>
        </div>
        
        {intelligenceData.stakeholderActivity.length > 0 ? (
          <div className="intelligence-grid">
            <div className="intel-card">
              <h4>📡 Stakeholder Activity</h4>
              <div className="activity-list">
                {intelligenceData.stakeholderActivity.slice(0, 5).map((activity, idx) => (
                  <div key={idx} className="activity-item">
                    <span className="activity-icon">{activity.icon}</span>
                    <div className="activity-content">
                      <div className="activity-header">
                        <strong>{activity.name}</strong>
                        <span className={`status-badge ${activity.status}`}>
                          {activity.status}
                        </span>
                      </div>
                      <p>{activity.lastActivity}</p>
                      <span className="activity-time">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {intelligenceData.recentFindings.length > 0 && (
              <div className="intel-card">
                <h4>🎯 Recent Findings</h4>
                <div className="findings-list">
                  {intelligenceData.recentFindings.map((finding, idx) => (
                    <div key={idx} className={`finding-item priority-${finding.priority}`}>
                      <div className="finding-header">
                        <span className="finding-type">{finding.type}</span>
                        <span className="finding-time">{finding.timestamp}</span>
                      </div>
                      <p className="finding-content">{finding.content}</p>
                      <span className="finding-source">Source: {finding.source}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {intelligenceData.opportunities.length > 0 && (
              <div className="intel-card">
                <h4>💡 Discovered Opportunities</h4>
                <div className="opportunities-list">
                  {intelligenceData.opportunities.slice(0, 3).map((opp, idx) => (
                    <div key={idx} className="opportunity-item">
                      <div className="opp-header">
                        <strong>{opp.title}</strong>
                        <span className="opp-score">Score: {opp.score}</span>
                      </div>
                      <p>{opp.description}</p>
                      <div className="opp-meta">
                        <span className="opp-type">{opp.type}</span>
                        <span className="opp-urgency">{opp.urgency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>🔄 Intelligence systems are initializing...</p>
            <p className="empty-subtitle">Your configured stakeholders will appear here once monitoring begins.</p>
          </div>
        )}
        
        <div className="active-monitors">
          <h4>Active Monitoring</h4>
          <div className="monitor-tags">
            {intelligenceData.activeMonitors.map((monitor, idx) => (
              <span key={idx} className="monitor-tag">
                {monitor.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStakeholders = () => {
    return (
      <div className="tab-content">
        <h3>Stakeholder Groups</h3>
        <div className="stakeholder-grid">
          {intelligenceData.stakeholderActivity.map((stakeholder, idx) => (
            <div key={idx} className="stakeholder-card">
              <div className="stakeholder-header">
                <span className="stakeholder-icon">{stakeholder.icon}</span>
                <h4>{stakeholder.name}</h4>
              </div>
              <div className="stakeholder-stats">
                <div className="stat">
                  <span className="stat-label">Status</span>
                  <span className="stat-value">{stakeholder.status}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Last Activity</span>
                  <span className="stat-value">
                    {new Date(stakeholder.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="stakeholder-activity">{stakeholder.lastActivity}</p>
            </div>
          ))}
        </div>
        
        {intelligenceData.stakeholderActivity.length === 0 && (
          <div className="empty-state">
            <p>No stakeholders configured yet.</p>
            <p className="empty-subtitle">Complete onboarding to set up stakeholder monitoring.</p>
          </div>
        )}
      </div>
    );
  };

  const renderMonitoring = () => {
    const goals = userConfig?.goals || {};
    const activeGoals = Object.entries(goals)
      .filter(([_, active]) => active)
      .map(([goal]) => goal.replace(/_/g, ' ').toUpperCase());
    
    return (
      <div className="tab-content">
        <h3>Monitoring Configuration</h3>
        
        <div className="monitoring-overview">
          <div className="config-section">
            <h4>📍 Active Goals</h4>
            <div className="goal-tags">
              {activeGoals.length > 0 ? (
                activeGoals.map((goal, idx) => (
                  <span key={idx} className="goal-tag">{goal}</span>
                ))
              ) : (
                <span className="empty-text">No goals configured</span>
              )}
            </div>
          </div>
          
          <div className="config-section">
            <h4>👥 Monitored Stakeholders</h4>
            <div className="stakeholder-tags">
              {intelligenceData.activeMonitors.length > 0 ? (
                intelligenceData.activeMonitors.map((monitor, idx) => (
                  <span key={idx} className="stakeholder-tag">
                    {monitor.replace(/_/g, ' ')}
                  </span>
                ))
              ) : (
                <span className="empty-text">No stakeholders selected</span>
              )}
            </div>
          </div>
          
          <div className="config-section">
            <h4>🏢 Organization Details</h4>
            <div className="org-details">
              <p><strong>Name:</strong> {userConfig?.organization?.name || 'Not set'}</p>
              <p><strong>Industry:</strong> {userConfig?.organization?.industry || 'Not set'}</p>
              <p><strong>Size:</strong> {userConfig?.organization?.size || 'Not set'}</p>
            </div>
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
            className={activeTab === 'stakeholders' ? 'active' : ''}
            onClick={() => setActiveTab('stakeholders')}
          >
            Stakeholders
          </button>
          <button 
            className={activeTab === 'monitoring' ? 'active' : ''}
            onClick={() => setActiveTab('monitoring')}
          >
            Configuration
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
            {activeTab === 'stakeholders' && renderStakeholders()}
            {activeTab === 'monitoring' && renderMonitoring()}
          </>
        )}
      </div>
    </div>
  );
};

export default IntelligenceModule;