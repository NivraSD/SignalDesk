import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, Settings, BarChart3, Target, 
  Zap, TrendingUp, Activity, Eye, Users, Shield,
  ChevronRight, AlertCircle, CheckCircle, Clock,
  Bot, Sparkles, RefreshCw
} from 'lucide-react';
import competitorIntelligenceService from '../../services/competitorIntelligenceService';
import CompetitorResearchAdvisor from './CompetitorResearchAdvisor';

const CompetitorIntelligenceHub = () => {
  const [activeTab, setActiveTab] = useState('discovery');
  const [organization, setOrganization] = useState({ name: '', url: '', description: '' });
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Service connection check on component mount
  useEffect(() => {
    console.log('🔗 CompetitorIntelligenceHub mounted');
    console.log('📦 Service available:', !!competitorIntelligenceService);
  }, []);

  // Monitor state changes
  useEffect(() => {
    console.log('🔄 State updated:');
    console.log('   - activeTab:', activeTab);
    console.log('   - competitorAnalysis:', competitorAnalysis ? 'SET' : 'NULL');
    if (competitorAnalysis) {
      console.log('   - competitors count:', competitorAnalysis.competitors?.length);
    }
  }, [activeTab, competitorAnalysis]);

  const tabs = [
    { id: 'discovery', name: 'Competitor Discovery', icon: Search },
    { id: 'configuration', name: 'Source Configuration', icon: Settings },
    { id: 'monitoring', name: 'Intelligence Dashboard', icon: BarChart3 }
  ];

  // Discover competitors
  const handleDiscoverCompetitors = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!organization.name.trim()) return;

    console.log('🚀 Starting competitor discovery for:', organization);
    setIsAnalyzing(true);
    
    try {
      console.log('📞 Calling competitorIntelligenceService.discoverCompetitors...');
      const analysis = await competitorIntelligenceService.discoverCompetitors(organization);
      console.log('✅ Received analysis:', analysis);
      console.log('🏢 Competitors found:', analysis.competitors?.map(c => c.name));
      console.log('📊 Number of competitors:', analysis.competitors?.length);
      console.log('🎯 Current activeTab before switch:', activeTab);
      setCompetitorAnalysis(analysis);
      console.log('📍 Switching to configuration tab...');
      setActiveTab('configuration');
      console.log('🎯 ActiveTab should now be configuration');
      
      // Force a re-render to debug
      setTimeout(() => {
        console.log('🔄 Checking state after update:');
        console.log('   - competitorAnalysis set?', !!analysis);
        console.log('   - activeTab value:', activeTab);
      }, 100);
    } catch (error) {
      console.error('❌ Error discovering competitors:', error);
      alert('Error discovering competitors: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start monitoring
  const handleStartMonitoring = async () => {
    if (!competitorAnalysis) return;

    setIsMonitoring(true);
    
    try {
      const status = await competitorIntelligenceService.startCompetitorMonitoring(competitorAnalysis);
      setMonitoringStatus(status);
      setActiveTab('monitoring');
    } catch (error) {
      console.error('Error starting monitoring:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      background: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '700',
            color: '#111827'
          }}>
            Competitor Intelligence Platform 🎯
          </h1>
          
          {/* Status Indicator */}
          {competitorAnalysis && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem 1rem',
              background: '#f0f9ff',
              borderRadius: '0.5rem',
              border: '1px solid #bae6fd'
            }}>
              <Target size={16} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '0.875rem', color: '#0284c7', fontWeight: '500' }}>
                {competitorAnalysis.competitors.length} competitors identified
              </span>
            </div>
          )}
        </div>
        
        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          height: '3rem',
          alignItems: 'stretch'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isDisabled = 
              (tab.id === 'configuration' && !competitorAnalysis) ||
              (tab.id === 'monitoring' && !monitoringStatus);
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0 1rem',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                  background: 'transparent',
                  color: isDisabled ? '#d1d5db' : (activeTab === tab.id ? '#6366f1' : '#6b7280'),
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  fontSize: '0.875rem',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto', height: '100%' }}>
        
        {/* Discovery Tab - Using Research Advisor */}
        {activeTab === 'discovery' && (
          <CompetitorResearchAdvisor 
            onCompetitorsIdentified={(data) => {
              console.log('Competitors identified:', data);
              setCompetitorAnalysis({
                organization: data.organization,
                industry: { primary: 'technology', confidence: 0.8 },
                competitors: data.competitors,
                discoveryMethod: 'ai_research',
                confidence: 0.9,
                timestamp: data.timestamp
              });
              setActiveTab('configuration');
            }}
          />
        )}

        {/* Configuration Tab */}
        {activeTab === 'configuration' && competitorAnalysis && (
          <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
                Discovered Competitors
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                I've identified {competitorAnalysis.competitors.length} key competitors for {competitorAnalysis.organization.name}. 
                Each competitor has been configured with intelligent tracking sources and monitoring signals.
              </p>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {competitorAnalysis.competitors.map((competitor, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          {competitor.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: competitor.trackingPriority === 'high' ? '#fef2f2' : '#f0f9ff',
                            color: competitor.trackingPriority === 'high' ? '#dc2626' : '#2563eb',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {competitor.trackingPriority.toUpperCase()} PRIORITY
                          </span>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Threat Level: {competitor.threatLevel}/100
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                          {competitor.size || 'Enterprise'} • {competitor.focus || competitor.description || 'Competitor'}
                        </p>
                      </div>
                    </div>

                    {/* Tracking Sources */}
                    {competitor.trackingSources && competitor.trackingSources.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        Configured Sources ({competitor.trackingSources.length})
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {competitor.trackingSources.map((source, sourceIdx) => (
                          <span key={sourceIdx} style={{
                            padding: '0.25rem 0.75rem',
                            background: source.priority === 'high' ? '#dbeafe' : '#f3f4f6',
                            color: source.priority === 'high' ? '#1d4ed8' : '#4b5563',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Activity size={12} />
                            {source.name} ({source.frequency})
                          </span>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Monitoring Signals */}
                    {competitor.monitoringSignals && (
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                        Tracking Signals
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {competitor.monitoringSignals.critical && competitor.monitoringSignals.critical.slice(0, 3).map((signal, signalIdx) => (
                          <span key={signalIdx} style={{
                            padding: '0.125rem 0.5rem',
                            background: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem'
                          }}>
                            {signal}
                          </span>
                        ))}
                        {competitor.monitoringSignals.important && competitor.monitoringSignals.important.slice(0, 2).map((signal, signalIdx) => (
                          <span key={signalIdx} style={{
                            padding: '0.125rem 0.5rem',
                            background: '#e0e7ff',
                            color: '#3730a3',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem'
                          }}>
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>
                    )}
                    
                    {/* Show reasons if available (from ResearchAdvisor) */}
                    {competitor.reasons && competitor.reasons.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                          Why Track This Competitor
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {competitor.reasons.map((reason, idx) => (
                            <span key={idx} style={{
                              padding: '0.125rem 0.5rem',
                              background: '#f3f4f6',
                              color: '#4b5563',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem'
                            }}>
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                  onClick={handleStartMonitoring}
                  disabled={isMonitoring}
                  style={{
                    padding: '1rem 2rem',
                    background: isMonitoring ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isMonitoring ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    margin: '0 auto'
                  }}
                >
                  {isMonitoring ? (
                    <>
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      Starting Monitoring...
                    </>
                  ) : (
                    <>
                      <Eye size={20} />
                      Start Competitor Monitoring
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Dashboard */}
        {activeTab === 'monitoring' && monitoringStatus && (
          <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.75rem',
              padding: '2rem',
              color: 'white',
              marginBottom: '2rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Competitor Intelligence Dashboard
              </h1>
              <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>
                Real-time monitoring of your competitive landscape
              </p>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Active Agents</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700' }}>{monitoringStatus.activeAgents}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Sources</p>
                  <p style={{ fontSize: '2rem', fontWeight: '700' }}>{monitoringStatus.totalSources}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Status</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                    {monitoringStatus.status === 'monitoring_active' ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <Activity size={64} style={{ color: '#6366f1', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Monitoring System Active
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                Your competitor intelligence agents are now actively monitoring {competitorAnalysis?.competitors.length} competitors 
                across {monitoringStatus.totalSources} sources. Intelligence updates will appear here as they're discovered.
              </p>
              
              <div style={{
                padding: '1rem',
                background: '#f0f9ff',
                borderRadius: '0.5rem',
                border: '1px solid #bae6fd'
              }}>
                <p style={{ color: '#0284c7', fontSize: '0.875rem', margin: 0 }}>
                  💡 <strong>Next:</strong> Intelligence findings will populate automatically as monitoring agents discover competitor activities, 
                  funding news, product launches, and strategic moves.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CompetitorIntelligenceHub;