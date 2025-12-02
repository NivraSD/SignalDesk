'use client'

import { ReactNode, HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  children: ReactNode
}

export function Badge({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]',
    secondary: 'bg-[var(--grey-100)] text-[var(--grey-600)]',
    dark: 'bg-[var(--charcoal)] text-white',
    outline: 'bg-transparent border border-[var(--burnt-orange)] text-[var(--burnt-orange)]',
    success: 'bg-[var(--success-muted)] text-[var(--success)]',
    warning: 'bg-[var(--warning-muted)] text-[var(--warning)]',
    error: 'bg-[var(--error-muted)] text-[var(--error)]',
  }

  const sizeStyles = {
    sm: 'text-[0.6rem] px-2 py-0.5',
    md: 'text-[0.7rem] px-3 py-1',
  }

  return (
    <span
      className={`
        inline-flex items-center
        font-[family-name:var(--font-display)] font-semibold
        uppercase tracking-wide
        rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}

// Score Badge (for opportunity scores)
interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-[var(--burnt-orange)] to-[var(--burnt-orange-light)]'
    if (score >= 60) return 'from-[var(--warning)] to-amber-400'
    return 'from-[var(--grey-500)] to-[var(--grey-400)]'
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center
        bg-gradient-to-br ${getScoreColor(score)}
        rounded-lg
        font-[family-name:var(--font-display)] font-bold
        text-white
        ${sizeStyles[size]}
      `}
    >
      {score}
    </span>
  )
}

// Status Badge with dot
interface StatusBadgeProps {
  status: 'active' | 'pending' | 'completed' | 'error' | 'draft'
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    active: { color: 'bg-[var(--success)]', text: 'Active', bgColor: 'bg-[var(--success-muted)]', textColor: 'text-[var(--success)]' },
    pending: { color: 'bg-[var(--warning)]', text: 'Pending', bgColor: 'bg-[var(--warning-muted)]', textColor: 'text-[var(--warning)]' },
    completed: { color: 'bg-[var(--burnt-orange)]', text: 'Completed', bgColor: 'bg-[var(--burnt-orange-muted)]', textColor: 'text-[var(--burnt-orange)]' },
    error: { color: 'bg-[var(--error)]', text: 'Error', bgColor: 'bg-[var(--error-muted)]', textColor: 'text-[var(--error)]' },
    draft: { color: 'bg-[var(--grey-400)]', text: 'Draft', bgColor: 'bg-[var(--grey-100)]', textColor: 'text-[var(--grey-600)]' },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        text-xs font-medium
        rounded-full
        ${config.bgColor} ${config.textColor}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      {label || config.text}
    </span>
  )
}

// Live Indicator
export function LiveIndicator({ label = 'Live' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--success)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
      {label}
    </span>
  )
}
