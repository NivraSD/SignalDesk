import React, { useState } from "react";
import {
  Rocket,
  Shield,
  TrendingUp,
  Activity,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
} from "lucide-react";

export default function CampaignTemplateSelector({ onSelectTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    {
      id: "product-launch-30day",
      type: "launch",
      name: "30-Day Product Launch",
      icon: Rocket,
      duration: "30 days",
      budget: "$50,000 - $100,000",
      team: "5-7 people",
      description:
        "Comprehensive product launch campaign with pre-launch buzz, launch week activities, and post-launch momentum",
      phases: [
        "Pre-launch (Week 1-2)",
        "Launch Week (Week 3)",
        "Momentum (Week 4)",
      ],
      keyDeliverables: [
        "Launch announcement press release",
        "Media kit and assets",
        "Social media campaign",
        "Influencer outreach",
        "Launch event or webinar",
      ],
    },
    {
      id: "crisis-response-72hour",
      type: "crisis",
      name: "72-Hour Crisis Response",
      icon: Shield,
      duration: "72 hours",
      budget: "$25,000 - $50,000",
      team: "3-5 people",
      description:
        "Rapid crisis response plan with immediate actions, stakeholder communications, and reputation management",
      phases: [
        "Hour 1-6: Immediate Response",
        "Hour 7-24: Stabilization",
        "Hour 25-72: Recovery",
      ],
      keyDeliverables: [
        "Crisis statement",
        "Stakeholder communications",
        "Media response strategy",
        "Social media management",
        "Internal communications",
      ],
    },
    {
      id: "thought-leadership-quarterly",
      type: "thought-leadership",
      name: "Quarterly Thought Leadership",
      icon: TrendingUp,
      duration: "3 months",
      budget: "$75,000 - $150,000",
      team: "4-6 people",
      description:
        "Establish executive and brand authority through content, speaking, and media opportunities",
      phases: [
        "Research & Planning",
        "Content Creation",
        "Distribution & Amplification",
        "Engagement & Measurement",
      ],
      keyDeliverables: [
        "Executive bylined articles",
        "Speaking opportunities",
        "Research reports",
        "Podcast appearances",
        "Media interviews",
      ],
    },
    {
      id: "brand-awareness-90day",
      type: "awareness",
      name: "90-Day Brand Awareness",
      icon: Activity,
      duration: "90 days",
      budget: "$100,000 - $200,000",
      team: "6-8 people",
      description:
        "Intensive brand awareness campaign to increase visibility and market share",
      phases: [
        "Market Analysis",
        "Creative Development",
        "Media Blitz",
        "Optimization",
      ],
      keyDeliverables: [
        "Brand messaging framework",
        "Paid media campaign",
        "Partnership activations",
        "Event sponsorships",
        "Content marketing program",
      ],
    },
  ];

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <div>
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: "bold",
          marginBottom: "1rem",
        }}
      >
        Choose a Campaign Template
      </h3>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Select a pre-built campaign template that matches your needs, or start
        from scratch
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {templates.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedTemplate === template.id;

          return (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              style={{
                backgroundColor: "white",
                border: `2px solid ${isSelected ? "#2563eb" : "#e5e7eb"}`,
                borderRadius: "12px",
                padding: "1.5rem",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(37, 99, 235, 0.1)"
                  : "none",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: isSelected ? "#2563eb" : "#eff6ff",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    style={{
                      width: "24px",
                      height: "24px",
                      color: isSelected ? "white" : "#2563eb",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontWeight: "600",
                      margin: 0,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {template.name}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      margin: 0,
                    }}
                  >
                    {template.type}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#4b5563",
                  marginBottom: "1rem",
                  lineHeight: "1.5",
                }}
              >
                {template.description}
              </p>

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "0.5rem",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <Clock
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "#6b7280",
                      }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Duration
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      margin: 0,
                    }}
                  >
                    {template.duration}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "0.5rem",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <DollarSign
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "#6b7280",
                      }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Budget
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      margin: 0,
                    }}
                  >
                    {template.budget}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "0.5rem",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <Users
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "#6b7280",
                      }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Team
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      margin: 0,
                    }}
                  >
                    {template.team}
                  </p>
                </div>
              </div>

              {/* Phases */}
              <div style={{ marginBottom: "1rem" }}>
                <h5
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  Campaign Phases
                </h5>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {template.phases.map((phase, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.75rem",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "9999px",
                        color: "#4b5563",
                      }}
                    >
                      {phase}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Deliverables */}
              <div>
                <h5
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  Key Deliverables
                </h5>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {template.keyDeliverables
                    .slice(0, 3)
                    .map((deliverable, index) => (
                      <li
                        key={index}
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginBottom: "0.25rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <CheckCircle
                          style={{
                            width: "12px",
                            height: "12px",
                            color: "#10b981",
                          }}
                        />
                        {deliverable}
                      </li>
                    ))}
                  {template.keyDeliverables.length > 3 && (
                    <li
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        fontStyle: "italic",
                      }}
                    >
                      +{template.keyDeliverables.length - 3} more
                    </li>
                  )}
                </ul>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#2563eb",
                    }}
                  >
                    ✓ Selected
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
