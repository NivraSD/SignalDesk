import React, { useState, useEffect } from 'react';
import './UnifiedOnboarding.css';

const UnifiedOnboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState({
    // Organization Basics (used by Intelligence Hub)
    organization: {
      id: '',
      name: '',
      industry: '',
      website: '',
      description: ''
    },
    
    // Competitors (used by Intelligence Hub)
    competitors: [],
    
    // Topics to Monitor (used by Intelligence Hub)
    monitoring_topics: [],
    
    // Brand & Voice (Opportunity Engine)
    brand: {
      voice: 'professional', // professional, conversational, bold, technical
      risk_tolerance: 'moderate', // conservative, moderate, aggressive
      response_speed: 'considered' // immediate, considered, strategic
    },
    
    // Key Messages (Opportunity Engine)
    messaging: {
      core_value_props: [],
      proof_points: [],
      competitive_advantages: [],
      key_narratives: []
    },
    
    // Media Strategy (Opportunity Engine)
    media: {
      preferred_tiers: [], // tier1_business, tier1_tech, trade, regional
      journalist_relationships: [],
      no_comment_topics: [],
      exclusive_partners: []
    },
    
    // Spokespeople (Opportunity Engine)
    spokespeople: [],
    
    // Opportunity Preferences (Opportunity Engine)
    opportunities: {
      types: {
        competitor_weakness: true,
        narrative_vacuum: true,
        cascade_effect: true,
        crisis_prevention: true,
        alliance_opening: false
      },
      minimum_confidence: 70,
      auto_execute_threshold: 95
    }
  });

  const steps = [
    { id: 1, title: 'Organization', icon: '🏢', required: true },
    { id: 2, title: 'Brand Voice', icon: '🎯', required: true },
    { id: 3, title: 'Key Messages', icon: '💬', required: false },
    { id: 4, title: 'Media Strategy', icon: '📰', required: false },
    { id: 5, title: 'Opportunities', icon: '💎', required: true }
  ];

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        saveProfile();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (!steps[currentStep - 1].required) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        saveProfile();
      }
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return profile.organization.name; // Only name required now
      case 2:
        return true; // Has defaults for brand voice
      default:
        return true;
    }
  };

  const saveProfile = async () => {
    // Ensure organization has an ID
    if (!profile.organization.id && profile.organization.name) {
      profile.organization.id = profile.organization.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Save unified profile
    const unifiedProfile = {
      ...profile,
      timestamp: new Date().toISOString(),
      version: '2.0'
    };
    
    // Save to localStorage
    localStorage.setItem('signaldesk_unified_profile', JSON.stringify(unifiedProfile));
    
    // Also save specific parts for backward compatibility
    localStorage.setItem('signaldesk_organization', JSON.stringify(profile.organization));
    localStorage.setItem('opportunity_profile', JSON.stringify({
      ...profile.brand,
      ...profile.messaging,
      ...profile.media,
      spokespeople: profile.spokespeople,
      opportunity_types: profile.opportunities.types,
      minimum_confidence: profile.opportunities.minimum_confidence,
      auto_execute_threshold: profile.opportunities.auto_execute_threshold,
      competitors: profile.competitors
    }));
    
    // Keep old onboarding for backward compatibility but with new structure
    localStorage.setItem('signaldesk_onboarding', JSON.stringify({
      organization: profile.organization,
      competitors: profile.competitors,
      monitoring_topics: profile.monitoring_topics
    }));
    
    // Handle completion - redirect if no onComplete provided
    if (onComplete) {
      onComplete(unifiedProfile);
    } else {
      // Redirect to main app after successful setup
      window.location.href = '/';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderOrganization();
      case 2:
        return renderBrandVoice();
      case 3:
        return renderKeyMessages();
      case 4:
        return renderMediaStrategy();
      case 5:
        return renderOpportunities();
      default:
        return null;
    }
  };

  const renderOrganization = () => (
    <div className="onboarding-step">
      <h2>Tell us about your organization</h2>
      <p className="step-description">We'll discover your competitors and industry details through our intelligence engine.</p>
      
      <div className="form-group">
        <label>Organization Name *</label>
        <input
          type="text"
          placeholder="e.g., Toyota"
          value={profile.organization.name}
          onChange={(e) => setProfile({
            ...profile,
            organization: { ...profile.organization, name: e.target.value }
          })}
          className="form-input"
        />
      </div>


      <div className="form-group">
        <label>Website (optional)</label>
        <input
          type="url"
          placeholder="https://www.toyota.com"
          value={profile.organization.website}
          onChange={(e) => setProfile({
            ...profile,
            organization: { ...profile.organization, website: e.target.value }
          })}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Brief Description</label>
        <textarea
          placeholder="What does your organization do?"
          value={profile.organization.description}
          onChange={(e) => setProfile({
            ...profile,
            organization: { ...profile.organization, description: e.target.value }
          })}
          className="form-textarea"
          rows={3}
        />
      </div>
    </div>
  );

  // Removed renderCompetitors - will be discovered through intelligence

  const renderBrandVoice = () => (
    <div className="onboarding-step">
      <h2>How does {profile.organization.name || 'your organization'} communicate?</h2>
      <p className="step-description">This helps us generate content and responses that match your brand.</p>
      
      <div className="form-group">
        <label>Brand Voice</label>
        <div className="option-grid">
          {[
            { value: 'professional', label: 'Professional', desc: 'Formal, authoritative' },
            { value: 'conversational', label: 'Conversational', desc: 'Friendly, approachable' },
            { value: 'bold', label: 'Bold', desc: 'Confident, assertive' },
            { value: 'technical', label: 'Technical', desc: 'Detailed, precise' },
            { value: 'inspirational', label: 'Inspirational', desc: 'Visionary, motivating' }
          ].map(option => (
            <button
              key={option.value}
              className={`option-card ${profile.brand.voice === option.value ? 'selected' : ''}`}
              onClick={() => setProfile({
                ...profile,
                brand: { ...profile.brand, voice: option.value }
              })}
            >
              <strong>{option.label}</strong>
              <span>{option.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Risk Tolerance</label>
        <div className="option-grid">
          {[
            { value: 'conservative', label: 'Conservative', desc: 'Careful, measured responses' },
            { value: 'moderate', label: 'Moderate', desc: 'Balanced approach' },
            { value: 'aggressive', label: 'Aggressive', desc: 'First-mover, bold statements' }
          ].map(option => (
            <button
              key={option.value}
              className={`option-card ${profile.brand.risk_tolerance === option.value ? 'selected' : ''}`}
              onClick={() => setProfile({
                ...profile,
                brand: { ...profile.brand, risk_tolerance: option.value }
              })}
            >
              <strong>{option.label}</strong>
              <span>{option.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Response Speed</label>
        <div className="option-grid">
          {[
            { value: 'immediate', label: 'Immediate', desc: 'First to respond' },
            { value: 'considered', label: 'Considered', desc: 'Thoughtful responses' },
            { value: 'strategic', label: 'Strategic', desc: 'Wait for right moment' }
          ].map(option => (
            <button
              key={option.value}
              className={`option-card ${profile.brand.response_speed === option.value ? 'selected' : ''}`}
              onClick={() => setProfile({
                ...profile,
                brand: { ...profile.brand, response_speed: option.value }
              })}
            >
              <strong>{option.label}</strong>
              <span>{option.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKeyMessages = () => (
    <div className="onboarding-step">
      <h2>Key Messages & Proof Points</h2>
      <p className="step-description">Optional: Add your core messages and supporting evidence. You can skip this for now.</p>
      
      <div className="form-group">
        <label>Core Value Propositions</label>
        <div className="input-list">
          {profile.messaging.core_value_props.map((prop, idx) => (
            <div key={idx} className="input-item">
              <input
                type="text"
                value={prop}
                onChange={(e) => {
                  const newProps = [...profile.messaging.core_value_props];
                  newProps[idx] = e.target.value;
                  setProfile({
                    ...profile,
                    messaging: { ...profile.messaging, core_value_props: newProps }
                  });
                }}
                placeholder="e.g., 'Industry-leading reliability'"
                className="form-input"
              />
              <button
                onClick={() => {
                  const newProps = profile.messaging.core_value_props.filter((_, i) => i !== idx);
                  setProfile({
                    ...profile,
                    messaging: { ...profile.messaging, core_value_props: newProps }
                  });
                }}
                className="remove-btn"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setProfile({
              ...profile,
              messaging: {
                ...profile.messaging,
                core_value_props: [...profile.messaging.core_value_props, '']
              }
            })}
            className="add-btn-small"
          >
            + Add Value Proposition
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Proof Points</label>
        <div className="input-list">
          {profile.messaging.proof_points.map((point, idx) => (
            <div key={idx} className="input-item">
              <input
                type="text"
                value={point}
                onChange={(e) => {
                  const newPoints = [...profile.messaging.proof_points];
                  newPoints[idx] = e.target.value;
                  setProfile({
                    ...profile,
                    messaging: { ...profile.messaging, proof_points: newPoints }
                  });
                }}
                placeholder="e.g., '#1 in customer satisfaction for 5 years'"
                className="form-input"
              />
              <button
                onClick={() => {
                  const newPoints = profile.messaging.proof_points.filter((_, i) => i !== idx);
                  setProfile({
                    ...profile,
                    messaging: { ...profile.messaging, proof_points: newPoints }
                  });
                }}
                className="remove-btn"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setProfile({
              ...profile,
              messaging: {
                ...profile.messaging,
                proof_points: [...profile.messaging.proof_points, '']
              }
            })}
            className="add-btn-small"
          >
            + Add Proof Point
          </button>
        </div>
      </div>
    </div>
  );

  const renderMediaStrategy = () => (
    <div className="onboarding-step">
      <h2>Media Preferences</h2>
      <p className="step-description">Optional: Select your preferred media outlets. You can configure this later.</p>
      
      <div className="form-group">
        <label>Preferred Media Tiers</label>
        <div className="checkbox-grid">
          {[
            { id: 'tier1_business', label: 'Business Media', desc: 'WSJ, Bloomberg, FT' },
            { id: 'tier1_tech', label: 'Tech Media', desc: 'TechCrunch, Verge' },
            { id: 'tier1_general', label: 'General News', desc: 'NYT, CNN, BBC' },
            { id: 'trade', label: 'Trade Publications', desc: 'Industry-specific' },
            { id: 'regional', label: 'Regional Media', desc: 'Local coverage' }
          ].map(tier => (
            <label key={tier.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={profile.media.preferred_tiers.includes(tier.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setProfile({
                      ...profile,
                      media: {
                        ...profile.media,
                        preferred_tiers: [...profile.media.preferred_tiers, tier.id]
                      }
                    });
                  } else {
                    setProfile({
                      ...profile,
                      media: {
                        ...profile.media,
                        preferred_tiers: profile.media.preferred_tiers.filter(t => t !== tier.id)
                      }
                    });
                  }
                }}
              />
              <div className="checkbox-content">
                <strong>{tier.label}</strong>
                <span>{tier.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOpportunities = () => (
    <div className="onboarding-step">
      <h2>What opportunities should we pursue?</h2>
      <p className="step-description">Choose which types of opportunities to detect and act on.</p>
      
      <div className="form-group">
        <label>Opportunity Types</label>
        <div className="checkbox-grid">
          {[
            {
              id: 'competitor_weakness',
              label: 'Competitor Weakness',
              desc: 'Capitalize when competitors stumble',
              icon: '🎯'
            },
            {
              id: 'narrative_vacuum',
              label: 'Narrative Vacuum',
              desc: 'Own unclaimed stories',
              icon: '📢'
            },
            {
              id: 'cascade_effect',
              label: 'Cascade Prediction',
              desc: 'Get ahead of spreading trends',
              icon: '🌊'
            },
            {
              id: 'crisis_prevention',
              label: 'Crisis Prevention',
              desc: 'Proactive risk mitigation',
              icon: '🛡️'
            },
            {
              id: 'alliance_opening',
              label: 'Partnerships',
              desc: 'Strategic collaborations',
              icon: '🤝'
            }
          ].map(type => (
            <label key={type.id} className="checkbox-item opportunity-type">
              <input
                type="checkbox"
                checked={profile.opportunities.types[type.id]}
                onChange={(e) => {
                  setProfile({
                    ...profile,
                    opportunities: {
                      ...profile.opportunities,
                      types: {
                        ...profile.opportunities.types,
                        [type.id]: e.target.checked
                      }
                    }
                  });
                }}
              />
              <div className="checkbox-content">
                <span className="type-icon">{type.icon}</span>
                <div>
                  <strong>{type.label}</strong>
                  <span>{type.desc}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Confidence Thresholds</label>
        <div className="threshold-settings">
          <div className="threshold-item">
            <label>Minimum confidence to show opportunity</label>
            <div className="slider-container">
              <input
                type="range"
                min="50"
                max="100"
                value={profile.opportunities.minimum_confidence}
                onChange={(e) => setProfile({
                  ...profile,
                  opportunities: {
                    ...profile.opportunities,
                    minimum_confidence: parseInt(e.target.value)
                  }
                })}
                className="slider"
              />
              <span className="slider-value">{profile.opportunities.minimum_confidence}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if profile already exists
  useEffect(() => {
    const existingProfile = localStorage.getItem('signaldesk_unified_profile');
    if (existingProfile) {
      const parsed = JSON.parse(existingProfile);
      setProfile(parsed);
    } else {
      // Check for legacy onboarding data
      const legacyOnboarding = localStorage.getItem('signaldesk_onboarding');
      if (legacyOnboarding) {
        const legacy = JSON.parse(legacyOnboarding);
        setProfile(prev => ({
          ...prev,
          organization: legacy.organization || prev.organization,
          competitors: legacy.competitors || prev.competitors
        }));
      }
    }
  }, []);

  return (
    <div className="unified-onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Welcome to SignalDesk</h1>
          <p>Let's configure your intelligent opportunity engine</p>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
          <div className="progress-steps">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`progress-step ${currentStep >= step.id ? 'completed' : ''} ${currentStep === step.id ? 'active' : ''}`}
              >
                <div className="step-circle">
                  <span className="step-icon">{step.icon}</span>
                </div>
                <span className="step-label">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="onboarding-content">
          {renderStep()}
        </div>

        <div className="onboarding-footer">
          <button
            className="btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </button>
          
          <div className="footer-right">
            {!steps[currentStep - 1].required && (
              <button
                className="btn-ghost"
                onClick={handleSkip}
              >
                Skip for now
              </button>
            )}
            
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!validateCurrentStep()}
            >
              {currentStep === steps.length ? 'Complete Setup' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedOnboarding;