import React, { useState } from 'react';
import './QuickInit.css';

/**
 * QuickInit - Simple, reliable company initialization
 * This component ensures the company name is properly captured and passed through the discovery pipeline
 */
const QuickInit = ({ onComplete }) => {
  const [companyName, setCompanyName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [discoveryData, setDiscoveryData] = useState(null);

  // Supabase configuration
  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
  const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    setIsProcessing(true);
    setStatus('Initializing discovery pipeline...');
    
    const trimmedName = companyName.trim();
    console.log(`🚀 QuickInit: Starting discovery for "${trimmedName}"`);

    try {
      // Step 1: Save to localStorage FIRST
      const organizationData = {
        name: trimmedName,
        id: trimmedName.toLowerCase().replace(/\s+/g, '-'),
        industry: 'Technology', // Will be updated by discovery
        competitors: [],
        stakeholders: {},
        keywords: [trimmedName],
        created_at: new Date().toISOString()
      };

      localStorage.setItem('selectedOrganization', trimmedName);
      localStorage.setItem('organizationData', JSON.stringify(organizationData));
      console.log('✅ Saved to localStorage:', trimmedName);

      // Step 2: Save to edge function persistence FIRST (so pipeline can find it)
      setStatus('Saving organization profile...');
      console.log('💾 Saving to intelligence-persistence with correct structure');
      
      const persistResponse = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          action: 'saveProfile',
          organization_name: trimmedName,
          profile: { 
            organization: organizationData
          }
        })
      });

      if (!persistResponse.ok) {
        console.warn('⚠️ Could not save to persistence, continuing...');
      } else {
        console.log('✅ Saved to edge function persistence');
      }

      // Step 3: Call intelligence-discovery-v3 edge function
      setStatus('Calling discovery pipeline...');
      console.log('📡 Calling intelligence-discovery-v3 with company:', trimmedName);
      
      const discoveryResponse = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-discovery-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organization: {
            name: trimmedName,
            ...organizationData
          },
          config: {
            useCache: false,
            comprehensive: true
          }
        })
      });

      if (!discoveryResponse.ok) {
        throw new Error(`Discovery failed: ${discoveryResponse.status}`);
      }

      const discoveryResult = await discoveryResponse.json();
      console.log('✅ Discovery response:', discoveryResult);
      
      // Extract request_id if available
      if (discoveryResult.request_id) {
        setRequestId(discoveryResult.request_id);
        console.log('📌 Request ID:', discoveryResult.request_id);
      }

      // Step 4: Process discovery results
      console.log('✅ Processing discovery results...');
      
      // Extract the enriched organization data from discovery result
      const completeData = {
        ...organizationData,
        ...discoveryResult.organization,
        competitors: discoveryResult.competitors || [],
        topics: discoveryResult.topics || [],
        keywords: discoveryResult.keywords || [],
        stakeholders: discoveryResult.entities || {},
        intelligence: discoveryResult.intelligence || {},
        request_id: discoveryResult.request_id,
        discovery_timestamp: new Date().toISOString()
      };
      
      console.log('✅ Complete organization data:', completeData);
      setDiscoveryData(completeData);
      
      // Update localStorage with enriched data
      localStorage.setItem('organizationData', JSON.stringify(completeData));
      localStorage.setItem('latestDiscovery', JSON.stringify({
        timestamp: new Date().toISOString(),
        request_id: discoveryResult.request_id,
        company_name: trimmedName,
        data: completeData
      }));

      // Step 5: Update edge function with enriched data
      console.log('💾 Updating edge function with enriched data');
      const updateResponse = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-persistence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          action: 'saveProfile',
          organization_name: trimmedName,
          profile: { 
            organization: completeData
          }
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Edge function updated with enriched data');
      }

      setStatus(`✅ Discovery complete for ${trimmedName}! Request ID: ${discoveryResult.request_id}`);
      
      // Call onComplete callback if provided
      if (onComplete) {
        setTimeout(() => {
          onComplete({
            organization: completeData,
            request_id: discoveryResult.request_id
          });
        }, 1500);
      }

    } catch (error) {
      console.error('❌ Discovery pipeline error:', error);
      setStatus(`Error: ${error.message}`);
      
      // Even on error, ensure basic data is saved
      const fallbackData = {
        name: trimmedName,
        id: trimmedName.toLowerCase().replace(/\s+/g, '-'),
        error: error.message,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('organizationData', JSON.stringify(fallbackData));
      
      if (onComplete) {
        setTimeout(() => {
          onComplete({ organization: fallbackData });
        }, 1500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Test function to verify localStorage
  const testLocalStorage = () => {
    const savedOrg = localStorage.getItem('selectedOrganization');
    const savedData = localStorage.getItem('organizationData');
    console.log('📱 LocalStorage Test:');
    console.log('  selectedOrganization:', savedOrg);
    console.log('  organizationData:', savedData ? JSON.parse(savedData) : null);
    alert(`Saved company: ${savedOrg || 'None'}`);
  };

  return (
    <div className="quick-init-container">
      <div className="quick-init-card">
        <h1>Initialize Company Intelligence</h1>
        <p className="subtitle">Enter your company name to start the discovery pipeline</p>
        
        <form onSubmit={handleSubmit} className="init-form">
          <div className="input-group">
            <label htmlFor="company-name">Company Name</label>
            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Tesla, Microsoft, Toyota"
              disabled={isProcessing}
              className="company-input"
              autoFocus
            />
            <small className="input-hint">
              Enter the exact company name as you want it tracked
            </small>
          </div>

          <button 
            type="submit" 
            disabled={isProcessing || !companyName.trim()}
            className="submit-button"
          >
            {isProcessing ? 'Processing...' : 'Start Discovery'}
          </button>
        </form>

        {status && (
          <div className={`status-message ${status.includes('Error') ? 'error' : ''}`}>
            {status}
          </div>
        )}

        {requestId && (
          <div className="request-info">
            <strong>Request ID:</strong> {requestId}
          </div>
        )}

        {discoveryData && (
          <div className="discovery-preview">
            <h3>Discovery Results</h3>
            <div className="preview-content">
              <p><strong>Company:</strong> {discoveryData.name}</p>
              {discoveryData.industry && (
                <p><strong>Industry:</strong> {discoveryData.industry}</p>
              )}
              {discoveryData.competitors && discoveryData.competitors.length > 0 && (
                <p><strong>Competitors:</strong> {discoveryData.competitors.slice(0, 3).join(', ')}
                  {discoveryData.competitors.length > 3 && ` +${discoveryData.competitors.length - 3} more`}
                </p>
              )}
              {discoveryData.description && (
                <p><strong>Description:</strong> {discoveryData.description}</p>
              )}
              {discoveryData.topics && discoveryData.topics.length > 0 && (
                <p><strong>Key Topics:</strong> {discoveryData.topics.slice(0, 3).join(', ')}
                  {discoveryData.topics.length > 3 && ` +${discoveryData.topics.length - 3} more`}
                </p>
              )}
              {discoveryData.keywords && discoveryData.keywords.length > 0 && (
                <p><strong>Keywords:</strong> {discoveryData.keywords.slice(0, 5).join(', ')}
                  {discoveryData.keywords.length > 5 && ` +${discoveryData.keywords.length - 5} more`}
                </p>
              )}
            </div>
          </div>
        )}

        <button 
          onClick={testLocalStorage}
          className="test-button"
          type="button"
        >
          Test LocalStorage
        </button>
      </div>
    </div>
  );
};

export default QuickInit;