// Source-Direct Intelligence Monitor
// Scrapes trusted news sources directly instead of relying on search APIs
// Uses Claude to filter for relevance before batch scraping

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CODE_VERSION = 'v2025-11-20-direct-scrape';

// Trusted news sources for commodity trading intelligence
const TRUSTED_SOURCES = [
  {
    name: 'Bloomberg Commodities',
    url: 'https://www.bloomberg.com/commodities',
    priority: 1,
    selector: 'article a[href*="/news/"]',
    dateSelector: 'time',
    topics: ['commodities', 'trading', 'energy', 'metals', 'agriculture']
  },
  {
    name: 'Reuters Commodities',
    url: 'https://www.reuters.com/markets/commodities/',
    priority: 1,
    selector: 'article a',
    dateSelector: 'time',
    topics: ['commodities', 'markets', 'trading']
  },
  {
    name: 'Financial Times Companies',
    url: 'https://www.ft.com/companies',
    priority: 2,
    selector: 'a.js-teaser-heading-link',
    dateSelector: 'time',
    topics: ['corporate', 'trading', 'commodities']
  },
  {
    name: 'Nikkei Asia Markets',
    url: 'https://asia.nikkei.com/Business/Markets',
    priority: 2,
    selector: 'article a',
    dateSelector: 'time',
    topics: ['asia', 'markets', 'trading', 'commodities']
  },
  {
    name: 'Wall Street Journal Commodities',
    url: 'https://www.wsj.com/market-data/commodities',
    priority: 2,
    selector: 'article a[href*="/articles/"]',
    dateSelector: 'time',
    topics: ['commodities', 'markets', 'trading']
  }
];

// MCP Client for Firecrawl
async function callMCP(tool: string, args: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-firecrawl`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      method: 'tools/call',
      params: {
        name: tool,
        arguments: args
      }
    })
  });

  if (!response.ok) {
    throw new Error(`MCP call failed: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}

// Call Claude for relevance filtering
async function filterWithClaude(articles: any[], context: string, discoveryTargets: any) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `You are filtering news articles for relevance to an organization's competitive intelligence needs.

ORGANIZATION: ${context}

KEY COMPETITORS: ${Array.from(discoveryTargets.competitors || []).slice(0, 20).join(', ')}

KEY STAKEHOLDERS: ${Array.from(discoveryTargets.stakeholders || []).slice(0, 20).join(', ')}

KEY PRODUCTS/SERVICES: ${Array.from(discoveryTargets.products || []).slice(0, 10).join(', ')}

ARTICLES TO FILTER (${articles.length} total):
${articles.map((a, i) => `${i + 1}. [${a.source}] ${a.title}\n   URL: ${a.url}\n   Published: ${a.published_date || 'unknown'}`).join('\n\n')}

TASK: Return ONLY the article numbers (1-${articles.length}) that are relevant to this organization's competitive intelligence. An article is relevant if it:
1. Mentions the organization or its competitors
2. Discusses markets/industries where they operate
3. Reports on stakeholders, partners, or suppliers
4. Covers relevant products, commodities, or services
5. Contains breaking news that could impact their business

CRITICAL:
- Focus on RECENT breaking news, not historical analysis
- Skip generic market reports unless they mention specific companies
- Skip opinion pieces and analysis of old events
- Prioritize articles with specific company mentions or market-moving news

Return ONLY a JSON array of relevant article numbers with scores:
[{"index": 1, "score": 0.95, "reason": "Brief reason"}, ...]`
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude filtering failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('⚠️  No JSON found in Claude response, returning all articles');
    return articles.map((a, i) => ({ ...a, relevance_score: 0.5, relevance_reason: 'Auto-included (filter failed)' }));
  }

  const filtered = JSON.parse(jsonMatch[0]);

  // Map back to articles with scores
  return filtered.map((f: any) => ({
    ...articles[f.index - 1],
    relevance_score: f.score,
    relevance_reason: f.reason
  }));
}

// Scrape a source listing page and extract article links
async function scrapeSouceListing(source: typeof TRUSTED_SOURCES[0]) {
  console.log(`\n📰 Scraping ${source.name}...`);

  try {
    // DIRECTLY scrape the listing page URL (no search!)
    const result = await callMCP('batch_scrape_articles', {
      articles: [{
        url: source.url,
        priority: source.priority,
        metadata: { source: source.name }
      }],
      formats: ['markdown'],
      maxTimeout: 20000
    });

    if (!result.results || result.results.length === 0 || !result.results[0].success) {
      console.warn(`   ⚠️  Failed to scrape ${source.name}`);
      return [];
    }

    const markdown = result.results[0].data?.markdown || '';
    console.log(`   📄 Scraped ${markdown.length} chars of content`);

    // Extract article links from markdown
    // Look for markdown links: [title](url) or HTML links in the markdown
    const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const matches = [...markdown.matchAll(linkPattern)];

    console.log(`   🔗 Found ${matches.length} links`);

    // Filter to only article URLs (not navigation, social, etc.)
    const articles = matches
      .map(match => ({
        title: match[1].trim(),
        url: match[2],
        source: source.name,
        source_priority: source.priority
      }))
      .filter((a: any) => {
        // Filter out navigation links, social links, etc.
        const url = a.url.toLowerCase();
        const isArticle = (
          (url.includes('/article') || url.includes('/news') || url.includes('/story') ||
           url.includes('/markets') || url.includes('/business') || url.includes('/commodities')) &&
          !url.includes('facebook.com') &&
          !url.includes('twitter.com') &&
          !url.includes('linkedin.com') &&
          !url.includes('/newsletter') &&
          !url.includes('/subscribe')
        );
        return isArticle && a.title.length > 10; // Title should be substantial
      });

    console.log(`   ✅ ${articles.length} article links extracted`);

    // For now, assume all articles from listing page are recent
    // We'll let Claude filter for actual relevance
    return articles;

  } catch (error) {
    console.error(`   ❌ Failed to scrape ${source.name}:`, error.message);
    return [];
  }
}

