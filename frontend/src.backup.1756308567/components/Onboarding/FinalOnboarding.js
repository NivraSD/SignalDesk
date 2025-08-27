import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingData } from '../../utils/onboardingAdapter';
import './FinalOnboarding.css';

const FinalOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Organization Basics
    organization: {
      name: '',
      domain: '',
      industry: '',
      size: 'medium'
    },
    
    // Step 2: Goals (Multiple Selection)
    goals: {
      // PR & Media Goals
      thought_leadership: false,
      media_coverage: false,
      speaking_opportunities: false,
      award_recognition: false,
      
      // Business Goals
      brand_awareness: false,
      lead_generation: false,
      investor_relations: false,
      talent_acquisition: false,
      
      // Protection Goals
      crisis_preparedness: false,
      reputation_management: false,
      competitive_positioning: false,
      regulatory_navigation: false,
      
      // Content Goals
      content_amplification: false,
      executive_visibility: false,
      product_launches: false,
      industry_influence: false
    },
    
    // Step 3: Stakeholder Selection
    stakeholders: []
  });

  // Predefined stakeholder groups by industry
  const getStakeholderOptions = () => {
    const baseStakeholders = [
      { id: 'tech_journalists', label: 'Tech Journalists', icon: '📰' },
      { id: 'industry_analysts', label: 'Industry Analysts', icon: '📊' },
      { id: 'investors', label: 'Investors & VCs', icon: '💰' },
      { id: 'customers', label: 'Customers', icon: '👥' },
      { id: 'partners', label: 'Partners', icon: '🤝' },
      { id: 'employees', label: 'Employees', icon: '👨‍💼' },
      { id: 'regulators', label: 'Regulators', icon: '⚖️' },
      { id: 'competitors', label: 'Competitors', icon: '🎯' },
      { id: 'influencers', label: 'Industry Influencers', icon: '⭐' },
      { id: 'community', label: 'Developer Community', icon: '💻' },
      { id: 'academics', label: 'Academics & Researchers', icon: '🎓' },
      { id: 'activists', label: 'Activists & NGOs', icon: '🌍' }
    ];

    // Add industry-specific stakeholders
    if (formData.organization.industry === 'healthcare') {
      baseStakeholders.push(
        { id: 'patients', label: 'Patient Groups', icon: '🏥' },
        { id: 'medical_professionals', label: 'Medical Professionals', icon: '👨‍⚕️' }
      );
    } else if (formData.organization.industry === 'finance') {
      baseStakeholders.push(
        { id: 'financial_regulators', label: 'Financial Regulators', icon: '🏦' },
        { id: 'institutional_investors', label: 'Institutional Investors', icon: '📈' }
      );
    }

    return baseStakeholders;
  };

  // Step renderers
  const renderStep1 = () => (
    <div className="step-content">
      <h2>Tell us about your organization</h2>
      <p className="step-description">Basic information to customize our intelligence gathering.</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Organization Name *</label>
          <input
            type="text"
            value={formData.organization.name}
            onChange={(e) => setFormData({...formData, organization: {...formData.organization, name: e.target.value}})}
            placeholder="e.g., Acme Corporation"
          />
        </div>
        
        <div className="form-group">
          <label>Website Domain *</label>
          <input
            type="text"
            value={formData.organization.domain}
            onChange={(e) => setFormData({...formData, organization: {...formData.organization, domain: e.target.value}})}
            placeholder="e.g., acme.com"
          />
        </div>

        <div className="form-group">
          <label>Industry *</label>
          <select
            value={formData.organization.industry}
            onChange={(e) => setFormData({...formData, organization: {...formData.organization, industry: e.target.value}})}
          >
            <option value="">Select Industry</option>
            <option value="technology">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Financial Services</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="energy">Energy</option>
            <option value="media">Media & Entertainment</option>
            <option value="education">Education</option>
            <option value="government">Government</option>
            <option value="nonprofit">Non-Profit</option>
          </select>
        </div>

        <div className="form-group">
          <label>Company Size</label>
          <select
            value={formData.organization.size}
            onChange={(e) => setFormData({...formData, organization: {...formData.organization, size: e.target.value}})}
          >
            <option value="startup">Startup (1-50)</option>
            <option value="small">Small (51-200)</option>
            <option value="medium">Medium (201-1000)</option>
            <option value="large">Large (1001-5000)</option>
            <option value="enterprise">Enterprise (5000+)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>What are your goals?</h2>
      <p className="step-description">Select all that apply. We'll optimize our intelligence gathering for these objectives.</p>
      
      <div className="goals-section">
        <h3>PR & Media Goals</h3>
        <div className="goals-grid">
          {[
            { id: 'thought_leadership', label: 'Thought Leadership', icon: '🎓' },
            { id: 'media_coverage', label: 'Media Coverage', icon: '📰' },
            { id: 'speaking_opportunities', label: 'Speaking Opportunities', icon: '🎤' },
            { id: 'award_recognition', label: 'Award Recognition', icon: '🏆' }
          ].map(goal => (
            <label key={goal.id} className={`goal-card ${formData.goals[goal.id] ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={formData.goals[goal.id]}
                onChange={(e) => setFormData({
                  ...formData,
                  goals: { ...formData.goals, [goal.id]: e.target.checked }
                })}
                style={{display: 'none'}}
              />
              <span className="goal-icon">{goal.icon}</span>
              <span className="goal-label">{goal.label}</span>
            </label>
          ))}
        </div>

        <h3>Business Goals</h3>
        <div className="goals-grid">
          {[
            { id: 'brand_awareness', label: 'Brand Awareness', icon: '📈' },
            { id: 'lead_generation', label: 'Lead Generation', icon: '🎯' },
            { id: 'investor_relations', label: 'Investor Relations', icon: '💰' },
            { id: 'talent_acquisition', label: 'Talent Acquisition', icon: '👥' }
          ].map(goal => (
            <label key={goal.id} className={`goal-card ${formData.goals[goal.id] ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={formData.goals[goal.id]}
                onChange={(e) => setFormData({
                  ...formData,
                  goals: { ...formData.goals, [goal.id]: e.target.checked }
                })}
                style={{display: 'none'}}
              />
              <span className="goal-icon">{goal.icon}</span>
              <span className="goal-label">{goal.label}</span>
            </label>
          ))}
        </div>

        <h3>Protection & Positioning</h3>
        <div className="goals-grid">
          {[
            { id: 'crisis_preparedness', label: 'Crisis Preparedness', icon: '🛡️' },
            { id: 'reputation_management', label: 'Reputation Management', icon: '⭐' },
            { id: 'competitive_positioning', label: 'Competitive Positioning', icon: '🥊' },
            { id: 'regulatory_navigation', label: 'Regulatory Navigation', icon: '⚖️' }
          ].map(goal => (
            <label key={goal.id} className={`goal-card ${formData.goals[goal.id] ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={formData.goals[goal.id]}
                onChange={(e) => setFormData({
                  ...formData,
                  goals: { ...formData.goals, [goal.id]: e.target.checked }
                })}
                style={{display: 'none'}}
              />
              <span className="goal-icon">{goal.icon}</span>
              <span className="goal-label">{goal.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Who should we track?</h2>
      <p className="step-description">Select the stakeholder groups you want to monitor and engage with.</p>
      
      <div className="stakeholder-selection">
        <div className="stakeholder-grid">
          {getStakeholderOptions().map(stakeholder => (
            <label 
              key={stakeholder.id} 
              className={`stakeholder-card ${formData.stakeholders.includes(stakeholder.id) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={formData.stakeholders.includes(stakeholder.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      stakeholders: [...formData.stakeholders, stakeholder.id]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      stakeholders: formData.stakeholders.filter(s => s !== stakeholder.id)
                    });
                  }
                }}
                style={{display: 'none'}}
              />
              <span className="stakeholder-icon">{stakeholder.icon}</span>
              <span className="stakeholder-label">{stakeholder.label}</span>
            </label>
          ))}
        </div>

        <div className="always-on-features">
          <h3>✨ What SignalDesk will do</h3>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">🌊</span>
              <div>
                <strong>Cascade Prediction</strong>
                <p>Predict how events will ripple through your stakeholder ecosystem</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <div>
                <strong>Opportunity Detection</strong>
                <p>Find perfect moments for your message based on stakeholder activity</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📖</span>
              <div>
                <strong>Narrative Intelligence</strong>
                <p>Track how stories evolve and identify narrative gaps you can fill</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const selectedGoals = Object.entries(formData.goals)
      .filter(([_, selected]) => selected)
      .map(([goal]) => goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    
    const selectedStakeholders = formData.stakeholders
      .map(id => getStakeholderOptions().find(s => s.id === id)?.label)
      .filter(Boolean);

    return (
      <div className="step-content">
        <h2>Ready to launch SignalDesk</h2>
        <p className="step-description">Here's what we'll start doing for {formData.organization.name || 'your organization'}:</p>
        
        <div className="launch-summary">
          <div className="summary-section">
            <h3>🎯 Your Goals</h3>
            <div className="summary-items">
              {selectedGoals.length > 0 ? selectedGoals.map((goal, idx) => (
                <span key={idx} className="summary-chip">{goal}</span>
              )) : <span className="summary-empty">No goals selected</span>}
            </div>
          </div>

          <div className="summary-section">
            <h3>👥 Monitoring These Groups</h3>
            <div className="summary-items">
              {selectedStakeholders.length > 0 ? selectedStakeholders.map((stakeholder, idx) => (
                <span key={idx} className="summary-chip">{stakeholder}</span>
              )) : <span className="summary-empty">No stakeholders selected</span>}
            </div>
          </div>

          <div className="summary-section immediate">
            <h3>🚀 Immediate Actions (First Hour)</h3>
            <ul>
              <li>Map your {formData.organization.industry || 'industry'} ecosystem</li>
              <li>Identify key journalists and influencers</li>
              <li>Discover current opportunities</li>
              <li>Analyze competitor strategies</li>
              <li>Set up continuous monitoring</li>
            </ul>
          </div>

          <div className="summary-section ongoing">
            <h3>📊 What You'll Get</h3>
            <ul>
              <li>Real-time opportunity alerts</li>
              <li>Stakeholder activity insights</li>
              <li>Cascade predictions for major events</li>
              <li>Narrative gap analysis</li>
              <li>Automated content suggestions</li>
            </ul>
          </div>
        </div>

        <div className="final-message">
          <div className="message-box ready">
            <h3>✅ Everything is configured</h3>
            <p>
              SignalDesk will begin monitoring your ecosystem, finding opportunities, 
              and helping you stay ahead of narratives. The system learns from your 
              interactions to continuously improve recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const startSignalDesk = async () => {
    setIsLoading(true);
    
    try {
      // Create complete configuration
      const config = {
        ...formData,
        timestamp: new Date().toISOString(),
        version: '2.0'
      };
      
      // Save using both old format (for compatibility) and new intelligence pipeline format
      localStorage.setItem('signaldesk_onboarding', JSON.stringify(config));
      localStorage.setItem('signaldesk_organization', JSON.stringify(formData.organization));
      localStorage.setItem('signaldesk_completed', 'true');
      
      // Save and convert to intelligence profile format
      const profile = await saveOnboardingData(config);
      console.log('✅ Organization profile created:', profile.organization.name);
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to initializer
      navigate('/initialize');
      
    } catch (error) {
      console.error('Error starting SignalDesk:', error);
      alert('There was an error starting SignalDesk. Please try again.');
      setIsLoading(false);
    }
  };

  // Validation
  const canProceed = () => {
    switch(currentStep) {
      case 1:
        return formData.organization.name && formData.organization.domain && formData.organization.industry;
      case 2:
        return Object.values(formData.goals).some(g => g);
      case 3:
        return formData.stakeholders.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="comprehensive-onboarding">
      <div className="onboarding-header">
        <h1>Welcome to SignalDesk</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
        </div>
        <div className="step-indicators">
          {['Organization', 'Goals', 'Stakeholders', 'Launch'].map((label, idx) => (
            <div
              key={idx}
              className={`step-indicator ${currentStep === idx + 1 ? 'active' : ''} ${currentStep > idx + 1 ? 'completed' : ''}`}
            >
              <span className="step-number">{idx + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="onboarding-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      <div className="onboarding-footer">
        {currentStep > 1 && (
          <button onClick={handlePrevious} className="btn-secondary">
            Previous
          </button>
        )}
        {currentStep < 4 ? (
          <button 
            onClick={handleNext} 
            className="btn-primary"
            disabled={!canProceed()}
          >
            Next
          </button>
        ) : (
          <button 
            onClick={startSignalDesk} 
            className="btn-primary deploy-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : '🚀 Start SignalDesk'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FinalOnboarding;