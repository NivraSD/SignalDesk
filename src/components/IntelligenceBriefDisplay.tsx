'use client'

import React from 'react'
import {
  TrendingUp,
  Eye,
  AlertTriangle,
  Target,
  Lightbulb,
  Clock,
  ChevronRight
} from 'lucide-react'

interface IntelligenceBriefDisplayProps {
  synthesis: any
}

export default function IntelligenceBriefDisplay({ synthesis }: IntelligenceBriefDisplayProps) {
  // Handle various data structures - the synthesis might be nested
  const data = synthesis?.synthesis || synthesis?.synthesis_data?.synthesis || synthesis

  if (!data) {
    return (
      <div className="text-center py-12">
        <Eye className="w-12 h-12 mx-auto mb-4 text-[var(--grey-600)]" />
        <p className="text-[var(--grey-400)]">No intelligence data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {data.executive_summary && (
        <Section title="Executive Summary" icon={Eye}>
          <p className="text-[var(--grey-200)] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-serif)' }}>
            {data.executive_summary}
          </p>
        </Section>
      )}

      {/* Key Developments */}
      {data.key_developments && data.key_developments.length > 0 && (
        <Section title="Key Developments" icon={TrendingUp}>
          <div className="space-y-3">
            {data.key_developments.map((dev: any, i: number) => (
              <DevelopmentCard key={i} development={dev} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* Key Findings (GEO format) */}
      {data.key_findings && data.key_findings.length > 0 && (
        <Section title="Key Findings" icon={Lightbulb}>
          <div className="space-y-3">
            {data.key_findings.map((finding: any, i: number) => (
              <FindingCard key={i} finding={finding} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* Strategic Implications */}
      {data.strategic_implications && (
        <Section title="Strategic Implications" icon={Target}>
          <p className="text-[var(--grey-200)] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-serif)' }}>
            {data.strategic_implications}
          </p>
        </Section>
      )}

      {/* Competitive Analysis */}
      {data.competitive_analysis && (
        <Section title="Competitive Analysis" icon={Target}>
          {data.competitive_analysis.dominant_players && (
            <div className="mb-4">
              <h4 className="text-[0.75rem] uppercase tracking-wider text-[var(--grey-500)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Key Players
              </h4>
              <div className="grid gap-2">
                {data.competitive_analysis.dominant_players.map((player: any, i: number) => (
                  <div key={i} className="bg-[var(--grey-800)] rounded-lg p-3">
                    <div className="text-white font-medium mb-1">{player.name}</div>
                    <div className="text-[var(--grey-400)] text-sm">{player.visibility}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.competitive_analysis.success_patterns && (
            <div className="mb-4">
              <h4 className="text-[0.75rem] uppercase tracking-wider text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Success Patterns
              </h4>
              <p className="text-[var(--grey-300)] text-sm">{data.competitive_analysis.success_patterns}</p>
            </div>
          )}
          {data.competitive_analysis.gaps_for_target && (
            <div>
              <h4 className="text-[0.75rem] uppercase tracking-wider text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Gaps to Address
              </h4>
              <p className="text-[var(--grey-300)] text-sm">{data.competitive_analysis.gaps_for_target}</p>
            </div>
          )}
        </Section>
      )}

      {/* Competitive Moves (PR format) */}
      {data.competitive_moves && (
        <Section title="Competitive Intelligence" icon={Target}>
          {data.competitive_moves.immediate_threats?.length > 0 && (
            <AlertList
              title="Immediate Threats"
              items={data.competitive_moves.immediate_threats}
              variant="danger"
            />
          )}
          {data.competitive_moves.opportunities?.length > 0 && (
            <AlertList
              title="Opportunities"
              items={data.competitive_moves.opportunities}
              variant="success"
            />
          )}
          {data.competitive_moves.narrative_gaps?.length > 0 && (
            <AlertList
              title="Narrative Gaps"
              items={data.competitive_moves.narrative_gaps}
              variant="warning"
            />
          )}
        </Section>
      )}

      {/* Watching Closely */}
      {data.watching_closely && data.watching_closely.length > 0 && (
        <Section title="Watching Closely" icon={Eye}>
          <ul className="space-y-2">
            {data.watching_closely.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-[var(--grey-300)] text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-[var(--burnt-orange)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Source Strategy */}
      {data.source_strategy && (
        <Section title="Source Strategy" icon={Target}>
          {data.source_strategy.priority_publications?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[0.75rem] uppercase tracking-wider text-[var(--grey-500)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Priority Publications
              </h4>
              <div className="grid gap-2">
                {data.source_strategy.priority_publications.map((pub: any, i: number) => (
                  <div key={i} className="bg-[var(--grey-800)] rounded-lg p-3">
                    <div className="text-[var(--burnt-orange)] font-medium mb-1">{pub.name}</div>
                    <div className="text-[var(--grey-400)] text-sm mb-2">{pub.reasoning}</div>
                    <div className="text-[var(--grey-500)] text-xs">Action: {pub.action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.source_strategy.coverage_strategy && (
            <div>
              <h4 className="text-[0.75rem] uppercase tracking-wider text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Coverage Strategy
              </h4>
              <p className="text-[var(--grey-300)] text-sm">{data.source_strategy.coverage_strategy}</p>
            </div>
          )}
        </Section>
      )}

      {/* Strategic Actions */}
      {data.strategic_actions && data.strategic_actions.length > 0 && (
        <Section title="Strategic Actions" icon={Target}>
          <div className="space-y-3">
            {data.strategic_actions.map((action: any, i: number) => (
              <ActionCard key={i} action={action} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* PR Actions */}
      {data.pr_actions && (
        <Section title="PR Action Items" icon={Target}>
          {data.pr_actions.immediate?.length > 0 && (
            <ActionList title="Immediate (24-48h)" items={data.pr_actions.immediate} variant="urgent" />
          )}
          {data.pr_actions.this_week?.length > 0 && (
            <ActionList title="This Week" items={data.pr_actions.this_week} variant="normal" />
          )}
          {data.pr_actions.strategic?.length > 0 && (
            <ActionList title="Strategic" items={data.pr_actions.strategic} variant="low" />
          )}
        </Section>
      )}

      {/* Risk Alerts */}
      {data.risk_alerts && (
        <Section title="Risk Monitoring" icon={AlertTriangle}>
          {data.risk_alerts.crisis_signals?.length > 0 && (
            <AlertList title="Crisis Signals" items={data.risk_alerts.crisis_signals} variant="warning" />
          )}
          {data.risk_alerts.reputation_threats?.length > 0 && (
            <AlertList title="Reputation Threats" items={data.risk_alerts.reputation_threats} variant="danger" />
          )}
          {data.risk_alerts.mitigation_steps?.length > 0 && (
            <AlertList title="Mitigation Steps" items={data.risk_alerts.mitigation_steps} variant="info" />
          )}
        </Section>
      )}

      {/* Metadata */}
      {(synthesis.metadata || synthesis.meta) && (
        <div className="flex items-center justify-between text-xs text-[var(--grey-500)] pt-4 border-t border-[var(--grey-800)]">
          <span>
            Generated: {new Date(synthesis.metadata?.timestamp || synthesis.metadata?.analysis_date || synthesis.meta?.generated_at || Date.now()).toLocaleString()}
          </span>
          <span>
            {synthesis.metadata?.events_analyzed || synthesis.metadata?.articles_analyzed || synthesis.meta?.scenarios_analyzed || 0} items analyzed
          </span>
        </div>
      )}
    </div>
  )
}

// Section Component
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--grey-800)] flex items-center gap-3">
        <Icon className="w-4 h-4 text-[var(--burnt-orange)]" />
        <h3
          className="text-[0.8rem] uppercase tracking-wider text-white font-medium"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// Development Card
function DevelopmentCard({ development, index }: { development: any; index: number }) {
  return (
    <div className="bg-[var(--grey-800)] rounded-lg p-4">
      <div className="flex items-start gap-3 mb-2">
        {development.category && (
          <span className="px-2 py-1 text-xs rounded bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]">
            {development.category.replace(/_/g, ' ')}
          </span>
        )}
        {development.recency && (
          <span className="px-2 py-1 text-xs rounded bg-[var(--grey-700)] text-[var(--grey-400)]">
            {development.recency}
          </span>
        )}
      </div>
      <h4 className="text-white font-medium mb-2">{development.event || development.headline}</h4>
      <p className="text-[var(--grey-400)] text-sm">{development.impact || development.details}</p>
      {development.source && (
        <div className="mt-2 text-xs text-[var(--grey-500)]">
          Source:{' '}
          {development.url && development.url.startsWith('http') ? (
            <a
              href={development.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--burnt-orange)] hover:underline"
            >
              {development.source}
            </a>
          ) : (
            development.source
          )}
        </div>
      )}
    </div>
  )
}

// Finding Card (for GEO format)
function FindingCard({ finding, index }: { finding: any; index: number }) {
  const isCritical = finding.priority === 'critical'

  return (
    <div className={`rounded-lg p-4 ${isCritical ? 'bg-red-900/20 border border-red-800/50' : 'bg-[var(--grey-800)]'}`}>
      <div className="flex items-start gap-3">
        <span className={`text-lg font-bold ${isCritical ? 'text-red-400' : 'text-[var(--burnt-orange)]'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1">
          <h4 className="text-white font-medium mb-2">{finding.title}</h4>
          <p className="text-[var(--grey-300)] text-sm mb-2">{finding.insight}</p>
          {finding.evidence && (
            <p className="text-[var(--grey-500)] text-xs border-t border-[var(--grey-700)] pt-2 mt-2">
              {finding.evidence}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Action Card
function ActionCard({ action, index }: { action: any; index: number }) {
  const isCritical = action.priority === 'critical'

  return (
    <div className={`rounded-lg p-4 ${isCritical ? 'bg-red-900/20 border border-red-800/50' : 'bg-[var(--grey-800)]'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className={`font-medium ${isCritical ? 'text-red-400' : 'text-white'}`}>
          {action.action}
        </h4>
        {action.category && (
          <span className="px-2 py-1 text-xs rounded bg-[var(--grey-700)] text-[var(--grey-400)] shrink-0">
            {action.category}
          </span>
        )}
      </div>
      <p className="text-[var(--grey-400)] text-sm mb-3">{action.reasoning}</p>
      <div className="flex gap-4 text-xs text-[var(--grey-500)]">
        {action.expected_impact && <span>Impact: {action.expected_impact}</span>}
        {action.timeline && <span>Timeline: {action.timeline}</span>}
      </div>
    </div>
  )
}

// Alert List
function AlertList({ title, items, variant }: { title: string; items: string[]; variant: 'danger' | 'warning' | 'success' | 'info' }) {
  const colors = {
    danger: 'text-red-400',
    warning: 'text-yellow-400',
    success: 'text-green-400',
    info: 'text-[var(--burnt-orange)]'
  }

  return (
    <div className="mb-4 last:mb-0">
      <h4 className={`text-[0.75rem] uppercase tracking-wider mb-2 ${colors[variant]}`} style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[var(--grey-300)] text-sm">
            <ChevronRight className={`w-4 h-4 mt-0.5 ${colors[variant]} shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Action List
function ActionList({ title, items, variant }: { title: string; items: string[]; variant: 'urgent' | 'normal' | 'low' }) {
  const colors = {
    urgent: 'text-red-400 bg-red-900/20',
    normal: 'text-[var(--burnt-orange)] bg-[var(--burnt-orange-muted)]',
    low: 'text-[var(--grey-400)] bg-[var(--grey-800)]'
  }

  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-[0.75rem] uppercase tracking-wider text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={`p-3 rounded-lg text-sm ${colors[variant]}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
