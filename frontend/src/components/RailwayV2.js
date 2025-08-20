import React, { useState, useEffect } from 'react';
import './RailwayV2.css';
import IntelligenceDisplayV2 from './IntelligenceDisplayV2';
import OpportunityModule from './Modules/OpportunityModule';
import ExecutionModule from './Modules/ExecutionModule';
import MemoryVaultModule from './Modules/MemoryVaultModule';
import NivStrategicAdvisor from './Niv/NivStrategicAdvisor';

const RailwayV2 = () => {
  const [activeModule, setActiveModule] = useState('intelligence');
  const [organizationData, setOrganizationData] = useState(null);
  const [showNiv, setShowNiv] = useState(true);

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
      
      {/* Main Header */}
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
              style={{ '--neon-color': module.color }}
            >
              <span className="nav-icon">{module.icon}</span>
              <span className="nav-text">{module.name}</span>
              <div className="neon-glow"></div>
            </button>
          ))}
        </nav>

        <div className="railway-status">
          <div className="status-indicator active"></div>
          <span>{organizationData?.name || 'System'}</span>
        </div>
      </header>

      {/* Module Container */}
      <main className="railway-main">
        <div className="module-container">
          <div className="module-header">
            <h2 className="module-title">
              {modules.find(m => m.id === activeModule)?.icon} {' '}
              {modules.find(m => m.id === activeModule)?.name}
            </h2>
            <div className="module-actions">
              <button className="action-btn refresh">↻ Refresh</button>
              <button className="action-btn settings">⚙</button>
            </div>
          </div>
          
          <div className="module-content">
            {renderModule()}
          </div>
        </div>
      </main>

      {/* Niv Strategic Advisor */}
      {showNiv && (
        <NivStrategicAdvisor 
          organizationId={organizationData?.id}
          onClose={() => setShowNiv(false)}
        />
      )}
      
      {/* Niv Toggle Button */}
      {!showNiv && (
        <div className="niv-floating">
          <button className="niv-trigger" onClick={() => setShowNiv(true)}>
            <span className="niv-icon">🤖</span>
            <span className="niv-pulse"></span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RailwayV2;