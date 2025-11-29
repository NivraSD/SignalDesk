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
    const competitors = profileData?.competition?.direct_competitors || [];
    const serviceLines = profileData?.service_lines || [];
    const description = profileData?.description || '';

    console.log(`   Industry: ${industry}`);
    console.log(`   Competitors: ${competitors.length}`);

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

      const prompt = `You are an intelligence analyst scoring news relevance for ${organization_name}, a ${industry} company.

COMPANY CONTEXT:
${description ? `Description: ${description}` : ''}
Industry: ${industry}
Service Lines: ${serviceLines.join(', ') || 'Various'}
Competitors: ${competitors.slice(0, 10).join(', ') || 'Unknown'}

SCORING CRITERIA (be INCLUSIVE - score 60+ if potentially relevant):

HIGH RELEVANCE (80-100):
- Direct mention of company or competitors
- Major industry news affecting the company's sector
- Regulatory changes in their industry
- M&A activity in their space

MEDIUM RELEVANCE (60-79):
- Industry trends and market dynamics
- Tangentially related news (supply chain, commodities for trading)
- Geographic market news relevant to their operations
- Technology/innovation in their sector

LOW RELEVANCE (40-59):
- Loosely connected industry news
- General business news with some connection

NOT RELEVANT (0-39):
- Completely unrelated industries
- Articles about ${organization_name} themselves (we want external intel)
- Spam/promotional content

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
            const isPriority = article.industry_priority === true;
            const effectiveScore = isPriority ? Math.max(s.score, 65) : s.score;
            const threshold = isPriority ? 40 : 50;  // Lower threshold for priority articles

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
