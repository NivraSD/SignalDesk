import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  CheckCircle, 
  Bot, 
  RefreshCw,
  MessageSquare,
  Lightbulb,
  Package,
  AlertCircle,
  ArrowRight,
  Clock,
  Target
} from 'lucide-react';
import supabaseApiService from '../../services/supabaseApiService';
import nivStateManager from './NivStateManager';
import NivConversationPhases from './NivConversationPhases';
import NivMaterialCreationProgress from './NivMaterialCreationProgress';

// Complete phase-aware chat interface with guided flow
const NivPhaseAwareChat = ({ 
  onWorkItemClick,
  className = ''
}) => {
  // Core chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Phase management state
  const [currentPhase, setCurrentPhase] = useState('discovery');
  const [phaseData, setPhaseData] = useState({
    exchangeCount: 0,
    readyForCreation: false,
    materialsCreated: 0,
    totalMaterials: 6,
    isCreatingMaterials: false,
    createdMaterials: []
  });

  // UI state
  const [showPhaseGuidance, setShowPhaseGuidance] = useState(true);
  const [workItemsCreated, setWorkItemsCreated] = useState(0);
  const [lastPhaseTransition, setLastPhaseTransition] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Advanced phase detection from conversation content
  const detectConversationPhase = (messages) => {
    const recentMessages = messages.slice(-4); // Look at last 4 messages
    const nivResponses = recentMessages.filter(m => m.type === 'assistant');
    
    if (nivResponses.length === 0) return 'discovery';
    
    const latestNivMessage = nivResponses[nivResponses.length - 1];
    const content = latestNivMessage.content?.toLowerCase() || '';
    
    // Phase 3: Material Creation detection
    if (content.includes('let me create these materials') ||
        content.includes('i\'ll now create') ||
        content.includes('creating your pr package') ||
        content.includes('materials for you now')) {
      return 'material-creation';
    }
    
    // Phase 2: Strategic Counsel detection
    if (content.includes('based on our discussion') ||
        content.includes('strategic recommendations') ||
        content.includes('here\'s my strategic analysis') ||
        content.includes('would you like me to create these materials') ||
        (content.includes('recommend') && content.includes('strategy'))) {
      return 'strategic-counsel';
    }
    
    // Count actual exchanges (user-assistant pairs)
    const userMessages = messages.filter(m => m.type === 'user');
    if (userMessages.length >= 2) {
      // Look for strategic transition indicators
      const hasStrategicContent = nivResponses.some(msg => 
        msg.content?.toLowerCase().includes('understand') ||
        msg.content?.toLowerCase().includes('recommend') ||
        msg.content?.toLowerCase().includes('strategy')
      );
      
      if (hasStrategicContent) {
        return 'strategic-counsel';
      }
    }
    
    return 'discovery';
  };

  // Enhanced phase data update based on message analysis
  const updatePhaseData = (newMessages, response) => {
    const userMessages = newMessages.filter(m => m.type === 'user');
    const assistantMessages = newMessages.filter(m => m.type === 'assistant');
    
    setPhaseData(prev => {
      const newData = { ...prev };
      
      // Update exchange count
      newData.exchangeCount = userMessages.length;
      
      // Check for strategic counsel transition
      if (response?.response) {
        const responseContent = response.response.toLowerCase();
        if (responseContent.includes('would you like me to create') ||
            responseContent.includes('shall i create') ||
            responseContent.includes('ready to create')) {
          newData.readyForCreation = true;
        }
        
        // Check for material creation start
        if (responseContent.includes('let me create') ||
            responseContent.includes('i\'ll now create')) {
          newData.isCreatingMaterials = true;
        }
      }
      
      // Update created materials count
      if (response?.workItems?.length > 0) {
        newData.materialsCreated = response.workItems.length;
        newData.createdMaterials = response.workItems;
        newData.isCreatingMaterials = false;
      }
      
      return newData;
    });
  };

  // Phase transition handler with animation
  const handlePhaseTransition = (newPhase) => {
    if (newPhase !== currentPhase) {
      setLastPhaseTransition({
        from: currentPhase,
        to: newPhase,
        timestamp: Date.now()
      });
      setCurrentPhase(newPhase);
    }
  };

  // Subscribe to state manager updates
  useEffect(() => {
    const unsubscribe = nivStateManager.subscribe('chat', (event) => {
      if (event.type === 'message_added') {
        const newMessages = nivStateManager.getChatMessages();
        setMessages(newMessages);
        
        // Detect phase changes
        const detectedPhase = detectConversationPhase(newMessages);
        handlePhaseTransition(detectedPhase);
        
      } else if (event.type === 'work_items_created') {
        setWorkItemsCreated(prev => prev + event.count);
        setTimeout(() => setWorkItemsCreated(0), 4000);
        
        // Update phase data
        setPhaseData(prev => ({
          ...prev,
          materialsCreated: prev.materialsCreated + event.count,
          isCreatingMaterials: false
        }));
      }
    });

    // Load initial messages and detect phase
    const initialMessages = nivStateManager.getChatMessages();
    setMessages(initialMessages);
    if (initialMessages.length > 0) {
      const initialPhase = detectConversationPhase(initialMessages);
      setCurrentPhase(initialPhase);
    }

    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    if (!isProcessing) {
      inputRef.current?.focus();
    }
  }, [isProcessing]);

  // Enhanced message sending with phase context
  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    nivStateManager.addChatMessage({
      type: 'user',
      content: userMessage
    });

    try {
      // Include rich phase context in API call
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        messages: messages.map(m => ({
          type: m.type,
          content: m.content
        })),
        context: { 
          hasConversationHistory: messages.length > 0,
          currentPhase,
          exchangeCount: phaseData.exchangeCount,
          readyForCreation: phaseData.readyForCreation,
          phaseTransition: lastPhaseTransition
        }
      });

      console.log('🔍 Niv response with phase context:', response);

      // Update phase data based on response
      const updatedMessages = [...messages, 
        { type: 'user', content: userMessage },
        { type: 'assistant', content: response.response }
      ];
      updatePhaseData(updatedMessages, response);

      // Handle response through state manager
      const result = nivStateManager.handleNivResponse(response);
      console.log('✅ Niv response handled:', result);

    } catch (error) {
      console.error('❌ Error calling Niv:', error);
      nivStateManager.addChatMessage({
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Phase-specific UI helpers
  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'discovery': return '#3b82f6';
      case 'strategic-counsel': return '#8b5cf6';
      case 'material-creation': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getPhaseEmoji = () => {
    switch (currentPhase) {
      case 'discovery': return '🔍';
      case 'strategic-counsel': return '💡';
      case 'material-creation': return '📦';
      default: return '🤖';
    }
  };

  const getInputPlaceholder = () => {
    switch (currentPhase) {
      case 'discovery':
        if (phaseData.exchangeCount === 0) {
          return "Tell Niv about your PR challenge - what do you need to announce or achieve?";
        } else if (phaseData.exchangeCount === 1) {
          return "Share more details about your timeline, audience, and goals...";
        } else {
          return "Any additional context or specific requirements?";
        }
      case 'strategic-counsel':
        return phaseData.readyForCreation 
          ? "Ask Niv to create your materials or request specific items"
          : "Ask questions about Niv's strategic recommendations";
      case 'material-creation':
        return "Request specific materials or ask about the creation process";
      default:
        return "Continue your conversation with Niv...";
    }
  };

  const getPhaseHelperText = () => {
    switch (currentPhase) {
      case 'discovery':
        if (phaseData.exchangeCount === 0) {
          return "Niv needs to understand your situation before creating materials. Share your announcement, goals, timeline, and target audience.";
        } else if (phaseData.exchangeCount < 2) {
          return "Great! Keep providing details. Niv needs thorough context for strategic recommendations.";
        } else {
          return "Perfect! Niv has sufficient context and will move to strategic analysis.";
        }
      case 'strategic-counsel':
        return phaseData.readyForCreation 
          ? "Niv has provided strategic recommendations and is ready to create materials when you approve."
          : "Niv is analyzing your needs and developing strategic recommendations.";
      case 'material-creation':
        return "Niv is creating comprehensive PR materials. This may take a few minutes.";
      default:
        return "";
    }
  };

  return (
    <div className={`niv-phase-aware-chat ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0a0a0f',
      color: '#e8e8e8'
    }}>
      {/* Enhanced Header with Phase Indicator */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: `linear-gradient(135deg, ${getPhaseColor()}, ${getPhaseColor()}dd)`,
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
              background: isProcessing ? '#f59e0b' : '#10b981',
              borderRadius: '50%',
              border: '2px solid #0a0a0f',
              animation: isProcessing ? 'pulse 1s infinite' : 'none'
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Niv - Senior PR Strategist
              </h3>
              <span style={{
                padding: '2px 8px',
                background: `${getPhaseColor()}22`,
                color: getPhaseColor(),
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {getPhaseEmoji()} {currentPhase.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Strategic consultation with proven 3-phase approach • Exchange {phaseData.exchangeCount}
            </p>
          </div>
        </div>
      </div>

      {/* Phase Progress Indicator */}
      <NivConversationPhases
        currentPhase={currentPhase}
        phaseData={phaseData}
        className="conversation-phases"
      />

      {/* Material Creation Progress */}
      <NivMaterialCreationProgress
        isCreating={phaseData.isCreatingMaterials}
        createdMaterials={phaseData.createdMaterials}
        onMaterialClick={onWorkItemClick}
      />

      {/* Phase Helper Text */}
      {showPhaseGuidance && (
        <div style={{
          padding: '16px 20px',
          background: `${getPhaseColor()}15`,
          borderBottom: `1px solid ${getPhaseColor()}33`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          animation: lastPhaseTransition ? 'slideInDown 0.5s ease-out' : 'none'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            background: getPhaseColor(),
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px'
          }}>
            {currentPhase === 'discovery' && <MessageSquare size={10} color="white" />}
            {currentPhase === 'strategic-counsel' && <Lightbulb size={10} color="white" />}
            {currentPhase === 'material-creation' && <Package size={10} color="white" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              color: getPhaseColor(),
              lineHeight: 1.4,
              fontWeight: '500'
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
              fontSize: '16px',
              padding: '0',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Work Items Notification */}
      {workItemsCreated > 0 && (
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
          borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideInDown 0.3s ease'
        }}>
          <CheckCircle size={16} color="#10b981" />
          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
            ✨ {workItemsCreated} material{workItemsCreated !== 1 ? 's' : ''} created and ready for editing!
          </span>
          <ArrowRight size={14} color="#10b981" />
          <span style={{ color: '#6ee7b7', fontSize: '12px' }}>
            Check workspace sidebar
          </span>
        </div>
      )}

      {/* Messages Area */}
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
            key={message.id || index}
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
                ? `linear-gradient(135deg, ${getPhaseColor()}, ${getPhaseColor()}dd)`
                : message.type === 'error'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(30, 30, 45, 0.9)',
              color: message.type === 'user' ? '#ffffff' : '#e8e8e8',
              border: message.type === 'assistant' 
                ? `1px solid ${getPhaseColor()}33` 
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
                  <span style={{
                    padding: '2px 6px',
                    background: `${getPhaseColor()}22`,
                    color: getPhaseColor(),
                    borderRadius: '8px',
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
              border: `1px solid ${getPhaseColor()}33`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <RefreshCw size={16} color={getPhaseColor()} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                Niv is {currentPhase === 'discovery' ? 'processing your input' : 
                        currentPhase === 'strategic-counsel' ? 'developing recommendations' : 
                        'creating your materials'}...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div style={{
        padding: '20px',
        borderTop: `1px solid ${getPhaseColor()}33`,
        background: 'rgba(30, 30, 45, 0.4)'
      }}>
        {/* Input guidance */}
        <div style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Target size={12} color={getPhaseColor()} />
          <span style={{ color: getPhaseColor() }}>
            {currentPhase === 'discovery' && phaseData.exchangeCount < 2 && 
              "Provide detailed information to help Niv understand your needs"}
            {currentPhase === 'discovery' && phaseData.exchangeCount >= 2 && 
              "Sufficient context gathered - ready for strategic analysis"}
            {currentPhase === 'strategic-counsel' && !phaseData.readyForCreation && 
              "Review Niv's strategic recommendations"}
            {currentPhase === 'strategic-counsel' && phaseData.readyForCreation && 
              "Approve material creation or ask for modifications"}
            {currentPhase === 'material-creation' && 
              "Materials being created - ask questions or request specific items"}
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={inputRef}
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
              border: `1px solid ${getPhaseColor()}33`,
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
                ? `${getPhaseColor()}44`
                : `linear-gradient(135deg, ${getPhaseColor()}, ${getPhaseColor()}dd)`,
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minHeight: '50px',
              transition: 'all 0.2s ease'
            }}
          >
            {isProcessing ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={16} />
            )}
            <span>{isProcessing ? 'Processing...' : 'Send'}</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-20px);
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

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .conversation-phases {
          border-bottom: 1px solid ${getPhaseColor()}33;
        }
      `}</style>
    </div>
  );
};

export default NivPhaseAwareChat;