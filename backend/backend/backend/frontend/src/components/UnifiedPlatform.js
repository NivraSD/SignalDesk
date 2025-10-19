// UnifiedPlatform.js - Railway UI with Adaptive AI Assistant and Feature List
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import ContentGeneratorModule from './ContentGeneratorModule';
import API_BASE_URL from '../config/api';
import {
  Bot, Brain, FileText, Users, TrendingUp, AlertTriangle, 
  BarChart3, Archive, Send, ChevronLeft, ChevronRight, X,
  Sparkles, MessageSquare, Shield, Target, Menu
} from 'lucide-react';

const UnifiedPlatform = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const messagesEndRef = useRef(null);
  
  // Panel states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);
  
  // AI Assistant state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // Content Generator state
  const [generatedContent, setGeneratedContent] = useState('');
  const [currentContentType, setCurrentContentType] = useState(null);

  // Feature definitions - all SignalDesk components
  const features = [
    {
      id: 'content-generator',
      name: 'Content Generator',
      icon: FileText,
      color: '#8b5cf6',
      description: 'AI-powered content creation',
      status: 'active', // Fully integrated
      component: ContentGeneratorModule
    },
    {
      id: 'media-intelligence',
      name: 'Media Intelligence',
      icon: Users,
      color: '#10b981',
      description: 'Journalist discovery & outreach',
      status: 'pending',
      path: `/projects/${projectId}/media-list`
    },
    {
      id: 'campaign-intelligence',
      name: 'Campaign Intelligence',
      icon: Brain,
      color: '#f59e0b',
      description: 'Strategic campaign planning',
      status: 'pending',
      path: `/projects/${projectId}/campaign-intelligence-enhanced`
    },
    {
      id: 'memory-vault',
      name: 'Memory Vault',
      icon: Archive,
      color: '#6366f1',
      description: 'Project knowledge base',
      status: 'pending',
      path: `/projects/${projectId}`
    },
    {
      id: 'stakeholder-intelligence',
      name: 'Stakeholder Intelligence',
      icon: TrendingUp,
      color: '#ec4899',
      description: 'Stakeholder monitoring',
      status: 'pending',
      path: `/projects/${projectId}/stakeholder-intelligence`
    },
    {
      id: 'crisis-command',
      name: 'Crisis Command',
      icon: AlertTriangle,
      color: '#ef4444',
      description: 'Crisis management',
      status: 'pending',
      path: `/projects/${projectId}/crisis-command`
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      icon: BarChart3,
      color: '#14b8a6',
      description: 'Performance metrics',
      status: 'pending',
      path: `/projects/${projectId}/reports`
    }
  ];

  // Initialize AI Assistant
  useEffect(() => {
    setMessages([{
      id: Date.now(),
      type: 'assistant',
      content: 'Welcome to SignalDesk! I\'m your adaptive AI assistant. Select a feature from the right panel to get started.',
      timestamp: new Date()
    }]);
  }, []);

  // Handle feature selection
  const handleFeatureSelect = (feature) => {
    if (feature.status === 'pending' && feature.path) {
      // Navigate to external route for non-integrated features
      navigate(feature.path);
      return;
    }

    // Set selected feature for integrated components
    setSelectedFeature(feature);
    
    // Inform AI Assistant
    const contextMsg = {
      id: Date.now(),
      type: 'system',
      content: `Activated ${feature.name}. ${feature.description}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, contextMsg]);
  };

  // Handle messages from Content Generator
  const handleContentGeneratorMessage = (msg) => {
    if (msg.type === 'edit_request') {
      setIsEditingMode(true);
      handleEditRequest(msg);
    } else if (msg.type === 'user' && msg.content) {
      const userMsg = {
        id: Date.now(),
        type: 'user',
        content: msg.content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      sendMessage(msg.content);
    }
  };

  // Handle edit requests
  const handleEditRequest = async (request) => {
    const { content: editPrompt, currentContent, metadata } = request;
    
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: `Please edit this content: "${editPrompt}"`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/unified-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: `Edit the following content based on this request: "${editPrompt}"\n\nCurrent content:\n${currentContent}`,
          mode: 'content',
          context: {
            folder: 'content-generator',
            editing: true,
            contentType: metadata?.contentType,
            tone: metadata?.tone
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMsg = {
          id: Date.now(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        setGeneratedContent(data.response);
      }
    } catch (error) {
      console.error('Error processing edit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message to AI
  const sendMessage = async (text) => {
    if (!text?.trim()) return;

    setLoading(true);
    
    try {
      const isEditing = isEditingMode && generatedContent;
      
      const response = await fetch(`${API_BASE_URL}/ai/unified-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: isEditing ? 
            `Continue editing this content based on: "${text}"\n\nCurrent content:\n${generatedContent}` : 
            text,
          mode: selectedFeature?.id === 'content-generator' ? 'content' : 'general',
          context: {
            folder: selectedFeature?.id,
            editing: isEditing
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMsg = {
          id: Date.now(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        
        // Check if content was generated
        if (isActualGeneratedContent(data.response)) {
          setGeneratedContent(data.response);
          detectContentType(data.response);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    sendMessage(message);
    setMessage('');
  };

  // Check if response is actual generated content
  const isActualGeneratedContent = (text) => {
    if (!text || text.length < 100) return false;
    
    const indicators = [
      'FOR IMMEDIATE RELEASE',
      'Dear ',
      'Subject:',
      'Q:',
      'Question:',
      '#',
      'We are pleased'
    ];
    
    return indicators.some(indicator => text.includes(indicator));
  };

  // Detect content type
  const detectContentType = (text) => {
    if (text.includes('FOR IMMEDIATE RELEASE')) {
      setCurrentContentType('press-release');
    } else if (text.includes('Q:') || text.includes('Question:')) {
      setCurrentContentType('qa-doc');
    } else if (text.includes('#')) {
      setCurrentContentType('social-post');
    }
  };

  // Update content from Content Generator
  const handleContentUpdate = (newContent) => {
    setGeneratedContent(newContent);
    if (newContent && !isEditingMode) {
      setIsEditingMode(false);
    }
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0d0d1e',
      color: '#e8e8e8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* LEFT PANEL - Adaptive AI Assistant */}
      <div style={{
        width: leftPanelOpen ? '380px' : '60px',
        backgroundColor: '#1a1a2e',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'relative'
      }}>
        {/* Toggle Button */}
        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          style={{
            position: 'absolute',
            right: '-20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1a1a2e',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          {leftPanelOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {leftPanelOpen ? (
          <>
            {/* AI Assistant Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Bot size={24} style={{ color: 'white' }} />
                <div>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'white',
                    margin: 0
                  }}>
                    Adaptive AI Assistant
                  </h2>
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: 0
                  }}>
                    {selectedFeature ? `${selectedFeature.name} Mode` : 'General Mode'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 
                      msg.type === 'user' ? '#8b5cf6' :
                      msg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                      msg.type === 'system' ? 'rgba(255, 255, 255, 0.05)' :
                      'rgba(255, 255, 255, 0.08)',
                    color: msg.type === 'user' ? 'white' : '#e8e8e8'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {msg.content}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {loading && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    AI is thinking...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              style={{
                padding: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{
                display: 'flex',
                gap: '10px'
              }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isEditingMode ? "Continue editing..." : "Ask me anything..."}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: '#e8e8e8',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#8b5cf6';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading || !message.trim() ? '#4b5563' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          // Collapsed state
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '20px',
            gap: '20px'
          }}>
            <Bot size={24} style={{ color: '#8b5cf6' }} />
          </div>
        )}
      </div>

      {/* CENTER - Expanded Feature Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#16162a',
        position: 'relative'
      }}>
        {selectedFeature?.id === 'content-generator' ? (
          <div style={{
            height: '100%',
            overflowY: 'auto',
            padding: '20px'
          }}>
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedFeature(null);
                setIsEditingMode(false);
                setGeneratedContent('');
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <X size={20} style={{ color: '#e8e8e8' }} />
            </button>
            
            <ContentGeneratorModule
              onAIMessage={handleContentGeneratorMessage}
              generatedContent={generatedContent}
              onContentUpdate={handleContentUpdate}
              currentContentType={currentContentType}
            />
          </div>
        ) : (
          // Welcome/Empty state
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <Sparkles size={48} style={{ color: '#8b5cf6', marginBottom: '20px' }} />
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#e8e8e8',
              marginBottom: '10px'
            }}>
              Welcome to SignalDesk
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              textAlign: 'center',
              maxWidth: '500px'
            }}>
              Select a feature from the right panel to get started. The Content Generator is fully integrated with the AI Assistant.
            </p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Feature List */}
      <div style={{
        width: '320px',
        backgroundColor: '#1a1a2e',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#e8e8e8',
            margin: '0 0 4px 0'
          }}>
            Features & Tools
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: 0
          }}>
            {activeProject?.name || 'Select a feature to begin'}
          </p>
        </div>

        {/* Feature List */}
        <div style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {features.map(feature => {
            const Icon = feature.icon;
            const isActive = selectedFeature?.id === feature.id;
            
            return (
              <button
                key={feature.id}
                onClick={() => handleFeatureSelect(feature)}
                style={{
                  padding: '14px',
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isActive ? feature.color : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: `${feature.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={18} style={{ color: feature.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#e8e8e8'
                    }}>
                      {feature.name}
                    </span>
                    {feature.status === 'active' && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '4px'
                      }}>
                        READY
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {feature.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CSS for typing indicator */}
      <style>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #8b5cf6;
          animation: typing 1.4s infinite;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default UnifiedPlatform;