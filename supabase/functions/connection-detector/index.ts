// Connection Detector v3 - Intelligence-Target-Aware Connection Detection
// Loads intelligence_targets, uses priority weighting, links signals via FK, tracks activity

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

interface IntelligenceTarget {
  id: string;
  name: string;
  target_type: string;
  priority: string;
  monitoring_keywords: string[];
  monitoring_context: string | null;
  accumulated_context: Record<string, any>;
  baseline_metrics: Record<string, any>;
  activity_count: number;
  last_activity_at: string | null;
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
  primary_target_name?: string; // The main intelligence target this connection is about
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id, articles, company_profile } = await req.json();

    console.log(`🔗 Connection Detector v3 - Intelligence-Target-Aware Analysis`);
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

    // Load intelligence targets from database
    const { data: intelligenceTargets, error: targetsError } = await supabase
      .from('intelligence_targets')
      .select('id, name, target_type, priority, monitoring_keywords, monitoring_context, accumulated_context, baseline_metrics, activity_count, last_activity_at')
      .eq('organization_id', organization_id)
      .eq('is_active', true);

    if (targetsError) {
      console.error('Error loading intelligence targets:', targetsError);
    }

    const targets: IntelligenceTarget[] = intelligenceTargets || [];
    console.log(`   Intelligence targets loaded: ${targets.length}`);

    // Log target breakdown
    const competitors = targets.filter(t => t.target_type === 'competitor');
    const stakeholders = targets.filter(t => t.target_type === 'stakeholder' || t.target_type === 'influencer');
    console.log(`   Competitors: ${competitors.length}, Stakeholders: ${stakeholders.length}`);

    // Build company context for Claude (now includes intelligence targets)
    const companyContext = buildCompanyContext(profile, orgName, targets);

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
      orgName,
      targets
    );

    console.log(`   Claude found ${connections.length} connections`);

    // Save connections to database with FK linkage
    let savedCount = 0;
    for (const conn of connections) {
      const saved = await saveConnection(organization_id, conn, targets);
      if (saved) savedCount++;
    }

    console.log(`✅ Connection Detection Complete: ${savedCount} connections saved`);

    return new Response(JSON.stringify({
      success: true,
      connections_detected: connections.length,
      connections_saved: savedCount,
      connections: connections,
      targets_used: targets.length
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

function buildCompanyContext(profile: any, orgName: string, targets: IntelligenceTarget[]): string {
  const parts = [`COMPANY: ${orgName}`];

  if (profile?.description) {
    parts.push(`ABOUT: ${profile.description}`);
  }

  if (profile?.service_lines?.length) {
    parts.push(`SERVICE LINES: ${profile.service_lines.join(', ')}`);
  }

  if (profile?.strategic_context?.target_customers) {
    parts.push(`TARGET CUSTOMERS: ${profile.strategic_context.target_customers}`);
  }

  // Build intelligence targets section with priority weighting
  if (targets.length > 0) {
    const competitors = targets.filter(t => t.target_type === 'competitor');
    const stakeholders = targets.filter(t => t.target_type === 'stakeholder' || t.target_type === 'influencer');
    const regulators = targets.filter(t => t.target_type === 'regulator');
    const customers = targets.filter(t => t.target_type === 'customer');
    const partners = targets.filter(t => t.target_type === 'partner');

    // Format targets with priority indicators
    const formatTargetList = (targetList: IntelligenceTarget[]) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return targetList
        .sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3))
        .map(t => {
          const priorityFlag = t.priority === 'critical' ? '🔴' : t.priority === 'high' ? '🟠' : '';
          const activityNote = t.activity_count > 0 ? ` (${t.activity_count} prior signals)` : '';
          return `${priorityFlag} ${t.name}${activityNote}`.trim();
        })
        .join('\n  - ');
    };

    parts.push(`\n=== INTELLIGENCE TARGETS (find connections between these) ===`);

    if (competitors.length > 0) {
      parts.push(`COMPETITORS:\n  - ${formatTargetList(competitors)}`);
    }

    if (stakeholders.length > 0) {
      parts.push(`KEY STAKEHOLDERS/INFLUENCERS:\n  - ${formatTargetList(stakeholders)}`);
    }

    if (regulators.length > 0) {
      parts.push(`REGULATORY BODIES:\n  - ${formatTargetList(regulators)}`);
    }

    if (customers.length > 0) {
      parts.push(`KEY CUSTOMERS:\n  - ${formatTargetList(customers)}`);
    }

    if (partners.length > 0) {
      parts.push(`STRATEGIC PARTNERS:\n  - ${formatTargetList(partners)}`);
    }
  } else if (profile?.competition?.direct_competitors?.length) {
    parts.push(`COMPETITORS TO WATCH: ${profile.competition.direct_competitors.join(', ')}`);
  }

  return parts.join('\n\n');
}

async function findConnectionsWithClaude(
  companyContext: string,
  articleSummaries: string,
  orgName: string,
  targets: IntelligenceTarget[]
): Promise<Connection[]> {

  // Build target names list for the prompt
  const targetNames = targets.map(t => t.name);
  const criticalTargetNames = targets.filter(t => t.priority === 'critical' || t.priority === 'high').map(t => t.name);

  const prompt = `You are a competitive intelligence analyst for a trading/commodities company. Your job is to identify how market news creates connections and implications for our TRACKED COMPETITORS AND STAKEHOLDERS.

=== INTELLIGENCE TARGETS WE TRACK ===
${targetNames.length > 0 ? targetNames.map(n => `• ${n}`).join('\n') : 'No targets specified'}

${companyContext}

=== NEWS ARTICLES TO ANALYZE ===
${articleSummaries}

=== YOUR TASK ===
Identify connections between market events and our tracked targets. Find 2-5 meaningful connections.

IMPORTANT: You don't need the target to be mentioned BY NAME in an article. Analyze how market events CREATE CONNECTIONS for our tracked targets. For example:
- News about "China supply chain shifts" → How does this connect Vitol, Glencore, or Chinese trading enterprises to new opportunities/threats?
- News about "commodity market changes" → What connections does this create for Goldman Sachs Commodities or Morgan Stanley?
- News about "regulatory developments" → How are our tracked targets connected to these changes?

${criticalTargetNames.length > 0 ? `
🔴 HIGH PRIORITY TARGETS (focus on connections involving these):
${criticalTargetNames.map(n => `   • ${n}`).join('\n')}
` : ''}

CONNECTION TYPES:
- "market_shift": How market changes connect to/affect our tracked targets
- "competitive": Competitive dynamics between tracked targets or with new entrants
- "partnership": Potential or actual alliances involving tracked targets
- "supply_chain": Supply chain implications for tracked targets
- "regulatory": Regulatory connections affecting tracked targets

Return a JSON array with 2-5 connections:
[
  {
    "title": "Connection: [TARGET NAME] and [market event/entity]",
    "description": "What the connection is and why it matters",
    "connection_type": "market_shift|competitive|partnership|supply_chain|regulatory",
    "primary_entity": "Name from our tracked targets list",
    "connected_entities": ["Other entities or market forces involved"],
    "strength_score": 60-85,
    "business_implication": "What this means for ${orgName}",
    "evidence": ["Relevant fact or quote from articles"],
    "action_suggested": "Recommended response",
    "primary_target_name": "EXACT name from targets list above"
  }
]

RULES:
1. "primary_entity" and "primary_target_name" MUST match one of our tracked targets
2. Explain WHY/HOW the news creates a connection to that target
3. If you genuinely cannot connect ANY news to ANY tracked target, return []

Return ONLY the JSON array, no other text.`;

  try {
    // DEBUG: Log what we're sending to Claude
    console.log(`   📤 Sending to Claude - Target names: ${targetNames.slice(0, 5).join(', ')}${targetNames.length > 5 ? '...' : ''}`);
    console.log(`   📤 Article count in prompt: ${articleSummaries.split('\n\n').length}`);
    console.log(`   📤 First article excerpt: ${articleSummaries.substring(0, 150)}`);

    const startTime = Date.now();

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

    const apiTime = Date.now() - startTime;
    console.log(`   ⏱️ Claude API response time: ${apiTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // DEBUG: Log Claude's raw response
    console.log(`   📥 Claude raw response (first 500 chars): ${content.substring(0, 500)}`);

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
      action_suggested: c.action_suggested || '',
      primary_target_name: c.primary_target_name || c.primary_entity || null
    }));

  } catch (error: any) {
    console.error('Error calling Claude:', error.message);
    return [];
  }
}

async function saveConnection(orgId: string, connection: Connection, targets: IntelligenceTarget[]): Promise<boolean> {
  try {
    // Look up the primary target by name to get the UUID
    let primaryTargetId: string | null = null;
    let primaryTargetType: string | null = null;
    const primaryTargetName = connection.primary_target_name || connection.primary_entity;

    if (primaryTargetName) {
      // Find matching target (case-insensitive)
      const matchedTarget = targets.find(t =>
        t.name.toLowerCase() === primaryTargetName.toLowerCase()
      );

      if (matchedTarget) {
        primaryTargetId = matchedTarget.id;
        primaryTargetType = matchedTarget.target_type;
        console.log(`   🎯 Linked to target: ${matchedTarget.name} (${matchedTarget.target_type}, priority: ${matchedTarget.priority})`);
      }
    }

    // Look up related target IDs
    const relatedTargetIds: string[] = [];
    for (const entityName of connection.connected_entities) {
      const matched = targets.find(t =>
        t.name.toLowerCase() === entityName.toLowerCase()
      );
      if (matched && matched.id !== primaryTargetId) {
        relatedTargetIds.push(matched.id);
      }
    }

    // Check for existing similar signal in unified table
    const { data: existingSignal } = await supabase
      .from('signals')
      .select('id')
      .eq('organization_id', orgId)
      .eq('signal_type', 'connection')
      .eq('title', connection.title)
      .single();

    if (existingSignal) {
      // Update existing signal with FK linkage
      const { error } = await supabase
        .from('signals')
        .update({
          title: connection.title,
          description: connection.description,
          primary_target_id: primaryTargetId,
          primary_target_name: primaryTargetName,
          primary_target_type: primaryTargetType,
          related_target_ids: relatedTargetIds.length > 0 ? relatedTargetIds : null,
          confidence_score: connection.strength_score,
          significance_score: connection.strength_score,
          related_target_names: connection.connected_entities,
          related_entities: connection.connected_entities.map(name => ({ name, type: 'company' })),
          evidence: {
            data_points: connection.evidence,
            action_suggested: connection.action_suggested
          },
          business_implication: connection.business_implication,
          suggested_action: connection.action_suggested,
          detected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSignal.id);

      if (error) {
        console.error(`❌ Failed to update signal: ${error.message}`);
        return false;
      }

      console.log(`   🔄 Updated: ${connection.title.substring(0, 50)}...`);
      return true;
    }

    // Map connection_type to urgency
    const urgencyMap: Record<string, string> = {
      'acquisition': 'immediate',
      'partnership': 'near_term',
      'competition': 'near_term',
      'regulatory': 'immediate',
      'personnel': 'near_term',
      'market_shift': 'monitoring',
      'supply_chain': 'near_term'
    };
    const urgency = urgencyMap[connection.connection_type] || 'near_term';

    // Map connection_type to opportunity_type
    const opportunityMap: Record<string, string> = {
      'partnership': 'partnership',
      'competition': 'competitive_response',
      'acquisition': 'advisory',
      'regulatory': 'risk_mitigation',
      'personnel': 'talent',
      'market_shift': 'advisory',
      'supply_chain': 'advisory'
    };
    const opportunityType = opportunityMap[connection.connection_type] || 'advisory';

    // Insert new signal into unified table WITH FK linkage
    const { error: signalError } = await supabase
      .from('signals')
      .insert({
        organization_id: orgId,
        signal_type: 'connection',
        signal_subtype: connection.connection_type,
        title: connection.title,
        description: connection.description,
        // FK linkage to intelligence_targets
        primary_target_id: primaryTargetId,
        primary_target_name: primaryTargetName,
        primary_target_type: primaryTargetType,
        related_target_ids: relatedTargetIds.length > 0 ? relatedTargetIds : null,
        related_target_names: connection.connected_entities,
        related_entities: connection.connected_entities.map(name => ({ name, type: 'company' })),
        confidence_score: connection.strength_score,
        significance_score: connection.strength_score,
        urgency: urgency,
        impact_level: connection.strength_score >= 75 ? 'high' : connection.strength_score >= 50 ? 'medium' : 'low',
        evidence: {
          data_points: connection.evidence,
          action_suggested: connection.action_suggested
        },
        reasoning: connection.business_implication,
        pattern_data: {
          connection_type: connection.connection_type,
          primary_target_linked: !!primaryTargetId,
          related_targets_linked: relatedTargetIds.length
        },
        business_implication: connection.business_implication,
        suggested_action: connection.action_suggested,
        opportunity_type: opportunityType,
        detected_at: new Date().toISOString(),
        status: 'active',
        source_pipeline: 'connection-detector-v3',
        model_version: 'claude-sonnet-4'
      });

    if (signalError) {
      console.error(`❌ Failed to save signal: ${signalError.message}`);
      return false;
    }

    // UPDATE ACTIVITY TRACKING on intelligence_targets
    if (primaryTargetId) {
      const { data: currentTarget } = await supabase
        .from('intelligence_targets')
        .select('activity_count')
        .eq('id', primaryTargetId)
        .single();

      await supabase
        .from('intelligence_targets')
        .update({
          activity_count: (currentTarget?.activity_count || 0) + 1,
          last_activity_at: new Date().toISOString(),
          last_activity_summary: `Connection: ${connection.title.substring(0, 100)}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', primaryTargetId);

      console.log(`   📊 Updated activity tracking for target: ${primaryTargetName}`);
    }

    // Update activity for related targets too
    for (const relatedId of relatedTargetIds) {
      const { data: relatedTarget } = await supabase
        .from('intelligence_targets')
        .select('activity_count, name')
        .eq('id', relatedId)
        .single();

      if (relatedTarget) {
        await supabase
          .from('intelligence_targets')
          .update({
            activity_count: (relatedTarget.activity_count || 0) + 1,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', relatedId);
      }
    }

    // Also save to legacy connection_signals table for backward compatibility
    const legacySignalType = {
      'partnership': 'multi_party',
      'competition': 'correlation',
      'market_shift': 'momentum',
      'supply_chain': 'multi_party',
      'regulatory': 'sentiment_shift',
      'personnel': 'correlation',
      'acquisition': 'multi_party'
    }[connection.connection_type] || 'correlation';

    await supabase
      .from('connection_signals')
      .insert({
        organization_id: orgId,
        signal_type: legacySignalType,
        signal_title: connection.title,
        signal_description: connection.description,
        primary_entity_name: connection.primary_entity,
        related_entities: connection.connected_entities.map(name => ({ name })),
        strength_score: connection.strength_score,
        confidence_score: connection.strength_score,
        pattern_data: {
          semantic_type: connection.connection_type,
          business_implication: connection.business_implication,
          evidence: connection.evidence,
          action_suggested: connection.action_suggested,
          primary_target_id: primaryTargetId,
          generated_by: 'connection-detector-v3'
        },
        signal_start_date: new Date().toISOString(),
        signal_detected_date: new Date().toISOString()
      })
      .then(() => {})
      .catch(() => {});

    console.log(`   🔗 Saved: ${connection.title.substring(0, 50)}...`);
    return true;

  } catch (e: any) {
    console.error(`❌ Error saving connection: ${e.message}`);
    return false;
  }
}
