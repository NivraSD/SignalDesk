'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PalantirDemoPage() {
  const router = useRouter()
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnter = async () => {
    setEntering(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/demo-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'palantir-fellowship-2026' }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Access failed')
      }

      // Redirect through the auth callback to establish session
      router.push(data.redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setEntering(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        maxWidth: 640,
        width: '100%',
        padding: '0 24px',
        textAlign: 'center',
      }}>
        {/* Logos */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          marginBottom: 48,
        }}>
          {/* NIV Logo */}
          <svg width="90" height="54" viewBox="0 0 120 72">
            <path d="M15 0 H120 V72 H0 L15 0 Z" fill="#faf9f7" />
            <text
              x="60" y="48"
              textAnchor="middle"
              fontFamily="Space Grotesk, sans-serif"
              fontSize="32" fontWeight="700"
              fill="#1a1a1a"
              letterSpacing="-1"
            >NIV</text>
            <path d="M102 0 H120 V18 L102 0 Z" fill="#c75d3a" />
          </svg>

          <span style={{ color: '#444', fontSize: 20, fontWeight: 300 }}>×</span>

          {/* Palantir Logo */}
          <svg width="160" height="44" viewBox="0 0 320 88" fill="none">
            {/* Symbol: circle with gap at bottom, sitting on a downward chevron */}
            <g transform="translate(14, 6)">
              {/* Circle with gap at bottom */}
              <path
                d="M24 6 A18 18 0 1 1 10.5 38"
                fill="none" stroke="#faf9f7" strokeWidth="5" strokeLinecap="round"
              />
              {/* Downward chevron below */}
              <path
                d="M8 42 L24 54 L40 42"
                fill="none" stroke="#faf9f7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
              />
              {/* Second chevron line */}
              <path
                d="M8 50 L24 62 L40 50"
                fill="none" stroke="#faf9f7" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
              />
            </g>
            {/* Wordmark */}
            <text
              x="76" y="56"
              fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
              fontSize="38"
              fontWeight="400"
              fill="#faf9f7"
              letterSpacing="1"
            >Palantir</text>
          </svg>
        </div>

        <p style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#666',
          marginBottom: 32,
        }}>Prepared for the Palantir Fellowship</p>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 36,
          fontWeight: 400,
          color: '#faf9f7',
          marginBottom: 12,
          lineHeight: 1.2,
        }}>
          Welcome to your <em style={{ color: '#c75d3a', fontStyle: 'italic' }}>intelligence briefing</em>
        </h1>

        <p style={{
          fontSize: 16,
          color: '#999',
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          This account has been pre-loaded with a live demonstration environment.
        </p>

        {/* What's inside */}
        <div style={{
          background: '#222',
          borderRadius: 12,
          padding: '32px 28px',
          textAlign: 'left',
          marginBottom: 40,
          border: '1px solid #333',
        }}>
          <h2 style={{
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#c75d3a',
            marginBottom: 20,
          }}>What&apos;s pre-loaded</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                title: 'Public Affairs Intelligence',
                desc: 'Real-time geopolitical monitoring with AI-generated research reports, scenario simulations, and one-pagers on active policy issues.',
              },
              {
                title: 'Opportunity Engine',
                desc: 'AI-discovered media and speaking opportunities with stakeholder analysis, scenario modeling, and execution tracking.',
              },
              {
                title: 'Campaign Builder',
                desc: 'Full VECTOR campaign blueprints with stakeholder psychological profiling, multi-channel content strategies, and execution plans.',
              },
              {
                title: 'NIV Advisor',
                desc: 'Conversational AI strategist with full organizational context — ask it anything about your communications landscape.',
              },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 6,
                  borderRadius: 3,
                  background: '#c75d3a',
                  opacity: 0.6,
                  flexShrink: 0,
                }} />
                <div>
                  <h3 style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#faf9f7',
                    marginBottom: 4,
                  }}>{item.title}</h3>
                  <p style={{
                    fontSize: 13,
                    color: '#888',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={entering}
          style={{
            background: entering ? '#444' : '#c75d3a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '16px 48px',
            fontSize: 16,
            fontWeight: 600,
            cursor: entering ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.02em',
            opacity: entering ? 0.7 : 1,
          }}
        >
          {entering ? 'Entering...' : 'Enter Dashboard →'}
        </button>

        {error && (
          <p style={{
            color: '#e55',
            fontSize: 14,
            marginTop: 16,
          }}>{error}</p>
        )}

        <p style={{
          fontSize: 12,
          color: '#555',
          marginTop: 32,
        }}>
          This is a private demo environment. All data is illustrative.
        </p>
      </div>
    </div>
  )
}
