interface ArticleData {
  title: string
  description?: string
  authorName?: string
  authorTitle?: string
  publishedAt: string
  canonicalUrl: string
  orgName?: string
  vertical?: string
  contentSignature?: string
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

  if (article.authorName) {
    jsonLd.author = {
      '@type': 'Person',
      name: article.authorName,
    }
    if (article.authorTitle) {
      jsonLd.author.jobTitle = article.authorTitle
    }
  }

  if (article.orgName) {
    jsonLd.publisher = {
      '@type': 'Organization',
      name: article.orgName,
    }
  }

  if (article.vertical) {
    jsonLd.articleSection = article.vertical
  }

  return jsonLd
}
