// RailwayDraggable.js - Railway-style with draggable and resizable components
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import ContentGeneratorModule from './ContentGeneratorModule';
import API_BASE_URL from '../config/api';
import adaptiveAI from '../services/adaptiveAIService';
import {
  Bot, Brain, FileText, Users, TrendingUp, AlertTriangle, 
  BarChart3, Archive, Send, ChevronLeft, ChevronRight, X,
  Sparkles, MessageSquare, Shield, Target, Menu, GripVertical,
  Maximize2, Minimize2, Move, GitBranch, Activity, Database,
  Circle, Square, ArrowLeft, Clock, Zap, Globe, Settings,
  User, Plus, ChevronDown, LogOut, Folder, StickyNote
} from 'lucide-react';
import './RailwayDraggable.css';

const RailwayDraggable = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { activeProject, projects, fetchProjects, selectProject } = useProject();
  const { user, logout } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
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
  const [selectedContentTypeId, setSelectedContentTypeId] = useState(null);
  const [selectedContentTypeName, setSelectedContentTypeName] = useState(null);
  
  // Drag and resize state
  const [draggedElement, setDraggedElement] = useState(null);
  const [resizingElement, setResizingElement] = useState(null);
  const [positions, setPositions] = useState({});
  const [sizes, setSizes] = useState({});
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Profile dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNotepad, setShowNotepad] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [notepadMinimized, setNotepadMinimized] = useState(false);
  
  // Session ID for conversation continuity
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
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

  // Initialize positions and sizes
  useEffect(() => {
    // Load saved positions and sizes or use defaults
    const savedPositions = localStorage.getItem('railwayDragPositions');
    const savedSizes = localStorage.getItem('railwayDragSizes');
    
    setPositions(savedPositions ? JSON.parse(savedPositions) : {
      'ai-assistant': { x: 20, y: 80 },
      'activity-list': { x: 420, y: 80 },
      'feature-view': { x: 420, y: 80 },
      'notepad': { x: 940, y: 80 }
    });
    
    setSizes(savedSizes ? JSON.parse(savedSizes) : {
      'ai-assistant': { width: 400, height: 400 },
      'activity-list': { width: 500, height: 600 },
      'feature-view': { width: 800, height: 600 },
      'notepad': { width: 350, height: 400 }
    });
    
    // Load projects
    fetchProjects();
  }, []);

  // Initialize AI Assistant
  useEffect(() => {
    setMessages([{
      id: Date.now(),
      type: 'assistant',
      content: "Welcome to SignalDesk! I'm your AI assistant. I can help you create content, find journalists, plan campaigns, and more. Just tell me what you need - for example, 'I need to write a press release' or 'Find tech journalists'. You can also click any feature from the list to get started.",
      timestamp: new Date()
    }]);
  }, []);

  // Save positions and sizes
  const saveLayout = useCallback(() => {
    localStorage.setItem('railwayDragPositions', JSON.stringify(positions));
    localStorage.setItem('railwayDragSizes', JSON.stringify(sizes));
  }, [positions, sizes]);

  // Handle drag start
  const handleDragStart = (e, elementId) => {
    e.preventDefault();
    setDraggedElement(elementId);
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle drag move
  const handleDragMove = useCallback((e) => {
    if (!draggedElement) return;
    
    const newPosition = {
      x: Math.max(0, e.clientX - dragOffset.x),
      y: Math.max(60, e.clientY - dragOffset.y) // Keep below header
    };
    
    setPositions(prev => ({
      ...prev,
      [draggedElement]: newPosition
    }));
  }, [draggedElement, dragOffset]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (draggedElement) {
      saveLayout();
    }
    setDraggedElement(null);
  }, [draggedElement, saveLayout]);

  // Handle resize start
  const handleResizeStart = (e, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingElement(elementId);
  };

  // Handle resize move
  const handleResizeMove = useCallback((e) => {
    if (!resizingElement) return;
    
    const element = document.getElementById(resizingElement);
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const newSize = {
      width: Math.max(300, e.clientX - rect.left),
      height: Math.max(300, e.clientY - rect.top)
    };
    
    setSizes(prev => ({
      ...prev,
      [resizingElement]: newSize
    }));
  }, [resizingElement]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    if (resizingElement) {
      saveLayout();
    }
    setResizingElement(null);
  }, [resizingElement, saveLayout]);

  // Mouse event handlers
  useEffect(() => {
    if (draggedElement) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [draggedElement, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (resizingElement) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingElement, handleResizeMove, handleResizeEnd]);

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
      
      // Update AI Assistant context
      adaptiveAI.setActiveFeature(activity.id);
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
      
      // Reset AI to general mode
      adaptiveAI.reset();
    }, 300);
  };

  // Handle project creation
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newProjectName })
      });
      
      if (response.ok) {
        const newProject = await response.json();
        await fetchProjects();
        selectProject(newProject);
        navigate(`/projects/${newProject.id}`);
        setShowNewProjectModal(false);
        setNewProjectName('');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Handle project switch
  const handleSwitchProject = (project) => {
    selectProject(project);
    navigate(`/projects/${project.id}`);
    setShowProjectMenu(false);
  };

  // Notes functionality
  useEffect(() => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem(`notes-${projectId}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, [projectId]);

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note = {
      id: Date.now(),
      text: newNote.trim(),
      timestamp: new Date().toISOString()
    };
    
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    localStorage.setItem(`notes-${projectId}`, JSON.stringify(updatedNotes));
    setNewNote('');
  };

  const deleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem(`notes-${projectId}`, JSON.stringify(updatedNotes));
  };

  // CRITICAL: Handle messages from Content Generator - EXACT RESTORATION
  const handleContentGeneratorMessage = (msg) => {
    console.log('RailwayDraggable: Received message from ContentGenerator:', msg);
    
    if (msg.type === 'edit_request') {
      setIsEditingMode(true);
      handleEditRequest(msg);
    } else if (msg.type === 'content_saved') {
      // Content was saved - reset conversation state and show success message
      adaptiveAI.reset();
      const successMsg = {
        id: `save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'system',
        content: msg.content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);
    } else if (msg.type === 'user' && msg.content) {
      const userMsg = {
        id: `content-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'user',
        content: msg.content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      // Store the content type for future use
      if (msg.contentTypeId) {
        setSelectedContentTypeId(msg.contentTypeId);
        setSelectedContentTypeName(msg.contentTypeName);
      }
      // Pass content type info if available from Content Generator
      sendMessage(msg.content, msg.contentTypeId, msg.contentTypeName);
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
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: `Edit the following content based on this request: "${editPrompt}"\n\nCurrent content:\n${currentContent}`,
          mode: 'content',
          sessionId: sessionId,
          context: {
            folder: 'content-generator',
            editing: true,
            contentType: metadata?.contentType,
            tone: metadata?.tone
          }
        })
      });

      const data = await response.json();
      
      if (data.success && data.response) {
        // Update content directly in the Content Generator feature (not in chat)
        setGeneratedContent(data.response);
        
        // Show confirmation message in chat instead of the edited content
        const confirmMsg = {
          id: Date.now(),
          type: 'system',
          content: '✅ Content updated successfully! You can see the changes in the Content Generator.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmMsg]);
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

  // Enhanced AI message handling with natural conversation
  const sendMessage = async (text, contentTypeId = null, contentTypeName = null) => {
    if (!text?.trim()) return;
    
    // Use stored content type if not provided
    const typeId = contentTypeId || selectedContentTypeId;
    const typeName = contentTypeName || selectedContentTypeName;

    // Process message through adaptive AI service
    const hasContent = !!(generatedContent && generatedContent.trim());
    const aiResponse = adaptiveAI.processMessage(text, hasContent);
    
    // Handle different actions
    if (aiResponse.action === 'activate_feature') {
      // Auto-open feature and show tips
      if (aiResponse.feature === 'content-generator') {
        // Open Content Generator
        const contentGen = activities.find(a => a.id === 'content-generator');
        handleActivityClick(contentGen);
        
        // Show tips first, then follow-up question
        const tipsMsg = {
          id: `tips-${Date.now()}`,
          type: 'assistant',
          content: `${aiResponse.response.message}\n\n${adaptiveAI.formatTipsMessage(aiResponse.response)}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, tipsMsg]);
        
        // Add follow-up question if it exists
        if (aiResponse.response.followUp) {
          setTimeout(() => {
            const followUpMsg = {
              id: `followup-${Date.now()}`,
              type: 'assistant',
              content: aiResponse.response.followUp,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, followUpMsg]);
          }, 1000);
        }
        
        return;
      } else {
        // Handle other feature activation
        const otherFeature = activities.find(a => a.id === aiResponse.feature);
        if (otherFeature) {
          handleActivityClick(otherFeature);
        }
        
        const aiMsg = {
          id: `feature-${Date.now()}`,
          type: 'assistant',
          content: aiResponse.response.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
    }
    
    if (aiResponse.action === 'generate_content') {
      // Generate content in feature
      const generatingMsg = {
        id: `generating-${Date.now()}`,
        type: 'assistant',
        content: aiResponse.response.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, generatingMsg]);
      
      await generateContentInFeature(aiResponse.params);
      return;
    }
    
    if (aiResponse.action === 'chat') {
      // If AI service has a message, show it; otherwise let Claude handle naturally
      if (aiResponse.response.message) {
        const aiMsg = {
          id: `guided-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'assistant',
          content: aiResponse.response.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
      // If no message, fall through to let Claude handle it naturally
    }
    
    // Default: Send to Claude for general conversation
    setLoading(true);
    
    try {
      const isEditing = isEditingMode && generatedContent;
      
      // Detect if user is explicitly requesting content generation
      const generationKeywords = [
        'generate', 'create it', 'write it', 'go ahead', 'make it',
        'create the', 'write the', 'generate the', 'draft it',
        'please create', 'please write', 'please generate'
      ];
      const userRequestedGeneration = generationKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );

      // Detect if user is requesting an edit to existing content - ONLY when content exists
      const editKeywords = [
        'edit this', 'change this', 'update this', 'revise this', 'modify this',
        'edit it', 'change it', 'update it', 'revise it', 'modify it',
        'make it shorter', 'make it longer', 'fix it', 'improve it',
        'shorten this', 'expand this', 'rewrite this'
      ];
      // CRITICAL: Only mark as edit if we HAVE content AND user uses edit keywords
      const userRequestedEdit = hasContent && generatedContent && editKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      ) && !userRequestedGeneration; // Don't treat as edit if it's a generation request
      
      console.log('[FRONTEND] Sending AI request:', {
        message: text,
        mode: selectedFeature?.id === 'content-generator' ? 'content' : 'general',
        folder: selectedFeature?.id,
        contentTypeId: typeId,
        contentTypeName: typeName,
        userRequestedGeneration,
        userRequestedEdit
      });
      
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: text,
          mode: selectedFeature?.id === 'content-generator' ? 'content' : 'general',
          sessionId: sessionId,
          context: {
            folder: selectedFeature?.id,
            editing: isEditing,
            hasGeneratedContent: hasContent,
            contentContext: adaptiveAI.conversationState.contentContext,
            currentContent: generatedContent,
            userRequestedGeneration: userRequestedGeneration,
            userRequestedEdit: userRequestedEdit,
            contentTypeId: typeId,
            contentTypeName: typeName
          }
        })
      });

      const data = await response.json();
      console.log('[FRONTEND] AI Chat Response:', {
        success: data.success,
        hasResponse: !!data.response,
        responseLength: data.response?.length,
        isGeneratedContent: data.isGeneratedContent,
        mode: data.mode,
        responsePreview: data.response?.substring(0, 300)
      });
      
      if (data.success && data.response) {
        // Check if this is generated content that should go to Content Generator
        if (data.isGeneratedContent) {
          console.log('[FRONTEND] Detected generated content, setting in Content Generator');
          // Auto-open Content Generator if not already open
          if (selectedFeature?.id !== 'content-generator') {
            const contentGen = activities.find(a => a.id === 'content-generator');
            handleActivityClick(contentGen);
          }
          
          // Set the generated content directly in the feature
          console.log('[FRONTEND] Setting content in Content Generator:', {
            contentLength: data.response?.length,
            contentPreview: data.response?.substring(0, 200)
          });
          setGeneratedContent(data.response);
          detectContentType(data.response);
          console.log('[FRONTEND] Content set successfully');
          
          // Show success message in chat instead
          const successMsg = {
            id: Date.now(),
            type: 'system',
            content: '✨ Content generated successfully! You can see it in the Content Generator panel.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, successMsg]);
        } else {
          // Regular chat message
          const aiMsg = {
            id: Date.now(),
            type: 'assistant',
            content: data.response,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
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

  // Generate content directly in the Content Generator feature
  const generateContentInFeature = async (params) => {
    // First, ensure Content Generator is open
    if (selectedFeature?.id !== 'content-generator') {
      const contentGen = activities.find(a => a.id === 'content-generator');
      handleActivityClick(contentGen);
      
      // Wait for transition
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(true);
    
    try {
      // Build prompt from guided flow context
      const prompt = `Create a ${params.type} about ${params.topic} for ${params.audience} audience with a ${params.tone} tone. ${params.keyPoints || ''}`;
      
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: prompt,
          mode: 'content',
          sessionId: sessionId,
          context: {
            folder: 'content-generator',
            contentType: params.type,
            contentTypeId: params.type,  // CRITICAL: Backend expects contentTypeId
            contentTypeName: params.type,
            generateDirectly: true,
            userRequestedGeneration: true
          }
        })
      });

      const data = await response.json();
      
      if (data.success && data.response) {
        // Set the generated content directly
        setGeneratedContent(data.response);
        setCurrentContentType(params.type);
        
        // Notify user in chat
        const successMsg = {
          id: Date.now(),
          type: 'system',
          content: '✨ Content generated successfully! You can see it in the Content Generator. Feel free to ask me to make any edits.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMsg]);
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    sendMessage(message);
    setMessage('');
    
    // Keep focus on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
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

  // Auto-resize textarea and maintain focus
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Maintain focus on input after messages
  useEffect(() => {
    if (inputRef.current && !loading) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, loading]);

  return (
    <div className="railway-draggable-container">
      {/* Project Header Bar */}
      <div className="railway-header">
        <div className="header-left">
          <div className="signaldesk-brand">
            <span className="brand-text">SignalDesk</span>
          </div>
          
          <div className="project-selector">
            <button 
              className="project-dropdown-button"
              onClick={() => setShowProjectMenu(!showProjectMenu)}
            >
              <Folder size={16} />
              <span>{activeProject?.name || 'Select Project'}</span>
              <ChevronDown size={16} />
            </button>
            
            {showProjectMenu && (
              <div className="dropdown-menu project-menu">
                <div className="dropdown-header">
                  <span>Projects</span>
                  <button 
                    className="new-project-button"
                    onClick={() => {
                      setShowProjectMenu(false);
                      setShowNewProjectModal(true);
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {projects?.map(project => (
                  <button
                    key={project.id}
                    className={`dropdown-item ${project.id === activeProject?.id ? 'active' : ''}`}
                    onClick={() => handleSwitchProject(project)}
                  >
                    <Folder size={14} />
                    <span>{project.name}</span>
                    {project.id === activeProject?.id && <Circle size={8} fill="currentColor" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <span className="environment-badge">Production</span>
        </div>
        
        <div className="header-right">
          <button 
            className={`header-button ${showNotepad ? 'active' : ''}`}
            onClick={() => setShowNotepad(!showNotepad)}
          >
            <StickyNote size={16} />
            Notes
            {notes.length > 0 && (
              <span className="notes-badge">{notes.length}</span>
            )}
          </button>
          
          <button className="header-button">
            <Settings size={16} />
            Settings
          </button>
          
          <div className="user-profile">
            <button 
              className="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <User size={16} />
              <span>{user?.email || 'User'}</span>
              <ChevronDown size={14} />
            </button>
            
            {showProfileMenu && (
              <div className="dropdown-menu profile-menu">
                <div className="profile-info">
                  <User size={20} />
                  <div>
                    <div className="profile-name">{user?.name || user?.email}</div>
                    <div className="profile-email">{user?.email}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item">
                  <Settings size={14} />
                  Account Settings
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Draggable AI Assistant Panel - SQUARE */}
      <div 
        id="ai-assistant"
        className="draggable-panel ai-assistant-square"
        style={{
          left: `${positions['ai-assistant']?.x || 20}px`,
          top: `${positions['ai-assistant']?.y || 80}px`,
          width: `${sizes['ai-assistant']?.width || 400}px`,
          height: `${sizes['ai-assistant']?.height || 400}px`
        }}
      >
        <div 
          className="panel-header"
          onMouseDown={(e) => handleDragStart(e, 'ai-assistant')}
        >
          <div className="panel-title">
            <Bot size={18} />
            <span>AI Assistant</span>
            {selectedFeature && (
              <span className="ai-mode-badge">{selectedFeature.name}</span>
            )}
          </div>
          <div className="panel-controls">
            <button onClick={() => setAiPanelOpen(!aiPanelOpen)}>
              {aiPanelOpen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
        
        {aiPanelOpen && (
          <div className="panel-content">
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
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={isEditingMode ? "Continue editing..." : "Ask me anything..."}
                disabled={loading}
                className="ai-input"
                rows={1}
                style={{
                  minHeight: '40px',
                  maxHeight: '120px',
                  resize: 'none',
                  overflow: 'hidden'
                }}
              />
              <button type="submit" disabled={loading || !message.trim()} className="ai-send">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
        
        <div 
          className="resize-handle"
          onMouseDown={(e) => handleResizeStart(e, 'ai-assistant')}
        />
      </div>

      {/* Draggable Activity List or Feature View */}
      {currentView === 'activity' ? (
        <div 
          id="activity-list"
          className="draggable-panel activity-list-panel"
          style={{
            left: `${positions['activity-list']?.x || 420}px`,
            top: `${positions['activity-list']?.y || 80}px`,
            width: `${sizes['activity-list']?.width || 500}px`,
            height: `${sizes['activity-list']?.height || 600}px`
          }}
        >
          <div 
            className="panel-header"
            onMouseDown={(e) => handleDragStart(e, 'activity-list')}
          >
            <div className="panel-title">
              <Activity size={18} />
              <span>Activities</span>
            </div>
            <div className="panel-controls">
              <Move size={14} />
            </div>
          </div>
          
          <div className="panel-content">
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
                      <Icon size={20} style={{ color: activity.color }} />
                    </div>
                    
                    <div className="activity-content">
                      <div className="activity-header">
                        <h3>{activity.name}</h3>
                        <span className={`activity-status ${activity.status}`}>
                          {activity.status === 'ready' ? (
                            <><Circle size={6} fill="currentColor" /> Ready</>
                          ) : activity.status === 'building' ? (
                            <><Zap size={10} /> Building</>
                          ) : (
                            <><Clock size={10} /> Pending</>
                          )}
                        </span>
                      </div>
                      <p className="activity-description">{activity.description}</p>
                    </div>
                    
                    <ChevronRight size={18} className="activity-arrow" />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div 
            className="resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'activity-list')}
          />
        </div>
      ) : (
        <div 
          id="feature-view"
          className={`draggable-panel feature-panel ${isTransitioning ? 'transitioning' : ''}`}
          style={{
            left: `${positions['feature-view']?.x || 420}px`,
            top: `${positions['feature-view']?.y || 80}px`,
            width: `${sizes['feature-view']?.width || 800}px`,
            height: `${sizes['feature-view']?.height || 600}px`
          }}
        >
          <div 
            className="panel-header"
            onMouseDown={(e) => handleDragStart(e, 'feature-view')}
          >
            <button onClick={handleBackToActivities} className="back-button">
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="panel-title">
              {selectedFeature && React.createElement(selectedFeature.icon, { 
                size: 18, 
                style: { color: selectedFeature.color } 
              })}
              <span>{selectedFeature?.name}</span>
            </div>
            <div className="panel-controls">
              <Move size={14} />
            </div>
          </div>
          
          <div className="panel-content">
            {selectedFeature?.id === 'content-generator' && (
              <ContentGeneratorModule
                onAIMessage={handleContentGeneratorMessage}
                generatedContent={generatedContent}
                onContentUpdate={handleContentUpdate}
                currentContentType={currentContentType}
              />
            )}
          </div>
          
          <div 
            className="resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'feature-view')}
          />
        </div>
      )}

      {/* Draggable Notepad Panel */}
      {showNotepad && (
        <div 
          id="notepad"
          className="draggable-panel notepad-panel"
          style={{
            left: `${positions['notepad']?.x || 940}px`,
            top: `${positions['notepad']?.y || 80}px`,
            width: `${sizes['notepad']?.width || 350}px`,
            height: `${sizes['notepad']?.height || 400}px`,
            display: notepadMinimized ? 'none' : 'block'
          }}
        >
          <div 
            className="panel-header"
            onMouseDown={(e) => handleDragStart(e, 'notepad')}
          >
            <div className="panel-title">
              <StickyNote size={18} />
              <span>Notes & Reminders</span>
              <span className="notes-count-badge">{notes.length}</span>
            </div>
            <div className="panel-controls">
              <button onClick={() => setNotepadMinimized(!notepadMinimized)}>
                {notepadMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button onClick={() => setShowNotepad(false)}>
                <X size={14} />
              </button>
            </div>
          </div>
          
          <div className="panel-content">
            <div className="notepad-content">
              <div className="notepad-input-section">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      addNote();
                    }
                  }}
                  placeholder="Type a note or reminder... (Ctrl+Enter to save)"
                  className="notepad-textarea"
                  rows={3}
                />
                <button 
                  className="notepad-add-button"
                  onClick={addNote}
                  disabled={!newNote.trim()}
                >
                  <Plus size={14} />
                  Add Note
                </button>
              </div>
              
              <div className="notepad-notes-list">
                {notes.length === 0 ? (
                  <div className="notepad-no-notes">
                    <StickyNote size={24} />
                    <p>No notes yet</p>
                  </div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="notepad-note-item">
                      <div className="notepad-note-content">
                        <p className="notepad-note-text">{note.text}</p>
                        <span className="notepad-note-timestamp">
                          {new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <button 
                        className="notepad-delete-button"
                        onClick={() => deleteNote(note.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div 
            className="resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'notepad')}
          />
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="modal-overlay" onClick={() => setShowNewProjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button onClick={() => setShowNewProjectModal(false)} className="close-button">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="project-name-input"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowNewProjectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="create-button"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RailwayDraggable;