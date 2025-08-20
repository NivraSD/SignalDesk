import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { IntelligenceProvider } from "./context/IntelligenceContext";
import { supabase } from "./config/supabase"; // Force Supabase to be included
import Dashboard from "./components/Dashboard";
import AIAssistant from "./components/AIAssistant";
import ContentGenerator from "./components/ContentGenerator";
import CrisisCommandCenter from "./components/CrisisCommandCenter";
// import MediaListBuilder from "./components/MediaListBuilder"; // OLD - Basic journalist search
import MediaIntelligence from "./components/MediaIntelligence"; // NEW - Full intelligence platform
import StrategicPlanning from "./components/StrategicPlanning";
import CampaignExecutionDashboard from "./components/CampaignExecutionDashboard";
import UnifiedPlatform from "./components/UnifiedPlatform"; // Restored unified platform
import RailwayPlatform from "./components/RailwayPlatform"; // New Railway UI with proper drag/resize
import RailwayCanvas from "./components/RailwayCanvas"; // True Railway canvas with service nodes
import RailwayActivity from "./components/RailwayActivity"; // Railway-style activity list
import RailwayDraggable from "./components/RailwayDraggable"; // Draggable and resizable UI
import Monitoring from "./components/Monitoring";
import Reports from "./components/Reports";
import ProjectList from "./components/ProjectList";
import Login from "./components/Login";
import ProjectManagement from "./components/ProjectManagement";
import Homepage from "./components/Homepage";
import MemoryVault from "./components/MemoryVault";
import Layout from "./components/Layout/Layout";
import CreateProject from "./components/CreateProject";
import Analytics from "./components/Analytics";
import StakeholderIntelligenceHub from "./components/StakeholderIntelligence/StakeholderIntelligenceHub";
// New Niv-First components
import PlatformModeSwitcher from "./components/PlatformModeSwitcher";
import NivFirstLayout from "./components/NivFirst/NivFirstLayout";
import NivLayoutPOC from "./components/NivFirst/NivLayoutPOC"; // POC with clean architecture
import NivSimple from "./pages/NivSimple"; // Simplified Niv interface
import NivRealtime from "./pages/NivRealtime"; // Realtime artifact system
import NivDatabase from "./pages/NivDatabase"; // Database-driven Niv (no realtime needed)
import NivDirect from "./pages/NivDirect"; // Direct API integration - most reliable

// New Four-Module Layout
// import FourModuleLayout from "./components/RailwayUI/FourModuleLayout";
import SystemInitializer from "./components/SystemInitializer";

// Log Supabase initialization for debugging
console.log('🚀 SignalDesk initialized with Supabase:', supabase ? 'Connected' : 'Not connected');

// Make Supabase available globally for testing
if (typeof window !== 'undefined') {
  window.__SIGNALDESK_SUPABASE__ = supabase;
  window.__SIGNALDESK_CONFIG__ = {
    supabaseConnected: !!supabase,
    buildTime: process.env.REACT_APP_BUILD_TIME,
    buildId: process.env.REACT_APP_BUILD_ID
  };
}

// Private Route component - FIXED to use useAuth hook
function PrivateRoute({ children }) {
  const { token, user, loading } = useAuth();

  // Show loading spinner or placeholder while checking auth
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  // Check both token and user from AuthContext
  return token || user ? children : <Navigate to="/login" />;
}

// AppRoutes function removed - using FourModuleLayout instead

function App() {
  // Using Railway Draggable UI with neon styling
  console.log("🚀🚀🚀 RAILWAY DRAGGABLE UI ACTIVE - DEPLOYED:", new Date().toISOString());
  console.log("✅ This is the Railway-style UI with draggable panels and neon effects");
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <IntelligenceProvider>
            {/* Railway Draggable UI with Niv Integration */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/initialize" element={<SystemInitializer />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <RailwayDraggable />
                  </PrivateRoute>
                }
              />
            </Routes>
          </IntelligenceProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
// CACHE BUST: Railway Draggable UI with Neon Effects - 2025-08-20T14:31:00Z
