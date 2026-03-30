'use client'

import React, { useState } from 'react'
import {
  PlayCircle,
  FileText,
  Send,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader
} from 'lucide-react'
import type { StoredStrategy } from '@/types/niv-strategy'

interface WorkflowConfig {
  enabled: boolean
  status?: 'pending' | 'running' | 'completed' | 'failed'
  result?: {
    items_created: number
    success: boolean
    message?: string
  }
}

interface CampaignOrchestratorProps {
  strategy: StoredStrategy
  onExecuteWorkflow: (workflowType: string) => Promise<void>
  onExecuteAll: () => Promise<void>
}

export function CampaignOrchestrator({
  strategy,
  onExecuteWorkflow,
  onExecuteAll
}: CampaignOrchestratorProps) {
  const [executingWorkflows, setExecutingWorkflows] = useState<Set<string>>(new Set())
  const [workflowResults, setWorkflowResults] = useState<Record<string, any>>({})

  const handleExecuteWorkflow = async (workflowType: string) => {
    setExecutingWorkflows(prev => new Set([...prev, workflowType]))
    try {
      await onExecuteWorkflow(workflowType)
      setWorkflowResults(prev => ({
        ...prev,
        [workflowType]: { success: true, timestamp: new Date() }
      }))
    } catch (error) {
      setWorkflowResults(prev => ({
        ...prev,
        [workflowType]: { success: false, error, timestamp: new Date() }
      }))
    } finally {
      setExecutingWorkflows(prev => {
        const next = new Set(prev)
        next.delete(workflowType)
        return next
      })
    }
  }

  const handleExecuteAll = async () => {
    const workflows = ['content_generation', 'media_outreach', 'intelligence_gathering', 'strategic_planning']
    setExecutingWorkflows(new Set(workflows))

    try {
      await onExecuteAll()
      workflows.forEach(workflow => {
        setWorkflowResults(prev => ({
          ...prev,
          [workflow]: { success: true, timestamp: new Date() }
        }))
      })
    } catch (error) {
      console.error('Error executing all workflows:', error)
    } finally {
      setExecutingWorkflows(new Set())
    }
  }

  const getWorkflowStatus = (workflowType: string) => {
    if (executingWorkflows.has(workflowType)) return 'running'
    if (workflowResults[workflowType]) {
      return workflowResults[workflowType].success ? 'completed' : 'failed'
    }
    return 'pending'
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: '#ffaa00' }}>
            Campaign Orchestration
          </h3>
          <p className="text-sm text-gray-400">
            Execute workflows based on the strategic framework
          </p>
        </div>

        {/* Overall Progress Indicator */}
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-500">
            {Object.keys(workflowResults).length} / 4
          </div>
          <div className="text-xs text-gray-400">Workflows Complete</div>
        </div>
      </div>

      {/* Workflow Cards Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Content Generation Workflow */}
        <WorkflowCard
          title="Content Generation"
          description="Generate blog posts, press releases, social content"
          icon={<FileText className="w-5 h-5" />}
          status={getWorkflowStatus('content_generation')}
          onExecute={() => handleExecuteWorkflow('content_generation')}
          result={workflowResults['content_generation']}
        />

        {/* Media Outreach Workflow */}
        <WorkflowCard
          title="Media Outreach"
          description="Create media lists, pitch emails, press kits"
          icon={<Send className="w-5 h-5" />}
          status={getWorkflowStatus('media_outreach')}
          onExecute={() => handleExecuteWorkflow('media_outreach')}
          result={workflowResults['media_outreach']}
        />

        {/* Intelligence Gathering Workflow */}
        <WorkflowCard
          title="Intelligence Gathering"
          description="Market analysis, competitor intel, trends"
          icon={<Search className="w-5 h-5" />}
          status={getWorkflowStatus('intelligence_gathering')}
          onExecute={() => handleExecuteWorkflow('intelligence_gathering')}
          result={workflowResults['intelligence_gathering']}
        />

        {/* Strategic Planning Workflow */}
        <WorkflowCard
          title="Strategic Planning"
          description="Timelines, milestones, action plans"
          icon={<Calendar className="w-5 h-5" />}
          status={getWorkflowStatus('strategic_planning')}
          onExecute={() => handleExecuteWorkflow('strategic_planning')}
          result={workflowResults['strategic_planning']}
        />
      </div>

      {/* Execute All Button */}
      <button
        onClick={handleExecuteAll}
        disabled={executingWorkflows.size > 0}
        className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700
                   disabled:text-gray-500 text-black rounded-lg font-medium transition-all
                   flex items-center justify-center gap-2"
      >
        {executingWorkflows.size > 0 ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Executing {executingWorkflows.size} workflow(s)...
          </>
        ) : (
          <>
            <PlayCircle className="w-5 h-5" />
            Execute All Workflows
          </>
        )}
      </button>

      {/* Execution Notes */}
      <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
        <p className="text-xs text-gray-400">
          <strong>Note:</strong> Workflows will use the strategic framework above to generate
          relevant content and materials. All outputs will be saved to this campaign workspace.
        </p>
      </div>
    </div>
  )
}

// Individual Workflow Card Component
function WorkflowCard({
  title,
  description,
  icon,
  status,
  onExecute,
  result
}: {
  title: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'running' | 'completed' | 'failed'
  onExecute: () => void
  result?: any
}) {
  const statusConfig = {
    pending: {
      bg: 'bg-gray-800/50',
      border: 'border-gray-700',
      icon: <Clock className="w-4 h-4 text-gray-500" />,
      text: 'Ready'
    },
    running: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: <Loader className="w-4 h-4 text-yellow-500 animate-spin" />,
      text: 'Running...'
    },
    completed: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      text: 'Completed'
    },
    failed: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      text: 'Failed'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={`p-4 rounded-lg border ${config.bg} ${config.border} transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-800 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {config.icon}
          <span className="text-xs">{config.text}</span>
        </div>
      </div>

      {/* Content */}
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-xs text-gray-400 mb-3">{description}</p>

      {/* Result Summary */}
      {result && status === 'completed' && (
        <div className="mb-3 p-2 bg-gray-900/50 rounded text-xs">
          <span className="text-green-400">✓ Successfully generated content</span>
        </div>
      )}

      {result && status === 'failed' && (
        <div className="mb-3 p-2 bg-gray-900/50 rounded text-xs">
          <span className="text-red-400">✗ Execution failed</span>
        </div>
      )}

      {/* Execute Button */}
      {status !== 'running' && (
        <button
          onClick={onExecute}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm
                     transition-colors flex items-center justify-center gap-2"
        >
          {status === 'completed' ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Re-run
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              Execute
            </>
          )}
        </button>
      )}

      {/* Running State */}
      {status === 'running' && (
        <div className="space-y-2">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-center text-gray-400">Processing...</p>
        </div>
      )}
    </div>
  )
}