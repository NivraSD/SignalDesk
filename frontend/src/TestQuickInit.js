import React, { useState } from 'react';
import QuickInit from './components/QuickInit';

/**
 * Test page for QuickInit component
 * Verifies that company name is properly captured and passed through the pipeline
 */
const TestQuickInit = () => {
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Override console.log to capture logs
  React.useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, args.join(' ')]);
    };
    return () => {
      console.log = originalLog;
    };
  }, []);

  const handleComplete = (data) => {
    console.log('✅ QuickInit completed with data:', data);
    setResult(data);
    
    // Verify localStorage
    const savedOrg = localStorage.getItem('selectedOrganization');
    const savedData = localStorage.getItem('organizationData');
    const latestDiscovery = localStorage.getItem('latestDiscovery');
    
    console.log('📱 Verification - localStorage contents:');
    console.log('  selectedOrganization:', savedOrg);
    console.log('  organizationData:', savedData ? JSON.parse(savedData) : null);
    console.log('  latestDiscovery:', latestDiscovery ? JSON.parse(latestDiscovery) : null);
  };

  const clearStorage = () => {
    localStorage.removeItem('selectedOrganization');
    localStorage.removeItem('organizationData');
    localStorage.removeItem('latestDiscovery');
    setResult(null);
    setLogs([]);
    console.log('🗑️ Cleared localStorage');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a',
      color: 'white',
      padding: '20px'
    }}>
      {!result ? (
        <QuickInit onComplete={handleComplete} />
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '20px' }}>Test Results</h1>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h2>Company Data</h2>
            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.5)', 
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h2>LocalStorage Verification</h2>
            <div style={{ marginTop: '10px' }}>
              <p><strong>selectedOrganization:</strong> {localStorage.getItem('selectedOrganization')}</p>
              <p><strong>Has organizationData:</strong> {localStorage.getItem('organizationData') ? 'Yes' : 'No'}</p>
              <p><strong>Has latestDiscovery:</strong> {localStorage.getItem('latestDiscovery') ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <h2>Console Logs</h2>
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '10px',
              borderRadius: '5px',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.5'
            }}>
              {logs.map((log, i) => (
                <div key={i} style={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '5px 0'
                }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={clearStorage}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Clear Storage & Test Again
          </button>
        </div>
      )}
    </div>
  );
};

export default TestQuickInit;