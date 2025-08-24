import React, { useState, useEffect } from 'react';
import './ModuleStyles.css';

const ExecutionModule = ({ organizationId }) => {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadCampaigns();
      loadTemplates();
    }
  }, [organizationId]);

  const loadCampaigns = async () => {
    try {
      // Mock data for demonstration
      setTimeout(() => {
        setCampaigns([
          {
            id: 1,
            title: 'Q4 Product Launch',
            description: 'Major product announcement campaign',
            status: 'active',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            reach: '125K',
            engagement: '4.2%',
            sentiment: 'Positive'
          },
          {
            id: 2,
            title: 'Thought Leadership Series',
            description: 'CEO blog and speaking engagements',
            status: 'active',
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            reach: '89K',
            engagement: '6.8%',
            sentiment: 'Very Positive'
          }
        ]);
      }, 500);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadTemplates = async () => {
    // Load available templates
    setTemplates([
      { id: 1, name: 'Press Release', icon: '📰', description: 'Standard press release format' },
      { id: 2, name: 'Social Campaign', icon: '💬', description: 'Multi-platform social media campaign' },
      { id: 3, name: 'Crisis Response', icon: '🚨', description: 'Rapid crisis communication plan' },
      { id: 4, name: 'Product Launch', icon: '🚀', description: 'New product announcement campaign' },
      { id: 5, name: 'Thought Leadership', icon: '💡', description: 'Expert positioning content' },
      { id: 6, name: 'Event Coverage', icon: '📅', description: 'Event-based PR campaign' }
    ]);
  };

  const renderCampaigns = () => (
    <div className="execution-campaigns">
      <div className="campaigns-header">
        <h3 className="section-title">Active Campaigns</h3>
        <button className="primary-btn">+ New Campaign</button>
      </div>

      <div className="campaigns-grid">
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <span className="campaign-status">{campaign.status}</span>
                <span className="campaign-date">{new Date(campaign.created_at).toLocaleDateString()}</span>
              </div>
              <h4 className="campaign-title">{campaign.title}</h4>
              <p className="campaign-description">{campaign.description}</p>
              <div className="campaign-metrics">
                <div className="metric">
                  <span className="metric-label">Reach</span>
                  <span className="metric-value">{campaign.reach || '0'}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Engagement</span>
                  <span className="metric-value">{campaign.engagement || '0%'}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Sentiment</span>
                  <span className="metric-value">{campaign.sentiment || 'N/A'}</span>
                </div>
              </div>
              <div className="campaign-actions">
                <button className="action-btn">View Details</button>
                <button className="action-btn">Edit</button>
                <button className="action-btn">Analytics</button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No active campaigns</h3>
            <p>Create your first campaign to get started</p>
            <button className="primary-btn">Create Campaign</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderGenerator = () => (
    <div className="execution-generator">
      <h3 className="section-title">Content Generator</h3>
      
      <div className="generator-workspace">
        <div className="template-selector">
          <h4>Select Template</h4>
          <div className="template-grid">
            {templates.map((template) => (
              <button key={template.id} className="template-card">
                <span className="template-icon">{template.icon}</span>
                <span className="template-name">{template.name}</span>
                <span className="template-description">{template.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="generator-form">
          <h4>Content Details</h4>
          <div className="form-group">
            <label>Campaign Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter campaign title..."
            />
          </div>

          <div className="form-group">
            <label>Key Messages</label>
            <textarea 
              className="form-textarea" 
              rows="4"
              placeholder="Enter key messages to include..."
            />
          </div>

          <div className="form-group">
            <label>Target Audience</label>
            <select className="form-select">
              <option>General Public</option>
              <option>Industry Professionals</option>
              <option>Investors</option>
              <option>Media/Journalists</option>
              <option>Customers</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tone</label>
            <div className="tone-selector">
              <button className="tone-option active">Professional</button>
              <button className="tone-option">Casual</button>
              <button className="tone-option">Urgent</button>
              <button className="tone-option">Inspirational</button>
            </div>
          </div>

          <div className="generator-actions">
            <button 
              className="primary-btn"
              onClick={() => setGeneratingContent(true)}
              disabled={generatingContent}
            >
              {generatingContent ? 'Generating...' : 'Generate Content'}
            </button>
            <button className="secondary-btn">Save Draft</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeployment = () => (
    <div className="execution-deployment">
      <h3 className="section-title">Deployment Hub</h3>
      
      <div className="deployment-sections">
        <div className="deployment-card">
          <h4>Ready to Deploy</h4>
          <div className="deployment-queue">
            <div className="deployment-item">
              <div className="deployment-info">
                <span className="deployment-type">Press Release</span>
                <span className="deployment-title">Q4 Earnings Announcement</span>
              </div>
              <div className="deployment-actions">
                <button className="deploy-btn">Deploy Now</button>
                <button className="schedule-btn">Schedule</button>
              </div>
            </div>
            <div className="deployment-item">
              <div className="deployment-info">
                <span className="deployment-type">Social Campaign</span>
                <span className="deployment-title">Product Launch Teaser</span>
              </div>
              <div className="deployment-actions">
                <button className="deploy-btn">Deploy Now</button>
                <button className="schedule-btn">Schedule</button>
              </div>
            </div>
          </div>
        </div>

        <div className="deployment-card">
          <h4>Scheduled Deployments</h4>
          <div className="scheduled-list">
            <div className="scheduled-item">
              <div className="scheduled-time">Tomorrow, 9:00 AM</div>
              <div className="scheduled-content">Partnership Announcement</div>
              <div className="scheduled-channels">
                <span className="channel-badge">Email</span>
                <span className="channel-badge">Twitter</span>
                <span className="channel-badge">LinkedIn</span>
              </div>
            </div>
            <div className="scheduled-item">
              <div className="scheduled-time">Friday, 2:00 PM</div>
              <div className="scheduled-content">Weekly Industry Update</div>
              <div className="scheduled-channels">
                <span className="channel-badge">Blog</span>
                <span className="channel-badge">Newsletter</span>
              </div>
            </div>
          </div>
        </div>

        <div className="deployment-card">
          <h4>Deployment Channels</h4>
          <div className="channels-grid">
            <div className="channel-status">
              <span className="channel-icon">✉️</span>
              <span className="channel-name">Email</span>
              <span className="status-indicator connected">Connected</span>
            </div>
            <div className="channel-status">
              <span className="channel-icon">🐦</span>
              <span className="channel-name">Twitter/X</span>
              <span className="status-indicator connected">Connected</span>
            </div>
            <div className="channel-status">
              <span className="channel-icon">💼</span>
              <span className="channel-name">LinkedIn</span>
              <span className="status-indicator connected">Connected</span>
            </div>
            <div className="channel-status">
              <span className="channel-icon">📝</span>
              <span className="channel-name">Blog</span>
              <span className="status-indicator connected">Connected</span>
            </div>
            <div className="channel-status">
              <span className="channel-icon">📧</span>
              <span className="channel-name">Newsletter</span>
              <span className="status-indicator">Not Connected</span>
            </div>
            <div className="channel-status">
              <span className="channel-icon">📱</span>
              <span className="channel-name">Slack</span>
              <span className="status-indicator">Not Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="execution-module">
      <div className="module-header">
        <h2 className="module-title">
          <span className="module-icon">⚡</span>
          Execution Center
        </h2>
        <div className="module-tabs">
          <button 
            className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            Campaigns
          </button>
          <button 
            className={`tab ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            Generator
          </button>
          <button 
            className={`tab ${activeTab === 'deployment' ? 'active' : ''}`}
            onClick={() => setActiveTab('deployment')}
          >
            Deployment
          </button>
        </div>
      </div>

      <div className="module-body">
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'generator' && renderGenerator()}
        {activeTab === 'deployment' && renderDeployment()}
      </div>
    </div>
  );
};

export default ExecutionModule;