import React, { useState } from 'react';
import API_BASE_URL from '../../config/api';

const TestMonitoring = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    try {
      // Test Google News
      const response = await fetch(`${API_BASE_URL}/proxy/google-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Apple' })
      });
      
      const data = await response.json();
      setResults({
        success: response.ok,
        articleCount: data.articles?.length || 0,
        firstArticle: data.articles?.[0]?.title || 'No articles',
        raw: JSON.stringify(data, null, 2)
      });
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Test Backend Monitoring</h2>
      <button 
        onClick={testBackend}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Google News API'}
      </button>
      
      {results && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Results:</h3>
          <p>Success: {results.success ? '✅' : '❌'}</p>
          {results.success ? (
            <>
              <p>Found {results.articleCount} articles</p>
              <p>First: {results.firstArticle}</p>
              <details>
                <summary>Raw Data</summary>
                <pre style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem' }}>
                  {results.raw}
                </pre>
              </details>
            </>
          ) : (
            <p>Error: {results.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TestMonitoring;