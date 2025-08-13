// RailwayPlatform.js - Railway UI with proper 2-panel layout and full drag/resize
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import ContentGeneratorModule from './ContentGeneratorModule';
import API_BASE_URL from '../config/api';
import {
  Bot, Brain, FileText, Users, TrendingUp, AlertTriangle, 
  BarChart3, Archive, Send, ChevronLeft, ChevronRight, X,
  Sparkles, MessageSquare, Shield, Target, Menu, GripVertical,
  Maximize2, Minimize2, Move
} from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import './RailwayPlatform.css';

const RailwayPlatform = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const messagesEndRef = useRef(null);
  
  // Panel states
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isFeatureExpanded, setIsFeatureExpanded] = useState(false);
  
  // AI Assistant state
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // Content Generator state
  const [generatedContent, setGeneratedContent] = useState('');
  const [currentContentType, setCurrentContentType] = useState(null);

  // Layout preferences
  const [layoutMode, setLayoutMode] = useState('default'); // default, focus, compact
  const [aiPanelSize, setAiPanelSize] = useState(30); // percentage

  // Feature definitions - all SignalDesk components
  const features = [
    {
      id: 'content-generator',
      name: 'Content Generator',
      icon: FileText,
      color: '#8b5cf6',
      description: 'AI-powered content creation',
      status: 'active',
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
      content: 'Welcome to SignalDesk Railway UI! Select a feature to get started. You can drag and resize panels to customize your workspace.',
      timestamp: new Date()
    }]);

    // Load saved layout preferences
    const savedLayout = localStorage.getItem('railwayLayoutPrefs');
    if (savedLayout) {
      const prefs = JSON.parse(savedLayout);
      setLayoutMode(prefs.layoutMode || 'default');
      setAiPanelSize(prefs.aiPanelSize || 30);
    }
  }, []);

  // Save layout preferences
  const saveLayoutPreferences = (size) => {
    const prefs = {
      layoutMode,
      aiPanelSize: size
    };
    localStorage.setItem('railwayLayoutPrefs', JSON.stringify(prefs));
  };

  // Handle feature selection
  const handleFeatureSelect = (feature) => {
    if (feature.status === 'pending' && feature.path) {
      navigate(feature.path);
      return;
    }

    // Expand feature panel and set selected feature
    setSelectedFeature(feature);
    setIsFeatureExpanded(true);
    
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

  // Layout presets
  const applyLayoutPreset = (preset) => {
    setLayoutMode(preset);
    switch(preset) {
      case 'focus':
        setAiPanelSize(20);
        break;
      case 'compact':
        setAiPanelSize(25);
        break;
      case 'balanced':
        setAiPanelSize(35);
        break;
      default:
        setAiPanelSize(30);
    }
  };

  return (
    <div className="railway-platform">
      {/* Layout Controls */}
      <div className="layout-controls">
        <div className="preset-buttons">
          <button 
            onClick={() => applyLayoutPreset('default')}
            className={layoutMode === 'default' ? 'active' : ''}
            title="Default Layout"
          >
            <Maximize2 size={16} />
          </button>
          <button 
            onClick={() => applyLayoutPreset('focus')}
            className={layoutMode === 'focus' ? 'active' : ''}
            title="Focus Mode"
          >
            <Target size={16} />
          </button>
          <button 
            onClick={() => applyLayoutPreset('compact')}
            className={layoutMode === 'compact' ? 'active' : ''}
            title="Compact Mode"
          >
            <Minimize2 size={16} />
          </button>
          <button 
            onClick={() => applyLayoutPreset('balanced')}
            className={layoutMode === 'balanced' ? 'active' : ''}
            title="Balanced Mode"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* Main Layout with Resizable Panels */}
      <PanelGroup 
        direction="horizontal" 
        className="railway-panel-group"
        onLayout={(sizes) => {
          if (sizes[0]) {
            setAiPanelSize(sizes[0]);
            saveLayoutPreferences(sizes[0]);
          }
        }}
      >
        {/* AI Assistant Panel */}
        <Panel 
          defaultSize={aiPanelSize}
          minSize={15}
          maxSize={50}
          className="ai-assistant-panel"
        >
          <div className="railway-terminal">
            {/* Terminal Header */}
            <div className="terminal-header">
              <div className="terminal-title">
                <Bot size={20} />
                <span>Adaptive AI Assistant</span>
                <span className="mode-badge">
                  {selectedFeature ? `${selectedFeature.name} Mode` : 'General Mode'}
                </span>
              </div>
              <div className="terminal-controls">
                <span className="control-dot close"></span>
                <span className="control-dot minimize"></span>
                <span className="control-dot maximize"></span>
              </div>
            </div>

            {/* Messages */}
            <div className="terminal-messages">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.type}`}
                >
                  <div className="message-content">
                    {msg.type === 'assistant' && <Bot size={16} className="message-icon" />}
                    <div className="message-text">{msg.content}</div>
                  </div>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span className="typing-text">AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="terminal-input-form">
              <div className="input-wrapper">
                <span className="prompt-symbol">❯</span>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isEditingMode ? "Continue editing..." : "Ask me anything..."}
                  disabled={loading}
                  className="terminal-input"
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="send-button"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="railway-resize-handle">
          <div className="resize-handle-inner">
            <GripVertical size={16} />
          </div>
        </PanelResizeHandle>

        {/* Feature Panel / Workspace */}
        <Panel className="feature-workspace-panel">
          {isFeatureExpanded && selectedFeature ? (
            // Expanded Feature View
            <div className="feature-expanded">
              <div className="feature-expanded-header">
                <button
                  onClick={() => {
                    setIsFeatureExpanded(false);
                    setSelectedFeature(null);
                    setIsEditingMode(false);
                    setGeneratedContent('');
                  }}
                  className="back-button"
                >
                  <ChevronLeft size={20} />
                  <span>Back to Features</span>
                </button>
                <div className="feature-title">
                  {React.createElement(selectedFeature.icon, { size: 20, color: selectedFeature.color })}
                  <span>{selectedFeature.name}</span>
                </div>
              </div>
              
              <div className="feature-expanded-content">
                {selectedFeature.id === 'content-generator' && (
                  <ContentGeneratorModule
                    onAIMessage={handleContentGeneratorMessage}
                    generatedContent={generatedContent}
                    onContentUpdate={handleContentUpdate}
                    currentContentType={currentContentType}
                  />
                )}
              </div>
            </div>
          ) : (
            // Feature List View
            <div className="feature-list-container">
              <div className="feature-list-header">
                <h3>Features & Tools</h3>
                <p>{activeProject?.name || 'Select a feature to begin'}</p>
              </div>
              
              <div className="feature-list">
                {features.map(feature => {
                  const Icon = feature.icon;
                  
                  return (
                    <button
                      key={feature.id}
                      onClick={() => handleFeatureSelect(feature)}
                      className="feature-item"
                    >
                      <div 
                        className="feature-icon"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <Icon size={20} style={{ color: feature.color }} />
                      </div>
                      <div className="feature-details">
                        <div className="feature-name">
                          {feature.name}
                          {feature.status === 'active' && (
                            <span className="status-badge">READY</span>
                          )}
                        </div>
                        <p className="feature-description">{feature.description}</p>
                      </div>
                      <ChevronRight size={16} className="feature-arrow" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default RailwayPlatform;
