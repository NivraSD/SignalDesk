import React, { useState, useEffect } from 'react';
import './SimpleIntelligencePipeline.css';

const STAGES = [
  { id: 'extraction', name: 'Discovery', endpoint: 'intelligence-discovery-v3' },
  { id: 'competitive', name: 'Competitors', endpoint: 'intelligence-stage-1-competitors' },
  { id: 'stakeholders', name: 'Stakeholders', endpoint: 'intelligence-stage-2-media' },
  { id: 'media', name: 'Media', endpoint: 'intelligence-stage-2-media' },
  { id: 'regulatory', name: 'Regulatory', endpoint: 'intelligence-stage-3-regulatory' },
  { id: 'trends', name: 'Trends', endpoint: 'intelligence-stage-4-trends' },
  { id: 'synthesis', name: 'Synthesis', endpoint: 'intelligence-stage-5-synthesis' }
];

const SimpleIntelligencePipeline = ({ organization }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [stageResults, setStageResults] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [finalData, setFinalData] = useState(null);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!organization) return;
    
    const runStage = async (stageIndex) => {
      if (stageIndex >= STAGES.length) {
        // Pipeline complete
        console.log('✅ Pipeline complete with results:', stageResults);
        setIsComplete(true);
        
        // Extract final synthesis data
        const synthesis = stageResults.synthesis || stageResults.trends || {};
        setFinalData(synthesis);
        return;
      }

      const stage = STAGES[stageIndex];
      console.log(`🚀 Running stage ${stageIndex + 1}: ${stage.name}`);

      try {
        // Build request body based on stage
        let requestBody = { organization };
        
        // Add previous results for later stages
        if (stageIndex > 0) {
          requestBody.previousResults = stageResults;
          
          // Add intelligence data from discovery
          if (stageResults.extraction?.intelligence) {
            requestBody.intelligence = stageResults.extraction.intelligence;
          }
        }

        // Special handling for synthesis stage
        if (stage.id === 'synthesis') {
          requestBody = {
            organization,
            previousResults: stageResults,
            stage1: stageResults.competitive?.data,
            stage2: stageResults.media?.data,
            stage3: stageResults.regulatory?.data,
            stage4: stageResults.trends?.data,
            monitoring: stageResults.extraction?.intelligence
          };
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/${stage.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Stage ${stage.name} failed: ${data.error || response.status}`);
        }

        console.log(`✅ Stage ${stage.name} complete:`, data);

        // Store results
        setStageResults(prev => ({
          ...prev,
          [stage.id]: data
        }));

        // Move to next stage
        setCurrentStage(stageIndex + 1);
        
        // Run next stage after a small delay
        setTimeout(() => {
          runStage(stageIndex + 1);
        }, 500);

      } catch (err) {
        console.error(`❌ Stage ${stage.name} error:`, err);
        setError(`Stage ${stage.name} failed: ${err.message}`);
      }
    };

    // Start pipeline
    runStage(0);
  }, [organization?.name]); // Only depend on organization name

  // Render completed view
  if (isComplete && finalData) {
    const opportunities = finalData.opportunities || 
                         finalData.data?.consolidated_opportunities?.prioritized_list || 
                         [];
    
    const tabs = finalData.tabs || finalData.data?.tabs || {};
    
    return (
      <div className="simple-pipeline-complete">
        <div className="completion-header">
          <h2>✅ Intelligence Analysis Complete</h2>
          <p>Analysis for {organization.name} - All {STAGES.length} stages processed</p>
        </div>

        <div className="results-grid">
          {/* Executive Summary */}
          {tabs.executive && (
            <div className="result-card">
              <h3>📊 Executive Summary</h3>
              <p>{tabs.executive.headline || 'Analysis complete'}</p>
              <div className="stats">
                <span>Entities: {tabs.executive.statistics?.entities_tracked || 0}</span>
                <span>Actions: {tabs.executive.statistics?.actions_captured || 0}</span>
              </div>
            </div>
          )}

          {/* Competitive Intelligence */}
          {tabs.competitive && (
            <div className="result-card">
              <h3>⚔️ Competitive Landscape</h3>
              <p>{tabs.competitive.pr_strategy || 'Monitoring competitors'}</p>
              <ul>
                {(tabs.competitive.competitor_actions || []).slice(0, 3).map((action, i) => (
                  <li key={i}>{action.competitor}: {action.action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Market Trends */}
          {tabs.market && (
            <div className="result-card">
              <h3>📈 Market Trends</h3>
              <p>{tabs.market.market_position || 'Analyzing market position'}</p>
              <ul>
                {(tabs.market.market_trends || []).slice(0, 3).map((trend, i) => (
                  <li key={i}>{trend.topic} - {trend.trend}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div className="result-card opportunities">
              <h3>🎯 PR Opportunities ({opportunities.length})</h3>
              <ul>
                {opportunities.slice(0, 5).map((opp, i) => (
                  <li key={i}>
                    <strong>{opp.title || opp.opportunity}</strong>
                    <span className="confidence">{opp.confidence || 75}% confidence</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Raw Data Display (for debugging) */}
        <details className="raw-data">
          <summary>View Raw Intelligence Data</summary>
          <pre>{JSON.stringify(finalData, null, 2)}</pre>
        </details>
      </div>
    );
  }

  // Render progress view
  return (
    <div className="simple-pipeline-progress">
      <div className="pipeline-header">
        <h2>Running Intelligence Pipeline</h2>
        <p>Analyzing {organization?.name || 'organization'}...</p>
      </div>

      <div className="stages-progress">
        {STAGES.map((stage, index) => {
          const isActive = index === currentStage;
          const isComplete = index < currentStage;
          const hasError = error && index === currentStage;

          return (
            <div 
              key={stage.id} 
              className={`stage-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''} ${hasError ? 'error' : ''}`}
            >
              <div className="stage-number">{index + 1}</div>
              <div className="stage-name">{stage.name}</div>
              <div className="stage-status">
                {isComplete && '✓'}
                {isActive && !hasError && '⏳'}
                {hasError && '❌'}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={() => window.location.reload()}>Restart</button>
        </div>
      )}
    </div>
  );
};

export default SimpleIntelligencePipeline;