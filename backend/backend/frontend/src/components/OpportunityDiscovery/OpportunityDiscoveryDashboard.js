import React, { useState, useEffect } from 'react';
import {
  Zap, TrendingUp, Clock, AlertCircle, Target, Eye,
  Brain, Search, Sparkles, ChevronRight, BarChart3,
  Users, MessageCircle, Shield, Trophy, Lightbulb,
  ArrowUp, ArrowDown, Activity, Globe, Radio
} from 'lucide-react';
import narrativeVacuumService from '../../services/narrativeVacuumService';
import prDetectionService from '../../services/prDetectionService';
import unifiedIntelligenceService from '../../services/unifiedIntelligenceService';

const OpportunityDiscoveryDashboard = ({ client, onOpportunitySelect }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('all');
  const [expandedOpportunity, setExpandedOpportunity] = useState(null);
  const [discoveryStats, setDiscoveryStats] = useState({
    totalDiscovered: 0,
    actedUpon: 0,
    successRate: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    // Only discover opportunities if we have a real client configured
    const currentState = unifiedIntelligenceService.getState();
    console.log('OpportunityDiscovery - Current unified state:', currentState);
    console.log('OpportunityDiscovery - Client prop:', client);
    
    if (currentState.companyProfile || (client && client.company)) {
      console.log('OpportunityDiscovery - Starting discovery with profile:', currentState.companyProfile || client);
      discoverOpportunities();
      
      // Start real-time monitoring
      const monitor = narrativeVacuumService.startRealTimeMonitoring(
        currentState.companyProfile || client,
        handleNewOpportunities
      );
      
      return () => {
        if (monitor && monitor.stop) {
          monitor.stop();
        }
      };
    } else {
      console.log('OpportunityDiscovery - No company profile found, skipping discovery');
    }
  }, [client]);

  const discoverOpportunities = async () => {
    setLoading(true);
    try {
      // Get current state from unified service
      const currentState = unifiedIntelligenceService.getState();
      
      if (currentState.companyProfile) {
        // Use unified service to discover opportunities based on goals
        const unifiedOpportunities = await unifiedIntelligenceService.discoverOpportunities();
        
        // Also get narrative vacuums
        const narrativeVacuums = await narrativeVacuumService.discoverOpportunities(
          currentState.companyProfile,
          { limit: 10 }
        );
        
        // Combine and dedupe opportunities
        const allOpportunities = [
          ...unifiedOpportunities.map(opp => ({
            ...opp,
            matchedGoals: opp.matchedGoals || [],
            goalAlignment: opp.matchedGoals?.length > 0 ? 'HIGH' : 'MEDIUM'
          })),
          ...narrativeVacuums.opportunities
        ];
        
        // Enrich with additional context
        const enrichedOpportunities = allOpportunities.map(opp => ({
          ...opp,
          id: opp.id || `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          discoveryMethod: opp.source || 'Narrative Vacuum Analysis',
          confidence: opp.score / 100,
          competitors: analyzeCompetitorActivity(opp),
          mediaOutlets: suggestMediaOutlets(opp),
          messagingAngles: generateMessagingAngles(opp),
          estimatedReach: estimateReach(opp),
          alignedWithGoals: opp.matchedGoals?.map(g => g.name).join(', ') || 'General PR'
        }));
        
        // Sort by goal alignment and score
        enrichedOpportunities.sort((a, b) => {
          const aScore = (a.score || 0) * (a.matchedGoals?.length || 0.5);
          const bScore = (b.score || 0) * (b.matchedGoals?.length || 0.5);
          return bScore - aScore;
        });
        
        setOpportunities(enrichedOpportunities.slice(0, 20));
        updateStats(enrichedOpportunities);
      } else {
        // Fallback: Use narrative vacuum service directly
        const discovered = await narrativeVacuumService.discoverOpportunities(
          client || { 
            industry: 'technology',
            expertiseAreas: { 'AI': 0.8, 'cloud': 0.7, 'security': 0.6 },
            competitors: ['Microsoft', 'Google', 'Amazon']
          },
          { limit: 20 }
        );

        const enrichedOpportunities = discovered.opportunities.map(opp => ({
          ...opp,
          id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          discoveryMethod: 'Narrative Vacuum Analysis',
          confidence: opp.score / 100,
          competitors: analyzeCompetitorActivity(opp),
          mediaOutlets: suggestMediaOutlets(opp),
          messagingAngles: generateMessagingAngles(opp),
          estimatedReach: estimateReach(opp),
          alignedWithGoals: 'Not configured'
        }));

        setOpportunities(enrichedOpportunities);
        updateStats(enrichedOpportunities);
      }
    } catch (error) {
      console.error('Error discovering opportunities:', error);
    }
    setLoading(false);
  };

  const handleNewOpportunities = (newOpps) => {
    // Add new real-time discoveries
    setOpportunities(prev => {
      const combined = [...newOpps, ...prev];
      // Remove duplicates and keep top 20
      const unique = combined.filter((opp, index, self) =>
        index === self.findIndex(o => o.topic === opp.topic)
      );
      return unique.slice(0, 20);
    });
  };

  const analyzeCompetitorActivity = (opportunity) => {
    // Simulate competitor analysis
    if (!opportunity) return [];
    return [
      { name: 'Competitor A', status: 'silent', opportunity: 85 },
      { name: 'Competitor B', status: 'weak_position', opportunity: 70 },
      { name: 'Competitor C', status: 'absent', opportunity: 95 }
    ];
  };

  const suggestMediaOutlets = (opportunity) => {
    // Suggest relevant media based on topic
    if (!opportunity || !opportunity.topic) {
      return ['Forbes', 'Business Insider', 'Reuters', 'Associated Press'];
    }
    
    const outlets = {
      'AI': ['TechCrunch', 'Wired', 'MIT Tech Review', 'VentureBeat'],
      'sustainability': ['GreenBiz', 'Bloomberg Green', 'Guardian Environment'],
      'finance': ['Wall Street Journal', 'Financial Times', 'Bloomberg'],
      'default': ['Forbes', 'Business Insider', 'Reuters', 'Associated Press']
    };

    const topicLower = opportunity.topic.toLowerCase();
    for (const [key, value] of Object.entries(outlets)) {
      if (topicLower.includes(key)) {
        return value;
      }
    }
    return outlets.default;
  };

  const generateMessagingAngles = (opportunity) => {
    // Generate unique angles for the client
    if (!opportunity || !opportunity.topic) {
      return ['Unique perspective', 'Data-driven insights', 'Future implications', 'Practical guide'];
    }
    
    return [
      `Contrarian perspective on ${opportunity.topic}`,
      `Data-driven insights about ${opportunity.topic}`,
      `Future implications of ${opportunity.topic}`,
      `Practical guide to navigating ${opportunity.topic}`
    ];
  };

  const estimateReach = (opportunity) => {
    // Estimate potential media reach
    if (!opportunity || !opportunity.score) return 50000;
    
    const baseReach = (opportunity.score || 50) * 10000;
    const variance = Math.random() * 0.4 + 0.8; // 80-120% variance
    return Math.floor(baseReach * variance);
  };

  const updateStats = (opps) => {
    setDiscoveryStats({
      totalDiscovered: opps.length,
      actedUpon: Math.floor(opps.length * 0.3),
      successRate: 68,
      avgResponseTime: 4.2
    });
  };

  const OpportunityCard = ({ opportunity }) => {
    const isExpanded = expandedOpportunity === opportunity.id;
    const urgencyColors = {
      'IMMEDIATE': '#dc2626',
      'TODAY': '#f59e0b',
      'THIS_WEEK': '#3b82f6',
      'MONITOR': '#6b7280'
    };

    return (
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: opportunity.score >= 80 ? '2px solid #dc2626' : '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onClick={() => setExpandedOpportunity(isExpanded ? null : opportunity.id)}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Lightbulb size={20} style={{ color: '#f59e0b' }} />
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                {opportunity.topic}
              </h3>
              <span style={{
                padding: '0.125rem 0.5rem',
                background: `${urgencyColors[opportunity.urgency]}20`,
                color: urgencyColors[opportunity.urgency],
                borderRadius: '0.25rem',
                fontSize: '0.625rem',
                fontWeight: '600'
              }}>
                {opportunity.urgency}
              </span>
            </div>
            
            <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {opportunity.explanation}
            </p>
            
            {/* Goal Alignment Indicator */}
            {opportunity.alignedWithGoals && opportunity.alignedWithGoals !== 'Not configured' && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.25rem 0.5rem',
                background: '#f0f9ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                color: '#1e40af'
              }}>
                <Target size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Aligns with: {opportunity.alignedWithGoals}
              </div>
            )}
          </div>

          {/* Score Badge */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `conic-gradient(#6366f1 0deg, #6366f1 ${opportunity.score * 3.6}deg, #e5e7eb ${opportunity.score * 3.6}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
                {Math.round(opportunity.score)}
              </span>
              <span style={{ fontSize: '0.5rem', color: '#6b7280' }}>NVS</span>
            </div>
          </div>
        </div>

        {/* Component Scores */}
        {opportunity.components && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            {Object.entries(opportunity.components).map(([key, value]) => (
              <div key={key} style={{
                textAlign: 'center',
                padding: '0.5rem',
                background: '#f9fafb',
                borderRadius: '0.375rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                  {Math.round(value || 0)}
                </div>
                <div style={{ fontSize: '0.625rem', color: '#6b7280' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            {/* Competitor Analysis */}
            {opportunity.competitors && opportunity.competitors.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Competitor Blind Spots
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {opportunity.competitors.map(comp => (
                    <div key={comp.name} style={{
                      padding: '0.375rem 0.75rem',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ fontWeight: '500' }}>{comp.name}:</span> {comp.status}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Outlets */}
            {opportunity.mediaOutlets && opportunity.mediaOutlets.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Target Media Outlets
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {opportunity.mediaOutlets.map(outlet => (
                    <span key={outlet} style={{
                      padding: '0.25rem 0.5rem',
                      background: '#eff6ff',
                      color: '#1e40af',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}>
                      {outlet}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Messaging Angles */}
            {opportunity.messagingAngles && opportunity.messagingAngles.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Unique Angles You Could Take
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {opportunity.messagingAngles.map((angle, idx) => (
                    <li key={idx}>{angle}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpportunitySelect && onOpportunitySelect(opportunity);
                }}
                style={{
                  flex: 1,
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
                  gap: '0.375rem'
                }}
              >
                <Zap size={16} />
                Claim This Narrative
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: 'white',
                  color: '#6366f1',
                  border: '1px solid #6366f1',
                  borderRadius: '0.375rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={16} style={{ display: 'inline', marginRight: '0.375rem' }} />
                Draft Response
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.75rem',
          color: '#6b7280'
        }}>
          <span>
            <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            {opportunity.action?.timeframe || 'Ongoing'}
          </span>
          <span>
            <Users size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Est. reach: {((opportunity.estimatedReach || 50000) / 1000).toFixed(0)}K
          </span>
          <span>
            <Activity size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            {opportunity.category || 'General'}
          </span>
        </div>
      </div>
    );
  };

  const filterOpportunities = () => {
    switch (selectedView) {
      case 'immediate':
        return opportunities.filter(o => o.urgency === 'IMMEDIATE');
      case 'high':
        return opportunities.filter(o => o.score >= 60);
      case 'trending':
        return opportunities.filter(o => o.type === 'trending_topic' || o.type === 'breaking_news');
      default:
        return opportunities;
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
                🔮 Opportunity Discovery Engine
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Uncovering PR opportunities you didn't know existed
              </p>
            </div>
            
            {unifiedIntelligenceService.getState().companyProfile && (
              <button
                onClick={discoverOpportunities}
                style={{
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
                }}
              >
                <Search size={16} />
                Scan for New Opportunities
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{
              padding: '0.75rem',
              background: '#f0fdf4',
              borderRadius: '0.5rem',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Sparkles size={16} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '500' }}>
                  Discovered Today
                </span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                {discoveryStats.totalDiscovered}
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              background: '#eff6ff',
              borderRadius: '0.5rem',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Trophy size={16} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '500' }}>
                  Acted Upon
                </span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                {discoveryStats.actedUpon}
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              background: '#fef3c7',
              borderRadius: '0.5rem',
              border: '1px solid #fde68a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Target size={16} style={{ color: '#d97706' }} />
                <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '500' }}>
                  Success Rate
                </span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>
                {discoveryStats.successRate}%
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              background: '#faf5ff',
              borderRadius: '0.5rem',
              border: '1px solid #e9d5ff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Clock size={16} style={{ color: '#9333ea' }} />
                <span style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: '500' }}>
                  Avg Response
                </span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea' }}>
                {discoveryStats.avgResponseTime}h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 1.5rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '1rem' }}>
          {[
            { id: 'all', label: 'All Opportunities', icon: Globe },
            { id: 'immediate', label: 'Act Now', icon: Zap },
            { id: 'high', label: 'High Score (60+)', icon: TrendingUp },
            { id: 'trending', label: 'Trending Now', icon: Radio }
          ].map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                style={{
                  padding: '0.75rem 1rem',
                  background: selectedView === view.id ? '#6366f1' : 'transparent',
                  color: selectedView === view.id ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {view.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Opportunities Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Check if company is configured */}
          {!unifiedIntelligenceService.getState().companyProfile && (!client || !client.company) ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem', 
              background: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <Lightbulb size={64} style={{ margin: '0 auto 1.5rem', color: '#f59e0b', opacity: 0.7 }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>
                Configure Your Company First
              </h2>
              <p style={{ fontSize: '1rem', color: '#6b7280', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                To discover opportunities tailored to your business, please complete the PR Strategy setup first.
                This will help us understand your company, goals, and expertise areas.
              </p>
              <button
                onClick={() => {
                  const hubElement = document.querySelector('[data-tab-pr-strategy]');
                  if (hubElement) hubElement.click();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Go to PR Strategy Setup →
              </button>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Brain size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Discovering hidden opportunities...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
              {filterOpportunities().map(opportunity => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          )}
          
          {!loading && filterOpportunities().length === 0 && unifiedIntelligenceService.getState().companyProfile && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Eye size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No opportunities found matching current filters.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Try adjusting your filters or scanning for new opportunities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityDiscoveryDashboard;