// RailwayCanvas.js - True Railway-style canvas interface with draggable service cards
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import ContentGeneratorModule from './ContentGeneratorModule';
import API_BASE_URL from '../config/api';
import {
  Bot, Brain, FileText, Users, TrendingUp, AlertTriangle, 
  BarChart3, Archive, Send, ChevronLeft, ChevronRight, X,
  Sparkles, MessageSquare, Shield, Target, Menu, GripVertical,
  Maximize2, Minimize2, Move, GitBranch, Activity, Database,
  Circle, Square
} from 'lucide-react';
import './RailwayCanvas.css';

const RailwayCanvas = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const messagesEndRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Canvas state
  const [services, setServices] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedService, setDraggedService] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // AI Assistant state - PRESERVING ALL FUNCTIONALITY
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // Content Generator state - PRESERVING ALL FUNCTIONALITY
  const [generatedContent, setGeneratedContent] = useState('');
  const [currentContentType, setCurrentContentType] = useState(null);
  
  // Service definitions as cards on canvas
  const serviceDefinitions = [
    {
      id: 'ai-assistant',
      name: 'Adaptive AI Assistant',
      icon: Bot,
      color: '#8b5cf6',
      description: 'Your intelligent co-pilot',
      position: { x: 50, y: 50 },
      type: 'core',
      status: 'active'
    },
    {
      id: 'content-generator',
      name: 'Content Generator',
      icon: FileText,
      color: '#10b981',
      description: 'AI-powered content creation',
      position: { x: 400, y: 50 },
      type: 'feature',
      status: 'active',
      component: ContentGeneratorModule
    },
    {
      id: 'media-intelligence',
      name: 'Media Intelligence',
      icon: Users,
      color: '#3b82f6',
      description: 'Journalist discovery & outreach',
      position: { x: 750, y: 50 },
      type: 'feature',
      status: 'pending',
      path: `/projects/${projectId}/media-list`
    },
    {
      id: 'campaign-intelligence',
      name: 'Campaign Intelligence',
      icon: Brain,
      color: '#f59e0b',
      description: 'Strategic campaign planning',
      position: { x: 400, y: 250 },
      type: 'feature',
      status: 'pending',
      path: `/projects/${projectId}/campaign-intelligence-enhanced`
    },
    {
      id: 'memory-vault',
      name: 'Memory Vault',
      icon: Database,
      color: '#6366f1',
      description: 'Project knowledge base',
      position: { x: 50, y: 250 },
      type: 'storage',
      status: 'active',
      path: `/projects/${projectId}`
    },
    {
      id: 'stakeholder-intelligence',
      name: 'Stakeholder Intelligence',
      icon: TrendingUp,
      color: '#ec4899',
      description: 'Stakeholder monitoring',
      position: { x: 750, y: 250 },
      type: 'feature',
      status: 'pending',
      path: `/projects/${projectId}/stakeholder-intelligence`
    },
    {
      id: 'crisis-command',
      name: 'Crisis Command',
      icon: AlertTriangle,
      color: '#ef4444',
      description: 'Crisis management',
      position: { x: 400, y: 450 },
      type: 'feature',
      status: 'pending',
      path: `/projects/${projectId}/crisis-command`
    }
  ];

  // Initialize services and connections on mount
  useEffect(() => {
    // Load saved positions or use defaults
    const savedPositions = localStorage.getItem('railwayCanvasPositions');
    const positions = savedPositions ? JSON.parse(savedPositions) : {};
    
    const initialServices = serviceDefinitions.map(service => ({
      ...service,
      position: positions[service.id] || service.position
    }));
    
    setServices(initialServices);
    
    // Define connections between services (Railway-style tracks)
    setConnections([
      { from: 'ai-assistant', to: 'content-generator', type: 'bidirectional' },
      { from: 'ai-assistant', to: 'memory-vault', type: 'data' },
      { from: 'memory-vault', to: 'content-generator', type: 'context' },
      { from: 'content-generator', to: 'media-intelligence', type: 'output' },
      { from: 'campaign-intelligence', to: 'content-generator', type: 'strategy' },
      { from: 'memory-vault', to: 'campaign-intelligence', type: 'data' },
      { from: 'stakeholder-intelligence', to: 'crisis-command', type: 'alert' }
    ]);
    
    // Initialize AI Assistant
    setMessages([{
      id: Date.now(),
      type: 'assistant',
      content: 'Welcome to SignalDesk Canvas! Drag services to arrange your workspace. Click on services to activate them. I can control all connected services.',
      timestamp: new Date()
    }]);
  }, []);

  // Save positions when services move
  const savePositions = useCallback(() => {
    const positions = {};
    services.forEach(service => {
      positions[service.id] = service.position;
    });
    localStorage.setItem('railwayCanvasPositions', JSON.stringify(positions));
  }, [services]);

  // Handle drag start
  const handleDragStart = (e, service) => {
    setIsDragging(true);
    setDraggedService(service);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle drag move
  const handleDragMove = useCallback((e) => {
    if (!isDragging || !draggedService) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newPosition = {
      x: e.clientX - canvasRect.left - dragOffset.x,
      y: e.clientY - canvasRect.top - dragOffset.y
    };
    
    setServices(prev => prev.map(service => 
      service.id === draggedService.id
        ? { ...service, position: newPosition }
        : service
    ));
  }, [isDragging, draggedService, dragOffset]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      savePositions();
    }
    setIsDragging(false);
    setDraggedService(null);
  }, [isDragging, savePositions]);

  // Mouse event handlers
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Handle service selection
  const handleServiceClick = (service) => {
    if (isDragging) return;
    
    if (service.status === 'pending' && service.path) {
      navigate(service.path);
      return;
    }
    
    setSelectedService(service);
    
    // Inform AI Assistant about service activation
    const contextMsg = {
      id: Date.now(),
      type: 'system',
      content: `Activated ${service.name}. ${service.description}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, contextMsg]);
  };

  // CRITICAL: Handle messages from Content Generator - EXACT RESTORATION
  const handleContentGeneratorMessage = (msg) => {
    console.log('RailwayCanvas: Received message from ContentGenerator:', msg);
    
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
          mode: selectedService?.id === 'content-generator' ? 'content' : 'general',
          context: {
            folder: selectedService?.id,
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

  // Render connection lines between services
  const renderConnections = () => {
    return connections.map((conn, idx) => {
      const fromService = services.find(s => s.id === conn.from);
      const toService = services.find(s => s.id === conn.to);
      
      if (!fromService || !toService) return null;
      
      const x1 = fromService.position.x + 150; // Card width / 2
      const y1 = fromService.position.y + 60; // Card height / 2
      const x2 = toService.position.x + 150;
      const y2 = toService.position.y + 60;
      
      // Calculate curve control points for Railway-style tracks
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const controlOffset = Math.abs(x2 - x1) * 0.1;
      
      return (
        <g key={`conn-${idx}`} className="connection-line">
          <path
            d={`M ${x1} ${y1} Q ${midX} ${midY - controlOffset} ${x2} ${y2}`}
            stroke="rgba(139, 92, 246, 0.3)"
            strokeWidth="2"
            fill="none"
            strokeDasharray={conn.type === 'bidirectional' ? '0' : '5 5'}
          />
          {conn.type === 'bidirectional' && (
            <>
              <circle cx={x1} cy={y1} r="4" fill="#8b5cf6" />
              <circle cx={x2} cy={y2} r="4" fill="#8b5cf6" />
            </>
          )}
        </g>
      );
    });
  };

  return (
    <div className="railway-canvas-container">
      {/* Canvas Area */}
      <div className="railway-canvas" ref={canvasRef}>
        {/* Connection Lines SVG */}
        <svg className="connections-layer">
          {renderConnections()}
        </svg>
        
        {/* Service Cards */}
        {services.map(service => {
          const Icon = service.icon;
          const isSelected = selectedService?.id === service.id;
          const isAIAssistant = service.id === 'ai-assistant';
          
          return (
            <div
              key={service.id}
              className={`service-card ${service.type} ${isSelected ? 'selected' : ''} ${service.status}`}
              style={{
                left: `${service.position.x}px`,
                top: `${service.position.y}px`,
                borderColor: service.color,
                boxShadow: isSelected ? `0 0 20px ${service.color}40` : undefined
              }}
              onMouseDown={(e) => !isAIAssistant && handleDragStart(e, service)}
              onClick={() => handleServiceClick(service)}
            >
              {/* Service Header */}
              <div className="service-header" style={{ background: `${service.color}15` }}>
                <Icon size={20} style={{ color: service.color }} />
                <span className="service-name">{service.name}</span>
                {service.status === 'active' && (
                  <Circle size={8} fill="#10b981" className="status-indicator" />
                )}
              </div>
              
              {/* Service Content */}
              <div className="service-content">
                <p className="service-description">{service.description}</p>
                
                {/* AI Assistant Interface - IN THE CARD */}
                {isAIAssistant && (
                  <div className="ai-assistant-interface">
                    <div className="messages-mini">
                      {messages.slice(-3).map(msg => (
                        <div key={msg.id} className={`message-mini ${msg.type}`}>
                          {msg.content.substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSubmit} className="ai-input-mini">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask me anything..."
                        disabled={loading}
                      />
                      <button type="submit" disabled={loading}>
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )}
                
                {/* Service Actions */}
                {!isAIAssistant && (
                  <div className="service-actions">
                    <button className="service-action">
                      {service.status === 'active' ? 'Open' : 'Configure'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Expanded Service Modal */}
      {selectedService && selectedService.id === 'content-generator' && (
        <div className="service-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedService.name}</h2>
              <button onClick={() => setSelectedService(null)} className="close-button">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <ContentGeneratorModule
                onAIMessage={handleContentGeneratorMessage}
                generatedContent={generatedContent}
                onContentUpdate={handleContentUpdate}
                currentContentType={currentContentType}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Canvas Controls */}
      <div className="canvas-controls">
        <button className="control-button" title="Reset Layout">
          <RefreshCw size={16} />
        </button>
        <button className="control-button" title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button className="control-button" title="Zoom Out">
          <ZoomOut size={16} />
        </button>
      </div>
    </div>
  );
};

// Add missing imports
const RefreshCw = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
const ZoomIn = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/></svg>;
const ZoomOut = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M8 11h6"/></svg>;

export default RailwayCanvas;