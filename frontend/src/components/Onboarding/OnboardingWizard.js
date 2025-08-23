import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Building2, Target, Radar, Database, Zap, Check } from 'lucide-react';
import './OnboardingWizard.css';

const OnboardingWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Organization Profile
    organization: {
      name: '',
      industry: '',
      position: '',
      differentiators: [],
      competitors: []
    },
    // Step 2: PR Objectives
    objectives: {
      primary: [],
      metrics: []
    },
    // Step 3: Opportunity Configuration
    opportunities: {
      types: {
        competitor_weakness: true,
        narrative_vacuum: true,
        cascade_events: true,
        trending_topics: false,
        awards_speaking: false
      },
      response_time: '< 4 hours',
      risk_tolerance: 'balanced'
    },
    // Step 4: Intelligence Sources
    intelligence: {
      competitors_to_track: [],
      topics_to_monitor: [],
      keywords: [],
      journalists: []
    },
    // Step 5: MCP Activation
    mcps: {
      intelligence: true,
      monitor: true,
      opportunities: true,
      crisis: false,
      social: false,
      narratives: false,
      regulatory: false,
      entities: false,
      relationships: false
    }
  });

  const steps = [
    { id: 1, name: 'Organization', icon: Building2 },
    { id: 2, name: 'Objectives', icon: Target },
    { id: 3, name: 'Opportunities', icon: Radar },
    { id: 4, name: 'Intelligence', icon: Database },
    { id: 5, name: 'Systems', icon: Zap }
  ];

  const updateFormData = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Header with Progress */}
        <div className="onboarding-header">
          <h2 className="onboarding-title">SignalDesk Setup</h2>
          <p className="onboarding-subtitle">Step {currentStep} of {steps.length} - {steps[currentStep - 1].name}</p>
          <div className="progress-bar">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`progress-step ${
                  currentStep > step.id ? 'completed' : 
                  currentStep === step.id ? 'active' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="onboarding-body">
          <div className="step-content">
            {currentStep === 1 && <OrganizationStep data={formData.organization} updateData={updateFormData} />}
            {currentStep === 2 && <ObjectivesStep data={formData.objectives} updateData={updateFormData} />}
            {currentStep === 3 && <OpportunitiesStep data={formData.opportunities} updateData={updateFormData} />}
            {currentStep === 4 && <IntelligenceStep data={formData.intelligence} updateData={updateFormData} />}
            {currentStep === 5 && <MCPStep data={formData.mcps} updateData={updateFormData} />}
          </div>
        </div>

        {/* Navigation */}
        <div className="onboarding-footer">
          <div className="step-indicator">
            Step {currentStep} of {steps.length}
          </div>
          <div className="button-group">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`btn btn-secondary ${currentStep === 1 ? 'disabled' : ''}`}
            >
              <ChevronLeft className="icon" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className={`btn ${currentStep === 5 ? 'btn-success' : 'btn-primary'}`}
            >
              {currentStep === 5 ? 'Complete Setup' : 'Next Step'}
              <ChevronRight className="icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 1: Organization Profile
const OrganizationStep = ({ data, updateData }) => {
  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    updateData('organization', field, items);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Organization Name</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => updateData('organization', 'name', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Your company name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Industry</label>
        <select
          value={data.industry}
          onChange={(e) => updateData('organization', 'industry', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Select your industry</option>
          <option value="technology">Technology</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Financial Services</option>
          <option value="retail">Retail & E-commerce</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="media">Media & Entertainment</option>
          <option value="energy">Energy & Utilities</option>
          <option value="nonprofit">Non-Profit</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Market Position</label>
        <select
          value={data.position}
          onChange={(e) => updateData('organization', 'position', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">How are you positioned?</option>
          <option value="leader">Market Leader</option>
          <option value="challenger">Challenger Brand</option>
          <option value="disruptor">Industry Disruptor</option>
          <option value="emerging">Emerging Player</option>
          <option value="niche">Niche Specialist</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Key Differentiators</label>
        <textarea
          value={data.differentiators.join(', ')}
          onChange={(e) => handleArrayInput('differentiators', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="First AI-powered solution, 10x faster than competitors, patented technology (comma-separated)"
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Main Competitors</label>
        <textarea
          value={data.competitors.join(', ')}
          onChange={(e) => handleArrayInput('competitors', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Competitor A, Competitor B, Competitor C (comma-separated)"
          rows="2"
        />
      </div>
    </div>
  );
};

// Step 2: PR Objectives
const ObjectivesStep = ({ data, updateData }) => {
  const objectives = [
    { id: 'thought-leadership', label: 'Thought Leadership', icon: '🎯' },
    { id: 'product-launches', label: 'Product Launches', icon: '🚀' },
    { id: 'funding', label: 'Funding & Growth', icon: '💰' },
    { id: 'talent', label: 'Talent Acquisition', icon: '👥' },
    { id: 'crisis', label: 'Crisis Preparedness', icon: '🛡️' },
    { id: 'competitive', label: 'Competitive Positioning', icon: '⚔️' }
  ];

  const toggleObjective = (id) => {
    const current = data.primary || [];
    const updated = current.includes(id) 
      ? current.filter(o => o !== id)
      : [...current, id];
    updateData('objectives', 'primary', updated.slice(0, 3)); // Max 3
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-4">Primary PR Objectives (Select up to 3)</label>
        <div className="grid grid-cols-2 gap-4">
          {objectives.map(obj => (
            <div
              key={obj.id}
              onClick={() => toggleObjective(obj.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                ${data.primary?.includes(obj.id) 
                  ? 'border-indigo-500 bg-indigo-500/20' 
                  : 'border-gray-600 hover:border-gray-500'}`}
            >
              <div className="text-2xl mb-2">{obj.icon}</div>
              <div className="font-medium">{obj.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Success Metrics</label>
        <textarea
          value={data.metrics?.join('\n') || ''}
          onChange={(e) => updateData('objectives', 'metrics', e.target.value.split('\n').filter(Boolean))}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Tier 1 media coverage monthly
20% share of voice
3 speaking opportunities per quarter"
          rows="4"
        />
      </div>
    </div>
  );
};

