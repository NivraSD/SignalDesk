// Detect Cross-Target Connections
// Finds connections BETWEEN targets based on accumulated intelligence
// Identifies shared relationships, market convergence, competitive clashes, etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

// Configuration
const MIN_FACTS_FOR_CONNECTION = 1;  // Minimum facts needed per target
const MIN_TARGETS_FOR_ANALYSIS = 2;  // Need at least 2 targets to find connections

interface AccumulatedContext {
  total_facts: number;
  facts_last_7d: number;
  facts_last_30d: number;
  last_fact_at: string | null;
  fact_type_distribution: Record<string, number>;
  sentiment: {
    current: number;
    trend: 'improving' | 'declining' | 'stable';
    history: { period: string; score: number }[];
  };
  geographic_activity: Record<string, {
    fact_count: number;
    recent_facts: number;
    dominant_type: string;
  }>;
  relationship_map: Record<string, {
    relationship_types: string[];
    mention_count: number;
    last_mentioned: string;
    sentiment_avg: number;
  }>;
  topic_clusters: Record<string, number>;
  recent_highlights: {
    date: string;
    summary: string;
    type: string;
    significance: number;
  }[];
  insights: {
    primary_activity: string;
    activity_level: 'high' | 'medium' | 'low';
    notable_shift: string | null;
    risk_indicators: string[];
  };
}

interface Target {
  id: string;
  organization_id: string;
  name: string;
  target_type: string;
  priority: string;
  accumulated_context: AccumulatedContext | null;
  fact_count: number;
}

interface CrossTargetConnection {
  connection_type: 'shared_relationship' | 'market_convergence' | 'timing_correlation' | 'competitive_clash' | 'supply_chain' | 'topic_overlap';
  title: string;
  targets_involved: string[];
  target_ids: string[];
  shared_elements: string[];
  description: string;
  evidence: string[];
  strength: number;
  business_implication: string;
}

interface Overlap {
  targets: string[];
  targetIds: string[];
  sharedEntities?: string[];
  regions?: string[];
  topics?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔗 DETECT CROSS-TARGET CONNECTIONS');
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body.organization_id;  // Required: analyze within one org
    const minFacts = body.min_facts || MIN_FACTS_FOR_CONNECTION;

    if (!organizationId) {
      // If no org specified, process all orgs with enough targets
      return await processAllOrganizations(supabase, minFacts, startTime);
    }

    // Process single organization
    const result = await processOrganization(supabase, organizationId, minFacts);

