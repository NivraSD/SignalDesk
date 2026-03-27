'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function PalantirDemoPage() {
  const router = useRouter()
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setVisible(true)

    // Animated particle/node background
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = []
    const nodeCount = 60

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
      })
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180) {
            const opacity = (1 - dist / 180) * 0.12
            ctx!.strokeStyle = `rgba(199, 93, 58, ${opacity})`
            ctx!.lineWidth = 0.5
            ctx!.beginPath()
            ctx!.moveTo(nodes[i].x, nodes[i].y)
            ctx!.lineTo(nodes[j].x, nodes[j].y)
            ctx!.stroke()
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        ctx!.fillStyle = 'rgba(199, 93, 58, 0.25)'
        ctx!.beginPath()
        ctx!.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx!.fill()

        node.x += node.vx
        node.y += node.vy

        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
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

  const items = [
    { title: 'Intelligence Brief', desc: 'AI-generated synthesis of real-time signals across your monitoring landscape.' },
    { title: 'Executed Opportunity', desc: 'A fully discovered and executed media/speaking opportunity with stakeholder analysis and scenario modeling.' },
    { title: 'Built Campaign', desc: 'Complete VECTOR campaign blueprint with stakeholder psychological profiling, content strategies, and execution plan.' },
    { title: 'Signals', desc: 'Live signal monitoring with predictive cascades tracking emerging developments.' },
    { title: 'Crisis Command', desc: 'A pre-built crisis response plan ready for real-time activation.' },
    { title: 'Research Report', desc: 'Deep geopolitical intelligence memo with scenario analysis and strategic recommendations.' },
    { title: 'Completed Simulation', desc: 'A fully run stakeholder simulation modeling behavioral responses across decision scenarios.' },
    { title: 'Organizational Schema', desc: 'Auto-generated at onboarding — your org profile, messaging architecture, and stakeholder map in the Vault.' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated network canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top gradient fade */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        background: 'linear-gradient(to bottom, #080808, transparent)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 24px 60px',
        minHeight: '100vh',
      }}>
        <div style={{
          maxWidth: 740,
          width: '100%',
          textAlign: 'center',
        }}>
          {/* Logos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            marginBottom: 52,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
          }}>
            <svg width="90" height="54" viewBox="0 0 120 72">
              <path d="M15 0 H120 V72 H0 L15 0 Z" fill="#faf9f7" />
              <text x="60" y="48" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="32" fontWeight="700" fill="#080808" letterSpacing="-1">NIV</text>
              <path d="M102 0 H120 V18 L102 0 Z" fill="#c75d3a" />
            </svg>

            <div style={{
              width: 1,
              height: 36,
              background: 'linear-gradient(to bottom, transparent, rgba(199,93,58,0.4), transparent)',
            }} />

            <svg width="200" height="48" viewBox="0 0 400 88" fill="none">
              <g transform="translate(14, 4)">
                <circle cx="24" cy="22" r="16" fill="none" stroke="#faf9f7" strokeWidth="4.5" />
                <path d="M6 46 L24 58 L42 46" fill="none" stroke="#faf9f7" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <text x="72" y="58" fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif" fontSize="52" fontWeight="400" fill="#faf9f7" letterSpacing="1">Palantir</text>
            </svg>
          </div>

          <p style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#555',
            marginBottom: 40,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.9s ease 0.3s',
          }}>Prepared for the Palantir Fellowship</p>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 44,
            fontWeight: 400,
            color: '#faf9f7',
            marginBottom: 16,
            lineHeight: 1.15,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
          }}>
            Welcome to your{' '}
            <em style={{
              color: '#c75d3a',
              fontStyle: 'italic',
            }}>intelligence briefing</em>
          </h1>

          <p style={{
            fontSize: 16,
            color: '#666',
            lineHeight: 1.7,
            marginBottom: 48,
            opacity: visible ? 1 : 0,
            transition: 'opacity 1s ease 0.5s',
          }}>
            This account has been pre-loaded with a live demonstration environment.
          </p>

          {/* Narrative */}
          <div style={{
            textAlign: 'left',
            marginBottom: 48,
            padding: '28px 32px',
            borderLeft: '2px solid rgba(199, 93, 58, 0.3)',
            background: 'linear-gradient(90deg, rgba(199,93,58,0.04) 0%, transparent 60%)',
            borderRadius: '0 8px 8px 0',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
          }}>
            <p style={{
              fontSize: 15,
              color: '#c0bdb8',
              lineHeight: 1.9,
              margin: 0,
            }}>
              Everything that was pre-loaded was generated from a single signal — the announcement of a driverless truck pilot program in Texas. NIV detected it, assessed its strategic relevance, simulated how key actors would engage, built a research foundation, generated a campaign strategy with multiple types of fully generated content, and is now programmed to monitor for any external event that may have an impact. All of it done without touching your keyboard once.
            </p>
            <p style={{
              fontSize: 15,
              color: '#c0bdb8',
              lineHeight: 1.9,
              margin: '16px 0 0 0',
            }}>
              NIV is actively working to identify and capitalize on opportunities for Palantir, and its ability to do so will sharpen over time as the system continues to operate and learn.
            </p>
          </div>

          {/* How to explore */}
          <div style={{
            textAlign: 'left',
            marginBottom: 48,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s',
          }}>
            <h2 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: '#c75d3a',
              marginBottom: 20,
            }}>How to explore</h2>

            {[
              {
                label: 'Intelligence Brief',
                text: 'Click "Regenerate" to generate a fresh intelligence brief synthesized from live signals. Takes 2\u20133 minutes.',
              },
              {
                label: 'Opportunities',
                text: 'Click "Generate Opportunity" to discover and fully execute a new opportunity \u2014 you\u2019ll receive completed content and a presentation deck. Takes 2\u20133 minutes.',
              },
              {
                label: 'From any story',
                text: 'Inside the intelligence brief, click any story to generate a research report or opportunity directly from that signal \u2014 one click.',
              },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 14,
                marginBottom: 16,
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px solid rgba(199,93,58,0.08)',
              }}>
                <div style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(199,93,58,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#c75d3a',
                  marginTop: 1,
                }}>{i + 1}</div>
                <div>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ddd',
                  }}>{step.label}</span>
                  <span style={{
                    fontSize: 13,
                    color: '#888',
                    marginLeft: 6,
                  }}>&mdash; {step.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* What's inside — two columns */}
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s',
            marginBottom: 52,
          }}>
            <h2 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: '#c75d3a',
              marginBottom: 24,
              textAlign: 'left',
            }}>What&apos;s pre-loaded</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2px',
            }}>
              {items.map((item, i) => (
                <div key={i} style={{
                  padding: '20px 22px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 10,
                  textAlign: 'left',
                  transition: 'background 0.2s ease',
                  cursor: 'default',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}>
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#c75d3a',
                      opacity: 0.6,
                    }} />
                    <h3 style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#eee',
                      letterSpacing: '0.01em',
                    }}>{item.title}</h3>
                  </div>
                  <p style={{
                    fontSize: 12.5,
                    color: '#777',
                    lineHeight: 1.55,
                    margin: 0,
                    paddingLeft: 14,
                  }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Enter button */}
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.98)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.1s',
          }}>
            <button
              onClick={handleEnter}
              disabled={entering}
              onMouseEnter={(e) => {
                if (!entering) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(199, 93, 58, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(199, 93, 58, 0.25)'
              }}
              style={{
                background: entering ? '#333' : 'linear-gradient(135deg, #c75d3a 0%, #a84a2e 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '18px 64px',
                fontSize: 16,
                fontWeight: 600,
                cursor: entering ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                letterSpacing: '0.04em',
                opacity: entering ? 0.6 : 1,
                boxShadow: entering ? 'none' : '0 4px 24px rgba(199, 93, 58, 0.25)',
              }}
            >
              {entering ? 'Entering...' : 'Enter Dashboard'}
            </button>
          </div>

          {error && (
            <p style={{ color: '#e55', fontSize: 14, marginTop: 16 }}>{error}</p>
          )}

          <p style={{
            fontSize: 11,
            color: '#3a3a3a',
            marginTop: 40,
            letterSpacing: '0.03em',
            opacity: visible ? 1 : 0,
            transition: 'opacity 1s ease 1.3s',
          }}>
            This is a private demo environment. All data is illustrative.
          </p>
        </div>
      </div>
    </div>
  )
}
