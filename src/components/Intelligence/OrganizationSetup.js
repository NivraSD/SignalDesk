import React, { useState } from 'react';
import { 
  Building2, Users, Target, Globe, Hash, TrendingUp, 
  ArrowRight, Check, Plus, X, AlertCircle, Sparkles,
  Shield, Zap, Search, Save
} from 'lucide-react';

const OrganizationSetup = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [orgData, setOrgData] = useState({
    name: '',
    industry: '',
    ticker: '',
    website: '',
    description: '',
    competitors: [],
    stakeholders: {
      regulators: [],
      investors: [],
      customers: [],
      employees: [],
      activists: [],
      media: []
    },
    topics: [],
    products: []
  });
  
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newProduct, setNewProduct] = useState('');

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Energy', 'Transportation', 'Media', 'Telecommunications', 'Real Estate',
    'Food & Beverage', 'Education', 'Government', 'Non-Profit', 'Other'
  ];

  const suggestedTopics = [
    'AI & Machine Learning', 'Data Privacy', 'ESG & Sustainability', 
    'Supply Chain', 'Cybersecurity', 'Digital Transformation',
    'Remote Work', 'Regulatory Compliance', 'Market Trends',
    'Innovation', 'Customer Experience', 'Crisis Management'
  ];

  const handleAddItem = (field, value, setter) => {
    if (value.trim()) {
      setOrgData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter('');
    }
  };

  const handleRemoveItem = (field, index) => {
    setOrgData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleComplete = () => {
    // Transform data for the system
    const setupData = {
      organizationId: `org-${Date.now()}`,
      company: orgData.name,
      industry: orgData.industry,
      overview: orgData.description,
      stakeholders: [
        ...orgData.competitors.map(c => ({
          id: `comp-${c.toLowerCase().replace(/\s+/g, '-')}`,
          name: c,
          type: 'competitor',
          priority: 'high',
          keywords: [c.toLowerCase()],
          topics: ['competitive intelligence', 'market share'],
        })),
        ...orgData.topics.map((t, idx) => ({
          id: `topic-${idx}`,
          name: t,
          type: 'topic',
          priority: 'high',
          keywords: t.toLowerCase().split(' '),
          topics: [t]
        }))
      ],
      enhancedFeatures: {
        preIndexedCount: 0,
        totalSources: 50,
        researchAgentsEnabled: true
      }
    };

    onSetupComplete(setupData);
  };

  const isStepComplete = () => {
    switch(step) {
      case 1: return orgData.name && orgData.industry;
      case 2: return orgData.competitors.length > 0 || orgData.topics.length > 0;
      case 3: return true; // Optional step
      default: return false;
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Building2 size={32} />
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Organization Setup</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Configure your organization profile to enable intelligent monitoring and opportunity detection
        </p>
      </div>

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '10%',
          right: '10%',
          height: '2px',
          background: '#e5e7eb',
          zIndex: 0
        }}>
          <div style={{
            width: `${((step - 1) / 2) * 100}%`,
            height: '100%',
            background: '#6366f1',
            transition: 'width 0.3s'
          }} />
        </div>
        
        {[1, 2, 3].map(num => (
          <div key={num} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step >= num ? '#6366f1' : 'white',
              border: `2px solid ${step >= num ? '#6366f1' : '#e5e7eb'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: step >= num ? 'white' : '#6b7280',
              fontWeight: '600'
            }}>
              {step > num ? <Check size={20} /> : num}
            </div>
            <span style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              color: step >= num ? '#111827' : '#6b7280',
              fontWeight: step === num ? '600' : '400'
            }}>
              {num === 1 ? 'Basic Info' : num === 2 ? 'Monitoring Targets' : 'Advanced Settings'}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid #e5e7eb',
        minHeight: '400px'
      }}>
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#111827' }}>Basic Information</h2>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  placeholder="e.g., Acme Corporation"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                    Industry *
                  </label>
                  <select
                    value={orgData.industry}
                    onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Select Industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                    Stock Ticker (Optional)
                  </label>
                  <input
                    type="text"
                    value={orgData.ticker}
                    onChange={(e) => setOrgData({ ...orgData, ticker: e.target.value })}
                    placeholder="e.g., ACME"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={orgData.website}
                  onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                  placeholder="https://www.example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={orgData.description}
                  onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                  placeholder="Brief description of your organization..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Monitoring Targets */}
        {step === 2 && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#111827' }}>What Should We Monitor?</h2>
            
            {/* Competitors */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                Competitors to Track
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem('competitors', newCompetitor, setNewCompetitor)}
                  placeholder="Add competitor name"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={() => handleAddItem('competitors', newCompetitor, setNewCompetitor)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {orgData.competitors.map((comp, idx) => (
                  <span key={idx} style={{
                    padding: '0.375rem 0.75rem',
                    background: '#eef2ff',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Building2 size={14} />
                    {comp}
                    <button
                      onClick={() => handleRemoveItem('competitors', idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6366f1',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                Topics to Monitor
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem('topics', newTopic, setNewTopic)}
                  placeholder="Add topic"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={() => handleAddItem('topics', newTopic, setNewTopic)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              
              {/* Suggested Topics */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>Suggested topics:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {suggestedTopics.filter(t => !orgData.topics.includes(t)).slice(0, 6).map(topic => (
                    <button
                      key={topic}
                      onClick={() => handleAddItem('topics', topic, () => {})}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      + {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {orgData.topics.map((topic, idx) => (
                  <span key={idx} style={{
                    padding: '0.375rem 0.75rem',
                    background: '#fef3c7',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Hash size={14} />
                    {topic}
                    <button
                      onClick={() => handleRemoveItem('topics', idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f59e0b',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Advanced Settings */}
        {step === 3 && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#111827' }}>Review & Activate</h2>
            
            <div style={{
              background: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', color: '#111827' }}>
                Organization Profile
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem', minWidth: '100px' }}>Name:</span>
                  <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: '500' }}>{orgData.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem', minWidth: '100px' }}>Industry:</span>
                  <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: '500' }}>{orgData.industry}</span>
                </div>
                {orgData.ticker && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem', minWidth: '100px' }}>Ticker:</span>
                    <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: '500' }}>{orgData.ticker}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              background: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', color: '#111827' }}>
                Monitoring Configuration
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Competitors ({orgData.competitors.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {orgData.competitors.map((comp, idx) => (
                      <span key={idx} style={{
                        padding: '0.25rem 0.5rem',
                        background: 'white',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#6366f1',
                        border: '1px solid #e5e7eb'
                      }}>
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Topics ({orgData.topics.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {orgData.topics.map((topic, idx) => (
                      <span key={idx} style={{
                        padding: '0.25rem 0.5rem',
                        background: 'white',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#f59e0b',
                        border: '1px solid #e5e7eb'
                      }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#dcfce7',
              borderRadius: '0.5rem',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Sparkles size={20} style={{ color: '#16a34a' }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#16a34a', fontWeight: '500' }}>
                  Ready to Activate Intelligence Monitoring
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#15803d' }}>
                  We'll automatically configure data sources and detection patterns based on your profile
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '2rem'
      }}>
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'white',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            cursor: step === 1 ? 'not-allowed' : 'pointer',
            opacity: step === 1 ? 0.5 : 1
          }}
        >
          Previous
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!isStepComplete()}
            style={{
              padding: '0.75rem 1.5rem',
              background: isStepComplete() ? '#6366f1' : '#e5e7eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isStepComplete() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Next
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <Zap size={18} />
            Activate Monitoring
          </button>
        )}
      </div>
    </div>
  );
};

export default OrganizationSetup;