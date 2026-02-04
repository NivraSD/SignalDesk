const BASE_URL = 'https://nivria.ai'

const NIVRIA_PUBLISHER = {
  '@type': 'Organization',
  name: 'Nivria Media Network',
  url: BASE_URL,
  description: 'A platform where leading professionals share unique insights and announcements across key industries.',
}

interface ArticleData {
  title: string
  description?: string
  authorName?: string
  authorTitle?: string
  publishedAt: string
  canonicalUrl: string
  orgName?: string
  orgSlug?: string
  vertical?: string
  contentSignature?: string
  coverImageUrl?: string
}

/**
 * Generate a schema.org Article JSON-LD object for SEO.
 */
export function generateArticleJsonLd(article: ArticleData) {
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    datePublished: article.publishedAt,
    url: article.canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Nivria Media Network',
      url: BASE_URL,
    },
    sourceOrganization: NIVRIA_PUBLISHER,
  }

  if (article.description) {
    jsonLd.description = article.description
  }

  // Publisher — the contributing org, with Nivria as the platform
  if (article.orgName) {
    jsonLd.publisher = {
      '@type': 'Organization',
      name: article.orgName,
    }
    if (article.orgSlug) {
      jsonLd.publisher.url = `${BASE_URL}/org/${article.orgSlug}`
    }
  } else {
    jsonLd.publisher = NIVRIA_PUBLISHER
  }

  // Author — linked to publisher org if both exist
  if (article.authorName) {
    jsonLd.author = {
      '@type': 'Person',
      name: article.authorName,
    }
    if (article.authorTitle) {
      jsonLd.author.jobTitle = article.authorTitle
    }
    if (article.orgName) {
      jsonLd.author.affiliation = {
        '@type': 'Organization',
        name: article.orgName,
      }
    }
  }

  if (article.vertical) {
    jsonLd.articleSection = article.vertical
  }

  if (article.coverImageUrl) {
    jsonLd.image = article.coverImageUrl
  }

  return jsonLd
}

/**
 * CollectionPage JSON-LD for vertical listing pages.
 */
export function generateVerticalJsonLd(vertical: { slug: string; label: string; description: string }, articleCount: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${vertical.label} — Nivria Media Network`,
    description: vertical.description,
    url: `${BASE_URL}/media/${vertical.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Nivria Media Network',
      url: BASE_URL,
    },
    provider: NIVRIA_PUBLISHER,
    about: {
      '@type': 'Thing',
      name: vertical.label,
    },
    numberOfItems: articleCount,
  }
}

/**
 * Organization + CollectionPage JSON-LD for org profile pages.
 */
export function generateOrgProfileJsonLd(
  org: { name: string; slug: string; industry?: string; description?: string },
  articleCount: number,
) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      url: `${BASE_URL}/org/${org.slug}`,
      ...(org.description && { description: org.description }),
      ...(org.industry && { industry: org.industry }),
      memberOf: {
        '@type': 'Organization',
        name: 'Nivria Media Network',
        url: BASE_URL,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${org.name} — Published Content`,
      url: `${BASE_URL}/org/${org.slug}`,
      description: org.description || `Insights and announcements from ${org.name}`,
      provider: {
        '@type': 'Organization',
        name: org.name,
        url: `${BASE_URL}/org/${org.slug}`,
      },
      isPartOf: {
        '@type': 'WebSite',
        name: 'Nivria Media Network',
        url: BASE_URL,
      },
      numberOfItems: articleCount,
    },
  ]
}

/**
 * BreadcrumbList JSON-LD.
 */
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
