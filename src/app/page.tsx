'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { ArrowRight } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createAuthClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf9f7' }}>
        <div style={{ color: 'var(--charcoal)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="landing-container">
      <style jsx>{`
        .landing-container {
          width: 100%;
          min-height: 100vh;
          overflow-x: hidden;
          background: #faf9f7;
        }

        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 24px 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to bottom, #faf9f7 50%, transparent);
        }

        .landing-nav-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
          cursor: pointer;
        }

        .landing-nav-links {
          display: flex;
          gap: 40px;
          align-items: center;
        }

        .landing-nav-link {
          color: var(--grey-600);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 400;
          transition: color 0.2s;
          cursor: pointer;
        }

        .landing-nav-link:hover {
          color: var(--charcoal);
        }

        .landing-nav-cta {
          color: var(--white);
          background: var(--charcoal);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 12px 28px;
          border-radius: 6px;
          transition: background 0.2s;
          cursor: pointer;
          border: none;
        }

        .landing-nav-cta:hover {
          background: var(--burnt-orange);
        }

        .landing-hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          padding-left: 60px;
        }

        .landing-hero-content {
          padding: 200px 60px 100px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .landing-hero-headline {
          font-family: var(--font-serif);
          font-size: clamp(3.2rem, 7vw, 5.5rem);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: -0.03em;
          margin-bottom: 40px;
          color: var(--charcoal);
        }

        .landing-hero-headline .line {
          display: block;
        }

        .landing-hero-headline .italic {
          font-style: italic;
          color: var(--burnt-orange);
        }

        .landing-hero-intro {
          max-width: 440px;
          font-size: 1.15rem;
          line-height: 1.7;
          color: var(--grey-600);
          margin-bottom: 48px;
        }

        .landing-hero-cta-row {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .landing-btn-primary {
          padding: 18px 44px;
          background: var(--charcoal);
          color: var(--white);
          border: none;
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
        }

        .landing-btn-primary:hover {
          background: var(--burnt-orange);
        }

        .landing-btn-text {
          color: var(--charcoal);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
          cursor: pointer;
          background: none;
          border: none;
        }

        .landing-btn-text:hover {
          color: var(--burnt-orange);
        }

        .landing-hero-visual {
          background: var(--charcoal);
          position: relative;
          overflow: hidden;
          clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landing-loop-container {
          position: relative;
          width: 380px;
          height: 380px;
        }

        .landing-loop-ring {
          position: absolute;
          inset: 0;
          border: 2px solid var(--burnt-orange);
          border-radius: 50%;
          opacity: 0.3;
        }

        .landing-loop-ring-inner {
          position: absolute;
          inset: 60px;
          border: 1px solid var(--grey-600);
          border-radius: 50%;
          opacity: 0.5;
        }

        .landing-loop-arrows {
          position: absolute;
          inset: 20px;
          animation: landingRotate 30s linear infinite;
        }

        @keyframes landingRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .landing-loop-arrow {
          position: absolute;
          color: var(--burnt-orange);
          opacity: 0.6;
        }

        .landing-loop-arrow:nth-child(1) { top: 0; left: 50%; transform: translateX(-50%) rotate(0deg); }
        .landing-loop-arrow:nth-child(2) { top: 50%; right: 0; transform: translateY(-50%) rotate(90deg); }
        .landing-loop-arrow:nth-child(3) { bottom: 0; left: 50%; transform: translateX(-50%) rotate(180deg); }
        .landing-loop-arrow:nth-child(4) { top: 50%; left: 0; transform: translateY(-50%) rotate(270deg); }

        .landing-loop-node {
          position: absolute;
          background: var(--charcoal);
          border: 2px solid var(--burnt-orange);
          padding: 14px 18px;
          text-align: center;
          min-width: 120px;
        }

        .landing-loop-node-label {
          font-family: var(--font-display);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--white);
          font-weight: 500;
        }

        .landing-loop-node.intelligence { top: -20px; left: 50%; transform: translateX(-50%); }
        .landing-loop-node.strategy { top: 50%; right: -30px; transform: translateY(-50%); }
        .landing-loop-node.execution { bottom: -20px; left: 50%; transform: translateX(-50%); }
        .landing-loop-node.learning { top: 50%; left: -30px; transform: translateY(-50%); }

        .landing-loop-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .landing-marquee-section {
          background: var(--charcoal);
          padding: 20px 0;
          overflow: hidden;
        }

        .landing-marquee {
          display: flex;
          gap: 60px;
          animation: landingMarquee 25s linear infinite;
        }

        @keyframes landingMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .landing-marquee-item {
          font-family: var(--font-display);
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--grey-500);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 60px;
        }

        .landing-marquee-item::after {
          content: "◆";
          color: var(--burnt-orange);
          font-size: 0.4rem;
        }

        .landing-statement-section {
          padding: 140px 80px;
          position: relative;
          background: #faf9f7;
        }

        .landing-statement-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .landing-statement-number {
          font-family: var(--font-serif);
          font-size: 10rem;
          font-weight: 400;
          color: var(--burnt-orange);
          opacity: 0.12;
          line-height: 1;
          position: absolute;
          top: 60px;
          left: 60px;
        }

        .landing-statement-content {
          position: relative;
        }

        .landing-statement-headline {
          font-family: var(--font-serif);
          font-size: 3rem;
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          color: var(--charcoal);
        }

        .landing-statement-headline em {
          font-style: italic;
          color: var(--burnt-orange);
        }

        .landing-statement-text {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--grey-600);
          max-width: 460px;
        }

        .landing-statement-text em {
          font-style: italic;
          color: var(--charcoal);
        }

        .landing-timelapse {
          background: var(--charcoal);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
        }

        .landing-timelapse-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--grey-800);
        }

        .landing-timelapse-clock {
          width: 44px;
          height: 44px;
          position: relative;
        }

        .landing-timelapse-clock-ring {
          position: absolute;
          inset: 0;
          border: 2px solid var(--grey-700);
          border-radius: 50%;
        }

        .landing-timelapse-clock-hand {
          position: absolute;
          width: 2px;
          height: 14px;
          background: var(--burnt-orange);
          top: 8px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          transform-origin: bottom center;
          animation: clockSpin 8s linear infinite;
        }

        @keyframes clockSpin {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }

        .landing-timelapse-clock-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: var(--burnt-orange);
          border-radius: 50%;
        }

        .landing-timelapse-time {
          flex: 1;
        }

        .landing-timelapse-current {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--white);
        }

        .landing-timelapse-label {
          font-size: 0.75rem;
          color: var(--grey-500);
        }

        .landing-timelapse-org {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--grey-400);
        }

        .landing-timelapse-org-avatar {
          width: 28px;
          height: 28px;
          background: var(--grey-700);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--white);
        }

        .landing-timelapse-stream {
          padding: 20px 24px;
        }

        .landing-timelapse-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          position: relative;
        }

        .landing-timelapse-item:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 56px;
          top: 32px;
          bottom: -12px;
          width: 1px;
          background: var(--grey-800);
        }

        .landing-timelapse-item-time {
          width: 50px;
          font-size: 0.7rem;
          color: var(--grey-500);
          text-align: right;
          flex-shrink: 0;
        }

        .landing-timelapse-item-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--grey-700);
          border: 2px solid var(--grey-600);
          flex-shrink: 0;
          margin-top: 4px;
        }

        .landing-timelapse-item.completed .landing-timelapse-item-dot {
          background: var(--burnt-orange);
          border-color: var(--burnt-orange);
        }

        .landing-timelapse-item.active .landing-timelapse-item-dot {
          background: #22c55e;
          border-color: #22c55e;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
        }

        .landing-timelapse-item-content {
          flex: 1;
        }

        .landing-timelapse-item-action {
          font-family: var(--font-display);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--white);
          margin-bottom: 4px;
        }

        .landing-timelapse-item-detail {
          font-size: 0.75rem;
          color: var(--grey-500);
        }

        .landing-timelapse-score {
          display: inline-block;
          background: var(--burnt-orange);
          color: white;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 6px;
          font-size: 0.7rem;
        }

        .landing-timelapse-item-assets {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .landing-timelapse-item-assets span {
          font-size: 0.65rem;
          padding: 4px 10px;
          background: var(--grey-800);
          color: var(--grey-400);
          border-radius: 12px;
        }

        .landing-timelapse-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--grey-900);
          border-top: 1px solid var(--grey-800);
        }

        .landing-timelapse-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #22c55e;
        }

        .landing-timelapse-status-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .landing-timelapse-stats {
          font-size: 0.7rem;
          color: var(--grey-500);
          display: flex;
          gap: 8px;
        }

        /* CTA Section */
        .landing-cta-section {
          padding: 120px 80px;
          background: var(--burnt-orange);
        }

        .landing-cta-content {
          max-width: 600px;
        }

        .landing-cta-headline {
          font-family: var(--font-serif);
          font-size: 3rem;
          font-weight: 400;
          color: var(--white);
          margin-bottom: 20px;
          line-height: 1.1;
        }

        .landing-cta-text {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .landing-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 18px 36px;
          background: var(--white);
          color: var(--charcoal);
          border: none;
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .landing-cta-btn:hover {
          background: var(--charcoal);
          color: var(--white);
        }

        /* Footer */
        .landing-footer {
          padding: 60px 80px;
          background: var(--charcoal);
        }

        .landing-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .landing-footer-copy {
          font-size: 0.8rem;
          color: var(--grey-500);
        }

        .landing-footer-links {
          display: flex;
          gap: 32px;
        }

        .landing-footer-link {
          font-size: 0.8rem;
          color: var(--grey-500);
          text-decoration: none;
          transition: color 0.2s;
        }

        .landing-footer-link:hover {
          color: var(--burnt-orange);
        }

        @media (max-width: 1024px) {
          .landing-hero {
            grid-template-columns: 1fr;
            padding-left: 0;
          }

          .landing-hero-visual {
            display: none;
          }

          .landing-hero-content {
            padding: 160px 40px 80px;
          }

          .landing-nav {
            padding: 20px 30px;
          }

          .landing-statement-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .landing-statement-section {
            padding: 80px 40px;
          }
        }

        @media (max-width: 640px) {
          .landing-nav-links {
            gap: 20px;
          }

          .landing-nav-link {
            display: none;
          }

          .landing-hero-content {
            padding: 140px 24px 60px;
          }

          .landing-hero-cta-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .landing-btn-primary {
            width: 100%;
            text-align: center;
          }

          .landing-statement-number {
            font-size: 5rem;
          }

          .landing-cta-section,
          .landing-footer {
            padding: 60px 24px;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <svg width="80" height="48" viewBox="0 0 80 48">
            <path d="M10 0 H80 V48 H0 L10 0 Z" fill="#1a1a1a" />
            <text x="40" y="33" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="22" fontWeight="700" fill="#faf9f7" letterSpacing="-0.5">NIV</text>
            <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
          </svg>
          <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '24px', fontWeight: 200 }}>|</span>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', color: 'rgba(0,0,0,0.4)', letterSpacing: '1px' }}>by nivria</span>
        </div>
        <div className="landing-nav-links">
          <span className="landing-nav-link">Platform</span>
          <span className="landing-nav-link">Solutions</span>
          <span className="landing-nav-link">About</span>
          <button className="landing-nav-cta" onClick={() => router.push('/auth/signup')}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-headline">
            <span className="line">The <span className="italic">influence</span></span>
            <span className="line">orchestration</span>
            <span className="line">operating system</span>
          </h1>
          <p className="landing-hero-intro">
            NIV transforms how organizations discover opportunities, generate strategies, and execute campaigns — with AI that learns and compounds over time.
          </p>
          <div className="landing-hero-cta-row">
            <button className="landing-btn-primary" onClick={() => router.push('/auth/signup')}>
              Start Free Trial
            </button>
            <button className="landing-btn-text" onClick={() => router.push('/auth/login')}>
              Watch Demo
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-loop-container">
            <div className="landing-loop-ring"></div>
            <div className="landing-loop-ring-inner"></div>
            <div className="landing-loop-arrows">
              <svg className="landing-loop-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
              <svg className="landing-loop-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
              <svg className="landing-loop-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
              <svg className="landing-loop-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </div>
            <div className="landing-loop-node intelligence">
              <div className="landing-loop-node-label">Intelligence</div>
            </div>
            <div className="landing-loop-node strategy">
              <div className="landing-loop-node-label">Strategy</div>
            </div>
            <div className="landing-loop-node execution">
              <div className="landing-loop-node-label">Execution</div>
            </div>
            <div className="landing-loop-node learning">
              <div className="landing-loop-node-label">Learning</div>
            </div>
            <div className="landing-loop-center">
              <svg width="80" height="48" viewBox="0 0 80 48">
                <path d="M10 0 H80 V48 H0 L10 0 Z" fill="#faf9f7" />
                <text x="40" y="33" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="22" fontWeight="700" fill="#1a1a1a" letterSpacing="-0.5">NIV</text>
                <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="landing-marquee-section">
        <div className="landing-marquee">
          <span className="landing-marquee-item">Intelligence Pipeline</span>
          <span className="landing-marquee-item">VECTOR Campaigns</span>
          <span className="landing-marquee-item">Crisis Command</span>
          <span className="landing-marquee-item">Memory Vault</span>
          <span className="landing-marquee-item">NIV Advisor</span>
          <span className="landing-marquee-item">Content Execution</span>
          <span className="landing-marquee-item">Intelligence Pipeline</span>
          <span className="landing-marquee-item">VECTOR Campaigns</span>
          <span className="landing-marquee-item">Crisis Command</span>
          <span className="landing-marquee-item">Memory Vault</span>
          <span className="landing-marquee-item">NIV Advisor</span>
          <span className="landing-marquee-item">Content Execution</span>
        </div>
      </section>

      {/* Statement Section */}
      <section className="landing-statement-section">
        <div className="landing-statement-number">24/7</div>
        <div className="landing-statement-grid">
          <div className="landing-statement-content">
            <h2 className="landing-statement-headline">
              AI built for you, <em>working around the clock</em>
            </h2>
            <p className="landing-statement-text">
              Unlike generic AI tools that start from scratch every time, NIV knows your organization — your voice, your competitors, your stakeholders, your goals. Every insight, every strategy, every piece of content is built with <em>you</em> in mind.
            </p>
          </div>
          <div className="landing-statement-visual">
            <div className="landing-timelapse">
              {/* Clock Header */}
              <div className="landing-timelapse-header">
                <div className="landing-timelapse-clock">
                  <div className="landing-timelapse-clock-ring"></div>
                  <div className="landing-timelapse-clock-hand"></div>
                  <div className="landing-timelapse-clock-center"></div>
                </div>
                <div className="landing-timelapse-time">
                  <div className="landing-timelapse-current">3:42 AM</div>
                  <div className="landing-timelapse-label">NIV is working</div>
                </div>
                <div className="landing-timelapse-org">
                  <div className="landing-timelapse-org-avatar">AC</div>
                  <span>Acme Corp</span>
                </div>
              </div>

              {/* Activity Stream */}
              <div className="landing-timelapse-stream">
                <div className="landing-timelapse-item completed">
                  <div className="landing-timelapse-item-time">2:15 AM</div>
                  <div className="landing-timelapse-item-dot"></div>
                  <div className="landing-timelapse-item-content">
                    <div className="landing-timelapse-item-action">Signal detected</div>
                    <div className="landing-timelapse-item-detail">TechRival announces AI partnership</div>
                  </div>
                </div>
                <div className="landing-timelapse-item completed">
                  <div className="landing-timelapse-item-time">2:18 AM</div>
                  <div className="landing-timelapse-item-dot"></div>
                  <div className="landing-timelapse-item-content">
                    <div className="landing-timelapse-item-action">Opportunity scored</div>
                    <div className="landing-timelapse-item-detail">
                      <span className="landing-timelapse-score">92</span>
                      Response window identified
                    </div>
                  </div>
                </div>
                <div className="landing-timelapse-item completed">
                  <div className="landing-timelapse-item-time">2:24 AM</div>
                  <div className="landing-timelapse-item-dot"></div>
                  <div className="landing-timelapse-item-content">
                    <div className="landing-timelapse-item-action">Strategy generated</div>
                    <div className="landing-timelapse-item-detail">4-phase response plan drafted</div>
                  </div>
                </div>
                <div className="landing-timelapse-item active">
                  <div className="landing-timelapse-item-time">3:42 AM</div>
                  <div className="landing-timelapse-item-dot"></div>
                  <div className="landing-timelapse-item-content">
                    <div className="landing-timelapse-item-action">Content ready</div>
                    <div className="landing-timelapse-item-assets">
                      <span>Press release</span>
                      <span>Exec talking points</span>
                      <span>Social posts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Status */}
              <div className="landing-timelapse-footer">
                <div className="landing-timelapse-status">
                  <span className="landing-timelapse-status-dot"></span>
                  Ready when you wake up
                </div>
                <div className="landing-timelapse-stats">
                  <span>47 signals processed</span>
                  <span>·</span>
                  <span>3 opportunities found</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <div className="landing-cta-content">
          <h2 className="landing-cta-headline">Ready to transform your influence?</h2>
          <p className="landing-cta-text">
            Join organizations using NIV to discover opportunities, create strategies, and execute campaigns — all with AI that learns your voice.
          </p>
          <button className="landing-cta-btn" onClick={() => router.push('/auth/signup')}>
            Start Free Trial
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-copy">© 2025 NIV by Nivria. All rights reserved.</div>
          <div className="landing-footer-links">
            <a href="#" className="landing-footer-link">Privacy</a>
            <a href="#" className="landing-footer-link">Terms</a>
            <a href="#" className="landing-footer-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
