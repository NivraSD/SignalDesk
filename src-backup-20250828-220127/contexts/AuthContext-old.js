import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, signIn, signOut, getCurrentUser } from '../config/supabase-simple';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setToken(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setToken(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setToken(session.access_token);
      }
    } catch (err) {
      console.error("[Auth] Auth check failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      
      const result = await signIn(email, password);
      
      // Store user info
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        setUser(result.user);
      }
      
      if (result.session) {
        setToken(result.session.access_token);
        localStorage.setItem("token", result.session.access_token);
      }
      

      // Navigate to dashboard
      navigate("/dashboard");

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || "Invalid email or password";
      console.error('[Auth] Login error:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Clear state
      setUser(null);
      setToken(null);

      // Navigate to login
      navigate("/login");
    } catch (err) {
      console.error('[Auth] Logout error:', err.message);
    }
  };

  const value = {
    user,
    token, // Now exposing token
    login,
    logout,
    loading,
    error,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
