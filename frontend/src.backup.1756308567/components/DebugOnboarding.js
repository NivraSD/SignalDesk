import React, { useState, useEffect } from 'react';

const DebugOnboarding = () => {
  const [onboardingData, setOnboardingData] = useState(null);
  const [organizationData, setOrganizationData] = useState(null);

  useEffect(() => {
    const onboarding = localStorage.getItem('signaldesk_onboarding');
    const organization = localStorage.getItem('signaldesk_organization');
    
    if (onboarding) {
      const parsed = JSON.parse(onboarding);
      setOnboardingData(parsed);
      console.log('📊 Onboarding Data Structure:', parsed);
    }
    
    if (organization) {
      const parsed = JSON.parse(organization);
      setOrganizationData(parsed);
      console.log('🏢 Organization Data:', parsed);
    }
  }, []);

  const clearAndRestart = () => {
    localStorage.removeItem('signaldesk_onboarding');
    localStorage.removeItem('signaldesk_organization');
    localStorage.removeItem('signaldesk_organizations');
    window.location.href = '/initialize';
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      left: 20,  // Changed to LEFT side for better visibility
      background: 'linear-gradient(135deg, #ff00ff, #8800ff)', 
      border: '3px solid #00ffcc',
      borderRadius: 15,
      padding: 20,
      maxWidth: 500,
      maxHeight: 500,
      overflow: 'auto',
      zIndex: 99999,  // Higher z-index
      color: '#fff',
      fontSize: 14,
      fontFamily: 'monospace',
      boxShadow: '0 0 50px rgba(0,255,204,0.5)'
    }}>
      <h3 style={{ color: '#00ffcc', margin: '0 0 10px 0' }}>🔍 Debug Panel</h3>
      
      {organizationData && (
        <div style={{ marginBottom: 15 }}>
          <h4 style={{ color: '#ff00ff' }}>Organization:</h4>
          <div>Name: {organizationData.name}</div>
          <div>Industry: {organizationData.industry || '❌ MISSING'}</div>
          <div>Website: {organizationData.website || '❌ MISSING'}</div>
        </div>
      )}
      
      {onboardingData && (
        <div style={{ marginBottom: 15 }}>
          <h4 style={{ color: '#ff00ff' }}>Onboarding Structure:</h4>
          <div>Has organization: {onboardingData.organization ? '✅' : '❌'}</div>
          {onboardingData.organization && (
            <>
              <div>- Name: {onboardingData.organization.name}</div>
              <div>- Industry: {onboardingData.organization.industry || '❌ MISSING'}</div>
              <div>- Website: {onboardingData.organization.website || '❌ MISSING'}</div>
            </>
          )}
          <div>Has goals: {onboardingData.goals ? '✅' : '❌'}</div>
          <div>Has intelligence: {onboardingData.intelligence ? '✅' : '❌'}</div>
          {onboardingData.intelligence && (
            <>
              <div>- Stakeholders: {onboardingData.intelligence.stakeholders?.length || 0}</div>
              <div>- Topics: {onboardingData.intelligence.topics?.length || 0}</div>
            </>
          )}
        </div>
      )}
      
      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', color: '#00ff88' }}>Full Data (click to expand)</summary>
        <pre style={{ fontSize: 10, overflow: 'auto', maxHeight: 200 }}>
          {JSON.stringify({ onboardingData, organizationData }, null, 2)}
        </pre>
      </details>
      
      <button 
        onClick={clearAndRestart}
        style={{
          marginTop: 10,
          padding: '8px 16px',
          background: '#ff4444',
          color: '#fff',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          fontSize: 12
        }}
      >
        Clear & Re-onboard
      </button>
    </div>
  );
};

export default DebugOnboarding;