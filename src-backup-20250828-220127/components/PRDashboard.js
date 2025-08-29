import React, { useState, useEffect } from 'react';
import './PRDashboard.css';

const PRDashboard = ({ organization }) => {
  const [activeTab, setActiveTab] = useState('now');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (organization) {
      fetchPRIntelligence();
    }
  }, [organization]);

  const fetchPRIntelligence = async () => {
    setLoading(true);
    try {
      // Use existing intelligence gathering for now (Firecrawl out of credits)
      // Fall back to v3 gathering which uses RSS feeds
      const gatherResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-gathering-v3',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0'
          },
          body: JSON.stringify({
            entities: {
              competitors: organization?.competitors || ['Walmart', 'Amazon', 'Costco']
            },
            organization
          })
        }
      );

      if (gatherResponse.ok) {
        const gatherData = await gatherResponse.json();
        
        // Transform v3 data to PR intelligence format
        const intelligence = {
          competitor_moves: gatherData.entity_actions?.all?.filter(a => a.type === 'competitor' || a.relevance > 0.7) || [],
          trending_narratives: gatherData.topic_trends?.all || [],
          media_opportunities: [],
          journalist_activity: [],
          crisis_signals: []
        };
        
        // Then synthesize into PR dashboard
        const synthesisResponse = await fetch(
          'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/pr-synthesis',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0'
            },
            body: JSON.stringify({
              organization,
              intelligence
            })
          }
        );

        if (synthesisResponse.ok) {
          const result = await synthesisResponse.json();
          setDashboard(result.dashboard);
        }
      }
    } catch (error) {
      console.error('Error fetching PR intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderNowTab = () => {
    if (!dashboard?.now) return <div>No urgent items</div>;
    
    return (
      <div className="now-tab">
        {dashboard.now.urgent_actions.length > 0 && (
          <div className="section urgent-actions">
            <h3>🚨 Urgent Actions Required</h3>
            {dashboard.now.urgent_actions.map((action, idx) => (
              <div key={idx} className="urgent-action-card">
                <div className="action-header">
                  <span className="action-type">{action.type}</span>
                  <span className="deadline">{action.deadline}</span>
                </div>
                <div className="action-title">{action.their_move}</div>
                <div className="our-angle">{action.our_angle}</div>
                <button 
                  className="action-btn"
                  onClick={() => setSelectedItem(action)}
                >
                  Take Action →
                </button>
              </div>
            ))}
          </div>
        )}

        {dashboard.now.active_conversations.length > 0 && (
          <div className="section active-conversations">
            <h3>💬 Active Media Conversations</h3>
            <div className="conversation-list">
              {dashboard.now.active_conversations.map((conv, idx) => (
                <div key={idx} className="conversation-item">
                  <span className="topic">{conv.topic}</span>
                  <span className={`momentum ${conv.momentum.toLowerCase()}`}>
                    {conv.momentum}
                  </span>
                  <span className="action">{conv.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dashboard.now.monitoring.length > 0 && (
          <div className="section monitoring">
            <h3>👁️ Monitoring</h3>
            {dashboard.now.monitoring.map((item, idx) => (
              <div key={idx} className="monitor-item">
                <span className="monitor-type">{item.type}</span>
                <span className="monitor-issue">{item.issue}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOpportunitiesTab = () => {
    if (!dashboard?.opportunities) return <div>No opportunities</div>;
    
    return (
      <div className="opportunities-tab">
        {dashboard.opportunities.media_pitches.length > 0 && (
          <div className="section media-pitches">
            <h3>📰 Media Pitch Opportunities</h3>
            {dashboard.opportunities.media_pitches.map((pitch, idx) => (
              <div key={idx} className="pitch-card">
                <div className="pitch-header">
                  <span className="journalist">{pitch.journalist}</span>
                  <span className="publication">{pitch.publication}</span>
                </div>
                <div className="recent-coverage">
                  Recently wrote: {pitch.recent_coverage}
                </div>
                <div className="pitch-angle">{pitch.pitch_angle}</div>
                <div className="talking-points">
                  {pitch.talking_points?.map((point, i) => (
                    <div key={i} className="point">• {point}</div>
                  ))}
                </div>
                <button className="pitch-btn">Draft Pitch</button>
              </div>
            ))}
          </div>
        )}

        {dashboard.opportunities.thought_leadership.length > 0 && (
          <div className="section thought-leadership">
            <h3>💡 Thought Leadership</h3>
            {dashboard.opportunities.thought_leadership.map((item, idx) => (
              <div key={idx} className="thought-card">
                <div className="thought-topic">{item.topic}</div>
                <div className="thought-angle">{item.angle}</div>
                <div className="content-ideas">
                  {item.content_ideas?.map((idea, i) => (
                    <div key={i} className="idea">• {idea}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {dashboard.opportunities.newsjacking.length > 0 && (
          <div className="section newsjacking">
            <h3>⚡ Newsjacking Opportunities</h3>
            {dashboard.opportunities.newsjacking.map((news, idx) => (
              <div key={idx} className="news-card">
                <div className="news-opportunity">{news.opportunity}</div>
                <div className="news-angle">{news.angle}</div>
                <div className="news-deadline">Act by: {news.deadline}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderIntelTab = () => {
    if (!dashboard?.intel) return <div>No intelligence</div>;
    
    return (
      <div className="intel-tab">
        {dashboard.intel.competitor_activity.length > 0 && (
          <div className="section competitor-activity">
            <h3>🎯 Competitor Activity</h3>
            {dashboard.intel.competitor_activity.map((activity, idx) => (
              <div key={idx} className="competitor-card">
                <div className="competitor-name">{activity.competitor}</div>
                <div className="competitor-action">{activity.activity}</div>
                <div className="competitor-meta">
                  <span className="publication">{activity.publication}</span>
                  {activity.journalist && (
                    <span className="journalist">by {activity.journalist}</span>
                  )}
                </div>
                <div className="implications">{activity.implications}</div>
              </div>
            ))}
          </div>
        )}

        {dashboard.intel.market_dynamics.length > 0 && (
          <div className="section market-dynamics">
            <h3>📈 Market Dynamics</h3>
            {dashboard.intel.market_dynamics.map((dynamic, idx) => (
              <div key={idx} className="market-card">
                <div className="market-theme">{dynamic.theme}</div>
                <div className="market-opportunity">{dynamic.opportunity}</div>
                {dynamic.risk && (
                  <div className="market-risk">Risk: {dynamic.risk}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderExecuteTab = () => {
    if (!dashboard?.execute) return <div>No action items</div>;
    
    return (
      <div className="execute-tab">
        {dashboard.execute.action_items.length > 0 && (
          <div className="section action-items">
            <h3>✅ Action Items</h3>
            {dashboard.execute.action_items.map((item, idx) => (
              <div key={idx} className="action-item">
                <div className="action-task">{item.task}</div>
                <div className="action-meta">
                  <span className="priority">{item.priority}</span>
                  <span className="deadline">{item.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {dashboard.execute.media_targets.length > 0 && (
          <div className="section media-targets">
            <h3>🎯 Media Targets</h3>
            {dashboard.execute.media_targets.map((target, idx) => (
              <div key={idx} className="target-card">
                <div className="target-name">{target.name}</div>
                <div className="target-publication">{target.publication}</div>
                <div className="target-topics">
                  Topics: {target.topics.join(', ')}
                </div>
                <button className="contact-btn">Add to Outreach</button>
              </div>
            ))}
          </div>
        )}

        {dashboard.execute.talking_points.length > 0 && (
          <div className="section talking-points">
            <h3>💬 Talking Points</h3>
            {dashboard.execute.talking_points.map((tp, idx) => (
              <div key={idx} className="talking-point-card">
                <div className="tp-topic">{tp.topic}</div>
                {tp.points.map((point, i) => (
                  <div key={i} className="tp-point">• {point}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="pr-dashboard loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Gathering PR Intelligence...</div>
      </div>
    );
  }

  return (
    <div className="pr-dashboard">
      <div className="dashboard-header">
        <h1>PR Command Center</h1>
        <div className="org-name">{organization?.name}</div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'now' ? 'active' : ''}`}
          onClick={() => setActiveTab('now')}
        >
          NOW
          {dashboard?.now?.urgent_actions?.length > 0 && (
            <span className="badge">{dashboard.now.urgent_actions.length}</span>
          )}
        </button>
        <button 
          className={`tab ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          OPPORTUNITIES
        </button>
        <button 
          className={`tab ${activeTab === 'intel' ? 'active' : ''}`}
          onClick={() => setActiveTab('intel')}
        >
          INTEL
        </button>
        <button 
          className={`tab ${activeTab === 'execute' ? 'active' : ''}`}
          onClick={() => setActiveTab('execute')}
        >
          EXECUTE
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'now' && renderNowTab()}
        {activeTab === 'opportunities' && renderOpportunitiesTab()}
        {activeTab === 'intel' && renderIntelTab()}
        {activeTab === 'execute' && renderExecuteTab()}
      </div>

      {selectedItem && (
        <div className="modal" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Action Details</h2>
            <pre>{JSON.stringify(selectedItem, null, 2)}</pre>
            <button onClick={() => setSelectedItem(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PRDashboard;