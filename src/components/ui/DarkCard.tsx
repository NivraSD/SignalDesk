'use client'

import { ReactNode, HTMLAttributes } from 'react'

interface DarkCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function DarkCard({ children, className = '', ...props }: DarkCardProps) {
  return (
    <div
      className={`bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

interface DarkCardHeaderProps {
  label: string
  showDot?: boolean
  action?: ReactNode
}

export function DarkCardHeader({ label, showDot = true, action }: DarkCardHeaderProps) {
  return (
    <div className="px-5 py-4 border-b border-[var(--grey-800)] flex items-center justify-between">
      <div
        className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--burnt-orange)] flex items-center gap-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {showDot && (
          <span className="w-1.5 h-1.5 bg-[var(--burnt-orange)] rounded-full" />
        )}
        {label}
      </div>
      {action}
    </div>
  )
}

interface DarkCardBodyProps {
  children: ReactNode
  className?: string
}

export function DarkCardBody({ children, className = '' }: DarkCardBodyProps) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  )
}

interface DarkCardTextProps {
  children: ReactNode
  className?: string
}

export function DarkCardText({ children, className = '' }: DarkCardTextProps) {
  return (
    <p
      className={`text-base leading-relaxed text-[var(--grey-200)] ${className}`}
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      {children}
    </p>
  )
}

// Convenience styled <em> for accent text
export function AccentText({ children }: { children: ReactNode }) {
  return (
    <em className="not-italic text-[var(--burnt-orange)]">
      {children}
    </em>
  )
}
