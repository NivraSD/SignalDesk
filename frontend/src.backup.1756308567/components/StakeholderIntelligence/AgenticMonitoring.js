import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';
import { 
  Bot, Activity, Search, Globe, FileText, Twitter, 
  TrendingUp, AlertCircle, Eye, ChevronDown, ChevronRight,
  Sparkles, RefreshCw, Filter, BarChart
} from 'lucide-react';

const AgenticMonitoring = ({ stakeholderStrategy, customSources = [], onFindingsUpdate }) => {
  const [monitoringData, setMonitoringData] = useState({});
  const [expandedStakeholders, setExpandedStakeholders] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [showAnalysis, setShowAnalysis] = useState({});
  const [stakeholderAnalysis, setStakeholderAnalysis] = useState({});
  const [loadingAnalysis, setLoadingAnalysis] = useState({});

  // Initialize monitoring data for each stakeholder
  useEffect(() => {
    if (stakeholderStrategy?.stakeholderGroups) {
      const initialData = {};
      stakeholderStrategy.stakeholderGroups.forEach(stakeholder => {
        const stakeholderId = stakeholder.id || stakeholder.name;
        if (!monitoringData[stakeholderId]) {
          initialData[stakeholderId] = {
            stakeholder: stakeholder,
            findings: [],
            lastUpdated: null,
            summary: null
          };
        }
      });
      setMonitoringData(prev => ({ ...prev, ...initialData }));
    }
  }, [stakeholderStrategy]);

  // Run monitoring for all stakeholders
  const runMonitoring = async () => {
    setIsMonitoring(true);
    
    try {
      const allNewFindings = [];
      
      // Simulate monitoring each stakeholder
      for (const stakeholder of stakeholderStrategy.stakeholderGroups || []) {
        const stakeholderId = stakeholder.id || stakeholder.name;
        
        // Get relevant sources for this stakeholder
        const stakeholderSources = customSources.filter(
          source => source.stakeholderId === stakeholderId && source.active
        );
        
        // Generate mock findings (in production, this would call actual monitoring APIs)
        const newFindings = generateMockFindings(stakeholder, stakeholderSources);
        
        // Transform findings for Strategic Insights format
        const transformedFindings = newFindings.map(finding => ({
          ...finding,
          stakeholder: stakeholder.name,
          stakeholderId: stakeholderId,
          source: finding.source,
          findings: finding.content,
          analysis: `${finding.sentiment} coverage about ${stakeholder.name}`,
          createdAt: finding.timestamp
        }));
        
        allNewFindings.push(...transformedFindings);
        
        setMonitoringData(prev => ({
          ...prev,
          [stakeholderId]: {
            ...prev[stakeholderId],
            findings: [...newFindings, ...(prev[stakeholderId]?.findings || [])].slice(0, 50),
            lastUpdated: new Date()
          }
        }));
        
        // Small delay between stakeholders
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Notify parent component about new findings
      if (onFindingsUpdate && allNewFindings.length > 0) {
        onFindingsUpdate(allNewFindings);
      }
    } catch (error) {
      console.error('Monitoring error:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  // Generate mock findings for demonstration
  const generateMockFindings = (stakeholder, sources) => {
    const sentiments = ['positive', 'neutral', 'negative'];
    const types = ['news', 'social', 'regulatory', 'blog'];
    
    const findings = [];
    const numFindings = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < numFindings; i++) {
      findings.push({
        id: Date.now() + Math.random(),
        stakeholderId: stakeholder.id || stakeholder.name,
        type: types[Math.floor(Math.random() * types.length)],
        source: sources[Math.floor(Math.random() * sources.length)]?.name || 'Web Search',
        title: `${stakeholder.name} mentioned in ${['industry report', 'news article', 'social media', 'analyst note'][Math.floor(Math.random() * 4)]}`,
        content: `Recent ${sentiments[Math.floor(Math.random() * sentiments.length)]} coverage about ${stakeholder.name}. ${stakeholder.reason || 'Key stakeholder for our organization.'}`,
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        relevance: Math.random() * 0.5 + 0.5,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        url: `https://example.com/article-${Math.random().toString(36).substr(2, 9)}`
      });
    }
    
    return findings;
  };

  // Get Claude analysis for a stakeholder
  const getStakeholderAnalysis = async (stakeholderId) => {
    setLoadingAnalysis(prev => ({ ...prev, [stakeholderId]: true }));
    
    try {
      const stakeholderData = monitoringData[stakeholderId];
      const stakeholder = stakeholderData.stakeholder;
      const findings = stakeholderData.findings || [];
      
      // Prepare context for Claude
      const context = {
        stakeholderName: stakeholder.name,
        stakeholderRole: stakeholder.reason || 'Key stakeholder',
        findingsCount: findings.length,
        sentimentBreakdown: {
          positive: findings.filter(f => f.sentiment === 'positive').length,
          neutral: findings.filter(f => f.sentiment === 'neutral').length,
          negative: findings.filter(f => f.sentiment === 'negative').length
        },
        recentFindings: findings.slice(0, 5).map(f => ({
          title: f.title,
          sentiment: f.sentiment,
          type: f.type,
          content: f.content
        })),
        topics: stakeholder.topics || [],
        goals: stakeholder.goals || '',
        fears: stakeholder.fears || ''
      };
      
      const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Analyze the recent monitoring findings for ${stakeholder.name} and provide a concise executive summary.

Context:
- Stakeholder: ${stakeholder.name} (${stakeholder.reason})
- Total findings: ${findings.length}
- Sentiment: ${context.sentimentBreakdown.positive} positive, ${context.sentimentBreakdown.neutral} neutral, ${context.sentimentBreakdown.negative} negative
${context.topics.length > 0 ? `- Topics being tracked: ${context.topics.join(', ')}` : ''}
${context.goals ? `- Our goals: ${context.goals}` : ''}
${context.fears ? `- Our concerns: ${context.fears}` : ''}

Recent findings:
${context.recentFindings.map(f => `- ${f.title} (${f.sentiment}): ${f.content}`).join('\n')}

Please analyze these findings with our goals and concerns in mind. Provide:
1. A 2-3 sentence executive summary
2. Key themes or topics being discussed (especially related to our tracked topics)
3. Sentiment trend analysis
4. Any risks or opportunities related to our goals/concerns
5. Recommended actions (if any)

Keep the response concise and actionable.`,
          context: 'stakeholder_monitoring_analysis'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStakeholderAnalysis(prev => ({
          ...prev,
          [stakeholderId]: data.response || data.analysis
        }));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Provide fallback analysis
      setStakeholderAnalysis(prev => ({
        ...prev,
        [stakeholderId]: generateFallbackAnalysis(monitoringData[stakeholderId])
      }));
    } finally {
      setLoadingAnalysis(prev => ({ ...prev, [stakeholderId]: false }));
      setShowAnalysis(prev => ({ ...prev, [stakeholderId]: true }));
    }
  };

  // Generate fallback analysis if API fails
  const generateFallbackAnalysis = (stakeholderData) => {
    const findings = stakeholderData.findings || [];
    const sentiment = findings.reduce((acc, f) => {
      acc[f.sentiment] = (acc[f.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    const dominantSentiment = Object.entries(sentiment).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    
    return `**Executive Summary**
${stakeholderData.stakeholder.name} has ${findings.length} recent mentions with ${dominantSentiment} sentiment overall. ${
      dominantSentiment === 'negative' 
        ? 'Immediate attention may be required to address concerns.' 
        : dominantSentiment === 'positive' 
        ? 'Current coverage is favorable, maintain engagement momentum.'
        : 'Sentiment is neutral, consider proactive engagement.'
    }

**Key Themes**
- Recent activity across ${[...new Set(findings.map(f => f.type))].join(', ')} channels
- Primary sources: ${[...new Set(findings.map(f => f.source))].slice(0, 3).join(', ')}

**Recommended Actions**
${dominantSentiment === 'negative' ? '- Review negative mentions and prepare responses\n- Engage directly with concerned parties' : ''}
${dominantSentiment === 'positive' ? '- Amplify positive coverage\n- Thank supportive stakeholders' : ''}
${dominantSentiment === 'neutral' ? '- Increase engagement to build stronger relationships\n- Share more updates and success stories' : ''}`;
  };

  const toggleStakeholder = (stakeholderId) => {
    setExpandedStakeholders(prev => ({
      ...prev,
      [stakeholderId]: !prev[stakeholderId]
    }));
  };

  const getSourceIcon = (type) => {
    const icons = {
      news: FileText,
      social: Twitter,
      web: Globe,
      regulatory: FileText,
      blog: FileText
    };
    return icons[type] || Globe;
  };

  const getSentimentColor = (sentiment) => {
    return sentiment === 'positive' ? '#10b981' : 
           sentiment === 'negative' ? '#ef4444' : '#6b7280';
  };

  if (!stakeholderStrategy?.stakeholderGroups) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        color: '#6b7280'
      }}>
        <Activity size={48} style={{ opacity: 0.3 }} />
        <p>Complete the strategy builder to start monitoring</p>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
            Agentic Monitoring
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            AI-powered stakeholder intelligence gathering and analysis
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              background: 'white'
            }}
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          
          {/* Run Monitoring Button */}
          <button
            onClick={runMonitoring}
            disabled={isMonitoring}
            style={{
              padding: '0.75rem 1.5rem',
              background: isMonitoring ? '#e5e7eb' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: isMonitoring ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isMonitoring ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Monitoring...
              </>
            ) : (
              <>
                <Bot size={16} />
                Run Agent Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monitoring Stats */}
      <div style={{
        background: 'white',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Total Findings: <span style={{ fontWeight: '600', color: '#111827' }}>
              {Object.values(monitoringData).reduce((acc, d) => acc + (d.findings?.length || 0), 0)}
            </span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Active Sources: <span style={{ fontWeight: '600', color: '#111827' }}>
              {customSources.filter(s => s.active).length}
            </span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart size={16} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Stakeholders Monitored: <span style={{ fontWeight: '600', color: '#111827' }}>
              {stakeholderStrategy.stakeholderGroups?.length || 0}
            </span>
          </span>
        </div>
      </div>

      {/* Stakeholder Monitoring Results */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {stakeholderStrategy.stakeholderGroups.map(stakeholder => {
            const stakeholderId = stakeholder.id || stakeholder.name;
            const isExpanded = expandedStakeholders[stakeholderId];
            const data = monitoringData[stakeholderId] || {};
            const findings = data.findings || [];
            const hasAnalysis = showAnalysis[stakeholderId] && stakeholderAnalysis[stakeholderId];
            
            return (
              <div
                key={stakeholderId}
                style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  marginBottom: '1rem',
                  overflow: 'hidden'
                }}
              >
                {/* Stakeholder Header */}
                <div
                  onClick={() => toggleStakeholder(stakeholderId)}
                  style={{
                    padding: '1.25rem',
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                        {stakeholder.name}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                        {findings.length} findings • Last updated: {
                          data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Not monitored yet'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Sentiment Summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {findings.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#dcfce7',
                          color: '#166534',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {findings.filter(f => f.sentiment === 'positive').length} positive
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#f3f4f6',
                          color: '#374151',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {findings.filter(f => f.sentiment === 'neutral').length} neutral
                        </span>
                        {findings.filter(f => f.sentiment === 'negative').length > 0 && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {findings.filter(f => f.sentiment === 'negative').length} negative
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem' }}>
                    {/* AI Analysis Section */}
                    {!hasAnalysis && findings.length > 0 && (
                      <div style={{
                        padding: '1rem',
                        background: '#f3f4f6',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={() => getStakeholderAnalysis(stakeholderId)}
                          disabled={loadingAnalysis[stakeholderId]}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#9333ea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Sparkles size={16} />
                          {loadingAnalysis[stakeholderId] ? 'Analyzing...' : 'Get AI Analysis'}
                        </button>
                      </div>
                    )}
                    
                    {/* AI Analysis Results */}
                    {hasAnalysis && (
                      <div style={{
                        padding: '1rem',
                        background: 'linear-gradient(to right, #faf5ff, #f3e8ff)',
                        border: '1px solid #e9d5ff',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <Sparkles size={16} style={{ color: '#9333ea' }} />
                          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#6b21a8' }}>
                            AI Analysis
                          </h4>
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#4c1d95',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {stakeholderAnalysis[stakeholderId]}
                        </div>
                      </div>
                    )}
                    
                    {/* Findings List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {findings.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '2rem',
                          color: '#9ca3af'
                        }}>
                          <Search size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                          <p>No findings yet. Run monitoring to gather intelligence.</p>
                        </div>
                      ) : (
                        findings.slice(0, 10).map(finding => {
                          const Icon = getSourceIcon(finding.type);
                          return (
                            <div
                              key={finding.id}
                              style={{
                                padding: '1rem',
                                background: '#fafafa',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                gap: '1rem'
                              }}
                            >
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '0.375rem',
                                background: '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <Icon size={18} style={{ color: '#6b7280' }} />
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>
                                    {finding.title}
                                  </h5>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    background: finding.sentiment === 'positive' ? '#dcfce7' : 
                                               finding.sentiment === 'negative' ? '#fee2e2' : '#f3f4f6',
                                    color: getSentimentColor(finding.sentiment)
                                  }}>
                                    {finding.sentiment}
                                  </span>
                                </div>
                                
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#4b5563' }}>
                                  {finding.content}
                                </p>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                                  <span>{finding.source}</span>
                                  <span>•</span>
                                  <span>{new Date(finding.timestamp).toLocaleString()}</span>
                                  <a
                                    href={finding.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      marginLeft: 'auto',
                                      color: '#6366f1',
                                      textDecoration: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <Eye size={14} />
                                    View
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      
                      {findings.length > 10 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '0.75rem',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          Showing 10 of {findings.length} findings
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AgenticMonitoring;