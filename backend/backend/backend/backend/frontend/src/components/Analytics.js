import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../contexts/ProjectContext";
import { Bot, Search, Briefcase /* other icons */ } from "lucide-react";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  Award,
  Clock,
} from "lucide-react";

const Analytics = () => {
  const navigate = useNavigate();
  const { projects } = useProject();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [selectedProject, setSelectedProject] = useState("all");
  const [loading, setLoading] = useState(true);

  // Simulated analytics data
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalProjects: 0,
      totalContent: 0,
      mediaContacts: 0,
      campaignsActive: 0,
    },
    performance: {
      contentCreated: { value: 0, change: 0 },
      projectsActive: { value: 0, change: 0 },
      aiInteractions: { value: 0, change: 0 },
      timesSaved: { value: 0, change: 0 },
    },
    recentActivity: [],
    topProjects: [],
  });

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData({
        overview: {
          totalProjects: projects.length || 12,
          totalContent: 247,
          mediaContacts: 1842,
          campaignsActive: 8,
        },
        performance: {
          contentCreated: { value: 47, change: 12.5 },
          projectsActive: { value: 8, change: -5.2 },
          aiInteractions: { value: 312, change: 28.7 },
          timesSaved: { value: 18.5, change: 15.3 },
        },
        recentActivity: [
          {
            type: "content",
            project: "TechCorp Launch",
            action: "Press release created",
            time: "2 hours ago",
          },
          {
            type: "media",
            project: "HealthTech PR",
            action: "Media list updated",
            time: "5 hours ago",
          },
          {
            type: "ai",
            project: "FinanceHub Rebrand",
            action: "AI research completed",
            time: "1 day ago",
          },
          {
            type: "campaign",
            project: "RetailMax Crisis",
            action: "Campaign launched",
            time: "2 days ago",
          },
        ],
        topProjects: projects.slice(0, 5).map((project, index) => ({
          ...project,
          contentCount: Math.floor(Math.random() * 50) + 10,
          engagement: Math.floor(Math.random() * 100),
        })),
      });
      setLoading(false);
    }, 1000);
  }, [projects]);

  const StatCard = ({ icon: Icon, title, value, change, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center text-sm ${
              change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change >= 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
            <span className="ml-1">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Track your PR performance and productivity
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="year">This year</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Briefcase}
          title="Total Projects"
          value={analyticsData.overview.totalProjects}
          color="bg-blue-600"
        />
        <StatCard
          icon={FileText}
          title="Content Created"
          value={analyticsData.overview.totalContent}
          color="bg-green-600"
        />
        <StatCard
          icon={Users}
          title="Media Contacts"
          value={analyticsData.overview.mediaContacts.toLocaleString()}
          color="bg-purple-600"
        />
        <StatCard
          icon={Target}
          title="Active Campaigns"
          value={analyticsData.overview.campaignsActive}
          color="bg-orange-600"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Content Created</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900">
                  {analyticsData.performance.contentCreated.value}
                </span>
                <span
                  className={`text-sm flex items-center ${
                    analyticsData.performance.contentCreated.change >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.performance.contentCreated.change >= 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {Math.abs(analyticsData.performance.contentCreated.change)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Projects Active</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900">
                  {analyticsData.performance.projectsActive.value}
                </span>
                <span
                  className={`text-sm flex items-center ${
                    analyticsData.performance.projectsActive.change >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.performance.projectsActive.change >= 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {Math.abs(analyticsData.performance.projectsActive.change)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">AI Interactions</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900">
                  {analyticsData.performance.aiInteractions.value}
                </span>
                <span
                  className={`text-sm flex items-center ${
                    analyticsData.performance.aiInteractions.change >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.performance.aiInteractions.change >= 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {Math.abs(analyticsData.performance.aiInteractions.change)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Hours Saved</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900">
                  {analyticsData.performance.timesSaved.value}h
                </span>
                <span
                  className={`text-sm flex items-center ${
                    analyticsData.performance.timesSaved.change >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.performance.timesSaved.change >= 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {Math.abs(analyticsData.performance.timesSaved.change)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    activity.type === "content"
                      ? "bg-blue-100"
                      : activity.type === "media"
                      ? "bg-purple-100"
                      : activity.type === "ai"
                      ? "bg-green-100"
                      : "bg-orange-100"
                  }`}
                >
                  {activity.type === "content" ? (
                    <FileText className="w-4 h-4 text-blue-600" />
                  ) : activity.type === "media" ? (
                    <Users className="w-4 h-4 text-purple-600" />
                  ) : activity.type === "ai" ? (
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Target className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.project}
                  </p>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Projects */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Projects by Activity
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Project
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Campaign
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                  Content
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                  Engagement
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topProjects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {project.name}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {project.campaign || "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-gray-900">
                      {project.contentCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.engagement}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {project.engagement}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        project.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {project.status || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
