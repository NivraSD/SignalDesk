import React, { useState, useEffect } from 'react';
import opportunityEngineService from '../services/opportunityEngineService';
import './OpportunityEngineV2.css';

const OpportunityEngineV2 = ({ organization, intelligence, pipelineResults }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [enhancedOpportunities, setEnhancedOpportunities] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [executionPackage, setExecutionPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [activeTab, setActiveTab] = useState('opportunities');

  useEffect(() => {
    // Use pipeline results if available, otherwise fall back to intelligence prop
    if (pipelineResults) {
      loadOpportunitiesFromPipeline();
    } else if (intelligence) {
      // Fallback to old method if no pipeline results
      detectOpportunities();
    }
  }, [pipelineResults, intelligence]);

  const loadOpportunitiesFromPipeline = async () => {
    setLoading(true);
    try {
      // Extract opportunities from pipeline results
      const extractedOpps = opportunityEngineService.extractOpportunitiesFromPipeline(pipelineResults);
      
      // Set initial opportunities from pipeline (fast)
      setOpportunities(extractedOpps.consolidated);
      setLoading(false);
      
      // Async enhance opportunities with Claude (slow but comprehensive)
      setEnhancing(true);
      const enhanced = await opportunityEngineService.enhanceOpportunities(
        extractedOpps,
        organization,
        pipelineResults?.stages?.synthesis?.data
      );
      
      if (enhanced) {
        setEnhancedOpportunities(enhanced);
        // Merge enhanced opportunities into display
        mergeEnhancedOpportunities(extractedOpps.consolidated, enhanced);
      }
      setEnhancing(false);
      
    } catch (error) {
      console.error('Error loading opportunities from pipeline:', error);
      setLoading(false);
      setEnhancing(false);
    }
  };

  const mergeEnhancedOpportunities = (basic, enhanced) => {
    // Combine basic and enhanced opportunities intelligently
    const merged = [];
    
    // Add immediate opportunities from enhanced
    if (enhanced.immediate_opportunities) {
      enhanced.immediate_opportunities.forEach(opp => {
        merged.push({
          ...opp,
          enhanced: true,
          category: 'immediate'
        });
      });
    }
    
    // Add cascade opportunities
    if (enhanced.cascade_opportunities) {
      enhanced.cascade_opportunities.forEach(opp => {
        merged.push({
          opportunity: opp.trigger_event,
          type: 'cascade_effect',
          urgency: 'HIGH',
          confidence: opp.confidence,
          enhanced: true,
          category: 'cascade',
          details: opp
        });
      });
    }
    
    // Add narrative vacuums
    if (enhanced.narrative_vacuums) {
      enhanced.narrative_vacuums.forEach(opp => {
        merged.push({
          opportunity: `Narrative Vacuum: ${opp.topic}`,
          type: 'narrative_vacuum',
          urgency: 'MEDIUM',
          confidence: 80,
          enhanced: true,
          category: 'narrative',
          details: opp
        });
      });
    }
    
    // Include original opportunities not covered by enhanced
    basic.forEach(opp => {
      if (!merged.some(m => m.opportunity === opp.opportunity)) {
        merged.push({
          ...opp,
          enhanced: false,
          category: 'basic'
        });
      }
    });
    
    setOpportunities(merged);
  };

  // Fallback method for old intelligence prop
  const detectOpportunities = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/opportunity-detector-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ intelligence, organization })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setOpportunities(data.opportunities);
      }
    } catch (error) {
      console.error('Error detecting opportunities:', error);
    }
    setLoading(false);
  };

  const loadExecutionPackage = async (opportunity) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/opportunity-executor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ opportunity, organization })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setExecutionPackage(data.execution_package);
        setSelectedOpportunity(opportunity);
        setActiveTab('execution');
      }
    } catch (error) {
      console.error('Error loading execution package:', error);
    }
    setLoading(false);
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      URGENT: '#ff0000',
      HIGH: '#ff6600',
      MEDIUM: '#ffcc00',
      STRATEGIC: '#00ccff'
    };
    return colors[urgency] || '#666';
  };

  const getConfidenceBar = (confidence) => {
    return (
      <div className="confidence-bar">
        <div 
          className="confidence-fill" 
          style={{ width: `${confidence}%`, backgroundColor: confidence > 80 ? '#00ff00' : '#ffcc00' }}
        />
        <span className="confidence-text">{confidence}%</span>
      </div>
    );
  };

  const renderOpportunityCard = (opp, index) => (
    <div 
      key={index} 
      className={`opportunity-card ${opp.enhanced ? 'enhanced' : ''}`}
      onClick={() => loadExecutionPackage(opp)}
      style={{ borderLeft: `4px solid ${getUrgencyColor(opp.urgency)}` }}
    >
      <div className="opp-header">
        <span className="opp-urgency" style={{ color: getUrgencyColor(opp.urgency) }}>
          {opp.urgency}
        </span>
        {opp.enhanced && <span className="enhanced-badge">✨ Enhanced</span>}
        <span className="opp-window">{opp.window}</span>
      </div>
      
      <h3 className="opp-title">{opp.title}</h3>
      <p className="opp-description">{opp.description}</p>
      
      <div className="opp-metrics">
        <div className="metric">
          <span className="metric-label">Confidence</span>
          {getConfidenceBar(opp.confidence)}
        </div>
        <div className="metric">
          <span className="metric-label">Actions Ready</span>
          <span className="metric-value">{opp.actions?.length || 0}</span>
        </div>
      </div>
      
      <div className="opp-actions">
        {opp.actions?.slice(0, 3).map((action, idx) => (
          <span key={idx} className="action-tag">{action.action}</span>
        ))}
      </div>
      
      <button className="execute-btn">
        Prepare Execution →
      </button>
    </div>
  );

  const renderExecutionPackage = () => {
    if (!executionPackage) return null;
    
    return (
      <div className="execution-package">
        <div className="package-header">
          <button onClick={() => setActiveTab('opportunities')} className="back-btn">
            ← Back to Opportunities
          </button>
          <h2>{selectedOpportunity?.title}</h2>
          <span className="urgency-badge" style={{ backgroundColor: getUrgencyColor(selectedOpportunity?.urgency) }}>
            {selectedOpportunity?.urgency} - {selectedOpportunity?.window}
          </span>
        </div>
        
        <div className="execution-tabs">
          <button 
            className={activeTab === 'media' ? 'active' : ''} 
            onClick={() => setActiveTab('media')}
          >
            Media Strategy
          </button>
          <button 
            className={activeTab === 'content' ? 'active' : ''} 
            onClick={() => setActiveTab('content')}
          >
            Content Package
          </button>
          <button 
            className={activeTab === 'talking' ? 'active' : ''} 
            onClick={() => setActiveTab('talking')}
          >
            Talking Points
          </button>
          <button 
            className={activeTab === 'timeline' ? 'active' : ''} 
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </div>
        
        <div className="execution-content">
          {activeTab === 'media' && renderMediaStrategy()}
          {activeTab === 'content' && renderContentPackage()}
          {activeTab === 'talking' && renderTalkingPoints()}
          {activeTab === 'timeline' && renderTimeline()}
        </div>
        
        <div className="execution-actions">
          <button className="approve-btn">Approve & Execute</button>
          <button className="customize-btn">Customize</button>
          <button className="schedule-btn">Schedule</button>
        </div>
      </div>
    );
  };

  const renderMediaStrategy = () => (
    <div className="media-strategy">
      <h3>Primary Media Targets</h3>
      {executionPackage?.media_strategy?.primary_targets?.map((target, idx) => (
        <div key={idx} className="media-target">
          <h4>{target.tier}</h4>
          <div className="outlets">
            {target.outlets?.map((outlet, i) => (
              <span key={i} className="outlet-badge">{outlet}</span>
            ))}
          </div>
          <p className="angle">Angle: {target.angle}</p>
          <p className="timing">Timing: {target.timing}</p>
        </div>
      ))}
      
      <h3>Journalist Matches</h3>
      <div className="journalist-list">
        {executionPackage?.media_strategy?.journalist_matches?.map((journalist, idx) => (
          <div key={idx} className="journalist-card">
            <div className="journalist-info">
              <strong>{journalist.name}</strong> - {journalist.outlet}
              <p className="beat">Beat: {journalist.beat}</p>
              <p className="recent">Recent: {journalist.recent_relevant}</p>
            </div>
            <div className="relationship-status">
              {journalist.relationship}
            </div>
            <button className="pitch-btn">Send Pitch</button>
          </div>
        ))}
      </div>
      
      <h3>Pitch Angles</h3>
      {executionPackage?.media_strategy?.pitch_angles?.map((pitch, idx) => (
        <div key={idx} className="pitch-angle">
          <h4>{pitch.headline}</h4>
          <p>{pitch.hook}</p>
        </div>
      ))}
    </div>
  );

  const renderContentPackage = () => (
    <div className="content-package">
      <div className="content-section">
        <h3>Press Release</h3>
        <div className="content-preview">
          <pre>{executionPackage?.content_package?.press_release}</pre>
        </div>
        <div className="content-actions">
          <button>Copy</button>
          <button>Edit</button>
          <button>Download</button>
        </div>
      </div>
      
      <div className="content-section">
        <h3>Executive Statement</h3>
        <div className="content-preview">
          <p>{executionPackage?.content_package?.executive_statement}</p>
        </div>
      </div>
      
      <div className="content-section">
        <h3>Social Media</h3>
        <div className="social-previews">
          <div className="social-platform">
            <h4>Twitter Thread</h4>
            {executionPackage?.content_package?.social_media?.twitter_thread?.map((tweet, idx) => (
              <div key={idx} className="tweet-preview">
                {idx + 1}. {tweet}
              </div>
            ))}
          </div>
          
          <div className="social-platform">
            <h4>LinkedIn Post</h4>
            <pre>{executionPackage?.content_package?.social_media?.linkedin_post}</pre>
          </div>
        </div>
      </div>
      
      <div className="content-section">
        <h3>Email Templates</h3>
        <div className="email-templates">
          {Object.entries(executionPackage?.content_package?.email_templates || {}).map(([type, template]) => (
            <div key={type} className="email-template">
              <h4>{type.replace(/_/g, ' ').toUpperCase()}</h4>
              <p><strong>Subject:</strong> {template.subject}</p>
              <pre>{template.body}</pre>
              <button>Use Template</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTalkingPoints = () => (
    <div className="talking-points">
      <div className="points-section">
        <h3>Key Messages</h3>
        <ul>
          {executionPackage?.talking_points?.key_messages?.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      </div>
      
      <div className="points-section">
        <h3>Proof Points</h3>
        <ul>
          {executionPackage?.talking_points?.proof_points?.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      </div>
      
      <div className="points-section">
        <h3>Difficult Questions & Responses</h3>
        {executionPackage?.talking_points?.difficult_questions?.map((qa, idx) => (
          <div key={idx} className="qa-pair">
            <p className="question">Q: {qa.question}</p>
            <p className="answer">A: {qa.response}</p>
          </div>
        ))}
      </div>
      
      <div className="points-section">
        <h3>Bridging Phrases</h3>
        <div className="bridging-phrases">
          {executionPackage?.talking_points?.bridging_phrases?.map((phrase, idx) => (
            <span key={idx} className="phrase-tag">{phrase}</span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="execution-timeline">
      <h3>Execution Timeline</h3>
      <div className="timeline">
        {Object.entries(executionPackage?.execution_timeline || {}).map(([time, action], idx) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <span className="timeline-time">{time}</span>
              <span className="timeline-action">{action}</span>
            </div>
          </div>
        ))}
      </div>
      
      <h3>Success Metrics</h3>
      <div className="metrics-grid">
        {Object.entries(executionPackage?.success_metrics || {}).map(([period, metrics]) => (
          <div key={period} className="metric-period">
            <h4>{period.replace(/_/g, ' ').toUpperCase()}</h4>
            <ul>
              {metrics.map((metric, idx) => (
                <li key={idx}>{metric}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <h3>Risk Mitigation</h3>
      <div className="risks">
        {executionPackage?.risk_mitigation?.risks?.map((risk, idx) => (
          <div key={idx} className="risk-item">
            <div className="risk-header">
              <span className="risk-name">{risk.risk}</span>
              <span className="risk-likelihood">{risk.likelihood}</span>
            </div>
            <p className="risk-mitigation">{risk.mitigation}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="opportunity-engine-v2">
      <div className="engine-header">
        <h1>Opportunity Engine</h1>
        {enhancing && (
          <div className="enhancing-indicator">
            🔄 Enhancing opportunities with AI...
          </div>
        )}
        <div className="engine-stats">
          <span className="stat">
            <strong>{opportunities.filter(o => o.urgency === 'URGENT').length}</strong> Urgent
          </span>
          <span className="stat">
            <strong>{opportunities.filter(o => o.confidence > 80).length}</strong> High Confidence
          </span>
          <span className="stat">
            <strong>{opportunities.length}</strong> Total
          </span>
        </div>
      </div>
      
      {activeTab === 'opportunities' && (
        <div className="opportunities-grid">
          {loading ? (
            <div className="loading">Detecting opportunities...</div>
          ) : opportunities.length > 0 ? (
            opportunities.map((opp, idx) => renderOpportunityCard(opp, idx))
          ) : (
            <div className="no-opportunities">
              No immediate opportunities detected. Keep monitoring...
            </div>
          )}
        </div>
      )}
      
      {(activeTab !== 'opportunities' || selectedOpportunity) && renderExecutionPackage()}
    </div>
  );
};

export default OpportunityEngineV2;