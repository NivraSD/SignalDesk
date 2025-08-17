// NivStrategicOrchestrator.js - The NEW Niv: Strategic PR Orchestrator
// Primary interface that controls ALL features through conversation
// Implements the complete vision from development specification

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, Send, Sparkles, RefreshCw
} from 'lucide-react';
import supabaseApiService from '../services/supabaseApiService';

const NivStrategicOrchestrator = ({ 
  // Feature Control Props
  onFeatureOpen,
  onContentGenerate,
  onStrategicPlanGenerate,
  onWorkCardCreate,
  
  // Message State Props
  messages,
  setMessages
}) => {
  // === CORE STATE ===
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientMode, setClientMode] = useState('NORMAL');
  
  // === REAL-TIME FEATURE CONTROL ===
  const [isGeneratingInFeature, setIsGeneratingInFeature] = useState(false);
  const [featureGenerationProgress, setFeatureGenerationProgress] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // === CONSULTATION MODE DETECTION (Enhanced for comprehensive PR strategist) ===
  const detectConsultationMode = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    const urgencyWords = ['urgent', 'crisis', 'emergency', 'breaking', 'immediate', 'asap', 'now'];
    const analysisWords = ['analyze', 'review', 'evaluate', 'assess', 'thoughts on', 'opinion', 'what do you think'];
    const advisoryWords = ['advice', 'recommend', 'should i', 'help me decide', 'strategy', 'approach'];
    const reviewWords = ['feedback', 'review this', 'look at', 'check this', 'improve'];
    const materialWords = ['create', 'write', 'draft', 'generate', 'make', 'develop'];
    
    // Crisis Response - highest priority
    if (urgencyWords.some(word => lowerMessage.includes(word)) && 
        (lowerMessage.includes('crisis') || lowerMessage.includes('emergency') || lowerMessage.includes('breaking'))) {
      return 'CRISIS_RESPONSE';
    }
    
    // Review Mode - when reviewing existing materials
    if (reviewWords.some(word => lowerMessage.includes(word)) || 
        lowerMessage.includes('attached') || lowerMessage.includes('here is') || lowerMessage.includes('this is')) {
      return 'REVIEW_MODE';
    }
    
    // Material Creation - explicit creation requests
    if (materialWords.some(word => lowerMessage.includes(word))) {
      return 'MATERIAL_CREATION';
    }
    
    // Analysis Mode - analytical requests
    if (analysisWords.some(word => lowerMessage.includes(word))) {
      return 'ANALYSIS_MODE';
    }
    
    // Advisory Mode - strategic guidance requests (default)
    return 'ADVISORY_MODE';
  }, []);

  // === IMPROVED FEATURE DETECTION ===
  const detectFeatureIntent = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    
    // Only detect features when user uses creation language
    const hasCreationIntent = ['create', 'write', 'draft', 'generate', 'make', 'develop'].some(word => 
      lowerMessage.includes(word)
    );
    
    if (!hasCreationIntent) {
      console.log('🚫 No creation intent detected - not triggering features');
      return null;
    }
    
    // Strategic planning patterns (only with creation intent)
    if (lowerMessage.includes('strategic plan') || lowerMessage.includes('strategy') ||
        lowerMessage.includes('framework') || lowerMessage.includes('roadmap')) {
      return 'strategic-planning';
    }
    
    // Content generation patterns (specific content types only)
    if (lowerMessage.includes('press release') || lowerMessage.includes('content')) {
      return 'content-generator';
    }
    
    // Media intelligence patterns
    if (lowerMessage.includes('media list') || lowerMessage.includes('media plan')) {
      return 'media-intelligence';
    }
    
    console.log('🤔 Creation intent detected but no specific feature match');
    return null;
  }, []);

  // === FEATURE ORCHESTRATION FUNCTIONS ===
  const initiateContentGeneration = useCallback(async (userMessage, consultationMode) => {
    if (!onContentGenerate) return;
    
    setIsGeneratingInFeature(true);
    setFeatureGenerationProgress('Analyzing content requirements...');
    
    try {
      // Call Niv to generate strategic content
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        context: {
          consultationMode: consultationMode,
          detectedFeature: 'content-generator',
          requestType: 'content_generation'
        },
        mode: 'content_orchestration'
      });
      
      setFeatureGenerationProgress('Generating content strategically...');
      
      // Trigger content generation in the feature
      onContentGenerate({
        type: 'press-release', // Default type, Niv will guide
        initialContent: response.response,
        message: response.response,
        nivGenerated: true
      });
      
      setFeatureGenerationProgress('Content ready for editing!');
      
    } catch (error) {
      console.error('Error in content generation:', error);
    } finally {
      setTimeout(() => {
        setIsGeneratingInFeature(false);
        setFeatureGenerationProgress('');
      }, 1500);
    }
  }, [onContentGenerate]);

  const initiateStrategicPlanning = useCallback(async (userMessage, consultationMode) => {
    if (!onStrategicPlanGenerate) return;
    
    setIsGeneratingInFeature(true);
    setFeatureGenerationProgress('Analyzing strategic requirements...');
    
    try {
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        context: {
          consultationMode: consultationMode,
          detectedFeature: 'strategic-planning',
          requestType: 'strategic_planning'
        },
        mode: 'strategic_orchestration'
      });
      
      setFeatureGenerationProgress('Creating strategic framework...');
      
      onStrategicPlanGenerate({
        framework: response.response,
        nivGenerated: true,
        strategicInsights: response.strategicAnalysis?.strategicInsights || []
      });
      
    } catch (error) {
      console.error('Error in strategic planning:', error);
    } finally {
      setTimeout(() => {
        setIsGeneratingInFeature(false);
        setFeatureGenerationProgress('');
      }, 1500);
    }
  }, [onStrategicPlanGenerate]);

  // Helper to format preview content as human-readable text
  const formatPreviewContent = (content) => {
    if (!content) return '';
    
    // If it's a string, return it directly
    if (typeof content === 'string') {
      return content.substring(0, 300) + (content.length > 300 ? '...' : '');
    }
    
    // If it has a content property (press release), show that
    if (content.content) {
      return content.content.substring(0, 300) + (content.content.length > 300 ? '...' : '');
    }
    
    // If it has a title and objective (strategy plan), format nicely
    if (content.title && content.objective) {
      let preview = `${content.title}\n\n📋 Objective: ${content.objective}\n`;
      
      // Add timeline milestones if present
      if (content.timeline?.milestones) {
        preview += '\n📅 Timeline:\n';
        content.timeline.milestones.slice(0, 2).forEach(milestone => {
          preview += `• Week ${milestone.week}: ${milestone.task}\n`;
        });
        if (content.timeline.milestones.length > 2) {
          preview += `...and ${content.timeline.milestones.length - 2} more milestones`;
        }
      }
      
      return preview;
    }
    
    // If it's a media list, show journalists
    if (content.journalists) {
      let preview = `📰 Media Targets (${content.totalContacts || content.journalists.length} contacts)\n\n`;
      content.journalists.slice(0, 3).forEach(j => {
        preview += `• ${j.name} - ${j.outlet} (${j.beat})\n`;
      });
      if (content.journalists.length > 3) {
        preview += `...and ${content.journalists.length - 3} more journalists`;
      }
      return preview;
    }
    
    // Fallback: show key-value pairs nicely
    const entries = Object.entries(content).slice(0, 5);
    return entries.map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
      const formattedValue = typeof value === 'object' ? '[...]' : String(value).substring(0, 50);
      return `${capitalizedKey}: ${formattedValue}`;
    }).join('\n');
  };

  // Helper to get details based on work type
  const getDetailsFromType = (type) => {
    switch(type) {
      case 'strategy-plan':
        return {
          'Duration': '4 weeks',
          'Status': 'Draft',
          'Priority': 'High'
        };
      case 'media-list':
        return {
          'Journalists': '5+',
          'Tier 1': '3',
          'Status': 'Ready'
        };
      case 'content-draft':
        return {
          'Length': 'Full',
          'Status': 'Draft',
          'Type': 'Press Release'
        };
      default:
        return {};
    }
  };

  // === MESSAGE HANDLING ===
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    
    // Auto-focus input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    // Detect consultation mode and feature intent
    const consultationMode = detectConsultationMode(userMessage);
    const detectedFeature = detectFeatureIntent(userMessage);
    
    setClientMode(consultationMode);
    
    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      console.log('🚀 Sending message to Niv:', userMessage);
      console.log('📝 Conversation history:', messages);
      
      // Get Niv's response with consultation mode and full conversation history
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        messages: messages, // Pass full conversation history
        context: {
          consultationMode: consultationMode,
          detectedFeature: detectedFeature,
          conversationPhase: 'understanding'
        },
        mode: 'strategic_orchestration'
      });
      
      console.log('✅ Niv response received:', response);
      console.log('🔍 [NivOrchestrator] Response details:', {
        hasResponse: !!response.response,
        responseLength: response.response?.length,
        hasWorkItems: !!response.workItems,
        workItemsCount: response.workItems?.length || 0,
        workItemTypes: response.workItems?.map(item => item.type) || [],
        workItemTitles: response.workItems?.map(item => item.title) || [],
        hasGeneratedContent: response.workItems?.map(item => !!item.generatedContent) || [],
        showWork: response.showWork
      });
      
      // Add Niv's response with consultation mode
      const assistantMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response || 'I received your message but had trouble generating a response. Please try again.',
        timestamp: new Date(),
        mode: consultationMode,
        consultationMode: response.consultationMode || consultationMode,
        strategicAnalysis: response.strategicAnalysis
      };
      setMessages(prev => [...prev, assistantMsg]);
      
      // If Niv created work items, create inline work cards for each
      if (response.workItems && response.workItems.length > 0) {
        console.log('📦 [NivOrchestrator] Processing work items:', response.workItems);
        // Add work items as inline cards in the chat
        const workCardMessages = response.workItems.map((item, index) => {
          console.log(`📝 [NivOrchestrator] Creating work card ${index}:`, {
            type: item.type,
            title: item.title,
            hasGeneratedContent: !!item.generatedContent,
            generatedContentKeys: item.generatedContent ? Object.keys(item.generatedContent) : 'none'
          });
          
          return {
            id: Date.now() + 100 + index,
            type: 'work-card',
            workCard: {
              type: item.type,
              data: {
                title: item.title,
                description: item.description,
                generatedContent: item.generatedContent,
                details: getDetailsFromType(item.type)
              }
            },
            timestamp: new Date()
          };
        });
        
        // Add all work cards - allow multiple versions of same type
        setTimeout(() => {
          setMessages(prev => {
            // Allow all new cards - don't prevent same types, but prevent exact duplicates within same response
            const newCards = workCardMessages.filter((card, index, array) => {
              // Only prevent if exact same title AND type in this batch
              return !array.slice(0, index).some(prevCard => 
                prevCard.workCard.type === card.workCard.type && 
                prevCard.workCard.data.title === card.workCard.data.title
              );
            });
            return [...prev, ...newCards];
          });
          
          // Also notify parent component for right panel artifacts
          // Only call once per batch to prevent duplicates
          if (onWorkCardCreate) {
            console.log('🎯 [NivOrchestrator] Calling onWorkCardCreate for parent component');
            response.workItems.forEach((item, index) => {
              console.log(`🎯 [NivOrchestrator] Sending work item ${index} to parent:`, {
                type: item.type,
                title: item.title,
                hasGeneratedContent: !!item.generatedContent
              });
              // FIXED: Use unified structure - no double nesting
              onWorkCardCreate({
                type: item.type,
                title: item.title,
                description: item.description,
                generatedContent: item.generatedContent,
                details: getDetailsFromType(item.type)
              });
            });
          } else {
            console.log('⚠️ [NivOrchestrator] No onWorkCardCreate callback provided');
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize - I encountered an issue. Let me help you in a different way. What would you like to work on?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      // Re-focus input after processing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [input, isProcessing, detectConsultationMode, detectFeatureIntent, setMessages, messages, onWorkCardCreate]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // === COMPONENT RENDER ===
  return (
    <div style={{ 
      height: 'calc(100% - 40px)', // Add spacing from bottom
      width: '55%', // Reduced from 70% (about 25% reduction)
      margin: '0 auto',
      marginBottom: '20px', // Space from bottom
      display: 'flex', 
      flexDirection: 'column',
      background: 'rgba(0, 0, 0, 0.95)',
      color: '#e8e8e8',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    }}>
      {/* Niv Header with Strategic Identity */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(59, 130, 246, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <Bot size={20} color="white" />
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            background: '#10b981',
            borderRadius: '50%',
            border: '2px solid rgba(0, 0, 0, 0.95)'
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            Niv • Senior PR Strategist
            {clientMode !== 'ADVISORY_MODE' && (
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                background: 
                  clientMode === 'CRISIS_RESPONSE' ? 'rgba(239, 68, 68, 0.2)' :
                  clientMode === 'REVIEW_MODE' ? 'rgba(245, 158, 11, 0.2)' :
                  clientMode === 'ANALYSIS_MODE' ? 'rgba(139, 92, 246, 0.2)' :
                  clientMode === 'MATERIAL_CREATION' ? 'rgba(16, 185, 129, 0.2)' :
                  'rgba(59, 130, 246, 0.2)',
                color:
                  clientMode === 'CRISIS_RESPONSE' ? '#ef4444' :
                  clientMode === 'REVIEW_MODE' ? '#f59e0b' :
                  clientMode === 'ANALYSIS_MODE' ? '#8b5cf6' :
                  clientMode === 'MATERIAL_CREATION' ? '#10b981' :
                  '#3b82f6'
              }}>
                {clientMode === 'CRISIS_RESPONSE' ? '🚨 Crisis Response' :
                 clientMode === 'REVIEW_MODE' ? '📋 Review Mode' :
                 clientMode === 'ANALYSIS_MODE' ? '📊 Analysis Mode' :
                 clientMode === 'MATERIAL_CREATION' ? '✨ Creating Materials' :
                 '🎯 Strategic Advisory'}
              </span>
            )}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Sparkles size={12} />
Comprehensive PR strategist • Advisory • Analysis • Crisis • Review • Creation
          </div>
        </div>
      </div>

      {/* Processing Indicator */}
      {(isProcessing || isGeneratingInFeature) && (
        <div style={{
          padding: '1rem',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated progress bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '2px',
            width: '100%',
            background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
            animation: 'shimmer 2s infinite'
          }} />
          
          <div style={{ 
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Sparkles size={16} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontWeight: '500', color: '#3b82f6' }}>
              {isGeneratingInFeature ? 'Niv is working in the feature...' : 'Niv is thinking...'}
            </div>
            {featureGenerationProgress && (
              <div style={{ fontSize: '12px', color: '#60a5fa' }}>
                {featureGenerationProgress}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((message) => (
          message.type === 'work-card' ? (
            // Inline Work Card
            <div key={message.id} style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginLeft: '60px',
              marginRight: '20%',
              animation: 'slideIn 0.5s ease-out'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={18} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                    {message.workCard.data.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8b5cf6' }}>
                    Created by Niv • Click to open in workspace
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '13px',
                color: '#e0e0e0',
                lineHeight: '1.5',
                marginBottom: '12px'
              }}>
                {message.workCard.data.description}
              </div>
              <div style={{
                padding: '12px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={14} />
                <span>✅ Generated and ready to edit in workspace → Check right panel</span>
              </div>
            </div>
          ) : (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: message.type === 'user' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              color: message.type === 'user' ? 'white' : '#e8e8e8'
            }}>
              {message.type === 'assistant' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  <Bot size={14} />
                  <span style={{ fontWeight: '500' }}>Niv</span>
                  {message.mode && (
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      {message.mode}
                    </span>
                  )}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {message.content}
              </div>
              {message.timestamp && (
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.7, 
                  marginTop: '0.5rem' 
                }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          )
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Strategic Input Interface */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        gap: '0.75rem'
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Niv for strategic advice, crisis response, material review, analysis, or content creation..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#e8e8e8',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            minHeight: '50px',
            maxHeight: '150px',
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }}
          disabled={isProcessing}
          onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isProcessing}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: !input.trim() || isProcessing
              ? 'rgba(255, 255, 255, 0.1)'
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: !input.trim() || isProcessing ? '#6b7280' : 'white',
            cursor: !input.trim() || isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          {isProcessing ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', opacity: 0.7 }} />
              <span style={{ opacity: 0.8 }}>Thinking...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Send</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(10px);
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

export default NivStrategicOrchestrator;