import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Play,
  StopCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  Lightbulb,
  Brain,
  GitBranch,
  Users,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Activity,
  Target,
  Radio
} from 'lucide-react';
import apiService from '../../services/apiService';

const OpportunityDashboard = ({ organizationId }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    stakeholder: 0,
    cascade: 0
  });

  // Add CSS for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .spin {
        animation: spin 1s linear infinite;
      }
      .pulse {
        animation: pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fetch opportunities
  const fetchOpportunities = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      // Build query string manually for GET request
      const params = new URLSearchParams({
        organizationId,
        status: 'pending',
        limit: 50
      });
      const response = await apiService.get(`/monitoring/v2/opportunities?${params}`);
      
      if (response.success) {
        const opps = response.opportunities || [];
        setOpportunities(opps);
        
        // Calculate stats
        setStats({
          total: opps.length,
          critical: opps.filter(o => o.urgency === 'critical').length,
          stakeholder: opps.filter(o => o.pattern_name?.toLowerCase().includes('stakeholder')).length,
          cascade: opps.filter(o => o.pattern_name?.toLowerCase().includes('cascade')).length
        });
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Start monitoring
  const startMonitoring = async () => {
    try {
      setMonitoring(true);
      const response = await apiService.post('/monitoring/v2/start-monitoring', {
        organizationId,
        config: {
          intervalMinutes: 5,
          sources: {
            rss: true,
            news: true,
            regulatory: true,
            reddit: false,
            patents: false
          }
        }
      });
      
      if (response.success) {
        // Start polling for updates
        startPolling();
        // Immediate scan
        await scanNow();
      }
    } catch (error) {
      console.error('Error starting monitoring:', error);
      setMonitoring(false);
    }
  };

  // Scan for opportunities manually
  const scanNow = async () => {
    setLoading(true);
    try {
      const response = await apiService.post('/monitoring/v2/scan-opportunities', {
        organizationId
      });
      
      if (response.success) {
        await fetchOpportunities();
      }
    } catch (error) {
      console.error('Error scanning:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start polling for updates
  const startPolling = () => {
    const interval = setInterval(() => {
      fetchOpportunities();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  };

  // Update opportunity status
  const updateOpportunityStatus = async (oppId, newStatus) => {
    try {
      await apiService.put(`/monitoring/v2/opportunities/${oppId}`, {
        status: newStatus
      });
      
      // Refresh list
      await fetchOpportunities();
    } catch (error) {
      console.error('Error updating opportunity:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Filter opportunities by tab
  const getFilteredOpportunities = () => {
    switch (selectedTab) {
      case 'critical':
        return opportunities.filter(o => o.urgency === 'critical');
      case 'stakeholder':
        return opportunities.filter(o => o.pattern_name?.toLowerCase().includes('stakeholder'));
      case 'cascade':
        return opportunities.filter(o => o.pattern_name?.toLowerCase().includes('cascade'));
      default:
        return opportunities;
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Get pattern icon
  const getPatternIcon = (patternName) => {
    if (!patternName) return Lightbulb;
    
    const pattern = patternName.toLowerCase();
    if (pattern.includes('cascade')) return GitBranch;
    if (pattern.includes('stakeholder')) return Users;
    if (pattern.includes('competitive')) return TrendingUp;
    if (pattern.includes('narrative')) return Brain;
    if (pattern.includes('viral')) return Activity;
    if (pattern.includes('regulatory')) return Target;
    return Lightbulb;
  };

  const tabs = [
    { id: 'all', label: `All (${opportunities.length})`, count: opportunities.length },
    { id: 'critical', label: `Critical (${stats.critical})`, count: stats.critical, color: '#ef4444' },
    { id: 'stakeholder', label: `Stakeholder (${stats.stakeholder})`, count: stats.stakeholder, color: '#f59e0b' },
    { id: 'cascade', label: `Cascade (${stats.cascade})`, count: stats.cascade, color: '#3b82f6' }
  ];

  return (
    <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#1a202c' }}>
              Opportunity Detection Engine
            </h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
              Real-time opportunity detection powered by pattern recognition and cascade intelligence
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={monitoring ? () => setMonitoring(false) : startMonitoring}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: monitoring ? 'white' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: monitoring ? '#ef4444' : 'white',
                border: monitoring ? '2px solid #ef4444' : 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {monitoring ? <StopCircle size={18} /> : <Play size={18} />}
              {monitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            <button
              onClick={scanNow}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
              Scan Now
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1a202c' }}>{stats.total}</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Active Opportunities</p>
            </div>
            <Lightbulb size={32} style={{ color: '#667eea' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1a202c' }}>{stats.critical}</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Critical Timing</p>
            </div>
            <AlertTriangle size={32} style={{ color: '#ef4444' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1a202c' }}>{stats.stakeholder}</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Stakeholder Actions</p>
            </div>
            <Users size={32} style={{ color: '#f59e0b' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1a202c' }}>{stats.cascade}</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Cascade Effects</p>
            </div>
            <GitBranch size={32} style={{ color: '#3b82f6' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '0.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: selectedTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: selectedTab === tab.id ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: selectedTab === tab.id ? 'rgba(255,255,255,0.2)' : (tab.color || '#e5e7eb'),
                  color: selectedTab === tab.id ? 'white' : (tab.color ? 'white' : '#6b7280'),
                  padding: '0.125rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Bar */}
      {loading && (
        <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '1rem', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '30%',
            animation: 'pulse 1s ease-in-out infinite'
          }} />
        </div>
      )}

      {/* Opportunities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
        {getFilteredOpportunities().map((opp) => {
          const Icon = getPatternIcon(opp.pattern_name);
          return (
            <div
              key={opp.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onClick={() => {
                setSelectedOpportunity(opp);
                setDetailsOpen(true);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#1a202c' }}>
                      {opp.title || opp.pattern_name || 'Opportunity Detected'}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: getUrgencyColor(opp.urgency),
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {opp.urgency || 'medium'}
                      </span>
                      {opp.score && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          Score: {Math.round(opp.score)}
                        </span>
                      )}
                      {opp.confidence && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {Math.round(opp.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOpportunityStatus(opp.id, 'acting');
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: '2px solid #10b981',
                      background: 'white',
                      color: '#10b981',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#10b981';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#10b981';
                    }}
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOpportunityStatus(opp.id, 'dismissed');
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: '2px solid #ef4444',
                      background: 'white',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
                {opp.description || 'New opportunity detected based on pattern matching'}
              </p>

              {opp.window_end && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Clock size={14} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Window closes: {new Date(opp.window_end).toLocaleString()}
                  </span>
                </div>
              )}

              {opp.recommended_actions && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: '600', color: '#667eea' }}>
                    Recommended Action:
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563' }}>
                    {typeof opp.recommended_actions === 'string' 
                      ? JSON.parse(opp.recommended_actions)?.[0] 
                      : opp.recommended_actions?.[0]} || 'Review and assess'
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && opportunities.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Lightbulb size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1a202c' }}>
            No Active Opportunities
          </h3>
          <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
            Start monitoring to detect opportunities in real-time
          </p>
          <button
            onClick={startMonitoring}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Play size={18} />
            Start Monitoring
          </button>
        </div>
      )}

      {/* Details Modal */}
      {detailsOpen && selectedOpportunity && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setDetailsOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {(() => {
                    const Icon = getPatternIcon(selectedOpportunity.pattern_name);
                    return <Icon size={24} style={{ color: '#667eea' }} />;
                  })()}
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1a202c' }}>
                    {selectedOpportunity.title || selectedOpportunity.pattern_name}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#4b5563' }}>
                  Description
                </h3>
                <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.5' }}>
                  {selectedOpportunity.description}
                </p>
              </div>

              {selectedOpportunity.key_points && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#4b5563' }}>
                    Key Points
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
                    {JSON.parse(selectedOpportunity.key_points).map((point, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDetailsOpen(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    updateOpportunityStatus(selectedOpportunity.id, 'acting');
                    setDetailsOpen(false);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Take Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityDashboard;