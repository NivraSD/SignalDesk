import React, { useState, useEffect } from 'react';
import intelligentMonitoringAgent from '../../services/intelligentMonitoringAgent';
import { Activity, CheckCircle, AlertCircle } from 'lucide-react';

const DataVerificationTest = () => {
  const [monitoringData, setMonitoringData] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  useEffect(() => {
    // Subscribe to monitoring updates
    const unsubscribe = intelligentMonitoringAgent.subscribe((stakeholderId, data) => {
      console.log('Received update for stakeholder:', stakeholderId);
      console.log('Data:', data);
      setMonitoringData(prev => ({
        ...prev,
        [stakeholderId]: data
      }));
    });
    
    return () => unsubscribe();
  }, []);
  
  const startTestMonitoring = async () => {
    setIsMonitoring(true);
    
    // Test stakeholders
    const testStakeholders = [
      {
        id: 'test-apple',
        name: 'Apple',
        type: 'company',
        topics: ['product launches', 'tim cook', 'earnings']
      },
      {
        id: 'test-microsoft', 
        name: 'Microsoft',
        type: 'company',
        topics: ['azure', 'copilot', 'nadella']
      }
    ];
    
    // Test sources
    const testSources = testStakeholders.map(s => ({
      stakeholderId: s.id,
      type: 'news',
      url: 'google-news'
    }));
    
    await intelligentMonitoringAgent.startMonitoring(testStakeholders, testSources);
  };
  
  const stopMonitoring = () => {
    intelligentMonitoringAgent.stopMonitoring();
    setIsMonitoring(false);
  };
  
  return (
    <div style={{ padding: '2rem', background: 'white', borderRadius: '0.5rem', margin: '1rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={24} />
        Data Verification Test
      </h2>
      
      <div style={{ marginBottom: '1rem' }}>
        {!isMonitoring ? (
          <button
            onClick={startTestMonitoring}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Start Real Data Monitoring
          </button>
        ) : (
          <button
            onClick={stopMonitoring}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Stop Monitoring
          </button>
        )}
      </div>
      
      {Object.entries(monitoringData).length > 0 && (
        <div>
          <h3>Real-Time Data:</h3>
          {Object.entries(monitoringData).map(([stakeholderId, data]) => (
            <div key={stakeholderId} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {data.findings?.length > 0 ? (
                  <CheckCircle size={20} style={{ color: '#10b981' }} />
                ) : (
                  <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                )}
                {data.stakeholderName}
              </h4>
              
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <p>Found {data.findings?.length || 0} articles</p>
                <p>Sentiment: {data.sentiment || 'analyzing...'}</p>
                <p>Risk Level: {data.riskLevel || 'calculating...'}</p>
              </div>
              
              {data.insights?.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Key Insights:</strong>
                  <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                    {data.insights.slice(0, 3).map((insight, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem' }}>
                        {insight.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.findings?.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Latest Articles:</strong>
                  <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                    {data.findings.slice(0, 3).map((finding, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem' }}>
                        <a href={finding.url} target="_blank" rel="noopener noreferrer" 
                           style={{ color: '#6366f1', textDecoration: 'none' }}>
                          {finding.title}
                        </a>
                        <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>
                          ({finding.source})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {isMonitoring && Object.entries(monitoringData).length === 0 && (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: '#6b7280',
          background: '#f9fafb',
          borderRadius: '0.5rem'
        }}>
          <Activity size={32} style={{ margin: '0 auto 1rem', animation: 'spin 2s linear infinite' }} />
          <p>Monitoring in progress... Real data will appear here shortly.</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Check the console for detailed logs.
          </p>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DataVerificationTest;