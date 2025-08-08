import React, { useState, useRef } from 'react';
import { 
  Building, Loader, 
  CheckCircle, Users, X, Plus, Eye, EyeOff,
  Lightbulb
} from 'lucide-react';
import API_BASE_URL from '../../config/api';

const SmartStakeholderBuilder = ({ onComplete }) => {
  const [stage, setStage] = useState('initial'); // initial, loading, review, complete
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [stakeholders, setStakeholders] = useState([]);
  const [companyOverview, setCompanyOverview] = useState(null);
  const companyInputRef = useRef(null);

  // Render company input form
  const renderCompanyInput = () => (
    <div style={styles.container}>
      <div style={styles.header}>
        <Building style={{ width: '24px', height: '24px', color: '#6366f1' }} />
        <h2 style={styles.title}>Let's identify your stakeholders</h2>
      </div>
      
      <p style={styles.description}>
        Tell us about your organization and we'll suggest the key stakeholder groups you should monitor.
      </p>

      <div style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Organization Name</label>
          <input
            ref={companyInputRef}
            type="text"
            defaultValue={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter organization name"
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Industry</label>
          <select 
            value={industry} 
            onChange={(e) => setIndustry(e.target.value)}
            style={styles.select}
          >
            <option value="">Select industry...</option>
            <option value="technology">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="energy">Energy</option>
            <option value="diversified">Diversified/Conglomerate</option>
            <option value="nonprofit">Nonprofit</option>
            <option value="government">Government</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          onClick={analyzeStakeholders}
          style={styles.button}
        >
          <Lightbulb style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
          Get Stakeholder Suggestions
        </button>
      </div>
    </div>
  );

  // Get AI suggestions with focused prompt
  const analyzeStakeholders = async () => {
    // Get the current value from the ref if using uncontrolled component
    const currentCompanyName = companyInputRef.current?.value || companyName;
    
    if (!currentCompanyName || !industry) {
      return;
    }
    
    setCompanyName(currentCompanyName);
    setStage('loading');

    try {
      // First, get company overview
      const overviewResponse = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Provide a brief executive analysis of ${currentCompanyName} (${industry} sector) in exactly this format:

OVERVIEW: [2-3 sentence company description including size, main business, and market position]

KEY INSIGHTS:
- [Insight about competitive position or market dynamics]
- [Insight about recent developments or strategic direction]
- [Insight about stakeholder relationships or brand perception]

STRATEGIC CONTEXT: [1-2 sentences about the most important stakeholder considerations for this organization]`,
          context: 'company_overview'
        })
      });

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        const overview = parseCompanyOverview(overviewData.response || overviewData.analysis || '');
        setCompanyOverview(overview);
      }

      // Then get stakeholder suggestions
      const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `For ${currentCompanyName}, a ${industry} organization, identify the 10 most important stakeholder groups.

For each stakeholder group, provide EXACTLY in this format:
1. [Stakeholder Name] | [Why they matter in 1 sentence] | [keyword1, keyword2, keyword3]

Example:
1. Institutional Investors | Control major equity stakes and influence strategic decisions | earnings, dividends, governance

Be specific to ${companyName} and the ${industry} industry. Include both internal (employees, management) and external (customers, regulators, communities) stakeholders.`,
          context: 'stakeholder_identification'
        })
      });

      if (!response.ok) throw new Error('Failed to get suggestions');
      
      const data = await response.json();
      const suggestions = parseStakeholderSuggestions(data.response || data.analysis || '');
      
      setStakeholders(suggestions);
      setStage('review');
    } catch (err) {
      console.error('Error:', err);
      setStage('initial');
    }
  };

  // Parse company overview
  const parseCompanyOverview = (aiResponse) => {
    const overview = {
      description: '',
      insights: [],
      strategicContext: ''
    };

    const lines = aiResponse.split('\n');
    let currentSection = '';

    lines.forEach(line => {
      if (line.startsWith('OVERVIEW:')) {
        overview.description = line.replace('OVERVIEW:', '').trim();
      } else if (line.startsWith('KEY INSIGHTS:')) {
        currentSection = 'insights';
      } else if (line.startsWith('STRATEGIC CONTEXT:')) {
        overview.strategicContext = line.replace('STRATEGIC CONTEXT:', '').trim();
      } else if (currentSection === 'insights' && line.trim().startsWith('-')) {
        overview.insights.push(line.trim().substring(1).trim());
      }
    });

    return overview;
  };

  // Parse AI response into structured data
  const parseStakeholderSuggestions = (aiResponse) => {
    const lines = aiResponse.split('\n').filter(line => line.trim());
    const stakeholders = [];

    lines.forEach(line => {
      const match = line.match(/^\d+\.\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)$/);
      if (match) {
        const [, name, reason, keywordsStr] = match;
        const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
        
        stakeholders.push({
          id: Date.now() + Math.random(),
          name: name.trim(),
          reason: reason.trim(),
          keywords: keywords,
          enabled: true,
          priority: 'medium'
        });
      }
    });

    // If parsing fails, add some defaults based on industry
    if (stakeholders.length === 0) {
      stakeholders.push(...getDefaultStakeholders(industry));
    }

    return stakeholders;
  };

  // Get default stakeholders by industry
  const getDefaultStakeholders = (industry) => {
    const defaults = {
      diversified: [
        { name: 'Institutional Investors', reason: 'Major shareholders influencing strategic direction', keywords: ['investment', 'portfolio', 'returns'] },
        { name: 'Business Partners', reason: 'Critical for joint ventures and strategic alliances', keywords: ['partnership', 'alliance', 'collaboration'] },
        { name: 'Government Regulators', reason: 'Oversee compliance across multiple sectors', keywords: ['regulation', 'compliance', 'policy'] },
        { name: 'Employees', reason: 'Drive operational success across diverse businesses', keywords: ['workforce', 'talent', 'culture'] },
        { name: 'Local Communities', reason: 'Affected by operations in multiple regions', keywords: ['community', 'sustainability', 'impact'] }
      ],
      technology: [
        { name: 'Developers', reason: 'Build and evangelize your technology platform', keywords: ['API', 'developers', 'documentation'] },
        { name: 'Enterprise Customers', reason: 'Drive revenue and provide feedback', keywords: ['enterprise', 'customers', 'feedback'] },
        { name: 'Investors', reason: 'Provide capital and strategic guidance', keywords: ['funding', 'investment', 'valuation'] }
      ]
    };

    return (defaults[industry] || defaults.technology).map(s => ({
      ...s,
      id: Date.now() + Math.random(),
      enabled: true,
      priority: 'medium'
    }));
  };

  // Update stakeholder details
  const updateStakeholder = (id, field, value) => {
    setStakeholders(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Add new stakeholder
  const addStakeholder = () => {
    setStakeholders(prev => [...prev, {
      id: Date.now(),
      name: 'New Stakeholder',
      reason: 'Click to edit reason',
      keywords: ['keyword'],
      enabled: true,
      priority: 'medium'
    }]);
  };

  // Remove stakeholder
  const removeStakeholder = (id) => {
    setStakeholders(prev => prev.filter(s => s.id !== id));
  };

  // Review and edit suggestions
  const ReviewStakeholders = () => (
    <div style={{...styles.container, maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', paddingBottom: '4rem'}}>
      <div style={styles.header}>
        <Users style={{ width: '24px', height: '24px', color: '#6366f1' }} />
        <h2 style={styles.title}>Review Your Stakeholders</h2>
      </div>

      {/* Company Overview Section */}
      {companyOverview && (
        <div style={styles.overviewSection}>
          <h3 style={styles.overviewTitle}>Executive Summary</h3>
          <p style={styles.overviewText}>{companyOverview.description}</p>
          
          {companyOverview.insights.length > 0 && (
            <div style={styles.insightsSection}>
              <h4 style={styles.insightsTitle}>Key Insights</h4>
              <ul style={styles.insightsList}>
                {companyOverview.insights.map((insight, idx) => (
                  <li key={idx} style={styles.insightItem}>
                    <span style={{ color: '#6366f1', fontWeight: 'bold', marginRight: '0.5rem' }}>•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {companyOverview.strategicContext && (
            <div style={styles.strategicContextSection}>
              <h4 style={styles.strategicContextTitle}>Strategic Context</h4>
              <p style={styles.strategicContext}>{companyOverview.strategicContext}</p>
            </div>
          )}
        </div>
      )}

      <p style={styles.description}>
        Based on our analysis, we've identified these key stakeholder groups for {companyName}. 
        Review, edit, and prioritize them based on your specific needs.
      </p>

      <div style={styles.stakeholderList}>
        {stakeholders.map((stakeholder) => (
          <div key={stakeholder.id} style={styles.stakeholderCard}>
            <div style={styles.cardHeader}>
              <input
                type="text"
                value={stakeholder.name}
                onChange={(e) => updateStakeholder(stakeholder.id, 'name', e.target.value)}
                style={styles.nameInput}
              />
              <div style={styles.cardActions}>
                <select
                  value={stakeholder.priority}
                  onChange={(e) => updateStakeholder(stakeholder.id, 'priority', e.target.value)}
                  style={styles.prioritySelect}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  onClick={() => updateStakeholder(stakeholder.id, 'enabled', !stakeholder.enabled)}
                  style={styles.toggleButton}
                >
                  {stakeholder.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => removeStakeholder(stakeholder.id)}
                  style={styles.deleteButton}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <textarea
              value={stakeholder.reason}
              onChange={(e) => updateStakeholder(stakeholder.id, 'reason', e.target.value)}
              style={styles.reasonInput}
              rows={2}
            />

            <div style={styles.keywordsSection}>
              <label style={styles.keywordLabel}>Monitor keywords:</label>
              <div style={styles.keywordsList}>
                {stakeholder.keywords.map((keyword, idx) => (
                  <div key={idx} style={styles.keyword}>
                    <input
                      value={keyword}
                      onChange={(e) => {
                        const newKeywords = [...stakeholder.keywords];
                        newKeywords[idx] = e.target.value;
                        updateStakeholder(stakeholder.id, 'keywords', newKeywords);
                      }}
                      style={styles.keywordInput}
                    />
                    <button
                      onClick={() => {
                        const newKeywords = stakeholder.keywords.filter((_, i) => i !== idx);
                        updateStakeholder(stakeholder.id, 'keywords', newKeywords);
                      }}
                      style={styles.keywordDelete}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    updateStakeholder(stakeholder.id, 'keywords', [...stakeholder.keywords, 'new keyword']);
                  }}
                  style={styles.addKeyword}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addStakeholder} style={styles.addButton}>
        <Plus size={16} /> Add Stakeholder Group
      </button>

      <div style={styles.footer}>
        <button onClick={() => setStage('initial')} style={styles.backButton}>
          Back
        </button>
        <button 
          onClick={completeSetup}
          disabled={stakeholders.filter(s => s.enabled).length === 0}
          style={styles.completeButton}
        >
          <CheckCircle size={16} style={{ marginRight: '0.5rem' }} />
          Complete Setup ({stakeholders.filter(s => s.enabled).length} stakeholders)
        </button>
      </div>
    </div>
  );

  // Complete setup
  const completeSetup = () => {
    const enabledStakeholders = stakeholders.filter(s => s.enabled);
    
    if (onComplete) {
      onComplete({
        company: companyName,
        industry: industry,
        stakeholders: enabledStakeholders,
        overview: companyOverview
      });
    }
    
    setStage('complete');
  };

  // Loading state
  const LoadingState = () => (
    <div style={styles.loadingContainer}>
      <Loader style={{ width: '48px', height: '48px', color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      <h3 style={styles.loadingText}>Analyzing {companyName}...</h3>
      <p style={styles.loadingSubtext}>Identifying key stakeholder groups</p>
    </div>
  );

  // Success state
  const SuccessState = () => (
    <div style={styles.successContainer}>
      <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981' }} />
      <h3 style={styles.successText}>Stakeholder Setup Complete!</h3>
      <p style={styles.successSubtext}>
        Monitoring {stakeholders.filter(s => s.enabled).length} stakeholder groups for {companyName}
      </p>
    </div>
  );

  // Render based on stage
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {stage === 'loading' && <LoadingState />}
      {stage === 'review' && <ReviewStakeholders />}
      {stage === 'complete' && <SuccessState />}
      {stage === 'initial' && renderCompanyInput()}
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#111827'
  },
  description: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '2rem',
    lineHeight: '1.5'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'border-color 0.15s',
    '&:focus': {
      borderColor: '#6366f1'
    }
  },
  select: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s'
  },
  stakeholderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  stakeholderCard: {
    padding: '1.25rem',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  nameInput: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    flex: 1
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  prioritySelect: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.875rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    outline: 'none'
  },
  toggleButton: {
    padding: '0.375rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center'
  },
  deleteButton: {
    padding: '0.375rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center'
  },
  reasonInput: {
    width: '100%',
    padding: '0.5rem',
    fontSize: '0.875rem',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    outline: 'none',
    resize: 'none',
    marginBottom: '0.75rem'
  },
  keywordsSection: {
    marginTop: '0.75rem'
  },
  keywordLabel: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '0.5rem',
    display: 'block'
  },
  keywordsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  keyword: {
    display: 'flex',
    alignItems: 'center',
    background: '#f3f4f6',
    borderRadius: '0.375rem',
    padding: '0.25rem'
  },
  keywordInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '0.875rem',
    padding: '0.25rem 0.5rem',
    minWidth: '80px'
  },
  keywordDelete: {
    padding: '0.25rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center'
  },
  addKeyword: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    color: '#6366f1',
    background: 'transparent',
    border: '1px solid #6366f1',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  addButton: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#6366f1',
    backgroundColor: 'transparent',
    border: '2px dashed #e5e7eb',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '2rem'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem'
  },
  backButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  },
  completeButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem'
  },
  loadingText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  loadingSubtext: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem'
  },
  successText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  successSubtext: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: 0
  },
  overviewSection: {
    background: '#f9fafb',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  overviewTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    marginTop: 0,
    marginBottom: '0.75rem'
  },
  overviewText: {
    fontSize: '1rem',
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '1rem'
  },
  insightsSection: {
    marginTop: '1rem'
  },
  insightsTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginTop: 0,
    marginBottom: '0.5rem'
  },
  insightsList: {
    margin: '0',
    paddingLeft: '1.5rem',
    listStyle: 'none'
  },
  insightItem: {
    marginBottom: '0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.6',
    color: '#4b5563',
    display: 'flex',
    alignItems: 'flex-start'
  },
  strategicContext: {
    fontSize: '0.875rem',
    color: '#4b5563',
    marginBottom: 0,
    lineHeight: '1.6'
  },
  strategicContextSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb'
  },
  strategicContextTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginTop: 0,
    marginBottom: '0.5rem'
  }
};

export default SmartStakeholderBuilder;