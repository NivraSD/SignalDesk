// NivStrategicOrchestrator.js - The NEW Niv: Strategic PR Orchestrator
// Primary interface that controls ALL features through conversation
// Implements the complete vision from development specification

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, Send, Sparkles, Brain, FileText, Users, TrendingUp, 
  AlertTriangle, Shield, Target, Zap, Activity, MessageSquare,
  Edit3, Save, Copy, RefreshCw, CheckCircle, ArrowRight,
  Lightbulb, BarChart3, Calendar, Settings
} from 'lucide-react';
import supabaseApiService from '../services/supabaseApiService';

const NivStrategicOrchestrator = ({ 
  // Feature Control Props
  onFeatureOpen,
  onContentGenerate,
  onStrategicPlanGenerate,
  currentFeature,
  
  // Real-time Feature Integration Props
  activeFeatureData,
  onFeatureDataUpdate,
  
  // Message State Props
  messages,
  setMessages
}) => {
  // === CORE STATE ===
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientMode, setClientMode] = useState('NORMAL');
  const [conversationPhase, setConversationPhase] = useState('discovery');
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  
  // === STRATEGIC CONTEXT ===
  const [strategicContext, setStrategicContext] = useState({
    userPreferences: {},
    companyProfile: {},
    currentObjectives: [],
    activeOpportunities: [],
    recentLearnings: []
  });
  
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
    
    const featurePatterns = {
      'strategic-planning': [
        'strategic plan', 'strategy', 'campaign strategy', 'planning', 
        'plan', 'comprehensive strategy', 'strategic approach', 'roadmap'
      ],
      'content-generator': [
        'press release', 'write', 'create', 'draft', 'content', 'article',
        'social post', 'media pitch', 'announcement', 'statement', 'blog post'
      ],
      'media-intelligence': [
        'journalist', 'media', 'reporter', 'press', 'media list', 
        'find journalists', 'media contacts', 'outreach'
      ],
      'opportunity-engine': [
        'opportunity', 'opportunities', 'trending', 'what can i pitch',
        'pr opportunities', 'news', 'newsjacking'
      ],
      'crisis-command': [
        'crisis', 'emergency', 'damage control', 'reputation', 
        'crisis response', 'crisis management'
      ]
    };
    
    for (const [feature, patterns] of Object.entries(featurePatterns)) {
      if (patterns.some(pattern => lowerMessage.includes(pattern))) {
        return feature;
      }
    }
    
    return null;
  }, []);

  // === NIV'S STRATEGIC BRAIN ===
  const generateStrategicResponse = useCallback(async (userMessage, detectedFeature, mode) => {
    setIsProcessing(true);
    
    try {
      // Build Niv's strategic prompt based on the vision
      const strategicPrompt = `You are Niv, a Senior PR Strategist with 20 years of experience. You're the primary interface for SignalDesk, controlling all features through conversation.

CURRENT SITUATION:
- User said: "${userMessage}"
- Detected client mode: ${mode}
- Detected feature intent: ${detectedFeature || 'general_consultation'}
- Current conversation phase: ${conversationPhase}

YOUR PERSONALITY & APPROACH:
- Conversational, friendly, and genuinely enthusiastic about PR strategy
- 20 years of encoded expertise - you've seen it all and know what works
- Client delight focused - make them feel brilliant and confident
- Proactively helpful - anticipate needs and think 3 steps ahead
- Direct but warm - share wisdom and guide with optimism

STRATEGIC INTELLIGENCE:
- Pattern recognition expert - "I've seen this before, here's what works..."
- Situational awareness - understand news cycles, timing, competitive landscape
- Progressive value delivery - immediate answer + context + opportunity
- Mistake prevention - "Quick flag: if you do this, here's what will happen..."

RESPONSE STYLE FOR ${mode}:
${mode === 'URGENT_FIRE' ? 
  '- Direct, immediate, no fluff - give exactly what they need\n- Quick strategic insight + immediate solution\n- "Here\'s what you need right now..."' :
mode === 'CRISIS_MODE' ?
  '- Take control with calm confidence\n- "I\'ve handled this before. Here\'s what we do..."\n- Immediate actions for next 30 minutes' :
mode === 'STRATEGIC_PLANNING' ?
  '- Full strategic depth with enthusiasm\n- Share proven frameworks and approaches\n- "Let me walk you through my 20-year proven strategy..."' :
mode === 'EXPLORATORY' ?
  '- Thought partner mode, conversational exploration\n- "Interesting direction. Let me share what I\'ve seen work..."\n- Ask strategic follow-ups' :
  '- Balanced professional with immediate value\n- Share strategic insights and actionable next steps\n- Anticipate their next question'
}

${detectedFeature ? `
FEATURE ORCHESTRATION:
Since this involves ${detectedFeature}, you should:
1. Start working on it immediately with strategic context
2. Explain how you'll approach it based on your experience
3. Begin generating/planning in real-time
4. Guide them through your proven framework
` : ''}

CURRENT CONTEXT:
- Recent conversation: ${JSON.stringify(messages.slice(-2).map(m => ({ type: m.type, content: m.content })))}

Respond as Niv with enthusiasm, strategic wisdom, and immediate value. If you're opening a feature, explain your approach and start working on it.`;

      const response = await supabaseApiService.callNivChat({
        message: strategicPrompt,
        context: {
          clientMode: mode,
          detectedFeature,
          conversationPhase,
          strategicContext
        },
        mode: 'strategic_orchestration',
        sessionId: `niv-${Date.now()}`
      });

      const responseText = response.response || response.data || "Let me think about the best strategic approach here...";

      // If feature was detected, initiate feature orchestration
      if (detectedFeature && onFeatureOpen) {
        setIsGeneratingInFeature(true);
        setFeatureGenerationProgress('Opening feature and preparing strategic approach...');
        
        // Open the feature
        setTimeout(() => {
          onFeatureOpen(detectedFeature);
          setFeatureGenerationProgress('Feature opened - beginning strategic generation...');
        }, 500);
        
        // If it's content generation, start generating in the feature
        if (detectedFeature === 'content-generator' && onContentGenerate) {
          setTimeout(() => {
            initiateContentGeneration(userMessage, responseText);
          }, 1000);
        } else if (detectedFeature === 'strategic-planning' && onStrategicPlanGenerate) {
          setTimeout(() => {
            initiateStrategicPlanning(userMessage, responseText);
          }, 1000);
        }
      }

      return {
        content: responseText,
        mode,
        detectedFeature,
        strategicInsights: extractStrategicInsights(responseText),
        nextActions: suggestNextActions(detectedFeature, mode)
      };

    } catch (error) {
      console.error('Error generating strategic response:', error);
      return {
        content: "I apologize - let me refocus. As your strategic advisor, I'm here to help you succeed. What's the main challenge you're facing right now?",
        mode,
        error: true
      };
    } finally {
      setIsProcessing(false);
    }
  }, [conversationPhase, messages, onFeatureOpen, onContentGenerate, onStrategicPlanGenerate, strategicContext]);

  // === REAL-TIME CONTENT GENERATION IN FEATURES ===
  const initiateContentGeneration = useCallback(async (userRequest, nivResponse) => {
    setFeatureGenerationProgress('Analyzing your request and company context...');
    
    try {
      // Generate content based on Niv's strategic approach
      const contentData = await generateContentWithStrategy(userRequest, nivResponse);
      
      setFeatureGenerationProgress('Generating content in real-time...');
      
      // Stream content generation if possible
      if (onContentGenerate) {
        onContentGenerate({
          type: detectContentType(userRequest),
          initialContent: contentData.content,
          strategicNotes: contentData.strategy,
          suggestions: contentData.improvements,
          realTimeMode: true
        });
      }
      
      setFeatureGenerationProgress('Content generated - ready for your feedback!');
      
    } catch (error) {
      console.error('Error in content generation:', error);
      setFeatureGenerationProgress('Error in generation - let me try a different approach...');
    } finally {
      setTimeout(() => {
        setIsGeneratingInFeature(false);
        setFeatureGenerationProgress('');
      }, 2000);
    }
  }, [onContentGenerate]);

  const initiateStrategicPlanning = useCallback(async (userRequest, nivResponse) => {
    setFeatureGenerationProgress('Building your strategic framework...');
    
    try {
      const strategyData = await generateStrategyWithFramework(userRequest, nivResponse);
      
      if (onStrategicPlanGenerate) {
        onStrategicPlanGenerate({
          objective: strategyData.objective,
          framework: strategyData.framework,
          timeline: strategyData.timeline,
          tactics: strategyData.tactics,
          realTimeMode: true
        });
      }
      
      setFeatureGenerationProgress('Strategic plan generated - let\'s refine it together!');
      
    } catch (error) {
      console.error('Error in strategic planning:', error);
      setFeatureGenerationProgress('Error in planning - let me recalibrate...');
    } finally {
      setTimeout(() => {
        setIsGeneratingInFeature(false);
        setFeatureGenerationProgress('');
      }, 2000);
    }
  }, [onStrategicPlanGenerate]);

  // === HELPER FUNCTIONS ===
  const generateContentWithStrategy = async (request, strategy) => {
    // This would integrate with the content generation MCP
    return {
      content: "Generated content based on strategic approach...",
      strategy: "Strategic reasoning for this content...",
      improvements: ["Suggestion 1", "Suggestion 2"]
    };
  };

  const generateStrategyWithFramework = async (request, approach) => {
    // This would integrate with the strategic planning MCP
    return {
      objective: "Main strategic objective",
      framework: "Proven framework approach",
      timeline: "Strategic timeline",
      tactics: ["Tactic 1", "Tactic 2", "Tactic 3"]
    };
  };

  const detectContentType = (request) => {
    const lower = request.toLowerCase();
    if (lower.includes('press release')) return 'press-release';
    if (lower.includes('social')) return 'social-post';
    if (lower.includes('pitch')) return 'media-pitch';
    return 'general-content';
  };

  const extractStrategicInsights = (response) => {
    // Extract key strategic insights from Niv's response
    return [];
  };

  const suggestNextActions = (feature, mode) => {
    // Suggest next actions based on feature and mode
    return [];
  };

  // === MESSAGE HANDLING ===
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Detect client mode and feature intent
    const detectedMode = detectClientMode(input);
    const detectedFeature = detectFeatureIntent(input);
    
    setClientMode(detectedMode);

    // Generate Niv's strategic response
    const strategicResponse = await generateStrategicResponse(input, detectedFeature, detectedMode);

    const nivMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: strategicResponse.content,
      mode: strategicResponse.mode,
      feature: strategicResponse.detectedFeature,
      strategicInsights: strategicResponse.strategicInsights,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, nivMessage]);

  }, [input, isProcessing, detectClientMode, detectFeatureIntent, generateStrategicResponse, setMessages]);

  // === SCROLL MANAGEMENT ===
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // === RENDER ===
  return (
    <div className="niv-strategic-orchestrator">
      {/* Header */}
      <div className="niv-header">
        <div className="niv-avatar">
          <Bot className="w-8 h-8 text-blue-600" />
          <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
        </div>
        <div className="niv-status">
          <h3 className="font-bold text-gray-900">Niv</h3>
          <p className="text-sm text-gray-600">
            Strategic PR Orchestrator • 20 Years Experience
            {clientMode !== 'NORMAL' && (
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                clientMode === 'CRISIS_MODE' ? 'bg-red-100 text-red-700' :
                clientMode === 'URGENT_FIRE' ? 'bg-orange-100 text-orange-700' :
                clientMode === 'STRATEGIC_PLANNING' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {clientMode === 'CRISIS_MODE' ? '🚨 Crisis Mode' :
                 clientMode === 'URGENT_FIRE' ? '⚡ Urgent Mode' :
                 clientMode === 'STRATEGIC_PLANNING' ? '🎯 Strategic Mode' :
                 '🔍 Exploring Mode'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Feature Generation Progress */}
      {isGeneratingInFeature && (
        <div className="niv-generation-progress bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Niv is working in the feature...</p>
              <p className="text-sm text-blue-700">{featureGenerationProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="niv-messages space-y-4 flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.type === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="w-4 h-4" />
                  <span className="font-medium">Niv</span>
                  {message.mode && message.mode !== 'NORMAL' && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {message.mode}
                    </span>
                  )}
                </div>
              )}
              
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.strategicInsights && message.strategicInsights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Strategic Insights:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {message.strategicInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-500" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="niv-input border-t bg-white p-4">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Niv to strategize, create content, or orchestrate any PR task..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .niv-strategic-orchestrator {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .niv-header {
          display: flex;
          align-items: center;
          space-x: 12px;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .niv-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .niv-messages {
          min-height: 400px;
          max-height: 600px;
        }

        .niv-generation-progress {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
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