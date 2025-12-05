'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface CampaignIntelligenceBrief {
  stakeholders?: Array<{
    name: string
    size: number
    psychology: {
      values: string[]
      fears: string[]
      aspirations: string[]
    }
    currentPerceptions: {
      ofOrganization: string
      ofIndustry: string
    }
  }>
  narrativeLandscape?: {
    dominantNarratives: Array<{
      narrative: string
      source: string
      resonance: string
    }>
    narrativeVacuums: Array<{
      opportunity: string
      rationale: string
    }>
    competitivePositioning: any[]
  }
  channelIntelligence?: {
    byStakeholder: any[]
    journalists: any[]
    publications: any[]
  }
  historicalInsights?: {
    successfulCampaigns: any[]
    successFactors: any[]
    patternRecommendations: any[]
    riskFactors: any[]
  }
  keyInsights?: Array<{
    insight: string
    category: string
    significance: string
    actionImplication: string
  }>
  synthesisQuality?: {
    completeness: number
    confidence: number
    dataGaps: string[]
  }
}

interface ResearchPresentationProps {
  research: CampaignIntelligenceBrief
  onProceed: () => void
  onRefine: (request: string) => void
  isRefining?: boolean
  isProceeding?: boolean
}

export function ResearchPresentation({
  research,
  onProceed,
  onRefine,
  isRefining,
  isProceeding
}: ResearchPresentationProps) {
  // All sections open by default - use Set to track multiple open sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['stakeholders', 'narratives', 'channels', 'historical'])
  )
  const [refinementInput, setRefinementInput] = useState('')
  const [showRefinementInput, setShowRefinementInput] = useState(false)

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleRefineSubmit = () => {
    if (refinementInput.trim()) {
      onRefine(refinementInput.trim())
      setRefinementInput('')
      setShowRefinementInput(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-6 h-6 animate-pulse" style={{ color: 'var(--burnt-orange)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Campaign Research Complete</h2>
        </div>
        <p style={{ color: 'var(--grey-400)' }}>
          Executive-level intelligence synthesis across stakeholders, narratives, channels, and historical patterns
        </p>

        {research.synthesisQuality && (
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--grey-400)' }}>Completeness:</span>
              <span className="text-white font-medium">{Math.round((research.synthesisQuality.completeness || 0) * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--grey-400)' }}>Confidence:</span>
              <span className="text-white font-medium">{Math.round((research.synthesisQuality.confidence || 0) * 100)}%</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Key Insights */}
      {research.keyInsights && research.keyInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg p-6"
          style={{ background: 'var(--burnt-orange-muted)', border: '1px solid var(--burnt-orange)' }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--burnt-orange)', color: 'var(--white)' }}>!</div>
            Key Strategic Insights
          </h3>
          <div className="space-y-3">
            {research.keyInsights.map((insight, i) => (
              <div key={i} className="flex gap-3">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  insight.significance === 'critical' ? 'bg-red-500' :
                  insight.significance === 'high' ? 'bg-amber-500' : ''
                }`} style={insight.significance !== 'critical' && insight.significance !== 'high' ? { background: 'var(--burnt-orange)' } : {}} />
                <div className="flex-1">
                  <p className="text-white text-sm">{insight.insight}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--grey-400)' }}>
                    <span style={{ color: 'var(--burnt-orange)' }}>Action:</span> {insight.actionImplication}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stakeholder Intelligence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
      >
        <button
          onClick={() => toggleSection('stakeholders')}
          className="w-full p-4 text-left transition-colors hover:brightness-110"
          style={{ background: 'var(--grey-900)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--burnt-orange)', color: 'var(--white)' }}>1</div>
              <div>
                <h3 className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Stakeholder Intelligence</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--grey-400)' }}>
                  {research.stakeholders?.length || 0} stakeholder groups with deep psychological profiling
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${expandedSections.has('stakeholders') ? 'rotate-180' : ''}`}
              style={{ color: 'var(--grey-400)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {expandedSections.has('stakeholders') && research.stakeholders && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 pb-4"
            style={{ borderTop: '1px solid var(--grey-800)' }}
          >
            <div className="pt-4 space-y-4">
              {research.stakeholders.map((stakeholder, i) => (
                <div key={i} className="rounded-lg p-4" style={{ background: 'var(--grey-800)' }}>
                  <h4 className="font-medium text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>{stakeholder.name}</h4>
                  <p className="text-sm mb-3" style={{ color: 'var(--grey-400)' }}>Size: {stakeholder.size?.toLocaleString()} people</p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-medium mb-1" style={{ color: 'var(--burnt-orange)' }}>Values</p>
                      <ul className="space-y-0.5" style={{ color: 'var(--grey-300)' }}>
                        {stakeholder.psychology?.values?.slice(0, 3).map((v, idx) => (
                          <li key={idx}>• {v}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-red-400 font-medium mb-1">Fears</p>
                      <ul className="space-y-0.5" style={{ color: 'var(--grey-300)' }}>
                        {stakeholder.psychology?.fears?.slice(0, 3).map((f, idx) => (
                          <li key={idx}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3 text-xs">
                    <p style={{ color: 'var(--grey-400)' }}>
                      <span style={{ color: 'var(--burnt-orange)' }}>Current Perception:</span> {stakeholder.currentPerceptions?.ofOrganization}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Narrative Landscape */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
      >
        <button
          onClick={() => toggleSection('narratives')}
          className="w-full p-4 text-left transition-colors hover:brightness-110"
          style={{ background: 'var(--grey-900)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--burnt-orange)', color: 'var(--white)' }}>2</div>
              <div>
                <h3 className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Narrative Landscape</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--grey-400)' }}>
                  {research.narrativeLandscape?.dominantNarratives?.length || 0} dominant narratives, {research.narrativeLandscape?.narrativeVacuums?.length || 0} opportunities
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${expandedSections.has('narratives') ? 'rotate-180' : ''}`}
              style={{ color: 'var(--grey-400)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {expandedSections.has('narratives') && research.narrativeLandscape && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 pb-4"
            style={{ borderTop: '1px solid var(--grey-800)' }}
          >
            <div className="pt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Dominant Narratives</h4>
                <div className="space-y-2">
                  {research.narrativeLandscape.dominantNarratives?.map((narrative, i) => (
                    <div key={i} className="rounded p-3 text-sm" style={{ background: 'var(--grey-800)' }}>
                      <p className="text-white">{narrative.narrative}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--grey-400)' }}>
                        Source: {narrative.source} • Resonance: {narrative.resonance}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {research.narrativeLandscape.narrativeVacuums && research.narrativeLandscape.narrativeVacuums.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}>Narrative Opportunities</h4>
                  <div className="space-y-2">
                    {research.narrativeLandscape.narrativeVacuums.map((vacuum, i) => (
                      <div key={i} className="rounded p-3 text-sm" style={{ background: 'var(--burnt-orange-muted)', border: '1px solid var(--burnt-orange)' }}>
                        <p className="text-white font-medium">{vacuum.opportunity}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--grey-300)' }}>{vacuum.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Channel Intelligence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
      >
        <button
          onClick={() => toggleSection('channels')}
          className="w-full p-4 text-left transition-colors hover:brightness-110"
          style={{ background: 'var(--grey-900)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--burnt-orange)', color: 'var(--white)' }}>3</div>
              <div>
                <h3 className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Channel Intelligence</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--grey-400)' }}>
                  {research.channelIntelligence?.journalists?.length || 0} journalists, {research.channelIntelligence?.publications?.length || 0} publications
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${expandedSections.has('channels') ? 'rotate-180' : ''}`}
              style={{ color: 'var(--grey-400)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {expandedSections.has('channels') && research.channelIntelligence && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 pb-4"
            style={{ borderTop: '1px solid var(--grey-800)' }}
          >
            <div className="pt-4 space-y-4 text-sm">
              <div>
                <h4 className="text-white font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>Top Journalists</h4>
                <div className="space-y-2">
                  {research.channelIntelligence.journalists?.slice(0, 5).map((j, i) => (
                    <div key={i} className="flex justify-between items-start rounded p-2" style={{ background: 'var(--grey-800)' }}>
                      <div>
                        <p className="text-white">{j.name}</p>
                        <p className="text-xs" style={{ color: 'var(--grey-400)' }}>{j.outlet} • {j.beat}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)' }}>{j.tier}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>Key Publications</h4>
                <div className="flex flex-wrap gap-2">
                  {research.channelIntelligence.publications?.map((p, i) => (
                    <span key={i} className="px-3 py-1 rounded text-xs" style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}>
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Historical Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
      >
        <button
          onClick={() => toggleSection('historical')}
          className="w-full p-4 text-left transition-colors hover:brightness-110"
          style={{ background: 'var(--grey-900)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--burnt-orange)', color: 'var(--white)' }}>4</div>
              <div>
                <h3 className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Historical Insights</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--grey-400)' }}>
                  {research.historicalInsights?.successfulCampaigns?.length || 0} case studies, {research.historicalInsights?.patternRecommendations?.length || 0} patterns
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${expandedSections.has('historical') ? 'rotate-180' : ''}`}
              style={{ color: 'var(--grey-400)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {expandedSections.has('historical') && research.historicalInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 pb-4"
            style={{ borderTop: '1px solid var(--grey-800)' }}
          >
            <div className="pt-4 space-y-4 text-sm">
              {research.historicalInsights.successfulCampaigns && research.historicalInsights.successfulCampaigns.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>Successful Campaigns</h4>
                  <div className="space-y-2">
                    {research.historicalInsights.successfulCampaigns.map((campaign, i) => (
                      <div key={i} className="rounded p-3" style={{ background: 'var(--grey-800)' }}>
                        <p className="text-white font-medium">{campaign.campaign}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--grey-300)' }}>{campaign.approach}</p>
                        {campaign.keyLessons && (
                          <ul className="mt-2 space-y-1">
                            {campaign.keyLessons.map((lesson: string, idx: number) => (
                              <li key={idx} className="text-xs" style={{ color: 'var(--grey-400)' }}>• {lesson}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {research.historicalInsights.patternRecommendations && research.historicalInsights.patternRecommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}>Pattern Recommendations</h4>
                  <div className="space-y-2">
                    {research.historicalInsights.patternRecommendations.map((pattern, i) => (
                      <div key={i} className="rounded p-3" style={{ background: 'var(--burnt-orange-muted)', border: '1px solid var(--burnt-orange)' }}>
                        <p className="text-white font-medium">{pattern.pattern}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--grey-300)' }}>{pattern.implementation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Refinement Input */}
      {showRefinementInput && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <textarea
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            placeholder="What would you like me to refine or explore further? (e.g., 'Tell me more about tech early adopters', 'Research competitor X in detail')"
            className="w-full h-24 rounded-lg px-4 py-3 text-white resize-none focus:outline-none transition-colors"
            style={{
              background: 'var(--grey-900)',
              border: '1px solid var(--grey-800)',
              color: 'var(--white)'
            }}
            disabled={isRefining}
          />
          <div className="flex gap-2">
            <button
              onClick={handleRefineSubmit}
              disabled={!refinementInput.trim() || isRefining}
              className="px-4 py-2 text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
            >
              {isRefining ? 'Refining...' : 'Refine Research'}
            </button>
            <button
              onClick={() => {
                setShowRefinementInput(false)
                setRefinementInput('')
              }}
              className="px-4 py-2 text-white rounded-lg font-medium transition-all hover:brightness-110"
              style={{ background: 'var(--grey-800)', fontFamily: 'var(--font-display)' }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      {!showRefinementInput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid var(--grey-800)' }}
        >
          <button
            onClick={() => setShowRefinementInput(true)}
            disabled={isRefining}
            className="flex items-center gap-2 px-4 py-2 transition-colors hover:text-white"
            style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Request Refinement
          </button>

          <button
            onClick={onProceed}
            disabled={isRefining || isProceeding}
            className="px-6 py-3 text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
          >
            {isProceeding ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Positioning...
              </>
            ) : (
              <>
                Proceed to Positioning
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Loading State for Refinement */}
      {isRefining && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-4"
          style={{ color: 'var(--burnt-orange)' }}
        >
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Refining research with targeted follow-up searches...
        </motion.div>
      )}
    </div>
  )
}
