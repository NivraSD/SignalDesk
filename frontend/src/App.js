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
import FourModuleLayout from "./components/RailwayUI/FourModuleLayout";

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

// Create a wrapper component for the routes that need auth
function AppRoutes() {
  return (
    <Routes>
      {/* Login route - public */}
      <Route path="/login" element={<Login />} />
      
      {/* Niv - AI PR Strategist (uses Niv-First UI) */}
      <Route path="/niv" element={<RailwayDraggable />} />
      <Route path="/niv-direct" element={<NivDirect />} />

      {/* Homepage route - redirect to projects */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Navigate to="/projects" replace />
          </PrivateRoute>
        }
      />

      {/* Projects route - redirect to demo project */}
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <Navigate to="/projects/demo-project" replace />
          </PrivateRoute>
        }
      />
      
      {/* Create new project - still uses Layout */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      {/* Use RailwayDraggable for main project view - Draggable and resizable UI */}
      <Route
        path="/projects/:projectId"
        element={
          <PrivateRoute>
            <RailwayDraggable />
          </PrivateRoute>
        }
      />
      
      {/* Alternative UI versions for comparison */}
      <Route
        path="/projects/:projectId/unified"
        element={
          <PrivateRoute>
            <UnifiedPlatform />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/projects/:projectId/railway-panels"
        element={
          <PrivateRoute>
            <RailwayPlatform />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/projects/:projectId/canvas"
        element={
          <PrivateRoute>
            <RailwayCanvas />
          </PrivateRoute>
        }
      />
      
      {/* Legacy routes with Layout */}
      <Route
        path="/projects/:projectId/*"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="unified" element={<UnifiedPlatform />} />
        <Route path="memoryvault-old" element={<MemoryVault />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="content-generator" element={<ContentGenerator />} />
        <Route path="media-list" element={<MediaIntelligence />} />
        <Route
          path="strategic-planning"
          element={<StrategicPlanning />}
        />
        <Route
          path="campaign-execution/:campaignId"
          element={<CampaignExecutionDashboard />}
        />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="stakeholder-intelligence" element={<StakeholderIntelligenceHub />} />
        <Route path="crisis-command" element={<CrisisCommandCenter />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<ProjectManagement />} />
      </Route>

      {/* Catch all - redirect to projects */}
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}

function App() {
  // Using new Four-Module Layout as the main interface
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <IntelligenceProvider>
            {/* New Four-Module Layout with Niv Strategic Advisor */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <FourModuleLayout />
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
// CACHE BUST: Adaptive Niv Platform v2.2 - FIX REACT ERROR - Wed Aug 14 16:25:00 EDT 2025
