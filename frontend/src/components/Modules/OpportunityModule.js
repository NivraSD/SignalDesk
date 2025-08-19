import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import './ModuleStyles.css';

const OpportunityModule = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('queue');
  const [opportunities, setOpportunities] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    minScore: 0,
    status: 'pending'
  });
  const [loading, setLoading] = useState(true);
  const [userConfig, setUserConfig] = useState(null);

  useEffect(() => {
    // Load user's onboarding configuration
    const savedOnboarding = localStorage.getItem('signaldesk_onboarding');
    if (savedOnboarding) {
      const config = JSON.parse(savedOnboarding);
      setUserConfig(config.opportunities);
      console.log('📊 Opportunity Module loaded config:', config.opportunities);
    }
    
    if (organizationId) {
      loadOpportunities();
    }
  }, [organizationId, filters]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      // First try to call the Supabase Edge Function
      if (organizationId) {
        try {
          console.log('🎯 Calling assess-opportunities-simple with org:', organizationId);
          const { data, error } = await supabase.functions.invoke('assess-opportunities-simple', {
            body: {
              organizationId,
              forceRefresh: false
            }
          });

          console.log('📊 Edge Function response:', { data, error });

          // Check for successful response or fallback message
          if (data && data.opportunities && Array.isArray(data.opportunities)) {
            // Process opportunities from Edge Function
            const scoredOpportunities = data.opportunities.map(opp => ({
              ...opp,
              priority_score: opp.adjusted_score || opp.score || opp.base_score,
              configured_weight: userConfig?.[opp.opportunity_type]?.weight || 50,
              opportunity_data: {
                description: opp.description || opp.suggested_action || ''
              }
            }));

            // Apply local filters
            const filtered = scoredOpportunities.filter(opp => {
              if (filters.type !== 'all' && opp.opportunity_type !== filters.type) return false;
              if (opp.priority_score < filters.minScore) return false;
              if (filters.status !== 'all' && opp.status !== filters.status) return false;
              return true;
            });

            filtered.sort((a, b) => b.priority_score - a.priority_score);
            setOpportunities(filtered);
            setLoading(false);
            return;
          }
        } catch (edgeFunctionError) {
          console.warn('Edge Function not available, using fallback:', edgeFunctionError);
          // Continue to fallback mock data
        }
      }

      // Fallback to mock data if Edge Function fails or no organizationId
      const mockOpportunities = [
        {
          id: 1,
          opportunity_type: 'trending',
          title: 'AI Ethics Discussion Trending',
          opportunity_data: {
            description: 'Major tech conference next week focusing on AI ethics - perfect timing for thought leadership'
          },
          base_score: 85,
          urgency: 'high',
          window_end: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 2,
          opportunity_type: 'competitor_gap',
          title: 'Competitor Vulnerability Detected',
          opportunity_data: {
            description: 'Competitor facing criticism over data practices - opportunity to highlight our privacy-first approach'
          },
          base_score: 78,
          urgency: 'high',
          window_end: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 3,
          opportunity_type: 'news_hook',
          title: 'Breaking: Industry Report Release',
          opportunity_data: {
            description: 'Gartner releasing annual industry report - chance to provide expert commentary'
          },
          base_score: 75,
          urgency: 'medium',
          window_end: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 4,
          opportunity_type: 'journalist_interest',
          title: 'WSJ Reporter Seeking Sources',
          opportunity_data: {
            description: 'Wall Street Journal tech reporter looking for expert sources on enterprise AI adoption'
          },
          base_score: 82,
          urgency: 'high',
          window_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 5,
          opportunity_type: 'award',
          title: 'Tech Innovation Awards Open',
          opportunity_data: {
            description: 'Nominations open for annual tech innovation awards - deadline in 2 weeks'
          },
          base_score: 65,
          urgency: 'medium',
          window_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 6,
          opportunity_type: 'speaking',
          title: 'Panel Opportunity: Future of Work',
          opportunity_data: {
            description: 'Conference seeking panelists for Future of Work discussion next month'
          },
          base_score: 70,
          urgency: 'low',
          window_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 7,
          opportunity_type: 'editorial_calendar',
          title: 'Q2 Tech Trends Feature',
          opportunity_data: {
            description: 'TechCrunch planning Q2 trends roundup - accepting expert predictions'
          },
          base_score: 68,
          urgency: 'medium',
          window_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ];

      // Apply user configuration weights to mock data
      const scoredOpportunities = mockOpportunities.map(opp => {
        let finalScore = opp.base_score;
        
        if (userConfig && userConfig[opp.opportunity_type]) {
          const typeConfig = userConfig[opp.opportunity_type];
          if (typeConfig.enabled) {
            const weightMultiplier = 0.5 + (typeConfig.weight / 100);
            finalScore = Math.round(opp.base_score * weightMultiplier);
          } else {
            finalScore = 0;
          }
        }
        
        return {
          ...opp,
          priority_score: finalScore,
          configured_weight: userConfig?.[opp.opportunity_type]?.weight || 50
        };
      });

      const minScore = userConfig?.minimumScore || 0;
      
      const filtered = scoredOpportunities.filter(opp => {
        if (userConfig && userConfig[opp.opportunity_type] && !userConfig[opp.opportunity_type].enabled) {
          return false;
        }
        if (filters.type !== 'all' && opp.opportunity_type !== filters.type) return false;
        if (opp.priority_score < filters.minScore || opp.priority_score < minScore) return false;
        if (filters.status !== 'all' && opp.status !== filters.status) return false;
        return true;
      });

      filtered.sort((a, b) => b.priority_score - a.priority_score);
      setOpportunities(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      setLoading(false);
    }
  };

  const calculateTimeWindow = (opportunity) => {
    if (!opportunity.window_end) return 'No deadline';
    const now = new Date();
    const end = new Date(opportunity.window_end);
    const hours = Math.floor((end - now) / (1000 * 60 * 60));
    
    if (hours < 0) return 'Expired';
    if (hours < 24) return `${hours} hours`;
    if (hours < 168) return `${Math.floor(hours / 24)} days`;
    return `${Math.floor(hours / 168)} weeks`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Orange
    if (score >= 40) return '#3B82F6'; // Blue
    return '#6B7280'; // Gray
  };

  const renderOpportunityQueue = () => (
    <div className="opportunity-queue">
      <div className="queue-filters">
        <select 
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="all">All Types</option>
          <option value="trend">Trending Topics</option>
          <option value="news">News Events</option>
          <option value="competitor">Competitor Moves</option>
          <option value="niv">Strategic Insights</option>
          <option value="event">Industry Events</option>
        </select>

        <select 
          className="filter-select"
          value={filters.minScore}
          onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
        >
          <option value="0">All Scores</option>
          <option value="60">Score ≥ 60</option>
          <option value="70">Score ≥ 70</option>
          <option value="80">Score ≥ 80</option>
          <option value="90">Score ≥ 90</option>
        </select>

        <select 
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="all">All Status</option>
        </select>
      </div>

      <div className="opportunities-list">
        {opportunities.length > 0 ? (
          opportunities.map((opp) => (
            <div key={opp.id} className="opportunity-card">
              <div className="opp-header">
                <div className="opp-type-badge">{opp.opportunity_type.replace('_', ' ')}</div>
                <div className="opp-time-window">{calculateTimeWindow(opp)}</div>
                {userConfig && userConfig[opp.opportunity_type] && (
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                    Weight: {opp.configured_weight}%
                  </div>
                )}
              </div>
              
              <div className="opp-content">
                <h4 className="opp-title">{opp.title || 'Untitled Opportunity'}</h4>
                <p className="opp-description">
                  {opp.opportunity_data?.description || 'No description available'}
                </p>
              </div>

              <div className="opp-scores">
                <div className="score-item">
                  <span className="score-label">CRS</span>
                  <div 
                    className="score-value"
                    style={{ color: getScoreColor(opp.crs_score) }}
                  >
                    {opp.crs_score || 0}
                  </div>
                </div>
                <div className="score-item">
                  <span className="score-label">NVS</span>
                  <div 
                    className="score-value"
                    style={{ color: getScoreColor(opp.nvs_score) }}
                  >
                    {opp.nvs_score || 0}
                  </div>
                </div>
                <div className="score-item">
                  <span className="score-label">Priority</span>
                  <div 
                    className="score-value"
                    style={{ color: getScoreColor(opp.priority_score) }}
                  >
                    {opp.priority_score || 0}
                  </div>
                </div>
              </div>

              <div className="opp-actions">
                <button className="action-btn primary">
                  Execute Campaign
                </button>
                <button className="action-btn secondary">
                  View Details
                </button>
                <button className="action-btn ghost">
                  Dismiss
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No opportunities found</h3>
            <p>Adjust your filters or wait for new opportunities to be detected</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderScoring = () => (
    <div className="opportunity-scoring">
      <h3 className="section-title">Scoring Configuration</h3>
      
      <div className="scoring-sections">
        <div className="scoring-card">
          <h4>CRS (Content Relevance Score)</h4>
          <p className="scoring-description">
            Measures how well an opportunity aligns with your brand narrative and current PR objectives
          </p>
          <div className="scoring-factors">
            <div className="factor">
              <span className="factor-name">Brand Alignment</span>
              <span className="factor-weight">40%</span>
            </div>
            <div className="factor">
              <span className="factor-name">Objective Match</span>
              <span className="factor-weight">30%</span>
            </div>
            <div className="factor">
              <span className="factor-name">Audience Relevance</span>
              <span className="factor-weight">30%</span>
            </div>
          </div>
        </div>

        <div className="scoring-card">
          <h4>NVS (News Value Score)</h4>
          <p className="scoring-description">
            Evaluates the newsworthiness and media appeal of an opportunity
          </p>
          <div className="scoring-factors">
            <div className="factor">
              <span className="factor-name">Timeliness</span>
              <span className="factor-weight">35%</span>
            </div>
            <div className="factor">
              <span className="factor-name">Impact</span>
              <span className="factor-weight">35%</span>
            </div>
            <div className="factor">
              <span className="factor-name">Uniqueness</span>
              <span className="factor-weight">30%</span>
            </div>
          </div>
        </div>

        <div className="scoring-card">
          <h4>Priority Score</h4>
          <p className="scoring-description">
            Combined score that factors in urgency, impact, and resource requirements
          </p>
          <div className="scoring-formula">
            Priority = (CRS × 0.4) + (NVS × 0.4) + (Urgency × 0.2)
          </div>
        </div>
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="opportunity-predictions">
      <h3 className="section-title">Opportunity Predictions</h3>
      
      <div className="predictions-grid">
        <div className="prediction-card">
          <div className="prediction-header">
            <span className="prediction-icon">📈</span>
            <h4>Upcoming Trends</h4>
          </div>
          <div className="prediction-items">
            <div className="prediction-item">
              <span className="prediction-name">AI Ethics Discussion</span>
              <span className="prediction-eta">2-3 days</span>
            </div>
            <div className="prediction-item">
              <span className="prediction-name">Sustainability Reports</span>
              <span className="prediction-eta">1 week</span>
            </div>
            <div className="prediction-item">
              <span className="prediction-name">Q1 Earnings Season</span>
              <span className="prediction-eta">2 weeks</span>
            </div>
          </div>
        </div>

        <div className="prediction-card">
          <div className="prediction-header">
            <span className="prediction-icon">🎯</span>
            <h4>Competitor Actions</h4>
          </div>
          <div className="prediction-items">
            <div className="prediction-item">
              <span className="prediction-name">Product Launch (Competitor A)</span>
              <span className="prediction-eta">Next week</span>
            </div>
            <div className="prediction-item">
              <span className="prediction-name">Partnership Announcement</span>
              <span className="prediction-eta">3-5 days</span>
            </div>
          </div>
        </div>

        <div className="prediction-card">
          <div className="prediction-header">
            <span className="prediction-icon">📰</span>
            <h4>Media Cycles</h4>
          </div>
          <div className="prediction-items">
            <div className="prediction-item">
              <span className="prediction-name">Tech Innovation Focus</span>
              <span className="prediction-eta">This week</span>
            </div>
            <div className="prediction-item">
              <span className="prediction-name">Industry Conference Coverage</span>
              <span className="prediction-eta">10 days</span>
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
        <p>Loading Opportunities...</p>
      </div>
    );
  }

  return (
    <div className="opportunity-module">
      <div className="module-header">
        <h2 className="module-title">
          <span className="module-icon">🎯</span>
          Opportunity Engine
        </h2>
        <div className="module-tabs">
          <button 
            className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            Queue
          </button>
          <button 
            className={`tab ${activeTab === 'scoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('scoring')}
          >
            Scoring
          </button>
          <button 
            className={`tab ${activeTab === 'predictions' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictions')}
          >
            Predictions
          </button>
        </div>
      </div>

      <div className="module-body">
        {activeTab === 'queue' && renderOpportunityQueue()}
        {activeTab === 'scoring' && renderScoring()}
        {activeTab === 'predictions' && renderPredictions()}
      </div>
    </div>
  );
};

export default OpportunityModule;