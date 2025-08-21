// RSS Proxy Edge Function
// Fetches RSS feeds and returns parsed data (bypasses CORS)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchRSSFeed(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SignalDesk/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }
    
    const xml = await response.text();
    
    // Parse RSS items
    const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
    const articles = [];
    
    for (const item of items) {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const description = item.match(/<description>(.*?)<\/description>/)?.[1] || '';
      
      if (title && link) {
        articles.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&'),
          url: link,
          description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').substring(0, 200),
          publishedAt: pubDate || new Date().toISOString(),
          source: new URL(url).hostname
        });
      }
    }
    
    return articles;
  } catch (error) {
    console.error(`RSS fetch error for ${url}:`, error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { url, urls } = await req.json();
    
    let results = [];
    
    if (url) {
      // Single RSS feed
      results = await fetchRSSFeed(url);
    } else if (urls && Array.isArray(urls)) {
      // Multiple RSS feeds in parallel
      const promises = urls.map(feedUrl => 
        fetchRSSFeed(feedUrl).catch(e => ({ error: e.message, url: feedUrl }))
      );
      const allResults = await Promise.all(promises);
      results = allResults.flat().filter(r => !r.error);
    } else {
      throw new Error('Either url or urls parameter is required');
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        articles: results,
        count: results.length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('RSS Proxy error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});