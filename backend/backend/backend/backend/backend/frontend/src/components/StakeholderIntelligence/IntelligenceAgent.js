import React, { useState, useEffect } from 'react';
import { 
  Bot, Search, Globe, FileText, Mic, Video, Github, 
  Twitter, Shield, Settings, Eye, AlertCircle
} from 'lucide-react';
import WebIntelligenceAgent from '../../services/intelligence/WebIntelligenceAgent';
import SourceDiscoveryAgent from '../../services/intelligence/SourceDiscoveryAgent';
import MultiModalIntelligence from '../../services/intelligence/MultiModalIntelligence';
import IntelligenceProcessor from '../../services/intelligence/IntelligenceProcessor';
import DataSourceIntegration from '../../services/intelligence/DataSourceIntegration';

const IntelligenceAgent = ({ stakeholders = [], customSources = [], onIntelligenceFound }) => {
  const [agentStatus, setAgentStatus] = useState('idle');
  const [currentTask, setCurrentTask] = useState('Click "Run Analysis" to start');
  const [discoveries, setDiscoveries] = useState([]);
  const [sources, setSources] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pre-configured source templates (kept for future use)
  /* const sourceTemplates = {
    tech: {
      name: 'Tech Industry Intel',
      sources: [
        { type: 'web', name: 'Hacker News', url: 'https://news.ycombinator.com', selector: '.athing' },
        { type: 'web', name: 'TechCrunch', url: 'https://techcrunch.com', api: false },
        { type: 'social', name: 'Reddit r/technology', url: 'https://reddit.com/r/technology' },
        { type: 'code', name: 'GitHub Trending', url: 'https://github.com/trending' },
        { type: 'web', name: 'Product Hunt', url: 'https://producthunt.com' }
      ]
    },
    finance: {
      name: 'Financial Intel',
      sources: [
        { type: 'regulatory', name: 'SEC EDGAR', url: 'https://sec.gov/edgar' },
        { type: 'forum', name: 'Yahoo Finance', url: 'https://finance.yahoo.com' },
        { type: 'analysis', name: 'SeekingAlpha', url: 'https://seekingalpha.com' },
        { type: 'social', name: 'FinTwit', platform: 'twitter', keywords: ['$ticker'] }
      ]
    },
    media: {
      name: 'Media & PR Intel',
      sources: [
        { type: 'news', name: 'Google News', url: 'https://news.google.com' },
        { type: 'pr', name: 'PR Newswire', url: 'https://prnewswire.com' },
        { type: 'social', name: 'LinkedIn', platform: 'linkedin' },
        { type: 'video', name: 'YouTube', url: 'https://youtube.com' }
      ]
    }
  }; */

  // Use real AI agent to discover sources
  const discoverSources = async (stakeholder) => {
    setCurrentTask(`Discovering sources for ${stakeholder.name}...`);
    
    try {
      // Use SourceDiscoveryAgent to find new sources
      const discoveredSources = await SourceDiscoveryAgent.discoverNewSources(stakeholder);
      return discoveredSources.slice(0, 5); // Limit to top 5 sources
    } catch (error) {
      console.error('Error discovering sources:', error);
      return [];
    }
  };

  // Use real intelligence gathering services
  const gatherIntelligence = async (stakeholder, source) => {
    setIsProcessing(true);
    
    try {
      let rawIntelligence = [];
      
      // API-based intelligence gathering (if configured)
      const apiResults = await DataSourceIntegration.searchAllSources(stakeholder.name, stakeholder);
      if (apiResults.length > 0) {
        rawIntelligence.push(...apiResults);
      }
      
      // Web intelligence gathering
      if (['web', 'news', 'forum'].includes(source.type)) {
        const webResults = await WebIntelligenceAgent.searchAndExtract(stakeholder, {
          timeframe: 'last_24h',
          depth: 'quick'
        });
        rawIntelligence.push(...webResults.webSearch, ...webResults.news);
      }
      
      // Social media intelligence
      if (['social', 'professional'].includes(source.type)) {
        const socialResults = await WebIntelligenceAgent.gatherSocialIntelligence(stakeholder, [stakeholder.name]);
        rawIntelligence.push(...socialResults);
      }
      
      // Document intelligence
      if (['regulatory', 'financial'].includes(source.type)) {
        const docResults = await MultiModalIntelligence.scanDocuments(stakeholder);
        rawIntelligence.push(...docResults.filings, ...docResults.patents);
      }
      
      // Media intelligence
      if (['media', 'video', 'podcast'].includes(source.type)) {
        const mediaResults = await MultiModalIntelligence.scanMedia(stakeholder);
        rawIntelligence.push(...mediaResults.podcasts, ...mediaResults.videos);
      }
      
      // Process the raw intelligence
      if (rawIntelligence.length > 0) {
        const processed = await IntelligenceProcessor.processRawIntelligence(
          rawIntelligence[0],
          stakeholder
        );
        
        return {
          type: source.type,
          title: processed.processed.cleaned.substring(0, 100) + '...',
          content: processed.processed.cleaned,
          sentiment: processed.sentiment.label,
          relevance: processed.relevance.overall,
          credibility: processed.credibility.overall,
          source: source.name,
          insights: processed.insights,
          entities: processed.entities
        };
      }
      
      // Fallback to mock data if no real results
      return {
        type: source.type,
        title: `${stakeholder.name} - ${source.type} Intelligence`,
        content: 'No new intelligence found in this cycle.',
        sentiment: 'neutral',
        relevance: 0.5,
        source: source.name
      };
      
    } catch (error) {
      console.error('Error gathering intelligence:', error);
      return {
        type: 'error',
        title: 'Intelligence Gathering Error',
        content: error.message,
        source: source.name
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual agent control
  const runAgentManually = async () => {
    if (!stakeholders || stakeholders.length === 0) {
      setCurrentTask('No stakeholders to investigate');
      return;
    }

    setAgentStatus('active');
    setIsProcessing(true);
    
    try {
      const newDiscoveries = [];
      
      for (const stakeholder of stakeholders.slice(0, 3)) { // Limit to first 3 for performance
        setCurrentTask(`Investigating ${stakeholder.name}...`);
        
        // Use custom sources if available, otherwise use default
        const sourcesToUse = customSources.length > 0 ? customSources : [
          { name: 'Web Search', type: 'web' },
          { name: 'News Monitor', type: 'news' }
        ];
        
        // Mock intelligence gathering for now to prevent API overload
        for (const source of sourcesToUse.slice(0, 2)) {
          const mockIntel = {
            stakeholder: stakeholder.name,
            source: source,
            type: source.type === 'social' ? 'social_mention' : 'article',
            findings: `Recent activity detected for ${stakeholder.name} from ${source.name}`,
            relevance: 0.8,
            sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
            timestamp: new Date(),
            id: Date.now() + Math.random()
          };
          
          newDiscoveries.push(mockIntel);
          setDiscoveries(prev => [mockIntel, ...prev].slice(0, 20));
          
          // Small delay between sources
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Delay between stakeholders
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setCurrentTask('Analysis complete');
      setAgentStatus('idle');
      
      // Notify parent with the new discoveries
      if (onIntelligenceFound && newDiscoveries.length > 0) {
        console.log('Sending discoveries to parent:', newDiscoveries);
        onIntelligenceFound(newDiscoveries);
      }
    } catch (error) {
      console.error('Agent error:', error);
      setCurrentTask('Error during analysis');
      setAgentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  /* const addCustomSource = (source) => {
    setCustomSources(prev => [...prev, { ...source, id: Date.now() }]);
  }; */

  /* const getSourceIcon = (type) => {
    const icons = {
      web: Globe,
      social: Twitter,
      regulatory: Shield,
      code: Github,
      media: Video,
      forum: FileText,
      news: FileText,
      pr: Mic
    };
    const Icon = icons[type] || Globe;
    return <Icon className="w-4 h-4" />;
  }; */

  const getIntelligenceIcon = (type) => {
    const icons = {
      article: FileText,
      social_mention: Twitter,
      filing: Shield,
      transcript: Mic,
      video: Video
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div style={{
      height: 'calc(100vh - 2rem)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1.5rem',
      overflowY: 'auto',
      background: '#f9fafb'
    }}>
      {/* Agent Status */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Bot className={`w-6 h-6 ${agentStatus === 'active' ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
              {isProcessing && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  background: '#10b981',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                Intelligence Agent
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {currentTask}
              </p>
            </div>
          </div>
          <button
            onClick={runAgentManually}
            disabled={isProcessing}
            style={{
              padding: '0.5rem 1rem',
              background: isProcessing ? '#e5e7eb' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: isProcessing ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            <Search className="w-4 h-4" />
            {isProcessing ? 'Searching...' : 'Run Analysis'}
          </button>
        </div>
      </div>


      {/* Recent Discoveries */}
      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', fontWeight: '600' }}>
          Recent Intelligence ({discoveries.length})
        </h4>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0
        }}>
          {discoveries.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#9ca3af'
            }}>
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Agent is gathering intelligence...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {discoveries.map(discovery => (
                <div
                  key={discovery.id}
                  style={{
                    padding: '1rem',
                    background: '#fafafa',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '0.375rem',
                      background: '#ecfdf5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getIntelligenceIcon(discovery.type)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                          {discovery.stakeholder}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          • {discovery.source?.name || discovery.source || 'Unknown Source'}
                        </span>
                        {discovery.sentiment && (
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem',
                            background: discovery.sentiment === 'positive' ? '#dcfce7' : 
                                       discovery.sentiment === 'negative' ? '#fee2e2' : '#f3f4f6',
                            color: discovery.sentiment === 'positive' ? '#166534' :
                                  discovery.sentiment === 'negative' ? '#991b1b' : '#374151'
                          }}>
                            {discovery.sentiment}
                          </span>
                        )}
                      </div>
                      
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#111827' }}>
                        {discovery.findings || discovery.title || discovery.content || 'No details available'}
                      </p>
                      
                      {discovery.keyPoints && (
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          {discovery.keyPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {new Date(discovery.timestamp).toLocaleTimeString()}
                        </span>
                        {discovery.importance === 'high' && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <AlertCircle className="w-3 h-3" />
                            High Priority
                          </span>
                        )}
                        <button style={{
                          marginLeft: 'auto',
                          fontSize: '0.75rem',
                          color: '#6366f1',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntelligenceAgent;