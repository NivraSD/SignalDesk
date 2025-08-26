import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingV2.css';

/**
 * ONBOARDING V3 - BULLETPROOF DATA FLOW
 * Track every single step of the flow to debug exactly where it breaks
 */

const OnboardingV3 = () => {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [orgUrl, setOrgUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [existingOrg, setExistingOrg] = useState(null);
  const [debugLog, setDebugLog] = useState([]);
  
  const addDebugLog = (message, data = null) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setDebugLog(prev => [...prev, logEntry]);
    console.log(`🔍 ${message}`, data);
  };

  // Check for existing organization on mount
  useEffect(() => {
    addDebugLog('🚀 OnboardingV3 mounted');
    const savedOrg = localStorage.getItem('organization');
    if (savedOrg) {
      try {
        const org = JSON.parse(savedOrg);
        if (org && org.name) {
          addDebugLog('✅ Found existing organization in localStorage', org);
          setExistingOrg(org);
        }
      } catch (e) {
        addDebugLog('❌ Invalid org data in localStorage, clearing it', e.message);
        localStorage.removeItem('organization');
      }
    } else {
      addDebugLog('📝 No existing organization found');
    }
  }, []);

  const handleContinueWithExisting = () => {
    addDebugLog('➡️ Continuing with existing organization', existingOrg);
    navigate('/railway');
  };

  const handleStartNewSearch = () => {
    addDebugLog('🧹 Starting new search, clearing all data');
    
    // Clear ALL data
    const keysToRemove = [
      'organization', 'organizationName', 'intelligenceCache', 'opportunityCache',
      'analysisCache', 'stageResults', 'currentIntelligence', 'cachedResults',
      'intelligence_data', 'opportunity_data', 'stakeholders', 'competitors',
      'media_data', 'regulatory_data', 'synthesis_data', 'hasCompletedOnboarding'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      addDebugLog(`❌ Removed: ${key}`);
    });
    
    sessionStorage.clear();
    setExistingOrg(null);
    addDebugLog('✅ All data cleared');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsProcessing(true);
    addDebugLog('🚀 Starting discovery process', { orgName, orgUrl });
    
    try {
      // STEP 1: Clear old data
      addDebugLog('🧹 Step 1: Clearing old data');
      const keysToRemove = [
        'organization', 'organizationName', 'intelligenceCache', 'opportunityCache',
        'analysisCache', 'stageResults', 'currentIntelligence', 'cachedResults'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // STEP 2: Call discovery
      addDebugLog('🔍 Step 2: Calling Claude discovery');
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
      
      const requestPayload = {
        organizationName: orgName.trim(),
        url: orgUrl.trim()
      };
      addDebugLog('📤 Request payload', requestPayload);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/organization-discovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(requestPayload)
      });
      
      addDebugLog(`📥 Discovery response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addDebugLog('❌ Discovery response failed', { status: response.status, error: errorText });
        throw new Error(`Discovery failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      addDebugLog('✅ Discovery response received', result);
      
      if (!result.success || !result.organization) {
        addDebugLog('❌ Discovery result invalid', result);
        throw new Error('Discovery returned invalid data');
      }
      
      // STEP 3: Save to localStorage
      addDebugLog('💾 Step 3: Saving to localStorage');
      const orgData = result.organization;
      
      // Ensure all required fields exist
      const completeOrg = {
        ...orgData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'claude-discovery-v3'
      };
      
      addDebugLog('💾 Complete organization data', completeOrg);
      
      localStorage.setItem('organization', JSON.stringify(completeOrg));
      localStorage.setItem('organizationName', orgName);
      localStorage.setItem('hasCompletedOnboarding', 'true');
      
      // STEP 4: Verify save
      addDebugLog('🔍 Step 4: Verifying save');
      const savedCheck = localStorage.getItem('organization');
      if (savedCheck) {
        const parsedCheck = JSON.parse(savedCheck);
        addDebugLog('✅ Save verified', parsedCheck);
      } else {
        addDebugLog('❌ Save failed - no data in localStorage');
        throw new Error('Failed to save organization data');
      }
      
      // STEP 5: Navigate
      addDebugLog('➡️ Step 5: Navigating to railway');
      
      setTimeout(() => {
        navigate('/railway');
      }, 1000);
      
    } catch (error) {
      addDebugLog('❌ Discovery process failed', error);
      alert(`Discovery failed: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="onboarding-v2">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>SignalDesk V3</h1>
          <p>Debug Mode - Bulletproof Discovery</p>
        </div>

        {/* Debug Log */}
        <div className="debug-section">
          <h3>Debug Log ({debugLog.length} entries)</h3>
          <div className="debug-log">
            {debugLog.slice(-10).map((log, idx) => (
              <div key={idx} className="debug-entry">
                <small>{new Date(log.timestamp).toLocaleTimeString()}</small>
                <span>{log.message}</span>
                {log.data && <pre>{log.data}</pre>}
              </div>
            ))}
          </div>
        </div>

        {existingOrg ? (
          <div className="existing-org-section">
            <h2>Continue with existing organization?</h2>
            <div className="existing-org-card">
              <h3>{existingOrg.name}</h3>
              <p>{existingOrg.industry} • {existingOrg.competitors?.length || 0} competitors tracked</p>
              <div className="org-actions">
                <button 
                  onClick={handleContinueWithExisting}
                  className="submit-button"
                >
                  Continue Analysis
                </button>
                <button 
                  onClick={handleStartNewSearch}
                  className="secondary-button"
                >
                  Start New Organization
                </button>
              </div>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="orgName">Organization Name *</label>
            <input
              type="text"
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g., OpenAI, Tesla, Microsoft"
              required
              autoFocus
            />
            <div className="helper-text">Enter the name of the organization you want to monitor</div>
          </div>

          <div className="form-group">
            <label htmlFor="orgUrl">Website (optional)</label>
            <input
              type="url"
              id="orgUrl"
              value={orgUrl}
              onChange={(e) => setOrgUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <div className="helper-text">We'll discover this automatically if not provided</div>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={!orgName.trim() || isProcessing}
          >
            {isProcessing ? 'Discovering Organization...' : 'Start Deep Intelligence Analysis'}
          </button>

          {isProcessing && (
            <div className="processing">
              <div className="processing-spinner"></div>
              <span className="processing-text">Running Claude discovery...</span>
            </div>
          )}
        </form>
        )}
      </div>
    </div>
  );
};

export default OnboardingV3;