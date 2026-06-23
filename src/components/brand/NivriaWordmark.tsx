/**
 * NivriaLogo — the canonical lockup: canopy + wordmark + roots + ground line.
 *
 * Verbatim port of the homepage's `NivriaLogo` function (src/app/page.tsx)
 * with its CSS rules — same canopy coordinates, same lace lines, same
 * branches, same hangs, same i-trunk treatment, same sizes.
 *
 * If the logo needs a tweak, change it here. Don't fork.
 *
 * Sizes mirror the homepage exactly:
 *   lg  → close-section hero logo  (560px wide, 76px wordmark, 92px canopy)
 *   md  → header logo              (220px wide, 30px wordmark, 34px canopy)
 *   sm  → footer / small logo      (150px wide, 20px wordmark, 22px canopy)
 *
 * Also exports a `NivriaWordmark` variant — wordmark only (no canopy,
 * no ground line, no roots) — for in-prose usage.
 */
'use client'

type Size = 'sm' | 'md' | 'lg'

const TRUNK_LX = 97    // aligns with first i in "nivria"
const TRUNK_RX = 143   // aligns with second i
const TRUNK_TOP = 36   // branches converge AT the i-top dot center (was 38 = SVG bottom; that landed below the dots, leaving the canopy floating)
// Bot-canopy junction dots — inboard so the dot bodies don't overshoot
// the i-stems on either side.
const TRUNK_LX_BOT = 99
const TRUNK_RX_BOT = 141

// CANOPY — bounded within wordmark width, with a curved dome ridge
// (outer top dots lowered, peak raised) so it reads more tree-like.
const CANOPY = [
  { x: 66,  y: 14, c: 'l' as const },
  { x: 76,  y: 12, c: 'l' as const },
  { x: 84,  y: 14, c: 'l' as const },
  { x: 72,  y: 24, c: 'l' as const },
  { x: 80,  y: 26, c: 'l' as const },
  { x: 96,  y: 14, c: 'c' as const },
  { x: 108, y: 6,  c: 'c' as const },
  { x: 120, y: 2,  c: 'c' as const },
  { x: 132, y: 6,  c: 'c' as const },
  { x: 144, y: 14, c: 'c' as const },
  { x: 102, y: 22, c: 'c' as const },
  { x: 120, y: 18, c: 'c' as const },
  { x: 138, y: 22, c: 'c' as const },
  { x: 120, y: 30, c: 'c' as const },
  { x: 156, y: 14, c: 'r' as const },
  { x: 164, y: 12, c: 'r' as const },
  { x: 174, y: 14, c: 'r' as const },
  { x: 160, y: 26, c: 'r' as const },
  { x: 168, y: 24, c: 'r' as const },
]

type Line = { x1: number; y1: number; x2: number; y2: number; w: number; o: number; d?: string }

const branches: Line[] = []
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

const lace: Line[] = [
  { x1: 76,  y1: 12, x2: 108, y2: 6,  w: 0.5, o: 0.25 },
  { x1: 108, y1: 6,  x2: 120, y2: 2,  w: 0.5, o: 0.32 },
  { x1: 120, y1: 2,  x2: 132, y2: 6,  w: 0.5, o: 0.32 },
  { x1: 132, y1: 6,  x2: 164, y2: 12, w: 0.5, o: 0.25 },
  { x1: 96,  y1: 14, x2: 108, y2: 6,  w: 0.5, o: 0.30 },
  { x1: 96,  y1: 14, x2: 120, y2: 2,  w: 0.5, o: 0.22, d: '2 3' },
  { x1: 144, y1: 14, x2: 132, y2: 6,  w: 0.5, o: 0.30 },
  { x1: 144, y1: 14, x2: 120, y2: 2,  w: 0.5, o: 0.22, d: '2 3' },
  { x1: 96,  y1: 14, x2: 144, y2: 14, w: 0.5, o: 0.20, d: '2 3' },
  { x1: 84,  y1: 14, x2: 96,  y2: 14, w: 0.5, o: 0.30 },
  { x1: 144, y1: 14, x2: 156, y2: 14, w: 0.5, o: 0.30 },
  { x1: 102, y1: 22, x2: 120, y2: 18, w: 0.5, o: 0.30 },
  { x1: 138, y1: 22, x2: 120, y2: 18, w: 0.5, o: 0.30 },
  { x1: 102, y1: 22, x2: 138, y2: 22, w: 0.5, o: 0.20, d: '2 3' },
  { x1: 96,  y1: 14, x2: 102, y2: 22, w: 0.5, o: 0.25 },
  { x1: 144, y1: 14, x2: 138, y2: 22, w: 0.5, o: 0.25 },
  { x1: 66,  y1: 14, x2: 76,  y2: 12, w: 0.5, o: 0.25 },
  { x1: 66,  y1: 14, x2: 72,  y2: 24, w: 0.5, o: 0.22, d: '2 3' },
  { x1: 76,  y1: 12, x2: 84,  y2: 14, w: 0.5, o: 0.25 },
  { x1: 174, y1: 14, x2: 164, y2: 12, w: 0.5, o: 0.25 },
  { x1: 174, y1: 14, x2: 168, y2: 24, w: 0.5, o: 0.22, d: '2 3' },
  { x1: 164, y1: 12, x2: 156, y2: 14, w: 0.5, o: 0.25 },
  { x1: 72,  y1: 24, x2: 80,  y2: 26, w: 0.5, o: 0.30 },
  { x1: 160, y1: 26, x2: 168, y2: 24, w: 0.5, o: 0.30 },
  { x1: 80,  y1: 26, x2: 120, y2: 30, w: 0.5, o: 0.22 },
  { x1: 120, y1: 30, x2: 160, y2: 26, w: 0.5, o: 0.22 },
]

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

function I() {
  return (
    <span className="nivria-logo-i" role="img" aria-label="i">
      <span className="nivria-logo-i-line" aria-hidden="true" />
      <span className="nivria-logo-i-top" aria-hidden="true" />
    </span>
  )
}

type LogoProps = {
  size?: Size
  href?: string
  className?: string
}

export function NivriaLogo({ size = 'md', href = '/', className = '' }: LogoProps) {
  const cls = ['nivria-logo', `nivria-logo--${size}`, className].filter(Boolean).join(' ')
  return (
    <a href={href} className={cls} aria-label="nivria — home">
      <style>{CSS}</style>
      <span className="nivria-logo-chart" aria-hidden="true">
        <svg viewBox="0 0 240 38" preserveAspectRatio="none">
          {lace.map((l, i) => (
            <line key={`la${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="currentColor" strokeWidth={l.w} strokeOpacity={l.o}
              strokeDasharray={l.d} strokeLinecap="round" />
          ))}
          {branches.map((l, i) => (
            <line key={`br${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="currentColor" strokeWidth={l.w} strokeOpacity={l.o}
              strokeDasharray={l.d} strokeLinecap="round" />
          ))}
          {CANOPY.map((p, i) => (
            <circle key={`c${i}`} cx={p.x} cy={p.y} r="1.0" fill="currentColor" />
          ))}
          {HANGS.map((h, i) => (
            <g key={`h${i}`}>
              <line x1={h.from.x} y1={h.from.y} x2={h.to.x} y2={h.to.y}
                stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.42" strokeLinecap="round" />
              <circle cx={h.to.x} cy={h.to.y} r="0.8" fill="currentColor" />
            </g>
          ))}
        </svg>
      </span>
      <span className="nivria-logo-text">
        n<I />vr<I />a
      </span>
      {/* Bottom roots — mirrored canopy via scaleY(-1) + junction dots.
          See homepage NivriaLogo for the design rationale. */}
      <span className="nivria-logo-chart-bot" aria-hidden="true">
        <svg viewBox="0 0 240 38" preserveAspectRatio="none">
          {lace.map((l, i) => (
            <line key={`bla${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="currentColor" strokeWidth={l.w} strokeOpacity={l.o}
              strokeDasharray={l.d} strokeLinecap="round" />
          ))}
          {branches.map((l, i) => (
            <line key={`bbr${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="currentColor" strokeWidth={l.w} strokeOpacity={l.o}
              strokeDasharray={l.d} strokeLinecap="round" />
          ))}
          {CANOPY.map((p, i) => (
            <circle key={`bc${i}`} cx={p.x} cy={p.y} r="1.0" fill="currentColor" />
          ))}
          <circle cx={TRUNK_LX_BOT} cy={TRUNK_TOP} r="1.6" fill="currentColor" />
          <circle cx={TRUNK_RX_BOT} cy={TRUNK_TOP} r="1.6" fill="currentColor" />
        </svg>
      </span>
    </a>
  )
}

/**
 * NivriaWordmark — wordmark only (no canopy, no ground line, no roots).
 * Use this inside running prose. Inherits font-size from its parent.
 */
type WordmarkProps = { className?: string }
export function NivriaWordmark({ className = '' }: WordmarkProps) {
  return (
    <span className={`nivria-logo nivria-logo--in-prose ${className}`}>
      <style>{CSS}</style>
      <span className="nivria-logo-text">
        n<I />vr<I />a
      </span>
    </span>
  )
}

const CSS = `
.nivria-logo {
  --nivria-accent: #C9912E;
  --nivria-ink: #F4ECD9;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: var(--nivria-accent);
  line-height: 1;
  transition: opacity .2s ease;
}
.nivria-logo:hover { opacity: 0.92; }

.nivria-logo-chart {
  display: block;
  width: 100%;
  color: var(--nivria-accent);
  pointer-events: none;
}
.nivria-logo-chart svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.nivria-logo-text {
  font-family: var(--font-logo), 'DM Serif Display', serif;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--nivria-ink);
}

/* Bottom canopy — mirrored canopy via scaleY(-1). Same lace + branches
   + scatter dots as the top, just flipped. Sits below the wordmark
   with negative margin-top to overlap on the i-bottoms. */
.nivria-logo-chart-bot {
  display: block;
  width: 100%;
  color: var(--nivria-accent);
  pointer-events: none;
}
.nivria-logo-chart-bot svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  transform: scaleY(-1);
}

.nivria-logo-i {
  display: inline-block;
  position: relative;
  width: 0.22em;
  height: 0.70em;
  vertical-align: baseline;
  margin: 0 0.04em;
  top: 0.08em;
}
.nivria-logo-i-line {
  position: absolute;
  left: 50%;
  top: 0;
  /* end at the wordmark's baseline so the i-stems match the bottom of
     n/v/r/a. i element bottom is at baseline + 0.08em due to the i
     top offset, so we pull the line up from i element bottom by 0.08em. */
  bottom: 0.08em;
  width: 2px;
  background: var(--nivria-accent);
  transform: translateX(-50%);
}
.nivria-logo-i-top {
  position: absolute;
  left: 50%;
  top: -0.13em;
  width: 0.13em;
  height: 0.13em;
  background: var(--nivria-accent);
  border-radius: 50%;
  transform: translateX(-50%);
}
/* sizes — match homepage .nv-logo-{lg,md,sm} exactly */
.nivria-logo--lg { width: 560px; }
.nivria-logo--lg .nivria-logo-text { font-size: 76px; letter-spacing: 0.05em; }
.nivria-logo--lg .nivria-logo-chart { height: 92px; margin-bottom: -14px; }
.nivria-logo--lg .nivria-logo-chart-bot { height: 28px; margin-top: -24px; }

.nivria-logo--md { width: 220px; }
.nivria-logo--md .nivria-logo-text { font-size: 30px; }
.nivria-logo--md .nivria-logo-chart { height: 34px; margin-bottom: -5px; }
.nivria-logo--md .nivria-logo-chart-bot { height: 10px; margin-top: -10px; }
.nivria-logo--md .nivria-logo-i-line { width: 1.5px; }

.nivria-logo--sm { width: 150px; }
.nivria-logo--sm .nivria-logo-text { font-size: 20px; letter-spacing: 0.03em; }
.nivria-logo--sm .nivria-logo-chart { height: 22px; margin-bottom: -3px; }
.nivria-logo--sm .nivria-logo-chart-bot { height: 7px; margin-top: -7px; }
.nivria-logo--sm .nivria-logo-i-line { width: 1.5px; }

/* in-prose: drop both canopies, bump the i-dot, slim the stem */
.nivria-logo--in-prose { display: inline; width: auto; }
.nivria-logo--in-prose .nivria-logo-chart,
.nivria-logo--in-prose .nivria-logo-chart-bot { display: none; }
.nivria-logo--in-prose .nivria-logo-i-top {
  width: 0.24em;
  height: 0.24em;
  top: -0.20em;
}
.nivria-logo--in-prose .nivria-logo-i-line { width: 1.5px; }
`
