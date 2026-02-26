import React, { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, Globe, Shield, FileText, 
  Trash2, CheckCircle, AlertCircle, Users,
  Twitter, Github, Youtube, Search, ChevronDown, ChevronRight,
  Newspaper, Building, DollarSign, Briefcase, Heart, Target
} from 'lucide-react';
import StakeholderAIAdvisor from './StakeholderAIAdvisor';

const StakeholderSourceConfigurator = ({ stakeholderStrategy, onSourcesUpdate }) => {
  const [stakeholderSources, setStakeholderSources] = useState({});
  const [expandedStakeholders, setExpandedStakeholders] = useState({});
  const [isAddingSource, setIsAddingSource] = useState(null); // stakeholder ID
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    type: 'web',
    extractionMethod: 'auto',
    searchPattern: ''
  });
  const [stakeholderTopics, setStakeholderTopics] = useState({});

  // Initialize stakeholder sources from strategy
  useEffect(() => {
    if (stakeholderStrategy?.stakeholderGroups) {
      const initialSources = {};
      const initialTopics = {};
      stakeholderStrategy.stakeholderGroups.forEach(stakeholder => {
        const stakeholderId = stakeholder.id || stakeholder.name;
        if (!stakeholderSources[stakeholderId]) {
          initialSources[stakeholderId] = {
            stakeholder: stakeholder,
            sources: getRecommendedSources(stakeholder)
          };
        }
        // Initialize topics from strategy if available
        if (!stakeholderTopics[stakeholderId]) {
          initialTopics[stakeholderId] = {
            topics: stakeholder.topics || [],
            goals: stakeholder.goals || '',
            fears: stakeholder.fears || ''
          };
        }
      });
      setStakeholderSources(prev => ({ ...prev, ...initialSources }));
      setStakeholderTopics(prev => ({ ...prev, ...initialTopics }));
    }
  }, [stakeholderStrategy, stakeholderSources, stakeholderTopics]);

  // Source type definitions
  const sourceTypes = [
    { value: 'web', label: 'Website', icon: Globe },
    { value: 'news', label: 'News', icon: Newspaper },
    { value: 'social', label: 'Social Media', icon: Twitter },
    { value: 'regulatory', label: 'Regulatory', icon: Shield },
    { value: 'financial', label: 'Financial', icon: DollarSign },
    { value: 'industry', label: 'Industry Publication', icon: Building },
    { value: 'professional', label: 'Professional Network', icon: Briefcase },
    { value: 'community', label: 'Community Forum', icon: Heart }
  ];

  // Get recommended sources based on stakeholder type
  const getRecommendedSources = (stakeholder) => {
    const recommendations = [];
    const name = stakeholder.name.toLowerCase();
    
    // Investors
    if (name.includes('investor') || name.includes('shareholder')) {
      recommendations.push(
        { name: 'SEC EDGAR Filings', url: 'https://sec.gov/edgar', type: 'regulatory', extractionMethod: 'api' },
        { name: 'Yahoo Finance', url: 'https://finance.yahoo.com', type: 'financial', extractionMethod: 'scraping' },
        { name: 'SeekingAlpha', url: 'https://seekingalpha.com', type: 'financial', extractionMethod: 'rss' }
      );
    }
    
    // Customers
    if (name.includes('customer') || name.includes('client') || name.includes('user')) {
      recommendations.push(
        { name: 'Product Review Sites', url: 'https://trustpilot.com', type: 'web', extractionMethod: 'scraping' },
        { name: 'Reddit Communities', url: 'https://reddit.com', type: 'community', extractionMethod: 'api' },
        { name: 'Twitter/X Mentions', url: 'https://twitter.com', type: 'social', extractionMethod: 'api' }
      );
    }
    
    // Employees
    if (name.includes('employee') || name.includes('staff') || name.includes('talent')) {
      recommendations.push(
        { name: 'Glassdoor', url: 'https://glassdoor.com', type: 'professional', extractionMethod: 'scraping' },
        { name: 'LinkedIn', url: 'https://linkedin.com', type: 'professional', extractionMethod: 'manual' },
        { name: 'Indeed Reviews', url: 'https://indeed.com', type: 'professional', extractionMethod: 'scraping' }
      );
    }
    
    // Regulators
    if (name.includes('regulator') || name.includes('government') || name.includes('authority')) {
      recommendations.push(
        { name: 'Government Announcements', url: '', type: 'regulatory', extractionMethod: 'rss' },
        { name: 'Regulatory Filings', url: '', type: 'regulatory', extractionMethod: 'api' },
        { name: 'Policy Updates', url: '', type: 'news', extractionMethod: 'rss' }
      );
    }
    
    // Media
    if (name.includes('media') || name.includes('press') || name.includes('journalist')) {
      recommendations.push(
        { name: 'PR Newswire', url: 'https://prnewswire.com', type: 'news', extractionMethod: 'rss' },
        { name: 'Industry Publications', url: '', type: 'industry', extractionMethod: 'rss' },
        { name: 'Journalist Twitter Lists', url: 'https://twitter.com', type: 'social', extractionMethod: 'api' }
      );
    }
    
    // Partners
    if (name.includes('partner') || name.includes('supplier') || name.includes('vendor')) {
      recommendations.push(
        { name: 'Industry News', url: '', type: 'industry', extractionMethod: 'rss' },
        { name: 'Trade Publications', url: '', type: 'industry', extractionMethod: 'rss' },
        { name: 'LinkedIn Company Pages', url: 'https://linkedin.com', type: 'professional', extractionMethod: 'manual' }
      );
    }
    
    // Community
    if (name.includes('community') || name.includes('local') || name.includes('public')) {
      recommendations.push(
        { name: 'Local News Sites', url: '', type: 'news', extractionMethod: 'rss' },
        { name: 'Community Forums', url: '', type: 'community', extractionMethod: 'scraping' },
        { name: 'Facebook Groups', url: 'https://facebook.com', type: 'social', extractionMethod: 'manual' }
      );
    }

    // Add IDs and active status
    return recommendations.map((source, idx) => ({
      ...source,
      id: `${stakeholder.id}-recommended-${idx}`,
      active: false,
      isRecommended: true
    }));
  };

  const toggleStakeholder = (stakeholderId) => {
    setExpandedStakeholders(prev => ({
      ...prev,
      [stakeholderId]: !prev[stakeholderId]
    }));
  };

  const addSource = (stakeholderId) => {
    if (newSource.name && newSource.url) {
      const source = {
        ...newSource,
        id: Date.now(),
        active: true,
        isRecommended: false
      };
      
      setStakeholderSources(prev => ({
        ...prev,
        [stakeholderId]: {
          ...prev[stakeholderId],
          sources: [...(prev[stakeholderId]?.sources || []), source]
        }
      }));
      
      // Reset form
      setNewSource({
        name: '',
        url: '',
        type: 'web',
        extractionMethod: 'auto',
        searchPattern: ''
      });
      setIsAddingSource(null);
      
      // Notify parent
      if (onSourcesUpdate) {
        const allSources = Object.values(stakeholderSources).flatMap(s => 
          s.sources.filter(src => src.active).map(src => ({
            ...src,
            stakeholderId: stakeholderId,
            stakeholderName: s.stakeholder.name
          }))
        );
        onSourcesUpdate(allSources);
      }
    }
  };

  const removeSource = (stakeholderId, sourceId) => {
    setStakeholderSources(prev => ({
      ...prev,
      [stakeholderId]: {
        ...prev[stakeholderId],
        sources: prev[stakeholderId].sources.filter(s => s.id !== sourceId)
      }
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
  };

  const getSourceIcon = (type) => {
    const typeConfig = sourceTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : Globe;
  };

  const getActiveSourceCount = (stakeholderId) => {
    return stakeholderSources[stakeholderId]?.sources?.filter(s => s.active).length || 0;
  };

  if (!stakeholderStrategy?.stakeholderGroups) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        color: '#6b7280'
      }}>
        <Users size={48} style={{ opacity: 0.3 }} />
        <p>Complete the strategy builder to configure sources</p>
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
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        padding: '2rem',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
              Source Configuration by Stakeholder
            </h2>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Configure intelligence sources for each stakeholder group to track relevant information
            </p>
          </div>

        {/* Stakeholder List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stakeholderStrategy.stakeholderGroups.map(stakeholder => {
            const stakeholderId = stakeholder.id || stakeholder.name;
            const isExpanded = expandedStakeholders[stakeholderId];
            const activeCount = getActiveSourceCount(stakeholderId);
            
            return (
              <div
                key={stakeholderId}
                style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
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
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: activeCount > 0 ? '#dcfce7' : '#f3f4f6',
                      color: activeCount > 0 ? '#166534' : '#6b7280',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {activeCount > 0 ? 'Monitoring' : 'Not configured'}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem' }}>
                    {/* Recommended Sources */}
                    {stakeholderSources[stakeholderId]?.sources?.filter(s => s.isRecommended).length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
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
                          Recommended Sources
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {stakeholderSources[stakeholderId].sources
                            .filter(s => s.isRecommended)
                            .map(source => {
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
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                  }}
                                >
                                  <Icon size={18} style={{ color: source.active ? '#3b82f6' : '#9ca3af' }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                                      {source.name}
                                    </div>
                                    {source.url && (
                                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {source.url}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => toggleSource(stakeholderId, source.id)}
                                    style={{
                                      padding: '0.375rem 0.75rem',
                                      background: source.active ? '#3b82f6' : 'white',
                                      color: source.active ? 'white' : '#6b7280',
                                      border: `1px solid ${source.active ? '#3b82f6' : '#d1d5db'}`,
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {source.active ? 'Active' : 'Enable'}
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Custom Sources */}
                    {stakeholderSources[stakeholderId]?.sources?.filter(s => !s.isRecommended).length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ 
                          margin: '0 0 0.75rem 0', 
                          fontSize: '0.875rem', 
                          fontWeight: '600', 
                          color: '#374151'
                        }}>
                          Custom Sources
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {stakeholderSources[stakeholderId].sources
                            .filter(s => !s.isRecommended)
                            .map(source => {
                              const Icon = getSourceIcon(source.type);
                              return (
                                <div
                                  key={source.id}
                                  style={{
                                    padding: '0.75rem',
                                    background: source.active ? 'white' : '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                  }}
                                >
                                  <Icon size={18} style={{ color: source.active ? '#6366f1' : '#9ca3af' }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                                      {source.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                      {source.url}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => toggleSource(stakeholderId, source.id)}
                                      style={{
                                        padding: '0.375rem',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: source.active ? '#10b981' : '#9ca3af'
                                      }}
                                    >
                                      {source.active ? 
                                        <CheckCircle size={18} /> :
                                        <AlertCircle size={18} />
                                      }
                                    </button>
                                    <button
                                      onClick={() => removeSource(stakeholderId, source.id)}
                                      style={{
                                        padding: '0.375rem',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#ef4444'
                                      }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Topic Configuration Section */}
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
                        Topics & Keywords
                      </h4>
                      
                      {/* Topics/Keywords Input */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.75rem', 
                          fontWeight: '500', 
                          color: '#6b7280',
                          marginBottom: '0.25rem' 
                        }}>
                          Topics to Monitor
                        </label>
                        <textarea
                          placeholder="Enter topics, keywords, or phrases to monitor (comma-separated)"
                          value={stakeholderTopics[stakeholderId]?.topics?.join(', ') || ''}
                          onChange={(e) => {
                            const topics = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                            setStakeholderTopics(prev => ({
                              ...prev,
                              [stakeholderId]: {
                                ...prev[stakeholderId],
                                topics: topics
                              }
                            }));
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            minHeight: '60px',
                            resize: 'vertical'
                          }}
                        />
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                          Examples: "product launch", "acquisition", "layoffs", "partnership announcement"
                        </p>
                      </div>
                      
                      {/* Goals Input */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.75rem', 
                          fontWeight: '500', 
                          color: '#6b7280',
                          marginBottom: '0.25rem' 
                        }}>
                          Goals (What do you hope to achieve?)
                        </label>
                        <textarea
                          placeholder="Describe what you want to learn or achieve by monitoring this stakeholder"
                          value={stakeholderTopics[stakeholderId]?.goals || ''}
                          onChange={(e) => {
                            setStakeholderTopics(prev => ({
                              ...prev,
                              [stakeholderId]: {
                                ...prev[stakeholderId],
                                goals: e.target.value
                              }
                            }));
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            minHeight: '60px',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      
                      {/* Fears/Concerns Input */}
                      <div>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.75rem', 
                          fontWeight: '500', 
                          color: '#6b7280',
                          marginBottom: '0.25rem' 
                        }}>
                          Concerns (What risks or issues worry you?)
                        </label>
                        <textarea
                          placeholder="Describe any concerns or risks you want to be alerted about"
                          value={stakeholderTopics[stakeholderId]?.fears || ''}
                          onChange={(e) => {
                            setStakeholderTopics(prev => ({
                              ...prev,
                              [stakeholderId]: {
                                ...prev[stakeholderId],
                                fears: e.target.value
                              }
                            }));
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            minHeight: '60px',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </div>

                    {/* Add Source Button */}
                    <button
                      onClick={() => setIsAddingSource(stakeholderId)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'transparent',
                        border: '2px dashed #e5e7eb',
                        borderRadius: '0.5rem',
                        color: '#6b7280',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem'
                      }}
                    >
                      <Plus size={16} />
                      Add Custom Source
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Add Source Modal */}
      {isAddingSource && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              Add Source for {stakeholderSources[isAddingSource]?.stakeholder?.name}
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Add a custom source to monitor for this stakeholder
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Source Name
                </label>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="e.g., Industry News Site"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  URL
                </label>
                <input
                  type="text"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Source Type
                </label>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem'
                  }}
                >
                  {sourceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={() => addSource(isAddingSource)}
                  disabled={!newSource.name || !newSource.url}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: newSource.name && newSource.url ? '#6366f1' : '#e5e7eb',
                    color: newSource.name && newSource.url ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    cursor: newSource.name && newSource.url ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Source
                </button>
                <button
                  onClick={() => {
                    setIsAddingSource(null);
                    setNewSource({
                      name: '',
                      url: '',
                      type: 'web',
                      extractionMethod: 'auto',
                      searchPattern: ''
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Advisor Sidebar */}
      <div style={{
        width: '400px',
        background: 'white',
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <StakeholderAIAdvisor 
          stakeholderStrategy={stakeholderStrategy}
          priorityStakeholders={stakeholderStrategy?.stakeholderGroups?.map(s => String(s.id || s.name)) || []}
          intelligenceFindings={[]}
          context="source_configuration"
          onSourceSuggestion={(suggestion) => {
            console.log('Source suggestion from AI:', suggestion);
            // Handle source suggestions from AI
            if (suggestion.stakeholderId && suggestion.source) {
              const source = {
                ...suggestion.source,
                id: Date.now(),
                active: true,
                isRecommended: false
              };
              
              setStakeholderSources(prev => ({
                ...prev,
                [suggestion.stakeholderId]: {
                  ...prev[suggestion.stakeholderId],
                  sources: [...(prev[suggestion.stakeholderId]?.sources || []), source]
                }
              }));
              
              // Notify parent
              if (onSourcesUpdate) {
                const allSources = Object.values(stakeholderSources).flatMap(s => 
                  s.sources.filter(src => src.active).map(src => ({
                    ...src,
                    stakeholderId: suggestion.stakeholderId,
                    stakeholderName: stakeholderStrategy.stakeholderGroups.find(sg => String(sg.id || sg.name) === suggestion.stakeholderId)?.name
                  }))
                );
                onSourcesUpdate(allSources);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default StakeholderSourceConfigurator;