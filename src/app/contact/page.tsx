'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'

function ContactFormContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: isDemo ? 'I would like to schedule a demo of NIV.' : ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setSubmitted(true)
    } catch (err) {
      setError('Failed to send message. Please try again or email us directly at hello@nivria.ai')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--charcoal)',
      color: 'var(--white)',
      fontFamily: 'var(--font-primary)'
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo variant="light" size="md" />
        </Link>
        <Link
          href="/"
          style={{
            color: 'var(--grey-400)',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Back to home
        </Link>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '80px 24px'
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(199, 93, 58, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c75d3a" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '32px',
              fontWeight: 400,
              marginBottom: '16px',
              color: 'var(--white)'
            }}>
              Message <em style={{ color: 'var(--burnt-orange)', fontStyle: 'italic' }}>sent</em>
            </h1>
            <p style={{ color: 'var(--grey-400)', marginBottom: '32px' }}>
              We'll get back to you within 24 hours.
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'var(--burnt-orange)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: '40px',
              fontWeight: 400,
              marginBottom: '16px',
              textAlign: 'center',
              color: 'var(--white)'
            }}>
              {isDemo ? (
                <>Schedule a <em style={{ color: 'var(--burnt-orange)', fontStyle: 'italic' }}>demo</em></>
              ) : (
                <>Get in <em style={{ color: 'var(--burnt-orange)', fontStyle: 'italic' }}>touch</em></>
              )}
            </h1>
            <p style={{
              color: 'var(--grey-400)',
              textAlign: 'center',
              marginBottom: '48px',
              fontSize: '16px'
            }}>
              {isDemo
                ? "See how NIV can transform your influence strategy."
                : "Have questions? We'd love to hear from you."
              }
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: 'var(--grey-300)',
                  marginBottom: '8px'
                }}>
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="Your name"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: 'var(--grey-300)',
                  marginBottom: '8px'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="you@company.com"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: 'var(--grey-300)',
                  marginBottom: '8px'
                }}>
                  Company <span style={{ color: 'var(--grey-500)' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="Your company"
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  color: 'var(--grey-300)',
                  marginBottom: '8px'
                }}>
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="How can we help?"
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  marginBottom: '24px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'var(--burnt-orange)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {submitting ? 'Sending...' : (isDemo ? 'Request Demo' : 'Send Message')}
              </button>
            </form>

            <p style={{
              textAlign: 'center',
              marginTop: '32px',
              color: 'var(--grey-500)',
              fontSize: '14px'
            }}>
              Or email us directly at{' '}
              <a href="mailto:hello@nivria.ai" style={{ color: 'var(--burnt-orange)' }}>
                hello@nivria.ai
              </a>
            </p>
          </>
        )}
      </main>
    </div>
  )
}

function ContactPageLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--charcoal)',
      color: 'var(--white)',
      fontFamily: 'var(--font-primary)'
    }}>
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo variant="light" size="md" />
        </Link>
      </header>
      <main style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '80px 24px',
        textAlign: 'center'
      }}>
        <div style={{ color: 'var(--grey-400)' }}>Loading...</div>
      </main>
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={<ContactPageLoading />}>
      <ContactFormContent />
    </Suspense>
  )
}
