import React, { useState, useEffect } from 'react';
import { TrendingUp, Building2, Lightbulb, ChevronRight, Plus, X } from 'lucide-react';

const CleanIntelligence = () => {
  const [step, setStep] = useState('setup');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simple industry data
  const industries = {
    technology: {
      topics: ['AI', 'cybersecurity', 'cloud computing', 'data privacy', 'automation'],
      competitors: ['Microsoft', 'Google', 'Apple', 'Amazon', 'Meta', 'OpenAI', 'Tesla', 'IBM']
    },
    finance: {
      topics: ['interest rates', 'fintech', 'cryptocurrency', 'regulation', 'digital banking'],
      competitors: ['JPMorgan', 'Bank of America', 'Goldman Sachs', 'Wells Fargo', 'Citi', 'PayPal']
    },
    healthcare: {
      topics: ['FDA approvals', 'telemedicine', 'AI diagnosis', 'drug pricing', 'clinical trials'],
      competitors: ['Pfizer', 'Johnson & Johnson', 'UnitedHealth', 'CVS', 'Moderna', 'Abbott']
    },
    retail: {
      topics: ['e-commerce', 'supply chain', 'customer experience', 'sustainability', 'social commerce'],
      competitors: ['Amazon', 'Walmart', 'Target', 'Costco', 'Home Depot', 'Nike']
    }
  };

  const handleSetup = (e) => {
    e.preventDefault();
    if (company && industry) {
      // Pre-select some suggestions
      const industryData = industries[industry] || industries.technology;
      setSelectedTopics([`${company} news`, ...industryData.topics.slice(0, 2)]);
      setSelectedCompetitors(industryData.competitors.filter(c => 
        !c.toLowerCase().includes(company.toLowerCase())
      ).slice(0, 3));
      setStep('configure');
    }
  };

  const startIntelligence = async () => {
    setLoading(true);
    setStep('dashboard');
    
    // Fetch some real data
    const results = await fetchIntelligence();
    setIntelligence(results);
    setLoading(false);
  };

  const fetchIntelligence = async () => {
    const insights = [];
    
    try {
      // Fetch news for the company
      const response = await fetch('http://localhost:5001/api/proxy/google-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${company} ${industry}` })
      });
      
      if (response.ok) {
        const data = await response.json();
        const articles = data.articles || [];
        
        // Analyze what we found
        if (articles.length > 0) {
          insights.push({
            type: 'trending',
            title: `${company} in the news`,
            description: `${articles.length} recent mentions found`,
            action: articles[0].sentiment === 'positive' ? 
              'Amplify positive coverage' : 'Monitor sentiment closely',
            priority: 'high'
          });
        }
      }
      
      // Check competitors
      for (const competitor of selectedCompetitors.slice(0, 2)) {
        const compResponse = await fetch('http://localhost:5001/api/proxy/google-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: competitor })
        });
        
        if (compResponse.ok) {
          const compData = await compResponse.json();
          if (compData.articles && compData.articles.length > 0) {
            const title = compData.articles[0].title || '';
            if (title.toLowerCase().includes('launch') || title.toLowerCase().includes('announce')) {
              insights.push({
                type: 'competitor',
                title: `${competitor} making moves`,
                description: title.substring(0, 100) + '...',
                action: 'Prepare competitive response',
                priority: 'medium'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching intelligence:', error);
    }
    
    // Add some strategic recommendations
    insights.push({
      type: 'opportunity',
      title: 'Content opportunity',
      description: `Trending topic "${selectedTopics[1]}" aligns with your expertise`,
      action: 'Create thought leadership content',
      priority: 'medium'
    });
    
    return insights;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Setup */}
      {step === 'setup' && (
        <div style={{ background: 'white', borderRadius: '0.5rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Strategic Intelligence Setup
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Tell us about your company to get started
          </p>
          
          <form onSubmit={handleSetup}>
            <input
              type="text"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                marginBottom: '1rem'
              }}
            />
            
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                marginBottom: '1rem'
              }}
            >
              <option value="">Select industry</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="retail">Retail</option>
            </select>
            
            <button
              type="submit"
              style={{
                padding: '0.75rem 2rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </form>
        </div>
      )}

      {/* Configure */}
      {step === 'configure' && (
        <div style={{ background: 'white', borderRadius: '0.5rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            What should we monitor?
          </h2>
          
          {/* Topics */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
              TOPICS ({selectedTopics.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {selectedTopics.map((topic, idx) => (
                <span key={idx} style={{
                  padding: '0.5rem 0.75rem',
                  background: '#e0e7ff',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {topic}
                  <button
                    onClick={() => setSelectedTopics(selectedTopics.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            
            {/* Add topic suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(industries[industry]?.topics || [])
                .filter(t => !selectedTopics.includes(t))
                .map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTopics([...selectedTopics, topic])}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Plus size={14} />
                    {topic}
                  </button>
                ))}
            </div>
          </div>

          {/* Competitors */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
              COMPETITORS ({selectedCompetitors.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {selectedCompetitors.map((comp, idx) => (
                <span key={idx} style={{
                  padding: '0.5rem 0.75rem',
                  background: '#dcfce7',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {comp}
                  <button
                    onClick={() => setSelectedCompetitors(selectedCompetitors.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            
            {/* Add competitor suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(industries[industry]?.competitors || [])
                .filter(c => !selectedCompetitors.includes(c) && !c.toLowerCase().includes(company.toLowerCase()))
                .map((comp, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCompetitors([...selectedCompetitors, comp])}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Plus size={14} />
                    {comp}
                  </button>
                ))}
            </div>
          </div>

          <button
            onClick={startIntelligence}
            style={{
              padding: '0.75rem 2rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Start Monitoring
          </button>
        </div>
      )}

      {/* Dashboard */}
      {step === 'dashboard' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '0.5rem',
            padding: '2rem',
            color: 'white',
            marginBottom: '1.5rem'
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {company} Intelligence
            </h1>
            <p style={{ opacity: 0.9 }}>
              Monitoring {selectedTopics.length} topics and {selectedCompetitors.length} competitors
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Analyzing intelligence...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {intelligence && intelligence.map((insight, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${
                    insight.priority === 'high' ? '#ef4444' : 
                    insight.priority === 'medium' ? '#f59e0b' : '#10b981'
                  }`
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                    {insight.type === 'trending' && <TrendingUp size={20} style={{ color: '#6366f1' }} />}
                    {insight.type === 'competitor' && <Building2 size={20} style={{ color: '#10b981' }} />}
                    {insight.type === 'opportunity' && <Lightbulb size={20} style={{ color: '#f59e0b' }} />}
                    
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {insight.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                        {insight.description}
                      </p>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#f3f4f6',
                        borderRadius: '0.375rem'
                      }}>
                        <ChevronRight size={16} />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {insight.action}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!intelligence || intelligence.length === 0) && (
                <div style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <p>No intelligence insights available yet. Check back in a few minutes.</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setStep('setup');
              setIntelligence(null);
            }}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#6366f1',
              border: '1px solid #6366f1',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

export default CleanIntelligence;