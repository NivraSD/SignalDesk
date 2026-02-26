// MCP You.com Server - Web and News Search with Date Filtering
// Provides search capabilities with reliable date filtering via freshness parameter

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Configuration
const YOU_API_KEY = Deno.env.get('YOU_API_KEY');
const YOU_BASE_URL = 'https://api.ydc-index.io';

// MCP Tools Definition
const TOOLS = [
  {
    name: 'search',
    description: 'Search web and news with date filtering - returns both web and news results',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (supports OR operators, quotes for exact phrases)'
        },
        freshness: {
          type: 'string',
          description: 'Time filter: "day", "week", "month", "year", or date range "YYYY-MM-DDtoYYYY-MM-DD"'
        },
        count: {
          type: 'number',
          default: 10,
          description: 'Maximum results per section (web and news)'
        },
        country: {
          type: 'string',
          description: 'Country code for geographic focus (e.g., "US", "JP")'
        },
        livecrawl: {
          type: 'string',
          enum: ['web', 'news', 'all'],
          description: 'Get full page content for results'
        },
        livecrawl_formats: {
          type: 'string',
          enum: ['html', 'markdown'],
          description: 'Format for livecrawl content'
        }
      },
      required: ['query']
    }
  }
];

// Search implementation using You.com API
async function performSearch(args: any) {
  if (!YOU_API_KEY) {
    throw new Error('YOU_API_KEY not configured');
  }

  console.log(`🔍 You.com Search: "${args.query.substring(0, 60)}..."`);
  console.log(`   Freshness: ${args.freshness || 'none'}`);
  console.log(`   Count: ${args.count || 10}`);

  // Build URL with query parameters
  const url = new URL(`${YOU_BASE_URL}/search`);
  url.searchParams.set('query', args.query);

  if (args.count) {
    url.searchParams.set('count', args.count.toString());
  }

  if (args.freshness) {
    url.searchParams.set('freshness', args.freshness);
  }

  if (args.country) {
    url.searchParams.set('country', args.country);
  }

  if (args.livecrawl) {
    url.searchParams.set('livecrawl', args.livecrawl);
  }

  if (args.livecrawl_formats) {
    url.searchParams.set('livecrawl_formats', args.livecrawl_formats);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-API-Key': YOU_API_KEY
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`You.com API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const webResults = data.web || [];
  const newsResults = data.news || [];

  console.log(`   ✅ Found ${webResults.length} web + ${newsResults.length} news results`);

  return {
    query: args.query,
    web_results: webResults,
    news_results: newsResults,
    web_count: webResults.length,
    news_count: newsResults.length,
    total_count: webResults.length + newsResults.length,
    filters_applied: {
      freshness: args.freshness,
      country: args.country,
      livecrawl: args.livecrawl
    }
  };
}

// Main MCP handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { method, params } = body;

    console.log(`\n🎯 MCP You.com Request: ${method}`);

    // Handle MCP protocol methods
    switch (method) {
      case 'tools/list':
        return new Response(JSON.stringify({
          tools: TOOLS
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'tools/call': {
        const { name, arguments: args } = params;

        let result;
        switch (name) {
          case 'search':
            result = await performSearch(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return new Response(JSON.stringify({
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown method: ${method}`);
    }

  } catch (error: any) {
    console.error('❌ MCP You.com error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
