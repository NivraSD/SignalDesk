// Enhanced Campaign Intelligence - Integration with New Infrastructure
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import RailwayLayout from './RailwayUI/RailwayLayout';
import { Search, Plus, Clock, TrendingUp, Users, AlertCircle } from 'lucide-react';
import './EnhancedCampaignIntelligence.css';

const EnhancedCampaignIntelligence = () => {
  const { projectId } = useParams();
  const [socket, setSocket] = useState(null);
  const [campaign, setCampaign] = useState(null);
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
    // Use Supabase Realtime for real-time collaboration
    // const socketInstance = io(`${process.env.REACT_APP_SUPABASE_URL}/realtime`, {
    //   auth: { token },
    //   transports: ['websocket', 'polling']
    // });
    
    // Temporarily disable socket connection - using Supabase Realtime instead
    const socketInstance = null;

    // TODO: Replace with Supabase Realtime subscriptions
    if (socketInstance) {
      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket');
        // Join project room
        socketInstance.emit('join:project', projectId);
      });

      // Real-time campaign updates
      socketInstance.on('campaign:section:updated', (data) => {
        handleRealtimeUpdate(data);
      });

      // Real-time collaborator cursors
      socketInstance.on('collaboration:cursor:update', (data) => {
        updateCollaboratorCursor(data);
      });

      // AI Assistant updates
      socketInstance.on('ai:suggestion', (data) => {
        setAiAssistant(prev => ({
          ...prev,
          suggestions: [...prev.suggestions, data.suggestion]
        }));
      });
    }

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.emit('leave:project', projectId);
        socketInstance.disconnect();
      }
    };
  }, [projectId]);

  // Load campaign and context
  useEffect(() => {
    loadCampaignWithContext();
    loadMemoryVaultItems();
  }, [projectId]);

  const loadCampaignWithContext = async () => {
    try {
      const response = await fetch(`/api/campaigns/${projectId}/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCampaign(data.campaign);
      
      // Load AI context
      if (data.campaign) {
        loadAIContext(data.campaign.id);
      }
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
        items: data.items,
        relationships: data.relationships
      }));
    } catch (error) {
      console.error('Error loading MemoryVault:', error);
    }
  };

  const loadAIContext = async (campaignId) => {
    try {
      const response = await fetch('/api/memoryvault/ai-context/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemIds: memoryVault.selectedItems,
          projectId,
          feature: 'campaign_intelligence'
        })
      });
      const data = await response.json();
      
      setAiAssistant(prev => ({
        ...prev,
        mode: data.aiMode,
        contextLoaded: true
      }));
    } catch (error) {
      console.error('Error loading AI context:', error);
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
      
      // Show AI suggestions
      setAiAssistant(prev => ({
        ...prev,
        isThinking: false,
        suggestions: data.aiSuggestions || []
      }));

      // Animate the new brief sections
      animateBriefSections();

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
      setSearchResults(data.results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleRealtimeUpdate = (data) => {
    if (data.campaignId === campaign?.id) {
      setCampaign(prev => ({
        ...prev,
        brief_data: {
          ...prev.brief_data,
          [data.section]: data.updates
        }
      }));

      // Highlight updated section
      highlightSection(data.section);
    }
  };

  const updateCollaboratorCursor = (data) => {
    setCollaborators(prev => {
      const existing = prev.find(c => c.userId === data.userId);
      if (existing) {
        return prev.map(c => 
          c.userId === data.userId 
            ? { ...c, cursor: data.position }
            : c
        );
      }
      return [...prev, { userId: data.userId, cursor: data.position }];
    });
  };

  const handleSectionEdit = (section, content) => {
    if (socket) {
      socket.emit('campaign:task:update', {
        campaignId: campaign.id,
        section,
        updates: { [section]: content }
      });
    }
  };

  const addToAIContext = (itemId) => {
    setMemoryVault(prev => ({
      ...prev,
      selectedItems: [...prev.selectedItems, itemId]
    }));
    
    // Reload AI context
    loadAIContext(campaign?.id);
  };

  const highlightSection = (section) => {
    const element = briefSectionRefs.current[section];
    if (element) {
      element.classList.add('highlight-update');
      setTimeout(() => {
        element.classList.remove('highlight-update');
      }, 2000);
    }
  };

  const animateBriefSections = () => {
    Object.values(briefSectionRefs.current).forEach((element, index) => {
      if (element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        setTimeout(() => {
          element.style.transition = 'all 0.5s ease';
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }, index * 100);
      }
    });
  };

  // MemoryVault Panel Component
  const MemoryVaultPanel = () => (
    <div className="memory-vault-panel">
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
        {searchResults.length > 0 ? (
          <div className="search-results">
            <h4>Search Results</h4>
            {searchResults.map(result => (
              <div 
                key={result.id} 
                className="vault-item"
                onClick={() => addToAIContext(result.id)}
              >
                <span className="similarity">{(result.similarity * 100).toFixed(0)}%</span>
                <div className="item-content">
                  <div className="item-name">{result.name}</div>
                  <div className="item-type">{result.type}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="vault-folders">
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
        )}
      </div>

      <div className="vault-relationships">
        <h4>Related Documents</h4>
        {memoryVault.relationships.slice(0, 5).map(rel => (
          <div key={rel.id} className="relationship">
            <span className="rel-type">{rel.relationship_type}</span>
            <span className="rel-strength">{(rel.strength * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  // AI Assistant Panel Component
  const AIAssistantPanel = () => (
    <div className="ai-assistant-panel">
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
              {suggestion.action && (
                <button 
                  className="suggestion-action"
                  onClick={() => console.log('Execute:', suggestion.action)}
                >
                  {suggestion.action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="ai-input-area">
        <textarea
          placeholder="Ask me anything about your campaign..."
          className="ai-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              // Send message to AI
            }
          }}
        />
        <button className="ai-send">Send</button>
      </div>

      <div className="context-indicators">
        <div className="context-item">
          <span className="context-label">Context Items:</span>
          <span className="context-value">{memoryVault.selectedItems.length}</span>
        </div>
        <div className="context-item">
          <span className="context-label">Similar Campaigns:</span>
          <span className="context-value">{searchResults.length}</span>
        </div>
      </div>
    </div>
  );

  // Main Campaign Brief Component
  const CampaignBriefEditor = () => (
    <div className="campaign-brief-editor">
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
          <button className="optimize-btn">
            Optimize Campaign
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
              <div 
                className="section-content"
                contentEditable
                onBlur={(e) => handleSectionEdit(section, e.target.innerText)}
                suppressContentEditableWarning
              >
                {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
              </div>
              
              {/* Show collaborator cursors */}
              {collaborators
                .filter(c => c.cursor?.section === section)
                .map(c => (
                  <div 
                    key={c.userId}
                    className="collaborator-cursor"
                    style={{
                      left: c.cursor.x,
                      top: c.cursor.y
                    }}
                  >
                    <span className="cursor-name">User {c.userId}</span>
                  </div>
                ))}
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

  return (
    <RailwayLayout
      memoryVault={<MemoryVaultPanel />}
      aiAssistant={<AIAssistantPanel />}
      defaultLayout="command"
    >
      <CampaignBriefEditor />
    </RailwayLayout>
  );
};

export default EnhancedCampaignIntelligence;