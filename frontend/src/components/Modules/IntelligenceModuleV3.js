import React, { useState, useEffect } from 'react';
import intelligenceService from '../../services/intelligenceGatheringService';
import './IntelligenceModuleV2.css';

const IntelligenceModuleV3 = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [intelligenceData, setIntelligenceData] = useState({
    stakeholderInsights: [],
    industryTrends: [],
    competitiveIntel: [],
    mediaOpportunities: [],
    realTimeAlerts: [],
    lastRefresh: null
  });

  useEffect(() => {
    loadRealIntelligence();
    // Refresh intelligence every 2 minutes
    const interval = setInterval(loadRealIntelligence, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadRealIntelligence = async () => {
    setLoading(true);
    
    // Load configuration and MCP results
    let savedOnboarding = null;
    const unifiedProfile = localStorage.getItem('signaldesk_unified_profile');
    
    if (unifiedProfile) {
      const profile = JSON.parse(unifiedProfile);
      // Extract the parts that Intelligence Module needs
      savedOnboarding = JSON.stringify({
        organization: profile.organization,
        competitors: profile.competitors,
        monitoring_topics: profile.monitoring_topics || []
      });
    } else {
      savedOnboarding = localStorage.getItem('signaldesk_onboarding');
    }
    
    const mcpResults = localStorage.getItem('signaldesk_mcp_results');
    
    if (!savedOnboarding) {
      setLoading(false);
      return;
    }

    const config = JSON.parse(savedOnboarding);
    
    try {
      // First check if we have MCP results from onboarding
      if (mcpResults) {
        const results = JSON.parse(mcpResults);
        
        // Process MCP results into intelligence data
        const processedIntelligence = processMCPResults(results, config);
        setIntelligenceData({
          ...processedIntelligence,
          lastRefresh: new Date().toLocaleTimeString()
        });
      } else {
        // Fallback to gathering intelligence if no MCP results
        const intelligence = await intelligenceService.gatherIntelligence(config);
        
        if (intelligence) {
          setIntelligenceData({
            ...intelligence,
            lastRefresh: new Date().toLocaleTimeString()
          });
        }
      }
      
      // Also get real-time alerts
      const alerts = await intelligenceService.getRealTimeAlerts(config);
      if (alerts) {
        setIntelligenceData(prev => ({
          ...prev,
          realTimeAlerts: alerts
        }));
      }
    } catch (error) {
      console.error('Error loading intelligence:', error);
    }
    
    setLoading(false);
  };

  const processMCPResults = (mcpResults, config) => {
    const intelligence = {
      stakeholderInsights: [],
      industryTrends: [],
      competitiveIntel: [],
      mediaOpportunities: [],
      realTimeAlerts: []
    };

    // Process media monitoring results
    if (mcpResults.media_monitoring?.data) {
      mcpResults.media_monitoring.data.forEach(query => {
        intelligence.mediaOpportunities.push({
          type: 'media_query',
          event: query.outlet || 'Media Outlet',
          topic: query.topic,
          deadline: query.deadline,
          visibility: 'high',
          audience: query.audience || 'Industry professionals'
        });
      });
    }

    // Process competitor analysis
    if (mcpResults.competitor_analysis?.data) {
      mcpResults.competitor_analysis.data.forEach(competitor => {
        intelligence.competitiveIntel.push({
          stakeholder: 'Competitors',
          type: 'competitive',
          title: competitor.name || 'Competitor Activity',
          insight: competitor.insight,
          relevance: 'high',
          actionable: true,
          suggestedAction: competitor.action,
          source: 'MCP Analysis',
          timestamp: new Date().toISOString()
        });
      });
    }

    // Process opportunity scanner
    if (mcpResults.opportunity_scanner?.data) {
      mcpResults.opportunity_scanner.data.forEach(opp => {
        intelligence.stakeholderInsights.push({
          stakeholder: 'Opportunity Scanner',
          type: 'opportunity',
          title: opp.title || 'Opportunity Detected',
          insight: opp.description,
          relevance: opp.priority || 'medium',
          actionable: true,
          suggestedAction: opp.action,
          source: 'Opportunity Analysis',
          timestamp: new Date().toISOString()
        });
      });
    }

    // Add summaries from other MCPs
    Object.entries(mcpResults).forEach(([serviceId, result]) => {
      if (result.summary && !['media_monitoring', 'competitor_analysis', 'opportunity_scanner'].includes(serviceId)) {
        intelligence.stakeholderInsights.push({
          stakeholder: serviceId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'analysis',
          title: result.summary,
          insight: `Analysis complete: ${result.count || 0} items processed`,
          relevance: 'medium',
          actionable: false,
          source: 'MCP Analysis',
          timestamp: new Date().toISOString()
        });
      }
    });

    return intelligence;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await intelligenceService.searchIntelligence(searchQuery);
      // Handle search results
      console.log('Search results:', results);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  const renderInsights = () => {
    const allInsights = [
      ...intelligenceData.stakeholderInsights,
      ...intelligenceData.competitiveIntel
    ].sort((a, b) => {
      // Sort by relevance then by timestamp
      const relevanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (a.relevance !== b.relevance) {
        return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return (
      <div className="tab-content">
        <div className="insights-header">
          <h3>Real-Time Intelligence Insights</h3>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search intelligence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-button">
              🔍 Search
            </button>
          </div>
        </div>

        {/* Real-time Alerts */}
        {intelligenceData.realTimeAlerts.length > 0 && (
          <div className="alerts-section">
            {intelligenceData.realTimeAlerts.map((alert, idx) => (
              <div key={idx} className={`alert-card ${alert.level}`}>
                <div className="alert-header">
                  <span className="alert-icon">
                    {alert.level === 'critical' ? '🚨' : 
                     alert.level === 'opportunity' ? '💡' : 'ℹ️'}
                  </span>
                  <strong>{alert.title}</strong>
                  {alert.actionRequired && <span className="action-badge">Action Required</span>}
                </div>
                <p>{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actionable Insights */}
        <div className="insights-grid">
          {allInsights.length > 0 ? (
            allInsights.map((insight, idx) => (
              <div key={idx} className={`insight-card relevance-${insight.relevance}`}>
                <div className="insight-header">
                  <div className="insight-meta">
                    <span className="insight-stakeholder">{insight.stakeholder}</span>
                    <span className="insight-type">{insight.type}</span>
                  </div>
                  <span className={`relevance-badge ${insight.relevance}`}>
                    {insight.relevance}
                  </span>
                </div>
                
                <h4 className="insight-title">{insight.title}</h4>
                <p className="insight-content">{insight.insight}</p>
                
                {insight.actionable && (
                  <div className="insight-action">
                    <strong>Recommended Action:</strong>
                    <p>{insight.suggestedAction}</p>
                    {insight.deadline && (
                      <span className="deadline">Deadline: {insight.deadline}</span>
                    )}
                  </div>
                )}
                
                <div className="insight-footer">
                  <span className="insight-source">Source: {insight.source}</span>
                  <span className="insight-time">
                    {new Date(insight.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-insights">
              <p>Gathering intelligence...</p>
              <p className="subtle">Real-time insights will appear here as they're discovered.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOpportunities = () => {
    return (
      <div className="tab-content">
        <h3>Media & Speaking Opportunities</h3>
        
        {intelligenceData.mediaOpportunities.length > 0 ? (
          <div className="opportunities-grid">
            {intelligenceData.mediaOpportunities.map((opp, idx) => (
              <div key={idx} className="opportunity-card">
                <div className="opp-header">
                  <span className="opp-type-badge">{opp.type}</span>
                  <span className={`visibility-badge ${opp.visibility}`}>
                    {opp.visibility} visibility
                  </span>
                </div>
                
                <h4>{opp.event || opp.show || opp.publication}</h4>
                <p className="opp-topic">{opp.topic}</p>
                
                <div className="opp-details">
                  <div className="detail-item">
                    <strong>Audience:</strong>
                    <span>{opp.audience}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Deadline:</strong>
                    <span>{opp.deadline || opp.availability}</span>
                  </div>
                </div>
                
                <button className="action-button">
                  Express Interest →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No media opportunities at the moment</p>
            <p className="subtle">Check back soon for speaking engagements and media queries.</p>
          </div>
        )}
      </div>
    );
  };

  const renderTrends = () => {
    return (
      <div className="tab-content">
        <h3>Industry Trends & Analysis</h3>
        
        {intelligenceData.industryTrends.length > 0 ? (
          <div className="trends-grid">
            {intelligenceData.industryTrends.map((trend, idx) => (
              <div key={idx} className="trend-card">
                <div className="trend-header">
                  <h4>{trend.trend}</h4>
                  <span className={`impact-badge ${trend.impact}`}>
                    {trend.impact} impact
                  </span>
                </div>
                
                <p className="trend-description">{trend.description}</p>
                
                <div className="trend-opportunity">
                  <strong>💡 Opportunity:</strong>
                  <p>{trend.opportunity}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Loading industry trends...</p>
          </div>
        )}

        {/* Competitive Intelligence Section */}
        {intelligenceData.competitiveIntel.length > 0 && (
          <>
            <h3 className="section-divider">Competitive Intelligence</h3>
            <div className="competitive-grid">
              {intelligenceData.competitiveIntel.map((intel, idx) => (
                <div key={idx} className={`competitive-card ${intel.relevance}`}>
                  <h4>{intel.title}</h4>
                  <p>{intel.insight}</p>
                  {intel.suggestedAction && (
                    <div className="suggested-action">
                      <strong>Action:</strong> {intel.suggestedAction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="module-container intelligence-module">
      <div className="module-header">
        <div className="header-top">
          <h2>🔍 Intelligence Hub</h2>
          <div className="refresh-indicator">
            <span className="refresh-time">Last refresh: {intelligenceData.lastRefresh}</span>
            <button onClick={loadRealIntelligence} className="refresh-button" disabled={loading}>
              🔄 Refresh
            </button>
          </div>
        </div>
        <div className="module-tabs">
          <button 
            className={activeTab === 'insights' ? 'active' : ''}
            onClick={() => setActiveTab('insights')}
          >
            Insights & Alerts
            {intelligenceData.realTimeAlerts.length > 0 && (
              <span className="alert-count">{intelligenceData.realTimeAlerts.length}</span>
            )}
          </button>
          <button 
            className={activeTab === 'opportunities' ? 'active' : ''}
            onClick={() => setActiveTab('opportunities')}
          >
            Opportunities
            {intelligenceData.mediaOpportunities.length > 0 && (
              <span className="opp-count">{intelligenceData.mediaOpportunities.length}</span>
            )}
          </button>
          <button 
            className={activeTab === 'trends' ? 'active' : ''}
            onClick={() => setActiveTab('trends')}
          >
            Trends & Competition
          </button>
        </div>
      </div>
      
      <div className="module-content">
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Gathering intelligence...</p>
          </div>
        ) : (
          <>
            {activeTab === 'insights' && renderInsights()}
            {activeTab === 'opportunities' && renderOpportunities()}
            {activeTab === 'trends' && renderTrends()}
          </>
        )}
      </div>
    </div>
  );
};

export default IntelligenceModuleV3;