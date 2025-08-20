import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingWithMCPs from '../Onboarding/OnboardingWithMCPs';
import IntelligenceAnalytics from '../Modules/IntelligenceAnalytics';
import OpportunityModule from '../Modules/OpportunityModule';
import ExecutionModule from '../Modules/ExecutionModule';
import MemoryVaultModule from '../Modules/MemoryVaultModule';
import NivStrategicAdvisor from '../Niv/NivStrategicAdvisor';
import './FourModuleLayout.css';

const FourModuleLayout = () => {
  const [activeModule, setActiveModule] = useState('intelligence');
  const [showOnboarding, setShowOnboarding] = useState(true); // Start with onboarding shown
  const [showNiv, setShowNiv] = useState(true);
  const [organizationData, setOrganizationData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if organization is set up in localStorage
    const checkOrganizationSetup = () => {
      try {
        // Check if we have saved organization data in localStorage
        const savedOrg = localStorage.getItem('signaldesk_organization');
        
        if (savedOrg) {
          const orgData = JSON.parse(savedOrg);
          setOrganizationData(orgData);
          setShowOnboarding(false);
        } else {
          // No organization set up, show onboarding
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking organization setup:', error);
        // If there's an error, show onboarding
        setShowOnboarding(true);
      }
    };

    checkOrganizationSetup();
  }, []);

  const handleOnboardingComplete = (data) => {
    setOrganizationData(data);
    setShowOnboarding(false);
  };

  const modules = [
    {
      id: 'intelligence',
      name: 'Intelligence',
      icon: '🔍',
      description: 'Gather • Monitor • Analyze',
      color: '#4F46E5'
    },
    {
      id: 'opportunity',
      name: 'Opportunity',
      icon: '🎯',
      description: 'Detect • Score • Predict',
      color: '#059669'
    },
    {
      id: 'execution',
      name: 'Execution',
      icon: '⚡',
      description: 'Create • Deploy • Generate',
      color: '#DC2626'
    },
    {
      id: 'memoryvault',
      name: 'MemoryVault',
      icon: '🧠',
      description: 'Remember • Learn • Pattern',
      color: '#7C3AED'
    }
  ];

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'intelligence':
        return <IntelligenceAnalytics organizationId={organizationData?.id} />;
      case 'opportunity':
        return <OpportunityModule organizationId={organizationData?.id} />;
      case 'execution':
        return <ExecutionModule organizationId={organizationData?.id} />;
      case 'memoryvault':
        return <MemoryVaultModule organizationId={organizationData?.id} />;
      default:
        return <IntelligenceAnalytics organizationId={organizationData?.id} />;
    }
  };

  if (showOnboarding) {
    return <OnboardingWithMCPs />;
  }

  return (
    <div className="four-module-layout">
      {/* Header Bar */}
      <div className="layout-header">
        <div className="header-left">
          <h1 className="platform-title">SignalDesk V2</h1>
          {organizationData && (
            <span className="org-name">{organizationData.name}</span>
          )}
        </div>
        <div className="header-center">
          <div className="module-tabs">
            {modules.map(module => (
              <button
                key={module.id}
                className={`module-tab ${activeModule === module.id ? 'active' : ''}`}
                onClick={() => setActiveModule(module.id)}
                style={{ '--module-color': module.color }}
              >
                <span className="module-icon">{module.icon}</span>
                <div className="module-info">
                  <span className="module-name">{module.name}</span>
                  <span className="module-description">{module.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="header-right">
          <button 
            className="niv-toggle"
            onClick={() => setShowNiv(!showNiv)}
          >
            {showNiv ? '🤖 Hide Niv' : '🤖 Show Niv'}
          </button>
          <button 
            className="settings-btn"
            onClick={() => setShowOnboarding(true)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="layout-content">
        {/* Module Content */}
        <div className={`module-content ${showNiv ? 'with-niv' : 'full-width'}`}>
          {renderActiveModule()}
        </div>

        {/* Niv Strategic Advisor Panel */}
        {showNiv && (
          <div className="niv-panel">
            <NivStrategicAdvisor 
              activeModule={activeModule}
              organizationData={organizationData}
              onModuleSwitch={setActiveModule}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FourModuleLayout;