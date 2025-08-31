import React, { useState } from 'react';
import { supabase } from '../../config/supabase';
import './ComprehensiveOnboarding.css';

const ComprehensiveOnboarding = ({ onComplete }) => {
  console.log('🚀 ComprehensiveOnboarding component is rendering! Step 5 should be Intelligence Hub Setup');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Strategic Profile
    organization: {
      name: '',
      industry: '',
      marketPosition: '',
      differentiators: '',
      competitors: ''
    },
    // Step 2: PR Objectives
    objectives: {
      primary: [],
      successMetrics: ''
    },
    // Step 3: Opportunity Configuration - Aligned with MCP opportunity types
    opportunities: {
      // Core opportunity types from MCP
      trending: { enabled: true, weight: 80 },           // trending topics & market trends
      news_hook: { enabled: true, weight: 90 },          // news cycle opportunities
      competitor_gap: { enabled: true, weight: 85 },     // competitor weaknesses
      journalist_interest: { enabled: true, weight: 75 }, // media relationship opportunities
      editorial_calendar: { enabled: false, weight: 60 }, // planned content opportunities
      award: { enabled: false, weight: 50 },             // industry awards & recognition
      speaking: { enabled: false, weight: 55 },          // speaking & panel opportunities
      
      // Cascade intelligence settings
      cascadeMonitoring: true,
      cascadeTypes: ['regulatory_change', 'competitor_crisis', 'technology_breakthrough'],
      
      // Response configuration
      responseTime: '< 4 hours',
      minimumScore: 70  // Minimum opportunity score threshold (0-100)
    },
    // Step 4: Campaign Orchestration
    orchestration: {
      autoGeneratePlans: true,
      contentAutoCreation: true,
      smartMediaMatching: false,
      autonomousExecution: false,
      cascadeFocus: 'balanced'
    },
    // Step 5: Intelligence Configuration
    intelligence: {
      stakeholders: '',
      topics: '',
      mediaOutlets: '',
      keywords: '',
      alertFrequency: 'realtime'
    }
  });

  const totalSteps = 5;

  const stepTitles = {
    1: "Configure Your PR Command Center",
    2: "Define Strategic Objectives",
    3: "Opportunity Discovery Engine",
    4: "Campaign Orchestration",
    5: "Intelligence Hub Setup"
  };

  const stepSubtitles = {
    1: "Let's set up your autonomous PR orchestration system",
    2: "What PR outcomes will drive your business forward?",
    3: "Configure how SignalDesk discovers PR opportunities",
    4: "Set your campaign automation preferences",
    5: "Tell us who and what to monitor for strategic intelligence"
  };

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Financial Services' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'energy', label: 'Energy & Utilities' },
    { value: 'nonprofit', label: 'Non-Profit' }
  ];

  const marketPositions = [
    { value: 'leader', label: 'Market Leader' },
    { value: 'challenger', label: 'Challenger Brand' },
    { value: 'disruptor', label: 'Industry Disruptor' },
    { value: 'emerging', label: 'Emerging Player' },
    { value: 'niche', label: 'Niche Specialist' }
  ];

  const prObjectives = [
    { id: 'thought-leadership', icon: '🎯', name: 'Thought Leadership', desc: 'Position executives as industry experts' },
    { id: 'product-launches', icon: '🚀', name: 'Product Launches', desc: 'Maximum impact for new offerings' },
    { id: 'funding', icon: '💰', name: 'Funding & Growth', desc: 'Investor relations & funding news' },
    { id: 'talent', icon: '👥', name: 'Talent Acquisition', desc: 'Employer brand & recruitment' },
    { id: 'crisis', icon: '🛡️', name: 'Crisis Preparedness', desc: 'Reputation protection & response' },
    { id: 'competitive', icon: '⚔️', name: 'Competitive Positioning', desc: 'Win market share & mindshare' }
  ];

  const alertFrequencies = [
    { value: 'realtime', label: 'Real-time (As it happens)' },
    { value: 'hourly', label: 'Hourly Digest' },
    { value: 'daily', label: 'Daily Summary' },
    { value: 'weekly', label: 'Weekly Report' }
  ];

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

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.organization.name,
            industry: formData.organization.industry,
            market_position: formData.organization.marketPosition,
            differentiators: formData.organization.differentiators.split(',').map(d => d.trim()).filter(d => d),
            competitors: formData.organization.competitors.split(',').map(c => c.trim()).filter(c => c),
            user_id: user.id
          })
          .select()
          .single();

        if (orgError) throw orgError;

        // Save PR objectives
        const { error: objError } = await supabase
          .from('pr_objectives')
          .insert({
            organization_id: orgData.id,
            primary_objectives: formData.objectives.primary,
            success_metrics: formData.objectives.successMetrics.split(',').map(m => m.trim()),
            active: true
          });

        if (objError) throw objError;

        // Save opportunity config with MCP-aligned types and weights
        const enabledOpportunities = {};
        const opportunityWeights = {};
        
        // Extract enabled opportunities and their weights
        ['trending', 'news_hook', 'competitor_gap', 'journalist_interest', 
         'editorial_calendar', 'award', 'speaking'].forEach(oppType => {
          if (formData.opportunities[oppType]) {
            if (formData.opportunities[oppType].enabled) {
              enabledOpportunities[oppType] = true;
              opportunityWeights[oppType] = formData.opportunities[oppType].weight || 50;
            }
          }
        });
        
        const { error: oppError } = await supabase
          .from('opportunity_config')
          .insert({
            organization_id: orgData.id,
            enabled_types: Object.keys(enabledOpportunities),
            opportunity_weights: opportunityWeights,
            cascade_monitoring: formData.opportunities.cascadeMonitoring,
            cascade_types: formData.opportunities.cascadeTypes,
            response_time: formData.opportunities.responseTime,
            minimum_score: formData.opportunities.minimumScore,
            auto_queue: true
          });

        if (oppError) throw oppError;

        // Save intelligence config
        const { error: intError } = await supabase
          .from('intelligence_config')
          .insert({
            organization_id: orgData.id,
            stakeholders: formData.intelligence.stakeholders.split(',').map(s => s.trim()).filter(s => s),
            topics: formData.intelligence.topics.split(',').map(t => t.trim()).filter(t => t),
            media_outlets: formData.intelligence.mediaOutlets.split(',').map(m => m.trim()).filter(m => m),
            keywords: formData.intelligence.keywords.split(',').map(k => k.trim()).filter(k => k),
            alert_frequency: formData.intelligence.alertFrequency
          });

        if (intError) throw intError;

        // NO localStorage - edge function is the SINGLE SOURCE OF TRUTH
        console.log('✅ Data saved to Supabase edge function:', orgData);

        // Call parent callback
        onComplete(orgData);
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Still complete with local data
      const localOrgData = {
        id: `local_${Date.now()}`,
        ...formData.organization
      };
      // NO localStorage - fallback to edge function sync later
      console.log('⚠️ Using local fallback data:', localOrgData);
      onComplete(localOrgData);
    } finally {
      setLoading(false);
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

  const toggleObjective = (objId) => {
    const current = formData.objectives.primary;
    if (current.includes(objId)) {
      updateField('objectives', 'primary', current.filter(id => id !== objId));
    } else if (current.length < 3) {
      updateField('objectives', 'primary', [...current, objId]);
    }
  };


  const renderStep1 = () => (
    <div className="step-content">
      <div className="form-group">
        <label>Organization Name</label>
        <input
          type="text"
          placeholder="Enter your company name"
          value={formData.organization.name}
          onChange={(e) => updateField('organization', 'name', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Industry & Position</label>
        <select
          value={formData.organization.industry}
          onChange={(e) => updateField('organization', 'industry', e.target.value)}
        >
          <option value="">Select your primary industry</option>
          {industries.map(ind => (
            <option key={ind.value} value={ind.value}>{ind.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Market Position</label>
        <select
          value={formData.organization.marketPosition}
          onChange={(e) => updateField('organization', 'marketPosition', e.target.value)}
        >
          <option value="">How are you positioned?</option>
          {marketPositions.map(pos => (
            <option key={pos.value} value={pos.value}>{pos.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Key Differentiators (What makes you unique?)</label>
        <textarea
          placeholder="e.g., First AI-powered solution, 10x faster than competitors, patented technology..."
          value={formData.organization.differentiators}
          onChange={(e) => updateField('organization', 'differentiators', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Main Competitors (comma-separated)</label>
        <input
          type="text"
          placeholder="e.g., Competitor A, Competitor B, Competitor C"
          value={formData.organization.competitors}
          onChange={(e) => updateField('organization', 'competitors', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <p className="step-intro">Select your primary PR objectives (choose up to 3 priorities):</p>
      
      <div className="objective-grid">
        {prObjectives.map(obj => (
          <div
            key={obj.id}
            className={`objective-card ${formData.objectives.primary.includes(obj.id) ? 'selected' : ''}`}
            onClick={() => toggleObjective(obj.id)}
          >
            <div className="objective-icon">{obj.icon}</div>
            <div className="objective-name">{obj.name}</div>
            <div className="objective-desc">{obj.desc}</div>
          </div>
        ))}
      </div>

      <div className="form-group">
        <label>Success Metrics (How will you measure PR success?)</label>
        <textarea
          placeholder="e.g., Tier 1 media coverage monthly, 20% share of voice, 3 speaking opportunities per quarter..."
          value={formData.objectives.successMetrics}
          onChange={(e) => updateField('objectives', 'successMetrics', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep3 = () => {
    // MCP-aligned opportunity types with descriptions
    const opportunityTypes = [
      { 
        id: 'trending', 
        name: 'Trending Topics & Market Trends', 
        desc: 'Identify and capitalize on trending discussions in your industry',
        icon: '📈'
      },
      { 
        id: 'news_hook', 
        name: 'News Cycle Opportunities', 
        desc: 'Find breaking news where you can provide expert commentary',
        icon: '📰'
      },
      { 
        id: 'competitor_gap', 
        name: 'Competitor Weakness Detection', 
        desc: 'Identify when competitors stumble or leave market gaps',
        icon: '🎯'
      },
      { 
        id: 'journalist_interest', 
        name: 'Media Relationship Opportunities', 
        desc: 'Match journalist interests with your expertise',
        icon: '📝'
      },
      { 
        id: 'editorial_calendar', 
        name: 'Editorial Calendar Alignment', 
        desc: 'Align with publication calendars and themed content',
        icon: '📅'
      },
      { 
        id: 'award', 
        name: 'Awards & Recognition', 
        desc: 'Track industry awards and recognition opportunities',
        icon: '🏆'
      },
      { 
        id: 'speaking', 
        name: 'Speaking & Panel Opportunities', 
        desc: 'Identify conferences, panels, and speaking engagements',
        icon: '🎤'
      }
    ];

    const updateOpportunityConfig = (oppId, field, value) => {
      setFormData(prev => ({
        ...prev,
        opportunities: {
          ...prev.opportunities,
          [oppId]: {
            ...prev.opportunities[oppId],
            [field]: value
          }
        }
      }));
    };

    return (
      <div className="step-content">
        <p className="step-intro">Configure opportunity types and their importance (0-100 scoring):</p>

        <div className="opportunity-config-grid">
          {opportunityTypes.map(opp => (
            <div key={opp.id} className="opportunity-config-card">
              <div className="opp-header">
                <span className="opp-icon">{opp.icon}</span>
                <div className="opp-toggle">
                  <input
                    type="checkbox"
                    id={`opp-${opp.id}`}
                    checked={formData.opportunities[opp.id]?.enabled || false}
                    onChange={(e) => updateOpportunityConfig(opp.id, 'enabled', e.target.checked)}
                  />
                  <label htmlFor={`opp-${opp.id}`}>
                    <span className="toggle-switch"></span>
                  </label>
                </div>
              </div>
              <div className="opp-details">
                <div className="opp-title">{opp.name}</div>
                <div className="opp-desc">{opp.desc}</div>
                {formData.opportunities[opp.id]?.enabled && (
                  <div className="opp-weight">
                    <label>Importance Score:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.opportunities[opp.id]?.weight || 50}
                      onChange={(e) => updateOpportunityConfig(opp.id, 'weight', parseInt(e.target.value))}
                    />
                    <span className="weight-value">{formData.opportunities[opp.id]?.weight || 50}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cascade Intelligence Configuration */}
        <div className="cascade-config" style={{ marginTop: '30px' }}>
          <h4 style={{ color: '#E2E8F0', marginBottom: '15px' }}>🌊 Cascade Intelligence</h4>
          <p style={{ color: '#9CA3AF', marginBottom: '15px', fontSize: '14px' }}>
            Predict 2nd and 3rd order effects of industry events
          </p>
          <div className="cascade-options">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={formData.opportunities.cascadeMonitoring}
                onChange={(e) => updateField('opportunities', 'cascadeMonitoring', e.target.checked)}
              />
              <span style={{ color: '#E2E8F0' }}>Enable Cascade Effect Monitoring</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Opportunity Response Time</label>
          <select
            value={formData.opportunities.responseTime}
            onChange={(e) => updateField('opportunities', 'responseTime', e.target.value)}
          >
            <option value="< 1 hour">Immediate (&lt; 1 hour)</option>
            <option value="< 4 hours">Rapid (&lt; 4 hours)</option>
            <option value="Same Day">Same Day</option>
            <option value="Next Day">Next Day</option>
          </select>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="step-content">
      <p className="step-intro">Set your campaign orchestration preferences:</p>

      <div className="automation-settings">
        <div className="automation-slider">
          <div className="slider-info">
            <div className="slider-title">Auto-Generate Campaign Plans</div>
            <div className="slider-desc">Niv creates full campaign strategies from opportunities</div>
          </div>
          <div 
            className={`slider ${formData.orchestration.autoGeneratePlans ? 'active' : ''}`}
            onClick={() => updateField('orchestration', 'autoGeneratePlans', !formData.orchestration.autoGeneratePlans)}
          >
            <div className="slider-dot"></div>
          </div>
        </div>

        <div className="automation-slider">
          <div className="slider-info">
            <div className="slider-title">Content Auto-Creation</div>
            <div className="slider-desc">Generate press releases, pitches, and social content automatically</div>
          </div>
          <div 
            className={`slider ${formData.orchestration.contentAutoCreation ? 'active' : ''}`}
            onClick={() => updateField('orchestration', 'contentAutoCreation', !formData.orchestration.contentAutoCreation)}
          >
            <div className="slider-dot"></div>
          </div>
        </div>

        <div className="automation-slider">
          <div className="slider-info">
            <div className="slider-title">Smart Media Matching</div>
            <div className="slider-desc">AI matches opportunities to the right journalists</div>
          </div>
          <div 
            className={`slider ${formData.orchestration.smartMediaMatching ? 'active' : ''}`}
            onClick={() => updateField('orchestration', 'smartMediaMatching', !formData.orchestration.smartMediaMatching)}
          >
            <div className="slider-dot"></div>
          </div>
        </div>

        <div className="automation-slider">
          <div className="slider-info">
            <div className="slider-title">Autonomous Execution</div>
            <div className="slider-desc">Execute approved campaigns without manual intervention</div>
          </div>
          <div 
            className={`slider ${formData.orchestration.autonomousExecution ? 'active' : ''}`}
            onClick={() => updateField('orchestration', 'autonomousExecution', !formData.orchestration.autonomousExecution)}
          >
            <div className="slider-dot"></div>
          </div>
        </div>
      </div>

      <div className="cascade-focus">
        <label>Cascade Intelligence Focus</label>
        <div className="cascade-options">
          <div className="cascade-option">
            <input
              type="radio"
              name="cascade"
              value="aggressive"
              checked={formData.orchestration.cascadeFocus === 'aggressive'}
              onChange={(e) => updateField('orchestration', 'cascadeFocus', e.target.value)}
            />
            <div className="cascade-details">
              <div className="cascade-title">Aggressive Opportunist</div>
              <div className="cascade-desc">Actively exploit competitor weaknesses and market disruptions</div>
            </div>
          </div>

          <div className="cascade-option">
            <input
              type="radio"
              name="cascade"
              value="balanced"
              checked={formData.orchestration.cascadeFocus === 'balanced'}
              onChange={(e) => updateField('orchestration', 'cascadeFocus', e.target.value)}
            />
            <div className="cascade-details">
              <div className="cascade-title">Balanced Strategic</div>
              <div className="cascade-desc">Mix of proactive campaigns and reactive opportunities</div>
            </div>
          </div>

          <div className="cascade-option">
            <input
              type="radio"
              name="cascade"
              value="defensive"
              checked={formData.orchestration.cascadeFocus === 'defensive'}
              onChange={(e) => updateField('orchestration', 'cascadeFocus', e.target.value)}
            />
            <div className="cascade-details">
              <div className="cascade-title">Defensive Positioning</div>
              <div className="cascade-desc">Focus on protecting reputation and managing risks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => {
    console.log('📍 RENDERING STEP 5: Intelligence Hub Setup (NOT MCP Systems!)');
    return (
    <div className="step-content" data-step5-version="stakeholders-v2">
      <p className="step-intro">Configure what the Intelligence Hub will monitor for you:</p>

      <div className="form-group">
        <label>Key Stakeholders to Track</label>
        <textarea
          placeholder="e.g., Industry analysts (Gartner, Forrester), Key investors, Board members, Partner executives, Regulatory bodies..."
          value={formData.intelligence.stakeholders}
          onChange={(e) => updateField('intelligence', 'stakeholders', e.target.value)}
          rows="3"
        />
        <small style={{ color: '#9CA3AF', fontSize: '12px' }}>
          We'll monitor their activities, statements, and movements
        </small>
      </div>

      <div className="form-group">
        <label>Strategic Topics & Trends</label>
        <textarea
          placeholder="e.g., AI regulation, Sustainability initiatives, Digital transformation, Remote work trends, Industry consolidation..."
          value={formData.intelligence.topics}
          onChange={(e) => updateField('intelligence', 'topics', e.target.value)}
          rows="3"
        />
        <small style={{ color: '#9CA3AF', fontSize: '12px' }}>
          We'll track developments and identify PR opportunities
        </small>
      </div>

      <div className="form-group">
        <label>Priority Media Outlets</label>
        <input
          type="text"
          placeholder="e.g., TechCrunch, Wall Street Journal, Forbes, Industry Week, VentureBeat..."
          value={formData.intelligence.mediaOutlets}
          onChange={(e) => updateField('intelligence', 'mediaOutlets', e.target.value)}
        />
        <small style={{ color: '#9CA3AF', fontSize: '12px' }}>
          We'll monitor coverage and identify journalist interests
        </small>
      </div>

      <div className="form-group">
        <label>Critical Keywords & Phrases</label>
        <input
          type="text"
          placeholder="e.g., Your brand name, Product names, Executive names, Technology terms..."
          value={formData.intelligence.keywords}
          onChange={(e) => updateField('intelligence', 'keywords', e.target.value)}
        />
        <small style={{ color: '#9CA3AF', fontSize: '12px' }}>
          We'll alert you when these appear in relevant contexts
        </small>
      </div>

      <div className="form-group">
        <label>Alert Frequency</label>
        <select
          value={formData.intelligence.alertFrequency}
          onChange={(e) => updateField('intelligence', 'alertFrequency', e.target.value)}
        >
          {alertFrequencies.map(freq => (
            <option key={freq.value} value={freq.value}>{freq.label}</option>
          ))}
        </select>
        <small style={{ color: '#9CA3AF', fontSize: '12px' }}>
          How often should we notify you of important intelligence?
        </small>
      </div>

      <div className="intelligence-note" style={{
        background: '#374151',
        padding: '20px',
        borderRadius: '12px',
        marginTop: '30px',
        display: 'flex',
        gap: '15px',
        alignItems: 'flex-start'
      }}>
        <div style={{ fontSize: '24px' }}>🔍</div>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#E2E8F0' }}>
            Continuous Intelligence Gathering
          </div>
          <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
            Our Intelligence Hub will continuously monitor these stakeholders, topics, and sources to identify 
            PR opportunities, competitive movements, and narrative vacuums you can exploit.
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderCompletion = () => (
    <div className="completion-screen">
      <div className="checkmark">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <h1>PR Command Center Activated!</h1>
      <p className="completion-subtitle">
        Niv is ready to orchestrate your strategic PR campaigns
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">12</div>
          <div className="stat-label">Campaign Templates Ready</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">85%</div>
          <div className="stat-label">PR Readiness Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Real-time</div>
          <div className="stat-label">Opportunity Detection</div>
        </div>
      </div>

      <button 
        className="btn btn-primary launch-btn" 
        onClick={() => onComplete(formData.organization)}
        disabled={loading}
      >
        {loading ? 'Setting up...' : 'Launch PR Command Center →'}
      </button>
    </div>
  );

  if (currentStep > totalSteps) {
    return renderCompletion();
  }

  return (
    <div className="comprehensive-onboarding" data-component="comprehensive-onboarding-v2">
      <div className="onboarding-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="onboarding-header">
          <div className="step-indicator">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i + 1}
                className={`step-dot ${
                  currentStep > i + 1 ? 'completed' : 
                  currentStep === i + 1 ? 'active' : ''
                }`}
              />
            ))}
          </div>
          <h1>{stepTitles[currentStep]}</h1>
          <p className="subtitle">{stepSubtitles[currentStep]}</p>
        </div>

        <div className="onboarding-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        <div className="button-group" style={{ justifyContent: currentStep === 1 ? 'flex-end' : 'space-between' }}>
          {currentStep > 1 && (
            <button 
              className="btn btn-secondary" 
              onClick={handlePrevious}
            >
              ← Previous
            </button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleNext}
          >
            {currentStep === totalSteps ? 'Activate Systems →' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveOnboarding;