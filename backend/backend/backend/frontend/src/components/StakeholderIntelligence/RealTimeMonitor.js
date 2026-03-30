import React, { useState, useEffect } from 'react';
import { 
  Activity, RefreshCw, Globe, Newspaper, MessageCircle, 
  TrendingUp, TrendingDown, Minus, Clock, ExternalLink,
  AlertCircle, CheckCircle, XCircle, Loader
} from 'lucide-react';
import realTimeMonitoringService from '../../services/realTimeMonitoringService';

const RealTimeMonitor = ({ stakeholderStrategy }) => {
  const [monitoringData, setMonitoringData] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (stakeholderStrategy?.stakeholderGroups && !isMonitoring) {
      startRealTimeMonitoring();
    }

    return () => {
      realTimeMonitoringService.stopAllMonitoring();
    };
  }, [stakeholderStrategy]);

  const startRealTimeMonitoring = async () => {
    setIsMonitoring(true);
    console.log('Starting real-time monitoring for all stakeholders');

    // Subscribe to updates
    const unsubscribe = realTimeMonitoringService.subscribe((stakeholderId, findings) => {
      setMonitoringData(prev => ({
        ...prev,
        [stakeholderId]: findings
      }));
      setLastUpdate(new Date());
    });

    // Start monitoring for each stakeholder with sources
    for (const stakeholder of stakeholderStrategy.stakeholderGroups) {
      const stakeholderId = stakeholder.id || stakeholder.name;
      
      // Get sources from strategy
      const sources = [];
      
      // Add configured sources if available
      if (stakeholderStrategy.sources) {
        const stakeholderSources = stakeholderStrategy.sources.find(
          sg => sg.stakeholderId === stakeholderId
        );
        if (stakeholderSources) {
          sources.push(...stakeholderSources.sources);
        }
      }
      
      // Add default sources if no configured sources
      if (sources.length === 0) {
        sources.push(
          {
            name: 'Google News',
            url: `https://news.google.com/search?q=${encodeURIComponent(stakeholder.name)}`,
            type: 'news',
            active: true
          },
          {
            name: 'Reddit',
            url: `https://reddit.com/search?q=${encodeURIComponent(stakeholder.name)}`,
            type: 'social',
            active: true
          }
        );
      }

      setLoading(prev => ({ ...prev, [stakeholderId]: true }));
      
      try {
        await realTimeMonitoringService.startMonitoring(
          stakeholderId,
          stakeholder.name,
          sources
        );
      } catch (error) {
        console.error(`Error starting monitoring for ${stakeholder.name}:`, error);
      } finally {
        setLoading(prev => ({ ...prev, [stakeholderId]: false }));
      }
    }
  };

  const refreshStakeholder = async (stakeholder) => {
    const stakeholderId = stakeholder.id || stakeholder.name;
    setLoading(prev => ({ ...prev, [stakeholderId]: true }));
    
    try {
      const sources = [];
      
      // Get configured sources
      if (stakeholderStrategy.sources) {
        const stakeholderSources = stakeholderStrategy.sources.find(
          sg => sg.stakeholderId === stakeholderId
        );
        if (stakeholderSources) {
          sources.push(...stakeholderSources.sources);
        }
      }
      
      // Fetch fresh data
      await realTimeMonitoringService.fetchStakeholderData(
        stakeholderId,
        stakeholder.name,
        sources
      );
    } finally {
      setLoading(prev => ({ ...prev, [stakeholderId]: false }));
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp size={14} style={{ color: '#10b981' }} />;
      case 'negative':
        return <TrendingDown size={14} style={{ color: '#ef4444' }} />;
      default:
        return <Minus size={14} style={{ color: '#6b7280' }} />;
    }
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'news':
        return <Newspaper size={14} />;
      case 'social':
        return <MessageCircle size={14} />;
      default:
        return <Globe size={14} />;
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
              Real-Time Stakeholder Monitoring
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Live data from news, social media, and financial sources
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {lastUpdate && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                <Clock size={14} />
                Last update: {formatTimeAgo(lastUpdate)}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: isMonitoring ? '#dcfce7' : '#fee2e2',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: isMonitoring ? '#166534' : '#991b1b'
            }}>
              <Activity size={14} />
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Stakeholder Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {stakeholderStrategy?.stakeholderGroups?.map(stakeholder => {
          const stakeholderId = stakeholder.id || stakeholder.name;
          const findings = monitoringData[stakeholderId] || [];
          const isLoading = loading[stakeholderId];
          
          return (
            <div key={stakeholderId} style={{
              background: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {/* Stakeholder Header */}
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                      {stakeholder.name}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                      {findings.length} findings • {stakeholder.type}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => refreshStakeholder(stakeholder)}
                    disabled={isLoading}
                    style={{
                      padding: '0.5rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      color: isLoading ? '#9ca3af' : '#374151'
                    }}
                  >
                    {isLoading ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Refresh
                  </button>
                </div>
              </div>

              {/* Findings List */}
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {isLoading && findings.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    <Loader size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.875rem' }}>Fetching real-time data...</p>
                  </div>
                ) : findings.length > 0 ? (
                  <div>
                    {findings.slice(0, 5).map((finding, idx) => (
                      <div key={idx} style={{
                        padding: '1rem',
                        borderBottom: idx < findings.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        {/* Finding Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ 
                              margin: 0, 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: '#111827',
                              lineHeight: '1.4'
                            }}>
                              {finding.title}
                            </h4>
                          </div>
                          {finding.sentiment && getSentimentIcon(finding.sentiment)}
                        </div>
                        
                        {/* Finding Description */}
                        {finding.description && (
                          <p style={{
                            margin: '0.5rem 0',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {finding.description}
                          </p>
                        )}
                        
                        {/* Finding Metadata */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '0.5rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            fontSize: '0.625rem',
                            color: '#9ca3af'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {getSourceIcon(finding.sourceType)}
                              {finding.source}
                            </span>
                            <span>{formatTimeAgo(finding.publishedDate || finding.timestamp)}</span>
                            {finding.relevance && (
                              <span style={{
                                padding: '0.125rem 0.375rem',
                                background: finding.relevance > 0.7 ? '#dcfce7' : '#f3f4f6',
                                color: finding.relevance > 0.7 ? '#166534' : '#6b7280',
                                borderRadius: '0.25rem'
                              }}>
                                {Math.round(finding.relevance * 100)}% relevant
                              </span>
                            )}
                          </div>
                          
                          {finding.url && (
                            <a
                              href={finding.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#6366f1',
                                fontSize: '0.625rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                textDecoration: 'none'
                              }}
                              onClick={e => e.stopPropagation()}
                            >
                              View
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#9ca3af'
                  }}>
                    <Globe size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.875rem' }}>No findings yet</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Monitoring will update every 60 seconds
                    </p>
                  </div>
                )}
              </div>
              
              {/* View All Link */}
              {findings.length > 5 && (
                <div style={{
                  padding: '0.75rem',
                  borderTop: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  textAlign: 'center'
                }}>
                  <button
                    onClick={() => setSelectedStakeholder({ ...stakeholder, findings })}
                    style={{
                      color: '#6366f1',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    View all {findings.length} findings →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No stakeholders message */}
      {!stakeholderStrategy?.stakeholderGroups?.length && (
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: '#f59e0b', opacity: 0.7 }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
            No Stakeholders Configured
          </h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Complete the PR Strategy setup to start monitoring stakeholders in real-time.
          </p>
        </div>
      )}
    </div>
  );
};

export default RealTimeMonitor;