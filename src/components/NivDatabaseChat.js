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
  Download,
  Save
} from 'lucide-react';
import './NivRealtimeChat.css';

const NivDatabaseChat = () => {
  // State management
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [error, setError] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);
  
  // Initialize and load data
  useEffect(() => {
    loadSessionData();
    
    // Poll for updates every 2 seconds when loading
    if (isLoading) {
      pollingInterval.current = setInterval(() => {
        loadSessionData();
      }, 2000);
    }
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [sessionId, isLoading]);
  
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        setError(`Failed to load conversations: ${convoError.message}`);
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
        setError(`Failed to load artifacts: ${artError.message}`);
      } else if (arts) {
        setArtifacts(arts);
      }
    } catch (err) {
      console.error('Error in loadSessionData:', err);
      setError(`Failed to load data: ${err.message}`);
    }
  };
  
  const saveMessageToDatabase = async (role, content, artifactId = null) => {
    try {
      const { data, error } = await supabase
        .from('niv_conversations')
        .insert({
          session_id: sessionId,
          role: role,
          content: content,
          artifact_id: artifactId,
          mcps_used: []
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving message:', error);
        setError(`Failed to save message: ${error.message}`);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Error in saveMessageToDatabase:', err);
      setError(`Failed to save message: ${err.message}`);
      return null;
    }
  };
  
  const createArtifact = async (type, title, content) => {
    try {
      const { data, error } = await supabase
        .from('niv_artifacts')
        .insert({
          session_id: sessionId,
          type: type,
          title: title,
          content: content,
          metadata: {},
          mcp_sources: [],
          status: 'draft'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating artifact:', error);
        setError(`Failed to create artifact: ${error.message}`);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Error in createArtifact:', err);
      setError(`Failed to create artifact: ${err.message}`);
      return null;
    }
  };
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    setError(null);
    
    // Save user message to database
    const savedUserMessage = await saveMessageToDatabase('user', userMessage);
    if (savedUserMessage) {
      setMessages(prev => [...prev, savedUserMessage]);
    }
    
    try {
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('niv-database', {
        body: {
          message: userMessage,
          sessionId: sessionId,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        setError(`Failed to get response: ${error.message}`);
        const errorMessage = await saveMessageToDatabase('assistant', `Sorry, I encountered an error: ${error.message}`);
        if (errorMessage) {
          setMessages(prev => [...prev, errorMessage]);
        }
      } else if (data) {
        // Save assistant response
        const assistantMessage = await saveMessageToDatabase('assistant', data.response || data.message || 'I processed your request.');
        if (assistantMessage) {
          setMessages(prev => [...prev, assistantMessage]);
        }
        
        // Create artifacts if any
        if (data.artifacts && Array.isArray(data.artifacts)) {
          for (const artifact of data.artifacts) {
            const createdArtifact = await createArtifact(
              artifact.type || 'document',
              artifact.title || 'Untitled',
              artifact.content || {}
            );
            if (createdArtifact) {
              setArtifacts(prev => [...prev, createdArtifact]);
              showNotification(`✨ Created: ${createdArtifact.title}`, 'success');
            }
          }
        }
        
        // Check for save button content
        if (data.saveButton || data.shouldSave) {
          const saveArtifact = await createArtifact(
            'document',
            'Strategic Content',
            { text: data.response || data.message }
          );
          if (saveArtifact) {
            setArtifacts(prev => [...prev, saveArtifact]);
            showNotification('💾 Content saved to workspace', 'success');
          }
        }
      }
    } catch (err) {
      console.error('Error calling edge function:', err);
      setError(`Failed to process request: ${err.message}`);
      const errorMessage = await saveMessageToDatabase('assistant', `Sorry, I couldn't process your request: ${err.message}`);
      if (errorMessage) {
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      // Reload data to ensure sync
      await loadSessionData();
    }
  };
  
  const showNotification = (message, type = 'info') => {
    // Simple console notification for now
    console.log(`[${type.toUpperCase()}] ${message}`);
  };
  
  const openArtifactInWorkspace = (artifact) => {
    setSelectedArtifact(artifact);
    // You can implement workspace opening logic here
    console.log('Opening artifact in workspace:', artifact);
  };
  
  const updateArtifact = async (artifactId, updates) => {
    try {
      const { data, error } = await supabase
        .from('niv_artifacts')
        .update(updates)
        .eq('id', artifactId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating artifact:', error);
        setError(`Failed to update artifact: ${error.message}`);
        return null;
      }
      
      // Update local state
      setArtifacts(prev => 
        prev.map(a => a.id === artifactId ? data : a)
      );
      
      showNotification(`📝 Updated: ${data.title}`, 'success');
      return data;
    } catch (err) {
      console.error('Error in updateArtifact:', err);
      setError(`Failed to update artifact: ${err.message}`);
      return null;
    }
  };
  
  return (
    <div className="niv-realtime-container">
      <div className="niv-chat-section">
        <div className="niv-chat-header">
          <Bot className="niv-header-icon" />
          <h2>Niv - Your AI PR Strategist</h2>
          <span className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {connectionStatus}
          </span>
        </div>
        
        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        <div className="niv-messages">
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`niv-message ${msg.role}`}>
              <div className="message-icon">
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                {msg.artifact_id && (
                  <div className="message-artifact-link">
                    <FileText size={14} />
                    <span>Artifact created</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="niv-message assistant">
              <div className="message-icon">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <Loader className="spinner" size={20} />
                <span>Niv is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="niv-input-area">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask Niv about PR strategy, media lists, or content creation..."
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={isLoading || !message.trim()}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
      <div className="niv-artifacts-panel">
        <div className="artifacts-header">
          <h3>Artifacts</h3>
          <span className="artifact-count">{artifacts.length}</span>
        </div>
        
        <div className="artifacts-list">
          {artifacts.length === 0 ? (
            <div className="no-artifacts">
              <FileText size={32} />
              <p>No artifacts yet</p>
              <span>Artifacts will appear here when Niv creates content</span>
            </div>
          ) : (
            artifacts.map(artifact => (
              <div key={artifact.id} className="artifact-card">
                <div className="artifact-header">
                  <FileText size={16} />
                  <span className="artifact-type">{artifact.type}</span>
                </div>
                <h4>{artifact.title}</h4>
                <div className="artifact-meta">
                  <span>{new Date(artifact.created_at).toLocaleTimeString()}</span>
                  <span className="artifact-status">{artifact.status}</span>
                </div>
                <div className="artifact-actions">
                  <button onClick={() => openArtifactInWorkspace(artifact)}>
                    <Eye size={14} /> View
                  </button>
                  <button onClick={() => openArtifactInWorkspace(artifact)}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button>
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {selectedArtifact && (
        <div className="artifact-workspace-modal">
          <div className="workspace-header">
            <h3>{selectedArtifact.title}</h3>
            <button onClick={() => setSelectedArtifact(null)}>×</button>
          </div>
          <div className="workspace-content">
            <pre>{JSON.stringify(selectedArtifact.content, null, 2)}</pre>
          </div>
          <div className="workspace-actions">
            <button onClick={() => updateArtifact(selectedArtifact.id, { status: 'published' })}>
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NivDatabaseChat;