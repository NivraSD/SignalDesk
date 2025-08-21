import React, { useState } from 'react';
import './MinimalOnboarding.css';

/**
 * Minimal Onboarding - AI-powered discovery with proper neon styling
 */
const MinimalOnboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Just the essentials
    company: {
      name: '',
      website: '',
      description: ''
    },
    
    // Step 2: Goals drive everything
    goals: {
      brand_awareness: false,
      lead_generation: false,
      thought_leadership: false,
      crisis_management: false,
      product_launches: false,
      investor_relations: false,
      talent_acquisition: false,
      competitive_positioning: false
    },
    
    // Step 3: Approach
    priorities: {
      urgency: 'balanced',
      aggressiveness: 'moderate',
      primary_focus: ''
    }
  });

  const totalSteps = 3;

  const handleNext = () => {
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

  const handleComplete = () => {
    const config = {
      organization: {
        name: formData.company.name,
        website: formData.company.website,
        description: formData.company.description,
        industry: null, // AI will detect
        competitors: [], // AI will discover
        stakeholders: {}, // AI will map
        topics: [], // AI will identify
        keywords: [] // AI will generate
      },
      goals: formData.goals,
      priorities: formData.priorities,
      intelligence: {
        alertFrequency: 'realtime',
        autoDiscovery: true,
        aiDriven: true
      }
    };

    localStorage.setItem('signaldesk_onboarding', JSON.stringify(config));
    localStorage.setItem('signaldesk_minimal', 'true');
    
    if (typeof onComplete === 'function') {
      onComplete(config.organization);
    } else {
      window.location.href = '/dashboard';
    }
  };

  const toggleGoal = (goalId) => {
    setFormData({
      ...formData,
      goals: { ...formData.goals, [goalId]: !formData.goals[goalId] }
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.company.name.trim().length > 0;
      case 2:
        return Object.values(formData.goals).some(v => v);
      case 3:
        return true; // Optional
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <div className="form-section">
        <label className="input-label">
          Company Name <span className="required">*</span>
        </label>
        <input
          type="text"
          className="neon-input"
          placeholder="e.g., Tesla, OpenAI, Mitsui & Co."
          value={formData.company.name}
          onChange={(e) => setFormData({
            ...formData,
            company: { ...formData.company, name: e.target.value }
          })}
          autoFocus
        />
      </div>

      <div className="form-section">
        <label className="input-label">Website</label>
        <input
          type="url"
          className="neon-input"
          placeholder="https://your-company.com"
          value={formData.company.website}
          onChange={(e) => setFormData({
            ...formData,
            company: { ...formData.company, website: e.target.value }
          })}
        />
        <span className="field-hint">Optional but helps with accuracy</span>
      </div>

      <div className="form-section">
        <label className="input-label">What does your company do?</label>
        <textarea
          className="neon-textarea"
          placeholder="Brief description to help our AI understand your business..."
          value={formData.company.description}
          onChange={(e) => setFormData({
            ...formData,
            company: { ...formData.company, description: e.target.value }
          })}
          rows="4"
        />
        <span className="field-hint">Optional - helps with context</span>
      </div>

      <div className="ai-discovery-note">
        <div className="note-icon">🤖</div>
        <div className="note-content">
          <div className="note-title">AI-Powered Discovery</div>
          <div className="note-text">
            Our system will automatically identify your industry, discover your real competitors, 
            map stakeholders, and determine what to monitor based on your goals.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const goals = [
      { id: 'brand_awareness', icon: '📢', label: 'Brand Awareness', desc: 'Increase visibility' },
      { id: 'lead_generation', icon: '🎯', label: 'Lead Generation', desc: 'Drive opportunities' },
      { id: 'thought_leadership', icon: '💡', label: 'Thought Leadership', desc: 'Industry expertise' },
      { id: 'crisis_management', icon: '🛡️', label: 'Crisis Management', desc: 'Protect reputation' },
      { id: 'product_launches', icon: '🚀', label: 'Product Launches', desc: 'Launch impact' },
      { id: 'investor_relations', icon: '💰', label: 'Investor Relations', desc: 'Investor comms' },
      { id: 'talent_acquisition', icon: '👥', label: 'Talent Acquisition', desc: 'Attract talent' },
      { id: 'competitive_positioning', icon: '⚔️', label: 'Competitive Edge', desc: 'Market position' }
    ];

    const selectedCount = Object.values(formData.goals).filter(v => v).length;

    return (
      <div className="step-content">
        <div className="goals-grid">
          {goals.map(goal => (
            <div 
              key={goal.id}
              className={`goal-card ${formData.goals[goal.id] ? 'selected' : ''}`}
              onClick={() => toggleGoal(goal.id)}
            >
              <div className="goal-icon">{goal.icon}</div>
              <div className="goal-info">
                <div className="goal-label">{goal.label}</div>
                <div className="goal-desc">{goal.desc}</div>
              </div>
              <div className={`goal-checkbox ${formData.goals[goal.id] ? 'checked' : ''}`}>
                {formData.goals[goal.id] && '✓'}
              </div>
            </div>
          ))}
        </div>
        <div className="selection-counter">
          {selectedCount} {selectedCount === 1 ? 'goal' : 'goals'} selected
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const selectedGoals = Object.entries(formData.goals)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);

    return (
      <div className="step-content">
        {selectedGoals.length > 0 && (
          <div className="form-section">
            <label className="input-label">Primary Focus</label>
            <select
              className="neon-select"
              value={formData.priorities.primary_focus}
              onChange={(e) => setFormData({
                ...formData,
                priorities: { ...formData.priorities, primary_focus: e.target.value }
              })}
            >
              <option value="">Select your #1 priority</option>
              {selectedGoals.map(goal => (
                <option key={goal} value={goal}>
                  {goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-section">
          <label className="input-label">Timeline Urgency</label>
          <div className="radio-group">
            {[
              { value: 'immediate', label: 'Immediate', desc: 'Need results now' },
              { value: 'balanced', label: 'Balanced', desc: 'Steady progress' },
              { value: 'long-term', label: 'Long-term', desc: 'Building for future' }
            ].map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  checked={formData.priorities.urgency === option.value}
                  onChange={(e) => setFormData({
                    ...formData,
                    priorities: { ...formData.priorities, urgency: e.target.value }
                  })}
                />
                <div className="radio-card">
                  <div className="radio-label">{option.label}</div>
                  <div className="radio-desc">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="input-label">PR Style</label>
          <div className="radio-group">
            {[
              { value: 'conservative', label: 'Conservative', desc: 'Careful approach' },
              { value: 'moderate', label: 'Moderate', desc: 'Balanced strategy' },
              { value: 'aggressive', label: 'Aggressive', desc: 'Bold moves' }
            ].map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name="aggressiveness"
                  value={option.value}
                  checked={formData.priorities.aggressiveness === option.value}
                  onChange={(e) => setFormData({
                    ...formData,
                    priorities: { ...formData.priorities, aggressiveness: e.target.value }
                  })}
                />
                <div className="radio-card">
                  <div className="radio-label">{option.label}</div>
                  <div className="radio-desc">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const stepTitles = {
    1: "Tell us who you are",
    2: "What are your PR goals?",
    3: "Set your approach"
  };

  const stepSubtitles = {
    1: "We'll discover everything else automatically",
    2: "Select all that apply - this drives our intelligence",
    3: "Help us understand your style"
  };

  return (
    <div className="minimal-onboarding">
      <div className="onboarding-wrapper">
        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="progress-dots">
            {[1, 2, 3].map(step => (
              <div 
                key={step}
                className={`progress-dot ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="onboarding-header">
          <h1>{stepTitles[currentStep]}</h1>
          <p className="subtitle">{stepSubtitles[currentStep]}</p>
        </div>

        {/* Content */}
        <div className="onboarding-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          {currentStep > 1 && (
            <button 
              className="btn-secondary"
              onClick={handlePrevious}
            >
              ← Back
            </button>
          )}
          <button 
            className="btn-primary"
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            {currentStep === totalSteps ? 'Start Intelligence Gathering →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimalOnboarding;