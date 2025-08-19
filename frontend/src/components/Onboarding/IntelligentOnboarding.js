import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './IntelligentOnboarding.css';

// MCP-Driven Intelligent Onboarding
// Uses real MCPs to discover WHO and WHAT to monitor

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

const IntelligentOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [discoveredProfile, setDiscoveredProfile] = useState(null);
  const [mcpRecommendations, setMcpRecommendations] = useState(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Organization Info (Minimal - MCPs will discover the rest)
    organization: {
      name: '',
      website: '', // Primary input - MCPs will analyze this
      description: '', // Brief description to help MCPs
    },
    
    // Step 2: MCP-Discovered Profile (Auto-populated)
    profile: {
      industry: '',
      size: '',
      competitors: [],
      stakeholders: [],
      topics: [],
      events: [],
      journalists: [],
      influencers: [],
      regulatoryBodies: [],
      narratives: [],
    },
    
    // Step 3: Monitoring Configuration (Based on MCP recommendations)
    monitoring: {
      // WHO to monitor (discovered by MCPs)
      whoToMonitor: {
        competitors: [],         // From intelligence MCP
        journalists: [],         // From media MCP
        influencers: [],        // From social MCP
        investors: [],          // From stakeholder-groups MCP
        regulators: [],         // From regulatory MCP
        partners: [],           // From relationships MCP
        customers: [],          // From analytics MCP
        employees: [],          // From monitor MCP
      },
      
      // WHAT to monitor (discovered by MCPs)
      whatToMonitor: {
        industryTrends: [],     // From intelligence MCP
        competitorMoves: [],    // From intelligence MCP
        marketOpportunities: [], // From opportunities MCP
        narrativeVacuums: [],   // From narratives MCP
        crisisSignals: [],      // From crisis MCP
        regulatoryChanges: [],  // From regulatory MCP
        events: [],             // From opportunities MCP (speaking, conferences, etc.)
        mediaRequests: [],      // From media MCP (HARO, journalist queries)
        socialTrends: [],       // From social MCP
        cascadeEvents: [],      // From scraper MCP
      },
      
      // Monitoring priorities (set by user based on MCP recommendations)
      priorities: {
        realTimeAlerts: true,
        competitiveIntel: true,
        opportunityDetection: true,
        crisisMonitoring: true,
        narrativeTracking: true,
        eventTracking: true,
        regulatoryTracking: false,
        socialMonitoring: true,
      }
    },
    
    // Step 4: Goals & Objectives (Enhanced with MCP insights)
    goals: {
      primary: '', // e.g., "thought_leadership", "crisis_prevention", "market_expansion"
      secondary: [],
      kpis: [],
      timeline: '3_months', // 1_month, 3_months, 6_months, 1_year
    }
  });

  // Call MCPs to analyze organization when website is entered
  const analyzeOrganization = async () => {
    if (!formData.organization.website || !formData.organization.name) return;
    
    setIsAnalyzing(true);
    try {
      // Step 1: Use Scraper MCP to analyze website and get real data
      const scraperData = await callMCP('scraper', 'scrape', {
        url: formData.organization.website
      });
      
      // Step 2: Use Intelligence MCP to discover competitors from GitHub
      const competitorData = await callMCP('intelligence', 'gather', {
        organization: {
          name: formData.organization.name,
          url: formData.organization.website,
          industry: extractIndustry(formData.organization.description)
        },
        keywords: extractKeywords(formData.organization.description),
        stakeholder: 'competitors'
      });
      
      // Step 3: Use News MCP to find industry news and events
      const newsData = await callMCP('news', 'gather', {
        organization: {
          name: formData.organization.name,
          industry: extractIndustry(formData.organization.description)
        },
        keywords: extractKeywords(formData.organization.description),
        stakeholder: 'media'
      });
      
      // Step 4: Use Media MCP to discover relevant journalists
      const mediaData = await callMCP('media', 'discover', {
        organization: {
          name: formData.organization.name,
          industry: extractIndustry(formData.organization.description)
        },
        keywords: extractKeywords(formData.organization.description),
        stakeholder: 'tech_journalists'
      });
      
      // Process and compile discovered profile from REAL MCP data
      const profile = processRealMCPData({
        scraperData,
        competitorData,
        newsData,
        mediaData
      });
      
      // Generate MCP recommendations based on discovered profile
      const recommendations = generateMCPRecommendations(profile);
      
      setDiscoveredProfile(profile);
      setMcpRecommendations(recommendations);
      
      // Auto-populate form with discovered data
      setFormData(prev => ({
        ...prev,
        profile,
        monitoring: {
          whoToMonitor: {
            competitors: profile.competitors.map(c => c.name),
            journalists: profile.journalists.map(j => j.name),
            influencers: profile.influencers.map(i => i.name),
            investors: [],
            regulators: profile.regulatoryBodies.map(r => r.name),
            partners: [],
            customers: [],
            employees: [],
          },
          whatToMonitor: {
            industryTrends: profile.topics,
            competitorMoves: profile.competitors.map(c => `${c.name} activities`),
            marketOpportunities: profile.opportunities,
            narrativeVacuums: profile.narratives.filter(n => n.type === 'vacuum'),
            crisisSignals: ['data breach', 'executive departure', 'lawsuit', 'regulatory action'],
            regulatoryChanges: [],
            events: profile.events.map(e => e.name),
            mediaRequests: profile.mediaOpportunities,
            socialTrends: profile.socialTrends,
            cascadeEvents: profile.cascadeIndicators,
          },
          priorities: recommendations.priorities
        }
      }));
      
    } catch (error) {
      console.error('Organization analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Process real MCP data into actionable intelligence
  const processRealMCPData = (mcpData) => {
    const profile = {
      industry: '',
      size: 'medium',
      competitors: [],
      stakeholders: [],
      topics: [],
      events: [],
      journalists: [],
      influencers: [],
      regulatoryBodies: [],
      narratives: [],
      opportunities: [],
      mediaOpportunities: [],
      socialTrends: [],
      cascadeIndicators: []
    };

    // Process Scraper data (real website analysis)
    if (mcpData.scraperData?.signals) {
      const signals = mcpData.scraperData.signals;
      
      // Extract industry from website content
      if (signals.meta?.description) {
        profile.industry = extractIndustry(signals.meta.description);
      }
      
      // Identify growth indicators
      if (signals.jobs?.growthIndicator === 'high') {
        profile.size = 'growth-stage';
        profile.topics.push('rapid growth', 'hiring', 'expansion');
      }
      
      // Extract cascade indicators from patterns
      if (mcpData.scraperData.patterns) {
        profile.cascadeIndicators = mcpData.scraperData.patterns.map(p => ({
          pattern: p.pattern,
          confidence: p.confidence,
          indicators: p.indicators
        }));
      }
    }

    // Process Intelligence MCP data (real GitHub competitors)
    if (mcpData.competitorData?.insights) {
      profile.competitors = mcpData.competitorData.insights.slice(0, 5).map(insight => {
        // Parse real GitHub repository data
        const parts = insight.title?.split('/') || [];
        const metrics = insight.insight?.match(/(\d+)\s*stars.*?(\d+)\s*recent commits/);
        
        return {
          name: parts[0] || 'Unknown',
          repository: parts[1] || '',
          description: insight.insight || '',
          stars: metrics ? parseInt(metrics[1]) : 0,
          recentActivity: metrics ? parseInt(metrics[2]) : 0,
          relevance: insight.relevance || 'medium',
          url: insight.data?.url || `https://github.com/${insight.title}`,
          actionableInsight: generateCompetitorInsight(insight)
        };
      });
    }

    // Process News MCP data (real news and opportunities)
    if (mcpData.newsData?.data) {
      const newsInfo = mcpData.newsData.data;
      
      // Extract industry trends from real news
      if (newsInfo.industryNews) {
        const trends = new Set();
        newsInfo.industryNews.forEach(article => {
          // Extract topics from article titles and descriptions
          const text = `${article.title} ${article.description}`.toLowerCase();
          if (text.includes('ai')) trends.add('Artificial Intelligence');
          if (text.includes('cloud')) trends.add('Cloud Computing');
          if (text.includes('security')) trends.add('Cybersecurity');
          if (text.includes('data')) trends.add('Data Analytics');
          if (text.includes('blockchain')) trends.add('Blockchain');
          if (text.includes('sustainability')) trends.add('Sustainability');
        });
        profile.topics = Array.from(trends);
      }
      
      // Extract media opportunities from real news data
      if (newsInfo.opportunities) {
        profile.mediaOpportunities = newsInfo.opportunities.map(opp => ({
          title: opp.title,
          outlet: opp.outlet,
          deadline: opp.deadline,
          type: opp.type,
          action: opp.suggestedAction,
          url: opp.url
        }));
        
        // Extract events from opportunities
        profile.events = newsInfo.opportunities
          .filter(o => o.title.toLowerCase().includes('conference') || 
                      o.title.toLowerCase().includes('summit') ||
                      o.title.toLowerCase().includes('panel'))
          .map(o => ({
            name: o.title,
            type: 'speaking_opportunity',
            deadline: o.deadline,
            urgency: o.relevance
          }));
      }
      
      // Extract breaking news patterns
      if (newsInfo.breakingNews) {
        profile.narratives = newsInfo.breakingNews.map(news => ({
          title: news.title,
          type: news.category === 'breaking_news' ? 'emerging' : 'ongoing',
          urgency: news.urgency,
          suggestedAction: news.suggestedAction
        }));
      }
    }

    // Process Media MCP data (real journalists)
    if (mcpData.mediaData?.data?.journalists) {
      profile.journalists = mcpData.mediaData.data.journalists.map(j => ({
        name: j.name || 'Unknown',
        outlet: j.outlet || j.platform || 'Independent',
        beat: j.beat || j.topics?.join(', ') || 'General',
        relevance: j.relevance || 'medium',
        contact: j.contact || j.handle || '',
        actionableInsight: `Pitch ${j.beat || 'relevant'} stories to ${j.name}`
      }));
    }

    // Extract social trends from media data
    if (mcpData.mediaData?.data?.trends) {
      profile.socialTrends = mcpData.mediaData.data.trends.map(t => ({
        topic: t.topic || t.hashtag,
        platform: t.platform,
        engagement: t.engagement || t.volume,
        sentiment: t.sentiment
      }));
    }

    // Generate actionable opportunities from all data
    profile.opportunities = generateOpportunities(profile);

    return profile;
  };

  // Generate actionable competitor insights
  const generateCompetitorInsight = (competitorData) => {
    const stars = competitorData.data?.stars || 0;
    const activity = competitorData.data?.recentCommits || 0;
    
    if (stars > 100000) {
      return 'Major market leader - analyze their strategy and differentiation points';
    } else if (stars > 10000) {
      return 'Strong competitor - monitor for partnership or competitive positioning';
    } else if (activity > 10) {
      return 'Active development - track for emerging features and market moves';
    } else {
      return 'Monitor for market positioning and potential acquisition';
    }
  };

  // Generate opportunities from discovered data
  const generateOpportunities = (profile) => {
    const opportunities = [];
    
    // Competitive opportunities
    if (profile.competitors.length > 0) {
      const weakCompetitor = profile.competitors.find(c => c.recentActivity < 5);
      if (weakCompetitor) {
        opportunities.push({
          type: 'competitive',
          title: `Competitor ${weakCompetitor.name} showing reduced activity`,
          action: 'Opportunity to gain market share with increased visibility',
          urgency: 'high'
        });
      }
    }
    
    // Media opportunities
    if (profile.mediaOpportunities.length > 0) {
      opportunities.push({
        type: 'media',
        title: `${profile.mediaOpportunities.length} journalist queries available`,
        action: 'Respond to media requests for immediate coverage',
        urgency: 'critical'
      });
    }
    
    // Event opportunities
    if (profile.events.length > 0) {
      opportunities.push({
        type: 'event',
        title: `${profile.events.length} speaking opportunities identified`,
        action: 'Apply for speaking slots to establish thought leadership',
        urgency: 'high'
      });
    }
    
    // Narrative opportunities
    if (profile.narratives.some(n => n.type === 'emerging')) {
      opportunities.push({
        type: 'narrative',
        title: 'Emerging narrative detected in your industry',
        action: 'Position as thought leader on emerging topic',
        urgency: 'medium'
      });
    }
    
    return opportunities;
  };

  // Call MCP through Supabase bridge
  const callMCP = async (server, method, params) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-bridge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          server,
          method,
          params,
          organizationId: 'onboarding'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.result || data;
      }
    } catch (error) {
      console.error(`MCP ${server}.${method} error:`, error);
    }
    return null;
  };

  // Helper functions
  const extractIndustry = (description) => {
    const text = description.toLowerCase();
    if (text.includes('finance') || text.includes('bank')) return 'finance';
    if (text.includes('health') || text.includes('medical')) return 'healthcare';
    if (text.includes('retail') || text.includes('shop')) return 'retail';
    if (text.includes('education') || text.includes('learn')) return 'education';
    return 'technology'; // default
  };

  const extractKeywords = (description) => {
    const words = description.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return words.filter(w => w.length > 3 && !stopWords.includes(w)).slice(0, 5);
  };

  const generateMCPRecommendations = (profile) => {
    const recommendations = {
      priorities: {
        realTimeAlerts: true,
        competitiveIntel: profile.competitors.length > 0,
        opportunityDetection: profile.opportunities.length > 0,
        crisisMonitoring: true,
        narrativeTracking: profile.narratives.length > 0,
        eventTracking: profile.events.length > 0,
        regulatoryTracking: profile.regulatoryBodies.length > 0,
        socialMonitoring: profile.socialTrends.length > 0,
      },
      suggestedMCPs: [],
      insights: []
    };

    // Generate actionable recommendations
    if (profile.competitors.length > 3) {
      recommendations.insights.push(`🎯 ${profile.competitors.length} active competitors detected - competitive intelligence critical`);
    }
    
    if (profile.events.length > 0) {
      recommendations.insights.push(`📅 ${profile.events.length} speaking opportunities available for thought leadership`);
    }
    
    if (profile.journalists.length > 0) {
      recommendations.insights.push(`📰 ${profile.journalists.length} relevant journalists identified for media outreach`);
    }
    
    if (profile.mediaOpportunities.length > 0) {
      recommendations.insights.push(`🚀 ${profile.mediaOpportunities.length} immediate media opportunities - act fast!`);
    }
    
    if (profile.cascadeIndicators.length > 0) {
      recommendations.insights.push(`⚡ Cascade event patterns detected - monitor for ripple effects`);
    }

    return recommendations;
  };

  const handleSubmit = async () => {
    setIsAnalyzing(true);
    try {
      // Save configuration
      const config = {
        organization: formData.organization,
        profile: discoveredProfile,
        monitoring: formData.monitoring,
        goals: formData.goals,
        mcpRecommendations,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('signaldesk_config', JSON.stringify(config));
      localStorage.setItem('signaldesk_org_id', formData.organization.name);
      
      navigate('/intelligence-hub');
    } catch (error) {
      console.error('Configuration save error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="simplified-onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>🎯 Intelligent Organization Analysis</h1>
          <p>MCPs will analyze your organization to discover WHO and WHAT to monitor</p>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
        </div>

        {currentStep === 1 && (
          <div className="onboarding-step">
            <h2>Tell us about your organization</h2>
            <p>Our MCPs will analyze this information to build your intelligence profile</p>
            
            <div className="form-group">
              <label>Organization Name *</label>
              <input
                type="text"
                placeholder="e.g., Acme Corp"
                value={formData.organization.name}
                onChange={(e) => setFormData({
                  ...formData,
                  organization: { ...formData.organization, name: e.target.value }
                })}
              />
            </div>

            <div className="form-group">
              <label>Website URL *</label>
              <input
                type="url"
                placeholder="https://www.example.com"
                value={formData.organization.website}
                onChange={(e) => setFormData({
                  ...formData,
                  organization: { ...formData.organization, website: e.target.value }
                })}
                onBlur={analyzeOrganization}
              />
              <small>MCPs will analyze your website to understand your business</small>
            </div>

            <div className="form-group">
              <label>Brief Description</label>
              <textarea
                placeholder="What does your organization do? (helps MCPs understand context)"
                value={formData.organization.description}
                onChange={(e) => setFormData({
                  ...formData,
                  organization: { ...formData.organization, description: e.target.value }
                })}
                rows={3}
              />
            </div>

            <button 
              className="next-button"
              onClick={() => {
                analyzeOrganization();
                setCurrentStep(2);
              }}
              disabled={!formData.organization.name || !formData.organization.website}
            >
              Analyze Organization →
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="onboarding-step">
            <h2>MCP Analysis Results</h2>
            {isAnalyzing ? (
              <div className="analyzing">
                <div className="spinner"></div>
                <p>MCPs are analyzing your organization...</p>
                <small>🔍 Scraping website for insights...</small>
                <small>🎯 Discovering competitors on GitHub...</small>
                <small>📰 Finding relevant journalists and media...</small>
                <small>📅 Identifying events and opportunities...</small>
              </div>
            ) : discoveredProfile ? (
              <div className="discovered-profile">
                <div className="profile-section">
                  <h3>🏢 Organization Profile</h3>
                  <p><strong>Industry:</strong> {discoveredProfile.industry}</p>
                  <p><strong>Size:</strong> {discoveredProfile.size}</p>
                  {discoveredProfile.cascadeIndicators.length > 0 && (
                    <p><strong>Growth Signals:</strong> {discoveredProfile.cascadeIndicators[0].pattern}</p>
                  )}
                </div>

                <div className="profile-section">
                  <h3>🎯 Real Competitors Found ({discoveredProfile.competitors.length})</h3>
                  <ul>
                    {discoveredProfile.competitors.map((c, i) => (
                      <li key={i}>
                        <strong>{c.name}</strong>
                        {c.repository && <span> / {c.repository}</span>}
                        <br/>
                        <small>{c.description}</small>
                        <br/>
                        <span className="metrics">
                          ⭐ {c.stars.toLocaleString()} stars | 
                          📊 {c.recentActivity} recent commits
                        </span>
                        <br/>
                        <em className="insight">{c.actionableInsight}</em>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="profile-section">
                  <h3>📰 Media Opportunities ({discoveredProfile.mediaOpportunities.length})</h3>
                  <ul>
                    {discoveredProfile.mediaOpportunities.slice(0, 3).map((m, i) => (
                      <li key={i}>
                        <strong>{m.title}</strong>
                        <br/>
                        <small>{m.outlet} - Deadline: {new Date(m.deadline).toLocaleDateString()}</small>
                        <br/>
                        <em>{m.action}</em>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="profile-section">
                  <h3>📅 Events & Speaking Opportunities ({discoveredProfile.events.length})</h3>
                  <ul>
                    {discoveredProfile.events.map((e, i) => (
                      <li key={i}>
                        <strong>{e.name}</strong> - {e.type} ({e.urgency} priority)
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="profile-section">
                  <h3>🚀 Immediate Opportunities ({discoveredProfile.opportunities.length})</h3>
                  {discoveredProfile.opportunities.map((opp, i) => (
                    <div key={i} className={`opportunity ${opp.urgency}`}>
                      <strong>{opp.title}</strong>
                      <p>{opp.action}</p>
                      <span className="urgency-badge">{opp.urgency}</span>
                    </div>
                  ))}
                </div>

                <div className="profile-section">
                  <h3>💡 MCP Intelligence Insights</h3>
                  {mcpRecommendations?.insights.map((insight, i) => (
                    <p key={i}>{insight}</p>
                  ))}
                </div>

                <button className="next-button" onClick={() => setCurrentStep(3)}>
                  Configure Monitoring →
                </button>
              </div>
            ) : (
              <p>Enter your organization details to begin analysis</p>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="onboarding-step">
            <h2>Configure What to Monitor</h2>
            <p>Based on MCP analysis, we recommend monitoring:</p>

            <div className="monitoring-config">
              <h3>WHO to Monitor</h3>
              <div className="monitor-grid">
                {Object.entries(formData.monitoring.whoToMonitor).map(([key, value]) => (
                  value.length > 0 && (
                    <div key={key} className="monitor-item">
                      <input type="checkbox" defaultChecked id={`who-${key}`} />
                      <label htmlFor={`who-${key}`}>
                        <strong>{key}:</strong> {value.length} identified
                        <br/>
                        <small>{value.slice(0, 3).join(', ')}</small>
                      </label>
                    </div>
                  )
                ))}
              </div>

              <h3>WHAT to Monitor</h3>
              <div className="monitor-grid">
                {Object.entries(formData.monitoring.whatToMonitor).map(([key, value]) => (
                  value.length > 0 && (
                    <div key={key} className="monitor-item">
                      <input type="checkbox" defaultChecked id={`what-${key}`} />
                      <label htmlFor={`what-${key}`}>
                        <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value.length} items
                      </label>
                    </div>
                  )
                ))}
              </div>

              <button className="next-button" onClick={() => setCurrentStep(4)}>
                Set Goals →
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="onboarding-step">
            <h2>Define Your Intelligence Goals</h2>
            
            <div className="form-group">
              <label>Primary Goal</label>
              <select
                value={formData.goals.primary}
                onChange={(e) => setFormData({
                  ...formData,
                  goals: { ...formData.goals, primary: e.target.value }
                })}
              >
                <option value="">Select primary goal</option>
                <option value="thought_leadership">Establish Thought Leadership</option>
                <option value="brand_awareness">Increase Brand Awareness</option>
                <option value="crisis_prevention">Crisis Prevention & Management</option>
                <option value="competitive_advantage">Gain Competitive Advantage</option>
                <option value="investor_relations">Enhance Investor Relations</option>
                <option value="market_expansion">Support Market Expansion</option>
                <option value="talent_acquisition">Boost Talent Acquisition</option>
                <option value="event_visibility">Maximize Event Visibility</option>
              </select>
            </div>

            <div className="form-group">
              <label>Timeline</label>
              <select
                value={formData.goals.timeline}
                onChange={(e) => setFormData({
                  ...formData,
                  goals: { ...formData.goals, timeline: e.target.value }
                })}
              >
                <option value="1_month">1 Month Sprint</option>
                <option value="3_months">3 Month Campaign</option>
                <option value="6_months">6 Month Strategy</option>
                <option value="1_year">Annual Plan</option>
              </select>
            </div>

            <button 
              className="complete-button"
              onClick={handleSubmit}
              disabled={isAnalyzing || !formData.goals.primary}
            >
              {isAnalyzing ? 'Setting up...' : 'Launch Intelligence Platform'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .analyzing {
          text-align: center;
          padding: 40px;
        }
        
        .analyzing small {
          display: block;
          margin: 5px 0;
          color: #666;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .profile-section {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .profile-section h3 {
          margin-top: 0;
          color: #333;
        }
        
        .profile-section ul {
          list-style: none;
          padding-left: 0;
        }
        
        .profile-section li {
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .metrics {
          color: #666;
          font-size: 0.9em;
        }
        
        .insight {
          color: #007bff;
          font-size: 0.9em;
        }
        
        .opportunity {
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          border-left: 4px solid;
        }
        
        .opportunity.critical {
          border-color: #dc3545;
          background: #f8d7da;
        }
        
        .opportunity.high {
          border-color: #ffc107;
          background: #fff3cd;
        }
        
        .opportunity.medium {
          border-color: #28a745;
          background: #d4edda;
        }
        
        .urgency-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 0.8em;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .monitor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }
        
        .monitor-item {
          display: flex;
          align-items: flex-start;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 5px;
        }
        
        .monitor-item input {
          margin-right: 10px;
          margin-top: 3px;
        }
        
        .monitor-item label {
          flex: 1;
        }
        
        .monitor-item small {
          color: #666;
          font-size: 0.85em;
        }
        
        .discovered-profile {
          max-height: 60vh;
          overflow-y: auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default IntelligentOnboarding;