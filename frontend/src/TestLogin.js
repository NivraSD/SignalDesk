import React, { useState } from 'react';
import { supabase } from './config/supabase';

const TestLogin = () => {
  const [email, setEmail] = useState('admin@signaldesk.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      // Success!
      setUser(data.user);
      setSuccess(`Login successful! User ID: ${data.user.id}`);
      
      // Try to fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*, organization:organizations(*)')
        .eq('id', data.user.id)
        .single();
      
      if (!profileError && profile) {
        setSuccess(prev => `${prev}\nProfile: ${profile.username} (${profile.role})`);
      }
      
      console.log('Login successful:', data);
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSuccess('Logged out successfully');
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (user) {
        setUser(user);
        setSuccess(`Current user: ${user.email}`);
      } else {
        setError('No user logged in');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '500px', 
      margin: '50px auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Supabase Auth Test</h1>
      
      {/* Status Messages */}
      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#fee', 
          color: '#c00', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          padding: '10px', 
          background: '#efe', 
          color: '#080', 
          borderRadius: '5px',
          marginBottom: '20px',
          whiteSpace: 'pre-line'
        }}>
          ✅ {success}
        </div>
      )}

      {/* Login Form */}
      {!user ? (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              disabled={loading}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{ 
              padding: '10px 20px',
              background: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {loading ? 'Loading...' : 'Test Login'}
          </button>
          
          <button
            type="button"
            onClick={checkUser}
            disabled={loading}
            style={{ 
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Check Current User
          </button>
        </form>
      ) : (
        <div>
          <h3>Logged In User:</h3>
          <p>Email: {user.email}</p>
          <p>ID: {user.id}</p>
          <button
            onClick={handleLogout}
            disabled={loading}
            style={{ 
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? 'Loading...' : 'Logout'}
          </button>
        </div>
      )}

      {/* Debug Info */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#f5f5f5',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <h4>Configuration:</h4>
        <p>Supabase URL: {process.env.REACT_APP_SUPABASE_URL || 'NOT SET'}</p>
        <p>Anon Key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not Set'}</p>
      </div>
    </div>
  );
};

export default TestLogin;