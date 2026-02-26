'use client'

import { ReactNode } from 'react'
import { Clock, Rocket } from 'lucide-react'

interface OpportunityCardProps {
  score: number
  title: string
  description: string
  timeAgo?: string
  priority?: 'high' | 'medium' | 'low'
  onExecute?: () => void
  onClick?: () => void
}

export function OpportunityCard({
  score,
  title,
  description,
  timeAgo,
  priority = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
  onExecute,
  onClick
}: OpportunityCardProps) {
  const scoreColor = score >= 80
    ? 'text-[var(--burnt-orange)]'
    : score >= 60
    ? 'text-[var(--grey-400)]'
    : 'text-[var(--grey-500)]'

  return (
    <div
      className={`
        relative bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg p-[18px] cursor-pointer
        transition-all duration-200 hover:border-[var(--burnt-orange)]
        ${priority === 'high' ? 'before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-[var(--burnt-orange)] before:rounded-l-lg' : ''}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-xl font-bold ${scoreColor}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {score}
        </span>
        {timeAgo && (
          <span className="text-xs text-[var(--grey-500)] flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        )}
      </div>

      {/* Content */}
      <h4
        className="text-[0.95rem] font-medium text-white mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h4>
      <p className="text-[0.8rem] text-[var(--grey-400)] leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Execute Button */}
      {onExecute && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onExecute()
          }}
          className="mt-3 px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-md text-[0.8rem] font-medium flex items-center gap-1.5 hover:bg-[var(--burnt-orange-light)] transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Rocket className="w-3.5 h-3.5" />
          Execute
        </button>
      )}
    </div>
  )
}

// Section Header for grouping cards
interface SectionHeaderProps {
  title: string
  badge?: string | number
  action?: ReactNode
}

export function SectionHeader({ title, badge, action }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4 mt-6">
      <span
        className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--grey-500)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </span>
      {badge && (
        <span
          className="text-[0.7rem] font-medium text-[var(--burnt-orange)] bg-[var(--burnt-orange-muted)] px-2.5 py-1 rounded-xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {badge}
        </span>
      )}
      {action}
    </div>
  )
}
