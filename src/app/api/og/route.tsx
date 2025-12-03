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
          fontFamily: 'system-ui, sans-serif',
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
          {/* NIV box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '180px',
              height: '108px',
              background: '#faf9f7',
              borderRadius: '12px',
            }}
          >
            <span
              style={{
                fontSize: '52px',
                fontWeight: 700,
                color: '#1a1a1a',
                letterSpacing: '-1px',
              }}
            >
              NIV
            </span>
          </div>
          {/* Divider and by nivria */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: '24px',
            }}
          >
            <div
              style={{
                width: '2px',
                height: '60px',
                background: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
              }}
            />
            <span
              style={{
                fontSize: '28px',
                color: 'rgba(255, 255, 255, 0.5)',
                letterSpacing: '2px',
                marginLeft: '20px',
              }}
            >
              by nivria
            </span>
          </div>
        </div>

        {/* Tagline line 1 */}
        <div
          style={{
            display: 'flex',
            fontSize: '48px',
            fontWeight: 400,
            color: '#faf9f7',
            marginBottom: '8px',
          }}
        >
          <span>The </span>
          <span style={{ fontStyle: 'italic', color: '#c75d3a', marginLeft: '12px', marginRight: '12px' }}>influence</span>
          <span> orchestration</span>
        </div>

        {/* Tagline line 2 */}
        <div
          style={{
            display: 'flex',
            fontSize: '48px',
            fontWeight: 400,
            color: '#faf9f7',
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
