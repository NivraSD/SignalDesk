'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (slug) {
      loadPost()
    }
  }, [slug])

  async function loadPost() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (error || !data) {
      setNotFound(true)
    } else {
      setPost(data)
    }
    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--charcoal)',
        color: 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: 'var(--grey-500)' }}>Loading...</p>
      </div>
    )
  }

  if (notFound || !post) {
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
          <Link
            href="/thoughts"
            style={{
              color: 'var(--grey-400)',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            Back to Thoughts
          </Link>
        </header>
        <main style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '80px 24px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '32px',
            marginBottom: '16px'
          }}>
            Post not found
          </h1>
          <p style={{ color: 'var(--grey-500)', marginBottom: '32px' }}>
            This post doesn't exist or has been removed.
          </p>
          <Link
            href="/thoughts"
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Back to all posts
          </Link>
        </main>
      </div>
    )
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
          href="/thoughts"
          style={{
            color: 'var(--grey-400)',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Back to Thoughts
        </Link>
      </header>

      {/* Article */}
      <article style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '80px 24px'
      }}>
        {/* Meta */}
        <div style={{ marginBottom: '24px' }}>
          <span style={{
            color: 'var(--grey-500)',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {formatDate(post.published_at)}
          </span>
          {post.author_name && (
            <>
              <span style={{ color: 'var(--grey-600)', margin: '0 12px' }}>|</span>
              <span style={{ color: 'var(--grey-500)', fontSize: '13px' }}>
                {post.author_name}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '42px',
          fontWeight: 400,
          lineHeight: 1.2,
          marginBottom: '32px',
          letterSpacing: '-1px',
          color: '#c75d3a'
        }}>
          {post.title}
        </h1>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            {post.tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-block',
                  background: 'rgba(199, 93, 58, 0.15)',
                  color: 'var(--accent)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  marginRight: '8px'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Featured Image */}
        {post.featured_image_url && (
          <div style={{
            marginBottom: '48px',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <img
              src={post.featured_image_url}
              alt={post.title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            color: 'var(--grey-300)',
            fontSize: '18px',
            lineHeight: 1.8,
            letterSpacing: '0.01em'
          }}
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />

        {/* Back Link */}
        <div style={{
          marginTop: '64px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Link
            href="/thoughts"
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Back to all posts
          </Link>
        </div>
      </article>

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

// Simple markdown-like formatting for content
function formatContent(content: string): string {
  return content
    // Paragraphs (double newlines)
    .split(/\n\n+/)
    .map(para => `<p style="margin-bottom: 1.5em">${para}</p>`)
    .join('')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--white); font-weight: 600">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Underline (pass through HTML <u> tags with styling)
    .replace(/<u>(.*?)<\/u>/g, '<u style="text-decoration: underline">$1</u>')
    // Headers
    .replace(/^## (.*$)/gm, '<h2 style="font-family: var(--font-serif); font-size: 28px; font-weight: 400; margin: 2em 0 1em; color: var(--accent)">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="font-family: var(--font-serif); font-size: 22px; font-weight: 400; margin: 1.5em 0 0.75em; color: var(--accent)">$1</h3>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--accent); text-decoration: underline" target="_blank" rel="noopener">$1</a>')
    // Single newlines to <br>
    .replace(/\n/g, '<br>')
}
