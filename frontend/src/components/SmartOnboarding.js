import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SmartOnboarding.css';

const SmartOnboarding = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({});
  
  // Check for temp org data from settings
  const tempOrgData = localStorage.getItem('signaldesk_temp_org');
  const initialOrgData = tempOrgData ? JSON.parse(tempOrgData) : null;
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Identity (CRITICAL - System Needs)
    organization: {
      name: initialOrgData?.organizationName || '',
      website: '',
      industry: '',
      description: initialOrgData?.organizationDescription || ''
    },
    
    // Step 2: Strategic Focus (CRITICAL - Directs Analysis)
    goals: {
      // PR-specific goals that change how system analyzes
      thought_leadership: false,
      crisis_prevention: false,
      media_coverage: false,
      investor_relations: false,
      product_launches: false,
      competitive_positioning: false,
      reputation_management: false,
      partnerships: false
    },
    
    // Step 3: Monitoring Priorities (USER VALUE - What They Care About)
    monitoring: {
      // What events/topics to track (not WHO, but WHAT)
      topics: [],
      keywords: [],
      // Example topics they can select or add:
      // - "AI regulation changes"
      // - "Sustainability initiatives" 
      // - "Market consolidation"
      // - "Technology breakthroughs"
      // - "Customer sentiment shifts"
    },
    
    // Step 4: Key Stakeholders (USER VALUE - Who Matters)
    stakeholders: {
      media: [],        // Specific journalists, publications
      influencers: [],  // Industry thought leaders
      regulators: [],   // Government bodies, agencies
      investors: [],    // Analysts, VCs, funds
      communities: [],  // Customer groups, forums
      partners: []      // Strategic partners to track
    },
    
    // Step 5: Response Configuration (CRITICAL - How to Act)
    response: {
      urgency: 'balanced',  // 'immediate', 'balanced', 'strategic'
      opportunityThreshold: 70,  // Min score to alert (0-100)
      alertChannels: {
        critical: true,    // High priority alerts
        opportunities: true,  // New opportunities
        threats: true,     // Risk warnings
        trends: false      // Trend reports
      },
      responseTime: '< 4 hours'
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
      title: 'Organization Basics', 
      subtitle: 'Just the essentials we need',
      icon: '🎯',
      color: '#00ffcc'
    },
    { 
      id: 2, 
      title: 'Strategic PR Goals', 
      subtitle: 'What are you trying to achieve?',
      icon: '🚀',
      color: '#ff00ff'
    },
    { 
      id: 3, 
      title: 'Monitoring Priorities', 
      subtitle: 'What events and topics matter to you?',
      icon: '👁️',
      color: '#00ff88'
    },
    { 
      id: 4, 
      title: 'Key Stakeholders', 
      subtitle: 'Who influences your success?',
      icon: '🎭',
      color: '#8800ff'
    },
    { 
      id: 5, 
      title: 'Alert Settings', 
      subtitle: 'How should we notify you?',
      icon: '⚡',
      color: '#00ffcc'
    }
  ];

  const industries = [
    // Technology & Software
    'Technology', 'Software/SaaS', 'Artificial Intelligence', 'Cybersecurity', 'Blockchain/Crypto',
    'Gaming', 'Cloud Computing', 'IoT/Hardware', 'Telecommunications',
    
    // Healthcare & Life Sciences  
    'Healthcare', 'Biotechnology', 'Pharmaceuticals', 'Medical Devices', 'Health Tech',
    'Mental Health', 'Telemedicine', 'Clinical Research',
    
    // Finance & Business Services
    'Finance', 'Banking', 'Insurance', 'Investment Management', 'Fintech', 
    'Accounting', 'Consulting', 'Legal Services', 'Real Estate',
    
    // Consumer & Retail
    'Retail', 'E-commerce', 'Consumer Goods', 'Food & Beverage', 'Fashion',
    'Beauty & Cosmetics', 'Luxury Goods', 'Sports & Recreation',
    
    // Media & Entertainment
    'Media', 'Entertainment', 'Publishing', 'Advertising/Marketing', 'Public Relations',
    'Social Media', 'Gaming/Esports', 'Music', 'Film/TV Production',
    
    // Industrial & Infrastructure
    'Manufacturing', 'Automotive', 'Aerospace', 'Defense', 'Construction',
    'Logistics/Supply Chain', 'Transportation', 'Agriculture',
    
    // Energy & Environment
    'Energy', 'Oil & Gas', 'Renewable Energy', 'Clean Tech', 'Sustainability',
    'Environmental Services', 'Utilities',
    
    // Education & Public Sector
    'Education', 'EdTech', 'Higher Education', 'K-12 Education', 'Professional Training',
    'Government', 'Non-Profit', 'NGO', 'Public Policy',
    
    // Other Sectors
    'Travel & Hospitality', 'Restaurants', 'Fitness & Wellness', 'Pet Care',
    'Human Resources', 'Other'
  ];

  const strategicGoals = [
    { 
      id: 'thought_leadership', 
      name: 'Thought Leadership', 
      desc: 'Position executives as industry experts',
      icon: '🎓' 
    },
    { 
      id: 'crisis_prevention', 
      name: 'Crisis Prevention', 
      desc: 'Early warning system for PR risks',
      icon: '🛡️' 
    },
    { 
      id: 'media_coverage', 
      name: 'Media Coverage', 
      desc: 'Maximize positive press mentions',
      icon: '📰' 
    },
    { 
      id: 'investor_relations', 
      name: 'Investor Relations', 
      desc: 'Manage investor sentiment',
      icon: '💰' 
    },
    { 
      id: 'product_launches', 
      name: 'Product Launches', 
      desc: 'Amplify new product announcements',
      icon: '🚀' 
    },
    { 
      id: 'competitive_positioning', 
      name: 'Competitive Edge', 
      desc: 'Win the narrative against competitors',
      icon: '⚔️' 
    },
    { 
      id: 'reputation_management', 
      name: 'Reputation Management', 
      desc: 'Protect and enhance brand image',
      icon: '✨' 
    },
    { 
      id: 'partnerships', 
      name: 'Strategic Partnerships', 
      desc: 'Identify collaboration opportunities',
      icon: '🤝' 
    }
  ];

  const topicSuggestions = {
    'Technology': [
      'AI regulation', 'Data privacy laws', 'Open source trends',
      'Tech layoffs', 'Startup funding', 'IPO activity'
    ],
    'Healthcare': [
      'FDA approvals', 'Clinical trial results', 'Healthcare policy',
      'Drug pricing', 'Telehealth adoption', 'Medical breakthroughs'
    ],
    'Finance': [
      'Interest rate changes', 'Regulatory compliance', 'Fintech innovation',
      'Cryptocurrency regulation', 'Banking consolidation', 'ESG investing'
    ],
    'default': [
      'Industry consolidation', 'Regulatory changes', 'Market trends',
      'Technology disruption', 'Sustainability', 'Economic indicators'
    ]
  };

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
    setFormData(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [goalId]: !prev.goals[goalId]
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Generate AI suggestions after step 1
      if (currentStep === 1 && formData.organization.name) {
        generateAISuggestions();
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

  const generateAISuggestions = () => {
    // Generate smart suggestions based on organization and industry
    const industry = formData.organization.industry;
    const suggestions = {
      topics: topicSuggestions[industry] || topicSuggestions['default'],
      stakeholders: {
        media: industry === 'Technology' ? 
          ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica'] :
          ['Wall Street Journal', 'Bloomberg', 'Reuters', 'Forbes'],
        influencers: ['Industry analysts', 'Thought leaders', 'Academic experts'],
        regulators: industry === 'Finance' ? 
          ['SEC', 'FINRA', 'Federal Reserve', 'CFPB'] :
          ['FTC', 'Industry regulators', 'State agencies']
      }
    };
    setAiSuggestions(suggestions);
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Transform data to match system expectations
      const systemConfig = {
        organization: formData.organization,
        goals: formData.goals,
        objectives: {
          primary: Object.keys(formData.goals).filter(g => formData.goals[g])
        },
        intelligence: {
          stakeholders: formData.stakeholders,
          topics: formData.monitoring.topics,
          keywords: formData.monitoring.keywords,
          alertFrequency: formData.response.urgency === 'immediate' ? 'realtime' : 
                         formData.response.urgency === 'strategic' ? 'daily' : 'hourly'
        },
        opportunities: {
          minimumScore: formData.response.opportunityThreshold,
          responseTime: formData.response.responseTime
        }
      };
      
      // Save organization data
      const orgData = {
        id: `org_${Date.now()}`,
        ...formData.organization
      };
      
      // Save to localStorage
      localStorage.setItem('signaldesk_organization', JSON.stringify(orgData));
      localStorage.setItem('signaldesk_onboarding', JSON.stringify(systemConfig));
      
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

  const renderStep1 = () => (
    <div className="smart-step">
      <div className="step-intro">
        <h3>Let's get started with the basics</h3>
        <p>We'll use this to automatically find relevant competitors and industry news.</p>
      </div>

      <div className="form-section">
        <label className="required">Organization Name</label>
        <input
          type="text"
          placeholder="e.g., OpenAI, Tesla, Spotify"
          value={formData.organization.name}
          onChange={(e) => updateField('organization', 'name', e.target.value)}
          className="smart-input"
          autoFocus
        />
        <span className="field-hint">We'll automatically find your competitors</span>
      </div>

      <div className="form-section">
        <label className="required">Organization Website</label>
        <input
          type="url"
          placeholder="e.g., https://www.example.com"
          value={formData.organization.website || ''}
          onChange={(e) => updateField('organization', 'website', e.target.value)}
          className="smart-input"
        />
        <span className="field-hint">Helps distinguish from similarly named organizations</span>
      </div>

      <div className="form-section">
        <label className="required">Industry</label>
        <select
          value={formData.organization.industry}
          onChange={(e) => updateField('organization', 'industry', e.target.value)}
          className="smart-select"
        >
          <option value="">Select your industry</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <span className="field-hint">Helps us understand your competitive landscape</span>
      </div>

      <div className="form-section">
        <label>Brief Description (Optional)</label>
        <textarea
          placeholder="What does your organization do? (Optional but helps with better analysis)"
          value={formData.organization.description}
          onChange={(e) => updateField('organization', 'description', e.target.value)}
          className="smart-textarea"
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="smart-step">
      <div className="step-intro">
        <h3>What are your PR objectives?</h3>
        <p>Select all that apply. This helps us analyze intelligence through the right lens.</p>
      </div>

      <div className="goals-selection">
        {strategicGoals.map(goal => (
          <div
            key={goal.id}
            className={`goal-option ${formData.goals[goal.id] ? 'selected' : ''}`}
            onClick={() => toggleGoal(goal.id)}
          >
            <div className="goal-header">
              <span className="goal-icon">{goal.icon}</span>
              <div className="goal-info">
                <h4>{goal.name}</h4>
                <p>{goal.desc}</p>
              </div>
            </div>
            <div className="goal-checkbox">
              {formData.goals[goal.id] && <span>✓</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="selection-count">
        {Object.values(formData.goals).filter(v => v).length} goals selected
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="smart-step">
      <div className="step-intro">
        <h3>What should we monitor for you?</h3>
        <p>Tell us what topics and events you care about. We'll track these across all sources.</p>
      </div>

      {aiSuggestions.topics && (
        <div className="ai-suggestions">
          <label>Suggested topics for {formData.organization.industry}</label>
          <div className="suggestion-chips">
            {aiSuggestions.topics.map(topic => (
              <button
                key={topic}
                className={`chip ${formData.monitoring.topics.includes(topic) ? 'selected' : ''}`}
                onClick={() => {
                  const topics = formData.monitoring.topics.includes(topic) ?
                    formData.monitoring.topics.filter(t => t !== topic) :
                    [...formData.monitoring.topics, topic];
                  updateField('monitoring', 'topics', topics);
                }}
              >
                {topic}
                {formData.monitoring.topics.includes(topic) && <span className="chip-remove">×</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-section">
        <label>Custom Topics to Monitor</label>
        <textarea
          placeholder="Enter topics to track (one per line)
Examples:
• Product launches in our space
• Executive changes at competitors
• Industry award announcements
• Regulatory proposals"
          value={formData.monitoring.topics.join('\n')}
          onChange={(e) => updateField('monitoring', 'topics', e.target.value.split('\n').filter(t => t.trim()))}
          className="smart-textarea"
          rows="5"
        />
      </div>

      <div className="form-section">
        <label>Specific Keywords (Optional)</label>
        <input
          type="text"
          placeholder="e.g., your product names, technology terms, campaign hashtags"
          value={formData.monitoring.keywords.join(', ')}
          onChange={(e) => updateField('monitoring', 'keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
          className="smart-input"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="smart-step">
      <div className="step-intro">
        <h3>Who are your key stakeholders?</h3>
        <p>We'll pay special attention to these voices and track their sentiment.</p>
      </div>

      <div className="stakeholder-sections">
        <div className="stakeholder-group">
          <label>
            <span className="stakeholder-icon">📰</span>
            Media & Journalists
          </label>
          <textarea
            placeholder="Publications and journalists that matter to you
Examples: TechCrunch, Sarah Johnson at WSJ, Bloomberg Technology"
            value={formData.stakeholders.media.join('\n')}
            onChange={(e) => {
              const media = e.target.value.split('\n').filter(m => m.trim());
              setFormData(prev => ({
                ...prev,
                stakeholders: { ...prev.stakeholders, media }
              }));
            }}
            className="smart-textarea"
            rows="3"
          />
        </div>

        <div className="stakeholder-group">
          <label>
            <span className="stakeholder-icon">⭐</span>
            Industry Influencers
          </label>
          <textarea
            placeholder="Thought leaders and analysts who shape opinions
Examples: Gartner analysts, industry experts, popular bloggers"
            value={formData.stakeholders.influencers.join('\n')}
            onChange={(e) => {
              const influencers = e.target.value.split('\n').filter(i => i.trim());
              setFormData(prev => ({
                ...prev,
                stakeholders: { ...prev.stakeholders, influencers }
              }));
            }}
            className="smart-textarea"
            rows="3"
          />
        </div>

        <div className="stakeholder-group">
          <label>
            <span className="stakeholder-icon">🏛️</span>
            Regulators & Agencies
          </label>
          <textarea
            placeholder="Government bodies and regulatory agencies
Examples: SEC, FDA, FTC, European Commission"
            value={formData.stakeholders.regulators.join('\n')}
            onChange={(e) => {
              const regulators = e.target.value.split('\n').filter(r => r.trim());
              setFormData(prev => ({
                ...prev,
                stakeholders: { ...prev.stakeholders, regulators }
              }));
            }}
            className="smart-textarea"
            rows="3"
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="smart-step">
      <div className="step-intro">
        <h3>How should we alert you?</h3>
        <p>Configure when and how you want to be notified about opportunities and risks.</p>
      </div>

      <div className="form-section">
        <label>Response Urgency</label>
        <div className="radio-group">
          {[
            { value: 'immediate', label: 'Immediate', desc: 'Real-time alerts for all opportunities' },
            { value: 'balanced', label: 'Balanced', desc: 'Smart filtering, alert on high-value items' },
            { value: 'strategic', label: 'Strategic', desc: 'Daily digest of curated opportunities' }
          ].map(option => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="urgency"
                value={option.value}
                checked={formData.response.urgency === option.value}
                onChange={(e) => updateField('response', 'urgency', e.target.value)}
              />
              <div className="radio-content">
                <span className="radio-label">{option.label}</span>
                <span className="radio-desc">{option.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="form-section">
        <label>Opportunity Threshold</label>
        <div className="threshold-control">
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={formData.response.opportunityThreshold}
            onChange={(e) => updateField('response', 'opportunityThreshold', parseInt(e.target.value))}
            className="smart-range"
          />
          <div className="threshold-labels">
            <span>More Alerts</span>
            <span className="threshold-value">{formData.response.opportunityThreshold}%</span>
            <span>Fewer Alerts</span>
          </div>
        </div>
        <span className="field-hint">Only alert on opportunities scoring above this threshold</span>
      </div>

      <div className="form-section">
        <label>Alert Types</label>
        <div className="alert-types">
          {[
            { key: 'critical', label: 'Critical Alerts', desc: 'Crisis risks, urgent opportunities' },
            { key: 'opportunities', label: 'New Opportunities', desc: 'PR moments you can leverage' },
            { key: 'threats', label: 'Risk Warnings', desc: 'Potential PR challenges' },
            { key: 'trends', label: 'Trend Reports', desc: 'Industry shifts and patterns' }
          ].map(type => (
            <label key={type.key} className="checkbox-option">
              <input
                type="checkbox"
                checked={formData.response.alertChannels[type.key]}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    response: {
                      ...prev.response,
                      alertChannels: {
                        ...prev.response.alertChannels,
                        [type.key]: e.target.checked
                      }
                    }
                  }));
                }}
              />
              <div className="checkbox-content">
                <span className="checkbox-label">{type.label}</span>
                <span className="checkbox-desc">{type.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="completion-summary">
        <h3>🎉 Perfect! Your SignalDesk is ready.</h3>
        <div className="summary-grid">
          <div className="summary-stat">
            <span className="stat-value">{formData.organization.name}</span>
            <span className="stat-label">Organization</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{Object.values(formData.goals).filter(v => v).length}</span>
            <span className="stat-label">PR Goals</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{formData.monitoring.topics.length}</span>
            <span className="stat-label">Topics Tracked</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">
              {Object.values(formData.stakeholders).flat().length}
            </span>
            <span className="stat-label">Stakeholders</span>
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
    <div className="smart-onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>SignalDesk Setup</h1>
          <p>Intelligent PR Platform</p>
        </div>

        <div className="progress-indicator">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="step-indicators">
            {steps.map(step => (
              <div 
                key={step.id}
                className={`step-dot ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
                style={{ '--step-color': step.color }}
              >
                <span className="step-number">{step.id}</span>
                <span className="step-title">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="step-container">
          <div className="step-header">
            <span className="step-icon">{steps[currentStep - 1].icon}</span>
            <div>
              <h2>{steps[currentStep - 1].title}</h2>
              <p>{steps[currentStep - 1].subtitle}</p>
            </div>
          </div>

          <div className="step-content">
            {renderCurrentStep()}
          </div>
        </div>

        <div className="navigation-buttons">
          <button
            className="nav-btn secondary"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Back
          </button>
          
          <button
            className="nav-btn primary"
            onClick={handleNext}
            disabled={loading}
            style={{ '--btn-color': steps[Math.min(currentStep, totalSteps - 1)].color }}
          >
            {loading ? (
              <span className="loading">Processing...</span>
            ) : currentStep === totalSteps ? (
              'Complete Setup'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartOnboarding;