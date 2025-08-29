import React, { useState, useEffect } from 'react';
import './ModuleStyles.css';

const MemoryVaultModule = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('knowledge');
  const [memories, setMemories] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [insights, setInsights] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadMemoryData();
    }
  }, [organizationId]);

  const loadMemoryData = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      setTimeout(() => {
        setMemories([
          {
            id: 1,
            memory_type: 'campaign_outcome',
            memory_key: 'email_campaign_q3',
            memory_value: { open_rate: 0.42, ctr: 0.08 },
            confidence_score: 0.95,
            created_at: new Date().toISOString()
          }
        ]);
        
        setPatterns([
          {
            id: 1,
            pattern_type: 'timing',
            pattern_name: 'Morning Release Success',
            success_rate: 0.87,
            usage_count: 45
          }
        ]);
        
        setLoading(false);
      }, 600);
    } catch (error) {
      console.error('Error loading memory data:', error);
      setLoading(false);
    }
  };

  const memoryCategories = [
    { type: 'campaign_outcomes', label: 'Campaign Outcomes', icon: '📊', count: 127 },
    { type: 'media_relationships', label: 'Media Relationships', icon: '📰', count: 89 },
    { type: 'messaging_patterns', label: 'Messaging Patterns', icon: '💬', count: 45 },
    { type: 'crisis_responses', label: 'Crisis Responses', icon: '🚨', count: 12 },
    { type: 'competitor_strategies', label: 'Competitor Strategies', icon: '🎯', count: 67 },
    { type: 'audience_insights', label: 'Audience Insights', icon: '👥', count: 234 }
  ];

  const renderKnowledgeBase = () => (
    <div className="memoryvault-knowledge">
      <div className="knowledge-header">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">🔍 Search</button>
        </div>
        <button className="primary-btn">+ Add Memory</button>
      </div>

      <div className="memory-categories">
        {memoryCategories.map((category) => (
          <div key={category.type} className="category-card">
            <div className="category-icon">{category.icon}</div>
            <div className="category-info">
              <div className="category-label">{category.label}</div>
              <div className="category-count">{category.count} entries</div>
            </div>
            <div className="category-trend">+12% this month</div>
          </div>
        ))}
      </div>

      <div className="recent-memories">
        <h3 className="section-title">Recent Memories</h3>
        <div className="memories-list">
          <div className="memory-item">
            <div className="memory-header">
              <span className="memory-type">Campaign Outcome</span>
              <span className="memory-date">2 hours ago</span>
            </div>
            <div className="memory-content">
              <strong>Product Launch Campaign:</strong> Email open rate of 42% exceeded target by 12%. 
              Subject line with emoji performed 3x better than plain text.
            </div>
            <div className="memory-meta">
              <span className="confidence">Confidence: 95%</span>
              <span className="source">Source: Campaign Analytics</span>
            </div>
          </div>

          <div className="memory-item">
            <div className="memory-header">
              <span className="memory-type">Media Relationship</span>
              <span className="memory-date">Yesterday</span>
            </div>
            <div className="memory-content">
              <strong>TechCrunch Reporter:</strong> Prefers exclusive stories, responds best to Tuesday morning pitches. 
              Interested in AI ethics and sustainability topics.
            </div>
            <div className="memory-meta">
              <span className="confidence">Confidence: 88%</span>
              <span className="source">Source: Email Interactions</span>
            </div>
          </div>

          <div className="memory-item">
            <div className="memory-header">
              <span className="memory-type">Messaging Pattern</span>
              <span className="memory-date">3 days ago</span>
            </div>
            <div className="memory-content">
              <strong>Crisis Communication:</strong> Transparent, early communication reduces negative sentiment by 65%. 
              CEO statement within first 2 hours critical for trust.
            </div>
            <div className="memory-meta">
              <span className="confidence">Confidence: 92%</span>
              <span className="source">Source: Historical Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatterns = () => (
    <div className="memoryvault-patterns">
      <h3 className="section-title">Learned Patterns</h3>
      
      <div className="patterns-grid">
        <div className="pattern-card success">
          <div className="pattern-header">
            <span className="pattern-icon">✅</span>
            <h4>Successful Patterns</h4>
          </div>
          <div className="pattern-list">
            <div className="pattern-item">
              <div className="pattern-name">Morning Press Release Timing</div>
              <div className="pattern-stats">
                <span className="success-rate">87% success rate</span>
                <span className="usage">Used 45 times</span>
              </div>
              <div className="pattern-description">
                Releases sent between 9-10 AM EST get 3x more coverage
              </div>
            </div>
            <div className="pattern-item">
              <div className="pattern-name">Data-Driven Headlines</div>
              <div className="pattern-stats">
                <span className="success-rate">92% success rate</span>
                <span className="usage">Used 67 times</span>
              </div>
              <div className="pattern-description">
                Headlines with specific metrics get 2.5x more engagement
              </div>
            </div>
            <div className="pattern-item">
              <div className="pattern-name">Exclusive Media Previews</div>
              <div className="pattern-stats">
                <span className="success-rate">78% success rate</span>
                <span className="usage">Used 23 times</span>
              </div>
              <div className="pattern-description">
                24-hour exclusive to tier-1 media increases overall coverage
              </div>
            </div>
          </div>
        </div>

        <div className="pattern-card warning">
          <div className="pattern-header">
            <span className="pattern-icon">⚠️</span>
            <h4>Patterns to Avoid</h4>
          </div>
          <div className="pattern-list">
            <div className="pattern-item">
              <div className="pattern-name">Friday Afternoon Announcements</div>
              <div className="pattern-stats">
                <span className="failure-rate">73% lower engagement</span>
                <span className="usage">Avoided 12 times</span>
              </div>
              <div className="pattern-description">
                News released after 3 PM Friday gets minimal coverage
              </div>
            </div>
            <div className="pattern-item">
              <div className="pattern-name">Technical Jargon in Headlines</div>
              <div className="pattern-stats">
                <span className="failure-rate">65% lower pickup</span>
                <span className="usage">Avoided 34 times</span>
              </div>
              <div className="pattern-description">
                Overly technical language reduces mainstream media interest
              </div>
            </div>
          </div>
        </div>

        <div className="pattern-card emerging">
          <div className="pattern-header">
            <span className="pattern-icon">🔄</span>
            <h4>Emerging Patterns</h4>
          </div>
          <div className="pattern-list">
            <div className="pattern-item">
              <div className="pattern-name">Video-First Announcements</div>
              <div className="pattern-stats">
                <span className="trend">+45% engagement</span>
                <span className="usage">Testing: 8 times</span>
              </div>
              <div className="pattern-description">
                Short video teasers before official announcements showing promise
              </div>
            </div>
            <div className="pattern-item">
              <div className="pattern-name">Thread-Style Narratives</div>
              <div className="pattern-stats">
                <span className="trend">+32% reach</span>
                <span className="usage">Testing: 5 times</span>
              </div>
              <div className="pattern-description">
                Breaking news into social media threads increases virality
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLearnings = () => (
    <div className="memoryvault-learnings">
      <h3 className="section-title">Strategic Learnings</h3>
      
      <div className="learnings-timeline">
        <div className="learning-entry">
          <div className="learning-date">This Week</div>
          <div className="learning-cards">
            <div className="learning-card">
              <div className="learning-type">Audience Insight</div>
              <div className="learning-content">
                Developer audience engagement peaks during hackathon seasons (March, June, October). 
                Plan technical announcements around these periods.
              </div>
              <div className="learning-impact">High Impact</div>
            </div>
            <div className="learning-card">
              <div className="learning-type">Competitor Analysis</div>
              <div className="learning-content">
                Competitor A's partnership announcements follow a predictable quarterly pattern. 
                Opportunity to counter-program with strategic timing.
              </div>
              <div className="learning-impact">Medium Impact</div>
            </div>
          </div>
        </div>

        <div className="learning-entry">
          <div className="learning-date">Last Week</div>
          <div className="learning-cards">
            <div className="learning-card">
              <div className="learning-type">Crisis Learning</div>
              <div className="learning-content">
                Quick response with employee testimonials reduced crisis duration by 60%. 
                Internal voices more trusted than executive statements alone.
              </div>
              <div className="learning-impact">Critical Learning</div>
            </div>
            <div className="learning-card">
              <div className="learning-type">Media Preference</div>
              <div className="learning-content">
                Industry publications prefer detailed technical deep-dives over surface-level announcements. 
                Include architecture diagrams and code samples.
              </div>
              <div className="learning-impact">High Impact</div>
            </div>
          </div>
        </div>

        <div className="learning-entry">
          <div className="learning-date">Last Month</div>
          <div className="learning-cards">
            <div className="learning-card">
              <div className="learning-type">Campaign Optimization</div>
              <div className="learning-content">
                Multi-channel campaigns with 5+ touchpoints generate 3x more qualified leads than single-channel efforts. 
                Minimum viable campaign should include: press release, blog, social, email, and partner outreach.
              </div>
              <div className="learning-impact">Strategic Priority</div>
            </div>
          </div>
        </div>
      </div>

      <div className="insights-summary">
        <h4>Key Insights This Quarter</h4>
        <div className="insights-grid">
          <div className="insight-stat">
            <div className="stat-value">73%</div>
            <div className="stat-label">Pattern Recognition Accuracy</div>
          </div>
          <div className="insight-stat">
            <div className="stat-value">156</div>
            <div className="stat-label">New Patterns Identified</div>
          </div>
          <div className="insight-stat">
            <div className="stat-value">89%</div>
            <div className="stat-label">Successful Predictions</div>
          </div>
          <div className="insight-stat">
            <div className="stat-value">$2.3M</div>
            <div className="stat-label">Value from Optimizations</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="module-loading">
        <div className="loading-spinner"></div>
        <p>Loading MemoryVault...</p>
      </div>
    );
  }

  return (
    <div className="memoryvault-module">
      <div className="module-header">
        <h2 className="module-title">
          <span className="module-icon">🧠</span>
          MemoryVault
        </h2>
        <div className="module-tabs">
          <button 
            className={`tab ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            Knowledge Base
          </button>
          <button 
            className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
            onClick={() => setActiveTab('patterns')}
          >
            Patterns
          </button>
          <button 
            className={`tab ${activeTab === 'learnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('learnings')}
          >
            Learnings
          </button>
        </div>
      </div>

      <div className="module-body">
        {activeTab === 'knowledge' && renderKnowledgeBase()}
        {activeTab === 'patterns' && renderPatterns()}
        {activeTab === 'learnings' && renderLearnings()}
      </div>
    </div>
  );
};

export default MemoryVaultModule;