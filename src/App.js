import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { IntelligenceProvider } from "./context/IntelligenceContext";
import { supabase } from "./config/supabase"; // Force Supabase to be included
import { migrateToUnifiedProfile } from "./utils/migrateProfile"; // Auto-migrate existing data
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

// New Railway V2 with Neon Effects
import RailwayV2Enhanced from "./components/RailwayV2Enhanced";
import SystemInitializer from "./components/SystemInitializer";
import SmartOnboarding from "./components/SmartOnboarding";

// DEPLOYMENT MARKER - V3 ONLY
console.log("🚨 DEPLOYMENT: 2025-08-24 23:26:07 | COMMIT: d6943be3a | NO FALLBACKS - V3 ONLY");

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
  // BRAND NEW RailwayV2 with Neon Effects and Intelligence
  console.log("⚡⚡⚡ RAILWAY V2 NEON INTERFACE v3.1.0 - DEPLOYED:", new Date().toISOString());
  console.log("🎯 Modern Railway design with neon buttons");
  console.log("💎 Intelligence Hub with practical insights");
  console.log("📍 Deployed from ROOT directory - Fixed Aug 24, 2024");
  console.log("🚀 VERSION 0.2.0 - Firecrawl Integration Active");
  console.log("📅 Build Date: August 23, 2025");
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <IntelligenceProvider>
            {/* RailwayV2 - Modern Neon Interface */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/initialize" element={<SmartOnboarding />} />
              <Route path="/onboarding" element={<SmartOnboarding />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <RailwayV2Enhanced />
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
// CACHE BUST: RailwayV2 Neon Interface - 2025-08-20T15:00:00Z
// Force rebuild: Sun Aug 24 22:32:41 EDT 2025
// Force deployment Sun Aug 24 23:09:57 EDT 2025