    const duration = Math.round((Date.now() - startTime) / 1000);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      duration_seconds: duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Connection detection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processAllOrganizations(
  supabase: ReturnType<typeof createClient>,
  minFacts: number,
  startTime: number
) {
  // Get all organizations with multiple targets that have facts
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name');

  if (!orgs || orgs.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      organizations_processed: 0,
      connections_detected: 0,
      signals_created: 0,
      message: 'No organizations found'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let totalConnections = 0;
  let totalSignals = 0;
  let orgsProcessed = 0;
  const errors: string[] = [];

  for (const org of orgs) {
    try {
      const result = await processOrganization(supabase, org.id, minFacts);
      if (result.targets_analyzed >= MIN_TARGETS_FOR_ANALYSIS) {
        orgsProcessed++;
        totalConnections += result.connections_detected;
        totalSignals += result.signals_created;
      }
      if (result.errors) {
        errors.push(...result.errors);
      }
    } catch (err: any) {
      errors.push(`Org ${org.name}: ${err.message}`);
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  return new Response(JSON.stringify({
    success: true,
    organizations_processed: orgsProcessed,
    connections_detected: totalConnections,
    signals_created: totalSignals,
    duration_seconds: duration,
    errors: errors.length > 0 ? errors : undefined
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function processOrganization(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  minFacts: number
): Promise<{
  targets_analyzed: number;
  connections_detected: number;
  signals_created: number;
  errors?: string[];
}> {
  // Get organization context
  const { data: org } = await supabase
    .from('organizations')
    .select('name, industry, company_profile')
    .eq('id', organizationId)
    .single();

  const orgContext = org
    ? `Organization: ${org.name}\nIndustry: ${org.industry || 'N/A'}\n${org.company_profile?.description ? `Description: ${org.company_profile.description}` : ''}`
    : '';

  console.log(`\n   Processing org: ${org?.name || organizationId}`);

  // Get all targets with accumulated context for this org
  const { data: targets, error: targetError } = await supabase
    .from('intelligence_targets')
    .select('id, organization_id, name, target_type, priority, accumulated_context, fact_count')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .gte('fact_count', minFacts)
    .order('fact_count', { ascending: false });

  if (targetError) {
    throw new Error(`Failed to load targets: ${targetError.message}`);
  }

  // Filter to targets with actual accumulated context
  const enrichedTargets = (targets || []).filter((t: Target) =>
    t.accumulated_context && (t.accumulated_context.total_facts || 0) >= minFacts
  ) as Target[];

  if (enrichedTargets.length < MIN_TARGETS_FOR_ANALYSIS) {
    console.log(`   Only ${enrichedTargets.length} targets with data - need at least ${MIN_TARGETS_FOR_ANALYSIS}`);
    return {
      targets_analyzed: enrichedTargets.length,
      connections_detected: 0,
      signals_created: 0
    };
  }

  console.log(`   Found ${enrichedTargets.length} targets to analyze for connections`);

  // Pre-compute overlaps
  const relationshipOverlaps = findRelationshipOverlaps(enrichedTargets);
  const geographicOverlaps = findGeographicOverlaps(enrichedTargets);
  const topicOverlaps = findTopicOverlaps(enrichedTargets);

  console.log(`   Pre-computed: ${relationshipOverlaps.length} relationship overlaps, ${geographicOverlaps.length} geographic, ${topicOverlaps.length} topic`);

  // Use Claude to find meaningful connections
  const connections = await detectConnections(enrichedTargets, orgContext, {
    relationshipOverlaps,
    geographicOverlaps,
    topicOverlaps
  });

  console.log(`   Claude found ${connections.length} connections`);

  // Save connections as signals
  let signalsCreated = 0;
  const errors: string[] = [];

  for (const connection of connections) {
    const signal = {
      organization_id: organizationId,
      signal_type: 'connection',
      signal_subtype: `connection_${connection.connection_type}`,
      title: connection.title,
      description: connection.description,
      primary_target_name: connection.targets_involved[0],
      primary_target_id: connection.target_ids[0] || null,
      related_target_names: connection.targets_involved.slice(1),
      related_target_ids: connection.target_ids.slice(1),
      confidence_score: Math.round(connection.strength * 100),
      significance_score: calculateConnectionSignificance(connection, enrichedTargets),
      urgency: 'monitoring',
      impact_level: connection.strength > 0.7 ? 'high' : connection.strength > 0.5 ? 'medium' : 'low',
      evidence: {
        data_points: connection.evidence,
        connection_type: connection.connection_type,
        shared_elements: connection.shared_elements
      },
      reasoning: connection.description,
      pattern_data: {
        connection_type: connection.connection_type,
        targets_involved: connection.targets_involved,
        shared_elements: connection.shared_elements
      },
      business_implication: connection.business_implication,
      source_pipeline: 'detect-cross-target-connections',
      model_version: 'claude-sonnet-4',
      status: 'active'
    };

    const { error: signalError } = await supabase
      .from('signals')
      .insert(signal);

    if (signalError) {
      console.error(`   Failed to save connection signal: ${signalError.message}`);
      errors.push(`Signal save error: ${signalError.message}`);
    } else {
      signalsCreated++;
    }
  }

  return {
    targets_analyzed: enrichedTargets.length,
    connections_detected: connections.length,
    signals_created: signalsCreated,
    errors: errors.length > 0 ? errors : undefined
  };
}

function findRelationshipOverlaps(targets: Target[]): Overlap[] {
  const overlaps: Overlap[] = [];

  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const t1Entities = Object.keys(targets[i].accumulated_context?.relationship_map || {});
      const t2Entities = Object.keys(targets[j].accumulated_context?.relationship_map || {});

      const shared = t1Entities.filter(e => t2Entities.includes(e));

      if (shared.length > 0) {
        overlaps.push({
          targets: [targets[i].name, targets[j].name],
          targetIds: [targets[i].id, targets[j].id],
          sharedEntities: shared
        });
      }
    }
  }

  return overlaps;
}

function findGeographicOverlaps(targets: Target[]): Overlap[] {
  const overlaps: Overlap[] = [];

  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const t1Regions = Object.keys(targets[i].accumulated_context?.geographic_activity || {});
      const t2Regions = Object.keys(targets[j].accumulated_context?.geographic_activity || {});

      const shared = t1Regions.filter(r => t2Regions.includes(r));

      if (shared.length > 0) {
        overlaps.push({
          targets: [targets[i].name, targets[j].name],
          targetIds: [targets[i].id, targets[j].id],
          regions: shared
        });
      }
    }
  }

  return overlaps;
}

function findTopicOverlaps(targets: Target[]): Overlap[] {
  const overlaps: Overlap[] = [];

  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const t1Topics = Object.keys(targets[i].accumulated_context?.topic_clusters || {});
      const t2Topics = Object.keys(targets[j].accumulated_context?.topic_clusters || {});

      // Find topics mentioned by both (case-insensitive)
      const t1Lower = t1Topics.map(t => t.toLowerCase());
      const shared = t2Topics.filter(t => t1Lower.includes(t.toLowerCase()));

      if (shared.length > 0) {
        overlaps.push({
          targets: [targets[i].name, targets[j].name],
          targetIds: [targets[i].id, targets[j].id],
          topics: shared
        });
      }
    }
  }

  return overlaps;
}

async function detectConnections(
  targets: Target[],
  orgContext: string,
  overlaps: {
    relationshipOverlaps: Overlap[];
    geographicOverlaps: Overlap[];
    topicOverlaps: Overlap[];
  }
): Promise<CrossTargetConnection[]> {

  const prompt = `You are an intelligence analyst looking for CONNECTIONS between tracked targets.

ORGANIZATION CONTEXT:
${orgContext}

TRACKED TARGETS WITH ACCUMULATED INTELLIGENCE:
${targets.map(t => {
  const ctx = t.accumulated_context!;
  return `
═══ ${t.name} (${t.target_type}, priority: ${t.priority}) ═══
Facts collected: ${ctx.total_facts || 0}
Primary activity: ${ctx.insights?.primary_activity || 'Unknown'}
Activity types: ${Object.entries(ctx.fact_type_distribution || {}).map(([k, v]) => `${k}:${v}`).join(', ') || 'None'}
Key relationships: ${Object.entries(ctx.relationship_map || {}).slice(0, 5).map(([k, v]: [string, any]) => `${k} (${v.relationship_types?.join('/')})`).join(', ') || 'None'}
Active regions: ${Object.keys(ctx.geographic_activity || {}).join(', ') || 'None'}
Top topics: ${Object.entries(ctx.topic_clusters || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([k]) => k).join(', ') || 'None'}
Recent focus: ${ctx.recent_highlights?.[0]?.summary || 'N/A'}
Sentiment: ${ctx.sentiment?.current?.toFixed(2) || 'N/A'} (${ctx.sentiment?.trend || 'unknown'})
`;
}).join('\n')}

PRE-COMPUTED OVERLAPS:
═══════════════════════

Shared Relationships (entities both targets interact with):
${overlaps.relationshipOverlaps.length > 0
  ? overlaps.relationshipOverlaps.map(o =>
      `- ${o.targets.join(' & ')}: Both connected to ${o.sharedEntities?.join(', ')}`
    ).join('\n')
  : 'None detected'}

Geographic Overlaps (targets active in same regions):
${overlaps.geographicOverlaps.length > 0
  ? overlaps.geographicOverlaps.map(o =>
      `- ${o.targets.join(' & ')}: Both active in ${o.regions?.join(', ')}`
    ).join('\n')
  : 'None detected'}

Topic Overlaps (targets discussing same topics):
${overlaps.topicOverlaps.length > 0
  ? overlaps.topicOverlaps.map(o =>
      `- ${o.targets.join(' & ')}: Both mention ${o.topics?.join(', ')}`
    ).join('\n')
  : 'None detected'}

TASK: Find connections between targets that PREDICT what could happen NEXT.

Your goal is NOT to report that targets are connected. Your goal is to answer:
"What does this connection suggest COULD HAPPEN that we should prepare for?"

CONNECTION TYPES TO LOOK FOR:
1. SHARED_RELATIONSHIP: Targets linked through common entities - what does this create? (opportunity? risk? conflict?)
2. MARKET_CONVERGENCE: Multiple targets moving into same space - who wins? what disruption follows?
3. TIMING_CORRELATION: Coordinated activity - are they working together? racing each other?
4. COMPETITIVE_CLASH: Direct competition brewing - what's the likely outcome for each player?
5. SUPPLY_CHAIN: Upstream/downstream links - where are the vulnerabilities? opportunities?
6. TOPIC_OVERLAP: Shared focus areas - is this a trend we need to get ahead of?

FOR EACH CONNECTION, ANSWER:
- "So what?" - Why does this connection matter to our organization?
- "What happens next?" - What scenario does this connection set up?
- "What should we do?" - How should we position given this dynamic?

Return 0-4 connections as JSON array:
[
  {
    "connection_type": "shared_relationship|market_convergence|timing_correlation|competitive_clash|supply_chain|topic_overlap",
    "title": "Predictive headline: What this connection leads to (max 100 chars)",
    "targets_involved": ["Target Name 1", "Target Name 2"],
    "shared_elements": ["Element 1", "Element 2"],
    "description": "Here's what's happening, and here's what it suggests is coming next (2-3 sentences)",
    "evidence": ["Evidence point 1", "Evidence point 2"],
    "strength": 0.7,
    "business_implication": "What we should prepare for and what we should do now"
  }
]

QUALITY STANDARDS:

🔮 PREDICTIVE, NOT DESCRIPTIVE:
- BAD: "Both competitors are present in the Asian market" (obvious fact)
- GOOD: "Competitor A and B are both making aggressive Asian moves - expect price war in Q2 that could spill into our markets"

💡 FIND THE NON-OBVIOUS:
- BAD: "These targets share a common supplier" (data point)
- GOOD: "Both rely on TSMC for critical chips - their rivalry may create supply allocation conflicts we could exploit"

⚡ ACTIONABLE INSIGHTS:
- BAD: "Interesting overlap in focus areas" (so what?)
- GOOD: "Both are pivoting to sustainability messaging before 2025 regulations - we need positioning before they own this narrative"

🎯 SCENARIO BUILDING:
- BAD: "Timing suggests coordination" (observation)
- GOOD: "Joint announcements suggest partnership talks - if confirmed, creates formidable competitor; recommend accelerating our own alliance discussions"

RULES:
- Only report connections with CLEAR evidence from the data above
- Target names must EXACTLY match the names in the target list
- Be specific about WHAT could happen and WHEN
- If no meaningful PREDICTIVE connections exist, return []
- Strength should reflect confidence in the PREDICTION (0.4-0.85 range)
- Avoid vague implications - be specific about scenarios and actions

Return ONLY the JSON array.`;

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
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('   No connections in Claude response');
      return [];
    }

    const connections: CrossTargetConnection[] = JSON.parse(jsonMatch[0]);

    // Create target name to ID map
    const targetIdMap = new Map(targets.map(t => [t.name, t.id]));

    // Validate and enrich connections
    return connections.filter(c => {
      if (!c.connection_type || !c.title || !c.targets_involved) return false;
      if (c.targets_involved.length < 2) return false;
      // Verify all targets exist
      return c.targets_involved.every(name => targetIdMap.has(name));
    }).map(c => ({
      ...c,
      target_ids: c.targets_involved.map(name => targetIdMap.get(name)!),
      strength: Math.max(0.1, Math.min(0.95, c.strength || 0.5)),
      shared_elements: c.shared_elements || [],
      evidence: c.evidence || []
    }));

  } catch (error: any) {
    console.error(`   Claude connection detection error: ${error.message}`);
    return [];
  }
}

function calculateConnectionSignificance(
  connection: CrossTargetConnection,
  targets: Target[]
): number {
  let score = 50;  // Base score

  // Adjust based on connection type
  const typeScores: Record<string, number> = {
    'competitive_clash': 20,
    'market_convergence': 15,
    'supply_chain': 15,
    'shared_relationship': 10,
    'timing_correlation': 10,
    'topic_overlap': 5
  };
  score += typeScores[connection.connection_type] || 0;

  // Adjust based on strength
  score += Math.round(connection.strength * 20);

  // Adjust based on priority of involved targets
  const involvedTargets = targets.filter(t =>
    connection.targets_involved.includes(t.name)
  );
  const hasHighPriority = involvedTargets.some(t =>
    ['critical', 'high'].includes(t.priority)
  );
  if (hasHighPriority) score += 15;

  // Adjust based on number of shared elements
  score += Math.min(10, connection.shared_elements.length * 2);

  return Math.min(100, Math.max(0, score));
}
