import React, { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, Target, AlertCircle, CheckCircle,
  Eye, Brain, Zap, BarChart3, Clock, RefreshCw,
  ChevronRight, Shield, Users, Building2, Settings
} from 'lucide-react';
import apiService from '../../services/apiService';
import TargetSourcesManager from './TargetSourcesManager';

const IntelligenceDashboard = ({ organizationId }) => {
  console.log('IntelligenceDashboard rendered with organizationId:', organizationId);
  
  const [loading, setLoading] = useState(true);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [targets, setTargets] = useState([]);
  const [findings, setFindings] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [competitorAnalyses, setCompetitorAnalyses] = useState([]);
  const [topicAnalyses, setTopicAnalyses] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [managingSourcesFor, setManagingSourcesFor] = useState(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);

  // Parse structured analysis format
  const parseStructuredAnalysis = (analysis) => {
    const sections = {};
    
    // Try to parse the new structured format
    if (analysis.includes('**')) {
      const lines = analysis.split('\n');
      let currentSection = null;
      
      lines.forEach(line => {
        if (line.startsWith('**') && line.includes('**:')) {
          const sectionMatch = line.match(/\*\*([^*]+)\*\*:\s*(.*)/);
          if (sectionMatch) {
            currentSection = sectionMatch[1].trim();
            sections[currentSection] = sectionMatch[2].trim();
          }
        } else if (currentSection && line.trim()) {
          sections[currentSection] = (sections[currentSection] + ' ' + line.trim()).trim();
        }
      });
    }
    
    // Also try to parse the quick analysis format (Activity: X | Focus: Y | Gap: Z)
    if (analysis.includes('|') && (analysis.includes('Activity:') || analysis.includes('Trend:'))) {
      const parts = analysis.split('|');
      parts.forEach(part => {
        const [key, value] = part.split(':').map(s => s.trim());
        if (key && value) {
          sections[key] = value;
        }
      });
    }
    
    return sections;
  };
  
  // Intelligent synopsis generation for card previews
  const generateCardPreview = (analysis, targetName, type = 'competitor') => {
    if (!analysis) return {
      preview: 'Analysis in progress...',
      actionType: 'monitor',
      urgency: 'low'
    };
    
    // Parse structured data
    const structured = parseStructuredAnalysis(analysis);
    
    // Smart analysis parsing for competitors
    if (type === 'competitor') {
      // Check for structured format first
      if (structured['ACTIVITY'] || structured['Activity']) {
        const activityLevel = structured['ACTIVITY'] || structured['Activity'] || 'Unknown';
        const focus = structured['FOCUS'] || structured['Focus'] || '';
        const news = structured['RECENT NEWS'] || '';
        const trending = structured['TRENDING'] || '';
        
        // Create simple preview
        let preview = '';
        let icon = '📊';
        if (activityLevel.toLowerCase().includes('high')) {
          preview = `High activity - ${focus}`;
          icon = '🔥';
        } else if (activityLevel.toLowerCase().includes('medium')) {
          preview = `Moderate activity - ${focus}`;
          icon = '📈';
        } else {
          preview = focus || analysis.substring(0, 80);
        }
        
        return {
          preview: preview.substring(0, 100),
          actionType: 'monitor',
          urgency: activityLevel.toLowerCase().includes('high') ? 'high' : 'medium',
          icon: icon,
          structured: structured
        };
      }
      
      // Fallback to original parsing
      const analysisLower = analysis.toLowerCase();
      
      // Partnership opportunities
      if (analysisLower.includes('partnership') || analysisLower.includes('collaboration')) {
        return {
          preview: `${targetName} is expanding partnerships - explore collaboration opportunities`,
          actionType: 'partnership',
          urgency: analysisLower.includes('immediate') ? 'high' : 'medium',
          icon: '🤝'
        };
      }
      
      // Competitive threats
      if (analysisLower.includes('threat') || analysisLower.includes('competitive')) {
        return {
          preview: `${targetName} showing competitive moves - defensive strategy needed`,
          actionType: 'defense',
          urgency: 'high',
          icon: '🛡️'
        };
      }
      
      // Market expansion
      if (analysisLower.includes('expansion') || analysisLower.includes('market')) {
        return {
          preview: `${targetName} expanding market presence - track for opportunities`,
          actionType: 'track',
          urgency: 'medium',
          icon: '📈'
        };
      }
      
      // Product/innovation opportunities
      if (analysisLower.includes('product') || analysisLower.includes('innovation')) {
        return {
          preview: `${targetName} product moves suggest differentiation opportunities`,
          actionType: 'differentiate',
          urgency: 'medium',
          icon: '💡'
        };
      }
      
      // Weakness/gap opportunities
      if (analysisLower.includes('gap') || analysisLower.includes('weakness')) {
        return {
          preview: `${targetName} showing market gaps - capitalize on weaknesses`,
          actionType: 'capitalize',
          urgency: 'high',
          icon: '🎯'
        };
      }
    }
    
    // Smart analysis parsing for topics
    if (type === 'topic') {
      // Check for structured format first
      if (structured['STATUS'] || structured['Status']) {
        const status = structured['STATUS'] || structured['Status'] || 'Unknown';
        const themes = structured['MAIN THEMES'] || structured['Main Themes'] || '';
        const players = structured['KEY PLAYERS'] || '';
        const sentiment = structured['SENTIMENT'] || '';
        
        // Create simple preview
        let preview = '';
        let icon = '📊';
        if (status.includes('🔥') || status.toLowerCase().includes('hot')) {
          preview = `Hot topic - ${themes}`;
          icon = '🔥';
        } else if (status.includes('📈') || status.toLowerCase().includes('rising')) {
          preview = `Rising interest - ${themes}`;
          icon = '📈';
        } else {
          preview = themes || analysis.substring(0, 80);
        }
        
        return {
          preview: preview.substring(0, 100),
          actionType: 'monitor',
          urgency: status.includes('🔥') ? 'high' : 'medium',
          icon: icon,
          structured: structured
        };
      }
      
      // Fallback to original parsing
      const analysisLower = analysis.toLowerCase();
      
      // Regulatory opportunities
      if (analysisLower.includes('regulation') || analysisLower.includes('compliance')) {
        return {
          preview: `New ${targetName.toLowerCase()} regulations create positioning opportunities`,
          actionType: 'position',
          urgency: analysisLower.includes('urgent') ? 'high' : 'medium',
          icon: '⚖️'
        };
      }
      
      // Trending topics
      if (analysisLower.includes('trending') || analysisLower.includes('popular')) {
        return {
          preview: `${targetName} trending - prime news hijacking opportunity`,
          actionType: 'hijack',
          urgency: 'high',
          icon: '🔥'
        };
      }
      
      // Crisis/risk topics
      if (analysisLower.includes('crisis') || analysisLower.includes('risk')) {
        return {
          preview: `${targetName} concerns rising - thought leadership opportunity`,
          actionType: 'lead',
          urgency: 'high',
          icon: '🚨'
        };
      }
      
      // Innovation/technology
      if (analysisLower.includes('innovation') || analysisLower.includes('technology')) {
        return {
          preview: `${targetName} evolution creates expert positioning chances`,
          actionType: 'expert',
          urgency: 'medium',
          icon: '🚀'
        };
      }
      
      // Market shifts
      if (analysisLower.includes('shift') || analysisLower.includes('change')) {
        return {
          preview: `${targetName} market shifts - early mover advantage available`,
          actionType: 'move',
          urgency: 'high',
          icon: '⚡'
        };
      }
    }
    
    // Generic fallback with smart extraction
    const sentences = analysis.split(/[.!?]/);
    const actionSentence = sentences.find(s => 
      s.toLowerCase().includes('should') || 
      s.toLowerCase().includes('recommend') ||
      s.toLowerCase().includes('consider') ||
      s.toLowerCase().includes('opportunity')
    );
    
    if (actionSentence) {
      const cleaned = actionSentence.trim().replace(/^(recommended actions?:?|action items?:?)/i, '');
      return {
        preview: cleaned.length > 80 ? cleaned.substring(0, 80) + '...' : cleaned,
        actionType: 'action',
        urgency: 'medium',
        icon: '📋'
      };
    }
    
    // Final fallback
    const firstSentence = sentences[0]?.trim() || analysis.substring(0, 80);
    return {
      preview: firstSentence.length > 80 ? firstSentence.substring(0, 80) + '...' : firstSentence,
      actionType: 'monitor',
      urgency: 'low',
      icon: '👁️'
    };
  };

  const getUrgencyLevel = (analysis) => {
    if (!analysis) return null;
    const analysisLower = analysis.toLowerCase();
    
    if (analysisLower.includes('immediate') || analysisLower.includes('urgent') || analysisLower.includes('now')) {
      return 'immediate';
    }
    if (analysisLower.includes('today') || analysisLower.includes('this week') || analysisLower.includes('time-sensitive')) {
      return 'high';
    }
    if (analysisLower.includes('monitor') || analysisLower.includes('watch') || analysisLower.includes('track')) {
      return 'medium';
    }
    return 'low';
  };

  useEffect(() => {
    console.log('useEffect triggered, organizationId:', organizationId);
    if (organizationId) {
      loadDashboardData();
      
      // Set up real-time updates
      const ws = apiService.connectToRealtime(organizationId, {
        onFinding: handleNewFinding,
        onOpportunity: handleNewOpportunity,
        onStatus: handleStatusUpdate
      });
      
      return () => ws.close();
    }
  }, [organizationId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Loading dashboard data for organization:', organizationId);
      
      // Load each piece individually to see what fails
      let statusData = null;
      let targetsData = [];
      let findingsData = [];
      let opportunitiesData = [];
      let metricsData = null;
      
      try {
        statusData = await apiService.getMonitoringStatus(organizationId);
        console.log('Status loaded:', statusData);
      } catch (err) {
        console.error('Failed to load status:', err);
        // Set default status
        statusData = {
          monitoring: false,
          active_targets: 0,
          active_sources: 0,
          findings_24h: 0,
          opportunities_24h: 0,
          health: 'unknown'
        };
      }
      
      try {
        targetsData = await apiService.getOrganizationTargets(organizationId, { active: true });
        console.log('Targets loaded:', targetsData);
      } catch (err) {
        console.error('Failed to load targets:', err);
      }
      
      try {
        findingsData = await apiService.getFindings({ organizationId, limit: 20 });
        console.log('Findings loaded:', findingsData);
      } catch (err) {
        console.error('Failed to load findings:', err);
      }
      
      try {
        opportunitiesData = await apiService.getOpportunities(organizationId, { status: 'identified', limit: 10 });
        console.log('Opportunities loaded:', opportunitiesData);
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      }
      
      try {
        metricsData = await apiService.getMonitoringMetrics(organizationId, 7);
        console.log('Metrics loaded:', metricsData);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      }
      
      setMonitoringStatus(statusData);
      setTargets(targetsData || []);
      setFindings(findingsData || []);
      setOpportunities(opportunitiesData || []);
      setMetrics(metricsData);
      
      // Load AI analysis for overview tab
      if (targetsData && targetsData.length > 0) {
        loadAnalysis(targetsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFinding = (finding) => {
    setFindings(prev => [finding, ...prev.slice(0, 19)]);
  };

  const handleNewOpportunity = (opportunity) => {
    setOpportunities(prev => [opportunity, ...prev.slice(0, 9)]);
  };

  const handleStatusUpdate = (status) => {
    setMonitoringStatus(status);
  };

  const loadAnalysis = async (targets) => {
    setAnalysisLoading(true);
    try {
      // Get organization info (we'll use a placeholder for now)
      const organizationName = 'Your Organization';
      
      // Analyze competitors
      const competitors = targets.filter(t => t.type === 'competitor').slice(0, 5);
      const competitorAnalysisPromises = competitors.map(async (competitor) => {
        try {
          const response = await apiService.analyzeCompetitor({
            competitorName: competitor.name,
            organizationId: organizationId,
            organizationName: organizationName,
            targetId: competitor.id
          });
          return {
            id: competitor.id,
            name: competitor.name,
            analysis: response.analysis,
            priority: competitor.priority,
            threat_level: competitor.threat_level,
            dataPoints: response.dataPoints,
            lastUpdated: response.lastUpdated
          };
        } catch (err) {
          console.error(`Failed to analyze ${competitor.name}:`, err);
          return {
            name: competitor.name,
            analysis: 'Analysis temporarily unavailable. Monitoring recent activities and strategic moves...',
            priority: competitor.priority,
            threat_level: competitor.threat_level
          };
        }
      });
      
      // Analyze topics
      const topics = targets.filter(t => t.type === 'topic').slice(0, 5);
      const topicAnalysisPromises = topics.map(async (topic) => {
        try {
          const response = await apiService.analyzeTopic({
            topicName: topic.name,
            organizationId: organizationId,
            organizationName: organizationName,
            targetId: topic.id
          });
          return {
            id: topic.id,
            name: topic.name,
            analysis: response.analysis,
            priority: topic.priority,
            trending: response.trending,
            dataPoints: response.dataPoints,
            lastUpdated: response.lastUpdated
          };
        } catch (err) {
          console.error(`Failed to analyze ${topic.name}:`, err);
          return {
            name: topic.name,
            analysis: 'Analysis temporarily unavailable. Monitoring developments and market trends...',
            priority: topic.priority,
            trending: false
          };
        }
      });
      
      const [competitorResults, topicResults] = await Promise.all([
        Promise.all(competitorAnalysisPromises),
        Promise.all(topicAnalysisPromises)
      ]);
      
      setCompetitorAnalyses(competitorResults);
      setTopicAnalyses(topicResults);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await apiService.triggerMonitoring(organizationId);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleStartMonitoring = async () => {
    try {
      console.log('Starting monitoring for organizationId:', organizationId);
      const result = await apiService.startMonitoring(organizationId);
      console.log('Monitoring started successfully:', result);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      console.error('Error details:', error.message);
    }
  };

  const handleIdentifyOpportunities = async () => {
    const result = await apiService.identifyOpportunities(organizationId);
    if (result.identified > 0) {
      await loadDashboardData();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading intelligence data...</p>
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
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Monitoring Status */}
              <div style={{
                padding: '0.5rem 1rem',
                background: monitoringStatus?.monitoring ? '#dcfce7' : '#fee2e2',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: monitoringStatus?.monitoring ? '#22c55e' : '#ef4444',
                  animation: monitoringStatus?.monitoring ? 'pulse 2s infinite' : 'none'
                }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {monitoringStatus?.monitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
                </span>
              </div>
              
              {/* Actions */}
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
                  gap: '0.5rem'
                }}
              >
                <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                Refresh
              </button>
              
              {!monitoringStatus?.monitoring && (
                <button
                  onClick={handleStartMonitoring}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  Start Monitoring
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
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
            Intelligence Monitoring
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#6b7280', 
            margin: 0 
          }}>
            Real-time monitoring of competitors and topics
          </p>
        </div>

        {/* Opportunity Analysis Content */}
        <div>
          <div>
            {/* Competitor Intelligence Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={24} style={{ color: '#6366f1' }} />
                Competitor Monitoring
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {analysisLoading ? (
                  <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                    <p style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>Analyzing competitor media presence...</p>
                  </div>
                ) : competitorAnalyses.length > 0 ? (
                  competitorAnalyses.map((competitor, idx) => {
                    const isExpanded = expandedAnalysis === `competitor-${idx}`;
                    
                    // Parse structured analysis
                    const structured = parseStructuredAnalysis(competitor.analysis || '');
                    
                    // Extract monitoring info
                    const activityLevel = structured['ACTIVITY'] || structured['Activity'] || 'Monitoring';
                    const focus = structured['FOCUS'] || structured['Focus'] || '';
                    const recentNews = structured['RECENT NEWS'] || '';
                    const trending = structured['TRENDING'] || '';
                    
                    // Determine activity icon and color
                    let activityIcon = '📊';
                    let activityColor = '#6b7280';
                    if (activityLevel.toLowerCase().includes('high')) {
                      activityIcon = '🔥';
                      activityColor = '#dc2626';
                    } else if (activityLevel.toLowerCase().includes('medium')) {
                      activityIcon = '📈';
                      activityColor = '#d97706';
                    } else if (activityLevel.toLowerCase().includes('low')) {
                      activityIcon = '📉';
                      activityColor = '#16a34a';
                    }
                    
                    return (
                      <div key={idx} style={{
                        background: 'white',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedAnalysis(isExpanded ? null : `competitor-${idx}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>{activityIcon}</span>
                            <h4 style={{ fontWeight: '600', fontSize: '1rem', margin: 0, color: '#111827' }}>
                              {competitor.name}
                            </h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setManagingSourcesFor({ ...competitor, type: 'competitor' });
                            }}
                            style={{
                              padding: '0.25rem',
                              background: '#f9fafb',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              color: '#6b7280',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#6366f1';
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#f9fafb';
                              e.target.style.color = '#6b7280';
                            }}
                            title="Configure sources"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                        
                        <div style={{ marginBottom: '0.75rem' }}>
                          {isExpanded ? (
                            // Show full structured data when expanded
                            <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                              {Object.keys(structured).length > 0 ? (
                                Object.entries(structured).map(([key, value]) => (
                                  <div key={key} style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ color: '#374151', display: 'inline-block', minWidth: '120px' }}>
                                      {key}:
                                    </strong>
                                    <span style={{ marginLeft: '0.5rem' }}>{value}</span>
                                  </div>
                                ))
                              ) : (
                                <p style={{ margin: 0 }}>{competitor.analysis}</p>
                              )}
                            </div>
                          ) : (
                            // Show simple monitoring info when collapsed
                            <div>
                              <p style={{ 
                                fontSize: '0.85rem', 
                                color: '#111827', 
                                lineHeight: '1.5',
                                margin: '0 0 0.25rem 0',
                                fontWeight: '500'
                              }}>
                                {focus || 'Monitoring activity and strategic moves'}
                              </p>
                              {recentNews && (
                                <p style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#6b7280', 
                                  lineHeight: '1.4',
                                  margin: 0
                                }}>
                                  Recent: {recentNews.substring(0, 80)}...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '0.125rem 0.5rem',
                              background: '#f3f4f6',
                              color: activityColor,
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              {activityLevel}
                            </span>
                            {competitor.dataPoints > 0 && (
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                background: '#e0e7ff',
                                color: '#4f46e5',
                                borderRadius: '0.25rem',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}>
                                {competitor.dataPoints} signals
                              </span>
                            )}
                            {trending && trending.toLowerCase().includes('gain') && (
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                background: '#dcfce7',
                                color: '#16a34a',
                                borderRadius: '0.25rem',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}>
                                ↑ Momentum
                              </span>
                            )}
                          </div>
                          
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            {isExpanded ? 'Click to collapse' : 'Click for details'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : targets.filter(t => t.type === 'competitor').slice(0, 5).map((competitor, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    borderBottom: idx < 4 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#111827' }}>
                        {competitor.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.5' }}>
                        Analyzing recent activities and strategic moves...
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          background: competitor.priority === 'high' ? '#fee2e2' : '#fef3c7',
                          color: competitor.priority === 'high' ? '#dc2626' : '#d97706',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          {competitor.priority} priority
                        </span>
                        {competitor.threat_level && (
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            background: '#e5e7eb',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                          }}>
                            Threat: {competitor.threat_level}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Trends Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={24} style={{ color: '#10b981' }} />
                Topic Monitoring
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {analysisLoading ? (
                  <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
                    <p style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>Analyzing media trends...</p>
                  </div>
                ) : topicAnalyses.length > 0 ? (
                  topicAnalyses.map((topic, idx) => {
                    const isExpanded = expandedAnalysis === `topic-${idx}`;
                    
                    // Parse structured analysis
                    const structured = parseStructuredAnalysis(topic.analysis || '');
                    
                    // Extract monitoring info
                    const status = structured['STATUS'] || structured['Status'] || 'Monitoring';
                    const mainThemes = structured['MAIN THEMES'] || structured['Main Themes'] || '';
                    const keyPlayers = structured['KEY PLAYERS'] || structured['Key Players'] || '';
                    const developments = structured['RECENT DEVELOPMENTS'] || '';
                    const sentiment = structured['SENTIMENT'] || '';
                    
                    // Determine status icon
                    let statusIcon = '📊';
                    let statusColor = '#6b7280';
                    if (status.includes('🔥') || status.toLowerCase().includes('hot')) {
                      statusIcon = '🔥';
                      statusColor = '#dc2626';
                    } else if (status.includes('📈') || status.toLowerCase().includes('rising')) {
                      statusIcon = '📈';
                      statusColor = '#d97706';
                    } else if (status.includes('📉') || status.toLowerCase().includes('declining')) {
                      statusIcon = '📉';
                      statusColor = '#16a34a';
                    }
                    
                    return (
                      <div key={idx} style={{
                        background: 'white',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedAnalysis(isExpanded ? null : `topic-${idx}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>{statusIcon}</span>
                            <h4 style={{ fontWeight: '600', fontSize: '1rem', margin: 0, color: '#111827' }}>
                              {topic.name}
                            </h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setManagingSourcesFor({ ...topic, type: 'topic' });
                            }}
                            style={{
                              padding: '0.25rem',
                              background: '#f9fafb',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              color: '#6b7280',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#10b981';
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#f9fafb';
                              e.target.style.color = '#6b7280';
                            }}
                            title="Configure sources"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                        
                        <div style={{ marginBottom: '0.75rem' }}>
                          {isExpanded ? (
                            // Show full structured data when expanded
                            <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                              {Object.keys(structured).length > 0 ? (
                                Object.entries(structured).map(([key, value]) => (
                                  <div key={key} style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ color: '#374151', display: 'inline-block', minWidth: '140px' }}>
                                      {key}:
                                    </strong>
                                    <span style={{ marginLeft: '0.5rem' }}>{value}</span>
                                  </div>
                                ))
                              ) : (
                                <p style={{ margin: 0 }}>{topic.analysis}</p>
                              )}
                            </div>
                          ) : (
                            // Show simple monitoring info when collapsed
                            <div>
                              <p style={{ 
                                fontSize: '0.85rem', 
                                color: '#111827', 
                                lineHeight: '1.5',
                                margin: '0 0 0.25rem 0',
                                fontWeight: '500'
                              }}>
                                {mainThemes || 'Monitoring trends and developments'}
                              </p>
                              {keyPlayers && (
                                <p style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#6b7280', 
                                  lineHeight: '1.4',
                                  margin: 0
                                }}>
                                  Key players: {keyPlayers.substring(0, 60)}...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '0.125rem 0.5rem',
                              background: '#f3f4f6',
                              color: statusColor,
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              {status.replace(/[🔥📈📊📉]/g, '').trim()}
                            </span>
                            {topic.trending && (
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                background: '#dcfce7',
                                color: '#16a34a',
                                borderRadius: '0.25rem',
                                fontSize: '0.7rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <Activity size={10} />
                                Active
                              </span>
                            )}
                            {topic.dataPoints > 0 && (
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                background: '#e0e7ff',
                                color: '#4f46e5',
                                borderRadius: '0.25rem',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}>
                                {topic.dataPoints} articles
                              </span>
                            )}
                            {sentiment && (
                              <span style={{
                                padding: '0.125rem 0.5rem',
                                background: sentiment.toLowerCase().includes('positive') ? '#dcfce7' : 
                                           sentiment.toLowerCase().includes('negative') ? '#fee2e2' : '#f3f4f6',
                                color: sentiment.toLowerCase().includes('positive') ? '#16a34a' : 
                                       sentiment.toLowerCase().includes('negative') ? '#dc2626' : '#6b7280',
                                borderRadius: '0.25rem',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}>
                                {sentiment}
                              </span>
                            )}
                          </div>
                          
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            {isExpanded ? 'Click to collapse' : 'Click for details'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : targets.filter(t => t.type === 'topic').slice(0, 5).map((topic, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    borderBottom: idx < 4 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#111827' }}>
                        {topic.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.5' }}>
                        Monitoring developments and market trends...
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          background: '#dcfce7',
                          color: '#16a34a',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Activity size={12} />
                          Trending
                        </span>
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          background: topic.priority === 'high' ? '#fee2e2' : 
                                     topic.priority === 'medium' ? '#fef3c7' : '#e0e7ff',
                          color: topic.priority === 'high' ? '#dc2626' : 
                                 topic.priority === 'medium' ? '#d97706' : '#4f46e5',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem'
                        }}>
                          {topic.priority} impact
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      {/* Source Manager Modal */}
      {managingSourcesFor && (
        <TargetSourcesManager
          target={managingSourcesFor}
          onClose={() => setManagingSourcesFor(null)}
        />
      )}
    </div>
  );
};

export default IntelligenceDashboard;