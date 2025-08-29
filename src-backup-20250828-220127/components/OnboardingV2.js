import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingV2.css';

/**
 * ONBOARDING V2 - BULLETPROOF
 * Just get the org name and GO
 * Everything else is discovered automatically
 */

const OnboardingV2 = () => {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [orgUrl, setOrgUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [existingOrg, setExistingOrg] = useState(null);
  
  // Check for existing organization on mount
  useEffect(() => {
    const savedOrg = localStorage.getItem('organization');
    if (savedOrg) {
      try {
        const org = JSON.parse(savedOrg);
        if (org && org.name) {
          setExistingOrg(org);
        }
      } catch (e) {
        // Invalid org data, clear it
        localStorage.removeItem('organization');
      }
    }
  }, []); // Empty dependency array - only run once

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsProcessing(true);
    
    // CRITICAL: Clear ALL old data first
    console.log('🧹 Clearing all previous data...');
    
    // Clear localStorage
    const keysToRemove = [
      'organization',
      'organizationName',
      'intelligenceCache',
      'opportunityCache',
      'analysisCache',
      'stageResults',
      'currentIntelligence',
      'cachedResults',
      'intelligence_data',
      'opportunity_data',
      'stakeholders',
      'competitors',
      'media_data',
      'regulatory_data',
      'synthesis_data'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  ❌ Removed: ${key}`);
    });
    
    // Clear sessionStorage too
    sessionStorage.clear();
    
    // Clear any window-level caches
    if (typeof window !== 'undefined') {
      window.__SIGNALDESK_INTELLIGENCE__ = null;
      window.__SIGNALDESK_CACHE__ = null;
      window.__ORGANIZATION_DATA__ = null;
    }
    
    console.log('✅ All caches cleared');
    
    // Call Claude to discover everything about this organization
    console.log('🔍 Discovering organization details...');
    
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
      
      // Using simplified Claude discovery for real organization data
      const response = await fetch(`${supabaseUrl}/functions/v1/claude-discovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          organizationName: orgName.trim(),
          url: orgUrl.trim()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.organization) {
          console.log('✅ Organization discovered:', result.organization);
          
          // Save the DISCOVERED organization with real data
          localStorage.setItem('organization', JSON.stringify(result.organization));
          localStorage.setItem('organizationName', orgName);
          localStorage.setItem('hasCompletedOnboarding', 'true');
          
          setTimeout(() => {
            navigate('/railway');
          }, 500);
          return;
        }
      }
    } catch (error) {
      console.error('Discovery failed:', error);
      alert('Failed to analyze organization. Please try again.');
      setIsProcessing(false);
      return; // STOP HERE - don't use fallback data
    }
  };

  const handleContinueWithExisting = () => {
    navigate('/railway');
  };

  const handleStartNewSearch = () => {
    // Clear ALL data and start fresh
    localStorage.clear();
    sessionStorage.clear();
    setExistingOrg(null);
  };

  return (
    <div className="onboarding-v2">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Welcome to SignalDesk</h1>
          <p>Elite PR Intelligence Platform</p>
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
            {isProcessing ? 'Setting up...' : 'Start Deep Intelligence Analysis'}
          </button>

          {isProcessing && (
            <div className="processing">
              <div className="processing-spinner"></div>
              <span className="processing-text">Initializing intelligence pipeline...</span>
            </div>
          )}

          <div className="advanced-section">
            <div className="advanced-title">Advanced Options (Coming Soon)</div>
            <div className="fake-buttons">
              <div className="fake-button">Import Stakeholders</div>
              <div className="fake-button">Custom Keywords</div>
              <div className="fake-button">Alert Settings</div>
              <div className="fake-button">Team Access</div>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default OnboardingV2;