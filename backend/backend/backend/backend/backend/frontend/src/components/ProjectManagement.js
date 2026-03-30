import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Calendar,
  DollarSign,
  Target,
  CheckCircle,
  Users,
  BarChart3,
  AlertCircle,
  Clock,
  TrendingUp,
  FileText,
  ChevronRight,
  Play,
  Pause,
  Check,
  X,
  Edit,
  Trash2,
  Plus,
  User,
  Flag,
  Activity,
  Brain,
  Shield,
  Zap,
  Info,
} from "lucide-react";

export default function ProjectManagement() {
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if coming from Campaign Intelligence
    const transition = localStorage.getItem("campaignTransition");

    if (transition === "true") {
      try {
        const projectData = JSON.parse(
          localStorage.getItem("campaignProjectData")
        );
        console.log("Retrieved project data:", projectData);

        // Initialize your project with all the campaign data
        setProject(projectData);

        // Clean up localStorage
        localStorage.removeItem("campaignProjectData");
        localStorage.removeItem("campaignTransition");
      } catch (error) {
        console.error("Error loading project data:", error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.5rem",
          color: "#6b7280",
        }}
      >
        Loading project data...
      </div>
    );
  }

  if (!project) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: "1rem",
        }}
      >
        <h2 style={{ fontSize: "2rem", color: "#374151" }}>
          No Active Project
        </h2>
        <p style={{ color: "#6b7280" }}>
          Please create a campaign in the Campaign Intelligence module first.
        </p>
        <button
          onClick={() => (window.location.href = "/campaign-intelligence")}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Go to Campaign Intelligence
        </button>
      </div>
    );
  }

  // Update task status
  const updateTaskStatus = (taskId, newStatus) => {
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
    }));
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(
      (t) => t.status === "Completed"
    ).length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  // Get current phase
  const getCurrentPhase = () => {
    const completedTasks =
      project.tasks?.filter((t) => t.status === "Completed").length || 0;
    const totalTasks = project.tasks?.length || 1;
    const progress = completedTasks / totalTasks;

    if (progress === 0) return project.phases?.[0]?.name || "Preparation";
    if (progress < 0.25) return project.phases?.[0]?.name || "Phase 1";
    if (progress < 0.5) return project.phases?.[1]?.name || "Phase 2";
    if (progress < 0.75) return project.phases?.[2]?.name || "Phase 3";
    if (progress < 1) return project.phases?.[3]?.name || "Final Phase";
    return "Completed";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "0.5rem",
            }}
          >
            Project Management
          </h1>
          <p style={{ fontSize: "1.125rem", color: "#4b5563" }}>
            Execute and track your campaign: {project.name}
          </p>
        </div>

        {/* Project Overview Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                }}
              >
                {project.name}
              </h2>
              <p style={{ color: "#6b7280", maxWidth: "600px" }}>
                {project.description}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#f0fdf4",
                  color: "#065f46",
                  borderRadius: "6px",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                }}
              >
                {getCurrentPhase()}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                {project.duration}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Overall Progress
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                {calculateProgress()}%
              </span>
            </div>
            <div
              style={{
                height: "8px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${calculateProgress()}%`,
                  height: "100%",
                  backgroundColor: "#10b981",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Total Budget
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                ${project.budget?.total?.toLocaleString() || "0"}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Total Tasks
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {project.tasks?.length || 0}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Milestones
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#7c3aed",
                }}
              >
                {project.milestones?.length || 0}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Content Pieces
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#2563eb",
                }}
              >
                {project.contentBriefs?.length || 0}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                In Progress
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#f59e0b",
                }}
              >
                {project.tasks?.filter((t) => t.status === "In Progress")
                  .length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              borderBottom: "2px solid #e5e7eb",
              flexWrap: "wrap",
            }}
          >
            {[
              { id: "dashboard", label: "Dashboard", icon: Activity },
              { id: "strategy", label: "Strategy", icon: Brain },
              { id: "tasks", label: "Tasks", icon: CheckCircle },
              { id: "phases", label: "Phases", icon: Flag },
              { id: "content", label: "Content", icon: FileText },
              { id: "budget", label: "Budget", icon: DollarSign },
              { id: "metrics", label: "Metrics", icon: BarChart3 },
              { id: "channels", label: "Channels", icon: Target },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor:
                      activeTab === tab.id ? "white" : "transparent",
                    border: "none",
                    borderBottom:
                      activeTab === tab.id
                        ? "2px solid #2563eb"
                        : "2px solid transparent",
                    marginBottom: "-2px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: activeTab === tab.id ? "#2563eb" : "#6b7280",
                    fontWeight: activeTab === tab.id ? "600" : "400",
                  }}
                >
                  <Icon style={{ width: "16px", height: "16px" }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                Project Dashboard
              </h3>

              {/* Strategic Framework - if available */}
              {project.strategicFramework && (
                <div style={{ marginBottom: "2rem" }}>
                  <h4
                    style={{
                      fontWeight: "600",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Shield
                      style={{
                        width: "18px",
                        height: "18px",
                        color: "#7c3aed",
                      }}
                    />
                    Strategic Framework
                  </h4>
                  <div
                    style={{
                      backgroundColor: "#faf5ff",
                      padding: "1.5rem",
                      borderRadius: "8px",
                    }}
                  >
                    {project.strategicFramework.vision && (
                      <div style={{ marginBottom: "1rem" }}>
                        <strong style={{ color: "#6b21a8" }}>Vision:</strong>
                        <p style={{ marginTop: "0.25rem", color: "#581c87" }}>
                          {project.strategicFramework.vision}
                        </p>
                      </div>
                    )}
                    {project.strategicFramework.missionStatement && (
                      <div style={{ marginBottom: "1rem" }}>
                        <strong style={{ color: "#6b21a8" }}>Mission:</strong>
                        <p style={{ marginTop: "0.25rem", color: "#581c87" }}>
                          {project.strategicFramework.missionStatement}
                        </p>
                      </div>
                    )}
                    {project.strategicFramework.coreValues && (
                      <div>
                        <strong style={{ color: "#6b21a8" }}>
                          Core Values:
                        </strong>
                        <p style={{ marginTop: "0.25rem", color: "#581c87" }}>
                          {Array.isArray(project.strategicFramework.coreValues)
                            ? project.strategicFramework.coreValues.join(" • ")
                            : project.strategicFramework.coreValues}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Strategic Objectives */}
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                  Strategic Objectives
                </h4>
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "1.5rem",
                    borderRadius: "8px",
                  }}
                >
                  {project.strategicObjectives &&
                  project.strategicObjectives.length > 0 ? (
                    project.strategicObjectives.map((obj, idx) => (
                      <div key={idx} style={{ marginBottom: "0.75rem" }}>
                        {typeof obj === "string" ? (
                          <p>• {obj}</p>
                        ) : (
                          <div>
                            <strong>• {obj.title}</strong>
                            {obj.description && (
                              <p
                                style={{
                                  marginLeft: "1rem",
                                  color: "#6b7280",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {obj.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#6b7280" }}>
                      No strategic objectives defined
                    </p>
                  )}
                </div>
              </div>

              {/* High Priority Tasks */}
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                  High Priority Tasks
                </h4>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {project.tasks && project.tasks.length > 0 ? (
                    project.tasks
                      .filter(
                        (t) => t.priority === "High" && t.status !== "Completed"
                      )
                      .slice(0, 5)
                      .map((task) => (
                        <div
                          key={task.id}
                          style={{
                            padding: "1rem",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <h5
                              style={{
                                fontWeight: "500",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {task.title}
                            </h5>
                            <p
                              style={{ fontSize: "0.875rem", color: "#6b7280" }}
                            >
                              Due: {task.dueDate} • Phase: {task.phase}
                            </p>
                          </div>
                          <select
                            value={task.status}
                            onChange={(e) =>
                              updateTaskStatus(task.id, e.target.value)
                            }
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              border: "1px solid #e5e7eb",
                              fontSize: "0.875rem",
                            }}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                        </div>
                      ))
                  ) : (
                    <p style={{ color: "#6b7280" }}>No tasks available</p>
                  )}
                </div>
              </div>

              {/* Upcoming Milestones */}
              <div>
                <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                  Upcoming Milestones
                </h4>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {project.milestones && project.milestones.length > 0 ? (
                    project.milestones.slice(0, 5).map((milestone, idx) => (
                      <div
                        key={milestone.id || idx}
                        style={{
                          padding: "1rem",
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h5
                            style={{
                              fontWeight: "500",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {milestone.title}
                          </h5>
                          {milestone.target && (
                            <p
                              style={{ fontSize: "0.875rem", color: "#6b7280" }}
                            >
                              Target: {milestone.target}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              color: "#2563eb",
                            }}
                          >
                            {milestone.date}
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {milestone.type}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#6b7280" }}>No milestones defined</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Strategy Tab */}
          {activeTab === "strategy" && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                Campaign Strategy
              </h3>

              {/* Market Analysis Summary */}
              {project.marketAnalysis && (
                <div style={{ marginBottom: "2rem" }}>
                  <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                    Market Analysis
                  </h4>

                  {project.marketAnalysis.executiveSummary && (
                    <div
                      style={{
                        backgroundColor: "#eff6ff",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                      }}
                    >
                      <h5 style={{ color: "#1e40af", marginBottom: "0.5rem" }}>
                        Executive Summary
                      </h5>
                      <p style={{ color: "#1e40af" }}>
                        {project.marketAnalysis.executiveSummary}
                      </p>
                    </div>
                  )}

                  {project.marketAnalysis.targetAudience && (
                    <div
                      style={{
                        backgroundColor: "#fef3c7",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                      }}
                    >
                      <h5 style={{ color: "#78350f", marginBottom: "0.5rem" }}>
                        Target Audience
                      </h5>
                      {project.marketAnalysis.targetAudience.segments && (
                        <div>
                          <strong>Key Segments:</strong>
                          {Array.isArray(
                            project.marketAnalysis.targetAudience.segments
                          ) ? (
                            <ul style={{ marginTop: "0.5rem" }}>
                              {project.marketAnalysis.targetAudience.segments.map(
                                (segment, idx) => (
                                  <li key={idx}>
                                    {typeof segment === "object"
                                      ? segment.name
                                      : segment}
                                    {typeof segment === "object" &&
                                      segment.size &&
                                      ` (${segment.size})`}
                                  </li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p>
                              {project.marketAnalysis.targetAudience.segments}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {project.strategicOpportunities &&
                    project.strategicOpportunities.length > 0 && (
                      <div
                        style={{
                          backgroundColor: "#f0fdf4",
                          padding: "1.5rem",
                          borderRadius: "8px",
                        }}
                      >
                        <h5
                          style={{ color: "#065f46", marginBottom: "0.5rem" }}
                        >
                          Strategic Opportunities
                        </h5>
                        {project.strategicOpportunities.map((opp, idx) => (
                          <div key={idx} style={{ marginBottom: "0.75rem" }}>
                            <p style={{ fontWeight: "500" }}>
                              •{" "}
                              {typeof opp === "object"
                                ? opp.opportunity || opp.title
                                : opp}
                            </p>
                            {typeof opp === "object" && opp.rationale && (
                              <p
                                style={{
                                  marginLeft: "1rem",
                                  fontSize: "0.875rem",
                                  color: "#059669",
                                }}
                              >
                                {opp.rationale}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* Campaign Concept */}
              {project.campaignConcept && (
                <div>
                  <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                    Campaign Concept
                  </h4>
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "1.5rem",
                      borderRadius: "8px",
                    }}
                  >
                    {project.campaignConcept.name && (
                      <h5 style={{ marginBottom: "0.5rem" }}>
                        {project.campaignConcept.name}
                      </h5>
                    )}
                    {project.campaignConcept.description && (
                      <p style={{ color: "#6b7280" }}>
                        {project.campaignConcept.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                All Tasks ({project.tasks?.length || 0})
              </h3>

              {project.tasks && project.tasks.length > 0 ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: "1.5rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor:
                          task.type === "milestone" ? "#faf5ff" : "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {task.type === "milestone" && (
                              <Target
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  color: "#7c3aed",
                                }}
                              />
                            )}
                            {task.type === "deliverable" && (
                              <FileText
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  color: "#2563eb",
                                }}
                              />
                            )}
                            {task.type === "channel-task" && (
                              <Zap
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  color: "#f59e0b",
                                }}
                              />
                            )}
                            <h4 style={{ fontWeight: "600", margin: 0 }}>
                              {task.title}
                            </h4>
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                backgroundColor:
                                  task.priority === "High"
                                    ? "#fef2f2"
                                    : task.priority === "Medium"
                                    ? "#fef3c7"
                                    : "#f3f4f6",
                                color:
                                  task.priority === "High"
                                    ? "#dc2626"
                                    : task.priority === "Medium"
                                    ? "#f59e0b"
                                    : "#6b7280",
                              }}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {task.description}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: "1rem",
                              fontSize: "0.875rem",
                              color: "#6b7280",
                            }}
                          >
                            <span>
                              <strong>Phase:</strong> {task.phase}
                            </span>
                            <span>
                              <strong>Due:</strong> {task.dueDate}
                            </span>
                            {task.type && (
                              <span>
                                <strong>Type:</strong> {task.type}
                              </span>
                            )}
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTaskStatus(task.id, e.target.value)
                          }
                          style={{
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #e5e7eb",
                            fontSize: "0.875rem",
                          }}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#6b7280" }}>
                  No tasks have been generated for this campaign.
                </p>
              )}
            </div>
          )}

          {/* Phases Tab */}
          {activeTab === "phases" && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                Campaign Phases
              </h3>

              {project.phases && project.phases.length > 0 ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {project.phases.map((phase, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "1.5rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: "#2563eb",
                            color: "white",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "600",
                          }}
                        >
                          {idx + 1}
                        </div>
                        <h4 style={{ fontWeight: "600", margin: 0 }}>
                          {phase.name}
                        </h4>
                        <span
                          style={{ color: "#6b7280", fontSize: "0.875rem" }}
                        >
                          ({phase.duration})
                        </span>
                      </div>

                      {phase.description && (
                        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                          {phase.description}
                        </p>
                      )}

                      {phase.keyActivities &&
                        phase.keyActivities.length > 0 && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <strong style={{ fontSize: "0.875rem" }}>
                              Key Activities:
                            </strong>
                            <ul
                              style={{
                                marginLeft: "1.5rem",
                                marginTop: "0.25rem",
                                fontSize: "0.875rem",
                                color: "#6b7280",
                              }}
                            >
                              {phase.keyActivities.map((activity, actIdx) => (
                                <li key={actIdx}>{activity}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {phase.deliverables && phase.deliverables.length > 0 && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <strong style={{ fontSize: "0.875rem" }}>
                            Deliverables:
                          </strong>
                          <ul
                            style={{
                              marginLeft: "1.5rem",
                              marginTop: "0.25rem",
                              fontSize: "0.875rem",
                              color: "#6b7280",
                            }}
                          >
                            {phase.deliverables.map((deliverable, delIdx) => (
                              <li key={delIdx}>{deliverable}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {phase.successCriteria &&
                        phase.successCriteria.length > 0 && (
                          <div>
                            <strong style={{ fontSize: "0.875rem" }}>
                              Success Criteria:
                            </strong>
                            <ul
                              style={{
                                marginLeft: "1.5rem",
                                marginTop: "0.25rem",
                                fontSize: "0.875rem",
                                color: "#10b981",
                              }}
                            >
                              {phase.successCriteria.map(
                                (criteria, critIdx) => (
                                  <li key={critIdx}>{criteria}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#6b7280" }}>
                  No phases defined for this campaign.
                </p>
              )}
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                Content Briefs ({project.contentBriefs?.length || 0})
              </h3>

              {project.contentBriefs && project.contentBriefs.length > 0 ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {project.contentBriefs.map((brief) => (
                    <div
                      key={brief.id}
                      style={{
                        padding: "1.5rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <FileText
                              style={{
                                width: "18px",
                                height: "18px",
                                color: "#2563eb",
                              }}
                            />
                            <h4 style={{ fontWeight: "600", margin: 0 }}>
                              {brief.title}
                            </h4>
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                backgroundColor: "#eff6ff",
                                color: "#2563eb",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                              }}
                            >
                              {brief.type}
                            </span>
                            {brief.priority && (
                              <span
                                style={{
                                  padding: "0.25rem 0.5rem",
                                  backgroundColor:
                                    brief.priority === "High"
                                      ? "#fef2f2"
                                      : "#fef3c7",
                                  color:
                                    brief.priority === "High"
                                      ? "#dc2626"
                                      : "#f59e0b",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {brief.priority}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              color: "#6b7280",
                              marginBottom: "0.75rem",
                            }}
                          >
                            {brief.brief}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: "1rem",
                              fontSize: "0.875rem",
                              color: "#6b7280",
                            }}
                          >
                            <span>
                              <strong>Due:</strong> {brief.dueDate}
                            </span>
                            {brief.phase && (
                              <span>
                                <strong>Phase:</strong> {brief.phase}
                              </span>
                            )}
                            {brief.channel && (
                              <span>
                                <strong>Channel:</strong> {brief.channel}
                              </span>
                            )}
                          </div>
                          {brief.segments && brief.segments.length > 0 && (
                            <div
                              style={{
                                marginTop: "0.5rem",
                                fontSize: "0.875rem",
                              }}
                            >
                              <strong>Target Segments:</strong>{" "}
                              {brief.segments.join(", ")}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            padding: "0.25rem 0.5rem",
                            backgroundColor:
                              brief.status === "Completed"
                                ? "#f0fdf4"
                                : brief.status === "In Progress"
                                ? "#fef3c7"
                                : "#f3f4f6",
                            color:
                              brief.status === "Completed"
                                ? "#065f46"
                                : brief.status === "In Progress"
                                ? "#92400e"
                                : "#6b7280",
                            borderRadius: "4px",
                            fontSize: "0.875rem",
                          }}
                        >
                          {brief.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#6b7280" }}>
                  No content briefs defined for this campaign.
                </p>
              )}
            </div>
          )}

          {/* Budget Tab */}
          {activeTab === "budget" && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                Budget Management
              </h3>

              {/* Budget Overview */}
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                  Budget Overview
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#f3f4f6",
                      padding: "1rem",
                      borderRadius: "8px",
                    }}
                  >
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Total Budget
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                      ${project.budget?.total?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#fef3c7",
                      padding: "1rem",
                      borderRadius: "8px",
                    }}
                  >
                    <p style={{ fontSize: "0.875rem", color: "#92400e" }}>
                      Allocated
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                      ${project.budget?.allocated?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div
                    style={{
                      backgroundColor: "#f0fdf4",
                      padding: "1rem",
                      borderRadius: "8px",
                    }}
                  >
                    <p style={{ fontSize: "0.875rem", color: "#065f46" }}>
                      Remaining
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                      ${project.budget?.remaining?.toLocaleString() || "0"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Budget Allocation */}
              {project.budget?.breakdown &&
                Object.keys(project.budget.breakdown).length > 0 && (
                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                      Budget Allocation
                    </h4>
                    <div
                      style={{
                        backgroundColor: "#f9fafb",
                        padding: "1.5rem",
                        borderRadius: "8px",
                      }}
                    >
                      {Object.entries(project.budget.breakdown).map(
                        ([category, percentage], idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.75rem 0",
                              borderBottom:
                                idx <
                                Object.entries(project.budget.breakdown)
                                  .length -
                                  1
                                  ? "1px solid #e5e7eb"
                                  : "none",
                            }}
                          >
                            <span>{category}</span>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                              }}
                            >
                              <span
                                style={{ fontWeight: "600", color: "#2563eb" }}
                              >
                                {percentage}%
                              </span>
                              <span style={{ color: "#6b7280" }}>
                                ($
                                {Math.round(
                                  ((project.budget.total || 0) * percentage) /
                                    100
                                ).toLocaleString()}
                                )
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Channel Budgets */}
              {project.channelStrategy &&
                Object.keys(project.channelStrategy).length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                      Channel Budgets
                    </h4>
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {Object.entries(project.channelStrategy).map(
                        ([channel, strategy], idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "1rem",
                              backgroundColor: "#f9fafb",
                              borderRadius: "8px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <h5
                                style={{
                                  fontWeight: "500",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                {channel}
                              </h5>
                              {strategy.description && (
                                <p
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "#6b7280",
                                  }}
                                >
                                  {strategy.description}
                                </p>
                              )}
                            </div>
                            {strategy.budget && (
                              <div style={{ textAlign: "right" }}>
                                <p
                                  style={{
                                    fontSize: "1.25rem",
                                    fontWeight: "600",
                                    color: "#2563eb",
                                  }}
                                >
                                  ${strategy.budget.toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === "metrics" && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                Performance Metrics
              </h3>

              {project.metrics && project.metrics.length > 0 ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {project.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "1.5rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h4
                          style={{ fontWeight: "600", marginBottom: "0.25rem" }}
                        >
                          {metric.metric}
                        </h4>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          {metric.category} • {metric.measurement}
                        </p>
                        {metric.timeline && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              marginTop: "0.25rem",
                            }}
                          >
                            Timeline: {metric.timeline}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color: "#2563eb",
                          }}
                        >
                          {metric.target}
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          Target
                        </p>
                        {metric.current !== undefined && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#10b981",
                              marginTop: "0.25rem",
                            }}
                          >
                            Current: {metric.current}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#6b7280" }}>
                  No metrics defined for this campaign.
                </p>
              )}

              {/* Expected Outcomes */}
              {project.expectedOutcomes &&
                project.expectedOutcomes.length > 0 && (
                  <div style={{ marginTop: "2rem" }}>
                    <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                      Expected Outcomes
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "1rem",
                      }}
                    >
                      {project.expectedOutcomes.map((outcome, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: "#fef3c7",
                            padding: "1.25rem",
                            borderRadius: "8px",
                            borderLeft: "4px solid #f59e0b",
                          }}
                        >
                          <h5
                            style={{
                              fontWeight: "600",
                              marginBottom: "0.5rem",
                              color: "#92400e",
                            }}
                          >
                            {outcome.metric}
                          </h5>
                          <p
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "bold",
                              color: "#78350f",
                            }}
                          >
                            {outcome.target}
                          </p>
                          {outcome.measurement && (
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#b45309",
                                marginTop: "0.25rem",
                              }}
                            >
                              {outcome.measurement}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Channels Tab */}
          {activeTab === "channels" && (
            <div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                Channel Strategy
              </h3>

              {project.channelStrategy &&
              Object.keys(project.channelStrategy).length > 0 ? (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {Object.entries(project.channelStrategy).map(
                    ([channel, strategy], idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "1.5rem",
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <h4
                          style={{
                            fontWeight: "600",
                            marginBottom: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Target
                            style={{
                              width: "18px",
                              height: "18px",
                              color: "#2563eb",
                            }}
                          />
                          {channel}
                        </h4>

                        {strategy.description && (
                          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                            {strategy.description}
                          </p>
                        )}

                        {strategy.objective && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <strong style={{ fontSize: "0.875rem" }}>
                              Objective:
                            </strong>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                color: "#6b7280",
                                marginTop: "0.25rem",
                              }}
                            >
                              {strategy.objective}
                            </p>
                          </div>
                        )}

                        {strategy.tactics && strategy.tactics.length > 0 && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <strong style={{ fontSize: "0.875rem" }}>
                              Tactics:
                            </strong>
                            <ul
                              style={{
                                marginLeft: "1.5rem",
                                marginTop: "0.25rem",
                                fontSize: "0.875rem",
                                color: "#6b7280",
                              }}
                            >
                              {strategy.tactics.map((tactic, tacticIdx) => (
                                <li key={tacticIdx}>{tactic}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {strategy.budget && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <strong style={{ fontSize: "0.875rem" }}>
                              Budget:
                            </strong>
                            <span
                              style={{
                                marginLeft: "0.5rem",
                                color: "#2563eb",
                                fontWeight: "600",
                              }}
                            >
                              ${strategy.budget.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {strategy.metrics && strategy.metrics.length > 0 && (
                          <div>
                            <strong style={{ fontSize: "0.875rem" }}>
                              Success Metrics:
                            </strong>
                            <ul
                              style={{
                                marginLeft: "1.5rem",
                                marginTop: "0.25rem",
                                fontSize: "0.875rem",
                                color: "#6b7280",
                              }}
                            >
                              {strategy.metrics.map((metric, metricIdx) => (
                                <li key={metricIdx}>{metric}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p style={{ color: "#6b7280" }}>
                  No channel strategy defined for this campaign.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
