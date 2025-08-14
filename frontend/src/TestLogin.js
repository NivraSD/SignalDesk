import React, { useState } from 'react';
import { supabase } from './config/supabase';

export default function TestLogin() {
  const [status, setStatus] = useState('Ready to test login');
  const [user, setUser] = useState(null);

  const testLogin = async () => {
    setStatus('Testing login...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin2@signaldesk.com',
        password: 'admin123'
      });

      if (error) {
        setStatus(`❌ Error: ${error.message}`);
        return;
      }

      setStatus('✅ Login successful!');
      setUser(data.user);
      console.log('Login successful:', data);
      
    } catch (err) {
      setStatus(`❌ Exception: ${err.message}`);
    }
  };

  const testLogout = async () => {
    try {
      await supabase.auth.signOut();
      setStatus('Logged out');
      setUser(null);
    } catch (err) {
      setStatus(`Logout error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Supabase Login Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>

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