// Batch Scraper V5 - Sitemap Orchestrator
// Discovers article URLs using news sitemaps from robots.txt
// Stores URLs in raw_articles for later content extraction

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Auth cookies for premium sources
const AUTH_COOKIES: Record<string, string | undefined> = {
  'Bloomberg': Deno.env.get('BLOOMBERG_AUTH_COOKIE'),
  'Wall Street Journal': Deno.env.get('WSJ_AUTH_COOKIE'),
  'WSJ': Deno.env.get('WSJ_AUTH_COOKIE'),
  'Financial Times': Deno.env.get('FT_AUTH_COOKIE'),
  'New York Times': Deno.env.get('NYTIMES_AUTH_COOKIE'),
  'NYTimes': Deno.env.get('NYTIMES_AUTH_COOKIE'),
};

// Standard User-Agent to avoid being blocked
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface Source {
  id: string;
  source_name: string;
  source_url: string;
  monitor_method: string;
  monitor_config?: { sitemap_url?: string };
  industries: string[];
  tier: number;
  last_successful_scrape?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  console.log('🗺️  BATCH SCRAPER V5 - SITEMAP ORCHESTRATOR');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    const body = await req.json().catch(() => ({}));
    const maxSources = body.max_sources || 50;

    // Create batch run record
    await supabase
      .from('batch_scrape_runs')
      .insert({
        id: runId,
        run_type: 'sitemap_discovery',
        status: 'running',
        triggered_by: req.headers.get('user-agent') || 'manual'
      });

    // Get active sitemap sources, prioritize least recently scraped
    const { data: sources, error: sourcesError } = await supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .eq('monitor_method', 'sitemap')
      .order('last_successful_scrape', { ascending: true, nullsFirst: true })
      .order('tier', { ascending: true })
      .limit(maxSources);

    if (sourcesError) throw new Error(`Failed to load sources: ${sourcesError.message}`);

    console.log(`📊 Found ${sources?.length || 0} active sitemap sources\n`);

    let totalArticles = 0;
    let newArticles = 0;
    let duplicateArticles = 0;
    let sourcesSuccessful = 0;
    let sourcesFailed = 0;

    console.log('🗺️  Discovering articles via sitemaps...\n');

    for (const source of sources || []) {
      try {
        const result = await discoverViaSitemap(source, supabase);

        totalArticles += result.articles;
        newArticles += result.newCount;
        duplicateArticles += result.duplicateCount;
        sourcesSuccessful++;

        console.log(`   ✅ ${source.source_name}: ${result.newCount} new, ${result.duplicateCount} duplicates`);

        // Update last successful scrape
        await supabase
          .from('source_registry')
          .update({ last_successful_scrape: new Date().toISOString() })
          .eq('id', source.id);

      } catch (error) {
        console.error(`   ❌ ${source.source_name}: ${error.message}`);
        sourcesFailed++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Update batch run record (note: articles_duplicate column doesn't exist, skip it)
    const { error: updateError } = await supabase
      .from('batch_scrape_runs')
      .update({
        status: 'completed',
        articles_discovered: totalArticles,
        articles_new: newArticles,
        sources_successful: sourcesSuccessful,
        sources_failed: sourcesFailed,
        duration_seconds: duration
      })
      .eq('id', runId);

    if (updateError) {
      console.error('Failed to update batch run record:', updateError);
    }

    const summary = {
      sources_processed: sourcesSuccessful + sourcesFailed,
      sources_failed: sourcesFailed,
      articles_discovered: totalArticles,
      new_urls: newArticles,
      duplicates_skipped: duplicateArticles,
      duration_seconds: duration
    };

    console.log('\n📊 Summary:');
    console.log(`   Sources processed: ${summary.sources_processed}`);
    console.log(`   New URLs: ${summary.new_urls}`);
    console.log(`   Duplicates: ${summary.duplicates_skipped}`);
    console.log(`   Duration: ${duration}s`);

    return new Response(
      JSON.stringify({ success: true, run_id: runId, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error:', error);

    await supabase
      .from('batch_scrape_runs')
      .update({ status: 'failed', error_message: error.message })
      .eq('id', runId);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// Helper: Get headers with auth cookie if available
// ============================================================================
function getHeadersForSource(sourceName: string): HeadersInit {
  const headers: HeadersInit = { 'User-Agent': USER_AGENT };
  const cookie = AUTH_COOKIES[sourceName];
  if (cookie) {
    headers['Cookie'] = cookie;
    console.log(`   🔐 Using auth cookie for ${sourceName}`);
  }
  return headers;
}

// ============================================================================
// Helper: Discover articles via sitemap
// ============================================================================
async function discoverViaSitemap(source: Source, supabase: any): Promise<{ articles: number, newCount: number, duplicateCount: number }> {
  const domain = new URL(source.source_url).origin;
  const headers = getHeadersForSource(source.source_name);

  let sitemapUrls: string[] = [];

  // Step 1: Check if monitor_config has a direct sitemap URL
  if (source.monitor_config?.sitemap_url) {
    console.log(`   📍 Using configured sitemap: ${source.monitor_config.sitemap_url}`);
    sitemapUrls = [source.monitor_config.sitemap_url];
  } else {
    // Fall back to robots.txt discovery
    const robotsUrl = `${domain}/robots.txt`;
    const robotsRes = await fetch(robotsUrl, { headers });
    if (!robotsRes.ok) {
      throw new Error(`robots.txt not found (${robotsRes.status})`);
    }

    const robotsTxt = await robotsRes.text();

    // Check if we got HTML instead of robots.txt (some sites block without user agent)
    if (robotsTxt.trim().startsWith('<!DOCTYPE') || robotsTxt.trim().startsWith('<html')) {
      throw new Error('robots.txt returned HTML (possibly blocked)');
    }

    sitemapUrls = robotsTxt
      .split('\n')
      .filter(line => line.toLowerCase().startsWith('sitemap:'))
      .map(line => line.split(':').slice(1).join(':').trim())
      .filter(url => url.includes('news') || url.includes('latest') || url.includes('sitemap'));
  }

  if (sitemapUrls.length === 0) {
    throw new Error('No sitemaps found in robots.txt');
  }

  // Source-specific sitemap prioritization
  if (source.source_name === 'Wall Street Journal' || source.source_name === 'WSJ') {
    // Prioritize WSJ Google News sitemap for actual articles
    const wsjNewsSitemap = sitemapUrls.find(u => u.includes('wsj_google_news'));
    if (wsjNewsSitemap) {
      sitemapUrls = [wsjNewsSitemap];
    }
  }

  if (source.source_name === 'Bloomberg') {
    // Bloomberg's latest.xml has proper titles in <news:title> tags
    const bloombergLatest = sitemapUrls.find(u => u.includes('/news/latest.xml'));
    if (bloombergLatest) {
      sitemapUrls = [bloombergLatest];
    }
  }

  if (source.source_name === 'Reuters') {
    // Reuters uses sitemap index, prioritize the news sitemap
    const reutersNewsSitemap = sitemapUrls.find(u => u.includes('news-sitemap') && !u.includes('index'));
    if (!reutersNewsSitemap) {
      // If only index, we need to fetch and parse it
      const newsIndex = sitemapUrls.find(u => u.includes('news-sitemap-index'));
      if (newsIndex) {
        try {
          const indexRes = await fetch(newsIndex, { headers });
          if (indexRes.ok) {
            const indexXml = await indexRes.text();
            const nestedSitemaps = [...indexXml.matchAll(/<loc>(.*?)<\/loc>/g)]
              .map(m => m[1])
              .filter(u => u.includes('news-sitemap') && !u.includes('index'));
            // Use only the first (most recent) sitemap
            if (nestedSitemaps.length > 0) {
              sitemapUrls = [nestedSitemaps[0]];
            }
          }
        } catch (e) {
          console.error(`   ⚠️  Failed to parse Reuters sitemap index: ${e.message}`);
        }
      }
    } else {
      sitemapUrls = [reutersNewsSitemap];
    }
  }

  console.log(`   🗺️  ${source.source_name}: Found ${sitemapUrls.length} sitemaps`);

  // Step 2: Parse sitemaps to extract article URLs
  const articles: { url: string, title: string }[] = [];

  // Date filtering: last 48 hours
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

  for (const sitemapUrl of sitemapUrls.slice(0, 3)) { // Limit to first 3 sitemaps per source
    try {
      const sitemapRes = await fetch(sitemapUrl, { headers });
      if (!sitemapRes.ok) continue;

      const xml = await sitemapRes.text();

      // Parse XML by first splitting into URL blocks, then extracting fields
      const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];

      for (const block of urlBlocks) {
        // Extract loc (URL)
        const locMatch = block.match(/<loc>(.*?)<\/loc>/);
        if (!locMatch) continue;
        const url = locMatch[1];

        // Extract publication date if present
        const dateMatch = block.match(/<news:publication_date>(.*?)<\/news:publication_date>/);
        const pubDate = dateMatch ? dateMatch[1] : null;

        // Extract title - try multiple formats
        let title: string;
        const titleMatch = block.match(/<news:title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/news:title>/);
        if (titleMatch) {
          title = titleMatch[1];
        } else {
          // Fallback: use URL slug (filter out empty strings from trailing slashes)
          const urlParts = url.split('/').filter(p => p.length > 0);
          const slug = urlParts[urlParts.length - 1] || '';
          title = slug.replace(/-/g, ' ').trim() || 'Untitled';
        }

        // Filter by date if available
        if (pubDate) {
          const articleDate = new Date(pubDate);
          if (articleDate < fortyEightHoursAgo) {
            continue; // Skip articles older than 48 hours
          }
        }

        // Filter by URL pattern - be smart about what's an article vs category page
        const isArticle = isValidArticleUrl(url, source.source_name);
        if (isArticle) {
          articles.push({ url, title });
        }
      }

    } catch (err) {
      console.error(`   ⚠️  Failed to parse sitemap ${sitemapUrl}: ${err.message}`);
    }
  }

  if (articles.length === 0) {
    throw new Error('No articles found in sitemaps');
  }

  // Step 3: Check for duplicates
  const urls = articles.map(a => a.url);
  const { data: existingUrls } = await supabase
    .from('raw_articles')
    .select('url')
    .in('url', urls);

  const existingUrlSet = new Set((existingUrls || []).map((r: any) => r.url));
  const newArticles = articles.filter(a => !existingUrlSet.has(a.url));

  // Step 4: Insert new articles
  if (newArticles.length > 0) {
    const records = newArticles.map(article => ({
      source_id: source.id,
      source_name: source.source_name,
      url: article.url,
      title: article.title,
      scrape_status: 'pending'
    }));

    // Insert in batches of 100 to avoid timeouts
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from('raw_articles').insert(batch);
      if (insertError) {
        console.error(`   ⚠️  Insert error for ${source.source_name}: ${insertError.message}`);
        throw new Error(`Insert failed: ${insertError.message}`);
      }
    }
    console.log(`   📝 Inserted ${records.length} articles for ${source.source_name}`);
  }

  return {
    articles: articles.length,
    newCount: newArticles.length,
    duplicateCount: articles.length - newArticles.length
  };
}

// ============================================================================
// Helper: Validate if URL is an actual article (not category/section page)
// ============================================================================
function isValidArticleUrl(url: string, sourceName: string): boolean {
  const urlLower = url.toLowerCase();

  // Exclude patterns that are clearly NOT articles
  const excludePatterns = [
    '/puzzle',
    '/crossword',
    '/games/',
    '/what-to-watch',
    '/video/',
    '/videos/',
    '/podcasts/',
    '/audio/',
    '/newsletter',
    '/subscription',
    '/subscribe',
    '/login',
    '/signin',
    '/register',
    '/about/',
    '/contact/',
    '/advertise/',
    '/terms',
    '/privacy',
    '/help/',
    '/faq/',
    '/sitemap',
    '/rss',
    '/feed',
  ];

  for (const pattern of excludePatterns) {
    if (urlLower.includes(pattern)) {
      return false;
    }
  }

  // Source-specific rules
  if (sourceName === 'Wall Street Journal' || sourceName === 'WSJ') {
    // WSJ actual article URLs look like:
    // https://www.wsj.com/business/campbells-defends-its-ingredients-after-chicken-controversy-cbdb2833
    // https://www.wsj.com/articles/asset-managers-including-apollo-ares-sued-for-alleg-abc123ef
    // They have a section, a slug, and an 8-character hex hash at the end

    // New-style articles end with 8-char hex hash (UUID suffix)
    const hasHashSuffix = /[a-f0-9]{8}$/i.test(url);

    // Old-style articles have /articles/ path - these are always valid if they have the hash
    if (urlLower.includes('/articles/') && hasHashSuffix) {
      return true;
    }

    // Must be in a real content section (not /news/puzzle, /news/what-to-watch, etc.)
    const isContentSection = urlLower.includes('/business') ||
                             urlLower.includes('/politics') ||
                             urlLower.includes('/economy') ||
                             urlLower.includes('/tech') ||
                             urlLower.includes('/world') ||
                             urlLower.includes('/finance') ||
                             urlLower.includes('/markets') ||
                             urlLower.includes('/opinion') ||
                             urlLower.includes('/lifestyle') ||
                             urlLower.includes('/arts-culture') ||
                             urlLower.includes('/health') ||
                             urlLower.includes('/real-estate') ||
                             urlLower.includes('/us-news') ||
                             urlLower.includes('/personal-finance');
    // Exclude sports - too much noise
    // urlLower.includes('/sports')

    return hasHashSuffix && isContentSection;
  }

  if (sourceName === 'Bloomberg') {
    // Bloomberg articles have /news/articles/ or /opinion/
    return urlLower.includes('/news/articles/') ||
           urlLower.includes('/opinion/') ||
           urlLower.includes('/features/');
  }

  if (sourceName === 'Reuters') {
    // Reuters article URLs look like:
    // https://www.reuters.com/world/india/gold-climbs-near-two-week-high-reinforced-us-rate-cut-bets-2025-11-26/
    // https://www.reuters.com/business/energy/oil-stabilises-after-ukraine-peace-talks-2025-11-26/
    // They have a section, subsection, slug with date suffix

    // Check for news sections
    const isNewsSection = urlLower.includes('/world/') ||
                          urlLower.includes('/business/') ||
                          urlLower.includes('/markets/') ||
                          urlLower.includes('/technology/') ||
                          urlLower.includes('/legal/') ||
                          urlLower.includes('/sustainability/');

    // Exclude sports - too much noise
    const isSports = urlLower.includes('/sports/');

    // Reuters article slugs typically end with date pattern -YYYY-MM-DD/
    const hasDateInSlug = /-20\d{2}-\d{2}-\d{2}\/?$/.test(url);

    // Also accept URLs with sufficient path depth (section/subsection/article)
    const pathSegments = url.replace(/\/$/, '').split('/').filter(s => s.length > 0);
    // e.g., https://www.reuters.com/world/china/article-slug-2025-11-26/ = 5 segments

    return isNewsSection && !isSports && (hasDateInSlug || pathSegments.length >= 5);
  }

  if (sourceName === 'Financial Times') {
    // FT articles have /content/ with a UUID
    return urlLower.includes('/content/');
  }

  // Default: check for common article URL patterns
  const hasArticlePath = urlLower.includes('/article') ||
                         urlLower.includes('/story/') ||
                         urlLower.includes('/post/');
  const hasDatePattern = /\/\d{4}\/\d{2}\//.test(url) ||  // YYYY/MM
                         /\/20\d{2}-\d{2}-\d{2}/.test(url); // YYYY-MM-DD

  return hasArticlePath || hasDatePattern;
}
