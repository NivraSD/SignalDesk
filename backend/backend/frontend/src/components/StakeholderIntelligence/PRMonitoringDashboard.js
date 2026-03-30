import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Trophy, Users, 
  Newspaper, MessageCircle, Target, Eye,
  BarChart3, Clock, Globe, Zap,
  ThumbsUp, ThumbsDown, Megaphone, Shield,
  Twitter, Linkedin, Award, Building
} from 'lucide-react';
import stakeholderIntelligenceService from '../../services/stakeholderIntelligenceService';
import prDetectionService from '../../services/prDetectionService';

const PRMonitoringDashboard = ({ strategy }) => {
  const [prMetrics, setPRMetrics] = useState({
    opportunities: [],
    risks: [],
    mediaActivity: [],
    competitorActivity: []
  });
  const [selectedView, setSelectedView] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadPRMetrics();
    const interval = setInterval(loadPRMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [strategy]);

  const loadPRMetrics = async () => {
    if (!strategy?.organizationId) return;
    
    try {
      const findings = await stakeholderIntelligenceService.getIntelligenceFindings(
        strategy.organizationId,
        { limit: 100 }
      );
      
      // Analyze each finding with PR detection service
      const analyzedFindings = findings.map(finding => {
        const content = finding.content || finding.title || '';
        const analysis = prDetectionService.analyzePRSignals(content, {
          isOwnBrand: finding.stakeholder_name === strategy.company,
          isCompetitor: finding.stakeholder_name?.toLowerCase().includes('compet'),
          isClient: finding.stakeholder_type === 'client'
        });
        
        return {
          ...finding,
          prAnalysis: analysis
        };
      });
      
      // Extract opportunities and risks from PR analysis
      const opportunities = analyzedFindings
        .filter(f => f.prAnalysis?.opportunities?.length > 0)
        .flatMap(f => f.prAnalysis.opportunities.map(opp => ({
          ...opp,
          content: f.content,
          source_name: f.source_name,
          discovered_at: f.discovered_at || new Date().toISOString(),
          title: prDetectionService.generateAlertTitle(opp)
        })));
      
      const risks = analyzedFindings
        .filter(f => f.prAnalysis?.risks?.length > 0)
        .flatMap(f => f.prAnalysis.risks.map(risk => ({
          ...risk,
          content: f.content,
          source_name: f.source_name,
          discovered_at: f.discovered_at || new Date().toISOString(),
          title: prDetectionService.generateAlertTitle(risk),
          sentiment_score: risk.severity * -1
        })));
      
      // Original categorization for other metrics
      const mediaActivity = findings.filter(f => 
        f.source_name?.includes('News') ||
        f.source_name?.includes('Media') ||
        f.type === 'news'
      );
      
      const competitorActivity = findings.filter(f => 
        f.stakeholder_name?.toLowerCase().includes('compet')
      );
      
      setPRMetrics({
        opportunities: opportunities.slice(0, 10), // Top 10 opportunities
        risks: risks.slice(0, 10), // Top 10 risks
        mediaActivity,
        competitorActivity
      });
    } catch (error) {
      console.error('Error loading PR metrics:', error);
      
      // Generate mock data for demonstration
      const mockContent = [
        'Tech startup raises $50M in Series B funding led by Sequoia Capital',
        'Company faces backlash over data privacy concerns',
        'New CMO appointed to lead digital transformation',
        'Product launch scheduled for Q2 2024'
      ];
      
      const mockAnalysis = mockContent.map(content => 
        prDetectionService.analyzePRSignals(content)
      );
      
      setPRMetrics({
        opportunities: mockAnalysis.flatMap(a => a.opportunities).slice(0, 5),
        risks: mockAnalysis.flatMap(a => a.risks).slice(0, 5),
        mediaActivity: [],
        competitorActivity: []
      });
    }
  };

  const PRMetricCard = ({ icon: Icon, title, value, trend, color, subtitle }) => (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        background: `${color}15`,
        borderRadius: '50%'
      }} />
      
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 40,
            height: 40,
            background: `${color}20`,
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={20} style={{ color }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
              {title}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
              {value}
            </div>
          </div>
        </div>
        
        {subtitle && (
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {subtitle}
          </div>
        )}
        
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: trend > 0 ? '#10b981' : '#ef4444'
          }}>
            {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend)}% vs last period</span>
          </div>
        )}
      </div>
    </div>
  );

  const OpportunityAlert = ({ opportunity }) => (
    <div style={{
      padding: '1rem',
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '0.5rem',
      marginBottom: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Trophy size={16} style={{ color: '#16a34a' }} />
            <span style={{ fontWeight: '600', color: '#166534', fontSize: '0.875rem' }}>
              PR Opportunity Detected
            </span>
            <span style={{
              padding: '0.125rem 0.5rem',
              background: '#dcfce7',
              color: '#166534',
              borderRadius: '0.25rem',
              fontSize: '0.625rem',
              fontWeight: '500'
            }}>
              HIGH VALUE
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
            {opportunity.title || opportunity.content?.substring(0, 100)}...
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
            <span>Source: {opportunity.source_name || 'Media'}</span>
            <span>•</span>
            <span>{new Date(opportunity.discovered_at).toLocaleTimeString()}</span>
          </div>
        </div>
        <button style={{
          padding: '0.375rem 0.75rem',
          background: '#16a34a',
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
    </div>
  );

  const RiskAlert = ({ risk }) => (
    <div style={{
      padding: '1rem',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '0.5rem',
      marginBottom: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: '#dc2626' }} />
            <span style={{ fontWeight: '600', color: '#991b1b', fontSize: '0.875rem' }}>
              PR Risk Detected
            </span>
            <span style={{
              padding: '0.125rem 0.5rem',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.25rem',
              fontSize: '0.625rem',
              fontWeight: '500'
            }}>
              REQUIRES ATTENTION
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
            {risk.title || risk.content?.substring(0, 100)}...
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
            <span>Sentiment: {(risk.sentiment_score * 100).toFixed(0)}% negative</span>
            <span>•</span>
            <span>{new Date(risk.discovered_at).toLocaleTimeString()}</span>
          </div>
        </div>
        <button style={{
          padding: '0.375rem 0.75rem',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          Mitigate
        </button>
      </div>
    </div>
  );

  const MediaCoverageChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const coverage = [12, 18, 15, 22, 28, 20, 25]; // Mock data
    const maxValue = Math.max(...coverage);
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
            Media Coverage Trend
          </h3>
          <select style={{
            padding: '0.25rem 0.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            fontSize: '0.75rem'
          }}>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last quarter</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'end', gap: '0.5rem', height: '150px' }}>
          {days.map((day, idx) => (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '100%',
                background: '#6366f1',
                height: `${(coverage[idx] / maxValue) * 100}%`,
                borderRadius: '0.25rem 0.25rem 0 0',
                marginBottom: '0.5rem',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
              onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
              >
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.625rem',
                  fontWeight: '600',
                  color: '#6366f1'
                }}>
                  {coverage[idx]}
                </div>
              </div>
              <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>{day}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ShareOfVoice = () => {
    const competitors = [
      { name: 'You', share: 35, color: '#6366f1' },
      { name: 'Competitor A', share: 28, color: '#94a3b8' },
      { name: 'Competitor B', share: 22, color: '#cbd5e1' },
      { name: 'Others', share: 15, color: '#e2e8f0' }
    ];
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
          Share of Voice
        </h3>
        
        {competitors.map(comp => (
          <div key={comp.name} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: comp.name === 'You' ? '600' : '400' }}>
                {comp.name}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: comp.color }}>
                {comp.share}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${comp.share}%`,
                height: '100%',
                background: comp.color,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1.5rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
                PR Command Center
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Real-time monitoring of opportunities and risks
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={{
                padding: '0.5rem 1rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Megaphone size={16} />
                New Campaign
              </button>
              <button style={{
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={16} />
                {timeRange === '24h' ? 'Last 24 Hours' : 'Last Week'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Key Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <PRMetricCard
              icon={Trophy}
              title="PR Opportunities"
              value={prMetrics.opportunities.length}
              trend={15}
              color="#16a34a"
              subtitle="Ready for action"
            />
            <PRMetricCard
              icon={AlertTriangle}
              title="Active Risks"
              value={prMetrics.risks.length}
              trend={-8}
              color="#dc2626"
              subtitle="Requiring mitigation"
            />
            <PRMetricCard
              icon={Newspaper}
              title="Media Mentions"
              value={prMetrics.mediaActivity.length}
              trend={22}
              color="#2563eb"
              subtitle="This period"
            />
            <PRMetricCard
              icon={Target}
              title="SOV Position"
              value="#2"
              color="#9333ea"
              subtitle="In your industry"
            />
          </div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Opportunities Section */}
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                    📈 PR Opportunities
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {prMetrics.opportunities.length} Active
                  </span>
                </div>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {prMetrics.opportunities.slice(0, 5).map((opp, idx) => (
                    <OpportunityAlert key={idx} opportunity={opp} />
                  ))}
                  {prMetrics.opportunities.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No opportunities detected yet
                    </div>
                  )}
                </div>
              </div>

              {/* Risks Section */}
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                    🛡️ Risk Monitoring
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {prMetrics.risks.length} Detected
                  </span>
                </div>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {prMetrics.risks.slice(0, 5).map((risk, idx) => (
                    <RiskAlert key={idx} risk={risk} />
                  ))}
                  {prMetrics.risks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No risks detected - all clear!
                    </div>
                  )}
                </div>
              </div>

              {/* Media Coverage Chart */}
              <MediaCoverageChart />
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Share of Voice */}
              <ShareOfVoice />

              {/* Quick Actions */}
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                  Quick Actions
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button style={{
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    <MessageCircle size={18} style={{ color: '#6366f1' }} />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>Draft Press Release</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>AI-powered drafting</div>
                    </div>
                  </button>
                  
                  <button style={{
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    <Users size={18} style={{ color: '#6366f1' }} />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>Find Journalists</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Search media database</div>
                    </div>
                  </button>
                  
                  <button style={{
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                  >
                    <BarChart3 size={18} style={{ color: '#6366f1' }} />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>Generate Report</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>PR performance metrics</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                  Sentiment Analysis
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <ThumbsUp size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>68%</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Positive</div>
                  </div>
                  <div>
                    <MessageCircle size={24} style={{ color: '#6b7280', marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>24%</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Neutral</div>
                  </div>
                  <div>
                    <ThumbsDown size={24} style={{ color: '#ef4444', marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>8%</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Negative</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRMonitoringDashboard;