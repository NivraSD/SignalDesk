// CampaignTimeline.js - Enhanced to work with insights-based campaign data
import React, { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  User,
  ChevronRight,
  Layers,
} from "lucide-react";

export default function CampaignTimeline({
  phases = [],
  tasks = [],
  timeline = [],
  onTaskUpdate,
}) {
  const [expandedPhase, setExpandedPhase] = useState(0);

  // Handle both phases array and timeline array for backward compatibility
  const campaignPhases = phases.length > 0 ? phases : timeline;

  // If we have phases from the insights-based campaign, use those
  const phaseGroups = campaignPhases.map((phase, index) => {
    // Find tasks that belong to this phase
    const phaseTasks = tasks.filter(
      (task) =>
        task.phaseId === phase.id ||
        task.phase === phase.name ||
        task.phaseIndex === index
    );

    return {
      ...phase,
      index,
      tasks: phaseTasks,
      progress: phase.progress || calculateProgress(phaseTasks),
    };
  });

  function calculateProgress(tasks) {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "in-progress":
        return "#3b82f6";
      case "pending":
        return "#6b7280";
      case "overdue":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in-progress":
        return Clock;
      case "overdue":
        return AlertCircle;
      default:
        return Circle;
    }
  };

  const updateTaskStatus = (taskId, newStatus) => {
    if (onTaskUpdate) {
      onTaskUpdate(taskId, { status: newStatus });
    }
  };

  return (
    <div>
      <h3
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
        }}
      >
        Campaign Timeline
      </h3>

      {/* Visual Timeline */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ position: "relative", padding: "0 1rem" }}>
          {/* Timeline Line */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "2rem",
              right: "2rem",
              height: "2px",
              backgroundColor: "#e5e7eb",
            }}
          />

          {/* Phase Markers */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            {phaseGroups.map((phase, index) => {
              const isActive = expandedPhase === index;
              const progress = phase.progress || 0;

              return (
                <div
                  key={index}
                  onClick={() => setExpandedPhase(index)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "white",
                      border: `3px solid ${
                        progress === 100
                          ? "#10b981"
                          : progress > 0
                          ? "#3b82f6"
                          : "#e5e7eb"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <span style={{ fontWeight: "600", fontSize: "0.875rem" }}>
                      {index + 1}
                    </span>
                  </div>
                  <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
                    <p
                      style={{
                        fontWeight: isActive ? "600" : "500",
                        fontSize: "0.875rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {phase.name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {phase.duration}
                    </p>
                    {phase.tasks.length > 0 && (
                      <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {
                          phase.tasks.filter((t) => t.status === "completed")
                            .length
                        }
                        /{phase.tasks.length} tasks
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase Details */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
        }}
      >
        {phaseGroups[expandedPhase] && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <Layers
                  style={{ width: "20px", height: "20px", color: "#2563eb" }}
                />
                <h4
                  style={{ fontSize: "1.125rem", fontWeight: "600", margin: 0 }}
                >
                  Phase {expandedPhase + 1}: {phaseGroups[expandedPhase].name}
                </h4>
              </div>
              {phaseGroups[expandedPhase].description && (
                <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                  {phaseGroups[expandedPhase].description}
                </p>
              )}

              {/* Progress Bar */}
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>Progress</span>
                  <span>{phaseGroups[expandedPhase].progress}%</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${phaseGroups[expandedPhase].progress}%`,
                      height: "100%",
                      backgroundColor:
                        phaseGroups[expandedPhase].progress === 100
                          ? "#10b981"
                          : "#3b82f6",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Phase Tasks */}
            <div>
              <h5 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                Phase Tasks
              </h5>
              {phaseGroups[expandedPhase].tasks.length === 0 ? (
                <p
                  style={{
                    color: "#6b7280",
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "2rem",
                  }}
                >
                  No tasks defined for this phase yet
                </p>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {phaseGroups[expandedPhase].tasks.map((task) => {
                    const StatusIcon = getStatusIcon(task.status);

                    return (
                      <div
                        key={task.id}
                        style={{
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          padding: "1rem",
                          transition: "all 0.2s",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "1rem",
                          }}
                        >
                          <StatusIcon
                            style={{
                              width: "20px",
                              height: "20px",
                              color: getStatusColor(task.status),
                              flexShrink: 0,
                              marginTop: "2px",
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "0.5rem",
                              }}
                            >
                              <h5 style={{ fontWeight: "600", margin: 0 }}>
                                {task.task || task.title || task.name}
                              </h5>
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  updateTaskStatus(task.id, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "4px",
                                  border: "1px solid #e5e7eb",
                                  backgroundColor: "white",
                                  color: getStatusColor(task.status),
                                  fontWeight: "500",
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="overdue">Overdue</option>
                              </select>
                            </div>

                            {task.description && (
                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                {task.description}
                              </p>
                            )}

                            <div
                              style={{
                                display: "flex",
                                gap: "1rem",
                                fontSize: "0.75rem",
                                color: "#6b7280",
                              }}
                            >
                              {task.assignee && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                  }}
                                >
                                  <User
                                    style={{ width: "14px", height: "14px" }}
                                  />
                                  {task.assignee}
                                </div>
                              )}
                              {task.dueDate && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                  }}
                                >
                                  <Calendar
                                    style={{ width: "14px", height: "14px" }}
                                  />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                              {task.priority && (
                                <span
                                  style={{
                                    color:
                                      task.priority === "high"
                                        ? "#dc2626"
                                        : task.priority === "medium"
                                        ? "#f59e0b"
                                        : "#6b7280",
                                    fontWeight: "500",
                                  }}
                                >
                                  {task.priority.charAt(0).toUpperCase() +
                                    task.priority.slice(1)}{" "}
                                  priority
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phase Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          marginTop: "1.5rem",
        }}
      >
        {phaseGroups.map((_, index) => (
          <button
            key={index}
            onClick={() => setExpandedPhase(index)}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: expandedPhase === index ? "#2563eb" : "#e5e7eb",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
