// Enhanced Campaign Intelligence - Fixed Layout Version
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { Search, Plus, Clock, TrendingUp, Users, AlertCircle, Command, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './EnhancedCampaignIntelligence.css';

const EnhancedCampaignIntelligenceFixed = () => {
  const { projectId } = useParams();
  const [socket, setSocket] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [aiAssistant, setAiAssistant] = useState({
    mode: 'campaign',
    suggestions: [],
    isThinking: false
  });
  const [memoryVault, setMemoryVault] = useState({
    items: [],
    relationships: [],
    selectedItems: []
  });
  const [collaborators, setCollaborators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const briefSectionRefs = useRef({});

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketInstance = io('https://signaldesk-production.up.railway.app', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Connected to Enhanced WebSocket');
      socketInstance.emit('join:project', projectId);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('leave:project', projectId);
      socketInstance.disconnect();
    };
  }, [projectId]);

  // Load campaign and context
  useEffect(() => {
    loadCampaignWithContext();
    loadMemoryVaultItems();
  }, [projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      }
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette]);

  const loadCampaignWithContext = async () => {
    try {
      const response = await fetch(`/api/campaigns/${projectId}/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCampaign(data.campaign);
    } catch (error) {
      console.error('Error loading campaign:', error);
    }
  };

  const loadMemoryVaultItems = async () => {
    try {
      const response = await fetch(`/api/memoryvault/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMemoryVault(prev => ({
        ...prev,
        items: data.items || [],
        relationships: data.relationships || []
      }));
    } catch (error) {
      console.error('Error loading MemoryVault:', error);
    }
  };

  const generateCampaignBrief = async () => {
    setIsGenerating(true);
    setAiAssistant(prev => ({ ...prev, isThinking: true }));

    try {
      const response = await fetch('/api/campaigns/generate-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          projectId,
          campaignType: campaign?.type || 'product_launch',
          objectives: campaign?.objectives || '',
          context: {
            memoryVaultItems: memoryVault.selectedItems,
            searchQuery
          }
        })
      });

      const data = await response.json();
      setCampaign(data.campaign);
      
      setAiAssistant(prev => ({
        ...prev,
        isThinking: false,
        suggestions: data.aiSuggestions || []
      }));

    } catch (error) {
      console.error('Error generating brief:', error);
    } finally {
      setIsGenerating(false);
      setAiAssistant(prev => ({ ...prev, isThinking: false }));
    }
  };

  const performSemanticSearch = async () => {
    if (!searchQuery) return;

    try {
      const response = await fetch('/api/memoryvault/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: searchQuery,
          projectId,
          filters: {
            type: 'campaign_brief',
            limit: 10
          }
        })
      });

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const addToAIContext = (itemId) => {
    setMemoryVault(prev => ({
      ...prev,
      selectedItems: [...prev.selectedItems, itemId]
    }));
  };

  // MemoryVault Panel Component
  const MemoryVaultPanel = () => (
    <div className="memory-vault-panel" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && performSemanticSearch()}
        />
      </div>

      <div className="vault-items">
        <h4>Knowledge Base</h4>
        {memoryVault.items.slice(0, 10).map(item => (
          <div 
            key={item.id}
            className={`vault-item ${memoryVault.selectedItems.includes(item.id) ? 'selected' : ''}`}
            onClick={() => addToAIContext(item.id)}
          >
            <div className="item-name">{item.name}</div>
            <div className="item-meta">
              {item.type} • {new Date(item.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // AI Assistant Panel Component
  const AIAssistantPanel = () => (
    <div className="ai-assistant-panel" style={{ height: '100%' }}>
      <div className="ai-header">
        <div className="ai-mode">
          <span className="mode-icon">🎯</span>
          <span className="mode-name">Campaign Strategist</span>
        </div>
        {aiAssistant.isThinking && (
          <div className="thinking-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>

      <div className="ai-suggestions">
        {aiAssistant.suggestions.map((suggestion, index) => (
          <div key={index} className="suggestion-card">
            <div className="suggestion-icon">
              {suggestion.priority === 'high' ? <AlertCircle /> : <TrendingUp />}
            </div>
            <div className="suggestion-content">
              <div className="suggestion-message">{suggestion.message}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="context-indicators">
        <div className="context-item">
          <span className="context-label">Context Items:</span>
          <span className="context-value">{memoryVault.selectedItems.length}</span>
        </div>
      </div>
    </div>
  );

  // Main Campaign Brief Component
  const CampaignBriefEditor = () => (
    <div className="campaign-brief-editor" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="brief-header">
        <h2>{campaign?.name || 'New Campaign'}</h2>
        <div className="brief-actions">
          <button 
            className="generate-btn"
            onClick={generateCampaignBrief}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Brief'}
          </button>
        </div>
      </div>

      {campaign?.brief_data && (
        <div className="brief-sections">
          {Object.entries(campaign.brief_data).map(([section, content]) => (
            <div 
              key={section}
              ref={el => briefSectionRefs.current[section] = el}
              className="brief-section"
            >
              <h3>{section.replace(/_/g, ' ').toUpperCase()}</h3>
              <div className="section-content">
                {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!campaign && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Start Your Campaign</h3>
          <p>Click "Generate Brief" to create an AI-powered campaign strategy</p>
        </div>
      )}
    </div>
  );

  // Simple Command Palette
  const SimpleCommandPalette = () => {
    if (!showCommandPalette) return null;

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '10vh',
          zIndex: 1000
        }}
        onClick={() => setShowCommandPalette(false)}
      >
        <div 
          style={{
            width: '600px',
            background: '#1a1a2e',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(124, 58, 237, 0.3)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <Command size={20} style={{ marginRight: '10px', color: '#7c3aed' }} />
            <input
              type="text"
              placeholder="Type a command..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                outline: 'none'
              }}
              autoFocus
            />
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            Press ESC to close • ⌘K to toggle
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 60px)', // Account for existing header
      width: '100%',
      background: '#0d0d1e',
      color: '#e8e8e8',
      position: 'relative'
    }}>
      {/* Left Panel - MemoryVault */}
      <div style={{
        width: showLeftPanel ? '320px' : '40px',
        background: '#1a1a2e',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'width 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button
          onClick={() => setShowLeftPanel(!showLeftPanel)}
          style={{
            position: 'absolute',
            right: '-20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#7c3aed',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          {showLeftPanel ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        
        {showLeftPanel && (
          <>
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(124, 58, 237, 0.1)'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>MemoryVault</h3>
            </div>
            <MemoryVaultPanel />
          </>
        )}
      </div>

      {/* Center - Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0 
      }}>
        <CampaignBriefEditor />
      </div>

      {/* Right Panel - AI Assistant */}
      <div style={{
        width: showRightPanel ? '360px' : '40px',
        background: '#1a1a2e',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'width 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          style={{
            position: 'absolute',
            left: '-20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#7c3aed',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          {showRightPanel ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        
        {showRightPanel && (
          <>
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(124, 58, 237, 0.1)'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>AI Assistant</h3>
            </div>
            <AIAssistantPanel />
          </>
        )}
      </div>

      {/* Command Palette Overlay */}
      <SimpleCommandPalette />

      {/* Floating Command Button */}
      <button
        onClick={() => setShowCommandPalette(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
          zIndex: 100
        }}
        title="Command Palette (⌘K)"
      >
        <Command size={24} />
      </button>
    </div>
  );
};

export default EnhancedCampaignIntelligenceFixed;