import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertCircle, Activity,
  Brain, Zap, Eye, AlertTriangle, CheckCircle,
  Lightbulb
} from 'lucide-react';

const StakeholderIntelligenceDashboard = ({ strategy, monitoring }) => {
  const [stakeholders, setStakeholders] = useState([]);
  const [overallAlignment, setOverallAlignment] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);

  // Mock data for demonstration - would come from API
  useEffect(() => {
    // Transform strategy into stakeholder data
    if (strategy?.stakeholderGroups) {
      const stakeholderData = strategy.stakeholderGroups.map((group, idx) => ({
        id: idx,
        name: group.name,
        influence: group.influence || 7,
        supportLevel: group.currentSentiment || 5,
        engagementLevel: group.engagementLevel || 6,
        sentiment: group.sentiment || 'neutral',
        sentimentTrend: group.trend || 'stable',
        targetSentiment: group.targetSentiment || 8,
        topConcern: group.concerns?.[0] || 'Unknown',
        keyInfluencers: group.influencers || [],
        recentActivity: []
      }));
      setStakeholders(stakeholderData);
      
      // Calculate overall alignment
      const avgAlignment = stakeholderData.reduce((acc, s) => 
        acc + (s.supportLevel / s.targetSentiment) * 100, 0
      ) / stakeholderData.length;
      setOverallAlignment(Math.round(avgAlignment));
    }
  }, [strategy]);

  // Generate alerts based on monitoring data
  useEffect(() => {
    if (monitoring?.mentions) {
      const newAlerts = [];
      
      // Check for sentiment shifts
      const negativeMentions = monitoring.mentions.filter(m => m.sentiment === 'negative');
      if (negativeMentions.length > 3) {
        newAlerts.push({
          id: 1,
          priority: 'high',
          type: 'sentiment',
          message: 'Detected negative sentiment spike in recent mentions',
          stakeholder: 'Public Opinion',
          action: 'Address concerns immediately',
          timestamp: new Date()
        });
      }

      setAlerts(newAlerts);
    }
  }, [monitoring]);

  const getStakeholderColor = (stakeholder) => {
    const ratio = stakeholder.supportLevel / 10;
    if (ratio > 0.7) return '#10b981';
    if (ratio > 0.4) return '#f59e0b';
    return '#ef4444';
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Show loading state if no data
  if (!strategy || !stakeholders.length) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        background: '#f8fafc'
      }}>
        <Brain style={{ width: '48px', height: '48px', color: '#9ca3af' }} />
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
          No stakeholder data available yet
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Complete the strategy builder to see your dashboard
        </p>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      gap: '1.5rem',
      background: '#f8fafc',
      overflow: 'auto'
    }}>
      {/* Strategic Health Overview */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
          Strategic Health Score
        </h2>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {/* Overall Alignment */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(#6366f1 0deg, #6366f1 ${overallAlignment * 3.6}deg, #e5e7eb ${overallAlignment * 3.6}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                  {overallAlignment}%
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Aligned</span>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
              +5% this month
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '0.5rem',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span style={{ fontSize: '0.875rem', color: '#166534' }}>Goals on Track</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
                {stakeholders.filter(s => s.supportLevel >= 7).length}/{stakeholders.length}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#fef3c7',
              borderRadius: '0.5rem',
              border: '1px solid #fde68a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertCircle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                <span style={{ fontSize: '0.875rem', color: '#92400e' }}>Need Attention</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
                {stakeholders.filter(s => s.supportLevel < 5).length}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: '#dbeafe',
              borderRadius: '0.5rem',
              border: '1px solid #93c5fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                <span style={{ fontSize: '0.875rem', color: '#1e40af' }}>Improving</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                {stakeholders.filter(s => s.sentimentTrend === 'improving').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Stakeholder Matrix */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              Stakeholder Matrix
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Size = Influence</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Position = Engagement</span>
            </div>
          </div>

          <div style={{
            position: 'relative',
            height: '300px',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            {/* Quadrant labels */}
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              left: '0.5rem',
              fontSize: '0.75rem',
              color: '#9ca3af'
            }}>
              High Support / Low Engagement
            </div>
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              fontSize: '0.75rem',
              color: '#9ca3af'
            }}>
              High Support / High Engagement
            </div>
            <div style={{
              position: 'absolute',
              bottom: '0.5rem',
              left: '0.5rem',
              fontSize: '0.75rem',
              color: '#9ca3af'
            }}>
              Low Support / Low Engagement
            </div>
            <div style={{
              position: 'absolute',
              bottom: '0.5rem',
              right: '0.5rem',
              fontSize: '0.75rem',
              color: '#9ca3af'
            }}>
              Low Support / High Engagement
            </div>

            {/* Stakeholder bubbles */}
            {stakeholders.map(stakeholder => {
              // Ensure values are numbers and within expected ranges
              const engagement = Math.min(Math.max(stakeholder.engagementLevel || 0, 0), 10);
              const support = Math.min(Math.max(stakeholder.supportLevel || 0, 0), 10);
              const influence = Math.min(Math.max(stakeholder.influence || 0, 0), 10);
              
              const x = (engagement / 10) * 280 + 10;
              const y = 290 - (support / 10) * 280;
              const size = 20 + (influence / 10) * 30;

              return (
                <div
                  key={stakeholder.id}
                  onClick={() => setSelectedStakeholder(stakeholder)}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    background: getStakeholderColor(stakeholder),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.zIndex = '10';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.zIndex = '1';
                  }}
                  title={stakeholder.name}
                >
                  <span style={{
                    fontSize: '0.625rem',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {stakeholder.name.substring(0, 3).toUpperCase()}
                  </span>
                </div>
              );
            })}

            {/* Grid lines */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '1px',
              background: '#e5e7eb'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              background: '#e5e7eb'
            }} />
          </div>
        </div>

        {/* Intelligence Feed */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Brain style={{ width: '20px', height: '20px', color: '#6366f1' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              Intelligence Feed
            </h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {alerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '1rem',
                      background: alert.priority === 'high' ? '#fef2f2' : '#fefce8',
                      border: `1px solid ${alert.priority === 'high' ? '#fecaca' : '#fde68a'}`,
                      borderRadius: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <AlertTriangle style={{
                        width: '20px',
                        height: '20px',
                        color: alert.priority === 'high' ? '#ef4444' : '#f59e0b',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#111827', marginBottom: '0.25rem' }}>
                          {alert.message}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          Affects: {alert.stakeholder}
                        </div>
                        <button style={{
                          padding: '0.375rem 0.75rem',
                          background: '#6366f1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem'
                        }}>
                          <Zap style={{ width: '14px', height: '14px' }} />
                          {alert.action}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#9ca3af'
              }}>
                <Lightbulb style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No critical alerts at this time.</p>
                <p style={{ fontSize: '0.875rem' }}>AI is monitoring for strategic opportunities...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Stakeholder Detail */}
      {selectedStakeholder && (
        <div style={{
          position: 'fixed',
          right: '2rem',
          bottom: '2rem',
          width: '320px',
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          padding: '1.5rem',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              {selectedStakeholder.name}
            </h4>
            <button
              onClick={() => setSelectedStakeholder(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#6b7280' }}>Influence Level:</span>
              <span style={{ float: 'right', fontWeight: '500' }}>{selectedStakeholder.influence}/10</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Current Support:</span>
              <span style={{ float: 'right', fontWeight: '500' }}>{selectedStakeholder.supportLevel}/10</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Target Support:</span>
              <span style={{ float: 'right', fontWeight: '500' }}>{selectedStakeholder.targetSentiment}/10</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Trend:</span>
              <span style={{ float: 'right', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {getTrendIcon(selectedStakeholder.sentimentTrend)}
                {selectedStakeholder.sentimentTrend}
              </span>
            </div>
          </div>

          <button style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.5rem',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <Eye style={{ width: '16px', height: '16px' }} />
            View Full Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default StakeholderIntelligenceDashboard;