// Pattern Detector v2 - Uses Claude to analyze articles and generate predictions
// Instead of statistical counting, this actually reads article content and finds patterns

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Article {
  title: string;
  description?: string;
  summary?: string;
  url: string;
  source: string;
  published_at?: string;
  relevance_score?: number;
}

interface Prediction {
  title: string;
  description: string;
  rationale: string;
  evidence: string[];
  confidence_score: number;
  impact_level: 'high' | 'medium' | 'low';
  category: 'competitive' | 'market' | 'crisis' | 'strategic' | 'regulatory' | 'technology' | 'partnership';
  time_horizon: '1-month' | '3-months' | '6-months';
  related_entities: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id, articles, company_profile } = await req.json();

    console.log(`🔮 Pattern Detector v2 - Claude-Powered Analysis`);
    console.log(`   Organization: ${organization_id}`);
    console.log(`   Articles received: ${articles?.length || 0}`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        predictions_generated: 0,
        message: 'No articles to analyze'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load org data if not provided
    let profile = company_profile;
    let orgName = '';
    if (!profile) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, industry, company_profile')
        .eq('id', organization_id)
        .single();

      if (org) {
        profile = org.company_profile;
        orgName = org.name;
      }
    } else {
      orgName = profile.name || 'Unknown';
    }

    // Build company context for Claude
    const companyContext = buildCompanyContext(profile, orgName);

    // Build article summaries for Claude (limit to top 30 by relevance)
    const topArticles = articles
      .sort((a: Article, b: Article) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 30);

    const articleSummaries = topArticles.map((a: Article, i: number) =>
      `[${i + 1}] "${a.title}" (${a.source}, ${a.published_at?.split('T')[0] || 'recent'})
      ${a.summary || a.description || ''}`
    ).join('\n\n');

    // Call Claude to analyze and generate predictions
    const predictions = await generatePredictionsWithClaude(
      companyContext,
      articleSummaries,
      topArticles
    );

    console.log(`   Claude generated ${predictions.length} predictions`);

    // Save predictions to database
    let savedCount = 0;
    for (const pred of predictions) {
      const saved = await savePrediction(organization_id, pred);
      if (saved) savedCount++;
    }

    console.log(`✅ Pattern Detection Complete: ${savedCount} predictions saved`);

    return new Response(JSON.stringify({
      success: true,
      predictions_generated: predictions.length,
      predictions_saved: savedCount,
      predictions: predictions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Pattern Detector error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildCompanyContext(profile: any, orgName: string): string {
  const parts = [`COMPANY: ${orgName}`];

  if (profile?.description) {
    parts.push(`ABOUT: ${profile.description}`);
  }

  if (profile?.service_lines?.length) {
    parts.push(`SERVICE LINES: ${profile.service_lines.join(', ')}`);
  }

  if (profile?.competition?.direct_competitors?.length) {
    parts.push(`COMPETITORS: ${profile.competition.direct_competitors.join(', ')}`);
  }

  if (profile?.strategic_context?.target_customers) {
    parts.push(`TARGET CUSTOMERS: ${profile.strategic_context.target_customers}`);
  }

  if (profile?.intelligence_context?.key_questions?.length) {
    parts.push(`KEY QUESTIONS:\n${profile.intelligence_context.key_questions.map((q: string) => `- ${q}`).join('\n')}`);
  }

  return parts.join('\n\n');
}

async function generatePredictionsWithClaude(
  companyContext: string,
  articleSummaries: string,
  articles: Article[]
): Promise<Prediction[]> {

  const prompt = `You are a strategic intelligence analyst. Analyze these news articles and generate actionable predictions for the company.

${companyContext}

ARTICLES TO ANALYZE:
${articleSummaries}

YOUR TASK: Generate 3-5 strategic predictions based on patterns you see in these articles. Each prediction should:

1. Identify a trend, threat, or opportunity emerging from the news
2. Explain WHY this matters to the company (rationale)
3. Cite specific articles as evidence (reference by number [1], [2], etc.)
4. Assess confidence based on: multiple sources confirming = high, single source = low
5. Suggest time horizon: 1-month (imminent), 3-months (developing), 6-months (emerging)

PREDICTION TYPES (use exact values):
- "competitive": Competitor moves that affect market position
- "market": Industry trends or market shifts
- "crisis": Threats requiring defensive action
- "strategic": Business development or growth opportunities
- "regulatory": Regulatory, legal, or compliance developments
- "technology": Technology shifts or innovations
- "partnership": Alliance or partnership opportunities

Return a JSON array of predictions:
[
  {
    "title": "Short, specific prediction title",
    "description": "What you predict will happen and its implications",
    "rationale": "Why this prediction makes sense given the evidence",
    "evidence": ["Quote or fact from article [1]", "Supporting detail from article [3]"],
    "confidence_score": 75,
    "impact_level": "high|medium|low",
    "category": "competitive|market|crisis|strategic|regulatory|technology|partnership",
    "time_horizon": "1-month|3-months|6-months",
    "related_entities": ["Company A", "Person B"]
  }
]

IMPORTANT:
- Be specific, not generic. "Market conditions may change" is useless.
- Ground every prediction in actual article content.
- If articles don't support strong predictions, generate fewer predictions.
- Focus on what matters to THIS company's business.

Return ONLY the JSON array, no other text.`;

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
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in Claude response');
      console.log('Response:', content.substring(0, 500));
      return [];
    }

    const predictions = JSON.parse(jsonMatch[0]);
    console.log(`   Parsed ${predictions.length} predictions from Claude`);

    // Validate and clean predictions
    return predictions.map((p: any) => ({
      title: p.title || 'Untitled Prediction',
      description: p.description || '',
      rationale: p.rationale || '',
      evidence: Array.isArray(p.evidence) ? p.evidence : [],
      confidence_score: Math.min(100, Math.max(0, p.confidence_score || 50)),
      impact_level: ['high', 'medium', 'low'].includes(p.impact_level) ? p.impact_level : 'medium',
      category: ['competitive', 'market', 'crisis', 'strategic', 'regulatory', 'technology', 'partnership'].includes(p.category) ? p.category : 'market',
      time_horizon: ['1-month', '3-months', '6-months'].includes(p.time_horizon) ? p.time_horizon : '3-months',
      related_entities: Array.isArray(p.related_entities) ? p.related_entities : []
    }));

  } catch (error: any) {
    console.error('Error calling Claude:', error.message);
    return [];
  }
}

async function savePrediction(orgId: string, prediction: Prediction): Promise<boolean> {
  try {
    // Check for existing similar prediction
    const { data: existing } = await supabase
      .from('predictions')
      .select('id')
      .eq('organization_id', orgId)
      .eq('title', prediction.title)
      .single();

    if (existing) {
      console.log(`   ⏭️ Prediction already exists: ${prediction.title.substring(0, 50)}...`);
      return false;
    }

    // Build description with rationale and evidence
    const fullDescription = `${prediction.description}

**Rationale:** ${prediction.rationale}

**Evidence:**
${prediction.evidence.map(e => `• ${e}`).join('\n')}`;

    const { error } = await supabase
      .from('predictions')
      .insert({
        organization_id: orgId,
        title: prediction.title,
        description: fullDescription,
        confidence_score: prediction.confidence_score,
        impact_level: prediction.impact_level,
        category: prediction.category,
        time_horizon: prediction.time_horizon,
        status: 'active',
        // Store structured data in the data jsonb column
        data: {
          rationale: prediction.rationale,
          evidence: prediction.evidence,
          related_entities: prediction.related_entities,
          generated_by: 'pattern-detector-v2'
        }
      });

    if (error) {
      console.error(`❌ Failed to save prediction: ${error.message}`);
      return false;
    }

    console.log(`   💡 Saved: ${prediction.title.substring(0, 60)}...`);
    return true;

  } catch (e: any) {
    console.error(`❌ Error saving prediction: ${e.message}`);
    return false;
  }
}
