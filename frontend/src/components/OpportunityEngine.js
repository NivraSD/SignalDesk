// Opportunity Engine - AI-powered PR opportunity discovery and tracking
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Target, Award, Calendar, Users, AlertCircle,
  Zap, BarChart3, Search, Filter, ChevronRight, Star,
  MessageSquare, Send, Eye, Clock, Sparkles, Activity,
  Trophy, Megaphone, Globe, Hash, ArrowUp, RefreshCw
} from 'lucide-react';

const OpportunityEngine = ({ onAIMessage, isDragging = false }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Opportunity types with icons and colors
  const opportunityTypes = {
    trending: { icon: TrendingUp, color: '#10b981', label: 'Trending Topic' },
    news_hook: { icon: Globe, color: '#3b82f6', label: 'News Hook' },
    award: { icon: Trophy, color: '#f59e0b', label: 'Award Opportunity' },
    speaking: { icon: Megaphone, color: '#8b5cf6', label: 'Speaking Opportunity' },
    journalist_interest: { icon: MessageSquare, color: '#ec4899', label: 'Journalist Interest' },
    competitor_gap: { icon: Target, color: '#ef4444', label: 'Competitor Gap' },
    editorial_calendar: { icon: Calendar, color: '#14b8a6', label: 'Editorial Calendar' }
  };

  // Mock opportunities (in production, fetch from backend)
  const mockOpportunities = [
    {
      id: 1,
      type: 'trending',
      title: 'AI Regulation Discussion Heating Up',
      description: 'Senate hearings on AI safety creating media opportunities',
      score: 95,
      urgency: 'high',
      relevantJournalists: ['Sarah Chen - TechCrunch', 'Michael Roberts - The Verge'],
      suggestedAction: 'Prepare thought leadership piece on responsible AI',
      deadline: '2 days',
      keywords: ['AI safety', 'regulation', 'ethics']
    },
    {
      id: 2,
      type: 'news_hook',
      title: 'Competitor DataCo Announces Layoffs',
      description: 'Opportunity to highlight your company stability and growth',
      score: 88,
      urgency: 'medium',
      relevantJournalists: ['Lisa Martinez - Forbes'],
      suggestedAction: 'Pitch story about sustainable growth in tough market',
      deadline: '1 week',
      keywords: ['growth', 'stability', 'market leadership']
    },
    {
      id: 3,
      type: 'award',
      title: 'TechCrunch Startup Awards - Nominations Open',
      description: 'Annual awards recognizing innovative startups',
      score: 82,
      urgency: 'medium',
      relevantJournalists: [],
      suggestedAction: 'Submit nomination by deadline',
      deadline: '3 weeks',
      keywords: ['awards', 'recognition', 'innovation']
    },
    {
      id: 4,
      type: 'speaking',
      title: 'AI Summit 2025 - Speaker Applications',
      description: 'Major conference seeking expert speakers on AI applications',
      score: 90,
      urgency: 'high',
      relevantJournalists: ['Industry analysts will attend'],
      suggestedAction: 'Apply with CEO as keynote speaker',
      deadline: '5 days',
      keywords: ['conference', 'thought leadership', 'visibility']
    },
    {
      id: 5,
      type: 'journalist_interest',
      title: 'Emily Johnson Seeking Cybersecurity Sources',
      description: 'Wired journalist working on data privacy feature',
      score: 78,
      urgency: 'high',
      relevantJournalists: ['Emily Johnson - Wired'],
      suggestedAction: 'Reach out with security expertise angle',
      deadline: '3 days',
      keywords: ['cybersecurity', 'privacy', 'feature story']
    }
  ];

  // Load opportunities
  useEffect(() => {
    loadOpportunities();
    
    // Auto-refresh every 5 minutes if enabled
    if (autoRefresh) {
      const interval = setInterval(loadOpportunities, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend first
      const token = localStorage.getItem('token');
      const response = await fetch('https://signaldesk-production.up.railway.app/api/opportunities/discover', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      } else {
        // Fall back to mock data if backend fails
        setOpportunities(mockOpportunities);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      // Fall back to mock data on error
      setOpportunities(mockOpportunities);
      setLoading(false);
    }
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesFilter = activeFilter === 'all' || opp.type === activeFilter;
    const matchesSearch = searchTerm === '' || 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle opportunity action
  const handleOpportunityAction = (opportunity, action) => {
    if (action === 'analyze' && onAIMessage) {
      // Send message to AI Assistant for analysis
      const message = `Analyze this PR opportunity: "${opportunity.title}". ${opportunity.description} 
      
      Urgency: ${opportunity.urgency}
      Score: ${opportunity.score}/100
      Deadline: ${opportunity.deadline}
      Suggested Action: ${opportunity.suggestedAction}`;
      
      onAIMessage(message);
    } else if (action === 'pitch' && onAIMessage) {
      // Send message to AI Assistant for pitch creation
      const message = `Help me create a pitch for this opportunity: "${opportunity.title}".
      
      Context: ${opportunity.description}
      Target Journalists: ${opportunity.relevantJournalists?.join(', ') || 'General media'}
      Keywords: ${opportunity.keywords?.join(', ')}
      Deadline: ${opportunity.deadline}`;
      
      onAIMessage(message);
    } else if (action === 'track') {
      // Track the opportunity
      trackOpportunity(opportunity);
    }
  };

  // Track opportunity function
  const trackOpportunity = async (opportunity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://signaldesk-production.up.railway.app/api/opportunities/${opportunity.id}/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: `Tracking: ${opportunity.title}` })
      });
      
      if (response.ok) {
        alert(`Now tracking: ${opportunity.title}`);
      }
    } catch (error) {
      console.error('Error tracking opportunity:', error);
      alert('Tracking saved locally');
    }
  };

  // Score color based on value
  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#6b7280';
  };

  // Urgency badge
  const UrgencyBadge = ({ urgency }) => {
    const colors = {
      high: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
      medium: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
      low: { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' }
    };
    
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        background: colors[urgency].bg,
        color: colors[urgency].text,
        textTransform: 'uppercase'
      }}>
        {urgency}
      </span>
    );
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: isDragging ? 'rgba(0, 0, 0, 0.9)' : 'transparent',
      color: '#e8e8e8'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={20} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Opportunity Engine
            </h2>
            <span style={{
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {opportunities.length} Active
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                padding: '0.5rem',
                background: autoRefresh ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${autoRefresh ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                color: autoRefresh ? '#10b981' : '#6b7280',
                cursor: 'pointer'
              }}
              title="Auto-refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={loadOpportunities}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#9ca3af',
                cursor: 'pointer'
              }}
            >
              <Activity size={14} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: '#e8e8e8',
                fontSize: '13px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '0.5rem 0.75rem',
                background: activeFilter === 'all' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${activeFilter === 'all' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '6px',
                color: activeFilter === 'all' ? '#a78bfa' : '#6b7280',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            {Object.entries(opportunityTypes).slice(0, 3).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  style={{
                    padding: '0.5rem',
                    background: activeFilter === type ? `${config.color}20` : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${activeFilter === type ? `${config.color}40` : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '6px',
                    color: activeFilter === type ? config.color : '#6b7280',
                    cursor: 'pointer'
                  }}
                  title={config.label}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280'
          }}>
            <Activity size={24} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280'
          }}>
            <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No opportunities found</p>
            <button
              onClick={loadOpportunities}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '6px',
                color: '#a78bfa',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Refresh Opportunities
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredOpportunities.map(opportunity => {
              const TypeIcon = opportunityTypes[opportunity.type].icon;
              const typeConfig = opportunityTypes[opportunity.type];
              
              return (
                <div
                  key={opportunity.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedOpportunity(opportunity)}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  {/* Opportunity Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${typeConfig.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TypeIcon size={16} style={{ color: typeConfig.color }} />
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: typeConfig.color,
                          fontWeight: '500'
                        }}>
                          {typeConfig.label}
                        </span>
                        <UrgencyBadge urgency={opportunity.urgency} />
                        {opportunity.deadline && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '11px',
                            color: '#6b7280'
                          }}>
                            <Clock size={12} />
                            {opportunity.deadline}
                          </span>
                        )}
                      </div>
                      
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: '#e8e8e8'
                      }}>
                        {opportunity.title}
                      </h3>
                      
                      <p style={{
                        fontSize: '13px',
                        color: '#9ca3af',
                        marginBottom: '0.75rem',
                        lineHeight: '1.5'
                      }}>
                        {opportunity.description}
                      </p>
                      
                      {/* Relevant Journalists */}
                      {opportunity.relevantJournalists.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          marginBottom: '0.75rem'
                        }}>
                          {opportunity.relevantJournalists.map((journalist, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(236, 72, 153, 0.1)',
                                border: '1px solid rgba(236, 72, 153, 0.2)',
                                borderRadius: '6px',
                                fontSize: '11px',
                                color: '#ec4899',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Users size={10} />
                              {journalist}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Keywords */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.75rem'
                      }}>
                        {opportunity.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '12px',
                              fontSize: '11px',
                              color: '#6b7280'
                            }}
                          >
                            #{keyword}
                          </span>
                        ))}
                      </div>
                      
                      {/* Suggested Action */}
                      <div style={{
                        padding: '0.5rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#a78bfa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Sparkles size={14} />
                        {opportunity.suggestedAction}
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginLeft: '1rem'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `conic-gradient(${getScoreColor(opportunity.score)} ${opportunity.score * 3.6}deg, rgba(255, 255, 255, 0.05) 0deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <span style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: getScoreColor(opportunity.score)
                          }}>
                            {opportunity.score}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            color: '#6b7280',
                            textTransform: 'uppercase'
                          }}>
                            Score
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpportunityAction(opportunity, 'analyze');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        color: '#60a5fa',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Eye size={14} />
                      Analyze
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpportunityAction(opportunity, 'pitch');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '6px',
                        color: '#10b981',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Send size={14} />
                      Create Pitch
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpportunityAction(opportunity, 'track');
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '6px',
                        color: '#f59e0b',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Star size={14} />
                      Track
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OpportunityEngine;