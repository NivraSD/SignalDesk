import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
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
        }}
      >
        {/* Logo container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '50px',
          }}
        >
          {/* Parallelogram NIV logo */}
          <div
            style={{
              display: 'flex',
              position: 'relative',
              width: '160px',
              height: '96px',
            }}
          >
            {/* Parallelogram shape using SVG */}
            <svg
              width="160"
              height="96"
              viewBox="0 0 100 60"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <path d="M12 0 H100 V60 H0 L12 0 Z" fill="#faf9f7" />
              <path d="M85 0 H100 V15 L85 0 Z" fill="#c75d3a" />
            </svg>
            {/* NIV text overlay */}
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
                  fontSize: '44px',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  letterSpacing: '-1px',
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
              height: '60px',
              background: 'rgba(255, 255, 255, 0.3)',
              marginLeft: '24px',
            }}
          />
          {/* by nivria */}
          <span
            style={{
              display: 'flex',
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '1px',
              marginLeft: '20px',
            }}
          >
            by nivria
          </span>
        </div>

        {/* Tagline line 1 */}
        <div
          style={{
            display: 'flex',
            fontSize: '52px',
            fontWeight: 400,
            color: '#faf9f7',
            marginBottom: '4px',
            fontFamily: 'Georgia, Times New Roman, serif',
            letterSpacing: '-0.02em',
          }}
        >
          <span>The </span>
          <span style={{ fontStyle: 'italic', color: '#c75d3a', marginLeft: '14px', marginRight: '14px' }}>influence</span>
          <span>orchestration</span>
        </div>

        {/* Tagline line 2 */}
        <div
          style={{
            display: 'flex',
            fontSize: '52px',
            fontWeight: 400,
            color: '#faf9f7',
            fontFamily: 'Georgia, Times New Roman, serif',
            letterSpacing: '-0.02em',
          }}
        >
          operating system
        </div>

        {/* URL at bottom */}
        <div
          style={{
            display: 'flex',
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
      width: 1200,
      height: 630,
    }
  )
}
