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
  const [conversationPhase, setConversationPhase] = useState('discovery'); // discovery, planning, execution
  const [gatheredContext, setGatheredContext] = useState({});
  const [clientMode, setClientMode] = useState(null); // Track detected client mode
  const [lastClientMode, setLastClientMode] = useState(null); // Remember last mode
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
    
    // Add welcome message if no messages exist
    if (!messages || messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome-1',
        type: 'assistant',
        content: `Hi there! I'm Niv, your PR strategist with 20 years of agency experience. I'm here to help you navigate any communications challenge.

Rather than jumping straight into tools, I prefer to understand your situation first. Are you looking to:
• Launch something and need strategic positioning?
• Handle a crisis or sensitive situation?
• Build relationships with journalists?
• Create content that actually gets coverage?
• Spot opportunities in the market?

What's on your mind today?`,
        timestamp: new Date(),
        expertise: true
      };
      
      const exampleMessage = {
        id: 'welcome-2',
        type: 'assistant',
        content: `💡 **Quick tip from 20 years in PR:** The most successful campaigns I've run started with a simple question: "Who actually cares about this story, and why?" 

I've helped clients turn product launches into thought leadership platforms, managed crisis communications for Fortune 500s, and built media relationships that last decades. Let's figure out the best strategic approach for your specific situation.`,
        timestamp: new Date(),
        expertise: true
      };
      
      setMessages([welcomeMessage, exampleMessage]);
    }
    
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

  // Detect client mode from message
  const detectClientMode = (message) => {
    const lowerMessage = message.toLowerCase();
    const wordCount = message.split(' ').length;
    
    // Crisis indicators - highest priority (more specific patterns)
    const crisisPatterns = [
      'emergency', 'disaster', 'breaking news', 'just happened', 'went viral', 'leaked', 'crisis',
      'damage control', 'urgent help', 'emergency help', 'crisis help', 'disaster help',
      'reputation damage', 'pr disaster', 'media crisis', 'urgent crisis'
    ];
    if (crisisPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'CRISIS_MODE';
    }
    
    // Urgent indicators
    if (['asap', 'urgent', 'now', 'quick', 'just need', 'immediately'].some(i => lowerMessage.includes(i)) || wordCount < 10) {
      return 'URGENT_FIRE';
    }
    
    // Strategic indicators
    const strategicPatterns = [
      'strategic plan', 'strategy', 'campaign', 'quarterly', 'roadmap', 'comprehensive', 'full plan',
      'plan for', 'planning for', 'strategic', 'long-term', 'campaign strategy', 'pr strategy',
      'strategic approach', 'strategic thinking', 'strategic guidance'
    ];
    if (strategicPatterns.some(pattern => lowerMessage.includes(pattern))) {
      return 'STRATEGIC_PLANNING';
    }
    
    // Exploratory indicators
    if (['thinking about', 'considering', 'what if', 'explore', 'options', 'wondering'].some(i => lowerMessage.includes(i))) {
      return 'EXPLORATORY';
    }
    
    return 'NORMAL';
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

    // Detect client mode first
    const detectedMode = detectClientMode(input);
    setClientMode(detectedMode);
    setLastClientMode(detectedMode);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      clientMode: detectedMode
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

  // DON'T automatically open features - start with conversation
  const handleFeatureRequest = async (feature, userInput) => {
    // Reset conversation state for focused discussion
    setConversationPhase('discovery');
    setCurrentContext({ 
      intendedFeature: feature,
      expertise: conversationContext[feature]?.expertise || feature,
      naturalFlow: true,
      readyToExecute: false
    });
    setGatheredContext({});
    
    // Start strategic conversation based on the user's intent
    const strategicQuestions = getStrategicQuestions(feature, userInput);
    
    const response = {
      id: Date.now(),
      type: 'assistant',
      content: strategicQuestions,
      timestamp: new Date(),
      phase: 'discovery'
    };
    
    setMessages(prev => [...prev, response]);
    setIsTyping(false);
  };

  // Strategic questions based on feature intent AND client mode
  const getStrategicQuestions = (feature, userInput) => {
    const input = userInput.toLowerCase();
    const mode = detectClientMode(userInput);
    
    // URGENT MODE - Skip most questions, get to the point
    if (mode === 'URGENT_FIRE') {
      if (feature === 'content-generator') {
        return "Got it. Quick questions: Platform? Target audience? Key message? I'll generate immediately.";
      } else if (feature === 'strategic-planning') {
        return "Strategic plan needed urgently. Let me open the Strategic Planning tool and we'll build this fast. What's your main objective?";
      } else {
        return "What's the immediate need? I'll cut to the chase.";
      }
    }
    
    // CRISIS MODE - Take control
    if (mode === 'CRISIS_MODE') {
      return "I've handled this before. Tell me: What just happened? Who knows? What's been said publicly? I'll take it from here.";
    }
    
    // NORMAL/EXPLORATORY MODE - Full strategic conversation
    if (feature === 'content-generator') {
      if (input.includes('social') || input.includes('post')) {
        return "Before we create any content, let me understand the strategy. What platform are you targeting? LinkedIn posts need a very different approach than Twitter. What's the key message you want to get across, and who's your ideal audience?";
      } else if (input.includes('press release') || input.includes('announcement')) {
        return "Let's make sure this actually gets picked up. What's the news angle here? Is this a product launch, funding announcement, or something else? Who are the journalists that would care about this story?";
      } else {
        return "I'll help you create content that cuts through the noise. What type of content are we talking about, what's the story you're trying to tell, and who needs to hear it?";
      }
    } else if (feature === 'strategic-planning') {
      return "I love tackling strategic challenges. Walk me through the situation - what's your objective, what's the timeline, and what obstacles are you anticipating? Let's think through this together.";
    } else if (feature === 'media-intelligence') {
      return "Let's find the right journalists for maximum impact. What's your story angle, what industry or beat should I focus on, and what's your timing? Are we looking for exclusives or broader coverage?";
    } else if (feature === 'opportunity-engine') {
      return "Time to spot opportunities your competitors are missing. What industry are you in, what trends are you tracking, and what unique positioning do you have? Let's find the perfect angles.";
    } else if (feature === 'crisis-command') {
      return "Crisis mode - I need to understand the situation quickly. What happened, who's affected, and what's the current public narrative? Time is critical here.";
    } else {
      return `Let's dive into this challenge together. Tell me more about what you're trying to accomplish and the constraints you're working within.`;
    }
  };

  // Handle natural conversation flow with proper context building
  const handleNaturalResponse = async (response) => {
    if (!currentContext) return;

    const { intendedFeature, expertise } = currentContext;
    
    // Build context gradually
    const updatedContext = { ...gatheredContext };
    
    // Extract information based on conversation phase
    if (conversationPhase === 'discovery') {
      // Look for key information in their response
      updatedContext.userResponse = response;
      updatedContext.timestamp = new Date();
    }
    
    setGatheredContext(updatedContext);
    
    // Strategic conversation prompt focused on consultation, not execution
    const conversationPrompt = `User said: "${response}"

You're having a strategic conversation about ${intendedFeature}. Based on their response:

1. What strategic insights can you share from your 20 years of experience?
2. What follow-up questions would help you understand their situation better?
3. Are there risks or opportunities they might not be considering?
4. Do you have enough context to make a strategic recommendation, or do you need more information?

IMPORTANT: Don't rush to create content or open tools. Focus on being a strategic advisor. Only suggest moving to execution when you truly understand their needs, constraints, and objectives.

Conversation history: ${JSON.stringify(messages.slice(-3).map(m => ({ type: m.type, content: m.content })))}`;
    
    try {
      const claudeResponse = await supabaseApiService.callNivChat({
        message: conversationPrompt,
        context: { 
          intendedFeature, 
          conversationPhase,
          gatheredContext: updatedContext,
          focusMode: 'strategic_consultation',
          clientMode: clientMode || lastClientMode || 'NORMAL'
        },
        mode: 'consultation',
        sessionId: `session-${Date.now()}`
      });
      
      const responseText = claudeResponse.response || claudeResponse.data || "Let me think about the best strategic approach here.";
      
      const aiMessage = {
        id: Date.now(),
        type: 'assistant',
        content: responseText,
        timestamp: new Date(),
        strategicInsights: claudeResponse.strategicAnalysis,
        phase: conversationPhase
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Check if the conversation indicates readiness to move to execution
      if (shouldMoveToExecution(responseText, updatedContext)) {
        setConversationPhase('planning');
        setCurrentContext({ ...currentContext, readyToExecute: true });
        
        // Ask for final confirmation before opening feature
        setTimeout(() => {
          confirmFeatureExecution(intendedFeature, updatedContext);
        }, 1500);
      }
      
    } catch (error) {
      console.error('Strategic conversation error:', error);
      
      // Fallback response
      const fallbackMessage = {
        id: Date.now(),
        type: 'assistant',
        content: "Got it - strategic planning mode. Based on my 20 years experience, let me open the Strategic Planning tool and we'll build this properly. I'll guide you through my proven framework for creating winning PR strategies.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
    
    setIsTyping(false);
  };

  // Determine if we have enough context to move to execution
  const shouldMoveToExecution = (responseText, context) => {
    const executionIndicators = [
      'sounds like we have what we need',
      'ready to move forward',
      'let\'s proceed with',
      'i think we can now',
      'based on what you\'ve told me, let\'s'
    ];
    
    const lowerResponse = responseText.toLowerCase();
    return executionIndicators.some(indicator => lowerResponse.includes(indicator)) && 
           Object.keys(context).length >= 2; // Ensure we have some context
  };

  // Confirm before opening feature and executing
  const confirmFeatureExecution = async (feature, context) => {
    const confirmationMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `Perfect! Based on our conversation, I recommend we open the ${feature.replace('-', ' ')} tool to execute this strategy. I'll guide you through the process with all the context we've discussed. Ready to proceed?`,
      timestamp: new Date(),
      showConfirmation: true,
      proposedFeature: feature,
      gatheredContext: context
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
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

  // Handle confirmation of feature execution
  const handleFeatureConfirmation = async (feature, context, confirmed) => {
    if (confirmed) {
      // Now actually open the feature
      if (feature !== currentFeature && onFeatureOpen) {
        onFeatureOpen(feature);
      }
      
      // Execute the feature action with gathered context
      await executeFeatureAction(feature, context);
      
      // Reset conversation state
      setConversationPhase('execution');
      setCurrentContext({ ...currentContext, executing: true });
      
      const confirmationMessage = {
        id: Date.now(),
        type: 'assistant',
        content: `Perfect! I'm opening ${feature.replace('-', ' ')} now and will use all the context we discussed to guide you through the process.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmationMessage]);
      
    } else {
      // Continue the conversation
      setConversationPhase('discovery');
      
      const continueMessage = {
        id: Date.now(),
        type: 'assistant',
        content: "Absolutely, let's make sure we get this right. What other aspects should we consider? I want to ensure we have the best strategic approach.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, continueMessage]);
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

      // Enhanced consultation prompt - focus on conversation, not execution
      const enhancedQuery = `User says: "${query}"

As Niv, a senior PR strategist with 20 years of experience, start a strategic conversation:

1. What questions would help you understand their real challenge?
2. What insights from your experience are relevant here?
3. What strategic considerations should they be thinking about?
4. What context do you need before making any recommendations?

IMPORTANT CONVERSATION RULES:
- DON'T immediately suggest opening tools or creating content
- DO ask strategic questions to understand their situation
- DON'T assume you know what they need from one message
- DO share insights and probe for context
- DON'T rush to solutions - build understanding first

Available tools (mention only after understanding their needs):
- Strategic Planning: Comprehensive campaign strategies
- Content Generator: Strategic content creation
- Media Intelligence: Journalist relationships and outreach
- Opportunity Engine: PR opportunity identification
- Crisis Command: Crisis communication management
- Memory Vault: Knowledge management

Respond as a strategic consultant having an initial conversation, not as someone ready to execute.

Current conversation context: ${JSON.stringify(conversationContext)}`;;

      // Call Claude via Supabase with strategic analysis mode
      const response = await supabaseApiService.callNivChat({
        message: enhancedQuery,
        context: {
          currentFeature: currentFeature,
          conversationHistory: messages.slice(-5),
          userIntent: 'strategic_analysis',
          clientMode: clientMode || lastClientMode || 'NORMAL'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Bot size={24} style={{ color: '#10b981' }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#ffffff' }}>
            Niv - Your PR Strategist
          </h3>
          {clientMode && (
            <span style={{
              fontSize: '0.65rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              background: clientMode === 'CRISIS_MODE' ? 'rgba(239, 68, 68, 0.2)' :
                         clientMode === 'URGENT_FIRE' ? 'rgba(251, 146, 60, 0.2)' :
                         clientMode === 'STRATEGIC_PLANNING' ? 'rgba(59, 130, 246, 0.2)' :
                         'rgba(16, 185, 129, 0.2)',
              color: clientMode === 'CRISIS_MODE' ? '#ef4444' :
                     clientMode === 'URGENT_FIRE' ? '#fb923c' :
                     clientMode === 'STRATEGIC_PLANNING' ? '#3b82f6' :
                     '#10b981',
              border: `1px solid ${clientMode === 'CRISIS_MODE' ? '#ef4444' :
                                   clientMode === 'URGENT_FIRE' ? '#fb923c' :
                                   clientMode === 'STRATEGIC_PLANNING' ? '#3b82f6' :
                                   '#10b981'}`,
              fontWeight: '500'
            }}>
              {clientMode === 'CRISIS_MODE' ? '🚨 Crisis' :
               clientMode === 'URGENT_FIRE' ? '⚡ Urgent' :
               clientMode === 'STRATEGIC_PLANNING' ? '🎯 Strategic' :
               clientMode === 'EXPLORATORY' ? '🔍 Exploring' :
               '✓ Ready'}
            </span>
          )}
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
                : msg.expertise 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: msg.expertise ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
              color: msg.type === 'user' ? 'white' : '#e8e8e8',
              fontSize: '0.875rem',
              lineHeight: '1.4'
            }}>
              {msg.expertise && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#10b981'
                }}>
                  <Sparkles size={12} />
                  20 Years PR Experience
                </div>
              )}
              {msg.content}
              {msg.showConfirmation && (
                <div style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => handleFeatureConfirmation(msg.proposedFeature, msg.gatheredContext, true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Yes, let's proceed
                  </button>
                  <button
                    onClick={() => handleFeatureConfirmation(msg.proposedFeature, msg.gatheredContext, false)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      color: '#e8e8e8',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Let's discuss more
                  </button>
                </div>
              )}
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
                onClick={() => handleFeatureRequest(action.feature, `I need help with ${action.label.toLowerCase()}`)}
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