import React, { useState, useEffect } from "react";
import { useProject } from "../contexts/ProjectContext";
import SaveToMemoryVaultButton from "./MemoryVault/SaveToMemoryVaultButton";
import API_BASE_URL from '../config/api';
import {
  Brain,
  Target,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Download,
  Loader,
  AlertCircle,
  Sparkles,
  Calendar,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Shield,
  Play,
  Eye,
  Edit3,
  FileText,
  ListChecks,
  Clock,
  Info
} from "lucide-react";

export default function StrategicPlanning() {
  const [goals, setGoals] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState(null);
  const [error, setError] = useState(null);
  const [expandedPillars, setExpandedPillars] = useState({});
  const [showEvidence, setShowEvidence] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const { selectedProject } = useProject();

  // Context pills for quick starts
  const contextPills = [
    { id: 'launch', label: 'Product Launch', icon: Sparkles },
    { id: 'crisis', label: 'Crisis Response', icon: Shield },
    { id: 'thought', label: 'Thought Leadership', icon: Brain },
    { id: 'market', label: 'Market Entry', icon: Globe },
    { id: 'reputation', label: 'Reputation Building', icon: TrendingUp }
  ];

  const togglePillar = (pillarId) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  const toggleEvidence = (pillarId) => {
    setShowEvidence(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  const generateStrategicPlan = async () => {
    if (!goals.trim()) {
      setError("Please describe your goals");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call the strategic planning API endpoint
      const response = await fetch(
        `${API_BASE_URL}/strategic-planning/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            goals: goals,
            projectId: selectedProject?.id,
            // This will trigger MCP orchestration in the backend
            useMCPs: true,
            includeEvidence: true,
            predictCascades: true
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate strategic plan");
      }

      // Structure the plan with evidence from MCPs
      const plan = {
        objective: data.objective || extractObjective(goals),
        approach: data.approach,
        timeline: data.timeline,
        pillars: data.pillars || generatePillars(data),
        cascadeEffects: data.cascadeEffects,
        opportunities: data.opportunities,
        risks: data.risks,
        metrics: data.metrics,
        evidence: data.evidence, // From MCPs
        timestamp: new Date().toISOString()
      };

      setStrategicPlan(plan);

      // Auto-expand first pillar
      if (plan.pillars && plan.pillars.length > 0) {
        setExpandedPillars({ [plan.pillars[0].id]: true });
      }
    } catch (error) {
      console.error("Error generating strategic plan:", error);
      setError(error.message || "Failed to generate strategic plan");
    } finally {
      setIsGenerating(false);
    }
  };

  const executeStrategicPlan = async () => {
    if (!strategicPlan) return;

    setIsExecuting(true);
    setExecutionStatus({ stage: 'initializing', message: 'Creating campaign...' });

    try {
      // Step 1: Create campaign in Campaign Orchestrator MCP
      setExecutionStatus({ stage: 'campaign', message: 'Setting up campaign structure...' });
      
      const campaignResponse = await fetch(
        `${API_BASE_URL}/campaigns/create-from-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            plan: strategicPlan,
            projectId: selectedProject?.id,
          }),
        }
      );

      const campaign = await campaignResponse.json();

      // Step 2: Generate materials for each pillar
      setExecutionStatus({ stage: 'materials', message: 'Generating content and materials...' });
      
      const materials = [];
      for (const pillar of strategicPlan.pillars) {
        // Generate content based on tactics
        for (const tactic of pillar.tactics) {
          if (tactic.includes('Press Release') || tactic.includes('press')) {
            const content = await generateContent('press_release', pillar);
            materials.push(content);
          }
          if (tactic.includes('Social') || tactic.includes('social')) {
            const content = await generateContent('social_series', pillar);
            materials.push(content);
          }
          if (tactic.includes('Email') || tactic.includes('outreach')) {
            const content = await generateContent('email_template', pillar);
            materials.push(content);
          }
        }
      }

      // Step 3: Build media lists
      setExecutionStatus({ stage: 'media', message: 'Building media lists...' });
      
      const mediaLists = [];
      for (const pillar of strategicPlan.pillars) {
        if (pillar.tactics.some(t => t.includes('Media') || t.includes('media'))) {
          const list = await buildMediaList(pillar);
          mediaLists.push(list);
        }
      }

      // Step 4: Store in MemoryVault
      setExecutionStatus({ stage: 'storage', message: 'Organizing in MemoryVault...' });
      
      await storeInMemoryVault({
        campaign,
        materials,
        mediaLists,
        plan: strategicPlan
      });

      // Step 5: Open execution dashboard
      setExecutionStatus({ 
        stage: 'complete', 
        message: 'Campaign ready for execution!',
        campaign,
        materials,
        mediaLists
      });

      // Redirect to campaign execution view after 2 seconds
      setTimeout(() => {
        window.location.href = `/campaign-execution/${campaign.id}`;
      }, 2000);

    } catch (error) {
      console.error("Error executing plan:", error);
      setExecutionStatus({ 
        stage: 'error', 
        message: error.message || 'Failed to execute plan' 
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const generateContent = async (type, pillar) => {
    const response = await fetch(
      `${API_BASE_URL}/content/generate-from-pillar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          type,
          pillar,
          context: strategicPlan
        }),
      }
    );
    return response.json();
  };

  const buildMediaList = async (pillar) => {
    const response = await fetch(
      `${API_BASE_URL}/media/build-list`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          beat: pillar.topic || pillar.name,
          tier: pillar.priority === 'high' ? 'tier-1' : 'tier-2',
          context: strategicPlan
        }),
      }
    );
    return response.json();
  };

  const storeInMemoryVault = async (data) => {
    const response = await fetch(
      `${API_BASE_URL}/memory-vault/store-campaign`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(data),
      }
    );
    return response.json();
  };

  // Helper functions
  const extractObjective = (text) => {
    const firstLine = text.split('\n')[0];
    return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  };

  const generatePillars = (data) => {
    // Transform API response into pillars if not already structured
    return data.recommendations?.map((rec, idx) => ({
      id: `pillar-${idx}`,
      name: rec.title || `Strategic Pillar ${idx + 1}`,
      rationale: rec.rationale,
      evidence: rec.evidence,
      tactics: rec.tactics || [],
      timeline: rec.timeline,
      owner: rec.owner || 'Team'
    })) || [];
  };

  const addContextPill = (pillId) => {
    const pill = contextPills.find(p => p.id === pillId);
    if (pill) {
      const contextText = {
        'launch': 'Launch our new product to market with maximum impact',
        'crisis': 'Respond to crisis situation and protect reputation',
        'thought': 'Establish thought leadership in our industry',
        'market': 'Enter new market segment strategically',
        'reputation': 'Build and enhance corporate reputation'
      };
      setGoals(prev => prev ? `${prev}\n\n${contextText[pillId]}` : contextText[pillId]);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{
            fontSize: "3rem",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}>
            Strategic Planning
          </h1>
          <p style={{
            fontSize: "1.25rem",
            color: "#6b7280",
            maxWidth: "600px",
            margin: "0 auto",
          }}>
            Transform goals into evidence-based strategic plans with AI orchestration
          </p>
        </div>

        {!strategicPlan ? (
          /* Goal Input Section */
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}>
              What do you want to achieve?
            </h2>

            {/* Context Pills */}
            <div style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
            }}>
              {contextPills.map(pill => {
                const Icon = pill.icon;
                return (
                  <button
                    key={pill.id}
                    onClick={() => addContextPill(pill.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "9999px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    <Icon style={{ width: "16px", height: "16px" }} />
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Goal Textarea */}
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Describe your goals, timeline, constraints, or paste any relevant context. Be as specific or as broad as you like - Niv will analyze and create a comprehensive strategic plan..."
              style={{
                width: "100%",
                minHeight: "200px",
                padding: "1rem",
                fontSize: "1rem",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit",
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />

            {error && (
              <div style={{
                marginTop: "1rem",
                padding: "1rem",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                <AlertCircle style={{ width: "20px", height: "20px", color: "#dc2626" }} />
                <p style={{ margin: 0, color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <button
              onClick={generateStrategicPlan}
              disabled={!goals.trim() || isGenerating}
              style={{
                marginTop: "1.5rem",
                width: "100%",
                padding: "1rem",
                borderRadius: "8px",
                background: goals.trim() && !isGenerating
                  ? "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)"
                  : "#e5e7eb",
                color: goals.trim() && !isGenerating ? "white" : "#9ca3af",
                border: "none",
                fontSize: "1.125rem",
                fontWeight: "600",
                cursor: goals.trim() && !isGenerating ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
              }}
            >
              {isGenerating ? (
                <>
                  <Loader style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
                  Niv is analyzing and creating your strategic plan...
                </>
              ) : (
                <>
                  <Brain style={{ width: "20px", height: "20px" }} />
                  Create Strategic Plan
                </>
              )}
            </button>
          </div>
        ) : (
          /* Strategic Plan Display */
          <>
            {/* Plan Header */}
            <div style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "2rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
              }}>
                <div>
                  <h2 style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}>
                    {strategicPlan.objective}
                  </h2>
                  <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
                    {strategicPlan.approach}
                  </p>
                  <div style={{
                    display: "flex",
                    gap: "2rem",
                    fontSize: "0.875rem",
                    color: "#6b7280",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Calendar style={{ width: "16px", height: "16px" }} />
                      Timeline: {strategicPlan.timeline}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Target style={{ width: "16px", height: "16px" }} />
                      {strategicPlan.pillars?.length || 0} Strategic Pillars
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={executeStrategicPlan}
                    disabled={isExecuting}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "6px",
                      background: !isExecuting 
                        ? "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)"
                        : "#e5e7eb",
                      color: !isExecuting ? "white" : "#9ca3af",
                      border: "none",
                      cursor: !isExecuting ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                  >
                    {isExecuting ? (
                      <>
                        <Loader style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play style={{ width: "16px", height: "16px" }} />
                        Execute Plan
                      </>
                    )}
                  </button>
                  
                  <SaveToMemoryVaultButton
                    content={JSON.stringify(strategicPlan, null, 2)}
                    title={`Strategic Plan - ${strategicPlan.objective}`}
                    type="strategic-plan"
                    source="strategic-planning"
                    folder_type="strategic-planning"
                    preview={strategicPlan.approach}
                    tags={["strategic-plan", "planning", new Date().getFullYear().toString()]}
                    metadata={{
                      generated_at: strategicPlan.timestamp,
                      project_id: selectedProject?.id,
                      pillars_count: strategicPlan.pillars?.length || 0,
                    }}
                  />
                  
                  <button
                    onClick={() => {
                      setStrategicPlan(null);
                      setGoals("");
                      setExpandedPillars({});
                      setShowEvidence({});
                    }}
                    style={{
                      padding: "0.75rem 1.5rem",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <ArrowRight style={{ width: "16px", height: "16px" }} />
                    New Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Execution Status */}
            {executionStatus && (
              <div style={{
                backgroundColor: executionStatus.stage === 'error' ? "#fef2f2" : "#f0f9ff",
                borderLeft: `4px solid ${executionStatus.stage === 'error' ? "#dc2626" : "#3b82f6"}`,
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "2rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {executionStatus.stage === 'complete' ? (
                    <CheckCircle style={{ width: "24px", height: "24px", color: "#10b981" }} />
                  ) : executionStatus.stage === 'error' ? (
                    <AlertCircle style={{ width: "24px", height: "24px", color: "#dc2626" }} />
                  ) : (
                    <Loader style={{ width: "24px", height: "24px", color: "#3b82f6", animation: "spin 1s linear infinite" }} />
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      {executionStatus.message}
                    </p>
                    {executionStatus.stage === 'complete' && (
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
                        {executionStatus.materials?.length || 0} materials generated • 
                        {executionStatus.mediaLists?.length || 0} media lists built • 
                        Redirecting to execution dashboard...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Strategic Pillars */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                <Target style={{ width: "24px", height: "24px" }} />
                Strategic Pillars
              </h3>
              
              {strategicPlan.pillars?.map((pillar, idx) => (
                <div
                  key={pillar.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    onClick={() => togglePillar(pillar.id)}
                    style={{
                      padding: "1.5rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: expandedPillars[pillar.id] ? "1px solid #e5e7eb" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "#f0f9ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "600",
                        color: "#3b82f6",
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600" }}>
                          {pillar.name}
                        </h4>
                        <p style={{ margin: "0.25rem 0 0 0", color: "#6b7280", fontSize: "0.875rem" }}>
                          {pillar.timeline} • {pillar.owner}
                        </p>
                      </div>
                    </div>
                    {expandedPillars[pillar.id] ? (
                      <ChevronDown style={{ width: "20px", height: "20px", color: "#6b7280" }} />
                    ) : (
                      <ChevronRight style={{ width: "20px", height: "20px", color: "#6b7280" }} />
                    )}
                  </div>

                  {expandedPillars[pillar.id] && (
                    <div style={{ padding: "1.5rem", paddingTop: "0" }}>
                      {/* Rationale with Evidence */}
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h5 style={{ margin: "0 0 0.5rem 0", fontWeight: "600" }}>
                          Rationale
                        </h5>
                        <p style={{ margin: 0, color: "#374151" }}>
                          {pillar.rationale}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEvidence(pillar.id);
                            }}
                            style={{
                              marginLeft: "0.5rem",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              border: "1px solid #3b82f6",
                              backgroundColor: "white",
                              color: "#3b82f6",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <Info style={{ width: "12px", height: "12px" }} />
                            View Evidence
                          </button>
                        </p>
                        
                        {/* Evidence Popover */}
                        {showEvidence[pillar.id] && pillar.evidence && (
                          <div style={{
                            marginTop: "0.5rem",
                            padding: "1rem",
                            backgroundColor: "#f0f9ff",
                            borderLeft: "3px solid #3b82f6",
                            borderRadius: "4px",
                            fontSize: "0.875rem",
                          }}>
                            <h6 style={{ margin: "0 0 0.5rem 0", color: "#1e40af" }}>
                              Supporting Evidence (from MCPs)
                            </h6>
                            {pillar.evidence.map((item, i) => (
                              <div key={i} style={{ marginBottom: "0.5rem" }}>
                                <span style={{ fontWeight: "500" }}>{item.source}:</span> {item.data}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tactics */}
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h5 style={{ margin: "0 0 0.5rem 0", fontWeight: "600" }}>
                          Tactics
                        </h5>
                        <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                          {pillar.tactics.map((tactic, i) => (
                            <li key={i} style={{ marginBottom: "0.25rem", color: "#374151" }}>
                              {tactic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cascade Effects */}
            {strategicPlan.cascadeEffects && (
              <div style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "2rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}>
                <h3 style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <Zap style={{ width: "20px", height: "20px" }} />
                  Predicted Cascade Effects
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                  <div>
                    <h5 style={{ margin: "0 0 0.5rem 0", color: "#dc2626" }}>
                      Immediate (24-48 hours)
                    </h5>
                    {strategicPlan.cascadeEffects.immediate?.map((effect, i) => (
                      <p key={i} style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#374151" }}>
                        • {effect}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h5 style={{ margin: "0 0 0.5rem 0", color: "#f59e0b" }}>
                      Near-term (1-2 weeks)
                    </h5>
                    {strategicPlan.cascadeEffects.nearTerm?.map((effect, i) => (
                      <p key={i} style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#374151" }}>
                        • {effect}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h5 style={{ margin: "0 0 0.5rem 0", color: "#10b981" }}>
                      Long-term (1-3 months)
                    </h5>
                    {strategicPlan.cascadeEffects.longTerm?.map((effect, i) => (
                      <p key={i} style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#374151" }}>
                        • {effect}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Opportunity Windows */}
            {strategicPlan.opportunities && strategicPlan.opportunities.length > 0 && (
              <div style={{
                backgroundColor: "#f0fdf4",
                borderLeft: "4px solid #10b981",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "2rem",
              }}>
                <h3 style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <Clock style={{ width: "20px", height: "20px" }} />
                  Opportunity Windows
                </h3>
                {strategicPlan.opportunities.map((opp, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "0.5rem",
                    color: "#047857",
                  }}>
                    <span style={{ fontWeight: "600" }}>{opp.window}:</span>
                    <span>{opp.action}</span>
                    <span style={{
                      padding: "0.125rem 0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: "#d1fae5",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                    }}>
                      {opp.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}