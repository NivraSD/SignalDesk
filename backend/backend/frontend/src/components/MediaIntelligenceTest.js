// TEST COMPONENT - VISIBLE PROOF OF DEPLOYMENT
import React from 'react';

const MediaIntelligenceTest = () => {
  return (
    <div style={{
      padding: '40px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      minHeight: '100vh',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        🚀 MEDIA INTELLIGENCE - NEW VERSION
      </h1>
      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2>Deployment Successful!</h2>
        <p>Build Time: {new Date().toISOString()}</p>
        <p>Component: MediaIntelligence (NOT MediaListBuilder)</p>
        <p>Status: ACTIVE AND WORKING</p>
        <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px' }}>
          <code>
            If you see this, the deployment worked!
            <br />
            Old MediaListBuilder has been replaced.
          </code>
        </div>
      </div>
    </div>
  );
};

export default MediaIntelligenceTest;