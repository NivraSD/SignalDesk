import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL, { apiRequest } from '../config/api';

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
  const [token, setToken] = useState(null); // Add token state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Set token state
      setToken(storedToken);

      console.log('[Auth] Verifying stored token...');
      const response = await apiRequest('/auth/verify', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        console.log('[Auth] Token verified successfully');
      } else {
        // Token is invalid, clear it
        console.warn('[Auth] Token verification failed, clearing stored credentials');
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error("[Auth] Auth check failed:", err.message);
      // Don't clear token on network errors - might be temporary
      if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
        console.log('[Auth] Network error during auth check, keeping token for retry');
      } else {
        // Clear invalid token for other errors
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      console.log('[Auth] Attempting login for:', email);
      
      const response = await apiRequest('/auth/login', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || `Login failed (Status: ${response.status})`;
        console.error('[Auth] Login failed:', errorMessage);
        
        // Provide more helpful error messages
        if (response.status === 500) {
          throw new Error("Server error. Please try again in a moment.");
        } else if (response.status === 401) {
          throw new Error("Invalid email or password");
        } else if (response.status === 0 || !response.status) {
          throw new Error("Cannot connect to server. Please check your connection.");
        } else {
          throw new Error(errorMessage);
        }
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Update state
      setToken(data.token);
      setUser(data.user);
      
      console.log('[Auth] Login successful for:', data.user.email);

      // Navigate to dashboard
      navigate("/dashboard");

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || "An unexpected error occurred";
      console.error('[Auth] Login error:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear state
    setUser(null);
    setToken(null);

    // Navigate to login
    navigate("/login");
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
