import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'NIV - The Influence Orchestration Operating System'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1a1a1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* NIV Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {/* Parallelogram logo */}
          <svg width="160" height="96" viewBox="0 0 80 48">
            <path d="M10 0 H80 V48 H0 L10 0 Z" fill="#faf9f7" />
            <text
              x="40"
              y="33"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              fontSize="22"
              fontWeight="700"
              fill="#1a1a1a"
            >
              NIV
            </text>
            <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
          </svg>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '2px',
                height: '60px',
                background: 'rgba(255, 255, 255, 0.2)',
              }}
            />
            <span
              style={{
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.5)',
                letterSpacing: '2px',
              }}
            >
              by nivria
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 400,
            color: '#faf9f7',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.2,
            marginBottom: '20px',
          }}
        >
          The <span style={{ fontStyle: 'italic', color: '#c75d3a' }}>influence</span> orchestration
        </div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 400,
            color: '#faf9f7',
            textAlign: 'center',
          }}
        >
          operating system
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '1px',
          }}
        >
          nivria.ai
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