// Main monitoring function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, organization_name } = await req.json();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 SOURCE-DIRECT MONITORING: ${organization_name}`);
    console.log(`   Version: ${CODE_VERSION}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(80)}\n`);

    // Step 1: Fetch discovery targets from database
    console.log('📋 Step 1: Loading discovery targets...');
    const orgResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?id=eq.${organization_id}&select=company_profile`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    if (!orgResponse.ok) {
      throw new Error(`Failed to fetch organization: ${orgResponse.status}`);
    }

    const [org] = await orgResponse.json();
    const discoveryTargets = org?.company_profile?.discovery_targets || {
      competitors: [],
      stakeholders: [],
      products: []
    };

    console.log(`   ✅ Loaded targets: ${discoveryTargets.competitors?.length || 0} competitors, ${discoveryTargets.stakeholders?.length || 0} stakeholders`);

    // Step 2: Scrape all trusted sources in parallel
    console.log('\n📡 Step 2: Scraping trusted sources...');
    const sourcePromises = TRUSTED_SOURCES.map(source => scrapeSouceListing(source));
    const sourceResults = await Promise.all(sourcePromises);

    const allArticles = sourceResults.flat();
    console.log(`\n📊 Total articles collected: ${allArticles.length}`);

    if (allArticles.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No articles found from any source',
        metadata: { code_version: CODE_VERSION }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Claude-guided filtering
    console.log('\n🤖 Step 3: Filtering with Claude for relevance...');
    const filteredArticles = await filterWithClaude(
      allArticles,
      organization_name,
      discoveryTargets
    );

    console.log(`   ✅ ${filteredArticles.length} relevant articles identified`);

    if (filteredArticles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        total_articles: 0,
        articles: [],
        metadata: {
          code_version: CODE_VERSION,
          sources_scraped: TRUSTED_SOURCES.length,
          articles_scanned: allArticles.length,
          articles_filtered: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 4: Batch scrape relevant articles with structured extraction
    console.log('\n🔥 Step 4: Batch scraping relevant articles...');

    const extractionSchema = {
      companies_mentioned: {
        type: 'array',
        items: { type: 'string' },
        description: 'All companies mentioned in the article'
      },
      commodities_mentioned: {
        type: 'array',
        items: { type: 'string' },
        description: 'Commodities, products, or materials mentioned'
      },
      key_quotes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Important quotes from executives or analysts'
      },
      financial_metrics: {
        type: 'array',
        items: { type: 'string' },
        description: 'Numbers, percentages, financial data mentioned'
      },
      geographic_regions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Countries, regions, or cities mentioned'
      },
      summary: {
        type: 'string',
        description: 'One sentence summary of the key news'
      }
    };

    const scrapeResult = await callMCP('batch_scrape_articles', {
      articles: filteredArticles.map((a: any) => ({
        url: a.url,
        priority: a.relevance_score,
        metadata: {
          source: a.source,
          title: a.title,
          relevance_score: a.relevance_score,
          relevance_reason: a.relevance_reason
        }
      })),
      formats: ['markdown'],
      extractSchema: extractionSchema,
      maxTimeout: 15000
    });

    console.log(`   ✅ Scraped ${scrapeResult.stats.successful} articles successfully`);

    // Step 5: Format results
    const finalArticles = scrapeResult.results
      .filter((r: any) => r.success)
      .map((r: any) => ({
        url: r.url,
        title: r.metadata.title,
        source: r.metadata.source,
        content: r.data?.markdown || '',
        published_at: new Date().toISOString(), // Default to now for scraped articles
        relevance_score: r.metadata.relevance_score,
        relevance_reason: r.metadata.relevance_reason,
        extracted_data: r.extracted || null,
        search_tier: 'TRUSTED_SOURCE',
        from_source_direct: true
      }));

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ MONITORING COMPLETE`);
    console.log(`   Total articles: ${finalArticles.length}`);
    console.log(`   Average relevance: ${(finalArticles.reduce((sum: number, a: any) => sum + a.relevance_score, 0) / finalArticles.length).toFixed(2)}`);
    console.log(`${'='.repeat(80)}\n`);

    return new Response(JSON.stringify({
      success: true,
      total_articles: finalArticles.length,
      articles: finalArticles,
      metadata: {
        code_version: CODE_VERSION,
        sources_scraped: TRUSTED_SOURCES.length,
        articles_scanned: allArticles.length,
        articles_filtered: filteredArticles.length,
        articles_scraped: finalArticles.length,
        scrape_stats: scrapeResult.stats
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Source-direct monitoring error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      metadata: { code_version: CODE_VERSION }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
