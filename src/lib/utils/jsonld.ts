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
  }

  if (article.description) {
    jsonLd.description = article.description
  }

  // Publisher (organization) — always include if available
  if (article.orgName) {
    jsonLd.publisher = {
      '@type': 'Organization',
      name: article.orgName,
    }
    if (article.orgSlug) {
      jsonLd.publisher.url = `https://nivria.ai/org/${article.orgSlug}`
    }
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
