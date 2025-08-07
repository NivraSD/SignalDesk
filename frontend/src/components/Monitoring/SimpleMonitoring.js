import React, { useState, useEffect } from 'react';
import { Activity, Search, BarChart3, AlertCircle, TrendingUp, TrendingDown, Minus, RefreshCw, TestTube2 } from 'lucide-react';
import { testStrategy } from './TestStrategy';

const SimpleMonitoring = ({ strategy, onDataUpdate }) => {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentStrategy, setCurrentStrategy] = useState(strategy);

  // Load strategy when provided
  useEffect(() => {
    if (strategy) {
      console.log('Strategy received:', strategy);
      setCurrentStrategy(strategy);
    }
  }, [strategy]);

  const testWithApple = () => {
    console.log('🧪 Loading test strategy for Apple...');
    setCurrentStrategy(testStrategy);
    setMentions([]);
  };

  const fetchMentions = async () => {
    if (!currentStrategy || !currentStrategy.strategy?.keywords) {
      alert('No monitoring strategy found. Please create one in the AI Strategy tab first or use the test strategy.');
      return;
    }

    setLoading(true);
    console.log('Fetching mentions with strategy:', currentStrategy);

    try {
      const payload = {
        keywords: currentStrategy.strategy.keywords
      };
      
      console.log('Sending payload:', payload);

      const response = await fetch('http://localhost:5001/api/monitoring/fetch-rss', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setMentions(data.mentions || []);
        setLastUpdate(new Date());
        console.log(`✅ Fetched ${data.mentions?.length || 0} mentions`);
        
        // Update parent component with monitoring data
        if (onDataUpdate) {
          onDataUpdate({ mentions: data.mentions || [] });
        }
        
        if (data.mentions?.length === 0) {
          alert('No mentions found matching your keywords. Try broader keywords or check back later.');
        }
      } else {
        throw new Error(data.error || data.message || 'Failed to fetch mentions');
      }
    } catch (error) {
      console.error('❌ Error fetching mentions:', error);
      alert(`Error fetching mentions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeMentions = async () => {
    if (!mentions.length) {
      alert('No mentions to analyze. Fetch mentions first.');
      return;
    }

    setAnalyzing(true);
    console.log(`🔍 Starting analysis of ${mentions.length} mentions...`);

    try {
      const analysisPromises = mentions.map(async (mention, index) => {
        try {
          console.log(`Analyzing mention ${index + 1}/${mentions.length}: ${mention.title?.substring(0, 50)}...`);

          const payload = {
            text: mention.content || mention.title,
            context: {
              company: currentStrategy.profile?.company,
              keywords: currentStrategy.strategy?.keywords,
              risks: currentStrategy.profile?.keyRisks,
              opportunities: currentStrategy.profile?.opportunities
            }
          };

          const response = await fetch('http://localhost:5001/api/monitoring/analyze-sentiment', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          console.log(`✅ Analysis ${index + 1} complete:`, data.sentiment);
          
          return {
            ...mention,
            sentiment: data.sentiment || 'neutral',
            sentimentScore: data.sentiment_score || 0,
            analysis: data.summary || data.rationale || 'Analysis not available',
            analyzed: true
          };
        } catch (error) {
          console.error(`❌ Error analyzing mention ${index + 1}:`, error);
          return {
            ...mention,
            sentiment: 'neutral',
            sentimentScore: 0,
            analysis: `Analysis failed: ${error.message}`,
            analyzed: false
          };
        }
      });

      const analyzedMentions = await Promise.all(analysisPromises);
      setMentions(analyzedMentions);
      
      // Update parent component with analyzed data
      if (onDataUpdate) {
        onDataUpdate({ mentions: analyzedMentions });
      }
      
      const successCount = analyzedMentions.filter(m => m.analyzed).length;
      console.log(`🎉 Analysis complete: ${successCount}/${mentions.length} successful`);
      
      if (successCount === 0) {
        alert('Analysis failed for all mentions. Please check the console for details.');
      }
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      alert(`Error analyzing mentions: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSentimentStats = () => {
    const total = mentions.length;
    if (total === 0) return { positive: 0, negative: 0, neutral: 0 };

    const positive = mentions.filter(m => m.sentiment === 'positive').length;
    const negative = mentions.filter(m => m.sentiment === 'negative').length;
    const neutral = total - positive - negative;

    return {
      positive: Math.round((positive / total) * 100),
      negative: Math.round((negative / total) * 100),
      neutral: Math.round((neutral / total) * 100)
    };
  };

  if (!currentStrategy) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: '#f59e0b' }} />
        <h3 style={{ margin: 0, color: '#111827' }}>No Monitoring Strategy</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>
          Go to the AI Strategy tab to create a monitoring strategy first, or test with a sample strategy.
        </p>
        <button
          onClick={testWithApple}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          <TestTube2 style={{ width: '16px', height: '16px' }} />
          Test with Apple Strategy
        </button>
      </div>
    );
  }

  const stats = getSentimentStats();

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      gap: '1.5rem'
    }}>
      {/* Strategy Summary */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1rem'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>
          Monitoring: {currentStrategy.profile?.company || 'Unknown Target'}
        </h3>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          <strong>Keywords:</strong> {currentStrategy.strategy?.keywords?.join(', ') || 'None'}
        </div>
        {currentStrategy.profile?.industry && (
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Industry:</strong> {currentStrategy.profile.industry}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <button
          onClick={fetchMentions}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {loading ? 'Fetching...' : 'Fetch Mentions'}
        </button>

        {mentions.length > 0 && (
          <button
            onClick={analyzeMentions}
            disabled={analyzing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: analyzing ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: analyzing ? 'not-allowed' : 'pointer'
            }}
          >
            {analyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
            {analyzing ? 'Analyzing...' : `Analyze ${mentions.length} Mentions`}
          </button>
        )}

        {lastUpdate && (
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}

        {!currentStrategy.profile?.company?.includes('Test') && (
          <button
            onClick={testWithApple}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <TestTube2 style={{ width: '14px', height: '14px' }} />
            Test Mode
          </button>
        )}
      </div>

      {/* Sentiment Stats */}
      {mentions.length > 0 && mentions.some(m => m.analyzed) && (
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#111827' }}>Sentiment Overview</h4>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {stats.positive}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Positive</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>
                {stats.neutral}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Neutral</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                {stats.negative}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Negative</div>
            </div>
          </div>
        </div>
      )}

      {/* Mentions List */}
      <div style={{
        flex: 1,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Activity className="w-5 h-5 text-gray-700" />
          <h4 style={{ margin: 0, color: '#111827' }}>
            Mentions ({mentions.length})
          </h4>
        </div>

        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {mentions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              No mentions found. Click "Fetch Mentions" to start monitoring.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mentions.map((mention, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: '#fafafa'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <h5 style={{
                      margin: 0,
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      color: '#111827',
                      flex: 1
                    }}>
                      {mention.title}
                    </h5>
                    {mention.analyzed && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        background: getSentimentColor(mention.sentiment) + '20',
                        color: getSentimentColor(mention.sentiment)
                      }}>
                        {getSentimentIcon(mention.sentiment)}
                        <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                          {mention.sentiment}
                        </span>
                      </div>
                    )}
                  </div>

                  <p style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    {mention.content?.substring(0, 200)}...
                  </p>

                  {mention.analysis && (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '0.375rem',
                      marginTop: '0.5rem'
                    }}>
                      <strong style={{ fontSize: '0.75rem', color: '#0369a1' }}>Analysis:</strong>
                      <div style={{ fontSize: '0.875rem', color: '#0c4a6e', marginTop: '0.25rem' }}>
                        {mention.analysis}
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#9ca3af'
                  }}>
                    <span>Source: {mention.source}</span>
                    {mention.publishDate && (
                      <span>{new Date(mention.publishDate).toLocaleDateString()}</span>
                    )}
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

export default SimpleMonitoring;