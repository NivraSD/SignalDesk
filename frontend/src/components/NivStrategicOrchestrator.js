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

  // === CLIENT MODE DETECTION (Enhanced) ===
  const detectClientMode = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    const wordCount = message.split(' ').length;
    
    // Crisis indicators - highest priority (more specific)
    const crisisPatterns = [
      'emergency', 'disaster', 'breaking news', 'just happened', 'went viral', 
      'leaked', 'crisis', 'damage control', 'urgent help', 'emergency help', 
      'crisis help', 'reputation damage', 'pr disaster', 'media crisis'
    ];
    if (crisisPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'CRISIS_MODE';
    }
    
    // Urgent indicators
    const urgentPatterns = [
      'asap', 'urgent', 'now', 'quick', 'just need', 'immediately', 
      'right now', 'fast', 'hurry'
    ];
    if (urgentPatterns.some(pattern => lowerMessage.includes(pattern)) || wordCount < 8) {
      return 'URGENT_FIRE';
    }
    
    // Strategic indicators
    const strategicPatterns = [
      'strategic plan', 'strategy', 'campaign', 'quarterly', 'roadmap', 
      'comprehensive', 'full plan', 'plan for', 'planning for', 'strategic',
      'long-term', 'campaign strategy', 'pr strategy', 'strategic approach'
    ];
    if (strategicPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'STRATEGIC_PLANNING';
    }
    
    // Exploratory indicators
    const exploratoryPatterns = [
      'thinking about', 'considering', 'what if', 'explore', 'options', 
      'wondering', 'thoughts on', 'help me understand'
    ];
    if (exploratoryPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'EXPLORATORY';
    }
    
    return 'NORMAL';
  }, []);

  // === FEATURE DETECTION ===
  const detectFeatureIntent = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    
    // Strategic planning patterns (check first - higher priority)
    if (lowerMessage.includes('strategic plan') || lowerMessage.includes('campaign') || 
        lowerMessage.includes('strategy') || lowerMessage.includes('planning') ||
        lowerMessage.includes('launch') || lowerMessage.includes('framework') ||
        lowerMessage.includes('roadmap') || lowerMessage.includes('timeline')) {
      return 'strategic-planning';
    }
    
    // Content generation patterns (specific content types only)
    if (lowerMessage.includes('press release') || lowerMessage.includes('write a') || 
        lowerMessage.includes('create content') || lowerMessage.includes('draft')) {
      return 'content-generator';
    }
    
    // Media intelligence patterns
    if (lowerMessage.includes('journalist') || lowerMessage.includes('media list') || 
        lowerMessage.includes('reporter') || lowerMessage.includes('outreach')) {
      return 'media-intelligence';
    }
    
    return null;
  }, []);

  // === FEATURE ORCHESTRATION FUNCTIONS ===
  const initiateContentGeneration = useCallback(async (userMessage, detectedMode) => {
    if (!onContentGenerate) return;
    
    setIsGeneratingInFeature(true);
    setFeatureGenerationProgress('Analyzing content requirements...');
    
    try {
      // Call Niv to generate strategic content
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        context: {
          clientMode: detectedMode,
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

  const initiateStrategicPlanning = useCallback(async (userMessage, detectedMode) => {
    if (!onStrategicPlanGenerate) return;
    
    setIsGeneratingInFeature(true);
    setFeatureGenerationProgress('Analyzing strategic requirements...');
    
    try {
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        context: {
          clientMode: detectedMode,
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

  // === MESSAGE HANDLING ===
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    
    // Detect client mode and feature intent
    const detectedMode = detectClientMode(userMessage);
    const detectedFeature = detectFeatureIntent(userMessage);
    
    setClientMode(detectedMode);
    
    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      // Get Niv's response first to understand intent
      const response = await supabaseApiService.callNivChat({
        message: userMessage,
        context: {
          clientMode: detectedMode,
          detectedFeature: detectedFeature,
          conversationPhase: 'understanding'
        },
        mode: 'strategic_orchestration'
      });
      
      // Add Niv's response
      const assistantMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        mode: detectedMode,
        strategicAnalysis: response.strategicAnalysis
      };
      setMessages(prev => [...prev, assistantMsg]);
      
      // If Niv suggests showing work, create inline work cards
      if (detectedFeature && onWorkCardCreate) {
        // Create work card after a brief delay
        setTimeout(() => {
          if (detectedFeature === 'content-generator') {
            onWorkCardCreate({
              type: 'content-draft',
              data: {
                title: 'Press Release Draft',
                description: 'Strategic press release with key messaging points',
                details: {
                  'Length': '500 words',
                  'Tone': 'Professional',
                  'Audience': 'Tech Media'
                }
              }
            });
          } else if (detectedFeature === 'strategic-planning') {
            onWorkCardCreate({
              type: 'strategy-plan',
              data: {
                title: 'Campaign Strategy',
                description: 'Comprehensive launch strategy with timeline and milestones',
                details: {
                  'Duration': '6 weeks',
                  'Budget': '$75K',
                  'Team': '3 members'
                }
              }
            });
          } else if (detectedFeature === 'media-intelligence') {
            onWorkCardCreate({
              type: 'media-list',
              data: {
                title: 'Media Target List',
                description: 'Curated journalist list with personalized angles',
                details: {
                  'Journalists': '47',
                  'Tier 1': '12',
                  'Response Rate': '35%'
                }
              }
            });
          }
        }, 1000);
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
    }
  }, [input, isProcessing, detectClientMode, detectFeatureIntent, setMessages, onWorkCardCreate]);

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
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'rgba(0, 0, 0, 0.95)',
      color: '#e8e8e8',
      borderRadius: '8px'
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
            {clientMode !== 'NORMAL' && (
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                background: 
                  clientMode === 'CRISIS_MODE' ? 'rgba(239, 68, 68, 0.2)' :
                  clientMode === 'URGENT_FIRE' ? 'rgba(245, 158, 11, 0.2)' :
                  clientMode === 'STRATEGIC_PLANNING' ? 'rgba(59, 130, 246, 0.2)' :
                  'rgba(16, 185, 129, 0.2)',
                color:
                  clientMode === 'CRISIS_MODE' ? '#ef4444' :
                  clientMode === 'URGENT_FIRE' ? '#f59e0b' :
                  clientMode === 'STRATEGIC_PLANNING' ? '#3b82f6' :
                  '#10b981'
              }}>
                {clientMode === 'CRISIS_MODE' ? '🚨 Crisis Mode' :
                 clientMode === 'URGENT_FIRE' ? '⚡ Urgent Mode' :
                 clientMode === 'STRATEGIC_PLANNING' ? '🎯 Strategic Mode' :
                 '🔍 Exploring Mode'}
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
            20 years experience • Strategic conversations • Feature orchestration
          </div>
        </div>
      </div>

      {/* Feature Generation Progress */}
      {isGeneratingInFeature && (
        <div style={{
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ animation: 'spin 1s linear infinite' }}>
            <RefreshCw size={16} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontWeight: '500', color: '#3b82f6' }}>
              Niv is working in the feature...
            </div>
            <div style={{ fontSize: '12px', color: '#60a5fa' }}>
              {featureGenerationProgress}
            </div>
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
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Niv for strategic guidance, content creation, or open any feature..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#e8e8e8',
            fontSize: '14px',
            outline: 'none'
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
            transition: 'all 0.2s'
          }}
        >
          {isProcessing ? (
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={16} />
          )}
          Send
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NivStrategicOrchestrator;