import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Logo } from '@/components/ui/Logo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getOrg(slug: string) {
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug, industry, description')
    .eq('slug', slug)
    .single()

  return data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const org = await getOrg(slug)
  if (!org) return {}

  const description = org.description || `Published content from ${org.name}`

  return {
    title: `${org.name} | Nivria Media Network`,
    description,
    openGraph: {
      title: `${org.name} | Nivria Media Network`,
      description,
      type: 'profile',
    },
  }
}

export const revalidate = 60

export default async function OrgPage({ params }: PageProps) {
  const { slug } = await params
  const org = await getOrg(slug)

  if (!org) {
    notFound()
  }

  const { data: articles } = await supabase
    .from('content_library')
    .select('id, title, content_slug, content_type, meta_description, author_name, published_at, vertical')
    .eq('organization_id', org.id)
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
          marginBottom: '8px',
          letterSpacing: '-1px',
          color: '#c75d3a',
        }}>
          {org.name}
        </h1>

        {org.industry && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(199, 93, 58, 0.15)',
              color: 'var(--accent)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              textTransform: 'capitalize',
            }}>
              {org.industry}
            </span>
          </div>
        )}

        {org.description && (
          <p style={{
            color: 'var(--grey-400)',
            fontSize: '18px',
            marginBottom: '64px',
            lineHeight: 1.6,
          }}>
            {org.description}
          </p>
        )}

        {!org.description && (
          <div style={{ marginBottom: '64px' }} />
        )}

        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '24px',
          fontWeight: 400,
          color: 'var(--grey-300)',
          marginBottom: '32px',
        }}>
          Published Content
        </h2>

        {!articles || articles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{ color: 'var(--grey-500)', fontSize: '16px' }}>
              No published content yet.
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
                  href={`/${article.vertical}/${article.content_slug}`}
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
                      textTransform: 'capitalize',
                    }}>
                      {article.vertical}
                    </span>
                    <span style={{ color: 'var(--grey-600)', margin: '0 12px' }}>|</span>
                    <span style={{
                      color: 'var(--grey-500)',
                      fontSize: '12px',
                      textTransform: 'capitalize',
                    }}>
                      {article.content_type.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    fontWeight: 400,
                    marginBottom: '12px',
                    lineHeight: 1.3,
                    color: '#c75d3a',
                  }}>
                    {article.title}
                  </h3>
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
