import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import './SimplifiedOnboarding.css';

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SimplifiedOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [organizationIntelligence, setOrganizationIntelligence] = useState(null);
  const [systemPlan, setSystemPlan] = useState(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Organization Basics
    organization: {
      name: '',
      domain: '', // Website domain for entity recognition
      industry: '',
      size: 'medium', // small, medium, large, enterprise
      headquarters: '',
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
    
    // Step 3: Intelligence Focus
    intelligence: {
      // What to track
      stakeholders: '', // Comma-separated list
      topics: '', // Comma-separated list  
      competitors: [], // Auto-populated from intelligence
      
      // How to engage
      cascadeMonitoring: true, // Always on - predict ripple effects
      opportunityDetection: true, // Always on - find PR opportunities
      narrativeTracking: true, // Always on - track narratives
    }
  });

  // Fetch organization intelligence when domain is entered
  const fetchOrganizationIntelligence = async (domain) => {
    if (!domain || !domain.includes('.')) return;
    
    setIsLoading(true);
    try {
      // Simulate intelligence gathering (in production, this would call MCPs)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock intelligence data
      const mockIntelligence = {
        industry: formData.organization.industry || 'technology',
        competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
        currentSentiment: 'Positive (78%)',
        mediaPresence: 'Moderate - 12 mentions last month',
        opportunities: [
          'Industry conference next month',
          'Trending topic alignment: AI Ethics',
          'Competitor weakness: Customer service'
        ],
        stakeholders: ['TechCrunch', 'WSJ Tech', 'Industry Analysts', 'VC Community']
      };
      
      setOrganizationIntelligence(mockIntelligence);
      
      // Auto-populate competitors
      setFormData(prev => ({
        ...prev,
        intelligence: {
          ...prev.intelligence,
          competitors: mockIntelligence.competitors
        }
      }));
    } catch (error) {
      console.error('Error fetching organization intelligence:', error);
    }
    setIsLoading(false);
  };

  // Generate what SignalDesk will do based on configuration
  const generateSystemPlan = () => {
    const selectedGoals = Object.entries(formData.goals)
      .filter(([_, selected]) => selected)
      .map(([goal]) => goal);
    
    const plan = {
      immediateActions: [],
      ongoingActivities: [],
      deliverables: [],
      timeline: {}
    };

    // Immediate Actions (First 24 hours)
    plan.immediateActions = [
      `Map the ${formData.organization.industry} media landscape`,
      `Identify journalists covering ${formData.intelligence.topics || 'your industry'}`,
      `Analyze ${formData.intelligence.competitors.length} competitor strategies`,
      'Discover immediate PR opportunities',
      'Set up stakeholder monitoring system'
    ];

    // Ongoing Activities based on goals
    if (formData.goals.thought_leadership) {
      plan.ongoingActivities.push('Track speaking opportunities at industry events');
      plan.ongoingActivities.push('Monitor thought leadership topics and gaps');
    }
    
    if (formData.goals.media_coverage) {
      plan.ongoingActivities.push('Identify journalist interests and editorial calendars');
      plan.ongoingActivities.push('Generate personalized pitch suggestions');
    }
    
    if (formData.goals.speaking_opportunities) {
      plan.ongoingActivities.push('Monitor conference CFPs and panel opportunities');
      plan.ongoingActivities.push('Track industry event schedules');
    }
    
    if (formData.goals.crisis_preparedness) {
      plan.ongoingActivities.push('Monitor for potential crisis signals');
      plan.ongoingActivities.push('Maintain crisis response templates');
    }
    
    if (formData.goals.competitive_positioning) {
      plan.ongoingActivities.push('Track competitor announcements and strategies');
      plan.ongoingActivities.push('Identify competitive gaps to exploit');
    }

    // Always-on activities
    plan.ongoingActivities.push('Predict cascade effects of major events (2nd/3rd order impacts)');
    plan.ongoingActivities.push('Score and prioritize opportunities by impact');
    plan.ongoingActivities.push('Learn from outcomes to improve recommendations');

    // Deliverables
    plan.deliverables = [
      'Daily opportunity alerts tailored to your goals',
      'Weekly intelligence briefings on your industry',
      'Automated draft content for high-priority opportunities',
      'Stakeholder relationship insights and recommendations',
      'Predictive analysis of emerging narratives'
    ];

    // Timeline
    plan.timeline = {
      'Now': 'System initialization and data gathering',
      '1 Hour': 'Complete industry landscape mapping',
      '4 Hours': 'First opportunity recommendations ready',
      '24 Hours': 'Full monitoring system operational',
      'Week 1': 'Personalized insights and patterns emerging',
      'Month 1': 'Optimized recommendations based on your engagement'
    };

    setSystemPlan(plan);
  };

  // Step renderers
  const renderStep1 = () => (
    <div className="step-content">
      <h2>Tell us about your organization</h2>
      <p className="step-description">We'll use this to customize our intelligence gathering.</p>
      
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
            onChange={(e) => {
              setFormData({...formData, organization: {...formData.organization, domain: e.target.value}});
              if (e.target.value.includes('.')) {
                fetchOrganizationIntelligence(e.target.value);
              }
            }}
            placeholder="e.g., acme.com"
          />
          {isLoading && <span className="loading-indicator">🔍 Analyzing your digital presence...</span>}
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

      {organizationIntelligence && (
        <div className="intelligence-preview">
          <h3>🔍 Here's what we found about {formData.organization.name}:</h3>
          <div className="intelligence-content">
            <p><strong>Current Sentiment:</strong> {organizationIntelligence.currentSentiment}</p>
            <p><strong>Media Presence:</strong> {organizationIntelligence.mediaPresence}</p>
            <p><strong>Key Competitors:</strong> {organizationIntelligence.competitors?.join(', ')}</p>
            <div style={{marginTop: '15px'}}>
              <strong>Immediate Opportunities:</strong>
              <ul style={{marginTop: '8px', paddingLeft: '20px'}}>
                {organizationIntelligence.opportunities?.map((opp, idx) => (
                  <li key={idx} style={{color: '#10B981'}}>{opp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
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
      <h2>Who and what should we track?</h2>
      <p className="step-description">Tell us the specific groups and topics you care about.</p>
      
      <div className="form-group">
        <label>Key Stakeholder Groups</label>
        <textarea
          value={formData.intelligence.stakeholders}
          onChange={(e) => setFormData({
            ...formData,
            intelligence: { ...formData.intelligence, stakeholders: e.target.value }
          })}
          placeholder="e.g., Tech journalists, Industry analysts, VC community, Developer advocates, Enterprise customers"
          rows="3"
        />
        <small>Separate groups with commas. We'll track their interests, activities, and engagement opportunities.</small>
      </div>

      <div className="form-group">
        <label>Topics & Keywords</label>
        <textarea
          value={formData.intelligence.topics}
          onChange={(e) => setFormData({
            ...formData,
            intelligence: { ...formData.intelligence, topics: e.target.value }
          })}
          placeholder="e.g., Artificial intelligence, Cloud computing, Digital transformation, Cybersecurity, Remote work"
          rows="3"
        />
        <small>These topics will be monitored for opportunities, trends, and narratives.</small>
      </div>

      {formData.intelligence.competitors.length > 0 && (
        <div className="detected-items">
          <h3>Competitors We'll Track</h3>
          <div className="chip-container">
            {formData.intelligence.competitors.map((competitor, idx) => (
              <span key={idx} className="chip">{competitor}</span>
            ))}
          </div>
          <small>We automatically identified these based on your industry and domain.</small>
        </div>
      )}

      <div className="always-on-features">
        <h3>✨ Always-On Intelligence</h3>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">🌊</span>
            <div>
              <strong>Cascade Prediction</strong>
              <p>Predict 2nd and 3rd order effects of events before they happen</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <div>
              <strong>Opportunity Detection</strong>
              <p>Continuously discover PR and engagement opportunities</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📖</span>
            <div>
              <strong>Narrative Tracking</strong>
              <p>Monitor how stories and perceptions evolve in your ecosystem</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h2>Here's what SignalDesk will do for you</h2>
      <p className="step-description">Review your personalized intelligence plan before we begin.</p>
      
      {systemPlan && (
        <div className="system-plan">
          <div className="plan-section immediate">
            <h3>🚀 First 24 Hours</h3>
            <ul>
              {systemPlan.immediateActions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          </div>

          <div className="plan-section ongoing">
            <h3>🔄 Ongoing Intelligence</h3>
            <ul>
              {systemPlan.ongoingActivities.map((activity, idx) => (
                <li key={idx}>{activity}</li>
              ))}
            </ul>
          </div>

          <div className="plan-section deliverables">
            <h3>📊 What You'll Receive</h3>
            <ul>
              {systemPlan.deliverables.map((deliverable, idx) => (
                <li key={idx}>{deliverable}</li>
              ))}
            </ul>
          </div>

          <div className="plan-section timeline">
            <h3>⏱️ Timeline</h3>
            <div className="timeline-items">
              {Object.entries(systemPlan.timeline).map(([time, action]) => (
                <div key={time} className="timeline-item">
                  <span className="timeline-time">{time}</span>
                  <span className="timeline-action">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="final-message">
        <div className="message-box">
          <h3>🎯 Your Competitive Advantage</h3>
          <p>
            SignalDesk will continuously monitor your ecosystem, predict opportunities before they're obvious, 
            and help you stay ahead of narratives. We're not just tracking mentions - we're understanding 
            relationships, predicting cascades, and finding the perfect moments for your message.
          </p>
        </div>
      </div>
    </div>
  );

  const handleNext = () => {
    if (currentStep === 3 && !systemPlan) {
      generateSystemPlan();
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const deployConfiguration = async () => {
    setIsLoading(true);
    
    try {
      // Enhanced data structure for MCPs (hidden from user)
      const enhancedConfig = {
        ...formData,
        mcpConfiguration: {
          // All MCPs enabled by default, including scraper
          'signaldesk-scraper': { enabled: true, priority: 0.9 },
          'signaldesk-monitor': { enabled: true, priority: 0.9 },
          'signaldesk-intelligence': { enabled: true, priority: 0.9 },
          'signaldesk-orchestrator': { enabled: true, priority: 1.0 },
          'signaldesk-opportunities': { enabled: true, priority: 0.8 },
          'signaldesk-entities': { enabled: true, priority: 0.8 },
          'signaldesk-relationships': { enabled: true, priority: 0.7 },
          'signaldesk-media': { enabled: true, priority: 0.7 },
          'signaldesk-social': { enabled: true, priority: 0.8 },
          'signaldesk-narratives': { enabled: true, priority: 0.8 },
          'signaldesk-content': { enabled: true, priority: 0.5 },
          'signaldesk-analytics': { enabled: true, priority: 0.6 },
          'signaldesk-memory': { enabled: true, priority: 0.5 },
          // Conditionally enable based on goals
          'signaldesk-crisis': { 
            enabled: formData.goals.crisis_preparedness, 
            priority: formData.goals.crisis_preparedness ? 1.0 : 0 
          },
          'signaldesk-regulatory': { 
            enabled: formData.goals.regulatory_navigation, 
            priority: formData.goals.regulatory_navigation ? 0.9 : 0 
          },
          'signaldesk-campaigns': { enabled: true, priority: 0.6 },
          'signaldesk-stakeholder-groups': { enabled: true, priority: 0.7 }
        }
      };
      
      // Save to localStorage
      localStorage.setItem('signaldesk_onboarding', JSON.stringify(enhancedConfig));
      localStorage.setItem('signaldesk_organization', JSON.stringify(formData.organization));
      
      // Initialize MCPs in background (user doesn't see this)
      console.log('🚀 Initializing SignalDesk intelligence systems...');
      
      // Simulate MCP initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Error setting up SignalDesk. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="comprehensive-onboarding">
      <div className="onboarding-header">
        <h1>Welcome to SignalDesk</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
        </div>
        <div className="step-indicators">
          {['Organization', 'Goals', 'Tracking', 'Review'].map((label, idx) => (
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
          <button onClick={handleNext} className="btn-primary">
            Next
          </button>
        ) : (
          <button 
            onClick={deployConfiguration} 
            className="btn-primary deploy-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Setting up...' : '🚀 Start SignalDesk'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SimplifiedOnboarding;