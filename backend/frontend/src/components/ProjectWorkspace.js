import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProject } from "../contexts/ProjectContext";
import API_BASE_URL from '../config/api';
import {
  Bot,
  FileText,
  Users,
  Brain,
  Archive,
  Activity,
  AlertTriangle,
  FileOutput,
  Settings,
  Home,
  ArrowLeft,
  Sparkles,
  FolderOpen,
  TrendingUp,
  Calendar,
} from "lucide-react";

const ProjectWorkspace = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeProject, selectProject, projects } = useProject();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContent: 0,
    recentActivity: 0,
    aiScore: 0,
  });

  useEffect(() => {
    // Find and set the active project
    const currentProject = projects.find((p) => p.id === parseInt(projectId));
    if (currentProject) {
      selectProject(currentProject);
      fetchProjectStats();
    } else if (projects.length > 0) {
      // Project not found
      navigate("/projects");
    }
    setLoading(false);
  }, [projectId, projects]);

  const fetchProjectStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching project stats:", error);
    }
  };

  const features = [
    {
      title: "AI Assistant",
      path: `/projects/${projectId}/ai-assistant`,
      icon: Bot,
      color: "#007bff",
      desc: "Get AI-powered PR advice for this project",
      stats: "Ask anything",
    },
    {
      title: "Content Generator",
      path: `/projects/${projectId}/content-generator`,
      icon: FileText,
      color: "#28a745",
      desc: "Create project-specific content",
      stats: "Generate & save",
    },
    {
      title: "Media List Builder",
      path: `/projects/${projectId}/media-list`,
      icon: Users,
      color: "#17a2b8",
      desc: "Manage project media contacts",
      stats: "Build lists",
    },
    {
      title: "Campaign Intelligence",
      path: `/projects/${projectId}/campaign-intelligence`,
      icon: Brain,
      color: "#ffc107",
      desc: "Strategic campaign planning",
      stats: "Plan campaigns",
    },
    {
      title: "MemoryVault",
      path: `/projects/${projectId}/memory-vault`,
      icon: Archive,
      color: "#6f42c1",
      desc: "Project knowledge base",
      stats: `${stats.totalContent} items`,
    },
    {
      title: "Crisis Command",
      path: `/projects/${projectId}/crisis-command`,
      icon: AlertTriangle,
      color: "#dc3545",
      desc: "Crisis management hub",
      stats: "Manage crises",
    },
    {
      title: "AI Monitoring",
      path: `/projects/${projectId}/monitoring`,
      icon: Activity,
      color: "#00bcd4",
      desc: "Project sentiment tracking",
      stats: "Monitor & analyze",
    },
    {
      title: "Reports",
      path: `/projects/${projectId}/reports`,
      icon: FileOutput,
      color: "#ff6b6b",
      desc: "Project analytics & reports",
      stats: "View insights",
    },
  ];

  if (loading || !activeProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Project Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/projects"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to projects"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {activeProject.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {activeProject.campaign || activeProject.industry} • Created{" "}
                    {new Date(activeProject.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
              <Link
                to={`/projects/${projectId}/settings`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Project settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Project Stats Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Content</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalContent}
                  </p>
                </div>
                <Archive className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.recentActivity}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.aiScore}%
                  </p>
                </div>
                <Sparkles className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(
                      activeProject.updated_at || activeProject.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Project Features</h2>
          <p className="text-gray-600 mt-1">
            All features are tailored to this project and auto-save to
            MemoryVault
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.path}
                to={feature.path}
                className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: feature.color }}
                      />
                    </div>
                    {feature.title === "MemoryVault" && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Central Hub
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{feature.desc}</p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: feature.color }}
                  >
                    {feature.stats}
                  </p>
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${feature.color}, ${feature.color}dd)`,
                  }}
                />
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                All content generated in any feature is automatically saved to
                your project's MemoryVault
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                The AI Assistant has full context of your project and can help
                with any feature
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Archive className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Visit MemoryVault to browse, search, and organize all your
                project content
              </p>
            </div>
            <div className="flex items-start gap-2">
              <FileOutput className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Generate comprehensive reports that pull from all your project
                data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
