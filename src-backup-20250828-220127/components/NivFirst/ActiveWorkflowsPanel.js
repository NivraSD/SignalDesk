import React, { useState } from 'react';
import { 
  Briefcase, FileText, Users, TrendingUp, AlertTriangle, 
  ChevronRight, ChevronDown, Clock, Zap, CheckCircle,
  AlertCircle, Bot
} from 'lucide-react';

const ActiveWorkflowsPanel = ({ workflows = [], onWorkflowClick, style }) => {
  const [expandedWorkflows, setExpandedWorkflows] = useState({});

  // Mock workflows for demonstration
  const mockWorkflows = [
    {
      id: 'wf-001',
      name: 'Q2 Product Launch',
      status: 'executing',
      progress: 65,
      priority: 'high',
      artifacts: [
        { type: 'media-list', name: 'Tech Journalists', count: 47, status: 'ready', workspace: 'media-intelligence' },
        { type: 'content', name: 'Press Release', count: 1, status: 'draft', workspace: 'content-generator' },
        { type: 'timeline', name: 'Launch Calendar', count: 8, status: 'on-track', workspace: 'strategic-planning' }
      ],
      nivInsight: 'Response window closing in 48h',
      nextAction: 'Review press release draft'
    },
    {
      id: 'wf-002',
      name: 'Crisis Response',
      status: 'urgent',
      progress: 85,
      priority: 'critical',
      artifacts: [
        { type: 'statements', name: 'Holding Statements', count: 3, status: 'approved', workspace: 'crisis-command' },
        { type: 'monitoring', name: 'Media Monitoring', count: 124, status: 'active', workspace: 'analytics' }
      ],
      nivInsight: 'Sentiment stabilizing',
      nextAction: 'Send approved statement'
    }
  ];

  const activeWorkflows = workflows.length > 0 ? workflows : mockWorkflows;

  const toggleWorkflow = (workflowId) => {
    setExpandedWorkflows(prev => ({
      ...prev,
      [workflowId]: !prev[workflowId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent':
      case 'critical':
        return '#ef4444';
      case 'executing':
      case 'active':
        return '#3b82f6';
      case 'ready':
      case 'approved':
        return '#10b981';
      case 'draft':
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getWorkflowIcon = (workflow) => {
    if (workflow.name.toLowerCase().includes('crisis')) return AlertTriangle;
    if (workflow.name.toLowerCase().includes('launch')) return TrendingUp;
    if (workflow.name.toLowerCase().includes('campaign')) return Briefcase;
    return FileText;
  };

  return (
    <div style={{
      ...style,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Briefcase size={18} />
          Active Workflows
        </h2>
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          {activeWorkflows.length} active • Living artifacts
        </div>
      </div>

      {/* Workflows List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px'
      }}>
        {activeWorkflows.map(workflow => {
          const Icon = getWorkflowIcon(workflow);
          const isExpanded = expandedWorkflows[workflow.id];
          
          return (
            <div
              key={workflow.id}
              style={{
                marginBottom: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s'
              }}
            >
              {/* Workflow Header */}
              <div
                onClick={() => toggleWorkflow(workflow.id)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: `linear-gradient(135deg, ${getStatusColor(workflow.status)}33, ${getStatusColor(workflow.status)}66)`,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={16} color={getStatusColor(workflow.status)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {workflow.name}
                      {workflow.priority === 'critical' && (
                        <span style={{
                          padding: '2px 6px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          fontSize: '10px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginTop: '2px'
                    }}>
                      {workflow.artifacts.length} artifacts • {workflow.progress}% complete
                    </div>
                  </div>
                  <div style={{
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}>
                    <ChevronRight size={16} color="#6b7280" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${workflow.progress}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${getStatusColor(workflow.status)}, ${getStatusColor(workflow.status)}88)`,
                    transition: 'width 0.3s'
                  }} />
                </div>

                {/* Niv Insight */}
                {workflow.nivInsight && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Bot size={12} />
                    {workflow.nivInsight}
                  </div>
                )}
              </div>

              {/* Expanded Artifacts */}
              {isExpanded && (
                <div style={{
                  padding: '0 12px 12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {workflow.artifacts.map((artifact, index) => (
                    <div
                      key={index}
                      onClick={() => onWorkflowClick({ ...workflow, selectedArtifact: artifact })}
                      style={{
                        padding: '8px',
                        marginTop: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <FileText size={14} color="#9ca3af" />
                        <div>
                          <div style={{
                            fontSize: '12px',
                            color: '#e5e7eb'
                          }}>
                            {artifact.name}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: '#6b7280'
                          }}>
                            {artifact.count} items
                          </div>
                        </div>
                      </div>
                      <div style={{
                        padding: '2px 6px',
                        background: `${getStatusColor(artifact.status)}22`,
                        color: getStatusColor(artifact.status),
                        fontSize: '10px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        {artifact.status}
                      </div>
                    </div>
                  ))}

                  {/* Next Action */}
                  {workflow.nextAction && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Zap size={12} />
                      Next: {workflow.nextAction}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '11px',
        color: '#6b7280'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span>Active Tasks</span>
          <span style={{ color: '#60a5fa' }}>
            {activeWorkflows.reduce((acc, wf) => acc + wf.artifacts.length, 0)}
          </span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Niv Orchestrated</span>
          <span style={{ color: '#10b981' }}>100%</span>
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkflowsPanel;