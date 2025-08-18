import React, { useState, useEffect } from 'react';
import nivDirectService from '../services/nivDirectService';
import '../components/NivRealtimeChat.css';

const NivDirect = () => {
  const [messages, setMessages] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    claude: localStorage.getItem('claude_api_key') || '',
    openai: localStorage.getItem('openai_api_key') || ''
  });

  useEffect(() => {
    // Load conversation history on mount
    loadHistory();
    
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm Niv, your PR strategist. I can help you create media lists, press releases, strategic plans, social content, key messaging, and FAQ documents. What would you like to work on today?"
    }]);

    // Check if API keys are configured
    if (!apiKeys.claude && !apiKeys.openai) {
      setApiKeyModalOpen(true);
    }
  }, []);

  const loadHistory = async () => {
    const history = await nivDirectService.loadConversationHistory();
    if (history.length > 0) {
      setMessages(history);
    }
    
    const savedArtifacts = await nivDirectService.loadArtifacts();
    setArtifacts(savedArtifacts);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setLoading(true);

    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await nivDirectService.processMessage(userMessage, messages);
      
      // Add AI response
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: response.chatMessage 
      }]);

      // Add artifact if created
      if (response.artifact) {
        setArtifacts(prev => [response.artifact, ...prev]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Error: ${error.message}. Please configure your API keys in settings.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKeys = () => {
    localStorage.setItem('claude_api_key', apiKeys.claude);
    localStorage.setItem('openai_api_key', apiKeys.openai);
    nivDirectService.claudeApiKey = apiKeys.claude;
    nivDirectService.openaiApiKey = apiKeys.openai;
    setApiKeyModalOpen(false);
  };

  const renderArtifact = (artifact) => {
    if (!artifact) return null;

    const content = artifact.content;
    
    return (
      <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0 }}>{artifact.title}</h2>
          <small style={{ color: '#64748b' }}>
            Created: {new Date(artifact.created).toLocaleString()}
          </small>
        </div>
        
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
          {typeof content === 'string' ? content : content.formatted || content.raw || JSON.stringify(content, null, 2)}
        </div>

        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${artifact.title.replace(/\s+/g, '_')}.json`;
              a.click();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Export
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(
              typeof content === 'string' ? content : JSON.stringify(content, null, 2)
            )}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      {/* API Key Modal */}
      {apiKeyModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2>Configure API Keys</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Add at least one API key to use Niv. Keys are stored locally in your browser.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Claude API Key (Recommended)
              </label>
              <input
                type="password"
                value={apiKeys.claude}
                onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                placeholder="sk-ant-..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                OpenAI API Key (Fallback)
              </label>
              <input
                type="password"
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                placeholder="sk-..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setApiKeyModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveApiKeys}
                disabled={!apiKeys.claude && !apiKeys.openai}
                style={{
                  padding: '10px 20px',
                  backgroundColor: apiKeys.claude || apiKeys.openai ? '#3b82f6' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: apiKeys.claude || apiKeys.openai ? 'pointer' : 'not-allowed'
                }}
              >
                Save Keys
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Niv - PR Strategist</h1>
          <button
            onClick={() => setApiKeyModalOpen(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Settings
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: msg.role === 'user' ? '#3b82f6' : 'white',
                  color: msg.role === 'user' ? 'white' : '#1e293b',
                  border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0'
              }}>
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask Niv anything about PR strategy..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: loading || !inputValue.trim() ? '#cbd5e1' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Artifacts Panel */}
      <div style={{ width: '400px', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Artifacts</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {artifacts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
              No artifacts yet. Ask Niv to create PR materials.
            </div>
          ) : (
            <div style={{ padding: '10px' }}>
              {artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  onClick={() => setSelectedArtifact(artifact)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: selectedArtifact?.id === artifact.id ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${selectedArtifact?.id === artifact.id ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{artifact.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(artifact.created).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workspace Panel */}
      {selectedArtifact && (
        <div style={{ 
          width: '600px', 
          backgroundColor: 'white', 
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '20px', 
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Workspace</h2>
            <button
              onClick={() => setSelectedArtifact(null)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {renderArtifact(selectedArtifact)}
          </div>
        </div>
      )}
    </div>
  );
};

export default NivDirect;