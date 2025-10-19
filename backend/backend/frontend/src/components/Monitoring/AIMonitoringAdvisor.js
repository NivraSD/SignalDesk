import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import API_BASE_URL from '../../config/api';
import './AIMonitoringAdvisor.css';
import {
  MessageSquare,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Target,
  Brain,
  Activity,
  Shield,
  Zap,
  ArrowRight,
  Plus,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ChevronRight,
  BarChart3,
  Users,
  Globe,
  Lightbulb
} from 'lucide-react';

const AIMonitoringAdvisor = () => {
  // Setup flow states
  const [setupStage, setSetupStage] = useState('welcome'); // welcome, brand-discovery, strategy-generation, complete
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [brandProfile, setBrandProfile] = useState({
    name: '',
    description: '',
    competitors: [],
    industries: [],
    products: [],
    targetAudience: '',
    markets: [],
    concerns: []
  });
  const [responses, setResponses] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Monitoring states
  const [monitoringStrategy, setMonitoringStrategy] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // overview, feed, opportunities, patterns
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // all, opportunities, risks, competitors, trends
    timeframe: '24h'
  });

  // Metrics states
  const [metrics, setMetrics] = useState({
    brandHealth: 75,
    healthTrend: '+2.3%',
    competitivePosition: 'gaining',
    opportunityCount: 7,
    urgentOpportunities: 3,
    riskLevel: 'moderate',
    activeRisks: 2
  });

  // Brand discovery questions
  const brandDiscoveryQuestions = [
    {
      id: 'brand',
      question: "Tell me about your brand or company. What do you do?",
      placeholder: "We're a technology company that specializes in...",
      key: 'description'
    },
    {
      id: 'competitors',
      question: "Who are your main competitors?",
      placeholder: "Microsoft, Google, Amazon...",
      key: 'competitors',
      type: 'list'
    },
    {
      id: 'industries',
      question: "What industries or sectors do you operate in?",
      placeholder: "Cloud computing, AI, Enterprise software...",
      key: 'industries',
      type: 'list'
    },
    {
      id: 'products',
      question: "What are your key products or services?",
      placeholder: "Our main offerings include...",
      key: 'products',
      type: 'list'
    },
    {
      id: 'audience',
      question: "Who is your target audience?",
      placeholder: "Enterprise customers, developers, consumers...",
      key: 'targetAudience'
    },
    {
      id: 'markets',
      question: "What regions or markets are you active in?",
      placeholder: "North America, Europe, Asia...",
      key: 'markets',
      type: 'list'
    },
    {
      id: 'concerns',
      question: "What are your biggest PR or reputation concerns right now?",
      placeholder: "Data privacy, competition, market perception...",
      key: 'concerns',
      type: 'list'
    }
  ];

  // Generate monitoring strategy based on brand profile
  const generateMonitoringStrategy = async () => {
    setIsGenerating(true);
    try {
      // In a real implementation, this would call Claude to analyze the brand profile
      // For now, we'll create a comprehensive strategy based on the inputs
      const strategy = {
        primaryKeywords: [
          brandProfile.name,
          ...brandProfile.products.slice(0, 3)
        ].filter(Boolean),
        
        competitorKeywords: brandProfile.competitors,
        
        industryKeywords: brandProfile.industries.map(ind => ind.toLowerCase()),
        
        riskKeywords: [
          ...brandProfile.concerns,
          'lawsuit', 'breach', 'scandal', 'investigation'
        ],
        
        opportunityKeywords: [
          'award', 'innovation', 'partnership', 'acquisition',
          'market leader', 'breakthrough'
        ],
        
        sources: {
          rssCategoriesPriority: determineRSSCategories(brandProfile),
          specificRSSFeeds: [],
          websitesToMonitor: generateCompetitorWebsites(brandProfile.competitors),
          socialMediaPlatforms: ['Twitter', 'LinkedIn', 'Reddit'],
          regulatorySources: brandProfile.industries.includes('finance') ? ['SEC', 'FINRA'] : [],
          patentDatabases: brandProfile.industries.includes('technology') ? ['USPTO', 'EPO'] : []
        },
        
        sentimentContext: {
          positiveSignals: `${brandProfile.name} innovation, customer satisfaction, market growth, successful ${brandProfile.products.join(', ')}`,
          negativeSignals: `${brandProfile.name} issues, ${brandProfile.concerns.join(', ')}, customer complaints`,
          criticalSignals: `${brandProfile.name} breach, executive scandal, major outage, regulatory action`,
          opportunitySignals: 'industry gap, competitor weakness, market need, emerging trend'
        },
        
        monitoringCadence: 'real-time',
        alertThresholds: {
          sentiment: -50,
          urgency: 'high',
          competitorMentions: 10,
          cascadePotential: 70
        }
      };
      
      setMonitoringStrategy(strategy);
      setSetupStage('complete');
      
      // Save strategy
      await saveMonitoringStrategy(strategy);
      
    } catch (error) {
      console.error('Error generating strategy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper functions
  const determineRSSCategories = (profile) => {
    const categories = ['general_news'];
    if (profile.industries.some(i => i.toLowerCase().includes('tech'))) {
      categories.push('technology', 'startups');
    }
    if (profile.industries.some(i => i.toLowerCase().includes('finance'))) {
      categories.push('business', 'finance');
    }
    return categories;
  };

  const generateCompetitorWebsites = (competitors) => {
    return competitors.map(comp => ({
      name: comp,
      url: `https://www.${comp.toLowerCase().replace(/\s+/g, '')}.com/news`,
      type: 'competitor'
    }));
  };

  const saveMonitoringStrategy = async (strategy) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/monitoring/save-strategy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brandProfile,
          strategy,
          setupComplete: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save strategy');
      }
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  };

  // Fetch mentions with enhanced analysis
  const fetchEnhancedMentions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/monitoring/fetch-enhanced`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strategy: monitoringStrategy,
          includeOpportunities: true,
          includeCascadeAnalysis: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setMentions(data.mentions);
        updateMetrics(data.mentions);
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMetrics = (mentions) => {
    // Calculate metrics from mentions
    const opportunities = mentions.filter(m => m.opportunityScore > 70);
    const risks = mentions.filter(m => m.sentiment === 'negative' && m.urgency === 'high');
    
    setMetrics({
      brandHealth: calculateBrandHealth(mentions),
      healthTrend: calculateTrend(mentions),
      competitivePosition: calculateCompetitivePosition(mentions),
      opportunityCount: opportunities.length,
      urgentOpportunities: opportunities.filter(o => o.urgency === 'high').length,
      riskLevel: risks.length > 5 ? 'high' : risks.length > 2 ? 'moderate' : 'low',
      activeRisks: risks.length
    });
  };

  const calculateBrandHealth = (mentions) => {
    const sentiments = mentions.map(m => m.sentimentScore || 0);
    const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    return Math.round(50 + (avg / 2)); // Convert -100 to 100 scale to 0-100
  };

  const calculateTrend = (mentions) => {
    // In real implementation, compare with historical data
    return '+2.3%';
  };

  const calculateCompetitivePosition = (mentions) => {
    const competitorMentions = mentions.filter(m => 
      m.content.toLowerCase().includes('competitor') || 
      monitoringStrategy?.competitorKeywords.some(k => m.content.toLowerCase().includes(k.toLowerCase()))
    );
    return competitorMentions.length > mentions.length / 2 ? 'losing' : 'gaining';
  };

  // Render functions
  const renderWelcome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI Monitoring Advisor</h1>
            <p className="text-xl text-gray-600 mb-8">
              Let's build an intelligent monitoring strategy tailored to your brand
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-50 rounded-xl p-6">
              <Target className="w-10 h-10 text-blue-600 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Smart Discovery</h3>
              <p className="text-sm text-gray-600">
                I'll learn about your brand and identify what matters most
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6">
              <Sparkles className="w-10 h-10 text-purple-600 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Opportunity Detection</h3>
              <p className="text-sm text-gray-600">
                Find narrative gaps and competitive advantages
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-6">
              <Shield className="w-10 h-10 text-green-600 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Risk Intelligence</h3>
              <p className="text-sm text-gray-600">
                Stay ahead of potential issues before they escalate
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setSetupStage('brand-discovery')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            Start Building Your Strategy
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderBrandDiscovery = () => {
    const currentQ = brandDiscoveryQuestions[currentQuestion];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Building your profile</span>
                <span>{currentQuestion + 1} of {brandDiscoveryQuestions.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / brandDiscoveryQuestions.length) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Question */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-purple-600" />
                {currentQ.question}
              </h2>
              
              {currentQ.type === 'list' ? (
                <div className="space-y-3">
                  <textarea
                    value={responses[currentQ.key] || ''}
                    onChange={(e) => setResponses({ ...responses, [currentQ.key]: e.target.value })}
                    placeholder={currentQ.placeholder}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    Separate multiple items with commas
                  </p>
                </div>
              ) : (
                <textarea
                  value={responses[currentQ.key] || ''}
                  onChange={(e) => setResponses({ ...responses, [currentQ.key]: e.target.value })}
                  placeholder={currentQ.placeholder}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                  rows={4}
                />
              )}
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <button
                onClick={() => {
                  // Save response to brand profile
                  const value = responses[currentQ.key];
                  if (currentQ.type === 'list') {
                    setBrandProfile({
                      ...brandProfile,
                      [currentQ.key]: value.split(',').map(s => s.trim()).filter(Boolean)
                    });
                  } else {
                    setBrandProfile({
                      ...brandProfile,
                      [currentQ.key]: value
                    });
                  }
                  
                  if (currentQuestion < brandDiscoveryQuestions.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                  } else {
                    setSetupStage('strategy-generation');
                    generateMonitoringStrategy();
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                {currentQuestion < brandDiscoveryQuestions.length - 1 ? 'Next' : 'Generate Strategy'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStrategyGeneration = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-2xl">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Generating Your Strategy</h2>
          <p className="text-xl text-gray-600">
            I'm analyzing your brand profile and creating a comprehensive monitoring strategy...
          </p>
        </div>
        
        <div className="space-y-4 text-left bg-gray-50 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 animate-pulse" />
            <span>Analyzing brand identity and market position</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 animate-pulse" />
            <span>Identifying key competitors and industry dynamics</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse" />
            <span>Building opportunity detection parameters</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-300" />
            <span className="text-gray-500">Configuring risk monitoring thresholds</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Monitoring Advisor</h1>
              <p className="text-sm text-gray-600">
                Intelligent monitoring for {brandProfile.name || 'your brand'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchEnhancedMentions}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* View Tabs */}
        <div className="px-6 flex gap-6 border-t">
          {[
            { id: 'overview', label: 'Strategic Overview', icon: BarChart3 },
            { id: 'feed', label: 'Intelligent Feed', icon: Activity },
            { id: 'opportunities', label: 'Opportunities', icon: Lightbulb },
            { id: 'patterns', label: 'Patterns', icon: Eye }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                activeView === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeView === 'overview' && renderStrategicOverview()}
        {activeView === 'feed' && renderIntelligentFeed()}
        {activeView === 'opportunities' && renderOpportunities()}
        {activeView === 'patterns' && renderPatterns()}
      </div>
    </div>
  );

  const renderStrategicOverview = () => (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Brand Health Score"
          value={`${metrics.brandHealth}%`}
          trend={metrics.healthTrend}
          icon={Activity}
          color="blue"
          insight="Based on sentiment across all monitored sources"
        />
        <MetricCard
          title="Competitive Position"
          value={metrics.competitivePosition}
          icon={TrendingUp}
          color="green"
          comparison="vs. main competitors"
          insight={`You're ${metrics.competitivePosition} ground in innovation mentions`}
        />
        <MetricCard
          title="Opportunity Signals"
          value={metrics.opportunityCount}
          urgent={metrics.urgentOpportunities}
          icon={Zap}
          color="purple"
          insight={`${metrics.urgentOpportunities} require immediate attention`}
        />
        <MetricCard
          title="Risk Indicators"
          value={metrics.riskLevel}
          alerts={metrics.activeRisks}
          icon={AlertCircle}
          color="red"
          insight={`${metrics.activeRisks} active risks being monitored`}
        />
      </div>
      
      {/* AI Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Strategic Insights
        </h3>
        <div className="space-y-3">
          <InsightCard
            type="opportunity"
            title="Narrative Gap Detected"
            description="Your main competitor hasn't addressed the new sustainability regulations. Position yourself as the industry leader on this topic."
            action="Draft sustainability statement"
            urgency="high"
          />
          <InsightCard
            type="risk"
            title="Emerging Sentiment Pattern"
            description="Customer complaints about response times increasing across social media. Address before it becomes a trending topic."
            action="Review customer service metrics"
            urgency="medium"
          />
          <InsightCard
            type="competitive"
            title="Competitor Vulnerability"
            description="TechCorp's recent product launch receiving mixed reviews. Opportunity to highlight your product advantages."
            action="Prepare comparison content"
            urgency="medium"
          />
        </div>
      </div>
    </div>
  );

  const renderIntelligentFeed = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
        <div className="flex gap-2">
          {['all', 'opportunities', 'risks', 'competitors', 'trends'].map(type => (
            <button
              key={type}
              onClick={() => setFilters({ ...filters, type })}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filters.type === type
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select 
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
            className="border rounded-lg px-3 py-1.5"
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>
      
      {/* Enhanced Mention Cards */}
      <div className="space-y-4">
        {mentions.filter(m => filters.type === 'all' || m.type === filters.type).map(mention => (
          <EnhancedMentionCard key={mention.id} mention={mention} />
        ))}
      </div>
    </div>
  );

  const renderOpportunities = () => (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Immediate Actions</h3>
        <OpportunityCard
          title="Industry Leadership Vacuum"
          description="No major player has commented on the new AI ethics guidelines"
          cascadePotential={85}
          suggestedAction="Publish thought leadership piece"
          deadline="Next 24 hours"
        />
        <OpportunityCard
          title="Competitor Weakness"
          description="CompetitorX facing backlash over data privacy"
          cascadePotential={72}
          suggestedAction="Highlight your privacy-first approach"
          deadline="This week"
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preparation Needed</h3>
        <OpportunityCard
          title="Upcoming Industry Event"
          description="Major conference next month - competitors confirmed attending"
          cascadePotential={60}
          suggestedAction="Prepare announcement for conference"
          deadline="2 weeks"
        />
      </div>
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-4">
      <PatternCard
        type="cascade"
        title="Supply Chain Narrative Building"
        description="Industry-wide discussion about supply chain transparency gaining momentum. Early movers seeing positive coverage."
        timeline="Started 2 weeks ago, accelerating"
        recommendation="Position your supply chain story now"
        participants={['IndustryLeaderA', 'StartupB', 'MediaOutletC']}
      />
      <PatternCard
        type="sentiment-shift"
        title="Customer Priority Evolution"
        description="Sustainability overtaking price as primary concern in your market segment"
        timeline="Gradual shift over 3 months"
        recommendation="Adjust messaging to emphasize green initiatives"
        dataPoints={[
          { label: 'Price mentions', value: -23 },
          { label: 'Sustainability mentions', value: +67 }
        ]}
      />
    </div>
  );

  // Component rendering based on stage
  if (setupStage === 'welcome') return renderWelcome();
  if (setupStage === 'brand-discovery') return renderBrandDiscovery();
  if (setupStage === 'strategy-generation') return renderStrategyGeneration();
  if (setupStage === 'complete') return renderDashboard();
  
  return null;
};

