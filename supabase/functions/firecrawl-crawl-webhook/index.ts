// Firecrawl Crawl Webhook Ingest
// Receives crawl.* webhook events from Firecrawl (v2 Crawl API) and inserts
// discovered pages into raw_articles AS THEY ARRIVE — no block-polling, no
// self-imposed timeout, no discarding of partial results.
//
// Deploy with verify_jwt = false (see supabase/config.toml). Security is
// enforced by the X-Firecrawl-Signature HMAC, NOT by a Supabase JWT.
//
// Pair with: batch-scraper-v5-orchestrator-fireplexity-webhook (starts the crawls).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Set this to the webhook secret from Firecrawl dashboard → Settings → Advanced.
// If unset, signature verification is skipped (fine for local testing, NOT prod).
const FIRECRAWL_WEBHOOK_SECRET = Deno.env.get('FIRECRAWL_WEBHOOK_SECRET') || '';

const MAX_ARTICLE_AGE_DAYS = 14; // Skip articles with old dates (matches orchestrator)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  // Read the RAW body first — the signature is computed over these exact bytes.
  const rawBody = await req.text();

  // ── Verify signature ──────────────────────────────────────────────────────
  if (FIRECRAWL_WEBHOOK_SECRET) {
    const sigHeader = req.headers.get('x-firecrawl-signature') || '';
    const ok = await verifySignature(FIRECRAWL_WEBHOOK_SECRET, rawBody, sigHeader);
    if (!ok) {
      console.error('❌ Invalid webhook signature — rejecting');
      return json({ success: false, error: 'Invalid signature' }, 401);
    }
  } else {
    console.warn('⚠️  FIRECRAWL_WEBHOOK_SECRET not set — skipping signature verification');
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const eventType: string = payload.type || 'unknown';   // e.g. "crawl.page", "crawl.completed"
  const crawlId: string = payload.id || '';
  const meta = payload.metadata || {};                    // round-tripped from the crawl request
  const source = {
    id: meta.source_id || null,
    name: meta.source_name || 'unknown',
    url: meta.source_url || '',
    runId: meta.run_id || null,
  };

  console.log(`📥 ${eventType} | crawl=${crawlId} | source=${source.name}`);

  try {
    switch (eventType) {
      case 'crawl.started':
        // Nothing to persist; just acknowledge.
        break;

      case 'crawl.page': {
        // payload.data is an array of freshly-scraped page objects.
        const pages: any[] = Array.isArray(payload.data) ? payload.data : (payload.data ? [payload.data] : []);
        const inserted = await ingestPages(supabase, pages, source, crawlId);
        console.log(`   ✅ ingested ${inserted}/${pages.length} page(s)`);
        break;
      }

      case 'crawl.completed': {
        // Some deliveries include the full data array on completion too — ingest
        // anything we haven't already (dedup is handled per-row).
        const pages: any[] = Array.isArray(payload.data) ? payload.data : [];
        if (pages.length > 0) {
          const inserted = await ingestPages(supabase, pages, source, crawlId);
          console.log(`   ✅ (completed) ingested ${inserted}/${pages.length} trailing page(s)`);
        }
        if (source.id) {
          await supabase
            .from('source_registry')
            .update({ last_successful_scrape: new Date().toISOString(), consecutive_failures: 0 })
            .eq('id', source.id);
        }
        if (source.runId) {
          await supabase
            .from('batch_scrape_runs')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', source.runId);
        }
        console.log(`   🏁 crawl complete for ${source.name}`);
        break;
      }

      case 'crawl.failed': {
        console.error(`   ❌ crawl failed: ${payload.error || 'unknown'}`);
        if (source.id) {
          const { data: cur } = await supabase
            .from('source_registry')
            .select('consecutive_failures')
            .eq('id', source.id)
            .maybeSingle();
          await supabase
            .from('source_registry')
            .update({ consecutive_failures: ((cur?.consecutive_failures || 0) + 1) })
            .eq('id', source.id);
        }
        if (source.runId) {
          await supabase
            .from('batch_scrape_runs')
            .update({ status: 'failed', error_summary: [{ error: payload.error || 'crawl failed' }] })
            .eq('id', source.runId);
        }
        break;
      }

      default:
        console.log(`   (ignoring unhandled event: ${eventType})`);
    }
  } catch (err: any) {
    console.error(`   ⚠️  handler error: ${err.message}`);
    // Return 200 anyway so Firecrawl doesn't hammer retries for a transient DB blip;
    // page events are idempotent and will be re-sent on the next crawl if lost.
  }

  return json({ success: true });
});

// ============================================================================
// Insert a batch of crawled pages into raw_articles (idempotent per URL)
// ============================================================================
async function ingestPages(supabase: any, pages: any[], source: any, crawlId: string): Promise<number> {
  let inserted = 0;

  for (const page of pages) {
    const metadata = page.metadata || {};
    const url = page.sourceURL || metadata.sourceURL || metadata.url || '';
    if (!url) continue;

    // Only keep real articles, and only for the source we crawled (skip off-domain).
    if (source.url && !isValidArticleUrl(url, source.url)) continue;

    const markdown = page.markdown || '';
    const hasContent = markdown.length > 300;

    // Published date, rejecting anything older than the cutoff.
    let publishedDate: string | null = null;
    const dateStr = metadata.publishedTime ||
                    metadata['article:published_time'] ||
                    metadata.datePublished ||
                    extractDateFromUrl(url);
    if (dateStr) {
      try {
        const date = new Date(dateStr);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - MAX_ARTICLE_AGE_DAYS);
        if (date >= cutoff) publishedDate = date.toISOString();
      } catch { /* ignore bad dates */ }
    }

    const title = metadata.title ||
                  metadata.ogTitle ||
                  metadata['og:title'] ||
                  url.split('/').pop()?.replace(/-/g, ' ') ||
                  'Untitled';

    const record = {
      source_id: source.id,
      source_name: source.name,
      url,
      title,
      full_content: hasContent ? markdown : null,
      content_length: markdown.length,
      published_at: publishedDate,
      scrape_status: hasContent ? 'completed' : 'pending', // no content → worker retries
      scraped_at: hasContent ? new Date().toISOString() : null,
      raw_metadata: { ...metadata, scraping_method: 'firecrawl_crawl_webhook', crawl_id: crawlId },
    };

    const { error } = await supabase.from('raw_articles').insert(record);
    if (!error) {
      inserted++;
    } else if (error.code !== '23505') { // 23505 = duplicate URL, expected
      console.error(`   insert error for ${url.substring(0, 60)}: ${error.message}`);
    }
  }

  return inserted;
}

// ============================================================================
// HMAC-SHA256 signature verification (X-Firecrawl-Signature: sha256=<hex>)
// ============================================================================
async function verifySignature(secret: string, rawBody: string, header: string): Promise<boolean> {
  if (!header) return false;
  const provided = header.startsWith('sha256=') ? header.slice(7) : header;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, '0')).join('');

  return timingSafeEqual(expected, provided);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ============================================================================
// Helpers (copied from batch-scraper-v5-orchestrator-fireplexity for a
// self-contained bundle; move to _shared/ if you want a single source of truth)
// ============================================================================
function isValidArticleUrl(url: string, sourceUrl: string): boolean {
  const lowerUrl = url.toLowerCase();
  let sourceDomain: string;
  let pathname: string;
  try {
    sourceDomain = new URL(sourceUrl).hostname;
    const urlObj = new URL(url);
    // Normalize a leading "www." on BOTH sides, then accept the registered
    // apex domain or any subdomain of it (e.g. source lloydslist.com should
    // match articles on www.lloydslist.com or news.lloydslist.com). Without
    // this, a www/non-www mismatch silently drops 100% of a source's articles.
    const strip = (h: string) => h.replace(/^www\./, '');
    const sHost = strip(sourceDomain);
    const aHost = strip(urlObj.hostname);
    if (aHost !== sHost && !aHost.endsWith('.' + sHost)) return false;
    pathname = urlObj.pathname;
  } catch {
    return false;
  }
  if (lowerUrl === sourceUrl.toLowerCase()) return false;

  const excludePatterns = [
    '/category/', '/categories/', '/tag/', '/tags/', '/author/', '/authors/',
    '/topics/', '/topic/', '/login', '/subscribe', '/signup', '/search',
    '/contact', '/about-us', '/privacy-policy', '/terms', '/faq',
    '.pdf', '.xml', '/feed/', '/rss/',
  ];
  for (const pattern of excludePatterns) {
    if (lowerUrl.includes(pattern)) return false;
  }

  const hasDateInPath = /\/\d{4}\/\d{2}/.test(pathname);
  const hasDateSuffix = /-\d{4}-\d{2}$/.test(pathname);
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || '';
  const isArticleSlug = lastSegment.split('-').length >= 4;

  if (hasDateInPath || hasDateSuffix || isArticleSlug) return true;
  if (pathSegments.length < 2) return false;
  if (pathSegments.length === 1 && lastSegment.length < 20) return false;
  return true;
}

function extractDateFromUrl(url: string): string | null {
  const slashPattern = url.match(/\/(\d{4})\/(\d{2})(?:\/(\d{2}))?/);
  if (slashPattern) {
    const [, year, month, day] = slashPattern;
    const yearNum = parseInt(year);
    if (yearNum >= 2000 && yearNum <= 2030) {
      return new Date(yearNum, parseInt(month) - 1, day ? parseInt(day) : 1).toISOString();
    }
  }
  const dashPattern = url.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (dashPattern) {
    const [, year, month, day] = dashPattern;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
  }
  return null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
