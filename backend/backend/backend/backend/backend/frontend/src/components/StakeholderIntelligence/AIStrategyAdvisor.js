import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Users, Building, Target, CheckCircle, Loader } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const AIStrategyAdvisor = ({ onStrategyComplete, existingStrategy }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStakeholders, setSelectedStakeholders] = useState([]);
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [stage, setStage] = useState('initial'); // initial, stakeholder_selection, topic_configuration, complete
  const [stakeholderTopics, setStakeholderTopics] = useState({});
  const [lastAISuggestions, setLastAISuggestions] = useState({});
  const [selectedTopics, setSelectedTopics] = useState([]); // Topics selected for current stakeholder

  useEffect(() => {
    // Initial message
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm your AI Strategy Advisor. I'll help you identify and prioritize your key stakeholders.

To get started, please tell me:
- Your organization name
- Your industry or sector
- Key stakeholders you work with (investors, customers, employees, etc.)
- Any specific goals or concerns you have

For example: "We're TechCorp, a SaaS company. Our key stakeholders include enterprise customers, investors, and our remote workforce. We're concerned about customer retention and employee engagement."`,
        timestamp: new Date()
      }]);
    }
  }, []);

  const sendMessage = async (message, isAutomatic = false) => {
    if (!message.trim()) return;

    const userMessage = { 
      role: 'user', 
      content: message,
      timestamp: new Date()
    };
    
    // Only add user message to display if not automatic
    if (!isAutomatic) {
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/stakeholder-discovery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          stage: stage,
          organizationInfo: organizationInfo,
          selectedStakeholders: selectedStakeholders,
          conversationHistory: messages.slice(-5)
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      
      const data = await response.json();
      
      // Handle different response types
      if (data.type === 'stakeholder_suggestions') {
        setOrganizationInfo(data.organizationInfo);
        setStage('stakeholder_selection');
        
        const aiMessage = {
          role: 'assistant',
          content: data.message,
          stakeholders: data.stakeholders,
          type: 'stakeholder_selection',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else if (data.type === 'topic_suggestions') {
        // Handle topic suggestions similar to stakeholder suggestions
        const currentStakeholder = selectedStakeholders.find(s => 
          !stakeholderTopics[s.id]?.topics?.length
        ) || selectedStakeholders[0];
        
        const aiMessage = {
          role: 'assistant',
          content: data.message,
          topics: data.topics,
          goals: data.goals,
          fears: data.fears,
          type: 'topic_selection',
          currentStakeholder: currentStakeholder,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const aiMessage = {
          role: 'assistant',
          content: data.message || data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('AI Strategy Advisor error:', error);
      // Fallback for demo
      if (stage === 'initial') {
        handleInitialResponse(message);
      } else if (stage === 'topic_configuration') {
        handleTopicConfiguration(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback response handler for demo
  const handleInitialResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Extract organization info from user input
    const orgInfo = {
      company: extractCompanyName(userInput),
      industry: extractIndustry(userInput),
      description: userInput
    };
    setOrganizationInfo(orgInfo);
    setStage('stakeholder_selection');

    // Generate stakeholder suggestions
    const stakeholders = generateStakeholderSuggestions(userInput);
    
    const aiMessage = {
      role: 'assistant',
      content: `Great! Based on what you've told me about ${orgInfo.company || 'your organization'} in the ${orgInfo.industry || 'your'} industry, I've identified these potential stakeholder groups:

Please select the stakeholders that are most important to your organization by clicking on them. You can select multiple stakeholders.`,
      stakeholders: stakeholders,
      type: 'stakeholder_selection',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  const extractCompanyName = (text) => {
    // Simple extraction logic - in production this would be more sophisticated
    const patterns = [
      /we['']re\s+(\w+)/i,
      /(?:company|organization|firm)\s+(?:is\s+)?(\w+)/i,
      /^(\w+),?\s+(?:a|an|the)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const extractIndustry = (text) => {
    const industries = ['saas', 'software', 'tech', 'fintech', 'healthcare', 'retail', 'manufacturing', 'education', 'nonprofit', 'government'];
    const lowerText = text.toLowerCase();
    
    for (const industry of industries) {
      if (lowerText.includes(industry)) {
        return industry.charAt(0).toUpperCase() + industry.slice(1);
      }
    }
    return null;
  };

  const generateStakeholderSuggestions = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    const stakeholders = [];

    // Always suggest these core stakeholders
    const coreStakeholders = [
      { id: 'customers', name: 'Customers', icon: Users, description: 'End users and clients', priority: 'high' },
      { id: 'employees', name: 'Employees', icon: Users, description: 'Team members and staff', priority: 'high' },
      { id: 'investors', name: 'Investors', icon: Building, description: 'Shareholders and funders', priority: 'high' }
    ];

    stakeholders.push(...coreStakeholders);

    // Add context-specific stakeholders
    if (lowerInput.includes('partner') || lowerInput.includes('vendor') || lowerInput.includes('supplier')) {
      stakeholders.push({ id: 'partners', name: 'Partners & Suppliers', icon: Building, description: 'Business partners and vendors', priority: 'medium' });
    }

    if (lowerInput.includes('regulator') || lowerInput.includes('government') || lowerInput.includes('compliance')) {
      stakeholders.push({ id: 'regulators', name: 'Regulators', icon: Building, description: 'Government and regulatory bodies', priority: 'medium' });
    }

    if (lowerInput.includes('media') || lowerInput.includes('press') || lowerInput.includes('pr')) {
      stakeholders.push({ id: 'media', name: 'Media & Press', icon: Building, description: 'Journalists and media outlets', priority: 'medium' });
    }

    if (lowerInput.includes('community') || lowerInput.includes('local') || lowerInput.includes('social')) {
      stakeholders.push({ id: 'community', name: 'Community', icon: Users, description: 'Local community and society', priority: 'medium' });
    }

    if (lowerInput.includes('competitor')) {
      stakeholders.push({ id: 'competitors', name: 'Competitors', icon: Building, description: 'Industry competitors', priority: 'low' });
    }

    // Extract any specific stakeholders mentioned
    const specificPatterns = [
      /stakeholders?\s+(?:include|are|like)\s+([^.]+)/i,
      /(?:work with|serve|support)\s+([^.]+)/i
    ];

    for (const pattern of specificPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        const mentioned = match[1].split(/,|\band\b/).map(s => s.trim());
        mentioned.forEach(name => {
          if (name && !stakeholders.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            stakeholders.push({
              id: name.toLowerCase().replace(/\s+/g, '_'),
              name: name.charAt(0).toUpperCase() + name.slice(1),
              icon: Users,
              description: 'Custom stakeholder group',
              priority: 'medium'
            });
          }
        });
      }
    }

    return stakeholders;
  };

  // Handle topic configuration responses
  const handleTopicConfiguration = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Find current stakeholder being configured
    const currentIndex = selectedStakeholders.findIndex(s => 
      !stakeholderTopics[s.id]?.topics?.length
    );
    const currentStakeholder = selectedStakeholders[currentIndex] || selectedStakeholders[0];
    
    // Generate topic suggestions based on stakeholder type
    const topicSuggestions = generateTopicSuggestions(currentStakeholder);
    
    // Check if user provided specific input about goals/fears
    const goals = extractGoals(userInput);
    const fears = extractFears(userInput);
    
    // Create the topic selection message
    const aiMessage = {
      role: 'assistant',
      content: `Based on ${currentStakeholder.name}'s role, here are recommended topics to monitor. Click to select the ones you want to track:`,
      topics: topicSuggestions,
      goals: goals || `Stay informed about ${currentStakeholder.name} activities and maintain positive relationships`,
      fears: fears || `Miss critical updates or negative developments that could impact our relationship`,
      type: 'topic_selection',
      currentStakeholder: currentStakeholder,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  const generateTopicSuggestions = (stakeholder) => {
    const name = stakeholder.name.toLowerCase();
    const suggestions = [];
    
    // Base topics for all stakeholders
    const baseTopics = [
      { id: 'announcements', name: 'Official Announcements', description: 'Press releases and formal statements' },
      { id: 'leadership', name: 'Leadership Changes', description: 'Executive appointments and departures' },
      { id: 'strategic', name: 'Strategic Initiatives', description: 'New directions and major decisions' }
    ];
    
    // Stakeholder-specific topics
    if (name.includes('investor') || name.includes('shareholder')) {
      suggestions.push(
        { id: 'funding', name: 'Funding Rounds', description: 'Investment news and valuations' },
        { id: 'ipo', name: 'IPO Activity', description: 'Public offering plans and updates' },
        { id: 'earnings', name: 'Earnings Reports', description: 'Financial performance and guidance' },
        { id: 'ma', name: 'M&A Activity', description: 'Mergers, acquisitions, and divestitures' },
        { id: 'dividends', name: 'Dividends & Buybacks', description: 'Shareholder returns and capital allocation' }
      );
    }
    
    if (name.includes('customer') || name.includes('client')) {
      suggestions.push(
        { id: 'product', name: 'Product Launches', description: 'New products and features' },
        { id: 'pricing', name: 'Pricing Changes', description: 'Price updates and packaging' },
        { id: 'outages', name: 'Service Issues', description: 'Outages, bugs, and disruptions' },
        { id: 'reviews', name: 'Customer Sentiment', description: 'Reviews and satisfaction scores' },
        { id: 'competitors', name: 'Competitive Moves', description: 'What competitors are offering' }
      );
    }
    
    if (name.includes('employee') || name.includes('staff') || name.includes('talent')) {
      suggestions.push(
        { id: 'layoffs', name: 'Workforce Changes', description: 'Layoffs, hiring freezes, expansions' },
        { id: 'culture', name: 'Company Culture', description: 'Work environment and employee satisfaction' },
        { id: 'benefits', name: 'Benefits & Compensation', description: 'Pay, perks, and policy changes' },
        { id: 'remote', name: 'Work Policies', description: 'Remote work and office requirements' },
        { id: 'diversity', name: 'DEI Initiatives', description: 'Diversity, equity, and inclusion efforts' }
      );
    }
    
    if (name.includes('partner') || name.includes('supplier') || name.includes('vendor')) {
      suggestions.push(
        { id: 'partnerships', name: 'Partnership News', description: 'New alliances and collaborations' },
        { id: 'contracts', name: 'Contract Updates', description: 'Terms, renewals, and negotiations' },
        { id: 'supply', name: 'Supply Chain', description: 'Disruptions and logistics updates' },
        { id: 'integration', name: 'Integration News', description: 'Technical and operational updates' }
      );
    }
    
    if (name.includes('regulator') || name.includes('government')) {
      suggestions.push(
        { id: 'compliance', name: 'Compliance Updates', description: 'New rules and requirements' },
        { id: 'investigations', name: 'Investigations', description: 'Regulatory scrutiny and probes' },
        { id: 'fines', name: 'Penalties & Fines', description: 'Enforcement actions' },
        { id: 'policy', name: 'Policy Changes', description: 'Legislative and regulatory shifts' }
      );
    }
    
    if (name.includes('media') || name.includes('press')) {
      suggestions.push(
        { id: 'coverage', name: 'Media Coverage', description: 'Articles and news mentions' },
        { id: 'pr', name: 'PR Campaigns', description: 'Marketing and publicity efforts' },
        { id: 'crisis', name: 'Crisis Coverage', description: 'Negative news and scandals' },
        { id: 'awards', name: 'Awards & Recognition', description: 'Industry accolades' }
      );
    }
    
    if (name.includes('community') || name.includes('public')) {
      suggestions.push(
        { id: 'social', name: 'Social Impact', description: 'Community programs and CSR' },
        { id: 'environment', name: 'Environmental', description: 'Sustainability and green initiatives' },
        { id: 'local', name: 'Local News', description: 'Regional impacts and presence' },
        { id: 'activism', name: 'Public Sentiment', description: 'Protests, boycotts, support' }
      );
    }
    
    // Add base topics to all
    suggestions.push(...baseTopics);
    
    // Remove duplicates and limit
    const uniqueSuggestions = suggestions.filter((s, idx, arr) => 
      arr.findIndex(item => item.id === s.id) === idx
    );
    
    return uniqueSuggestions.slice(0, 8); // Limit to 8 suggestions
  };

  const checkAffirmativeResponse = (text) => {
    const affirmatives = [
      'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'sounds good', 'perfect',
      'great', 'excellent', 'that works', 'let\'s do that', 'agreed', 'correct',
      'absolutely', 'definitely', 'use those', 'use these', 'i like those',
      'those are good', 'that\'s good', 'looks good', 'approve', 'confirm',
      'proceed', 'continue', 'next', 'accept', 'go ahead', 'all set'
    ];
    
    const lowerText = text.toLowerCase();
    return affirmatives.some(phrase => lowerText.includes(phrase));
  };

  const extractSuggestedTopics = (aiMessage) => {
    const topics = [];
    
    // Look for bullet points with quoted items first (most reliable)
    const quotedBulletPattern = /[•\-*]\s*"([^"]+)"/g;
    let matches;
    while ((matches = quotedBulletPattern.exec(aiMessage)) !== null) {
      topics.push(matches[1].trim().toLowerCase());
    }
    
    // If no quoted bullets found, try regular bullet points
    if (topics.length === 0) {
      const bulletPattern = /[•\-*]\s*([^•\-*\n]+)/g;
      while ((matches = bulletPattern.exec(aiMessage)) !== null) {
        const topic = matches[1].trim();
        // Filter out explanatory text (usually has ":" or is very long)
        if (!topic.includes(':') && topic.length > 2 && topic.length < 40) {
          topics.push(topic.toLowerCase());
        }
      }
    }
    
    // Common stakeholder-related topics mentioned in context
    const commonTopics = [
      'product launch', 'acquisition', 'merger', 'partnership', 'funding',
      'layoffs', 'expansion', 'earnings', 'leadership change', 'scandal',
      'lawsuit', 'regulation', 'price change', 'new feature', 'outage',
      'data breach', 'ipo', 'restructuring', 'bankruptcy', 'innovation',
      'funding rounds', 'ipo announcements', 'earnings reports',
      'product launches', 'price changes', 'service outages',
      'leadership changes', 'company culture'
    ];
    
    // Add common topics that appear in quotes anywhere in the message
    const allQuotedPattern = /"([^"]+)"/g;
    while ((matches = allQuotedPattern.exec(aiMessage)) !== null) {
      const quoted = matches[1].toLowerCase();
      if (commonTopics.some(topic => quoted.includes(topic))) {
        topics.push(quoted);
      }
    }
    
    // Remove duplicates and return
    return [...new Set(topics)].slice(0, 10); // Limit to 10 topics
  };

  const extractTopics = (text) => {
    const topics = [];
    
    // Common patterns for topics
    const patterns = [
      /track\s+(?:about\s+)?([^,.]+)/gi,
      /monitor\s+(?:for\s+)?([^,.]+)/gi,
      /watch\s+(?:for\s+)?([^,.]+)/gi,
      /announcements?\s+(?:about\s+)?([^,.]+)/gi,
      /news\s+(?:about\s+)?([^,.]+)/gi,
      /updates?\s+(?:on\s+)?([^,.]+)/gi
    ];
    
    // Extract from patterns
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          topics.push(match[1].trim());
        }
      }
    });
    
    // Also look for quoted terms
    const quotedTerms = text.match(/"([^"]+)"/g);
    if (quotedTerms) {
      quotedTerms.forEach(term => {
        topics.push(term.replace(/"/g, ''));
      });
    }
    
    // Common announcement types
    const announcementTypes = [
      'product launch', 'acquisition', 'merger', 'partnership', 'funding',
      'layoffs', 'expansion', 'earnings', 'leadership change', 'scandal',
      'lawsuit', 'regulation', 'price change', 'new feature', 'outage'
    ];
    
    announcementTypes.forEach(type => {
      if (text.includes(type)) {
        topics.push(type);
      }
    });
    
    return [...new Set(topics)]; // Remove duplicates
  };

  const extractGoals = (text) => {
    const goalPatterns = [
      /goal(?:s)?\s*(?:is|are)?\s*(?:to\s+)?([^.]+)/i,
      /want(?:s)?\s+to\s+([^.]+)/i,
      /hope(?:s)?\s+to\s+([^.]+)/i,
      /aim(?:s)?\s+to\s+([^.]+)/i,
      /objective(?:s)?\s*(?:is|are)?\s*(?:to\s+)?([^.]+)/i
    ];
    
    for (const pattern of goalPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  };

  const extractFears = (text) => {
    const fearPatterns = [
      /fear(?:s)?\s*(?:is|are)?\s*(?:that\s+)?([^.]+)/i,
      /concern(?:s|ed)?\s*(?:is|are|about)?\s*(?:that\s+)?([^.]+)/i,
      /worr(?:y|ied)\s+(?:about|that)\s+([^.]+)/i,
      /risk(?:s)?\s*(?:is|are)?\s*(?:that\s+)?([^.]+)/i,
      /afraid\s+(?:of|that)\s+([^.]+)/i
    ];
    
    for (const pattern of fearPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  };

  const toggleStakeholder = (stakeholder) => {
    setSelectedStakeholders(prev => {
      const isSelected = prev.some(s => s.id === stakeholder.id);
      if (isSelected) {
        return prev.filter(s => s.id !== stakeholder.id);
      } else {
        return [...prev, stakeholder];
      }
    });
  };

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => {
      const isSelected = prev.some(t => t.id === topic.id);
      if (isSelected) {
        return prev.filter(t => t.id !== topic.id);
      } else {
        return [...prev, topic];
      }
    });
  };

  const confirmTopicSelection = () => {
    const currentStakeholder = selectedStakeholders.find(s => 
      !stakeholderTopics[s.id]?.topics?.length
    ) || selectedStakeholders[0];
    
    if (!currentStakeholder) return;
    
    // Get the latest message for goals/fears
    const lastMessage = messages[messages.length - 1];
    const goals = lastMessage?.goals || `Monitor ${currentStakeholder.name} activities`;
    const fears = lastMessage?.fears || 'Miss important updates';
    
    // Update stakeholder topics
    setStakeholderTopics(prev => ({
      ...prev,
      [currentStakeholder.id]: {
        topics: selectedTopics.map(t => t.name.toLowerCase()),
        goals: goals,
        fears: fears
      }
    }));
    
    // Clear selected topics for next stakeholder
    setSelectedTopics([]);
    
    // Check if there are more stakeholders
    const currentIndex = selectedStakeholders.findIndex(s => s.id === currentStakeholder.id);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < selectedStakeholders.length) {
      const nextStakeholder = selectedStakeholders[nextIndex];
      // Generate suggestions for next stakeholder
      handleTopicConfiguration(`Show topics for ${nextStakeholder.name}`);
    } else {
      // All stakeholders configured, show completion
      completeTopicConfiguration();
    }
  };

  const completeSelection = () => {
    if (selectedStakeholders.length === 0) return;

    // Move to topic configuration stage
    setStage('topic_configuration');
    
    // Initialize topics for each stakeholder
    const initialTopics = {};
    selectedStakeholders.forEach(s => {
      initialTopics[s.id] = {
        topics: [],
        goals: '',
        fears: ''
      };
    });
    setStakeholderTopics(initialTopics);

    // Show topic configuration for first stakeholder
    handleTopicConfiguration(`Show topics for ${selectedStakeholders[0].name}`);
  };

  const completeTopicConfiguration = () => {
    // Create strategy with topics
    const strategy = {
      company: organizationInfo?.company || 'Organization',
      industry: organizationInfo?.industry || 'General',
      overview: organizationInfo?.description || '',
      stakeholders: selectedStakeholders.map(s => ({
        id: s.id,
        name: s.name,
        priority: s.priority,
        reason: s.description,
        keywords: [
          s.name.toLowerCase(), 
          organizationInfo?.company?.toLowerCase(),
          ...(stakeholderTopics[s.id]?.topics || [])
        ].filter(Boolean),
        topics: stakeholderTopics[s.id]?.topics || [],
        goals: stakeholderTopics[s.id]?.goals || '',
        fears: stakeholderTopics[s.id]?.fears || ''
      }))
    };

    // Add completion message
    const completionMessage = {
      role: 'assistant',
      content: `Perfect! I've set up your stakeholder intelligence system with ${selectedStakeholders.length} stakeholder groups and their specific tracking topics:

${selectedStakeholders.map(s => {
  const topics = stakeholderTopics[s.id];
  return `• **${s.name}**
  - Topics: ${topics.topics.join(', ') || 'General monitoring'}
  - Goals: ${topics.goals || 'Track general activity'}
  - Concerns: ${topics.fears || 'No specific concerns'}`;
}).join('\n\n')}

You can now:
- Configure data sources in the "Source Configuration" tab
- Monitor real-time intelligence in the "Agentic Monitoring" tab
- View insights and analysis in the "Strategic Insights" tab

The AI will use your goals and concerns to provide contextual analysis for each finding.`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, completionMessage]);
    setStage('complete');
    
    // Notify parent component
    onStrategyComplete(strategy);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={24} style={{ color: 'white' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
            AI Strategy Advisor
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            Let's identify and prioritize your key stakeholders
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((message, idx) => (
          <div key={idx}>
            <div style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: message.type === 'stakeholder_selection' ? '90%' : '70%',
                padding: '0.75rem 1rem',
                background: message.role === 'user' ? '#6366f1' : 'white',
                color: message.role === 'user' ? 'white' : '#111827',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                boxShadow: message.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}>
                {message.content}
              </div>
            </div>

            {/* Stakeholder Selection Buttons */}
            {message.type === 'stakeholder_selection' && message.stakeholders && (
              <div style={{
                marginTop: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '0.75rem'
              }}>
                {message.stakeholders.map(stakeholder => {
                  const Icon = stakeholder.icon || Users;
                  const isSelected = selectedStakeholders.some(s => s.id === stakeholder.id);
                  
                  return (
                    <button
                      key={stakeholder.id}
                      onClick={() => toggleStakeholder(stakeholder)}
                      style={{
                        padding: '1rem',
                        background: isSelected ? '#eef2ff' : 'white',
                        border: `2px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: isSelected ? '#6366f1' : '#f3f4f6',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected ? (
                          <CheckCircle size={18} style={{ color: 'white' }} />
                        ) : (
                          <Icon size={18} style={{ color: '#6b7280' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                          {stakeholder.name}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          {stakeholder.description}
                        </p>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '0.5rem',
                          padding: '0.125rem 0.5rem',
                          background: stakeholder.priority === 'high' ? '#fee2e2' : 
                                     stakeholder.priority === 'medium' ? '#fef3c7' : '#e0e7ff',
                          color: stakeholder.priority === 'high' ? '#991b1b' : 
                                 stakeholder.priority === 'medium' ? '#92400e' : '#3730a3',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}>
                          {stakeholder.priority} priority
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Topic Selection Buttons */}
            {message.type === 'topic_selection' && message.topics && (
              <div style={{
                marginTop: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '0.75rem'
              }}>
                {message.topics.map(topic => {
                  const isSelected = selectedTopics.some(t => t.id === topic.id);
                  
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic)}
                      style={{
                        padding: '1rem',
                        background: isSelected ? '#eef2ff' : 'white',
                        border: `2px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: isSelected ? '#6366f1' : '#f3f4f6',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected ? (
                          <CheckCircle size={18} style={{ color: 'white' }} />
                        ) : (
                          <Target size={18} style={{ color: '#6b7280' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                          {topic.name}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          {topic.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Confirm Topic Selection Button */}
            {message.type === 'topic_selection' && idx === messages.length - 1 && selectedTopics.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={confirmTopicSelection}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle size={18} />
                  Confirm {selectedTopics.length} Topic{selectedTopics.length > 1 ? 's' : ''}
                </button>
              </div>
            )}

            {/* Confirm Selection Button */}
            {message.type === 'stakeholder_selection' && idx === messages.length - 1 && selectedStakeholders.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={completeSelection}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle size={18} />
                  Confirm {selectedStakeholders.length} Stakeholder{selectedStakeholders.length > 1 ? 's' : ''}
                </button>
              </div>
            )}

            {/* Complete Configuration Button */}
            {message.type === 'topic_summary' && idx === messages.length - 1 && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={completeTopicConfiguration}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle size={18} />
                  Confirm Configuration
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '0.75rem 1rem',
              background: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '1rem 1.5rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(inputValue);
            }
          }}
          placeholder={stage === 'initial' ? 
            "Tell me about your organization and stakeholders..." : 
            "Ask me anything about stakeholder management..."}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            outline: 'none',
            resize: 'none',
            minHeight: '42px',
            maxHeight: '120px',
            overflowY: 'auto',
            fontFamily: 'inherit',
            lineHeight: '1.5'
          }}
          rows={1}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onFocus={(e) => e.target.style.borderColor = '#6366f1'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        <button
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          style={{
            padding: '0.75rem 1rem',
            background: inputValue.trim() && !isLoading ? '#6366f1' : '#e5e7eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0
          }}
        >
          <Send size={16} />
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIStrategyAdvisor;