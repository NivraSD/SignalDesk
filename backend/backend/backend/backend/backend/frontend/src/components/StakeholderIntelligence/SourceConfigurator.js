import React, { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, Globe, Shield, FileText, 
  Trash2, CheckCircle, AlertCircle,
  Twitter, Github, Youtube, Search
} from 'lucide-react';

const SourceConfigurator = ({ onSourcesUpdate, existingSources = [] }) => {
  const [customSources, setCustomSources] = useState(existingSources);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    type: 'web',
    extractionMethod: 'auto',
    searchPattern: ''
  });
  const [testResults, setTestResults] = useState(null);

  // Use effect to update parent component when sources change
  useEffect(() => {
    if (onSourcesUpdate && customSources !== existingSources) {
      onSourcesUpdate(customSources);
    }
  }, [customSources]); // Intentionally not including onSourcesUpdate and existingSources to avoid infinite loops

  const sourceTemplates = [
    {
      id: 'tech',
      name: 'Tech Industry Intel',
      icon: Globe,
      sources: [
        { name: 'Hacker News', url: 'https://news.ycombinator.com', type: 'forum' },
        { name: 'TechCrunch', url: 'https://techcrunch.com', type: 'news' },
        { name: 'Reddit r/technology', url: 'https://reddit.com/r/technology', type: 'social' },
        { name: 'GitHub Trending', url: 'https://github.com/trending', type: 'code' },
        { name: 'Product Hunt', url: 'https://producthunt.com', type: 'web' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', type: 'forum' }
      ]
    },
    {
      id: 'finance',
      name: 'Financial Intel',
      icon: Shield,
      sources: [
        { name: 'SEC EDGAR', url: 'https://sec.gov/edgar', type: 'regulatory' },
        { name: 'Yahoo Finance', url: 'https://finance.yahoo.com', type: 'financial' },
        { name: 'SeekingAlpha', url: 'https://seekingalpha.com', type: 'analysis' },
        { name: 'Bloomberg', url: 'https://bloomberg.com', type: 'news' },
        { name: 'Financial Times', url: 'https://ft.com', type: 'news' },
        { name: 'WSB Reddit', url: 'https://reddit.com/r/wallstreetbets', type: 'social' }
      ]
    },
    {
      id: 'social',
      name: 'Social Media Intel',
      icon: Twitter,
      sources: [
        { name: 'Twitter/X Search', url: 'https://twitter.com/search', type: 'social' },
        { name: 'LinkedIn', url: 'https://linkedin.com', type: 'professional' },
        { name: 'Facebook Groups', url: 'https://facebook.com/groups', type: 'social' },
        { name: 'Instagram', url: 'https://instagram.com', type: 'social' },
        { name: 'YouTube', url: 'https://youtube.com', type: 'video' },
        { name: 'TikTok', url: 'https://tiktok.com', type: 'social' }
      ]
    }
  ];

  const sourceTypes = [
    { value: 'web', label: 'Website', icon: Globe },
    { value: 'news', label: 'News', icon: FileText },
    { value: 'social', label: 'Social Media', icon: Twitter },
    { value: 'forum', label: 'Forum', icon: FileText },
    { value: 'regulatory', label: 'Regulatory', icon: Shield },
    { value: 'code', label: 'Code Repository', icon: Github },
    { value: 'video', label: 'Video', icon: Youtube }
  ];

  const extractionMethods = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'rss', label: 'RSS Feed' },
    { value: 'api', label: 'API' },
    { value: 'scraping', label: 'Web Scraping' },
    { value: 'manual', label: 'Manual Review' }
  ];

  const applyTemplate = (template) => {
    const newSources = template.sources.map(source => ({
      ...source,
      id: Date.now() + Math.random(),
      extractionMethod: 'auto',
      active: true
    }));
    
    setCustomSources(prev => [...prev, ...newSources]);
  };

  const testSource = async () => {
    setTestResults({ status: 'testing' });
    
    // Simulate source testing
    setTimeout(() => {
      const isValid = newSource.url.startsWith('http');
      setTestResults({
        status: isValid ? 'success' : 'error',
        message: isValid ? 'Source is accessible' : 'Invalid URL',
        details: {
          responseTime: '234ms',
          hasRSS: Math.random() > 0.5,
          hasAPI: Math.random() > 0.7,
          contentFound: true
        }
      });
    }, 1500);
  };

  const addSource = () => {
    if (newSource.name && newSource.url) {
      const source = {
        ...newSource,
        id: Date.now(),
        active: true,
        lastChecked: new Date()
      };
      
      setCustomSources(prev => [...prev, source]);
      
      setNewSource({
        name: '',
        url: '',
        type: 'web',
        extractionMethod: 'auto',
        searchPattern: ''
      });
      setIsAddingSource(false);
      setTestResults(null);
    }
  };

  const removeSource = (sourceId) => {
    setCustomSources(prev => prev.filter(s => s.id !== sourceId));
  };

  const toggleSource = (sourceId) => {
    setCustomSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, active: !s.active } : s
    ));
  };

  const getSourceIcon = (type) => {
    const typeConfig = sourceTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : Globe;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Quick Templates */}
      <div>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '1.125rem', 
          fontWeight: '600',
          color: '#111827'
        }}>
          Quick Templates
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem' 
        }}>
          {sourceTemplates.map(template => (
            <div
              key={template.id}
              style={{
                padding: '1rem',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => applyTemplate(template)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <template.icon style={{ width: '24px', height: '24px', color: '#6366f1' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
                    {template.name}
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                    {template.sources.length} sources
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Sources */}
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
            Active Sources ({customSources.filter(s => s.active).length})
          </h3>
          <button
            onClick={() => setIsAddingSource(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Custom Source
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {customSources.map(source => {
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
                  gap: '1rem'
                }}
              >
                <Icon style={{ 
                  width: '20px', 
                  height: '20px', 
                  color: source.active ? '#6366f1' : '#9ca3af' 
                }} />
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', color: '#111827' }}>
                    {source.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {source.url}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    background: '#f3f4f6',
                    borderRadius: '0.25rem',
                    color: '#374151'
                  }}>
                    {source.extractionMethod}
                  </span>
                  
                  <button
                    onClick={() => toggleSource(source.id)}
                    style={{
                      padding: '0.375rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: source.active ? '#10b981' : '#9ca3af'
                    }}
                  >
                    {source.active ? 
                      <CheckCircle style={{ width: '18px', height: '18px' }} /> :
                      <AlertCircle style={{ width: '18px', height: '18px' }} />
                    }
                  </button>
                  
                  <button
                    onClick={() => removeSource(source.id)}
                    style={{
                      padding: '0.375rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444'
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            );
          })}
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
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              Add Custom Source
            </h3>
            
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
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Extraction Method
                </label>
                <select
                  value={newSource.extractionMethod}
                  onChange={(e) => setNewSource({ ...newSource, extractionMethod: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem'
                  }}
                >
                  {extractionMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Search Pattern (Optional)
                </label>
                <input
                  type="text"
                  value={newSource.searchPattern}
                  onChange={(e) => setNewSource({ ...newSource, searchPattern: e.target.value })}
                  placeholder="/search?q= or /news/"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              
              {/* Test Results */}
              {testResults && (
                <div style={{
                  padding: '1rem',
                  background: testResults.status === 'success' ? '#f0fdf4' : 
                             testResults.status === 'error' ? '#fef2f2' : '#f9fafb',
                  border: `1px solid ${
                    testResults.status === 'success' ? '#86efac' : 
                    testResults.status === 'error' ? '#fecaca' : '#e5e7eb'
                  }`,
                  borderRadius: '0.5rem'
                }}>
                  {testResults.status === 'testing' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Search className="animate-pulse" style={{ width: '16px', height: '16px' }} />
                      Testing source...
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {testResults.status === 'success' ? 
                          <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} /> :
                          <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                        }
                        <span style={{ fontWeight: '500' }}>{testResults.message}</span>
                      </div>
                      {testResults.details && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          <div>Response time: {testResults.details.responseTime}</div>
                          <div>RSS available: {testResults.details.hasRSS ? 'Yes' : 'No'}</div>
                          <div>API available: {testResults.details.hasAPI ? 'Yes' : 'No'}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={testSource}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Test Source
                </button>
                <button
                  onClick={addSource}
                  disabled={!newSource.name || !newSource.url || testResults?.status === 'error'}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: newSource.name && newSource.url && testResults?.status !== 'error' ? '#6366f1' : '#e5e7eb',
                    color: newSource.name && newSource.url && testResults?.status !== 'error' ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    cursor: newSource.name && newSource.url && testResults?.status !== 'error' ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Source
                </button>
                <button
                  onClick={() => {
                    setIsAddingSource(false);
                    setTestResults(null);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
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

      {/* AI Suggestions */}
      <div style={{
        padding: '1.5rem',
        background: '#ecfdf5',
        border: '1px solid #86efac',
        borderRadius: '0.5rem',
        textAlign: 'center'
      }}>
        <Sparkles style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', color: '#10b981' }} />
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: '#065f46' }}>
          AI Source Discovery
        </h4>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#047857' }}>
          Let AI analyze your stakeholders and suggest relevant sources
        </p>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles style={{ width: '16px', height: '16px' }} />
          Discover Sources with AI
        </button>
      </div>
    </div>
  );
};

export default SourceConfigurator;