import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Users, TrendingUp, Search, Plus, MoreVertical, Archive, Trash2, Star } from 'lucide-react';
import supabaseApiService from '../../services/supabaseApiService';

// Enhanced Conversation Manager with persistence
const NivConversationManager = ({ onSelectConversation, onNewConversation, currentConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    phase: '',
    status: 'active',
    dateRange: '30d'
  });

  useEffect(() => {
    loadRecentConversations();
  }, [filters]);

  const loadRecentConversations = async () => {
    try {
      setLoading(true);
      const result = await supabaseApiService.getRecentNivConversations(20);
      setConversations(result);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadRecentConversations();
      return;
    }

    try {
      setLoading(true);
      const result = await supabaseApiService.searchNivConversations(searchQuery, filters);
      setConversations(result);
    } catch (error) {
      console.error('Error searching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId, event) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await supabaseApiService.deleteNivConversation(conversationId);
      setConversations(conversations.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleUpdateConversation = async (conversationId, updates) => {
    try {
      await supabaseApiService.updateNivConversation(conversationId, updates);
      await loadRecentConversations();
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'discovery': return <Search size={16} color="#f59e0b" />;
      case 'strategy': return <TrendingUp size={16} color="#3b82f6" />;
      case 'creation': return <Users size={16} color="#10b981" />;
      case 'completed': return <Star size={16} color="#8b5cf6" />;
      default: return <MessageSquare size={16} color="#6b7280" />;
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'discovery': return '#f59e0b';
      case 'strategy': return '#3b82f6';
      case 'creation': return '#10b981';
      case 'completed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      width: '400px',
      height: '100%',
      background: 'rgba(30, 30, 45, 0.4)',
      borderRight: '1px solid rgba(139, 92, 246, 0.2)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(30, 30, 45, 0.6)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#fff'
          }}>
            Niv Conversations
          </h3>
          <button
            onClick={onNewConversation}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}
          >
            <Plus size={16} />
            New
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search conversations..."
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              color: '#e8e8e8',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '8px 12px',
              background: 'rgba(139, 92, 246, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              color: '#e8e8e8',
              cursor: 'pointer'
            }}
          >
            <Search size={16} />
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <select
            value={filters.phase}
            onChange={(e) => setFilters({...filters, phase: e.target.value})}
            style={{
              padding: '4px 8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '4px',
              color: '#e8e8e8',
              fontSize: '12px'
            }}
          >
            <option value="">All Phases</option>
            <option value="discovery">Discovery</option>
            <option value="strategy">Strategy</option>
            <option value="creation">Creation</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            style={{
              padding: '4px 8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '4px',
              color: '#e8e8e8',
              fontSize: '12px'
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Conversations List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px'
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
            marginTop: '40px'
          }}>
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
            marginTop: '40px',
            padding: '0 20px'
          }}>
            {searchQuery ? 'No conversations found' : 'Start a new conversation with Niv'}
          </div>
        ) : (
          conversations.map(conversation => {
            const isSelected = currentConversationId === conversation.id;
            const messageCount = conversation.niv_conversation_messages?.[0]?.count || 0;
            const workItemCount = conversation.niv_work_items?.[0]?.count || 0;
            
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))'
                    : 'rgba(30, 30, 45, 0.4)',
                  border: `1px solid ${isSelected ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.2)'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.transform = 'translateX(-4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(30, 30, 45, 0.4)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {getPhaseIcon(conversation.conversation_phase)}
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#e8e8e8'
                    }}>
                      {conversation.title}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af'
                    }}>
                      {formatTimeAgo(conversation.last_message_at)}
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {conversation.description && (
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {conversation.description}
                  </div>
                )}

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <MessageSquare size={12} />
                      {messageCount} messages
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Users size={12} />
                      {workItemCount} items
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '2px 6px',
                    background: `${getPhaseColor(conversation.conversation_phase)}20`,
                    color: getPhaseColor(conversation.conversation_phase),
                    borderRadius: '4px',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {conversation.conversation_phase}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {conversations.length > 0 && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          background: 'rgba(30, 30, 45, 0.6)',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total conversations</span>
            <span style={{ color: '#e8e8e8', fontWeight: '600' }}>
              {conversations.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NivConversationManager;