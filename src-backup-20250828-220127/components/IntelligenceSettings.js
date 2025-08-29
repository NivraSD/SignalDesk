import React, { useState, useEffect } from 'react';
import './IntelligenceSettings.css';

const IntelligenceSettings = ({ onClose, onSave }) => {
  const [settings, setSettings] = useState({
    competitors: [],
    topics: [],
    keywords: [],
    goals: {},
    alertFrequency: 'realtime',
    monitoringDepth: 'comprehensive'
  });

  const [activeTab, setActiveTab] = useState('competitors');

  useEffect(() => {
    // Load current settings from localStorage
    const savedOnboarding = localStorage.getItem('signaldesk_onboarding');
    if (savedOnboarding) {
      const config = JSON.parse(savedOnboarding);
      setSettings({
        competitors: config.targets?.competitors || [],
        topics: config.intelligence?.topics || config.monitoring?.topics || [],
        keywords: config.intelligence?.keywords || config.monitoring?.keywords || [],
        goals: config.goals || {},
        alertFrequency: config.intelligence?.alertFrequency || 'realtime',
        monitoringDepth: config.intelligence?.monitoringDepth || 'comprehensive'
      });
    }
  }, []);

  const handleSave = () => {
    // Update the onboarding config with new settings
    const savedOnboarding = localStorage.getItem('signaldesk_onboarding');
    const config = savedOnboarding ? JSON.parse(savedOnboarding) : {};
    
    const updatedConfig = {
      ...config,
      targets: {
        ...config.targets,
        competitors: settings.competitors
      },
      intelligence: {
        ...config.intelligence,
        topics: settings.topics,
        keywords: settings.keywords,
        alertFrequency: settings.alertFrequency,
        monitoringDepth: settings.monitoringDepth
      },
      monitoring: {
        ...config.monitoring,
        topics: settings.topics,
        keywords: settings.keywords
      },
      goals: settings.goals
    };
    
    localStorage.setItem('signaldesk_onboarding', JSON.stringify(updatedConfig));
    
    if (onSave) {
      onSave(updatedConfig);
    }
    
    // Refresh the page to reload with new settings
    window.location.reload();
  };

  const tabs = [
    { id: 'competitors', label: 'Competitors', icon: '⚔️' },
    { id: 'topics', label: 'Topics', icon: '📍' },
    { id: 'goals', label: 'PR Goals', icon: '🎯' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' }
  ];

  const prGoals = [
    { id: 'thought_leadership', name: 'Thought Leadership', desc: 'Position as industry expert' },
    { id: 'crisis_prevention', name: 'Crisis Prevention', desc: 'Early warning system' },
    { id: 'media_coverage', name: 'Media Coverage', desc: 'Maximize press mentions' },
    { id: 'investor_relations', name: 'Investor Relations', desc: 'Manage investor sentiment' },
    { id: 'product_launches', name: 'Product Launches', desc: 'Amplify announcements' },
    { id: 'competitive_positioning', name: 'Competitive Edge', desc: 'Win the narrative' },
    { id: 'reputation_management', name: 'Reputation', desc: 'Protect brand image' },
    { id: 'partnerships', name: 'Partnerships', desc: 'Collaboration opportunities' }
  ];

  const toggleGoal = (goalId) => {
    setSettings(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        [goalId]: !prev.goals[goalId]
      }
    }));
  };

  const renderCompetitors = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <label>Competitors to Monitor</label>
        <p className="field-hint">We automatically discover competitors based on your organization, but you can add more here.</p>
        <textarea
          placeholder="Enter competitor names (one per line)
Example:
OpenAI
Anthropic
Google DeepMind
Cohere"
          value={settings.competitors.join('\n')}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            competitors: e.target.value.split('\n').filter(c => c.trim())
          }))}
          className="settings-textarea"
          rows="8"
        />
      </div>
      
      <div className="settings-info">
        <span className="info-icon">💡</span>
        <p>The system automatically tracks major competitors in your industry. Add specific competitors here that might not be automatically detected.</p>
      </div>
    </div>
  );

  const renderTopics = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <label>Topics to Monitor</label>
        <p className="field-hint">What events and topics should we track for PR opportunities?</p>
        <textarea
          placeholder="Enter topics to monitor (one per line)
Example:
AI regulation changes
Data privacy laws
Industry consolidation
Funding announcements
Executive changes"
          value={settings.topics.join('\n')}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            topics: e.target.value.split('\n').filter(t => t.trim())
          }))}
          className="settings-textarea"
          rows="6"
        />
      </div>

      <div className="settings-section">
        <label>Keywords</label>
        <p className="field-hint">Specific terms to always track</p>
        <input
          type="text"
          placeholder="e.g., your product names, campaign hashtags, technology terms"
          value={settings.keywords.join(', ')}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
          }))}
          className="settings-input"
        />
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <label>Active PR Goals</label>
        <p className="field-hint">Select goals to focus intelligence analysis</p>
        <div className="goals-grid">
          {prGoals.map(goal => (
            <div
              key={goal.id}
              className={`goal-item ${settings.goals[goal.id] ? 'active' : ''}`}
              onClick={() => toggleGoal(goal.id)}
            >
              <div className="goal-header">
                <h4>{goal.name}</h4>
                <div className={`goal-toggle ${settings.goals[goal.id] ? 'on' : ''}`}>
                  {settings.goals[goal.id] ? '✓' : ''}
                </div>
              </div>
              <p>{goal.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <label>Alert Frequency</label>
        <select
          value={settings.alertFrequency}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            alertFrequency: e.target.value
          }))}
          className="settings-select"
        >
          <option value="realtime">Real-time (As it happens)</option>
          <option value="hourly">Hourly Digest</option>
          <option value="daily">Daily Summary</option>
          <option value="weekly">Weekly Report</option>
        </select>
      </div>

      <div className="settings-section">
        <label>Monitoring Depth</label>
        <div className="radio-options">
          {[
            { value: 'basic', label: 'Basic', desc: 'Key metrics only' },
            { value: 'standard', label: 'Standard', desc: 'Regular monitoring' },
            { value: 'comprehensive', label: 'Comprehensive', desc: 'Deep analysis' },
            { value: 'enterprise', label: 'Enterprise', desc: 'Full spectrum' }
          ].map(option => (
            <label key={option.value} className="radio-option">
              <input
                type="radio"
                name="monitoringDepth"
                value={option.value}
                checked={settings.monitoringDepth === option.value}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  monitoringDepth: e.target.value
                }))}
              />
              <div className="radio-content">
                <span className="radio-label">{option.label}</span>
                <span className="radio-desc">{option.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'competitors': return renderCompetitors();
      case 'topics': return renderTopics();
      case 'goals': return renderGoals();
      case 'alerts': return renderAlerts();
      default: return renderCompetitors();
    }
  };

  return (
    <div className="intel-settings-overlay">
      <div className="intel-settings-modal">
        <div className="intel-settings-header">
          <h2>Intelligence Configuration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="intel-settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="intel-settings-content">
          {renderContent()}
        </div>

        <div className="intel-settings-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceSettings;