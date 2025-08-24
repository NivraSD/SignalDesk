import React, { useState } from 'react';
import './OpportunityOnboarding.css';

const OpportunityOnboarding = ({ organization, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState({
    // Brand & Voice
    brand_voice: 'professional',
    risk_tolerance: 'moderate',
    response_speed: 'considered',
    
    // Key Messages
    core_value_props: [],
    proof_points: [],
    competitive_advantages: [],
    
    // Media Preferences
    preferred_media_tiers: [],
    journalist_relationships: [],
    no_comment_topics: [],
    
    // Spokespeople
    spokespeople: [],
    
    // Opportunity Preferences
    opportunity_types: {
      competitor_weakness: true,
      narrative_vacuum: true,
      cascade_effect: true,
      crisis_prevention: true,
      alliance_opening: false
    },
    minimum_confidence: 70,
    auto_execute_threshold: 95,
    
    // Competitors
    competitors: []
  });

  const steps = [
    { id: 1, title: 'Brand Voice', icon: '🎯' },
    { id: 2, title: 'Key Messages', icon: '💬' },
    { id: 3, title: 'Media Strategy', icon: '📰' },
    { id: 4, title: 'Spokespeople', icon: '🎤' },
    { id: 5, title: 'Opportunity Types', icon: '💎' },
    { id: 6, title: 'Competitive Intel', icon: '⚔️' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      saveProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProfile = async () => {
    try {
      // Save to Supabase
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/organization_opportunity_profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            organization_id: organization.id,
            ...profile
          })
        }
      );

      if (response.ok) {
        localStorage.setItem('opportunity_profile', JSON.stringify(profile));
        onComplete(profile);
      }
    } catch (error) {
      console.error('Error saving opportunity profile:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderBrandVoice();
      case 2:
        return renderKeyMessages();
      case 3:
        return renderMediaStrategy();
      case 4:
        return renderSpokespeople();
      case 5:
        return renderOpportunityTypes();
      case 6:
        return renderCompetitiveIntel();
      default:
        return null;
    }
  };

  const renderBrandVoice = () => (
    <div className="onboarding-step">
      <h2>How does {organization.name} communicate?</h2>
      
      <div className="form-group">
        <label>Brand Voice</label>
        <div className="option-grid">
          {['Professional', 'Conversational', 'Bold', 'Technical', 'Approachable'].map(voice => (
            <button
              key={voice}
              className={`option-btn ${profile.brand_voice === voice.toLowerCase() ? 'selected' : ''}`}
              onClick={() => setProfile({...profile, brand_voice: voice.toLowerCase()})}
            >
              {voice}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Risk Tolerance</label>
        <div className="option-grid">
          {[
            { value: 'conservative', label: 'Conservative', desc: 'Careful, measured responses' },
            { value: 'moderate', label: 'Moderate', desc: 'Balanced approach' },
            { value: 'aggressive', label: 'Aggressive', desc: 'First-mover, bold statements' }
          ].map(option => (
            <button
              key={option.value}
              className={`option-card ${profile.risk_tolerance === option.value ? 'selected' : ''}`}
              onClick={() => setProfile({...profile, risk_tolerance: option.value})}
            >
              <strong>{option.label}</strong>
              <span>{option.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Response Speed</label>
        <div className="option-grid">
          {[
            { value: 'immediate', label: 'Immediate', desc: 'First to respond, always' },
            { value: 'considered', label: 'Considered', desc: 'Thoughtful, verified responses' },
            { value: 'strategic', label: 'Strategic', desc: 'Wait for the right moment' }
          ].map(option => (
            <button
              key={option.value}
              className={`option-card ${profile.response_speed === option.value ? 'selected' : ''}`}
              onClick={() => setProfile({...profile, response_speed: option.value})}
            >
              <strong>{option.label}</strong>
              <span>{option.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKeyMessages = () => (
    <div className="onboarding-step">
      <h2>What are {organization.name}'s key messages?</h2>
      
      <div className="form-group">
        <label>Core Value Propositions</label>
        <p className="helper-text">What makes you fundamentally different?</p>
        <div className="input-list">
          {profile.core_value_props.map((prop, idx) => (
            <div key={idx} className="input-item">
              <input
                type="text"
                value={prop}
                onChange={(e) => {
                  const newProps = [...profile.core_value_props];
                  newProps[idx] = e.target.value;
                  setProfile({...profile, core_value_props: newProps});
                }}
                placeholder="e.g., 'Fastest time to market in the industry'"
              />
              <button onClick={() => {
                const newProps = profile.core_value_props.filter((_, i) => i !== idx);
                setProfile({...profile, core_value_props: newProps});
              }}>×</button>
            </div>
          ))}
          <button 
            className="add-btn"
            onClick={() => setProfile({...profile, core_value_props: [...profile.core_value_props, '']})}
          >
            + Add Value Proposition
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Proof Points</label>
        <p className="helper-text">Data, achievements, or credentials that back up your claims</p>
        <div className="input-list">
          {profile.proof_points.map((point, idx) => (
            <div key={idx} className="input-item">
              <input
                type="text"
                value={point}
                onChange={(e) => {
                  const newPoints = [...profile.proof_points];
                  newPoints[idx] = e.target.value;
                  setProfile({...profile, proof_points: newPoints});
                }}
                placeholder="e.g., '#1 market share for 5 years'"
              />
              <button onClick={() => {
                const newPoints = profile.proof_points.filter((_, i) => i !== idx);
                setProfile({...profile, proof_points: newPoints});
              }}>×</button>
            </div>
          ))}
          <button 
            className="add-btn"
            onClick={() => setProfile({...profile, proof_points: [...profile.proof_points, '']})}
          >
            + Add Proof Point
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Competitive Advantages</label>
        <p className="helper-text">What do you do better than anyone else?</p>
        <div className="input-list">
          {profile.competitive_advantages.map((advantage, idx) => (
            <div key={idx} className="input-item">
              <input
                type="text"
                value={advantage}
                onChange={(e) => {
                  const newAdvantages = [...profile.competitive_advantages];
                  newAdvantages[idx] = e.target.value;
                  setProfile({...profile, competitive_advantages: newAdvantages});
                }}
                placeholder="e.g., 'Proprietary technology with 50 patents'"
              />
              <button onClick={() => {
                const newAdvantages = profile.competitive_advantages.filter((_, i) => i !== idx);
                setProfile({...profile, competitive_advantages: newAdvantages});
              }}>×</button>
            </div>
          ))}
          <button 
            className="add-btn"
            onClick={() => setProfile({...profile, competitive_advantages: [...profile.competitive_advantages, '']})}
          >
            + Add Advantage
          </button>
        </div>
      </div>
    </div>
  );

  const renderMediaStrategy = () => (
    <div className="onboarding-step">
      <h2>Media Preferences</h2>
      
      <div className="form-group">
        <label>Preferred Media Tiers</label>
        <p className="helper-text">Which types of media should we prioritize?</p>
        <div className="checkbox-grid">
          {[
            { id: 'tier1_business', label: 'Tier 1 Business', desc: 'WSJ, Bloomberg, FT' },
            { id: 'tier1_tech', label: 'Tier 1 Tech', desc: 'TechCrunch, Verge, Wired' },
            { id: 'tier1_general', label: 'Tier 1 General', desc: 'NYT, WaPo, CNN' },
            { id: 'trade', label: 'Trade Publications', desc: 'Industry-specific media' },
            { id: 'regional', label: 'Regional Media', desc: 'Local newspapers, TV' },
            { id: 'digital', label: 'Digital Native', desc: 'Axios, Vox, Insider' }
          ].map(tier => (
            <label key={tier.id} className="checkbox-card">
              <input
                type="checkbox"
                checked={profile.preferred_media_tiers.includes(tier.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setProfile({...profile, preferred_media_tiers: [...profile.preferred_media_tiers, tier.id]});
                  } else {
                    setProfile({...profile, preferred_media_tiers: profile.preferred_media_tiers.filter(t => t !== tier.id)});
                  }
                }}
              />
              <div>
                <strong>{tier.label}</strong>
                <span>{tier.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Topics to Avoid</label>
        <p className="helper-text">What topics should we never comment on?</p>
        <div className="input-list">
          {profile.no_comment_topics.map((topic, idx) => (
            <div key={idx} className="input-item">
              <input
                type="text"
                value={topic}
                onChange={(e) => {
                  const newTopics = [...profile.no_comment_topics];
                  newTopics[idx] = e.target.value;
                  setProfile({...profile, no_comment_topics: newTopics});
                }}
                placeholder="e.g., 'Ongoing litigation'"
              />
              <button onClick={() => {
                const newTopics = profile.no_comment_topics.filter((_, i) => i !== idx);
                setProfile({...profile, no_comment_topics: newTopics});
              }}>×</button>
            </div>
          ))}
          <button 
            className="add-btn"
            onClick={() => setProfile({...profile, no_comment_topics: [...profile.no_comment_topics, '']})}
          >
            + Add Topic to Avoid
          </button>
        </div>
      </div>
    </div>
  );

  const renderSpokespeople = () => (
    <div className="onboarding-step">
      <h2>Who speaks for {organization.name}?</h2>
      
      <div className="spokespeople-list">
        {profile.spokespeople.map((person, idx) => (
          <div key={idx} className="spokesperson-card">
            <input
              type="text"
              placeholder="Name"
              value={person.name}
              onChange={(e) => {
                const newPeople = [...profile.spokespeople];
                newPeople[idx] = {...person, name: e.target.value};
                setProfile({...profile, spokespeople: newPeople});
              }}
            />
            <input
              type="text"
              placeholder="Title"
              value={person.title}
              onChange={(e) => {
                const newPeople = [...profile.spokespeople];
                newPeople[idx] = {...person, title: e.target.value};
                setProfile({...profile, spokespeople: newPeople});
              }}
            />
            <input
              type="text"
              placeholder="Expertise areas"
              value={person.expertise}
              onChange={(e) => {
                const newPeople = [...profile.spokespeople];
                newPeople[idx] = {...person, expertise: e.target.value};
                setProfile({...profile, spokespeople: newPeople});
              }}
            />
            <select
              value={person.availability}
              onChange={(e) => {
                const newPeople = [...profile.spokespeople];
                newPeople[idx] = {...person, availability: e.target.value};
                setProfile({...profile, spokespeople: newPeople});
              }}
            >
              <option value="always">Always Available</option>
              <option value="approval">Needs Approval</option>
              <option value="emergency">Emergency Only</option>
            </select>
            <button onClick={() => {
              const newPeople = profile.spokespeople.filter((_, i) => i !== idx);
              setProfile({...profile, spokespeople: newPeople});
            }}>Remove</button>
          </div>
        ))}
        <button 
          className="add-btn"
          onClick={() => setProfile({...profile, spokespeople: [...profile.spokespeople, {
            name: '', title: '', expertise: '', availability: 'approval'
          }]})}
        >
          + Add Spokesperson
        </button>
      </div>
    </div>
  );

  const renderOpportunityTypes = () => (
    <div className="onboarding-step">
      <h2>What opportunities should we pursue?</h2>
      
      <div className="form-group">
        <label>Opportunity Types</label>
        <div className="opportunity-type-grid">
          {[
            { 
              id: 'competitor_weakness', 
              label: 'Competitor Weakness', 
              desc: 'Capitalize when competitors stumble',
              icon: '🎯'
            },
            { 
              id: 'narrative_vacuum', 
              label: 'Narrative Vacuum', 
              desc: 'Own unclaimed stories',
              icon: '📢'
            },
            { 
              id: 'cascade_effect', 
              label: 'Cascade Prediction', 
              desc: 'Get ahead of spreading trends',
              icon: '🌊'
            },
            { 
              id: 'crisis_prevention', 
              label: 'Crisis Prevention', 
              desc: 'Proactive risk mitigation',
              icon: '🛡️'
            },
            { 
              id: 'alliance_opening', 
              label: 'Partnership Opportunities', 
              desc: 'Strategic collaborations',
              icon: '🤝'
            }
          ].map(type => (
            <label key={type.id} className="opportunity-type-card">
              <input
                type="checkbox"
                checked={profile.opportunity_types[type.id]}
                onChange={(e) => {
                  setProfile({
                    ...profile, 
                    opportunity_types: {
                      ...profile.opportunity_types,
                      [type.id]: e.target.checked
                    }
                  });
                }}
              />
              <div className="type-content">
                <span className="type-icon">{type.icon}</span>
                <strong>{type.label}</strong>
                <span>{type.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Confidence Thresholds</label>
        <div className="threshold-settings">
          <div className="threshold-item">
            <label>Minimum confidence to show opportunity</label>
            <input
              type="range"
              min="50"
              max="100"
              value={profile.minimum_confidence}
              onChange={(e) => setProfile({...profile, minimum_confidence: parseInt(e.target.value)})}
            />
            <span>{profile.minimum_confidence}%</span>
          </div>
          
          <div className="threshold-item">
            <label>Auto-execute above confidence</label>
            <input
              type="range"
              min="80"
              max="100"
              value={profile.auto_execute_threshold}
              onChange={(e) => setProfile({...profile, auto_execute_threshold: parseInt(e.target.value)})}
            />
            <span>{profile.auto_execute_threshold}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompetitiveIntel = () => (
    <div className="onboarding-step">
      <h2>Know your competition</h2>
      
      <div className="competitors-list">
        {profile.competitors.map((competitor, idx) => (
          <div key={idx} className="competitor-card">
            <input
              type="text"
              placeholder="Competitor name"
              value={competitor.name}
              onChange={(e) => {
                const newCompetitors = [...profile.competitors];
                newCompetitors[idx] = {...competitor, name: e.target.value};
                setProfile({...profile, competitors: newCompetitors});
              }}
            />
            <textarea
              placeholder="Our advantages over them"
              value={competitor.our_advantages}
              onChange={(e) => {
                const newCompetitors = [...profile.competitors];
                newCompetitors[idx] = {...competitor, our_advantages: e.target.value};
                setProfile({...profile, competitors: newCompetitors});
              }}
            />
            <textarea
              placeholder="Their advantages over us"
              value={competitor.their_advantages}
              onChange={(e) => {
                const newCompetitors = [...profile.competitors];
                newCompetitors[idx] = {...competitor, their_advantages: e.target.value};
                setProfile({...profile, competitors: newCompetitors});
              }}
            />
            <button onClick={() => {
              const newCompetitors = profile.competitors.filter((_, i) => i !== idx);
              setProfile({...profile, competitors: newCompetitors});
            }}>Remove</button>
          </div>
        ))}
        <button 
          className="add-btn"
          onClick={() => setProfile({...profile, competitors: [...profile.competitors, {
            name: '', our_advantages: '', their_advantages: ''
          }]})}
        >
          + Add Competitor
        </button>
      </div>
    </div>
  );

  return (
    <div className="opportunity-onboarding">
      <div className="onboarding-header">
        <h1>Configure Opportunity Engine</h1>
        <p>Tell us how {organization.name} wants to capture opportunities</p>
      </div>

      <div className="progress-bar">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
          >
            <span className="step-icon">{step.icon}</span>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>

      <div className="onboarding-content">
        {renderStep()}
      </div>

      <div className="onboarding-actions">
        <button 
          className="back-btn" 
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </button>
        <button 
          className="next-btn" 
          onClick={handleNext}
        >
          {currentStep === steps.length ? 'Complete Setup' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default OpportunityOnboarding;