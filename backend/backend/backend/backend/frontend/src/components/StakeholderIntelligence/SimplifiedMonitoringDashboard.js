import React, { useState, useEffect } from 'react';
import { TrendingUp, Building2, Lightbulb, AlertCircle, CheckCircle, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import simplifiedMonitoringService from '../../services/simplifiedMonitoringService';
import industryKeywordService from '../../services/industryKeywordDatabase';

const SimplifiedMonitoringDashboard = ({ companyProfile, monitoringConfig }) => {
  const [monitoringData, setMonitoringData] = useState({
    trending: null,
    competitors: null,
    insights: []
  });
  const [strategy, setStrategy] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (companyProfile && companyProfile.company) {
      // If we have user config, use that; otherwise use suggested strategy
      if (monitoringConfig && monitoringConfig.topics && monitoringConfig.competitors) {
        setStrategy({
          focus: `Monitoring ${monitoringConfig.topics.length} topics and ${monitoringConfig.competitors.length} competitors`,
          competitors: monitoringConfig.competitors,
          topicsToTrack: monitoringConfig.topics,
          searchQueries: [...monitoringConfig.topics, ...monitoringConfig.competitors.map(c => `${c} news`)],
          updateFrequency: 'Every 30 minutes',
          alerts: [
            `${companyProfile.company} mentioned with negative sentiment`,
            'Competitor makes major announcement',
            'Trending topic spike detected'
          ]
        });
      } else {
        // Get suggested strategy
        const suggestedStrategy = industryKeywordService.getSuggestedStrategy(
          companyProfile.company,
          companyProfile.industry || 'technology'
        );
        setStrategy(suggestedStrategy);
      }
      
      // Start monitoring
      startMonitoring();
    }
    
    // Subscribe to updates
    const unsubscribe = simplifiedMonitoringService.subscribe((type, data) => {
      console.log(`Received ${type} update:`, data);
      
      if (type === 'trending') {
        setMonitoringData(prev => ({ ...prev, trending: data }));
      } else if (type === 'competitors') {
        setMonitoringData(prev => ({ 
          ...prev, 
          competitors: data,
          insights: simplifiedMonitoringService.generateInsights({
            company: companyProfile.company,
            industry: companyProfile.industry
          })
        }));
      }
    });
    
    return () => {
      unsubscribe();
      simplifiedMonitoringService.stopMonitoring();
    };
  }, [companyProfile]);

  const startMonitoring = async () => {
    if (!companyProfile) return;
    
    setIsMonitoring(true);
    await simplifiedMonitoringService.startMonitoring(companyProfile, monitoringConfig);
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return <ArrowUp size={16} style={{ color: '#10b981' }} />;
    if (sentiment === 'negative') return <ArrowDown size={16} style={{ color: '#ef4444' }} />;
    return <Minus size={16} style={{ color: '#6b7280' }} />;
  };

  return (
    <div style={{ padding: '1.5rem', background: '#f9fafb', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Intelligence Monitoring
        </h1>
        <p style={{ color: '#6b7280' }}>
          Tracking trending topics and competitor developments for {companyProfile?.company}
        </p>
      </div>

      {/* Strategy Overview */}
      {strategy && (
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Monitoring Strategy
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Focus</p>
              <p style={{ fontWeight: '500' }}>{strategy.focus}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Competitors Tracked</p>
              <p style={{ fontWeight: '500' }}>{strategy.competitors.length} companies</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Update Frequency</p>
              <p style={{ fontWeight: '500' }}>{strategy.updateFrequency}</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Trending Topics */}
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={24} style={{ color: '#6366f1' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Trending Topics</h2>
            {monitoringData.trending && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: '#e0e7ff',
                color: '#6366f1',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                {monitoringData.trending.topics.length} topics
              </span>
            )}
          </div>

          {!monitoringData.trending ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <Activity size={32} style={{ margin: '0 auto 1rem', animation: 'spin 2s linear infinite' }} />
              <p>Fetching trending topics...</p>
            </div>
          ) : monitoringData.trending.topics.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No trending topics found yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {monitoringData.trending.topics.slice(0, 5).map((topic, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <a
                    href={topic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#111827',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}
                    onMouseOver={(e) => e.target.style.color = '#6366f1'}
                    onMouseOut={(e) => e.target.style.color = '#111827'}
                  >
                    {topic.title}
                  </a>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {topic.snippet}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    <span>{topic.source}</span>
                    <span>{new Date(topic.pubDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competitor Updates */}
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Building2 size={24} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Competitor Updates</h2>
          </div>

          {!monitoringData.competitors ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <Activity size={32} style={{ margin: '0 auto 1rem', animation: 'spin 2s linear infinite' }} />
              <p>Fetching competitor updates...</p>
            </div>
          ) : monitoringData.competitors.competitors.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No competitor updates found yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {monitoringData.competitors.competitors.map((competitor, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    {competitor.name}
                  </h3>
                  {competitor.updates.map((update, updateIdx) => (
                    <div key={updateIdx} style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                        {getSentimentIcon(update.sentiment)}
                        <div style={{ flex: 1 }}>
                          <a
                            href={update.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#111827',
                              textDecoration: 'none',
                              fontSize: '0.813rem',
                              display: 'block'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#6366f1'}
                            onMouseOut={(e) => e.target.style.color = '#111827'}
                          >
                            {update.title}
                          </a>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                            {new Date(update.pubDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insights & Recommendations */}
      {monitoringData.insights && monitoringData.insights.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginTop: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Lightbulb size={24} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Insights & Actions</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {monitoringData.insights.map((insight, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                borderRadius: '0.375rem',
                border: '1px solid',
                borderColor: insight.priority === 'high' ? '#fca5a5' : 
                            insight.priority === 'medium' ? '#fbbf24' : '#93c5fd'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                  {insight.priority === 'high' ? (
                    <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  ) : (
                    <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                  )}
                  <div>
                    <h3 style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {insight.title}
                    </h3>
                    <p style={{ fontSize: '0.813rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      {insight.description}
                    </p>
                    <p style={{
                      fontSize: '0.813rem',
                      color: '#6366f1',
                      fontWeight: '500',
                      padding: '0.25rem 0.5rem',
                      background: '#e0e7ff',
                      borderRadius: '0.25rem',
                      display: 'inline-block'
                    }}>
                      Action: {insight.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimplifiedMonitoringDashboard;