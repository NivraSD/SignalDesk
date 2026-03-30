import React, { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, Target, AlertCircle, CheckCircle,
  Eye, Brain, Zap, BarChart3, Clock, RefreshCw,
  ChevronRight, Shield, Users, Building2, Settings,
  Heart, AlertTriangle, TrendingDown, ArrowUp, ArrowDown, ArrowRight,
  DollarSign, UserCheck, Package, Handshake, MessageSquare, Lightbulb
} from 'lucide-react';
import apiService from '../../services/apiService';
import { useIntelligence } from '../../context/IntelligenceContext';
import TopicMomentumCard from './TopicMomentumCard';

const UnifiedIntelligenceDashboard = ({ organizationId }) => {
  const { 
    intelligenceData, 
    updateIntelligenceData, 
    isDataStale,
    refreshData
  } = useIntelligence();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'topics'
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicMomentumData, setTopicMomentumData] = useState(null);

  // Use cached data if available
  const intelligence = intelligenceData.unified?.intelligence || [];
  const matrix = intelligenceData.unified?.matrix || null;

  useEffect(() => {
    if (organizationId && (!intelligenceData.unified || isDataStale(intelligenceData.lastFetch))) {
      loadUnifiedIntelligence();
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId && viewMode === 'topics' && !topicMomentumData) {
      loadTopicMomentum();
    }
  }, [organizationId, viewMode]);

  const loadUnifiedIntelligence = async () => {
    setLoading(true);
    try {
      const data = await apiService.getUnifiedIntelligence(organizationId);
      updateIntelligenceData({
        unified: {
          intelligence: data.intelligence || [],
          matrix: data.matrix || null
        }
      });
    } catch (error) {
      console.error('Error loading unified intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopicMomentum = async () => {
    try {
      console.log('Loading topic momentum for organization:', organizationId);
      // Force fresh load by adding timestamp to prevent caching
      const timestamp = Date.now();
      const data = await apiService.getTopicMomentum(organizationId);
      console.log('Topic momentum data received:', data);
      console.log('API Version:', data.version || 'v1-old');
      console.log('First topic details:', data.topics?.[0]);
      console.log('First topic NVS:', data.topics?.[0]?.opportunityScore);
      console.log('First topic thought leadership:', data.topics?.[0]?.thoughtLeadershipIdeas);
      console.log('First topic keyDrivers:', data.topics?.[0]?.keyDrivers);
      setTopicMomentumData(data);
    } catch (error) {
      console.error('Error loading topic momentum:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Clear only intelligence cached data (not auth token)
    refreshData('intelligence'); // Clear context cache
    setTopicMomentumData(null); // Clear topic data
    
    // Force fresh load
    if (viewMode === 'topics') {
      await loadTopicMomentum();
    } else {
      await loadUnifiedIntelligence();
    }
    setRefreshing(false);
  };

  const getHealthColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    if (score >= 25) return '#ef4444';
    return '#6b7280';
  };

  const getStrengthColor = (strength) => {
    switch (strength?.toLowerCase()) {
      case 'strong': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'weak': return '#ef4444';
      default: return '#e5e7eb';
    }
  };

  const getStrengthIcon = (strength) => {
    switch (strength?.toLowerCase()) {
      case 'strong': return '💪';
      case 'moderate': return '⚖️';
      case 'weak': return '⚠️';
      default: return '—';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case '↑': return <ArrowUp size={16} style={{ color: '#10b981' }} />;
      case '↓': return <ArrowDown size={16} style={{ color: '#ef4444' }} />;
      default: return <ArrowRight size={16} style={{ color: '#6b7280' }} />;
    }
  };

  const getHealthSignalIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'financial': return <DollarSign size={14} />;
      case 'leadership': return <UserCheck size={14} />;
      case 'product': return <Package size={14} />;
      case 'partnerships': return <Handshake size={14} />;
      default: return <MessageSquare size={14} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading unified intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#f9fafb', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1.5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ 
                fontSize: '1.75rem', 
                fontWeight: '700', 
                color: '#111827', 
                margin: '0 0 0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Brain size={28} style={{ color: '#6366f1' }} />
                Strategic Intelligence
              </h2>
              <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                Competitor health monitoring and topic positioning analysis
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Last Updated */}
              {intelligenceData.lastFetch && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Clock size={14} />
                  Updated {new Date(intelligenceData.lastFetch).toLocaleTimeString()}
                </div>
              )}
              
              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                background: '#f3f4f6',
                borderRadius: '0.5rem',
                padding: '0.25rem'
              }}>
                <button
                  onClick={() => setViewMode('cards')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: viewMode === 'cards' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: viewMode === 'cards' ? '600' : '400',
                    color: viewMode === 'cards' ? '#111827' : '#6b7280'
                  }}
                >
                  Health Cards
                </button>
                <button
                  onClick={() => setViewMode('topics')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: viewMode === 'topics' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: viewMode === 'topics' ? '600' : '400',
                    color: viewMode === 'topics' ? '#111827' : '#6b7280'
                  }}
                >
                  Topic Momentum
                </button>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  position: 'relative'
                }}
              >
                <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                {isDataStale(intelligenceData.lastFetch) ? 'Refresh' : 'Force Refresh'}
                {isDataStale(intelligenceData.lastFetch) && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    background: '#ef4444',
                    borderRadius: '50%'
                  }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {viewMode === 'cards' && (
          /* Health Cards View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {intelligence.map((competitor, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#111827' }}>
                      {competitor.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        background: '#f3f4f6',
                        borderRadius: '0.375rem'
                      }}>
                        <Heart size={14} style={{ color: getHealthColor(competitor.healthScore) }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                          {competitor.healthScore}/100
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getTrendIcon(competitor.trend)}
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {competitor.trend === '↑' ? 'Improving' : competitor.trend === '↓' ? 'Declining' : 'Stable'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Health Score Visual */}
                  <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                    <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        stroke="#e5e7eb"
                        strokeWidth="5"
                        fill="none"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        stroke={getHealthColor(competitor.healthScore)}
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={`${(competitor.healthScore / 100) * 157} 157`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: getHealthColor(competitor.healthScore)
                    }}>
                      {competitor.healthScore}
                    </div>
                  </div>
                </div>

                {/* Health Signals */}
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                    Health Signals
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {Object.entries(competitor.healthSignals || {}).slice(0, 4).map(([key, value]) => (
                      <div key={key} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: '#f9fafb',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem'
                      }}>
                        <span style={{ color: '#6b7280' }}>{getHealthSignalIcon(key)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#6b7280', marginBottom: '0.125rem' }}>{key}</div>
                          <div style={{ color: '#111827', fontWeight: '500', lineHeight: '1.3' }}>
                            {value.length > 50 ? value.substring(0, 50) + '...' : value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Insights - Always visible */}
                {competitor.keyInsights && (
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                      Strategic Insights
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.entries(competitor.keyInsights)
                        .filter(([key]) => key === 'Strength' || key === 'Vulnerability')
                        .map(([key, value]) => (
                          <div key={key} style={{
                            padding: '0.5rem',
                            background: key === 'Strength' ? '#f0fdf4' : '#fee2e2',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: key === 'Strength' ? '#16a34a' : '#dc2626'
                            }}>
                              {key}:
                            </span>{' '}
                            <span style={{ color: '#374151' }}>{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {viewMode === 'topics' && (
          /* Topic Momentum View */
          <div>
            {!topicMomentumData ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                  <RefreshCw size={24} color="#6366f1" />
                </div>
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading topic momentum analysis...</p>
              </div>
            ) : !topicMomentumData.topics || topicMomentumData.topics.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#6b7280' }}>No topics found. Add topics to see momentum analysis.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {topicMomentumData.topics.map((topic, idx) => (
                  <TopicMomentumCard 
                    key={topic.id || idx}
                    topic={topic}
                    idx={idx}
                    totalCompetitors={topicMomentumData.competitorCount || 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};


export default UnifiedIntelligenceDashboard;