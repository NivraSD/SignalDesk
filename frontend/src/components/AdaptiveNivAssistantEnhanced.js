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

  // Natural conversation context tracking (no rigid flows)
  const conversationContext = {
    'strategic-planning': {
      contextKeys: ['objective', 'timeline', 'constraints', 'planType', 'audience', 'budget'],
      expertise: 'strategic campaign development and execution'
    },
    'content-generator': {
      contextKeys: ['contentType', 'message', 'audience', 'angle', 'deadline', 'requirements'],
      expertise: 'strategic content creation and messaging'
    },
    'media-intelligence': {
      contextKeys: ['beat', 'angle', 'geography', 'tier', 'timeline', 'exclusivity'],
      expertise: 'media relationship management and outreach strategy'
    },
    'opportunity-engine': {
      contextKeys: ['industry', 'trends', 'timing', 'competitive_landscape'],
      expertise: 'opportunity identification and strategic positioning'
    },
    'crisis-command': {
      contextKeys: ['situation', 'stakeholders', 'timeline', 'impact_level', 'response_strategy'],
      expertise: 'crisis communication and reputation management'
    }
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

  // Process user message with Claude understanding
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

    // Check if we're in a natural conversation flow
    if (currentContext && currentContext.naturalFlow) {
      await handleNaturalResponse(input);
      return;
    }

    // Use Claude to understand intent and context
    await handleClaudeAnalysis(input);
  };

  // Handle feature-specific requests with natural conversation
  const handleFeatureRequest = async (feature, userInput) => {
    const mcp = mcpExpertise[feature];
    const context = conversationContext[feature];
    
    // Don't re-open if already in the feature
    if (currentFeature !== feature && onFeatureOpen) {
      onFeatureOpen(feature);
    }

    // Set natural conversation context
    setCurrentContext({ 
      feature, 
      expertise: context?.expertise || feature,
      gatheredInfo: {},
      naturalFlow: true
    });
    
    // Generate natural response based on the request
    let naturalResponse = '';
    
    if (feature === 'strategic-planning') {
      naturalResponse = `Let's create a strategic plan that actually works. Tell me about your objective and I'll think through the strategy, timing, and execution approach. What are you looking to achieve?`;
    } else if (feature === 'content-generator') {
      naturalResponse = `I'll help you create content that journalists actually want to cover. What's the story you're trying to tell, and who needs to hear it?`;
    } else if (feature === 'media-intelligence') {
      naturalResponse = `Let's find the right journalists for your story. What's your angle, and what beat or industry are we targeting? I'll think about which contacts would be most interested.`;
    } else if (feature === 'opportunity-engine') {
      naturalResponse = `Time to spot some PR gold. What industry or trend are you tracking? I'll analyze the opportunity landscape and find angles your competitors are missing.`;
    } else if (feature === 'crisis-command') {
      naturalResponse = `Crisis mode activated. Tell me what's happening and I'll help you map stakeholders, craft messaging, and control the narrative. What's the situation?`;
    } else {
      naturalResponse = `I'm opening ${feature.replace('-', ' ')} and bringing my 20 years of experience to help you succeed. What specific challenge are you facing?`;
    }
    
    const response = {
      id: Date.now(),
      type: 'assistant',
      content: naturalResponse,
      timestamp: new Date(),
      feature: feature
    };
    
    setMessages(prev => [...prev, response]);
    setIsTyping(false);
  };

  // Handle natural conversation flow (replaces rigid guided responses)
  const handleNaturalResponse = async (response) => {
    if (!currentContext) return;

    const { feature, gatheredInfo, expertise } = currentContext;
    
    // Update gathered information naturally
    const updatedInfo = { ...gatheredInfo, latestResponse: response };
    setCurrentContext({ ...currentContext, gatheredInfo: updatedInfo });
    
    // Let Claude decide if we have enough information or need more context
    const contextualPrompt = `User provided: "${response}"
    
For ${feature} (${expertise}), do I have enough information to help them, or should I ask strategic follow-up questions? Be natural and conversational - act like a senior PR strategist having a real conversation, not a chatbot with a checklist.`;
    
    try {
      const claudeResponse = await supabaseApiService.callNivChat({
        message: contextualPrompt,
        context: { feature, gatheredInfo: updatedInfo, conversationHistory: messages.slice(-3) },
        mode: 'conversation',
        sessionId: `session-${Date.now()}`
      });
      
      const aiMessage = {
        id: Date.now(),
        type: 'assistant',
        content: claudeResponse.response || claudeResponse.data || "Let me think about the best approach for your situation.",
        timestamp: new Date(),
        strategicInsights: claudeResponse.strategicAnalysis
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Check if Claude suggested executing the feature
      if (claudeResponse.response && 
          (claudeResponse.response.includes('let me create') || 
           claudeResponse.response.includes('I\'ll generate') ||
           claudeResponse.response.includes('let\'s build'))) {
        // Execute the feature with gathered information
        setTimeout(() => {
          executeFeatureAction(feature, updatedInfo);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Natural conversation error:', error);
      // Fallback to direct execution if Claude fails
      await executeFeatureAction(feature, updatedInfo);
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

  // Handle Claude-powered analysis with intent recognition
  const handleClaudeAnalysis = async (query) => {
    try {
      // Build context from conversation history
      const conversationContext = {
        currentFeature: currentFeature,
        previousMessages: messages.slice(-5).map(m => ({
          type: m.type,
          content: m.content
        })),
        availableFeatures: Object.keys(featurePatterns),
        currentContext: currentContext
      };

      // Enhanced strategic analysis prompt for Niv
      const enhancedQuery = `User says: "${query}"

As Niv, a senior PR strategist with 20 years of experience, analyze this request:

1. What's the real PR challenge or opportunity here?
2. What strategic approach would you recommend?
3. Do they need a specific SignalDesk feature, or just strategic guidance?
4. What risks or opportunities should they consider?
5. What's your expert recommendation for next steps?

Available SignalDesk features:
- Strategic Planning: Comprehensive campaign strategies
- Content Generator: Strategic content creation
- Media Intelligence: Journalist relationships and outreach
- Opportunity Engine: PR opportunity identification
- Crisis Command: Crisis communication management
- Memory Vault: Knowledge management

Respond as Niv would - warm but direct, strategic, and focused on actionable insights. If you recommend opening a feature, explain the strategic reasoning.

Current conversation context: ${JSON.stringify(conversationContext)}`;

      // Call Claude via Supabase with strategic analysis mode
      const response = await supabaseApiService.callNivChat({
        message: enhancedQuery,
        context: {
          currentFeature: currentFeature,
          conversationHistory: messages.slice(-5),
          userIntent: 'strategic_analysis'
        },
        mode: 'analysis',
        sessionId: `session-${Date.now()}`
      });

      // Parse Claude's strategic response
      const claudeResponse = response.response || response.data || '';
      const strategicInsights = response.strategicAnalysis || null;
      
      // Add Claude's strategic analysis
      const aiMessage = {
        id: Date.now(),
        type: 'assistant',
        content: claudeResponse,
        timestamp: new Date(),
        strategicInsights: strategicInsights,
        expertiseLevel: '20_years_experience'
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Check if Claude identified a feature to open
      const featureToOpen = detectFeatureFromClaudeResponse(claudeResponse);
      
      if (featureToOpen) {
        // Open the feature with strategic context
        setTimeout(() => {
          handleFeatureRequest(featureToOpen, query);
        }, 1000);
      }
    } catch (error) {
      console.error('Claude analysis error:', error);
      
      // Fallback to pattern matching if Claude fails
      const detectedFeature = detectFeatureIntent(query);
      
      if (detectedFeature) {
        await handleFeatureRequest(detectedFeature, query);
      } else {
        const errorMessage = {
          id: Date.now(),
          type: 'assistant',
          content: "I understand you need help. Could you tell me more about what you'd like to accomplish?",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
    
    setIsTyping(false);
  };

  // Detect feature intent from Claude's response
  const detectFeatureFromClaudeResponse = (response) => {
    const lowerResponse = response.toLowerCase();
    
    // Check for explicit feature mentions
    if (lowerResponse.includes('opening strategic planning') || 
        lowerResponse.includes("let's create a strategic plan")) {
      return 'strategic-planning';
    }
    if (lowerResponse.includes('opening content generator') || 
        lowerResponse.includes("let's write") ||
        lowerResponse.includes("i'll help you create content")) {
      return 'content-generator';
    }
    if (lowerResponse.includes('opening media intelligence') || 
        lowerResponse.includes("finding journalists")) {
      return 'media-intelligence';
    }
    if (lowerResponse.includes('opening opportunity engine')) {
      return 'opportunity-engine';
    }
    
    return null;
  };

  // Handle general queries (fallback)
  const handleGeneralQuery = async (query) => {
    // This is now a fallback - main logic is in handleClaudeAnalysis
    await handleClaudeAnalysis(query);
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