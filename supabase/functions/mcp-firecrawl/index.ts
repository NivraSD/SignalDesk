// MCP Firecrawl Server - Intelligent Web Scraping for SignalDesk
// Provides batch scraping, extraction, and research capabilities

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Configuration
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0';
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2';  // Updated to v2 for extraction support

// Premium source authentication cookies
const WSJ_AUTH_COOKIE = Deno.env.get('WSJ_AUTH_COOKIE');
const FT_AUTH_COOKIE = Deno.env.get('FT_AUTH_COOKIE');
const BLOOMBERG_AUTH_COOKIE = Deno.env.get('BLOOMBERG_AUTH_COOKIE');
const NYTIMES_AUTH_COOKIE = Deno.env.get('NYTIMES_AUTH_COOKIE');

// MCP Tools Definition
const TOOLS = [
  {
    name: 'batch_scrape_articles',
    description: 'Efficiently scrape multiple articles with structured extraction',
    inputSchema: {
      type: 'object',
      properties: {
        articles: {
          type: 'array',
          description: 'Articles to scrape with priorities',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              priority: { type: 'number' },
              metadata: { type: 'object' }
            }
          }
        },
        formats: {
          type: 'array',
          description: 'Output formats (markdown, html, cleaned_html)',
          default: ['markdown']
        },
        extractSchema: {
          type: 'object',
          description: 'Optional schema for structured extraction'
        },
        maxTimeout: {
          type: 'number',
          description: 'Max timeout per article in ms',
          default: 10000
        }
      },
      required: ['articles']
    }
  },
  {
    name: 'extract_intelligence',
    description: 'Extract structured intelligence from content',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to extract from' },
        schema: {
          type: 'object',
          description: 'Extraction schema',
          properties: {
            quotes: { type: 'boolean' },
            metrics: { type: 'boolean' },
            entities: { type: 'boolean' },
            sentiment: { type: 'boolean' },
            key_points: { type: 'boolean' }
          }
        }
      },
      required: ['url', 'schema']
    }
  },
  {
    name: 'search_and_scrape',
    description: 'Search for content and scrape results',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', default: 10 },
        scrapeResults: { type: 'boolean', default: true }
      },
      required: ['query']
    }
  }
];

// Cache for avoiding duplicate scrapes (24 hour TTL)
const scrapeCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean old cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of scrapeCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      scrapeCache.delete(key);
    }
  }
}

