import React, { useState, useEffect } from 'react';
import NivLayout from '../components/niv-simple/NivLayout';
import supabaseApiService from '../services/supabaseApiService';

const NivSimple = () => {
  const [messages, setMessages] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [loading, setLoading] = useState(false);

  // Add welcome message when component mounts
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm Niv, your PR strategist. I can help you create media lists, press releases, strategic plans, social content, key messaging, and FAQ documents. What would you like to work on today?"
      }
    ]);
  }, []);

  const handleSendMessage = async (messageText) => {
    setLoading(true);
    
    try {
      // Add user message to chat
      const userMessage = { role: 'user', content: messageText };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Get current session
      const session = await supabaseApiService.getSession();
      
      // Call niv-simple edge function
      const response = await supabaseApiService.callEdgeFunction('niv-simple', {
        message: messageText,
        conversationHistory: messages,
        userId: session?.user?.id || 'anonymous',
        sessionId
      });

      // Add assistant response to chat
      const assistantMessage = { role: 'assistant', content: response.chatMessage };
      setMessages([...updatedMessages, assistantMessage]);

      // If an artifact was created, add it to the artifacts list
      if (response.artifact) {
        console.log('📦 NivSimple: Received artifact from backend:', response.artifact);
        console.log('📦 NivSimple: Artifact content:', response.artifact.content);
        setArtifacts(prev => [response.artifact, ...prev]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error processing your request. Please try again." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleArtifactSelect = (artifact) => {
    setSelectedArtifact(artifact);
  };

  const handleArtifactUpdate = (updatedArtifact) => {
    setArtifacts(prev => 
      prev.map(artifact => 
        artifact.id === updatedArtifact.id ? updatedArtifact : artifact
      )
    );
    setSelectedArtifact(updatedArtifact);
  };

  const handleArtifactDelete = (artifactId) => {
    setArtifacts(prev => prev.filter(artifact => artifact.id !== artifactId));
    if (selectedArtifact?.id === artifactId) {
      setSelectedArtifact(null);
    }
  };

  const handleCloseWorkspace = () => {
    setSelectedArtifact(null);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NivLayout
        messages={messages}
        artifacts={artifacts}
        selectedArtifact={selectedArtifact}
        loading={loading}
        onSendMessage={handleSendMessage}
        onArtifactSelect={handleArtifactSelect}
        onArtifactUpdate={handleArtifactUpdate}
        onArtifactDelete={handleArtifactDelete}
        onCloseWorkspace={handleCloseWorkspace}
      />
    </div>
  );
};

export default NivSimple;