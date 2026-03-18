import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getVertical, isValidVertical } from '@/lib/config/verticals'
import { generateVerticalJsonLd, generateBreadcrumbJsonLd } from '@/lib/utils/jsonld'
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
    .select('id, title, content_slug, content_type, meta_description, author_name, published_at, vertical, organization_id, cover_image_url')
    .eq('vertical', verticalSlug)
    .not('published_at', 'is', null)
    .is('unpublished_at', null)
    .order('published_at', { ascending: false })
    .limit(50)

  // Batch-fetch org names for all articles
  const orgIds = [...new Set((articles || []).map(a => a.organization_id).filter(Boolean))]
  const orgMap: Record<string, { name: string; slug: string }> = {}
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .in('id', orgIds)
    if (orgs) {
      for (const org of orgs) {
        orgMap[org.id] = { name: org.name, slug: org.slug }
      }
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const verticalJsonLd = generateVerticalJsonLd(vertical, articles?.length || 0)
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Nivria Media Network', url: 'https://nivria.ai' },
    { name: vertical.label, url: `https://nivria.ai/media/${verticalSlug}` },
  ])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111113',
      color: 'var(--white)',
      fontFamily: 'var(--font-primary)',
    }}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(verticalJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Grid responsive styles */}
      <style>{`
        .vertical-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        @media (max-width: 900px) {
          .vertical-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .vertical-grid {
            grid-template-columns: 1fr;
          }
        }
        .article-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }
        .article-card:hover {
          transform: translateY(-4px);
          border-color: rgba(199, 93, 58, 0.3);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(199, 93, 58, 0.15);
        }
      `}</style>

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
        maxWidth: '1200px',
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
          <div className="vertical-grid">
            {articles.map(article => {
              const isPressRelease = article.content_type === 'press-release'
              const hasCoverImage = !!article.cover_image_url

              return (
                <Link
                  key={article.id}
                  href={`/media/${verticalSlug}/${article.content_slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <article className="article-card">
                    {/* 16:9 Image Area */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '56.25%', /* 16:9 */
                      overflow: 'hidden',
                    }}>
                      {hasCoverImage ? (
                        <img
                          src={article.cover_image_url}
                          alt={article.title}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : isPressRelease ? (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '64px',
                        }}>
                          <span role="img" aria-label="announcement">📢</span>
                        </div>
                      ) : (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #2a1a14 0%, #1a1210 50%, #c75d3a22 100%)',
                        }} />
                      )}
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Badge + Date row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{
                          display: 'inline-block',
                          background: isPressRelease ? 'rgba(15, 52, 96, 0.3)' : 'rgba(199, 93, 58, 0.15)',
                          color: isPressRelease ? '#5b9bd5' : 'var(--accent)',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          textTransform: 'capitalize',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}>
                          {article.content_type.replace(/-/g, ' ')}
                        </span>
                        <span style={{
                          color: 'var(--grey-500)',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}>
                          {formatDate(article.published_at)}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '20px',
                        fontWeight: 400,
                        lineHeight: 1.3,
                        color: '#c75d3a',
                        marginBottom: '8px',
                      }}>
                        {article.title}
                      </h2>

                      {/* Description (2-line clamp) */}
                      {article.meta_description && (
                        <p style={{
                          color: 'var(--grey-400)',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          marginBottom: '12px',
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}>
                          {article.meta_description}
                        </p>
                      )}

                      {/* Author + Org */}
                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {article.author_name && (
                          <span style={{
                            color: 'var(--grey-500)',
                            fontSize: '12px',
                          }}>
                            By {article.author_name}
                          </span>
                        )}
                        {orgMap[article.organization_id] && (
                          <span style={{
                            color: 'var(--grey-500)',
                            fontSize: '11px',
                          }}>
                            {orgMap[article.organization_id].name}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      {/* About + Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 24px 24px',
        }}>
          {/* Breadcrumb nav */}
          <nav style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--grey-600)' }}>
            <Link href="/" style={{ color: 'var(--grey-500)', textDecoration: 'none' }}>Nivria</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--grey-400)' }}>{vertical.label}</span>
          </nav>

          <div style={{
            padding: '24px 0',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{
              color: 'var(--grey-500)',
              fontSize: '14px',
              lineHeight: 1.7,
              maxWidth: '560px',
            }}>
              Nivria Media Network is a platform where leading professionals share unique insights and announcements in {vertical.label.toLowerCase()}. Focused on the latest developments from industry leaders.
            </p>
          </div>

          <div style={{
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--grey-600)', fontSize: '13px' }}>
              &copy; {new Date().getFullYear()} Nivria
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
