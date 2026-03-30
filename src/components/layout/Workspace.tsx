'use client'

import { ReactNode } from 'react'

interface WorkspaceHeaderProps {
  date?: string
  greeting?: ReactNode
  children?: ReactNode
}

export function WorkspaceHeader({ date, greeting, children }: WorkspaceHeaderProps) {
  const formattedDate = date || new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="px-8 py-6 border-b border-[var(--grey-800)]">
      {date !== undefined && (
        <div
          className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--grey-500)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {formattedDate}
        </div>
      )}
      {greeting && (
        <h1
          className="text-2xl font-normal text-white leading-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {greeting}
        </h1>
      )}
      {children}
    </div>
  )
}

interface WorkspaceContentProps {
  children: ReactNode
  className?: string
}

export function WorkspaceContent({ children, className = '' }: WorkspaceContentProps) {
  return (
    <div className={`flex-1 px-8 py-6 overflow-y-auto ${className}`}>
      {children}
    </div>
  )
}

interface WorkspaceProps {
  children: ReactNode
  className?: string
}

export function Workspace({ children, className = '' }: WorkspaceProps) {
  return (
    <div className={`flex-1 flex flex-col bg-[var(--charcoal)] overflow-hidden ${className}`}>
      {children}
    </div>
  )
}
