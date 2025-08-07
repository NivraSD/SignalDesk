import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, Eye, Zap, AlertTriangle } from 'lucide-react';

const MonitoringChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your AI Monitoring Advisor. I can help you set up intelligent monitoring for any company or brand. Just tell me what you want to monitor - it could be as simple as 'Amazon' or 'my SaaS startup' - and I'll build a comprehensive monitoring strategy for you.",
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [monitoringProfile, setMonitoringProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send to Claude for intelligent analysis
      const response = await analyzeWithClaude(userMessage.content, messages, monitoringProfile);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        profile: response.profile,
        suggestions: response.suggestions,
        monitoringPlan: response.monitoringPlan
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Update monitoring profile if provided
      if (response.profile) {
        setMonitoringProfile(response.profile);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeWithClaude = async (userInput, conversationHistory, currentProfile) => {
    const token = localStorage.getItem('token');
    
    // Build context from conversation history
    const context = conversationHistory.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const prompt = `You are an expert AI Monitoring Advisor. Your job is to help users set up intelligent monitoring strategies for companies, brands, or topics.

Current conversation:
${context}
User: ${userInput}

${currentProfile ? `Current monitoring profile: ${JSON.stringify(currentProfile, null, 2)}` : ''}

Your capabilities:
1. Analyze any company/brand from minimal input (e.g., "Amazon", "my fintech startup")
2. Build comprehensive company profiles including industry, competitors, risks, opportunities
3. Suggest specific monitoring keywords, sources, and alerts
4. Provide actionable insights on what to watch for
5. Customize strategies based on user's role (PR, marketing, executive, etc.)

Guidelines:
- Be conversational and helpful
- If user mentions a well-known company (Amazon, Microsoft, etc.), provide rich insights about their business model, key competitors, typical PR challenges, etc.
- If user mentions a generic industry or startup, ask clarifying questions to build a profile
- Always provide specific, actionable monitoring suggestions
- Include potential risks and opportunities to monitor
- Suggest relevant keywords, news sources, and alert thresholds

Response format (JSON):
{
  "content": "Your conversational response to the user",
  "profile": {
    "company": "Company name",
    "industry": "Industry sector", 
    "description": "Brief company description",
    "keyCompetitors": ["competitor1", "competitor2"],
    "businessModel": "How they make money",
    "keyRisks": ["risk1", "risk2"],
    "opportunities": ["opportunity1", "opportunity2"],
    "targetAudience": "Who they serve"
  },
  "suggestions": [
    {
      "type": "keywords",
      "title": "Suggested Keywords",
      "items": ["keyword1", "keyword2", "keyword3"]
    },
    {
      "type": "sources", 
      "title": "Recommended Sources",
      "items": ["TechCrunch", "Industry Publication X"]
    },
    {
      "type": "alerts",
      "title": "Key Things to Watch",
      "items": ["alert1", "alert2"]
    }
  ],
  "monitoringPlan": {
    "primaryFocus": "What to monitor most closely",
    "secondaryFocus": "Additional monitoring areas", 
    "alertThresholds": "When to pay attention",
    "reviewFrequency": "How often to check"
  }
}

Important: Always return valid JSON. If you can't determine much about the company/topic, ask clarifying questions while still providing your best analysis.`;

    const response = await fetch('http://localhost:5001/api/monitoring/chat-analyze', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        userInput: userInput,
        context: context,
        currentProfile: currentProfile
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from AI advisor');
    }

    const data = await response.json();
    return data.analysis;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message) => {
    const isBot = message.type === 'bot';
    
    return (
      <div key={message.id} className={`flex gap-3 mb-6 ${isBot ? '' : 'flex-row-reverse'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isBot 
            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
            : 'bg-gray-600'
        }`}>
          {isBot ? (
            <Bot className="w-5 h-5 text-white" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
        
        <div className={`flex-1 ${isBot ? 'max-w-4xl' : 'max-w-2xl'}`}>
          <div className={`p-4 rounded-2xl ${
            isBot 
              ? 'bg-white shadow-sm border' 
              : 'bg-blue-600 text-white ml-auto'
          }`}>
            <div className="prose prose-sm max-w-none">
              {message.content}
            </div>
            
            {/* Render profile information */}
            {message.profile && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Company Profile
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Industry:</span>
                    <span className="ml-2 font-medium">{message.profile.industry}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Business Model:</span>
                    <span className="ml-2 font-medium">{message.profile.businessModel}</span>
                  </div>
                  {message.profile.keyCompetitors && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Key Competitors:</span>
                      <span className="ml-2 font-medium">{message.profile.keyCompetitors.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Render suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-4 space-y-3">
                {message.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      {suggestion.type === 'keywords' && <Sparkles className="w-4 h-4 text-purple-600" />}
                      {suggestion.type === 'sources' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {suggestion.type === 'alerts' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                      {suggestion.title}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.items.map((item, itemIdx) => (
                        <span key={itemIdx} className="px-2 py-1 bg-white rounded-md text-sm border">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Render monitoring plan */}
            {message.monitoringPlan && (
              <div className="mt-4 p-4 bg-green-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  Monitoring Strategy
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Primary Focus:</span>
                    <p className="text-gray-600 mt-1">{message.monitoringPlan.primaryFocus}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Review Frequency:</span>
                    <p className="text-gray-600 mt-1">{message.monitoringPlan.reviewFrequency}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className={`text-xs text-gray-500 mt-2 ${isBot ? '' : 'text-right'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  const quickSuggestions = [
    "Help me monitor Amazon",
    "Set up monitoring for my B2B SaaS startup", 
    "I need to track Microsoft's reputation",
    "Monitor my competitor TechCorp",
    "What should I watch for Tesla?"
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Monitoring Advisor</h1>
            <p className="text-sm text-gray-600">
              Intelligent monitoring strategies from minimal input
            </p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.map(renderMessage)}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 max-w-4xl">
                <div className="p-4 rounded-2xl bg-white shadow-sm border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Quick suggestions (shown only if no conversation yet) */}
      {messages.length <= 1 && (
        <div className="px-6 py-2">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 mb-3">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(suggestion)}
                  className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Tell me what you want to monitor (e.g., 'Amazon', 'my fintech startup', 'OpenAI')..."
                className="w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringChatbot;