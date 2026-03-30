// Batch Scraper V5 - RSS Orchestrator
// Discovers article URLs using RSS feeds only
// Stores URLs in raw_articles for later content extraction

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Source {
  id: string;
  source_name: string;
  source_url: string;
  monitor_method: string;
  monitor_config: { rss_url?: string; feed_url?: string } | null;
  industries: string[];
  tier: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  // Get group parameter from query string or body
  const url = new URL(req.url);
  let group = parseInt(url.searchParams.get('group') || '0');

  // Also check request body for group
  if (!group && req.method === 'POST') {
    try {
      const body = await req.json();
      group = parseInt(body.group || '0');
    } catch {
      // No body or invalid JSON, continue with group=0
    }
  }

  const groupLabel = group ? ` (Group ${group})` : ' (All Groups)';

  console.log('📡 BATCH SCRAPER V5 - RSS ORCHESTRATOR' + groupLabel);
  console.log(`   Run ID: ${runId}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  if (group) console.log(`   Group: ${group}`);
  console.log('');

  try {
    // Create batch run record
    await supabase
      .from('batch_scrape_runs')
      .insert({
        id: runId,
        run_type: group ? `rss_discovery_g${group}` : 'rss_discovery',
        status: 'running',
        triggered_by: req.headers.get('user-agent') || 'manual'
      });

    // Get active RSS sources - filter by group if specified
    let query = supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .eq('monitor_method', 'rss');

    if (group) {
      query = query.eq('rss_group', group);
    }

    const { data: sources, error: sourcesError } = await query.order('tier', { ascending: true });

    if (sourcesError) throw new Error(`Failed to load sources: ${sourcesError.message}`);

    console.log(`📊 Found ${sources?.length || 0} active RSS sources\n`);

    let totalArticles = 0;
    let newArticles = 0;
    let duplicateArticles = 0;
    let sourcesSuccessful = 0;
    let sourcesFailed = 0;
    const errors: any[] = [];

    console.log('📡 Discovering articles via RSS...\n');

    for (const source of sources || []) {
      try {
        const articles = await discoverViaRSS(source);

        if (articles.length === 0) {
          console.log(`   ⚠️  ${source.source_name}: No RSS feed found`);
          sourcesFailed++;
          errors.push({ source: source.source_name, error: 'No valid RSS feed' });
          continue;
        }

        totalArticles += articles.length;

        // Check for duplicates
        const { data: existingUrls } = await supabase
          .from('raw_articles')
          .select('url')
          .eq('source_id', source.id);

        const existingUrlSet = new Set((existingUrls || []).map(r => r.url));

        // Insert new articles (filter out articles older than 2 days)
        // Tightened from 7 days to prevent old articles polluting the pipeline
        const maxAgeDays = 2;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

        let sourceNewArticles = 0;
        let skippedOldArticles = 0;

        for (const article of articles) {
          if (existingUrlSet.has(article.url)) {
            duplicateArticles++;
            continue;
          }

          // Skip articles older than cutoff date
          if (article.published_at) {
            const pubDate = new Date(article.published_at);
            if (pubDate < cutoffDate) {
              skippedOldArticles++;
              continue;
            }
          }

          const { error: insertError } = await supabase
            .from('raw_articles')
            .insert({
              source_id: source.id,
              source_name: source.source_name,
              url: article.url,
              title: article.title,
              description: article.description,
              author: article.author,
              published_at: article.published_at,
              raw_metadata: { ...article.raw_metadata, discovery_method: 'rss' },
              content_length: 0,
              processed: false,
              scrape_priority: source.tier,
              scrape_status: 'pending',
              scrape_attempts: 0
            });

          if (!insertError) {
            newArticles++;
            sourceNewArticles++;
          } else if (insertError.code === '23505') {
            duplicateArticles++;
          }
        }

        // Update source metrics
        await supabase
          .from('source_registry')
          .update({
            last_successful_scrape: new Date().toISOString(),
            consecutive_failures: 0
          })
          .eq('id', source.id);

        sourcesSuccessful++;
        const oldSkipMsg = skippedOldArticles > 0 ? ` (${skippedOldArticles} old skipped)` : '';
        console.log(`   ✅ ${source.source_name}: ${sourceNewArticles} new / ${articles.length} total${oldSkipMsg}`);

      } catch (error: any) {
        sourcesFailed++;
        errors.push({ source: source.source_name, error: error.message });
        console.error(`   ❌ ${source.source_name}: ${error.message}`);
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update batch run with results
    await supabase
      .from('batch_scrape_runs')
      .update({
        completed_at: new Date().toISOString(),
        status: sourcesFailed > 0 ? 'partial' : 'completed',
        sources_targeted: sources?.length || 0,
        sources_successful: sourcesSuccessful,
        sources_failed: sourcesFailed,
        articles_discovered: totalArticles,
        articles_new: newArticles,
        duration_seconds: duration,
        error_summary: errors.length > 0 ? errors : null
      })
      .eq('id', runId);

    console.log('\n' + '='.repeat(80));
    console.log('✅ RSS DISCOVERY COMPLETE');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Sources processed: ${sourcesSuccessful}/${sources?.length || 0}`);
    console.log(`   Articles discovered: ${totalArticles}`);
    console.log(`   New URLs: ${newArticles}`);
    console.log(`   Duplicates skipped: ${duplicateArticles}`);
    console.log(`   Failures: ${sourcesFailed}`);
    console.log('='.repeat(80));

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      group: group || 'all',
      summary: {
        sources_processed: sourcesSuccessful,
        sources_failed: sourcesFailed,
        articles_discovered: totalArticles,
        new_urls: newArticles,
        duplicates_skipped: duplicateArticles,
        duration_seconds: duration
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ RSS DISCOVERY FAILED:', error.message);

    await supabase
      .from('batch_scrape_runs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_summary: [{ error: error.message }]
      })
      .eq('id', runId);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================================
// Helper: Discover articles via RSS
// ============================================================================
async function discoverViaRSS(source: Source): Promise<any[]> {
  // FIRST: Try configured RSS URL if it exists in monitor_config
  // Support both 'rss_url' and 'feed_url' field names (sources use both)
  const configuredUrl = source.monitor_config?.rss_url || source.monitor_config?.feed_url;

  if (configuredUrl) {
    try {
      console.log(`   🔍 Trying configured RSS URL: ${configuredUrl}`);

      // Use redirect: 'follow' to handle 301/302 redirects (e.g., FT redirects to /rss/home/uk)
      const response = await fetch(configuredUrl, {
        headers: { 'User-Agent': 'SignalDesk-Scraper/5.0' },
        redirect: 'follow'
      });

      if (response.ok) {
        const xml = await response.text();
        const articles = parseRSSXML(xml, configuredUrl);

        if (articles.length > 0) {
          console.log(`   ✅ Configured RSS URL worked! Found ${articles.length} articles`);
          return articles;
        }
      }

      console.log(`   ⚠️  Configured RSS URL failed (${response.status}), trying auto-discovery...`);
    } catch (error: any) {
      console.log(`   ⚠️  Configured RSS URL error: ${error.message}, trying auto-discovery...`);
    }
  }

  // FALLBACK: Auto-discovery - try common RSS URL patterns
  const rssUrls = [
    `${source.source_url}/rss`,
    `${source.source_url}/feed`,
    `${source.source_url}/rss.xml`,
    `${source.source_url}/feed.xml`,
    `${source.source_url}/atom.xml`,
  ];

  for (const rssUrl of rssUrls) {
    try {
      const response = await fetch(rssUrl, {
        headers: { 'User-Agent': 'SignalDesk-Scraper/5.0' }
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const articles = parseRSSXML(xml, rssUrl);

      if (articles.length > 0) {
        return articles;
      }
    } catch (error) {
      continue;
    }
  }

  return [];
}

// ============================================================================
// Helper: Parse RSS/Atom XML into article objects
// ============================================================================
function parseRSSXML(xml: string, feedUrl: string): any[] {
  const articles: any[] = [];

  const itemMatches = xml.matchAll(/<item>(.*?)<\/item>/gs);

  for (const match of itemMatches) {
    const item = match[1];

    const titleMatch = item.match(/<title(?:[^>]*)>(.*?)<\/title>/s);
    const linkMatch = item.match(/<link(?:[^>]*)>(.*?)<\/link>/s);
    const descMatch = item.match(/<description(?:[^>]*)>(.*?)<\/description>/s);
    const pubDateMatch = item.match(/<pubDate(?:[^>]*)>(.*?)<\/pubDate>/s);
    const authorMatch = item.match(/<(?:dc:)?creator(?:[^>]*)>(.*?)<\/(?:dc:)?creator>/s);

    if (titleMatch && linkMatch) {
      // Strip CDATA wrapper and clean the URL (fixes bug where CDATA wasn't stripped from URLs)
      let articleUrl = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim();

      // Skip Google News redirect URLs - these need resolution to actual article URLs
      if (articleUrl.includes('news.google.com/rss/articles/')) {
        continue;
      }

      articles.push({
        url: articleUrl,
        title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
        description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined,
        author: authorMatch ? authorMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined,
        published_at: pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : undefined,
        raw_metadata: { rss_feed: feedUrl }
      });
    }
  }

  return articles;
}
