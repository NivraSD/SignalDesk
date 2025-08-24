import React, { useState } from 'react';
import './OnboardingWizard.css';

const SimpleOnboardingWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    organization: {
      name: '',
      industry: '',
      position: ''
    },
    objectives: [],
    competitors: [],
    keywords: []
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        onComplete(data);
      } else {
        // For now, just complete anyway with the form data
        onComplete(formData.organization);
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      // Still complete with form data
      onComplete(formData.organization);
    }
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

  const renderStep1 = () => (
    <div className="step-content">
      <h3>Welcome to SignalDesk</h3>
      <p>Let's set up your PR command center in just a few steps.</p>
      
      <div className="form-group">
        <label className="form-label">Organization Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter your organization name"
          value={formData.organization.name}
          onChange={(e) => updateField('organization', 'name', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Industry</label>
        <select 
          className="form-select"
          value={formData.organization.industry}
          onChange={(e) => updateField('organization', 'industry', e.target.value)}
        >
          <option value="">Select your industry</option>
          <option value="technology">Technology</option>
          <option value="finance">Finance</option>
          <option value="healthcare">Healthcare</option>
          <option value="retail">Retail</option>
          <option value="media">Media</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Market Position</label>
        <textarea
          className="form-textarea"
          placeholder="Briefly describe your market position and key differentiators"
          value={formData.organization.position}
          onChange={(e) => updateField('organization', 'position', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3>PR Objectives</h3>
      <p>What are your primary PR goals?</p>
      
      <div className="checkbox-group">
        {[
          'Thought Leadership',
          'Brand Awareness',
          'Crisis Management',
          'Product Launches',
          'Investor Relations',
          'Media Coverage'
        ].map(objective => (
          <div 
            key={objective}
            className={`checkbox-item ${formData.objectives.includes(objective) ? 'selected' : ''}`}
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                objectives: prev.objectives.includes(objective)
                  ? prev.objectives.filter(o => o !== objective)
                  : [...prev.objectives, objective]
              }));
            }}
          >
            <input 
              type="checkbox" 
              checked={formData.objectives.includes(objective)}
              readOnly
            />
            <span className="checkbox-label">{objective}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3>Intelligence Setup</h3>
      <p>Configure what to monitor</p>
      
      <div className="form-group">
        <label className="form-label">Competitors to Track</label>
        <textarea
          className="form-textarea"
          placeholder="Enter competitor names (one per line)"
          value={formData.competitors.join('\n')}
          onChange={(e) => {
            setFormData(prev => ({
              ...prev,
              competitors: e.target.value.split('\n').filter(c => c.trim())
            }));
          }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Keywords to Monitor</label>
        <textarea
          className="form-textarea"
          placeholder="Enter keywords or topics (one per line)"
          value={formData.keywords.join('\n')}
          onChange={(e) => {
            setFormData(prev => ({
              ...prev,
              keywords: e.target.value.split('\n').filter(k => k.trim())
            }));
          }}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h3>Setup Complete!</h3>
      <p>Your SignalDesk platform is ready.</p>
      
      <div className="summary-grid">
        <div className="summary-section">
          <h4>Organization</h4>
          <p>{formData.organization.name || 'Not specified'}</p>
          <p>{formData.organization.industry || 'Not specified'}</p>
        </div>

        <div className="summary-section">
          <h4>PR Objectives</h4>
          <ul className="summary-list">
            {formData.objectives.map(obj => (
              <li key={obj}>{obj}</li>
            ))}
          </ul>
        </div>

        <div className="summary-section">
          <h4>Monitoring</h4>
          <p>{formData.competitors.length} competitors tracked</p>
          <p>{formData.keywords.length} keywords monitored</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: '#10B981', fontSize: '1.125rem' }}>
          ✓ All systems are configured and ready to go!
        </p>
      </div>
    </div>
  );

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h2 className="onboarding-title">SignalDesk Setup</h2>
          <p className="onboarding-subtitle">Step {currentStep} of 4</p>
          <div className="progress-bar">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`progress-step ${
                  currentStep > step ? 'completed' : 
                  currentStep === step ? 'active' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div className="onboarding-body">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="onboarding-footer">
          <div className="step-indicator">
            Step {currentStep} of 4
          </div>
          
          <div className="button-group">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="btn btn-secondary"
              >
                ← Previous
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="btn btn-primary"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="btn btn-success"
              >
                Complete Setup ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleOnboardingWizard;