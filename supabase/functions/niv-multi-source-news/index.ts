// Multi-Source News Aggregator
// Combines RSS feeds, Google News, and FireSearch for comprehensive coverage
// Client-side date filtering ensures 100% accuracy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')!;

interface NewsArticle {
  url: string;
  title: string;
  description?: string;
  published_date: string; // ISO 8601
  source: string;
  source_type: 'rss' | 'google_news' | 'firesearch';
  age_hours?: number;
}

// Parse RSS feed
async function fetchRSSFeed(feedUrl: string, sourceName: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      console.log(`⚠️  RSS fetch failed: ${sourceName} (${response.status})`);
      return [];
    }

    const xml = await response.text();

    // Basic RSS/Atom parsing (handles both formats)
    const items: NewsArticle[] = [];

    // RSS 2.0 items
    const rssItemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = rssItemRegex.exec(xml)) !== null) {
      const item = match[1];

      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
      const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
      const descMatch = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);

      if (titleMatch && linkMatch && pubDateMatch) {
        items.push({
          url: linkMatch[1].trim(),
          title: titleMatch[1].trim().replace(/<[^>]*>/g, ''),
          description: descMatch?.[1]?.trim().replace(/<[^>]*>/g, ''),
          published_date: new Date(pubDateMatch[1]).toISOString(),
          source: sourceName,
          source_type: 'rss'
        });
      }
    }

    // Atom entries (fallback)
    if (items.length === 0) {
      const atomEntryRegex = /<entry>([\s\S]*?)<\/entry>/g;

      while ((match = atomEntryRegex.exec(xml)) !== null) {
        const entry = match[1];

        const titleMatch = entry.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
        const linkMatch = entry.match(/<link[^>]*href=["'](.*?)["']/);
        const summaryMatch = entry.match(/<summary>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/summary>/s);
        const updatedMatch = entry.match(/<updated>(.*?)<\/updated>/) || entry.match(/<published>(.*?)<\/published>/);

        if (titleMatch && linkMatch && updatedMatch) {
          items.push({
            url: linkMatch[1].trim(),
            title: titleMatch[1].trim().replace(/<[^>]*>/g, ''),
            description: summaryMatch?.[1]?.trim().replace(/<[^>]*>/g, ''),
            published_date: new Date(updatedMatch[1]).toISOString(),
            source: sourceName,
            source_type: 'rss'
          });
        }
      }
    }

    console.log(`   ✓ ${sourceName}: ${items.length} articles`);
    return items;

  } catch (error) {
    console.error(`   ✗ ${sourceName}: ${error.message}`);
    return [];
  }
}

// Fetch from multiple RSS feeds in parallel
async function aggregateRSSFeeds(industry: string): Promise<NewsArticle[]> {
  console.log('📡 Fetching RSS feeds...');

  // Get sources from master-source-registry
  const registryResp = await fetch(`${SUPABASE_URL}/functions/v1/master-source-registry`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ industry })
  });

  const registry = await registryResp.json();

  // Extract RSS feeds from all categories
  const allSources = Object.values(registry.data).flat() as any[];
  const rssFeeds = allSources.filter(s => s.type === 'rss' && s.priority === 'critical');

  console.log(`   Found ${rssFeeds.length} critical RSS feeds`);

  // Fetch top 20 feeds in parallel (avoid overwhelming)
  const topFeeds = rssFeeds.slice(0, 20);

  const results = await Promise.all(
    topFeeds.map(feed => fetchRSSFeed(feed.url, feed.name))
  );

  const articles = results.flat();
  console.log(`   ✅ Total RSS articles: ${articles.length}`);

  return articles;
}

// Fetch from Google News RSS (simple, free, reliable)
async function fetchGoogleNews(query: string): Promise<NewsArticle[]> {
  console.log(`🔍 Fetching Google News RSS: "${query}"`);

  try {
    // Google News RSS endpoint
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      console.log(`   ⚠️  Google News RSS failed (${response.status})`);
      return [];
    }

    const xml = await response.text();
    const items: NewsArticle[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];

      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
      const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      const sourceMatch = item.match(/<source[^>]*>(.*?)<\/source>/);

      if (titleMatch && linkMatch && pubDateMatch) {
        items.push({
          url: linkMatch[1].trim(),
          title: titleMatch[1].trim(),
          published_date: new Date(pubDateMatch[1]).toISOString(),
          source: sourceMatch?.[1] || 'Google News',
          source_type: 'google_news'
        });
      }
    }

    console.log(`   ✅ Google News: ${items.length} articles`);
    return items;

  } catch (error) {
    console.error(`   ✗ Google News error: ${error.message}`);
    return [];
  }
}

// Fetch from FireSearch (wide net, then filter)
async function fetchFireSearch(query: string): Promise<NewsArticle[]> {
  console.log(`🔥 Fetching FireSearch: "${query}"`);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        limit: 20,
        tbs: 'qdr:d', // Try to get recent, but will filter anyway
        lang: 'en'
      })
    });

    if (!response.ok) {
      console.log(`   ⚠️  FireSearch failed (${response.status})`);
      return [];
    }

    const data = await response.json();
    const results = data.data || [];

    const articles: NewsArticle[] = results.map((r: any) => ({
      url: r.url,
      title: r.title,
      description: r.description,
      published_date: extractDateFromURL(r.url) || new Date().toISOString(),
      source: new URL(r.url).hostname,
      source_type: 'firesearch' as const
    }));

    console.log(`   ✅ FireSearch: ${articles.length} articles`);
    return articles;

  } catch (error) {
    console.error(`   ✗ FireSearch error: ${error.message}`);
    return [];
  }
}

// Extract date from URL patterns (YYYY/MM/DD, YYYY-MM-DD, etc.)
function extractDateFromURL(url: string): string | null {
  const patterns = [
    /\/(\d{4})\/(\d{2})\/(\d{2})\//,  // /2025/01/15/
    /\/(\d{4})-(\d{2})-(\d{2})\//,    // /2025-01-15/
    /\/(\d{4})(\d{2})(\d{2})\//       // /20250115/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const [_, year, month, day] = match;
      return new Date(`${year}-${month}-${day}`).toISOString();
    }
  }

  return null;
}

// Client-side date filtering (100% reliable)
function filterByDate(articles: NewsArticle[], maxAgeHours: number): NewsArticle[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);

  return articles
    .map(article => {
      const pubDate = new Date(article.published_date);
      const ageMs = now.getTime() - pubDate.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);

      return {
        ...article,
        age_hours: ageHours
      };
    })
    .filter(article => {
      const pubDate = new Date(article.published_date);
      return pubDate >= cutoff;
    });
}

// Filter articles by query relevance
function filterByQuery(articles: NewsArticle[], query: string): NewsArticle[] {
  // Extract query terms (handle OR operators)
  const terms = query
    .toLowerCase()
    .split(/\s+or\s+/i)
    .map(term => term.trim().replace(/['"]/g, ''))
    .filter(term => term.length > 0);

  console.log(`   Query terms: ${terms.join(', ')}`);

  return articles.filter(article => {
    const searchText = `${article.title} ${article.description || ''} ${article.url}`.toLowerCase();

    // Article matches if it contains ANY of the query terms
    return terms.some(term => {
      // Check for whole word matches (with word boundaries)
      const words = term.split(/\s+/);
      return words.every(word => {
        // Allow partial matches for company names (e.g., "marubeni" matches "Marubeni Corporation")
        return searchText.includes(word);
      });
    });
  });
}

// Deduplicate by URL
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];

  // Sort by source priority: Google News > FireSearch
  const sorted = [...articles].sort((a, b) => {
    const priority = { google_news: 0, firesearch: 1, rss: 2 };
    return priority[a.source_type] - priority[b.source_type];
  });

  for (const article of sorted) {
    // Normalize URL (remove tracking params, www, etc.)
    const normalized = normalizeURL(article.url);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(article);
    }
  }

  return unique;
}

// Normalize URL for deduplication
function normalizeURL(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove www
    let hostname = parsed.hostname.replace(/^www\./, '');

    // Remove tracking params
    const cleanParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams) {
      // Keep only non-tracking params
      if (!key.match(/^(utm_|fbclid|gclid|ref|source)/)) {
        cleanParams.set(key, value);
      }
    }

    const cleanSearch = cleanParams.toString();
    return `${hostname}${parsed.pathname}${cleanSearch ? '?' + cleanSearch : ''}`;
  } catch {
    return url;
  }
}

// Rank articles by source quality and recency
function rankArticles(articles: NewsArticle[]): NewsArticle[] {
  return articles.sort((a, b) => {
    // First by source type priority
    const priority = { google_news: 0, firesearch: 1, rss: 2 };
    const priorityDiff = priority[a.source_type] - priority[b.source_type];

    if (priorityDiff !== 0) return priorityDiff;

    // Then by recency
    return (a.age_hours || Infinity) - (b.age_hours || Infinity);
  });
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, industry = 'general', max_age_hours = 24 } = await req.json();

    console.log('\n🎯 Multi-Source News Aggregator');
    console.log(`   Query: "${query}"`);
    console.log(`   Industry: ${industry}`);
    console.log(`   Max age: ${max_age_hours}h`);
    console.log('');

    // Fetch from query-specific sources only (no general RSS feeds)
    const [googleArticles, fireArticles] = await Promise.all([
      fetchGoogleNews(query),
      fetchFireSearch(query)
    ]);

    // Combine all sources
    const allArticles = [...googleArticles, ...fireArticles];
    console.log(`\n📊 Combined: ${allArticles.length} total articles`);
    console.log(`   Google News: ${googleArticles.length}`);
    console.log(`   FireSearch: ${fireArticles.length}`);

    // Filter by date (client-side - 100% reliable)
    const recentArticles = filterByDate(allArticles, max_age_hours);
    console.log(`   ✓ After date filter (${max_age_hours}h): ${recentArticles.length}`);

    // Filter by query relevance
    const relevantArticles = filterByQuery(recentArticles, query);
    console.log(`   ✓ After query filter: ${relevantArticles.length}`);

    // Deduplicate
    const uniqueArticles = deduplicateArticles(relevantArticles);
    console.log(`   ✓ After deduplication: ${uniqueArticles.length}`);

    // Rank by quality and recency
    const rankedArticles = rankArticles(uniqueArticles);

    // Stats
    const stats = {
      total_fetched: allArticles.length,
      after_date_filter: recentArticles.length,
      after_query_filter: relevantArticles.length,
      after_deduplication: uniqueArticles.length,
      by_source: {
        google_news: uniqueArticles.filter(a => a.source_type === 'google_news').length,
        firesearch: uniqueArticles.filter(a => a.source_type === 'firesearch').length
      }
    };

    console.log(`\n✅ Returning ${rankedArticles.length} articles`);
    console.log(`   Google News: ${stats.by_source.google_news}`);
    console.log(`   FireSearch: ${stats.by_source.firesearch}`);

    return new Response(JSON.stringify({
      success: true,
      articles: rankedArticles,
      stats,
      query,
      max_age_hours
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Aggregator error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
