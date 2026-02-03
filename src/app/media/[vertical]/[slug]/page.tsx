import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getVertical, isValidVertical } from '@/lib/config/verticals'
import { generateArticleJsonLd } from '@/lib/utils/jsonld'
import { Logo } from '@/components/ui/Logo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps {
  params: Promise<{ vertical: string; slug: string }>
}

async function getArticle(verticalSlug: string, slug: string) {
  // Fetch article without join first (join can fail if FK isn't set up)
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('vertical', verticalSlug)
    .eq('content_slug', slug)
    .not('published_at', 'is', null)
    .is('unpublished_at', null)
    .single()

  if (error) {
    console.error('Article query error:', error)
    return null
  }

  if (!data) return null

  // Fetch org separately
  let org = null
  if (data.organization_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, slug, industry, description')
      .eq('id', data.organization_id)
      .single()
    org = orgData
  }

  return { ...data, organizations: org }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vertical: verticalSlug, slug } = await params
  const article = await getArticle(verticalSlug, slug)
  if (!article) return {}

  const vertical = getVertical(verticalSlug)
  const title = article.title
  const orgName = article.organizations?.name
  const description = article.meta_description || `${title}${orgName ? ` by ${orgName}` : ''} — ${vertical?.label || verticalSlug} | Nivria Media Network`

  const ogImages = article.cover_image_url ? [{ url: article.cover_image_url }] : undefined

  return {
    title: `${title} | ${vertical?.label || verticalSlug} | Nivria`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.published_at,
      authors: article.author_name ? [article.author_name] : undefined,
      section: vertical?.label,
      url: article.canonical_url,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages,
    },
    alternates: {
      canonical: article.canonical_url,
    },
  }
}

export const revalidate = 60

