import React, { useState, useEffect } from 'react';

const API_BASE_URL = "http://localhost:5001/api";

const AISentimentMonitorV2 = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [analysisResults, setAnalysisResults] = useState({});
  
  // Unified monitoring configuration
  const [monitoringConfig, setMonitoringConfig] = useState({
    // What to monitor
    sources: {
      rss: true,
      websites: false,
      social: false
    },
    keywords: '',
    websites: [],
    
    // Agent instructions - natural language
    agentInstructions: `I want to monitor news and mentions about my company and competitors.

What to look for:
- Any mentions of our brand or products
- Customer complaints or praise
- Security issues or data breaches
- Competitor announcements
- Market trends affecting our industry

How to analyze:
- Flag any security or legal issues as critical
- Identify opportunities for engagement
- Assess sentiment based on overall tone
- Consider the source credibility
- Look for emerging patterns`,
    
    // Saved for next session
    savedConfig: null
  });

  // Load saved configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/monitoring/config`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setMonitoringConfig(prev => ({
              ...prev,
              ...data,
              savedConfig: data
            }));
          }
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    
    loadConfig();
  }, []);

  // Save configuration
  const saveConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/monitoring/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(monitoringConfig)
      });
      
      if (response.ok) {
        alert('Configuration saved successfully!');
        setMonitoringConfig(prev => ({
          ...prev,
          savedConfig: { ...prev }
        }));
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    }
  };

  // Fetch mentions based on configuration
  const fetchMentions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build the request based on enabled sources
      const requestBody = {
        keywords: monitoringConfig.keywords,
        sources: monitoringConfig.sources,
        websites: monitoringConfig.websites,
        agentInstructions: monitoringConfig.agentInstructions
      };
      
      const response = await fetch(`${API_BASE_URL}/monitoring/fetch-mentions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        setMentions(data.mentions || []);
        setActiveTab('analysis');
      } else {
        alert('Failed to fetch mentions');
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
      alert('Error fetching mentions');
    } finally {
      setLoading(false);
    }
  };

  // Analyze mentions with agent
  const analyzeMentions = async (selectedMentions = mentions) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/monitoring/analyze-with-agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mentions: selectedMentions,
          agentInstructions: monitoringConfig.agentInstructions
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store analysis results
        const results = {};
        data.results.forEach(result => {
          results[result.id] = result.analysis;
        });
        setAnalysisResults(results);
      } else {
        alert('Failed to analyze mentions');
      }
    } catch (error) {
      console.error('Error analyzing mentions:', error);
      alert('Error analyzing mentions');
    } finally {
      setLoading(false);
    }
  };

  // Render setup tab
  const renderSetupTab = () => (
    <div className="p-6 space-y-6">
      {/* Monitoring Sources */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">What to Monitor</h3>
        
        <div className="space-y-4">
          {/* Source toggles */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={monitoringConfig.sources.rss}
                onChange={(e) => setMonitoringConfig(prev => ({
                  ...prev,
                  sources: { ...prev.sources, rss: e.target.checked }
                }))}
                className="rounded"
              />
              <span>RSS Feeds & News Sites</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={monitoringConfig.sources.websites}
                onChange={(e) => setMonitoringConfig(prev => ({
                  ...prev,
                  sources: { ...prev.sources, websites: e.target.checked }
                }))}
                className="rounded"
              />
              <span>Specific Websites</span>
            </label>
            
            <label className="flex items-center space-x-2 text-gray-400">
              <input
                type="checkbox"
                checked={monitoringConfig.sources.social}
                disabled
                className="rounded"
              />
              <span>Social Media (Coming Soon)</span>
            </label>
          </div>
          
          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Keywords to Monitor
            </label>
            <input
              type="text"
              value={monitoringConfig.keywords}
              onChange={(e) => setMonitoringConfig(prev => ({
                ...prev,
                keywords: e.target.value
              }))}
              placeholder="Microsoft, Amazon, AI, security breach"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Comma-separated keywords to filter content
            </p>
          </div>
          
          {/* Websites (if enabled) */}
          {monitoringConfig.sources.websites && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Websites to Monitor
              </label>
              <textarea
                value={monitoringConfig.websites.join('\n')}
                onChange={(e) => setMonitoringConfig(prev => ({
                  ...prev,
                  websites: e.target.value.split('\n').filter(url => url.trim())
                }))}
                placeholder="https://example.com/blog&#10;https://competitor.com/news"
                className="w-full px-3 py-2 border rounded-lg h-24"
              />
              <p className="text-sm text-gray-500 mt-1">
                One URL per line
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Agent Instructions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">AI Agent Instructions</h3>
        <p className="text-sm text-gray-600 mb-4">
          Tell the AI agent what to look for and how to analyze mentions. 
          Be specific about your business context, competitors, and what matters to you.
        </p>
        
        <textarea
          value={monitoringConfig.agentInstructions}
          onChange={(e) => setMonitoringConfig(prev => ({
            ...prev,
            agentInstructions: e.target.value
          }))}
          className="w-full px-3 py-2 border rounded-lg h-64 font-mono text-sm"
          placeholder="Describe what you want to monitor and how to analyze it..."
        />
        
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => {
              // Reset to default instructions
              setMonitoringConfig(prev => ({
                ...prev,
                agentInstructions: `I want to monitor news and mentions about my company and competitors.

What to look for:
- Any mentions of our brand or products
- Customer complaints or praise
- Security issues or data breaches
- Competitor announcements
- Market trends affecting our industry

How to analyze:
- Flag any security or legal issues as critical
- Identify opportunities for engagement
- Assess sentiment based on overall tone
- Consider the source credibility
- Look for emerging patterns`
              }));
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Reset to Template
          </button>
          
          <div className="space-x-2">
            <button
              onClick={saveConfig}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Save Configuration
            </button>
            
            <button
              onClick={fetchMentions}
              disabled={loading || !monitoringConfig.keywords}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Fetching...' : 'Start Monitoring'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render analysis tab
  const renderAnalysisTab = () => (
    <div className="p-6 space-y-6">
      {/* Analysis Actions */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {mentions.length} Mentions Found
          </h3>
          <p className="text-sm text-gray-600">
            {Object.keys(analysisResults).length} analyzed
          </p>
        </div>
        
        <div className="space-x-2">
          <button
            onClick={() => setActiveTab('setup')}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Back to Setup
          </button>
          
          <button
            onClick={() => analyzeMentions()}
            disabled={loading || mentions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze All'}
          </button>
        </div>
      </div>
      
      {/* Mentions List */}
      <div className="space-y-4">
        {mentions.map((mention) => (
          <div key={mention.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{mention.title || 'Untitled'}</h4>
                <p className="text-sm text-gray-600">
                  {mention.source} • {new Date(mention.publishDate).toLocaleDateString()}
                </p>
              </div>
              
              {analysisResults[mention.id] && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analysisResults[mention.id].sentiment === 'positive' 
                    ? 'bg-green-100 text-green-800'
                    : analysisResults[mention.id].sentiment === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : analysisResults[mention.id].sentiment === 'critical'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {analysisResults[mention.id].sentiment}
                  {analysisResults[mention.id].urgency === 'high' && ' ⚠️'}
                </div>
              )}
            </div>
            
            <p className="text-gray-700 mb-3">
              {mention.content.substring(0, 200)}...
            </p>
            
            {analysisResults[mention.id] && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <p className="font-medium mb-1">AI Analysis:</p>
                <p className="text-gray-700">{analysisResults[mention.id].summary}</p>
                {analysisResults[mention.id].action_required && (
                  <p className="mt-2 text-blue-600 font-medium">
                    Action: {analysisResults[mention.id].action_required}
                  </p>
                )}
              </div>
            )}
            
            {!analysisResults[mention.id] && (
              <button
                onClick={() => analyzeMentions([mention])}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Analyze this mention
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">AI Monitoring Agent</h1>
            <p className="text-gray-600">
              Natural language monitoring and analysis
            </p>
          </div>
          
          {/* Simple Tab Navigation */}
          <div className="border-t flex">
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'setup'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Setup Monitoring
            </button>
            
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Analysis & Results
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'setup' && renderSetupTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
      </div>
    </div>
  );
};

export default AISentimentMonitorV2;