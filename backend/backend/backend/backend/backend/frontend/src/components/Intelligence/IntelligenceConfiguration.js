import React, { useState, useEffect } from 'react';
import { 
  Settings, Globe, Users, Building2, Target, Shield, 
  Lightbulb, Activity, Plus, X, Check, AlertCircle,
  ChevronRight, Eye, EyeOff, Zap, TrendingUp
} from 'lucide-react';
import EnhancedSourceConfigurator from '../StakeholderIntelligence/EnhancedSourceConfigurator';
import AutomatedOrganizationSetup from './AutomatedOrganizationSetup';

const IntelligenceConfiguration = ({ stakeholderStrategy, onSourcesUpdate, organizationId, onSetupComplete }) => {
  const [activeSection, setActiveSection] = useState('setup');
  const [detectionConfig, setDetectionConfig] = useState(null);
  const [customPatterns, setCustomPatterns] = useState([]);
  const [showAddPattern, setShowAddPattern] = useState(false);
  const [newPattern, setNewPattern] = useState({
    name: '',
    description: '',
    confidence: 0.7,
    frequency: 'daily'
  });

  // Initialize detection configuration
  useEffect(() => {
    if (organizationId) {
      const config = {
        monitoringTargets: {
          competitors: stakeholderStrategy?.stakeholders?.filter(s => s.type === 'competitor').map(s => s.name) || 
                      ['Primary competitors', 'Market leaders', 'Emerging players'],
          stakeholders: {
            regulators: ['SEC', 'FTC', 'Industry regulators'],
            investors: ['Institutional', 'Retail sentiment', 'Analyst coverage'],
            customers: ['Social mentions', 'Reviews', 'Support channels'],
            employees: ['Glassdoor', 'LinkedIn activity', 'Industry forums'],
            activists: ['NGOs', 'Advocacy groups', 'Social movements'],
            media: ['Industry press', 'Mainstream media', 'Social influencers']
          },
          topics: stakeholderStrategy?.stakeholders?.filter(s => s.type === 'topic').map(s => s.name) ||
                  ['Crisis events', 'Leadership changes', 'Product launches', 'Regulatory changes', 'Market shifts']
        },
        detectionPatterns: [
          { id: 1, name: 'Competitor Stumble', description: 'Detect when competitors face challenges', confidence: 0.85, frequency: 'daily', active: true },
          { id: 2, name: 'Narrative Vacuum', description: 'Identify gaps in public discourse', confidence: 0.75, frequency: 'daily', active: true },
          { id: 3, name: 'Cascade Event', description: 'Monitor for ripple effects from major events', confidence: 0.70, frequency: 'hourly', active: true },
          { id: 4, name: 'Stakeholder Shift', description: 'Track changes in stakeholder sentiment', confidence: 0.80, frequency: 'daily', active: true },
          { id: 5, name: 'Regulatory Window', description: 'Alert on regulatory opportunities', confidence: 0.90, frequency: 'weekly', active: true },
          ...customPatterns
        ]
      };
      setDetectionConfig(config);
    }
  }, [organizationId, stakeholderStrategy, customPatterns]);

  const togglePattern = (patternId) => {
    setDetectionConfig(prev => ({
      ...prev,
      detectionPatterns: prev.detectionPatterns.map(p => 
        p.id === patternId ? { ...p, active: !p.active } : p
      )
    }));
  };

  const addCustomPattern = () => {
    if (newPattern.name && newPattern.description) {
      const pattern = {
        id: `custom-${Date.now()}`,
        ...newPattern,
        active: true
      };
      setCustomPatterns([...customPatterns, pattern]);
      setNewPattern({ name: '', description: '', confidence: 0.7, frequency: 'daily' });
      setShowAddPattern(false);
    }
  };

  const MonitoringSection = ({ icon: Icon, title, items, color }) => (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Icon size={20} style={{ color }} />
        <h4 style={{ margin: 0, color: '#374151', fontSize: '1rem' }}>{title}</h4>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {items.map((item, idx) => (
          <span key={idx} style={{
            padding: '0.375rem 0.75rem',
            background: '#f3f4f6',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Check size={14} style={{ color: '#10b981' }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );

  const PatternCard = ({ pattern, onToggle }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      background: pattern.active ? 'white' : '#f9fafb',
      borderRadius: '0.5rem',
      border: `1px solid ${pattern.active ? '#e5e7eb' : '#f3f4f6'}`,
      transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '0.5rem',
          background: pattern.active 
            ? (pattern.confidence > 0.8 ? '#dcfce7' : '#fef3c7')
            : '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Lightbulb size={20} style={{ 
            color: pattern.active 
              ? (pattern.confidence > 0.8 ? '#16a34a' : '#f59e0b')
              : '#9ca3af'
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: '600', color: pattern.active ? '#111827' : '#6b7280' }}>
            {pattern.name}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            {pattern.description}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            Confidence: {Math.round(pattern.confidence * 100)}% • Checks: {pattern.frequency}
          </p>
        </div>
      </div>
      <button
        onClick={() => onToggle(pattern.id)}
        style={{
          padding: '0.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: pattern.active ? '#10b981' : '#9ca3af'
        }}
      >
        {pattern.active ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Section Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem',
        display: 'flex',
        gap: '2rem'
      }}>
        <button
          onClick={() => setActiveSection('setup')}
          style={{
            padding: '1rem 0',
            background: 'none',
            border: 'none',
            borderBottom: activeSection === 'setup' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeSection === 'setup' ? '#6366f1' : '#6b7280',
            fontWeight: activeSection === 'setup' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Organization Setup
        </button>
        <button
          onClick={() => setActiveSection('sources')}
          disabled={!organizationId}
          style={{
            padding: '1rem 0',
            background: 'none',
            border: 'none',
            borderBottom: activeSection === 'sources' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeSection === 'sources' ? '#6366f1' : '#6b7280',
            fontWeight: activeSection === 'sources' ? '600' : '400',
            cursor: organizationId ? 'pointer' : 'not-allowed',
            opacity: organizationId ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
        >
          Data Sources
        </button>
        <button
          onClick={() => setActiveSection('monitoring')}
          disabled={!organizationId}
          style={{
            padding: '1rem 0',
            background: 'none',
            border: 'none',
            borderBottom: activeSection === 'monitoring' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeSection === 'monitoring' ? '#6366f1' : '#6b7280',
            fontWeight: activeSection === 'monitoring' ? '600' : '400',
            cursor: organizationId ? 'pointer' : 'not-allowed',
            opacity: organizationId ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
        >
          Monitoring Targets
        </button>
        <button
          onClick={() => setActiveSection('patterns')}
          disabled={!organizationId}
          style={{
            padding: '1rem 0',
            background: 'none',
            border: 'none',
            borderBottom: activeSection === 'patterns' ? '2px solid #6366f1' : '2px solid transparent',
            color: activeSection === 'patterns' ? '#6366f1' : '#6b7280',
            fontWeight: activeSection === 'patterns' ? '600' : '400',
            cursor: organizationId ? 'pointer' : 'not-allowed',
            opacity: organizationId ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
        >
          Detection Patterns
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
        {/* Organization Setup Section */}
        {activeSection === 'setup' && (
          <AutomatedOrganizationSetup onSetupComplete={(data) => {
            onSetupComplete(data);
            // Switch to Data Sources tab after successful setup
            setTimeout(() => {
              setActiveSection('sources');
            }, 100);
          }} />
        )}
        
        {/* Data Sources Section */}
        {activeSection === 'sources' && organizationId && (
          <EnhancedSourceConfigurator 
            stakeholderStrategy={stakeholderStrategy}
            onSourcesUpdate={onSourcesUpdate}
          />
        )}

        {/* Monitoring Targets Section */}
        {activeSection === 'monitoring' && detectionConfig && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    background: '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Globe size={24} style={{ color: '#6366f1' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Data Sources</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: '700', color: '#111827' }}>
                      {(stakeholderStrategy?.sources?.rss?.length || 15) + 
                       (stakeholderStrategy?.sources?.apis?.length || 8) + 
                       (stakeholderStrategy?.sources?.websites?.length || 25)}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af' }}>RSS, APIs, Websites</p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    background: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={24} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Stakeholders</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: '700', color: '#111827' }}>
                      {Object.keys(detectionConfig.monitoringTargets.stakeholders).length}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af' }}>Groups monitored</p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Zap size={24} style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Active Patterns</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: '700', color: '#111827' }}>
                      {detectionConfig.detectionPatterns?.filter(p => p.active).length || 0}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af' }}>Detecting opportunities</p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '0.5rem',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity size={24} style={{ color: '#10b981', animation: 'pulse 2s infinite' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Scan Frequency</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: '700', color: '#111827' }}>
                      Real-time
                    </p>
                    <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af' }}>Continuous monitoring</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
                Automated Monitoring Configuration
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                These targets are automatically monitored based on your organization profile
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <MonitoringSection
                  icon={Building2}
                  title="Competitors"
                  items={detectionConfig.monitoringTargets.competitors}
                  color="#6366f1"
                />
                
                <MonitoringSection
                  icon={Users}
                  title="Key Stakeholders"
                  items={Object.keys(detectionConfig.monitoringTargets.stakeholders)}
                  color="#8b5cf6"
                />
                
                <MonitoringSection
                  icon={Target}
                  title="Signal Categories"
                  items={detectionConfig.monitoringTargets.topics}
                  color="#ec4899"
                />

                {/* Source Breakdown */}
                <div style={{
                  background: '#f9fafb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #f3f4f6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Globe size={20} style={{ color: '#059669' }} />
                    <h4 style={{ margin: 0, color: '#374151', fontSize: '1rem' }}>Source Breakdown</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>RSS Feeds</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {stakeholderStrategy?.sources?.rss?.length || 15}
                      </span>
                    </div>
                    <div style={{
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>APIs</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {stakeholderStrategy?.sources?.apis?.length || 8}
                      </span>
                    </div>
                    <div style={{
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Websites</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {stakeholderStrategy?.sources?.websites?.length || 25}
                      </span>
                    </div>
                    <div style={{
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Social</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {stakeholderStrategy?.sources?.social?.length || 12}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detection Patterns Section */}
        {activeSection === 'patterns' && detectionConfig && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#111827' }}>
                    Detection Patterns
                  </h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
                    Configure which opportunity patterns to monitor
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPattern(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Plus size={16} />
                  Add Custom Pattern
                </button>
              </div>
              
              {/* Add Pattern Form */}
              {showAddPattern && (
                <div style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 150px 150px auto', gap: '1rem', alignItems: 'end' }}>
                    <input
                      type="text"
                      placeholder="Pattern name"
                      value={newPattern.name}
                      onChange={(e) => setNewPattern({ ...newPattern, name: e.target.value })}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newPattern.description}
                      onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    <select
                      value={newPattern.confidence}
                      onChange={(e) => setNewPattern({ ...newPattern, confidence: parseFloat(e.target.value) })}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="0.5">50% confidence</option>
                      <option value="0.6">60% confidence</option>
                      <option value="0.7">70% confidence</option>
                      <option value="0.8">80% confidence</option>
                      <option value="0.9">90% confidence</option>
                    </select>
                    <select
                      value={newPattern.frequency}
                      onChange={(e) => setNewPattern({ ...newPattern, frequency: e.target.value })}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={addCustomPattern}
                        style={{
                          padding: '0.5rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setShowAddPattern(false)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Pattern List */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {detectionConfig.detectionPatterns.map((pattern) => (
                  <PatternCard 
                    key={pattern.id} 
                    pattern={pattern}
                    onToggle={togglePattern}
                  />
                ))}
              </div>
              
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#fef3c7',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                  Active patterns continuously scan your configured data sources for opportunity signals. 
                  Higher confidence patterns have stricter matching criteria.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceConfiguration;