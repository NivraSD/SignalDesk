import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../config/supabase';

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
  const [token, setToken] = useState(null); // For compatibility
  const navigate = useNavigate();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      console.log('[Auth] Attempting Supabase login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Supabase login error:', error);
        throw error;
      }

      console.log('[Auth] Supabase login successful');
      
      // Navigate based on App.js routes
      navigate("/projects/demo-project");
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || "Login failed";
      console.error('[Auth] Login error:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setToken(null);
    navigate("/login");
  };

  const isAuthenticated = useCallback(() => {
    return !!session;
  }, [session]);

  const value = {
    user,
    session,
    token,
    login,
    logout,
    loading,
    error,
    isAuthenticated,
    checkAuth: () => {} // For compatibility
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};