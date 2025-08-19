import React, { useState, useEffect } from 'react';
import './ModuleStyles.css';

const IntelligenceModule = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [intelligenceData, setIntelligenceData] = useState({
    mcpStatus: [],
    recentFindings: [],
    activeMonitors: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [userConfig, setUserConfig] = useState(null);

  useEffect(() => {
    // Load user's onboarding configuration
    const savedOnboarding = localStorage.getItem('signaldesk_onboarding');
    if (savedOnboarding) {
      const config = JSON.parse(savedOnboarding);
      setUserConfig(config.intelligence);
    }
    
    if (organizationId) {
      loadIntelligenceData();
    }
  }, [organizationId]);

  const loadIntelligenceData = async () => {
    setLoading(true);
    try {
      // For now, use mock data until backend endpoints are ready
      // TODO: Replace with actual API calls when available
      
      setTimeout(() => {
        setIntelligenceData({
          stakeholderActivity: [
            { id: 'analyst', name: 'Gartner Research', lastActivity: 'Published new Magic Quadrant', timestamp: new Date().toISOString() },
            { id: 'investor', name: 'Sequoia Capital', lastActivity: 'Announced new AI fund', timestamp: new Date().toISOString() },
            { id: 'partner', name: 'Microsoft', lastActivity: 'Released partnership guidelines', timestamp: new Date().toISOString() }
          ],
          recentFindings: [
            {
              type: 'Stakeholder Movement',
              content: 'Key analyst from Forrester moving to competitor - relationship at risk',
              source: 'LinkedIn',
              timestamp: '2 hours ago'
            },
            {
              type: 'Strategic Topic',
              content: 'AI governance becoming priority topic among your tracked VCs',
              source: 'Industry Analysis',
              timestamp: '5 hours ago'
            },
            {
              type: 'Media Opportunity',
              content: 'WSJ journalist seeking sources on enterprise AI adoption',
              source: 'Media Intel',
              timestamp: '1 day ago'
            }
          ],
          activeMonitors: ['brand', 'competitors', 'industry'],
          alerts: [
            {
              title: 'Competitor Product Launch',
              description: 'Competitor B launching new feature next week',
              priority: 'high'
            }
          ]
        });
        setLoading(false);
      }, 1000); // Simulate loading time
      
    } catch (error) {
      console.error('Error loading intelligence data:', error);
      setLoading(false);
    }
  };

  // Generate stakeholder groups based on user's configuration
  const getStakeholderGroups = () => {
    if (userConfig?.stakeholders) {
      // Parse the user's stakeholder configuration
      const stakeholders = userConfig.stakeholders.split(',').map(s => s.trim()).filter(s => s);
      
      // Map common stakeholder types to icons and generate groups
      const iconMap = {
        'analyst': '📊',
        'investor': '💰',
        'partner': '🤝',
        'media': '📰',
        'influencer': '⭐',
        'regulator': '⚖️',
        'executive': '💼',
        'customer': '👥',
        'board': '🏛️',
        'competitor': '🎯'
      };
      
      return stakeholders.map((stakeholder, index) => {
        // Try to find an icon based on keywords in the stakeholder name
        let icon = '👤'; // default icon
        for (const [key, value] of Object.entries(iconMap)) {
          if (stakeholder.toLowerCase().includes(key)) {
            icon = value;
            break;
          }
        }
        
        return {
          id: `stakeholder-${index}`,
          name: stakeholder,
          icon: icon,
          count: Math.floor(Math.random() * 50) + 5, // Simulated count
          status: index < 3 ? 'active' : 'monitoring'
        };
      });
    }
    
    // Default stakeholder groups if no configuration
    return [
      { id: 'analysts', name: 'Industry Analysts', icon: '📊', count: 12, status: 'active' },
      { id: 'investors', name: 'Key Investors', icon: '💰', count: 8, status: 'active' },
      { id: 'partners', name: 'Strategic Partners', icon: '🤝', count: 15, status: 'active' },
      { id: 'media', name: 'Media Contacts', icon: '📰', count: 47, status: 'active' },
      { id: 'influencers', name: 'Industry Influencers', icon: '⭐', count: 23, status: 'active' },
      { id: 'regulators', name: 'Regulatory Bodies', icon: '⚖️', count: 5, status: 'monitoring' }
    ];
  };

  const stakeholderGroups = getStakeholderGroups();

  const renderOverview = () => (
    <div className="intelligence-overview">
      {/* Stakeholder Monitoring Grid */}
      <div className="section">
        <h3 className="section-title">Stakeholder Monitoring</h3>
        <div className="stakeholder-grid">
          {stakeholderGroups.map(group => (
            <div key={group.id} className={`stakeholder-card ${group.status}`}>
              <div className="stakeholder-icon">{group.icon}</div>
              <div className="stakeholder-info">
                <div className="stakeholder-name">{group.name}</div>
                <div className="stakeholder-stats">
                  <span className="stakeholder-count">{group.count} tracked</span>
                  <span className={`status-indicator ${group.status}`}>
                    {group.status === 'active' ? '● Active' : '◐ Monitoring'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Intelligence Findings */}
      <div className="section">
        <h3 className="section-title">Recent Intelligence</h3>
        <div className="findings-list">
          {intelligenceData.recentFindings.length > 0 ? (
            intelligenceData.recentFindings.map((finding, idx) => (
              <div key={idx} className="finding-card">
                <div className="finding-header">
                  <span className="finding-type">{finding.type}</span>
                  <span className="finding-time">{finding.timestamp}</span>
                </div>
                <div className="finding-content">{finding.content}</div>
                <div className="finding-source">Source: {finding.source}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No recent intelligence findings</p>
              <button className="primary-btn" onClick={loadIntelligenceData}>
                Refresh Intelligence
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Alerts */}
      {intelligenceData.alerts.length > 0 && (
        <div className="section">
          <h3 className="section-title">Active Alerts</h3>
          <div className="alerts-list">
            {intelligenceData.alerts.map((alert, idx) => (
              <div key={idx} className={`alert-card ${alert.priority}`}>
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-description">{alert.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMonitoring = () => {
    // Get topics from user configuration or use defaults
    const topics = userConfig?.topics 
      ? userConfig.topics.split(',').map(t => t.trim()).filter(t => t)
      : ['AI Governance', 'Enterprise AI', 'Sustainability Tech', 'Digital Transformation'];
    
    const topicIcons = ['🔍', '🎯', '📰', '📈', '💡', '🌐', '🚀', '📊'];
    
    return (
      <div className="intelligence-monitoring">
        <h3 className="section-title">Topic & Trend Monitoring</h3>
        <div className="monitors-grid">
          {topics.slice(0, 4).map((topic, index) => (
            <div key={index} className="monitor-card">
              <div className="monitor-header">
                <span className="monitor-icon">{topicIcons[index % topicIcons.length]}</span>
                <span className="monitor-title">{topic}</span>
              </div>
              <div className="monitor-stats">
                <div className="stat">
                  <span className="stat-value">{Math.floor(Math.random() * 100) + 10}</span>
                  <span className="stat-label">Mentions Today</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{Math.random() > 0.5 ? '+' : ''}{Math.floor(Math.random() * 50)}%</span>
                  <span className="stat-label">Trend</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {userConfig?.keywords && (
          <div className="keywords-section" style={{ marginTop: '30px' }}>
            <h4 style={{ color: '#E2E8F0', marginBottom: '15px' }}>Tracked Keywords</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {userConfig.keywords.split(',').map(k => k.trim()).filter(k => k).map((keyword, idx) => (
                <span key={idx} style={{
                  background: '#374151',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: '#E2E8F0',
                  border: '1px solid #4B5563'
                }}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="intelligence-analytics">
      <h3 className="section-title">Intelligence Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Sentiment Analysis</h4>
          <div className="sentiment-bars">
            <div className="sentiment-bar positive" style={{ width: '65%' }}>
              <span>Positive 65%</span>
            </div>
            <div className="sentiment-bar neutral" style={{ width: '25%' }}>
              <span>Neutral 25%</span>
            </div>
            <div className="sentiment-bar negative" style={{ width: '10%' }}>
              <span>Negative 10%</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>Top Sources</h4>
          <div className="sources-list">
            <div className="source-item">
              <span className="source-name">Twitter/X</span>
              <span className="source-count">892</span>
            </div>
            <div className="source-item">
              <span className="source-name">LinkedIn</span>
              <span className="source-count">456</span>
            </div>
            <div className="source-item">
              <span className="source-name">News Sites</span>
              <span className="source-count">234</span>
            </div>
            <div className="source-item">
              <span className="source-name">Reddit</span>
              <span className="source-count">178</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="module-loading">
        <div className="loading-spinner"></div>
        <p>Loading Intelligence Data...</p>
      </div>
    );
  }

  return (
    <div className="intelligence-module">
      <div className="module-header">
        <h2 className="module-title">
          <span className="module-icon">🔍</span>
          Intelligence Hub
        </h2>
        <div className="module-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            Monitoring
          </button>
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>
      </div>

      <div className="module-body">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'monitoring' && renderMonitoring()}
        {activeTab === 'analytics' && renderAnalytics()}
        
        {/* Configuration Display */}
        {userConfig && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#10B981',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            ✓ Custom Config Active
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceModule;