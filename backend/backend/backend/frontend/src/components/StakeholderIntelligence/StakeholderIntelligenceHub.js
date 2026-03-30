import React, { useState, useEffect } from 'react';
import { Brain, Users, Activity, BarChart3, Target, Network, Bot, Settings, CheckCircle, AlertCircle, TrendingUp, Plus, X, Zap, Sparkles, Megaphone, Shield, Lightbulb, Building2 } from 'lucide-react';
import EnhancedAIStrategyAdvisor from './EnhancedAIStrategyAdvisor';
import PRStrategyAdvisor from './PRStrategyAdvisor';
import PRMonitoringDashboard from './PRMonitoringDashboard';
import OpportunityDiscoveryDashboard from '../OpportunityDiscovery/OpportunityDiscoveryDashboard';
import AgenticMonitoring from './AgenticMonitoring';
import StakeholderAIAdvisor from './StakeholderAIAdvisor';
import IntelligenceConfiguration from '../Intelligence/IntelligenceConfiguration';
import IntelligenceSummaryDashboard from '../Intelligence/IntelligenceSummaryDashboard';
import OpportunityDetection from '../Intelligence/OpportunityDetection';
import apiService from '../../services/apiService';
import { useIntelligence } from '../../context/IntelligenceContext';
// Using new backend-integrated Intelligence Dashboard

