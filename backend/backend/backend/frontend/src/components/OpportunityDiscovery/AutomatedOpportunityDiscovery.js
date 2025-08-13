import React, { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, AlertCircle, Clock, Target, 
  MessageSquare, FileText, Users, Mic, ChevronRight,
  BarChart3, Activity, ExternalLink, Search
} from 'lucide-react';
import narrativeVacuumService from '../../services/narrativeVacuumService';
import intelligentMonitoringAgent from '../../services/intelligentMonitoringAgent';
import prDetectionService from '../../services/prDetectionService';
import API_BASE_URL from '../../config/api';

const AutomatedOpportunityDiscovery = () => {
  const [step, setStep] = useState('setup');
  const [profile, setProfile] = useState({
    company: '',
    url: '',
    industry: '',
    expertise: [],
    goals: '',
    competitors: []
  });
  const [opportunities, setOpportunities] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Expertise options based on industry
  const expertiseOptions = {
    technology: ['AI/ML', 'Cloud Computing', 'Cybersecurity', 'Data Analytics', 'DevOps', 'Mobile', 'Blockchain', 'IoT'],
    finance: ['Fintech', 'Investment', 'Banking', 'Insurance', 'Cryptocurrency', 'Payments', 'Wealth Management'],
    healthcare: ['Digital Health', 'Biotech', 'Medical Devices', 'Telemedicine', 'Clinical Research', 'Healthcare IT'],
    retail: ['E-commerce', 'Supply Chain', 'Customer Experience', 'Omnichannel', 'Sustainability', 'D2C']
  };

  // Analyze company from URL
  const analyzeCompanyFromURL = async () => {
    if (!profile.url) return;
    
    setIsAnalyzing(true);
    try {
      // Fetch and analyze the website
      const response = await fetch(`${API_BASE_URL}/proxy/analyze-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: profile.url })
      }).catch(() => null);

      if (response && response.ok) {
        const analysis = await response.json();
        // Extract company info from website
        if (analysis.companyName) {
          setProfile(prev => ({ ...prev, company: analysis.companyName }));
        }
      }
    } catch (error) {
      console.log('Could not analyze website, manual entry required');
    }
    setIsAnalyzing(false);
  };

  // Start automated monitoring
  const startOpportunityDiscovery = async () => {
    setStep('monitoring');
    setMonitoringActive(true);
    
    // Start monitoring for opportunities
    runOpportunityDetection();
    
    // Set up continuous monitoring (every 5 minutes)
    const interval = setInterval(() => {
      runOpportunityDetection();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  };

  // Run opportunity detection
  const runOpportunityDetection = async () => {
    console.log('🔍 Scanning for narrative vacuums...');
    
    const discoveredOpportunities = [];
    
    // 1. Fetch current trending topics
    const trendingTopics = await fetchTrendingTopics();
    
    // 2. Analyze each topic for narrative vacuum
    for (const topic of trendingTopics) {
      // Create client profile for NVS calculation
      const clientProfile = {
        company: profile.company,
        industry: profile.industry,
        competitors: profile.competitors || [],
        expertiseAreas: profile.expertise.reduce((acc, skill) => {
          acc[skill] = 0.8; // High expertise score
          return acc;
        }, {}),
        executiveMediaScore: 0.7,
        proprietaryData: true
      };

      const nvsResult = await narrativeVacuumService.calculateNVS(
        topic.title, 
        clientProfile, 
        {
          daysSinceEmerged: topic.pubDate ? 
            Math.floor((Date.now() - new Date(topic.pubDate)) / (1000 * 60 * 60 * 24)) : 0,
          category: 'thought_leadership'
        }
      );

      const nvsScore = nvsResult.score || 0;

      if (nvsScore > 60) { // High opportunity threshold
        const opportunity = {
          id: `opp-${Date.now()}-${Math.random()}`,
          score: nvsScore,
          topic: topic.title,
          type: determineOpportunityType(topic),
          urgency: nvsResult.urgency || calculateUrgency(topic),
          description: topic.description || topic.snippet,
          action: nvsResult.action || generateActionPlan(topic, nvsScore),
          platforms: recommendPlatforms(topic),
          talkingPoints: generateTalkingPoints(topic, profile),
          timeframe: nvsResult.action?.timeframe || determineTimeframe(nvsScore),
          source: topic.source,
          explanation: nvsResult.explanation
        };
        
        discoveredOpportunities.push(opportunity);
      }
    }

    // 3. Sort by NVS score
    discoveredOpportunities.sort((a, b) => b.score - a.score);
    
    // 4. Update state
    setOpportunities(discoveredOpportunities);
    setLastUpdate(new Date());
    
    console.log(`✅ Found ${discoveredOpportunities.length} opportunities`);
  };

  // Fetch trending topics from multiple sources
  const fetchTrendingTopics = async () => {
    const topics = [];
    
    try {
      // Fetch from Google News
      const newsResponse = await fetch(`${API_BASE_URL}/proxy/google-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `${profile.industry} trends ${new Date().getFullYear()}`
        })
      });
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        if (newsData.articles) {
          newsData.articles.slice(0, 10).forEach(article => {
            topics.push({
              title: article.title,
              description: article.snippet,
              source: 'Google News',
              url: article.link,
              pubDate: article.pubDate,
              volume: Math.floor(Math.random() * 100), // Would be calculated from real metrics
              companyMentions: article.title.toLowerCase().includes(profile.company.toLowerCase()) ? 1 : 0
            });
          });
        }
      }

      // Fetch from Reddit
      const redditResponse = await fetch(`${API_BASE_URL}/proxy/reddit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: profile.industry
        })
      });
      
      if (redditResponse.ok) {
        const redditData = await redditResponse.json();
        if (redditData.posts) {
          redditData.posts.slice(0, 5).forEach(post => {
            topics.push({
              title: post.title,
              description: post.selftext?.substring(0, 200),
              source: 'Reddit',
              url: post.url,
              volume: post.score / 100, // Reddit score as volume indicator
              companyMentions: post.title.toLowerCase().includes(profile.company.toLowerCase()) ? 1 : 0,
              engagement: post.num_comments
            });
          });
        }
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    }
    
    return topics;
  };

  // Calculate expertise match
  const calculateExpertiseMatch = (topic, expertise) => {
    const topicLower = topic.toLowerCase();
    let matchScore = 0;
    
    expertise.forEach(skill => {
      if (topicLower.includes(skill.toLowerCase())) {
        matchScore += 100;
      } else {
        // Partial matches
        const words = skill.toLowerCase().split(/[\s/]+/);
        words.forEach(word => {
          if (word.length > 3 && topicLower.includes(word)) {
            matchScore += 50;
          }
        });
      }
    });
    
    return Math.min(matchScore, 100);
  };

  // Determine opportunity type
  const determineOpportunityType = (topic) => {
    const title = topic.title.toLowerCase();
    
    if (title.includes('announce') || title.includes('launch')) return 'product_launch';
    if (title.includes('trend') || title.includes('future')) return 'thought_leadership';
    if (title.includes('problem') || title.includes('issue')) return 'problem_solving';
    if (title.includes('study') || title.includes('report')) return 'data_commentary';
    if (title.includes('acquisition') || title.includes('funding')) return 'industry_news';
    
    return 'general_commentary';
  };

  // Calculate urgency
  const calculateUrgency = (topic) => {
    // Check how fresh the topic is
    if (topic.pubDate) {
      const hoursSince = (Date.now() - new Date(topic.pubDate)) / (1000 * 60 * 60);
      if (hoursSince < 6) return 'immediate';
      if (hoursSince < 24) return 'high';
      if (hoursSince < 72) return 'medium';
    }
    return 'low';
  };

  // Generate action plan
  const generateActionPlan = (topic, nvsScore) => {
    if (nvsScore > 80) {
      return {
        primary: 'Write and publish thought leadership article',
        secondary: 'Pitch expert commentary to media',
        social: 'Create LinkedIn post with unique perspective'
      };
    } else if (nvsScore > 60) {
      return {
        primary: 'Create social media content',
        secondary: 'Engage in discussions',
        social: 'Share insights on Twitter/LinkedIn'
      };
    }
    return {
      primary: 'Monitor and prepare content',
      secondary: 'Gather more data',
      social: 'Engage when timing improves'
    };
  };

  // Recommend platforms
  const recommendPlatforms = (topic) => {
    const platforms = [];
    
    if (topic.source === 'Google News') {
      platforms.push({ name: 'Media Pitch', icon: FileText, action: 'Pitch to journalists' });
    }
    
    if (topic.engagement > 100 || topic.source === 'Reddit') {
      platforms.push({ name: 'Reddit', icon: MessageSquare, action: 'Join discussion' });
    }
    
    // Always include LinkedIn for B2B
    platforms.push({ name: 'LinkedIn', icon: Users, action: 'Share perspective' });
    
    if (topic.volume > 70) {
      platforms.push({ name: 'Webinar', icon: Mic, action: 'Host expert session' });
    }
    
    return platforms;
  };

  // Generate talking points
  const generateTalkingPoints = (topic, profile) => {
    const points = [];
    
    // Expertise-based points
    profile.expertise.forEach(skill => {
      if (topic.title.toLowerCase().includes(skill.toLowerCase())) {
        points.push(`How ${skill} addresses this challenge`);
        points.push(`Our experience with ${skill} in this context`);
      }
    });
    
    // Goal-based points
    if (profile.goals.includes('thought leadership')) {
      points.push('Industry-wide implications and future trends');
    }
    if (profile.goals.includes('product')) {
      points.push('How our solution uniquely addresses this');
    }
    
    // Generic valuable points
    points.push('Data and metrics from our experience');
    points.push('Contrarian or unique perspective');
    points.push('Actionable advice for the audience');
    
    return points.slice(0, 3);
  };

  // Determine timeframe
  const determineTimeframe = (nvsScore) => {
    if (nvsScore > 80) return '24 hours';
    if (nvsScore > 60) return '48-72 hours';
    return 'This week';
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency?.toUpperCase()) {
      case 'IMMEDIATE': return '#ef4444';
      case 'TODAY': return '#f59e0b';
      case 'THIS_WEEK': return '#6366f1';
      case 'MONITOR': return '#6b7280';
      case 'immediate': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#6366f1';
      default: return '#6b7280';
    }
  };

  const getOpportunityIcon = (type) => {
    switch(type) {
      case 'product_launch': return Zap;
      case 'thought_leadership': return TrendingUp;
      case 'problem_solving': return Target;
      case 'data_commentary': return BarChart3;
      default: return MessageSquare;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Setup Step */}
      {step === 'setup' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '0.75rem', 
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Automated Opportunity Discovery
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              We'll find narrative gaps your organization can fill
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              startOpportunityDiscovery();
            }}>
              {/* Company Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Organization Name
                </label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  placeholder="e.g., Acme Corp"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Website URL */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Website URL
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="url"
                    value={profile.url}
                    onChange={(e) => setProfile({ ...profile, url: e.target.value })}
                    onBlur={analyzeCompanyFromURL}
                    placeholder="https://www.example.com"
                    required
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '1rem'
                    }}
                  />
                  {isAnalyzing && (
                    <div style={{ 
                      padding: '0.75rem',
                      color: '#6366f1',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Activity size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  We'll analyze your website to understand your expertise
                </p>
              </div>

              {/* Industry */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Industry
                </label>
                <select
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select your industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail</option>
                </select>
              </div>

              {/* Expertise Areas */}
              {profile.industry && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Core Expertise (Select all that apply)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {expertiseOptions[profile.industry]?.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          if (profile.expertise.includes(skill)) {
                            setProfile({ 
                              ...profile, 
                              expertise: profile.expertise.filter(s => s !== skill)
                            });
                          } else {
                            setProfile({ 
                              ...profile, 
                              expertise: [...profile.expertise, skill]
                            });
                          }
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: profile.expertise.includes(skill) ? '#6366f1' : 'white',
                          color: profile.expertise.includes(skill) ? 'white' : '#374151',
                          border: `1px solid ${profile.expertise.includes(skill) ? '#6366f1' : '#e5e7eb'}`,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Current Goals
                </label>
                <textarea
                  value={profile.goals}
                  onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                  placeholder="e.g., Launch new product, establish thought leadership, prepare for funding round..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!profile.company || !profile.url || !profile.industry || profile.expertise.length === 0}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: profile.expertise.length > 0 ? '#6366f1' : '#e5e7eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: profile.expertise.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Search size={20} />
                Start Finding Opportunities
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Monitoring Dashboard */}
      {step === 'monitoring' && (
        <div>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '0.75rem',
            padding: '2rem',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Narrative Vacuum Scanner
                </h1>
                <p style={{ opacity: 0.9, marginBottom: '1rem' }}>
                  Finding gaps in the conversation for {profile.company}
                </p>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Opportunities Found</p>
                    <p style={{ fontSize: '2rem', fontWeight: '700' }}>{opportunities.length}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Avg. NVS Score</p>
                    <p style={{ fontSize: '2rem', fontWeight: '700' }}>
                      {opportunities.length > 0 
                        ? Math.round(opportunities.reduce((a, b) => a + b.score, 0) / opportunities.length)
                        : 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Last Scan</p>
                    <p style={{ fontSize: '0.875rem' }}>
                      {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Scanning...'}
                    </p>
                  </div>
                </div>
              </div>
              
              {monitoringActive && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '2rem'
                }}>
                  <Activity size={16} style={{ animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '0.875rem' }}>Live Monitoring</span>
                </div>
              )}
            </div>
          </div>

          {/* Opportunities List */}
          {opportunities.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '4rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <Activity size={48} style={{ 
                margin: '0 auto 1rem', 
                color: '#6366f1',
                animation: 'spin 2s linear infinite'
              }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Scanning for Narrative Vacuums
              </h2>
              <p style={{ color: '#6b7280' }}>
                Analyzing trending topics and identifying gaps...
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {opportunities.map(opp => {
                const Icon = getOpportunityIcon(opp.type);
                return (
                  <div key={opp.id} style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${getUrgencyColor(opp.urgency)}`
                  }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      {/* Score Badge */}
                      <div style={{
                        minWidth: '80px',
                        height: '80px',
                        background: `linear-gradient(135deg, ${
                          opp.score > 80 ? '#10b981' : 
                          opp.score > 60 ? '#6366f1' : '#f59e0b'
                        } 0%, ${
                          opp.score > 80 ? '#059669' : 
                          opp.score > 60 ? '#4f46e5' : '#d97706'
                        } 100%)`,
                        borderRadius: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                          {Math.round(opp.score)}
                        </div>
                        <div style={{ fontSize: '0.625rem', textTransform: 'uppercase' }}>
                          NVS
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <Icon size={20} style={{ color: '#6366f1' }} />
                              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                                {opp.topic}
                              </h3>
                            </div>
                            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                              {opp.description}
                            </p>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            background: getUrgencyColor(opp.urgency) + '20',
                            borderRadius: '1rem'
                          }}>
                            <Clock size={14} style={{ color: getUrgencyColor(opp.urgency) }} />
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              color: getUrgencyColor(opp.urgency)
                            }}>
                              {opp.timeframe}
                            </span>
                          </div>
                        </div>

                        {/* Action Plan */}
                        <div style={{
                          background: '#f9fafb',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <h4 style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            color: '#111827'
                          }}>
                            Recommended Action
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <ChevronRight size={16} style={{ color: '#6366f1' }} />
                              <span style={{ fontSize: '0.875rem' }}>
                                <strong>Action:</strong> {opp.action?.description || opp.action?.primary || opp.action}
                              </span>
                            </div>
                            {opp.action?.secondary && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ChevronRight size={16} style={{ color: '#6366f1' }} />
                                <span style={{ fontSize: '0.875rem' }}>
                                  <strong>Secondary:</strong> {opp.action.secondary}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Talking Points */}
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            marginBottom: '0.5rem',
                            color: '#111827'
                          }}>
                            Key Talking Points
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {opp.talkingPoints.map((point, idx) => (
                              <span key={idx} style={{
                                padding: '0.25rem 0.75rem',
                                background: '#e0e7ff',
                                borderRadius: '1rem',
                                fontSize: '0.813rem',
                                color: '#4f46e5'
                              }}>
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Platforms */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          {opp.platforms.map((platform, idx) => {
                            const PlatformIcon = platform.icon;
                            return (
                              <button key={idx} style={{
                                padding: '0.5rem 1rem',
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.375rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#6366f1';
                                e.currentTarget.style.background = '#f0f9ff';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.background = 'white';
                              }}>
                                <PlatformIcon size={16} />
                                <span>{platform.name}</span>
                                <ExternalLink size={12} style={{ opacity: 0.5 }} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={runOpportunityDetection}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              padding: '1rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Activity size={24} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AutomatedOpportunityDiscovery;