import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleOrgInit = () => {
  const [orgName, setOrgName] = useState('');
  const [orgUrl, setOrgUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!orgName.trim()) {
      alert('Please enter an organization name');
      return;
    }

    setIsProcessing(true);
    console.log('🚀 Starting with simple org data:', { name: orgName, url: orgUrl });

    // Create minimal org object
    const organization = {
      id: orgName.toLowerCase().replace(/\s+/g, '-'),
      name: orgName.trim(),
      url: orgUrl.trim() || `https://${orgName.toLowerCase().replace(/\s+/g, '')}.com`,
      industry: 'Technology', // Default industry
      description: `${orgName} organization`,
      competitors: [], // Empty arrays - discovery will populate these
      regulators: [],
      media_outlets: [],
      investors: [],
      analysts: [],
      keywords: [orgName],
      monitoring_topics: []
    };

    // Save to localStorage
    localStorage.setItem('selectedOrganization', orgName);
    localStorage.setItem('organizationData', JSON.stringify(organization));
    localStorage.setItem('organizationProfile', JSON.stringify(organization));
    
    console.log('✅ Organization saved to localStorage:', organization);

    // CRITICAL: Save to edge function with correct structure so pipeline can find it
    try {
      const response = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0'
          },
          body: JSON.stringify({
            action: 'saveProfile',
            organization_name: orgName.trim(),
            profile: {
              organization: organization
            }
          })
        }
      );
      
      if (response.ok) {
        console.log('✅ Organization saved to edge function database');
      } else {
        console.warn('⚠️ Could not save to edge function, continuing with localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Edge function save failed, continuing:', error);
    }

    // Navigate to main app which will start the pipeline
    setTimeout(() => {
      navigate('/railway');
    }, 100);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          SignalDesk Intelligence
        </h1>
        <p style={{
          opacity: 0.8,
          marginBottom: '2rem',
          fontSize: '0.95rem'
        }}>
          Enter your organization details to start intelligence gathering
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            opacity: 0.9
          }}>
            Organization Name *
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g., Meta, Google, Apple"
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            opacity: 0.9
          }}>
            Website URL (optional)
          </label>
          <input
            type="text"
            value={orgUrl}
            onChange={(e) => setOrgUrl(e.target.value)}
            placeholder="e.g., https://meta.com"
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          />
        </div>

        <button
          onClick={handleStart}
          disabled={isProcessing || !orgName.trim()}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: '8px',
            border: 'none',
            background: isProcessing || !orgName.trim() 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isProcessing || !orgName.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            opacity: isProcessing || !orgName.trim() ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isProcessing && orgName.trim()) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {isProcessing ? 'Starting Intelligence Pipeline...' : 'Start Intelligence Gathering'}
        </button>

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.8rem',
          opacity: 0.6,
          textAlign: 'center'
        }}>
          The intelligence pipeline will discover competitors, stakeholders, and insights automatically
        </p>
      </div>
    </div>
  );
};

export default SimpleOrgInit;