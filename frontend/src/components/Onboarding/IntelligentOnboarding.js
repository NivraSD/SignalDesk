import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import './IntelligentOnboarding.css';

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const IntelligentOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [organizationIntelligence, setOrganizationIntelligence] = useState(null);
  const [deploymentPlan, setDeploymentPlan] = useState(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Organization Basics
    organization: {
      name: '',
      domain: '', // Website domain for entity recognition
      industry: '',
      subIndustry: '',
      size: 'medium', // small, medium, large, enterprise
      marketPosition: 'challenger', // leader, challenger, follower, niche
      publicPrivate: 'private',
      headquarters: '',
      operatingRegions: []
    },
    
    // Step 2: Strategic Objectives
    objectives: {
      primaryGoal: '', // e.g., "Increase brand awareness", "Crisis management", "IPO preparation"
      kpis: {
        mediaValue: { enabled: true, target: 1000000, timeframe: 'quarterly' },
        sentimentScore: { enabled: true, target: 80, threshold: 60 },
        shareOfVoice: { enabled: true, target: 25 },
        journalistEngagement: { enabled: true, target: 50 },
        crisisResponseTime: { enabled: true, target: 15 }, // minutes
      },
      criticalStakeholders: [], // Will be populated by entity MCP
      competitiveSet: [], // Will be populated by intelligence MCP
      narrativeGoals: []
    },
    
    // Step 3: Intelligence Configuration
    intelligence: {
      monitoringScope: {
        competitors: true,
        regulators: true,
        journalists: true,
        analysts: true,
        activists: false,
        investors: false,
        customers: true,
        employees: false
      },
      alertThresholds: {
        crisis: 90, // 0-100 severity score
        opportunity: 70,
        competitorAction: 60,
        regulatoryChange: 80,
        sentimentShift: 15 // percentage change
      },
      cascadePrediction: {
        enabled: true,
        horizons: ['1hour', '4hours', '24hours', '7days'],
        minimumConfidence: 70
      }
    },
    
    // Step 4: MCP Activation Strategy
    mcpStrategy: {
      priority: 'balanced', // aggressive, balanced, conservative
      activeMCPs: {
        // Critical MCPs (always on)
        'signaldesk-monitor': { enabled: true, priority: 0.9 },
        'signaldesk-intelligence': { enabled: true, priority: 0.9 },
        'signaldesk-orchestrator': { enabled: true, priority: 1.0 },
        
        // High Priority MCPs
        'signaldesk-opportunities': { enabled: true, priority: 0.8 },
        'signaldesk-entities': { enabled: true, priority: 0.8 },
        'signaldesk-crisis': { enabled: true, priority: 1.0 },
        'signaldesk-regulatory': { enabled: true, priority: 0.9 },
        
        // Medium Priority MCPs
        'signaldesk-relationships': { enabled: true, priority: 0.7 },
        'signaldesk-media': { enabled: true, priority: 0.7 },
        'signaldesk-social': { enabled: true, priority: 0.8 },
        'signaldesk-narratives': { enabled: true, priority: 0.8 },
        'signaldesk-stakeholder-groups': { enabled: true, priority: 0.7 },
        
        // Support MCPs
        'signaldesk-content': { enabled: true, priority: 0.5 },
        'signaldesk-campaigns': { enabled: true, priority: 0.6 },
        'signaldesk-analytics': { enabled: true, priority: 0.6 },
        'signaldesk-memory': { enabled: true, priority: 0.5 },
        'signaldesk-scraper': { enabled: false, priority: 0.4 }
      },
      resourceAllocation: {
        maxConcurrentMCPs: 8,
        cpuThreshold: 80,
        memoryThreshold: 75,
        apiRateLimit: 1000 // requests per hour
      }
    },
    
    // Step 5: System Settings
    settings: {
      automation: {
        autoResponse: false,
        requireApproval: true,
        draftGeneration: true,
        scheduledReports: 'daily'
      },
      integrations: {
        slack: { enabled: false, webhook: '' },
        email: { enabled: true, addresses: [] },
        teams: { enabled: false, webhook: '' }
      },
      dataRetention: {
        intelligenceHistory: 90, // days
        analyticsData: 365,
        memoryVault: 'unlimited'
      }
    }
  });

  // Fetch organization intelligence when domain is entered
  const fetchOrganizationIntelligence = async (domain) => {
    if (!domain) return;
    
    setIsLoading(true);
    try {
      // Call entity MCP to gather intelligence about the organization
      const { data } = await supabase.functions.invoke('mcp-bridge', {
        body: {
          server: 'entities',
          method: 'enrich_entity_profile',
          params: { domain, type: 'organization' },
          organizationId: 'onboarding-temp'
        }
      });

      if (data && data.result) {
        setOrganizationIntelligence(data.result);
        
        // Auto-populate discovered information
        setFormData(prev => ({
          ...prev,
          objectives: {
            ...prev.objectives,
            criticalStakeholders: data.result.stakeholders || [],
            competitiveSet: data.result.competitors || []
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching organization intelligence:', error);
    }
    setIsLoading(false);
  };

  // Generate deployment plan based on configuration
  const generateDeploymentPlan = () => {
    const plan = {
      phases: [],
      estimatedTime: 0,
      mcpSequence: [],
      immediateActions: [],
      monitoringTargets: [],
      expectedOutcomes: []
    };

    // Phase 1: Core Infrastructure (Immediate)
    plan.phases.push({
      name: 'Core Infrastructure Setup',
      duration: '< 1 minute',
      mcps: ['signaldesk-orchestrator', 'signaldesk-memory', 'signaldesk-monitor'],
      actions: [
        'Initialize orchestrator for MCP coordination',
        'Set up memory vault for context storage',
        'Activate real-time monitoring system'
      ]
    });

    // Phase 2: Intelligence Gathering (First 5 minutes)
    plan.phases.push({
      name: 'Intelligence Gathering',
      duration: '5 minutes',
      mcps: ['signaldesk-intelligence', 'signaldesk-entities', 'signaldesk-relationships'],
      actions: [
        `Scan ${formData.organization.industry} landscape`,
        `Profile ${formData.objectives.competitiveSet.length} competitors`,
        `Map journalist relationships in ${formData.organization.operatingRegions.join(', ')}`,
        'Identify current narratives and trends'
      ]
    });

    // Phase 3: Opportunity Discovery (First hour)
    plan.phases.push({
      name: 'Opportunity Discovery',
      duration: '1 hour',
      mcps: ['signaldesk-opportunities', 'signaldesk-media', 'signaldesk-social'],
      actions: [
        'Discover immediate PR opportunities',
        'Analyze editorial calendars',
        'Track trending topics relevant to your industry',
        'Identify journalist interests and gaps'
      ]
    });

    // Phase 4: Protective Monitoring (Continuous)
    if (formData.mcpStrategy.activeMCPs['signaldesk-crisis'].enabled) {
      plan.phases.push({
        name: 'Protective Monitoring',
        duration: 'Continuous',
        mcps: ['signaldesk-crisis', 'signaldesk-regulatory', 'signaldesk-narratives'],
        actions: [
          'Monitor for crisis signals',
          'Track regulatory changes',
          'Detect narrative shifts',
          'Set up cascade prediction models'
        ]
      });
    }

    // Calculate MCP activation sequence based on priority
    const activeMCPs = Object.entries(formData.mcpStrategy.activeMCPs)
      .filter(([_, config]) => config.enabled)
      .sort((a, b) => b[1].priority - a[1].priority)
      .map(([name, config]) => ({ name, priority: config.priority }));
    
    plan.mcpSequence = activeMCPs;
    plan.estimatedTime = '5-10 minutes for initial setup, then continuous monitoring';
    
    // Expected outcomes
    plan.expectedOutcomes = [
      `${activeMCPs.length} MCPs actively monitoring your ecosystem`,
      'Real-time alerts for opportunities and threats',
      'Automated intelligence reports every 24 hours',
      'Predictive cascade analysis for major events',
      `Average response time: ${formData.objectives.kpis.crisisResponseTime.target} minutes for critical issues`
    ];

    setDeploymentPlan(plan);
  };

  // Step renderers
  const renderStep1 = () => (
    <div className="step-content">
      <h2>Organization Profile</h2>
      <p className="step-description">Tell us about your organization so we can customize our intelligence gathering.</p>
      
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
          {isLoading && <span className="loading-indicator">🔍 Gathering intelligence...</span>}
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
          <label>Market Position</label>
          <select
            value={formData.organization.marketPosition}
            onChange={(e) => setFormData({...formData, organization: {...formData.organization, marketPosition: e.target.value}})}
          >
            <option value="leader">Market Leader</option>
            <option value="challenger">Challenger</option>
            <option value="follower">Follower</option>
            <option value="niche">Niche Player</option>
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

        <div className="form-group">
          <label>Headquarters</label>
          <input
            type="text"
            value={formData.organization.headquarters}
            onChange={(e) => setFormData({...formData, organization: {...formData.organization, headquarters: e.target.value}})}
            placeholder="e.g., San Francisco, CA"
          />
        </div>
      </div>

      {organizationIntelligence && (
        <div className="intelligence-preview">
          <h3>🔍 What we discovered about {formData.organization.name}:</h3>
          <div className="intelligence-content">
            <p><strong>Industry Position:</strong> {organizationIntelligence.position}</p>
            <p><strong>Key Competitors:</strong> {organizationIntelligence.competitors?.join(', ')}</p>
            <p><strong>Recent News:</strong> {organizationIntelligence.recentNews}</p>
            <p><strong>Sentiment:</strong> {organizationIntelligence.sentiment}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>Strategic Objectives</h2>
      <p className="step-description">Define your PR and communication goals.</p>
      
      <div className="form-group">
        <label>Primary Goal</label>
        <select
          value={formData.objectives.primaryGoal}
          onChange={(e) => setFormData({...formData, objectives: {...formData.objectives, primaryGoal: e.target.value}})}
        >
          <option value="">Select Primary Goal</option>
          <option value="brand_awareness">Increase Brand Awareness</option>
          <option value="thought_leadership">Establish Thought Leadership</option>
          <option value="crisis_preparedness">Crisis Preparedness</option>
          <option value="ipo_preparation">IPO/M&A Preparation</option>
          <option value="reputation_repair">Reputation Repair</option>
          <option value="product_launch">Product Launch Support</option>
          <option value="regulatory_navigation">Regulatory Navigation</option>
          <option value="competitive_positioning">Competitive Positioning</option>
        </select>
      </div>

      <div className="kpi-grid">
        <h3>Key Performance Indicators</h3>
        {Object.entries(formData.objectives.kpis).map(([key, kpi]) => (
          <div key={key} className="kpi-item">
            <label>
              <input
                type="checkbox"
                checked={kpi.enabled}
                onChange={(e) => setFormData({
                  ...formData,
                  objectives: {
                    ...formData.objectives,
                    kpis: {
                      ...formData.objectives.kpis,
                      [key]: { ...kpi, enabled: e.target.checked }
                    }
                  }
                })}
              />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            {kpi.enabled && (
              <input
                type="number"
                value={kpi.target}
                onChange={(e) => setFormData({
                  ...formData,
                  objectives: {
                    ...formData.objectives,
                    kpis: {
                      ...formData.objectives.kpis,
                      [key]: { ...kpi, target: parseInt(e.target.value) }
                    }
                  }
                })}
                placeholder="Target"
              />
            )}
          </div>
        ))}
      </div>

      {formData.objectives.competitiveSet.length > 0 && (
        <div className="detected-items">
          <h3>Detected Competitors</h3>
          <div className="chip-container">
            {formData.objectives.competitiveSet.map((competitor, idx) => (
              <span key={idx} className="chip">{competitor}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Intelligence Configuration</h2>
      <p className="step-description">Configure what and how we monitor.</p>
      
      <div className="monitoring-grid">
        <h3>Monitoring Scope</h3>
        {Object.entries(formData.intelligence.monitoringScope).map(([key, enabled]) => (
          <label key={key} className="monitoring-item">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setFormData({
                ...formData,
                intelligence: {
                  ...formData.intelligence,
                  monitoringScope: {
                    ...formData.intelligence.monitoringScope,
                    [key]: e.target.checked
                  }
                }
              })}
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

      <div className="threshold-grid">
        <h3>Alert Thresholds (0-100)</h3>
        {Object.entries(formData.intelligence.alertThresholds).map(([key, value]) => (
          <div key={key} className="threshold-item">
            <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) => setFormData({
                ...formData,
                intelligence: {
                  ...formData.intelligence,
                  alertThresholds: {
                    ...formData.intelligence.alertThresholds,
                    [key]: parseInt(e.target.value)
                  }
                }
              })}
            />
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div className="cascade-config">
        <h3>Cascade Prediction</h3>
        <label>
          <input
            type="checkbox"
            checked={formData.intelligence.cascadePrediction.enabled}
            onChange={(e) => setFormData({
              ...formData,
              intelligence: {
                ...formData.intelligence,
                cascadePrediction: {
                  ...formData.intelligence.cascadePrediction,
                  enabled: e.target.checked
                }
              }
            })}
          />
          Enable cascade prediction (predict 2nd and 3rd order effects)
        </label>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h2>MCP Activation Strategy</h2>
      <p className="step-description">Choose which intelligence modules to activate.</p>
      
      <div className="mcp-grid">
        {Object.entries(formData.mcpStrategy.activeMCPs).map(([mcp, config]) => (
          <div key={mcp} className={`mcp-card ${config.priority >= 0.9 ? 'critical' : config.priority >= 0.7 ? 'high' : 'medium'}`}>
            <div className="mcp-header">
              <label>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    mcpStrategy: {
                      ...formData.mcpStrategy,
                      activeMCPs: {
                        ...formData.mcpStrategy.activeMCPs,
                        [mcp]: { ...config, enabled: e.target.checked }
                      }
                    }
                  })}
                />
                {mcp.replace('signaldesk-', '').toUpperCase()}
              </label>
              <span className="priority-badge">Priority: {config.priority}</span>
            </div>
            <p className="mcp-description">{getMCPDescription(mcp)}</p>
          </div>
        ))}
      </div>

      <button 
        className="generate-plan-btn"
        onClick={generateDeploymentPlan}
      >
        Preview Deployment Plan
      </button>
    </div>
  );

  const renderStep5 = () => (
    <div className="step-content">
      <h2>Review & Deploy</h2>
      <p className="step-description">Review your configuration and deployment plan.</p>
      
      {deploymentPlan && (
        <div className="deployment-plan">
          <h3>📋 Deployment Plan</h3>
          
          <div className="plan-phases">
            {deploymentPlan.phases.map((phase, idx) => (
              <div key={idx} className="phase-card">
                <h4>{phase.name}</h4>
                <p className="phase-duration">⏱ {phase.duration}</p>
                <div className="phase-mcps">
                  {phase.mcps.map(mcp => (
                    <span key={mcp} className="mcp-chip">{mcp.replace('signaldesk-', '')}</span>
                  ))}
                </div>
                <ul className="phase-actions">
                  {phase.actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="expected-outcomes">
            <h4>Expected Outcomes</h4>
            <ul>
              {deploymentPlan.expectedOutcomes.map((outcome, idx) => (
                <li key={idx}>{outcome}</li>
              ))}
            </ul>
          </div>

          <div className="activation-sequence">
            <h4>MCP Activation Sequence</h4>
            <div className="sequence-timeline">
              {deploymentPlan.mcpSequence.map((mcp, idx) => (
                <div key={idx} className="sequence-item">
                  <span className="sequence-number">{idx + 1}</span>
                  <span className="sequence-name">{mcp.name.replace('signaldesk-', '')}</span>
                  <span className="sequence-priority">{mcp.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="final-actions">
        <button 
          className="edit-config-btn"
          onClick={() => setCurrentStep(1)}
        >
          ← Edit Configuration
        </button>
        
        <button 
          className="deploy-btn"
          onClick={deployConfiguration}
          disabled={isLoading}
        >
          {isLoading ? 'Deploying...' : '🚀 Deploy SignalDesk'}
        </button>
      </div>
    </div>
  );

  const getMCPDescription = (mcp) => {
    const descriptions = {
      'signaldesk-monitor': 'Real-time stakeholder monitoring and alert generation',
      'signaldesk-intelligence': 'Market intelligence and competitor analysis',
      'signaldesk-orchestrator': 'Cross-MCP coordination and intelligence sharing',
      'signaldesk-opportunities': 'PR opportunity discovery and analysis',
      'signaldesk-entities': 'Entity recognition and profile enrichment',
      'signaldesk-crisis': 'Crisis detection and response coordination',
      'signaldesk-regulatory': 'Regulatory monitoring and compliance tracking',
      'signaldesk-relationships': 'Journalist and influencer relationship management',
      'signaldesk-media': 'Media outreach and pitch generation',
      'signaldesk-social': 'Social media monitoring and engagement',
      'signaldesk-narratives': 'Narrative tracking and control',
      'signaldesk-stakeholder-groups': 'Coalition and group dynamics analysis',
      'signaldesk-content': 'Content generation and localization',
      'signaldesk-campaigns': 'Campaign planning and orchestration',
      'signaldesk-analytics': 'Performance analytics and ROI measurement',
      'signaldesk-memory': 'Knowledge management and context storage',
      'signaldesk-scraper': 'Web scraping and data extraction'
    };
    return descriptions[mcp] || 'Intelligence gathering and analysis';
  };

  const deployConfiguration = async () => {
    setIsLoading(true);
    
    try {
      // Save configuration to localStorage
      localStorage.setItem('signaldesk_onboarding', JSON.stringify(formData));
      
      // Initialize MCPs via orchestrator
      const { data } = await supabase.functions.invoke('mcp-bridge', {
        body: {
          server: 'orchestrator',
          method: 'initialize_organization',
          params: {
            organization: formData.organization,
            objectives: formData.objectives,
            intelligence: formData.intelligence,
            mcpStrategy: formData.mcpStrategy,
            settings: formData.settings
          },
          organizationId: `org-${Date.now()}`
        }
      });

      if (error) throw error;

      // Start critical MCPs immediately
      const criticalMCPs = Object.entries(formData.mcpStrategy.activeMCPs)
        .filter(([_, config]) => config.enabled && config.priority >= 0.9)
        .map(([name]) => name);

      for (const mcp of criticalMCPs) {
        await supabase.functions.invoke('mcp-bridge', {
          body: {
            server: mcp.replace('signaldesk-', ''),
            method: 'start_monitoring',
            params: formData,
            organizationId: formData.organization.name
          }
        });
      }

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Error deploying configuration. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleNext = () => {
    if (currentStep === 4 && !deploymentPlan) {
      generateDeploymentPlan();
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="comprehensive-onboarding">
      <div className="onboarding-header">
        <h1>SignalDesk Intelligence Setup</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / 5) * 100}%` }} />
        </div>
        <div className="step-indicators">
          {['Organization', 'Objectives', 'Intelligence', 'MCPs', 'Deploy'].map((label, idx) => (
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
        {currentStep === 5 && renderStep5()}
      </div>

      <div className="onboarding-footer">
        {currentStep > 1 && (
          <button onClick={handlePrevious} className="btn-secondary">
            Previous
          </button>
        )}
        {currentStep < 5 && (
          <button onClick={handleNext} className="btn-primary">
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default IntelligentOnboarding;