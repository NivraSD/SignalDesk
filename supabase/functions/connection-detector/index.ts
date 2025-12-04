// Connection Detector
// Finds relationships and patterns between entities based on industry context
// Industry-aware detection: what connections matter depends on the organization's industry

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Analysis window for connection detection
const DETECTION_WINDOW_DAYS = 30;
const MIN_CONNECTION_STRENGTH = 50;
const MIN_MENTIONS_FOR_CONNECTION = 2;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();

    console.log(`🔗 Connection Detector`);
    console.log(`   Organization ID: ${organization_id}`);

    // Step 1: Load organization's industry from company_profile
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, industry, company_profile')
      .eq('id', organization_id)
      .single();

    if (!orgData) {
      return new Response(JSON.stringify({
        error: 'Organization not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const industry = orgData.industry;
    const orgName = orgData.name;

    console.log(`   Organization: ${orgName}`);
    console.log(`   Industry: ${industry}`);

    // Step 2: Load industry intelligence profile (with fallback to DEFAULT)
    let { data: industryProfile } = await supabase
      .from('industry_intelligence_profiles')
      .select('*')
      .eq('industry', industry)
      .single();

    if (!industryProfile) {
      console.log(`⚠️ No specific profile for: ${industry}, using DEFAULT profile`);

      // Fallback to DEFAULT profile
      const { data: defaultProfile } = await supabase
        .from('industry_intelligence_profiles')
        .select('*')
        .eq('industry', 'DEFAULT')
        .single();

      if (!defaultProfile) {
        console.log(`❌ No DEFAULT profile found either`);
        return new Response(JSON.stringify({
          success: true,
          connections_detected: 0,
          signals_generated: 0,
          message: `No industry profile configured for ${industry} and no DEFAULT fallback`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      industryProfile = defaultProfile;
      console.log(`   Using DEFAULT profile with ${defaultProfile.connection_patterns?.length || 0} patterns`);
    } else {
      console.log(`   Loaded ${industry} profile with ${industryProfile.connection_patterns?.length || 0} patterns`);
    }

    // Step 3: Load intelligence targets
    const { data: targets } = await supabase
      .from('intelligence_targets')
      .select('id, name, type')
      .eq('organization_id', organization_id)
      .eq('active', true);

    if (!targets || targets.length === 0) {
      console.log('⚠️ No intelligence targets found');
      return new Response(JSON.stringify({
        success: true,
        connections_detected: 0,
        signals_generated: 0,
        message: 'No intelligence targets configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Loaded ${targets.length} intelligence targets`);

    // Step 4: Load recent target intelligence (last 30 days)
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - DETECTION_WINDOW_DAYS);

    const { data: mentions } = await supabase
      .from('target_intelligence')
      .select('*')
      .eq('organization_id', organization_id)
      .gte('mention_date', windowStart.toISOString())
      .order('mention_date', { ascending: false });

    if (!mentions || mentions.length === 0) {
      console.log('⚠️ No target intelligence data in detection window');
      return new Response(JSON.stringify({
        success: true,
        connections_detected: 0,
        signals_generated: 0,
        message: 'No target intelligence data available'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Analyzing ${mentions.length} mentions from last ${DETECTION_WINDOW_DAYS} days`);

    // Step 5: Detect entity connections
    const connections = await detectEntityConnections(
      organization_id,
      targets,
      mentions,
      industryProfile.relevance_weights
    );

    console.log(`   Detected ${connections.length} connections`);

    // Step 6: Save connections to database
    let savedConnections = 0;
    for (const connection of connections) {
      if (connection.connection_strength >= MIN_CONNECTION_STRENGTH) {
        const { error } = await supabase
          .from('entity_connections')
          .upsert(connection, {
            onConflict: 'organization_id,entity_a_id,entity_b_id,connection_type'
          });

        if (!error) savedConnections++;
      }
    }

    console.log(`   Saved ${savedConnections} connections to database`);

    // Step 7: Detect connection-based signals using industry patterns
    const signals = await detectConnectionSignals(
      organization_id,
      orgName,
      mentions,
      connections,
      industryProfile.connection_patterns,
      industryProfile.org_type_modifiers
    );

    console.log(`   Generated ${signals.length} connection signals`);

    // Step 8: Save signals to database with deduplication
    let savedSignals = 0;
    for (const signal of signals) {
      // Check for existing similar signal to avoid duplicates
      const { data: existing } = await supabase
        .from('connection_signals')
        .select('id')
        .eq('organization_id', signal.organization_id)
        .eq('signal_type', signal.signal_type)
        .eq('primary_entity_name', signal.primary_entity_name)
        .single();

      if (existing) {
        console.log(`   ⏭️ Signal already exists for ${signal.primary_entity_name}, updating...`);
        // Update existing signal instead of creating duplicate
        const { error } = await supabase
          .from('connection_signals')
          .update({
            strength_score: signal.strength_score,
            confidence_score: signal.confidence_score,
            related_entities: signal.related_entities,
            pattern_data: signal.pattern_data,
            signal_start_date: signal.signal_start_date
          })
          .eq('id', existing.id);

        if (!error) savedSignals++;
      } else {
        const { error } = await supabase
          .from('connection_signals')
          .insert(signal);

        if (!error) savedSignals++;
      }
    }

    console.log(`✅ Connection detection complete: ${savedConnections} connections, ${savedSignals} signals`);

    return new Response(JSON.stringify({
      success: true,
      connections_detected: savedConnections,
      signals_generated: savedSignals,
      mentions_analyzed: mentions.length,
      targets_monitored: targets.length,
      industry: industry
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

// ============================================================================
// CONNECTION DETECTION FUNCTIONS
// ============================================================================

async function detectEntityConnections(
  organizationId: string,
  targets: any[],
  mentions: any[],
  relevanceWeights: any
): Promise<any[]> {
  const connections: any[] = [];

  // Build mention index by target
  const mentionsByTarget = new Map<string, any[]>();
  for (const mention of mentions) {
    if (!mentionsByTarget.has(mention.target_id)) {
      mentionsByTarget.set(mention.target_id, []);
    }
    mentionsByTarget.get(mention.target_id)!.push(mention);
  }

  // Compare each pair of targets
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const entityA = targets[i];
      const entityB = targets[j];

      const mentionsA = mentionsByTarget.get(entityA.id) || [];
      const mentionsB = mentionsByTarget.get(entityB.id) || [];

      if (mentionsA.length < MIN_MENTIONS_FOR_CONNECTION ||
          mentionsB.length < MIN_MENTIONS_FOR_CONNECTION) {
        continue;
      }

      // Connection Type 1: Co-occurrence (same articles)
      const coOccurrence = detectCoOccurrence(mentionsA, mentionsB, relevanceWeights);
      if (coOccurrence) {
        connections.push({
          organization_id: organizationId,
          entity_a_id: entityA.id,
          entity_a_name: entityA.name,
          entity_a_type: entityA.type,
          entity_b_id: entityB.id,
          entity_b_name: entityB.name,
          entity_b_type: entityB.type,
          connection_type: 'co_occurrence',
          ...coOccurrence
        });
      }

      // Connection Type 2: Temporal correlation
      const temporalCorrelation = detectTemporalCorrelation(mentionsA, mentionsB, relevanceWeights);
      if (temporalCorrelation) {
        connections.push({
          organization_id: organizationId,
          entity_a_id: entityA.id,
          entity_a_name: entityA.name,
          entity_a_type: entityA.type,
          entity_b_id: entityB.id,
          entity_b_name: entityB.name,
          entity_b_type: entityB.type,
          connection_type: 'temporal_correlation',
          ...temporalCorrelation
        });
      }

      // Connection Type 3: Thematic overlap
      const thematicOverlap = detectThematicOverlap(mentionsA, mentionsB, relevanceWeights);
      if (thematicOverlap) {
        connections.push({
          organization_id: organizationId,
          entity_a_id: entityA.id,
          entity_a_name: entityA.name,
          entity_a_type: entityA.type,
          entity_b_id: entityB.id,
          entity_b_name: entityB.name,
          entity_b_type: entityB.type,
          connection_type: 'thematic_overlap',
          ...thematicOverlap
        });
      }
    }
  }

  return connections;
}

function detectCoOccurrence(mentionsA: any[], mentionsB: any[], weights: any): any | null {
  // Find articles that mention both entities
  const urlsA = new Set(mentionsA.map(m => m.article_url));
  const urlsB = new Set(mentionsB.map(m => m.article_url));

  const sharedUrls = [...urlsA].filter(url => urlsB.has(url));

  if (sharedUrls.length === 0) return null;

  const strength = Math.min(100, (sharedUrls.length / Math.min(urlsA.size, urlsB.size)) * (weights?.co_occurrence || 50));

  return {
    connection_strength: Math.round(strength),
    shared_articles: sharedUrls.length,
    detection_window_start: new Date(Math.min(...mentionsA.map(m => new Date(m.mention_date).getTime()))).toISOString(),
    detection_window_end: new Date(Math.max(...mentionsA.map(m => new Date(m.mention_date).getTime()))).toISOString()
  };
}

function detectTemporalCorrelation(mentionsA: any[], mentionsB: any[], weights: any): any | null {
  // Check if entities are active in similar time windows
  const datesA = mentionsA.map(m => new Date(m.mention_date).getTime());
  const datesB = mentionsB.map(m => new Date(m.mention_date).getTime());

  const avgDateA = datesA.reduce((a, b) => a + b, 0) / datesA.length;
  const avgDateB = datesB.reduce((a, b) => a + b, 0) / datesB.length;

  const daysBetween = Math.abs(avgDateA - avgDateB) / (1000 * 60 * 60 * 24);

  if (daysBetween > 14) return null; // Not temporally correlated

  const strength = Math.min(100, (14 - daysBetween) / 14 * (weights?.temporal_correlation || 80));

  return {
    connection_strength: Math.round(strength),
    temporal_proximity_days: Math.round(daysBetween),
    detection_window_start: new Date(Math.min(...datesA, ...datesB)).toISOString(),
    detection_window_end: new Date(Math.max(...datesA, ...datesB)).toISOString()
  };
}

function detectThematicOverlap(mentionsA: any[], mentionsB: any[], weights: any): any | null {
  // Find shared topics and categories
  const topicsA = new Set(mentionsA.flatMap(m => m.key_topics || []));
  const topicsB = new Set(mentionsB.flatMap(m => m.key_topics || []));

  const categoriesA = new Set(mentionsA.map(m => m.category));
  const categoriesB = new Set(mentionsB.map(m => m.category));

  const sharedTopics = [...topicsA].filter(t => topicsB.has(t));
  const sharedCategories = [...categoriesA].filter(c => categoriesB.has(c));

  if (sharedTopics.length === 0 && sharedCategories.length === 0) return null;

  const topicOverlap = sharedTopics.length / Math.max(topicsA.size, topicsB.size);
  const categoryOverlap = sharedCategories.length / Math.max(categoriesA.size, categoriesB.size);

  const strength = Math.min(100, ((topicOverlap + categoryOverlap) / 2) * (weights?.thematic_overlap || 60));

  return {
    connection_strength: Math.round(strength),
    shared_topics: sharedTopics,
    shared_categories: sharedCategories,
    detection_window_start: new Date(Math.min(...mentionsA.map(m => new Date(m.mention_date).getTime()))).toISOString(),
    detection_window_end: new Date(Math.max(...mentionsA.map(m => new Date(m.mention_date).getTime()))).toISOString()
  };
}

// ============================================================================
// SIGNAL DETECTION FUNCTIONS
// ============================================================================

async function detectConnectionSignals(
  organizationId: string,
  organizationName: string,
  mentions: any[],
  connections: any[],
  connectionPatterns: any[],
  orgTypeModifiers: any
): Promise<any[]> {
  const signals: any[] = [];

  console.log(`   Analyzing ${connectionPatterns.length} industry-specific patterns`);

  for (const pattern of connectionPatterns) {
    const detectedSignals = await analyzePattern(
      organizationId,
      organizationName,
      mentions,
      connections,
      pattern,
      orgTypeModifiers
    );

    signals.push(...detectedSignals);
  }

  return signals;
}

async function analyzePattern(
  organizationId: string,
  organizationName: string,
  mentions: any[],
  connections: any[],
  pattern: any,
  orgTypeModifiers: any
): Promise<any[]> {
  const signals: any[] = [];
  const triggerKeywords = pattern.triggers || [];

  // Find mentions matching pattern triggers
  const relevantMentions = mentions.filter(mention => {
    const text = `${mention.article_title} ${mention.article_content}`.toLowerCase();
    return triggerKeywords.some((keyword: string) =>
      text.includes(keyword.toLowerCase().replace(/_/g, ' '))
    );
  });

  if (relevantMentions.length === 0) return signals;

  console.log(`     Pattern "${pattern.type}": ${relevantMentions.length} relevant mentions`);

  // Group by entities
  const entitiesByMention = new Map<string, any[]>();
  for (const mention of relevantMentions) {
    if (!entitiesByMention.has(mention.target_name)) {
      entitiesByMention.set(mention.target_name, []);
    }
    entitiesByMention.get(mention.target_name)!.push(mention);
  }

  // If multiple entities show same pattern, it's a signal
  if (entitiesByMention.size >= 2) {
    const entityNames = Array.from(entitiesByMention.keys());
    const primaryEntity = entityNames[0];
    const relatedEntities = entityNames.slice(1).map(name => ({ name }));

    // Calculate strength based on number of entities and mentions
    const baseStrength = Math.min(100, (entitiesByMention.size / 5) * 100);
    const confidence = Math.min(100, (relevantMentions.length / 10) * 100);

    // Apply organization type modifiers if available
    let adjustedStrength = baseStrength;
    if (orgTypeModifiers) {
      const orgType = Object.keys(orgTypeModifiers)[0]; // Get first org type
      const multiplier = orgTypeModifiers[orgType]?.signal_priority_multipliers?.[pattern.type] || 1.0;
      adjustedStrength = Math.min(100, baseStrength * multiplier);
    }

    signals.push({
      organization_id: organizationId,
      signal_type: pattern.type,
      signal_title: `${pattern.type.replace(/_/g, ' ').toUpperCase()}: ${entityNames.join(', ')}`,
      signal_description: pattern.description,
      primary_entity_name: primaryEntity,
      related_entities: relatedEntities,
      strength_score: Math.round(adjustedStrength),
      confidence_score: Math.round(confidence),
      industry_relevance: pattern.type,
      client_impact_level: adjustedStrength >= 80 ? 'high' : adjustedStrength >= 60 ? 'medium' : 'low',
      pattern_data: {
        pattern_type: pattern.type,
        entities_involved: entityNames,
        mention_count: relevantMentions.length,
        detection_window_days: pattern.detection_window_days,
        triggers_matched: triggerKeywords
      },
      signal_start_date: new Date(Math.min(...relevantMentions.map(m => new Date(m.mention_date).getTime()))).toISOString(),
      signal_maturity: 'emerging'
    });
  }

  return signals;
}