export default async function ArticlePage({ params }: PageProps) {
  const { vertical: verticalSlug, slug } = await params

  if (!isValidVertical(verticalSlug)) {
    notFound()
  }

  const article = await getArticle(verticalSlug, slug)
  if (!article) {
    notFound()
  }

  const vertical = getVertical(verticalSlug)!
  const org = article.organizations as { name: string; slug: string; industry?: string; description?: string } | null

  // Build JSON-LD
  const jsonLd = generateArticleJsonLd({
    title: article.title,
    description: article.meta_description || undefined,
    authorName: article.author_name || undefined,
    authorTitle: article.author_title || undefined,
    publishedAt: article.published_at,
    canonicalUrl: article.canonical_url || `/media/${verticalSlug}/${slug}`,
    orgName: org?.name,
    orgSlug: org?.slug,
    vertical: vertical.label,
    contentSignature: article.content_signature || undefined,
    coverImageUrl: article.cover_image_url || undefined,
  })

  // Get related articles
  const { data: relatedArticles } = await supabase
    .from('content_library')
    .select('id, title, content_slug, vertical, published_at, author_name')
    .eq('vertical', verticalSlug)
    .not('published_at', 'is', null)
    .is('unpublished_at', null)
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Extract content body - handle both string and object formats
  const contentBody = typeof article.content === 'string'
    ? article.content
    : article.content?.body || article.content?.text || article.content?.content || JSON.stringify(article.content, null, 2)

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          href={`/media/${verticalSlug}`}
          style={{
            color: 'var(--grey-600)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          &larr; Back to {vertical.label}
        </Link>
      </header>

      {/* Article */}
      <article style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '80px 24px',
      }}>
        {/* Meta */}
        <div style={{ marginBottom: '24px' }}>
          <span style={{
            color: 'var(--grey-500)',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            {formatDate(article.published_at)}
          </span>
          {article.author_name && (
            <>
              <span style={{ color: 'var(--grey-600)', margin: '0 12px' }}>|</span>
              <span style={{ color: 'var(--grey-500)', fontSize: '13px' }}>
                {article.author_name}
                {article.author_title && `, ${article.author_title}`}
              </span>
            </>
          )}
          {org?.name && (
            <>
              <span style={{ color: 'var(--grey-600)', margin: '0 12px' }}>|</span>
              <Link
                href={`/org/${org.slug}`}
                style={{
                  color: 'var(--grey-400)',
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                {org.name}
              </Link>
            </>
          )}
          <span style={{ color: 'var(--grey-600)', margin: '0 12px' }}>|</span>
          <Link
            href={`/media/${verticalSlug}`}
            style={{
              color: 'var(--accent)',
              fontSize: '12px',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {vertical.label}
          </Link>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '42px',
          fontWeight: 400,
          lineHeight: 1.2,
          marginBottom: '32px',
          letterSpacing: '-1px',
          color: '#c75d3a',
        }}>
          {article.title}
        </h1>

        {/* Hero Image */}
        {article.cover_image_url ? (
          <div style={{
            marginBottom: '32px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <img
              src={article.cover_image_url}
              alt={article.title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                aspectRatio: '16/9',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : article.content_type === 'press-release' ? (
          <div style={{
            marginBottom: '32px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid rgba(91, 155, 213, 0.2)',
          }}>
            <span style={{ fontSize: '40px' }} role="img" aria-label="announcement">📢</span>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#5b9bd5',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Press Release
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                Official announcement
              </div>
            </div>
          </div>
        ) : null}

        {/* Content type badge */}
        <div style={{ marginBottom: '48px' }}>
          <span style={{
            display: 'inline-block',
            background: article.content_type === 'press-release' ? 'rgba(15, 52, 96, 0.3)' : 'rgba(199, 93, 58, 0.15)',
            color: article.content_type === 'press-release' ? '#5b9bd5' : 'var(--accent)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            textTransform: 'capitalize',
          }}>
            {article.content_type.replace(/-/g, ' ')}
          </span>
        </div>

        {/* Content Body */}
        <style>{`
          .article-content h2 { color: #c75d3a !important; font-size: 28px; font-weight: 400; margin: 2em 0 1em; font-family: var(--font-serif); }
          .article-content h3 { color: #c75d3a !important; font-size: 22px; font-weight: 400; margin: 1.5em 0 0.75em; font-family: var(--font-serif); }
          .article-content a { color: #c75d3a !important; text-decoration: underline; }
          .article-content img { max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px; }
          .article-content ul, .article-content ol { margin: 1em 0; padding-left: 2em; }
          .article-content li { margin: 0.5em 0; }
        `}</style>
        <div
          className="article-content"
          style={{
            color: 'var(--grey-300)',
            fontSize: '18px',
            lineHeight: 1.8,
            letterSpacing: '0.01em',
          }}
          dangerouslySetInnerHTML={{ __html: formatContent(contentBody) }}
        />

        {/* Provenance Badge */}
        {article.content_signature && (
          <div style={{
            marginTop: '48px',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--grey-600)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '4px',
            }}>
              Content Fingerprint
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--grey-500)',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}>
              {article.content_signature}
            </div>
          </div>
        )}

        {/* Organization link */}
        {org?.slug && (
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Link
              href={`/org/${org.slug}`}
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              More from {org.name} &rarr;
            </Link>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div style={{
            marginTop: '48px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '22px',
              fontWeight: 400,
              color: '#c75d3a',
              marginBottom: '24px',
            }}>
              Related
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {relatedArticles.map(related => (
                <Link
                  key={related.id}
                  href={`/media/${related.vertical}/${related.content_slug}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: 'var(--white)',
                    marginBottom: '4px',
                  }}>
                    {related.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--grey-500)' }}>
                    {related.author_name && `${related.author_name} · `}
                    {formatDate(related.published_at)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div style={{
          marginTop: '64px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Link
            href={`/media/${verticalSlug}`}
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            &larr; Back to {vertical.label}
          </Link>
        </div>
      </article>

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

function formatContent(content: string): string {
  return content
    .split(/\n\n+/)
    .map(para => `<p style="margin-bottom: 1.5em">${para}</p>`)
    .join('')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--white); font-weight: 600">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/<u>(.*?)<\/u>/g, '<u style="text-decoration: underline">$1</u>')
    .replace(/^## (.*$)/gm, '<h2 style="font-family: var(--font-serif); font-size: 28px; font-weight: 400; margin: 2em 0 1em; color: var(--accent)">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="font-family: var(--font-serif); font-size: 22px; font-weight: 400; margin: 1.5em 0 0.75em; color: var(--accent)">$1</h3>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--accent); text-decoration: underline" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>')
}
