import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, AlertTriangle, Target, Lightbulb, 
  Activity, ChevronRight, BarChart3, Shield, 
  ArrowUp, ArrowDown, Users, Zap
} from 'lucide-react';
import simplifiedMonitoringService from '../../services/simplifiedMonitoringService';

const StrategicAnalysisDashboard = ({ companyProfile, monitoringConfig }) => {
  const [analysis, setAnalysis] = useState({
    marketPosition: null,
    competitiveThreats: [],
    opportunities: [],
    recommendations: [],
    keyTrends: [],
    riskAssessment: null
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (monitoringConfig) {
      startAnalysis();
    }
  }, [monitoringConfig]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Start monitoring with user config
    await simplifiedMonitoringService.startMonitoring(companyProfile, monitoringConfig);
    
    // Subscribe to updates and analyze
    const unsubscribe = simplifiedMonitoringService.subscribe((type, data) => {
      if (type === 'competitors' || type === 'trending') {
        performStrategicAnalysis();
      }
    });
    
    // Initial analysis
    setTimeout(() => {
      performStrategicAnalysis();
      setIsAnalyzing(false);
    }, 2000);
    
    return () => {
      unsubscribe();
      simplifiedMonitoringService.stopMonitoring();
    };
  };

  const performStrategicAnalysis = () => {
    const currentData = simplifiedMonitoringService.getCurrentData();
    
    // Analyze market position
    const marketPosition = analyzeMarketPosition(currentData);
    
    // Identify competitive threats
    const threats = identifyThreats(currentData);
    
    // Find opportunities
    const opportunities = findOpportunities(currentData);
    
    // Generate strategic recommendations
    const recommendations = generateRecommendations(marketPosition, threats, opportunities);
    
    // Extract key trends
    const trends = extractKeyTrends(currentData);
    
    // Risk assessment
    const riskAssessment = assessRisks(threats, currentData);
    
    setAnalysis({
      marketPosition,
      competitiveThreats: threats,
      opportunities,
      recommendations,
      keyTrends: trends,
      riskAssessment
    });
  };

  const analyzeMarketPosition = (data) => {
    let position = 'stable';
    let sentiment = 'neutral';
    let competitorActivity = 'normal';
    
    if (data.competitors && data.competitors.competitors) {
      const totalUpdates = data.competitors.competitors.reduce((acc, c) => 
        acc + c.updates.length, 0
      );
      
      const positiveCompetitorNews = data.competitors.competitors.reduce((acc, c) => 
        acc + c.updates.filter(u => u.sentiment === 'positive').length, 0
      );
      
      if (positiveCompetitorNews > totalUpdates * 0.6) {
        competitorActivity = 'high';
        position = 'challenged';
      }
    }
    
    if (data.trending && data.trending.topics) {
      const companyMentions = data.trending.topics.filter(t => 
        t.title && companyProfile.company && 
        t.title.toLowerCase().includes(companyProfile.company.toLowerCase())
      );
      
      if (companyMentions.length > 0) {
        sentiment = 'positive';
        position = 'strong';
      }
    }
    
    return {
      position,
      sentiment,
      competitorActivity,
      summary: `Your market position is ${position} with ${sentiment} sentiment and ${competitorActivity} competitor activity.`
    };
  };

  const identifyThreats = (data) => {
    const threats = [];
    
    if (data.competitors && data.competitors.competitors) {
      data.competitors.competitors.forEach(competitor => {
        const positiveNews = competitor.updates.filter(u => u.sentiment === 'positive');
        if (positiveNews.length > 0) {
          threats.push({
            type: 'competitive',
            severity: positiveNews.length > 2 ? 'high' : 'medium',
            source: competitor.name,
            description: `${competitor.name} gaining positive momentum`,
            evidence: positiveNews[0].title,
            action: 'Monitor closely and consider response strategy'
          });
        }
      });
    }
    
    return threats;
  };

  const findOpportunities = (data) => {
    const opportunities = [];
    
    // Competitor weaknesses
    if (data.competitors && data.competitors.competitors) {
      data.competitors.competitors.forEach(competitor => {
        const negativeNews = competitor.updates.filter(u => u.sentiment === 'negative');
        if (negativeNews.length > 0) {
          opportunities.push({
            type: 'competitive_advantage',
            urgency: 'high',
            description: `${competitor.name} facing challenges`,
            action: 'Position your company as the stable alternative',
            timeframe: 'Immediate'
          });
        }
      });
    }
    
    // Trending topics alignment
    if (data.trending && data.trending.topics) {
      const relevantTrends = data.trending.topics.slice(0, 3);
      relevantTrends.forEach(trend => {
        if (trend.title && companyProfile.company && 
            !trend.title.toLowerCase().includes(companyProfile.company.toLowerCase())) {
          opportunities.push({
            type: 'content',
            urgency: 'medium',
            description: `Trending topic: ${trend.title.substring(0, 50)}...`,
            action: 'Create thought leadership content',
            timeframe: 'This week'
          });
        }
      });
    }
    
    return opportunities;
  };

  const generateRecommendations = (position, threats, opportunities) => {
    const recommendations = [];
    
    // Based on market position
    if (position.position === 'challenged') {
      recommendations.push({
        priority: 'high',
        category: 'positioning',
        title: 'Strengthen Market Position',
        description: 'Competitors are gaining momentum. Time to differentiate.',
        actions: [
          'Launch targeted PR campaign',
          'Highlight unique value propositions',
          'Increase thought leadership content'
        ]
      });
    }
    
    // Based on threats
    if (threats.length > 2) {
      recommendations.push({
        priority: 'high',
        category: 'defensive',
        title: 'Competitive Defense Strategy',
        description: 'Multiple competitive threats detected.',
        actions: [
          'Prepare competitive response materials',
          'Strengthen customer relationships',
          'Accelerate product roadmap announcements'
        ]
      });
    }
    
    // Based on opportunities
    if (opportunities.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'growth',
        title: 'Capitalize on Market Opportunities',
        description: `${opportunities.length} immediate opportunities identified.`,
        actions: opportunities.slice(0, 3).map(o => o.action)
      });
    }
    
    return recommendations;
  };

  const extractKeyTrends = (data) => {
    const trends = [];
    
    if (data.trending && data.trending.topics) {
      // Group by themes
      const themes = {};
      data.trending.topics.forEach(topic => {
        if (!topic.title) return;
        const words = topic.title.toLowerCase().split(' ');
        words.forEach(word => {
          if (word.length > 4) {
            themes[word] = (themes[word] || 0) + 1;
          }
        });
      });
      
      // Get top themes
      Object.entries(themes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([theme, count]) => {
          if (count > 1) {
            trends.push({
              theme: theme,
              strength: count > 3 ? 'strong' : 'emerging',
              relevance: (companyProfile.company && theme.includes(companyProfile.company.toLowerCase())) ? 'direct' : 'indirect'
            });
          }
        });
    }
    
    return trends;
  };

  const assessRisks = (threats, data) => {
    const riskLevel = threats.length > 3 ? 'high' : 
                      threats.length > 1 ? 'medium' : 'low';
    
    return {
      level: riskLevel,
      factors: threats.length,
      primaryRisk: threats[0]?.description || 'No immediate risks identified',
      mitigation: riskLevel === 'high' ? 
        'Immediate action required' : 
        'Continue monitoring'
    };
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (isAnalyzing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Activity size={48} style={{ color: '#6366f1', animation: 'spin 2s linear infinite' }} />
        <h2 style={{ color: '#111827', margin: 0 }}>Analyzing Strategic Intelligence...</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Processing market data and competitor activities</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', background: '#f9fafb', minHeight: '100%' }}>
      {/* Strategic Summary Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '0.75rem',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '1rem' }}>
          Strategic Intelligence Analysis
        </h1>
        <p style={{ fontSize: '1.125rem', opacity: 0.95, marginBottom: '1.5rem' }}>
          {analysis.marketPosition?.summary || 'Analyzing market position...'}
        </p>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <p style={{ opacity: 0.8, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Risk Level</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {analysis.riskAssessment?.level?.toUpperCase() || 'ASSESSING'}
            </p>
          </div>
          <div>
            <p style={{ opacity: 0.8, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Opportunities</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {analysis.opportunities?.length || 0} FOUND
            </p>
          </div>
          <div>
            <p style={{ opacity: 0.8, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Action Items</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {analysis.recommendations?.length || 0} PENDING
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Target size={24} style={{ color: '#6366f1' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              Strategic Recommendations
            </h2>
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem',
                borderLeft: `4px solid ${getPriorityColor(rec.priority)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    {rec.title}
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: getPriorityColor(rec.priority) + '20',
                    color: getPriorityColor(rec.priority),
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: '#6b7280', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  {rec.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {rec.actions.map((action, actionIdx) => (
                    <div key={actionIdx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <ChevronRight size={16} style={{ color: '#6366f1' }} />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Opportunities */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Lightbulb size={24} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              Opportunities
            </h2>
            <span style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              background: '#dcfce7',
              color: '#16a34a',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {analysis.opportunities?.length || 0} ACTIVE
            </span>
          </div>
          
          {analysis.opportunities && analysis.opportunities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analysis.opportunities.map((opp, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  background: '#f0fdf4',
                  borderRadius: '0.375rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                      {opp.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {opp.timeframe}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    {opp.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '0.25rem'
                  }}>
                    <Zap size={14} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.813rem', color: '#047857' }}>
                      {opp.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Scanning for opportunities...
            </p>
          )}
        </div>

        {/* Competitive Threats */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              Competitive Threats
            </h2>
            {analysis.competitiveThreats && analysis.competitiveThreats.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                padding: '0.25rem 0.5rem',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {analysis.competitiveThreats.length} DETECTED
              </span>
            )}
          </div>
          
          {analysis.competitiveThreats && analysis.competitiveThreats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analysis.competitiveThreats.map((threat, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  background: '#fef2f2',
                  borderRadius: '0.375rem',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {threat.source}
                    </span>
                    <span style={{
                      padding: '0.125rem 0.375rem',
                      background: threat.severity === 'high' ? '#dc2626' : '#f59e0b',
                      color: 'white',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      {threat.severity.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.813rem', color: '#111827', marginBottom: '0.25rem' }}>
                    {threat.description}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                    Evidence: {threat.evidence}
                  </p>
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.813rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Shield size={14} style={{ color: '#ef4444' }} />
                    <span>{threat.action}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              No immediate threats detected
            </p>
          )}
        </div>
      </div>

      {/* Key Trends */}
      {analysis.keyTrends && analysis.keyTrends.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginTop: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={24} style={{ color: '#6366f1' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              Key Market Trends
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {analysis.keyTrends.map((trend, idx) => (
              <div key={idx} style={{
                padding: '0.5rem 1rem',
                background: trend.relevance === 'direct' ? '#e0e7ff' : '#f3f4f6',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {trend.strength === 'strong' ? (
                  <ArrowUp size={14} style={{ color: '#16a34a' }} />
                ) : (
                  <TrendingUp size={14} style={{ color: '#6366f1' }} />
                )}
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: trend.relevance === 'direct' ? '#4f46e5' : '#374151'
                }}>
                  {trend.theme}
                </span>
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

export default StrategicAnalysisDashboard;