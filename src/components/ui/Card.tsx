'use client'

import { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'accent' | 'ghost'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  children: ReactNode
}

export function Card({
  variant = 'default',
  padding = 'md',
  hover = true,
  children,
  className = '',
  ...props
}: CardProps) {
  const variantStyles = {
    default: `
      bg-white
      border border-[var(--grey-200)]
      ${hover ? 'hover:shadow-[var(--shadow-md)] hover:border-[var(--grey-300)]' : ''}
    `,
    dark: `
      bg-[var(--charcoal)]
      border border-[var(--grey-800)]
      text-white
      ${hover ? 'hover:border-[var(--grey-700)]' : ''}
    `,
    accent: `
      bg-[var(--burnt-orange)]
      text-white
      ${hover ? 'hover:bg-[var(--burnt-orange-light)]' : ''}
    `,
    ghost: `
      bg-transparent
      border border-[var(--grey-200)]
      ${hover ? 'hover:bg-[var(--grey-100)]' : ''}
    `,
  }

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  }

  return (
    <div
      className={`
        rounded-xl
        transition-all duration-200
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between mb-4 ${className}`}
      {...props}
    >
      <div>
        <h3
          className="text-lg font-semibold text-[var(--charcoal)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-[var(--grey-500)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Card Content
export function CardContent({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

// Card Footer
export function CardFooter({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`mt-4 pt-4 border-t border-[var(--grey-200)] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Stat Card (for dashboard stats)
interface StatCardProps {
  label: string
  value: string | number
  change?: {
    value: string
    type: 'positive' | 'negative' | 'neutral'
  }
  icon?: ReactNode
}

export function StatCard({ label, value, change, icon }: StatCardProps) {
  const changeColors = {
    positive: 'text-[var(--success)]',
    negative: 'text-[var(--error)]',
    neutral: 'text-[var(--grey-500)]',
  }

  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm text-[var(--grey-500)] mb-1">{label}</p>
        <p
          className="text-2xl font-semibold text-[var(--charcoal)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {value}
        </p>
        {change && (
          <p className={`text-xs mt-1 ${changeColors[change.type]}`}>
            {change.value}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-2 bg-[var(--burnt-orange-muted)] rounded-lg text-[var(--burnt-orange)]">
          {icon}
        </div>
      )}
    </Card>
  )
}
