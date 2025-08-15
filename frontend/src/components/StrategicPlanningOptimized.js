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
import "./StrategicPlanningOptimized.css";

export default function StrategicPlanningOptimized() {
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
  const [activeTab, setActiveTab] = useState('create');
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
    { id: 'comprehensive', label: 'Comprehensive', icon: Brain, desc: 'Full strategic plan' },
    { id: 'crisis', label: 'Crisis Response', icon: Shield, desc: 'Rapid response plan' },
    { id: 'campaign', label: 'Campaign', icon: Target, desc: 'Focused campaign' },
    { id: 'launch', label: 'Product Launch', icon: Sparkles, desc: 'Go-to-market plan' }
  ];

  const [selectedPlanType, setSelectedPlanType] = useState('comprehensive');

  const tabs = [
    { id: 'create', label: 'Create Plan', icon: Brain },
    { id: 'saved', label: 'Saved Plans', icon: Save },
    { id: 'history', label: 'Analytics', icon: BarChart3 }
  ];

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
      setShowPlanOverlay(true);
      
      const result = await strategicPlanningService.generatePlan(
        objective,
        context,
        constraints,
        timeline
      );

      if (!result || (!result.success && !result.data)) {
        throw new Error("Failed to generate strategic plan");
      }

      const plan = result.data || result;
      setStrategicPlan(plan);

      strategicPlanningService.savePlanToLocalStorage(plan);
      loadSavedPlans();

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
      const campaign = strategicPlanningService.generateCampaignFromPlan(strategicPlan);
      
      setExecutionStatus({ stage: 'campaign', message: 'Campaign created successfully!' });
      
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
    <div className="strategic-planning-optimized">
      {/* Tab Navigation */}
      <div className="strategic-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="tab-icon" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="strategic-content">
        {/* Create Plan Tab */}
        {activeTab === 'create' && (
          <div className="create-plan-tab">
            {/* Planning Type Selection */}
            <div className="plan-type-section">
              <h3>Planning Type</h3>
              <div className="plan-types-compact">
                {planningTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.id}
                      className={`plan-type-compact ${selectedPlanType === type.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPlanType(type.id)}
                    >
                      <Icon className="plan-type-icon-small" />
                      <div>
                        <div className="plan-type-label">{type.label}</div>
                        <div className="plan-type-desc">{type.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Section */}
            <div className="form-section">
              <div className="form-group-compact">
                <label>
                  <Target className="form-icon-small" />
                  Objective
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="What do you want to achieve?"
                  rows="2"
                />
              </div>

              {/* Context Pills */}
              <div className="context-pills-compact">
                <label>Quick Context:</label>
                <div className="pills-row">
                  {contextPills.map((pill) => {
                    const Icon = pill.icon;
                    return (
                      <button
                        key={pill.id}
                        className="context-pill-small"
                        onClick={() => addContextPill(pill.id)}
                        style={{ borderColor: pill.color }}
                      >
                        <Icon className="pill-icon-small" style={{ color: pill.color }} />
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-row-compact">
                <div className="form-group-half">
                  <label>
                    <Info className="form-icon-small" />
                    Context
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Background, situation..."
                    rows="2"
                  />
                </div>
                <div className="form-group-half">
                  <label>
                    <AlertCircle className="form-icon-small" />
                    Constraints
                  </label>
                  <textarea
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="Budget, timeline limits..."
                    rows="2"
                  />
                </div>
              </div>

              <div className="form-group-compact">
                <label>
                  <Clock className="form-icon-small" />
                  Timeline
                </label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g., 3 months, Q1 2025"
                />
              </div>

              {error && (
                <div className="error-message-compact">
                  <AlertCircle className="error-icon-small" />
                  {error}
                </div>
              )}

              <button
                className="generate-btn-compact"
                onClick={generateStrategicPlan}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader className="loading-icon-small" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="btn-icon-small" />
                    Generate Plan
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Saved Plans Tab */}
        {activeTab === 'saved' && (
          <div className="saved-plans-tab">
            <h3>Saved Strategic Plans</h3>
            {savedPlans.length === 0 ? (
              <div className="empty-state-compact">
                <FileText className="empty-icon-small" />
                <p>No saved plans yet</p>
              </div>
            ) : (
              <div className="plans-grid">
                {savedPlans.map((plan) => (
                  <div key={plan.id} className="plan-card">
                    <h4>{plan.objective?.substring(0, 50)}...</h4>
                    <div className="plan-meta">
                      <span className="plan-date">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </span>
                      <span className="plan-type">{selectedPlanType}</span>
                    </div>
                    <button
                      onClick={() => loadSavedPlan(plan)}
                      className="load-btn-compact"
                    >
                      <Eye className="btn-icon-tiny" />
                      View Plan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'history' && (
          <div className="analytics-tab">
            <h3>Plan Analytics</h3>
            <div className="analytics-placeholder">
              <BarChart3 className="analytics-icon" />
              <p>Analytics and performance tracking coming soon</p>
              <div className="analytics-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Plans</span>
                  <span className="stat-value">{savedPlans.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">This Month</span>
                  <span className="stat-value">
                    {savedPlans.filter(plan => 
                      new Date(plan.created_at).getMonth() === new Date().getMonth()
                    ).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strategic Plan Overlay - Now with dark theme */}
      {showPlanOverlay && strategicPlan && (
        <div className="strategic-overlay-dark">
          <div className="strategic-overlay-content-dark">
            <div className="overlay-header-dark">
              <div className="overlay-title-dark">
                <Brain className="title-icon-dark" />
                <h2>Strategic Plan Generated</h2>
              </div>
              <div className="overlay-actions-dark">
                <button onClick={copyPlanToClipboard} className="action-btn-dark">
                  <Copy className="btn-icon-small" />
                  Copy
                </button>
                <SaveToMemoryVaultButton
                  title={`Strategic Plan: ${strategicPlan.objective}`}
                  content={JSON.stringify(strategicPlan, null, 2)}
                  category="strategic-planning"
                  tags={['strategy', 'planning', selectedPlanType]}
                />
                <button onClick={executeStrategicPlan} className="execute-btn-dark" disabled={isExecuting}>
                  {isExecuting ? (
                    <>
                      <Loader className="loading-icon-small" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="btn-icon-small" />
                      Execute
                    </>
                  )}
                </button>
                <button onClick={closePlanOverlay} className="close-btn-dark">
                  <X className="btn-icon-small" />
                </button>
              </div>
            </div>

            <div className="overlay-body-dark">
              {/* Executive Summary */}
              <div className="plan-section-dark">
                <h3>
                  <Target className="section-icon-dark" />
                  Executive Summary
                </h3>
                <p className="executive-summary-dark">{strategicPlan.executive_summary}</p>
              </div>

              {/* Strategic Pillars */}
              <div className="plan-section-dark">
                <h3>
                  <Lightbulb className="section-icon-dark" />
                  Strategic Pillars
                </h3>
                <div className="pillars-container-dark">
                  {strategicPlan.strategic_pillars?.map((pillar, index) => (
                    <div key={index} className="pillar-card-dark">
                      <div
                        className="pillar-header-dark"
                        onClick={() => togglePillar(index)}
                      >
                        <h4>{pillar.title}</h4>
                        {expandedPillars[index] ? <ChevronDown /> : <ChevronRight />}
                      </div>
                      
                      {expandedPillars[index] && (
                        <div className="pillar-content-dark">
                          <p className="pillar-description-dark">{pillar.description}</p>
                          
                          {pillar.actions && (
                            <div className="pillar-actions-dark">
                              <h5>Actions:</h5>
                              <ul>
                                {pillar.actions.map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="pillar-meta-dark">
                            <span className="timeline-dark">
                              <Clock className="meta-icon-small" />
                              {pillar.timeline || 'TBD'}
                            </span>
                            <span className="mcp-dark">
                              <Zap className="meta-icon-small" />
                              {pillar.mcp || 'Content Generator'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Metrics */}
              {strategicPlan.success_metrics && (
                <div className="plan-section-dark">
                  <h3>
                    <BarChart3 className="section-icon-dark" />
                    Success Metrics
                  </h3>
                  <div className="metrics-grid-dark">
                    {strategicPlan.success_metrics.map((metric, index) => (
                      <div key={index} className="metric-item-dark">
                        <CheckCircle className="metric-icon-small" />
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Execution Status */}
            {executionStatus && (
              <div className="execution-status-dark">
                <div className="status-content-dark">
                  {executionStatus.stage === 'error' ? (
                    <AlertCircle className="status-icon-small error" />
                  ) : (
                    <Loader className="status-icon-small loading" />
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