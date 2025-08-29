import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertCircle, Activity,
  Brain, Zap, Eye, AlertTriangle, CheckCircle,
  Lightbulb, Users, Target, Shield, Clock,
  BarChart3, MessageSquare, Calendar, Bot,
  Sparkles, Database, Search, ArrowRight,
  ChevronRight, Info, X, Plus
} from 'lucide-react';
import StakeholderAIChat from './StakeholderAIChat';
import stakeholderIntelligenceService from '../../services/stakeholderIntelligenceService';
import intelligentMonitoringAgent from '../../services/intelligentMonitoringAgent';

const EnhancedIntelligenceDashboard = ({ strategy, monitoring }) => {
  const [stakeholders, setStakeholders] = useState([]);
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [dailyBrief, setDailyBrief] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatStakeholder, setAiChatStakeholder] = useState(null);
  const [agentInsights, setAgentInsights] = useState({});
  const [monitoringStatus, setMonitoringStatus] = useState('inactive');

  useEffect(() => {
    const fetchMonitoringData = async () => {
      if (strategy?.organizationId) {
        try {
          // Start intelligent monitoring agents
          if (strategy.stakeholderGroups && strategy.stakeholderGroups.length > 0) {
            console.log('🚀 Starting intelligent monitoring for', strategy.stakeholderGroups.length, 'stakeholders');
            setMonitoringStatus('starting');
            
            try {
              await intelligentMonitoringAgent.startMonitoring(
                strategy.stakeholderGroups,
                strategy.sources || []
              );
              setMonitoringStatus('active');
              console.log('✅ Monitoring agents deployed successfully');
            } catch (error) {
              console.error('❌ Failed to start monitoring:', error);
              setMonitoringStatus('error');
            }
            
            // Subscribe to agent updates
            const unsubscribe = intelligentMonitoringAgent.subscribe((stakeholderId, intelligence) => {
              setAgentInsights(prev => ({
                ...prev,
                [stakeholderId]: intelligence
              }));
            });
            
            // Get initial insights
            const allInsights = intelligentMonitoringAgent.getAllInsights();
            setAgentInsights(allInsights);
          }
          
          // Fetch real monitoring data from backend
          const monitoringData = await stakeholderIntelligenceService.getStakeholderMonitoring(strategy.organizationId);
          const findings = await stakeholderIntelligenceService.getIntelligenceFindings(strategy.organizationId, { limit: 20 });
          const predictions = await stakeholderIntelligenceService.getPredictions(strategy.organizationId);
          const actions = await stakeholderIntelligenceService.getRecommendedActions(strategy.organizationId);
          
          // Merge backend data with strategy data
          const enhancedStakeholders = strategy.stakeholderGroups.map((group, idx) => {
            const backendData = monitoringData.stakeholders?.find(s => s.name === group.name) || {};
            const groupFindings = findings.filter(f => f.stakeholder_name === group.name);
            const groupPredictions = predictions.filter(p => p.stakeholder_name === group.name);
            const groupActions = actions.filter(a => a.stakeholder_name === group.name);
            
            // Get agent insights for this stakeholder
            const stakeholderId = group.id || group.name;
            const agentData = agentInsights[stakeholderId] || {};
            
            return {
              id: idx,
              name: group.name,
              type: group.type || 'Unknown',
              influence: backendData.influence || group.influence || 7,
              currentSentiment: agentData.sentiment || backendData.current_sentiment || group.currentSentiment || 5,
              sentimentTrend: agentData.sentiment > 5 ? 'improving' : agentData.sentiment < 5 ? 'declining' : 'stable',
              engagementLevel: backendData.engagement_level || group.engagementLevel || 6,
              riskLevel: agentData.riskLevel || calculateRisk(group),
              opportunityScore: agentData.opportunityScore || calculateOpportunity(group),
              agentInsights: agentData.insights || [],
              agentPredictions: agentData.predictions || [],
              keyDevelopments: agentData.keyDevelopments || [],
              recommendedActions: agentData.recommendedActions || [],
              lastUpdate: groupFindings[0]?.discovered_at ? 
                new Date(groupFindings[0].discovered_at).toLocaleTimeString() : 
                new Date().toLocaleTimeString(),
              latestIntelligence: agentData.insights?.[0]?.description || groupFindings[0]?.content || 'Monitoring in progress...',
              predictions: groupPredictions.length > 0 ? 
                groupPredictions.map(p => ({
                  text: p.prediction_text,
                  confidence: p.confidence_score,
                  timeframe: p.timeframe
                })) : agentData.predictions || [],
              recommendedActions: groupActions.length > 0 ?
                groupActions.map(a => ({
                  action: a.action_text,
                  priority: a.priority,
                  impact: a.impact
                })) : agentData.recommendedActions || [],
              sourceCount: backendData.source_count || group.sourceCount || 0,
              findingCount: backendData.finding_count || 0,
              isPreIndexed: backendData.is_pre_indexed || group.preIndexed || false
            };
          });
          
          setStakeholders(enhancedStakeholders);
          generateDailyBrief(enhancedStakeholders);
          generateAlerts(enhancedStakeholders);
        } catch (error) {
          console.error('Error fetching monitoring data:', error);
          // Fall back to local generation
          generateLocalStakeholderData();
        }
      } else {
        // No organization ID, use local generation
        generateLocalStakeholderData();
      }
    };
    
    const generateLocalStakeholderData = async () => {
      if (strategy?.stakeholderGroups) {
        // Start agent monitoring even without organization ID
        console.log('🚀 Starting agent monitoring for local stakeholders');
        try {
          await intelligentMonitoringAgent.startMonitoring(
            strategy.stakeholderGroups,
            strategy.sources || []
          );
          setMonitoringStatus('active');
          
          // Subscribe to updates
          intelligentMonitoringAgent.subscribe((stakeholderId, intelligence) => {
            console.log(`📥 Received agent update for ${stakeholderId}`);
            setAgentInsights(prev => ({
              ...prev,
              [stakeholderId]: intelligence
            }));
            
            // Update stakeholders with new insights
            setStakeholders(prev => prev.map(s => {
              const sId = s.id || s.name;
              if (sId === stakeholderId || s.name === stakeholderId) {
                return {
                  ...s,
                  latestIntelligence: intelligence.insights?.[0]?.description || s.latestIntelligence,
                  agentInsights: intelligence.insights || [],
                  agentPredictions: intelligence.predictions || [],
                  currentSentiment: intelligence.sentiment || s.currentSentiment,
                  riskLevel: intelligence.riskLevel || s.riskLevel,
                  opportunityScore: intelligence.opportunityScore || s.opportunityScore
                };
              }
              return s;
            }));
          });
        } catch (error) {
          console.error('Failed to start agent monitoring:', error);
        }
        
        // Create initial stakeholder data
        const enhancedStakeholders = strategy.stakeholderGroups.map((group, idx) => {
          const stakeholderId = group.id || group.name;
          const agentData = agentInsights[stakeholderId] || {};
          
          return {
            id: stakeholderId,
            name: group.name,
            type: group.type || 'Unknown',
            influence: group.influence || 7,
            currentSentiment: agentData.sentiment || group.currentSentiment || 5,
            sentimentTrend: agentData.sentiment > 5 ? 'improving' : agentData.sentiment < 5 ? 'declining' : 'stable',
            engagementLevel: group.engagementLevel || 6,
            riskLevel: agentData.riskLevel || calculateRisk(group),
            opportunityScore: agentData.opportunityScore || calculateOpportunity(group),
            lastUpdate: new Date().toLocaleTimeString(),
            latestIntelligence: agentData.insights?.[0]?.description || 'Agent analyzing...',
            agentInsights: agentData.insights || [],
            agentPredictions: agentData.predictions || [],
            predictions: agentData.predictions || [],
            recommendedActions: agentData.recommendedActions || [],
            sourceCount: group.sourceCount || 0,
            isPreIndexed: group.preIndexed || false
          };
        });
        
        setStakeholders(enhancedStakeholders);
        generateDailyBrief(enhancedStakeholders);
        generateAlerts(enhancedStakeholders);
      }
    };
    
    fetchMonitoringData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchMonitoringData, 60000); // Refresh every minute
    
    return () => {
      clearInterval(interval);
      intelligentMonitoringAgent.stopMonitoring();
    };
  }, [strategy, monitoring]);

  const calculateTrend = (stakeholder) => {
    // Simulate trend calculation
    const trends = ['improving', 'stable', 'declining'];
    return trends[Math.floor(Math.random() * trends.length)];
  };

  const calculateRisk = (stakeholder) => {
    if (stakeholder.currentSentiment < 4) return 'high';
    if (stakeholder.currentSentiment < 7) return 'medium';
    return 'low';
  };

  const calculateOpportunity = (stakeholder) => {
    if (stakeholder.influence > 7 && stakeholder.currentSentiment > 6) return 'high';
    if (stakeholder.influence > 5) return 'medium';
    return 'low';
  };

  const generateLatestIntelligence = (stakeholder) => {
    const intelligenceTemplates = [
      `Recently increased focus on ESG compliance and sustainability reporting`,
      `Showing interest in AI governance and ethical technology practices`,
      `Monitoring regulatory changes in data privacy and security`,
      `Evaluating competitive positioning in emerging markets`
    ];
    return intelligenceTemplates[Math.floor(Math.random() * intelligenceTemplates.length)];
  };

  const generatePredictions = (stakeholder) => {
    return [
      {
        text: `Likely to increase engagement if ESG initiatives are highlighted`,
        confidence: 0.85,
        timeframe: 'Next 30 days'
      },
      {
        text: `May request detailed compliance documentation`,
        confidence: 0.72,
        timeframe: 'Next 60 days'
      }
    ];
  };

  const generateActions = (stakeholder) => {
    return [
      {
        action: 'Schedule quarterly briefing',
        priority: 'high',
        impact: 'Strengthen relationship'
      },
      {
        action: 'Share ESG progress report',
        priority: 'medium',
        impact: 'Build trust'
      }
    ];
  };

  const generateDailyBrief = (stakeholders) => {
    // Generate dynamic priorities based on actual stakeholder data
    const topPriorities = [];
    
    // Add high-risk stakeholders
    stakeholders
      .filter(s => s.riskLevel === 'high')
      .slice(0, 1)
      .forEach(s => {
        topPriorities.push({
          title: `${s.name} Risk Alert`,
          stakeholder: s.name,
          priority: 'critical',
          detail: `Sentiment declining. ${s.concerns?.[0] || 'Immediate attention required.'}`,
          action: 'View Analysis'
        });
      });
    
    // Add high-opportunity stakeholders
    stakeholders
      .filter(s => s.opportunityScore === 'high')
      .slice(0, 2 - topPriorities.length)
      .forEach(s => {
        topPriorities.push({
          title: `${s.name} Opportunity`,
          stakeholder: s.name,
          priority: 'high',
          detail: s.predictions?.[0]?.text || 'Engagement opportunity identified.',
          action: 'View Plan'
        });
      });
    
    const brief = {
      date: new Date().toLocaleDateString(),
      summary: `${stakeholders.length} stakeholders monitored, ${stakeholders.filter(s => s.currentSentiment >= 7).length} positive, ${stakeholders.filter(s => s.riskLevel === 'high').length} requiring attention`,
      topPriorities: topPriorities.length > 0 ? topPriorities : null
    };
    setDailyBrief(brief);
  };

  const generateAlerts = (stakeholders) => {
    const newAlerts = [];
    
    stakeholders.forEach(stakeholder => {
      if (stakeholder.riskLevel === 'high') {
        newAlerts.push({
          id: Date.now() + Math.random(),
          stakeholder: stakeholder.name,
          type: 'risk',
          message: `${stakeholder.name} sentiment declining - immediate action recommended`,
          priority: 'high'
        });
      }
      
      if (stakeholder.opportunityScore === 'high') {
        newAlerts.push({
          id: Date.now() + Math.random(),
          stakeholder: stakeholder.name,
          type: 'opportunity',
          message: `Engagement opportunity with ${stakeholder.name} - high influence supporter`,
          priority: 'medium'
        });
      }
    });
    
    setAlerts(newAlerts);
  };

  const getStakeholderColor = (sentiment) => {
    if (sentiment > 7) return '#10b981';
    if (sentiment > 4) return '#f59e0b';
    return '#ef4444';
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
      overflow: 'hidden'
    }}>
      {/* Executive Intelligence Summary */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1.5rem',
        flexShrink: 0
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Daily Brief Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#ede9fe',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Brain style={{ width: '24px', height: '24px', color: '#6d28d9' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                  Strategic Intelligence Brief
                </h2>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                  {dailyBrief?.date} • {dailyBrief?.summary}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Agent Monitoring Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                background: monitoringStatus === 'active' ? '#dcfce7' : monitoringStatus === 'starting' ? '#fef3c7' : '#f3f4f6',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: monitoringStatus === 'active' ? '#166534' : monitoringStatus === 'starting' ? '#92400e' : '#6b7280'
              }}>
                <Bot size={14} className={monitoringStatus === 'active' ? 'animate-pulse' : ''} />
                {monitoringStatus === 'active' ? 'AI Agents Active' : 
                 monitoringStatus === 'starting' ? 'Starting Agents...' : 
                 'Agents Inactive'}
              </div>
              
              {/* Agent Count */}
              {monitoringStatus === 'active' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  background: '#ede9fe',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#6d28d9'
                }}>
                  <Users size={14} />
                  {Object.keys(agentInsights).length} Agents Monitoring
                </div>
              )}
              
              {/* Last Update */}
              {Object.keys(agentInsights).length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  background: '#f3f4f6',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  <Clock size={14} />
                  Updated: {new Date().toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Top Priorities */}
          {dailyBrief?.topPriorities && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {dailyBrief.topPriorities.map((priority, idx) => (
                <div key={idx} style={{
                  padding: '1rem',
                  background: priority.priority === 'critical' ? '#fef2f2' : '#fefce8',
                  border: `1px solid ${priority.priority === 'critical' ? '#fecaca' : '#fde68a'}`,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem'
                }}>
                  <AlertTriangle style={{
                    width: '20px',
                    height: '20px',
                    color: priority.priority === 'critical' ? '#ef4444' : '#f59e0b',
                    flexShrink: 0,
                    marginTop: '2px'
                  }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                      {priority.title}
                    </h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#6b7280' }}>
                      {priority.detail}
                    </p>
                    <button style={{
                      padding: '0.25rem 0.75rem',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}>
                      {priority.action}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '1.5rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Stakeholder Intelligence Grid */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              Stakeholder Intelligence
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '1rem' 
            }}>
              {stakeholders.map(stakeholder => (
                <div
                  key={stakeholder.id}
                  style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: stakeholder.isPreIndexed ? '2px solid #6366f1' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedStakeholder(stakeholder)}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                          {stakeholder.name}
                        </h4>
                        {stakeholder.isPreIndexed && (
                          <Database size={14} style={{ color: '#6366f1' }} />
                        )}
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                        {stakeholder.type} • Influence: {stakeholder.influence}/10
                      </p>
                    </div>
                    
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      background: getStakeholderColor(stakeholder.currentSentiment) + '20',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {getTrendIcon(stakeholder.sentimentTrend)}
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '500',
                        color: getStakeholderColor(stakeholder.currentSentiment)
                      }}>
                        {stakeholder.currentSentiment}/10
                      </span>
                    </div>
                  </div>

                  {/* Agent Monitoring Status */}
                  {monitoringStatus === 'active' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      padding: '0.5rem',
                      background: '#dcfce7',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      color: '#166534'
                    }}>
                      <Bot size={14} className="animate-pulse" />
                      <span>AI Agent Monitoring Active</span>
                    </div>
                  )}
                  
                  {/* Latest Intelligence from Agent */}
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Lightbulb size={14} style={{ color: '#6366f1' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4b5563' }}>
                        Agent Intelligence
                      </span>
                      <span style={{ fontSize: '0.625rem', color: '#9ca3af', marginLeft: 'auto' }}>
                        {stakeholder.lastUpdate}
                      </span>
                    </div>
                    {stakeholder.agentInsights && stakeholder.agentInsights.length > 0 ? (
                      <div>
                        {stakeholder.agentInsights.slice(0, 2).map((insight, idx) => (
                          <div key={idx} style={{ marginBottom: '0.5rem' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#374151', fontWeight: '500' }}>
                              {insight.title}
                            </p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#6b7280' }}>
                              {insight.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#374151' }}>
                        {stakeholder.latestIntelligence || 'Agent gathering intelligence...'}
                      </p>
                    )}
                  </div>

                  {/* Agent Predictions */}
                  {((stakeholder.agentPredictions && stakeholder.agentPredictions.length > 0) || 
                    (stakeholder.predictions && stakeholder.predictions.length > 0)) && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Sparkles size={14} style={{ color: '#8b5cf6' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4b5563' }}>
                          AI Predictions
                        </span>
                      </div>
                      {(stakeholder.agentPredictions || stakeholder.predictions).slice(0, 1).map((prediction, idx) => (
                        <div key={idx} style={{
                          padding: '0.5rem',
                          background: '#f3f4f6',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          color: '#374151'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{
                              padding: '0.125rem 0.375rem',
                              background: '#e0e7ff',
                              color: '#4338ca',
                              borderRadius: '0.25rem',
                              fontSize: '0.625rem',
                              fontWeight: '500'
                            }}>
                              {Math.round(prediction.confidence * 100)}% confidence
                            </span>
                            <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>
                              {prediction.timeframe}
                            </span>
                          </div>
                          {prediction.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      padding: '0.5rem',
                      background: '#f9fafb',
                      borderRadius: '0.375rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.625rem', color: '#6b7280', marginBottom: '2px' }}>
                        Risk
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        color: stakeholder.riskLevel === 'high' ? '#ef4444' : 
                               stakeholder.riskLevel === 'medium' ? '#f59e0b' : '#10b981'
                      }}>
                        {stakeholder.riskLevel}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '0.5rem',
                      background: '#f9fafb',
                      borderRadius: '0.375rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.625rem', color: '#6b7280', marginBottom: '2px' }}>
                        Opportunity
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        color: stakeholder.opportunityScore === 'high' ? '#10b981' : 
                               stakeholder.opportunityScore === 'medium' ? '#f59e0b' : '#6b7280'
                      }}>
                        {stakeholder.opportunityScore}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '0.5rem',
                      background: '#f9fafb',
                      borderRadius: '0.375rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.625rem', color: '#6b7280', marginBottom: '2px' }}>
                        Sources
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#111827' }}>
                        {stakeholder.sourceCount || 0}
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        setAiChatStakeholder(stakeholder);
                        setShowAIChat(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#ede9fe',
                        border: '1px solid #c7d2fe',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        color: '#6d28d9'
                      }}>
                      <Brain size={14} />
                      AI Advisor
                    </button>
                    <button 
                      onClick={() => setSelectedStakeholder(stakeholder)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem'
                      }}>
                      <Eye size={14} />
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                Active Alerts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.map(alert => (
                  <div key={alert.id} style={{
                    padding: '1rem',
                    background: alert.type === 'risk' ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${alert.type === 'risk' ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {alert.type === 'risk' ? 
                        <Shield size={20} style={{ color: '#ef4444' }} /> :
                        <Target size={20} style={{ color: '#10b981' }} />
                      }
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                          {alert.message}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          Stakeholder: {alert.stakeholder}
                        </p>
                      </div>
                    </div>
                    <button style={{
                      padding: '0.5rem 1rem',
                      background: alert.type === 'risk' ? '#ef4444' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      Take Action
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Stakeholder Detail Modal */}
      {selectedStakeholder && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
                  {selectedStakeholder.name}
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
                  {selectedStakeholder.type} • Influence: {selectedStakeholder.influence}/10
                </p>
              </div>
              <button
                onClick={() => setSelectedStakeholder(null)}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Predictions Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                  AI Predictions & Analysis
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedStakeholder.predictions.map((prediction, idx) => (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#e0e7ff',
                          color: '#4338ca',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {Math.round(prediction.confidence * 100)}% confidence
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {prediction.timeframe}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827' }}>
                        {prediction.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                  Recommended Actions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {selectedStakeholder.recommendedActions.map((action, idx) => (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: '#f0f9ff',
                      borderRadius: '0.5rem',
                      border: '1px solid #bfdbfe',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#1e40af' }}>
                            {action.action}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#3730a3' }}>
                            {action.impact}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.125rem 0.375rem',
                          background: action.priority === 'high' ? '#fee2e2' : '#fef3c7',
                          color: action.priority === 'high' ? '#991b1b' : '#92400e',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: '500'
                        }}>
                          {action.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => {
                    setAiChatStakeholder(selectedStakeholder);
                    setShowAIChat(true);
                    setSelectedStakeholder(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#6d28d9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                  <Brain size={16} />
                  Open AI Advisor
                </button>
                <button style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <MessageSquare size={16} />
                  Generate Brief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Research Modal */}
      {showResearchModal && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            width: '90%',
            maxWidth: '600px',
            padding: '2rem',
            boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
              Commission Deep Research
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
              Select a stakeholder and research focus area
            </p>
            
            {/* Stakeholder Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Stakeholder
              </label>
              <select style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}>
                <option>Select a stakeholder...</option>
                {stakeholders.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Research Focus */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Research Focus
              </label>
              <textarea
                placeholder="What would you like to research about this stakeholder?"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowResearchModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button style={{
                flex: 1,
                padding: '0.75rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Brain size={16} />
                Start Research
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAIChat && aiChatStakeholder && (
        <StakeholderAIChat
          stakeholder={aiChatStakeholder}
          intelligenceData={monitoring}
          onClose={() => {
            setShowAIChat(false);
            setAiChatStakeholder(null);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedIntelligenceDashboard;