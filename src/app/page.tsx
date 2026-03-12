'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase/auth-client'
import {
  Brain, Target, Palette, Layers, Globe, Shield, MessageSquare, Database,
  ChevronRight, AlertTriangle, TrendingUp, Users, FileText, Mail, Megaphone,
  Check, Clock, Zap, Search, Folder, BookOpen, Hash, Presentation, Activity, Play, BarChart3
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const todayFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

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

        /* HERO */
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

        /* MARQUEE */
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

        /* STATEMENT SECTION */
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

        /* TIMELAPSE */
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
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--white);
          letter-spacing: -0.02em;
        }

        .landing-timelapse-label {
          font-size: 0.7rem;
          color: var(--burnt-orange);
          font-weight: 500;
        }

        .landing-timelapse-org {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--grey-400);
        }

        .landing-timelapse-org-avatar {
          width: 24px;
          height: 24px;
          background: var(--grey-700);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 0.55rem;
          font-weight: 600;
          color: var(--white);
        }

        .landing-timelapse-stream {
          padding: 8px 0;
        }

        .landing-timelapse-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 24px;
          position: relative;
        }

        .landing-timelapse-item::before {
          content: '';
          position: absolute;
          left: 67px;
          top: 28px;
          bottom: -12px;
          width: 1px;
          background: var(--grey-800);
        }

        .landing-timelapse-item:last-child::before {
          display: none;
        }

        .landing-timelapse-item-time {
          width: 56px;
          font-size: 0.7rem;
          color: var(--grey-500);
          font-weight: 500;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .landing-timelapse-item-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--grey-700);
          border: 2px solid var(--grey-600);
          flex-shrink: 0;
          margin-top: 4px;
          position: relative;
          z-index: 1;
        }

        .landing-timelapse-item.completed .landing-timelapse-item-dot {
          background: var(--burnt-orange);
          border-color: var(--burnt-orange);
        }

        .landing-timelapse-item.active .landing-timelapse-item-dot {
          background: var(--burnt-orange);
          border-color: var(--burnt-orange);
          box-shadow: 0 0 0 4px rgba(199, 93, 58, 0.25);
          animation: activePulse 2s ease-in-out infinite;
        }

        @keyframes activePulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(199, 93, 58, 0.25); }
          50% { box-shadow: 0 0 0 8px rgba(199, 93, 58, 0.1); }
        }

        .landing-timelapse-item-content {
          flex: 1;
        }

        .landing-timelapse-item-action {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--white);
          margin-bottom: 2px;
        }

        .landing-timelapse-item.completed .landing-timelapse-item-action {
          color: var(--grey-400);
        }

        .landing-timelapse-item-detail {
          font-size: 0.75rem;
          color: var(--grey-500);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .landing-timelapse-score {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background: linear-gradient(135deg, var(--burnt-orange), #e07b5a);
          border-radius: 5px;
          font-family: var(--font-display);
          font-size: 0.65rem;
          font-weight: 700;
          color: white;
        }

        .landing-timelapse-item-assets {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .landing-timelapse-item-assets span {
          font-size: 0.7rem;
          padding: 4px 10px;
          background: var(--grey-800);
          border-radius: 4px;
          color: var(--grey-300);
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
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--white);
        }

        .landing-timelapse-status-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: livePulse 2s ease-in-out infinite;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .landing-timelapse-stats {
          display: flex;
          gap: 8px;
          font-size: 0.7rem;
          color: var(--grey-500);
        }

        /* CTA SECTION */
        .landing-cta-section {
          background: var(--charcoal);
          color: var(--white);
          padding: 100px 80px;
          position: relative;
          overflow: hidden;
        }

        .landing-cta-decoration {
          position: absolute;
          right: -60px;
          top: 50%;
          transform: translateY(-50%);
          width: 300px;
          height: 300px;
          border: 1px solid var(--burnt-orange);
          opacity: 0.15;
          border-radius: 50%;
        }

        .landing-cta-content {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 50px;
          align-items: center;
          position: relative;
        }

        .landing-cta-headline {
          font-family: var(--font-serif);
          font-size: clamp(2.2rem, 4.5vw, 3.5rem);
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: var(--white);
        }

        .landing-cta-headline em {
          font-style: italic;
          color: var(--burnt-orange);
        }

        .landing-cta-actions {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .landing-cta-btn {
          padding: 16px 36px;
          background: var(--burnt-orange);
          color: var(--white);
          border: none;
          font-family: var(--font-body);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
          text-decoration: none;
        }

        .landing-cta-btn:hover {
          background: #d66b48;
        }

        .landing-cta-btn-outline {
          background: transparent;
          border: 1px solid var(--grey-600);
          color: var(--grey-300);
        }

        .landing-cta-btn-outline:hover {
          border-color: var(--white);
          color: var(--white);
          background: transparent;
        }

        /* FOOTER */
        .landing-footer {
          background: var(--charcoal);
          color: var(--grey-400);
          padding: 40px 80px;
          border-top: 1px solid var(--grey-800);
        }

        .landing-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .landing-footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .landing-footer-links {
          display: flex;
          gap: 32px;
        }

        .landing-footer-link {
          color: var(--grey-500);
          text-decoration: none;
          font-size: 0.8rem;
          transition: color 0.2s;
        }

        .landing-footer-link:hover {
          color: var(--white);
        }

        .landing-footer-copy {
          font-size: 0.75rem;
        }

        /* RESPONSIVE */
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

          .landing-statement-section,
          .landing-cta-section,
          .landing-footer {
            padding: 80px 40px;
          }

          .landing-cta-content {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .landing-cta-actions {
            align-items: center;
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

          .landing-statement-section,
          .landing-cta-section,
          .landing-footer {
            padding: 60px 24px;
          }

          .landing-footer-content {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .landing-footer-links {
            flex-wrap: wrap;
            justify-content: center;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', alignSelf: 'flex-end' }}>
            <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '28px', fontWeight: 200, lineHeight: 1 }}>|</span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', color: 'rgba(0,0,0,0.4)', letterSpacing: '1px' }}>by nivria</span>
          </div>
        </div>
        <div className="landing-nav-links">
          <Link href="/platform" className="landing-nav-link">Platform Capabilities</Link>
          <Link href="/contact?demo=true" className="landing-nav-link">Schedule Demo</Link>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
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

      {/* Statement Section - 24/7 */}
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

      {/* Platform Capabilities */}
      <div className="bg-[#0a0a0a]">
        {/* Platform intro header */}
        <section className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Platform <em className="text-[#c75d3a]">Capabilities</em>
            </h2>
            <p className="text-xl text-[#9e9e9e] max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              NIV orchestrates everything you need to achieve your goals and get an edge — automated.
            </p>
          </div>
        </section>

      {/* Section 1: Intelligence Hub */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Intelligence Hub</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Executive Intelligence Briefs
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                NIV continuously monitors market signals, competitor movements, and industry developments to deliver actionable executive briefings with strategic recommendations.
              </p>
              <ul className="space-y-3">
                {['Real-time signal analysis', 'Competitive intelligence', 'Strategic implications', 'Priority action items'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Intelligence Brief Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* Brief Header */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[#c75d3a] text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Executive Intelligence Brief</div>
                    <div className="text-[#757575] text-sm">{todayFormatted} • 47 signals analyzed</div>
                  </div>
                  <div className="px-3 py-1 bg-[#c75d3a]/10 rounded-full">
                    <span className="text-[#c75d3a] text-xs font-medium">LIVE</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#c75d3a]"></div>
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>EXECUTIVE SUMMARY</span>
                </div>
                <p className="text-[#bdbdbd] leading-relaxed" style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>
                  &quot;Market conditions have shifted significantly this quarter with three major competitors announcing AI partnerships. Your positioning as an innovation leader creates a <span className="text-[#c75d3a]">72-hour window</span> to establish thought leadership before the narrative solidifies...&quot;
                </p>
              </div>

              {/* Key Developments */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#c75d3a]"></div>
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>KEY DEVELOPMENTS</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">COMPETITIVE</span>
                      <span className="text-[#757575] text-xs">TODAY</span>
                    </div>
                    <p className="text-[#e0e0e0] text-sm">TechRival announces Azure AI integration partnership</p>
                    <p className="text-[#757575] text-xs mt-1">Impact: Threatens market positioning</p>
                  </div>
                  <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">INDUSTRY</span>
                      <span className="text-[#757575] text-xs">2 DAYS AGO</span>
                    </div>
                    <p className="text-[#e0e0e0] text-sm">New regulatory framework published for AI compliance</p>
                    <p className="text-[#757575] text-xs mt-1">Impact: Creates thought leadership opportunity</p>
                  </div>
                </div>
              </div>

              {/* Priority Signals Sidebar */}
              <div className="p-6 bg-[#212121]">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-[#c75d3a]" />
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PRIORITY SIGNALS</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-red-400 text-xs font-semibold mb-1">IMMEDIATE THREATS</div>
                    <ul className="text-[#9e9e9e] text-sm space-y-1">
                      <li className="flex items-start gap-2"><span className="text-red-400">•</span>Competitor narrative gaining Tier-1 traction</li>
                      <li className="flex items-start gap-2"><span className="text-red-400">•</span>Key analyst shifting perspective</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-[#c75d3a] text-xs font-semibold mb-1">OPPORTUNITIES</div>
                    <ul className="text-[#9e9e9e] text-sm space-y-1">
                      <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Industry award nomination window open</li>
                      <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Speaking slot available at TechConf</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Opportunity Engine */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Opportunity Card Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 flex items-center justify-center">
                      <span className="text-green-400 text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>92</span>
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Partnership Response Strategy</h3>
                      <p className="text-[#9e9e9e] text-sm">Position as the established leader in enterprise AI before competitor narrative solidifies</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[#757575] text-xs">leadership</span>
                        <span className="text-[#757575] text-xs">•</span>
                        <span className="text-[#757575] text-xs">12 content items</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded border border-red-500/30">HIGH</span>
                    <span className="px-2 py-1 bg-[#c75d3a]/10 text-[#c75d3a] text-xs font-semibold rounded border border-[#c75d3a]/30">EXECUTED</span>
                  </div>
                </div>
              </div>

              {/* Strategic Context */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>STRATEGIC CONTEXT</div>

                <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e] mb-3">
                  <div className="text-[#757575] text-xs font-semibold mb-2">TRIGGER EVENTS</div>
                  <ul className="text-[#bdbdbd] text-sm space-y-1">
                    <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-[#c75d3a] mt-1 flex-shrink-0" />TechRival announces Azure AI integration</li>
                    <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-[#c75d3a] mt-1 flex-shrink-0" />Industry report shows 40% AI adoption increase</li>
                    <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-[#c75d3a] mt-1 flex-shrink-0" />Key analyst publishes competitive comparison</li>
                  </ul>
                </div>

                <div className="bg-[#c75d3a]/5 rounded-lg p-4 border border-[#c75d3a]/20">
                  <div className="text-[#c75d3a] text-xs font-semibold mb-2">WHY NOW</div>
                  <p className="text-[#bdbdbd] text-sm">72-hour window before competitor narrative becomes the default industry framing. Early movers will shape the conversation and capture media attention.</p>
                </div>
              </div>

              {/* Execution Plan */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>EXECUTION PLAN</div>
                <div className="space-y-3">
                  {[
                    { stakeholder: 'Industry Analysts', priority: 1, lever: 'Authority & Early Access', items: [
                      { type: 'Press Release', platform: null, urgency: 'immediate', angle: 'First-mover advantage in enterprise AI' },
                      { type: 'Embargo Briefing', platform: null, urgency: 'immediate', angle: 'Exclusive data for analyst report inclusion' },
                      { type: 'Thought Leadership', platform: 'linkedin', urgency: 'this_week', angle: 'CEO perspective on AI automation maturity' },
                    ]},
                    { stakeholder: 'Enterprise Buyers', priority: 2, lever: 'Social Proof & ROI', items: [
                      { type: 'Case Study', platform: null, urgency: 'this_week', angle: 'Fortune 500 beta partner results' },
                      { type: 'Social Thread', platform: 'linkedin', urgency: 'immediate', angle: 'Customer transformation story' },
                    ]},
                    { stakeholder: 'Tech Community', priority: 3, lever: 'Technical Credibility', items: [
                      { type: 'Technical Blog', platform: null, urgency: 'this_week', angle: 'Architecture deep-dive with benchmarks' },
                      { type: 'Social Thread', platform: 'twitter', urgency: 'immediate', angle: 'Thread on why this matters for devs' },
                    ]},
                  ].map((campaign, i) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] overflow-hidden">
                      <div className="px-4 py-3 flex items-center gap-2 border-b border-[#2e2e2e]">
                        <Users className="w-3.5 h-3.5 text-[#c75d3a]" />
                        <span className="text-white text-sm font-medium">{campaign.stakeholder}</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-[#c75d3a]/10 text-[#c75d3a] rounded">P{campaign.priority}</span>
                        <span className="text-[#555555] text-xs ml-auto">{campaign.lever}</span>
                      </div>
                      <div className="divide-y divide-[#2e2e2e]">
                        {campaign.items.map((item, j) => (
                          <div key={j} className="px-4 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-xs">{item.type}</span>
                              {item.platform && (
                                <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                                  item.platform === 'linkedin' ? 'bg-blue-500/20 text-blue-400' :
                                  item.platform === 'twitter' ? 'bg-sky-500/20 text-sky-400' :
                                  'bg-[#3d3d3d] text-[#9e9e9e]'
                                }`}>{item.platform}</span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] rounded ${
                              item.urgency === 'immediate' ? 'text-[#c75d3a] bg-[#c75d3a]/10' : 'text-[#757575] bg-[#3d3d3d]'
                            }`}>{item.urgency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Timeline + Execute */}
              <div className="p-6 bg-[#212121]">
                <div className="text-white text-sm font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>EXECUTION TIMELINE</div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2e2e2e]">
                    <div className="text-[#c75d3a] text-xs font-semibold mb-1">IMMEDIATE</div>
                    <div className="text-[#9e9e9e] text-xs">Press release, Social threads, Talking points</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2e2e2e]">
                    <div className="text-[#757575] text-xs font-semibold mb-1">THIS WEEK</div>
                    <div className="text-[#9e9e9e] text-xs">Case study, Technical blog, Media pitches</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2e2e2e]">
                    <div className="text-[#757575] text-xs font-semibold mb-1">THIS MONTH</div>
                    <div className="text-[#9e9e9e] text-xs">Webinar series, White paper</div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2e2e2e]">
                    <div className="text-[#757575] text-xs font-semibold mb-1">ONGOING</div>
                    <div className="text-[#9e9e9e] text-xs">Social cadence, Analyst updates</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4 text-xs text-[#757575]">
                  <span>Success: Media pickup in 3+ Tier-1 outlets</span>
                  <span>•</span>
                  <span>Analyst mention in next MQ update</span>
                  <span>•</span>
                  <span>15% increase in inbound demo requests</span>
                </div>
                <button className="w-full py-3 bg-[#c75d3a] text-white font-semibold rounded-lg hover:bg-[#e07b5a] transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Execute — Generate All 12 Content Items
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Opportunity Engine</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                One-Click Campaign Execution
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                NIV identifies strategic opportunities from market signals and creates complete execution plans. One click generates all campaign content—press releases, social posts, pitches, and more.
              </p>
              <ul className="space-y-3">
                {['Automatic opportunity scoring', 'Strategic context analysis', 'Multi-stakeholder campaign plans', 'Full content generation'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Studio */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Studio</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                AI-Powered Content Creation
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Generate any type of communications content with organizational context. From press releases to executive statements, NIV creates on-brand content informed by your Memory Vault.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Written', items: 'Press Release, Blog, Thought Leadership' },
                  { label: 'Social', items: 'LinkedIn, Twitter Thread, Instagram' },
                  { label: 'Executive', items: 'Statements, Board Decks, Investor Updates' },
                  { label: 'Media', items: 'Pitches, Media Lists, Interview Prep' },
                ].map((cat, i) => (
                  <div key={i} className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2e2e2e]">
                    <div className="text-[#c75d3a] text-xs font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{cat.label}</div>
                    <div className="text-[#9e9e9e] text-sm">{cat.items}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Studio Content Examples Mockup */}
            <div className="space-y-4">
              {/* Press Release Example */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#c75d3a]" />
                    <span className="text-white text-sm font-medium">Press Release</span>
                  </div>
                  <span className="text-[#757575] text-xs">Generated</span>
                </div>
                <div className="p-5">
                  <div className="text-[#757575] text-xs tracking-wider mb-3">FOR IMMEDIATE RELEASE</div>
                  <h4 className="text-white text-lg font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Acme Corp Announces Industry-First AI Integration Platform, Transforming Enterprise Workflows
                  </h4>
                  <p className="text-[#9e9e9e] text-sm leading-relaxed mb-3">
                    <span className="text-[#bdbdbd]">SAN FRANCISCO – {todayFormatted}</span> – Acme Corp, the leading provider of enterprise automation solutions, today announced the launch of AIFlow, a groundbreaking platform that seamlessly integrates artificial intelligence...
                  </p>
                  <p className="text-[#9e9e9e] text-sm leading-relaxed italic" style={{ fontFamily: 'Playfair Display, serif' }}>
                    &quot;This represents a fundamental shift in how enterprises approach automation,&quot; said Jane Smith, CEO of Acme Corp. &quot;We&apos;ve spent two years developing technology that...&quot;
                  </p>
                </div>
              </div>

              {/* Two Column: LinkedIn + Executive Statement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#c75d3a]" />
                    <span className="text-white text-sm font-medium">LinkedIn Post</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[#bdbdbd] text-sm leading-relaxed">
                      Excited to share that we&apos;ve just launched AIFlow — transforming how enterprises work.
                      <br /><br />
                      After 18 months of development with Fortune 500 beta partners, we&apos;ve proven that AI automation can deliver 40% efficiency gains...
                    </p>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#c75d3a]" />
                    <span className="text-white text-sm font-medium">Executive Statement</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[#bdbdbd] text-sm leading-relaxed italic" style={{ fontFamily: 'Playfair Display, serif' }}>
                      &quot;Our commitment to innovation has never been stronger. Today marks a pivotal moment in our company&apos;s journey toward redefining what&apos;s possible...&quot;
                    </p>
                    <p className="text-[#757575] text-xs mt-3">— Jane Smith, CEO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Presentations */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Presentation className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Presentations</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                From Insight to <em className="text-[#c75d3a]">Presentation</em> in Minutes
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Work with NIV to create beautiful, professional presentations on any topic. Whether it&apos;s a campaign blueprint, executive briefing, board deck, or strategic analysis—NIV transforms your ideas into polished, ready-to-present materials.
              </p>
              <ul className="space-y-3 mb-8">
                {['Campaign blueprints & strategies', 'Executive briefings & board decks', 'Competitive analyses & market reports', 'Crisis communication plans', 'Any custom topic you need'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              {/* How it works */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-6">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>HOW IT WORKS</div>
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Describe what you need', desc: 'Tell NIV what presentation you want to create' },
                    { step: '2', title: 'NIV researches & structures', desc: 'AI gathers insights and builds your narrative' },
                    { step: '3', title: 'Review & refine together', desc: 'Iterate with NIV until it\'s perfect' },
                    { step: '4', title: 'Export & present', desc: 'Download or present directly from NIV' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#c75d3a]/10 border border-[#c75d3a]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#c75d3a] text-sm font-bold">{item.step}</span>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{item.title}</div>
                        <div className="text-[#757575] text-xs">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Presentation Visual Mockup */}
            <div className="space-y-4">
              {/* Main Presentation Slide */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
                {/* Slide Header */}
                <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-[#c75d3a]" />
                    <span className="text-white text-sm font-medium">Campaign Blueprint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#757575] text-xs">Slide 1 of 8</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#c75d3a]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                    </div>
                  </div>
                </div>

                {/* Slide Content */}
                <div className="p-8 bg-gradient-to-br from-[#1a1a1a] to-[#212121]">
                  <div className="text-[#c75d3a] text-xs font-semibold tracking-[0.15em] uppercase mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>STRATEGIC BLUEPRINT</div>
                  <h3 className="text-white text-2xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                    AI Leadership <em className="text-[#c75d3a]">Positioning</em> Campaign
                  </h3>
                  <p className="text-[#9e9e9e] text-sm mb-6">Establish thought leadership in enterprise AI before competitor narratives solidify</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3d3d3d]">
                      <div className="text-[#c75d3a] text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>72hr</div>
                      <div className="text-[#757575] text-xs">Window</div>
                    </div>
                    <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3d3d3d]">
                      <div className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>23</div>
                      <div className="text-[#757575] text-xs">Content Pieces</div>
                    </div>
                    <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3d3d3d]">
                      <div className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>3</div>
                      <div className="text-[#757575] text-xs">Stakeholder Groups</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide Thumbnails */}
              <div className="grid grid-cols-4 gap-3">
                {/* Executive Summary */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] p-2 cursor-pointer hover:border-[#c75d3a]/50 transition-colors">
                  <div className="bg-[#212121] rounded p-2 mb-2">
                    <div className="w-full h-1 bg-[#c75d3a]/40 rounded mb-1.5"></div>
                    <div className="w-3/4 h-0.5 bg-[#3d3d3d] rounded mb-1"></div>
                    <div className="w-full h-0.5 bg-[#3d3d3d] rounded mb-1"></div>
                    <div className="flex gap-1 mt-2">
                      <div className="flex-1 h-4 bg-[#2a2a2a] rounded"></div>
                      <div className="flex-1 h-4 bg-[#2a2a2a] rounded"></div>
                    </div>
                  </div>
                  <div className="text-[#9e9e9e] text-xs truncate">Executive Summary</div>
                </div>

                {/* Market Analysis */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] p-2 cursor-pointer hover:border-[#c75d3a]/50 transition-colors">
                  <div className="bg-[#212121] rounded p-2 mb-2">
                    <div className="w-2/3 h-1 bg-[#c75d3a]/40 rounded mb-1.5"></div>
                    <div className="flex items-end gap-0.5 h-6 mt-1">
                      <div className="flex-1 bg-[#c75d3a]/30 rounded-t" style={{ height: '40%' }}></div>
                      <div className="flex-1 bg-[#c75d3a]/40 rounded-t" style={{ height: '60%' }}></div>
                      <div className="flex-1 bg-[#c75d3a]/50 rounded-t" style={{ height: '80%' }}></div>
                      <div className="flex-1 bg-[#c75d3a]/60 rounded-t" style={{ height: '100%' }}></div>
                    </div>
                  </div>
                  <div className="text-[#9e9e9e] text-xs truncate">Market Analysis</div>
                </div>

                {/* Strategic Approach */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] p-2 cursor-pointer hover:border-[#c75d3a]/50 transition-colors">
                  <div className="bg-[#212121] rounded p-2 mb-2">
                    <div className="w-3/4 h-1 bg-[#c75d3a]/40 rounded mb-1.5"></div>
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c75d3a]/50"></div>
                        <div className="flex-1 h-0.5 bg-[#3d3d3d] rounded"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c75d3a]/50"></div>
                        <div className="flex-1 h-0.5 bg-[#3d3d3d] rounded"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c75d3a]/50"></div>
                        <div className="flex-1 h-0.5 bg-[#3d3d3d] rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[#9e9e9e] text-xs truncate">Strategic Approach</div>
                </div>

                {/* Timeline & KPIs */}
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] p-2 cursor-pointer hover:border-[#c75d3a]/50 transition-colors">
                  <div className="bg-[#212121] rounded p-2 mb-2">
                    <div className="w-2/3 h-1 bg-[#c75d3a]/40 rounded mb-1.5"></div>
                    <div className="flex items-center gap-0.5 mt-2">
                      <div className="w-2 h-2 rounded-full bg-[#c75d3a]/50"></div>
                      <div className="flex-1 h-0.5 bg-[#3d3d3d]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                      <div className="flex-1 h-0.5 bg-[#3d3d3d]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#3d3d3d]"></div>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <div className="flex-1 h-2 bg-[#2a2a2a] rounded text-center">
                        <span className="text-[4px] text-[#555]">Q1</span>
                      </div>
                      <div className="flex-1 h-2 bg-[#2a2a2a] rounded"></div>
                    </div>
                  </div>
                  <div className="text-[#9e9e9e] text-xs truncate">Timeline & KPIs</div>
                </div>
              </div>

              {/* NIV Chat Integration */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
                <div className="flex items-start gap-3">
                  <svg width="32" height="32" viewBox="0 0 72 72" className="flex-shrink-0">
                    <rect width="72" height="72" rx="16" fill="#faf9f7" />
                    <text x="10" y="50" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="36" fill="#1a1a1a">NIV</text>
                    <polygon points="58,0 72,0 72,14" fill="#c75d3a" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-[#bdbdbd] text-sm mb-3">
                      I&apos;ve created an 8-slide blueprint based on your AI partnership response strategy. Want me to add a competitive analysis section or adjust the timeline?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1.5 bg-[#c75d3a] text-white text-xs rounded-lg">Add Competitive Analysis</button>
                      <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Adjust Timeline</button>
                      <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Export PDF</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: VECTOR Campaign Builder */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-[#c75d3a]" />
              <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>VECTOR Campaign Builder</span>
            </div>
            <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Multi-Stakeholder Influence Orchestration
            </h2>
            <p className="text-[#9e9e9e] text-lg max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              VECTOR campaigns coordinate messaging across stakeholder groups through four strategic phases, leveraging psychological insights to maximize influence and narrative control.
            </p>
          </div>

          {/* VECTOR Matrix Mockup */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
            {/* Campaign Header */}
            <div className="p-6 border-b border-[#2e2e2e]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-xl font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>VECTOR CAMPAIGN: AI Leadership Positioning</h3>
                  <p className="text-[#757575] text-sm">23 content pieces • 3 stakeholder groups • 8-week timeline</p>
                </div>
                <div className="px-4 py-2 bg-[#c75d3a]/10 rounded-lg border border-[#c75d3a]/30">
                  <div className="text-[#c75d3a] text-xs font-semibold mb-0.5">PATTERN</div>
                  <div className="text-white text-sm font-medium">CASCADE</div>
                </div>
              </div>
              <p className="text-[#9e9e9e] text-sm mt-3 italic">&quot;Influencer groups shift first, creating validation for mass adoption&quot;</p>
            </div>

            {/* Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2e2e2e]">
                    <th className="p-4 text-left text-[#757575] text-xs font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>STAKEHOLDER</th>
                    <th className="p-4 text-center text-[#757575] text-xs font-semibold border-l border-[#2e2e2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div>AWARENESS</div>
                      <div className="text-[#555555] font-normal mt-1">Week 1-2</div>
                    </th>
                    <th className="p-4 text-center text-[#757575] text-xs font-semibold border-l border-[#2e2e2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div>CONSIDERATION</div>
                      <div className="text-[#555555] font-normal mt-1">Week 3-4</div>
                    </th>
                    <th className="p-4 text-center text-[#757575] text-xs font-semibold border-l border-[#2e2e2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div>CONVERSION</div>
                      <div className="text-[#555555] font-normal mt-1">Week 5-6</div>
                    </th>
                    <th className="p-4 text-center text-[#757575] text-xs font-semibold border-l border-[#2e2e2e]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      <div>ADVOCACY</div>
                      <div className="text-[#555555] font-normal mt-1">Week 7+</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'Industry Analysts',
                      bias: 'Authority bias, early-adopter identity',
                      cells: [
                        ['Thought leadership', 'Embargo briefings'],
                        ['Deep-dive briefings', '1:1 analyst calls'],
                        ['Case studies', 'Demo access'],
                        ['Speaking circuit', 'Quote inclusions']
                      ]
                    },
                    {
                      name: 'Enterprise Buyers',
                      bias: 'Loss aversion, social proof from analysts',
                      cells: [
                        ['PR coverage', 'LinkedIn campaign'],
                        ['Webinar series', 'White papers'],
                        ['ROI calculator', 'Free trial'],
                        ['Customer stories', 'Reference program']
                      ]
                    },
                    {
                      name: 'Tech Community',
                      bias: 'Technical credibility, innovation identity',
                      cells: [
                        ['Social threads', 'Reddit AMA'],
                        ['Technical blogs', 'API documentation'],
                        ['GitHub access', 'Beta program'],
                        ['Community champions', 'Open source']
                      ]
                    }
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-[#2e2e2e] last:border-b-0">
                      <td className="p-4">
                        <div className="text-white text-sm font-medium mb-1">{row.name}</div>
                        <div className="text-[#555555] text-xs">{row.bias}</div>
                      </td>
                      {row.cells.map((cell, j) => (
                        <td key={j} className="p-4 border-l border-[#2e2e2e]">
                          <ul className="space-y-1">
                            {cell.map((item, k) => (
                              <li key={k} className="text-[#9e9e9e] text-xs flex items-center gap-1">
                                <span className="text-[#c75d3a]">•</span> {item}
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Psychological Leverage Footer */}
            <div className="p-6 bg-[#212121] border-t border-[#2e2e2e]">
              <div className="text-white text-sm font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PSYCHOLOGICAL LEVERAGE</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-[#9e9e9e] text-sm"><span className="text-[#c75d3a]">Analysts:</span> Authority bias, early-adopter identity</div>
                <div className="text-[#9e9e9e] text-sm"><span className="text-[#c75d3a]">Buyers:</span> Loss aversion, social proof validation</div>
                <div className="text-[#9e9e9e] text-sm"><span className="text-[#c75d3a]">Community:</span> Technical credibility, innovation identity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5b: GEO Intelligence */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>GEO Intelligence</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                AI Platform Visibility
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Optimize your organization&apos;s presence in AI-powered search and recommendation systems. GEO generates Schema.org structured data and tracks visibility across major AI platforms.
              </p>
              <ul className="space-y-3">
                {['Schema.org structured data generation', 'Multi-platform AI visibility tracking', 'Competitive visibility analysis', 'Optimization recommendations'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* GEO Mockup */}
            <div className="space-y-4">
              {/* Schema Preview */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Generated Schema</span>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-xs">Validated</span>
                  </div>
                </div>
                <div className="p-4 font-mono text-xs overflow-x-auto">
                  <pre className="text-[#9e9e9e]">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Acme Corp",
  "description": "Enterprise AI automation leader",
  "url": "https://acme.com",
  "founder": {
    "@type": "Person",
    "name": "Jane Smith",
    "jobTitle": "CEO"
  },
  "knowsAbout": [
    "Artificial Intelligence",
    "Enterprise Automation"
  ]
}
</script>`}
                  </pre>
                </div>
                <div className="px-4 py-3 bg-[#212121] border-t border-[#2e2e2e] flex items-center gap-4">
                  <span className="text-[#757575] text-xs">✓ 12 entities defined</span>
                  <span className="text-[#757575] text-xs">✓ Rich snippets eligible</span>
                </div>
              </div>

              {/* AI Platform Visibility */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-6">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI PLATFORM VISIBILITY</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'ChatGPT', logo: '🤖', score: 72, trend: '+12%', color: 'text-green-400' },
                    { name: 'Gemini', logo: '✨', score: 58, trend: '+8%', color: 'text-green-400' },
                    { name: 'Perplexity', logo: '🔍', score: 84, trend: '+23%', color: 'text-green-400' },
                    { name: 'Claude', logo: '🧠', score: 45, trend: '-3%', color: 'text-red-400' },
                  ].map((platform, i) => (
                    <div key={i} className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{platform.logo}</span>
                          <span className="text-white text-sm font-medium">{platform.name}</span>
                        </div>
                        <span className={`text-xs ${platform.color}`}>{platform.trend} MTD</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#3d3d3d] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#c75d3a] rounded-full"
                            style={{ width: `${platform.score}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-semibold">{platform.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#2e2e2e]">
                  <div className="text-[#757575] text-xs mb-2">TOP QUERIES WHERE YOU APPEAR:</div>
                  <div className="space-y-1">
                    <div className="text-[#9e9e9e] text-sm">&quot;best enterprise AI tools&quot; — <span className="text-[#c75d3a]">Position #3</span></div>
                    <div className="text-[#9e9e9e] text-sm">&quot;AI automation platforms&quot; — <span className="text-[#c75d3a]">Position #5</span></div>
                    <div className="text-[#757575] text-sm">&quot;machine learning for business&quot; — <span className="text-red-400">Not ranking</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Crisis Command */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Crisis Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#c75d3a] rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Crisis Command</h3>
                      <p className="text-[#757575] text-sm">Readiness Dashboard</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#9e9e9e] text-sm">Overall Readiness</span>
                    <span className="text-white text-sm font-semibold">78%</span>
                  </div>
                  <div className="h-2 bg-[#3d3d3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#c75d3a] rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>

              {/* Crisis Scenarios */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CRISIS SCENARIOS</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { severity: 'CRITICAL', color: 'red', title: 'Data Breach Response', desc: 'Unauthorized access to customer data detected', likelihood: 'HIGH' },
                    { severity: 'HIGH', color: 'orange', title: 'Executive Misconduct', desc: 'Allegations of improper conduct by senior leader', likelihood: 'MEDIUM' },
                    { severity: 'HIGH', color: 'orange', title: 'Product Safety Recall', desc: 'Product defect requiring public announcement', likelihood: 'LOW' },
                    { severity: 'MODERATE', color: 'yellow', title: 'Social Media Backlash', desc: 'Viral negative content threatening brand', likelihood: 'HIGH' },
                  ].map((scenario, i) => (
                    <div key={i} className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e] hover:border-[#c75d3a]/50 transition-colors cursor-pointer">
                      <div className={`text-xs font-semibold mb-2 ${
                        scenario.color === 'red' ? 'text-red-400' :
                        scenario.color === 'orange' ? 'text-[#c75d3a]' : 'text-yellow-400'
                      }`}>
                        {scenario.color === 'red' ? '🔴' : scenario.color === 'orange' ? '🟠' : '🟡'} {scenario.severity}
                      </div>
                      <h4 className="text-white text-sm font-medium mb-1">{scenario.title}</h4>
                      <p className="text-[#757575] text-xs mb-2">{scenario.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555] text-xs">Likelihood: {scenario.likelihood}</span>
                        <span className="text-[#c75d3a] text-xs">View →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crisis Team */}
              <div className="p-6 bg-[#212121]">
                <div className="text-white text-sm font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CRISIS TEAM READINESS</div>
                <div className="space-y-2">
                  {[
                    { role: 'Crisis Lead (CEO)', assigned: true },
                    { role: 'Comms Lead (VP Comms)', assigned: true },
                    { role: 'Legal Counsel', assigned: true },
                    { role: 'Technical Lead', assigned: false },
                    { role: 'HR Representative', assigned: false },
                  ].map((member, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[#9e9e9e] text-sm">{member.role}</span>
                      {member.assigned ? (
                        <span className="text-green-400 text-xs flex items-center gap-1">
                          <Check className="w-3 h-3" /> Assigned
                        </span>
                      ) : (
                        <span className="text-[#757575] text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-400" /> Not Assigned
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Crisis Command</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Crisis Readiness & Response
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Pre-built crisis playbooks tailored to your organization. NIV generates comprehensive crisis plans with scenario-specific response protocols, stakeholder communications, and real-time AI guidance during active situations.
              </p>
              <ul className="space-y-3">
                {['AI-generated crisis plans', 'Scenario-specific playbooks', 'Team role assignments', 'Real-time crisis AI assistant'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: NIV Advisor */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NIV Advisor</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Your AI Communications Partner
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                NIV is your always-available strategic advisor. Ask anything about your organization, get recommendations on opportunities, generate content, or navigate crisis situations—all with full organizational context.
              </p>
              <ul className="space-y-3">
                {['Organizational context awareness', 'Strategic recommendations', 'Any content type generation', 'Memory across conversations'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* NIV Chat Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* NIV Header with Badge */}
              <div className="p-6 border-b border-[#2e2e2e] flex items-center gap-4">
                {/* NIV Square Icon - Primary Icon (Light) */}
                <svg width="56" height="56" viewBox="0 0 72 72">
                  <rect width="72" height="72" rx="16" fill="#faf9f7" />
                  <text
                    x="10"
                    y="50"
                    fontFamily="Space Grotesk, sans-serif"
                    fontWeight="700"
                    fontSize="36"
                    fill="#1a1a1a"
                  >
                    NIV
                  </text>
                  <polygon points="58,0 72,0 72,14" fill="#c75d3a" />
                </svg>
                <div>
                  <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NIV Advisor</h3>
                  <p className="text-[#757575] text-sm">Neural Intelligence Vehicle</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 space-y-4 max-h-96">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#3d3d3d] rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]">
                    <p className="text-white text-sm">What opportunities should I prioritize this week?</p>
                  </div>
                </div>

                {/* NIV Response */}
                <div className="flex justify-start">
                  <div className="bg-[#212121] rounded-2xl rounded-tl-md px-4 py-3 max-w-[90%] border border-[#2e2e2e]">
                    <p className="text-[#bdbdbd] text-sm mb-4">Based on my analysis of 47 signals from the past 48 hours, I recommend prioritizing:</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-400 text-xs font-bold">92</span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">AI Partnership Response</div>
                          <div className="text-[#757575] text-xs">72-hour window before narrative solidifies</div>
                          <div className="text-[#c75d3a] text-xs mt-1">→ Execute now for maximum impact</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-yellow-400 text-xs font-bold">78</span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">Earnings Narrative Setup</div>
                          <div className="text-[#757575] text-xs">Q4 results release in 2 weeks</div>
                          <div className="text-[#9e9e9e] text-xs mt-1">→ Begin analyst briefings this week</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[#bdbdbd] text-sm mb-3">Should I generate a campaign for the AI response?</p>

                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1.5 bg-[#c75d3a] text-white text-xs rounded-lg">Generate Campaign</button>
                      <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Show Details</button>
                      <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Other</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[#2e2e2e]">
                <div className="flex items-center gap-3 bg-[#212121] rounded-xl px-4 py-3 border border-[#2e2e2e]">
                  <MessageSquare className="w-5 h-5 text-[#555555]" />
                  <input
                    type="text"
                    placeholder="Ask NIV anything about your organization..."
                    className="flex-1 bg-transparent text-white text-sm placeholder-[#555555] outline-none"
                  />
                  <button className="px-4 py-1.5 bg-[#c75d3a] text-white text-xs rounded-lg">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Memory Vault */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Memory Vault Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-5 h-5 text-[#c75d3a]" />
                  <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Memory Vault</h3>
                </div>
                <div className="flex items-center gap-3 bg-[#212121] rounded-xl px-4 py-3 border border-[#2e2e2e]">
                  <Search className="w-5 h-5 text-[#555555]" />
                  <input
                    type="text"
                    placeholder="Search your organizational knowledge..."
                    className="flex-1 bg-transparent text-white text-sm placeholder-[#555555] outline-none"
                  />
                </div>
                <div className="text-[#555555] text-xs mt-2">Semantic search powered by AI</div>
              </div>

              {/* Content */}
              <div className="flex">
                {/* Folders */}
                <div className="w-48 border-r border-[#2e2e2e] p-4">
                  <div className="text-[#757575] text-xs font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>FOLDERS</div>
                  <div className="space-y-1">
                    {[
                      { name: 'Campaigns', count: 12, expanded: true, children: ['Q4 Launch', 'AI Response'] },
                      { name: 'Intelligence', count: 24, expanded: false },
                      { name: 'Content', count: 89, expanded: false },
                      { name: 'Crisis Plans', count: 3, expanded: false },
                      { name: 'Org Profile', count: 1, expanded: false },
                    ].map((folder, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#212121] cursor-pointer">
                          <Folder className="w-4 h-4 text-[#c75d3a]" />
                          <span className="text-[#bdbdbd] text-sm flex-1">{folder.name}</span>
                          <span className="text-[#555555] text-xs">{folder.count}</span>
                        </div>
                        {folder.expanded && folder.children && (
                          <div className="ml-6 space-y-1 mt-1">
                            {folder.children.map((child, j) => (
                              <div key={j} className="flex items-center gap-2 py-1 px-2 text-[#757575] text-xs hover:text-[#bdbdbd] cursor-pointer">
                                <span>└</span> {child}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Items */}
                <div className="flex-1 p-4">
                  <div className="text-[#757575] text-xs font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>RECENT & HIGH-SALIENCE</div>
                  <div className="space-y-2">
                    {[
                      { icon: FileText, title: 'AI Partnership Response Blueprint', type: 'campaign', time: '2 hours ago', score: 92 },
                      { icon: Brain, title: 'Executive Intelligence Brief', type: 'intelligence', time: 'today', meta: '47 signals' },
                      { icon: FileText, title: 'Q4 Launch Press Release', type: 'press-release', time: 'yesterday' },
                      { icon: Shield, title: 'Crisis Management Plan', type: 'crisis-plan', time: 'last week' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e] hover:border-[#c75d3a]/30 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <item.icon className="w-4 h-4 text-[#c75d3a] mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">{item.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#c75d3a] text-xs">{item.type}</span>
                              <span className="text-[#555555] text-xs">•</span>
                              <span className="text-[#555555] text-xs">{item.time}</span>
                              {item.score && (
                                <>
                                  <span className="text-[#555555] text-xs">•</span>
                                  <span className="text-green-400 text-xs">Score: {item.score}</span>
                                </>
                              )}
                              {item.meta && (
                                <>
                                  <span className="text-[#555555] text-xs">•</span>
                                  <span className="text-[#555555] text-xs">{item.meta}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-[#212121] border-t border-[#2e2e2e]">
                <span className="text-[#555555] text-xs">234 items • 12 folders • 1.2GB</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Memory Vault</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Organizational Intelligence
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Everything NIV learns about your organization is stored and searchable. Campaigns, content, intelligence briefs, and crisis plans—all accessible through AI-powered semantic search.
              </p>
              <ul className="space-y-3">
                {['Semantic search with embeddings', 'Automatic content organization', 'Salience-based ranking', 'Content deduplication'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Predictions */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Predictions Engine</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Forward-Looking <em className="text-[#c75d3a]">Intelligence</em>
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                NIV doesn&apos;t just report what happened — it predicts what&apos;s coming next. AI-generated predictions with confidence scores, timeframes, and validation tracking let you act before events unfold.
              </p>
              <ul className="space-y-3">
                {['AI-generated forward predictions', 'Confidence scoring & timeframes', 'Automatic validation tracking', 'Pattern-based trend detection'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Predictions Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-[#c75d3a]" />
                    <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Active Predictions</h3>
                  </div>
                  <div className="px-3 py-1 bg-[#c75d3a]/10 rounded-full">
                    <span className="text-[#c75d3a] text-xs font-medium">12 Active</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-[#212121] rounded-lg p-3 text-center border border-[#2e2e2e]">
                    <div className="text-white text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>12</div>
                    <div className="text-[#757575] text-xs">Active</div>
                  </div>
                  <div className="bg-[#212121] rounded-lg p-3 text-center border border-[#2e2e2e]">
                    <div className="text-green-400 text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>8</div>
                    <div className="text-[#757575] text-xs">Validated</div>
                  </div>
                  <div className="bg-[#212121] rounded-lg p-3 text-center border border-[#2e2e2e]">
                    <div className="text-[#757575] text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>3</div>
                    <div className="text-[#757575] text-xs">Expired</div>
                  </div>
                  <div className="bg-[#212121] rounded-lg p-3 text-center border border-[#2e2e2e]">
                    <div className="text-[#c75d3a] text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>73%</div>
                    <div className="text-[#757575] text-xs">Accuracy</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {[
                  { confidence: 87, title: 'TechRival likely to announce enterprise pricing restructure', timeframe: '14 days', category: 'COMPETITIVE', categoryColor: 'text-red-400 bg-red-500/10' },
                  { confidence: 74, title: 'Regulatory framework draft expected from EU committee', timeframe: '30 days', category: 'REGULATORY', categoryColor: 'text-blue-400 bg-blue-500/10' },
                  { confidence: 91, title: 'Market consolidation: 2-3 acquisitions in AI middleware space', timeframe: '60 days', category: 'MARKET', categoryColor: 'text-purple-400 bg-purple-500/10' },
                ].map((pred, i) => (
                  <div key={i} className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#c75d3a]/10 border border-[#c75d3a]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#c75d3a] text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{pred.confidence}%</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium mb-1">{pred.title}</div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${pred.categoryColor}`}>{pred.category}</span>
                          <span className="text-[#555555] text-xs">•</span>
                          <span className="text-[#757575] text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{pred.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 bg-[#212121] border-t border-[#2e2e2e]">
                <div className="flex items-center justify-between">
                  <span className="text-[#757575] text-xs">Predictions auto-generated from intelligence pipeline</span>
                  <span className="text-[#c75d3a] text-xs">View all →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Cascade Analysis */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Cascade Mockup */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#c75d3a]" />
                    <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cascade Intelligence</h3>
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 rounded-full">
                    <span className="text-green-400 text-xs font-medium">MONITORING</span>
                  </div>
                </div>
                <p className="text-[#9e9e9e] text-sm">Tracking how signals propagate across stakeholder networks and media ecosystems</p>
              </div>

              <div className="p-6 border-b border-[#2e2e2e]">
                <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>SIGNAL CASCADE MAP</div>
                <div className="space-y-4">
                  {/* Cascade Flow */}
                  <div className="relative">
                    <div className="bg-[#212121] rounded-lg p-4 border border-red-500/30 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded font-semibold">ORIGIN</span>
                        <span className="text-[#757575] text-xs">2 hours ago</span>
                      </div>
                      <div className="text-white text-sm font-medium">TechRival CEO interview on CNBC</div>
                    </div>
                    <div className="ml-6 border-l-2 border-[#c75d3a]/30 pl-4 space-y-2">
                      <div className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#c75d3a]/10 text-[#c75d3a] text-xs rounded">+1hr</span>
                          <span className="text-white text-sm">3 Tier-1 outlets amplified</span>
                        </div>
                        <div className="text-[#757575] text-xs">Reuters, Bloomberg, TechCrunch picked up narrative</div>
                      </div>
                      <div className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#c75d3a]/10 text-[#c75d3a] text-xs rounded">+2hr</span>
                          <span className="text-white text-sm">Analyst sentiment shifting</span>
                        </div>
                        <div className="text-[#757575] text-xs">2 key analysts revised competitor outlook positively</div>
                      </div>
                      <div className="bg-[#212121] rounded-lg p-3 border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded">PREDICTED</span>
                          <span className="text-white text-sm">Social amplification wave</span>
                        </div>
                        <div className="text-[#757575] text-xs">Expected: 50K+ impressions within 24hrs based on cascade velocity</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#212121]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm font-medium">Cascade Velocity</div>
                    <div className="text-[#757575] text-xs">How fast this signal is spreading</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#c75d3a] text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>HIGH</div>
                    <div className="text-[#757575] text-xs">3 hops in 2 hours</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[#c75d3a]" />
                <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cascade Analysis</span>
              </div>
              <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Track How Narratives <em className="text-[#c75d3a]">Spread</em>
              </h2>
              <p className="text-[#9e9e9e] text-lg mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                Understand how signals cascade through media ecosystems and stakeholder networks. NIV maps propagation patterns, predicts amplification, and identifies intervention points before narratives solidify.
              </p>
              <ul className="space-y-3">
                {['Signal propagation mapping', 'Cascade velocity tracking', 'Narrative amplification prediction', 'Optimal intervention timing'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#bdbdbd]">
                    <div className="w-5 h-5 rounded-full bg-[#c75d3a]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#c75d3a]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Simulations */}
      <section className="py-24 px-6 border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Play className="w-5 h-5 text-[#c75d3a]" />
              <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Simulation Engine</span>
            </div>
            <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Test Strategies <em className="text-[#c75d3a]">Before</em> You Act
            </h2>
            <p className="text-[#9e9e9e] text-lg max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Run multi-round stakeholder simulations to predict how competitors, regulators, journalists, and customers will respond to your actions. Know the outcome before you commit.
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
            {/* Simulation Header */}
            <div className="p-6 border-b border-[#2e2e2e]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-xl font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>SIMULATION: AI Partnership Announcement</h3>
                  <p className="text-[#757575] text-sm">Testing stakeholder response to proposed partnership press release</p>
                </div>
                <div className="px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="text-green-400 text-xs font-semibold mb-0.5">STATUS</div>
                  <div className="text-white text-sm font-medium">COMPLETE</div>
                </div>
              </div>
            </div>

            {/* Simulation Metrics */}
            <div className="p-6 border-b border-[#2e2e2e]">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e] text-center">
                  <div className="text-[#c75d3a] text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>4</div>
                  <div className="text-[#757575] text-xs">Rounds</div>
                </div>
                <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e] text-center">
                  <div className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>94%</div>
                  <div className="text-[#757575] text-xs">Stabilization</div>
                </div>
                <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e] text-center">
                  <div className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>8</div>
                  <div className="text-[#757575] text-xs">Entities</div>
                </div>
                <div className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e] text-center">
                  <div className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>2:34</div>
                  <div className="text-[#757575] text-xs">Duration</div>
                </div>
              </div>
            </div>

            {/* Entity Responses */}
            <div className="p-6 border-b border-[#2e2e2e]">
              <div className="text-white text-sm font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>STABILIZED ENTITY POSITIONS</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Gartner', type: 'ANALYST', stance: 'Cautiously Positive', stanceColor: 'text-green-400', action: 'Will seek briefing before publishing updated MQ' },
                  { name: 'TechRival', type: 'COMPETITOR', stance: 'Defensive Counter', stanceColor: 'text-red-400', action: 'Likely to accelerate own partnership announcements' },
                  { name: 'WSJ Tech Desk', type: 'JOURNALIST', stance: 'Interest / Skepticism', stanceColor: 'text-yellow-400', action: 'Will want exclusive data points for coverage' },
                  { name: 'Enterprise Buyers', type: 'CUSTOMER', stance: 'Wait-and-See', stanceColor: 'text-blue-400', action: 'Need proof points before shifting procurement' },
                ].map((entity, i) => (
                  <div key={i} className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white text-sm font-medium">{entity.name}</span>
                      <span className="px-2 py-0.5 bg-[#3d3d3d] text-[#757575] text-xs rounded">{entity.type}</span>
                    </div>
                    <div className={`text-sm font-medium mb-1 ${entity.stanceColor}`}>{entity.stance}</div>
                    <div className="text-[#757575] text-xs">{entity.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Findings */}
            <div className="p-6 bg-[#212121]">
              <div className="text-white text-sm font-semibold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>KEY SIMULATION FINDINGS</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[#c75d3a] text-xs font-semibold mb-2">DOMINANT NARRATIVES</div>
                  <ul className="text-[#9e9e9e] text-sm space-y-1">
                    <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Market consolidation accelerating</li>
                    <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Enterprise AI becoming table stakes</li>
                  </ul>
                </div>
                <div>
                  <div className="text-[#c75d3a] text-xs font-semibold mb-2">COALITIONS FORMED</div>
                  <ul className="text-[#9e9e9e] text-sm space-y-1">
                    <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Analysts + Enterprise = validation loop</li>
                    <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Competitors + Media = counter-narrative</li>
                  </ul>
                </div>
                <div>
                  <div className="text-[#c75d3a] text-xs font-semibold mb-2">LEVERAGE POINTS</div>
                  <ul className="text-[#9e9e9e] text-sm space-y-1">
                    <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Analyst briefings critical in first 48hrs</li>
                    <li className="flex items-start gap-2"><span className="text-[#c75d3a]">•</span>Customer proof points neutralize skepticism</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Deep Research */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Search className="w-5 h-5 text-[#c75d3a]" />
              <span className="text-[#c75d3a] text-xs font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Deep Research Engine</span>
            </div>
            <h2 className="text-4xl text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Research That Actually <em className="text-[#c75d3a]">Understands</em>
            </h2>
            <p className="text-[#9e9e9e] text-lg max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              NIV conducts multi-stage deep research across stakeholder psychology, narrative landscapes, channel intelligence, and historical patterns — then synthesizes everything into actionable intelligence briefs.
            </p>
          </div>

          {/* Full Research Report Mockup */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] overflow-hidden">
            {/* Report Header */}
            <div className="p-6 border-b border-[#2e2e2e]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[#c75d3a] text-xs font-semibold tracking-[0.15em] uppercase mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Campaign Intelligence Brief</div>
                  <h3 className="text-white text-xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Partnership Positioning Strategy</h3>
                  <div className="text-[#757575] text-sm mt-1">4-stage research • 47 sources analyzed • Confidence: 92%</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-green-500/10 rounded-full">
                    <span className="text-green-400 text-xs font-medium">COMPLETE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights - Top Priority */}
            <div className="p-6 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#c75d3a]"></div>
                <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>KEY INSIGHTS</span>
              </div>
              <div className="space-y-3">
                {[
                  { insight: 'Enterprise buyers are in a "wait-and-see" posture — the first mover with credible proof points will capture disproportionate market share', significance: 'CRITICAL', category: 'stakeholder' },
                  { insight: 'There is a narrative vacuum around "responsible AI automation" that no competitor has claimed', significance: 'HIGH', category: 'narrative' },
                  { insight: 'Gartner and Forrester analyst briefings within 48hrs of announcement increase media pickup by 3.2x', significance: 'HIGH', category: 'channel' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#212121] rounded-lg p-4 border border-[#2e2e2e]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded font-semibold ${item.significance === 'CRITICAL' ? 'bg-red-500/10 text-red-400' : 'bg-[#c75d3a]/10 text-[#c75d3a]'}`}>{item.significance}</span>
                      <span className="text-[#555555] text-xs uppercase">{item.category}</span>
                    </div>
                    <p className="text-[#e0e0e0] text-sm">{item.insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Four Research Stages Grid */}
            <div className="grid grid-cols-2 border-b border-[#2e2e2e]">
              {/* Stakeholder Intelligence */}
              <div className="p-6 border-r border-[#2e2e2e]">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-[#c75d3a]" />
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>STAKEHOLDER INTELLIGENCE</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e]">
                    <div className="text-white text-sm font-medium mb-1">Industry Analysts</div>
                    <div className="text-[#757575] text-xs mb-2">Psychology: Authority bias, early-adopter identity</div>
                    <div className="space-y-1">
                      <div className="text-[#9e9e9e] text-xs"><span className="text-[#c75d3a]">Values:</span> Exclusive access, being first to call trends</div>
                      <div className="text-[#9e9e9e] text-xs"><span className="text-[#c75d3a]">Fears:</span> Missing paradigm shifts, losing credibility</div>
                      <div className="text-[#9e9e9e] text-xs"><span className="text-[#c75d3a]">Triggers:</span> Embargo briefings, proprietary data access</div>
                    </div>
                  </div>
                  <div className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e]">
                    <div className="text-white text-sm font-medium mb-1">Enterprise Buyers</div>
                    <div className="text-[#757575] text-xs mb-2">Psychology: Loss aversion, social proof dependency</div>
                    <div className="space-y-1">
                      <div className="text-[#9e9e9e] text-xs"><span className="text-[#c75d3a]">Values:</span> ROI evidence, peer validation, risk mitigation</div>
                      <div className="text-[#9e9e9e] text-xs"><span className="text-[#c75d3a]">Fears:</span> Making wrong technology bet, vendor lock-in</div>
                      <div className="text-[#9e9e9e] text-xs"><span className="text-[#c75d3a]">Triggers:</span> Competitor adoption, analyst endorsement</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Narrative Landscape */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-[#c75d3a]" />
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NARRATIVE LANDSCAPE</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[#c75d3a] text-xs font-semibold mb-2">DOMINANT NARRATIVES</div>
                    <div className="space-y-2">
                      <div className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e]">
                        <div className="text-[#e0e0e0] text-sm">&quot;AI is transforming enterprise workflows&quot;</div>
                        <div className="text-[#757575] text-xs mt-1">Source: Major tech media • Resonance: HIGH</div>
                      </div>
                      <div className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e]">
                        <div className="text-[#e0e0e0] text-sm">&quot;Most AI investments failing to deliver ROI&quot;</div>
                        <div className="text-[#757575] text-xs mt-1">Source: Business press • Resonance: GROWING</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-green-400 text-xs font-semibold mb-2">NARRATIVE VACUUMS (OPPORTUNITIES)</div>
                    <div className="bg-[#212121] rounded-lg p-3 border border-green-500/20">
                      <div className="text-[#e0e0e0] text-sm">&quot;Responsible AI automation with measurable outcomes&quot;</div>
                      <div className="text-green-400 text-xs mt-1">No competitor has claimed this positioning</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Two Stages */}
            <div className="grid grid-cols-2">
              {/* Channel Intelligence */}
              <div className="p-6 border-r border-[#2e2e2e]">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-[#c75d3a]" />
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>CHANNEL INTELLIGENCE</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[#c75d3a] text-xs font-semibold mb-2">KEY JOURNALISTS</div>
                    <div className="space-y-1">
                      {[
                        { name: 'Sarah Chen', outlet: 'Reuters Tech', tier: 'TIER 1', beat: 'Enterprise AI' },
                        { name: 'Mike Park', outlet: 'Bloomberg', tier: 'TIER 1', beat: 'Tech M&A' },
                        { name: 'Lisa Torres', outlet: 'TechCrunch', tier: 'TIER 1', beat: 'AI startups' },
                      ].map((j, i) => (
                        <div key={i} className="flex items-center justify-between bg-[#212121] rounded p-2 border border-[#2e2e2e]">
                          <div>
                            <span className="text-white text-xs font-medium">{j.name}</span>
                            <span className="text-[#757575] text-xs ml-2">{j.outlet}</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-[#c75d3a]/10 text-[#c75d3a] text-[10px] rounded">{j.tier}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#757575] text-xs font-semibold mb-1">OPTIMAL TIMING</div>
                    <div className="text-[#9e9e9e] text-xs">Tue-Thu morning, 48hrs before competitor events</div>
                  </div>
                </div>
              </div>

              {/* Historical Patterns */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-[#c75d3a]" />
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>HISTORICAL PATTERNS</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e]">
                    <div className="text-white text-sm font-medium mb-1">Salesforce + Slack Announcement</div>
                    <div className="text-[#757575] text-xs mb-2">Similar context: Partnership positioning in crowded market</div>
                    <div className="text-[#9e9e9e] text-xs"><span className="text-[#c75d3a]">Key lesson:</span> Analyst pre-briefing 72hrs before drove 4x coverage</div>
                  </div>
                  <div className="bg-[#212121] rounded-lg p-3 border border-[#2e2e2e]">
                    <div className="text-white text-sm font-medium mb-1">Microsoft Copilot Launch</div>
                    <div className="text-[#757575] text-xs mb-2">Similar context: AI product differentiation</div>
                    <div className="text-[#9e9e9e] text-xs"><span className="text-[#c75d3a]">Key lesson:</span> Customer proof points at launch neutralized skepticism</div>
                  </div>
                  <div>
                    <div className="text-[#c75d3a] text-xs font-semibold mb-1">RISK FACTORS</div>
                    <div className="text-[#9e9e9e] text-xs">Over-promising on AI capabilities without demos invites backlash</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Footer */}
            <div className="px-6 py-4 bg-[#212121] border-t border-[#2e2e2e] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[#757575] text-xs">Completeness: <span className="text-green-400">94%</span></span>
                <span className="text-[#757575] text-xs">Confidence: <span className="text-green-400">92%</span></span>
                <span className="text-[#757575] text-xs">47 sources across 4 research stages</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-3 py-1.5 bg-[#3d3d3d] text-[#bdbdbd] text-xs rounded-lg">Refine Research</button>
                <button className="px-3 py-1.5 bg-[#c75d3a] text-white text-xs rounded-lg">Proceed to Strategy</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      </div>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <div className="landing-cta-decoration"></div>
        <div className="landing-cta-content">
          <h2 className="landing-cta-headline">Ready to seize <em>opportunities others miss?</em></h2>
          <div className="landing-cta-actions">
            <button className="landing-cta-btn" onClick={() => router.push('/auth/signup')}>Start Free Trial</button>
            <button className="landing-cta-btn landing-cta-btn-outline" onClick={() => router.push('/contact?demo=true')}>Schedule Demo</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-logo">
            <svg width="60" height="36" viewBox="0 0 80 48">
              <path d="M10 0 H80 V48 H0 L10 0 Z" fill="#faf9f7" />
              <text x="40" y="33" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="22" fontWeight="700" fill="#1a1a1a" letterSpacing="-0.5">NIV</text>
              <path d="M68 0 H80 V12 L68 0 Z" fill="#c75d3a" />
            </svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', alignSelf: 'flex-end' }}>
              <span style={{ color: 'var(--grey-600)', fontSize: '22px', fontWeight: 200, lineHeight: 1 }}>|</span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '12px', color: 'var(--grey-500)', letterSpacing: '1px' }}>by nivria</span>
            </div>
          </div>
          <div className="landing-footer-links">
            <a href="#" className="landing-footer-link">Pricing</a>
            <a href="/thoughts" className="landing-footer-link">Thoughts</a>
            <a href="/contact" className="landing-footer-link">Contact</a>
            <a href="#" className="landing-footer-link">Privacy</a>
          </div>
          <div className="landing-footer-copy">© 2025 Nivria</div>
        </div>
      </footer>
    </div>
  )
}
