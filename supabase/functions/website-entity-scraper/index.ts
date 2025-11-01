import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * WEBSITE SCRAPER (Simplified for Pipeline)
 *
 * Stage 1 of Schema Generation Pipeline
 *
 * Scrapes clean text/markdown content from key pages using Firecrawl v2 Scrape API.
 * Simple, fast, and reliable - just extracts text without complex LLM processing.
 * Entity extraction happens in the next stage (entity-extractor).
 */

interface ScraperRequest {
  organization_id: string
  organization_name: string
  website_url: string
  pages_to_scrape?: string[] // Optional: specific pages to scrape
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      website_url,
      pages_to_scrape
    }: ScraperRequest = await req.json()

    if (!organization_id || !organization_name || !website_url) {
      throw new Error('organization_id, organization_name, and website_url required')
    }

    console.log('🌐 Website Scraper Starting:', {
      organization_name,
      website_url
    })

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured')
    }

    let pagesToScrape: string[]

    // If pages provided, use them; otherwise use intelligent search
    if (pages_to_scrape && pages_to_scrape.length > 0) {
      pagesToScrape = pages_to_scrape
      console.log(`📄 Using ${pagesToScrape.length} provided URLs`)
    } else {
      console.log(`🔍 Using Firecrawl search to discover relevant pages on ${website_url}`)

      // Use Firecrawl search to intelligently find pages
      const domain = new URL(website_url).hostname
      const searches = [
        `site:${domain} about company`,
        `site:${domain} products services`,
        `site:${domain} team leadership`,
        `site:${domain} locations offices`,
        `site:${domain} contact`
      ]

      const discoveredUrls = new Set<string>([website_url]) // Always include homepage

      for (const searchQuery of searches) {
        try {
          const searchResponse = await fetch('https://api.firecrawl.dev/v2/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: searchQuery,
              limit: 3, // Top 3 results per search
              scrapeOptions: {
                formats: ['markdown']
              }
            })
          })

          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            if (searchData.success && searchData.data) {
              for (const result of searchData.data) {
                if (result.url && result.url.includes(domain)) {
                  discoveredUrls.add(result.url)
                }
              }
            }
          }
        } catch (error) {
          console.warn(`   ⚠️  Search failed for "${searchQuery}":`, error)
        }
      }

      pagesToScrape = Array.from(discoveredUrls)
      console.log(`✅ Discovered ${pagesToScrape.length} relevant pages via search`)
    }

    console.log(`📄 Scraping ${pagesToScrape.length} pages with Firecrawl v2...`)

    // Scrape each page in parallel using v2 API
    const scrapePromises = pagesToScrape.map(async (pageUrl) => {
      try {
        console.log(`   🔄 Scraping: ${pageUrl}`)

        const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ['markdown'],
            onlyMainContent: true  // v2 API uses this at root level, not in scrapeOptions
          })
        })

        // Log the raw response status
        console.log(`   📡 Response status for ${pageUrl}: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`   ❌ HTTP ${response.status} for ${pageUrl}:`, errorText)
          return null
        }

        const data = await response.json()

        // Log the full response structure for debugging
        console.log(`   📦 Response structure:`, {
          success: data.success,
          hasData: !!data.data,
          hasMarkdown: !!data.data?.markdown,
          markdownLength: data.data?.markdown?.length || 0,
          statusCode: data.data?.metadata?.statusCode,
          error: data.data?.metadata?.error,
          warning: data.warning
        })

        if (!data.success) {
          console.error(`   ❌ Firecrawl returned success=false for ${pageUrl}:`, {
            warning: data.warning,
            error: data.data?.metadata?.error
          })
          return null
        }

        if (!data.data) {
          console.warn(`   ⚠️  No data object in response from ${pageUrl}`)
          return null
        }

        const markdown = data.data.markdown || ''
        const title = data.data.metadata?.title || ''
        const statusCode = data.data.metadata?.statusCode
        const error = data.data.metadata?.error

        // CRITICAL: Skip 404 pages - they're not real content
        if (statusCode === 404 || error === 'Not Found') {
          console.warn(`   ⚠️  Skipping 404 page: ${pageUrl}`)
          return null
        }

        // Log suspicious content lengths
        if (markdown.length > 0 && markdown.length < 1000) {
          console.warn(`   ⚠️  Suspiciously short content (${markdown.length} chars) from ${pageUrl}`)
          console.warn(`   First 200 chars: ${markdown.substring(0, 200)}`)
        }

        if (markdown.length === 0) {
          console.warn(`   ⚠️  Empty content from ${pageUrl} (HTTP ${statusCode})`)
          return null
        }

        console.log(`   ✅ Got ${markdown.length} chars from ${pageUrl} (HTTP ${statusCode})`)

        return {
          url: pageUrl,
          title,
          markdown,
          html: data.data.html || '',
          metadata: data.data.metadata || {},
          success: true
        }
      } catch (error) {
        console.error(`   ✗ Exception scraping ${pageUrl}:`, error)
        return null
      }
    })

    const results = await Promise.all(scrapePromises)
    const successfulPages = results.filter(r => r !== null)

    console.log(`✅ Scraped ${successfulPages.length}/${pagesToScrape.length} pages successfully`)

    // Calculate total text length
    const totalTextLength = successfulPages.reduce((sum, page) => sum + (page.markdown?.length || 0), 0)

    if (totalTextLength < 1000) {
      console.warn(`⚠️  WARNING: Only got ${totalTextLength} total characters - pages may not exist or have no content`)
      console.warn(`   This will likely result in failed entity extraction`)
    } else {
      console.log(`📊 Total content: ${totalTextLength} characters`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        pages: successfulPages,
        summary: {
          total_pages: successfulPages.length,
          pages_attempted: pagesToScrape.length,
          total_text_length: totalTextLength,
          urls_scraped: successfulPages.map(p => p.url)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Website Scraper Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Infer key pages to scrape based on common patterns
 * Handles any URL format and extracts proper base URL
 */
function inferKeyPages(inputUrl: string): string[] {
  try {
    const url = new URL(inputUrl)

    // Extract base URL (protocol + hostname + path up to the directory)
    let baseUrl = `${url.protocol}//${url.hostname}`

    // If there's a path, use it as the base (but remove any file like index.html)
    if (url.pathname && url.pathname !== '/') {
      // Remove trailing slash and any file extensions
      let pathBase = url.pathname.replace(/\/[^\/]*\.(html|htm|php|asp|aspx|jsp)$/i, '')
      pathBase = pathBase.replace(/\/$/, '')
      baseUrl = `${baseUrl}${pathBase}`
    }

    console.log(`   🔧 Base URL extracted: ${baseUrl} (from input: ${inputUrl})`)

    return [
      inputUrl, // Original URL (homepage/main page)
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/team`,
      `${baseUrl}/leadership`,
      `${baseUrl}/products`,
      `${baseUrl}/services`,
      `${baseUrl}/solutions`,
      `${baseUrl}/locations`,
      `${baseUrl}/contact`
    ]
  } catch (error) {
    console.error(`   ⚠️  Failed to parse URL: ${inputUrl}, using as-is`)
    // Fallback to simple string manipulation if URL parsing fails
    const normalizedUrl = inputUrl.replace(/\/$/, '')
    return [
      normalizedUrl,
      `${normalizedUrl}/about`,
      `${normalizedUrl}/about-us`,
      `${normalizedUrl}/team`,
      `${normalizedUrl}/leadership`,
      `${normalizedUrl}/products`,
      `${normalizedUrl}/services`,
      `${normalizedUrl}/solutions`,
      `${normalizedUrl}/locations`,
      `${normalizedUrl}/contact`
    ]
  }
}
