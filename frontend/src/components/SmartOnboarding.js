import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SmartOnboarding.css';
import { IntelligenceIcon, OpportunityIcon, ExecutionIcon, MemoryIcon, RocketIcon, CompetitorIcon, StakeholderIcon, MediaIcon } from './Icons/NeonIcons';

const SmartOnboarding = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
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
      thought_leadership: false,
      crisis_prevention: false,
      media_coverage: false,
      investor_relations: false,
      product_launches: false,
      competitive_positioning: false,
      reputation_management: false,
      partnerships: false
    },
    
    // Step 3: Additional Monitoring (OPTIONAL - Supplements auto-discovery)
    monitoring: {
      additionalTopics: [],  // Changed from primary topics
      keywords: []
    },
    
    // Step 4: Key Stakeholders (BROAD GROUPS - not specific names)
    stakeholders: {
      competitors: [],
      media: [],
      influencers: [],
      regulators: [],
      investors: [],
      customers: []
    },
    
    // Step 5: Response Configuration
    response: {
      urgency: 'balanced',
      opportunityThreshold: 70,
      alertChannels: {
        critical: true,
        opportunities: true,
        threats: true,
        trends: false
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
      Icon: IntelligenceIcon,
      color: '#00ffcc'
    },
    { 
      id: 2, 
      title: 'Strategic Goals', 
      subtitle: 'What are you trying to achieve?',
      Icon: OpportunityIcon,
      color: '#ff00ff'
    },
    { 
      id: 3, 
      title: 'Additional Monitoring', 
      subtitle: 'Specific topics to track (optional)',
      Icon: MediaIcon,
      color: '#00ff88'
    },
    { 
      id: 4, 
      title: 'Key Stakeholders', 
      subtitle: 'Select who matters to you',
      Icon: StakeholderIcon,
      color: '#8800ff'
    },
    { 
      id: 5, 
      title: 'Alert Settings', 
      subtitle: 'How should we notify you?',
      Icon: RocketIcon,
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

  // Broad stakeholder groups (not specific names)
  const stakeholderGroups = [
    {
      category: 'competitors',
      label: 'Competitors',
      Icon: CompetitorIcon,
      color: '#ff00ff',
      options: [
        'Direct Competitors',
        'Indirect Competitors', 
        'Emerging Startups',
        'Market Leaders',
        'International Players',
        'Adjacent Market Players'
      ]
    },
    {
      category: 'media',
      label: 'Media & Press',
      Icon: MediaIcon,
      color: '#00ffcc',
      options: [
        'Industry Publications',
        'National Media',
        'Tech Press',
        'Trade Journals',
        'Local Media',
        'Podcasts & YouTube'
      ]
    },
    {
      category: 'influencers',
      label: 'Thought Leaders',
      Icon: StakeholderIcon,
      color: '#ff00ff',
      options: [
        'Industry Analysts',
        'Academic Experts',
        'Conference Speakers',
        'Social Media Influencers',
        'Bloggers & Writers',
        'Community Leaders'
      ]
    },
    {
      category: 'regulators',
      label: 'Regulatory Bodies',
      Icon: ExecutionIcon,
      color: '#00ff88',
      options: [
        'Federal Agencies',
        'State Regulators',
        'International Bodies',
        'Industry Associations',
        'Standards Organizations',
        'Compliance Bodies'
      ]
    },
    {
      category: 'investors',
      label: 'Investment Community',
      Icon: OpportunityIcon,
      color: '#8800ff',
      options: [
        'Venture Capitalists',
        'Private Equity',
        'Institutional Investors',
        'Retail Investors',
        'Analysts',
        'Rating Agencies'
      ]
    },
    {
      category: 'customers',
      label: 'Customer Groups',
      Icon: MemoryIcon,
      color: '#00ffcc',
      options: [
        'Enterprise Customers',
        'SMB Customers',
        'Consumer Segments',
        'User Communities',
        'Beta Testers',
        'Advisory Boards'
      ]
    }
  ];

  const strategicGoals = [
    { 
      id: 'thought_leadership', 
      name: 'Thought Leadership', 
      desc: 'Position executives as industry experts',
      Icon: IntelligenceIcon
    },
    { 
      id: 'crisis_prevention', 
      name: 'Crisis Prevention', 
      desc: 'Early warning system for PR risks',
      Icon: MediaIcon
    },
    { 
      id: 'media_coverage', 
      name: 'Media Coverage', 
      desc: 'Maximize positive press mentions',
      Icon: MediaIcon
    },
    { 
      id: 'investor_relations', 
      name: 'Investor Relations', 
      desc: 'Manage investor sentiment',
      Icon: OpportunityIcon
    },
    { 
      id: 'product_launches', 
      name: 'Product Launches', 
      desc: 'Amplify new product announcements',
      Icon: RocketIcon
    },
    { 
      id: 'competitive_positioning', 
      name: 'Competitive Edge', 
      desc: 'Win the narrative against competitors',
      Icon: CompetitorIcon
    },
    { 
      id: 'reputation_management', 
      name: 'Reputation Management', 
      desc: 'Protect and enhance brand image',
      Icon: ExecutionIcon
    },
    { 
      id: 'partnerships', 
      name: 'Strategic Partnerships', 
      desc: 'Identify collaboration opportunities',
      Icon: StakeholderIcon
    }
  ];

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [`${section}.${field}`]: undefined
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

  const toggleStakeholder = (category, stakeholder) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: {
        ...prev.stakeholders,
        [category]: prev.stakeholders[category].includes(stakeholder) ?
          prev.stakeholders[category].filter(s => s !== stakeholder) :
          [...prev.stakeholders[category], stakeholder]
      }
    }));
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch(step) {
      case 1:
        if (!formData.organization.name.trim()) {
          errors['organization.name'] = 'Organization name is required';
        }
        if (!formData.organization.website.trim()) {
          errors['organization.website'] = 'Website URL is required';
        }
        if (!formData.organization.industry) {
          errors['organization.industry'] = 'Please select your industry';
        }
        break;
        
      case 2:
        const selectedGoals = Object.values(formData.goals).filter(v => v).length;
        if (selectedGoals === 0) {
          errors['goals'] = 'Please select at least one strategic goal';
        }
        break;
        
      case 3:
        // Step 3 is optional - no validation needed
        break;
        
      case 4:
        const totalStakeholders = Object.values(formData.stakeholders).flat().length;
        if (totalStakeholders < 3) {
          errors['stakeholders'] = 'Please select at least 3 stakeholders to monitor';
        }
        break;
        
      case 5:
        // Alert settings have defaults - no validation needed
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    if (currentStep < totalSteps) {
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
      // Transform data to match system expectations
      const systemConfig = {
        organization: formData.organization,
        goals: formData.goals,
        objectives: {
          primary: Object.keys(formData.goals).filter(g => formData.goals[g])
        },
        intelligence: {
          stakeholders: formData.stakeholders,
          topics: formData.monitoring.additionalTopics,
          keywords: formData.monitoring.keywords,
          alertFrequency: formData.response.urgency === 'immediate' ? 'realtime' : 
                         formData.response.urgency === 'strategic' ? 'daily' : 'hourly'
        },
        monitoring: {
          topics: formData.monitoring.additionalTopics,
          keywords: formData.monitoring.keywords
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
      console.error('Failed to complete onboarding:', error);
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
          className={`smart-input ${validationErrors['organization.name'] ? 'error' : ''}`}
          autoFocus
        />
        {validationErrors['organization.name'] && (
          <span className="error-message">{validationErrors['organization.name']}</span>
        )}
        <span className="field-hint">We'll automatically find your competitors</span>
      </div>

      <div className="form-section">
        <label className="required">Organization Website</label>
        <input
          type="url"
          placeholder="e.g., https://www.example.com"
          value={formData.organization.website || ''}
          onChange={(e) => updateField('organization', 'website', e.target.value)}
          className={`smart-input ${validationErrors['organization.website'] ? 'error' : ''}`}
        />
        {validationErrors['organization.website'] && (
          <span className="error-message">{validationErrors['organization.website']}</span>
        )}
        <span className="field-hint">Helps distinguish from similarly named organizations</span>
      </div>

      <div className="form-section">
        <label className="required">Industry</label>
        <select
          value={formData.organization.industry}
          onChange={(e) => updateField('organization', 'industry', e.target.value)}
          className={`smart-select ${validationErrors['organization.industry'] ? 'error' : ''}`}
        >
          <option value="">Select your industry</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        {validationErrors['organization.industry'] && (
          <span className="error-message">{validationErrors['organization.industry']}</span>
        )}
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

      {validationErrors['goals'] && (
        <div className="error-banner">{validationErrors['goals']}</div>
      )}

      <div className="goals-selection">
        {strategicGoals.map(goal => (
          <div
            key={goal.id}
            className={`goal-option ${formData.goals[goal.id] ? 'selected' : ''}`}
            onClick={() => toggleGoal(goal.id)}
          >
            <div className="goal-header">
              <span className="goal-icon">
                <goal.Icon size={24} color={formData.goals[goal.id] ? '#00ffcc' : 'rgba(255,255,255,0.5)'} />
              </span>
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
        <h3>Additional monitoring topics (Optional)</h3>
        <p>We automatically track your industry, competitors, and relevant news. Add any specific topics you want to monitor.</p>
      </div>

      <div className="info-box">
        <MediaIcon size={20} color="#00ff88" />
        <p>Our AI automatically discovers and tracks competitors, industry news, and relevant events. The topics below are <strong>additional</strong> areas you'd like us to monitor.</p>
      </div>

      <div className="form-section">
        <label>Additional Topics to Monitor (Optional)</label>
        <textarea
          placeholder="Enter any specific topics you want to track (one per line)
Examples:
• Specific conference names
• Niche technology areas
• Regional market changes
• Internal campaign names"
          value={formData.monitoring.additionalTopics.join('\n')}
          onChange={(e) => updateField('monitoring', 'additionalTopics', e.target.value.split('\n').filter(t => t.trim()))}
          className="smart-textarea"
          rows="5"
        />
        <span className="field-hint">These supplement our automatic industry monitoring</span>
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
        <span className="field-hint">Exact terms to always track</span>
      </div>
    </div>
  );

  const renderStep4 = () => {
    return (
      <div className="smart-step">
        <div className="step-intro">
          <h3>Which stakeholder groups should we monitor?</h3>
          <p>Select the groups you want to track. We'll automatically monitor ALL relevant entities within each selected category.</p>
        </div>

        {validationErrors['stakeholders'] && (
          <div className="error-banner">{validationErrors['stakeholders']}</div>
        )}

        <div className="info-box">
          <IntelligenceIcon size={20} color="#00ffcc" />
          <p>When you select a group like "Direct Competitors" or "Industry Publications", we automatically track <strong>ALL</strong> entities in that category - both the ones we discover and any you know about.</p>
        </div>

        <div className="stakeholder-sections">
          {stakeholderGroups.map(group => (
            <div key={group.category} className="stakeholder-group">
              <div className="group-header">
                <group.Icon size={20} color={group.color} />
                <label>{group.label} ({formData.stakeholders[group.category]?.length || 0} selected)</label>
              </div>
              <div className="stakeholder-grid">
                {group.options.map(option => (
                  <div
                    key={option}
                    className={`stakeholder-chip ${formData.stakeholders[group.category]?.includes(option) ? 'selected' : ''}`}
                    onClick={() => toggleStakeholder(group.category, option)}
                  >
                    {option}
                    {formData.stakeholders[group.category]?.includes(option) && <span className="chip-check">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="selection-summary">
          Total stakeholder groups selected: {Object.values(formData.stakeholders).flat().length}
        </div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="smart-step">
      <div className="step-intro">
        <h3>How should we alert you?</h3>
        <p>Configure when and how you want to be notified about PR opportunities and risks.</p>
      </div>

      <div className="form-section">
        <label>Response Urgency</label>
        <div className="urgency-options">
          {[
            { value: 'immediate', label: 'Real-time', desc: 'Alert me immediately for time-sensitive opportunities' },
            { value: 'balanced', label: 'Balanced', desc: 'Smart batching based on importance' },
            { value: 'strategic', label: 'Strategic', desc: 'Daily digest for planning' }
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
        <div className="threshold-slider">
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
            <span className="stat-value">{formData.monitoring.additionalTopics.length}</span>
            <span className="stat-label">Additional Topics</span>
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
        <div className="progress-header">
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
            <span className="step-icon">
              {steps[currentStep - 1].Icon && 
                React.createElement(steps[currentStep - 1].Icon, {
                  size: 32,
                  color: steps[currentStep - 1].color
                })
              }
            </span>
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