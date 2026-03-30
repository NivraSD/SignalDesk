import React, { useState } from "react";
import {
  FileText,
  ExternalLink,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Circle,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function CampaignContentBriefs({
  briefs = [],
  onCreateContent,
}) {
  const [selectedBrief, setSelectedBrief] = useState(null);

  // Content type icons and colors
  const contentTypeConfig = {
    "press-release": {
      icon: FileText,
      color: "#3b82f6",
      label: "Press Release",
    },
    "social-media": { icon: FileText, color: "#8b5cf6", label: "Social Media" },
    "blog-post": { icon: FileText, color: "#10b981", label: "Blog Post" },
    email: { icon: FileText, color: "#f59e0b", label: "Email" },
    "thought-leadership": {
      icon: FileText,
      color: "#ec4899",
      label: "Article",
    },
    "media-pitch": { icon: FileText, color: "#6366f1", label: "Media Pitch" },
    presentation: { icon: FileText, color: "#14b8a6", label: "Presentation" },
    "qa-document": { icon: FileText, color: "#f97316", label: "Q&A Doc" },
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in-progress":
        return Clock;
      case "pending":
        return Circle;
      default:
        return Circle;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "in-progress":
        return "#3b82f6";
      case "pending":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  // Default briefs if none provided
  const defaultBriefs =
    briefs.length > 0
      ? briefs
      : [
          {
            id: "brief-1",
            type: "press-release",
            title: "Campaign Launch Announcement",
            brief:
              "Write a press release announcing the launch of our new campaign, highlighting key objectives and expected impact.",
            dueDate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            priority: "high",
            status: "pending",
            assignee: "PR Team",
          },
          {
            id: "brief-2",
            type: "social-media",
            title: "Social Media Campaign Posts",
            brief:
              "Create a series of social media posts for LinkedIn, Twitter, and Facebook to support the campaign launch.",
            dueDate: new Date(
              Date.now() + 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
            priority: "high",
            status: "pending",
            assignee: "Social Team",
          },
          {
            id: "brief-3",
            type: "media-pitch",
            title: "Media Outreach Pitch",
            brief:
              "Develop a compelling media pitch to send to key journalists and influencers in our industry.",
            dueDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            priority: "medium",
            status: "pending",
            assignee: "PR Team",
          },
        ];

  const briefsToDisplay = defaultBriefs;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
          Content Briefs
        </h3>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            backgroundColor: "#2563eb",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          <Plus style={{ width: "16px", height: "16px" }} />
          Add Brief
        </button>
      </div>

      {/* Briefs Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <h4
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "0.5rem",
            }}
          >
            Total Briefs
          </h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
            {briefsToDisplay.length}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <h4
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "0.5rem",
            }}
          >
            Pending
          </h4>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: "#f59e0b",
            }}
          >
            {briefsToDisplay.filter((b) => b.status === "pending").length}
          </p>
        </div>
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <h4
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "0.5rem",
            }}
          >
            Completed
          </h4>
          <p
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              margin: 0,
              color: "#10b981",
            }}
          >
            {briefsToDisplay.filter((b) => b.status === "completed").length}
          </p>
        </div>
      </div>

      {/* Content Briefs List */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {briefsToDisplay.map((brief) => {
          const config =
            contentTypeConfig[brief.type] || contentTypeConfig["press-release"];
          const StatusIcon = getStatusIcon(brief.status);
          const isSelected = selectedBrief?.id === brief.id;

          return (
            <div
              key={brief.id}
              onClick={() => setSelectedBrief(isSelected ? null : brief)}
              style={{
                backgroundColor: "white",
                border: `2px solid ${isSelected ? "#2563eb" : "#e5e7eb"}`,
                borderRadius: "8px",
                padding: "1.5rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: `${config.color}20`,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText
                        style={{
                          width: "20px",
                          height: "20px",
                          color: config.color,
                        }}
                      />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontWeight: "600",
                          margin: 0,
                          marginBottom: "0.25rem",
                        }}
                      >
                        {brief.title}
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.125rem 0.5rem",
                            backgroundColor: `${config.color}10`,
                            color: config.color,
                            borderRadius: "9999px",
                            fontWeight: "500",
                          }}
                        >
                          {config.label}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: getPriorityColor(brief.priority),
                            fontWeight: "500",
                          }}
                        >
                          {brief.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      marginBottom: "1rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {brief.brief}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "1.5rem",
                      fontSize: "0.75rem",
                      color: "#6b7280",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <StatusIcon
                        style={{
                          width: "14px",
                          height: "14px",
                          color: getStatusColor(brief.status),
                        }}
                      />
                      <span
                        style={{
                          color: getStatusColor(brief.status),
                          fontWeight: "500",
                        }}
                      >
                        {brief.status.charAt(0).toUpperCase() +
                          brief.status.slice(1).replace("-", " ")}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <Clock style={{ width: "14px", height: "14px" }} />
                      Due {new Date(brief.dueDate).toLocaleDateString()}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <User style={{ width: "14px", height: "14px" }} />
                      {brief.assignee}
                    </div>
                  </div>
                </div>

                {brief.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCreateContent) {
                        onCreateContent(brief);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      backgroundColor: "#2563eb",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Create Content
                    <ArrowRight style={{ width: "16px", height: "16px" }} />
                  </button>
                )}
              </div>

              {isSelected && (
                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <h5 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                    Additional Details
                  </h5>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      lineHeight: "1.5",
                    }}
                  >
                    <p>
                      This content brief is part of your campaign plan. Click
                      "Create Content" to open this brief in the Content
                      Generator with all details pre-filled.
                    </p>
                    {brief.linkedContentId && (
                      <p style={{ marginTop: "0.5rem" }}>
                        <strong>Status:</strong> Content has been created for
                        this brief.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "#eff6ff",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            color: "#1e40af",
            marginBottom: "1rem",
          }}
        >
          Ready to create content? Select any brief above and click "Create
          Content" to seamlessly transfer it to the Content Generator.
        </p>
        <button
          onClick={() => (window.location.href = "/content-generator")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "white",
            color: "#2563eb",
            padding: "0.5rem 1.5rem",
            borderRadius: "6px",
            border: "1px solid #2563eb",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          <ExternalLink style={{ width: "16px", height: "16px" }} />
          Go to Content Generator
        </button>
      </div>
    </div>
  );
}
