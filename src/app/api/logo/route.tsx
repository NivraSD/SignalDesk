import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Parallelogram Logo */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: '80px',
            height: '48px',
          }}
        >
          <svg
            width="80"
            height="48"
            viewBox="0 0 80 48"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <path d="M10 0 H80 V48 H0 L10 0 Z" fill="#faf9f7" />
            <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
          </svg>
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#1a1a1a',
                letterSpacing: '-0.5px',
              }}
            >
              NIV
            </span>
          </div>
        </div>
        {/* Divider */}
        <div
          style={{
            display: 'flex',
            width: '2px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.3)',
            marginLeft: '14px',
          }}
        />
        {/* by nivria */}
        <span
          style={{
            display: 'flex',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '1px',
            marginLeft: '14px',
          }}
        >
          by nivria
        </span>
      </div>
    ),
    {
      width: 220,
      height: 60,
    }
  )
}
