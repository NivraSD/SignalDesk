import React, { useState } from 'react';
import './SimplifiedOnboarding.css';

/**
 * Minimal Onboarding - Only collect what actually matters
 * Let the AI figure out everything else
 */
const MinimalOnboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Identity (all we really need)
    company: {
      name: '',
      website: '',
      description: '' // Optional - helps with context
    },
    
    // Step 2: Goals (what outcomes they want)
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
    
    // Step 3: Urgency & Focus (optional refinement)
    priorities: {
      urgency: 'balanced', // immediate, balanced, long-term
      aggressiveness: 'moderate', // conservative, moderate, aggressive
      primary_focus: '' // One main goal from above
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

  const handleComplete = () => {
    // Transform into a clean config object
    const config = {
      organization: {
        name: formData.company.name,
        website: formData.company.website,
        description: formData.company.description,
        // Let AI determine these:
        industry: null, // AI will detect
        competitors: [], // AI will discover
        stakeholders: {}, // AI will map
        topics: [], // AI will identify based on goals
        keywords: [] // AI will generate
      },
      goals: formData.goals,
      priorities: formData.priorities,
      intelligence: {
        // System defaults - no user input needed
        alertFrequency: 'realtime',
        autoDiscovery: true,
        aiDriven: true
      }
    };

    // Save simplified config
    localStorage.setItem('signaldesk_onboarding', JSON.stringify(config));
    localStorage.setItem('signaldesk_minimal', 'true'); // Flag for minimal onboarding
    
    onComplete(config.organization);
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Tell us who you are</h2>
      <p className="step-description">
        We'll figure out everything else about your competitive landscape
      </p>

      <div className="form-group">
        <label>Company Name *</label>
        <input
          type="text"
          placeholder="e.g., Tesla, Mitsui & Co., OpenAI"
          value={formData.company.name}
          onChange={(e) => setFormData({
            ...formData,
            company: { ...formData.company, name: e.target.value }
          })}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>Website (optional but helpful)</label>
        <input
          type="url"
          placeholder="https://your-company.com"
          value={formData.company.website}
          onChange={(e) => setFormData({
            ...formData,
            company: { ...formData.company, website: e.target.value }
          })}
        />
      </div>

      <div className="form-group">
        <label>Brief Description (optional)</label>
        <textarea
          placeholder="What does your company do? (helps us understand context)"
          value={formData.company.description}
          onChange={(e) => setFormData({
            ...formData,
            company: { ...formData.company, description: e.target.value }
          })}
          rows="3"
        />
      </div>

      <div className="ai-note">
        <span className="ai-icon">🤖</span>
        <div>
          <strong>AI-Powered Discovery</strong>
          <p>Our system will automatically identify your industry, competitors, stakeholders, and monitoring priorities based on your company profile.</p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>What are your PR goals?</h2>
      <p className="step-description">
        Select all that apply - this helps us prioritize opportunities
      </p>

      <div className="goals-grid">
        {[
          { id: 'brand_awareness', icon: '📢', label: 'Brand Awareness', desc: 'Increase visibility and recognition' },
          { id: 'lead_generation', icon: '🎯', label: 'Lead Generation', desc: 'Drive business opportunities' },
          { id: 'thought_leadership', icon: '💡', label: 'Thought Leadership', desc: 'Establish industry expertise' },
          { id: 'crisis_management', icon: '🛡️', label: 'Crisis Management', desc: 'Protect and manage reputation' },
          { id: 'product_launches', icon: '🚀', label: 'Product Launches', desc: 'Maximize launch impact' },
          { id: 'investor_relations', icon: '💰', label: 'Investor Relations', desc: 'Communicate with investors' },
          { id: 'talent_acquisition', icon: '👥', label: 'Talent Acquisition', desc: 'Attract top talent' },
          { id: 'competitive_positioning', icon: '⚔️', label: 'Competitive Edge', desc: 'Outmaneuver competitors' }
        ].map(goal => (
          <div 
            key={goal.id}
            className={`goal-card ${formData.goals[goal.id] ? 'selected' : ''}`}
            onClick={() => setFormData({
              ...formData,
              goals: { ...formData.goals, [goal.id]: !formData.goals[goal.id] }
            })}
          >
            <div className="goal-icon">{goal.icon}</div>
            <div className="goal-content">
              <div className="goal-label">{goal.label}</div>
              <div className="goal-desc">{goal.desc}</div>
            </div>
            <div className="goal-check">
              {formData.goals[goal.id] && '✓'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedGoals = Object.entries(formData.goals)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);

    return (
      <div className="step-content">
        <h2>Set your approach</h2>
        <p className="step-description">
          Help us understand your PR style and urgency
        </p>

        <div className="form-group">
          <label>Primary Focus</label>
          <select
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

        <div className="form-group">
          <label>Urgency Level</label>
          <div className="radio-group">
            {[
              { value: 'immediate', label: 'Immediate', desc: 'Need results ASAP' },
              { value: 'balanced', label: 'Balanced', desc: 'Steady progress' },
              { value: 'long-term', label: 'Long-term', desc: 'Building for the future' }
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
                <div className="radio-content">
                  <div className="radio-label">{option.label}</div>
                  <div className="radio-desc">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>PR Aggressiveness</label>
          <div className="radio-group">
            {[
              { value: 'conservative', label: 'Conservative', desc: 'Careful and measured' },
              { value: 'moderate', label: 'Moderate', desc: 'Balanced approach' },
              { value: 'aggressive', label: 'Aggressive', desc: 'Bold and proactive' }
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
                <div className="radio-content">
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

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.company.name.trim().length > 0;
      case 2:
        return Object.values(formData.goals).some(v => v);
      case 3:
        return true; // Optional refinement
      default:
        return false;
    }
  };

  return (
    <div className="minimal-onboarding">
      <div className="onboarding-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="step-indicator">
          {[1, 2, 3].map(step => (
            <div 
              key={step}
              className={`step-dot ${currentStep >= step ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="onboarding-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="button-group">
          {currentStep > 1 && (
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              ← Back
            </button>
          )}
          <button 
            className="btn btn-primary"
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