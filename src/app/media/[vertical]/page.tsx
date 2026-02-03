import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getVertical, isValidVertical } from '@/lib/config/verticals'
import { Logo } from '@/components/ui/Logo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps {
  params: Promise<{ vertical: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vertical: verticalSlug } = await params
  const vertical = getVertical(verticalSlug)
  if (!vertical) return {}

  return {
    title: `${vertical.label} | Nivria Media Network`,
    description: vertical.description,
    openGraph: {
      title: `${vertical.label} | Nivria Media Network`,
      description: vertical.description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${vertical.label} | Nivria Media Network`,
      description: vertical.description,
    },
  }
}

export const revalidate = 60

export default async function VerticalPage({ params }: PageProps) {
  const { vertical: verticalSlug } = await params

  if (!isValidVertical(verticalSlug)) {
    notFound()
  }

  const vertical = getVertical(verticalSlug)!

  const { data: articles } = await supabase
    .from('content_library')
    .select('id, title, content_slug, content_type, meta_description, author_name, published_at, vertical, organization_id')
    .eq('vertical', verticalSlug)
    .not('published_at', 'is', null)
    .is('unpublished_at', null)
    .order('published_at', { ascending: false })
    .limit(50)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111113',
      color: 'var(--white)',
      fontFamily: 'var(--font-primary)',
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#faf9f7',
        position: 'relative',
        zIndex: 10,
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
            fontWeight: 500,
          }}
        >
          &larr; Back to home
        </Link>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '80px 24px',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '48px',
          fontWeight: 400,
          marginBottom: '16px',
          letterSpacing: '-1px',
          color: '#c75d3a',
        }}>
          {vertical.label}
        </h1>
        <p style={{
          color: 'var(--grey-400)',
          fontSize: '18px',
          marginBottom: '64px',
          lineHeight: 1.6,
        }}>
          {vertical.description}
        </p>

        {!articles || articles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{ color: 'var(--grey-500)', fontSize: '16px' }}>
              No articles yet. Check back soon.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {articles.map(article => (
              <article
                key={article.id}
                style={{
                  paddingBottom: '48px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Link
                  href={`/media/${verticalSlug}/${article.content_slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      color: 'var(--grey-500)',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}>
                      {formatDate(article.published_at)}
                    </span>
                    <span style={{ color: 'var(--grey-600)', margin: '0 12px' }}>|</span>
                    <span style={{
                      color: 'var(--accent)',
                      fontSize: '12px',
                    }}>
                      {article.content_type.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    fontWeight: 400,
                    marginBottom: '12px',
                    lineHeight: 1.3,
                    color: '#c75d3a',
                  }}>
                    {article.title}
                  </h2>
                  {article.meta_description && (
                    <p style={{
                      color: 'var(--grey-400)',
                      fontSize: '16px',
                      lineHeight: 1.7,
                      marginBottom: '16px',
                    }}>
                      {article.meta_description}
                    </p>
                  )}
                  {article.author_name && (
                    <span style={{
                      color: 'var(--grey-500)',
                      fontSize: '13px',
                    }}>
                      By {article.author_name}
                    </span>
                  )}
                  <span style={{
                    color: 'var(--accent)',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'block',
                    marginTop: '12px',
                  }}>
                    Read more &rarr;
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
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--grey-600)', fontSize: '13px' }}>
          &copy; {new Date().getFullYear()} Nivria
        </p>
      </footer>
    </div>
  )
}
