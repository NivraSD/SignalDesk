/**
 * Niv PR Strategist Component
 * Interactive chat interface with Niv, the AI PR Strategist
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Bot, Send, Sparkles, TrendingUp, Users, 
  AlertCircle, Target, Calendar, MessageSquare,
  Brain, Zap, ChevronRight, Loader
} from 'lucide-react';

const NivPRStrategist = ({ onStrategyGenerated }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [mode, setMode] = useState('general');
  const messagesEndRef = useRef(null);

  // Niv's personality indicators
  const nivPersonality = {
    name: 'Niv',
    title: 'Senior PR Strategist',
    experience: '20 years',
    style: 'Direct but warm',
    strengths: ['Media Relations', 'Crisis Management', 'Campaign Strategy']
  };

  // Quick action buttons
  const quickActions = [
    { id: 'strategy', label: 'PR Strategy', icon: Target, prompt: 'Help me develop a PR strategy for' },
    { id: 'media', label: 'Media List', icon: Users, prompt: 'Which journalists should I contact about' },
    { id: 'crisis', label: 'Crisis Help', icon: AlertCircle, prompt: 'I need crisis communication help with' },
    { id: 'campaign', label: 'Campaign', icon: TrendingUp, prompt: 'Let\'s plan a PR campaign for' },
    { id: 'pitch', label: 'Pitch Review', icon: MessageSquare, prompt: 'Review this media pitch:' }
  ];

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      role: 'assistant',
      content: `Hi, I'm Niv, your Senior PR Strategist. With 20 years of agency experience, I'm here to help you navigate media relations, develop campaigns, and handle any PR challenges.

What's on your PR agenda today? I can help with:
• Strategic PR planning
• Media outreach and relationships
• Crisis communications
• Campaign development
• Content strategy

How can I assist you?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setConversationId(Date.now().toString());
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to Niv
  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://signaldesk-production.up.railway.app/api/niv/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId,
          mode: mode,
          context: {
            previousMessages: messages.slice(-5),
            currentProject: localStorage.getItem('activeProject')
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        const nivMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          agent: data.agent
        };
        setMessages(prev => [...prev, nivMessage]);
        
        // Update conversation ID if new
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        // Trigger callback if strategy was generated
        if (onStrategyGenerated && data.response.includes('strategy')) {
          onStrategyGenerated(data.response);
        }
      }
    } catch (error) {
      console.error('Error talking to Niv:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I apologize, I\'m having connection issues. Let me try to help you anyway. What specific PR challenge are you facing?',
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    setInput(action.prompt + ' ');
    setMode(action.id);
    // Focus on input
    document.getElementById('niv-input')?.focus();
  };

  // Handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain size={24} color="white" />
            </div>
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#e8e8e8',
                margin: 0 
              }}>
                {nivPersonality.name}
              </h2>
              <p style={{ 
                fontSize: '13px', 
                color: '#9ca3af',
                margin: '2px 0 0 0'
              }}>
                {nivPersonality.title} • {nivPersonality.experience} Experience
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            fontSize: '11px'
          }}>
            {nivPersonality.strengths.map(strength => (
              <span key={strength} style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                color: '#a78bfa'
              }}>
                {strength}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: mode === action.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${mode === action.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: mode === action.id ? '#60a5fa' : '#9ca3af',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={e => {
                  if (mode !== action.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                <Icon size={14} />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
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
              gap: '1rem',
              alignItems: 'flex-start',
              animation: 'fadeIn 0.3s ease-in'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: message.role === 'user' 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {message.role === 'user' ? (
                <User size={16} color="#60a5fa" />
              ) : (
                <Bot size={16} color="white" />
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: message.role === 'user' ? '#60a5fa' : '#a78bfa'
                }}>
                  {message.role === 'user' ? 'You' : nivPersonality.name}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.error && (
                  <span style={{
                    fontSize: '11px',
                    color: '#ef4444',
                    padding: '0.125rem 0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '10px'
                  }}>
                    Offline Mode
                  </span>
                )}
              </div>
              
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#e8e8e8',
                whiteSpace: 'pre-wrap'
              }}>
                {message.content}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Loader size={16} color="white" className="animate-spin" />
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              Niv is thinking strategically...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '1.5rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <input
            id="niv-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Niv for PR strategy, media advice, or campaign ideas..."
            disabled={loading}
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
          />
          
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading || !input.trim() 
                ? 'rgba(139, 92, 246, 0.1)' 
                : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '8px',
              color: loading || !input.trim() ? '#6b7280' : 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NivPRStrategist;