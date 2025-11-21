// Source-Direct Intelligence Monitor
// Scrapes trusted news sources directly instead of relying on search APIs
// Uses Claude to filter for relevance before batch scraping

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CODE_VERSION = 'v2025-11-21-listing-only';

// Extract HTML sources from company profile sources (selected by mcp-discovery)
function getHTMLSourcesFromProfile(companyProfile: any) {
  const sources = companyProfile?.sources || {};
  const allSources = [];

  // Collect all sources from all categories
  ['competitive', 'media', 'regulatory', 'market', 'forward', 'specialized'].forEach(category => {
    if (sources[category]) {
      allSources.push(...sources[category]);
    }
  });

  // Filter to HTML sources only and map to our format
  const htmlSources = allSources
    .filter((s: any) => s.type === 'html')
    .map((s: any) => ({
      name: s.name,
      url: s.url,
      priority: s.priority === 'critical' ? 1 : s.priority === 'high' ? 2 : 3
    }));

  console.log(`   ✅ Found ${htmlSources.length} HTML sources from company profile`);
  return htmlSources;
}

// Fallback: Load HTML sources from master-source-registry
async function loadHTMLSourcesFromRegistry(companyProfile: any, organizationName: string) {
  const industry = companyProfile?.industry || 'conglomerate';
  const description = companyProfile?.description ||
    `${organizationName}${companyProfile?.sub_industry ? ` - ${companyProfile.sub_industry}` : ''}`;

  console.log(`   📚 Calling master-source-registry for industry: ${industry}`);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/master-source-registry`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      industry: industry.toLowerCase(),
      organization_name: organizationName,
      company_description: description
    })
  });

  if (!response.ok) {
    throw new Error(`Master source registry failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.data) {
    throw new Error('No sources returned from registry');
  }

  // Get HTML sources from competitive category
  let htmlSources = (data.data.competitive || [])
    .filter((s: any) => s.type === 'html')
    .map((s: any) => ({
      name: s.name,
      url: s.url,
      priority: s.priority === 'critical' ? 1 : s.priority === 'high' ? 2 : 3
    }));

  // If no HTML sources for this industry, fall back to conglomerate
  if (htmlSources.length === 0 && industry.toLowerCase() !== 'conglomerate') {
    console.log(`   ⚠️ No HTML sources for '${industry}', trying conglomerate...`);
    const fallbackResponse = await fetch(`${SUPABASE_URL}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        industry: 'conglomerate',
        organization_name: organizationName,
        company_description: description
      })
    });

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      htmlSources = (fallbackData.data?.competitive || [])
        .filter((s: any) => s.type === 'html')
        .map((s: any) => ({
          name: s.name,
          url: s.url,
          priority: s.priority === 'critical' ? 1 : s.priority === 'high' ? 2 : 3
        }));
    }
  }

  console.log(`   ✅ Registry returned ${htmlSources.length} HTML sources`);
  return htmlSources;
}

// MCP Client for Firecrawl
async function callMCP(tool: string, args: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-firecrawl`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      method: 'tools/call',
      params: {
        name: tool,
        arguments: args
      }
    })
  });

  if (!response.ok) {
    throw new Error(`MCP call failed: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.content[0].text);
}

// Call Claude for relevance filtering
async function filterWithClaude(articles: any[], context: string, discoveryTargets: any) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `You are filtering news articles for relevance to an organization's competitive intelligence needs.

ORGANIZATION: ${context}

KEY COMPETITORS: ${Array.from(discoveryTargets.competitors || []).slice(0, 20).join(', ')}

KEY STAKEHOLDERS: ${Array.from(discoveryTargets.stakeholders || []).slice(0, 20).join(', ')}

KEY PRODUCTS/SERVICES: ${Array.from(discoveryTargets.products || []).slice(0, 10).join(', ')}

ARTICLES TO FILTER (${articles.length} total):
${articles.map((a, i) => `${i + 1}. [${a.source}] ${a.title}\n   URL: ${a.url}\n   Published: ${a.published_date || 'unknown'}`).join('\n\n')}

TASK: Return the article numbers (1-${articles.length}) that are relevant to this organization's competitive intelligence.

An article is relevant if it mentions:
- The organization's competitors (${Array.from(discoveryTargets.competitors || []).slice(0, 10).join(', ')})
- Key stakeholders (${Array.from(discoveryTargets.stakeholders || []).slice(0, 10).join(', ')})
- Industry topics: ${Array.from(discoveryTargets.products || []).slice(0, 5).join(', ')}
- ${context} industry news and trends

PRIORITIZATION:
1. Direct competitor mentions = HIGH relevance (score: 0.8-1.0)
2. Industry trends affecting this sector = MEDIUM relevance (score: 0.6-0.8)
3. Stakeholder activity = MEDIUM relevance (score: 0.6-0.8)
4. Tangentially related = LOW relevance (score: 0.4-0.6)

BE INCLUSIVE: When in doubt, include it (better to have more context than miss important developments).

Return JSON array of relevant article numbers with scores:
[{"index": 1, "score": 0.95, "reason": "Brief reason"}, ...]`
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude filtering failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn('⚠️  No JSON found in Claude response, returning all articles');
    return articles.map((a, i) => ({ ...a, relevance_score: 0.5, relevance_reason: 'Auto-included (filter failed)' }));
  }

  const filtered = JSON.parse(jsonMatch[0]);

  // Map back to articles with scores
  return filtered.map((f: any) => ({
    ...articles[f.index - 1],
    relevance_score: f.score,
    relevance_reason: f.reason
  }));
}

// Scrape a source listing page and extract article links
async function scrapeSouceListing(source: any) {
  console.log(`\n📰 Scraping ${source.name}...`);

  try {
    // DIRECTLY scrape the listing page URL (no search!)
    const result = await callMCP('batch_scrape_articles', {
      articles: [{
        url: source.url,
        priority: source.priority,
        metadata: { source: source.name }
      }],
      formats: ['markdown'],
      maxTimeout: 20000
    });

    if (!result.results || result.results.length === 0 || !result.results[0].success) {
      console.warn(`   ⚠️  Failed to scrape ${source.name}`);
      return [];
    }

    const markdown = result.results[0].data?.markdown || '';
    console.log(`   📄 Scraped ${markdown.length} chars of content`);

    // Extract article links from markdown
    // Look for markdown links: [title](url) or HTML links in the markdown
    const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const matches = [...markdown.matchAll(linkPattern)];

    console.log(`   🔗 Found ${matches.length} links`);

    // Filter to only article URLs (not navigation, social, etc.)
    const articles = matches
      .map(match => ({
        title: match[1].trim(),
        url: match[2],
        source: source.name,
        source_priority: source.priority
      }))
      .filter((a: any) => {
        // INDUSTRY-AGNOSTIC filtering: Remove obvious non-content, keep everything else
        const url = a.url.toLowerCase();
        const title = a.title.toLowerCase();

        // Reject navigation, social, and utility pages
        const isNonContent = (
          // Social/sharing
          url.includes('facebook.com') || url.includes('twitter.com') || url.includes('linkedin.com') ||
          url.includes('instagram.com') || url.includes('youtube.com') ||
          // Utility pages
          url.includes('/newsletter') || url.includes('/subscribe') || url.includes('/login') ||
          url.includes('/signup') || url.includes('/register') || url.includes('/contact') ||
          url.includes('/about') || url.includes('/privacy') || url.includes('/terms') ||
          // Navigation elements
          title.includes('search') || title.includes('menu') || title.includes('home page') ||
          title.includes('sign in') || title.includes('log in') ||
          // Generic non-article patterns
          url.endsWith('/') && url.split('/').length <= 4 // Homepage or section page
        );

        // Accept if has substantial title and doesn't match exclusions
        return !isNonContent && a.title.length > 15;
      });

    console.log(`   ✅ ${articles.length} article links extracted`);

    // For now, assume all articles from listing page are recent
    // We'll let Claude filter for actual relevance
    return articles;

  } catch (error) {
    console.error(`   ❌ Failed to scrape ${source.name}:`, error.message);
    return [];
  }
}

// Main monitoring function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, organization_name } = await req.json();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 SOURCE-DIRECT MONITORING: ${organization_name}`);
    console.log(`   Version: ${CODE_VERSION}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(80)}\n`);

    // Step 1: Fetch discovery targets and industry from database
    console.log('📋 Step 1: Loading discovery targets and industry...');
    const orgResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?id=eq.${organization_id}&select=company_profile`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    if (!orgResponse.ok) {
      throw new Error(`Failed to fetch organization: ${orgResponse.status}`);
    }

    const [org] = await orgResponse.json();
    const companyProfile = org?.company_profile || {};

    // Extract competitors and stakeholders from company_profile structure
    const competitors = companyProfile?.competition?.direct_competitors || [];
    const stakeholders = [
      ...(companyProfile?.stakeholders?.regulators || []),
      ...(companyProfile?.stakeholders?.key_analysts || []),
      ...(companyProfile?.stakeholders?.activists || []),
      ...(companyProfile?.stakeholders?.major_investors || []),
      ...(companyProfile?.stakeholders?.major_customers || []),
      ...(companyProfile?.stakeholders?.key_partners || [])
    ];
    const products = companyProfile?.service_lines || companyProfile?.product_lines || [];

    const discoveryTargets = {
      competitors,
      stakeholders,
      products
    };

    console.log(`   ✅ Loaded targets: ${competitors.length} competitors, ${stakeholders.length} stakeholders, ${products.length} products`);
    if (competitors.length > 0) {
      console.log(`   📊 Competitors: ${competitors.slice(0, 5).join(', ')}${competitors.length > 5 ? '...' : ''}`);
    }
    if (stakeholders.length > 0) {
      console.log(`   👥 Stakeholders: ${stakeholders.slice(0, 5).join(', ')}${stakeholders.length > 5 ? '...' : ''}`);
    }
    if (products.length > 0) {
      console.log(`   📦 Products/Services: ${products.slice(0, 3).join(', ')}${products.length > 3 ? '...' : ''}`);
    }

    // Step 1b: Get HTML sources - prefer profile, fallback to registry
    console.log('\n📚 Step 1b: Loading HTML sources...');
    let htmlSources = getHTMLSourcesFromProfile(companyProfile);

    if (htmlSources.length === 0) {
      console.log('   ⚠️ No HTML sources in profile, loading from master-source-registry...');
      htmlSources = await loadHTMLSourcesFromRegistry(companyProfile, organization_name);
    } else {
      console.log(`   ✅ Using ${htmlSources.length} HTML sources from company profile`);
    }

    if (htmlSources.length === 0) {
      throw new Error('No HTML sources available - check master-source-registry configuration');
    }

    // Step 2: Scrape all trusted sources in parallel
    console.log('\n📡 Step 2: Scraping trusted sources...');
    const sourcePromises = htmlSources.map(source => scrapeSouceListing(source));
    const sourceResults = await Promise.all(sourcePromises);

    const allArticles = sourceResults.flat();
    console.log(`\n📊 Total articles collected: ${allArticles.length}`);

    if (allArticles.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No articles found from any source',
        metadata: { code_version: CODE_VERSION }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Mechanical filtering (recency, source quality, dedup) - NO semantic filtering yet
    console.log('\n🔧 Step 3: Applying mechanical filtering (recency, source quality, dedup)...');

    // 3a. Deduplicate by URL
    const seenUrls = new Set<string>();
    const dedupedArticles = allArticles.filter(a => {
      if (!a.url || seenUrls.has(a.url)) return false;
      seenUrls.add(a.url);
      return true;
    });
    console.log(`   ✅ Deduplication: ${allArticles.length} → ${dedupedArticles.length} unique articles`);

    // 3b. Score by source priority (from HTML source metadata)
    const scoredArticles = dedupedArticles.map(a => ({
      ...a,
      relevance_score: a.source_priority || 2, // 1=critical, 2=high, 3=medium
      filter_stage: 'mechanical'
    }));

    // 3c. Sort by source priority (lower number = higher priority)
    scoredArticles.sort((a, b) => a.relevance_score - b.relevance_score);

    // 3d. Cap at ~100 articles for timeout safety (scraping + relevance filtering downstream)
    // 100 articles = ~2-3 min scraping + stage-2 relevance has time to filter intelligently
    const MAX_ARTICLES_TO_SCRAPE = 100;
    const articlesToScrape = scoredArticles.slice(0, MAX_ARTICLES_TO_SCRAPE);

    console.log(`   📊 Mechanical filtering complete:`);
    console.log(`      - Deduped: ${allArticles.length} → ${dedupedArticles.length}`);
    console.log(`      - Capped at: ${MAX_ARTICLES_TO_SCRAPE} articles`);
    console.log(`      - Ready to scrape: ${articlesToScrape.length} articles`);

    if (scoredArticles.length > MAX_ARTICLES_TO_SCRAPE) {
      console.log(`   ⚠️ Capped from ${scoredArticles.length} to ${MAX_ARTICLES_TO_SCRAPE} highest-priority articles`);
    }

    if (articlesToScrape.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        total_articles: 0,
        articles: [],
        metadata: {
          code_version: CODE_VERSION,
          sources_scraped: htmlSources.length,
          articles_scanned: allArticles.length,
          articles_after_dedup: dedupedArticles.length,
          articles_to_scrape: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 4: Format monitoring report (no full article scraping - that happens in enrichment)
    console.log('\n📋 Step 4: Formatting monitoring report...');
    console.log(`   Compiling ${articlesToScrape.length} article references for downstream stages`);

    // Return article metadata from listing pages
    // Relevance/enrichment stages will handle deeper content extraction if needed
    const finalArticles = articlesToScrape.map((a: any) => ({
      url: a.url,
      title: a.title,
      description: a.snippet || a.description || '',
      source: a.source,
      source_tier: a.source_tier || 'high',
      source_priority: a.source_priority || 2,
      published_at: a.published_at || new Date().toISOString(),
      relevance_score: a.relevance_score || 0.75,
      filter_stage: 'mechanical',
      from_source_direct: true,
      // Metadata from listing page scrape
      listing_metadata: {
        scraped_from: a.scraped_from || a.source,
        has_snippet: !!a.snippet
      }
    }));

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ MONITORING COMPLETE`);
    console.log(`   Total articles: ${finalArticles.length}`);
    console.log(`   Average source priority: ${(finalArticles.reduce((sum: number, a: any) => sum + a.source_priority, 0) / finalArticles.length).toFixed(2)}`);
    console.log(`${'='.repeat(80)}\n`);

    return new Response(JSON.stringify({
      success: true,
      total_articles: finalArticles.length,
      articles: finalArticles,
      metadata: {
        code_version: CODE_VERSION,
        sources_scraped: htmlSources.length,
        articles_scanned: allArticles.length,
        articles_after_dedup: dedupedArticles.length,
        articles_returned: finalArticles.length,
        note: 'Returns article metadata only - full content scraping happens in enrichment stage'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Source-direct monitoring error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      metadata: { code_version: CODE_VERSION }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
