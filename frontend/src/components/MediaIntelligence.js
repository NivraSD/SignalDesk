import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Users, Target, Brain, Zap, Map, BarChart, MessageSquare, Lightbulb, Coffee, Globe, Award } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import API_BASE_URL from '../config/api';

const MediaIntelligence = () => {
  const { selectedProject: activeProject } = useProject();
  // Search modes
  const [searchMode, setSearchMode] = useState('smart'); // smart, traditional, competitive, opportunity
  const [searchStep, setSearchStep] = useState(1);
  
  // Smart search builder
  const [searchContext, setSearchContext] = useState({
    what: '',       // What's your story about?
    why: '',        // Why is it newsworthy?
    when: '',       // Timing/urgency
    who: '',        // Target audience
    where: '',      // Geographic focus
    compete: '',    // Competitors to analyze
    angle: '',      // Story angle
    goal: ''        // What outcome do you want?
  });

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // overview, journalists, opportunities, insights, strategy

  // Intelligence data
  const [mediaLandscape, setMediaLandscape] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [competitiveIntel, setCompetitiveIntel] = useState(null);
  const [pitchAngles, setPitchAngles] = useState([]);
  const [conversationStarters, setConversationStarters] = useState([]);

  const token = localStorage.getItem('token');

  // Search templates for quick start
  const searchTemplates = [
    { 
      icon: '🚀', 
      title: 'Product Launch', 
      template: 'Find journalists who cover product launches and innovation in [industry]',
      context: { what: 'product launch', why: 'innovative features', goal: 'coverage in tech media' }
    },
    { 
      icon: '💰', 
      title: 'Funding News', 
      template: 'Media contacts for funding/investment stories in [sector]',
      context: { what: 'funding round', why: 'growth milestone', goal: 'business press coverage' }
    },
    { 
      icon: '🏆', 
      title: 'Award/Recognition', 
      template: 'Journalists interested in industry awards and achievements',
      context: { what: 'award win', why: 'industry recognition', goal: 'trade publication coverage' }
    },
    { 
      icon: '📊', 
      title: 'Research/Report', 
      template: 'Data journalists and reporters who cover industry research',
      context: { what: 'research findings', why: 'exclusive data', goal: 'data-driven stories' }
    },
    { 
      icon: '🎯', 
      title: 'Trend Commentary', 
      template: 'Thought leadership opportunities on [trending topic]',
      context: { what: 'expert commentary', why: 'trending topic', goal: 'thought leadership' }
    },
    { 
      icon: '🤝', 
      title: 'Partnership', 
      template: 'Business reporters covering strategic partnerships',
      context: { what: 'partnership announcement', why: 'strategic alliance', goal: 'business coverage' }
    }
  ];

  // Smart prompts for each step
  const smartPrompts = {
    1: [
      "I'm launching a new AI-powered tool for...",
      "We just discovered that...",
      "Our CEO wants to comment on...",
      "We're disrupting the industry by..."
    ],
    2: [
      "This matters because it solves...",
      "It's the first time anyone has...",
      "It affects millions of people who...",
      "It challenges the assumption that..."
    ],
    3: [
      "We need coverage before our competitor...",
      "This ties into the current news about...",
      "Perfect timing because of upcoming...",
      "We want to own the narrative on..."
    ]
  };

  // Perform intelligent media search
  const performIntelligentSearch = async () => {
    setIsSearching(true);
    
    try {
      // Build comprehensive search query from context
      const intelligentQuery = buildIntelligentQuery();
      
      // Call multiple endpoints in parallel for comprehensive intelligence
      const [journalists, landscape, opps, competitive, angles] = await Promise.all([
        searchJournalists(intelligentQuery),
        analyzeMediaLandscape(intelligentQuery),
        findOpportunities(intelligentQuery),
        analyzeCompetitors(intelligentQuery),
        generatePitchAngles(intelligentQuery)
      ]);

      setSearchResults({
        journalists: journalists || [],
        landscape: landscape || {},
        opportunities: opps || [],
        competitive: competitive || {},
        pitchAngles: angles || [],
        query: intelligentQuery,
        timestamp: new Date().toISOString()
      });

      setMediaLandscape(landscape);
      setOpportunities(opps);
      setCompetitiveIntel(competitive);
      setPitchAngles(angles);
      
      // Generate conversation starters
      generateConversationStarters(journalists);
      
    } catch (error) {
      console.error('Intelligent search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Build intelligent query from context
  const buildIntelligentQuery = () => {
    const parts = [];
    if (searchContext.what) parts.push(`Story: ${searchContext.what}`);
    if (searchContext.why) parts.push(`Newsworthiness: ${searchContext.why}`);
    if (searchContext.who) parts.push(`Audience: ${searchContext.who}`);
    if (searchContext.where) parts.push(`Location: ${searchContext.where}`);
    if (searchContext.angle) parts.push(`Angle: ${searchContext.angle}`);
    if (searchContext.compete) parts.push(`Competitors: ${searchContext.compete}`);
    if (searchContext.goal) parts.push(`Goal: ${searchContext.goal}`);
    
    return parts.join(' | ');
  };

  // Search journalists with enhanced intelligence
  const searchJournalists = async (query) => {
    try {
      const response = await fetch(`${API_BASE_URL}/media/search-journalists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          context: searchContext,
          projectId: activeProject?.id,
          includeAnalysis: true
        })
      });
      
      const data = await response.json();
      return data.journalists || [];
    } catch (error) {
      console.error('Journalist search failed:', error);
      return [];
    }
  };

  // Analyze media landscape
  const analyzeMediaLandscape = async (query) => {
    // This would call your research agents
    return {
      trendingTopics: [
        { topic: "AI Ethics", heat: 92, trend: "rising" },
        { topic: "Sustainability", heat: 87, trend: "stable" },
        { topic: "Remote Work", heat: 73, trend: "declining" }
      ],
      coverageGaps: [
        "No major outlet covering your specific niche",
        "Underserved geographic market identified",
        "Competitor weakness in trade publications"
      ],
      bestTiming: {
        day: "Tuesday",
        time: "10 AM EST",
        reason: "Highest engagement rates"
      }
    };
  };

  // Find opportunities
  const findOpportunities = async (query) => {
    return [
      {
        type: "News Hook",
        title: "Tie into upcoming industry conference",
        score: 95,
        urgency: "high",
        description: "Major conference next month - perfect for announcement"
      },
      {
        type: "Trend Jacking",
        title: "Connect to viral LinkedIn discussion",
        score: 88,
        urgency: "immediate",
        description: "CEO's post about your topic has 50K likes"
      },
      {
        type: "Data Story",
        title: "Exclusive research angle",
        score: 82,
        urgency: "medium",
        description: "Your data contradicts common assumption"
      }
    ];
  };

  // Analyze competitors
  const analyzeCompetitors = async (query) => {
    return {
      topCompetitorOutlets: [
        { outlet: "TechCrunch", count: 12, sentiment: "positive" },
        { outlet: "Forbes", count: 8, sentiment: "neutral" },
        { outlet: "WSJ", count: 5, sentiment: "positive" }
      ],
      uncoveredJournalists: [
        "Sarah Chen - Covers your competitors but not you",
        "Mike Johnson - Written 5 articles about similar companies",
        "Emily Rodriguez - Industry beat reporter you haven't pitched"
      ],
      competitorWeakness: "They don't engage on social media"
    };
  };

  // Generate pitch angles
  const generatePitchAngles = async (query) => {
    return [
      {
        angle: "David vs Goliath",
        score: 92,
        pitch: "Small startup challenges tech giants with innovative approach",
        bestFor: ["Business press", "Tech blogs"]
      },
      {
        angle: "Human Interest",
        score: 87,
        pitch: "Founder's personal journey from problem to solution",
        bestFor: ["Lifestyle media", "Podcasts"]
      },
      {
        angle: "Industry Disruption",
        score: 85,
        pitch: "Why traditional approach is broken and what's next",
        bestFor: ["Trade publications", "Industry analysts"]
      }
    ];
  };

  // Generate conversation starters
  const generateConversationStarters = (journalists) => {
    setConversationStarters([
      {
        journalist: "Sarah Chen",
        starter: "I noticed your piece on AI ethics last week. Have you considered the angle of...",
        platform: "Twitter",
        timing: "Reply to recent tweet"
      },
      {
        journalist: "Mike Johnson",
        starter: "Your analysis of the market was spot-on. I have exclusive data that shows...",
        platform: "LinkedIn",
        timing: "Comment on article"
      },
      {
        journalist: "Emily Rodriguez",
        starter: "Love your newsletter! Quick question about your take on...",
        platform: "Email",
        timing: "Tuesday morning"
      }
    ]);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <Brain style={styles.titleIcon} />
            Media Intelligence Platform
          </h1>
          <p style={styles.subtitle}>
            AI-powered media discovery, opportunity identification, and relationship intelligence
          </p>
        </div>
      </div>

      {/* Search Mode Selector */}
      <div style={styles.modeSelector}>
        <button
          onClick={() => setSearchMode('smart')}
          style={{
            ...styles.modeButton,
            ...(searchMode === 'smart' ? styles.modeButtonActive : {})
          }}
        >
          <Lightbulb size={16} />
          Smart Search
        </button>
        <button
          onClick={() => setSearchMode('traditional')}
          style={{
            ...styles.modeButton,
            ...(searchMode === 'traditional' ? styles.modeButtonActive : {})
          }}
        >
          <Search size={16} />
          Traditional
        </button>
        <button
          onClick={() => setSearchMode('competitive')}
          style={{
            ...styles.modeButton,
            ...(searchMode === 'competitive' ? styles.modeButtonActive : {})
          }}
        >
          <Target size={16} />
          Competitive Intel
        </button>
        <button
          onClick={() => setSearchMode('opportunity')}
          style={{
            ...styles.modeButton,
            ...(searchMode === 'opportunity' ? styles.modeButtonActive : {})
          }}
        >
          <TrendingUp size={16} />
          Opportunity Finder
        </button>
      </div>

      {/* Smart Search Builder */}
      {searchMode === 'smart' && (
        <div style={styles.smartSearch}>
          <div style={styles.searchProgress}>
            {[1, 2, 3].map(step => (
              <div
                key={step}
                style={{
                  ...styles.progressStep,
                  ...(step <= searchStep ? styles.progressStepActive : {})
                }}
              >
                {step === 1 && "What's Your Story?"}
                {step === 2 && "Why It Matters"}
                {step === 3 && "Your Goals"}
              </div>
            ))}
          </div>

          {searchStep === 1 && (
            <div style={styles.searchStepContent}>
              <h3 style={styles.stepTitle}>What's your story about?</h3>
              <div style={styles.promptSuggestions}>
                {smartPrompts[1].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchContext({...searchContext, what: prompt})}
                    style={styles.promptButton}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <textarea
                value={searchContext.what}
                onChange={(e) => setSearchContext({...searchContext, what: e.target.value})}
                placeholder="Describe your story in a compelling way..."
                style={styles.smartInput}
              />
              <button
                onClick={() => setSearchStep(2)}
                disabled={!searchContext.what}
                style={styles.nextButton}
              >
                Next: Why It Matters →
              </button>
            </div>
          )}

          {searchStep === 2 && (
            <div style={styles.searchStepContent}>
              <h3 style={styles.stepTitle}>Why is this newsworthy?</h3>
              <div style={styles.promptSuggestions}>
                {smartPrompts[2].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchContext({...searchContext, why: prompt})}
                    style={styles.promptButton}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <textarea
                value={searchContext.why}
                onChange={(e) => setSearchContext({...searchContext, why: e.target.value})}
                placeholder="Explain why journalists should care..."
                style={styles.smartInput}
              />
              <button
                onClick={() => setSearchStep(3)}
                disabled={!searchContext.why}
                style={styles.nextButton}
              >
                Next: Your Goals →
              </button>
            </div>
          )}

          {searchStep === 3 && (
            <div style={styles.searchStepContent}>
              <h3 style={styles.stepTitle}>What's your goal?</h3>
              <div style={styles.goalGrid}>
                <input
                  value={searchContext.goal}
                  onChange={(e) => setSearchContext({...searchContext, goal: e.target.value})}
                  placeholder="What outcome do you want?"
                  style={styles.smartInputSmall}
                />
                <input
                  value={searchContext.who}
                  onChange={(e) => setSearchContext({...searchContext, who: e.target.value})}
                  placeholder="Target audience?"
                  style={styles.smartInputSmall}
                />
                <input
                  value={searchContext.where}
                  onChange={(e) => setSearchContext({...searchContext, where: e.target.value})}
                  placeholder="Geographic focus?"
                  style={styles.smartInputSmall}
                />
                <input
                  value={searchContext.compete}
                  onChange={(e) => setSearchContext({...searchContext, compete: e.target.value})}
                  placeholder="Competitors to analyze?"
                  style={styles.smartInputSmall}
                />
              </div>
              <button
                onClick={performIntelligentSearch}
                disabled={isSearching}
                style={styles.searchButton}
              >
                {isSearching ? (
                  <>🔍 Analyzing Media Landscape...</>
                ) : (
                  <>🚀 Launch Intelligent Search</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Templates */}
      <div style={styles.templates}>
        <h3 style={styles.templateTitle}>Quick Start Templates</h3>
        <div style={styles.templateGrid}>
          {searchTemplates.map((template, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSearchContext(template.context);
                setSearchStep(3);
              }}
              style={styles.templateCard}
            >
              <span style={styles.templateIcon}>{template.icon}</span>
              <span style={styles.templateText}>{template.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {searchResults && (
        <div style={styles.results}>
          {/* View Tabs */}
          <div style={styles.viewTabs}>
            <button
              onClick={() => setActiveView('overview')}
              style={{
                ...styles.viewTab,
                ...(activeView === 'overview' ? styles.viewTabActive : {})
              }}
            >
              <Globe size={16} />
              Overview
            </button>
            <button
              onClick={() => setActiveView('journalists')}
              style={{
                ...styles.viewTab,
                ...(activeView === 'journalists' ? styles.viewTabActive : {})
              }}
            >
              <Users size={16} />
              Journalists ({searchResults.journalists?.length || 0})
            </button>
            <button
              onClick={() => setActiveView('opportunities')}
              style={{
                ...styles.viewTab,
                ...(activeView === 'opportunities' ? styles.viewTabActive : {})
              }}
            >
              <Zap size={16} />
              Opportunities
            </button>
            <button
              onClick={() => setActiveView('insights')}
              style={{
                ...styles.viewTab,
                ...(activeView === 'insights' ? styles.viewTabActive : {})
              }}
            >
              <BarChart size={16} />
              Insights
            </button>
            <button
              onClick={() => setActiveView('strategy')}
              style={{
                ...styles.viewTab,
                ...(activeView === 'strategy' ? styles.viewTabActive : {})
              }}
            >
              <Target size={16} />
              Strategy
            </button>
          </div>

          {/* Overview Dashboard */}
          {activeView === 'overview' && (
            <div style={styles.overviewDashboard}>
              <div style={styles.dashboardGrid}>
                {/* Media Landscape Heat Map */}
                <div style={styles.dashboardCard}>
                  <h3 style={styles.cardTitle}>
                    <Map size={16} />
                    Media Landscape
                  </h3>
                  {mediaLandscape?.trendingTopics?.map((topic, idx) => (
                    <div key={idx} style={styles.heatItem}>
                      <span>{topic.topic}</span>
                      <div style={styles.heatBar}>
                        <div
                          style={{
                            ...styles.heatFill,
                            width: `${topic.heat}%`,
                            backgroundColor: topic.heat > 80 ? '#ff6b6b' : topic.heat > 60 ? '#ffd93d' : '#4ecdc4'
                          }}
                        />
                      </div>
                      <span style={styles.trend}>
                        {topic.trend === 'rising' ? '📈' : topic.trend === 'declining' ? '📉' : '➡️'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Top Opportunities */}
                <div style={styles.dashboardCard}>
                  <h3 style={styles.cardTitle}>
                    <Zap size={16} />
                    Top Opportunities
                  </h3>
                  {opportunities.slice(0, 3).map((opp, idx) => (
                    <div key={idx} style={styles.oppItem}>
                      <div style={styles.oppHeader}>
                        <span style={styles.oppType}>{opp.type}</span>
                        <span style={{
                          ...styles.oppScore,
                          color: opp.score > 90 ? '#ff6b6b' : opp.score > 80 ? '#ffd93d' : '#4ecdc4'
                        }}>
                          {opp.score}
                        </span>
                      </div>
                      <div style={styles.oppTitle}>{opp.title}</div>
                      <div style={styles.oppDesc}>{opp.description}</div>
                      <div style={{
                        ...styles.oppUrgency,
                        backgroundColor: opp.urgency === 'high' ? '#ffe0e0' : opp.urgency === 'immediate' ? '#ffcccc' : '#fff5e0'
                      }}>
                        ⏰ {opp.urgency} urgency
                      </div>
                    </div>
                  ))}
                </div>

                {/* Competitive Intel */}
                <div style={styles.dashboardCard}>
                  <h3 style={styles.cardTitle}>
                    <Target size={16} />
                    Competitive Intel
                  </h3>
                  <div style={styles.competitiveSection}>
                    <h4>Where Competitors Get Coverage:</h4>
                    {competitiveIntel?.topCompetitorOutlets?.map((outlet, idx) => (
                      <div key={idx} style={styles.outletItem}>
                        <span>{outlet.outlet}</span>
                        <span style={styles.outletCount}>{outlet.count} articles</span>
                      </div>
                    ))}
                  </div>
                  <div style={styles.competitiveSection}>
                    <h4>Journalists You're Missing:</h4>
                    {competitiveIntel?.uncoveredJournalists?.map((journalist, idx) => (
                      <div key={idx} style={styles.missedJournalist}>
                        • {journalist}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Pitch Angles */}
                <div style={styles.dashboardCard}>
                  <h3 style={styles.cardTitle}>
                    <MessageSquare size={16} />
                    AI-Generated Pitch Angles
                  </h3>
                  {pitchAngles.map((angle, idx) => (
                    <div key={idx} style={styles.angleCard}>
                      <div style={styles.angleHeader}>
                        <span style={styles.angleTitle}>{angle.angle}</span>
                        <span style={styles.angleScore}>{angle.score}%</span>
                      </div>
                      <div style={styles.anglePitch}>{angle.pitch}</div>
                      <div style={styles.angleBest}>
                        Best for: {angle.bestFor.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversation Starters */}
              <div style={styles.conversationSection}>
                <h3 style={styles.cardTitle}>
                  <Coffee size={16} />
                  Conversation Starters (Relationship Building)
                </h3>
                <div style={styles.conversationGrid}>
                  {conversationStarters.map((starter, idx) => (
                    <div key={idx} style={styles.conversationCard}>
                      <div style={styles.conversationHeader}>
                        <span style={styles.journalistName}>{starter.journalist}</span>
                        <span style={styles.platform}>{starter.platform}</span>
                      </div>
                      <div style={styles.starterText}>"{starter.starter}"</div>
                      <div style={styles.timing}>Best timing: {starter.timing}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other views would go here... */}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    color: 'white'
  },
  headerContent: {
    textAlign: 'center'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  titleIcon: {
    width: '32px',
    height: '32px'
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.9,
    margin: 0
  },
  modeSelector: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    justifyContent: 'center'
  },
  modeButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'all 0.3s ease'
  },
  modeButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: '2px solid transparent'
  },
  smartSearch: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  },
  searchProgress: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '30px'
  },
  progressStep: {
    flex: 1,
    padding: '10px',
    textAlign: 'center',
    borderBottom: '3px solid #e0e0e0',
    color: '#999',
    fontSize: '14px'
  },
  progressStepActive: {
    borderBottom: '3px solid #667eea',
    color: '#667eea',
    fontWeight: 'bold'
  },
  searchStepContent: {
    maxWidth: '600px',
    margin: '0 auto'
  },
  stepTitle: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#333'
  },
  promptSuggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px'
  },
  promptButton: {
    padding: '8px 15px',
    borderRadius: '20px',
    border: '1px solid #667eea',
    background: '#f8f9ff',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.3s ease'
  },
  smartInput: {
    width: '100%',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    fontSize: '16px',
    marginBottom: '20px',
    minHeight: '100px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  smartInputSmall: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  nextButton: {
    padding: '12px 30px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  goalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '20px'
  },
  searchButton: {
    width: '100%',
    padding: '15px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  templates: {
    marginBottom: '30px'
  },
  templateTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#333'
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px'
  },
  templateCard: {
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease'
  },
  templateIcon: {
    fontSize: '20px'
  },
  templateText: {
    fontSize: '14px',
    color: '#333'
  },
  results: {
    marginTop: '30px'
  },
  viewTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px'
  },
  viewTab: {
    padding: '10px 20px',
    background: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
    borderRadius: '8px 8px 0 0'
  },
  viewTabActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  overviewDashboard: {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  dashboardCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#333'
  },
  heatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
    fontSize: '14px'
  },
  heatBar: {
    flex: 1,
    height: '8px',
    background: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  heatFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  trend: {
    fontSize: '16px'
  },
  oppItem: {
    padding: '15px',
    background: '#f8f9ff',
    borderRadius: '8px',
    marginBottom: '10px'
  },
  oppHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  oppType: {
    fontSize: '12px',
    color: '#667eea',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  oppScore: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  oppTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#333'
  },
  oppDesc: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px'
  },
  oppUrgency: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  competitiveSection: {
    marginBottom: '15px'
  },
  outletItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    background: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '5px',
    fontSize: '14px'
  },
  outletCount: {
    color: '#667eea',
    fontWeight: 'bold'
  },
  missedJournalist: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px'
  },
  angleCard: {
    padding: '12px',
    background: '#fff5f0',
    borderRadius: '8px',
    marginBottom: '10px'
  },
  angleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  angleTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ff6b6b'
  },
  angleScore: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  anglePitch: {
    fontSize: '13px',
    color: '#333',
    marginBottom: '8px'
  },
  angleBest: {
    fontSize: '12px',
    color: '#999'
  },
  conversationSection: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px'
  },
  conversationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  conversationCard: {
    padding: '15px',
    background: '#f0f8ff',
    borderRadius: '8px'
  },
  conversationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  journalistName: {
    fontWeight: 'bold',
    color: '#333'
  },
  platform: {
    fontSize: '12px',
    padding: '2px 8px',
    background: '#667eea',
    color: 'white',
    borderRadius: '4px'
  },
  starterText: {
    fontSize: '13px',
    fontStyle: 'italic',
    color: '#555',
    marginBottom: '8px'
  },
  timing: {
    fontSize: '12px',
    color: '#999'
  }
};

export default MediaIntelligence;