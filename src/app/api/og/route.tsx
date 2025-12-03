import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
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
        {/* NIV Logo - simplified */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {/* Logo box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '160px',
              height: '96px',
              background: '#faf9f7',
              borderRadius: '8px',
              position: 'relative',
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
            {/* Orange corner */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '30px',
                height: '30px',
                background: '#c75d3a',
                borderTopRightRadius: '8px',
              }}
            />
          </div>

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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '52px',
              fontWeight: 400,
              color: '#faf9f7',
              textAlign: 'center',
              marginBottom: '10px',
            }}
          >
            The <span style={{ fontStyle: 'italic', color: '#c75d3a' }}>influence</span> orchestration
          </div>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 400,
              color: '#faf9f7',
              textAlign: 'center',
            }}
          >
            operating system
          </div>
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
      width: 1200,
      height: 630,
    }
  )
}
