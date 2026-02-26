'use client'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = 'left',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--charcoal)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === 'left' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--grey-400)]">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3
              text-[0.95rem] text-[var(--charcoal)]
              bg-white
              border border-[var(--grey-200)] rounded-lg
              placeholder:text-[var(--grey-400)]
              transition-all duration-200
              focus:outline-none focus:border-[var(--burnt-orange)] focus:ring-3 focus:ring-[var(--burnt-orange-muted)]
              disabled:bg-[var(--grey-100)] disabled:cursor-not-allowed
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error-muted)]' : ''}
              ${className}
            `}
            style={{ fontFamily: 'var(--font-body)' }}
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--grey-400)]">
              {icon}
            </span>
          )}
        </div>

        {error && (
          <span className="text-xs text-[var(--error)]">{error}</span>
        )}

        {hint && !error && (
          <span className="text-xs text-[var(--grey-500)]">{hint}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--charcoal)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3
            text-[0.95rem] text-[var(--charcoal)]
            bg-white
            border border-[var(--grey-200)] rounded-lg
            placeholder:text-[var(--grey-400)]
            transition-all duration-200
            focus:outline-none focus:border-[var(--burnt-orange)] focus:ring-3 focus:ring-[var(--burnt-orange-muted)]
            disabled:bg-[var(--grey-100)] disabled:cursor-not-allowed
            resize-y min-h-[100px]
            ${error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error-muted)]' : ''}
            ${className}
          `}
          style={{ fontFamily: 'var(--font-body)' }}
          {...props}
        />

        {error && (
          <span className="text-xs text-[var(--error)]">{error}</span>
        )}

        {hint && !error && (
          <span className="text-xs text-[var(--grey-500)]">{hint}</span>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
