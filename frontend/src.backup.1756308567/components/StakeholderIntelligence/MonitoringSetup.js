import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Building2, TrendingUp, Target, ChevronRight, Info, Sparkles } from 'lucide-react';
import industryKeywordService from '../../services/industryKeywordDatabase';

const MonitoringSetup = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    company: '',
    industry: '',
    objectives: ''
  });
  
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [customCompetitor, setCustomCompetitor] = useState('');
  
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [suggestedCompetitors, setSuggestedCompetitors] = useState([]);

  // Generate suggestions when company data changes
  useEffect(() => {
    if (companyData.company && companyData.industry) {
      const industryData = industryKeywordService.getIndustryKeywords(companyData.industry);
      const competitors = industryKeywordService.identifyCompetitors(companyData.company, companyData.industry);
      
      // Suggested topics based on industry and objectives
      const topics = [
        `${companyData.company} news`,
        `${companyData.company} announcements`,
        ...industryData.trendingTopics.slice(0, 5),
        ...industryData.keywords.slice(0, 5)
      ];
      
      setSuggestedTopics(topics);
      setSuggestedCompetitors(competitors);
      
      // Pre-select some important ones
      setSelectedTopics([
        `${companyData.company} news`,
        industryData.trendingTopics[0],
        industryData.trendingTopics[1]
      ].filter(Boolean));
      
      setSelectedCompetitors(competitors.slice(0, 2));
    }
  }, [companyData]);

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const addTopic = (topic) => {
    if (!selectedTopics.includes(topic)) {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const removeTopic = (topic) => {
    setSelectedTopics(selectedTopics.filter(t => t !== topic));
  };

  const addCompetitor = (competitor) => {
    if (!selectedCompetitors.includes(competitor)) {
      setSelectedCompetitors([...selectedCompetitors, competitor]);
    }
  };

  const removeCompetitor = (competitor) => {
    setSelectedCompetitors(selectedCompetitors.filter(c => c !== competitor));
  };

  const addCustomTopic = () => {
    if (customTopic && !selectedTopics.includes(customTopic)) {
      setSelectedTopics([...selectedTopics, customTopic]);
      setCustomTopic('');
    }
  };

  const addCustomCompetitor = () => {
    if (customCompetitor && !selectedCompetitors.includes(customCompetitor)) {
      setSelectedCompetitors([...selectedCompetitors, customCompetitor]);
      setCustomCompetitor('');
    }
  };

  const completeSetup = () => {
    const monitoringConfig = {
      ...companyData,
      topics: selectedTopics,
      competitors: selectedCompetitors,
      createdAt: new Date().toISOString()
    };
    
    console.log('Monitoring configuration:', monitoringConfig);
    onSetupComplete(monitoringConfig);
  };

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '2rem',
      height: '100%',
      overflowY: 'auto'
    }}>
      {/* Progress Indicator */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: step >= 1 ? '#6366f1' : '#e5e7eb',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}>
            1
          </div>
          <div style={{
            width: '100px',
            height: '2px',
            background: step >= 2 ? '#6366f1' : '#e5e7eb'
          }} />
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: step >= 2 ? '#6366f1' : '#e5e7eb',
            color: step >= 2 ? 'white' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}>
            2
          </div>
          <div style={{
            width: '100px',
            height: '2px',
            background: step >= 3 ? '#6366f1' : '#e5e7eb'
          }} />
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: step >= 3 ? '#6366f1' : '#e5e7eb',
            color: step >= 3 ? 'white' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}>
            3
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '5rem',
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <span>Company Info</span>
          <span>Topics</span>
          <span>Competitors</span>
        </div>
      </div>

      {/* Step 1: Company Information */}
      {step === 1 && (
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Tell us about your company
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            We'll use this to suggest relevant topics and competitors to monitor
          </p>

          <form onSubmit={handleCompanySubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                Company Name
              </label>
              <input
                type="text"
                value={companyData.company}
                onChange={(e) => setCompanyData({ ...companyData, company: e.target.value })}
                placeholder="e.g., Acme Corp"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                Industry
              </label>
              <select
                value={companyData.industry}
                onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select an industry</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="retail">Retail</option>
                <option value="energy">Energy</option>
                <option value="media">Media</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                Current Objectives (Optional)
              </label>
              <textarea
                value={companyData.objectives}
                onChange={(e) => setCompanyData({ ...companyData, objectives: e.target.value })}
                placeholder="e.g., Product launch, IPO preparation, crisis management..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  minHeight: '80px'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '0.75rem 2rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginLeft: 'auto'
              }}
            >
              Next: Choose Topics
              <ChevronRight size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Select Topics */}
      {step === 2 && (
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            What topics should we monitor?
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Select suggested topics or add your own custom topics to track
          </p>

          {/* Selected Topics */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
              SELECTED TOPICS ({selectedTopics.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedTopics.map((topic, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#e0e7ff',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <TrendingUp size={14} style={{ color: '#6366f1' }} />
                  <span style={{ fontSize: '0.875rem', color: '#4f46e5' }}>{topic}</span>
                  <button
                    onClick={() => removeTopic(topic)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <X size={14} style={{ color: '#6366f1' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Topics */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
              SUGGESTED TOPICS
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {suggestedTopics
                .filter(topic => !selectedTopics.includes(topic))
                .map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => addTopic(topic)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.background = '#f0f9ff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <Plus size={14} />
                    <span style={{ fontSize: '0.875rem' }}>{topic}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Add Custom Topic */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
              ADD CUSTOM TOPIC
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Enter a custom topic to monitor"
                onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem'
                }}
              />
              <button
                onClick={addCustomTopic}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6366f1',
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

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#6366f1',
                border: '1px solid #6366f1',
                borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedTopics.length === 0}
              style={{
                padding: '0.75rem 2rem',
                background: selectedTopics.length > 0 ? '#6366f1' : '#e5e7eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: selectedTopics.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Next: Choose Competitors
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Competitors */}
      {step === 3 && (
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Which competitors should we track?
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            We'll monitor their news, announcements, and activities
          </p>

          {/* Selected Competitors */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
              SELECTED COMPETITORS ({selectedCompetitors.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedCompetitors.map((competitor, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#dcfce7',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Building2 size={14} style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: '0.875rem', color: '#15803d' }}>{competitor}</span>
                  <button
                    onClick={() => removeCompetitor(competitor)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <X size={14} style={{ color: '#16a34a' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Competitors */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
              SUGGESTED COMPETITORS
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {suggestedCompetitors
                .filter(comp => !selectedCompetitors.includes(comp))
                .map((competitor, idx) => (
                  <button
                    key={idx}
                    onClick={() => addCompetitor(competitor)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#10b981';
                      e.currentTarget.style.background = '#f0fdf4';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <Plus size={14} />
                    <span style={{ fontSize: '0.875rem' }}>{competitor}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Add Custom Competitor */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
              ADD CUSTOM COMPETITOR
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={customCompetitor}
                onChange={(e) => setCustomCompetitor(e.target.value)}
                placeholder="Enter a competitor name"
                onKeyPress={(e) => e.key === 'Enter' && addCustomCompetitor()}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem'
                }}
              />
              <button
                onClick={addCustomCompetitor}
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

          {/* Info Box */}
          <div style={{
            padding: '1rem',
            background: '#f0f9ff',
            borderRadius: '0.375rem',
            border: '1px solid #bfdbfe',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem'
          }}>
            <Info size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                <strong>Tip:</strong> Start with 3-5 competitors. You can always add more later.
                We'll track their press releases, product launches, executive moves, and more.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#6366f1',
                border: '1px solid #6366f1',
                borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
            <button
              onClick={completeSetup}
              style={{
                padding: '0.75rem 2rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Sparkles size={20} />
              Start Monitoring
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringSetup;