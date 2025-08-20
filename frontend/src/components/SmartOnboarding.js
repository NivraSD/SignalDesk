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
    
    // Step 4: Key Stakeholders (SELECTION - Pre-mapped by industry)
    stakeholders: {
      media: [],
      influencers: [],
      regulators: [],
      investors: [],
      communities: [],
      partners: []
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

  // Pre-mapped stakeholders by industry category
  const stakeholdersByIndustry = {
    'Technology': {
      media: ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'VentureBeat', 'The Information', 'Protocol', 'Recode'],
      influencers: ['Benedict Evans', 'Mary Meeker', 'Ben Thompson', 'Kara Swisher', 'Casey Newton'],
      regulators: ['FTC', 'FCC', 'EU Commission', 'DOJ Antitrust', 'State Privacy Boards'],
      investors: ['Sequoia Capital', 'Andreessen Horowitz', 'Benchmark', 'Accel', 'Y Combinator']
    },
    'Finance': {
      media: ['Wall Street Journal', 'Financial Times', 'Bloomberg', 'CNBC', 'Reuters', 'Forbes'],
      influencers: ['Warren Buffett', 'Ray Dalio', 'Mohamed El-Erian', 'Nouriel Roubini'],
      regulators: ['SEC', 'FINRA', 'Federal Reserve', 'CFPB', 'OCC', 'FDIC'],
      investors: ['BlackRock', 'Vanguard', 'State Street', 'JP Morgan', 'Goldman Sachs']
    },
    'Healthcare': {
      media: ['STAT News', 'FiercePharma', 'Modern Healthcare', 'Becker\'s Hospital Review', 'MedCity News'],
      influencers: ['Eric Topol', 'Atul Gawande', 'Robert Pearl', 'Leana Wen'],
      regulators: ['FDA', 'CDC', 'CMS', 'NIH', 'WHO'],
      investors: ['OrbiMed', 'Venrock', 'NEA', 'Polaris Partners', 'Arch Venture']
    },
    'default': {
      media: ['Wall Street Journal', 'New York Times', 'Bloomberg', 'Reuters', 'Forbes', 'Business Insider'],
      influencers: ['Industry analysts', 'Academic experts', 'Trade association leaders'],
      regulators: ['FTC', 'SEC', 'DOJ', 'State regulators'],
      investors: ['Major institutional investors', 'Private equity firms', 'Venture capital firms']
    }
  };

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
    // Get relevant stakeholders based on industry
    const industryKey = ['Technology', 'Software/SaaS', 'Artificial Intelligence', 'Cybersecurity'].includes(formData.organization.industry) ? 'Technology' :
                       ['Finance', 'Banking', 'Insurance', 'Fintech'].includes(formData.organization.industry) ? 'Finance' :
                       ['Healthcare', 'Biotechnology', 'Pharmaceuticals'].includes(formData.organization.industry) ? 'Healthcare' :
                       'default';
    
    const stakeholders = stakeholdersByIndustry[industryKey];

    return (
      <div className="smart-step">
        <div className="step-intro">
          <h3>Who are your key stakeholders?</h3>
          <p>Select the voices that matter most to your organization. We'll track their coverage and sentiment.</p>
        </div>

        {validationErrors['stakeholders'] && (
          <div className="error-banner">{validationErrors['stakeholders']}</div>
        )}

        <div className="stakeholder-sections">
          {/* Media & Journalists */}
          <div className="stakeholder-group">
            <div className="group-header">
              <MediaIcon size={20} color="#00ffcc" />
              <label>Media & Publications ({formData.stakeholders.media.length} selected)</label>
            </div>
            <div className="stakeholder-grid">
              {stakeholders.media.map(outlet => (
                <div
                  key={outlet}
                  className={`stakeholder-chip ${formData.stakeholders.media.includes(outlet) ? 'selected' : ''}`}
                  onClick={() => toggleStakeholder('media', outlet)}
                >
                  {outlet}
                  {formData.stakeholders.media.includes(outlet) && <span className="chip-check">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Industry Influencers */}
          <div className="stakeholder-group">
            <div className="group-header">
              <StakeholderIcon size={20} color="#ff00ff" />
              <label>Industry Influencers ({formData.stakeholders.influencers.length} selected)</label>
            </div>
            <div className="stakeholder-grid">
              {stakeholders.influencers.map(influencer => (
                <div
                  key={influencer}
                  className={`stakeholder-chip ${formData.stakeholders.influencers.includes(influencer) ? 'selected' : ''}`}
                  onClick={() => toggleStakeholder('influencers', influencer)}
                >
                  {influencer}
                  {formData.stakeholders.influencers.includes(influencer) && <span className="chip-check">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Regulators */}
          <div className="stakeholder-group">
            <div className="group-header">
              <ExecutionIcon size={20} color="#00ff88" />
              <label>Regulatory Bodies ({formData.stakeholders.regulators.length} selected)</label>
            </div>
            <div className="stakeholder-grid">
              {stakeholders.regulators.map(regulator => (
                <div
                  key={regulator}
                  className={`stakeholder-chip ${formData.stakeholders.regulators.includes(regulator) ? 'selected' : ''}`}
                  onClick={() => toggleStakeholder('regulators', regulator)}
                >
                  {regulator}
                  {formData.stakeholders.regulators.includes(regulator) && <span className="chip-check">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Investors */}
          <div className="stakeholder-group">
            <div className="group-header">
              <OpportunityIcon size={20} color="#8800ff" />
              <label>Key Investors ({formData.stakeholders.investors.length} selected)</label>
            </div>
            <div className="stakeholder-grid">
              {stakeholders.investors.map(investor => (
                <div
                  key={investor}
                  className={`stakeholder-chip ${formData.stakeholders.investors.includes(investor) ? 'selected' : ''}`}
                  onClick={() => toggleStakeholder('investors', investor)}
                >
                  {investor}
                  {formData.stakeholders.investors.includes(investor) && <span className="chip-check">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="selection-summary">
          Total stakeholders selected: {Object.values(formData.stakeholders).flat().length}
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
              {steps[currentStep - 1].Icon && (
                <steps[currentStep - 1].Icon size={32} color={steps[currentStep - 1].color} />
              )}
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