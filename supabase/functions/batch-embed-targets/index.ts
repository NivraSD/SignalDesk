// Batch Embed Targets V2
// Uses Claude to generate RICH embedding context, then Voyage AI to embed
// The key insight: embeddings are only as good as the text you embed
// Instead of "Target: X. Type: competitor." we now generate:
// "X is a direct competitor to Org in [industry]. Alert on: leadership changes,
// market moves, regulatory issues, M&A activity, strategic partnerships..."

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const BATCH_SIZE = 50; // For embedding batches
const CLAUDE_BATCH_SIZE = 10; // Smaller batches for Claude context generation
const MAX_TEXT_LENGTH = 8000;

interface IntelligenceTarget {
  id: string;
  name: string;
  target_type: string;
  monitoring_context: string | null;
  keywords: string[] | null;
  monitoring_keywords: string[] | null;
  accumulated_context: string | Record<string, unknown> | null;
  priority: string | null;
  organization_id: string;
  organization?: {
    name: string;
    industry: string | null;
    company_profile?: Record<string, unknown>;
  };
}

interface CompanyContext {
  name: string;
  industry: string;
  description?: string;
  competitors?: string[];
  strategic_priorities?: string[];
  service_lines?: string[];
}

// Use Claude to generate rich embedding context for a batch of targets
async function generateRichContextWithClaude(
  targets: IntelligenceTarget[],
  companyContext: CompanyContext
): Promise<Map<string, string>> {
  const targetList = targets.map((t, i) =>
    `[${i}] ${t.name} (${t.target_type}, priority: ${t.priority || 'medium'})`
  ).join('\n');

  const prompt = `You are generating embedding context for an intelligence monitoring system.

COMPANY BEING MONITORED:
- Name: ${companyContext.name}
- Industry: ${companyContext.industry}
${companyContext.description ? `- Description: ${companyContext.description}` : ''}
${companyContext.service_lines?.length ? `- Service Lines: ${companyContext.service_lines.join(', ')}` : ''}
${companyContext.strategic_priorities?.length ? `- Strategic Priorities: ${companyContext.strategic_priorities.join(', ')}` : ''}

TARGETS TO GENERATE CONTEXT FOR:
${targetList}

For each target, generate a RICH description (150-300 words) that will be used for semantic matching against news articles. The description should:

1. Explain WHO/WHAT this target is and their relationship to ${companyContext.name}
2. Explain WHY news about this target matters to ${companyContext.name}
3. List SPECIFIC types of news that would be relevant:
   - For COMPETITORS: market moves, leadership changes, M&A, new products, regulatory issues, earnings, strategic shifts
   - For REGULATORS: policy changes, enforcement actions, new rules, investigations, guidance documents
   - For STAKEHOLDERS: campaigns, reports, public statements, investigations, partnerships
   - For INFLUENCERS: analysis, predictions, public statements, new research
   - For TOPICS: market trends, technology developments, policy changes, industry shifts

4. Include relevant keywords and phrases that would appear in relevant articles
5. Be SPECIFIC to the ${companyContext.industry} industry context

Return a JSON object where keys are the target indices [0], [1], etc. and values are the rich context strings.

Example for a competitor:
{
  "[0]": "Marubeni Corporation is a major Japanese trading company (sogo shosha) and direct competitor to ${companyContext.name} in commodity trading, energy, and infrastructure investments. Marubeni competes for the same deals in LNG, power generation, metals trading, and agricultural commodities. News to monitor: Marubeni earnings reports, new trading desk launches, energy project investments, M&A activity, joint ventures, leadership changes at Marubeni, regulatory issues, commodity trading losses or gains, new market entries in Southeast Asia or Latin America, infrastructure project wins, partnerships with energy companies, ESG initiatives, supply chain investments."
}

Generate context for all ${targets.length} targets:`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} - ${errorText}`);
      return new Map();
    }

    const data = await response.json();
    const content = data.content[0].text.trim();

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Claude response');
      return new Map();
    }

    const contextMap = JSON.parse(jsonMatch[0]);
    const result = new Map<string, string>();

    targets.forEach((target, i) => {
      const key = `[${i}]`;
      if (contextMap[key]) {
        result.set(target.id, contextMap[key]);
      }
    });

    return result;
  } catch (error) {
    console.error('Error calling Claude:', error);
    return new Map();
  }
}

// Fallback: build basic context without Claude (for when API fails)
function buildBasicEmbeddingText(target: IntelligenceTarget): string {
  const parts: string[] = [];

  parts.push(`${target.name} is a ${target.target_type} being monitored for ${target.organization?.name || 'the organization'}.`);

  if (target.target_type === 'competitor') {
    parts.push(`Monitor for: competitive moves, market share, leadership changes, M&A activity, new products, earnings, regulatory issues.`);
  } else if (target.target_type === 'regulator') {
    parts.push(`Monitor for: policy changes, enforcement actions, new regulations, investigations, guidance documents, rulings.`);
  } else if (target.target_type === 'stakeholder') {
    parts.push(`Monitor for: public statements, campaigns, reports, investigations, partnerships, advocacy.`);
  } else if (target.target_type === 'topic') {
    parts.push(`Monitor for: market trends, developments, analysis, forecasts, industry shifts.`);
  }

  if (target.monitoring_context) {
    parts.push(target.monitoring_context);
  }

  if (target.keywords?.length) {
    parts.push(`Keywords: ${target.keywords.join(', ')}`);
  }

  if (target.organization?.industry) {
    parts.push(`Industry context: ${target.organization.industry}`);
  }

  return parts.join(' ').slice(0, MAX_TEXT_LENGTH);
}

async function embedTexts(texts: string[]): Promise<number[][] | null> {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'voyage-3',
        input: texts,
        input_type: 'document'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Voyage API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  } catch (error) {
    console.error('Error calling Voyage API:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || BATCH_SIZE;
    const organizationId = body.organization_id; // Optional: embed only for specific org
    const forceReembed = body.force_reembed || false; // Force re-embedding even if already embedded

    console.log('🎯 BATCH EMBED TARGETS V2 (Claude-Enhanced)');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Batch size: ${batchSize}`);
    console.log(`   Force re-embed: ${forceReembed}`);
    if (organizationId) {
      console.log(`   Organization: ${organizationId}`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Build query for targets that need embedding
    let query = supabase
      .from('intelligence_targets')
      .select(`
        id, name, target_type, monitoring_context, keywords,
        monitoring_keywords, accumulated_context, priority, organization_id,
        organization:organizations(name, industry, company_profile)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(batchSize);

    // Only filter for null embeddings if not force re-embedding
    if (!forceReembed) {
      query = query.is('embedding', null);
    }

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: targets, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch targets: ${fetchError.message}`);
    }

    if (!targets || targets.length === 0) {
      console.log('   No targets to embed');
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: 'No targets need embedding'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Found ${targets.length} targets to embed`);

    // Group targets by organization for efficient context generation
    const targetsByOrg = new Map<string, IntelligenceTarget[]>();
    for (const target of targets) {
      const orgId = target.organization_id;
      if (!targetsByOrg.has(orgId)) {
        targetsByOrg.set(orgId, []);
      }
      targetsByOrg.get(orgId)!.push(target as IntelligenceTarget);
    }

    console.log(`   Targets span ${targetsByOrg.size} organization(s)`);

    // Generate rich context and embeddings for each org's targets
    const embeddingData: Array<{ target: IntelligenceTarget; text: string }> = [];

    for (const [orgId, orgTargets] of targetsByOrg) {
      const firstTarget = orgTargets[0];
      const org = firstTarget.organization;
      const profile = org?.company_profile || {};

      // Build company context for Claude
      const companyContext: CompanyContext = {
        name: org?.name || 'Unknown Organization',
        industry: org?.industry || 'general business',
        description: (profile as any).description,
        competitors: [
          ...((profile as any).competition?.direct_competitors || []),
          ...((profile as any).competition?.indirect_competitors || [])
        ],
        strategic_priorities: (profile as any).strategic_context?.strategic_priorities,
        service_lines: (profile as any).service_lines
      };

      console.log(`\n   Processing ${orgTargets.length} targets for ${companyContext.name}...`);

      // Generate rich context with Claude in smaller batches
      console.log(`   🤖 Generating rich context with Claude (batch size: ${CLAUDE_BATCH_SIZE})...`);
      const richContextMap = new Map<string, string>();

      for (let i = 0; i < orgTargets.length; i += CLAUDE_BATCH_SIZE) {
        const batch = orgTargets.slice(i, i + CLAUDE_BATCH_SIZE);
        console.log(`      Batch ${Math.floor(i/CLAUDE_BATCH_SIZE) + 1}/${Math.ceil(orgTargets.length/CLAUDE_BATCH_SIZE)}: ${batch.length} targets`);
        const batchContextMap = await generateRichContextWithClaude(batch, companyContext);
        batchContextMap.forEach((v, k) => richContextMap.set(k, v));
      }

      console.log(`   ✅ Generated context for ${richContextMap.size}/${orgTargets.length} targets`);

      // Build embedding data, falling back to basic context if Claude failed
      for (const target of orgTargets) {
        const richContext = richContextMap.get(target.id);
        const text = richContext || buildBasicEmbeddingText(target);
        embeddingData.push({ target, text });

        if (!richContext) {
          console.log(`   ⚠️ Using fallback context for: ${target.name}`);
        }
      }
    }

    const texts = embeddingData.map(d => d.text);
    const avgLength = Math.round(texts.reduce((a, t) => a + t.length, 0) / texts.length);
    console.log(`\n   Average context length: ${avgLength} chars (should be 500-1500 for rich context)`);

    // Get embeddings from Voyage
    console.log('   📊 Calling Voyage AI for embeddings...');
    const embeddings = await embedTexts(texts);

    if (!embeddings) {
      throw new Error('Failed to get embeddings from Voyage AI');
    }

    console.log(`   ✅ Got ${embeddings.length} embeddings`);

    // Update targets with embeddings
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < embeddingData.length; i++) {
      const { target, text } = embeddingData[i];
      // pgvector expects embedding as a string like "[0.1, 0.2, ...]"
      const embeddingStr = JSON.stringify(embeddings[i]);
      const { error: updateError } = await supabase
        .from('intelligence_targets')
        .update({
          embedding: embeddingStr,
          embedding_context: text,
          embedded_at: new Date().toISOString()
        })
        .eq('id', target.id);

      if (updateError) {
        console.error(`   ❌ Failed to update target ${target.id}: ${updateError.message}`);
        failCount++;
      } else {
        successCount++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n📊 RESULTS:');
    console.log(`   Processed: ${embeddingData.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Duration: ${duration}s`);

    // Log job to embedding_jobs table
    await supabase.from('embedding_jobs').insert({
      job_type: 'targets_v2',
      status: 'completed',
      items_total: embeddingData.length,
      items_processed: successCount,
      items_failed: failCount,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      metadata: {
        organization_id: organizationId || 'all',
        force_reembed: forceReembed,
        avg_context_length: avgLength
      }
    });

    return new Response(JSON.stringify({
      success: true,
      processed: embeddingData.length,
      embedded: successCount,
      failed: failCount,
      avg_context_length: avgLength,
      duration_seconds: duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
