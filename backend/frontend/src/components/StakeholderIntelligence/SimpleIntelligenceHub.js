import React, { useState } from 'react';
import { Settings, Activity, RefreshCw } from 'lucide-react';
import MonitoringSetup from './MonitoringSetup';
import StrategicAnalysisDashboard from './StrategicAnalysisDashboard';

const SimpleIntelligenceHub = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [monitoringConfig, setMonitoringConfig] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  const handleSetupComplete = (config) => {
    console.log('Monitoring setup complete:', config);
    setMonitoringConfig(config);
    setIsSetupComplete(true);
    setShowSetup(false);
  };

  const resetConfiguration = () => {
    setShowSetup(true);
  };

  return (
    <div style={{ 
      height: '100%', 
      background: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {(!isSetupComplete || showSetup) ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MonitoringSetup onSetupComplete={handleSetupComplete} />
        </div>
      ) : (
        <>
          {/* Header with config info */}
          <div style={{
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Monitoring: {monitoringConfig.company}
              </h1>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  📊 {monitoringConfig.topics.length} topics
                </span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  🏢 {monitoringConfig.competitors.length} competitors
                </span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  🏭 {monitoringConfig.industry}
                </span>
              </div>
            </div>
            
            <button
              onClick={resetConfiguration}
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#6366f1',
                border: '1px solid #6366f1',
                borderRadius: '0.375rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Settings size={16} />
              Reconfigure
            </button>
          </div>

          {/* Strategic Analysis Dashboard */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <StrategicAnalysisDashboard 
              companyProfile={{
                company: monitoringConfig.company,
                industry: monitoringConfig.industry,
                objectives: monitoringConfig.objectives
              }}
              monitoringConfig={monitoringConfig}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SimpleIntelligenceHub;