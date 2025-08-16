// AdaptiveNivAssistantEnhanced.js - The TRUE Adaptive AI Assistant
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Brain, FileText, Users, Shield, Zap, Target, Database, Activity, AlertTriangle, BarChart3 } from 'lucide-react';
import supabaseApiService from '../services/supabaseApiService';

const AdaptiveNivAssistantEnhanced = ({ 
  onFeatureOpen, 
  onContentGenerate, 
  onStrategicPlanGenerate,
  currentFeature,
  messages,
  setMessages 
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentContext, setCurrentContext] = useState(null);
  const [awaitingResponse, setAwaitingResponse] = useState(null);
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  // Feature recognition patterns
  const featurePatterns = {
    'strategic-planning': [
      'strategic plan', 'strategy', 'planning', 'plan', 'campaign strategy',
      'crisis plan', 'launch plan', 'comprehensive strategy', 'strategic'
    ],
    'content-generator': [
      'write', 'create', 'draft', 'press release', 'article', 'content',
      'social post', 'media pitch', 'thought leadership', 'announcement'
    ],
    'media-intelligence': [
      'journalist', 'media', 'reporter', 'press', 'media list', 'outreach',
      'pitch to', 'find journalists', 'media contacts'
    ],
    'opportunity-engine': [
      'opportunity', 'opportunities', 'haro', 'trending', 'news',
      'what can i pitch', 'pr opportunities', 'speaking opportunities'
    ],
    'stakeholder-intelligence': [
      'stakeholder', 'monitor', 'tracking', 'sentiment', 'intelligence',
      'competitors', 'competitive', 'stakeholder analysis'
    ],
    'crisis-command': [
      'crisis', 'emergency', 'urgent', 'damage control', 'reputation',
      'crisis response', 'crisis management'
    ],
    'memory-vault': [
      'save', 'memory', 'remember', 'store', 'vault', 'knowledge',
      'retrieve', 'find in memory', 'saved'
    ]
  };

  // MCP expertise mapping
  const mcpExpertise = {
    'strategic-planning': {
      mcp: 'Intelligence MCP',
      expertise: 'I\'ll use strategic research and planning capabilities.'
    },
    'content-generator': {
      mcp: 'Content MCP',
      expertise: 'I\'ll leverage content creation and optimization.'
    },
    'media-intelligence': {
      mcp: 'Media MCP',
      expertise: 'I\'ll tap into journalist databases and media relations.'
    },
    'opportunity-engine': {
      mcp: 'Opportunities MCP',
      expertise: 'I\'ll scan for trending opportunities and HARO queries.'
    },
    'stakeholder-intelligence': {
      mcp: 'Monitor MCP',
      expertise: 'I\'ll analyze stakeholder sentiment and influence.'
    },
    'crisis-command': {
      mcp: 'Monitor MCP + Content MCP',
      expertise: 'I\'ll coordinate crisis response and messaging.'
    }
  };

  // Guided conversation flows
  const guidedFlows = {
    'strategic-planning': [
      { question: "What's your main objective?", key: 'objective' },
      { question: "What's the timeline?", key: 'timeline' },
      { question: "Any constraints or budget limits?", key: 'constraints' },
      { question: "What type of plan? (Comprehensive/Crisis/Campaign/Launch)", key: 'planType' }
    ],
    'content-generator': [
      { question: "What type of content?", key: 'contentType' },
      { question: "What's the main message?", key: 'message' },
      { question: "Who's the audience?", key: 'audience' },
      { question: "Any specific requirements?", key: 'requirements' }
    ],
    'media-intelligence': [
      { question: "What industry or beat?", key: 'beat' },
      { question: "What's your story angle?", key: 'angle' },
      { question: "Geographic focus?", key: 'location' },
      { question: "Tier preference? (Tier 1/2/3)", key: 'tier' }
    ]
  };

  useEffect(() => {
    scrollToBottom();
    
    // Check for new messages from Content Generator
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Only process if it's a new message we haven't handled yet
      if (lastMessage.id !== lastProcessedMessageId && lastMessage.type === 'user') {
        setLastProcessedMessageId(lastMessage.id);
        
        // Check if message is from Content Generator (has specific format)
        if (lastMessage.content && lastMessage.content.includes('I want to create a')) {
          // This is a content type selection from Content Generator
          // Start the guided flow for content generation
          setIsTyping(true);
          setTimeout(() => {
            handleFeatureRequest('content-generator', lastMessage.content);
          }, 500);
        }
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Detect feature intent from user message
  const detectFeatureIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    
    for (const [feature, patterns] of Object.entries(featurePatterns)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          return feature;
        }
      }
    }
    return null;
  };

  // Process user message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Check if we're in a guided flow
    if (awaitingResponse) {
      await handleGuidedResponse(input);
      return;
    }

    // Detect feature intent
    const detectedFeature = detectFeatureIntent(input);
    
    if (detectedFeature) {
      await handleFeatureRequest(detectedFeature, input);
    } else {
      await handleGeneralQuery(input);
    }
  };

  // Handle feature-specific requests
  const handleFeatureRequest = async (feature, userInput) => {
    const mcp = mcpExpertise[feature];
    const flow = guidedFlows[feature];
    
    // Don't re-open if already in the feature
    if (currentFeature !== feature && onFeatureOpen) {
      onFeatureOpen(feature);
    }

    // For content generator requests from button clicks, start guided flow
    if (feature === 'content-generator' && userInput.includes('I want to create a')) {
      // Extract content type from message
      const contentTypeMatch = userInput.match(/create a (.+)/i);
      const contentType = contentTypeMatch ? contentTypeMatch[1] : 'content';
      
      setCurrentContext({ 
        feature, 
        flow: guidedFlows[feature], 
        currentStep: 0, 
        data: { contentType } 
      });
      
      const response = {
        id: Date.now(),
        type: 'assistant',
        content: `I'll help you create a ${contentType}. What's the main message you want to convey?`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, response]);
      setAwaitingResponse({ feature, key: 'message', step: 1 });
    } else if (flow && flow.length > 0) {
      // Regular guided flow for other features
      setCurrentContext({ feature, flow, currentStep: 0, data: {} });
      
      const response = {
        id: Date.now(),
        type: 'assistant',
        content: `${flow[0].question}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, response]);
      setAwaitingResponse({ feature, key: flow[0].key, step: 0 });
    } else {
      // Direct action for simple features
      await executeFeatureAction(feature, userInput);
    }
    
    setIsTyping(false);
  };

  // Handle guided conversation responses
  const handleGuidedResponse = async (response) => {
    if (!currentContext) return;

    const { feature, flow, currentStep, data } = currentContext;
    const currentKey = flow[currentStep].key;
    
    // Store the response
    const updatedData = { ...data, [currentKey]: response };
    
    // Check if there are more questions
    const nextStep = currentStep + 1;
    if (nextStep < flow.length) {
      // Ask next question
      setCurrentContext({ ...currentContext, currentStep: nextStep, data: updatedData });
      
      const nextMessage = {
        id: Date.now(),
        type: 'assistant',
        content: flow[nextStep].question,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, nextMessage]);
      setAwaitingResponse({ feature, key: flow[nextStep].key, step: nextStep });
    } else {
      // All questions answered, execute the feature
      await executeFeatureAction(feature, updatedData);
      setCurrentContext(null);
      setAwaitingResponse(null);
    }
    
    setIsTyping(false);
  };

  // Execute feature-specific actions
  const executeFeatureAction = async (feature, data) => {
    switch (feature) {
      case 'strategic-planning':
        if (onStrategicPlanGenerate) {
          const planData = typeof data === 'string' ? 
            { objective: data } : 
            data;
          
          onStrategicPlanGenerate({
            objective: planData.objective || '',
            timeline: planData.timeline || '',
            constraints: planData.constraints || '',
            planType: planData.planType || 'comprehensive'
          });
          
          const response = {
            id: Date.now(),
            type: 'assistant',
            content: "Generating your strategic plan now...",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, response]);
        }
        break;

      case 'content-generator':
        if (onContentGenerate) {
          const contentData = typeof data === 'string' ? 
            { message: data } : 
            data;
          
          onContentGenerate({
            type: contentData.contentType || 'press-release',
            message: contentData.message || '',
            audience: contentData.audience || '',
            requirements: contentData.requirements || ''
          });
          
          const response = {
            id: Date.now(),
            type: 'assistant',
            content: "Creating your content now...",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, response]);
        }
        break;

      case 'media-intelligence':
        // Handle media intelligence
        const mediaResponse = {
          id: Date.now(),
          type: 'assistant',
          content: `Finding journalists for ${data.beat || 'your story'}...`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, mediaResponse]);
        break;

      default:
        const defaultResponse = {
          id: Date.now(),
          type: 'assistant',
          content: `Opening ${feature.replace('-', ' ')} with your requirements.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, defaultResponse]);
    }
  };

  // Handle general queries
  const handleGeneralQuery = async (query) => {
    try {
      // Call Supabase niv-chat function
      const response = await supabaseApiService.callNivChat({
        message: query,
        context: currentFeature || 'general',
        sessionId: `session-${Date.now()}`
      });

      const aiMessage = {
        id: Date.now(),
        type: 'assistant',
        content: response.response || "How can I help you with your PR strategy?",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Niv chat error:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'assistant',
        content: "I'm here to help. What would you like to work on?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsTyping(false);
  };

  // Quick action buttons
  const quickActions = [
    { id: 'plan', label: 'Create Strategy', icon: Brain, feature: 'strategic-planning' },
    { id: 'write', label: 'Write Content', icon: FileText, feature: 'content-generator' },
    { id: 'media', label: 'Find Media', icon: Users, feature: 'media-intelligence' },
    { id: 'opp', label: 'Opportunities', icon: Zap, feature: 'opportunity-engine' }
  ];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(0, 0, 0, 0.4)',
      color: '#e8e8e8'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Bot size={20} style={{ color: '#10b981' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffffff' }}>
            Niv - Your PR Strategist
          </h3>
        </div>
        {currentFeature && mcpExpertise[currentFeature] && (
          <div style={{
            fontSize: '0.75rem',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Sparkles size={12} />
            Using {mcpExpertise[currentFeature].mcp}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '0.75rem',
              borderRadius: '8px',
              background: msg.type === 'user' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              color: msg.type === 'user' ? 'white' : '#e8e8e8',
              fontSize: '0.875rem',
              lineHeight: '1.4'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            <Sparkles size={14} className="animate-pulse" />
            Niv is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {!awaitingResponse && (
        <div style={{
          padding: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto'
        }}>
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleFeatureRequest(action.feature, `I want to ${action.label.toLowerCase()}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e8e8e8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                  e.currentTarget.style.borderColor = '#10b981';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Icon size={14} />
                {action.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={awaitingResponse ? "Type your answer..." : "Ask me anything about PR..."}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default AdaptiveNivAssistantEnhanced;