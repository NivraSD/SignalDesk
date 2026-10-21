// Batch Scraper V5 - Firecrawl CRAWL Orchestrator (WEBHOOK MODE)
// ---------------------------------------------------------------------------
// Drop-in alternative to batch-scraper-v5-orchestrator-fireplexity.
//
// The original starts a crawl and then BLOCK-POLLS it to completion inside the
// edge function, capped at 60s (CRAWL_TIMEOUT_MS). If the crawl isn't in the
// "completed" state by 60s it throws and DISCARDS every page already crawled
// (observed: Lloyds List 26/26 pages → "timed out after 60s" → 0 saved).
//
// This version instead:
//   1. Starts each crawl on the Firecrawl v2 API with a webhook.
//   2. Returns immediately (no polling, no 60s cap, no edge wall-clock risk).
//   3. Pages are ingested by `firecrawl-crawl-webhook` AS THEY ARRIVE.
//
// Nothing is thrown away: a crawl that takes 4 minutes delivers all its pages.
// ---------------------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0';

// Public URL Firecrawl will POST crawl events to. Override with WEBHOOK_URL if
// the ingest function lives elsewhere (e.g. a custom domain).
const WEBHOOK_URL = Deno.env.get('FIRECRAWL_WEBHOOK_URL') ||
  `${SUPABASE_URL}/functions/v1/firecrawl-crawl-webhook`;

const MAX_SOURCES_DEFAULT = 5;
const MAX_PAGES_PER_SOURCE = 25;

// Premium-source auth cookies — same map mcp-firecrawl uses on the worker path.
// Without these, a crawl of a paywalled outlet returns "subscribe to read"
// stubs (observed: The Information at ~325 chars/page). Stealth proxy is used
// alongside the cookie for aggressive bot detection (costs more credits, so
// only when we actually have a cookie to get real content).
const AUTH_COOKIES: Array<{ match: string; cookie?: string; name: string }> = [
  { match: 'wsj.com', cookie: Deno.env.get('WSJ_AUTH_COOKIE'), name: 'WSJ' },
  { match: 'ft.com', cookie: Deno.env.get('FT_AUTH_COOKIE'), name: 'FT' },
  { match: 'bloomberg.com', cookie: Deno.env.get('BLOOMBERG_AUTH_COOKIE'), name: 'Bloomberg' },
  { match: 'nytimes.com', cookie: Deno.env.get('NYTIMES_AUTH_COOKIE'), name: 'NYTimes' },
  { match: 'washingtonpost.com', cookie: Deno.env.get('WAPO_AUTH_COOKIE'), name: 'WaPo' },
  { match: 'theinformation.com', cookie: Deno.env.get('THEINFORMATION_AUTH_COOKIE'), name: 'The Information' },
];

interface Source {
  id: string;
  source_name: string;
  source_url: string;
  monitor_method: string;
  industries: string[];
  tier: number;
  consecutive_failures?: number;
  last_successful_scrape?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const startTime = Date.now();

  console.log('🔥 BATCH SCRAPER V5 - FIRECRAWL CRAWL ORCHESTRATOR (WEBHOOK MODE)');
  console.log(`   Webhook target: ${WEBHOOK_URL}`);

