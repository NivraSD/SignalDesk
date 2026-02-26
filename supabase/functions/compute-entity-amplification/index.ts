// Compute Entity Amplification
// Finds entities that appear across multiple organizations' signals
// The "whole graph" insight - what everyone is watching

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Configuration
const LOOKBACK_DAYS = 30;  // Analyze last 30 days of signals
const MIN_MENTIONS_FOR_TRACKING = 2;  // Min mentions to track an entity

interface EntityStats {
  entity_name: string;
  entity_normalized: string;
  mentions: {
    organization_id: string;
    organization_name: string;
    industry: string | null;
    signal_id: string;
    signal_type: string;
    created_at: string;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔗 COMPUTE ENTITY AMPLIFICATION');
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    const body = await req.json().catch(() => ({}));
    const lookbackDays = body.lookback_days || LOOKBACK_DAYS;

    const cutoffTime = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    // Get all signals with their organizations in the time window
    const { data: signals, error: signalError } = await supabase
      .from('signals')
      .select(`
        id,
        organization_id,
        signal_type,
        title,
        description,
        primary_target_name,
        primary_target_type,
        created_at,
        evidence,
        organizations!inner(id, name, industry)
      `)
      .gte('created_at', cutoffTime)
      .eq('status', 'active');

    if (signalError) {
      throw new Error(`Failed to load signals: ${signalError.message}`);
    }

    if (!signals || signals.length === 0) {
      console.log('   No signals in the time window');
      return new Response(JSON.stringify({
        success: true,
        entities_tracked: 0,
        high_amplification: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`   Analyzing ${signals.length} signals from last ${lookbackDays} days`);

    // Extract entities from signals
    const entityMentions = new Map<string, EntityStats>();

    for (const signal of signals) {
      const org = (signal as any).organizations;
      if (!org) continue;

      // Extract entities from various signal fields
      const entities = extractEntities(signal);

      for (const entity of entities) {
        const normalized = normalizeEntity(entity);
        if (!normalized || normalized.length < 2) continue;

        if (!entityMentions.has(normalized)) {
          entityMentions.set(normalized, {
            entity_name: entity,
            entity_normalized: normalized,
            mentions: []
          });
        }

        entityMentions.get(normalized)!.mentions.push({
          organization_id: signal.organization_id,
          organization_name: org.name,
          industry: org.industry,
          signal_id: signal.id,
          signal_type: signal.signal_type,
          created_at: signal.created_at
        });
      }
    }

    console.log(`   Extracted ${entityMentions.size} unique entities`);

    // Filter to entities with multiple mentions
    const significantEntities = Array.from(entityMentions.values())
      .filter(e => e.mentions.length >= MIN_MENTIONS_FOR_TRACKING);

    console.log(`   ${significantEntities.length} entities have ${MIN_MENTIONS_FOR_TRACKING}+ mentions`);

    // Calculate amplification metrics and upsert
    let tracked = 0;
    let highAmplification = 0;

    for (const entity of significantEntities) {
      const uniqueOrgs = new Set(entity.mentions.map(m => m.organization_id));
      const uniqueIndustries = new Set(entity.mentions.map(m => m.industry).filter(Boolean));
      const signalTypes = new Set(entity.mentions.map(m => m.signal_type));

      // Sort by date
      const sortedMentions = [...entity.mentions].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const firstSignal = sortedMentions[0];
      const lastSignal = sortedMentions[sortedMentions.length - 1];

      // Calculate time-based metrics
      const now = Date.now();
      const last24h = entity.mentions.filter(m =>
        new Date(m.created_at).getTime() > now - 24 * 60 * 60 * 1000
      ).length;
      const last7d = entity.mentions.filter(m =>
        new Date(m.created_at).getTime() > now - 7 * 24 * 60 * 60 * 1000
      ).length;

      // Calculate amplification score
      // Higher score when:
      // - More organizations see it
      // - More industries are involved
      // - Recent velocity is high
      const orgWeight = uniqueOrgs.size * 25;  // Up to 100 for 4 orgs
      const industryWeight = uniqueIndustries.size * 15;  // Up to 60 for 4 industries
      const velocityWeight = Math.min(30, last7d * 5);  // Up to 30 for 6+ signals in 7d
      const recencyWeight = last24h > 0 ? 10 : 0;  // Bonus for recent activity

      const amplificationScore = Math.min(100, orgWeight + industryWeight + velocityWeight + recencyWeight);

      // Generate insight if high amplification
      let insightSummary = null;
      if (uniqueOrgs.size >= 2) {
        const orgNames = [...new Set(entity.mentions.map(m => m.organization_name))].slice(0, 3);
        const industriesList = [...uniqueIndustries].slice(0, 3);

        insightSummary = uniqueOrgs.size >= 3
          ? `${uniqueOrgs.size} organizations across ${industriesList.length > 0 ? industriesList.join(', ') : 'multiple industries'} are tracking "${entity.entity_name}"`
          : `${orgNames.join(' and ')} are both tracking "${entity.entity_name}"`;
      }

      // Upsert into entity_signal_amplification
      const { error: upsertError } = await supabase
        .from('entity_signal_amplification')
        .upsert({
          entity_name: entity.entity_name,
          entity_normalized: entity.entity_normalized,
          entity_type: inferEntityType(entity.entity_name, entity.mentions),
          signal_count: entity.mentions.length,
          organization_count: uniqueOrgs.size,
          organization_ids: [...uniqueOrgs],
          target_count: entity.mentions.length,  // Each mention is from a target context
          first_signal_at: firstSignal.created_at,
          latest_signal_at: lastSignal.created_at,
          signals_last_24h: last24h,
          signals_last_7d: last7d,
          avg_signal_strength: 0.5,  // TODO: Calculate from actual signal confidence
          amplification_score: amplificationScore,
          velocity_score: last7d / 7,  // Signals per day in last week
          industries: [...uniqueIndustries],
          signal_types: [...signalTypes],
          sample_signal_ids: entity.mentions.slice(0, 5).map(m => m.signal_id),
          insight_summary: insightSummary,
          computed_at: new Date().toISOString()
        }, {
          onConflict: 'entity_normalized'
        });

      if (upsertError) {
        console.error(`   Error tracking ${entity.entity_name}: ${upsertError.message}`);
        continue;
      }

      tracked++;
      if (amplificationScore >= 50) {
        highAmplification++;
        console.log(`   🔥 ${entity.entity_name}: ${uniqueOrgs.size} orgs, score ${amplificationScore}`);
      }
    }

    // Clean up old entries (entities not seen in lookback period)
    await supabase
      .from('entity_signal_amplification')
      .delete()
      .lt('latest_signal_at', cutoffTime);

    const duration = Math.round((Date.now() - startTime) / 1000);

    const summary = {
      success: true,
      signals_analyzed: signals.length,
      entities_extracted: entityMentions.size,
      entities_tracked: tracked,
      high_amplification: highAmplification,
      duration_seconds: duration
    };

    console.log(`\n📊 Amplification Analysis Complete:`);
    console.log(`   Signals analyzed: ${signals.length}`);
    console.log(`   Entities tracked: ${tracked}`);
    console.log(`   High amplification: ${highAmplification}`);
    console.log(`   Duration: ${duration}s`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Amplification error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractEntities(signal: any): string[] {
  const entities: Set<string> = new Set();

  // 1. Primary target is always an entity
  if (signal.primary_target_name) {
    entities.add(signal.primary_target_name);
  }

  // 2. Extract from evidence.entities_mentioned if present
  if (signal.evidence?.entities_mentioned) {
    for (const entity of signal.evidence.entities_mentioned) {
      if (typeof entity === 'string') {
        entities.add(entity);
      }
    }
  }

  // 3. Extract from evidence.relationships if present
  if (signal.evidence?.relationships) {
    for (const rel of signal.evidence.relationships || []) {
      if (rel.entity) entities.add(rel.entity);
      if (rel.related_entity) entities.add(rel.related_entity);
    }
  }

  // 4. Extract from evidence.data_points - look for company names
  if (signal.evidence?.data_points) {
    for (const point of signal.evidence.data_points || []) {
      if (typeof point === 'string') {
        // Simple pattern for capitalized words (company names)
        const matches = point.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
        for (const match of matches) {
          if (match.length > 2 && !isCommonWord(match)) {
            entities.add(match);
          }
        }
      }
    }
  }

  // 5. Look for company names in title/description
  const titleMatches = (signal.title || '').match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  for (const match of titleMatches) {
    if (match.length > 3 && !isCommonWord(match) && isLikelyCompany(match)) {
      entities.add(match);
    }
  }

  return [...entities];
}

function normalizeEntity(entity: string): string {
  return entity
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

function isCommonWord(word: string): boolean {
  const common = new Set([
    'The', 'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Why', 'How',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
    'New', 'Old', 'First', 'Last', 'Next', 'Previous',
    'Inc', 'Corp', 'Ltd', 'LLC', 'Company', 'Group'
  ]);
  return common.has(word);
}

function isLikelyCompany(name: string): boolean {
  // Check for company-like patterns
  const companyPatterns = [
    /\b(Inc|Corp|Ltd|LLC|Co|Group|Holdings|Partners|Capital|Ventures)\b/i,
    /\b(Technologies|Tech|Labs|Media|Solutions|Services|Systems)\b/i,
    /\b(AI|Analytics|Digital|Data|Cloud|Software)\b/i
  ];

  return companyPatterns.some(p => p.test(name)) || name.split(' ').length <= 3;
}

function inferEntityType(name: string, mentions: any[]): string {
  const nameLower = name.toLowerCase();

  // Check for regulators
  if (/\b(ftc|fcc|sec|doj|fda|eu commission|regulator)\b/i.test(name)) {
    return 'regulator';
  }

  // Check for people (usually "First Last" format)
  if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name)) {
    return 'person';
  }

  // Check signal context
  const signalTypes = mentions.map(m => m.signal_type);
  if (signalTypes.includes('regulatory')) {
    return 'regulator';
  }

  // Default to company
  return 'company';
}
