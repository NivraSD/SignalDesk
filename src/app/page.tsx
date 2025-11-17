'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { Brain, Target, Shield, Database, Sparkles, TrendingUp, Zap, Globe, AlertTriangle, ArrowUpRight } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--charcoal)' }}>
        <div style={{ color: 'var(--pearl)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--charcoal)', color: 'var(--pearl)' }}>
      {/* Navigation - Asymmetric */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md" style={{
        background: 'rgba(26, 26, 26, 0.95)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="offset-container">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="px-6 py-2 flex items-center justify-center" style={{
                background: 'var(--mauve)',
                clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)'
              }}>
                <span className="text-xl font-light tracking-tight" style={{ color: 'var(--pearl)' }}>Nivria</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm font-light tracking-wide transition-colors"
                style={{ color: 'var(--pearl)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-6 py-2.5 text-sm font-light tracking-wide border-glow"
                style={{
                  background: 'var(--mauve)',
                  color: 'var(--pearl)'
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Asymmetric Layout */}
      <section className="pt-40 pb-32 offset-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Content - 70% */}
          <div className="lg:col-span-8">
            <div className="mb-8 inline-block px-4 py-1.5 text-xs font-light tracking-widest uppercase" style={{
              border: '1px solid var(--border-accent)',
              color: 'var(--mauve)'
            }}>
              Autonomous Intelligence → Strategy → Execution
            </div>
            <h1 className="mb-8 font-light" style={{ color: 'var(--pearl)' }}>
              Your Always-On<br />Strategic Partner
            </h1>
            <div className="w-16 h-0.5 mb-8" style={{ background: 'var(--mauve)' }}></div>
            <p className="text-lg md:text-xl font-light mb-12 max-w-2xl leading-relaxed" style={{
              color: 'var(--pearl)',
              letterSpacing: '-0.01em'
            }}>
              Nivria is an autonomous operating system that orchestrates influence across human and machine—creating
              novel strategies, executing campaigns with one click, and learning from every interaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/auth/signup')}
                className="group px-8 py-4 text-sm font-light tracking-wide border-glow inline-flex items-center justify-center"
                style={{
                  background: 'var(--mauve)',
                  color: 'var(--pearl)'
                }}
              >
                Start Creating
                <ArrowUpRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="px-8 py-4 text-sm font-light tracking-wide transition-all inline-flex items-center justify-center"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--pearl)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-accent)'
                  e.currentTarget.style.background = 'var(--charcoal-light)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                See It In Action
              </button>
            </div>
          </div>

          {/* Aside - 30% */}
          <div className="lg:col-span-4 mt-0 lg:mt-6">
            <div className="space-y-6">
              <div className="p-6 border-glow" style={{ background: 'var(--charcoal-light)' }}>
                <div className="text-4xl font-light mb-2" style={{ color: 'var(--mauve)' }}>24/7</div>
                <div className="text-sm font-light" style={{ color: 'var(--pearl)' }}>
                  Monitoring for risks and opportunities with action plans automatically generated when detected
                </div>
              </div>
              <div className="p-6 border-glow" style={{ background: 'var(--charcoal-light)' }}>
                <div className="text-4xl font-light mb-2" style={{ color: 'var(--mauve)' }}>1-Click</div>
                <div className="text-sm font-light" style={{ color: 'var(--pearl)' }}>
                  Execute full campaigns—from strategy to content—with minimal effort
                </div>
              </div>
              <div className="p-6 border-glow" style={{ background: 'var(--charcoal-light)' }}>
                <div className="text-4xl font-light mb-2" style={{ color: 'var(--mauve)' }}>Learning</div>
                <div className="text-sm font-light" style={{ color: 'var(--pearl)' }}>
                  Attributes success, leverages organizational context, and continuously improves from every campaign
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Diagonal Divide */}
      <section className="py-32 diagonal-divide" style={{ background: 'var(--charcoal-light)' }}>
        <div className="offset-container">
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5">
                <h2 className="font-light mb-4" style={{ color: 'var(--pearl)' }}>
                  Intelligence → Strategy → Execution
                </h2>
              </div>
              <div className="lg:col-span-7">
                <p className="text-lg font-light" style={{ color: 'var(--pearl)' }}>
                  A complete autonomous loop. Nivria monitors, strategizes, creates, executes, and learns—all with minimal input from you.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-8 border-glow group" style={{ background: 'var(--charcoal)' }}>
              <Sparkles className="w-8 h-8 mb-6" style={{ color: 'var(--mauve)' }} />
              <h3 className="text-xl font-light mb-3" style={{ color: 'var(--pearl)' }}>VECTOR Strategies</h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                Novel, data-driven campaign strategies created autonomously. Each one unique,
                optimized for maximum impact across human and machine audiences.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 border-glow group" style={{ background: 'var(--charcoal)' }}>
              <Zap className="w-8 h-8 mb-6" style={{ color: 'var(--mauve)' }} />
              <h3 className="text-xl font-light mb-3" style={{ color: 'var(--pearl)' }}>One-Click Execution</h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                From strategy to fully-executed campaigns in seconds. Content, media lists,
                pitches, social posts—everything you need, automatically created.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 border-glow group" style={{ background: 'var(--charcoal)' }}>
              <Globe className="w-8 h-8 mb-6" style={{ color: 'var(--mauve)' }} />
              <h3 className="text-xl font-light mb-3" style={{ color: 'var(--pearl)' }}>Human-Machine Nexus</h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                Orchestrate influence across traditional PR, AI-powered channels, and emerging
                platforms. One strategy, infinite reach.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 border-glow group" style={{ background: 'var(--charcoal)' }}>
              <Brain className="w-8 h-8 mb-6" style={{ color: 'var(--mauve)' }} />
              <h3 className="text-xl font-light mb-3" style={{ color: 'var(--pearl)' }}>Autonomous Learning</h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                Continuous improvement from every campaign. Nivria learns what works,
                adapts to your voice, and gets smarter with each execution.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 border-glow group" style={{ background: 'var(--charcoal)' }}>
              <Target className="w-8 h-8 mb-6" style={{ color: 'var(--mauve)' }} />
              <h3 className="text-xl font-light mb-3" style={{ color: 'var(--pearl)' }}>Intelligent Monitoring</h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                Always-on intelligence gathering across news, social, and emerging platforms.
                Opportunities surface automatically, ready for instant action.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 border-glow group" style={{ background: 'var(--charcoal)' }}>
              <Database className="w-8 h-8 mb-6" style={{ color: 'var(--mauve)' }} />
              <h3 className="text-xl font-light mb-3" style={{ color: 'var(--pearl)' }}>Institutional Memory</h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                Every insight, strategy, and outcome preserved and accessible. Your organizational
                knowledge evolves into a strategic asset.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases - Asymmetric */}
      <section className="py-32 offset-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5">
            <h2 className="font-light mb-6" style={{ color: 'var(--pearl)' }}>
              Built for Strategic Leaders
            </h2>
            <div className="w-24 h-0.5 mb-6" style={{ background: 'var(--mauve)' }}></div>
            <p className="text-sm font-light" style={{ color: 'var(--pearl)' }}>
              Trusted by those who create the future
            </p>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="border-glow p-8 group" style={{ background: 'var(--charcoal-light)' }}>
                <Sparkles className="w-10 h-10 mb-4" style={{ color: 'var(--mauve)' }} />
                <h3 className="text-2xl font-light mb-3" style={{ color: 'var(--pearl)' }}>Visionary Founders</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                  Launch and scale narratives with minimal resources. From stealth to category leadership,
                  Nivria executes the strategy you envision.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="border-glow p-8 group" style={{ background: 'var(--charcoal-light)' }}>
                  <TrendingUp className="w-10 h-10 mb-4" style={{ color: 'var(--mauve)' }} />
                  <h3 className="text-2xl font-light mb-3" style={{ color: 'var(--pearl)' }}>Communications Leaders</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                    Multiply your team's impact. Execute sophisticated campaigns across every channel
                    without expanding headcount.
                  </p>
                </div>

                <div className="border-glow p-8 group" style={{ background: 'var(--charcoal-light)' }}>
                  <Brain className="w-10 h-10 mb-4" style={{ color: 'var(--mauve)' }} />
                  <h3 className="text-2xl font-light mb-3" style={{ color: 'var(--pearl)' }}>Strategic Advisors</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
                    Deliver unprecedented value to clients. Novel strategies and complete execution
                    at a fraction of traditional timelines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Diagonal Reverse */}
      <section className="py-32 diagonal-divide-reverse" style={{
        background: 'linear-gradient(135deg, var(--mauve-light) 0%, var(--mauve) 100%)',
        borderTop: '1px solid var(--border)'
      }}>
        <div className="offset-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <h2 className="font-light mb-6" style={{ color: 'var(--pearl)' }}>
                Ready to Create Without Limits?
              </h2>
              <p className="text-lg font-light mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Join visionaries using Nivria to shape narratives across every platform—with minimal effort.
              </p>
              <button
                onClick={() => router.push('/auth/signup')}
                className="group px-8 py-4 text-sm font-light tracking-wide inline-flex items-center shadow-nivria"
                style={{
                  background: 'var(--pearl)',
                  color: 'var(--charcoal)'
                }}
              >
                Start Creating Now
                <ArrowUpRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
              <p className="text-xs font-light mt-4" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 offset-container" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center" style={{
                background: 'var(--mauve)',
                clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)'
              }}>
                <Zap className="w-4 h-4" style={{ color: 'var(--pearl)' }} />
              </div>
              <span className="text-xl font-light" style={{ color: 'var(--pearl)' }}>Nivria</span>
            </div>
            <p className="text-sm font-light leading-relaxed" style={{ color: 'var(--pearl)' }}>
              Autonomous operating system for visionary leaders.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-light mb-4 text-sm tracking-wider uppercase" style={{ color: 'var(--pearl)' }}>Product</h4>
            <ul className="space-y-3 text-sm font-light" style={{ color: 'var(--pearl)' }}>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Features</a></li>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Pricing</a></li>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Use Cases</a></li>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Documentation</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-light mb-4 text-sm tracking-wider uppercase" style={{ color: 'var(--pearl)' }}>Company</h4>
            <ul className="space-y-3 text-sm font-light" style={{ color: 'var(--pearl)' }}>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>About</a></li>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Blog</a></li>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Careers</a></li>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Contact</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-light mb-4 text-sm tracking-wider uppercase" style={{ color: 'var(--pearl)' }}>Legal</h4>
            <ul className="space-y-3 text-sm font-light" style={{ color: 'var(--pearl)' }}>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Privacy</a></li>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Terms</a></li>
              <li><a href="#" className="transition-colors" style={{ color: 'var(--pearl)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mauve)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pearl)'}>Security</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 text-xs font-light" style={{
          borderTop: '1px solid var(--border)',
          color: 'var(--pearl)'
        }}>
          <p>&copy; 2025 Nivria. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
