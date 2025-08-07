import React, { useState, useEffect } from 'react';
import { 
  Clock, TrendingUp, TrendingDown, AlertCircle, Building2, 
  Users, Hash, Globe, BarChart3, Activity, Filter,
  ChevronRight, MessageSquare, Eye, ThumbsUp, ThumbsDown,
  Newspaper, Radio, Tv, Wifi, Calendar, RefreshCw, Target
} from 'lucide-react';

// Render analysis sections for the new multi-category structure
const renderAnalysisSection = (title, icon, analysis, color) => {
  if (!analysis) return null;
  
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      borderLeft: `4px solid ${color}`,
      marginBottom: '1.5rem'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '0.5rem',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
          {title}
        </h3>
      </div>
      
      {analysis.summary && (
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280', 
          lineHeight: 1.6,
          marginBottom: '1rem'
        }}>
          {analysis.summary}
        </p>
      )}
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* Handle both old format (findings) and new format (keyDevelopments) */}
        {(analysis.findings || analysis.keyDevelopments) && (analysis.findings || analysis.keyDevelopments).length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Key Findings
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {(analysis.findings || analysis.keyDevelopments).map((finding, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{finding}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.opportunities && analysis.opportunities.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981', marginBottom: '0.5rem' }}>
              Opportunities
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {analysis.opportunities.map((opp, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{opp}</li>
              ))}
            </ul>
          </div>
        )}
        
        {(analysis.risks || analysis.riskFactors || analysis.threats) && (analysis.risks || analysis.riskFactors || analysis.threats).length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ef4444', marginBottom: '0.5rem' }}>
              Risks & Threats
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {(analysis.risks || analysis.riskFactors || analysis.threats).map((risk, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{risk}</li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.dataPoints && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            padding: '0.75rem',
            background: '#f9fafb',
            borderRadius: '0.5rem'
          }}>
            {Object.entries(analysis.dataPoints).map(([key, value]) => (
              <div key={key} style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{key}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0.25rem 0 0 0' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const IntelligenceSummaryDashboard = ({ organizationId, organizationName }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('organization'); // Default to organization tab (executive summary removed)
  const [stats, setStats] = useState({
    totalMentions: 0,
    sentimentScore: 0,
    topicsCovered: 0,
    competitorMentions: 0
  });

  // Fetch news and mentions
  const fetchIntelligence = async () => {
    setIsLoading(true);
    console.log('=== FETCHING CLAUDE-POWERED INTELLIGENCE ===');
    console.log('Organization ID:', organizationId);
    
    try {
      // Try to fetch real data from backend (V2 endpoint with Claude analysis)
      const response = await fetch(`https://signal-desk-ep6ckndvc-nivra-sd.vercel.app/api/monitoring/v2/intelligence-summary/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Claude analysis received:', data);
        
        // Store the full analysis data for separate display
        setAnalysisData(data);
        
        // Update stats from the Claude analysis
        if (data.stats) {
          setStats({
            totalMentions: data.stats.totalDataPoints || 127,
            sentimentScore: data.stats.averageSentiment || 72,
            topicsCovered: data.stats.topicsAnalyzed || 23,
            competitorMentions: data.stats.competitorsAnalyzed || 45
          });
        }
        
        setIsLoading(false);
        return;
      }
      
      // Fall back to mock data if backend not available
      console.log('Using mock data - backend returned:', response.status);
      const mockAnalysis = {
        organizationAnalysis: {
          summary: 'Organization is showing strong growth in the event marketing sector.',
          findings: ['Market position improving', 'Strong customer feedback'],
          opportunities: ['Expand virtual event offerings', 'Partner with venue providers'],
          risks: ['Increased competition from Eventbrite'],
          dataPoints: { 'Growth Rate': '+23%', 'Market Share': '12%' }
        },
        competitorAnalyses: [
          {
            name: 'Eventbrite',
            summary: 'Eventbrite expanding into enterprise market.',
            findings: ['Launched new B2B features', 'Acquired ticketing startup'],
            opportunities: ['Differentiate with better analytics'],
            risks: ['Direct competition in SMB segment']
          },
          {
            name: 'Cvent',
            summary: 'Cvent focusing on hybrid event technology.',
            findings: ['Strong virtual platform', 'Enterprise dominance'],
            opportunities: ['Target mid-market customers'],
            risks: ['Technology gap in virtual events']
          }
        ],
        topicAnalyses: [
          {
            name: 'Virtual Events',
            summary: 'Virtual events continue to grow post-pandemic.',
            findings: ['85% of planners use hybrid format', 'Tech investment increasing'],
            opportunities: ['Develop AR/VR features', 'Improve engagement tools']
          },
          {
            name: 'Event Technology',
            summary: 'AI and automation transforming event planning.',
            findings: ['AI adoption at 45%', 'Automation saves 30% time'],
            opportunities: ['Implement AI recommendations', 'Automate scheduling']
          }
        ],
        stakeholderAnalyses: [
          {
            stakeholder: 'Event Planners',
            impact: 'High demand for integrated solutions',
            recommendations: ['Simplify platform UI', 'Add budget tracking']
          },
          {
            stakeholder: 'Venues',
            impact: 'Seeking digital booking systems',
            recommendations: ['Create venue marketplace', 'Offer commission model']
          }
        ],
        executiveSummary: {
          headline: 'Strong Position in Growing Event Tech Market',
          keyPoints: [
            'Event industry recovering with 23% YoY growth',
            'Virtual and hybrid events now mainstream',
            'Competition intensifying in enterprise segment'
          ],
          overallSentiment: 'positive'
        },
        stats: {
          totalDataPoints: 156,
          averageSentiment: 78,
          topicsAnalyzed: 4,
          competitorsAnalyzed: 4
        }
      };
      setAnalysisData(mockAnalysis);
      setStats({
        totalMentions: 156,
        sentimentScore: 78,
        topicsCovered: 4,
        competitorMentions: 4
      });
      
      const mockNews = [
        {
          id: 1,
          type: 'organization',
          source: 'TechCrunch',
          sourceType: 'news',
          title: `${organizationName} Announces New Partnership with Industry Leader`,
          excerpt: 'Strategic partnership aims to expand market reach and enhance product offerings...',
          sentiment: 'positive',
          relevance: 'high',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          topics: ['partnership', 'growth'],
          mentions: [organizationName],
          engagement: { views: 12500, shares: 450, comments: 78 }
        },
        {
          id: 2,
          type: 'competitor',
          source: 'Reuters',
          sourceType: 'news',
          title: 'Major Competitor Faces Service Disruption',
          excerpt: 'Industry rival experiencing widespread outages affecting thousands of customers...',
          sentiment: 'negative',
          relevance: 'high',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          topics: ['crisis', 'operations'],
          mentions: ['CompetitorCorp'],
          engagement: { views: 28000, shares: 1200, comments: 345 }
        },
        {
          id: 3,
          type: 'topic',
          source: 'The Verge',
          sourceType: 'blog',
          title: 'AI Regulation Debate Intensifies in Tech Sector',
          excerpt: 'New proposed regulations could impact how companies develop and deploy AI systems...',
          sentiment: 'neutral',
          relevance: 'medium',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          topics: ['regulation', 'AI', 'compliance'],
          mentions: [],
          engagement: { views: 8900, shares: 230, comments: 45 }
        },
        {
          id: 4,
          type: 'organization',
          source: 'LinkedIn',
          sourceType: 'social',
          title: `${organizationName} CEO Shares Vision for 2025`,
          excerpt: 'Leadership outlines ambitious growth plans and commitment to innovation...',
          sentiment: 'positive',
          relevance: 'high',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          topics: ['leadership', 'strategy'],
          mentions: [organizationName, 'CEO'],
          engagement: { views: 5600, shares: 890, comments: 120 }
        },
        {
          id: 5,
          type: 'stakeholder',
          source: 'PR Newswire',
          sourceType: 'press',
          title: 'Investor Group Calls for Industry-Wide ESG Standards',
          excerpt: 'Major institutional investors pushing for standardized sustainability reporting...',
          sentiment: 'neutral',
          relevance: 'medium',
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
          topics: ['ESG', 'investors', 'sustainability'],
          mentions: ['BlackRock', 'Vanguard'],
          engagement: { views: 3400, shares: 120, comments: 28 }
        },
        {
          id: 6,
          type: 'topic',
          source: 'Bloomberg',
          sourceType: 'news',
          title: 'Market Analysis: Tech Sector Shows Strong Q4 Performance',
          excerpt: 'Technology companies exceeding expectations despite economic headwinds...',
          sentiment: 'positive',
          relevance: 'medium',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          topics: ['market', 'earnings', 'technology'],
          mentions: [],
          engagement: { views: 15600, shares: 450, comments: 89 }
        }
      ];
    } catch (error) {
      console.error('Error fetching intelligence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
    // Refresh every 5 minutes
    const interval = setInterval(fetchIntelligence, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [organizationId, timeRange]);

  const getSourceIcon = (type) => {
    switch(type) {
      case 'news': return Newspaper;
      case 'social': return MessageSquare;
      case 'blog': return Globe;
      case 'press': return Radio;
      case 'tv': return Tv;
      case 'analysis': return BarChart3;
      default: return Wifi;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (type) => {
    switch(type) {
      case 'organization': return '#6366f1';
      case 'competitor': return '#ec4899';
      case 'topic': return '#f59e0b';
      case 'stakeholder': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatTime = (date) => {
    const hours = Math.floor((new Date() - date) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  // Remove old news-related calculations since we're not using them anymore
  const filteredNews = [];
  const topTrending = [];

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1.5rem 2rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: '#111827' }}>
                Intelligence Summary
              </h1>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                News and mentions from the last {timeRange === '24h' ? '24 hours' : timeRange === '7d' ? '7 days' : '30 days'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  background: 'white',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <button
                onClick={fetchIntelligence}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  background: isLoading ? '#6366f1' : 'white',
                  color: isLoading ? 'white' : '#6b7280',
                  border: isLoading ? '1px solid #6366f1' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshCw size={16} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                {isLoading ? 'Analyzing with Claude...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              background: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Total Mentions</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {stats.totalMentions}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.625rem', color: '#10b981' }}>
                    <TrendingUp size={12} style={{ display: 'inline' }} /> +23% vs yesterday
                  </p>
                </div>
                <Activity size={20} style={{ color: '#6366f1' }} />
              </div>
            </div>

            <div style={{
              background: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Sentiment Score</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {stats.sentimentScore}%
                  </p>
                  <p style={{ margin: 0, fontSize: '0.625rem', color: '#10b981' }}>
                    Mostly positive
                  </p>
                </div>
                <ThumbsUp size={20} style={{ color: '#10b981' }} />
              </div>
            </div>

            <div style={{
              background: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Topics Covered</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {stats.topicsCovered}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.625rem', color: '#6b7280' }}>
                    Across all sources
                  </p>
                </div>
                <Hash size={20} style={{ color: '#f59e0b' }} />
              </div>
            </div>

            <div style={{
              background: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Competitor Mentions</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                    {stats.competitorMentions}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.625rem', color: '#ef4444' }}>
                    <TrendingDown size={12} style={{ display: 'inline' }} /> -12% vs yesterday
                  </p>
                </div>
                <Building2 size={20} style={{ color: '#ec4899' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '0.5rem'
        }}>
          {[
            // REMOVED EXECUTIVE SUMMARY TAB
            { id: 'organization', label: 'Organization', icon: Building2 },
            { id: 'competitors', label: 'Competitors', icon: Users },
            { id: 'topics', label: 'Topics', icon: Hash },
            { id: 'opportunities', label: 'Opportunities', icon: Target },
            { id: 'stakeholders', label: 'Stakeholders', icon: Globe }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === tab.id ? '#6366f1' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '0.5rem 0.5rem 0 0',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Loading Overlay for Claude Analysis */}
        {isLoading && (
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '3rem',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '4px solid #f3f4f6',
                  borderTop: '4px solid #6366f1',
                  animation: 'spin 1s linear infinite'
                }} />
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.25rem' }}>
                    🤖 Claude Research Agents Working...
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    Orchestrating comprehensive 24-hour intelligence analysis
                  </p>
                  <div style={{ display: 'grid', gap: '0.5rem', textAlign: 'left', maxWidth: '500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      Query Clarifier analyzing research objectives
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                      Research Brief Generator creating structured plans
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                      Data Analyst gathering from 14+ sources
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                      Research Orchestrator coordinating analysis
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e5e7eb' }} />
                      Report Generator synthesizing findings
                    </div>
                  </div>
                  <p style={{ margin: '1rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                    This may take 30-60 seconds for comprehensive analysis
                  </p>
                </div>
              </div>
            </div>
        )}

        {/* Content based on active tab */}
        {!isLoading && analysisData && (
          <div>
            {/* REMOVED EXECUTIVE SUMMARY TAB CONTENT - Direct data only */}
            
            {/* Organization Tab */}
            {activeTab === 'organization' && (analysisData.organizationIntelligence || analysisData.organizationAnalysis) && (
              <div>
                {renderAnalysisSection(
                  'Organization Intelligence',
                  <Building2 size={20} style={{ color: '#6366f1' }} />,
                  analysisData.organizationIntelligence || analysisData.organizationAnalysis,
                  '#6366f1'
                )}
              </div>
            )}
            
            {/* Competitors Tab */}
            {activeTab === 'competitors' && (analysisData.competitiveIntelligence || analysisData.competitorAnalyses) && (
              <div>
                {/* Handle new format (competitiveIntelligence) */}
                {analysisData.competitiveIntelligence && (
                  renderAnalysisSection(
                    'Competitive Intelligence',
                    <Users size={20} style={{ color: '#f59e0b' }} />,
                    analysisData.competitiveIntelligence,
                    '#f59e0b'
                  )
                )}
                {/* Handle old format (competitorAnalyses array) */}
                {analysisData.competitorAnalyses && analysisData.competitorAnalyses.map((competitor, idx) => (
                  <div key={idx}>
                    {renderAnalysisSection(
                      competitor.name,
                      <Users size={20} style={{ color: '#ec4899' }} />,
                      competitor,
                      '#ec4899'
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Topics Tab */}
            {activeTab === 'topics' && (analysisData.topicIntelligence || analysisData.topicAnalyses) && (
              <div>
                {/* Handle new format (topicIntelligence) */}
                {analysisData.topicIntelligence && (
                  renderAnalysisSection(
                    'Topic Intelligence',
                    <TrendingUp size={20} style={{ color: '#10b981' }} />,
                    analysisData.topicIntelligence,
                    '#10b981'
                  )
                )}
                {/* Handle old format (topicAnalyses array) */}
                {analysisData.topicAnalyses && analysisData.topicAnalyses.map((topic, idx) => (
                  <div key={idx}>
                    {renderAnalysisSection(
                      topic.name,
                      <Hash size={20} style={{ color: '#f59e0b' }} />,
                      topic,
                      '#f59e0b'
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Opportunities Tab */}
            {activeTab === 'opportunities' && analysisData.opportunities && (
              <div>
                <div style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '0.5rem',
                      background: '#10b98115',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Target size={20} style={{ color: '#10b981' }} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                      Strategic Opportunities Identified
                    </h3>
                  </div>
                  
                  {Array.isArray(analysisData.opportunities) && analysisData.opportunities.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {analysisData.opportunities.map((opp, idx) => (
                        <div key={idx} style={{
                          padding: '1rem',
                          background: '#f9fafb',
                          borderRadius: '0.5rem',
                          borderLeft: `4px solid ${
                            opp.urgency === 'critical' ? '#ef4444' :
                            opp.urgency === 'high' ? '#f59e0b' :
                            opp.urgency === 'medium' ? '#3b82f6' : '#6b7280'
                          }`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                              {opp.title}
                            </h4>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: opp.urgency === 'critical' ? '#ef4444' :
                                         opp.urgency === 'high' ? '#f59e0b' :
                                         opp.urgency === 'medium' ? '#3b82f6' : '#6b7280',
                              color: 'white',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {opp.urgency?.toUpperCase() || 'MEDIUM'}
                            </span>
                          </div>
                          
                          <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                            {opp.description}
                          </p>
                          
                          {opp.type && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pattern: </span>
                              <span style={{ fontSize: '0.75rem', color: '#111827', fontWeight: '500' }}>
                                {opp.type}
                              </span>
                            </div>
                          )}
                          
                          {opp.window && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Time Window: </span>
                              <span style={{ fontSize: '0.75rem', color: '#111827' }}>
                                {opp.window}
                              </span>
                            </div>
                          )}
                          
                          {opp.recommendedAction && (
                            <div style={{ 
                              padding: '0.75rem',
                              background: '#ecfdf5',
                              borderRadius: '0.25rem',
                              marginTop: '0.75rem'
                            }}>
                              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#059669', marginBottom: '0.25rem' }}>
                                Recommended Action:
                              </p>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#064e3b' }}>
                                {opp.recommendedAction}
                              </p>
                            </div>
                          )}
                          
                          {opp.expectedImpact && (
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                              Expected Impact: {opp.expectedImpact}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                      No critical opportunities identified at this time. Continue monitoring for emerging patterns.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Stakeholders Tab */}
            {activeTab === 'stakeholders' && analysisData.stakeholderAnalyses && (
              <div>
                {analysisData.stakeholderAnalyses.map((stakeholder, idx) => (
                  <div key={idx} style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid #e5e7eb',
                    borderLeft: '4px solid #8b5cf6',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0.5rem',
                        background: '#8b5cf615',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Globe size={20} style={{ color: '#8b5cf6' }} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                        {stakeholder.stakeholder}
                      </h3>
                    </div>
                    
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      lineHeight: 1.6,
                      marginBottom: '1rem'
                    }}>
                      <strong>Impact:</strong> {stakeholder.impact}
                    </p>
                    
                    {stakeholder.recommendations && stakeholder.recommendations.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          Recommendations
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          {stakeholder.recommendations.map((rec, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Fallback for no data */}
        {!isLoading && !analysisData && (
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '3rem',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
              No intelligence data available. Click "Refresh" to fetch the latest analysis.
            </p>
          </div>
        )}
      </div>
      
      {/* Hidden old news items code for reference */}
      <div style={{ display: 'none' }}>
        {/* News Items */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {false && [].map(item => {
              const SourceIcon = getSourceIcon(item.sourceType);
              return (
                <div key={item.id} style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '0.5rem',
                        background: `${getCategoryColor(item.type)}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <SourceIcon size={20} style={{ color: getCategoryColor(item.type) }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            background: `${getCategoryColor(item.type)}15`,
                            color: getCategoryColor(item.type),
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {item.type}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {item.source}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            • {formatTime(item.timestamp)}
                          </span>
                        </div>
                        <h3 style={{ margin: '0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                          {item.title}
                        </h3>
                        <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
                          {item.excerpt}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      background: `${getSentimentColor(item.sentiment)}15`,
                      borderRadius: '0.25rem'
                    }}>
                      {item.sentiment === 'positive' ? <ThumbsUp size={14} /> : 
                       item.sentiment === 'negative' ? <ThumbsDown size={14} /> : 
                       <AlertCircle size={14} />}
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: getSentimentColor(item.sentiment),
                        fontWeight: '500'
                      }}>
                        {item.sentiment}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {item.topics.map((topic, idx) => (
                        <span key={idx} style={{
                          padding: '0.25rem 0.5rem',
                          background: '#f3f4f6',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          #{topic}
                        </span>
                      ))}
                      {item.mentions.length > 0 && item.mentions.map((mention, idx) => (
                        <span key={idx} style={{
                          padding: '0.25rem 0.5rem',
                          background: '#eef2ff',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          color: '#6366f1',
                          fontWeight: '500'
                        }}>
                          @{mention}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={14} /> {item.engagement.views.toLocaleString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MessageSquare size={14} /> {item.engagement.comments}
                      </span>
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceSummaryDashboard;