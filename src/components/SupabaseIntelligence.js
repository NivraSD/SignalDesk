import React, { useState, useEffect, useRef } from 'react';
import './MultiStageIntelligence.css';

/**
 * Supabase-Only Intelligence Pipeline
 * NO localStorage, NO complex state management
 * Just Supabase as the single source of truth
 */

const INTELLIGENCE_STAGES = [
  { id: 'competitors', name: 'Competitive Intelligence', duration: 45 },
  { id: 'media', name: 'Media Landscape Mapping', duration: 40 },
  { id: 'regulatory', name: 'Regulatory Environment', duration: 35 },
  { id: 'trends', name: 'Market Trends Analysis', duration: 30 },
  { id: 'synthesis', name: 'Strategic Synthesis', duration: 50 }
];

const SupabaseIntelligence = ({ organization, onComplete }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle, checking, running, complete
  const [stageStatuses, setStageStatuses] = useState({});
  const [finalIntelligence, setFinalIntelligence] = useState(null);
  const [error, setError] = useState(null);
  const checkingRef = useRef(false);
  const runningRef = useRef(false);
  
  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
  const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

  /**
   * Check what stages are already complete in Supabase
   */
  const checkSupabaseStatus = async () => {
    if (!organization?.name || checkingRef.current) return null;
    
    checkingRef.current = true;
    console.log(`🔍 Checking Supabase for ${organization.name} intelligence data...`);
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/intelligence-persistence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            action: 'getStageData',
            organization_name: organization.name,
            limit: 50
          })
        }
      );

      if (!response.ok) {
        console.error('Failed to check Supabase status');
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Create a map of completed stages
        const completedStages = {};
        let hasSynthesis = false;
        
        result.data.forEach(record => {
          completedStages[record.stage_name] = {
            completed: true,
            data: record.stage_data,
            timestamp: record.created_at
          };
          
          if (record.stage_name === 'synthesis') {
            hasSynthesis = true;
            setFinalIntelligence({
              success: true,
              analysis: record.stage_data,
              fromSupabase: true
            });
          }
        });
        
        console.log(`✅ Found ${Object.keys(completedStages).length} completed stages in Supabase`);
        return { completedStages, hasSynthesis };
      }
      
      return null;
    } catch (err) {
      console.error('Error checking Supabase:', err);
      return null;
    } finally {
      checkingRef.current = false;
    }
  };

  /**
   * Save stage data to Supabase
   */
  const saveToSupabase = async (stageName, stageData) => {
    console.log(`💾 Saving ${stageName} to Supabase...`);
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/intelligence-persistence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            action: 'saveStageData',
            organization_name: organization.name,
            stage_name: stageName,
            stage_data: stageData,
            metadata: {
              timestamp: new Date().toISOString(),
              pipeline_version: '2.0'
            }
          })
        }
      );

      if (response.ok) {
        console.log(`✅ Saved ${stageName} to Supabase`);
        return true;
      }
      
      console.error(`Failed to save ${stageName} to Supabase`);
      return false;
    } catch (err) {
      console.error(`Error saving ${stageName}:`, err);
      return false;
    }
  };

  /**
   * Run a single stage
   */
  const runStage = async (stageIndex) => {
    if (runningRef.current) {
      console.log('⚠️ Pipeline already running');
      return;
    }
    
    const stage = INTELLIGENCE_STAGES[stageIndex];
    console.log(`🚀 Running stage ${stageIndex + 1}: ${stage.name}`);
    
    setStageStatuses(prev => ({
      ...prev,
      [stage.id]: { running: true }
    }));
    
    try {
      // Call the appropriate edge function for this stage
      const functionName = `intelligence-stage-${stageIndex + 1}-${stage.id}`;
      
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            organization: organization,
            previousStages: stageStatuses
          })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        // Save to Supabase immediately
        await saveToSupabase(stage.id, result.data || result);
        
        setStageStatuses(prev => ({
          ...prev,
          [stage.id]: { 
            completed: true, 
            data: result.data || result,
            timestamp: new Date().toISOString()
          }
        }));
        
        // If this was synthesis, we're done
        if (stage.id === 'synthesis') {
          setPipelineStatus('complete');
          const finalData = {
            success: true,
            analysis: result.data || result,
            allStages: stageStatuses
          };
          setFinalIntelligence(finalData);
          
          // Call onComplete callback if provided
          if (onComplete) {
            onComplete(finalData);
          }
        } else {
          // Move to next stage
          setCurrentStageIndex(stageIndex + 1);
        }
      } else {
        throw new Error(result.error || 'Stage failed');
      }
    } catch (err) {
      console.error(`❌ Stage ${stage.name} failed:`, err);
      setError(`${stage.name} failed: ${err.message}`);
      setStageStatuses(prev => ({
        ...prev,
        [stage.id]: { failed: true, error: err.message }
      }));
      
      // Continue to next stage anyway
      if (stageIndex < INTELLIGENCE_STAGES.length - 1) {
        setTimeout(() => setCurrentStageIndex(stageIndex + 1), 2000);
      }
    }
  };

  /**
   * Initial check on mount
   */
  useEffect(() => {
    if (!organization?.name) {
      console.log('⚠️ No organization provided');
      return;
    }
    
    const initializePipeline = async () => {
      setPipelineStatus('checking');
      
      // Check what's already in Supabase
      const supabaseStatus = await checkSupabaseStatus();
      
      if (supabaseStatus?.hasSynthesis) {
        console.log('✅ Complete analysis already in Supabase!');
        setPipelineStatus('complete');
        setStageStatuses(supabaseStatus.completedStages);
      } else if (supabaseStatus?.completedStages) {
        // Some stages complete, continue from where we left off
        setStageStatuses(supabaseStatus.completedStages);
        
        // Find the next stage to run
        const nextStageIndex = INTELLIGENCE_STAGES.findIndex(
          stage => !supabaseStatus.completedStages[stage.id]
        );
        
        if (nextStageIndex >= 0) {
          console.log(`📍 Resuming from stage ${nextStageIndex + 1}`);
          setPipelineStatus('running');
          setCurrentStageIndex(nextStageIndex);
        } else {
          setPipelineStatus('complete');
        }
      } else {
        // Nothing in Supabase, start fresh
        console.log('🆕 Starting fresh pipeline');
        setPipelineStatus('running');
        setCurrentStageIndex(0);
      }
    };
    
    initializePipeline();
    // eslint-disable-next-line
  }, []); // Only run once on mount

  /**
   * Run stages when index changes
   */
  useEffect(() => {
    if (currentStageIndex >= 0 && 
        currentStageIndex < INTELLIGENCE_STAGES.length && 
        pipelineStatus === 'running' &&
        !runningRef.current) {
      
      runningRef.current = true;
      runStage(currentStageIndex).finally(() => {
        runningRef.current = false;
      });
    }
    // eslint-disable-next-line
  }, [currentStageIndex]); // Only depend on stage index

  // Simple display
  if (!organization) {
    return <div className="multi-stage-intelligence">
      <h2>No organization selected</h2>
    </div>;
  }

  if (pipelineStatus === 'checking') {
    return <div className="multi-stage-intelligence">
      <h2>Checking existing intelligence data...</h2>
    </div>;
  }

  if (pipelineStatus === 'complete' && finalIntelligence) {
    return (
      <div className="multi-stage-intelligence">
        <div className="analysis-header">
          <h1>Intelligence Analysis Complete</h1>
          <p className="analysis-subtitle">
            {finalIntelligence.fromSupabase ? 'Loaded from database' : 'Fresh analysis completed'}
          </p>
        </div>
        
        <div className="intelligence-display">
          <pre style={{
            backgroundColor: '#1a1a1a',
            color: '#00ff88',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto'
          }}>
            {JSON.stringify(finalIntelligence.analysis, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="multi-stage-intelligence">
      <div className="analysis-header">
        <h1>Intelligence Pipeline</h1>
        <p className="analysis-subtitle">
          Running analysis for {organization.name}
        </p>
      </div>

      {error && (
        <div style={{
          background: '#ff0044',
          color: 'white',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <div className="stages-progress">
        {INTELLIGENCE_STAGES.map((stage, idx) => {
          const status = stageStatuses[stage.id] || {};
          
          return (
            <div key={stage.id} className="stage-item" style={{
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: status.completed ? '#00ff8820' : 
                              status.running ? '#ffaa0020' : 
                              status.failed ? '#ff004420' : '#1a1a1a',
              border: `1px solid ${
                status.completed ? '#00ff88' : 
                status.running ? '#ffaa00' : 
                status.failed ? '#ff0044' : '#333'
              }`,
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{stage.name}</strong>
                  {status.running && ' - Running...'}
                  {status.completed && ' ✅'}
                  {status.failed && ' ❌'}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  Stage {idx + 1} of {INTELLIGENCE_STAGES.length}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SupabaseIntelligence;