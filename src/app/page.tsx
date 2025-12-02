'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createAuthClient } from '@/lib/supabase/auth-client'

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

        /* ONE-CLICK SECTION */
        .landing-oneclick-section {
          background: var(--charcoal);
          padding: 100px 80px;
        }

        .landing-oneclick-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .landing-oneclick-eyebrow {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: var(--burnt-orange);
          font-weight: 600;
          margin-bottom: 14px;
        }

        .landing-oneclick-headline {
          font-family: var(--font-serif);
          font-size: 2.8rem;
          font-weight: 400;
          color: var(--white);
          margin-bottom: 14px;
        }

        .landing-oneclick-headline em {
          font-style: italic;
          color: var(--burnt-orange);
        }

        .landing-oneclick-subtext {
          font-size: 1rem;
          color: var(--grey-400);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .landing-oneclick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .landing-oneclick-card {
          background: var(--grey-900);
          border-radius: 14px;
          padding: 32px;
          display: flex;
          gap: 20px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .landing-oneclick-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.3);
        }

        .landing-oneclick-icon-wrap {
          width: 48px;
          height: 48px;
          background: var(--burnt-orange);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .landing-oneclick-icon-wrap.secondary {
          background: linear-gradient(135deg, var(--grey-700), var(--grey-600));
        }

        .landing-oneclick-card-content {
          flex: 1;
        }

        .landing-oneclick-card-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--burnt-orange);
          font-weight: 600;
          margin-bottom: 6px;
        }

        .landing-oneclick-card-title {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }

        .landing-oneclick-card-desc {
          font-size: 0.88rem;
          color: var(--grey-400);
          line-height: 1.55;
          margin-bottom: 20px;
        }

        .landing-oneclick-demo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          border: 1px solid var(--grey-700);
        }

        .landing-oneclick-demo-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--grey-800);
          border-radius: 5px;
        }

        .landing-oneclick-demo-badge {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, var(--burnt-orange), #e07b5a);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 0.7rem;
          font-weight: 700;
          color: white;
        }

        .landing-oneclick-demo-text {
          font-size: 0.8rem;
          color: var(--white);
          font-weight: 500;
        }

        .landing-oneclick-demo-arrow {
          color: var(--grey-500);
          flex-shrink: 0;
        }

        .landing-oneclick-demo-btn {
          padding: 8px 16px;
          background: var(--burnt-orange);
          border-radius: 5px;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--white);
          white-space: nowrap;
        }

        .landing-oneclick-demo-input {
          padding: 8px 12px;
          background: var(--grey-800);
          border-radius: 5px;
          font-size: 0.8rem;
          color: var(--grey-300);
          font-style: italic;
          flex: 1;
        }

        .landing-oneclick-demo-output {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--grey-300);
          font-weight: 500;
        }

        /* FEATURES SECTION */
        .landing-features-section {
          background: var(--white);
          padding: 120px 80px;
        }

        .landing-features-header {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 50px;
          margin-bottom: 60px;
          align-items: end;
        }

        .landing-features-count {
          font-family: var(--font-serif);
          font-size: 6rem;
          font-weight: 400;
          color: var(--burnt-orange);
          line-height: 1;
          opacity: 0.8;
        }

        .landing-features-intro h2 {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
          color: var(--charcoal);
        }

        .landing-features-intro p {
          font-size: 1rem;
          color: var(--grey-500);
          max-width: 480px;
        }

        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .landing-feature-item {
          padding: 32px;
          position: relative;
          background: #faf9f7;
          border: 1px solid var(--grey-200);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .landing-feature-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }

        .landing-feature-item.dark {
          background: var(--charcoal);
          color: var(--white);
          border: none;
        }

        .landing-feature-item.orange {
          background: var(--burnt-orange);
          color: var(--white);
          border: none;
        }

        .landing-feature-item.grey {
          background: var(--grey-900);
          color: var(--white);
          border: none;
        }

        .landing-feature-item.dark .landing-feature-title,
        .landing-feature-item.dark .landing-feature-desc,
        .landing-feature-item.grey .landing-feature-title,
        .landing-feature-item.grey .landing-feature-desc,
        .landing-feature-item.orange .landing-feature-title,
        .landing-feature-item.orange .landing-feature-desc {
          color: var(--white);
        }

        .landing-feature-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          margin-bottom: 10px;
        }

        .landing-feature-desc {
          font-size: 0.85rem;
          line-height: 1.55;
          opacity: 0.8;
        }

        /* GEO SECTION */
        .landing-geo-section {
          background: linear-gradient(180deg, var(--white) 0%, var(--grey-100) 100%);
          padding: 120px 80px;
        }

        .landing-geo-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .landing-geo-badge {
          display: inline-block;
          font-family: var(--font-display);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--burnt-orange);
          background: rgba(199, 93, 58, 0.1);
          padding: 8px 16px;
          border-radius: 20px;
          margin-bottom: 20px;
        }

        .landing-geo-headline {
          font-family: var(--font-serif);
          font-size: 3rem;
          font-weight: 400;
          color: var(--charcoal);
          margin-bottom: 16px;
        }

        .landing-geo-headline em {
          font-style: italic;
          color: var(--burnt-orange);
        }

        .landing-geo-subtext {
          font-size: 1.1rem;
          color: var(--grey-600);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .landing-geo-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .landing-geo-card {
          background: var(--white);
          border-radius: 16px;
          padding: 32px;
          border: 1px solid var(--grey-200);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .landing-geo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
        }

        .landing-geo-card.primary {
          background: var(--charcoal);
          border: none;
          grid-row: span 2;
          display: flex;
          flex-direction: column;
        }

        .landing-geo-card-stat {
          font-family: var(--font-display);
          font-size: 4rem;
          font-weight: 700;
          color: var(--burnt-orange);
          line-height: 1;
          margin-bottom: 8px;
        }

        .landing-geo-card-label {
          font-size: 1rem;
          color: var(--grey-400);
          margin-bottom: 24px;
        }

        .landing-geo-card-divider {
          height: 1px;
          background: var(--grey-700);
          margin-bottom: 24px;
        }

        .landing-geo-card.primary .landing-geo-card-title {
          color: var(--white);
        }

        .landing-geo-card.primary .landing-geo-card-desc {
          color: var(--grey-400);
        }

        .landing-geo-card-icon {
          width: 48px;
          height: 48px;
          background: rgba(199, 93, 58, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .landing-geo-card-title {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--charcoal);
          margin-bottom: 12px;
        }

        .landing-geo-card-desc {
          font-size: 0.9rem;
          color: var(--grey-600);
          line-height: 1.6;
        }

        .landing-geo-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: auto;
          padding-top: 24px;
        }

        .landing-geo-card-tags span {
          font-size: 0.7rem;
          font-weight: 500;
          padding: 6px 12px;
          background: var(--grey-800);
          border-radius: 6px;
          color: var(--grey-300);
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
          .landing-oneclick-section,
          .landing-features-section,
          .landing-geo-section,
          .landing-cta-section,
          .landing-footer {
            padding: 80px 40px;
          }

          .landing-oneclick-grid {
            grid-template-columns: 1fr;
          }

          .landing-features-grid {
            grid-template-columns: 1fr 1fr;
          }

          .landing-features-header {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .landing-geo-grid {
            grid-template-columns: 1fr;
          }

          .landing-geo-card.primary {
            grid-row: auto;
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

          .landing-features-grid {
            grid-template-columns: 1fr;
          }

          .landing-statement-section,
          .landing-oneclick-section,
          .landing-features-section,
          .landing-geo-section,
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

      {/* One-Click Section */}
      <section className="landing-oneclick-section">
        <div className="landing-oneclick-header">
          <div className="landing-oneclick-eyebrow">Zero Friction</div>
          <h2 className="landing-oneclick-headline">One click. <em>That&apos;s it.</em></h2>
          <p className="landing-oneclick-subtext">From signal detection to full campaign execution — we do the heavy lifting so you can focus on what matters.</p>
        </div>
        <div className="landing-oneclick-grid">
          <div className="landing-oneclick-card">
            <div className="landing-oneclick-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="landing-oneclick-card-content">
              <div className="landing-oneclick-card-label">Opportunities</div>
              <div className="landing-oneclick-card-title">Detect → Execute</div>
              <div className="landing-oneclick-card-desc">AI finds the opportunity. You click once. Full campaign materials generated — press releases, talking points, social content — ready to deploy.</div>
              <div className="landing-oneclick-demo">
                <div className="landing-oneclick-demo-box">
                  <span className="landing-oneclick-demo-badge">92</span>
                  <span className="landing-oneclick-demo-text">Q4 Earnings Window</span>
                </div>
                <svg className="landing-oneclick-demo-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <div className="landing-oneclick-demo-btn">Execute</div>
              </div>
            </div>
          </div>
          <div className="landing-oneclick-card">
            <div className="landing-oneclick-icon-wrap secondary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            </div>
            <div className="landing-oneclick-card-content">
              <div className="landing-oneclick-card-label">Campaigns</div>
              <div className="landing-oneclick-card-title">Brief → Deploy</div>
              <div className="landing-oneclick-card-desc">Describe your goal in plain English. The VECTOR engine generates a full multi-phase campaign with stakeholder-specific content.</div>
              <div className="landing-oneclick-demo">
                <div className="landing-oneclick-demo-input">&quot;Launch Q1 thought leadership&quot;</div>
                <svg className="landing-oneclick-demo-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <div className="landing-oneclick-demo-output">
                  <span>4-phase plan</span>
                  <span style={{ color: 'var(--grey-600)' }}>·</span>
                  <span>23 assets</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features-section">
        <div className="landing-features-header">
          <div className="landing-features-count">06</div>
          <div className="landing-features-intro">
            <h2>Capabilities that compound</h2>
            <p>Each module amplifies the others. Intelligence feeds strategy. Strategy drives execution. Execution generates intelligence.</p>
          </div>
        </div>
        <div className="landing-features-grid">
          <div className="landing-feature-item dark">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.7 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
            </svg>
            <h3 className="landing-feature-title">NIV Advisor</h3>
            <p className="landing-feature-desc">Your Neural Intelligence Vehicle. Conversational AI that routes to specialized functions.</p>
          </div>
          <div className="landing-feature-item">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.7 }}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <h3 className="landing-feature-title">Intelligence Pipeline</h3>
            <p className="landing-feature-desc">Five-stage signal processing with executive-level synthesis and opportunity detection.</p>
          </div>
          <div className="landing-feature-item orange">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.7 }}>
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
            <h3 className="landing-feature-title">VECTOR Campaigns</h3>
            <p className="landing-feature-desc">4 phases × 4 pillars. Multi-stakeholder psychological orchestration.</p>
          </div>
          <div className="landing-feature-item">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.7 }}>
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <h3 className="landing-feature-title">Content Studio</h3>
            <p className="landing-feature-desc">40+ content types with platform-specific formatting. Auto-generated from strategy.</p>
          </div>
          <div className="landing-feature-item grey">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.7 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3 className="landing-feature-title">Crisis Command</h3>
            <p className="landing-feature-desc">When seconds count. Real-time guidance, response generation, and coordination.</p>
          </div>
          <div className="landing-feature-item">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.7 }}>
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <h3 className="landing-feature-title">Memory Vault</h3>
            <p className="landing-feature-desc">Every insight preserved. Every pattern learned. Institutional knowledge that compounds.</p>
          </div>
        </div>
      </section>

      {/* GEO Section */}
      <section className="landing-geo-section">
        <div className="landing-geo-header">
          <div className="landing-geo-badge">Generative Engine Optimization</div>
          <h2 className="landing-geo-headline">Win the <em>AI battlefield</em></h2>
          <p className="landing-geo-subtext">Being visible to AI isn&apos;t enough. You need credibility too. We combine machine-friendly optimization with proven PR tactics.</p>
        </div>
        <div className="landing-geo-grid">
          <div className="landing-geo-card primary">
            <div className="landing-geo-card-stat">70%</div>
            <div className="landing-geo-card-label">of organizations don&apos;t have proper JSON-LD schemas</div>
            <div className="landing-geo-card-divider"></div>
            <div className="landing-geo-card-title">Automated Schema Enhancement</div>
            <div className="landing-geo-card-desc">We auto-generate and continuously optimize JSON-LD structured data so AI models understand your organization, leadership, products, and expertise.</div>
            <div className="landing-geo-card-tags">
              <span>Organization Schema</span>
              <span>Person Schema</span>
              <span>Article Schema</span>
              <span>FAQ Schema</span>
            </div>
          </div>
          <div className="landing-geo-card">
            <div className="landing-geo-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--burnt-orange)" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="landing-geo-card-title">Machine-Readable Presence</div>
            <div className="landing-geo-card-desc">Structured data, semantic markup, and entity relationships that make your brand visible to LLMs, search engines, and AI assistants.</div>
          </div>
          <div className="landing-geo-card">
            <div className="landing-geo-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--burnt-orange)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="landing-geo-card-title">PR-Driven Credibility</div>
            <div className="landing-geo-card-desc">Earned media, authoritative backlinks, and third-party validation that AI models weigh heavily when determining trustworthiness.</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <div className="landing-cta-decoration"></div>
        <div className="landing-cta-content">
          <h2 className="landing-cta-headline">Ready to seize <em>opportunities others miss?</em></h2>
          <div className="landing-cta-actions">
            <button className="landing-cta-btn" onClick={() => router.push('/auth/signup')}>Start Free Trial</button>
            <button className="landing-cta-btn landing-cta-btn-outline" onClick={() => router.push('/auth/login')}>Schedule Demo</button>
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
            <a href="#" className="landing-footer-link">Platform</a>
            <a href="#" className="landing-footer-link">Pricing</a>
            <a href="#" className="landing-footer-link">About</a>
            <a href="#" className="landing-footer-link">Contact</a>
            <a href="#" className="landing-footer-link">Privacy</a>
          </div>
          <div className="landing-footer-copy">© 2025 Nivria</div>
        </div>
      </footer>
    </div>
  )
}
