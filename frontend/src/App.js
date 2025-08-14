import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { IntelligenceProvider } from "./context/IntelligenceContext";
import Dashboard from "./components/Dashboard";
import AIAssistant from "./components/AIAssistant";
import ContentGenerator from "./components/ContentGenerator";
import CrisisCommandCenter from "./components/CrisisCommandCenter";
// import MediaListBuilder from "./components/MediaListBuilder"; // OLD - Basic journalist search
import MediaIntelligence from "./components/MediaIntelligence"; // NEW - Full intelligence platform
import CampaignIntelligence from "./components/CampaignIntelligence";
import EnhancedCampaignIntelligenceFixed from "./components/EnhancedCampaignIntelligenceFixed"; // Fixed enhanced version
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
import EnvDebug from "./components/EnvDebug";

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
          path="campaign-intelligence"
          element={<CampaignIntelligence />}
        />
        <Route
          path="campaign-intelligence-enhanced"
          element={<EnhancedCampaignIntelligenceFixed />}
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
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <IntelligenceProvider>
            <AppRoutes />
            <EnvDebug />
          </IntelligenceProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
// Force Vercel rebuild - Media Intelligence Platform deployed Sat Aug  9 14:27:00 EDT 2025
