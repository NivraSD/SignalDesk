'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Download, Calendar, Target, FileText, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface StrategicCampaign {
  id: string
  organization_id: string
  blueprint_id: string
  campaign_name: string
  campaign_goal: string
  industry: string
  positioning: string
  core_narrative: string
  start_date: string
  end_date: string
  timeline: any
  blueprint: any
  phases: CampaignPhase[]
  requirements: CampaignRequirements
  campaign_summary: any
  research_insights: string[]
  key_messages: string[]
  target_stakeholders: string[]
  architecture: string
  status: 'planning' | 'in-progress' | 'paused' | 'completed' | 'archived'
  total_content_pieces: number
  phases_completed: number
  overall_performance: any
  created_at: string
  updated_at: string
  completed_at?: string
}

interface CampaignPhase {
  phase: string
  phaseNumber: number
  startDate: string
  endDate: string
  status: 'planned' | 'in-progress' | 'completed'
  objective: string
  narrative: string
  keyMessages: string[]
  content: ContentPiece[]
}

interface ContentPiece {
  id: string
  type: string
  stakeholder: string
  brief: string
  content: string
  status: 'draft' | 'approved' | 'published'
  folder: string
  generatedAt: string
  performance?: {
    views: number
    engagement: number
    conversions: number
  }
}

interface CampaignRequirements {
  resources: string[]
  dependencies: string[]
  approvals: string[]
}

export default function StrategicPlanningView({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<StrategicCampaign | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<number>(0)
  const [selectedContent, setSelectedContent] = useState<ContentPiece | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaign()
  }, [campaignId])

  const loadCampaign = async () => {
    const { data, error } = await supabase
      .from('strategic_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error) {
      console.error('Error loading campaign:', error)
      setLoading(false)
      return
    }

    setCampaign(data)
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-600'
    }
    return colors[status as keyof typeof colors] || colors.planning
  }

  const getPhaseStatusIcon = (status: string) => {
    const icons = {
      planned: <Clock className="w-4 h-4" />,
      'in-progress': <TrendingUp className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons] || icons.planned
  }

  const exportCampaign = async () => {
    // TODO: Implement PDF export
    console.log('Exporting campaign:', campaign)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h2>
          <p className="text-gray-600">The requested campaign could not be loaded.</p>
        </div>
      </div>
    )
  }

  const currentPhase = campaign.phases[selectedPhase]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaign.campaign_name}</h1>
              <p className="mt-2 text-lg text-gray-600">{campaign.campaign_goal}</p>
              <div className="mt-4 flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
                <span className="text-sm text-gray-500">
                  {campaign.architecture} • {campaign.industry}
                </span>
              </div>
            </div>
            <button
              onClick={exportCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Campaign Timeline
          </h2>
          <div className="flex items-center gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-lg font-semibold">{new Date(campaign.start_date).toLocaleDateString()}</p>
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(campaign.phases_completed / campaign.phases.length) * 100}%` }}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="text-lg font-semibold">{new Date(campaign.end_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{campaign.total_content_pieces}</p>
              <p className="text-sm text-gray-600">Content Pieces</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{campaign.phases_completed}/{campaign.phases.length}</p>
              <p className="text-sm text-gray-600">Phases Complete</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{campaign.key_messages.length}</p>
              <p className="text-sm text-gray-600">Key Messages</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{campaign.target_stakeholders.length}</p>
              <p className="text-sm text-gray-600">Stakeholders</p>
            </div>
          </div>
        </div>

        {/* Strategic Context */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Strategic Foundation
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Positioning</p>
                <p className="text-gray-900">{campaign.positioning}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Core Narrative</p>
                <p className="text-gray-900">{campaign.core_narrative}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Key Messages</p>
                <ul className="mt-2 space-y-1">
                  {campaign.key_messages.map((msg, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements & Dependencies</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Resources</p>
                <ul className="mt-2 space-y-1">
                  {campaign.requirements.resources?.map((resource, idx) => (
                    <li key={idx} className="text-sm text-gray-700">• {resource}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dependencies</p>
                <ul className="mt-2 space-y-1">
                  {campaign.requirements.dependencies?.map((dep, idx) => (
                    <li key={idx} className="text-sm text-gray-700">• {dep}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Approvals Needed</p>
                <ul className="mt-2 space-y-1">
                  {campaign.requirements.approvals?.map((approval, idx) => (
                    <li key={idx} className="text-sm text-gray-700">• {approval}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {campaign.phases.map((phase, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhase(idx)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedPhase === idx
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Phase {phase.phaseNumber}</span>
                  <span className={`${
                    phase.status === 'completed' ? 'text-green-600' :
                    phase.status === 'in-progress' ? 'text-blue-600' :
                    'text-gray-400'
                  }`}>
                    {getPhaseStatusIcon(phase.status)}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 capitalize">{phase.phase}</p>
                <p className="text-xs text-gray-500 mt-1">{phase.content.length} pieces</p>
              </button>
            ))}
          </div>

          {/* Phase Details */}
          {currentPhase && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">{currentPhase.phase} Phase</h3>
                <p className="text-gray-600 mb-4">{currentPhase.objective}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Phase Narrative</p>
                  <p className="text-gray-900">{currentPhase.narrative}</p>
                </div>
              </div>

              {/* Content Library */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generated Content ({currentPhase.content.length})
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {currentPhase.content.map((content, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedContent(content)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{content.type}</p>
                          <p className="text-sm text-gray-500">For: {content.stakeholder}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          content.status === 'published' ? 'bg-green-100 text-green-800' :
                          content.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {content.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{content.brief}</p>
                      {content.performance && (
                        <div className="mt-3 flex gap-4 text-xs">
                          <span className="text-gray-500">👁️ {content.performance.views} views</span>
                          <span className="text-gray-500">💬 {content.performance.engagement} engagement</span>
                          <span className="text-gray-500">✅ {content.performance.conversions} conversions</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Viewer Modal */}
        {selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedContent.type}</h3>
                    <p className="text-gray-500">For: {selectedContent.stakeholder}</p>
                  </div>
                  <button
                    onClick={() => setSelectedContent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-500 mb-2">Strategic Brief</p>
                  <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{selectedContent.brief}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Generated Content</p>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-900">{selectedContent.content}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
