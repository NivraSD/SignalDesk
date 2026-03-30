import React, { useState, useEffect } from 'react';
import './MultiStageIntelligence.css';
import NivStrategicDisplay from '@/components/niv/NivStrategicDisplay';
import type { NivStrategicFramework } from '@/types/niv-strategic';

/**
 * Simplified Intelligence Strategy Component
 * Focuses on displaying NIV Strategic Framework outputs
 * without running the intelligence pipeline
 */

const IntelligenceStrategy = ({ organization: organizationProp, onComplete }) => {
  const [activeTab, setActiveTab] = useState('strategic');
  const [nivStrategicFramework, setNivStrategicFramework] = useState<NivStrategicFramework | null>(null);
  const [organization] = useState(organizationProp || { name: 'OpenAI', id: 'openai' });

  // Listen for NIV strategic framework messages
  useEffect(() => {
    const handleNivFramework = (event: MessageEvent) => {
      if (event.data.type === 'niv-strategic-framework') {
        console.log('📊 Received NIV Strategic Framework:', event.data);
        setNivStrategicFramework(event.data.framework);
        setActiveTab('strategic');
      }
    };

    window.addEventListener('message', handleNivFramework);
    return () => window.removeEventListener('message', handleNivFramework);
  }, []);

  // Tab metadata
  const tabMetadata = {
    strategic: { label: 'NIV Strategic', icon: '🎯' },
    placeholder: { label: 'Intelligence Hub', icon: '📊' }
  };

  // Render NIV Strategic content
  const renderNivStrategic = () => {
    const handleSendToCampaign = (framework: NivStrategicFramework) => {
      console.log('📤 Sending to Campaign Intelligence:', framework);
      window.postMessage({
        type: 'niv-handoff',
        target: 'campaign',
        payload: {
          source: { component: 'niv', sessionId: Date.now().toString(), timestamp: new Date().toISOString() },
          context: { discovery: framework.discoveryContext, framework, orchestration: null },
          campaign: {
            brief: framework.strategy?.objective || '',
            category: 'strategic',
            type: 'niv-generated',
            timeline: { phases: framework.execution?.timeline?.phases || [] },
            assets: [],
            stakeholders: []
          }
        }
      }, '*');
    };

    const handleSendToPlan = (framework: NivStrategicFramework) => {
      console.log('📋 Sending to Plan:', framework);
      window.postMessage({
        type: 'niv-handoff',
        target: 'plan',
        payload: {
          source: { component: 'niv', sessionId: Date.now().toString(), timestamp: new Date().toISOString() },
          context: { discovery: framework.discoveryContext, framework, orchestration: null },
          project: {
            phases: framework.execution?.timeline?.phases || [],
            tasks: [],
            milestones: framework.execution?.timeline?.milestones || [],
            dependencies: framework.execution?.timeline?.dependencies || [],
            resources: framework.execution?.resources?.required || []
          }
        }
      }, '*');
    };

    const handleSendToExecute = (framework: NivStrategicFramework) => {
      console.log('🚀 Sending to Execute:', framework);
      window.postMessage({
        type: 'niv-handoff',
        target: 'execute',
        payload: {
          source: { component: 'niv', sessionId: Date.now().toString(), timestamp: new Date().toISOString() },
          context: { discovery: framework.discoveryContext, framework, orchestration: null },
          content: {
            pieces: [],
            calendar: null,
            templates: [],
            guidelines: []
          }
        }
      }, '*');
    };

    const handleRefineStrategy = (framework: NivStrategicFramework) => {
      console.log('🔄 Refining strategy with NIV');
      // Send message back to NIV for refinement
      window.postMessage({
        type: 'niv-refine-request',
        framework: framework,
        instructions: 'Please refine this strategy with more specific tactics'
      }, '*');
    };

    if (!nivStrategicFramework) {
      return (
        <div className="empty-strategic">
          <div className="empty-icon">🎯</div>
          <h3>No Strategic Framework Yet</h3>
          <p>Ask NIV to develop a strategic framework for your organization.</p>
          <p className="hint">Try: "Develop a strategy for our product launch" or "How should we respond to competitor news?"</p>
        </div>
      );
    }

    return (
      <NivStrategicDisplay
        framework={nivStrategicFramework}
        onSendToCampaign={handleSendToCampaign}
        onSendToPlan={handleSendToPlan}
        onSendToExecute={handleSendToExecute}
        onRefineStrategy={handleRefineStrategy}
      />
    );
  };

  // Render placeholder content
  const renderPlaceholder = () => {
    return (
      <div className="intelligence-placeholder">
        <div className="placeholder-content">
          <h2>Intelligence Hub</h2>
          <p>The full intelligence pipeline has been disabled to focus on strategic development.</p>
          <p>Use NIV to generate strategic frameworks and insights.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="intelligence-strategy">
      <div className="intelligence-results">
        <div className="results-header">
          <h2>Strategic Intelligence</h2>
          <div className="completion-stats">
            <span className="stat">Organization: {organization?.name || 'Not Set'}</span>
            <span className="stat">Mode: Strategy Development</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {Object.entries(tabMetadata).map(([key, tab]) => (
            <button
              key={key}
              className={`tab-button ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content-area">
          {activeTab === 'strategic' ? renderNivStrategic() : renderPlaceholder()}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceStrategy;