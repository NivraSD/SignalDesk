/**
 * Intelligence Pipeline Status Component
 * Shows the status of the intelligence pipeline and allows manual triggering
 */

import React from 'react';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Play,
  Loader
} from 'lucide-react';
import useIntelligencePipeline from '../../hooks/useIntelligencePipeline';
import './IntelligencePipelineStatus.css';

const IntelligencePipelineStatus = () => {
  const {
    isReady,
    isRunning,
    hasResults,
    profile,
    results,
    error,
    runPipeline,
    clearResults,
    refresh
  } = useIntelligencePipeline();

  if (!isReady) {
    return (
      <div className="pipeline-status not-ready">
        <AlertCircle className="status-icon" />
        <div className="status-message">
          <h3>Intelligence Pipeline Not Ready</h3>
          <p>{error || 'Complete onboarding to start intelligence gathering'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-status">
      <div className="status-header">
        <div className="status-title">
          <Activity className="title-icon" />
          <h2>Intelligence Pipeline</h2>
        </div>
        <div className="status-actions">
          {!isRunning && (
            <>
              <button 
                className="btn-action"
                onClick={refresh}
                title="Refresh status"
              >
                <RefreshCw size={16} />
              </button>
              {!hasResults && (
                <button 
                  className="btn-primary"
                  onClick={runPipeline}
                >
                  <Play size={16} />
                  Start Pipeline
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="status-body">
        {isRunning && (
          <div className="status-running">
            <Loader className="spinner" />
            <div className="running-message">
              <h3>Intelligence Pipeline Running</h3>
              <p>Analyzing {profile?.organization?.name || 'organization'}...</p>
              <div className="pipeline-stages">
                <div className="stage active">Discovery</div>
                <div className="stage">Competitors</div>
                <div className="stage">Media</div>
                <div className="stage">Regulatory</div>
                <div className="stage">Trends</div>
                <div className="stage">Synthesis</div>
              </div>
            </div>
          </div>
        )}

        {!isRunning && hasResults && results && (
          <div className="status-complete">
            <CheckCircle className="success-icon" />
            <div className="results-summary">
              <h3>Intelligence Analysis Complete</h3>
              <div className="results-stats">
                <div className="stat">
                  <span className="stat-value">
                    {Object.keys(results.stages || {}).length}
                  </span>
                  <span className="stat-label">Stages Completed</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {results.errors?.length || 0}
                  </span>
                  <span className="stat-label">Errors</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {Math.round((results.metadata?.duration || 0) / 1000)}s
                  </span>
                  <span className="stat-label">Duration</span>
                </div>
              </div>
              
              {results.stages?.synthesis?.data && (
                <div className="key-insights">
                  <h4>Key Insights</h4>
                  <ul>
                    {results.stages.synthesis.data.patterns?.slice(0, 3).map((pattern, index) => (
                      <li key={index}>
                        <strong>{pattern.type}:</strong> {pattern.insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="results-actions">
                <button 
                  className="btn-secondary"
                  onClick={clearResults}
                >
                  Clear Results
                </button>
                <button 
                  className="btn-primary"
                  onClick={runPipeline}
                >
                  Run Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!isRunning && !hasResults && (
          <div className="status-idle">
            <div className="idle-message">
              <h3>Ready to Analyze</h3>
              <p>Organization: <strong>{profile?.organization?.name}</strong></p>
              <p>Click "Start Pipeline" to begin intelligence gathering</p>
              
              {profile?.competitors && (
                <div className="profile-preview">
                  <h4>Profile Summary</h4>
                  <ul>
                    <li>
                      Competitors: {
                        (profile.competitors.direct?.length || 0) +
                        (profile.competitors.indirect?.length || 0) +
                        (profile.competitors.emerging?.length || 0)
                      }
                    </li>
                    <li>
                      Stakeholders: {
                        Object.values(profile.stakeholders || {}).flat().length
                      }
                    </li>
                    <li>
                      Keywords: {profile.keywords?.length || 0}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="status-error">
            <AlertCircle className="error-icon" />
            <div className="error-message">
              <h3>Pipeline Error</h3>
              <p>{error}</p>
              <button 
                className="btn-primary"
                onClick={refresh}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligencePipelineStatus;