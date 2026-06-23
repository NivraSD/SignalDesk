'use client'

import { useEffect, useState } from 'react'

// section nav data — used by the side dots
const SECTIONS = [
  { id: 'sec-how',        label: 'How it works' },
  { id: 'sec-instrument', label: 'The standard' },
  { id: 'sec-who',        label: 'Who this is for' },
  { id: 'sec-lifecycle',  label: 'Lifecycle' },
  { id: 'sec-people',     label: 'People' },
  { id: 'briefing',       label: 'Briefing' },
]

// auto-hide header — hides on scroll down, reveals on scroll up,
// always shown near the top of the page
function useHeaderVisible() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        if (y < 80) setVisible(true)
        else if (y > lastY + 4) setVisible(false)
        else if (y < lastY - 4) setVisible(true)
        lastY = y
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return visible
}

// ============================================================================
// NIVRIA — Homepage
// Built to the three rules:
//   1. The headline IS the identity
//   2. The description sits directly under the headline (defines connectome)
//   3. The supporting graphic sits under the description (the product, visible)
// ============================================================================

// ─── Illustrative example: a nickel processing JV in formation ──────────
// Generic by design — sector + role rather than named individuals.
type Stance = 'against' | 'neutral' | 'aligned'
type Sector = 'gov' | 'capital' | 'community' | 'media'

interface Node {
  n: number
  name: string
  role: string
  stance: Stance
  sector: Sector
  inf: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  x: number
  y: number
  r: number
  /** label position offset from dot center */
  lx: number
  ly: number
  /** label anchor */
  la: 'start' | 'middle' | 'end'
}

// SVG viewBox 0 0 760 540 — split into four sector quadrants
const NODES: Node[] = [
  // ── GOVERNMENT & JUDICIARY (top-left quadrant) ──
  { n: 1,  name: 'Head of state',         role: 'Executive',         stance: 'against', sector: 'gov',       inf: 9, x: 175, y: 100, r: 22, lx: 0,   ly: -34, la: 'middle' },
  { n: 2,  name: 'Constitutional court',  role: 'Judiciary',         stance: 'against', sector: 'gov',       inf: 9, x: 95,  y: 175, r: 22, lx: -32, ly:  4,  la: 'end'    },
  { n: 3,  name: 'Min. of environment',   role: 'Cabinet',           stance: 'against', sector: 'gov',       inf: 8, x: 245, y: 175, r: 19, lx: 28,  ly:  4,  la: 'start'  },
  { n: 4,  name: 'Opposition coalition',  role: 'Legislature',       stance: 'against', sector: 'gov',       inf: 7, x: 70,  y: 270, r: 17, lx: -28, ly:  4,  la: 'end'    },
  { n: 5,  name: 'Attorney general',      role: 'Public ministry',   stance: 'neutral', sector: 'gov',       inf: 7, x: 175, y: 250, r: 17, lx: 0,   ly: 30,  la: 'middle' },
  { n: 6,  name: 'Min. of commerce',      role: 'Cabinet',           stance: 'neutral', sector: 'gov',       inf: 7, x: 290, y: 270, r: 17, lx: 26,  ly:  4,  la: 'start'  },

  // ── OPERATORS & CAPITAL (top-right) ──
  { n: 7,  name: 'Lead operator',         role: 'Sponsor',           stance: 'aligned', sector: 'capital',   inf: 8, x: 500, y: 115, r: 21, lx: 0,   ly: -32, la: 'middle' },
  { n: 8,  name: 'Anchor lender (DFI)',   role: 'Senior debt',       stance: 'aligned', sector: 'capital',   inf: 7, x: 640, y: 165, r: 18, lx: 28,  ly:  4,  la: 'start'  },
  { n: 9,  name: 'EPC contractor',        role: 'Build partner',     stance: 'aligned', sector: 'capital',   inf: 6, x: 430, y: 215, r: 16, lx: -26, ly:  4,  la: 'end'    },
  { n: 10, name: 'Royalty partner',       role: 'Off-take',          stance: 'aligned', sector: 'capital',   inf: 6, x: 580, y: 260, r: 16, lx: 26,  ly:  4,  la: 'start'  },

  // ── COMMUNITY & GROUND (bottom-left) ──
  { n: 11, name: 'Affected community',    role: 'Coastal pop.',      stance: 'neutral', sector: 'community', inf: 7, x: 150, y: 370, r: 17, lx: -28, ly:  4,  la: 'end'    },
  { n: 12, name: 'Indigenous council',    role: 'Traditional auth.', stance: 'against', sector: 'community', inf: 6, x: 80,  y: 450, r: 16, lx: 0,   ly: 32,  la: 'middle' },
  { n: 13, name: 'Labor union',           role: 'Workforce',         stance: 'aligned', sector: 'community', inf: 5, x: 245, y: 445, r: 15, lx: 0,   ly: 30,  la: 'middle' },

  // ── MEDIA & SCRUTINY (bottom-right) ──
  { n: 14, name: 'National daily',        role: 'Print press',       stance: 'neutral', sector: 'media',     inf: 7, x: 460, y: 360, r: 17, lx: -26, ly:  4,  la: 'end'    },
  { n: 15, name: 'Regional broadcaster',  role: 'Broadcast',         stance: 'aligned', sector: 'media',     inf: 5, x: 620, y: 400, r: 15, lx: 26,  ly:  4,  la: 'start'  },
  { n: 16, name: 'Investigative watchdog',role: 'Online',            stance: 'against', sector: 'media',     inf: 6, x: 510, y: 460, r: 16, lx: 0,   ly: 30,  la: 'middle' },
]

interface Link {
  a: number   // index into NODES
  b: number
  kind: 'iron' | 'forest' | 'bronze'
}

const LINKS: Link[] = [
  // Resistance alliance (iron) — government bloc + their pressure points
  { a: 0,  b: 1,  kind: 'iron' },
  { a: 0,  b: 2,  kind: 'iron' },
  { a: 1,  b: 2,  kind: 'iron' },
  { a: 1,  b: 3,  kind: 'iron' },
  { a: 2,  b: 4,  kind: 'iron' },
  { a: 3,  b: 4,  kind: 'iron' },
  { a: 11, b: 0,  kind: 'iron' },   // indigenous → head of state
  { a: 15, b: 2,  kind: 'iron' },   // watchdog → environment ministry
  // Aligned coalitions (forest)
  { a: 6,  b: 7,  kind: 'forest' },
  { a: 6,  b: 8,  kind: 'forest' },
  { a: 7,  b: 8,  kind: 'forest' },
  { a: 6,  b: 9,  kind: 'forest' },
  { a: 12, b: 6,  kind: 'forest' },   // labor → operator
  { a: 14, b: 6,  kind: 'forest' },   // regional broadcaster → operator
  // Cross-stance dependencies (bronze, dotted) — the score's pressure points
  { a: 5,  b: 6,  kind: 'bronze' },   // commerce → operator
  { a: 4,  b: 6,  kind: 'bronze' },   // attorney general → operator
  { a: 13, b: 6,  kind: 'bronze' },   // press → operator
  { a: 13, b: 0,  kind: 'bronze' },   // press → head of state
  { a: 10, b: 8,  kind: 'bronze' },   // community → EPC
  { a: 5,  b: 0,  kind: 'bronze' },   // attorney general → head of state
]

// Sector zone background labels
const SECTORS: { label: string; x: number; y: number; align: 'start' | 'end' }[] = [
  { label: 'Government & judiciary', x: 30,  y: 38,  align: 'start' },
  { label: 'Operators & capital',    x: 730, y: 38,  align: 'end'   },
  { label: 'Community & ground',     x: 30,  y: 516, align: 'start' },
  { label: 'Media & scrutiny',       x: 730, y: 516, align: 'end'   },
]

const SUBSCORES = [
  { k: 'Alignment health',  v: 50, note: 'Government bloc opposed at L3+; capital + operators aligned.' },
  { k: 'Trust trajectory',  v: 42, note: 'Slipping — no upward movement on the deal-breaker bloc.' },
  { k: 'Narrative risk',    v: 30, note: 'Sponsor messaging diverges from press and watchdog readings.' },
  { k: 'Execution risk',    v: 55, note: 'Build chain aligned; gated by political resolution.' },
]

// Recent movements — the live activity strip
const MOVEMENTS = [
  { date: '21 Jun', text: 'Min. of environment escalated to L4 deal-breaker',     impact: 'alignment',  arrow: 'down' as const, delta: '-3' },
  { date: '18 Jun', text: 'National daily filed critical investigation',          impact: 'narrative',  arrow: 'down' as const, delta: '-5' },
  { date: '14 Jun', text: 'Anchor lender requested stakeholder coordination proof', impact: 'trust',    arrow: 'down' as const, delta: '-2' },
]

// 6-month score trend for the readout sparkline
const TREND = [72, 70, 68, 67, 64, 62, 60]

// ============================================================================
export default function Home() {
  return (
    <div className="nv">
      <style>{CSS}</style>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Instrument />
        <WhoIsThisFor />
        <Lifecycle />
        <People />
        <Close />
      </main>
      <Colophon />
      <SectionNav />
      <BackToTop />
    </div>
  )
}

// ─── SECTION NAV — vertical row of dots, fixed right ────────────────────
function SectionNav() {
  const [active, setActive] = useState<string>('')
  useEffect(() => {
    const TOP_THRESHOLD = 600   // nothing lit until we scroll past this
    let ticking = false
    const update = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        if (window.scrollY < TOP_THRESHOLD) {
          setActive('')
          return
        }
        // Pick the section whose centre is closest to the viewport's centre.
        const vpCentre = window.scrollY + window.innerHeight / 2
        let closestId = ''
        let closestDist = Infinity
        SECTIONS.forEach(s => {
          const el = document.getElementById(s.id)
          if (!el) return
          const rect = el.getBoundingClientRect()
          const sectionCentre = window.scrollY + rect.top + rect.height / 2
          const dist = Math.abs(sectionCentre - vpCentre)
          if (dist < closestDist) {
            closestDist = dist
            closestId = s.id
          }
        })
        setActive(closestId)
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return (
    <nav className="nv-sn" aria-label="Sections">
      {SECTIONS.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`nv-sn-dot${active === s.id ? ' nv-sn-dot-active' : ''}`}
          aria-label={s.label}
        >
          <span className="nv-sn-label">{s.label}</span>
        </a>
      ))}
    </nav>
  )
}

// ─── BACK-TO-TOP — fixed bottom-right, appears after some scroll ────────
function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <button
      type="button"
      className={`nv-top${visible ? ' nv-top-visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
        <path d="M8 13V2M2 7l6-6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// ─── HEADER ──────────────────────────────────────────────────────────────
function Header() {
  const visible = useHeaderVisible()
  return (
    <header className={`nv-hdr${visible ? '' : ' nv-hdr-hidden'}`}>
      <div className="nv-wrap nv-hdr-row">
        <NivriaLogo />
        <nav className="nv-nav">
          <a href="mailto:briefing@nivria.ai?subject=Briefing%20request" className="nv-nav-cta">Request a briefing</a>
          <a href="/founder" className="nv-nav-founder">Founder</a>
          <a href="/auth/login" className="nv-nav-link">Sign in</a>
        </nav>
      </div>
    </header>
  )
}

// ─── LOGO — NIVRIA beneath a dense web (filter feel) ───────────────
// 6 top nodes + 6 bottom nodes, fully bipartite (every top connects to
// every bottom) plus cross-connections within each row, plus interior
// scatter dots. The combined opacity reads as a ~60% cloudy filter.
// ─── LOGO — wide criss-cross canopy with two trunks from the i-dots ──
// The i-dots in "nivria" anchor two SHORT vertical gold trunks that rise
// to where the canopy begins. Above that, the canopy fans WIDER than
// the trunks — scatter data points with criss-cross lacework between.
// Branches from the canopy converge down to the tops of the two trunks.
function NivriaLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const TRUNK_LX = 97    // aligns with first i in "nivria"
  const TRUNK_RX = 143   // aligns with second i
  const TRUNK_TOP = 38   // bottom of SVG — branches converge directly at the i-top

  // CANOPY — bounded within wordmark width, with a curved dome ridge
  // (outer top dots lowered, peak raised) so it reads more tree-like.
  const CANOPY = [
    { x: 66,  y: 14, c: 'l' as const },
    { x: 76,  y: 12, c: 'l' as const },   // lowered (was y=6) — left shoulder of dome
    { x: 84,  y: 14, c: 'l' as const },
    { x: 72,  y: 24, c: 'l' as const },
    { x: 80,  y: 26, c: 'l' as const },
    { x: 96,  y: 14, c: 'c' as const },
    { x: 108, y: 6,  c: 'c' as const },   // raised slightly (was y=8) — climbing up
    { x: 120, y: 2,  c: 'c' as const },   // peak raised (was y=4) — top of dome
    { x: 132, y: 6,  c: 'c' as const },
    { x: 144, y: 14, c: 'c' as const },
    { x: 102, y: 22, c: 'c' as const },
    { x: 120, y: 18, c: 'c' as const },
    { x: 138, y: 22, c: 'c' as const },
    { x: 120, y: 30, c: 'c' as const },
    { x: 156, y: 14, c: 'r' as const },
    { x: 164, y: 12, c: 'r' as const },   // lowered (mirror of left shoulder)
    { x: 174, y: 14, c: 'r' as const },
    { x: 160, y: 26, c: 'r' as const },
    { x: 168, y: 24, c: 'r' as const },
  ]

  type Line = { x1: number; y1: number; x2: number; y2: number; w: number; o: number; d?: string }
  const branches: Line[] = []
  // each trunk top reaches up to its own cluster + the centre
  CANOPY.forEach(p => {
    if (p.c === 'l' || p.c === 'c') {
      branches.push({ x1: TRUNK_LX, y1: TRUNK_TOP, x2: p.x, y2: p.y,
        w: p.c === 'l' ? 0.7 : 0.5,
        o: p.c === 'l' ? 0.55 : 0.30,
        d: p.c === 'c' ? '2 3' : undefined,
      })
    }
    if (p.c === 'r' || p.c === 'c') {
      branches.push({ x1: TRUNK_RX, y1: TRUNK_TOP, x2: p.x, y2: p.y,
        w: p.c === 'r' ? 0.7 : 0.5,
        o: p.c === 'r' ? 0.55 : 0.30,
        d: p.c === 'c' ? '2 3' : undefined,
      })
    }
  })

  // Lacework: inter-canopy connections that thicken the criss-cross.
  const lace: Line[] = [
    // upper canopy ridge — left → centre → right (curved dome)
    { x1: 76,  y1: 12, x2: 108, y2: 6,  w: 0.5, o: 0.25 },
    { x1: 108, y1: 6,  x2: 120, y2: 2,  w: 0.5, o: 0.32 },
    { x1: 120, y1: 2,  x2: 132, y2: 6,  w: 0.5, o: 0.32 },
    { x1: 132, y1: 6,  x2: 164, y2: 12, w: 0.5, o: 0.25 },
    // upper-centre cross-hatching
    { x1: 96,  y1: 14, x2: 108, y2: 6,  w: 0.5, o: 0.30 },
    { x1: 96,  y1: 14, x2: 120, y2: 2,  w: 0.5, o: 0.22, d: '2 3' },
    { x1: 144, y1: 14, x2: 132, y2: 6,  w: 0.5, o: 0.30 },
    { x1: 144, y1: 14, x2: 120, y2: 2,  w: 0.5, o: 0.22, d: '2 3' },
    { x1: 96,  y1: 14, x2: 144, y2: 14, w: 0.5, o: 0.20, d: '2 3' },
    // middle band
    { x1: 84,  y1: 14, x2: 96,  y2: 14, w: 0.5, o: 0.30 },
    { x1: 144, y1: 14, x2: 156, y2: 14, w: 0.5, o: 0.30 },
    { x1: 102, y1: 22, x2: 120, y2: 18, w: 0.5, o: 0.30 },
    { x1: 138, y1: 22, x2: 120, y2: 18, w: 0.5, o: 0.30 },
    { x1: 102, y1: 22, x2: 138, y2: 22, w: 0.5, o: 0.20, d: '2 3' },
    { x1: 96,  y1: 14, x2: 102, y2: 22, w: 0.5, o: 0.25 },
    { x1: 144, y1: 14, x2: 138, y2: 22, w: 0.5, o: 0.25 },
    // outer reach — within wordmark bounds (dome shoulders lowered)
    { x1: 66,  y1: 14, x2: 76,  y2: 12, w: 0.5, o: 0.25 },
    { x1: 66,  y1: 14, x2: 72,  y2: 24, w: 0.5, o: 0.22, d: '2 3' },
    { x1: 76,  y1: 12, x2: 84,  y2: 14, w: 0.5, o: 0.25 },
    { x1: 174, y1: 14, x2: 164, y2: 12, w: 0.5, o: 0.25 },
    { x1: 174, y1: 14, x2: 168, y2: 24, w: 0.5, o: 0.22, d: '2 3' },
    { x1: 164, y1: 12, x2: 156, y2: 14, w: 0.5, o: 0.25 },
    // lower canopy
    { x1: 72,  y1: 24, x2: 80,  y2: 26, w: 0.5, o: 0.30 },
    { x1: 160, y1: 26, x2: 168, y2: 24, w: 0.5, o: 0.30 },
    { x1: 80,  y1: 26, x2: 120, y2: 30, w: 0.5, o: 0.22 },
    { x1: 120, y1: 30, x2: 160, y2: 26, w: 0.5, o: 0.22 },
  ]
  const trunkLines: Line[] = []      // empty — no middle scatter anymore
  const TRUNK_SCATTER: { x: number; y: number }[] = []

  // HANGING branches — small data points drop down from canopy dots so
  // the tree reads as hanging/drooping (less starburst, more weeping).
  const HANGS = [
    { from: { x: 66,  y: 14 }, to: { x: 64,  y: 22 } },
    { from: { x: 76,  y: 12 }, to: { x: 74,  y: 20 } },
    { from: { x: 84,  y: 14 }, to: { x: 82,  y: 24 } },
    { from: { x: 72,  y: 24 }, to: { x: 70,  y: 32 } },
    { from: { x: 80,  y: 26 }, to: { x: 82,  y: 34 } },
    { from: { x: 108, y: 6  }, to: { x: 106, y: 14 } },
    { from: { x: 132, y: 6  }, to: { x: 134, y: 14 } },
    { from: { x: 120, y: 18 }, to: { x: 120, y: 28 } },
    { from: { x: 120, y: 30 }, to: { x: 120, y: 37 } },
    { from: { x: 156, y: 14 }, to: { x: 158, y: 24 } },
    { from: { x: 164, y: 12 }, to: { x: 162, y: 20 } },
    { from: { x: 174, y: 14 }, to: { x: 172, y: 22 } },
    { from: { x: 160, y: 26 }, to: { x: 158, y: 34 } },
    { from: { x: 168, y: 24 }, to: { x: 170, y: 32 } },
  ]

  return (
    <a href="/" className={`nv-logo nv-logo-${size}`} aria-label="nivria — home">
      <span className="nv-logo-chart" aria-hidden="true">
        <svg viewBox="0 0 240 38" preserveAspectRatio="none">
          {/* lacework connections in the canopy */}
          {lace.map((l, i) => (
            <line key={`la${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="currentColor" strokeWidth={l.w} strokeOpacity={l.o}
              strokeDasharray={l.d} strokeLinecap="round" />
          ))}
          {/* branches from trunk tops out to canopy dots */}
          {branches.map((l, i) => (
            <line key={`br${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="currentColor" strokeWidth={l.w} strokeOpacity={l.o}
              strokeDasharray={l.d} strokeLinecap="round" />
          ))}
          {/* canopy scatter dots — small so they don't compete with the
              prominent i-dots below */}
          {CANOPY.map((p, i) => (
            <circle key={`c${i}`} cx={p.x} cy={p.y} r="1.0"
              fill="currentColor" />
          ))}
          {/* criss-cross between the two trunks (trunk-channel scatter) */}
          {trunkLines.map((l, i) => (
            <line key={`tl${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="currentColor" strokeWidth={l.w} strokeOpacity={l.o}
              strokeLinecap="round" />
          ))}
          {TRUNK_SCATTER.map((p, i) => (
            <circle key={`ts${i}`} cx={p.x} cy={p.y} r="0.9" fill="currentColor" />
          ))}
          {/* HANGING branches — drops that hang down from canopy dots */}
          {HANGS.map((h, i) => (
            <g key={`h${i}`}>
              <line x1={h.from.x} y1={h.from.y} x2={h.to.x} y2={h.to.y}
                stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.42" strokeLinecap="round" />
              <circle cx={h.to.x} cy={h.to.y} r="0.8" fill="currentColor" />
            </g>
          ))}
          {/* trunks have moved OUT of the SVG — they're now CSS elements
              attached to each i in the wordmark below, so they're always
              centered on the i (no coordinate calibration needed) */}
        </svg>
      </span>
      <span className="nv-logo-text">
        n
        <span className="nv-logo-i" role="img" aria-label="i">
          <span className="nv-logo-i-line" aria-hidden="true" />
          <span className="nv-logo-i-top" aria-hidden="true" />
          <svg className="nv-logo-i-roots" viewBox="0 0 20 10" aria-hidden="true"><line x1="10" y1="0" x2="2" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><line x1="10" y1="0" x2="18" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="2" cy="9" r="1.7" fill="currentColor" /><circle cx="18" cy="9" r="1.7" fill="currentColor" /></svg>
        </span>
        vr
        <span className="nv-logo-i" role="img" aria-label="i">
          <span className="nv-logo-i-line" aria-hidden="true" />
          <span className="nv-logo-i-top" aria-hidden="true" />
          <svg className="nv-logo-i-roots" viewBox="0 0 20 10" aria-hidden="true"><line x1="10" y1="0" x2="2" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><line x1="10" y1="0" x2="18" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="2" cy="9" r="1.7" fill="currentColor" /><circle cx="18" cy="9" r="1.7" fill="currentColor" /></svg>
        </span>
        a
      </span>
    </a>
  )
}

// ─── HERO — the three rules, applied (split layout) ──────────────────────
function Hero() {
  return (
    <section className="nv-hero">
      <div className="nv-wrap nv-hero-split">
        {/* LEFT — text */}
        <div className="nv-hero-text">
          {/* RULE 1 — the headline IS the identity */}
          <h1 className="nv-h1">
            <span className="nv-h1-mark">nivria.</span>
          </h1>
          <p className="nv-h1-sub">
            <em>A new standard</em> for the evaluation and stewardship of complex ventures.
          </p>

          {/* RULE 2 — description directly under headline */}
          <div className="nv-desc">
            <p>
              Every complex venture runs on <em>millions of nodes</em> — decisions, incentives, relationships, dependencies. We get <em>beneath the surface</em> to find what is actually true, score the integrity of the whole, and build the accurate picture from which strategy can be developed — and then <em>stay on</em> to actively help you put it in motion.
            </p>
            <p>
              Where finance and legal stop, <span className="nv-inline-wordmark">n<span className="nv-logo-i" role="img" aria-label="i"><span className="nv-logo-i-line" aria-hidden="true" /><span className="nv-logo-i-top" aria-hidden="true" /><svg className="nv-logo-i-roots" viewBox="0 0 20 10" aria-hidden="true"><line x1="10" y1="0" x2="2" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><line x1="10" y1="0" x2="18" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="2" cy="9" r="1.7" fill="currentColor" /><circle cx="18" cy="9" r="1.7" fill="currentColor" /></svg></span>vr<span className="nv-logo-i" role="img" aria-label="i"><span className="nv-logo-i-line" aria-hidden="true" /><span className="nv-logo-i-top" aria-hidden="true" /><svg className="nv-logo-i-roots" viewBox="0 0 20 10" aria-hidden="true"><line x1="10" y1="0" x2="2" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><line x1="10" y1="0" x2="18" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="2" cy="9" r="1.7" fill="currentColor" /><circle cx="18" cy="9" r="1.7" fill="currentColor" /></svg></span>a</span> begins.
            </p>
            <a href="mailto:briefing@nivria.ai?subject=Briefing%20request" className="nv-cta">
              Request a briefing
              <svg width="18" height="11" viewBox="0 0 18 11" fill="none" aria-hidden="true">
                <path d="M0 5.5h17M12 1l5 4.5L12 10" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </a>
          </div>
        </div>

        {/* RIGHT — RULE 3, supporting graphic: who we serve */}
        <HeldBy />
      </div>
    </section>
  )
}

// ─── Held by — 4 audience tiles + lifecycle strip ────────────────────────
function HeldBy() {
  return (
    <figure className="nv-held">
      <div className="nv-held-k">Held by</div>
      <div className="nv-held-grid">
        <div className="nv-held-tile">
          <div className="nv-held-mark">01 · Sponsors &amp; operators</div>
          <div className="nv-held-name">Consortia<br/>&amp; joint ventures.</div>
          <div className="nv-held-line">Sponsors, operators, lenders inside the structure.</div>
        </div>
        <div className="nv-held-tile">
          <div className="nv-held-mark">02 · Stewards</div>
          <div className="nv-held-name">Family offices<br/>&amp; foundations.</div>
          <div className="nv-held-line">Every member a stakeholder. Legacy as the asset.</div>
        </div>
        <div className="nv-held-tile">
          <div className="nv-held-mark">03 · Capital</div>
          <div className="nv-held-name">Lenders, DFIs,<br/>sovereigns.</div>
          <div className="nv-held-line">Examining the field — diligence before commitment.</div>
        </div>
        <div className="nv-held-tile">
          <div className="nv-held-mark">04 · The ground</div>
          <div className="nv-held-name">People<br/>&amp; communities.</div>
          <div className="nv-held-line">The relationship that breaks projects first.</div>
        </div>
      </div>
      <figcaption className="nv-held-cap">
        <span className="nv-held-cap-k">Across the lifecycle</span>
        <span className="nv-held-cap-bar">
          <span>i. Evaluation</span>
          <em>·</em>
          <span>ii. Formation</span>
          <em>·</em>
          <span>iii. Execution</span>
          <em>·</em>
          <span>iv. Stewardship</span>
        </span>
      </figcaption>
    </figure>
  )
}

// ─── METHODOLOGY — viewport 03 ───────────────────────────────────────────
// Four hiring positions (who can engage NIVRIA — and NIVRIA does both
// evaluation AND active help, not just evaluation).
// Plus four capabilities that back the work.
const POSITIONS = [
  {
    kicker: 'The consortium',
    name: 'The whole venture.',
    body: 'A JV, mega-project, family enterprise, or coalition engages nivria on behalf of the entire structure — to assess the venture, drive coordination across all parties, and actively maintain stakeholder alignment over time.',
    use: 'When a venture has too many moving parts for one party to hold together. nivria becomes the shared instrument.',
  },
  {
    kicker: 'A member of it',
    name: 'One party inside.',
    body: 'A sponsor, operator, lender, family office, or anchor partner inside the venture engages nivria to see what peers are actually doing, find where the weak links are forming, and actively protect their position.',
    use: 'When you want an independent voice not on anyone else’s payroll — assessment plus active counsel from inside the deal.',
  },
  {
    kicker: 'An outside examiner',
    name: 'Capital looking in.',
    body: 'A lender doing diligence, a DFI weighing a facility, or a would-be partner evaluating a deal engages nivria for an independent assessment before committing — or to actively monitor an existing position from arm’s length.',
    use: 'When you need a structural picture produced outside the venture, with no incentive to find what the venture wants found.',
  },
  {
    kicker: 'The community',
    name: 'The ground holding it accountable.',
    body: 'A community group, civil society organization, or watchdog engages nivria to surface where the equilibrium actually lives — and to actively hold sponsors and lenders to the standards their funders are supposed to require.',
    use: 'When the official “community liaison” is the filter. Source, not filter — the engagement is the leverage.',
  },
]

const CAPABILITIES = [
  {
    k: 'Continuous monitoring',
    h: '24/7 across the connectome web.',
    body: 'Every signal logged, every drift surfaced as it begins. The score is live; the system never sleeps. Built to watch the relationships that move first.',
    stat: 'real-time · always on',
  },
  {
    k: 'Proprietary simulations',
    h: 'Stress-test before reality does.',
    body: 'Model interventions and run scenarios across the full web — see what moves the score, what happens if, where the weak link forms next. Before you make the call.',
    stat: 'scenario engine · in-house',
  },
  {
    k: 'Deep research',
    h: 'Dossiers on every load-bearing actor.',
    body: 'Historical and current — incentives, voting records, decision patterns, behavior under pressure. Every actor inside the venture and out, by name and by file.',
    stat: 'human-led · machine-augmented',
  },
  {
    k: 'Multi-source corroboration',
    h: 'No single voice carries truth.',
    body: 'Every signal corroborated by two to three independent witnesses minimum. Documented, timestamped, traceable to source. If it isn’t backed, it isn’t in the score.',
    stat: '≥ 2 witnesses · per signal',
  },
  {
    k: 'AI pattern detection',
    h: 'Across millions of signals, in real time.',
    body: 'Pattern detection across the full connectome web — surfacing drift, correlations, and weak-link formation before they cascade. Machine handles the volume; the examiner makes the call.',
    stat: 'real-time · millions of signals',
  },
  {
    k: 'Global network of subject matter experts',
    h: 'Vetted SMEs in every market we work.',
    body: 'Practitioners, sector specialists, in-region partners — selected for domain depth and ground-level reach. The network that sees on the ground is the same one that actively reaches to move things.',
    stat: 'in-domain · in-region',
  },
]

function WhoIsThisFor() {
  return (
    <section className="nv-sect nv-who" id="sec-who">
      <div className="nv-wrap">
        <header className="nv-sect-head nv-sect-head-center">
          <h2 className="nv-h2"><span>Who this is <em>for.</em></span></h2>
          <div className="nv-sect-desc">
            <p>People running <em>complex, high-stakes initiatives</em> that demand more <em>depth and discretion</em> than the market can offer.</p>
          </div>
        </header>
        <HiringPositions />
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="nv-sect nv-system" id="sec-how">
      <div className="nv-wrap">
        <header className="nv-sect-head nv-sect-head-center">
          <h2 className="nv-h2"><span>How it <em>works.</em></span></h2>
          <div className="nv-sect-desc">
            <p>The nivria team&rsquo;s balance — <em>AI</em> for processing data at scale, <em>experience</em> for <em>knowing what to do with it.</em></p>
          </div>
        </header>
        <Capabilities />
        <p className="nv-system-coda">Custom to <em>you, your needs, your goals</em> — and <em>continuously improving</em> over time.</p>
      </div>
    </section>
  )
}

function HiringPositions() {
  return (
    <figure className="nv-hire">
      <div className="nv-hire-grid">
        {POSITIONS.map((p, i) => (
          <article key={p.kicker} className="nv-hire-cell">
            <div className="nv-hire-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</div>
            <div className="nv-hire-kicker">{p.kicker}</div>
            <h3 className="nv-hire-name">{p.name}</h3>
            <p className="nv-hire-body">{p.body}</p>
            <div className="nv-hire-foot">
              <div className="nv-hire-foot-k">When they engage us</div>
              <p>{p.use}</p>
            </div>
          </article>
        ))}
      </div>
    </figure>
  )
}

function Capabilities() {
  return (
    <div className="nv-cap">
      <div className="nv-cap-grid">
        {CAPABILITIES.map((c, i) => (
          <article key={c.k} className="nv-cap-card">
            <div className="nv-cap-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</div>
            <div className="nv-cap-card-k">{c.k}</div>
            <h4 className="nv-cap-card-h">{c.h}</h4>
            <p className="nv-cap-card-body">{c.body}</p>
            <div className="nv-cap-card-stat">{c.stat}</div>
          </article>
        ))}
      </div>
    </div>
  )
}

// ─── LIFECYCLE — viewport 04 ─────────────────────────────────────────────
const LIFECYCLE = [
  {
    num: '01',
    name: 'Evaluation',
    sub: 'Diligence before commitment',
    fee: 'Project engagement',
    body: 'An independent read of a potential venture’s connectome web. Is it viable, what is the stakeholder terrain, where are the landmines? Output: a go / no-go and a map of what it would take to make it work.',
  },
  {
    num: '02',
    name: 'Formation',
    sub: 'Qualify, coordinate, develop the strategy',
    fee: 'Project engagement',
    pivot: true,
    body: 'Securing the EXIM loan, the DFI facility, or the major grant requires demonstrating real stakeholder coordination up front. nivria drives that coordination, develops the strategy to hold it, and the NIV score becomes the auditable picture of where it stands.',
    callout: 'The NIV score helps you meet or exceed the stakeholder coordination and community-engagement standards typically required by EXIM, DFC, IFC Performance Standards, the Equator and Santiago Principles, and prestigious foundation diligence.',
  },
  {
    num: '03',
    name: 'Execution',
    sub: 'Stay on to put the strategy in motion',
    fee: 'Retainer',
    body: 'With the strategy developed, nivria stays on with the team to actively execute it — tracking the strain, intervening where the weak link is forming, reaching stakeholders before things cascade. Live monitoring, active hand on the work.',
  },
  {
    num: '04',
    name: 'Stewardship',
    sub: 'Stay on to keep it intact',
    fee: 'Retainer',
    body: 'Once the venture is running, nivria stays on as long-term steward — keeping the NIV score up, catching the inside-breakdown early, and ready to move on drift, narrative risk, or alignment slip the moment they appear.',
  },
]

function Lifecycle() {
  return (
    <section className="nv-sect nv-life" id="sec-lifecycle">
      <div className="nv-wrap">
        <header className="nv-sect-head nv-sect-head-center">
          <h2 className="nv-h2"><span>At any <em>phase</em> of the venture.</span></h2>
          <div className="nv-sect-desc">
            <p>Engage nivria at <em>one phase,</em> several, or for the <em>whole life</em> of the venture.</p>
          </div>
        </header>

        <div className="nv-life-panel">
          <div className="nv-life-head">
            <span className="nv-life-k">The four phases</span>
            <span className="nv-life-meta">Engage at any one — or all</span>
          </div>

          <ol className="nv-life-list">
            {LIFECYCLE.map(p => (
              <li
                key={p.name}
                className={`nv-life-stage${p.pivot ? ' nv-life-stage-pivot' : ''}`}
              >
                <div className="nv-life-num-wrap">
                  <div className="nv-life-num">{p.num}</div>
                  {p.pivot && <div className="nv-life-pin" aria-hidden="true">★</div>}
                </div>
                <div className="nv-life-meta-col">
                  <div className="nv-life-name">{p.name}</div>
                  <div className="nv-life-sub">{p.sub}</div>
                  <div className="nv-life-fee">{p.fee}</div>
                </div>
                <div className="nv-life-body">
                  <p>{p.body}</p>
                  {p.pivot && p.callout && (
                    <div className="nv-life-callout">
                      <div className="nv-life-callout-k">Meets the bar funders set</div>
                      <p>{p.callout}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <footer className="nv-life-foot">
            <span className="nv-life-foot-k">Engagement model</span>
            <span className="nv-life-foot-v">
              Project engagements at <strong>Evaluation</strong> and <strong>Formation.</strong> Retainer through <strong>Execution</strong> and <strong>Stewardship.</strong>
            </span>
          </footer>
        </div>
      </div>
    </section>
  )
}

// ─── CASE FILE — viewport 06 ─────────────────────────────────────────────
// A worked example. Institutional case-file format: subject + divergence
// (market vs NIVRIA) + drivers + recommended interventions + score trend
// + recent activity + sources.

const DIVERGENCE = {
  market: {
    label: 'Market consensus',
    quote: 'DFI financing expected to close Q3 2026, with first ore by Q2 2027.',
    source: 'Standard project-finance press, sponsor IR statements',
  },
  nivria: {
    label: 'nivria',
    quote: 'No earlier than Q1 2027 close. First ore Q4 2027 at the earliest. Three drivers gate the financing milestone.',
    source: 'Live connectome web · 16 stakeholders monitored · 30-day movement log',
  },
}

const INTERVENTIONS = [
  {
    n: '01',
    title: 'Open formal consultation with the indigenous council.',
    body: 'Begin substantive dialogue before the anchor lender’s review window. The council is asking for a process, not just an outcome — start it now, on the record, with a published consultation calendar.',
    impact: '+8',
    on: 'alignment',
  },
  {
    n: '02',
    title: 'Move the EIA ahead of the political timeline.',
    body: 'Engage the operator’s government affairs to bring the environmental impact assessment in front of the environment ministry before the next legislative session, not behind it. Take the framing initiative.',
    impact: '+12',
    on: 'alignment',
  },
  {
    n: '03',
    title: 'Pre-brief the national daily with verifiable data.',
    body: 'Equip the editorial team with on-the-record numbers ahead of the next investigative cycle. Shift the framing from “opaque sponsor” to “transparent operator under independent monitoring.”',
    impact: '+15',
    on: 'narrative',
  },
]

function CaseFile() {
  return (
    <section className="nv-sect nv-case">
      <div className="nv-wrap">
        <header className="nv-sect-head nv-sect-head-center">
          <h2 className="nv-h2"><span>The <em>divergence,</em> and what to do.</span></h2>
          <div className="nv-sect-desc">
            <p>Continuing the example — the same nickel JV.</p>
            <p>Where nivria <em>diverges</em> from the market consensus, and three moves we&rsquo;d run from here.</p>
          </div>
        </header>

        {/* THE DIVERGENCE — the most concrete value moment */}
        <div className="nv-div">
          <div className="nv-div-grid">
            <div className="nv-div-col nv-div-them">
              <div className="nv-div-label">{DIVERGENCE.market.label}</div>
              <blockquote className="nv-div-quote">&ldquo;{DIVERGENCE.market.quote}&rdquo;</blockquote>
              <div className="nv-div-src">{DIVERGENCE.market.source}</div>
            </div>
            <div className="nv-div-vs" aria-hidden="true">⟷</div>
            <div className="nv-div-col nv-div-us">
              <div className="nv-div-label">{DIVERGENCE.nivria.label}</div>
              <blockquote className="nv-div-quote">&ldquo;{DIVERGENCE.nivria.quote}&rdquo;</blockquote>
              <div className="nv-div-src">{DIVERGENCE.nivria.source}</div>
            </div>
          </div>
        </div>

        {/* THREE MOVES — active help made concrete */}
        <div className="nv-int">
          <div className="nv-int-head">
            <span className="nv-int-k">Three moves we&rsquo;d run from here</span>
            <span className="nv-int-meta">Projected score impact · proprietary simulation</span>
          </div>
          <ol className="nv-int-list">
            {INTERVENTIONS.map(i => (
              <li key={i.n} className="nv-int-row">
                <div className="nv-int-num">{i.n}</div>
                <div className="nv-int-body">
                  <h3 className="nv-int-title">{i.title}</h3>
                  <p>{i.body}</p>
                </div>
                <div className="nv-int-impact">
                  <span className="nv-int-impact-v">{i.impact}</span>
                  <span className="nv-int-impact-on">{i.on}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="nv-int-foot">
            Illustrative. Real engagements produce a longer playbook of moves, sequenced and assigned. <em>nivria stays on to run them.</em>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── PEOPLE — viewport 06 (the team behind the system) ─────────────────
// 2×2 grid of principles, each with a custom geometric SVG mark.
// The marks are abstract — not stock icons. They gesture at the concept.

// Every side — four points around a center (compass / every position)
const IconEverySide = () => (
  <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-hidden="true">
    <circle cx="22" cy="6"  r="2.4" fill="currentColor" />
    <circle cx="38" cy="22" r="2.4" fill="currentColor" />
    <circle cx="22" cy="38" r="2.4" fill="currentColor" />
    <circle cx="6"  cy="22" r="2.4" fill="currentColor" />
    <circle cx="22" cy="22" r="3"   stroke="currentColor" strokeWidth="1.2" />
    <line x1="22" y1="9"  x2="22" y2="19" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.35" />
    <line x1="35" y1="22" x2="25" y2="22" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.35" />
    <line x1="22" y1="35" x2="22" y2="25" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.35" />
    <line x1="9"  y1="22" x2="19" y2="22" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.35" />
  </svg>
)

// Hard thing — a bridge arching across a gap (the hard thing, said and
// carried across). Two grounded endpoints, an arc between them, a faint
// ground line beneath suggesting the gap that's been spanned.
const IconHardThing = () => (
  <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-hidden="true">
    <line x1="4" y1="36" x2="40" y2="36" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.35" />
    <path d="M 8 32 Q 22 6 36 32" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <circle cx="8"  cy="32" r="2.4" fill="currentColor" />
    <circle cx="36" cy="32" r="2.4" fill="currentColor" />
  </svg>
)

// Every incentive — three equal hollow circles in a triangle, connected.
// Equal sizes signal "no party weighted above another." A small centroid
// dot inside shows the equilibrium they hold together.
const IconEveryIncentive = () => (
  <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-hidden="true">
    <line x1="22" y1="13" x2="12" y2="30" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.55" />
    <line x1="22" y1="13" x2="32" y2="30" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.55" />
    <line x1="14" y1="33" x2="30" y2="33" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.55" />
    <circle cx="22" cy="10" r="3" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="10" cy="33" r="3" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="34" cy="33" r="3" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="22" cy="25" r="1.5" fill="currentColor" />
  </svg>
)

// When it matters most — a circle with a single tick at the moment
const IconMattersMost = () => (
  <svg viewBox="0 0 44 44" width="44" height="44" fill="none" aria-hidden="true">
    <circle cx="22" cy="22" r="15" stroke="currentColor" strokeWidth="1.3" />
    <line x1="22" y1="9"  x2="22" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="22" y1="22" x2="22" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.55" />
    <line x1="22" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.55" />
    <circle cx="22" cy="22" r="1.6" fill="currentColor" />
  </svg>
)

const PEOPLE_NOTES = [
  {
    Icon: IconEverySide,
    h: 'We have been on <em>every side.</em>',
    body: 'The team has served as sponsors, operators, lenders, government counterparts, community advocates, and cross-border intermediaries. We are not theorizing about your situation — we have been in it, on every side of the table, around the world.',
  },
  {
    Icon: IconHardThing,
    h: 'We know how to say the <em>hard thing</em> in a way people can hear.',
    body: 'High-stakes communication is its own craft. What to say, what not to say, when to wait, when to push. Across cultures, across borders, across tables that do not trust each other.',
  },
  {
    Icon: IconEveryIncentive,
    h: '<em>Every incentive</em> gets respected.',
    body: 'No party in your stakeholder web is moved by being ignored. Every incentive — even the inconvenient ones — gets read, respected, and worked with. That is how alignment actually holds.',
  },
  {
    Icon: IconMattersMost,
    h: 'We are there <em>when it matters most.</em>',
    body: 'Decisions do not get made by models or spreadsheets. They are made by people, often under pressure, often late. We are the ones beside you when those calls come — there to help you feel comfortable and confident in what you are about to do.',
  },
]

function People() {
  return (
    <section className="nv-sect nv-people" id="sec-people">
      <div className="nv-wrap">
        <header className="nv-sect-head nv-sect-head-center">
          <h2 className="nv-h2"><span>The nivria secret: <em>people.</em></span></h2>
          <div className="nv-sect-desc">
            <p>Beneath the AI, the system, the global network — <em>people.</em></p>
          </div>
        </header>

        <div className="nv-ppl-grid">
          {PEOPLE_NOTES.map(({ Icon, h, body }, i) => (
            <article key={i} className="nv-ppl-cell">
              <div className="nv-ppl-icon"><Icon /></div>
              <h3
                className="nv-ppl-cell-h"
                dangerouslySetInnerHTML={{ __html: h }}
              />
              <p className="nv-ppl-cell-body">{body}</p>
            </article>
          ))}
        </div>

        <div className="nv-ppl-sig">— The nivria team</div>
      </div>
    </section>
  )
}

// ─── CLOSE — viewport 07 (briefing CTA) ────────────────────────────────
function Close() {
  return (
    <section className="nv-sect nv-close" id="briefing">
      <div className="nv-wrap nv-close-wrap">
        <div className="nv-close-logo"><NivriaLogo size="lg" /></div>

        <h2 className="nv-close-h">
          For the initiatives that <em>matter most</em><span className="nv-close-dash">—</span>
          <span>and making sure they <em>succeed.</em></span>
        </h2>

        <div className="nv-close-actions">
          <a href="mailto:briefing@nivria.ai?subject=Briefing%20request" className="nv-close-cta">
            Request a briefing
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
              <path d="M0 6h18.5M14 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </a>
          <a href="mailto:briefing@nivria.ai" className="nv-close-mail">briefing@nivria.ai</a>
        </div>
      </div>
    </section>
  )
}

// ─── COLOPHON — page foot ──────────────────────────────────────────────
function Colophon() {
  return (
    <footer className="nv-colo">
      <div className="nv-wrap nv-colo-row">
        <div className="nv-colo-l">
          <NivriaLogo size="sm" />
          <span className="nv-colo-tag">For the evaluation and stewardship of complex ventures.</span>
        </div>
        <a href="/auth/login" className="nv-colo-sign">Sign in</a>
      </div>
    </footer>
  )
}

function SourceNotFilter() {
  return (
    <aside className="nv-snf">
      <div className="nv-snf-k">The operating principle</div>
      <h3 className="nv-snf-h"><em>Source,</em> not <em>filter.</em></h3>
      <div className="nv-snf-grid">
        <p>
          Most stakeholder work talks to the top — the minister, the CEO, the official &ldquo;community liaison.&rdquo; <strong>The top is the filter.</strong> The real equilibrium lives where nobody goes.
        </p>
        <p>
          nivria reads where it actually lives — through community leaders, ground operators, businesses in the area, civil society. The people we talk to to <em>read</em> the connectome web are the people we engage to <em>fix</em> it. Measurement and remedy run on <strong>the identical network</strong>.
        </p>
      </div>
    </aside>
  )
}

// ─── INSTRUMENT — viewport 02 (connectome web + NIV score) ───────────────
// Two columns. Each side owns one product piece: headline → definition →
// the visual. Spatial mapping is one-to-one.
function Instrument() {
  return (
    <section className="nv-sect nv-inst" id="sec-instrument">
      <div className="nv-wrap">
        <header className="nv-sect-head nv-sect-head-center">
          <h2 className="nv-h2"><span>The <em>new standard.</em></span></h2>
        </header>

        <div className="nv-inst-pair">
          {/* LEFT — the connectome web */}
          <div className="nv-inst-col">
            <h3 className="nv-inst-h">The <em>connectome web.</em></h3>
            <p className="nv-inst-p">
              A <em>connectome</em> is the complete wiring diagram of a brain — every connection, mapped. Every complex venture has one too: the live web of stakeholders, partners, communities, regulators, and capital it actually runs on. We map it.
            </p>
            <ConnectomeWeb />
          </div>

          {/* RIGHT — the NIV score */}
          <div className="nv-inst-col">
            <h3 className="nv-inst-h">The <em>NIV score.</em></h3>
            <p className="nv-inst-p">
              A real-time picture of the integrity of that web — decomposed into alignment, trust, narrative, and execution health. Backed by sourced, time-stamped evidence, not reputation.
            </p>
            <ScoreReadout />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Connectome web visualization ───────────────────────────────────────
function ConnectomeWeb() {
  const W = 760, H = 540
  const tone = (k: 'iron' | 'forest' | 'bronze') =>
    k === 'iron'   ? '#8C2820' :
    k === 'forest' ? '#5A6F4F' :
                     '#A37A2E'
  const nodeTone = (s: Stance) =>
    s === 'against' ? '#8C2820' :
    s === 'aligned' ? '#5A6F4F' :
                      '#A37A2E'

  return (
    <figure className="nv-conn">
      <div className="nv-conn-frame">
        <div className="nv-conn-head">
          <div className="nv-conn-subject">
            <strong>Nickel processing JV</strong>
            <span className="nv-conn-stage">formation stage</span>
          </div>
          <div className="nv-conn-count">
            <span className="nv-conn-count-n">16</span>
            <span className="nv-conn-count-l">load-bearing actors</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="nv-conn-svg" role="img"
             aria-label="Connectome web for an illustrative nickel processing JV — 16 stakeholders across four sectors">
          <defs>
            <radialGradient id="nv-halo-iron" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8C2820" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#8C2820" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="nv-halo-forest" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5A6F4F" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#5A6F4F" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="nv-halo-bronze" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A37A2E" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#A37A2E" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* very faint cross-quadrant dividers */}
          <line x1={W/2} y1={20} x2={W/2} y2={H-20} stroke="#1F1C16" strokeDasharray="2 8" />
          <line x1={20} y1={H/2} x2={W-20} y2={H/2} stroke="#1F1C16" strokeDasharray="2 8" />

          {/* sector zone labels */}
          {SECTORS.map((s, i) => (
            <text
              key={i}
              x={s.x} y={s.y}
              textAnchor={s.align}
              className="nv-conn-sec"
            >{s.label.toUpperCase()}</text>
          ))}

          {/* links */}
          {LINKS.map((l, i) => {
            const a = NODES[l.a], b = NODES[l.b]
            const c = tone(l.kind)
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={c}
                strokeWidth={l.kind === 'bronze' ? 1 : 1.4}
                strokeOpacity={l.kind === 'bronze' ? 0.30 : 0.50}
                strokeDasharray={l.kind === 'bronze' ? '3 5' : undefined}
              />
            )
          })}

          {/* nodes + labels */}
          {NODES.map(n => {
            const c = nodeTone(n.stance)
            const haloId =
              n.stance === 'against' ? 'nv-halo-iron' :
              n.stance === 'aligned' ? 'nv-halo-forest' :
                                       'nv-halo-bronze'
            return (
              <g key={n.n} className="nv-node">
                <circle cx={n.x} cy={n.y} r={n.r + 14} fill={`url(#${haloId})`} />
                <circle cx={n.x} cy={n.y} r={n.r} fill="#0D0B08" stroke={c} strokeWidth="1.6" />
                <circle cx={n.x} cy={n.y} r={n.r - 5} fill={c} fillOpacity="0.85" />
                <text x={n.x} y={n.y + 4} textAnchor="middle" className="nv-node-n">{n.n}</text>
                <text
                  x={n.x + n.lx}
                  y={n.y + n.ly}
                  textAnchor={n.la}
                  className={`nv-node-lbl nv-node-lbl-${n.stance}`}
                >{n.name}</text>
                <title>{`${n.n}. ${n.name} — ${n.role} · influence ${n.inf}/10`}</title>
              </g>
            )
          })}
        </svg>

        <div className="nv-conn-mvmt">
          <div className="nv-conn-mvmt-k">Recent movements <span>· last 30 days</span></div>
          <ul>
            {MOVEMENTS.map((m, i) => (
              <li key={i} className="nv-mvmt-row">
                <span className="nv-mvmt-date">{m.date}</span>
                <span className="nv-mvmt-text">{m.text}</span>
                <span className={`nv-mvmt-impact nv-mvmt-${m.arrow}`}>
                  {m.impact} {m.arrow === 'down' ? '▼' : '▲'} {m.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <figcaption className="nv-conn-cap">
          <span className="nv-conn-cap-note">Illustrative — generic JV in formation. Hover a node for detail.</span>
          <span className="nv-conn-key">
            <span><i style={{background:'#8C2820'}}/> resistance</span>
            <span><i style={{background:'#A37A2E'}}/> neutral</span>
            <span><i style={{background:'#5A6F4F'}}/> aligned</span>
          </span>
        </figcaption>
      </div>
    </figure>
  )
}

// ─── NIV score readout ──────────────────────────────────────────────────
function ScoreReadout() {
  return (
    <aside className="nv-read">
      <div className="nv-read-k">NIV score · live</div>
      <div className="nv-read-num">
        <span className="nv-read-big">60</span>
        <span className="nv-read-of">/ 100</span>
      </div>
      <div className="nv-read-state">Strained</div>
      <div className="nv-read-meta">Nickel JV · formation · evaluated 21 June 2026</div>

      <div className="nv-read-trend">
        <Sparkline data={TREND} />
        <div className="nv-read-trend-info">
          <span className="nv-read-trend-k">last 30 days</span>
          <span className="nv-read-trend-v">▼ 12</span>
        </div>
      </div>

      <div className="nv-read-rule" />

      <ul className="nv-sub">
        {SUBSCORES.map(s => (
          <li key={s.k} className="nv-sub-row">
            <div className="nv-sub-line">
              <span className="nv-sub-k">{s.k}</span>
              <span className="nv-sub-v">{s.v}</span>
            </div>
            <div className="nv-sub-bar" aria-hidden="true">
              <div className="nv-sub-bar-fill" style={{ width: `${s.v}%` }} />
            </div>
            <div className="nv-sub-note">{s.note}</div>
          </li>
        ))}
      </ul>

      <div className="nv-read-foot">
        <span className="nv-read-foot-k">Next decision window</span>
        <span className="nv-read-foot-v">Q4 2026 · anchor lender review</span>
      </div>
    </aside>
  )
}

// ─── small inline sparkline ─────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  const W = 160, H = 40, pad = 4
  const min = Math.min(...data), max = Math.max(...data)
  const span = Math.max(1, max - min)
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2)
    const y = pad + (1 - (v - min) / span) * (H - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const lastX = pad + (W - pad * 2)
  const lastY = pad + (1 - (data[data.length - 1] - min) / span) * (H - pad * 2)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="nv-spark" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#C9912E" strokeWidth="1.4" strokeOpacity="0.85" />
      <circle cx={lastX} cy={lastY} r="2.6" fill="#C9912E" />
    </svg>
  )
}

// ============================================================================
// CSS
// ============================================================================
const CSS = `
.nv {
  --bg: #0D0B08;
  --bg-2: #110F0B;
  --panel: #15130F;
  --panel-2: #1A1813;
  --ink: #F4ECD9;
  --ink-2: #D9CFB7;
  --ink-3: #A89E86;
  --ink-4: #6E6651;
  --rule: #2F2A20;
  --rule-soft: #211D16;
  --accent: #C9912E;
  --accent-deep: #8A6420;
  --iron: #8C2820;
  --bronze: #A37A2E;
  --forest: #5A6F4F;

  min-height: 100vh;
  color: var(--ink);
  font-family: var(--font-reader), 'Newsreader', Georgia, serif;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "onum" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  font-size: 17px;
  line-height: 1.6;
  position: relative;
  isolation: isolate;

  /* page-wide spotlight bed — multiple warm sources, fixed to viewport so
     they stay anchored while content scrolls through them (subtle parallax). */
  background:
    /* primary sun — top-left, large + warm */
    radial-gradient(1600px 1000px at 8% 4%,    rgba(201,145,46,.20), transparent 60%),
    /* mid-right glow */
    radial-gradient(1100px 760px  at 92% 32%,  rgba(201,145,46,.12), transparent 62%),
    /* deeper anchor — bottom-left, warm red */
    radial-gradient(1100px 880px  at 14% 82%,  rgba(140,40,32,.10),  transparent 65%),
    /* small bottom-right gold */
    radial-gradient(900px  720px  at 96% 96%,  rgba(201,145,46,.10), transparent 68%),
    /* center secondary — soft warmth in the middle of the page */
    radial-gradient(1200px 1000px at 50% 50%,  rgba(201,145,46,.04), transparent 70%),
    var(--bg);
  background-attachment: fixed;
}
/* page-wide paper grain layer, fixed under content */
.nv::before {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='nvbg'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.88  0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23nvbg)'/%3E%3C/svg%3E");
  opacity: 0.45;
  mix-blend-mode: overlay;
}
/* a second very faint vignette so the edges feel deeper than the centre */
.nv::after {
  content: '';
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: -1;
  background: radial-gradient(1400px 900px at 50% 40%, transparent 0%, transparent 55%, rgba(0,0,0,0.45) 100%);
}
.nv *, .nv *::before, .nv *::after { box-sizing: border-box; }
.nv ::selection { background: rgba(201,145,46,.32); color: var(--ink); }
.nv a { color: inherit; text-decoration: none; }
.nv em { font-style: italic; color: var(--accent); }
/* selectively bold the em accents in small body copy where italic alone
   reads too thin — large display italics keep their natural weight. */
.nv .nv-desc p em,
.nv .nv-inst-p em,
.nv .nv-life-callout p em { font-weight: 700; }
.nv strong { font-weight: 600; color: var(--ink); }
.nv .nv-wrap { max-width: 1360px; margin: 0 auto; padding: 0 48px; }

/* ─── HEADER ─────────────────────────────────────────────────────────── */
.nv .nv-hdr {
  padding: 18px 0;
  border-bottom: 1px solid var(--rule-soft);
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(13, 11, 8, 0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transform: translateY(0);
  transition: transform .35s cubic-bezier(.4, 0, .2, 1);
  will-change: transform;
}
.nv .nv-hdr.nv-hdr-hidden { transform: translateY(-110%); }

/* ─── SECTION NAV — fixed vertical dots, right side ──────────────────── */
.nv .nv-sn {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 6px;
  pointer-events: auto;
}
/* link element is a generous 32×32 invisible hit area */
.nv .nv-sn-dot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}
/* the visible dot — small by default, grows large on hover */
.nv .nv-sn-dot::before {
  content: '';
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--accent-deep);
  background: transparent;
  transition:
    width .25s cubic-bezier(.4, 0, .2, 1),
    height .25s cubic-bezier(.4, 0, .2, 1),
    background .2s,
    border-color .2s;
}
.nv .nv-sn-dot:hover::before {
  width: 20px;
  height: 20px;
  border-color: var(--accent);
  background: rgba(201,145,46,.22);
}
.nv .nv-sn-dot.nv-sn-dot-active::before {
  background: var(--accent);
  border-color: var(--accent);
}
.nv .nv-sn-dot.nv-sn-dot-active:hover::before {
  background: var(--accent);
  border-color: var(--accent);
}
.nv .nv-sn-label {
  position: absolute;
  right: 100%;
  margin-right: 14px;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 17px;
  line-height: 1.3;
  color: var(--ink);
  background: rgba(13,11,8,.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 9px 18px;
  border: 1px solid var(--accent-deep);
  box-shadow: 0 14px 36px -18px rgba(0, 0, 0, .6);
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s, transform .25s;
}
.nv .nv-sn-dot:hover .nv-sn-label {
  opacity: 1;
  transform: translateY(-50%) translateX(-4px);
}

/* ─── BACK TO TOP — fixed bottom-right ──────────────────────────────── */
.nv .nv-top {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 30;
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 1px solid var(--accent-deep);
  background: rgba(13,11,8,.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: translateY(10px);
  transition: opacity .3s, transform .3s, background .25s, border-color .25s;
}
.nv .nv-top.nv-top-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
.nv .nv-top:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

@media (max-width: 720px) {
  .nv .nv-sn { display: none; }
  .nv .nv-top { right: 14px; bottom: 14px; width: 40px; height: 40px; }
}
.nv .nv-hdr-row {
  display: flex; align-items: center; justify-content: space-between;
}
/* ─── LOGO — NIVRIA beneath a web of connected nodes ──────────────── */
.nv .nv-logo {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: var(--accent);
  transition: opacity .2s ease;
  line-height: 1;
}
.nv .nv-logo:hover { opacity: 0.92; }

/* chart sits above the wordmark — could stand alone as a logomark */
.nv .nv-logo-chart {
  display: block;
  width: 100%;
  color: var(--accent);
  pointer-events: none;
}
.nv .nv-logo-chart svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.nv .nv-logo-text {
  font-family: var(--font-logo), 'DM Serif Display', serif;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--ink);
  border-bottom: 0.04em solid var(--accent);
  padding-bottom: 0.02em;
}
/* the i is REPLACED with a custom data column. Line + top dot + bot dot
   are all child elements using the SAME centering technique (left:50% +
   translateX(-50%)) so they're guaranteed to align on the vertical axis. */
.nv .nv-logo-i {
  display: inline-block;
  position: relative;
  width: 0.22em;
  height: 0.70em;
  vertical-align: baseline;
  margin: 0 0.04em;
  top: 0.08em;            /* nudge i down to sit lower against the wordmark */
}
.nv .nv-logo-i-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: -0.05em;
  width: 3px;
  background: var(--accent);
  transform: translateX(-50%);
}
.nv .nv-logo-i-trunk {
  position: absolute;
  left: 50%;
  bottom: -0.20em;        /* anchored AT the bottom dot */
  width: 1.2px;
  height: 1.55em;          /* extends through i and up to close gap to canopy */
  background: var(--accent);
  transform: translateX(-50%);
}
.nv .nv-logo-i-top {
  position: absolute;
  left: 50%;
  top: -0.15em;
  width: 0.17em;
  height: 0.17em;
  background: var(--accent);
  border-radius: 50%;
  transform: translateX(-50%);
}
.nv .nv-logo-i-trunktop {
  /* data point where the trunk meets the canopy */
  position: absolute;
  left: 50%;
  bottom: 1.30em;
  width: 0.11em;
  height: 0.11em;
  background: var(--accent);
  border-radius: 50%;
  transform: translate(calc(-50% - 0.6px), 0);
}
/* roots: upside-down V that sits BELOW the gold ground line.
   translateY pushes the whole splay past the border so the line
   reads as the ground surface and the V is what's underneath. */
.nv .nv-logo-i-roots {
  position: absolute;
  left: 50%;
  top: 100%;
  width: 0.55em;
  height: 0.28em;
  color: var(--accent);
  transform: translate(-50%, 0.02em);
  overflow: visible;
  display: block;
  pointer-events: none;
}

/* inline wordmark — "nivria" rendered with the logo's font + gold-i
   styling, but without the trunks (so it sits cleanly inside prose) */
.nv .nv-inline-wordmark {
  font-family: var(--font-logo), 'DM Serif Display', serif;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--ink);
}
/* in-prose usage: drop the ground line + roots, bump the i-dot, slim the stem */
.nv .nv-inline-wordmark .nv-logo-i-roots { display: none; }
.nv .nv-inline-wordmark .nv-logo-i-top {
  width: 0.24em;
  height: 0.24em;
  top: -0.20em;
}
.nv .nv-inline-wordmark .nv-logo-i-line { width: 1.5px; }
/* header logo (md) — slimmer i-stem to match the in-prose feel */
.nv .nv-logo-md .nv-logo-i-line { width: 1.5px; }

/* sizes */
.nv .nv-logo-lg { width: 560px; }
.nv .nv-logo-lg .nv-logo-text { font-size: 76px; letter-spacing: 0.05em; }
.nv .nv-logo-lg .nv-logo-chart { height: 92px; margin-bottom: -6px; }

.nv .nv-logo-md { width: 220px; }
.nv .nv-logo-md .nv-logo-text { font-size: 30px; }
.nv .nv-logo-md .nv-logo-chart { height: 34px; margin-bottom: -2px; }

.nv .nv-logo-sm { width: 150px; }
.nv .nv-logo-sm .nv-logo-text { font-size: 20px; letter-spacing: 0.03em; }
.nv .nv-logo-sm .nv-logo-chart { height: 22px; margin-bottom: -2px; }
.nv .nv-nav { display: flex; align-items: center; gap: 28px; }
.nv .nv-nav-cta {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 17px; color: var(--accent);
  border-bottom: 1px solid var(--accent-deep);
  padding-bottom: 2px;
}
.nv .nv-nav-cta:hover { color: var(--accent); border-color: var(--accent); }
.nv .nv-nav-link {
  font-family: var(--font-reader), serif;
  font-size: 16.5px; color: var(--ink-3);
}
.nv .nv-nav-link:hover { color: var(--ink); }
.nv .nv-nav-founder {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 17px;
  color: var(--accent);
  border-bottom: 1px solid var(--accent-deep);
  padding-bottom: 2px;
  transition: color .2s, border-color .2s;
}
.nv .nv-nav-founder:hover { color: var(--accent); border-color: var(--accent); }

/* ─── HERO ──────────────────────────────────────────────────────────── */
.nv .nv-hero {
  position: relative;
  padding: 64px 0 96px;
}

.nv .nv-hero-split {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 64px;
  align-items: start;
}
.nv .nv-hero-text { min-width: 0; }

/* RULE 1 — headline IS the identity */
.nv .nv-h1 {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 700;
  font-size: clamp(44px, 5.4vw, 80px);
  line-height: 0.98;
  letter-spacing: -0.028em;
  color: var(--ink);
  margin: 0;
  display: grid;
  gap: 6px;
}
.nv .nv-h1-mark {
  display: block;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  letter-spacing: -0.012em;
}
.nv .nv-h1-line {
  display: block;
  font-weight: 500;
  font-variation-settings: "opsz" 144, "SOFT" 18;
  color: var(--ink-2);
}
.nv .nv-h1 em {
  color: var(--accent);
  font-variation-settings: "opsz" 144, "SOFT" 60;
}
/* sub-headline — sits directly under the NIVRIA wordmark */
.nv .nv-h1-sub {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 18;
  font-weight: 500;
  font-style: italic;
  font-size: clamp(24px, 2.6vw, 36px);
  line-height: 1.18;
  letter-spacing: -0.012em;
  color: var(--ink-2);
  max-width: 22ch;
  margin: 18px 0 0;
}
.nv .nv-h1-sub em {
  color: var(--accent);
  font-variation-settings: "opsz" 60, "SOFT" 60;
  font-style: italic;
}

/* RULE 2 — description directly under headline */
.nv .nv-desc {
  max-width: 560px;
  margin-top: 32px;
}
.nv .nv-desc p {
  font-family: var(--font-reader), serif;
  font-size: 20px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0 0 16px;
}
.nv .nv-desc p strong { color: var(--ink); font-weight: 600; }
.nv .nv-desc p em { font-style: italic; color: var(--accent); }
.nv .nv-cta {
  display: inline-flex; align-items: center; gap: 12px;
  margin-top: 18px;
  padding: 12px 22px;
  border: 1px solid var(--accent);
  color: var(--accent);
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 15.5px;
  font-weight: 500;
  transition: background .2s, color .2s;
}
.nv .nv-cta:hover { background: var(--accent); color: var(--bg); }
.nv .nv-cta svg { transition: transform .2s; }
.nv .nv-cta:hover svg { transform: translateX(3px); }

/* RULE 3 — supporting graphic */

/* "Held by" — 4 audience tiles + lifecycle strip */
.nv .nv-held {
  margin: 0;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  position: relative;
  padding: 26px 28px 24px;
  display: flex; flex-direction: column;
  isolation: isolate;
}
.nv .nv-held::before {
  content: '';
  position: absolute; top: -1px; left: 0; width: 96px; height: 2px;
  background: var(--accent);
}
.nv .nv-held-k {
  font-family: var(--font-label), sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 22px;
}
.nv .nv-held-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--rule-soft);
  border-left: 1px solid var(--rule-soft);
}
.nv .nv-held-tile {
  padding: 22px 22px 22px;
  border-right: 1px solid var(--rule-soft);
  border-bottom: 1px solid var(--rule-soft);
  transition: background .2s ease;
}
.nv .nv-held-tile:hover {
  background: rgba(201,145,46,.04);
}
.nv .nv-held-mark {
  font-family: var(--font-label), sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 14px;
}
.nv .nv-held-name {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 600;
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -0.018em;
  color: var(--ink);
  margin-bottom: 14px;
}
.nv .nv-held-line {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 16px;
  line-height: 1.5;
  color: var(--ink-3);
}
.nv .nv-held-cap {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--rule-soft);
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 22px; flex-wrap: wrap;
}
.nv .nv-held-cap-k {
  font-family: var(--font-label), sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
}
.nv .nv-held-cap-bar {
  display: inline-flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 18px;
  color: var(--ink-2);
}
.nv .nv-held-cap-bar em {
  font-style: normal;
  color: var(--ink-4);
  padding: 0 2px;
}

/* connectome web */
.nv .nv-conn {
  margin: 0;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  position: relative;
  overflow: hidden;
}
.nv .nv-conn::before {
  content: '';
  position: absolute; top: -1px; left: 0; width: 96px; height: 2px;
  background: var(--accent);
}
.nv .nv-conn-frame { padding: 22px 24px 18px; }

/* header row above the SVG */
.nv .nv-conn-head {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--rule-soft);
  gap: 16px;
}
.nv .nv-conn-subject {
  display: flex; align-items: baseline; gap: 10px;
  font-family: var(--font-editorial), serif;
  font-variation-settings: "opsz" 28, "SOFT" 0;
  font-size: 16px;
}
.nv .nv-conn-subject strong {
  color: var(--ink); font-weight: 600;
}
.nv .nv-conn-stage {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 13px;
  color: var(--ink-3);
}
.nv .nv-conn-count {
  display: inline-flex; align-items: baseline; gap: 8px;
}
.nv .nv-conn-count-n {
  font-family: var(--font-editorial), serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 700; font-size: 24px;
  color: var(--accent);
  line-height: 1;
}
.nv .nv-conn-count-l {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.nv .nv-conn-svg { display: block; width: 100%; height: auto; }

/* svg text styles */
.nv .nv-conn-svg .nv-conn-sec {
  font-family: var(--font-label), sans-serif;
  font-size: 12px; letter-spacing: 0.20em;
  fill: var(--ink);
  font-weight: 600;
}
.nv .nv-conn-svg .nv-node-n {
  font-family: var(--font-mono), monospace;
  font-size: 10.5px;
  font-weight: 500;
  fill: var(--ink);
  pointer-events: none;
}
.nv .nv-conn-svg .nv-node-lbl {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 11.5px;
  fill: var(--ink-2);
  pointer-events: none;
}
.nv .nv-conn-svg .nv-node-lbl-against { fill: #BC7E76; }
.nv .nv-conn-svg .nv-node-lbl-aligned { fill: #9CB395; }
.nv .nv-conn-svg .nv-node-lbl-neutral { fill: #C9B486; }

/* recent movements strip */
.nv .nv-conn-mvmt {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--rule-soft);
}
.nv .nv-conn-mvmt-k {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 10px;
}
.nv .nv-conn-mvmt-k span {
  color: var(--ink-3);
  font-style: italic;
  font-family: var(--font-reader), serif;
  text-transform: none;
  letter-spacing: 0;
  font-size: 11.5px;
  margin-left: 4px;
}
.nv .nv-conn-mvmt ul {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 6px;
}
.nv .nv-mvmt-row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px dotted var(--rule-soft);
  font-size: 13.5px;
}
.nv .nv-mvmt-row:last-child { border-bottom: none; }
.nv .nv-mvmt-date {
  font-family: var(--font-mono), monospace;
  font-size: 11px; letter-spacing: 0.06em;
  color: var(--ink-3);
}
.nv .nv-mvmt-text {
  font-family: var(--font-reader), serif;
  color: var(--ink-2);
  line-height: 1.45;
}
.nv .nv-mvmt-impact {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--iron);
  white-space: nowrap;
}
.nv .nv-mvmt-up { color: var(--forest); }

.nv .nv-conn-cap {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--rule-soft);
  display: flex; justify-content: space-between; align-items: center;
  gap: 16px; flex-wrap: wrap;
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 12.5px;
  color: var(--ink-3);
}
.nv .nv-conn-cap-note { font-style: italic; }
.nv .nv-conn-key {
  display: flex; gap: 16px;
  font-family: var(--font-label), sans-serif;
  font-style: normal;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.nv .nv-conn-key span { display: inline-flex; align-items: center; gap: 7px; }
.nv .nv-conn-key i {
  display: inline-block;
  width: 8px; height: 8px; border-radius: 50%;
}

/* NIV score readout */
.nv .nv-read {
  margin: 0;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  padding: 24px 26px 22px;
  display: flex; flex-direction: column;
  position: relative;
}
.nv .nv-read::before {
  content: '';
  position: absolute; top: -1px; left: 0; right: 0; height: 2px;
  background: var(--accent);
}
.nv .nv-read-k {
  font-family: var(--font-label), sans-serif;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
}
.nv .nv-read-num {
  display: flex; align-items: baseline; gap: 10px;
}
.nv .nv-read-big {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 700;
  font-size: 96px;
  line-height: 0.9;
  letter-spacing: -0.04em;
  color: var(--ink);
}
.nv .nv-read-of {
  font-family: var(--font-mono), monospace;
  font-size: 16px;
  letter-spacing: 0.05em;
  color: var(--ink-3);
}
.nv .nv-read-state {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 18px;
  color: var(--accent);
  margin-top: 4px;
}
.nv .nv-read-meta {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 12.5px;
  color: var(--ink-3);
  margin-top: 8px;
}
.nv .nv-read-trend {
  margin-top: 18px;
  padding: 14px 0 12px;
  border-top: 1px solid var(--rule-soft);
  border-bottom: 1px solid var(--rule-soft);
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px;
}
.nv .nv-spark {
  width: 160px; height: 40px;
  display: block;
}
.nv .nv-read-trend-info {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 2px;
}
.nv .nv-read-trend-k {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.nv .nv-read-trend-v {
  font-family: var(--font-mono), monospace;
  font-size: 14px;
  color: var(--iron);
  letter-spacing: 0.04em;
}
.nv .nv-read-rule {
  height: 1px;
  background: transparent;
  margin: 16px 0 16px;
}
.nv .nv-sub {
  list-style: none;
  margin: 0; padding: 0;
  display: grid; gap: 18px;
}
.nv .nv-sub-line {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 6px;
}
.nv .nv-sub-k {
  font-family: var(--font-editorial), serif;
  font-variation-settings: "opsz" 18, "SOFT" 0;
  font-weight: 500;
  font-size: 13.5px;
  color: var(--ink);
  letter-spacing: -0.005em;
}
.nv .nv-sub-v {
  font-family: var(--font-mono), monospace;
  font-size: 13px;
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.nv .nv-sub-bar {
  height: 2px;
  background: var(--rule-soft);
  position: relative;
}
.nv .nv-sub-bar-fill {
  height: 100%;
  background: var(--accent);
  opacity: 0.75;
}
.nv .nv-sub-note {
  margin-top: 6px;
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink-3);
}
.nv .nv-read-foot {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--rule-soft);
  display: flex; flex-direction: column; gap: 4px;
}
.nv .nv-read-foot-k {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
}
.nv .nv-read-foot-v {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 13.5px;
  color: var(--ink-2);
}

/* ─── SECTION SCAFFOLD ──────────────────────────────────────────────── */
.nv .nv-sect {
  padding: 96px 0;
  position: relative;
  border-top: 1px solid var(--rule-soft);
  /* each section has a soft gradient cap — subtle warm tint that gives the
     section its own "lighting", layered over the fixed spotlights */
  background:
    radial-gradient(900px 340px at 50% 0%, rgba(201,145,46,.06), transparent 70%);
}
/* alternating warm-cool gradient cast so the page has rhythm */
.nv main > section:nth-of-type(odd) {
  background:
    radial-gradient(1000px 380px at 30% 0%, rgba(201,145,46,.08), transparent 70%),
    radial-gradient(800px 320px at 80% 100%, rgba(140,40,32,.04), transparent 70%);
}
.nv main > section:nth-of-type(even) {
  background:
    radial-gradient(1000px 380px at 70% 0%, rgba(201,145,46,.05), transparent 70%),
    radial-gradient(800px 320px at 20% 100%, rgba(201,145,46,.06), transparent 70%);
}
.nv .nv-sect-head {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 64px;
  align-items: start;
  margin-bottom: 48px;
}
.nv .nv-h2 {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 600;
  font-size: clamp(36px, 4.4vw, 64px);
  line-height: 1.02;
  letter-spacing: -0.024em;
  color: var(--ink);
  margin: 0;
  display: grid;
  gap: 4px;
}
.nv .nv-h2 span { display: block; }
.nv .nv-h2 em {
  color: var(--accent);
  font-variation-settings: "opsz" 144, "SOFT" 60;
}
.nv .nv-sect-desc p {
  font-family: var(--font-reader), serif;
  font-size: 17px;
  line-height: 1.62;
  color: var(--ink-2);
  margin: 0 0 14px;
}
.nv .nv-sect-desc p:last-child { margin-bottom: 0; }
.nv .nv-sect-desc p em { font-style: italic; color: var(--accent); }
.nv .nv-sect-desc p strong { color: var(--ink); font-weight: 600; }

/* ─── WHO IS THIS FOR (V03) + HOW IT WORKS (V04) ──────────────────────── */
.nv .nv-who { padding: 112px 0 96px; }
.nv .nv-system { padding: 96px 0 112px; }

/* centered section header variant — used by V03 */
.nv .nv-sect-head-center {
  grid-template-columns: 1fr;
  text-align: center;
  justify-items: center;
  margin-bottom: 72px;
  gap: 32px;
}
.nv .nv-sect-head-center .nv-h2 {
  font-size: clamp(48px, 6vw, 84px);
  letter-spacing: -0.028em;
  margin: 0;
}
.nv .nv-sect-head-center .nv-sect-desc {
  max-width: 820px;
}
.nv .nv-sect-head-center .nv-sect-desc p {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 36, "SOFT" 14;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(22px, 2.4vw, 30px);
  line-height: 1.35;
  letter-spacing: -0.008em;
  color: var(--ink-2);
  margin: 0 0 8px;
}
.nv .nv-sect-head-center .nv-sect-desc p:last-child { margin-bottom: 0; }
.nv .nv-sect-head-center .nv-sect-desc p em {
  color: var(--accent);
  font-variation-settings: "opsz" 36, "SOFT" 60;
  font-style: italic;
}

/* Hiring positions — 2×2 panel of who can engage NIVRIA */
.nv .nv-hire {
  margin: 0 0 72px;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  position: relative;
}
.nv .nv-hire::before {
  content: ''; position: absolute; top: -1px; left: 0; right: 0; height: 2px;
  background: var(--accent);
}
.nv .nv-hire-head {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 20px 28px;
  border-bottom: 1px solid var(--rule-soft);
}
.nv .nv-hire-k {
  font-family: var(--font-label), sans-serif;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
}
.nv .nv-hire-meta {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 13.5px;
  color: var(--ink-3);
}
.nv .nv-hire-meta em { color: var(--accent); font-style: italic; }
.nv .nv-hire-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--rule-soft);
}
.nv .nv-hire-cell {
  padding: 32px 32px;
  border-right: 1px solid var(--rule-soft);
  border-bottom: 1px solid var(--rule-soft);
  position: relative;
  display: flex; flex-direction: column;
}
.nv .nv-hire-cell:nth-child(2n) { border-right: none; }
.nv .nv-hire-cell:nth-child(n+3) { border-bottom: none; }
.nv .nv-hire-num {
  font-family: var(--font-mono), monospace;
  font-size: 11px; letter-spacing: 0.18em;
  color: var(--ink-4);
  margin-bottom: 10px;
}
.nv .nv-hire-kicker {
  font-family: var(--font-label), sans-serif;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
}
.nv .nv-hire-name {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 600;
  font-size: 26px;
  line-height: 1.1;
  letter-spacing: -0.018em;
  color: var(--ink);
  margin: 0 0 14px;
}
.nv .nv-hire-body {
  font-family: var(--font-reader), serif;
  font-size: 17.5px; line-height: 1.6;
  color: var(--ink-2);
  margin: 0 0 20px;
  flex: 1;
}
.nv .nv-hire-foot {
  padding-top: 14px;
  border-top: 1px dotted var(--rule);
  display: flex; flex-direction: column; gap: 6px;
}
.nv .nv-hire-foot-k {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.nv .nv-hire-foot p {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 16.5px; line-height: 1.55;
  color: var(--ink);
  margin: 0;
}

/* Coda — italic statement that lands below the 6 capability cards */
.nv .nv-system-coda {
  margin: 56px auto 0;
  max-width: 760px;
  text-align: center;
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 14;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(20px, 2.2vw, 28px);
  line-height: 1.35;
  letter-spacing: -0.008em;
  color: var(--ink-2);
  padding-top: 36px;
  border-top: 1px dotted var(--rule);
}
.nv .nv-system-coda em {
  color: var(--accent);
  font-variation-settings: "opsz" 60, "SOFT" 60;
  font-style: italic;
}

/* Capabilities — 6 cards in a 3×2 grid */
.nv .nv-cap { margin: 0; }
.nv .nv-cap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.nv .nv-cap-card {
  padding: 24px 22px 22px;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule-soft);
  position: relative;
  display: flex; flex-direction: column;
}
.nv .nv-cap-card::before {
  content: '';
  position: absolute; top: 0; left: 0; width: 32px; height: 1px;
  background: var(--accent);
}
.nv .nv-cap-num {
  font-family: var(--font-mono), monospace;
  font-size: 11px; letter-spacing: 0.18em;
  color: var(--ink-4);
  margin-bottom: 10px;
}
.nv .nv-cap-card-k {
  font-family: var(--font-label), sans-serif;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
}
.nv .nv-cap-card-h {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 600;
  font-size: 21px;
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--ink);
  margin: 0 0 14px;
}
.nv .nv-cap-card-body {
  font-family: var(--font-reader), serif;
  font-size: 16.5px; line-height: 1.55;
  color: var(--ink-2);
  margin: 0 0 18px;
  flex: 1;
}
.nv .nv-cap-card-stat {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
  padding-top: 12px;
  border-top: 1px dotted var(--rule-soft);
}

/* Source-not-filter principle callout */
.nv .nv-snf {
  margin: 0;
  padding: 36px 40px 36px 44px;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  border-left: 3px solid var(--accent);
  position: relative;
}
.nv .nv-snf-k {
  font-family: var(--font-mono), monospace;
  font-size: 10.5px; letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
}
.nv .nv-snf-h {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 600;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.02;
  letter-spacing: -0.022em;
  color: var(--ink);
  margin: 0 0 22px;
}
.nv .nv-snf-h em {
  color: var(--accent);
  font-variation-settings: "opsz" 144, "SOFT" 60;
}
.nv .nv-snf-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 36px;
}
.nv .nv-snf-grid p {
  font-family: var(--font-reader), serif;
  font-size: 16px; line-height: 1.62;
  color: var(--ink-2);
  margin: 0;
}
.nv .nv-snf-grid p em { font-style: italic; color: var(--accent); }
.nv .nv-snf-grid p strong { color: var(--ink); font-weight: 600; }

/* ─── PEOPLE — viewport 06, 2×2 grid with custom icons ────────────────── */
.nv .nv-people { padding: 112px 0 120px; }

.nv .nv-ppl-grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 0;
  border-top: 1px solid var(--rule-soft);
  border-left: 1px solid var(--rule-soft);
}
.nv .nv-ppl-cell {
  padding: 44px 40px 40px;
  border-right: 1px solid var(--rule-soft);
  border-bottom: 1px solid var(--rule-soft);
  display: flex; flex-direction: column;
  align-items: flex-start;
  transition: background .25s ease;
  min-width: 0;
}
.nv .nv-ppl-cell:hover {
  background: rgba(201,145,46,.03);
}
.nv .nv-ppl-icon {
  color: var(--accent);
  margin-bottom: 22px;
  display: block;
}
.nv .nv-ppl-cell-h {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 600;
  font-size: clamp(22px, 2.2vw, 28px);
  line-height: 1.18;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0 0 14px;
  max-width: 22ch;
}
.nv .nv-ppl-cell-h em {
  color: var(--accent);
  font-variation-settings: "opsz" 60, "SOFT" 60;
  font-style: italic;
}
.nv .nv-ppl-cell-body {
  font-family: var(--font-reader), serif;
  font-size: 18px; line-height: 1.6;
  color: var(--ink-2);
  margin: 0;
  max-width: 50ch;
}
.nv .nv-ppl-sig {
  margin: 48px auto 0;
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 14.5px;
  letter-spacing: 0.02em;
  color: var(--ink-3);
  padding-top: 22px;
  border-top: 1px dotted var(--rule);
  display: block;
  width: fit-content;
  padding-left: 36px;
  padding-right: 36px;
  text-align: center;
}

/* ─── CLOSE — viewport 07, the final moment ────────────────────────────── */
.nv .nv-close {
  padding: 200px 0 220px;
  text-align: center;
  position: relative;
  /* a dramatic warm-gold spotlight behind the close — bigger than any
     other section's gradient, makes this feel like the page's final breath */
  background:
    radial-gradient(1600px 1000px at 50% 50%, rgba(201,145,46,.15), transparent 65%),
    radial-gradient(900px  700px  at 50% 110%, rgba(140,40,32,.08), transparent 70%);
}
/* override the alternating section cast for the close — own atmosphere */
.nv main > section.nv-close {
  background:
    radial-gradient(1600px 1000px at 50% 50%, rgba(201,145,46,.15), transparent 65%),
    radial-gradient(900px  700px  at 50% 110%, rgba(140,40,32,.08), transparent 70%);
}
.nv .nv-close-wrap {
  display: flex; flex-direction: column; align-items: center;
}

/* logo leads the close — sits as a signature mark above the headline */
.nv .nv-close-logo {
  margin-bottom: 72px;
}

.nv .nv-close-h {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 500;
  font-size: clamp(34px, 4.4vw, 64px);
  line-height: 1.08;
  letter-spacing: -0.024em;
  color: var(--ink);
  max-width: 22ch;
  margin: 0 0 60px;
  display: grid;
  gap: 4px;
}
.nv .nv-close-h em {
  color: var(--accent);
  font-variation-settings: "opsz" 144, "SOFT" 60;
  font-style: italic;
}
.nv .nv-close-dash {
  color: var(--accent);
  font-style: normal;
  display: inline-block;
  margin-left: 12px;
}
.nv .nv-close-h > span {
  display: block;
}

.nv .nv-close-actions {
  display: flex; flex-direction: column; align-items: center;
  gap: 22px;
}
.nv .nv-close-cta {
  display: inline-flex; align-items: center; gap: 14px;
  padding: 20px 40px;
  border: 1px solid var(--accent);
  background: linear-gradient(180deg, rgba(201,145,46,.14), rgba(201,145,46,.05));
  color: var(--accent);
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-weight: 500;
  font-size: 18px;
  transition: background .25s ease, color .25s ease, transform .25s ease, box-shadow .25s ease;
  box-shadow: 0 24px 60px -30px rgba(201,145,46,.4);
}
.nv .nv-close-cta:hover {
  background: var(--accent);
  color: var(--bg);
  transform: translateY(-2px);
  box-shadow: 0 30px 70px -28px rgba(201,145,46,.55);
}
.nv .nv-close-cta svg { transition: transform .25s ease; }
.nv .nv-close-cta:hover svg { transform: translateX(4px); }
.nv .nv-close-mail {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 15px;
  color: var(--ink-3);
  border-bottom: 1px solid transparent;
  transition: color .2s ease, border-color .2s ease;
}
.nv .nv-close-mail:hover { color: var(--accent); border-bottom-color: var(--accent-deep); }

/* ─── COLOPHON — page foot ─────────────────────────────────────────────── */
.nv .nv-colo {
  border-top: 1px solid var(--rule);
  padding: 28px 0 32px;
  background: var(--bg-2);
  position: relative;
}
.nv .nv-colo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 28px;
}
.nv .nv-colo-l {
  display: flex; align-items: center; gap: 18px;
  font-family: var(--font-reader), serif;
  font-size: 13px;
  color: var(--ink-3);
}
.nv .nv-colo-tag {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 13px;
  color: var(--ink-3);
}
.nv .nv-colo-sign {
  font-family: var(--font-reader), serif;
  font-size: 13px;
  color: var(--ink-3);
  border-bottom: 1px solid transparent;
  transition: color .2s, border-color .2s;
  white-space: nowrap;
}
.nv .nv-colo-sign:hover { color: var(--accent); border-bottom-color: var(--accent-deep); }

/* ─── DIVERGENCE + INTERVENTIONS — viewport 05, slim ─────────────────── */
.nv .nv-case { padding: 112px 0 112px; }

/* divergence — market vs NIVRIA */
.nv .nv-div {
  margin: 0 0 56px;
}
.nv .nv-div-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 32px;
  align-items: stretch;
}
.nv .nv-div-col {
  padding: 28px 30px;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  position: relative;
}
.nv .nv-div-them { background: rgba(255,255,255,.01); }
.nv .nv-div-us {
  background: linear-gradient(180deg, rgba(201,145,46,.08), transparent 80%);
  border-color: var(--accent-deep);
}
.nv .nv-div-us::before {
  content: ''; position: absolute; top: -1px; left: 0; right: 0; height: 2px;
  background: var(--accent);
}
.nv .nv-div-vs {
  font-family: var(--font-editorial), serif;
  font-size: 32px;
  color: var(--accent);
  align-self: center;
  opacity: 0.75;
}
.nv .nv-div-label {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.nv .nv-div-them .nv-div-label { color: var(--ink-3); }
.nv .nv-div-us .nv-div-label { color: var(--accent); }
.nv .nv-div-quote {
  font-family: var(--font-editorial), serif;
  font-variation-settings: "opsz" 36, "SOFT" 14;
  font-style: italic;
  font-weight: 500;
  font-size: 22px;
  line-height: 1.36;
  letter-spacing: -0.008em;
  margin: 0 0 18px;
}
.nv .nv-div-them .nv-div-quote { color: var(--ink-3); }
.nv .nv-div-us .nv-div-quote { color: var(--ink); }
.nv .nv-div-src {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 13px;
  color: var(--ink-3);
  padding-top: 14px;
  border-top: 1px dotted var(--rule);
}

/* three moves — active-help section */
.nv .nv-int {
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  position: relative;
}
.nv .nv-int::before {
  content: ''; position: absolute; top: -1px; left: 0; right: 0; height: 2px;
  background: var(--accent);
}
.nv .nv-int-head {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 20px 32px;
  border-bottom: 1px solid var(--rule-soft);
  gap: 16px;
}
.nv .nv-int-k {
  font-family: var(--font-label), sans-serif;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
}
.nv .nv-int-meta {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 13.5px;
  color: var(--ink-3);
}
.nv .nv-int-list {
  list-style: none; padding: 0; margin: 0;
}
.nv .nv-int-row {
  display: grid;
  grid-template-columns: 56px 1fr 120px;
  gap: 28px;
  align-items: start;
  padding: 28px 32px;
  border-bottom: 1px solid var(--rule-soft);
}
.nv .nv-int-row:last-child { border-bottom: none; }
.nv .nv-int-num {
  font-family: var(--font-mono), monospace;
  font-size: 13px; letter-spacing: 0.06em;
  color: var(--accent);
  padding-top: 8px;
}
.nv .nv-int-title {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 600;
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.012em;
  color: var(--ink);
  margin: 0 0 10px;
}
.nv .nv-int-body p {
  font-family: var(--font-reader), serif;
  font-size: 16px; line-height: 1.6;
  color: var(--ink-2);
  margin: 0;
  max-width: 64ch;
}
.nv .nv-int-impact {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 4px;
  padding-top: 6px;
}
.nv .nv-int-impact-v {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 700;
  font-size: 32px;
  line-height: 1;
  color: var(--forest);
  letter-spacing: -0.02em;
}
.nv .nv-int-impact-on {
  font-family: var(--font-label), sans-serif;
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.nv .nv-int-foot {
  padding: 18px 32px;
  border-top: 1px solid var(--rule-soft);
  background: rgba(0,0,0,.12);
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 13.5px;
  color: var(--ink-3);
}
.nv .nv-int-foot em { color: var(--accent); font-style: italic; }

.nv .nv-doc {
  margin: 0;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  position: relative;
  box-shadow:
    inset 0 1px 0 rgba(244,236,217,.03),
    0 60px 140px -60px rgba(0,0,0,.95);
}
.nv .nv-doc::before {
  content: ''; position: absolute; top: -1px; left: 0; right: 0; height: 2px;
  background: var(--accent);
}

/* doc header — subject + status + date row */
.nv .nv-doc-head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  padding: 32px 40px 28px;
  border-bottom: 1px solid var(--rule-soft);
  align-items: start;
}
.nv .nv-doc-class {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
}
.nv .nv-doc-subject {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 700;
  font-size: clamp(28px, 3.2vw, 40px);
  line-height: 1;
  letter-spacing: -0.022em;
  color: var(--ink);
  margin: 0 0 10px;
}
.nv .nv-doc-subject span {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-weight: 400;
  font-size: 0.6em;
  color: var(--ink-3);
}
.nv .nv-doc-meta {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 13.5px;
  color: var(--ink-3);
}
.nv .nv-doc-head-r {
  display: flex; flex-direction: column; gap: 14px;
  align-items: flex-end;
}
.nv .nv-doc-score {
  display: flex; flex-direction: column; align-items: flex-end;
  border-left: 2px solid var(--accent);
  padding-left: 18px;
}
.nv .nv-doc-score-k {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 6px;
}
.nv .nv-doc-score-line {
  display: flex; align-items: baseline; gap: 6px;
}
.nv .nv-doc-score-big {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 700;
  font-size: 64px;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--ink);
}
.nv .nv-doc-score-of {
  font-family: var(--font-mono), monospace;
  font-size: 14px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
}
.nv .nv-doc-score-state {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 15px;
  color: var(--accent);
  margin-top: 2px;
}
.nv .nv-doc-spark {
  display: flex; align-items: center; gap: 12px;
}
.nv .nv-doc-spark .nv-spark {
  width: 140px; height: 32px;
}
.nv .nv-doc-spark-meta {
  display: flex; flex-direction: column; align-items: flex-end;
  font-family: var(--font-label), sans-serif;
  font-size: 10px; letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
  gap: 2px;
}
.nv .nv-doc-spark-delta {
  font-family: var(--font-mono), monospace;
  color: var(--iron);
  font-size: 12px;
  letter-spacing: 0.04em;
}

/* sections inside the doc */
.nv .nv-doc-sect {
  padding: 32px 40px;
  border-bottom: 1px solid var(--rule-soft);
}
.nv .nv-doc-sect-k {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 22px;
}
.nv .nv-doc-sect-k span {
  color: var(--ink-3);
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0.01em;
  font-size: 13px;
  margin-left: 4px;
}

/* divergence — market vs NIVRIA */
.nv .nv-doc-div-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 28px;
  align-items: stretch;
}
.nv .nv-doc-div-col {
  padding: 22px 24px;
  border: 1px solid var(--rule);
}
.nv .nv-doc-div-them {
  background: rgba(255,255,255,.01);
}
.nv .nv-doc-div-us {
  background: linear-gradient(180deg, rgba(201,145,46,.06), transparent 80%);
  border-color: var(--accent-deep);
}
.nv .nv-doc-div-vs {
  font-family: var(--font-editorial), serif;
  font-size: 28px;
  color: var(--accent);
  align-self: center;
  opacity: 0.75;
}
.nv .nv-doc-div-label {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.nv .nv-doc-div-them .nv-doc-div-label { color: var(--ink-3); }
.nv .nv-doc-div-us .nv-doc-div-label { color: var(--accent); }
.nv .nv-doc-div-quote {
  font-family: var(--font-editorial), serif;
  font-variation-settings: "opsz" 28, "SOFT" 14;
  font-style: italic;
  font-weight: 500;
  font-size: 18px;
  line-height: 1.4;
  letter-spacing: -0.005em;
  margin: 0 0 14px;
}
.nv .nv-doc-div-them .nv-doc-div-quote { color: var(--ink-3); }
.nv .nv-doc-div-us .nv-doc-div-quote { color: var(--ink); }
.nv .nv-doc-div-src {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 12.5px;
  color: var(--ink-3);
  padding-top: 12px;
  border-top: 1px dotted var(--rule);
}

/* drivers — score decomposition */
.nv .nv-doc-drv {
  display: grid;
  margin: 0;
}
.nv .nv-doc-drv-row {
  display: grid;
  grid-template-columns: 200px 60px 140px 1fr;
  gap: 22px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px dotted var(--rule-soft);
}
.nv .nv-doc-drv-row:last-child { border-bottom: none; }
.nv .nv-doc-drv-row dt {
  font-family: var(--font-editorial), serif;
  font-variation-settings: "opsz" 28, "SOFT" 0;
  font-weight: 600;
  font-size: 16px;
  color: var(--ink);
  margin: 0;
  letter-spacing: -0.005em;
}
.nv .nv-doc-drv-v {
  font-family: var(--font-mono), monospace;
  font-size: 16px;
  color: var(--ink);
  letter-spacing: 0.04em;
  margin: 0;
}
.nv .nv-doc-drv-bar {
  margin: 0;
  height: 2px;
  background: var(--rule-soft);
  position: relative;
}
.nv .nv-doc-drv-bar-fill {
  height: 100%;
  background: var(--accent);
  opacity: 0.75;
}
.nv .nv-doc-drv-note {
  font-family: var(--font-reader), serif;
  font-style: italic;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink-3);
  margin: 0;
}

/* interventions — active help moves */
.nv .nv-doc-sect-int {
  background: linear-gradient(180deg, rgba(201,145,46,.04), transparent 60%);
}
.nv .nv-doc-int {
  list-style: none; padding: 0; margin: 0;
  display: grid;
}
.nv .nv-doc-int-row {
  display: grid;
  grid-template-columns: 56px 1fr 110px;
  gap: 24px;
  align-items: start;
  padding: 22px 0;
  border-bottom: 1px solid var(--rule-soft);
}
.nv .nv-doc-int-row:last-child { border-bottom: none; }
.nv .nv-doc-int-num {
  font-family: var(--font-mono), monospace;
  font-size: 13px; letter-spacing: 0.06em;
  color: var(--accent);
  padding-top: 6px;
}
.nv .nv-doc-int-title {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 28, "SOFT" 0;
  font-weight: 600;
  font-size: 19px;
  line-height: 1.25;
  letter-spacing: -0.008em;
  color: var(--ink);
  margin: 0 0 8px;
}
.nv .nv-doc-int-body p {
  font-family: var(--font-reader), serif;
  font-size: 15.5px; line-height: 1.55;
  color: var(--ink-2);
  margin: 0;
  max-width: 64ch;
}
.nv .nv-doc-int-impact {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 2px;
  padding-top: 6px;
}
.nv .nv-doc-int-impact-v {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 700;
  font-size: 28px;
  line-height: 1;
  color: var(--forest);
  letter-spacing: -0.02em;
}
.nv .nv-doc-int-impact-on {
  font-family: var(--font-label), sans-serif;
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}

/* recent activity */
.nv .nv-doc-act {
  list-style: none; padding: 0; margin: 0;
  display: grid; gap: 4px;
}
.nv .nv-doc-act-row {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  gap: 18px;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px dotted var(--rule-soft);
}
.nv .nv-doc-act-row:last-child { border-bottom: none; }
.nv .nv-doc-act-date {
  font-family: var(--font-mono), monospace;
  font-size: 12px; letter-spacing: 0.06em;
  color: var(--ink-3);
}
.nv .nv-doc-act-text {
  font-family: var(--font-reader), serif;
  font-size: 14.5px; line-height: 1.45;
  color: var(--ink-2);
}
.nv .nv-doc-act-impact {
  font-family: var(--font-label), sans-serif;
  font-size: 10.5px; font-weight: 500;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--iron);
  white-space: nowrap;
}

/* foot — methodology / backing / disclaimer */
.nv .nv-doc-foot {
  padding: 28px 40px 30px;
  background: rgba(0,0,0,.18);
  display: grid; gap: 14px;
}
.nv .nv-doc-foot-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 20px;
  align-items: baseline;
}
.nv .nv-doc-foot-k {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
}
.nv .nv-doc-foot-row > div:last-child {
  font-family: var(--font-reader), serif;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-3);
}

/* ─── LIFECYCLE — viewport 04, vertical timeline ──────────────────────── */
.nv .nv-life { padding: 112px 0 112px; }

.nv .nv-life-panel {
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  border: 1px solid var(--rule);
  position: relative;
}
.nv .nv-life-panel::before {
  content: ''; position: absolute; top: -1px; left: 0; right: 0; height: 2px;
  background: var(--accent);
}
.nv .nv-life-head {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 22px 32px;
  border-bottom: 1px solid var(--rule-soft);
}
.nv .nv-life-k {
  font-family: var(--font-label), sans-serif;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
}
.nv .nv-life-meta {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 13.5px; color: var(--ink-3);
}

.nv .nv-life-list {
  list-style: none; padding: 0; margin: 0;
  position: relative;
}
/* timeline connector — a faint gold line linking the phase numbers */
.nv .nv-life-list::before {
  content: '';
  position: absolute;
  left: 75px;
  top: 60px;
  bottom: 60px;
  width: 1px;
  background: linear-gradient(180deg, transparent 0%, var(--accent-deep) 10%, var(--accent-deep) 90%, transparent 100%);
  opacity: 0.5;
  pointer-events: none;
}
.nv .nv-life-stage {
  display: grid;
  grid-template-columns: 110px 230px 1fr;
  gap: 32px;
  padding: 36px 32px;
  border-bottom: 1px solid var(--rule-soft);
  position: relative;
  align-items: start;
}
.nv .nv-life-stage:last-child { border-bottom: none; }
.nv .nv-life-stage-pivot {
  background: linear-gradient(90deg, rgba(201,145,46,.06), transparent 70%);
}

.nv .nv-life-num-wrap {
  position: relative;
  z-index: 1;
}
.nv .nv-life-num {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 700;
  font-size: 48px;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--ink);
  background: var(--panel);
  border: 1px solid var(--rule);
  width: 86px; height: 86px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  margin-left: -8px;
}
.nv .nv-life-stage-pivot .nv-life-num {
  color: var(--accent);
  border-color: var(--accent-deep);
  background: linear-gradient(180deg, rgba(201,145,46,.10), var(--panel));
}
.nv .nv-life-pin {
  position: absolute;
  top: -4px; right: -10px;
  color: var(--accent);
  font-size: 16px;
  background: var(--panel);
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1px solid var(--accent-deep);
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}

.nv .nv-life-meta-col { padding-top: 10px; }
.nv .nv-life-name {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 60, "SOFT" 0;
  font-weight: 600;
  font-size: 28px;
  line-height: 1.05;
  letter-spacing: -0.018em;
  color: var(--ink);
  margin-bottom: 4px;
}
.nv .nv-life-sub {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 17px;
  color: var(--ink-3);
  margin-bottom: 16px;
}
.nv .nv-life-fee {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-4);
  padding: 4px 10px;
  border: 1px solid var(--rule);
  display: inline-block;
}
.nv .nv-life-stage-pivot .nv-life-fee {
  color: var(--accent);
  border-color: var(--accent-deep);
}

.nv .nv-life-body { padding-top: 10px; min-width: 0; max-width: 62ch; }
.nv .nv-life-body p {
  font-family: var(--font-reader), serif;
  font-size: 18.5px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0;
}
.nv .nv-life-callout {
  margin-top: 18px;
  padding: 16px 20px;
  border-left: 2px solid var(--accent);
  background: rgba(201,145,46,.05);
}
.nv .nv-life-callout-k {
  font-family: var(--font-label), sans-serif;
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}
.nv .nv-life-callout p {
  font-family: var(--font-editorial), serif;
  font-variation-settings: "opsz" 28, "SOFT" 14;
  font-style: italic;
  font-size: 17.5px;
  line-height: 1.5;
  color: var(--ink);
  margin: 0;
}

.nv .nv-life-foot {
  display: flex; align-items: baseline; gap: 22px;
  padding: 22px 32px;
  border-top: 1px solid var(--rule-soft);
  background: rgba(0,0,0,.12);
}
.nv .nv-life-foot-k {
  font-family: var(--font-label), sans-serif;
  font-size: 12px; font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent);
  white-space: nowrap;
}
.nv .nv-life-foot-v {
  font-family: var(--font-reader), serif; font-style: italic;
  font-size: 14.5px;
  color: var(--ink-2);
}
.nv .nv-life-foot-v strong {
  color: var(--ink); font-style: normal; font-weight: 600;
  font-family: var(--font-editorial), serif;
}

/* ─── INSTRUMENT — viewport 02, two columns ────────────────────────────── */
.nv .nv-inst-pair {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr);
  gap: 56px;
  align-items: start;
}
.nv .nv-inst-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.nv .nv-inst-h {
  font-family: var(--font-editorial), 'Fraunces', serif;
  font-variation-settings: "opsz" 144, "SOFT" 0;
  font-weight: 600;
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.05;
  letter-spacing: -0.022em;
  color: var(--ink);
  margin: 0 0 18px;
}
.nv .nv-inst-h em {
  color: var(--accent);
  font-variation-settings: "opsz" 144, "SOFT" 60;
}
.nv .nv-inst-p {
  font-family: var(--font-reader), serif;
  font-size: 18.5px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0 0 28px;
  max-width: 60ch;
}
.nv .nv-inst-p em { font-style: italic; color: var(--accent); }
.nv .nv-inst-p strong { color: var(--ink); font-weight: 600; }
/* the column-owned figures fill the column width */
.nv .nv-inst-col .nv-conn,
.nv .nv-inst-col .nv-read { flex: 0 0 auto; }

/* ─── responsive ──────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .nv .nv-hero-split { grid-template-columns: 1fr; gap: 40px; }
  .nv .nv-sect-head { grid-template-columns: 1fr; gap: 24px; }
  .nv .nv-inst-pair { grid-template-columns: 1fr; gap: 48px; }
  .nv .nv-hire-grid { grid-template-columns: 1fr; }
  .nv .nv-hire-cell { border-right: none !important; border-bottom: 1px solid var(--rule-soft); }
  .nv .nv-hire-cell:last-child { border-bottom: none; }
  .nv .nv-cap-grid { grid-template-columns: 1fr; gap: 14px; }
  .nv .nv-snf-grid { grid-template-columns: 1fr; gap: 16px; }
}
  .nv .nv-div-grid { grid-template-columns: 1fr; gap: 16px; }
  .nv .nv-div-vs { display: none; }
  .nv .nv-colo-row { grid-template-columns: 1fr; gap: 14px; text-align: center; }
  .nv .nv-colo-l { flex-direction: column; gap: 4px; align-items: center; }
  .nv .nv-close { padding: 80px 0 100px; }
  /* keep people grid 2×2 even on narrower desktops */
  .nv .nv-int-head { flex-direction: column; align-items: flex-start; gap: 6px; padding: 18px 22px; }
  .nv .nv-int-row { grid-template-columns: 40px 1fr; gap: 16px; padding: 22px 22px; }
  .nv .nv-int-impact { grid-column: 1 / -1; flex-direction: row; align-items: baseline; gap: 10px; padding-top: 0; }
  .nv .nv-int-foot { padding: 16px 22px; }
}
@media (max-width: 600px) {
  .nv .nv-ppl-grid { grid-template-columns: 1fr !important; }
  .nv .nv-ppl-cell { border-right: none !important; padding: 32px 22px; }
}
@media (min-width: 721px) and (max-width: 1100px) {
  .nv .nv-cap-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
  .nv .nv-life-stage { grid-template-columns: 80px 1fr; gap: 20px; padding: 24px 20px; }
  .nv .nv-life-meta-col { grid-column: 2; padding-top: 0; }
  .nv .nv-life-body { grid-column: 1 / -1; padding-top: 0; }
  .nv .nv-life-list::before { display: none; }
  .nv .nv-life-num { width: 70px; height: 70px; font-size: 38px; }
  .nv .nv-life-head, .nv .nv-life-foot { padding: 18px 22px; flex-direction: column; align-items: flex-start; gap: 8px; }
}
@media (max-width: 720px) {
  .nv .nv-wrap { padding: 0 22px; }
  .nv .nv-hero { padding: 40px 0 60px; }
  .nv .nv-h1 { font-size: clamp(38px, 9vw, 56px); }
  .nv .nv-desc p { font-size: 16.5px; }
  .nv .nv-held-grid { grid-template-columns: 1fr; }
  .nv .nv-held-cap { flex-direction: column; align-items: flex-start; gap: 10px; }
}
.nv :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
`
