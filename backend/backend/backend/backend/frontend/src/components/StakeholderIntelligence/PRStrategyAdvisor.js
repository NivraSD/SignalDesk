import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, TrendingUp, AlertTriangle, Users, 
  Newspaper, Building2, Target, Shield, 
  Brain, Zap, Search, Loader, Globe,
  ChevronRight, AlertCircle, Trophy, Eye
} from 'lucide-react';
import { findPreIndexedStakeholder } from './EnhancedSourceDatabase';
import stakeholderIntelligenceService from '../../services/stakeholderIntelligenceService';
import unifiedIntelligenceService from '../../services/unifiedIntelligenceService';

const PRStrategyAdvisor = ({ onStrategyComplete }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [userType, setUserType] = useState(null); // 'brand', 'agency', 'agency-self'
  const [organizationData, setOrganizationData] = useState({});
  const [prObjectives, setPRObjectives] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [showCustomStakeholder, setShowCustomStakeholder] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeConversation();
    }
  }, []);

  const initializeConversation = () => {
    addMessage({
      type: 'ai',
      content: `Welcome to SignalDesk PR Intelligence! 🎯

I'll help you build a comprehensive PR monitoring strategy to identify opportunities and mitigate risks.

First, tell me about your role:`,
      options: [
        { 
          id: 'brand', 
          label: '🏢 Brand/Organization seeking PR', 
          description: 'Monitor media, find PR opportunities, track reputation'
        },
        { 
          id: 'agency', 
          label: '🤝 Agency working for clients', 
          description: 'Track client mentions, competitor campaigns, media opportunities'
        },
        { 
          id: 'agency-self', 
          label: '🚀 Agency advancing own goals', 
          description: 'Win new business, track competitors, build thought leadership'
        }
      ]
    });
  };

  const addMessage = (message) => {
    const newMessage = {
      ...message,
      id: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleUserTypeSelection = (type) => {
    setUserType(type);
    addMessage({
      type: 'user',
      content: type === 'brand' ? 'Brand/Organization' : 
               type === 'agency' ? 'Agency for clients' : 'Agency for ourselves'
    });
    
    setCurrentStep('organization_details');
    
    // Customize next questions based on user type
    if (type === 'brand') {
      addMessage({
        type: 'ai',
        content: "Great! Let's set up PR monitoring for your organization.\n\nWhat's your company name and website?"
      });
    } else if (type === 'agency') {
      addMessage({
        type: 'ai',
        content: "Perfect! Let's configure monitoring for your client.\n\nWhat's your client's company name and their website?"
      });
    } else {
      addMessage({
        type: 'ai',
        content: "Excellent! Let's build your business development intelligence system.\n\nWhat's your agency name and website?"
      });
    }
  };

  const generatePRStakeholders = async (orgData) => {
    const suggestions = [];
    const { company, userType, objectives } = orgData;
    const timestamp = Date.now();
    
    if (userType === 'brand') {
      // BRAND PR STAKEHOLDERS
      
      // Media Outlets
      suggestions.push({
        id: `media-tier1-${timestamp}`,
        name: 'Tier 1 Media Outlets',
        type: 'PR Opportunity',
        priority: 'critical',
        reason: 'Top-tier publications for maximum brand visibility',
        prContext: 'earned_media',
        entities: ['Wall Street Journal', 'New York Times', 'Forbes', 'TechCrunch'],
        monitoringTopics: [
          'reporter requests in your industry',
          'trending stories you can newsjack',
          'journalist queries (HARO)',
          'editorial calendars',
          'breaking news opportunities'
        ]
      });
      
      // Industry Journalists
      suggestions.push({
        id: `journalists-${timestamp}-${suggestions.length}`,
        name: 'Beat Reporters & Journalists',
        type: 'Media Relationships',
        priority: 'critical',
        reason: 'Direct relationships for story placement',
        prContext: 'media_relations',
        monitoringTopics: [
          'recent articles by key journalists',
          'journalist job changes',
          'social media activity',
          'story angles they\'re pursuing',
          'speaking engagements'
        ]
      });
      
      // Competitors
      suggestions.push({
        id: `competitors-${timestamp}-${suggestions.length}`,
        name: 'Competitor PR Activity',
        type: 'Competitive Intelligence',
        priority: 'high',
        reason: 'Track competitor media wins and strategies',
        prContext: 'competitive_analysis',
        monitoringTopics: [
          'competitor press releases',
          'media coverage volume',
          'sentiment analysis',
          'crisis situations',
          'executive quotes and positioning',
          'award wins'
        ]
      });
      
      // Industry Influencers
      suggestions.push({
        id: `influencers-${timestamp}-${suggestions.length}`,
        name: 'Industry Influencers & Thought Leaders',
        type: 'Amplification Partners',
        priority: 'high',
        reason: 'Amplify messages through trusted voices',
        prContext: 'influencer_relations',
        monitoringTopics: [
          'trending topics they discuss',
          'engagement opportunities',
          'collaboration possibilities',
          'speaking events',
          'content partnerships'
        ]
      });
      
      // Crisis Triggers
      suggestions.push({
        id: `crisis-${timestamp}-${suggestions.length}`,
        name: 'Crisis & Risk Monitors',
        type: 'Risk Management',
        priority: 'critical',
        reason: 'Early warning system for PR crises',
        prContext: 'crisis_prevention',
        monitoringTopics: [
          'negative sentiment spikes',
          'customer complaints going viral',
          'regulatory issues in industry',
          'data breach reports',
          'employee whistleblowers',
          'activist campaigns'
        ]
      });
      
    } else if (userType === 'agency') {
      // AGENCY FOR CLIENT STAKEHOLDERS
      
      suggestions.push({
        id: `client-coverage-${timestamp}-${suggestions.length}`,
        name: 'Client Media Coverage',
        type: 'Campaign Tracking',
        priority: 'critical',
        reason: 'Demonstrate PR value to client',
        prContext: 'client_results',
        monitoringTopics: [
          'all client mentions',
          'share of voice vs competitors',
          'message penetration',
          'spokesperson quotes',
          'campaign hashtag performance',
          'earned media value'
        ]
      });
      
      suggestions.push({
        id: `media-targets-${timestamp}-${suggestions.length}`,
        name: 'Target Media for Client',
        type: 'Pitch Opportunities',
        priority: 'critical',
        reason: 'Identify pitch opportunities for client stories',
        prContext: 'media_pitching',
        monitoringTopics: [
          'journalist requests matching client expertise',
          'upcoming features needing sources',
          'editorial calendars',
          'trending topics client can comment on',
          'breaking news response opportunities'
        ]
      });
      
      suggestions.push({
        id: `client-risks-${timestamp}-${suggestions.length}`,
        name: 'Client Reputation Risks',
        type: 'Issues Management',
        priority: 'high',
        reason: 'Protect client from PR crises',
        prContext: 'risk_management',
        monitoringTopics: [
          'negative mentions or sentiment',
          'industry controversies',
          'competitor attacks',
          'regulatory changes affecting client',
          'social media complaints'
        ]
      });
      
    } else if (userType === 'agency-self') {
      // AGENCY SELF-PROMOTION STAKEHOLDERS
      
      suggestions.push({
        id: `prospects-${timestamp}-${suggestions.length}`,
        name: 'High-Value PR Prospects',
        type: 'New Business Targets',
        priority: 'critical',
        reason: 'Companies showing signals they need PR help',
        prContext: 'business_development',
        monitoringTopics: [
          'companies with recent funding',
          'brands in crisis needing help',
          'companies with new CMO/CCO',
          'brands planning product launches',
          'organizations preparing for IPO',
          'companies expanding to new markets'
        ]
      });
      
      suggestions.push({
        id: `competitor-agencies-${timestamp}-${suggestions.length}`,
        name: 'Competing PR Agencies',
        type: 'Competitive Intelligence',
        priority: 'high',
        reason: 'Track competitor wins and positioning',
        prContext: 'competitive_intel',
        entities: ['Edelman', 'Weber Shandwick', 'Ketchum', 'FleishmanHillard'],
        monitoringTopics: [
          'new account wins',
          'client losses (opportunity)',
          'award submissions',
          'case studies published',
          'executive thought leadership',
          'new service offerings'
        ]
      });
      
      suggestions.push({
        id: `industry-media-${timestamp}-${suggestions.length}`,
        name: 'PR Trade Media',
        type: 'Thought Leadership',
        priority: 'medium',
        reason: 'Build agency reputation and credibility',
        prContext: 'thought_leadership',
        entities: ['PR Week', 'PR Daily', 'PRSA', 'Holmes Report'],
        monitoringTopics: [
          'award deadlines',
          'speaking opportunities',
          'expert commentary requests',
          'industry trend pieces',
          'agency ranking reports'
        ]
      });
      
      suggestions.push({
        id: `referral-partners-${timestamp}-${suggestions.length}`,
        name: 'Referral Partners',
        type: 'Partnership Opportunities',
        priority: 'high',
        reason: 'VC firms and consultancies that refer business',
        prContext: 'partnerships',
        entities: ['Sequoia Capital', 'McKinsey', 'Deloitte', 'PwC'],
        monitoringTopics: [
          'portfolio company news',
          'client announcements',
          'partnership opportunities',
          'event collaborations',
          'co-pitching opportunities'
        ]
      });
    }
    
    // Add PR-specific monitoring for all types
    suggestions.forEach(stakeholder => {
      stakeholder.prMetrics = {
        opportunityScore: Math.floor(Math.random() * 30) + 70, // 70-100
        riskLevel: Math.floor(Math.random() * 30), // 0-30
        engagementPotential: Math.floor(Math.random() * 30) + 70, // 70-100
        timelineCriticality: stakeholder.priority === 'critical' ? 'immediate' : 'ongoing'
      };
    });
    
    return suggestions;
  };

  const processOrganizationData = async (data) => {
    setOrganizationData(data);
    setIsTyping(true);
    
    addMessage({
      type: 'ai',
      content: "Analyzing your PR objectives and building a custom monitoring strategy..."
    });
    
    // Initialize unified intelligence service with company data
    const companyData = {
      ...data,
      userType,
      industry: detectIndustry(data),
      competitors: extractCompetitors(data)
    };
    
    await unifiedIntelligenceService.initializeCompany(companyData);
    
    // Get stakeholders from unified service
    const identifiedStakeholders = await unifiedIntelligenceService.identifyStakeholders();
    
    // Generate PR-specific stakeholders (keeping existing logic for now)
    const prStakeholders = await generatePRStakeholders({
      ...data,
      userType
    });
    
    // Merge both sets of stakeholders
    const allStakeholders = [...prStakeholders, ...identifiedStakeholders];
    
    setStakeholders(allStakeholders);
    setIsTyping(false);
    setCurrentStep('review_strategy');
    
    presentPRStrategy(allStakeholders);
  };
  
  const detectIndustry = (data) => {
    const text = `${data.company} ${data.objectives}`.toLowerCase();
    if (text.includes('tech') || text.includes('software')) return 'technology';
    if (text.includes('health') || text.includes('medical')) return 'healthcare';
    if (text.includes('finance') || text.includes('bank')) return 'finance';
    if (text.includes('retail') || text.includes('commerce')) return 'retail';
    return 'general';
  };
  
  const extractCompetitors = (data) => {
    // In production: Extract from objectives or ask user
    // For now, return common competitors based on industry
    const industryCompetitors = {
      'technology': ['Microsoft', 'Google', 'Amazon'],
      'healthcare': ['UnitedHealth', 'Anthem', 'Kaiser'],
      'finance': ['JPMorgan', 'Bank of America', 'Wells Fargo'],
      'retail': ['Amazon', 'Walmart', 'Target']
    };
    
    const industry = detectIndustry(data);
    return industryCompetitors[industry] || [];
  };

  const presentPRStrategy = (stakeholders) => {
    const opportunities = stakeholders.filter(s => s.prContext === 'earned_media' || s.prContext === 'business_development');
    const risks = stakeholders.filter(s => s.prContext === 'crisis_prevention' || s.prContext === 'risk_management');
    
    addMessage({
      type: 'ai',
      content: `Here's your PR Intelligence Strategy:

📈 **Opportunity Monitoring** (${opportunities.length} sources)
${opportunities.map(o => `• ${o.name}: ${o.reason}`).join('\n')}

🛡️ **Risk Monitoring** (${risks.length} sources)
${risks.map(r => `• ${r.name}: ${r.reason}`).join('\n')}

📊 **Key Metrics We'll Track:**
• Media mentions & sentiment
• Share of voice vs competitors
• Journalist engagement rates
• Crisis early warning signals
• PR opportunity alerts

👥 **Plus Traditional Stakeholder Tracking:**
Beyond PR, we'll also monitor specific stakeholders and topics important to your business - investors, partners, regulators, and other key audiences. You'll be able to configure custom sources for each stakeholder group.

Ready to configure your monitoring sources?`
    });
  };

  const finalizePRStrategy = async () => {
    setIsTyping(true);
    
    // Get the current state from unified service
    const currentState = unifiedIntelligenceService.getState();
    
    // Combine PR stakeholders with unified service stakeholders
    const allStakeholders = [...stakeholders];
    
    // Add any additional stakeholders from unified service that aren't duplicates
    currentState.stakeholders.forEach(unifiedStakeholder => {
      if (!allStakeholders.find(s => s.id === unifiedStakeholder.id)) {
        allStakeholders.push(unifiedStakeholder);
      }
    });
    
    console.log('Final stakeholders being passed:', allStakeholders);
    
    try {
      // Configure sources for all stakeholders
      await unifiedIntelligenceService.configureSources();
      
      // Save to backend
      if (organizationData.organizationId) {
        await stakeholderIntelligenceService.saveStakeholderConfiguration(
          organizationData.organizationId,
          allStakeholders
        );
      }
    } catch (error) {
      console.error('Error saving PR configuration:', error);
    }
    
    // Transform ALL stakeholders to work with source configurator
    // Include both PR-specific and unified service stakeholders
    const stakeholderGroups = allStakeholders.map((stakeholder, idx) => ({
      id: stakeholder.id || `stakeholder-${idx}`,
      name: stakeholder.name,
      type: stakeholder.type || 'general',
      priority: stakeholder.priority || 'medium',
      reason: stakeholder.reason || 'Strategic stakeholder',
      prContext: stakeholder.prContext || 'monitoring',
      monitoringTopics: stakeholder.monitoringTopics || stakeholder.topics || [],
      topics: stakeholder.topics || stakeholder.monitoringTopics || [],
      entities: stakeholder.entities || [],
      keywords: stakeholder.keywords || [],
      influence: stakeholder.influence || 7,
      interest: stakeholder.interest || 7,
      sentiment: stakeholder.sentiment || 'neutral',
      currentSentiment: stakeholder.currentSentiment || 5,
      targetSentiment: stakeholder.targetSentiment || 8,
      engagementLevel: stakeholder.engagementLevel || 6,
      trend: stakeholder.trend || 'stable',
      concerns: stakeholder.concerns || [stakeholder.reason],
      goals: stakeholder.goals || '',
      fears: stakeholder.fears || '',
      preIndexed: stakeholder.preIndexed || false,
      sourceCount: stakeholder.sourceCount || 0,
      prMetrics: stakeholder.prMetrics || {
        opportunityScore: 70,
        riskLevel: 20,
        engagementPotential: 75,
        timelineCriticality: 'ongoing'
      }
    }));
    
    console.log('Stakeholder groups being passed to hub:', stakeholderGroups);
    
    const finalStrategy = {
      ...organizationData,
      organizationId: organizationData.organizationId || Date.now(),
      company: organizationData.company,
      url: organizationData.url,
      industry: currentState.companyProfile?.industry || detectIndustry(organizationData),
      userType,
      objectives: organizationData.objectives,
      stakeholders: allStakeholders, // Raw stakeholders
      stakeholderGroups: stakeholderGroups, // Properly formatted for source configurator
      prFocus: true,
      monitoringGoals: {
        opportunities: allStakeholders.filter(s => s.prMetrics && s.prMetrics.opportunityScore > 80).length,
        risks: allStakeholders.filter(s => s.prMetrics && s.prMetrics.riskLevel > 20).length,
        relationships: allStakeholders.filter(s => s.prContext === 'media_relations').length
      },
      sources: currentState.sources || [],
      companyProfile: currentState.companyProfile,
      goals: currentState.goals
    };
    
    setIsTyping(false);
    onStrategyComplete(finalStrategy);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: '#f9fafb'
    }}>
      {/* Chat Interface */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          background: 'white',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Megaphone size={24} style={{ color: '#6366f1' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                PR Strategy Intelligence
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                Configure monitoring for opportunities & risks
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map(message => (
            <div key={message.id} style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '1rem',
                borderRadius: '0.75rem',
                background: message.type === 'user' ? '#6366f1' : 'white',
                color: message.type === 'user' ? 'white' : '#111827',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {message.type === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Brain size={16} style={{ color: '#6366f1' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#6366f1' }}>
                      PR Intelligence Advisor
                    </span>
                  </div>
                )}
                
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                
                {/* User type selection options */}
                {message.options && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {message.options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleUserTypeSelection(option.id)}
                        style={{
                          padding: '0.75rem',
                          background: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#e5e7eb';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {option.label}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
              <Loader size={16} className="animate-spin" />
              <span>Analyzing PR landscape...</span>
            </div>
          )}
        </div>

        {/* Input Area - Show after user type selection */}
        {currentStep === 'organization_details' && (
          <div style={{
            padding: '1rem',
            background: 'white',
            borderTop: '1px solid #e5e7eb'
          }}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              processOrganizationData({
                company: formData.get('company'),
                url: formData.get('url'),
                objectives: formData.get('objectives')
              });
            }}>
              <input
                name="company"
                placeholder={userType === 'agency' ? "Client company name" : "Your company name"}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              />
              <input
                name="url"
                placeholder="Website URL"
                type="url"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              />
              <textarea
                name="objectives"
                placeholder={
                  userType === 'brand' ? "PR objectives (e.g., product launch, thought leadership, crisis preparation)" :
                  userType === 'agency' ? "Client PR objectives and current campaigns" :
                  "Business development goals (e.g., win tech startups, expand to healthcare)"
                }
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Build PR Strategy →
              </button>
            </form>
          </div>
        )}

        {/* Finalize button */}
        {currentStep === 'review_strategy' && (
          <div style={{
            padding: '1rem',
            background: 'white',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setShowCustomStakeholder(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'white',
                color: '#6366f1',
                border: '1px solid #6366f1',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Users size={20} />
              Add Custom Stakeholder to Track
            </button>
            
            {showCustomStakeholder && (
              <div style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <input
                  id="custom-stakeholder-name"
                  placeholder="Stakeholder name (e.g., 'SEC', 'Key Investor', 'Partner Company')"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    marginBottom: '0.5rem'
                  }}
                />
                <input
                  id="custom-stakeholder-topics"
                  placeholder="Topics to monitor (comma separated)"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    marginBottom: '0.5rem'
                  }}
                />
                <button
                  onClick={() => {
                    const name = document.getElementById('custom-stakeholder-name').value;
                    const topics = document.getElementById('custom-stakeholder-topics').value.split(',').map(t => t.trim());
                    
                    if (name) {
                      const customStakeholder = {
                        id: `custom-${Date.now()}`,
                        name,
                        type: 'Custom Stakeholder',
                        priority: 'medium',
                        reason: 'User-defined stakeholder for specific tracking',
                        prContext: 'custom_tracking',
                        monitoringTopics: topics,
                        prMetrics: {
                          opportunityScore: 50,
                          riskLevel: 20,
                          engagementPotential: 60,
                          timelineCriticality: 'ongoing'
                        }
                      };
                      
                      setStakeholders([...stakeholders, customStakeholder]);
                      setShowCustomStakeholder(false);
                      addMessage({
                        type: 'ai',
                        content: `Added "${name}" to your monitoring strategy. This stakeholder will be tracked alongside your PR objectives.`
                      });
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Add Stakeholder
                </button>
              </div>
            )}
            
            <button
              onClick={finalizePRStrategy}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Zap size={20} />
              Activate PR & Stakeholder Monitoring
            </button>
          </div>
        )}
      </div>

      {/* PR Metrics Sidebar */}
      <div style={{
        width: '350px',
        background: 'white',
        borderLeft: '1px solid #e5e7eb',
        padding: '1.5rem',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
          PR Intelligence Metrics
        </h3>
        
        {stakeholders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Opportunity Score */}
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '0.5rem',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Trophy size={16} style={{ color: '#16a34a' }} />
                <span style={{ fontWeight: '500', color: '#166534' }}>PR Opportunities</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
                {stakeholders.filter(s => s.prMetrics && s.prMetrics.opportunityScore > 80).length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                High-value targets identified
              </div>
            </div>

            {/* Risk Alerts */}
            <div style={{
              padding: '1rem',
              background: '#fef2f2',
              borderRadius: '0.5rem',
              border: '1px solid #fecaca'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                <span style={{ fontWeight: '500', color: '#991b1b' }}>Risk Monitors</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                {stakeholders.filter(s => s.prMetrics && s.prMetrics.riskLevel > 20).length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                Active risk tracking points
              </div>
            </div>

            {/* Media Relationships */}
            <div style={{
              padding: '1rem',
              background: '#eff6ff',
              borderRadius: '0.5rem',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Newspaper size={16} style={{ color: '#2563eb' }} />
                <span style={{ fontWeight: '500', color: '#1e40af' }}>Media Targets</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
                {stakeholders.filter(s => s.prContext === 'media_relations' || s.prContext === 'earned_media').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                Media outlets & journalists
              </div>
            </div>

            {/* Coverage Goals */}
            <div style={{
              padding: '1rem',
              background: '#faf5ff',
              borderRadius: '0.5rem',
              border: '1px solid #e9d5ff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Target size={16} style={{ color: '#9333ea' }} />
                <span style={{ fontWeight: '500', color: '#6b21a8' }}>Coverage Goals</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#6b21a8' }}>
                <li>Tier 1 media placements</li>
                <li>Share of voice leadership</li>
                <li>Crisis prevention</li>
                <li>Thought leadership</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRStrategyAdvisor;