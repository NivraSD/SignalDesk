'use client'

import React, { useState, useEffect } from 'react'
import { Brain, TrendingUp, Users, AlertCircle, Zap, Target, Activity, ChevronRight } from 'lucide-react'
import { IntelligenceService } from '@/lib/services/intelligenceService'
import { useAppStore } from '@/stores/useAppStore'
import IntelligenceSynthesisDisplay from '@/components/IntelligenceSynthesisDisplay'

interface PipelineStage {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: string
  startTime?: number
  icon: React.ComponentType<any>
}

const SimpleIntelligence = () => {
  const { organization, setOrganization } = useAppStore()
  const [isRunning, setIsRunning] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [executiveSynthesis, setExecutiveSynthesis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [useRealPipeline, setUseRealPipeline] = useState(false)

  const pipelineStages: PipelineStage[] = [
    { id: 'mcp-discovery', name: 'Profile Init', status: 'pending', icon: Brain },
    { id: 'monitor-stage-1', name: 'Monitoring', status: 'pending', icon: Activity },
    { id: 'monitor-stage-2-relevance', name: 'Relevance Filter', status: 'pending', icon: Target },
    { id: 'monitor-stage-3-quality-control', name: 'Quality Control', status: 'pending', icon: AlertCircle },
    { id: 'monitoring-stage-2-enrichment', name: 'Entity Extraction', status: 'pending', icon: Users },
    { id: 'intelligence-orchestrator-v2', name: 'Intelligence Orchestrator', status: 'pending', icon: TrendingUp },
    { id: 'mcp-executive-synthesis', name: 'Executive Synthesis', status: 'pending', icon: Zap },
    { id: 'opportunity-orchestrator', name: 'Opportunity Engine', status: 'pending', icon: Zap }
  ]

  const [stages, setStages] = useState(pipelineStages)

  const updateStageStatus = (stageId: string, status: 'pending' | 'running' | 'completed' | 'failed') => {
    setStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        const now = Date.now()
        let updates: Partial<PipelineStage> = { status }

        if (status === 'running') {
          updates.startTime = now
        } else if ((status === 'completed' || status === 'failed') && stage.startTime) {
          const duration = Math.round((now - stage.startTime) / 1000)
          updates.duration = `${duration}s`
        }

        return { ...stage, ...updates }
      }
      return stage
    }))
  }

  const runPipeline = async () => {
    setIsRunning(true)
    setCurrentStage(0)
    setError(null)
    // Reset all stages to pending
    setStages(pipelineStages.map(s => ({ ...s, status: 'pending' })))

    if (useRealPipeline && organization) {
      try {
        // Call the real pipeline with organization details and progress callback
        const pipelineData = await IntelligenceService.startPipeline(
          organization.id,
          organization.name,
          organization.industry,
          (stage, status, data) => {
            console.log(`Pipeline stage ${stage}: ${status}`, data)
            updateStageStatus(stage, status)

            // Update current stage index for visual tracking
            const stageIndex = pipelineStages.findIndex(s => s.id === stage)
            if (stageIndex !== -1 && status === 'running') {
              setCurrentStage(stageIndex)
            }
          }
        )

        console.log('Full pipeline response:', pipelineData)

        // Check if we have executive synthesis or synthesis
        const synthesisData = pipelineData?.synthesis || pipelineData?.executiveSynthesis
        if (synthesisData) {
          console.log('🔴🔴🔴 CRITICAL: Executive Synthesis Format Check:', {
            synthesisType: typeof synthesisData,
            synthesisKeys: synthesisData ? Object.keys(synthesisData) : 'none',
            hasSynthesis: !!synthesisData.synthesis,
            hasExecutiveSummary: !!synthesisData.synthesis?.executive_summary,
            hasCompetitiveMoves: !!synthesisData.synthesis?.competitive_moves,
            hasMetadata: !!synthesisData.metadata
          })
          setExecutiveSynthesis(synthesisData)


          // Mark all stages as complete
          setStages(prev => prev.map(stage => ({ ...stage, status: 'completed' })))
          setIsRunning(false)

          // Show statistics
          if (pipelineData.statistics) {
            console.log('Pipeline Statistics:', pipelineData.statistics)
          }

          // Show opportunities
          if (pipelineData.opportunities && pipelineData.opportunities.length > 0) {
            console.log(`Found ${pipelineData.opportunities.length} opportunities:`, pipelineData.opportunities)
            console.log('🔥🔥🔥 CRITICAL CHECK - FIRST OPPORTUNITY:', {
              title: pipelineData.opportunities[0]?.title,
              urgency: pipelineData.opportunities[0]?.urgency,
              category: pipelineData.opportunities[0]?.category,
              trigger: pipelineData.opportunities[0]?.trigger_event,
              window: pipelineData.opportunities[0]?.window,
              source: pipelineData.opportunities[0]?.source,
              createdAt: pipelineData.opportunities[0]?.created_at,
              organizationId: pipelineData.opportunities[0]?.organization_id
            })
            console.log('🔥🔥🔥 ALL OPPORTUNITY TITLES:', pipelineData.opportunities.map(o => o.title))
          }
        } else if (pipelineData?.pipelineRunId) {
          const unsubscribe = IntelligenceService.subscribeToPipelineUpdates(
            pipelineData.pipelineRunId,
            (pipelineRun) => {
              // Update stages based on pipeline progress
              const completedStages = pipelineRun.stages_completed || []
              setStages(prev => prev.map(stage => ({
                ...stage,
                status: completedStages.includes(stage.id) ? 'completed' :
                        pipelineRun.status === 'running' && !completedStages.includes(stage.id) ? 'running' :
                        'pending'
              })))

              if (pipelineRun.status === 'completed') {
                setIsRunning(false)
                // Fetch the synthesis
                IntelligenceService.getLatestSynthesis(organization.id).then(synthesis => {
                  if (synthesis) {
                    setExecutiveSynthesis(synthesis)
                  }
                })
              } else if (pipelineRun.status === 'failed') {
                setIsRunning(false)
                setError(pipelineRun.error || 'Pipeline failed')
              }
            }
          )

          // Store unsubscribe for cleanup
          ;(window as any).__intelligenceUnsubscribe = unsubscribe
        }
      } catch (error: any) {
        console.error('Pipeline error:', error)
        setError(error.message)
        setIsRunning(false)
      }
    } else {
      // Don't run mock pipeline - just show a message
      setError('Please enable "Use Real Pipeline" to run intelligence analysis')
      setIsRunning(false)
    }
  }

  // Set up a default organization if none exists
  useEffect(() => {
    if (!organization) {
      setOrganization({
        id: '1', // Use numeric string ID for database compatibility
        name: 'Tesla',
        industry: 'Electric Vehicles',
        config: {}
      })
    }
  }, [organization, setOrganization])

  return (
    <div className="bg-gray-900 rounded-lg p-6 text-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-cyan-400">Intelligence Hub</h2>
          <label className="flex items-center gap-2 ml-4">
            <input
              type="checkbox"
              checked={useRealPipeline}
              onChange={(e) => setUseRealPipeline(e.target.checked)}
              className="w-4 h-4 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500"
            />
            <span className="text-xs text-gray-400">Use Real Pipeline</span>
          </label>
        </div>
        <button
          onClick={runPipeline}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isRunning
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-600 text-black'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Analysis'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      {/* Pipeline Stages */}
      <div className="mb-6 space-y-2">
        {stages.map((stage, idx) => {
          const Icon = stage.icon
          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                stage.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                stage.status === 'running' ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' :
                'bg-gray-800 text-gray-500'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{stage.name}</div>
              </div>
              {stage.status === 'running' && (
                <div className="text-xs text-cyan-400 animate-pulse">Processing...</div>
              )}
              {stage.status === 'completed' && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-green-400">✓ Complete</div>
                  {stage.duration && (
                    <span className="text-xs text-gray-500">({stage.duration})</span>
                  )}
                </div>
              )}
              {stage.status === 'failed' && (
                <div className="text-xs text-red-400">✗ Failed</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Executive Synthesis Display */}
      {executiveSynthesis && (
        <div className="border-t border-gray-800 pt-4">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">PR Intelligence Analysis</h3>
          {console.log('🎯 Passing to IntelligenceSynthesisDisplay:', {
            executiveSynthesis,
            hasSynthesis: !!executiveSynthesis.synthesis,
            synthesisKeys: executiveSynthesis.synthesis ? Object.keys(executiveSynthesis.synthesis) : 'none',
            executiveSummaryLength: executiveSynthesis.synthesis?.executive_summary?.length,
            fullSynthesis: executiveSynthesis
          })}
          <IntelligenceSynthesisDisplay synthesis={executiveSynthesis} organizationId={organization?.id} />
        </div>
      )}

    </div>
  )
}

export default SimpleIntelligence