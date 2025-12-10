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

    // NEW: Extract stakeholders for relevance matching
    const stakeholders = profileData?.stakeholders || {};
    const regulators = stakeholders?.regulators || [];
    const keyAnalysts = stakeholders?.key_analysts || [];
    const activists = stakeholders?.activists || [];

    // NEW: Extract strategic context
    const strategicContext = profileData?.strategic_context || {};
    const targetCustomers = strategicContext?.target_customers || '';
    const strategicPriorities = strategicContext?.strategic_priorities || [];

    console.log(`   Industry: ${industry}`);
    console.log(`   Competitors: ${competitors.length}`);
    console.log(`   Regulators: ${regulators.length}`);
    console.log(`   Key Questions: ${keyQuestions.length}`);
    console.log(`   Strategic Priorities: ${strategicPriorities.length}`);

    // Log input source distribution
    const inputSourceDist: Record<string, number> = {};
    articles.forEach((a: Article) => {
      const src = a.source || a.source_name || 'Unknown';
      inputSourceDist[src] = (inputSourceDist[src] || 0) + 1;
    });
    console.log(`   Input sources: ${Object.keys(inputSourceDist).length}`);
    console.log(`   Input distribution:`, inputSourceDist);

    // ================================================================
    // STEP 1: Score articles with Claude (use full_content if available)
    // ================================================================
    console.log(`\n🤖 Scoring ${articles.length} articles with Claude...`);

    const batchSize = 25;
    const scoredArticles: any[] = [];

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(articles.length / batchSize);

      console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} articles)...`);

      // Build stakeholder list for the prompt
      const allStakeholders = [...regulators, ...keyAnalysts, ...activists].filter(Boolean);

      const prompt = `You are an intelligence analyst scoring news relevance for ${organization_name}, a ${industry} company.

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
    // STEP 2: Enforce SOURCE DIVERSITY
    // Take top N from each source, sorted by score
    // ================================================================
    console.log(`\n📊 Enforcing source diversity...`);

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

    // Take top articles from each source to ensure diversity
    const MAX_PER_SOURCE = 8;  // Max 8 per source
    const TARGET_TOTAL = 80;   // Target ~80 articles total

    const diverseArticles: any[] = [];
    const sourceCount: Record<string, number> = {};
    let round = 0;

    // Round-robin: take 1 from each source per round until we hit target
    while (diverseArticles.length < TARGET_TOTAL) {
      let addedThisRound = 0;

      for (const src of Object.keys(bySource)) {
        const count = sourceCount[src] || 0;
        if (count < MAX_PER_SOURCE && bySource[src][count]) {
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
