import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RailwayV2.css';
import IntelligenceHubV8 from './IntelligenceHubV8';
import MultiStageIntelligence from './MultiStageIntelligence';
import OpportunityModulePR from './Modules/OpportunityModulePR';
import ExecutionModule from './Modules/ExecutionModule';
import MemoryVaultModule from './Modules/MemoryVaultModule';
import NivStrategicAdvisor from './Niv/NivStrategicAdvisor';
import OrganizationSettings from './OrganizationSettings';
import IntelligenceSettings from './IntelligenceSettings';
import DiagnosticPanel from './DiagnosticPanel';
import { IntelligenceIcon, OpportunityIcon, ExecutionIcon, MemoryIcon, RefreshIcon, SettingsIcon } from './Icons/NeonIcons';

const RailwayV2 = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('intelligence');
  // Initialize organization as null - will load from Supabase
  const [organizationData, setOrganizationData] = useState(null);
  const [nivMinimized, setNivMinimized] = useState(false);
  const [showOrgSettings, setShowOrgSettings] = useState(false);
  const [showIntelSettings, setShowIntelSettings] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sharedIntelligence, setSharedIntelligence] = useState(null);

  useEffect(() => {
    // Skip if we already have organization data
    if (organizationData && organizationData.name) {
      return;
    }
    
    // Load organization data - try localStorage first, then Supabase
    const loadOrganization = async () => {
      // QUICK FIX: Try localStorage first
      const savedOrg = localStorage.getItem('organization');
      if (savedOrg) {
        try {
          const orgData = JSON.parse(savedOrg);
          console.log('✅ Loaded organization from localStorage:', orgData.name);
          setOrganizationData(orgData);
          return;
        } catch (e) {
          console.error('Failed to parse localStorage org:', e);
        }
      }
      
      // Fallback to Supabase if no localStorage
      console.log('🔍 No localStorage, trying Supabase...');
      
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/intelligence-persistence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            action: 'getLatestProfile'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Supabase response:', result);
          
          if (result.profile?.organization) {
            const orgData = result.profile.organization;
            if (!orgData.id) {
              orgData.id = orgData.name.toLowerCase().replace(/\s+/g, '-');
            }
            setOrganizationData(orgData);
            return;
          }
        } else {
          console.warn('⚠️ Failed to load from Supabase:', response.status);
        }
      } catch (error) {
        console.error('❌ Error loading from Supabase:', error);
      }
      
      // If we couldn't load from anywhere, go to onboarding
      console.log('➡️ No organization found, redirecting to onboarding...');
      navigate('/onboarding');
    };
    
    loadOrganization();
  }, [navigate, refreshKey]);
  
  
  // DISABLED: Focus handler was causing infinite loops
  // useEffect(() => {
  //   const handleFocus = () => {
  //     const savedOrg = localStorage.getItem('organization');
  //     if (savedOrg && !organizationData) {
  //       console.log('🔄 Window focused, loading new organization data...');
  //       setRefreshKey(prev => prev + 1);
  //     }
  //   };
  //   
  //   window.addEventListener('focus', handleFocus);
  //   return () => window.removeEventListener('focus', handleFocus);
  // }, [organizationData]);
  
  const handleNewSearch = async () => {
    console.log('🔄 Starting new search...');
    
    // Clear localStorage
    localStorage.removeItem('organization');
    localStorage.removeItem('organizationName');
    localStorage.removeItem('hasCompletedOnboarding');
    
    // Clear Supabase data for current organization
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
    
    try {
      // Clear the current profile in Supabase
      await fetch(`${supabaseUrl}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          action: 'clearProfile'
        })
      });
      console.log('✅ Cleared Supabase profile');
    } catch (error) {
      console.error('⚠️ Error clearing Supabase:', error);
    }
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear window-level caches
    if (typeof window !== 'undefined') {
      window.__SIGNALDESK_INTELLIGENCE__ = null;
      window.__SIGNALDESK_CACHE__ = null;
      window.__ORGANIZATION_DATA__ = null;
    }
    
    // Redirect to fresh onboarding
    navigate('/onboarding');
  };

  
  const modules = [
    { id: 'intelligence', name: 'Intelligence', Icon: IntelligenceIcon, color: '#00ffcc' },
    { id: 'opportunities', name: 'Opportunities', Icon: OpportunityIcon, color: '#ff00ff' },
    { id: 'execution', name: 'Execution', Icon: ExecutionIcon, color: '#00ff88' },
    { id: 'memory', name: 'Memory', Icon: MemoryIcon, color: '#8800ff' }
  ];

  const renderModule = () => {
    switch(activeModule) {
      case 'intelligence':
        // Multi-Stage Intelligence Pipeline - Deep Analysis
        
        // Don't render IntelligenceHubV8 until we have organization data
        if (!organizationData || !organizationData.name) {
          return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#00ffcc' }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔄 Loading Organization Data...</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>
                Waiting for organization data to initialize intelligence pipeline
              </div>
            </div>
          );
        }
        
        return <MultiStageIntelligence 
          organization={organizationData}
          onComplete={(intelligence) => {
            setSharedIntelligence(intelligence);
          }}
        />;
      case 'opportunities':
        return <OpportunityModulePR 
          organizationId={organizationData?.id}
          sharedIntelligence={sharedIntelligence}
          onIntelligenceUpdate={setSharedIntelligence}
        />;
      case 'execution':
        return <ExecutionModule organizationId={organizationData?.id} />;
      case 'memory':
        return <MemoryVaultModule organizationId={organizationData?.id} />;
      default:
        return <MultiStageIntelligence 
          organization={organizationData}
          onComplete={(intelligence) => {
            setSharedIntelligence(intelligence);
          }}
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
            className="new-search-btn"
            onClick={handleNewSearch}
            title="Start New Search"
            style={{
              background: 'linear-gradient(135deg, #00ff88, #00ffcc)',
              color: '#000',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              marginRight: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 New Search
          </button>
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
      
    </div>
  );
};

export default RailwayV2;