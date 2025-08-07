import React, { useState, useEffect } from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useProject } from "../../contexts/ProjectContext";
import FloatingAIAssistant from "../FloatingAIAssistant";
import {
  Bot,
  Home,
  FolderOpen,
  Brain,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Menu,
  X,
  Plus,
  Activity,
  Archive,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";

const Layout = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { activeProject, selectProject, projects } = useProject();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load project when projectId changes
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === parseInt(projectId));
      if (project) {
        selectProject(project);
      }
    } else {
      selectProject(null);
    }
  }, [projectId, projects, selectProject]);

  // Check if we're on a project page or projects list
  const isProjectsPage = location.pathname === "/projects";
  const isInProject = !!projectId;

  // Project navigation items - for when inside a project
  const projectNavItems = [
    {
      path: `/projects/${projectId}`,
      label: "MemoryVault",
      icon: Archive,
      description: "Project content hub",
    },
    {
      path: `/projects/${projectId}/ai-assistant`,
      label: "AI Assistant",
      icon: Bot,
      description: "Chat with AI",
    },
    {
      path: `/projects/${projectId}/content-generator`,
      label: "Content Generator",
      icon: FileText,
      description: "Create content",
    },
    {
      path: `/projects/${projectId}/media-list`,
      label: "Media List Builder",
      icon: Users,
      description: "Media contacts",
    },
    {
      path: `/projects/${projectId}/campaign-intelligence`,
      label: "Campaign Intel",
      icon: Brain,
      description: "Strategic insights",
    },
    {
      path: `/projects/${projectId}/stakeholder-intelligence`,
      label: "Opportunity Engine",
      icon: TrendingUp,
      description: "Intelligence monitoring & opportunity discovery",
    },
    {
      path: `/projects/${projectId}/crisis-command`,
      label: "Crisis Command",
      icon: AlertTriangle,
      description: "Crisis management",
    },
    {
      path: `/projects/${projectId}/reports`,
      label: "Reports",
      icon: BarChart3,
      description: "Analytics",
    },
  ];

  // Global navigation items - for projects list page
  const globalNavItems = [
    {
      path: "/",
      label: "Home",
      icon: Home,
      description: "Dashboard",
    },
    {
      path: "/projects",
      label: "Projects",
      icon: FolderOpen,
      description: "All projects",
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Performance",
    },
  ];

  const navItems = isInProject ? projectNavItems : globalNavItems;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Desktop Sidebar - Always 260px */}
      <aside
        style={{
          backgroundColor: "#1a1d23",
          width: "260px",
          minWidth: "260px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 40,
        }}
        className={mobileSidebarOpen ? "sidebar open" : "sidebar"}
      >
        {/* Sidebar Header */}
        <div
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "transparent",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "white",
            }}
          >
            <Bot style={{ width: "32px", height: "32px", color: "white" }} />
            <span
              style={{
                color: "white",
                fontSize: "24px",
                fontWeight: "bold",
                letterSpacing: "0.5px",
              }}
            >
              SignalDesk
            </span>
          </button>
        </div>

        {/* Back to Projects button when inside a project */}
        {isInProject && activeProject && (
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <button
              onClick={() => navigate("/projects")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "10px 16px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#e0e7ff",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              Back to Projects
            </button>
            <div style={{ marginTop: "12px" }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  margin: "0 0 4px 0",
                }}
              >
                Current Project
              </p>
              <p
                style={{
                  fontSize: "16px",
                  color: "white",
                  fontWeight: "500",
                  margin: 0,
                }}
              >
                {activeProject.name}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "10px 16px",
                  marginBottom: "4px",
                  backgroundColor: isActive
                    ? "rgba(139, 92, 246, 0.2)"
                    : "transparent",
                  border: "none",
                  borderRadius: "8px",
                  color: isActive ? "white" : "rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  }
                }}
              >
                <Icon
                  style={{ width: "20px", height: "20px", flexShrink: 0 }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#8b5cf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {user?.name?.charAt(0) || "U"}
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {user?.name || "User"}
              </p>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: "12px" }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Only show on mobile */}
      <div className="mobile-header" style={{ display: "none" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
            backgroundColor: "white",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            <Bot style={{ width: "32px", height: "32px", color: "#8b5cf6" }} />
            <span style={{ fontWeight: "bold", fontSize: "20px" }}>
              SignalDesk
            </span>
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            style={{
              padding: "8px",
              color: "#6b7280",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            {mobileSidebarOpen ? (
              <X style={{ width: "24px", height: "24px" }} />
            ) : (
              <Menu style={{ width: "24px", height: "24px" }} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 30,
            display: "block",
          }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content - Takes remaining space */}
      <main
        style={{
          flex: 1,
          width: "calc(100vw - 260px)",
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#f9fafb",
          position: "relative",
        }}
      >
        <Outlet />
      </main>

      {/* Floating AI Assistant */}
      <FloatingAIAssistant />

      {/* Add responsive styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 1024px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 50;
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          main {
            width: 100vw !important;
            margin-left: 0 !important;
          }
          
          .mobile-header {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 40;
          }
          
          main {
            padding-top: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
