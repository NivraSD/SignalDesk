/**
 * AI Monitoring Integration Component
 * Uses Supabase Edge Functions for Claude AI analysis
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  Target,
  Sparkles
} from 'lucide-react';
import { supabase, triggerMonitoring, getIntelligenceFindings } from '../../config/supabase';
import ClaudeSupabaseService from '../../services/claudeSupabaseService';

const claudeService = new ClaudeSupabaseService();

const AIMonitoringIntegration = ({ organizationId }) => {
  const [monitoringStatus, setMonitoringStatus] = useState('idle');
  const [findings, setFindings] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalFindings: 0,
    analyzedFindings: 0,
    opportunities: 0,
    highRelevance: 0
  });

  // Load initial findings
  useEffect(() => {
    if (organizationId) {
      loadFindings();
      subscribeToRealtime();
    }
  }, [organizationId]);

  // Load findings from Supabase
  const loadFindings = async () => {
    try {
      const data = await getIntelligenceFindings(organizationId, 20);
      setFindings(data || []);
      updateStats(data || []);
    } catch (error) {
      console.error('Error loading findings:', error);
      setError('Failed to load findings');
    }
  };

  // Subscribe to real-time updates
  const subscribeToRealtime = () => {
    const channel = supabase
      .channel(`monitoring-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intelligence_findings',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('New finding:', payload);
          setFindings(prev => [payload.new, ...prev]);
          // Auto-analyze new findings with Claude
          analyzeWithClaude([payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Trigger monitoring through Supabase Edge Function
  const startMonitoring = async () => {
    setMonitoringStatus('running');
    setError(null);

    try {
      const result = await triggerMonitoring(organizationId);
      
      if (result.success) {
        setMonitoringStatus('completed');
        // Reload findings after monitoring
        setTimeout(() => {
          loadFindings();
          setMonitoringStatus('idle');
        }, 2000);
      } else {
        throw new Error(result.message || 'Monitoring failed');
      }
    } catch (error) {
      console.error('Monitoring error:', error);
      setError(error.message);
      setMonitoringStatus('error');
    }
  };

  // Analyze findings with Claude
  const analyzeWithClaude = async (findingsToAnalyze = findings) => {
    if (!findingsToAnalyze.length) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Prepare findings for analysis
      const findingsSummary = findingsToAnalyze.slice(0, 10).map(f => ({
        title: f.title,
        content: f.content?.substring(0, 500),
        source: f.source_url,
        relevance: f.relevance_score,
        sentiment: f.sentiment
      }));

      // Get AI analysis
      const analysis = await claudeService.callClaude(
        `Analyze these intelligence findings and provide strategic insights:

${JSON.stringify(findingsSummary, null, 2)}

Provide:
1. Executive summary of key trends
2. Top 3 opportunities with NVS scores
3. Recommended immediate actions
4. Risk factors to monitor
5. Narrative gaps to exploit

Format as structured JSON.`,
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1500
        }
      );

      // Parse and set analysis
      let parsedAnalysis;
      if (typeof analysis.response === 'string') {
        try {
          parsedAnalysis = JSON.parse(analysis.response);
        } catch {
          parsedAnalysis = {
            summary: analysis.response,
            opportunities: [],
            actions: [],
            risks: [],
            gaps: []
          };
        }
      } else {
        parsedAnalysis = analysis.response;
      }

      setAiAnalysis(parsedAnalysis);

      // Update stats
      setStats(prev => ({
        ...prev,
        analyzedFindings: findingsToAnalyze.length,
        opportunities: parsedAnalysis.opportunities?.length || 0
      }));

    } catch (error) {
      console.error('AI analysis error:', error);
      setError('Failed to analyze with Claude AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update statistics
  const updateStats = (data) => {
    setStats({
      totalFindings: data.length,
      analyzedFindings: data.filter(f => f.ai_analysis).length,
      opportunities: data.filter(f => f.action_required).length,
      highRelevance: data.filter(f => f.relevance_score > 0.7).length
    });
  };

  return (
    <div className="ai-monitoring-integration">
      {/* Header */}
      <div className="monitoring-header">
        <div className="header-content">
          <div className="title-section">
            <Brain className="icon-primary" size={24} />
            <h2>AI-Powered Intelligence Monitoring</h2>
          </div>
          <div className="actions">
            <button 
              onClick={startMonitoring}
              disabled={monitoringStatus === 'running'}
              className="btn-primary"
            >
              {monitoringStatus === 'running' ? (
                <>
                  <Loader className="spin" size={16} />
                  Monitoring...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Start Monitoring
                </>
              )}
            </button>
            <button 
              onClick={() => analyzeWithClaude()}
              disabled={isAnalyzing || !findings.length}
              className="btn-secondary"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="spin" size={16} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <Activity className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.totalFindings}</div>
            <div className="stat-label">Total Findings</div>
          </div>
        </div>
        <div className="stat-card">
          <Brain className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.analyzedFindings}</div>
            <div className="stat-label">AI Analyzed</div>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.opportunities}</div>
            <div className="stat-label">Opportunities</div>
          </div>
        </div>
        <div className="stat-card">
          <Target className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{stats.highRelevance}</div>
            <div className="stat-label">High Relevance</div>
          </div>
        </div>
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div className="ai-analysis-section">
          <h3>Claude AI Analysis</h3>
          
          {/* Executive Summary */}
          {aiAnalysis.summary && (
            <div className="analysis-card">
              <h4>Executive Summary</h4>
              <p>{aiAnalysis.summary}</p>
            </div>
          )}

          {/* Opportunities */}
          {aiAnalysis.opportunities && aiAnalysis.opportunities.length > 0 && (
            <div className="analysis-card">
              <h4>Identified Opportunities</h4>
              <div className="opportunities-list">
                {aiAnalysis.opportunities.map((opp, idx) => (
                  <div key={idx} className="opportunity-item">
                    <div className="opp-header">
                      <span className="opp-title">{opp.title || opp.name}</span>
                      {opp.nvs_score && (
                        <span className="nvs-badge">NVS: {opp.nvs_score}</span>
                      )}
                    </div>
                    <p className="opp-description">{opp.description}</p>
                    {opp.actions && (
                      <div className="opp-actions">
                        {opp.actions.map((action, i) => (
                          <span key={i} className="action-tag">{action}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {aiAnalysis.actions && aiAnalysis.actions.length > 0 && (
            <div className="analysis-card">
              <h4>Recommended Actions</h4>
              <ul className="actions-list">
                {aiAnalysis.actions.map((action, idx) => (
                  <li key={idx}>
                    <CheckCircle size={16} className="action-icon" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Factors */}
          {aiAnalysis.risks && aiAnalysis.risks.length > 0 && (
            <div className="analysis-card">
              <h4>Risk Factors</h4>
              <ul className="risks-list">
                {aiAnalysis.risks.map((risk, idx) => (
                  <li key={idx}>
                    <AlertCircle size={16} className="risk-icon" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recent Findings */}
      <div className="findings-section">
        <h3>Recent Intelligence Findings</h3>
        <div className="findings-list">
          {findings.slice(0, 10).map((finding) => (
            <div key={finding.id} className="finding-card">
              <div className="finding-header">
                <span className="finding-title">{finding.title}</span>
                <div className="finding-badges">
                  {finding.relevance_score > 0.7 && (
                    <span className="badge badge-high">High Relevance</span>
                  )}
                  {finding.ai_analysis && (
                    <span className="badge badge-ai">AI Analyzed</span>
                  )}
                  <span className={`badge badge-${finding.sentiment || 'neutral'}`}>
                    {finding.sentiment || 'Neutral'}
                  </span>
                </div>
              </div>
              {finding.content && (
                <p className="finding-content">
                  {finding.content.substring(0, 200)}...
                </p>
              )}
              {finding.ai_analysis && (
                <div className="finding-ai-analysis">
                  <Brain size={14} />
                  <span>{finding.ai_analysis}</span>
                </div>
              )}
              <div className="finding-meta">
                <span>{finding.target?.name}</span>
                <span>{new Date(finding.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ai-monitoring-integration {
          padding: 20px;
          background: #0a0a0a;
          color: #e8e8e8;
          min-height: 100vh;
        }

        .monitoring-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .title-section h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }

        .icon-primary {
          color: #7c3aed;
        }

        .actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary, .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #7c3aed;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #6d28d9;
        }

        .btn-secondary {
          background: #374151;
          color: #e8e8e8;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: #ef4444;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          color: #7c3aed;
          opacity: 0.8;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
        }

        .stat-label {
          font-size: 14px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .ai-analysis-section {
          margin-bottom: 32px;
        }

        .ai-analysis-section h3 {
          font-size: 20px;
          margin-bottom: 16px;
          color: #7c3aed;
        }

        .analysis-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .analysis-card h4 {
          font-size: 16px;
          margin-bottom: 12px;
          color: #e8e8e8;
        }

        .opportunities-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .opportunity-item {
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          padding: 16px;
        }

        .opp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .opp-title {
          font-weight: 600;
          color: #ffffff;
        }

        .nvs-badge {
          background: #7c3aed;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .opp-description {
          color: #d1d5db;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .opp-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .action-tag {
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .actions-list, .risks-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .actions-list li, .risks-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d1d5db;
        }

        .action-icon {
          color: #10b981;
        }

        .risk-icon {
          color: #f59e0b;
        }

        .findings-section h3 {
          font-size: 20px;
          margin-bottom: 16px;
        }

        .findings-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .finding-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 16px;
        }

        .finding-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .finding-title {
          font-weight: 600;
          color: #ffffff;
          flex: 1;
        }

        .finding-badges {
          display: flex;
          gap: 8px;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-high {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .badge-ai {
          background: rgba(124, 58, 237, 0.2);
          color: #a78bfa;
        }

        .badge-positive {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .badge-negative {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .badge-neutral {
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
        }

        .finding-content {
          color: #9ca3af;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .finding-ai-analysis {
          background: rgba(124, 58, 237, 0.1);
          border-left: 3px solid #7c3aed;
          padding: 8px 12px;
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 14px;
          color: #d1d5db;
        }

        .finding-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default AIMonitoringIntegration;