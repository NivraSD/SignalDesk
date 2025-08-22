import React, { useState, useEffect } from 'react';
import './RailwayV2Enhanced.css';
import IntelligenceDisplayV3 from './IntelligenceDisplayV3';
import OpportunityModule from './Modules/OpportunityModule';
import ExecutionModule from './Modules/ExecutionModule';
import MemoryVaultModule from './Modules/MemoryVaultModule';
import NivStrategicAdvisor from './Niv/NivStrategicAdvisor';
import OrganizationSettings from './OrganizationSettings';
import IntelligenceSettings from './IntelligenceSettings';
import DiagnosticPanel from './DiagnosticPanel';
import { IntelligenceIcon, OpportunityIcon, ExecutionIcon, MemoryIcon, RefreshIcon, SettingsIcon } from './Icons/NeonIcons';

const RailwayV2Enhanced = () => {
  const [activeModule, setActiveModule] = useState('intelligence');
  const [organizationData, setOrganizationData] = useState(null);
  const [nivMinimized, setNivMinimized] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [showIntelSettings, setShowIntelSettings] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Get organization data - try both possible localStorage keys
    let orgData = null;
    
    // First try signaldesk_organization
    const savedOrg = localStorage.getItem('signaldesk_organization');
    if (savedOrg) {
      orgData = JSON.parse(savedOrg);
    }
    
    // If not found, try signaldesk_onboarding
    if (!orgData) {
      const onboarding = localStorage.getItem('signaldesk_onboarding');
      if (onboarding) {
        const parsed = JSON.parse(onboarding);
        if (parsed.organization) {
          orgData = parsed.organization;
        }
      }
    }
    
    // Default to Toyota if nothing found
    if (!orgData) {
      orgData = {
        name: 'Toyota',
        industry: 'automotive'
      };
    }
    
    console.log('🏢 RailwayV2Enhanced setting organization:', orgData);
    setOrganizationData(orgData);
  }, []);

  const modules = [
    { id: 'intelligence', name: 'Intelligence', Icon: IntelligenceIcon, color: '#00ffcc' },
    { id: 'opportunities', name: 'Opportunities', Icon: OpportunityIcon, color: '#ff00ff' },
    { id: 'execution', name: 'Execution', Icon: ExecutionIcon, color: '#00ff88' },
    { id: 'memory', name: 'Memory', Icon: MemoryIcon, color: '#8800ff' }
  ];

  const renderModule = () => {
    switch(activeModule) {
      case 'intelligence':
        return <IntelligenceDisplayV3 
          organization={organizationData} 
          refreshTrigger={refreshKey}
        />;
      case 'opportunities':
        return <OpportunityModule organizationId={organizationData?.id} />;
      case 'execution':
        return <ExecutionModule organizationId={organizationData?.id} />;
      case 'memory':
        return <MemoryVaultModule organizationId={organizationData?.id} />;
      default:
        return <IntelligenceDisplayV3 
          organization={organizationData} 
          refreshTrigger={refreshKey}
        />;
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
              <span className="nav-icon">
                <module.Icon size={20} color={activeModule === module.id ? module.color : 'rgba(255,255,255,0.7)'} />
              </span>
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
                <span className="module-icon">
                  {modules.find(m => m.id === activeModule)?.Icon && 
                    React.createElement(modules.find(m => m.id === activeModule).Icon, {
                      size: 24,
                      color: modules.find(m => m.id === activeModule)?.color
                    })
                  }
                </span>
                {modules.find(m => m.id === activeModule)?.name} Hub
              </h2>
              <div className="module-actions">
                {activeModule === 'intelligence' && (
                  <>
                    <select 
                      value={timeframe} 
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="action-select timeframe"
                    >
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                    </select>
                    <button 
                      className="action-btn refresh"
                      onClick={() => setRefreshKey(prev => prev + 1)}
                      title="Refresh Intelligence"
                    >
                      <RefreshIcon size={16} color="#00ff88" />
                      <span>Refresh</span>
                    </button>
                  </>
                )}
                <button 
                  className="action-btn settings"
                  onClick={() => {
                    if (activeModule === 'intelligence') {
                      setShowIntelSettings(true);
                    } else {
                      setShowOrgSettings(true);
                    }
                  }}
                >
                  <SettingsIcon size={16} color="#00ffcc" />
                  <span>Settings</span>
                </button>
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

      {/* Intelligence Settings Modal */}
      {showIntelSettings && (
        <IntelligenceSettings
          onClose={() => setShowIntelSettings(false)}
          onSave={(config) => {
            setShowIntelSettings(false);
            // Configuration is saved to localStorage, page will reload
          }}
        />
      )}
      
      {/* Diagnostic Panel (only shows in debug mode) */}
      <DiagnosticPanel />
    </div>
  );
};

export default RailwayV2Enhanced;