// Batch scrape implementation with intelligent prioritization
async function batchScrapeArticles(args: any) {
  const { articles, formats = ['markdown'], onlyMainContent = true, extractSchema, maxTimeout = 10000 } = args;
  
  console.log(`🔥 Batch scraping ${articles.length} articles with Firecrawl`);
  cleanCache();
  
  // Sort by priority for intelligent ordering
  const sortedArticles = [...articles].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // Implement tiered scraping strategy
  const results = [];
  const errors = [];
  let scrapedCount = 0;
  let cachedCount = 0;
  
  // Process in batches of 5 for rate limiting
  const BATCH_SIZE = 5;
  for (let i = 0; i < sortedArticles.length; i += BATCH_SIZE) {
    const batch = sortedArticles.slice(i, i + BATCH_SIZE);
    const batchIndex = i; // Capture for closure
    
    const batchPromises = batch.map(async (article, articleIndex) => {
      try {
        // Check cache first
        const cached = scrapeCache.get(article.url);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          cachedCount++;
          console.log(`   📦 Using cached: ${article.url.substring(0, 50)}`);
          return {
            url: article.url,
            success: true,
            cached: true,
            data: cached.data,
            metadata: article.metadata
          };
        }
        
        // Scrape with Firecrawl
        const scrapeBody: any = {
          url: article.url,
          formats: formats,
          onlyMainContent: onlyMainContent  // v2 API uses this at root level, not in scrapeOptions
        };

        // Add authentication for premium sources
        let authCookie = null;
        let sourceName = '';

        if (article.url.includes('wsj.com') && WSJ_AUTH_COOKIE) {
          authCookie = WSJ_AUTH_COOKIE;
          sourceName = 'WSJ';
        } else if (article.url.includes('ft.com') && FT_AUTH_COOKIE) {
          authCookie = FT_AUTH_COOKIE;
          sourceName = 'FT';
        } else if (article.url.includes('bloomberg.com') && BLOOMBERG_AUTH_COOKIE) {
          authCookie = BLOOMBERG_AUTH_COOKIE;
          sourceName = 'Bloomberg';
        } else if (article.url.includes('nytimes.com') && NYTIMES_AUTH_COOKIE) {
          authCookie = NYTIMES_AUTH_COOKIE;
          sourceName = 'NYTimes';
        }

        if (authCookie) {
          scrapeBody.headers = {
            'Cookie': authCookie,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          };
          console.log(`   🔐 Using ${sourceName} authentication for: ${article.url.substring(0, 50)}`);
        }

        // Add extraction schema if provided
        if (extractSchema) {
          // Log what we're sending to Firecrawl for first article
          if (batchIndex === 0 && articleIndex === 0) {
            console.log('📤 DEBUG - Sending to Firecrawl:', {
              url: article.url.substring(0, 50),
              has_extract: true,
              schema_keys: Object.keys(extractSchema),
              formats: formats
            });
          }
          
          // For v2 API, we use the formats array with a json format object
          scrapeBody.formats = [
            'markdown',  // Always include markdown for content
            {
              type: 'json',
              schema: extractSchema,
              prompt: "Extract the requested information (quotes, metrics, entities, key points) from this article."
            }
          ];
        }
        
        const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scrapeBody),
          signal: AbortSignal.timeout(maxTimeout)
        });
        
        if (!response.ok) {
          throw new Error(`Scrape failed: ${response.status}`);
        }
        
        const data = await response.json();
        scrapedCount++;
        
        // DEBUG: Log what Firecrawl actually returns for first article in first batch
        if (extractSchema && batchIndex === 0 && articleIndex === 0) {
          console.log('🔍 DEBUG - Firecrawl v2 response structure:', {
            has_success: !!data.success,
            has_data: !!data.data,
            data_keys: data.data ? Object.keys(data.data).slice(0, 10) : [],
            has_json_at_root: !!data.json,  // v2 API returns json at root level
            has_json_in_data: !!data.data?.json,
            json_sample: data.json ? JSON.stringify(data.json).substring(0, 200) : 'none'
          });
        }
        
        // Cache successful scrapes
        if (data.success && data.data) {
          scrapeCache.set(article.url, {
            data: data.data,
            timestamp: Date.now()
          });
          
          // v2 API returns json at root level, not in data.data
          const extractedData = data.json || data.data?.json || data.extract || null;
          console.log(`   ✅ Scraped: ${article.url.substring(0, 50)} (${data.data.markdown?.length || 0} chars, extracted: ${!!extractedData})`);
          
          return {
            url: article.url,
            success: true,
            cached: false,
            data: data.data,
            metadata: article.metadata,
            extracted: extractedData
          };
        }
        
        throw new Error('No data returned from Firecrawl');
        
      } catch (error) {
        console.error(`   ❌ Failed: ${article.url.substring(0, 50)} - ${error.message}`);
        errors.push({
          url: article.url,
          error: error.message
        });
        
        return {
          url: article.url,
          success: false,
          error: error.message,
          metadata: article.metadata
        };
      }
    });
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < sortedArticles.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Calculate statistics
  const stats = {
    total_requested: articles.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    cached: cachedCount,
    freshly_scraped: scrapedCount,
    total_content_length: results
      .filter(r => r.success && r.data?.markdown)
      .reduce((sum, r) => sum + r.data.markdown.length, 0),
    extraction_success: results.filter(r => r.success && r.extracted).length
  };
  
  console.log('📊 Batch scraping complete:', stats);
  
  return {
    results,
    stats,
    errors
  };
}

