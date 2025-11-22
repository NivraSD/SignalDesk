// Google Custom Search Engine API Integration
// Uses configured CSE with date filtering for reliable, relevant news results

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')!;
const GOOGLE_CSE_ID = 'd103f3ed8289a4917'; // User's configured CSE

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  published_date?: string;
  source: string;
}

// Fetch from Google Custom Search API
async function searchGoogleCSE(
  query: string,
  maxResults: number = 20,
  dateRestrict: string = 'd1' // d1 = last 24 hours, d7 = last week, etc.
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Google CSE returns max 10 results per request
  // Need to paginate to get more
  const requestsNeeded = Math.ceil(maxResults / 10);

  console.log(`🔍 Google CSE Search: "${query.substring(0, 60)}..."`);
  console.log(`   Date restrict: ${dateRestrict}`);
  console.log(`   Max results: ${maxResults} (${requestsNeeded} requests)`);

  for (let i = 0; i < requestsNeeded; i++) {
    const start = i * 10 + 1; // CSE uses 1-based indexing

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set('cx', GOOGLE_CSE_ID);
    url.searchParams.set('q', query);
    url.searchParams.set('dateRestrict', dateRestrict);
    // NOTE: sort=date removed - it filters out articles without date metadata, reducing results from 42 to 7
    // We rely on monitor-stage-2-relevance date filtering instead (rejects undated articles)
    url.searchParams.set('num', '10');
    url.searchParams.set('start', start.toString());

    console.log(`   Request ${i + 1}/${requestsNeeded}: start=${start}`);

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`   ❌ Google CSE error ${response.status}: ${errorText}`);

        // If we hit quota or error, return what we have
        break;
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.log(`   ℹ️  No more results available`);
        break;
      }

      for (const item of data.items) {
        // Extract date from pagemap if available
        let publishedDate: string | undefined;

        if (item.pagemap?.metatags?.[0]) {
          const meta = item.pagemap.metatags[0];
          publishedDate =
            meta['article:published_time'] ||
            meta['datePublished'] ||
            meta['pubdate'] ||
            meta['og:updated_time'];
        }

        // Extract source domain
        const sourceUrl = new URL(item.link);
        const source = sourceUrl.hostname.replace('www.', '');

        results.push({
          url: item.link,
          title: item.title,
          snippet: item.snippet || '',
          published_date: publishedDate,
          source
        });
      }

      console.log(`   ✓ Got ${data.items.length} results`);

      // If we got fewer than 10, no point requesting more
      if (data.items.length < 10) {
        break;
      }

    } catch (error: any) {
      console.error(`   ❌ Request ${i + 1} failed:`, error.message);
      break;
    }
  }

  console.log(`   ✅ Total results: ${results.length}`);
  return results;
}

// Extract date from URL patterns
function extractDateFromURL(url: string): string | null {
  const patterns = [
    /\/(\d{4})\/(\d{2})\/(\d{2})\//,  // /2025/11/22/
    /\/(\d{4})-(\d{2})-(\d{2})\//,    // /2025-11-22/
    /\/(\d{4})(\d{2})(\d{2})\//       // /20251122/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const [_, year, month, day] = match;
      try {
        const date = new Date(`${year}-${month}-${day}`);
        // Validate date is reasonable
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        // Invalid date, continue to next pattern
      }
    }
  }

  return null;
}

// Add age_hours to results
function addAgeInfo(results: SearchResult[]): (SearchResult & { age_hours?: number })[] {
  const now = new Date();

  return results.map(result => {
    let publishedDate = result.published_date;

    // If no metadata date, try extracting from URL
    if (!publishedDate) {
      publishedDate = extractDateFromURL(result.url) || undefined;
    }

    let age_hours: number | undefined;
    if (publishedDate) {
      const pubDate = new Date(publishedDate);
      const ageMs = now.getTime() - pubDate.getTime();
      age_hours = ageMs / (1000 * 60 * 60);
    }

    return {
      ...result,
      age_hours
    };
  });
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, max_results = 20, date_restrict = 'd1' } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({
        error: 'Query parameter required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('\n🎯 Google CSE Search');
    console.log(`   Query: "${query}"`);
    console.log(`   Date restrict: ${date_restrict}`);
    console.log(`   Max results: ${max_results}`);
    console.log('');

    // Search
    const results = await searchGoogleCSE(query, max_results, date_restrict);

    // Add age information
    const resultsWithAge = addAgeInfo(results);

    // Stats
    const withDates = resultsWithAge.filter(r => r.published_date || r.age_hours).length;
    const avgAge = resultsWithAge
      .filter(r => r.age_hours !== undefined)
      .reduce((sum, r) => sum + (r.age_hours || 0), 0) /
      (resultsWithAge.filter(r => r.age_hours !== undefined).length || 1);

    console.log(`\n✅ Returning ${results.length} results`);
    console.log(`   With dates: ${withDates}/${results.length}`);
    console.log(`   Avg age: ${avgAge.toFixed(1)}h`);

    return new Response(JSON.stringify({
      success: true,
      results: resultsWithAge,
      count: resultsWithAge.length,
      query,
      date_restrict,
      stats: {
        total: resultsWithAge.length,
        with_dates: withDates,
        avg_age_hours: avgAge
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Google CSE error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
