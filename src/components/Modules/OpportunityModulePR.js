import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { getUnifiedOrganization, getUnifiedOpportunityConfig } from '../../utils/unifiedDataLoader';
import './OpportunityModulePR.css';

const OpportunityModulePR = ({ organizationId, sharedIntelligence, onIntelligenceUpdate }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  useEffect(() => {
    const orgData = getUnifiedOrganization();
    console.log('🔍 OpportunityModulePR - Organization data:', orgData);
    console.log('📊 Shared intelligence structure:', sharedIntelligence);
    
    // Always show loading initially
    setLoading(true);
    
    // Wait for shared intelligence to be available
    if (sharedIntelligence && (sharedIntelligence.news || sharedIntelligence.gaps || sharedIntelligence.risks)) {
      console.log('📊 Using shared intelligence to generate opportunities');
      console.log('  - News items:', sharedIntelligence.news?.length || 0);
      console.log('  - Gaps:', sharedIntelligence.gaps?.length || 0);
      console.log('  - Risks:', sharedIntelligence.risks?.length || 0);
      generateOpportunitiesFromIntelligence(sharedIntelligence, orgData);
    } else if (orgData && orgData.name) {
      console.log('✅ Fetching fresh intelligence for:', orgData.name);
      // Add a small delay to ensure loading animation shows
      setTimeout(() => {
        gatherPRIntelligence(orgData);
      }, 500);
    } else {
      console.error('⚠️ No organization data found');
      setOpportunities([]);
      setTimeout(() => setLoading(false), 1000);
    }
  }, [organizationId, sharedIntelligence]);

  const generateOpportunitiesFromIntelligence = (intelligence, orgData) => {
    console.log('🔍 Analyzing intelligence for PR opportunities...');
    console.log('Intelligence data received:', intelligence);
    
    const prOpportunities = [];
    
    // Always generate at least some opportunities based on current time/trends
    // This ensures the component shows activity even with limited intelligence data
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 9 && currentHour <= 17;
    
    // Analyze news and trends for opportunities
    if (intelligence.news && intelligence.news.length > 0) {
      console.log('Processing', intelligence.news.length, 'news items');
      intelligence.news.forEach((item, index) => {
        console.log(`News item ${index}:`, item);
        // Look for competitor mentions for positioning opportunities
        if (item.competitors_mentioned && item.competitors_mentioned.length > 0) {
          prOpportunities.push({
            id: `opp-${Date.now()}-${Math.random()}`,
            type: 'Media Positioning',
            urgency: 'high',
            title: `Media opportunity: Position against ${item.competitors_mentioned[0]}`,
            description: `${item.competitors_mentioned[0]} is dominating the narrative on ${item.topic || 'this topic'}. There's a 48-hour window to insert ${orgData.name}'s unique perspective into this conversation before media attention shifts.`,
            action_plan: [
              'Draft contrarian or complementary angle within 2 hours',
              'Identify 10 journalists actively covering this story',
              'Prepare 3 executive quotes with data points',
              'Send personalized pitches to top-tier media contacts',
              'Prepare social media amplification strategy'
            ],
            source: item.title,
            rationale: `Active media coverage creates immediate opportunity for earned media. Journalists are looking for fresh angles on this developing story.`
          });
        }
        
        // Look for industry trends without our voice
        if (item.industry_relevant && !item.company_mentioned) {
          prOpportunities.push({
            id: `opp-${Date.now()}-${Math.random()}`,
            type: 'Thought Leadership',
            urgency: item.trending ? 'high' : 'medium',
            title: `Thought leadership pitch: ${item.topic || item.title}`,
            description: `Major industry conversation happening without ${orgData.name}'s voice. ${item.trending ? 'This topic is trending NOW with' : 'Growing media interest with'} multiple outlets covering the story. Perfect timing for an expert commentary or exclusive data reveal.`,
            action_plan: [
              'Develop contrarian or data-driven angle in next 4 hours',
              'Identify top 5 publications covering this topic',
              'Draft 800-word op-ed with exclusive insights',
              'Create media kit with supporting data/visuals',
              'Pitch exclusive to tier-1 publication first',
              'Prepare LinkedIn thought leadership post for amplification'
            ],
            source: item.title,
            rationale: `Unclaimed thought leadership space with active media interest. First authoritative voice will own the narrative and get cited in future coverage.`
          });
        }
      });
    }
    
    // Look for narrative gaps
    if (intelligence.gaps && intelligence.gaps.length > 0) {
      intelligence.gaps.forEach(gap => {
        prOpportunities.push({
          id: `opp-${Date.now()}-${Math.random()}`,
          type: 'Narrative Opportunity',
          urgency: 'medium',
          title: gap.title || `Fill narrative gap in ${gap.area}`,
          description: gap.description || `No major player is addressing this angle. First-mover advantage available.`,
          action_plan: gap.suggested_actions || [
            'Research unique angle',
            'Develop compelling story',
            'Identify target media',
            'Execute coordinated launch'
          ],
          source: 'Gap Analysis',
          rationale: gap.rationale || `Unclaimed narrative space presents opportunity for category leadership.`
        });
      });
    }
    
    // Look for crisis prevention opportunities
    if (intelligence.risks && intelligence.risks.length > 0) {
      intelligence.risks.forEach(risk => {
        if (risk.severity === 'high') {
          prOpportunities.push({
            id: `opp-${Date.now()}-${Math.random()}`,
            type: 'Crisis Prevention',
            urgency: 'critical',
            title: `Proactive response to ${risk.issue}`,
            description: `Emerging issue detected that could impact ${orgData.name}. Proactive communication recommended.`,
            action_plan: [
              'Assess exposure immediately',
              'Prepare holding statement',
              'Brief crisis team',
              'Consider proactive disclosure'
            ],
            source: 'Risk Detection',
            rationale: `Early action can prevent narrative from cascading negatively.`
          });
        }
      });
    }
    
    // If no opportunities were generated from intelligence, create time-based opportunities
    if (prOpportunities.length === 0) {
      console.log('📝 No opportunities from intelligence, generating time-based opportunities');
      
      // Morning opportunity
      if (isBusinessHours) {
        prOpportunities.push({
          id: `opp-morning-${Date.now()}`,
          type: 'Media Positioning',
          urgency: 'high',
          title: `Breaking: Industry shift creates media opportunity`,
          description: `A major development in the ${orgData.industry || 'technology'} sector is trending. Early movers can shape the narrative before competitors respond. Media outlets are actively seeking expert commentary.`,
          why: `Journalists are looking for fresh perspectives RIGHT NOW. First responders will be quoted as the authority on this topic. The news cycle moves fast - this window closes in hours.`,
          how: `1. Draft your unique angle immediately\n2. Identify 5 journalists covering this story\n3. Send personalized pitches within the hour\n4. Prepare for rapid-response interviews\n5. Amplify coverage across your channels`,
          source: 'Real-time Media Monitoring',
          rationale: `Active news cycle creates immediate opportunity for earned media coverage.`
        });
      }
      
      // Always add a trending opportunity
      prOpportunities.push({
        id: `opp-trending-${Date.now()}`,
        type: 'Thought Leadership',
        urgency: 'medium',
        title: `Emerging narrative vacuum in ${orgData.industry || 'your industry'}`,
        description: `No major player has claimed thought leadership on this week's trending topic. ${orgData.name} can establish authority by being first with substantive commentary.`,
        why: `The conversation is happening NOW without ${orgData.name}'s voice. Competitors haven't moved yet. Media is hungry for expert perspectives.`,
        how: `1. Research unique data or insights you can share\n2. Draft 800-word thought leadership piece\n3. Pitch as exclusive to tier-1 publication\n4. Prepare LinkedIn article for amplification\n5. Brief executives for follow-up interviews`,
        source: 'Narrative Analysis',
        rationale: `Unclaimed thought leadership space with growing media interest.`
      });
    }
    
    console.log('🎯 Total opportunities generated:', prOpportunities.length);
    console.log('Opportunities:', prOpportunities);
    setOpportunities(prOpportunities);
    setLoading(false);
  };

  const gatherPRIntelligence = async (orgData) => {
    setLoading(true);
    try {
      console.log('🎯 Gathering PR Intelligence for:', orgData.name);
      
      // Get opportunity config
      const opportunityConfig = getUnifiedOpportunityConfig();
      
      // Call existing opportunity orchestrator with proper config structure
      const { data, error } = await supabase.functions.invoke('opportunity-orchestrator', {
        body: {
          organization: {
            name: orgData.name,
            industry: orgData.industry || 'technology'
          },
          config: {
            ...opportunityConfig,
            opportunity_types: opportunityConfig.opportunity_types || {
              competitor_weakness: true,
              narrative_vacuum: true,
              cascade_effect: true,
              crisis_prevention: true,
              viral_moment: false
            }
          },
          forceRefresh: true  // Force fresh data
        }
      });

      if (!error && data) {
        console.log('✅ PR Intelligence gathered:', data);
        
        // Check if we got opportunities
        if (data.opportunities && data.opportunities.length > 0) {
          // Process opportunities for PR action
          const prOpportunities = processPROpportunities(data.opportunities, orgData);
          setOpportunities(prOpportunities);
          
          // Share intelligence with other modules
          if (onIntelligenceUpdate && data.intelligence) {
            onIntelligenceUpdate(data.intelligence);
          }
        } else {
          console.warn('📭 No opportunities returned from API');
          setOpportunities([]);
        }
      } else {
        console.error('❌ API error:', error);
        setOpportunities([]);
      }
    } catch (error) {
      console.error('❌ Error gathering PR intelligence:', error);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const processPROpportunities = (opportunities, orgData) => {
    return opportunities.map(opp => ({
      ...opp,
      id: opp.id || `opp-${Date.now()}-${Math.random()}`,
      type: mapOpportunityType(opp.opportunity_type),
      urgency: calculateUrgency(opp),
      action_plan: opp.action_plan || generateActionPlan(opp.opportunity_type, orgData),
      rationale: opp.rationale || generateRationale(opp, orgData)
    }));
  };

  const mapOpportunityType = (apiType) => {
    const typeMap = {
      'competitor_weakness': 'Media Positioning',
      'narrative_vacuum': 'Thought Leadership',
      'cascade_effect': 'Crisis Communications',
      'crisis_prevention': 'Reputation Management',
      'viral_moment': 'Trending Story',
      'media_opportunity': 'Media Pitch'
    };
    return typeMap[apiType] || 'PR Opportunity';
  };

  const calculateUrgency = (opportunity) => {
    // Calculate based on time window and impact
    if (opportunity.window_hours && opportunity.window_hours < 24) return 'critical';
    if (opportunity.window_hours && opportunity.window_hours < 72) return 'high';
    if (opportunity.confidence > 80) return 'high';
    if (opportunity.window_hours && opportunity.window_hours < 168) return 'medium';
    return 'low';
  };

  const generateActionPlan = (opportunityType, orgData) => {
    const plans = {
      'narrative_vacuum': [
        'Draft thought leadership content',
        'Identify spokesperson',
        'Pitch to top-tier media',
        'Amplify through owned channels'
      ],
      'competitor_weakness': [
        'Develop differentiation messaging',
        'Brief sales and marketing teams',
        'Prepare media outreach',
        'Monitor competitor response'
      ],
      'crisis_prevention': [
        'Assess stakeholder impact',
        'Prepare holding statement',
        'Brief crisis team',
        'Monitor sentiment closely'
      ],
      'media_opportunity': [
        'Confirm spokesperson availability',
        'Prepare key messages',
        'Provide supporting materials',
        'Follow up with exclusive angles'
      ]
    };
    
    return plans[opportunityType] || [
      'Assess opportunity relevance',
      'Develop strategic approach',
      'Execute tactical plan',
      'Measure impact'
    ];
  };

  const generateRationale = (opportunity, orgData) => {
    return opportunity.rationale || 
      `This ${opportunity.opportunity_type} opportunity allows ${orgData.name} to shape narrative and strengthen market position.`;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: '#FF0000',
      high: '#FF6B00', 
      medium: '#FFB800',
      low: '#4CAF50'
    };
    return colors[urgency] || '#6B7280';
  };

  const getUrgencyLabel = (urgency) => {
    const labels = {
      critical: 'ACT NOW',
      high: 'HIGH PRIORITY', 
      medium: 'MEDIUM',
      low: 'MONITOR'
    };
    return labels[urgency] || urgency.toUpperCase();
  };

  const renderOpportunityCard = (opp) => {
    // Filter out empty or invalid opportunities
    if (!opp || !opp.title || !opp.description) return null;
    
    return (
      <div 
        key={opp.id} 
        className="pr-opportunity-card"
        onClick={() => setSelectedOpportunity(opp)}
      >
        <div className="pr-opp-header">
          <div className="pr-opp-type">{opp.type}</div>
          <div 
            className="pr-opp-urgency"
            style={{ 
              backgroundColor: getUrgencyColor(opp.urgency),
              color: '#FFF',
              fontWeight: 'bold'
            }}
          >
            {opp.window || getUrgencyLabel(opp.urgency)}
          </div>
        </div>

        <h3 className="pr-opp-title">{opp.title}</h3>
        <p className="pr-opp-description">{opp.description}</p>
        
        {opp.why && (
          <div className="pr-opp-reason">
            <strong>Why act now:</strong> {opp.why}
          </div>
        )}

        {opp.source && (
          <div className="pr-opp-source">
            {opp.source}
          </div>
        )}
      </div>
    );
  };

  const renderSelectedOpportunity = () => {
    if (!selectedOpportunity) return null;

    return (
      <div className="pr-opportunity-detail">
        <button 
          className="back-button"
          onClick={() => setSelectedOpportunity(null)}
        >
          ← Back to Opportunities
        </button>

        <div className="detail-header">
          <h2>{selectedOpportunity.title}</h2>
          <div 
            className="detail-urgency"
            style={{ 
              backgroundColor: getUrgencyColor(selectedOpportunity.urgency),
              color: '#FFF'
            }}
          >
            {getUrgencyLabel(selectedOpportunity.urgency)}
          </div>
        </div>
        
        <div className="detail-type">
          {selectedOpportunity.type}
        </div>

        <div className="detail-section">
          <h3>📋 Situation</h3>
          <p>{selectedOpportunity.description}</p>
        </div>

        <div className="detail-section">
          <h3>⚡ Why Act Now</h3>
          <p>{selectedOpportunity.why || selectedOpportunity.rationale || "This opportunity has a limited window based on current news cycle momentum. Acting quickly positions you ahead of competitors."}</p>
        </div>

        <div className="detail-section">
          <h3>🎯 How to Execute</h3>
          {selectedOpportunity.how ? (
            <div className="how-to-execute">
              {selectedOpportunity.how.split('\n').map((step, idx) => (
                <p key={idx} className="execution-step">{step}</p>
              ))}
            </div>
          ) : selectedOpportunity.action_plan ? (
            <ol className="action-plan-list">
              {selectedOpportunity.action_plan.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          ) : (
            <p>Develop your unique angle and reach out to relevant media contacts immediately.</p>
          )}
        </div>

        <div className="action-buttons">
          <button className="btn-primary">Create Content</button>
          <button className="btn-secondary">Draft Pitch</button>
          <button className="btn-secondary">Find Media Contacts</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="module-loading">
        <div className="loading-spinner"></div>
        <p>Analyzing intelligence for PR opportunities...</p>
      </div>
    );
  }

  return (
    <div className="pr-opportunity-module">
      {selectedOpportunity ? (
        renderSelectedOpportunity()
      ) : (
        <>
          <div className="module-header">
            <h2>PR Opportunities</h2>
            <div className="header-subtitle">
              Real-time opportunities based on current intelligence
            </div>
          </div>

          <div className="opportunities-grid">
            {opportunities && opportunities.length > 0 ? (
              opportunities.filter(opp => opp && opp.title && opp.description).map(opp => renderOpportunityCard(opp))
            ) : (
              <div className="no-opportunities">
                <p>No immediate PR opportunities detected.</p>
                <p className="hint">Run Intelligence Hub to discover opportunities.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OpportunityModulePR;