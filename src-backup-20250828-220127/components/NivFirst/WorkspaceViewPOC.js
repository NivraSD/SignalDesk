import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Save, Download, Copy } from 'lucide-react';
import nivStateManager from './NivStateManager';
import SimplifiedMediaList from './SimplifiedMediaList';
import SimplifiedContentDraft from './SimplifiedContentDraft';
import SimplifiedStrategicPlanning from './SimplifiedStrategicPlanning';
import SimplifiedGenericContent from './SimplifiedGenericContent';
import supabaseApiService from '../../services/supabaseApiService';

// PROOF OF CONCEPT: Workspace View with Mini Niv Assistant
// This replaces the entire view when a work item is opened

const WorkspaceViewPOC = ({ onBack }) => {
  const [activeWorkItem, setActiveWorkItem] = useState(null);
  const [nivInput, setNivInput] = useState('');
  const [nivMessages, setNivMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Get the active workspace from state manager
    const currentWorkspace = nivStateManager.getActiveWorkspace();
    if (currentWorkspace) {
      setActiveWorkItem(currentWorkspace);
      // Add initial context message
      setNivMessages([{
        type: 'assistant',
        content: `I'm here to help you with this ${currentWorkspace.type.replace('-', ' ')}. You can ask me to make edits, add content, or answer questions about it.`
      }]);
    }
  }, []);

  const handleNivMessage = async () => {
    if (!nivInput.trim() || isProcessing) return;

    const userMessage = nivInput.trim();
    setNivInput('');
    setIsProcessing(true);

    // Add user message to chat
    setNivMessages(prev => [...prev, {
      type: 'user',
      content: userMessage
    }]);

    try {
      // Call Niv with context about the current work item
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        context: {
          mode: 'workspace_assistant',
          workItemType: activeWorkItem.type,
          workItemTitle: activeWorkItem.title,
          hasContent: !!activeWorkItem.generatedContent
        },
        messages: nivMessages
      });

      // Add Niv's response
      if (response.response) {
        setNivMessages(prev => [...prev, {
          type: 'assistant',
          content: response.response
        }]);
      }

      // Handle any updates to the work item
      if (response.updates) {
        // Update the work item through state manager
        console.log('Applying updates to work item:', response.updates);
      }

    } catch (error) {
      console.error('Error calling Niv:', error);
      setNivMessages(prev => [...prev, {
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderWorkspace = () => {
    if (!activeWorkItem) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          No work item selected
        </div>
      );
    }

    const context = {
      title: activeWorkItem.title,
      description: activeWorkItem.description,
      generatedContent: activeWorkItem.generatedContent,
      ...activeWorkItem.metadata
    };

    // Route to the appropriate component based on type
    switch (activeWorkItem.type) {
      case 'media-list':
        return <SimplifiedMediaList context={context} />;
      case 'content-draft':
        return <SimplifiedContentDraft context={context} />;
      case 'strategy-plan':
        return <SimplifiedStrategicPlanning context={context} />;
      default:
        return <SimplifiedGenericContent context={context} />;
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: '#0a0a0f',
      overflow: 'hidden'
    }}>
      {/* Main Workspace Area - 75% */}
      <div style={{
        flex: '1 1 75%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        {/* Header with Back Button */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          background: 'rgba(30, 30, 45, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={() => {
              nivStateManager.closeWorkspace();
              if (onBack) onBack();
            }}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <ArrowLeft size={16} />
            Back to Chat
          </button>
          
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              color: '#e8e8e8',
              fontWeight: '600'
            }}>
              {activeWorkItem?.title || 'Workspace'}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '6px',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <Copy size={14} />
              Copy
            </button>
            <button
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '6px',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <Download size={14} />
              Export
            </button>
            <button
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Workspace Content */}
        <div style={{
          flex: 1,
          overflow: 'hidden'
        }}>
          {renderWorkspace()}
        </div>
      </div>

      {/* Niv Assistant Panel - 25% */}
      <div style={{
        width: '25%',
        minWidth: '300px',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(20, 20, 30, 0.6)'
      }}>
        {/* Niv Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={18} color="#8b5cf6" />
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#e8e8e8'
            }}>
              Niv Assistant
            </span>
          </div>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '11px',
            color: '#9ca3af'
          }}>
            Ask me to edit, enhance, or explain
          </p>
        </div>

        {/* Niv Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {nivMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: msg.type === 'user'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : msg.type === 'error'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(30, 30, 45, 0.8)',
                color: msg.type === 'user' ? '#ffffff' : '#e8e8e8',
                fontSize: '13px',
                lineHeight: '1.5'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(30, 30, 45, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                  Thinking...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Niv Input */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          background: 'rgba(30, 30, 45, 0.4)'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={nivInput}
              onChange={(e) => setNivInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNivMessage()}
              placeholder="Ask Niv to help edit..."
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#e8e8e8',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleNivMessage}
              disabled={!nivInput.trim() || isProcessing}
              style={{
                padding: '10px 16px',
                background: isProcessing
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .typing-indicator {
          display: flex;
          gap: 3px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: #8b5cf6;
          border-radius: 50%;
          animation: typing 1.4s ease-in-out infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkspaceViewPOC;