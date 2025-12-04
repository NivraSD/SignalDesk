// Connection Detector v2 - Uses Claude to find meaningful connections between entities
// Instead of keyword matching, this analyzes article content to find real relationships

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

interface Connection {
  title: string;
  description: string;
  connection_type: 'partnership' | 'competition' | 'market_shift' | 'supply_chain' | 'regulatory' | 'personnel' | 'acquisition';
  primary_entity: string;
  connected_entities: string[];
  strength_score: number;
  business_implication: string;
  evidence: string[];
  action_suggested?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id, articles, company_profile } = await req.json();

    console.log(`🔗 Connection Detector v2 - Claude-Powered Analysis`);
    console.log(`   Organization: ${organization_id}`);
    console.log(`   Articles received: ${articles?.length || 0}`);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        connections_detected: 0,
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

    // Build article summaries for Claude (limit to top 25 by relevance)
    const topArticles = articles
      .sort((a: Article, b: Article) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 25);

    const articleSummaries = topArticles.map((a: Article, i: number) =>
      `[${i + 1}] "${a.title}" (${a.source}, ${a.published_at?.split('T')[0] || 'recent'})
      ${a.summary || a.description || ''}`
    ).join('\n\n');

    // Call Claude to find connections
    const connections = await findConnectionsWithClaude(
      companyContext,
      articleSummaries,
      orgName
    );

    console.log(`   Claude found ${connections.length} connections`);

    // Save connections to database
    let savedCount = 0;
    for (const conn of connections) {
      const saved = await saveConnection(organization_id, conn);
      if (saved) savedCount++;
    }

    console.log(`✅ Connection Detection Complete: ${savedCount} connections saved`);

    return new Response(JSON.stringify({
      success: true,
      connections_detected: connections.length,
      connections_saved: savedCount,
      connections: connections
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Connection Detector error:', error);
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
    parts.push(`COMPETITORS TO WATCH: ${profile.competition.direct_competitors.join(', ')}`);
  }

  if (profile?.strategic_context?.target_customers) {
    parts.push(`TARGET CUSTOMERS: ${profile.strategic_context.target_customers}`);
  }

  return parts.join('\n\n');
}

async function findConnectionsWithClaude(
  companyContext: string,
  articleSummaries: string,
  orgName: string
): Promise<Connection[]> {

  const prompt = `You are a strategic intelligence analyst specializing in finding hidden connections and relationships in news that matter for business strategy.

${companyContext}

ARTICLES TO ANALYZE:
${articleSummaries}

YOUR TASK: Find 2-4 meaningful CONNECTIONS between entities, events, or trends in these articles that have strategic implications for ${orgName}.

A good connection is NOT just "Company A and Company B are both mentioned." It's:
- "Company A's expansion into market X + Company B's retreat from that market = opportunity for ${orgName}"
- "Regulatory change affecting Industry Y + Client Z's exposure = advisory opportunity"
- "Executive moving from Competitor to Client = potential relationship to leverage"

CONNECTION TYPES:
- "partnership": New alliances, joint ventures, or collaborations
- "competition": Competitive dynamics, market share shifts, head-to-head moves
- "market_shift": Industry trends connecting multiple players
- "supply_chain": Vendor, supplier, or distribution relationships
- "regulatory": Compliance, legal, or regulatory connections
- "personnel": Executive moves, talent flows between organizations
- "acquisition": M&A activity, investments, or divestitures

Return a JSON array:
[
  {
    "title": "Brief, specific title of the connection",
    "description": "What's connected and how",
    "connection_type": "partnership|competition|market_shift|supply_chain|regulatory|personnel|acquisition",
    "primary_entity": "Main company/entity in this connection",
    "connected_entities": ["Entity 2", "Entity 3"],
    "strength_score": 75,
    "business_implication": "What this means for ${orgName}'s strategy or opportunities",
    "evidence": ["Fact from article [1]", "Detail from article [4]"],
    "action_suggested": "Specific action ${orgName} could take"
  }
]

IMPORTANT:
- Focus on connections that CREATE BUSINESS VALUE for ${orgName}
- Every connection must be grounded in actual article content
- If no meaningful connections exist, return fewer or empty array
- Be specific about WHY this connection matters

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
        max_tokens: 3000,
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

    const connections = JSON.parse(jsonMatch[0]);
    console.log(`   Parsed ${connections.length} connections from Claude`);

    // Validate and clean connections
    return connections.map((c: any) => ({
      title: c.title || 'Untitled Connection',
      description: c.description || '',
      connection_type: ['partnership', 'competition', 'market_shift', 'supply_chain', 'regulatory', 'personnel', 'acquisition'].includes(c.connection_type)
        ? c.connection_type
        : 'market_shift',
      primary_entity: c.primary_entity || 'Unknown',
      connected_entities: Array.isArray(c.connected_entities) ? c.connected_entities : [],
      strength_score: Math.min(100, Math.max(0, c.strength_score || 50)),
      business_implication: c.business_implication || '',
      evidence: Array.isArray(c.evidence) ? c.evidence : [],
      action_suggested: c.action_suggested || ''
    }));

  } catch (error: any) {
    console.error('Error calling Claude:', error.message);
    return [];
  }
}

// Map semantic connection types to valid DB signal_types
function mapToDbSignalType(connectionType: string): string {
  const mapping: Record<string, string> = {
    'partnership': 'multi_party',
    'competition': 'correlation',
    'market_shift': 'momentum',
    'supply_chain': 'multi_party',
    'regulatory': 'sentiment_shift',
    'personnel': 'correlation',
    'acquisition': 'multi_party'
  };
  return mapping[connectionType] || 'correlation';
}

async function saveConnection(orgId: string, connection: Connection): Promise<boolean> {
  try {
    const dbSignalType = mapToDbSignalType(connection.connection_type);

    // Check for existing similar connection
    const { data: existing } = await supabase
      .from('connection_signals')
      .select('id')
      .eq('organization_id', orgId)
      .eq('primary_entity_name', connection.primary_entity)
      .eq('signal_type', dbSignalType)
      .single();

    if (existing) {
      // Update existing connection
      const { error } = await supabase
        .from('connection_signals')
        .update({
          signal_title: connection.title,
          signal_description: connection.description,
          strength_score: connection.strength_score,
          confidence_score: connection.strength_score,
          related_entities: connection.connected_entities.map(name => ({ name })),
          pattern_data: {
            business_implication: connection.business_implication,
            evidence: connection.evidence,
            action_suggested: connection.action_suggested,
            generated_by: 'connection-detector-v2'
          },
          signal_detected_date: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`❌ Failed to update connection: ${error.message}`);
        return false;
      }

      console.log(`   🔄 Updated: ${connection.title.substring(0, 50)}...`);
      return true;
    }

    // Insert new connection
    const { error } = await supabase
      .from('connection_signals')
      .insert({
        organization_id: orgId,
        signal_type: dbSignalType,
        signal_title: connection.title,
        signal_description: connection.description,
        primary_entity_name: connection.primary_entity,
        related_entities: connection.connected_entities.map(name => ({ name })),
        strength_score: connection.strength_score,
        confidence_score: connection.strength_score,
        pattern_data: {
          semantic_type: connection.connection_type, // Store original type for UI
          business_implication: connection.business_implication,
          evidence: connection.evidence,
          action_suggested: connection.action_suggested,
          generated_by: 'connection-detector-v2'
        },
        signal_start_date: new Date().toISOString(),
        signal_detected_date: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Failed to save connection: ${error.message}`);
      return false;
    }

    console.log(`   🔗 Saved: ${connection.title.substring(0, 50)}...`);
    return true;

  } catch (e: any) {
    console.error(`❌ Error saving connection: ${e.message}`);
    return false;
  }
}
