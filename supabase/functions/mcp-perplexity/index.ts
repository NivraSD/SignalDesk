// MCP Perplexity Server - Reliable Web Search with Date Filtering
// Provides intelligent search capabilities with actual date filtering that works

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Configuration
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';

// MCP Tools Definition
const TOOLS = [
  {
    name: 'search',
    description: 'Search the web with reliable date filtering - returns ranked URLs with snippets',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (supports OR operators, quotes for exact phrases)'
        },
        search_recency_filter: {
          type: 'string',
          enum: ['day', 'week', 'month', 'year'],
          description: 'Filter by recency (recommended for news)'
        },
        search_after_date_filter: {
          type: 'string',
          description: 'Filter results after this date (format: MM/DD/YYYY)'
        },
        search_before_date_filter: {
          type: 'string',
          description: 'Filter results before this date (format: MM/DD/YYYY)'
        },
        max_results: {
          type: 'number',
          default: 10,
          description: 'Maximum number of results to return'
        },
        search_domain_filter: {
          type: 'array',
          description: 'Limit results to specific domains',
          items: { type: 'string' }
        }
      },
      required: ['query']
    }
  },
  {
    name: 'chat',
    description: 'Quick question answering with real-time web context using sonar-pro',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        search_recency_filter: {
          type: 'string',
          enum: ['day', 'week', 'month', 'year']
        },
        return_citations: { type: 'boolean', default: true }
      },
      required: ['query']
    }
  }
];

// Search implementation using Search API (not Chat Completions!)
async function performSearch(args: any) {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  console.log(`🔍 Perplexity Search API: "${args.query.substring(0, 60)}..."`);
  console.log(`   Recency filter: ${args.search_recency_filter || 'none'}`);
  if (args.search_after_date_filter) {
    console.log(`   After: ${args.search_after_date_filter}`);
  }

  // Build request body for Search API
  const requestBody: any = {
    query: args.query,
    max_results: args.max_results || 10
  };

  // Add date filters (cannot combine recency_filter with after/before filters)
  if (args.search_recency_filter) {
    requestBody.search_recency_filter = args.search_recency_filter;
  } else {
    if (args.search_after_date_filter) {
      requestBody.search_after_date = args.search_after_date_filter;
    }
    if (args.search_before_date_filter) {
      requestBody.search_before_date = args.search_before_date_filter;
    }
  }

  // Add domain filter if provided
  if (args.search_domain_filter && args.search_domain_filter.length > 0) {
    requestBody.search_domain_filter = args.search_domain_filter;
  }

  // Use the SEARCH API endpoint, not chat/completions!
  const response = await fetch(`${PERPLEXITY_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity Search API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Search API returns results directly with title, url, snippet, date
  const results = data.results || [];

  console.log(`   ✅ Found ${results.length} results`);

  return {
    query: args.query,
    results: results, // Contains title, url, snippet, date, last_updated
    count: results.length,
    api_used: 'search',
    filters_applied: {
      recency: args.search_recency_filter,
      after_date: args.search_after_date_filter,
      before_date: args.search_before_date_filter,
      domains: args.search_domain_filter
    }
  };
}

// Chat implementation for Q&A
async function performChat(args: any) {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  console.log(`💬 Perplexity Chat: "${args.query.substring(0, 60)}..."`);

  const requestBody: any = {
    model: 'sonar-pro',
    messages: [
      {
        role: 'user',
        content: args.query
      }
    ],
    return_citations: args.return_citations !== false,
    return_related_questions: false
  };

  if (args.search_recency_filter) {
    requestBody.search_recency_filter = args.search_recency_filter;
  }

  const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  return {
    answer: data.choices[0].message.content,
    citations: data.citations || [],
    model_used: 'sonar-pro'
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

    console.log(`\n🎯 MCP Perplexity Request: ${method}`);

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
          case 'chat':
            result = await performChat(args);
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
    console.error('❌ MCP Perplexity error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
