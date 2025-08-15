import React, { useState, useEffect } from "react";
import { useProject } from "../contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import SaveToMemoryVaultButton from "./MemoryVault/SaveToMemoryVaultButton";
import strategicPlanningService from '../services/strategicPlanningService';
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
  Info,
  X,
  Copy,
  Save
} from "lucide-react";
import "./StrategicPlanning.css";

export default function StrategicPlanning() {
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");
  const [constraints, setConstraints] = useState("");
  const [timeline, setTimeline] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState(null);
  const [error, setError] = useState(null);
  const [expandedPillars, setExpandedPillars] = useState({});
  const [showEvidence, setShowEvidence] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [showPlanOverlay, setShowPlanOverlay] = useState(false);
  const [savedPlans, setSavedPlans] = useState([]);
  const { selectedProject } = useProject();
  const navigate = useNavigate();

  // Context pills for quick starts
  const contextPills = [
    { id: 'launch', label: 'Product Launch', icon: Sparkles, color: '#10b981' },
    { id: 'crisis', label: 'Crisis Response', icon: Shield, color: '#ef4444' },
    { id: 'thought', label: 'Thought Leadership', icon: Brain, color: '#8b5cf6' },
    { id: 'market', label: 'Market Entry', icon: Globe, color: '#3b82f6' },
    { id: 'reputation', label: 'Reputation Building', icon: TrendingUp, color: '#f59e0b' }
  ];

  const planningTypes = [
    { id: 'comprehensive', label: 'Comprehensive Strategy', icon: Brain, desc: 'Full strategic plan with all components' },
    { id: 'crisis', label: 'Crisis Management', icon: Shield, desc: 'Rapid response strategic planning' },
    { id: 'campaign', label: 'Campaign Strategy', icon: Target, desc: 'Focused campaign planning' },
    { id: 'launch', label: 'Product Launch', icon: Sparkles, desc: 'Go-to-market strategic plan' }
  ];

  const [selectedPlanType, setSelectedPlanType] = useState('comprehensive');

  useEffect(() => {
    loadSavedPlans();
  }, []);

  const loadSavedPlans = () => {
    const plans = strategicPlanningService.getPlansFromLocalStorage();
    setSavedPlans(plans);
  };

  const togglePillar = (pillarId) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  const generateStrategicPlan = async () => {
    if (!objective.trim()) {
      setError("Please describe your objective");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Show the overlay immediately
      setShowPlanOverlay(true);
      
      // Call the Supabase Edge Function
      const result = await strategicPlanningService.generatePlan(
        objective,
        context,
        constraints,
        timeline
      );

      if (!result || (!result.success && !result.data)) {
        throw new Error("Failed to generate strategic plan");
      }

      // Use the plan data from service
      const plan = result.data || result;
      setStrategicPlan(plan);

      // Save to localStorage
      strategicPlanningService.savePlanToLocalStorage(plan);
      loadSavedPlans();

      // Auto-expand first pillar
      if (plan.strategic_pillars && plan.strategic_pillars.length > 0) {
        setExpandedPillars({ 0: true });
      }
    } catch (error) {
      console.error("Error generating strategic plan:", error);
      setError(error.message || "Failed to generate strategic plan");
      setShowPlanOverlay(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const closePlanOverlay = () => {
    setShowPlanOverlay(false);
    setStrategicPlan(null);
    setExpandedPillars({});
    setShowEvidence({});
  };

  const copyPlanToClipboard = () => {
    if (!strategicPlan) return;
    
    const planText = `
STRATEGIC PLAN: ${strategicPlan.objective}

EXECUTIVE SUMMARY:
${strategicPlan.executive_summary}

STRATEGIC PILLARS:
${strategicPlan.strategic_pillars?.map((pillar, index) => 
  `${index + 1}. ${pillar.title}
     ${pillar.description}
     Actions: ${pillar.actions?.join(', ') || 'Not specified'}
     Timeline: ${pillar.timeline || 'TBD'}
     MCP Assignment: ${pillar.mcp || 'Not assigned'}`
).join('\n\n')}

IMPLEMENTATION PHASES:
${strategicPlan.implementation_phases?.map(phase => 
  `• ${phase.phase}: ${phase.duration} - ${phase.tasks?.join(', ')}`
).join('\n')}

SUCCESS METRICS:
${strategicPlan.success_metrics?.map(metric => `• ${metric}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(planText);
  };

  const executeStrategicPlan = async () => {
    if (!strategicPlan) return;

    setIsExecuting(true);
    setExecutionStatus({ stage: 'initializing', message: 'Creating campaign...' });

    try {
      // Generate campaign from strategic plan
      const campaign = strategicPlanningService.generateCampaignFromPlan(strategicPlan);
      
      setExecutionStatus({ stage: 'campaign', message: 'Campaign created successfully!' });
      
      // Navigate to Campaign Execution Dashboard after delay
      setTimeout(() => {
        navigate(`/projects/${selectedProject?.id}/campaign-execution/${campaign.id}`);
      }, 2000);

    } catch (error) {
      console.error("Error executing strategic plan:", error);
      setExecutionStatus({ stage: 'error', message: 'Execution failed: ' + error.message });
    } finally {
      setTimeout(() => {
        setIsExecuting(false);
        setExecutionStatus(null);
      }, 3000);
    }
  };

  const addContextPill = (pillId) => {
    const pill = contextPills.find(p => p.id === pillId);
    if (pill) {
      const contextText = {
        'launch': 'Launch our new product to market with maximum impact and strategic positioning',
        'crisis': 'Respond to crisis situation effectively while protecting reputation and stakeholder trust',
        'thought': 'Establish thought leadership in our industry through strategic content and positioning',
        'market': 'Enter new market segment strategically with proper research and positioning',
        'reputation': 'Build and enhance corporate reputation through strategic communications'
      };
      setContext(prev => prev ? `${prev}\n\n${contextText[pillId]}` : contextText[pillId]);
    }
  };

  const loadSavedPlan = (plan) => {
    setStrategicPlan(plan);
    setShowPlanOverlay(true);
    setObjective(plan.objective || '');
    setContext(plan.context || '');
    setConstraints(plan.constraints || '');
    setTimeline(plan.timeline || '');
  };

  return (
    <div className="strategic-planning-container">
      <div className="strategic-planning-main">
        {/* Header */}
        <div className="strategic-header">
          <div className="strategic-title">
            <Brain className="title-icon" />
            <h1>Strategic Planning</h1>
          </div>
          <p className="strategic-subtitle">
            Transform goals into evidence-based strategic plans with AI orchestration
          </p>
        </div>

        {/* Planning Type Selection */}
        <div className="plan-type-selector">
          <h3>Select Planning Type</h3>
          <div className="plan-types">
            {planningTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className={`plan-type ${selectedPlanType === type.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlanType(type.id)}
                >
                  <Icon className="plan-type-icon" />
                  <div className="plan-type-content">
                    <h4>{type.label}</h4>
                    <p>{type.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Input Form */}
        <div className="strategic-form">
          <div className="form-group">
            <label htmlFor="objective">
              <Target className="form-icon" />
              Strategic Objective
            </label>
            <textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe what you want to achieve..."
              rows="3"
            />
          </div>

          {/* Context Pills */}
          <div className="context-pills">
            <label>Quick Context:</label>
            <div className="pills-container">
              {contextPills.map((pill) => {
                const Icon = pill.icon;
                return (
                  <button
                    key={pill.id}
                    className="context-pill"
                    onClick={() => addContextPill(pill.id)}
                    style={{ borderColor: pill.color }}
                  >
                    <Icon className="pill-icon" style={{ color: pill.color }} />
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="context">
                <Info className="form-icon" />
                Context
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Additional context, background, or situation..."
                rows="4"
              />
            </div>
            <div className="form-group half">
              <label htmlFor="constraints">
                <AlertCircle className="form-icon" />
                Constraints
              </label>
              <textarea
                id="constraints"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="Budget, timeline, or other limitations..."
                rows="4"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="timeline">
              <Clock className="form-icon" />
              Timeline
            </label>
            <input
              type="text"
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="e.g., 3 months, Q1 2025, etc."
            />
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle className="error-icon" />
              {error}
            </div>
          )}

          <button
            className="generate-btn"
            onClick={generateStrategicPlan}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader className="loading-icon" />
                Generating Strategic Plan...
              </>
            ) : (
              <>
                <Sparkles className="btn-icon" />
                Generate Strategic Plan
              </>
            )}
          </button>
        </div>

        {/* Saved Plans Sidebar */}
        <div className="saved-plans-sidebar">
          <h3>Recent Plans</h3>
          {savedPlans.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-icon" />
              <p>No saved plans yet</p>
            </div>
          ) : (
            <div className="plans-list">
              {savedPlans.slice(-5).reverse().map((plan) => (
                <div key={plan.id} className="plan-item">
                  <h4>{plan.objective?.substring(0, 60)}...</h4>
                  <span className="plan-date">
                    {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => loadSavedPlan(plan)}
                    className="load-plan-btn"
                  >
                    <Eye className="btn-icon" />
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strategic Plan Overlay - Content Generator Style */}
      {showPlanOverlay && strategicPlan && (
        <div className="strategic-overlay">
          <div className="strategic-overlay-content">
            <div className="overlay-header">
              <div className="overlay-title">
                <Brain className="title-icon" />
                <h2>Strategic Plan Generated</h2>
              </div>
              <div className="overlay-actions">
                <button onClick={copyPlanToClipboard} className="action-btn">
                  <Copy className="btn-icon" />
                  Copy
                </button>
                <SaveToMemoryVaultButton
                  title={`Strategic Plan: ${strategicPlan.objective}`}
                  content={JSON.stringify(strategicPlan, null, 2)}
                  category="strategic-planning"
                  tags={['strategy', 'planning', selectedPlanType]}
                />
                <button onClick={executeStrategicPlan} className="execute-btn" disabled={isExecuting}>
                  {isExecuting ? (
                    <>
                      <Loader className="loading-icon" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="btn-icon" />
                      Execute Plan
                    </>
                  )}
                </button>
                <button onClick={closePlanOverlay} className="close-btn">
                  <X className="btn-icon" />
                </button>
              </div>
            </div>

            <div className="overlay-body">
              {/* Executive Summary */}
              <div className="plan-section">
                <h3>
                  <Target className="section-icon" />
                  Executive Summary
                </h3>
                <p className="executive-summary">{strategicPlan.executive_summary}</p>
              </div>

              {/* Strategic Pillars */}
              <div className="plan-section">
                <h3>
                  <Lightbulb className="section-icon" />
                  Strategic Pillars
                </h3>
                <div className="pillars-container">
                  {strategicPlan.strategic_pillars?.map((pillar, index) => (
                    <div key={index} className="pillar-card">
                      <div
                        className="pillar-header"
                        onClick={() => togglePillar(index)}
                      >
                        <h4>{pillar.title}</h4>
                        {expandedPillars[index] ? <ChevronDown /> : <ChevronRight />}
                      </div>
                      
                      {expandedPillars[index] && (
                        <div className="pillar-content">
                          <p className="pillar-description">{pillar.description}</p>
                          
                          {pillar.actions && (
                            <div className="pillar-actions">
                              <h5>Actions:</h5>
                              <ul>
                                {pillar.actions.map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="pillar-meta">
                            <span className="timeline">
                              <Clock className="meta-icon" />
                              {pillar.timeline || 'TBD'}
                            </span>
                            <span className="mcp">
                              <Zap className="meta-icon" />
                              {pillar.mcp || 'Content Generator'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Implementation Phases */}
              {strategicPlan.implementation_phases && (
                <div className="plan-section">
                  <h3>
                    <Calendar className="section-icon" />
                    Implementation Phases
                  </h3>
                  <div className="phases-timeline">
                    {strategicPlan.implementation_phases.map((phase, index) => (
                      <div key={index} className="phase-item">
                        <div className="phase-marker">{index + 1}</div>
                        <div className="phase-content">
                          <h4>{phase.phase}</h4>
                          <p className="phase-duration">{phase.duration}</p>
                          <ul className="phase-tasks">
                            {phase.tasks?.map((task, taskIndex) => (
                              <li key={taskIndex}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Metrics */}
              {strategicPlan.success_metrics && (
                <div className="plan-section">
                  <h3>
                    <BarChart3 className="section-icon" />
                    Success Metrics
                  </h3>
                  <div className="metrics-grid">
                    {strategicPlan.success_metrics.map((metric, index) => (
                      <div key={index} className="metric-item">
                        <CheckCircle className="metric-icon" />
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Mitigation */}
              {strategicPlan.risk_mitigation && (
                <div className="plan-section">
                  <h3>
                    <Shield className="section-icon" />
                    Risk Mitigation
                  </h3>
                  <div className="risks-container">
                    {strategicPlan.risk_mitigation.map((risk, index) => (
                      <div key={index} className="risk-item">
                        <div className="risk-title">
                          <AlertCircle className="risk-icon" />
                          {risk.risk}
                        </div>
                        <div className="risk-strategy">{risk.strategy}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Execution Status */}
            {executionStatus && (
              <div className="execution-status">
                <div className="status-content">
                  {executionStatus.stage === 'error' ? (
                    <AlertCircle className="status-icon error" />
                  ) : (
                    <Loader className="status-icon loading" />
                  )}
                  <span>{executionStatus.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}