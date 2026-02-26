import React, { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, Globe, Shield, FileText, 
  Trash2, CheckCircle, AlertCircle, Users,
  Twitter, Github, Youtube, Search, ChevronDown, ChevronRight,
  Newspaper, Building, DollarSign, Briefcase, Heart, Target,
  Database, Zap, RefreshCw, Check, X, Megaphone
} from 'lucide-react';
import { StakeholderSourceDatabase, findPreIndexedStakeholder, getSourcesByType, getMonitoringTopics } from './EnhancedSourceDatabase';
import stakeholderIntelligenceService from '../../services/stakeholderIntelligenceService';

const EnhancedSourceConfigurator = ({ stakeholderStrategy, onSourcesUpdate }) => {
  const [stakeholderSources, setStakeholderSources] = useState({});
  const [expandedStakeholders, setExpandedStakeholders] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [preIndexedMatches, setPreIndexedMatches] = useState({});

  // Initialize with enhanced sources
  useEffect(() => {
    console.log('🔍 EnhancedSourceConfigurator MOUNTED/UPDATED');
    console.log('🔍 Received stakeholderStrategy:', stakeholderStrategy);
    console.log('🔍 stakeholderGroups:', stakeholderStrategy?.stakeholderGroups);
    console.log('🔍 stakeholderGroups length:', stakeholderStrategy?.stakeholderGroups?.length);
    
    if (stakeholderStrategy?.stakeholderGroups && stakeholderStrategy.stakeholderGroups.length > 0) {
      console.log('✅ Initializing sources for', stakeholderStrategy.stakeholderGroups.length, 'stakeholders');
      console.log('✅ First stakeholder:', stakeholderStrategy.stakeholderGroups[0]);
      initializeEnhancedSources();
    } else {
      console.warn('❌ No stakeholder groups found in strategy');
      console.warn('❌ Full strategy object:', JSON.stringify(stakeholderStrategy, null, 2));
    }
  }, [stakeholderStrategy]);

  const initializeEnhancedSources = async () => {
    const newSources = {};
    const newMatches = {};
    const loading = {};

    for (const stakeholder of stakeholderStrategy.stakeholderGroups) {
      const stakeholderId = stakeholder.id || stakeholder.name;
      loading[stakeholderId] = true;
    }

    setLoadingStates(loading);

    // Process each stakeholder
    for (const stakeholder of stakeholderStrategy.stakeholderGroups) {
      const stakeholderId = stakeholder.id || stakeholder.name;
      console.log('Processing stakeholder:', stakeholder.name, 'Type:', stakeholder.type);
      
      // Check for pre-indexed match
      const preIndexed = findPreIndexedStakeholder(stakeholder.name);
      
      if (preIndexed && preIndexed.name.toLowerCase() === stakeholder.name.toLowerCase()) {
        console.log('Found exact pre-indexed match for', stakeholder.name);
        // Use pre-indexed sources
        newMatches[stakeholderId] = preIndexed;
        newSources[stakeholderId] = {
          stakeholder: stakeholder,
          sources: preIndexed.sources,
          topics: getMonitoringTopics(stakeholder, stakeholderStrategy.industry),
          isPreIndexed: true,
          matchConfidence: 0.95
        };
      } else {
        console.log('No pre-indexed match for', stakeholder.name, '- discovering sources via API');
        
        // Special handling for different target types
        if (stakeholder.type === 'competitor' || stakeholder.type === 'Competitor') {
          console.log('Generating competitor-specific sources for', stakeholder.name);
          
          // For generic "Competitors" stakeholder, use a real company name for discovery
          const searchName = stakeholder.name === 'Competitors' ? 'Microsoft' : stakeholder.name;
          const searchStakeholder = { ...stakeholder, name: searchName };
          
          // First try to get sources from API
          try {
            const discoveredSources = await stakeholderIntelligenceService.discoverSourcesForStakeholder(searchStakeholder);
            
            if (discoveredSources && discoveredSources.length > 0) {
              console.log('API discovered', discoveredSources.length, 'sources for competitor', stakeholder.name);
              
              // Use the discovered sources
              const verifiedSources = discoveredSources.map((source, index) => ({
                ...source,
                id: `${stakeholderId}-api-${index}`,
                category: source.type === 'regulatory' ? 'Regulatory' : 
                          source.type === 'research' ? 'Research' : 
                          source.type === 'news' ? 'News' : 'Web',
                icon: getSourceIcon(source.type),
                verified: source.verified !== false,
                active: source.verified !== false,
                priority: source.relevance >= 0.9 ? 'high' : 
                         source.relevance >= 0.7 ? 'medium' : 'low',
                frequency: 'daily'
              }));
              
              newSources[stakeholderId] = {
                stakeholder: stakeholder,
                sources: verifiedSources,
                topics: { topics: stakeholder.topics || ['product launches', 'funding', 'partnerships', 'executive changes'], source: 'stakeholder' },
                isPreIndexed: discoveredSources.some(s => s.source === 'database'),
                matchConfidence: 0.9
              };
            } else {
              // Fall back to generated sources
              const competitorSources = await generateCompetitorSources(stakeholder);
              newSources[stakeholderId] = {
                stakeholder: stakeholder,
                sources: competitorSources,
                topics: { topics: stakeholder.topics || ['product launches', 'funding', 'partnerships', 'executive changes'], source: 'stakeholder' },
                isPreIndexed: false,
                matchConfidence: 0.8
              };
            }
          } catch (error) {
            console.error('Error discovering sources for competitor', stakeholder.name, error);
            // Fall back to generated sources
            const competitorSources = await generateCompetitorSources(stakeholder);
            newSources[stakeholderId] = {
              stakeholder: stakeholder,
              sources: competitorSources,
              topics: stakeholder.topics || ['product launches', 'funding', 'partnerships', 'executive changes'],
              isPreIndexed: false,
              matchConfidence: 0.8
            };
          }
        } else if (stakeholder.type === 'topic' || stakeholder.type === 'Primary Topic' || stakeholder.type === 'Subtopic' || stakeholder.type === 'Key Source') {
          console.log('Generating topic-specific sources for', stakeholder.name);
          
          // For generic "Industry Topics" stakeholder, use a real topic name for discovery
          const searchName = stakeholder.name === 'Industry Topics' ? 'Cloud Computing' : stakeholder.name;
          const searchStakeholder = { ...stakeholder, name: searchName };
          
          // First try to get sources from API
          try {
            const discoveredSources = await stakeholderIntelligenceService.discoverSourcesForStakeholder(searchStakeholder);
            
            if (discoveredSources && discoveredSources.length > 0) {
              console.log('API discovered', discoveredSources.length, 'sources for topic', stakeholder.name);
              
              // Use the discovered sources
              const verifiedSources = discoveredSources.map((source, index) => ({
                ...source,
                id: `${stakeholderId}-api-${index}`,
                category: source.type === 'regulatory' ? 'Regulatory' : 
                          source.type === 'research' ? 'Research' : 
                          source.type === 'news' ? 'News' : 'Web',
                icon: getSourceIcon(source.type),
                verified: source.verified !== false,
                active: source.verified !== false,
                priority: source.relevance >= 0.9 ? 'high' : 
                         source.relevance >= 0.7 ? 'medium' : 'low',
                frequency: 'daily'
              }));
              
              newSources[stakeholderId] = {
                stakeholder: stakeholder,
                sources: verifiedSources,
                topics: { topics: stakeholder.topics || ['breaking news', 'analysis', 'research', 'expert opinions'], source: 'stakeholder' },
                isPreIndexed: discoveredSources.some(s => s.source === 'database'),
                matchConfidence: 0.9
              };
            } else {
              // Fall back to generated sources
              const topicSources = await generateTopicSources(stakeholder);
              newSources[stakeholderId] = {
                stakeholder: stakeholder,
                sources: topicSources,
                topics: { topics: stakeholder.topics || ['breaking news', 'analysis', 'research', 'expert opinions'], source: 'stakeholder' },
                isPreIndexed: false,
                matchConfidence: 0.85
              };
            }
          } catch (error) {
            console.error('Error discovering sources for topic', stakeholder.name, error);
            // Fall back to generated sources
            const topicSources = await generateTopicSources(stakeholder);
            newSources[stakeholderId] = {
              stakeholder: stakeholder,
              sources: topicSources,
              topics: stakeholder.topics || ['breaking news', 'analysis', 'research', 'expert opinions'],
              isPreIndexed: false,
              matchConfidence: 0.85
            };
          }
        } else {
          try {
            // Try to discover sources using backend API
            const discoveredSources = await stakeholderIntelligenceService.discoverStakeholderSources(
              stakeholder.name,
              stakeholder.type
            );
          
          if (discoveredSources && discoveredSources.length > 0) {
            console.log('API discovered', discoveredSources.length, 'sources for', stakeholder.name);
            
            // Validate sources in parallel
            const validationResults = await stakeholderIntelligenceService.batchValidateSources(
              discoveredSources.map(s => s.url).filter(url => url)
            );
            
            // Mark sources as verified based on validation
            const verifiedSources = discoveredSources.map((source, index) => ({
              ...source,
              id: `${stakeholderId}-api-${index}`,
              verified: validationResults[index]?.valid || false,
              active: validationResults[index]?.valid || false
            }));
            
            newSources[stakeholderId] = {
              stakeholder: stakeholder,
              sources: verifiedSources,
              topics: getMonitoringTopics(stakeholder, stakeholderStrategy.industry),
              isPreIndexed: false,
              matchConfidence: 0.7
            };
          } else {
            // Fall back to basic recommendations
            const recommendedSources = getBasicRecommendations(stakeholder);
            newSources[stakeholderId] = {
              stakeholder: stakeholder,
              sources: recommendedSources,
              topics: getMonitoringTopics(stakeholder, stakeholderStrategy.industry),
              isPreIndexed: false,
              matchConfidence: 0
            };
          }
        } catch (error) {
          console.error('Error discovering sources for', stakeholder.name, error);
          // Fall back to basic recommendations
          const recommendedSources = getBasicRecommendations(stakeholder);
          newSources[stakeholderId] = {
            stakeholder: stakeholder,
            sources: recommendedSources,
            topics: getMonitoringTopics(stakeholder, stakeholderStrategy.industry),
            isPreIndexed: false,
            matchConfidence: 0
          };
        }
      }
      }
      
      setLoadingStates(prev => ({ ...prev, [stakeholderId]: false }));
    }

    setStakeholderSources(newSources);
    setPreIndexedMatches(newMatches);
    
    // Notify parent of all active sources
    if (onSourcesUpdate) {
      const allActiveSources = Object.entries(newSources).flatMap(([stakeholderId, config]) =>
        config.sources.filter(s => s.active).map(source => ({
          ...source,
          stakeholderId,
          stakeholderName: config.stakeholder.name
        }))
      );
      onSourcesUpdate(allActiveSources);
    }
  };

  // Enhanced recommendations based on stakeholder type
  const generateTopicSources = async (stakeholder) => {
    const sources = [];
    const topicName = stakeholder.name;
    const keywords = stakeholder.keywords || [topicName];
    
    // Google News - primary source for topics
    sources.push({
      id: `${stakeholder.id}-news-google`,
      name: `${topicName} - Google News`,
      type: 'news',
      category: 'News',
      icon: Newspaper,
      url: `https://news.google.com/search?q="${encodeURIComponent(topicName)}"`,
      query: keywords.join(' OR '),
      verified: true,
      active: true,
      priority: 'high',
      frequency: 'real-time'
    });
    
    // Reddit discussions
    sources.push({
      id: `${stakeholder.id}-reddit`,
      name: `${topicName} - Reddit`,
      type: 'social',
      category: 'Community',
      icon: Users,
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(topicName)}`,
      query: topicName,
      verified: true,
      active: true,
      priority: 'medium',
      frequency: 'daily'
    });
    
    // Twitter/X monitoring
    sources.push({
      id: `${stakeholder.id}-twitter`,
      name: `${topicName} - Twitter/X`,
      type: 'social',
      category: 'Social Media',
      icon: Twitter,
      url: `https://twitter.com/search?q=${encodeURIComponent(topicName)}`,
      query: topicName,
      verified: true,
      active: true,
      priority: 'high',
      frequency: 'real-time'
    });
    
    // Academic sources for research topics
    if (stakeholder.type === 'Primary Topic' || stakeholder.name.toLowerCase().includes('research')) {
      sources.push({
        id: `${stakeholder.id}-scholar`,
        name: `${topicName} - Academic Research`,
        type: 'research',
        category: 'Research',
        icon: FileText,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(topicName)}`,
        query: topicName,
        verified: true,
        active: true,
        priority: 'medium',
        frequency: 'weekly'
      });
    }
    
    // Industry publications for Key Sources
    if (stakeholder.type === 'Key Source') {
      sources.push({
        id: `${stakeholder.id}-publication`,
        name: stakeholder.name,
        type: 'publication',
        category: 'Publication',
        icon: Newspaper,
        url: stakeholder.url || `https://www.google.com/search?q=${encodeURIComponent(stakeholder.name)}`,
        query: keywords.join(' OR '),
        verified: false,
        active: true,
        priority: 'high',
        frequency: 'daily'
      });
    }
    
    // YouTube for video content
    sources.push({
      id: `${stakeholder.id}-youtube`,
      name: `${topicName} - YouTube`,
      type: 'video',
      category: 'Video',
      icon: Youtube,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topicName)}`,
      query: topicName,
      verified: true,
      active: false, // Off by default
      priority: 'low',
      frequency: 'weekly'
    });
    
    return sources;
  };

  const generateCompetitorSources = async (stakeholder) => {
    const sources = [];
    const competitorName = stakeholder.name;
    
    // Core news sources for competitors
    sources.push({
      id: `${stakeholder.id}-news-1`,
      name: `${competitorName} News`,
      type: 'news',
      category: 'News',
      icon: Newspaper,
      url: `https://news.google.com/search?q="${competitorName}"`,
      query: `"${competitorName}" OR "${competitorName} company"`,
      verified: true,
      active: true,
      priority: 'high',
      frequency: 'daily'
    });
    
    // Press releases
    sources.push({
      id: `${stakeholder.id}-pr-1`,
      name: `${competitorName} Press Releases`,
      type: 'press',
      category: 'Press Releases',
      icon: Megaphone,
      url: `https://www.prnewswire.com/search/news/?keyword=${encodeURIComponent(competitorName)}`,
      query: competitorName,
      verified: true,
      active: true,
      priority: 'high',
      frequency: 'daily'
    });
    
    // LinkedIn Company
    sources.push({
      id: `${stakeholder.id}-linkedin-1`,
      name: `${competitorName} LinkedIn`,
      type: 'social',
      category: 'Social Media',
      icon: Building,
      url: `https://www.linkedin.com/company/${competitorName.toLowerCase().replace(/\s+/g, '-')}`,
      query: competitorName,
      verified: false,
      active: true,
      priority: 'medium',
      frequency: 'daily'
    });
    
    // Industry-specific sources
    if (stakeholder.threatLevel && stakeholder.threatLevel > 80) {
      // High-threat competitors get more intensive monitoring
      sources.push({
        id: `${stakeholder.id}-crunchbase-1`,
        name: `${competitorName} Funding`,
        type: 'funding',
        category: 'Financial',
        icon: DollarSign,
        url: `https://www.crunchbase.com/organization/${competitorName.toLowerCase().replace(/\s+/g, '-')}`,
        query: competitorName,
        verified: false,
        active: true,
        priority: 'high',
        frequency: 'weekly'
      });
      
      sources.push({
        id: `${stakeholder.id}-jobs-1`,
        name: `${competitorName} Jobs`,
        type: 'jobs',
        category: 'Hiring',
        icon: Briefcase,
        url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(competitorName)}`,
        query: `"${competitorName}" hiring`,
        verified: false,
        active: true,
        priority: 'low',
        frequency: 'weekly'
      });
    }
    
    return sources;
  };

  const getBasicRecommendations = (stakeholder) => {
    const name = stakeholder.name.toLowerCase();
    const type = stakeholder.type?.toLowerCase() || '';
    const prContext = stakeholder.prContext || '';
    const recommendations = [];
    
    // Always add Google News for the stakeholder
    recommendations.push({
      name: `Google News - ${stakeholder.name}`,
      url: `https://news.google.com/search?q=${encodeURIComponent(stakeholder.name)}`,
      type: 'news',
      extractionMethod: 'scraping',
      active: true
    });
    
    // PR-specific source recommendations
    if (prContext === 'earned_media' || name.includes('media outlets') || type === 'media') {
      recommendations.push(
        { 
          name: 'PR Newswire', 
          url: 'https://www.prnewswire.com/rss/news-releases-list.rss', 
          type: 'news', 
          extractionMethod: 'rss',
          active: true 
        },
        { 
          name: 'Business Wire', 
          url: 'https://feed.businesswire.com/rss/home/', 
          type: 'news', 
          extractionMethod: 'rss',
          active: true 
        },
        { 
          name: 'TechCrunch', 
          url: 'https://techcrunch.com/feed/', 
          type: 'news', 
          extractionMethod: 'rss',
          active: true 
        }
      );
    } else if (prContext === 'media_relations' || name.includes('journalist') || type === 'influencer') {
      recommendations.push(
        { 
          name: 'HARO (Help a Reporter)', 
          url: 'https://www.helpareporter.com', 
          type: 'media', 
          extractionMethod: 'email',
          active: true 
        },
        { 
          name: 'Muck Rack Daily', 
          url: 'https://muckrack.com/daily', 
          type: 'media', 
          extractionMethod: 'scraping',
          active: true 
        },
        { 
          name: 'Journalist Twitter Lists', 
          url: 'https://twitter.com/lists', 
          type: 'social', 
          extractionMethod: 'api',
          active: true 
        }
      );
    } else if (prContext === 'business_development' || name.includes('prospects') || type === 'prospect') {
      recommendations.push(
        { 
          name: 'Crunchbase Funding Rounds', 
          url: 'https://news.crunchbase.com/feed/', 
          type: 'financial', 
          extractionMethod: 'rss',
          active: true 
        },
        {
          name: 'Product Hunt Launches',
          url: 'https://www.producthunt.com/feed',
          type: 'product',
          extractionMethod: 'rss',
          active: true
        }
      );
    }
    
    // For competing agencies and competitors
    if (type.includes('competitive') || name.includes('compet') || prContext === 'competitive_analysis' || prContext === 'competitive_intel') {
      recommendations.push(
        { 
          name: 'PR Week Agency News', 
          url: 'https://www.prweek.com/us/agency', 
          type: 'industry', 
          extractionMethod: 'scraping',
          active: true 
        },
        { 
          name: 'Agency Spotter Updates', 
          url: 'https://www.agencyspotter.com/news', 
          type: 'industry', 
          extractionMethod: 'scraping',
          active: false 
        }
      );
    }
    
    // For client monitoring
    if (type === 'client' || prContext === 'client_results') {
      recommendations.push(
        {
          name: 'Client Brand Monitoring',
          url: `https://www.google.com/alerts/feeds/client-${stakeholder.id}`,
          type: 'alert',
          extractionMethod: 'rss',
          active: true
        },
        {
          name: 'Client Social Media',
          url: `https://twitter.com/search?q=${encodeURIComponent(stakeholder.name)}`,
          type: 'social',
          extractionMethod: 'api',
          active: true
        }
      );
    }
    
    // For journalists and influencers (additional sources)
    if (name.includes('journalist') || name.includes('influencer')) {
      recommendations.push(
        { 
          name: 'HARO (Help a Reporter)', 
          url: 'https://www.helpareporter.com', 
          type: 'media', 
          extractionMethod: 'email',
          active: true 
        },
        { 
          name: 'Muck Rack Daily', 
          url: 'https://muckrack.com/daily', 
          type: 'media', 
          extractionMethod: 'scraping',
          active: true 
        }
      );
    }
    
    // For VCs and investors
    if (name.includes('venture') || name.includes('investor') || type.includes('referral')) {
      recommendations.push(
        { 
          name: 'PitchBook VC News', 
          url: 'https://pitchbook.com/news', 
          type: 'financial', 
          extractionMethod: 'scraping',
          active: true 
        },
        { 
          name: 'Term Sheet Newsletter', 
          url: 'https://fortune.com/tag/term-sheet/', 
          type: 'financial', 
          extractionMethod: 'rss',
          active: true 
        }
      );
    }
    
    // Add topic-specific sources
    if (stakeholder.monitoringTopics || stakeholder.topics) {
      const topics = stakeholder.monitoringTopics || stakeholder.topics || [];
      topics.slice(0, 2).forEach(topic => {
        recommendations.push({
          name: `${topic} News`,
          url: `https://news.google.com/search?q=${encodeURIComponent(topic)}`,
          type: 'news',
          extractionMethod: 'scraping',
          active: true
        });
      });
    }
    
    // Add Reddit monitoring for all stakeholders
    recommendations.push({
      name: `Reddit - ${stakeholder.name}`,
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(stakeholder.name)}`,
      type: 'social',
      extractionMethod: 'scraping',
      active: false // Off by default
    });
    
    // Add LinkedIn monitoring for B2B stakeholders
    if (type === 'prospect' || type === 'client' || type === 'competitive') {
      recommendations.push({
        name: `LinkedIn - ${stakeholder.name}`,
        url: `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(stakeholder.name)}`,
        type: 'professional',
        extractionMethod: 'scraping',
        active: true
      });
    }
    
    // Default sources if we still don't have enough
    if (recommendations.length < 3) {
      recommendations.push(
        { 
          name: 'Google Alerts', 
          url: `https://www.google.com/alerts#query:"${stakeholder.name}"`, 
          type: 'alert', 
          extractionMethod: 'email',
          active: true 
        },
        {
          name: 'Bing News',
          url: `https://www.bing.com/news/search?q=${encodeURIComponent(stakeholder.name)}`,
          type: 'news',
          extractionMethod: 'scraping',
          active: false
        }
      );
    }
    
    return recommendations.map((source, idx) => ({
      ...source,
      id: `${stakeholder.id}-rec-${idx}`,
      isRecommended: true
    }));
  };

  const toggleStakeholder = (stakeholderId) => {
    setExpandedStakeholders(prev => ({
      ...prev,
      [stakeholderId]: !prev[stakeholderId]
    }));
  };

  const toggleSource = (stakeholderId, sourceId) => {
    setStakeholderSources(prev => ({
      ...prev,
      [stakeholderId]: {
        ...prev[stakeholderId],
        sources: prev[stakeholderId].sources.map(s => 
          s.id === sourceId ? { ...s, active: !s.active } : s
        )
      }
    }));
    
    // Update parent
    updateParentSources();
  };

  const updateParentSources = () => {
    if (onSourcesUpdate) {
      const allActiveSources = Object.entries(stakeholderSources).flatMap(([stakeholderId, config]) =>
        config.sources.filter(s => s.active).map(source => ({
          ...source,
          stakeholderId,
          stakeholderName: config.stakeholder.name
        }))
      );
      onSourcesUpdate(allActiveSources);
    }
  };

  const getSourceIcon = (type) => {
    const icons = {
      web: Globe,
      news: Newspaper,
      social: Twitter,
      regulatory: Shield,
      financial: DollarSign,
      industry: Building,
      professional: Briefcase,
      community: Heart
    };
    return icons[type] || Globe;
  };

  const getActiveSourceCount = (stakeholderId) => {
    return stakeholderSources[stakeholderId]?.sources?.filter(s => s.active).length || 0;
  };

  // Show message if no stakeholder groups
  if (!stakeholderStrategy?.stakeholderGroups || stakeholderStrategy.stakeholderGroups.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <Target size={48} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No Targets Configured
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Please complete the Intelligence Targets setup first to configure monitoring sources.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      background: '#f9fafb',
      overflow: 'hidden'
    }}>
      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '2rem',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
              Enhanced Source Configuration
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
              <Database size={16} />
              <span>Powered by pre-indexed stakeholder database</span>
            </div>
          </div>

          {/* Stakeholder List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stakeholderStrategy?.stakeholderGroups?.map(stakeholder => {
              const stakeholderId = stakeholder.id || stakeholder.name;
              const isExpanded = expandedStakeholders[stakeholderId];
              const activeCount = getActiveSourceCount(stakeholderId);
              const config = stakeholderSources[stakeholderId];
              const isLoading = loadingStates[stakeholderId];
              const preIndexedMatch = preIndexedMatches[stakeholderId];
              
              return (
                <div
                  key={stakeholderId}
                  style={{
                    background: 'white',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    border: preIndexedMatch ? '2px solid #6366f1' : 'none'
                  }}
                >
                  {/* Stakeholder Header */}
                  <div
                    onClick={() => toggleStakeholder(stakeholderId)}
                    style={{
                      padding: '1.25rem',
                      cursor: 'pointer',
                      borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                          {stakeholder.name}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                          {activeCount} active source{activeCount !== 1 ? 's' : ''} 
                          {config?.sources?.length > 0 && ` (${config.sources.length} available)`}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {preIndexedMatch && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#ede9fe',
                          color: '#6d28d9',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Database size={12} />
                          Pre-indexed Match
                        </span>
                      )}
                      
                      {isLoading ? (
                        <RefreshCw size={16} className="animate-spin" style={{ color: '#6b7280' }} />
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: activeCount > 0 ? '#dcfce7' : '#f3f4f6',
                          color: activeCount > 0 ? '#166534' : '#6b7280',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {activeCount > 0 ? 'Monitoring Active' : 'Not Configured'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && config && (
                    <div style={{ padding: '1.25rem' }}>
                      {/* Pre-indexed Match Info */}
                      {preIndexedMatch && (
                        <div style={{
                          marginBottom: '1.5rem',
                          padding: '1rem',
                          background: '#f0f9ff',
                          borderRadius: '0.5rem',
                          border: '1px solid #bfdbfe'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Zap size={16} style={{ color: '#3b82f6' }} />
                            <span style={{ fontWeight: '600', color: '#1e40af' }}>
                              Exact Match Found: {preIndexedMatch.name}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#3730a3' }}>
                            We've pre-configured {config.sources.length} verified sources for this stakeholder, 
                            including official channels, regulatory filings, and social media accounts.
                          </p>
                        </div>
                      )}

                      {/* Sources by Category */}
                      {config.sources.length > 0 && (
                        <div>
                          <h4 style={{ 
                            margin: '0 0 0.75rem 0', 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Sparkles size={16} style={{ color: '#6366f1' }} />
                            Available Sources
                          </h4>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {config.sources.map(source => {
                              const Icon = getSourceIcon(source.type);
                              return (
                                <div
                                  key={source.id}
                                  style={{
                                    padding: '0.75rem',
                                    background: source.active ? '#f0f9ff' : '#f9fafb',
                                    border: `1px solid ${source.active ? '#bfdbfe' : '#e5e7eb'}`,
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onClick={() => toggleSource(stakeholderId, source.id)}
                                >
                                  <Icon size={18} style={{ 
                                    color: source.active ? '#3b82f6' : '#9ca3af',
                                    marginTop: '2px'
                                  }} />
                                  
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontWeight: '500', 
                                      fontSize: '0.875rem',
                                      color: source.active ? '#1e40af' : '#374151'
                                    }}>
                                      {source.name}
                                    </div>
                                    {source.url && (
                                      <div style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#6b7280',
                                        marginTop: '2px',
                                        wordBreak: 'break-all'
                                      }}>
                                        {source.url}
                                      </div>
                                    )}
                                    <div style={{ 
                                      fontSize: '0.75rem', 
                                      color: '#9ca3af',
                                      marginTop: '4px',
                                      display: 'flex',
                                      gap: '0.5rem'
                                    }}>
                                      <span>{source.extractionMethod}</span>
                                      {source.rss && <span>• RSS</span>}
                                      {source.isPreIndexed && <span>• Verified</span>}
                                    </div>
                                  </div>
                                  
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: `2px solid ${source.active ? '#3b82f6' : '#d1d5db'}`,
                                    background: source.active ? '#3b82f6' : 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    {source.active && <Check size={12} color="white" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Monitoring Topics */}
                      {config.topics && (
                        <div style={{ 
                          marginTop: '1.5rem',
                          paddingTop: '1.5rem',
                          borderTop: '1px solid #e5e7eb'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 0.75rem 0', 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Target size={16} style={{ color: '#6366f1' }} />
                            Recommended Monitoring Topics
                            {config.topics && config.topics.source === 'pre-indexed database' && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#6366f1',
                                fontWeight: 'normal',
                                marginLeft: '0.5rem'
                              }}>
                                (from database)
                              </span>
                            )}
                          </h4>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {((config.topics && config.topics.topics) ? config.topics.topics : (Array.isArray(config.topics) ? config.topics : [])).map((topic, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  background: '#ede9fe',
                                  color: '#6d28d9',
                                  borderRadius: '1rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '500'
                                }}
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Enable All */}
                      {config.sources.filter(s => !s.active).length > 0 && (
                        <button
                          onClick={() => {
                            setStakeholderSources(prev => ({
                              ...prev,
                              [stakeholderId]: {
                                ...prev[stakeholderId],
                                sources: prev[stakeholderId].sources.map(s => ({ ...s, active: true }))
                              }
                            }));
                            updateParentSources();
                          }}
                          style={{
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Zap size={16} />
                          Enable All Sources
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default EnhancedSourceConfigurator;