import React, { useState } from 'react';
import { X, Bot, Send, Sparkles, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
import SimplifiedMediaList from './SimplifiedMediaList';
import SimplifiedContentDraft from './SimplifiedContentDraft';
import SimplifiedStrategicPlanning from './SimplifiedStrategicPlanning';
import OpportunityEngine from '../OpportunityEngine';
import CrisisCommandCenter from '../CrisisCommandCenter';
import Analytics from '../Analytics';
import MemoryVault from '../MemoryVault';

const WorkspaceContainer = ({ workspace, nivContext, onClose, onNivRequest }) => {
  const [nivPanelWidth, setNivPanelWidth] = useState(30); // 30% default
  const [nivInput, setNivInput] = useState('');
  const [nivMessages, setNivMessages] = useState([
    {
      type: 'assistant',
      content: `I'm here to help with ${workspace.type}. I can see you're working on ${workspace.context?.name || 'this task'}. What would you like me to assist with?`
    }
  ]);
  const [isNivMinimized, setIsNivMinimized] = useState(false);

  // Get the appropriate workspace component
  const getWorkspaceComponent = () => {
    const components = {
      'media-intelligence': SimplifiedMediaList,
      'content-generator': SimplifiedContentDraft,
      'strategic-planning': SimplifiedStrategicPlanning,
      'opportunity-engine': OpportunityEngine,
      'crisis-command': CrisisCommandCenter,
      'analytics': Analytics,
      'memory-vault': MemoryVault
    };

    const Component = components[workspace.type] || SimplifiedContentDraft;
    return <Component context={workspace.context} />;
  };

  const handleNivSubmit = () => {
    if (!nivInput.trim()) return;

    // Add user message
    setNivMessages(prev => [...prev, {
      type: 'user',
      content: nivInput
    }]);

    // Simulate Niv response (in production, this would call the API)
    setTimeout(() => {
      setNivMessages(prev => [...prev, {
        type: 'assistant',
        content: getNivResponse(nivInput, workspace.type)
      }]);
    }, 500);

    setNivInput('');
    onNivRequest({ message: nivInput, workspace: workspace.type });
  };

  const getNivResponse = (input, workspaceType) => {
    // Context-aware responses based on workspace
    const responses = {
      'media-intelligence': [
        "I've identified 3 additional journalists who covered similar topics last week. Would you like me to add them to your list?",
        "Jennifer Chen's response rate is highest on Tuesday mornings. I suggest scheduling your outreach then.",
        "This journalist prefers exclusive angles. Consider offering early access to your announcement."
      ],
      'content-generator': [
        "This headline structure increased engagement by 40% in similar campaigns. Want me to adapt it?",
        "I notice the tone might be too promotional for WSJ. Let me suggest a more editorial approach.",
        "Adding a data point here about market growth would strengthen your argument."
      ],
      'strategic-planning': [
        "There's a potential conflict with a competitor event in Week 3. Should we adjust the timeline?",
        "Based on similar campaigns, adding a pre-launch media briefing increased coverage by 60%.",
        "Your critical path might be at risk due to content approval delays. Consider parallel workflows."
      ]
    };

    const workspaceResponses = responses[workspaceType] || responses['content-generator'];
    return workspaceResponses[Math.floor(Math.random() * workspaceResponses.length)];
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: '#0a0a0a',
      position: 'relative'
    }}>
      {/* Header Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        background: 'rgba(0, 0, 0, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        zIndex: 100
      }}>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.color = '#60a5fa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <ChevronLeft size={16} />
          Back to Niv
        </button>

        <div style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
          color: '#ffffff'
        }}>
          {workspace.context?.name || workspace.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>

        <button
          onClick={() => setIsNivMinimized(!isNivMinimized)}
          style={{
            padding: '8px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#9ca3af',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.color = '#60a5fa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          {isNivMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        </button>
      </div>

      {/* Main Workspace Area */}
      <div style={{
        flex: isNivMinimized ? 1 : `0 0 ${100 - nivPanelWidth}%`,
        marginTop: '50px',
        padding: '20px',
        overflowY: 'auto',
        transition: 'flex 0.3s'
      }}>
        {getWorkspaceComponent()}
      </div>

      {/* Niv Assistance Panel */}
      {!isNivMinimized && (
        <div style={{
          width: `${nivPanelWidth}%`,
          marginTop: '50px',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s'
        }}>
          {/* Niv Panel Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(59, 130, 246, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  Niv Assistant
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af'
                }}>
                  Contextual help for {workspace.type.replace('-', ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {nivMessages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 12px',
                  background: message.type === 'user' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: message.type === 'user' ? 'white' : '#e5e7eb',
                  lineHeight: '1.4'
                }}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="text"
                value={nivInput}
                onChange={(e) => setNivInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNivSubmit()}
                placeholder="Ask Niv for help..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  fontSize: '13px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
              <button
                onClick={handleNivSubmit}
                disabled={!nivInput.trim()}
                style={{
                  padding: '8px 12px',
                  background: nivInput.trim() 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: nivInput.trim() ? 'white' : '#6b7280',
                  cursor: nivInput.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (nivInput.trim()) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <Send size={14} />
              </button>
            </div>

            {/* Quick Actions */}
            <div style={{
              marginTop: '8px',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
              {['Suggest improvement', 'Check timing', 'Find similar'].map(action => (
                <button
                  key={action}
                  onClick={() => {
                    setNivInput(action);
                    handleNivSubmit();
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '4px',
                    color: '#60a5fa',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                  }}
                >
                  <Sparkles size={10} style={{ display: 'inline', marginRight: '4px' }} />
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceContainer;