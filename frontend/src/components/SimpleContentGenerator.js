// Simple Conversational Content Generator - Claude-style natural interaction
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Download, Sparkles, AlertCircle } from 'lucide-react';

const SimpleContentGenerator = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! I'm your AI writing partner. I can help you create press releases, social media posts, Q&A documents, and more. Just tell me what you need!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to Claude
  const sendMessage = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsThinking(true);

    try {
      const apiUrl = 'https://signaldesk-production.up.railway.app/api';
      const response = await fetch(`${apiUrl}/ai/unified-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: currentInput,
          mode: 'content',
          context: {
            folder: 'content-generator',
            previousMessages: messages.slice(-5).map(msg => ({
              type: msg.type === 'user' ? 'user' : 'ai',
              content: msg.content
            }))
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response
        };
        setMessages(prev => [...prev, aiMessage]);

        // Check if Claude generated actual content (press release, social post, etc.)
        if (isActualContent(data.response)) {
          setGeneratedContent(data.response);
        }
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "Sorry, I had trouble responding. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  // Simple heuristic to detect if Claude generated actual content vs conversation
  const isActualContent = (text) => {
    const contentIndicators = [
      'FOR IMMEDIATE RELEASE',
      'Press Release',
      'Q:',
      'Question:',
      '---',
      'Subject:',
      '#',
      '• ',
      '- ',
      'ABOUT',
      'Contact:'
    ];
    
    return contentIndicators.some(indicator => text.includes(indicator)) && text.length > 200;
  };

  // Copy content to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Download content as text file
  const downloadContent = (content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#0f0f0f',
      color: '#e8e8e8'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} style={{ color: '#7c3aed' }} />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            AI Content Generator
          </h2>
        </div>
        <p style={{ 
          margin: '0.25rem 0 0 0', 
          fontSize: '12px', 
          color: '#9ca3af' 
        }}>
          Natural conversation with Claude for content creation
        </p>
      </div>

      {/* Chat Messages */}
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
              alignItems: 'flex-start',
              gap: '0.75rem',
              ...(message.type === 'user' ? { flexDirection: 'row-reverse' } : {})
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: message.type === 'user' ? '#3b82f6' : '#7c3aed',
              flexShrink: 0
            }}>
              {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Message Bubble */}
            <div style={{
              maxWidth: '80%',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              backgroundColor: message.type === 'user' 
                ? 'rgba(59, 130, 246, 0.15)' 
                : 'rgba(124, 58, 237, 0.15)',
              border: '1px solid ' + (message.type === 'user' 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'rgba(124, 58, 237, 0.2)'),
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5',
              fontSize: '14px'
            }}>
              {message.content}
              
              {/* Content Actions - show for assistant messages with long content */}
              {message.type === 'assistant' && message.content.length > 200 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <button
                    onClick={() => copyToClipboard(message.content)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      color: '#e8e8e8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                  <button
                    onClick={() => downloadContent(message.content)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '11px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      color: '#e8e8e8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#7c3aed'
            }}>
              <Bot size={16} />
            </div>
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                gap: '2px'
              }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: '#a78bfa',
                      animation: `pulse 1.5s infinite ${i * 0.2}s`
                    }}
                  />
                ))}
              </div>
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.3)'
      }}>
        {/* Quick Examples */}
        <div style={{ 
          marginBottom: '0.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {[
            "Write a press release about our product launch",
            "Create Q&A for our funding announcement", 
            "Generate social media posts for our event"
          ].map(example => (
            <button
              key={example}
              onClick={() => setInputValue(example)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '11px',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: '12px',
                color: '#c4b5fd',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {example}
            </button>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Tell me what content you need..."
            disabled={isThinking}
            style={{
              flex: 1,
              minHeight: '42px',
              maxHeight: '120px',
              padding: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#e8e8e8',
              fontSize: '14px',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isThinking}
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: inputValue.trim() && !isThinking ? '#7c3aed' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: inputValue.trim() && !isThinking ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Send size={18} />
          </button>
        </div>

        <p style={{ 
          fontSize: '11px', 
          color: '#6b7280', 
          margin: '0.5rem 0 0 0',
          textAlign: 'center'
        }}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% {
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleContentGenerator;