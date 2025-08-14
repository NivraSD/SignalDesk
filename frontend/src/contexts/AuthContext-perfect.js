import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';

// Supabase client - direct and clean
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  }
);

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session) {
            setSession(session);
            setUser(session.user);
            await loadUserProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Initial session error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    });

    getInitialSession();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Load user profile from database (optional, gracefully handles missing data)
  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        // Profile doesn't exist yet - create basic one or use auth data
        setProfile({
          id: userId,
          email: user?.email,
          username: user?.email?.split('@')[0],
          role: 'admin',
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.log('Profile load error (non-critical):', err.message);
      // Use basic profile from auth data
      setProfile({
        id: userId,
        email: user?.email,
        username: user?.email?.split('@')[0],
        role: 'admin',
        created_at: new Date().toISOString()
      });
    }
  };

  // Create user profile in database if needed
  const createUserProfile = async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          username: userData.email.split('@')[0],
          full_name: userData.user_metadata?.full_name || 'User',
          role: 'admin',
          organization_id: '11111111-1111-1111-1111-111111111111'
        })
        .select()
        .single();

      if (!error) {
        setProfile(data);
      }
    } catch (err) {
      console.log('Profile creation error (non-critical):', err.message);
    }
  };

  // Sign in
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw error;
      }

      // Auth context will handle state updates via onAuthStateChange
      console.log('Login successful for:', email);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      return { success: true, user: data.user, session: data.session };
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Sign up
  const signup = async (email, password, userData = {}) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: userData
        }
      });

      if (error) {
        throw error;
      }

      console.log('Signup successful for:', email);
      return { success: true, user: data.user, session: data.session };
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Navigate to login
      navigate('/login');
      
      console.log('Logout successful');
      
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      setError(null);
      
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: updates
      });

      if (authError) {
        throw authError;
      }

      // Update profile in database
      if (profile?.id) {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', profile.id)
          .select()
          .single();

        if (!error && data) {
          setProfile(data);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!profile) return false;
    
    // Admin has all permissions
    if (profile.role === 'admin') return true;
    
    // Add more role-based permissions as needed
    const rolePermissions = {
      user: ['read'],
      manager: ['read', 'write'],
      admin: ['read', 'write', 'delete', 'manage']
    };
    
    return rolePermissions[profile.role]?.includes(permission) || false;
  };

  // Get organization data
  const getOrganization = () => {
    return profile?.organization || null;
  };

  // Check authentication status
  const isAuthenticated = () => {
    return !!(session && user);
  };

  // Get full user data
  const getUserData = () => {
    return {
      ...user,
      ...profile,
      session,
      isAuthenticated: isAuthenticated(),
      hasPermission,
      organization: getOrganization()
    };
  };

  const value = {
    // State
    user,
    session,
    profile,
    loading,
    error,
    
    // Core methods
    login,
    signup,
    logout,
    
    // Password management
    resetPassword,
    updatePassword,
    
    // Profile management
    updateProfile,
    createUserProfile,
    
    // Utilities
    isAuthenticated,
    hasPermission,
    getOrganization,
    getUserData,
    
    // Direct Supabase access (for advanced features)
    supabase,
    
    // Clear error
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// HOC for protected routes
export const withAuth = (Component, requiredPermission = null) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, hasPermission, loading } = useAuth();
    
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px'
        }}>
          Loading...
        </div>
      );
    }
    
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }
    
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: 'red' 
        }}>
          Access Denied: Insufficient permissions
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

// Hook for protected routes
export const useProtectedRoute = (requiredPermission = null) => {
  const { isAuthenticated, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated()) {
        navigate('/login');
      } else if (requiredPermission && !hasPermission(requiredPermission)) {
        navigate('/unauthorized');
      }
    }
  }, [isAuthenticated, hasPermission, loading, navigate, requiredPermission]);
  
  return { isAuthenticated: isAuthenticated(), hasPermission, loading };
};

export default AuthContext;