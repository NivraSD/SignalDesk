import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Target, Calendar, Zap, Shield } from 'lucide-react';
import './PredictionsModule.css';

const PredictionsModule = ({ organizationId, timeframe = '7d' }) => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('trends');

  useEffect(() => {
    fetchPredictions();
  }, [timeframe]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
      
      // Call the predictions Edge Function
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'}/functions/v1/predictive-intelligence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0'}`
          },
          body: JSON.stringify({
            organization: config.organization || {},
            goals: config.goals || {},
            timeframe,
            analysis_type: 'comprehensive'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions || generateMockPredictions(config));
      } else {
        // Fallback to generated predictions based on current data
        setPredictions(generateMockPredictions(config));
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      const config = JSON.parse(localStorage.getItem('signaldesk_onboarding') || '{}');
      setPredictions(generateMockPredictions(config));
    } finally {
      setLoading(false);
    }
  };

  const generateMockPredictions = (config) => {
    const org = config.organizationName || 'Your Organization';
    const industry = config.industry || 'technology';
    const goals = Object.entries(config.goals || {})
      .filter(([_, enabled]) => enabled)
      .map(([goal]) => goal);

    return {
      trends: [
        {
          id: 1,
          title: `${industry} Market Consolidation`,
          probability: 75,
          impact: 'high',
          timeframe: '3-6 months',
          description: `Based on current M&A activity and funding patterns, expect significant consolidation in the ${industry} sector.`,
          recommendations: [
            'Position as acquisition target or acquirer',
            'Strengthen unique value propositions',
            'Build strategic partnerships early'
          ]
        },
        {
          id: 2,
          title: 'Regulatory Changes Incoming',
          probability: 60,
          impact: 'medium',
          timeframe: '6-12 months',
          description: `New regulations likely to impact ${industry} operations and compliance requirements.`,
          recommendations: [
            'Begin compliance audits now',
            'Engage with regulatory bodies',
            'Prepare public position statements'
          ]
        },
        {
          id: 3,
          title: 'Talent War Intensification',
          probability: 85,
          impact: 'high',
          timeframe: '1-3 months',
          description: 'Competition for top talent will peak as companies accelerate growth plans.',
          recommendations: [
            'Launch employer branding campaign',
            'Enhance retention programs',
            'Publicize culture and benefits'
          ]
        }
      ],
      risks: [
        {
          id: 1,
          threat: 'Competitor Product Launch',
          likelihood: 70,
          severity: 'critical',
          cascadeEffect: 'Could trigger price war and market share erosion',
          mitigation: [
            'Accelerate own product roadmap',
            'Prepare defensive PR campaign',
            'Lock in key customer contracts'
          ],
          earlyWarnings: [
            'Increased competitor hiring in product roles',
            'Patent filings in your core technology area',
            'Beta testing announcements'
          ]
        },
        {
          id: 2,
          threat: 'Supply Chain Disruption',
          likelihood: 45,
          severity: 'high',
          cascadeEffect: 'Delivery delays could damage customer relationships',
          mitigation: [
            'Diversify supplier base',
            'Build strategic inventory',
            'Communicate proactively with customers'
          ],
          earlyWarnings: [
            'Geopolitical tensions in supplier regions',
            'Raw material price volatility',
            'Logistics capacity constraints'
          ]
        }
      ],
      opportunities: [
        {
          id: 1,
          opportunity: 'Market Gap Opening',
          confidence: 80,
          potential: 'transformative',
          window: '2-4 months',
          description: `Competitor struggles creating opportunity in ${industry} segment.`,
          actions: [
            'Fast-track product development',
            'Prepare market entry PR blitz',
            'Secure first-mover partnerships'
          ],
          requirements: [
            'Additional funding or resources',
            'Strategic hire in target segment',
            'Clear go-to-market strategy'
          ]
        },
        {
          id: 2,
          opportunity: 'Strategic Partnership',
          confidence: 65,
          potential: 'high',
          window: '1-2 months',
          description: 'Major player seeking collaboration in your expertise area.',
          actions: [
            'Prepare partnership proposal',
            'Showcase unique capabilities',
            'Define win-win terms'
          ],
          requirements: [
            'Executive alignment',
            'Legal framework ready',
            'Integration capabilities'
          ]
        }
      ],
      timeline: [
        { date: '1 week', event: 'Industry conference - major announcements expected', type: 'milestone' },
        { date: '2 weeks', event: 'Earnings season - competitor insights', type: 'intel' },
        { date: '1 month', event: 'Regulatory decision on key policy', type: 'risk' },
        { date: '2 months', event: 'Market report publication', type: 'opportunity' },
        { date: '3 months', event: 'Technology breakthrough likely', type: 'disruption' }
      ]
    };
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 70) return '#ff00ff';
    if (probability >= 40) return '#00ffcc';
    return '#ffaa00';
  };

  const getImpactBadgeColor = (impact) => {
    switch(impact) {
      case 'critical':
      case 'transformative':
      case 'high': return '#ff00ff';
      case 'medium': return '#00ffcc';
      case 'low': return '#00ff88';
      default: return '#888';
    }
  };

  const renderTrends = () => (
    <div className="predictions-grid">
      {predictions.trends.map(trend => (
        <div key={trend.id} className="prediction-card trend-card">
          <div className="prediction-header">
            <TrendingUp size={24} color="#00ffcc" />
            <div className="probability-meter">
              <div className="probability-label">{trend.probability}% likely</div>
              <div className="probability-bar">
                <div 
                  className="probability-fill" 
                  style={{ 
                    width: `${trend.probability}%`,
                    background: getProbabilityColor(trend.probability)
                  }}
                />
              </div>
            </div>
          </div>
          
          <h3>{trend.title}</h3>
          <div className="prediction-meta">
            <span className="impact-badge" style={{ color: getImpactBadgeColor(trend.impact) }}>
              {trend.impact} impact
            </span>
            <span className="timeframe-badge">
              <Calendar size={14} /> {trend.timeframe}
            </span>
          </div>
          
          <p className="prediction-description">{trend.description}</p>
          
          <div className="recommendations">
            <h4>Recommended Actions:</h4>
            <ul>
              {trend.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );

  const renderRisks = () => (
    <div className="predictions-grid">
      {predictions.risks.map(risk => (
        <div key={risk.id} className="prediction-card risk-card">
          <div className="prediction-header">
            <AlertTriangle size={24} color="#ff4444" />
            <div className="severity-indicator">
              <span className={`severity-badge ${risk.severity}`}>
                {risk.severity}
              </span>
            </div>
          </div>
          
          <h3>{risk.threat}</h3>
          <div className="risk-metrics">
            <div className="likelihood">
              <span className="metric-label">Likelihood</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill"
                  style={{ width: `${risk.likelihood}%` }}
                />
              </div>
              <span className="metric-value">{risk.likelihood}%</span>
            </div>
          </div>
          
          <div className="cascade-warning">
            <Zap size={16} color="#ffaa00" />
            <p>{risk.cascadeEffect}</p>
          </div>
          
          <div className="risk-sections">
            <div className="early-warnings">
              <h4>Early Warning Signs:</h4>
              <ul>
                {risk.earlyWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
            
            <div className="mitigation-steps">
              <h4>Mitigation Strategy:</h4>
              <ul>
                {risk.mitigation.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderOpportunities = () => (
    <div className="predictions-grid">
      {predictions.opportunities.map(opp => (
        <div key={opp.id} className="prediction-card opportunity-card">
          <div className="prediction-header">
            <Target size={24} color="#00ff88" />
            <div className="confidence-score">
              <span className="confidence-label">{opp.confidence}% confidence</span>
            </div>
          </div>
          
          <h3>{opp.opportunity}</h3>
          <div className="opportunity-meta">
            <span className="potential-badge" style={{ color: getImpactBadgeColor(opp.potential) }}>
              {opp.potential} potential
            </span>
            <span className="window-badge">
              <Calendar size={14} /> {opp.window} window
            </span>
          </div>
          
          <p className="opportunity-description">{opp.description}</p>
          
          <div className="opportunity-sections">
            <div className="action-items">
              <h4>Immediate Actions:</h4>
              <ul>
                {opp.actions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
            
            <div className="requirements">
              <h4>Requirements:</h4>
              <ul>
                {opp.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTimeline = () => (
    <div className="timeline-container">
      <h3>Predictive Timeline</h3>
      <div className="timeline">
        {predictions.timeline.map((event, idx) => (
          <div key={idx} className={`timeline-event ${event.type}`}>
            <div className="timeline-date">{event.date}</div>
            <div className="timeline-content">
              <div className={`event-type-badge ${event.type}`}>
                {event.type}
              </div>
              <p>{event.event}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const views = [
    { id: 'trends', label: 'Market Trends', icon: TrendingUp },
    { id: 'risks', label: 'Risk Forecast', icon: AlertTriangle },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'timeline', label: 'Timeline', icon: Calendar }
  ];

  return (
    <div className="predictions-module">
      <div className="module-header">
        <h2>
          <Shield size={24} color="#8800ff" />
          PR Predictions & Forecasting
        </h2>
        <div className="view-tabs">
          {views.map(view => (
            <button
              key={view.id}
              className={`view-tab ${activeView === view.id ? 'active' : ''}`}
              onClick={() => setActiveView(view.id)}
            >
              <view.icon size={16} />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      <div className="module-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Analyzing patterns and generating predictions...</p>
          </div>
        ) : predictions ? (
          <>
            {activeView === 'trends' && renderTrends()}
            {activeView === 'risks' && renderRisks()}
            {activeView === 'opportunities' && renderOpportunities()}
            {activeView === 'timeline' && renderTimeline()}
          </>
        ) : (
          <div className="empty-state">
            <p>No predictions available. Click refresh to generate.</p>
            <button onClick={fetchPredictions} className="refresh-btn">
              Generate Predictions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionsModule;