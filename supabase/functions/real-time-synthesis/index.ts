import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');

if (!ANTHROPIC_API_KEY) {
  console.error('❌ No API key found - checked ANTHROPIC_API_KEY and CLAUDE_API_KEY');
}

/**
 * Real-Time Synthesis - Lightweight synthesis for real-time UI
 * NOT the full 5-personality executive synthesis
 */

interface Article {
  title: string;
  published_at?: string;
  publishedAt?: string;
  published?: string;  // ← enrichment uses this field
  summary?: string;
  events?: any[];
  entities?: any[];
  deep_analysis?: any;
}

interface EnrichedData {
  enriched_articles: Article[];
  extracted_data?: {
    events: any[];
    entities: any[];
    quotes: any[];
    metrics: any[];
  };
  organized_intelligence?: any;
  knowledge_graph?: any;
  profile?: any;
}

// Verify articles are within time window
function verifyArticleDates(articles: Article[], timeWindow: string): any {
  const now = new Date();
  const windowMs = timeWindow === '1hour' ? 3600000 :
                   timeWindow === '6hours' ? 21600000 :
                   86400000; // 24 hours

  const cutoff = new Date(now.getTime() - windowMs);

  const inWindow: Article[] = [];
  const rejected: Article[] = [];

  articles.forEach(article => {
    // Try all possible date fields (enrichment uses 'published')
    const articleDate = new Date(article.published_at || article.publishedAt || article.published || 0);
    if (articleDate > cutoff) {
      inWindow.push(article);
    } else {
      rejected.push(article);
    }
  });

  if (rejected.length > 0) {
    console.warn(`⚠️ DATE VERIFICATION: ${rejected.length} articles outside ${timeWindow} window`);
    rejected.forEach(a => {
      const dateStr = a.published_at || a.publishedAt || a.published || 'undefined';
      console.warn(`   - "${a.title?.substring(0, 80)}" published at ${dateStr}`);
    });
  }

  const sorted = [...inWindow].sort((a, b) => {
    const dateA = new Date(a.published_at || a.publishedAt || a.published || 0);
    const dateB = new Date(b.published_at || b.publishedAt || b.published || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return {
    in_window: inWindow,
    rejected: rejected,
    verification_passed: rejected.length === 0,
    newest_date: sorted[0]?.published_at || sorted[0]?.publishedAt || sorted[0]?.published || null,
    oldest_date: sorted[sorted.length - 1]?.published_at || sorted[sorted.length - 1]?.publishedAt || sorted[sorted.length - 1]?.published || null,
    articles_in_window: inWindow.length,
    articles_rejected: rejected.length
  };
}

// Calculate article age in human-readable format
function calculateAge(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMinutes = Math.floor((diffMs % 3600000) / 60000);

  if (diffHours < 1) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}

async function synthesizeRealTimeIntelligence(args: any) {
  const {
    enriched_data,
    organization_name,
    time_window = '6hours',
    profile = {}
  } = args;

  console.log('🎯 Real-Time Synthesis Starting:', {
    timestamp: new Date().toISOString(),
    organization: organization_name,
    time_window: time_window,
    articles_count: enriched_data?.enriched_articles?.length || 0
  });

  // Step 1: Verify article dates
  const articles = enriched_data?.enriched_articles || [];
  const dateVerification = verifyArticleDates(articles, time_window);

  console.log('📅 Date Verification:', {
    in_window: dateVerification.articles_in_window,
    rejected: dateVerification.articles_rejected,
    passed: dateVerification.verification_passed,
    newest: dateVerification.newest_date,
    oldest: dateVerification.oldest_date
  });

  // Use only articles in window
  const validArticles = dateVerification.in_window;

  if (validArticles.length === 0) {
    console.warn('⚠️ No articles in time window - returning empty synthesis');
    return {
      breaking_summary: `No recent developments found in the last ${time_window}.`,
      critical_alerts: [],
      watch_list: [],
      date_verification: dateVerification,
      metadata: {
        articles_analyzed: 0,
        events_extracted: 0,
        entities_mentioned: 0,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Step 2: Extract events from enriched data
  const events = enriched_data?.extracted_data?.events ||
                 enriched_data?.organized_intelligence?.events || [];
  const entities = enriched_data?.extracted_data?.entities || [];
  const quotes = enriched_data?.extracted_data?.quotes || [];

  console.log('📊 Intelligence Data:', {
    events: events.length,
    entities: entities.length,
    quotes: quotes.length
  });

  // Step 3: Build prompt for Claude
  const windowStart = new Date(Date.now() - (time_window === '1hour' ? 3600000 : time_window === '6hours' ? 21600000 : 86400000));
  const windowEnd = new Date();

  const articleSummaries = validArticles.map((a, i) => {
    const dateStr = a.published_at || a.publishedAt || a.published || '';
    const age = calculateAge(dateStr);
    const eventsList = a.events?.map(e => e.description).slice(0, 3) || [];
    return `${i+1}. "${a.title}"
   Published: ${dateStr} (${age})
   Summary: ${a.summary?.substring(0, 200) || 'N/A'}
   Key Events: ${eventsList.join('; ') || 'None'}`;
  }).join('\n\n');

  const eventsList = events.slice(0, 30).map((e, i) =>
    `${i+1}. [${e.type?.toUpperCase()}] ${e.entity}: ${e.description}`
  ).join('\n');

  const prompt = `YOU ARE A REAL-TIME INTELLIGENCE ANALYST

CRITICAL: You are analyzing ONLY articles from the last ${time_window}.
TIME WINDOW: ${windowStart.toISOString()} to ${windowEnd.toISOString()}

ORGANIZATION: ${organization_name}

VERIFIED ARTICLES (${validArticles.length} total, ALL within time window):
${articleSummaries}

PRE-EXTRACTED EVENTS:
${eventsList || 'No events extracted'}

YOUR TASK:
Create a real-time intelligence brief with:
1. breaking_summary: 2-3 sentences - What happened in the last ${time_window}?
2. critical_alerts: Urgent items requiring immediate attention
3. watch_list: Entities/competitors to monitor closely

RESPOND IN JSON FORMAT:
{
  "breaking_summary": "In the last ${time_window}, [concise summary of top 2-3 developments]",
  "critical_alerts": [
    {
      "urgency": "immediate" | "this_week" | "this_month",
      "category": "crisis" | "opportunity" | "threat" | "competitive_move",
      "title": "Brief title",
      "summary": "1-2 sentence summary",
      "recommended_action": "Specific action to take",
      "time_to_act": "Timeframe for action",
      "source_urls": ["article urls if available"]
    }
  ],
  "watch_list": [
    {
      "entity": "Competitor/stakeholder name",
      "event": "What they did",
      "implication": "Why it matters for ${organization_name}",
      "urgency": "high" | "medium" | "low"
    }
  ]
}

CRITICAL RULES:
- Only mention developments from the articles above
- Be specific - reference actual companies, events, numbers
- If no major developments, say so clearly
- Focus on actionable intelligence`;

  console.log('🚀 Calling Claude for real-time synthesis...');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API Error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const synthesisText = data.content?.[0]?.text || '{}';

    console.log('✅ Claude response received');

    // Parse JSON response
    let synthesis;
    try {
      let cleanText = synthesisText.trim();

      // Remove markdown code blocks
      if (cleanText.includes('```json')) {
        const jsonMatch = cleanText.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) cleanText = jsonMatch[1].trim();
      } else if (cleanText.includes('```')) {
        const codeMatch = cleanText.match(/```\s*([\s\S]*?)```/);
        if (codeMatch) cleanText = codeMatch[1].trim();
      }

      // Extract JSON object
      if (!cleanText.startsWith('{')) {
        const jsonObjMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonObjMatch) cleanText = jsonObjMatch[0];
      }

      synthesis = JSON.parse(cleanText);
    } catch (e) {
      console.error('❌ Failed to parse Claude response:', e.message);
      console.log('Raw response:', synthesisText.substring(0, 500));

      // Fallback
      synthesis = {
        breaking_summary: `Analysis of ${validArticles.length} articles from the last ${time_window} completed.`,
        critical_alerts: [],
        watch_list: []
      };
    }

    // Return final result
    return {
      breaking_summary: synthesis.breaking_summary || `No major developments in the last ${time_window}.`,
      critical_alerts: synthesis.critical_alerts || [],
      watch_list: synthesis.watch_list || [],
      date_verification: {
        time_window_requested: time_window,
        articles_in_window: dateVerification.articles_in_window,
        articles_outside_window: dateVerification.articles_rejected,
        newest_article_date: dateVerification.newest_date,
        oldest_article_date: dateVerification.oldest_date,
        verification_passed: dateVerification.verification_passed
      },
      metadata: {
        articles_analyzed: validArticles.length,
        events_extracted: events.length,
        entities_mentioned: entities.length,
        quotes_found: quotes.length,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Synthesis error:', error);

    // Return fallback
    return {
      breaking_summary: `Error generating synthesis for ${time_window}. ${validArticles.length} articles collected.`,
      critical_alerts: [],
      watch_list: [],
      date_verification: dateVerification,
      metadata: {
        articles_analyzed: validArticles.length,
        events_extracted: events.length,
        entities_mentioned: entities.length,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    };
  }
}

// HTTP handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    console.log('📥 Real-Time Synthesis Request:', {
      has_enriched_data: !!body.enriched_data,
      organization: body.organization_name,
      time_window: body.time_window
    });

    const result = await synthesizeRealTimeIntelligence(body);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Real-Time Synthesis Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
