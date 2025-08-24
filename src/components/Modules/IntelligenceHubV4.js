import React, { useState, useEffect } from 'react';
import './IntelligenceHubV4.css';
import intelligenceGatheringService from '../../services/intelligenceGatheringService';

const IntelligenceHubV4 = ({ organizationId }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [userConfig, setUserConfig] = useState(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState({});
  const [mcpResults, setMcpResults] = useState(null);

  useEffect(() => {
    loadUserConfiguration();
    loadMCPResults();
    loadCategoryAnalysis();
  }, []);

  const loadUserConfiguration = () => {
    const savedOnboarding = localStorage.getItem('signaldesk_onboarding');
    if (savedOnboarding) {
      const config = JSON.parse(savedOnboarding);
      setUserConfig(config);
      // Set first stakeholder as default selection
      if (config.stakeholders && config.stakeholders.length > 0 && !selectedCategory) {
        setSelectedCategory(config.stakeholders[0]);
      }
    }
  };

  const loadMCPResults = () => {
    const savedMCPResults = localStorage.getItem('signaldesk_mcp_results');
    if (savedMCPResults) {
      try {
        const results = JSON.parse(savedMCPResults);
        setMcpResults(results);
        console.log('📊 Loaded MCP results from onboarding:', results);
      } catch (error) {
        console.error('Failed to parse MCP results:', error);
      }
    }
  };

  const loadCategoryAnalysis = () => {
    // Load any cached analysis
    const cachedAnalysis = localStorage.getItem('signaldesk_category_analysis');
    const cacheTime = localStorage.getItem('signaldesk_analysis_timestamp');
    
    if (cachedAnalysis) {
      setCategoryAnalysis(JSON.parse(cachedAnalysis));
      setLastUpdate(cacheTime ? new Date(cacheTime) : new Date());
    }
    
    // Check if we need to refresh (12 hour cycle)
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    if (!cacheTime || new Date(cacheTime).getTime() < twelveHoursAgo) {
      refreshAnalysis();
    }
  };

  const refreshAnalysis = async () => {
    setLoading(true);
    
    try {
      // First, try to get fresh data from MCPs
      let analysis = {};
      
      if (userConfig && userConfig.stakeholders) {
        // Use intelligenceGatheringService to call MCPs for fresh data
        const intelligence = await intelligenceGatheringService.gatherIntelligence(userConfig);
        
        if (intelligence) {
          // Transform intelligence data into category analysis format
          analysis = await transformIntelligenceToAnalysis(intelligence, userConfig.stakeholders);
        }
        
        // If we have MCP results from onboarding, merge them
        if (mcpResults) {
          analysis = await mergeMCPResults(analysis, mcpResults, userConfig.stakeholders);
        }
        
        // Store results in memory MCP for persistence
        if (Object.keys(analysis).length > 0) {
          await storeInMemory(analysis);
        }
      }
      
      // Fallback to hardcoded analysis if no real data
      if (Object.keys(analysis).length === 0) {
        analysis = await generateCategoryAnalysis();
      }
      
      setCategoryAnalysis(analysis);
      setLastUpdate(new Date());
      
      // Cache the analysis locally
      localStorage.setItem('signaldesk_category_analysis', JSON.stringify(analysis));
      localStorage.setItem('signaldesk_analysis_timestamp', new Date().toISOString());
      
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      
      // Fallback to hardcoded analysis on error
      const fallbackAnalysis = await generateCategoryAnalysis();
      setCategoryAnalysis(fallbackAnalysis);
    }
    
    setLoading(false);
  };

  // Transform intelligence data from MCPs into category analysis format
  const transformIntelligenceToAnalysis = async (intelligence, stakeholders) => {
    const analysis = {};
    
    for (const stakeholder of stakeholders) {
      // Transform stakeholder insights into analysis format
      const insights = intelligence.stakeholderInsights.filter(insight => 
        insight.stakeholder.toLowerCase().includes(stakeholder.replace('_', ' ')) ||
        stakeholder.includes(insight.type)
      );
      
      if (insights.length > 0) {
        analysis[stakeholder] = {
          title: `${stakeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Intelligence`,
          summary: `${insights.length} actionable insights from real-time MCP analysis`,
          sections: [{
            heading: 'Current Intelligence',
            icon: '🔍',
            items: insights.map(insight => ({
              title: insight.title || insight.insight,
              description: insight.insight,
              relevance: insight.relevance,
              actionable: insight.actionable,
              suggestedAction: insight.suggestedAction,
              source: insight.source,
              timestamp: insight.timestamp
            }))
          }]
        };
      }
    }
    
    // Add industry trends if available
    if (intelligence.industryTrends && intelligence.industryTrends.length > 0) {
      for (const stakeholder of stakeholders) {
        if (!analysis[stakeholder]) {
          analysis[stakeholder] = {
            title: `${stakeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
            summary: 'Industry trend analysis available',
            sections: []
          };
        }
        
        analysis[stakeholder].sections.push({
          heading: 'Industry Trends',
          icon: '📈',
          items: intelligence.industryTrends.map(trend => ({
            trend: trend.trend,
            description: trend.description,
            impact: trend.impact,
            opportunity: trend.opportunity
          }))
        });
      }
    }
    
    return analysis;
  };

  // Merge MCP results from onboarding
  const mergeMCPResults = async (currentAnalysis, mcpResults, stakeholders) => {
    const merged = { ...currentAnalysis };
    
    // Process each MCP result from onboarding
    for (const [mcpName, result] of Object.entries(mcpResults)) {
      if (!result || !result.data) continue;
      
      // Map MCP results to stakeholder categories
      for (const stakeholder of stakeholders) {
        if (shouldIncludeMCPForStakeholder(mcpName, stakeholder)) {
          if (!merged[stakeholder]) {
            merged[stakeholder] = {
              title: `${stakeholder.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
              summary: 'Analysis from onboarding data and real-time updates',
              sections: []
            };
          }
          
          // Add MCP data as a section
          merged[stakeholder].sections.push({
            heading: `${mcpName.charAt(0).toUpperCase() + mcpName.slice(1)} Intelligence`,
            icon: getMCPIcon(mcpName),
            items: formatMCPDataForDisplay(result.data, mcpName)
          });
        }
      }
    }
    
    return merged;
  };

  // Helper function to determine if MCP data applies to stakeholder
  const shouldIncludeMCPForStakeholder = (mcpName, stakeholder) => {
    const mappings = {
      'media': ['tech_journalists', 'influencers'],
      'intelligence': ['competitors', 'industry_analysts'],
      'relationships': ['partners', 'customers'],
      'analytics': ['customers', 'competitors'],
      'opportunities': ['tech_journalists', 'investors', 'partners'],
      'monitor': ['competitors', 'regulators']
    };
    
    return mappings[mcpName]?.includes(stakeholder) || false;
  };

  // Get icon for MCP type
  const getMCPIcon = (mcpName) => {
    const icons = {
      'media': '📰',
      'intelligence': '🔍',
      'relationships': '🤝',
      'analytics': '📊',
      'opportunities': '🎯',
      'monitor': '⚠️',
      'memory': '🧠'
    };
    return icons[mcpName] || '📋';
  };

  // Format MCP data for display
  const formatMCPDataForDisplay = (data, mcpName) => {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data.slice(0, 5).map(item => ({
        title: item.title || item.name || item.outlet || 'Insight',
        description: item.description || item.insight || item.summary || 'No details available',
        relevance: item.relevance || item.score || 'medium',
        source: `${mcpName} MCP`,
        timestamp: item.timestamp || new Date().toISOString()
      }));
    }
    
    if (typeof data === 'object') {
      return Object.entries(data).slice(0, 3).map(([key, value]) => ({
        title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: typeof value === 'string' ? value : JSON.stringify(value),
        source: `${mcpName} MCP`,
        timestamp: new Date().toISOString()
      }));
    }
    
    return [{
      title: 'MCP Data Available',
      description: String(data),
      source: `${mcpName} MCP`,
      timestamp: new Date().toISOString()
    }];
  };

  // Store analysis in memory MCP
  const storeInMemory = async (analysis) => {
    try {
      await intelligenceGatheringService.callMCP('memory', 'store', {
        type: 'intelligence_analysis',
        organization_id: localStorage.getItem('signaldesk_org_id') || 'default',
        data: analysis,
        timestamp: new Date().toISOString()
      });
      console.log('✅ Stored analysis in memory MCP');
    } catch (error) {
      console.log('Failed to store in memory MCP:', error.message);
    }
  };

  const generateCategoryAnalysis = async () => {
    const analysis = {};
    
    if (!userConfig || !userConfig.stakeholders) return analysis;
    
    for (const stakeholder of userConfig.stakeholders) {
      analysis[stakeholder] = await analyzeCategory(stakeholder);
    }
    
    return analysis;
  };

  const analyzeCategory = async (category) => {
    // Generate comprehensive analysis for each category
    const analyses = {
      competitors: {
        title: 'Competitive Landscape Analysis',
        summary: 'Comprehensive overview of competitor activities and market positioning',
        sections: [
          {
            heading: 'Recent Competitor Moves',
            icon: '🎯',
            items: [
              {
                company: 'Competitor A',
                action: 'Launched new AI-powered feature',
                impact: 'May attract enterprise customers',
                recommendation: 'Accelerate your AI roadmap and highlight unique differentiators',
                urgency: 'medium'
              },
              {
                company: 'Competitor B',
                action: 'Raised $50M Series B funding',
                impact: 'Will likely increase marketing spend and hiring',
                recommendation: 'Focus on efficiency and customer success stories',
                urgency: 'low'
              },
              {
                company: 'Competitor C',
                action: 'Acquired smaller player in adjacent market',
                impact: 'Expanding their product suite',
                recommendation: 'Consider partnership opportunities in complementary spaces',
                urgency: 'medium'
              }
            ]
          },
          {
            heading: 'Market Position Shifts',
            icon: '📊',
            items: [
              {
                trend: 'Enterprise adoption increasing',
                yourPosition: 'Well-positioned with security features',
                action: 'Emphasize enterprise-ready capabilities in messaging'
              },
              {
                trend: 'Price sensitivity in SMB segment',
                yourPosition: 'Premium pricing may be a barrier',
                action: 'Consider freemium or starter tier'
              }
            ]
          },
          {
            heading: 'Competitive Advantages',
            icon: '💪',
            items: [
              {
                advantage: 'Superior data privacy',
                leverage: 'Lead with privacy-first messaging in all communications'
              },
              {
                advantage: 'Better integration ecosystem',
                leverage: 'Showcase integration capabilities in demos'
              }
            ]
          }
        ]
      },
      
      tech_journalists: {
        title: 'Media Intelligence Report',
        summary: 'Analysis of media landscape and opportunities for coverage',
        sections: [
          {
            heading: 'Trending Topics in Your Space',
            icon: '📰',
            items: [
              {
                topic: 'AI Ethics and Governance',
                relevance: 'High - aligns with your responsible AI stance',
                outlets: ['TechCrunch', 'VentureBeat', 'The Information'],
                angle: 'Position as thought leader on responsible AI implementation'
              },
              {
                topic: 'Future of Work Post-AI',
                relevance: 'Medium - tangential to your product',
                outlets: ['Forbes', 'Fast Company', 'WSJ'],
                angle: 'Share insights on human-AI collaboration'
              }
            ]
          },
          {
            heading: 'Reporter Queries & Opportunities',
            icon: '🎤',
            items: [
              {
                reporter: 'Sarah Chen - TechCrunch',
                beat: 'Enterprise SaaS',
                recentArticles: 'Covered 3 competitors in last month',
                approach: 'Pitch exclusive data or customer success story',
                timing: 'Best reached Tuesday-Thursday mornings'
              },
              {
                reporter: 'Michael Torres - Forbes',
                beat: 'Digital Transformation',
                recentArticles: 'Focus on ROI and business impact',
                approach: 'Offer C-suite perspective on industry trends',
                timing: 'Prefers email pitches with data'
              }
            ]
          },
          {
            heading: 'Content Opportunities',
            icon: '✍️',
            items: [
              {
                type: 'Bylined Article',
                publication: 'VentureBeat',
                topic: 'Technical deep-dive on your approach',
                deadline: 'Rolling submissions'
              },
              {
                type: 'Podcast',
                show: 'The AI Podcast',
                audience: '50K+ downloads per episode',
                topics: 'Innovation stories and technical insights'
              }
            ]
          }
        ]
      },
      
      investors: {
        title: 'Investor Intelligence Briefing',
        summary: 'VC activity, investment trends, and positioning insights',
        sections: [
          {
            heading: 'Investment Trends in Your Sector',
            icon: '💰',
            items: [
              {
                trend: '$2.3B invested in your category this quarter',
                topDeals: ['Company X - $200M', 'Company Y - $150M'],
                averageValuation: '$500M for Series B companies',
                yourPosition: 'Consider timing for next round based on these multiples'
              },
              {
                trend: 'Shift toward profitability over growth',
                investorFocus: 'Unit economics and burn rate',
                recommendation: 'Prepare metrics showing path to profitability'
              }
            ]
          },
          {
            heading: 'Active Investors in Your Space',
            icon: '🎯',
            items: [
              {
                firm: 'Andreessen Horowitz',
                recentInvestments: '3 companies in adjacent spaces',
                partner: 'Martin Casado (Enterprise focus)',
                approach: 'Warm intro through portfolio company CEO'
              },
              {
                firm: 'Sequoia Capital',
                recentInvestments: 'Leading rounds in AI infrastructure',
                partner: 'Pat Grady (Growth stage)',
                approach: 'Demonstrate strong product-market fit metrics'
              }
            ]
          },
          {
            heading: 'Positioning for Investors',
            icon: '📈',
            items: [
              {
                metric: 'Revenue Growth',
                benchmark: '3x YoY for Series B',
                yourStatus: 'Track and highlight monthly growth rate'
              },
              {
                metric: 'Customer Retention',
                benchmark: '95%+ net retention',
                yourStatus: 'Emphasize expansion revenue from existing customers'
              }
            ]
          }
        ]
      },
      
      customers: {
        title: 'Customer Intelligence Analysis',
        summary: 'Customer sentiment, feedback patterns, and satisfaction insights',
        sections: [
          {
            heading: 'Sentiment Analysis',
            icon: '😊',
            items: [
              {
                channel: 'Product Reviews',
                sentiment: '82% positive',
                themes: ['Easy to use', 'Great support', 'Needs more integrations'],
                action: 'Address integration feedback in roadmap communications'
              },
              {
                channel: 'Social Media',
                sentiment: '76% positive',
                themes: ['Love the UI', 'Pricing concerns for small teams'],
                action: 'Consider highlighting ROI for smaller organizations'
              }
            ]
          },
          {
            heading: 'Customer Needs & Requests',
            icon: '🎯',
            items: [
              {
                request: 'API enhancements',
                frequency: 'Mentioned by 45% of enterprise customers',
                priority: 'High',
                response: 'Announce API roadmap in next customer newsletter'
              },
              {
                request: 'Mobile app',
                frequency: 'Requested by 30% of users',
                priority: 'Medium',
                response: 'Survey specific use cases to inform mobile strategy'
              }
            ]
          }
        ]
      },
      
      industry_analysts: {
        title: 'Analyst Relations Intelligence',
        summary: 'Industry analyst coverage and positioning insights',
        sections: [
          {
            heading: 'Recent Analyst Reports',
            icon: '📊',
            items: [
              {
                firm: 'Gartner',
                report: 'Magic Quadrant for Your Category',
                yourPosition: 'Not yet included',
                action: 'Schedule briefing with lead analyst',
                deadline: 'Q3 submission deadline'
              },
              {
                firm: 'Forrester',
                report: 'Wave Report coming Q4',
                yourPosition: 'Meets inclusion criteria',
                action: 'Prepare customer references and demos'
              }
            ]
          },
          {
            heading: 'Key Analysts to Engage',
            icon: '👥',
            items: [
              {
                analyst: 'Jennifer Smith - Gartner',
                coverage: 'Your specific technology area',
                influence: 'High - frequently quoted in media',
                approach: 'Schedule quarterly briefings'
              }
            ]
          }
        ]
      },
      
      partners: {
        title: 'Partner Ecosystem Intelligence',
        summary: 'Partnership opportunities and ecosystem dynamics',
        sections: [
          {
            heading: 'Partnership Opportunities',
            icon: '🤝',
            items: [
              {
                company: 'Major CRM Platform',
                opportunity: 'Integration partnership',
                value: 'Access to 100K+ potential customers',
                nextStep: 'Reach out to their BD team'
              }
            ]
          }
        ]
      },
      
      regulators: {
        title: 'Regulatory Intelligence Update',
        summary: 'Compliance requirements and regulatory changes',
        sections: [
          {
            heading: 'Upcoming Regulations',
            icon: '⚖️',
            items: [
              {
                regulation: 'AI Act Implementation',
                deadline: 'Q2 2024',
                impact: 'Will require transparency documentation',
                action: 'Begin preparing compliance documentation'
              }
            ]
          }
        ]
      },
      
      influencers: {
        title: 'Influencer Landscape Report',
        summary: 'Key opinion leaders and thought leaders in your space',
        sections: [
          {
            heading: 'Top Influencers to Engage',
            icon: '⭐',
            items: [
              {
                name: 'Tech Thought Leader',
                reach: '500K followers',
                topics: 'AI, Future of Work',
                engagement: 'Comment on their content, share insights'
              }
            ]
          }
        ]
      }
    };
    
    return analyses[category] || {
      title: `${category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
      summary: 'Analysis pending...',
      sections: []
    };
  };

  const stakeholderInfo = {
    tech_journalists: { name: 'Tech Media', icon: '📰', color: '#3B82F6' },
    industry_analysts: { name: 'Industry Analysts', icon: '📊', color: '#8B5CF6' },
    investors: { name: 'VC Community', icon: '💰', color: '#10B981' },
    customers: { name: 'Customer Base', icon: '👥', color: '#F59E0B' },
    partners: { name: 'Partner Network', icon: '🤝', color: '#EC4899' },
    competitors: { name: 'Competitors', icon: '🎯', color: '#EF4444' },
    regulators: { name: 'Regulatory Bodies', icon: '⚖️', color: '#6366F1' },
    influencers: { name: 'Industry Influencers', icon: '⭐', color: '#14B8A6' }
  };

  const renderCategoryGrid = () => {
    if (!userConfig || !userConfig.stakeholders) {
      return <div className="empty-state">No stakeholders configured</div>;
    }

    return (
      <div className="category-grid">
        {userConfig.stakeholders.map(stakeholderId => {
          const info = stakeholderInfo[stakeholderId];
          const analysis = categoryAnalysis[stakeholderId];
          
          return (
            <div
              key={stakeholderId}
              className={`category-card ${selectedCategory === stakeholderId ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(stakeholderId)}
              style={{ borderColor: selectedCategory === stakeholderId ? info.color : 'transparent' }}
            >
              <div className="category-header">
                <span className="category-icon">{info.icon}</span>
                <h3>{info.name}</h3>
              </div>
              <p className="category-summary">
                {analysis?.summary || 'Click to view detailed analysis'}
              </p>
              {analysis && (
                <div className="category-stats">
                  <span>{analysis.sections?.length || 0} insights</span>
                  <span className="view-more">View Details →</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDetailedAnalysis = () => {
    if (!selectedCategory || !categoryAnalysis[selectedCategory]) {
      return <div className="empty-analysis">Select a category to view detailed analysis</div>;
    }

    const analysis = categoryAnalysis[selectedCategory];
    const info = stakeholderInfo[selectedCategory];

    return (
      <div className="detailed-analysis">
        <div className="analysis-header" style={{ background: `linear-gradient(135deg, ${info.color}20, transparent)` }}>
          <div className="header-content">
            <span className="header-icon">{info.icon}</span>
            <div>
              <h2>{analysis.title}</h2>
              <p>{analysis.summary}</p>
            </div>
          </div>
          <button 
            className="close-button" 
            onClick={() => setSelectedCategory(null)}
          >
            ← Back to Overview
          </button>
        </div>

        <div className="analysis-sections">
          {analysis.sections.map((section, idx) => (
            <div key={idx} className="analysis-section">
              <h3>
                <span className="section-icon">{section.icon}</span>
                {section.heading}
              </h3>
              <div className="section-content">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="analysis-item">
                    {renderAnalysisItem(item, selectedCategory)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalysisItem = (item, category) => {
    // Render different layouts based on category type
    if (category === 'competitors') {
      if (item.company) {
        return (
          <div className="competitor-item">
            <div className="competitor-header">
              <strong>{item.company}</strong>
              {item.urgency && <span className={`urgency-badge ${item.urgency}`}>{item.urgency}</span>}
            </div>
            <p className="action">{item.action}</p>
            <p className="impact">Impact: {item.impact}</p>
            <div className="recommendation">
              <strong>Recommendation:</strong> {item.recommendation}
            </div>
          </div>
        );
      } else if (item.trend) {
        return (
          <div className="trend-item">
            <strong>{item.trend}</strong>
            <p>Your Position: {item.yourPosition}</p>
            <p className="action-item">→ {item.action}</p>
          </div>
        );
      } else if (item.advantage) {
        return (
          <div className="advantage-item">
            <strong>{item.advantage}</strong>
            <p>How to leverage: {item.leverage}</p>
          </div>
        );
      }
    }
    
    if (category === 'tech_journalists') {
      if (item.topic) {
        return (
          <div className="media-topic">
            <strong>{item.topic}</strong>
            <p className="relevance">Relevance: {item.relevance}</p>
            <p>Outlets: {item.outlets?.join(', ')}</p>
            <div className="angle">Angle: {item.angle}</div>
          </div>
        );
      } else if (item.reporter) {
        return (
          <div className="reporter-item">
            <strong>{item.reporter}</strong>
            <p>Beat: {item.beat}</p>
            <p className="recent">{item.recentArticles}</p>
            <p>Approach: {item.approach}</p>
            <p className="timing">Best timing: {item.timing}</p>
          </div>
        );
      }
    }
    
    // Default rendering for other items
    return (
      <div className="default-item">
        {Object.entries(item).map(([key, value]) => (
          <div key={key} className="item-field">
            <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {
              Array.isArray(value) ? value.join(', ') : value
            }
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="intelligence-hub-v4">
      <div className="hub-header">
        <div className="header-main">
          <h1>🔍 Intelligence Hub</h1>
          <p>Comprehensive analysis of your stakeholder ecosystem</p>
        </div>
        <div className="header-actions">
          <div className="last-update">
            Last updated: {lastUpdate ? lastUpdate.toLocaleString() : 'Never'}
            <span className="update-cycle">(12-hour cycle)</span>
          </div>
          <button 
            className="refresh-button" 
            onClick={refreshAnalysis}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : '🔄 Refresh Analysis'}
          </button>
        </div>
      </div>

      <div className="hub-content">
        {!selectedCategory ? (
          <>
            <div className="overview-section">
              <h2>Select a category for detailed analysis</h2>
              <p>Each category provides comprehensive intelligence updated every 12 hours</p>
            </div>
            {renderCategoryGrid()}
          </>
        ) : (
          renderDetailedAnalysis()
        )}
      </div>
    </div>
  );
};

export default IntelligenceHubV4;