import React from 'react';

const EnvDebug = () => {
  const envVars = {
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: '#171717',
      border: '1px solid #262626',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      color: '#e5e5e5'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#8b5cf6' }}>🔍 Environment Debug</h4>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '5px' }}>
          <strong style={{ color: '#60a5fa' }}>{key}:</strong>{' '}
          {value ? (
            <span style={{ color: '#10b981' }}>
              {key.includes('KEY') ? value.substring(0, 20) + '...' : value}
            </span>
          ) : (
            <span style={{ color: '#ef4444' }}>undefined</span>
          )}
        </div>
      ))}
      <hr style={{ margin: '10px 0', border: '1px solid #262626' }} />
      <div style={{ color: '#737373' }}>
        Build Time: {new Date().toISOString()}
      </div>
    </div>
  );
};

export default EnvDebug;