// Step 3: Opportunity Configuration
const OpportunitiesStep = ({ data, updateData }) => {
  const opportunityTypes = [
    { id: 'competitor_weakness', label: 'Competitor Weakness Detection', desc: 'Identify when competitors stumble' },
    { id: 'narrative_vacuum', label: 'Narrative Vacuum', desc: 'Find gaps in market conversations' },
    { id: 'cascade_events', label: 'Cascade Event Prediction', desc: 'Predict ripple effects of events' },
    { id: 'trending_topics', label: 'Trending Topics', desc: 'Jump on relevant trends' },
    { id: 'awards_speaking', label: 'Awards & Speaking', desc: 'Track submission deadlines' }
  ];

  const toggleOpportunity = (id) => {
    updateData('opportunities', 'types', {
      ...data.types,
      [id]: !data.types[id]
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-4">Opportunity Types to Track</label>
        <div className="space-y-3">
          {opportunityTypes.map(opp => (
            <div
              key={opp.id}
              onClick={() => toggleOpportunity(opp.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all
                ${data.types[opp.id] 
                  ? 'border-indigo-500 bg-indigo-500/20' 
                  : 'border-gray-600 hover:border-gray-500'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{opp.label}</div>
                  <div className="text-sm text-gray-400">{opp.desc}</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${data.types[opp.id] ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500'}`}>
                  {data.types[opp.id] && <Check className="w-4 h-4" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Response Time</label>
          <select
            value={data.response_time}
            onChange={(e) => updateData('opportunities', 'response_time', e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="< 1 hour">Immediate (&lt; 1 hour)</option>
            <option value="< 4 hours">Rapid (&lt; 4 hours)</option>
            <option value="same-day">Same Day</option>
            <option value="next-day">Next Day</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
          <select
            value={data.risk_tolerance}
            onChange={(e) => updateData('opportunities', 'risk_tolerance', e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="aggressive">Aggressive Opportunist</option>
            <option value="balanced">Balanced Strategic</option>
            <option value="defensive">Defensive Positioning</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Step 4: Intelligence Sources
const IntelligenceStep = ({ data, updateData }) => {
  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    updateData('intelligence', field, items);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Competitors to Track</label>
        <textarea
          value={data.competitors_to_track?.join(', ') || ''}
          onChange={(e) => handleArrayInput('competitors_to_track', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Stripe, Square, PayPal (comma-separated)"
          rows="2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Topics to Monitor</label>
        <textarea
          value={data.topics_to_monitor?.join(', ') || ''}
          onChange={(e) => handleArrayInput('topics_to_monitor', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="AI regulation, fintech trends, payment innovation (comma-separated)"
          rows="2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Keywords to Track</label>
        <textarea
          value={data.keywords?.join(', ') || ''}
          onChange={(e) => handleArrayInput('keywords', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="embedded finance, payment processing, digital wallet (comma-separated)"
          rows="2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Journalist Beats to Follow</label>
        <textarea
          value={data.journalists?.join(', ') || ''}
          onChange={(e) => handleArrayInput('journalists', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Tech beat, Finance beat, Startup beat (comma-separated)"
          rows="2"
        />
      </div>
    </div>
  );
};

// Step 5: MCP Activation
const MCPStep = ({ data, updateData }) => {
  const mcpSystems = [
    { id: 'intelligence', name: 'Market Intelligence', desc: 'Competitor and market monitoring', essential: true },
    { id: 'monitor', name: 'Real-time Monitor', desc: 'Live tracking of events', essential: true },
    { id: 'opportunities', name: 'Opportunity Engine', desc: 'Detect PR opportunities', essential: true },
    { id: 'crisis', name: 'Crisis Detection', desc: 'Early warning system', essential: false },
    { id: 'social', name: 'Social Monitoring', desc: 'Social media tracking', essential: false },
    { id: 'narratives', name: 'Narrative Tracking', desc: 'Story evolution monitoring', essential: false },
    { id: 'regulatory', name: 'Regulatory Intel', desc: 'Compliance monitoring', essential: false },
    { id: 'entities', name: 'Entity Recognition', desc: 'People and org tracking', essential: false },
    { id: 'relationships', name: 'Relationship Mapping', desc: 'Stakeholder connections', essential: false }
  ];

  const toggleMCP = (id) => {
    updateData('mcps', id, !data[id]);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-4">Intelligence Systems to Activate</label>
        <div className="space-y-3">
          {mcpSystems.map(mcp => (
            <div
              key={mcp.id}
              onClick={() => !mcp.essential && toggleMCP(mcp.id)}
              className={`p-4 rounded-lg border transition-all
                ${mcp.essential ? 'border-green-500 bg-green-500/20 cursor-default' : 
                  data[mcp.id] 
                    ? 'border-indigo-500 bg-indigo-500/20 cursor-pointer' 
                    : 'border-gray-600 hover:border-gray-500 cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium flex items-center">
                    {mcp.name}
                    {mcp.essential && <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded">Essential</span>}
                  </div>
                  <div className="text-sm text-gray-400">{mcp.desc}</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${(mcp.essential || data[mcp.id]) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500'}`}>
                  {(mcp.essential || data[mcp.id]) && <Check className="w-4 h-4" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-700 rounded-lg p-4">
        <div className="text-sm text-gray-300">
          <strong>Note:</strong> Essential systems are required for basic operation. 
          Additional systems can be activated later as needed.
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;