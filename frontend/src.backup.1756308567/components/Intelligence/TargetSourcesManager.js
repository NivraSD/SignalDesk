import React, { useState, useEffect } from 'react';
import {
  Globe, Rss, Twitter, Database, FileText, Plus, Trash2, 
  CheckCircle, XCircle, RefreshCw, Zap, Clock, Search, TestTube
} from 'lucide-react';
import apiService from '../../services/apiService';

const TargetSourcesManager = ({ target, onClose }) => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingSource, setTestingSource] = useState(null);
  
  const [newSource, setNewSource] = useState({
    source_type: 'rss',
    source_name: '',
    source_url: '',
    check_frequency: 'daily'
  });

  useEffect(() => {
    loadSources();
  }, [target]);

  const loadSources = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTargetSources(target.id);
      setSources(response.sources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const discoverSources = async () => {
    setDiscovering(true);
    try {
      const response = await apiService.discoverSourcesForTarget(target.id);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to discover sources:', error);
    } finally {
      setDiscovering(false);
    }
  };

  const addSource = async () => {
    try {
      await apiService.addTargetSource(target.id, newSource);
      await loadSources();
      setShowAddForm(false);
      setNewSource({
        source_type: 'rss',
        source_name: '',
        source_url: '',
        check_frequency: 'daily'
      });
    } catch (error) {
      console.error('Failed to add source:', error);
    }
  };

  const deleteSource = async (sourceId) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      try {
        await apiService.deleteTargetSource(sourceId);
        await loadSources();
      } catch (error) {
        console.error('Failed to delete source:', error);
      }
    }
  };

  const testSource = async (source) => {
    setTestingSource(source.id || 'new');
    try {
      const result = await apiService.testSource({
        source_type: source.source_type,
        source_url: source.source_url
      });
      alert(result.message);
    } catch (error) {
      alert('Failed to test source');
    } finally {
      setTestingSource(null);
    }
  };

  const addSuggestedSource = async (suggestion) => {
    try {
      await apiService.addTargetSource(target.id, {
        source_type: suggestion.source_type,
        source_name: suggestion.source_name,
        source_url: suggestion.source_url,
        check_frequency: suggestion.check_frequency || 'daily'
      });
      await loadSources();
      // Remove from suggestions
      setSuggestions(suggestions.filter(s => s !== suggestion));
    } catch (error) {
      console.error('Failed to add suggested source:', error);
    }
  };

  const bulkAddSuggestions = async () => {
    try {
      const response = await apiService.bulkAddTargetSources(target.id, suggestions);
      alert(`Added ${response.added} sources successfully`);
      await loadSources();
      setSuggestions([]);
    } catch (error) {
      console.error('Failed to bulk add sources:', error);
    }
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'rss': return <Rss size={16} />;
      case 'website': return <Globe size={16} />;
      case 'social': return <Twitter size={16} />;
      case 'api': return <Database size={16} />;
      case 'news': return <FileText size={16} />;
      default: return <Globe size={16} />;
    }
  };

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'realtime': return '#ef4444';
      case 'hourly': return '#f59e0b';
      case 'daily': return '#10b981';
      case 'weekly': return '#6366f1';
      default: return '#6b7280';
    }
  };

  return (
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
        width: '90%',
        maxWidth: '900px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
              Configure Sources for {target.name}
            </h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              {target.type === 'competitor' ? 'Monitor this competitor across multiple sources' : 'Track this topic across various channels'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '0.5rem 1rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} />
              Add Source
            </button>
            
            <button
              onClick={discoverSources}
              disabled={discovering}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: discovering ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {discovering ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
              Discover Sources
            </button>
          </div>

          {/* Add Source Form */}
          {showAddForm && (
            <div style={{
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <select
                  value={newSource.source_type}
                  onChange={(e) => setNewSource({ ...newSource, source_type: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                >
                  <option value="rss">RSS Feed</option>
                  <option value="website">Website</option>
                  <option value="news">News Site</option>
                  <option value="social">Social Media</option>
                  <option value="api">API</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Source name"
                  value={newSource.source_name}
                  onChange={(e) => setNewSource({ ...newSource, source_name: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                />
                
                <select
                  value={newSource.check_frequency}
                  onChange={(e) => setNewSource({ ...newSource, check_frequency: e.target.value })}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Source URL"
                  value={newSource.source_url}
                  onChange={(e) => setNewSource({ ...newSource, source_url: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem'
                  }}
                />
                
                <button
                  onClick={() => testSource(newSource)}
                  disabled={!newSource.source_url || testingSource === 'new'}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <TestTube size={16} />
                  Test
                </button>
                
                <button
                  onClick={addSource}
                  disabled={!newSource.source_name || !newSource.source_url}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '0.5rem',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0, color: '#047857' }}>
                  AI-Suggested Sources ({suggestions.length})
                </h3>
                <button
                  onClick={bulkAddSuggestions}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Add All
                </button>
              </div>
              
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      {getSourceIcon(suggestion.source_type)}
                      <div>
                        <p style={{ fontWeight: '600', margin: 0 }}>{suggestion.source_name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                          {suggestion.reason}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addSuggestedSource(suggestion)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Source Coverage Info */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '0.5rem',
            color: 'white'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>
              🤖 Claude Research Agents Source Coverage
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', opacity: 0.9 }}>
              Automatically gathering data from 14+ premium sources for comprehensive analysis
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ opacity: 0.9 }}>• TechCrunch</div>
              <div style={{ opacity: 0.9 }}>• Reuters Business</div>
              <div style={{ opacity: 0.9 }}>• Bloomberg Tech</div>
              <div style={{ opacity: 0.9 }}>• VentureBeat</div>
              <div style={{ opacity: 0.9 }}>• Financial Times</div>
              <div style={{ opacity: 0.9 }}>• The Verge</div>
              <div style={{ opacity: 0.9 }}>• WSJ Technology</div>
              <div style={{ opacity: 0.9 }}>• Harvard Business Review</div>
              <div style={{ opacity: 0.9 }}>• MIT Tech Review</div>
              <div style={{ opacity: 0.9 }}>• Wired</div>
              <div style={{ opacity: 0.9 }}>• Fast Company</div>
              <div style={{ opacity: 0.9 }}>• Ars Technica</div>
              <div style={{ opacity: 0.9 }}>• Hacker News</div>
              <div style={{ opacity: 0.9 }}>• Product Hunt</div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.8, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.5rem' }}>
              <strong>Research Agents:</strong> Query Clarifier • Research Brief Generator • Research Orchestrator • Data Analyst • Report Generator
            </div>
          </div>

          {/* Current Sources */}
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Additional Custom Sources ({sources.length})</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <RefreshCw size={24} className="spin" style={{ color: '#6366f1' }} />
                <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>Loading sources...</p>
              </div>
            ) : sources.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px dashed #e5e7eb'
              }}>
                <p style={{ color: '#6b7280' }}>No sources configured yet.</p>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Click "Discover Sources" to get AI suggestions or add sources manually.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {sources.map((source) => (
                  <div key={source.id} style={{
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      {getSourceIcon(source.source_type)}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '600', margin: 0 }}>{source.source_name}</p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0' }}>
                          {source.source_url}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            background: '#f3f4f6',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Clock size={12} />
                            {source.check_frequency}
                          </span>
                          {source.is_active ? (
                            <span style={{
                              padding: '0.125rem 0.5rem',
                              background: '#dcfce7',
                              color: '#16a34a',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <CheckCircle size={12} />
                              Active
                            </span>
                          ) : (
                            <span style={{
                              padding: '0.125rem 0.5rem',
                              background: '#fee2e2',
                              color: '#dc2626',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}>
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => testSource(source)}
                        disabled={testingSource === source.id}
                        style={{
                          padding: '0.5rem',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <TestTube size={16} />
                      </button>
                      <button
                        onClick={() => deleteSource(source.id)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TargetSourcesManager;