  try {
    const body = await req.json().catch(() => ({}));
    const maxSources = body.max_sources || MAX_SOURCES_DEFAULT;
    const testSourceIds = body.test_source_ids || null;

    // Select sources (same logic as the original orchestrator)
    let sourcesQuery = supabase
      .from('source_registry')
      .select('*')
      .eq('active', true)
      .eq('monitor_method', 'firecrawl');

    if (testSourceIds && testSourceIds.length > 0) {
      sourcesQuery = sourcesQuery.in('id', testSourceIds);
    } else {
      sourcesQuery = sourcesQuery
        .order('last_successful_scrape', { ascending: true, nullsFirst: true })
        .order('tier', { ascending: true })
        .limit(maxSources);
    }

    const { data: sources, error: sourcesError } = await sourcesQuery;
    if (sourcesError) throw new Error(`Failed to load sources: ${sourcesError.message}`);

    console.log(`📊 Starting ${sources?.length || 0} crawl jobs\n`);

    const started: any[] = [];
    const failedToStart: any[] = [];

    // Fire off all crawls. Each gets its own batch_scrape_runs row (run_id) that
    // the webhook flips to completed/failed. We do NOT wait for them here.
    for (const source of (sources || []) as Source[]) {
      // One run record per crawl so the webhook can reconcile it by run_id.
      const runId = crypto.randomUUID();
      await supabase.from('batch_scrape_runs').insert({
        id: runId,
        run_type: 'firecrawl_crawl_webhook',
        status: 'running',
        triggered_by: req.headers.get('user-agent') || 'manual',
      });

      try {
        const crawlId = await startCrawl(source, runId);
        started.push({ source: source.source_name, crawl_id: crawlId, run_id: runId });
        console.log(`   🚀 ${source.source_name}: crawl ${crawlId} started (run ${runId})`);
      } catch (error: any) {
        failedToStart.push({ source: source.source_name, error: error.message });
        console.error(`   ❌ ${source.source_name}: failed to start — ${error.message}`);
        await supabase
          .from('batch_scrape_runs')
          .update({ status: 'failed', error_summary: [{ error: `start failed: ${error.message}` }] })
          .eq('id', runId);
      }

      // Space out starts to stay under Firecrawl's crawl-start rate limit.
      await new Promise(r => setTimeout(r, 800));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('📊 ALL CRAWLS DISPATCHED (results arrive via webhook)');
    console.log(`   Started: ${started.length}`);
    console.log(`   Failed to start: ${failedToStart.length}`);
    console.log(`   Dispatch time: ${duration}s`);
    console.log('='.repeat(60));

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'webhook',
        dispatched: started.length,
        failed_to_start: failedToStart.length,
        jobs: started,
        errors: failedToStart,
        note: 'Pages are ingested asynchronously by firecrawl-crawl-webhook as the crawls complete.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// ============================================================================
// Start ONE crawl job on the Firecrawl v2 API with a webhook. Returns the
// Firecrawl crawl id. Does not wait for the crawl to finish.
// ============================================================================
async function startCrawl(source: Source, runId: string): Promise<string> {
  const scrapeOptions: Record<string, any> = {
    formats: ['markdown'],
    onlyMainContent: true,
    waitFor: 2000,
  };

  // Inject premium auth for paywalled outlets so the crawl scrapes full
  // articles, not subscribe-wall stubs. Keyed on the source domain (one
  // domain per crawl). Stealth proxy pairs with the cookie for bot detection.
  const auth = AUTH_COOKIES.find(a => source.source_url.includes(a.match));
  if (auth?.cookie) {
    scrapeOptions.headers = {
      'Cookie': auth.cookie,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    };
    scrapeOptions.proxy = 'stealth';
    console.log(`   🔐 ${auth.name} auth + stealth for ${source.source_name}`);
  }

  const payload = JSON.stringify({
    url: source.source_url,
    limit: MAX_PAGES_PER_SOURCE,
    scrapeOptions,
    excludePaths: [
      '/category/*', '/tag/*', '/author/*', '/login', '/subscribe',
      '/signup', '/search', '/contact', '/about', '/privacy', '/terms',
    ],
    // The webhook that receives page/completed events for THIS crawl.
    // `metadata` is round-tripped back to us on every event so the ingest
    // function knows which source/run each page belongs to.
    webhook: {
      url: WEBHOOK_URL,
      events: ['started', 'page', 'completed', 'failed'],
      metadata: {
        run_id: runId,
        source_id: source.id,
        source_name: source.source_name,
        source_url: source.source_url,
      },
    },
  });

  // Firecrawl rate-limits crawl-starts (429) and caps concurrent crawls, so a
  // burst of starts can bounce. Retry 429/5xx with backoff, honoring
  // Retry-After when present. 4xx (bad URL, 402 credits) is not retried.
  const backoff = [1500, 4000, 8000, 15000];
  let lastErr = '';
  for (let attempt = 0; attempt <= backoff.length; attempt++) {
    const resp = await fetch('https://api.firecrawl.dev/v2/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    if (resp.ok) {
      const data = await resp.json();
      if (!data.id) throw new Error('No crawl ID returned');
      return data.id;
    }

    const text = await resp.text();
    lastErr = `${resp.status}: ${text.slice(0, 200)}`;

    const retryable = resp.status === 429 || resp.status >= 500;
    if (!retryable || attempt === backoff.length) {
      throw new Error(`Crawl API error (${lastErr})`);
    }

    const retryAfter = parseInt(resp.headers.get('retry-after') || '0') * 1000;
    const delay = Math.max(retryAfter, backoff[attempt]);
    console.log(`   ⏳ ${source.source_name}: ${resp.status}, retrying in ${delay}ms`);
    await new Promise(r => setTimeout(r, delay));
  }
  throw new Error(`Crawl start failed after retries (${lastErr})`);
}
