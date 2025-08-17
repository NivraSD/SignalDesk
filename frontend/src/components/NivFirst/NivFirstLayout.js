import React, { useState, useCallback } from 'react';
import { Bot, FileText, Users, TrendingUp, AlertTriangle, Zap, BarChart3, ChevronRight } from 'lucide-react';
import NivStrategicOrchestrator from '../NivStrategicOrchestrator';
import WorkspaceContainer from './WorkspaceContainer';

const NivFirstLayout = ({ user, organization }) => {
  const [messages, setMessages] = useState([]);
  const [generatedItems, setGeneratedItems] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  // Handle when Niv creates something
  const handleWorkCardCreate = useCallback((workCard) => {
    // Add inline description to chat
    const inlineMessage = {
      id: Date.now(),
      type: 'work-card',
      content: workCard.data.description,
      workCard: workCard,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, inlineMessage]);
    
    // Add to generated items sidebar
    const newItem = {
      id: Date.now(),
      ...workCard,
      timestamp: new Date(),
      status: 'ready'
    };
    setGeneratedItems(prev => [...prev, newItem]);
  }, []);

  // Get icon for item type
  const getItemIcon = (type) => {
    const icons = {
      'media-list': Users,
      'content-draft': FileText,
      'strategy-plan': TrendingUp,
      'crisis-response': AlertTriangle,
      'opportunity': Zap,
      'analytics': BarChart3
    };
    return icons[type] || FileText;
  };

  // Get workspace type from item type
  const getWorkspaceFromType = (type) => {
    const mapping = {
      'media-list': 'media-intelligence',
      'content-draft': 'content-generator',
      'strategy-plan': 'strategic-planning',
      'crisis-response': 'crisis-command',
      'opportunity': 'opportunity-engine',
      'analytics': 'analytics'
    };
    return mapping[type] || 'content-generator';
  };

  // Handle opening workspace from sidebar
  const handleOpenWorkspace = useCallback((item) => {
    setActiveWorkspace({
      type: getWorkspaceFromType(item.type),
      context: item.data,
      nivAssistance: true
    });
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0a0a0f',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {activeWorkspace ? (
        // Workspace View
        <WorkspaceContainer
          workspace={activeWorkspace}
          nivContext={{}}
          onClose={() => setActiveWorkspace(null)}
          onNivRequest={(request) => {
            console.log('Niv assistance requested:', request);
          }}
        />
      ) : (
        <>
          {/* Main Niv Conversation Area - 70% width */}
          <div style={{
            width: '70%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)',
            position: 'relative'
          }}>
            {/* Niv Header */}
            <div style={{
              padding: '20px 30px',
              background: 'rgba(15, 15, 30, 0.8)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                }}>
                  <Bot size={24} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    Niv Strategic Orchestrator
                  </div>
                  <div style={{ fontSize: '12px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      borderRadius: '50%'
                    }} />
                    Active • Strategic Mode
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation Area - Scrollable */}
            <div style={{
              flex: 1,
              padding: '30px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <NivStrategicOrchestrator
                messages={messages}
                setMessages={setMessages}
                onWorkCardCreate={handleWorkCardCreate}
                onFeatureOpen={() => {}}
                onContentGenerate={() => {}}
                onStrategicPlanGenerate={() => {}}
              />
              
              {/* Display inline work cards */}
              {messages.filter(m => m.type === 'work-card').map(msg => (
                <div key={msg.id} style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  animation: 'slideIn 0.5s ease-out'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {React.createElement(getItemIcon(msg.workCard.type), { size: 16, color: 'white' })}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                        {msg.workCard.data.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8b5cf6' }}>
                        Niv is creating this for you
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#e0e0e0',
                    lineHeight: '1.5'
                  }}>
                    {msg.content}
                  </div>
                  {msg.workCard.data.details && (
                    <div style={{
                      display: 'flex',
                      gap: '15px',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(139, 92, 246, 0.1)'
                    }}>
                      {Object.entries(msg.workCard.data.details).map(([key, value]) => (
                        <div key={key} style={{ fontSize: '12px' }}>
                          <span style={{ color: '#9ca3af' }}>{key}: </span>
                          <span style={{ color: '#8b5cf6', fontWeight: '500' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* Right Sidebar - Generated Items - 30% width */}
          <div style={{
            width: '30%',
            background: 'rgba(15, 15, 30, 0.95)',
            borderLeft: '1px solid rgba(139, 92, 246, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Sidebar Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff'
              }}>
                Generated by Niv
              </h3>
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginTop: '4px'
              }}>
                {generatedItems.length} items ready to work on
              </div>
            </div>

            {/* Generated Items List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px'
            }}>
              {generatedItems.map(item => {
                const Icon = getItemIcon(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenWorkspace(item)}
                    style={{
                      background: 'rgba(30, 30, 45, 0.4)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                      e.currentTarget.style.transform = 'translateX(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 30, 45, 0.4)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        background: `linear-gradient(135deg, #6366f1, #8b5cf6)`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={18} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#fff',
                          marginBottom: '4px'
                        }}>
                          {item.data.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#9ca3af'
                        }}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <ChevronRight size={16} color="#8b5cf6" />
                    </div>
                    {item.status === 'ready' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        borderRadius: '4px',
                        fontSize: '10px',
                        display: 'inline-block'
                      }}>
                        Ready to edit
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NivFirstLayout;