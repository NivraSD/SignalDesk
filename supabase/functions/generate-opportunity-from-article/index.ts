// Generate Opportunity from Article
// Creates a V2 opportunity with execution plan from a single article
// Used by the "Generate Opportunity" button in Intelligence Brief

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleInput {
  title: string;
  content?: string;
  description?: string;
  url?: string;
  source?: string;
  published_at?: string;
}

interface GenerateRequest {
  organization_id: string;
  article: ArticleInput;
  save_to_db?: boolean; // Default true
}

/**
 * Build prompt for single-article opportunity generation
 */
function buildSingleArticlePrompt(params: {
  organizationName: string;
  article: ArticleInput;
  organizationProfile: any;
  competitors: string[];
}): string {
  const { organizationName, article, organizationProfile, competitors } = params;

  const articleContent = article.content || article.description || '';

  return `OPPORTUNITY GENERATION FROM SINGLE ARTICLE
DATE: ${new Date().toISOString().split('T')[0]}

ORGANIZATION: ${organizationName}
INDUSTRY: ${organizationProfile.industry || 'General'}
DESCRIPTION: ${organizationProfile.description || ''}

KEY COMPETITORS: ${competitors.slice(0, 15).join(', ') || 'Not specified'}

SERVICE LINES / OFFERINGS: ${(organizationProfile.service_lines || organizationProfile.core_offerings || []).join(', ') || 'Various'}

STRATEGIC PRIORITIES: ${(organizationProfile.strategic_context?.strategic_priorities || []).join(', ') || 'Not specified'}

TARGET CUSTOMERS: ${organizationProfile.strategic_context?.target_customers || 'Not specified'}

ARTICLE TO ANALYZE:
================================================================================
SOURCE: ${article.source || 'Unknown'}
TITLE: ${article.title}
URL: ${article.url || 'N/A'}
PUBLISHED: ${article.published_at || 'Unknown'}

CONTENT:
${articleContent.substring(0, 3000)}
================================================================================

YOUR TASK: Generate ONE high-quality PR/communications opportunity from this article.

Think creatively about how ${organizationName} can leverage this news:

1. COUNTER-POSITIONING: Can we position against this news? Offer a contrarian view?
2. THOUGHT LEADERSHIP: Can we add expert commentary or unique perspective?
3. COMPETITIVE ANGLE: Does this reveal something about a competitor we can capitalize on?
4. MARKET OPPORTUNITY: Does this create an opening for ${organizationName}?
5. TREND RIDING: Can we authentically join this conversation with valuable insight?

🚨 IMPORTANT CONSTRAINTS:
- Only position ${organizationName} for expertise they ACTUALLY have (based on profile above)
- Do NOT suggest AI/technology thought leadership unless they are a tech company
- For agencies/services companies: focus on client work, case studies, industry insight
- Be realistic about what ${organizationName} can authentically claim

Generate a SINGLE opportunity with this EXACT JSON structure:

{
  "title": "Action-oriented opportunity title",
  "description": "2-3 sentence description of the opportunity and why it matters for ${organizationName}",

  "strategic_context": {
    "trigger_events": ["The specific news/event from this article"],
    "market_dynamics": "What's happening in the market that makes this relevant",
    "why_now": "Why ${organizationName} should act on this immediately",
    "competitive_advantage": "What unique angle or advantage ${organizationName} has",
    "time_window": "How long this opportunity window is open (e.g., '3-5 days', '1-2 weeks')",
    "expected_impact": "What ${organizationName} can gain from executing on this",
    "risk_if_missed": "What happens if ${organizationName} doesn't act"
  },

  "execution_plan": {
    "stakeholder_campaigns": [
      {
        "stakeholder_name": "Target audience (e.g., 'Industry media', 'Potential clients', 'Partners')",
        "stakeholder_priority": 1,
        "stakeholder_description": "Who this audience is and why they matter",
        "lever_name": "The influence lever (e.g., 'Thought Leadership', 'Expert Commentary')",
        "lever_priority": 1,
        "lever_description": "How this lever will influence the stakeholder",
        "content_items": [
          {
            "type": "thought_leadership",
            "topic": "Specific content topic",
            "target": "Where this will be published/shared",
            "brief": {
              "angle": "The specific angle for this content",
              "key_points": ["Point 1", "Point 2", "Point 3"],
              "tone": "Professional, insightful, etc.",
              "length": "800-1000 words",
              "cta": "Call to action",
              "target_audience": "Who will read this",
              "data_to_include": ["Any data points to reference"]
            },
            "urgency": "immediate",
            "estimated_effort": "2 hours"
          }
        ]
      }
    ],
    "execution_timeline": {
      "immediate": ["Actions for today/tomorrow"],
      "this_week": ["Actions for this week"],
      "this_month": ["Ongoing actions"],
      "ongoing": ["Long-term follow-up"]
    },
    "success_metrics": [
      {
        "metric": "What to measure",
        "target": "Target value",
        "measurement_method": "How to measure",
        "timeframe": "When to measure"
      }
    ]
  },

  "score": 85,
  "urgency": "high",
  "category": "THOUGHT_LEADERSHIP",
  "confidence_factors": [
    "Factor 1 that makes this a good opportunity",
    "Factor 2"
  ],
  "auto_executable": true,
  "detection_metadata": {
    "detected_at": "${new Date().toISOString()}",
    "trigger_events": ["Article: ${article.title}"],
    "pattern_matched": "Single Article Opportunity",
    "version": 2,
    "source_article": {
      "title": "${article.title.replace(/"/g, '\\"')}",
      "url": "${article.url || ''}",
      "source": "${article.source || ''}"
    }
  }
}

CONTENT TYPES YOU CAN RECOMMEND:
- media_pitch: Pitches to journalists/outlets
- social_post: LinkedIn/Twitter posts (specify platform)
- thought_leadership: Blog posts, articles, op-eds
- press_release: Formal announcements
- email_campaign: Email sequences
- presentation: Slide decks (via Gamma)
- image: Visual content for social
- partnership_outreach: Collaboration proposals

DO NOT RECOMMEND: webinars, events, podcasts, videos (platform cannot create these)

URGENCY VALUES:
- Opportunity-level: "high", "medium", or "low"
- Content-level: "immediate", "this_week", "this_month", "ongoing"

CATEGORY OPTIONS: COMPETITIVE, STRATEGIC, THOUGHT_LEADERSHIP, VIRAL, DEFENSIVE, TALENT, STAKEHOLDER

Return ONLY the JSON object. No markdown, no explanations. Valid JSON only.`;
}

