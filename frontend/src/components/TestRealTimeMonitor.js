import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

const TestRealTimeMonitor = () => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const results = {};

    // Test 1: Google News Proxy
    try {
      const response = await fetch('http://localhost:5001/api/proxy/google-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Microsoft' })
      });
      const data = await response.json();
      results.googleNews = {
        success: response.ok && data.articles?.length > 0,
        count: data.articles?.length || 0,
        sample: data.articles?.[0]?.title
      };
    } catch (error) {
      results.googleNews = { success: false, error: error.message };
    }

    // Test 2: Reddit Proxy
    try {
      const response = await fetch('http://localhost:5001/api/proxy/reddit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'technology' })
      });
      const data = await response.json();
      results.reddit = {
        success: response.ok && data.posts?.length > 0,
        count: data.posts?.length || 0,
        sample: data.posts?.[0]?.title
      };
    } catch (error) {
      results.reddit = { success: false, error: error.message };
    }

    // Test 3: PR Newswire
    try {
      const response = await fetch('http://localhost:5001/api/proxy/pr-newswire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'news-releases' })
      });
      const data = await response.json();
      results.prNewswire = {
        success: response.ok && data.releases?.length > 0,
        count: data.releases?.length || 0,
        sample: data.releases?.[0]?.title
      };
    } catch (error) {
      results.prNewswire = { success: false, error: error.message };
    }

    setTestResults(results);
    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Real-Time Monitoring Test</h2>
      <p>Testing connection to data sources...</p>
      
      <div style={{ marginTop: '2rem' }}>
        {testing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Loader className="animate-spin" />
            <span>Running tests...</span>
          </div>
        ) : (
          <button 
            onClick={runTests}
            style={{
              padding: '0.5rem 1rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Re-run Tests
          </button>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        {Object.entries(testResults).map(([source, result]) => (
          <div key={source} style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: result.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {result.success ? (
                <CheckCircle size={20} style={{ color: '#16a34a' }} />
              ) : (
                <XCircle size={20} style={{ color: '#dc2626' }} />
              )}
              <strong>{source}</strong>
            </div>
            
            {result.success ? (
              <div>
                <p>✓ Found {result.count} items</p>
                {result.sample && (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Sample: "{result.sample}"
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: '#dc2626' }}>
                Error: {result.error || 'Failed to fetch data'}
              </p>
            )}
          </div>
        ))}
      </div>

      {Object.keys(testResults).length === 0 && !testing && (
        <p style={{ color: '#6b7280' }}>No test results yet. Click "Run Tests" to start.</p>
      )}
    </div>
  );
};

export default TestRealTimeMonitor;