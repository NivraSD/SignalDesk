import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

export default function TestLogin() {
  const [status, setStatus] = useState('Ready to test login');
  const { login, logout, user, error } = useAuth();

  const testLogin = async () => {
    setStatus('Testing login...');
    
    try {
      const result = await login('admin2@signaldesk.com', 'admin123');

      if (result.success) {
        setStatus('✅ Login successful!');
        console.log('Login successful:', result);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
      
    } catch (err) {
      setStatus(`❌ Exception: ${err.message}`);
    }
  };

  const testLogout = async () => {
    try {
      await logout();
      setStatus('Logged out');
    } catch (err) {
      setStatus(`Logout error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>AuthContext Login Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!user ? (
        <button onClick={testLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Test Login (admin2@signaldesk.com)
        </button>
      ) : (
        <div>
          <h3>✅ Logged in successfully!</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user.id}</p>
          <button onClick={testLogout} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Logout
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', background: '#f5f5f5', padding: '15px' }}>
        <h4>Environment Check:</h4>
        <p>Supabase URL: {process.env.REACT_APP_SUPABASE_URL || 'NOT SET'}</p>
        <p>Supabase Key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not Set'}</p>
      </div>
    </div>
  );
}