'use client'

interface LogoProps {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  showByline?: boolean
  className?: string
}

const sizes = {
  sm: { width: 60, height: 36, fontSize: 16, bylineSize: 10 },
  md: { width: 80, height: 48, fontSize: 22, bylineSize: 12 },
  lg: { width: 120, height: 72, fontSize: 32, bylineSize: 14 },
}

export function Logo({
  variant = 'dark',
  size = 'md',
  showByline = true,
  className = ''
}: LogoProps) {
  const { width, height, fontSize, bylineSize } = sizes[size]

  // Dark variant = dark background with light text (for dark sections)
  // Light variant = light background with dark text (for light sections)
  const bgColor = variant === 'dark' ? '#1a1a1a' : '#faf9f7'
  const textColor = variant === 'dark' ? '#faf9f7' : '#1a1a1a'
  const bylineColor = variant === 'dark' ? 'var(--grey-400)' : 'var(--grey-500)'
  const dividerColor = variant === 'dark' ? 'var(--grey-600)' : 'rgba(0,0,0,0.2)'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width={width} height={height} viewBox="0 0 80 48">
        <path d="M10 0 H80 V48 H0 L10 0 Z" fill={bgColor} />
        <text
          x="40"
          y="33"
          textAnchor="middle"
          fontFamily="Space Grotesk, sans-serif"
          fontSize={fontSize}
          fontWeight="700"
          fill={textColor}
          letterSpacing="-0.5"
        >
          NIV
        </text>
        <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
      </svg>

      {showByline && (
        <div
          className="flex items-center gap-3"
          style={{
            marginTop: size === 'sm' ? 4 : size === 'md' ? 6 : 8,
            alignSelf: 'flex-end'
          }}
        >
          <span
            style={{
              color: dividerColor,
              fontSize: bylineSize + 8,
              fontWeight: 200,
              lineHeight: 1
            }}
          >
            |
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: bylineSize,
              color: bylineColor,
              letterSpacing: '1px'
            }}
          >
            by nivria
          </span>
        </div>
      )}
    </div>
  )
}

// Standalone logo mark without byline
export function LogoMark({
  variant = 'dark',
  size = 'md',
  className = ''
}: Omit<LogoProps, 'showByline'>) {
  const { width, height, fontSize } = sizes[size]

  const bgColor = variant === 'dark' ? '#1a1a1a' : '#faf9f7'
  const textColor = variant === 'dark' ? '#faf9f7' : '#1a1a1a'

  return (
    <svg width={width} height={height} viewBox="0 0 80 48" className={className}>
      <path d="M10 0 H80 V48 H0 L10 0 Z" fill={bgColor} />
      <text
        x="40"
        y="33"
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontSize={fontSize}
        fontWeight="700"
        fill={textColor}
        letterSpacing="-0.5"
      >
        NIV
      </text>
      <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
    </svg>
  )
}
