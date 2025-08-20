import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RailwayOnboarding.css';

const RailwayOnboarding = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Check for temp org data from settings
  const tempOrgData = localStorage.getItem('signaldesk_temp_org');
  const initialOrgData = tempOrgData ? JSON.parse(tempOrgData) : null;
  
  const [formData, setFormData] = useState({
    // Step 1: Organization Profile
    organization: {
      name: initialOrgData?.organizationName || '',
      industry: '',
      marketPosition: '',
      website: '',
      description: initialOrgData?.organizationDescription || '',
      size: '',
      stage: ''
    },
    // Step 2: Strategic Goals
    goals: {
      primary: [],
      timeline: '3-6 months',
      successMetrics: '',
      challenges: ''
    },
    // Step 3: Target Configuration
    targets: {
      competitors: [],
      stakeholders: {
        customers: [],
        investors: [],
        partners: [],
        media: [],
        regulators: []
      },
      topics: [],
      keywords: []
    },
    // Step 4: Opportunity Settings
    opportunities: {
      trending: { enabled: true, priority: 'high' },
      news_hook: { enabled: true, priority: 'high' },
      competitor_gap: { enabled: true, priority: 'medium' },
      journalist_interest: { enabled: true, priority: 'medium' },
      editorial_calendar: { enabled: false, priority: 'low' },
      award: { enabled: false, priority: 'low' },
      speaking: { enabled: false, priority: 'low' },
      responseTime: '< 4 hours',
      minimumScore: 70
    },
    // Step 5: Intelligence Configuration
    intelligence: {
      monitoringDepth: 'comprehensive',
      alertFrequency: 'realtime',
      sentimentTracking: true,
      competitiveAnalysis: true,
      trendPrediction: true,
      cascadeDetection: true
    }
  });

  // Clear temp data after loading
  useEffect(() => {
    if (tempOrgData) {
      localStorage.removeItem('signaldesk_temp_org');
    }
  }, [tempOrgData]);

  const totalSteps = 5;

  const steps = [
    { 
      id: 1, 
      title: 'Organization Profile', 
      subtitle: 'Tell us about your company',
      icon: '🏢',
      color: '#00ffcc'
    },
    { 
      id: 2, 
      title: 'Strategic Goals', 
      subtitle: 'Define what success looks like',
      icon: '🎯',
      color: '#ff00ff'
    },
    { 
      id: 3, 
      title: 'Target Configuration', 
      subtitle: 'Who and what to monitor',
      icon: '🔍',
      color: '#00ff88'
    },
    { 
      id: 4, 
      title: 'Opportunity Engine', 
      subtitle: 'Configure opportunity detection',
      icon: '💎',
      color: '#8800ff'
    },
    { 
      id: 5, 
      title: 'Intelligence Hub', 
      subtitle: 'Set up monitoring parameters',
      icon: '🧠',
      color: '#00ffcc'
    }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 
    'Manufacturing', 'Media', 'Energy', 'Education', 
    'Non-Profit', 'Government', 'Other'
  ];

  const companyStages = [
    'Pre-seed', 'Seed', 'Series A', 'Series B+', 
    'Growth', 'Public', 'Enterprise', 'Non-Profit'
  ];

  const companySizes = [
    '1-10', '11-50', '51-200', '201-500', 
    '501-1000', '1000-5000', '5000+'
  ];

  const marketPositions = [
    'Market Leader', 'Challenger', 'Disruptor', 
    'Emerging Player', 'Niche Specialist'
  ];

  const strategicGoals = [
    { id: 'thought-leadership', name: 'Thought Leadership', icon: '🎓' },
    { id: 'brand-awareness', name: 'Brand Awareness', icon: '📢' },
    { id: 'product-launch', name: 'Product Launches', icon: '🚀' },
    { id: 'funding', name: 'Funding & Investment', icon: '💰' },
    { id: 'talent', name: 'Talent Acquisition', icon: '👥' },
    { id: 'crisis', name: 'Crisis Preparedness', icon: '🛡️' },
    { id: 'competitive', name: 'Competitive Positioning', icon: '⚔️' },
    { id: 'partnerships', name: 'Strategic Partnerships', icon: '🤝' }
  ];

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const toggleGoal = (goalId) => {
    const current = formData.goals.primary;
    if (current.includes(goalId)) {
      updateField('goals', 'primary', current.filter(id => id !== goalId));
    } else if (current.length < 4) {
      updateField('goals', 'primary', [...current, goalId]);
    }
  };

  const analyzeOrganization = async () => {
    if (!formData.organization.name) return;
    
    setAnalyzing(true);
    
    // Simulate AI analysis - in production, call your AI endpoint
    setTimeout(() => {
      // Auto-populate some fields based on organization
      const suggestedCompetitors = [
        `${formData.organization.name} Competitor 1`,
        `${formData.organization.name} Competitor 2`,
        `${formData.organization.name} Competitor 3`
      ];
      
      const suggestedTopics = [
        'Industry Innovation',
        'Market Trends',
        'Regulatory Changes',
        'Technology Advances'
      ];
      
      setFormData(prev => ({
        ...prev,
        targets: {
          ...prev.targets,
          competitors: suggestedCompetitors,
          topics: suggestedTopics
        }
      }));
      
      setAnalyzing(false);
    }, 2000);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Auto-analyze after step 1
      if (currentStep === 1 && formData.organization.name) {
        analyzeOrganization();
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Save organization data
      const orgData = {
        id: `org_${Date.now()}`,
        name: formData.organization.name,
        industry: formData.organization.industry,
        marketPosition: formData.organization.marketPosition,
        size: formData.organization.size,
        stage: formData.organization.stage,
        description: formData.organization.description
      };
      
      // Save to localStorage
      localStorage.setItem('signaldesk_organization', JSON.stringify(orgData));
      localStorage.setItem('signaldesk_onboarding', JSON.stringify(formData));
      
      // Add to organizations list
      const existingOrgs = JSON.parse(localStorage.getItem('signaldesk_organizations') || '[]');
      const updatedOrgs = [...existingOrgs.filter(o => o.name !== orgData.name), orgData];
      localStorage.setItem('signaldesk_organizations', JSON.stringify(updatedOrgs));
      
      // Navigate to main app
      setTimeout(() => {
        if (onComplete) {
          onComplete(orgData);
        } else {
          navigate('/');
        }
      }, 500);
    } catch (error) {
      console.error('Error saving onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${(currentStep / totalSteps) * 100}%`,
            background: `linear-gradient(90deg, ${steps[currentStep - 1].color}, ${steps[Math.min(currentStep, totalSteps - 1)].color})`
          }}
        />
      </div>
      <div className="progress-steps">
        {steps.map((step) => (
          <div 
            key={step.id}
            className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
            onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
          >
            <div className="step-circle" style={{ borderColor: step.color }}>
              {currentStep > step.id ? '✓' : step.id}
            </div>
            <span className="step-label">{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <span className="step-icon">{steps[0].icon}</span>
        <div>
          <h2>{steps[0].title}</h2>
          <p>{steps[0].subtitle}</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group full-width">
          <label>Organization Name *</label>
          <input
            type="text"
            placeholder="Enter your organization name"
            value={formData.organization.name}
            onChange={(e) => updateField('organization', 'name', e.target.value)}
            className="neon-input"
          />
        </div>

        <div className="form-group">
          <label>Industry *</label>
          <select
            value={formData.organization.industry}
            onChange={(e) => updateField('organization', 'industry', e.target.value)}
            className="neon-select"
          >
            <option value="">Select industry</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Market Position</label>
          <select
            value={formData.organization.marketPosition}
            onChange={(e) => updateField('organization', 'marketPosition', e.target.value)}
            className="neon-select"
          >
            <option value="">Select position</option>
            {marketPositions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Company Size</label>
          <select
            value={formData.organization.size}
            onChange={(e) => updateField('organization', 'size', e.target.value)}
            className="neon-select"
          >
            <option value="">Select size</option>
            {companySizes.map(size => (
              <option key={size} value={size}>{size} employees</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Stage</label>
          <select
            value={formData.organization.stage}
            onChange={(e) => updateField('organization', 'stage', e.target.value)}
            className="neon-select"
          >
            <option value="">Select stage</option>
            {companyStages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label>Website</label>
          <input
            type="url"
            placeholder="https://your-website.com"
            value={formData.organization.website}
            onChange={(e) => updateField('organization', 'website', e.target.value)}
            className="neon-input"
          />
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            placeholder="Brief description of what your organization does..."
            value={formData.organization.description}
            onChange={(e) => updateField('organization', 'description', e.target.value)}
            className="neon-textarea"
            rows="3"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <span className="step-icon">{steps[1].icon}</span>
        <div>
          <h2>{steps[1].title}</h2>
          <p>{steps[1].subtitle}</p>
        </div>
      </div>

      <div className="form-section">
        <label>Select Your Primary PR Goals (up to 4)</label>
        <div className="goals-grid">
          {strategicGoals.map(goal => (
            <div
              key={goal.id}
              className={`goal-card ${formData.goals.primary.includes(goal.id) ? 'selected' : ''}`}
              onClick={() => toggleGoal(goal.id)}
            >
              <span className="goal-icon">{goal.icon}</span>
              <span className="goal-name">{goal.name}</span>
              {formData.goals.primary.includes(goal.id) && (
                <span className="goal-check">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Timeline</label>
          <select
            value={formData.goals.timeline}
            onChange={(e) => updateField('goals', 'timeline', e.target.value)}
            className="neon-select"
          >
            <option value="1-3 months">1-3 months</option>
            <option value="3-6 months">3-6 months</option>
            <option value="6-12 months">6-12 months</option>
            <option value="12+ months">12+ months</option>
          </select>
        </div>

        <div className="form-group">
          <label>Success Metrics</label>
          <input
            type="text"
            placeholder="e.g., Media mentions, thought leadership, brand awareness"
            value={formData.goals.successMetrics}
            onChange={(e) => updateField('goals', 'successMetrics', e.target.value)}
            className="neon-input"
          />
        </div>

        <div className="form-group full-width">
          <label>Current Challenges</label>
          <textarea
            placeholder="What PR challenges are you facing?"
            value={formData.goals.challenges}
            onChange={(e) => updateField('goals', 'challenges', e.target.value)}
            className="neon-textarea"
            rows="3"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <span className="step-icon">{steps[2].icon}</span>
        <div>
          <h2>{steps[2].title}</h2>
          <p>{steps[2].subtitle}</p>
        </div>
      </div>

      {analyzing && (
        <div className="analyzing-banner">
          <div className="analyzing-spinner"></div>
          <span>AI is analyzing your organization to suggest targets...</span>
        </div>
      )}

      <div className="form-section">
        <label>Competitors to Monitor</label>
        <textarea
          placeholder="Enter competitor names (one per line)"
          value={formData.targets.competitors.join('\n')}
          onChange={(e) => updateField('targets', 'competitors', e.target.value.split('\n').filter(c => c.trim()))}
          className="neon-textarea"
          rows="4"
        />
      </div>

      <div className="form-section">
        <label>Key Stakeholders</label>
        <div className="stakeholder-groups">
          <div className="stakeholder-group">
            <label className="sub-label">Customers/Users</label>
            <input
              type="text"
              placeholder="e.g., Enterprise clients, SMBs, Developers"
              value={formData.targets.stakeholders.customers.join(', ')}
              onChange={(e) => {
                const customers = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                setFormData(prev => ({
                  ...prev,
                  targets: {
                    ...prev.targets,
                    stakeholders: {
                      ...prev.targets.stakeholders,
                      customers
                    }
                  }
                }));
              }}
              className="neon-input"
            />
          </div>

          <div className="stakeholder-group">
            <label className="sub-label">Media & Journalists</label>
            <input
              type="text"
              placeholder="e.g., TechCrunch, WSJ, Industry analysts"
              value={formData.targets.stakeholders.media.join(', ')}
              onChange={(e) => {
                const media = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                setFormData(prev => ({
                  ...prev,
                  targets: {
                    ...prev.targets,
                    stakeholders: {
                      ...prev.targets.stakeholders,
                      media
                    }
                  }
                }));
              }}
              className="neon-input"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <label>Topics & Keywords to Monitor</label>
        <textarea
          placeholder="Enter topics and keywords (one per line)"
          value={formData.targets.topics.join('\n')}
          onChange={(e) => updateField('targets', 'topics', e.target.value.split('\n').filter(t => t.trim()))}
          className="neon-textarea"
          rows="4"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <span className="step-icon">{steps[3].icon}</span>
        <div>
          <h2>{steps[3].title}</h2>
          <p>{steps[3].subtitle}</p>
        </div>
      </div>

      <div className="form-section">
        <label>Opportunity Types to Monitor</label>
        <div className="opportunity-types">
          {Object.entries({
            trending: 'Trending Topics & Conversations',
            news_hook: 'News Cycle Opportunities',
            competitor_gap: 'Competitor Weaknesses',
            journalist_interest: 'Media Interest Signals',
            editorial_calendar: 'Editorial Calendars',
            award: 'Industry Awards',
            speaking: 'Speaking Opportunities'
          }).map(([key, label]) => (
            <div key={key} className="opportunity-type">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={formData.opportunities[key].enabled}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      opportunities: {
                        ...prev.opportunities,
                        [key]: {
                          ...prev.opportunities[key],
                          enabled: e.target.checked
                        }
                      }
                    }));
                  }}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">{label}</span>
              </label>
              {formData.opportunities[key].enabled && (
                <select
                  value={formData.opportunities[key].priority}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      opportunities: {
                        ...prev.opportunities,
                        [key]: {
                          ...prev.opportunities[key],
                          priority: e.target.value
                        }
                      }
                    }));
                  }}
                  className="priority-select"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Response Time Target</label>
          <select
            value={formData.opportunities.responseTime}
            onChange={(e) => updateField('opportunities', 'responseTime', e.target.value)}
            className="neon-select"
          >
            <option value="< 1 hour">Under 1 hour</option>
            <option value="< 4 hours">Under 4 hours</option>
            <option value="< 24 hours">Under 24 hours</option>
            <option value="< 48 hours">Under 48 hours</option>
          </select>
        </div>

        <div className="form-group">
          <label>Minimum Opportunity Score</label>
          <input
            type="range"
            min="50"
            max="90"
            value={formData.opportunities.minimumScore}
            onChange={(e) => updateField('opportunities', 'minimumScore', parseInt(e.target.value))}
            className="neon-range"
          />
          <span className="range-value">{formData.opportunities.minimumScore}/100</span>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <span className="step-icon">{steps[4].icon}</span>
        <div>
          <h2>{steps[4].title}</h2>
          <p>{steps[4].subtitle}</p>
        </div>
      </div>

      <div className="form-section">
        <label>Intelligence Monitoring Depth</label>
        <div className="radio-group">
          {[
            { value: 'basic', label: 'Basic - Key metrics only' },
            { value: 'standard', label: 'Standard - Regular monitoring' },
            { value: 'comprehensive', label: 'Comprehensive - Deep analysis' },
            { value: 'enterprise', label: 'Enterprise - Full spectrum' }
          ].map(option => (
            <label key={option.value} className="radio-label">
              <input
                type="radio"
                name="monitoringDepth"
                value={option.value}
                checked={formData.intelligence.monitoringDepth === option.value}
                onChange={(e) => updateField('intelligence', 'monitoringDepth', e.target.value)}
              />
              <span className="radio-custom"></span>
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-section">
        <label>Alert Frequency</label>
        <select
          value={formData.intelligence.alertFrequency}
          onChange={(e) => updateField('intelligence', 'alertFrequency', e.target.value)}
          className="neon-select"
        >
          <option value="realtime">Real-time</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily Digest</option>
          <option value="weekly">Weekly Report</option>
        </select>
      </div>

      <div className="form-section">
        <label>Advanced Intelligence Features</label>
        <div className="feature-toggles">
          {[
            { key: 'sentimentTracking', label: 'Sentiment Analysis' },
            { key: 'competitiveAnalysis', label: 'Competitive Intelligence' },
            { key: 'trendPrediction', label: 'Trend Prediction' },
            { key: 'cascadeDetection', label: 'Cascade Event Detection' }
          ].map(feature => (
            <label key={feature.key} className="toggle-label">
              <input
                type="checkbox"
                checked={formData.intelligence[feature.key]}
                onChange={(e) => updateField('intelligence', feature.key, e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">{feature.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="completion-message">
        <div className="completion-icon">🎉</div>
        <h3>Almost Done!</h3>
        <p>Your SignalDesk Intelligence System is ready to activate.</p>
        <div className="config-summary">
          <div className="summary-item">
            <span className="summary-label">Organization:</span>
            <span className="summary-value">{formData.organization.name || 'Not set'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Goals:</span>
            <span className="summary-value">{formData.goals.primary.length} selected</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Competitors:</span>
            <span className="summary-value">{formData.targets.competitors.length} tracked</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Opportunities:</span>
            <span className="summary-value">
              {Object.values(formData.opportunities).filter(o => o.enabled).length} active
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch(currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="railway-onboarding">
      <div className="onboarding-background"></div>
      
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1 className="onboarding-title">
            <span className="title-gradient">SignalDesk</span>
            <span className="title-version">V2</span>
          </h1>
          <p className="onboarding-subtitle">Intelligence-Driven PR Platform</p>
        </div>

        {renderProgressBar()}

        <div className="onboarding-content">
          {renderCurrentStep()}
        </div>

        <div className="onboarding-actions">
          <button
            className="action-btn secondary"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </button>
          
          <button
            className="action-btn primary"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : currentStep === totalSteps ? (
              'Complete Setup'
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RailwayOnboarding;