const SYSTEM_PROMPT = `You are a PR opportunity specialist who identifies actionable communications opportunities from news articles.

Your job is to analyze a single article and identify how a specific organization can leverage it for PR, thought leadership, or competitive positioning.

RULES:
1. Be creative but realistic - only suggest opportunities the organization can authentically pursue
2. Focus on what makes this article specifically relevant to this organization
3. Provide detailed, actionable content briefs that can be executed immediately
4. Consider both offensive (capitalize on opportunity) and defensive (respond to threat) angles
5. Always tie back to the organization's actual expertise and industry position

Return a single, well-structured V2 opportunity with complete execution plans.`;

/**
 * Normalize urgency to valid database values
 */
function normalizeUrgency(urgency: any): 'high' | 'medium' | 'low' {
  if (!urgency) return 'medium';
  const u = String(urgency).toLowerCase();
  if (u === 'high' || u === 'medium' || u === 'low') return u as 'high' | 'medium' | 'low';
  if (u.includes('immediate') || u.includes('24') || u.includes('urgent')) return 'high';
  if (u.includes('week')) return 'medium';
  return 'medium';
}

/**
 * Calculate expiry date from time window
 */
function calculateExpiryDate(timeWindow: string): string {
  const now = new Date();
  let hours = 72; // default 3 days

  if (timeWindow?.includes('24')) hours = 24;
  else if (timeWindow?.includes('48')) hours = 48;
  else if (timeWindow?.includes('72')) hours = 72;
  else if (timeWindow?.includes('week')) hours = 168;
  else if (timeWindow?.includes('days')) {
    const days = parseInt(timeWindow.match(/\d+/)?.[0] || '3');
    hours = days * 24;
  }

  now.setHours(now.getHours() + hours);
  return now.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id, article, save_to_db = true }: GenerateRequest = await req.json();

    console.log(`🎯 Generating opportunity from article for org: ${organization_id}`);
    console.log(`📰 Article: "${article.title}"`);

    if (!organization_id || !article?.title) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: organization_id and article.title'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Load organization profile
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, industry, company_profile')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      console.error('Organization not found:', orgError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Organization not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const organizationName = org.name;
    const profile = org.company_profile || {};
    profile.industry = org.industry || profile.industry;

    console.log(`📊 Loaded profile for: ${organizationName}`);

    // Load intelligence targets for competitors
    const { data: targets } = await supabase
      .from('intelligence_targets')
      .select('name, target_type')
      .eq('organization_id', organization_id)
      .eq('is_active', true);

    const competitors = targets
      ?.filter(t => t.target_type === 'competitor')
      .map(t => t.name) || [];

    console.log(`📊 Found ${competitors.length} competitors`);

    // Build prompt
    const prompt = buildSingleArticlePrompt({
      organizationName,
      article,
      organizationProfile: profile,
      competitors
    });

    console.log('🤖 Calling Claude to generate opportunity...');

    // Call Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    console.log('✅ Claude response received, length:', content.length);

    // Parse opportunity
    let opportunity: any;
    try {
      let cleanContent = content.trim();

      // Remove markdown fences
      if (cleanContent.includes('```json')) {
        const match = cleanContent.match(/```json\s*([\s\S]*?)```/);
        if (match) cleanContent = match[1].trim();
      } else if (cleanContent.includes('```')) {
        const match = cleanContent.match(/```\s*([\s\S]*?)```/);
        if (match) cleanContent = match[1].trim();
      }

      cleanContent = cleanContent.replace(/^`+\s*(?:json)?\s*\n?/, '').replace(/`+\s*$/, '').trim();

      opportunity = JSON.parse(cleanContent);
      console.log('✅ Parsed opportunity:', opportunity.title);

    } catch (e) {
      console.error('Parse error:', e);

      // Fallback: extract JSON object
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');

      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const extracted = content.substring(firstBrace, lastBrace + 1);
        try {
          opportunity = JSON.parse(extracted);
          console.log('✅ Extracted opportunity:', opportunity.title);
        } catch (e2) {
          console.error('Fallback parse failed:', e2);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to parse Claude response',
            raw_response: content.substring(0, 1000)
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Validate opportunity structure
    if (!opportunity?.title || !opportunity?.execution_plan?.stakeholder_campaigns) {
      console.error('Invalid opportunity structure');
      return new Response(JSON.stringify({
        success: false,
        error: 'Generated opportunity has invalid structure',
        opportunity
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Save to database if requested
    let savedId: string | null = null;

    if (save_to_db) {
      console.log('💾 Saving opportunity to database...');

      const insertData = {
        organization_id,
        title: opportunity.title,
        description: opportunity.description,
        score: opportunity.score || 80,
        urgency: normalizeUrgency(opportunity.urgency),
        category: opportunity.category || 'THOUGHT_LEADERSHIP',

        // V2 fields
        strategic_context: opportunity.strategic_context,
        execution_plan: opportunity.execution_plan,
        time_window: opportunity.strategic_context?.time_window || '3-5 days',
        expected_impact: opportunity.strategic_context?.expected_impact || '',
        auto_executable: opportunity.auto_executable !== false,
        executed: false,
        version: 2,

        // Data field for backward compatibility
        data: {
          confidence_factors: opportunity.confidence_factors,
          pattern_matched: opportunity.detection_metadata?.pattern_matched || 'Single Article',
          trigger_event: opportunity.strategic_context?.trigger_events?.join('; ') || article.title,
          detection_metadata: opportunity.detection_metadata,
          source_article: {
            title: article.title,
            url: article.url,
            source: article.source
          },
          total_content_items: opportunity.execution_plan?.stakeholder_campaigns
            ?.reduce((sum: number, c: any) => sum + (c.content_items?.length || 0), 0) || 0,
          stakeholder_count: opportunity.execution_plan?.stakeholder_campaigns?.length || 0
        },

        status: 'active',
        expires_at: calculateExpiryDate(opportunity.strategic_context?.time_window || '3 days')
      };

      const { data: saved, error: saveError } = await supabase
        .from('opportunities')
        .insert(insertData)
        .select('id')
        .single();

      if (saveError) {
        console.error('Error saving opportunity:', saveError);
      } else {
        savedId = saved.id;
        console.log(`✅ Saved opportunity with ID: ${savedId}`);
      }
    }

    // Count content items
    const totalContentItems = opportunity.execution_plan.stakeholder_campaigns
      .reduce((sum: number, c: any) => sum + (c.content_items?.length || 0), 0);

    console.log(`✅ Generated opportunity: "${opportunity.title}"`);
    console.log(`   - ${opportunity.execution_plan.stakeholder_campaigns.length} stakeholder campaigns`);
    console.log(`   - ${totalContentItems} content items`);

    return new Response(JSON.stringify({
      success: true,
      opportunity: {
        ...opportunity,
        id: savedId
      },
      metadata: {
        organization_name: organizationName,
        source_article: article.title,
        stakeholder_campaigns: opportunity.execution_plan.stakeholder_campaigns.length,
        total_content_items: totalContentItems,
        saved_to_db: save_to_db && !!savedId,
        opportunity_id: savedId
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error generating opportunity:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
