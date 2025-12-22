// Monitor Stage 2: Relevance Filter (V2 - works with pre-scraped content)
// Uses Claude to score relevance, enforces source diversity

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Article {
  id?: number;
  title: string;
  description?: string;
  full_content?: string;
  url?: string;
  source?: string;
  source_name?: string;
  published_at?: string;
  industry_priority?: boolean;  // Flag from article selector - don't drop these
  priority_reason?: string;
  relevance_score?: number;
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { articles, organization_name, organization_id, profile } = await req.json();

    console.log(`🔍 RELEVANCE FILTER V2 for ${organization_name}`);
    console.log(`   Input articles: ${articles?.length || 0}`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        relevant_articles: [],
        filtered_out: 0,
        total: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get profile data - use passed profile or load from org
    let profileData = profile;
    if (!profileData && organization_id) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: org } = await supabase
        .from('organizations')
        .select('company_profile, industry')
        .eq('id', organization_id)
        .single();
      profileData = org?.company_profile || {};
      profileData.industry = org?.industry || profileData.industry;
    }

    const industry = profileData?.industry || 'general';
    const competitors = [
      ...(profileData?.competition?.direct_competitors || []),
      ...(profileData?.competition?.indirect_competitors || [])
    ];
    const serviceLines = profileData?.service_lines || [];
    const description = profileData?.description || '';

    // NEW: Extract full intelligence context for better relevance scoring
    const intelligenceContext = profileData?.intelligence_context || {};
    const keyQuestions = intelligenceContext?.key_questions || [];
    const extractionFocus = intelligenceContext?.extraction_focus || [];
    const relevanceCriteria = intelligenceContext?.relevance_criteria || {};

    // STRATEGIC CONTEXT: Org-specific scoring configuration
    const scoringWeights = intelligenceContext?.scoring_weights || {};
    const monitoringPrompt = intelligenceContext?.monitoring_prompt || '';
    const analysisPerspective = intelligenceContext?.analysis_perspective || '';
    const competitiveDynamics = profileData?.competition?.competitive_dynamics || '';

    // NEW: Extract stakeholders for relevance matching
    const stakeholders = profileData?.stakeholders || {};
    const regulators = stakeholders?.regulators || [];
    const keyAnalysts = stakeholders?.key_analysts || [];
    const activists = stakeholders?.activists || [];

    // NEW: Extract strategic context
    const strategicContext = profileData?.strategic_context || {};
    const targetCustomers = strategicContext?.target_customers || '';
    const strategicPriorities = strategicContext?.strategic_priorities || [];

    // CRITICAL: Extract source quality tiers from company profile
    const sourcePriorities = profileData?.monitoring_config?.source_priorities || {};
    const criticalSources = new Set<string>((sourcePriorities.critical || []).map((s: string) => s.toLowerCase()));
    const highSources = new Set<string>((sourcePriorities.high || []).map((s: string) => s.toLowerCase()));
    const blockedSources = new Set<string>((sourcePriorities.blocked || []).map((s: string) => s.toLowerCase()));

    // Default press release sources to always penalize
    const PRESS_RELEASE_SOURCES = new Set([
      'pr newswire', 'prnewswire', 'globenewswire', 'globe newswire',
      'businesswire', 'business wire', 'cision', 'accesswire', 'einewswire'
    ]);

    // Sources that frequently have date issues or low quality - block entirely
    const ALWAYS_BLOCK_SOURCES = new Set([
      'bcg', 'boston consulting group',  // Old archive articles with fake dates
      'mckinsey', 'mckinsey & company',  // Similar archive issues
      'bain', 'bain & company',          // Similar archive issues
      'the financial brand',             // RSS returns category pages with fake future dates (2026)
      'finextra',                        // Low quality fintech spam
      'pitchbook',                       // Paywalled/low value
      'ai news'                          // Low quality AI aggregator
    ]);

    console.log(`   Industry: ${industry}`);
    console.log(`   Source tiers: ${criticalSources.size} critical, ${highSources.size} high, ${blockedSources.size} blocked`);
    console.log(`   Competitors: ${competitors.length}`);
    console.log(`   Regulators: ${regulators.length}`);
    console.log(`   Key Questions: ${keyQuestions.length}`);
    console.log(`   Strategic Priorities: ${strategicPriorities.length}`);
    console.log(`   Scoring Weights: ${Object.keys(scoringWeights).length} configured`);
    console.log(`   Has Monitoring Prompt: ${monitoringPrompt.length > 0}`);
    console.log(`   Has Analysis Perspective: ${analysisPerspective.length > 0}`);

    // Log input source distribution
    const inputSourceDist: Record<string, number> = {};
    articles.forEach((a: Article) => {
      const src = a.source || a.source_name || 'Unknown';
      inputSourceDist[src] = (inputSourceDist[src] || 0) + 1;
    });
    console.log(`   Input sources: ${Object.keys(inputSourceDist).length}`);
    console.log(`   Input distribution:`, inputSourceDist);

    // ================================================================
    // STEP 0: DATE VALIDATION - Filter out old articles BEFORE scoring
    // This catches articles with fake dates or old archive content
    // ================================================================
    console.log(`\n📅 DATE VALIDATION: Filtering old articles...`);

    const MAX_AGE_DAYS = 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);

    // Pattern to detect old years in URLs (e.g., /2014/, /2015/, /publications/2017/)
    const OLD_YEAR_PATTERN = /\/(20(?:1[0-9]|2[0-3]))\//;  // Matches /2010/ through /2023/

    const dateValidArticles: Article[] = [];
    let rejectedNoDate = 0;
    let rejectedOldDate = 0;
    let rejectedOldUrl = 0;
    let rejectedBlockedSource = 0;

    for (const article of articles) {
      // Check 0: Reject if source is always blocked
      const sourceName = (article.source || article.source_name || '').toLowerCase();
      if (ALWAYS_BLOCK_SOURCES.has(sourceName) || blockedSources.has(sourceName)) {
        console.log(`   ❌ Blocked source (${sourceName}): ${article.title?.substring(0, 50)}`);
        rejectedBlockedSource++;
        continue;
      }

      // Check 1: Reject if URL contains old year patterns
      if (article.url) {
        const urlYearMatch = article.url.match(OLD_YEAR_PATTERN);
        if (urlYearMatch) {
          const urlYear = parseInt(urlYearMatch[1]);
          if (urlYear < 2024) {
            console.log(`   ❌ Old URL year (${urlYear}): ${article.title?.substring(0, 50)}`);
            rejectedOldUrl++;
            continue;
          }
        }
      }

      // Check 2: Must have published_at
      if (!article.published_at) {
        console.log(`   ❌ No published_at: ${article.title?.substring(0, 50)}`);
        rejectedNoDate++;
        continue;
      }

      // Check 3: published_at must be recent
      const pubDate = new Date(article.published_at);
      if (pubDate < cutoffDate) {
        console.log(`   ❌ Old date (${article.published_at}): ${article.title?.substring(0, 50)}`);
        rejectedOldDate++;
        continue;
      }

      dateValidArticles.push(article);
    }

    console.log(`   Rejected - blocked source: ${rejectedBlockedSource}`);
    console.log(`   Rejected - no published_at: ${rejectedNoDate}`);
    console.log(`   Rejected - old date (>7 days): ${rejectedOldDate}`);
    console.log(`   Rejected - old year in URL: ${rejectedOldUrl}`);
    console.log(`   ✅ Valid articles: ${dateValidArticles.length}/${articles.length}`);

    // Use date-validated articles for the rest of the pipeline
    const articlesToScore = dateValidArticles;

    // ================================================================
    // STEP 1: Score articles with Claude (use full_content if available)
    // ================================================================
    console.log(`\n🤖 Scoring ${articlesToScore.length} articles with Claude...`);

    const batchSize = 25;
    const scoredArticles: any[] = [];

    for (let i = 0; i < articlesToScore.length; i += batchSize) {
      const batch = articlesToScore.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(articlesToScore.length / batchSize);

      console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`);

      // Build stakeholder list for the prompt
      const allStakeholders = [...regulators, ...keyAnalysts, ...activists].filter(Boolean);

      const prompt = `You are an intelligence analyst scoring news relevance for ${organization_name}, a ${industry} company.

⚠️ CRITICAL SOURCE QUALITY RULES - READ FIRST:
Press releases (PR Newswire, GlobeNewswire, BusinessWire) are MARKETING, not journalism.
- They should score 25-30 POINTS LOWER than equivalent content from quality sources
- A press release about "ADNOC energy deal" should score ~50, while Reuters covering the same story scores ~80
- Press releases lack analysis, verification, and journalistic perspective
- NEVER score a press release above 65 unless it contains truly exceptional breaking news

SOURCE QUALITY HIERARCHY:
TIER 1 (Premium journalism - score normally): Financial Times, Reuters, WSJ, Bloomberg, The Economist, NYT, Washington Post
TIER 2 (Quality industry sources - score normally): Industry publications, think tanks, analyst reports
TIER 3 (Press releases - PENALIZE 25-30 points): PR Newswire, GlobeNewswire, BusinessWire, Cision
${blockedSources.size > 0 ? `BLOCKED (Score 0): ${Array.from(blockedSources).join(', ')}` : ''}

COMPANY CONTEXT:
${description ? `Description: ${description}` : ''}
Industry: ${industry}
Service Lines: ${serviceLines.join(', ') || 'Various'}
Competitors: ${competitors.slice(0, 15).join(', ') || 'Unknown'}
${targetCustomers ? `Target Customers: ${targetCustomers}` : ''}
${strategicPriorities.length > 0 ? `Strategic Priorities: ${strategicPriorities.join(', ')}` : ''}

KEY STAKEHOLDERS TO WATCH:
${regulators.length > 0 ? `Regulators: ${regulators.join(', ')}` : ''}
${keyAnalysts.length > 0 ? `Key Analysts: ${keyAnalysts.join(', ')}` : ''}
${activists.length > 0 ? `Activists/Advocates: ${activists.join(', ')}` : ''}

${keyQuestions.length > 0 ? `KEY INTELLIGENCE QUESTIONS:
${keyQuestions.map((q: string) => `- ${q}`).join('\n')}` : ''}

${extractionFocus.length > 0 ? `EXTRACTION FOCUS:
${extractionFocus.slice(0, 10).map((f: string) => `- ${f}`).join('\n')}` : ''}

${monitoringPrompt ? `
🎯 STRATEGIC MONITORING FOCUS (IMPORTANT - use this to guide your scoring):
${monitoringPrompt}
` : ''}

${analysisPerspective ? `
📊 ANALYSIS PERSPECTIVE:
${analysisPerspective}
` : ''}

${Object.keys(scoringWeights).length > 0 ? `
⚖️ CUSTOM SCORING WEIGHTS (apply these score adjustments):
${Object.entries(scoringWeights).map(([category, weight]) => {
  const weightNum = typeof weight === 'number' ? weight : 0;
  const label = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `- ${label}: +${weightNum} points bonus`;
}).join('\n')}

When an article matches multiple categories, apply the HIGHEST applicable bonus (don't stack).
Example: An article about a competitor's regulatory issue gets the higher of competitor_action or regulatory_news bonus.
` : ''}

${competitiveDynamics ? `
🏁 COMPETITIVE DYNAMICS:
${competitiveDynamics}
` : ''}

⚠️ CRITICAL ANTI-HYPE FILTER: Generic "AI" or "technology" news is NOT automatically relevant!
- "Company X launches AI feature" → ONLY relevant if Company X is a competitor, customer, or partner
- "AI is transforming industry Y" → ONLY relevant if industry Y is ${organization_name}'s industry
- "Tech giant acquires AI startup" → ONLY relevant if it directly affects ${organization_name}'s market
- Just mentioning "AI" or "technology" does NOT make something relevant to ${organization_name}

SCORING CRITERIA (be STRICT about relevance - generic tech news should score LOW):

CRITICAL RELEVANCE (90-100):
- Direct mention of ${organization_name} or its direct competitors
- Actions by key stakeholders listed above (regulators, analysts)
- Major regulatory changes from: ${regulators.slice(0, 5).join(', ') || 'industry regulators'}
- Crisis/scandal involving competitors

HIGH RELEVANCE (75-89):
- Competitor strategic moves, product launches, funding rounds
- Industry trends directly affecting ${organization_name}'s market position
- M&A activity ONLY if it involves companies in ${organization_name}'s industry or market
- Actions by target customers or key analysts
${strategicPriorities.length > 0 ? `- News related to strategic priorities: ${strategicPriorities.slice(0, 3).join(', ')}` : ''}

MEDIUM RELEVANCE (60-74):
- Industry-specific news in ${organization_name}'s actual industry (${industry})
- Geographic market news relevant to their operations
- Competitive intelligence about similar companies

LOW RELEVANCE (40-59):
- Loosely connected industry news
- General business news with indirect connection

NOT RELEVANT (0-39) - Score these LOW!
- Completely unrelated industries
- Articles about ${organization_name} themselves (we want EXTERNAL intel)
- Spam/promotional content
- **Generic AI/tech news about companies NOT in ${organization_name}'s industry**
- **M&A between tech companies** unless they are competitors, customers, or partners (e.g., IBM acquiring Confluent is NOT relevant to a marketing agency)
- **"AI hype" articles** that discuss AI trends without specific application to ${organization_name}'s industry
- **Major corporate news about tech giants** (Google, Microsoft, IBM, Apple, Amazon) UNLESS they are competitors, customers, or directly affect ${organization_name}'s business
- **Funding/IPO news for startups** in unrelated industries

ARTICLES TO SCORE:
${batch.map((a: Article, idx: number) => {
  const content = a.full_content ? a.full_content.substring(0, 800) : (a.description || '');
  return `[${idx}] SOURCE: ${a.source || a.source_name || 'Unknown'}
TITLE: ${a.title}
CONTENT: ${content}`;
}).join('\n\n---\n\n')}

Return JSON array with score for each article:
{"scores": [{"id": 0, "score": 85, "reason": "brief reason"}, ...]}

Score ALL ${batch.length} articles.`;

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',  // Fast for scoring
            max_tokens: 4000,
            temperature: 0,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          throw new Error(`Claude API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.content[0].text;

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let batchRelevantCount = 0;

        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          const scores = result.scores || [];

          scores.forEach((s: any) => {
            const article = batch[s.id];
            if (!article) return;

            // Industry priority articles get a score boost and lower threshold
            // Lowered thresholds to let more articles through - synthesis will filter further
            const isPriority = article.industry_priority === true;
            const effectiveScore = isPriority ? Math.max(s.score, 65) : s.score;
            const threshold = isPriority ? 30 : 35;  // Lowered from 40/50 to let more through

            if (effectiveScore >= threshold) {
              scoredArticles.push({
                ...article,
                relevance_score: effectiveScore,
                relevance_reason: s.reason,
                priority_boosted: isPriority && s.score < 65
              });
              batchRelevantCount++;
            }
          });
        }

        console.log(`      ✅ Batch ${batchNum}: ${batchRelevantCount} relevant`);

      } catch (err: any) {
        console.error(`      ❌ Batch ${batchNum} error: ${err.message}`);
        // On error, include batch with default score
        batch.forEach((a: Article) => {
          scoredArticles.push({ ...a, relevance_score: 60, relevance_reason: 'Scoring error - included by default' });
        });
      }
    }

    const priorityKept = scoredArticles.filter(a => a.industry_priority).length;
    const priorityBoosted = scoredArticles.filter(a => a.priority_boosted).length;
    console.log(`\n   Total scored relevant: ${scoredArticles.length}`);
    console.log(`   Industry priority kept: ${priorityKept} (${priorityBoosted} boosted)`);

    // ================================================================
    // STEP 2: Enforce SOURCE DIVERSITY with TIERED CAPS
    // Quality sources get more slots, press releases get fewer
    // ================================================================
    console.log(`\n📊 Enforcing source diversity with quality tiers...`);

    // Helper to get cap for a source based on quality tier
    const getSourceCap = (sourceName: string): number => {
      const srcLower = sourceName.toLowerCase();

      // Blocked sources: 0 articles
      if (blockedSources.has(srcLower)) return 0;

      // Press releases: max 2 articles (severely limited)
      if (PRESS_RELEASE_SOURCES.has(srcLower)) return 2;

      // Critical/Tier 1 sources: max 12 articles (premium treatment)
      if (criticalSources.has(srcLower)) return 12;

      // High/Tier 2 sources: max 10 articles
      if (highSources.has(srcLower)) return 10;

      // Default for unknown sources: max 6 articles
      return 6;
    };

    // Group by source
    const bySource: Record<string, any[]> = {};
    scoredArticles.forEach(a => {
      const src = a.source || a.source_name || 'Unknown';
      if (!bySource[src]) bySource[src] = [];
      bySource[src].push(a);
    });

    // Sort each source by score
    Object.keys(bySource).forEach(src => {
      bySource[src].sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    });

    // Log source caps being applied
    const sourceCaps: Record<string, number> = {};
    Object.keys(bySource).forEach(src => {
      sourceCaps[src] = getSourceCap(src);
    });
    console.log(`   Source caps:`, sourceCaps);

    const TARGET_TOTAL = 80;   // Target ~80 articles total

    const diverseArticles: any[] = [];
    const sourceCount: Record<string, number> = {};
    let round = 0;

    // Round-robin: take 1 from each source per round until we hit target
    // But respect per-source caps based on quality tier
    while (diverseArticles.length < TARGET_TOTAL) {
      let addedThisRound = 0;

      for (const src of Object.keys(bySource)) {
        const count = sourceCount[src] || 0;
        const cap = getSourceCap(src);

        if (count < cap && bySource[src][count]) {
          diverseArticles.push(bySource[src][count]);
          sourceCount[src] = count + 1;
          addedThisRound++;

          if (diverseArticles.length >= TARGET_TOTAL) break;
        }
      }

      round++;
      if (addedThisRound === 0) break;  // No more articles to add
      if (round > 20) break;  // Safety limit
    }

    // Log how many were blocked/limited
    let blockedCount = 0;
    let pressReleaseLimited = 0;
    Object.keys(bySource).forEach(src => {
      const cap = getSourceCap(src);
      const available = bySource[src].length;
      if (cap === 0) blockedCount += available;
      else if (cap === 2 && available > 2) pressReleaseLimited += (available - 2);
    });
    console.log(`   Blocked source articles removed: ${blockedCount}`);
    console.log(`   Press release articles limited: ${pressReleaseLimited}`);

    // Sort final list by score
    diverseArticles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

    // Log output distribution
    const outputSourceDist: Record<string, number> = {};
    diverseArticles.forEach(a => {
      const src = a.source || a.source_name || 'Unknown';
      outputSourceDist[src] = (outputSourceDist[src] || 0) + 1;
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`\n✅ RELEVANCE FILTER COMPLETE`);
    console.log(`   Input: ${articles.length} articles`);
    console.log(`   Scored relevant: ${scoredArticles.length}`);
    console.log(`   After diversity: ${diverseArticles.length}`);
    console.log(`   Output sources: ${Object.keys(outputSourceDist).length}`);
    console.log(`   Output distribution:`, outputSourceDist);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify({
      relevant_articles: diverseArticles,
      total_input: articles.length,
      date_validated: dateValidArticles.length,
      rejected_blocked_source: rejectedBlockedSource,
      rejected_no_date: rejectedNoDate,
      rejected_old_date: rejectedOldDate,
      rejected_old_url: rejectedOldUrl,
      total_scored: scoredArticles.length,
      total_output: diverseArticles.length,
      filtered_out: articles.length - diverseArticles.length,
      keep_rate: ((diverseArticles.length / articles.length) * 100).toFixed(1) + '%',
      input_sources: Object.keys(inputSourceDist).length,
      output_sources: Object.keys(outputSourceDist).length,
      source_distribution: outputSourceDist,
      duration_seconds: duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Relevance filter error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
