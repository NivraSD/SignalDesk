import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  CheckCircle, 
  Bot, 
  AlertTriangle,
  Clock,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Lightbulb,
  Package,
  Target
} from 'lucide-react';
import supabaseApiService from '../../services/supabaseApiService';
import nivStateManager from './NivStateManager';
import NivConversationPhases from './NivConversationPhases';

// Enhanced chat with phase-aware UI and guided flow
const NivEnhancedChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workItemsCreated, setWorkItemsCreated] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('discovery');
  const [phaseData, setPhaseData] = useState({
    exchangeCount: 0,
    readyForCreation: false,
    materialsCreated: 0,
    totalMaterials: 6
  });
  const [showPhaseGuidance, setShowPhaseGuidance] = useState(true);
  const messagesEndRef = useRef(null);

  // Phase detection based on conversation content
  const detectPhaseFromMessage = (message, isNivResponse = false) => {
    if (!isNivResponse) return null;
    
    const content = message.content?.toLowerCase() || '';
    
    // Phase 3: Material Creation indicators
    if (content.includes('let me create') || 
        content.includes('i\'ll now create') ||
        content.includes('creating these materials') ||
        content.includes('materials for you now')) {
      return 'material-creation';
    }
    
    // Phase 2: Strategic Counsel indicators
    if (content.includes('based on our discussion') ||
        content.includes('strategic recommendations') ||
        content.includes('would you like me to create') ||
        content.includes('key challenges and opportunities')) {
      return 'strategic-counsel';
    }
    
    // Default to discovery for question-asking responses
    return 'discovery';
  };

  // Enhanced message processing with phase awareness
  const processNivResponse = (response, userMessage) => {
    const detectedPhase = detectPhaseFromMessage(response, true);
    
    // Update phase data based on response
    setPhaseData(prev => {
      const newData = { ...prev };
      
      if (detectedPhase === 'strategic-counsel') {
        newData.exchangeCount = Math.max(prev.exchangeCount, 2);
        newData.readyForCreation = response.content?.includes('would you like me to create');
      } else if (detectedPhase === 'material-creation') {
        newData.readyForCreation = true;
        newData.materialsCreated = response.workItems?.length || 0;
      } else {
        // Discovery phase
        newData.exchangeCount = prev.exchangeCount + 1;
      }
      
      return newData;
    });
    
    if (detectedPhase) {
      setCurrentPhase(detectedPhase);
    }
  };

  useEffect(() => {
    // Subscribe to chat updates from state manager
    const unsubscribe = nivStateManager.subscribe('chat', (event) => {
      if (event.type === 'message_added') {
        setMessages(nivStateManager.getChatMessages());
      } else if (event.type === 'work_items_created') {
        setWorkItemsCreated(prev => prev + event.count);
        setPhaseData(prev => ({
          ...prev,
          materialsCreated: prev.materialsCreated + event.count
        }));
        setTimeout(() => setWorkItemsCreated(0), 3000);
      }
    });

    // Load initial messages
    setMessages(nivStateManager.getChatMessages());
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message to state
    nivStateManager.addChatMessage({
      type: 'user',
      content: userMessage
    });

    try {
      // Include phase context in API call
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        messages: messages.map(m => ({
          type: m.type,
          content: m.content
        })),
        context: { 
          hasConversationHistory: messages.length > 0,
          currentPhase,
          exchangeCount: phaseData.exchangeCount
        }
      });

      console.log('🔍 Raw Niv response:', response);

      // Process the response for phase detection
      processNivResponse(response, userMessage);

      // Handle response through state manager
      const result = nivStateManager.handleNivResponse(response);
      console.log('Niv response handled:', result);

    } catch (error) {
      console.error('Error calling Niv:', error);
      nivStateManager.addChatMessage({
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Phase-specific input placeholder
  const getInputPlaceholder = () => {
    switch (currentPhase) {
      case 'discovery':
        return phaseData.exchangeCount === 0 
          ? "Tell Niv about your PR needs - what do you want to announce or achieve?"
          : "Continue providing details about your situation...";
      case 'strategic-counsel':
        return "Ask questions about Niv's recommendations or request material creation";
      case 'material-creation':
        return "Request specific materials or ask about the created content";
      default:
        return "Ask Niv for strategic guidance...";
    }
  };

  // Phase-specific helper text
  const getPhaseHelperText = () => {
    switch (currentPhase) {
      case 'discovery':
        if (phaseData.exchangeCount === 0) {
          return "Niv needs to understand your situation before creating materials. Share your announcement, goals, timeline, and target audience.";
        } else if (phaseData.exchangeCount < 2) {
          return "Great start! Niv needs a bit more detail to provide strategic recommendations.";
        } else {
          return "Excellent! Niv has enough context to move to strategic analysis.";
        }
      case 'strategic-counsel':
        return "Niv is analyzing your needs and will provide strategic recommendations. Ask questions or request material creation when ready.";
      case 'material-creation':
        return "Niv is creating comprehensive PR materials. You can request specific items or modifications.";
      default:
        return "";
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0a0a0f',
      color: '#e8e8e8'
    }}>
      {/* Enhanced Header with Phase Context */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <Bot size={24} color="white" />
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '16px',
              height: '16px',
              background: '#10b981',
              borderRadius: '50%',
              border: '2px solid #0a0a0f'
            }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Niv - Senior PR Strategist
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Strategic consultation with proven 3-phase approach
            </p>
          </div>
        </div>
      </div>

      {/* Phase Indicator */}
      <NivConversationPhases
        currentPhase={currentPhase}
        phaseData={phaseData}
        className="phase-indicator"
      />

      {/* Phase Helper Text */}
      {showPhaseGuidance && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <Lightbulb size={16} color="#60a5fa" style={{ marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              color: '#60a5fa',
              lineHeight: 1.4
            }}>
              {getPhaseHelperText()}
            </div>
          </div>
          <button
            onClick={() => setShowPhaseGuidance(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Work Items Created Notification */}
      {workItemsCreated > 0 && (
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
          borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideDown 0.3s ease'
        }}>
          <CheckCircle size={16} color="#10b981" />
          <span style={{ color: '#10b981', fontSize: '14px' }}>
            {workItemsCreated} work {workItemsCreated === 1 ? 'item' : 'items'} created - check the sidebar
          </span>
        </div>
      )}

      {/* Messages Area with Phase-Aware Styling */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message, index) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '75%',
              padding: '14px 18px',
              borderRadius: '16px',
              background: message.type === 'user' 
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : message.type === 'error'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(30, 30, 45, 0.9)',
              color: message.type === 'user' ? '#ffffff' : '#e8e8e8',
              border: message.type === 'assistant' 
                ? '1px solid rgba(139, 92, 246, 0.2)' 
                : 'none',
              position: 'relative'
            }}>
              {message.type === 'assistant' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  <Bot size={14} />
                  <span>Niv</span>
                  {/* Phase indicator badge */}
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    borderRadius: '10px',
                    fontSize: '10px'
                  }}>
                    {currentPhase.replace('-', ' ')}
                  </span>
                </div>
              )}
              <div style={{ 
                whiteSpace: 'pre-wrap', 
                lineHeight: '1.6',
                fontSize: '14px'
              }}>
                {message.content}
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              padding: '14px 18px',
              borderRadius: '16px',
              background: 'rgba(30, 30, 45, 0.9)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <RefreshCw size={16} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                  Niv is {currentPhase === 'discovery' ? 'analyzing your needs' : 
                          currentPhase === 'strategic-counsel' ? 'developing recommendations' : 
                          'creating materials'}...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area with Phase Context */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(30, 30, 45, 0.4)'
      }}>
        {/* Input guidance based on phase */}
        <div style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <MessageSquare size={12} />
          {currentPhase === 'discovery' && phaseData.exchangeCount < 2 && (
            <span>Provide more details to help Niv understand your situation</span>
          )}
          {currentPhase === 'discovery' && phaseData.exchangeCount >= 2 && (
            <span>Ready for strategic analysis - continue the conversation</span>
          )}
          {currentPhase === 'strategic-counsel' && (
            <span>Review Niv's recommendations and approve material creation</span>
          )}
          {currentPhase === 'material-creation' && (
            <span>Materials are being created - ask questions or request modifications</span>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={getInputPlaceholder()}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              color: '#e8e8e8',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              minHeight: '50px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
            disabled={isProcessing}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isProcessing}
            style={{
              padding: '12px 20px',
              background: isProcessing 
                ? 'rgba(139, 92, 246, 0.3)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minHeight: '50px'
            }}
          >
            {isProcessing ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={16} />
            )}
            <span>{isProcessing ? 'Sending...' : 'Send'}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .phase-indicator {
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }
      `}</style>
    </div>
  );
};

export default NivEnhancedChat;