// Sub-components
const MetricCard = ({ title, value, trend, icon: Icon, color, insight, urgent, alerts, comparison }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      {trend && (
        <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
    <p className="text-2xl font-bold mb-2">{value}</p>
    {urgent && <p className="text-sm text-orange-600 font-medium">{urgent} urgent</p>}
    {alerts && <p className="text-sm text-red-600 font-medium">{alerts} active alerts</p>}
    {comparison && <p className="text-sm text-gray-500">{comparison}</p>}
    <p className="text-xs text-gray-500 mt-2">{insight}</p>
  </div>
);

const InsightCard = ({ type, title, description, action, urgency }) => (
  <div className={`p-4 rounded-lg border-l-4 ${
    type === 'opportunity' ? 'bg-purple-50 border-purple-500' :
    type === 'risk' ? 'bg-red-50 border-red-500' :
    'bg-blue-50 border-blue-500'
  }`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
          {action}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${
        urgency === 'high' ? 'bg-red-100 text-red-700' :
        urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {urgency}
      </span>
    </div>
  </div>
);

const EnhancedMentionCard = ({ mention }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-semibold text-lg">{mention.title}</h4>
        <p className="text-sm text-gray-600">
          {mention.source} • {new Date(mention.publishDate).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-2">
        {mention.opportunityScore > 70 && (
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
            Opportunity {mention.opportunityScore}%
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full ${
          mention.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
          mention.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {mention.sentiment}
        </span>
      </div>
    </div>
    
    <p className="text-gray-700 mb-4">{mention.content}</p>
    
    {mention.aiAnalysis && (
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="text-sm">
          <span className="font-medium">AI Analysis:</span> {mention.aiAnalysis.summary}
        </p>
        {mention.cascadePotential > 60 && (
          <p className="text-sm text-orange-600">
            ⚡ High cascade potential ({mention.cascadePotential}%)
          </p>
        )}
        {mention.suggestedActions && (
          <div className="flex gap-2 mt-3">
            {mention.suggestedActions.map((action, idx) => (
              <button key={idx} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

const OpportunityCard = ({ title, description, cascadePotential, suggestedAction, deadline }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
    <h4 className="font-semibold text-lg mb-2">{title}</h4>
    <p className="text-gray-600 mb-3">{description}</p>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">Cascade Potential</span>
        <span className="font-medium">{cascadePotential}%</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Deadline</span>
        <span className="font-medium text-orange-600">{deadline}</span>
      </div>
    </div>
    <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
      {suggestedAction}
    </button>
  </div>
);

const PatternCard = ({ type, title, description, timeline, recommendation, participants, dataPoints }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-sm text-gray-600">{timeline}</p>
      </div>
      <span className={`text-xs px-3 py-1 rounded-full ${
        type === 'cascade' ? 'bg-orange-100 text-orange-700' :
        'bg-blue-100 text-blue-700'
      }`}>
        {type}
      </span>
    </div>
    
    <p className="text-gray-700 mb-4">{description}</p>
    
    {participants && (
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Key participants:</p>
        <div className="flex flex-wrap gap-2">
          {participants.map(p => (
            <span key={p} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {p}
            </span>
          ))}
        </div>
      </div>
    )}
    
    {dataPoints && (
      <div className="mb-4 space-y-1">
        {dataPoints.map((dp, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-600">{dp.label}</span>
            <span className={`font-medium ${dp.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dp.value > 0 ? '+' : ''}{dp.value}%
            </span>
          </div>
        ))}
      </div>
    )}
    
    <div className="bg-blue-50 rounded-lg p-3">
      <p className="text-sm font-medium text-blue-900">Recommended Action:</p>
      <p className="text-sm text-blue-700">{recommendation}</p>
    </div>
  </div>
);

export default AIMonitoringAdvisor;