const StakeholderIntelligenceHub = () => {
  console.log('🚨🚨🚨 STAKEHOLDER HUB LOADED - VERSION 2.0 🚨🚨🚨');
  
  // Get context
  const { organizationData, updateOrganizationData } = useIntelligence();
  
  const [activeTab, setActiveTab] = useState('monitoring'); // Start with configuration
  const [isPRMode, setIsPRMode] = useState(true); // Default to PR mode
  const [stakeholderStrategy, setStakeholderStrategy] = useState(organizationData.strategy);
  const [intelligenceFindings, setIntelligenceFindings] = useState([]);
  const [customSources, setCustomSources] = useState([]);
  const [priorityStakeholders, setPriorityStakeholders] = useState([]);
  const [showAddStakeholder, setShowAddStakeholder] = useState(false);
  const [newStakeholderName, setNewStakeholderName] = useState('');
  const [newStakeholderDescription, setNewStakeholderDescription] = useState('');
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [organizationId, setOrganizationId] = useState(organizationData.id || 'demo-org-id'); // Use context or default

  // Debug stakeholder strategy changes
  useEffect(() => {
    console.log('StakeholderStrategy changed:', stakeholderStrategy);
    if (stakeholderStrategy && stakeholderStrategy.stakeholderGroups) {
      console.log('Stakeholder groups:', stakeholderStrategy.stakeholderGroups);
    }
  }, [stakeholderStrategy]);

  const handleStrategyComplete = async (data) => {
    console.log('Strategy completed:', data);
    console.log('Stakeholder groups received:', data.stakeholderGroups);
    console.log('Number of stakeholder groups:', data.stakeholderGroups?.length);
    
    // Set organization ID immediately so dashboard can use it
    const orgId = data.organizationId || `org-${Date.now()}`;
    setOrganizationId(orgId);
    console.log('Organization ID set to:', orgId);
    
    // Update context with organization data
    updateOrganizationData({
      id: orgId,
      name: data.company,
      targets: data.stakeholders || [],
      strategy: data
    });
    
    // Create targets in backend for the stakeholders
    if (data.stakeholders && data.stakeholders.length > 0 && orgId) {
      try {
        const targetPromises = data.stakeholders.map(stakeholder => {
          const targetData = {
            organization_id: orgId,
            name: stakeholder.name,
            type: stakeholder.type === 'competitor' ? 'competitor' : 'topic',
            priority: stakeholder.priority || 'medium',
            keywords: stakeholder.keywords || [],
            topics: stakeholder.topics || stakeholder.monitoringTopics || [],
            sources: Array.isArray(stakeholder.sources) ? stakeholder.sources : [],
            description: stakeholder.reason || `Monitor ${stakeholder.name}`,
            active: true
          };
          
          return apiService.createTarget(targetData);
        });
        
        const createdTargets = await Promise.all(targetPromises);
        console.log('Created targets in backend:', createdTargets);
        
        // Create individual stakeholder groups for each competitor and topic
        const stakeholderGroups = [];
        
        // Process each stakeholder - they already come as individual items
        console.log('🔍 Processing stakeholders:', data.stakeholders);
        data.stakeholders.forEach((stakeholder, idx) => {
          console.log('🔍 Stakeholder:', stakeholder);
          // Each stakeholder already represents a single competitor or topic
          stakeholderGroups.push({
            id: stakeholder.id || `${stakeholder.type}-${idx}`,
            name: stakeholder.name,
            type: stakeholder.type,
            influence: stakeholder.influence || (stakeholder.priority === 'high' ? 9 : stakeholder.priority === 'medium' ? 7 : 5),
            interest: stakeholder.priority === 'high' ? 9 : stakeholder.priority === 'medium' ? 7 : 5,
            keywords: stakeholder.keywords || [stakeholder.name.toLowerCase()],
            topics: stakeholder.topics || stakeholder.monitoringTopics || [],
            preIndexed: stakeholder.preIndexed || false,
            sourceCount: stakeholder.sourceCount || 0
          });
        });
        
        // Set stakeholder strategy for source configuration
        const monitoringStrategy = {
          organizationId: orgId,
          company: data.company,
          stakeholderGroups: stakeholderGroups,
          stakeholders: data.stakeholders
        };
        
        setStakeholderStrategy(monitoringStrategy);
        console.log('🎯 Set stakeholder strategy with', stakeholderGroups.length, 'individual items');
        console.log('🎯 Individual targets created:');
        stakeholderGroups.forEach(g => console.log(`  - ${g.type}: ${g.name}`));
        console.log('🎯 Full strategy:', monitoringStrategy);
        
        // Navigate to monitoring tab after setting strategy
        setTimeout(() => {
          setActiveTab('monitoring');
          console.log('🎯 Navigated to monitoring tab');
        }, 100);
      } catch (error) {
        console.error('Error creating targets:', error);
      }
    }
    
    // Check if this is from PR Strategy Advisor
    if (data.prFocus) {
      // Handle PR-specific strategy
      // orgId already set above
      const monitoringStrategy = {
        ...data,
        organizationId: orgId,
        profile: {
          company: data.company,
          industry: data.industry || 'PR/Communications',
          businessModel: data.userType === 'brand' ? 'Brand' : 'Agency',
          keyCompetitors: data.competitors || [],
          keyRisks: [],
          opportunities: [],
          overview: data.objectives || ''
        },
        stakeholderGroups: data.stakeholderGroups, // Use the properly formatted stakeholder groups
        stakeholders: data.stakeholders, // Keep raw stakeholders too
        industry: data.industry || 'PR/Communications',
        companyProfile: data.companyProfile,
        goals: data.goals,
        sources: data.sources || []
      };
      
      console.log('Setting stakeholder strategy with', monitoringStrategy.stakeholderGroups?.length, 'groups');
      setStakeholderStrategy(monitoringStrategy);
      
      // Set priority stakeholders for tracking - include ALL stakeholders
      if (data.stakeholderGroups && data.stakeholderGroups.length > 0) {
        const allStakeholders = data.stakeholderGroups.map(s => String(s.id || s.name));
        console.log('Setting priority stakeholders:', allStakeholders);
        setPriorityStakeholders(allStakeholders);
      }
      
      setActiveTab('monitoring'); // Go to source configuration
      return;
    }
    
    // Original handling for general strategy
    const stakeholderGroups = data.stakeholders.map((stakeholder, idx) => ({
      id: stakeholder.id || `stakeholder-${idx}`,
      name: stakeholder.name,
      type: stakeholder.type,
      influence: stakeholder.influence || (stakeholder.priority === 'high' ? 9 : stakeholder.priority === 'medium' ? 7 : 5),
      interest: stakeholder.priority === 'high' ? 9 : stakeholder.priority === 'medium' ? 7 : 5,
      sentiment: 'neutral',
      currentSentiment: 5,
      targetSentiment: 8,
      engagementLevel: 6,
      trend: 'stable',
      concerns: [stakeholder.reason],
      influencers: [],
      keywords: stakeholder.keywords || [],
      topics: stakeholder.topics || stakeholder.monitoringTopics || [],
      goals: stakeholder.goals || '',
      fears: stakeholder.fears || '',
      preIndexed: stakeholder.preIndexed || false,
      sourceCount: stakeholder.sourceCount || 0
    }));
    
    // Extract all keywords from stakeholders
    const allKeywords = data.stakeholders.reduce((keywords, stakeholder) => {
      return [...keywords, ...(stakeholder.keywords || [])];
    }, [data.company]);
    
    // Remove duplicates
    const uniqueKeywords = [...new Set(allKeywords)];
    
    console.log('Extracted keywords:', uniqueKeywords);
    
    // Organization ID already set above
    
    // Transform into monitoring strategy
    const monitoringStrategy = {
      organizationId: orgId,
      profile: {
        company: data.company,
        industry: data.industry,
        businessModel: 'B2B/B2C',
        keyCompetitors: [],
        keyRisks: [],
        opportunities: [],
        overview: data.overview
      },
      strategy: {
        keywords: uniqueKeywords,
        sources: {
          rss: [
            'https://techcrunch.com/feed/',
            'https://www.theverge.com/rss/index.xml',
            'https://feeds.feedburner.com/venturebeat/SZYF',
            'https://www.prnewswire.com/rss/news-releases-list.rss'
          ],
          categories: ['business', 'technology', 'press-releases']
        },
        alertThresholds: {
          sentiment: 'negative',
          volume: 10,
          urgency: 'high'
        },
        reviewFrequency: 'Daily'
      },
      stakeholderGroups: stakeholderGroups,
      aiStrategy: null,
      timeframe: '6 months',
      resources: 'moderate',
      enhancedFeatures: data.enhancedFeatures || {
        preIndexedCount: stakeholderGroups.filter(s => s.preIndexed).length,
        totalSources: stakeholderGroups.reduce((acc, s) => acc + s.sourceCount, 0),
        researchAgentsEnabled: true
      }
    };

    console.log('Created monitoring strategy:', monitoringStrategy);
    console.log('Stakeholder groups in strategy:', monitoringStrategy.stakeholderGroups);
    setStakeholderStrategy(monitoringStrategy);
    // Initialize with all selected stakeholders - ensure they are strings
    const allStakeholders = stakeholderGroups.map(s => {
      const id = String(s.id || s.name);
      console.log(`Stakeholder ${s.name} will have ID: ${id}`);
      return id;
    });
    console.log('Setting all selected stakeholders:', allStakeholders);
    setPriorityStakeholders(allStakeholders);
    // Tab navigation happens after strategy is set
  };

  const tabs = [
    { id: 'monitoring', name: 'Intelligence Configuration', icon: Settings },
    { id: 'dashboard', name: 'Intelligence Summary', icon: BarChart3 },
    { id: 'detection', name: 'Opportunity Detection', icon: Zap }
  ];

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      background: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header with Tabs */}
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
          height: '5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
            }}>
              <Zap size={28} style={{ color: 'white' }} />
            </div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2rem', 
              fontWeight: '800',
              color: '#111827',
              letterSpacing: '-0.025em'
            }}>
              Opportunity Engine
            </h1>
          </div>
          
          {/* Strategic Health Score - Mini Version */}
          {stakeholderStrategy && stakeholderStrategy.stakeholderGroups && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem 1rem',
              background: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Strategic Health
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `conic-gradient(#6366f1 0deg, #6366f1 ${(stakeholderStrategy.stakeholderGroups ? 
                  Math.round(
                    stakeholderStrategy.stakeholderGroups.reduce((acc, s) => 
                      acc + (s.currentSentiment / s.targetSentiment) * 100, 0
                    ) / stakeholderStrategy.stakeholderGroups.length
                  ) : 0) * 3.6}deg, #e5e7eb ${(stakeholderStrategy.stakeholderGroups ? 
                  Math.round(
                    stakeholderStrategy.stakeholderGroups.reduce((acc, s) => 
                      acc + (s.currentSentiment / s.targetSentiment) * 100, 0
                    ) / stakeholderStrategy.stakeholderGroups.length
                  ) : 0) * 3.6}deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#111827'
                }}>
                  {stakeholderStrategy.stakeholderGroups ? 
                    Math.round(
                      stakeholderStrategy.stakeholderGroups.reduce((acc, s) => 
                        acc + (s.currentSentiment / s.targetSentiment) * 100, 0
                      ) / stakeholderStrategy.stakeholderGroups.length
                    ) : 0}%
                </div>
              </div>
              <div style={{ fontSize: '0.625rem', color: '#6b7280' }}>
                <div>{stakeholderStrategy.stakeholderGroups?.filter(s => s.currentSentiment >= 7).length || 0} positive</div>
                <div>{stakeholderStrategy.stakeholderGroups?.filter(s => s.currentSentiment < 5).length || 0} need work</div>
              </div>
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
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0 1rem',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                  background: 'transparent',
                  color: activeTab === tab.id ? '#6366f1' : '#6b7280',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#4b5563';
                    e.currentTarget.style.borderBottomColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.borderBottomColor = 'transparent';
                  }
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
        
        {/* Opportunity Discovery - Manual Mode */}
        {activeTab === 'discovery' && (
          <OpportunityDiscoveryDashboard 
            client={stakeholderStrategy?.companyProfile || stakeholderStrategy?.profile || {
              company: stakeholderStrategy?.company || 'Your Company',
              industry: stakeholderStrategy?.industry || 'technology',
              expertiseAreas: stakeholderStrategy?.companyProfile?.expertiseAreas || { 'AI': 0.8, 'cloud': 0.7, 'security': 0.6 },
              competitors: stakeholderStrategy?.companyProfile?.competitors || ['Microsoft', 'Google', 'Amazon'],
              userType: stakeholderStrategy?.userType,
              objectives: stakeholderStrategy?.objectives,
              goals: stakeholderStrategy?.goals
            }}
            onOpportunitySelect={(opportunity) => {
              console.log('Opportunity selected:', opportunity);
              // Could transition to PR strategy or content creation
              setActiveTab('pr-strategy');
            }}
          />
        )}
        
        {/* PR Mode Components */}
        {activeTab === 'pr-strategy' && (
          <PRStrategyAdvisor onStrategyComplete={handleStrategyComplete} />
        )}
        
        {activeTab === 'pr-monitoring' && (
          <PRMonitoringDashboard strategy={stakeholderStrategy} />
        )}
        
        
        {/* Intelligence Dashboard - 24hr News Summary */}
        {activeTab === 'dashboard' && organizationId && (
          <IntelligenceSummaryDashboard 
            organizationId={organizationId}
            organizationName={organizationData.name || stakeholderStrategy?.company || "Your Organization"}
            key={organizationId} // Force re-render when org ID changes
          />
        )}
        {activeTab === 'dashboard' && !organizationId && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>Please complete the Intelligence Targets setup first to configure monitoring.</p>
          </div>
        )}

        {/* Opportunity Detection - Real-time Signal Monitoring */}
        {activeTab === 'detection' && organizationId && (
          <OpportunityDetection 
            organizationId={organizationId}
            organizationName={organizationData.name || stakeholderStrategy?.company || "Your Organization"}
            key={organizationId} // Force re-render when org ID changes
          />
        )}
        {activeTab === 'detection' && !organizationId && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>Please complete the Intelligence Targets setup first to access Opportunity Detection.</p>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <IntelligenceConfiguration 
            stakeholderStrategy={stakeholderStrategy}
            onSourcesUpdate={(sources) => setCustomSources(sources)}
            organizationId={organizationId}
            onSetupComplete={handleStrategyComplete}
          />
        )}



      </div>
    </div>
  );
};

export default StakeholderIntelligenceHub;