'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      loading = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-[family-name:var(--font-display)] font-medium
      rounded-lg cursor-pointer
      transition-all duration-200 ease-out
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variantStyles = {
      primary: `
        bg-[var(--charcoal)] text-white
        hover:bg-[var(--burnt-orange)]
        active:scale-[0.98]
      `,
      secondary: `
        bg-white text-[var(--charcoal)]
        border border-[var(--grey-200)]
        hover:border-[var(--grey-300)] hover:bg-[var(--grey-100)]
        active:scale-[0.98]
      `,
      accent: `
        bg-[var(--burnt-orange)] text-white
        hover:bg-[var(--burnt-orange-light)]
        active:scale-[0.98]
      `,
      ghost: `
        bg-transparent text-[var(--charcoal)]
        hover:bg-[var(--grey-100)]
        active:scale-[0.98]
      `,
      outline: `
        bg-transparent text-[var(--burnt-orange)]
        border border-[var(--burnt-orange)]
        hover:bg-[var(--burnt-orange-muted)]
        active:scale-[0.98]
      `,
    }

    const sizeStyles = {
      sm: 'text-xs px-3 py-2',
      md: 'text-sm px-4 py-2.5',
      lg: 'text-base px-6 py-3',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
