import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { 
  Send, 
  Bot, 
  User, 
  Loader, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Edit3,
  Eye,
  Download
} from 'lucide-react';
import './NivRealtimeChat.css';

const NivRealtimeChat = () => {
  // State management
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Refs
  const messagesEndRef = useRef(null);
  const conversationChannel = useRef(null);
  const artifactChannel = useRef(null);
  
  // Initialize realtime subscriptions
  useEffect(() => {
    // Re-enabled database sync
    setupRealtimeSubscriptions();
    loadSessionData();
    
    console.log('NivRealtimeChat initialized with database sync');
    
    return () => {
      // Cleanup subscriptions
      if (conversationChannel.current) {
        supabase.removeChannel(conversationChannel.current);
      }
      if (artifactChannel.current) {
        supabase.removeChannel(artifactChannel.current);
      }
    };
  }, [sessionId]);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const setupRealtimeSubscriptions = () => {
    // Subscribe to conversations for this session
    conversationChannel.current = supabase
      .channel(`conversations:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'niv_conversations',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages(prev => [...prev, payload.new]);
          
          // Show notification for artifacts
          if (payload.new.artifact_id) {
            showNotification('📎 New artifact created!', 'success');
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        setConnectionStatus('connected');
      })
      .subscribe((status) => {
        console.log('Conversation subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        }
      });
    
    // Subscribe to artifacts for this session
    artifactChannel.current = supabase
      .channel(`artifacts:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'niv_artifacts',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Artifact event:', payload);
          
          if (payload.eventType === 'INSERT') {
            setArtifacts(prev => [...prev, payload.new]);
            showNotification(`✨ Created: ${payload.new.title}`, 'success');
          } else if (payload.eventType === 'UPDATE') {
            setArtifacts(prev => 
              prev.map(a => a.id === payload.new.id ? payload.new : a)
            );
            showNotification(`📝 Updated: ${payload.new.title}`, 'info');
          } else if (payload.eventType === 'DELETE') {
            setArtifacts(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Artifact subscription status:', status);
      });
  };
  
  const loadSessionData = async () => {
    try {
      // Load existing conversations
      const { data: convos, error: convoError } = await supabase
        .from('niv_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (convoError) {
        console.error('Error loading conversations:', convoError);
      } else if (convos) {
        setMessages(convos);
      }
      
      // Load existing artifacts
      const { data: arts, error: artError } = await supabase
        .from('niv_artifacts')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (artError) {
        console.error('Error loading artifacts:', artError);
      } else if (arts) {
        setArtifacts(arts);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };
  
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    
    // Add user message to UI immediately
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      // Build conversation history
      const conversationHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Call edge function using Supabase client
      const { data, error: fnError } = await supabase.functions.invoke('niv-realtime', {
        body: {
          message: userMessage,
          sessionId,
          userId: 'user-123', // In production, get from auth
          conversationHistory
        }
      });
      
      if (fnError) {
        throw fnError;
      }
      
      if (!data) {
        throw new Error('Failed to send message');
      }
      
      // Log response for debugging
      console.log('Edge function response:', data);
      
      // Add assistant response to UI
      if (data.response) {
        const assistantMsg = {
          id: `temp-${Date.now()}-assistant`,
          role: 'assistant',
          content: data.response,
          artifact_id: data.artifactId,
          mcps_used: data.mcpsUsed || [],
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
      
      // Add artifact to UI if created
      if (data.artifact) {
        setArtifacts(prev => [...prev, data.artifact]);
        showNotification(`✨ Created: ${data.artifact.title}`, 'success');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message', 'error');
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${error.message}`,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openInWorkspace = (artifact) => {
    setSelectedArtifact(artifact);
    // In production, this could open a modal or navigate to workspace
    console.log('Opening artifact in workspace:', artifact);
  };
  
  const downloadArtifact = (artifact) => {
    const content = JSON.stringify(artifact.content, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const showNotification = (message, type = 'info') => {
    // Simple notification - in production use a proper toast library
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };
  
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  return (
    <div className="niv-realtime-container">
      {/* Header */}
      <div className="niv-header">
        <div className="niv-header-left">
          <Bot className="h-8 w-8 text-blue-600" />
          <div>
            <h1>Niv - AI PR Strategist</h1>
            <p className="text-sm text-gray-500">
              Session: {sessionId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="niv-header-right">
          {getConnectionIcon()}
          <span className="text-sm">{connectionStatus}</span>
        </div>
      </div>
      
      <div className="niv-main">
        {/* Chat Area */}
        <div className="niv-chat">
          <div className="niv-messages">
            {messages.length === 0 ? (
              <div className="niv-welcome">
                <Bot className="h-16 w-16 text-gray-300 mb-4" />
                <h2>Welcome! I'm Niv, your AI PR Strategist.</h2>
                <p>How can I help you today?</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`niv-message niv-message-${msg.role}`}
                >
                  <div className="niv-message-icon">
                    {msg.role === 'user' ? (
                      <User className="h-5 w-5" />
                    ) : msg.role === 'assistant' ? (
                      <Bot className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="niv-message-content">
                    <p>{msg.content}</p>
                    {msg.artifact_id && (
                      <div className="niv-artifact-badge">
                        <FileText className="h-3 w-3" />
                        <span>Artifact created</span>
                      </div>
                    )}
                    {msg.mcps_used && msg.mcps_used.length > 0 && (
                      <div className="niv-mcp-badges">
                        {msg.mcps_used.map((mcp, i) => (
                          <span key={i} className="niv-mcp-badge">{mcp}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="niv-message niv-message-assistant">
                <div className="niv-message-icon">
                  <Bot className="h-5 w-5 animate-pulse" />
                </div>
                <div className="niv-message-content">
                  <div className="niv-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="niv-input-area">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask Niv anything about PR strategy..."
              disabled={isLoading}
              className="niv-input"
            />
            <button 
              onClick={sendMessage} 
              disabled={isLoading || !message.trim()}
              className="niv-send-button"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Artifacts Panel */}
        <div className="niv-artifacts-panel">
          <div className="niv-artifacts-header">
            <h3>Artifacts ({artifacts.length})</h3>
          </div>
          
          {artifacts.length === 0 ? (
            <div className="niv-artifacts-empty">
              <FileText className="h-12 w-12 text-gray-300 mb-2" />
              <p>No artifacts yet</p>
              <small>Artifacts appear here after consultation</small>
            </div>
          ) : (
            <div className="niv-artifacts-list">
              {artifacts.map(artifact => (
                <div key={artifact.id} className="niv-artifact-card">
                  <div className="niv-artifact-header">
                    <h4>{artifact.title}</h4>
                    <span className="niv-artifact-type">{artifact.type}</span>
                  </div>
                  
                  {artifact.mcp_sources && artifact.mcp_sources.length > 0 && (
                    <div className="niv-artifact-mcps">
                      {artifact.mcp_sources.map((mcp, i) => (
                        <span key={i} className="niv-mcp-mini">{mcp}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="niv-artifact-preview">
                    {typeof artifact.content === 'object' ? (
                      <pre>{JSON.stringify(artifact.content, null, 2).slice(0, 100)}...</pre>
                    ) : (
                      <p>{artifact.content.slice(0, 100)}...</p>
                    )}
                  </div>
                  
                  <div className="niv-artifact-actions">
                    <button 
                      onClick={() => openInWorkspace(artifact)}
                      className="niv-artifact-action"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => setSelectedArtifact(artifact)}
                      className="niv-artifact-action"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button 
                      onClick={() => downloadArtifact(artifact)}
                      className="niv-artifact-action"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Workspace Modal (simplified for demo) */}
      {selectedArtifact && (
        <div className="niv-workspace-modal">
          <div className="niv-workspace-content">
            <div className="niv-workspace-header">
              <h2>{selectedArtifact.title}</h2>
              <button onClick={() => setSelectedArtifact(null)}>✕</button>
            </div>
            <div className="niv-workspace-body">
              <pre>{JSON.stringify(selectedArtifact.content, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NivRealtimeChat;