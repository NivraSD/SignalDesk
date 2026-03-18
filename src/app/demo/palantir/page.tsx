'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PalantirDemoPage() {
  const router = useRouter()
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

      router.push(data.redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setEntering(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.08; }
        }
        @keyframes gridScroll {
          from { transform: translateY(0); }
          to { transform: translateY(40px); }
        }
        .fade-up-1 { animation: fadeUp 0.8s ease-out 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.8s ease-out 0.3s both; }
        .fade-up-3 { animation: fadeUp 0.8s ease-out 0.5s both; }
        .fade-up-4 { animation: fadeUp 0.8s ease-out 0.7s both; }
        .fade-up-5 { animation: fadeUp 0.8s ease-out 0.9s both; }
        .fade-up-6 { animation: fadeUp 0.8s ease-out 1.1s both; }
        .enter-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(199, 93, 58, 0.4);
        }
        .enter-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .item-row {
          transition: all 0.2s ease;
        }
        .item-row:hover {
          background: rgba(199, 93, 58, 0.04);
          padding-left: 4px;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated background grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(199, 93, 58, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(199, 93, 58, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'gridScroll 8s linear infinite',
        }} />

        {/* Radial glow behind content */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(199, 93, 58, 0.06) 0%, transparent 70%)',
          animation: 'subtlePulse 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 780,
          width: '100%',
          padding: '60px 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Logos */}
          <div className="fade-up-1" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
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
                fill="#0d0d0d"
                letterSpacing="-1"
              >NIV</text>
              <path d="M102 0 H120 V18 L102 0 Z" fill="#c75d3a" />
            </svg>

            <div style={{
              width: 1,
              height: 32,
              background: 'linear-gradient(to bottom, transparent, #444, transparent)',
            }} />

            {/* Palantir Logo */}
            <svg width="200" height="48" viewBox="0 0 400 88" fill="none">
              <g transform="translate(14, 4)">
                <circle cx="24" cy="22" r="16" fill="none" stroke="#faf9f7" strokeWidth="4.5" />
                <path
                  d="M6 46 L24 58 L42 46"
                  fill="none" stroke="#faf9f7" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </g>
              <text
                x="72" y="58"
                fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
                fontSize="52"
                fontWeight="400"
                fill="#faf9f7"
                letterSpacing="1"
              >Palantir</text>
            </svg>
          </div>

          <p className="fade-up-1" style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: '#666',
            marginBottom: 36,
          }}>Prepared for the Palantir Fellowship</p>

          {/* Headline */}
          <h1 className="fade-up-2" style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 40,
            fontWeight: 400,
            color: '#faf9f7',
            marginBottom: 14,
            lineHeight: 1.2,
          }}>
            Welcome to your <em style={{ color: '#c75d3a', fontStyle: 'italic' }}>intelligence briefing</em>
          </h1>

          <p className="fade-up-2" style={{
            fontSize: 16,
            color: '#777',
            lineHeight: 1.7,
            marginBottom: 44,
          }}>
            This account has been pre-loaded with a live demonstration environment.
          </p>

          {/* Narrative */}
          <div className="fade-up-3" style={{
            textAlign: 'left',
            marginBottom: 44,
            padding: '0 4px',
          }}>
            <p style={{
              fontSize: 16,
              color: '#bbb',
              lineHeight: 1.9,
              margin: 0,
            }}>
              Everything that was pre-loaded was generated from a single signal — the announcement of a driverless truck pilot program in Texas. NIV detected it, assessed its strategic relevance, simulated how key actors would engage, built a research foundation, generated a campaign strategy with multiple types of fully generated content, and is now programmed to monitor for any external event that may have an impact. All of it done without touching your keyboard once.
            </p>
            <p style={{
              fontSize: 16,
              color: '#bbb',
              lineHeight: 1.9,
              margin: '20px 0 0 0',
            }}>
              NIV is actively working to identify and capitalize on opportunities for Palantir, and its ability to do so will sharpen over time as the system continues to operate and learn.
            </p>
          </div>

          {/* What's inside */}
          <div className="fade-up-4" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(199,93,58,0.03) 100%)',
            borderRadius: 16,
            padding: '32px 28px',
            textAlign: 'left',
            marginBottom: 44,
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(10px)',
          }}>
            <h2 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#c75d3a',
              marginBottom: 24,
            }}>What&apos;s pre-loaded</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                {
                  title: 'Intelligence Brief',
                  desc: 'AI-generated synthesis of real-time signals across your monitoring landscape.',
                },
                {
                  title: 'Executed Opportunity',
                  desc: 'A fully discovered and executed media/speaking opportunity with stakeholder analysis and scenario modeling.',
                },
                {
                  title: 'Built Campaign',
                  desc: 'Complete VECTOR campaign blueprint with stakeholder psychological profiling, content strategies, and execution plan.',
                },
                {
                  title: 'Signals',
                  desc: 'Live signal monitoring with predictive cascades tracking emerging developments.',
                },
                {
                  title: 'Crisis Command',
                  desc: 'A pre-built crisis response plan ready for real-time activation.',
                },
                {
                  title: 'Research Report',
                  desc: 'Deep geopolitical intelligence memo with scenario analysis and strategic recommendations.',
                },
                {
                  title: 'Completed Simulation',
                  desc: 'A fully run stakeholder simulation modeling behavioral responses across decision scenarios.',
                },
                {
                  title: 'Organizational Schema',
                  desc: 'Auto-generated at onboarding — your org profile, messaging architecture, and stakeholder map in the Vault.',
                },
              ].map((item, i) => (
                <div key={i} className="item-row" style={{
                  display: 'flex',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{
                    width: 3,
                    borderRadius: 2,
                    background: '#c75d3a',
                    opacity: 0.5,
                    flexShrink: 0,
                    marginTop: 2,
                    alignSelf: 'stretch',
                  }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#eee',
                      marginBottom: 3,
                      letterSpacing: '0.01em',
                    }}>{item.title}</h3>
                    <p style={{
                      fontSize: 13,
                      color: '#777',
                      lineHeight: 1.5,
                      margin: 0,
                    }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enter button */}
          <div className="fade-up-5">
            <button
              className="enter-btn"
              onClick={handleEnter}
              disabled={entering}
              style={{
                background: entering ? '#333' : 'linear-gradient(135deg, #c75d3a 0%, #a84a2e 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '17px 56px',
                fontSize: 16,
                fontWeight: 600,
                cursor: entering ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                letterSpacing: '0.03em',
                opacity: entering ? 0.6 : 1,
                boxShadow: entering ? 'none' : '0 4px 20px rgba(199, 93, 58, 0.25)',
              }}
            >
              {entering ? 'Entering...' : 'Enter Dashboard'}
            </button>
          </div>

          {error && (
            <p style={{
              color: '#e55',
              fontSize: 14,
              marginTop: 16,
            }}>{error}</p>
          )}

          <p className="fade-up-6" style={{
            fontSize: 11,
            color: '#444',
            marginTop: 36,
            letterSpacing: '0.02em',
          }}>
            This is a private demo environment. All data is illustrative.
          </p>
        </div>
      </div>
    </>
  )
}
