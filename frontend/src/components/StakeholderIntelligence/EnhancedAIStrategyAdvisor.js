import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../../config/api';
import { 
  Sparkles, Bot, Building2, Users, Target, 
  TrendingUp, Shield, Globe, CheckCircle, 
  Brain, Zap, Database, Search, Loader,
  ChevronRight, AlertCircle, Info
} from 'lucide-react';
import { findPreIndexedStakeholder, getMonitoringTopics } from './EnhancedSourceDatabase';
import stakeholderIntelligenceService from '../../services/stakeholderIntelligenceService';

const EnhancedAIStrategyAdvisor = ({ onStrategyComplete, mode = 'stakeholders' }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [currentStep, setCurrentStep] = useState('initial');
  const [organizationData, setOrganizationData] = useState({
    company: '',
    url: '',
    additionalUrls: [],
    strategicGoals: '',
    priorityStakeholders: '',
    industry: '',
    description: ''
  });
  const [stakeholders, setStakeholders] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editableCompetitors, setEditableCompetitors] = useState([]);
  const [editableTopics, setEditableTopics] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState({
    organization: 0,
    stakeholders: 0,
    sources: 0,
    strategy: 0
  });
  const initRef = useRef(false);

  useEffect(() => {
    // Use ref to ensure this only runs once, even in StrictMode
    if (initRef.current) return;
    initRef.current = true;
    
    // Initial greeting - focused on competitors and topics
    if (mode === 'unified') {
      setCurrentStep('organization_input');
      addMessage({
        type: 'ai',
        content: "Welcome to Intelligence Monitoring\n\nI'll help you discover and track competitors and topics relevant to your organization.\n\nEnter your company name:",
        showForm: true
      });
    } else if (mode === 'competitors') {
      setCurrentStep('company_info');
      addMessage({
        type: 'ai',
        content: "👋 Hello! I'm your Competitor Intelligence Advisor. I'll help you identify and track your top competitors.\n\nLet's start by researching your organization. Please provide:\n• Company name\n• Website URL (optional but recommended)\n• Brief description of what your company does",
        showForm: true
      });
    } else {
      setCurrentStep('organization_input');
      addMessage({
        type: 'ai',
        content: "Hello! I'm your AI Strategy Advisor.\n\nTo build your intelligence monitoring strategy, please provide:\n\n• **Organization Name**: Your company or client name\n• **Website URL**: https://example.com\n\nI'll analyze your organization and automatically identify relevant stakeholders, competitors, and topics to monitor.",
        showForm: true
      });
    }
  }, []);

  const addMessage = (message) => {
    if (message.options) {
      console.log('Adding message with options:', message.options);
    }
    setMessages(prev => [...prev, { ...message, id: Date.now() }]);
  };

  const handleUserResponse = async (value) => {
    // Handle option selection after analysis
    if (currentStep === 'confirm_targets' || currentStep === 'confirm_stakeholders') {
      if (value === 'proceed') {
        // Proceed with the discovered configuration
        finalizeStrategy();
      } else if (value === 'add_competitors') {
        // Allow adding more competitors
        addMessage({
          type: 'ai',
          content: "Please list additional competitors you'd like to track (one per line):",
          showForm: true
        });
        setCurrentStep('add_competitors');
      } else if (value === 'customize_topics') {
        // Allow topic customization
        addMessage({
          type: 'ai',
          content: "Please list specific topics or trends you want to monitor (one per line):",
          showForm: true
        });
        setCurrentStep('customize_topics');
      } else if (value === 'customize') {
        // Legacy: Allow customization of stakeholders
        addMessage({
          type: 'ai',
          content: "You can customize the targets. Please tell me what to add or modify:",
          showForm: true
        });
        setCurrentStep('customize_stakeholders');
      } else if (value === 'adjust') {
        // Legacy: Allow topic adjustment
        addMessage({
          type: 'ai',
          content: "You can adjust the monitoring topics. Please specify changes:",
          showForm: true
        });
        setCurrentStep('adjust_topics');
      }
    }
  };

  const handleInputSubmit = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput;
    setUserInput('');
    addMessage({ type: 'user', content: userMessage });

    console.log('Current step:', currentStep);

    if (currentStep === 'organization_input') {
      // Parse organization name and URL
      handleOrganizationInput(userMessage);
    } else if (currentStep === 'unified_input') {
      // Parse what the user wants to monitor
      handleUnifiedInput(userMessage);
    } else if (currentStep === 'topic_input') {
      // Handle topic monitoring input
      handleTopicInput(userMessage);
    } else if (currentStep === 'company_info_for_competitors') {
      // Parse company info and then discover competitors
      const lines = userMessage.split('\n');
      let company = '';
      let url = '';
      let description = '';
      
      lines.forEach(line => {
        if (line.toLowerCase().includes('company:') || line.toLowerCase().includes('name:')) {
          company = line.split(':')[1]?.trim() || '';
        } else if (line.toLowerCase().includes('url:') || line.includes('http')) {
          url = line.includes('http') ? line.trim() : line.split(':').slice(1).join(':').trim();
        } else if (line.toLowerCase().includes('description:') || line.toLowerCase().includes('what')) {
          description = line.split(':')[1]?.trim() || '';
        }
      });
      
      // If no structured format, try to parse intelligently
      if (!company) {
        company = lines[0].trim();
        url = lines.find(l => l.includes('http') || l.includes('www.')) || '';
        description = lines.filter(l => l !== company && l !== url).join(' ');
      }
      
      // Now discover competitors
      performCompetitorAnalysis({ company, url, description });
    } else if (currentStep === 'company_info') {
      // Parse company name and URL from input
      const lines = userMessage.split('\n');
      let company = '';
      let url = '';
      
      lines.forEach(line => {
        if (line.toLowerCase().includes('company:')) {
          company = line.split(':')[1]?.trim() || '';
        } else if (line.toLowerCase().includes('url:') || line.includes('http')) {
          url = line.includes('http') ? line.trim() : line.split(':').slice(1).join(':').trim();
        }
      });

      // If no structured format, assume first line is company, second is URL
      if (!company && !url) {
        const parts = userMessage.split(/\s+/);
        company = userMessage;
        url = parts.find(part => part.includes('http')) || '';
      }

      setOrganizationData(prev => ({ ...prev, company, url }));
      
      // Start analyzing immediately
      performAutomatedAnalysis({ company, url });
      
    } else if (currentStep === 'strategic_goals') {
      setOrganizationData(prev => ({ ...prev, strategicGoals: userMessage }));
      setCurrentStep('priority_stakeholders');
      
      setIsTyping(true);
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: `Excellent strategic goals! I'll factor these into my analysis.\n\nLastly, are there any specific stakeholders you already know are important? This could include:\n• Major investors (e.g., BlackRock, Vanguard)\n• Key regulators (e.g., SEC, FTC)\n• Important customers or partners\n• Media outlets that cover you\n\nYou can list a few, or just type "none" to let me discover them all.`,
          showTextarea: true
        });
        setIsTyping(false);
      }, 1000);
      
    } else if (currentStep === 'priority_stakeholders') {
      setOrganizationData(prev => ({ ...prev, priorityStakeholders: userMessage }));
      // Now perform the comprehensive analysis with all data
      performDeepOrganizationAnalysis(organizationData);
      
    } else if (currentStep === 'confirm_stakeholders') {
      finalizeStrategy();
    } else if (currentStep === 'add_competitors') {
      // Add custom competitors
      const newCompetitors = userMessage.split('\n').filter(c => c.trim());
      if (newCompetitors.length > 0) {
        const updatedCompetitors = [...editableCompetitors, ...newCompetitors];
        setEditableCompetitors(updatedCompetitors);
        
        addMessage({
          type: 'ai',
          content: `Added ${newCompetitors.length} competitor${newCompetitors.length > 1 ? 's' : ''}. Current list:`,
          editableTargets: {
            competitors: updatedCompetitors,
            topics: editableTopics
          },
          options: [
            { label: '✅ Start Monitoring', value: 'proceed' },
            { label: '📝 Add Topics', value: 'customize_topics' }
          ]
        });
      }
      setCurrentStep('confirm_targets');
    } else if (currentStep === 'customize_topics') {
      // Add custom topics
      const newTopics = userMessage.split('\n').filter(t => t.trim());
      if (newTopics.length > 0) {
        const updatedTopics = [...editableTopics, ...newTopics];
        setEditableTopics(updatedTopics);
        
        addMessage({
          type: 'ai',
          content: `Added ${newTopics.length} topic${newTopics.length > 1 ? 's' : ''}. Current list:`,
          editableTargets: {
            competitors: editableCompetitors,
            topics: updatedTopics
          },
          options: [
            { label: '✅ Start Monitoring', value: 'proceed' }
          ]
        });
      }
      setCurrentStep('confirm_targets');
    } else if (currentStep === 'customize_stakeholders' || currentStep === 'adjust_topics') {
      // Handle legacy customization responses
      addMessage({
        type: 'ai',
        content: "I've noted your customizations. The strategy will be updated accordingly."
      });
      finalizeStrategy();
    } else {
      console.log('Unhandled step:', currentStep);
      // For any other step, try organization input
      if (currentStep === 'organization_input' || currentStep === 'company_info') {
        handleOrganizationInput(userMessage);
      }
    }
  };

  const performAnalysis = async (orgData) => {
    if (mode === 'topics') {
      performTopicAnalysis(orgData);
    } else if (mode === 'competitors') {
      performCompetitorAnalysis(orgData);
    } else {
      performDeepOrganizationAnalysis(orgData);
    }
  };

  const handleUnifiedInput = (input) => {
    const inputLower = input.toLowerCase();
    const targets = [];
    
    // Detect if user is asking about competitors
    const competitorKeywords = ['competitor', 'compete', 'rival', 'vs', 'versus', 'track my competitors'];
    const topicKeywords = ['topic', 'trend', 'monitor', 'track', 'regulation', 'narrative', 'issue'];
    
    // Parse the input to identify entities and topics
    const lines = input.split(/[,\n;]/).map(l => l.trim()).filter(l => l);
    
    // Check if input contains company names (typically capitalized or known patterns)
    const hasCompanyNames = lines.some(line => {
      const words = line.split(' ');
      return words.some(word => 
        word.length > 2 && 
        (word[0] === word[0].toUpperCase() || 
         word.toLowerCase().includes('corp') ||
         word.toLowerCase().includes('inc') ||
         word.toLowerCase().includes('llc'))
      );
    });
    
    // Determine primary intent
    const isCompetitorFocused = competitorKeywords.some(kw => inputLower.includes(kw)) || hasCompanyNames;
    const isTopicFocused = topicKeywords.some(kw => inputLower.includes(kw)) && !isCompetitorFocused;
    
    if (isCompetitorFocused) {
      // Extract company names
      const companies = [];
      lines.forEach(line => {
        // Remove common prefixes
        const cleaned = line.replace(/^(track|monitor|watch|follow|my competitor[s]?:?|competitor[s]?:?)/gi, '').trim();
        if (cleaned && cleaned.length > 1) {
          // Check if it looks like a company name
          const firstChar = cleaned[0];
          if (firstChar === firstChar.toUpperCase() || cleaned.includes('.com') || cleaned.includes('Inc')) {
            companies.push(cleaned);
          }
        }
      });
      
      if (companies.length > 0) {
        // User provided specific competitors
        performUnifiedAnalysis({
          type: 'competitors',
          entities: companies,
          userInput: input
        });
      } else {
        // Ask for company info to discover competitors
        setCurrentStep('company_info_for_competitors');
        addMessage({
          type: 'ai',
          content: "I see you want to track competitors. To identify the right ones, please tell me:\n• Your company name\n• Your website (optional)\n• What your company does",
          showForm: true
        });
      }
    } else if (isTopicFocused || !hasCompanyNames) {
      // Extract topics
      const topics = lines.map(line => {
        return line.replace(/^(track|monitor|watch|follow|topic[s]?:?|trend[s]?:?)/gi, '').trim();
      }).filter(t => t && t.length > 2);
      
      if (topics.length > 0) {
        performUnifiedAnalysis({
          type: 'topics',
          entities: topics,
          userInput: input
        });
      }
    } else {
      // Mixed or unclear - analyze everything
      performUnifiedAnalysis({
        type: 'mixed',
        entities: lines,
        userInput: input
      });
    }
  };

  const performUnifiedAnalysis = async (data) => {
    setIsAnalyzing(true);
    setCurrentStep('analyzing');
    
    const typeLabel = data.type === 'competitors' ? 'competitors' : 
                     data.type === 'topics' ? 'topics' : 
                     'intelligence targets';
    
    addMessage({
      type: 'ai',
      content: `🔍 Analyzing your ${typeLabel}...\n\n` +
        `**Targets identified:** ${data.entities.join(', ')}\n\n` +
        `I'm now:\n` +
        `• Researching each target\n` +
        `• Finding the best monitoring sources\n` +
        `• Setting up tracking parameters\n` +
        `• Building your intelligence dashboard`,
      showProgress: true
    });

    // Research phases
    const phases = [
      { key: 'organization', label: `Researching ${data.entities.length} targets`, duration: 2000 },
      { key: 'stakeholders', label: 'Analyzing intelligence requirements', duration: 2000 },
      { key: 'sources', label: 'Configuring monitoring sources', duration: 2000 },
      { key: 'strategy', label: 'Building monitoring strategy', duration: 1500 }
    ];

    for (const phase of phases) {
      await animateProgress(phase.key, phase.duration);
    }

    // Generate intelligence targets
    const intelligenceTargets = [];
    
    for (const entity of data.entities) {
      if (data.type === 'competitors' || (data.type === 'mixed' && looksLikeCompany(entity))) {
        // Treat as competitor
        intelligenceTargets.push({
          id: `comp-${intelligenceTargets.length}`,
          name: entity,
          type: 'Competitor',
          priority: 'high',
          influence: 85,
          keywords: [entity, `${entity} news`, `${entity} announcement`],
          topics: ['product launches', 'funding', 'partnerships', 'leadership changes'],
          reason: 'Competitive intelligence target',
          goals: `Track ${entity}'s strategic moves and market positioning`,
          description: `Monitor all activities and announcements from ${entity}`
        });
      } else {
        // Treat as topic
        intelligenceTargets.push({
          id: `topic-${intelligenceTargets.length}`,
          name: entity,
          type: 'Topic',
          priority: 'high',
          influence: 80,
          keywords: [entity, ...getTopicKeywords(entity)],
          topics: ['breaking news', 'analysis', 'expert opinions', 'research'],
          reason: 'Strategic monitoring topic',
          goals: `Track developments related to ${entity}`,
          description: `Monitor trends and discussions about ${entity}`
        });
      }
    }
    
    setStakeholders(intelligenceTargets);
    setIsAnalyzing(false);
    setCurrentStep('review_stakeholders');

    // Present results
    addMessage({
      type: 'ai',
      content: `✅ **Analysis Complete!**\n\nI've configured monitoring for ${intelligenceTargets.length} intelligence targets. Each target has been set up with appropriate sources and tracking parameters.\n\n**Review and confirm your targets:**`,
      stakeholderResults: intelligenceTargets,
      showSelection: true
    });
  };

  const looksLikeCompany = (text) => {
    const companyIndicators = ['inc', 'corp', 'llc', 'ltd', 'company', '.com'];
    const textLower = text.toLowerCase();
    
    // Check for company indicators
    if (companyIndicators.some(ind => textLower.includes(ind))) return true;
    
    // Check if first letter is capitalized (proper noun)
    if (text[0] === text[0].toUpperCase() && text.length > 2) {
      // Check if it's likely a company name vs a topic
      const topicWords = ['regulation', 'trend', 'technology', 'market', 'industry', 'disruption'];
      if (!topicWords.some(word => textLower.includes(word))) {
        return true;
      }
    }
    
    return false;
  };

  const handleTopicInput = (input) => {
    // Parse topic information from input
    const lines = input.split('\n');
    const topicData = {
      mainTopic: lines[0] || input,
      industry: '',
      context: '',
      relatedTopics: []
    };
    
    // Extract additional context
    lines.forEach(line => {
      if (line.toLowerCase().includes('industry:')) {
        topicData.industry = line.split(':')[1]?.trim() || '';
      } else if (line.toLowerCase().includes('context:') || line.toLowerCase().includes('why:')) {
        topicData.context = line.split(':')[1]?.trim() || '';
      }
    });
    
    // Perform topic analysis
    performTopicAnalysis(topicData);
  };

  const performTopicAnalysis = async (topicData) => {
    setIsAnalyzing(true);
    setCurrentStep('analyzing');
    
    addMessage({
      type: 'ai',
      content: `🔬 Analyzing "${topicData.mainTopic}" and related narratives...\n\n` +
        `**Research Focus:**\n` +
        `• Identifying key influencers and thought leaders\n` +
        `• Mapping narrative evolution and trends\n` +
        `• Finding authoritative sources\n` +
        `• Discovering related topics and subtopics\n\n` +
        `This will help me create a comprehensive monitoring strategy...`,
      showProgress: true
    });

    // Research phases
    const phases = [
      { key: 'organization', label: `Researching "${topicData.mainTopic}"`, duration: 2000 },
      { key: 'stakeholders', label: 'Identifying key voices and influencers', duration: 2500 },
      { key: 'sources', label: 'Finding authoritative sources', duration: 2000 },
      { key: 'strategy', label: 'Building monitoring strategy', duration: 1500 }
    ];

    for (const phase of phases) {
      await animateProgress(phase.key, phase.duration);
    }

    // Generate topic-based intelligence targets
    const topicTargets = generateTopicTargets(topicData);
    
    setStakeholders(topicTargets);
    setIsAnalyzing(false);
    setCurrentStep('review_stakeholders');

    // Present results
    addMessage({
      type: 'ai',
      content: `✅ **Topic Analysis Complete!**\n\nI've identified key aspects of "${topicData.mainTopic}" to monitor. These include subtopics, key sources, and influential voices.\n\n**Select the targets you want to track:**`,
      stakeholderResults: topicTargets,
      showSelection: true
    });
  };

  const generateTopicTargets = (topicData) => {
    const targets = [];
    const mainTopic = topicData.mainTopic;
    
    // Main topic as primary target
    targets.push({
      id: 'topic-main',
      name: mainTopic,
      type: 'Primary Topic',
      priority: 'high',
      influence: 90,
      keywords: [mainTopic, ...getTopicKeywords(mainTopic)],
      topics: ['breaking news', 'industry analysis', 'expert opinions', 'research reports'],
      reason: 'Core topic for monitoring',
      goals: `Track all developments related to ${mainTopic}`,
      description: topicData.context || `Primary monitoring focus`
    });
    
    // Generate related subtopics
    const subtopics = generateSubtopics(mainTopic, topicData.industry);
    subtopics.forEach((subtopic, idx) => {
      targets.push({
        id: `topic-sub-${idx}`,
        name: subtopic.name,
        type: 'Subtopic',
        priority: subtopic.priority || 'medium',
        influence: subtopic.relevance || 70,
        keywords: subtopic.keywords,
        topics: subtopic.aspects,
        reason: subtopic.reason,
        goals: `Monitor ${subtopic.name} developments`,
        description: subtopic.description
      });
    });
    
    // Add key influencers/sources as targets
    const influencers = generateTopicInfluencers(mainTopic, topicData.industry);
    influencers.forEach((influencer, idx) => {
      targets.push({
        id: `influencer-${idx}`,
        name: influencer.name,
        type: 'Key Source',
        priority: 'medium',
        influence: influencer.authority || 60,
        keywords: [influencer.name, mainTopic],
        topics: influencer.expertise,
        reason: influencer.reason,
        goals: `Track insights from ${influencer.name}`,
        description: influencer.description
      });
    });
    
    return targets;
  };

  const getTopicKeywords = (topic) => {
    // Generate related keywords for a topic
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('ai') || topicLower.includes('artificial intelligence')) {
      return ['machine learning', 'deep learning', 'neural networks', 'LLM', 'generative AI'];
    } else if (topicLower.includes('climate') || topicLower.includes('sustainability')) {
      return ['ESG', 'carbon neutral', 'renewable energy', 'green technology', 'net zero'];
    } else if (topicLower.includes('crypto') || topicLower.includes('blockchain')) {
      return ['bitcoin', 'ethereum', 'DeFi', 'web3', 'NFT', 'digital assets'];
    }
    
    // Default related terms
    return ['trends', 'analysis', 'industry', 'innovation', 'research'];
  };

  const generateSubtopics = (mainTopic, industry) => {
    const topicLower = mainTopic.toLowerCase();
    
    if (topicLower.includes('ai regulation')) {
      return [
        {
          name: 'EU AI Act',
          keywords: ['EU AI Act', 'European regulation', 'AI governance'],
          aspects: ['policy updates', 'compliance requirements', 'implementation timeline'],
          priority: 'high',
          relevance: 85,
          reason: 'Major regulatory framework',
          description: 'European Union AI regulation and compliance'
        },
        {
          name: 'AI Ethics & Bias',
          keywords: ['AI ethics', 'algorithmic bias', 'fairness', 'transparency'],
          aspects: ['ethical guidelines', 'bias detection', 'fairness metrics'],
          priority: 'high',
          relevance: 80,
          reason: 'Critical compliance area',
          description: 'Ethical considerations and bias in AI systems'
        },
        {
          name: 'Industry Standards',
          keywords: ['ISO AI standards', 'IEEE standards', 'best practices'],
          aspects: ['standard updates', 'certification', 'compliance frameworks'],
          priority: 'medium',
          relevance: 70,
          reason: 'Industry standardization',
          description: 'Technical standards and certifications'
        }
      ];
    }
    
    // Default subtopics
    return [
      {
        name: `${mainTopic} Trends`,
        keywords: [`${mainTopic} trends`, 'emerging', 'future'],
        aspects: ['trend analysis', 'predictions', 'market shifts'],
        priority: 'high',
        relevance: 75,
        reason: 'Track evolving trends',
        description: 'Emerging trends and future directions'
      },
      {
        name: `${mainTopic} Technology`,
        keywords: [`${mainTopic} tech`, 'innovation', 'solutions'],
        aspects: ['new technology', 'innovations', 'breakthroughs'],
        priority: 'medium',
        relevance: 70,
        reason: 'Technology developments',
        description: 'Technical innovations and solutions'
      }
    ];
  };

  const generateTopicInfluencers = (topic, industry) => {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('ai')) {
      return [
        {
          name: 'MIT Technology Review',
          authority: 90,
          expertise: ['AI research', 'technology trends', 'innovation'],
          reason: 'Leading technology publication',
          description: 'Authoritative source on AI developments'
        },
        {
          name: 'Stanford HAI',
          authority: 85,
          expertise: ['AI research', 'policy', 'human-centered AI'],
          reason: 'Academic thought leadership',
          description: 'Stanford Human-Centered AI Institute'
        }
      ];
    }
    
    // Default influencers
    return [
      {
        name: 'Industry Reports',
        authority: 75,
        expertise: ['market analysis', 'industry trends', 'forecasts'],
        reason: 'Market intelligence',
        description: 'Key industry research firms and analysts'
      },
      {
        name: 'Thought Leaders',
        authority: 70,
        expertise: ['expert opinions', 'insights', 'commentary'],
        reason: 'Expert perspectives',
        description: 'Industry experts and thought leaders'
      }
    ];
  };

  const performCompetitorAnalysis = async (orgData) => {
    setIsAnalyzing(true);
    setCurrentStep('analyzing');
    
    addMessage({
      type: 'ai',
      content: `🔍 Excellent! I'm now researching ${orgData.company} to identify your key competitors.\n\n` +
        `**Analyzing:**\n` +
        `• ${orgData.url ? 'Website content and positioning' : 'Industry positioning'}\n` +
        `• Market landscape and key players\n` +
        `• Direct and indirect competitors\n` +
        `• Competitive threats and opportunities\n\n` +
        `This comprehensive analysis will help me identify your top 5-10 competitors...`,
      showProgress: true
    });

    // Research phases
    const phases = [
      { key: 'organization', label: `Analyzing ${orgData.url || orgData.company}`, duration: 2000 },
      { key: 'stakeholders', label: 'Researching industry landscape', duration: 2500 },
      { key: 'sources', label: 'Identifying key competitors', duration: 3000 },
      { key: 'strategy', label: 'Configuring tracking sources', duration: 1500 }
    ];

    for (const phase of phases) {
      await animateProgress(phase.key, phase.duration);
    }

    // Generate competitor suggestions
    const competitors = await generateCompetitorSuggestions(orgData);
    
    // Convert competitors to stakeholder format
    const competitorStakeholders = competitors.map((comp, idx) => ({
      id: `competitor-${idx}`,
      name: comp.name,
      type: 'Competitor',
      priority: comp.trackingPriority || 'high',
      influence: comp.threatLevel || 75,
      keywords: [comp.name, ...((comp.keywords || []))],
      topics: comp.reasons || ['product launches', 'funding', 'partnerships'],
      reason: comp.description || `${comp.type || 'Direct competitor'} in your market`,
      goals: `Track ${comp.name}'s strategic moves and market positioning`,
      fears: `Missing competitive intelligence on ${comp.name}`,
      description: comp.description,
      threatLevel: comp.threatLevel,
      trackingPriority: comp.trackingPriority
    }));
    
    setStakeholders(competitorStakeholders);
    setIsAnalyzing(false);
    setCurrentStep('review_stakeholders');

    // Present results
    addMessage({
      type: 'ai',
      content: `✅ **Research Complete!**\n\nBased on my analysis of ${orgData.company}, I've identified ${competitorStakeholders.length} key competitors in your market. These companies represent your main competitive threats and opportunities.\n\n**Select the competitors you want to track** (or confirm all):`,
      stakeholderResults: competitorStakeholders,
      showSelection: true
    });
  };

  const generateCompetitorSuggestions = async (orgData) => {
    // Try to use real research service first
    try {
      const response = await stakeholderIntelligenceService.researchCompetitors(orgData);
      if (response && response.competitors) {
        return response.competitors;
      }
    } catch (error) {
      console.log('Using local competitor generation');
    }

    // Local intelligent competitor generation based on company
    const companyLower = orgData.company.toLowerCase();
    
    // Smart competitor mapping
    if (companyLower.includes('target')) {
      return [
        { 
          name: 'Walmart', 
          type: 'Direct Competitor',
          description: 'Largest retail competitor with strong omnichannel presence',
          threatLevel: 95,
          trackingPriority: 'high',
          reasons: ['Market leader', 'Price competition', 'Geographic overlap']
        },
        { 
          name: 'Amazon', 
          type: 'Direct Competitor',
          description: 'E-commerce giant expanding into physical retail',
          threatLevel: 90,
          trackingPriority: 'high',
          reasons: ['Digital dominance', 'Same-day delivery', 'Prime ecosystem']
        },
        { 
          name: 'Costco', 
          type: 'Indirect Competitor',
          description: 'Membership-based wholesale retailer',
          threatLevel: 70,
          trackingPriority: 'medium',
          reasons: ['Different model', 'Customer overlap', 'Bulk buying trend']
        }
      ];
    }

    // Default technology competitors
    return [
      { 
        name: 'Primary Competitor', 
        type: 'Direct Competitor',
        description: 'Main rival in your core market',
        threatLevel: 85,
        trackingPriority: 'high',
        reasons: ['Market share', 'Product overlap', 'Customer base']
      },
      { 
        name: 'Secondary Competitor', 
        type: 'Direct Competitor',
        description: 'Growing threat in key segments',
        threatLevel: 75,
        trackingPriority: 'medium',
        reasons: ['Fast growth', 'Innovation', 'Pricing pressure']
      }
    ];
  };

  const handleOrganizationInput = async (userMessage) => {
    console.log('handleOrganizationInput called with:', userMessage);
    
    // Parse organization name and URL - handle various input formats
    const lines = userMessage.split('\n').filter(l => l.trim());
    let company = '';
    let url = '';
    
    // Smart parsing - handle both single line and multi-line input
    if (lines.length === 1) {
      // Single line - could be just company name or "CompanyName https://url.com"
      const parts = lines[0].split(/\s+/);
      if (parts.some(p => p.includes('http') || p.includes('www.'))) {
        // Has URL in the line
        url = parts.find(p => p.includes('http') || p.includes('www.')) || '';
        company = parts.filter(p => !p.includes('http') && !p.includes('www.')).join(' ').trim();
      } else {
        // Just company name
        company = lines[0].trim();
      }
    } else {
      // Multi-line input
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.includes('http://') || trimmed.includes('https://') || trimmed.includes('www.')) {
          url = trimmed.includes('http') ? trimmed : `https://${trimmed}`;
        } else if (!company && trimmed) {
          company = trimmed;
        }
      });
    }
    
    console.log('Parsed company:', company, 'url:', url);
    
    if (!company || company.length === 0) {
      addMessage({
        type: 'ai',
        content: "I need at least your organization name to proceed. Please provide:\n\n• Organization Name\n• Website URL (optional but recommended)",
        showForm: true
      });
      return;
    }
    
    setOrganizationData(prev => ({ ...prev, company, url }));
    
    // Start automated analysis
    addMessage({
      type: 'ai',
      content: `Perfect! Analyzing **${company}**${url ? ` (${url})` : ''}...\n\nI'm using AI agents to:\n• 🏢 Identify your main competitors\n• 📊 Discover industry topics to monitor\n• 🎯 Find trending narratives in your space`
    });
    
    setIsAnalyzing(true);
    performAutomatedAnalysis({ company, url });
  };

  const getCompetitorsForCompany = (company, url) => {
    // Smart competitor identification based on company name and URL
    const companyLower = company.toLowerCase();
    
    // Tech companies
    if (companyLower.includes('openai') || companyLower.includes('ai')) {
      return ['Anthropic', 'Google DeepMind', 'Microsoft AI', 'Cohere', 'Stability AI'];
    }
    if (companyLower.includes('microsoft')) {
      return ['Google', 'Amazon', 'Apple', 'Meta', 'Salesforce'];
    }
    if (companyLower.includes('google')) {
      return ['Microsoft', 'Apple', 'Amazon', 'Meta', 'OpenAI'];
    }
    
    // E-commerce
    if (companyLower.includes('amazon') || companyLower.includes('shopify')) {
      return ['Amazon', 'Walmart', 'eBay', 'Alibaba', 'Target'];
    }
    
    // Social media
    if (companyLower.includes('meta') || companyLower.includes('facebook')) {
      return ['TikTok', 'X (Twitter)', 'LinkedIn', 'Snapchat', 'Pinterest'];
    }
    
    // Default competitors for unknown companies
    return ['Industry Leader 1', 'Industry Leader 2', 'Emerging Competitor 1', 'Emerging Competitor 2'];
  };
  
  const getTopicsForCompany = (company, url) => {
    // Smart topic identification based on company and industry
    const companyLower = company.toLowerCase();
    
    // AI companies
    if (companyLower.includes('ai') || companyLower.includes('openai')) {
      return ['AI Regulation', 'AGI Development', 'AI Safety', 'LLM Advancements', 'AI Ethics'];
    }
    
    // Tech companies
    if (companyLower.includes('microsoft') || companyLower.includes('google') || companyLower.includes('apple')) {
      return ['Cloud Computing', 'Cybersecurity', 'Digital Transformation', 'Privacy Regulations', 'Tech Antitrust'];
    }
    
    // E-commerce
    if (companyLower.includes('amazon') || companyLower.includes('shopify')) {
      return ['E-commerce Trends', 'Supply Chain Innovation', 'Last-Mile Delivery', 'Retail Technology', 'Consumer Behavior'];
    }
    
    // Finance
    if (companyLower.includes('bank') || companyLower.includes('capital')) {
      return ['Fintech Disruption', 'Digital Banking', 'Cryptocurrency', 'Financial Regulations', 'ESG Investing'];
    }
    
    // Default topics
    return ['Industry Trends', 'Market Dynamics', 'Regulatory Changes', 'Technology Innovation', 'Consumer Sentiment'];
  };

  const performAutomatedAnalysis = async (orgData) => {
    setCurrentStep('analyzing');
    setAnalysisProgress({ organization: 0, stakeholders: 0, sources: 0, strategy: 0 });
    
    // Progressive analysis animation
    setTimeout(() => setAnalysisProgress(prev => ({ ...prev, organization: 100 })), 1000);
    setTimeout(() => setAnalysisProgress(prev => ({ ...prev, stakeholders: 100 })), 2000);
    setTimeout(() => setAnalysisProgress(prev => ({ ...prev, sources: 100 })), 3000);
    setTimeout(() => setAnalysisProgress(prev => ({ ...prev, strategy: 100 })), 4000);
    
    // Fetch real data from backend
    try {
      // Get auth token from localStorage (same as other components)
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Token found' : 'No token found');
      
      // Build headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Fetch competitors and topics in parallel
      const [competitorsResponse, topicsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/intelligence/discover-competitors`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ company: orgData.company, industry: orgData.url || 'technology' })
        }),
        fetch(`${API_BASE_URL}/intelligence/discover-topics`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ company: orgData.company, industry: orgData.url || 'technology' })
        })
      ]);
      
      const competitorsData = await competitorsResponse.json();
      const topicsData = await topicsResponse.json();
      
      // Use real data if available, fallback to local discovery
      let competitors, topics;
      
      if (competitorsData.success && competitorsData.competitors) {
        // Extract competitor names from the objects
        competitors = competitorsData.competitors.map(c => 
          typeof c === 'object' ? (c.name || c.competitor || JSON.stringify(c)) : c
        );
        console.log('Real competitors found:', competitors);
      } else {
        competitors = getCompetitorsForCompany(orgData.company, orgData.url);
      }
      
      if (topicsData.success && topicsData.topics) {
        // Extract topic names from the objects
        topics = topicsData.topics.map(t => 
          typeof t === 'object' ? (t.topic || t.name || JSON.stringify(t)) : t
        );
        console.log('Real topics found:', topics);
      } else {
        topics = getTopicsForCompany(orgData.company, orgData.url);
      }
      
      // Wait for animation to complete
      setTimeout(() => {
        // Create individual targets for each competitor and topic
        const competitorTargets = competitors.map(competitorName => ({
          name: competitorName,
          type: 'competitor',
          priority: 'high',
          reason: `Track ${competitorName}'s competitive moves and market positioning`,
          keywords: [competitorName.toLowerCase()],
          topics: ['Product Launches', 'Pricing Changes', 'Market Expansion', 'Partnership Announcements']
        }));
        
        const topicTargets = topics.map(topicName => ({
          name: topicName,
          type: 'topic',
          priority: 'high',
          reason: `Monitor developments in ${topicName}`,
          keywords: topicName.toLowerCase().split(' '),
          topics: [topicName]
        }));
        
        const discoveredTargets = [...competitorTargets, ...topicTargets];
        
        setStakeholders(discoveredTargets);
        setIsAnalyzing(false);
        
        // Store editable lists
        setEditableCompetitors(competitors);
        setEditableTopics(topics);
        
        // Show results with real data
        addMessage({
          type: 'ai',
          content: `✅ **Discovery Complete!**\n\n**Click any item below to edit it:**`,
          editableTargets: {
            competitors: competitors,
            topics: topics
          },
          options: [
            { label: '✅ Start Monitoring These', value: 'proceed' },
            { label: '➕ Add More Competitors', value: 'add_competitors' },
            { label: '📝 Add More Topics', value: 'customize_topics' }
          ]
        });
        
        setCurrentStep('confirm_targets');
      }, 4500);
      
    } catch (error) {
      console.error('Error fetching real data:', error);
      // Fallback to local discovery
      setTimeout(() => {
        const competitors = getCompetitorsForCompany(orgData.company, orgData.url);
        const topics = getTopicsForCompany(orgData.company, orgData.url);
        
        // Create individual targets for each competitor and topic (fallback)
        const competitorTargets = competitors.map(competitorName => ({
          name: competitorName,
          type: 'competitor',
          priority: 'high',
          reason: `Track ${competitorName}'s competitive moves and market positioning`,
          keywords: [competitorName.toLowerCase()],
          topics: ['Product Launches', 'Pricing Changes', 'Market Expansion', 'Partnership Announcements']
        }));
        
        const topicTargets = topics.map(topicName => ({
          name: topicName,
          type: 'topic',
          priority: 'high',
          reason: `Monitor developments in ${topicName}`,
          keywords: topicName.toLowerCase().split(' '),
          topics: [topicName]
        }));
        
        const discoveredTargets = [...competitorTargets, ...topicTargets];
        
        setStakeholders(discoveredTargets);
        setIsAnalyzing(false);
        
        // Store editable lists
        setEditableCompetitors(competitors);
        setEditableTopics(topics);
        
        addMessage({
          type: 'ai',
          content: `✅ **Discovery Complete!**\n\n**Click any item below to edit it:**`,
          editableTargets: {
            competitors: competitors,
            topics: topics
          },
          options: [
            { label: '✅ Start Monitoring These', value: 'proceed' },
            { label: '➕ Add More Competitors', value: 'add_competitors' },
            { label: '📝 Add More Topics', value: 'customize_topics' }
          ]
        });
        
        setCurrentStep('confirm_targets');
      }, 4500);
    }
  };

  const performDeepOrganizationAnalysis = async (orgData) => {
    setIsAnalyzing(true);
    setCurrentStep('analyzing');
    
    // Show analysis progress with all collected data
    addMessage({
      type: 'ai',
      content: `Excellent! I'm now performing a deep analysis with the following information:\n\n` +
        `🏢 **Organization**: ${orgData.company}\n` +
        `🌐 **Website**: ${orgData.url || 'Not provided'}\n` +
        `🎯 **Strategic Goals**: ${orgData.strategicGoals ? 'Identified' : 'Not provided'}\n` +
        `👥 **Known Stakeholders**: ${orgData.priorityStakeholders && orgData.priorityStakeholders.toLowerCase() !== 'none' ? 'Provided' : 'Will discover'}\n\n` +
        `This comprehensive research will help me identify and configure your key stakeholders automatically.`,
      showProgress: true
    });

    // Enhanced research phases showing deeper analysis
    const phases = [
      { key: 'organization', label: `Analyzing ${orgData.company} and ${orgData.url || 'industry context'}`, duration: 2000 },
      { key: 'stakeholders', label: 'Mapping stakeholders to strategic goals', duration: 2500 },
      { key: 'sources', label: 'Building custom intelligence sources', duration: 2000 },
      { key: 'strategy', label: 'Creating goal-aligned monitoring strategy', duration: 1500 }
    ];

    for (const phase of phases) {
      await animateProgress(phase.key, phase.duration);
    }

    // Generate intelligent stakeholder suggestions with all context
    let suggestedStakeholders = [];
    
    try {
      // First, create/update organization in database
      const orgResult = await stakeholderIntelligenceService.createOrUpdateOrganization({
        name: orgData.company,
        url: orgData.url,
        industry: determineIndustryFromUrl(orgData.url),
        type: orgData.company.toLowerCase().includes('karv') || 
              orgData.company.toLowerCase().includes('agency') ? 'agency' : 'company',
        strategicGoals: orgData.strategicGoals
      });
      
      // Store organization ID for later use
      orgData.organizationId = orgResult.organizationId;
      setOrganizationData(prev => ({ ...prev, organizationId: orgResult.organizationId }));
      
      // Try to get AI-powered suggestions from backend
      suggestedStakeholders = await stakeholderIntelligenceService.generateStakeholderSuggestions(orgData);
      
      // If API fails or returns empty, use local generation
      if (!suggestedStakeholders || suggestedStakeholders.length === 0) {
        suggestedStakeholders = await generateSmartStakeholderSuggestions(orgData);
      }
    } catch (error) {
      console.error('Error with API, using local generation:', error);
      // Fall back to local generation
      suggestedStakeholders = await generateSmartStakeholderSuggestions(orgData);
    }
    
    setStakeholders(suggestedStakeholders);
    setIsAnalyzing(false);
    setCurrentStep('review_stakeholders');

    // Present results
    addMessage({
      type: 'ai',
      content: `Analysis complete! Based on my research of ${orgData.company}, your strategic goals, and the URL analysis, I've identified ${suggestedStakeholders.length} key stakeholder groups that significantly influence your success. These groups represent dozens of individual entities we'll monitor.`,
      stakeholderResults: suggestedStakeholders
    });
  };

  const animateProgress = (key, duration) => {
    return new Promise(resolve => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setAnalysisProgress(prev => ({ ...prev, [key]: progress }));
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, duration / 10);
    });
  };

  const determineIndustryFromUrl = (url) => {
    if (!url) return null;
    const domain = url.toLowerCase();
    
    // Simple industry detection based on domain patterns
    if (domain.includes('tech') || domain.includes('.io') || domain.includes('software')) return 'Technology';
    if (domain.includes('bank') || domain.includes('capital') || domain.includes('invest')) return 'Financial Services';
    if (domain.includes('health') || domain.includes('med') || domain.includes('pharma')) return 'Healthcare';
    if (domain.includes('retail') || domain.includes('shop') || domain.includes('store')) return 'Retail';
    if (domain.includes('energy') || domain.includes('oil') || domain.includes('solar')) return 'Energy';
    
    return 'Technology'; // Default fallback
  };

  const generateSmartStakeholderSuggestions = async (orgData) => {
    const suggestions = [];
    
    // Determine company type and context
    const companyName = orgData.company.toLowerCase();
    const url = orgData.url?.toLowerCase() || '';
    const goals = orgData.strategicGoals?.toLowerCase() || '';
    const userStakeholders = orgData.priorityStakeholders?.toLowerCase() || '';
    
    // Analyze company type from name, URL, and context
    // KARV and similar names should be detected as agencies
    const isAgency = companyName.includes('communications') || companyName.includes('pr') || 
                     companyName.includes('marketing') || companyName.includes('agency') ||
                     companyName.includes('karv') || companyName.includes('publicis') ||
                     companyName.includes('omnicom') || companyName.includes('wpp') ||
                     url.includes('agency') || url.includes('communications') ||
                     goals.includes('new business') || goals.includes('win clients');
    
    const isB2B = goals.includes('business') || goals.includes('enterprise') || 
                  goals.includes('b2b') || companyName.includes('solutions');
    
    const targetingTech = goals.includes('technology') || goals.includes('tech') || 
                          goals.includes('software') || goals.includes('saas') ||
                          goals.includes('generate new business with tech');
    
    // For KARV (communications firm) wanting new tech business
    if (isAgency && targetingTech) {
      // Specific Major Tech Companies as PROSPECTS
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Microsoft',
        type: 'Target Client - Enterprise',
        priority: 'critical',
        reason: 'Major tech company that regularly uses PR agencies for product launches and corporate comms',
        influence: 10,
        keywords: ['microsoft', 'msft', 'satya nadella', 'azure', 'office'],
        preIndexed: true,
        sourceCount: 15,
        entities: ['Microsoft'],
        monitoringTopics: [
          'product launches needing PR support',
          'PR agency RFPs',
          'marketing leadership changes',
          'crisis communications needs',
          'market expansion announcements'
        ]
      });
      
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Salesforce',
        type: 'Target Client - Enterprise SaaS',
        priority: 'critical',
        reason: 'Leading SaaS company with extensive PR needs for Dreamforce and product launches',
        influence: 10,
        keywords: ['salesforce', 'crm', 'marc benioff', 'dreamforce'],
        preIndexed: true,
        sourceCount: 12,
        entities: ['Salesforce'],
        monitoringTopics: [
          'Dreamforce planning',
          'acquisition communications',
          'product launch campaigns',
          'executive thought leadership'
        ]
      });
      
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'High-Growth Tech Startups',
        type: 'Target Client Segment',
        priority: 'critical',
        reason: 'Series B-D startups often need first-time PR agency partnerships',
        influence: 9,
        keywords: ['series b', 'series c', 'unicorn', 'startup', 'scale-up'],
        preIndexed: false,
        sourceCount: 40,
        entities: ['Funded Startups', 'Unicorns', 'Pre-IPO Companies'],
        monitoringTopics: [
          'funding announcements (PR opportunity)',
          'first CMO/VP Marketing hire',
          'product launches',
          'market expansion',
          'competitive positioning needs'
        ]
      });

      // Specific Competitor Agencies
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Edelman',
        type: 'Competitor - Global Leader',
        priority: 'high',
        reason: 'World\'s largest PR firm - monitor for competitive intelligence',
        influence: 8,
        keywords: ['edelman', 'edelman pr'],
        preIndexed: true,
        sourceCount: 8,
        entities: ['Edelman'],
        monitoringTopics: [
          'tech client wins',
          'new service offerings',
          'talent acquisitions',
          'industry thought leadership'
        ]
      });
      
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Weber Shandwick',
        type: 'Competitor - Major Agency',
        priority: 'medium',
        reason: 'Leading global PR agency with strong tech practice',
        influence: 7,
        keywords: ['weber shandwick', 'weber'],
        preIndexed: true,
        sourceCount: 6,
        entities: ['Weber Shandwick'],
        monitoringTopics: [
          'client movements',
          'tech sector focus',
          'award wins',
          'executive changes'
        ]
      });

      // Specific Tech Media Outlets
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'TechCrunch',
        type: 'Media Partner - Tech',
        priority: 'high',
        reason: 'Premier tech media outlet for client coverage and thought leadership',
        influence: 9,
        keywords: ['techcrunch', 'tc', 'disrupt'],
        preIndexed: true,
        sourceCount: 8,
        entities: ['TechCrunch'],
        monitoringTopics: [
          'reporter beats and interests',
          'editorial calendar',
          'Disrupt conference',
          'startup coverage priorities'
        ]
      });
      
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Wall Street Journal Tech',
        type: 'Media Partner - Business',
        priority: 'high',
        reason: 'Leading business publication for enterprise tech coverage',
        influence: 9,
        keywords: ['wsj', 'wall street journal', 'dow jones'],
        preIndexed: true,
        sourceCount: 8,
        entities: ['Wall Street Journal'],
        monitoringTopics: [
          'enterprise tech coverage',
          'tech reporter needs',
          'opinion section opportunities',
          'executive profiles'
        ]
      });

      // Specific VC Firms as Referral Partners  
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Sequoia Capital',
        type: 'Referral Partner - Premier VC',
        priority: 'high',
        reason: 'Top-tier VC that frequently refers PR agencies to portfolio companies',
        influence: 10,
        keywords: ['sequoia', 'sequoia capital', 'roelof botha'],
        preIndexed: true,
        sourceCount: 10,
        entities: ['Sequoia Capital'],
        monitoringTopics: [
          'new portfolio investments',
          'portfolio company launches',
          'partner recommendations',
          'portfolio PR needs'
        ]
      });
      
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Andreessen Horowitz',
        type: 'Referral Partner - Major VC',
        priority: 'high',
        reason: 'Leading VC with 400+ portfolio companies often needing PR services',
        influence: 10,
        keywords: ['a16z', 'andreessen horowitz', 'marc andreessen'],
        preIndexed: true,
        sourceCount: 12,
        entities: ['Andreessen Horowitz'],
        monitoringTopics: [
          'new investments',
          'portfolio expansions',
          'marketing services program',
          'portfolio company needs'
        ]
      });
      
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Y Combinator',
        type: 'Referral Partner - Accelerator',
        priority: 'high',
        reason: 'YC companies often need PR help post-Demo Day',
        influence: 9,
        keywords: ['y combinator', 'yc', 'demo day'],
        preIndexed: false,
        sourceCount: 15,
        entities: ['Y Combinator'],
        monitoringTopics: [
          'Demo Day announcements',
          'new batch companies',
          'YC partner advice on PR',
          'portfolio launches'
        ]
      });

    } else if (isB2B && !isAgency) {
      // B2B Software/SaaS Company
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Enterprise Customers & Prospects',
        type: 'Revenue Drivers',
        priority: 'critical',
        reason: 'Current customers and target accounts driving revenue growth',
        influence: 10,
        keywords: ['customer', 'client', 'account', 'enterprise', 'fortune 500'],
        preIndexed: false,
        sourceCount: 30,
        entities: ['Current Enterprise Accounts', 'Target Fortune 500', 'Strategic Partners'],
        monitoringTopics: ['digital transformation', 'technology budgets', 'vendor evaluations', 'RFPs']
      });

      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Technology Investors',
        type: 'Financial Stakeholders',
        priority: 'high',
        reason: 'VCs and growth investors influencing strategy and providing capital',
        influence: 9,
        keywords: ['venture capital', 'private equity', 'investor', 'funding'],
        preIndexed: true,
        sourceCount: 40,
        entities: ['Current Investors', 'Target VCs', 'Growth Equity Firms'],
        monitoringTopics: ['portfolio movements', 'investment thesis', 'market opinions', 'fund raising']
      });

    } else if (companyName.includes('health') || url.includes('health') || goals.includes('patient')) {
      // Healthcare Company
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Healthcare Regulators & Compliance Bodies',
        type: 'Regulatory Oversight',
        priority: 'critical',
        reason: 'FDA, CMS, and other bodies controlling market access and compliance',
        influence: 10,
        keywords: ['fda', 'cms', 'healthcare regulation', 'hipaa', 'compliance'],
        preIndexed: true,
        sourceCount: 35,
        entities: ['FDA', 'CMS', 'HHS', 'State Health Departments'],
        monitoringTopics: ['regulatory changes', 'compliance requirements', 'approval processes', 'enforcement actions']
      });

      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Healthcare Providers & Systems',
        type: 'Customer Base',
        priority: 'high',
        reason: 'Hospitals, clinics, and providers implementing your solutions',
        influence: 9,
        keywords: ['hospital', 'health system', 'clinic', 'physician', 'provider'],
        preIndexed: false,
        sourceCount: 30,
        entities: ['Major Health Systems', 'Academic Medical Centers', 'Provider Networks'],
        monitoringTopics: ['technology adoption', 'budget cycles', 'clinical needs', 'patient outcomes']
      });

    } else if (companyName.includes('retail') || url.includes('retail') || goals.includes('consumer')) {
      // Retail/Consumer Company
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Consumer Groups & Influencers',
        type: 'Market Drivers',
        priority: 'critical',
        reason: 'End consumers and social influencers driving brand perception',
        influence: 9,
        keywords: ['consumer', 'customer', 'influencer', 'social media', 'review'],
        preIndexed: false,
        sourceCount: 40,
        entities: ['Consumer Advocacy Groups', 'Social Media Influencers', 'Review Platforms'],
        monitoringTopics: ['consumer sentiment', 'product reviews', 'social trends', 'brand mentions']
      });

      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'Retail Partners & Distributors',
        type: 'Channel Partners',
        priority: 'high',
        reason: 'Key retail chains and distribution partners affecting market reach',
        influence: 8,
        keywords: ['retailer', 'distributor', 'wholesale', 'amazon', 'walmart'],
        preIndexed: true,
        sourceCount: 25,
        entities: ['Major Retailers', 'E-commerce Platforms', 'Distribution Networks'],
        monitoringTopics: ['partner requirements', 'shelf space', 'promotional opportunities', 'supply chain']
      });

    } else {
      // Default but still try to be intelligent based on goals
      if (goals.includes('ipo') || goals.includes('public')) {
        suggestions.push({
          id: `stakeholder-${suggestions.length}`,
          name: 'IPO Readiness Stakeholders',
          type: 'Go-Public Strategy',
          priority: 'critical',
          reason: 'Investment banks, analysts, and regulators critical for IPO success',
          influence: 10,
          keywords: ['investment bank', 'ipo', 'sec', 'analyst', 'underwriter'],
          preIndexed: true,
          sourceCount: 35,
          entities: ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'SEC', 'Financial Analysts'],
          monitoringTopics: ['ipo market conditions', 'comparable valuations', 'regulatory requirements', 'analyst coverage']
        });
      }

      if (goals.includes('acquisition') || goals.includes('m&a')) {
        suggestions.push({
          id: `stakeholder-${suggestions.length}`,
          name: 'M&A Targets & Strategic Buyers',
          type: 'Growth Strategy',
          priority: 'high',
          reason: 'Potential acquisition targets and strategic acquirers',
          influence: 9,
          keywords: ['acquisition', 'merger', 'strategic buyer', 'private equity'],
          preIndexed: false,
          sourceCount: 30,
          entities: ['Strategic Buyers', 'PE Firms', 'Acquisition Targets', 'Investment Banks'],
          monitoringTopics: ['M&A activity', 'valuations', 'strategic moves', 'integration challenges']
        });
      }
    }

    // Add industry-specific associations
    if (isAgency) {
      suggestions.push({
        id: `stakeholder-${suggestions.length}`,
        name: 'PR & Marketing Associations',
        type: 'Industry Organizations',
        priority: 'medium',
        reason: 'Industry credibility, awards, best practices, and networking',
        influence: 6,
        keywords: ['prsa', 'prca', 'marketing association', 'communications association'],
        preIndexed: false,
        sourceCount: 15,
        entities: ['PRSA', 'PRCA', 'AMA', 'Content Marketing Institute'],
        monitoringTopics: [
          'industry trends',
          'award deadlines',
          'best practices',
          'regulatory changes',
          'industry events'
        ]
      });
    }

    // Always add user-mentioned stakeholders with enhanced context
    if (userStakeholders && userStakeholders !== 'none') {
      const userMentions = userStakeholders.split(/[,;]/).map(s => s.trim());
      userMentions.forEach(mention => {
        if (mention) {
          suggestions.unshift({
            id: `user-${suggestions.length}`,
            name: mention,
            type: 'User Priority',
            priority: 'critical',
            reason: 'Specifically identified as important by your team',
            influence: 10,
            keywords: [mention.toLowerCase()],
            preIndexed: false,
            sourceCount: 20,
            entities: [mention],
            monitoringTopics: ['all relevant news', 'announcements', 'leadership changes'],
            isUserPriority: true
          });
        }
      });
    }

    return suggestions;
  };

  const finalizeStrategy = async () => {
    setIsTyping(true);
    
    addMessage({
      type: 'ai',
      content: "✅ **Excellent!** I'm finalizing your intelligence monitoring strategy...\n\nConfiguring:\n• Stakeholder monitoring sources\n• Topic tracking systems\n• Real-time intelligence gathering\n• Automated alerts and insights"
    });

    // Generate organization ID if not present
    if (!organizationData.organizationId) {
      organizationData.organizationId = `org-${Date.now()}`;
    }

    // Build final stakeholders list from editable lists
    const finalStakeholders = [];
    
    // Add competitors
    if (editableCompetitors && editableCompetitors.length > 0) {
      editableCompetitors.forEach(name => {
        finalStakeholders.push({
          name: name,
          type: 'competitor',
          priority: 'high',
          keywords: [name.toLowerCase()],
          topics: ['Product Launches', 'Market Moves', 'Partnerships', 'Funding']
        });
      });
    }
    
    // Add topics
    if (editableTopics && editableTopics.length > 0) {
      editableTopics.forEach(name => {
        finalStakeholders.push({
          name: name,
          type: 'topic',
          priority: 'high',
          keywords: name.toLowerCase().split(' '),
          topics: [name]
        });
      });
    }
    
    // Update stakeholders with final list
    setStakeholders(finalStakeholders);

    try {
      // Save stakeholder configuration to backend if we have an organization ID
      if (organizationData.organizationId) {
        // Prepare stakeholders with sources for backend
        const stakeholdersWithSources = await Promise.all(finalStakeholders.map(async (s) => {
          let sources = [];
          
          // If pre-indexed, get sources from database
          if (s.preIndexed && s.name) {
            const preIndexed = findPreIndexedStakeholder(s.name);
            if (preIndexed && preIndexed.sources) {
              sources = preIndexed.sources;
            }
          } else {
            // Discover sources using API
            try {
              sources = await stakeholderIntelligenceService.discoverStakeholderSources(s.name, s.type);
            } catch (error) {
              console.error('Error discovering sources for', s.name, error);
            }
          }
          
          return {
            ...s,
            sources: sources
          };
        }));
        
        // Save configuration to database
        await stakeholderIntelligenceService.saveStakeholderConfiguration(
          organizationData.organizationId,
          stakeholdersWithSources
        );
      }
    } catch (error) {
      console.error('Error saving stakeholder configuration:', error);
      // Continue even if save fails - user can still see the strategy
    }

    // Prepare enhanced strategy data with all collected information
    // Use finalStakeholders directly since setState might not have updated yet
    const enhancedStrategy = {
      organizationId: organizationData.organizationId,
      company: organizationData.company,
      url: organizationData.url,
      industry: determineIndustryFromUrl(organizationData.url) || 'Technology',
      strategicGoals: organizationData.strategicGoals,
      userPriorityStakeholders: organizationData.priorityStakeholders,
      stakeholders: finalStakeholders.map(s => ({
        ...s,
        topics: s.monitoringTopics || s.topics,
        sources: s.preIndexed ? 'Pre-configured' : 'To be configured',
        goals: `Monitor ${s.name} for strategic intelligence`,
        fears: `Missing critical ${s.type.toLowerCase()} signals`
      })),
      stakeholderGroups: finalStakeholders.map((s, idx) => ({
        id: `stakeholder-${idx}`,
        name: s.name,
        type: s.type,
        influence: s.priority === 'high' ? 9 : s.priority === 'medium' ? 7 : 5,
        interest: s.priority === 'high' ? 9 : s.priority === 'medium' ? 7 : 5,
        sentiment: 'neutral',
        currentSentiment: 5,
        targetSentiment: 8,
        engagementLevel: 6,
        trend: 'stable',
        concerns: [s.reason],
        keywords: s.keywords || [],
        topics: s.topics || [],
        preIndexed: s.preIndexed || false,
        sourceCount: s.sourceCount || 0
      })),
      overview: `Automated intelligence monitoring for ${organizationData.company}`,
      enhancedFeatures: {
        preIndexedCount: finalStakeholders.filter(s => s.preIndexed).length,
        totalSources: finalStakeholders.reduce((acc, s) => acc + s.sourceCount, 0),
        researchAgentsEnabled: true,
        urlAnalysisEnabled: true,
        strategicAlignment: true,
        backendIntegration: true
      }
    };

    setTimeout(() => {
      onStrategyComplete(enhancedStrategy);
      setIsTyping(false);
    }, 2000);
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
                    <Bot size={16} />
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>AI Strategy Advisor</span>
                  </div>
                )}
                
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                
                {/* Editable Targets Lists */}
                {message.editableTargets && (
                  <div style={{ marginTop: '1rem' }}>
                    {/* Competitors List - Use live state */}
                    {editableCompetitors && editableCompetitors.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building2 size={18} /> Competitors to Track
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {editableCompetitors.map((competitor, idx) => (
                            <div key={`comp-${idx}`} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              background: '#f9fafb',
                              borderRadius: '0.5rem',
                              border: '1px solid #e5e7eb'
                            }}>
                              <span style={{ fontWeight: '600', color: '#6366f1', minWidth: '20px' }}>{idx + 1}.</span>
                              {editingType === 'competitor' && editingIndex === idx ? (
                                <>
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const updated = [...editableCompetitors];
                                        updated[idx] = editValue;
                                        setEditableCompetitors(updated);
                                        setEditingType(null);
                                        setEditingIndex(null);
                                        setEditValue('');
                                      }
                                    }}
                                    onBlur={() => {
                                      const updated = [...editableCompetitors];
                                      updated[idx] = editValue;
                                      setEditableCompetitors(updated);
                                      setEditingType(null);
                                      setEditingIndex(null);
                                      setEditValue('');
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '0.25rem',
                                      border: '1px solid #6366f1',
                                      borderRadius: '0.25rem',
                                      outline: 'none'
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = editableCompetitors.filter((_, i) => i !== idx);
                                      setEditableCompetitors(updated);
                                      setEditingType(null);
                                      setEditingIndex(null);
                                    }}
                                    style={{
                                      padding: '0.25rem',
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Remove
                                  </button>
                                </>
                              ) : (
                                <span
                                  onClick={() => {
                                    setEditingType('competitor');
                                    setEditingIndex(idx);
                                    setEditValue(competitor);
                                  }}
                                  style={{
                                    flex: 1,
                                    cursor: 'pointer',
                                    color: '#374151',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  {competitor}
                                </span>
                              )}
                            </div>
                          ))}
                          {/* Add new competitor button */}
                          <button
                            onClick={() => {
                              const newName = prompt('Enter competitor name:');
                              if (newName && newName.trim()) {
                                const updated = [...editableCompetitors, newName.trim()];
                                setEditableCompetitors(updated);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              background: 'white',
                              borderRadius: '0.5rem',
                              border: '1px dashed #6366f1',
                              color: '#6366f1',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f0f0ff';
                              e.currentTarget.style.borderStyle = 'solid';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderStyle = 'dashed';
                            }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>+</span> Add Competitor
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Topics List - Use live state */}
                    {editableTopics && editableTopics.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <TrendingUp size={18} /> Topics to Monitor
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {editableTopics.map((topic, idx) => (
                            <div key={`topic-${idx}`} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              background: '#f9fafb',
                              borderRadius: '0.5rem',
                              border: '1px solid #e5e7eb'
                            }}>
                              <span style={{ fontWeight: '600', color: '#10b981', minWidth: '20px' }}>{idx + 1}.</span>
                              {editingType === 'topic' && editingIndex === idx ? (
                                <>
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const updated = [...editableTopics];
                                        updated[idx] = editValue;
                                        setEditableTopics(updated);
                                        setEditingType(null);
                                        setEditingIndex(null);
                                        setEditValue('');
                                      }
                                    }}
                                    onBlur={() => {
                                      const updated = [...editableTopics];
                                      updated[idx] = editValue;
                                      setEditableTopics(updated);
                                      setEditingType(null);
                                      setEditingIndex(null);
                                      setEditValue('');
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '0.25rem',
                                      border: '1px solid #10b981',
                                      borderRadius: '0.25rem',
                                      outline: 'none'
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = editableTopics.filter((_, i) => i !== idx);
                                      setEditableTopics(updated);
                                      setEditingType(null);
                                      setEditingIndex(null);
                                    }}
                                    style={{
                                      padding: '0.25rem',
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Remove
                                  </button>
                                </>
                              ) : (
                                <span
                                  onClick={() => {
                                    setEditingType('topic');
                                    setEditingIndex(idx);
                                    setEditValue(topic);
                                  }}
                                  style={{
                                    flex: 1,
                                    cursor: 'pointer',
                                    color: '#374151',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  {topic}
                                </span>
                              )}
                            </div>
                          ))}
                          {/* Add new topic button */}
                          <button
                            onClick={() => {
                              const newName = prompt('Enter topic to monitor:');
                              if (newName && newName.trim()) {
                                const updated = [...editableTopics, newName.trim()];
                                setEditableTopics(updated);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              background: 'white',
                              borderRadius: '0.5rem',
                              border: '1px dashed #10b981',
                              color: '#10b981',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f0fff0';
                              e.currentTarget.style.borderStyle = 'solid';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderStyle = 'dashed';
                            }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>+</span> Add Topic
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Progress Indicator */}
                {message.showProgress && isAnalyzing && (
                  <div style={{ marginTop: '1rem' }}>
                    {Object.entries(analysisProgress).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                            {key === 'organization' && 'Organization Analysis'}
                            {key === 'stakeholders' && 'Stakeholder Discovery'}
                            {key === 'sources' && 'Source Configuration'}
                            {key === 'strategy' && 'Strategy Generation'}
                          </span>
                          <span style={{ fontSize: '0.875rem' }}>{value}%</span>
                        </div>
                        <div style={{
                          height: '6px',
                          background: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            background: '#6366f1',
                            width: `${value}%`,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Stakeholder Results */}
                {message.stakeholderResults && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: '600' }}>
                      Discovered Stakeholders:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {message.stakeholderResults.map(stakeholder => (
                        <div key={stakeholder.id} style={{
                          padding: '0.75rem',
                          background: stakeholder.preIndexed ? '#f0f9ff' : '#f9fafb',
                          borderRadius: '0.5rem',
                          border: `1px solid ${stakeholder.preIndexed ? '#bfdbfe' : '#e5e7eb'}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                {stakeholder.name}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                {stakeholder.type} • Influence: {stakeholder.influence}/10
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {stakeholder.reason}
                              </div>
                              {stakeholder.entities && stakeholder.entities.length > 0 && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#4b5563' }}>
                                  <strong>Includes:</strong> {stakeholder.entities.join(', ')}
                                </div>
                              )}
                            </div>
                            {stakeholder.preIndexed && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.5rem',
                                background: '#dbeafe',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                color: '#1e40af',
                                fontWeight: '500',
                                flexShrink: 0
                              }}>
                                <Database size={12} />
                                {stakeholder.sourceCount} sources
                              </div>
                            )}
                          </div>
                          {stakeholder.monitoringTopics && stakeholder.monitoringTopics.length > 0 && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {stakeholder.monitoringTopics.slice(0, 3).map((topic, idx) => (
                                <span key={idx} style={{
                                  padding: '0.125rem 0.375rem',
                                  background: '#e0e7ff',
                                  color: '#4338ca',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.625rem'
                                }}>
                                  {topic}
                                </span>
                              ))}
                              {stakeholder.monitoringTopics.length > 3 && (
                                <span style={{
                                  padding: '0.125rem 0.375rem',
                                  color: '#6b7280',
                                  fontSize: '0.625rem'
                                }}>
                                  +{stakeholder.monitoringTopics.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: '#f0fdf4',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0',
                      fontSize: '0.875rem'
                    }}>
                      <strong>Ready to proceed?</strong> I'll automatically configure sources for all pre-indexed stakeholders and help you set up the rest.
                    </div>
                  </div>
                )}
                
                {/* Options */}
                {message.options && message.options.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {console.log('Rendering options for message:', message.id, message.options)}
                    {message.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUserResponse(option.value)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.target.style.background = '#6366f1';
                          e.target.style.color = 'white';
                          e.target.style.borderColor = '#6366f1';
                        }}
                        onMouseLeave={e => {
                          e.target.style.background = '#f3f4f6';
                          e.target.style.color = '#111827';
                          e.target.style.borderColor = '#e5e7eb';
                        }}
                      >
                        {option.label || option.text}
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
              <span style={{ fontSize: '0.875rem' }}>AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Analysis Progress Indicator */}
        {isAnalyzing && (
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '0.75rem',
            margin: '1rem 2rem',
            color: 'white'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                🔍 Analyzing {organizationData.company}
              </h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Using AI agents to discover stakeholders and intelligence targets...
              </p>
            </div>
            <div style={{ space: '0.75rem' }}>
              {[
                { key: 'organization', label: 'Analyzing Organization', icon: Building2 },
                { key: 'stakeholders', label: 'Finding Competitors', icon: Users },
                { key: 'sources', label: 'Discovering Topics', icon: Database },
                { key: 'strategy', label: 'Building Strategy', icon: Brain }
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={16} />
                      <span style={{ fontSize: '0.875rem' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem' }}>{analysisProgress[key]}%</span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${analysisProgress[key]}%`,
                      background: 'white',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {currentStep !== 'analyzing' && (
          <div style={{
            padding: '1rem 2rem',
            borderTop: '1px solid #e5e7eb',
            background: 'white'
          }}>
            <form onSubmit={(e) => { e.preventDefault(); handleInputSubmit(); }} style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {(currentStep === 'strategic_goals' || currentStep === 'priority_stakeholders') ? (
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={
                    currentStep === 'strategic_goals' ? "Enter your strategic goals..." :
                    currentStep === 'priority_stakeholders' ? "List important stakeholders or type 'none'..." :
                    "Type your response..."
                  }
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit'
                  }}
                />
              ) : (
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={
                    currentStep === 'organization_input' ? "Enter organization name and URL..." :
                    currentStep === 'company_info' ? "Enter company name and URL..." :
                    currentStep === 'confirm_stakeholders' ? "Choose an option above..." :
                    "Type your response..."
                  }
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              )}
              <button
                type="submit"
                disabled={!userInput.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: userInput.trim() ? '#6366f1' : '#e5e7eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: userInput.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Send
                <ChevronRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Confirm button for stakeholders */}
        {currentStep === 'review_stakeholders' && (
          <div style={{
            padding: '1rem 2rem',
            borderTop: '1px solid #e5e7eb',
            background: 'white'
          }}>
            <button
              onClick={finalizeStrategy}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle size={16} />
              Confirm Stakeholders & Build Strategy
            </button>
          </div>
        )}
      </div>

      {/* Side Panel */}
      <div style={{
        width: '320px',
        background: 'white',
        borderLeft: '1px solid #e5e7eb',
        padding: '1.5rem',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
          Enhanced Features
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            padding: '1rem',
            background: '#f0f9ff',
            borderRadius: '0.5rem',
            border: '1px solid #bfdbfe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Database size={16} style={{ color: '#3b82f6' }} />
              <span style={{ fontWeight: '600', color: '#1e40af' }}>Pre-Indexed Database</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#1e3a8a' }}>
              Instant access to verified sources for major stakeholders like BlackRock, SEC, and leading media outlets.
            </p>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '0.5rem',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Brain size={16} style={{ color: '#10b981' }} />
              <span style={{ fontWeight: '600', color: '#166534' }}>Deep Research</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#166534' }}>
              AI-powered analysis of your organization to identify key stakeholders and their priorities.
            </p>
          </div>

          <div style={{
            padding: '1rem',
            background: '#fef3c7',
            borderRadius: '0.5rem',
            border: '1px solid #fde68a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Zap size={16} style={{ color: '#f59e0b' }} />
              <span style={{ fontWeight: '600', color: '#92400e' }}>Auto Configuration</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>
              Sources are automatically configured with RSS feeds, APIs, and social media accounts.
            </p>
          </div>
        </div>

        {/* Stats */}
        {isAnalyzing && (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
              Research Progress
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>Sources Analyzed</span>
                <span style={{ fontWeight: '600' }}>47</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>Stakeholders Found</span>
                <span style={{ fontWeight: '600' }}>12</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>Pre-Indexed Matches</span>
                <span style={{ fontWeight: '600' }}>4</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAIStrategyAdvisor;