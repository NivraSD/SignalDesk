import React, { useState } from 'react';

/**
 * Simple Intelligence Test Component
 * Just runs the pipeline and displays results - no complex storage
 */
const SimpleIntelligenceTest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

  const runSimpleTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      console.log('🚀 Starting simple intelligence test...');
      
      // Just run Stage 1 as a test
      const response = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-stage-1-competitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organization: {
            name: 'TestCompany',
            industry: 'technology',
            description: 'A test company for intelligence analysis'
          },
          competitors: ['Microsoft', 'Google', 'Amazon']
        })
      });
      
      const data = await response.json();
      console.log('📊 Received data:', data);
      
      if (data.success && data.data) {
        setResults(data.data);
      } else if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1>Simple Intelligence Test</h1>
      <p>This is a simplified test to verify the pipeline works.</p>
      
      <button 
        onClick={runSimpleTest}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#666' : '#00ff88',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Running Analysis...' : 'Run Simple Test'}
      </button>
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#ff0044', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}
      
      {results && (
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
          <h2>Results:</h2>
          
          {results.competitors && (
            <div>
              <h3>Competitors Analyzed:</h3>
              <ul>
                {results.competitors.direct?.map((comp, idx) => (
                  <li key={idx}>
                    {comp.name} - Threat Level: {comp.threat_level}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {results.recommendations && (
            <div>
              <h3>Recommendations:</h3>
              <ul>
                {results.recommendations.immediate_actions?.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          )}
          
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer' }}>View Raw JSON</summary>
            <pre style={{ 
              backgroundColor: '#000', 
              padding: '10px', 
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default SimpleIntelligenceTest;