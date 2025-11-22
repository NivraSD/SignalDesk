// Monitor Stage 2: AI-Powered Intelligent Relevance Filtering
// Uses Claude to understand if articles are actually about the organization's targets

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper: Extract date from URL patterns
function extractDateFromUrl(url: string): string | null {
  try {
    const patterns = [
      /\/(\d{4})\/(\d{2})\/(\d{2})/,           // /2025/11/21/
      /\/(\d{4})-(\d{2})-(\d{2})/,             // /2025-11-21/
      /-(\d{4})-(\d{2})-(\d{2})-/,             // -2025-11-21-
      /\/(\d{4})(\d{2})(\d{2})\//,             // /20251121/
      /news-(\d{4})-(\d{2})-(\d{2})/,          // news-2025-11-21
      /article-(\d{4})-(\d{2})-(\d{2})/,       // article-2025-11-21
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

interface Article {
  id?: number;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  source?: string;
  published_at?: string;
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articles, organization_name, organization_id, profile } = await req.json();

    console.log(`🔍 Relevance filtering for ${organization_name}: ${articles?.length || 0} articles`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        relevant_articles: [],
        filtered_out: 0,
        total: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load intelligence targets with monitoring context
    console.log(`📊 Loading intelligence targets for ${organization_name}...`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: targets, error: targetsError } = await supabase
      .from('intelligence_targets')
      .select('name, type, monitoring_context, industry_context, relevance_filter, priority')
      .eq('organization_id', organization_id)
      .eq('active', true);

    if (targetsError) {
      console.error('❌ Failed to load intelligence targets:', targetsError);
      throw new Error(`Failed to load targets: ${targetsError.message}`);
    }

    console.log(`✅ Loaded ${targets?.length || 0} intelligence targets`);

    const competitors = targets?.filter(t => t.type === 'competitor').map(t => ({
      name: t.name,
      monitoring_context: t.monitoring_context,
      industry_context: t.industry_context,
      keywords: t.relevance_filter?.keywords || []
    })) || [];

    const stakeholders = targets?.filter(t => t.type === 'stakeholder').map(t => ({
      name: t.name,
      monitoring_context: t.monitoring_context,
      industry_context: t.industry_context,
      keywords: t.relevance_filter?.keywords || []
    })) || [];

    if (competitors.length === 0 && stakeholders.length === 0) {
      console.warn('⚠️ No intelligence targets found - returning all articles');
      return new Response(JSON.stringify({
        relevant_articles: articles,
        filtered_out: 0,
        total: articles.length,
        warning: 'No intelligence targets configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Filter out old articles (keep last 7 days)
    // Extract dates from URLs as fallback before filtering
    const RECENCY_DAYS = 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RECENCY_DAYS);

    const recentArticles = articles.filter(article => {
      let publishedDate: Date | null = null;

      // Try explicit date fields first
      if (article.published_at || article.publishDate) {
        publishedDate = new Date(article.published_at || article.publishDate);
      }

      // Fallback: Extract date from URL (common patterns: /2024/05/15/ or /2024-05-15-)
      if (!publishedDate || isNaN(publishedDate.getTime())) {
        const urlDatePatterns = [
          /\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//,  // /2024/05/15/
          /\/(\d{4})-(\d{1,2})-(\d{1,2})-/,     // /2024-05-15-
          /\/(\d{4})(\d{2})(\d{2})\//           // /20240515/
        ];

        for (const pattern of urlDatePatterns) {
          const match = article.url?.match(pattern);
          if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // JS months are 0-indexed
            const day = parseInt(match[3]);
            publishedDate = new Date(year, month, day);
            if (!isNaN(publishedDate.getTime())) {
              console.log(`   📅 Extracted date from URL for "${article.title?.substring(0, 40)}...": ${publishedDate.toDateString()}`);
              break;
            }
          }
        }
      }

      // If still no date after URL extraction, REJECT (can't verify recency)
      if (!publishedDate || isNaN(publishedDate.getTime())) {
        console.log(`   ⏭️  Filtering out undated article: "${article.title?.substring(0, 60)}..." (no date available)`);
        return false;
      }

      const isRecent = publishedDate >= cutoffDate;

      if (!isRecent) {
        console.log(`   ⏭️  Filtering out old article: "${article.title?.substring(0, 60)}..." (${publishedDate.toDateString()})`);
      }

      return isRecent;
    });

    const filteredByAge = articles.length - recentArticles.length;
    console.log(`📅 Date filtering: ${articles.length} → ${recentArticles.length} articles (removed ${filteredByAge} older than ${RECENCY_DAYS} days)`);

    if (recentArticles.length === 0) {
      console.log('⚠️ No recent articles after date filtering');
      return new Response(JSON.stringify({
        relevant_articles: [],
        filtered_out: articles.length,
        filtered_by_age: filteredByAge,
        total: articles.length,
        message: `All ${articles.length} articles were older than ${RECENCY_DAYS} days`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use Claude to intelligently filter articles in batches
    console.log(`🤖 Using Claude to intelligently filter ${recentArticles.length} recent articles...`);

    const batchSize = 20; // Process 20 articles at a time
    const relevantArticles: any[] = [];

    for (let i = 0; i < recentArticles.length; i += batchSize) {
      const batch = recentArticles.slice(i, i + batchSize);

      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(recentArticles.length/batchSize)} (${batch.length} articles)...`);

      const prompt = `You are an INTELLIGENCE ANALYST filtering news for ${organization_name}, a ${profile?.industry || 'trading'} company.

YOUR MISSION:
Cast a WIDE net. This company needs strategic intelligence about their industry, competitors, and market forces.

CONTEXT:
Industry: ${profile?.industry || 'trading'}
Competitors: ${competitors.map(c => c.name).join(', ')}
Stakeholders: ${stakeholders.map(s => s.name).join(', ')}

✅ RELEVANT ARTICLES (be INCLUSIVE):

1. DIRECT COMPETITOR INTELLIGENCE:
   - Any news about competitors (launches, hires, partnerships, acquisitions, crises, lawsuits, investigations)
   - Competitor financial results, strategy shifts, market moves

2. INDUSTRY CONTEXT (CRITICAL - even without competitor mention):
   - Major industry lawsuits/investigations (e.g., "Total Energies war crimes" affects trading industry)
   - Regulatory changes affecting ${profile?.industry || 'trading'}
   - Market trends, commodity price shifts, supply chain disruptions
   - Technology innovations in the industry
   - Major M&A activity in the sector

3. STAKEHOLDER ACTIVITY:
   - Policy announcements, regulatory changes
   - Government initiatives affecting the industry

4. STRATEGIC SIGNALS:
   - Emerging markets, new partnerships
   - ESG/sustainability trends in industry
   - Geopolitical events affecting ${profile?.industry || 'trading'}

❌ NOT RELEVANT:
   - Articles about ${organization_name} themselves
   - Completely unrelated industries (unless clear spillover effect)
   - Pure spam/promotional content

ARTICLES:
${batch.map((a, idx) => `
[${idx + 1}]
Title: ${a.title}
Description: ${a.description || 'N/A'}
${a.content ? `Content: ${a.content.substring(0, 500)}` : ''}
`).join('\n---\n')}

RESPOND IN JSON:
{
  "relevant": [
    {
      "article_number": 1,
      "is_relevant": true,
      "relevance_type": "competitor_intelligence" OR "industry_context" OR "regulatory" OR "strategic_signal",
      "relevance_score": 85,
      "reason": "Why this matters for ${organization_name}"
    }
  ]
}

Be INCLUSIVE - when in doubt, include it. Better to have too many than miss critical intelligence.`;

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
            max_tokens: 4000,
            temperature: 0.3,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        });

        if (!response.ok) {
          throw new Error(`Claude API error: ${response.statusText}`);
        }

        const data = await response.json();
        const claudeResponse = data.content[0].text;

        // Parse Claude's JSON response
        const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('❌ Failed to parse Claude response - no JSON found');
          continue;
        }

        const filterResults = JSON.parse(jsonMatch[0]);

        // Add relevant articles with enriched metadata
        filterResults.relevant?.forEach((result: any) => {
          const articleIdx = result.article_number - 1;
          if (articleIdx >= 0 && articleIdx < batch.length) {
            relevantArticles.push({
              ...batch[articleIdx],
              // Top-level fields for enrichment stage
              pr_relevance_score: result.relevance_score || 75,
              pr_category: result.relevance_type || 'industry_context',
              // Nested metadata for reference
              relevance_metadata: {
                target: result.target_mentioned,
                relevance_score: result.relevance_score,
                relevance_type: result.relevance_type,
                reason: result.reason,
                filtered_by: 'claude_ai'
              }
            });
          }
        });

        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${filterResults.relevant?.length || 0} relevant articles found`);

      } catch (claudeError: any) {
        console.error(`❌ Claude filtering error for batch ${Math.floor(i/batchSize) + 1}:`, claudeError.message);
        // On error, include the batch as-is with lower confidence
        batch.forEach(article => {
          relevantArticles.push({
            ...article,
            // Top-level fields for enrichment stage
            pr_relevance_score: 50,
            pr_category: 'general',
            // Nested metadata for reference
            relevance_metadata: {
              relevance_score: 50,
              reason: 'Included due to filtering error',
              filtered_by: 'fallback'
            }
          });
        });
      }
    }

    const filteredByRelevance = recentArticles.length - relevantArticles.length;
    const totalFilteredOut = articles.length - relevantArticles.length;

    console.log(`✅ Relevance filtering complete:`);
    console.log(`   Original articles: ${articles.length}`);
    console.log(`   After date filter: ${recentArticles.length} (removed ${filteredByAge})`);
    console.log(`   After relevance filter: ${relevantArticles.length} (removed ${filteredByRelevance})`);
    console.log(`   Total filtered out: ${totalFilteredOut}`);
    console.log(`   Keep rate: ${((relevantArticles.length / articles.length) * 100).toFixed(1)}%`);

    // SCRAPE TOP ARTICLES: Get full content and extract dates
    console.log('\n🔥 Scraping top articles for full content and date extraction...');

    const articlesToScrape = relevantArticles
      .filter(a => a.pr_relevance_score >= 60)
      .slice(0, 15); // Limit to 15 high-value articles

    console.log(`   Scraping ${articlesToScrape.length} top articles (score 60+)`);

    if (articlesToScrape.length > 0) {
      try {
        const firecrawlResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-firecrawl`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            method: 'tools/call',
            params: {
              name: 'batch_scrape_articles',
              arguments: {
                articles: articlesToScrape.map(article => ({
                  url: article.url,
                  priority: article.pr_relevance_score,
                  metadata: {
                    title: article.title,
                    category: article.pr_category
                  }
                })),
                formats: ['markdown'],
                maxTimeout: 10000
              }
            }
          })
        });

        if (firecrawlResponse.ok) {
          const firecrawlData = await firecrawlResponse.json();
          const scrapeResults = JSON.parse(firecrawlData.content[0].text);

          console.log(`   ✅ Scraped ${scrapeResults.results?.length || 0} articles`);

          // Merge scraped content and extract dates
          for (const result of scrapeResults.results || []) {
            if (result.success && result.data) {
              const article = relevantArticles.find(a => a.url === result.url);
              if (article) {
                const markdown = result.data.markdown || result.data.content || '';
                const metadata = result.data.metadata || {};

                if (markdown && markdown.length > 500) {
                  article.full_content = markdown;
                  article.content_length = markdown.length;
                  article.has_full_content = true;

                  // Priority 1: Check Firecrawl metadata for publish date
                  const metadataDate = metadata.publishDate ||
                                      metadata.publishedTime ||
                                      metadata.datePublished ||
                                      metadata.article?.publishedTime ||
                                      metadata.ogArticlePublishedTime;

                  if (metadataDate) {
                    try {
                      const parsedDate = new Date(metadataDate);
                      if (!isNaN(parsedDate.getTime())) {
                        article.published_at = parsedDate.toISOString();
                        console.log(`      ✅ Extracted date from metadata for "${article.title?.substring(0, 40)}...": ${parsedDate.toDateString()}`);
                        continue; // Skip content regex if we found metadata date
                      }
                    } catch (e) {
                      // Fall through to content extraction
                    }
                  }

                  // Priority 2: Try extracting date from URL
                  const urlDate = extractDateFromUrl(article.url);
                  if (urlDate) {
                    article.published_at = urlDate;
                    console.log(`      ✅ Extracted date from URL for "${article.title?.substring(0, 40)}...": ${new Date(urlDate).toDateString()}`);
                    continue;
                  }

                  // Priority 3: Extract publish date from content using patterns
                  const datePatterns = [
                    /published[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
                    /(\d{1,2}\s+[A-Za-z]+\s+\d{4})/,
                    /(\d{4}-\d{2}-\d{2})/,
                    /([A-Za-z]+\s+\d{1,2},?\s+\d{4})/
                  ];

                  for (const pattern of datePatterns) {
                    const match = markdown.match(pattern);
                    if (match) {
                      try {
                        const parsedDate = new Date(match[1]);
                        if (!isNaN(parsedDate.getTime())) {
                          article.published_at = parsedDate.toISOString();
                          console.log(`      ✅ Extracted date from content for "${article.title?.substring(0, 40)}...": ${parsedDate.toDateString()}`);
                          break;
                        }
                      } catch (e) {
                        // Continue to next pattern
                      }
                    }
                  }
                }
              }
            }
          }

          const enhancedCount = relevantArticles.filter(a => a.has_full_content).length;
          const datesExtracted = relevantArticles.filter(a => a.has_full_content && a.published_at).length;
          console.log(`   ✅ Enhanced ${enhancedCount} articles with full content`);
          console.log(`   📅 Extracted dates for ${datesExtracted} articles`);
        }
      } catch (error: any) {
        console.error(`   ❌ Scraping error: ${error.message}`);
        // Continue without scraping
      }
    }

    return new Response(JSON.stringify({
      relevant_articles: relevantArticles,
      filtered_out: totalFilteredOut,
      filtered_by_age: filteredByAge,
      filtered_by_relevance: filteredByRelevance,
      total: articles.length,
      keep_rate: ((relevantArticles.length / articles.length) * 100).toFixed(1) + '%',
      scraped_articles: relevantArticles.filter(a => a.has_full_content).length,
      targets_loaded: {
        competitors: competitors.length,
        stakeholders: stakeholders.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Relevance filtering error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
