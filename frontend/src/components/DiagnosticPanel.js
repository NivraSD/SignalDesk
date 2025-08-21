import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const DiagnosticPanel = () => {
  const [diagnostics, setDiagnostics] = useState({
    environment: {},
    supabase: {},
    localStorage: {},
    orchestrator: {},
    apiTests: {},
    lastOrchestrationCall: null
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or with debug flag
    const showDebug = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('signaldesk_debug') === 'true' ||
                     window.location.search.includes('debug=true');
    setIsVisible(showDebug);
    
    if (showDebug) {
      runDiagnostics();
    }
  }, []);

  const runDiagnostics = async () => {
    const diag = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
        SUPABASE_KEY_LENGTH: process.env.REACT_APP_SUPABASE_ANON_KEY?.length,
        SUPABASE_KEY_PREFIX: process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 30),
        BUILD_TIME: process.env.REACT_APP_BUILD_TIME || 'unknown',
        VERCEL_ENV: process.env.VERCEL_ENV || 'not-vercel'
      },
      supabase: {
        configured: !!supabase,
        url: supabase?.supabaseUrl,
        hasAuth: !!supabase?.auth,
        hasRealtime: !!supabase?.realtime
      },
      localStorage: {
        use_orchestrator: localStorage.getItem('signaldesk_use_orchestrator'),
        minimal_mode: localStorage.getItem('signaldesk_minimal'),
        cached_keys: Object.keys(localStorage).filter(k => k.startsWith('signaldesk_')).length
      },
      orchestrator: {
        mode: localStorage.getItem('signaldesk_use_orchestrator') !== 'false' ? 'enabled' : 'disabled',
        expected_flow: localStorage.getItem('signaldesk_use_orchestrator') !== 'false' ? 
                       '4-phase orchestration' : 'multi-step with personas'
      },
      apiTests: {}
    };

    // Test Supabase connection
    try {
      const testUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/test-secrets`;
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const data = await response.json();
        diag.apiTests.secrets = {
          status: 'success',
          hasAnthropicKey: data.anthropic_key?.exists,
          anthropicKeyLength: data.anthropic_key?.length
        };
      } else {
        diag.apiTests.secrets = {
          status: 'failed',
          error: `HTTP ${response.status}`,
          message: await response.text()
        };
      }
    } catch (error) {
      diag.apiTests.secrets = {
        status: 'error',
        error: error.message
      };
    }

    // Test discovery function
    try {
      const discoveryUrl = `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/intelligent-discovery`;
      const response = await fetch(discoveryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          organization: 'Test',
          industry_hint: 'technology'
        })
      });
      
      diag.apiTests.discovery = {
        status: response.ok ? 'success' : 'failed',
        httpStatus: response.status
      };
    } catch (error) {
      diag.apiTests.discovery = {
        status: 'error',
        error: error.message
      };
    }

    setDiagnostics(diag);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 400,
      maxHeight: 600,
      overflow: 'auto',
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#0f0',
      padding: 15,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 12,
      zIndex: 99999,
      border: '1px solid #0f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ margin: 0, color: '#0f0' }}>🔧 Diagnostics</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', color: '#0f0', cursor: 'pointer' }}
        >✕</button>
      </div>
      
      <div style={{ marginBottom: 10 }}>
        <button 
          onClick={runDiagnostics}
          style={{ 
            background: '#0f0', 
            color: '#000', 
            border: 'none', 
            padding: '5px 10px',
            cursor: 'pointer',
            marginRight: 10
          }}
        >Refresh</button>
        <button 
          onClick={() => {
            localStorage.setItem('signaldesk_use_orchestrator', 
              localStorage.getItem('signaldesk_use_orchestrator') === 'false' ? 'true' : 'false'
            );
            runDiagnostics();
          }}
          style={{ 
            background: '#ff0', 
            color: '#000', 
            border: 'none', 
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >Toggle Orchestrator</button>
      </div>

      <pre style={{ margin: 0, color: '#0f0' }}>
{JSON.stringify(diagnostics, null, 2)}
      </pre>

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #0f0' }}>
        <small>
          Mode: {diagnostics.orchestrator.mode}<br/>
          Flow: {diagnostics.orchestrator.expected_flow}<br/>
          To toggle: Click button above or set localStorage
        </small>
      </div>
    </div>
  );
};

export default DiagnosticPanel;