// RailwayActivity.js - Railway-style activity/feature list that expands to replace itself
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import ContentGeneratorModule from './ContentGeneratorModule';
import API_BASE_URL from '../config/api';
import {
  Bot, Brain, FileText, Users, TrendingUp, AlertTriangle, 
  BarChart3, Archive, Send, ChevronLeft, ChevronRight, X,
  Sparkles, MessageSquare, Shield, Target, Menu, GripVertical,
  Maximize2, Minimize2, Move, GitBranch, Activity, Database,
  Circle, Square, ArrowLeft, Clock, Zap, Globe, Settings
} from 'lucide-react';
import './RailwayActivity.css';

const RailwayActivity = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const messagesEndRef = useRef(null);
  
  // View state - either showing activity list or expanded feature
  const [currentView, setCurrentView] = useState('activity'); // 'activity' or 'feature'
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // AI Assistant state - PRESERVING ALL FUNCTIONALITY
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  
  // Content Generator state - PRESERVING ALL FUNCTIONALITY
  const [generatedContent, setGeneratedContent] = useState('');
  const [currentContentType, setCurrentContentType] = useState(null);
  
  // Feature/Activity definitions
  const activities = [
    {
      id: 'content-generator',
      name: 'Content Generator',
      icon: FileText,
      color: '#8b5cf6',
      description: 'AI-powered content creation',
      status: 'ready',
      stats: '12 pieces created today',
      component: ContentGeneratorModule,
      lastUsed: '2 minutes ago'
    },
    {
      id: 'media-intelligence',
      name: 'Media Intelligence',
      icon: Users,
      color: '#10b981',
      description: 'Journalist discovery & outreach',
      status: 'ready',
      stats: '234 journalists tracked',
      path: `/projects/${projectId}/media-list`,
      lastUsed: '1 hour ago'
    },
    {
      id: 'campaign-intelligence',
      name: 'Campaign Intelligence',
      icon: Brain,
      color: '#f59e0b',
      description: 'Strategic campaign planning',
      status: 'ready',
      stats: '3 active campaigns',
      path: `/projects/${projectId}/campaign-intelligence-enhanced`,
      lastUsed: '3 hours ago'
    },
    {
      id: 'memory-vault',
      name: 'Memory Vault',
      icon: Database,
      color: '#6366f1',
      description: 'Project knowledge base',
      status: 'ready',
      stats: '1,234 items stored',
      path: `/projects/${projectId}`,
      lastUsed: '5 minutes ago'
    },
    {
      id: 'stakeholder-intelligence',
      name: 'Stakeholder Intelligence',
      icon: TrendingUp,
      color: '#ec4899',
      description: 'Stakeholder monitoring',
      status: 'building',
      stats: '56 stakeholders monitored',
      path: `/projects/${projectId}/stakeholder-intelligence`,
      lastUsed: '1 day ago'
    },
    {
      id: 'crisis-command',
      name: 'Crisis Command',
      icon: AlertTriangle,
      color: '#ef4444',
      description: 'Crisis management center',
      status: 'ready',
      stats: 'No active crises',
      path: `/projects/${projectId}/crisis-command`,
      lastUsed: '2 days ago'
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      icon: BarChart3,
      color: '#14b8a6',
      description: 'Performance metrics & insights',
      status: 'ready',
      stats: '5 reports generated',
      path: `/projects/${projectId}/reports`,
      lastUsed: '6 hours ago'
    }
  ];

  // Initialize AI Assistant
  useEffect(() => {
    setMessages([{
      id: Date.now(),
      type: 'assistant',
      content: 'Welcome to SignalDesk! Select an activity from the list to get started. I\'m here to help with any feature you choose.',
      timestamp: new Date()
    }]);
  }, []);

  // Handle activity/feature selection
  const handleActivityClick = (activity) => {
    if (activity.path && !activity.component) {
      // External route - navigate away
      navigate(activity.path);
      return;
    }
    
    // Expand the feature in place
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedFeature(activity);
      setCurrentView('feature');
      setIsTransitioning(false);
      
      // Inform AI Assistant
      const contextMsg = {
        id: Date.now(),
        type: 'system',
        content: `Activated ${activity.name}. ${activity.description}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, contextMsg]);
    }, 300);
  };

  // Handle back to activity list
  const handleBackToActivities = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('activity');
      setSelectedFeature(null);
      setIsEditingMode(false);
      setGeneratedContent('');
      setIsTransitioning(false);
    }, 300);
  };

  // CRITICAL: Handle messages from Content Generator - EXACT RESTORATION
  const handleContentGeneratorMessage = (msg) => {
    console.log('RailwayActivity: Received message from ContentGenerator:', msg);
    
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

  // CRITICAL: Handle edit requests - EXACT RESTORATION
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
      const errorMsg = {
        id: Date.now(),
        type: 'error',
        content: 'Failed to process edit request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // CRITICAL: Send message to AI - EXACT RESTORATION
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
      const errorMsg = {
        id: Date.now(),
        type: 'error',
        content: 'Failed to send message. Please check your connection.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
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
    <div className="railway-activity-container">
      {/* Project Header Bar */}
      <div className="railway-header">
        <div className="header-left">
          <div className="project-info">
            <h1>{activeProject?.name || 'SignalDesk'}</h1>
            <span className="environment-badge">Production</span>
          </div>
        </div>
        <div className="header-right">
          <button className="header-button">
            <Settings size={16} />
            Settings
          </button>
          <button className="header-button">
            <Globe size={16} />
            Deploy
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="railway-main">
        {/* Left Panel - AI Assistant */}
        <div className={`ai-assistant-panel ${aiPanelOpen ? 'open' : 'collapsed'}`}>
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <Bot size={18} />
              <span>AI Assistant</span>
              {selectedFeature && (
                <span className="ai-mode-badge">{selectedFeature.name} Mode</span>
              )}
            </div>
            <button 
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="ai-toggle-button"
            >
              {aiPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
          
          {aiPanelOpen && (
            <>
              <div className="ai-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`ai-message ${msg.type}`}>
                    {msg.type === 'assistant' && <Bot size={14} className="message-icon" />}
                    <div className="message-content">
                      <div className="message-text">{msg.content}</div>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="ai-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={handleSubmit} className="ai-input-form">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isEditingMode ? "Continue editing..." : "Ask me anything..."}
                  disabled={loading}
                  className="ai-input"
                />
                <button type="submit" disabled={loading || !message.trim()} className="ai-send">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Center Panel - Activity List or Expanded Feature */}
        <div className={`center-panel ${isTransitioning ? 'transitioning' : ''}`}>
          {currentView === 'activity' ? (
            // Activity List View
            <div className="activity-list-container">
              <div className="activity-list-header">
                <h2>Activities</h2>
                <p>Select a feature to begin</p>
              </div>
              
              <div className="activity-list">
                {activities.map(activity => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className={`activity-item ${activity.status}`}
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className="activity-icon" style={{ backgroundColor: `${activity.color}15` }}>
                        <Icon size={24} style={{ color: activity.color }} />
                      </div>
                      
                      <div className="activity-content">
                        <div className="activity-header">
                          <h3>{activity.name}</h3>
                          <span className={`activity-status ${activity.status}`}>
                            {activity.status === 'ready' ? (
                              <><Circle size={8} fill="currentColor" /> Ready</>
                            ) : activity.status === 'building' ? (
                              <><Zap size={12} /> Building</>
                            ) : (
                              <><Clock size={12} /> Pending</>
                            )}
                          </span>
                        </div>
                        <p className="activity-description">{activity.description}</p>
                        <div className="activity-footer">
                          <span className="activity-stat">{activity.stats}</span>
                          <span className="activity-time">{activity.lastUsed}</span>
                        </div>
                      </div>
                      
                      <ChevronRight size={20} className="activity-arrow" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Expanded Feature View
            <div className="feature-expanded-view">
              <div className="feature-header">
                <button onClick={handleBackToActivities} className="back-button">
                  <ArrowLeft size={20} />
                  <span>Back to Activities</span>
                </button>
                <div className="feature-title">
                  {selectedFeature && React.createElement(selectedFeature.icon, { 
                    size: 20, 
                    style: { color: selectedFeature.color } 
                  })}
                  <h2>{selectedFeature?.name}</h2>
                </div>
              </div>
              
              <div className="feature-content">
                {selectedFeature?.id === 'content-generator' && (
                  <ContentGeneratorModule
                    onAIMessage={handleContentGeneratorMessage}
                    generatedContent={generatedContent}
                    onContentUpdate={handleContentUpdate}
                    currentContentType={currentContentType}
                  />
                )}
                {/* Add other feature components here as needed */}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Quick Stats/Info */}
        <div className="right-info-panel">
          <div className="info-section">
            <h3>Project Stats</h3>
            <div className="stat-item">
              <span className="stat-label">Total Activities</span>
              <span className="stat-value">{activities.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Features</span>
              <span className="stat-value">{activities.filter(a => a.status === 'ready').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Last Deploy</span>
              <span className="stat-value">2 hours ago</span>
            </div>
          </div>
          
          <div className="info-section">
            <h3>Recent Activity</h3>
            <div className="recent-list">
              <div className="recent-item">
                <Activity size={14} />
                <span>Content generated</span>
                <span className="recent-time">2m</span>
              </div>
              <div className="recent-item">
                <Users size={14} />
                <span>Media list updated</span>
                <span className="recent-time">1h</span>
              </div>
              <div className="recent-item">
                <Database size={14} />
                <span>Memory saved</span>
                <span className="recent-time">3h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RailwayActivity;