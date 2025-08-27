import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, X, Send, Sparkles, Brain, Target, 
  TrendingUp, Shield, AlertCircle, Lightbulb,
  MessageSquare, ChevronRight, Users, Database
} from 'lucide-react';

const StakeholderAIChat = ({ stakeholder, intelligenceData, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInitialized = useRef(false);

  useEffect(() => {
    if (!chatInitialized.current && stakeholder) {
      chatInitialized.current = true;
      
      // Initial AI message with context
      const initialMessage = {
        id: Date.now(),
        type: 'ai',
        content: `I'm analyzing ${stakeholder.name} for you. Based on our intelligence gathering:\n\n` +
          `📊 **Current Status**\n` +
          `• Type: ${stakeholder.type || 'Stakeholder'}\n` +
          `• Influence: ${stakeholder.influence}/10\n` +
          `• Current Sentiment: ${stakeholder.currentSentiment}/10\n` +
          `• Source Count: ${stakeholder.sourceCount || 0}\n` +
          `${stakeholder.preIndexed ? '• Pre-indexed stakeholder with verified sources\n' : ''}\n` +
          `What specific insights would you like about ${stakeholder.name}? I can help with:\n` +
          `• Engagement strategies\n` +
          `• Risk analysis\n` +
          `• Communication recommendations\n` +
          `• Monitoring priorities`,
        suggestions: [
          'What are the key risks?',
          'How should we engage them?',
          'What are they saying about us?',
          'Generate action plan'
        ]
      };
      
      setMessages([initialMessage]);
    }
  }, [stakeholder]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue, stakeholder, intelligenceData);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (query, stakeholder, data) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('risk')) {
      return {
        id: Date.now(),
        type: 'ai',
        content: `Based on my analysis of ${stakeholder.name}, here are the key risks:\n\n` +
          `🔴 **High Priority Risks**\n` +
          `• ${stakeholder.currentSentiment < 5 ? 'Negative sentiment trending - requires immediate attention' : 'Sentiment stable but requires monitoring'}\n` +
          `• ${stakeholder.influence > 7 ? 'High influence stakeholder - any negative action could have significant impact' : 'Moderate influence - manageable risk level'}\n` +
          `${stakeholder.type?.includes('Regulator') ? '• Regulatory compliance risks - ensure all requirements are met\n' : ''}\n` +
          `⚠️ **Mitigation Strategies**\n` +
          `• Schedule regular engagement touchpoints\n` +
          `• Monitor news and social media mentions daily\n` +
          `• Prepare response templates for common concerns\n` +
          `• Assign dedicated relationship manager`,
        suggestions: ['Create mitigation plan', 'Set up alerts', 'View historical trends']
      };
    }

    if (lowerQuery.includes('engage') || lowerQuery.includes('engagement')) {
      return {
        id: Date.now(),
        type: 'ai',
        content: `Here's a tailored engagement strategy for ${stakeholder.name}:\n\n` +
          `🎯 **Engagement Approach**\n` +
          `• ${stakeholder.type?.includes('Investor') ? 'Quarterly investor updates with financial metrics' : 
              stakeholder.type?.includes('Media') ? 'Proactive PR outreach with exclusive stories' : 
              'Regular stakeholder briefings and updates'}\n` +
          `• Preferred channels: ${stakeholder.preIndexed ? 'Official IR site, SEC filings, executive communications' : 'Email, virtual meetings, social media'}\n\n` +
          `📅 **Recommended Cadence**\n` +
          `• Monthly: Performance updates\n` +
          `• Quarterly: Strategic briefings\n` +
          `• Ad-hoc: Major announcements\n\n` +
          `💡 **Key Messages**\n` +
          `• Emphasize ${stakeholder.topics?.join(', ') || 'innovation, growth, stability'}\n` +
          `• Address concerns about ${stakeholder.concerns?.join(', ') || 'market conditions, competition'}`,
        suggestions: ['Draft first message', 'Schedule meeting', 'Create content calendar']
      };
    }

    if (lowerQuery.includes('saying') || lowerQuery.includes('sentiment')) {
      return {
        id: Date.now(),
        type: 'ai',
        content: `Here's what we're seeing from ${stakeholder.name}:\n\n` +
          `📊 **Recent Sentiment Analysis**\n` +
          `• Overall: ${stakeholder.currentSentiment >= 7 ? '🟢 Positive' : stakeholder.currentSentiment >= 4 ? '🟡 Neutral' : '🔴 Negative'}\n` +
          `• Trend: ${stakeholder.trend || 'Stable'}\n\n` +
          `🗣️ **Key Themes**\n` +
          `${stakeholder.topics?.map(topic => `• ${topic}`).join('\n') || '• No specific themes identified yet'}\n\n` +
          `📈 **Intelligence Summary**\n` +
          `• ${intelligenceData?.length || 0} mentions tracked\n` +
          `• Most discussed: ${stakeholder.topics?.[0] || 'General business updates'}\n` +
          `• Engagement level: ${stakeholder.engagementLevel || 6}/10`,
        suggestions: ['View detailed mentions', 'Compare to peers', 'Set sentiment alerts']
      };
    }

    if (lowerQuery.includes('action') || lowerQuery.includes('plan')) {
      return {
        id: Date.now(),
        type: 'ai',
        content: `I've created an action plan for ${stakeholder.name}:\n\n` +
          `📋 **30-Day Action Plan**\n\n` +
          `**Week 1: Assessment**\n` +
          `☐ Review all recent communications\n` +
          `☐ Analyze sentiment drivers\n` +
          `☐ Identify key decision makers\n\n` +
          `**Week 2: Engagement**\n` +
          `☐ Send personalized outreach\n` +
          `☐ Schedule stakeholder meeting\n` +
          `☐ Prepare briefing materials\n\n` +
          `**Week 3: Execution**\n` +
          `☐ Conduct stakeholder meeting\n` +
          `☐ Address top concerns\n` +
          `☐ Share strategic updates\n\n` +
          `**Week 4: Follow-up**\n` +
          `☐ Send meeting summary\n` +
          `☐ Implement feedback\n` +
          `☐ Set ongoing cadence\n\n` +
          `Would you like me to create tasks for this plan?`,
        suggestions: ['Create tasks', 'Export plan', 'Assign to team', 'Set reminders']
      };
    }

    // Default response
    return {
      id: Date.now(),
      type: 'ai',
      content: `I can help you develop strategies for ${stakeholder.name}. Here are some areas we can explore:\n\n` +
        `• **Engagement Planning**: Build a comprehensive outreach strategy\n` +
        `• **Risk Assessment**: Identify and mitigate potential issues\n` +
        `• **Message Development**: Craft targeted communications\n` +
        `• **Monitoring Strategy**: Set up alerts and tracking\n\n` +
        `What aspect would you like to focus on first?`,
      suggestions: ['Engagement planning', 'Risk assessment', 'Message development', 'Monitoring setup']
    };
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    handleSend();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        width: '90%',
        maxWidth: '800px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#ede9fe',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain size={28} style={{ color: '#6d28d9' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                AI Strategy Advisor
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Analyzing {stakeholder.name} • {stakeholder.type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Chat Messages */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map(message => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '70%',
                display: 'flex',
                gap: '0.75rem',
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
              }}>
                {message.type === 'ai' && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: '#ede9fe',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={18} style={{ color: '#6d28d9' }} />
                  </div>
                )}
                
                <div>
                  <div style={{
                    padding: '1rem',
                    background: message.type === 'user' ? '#6366f1' : '#f3f4f6',
                    color: message.type === 'user' ? 'white' : '#111827',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.content}
                  </div>
                  
                  {message.suggestions && (
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.target.style.background = '#f3f4f6';
                            e.target.style.borderColor = '#6366f1';
                          }}
                          onMouseLeave={e => {
                            e.target.style.background = 'white';
                            e.target.style.borderColor = '#e5e7eb';
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
              <Bot size={16} />
              <span style={{ fontSize: '0.875rem' }}>AI is thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              gap: '0.75rem'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask about ${stakeholder.name}...`}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: 'white'
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: inputValue.trim() ? '#6366f1' : '#e5e7eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <Send size={16} />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StakeholderAIChat;