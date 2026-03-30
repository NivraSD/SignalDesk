'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { supabase } from '@/lib/supabase/client'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  author_name: string
  published_at: string
  tags: string[]
  featured_image_url: string | null
}

export default function ThoughtsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })

    setPosts(data || [])
    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111113',
      color: 'var(--white)',
      fontFamily: 'var(--font-primary)'
    }}>

      {/* Header - Light theme like homepage */}
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#faf9f7',
        position: 'relative',
        zIndex: 10
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo variant="dark" size="md" />
        </Link>
        <Link
          href="/"
          style={{
            color: 'var(--grey-600)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          ← Back to home
        </Link>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '80px 24px'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '48px',
          fontWeight: 400,
          marginBottom: '16px',
          letterSpacing: '-1px',
          color: '#c75d3a'
        }}>
          Thoughts
        </h1>
        <p style={{
          color: 'var(--grey-400)',
          fontSize: '18px',
          marginBottom: '64px',
          lineHeight: 1.6
        }}>
          Perspectives on strategic communications, AI, and the future of influence.
        </p>

        {loading ? (
          <div style={{ color: 'var(--grey-500)', textAlign: 'center', padding: '40px' }}>
            Loading...
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <p style={{ color: 'var(--grey-500)', fontSize: '16px' }}>
              No posts yet. Check back soon.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {posts.map(post => (
              <article
                key={post.id}
                style={{
                  paddingBottom: '48px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <Link
                  href={`/thoughts/${post.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      color: 'var(--grey-500)',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {formatDate(post.published_at)}
                    </span>
                    {post.tags && post.tags.length > 0 && (
                      <span style={{ color: 'var(--grey-600)', margin: '0 12px' }}>|</span>
                    )}
                    {post.tags?.map(tag => (
                      <span
                        key={tag}
                        style={{
                          color: 'var(--accent)',
                          fontSize: '12px',
                          marginRight: '8px'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    fontWeight: 400,
                    marginBottom: '12px',
                    lineHeight: 1.3,
                    transition: 'color 0.2s',
                    color: '#c75d3a'
                  }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p style={{
                      color: 'var(--grey-400)',
                      fontSize: '16px',
                      lineHeight: 1.7,
                      marginBottom: '16px'
                    }}>
                      {post.excerpt}
                    </p>
                  )}
                  <span style={{
                    color: 'var(--accent)',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    Read more →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '40px 48px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--grey-600)', fontSize: '13px' }}>
          © 2025 Nivria
        </p>
      </footer>
    </div>
  )
}
