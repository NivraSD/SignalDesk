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

export default function StrategicPlanningOptimized({ initialData, onDataChange }) {
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
    { id: 'current', label: 'Current Plan', icon: FileText },
    { id: 'saved', label: 'Saved Plans', icon: Save },
    { id: 'history', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    loadSavedPlans();
  }, []);
  
  // Handle initial data from Niv
  useEffect(() => {
    if (initialData) {
      setObjective(initialData.objective || '');
      setContext(initialData.context || '');
      setConstraints(initialData.constraints || '');
      setTimeline(initialData.timeline || '');
      
      // Set plan type if provided
      if (initialData.planType) {
        setSelectedPlanType(initialData.planType);
      }
      
      // Auto-generate if all required data is present
      if (initialData.objective && initialData.autoGenerate) {
        generateStrategicPlan();
      }
    }
  }, [initialData]);

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
      
      // Switch to current plan tab to show the generated plan
      setActiveTab('current');
    } catch (error) {
      console.error("Error generating strategic plan:", error);
      setError(error.message || "Failed to generate strategic plan");
    } finally {
      setIsGenerating(false);
    }
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
    setActiveTab('current'); // Switch to Current Plan tab to show the plan inline
    setObjective(plan.objective || '');
    setContext(plan.context || '');
    setConstraints(plan.constraints || '');
    setTimeline(plan.timeline || '');
    
    // Auto-expand first pillar
    if (plan.strategic_pillars && plan.strategic_pillars.length > 0) {
      setExpandedPillars({ 0: true });
    }
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

        {/* Current Plan Tab - Shows generated plan inline */}
        {activeTab === 'current' && (
          <div className="current-plan-tab">
            {strategicPlan ? (
              <div className="current-plan-view">
                {/* Plan Header */}
                <div className="plan-header-inline">
                  <div className="plan-meta-inline">
                    <div className="ai-badge">
                      <Brain size={12} />
                      AI Generated Plan
                    </div>
                    <span className="plan-type-badge">{selectedPlanType}</span>
                  </div>
                  <div className="plan-actions-inline">
                    <button onClick={() => setActiveTab('create')} className="back-btn-inline">
                      <ArrowRight size={14} />
                      New Plan
                    </button>
                    <button onClick={copyPlanToClipboard} className="copy-btn-inline">
                      <Copy size={14} />
                      Copy
                    </button>
                    <button onClick={executeStrategicPlan} className="execute-btn-inline" disabled={isExecuting}>
                      {isExecuting ? (
                        <>
                          <Loader className="loading-icon-tiny" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          Execute
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Plan Content */}
                <div className="plan-content-inline">
                  <h3 className="plan-objective">{strategicPlan.objective}</h3>
                  
                  {/* Executive Summary */}
                  <div className="plan-section-inline">
                    <h4>
                      <Target size={16} />
                      Executive Summary
                    </h4>
                    <p className="executive-summary-inline">{strategicPlan.executive_summary}</p>
                  </div>

                  {/* Strategic Pillars */}
                  <div className="plan-section-inline">
                    <h4>
                      <Lightbulb size={16} />
                      Strategic Pillars ({strategicPlan.strategic_pillars?.length || 0})
                    </h4>
                    <div className="pillars-inline">
                      {strategicPlan.strategic_pillars?.map((pillar, index) => (
                        <div key={index} className="pillar-inline">
                          <div
                            className="pillar-header-inline-toggle"
                            onClick={() => togglePillar(index)}
                          >
                            <h5>{pillar.title}</h5>
                            {expandedPillars[index] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                          
                          {expandedPillars[index] && (
                            <div className="pillar-details-inline">
                              <p>{pillar.description}</p>
                              {pillar.actions && (
                                <div className="pillar-actions-inline">
                                  <strong>Actions:</strong>
                                  <ul>
                                    {pillar.actions.map((action, actionIndex) => (
                                      <li key={actionIndex}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="pillar-meta-inline">
                                <span>
                                  <Clock size={14} />
                                  {pillar.timeline || 'TBD'}
                                </span>
                                <span>
                                  <Zap size={14} />
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
                    <div className="plan-section-inline">
                      <h4>
                        <BarChart3 size={16} />
                        Success Metrics
                      </h4>
                      <div className="metrics-inline">
                        {strategicPlan.success_metrics.map((metric, index) => (
                          <div key={index} className="metric-inline">
                            <CheckCircle size={14} />
                            <span>{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Execution Status */}
                {executionStatus && (
                  <div className="execution-status-inline">
                    <div className="status-content-inline">
                      {executionStatus.stage === 'error' ? (
                        <AlertCircle className="status-icon-inline error" />
                      ) : (
                        <Loader className="status-icon-inline loading" />
                      )}
                      <span>{executionStatus.message}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-plan-state">
                <FileText className="no-plan-icon" />
                <h3>No Strategic Plan Generated</h3>
                <p>Generate a strategic plan from the Create Plan tab to view it here.</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '1.5rem' }}>
                  Debug: strategicPlan = {strategicPlan ? 'EXISTS' : 'NULL'}
                </p>
                <button onClick={() => setActiveTab('create')} className="create-plan-btn">
                  <Brain size={16} />
                  Create Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Saved Plans Tab */}
        {activeTab === 'saved' && (
          <div className="saved-plans-tab">
            <h3>Saved Strategic Plans ({savedPlans.length})</h3>
            {savedPlans.length === 0 ? (
              <div className="empty-state-compact">
                <FileText className="empty-icon-small" />
                <p>No saved plans yet</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Generate a plan from the Create Plan tab to see it here.
                </p>
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
                      <span className="plan-type">Strategic Plan</span>
                    </div>
                    <button
                      onClick={() => {
                        console.log('Loading saved plan:', plan);
                        loadSavedPlan(plan);
                      }}
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

    </div>
  );
}