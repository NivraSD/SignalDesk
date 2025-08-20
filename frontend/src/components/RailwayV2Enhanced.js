import React, { useState, useEffect } from 'react';
import './RailwayV2Enhanced.css';
import IntelligenceDisplayV2 from './IntelligenceDisplayV2';
import OpportunityModule from './Modules/OpportunityModule';
import ExecutionModule from './Modules/ExecutionModule';
import MemoryVaultModule from './Modules/MemoryVaultModule';
import NivStrategicAdvisor from './Niv/NivStrategicAdvisor';
import OrganizationSettings from './OrganizationSettings';

const RailwayV2Enhanced = () => {
  const [activeModule, setActiveModule] = useState('intelligence');
  const [organizationData, setOrganizationData] = useState(null);
  const [nivMinimized, setNivMinimized] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);

  useEffect(() => {
    // Get organization data
    const savedOrg = localStorage.getItem('signaldesk_organization');
    if (savedOrg) {
      setOrganizationData(JSON.parse(savedOrg));
    }
  }, []);

  const modules = [
    { id: 'intelligence', name: 'Intelligence', icon: '🎯', color: '#00ffcc' },
    { id: 'opportunities', name: 'Opportunities', icon: '💎', color: '#ff00ff' },
    { id: 'execution', name: 'Execution', icon: '🚀', color: '#00ff88' },
    { id: 'memory', name: 'Memory', icon: '🧠', color: '#8800ff' }
  ];

  const renderModule = () => {
    switch(activeModule) {
      case 'intelligence':
        return <IntelligenceDisplayV2 organizationId={organizationData?.id} />;
      case 'opportunities':
        return <OpportunityModule organizationId={organizationData?.id} />;
      case 'execution':
        return <ExecutionModule organizationId={organizationData?.id} />;
      case 'memory':
        return <MemoryVaultModule organizationId={organizationData?.id} />;
      default:
        return <IntelligenceDisplayV2 organizationId={organizationData?.id} />;
    }
  };

  return (
    <div className="railway-v2">
      {/* Animated Background */}
      <div className="railway-bg-animation"></div>
      
      {/* Fixed Header */}
      <header className="railway-header">
        <div className="railway-logo">
          <span className="logo-text">SIGNALDESK</span>
          <span className="logo-version">V2</span>
        </div>
        
        <nav className="railway-nav">
          {modules.map(module => (
            <button
              key={module.id}
              className={`nav-button ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
              style={{ 
                '--neon-color': module.color,
                '--neon-rgb': module.id === 'intelligence' ? '0, 255, 204' :
                             module.id === 'opportunities' ? '255, 0, 255' :
                             module.id === 'execution' ? '0, 255, 136' : '136, 0, 255'
              }}
            >
              <span className="nav-icon">{module.icon}</span>
              <span className="nav-text">{module.name}</span>
              <div className="neon-glow"></div>
            </button>
          ))}
        </nav>

        <div className="railway-status">
          <button 
            className="org-settings-btn"
            onClick={() => setShowOrgSettings(true)}
            title="Organization Settings"
          >
            <span className="settings-icon">⚙</span>
            <span className="org-name">{organizationData?.name || 'Select Organization'}</span>
          </button>
          <div className="status-indicator active"></div>
        </div>
      </header>

      {/* Main Body with Fixed Layout */}
      <div className="railway-body">
        {/* Main Content Area */}
        <div className={`railway-content ${nivMinimized ? 'niv-collapsed' : ''}`}>
          <div className="module-container">
            <div className="module-header">
              <h2 className="module-title">
                {modules.find(m => m.id === activeModule)?.icon} {' '}
                {modules.find(m => m.id === activeModule)?.name} Hub
              </h2>
              <div className="module-actions">
                <button className="action-btn settings">⚙ Settings</button>
              </div>
            </div>
            
            <div className="module-content">
              {renderModule()}
            </div>
          </div>
        </div>

        {/* Niv Panel - Fixed Right Side */}
        <div className={`niv-panel ${nivMinimized ? 'minimized' : ''}`}>
          <div className="niv-panel-header">
            <div className="niv-title">
              <span className="niv-icon">🤖</span>
              <span className="niv-name">Niv Strategic Advisor</span>
            </div>
            <button 
              className="niv-minimize-btn"
              onClick={() => setNivMinimized(!nivMinimized)}
              title={nivMinimized ? 'Expand' : 'Minimize'}
            >
              {nivMinimized ? '◀' : '▶'}
            </button>
          </div>
          
          {!nivMinimized && (
            <NivStrategicAdvisor 
              organizationId={organizationData?.id}
              activeModule={activeModule}
              embedded={true}
            />
          )}
        </div>
      </div>

      {/* Organization Settings Modal */}
      {showOrgSettings && (
        <OrganizationSettings
          onClose={() => setShowOrgSettings(false)}
          onOrganizationChange={(org) => {
            setOrganizationData(org);
            // Reload the page to refresh with new organization
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default RailwayV2Enhanced;