// Extract intelligence from a single URL
async function extractIntelligence(args: any) {
  const { url, schema } = args;
  
  console.log(`🎯 Extracting intelligence from: ${url.substring(0, 50)}`);
  
  const extractionSchema: any = {};
  
  // Build extraction schema based on requested fields
  if (schema.quotes) {
    extractionSchema.quotes = {
      type: 'array',
      items: { type: 'string' },
      description: 'Important quotes from executives or experts'
    };
  }
  
  if (schema.metrics) {
    extractionSchema.metrics = {
      type: 'object',
      properties: {
        financial: { type: 'array', items: { type: 'string' } },
        percentages: { type: 'array', items: { type: 'string' } },
        dates: { type: 'array', items: { type: 'string' } }
      }
    };
  }
  
  if (schema.entities) {
    extractionSchema.entities = {
      type: 'object',
      properties: {
        companies: { type: 'array', items: { type: 'string' } },
        people: { type: 'array', items: { type: 'string' } },
        products: { type: 'array', items: { type: 'string' } }
      }
    };
  }
  
  if (schema.sentiment) {
    extractionSchema.sentiment = {
      type: 'string',
      enum: ['positive', 'negative', 'neutral', 'mixed']
    };
  }
  
  if (schema.key_points) {
    extractionSchema.key_points = {
      type: 'array',
      items: { type: 'string' },
      description: 'Key takeaways and insights'
    };
  }
  
  const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      extract: {
        schema: extractionSchema,
        systemPrompt: "Extract detailed intelligence from this article for competitive analysis."
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Extraction failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    url,
    success: data.success,
    content: data.data?.markdown,
    extracted: data.json || data.data?.json || data.extract,  // v2 API returns json at root level
    metadata: data.data?.metadata
  };
}

// Search and scrape implementation
async function searchAndScrape(args: any) {
  const { query, limit = 10, scrapeResults = true, tbs } = args;

  console.log(`🔍 Searching and scraping: "${query}"${tbs ? ` (timeRange: ${tbs})` : ''}`);

  // Build search request body with only valid Firecrawl v2 search parameters
  const searchBody: any = {
    query,
    limit
  };

  // Add time-based search filter if provided (e.g., "qdr:d" for last 24 hours)
  if (tbs) {
    searchBody.tbs = tbs;
  }

  // Add scrapeOptions only if we want to scrape the results
  if (scrapeResults) {
    searchBody.scrapeOptions = {
      formats: ['markdown'],
      onlyMainContent: true
    };
  }

  // First, perform search
  const searchResponse = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchBody)
  });
  
  if (!searchResponse.ok) {
    throw new Error(`Search failed: ${searchResponse.status}`);
  }
  
  const searchData = await searchResponse.json();

  // Firecrawl v2 returns results under searchData.data.web (or .images, .news)
  // Extract web results which is what we're searching
  const webResults = searchData.data?.web || [];

  return {
    query,
    success: searchData.success,
    results: webResults,
    count: webResults.length
  };
}

// Main server
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { method, params } = await req.json();
    
    console.log('📥 MCP Firecrawl Request:', { 
      method, 
      tool: params?.name,
      timestamp: new Date().toISOString()
    });
    
    // Handle MCP protocol
    if (method === 'tools/list') {
      return new Response(JSON.stringify({ tools: TOOLS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      let result;
      switch (name) {
        case 'batch_scrape_articles':
          result = await batchScrapeArticles(args);
          break;
        case 'extract_intelligence':
          result = await extractIntelligence(args);
          break;
        case 'search_and_scrape':
          result = await searchAndScrape(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      return new Response(JSON.stringify({
        content: [{
          type: 'text',
          text: JSON.stringify(result)
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error(`Unknown method: ${method}`);
    
  } catch (error) {
    console.error('❌ MCP Firecrawl error:', error);
    return new Response(JSON.stringify({
      content: [{
        type: 'error',
        error: error.message
      }]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});