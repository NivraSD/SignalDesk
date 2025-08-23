// Intelligence Memory System
// Tracks patterns, detects surprises, maintains narrative continuity

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function updateEntityMemory(
  supabase: any,
  orgId: string,
  entityActions: any[]
) {
  const surprises = []
  
  for (const action of entityActions) {
    // Check if we've seen this entity before
    const { data: existingEntity } = await supabase
      .from('tracked_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_name', action.entity)
      .single()
    
    if (existingEntity) {
      // Update last seen
      await supabase
        .from('tracked_entities')
        .update({ 
          last_seen: new Date().toISOString(),
          last_significant_action: action.headline,
          last_significant_date: action.timestamp
        })
        .eq('id', existingEntity.id)
      
      // Check for surprising behavior
      const isUnusual = await checkForSurprise(existingEntity, action)
      if (isUnusual) {
        surprises.push({
          entity: action.entity,
          expected: existingEntity.typical_behavior,
          actual: action.action,
          why_surprising: isUnusual.reason
        })
        
        // Add to unusual behaviors
        const unusualBehaviors = existingEntity.unusual_behaviors || []
        unusualBehaviors.push({
          date: new Date().toISOString(),
          action: action.action,
          context: action.headline
        })
        
        await supabase
          .from('tracked_entities')
          .update({ unusual_behaviors: unusualBehaviors })
          .eq('id', existingEntity.id)
      }
    } else {
      // First time seeing this entity - create profile
      await supabase
        .from('tracked_entities')
        .insert({
          organization_id: orgId,
          entity_name: action.entity,
          entity_type: action.entity_type,
          last_significant_action: action.headline,
          last_significant_date: action.timestamp,
          typical_behavior: action.action // Initial baseline
        })
    }
  }
  
  return surprises
}

async function checkForSurprise(entity: any, action: any) {
  // Analyze if this action is surprising given entity's history
  
  // Check timing surprise (acting at unusual time)
  const lastActionDate = entity.last_significant_date ? 
    new Date(entity.last_significant_date) : null
  const currentDate = new Date(action.timestamp)
  
  if (lastActionDate) {
    const daysSinceLastAction = 
      (currentDate.getTime() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // If they were quiet for long then suddenly active
    if (daysSinceLastAction > 30) {
      return {
        is_surprising: true,
        reason: `${entity.entity_name} broke silence after ${Math.round(daysSinceLastAction)} days`
      }
    }
    
    // If they're suddenly very active
    if (daysSinceLastAction < 1) {
      return {
        is_surprising: true,
        reason: `${entity.entity_name} taking multiple actions in rapid succession`
      }
    }
  }
  
  // Check action type surprise
  const typicalActions = ['announced', 'released', 'reported', 'stated']
  const aggressiveActions = ['sued', 'attacked', 'criticized', 'opposed']
  const collaborativeActions = ['partnered', 'joined', 'supported', 'endorsed']
  
  if (entity.typical_behavior) {
    const wasTypicallyAggressive = aggressiveActions.some(a => 
      entity.typical_behavior.toLowerCase().includes(a))
    const isNowCollaborative = collaborativeActions.some(a => 
      action.action.toLowerCase().includes(a))
    
    if (wasTypicallyAggressive && isNowCollaborative) {
      return {
        is_surprising: true,
        reason: `${entity.entity_name} shifting from confrontational to collaborative stance`
      }
    }
    
    const wasTypicallyCollaborative = collaborativeActions.some(a => 
      entity.typical_behavior.toLowerCase().includes(a))
    const isNowAggressive = aggressiveActions.some(a => 
      action.action.toLowerCase().includes(a))
    
    if (wasTypicallyCollaborative && isNowAggressive) {
      return {
        is_surprising: true,
        reason: `${entity.entity_name} taking unexpectedly aggressive action`
      }
    }
  }
  
  return null
}

async function trackNarrativeEvolution(
  supabase: any,
  orgId: string,
  topics: any[]
) {
  const narrativeUpdates = []
  
  for (const topic of topics) {
    // Check if this narrative exists
    const { data: existingNarrative } = await supabase
      .from('tracked_narratives')
      .select('*')
      .eq('organization_id', orgId)
      .eq('narrative_title', topic.topic)
      .single()
    
    if (existingNarrative) {
      // Update narrative timeline
      const timeline = existingNarrative.timeline || []
      timeline.push({
        date: new Date().toISOString(),
        momentum: topic.momentum,
        headlines: topic.sample_headlines,
        article_count: topic.article_count
      })
      
      // Detect phase changes
      const previousPhase = existingNarrative.current_phase
      const newPhase = determineNarrativePhase(topic.momentum, timeline)
      
      if (previousPhase !== newPhase) {
        narrativeUpdates.push({
          narrative: topic.topic,
          shift: `${previousPhase} → ${newPhase}`,
          significance: 'Phase transition detected'
        })
      }
      
      await supabase
        .from('tracked_narratives')
        .update({
          timeline,
          current_phase: newPhase,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingNarrative.id)
    } else {
      // New narrative emerged
      await supabase
        .from('tracked_narratives')
        .insert({
          organization_id: orgId,
          narrative_title: topic.topic,
          narrative_type: topic.category,
          origin_date: new Date().toISOString(),
          origin_event: topic.sample_headlines?.[0] || 'Multiple sources',
          current_phase: 'emerging',
          timeline: [{
            date: new Date().toISOString(),
            momentum: topic.momentum,
            headlines: topic.sample_headlines,
            article_count: topic.article_count
          }]
        })
      
      narrativeUpdates.push({
        narrative: topic.topic,
        shift: 'New narrative detected',
        significance: 'First appearance in tracking'
      })
    }
  }
  
  return narrativeUpdates
}

function determineNarrativePhase(currentMomentum: string, timeline: any[]) {
  // Analyze timeline to determine narrative phase
  if (timeline.length < 2) return 'emerging'
  
  const recentEntries = timeline.slice(-3)
  const allAccelerating = recentEntries.every(e => e.momentum === 'accelerating')
  const allDeclining = recentEntries.every(e => e.momentum === 'steady' || !e.momentum)
  
  if (allAccelerating) return 'peak'
  if (allDeclining) return 'declining'
  if (currentMomentum === 'accelerating') return 'accelerating'
  
  return 'active'
}

async function generateDailySnapshot(
  supabase: any,
  orgId: string,
  intelligence: any,
  surprises: any[],
  narrativeUpdates: any[]
) {
  // Calculate tension and opportunity levels
  const tensionLevel = calculateTensionLevel(intelligence)
  const opportunityLevel = calculateOpportunityLevel(intelligence)
  
  // Create daily snapshot
  await supabase
    .from('intelligence_snapshots')
    .upsert({
      organization_id: orgId,
      snapshot_date: new Date().toISOString().split('T')[0],
      key_events: intelligence.entity_actions?.all || [],
      active_entities: extractActiveEntities(intelligence),
      dominant_topics: intelligence.topic_trends?.all || [],
      behavioral_changes: surprises,
      narrative_shifts: narrativeUpdates,
      surprise_count: surprises.length,
      biggest_surprise: surprises[0]?.why_surprising || null,
      tension_level,
      opportunity_level,
      overall_sentiment: determineSentiment(intelligence)
    })
}

function calculateTensionLevel(intelligence: any): number {
  let tension = 5 // baseline
  
  const actions = intelligence.entity_actions?.all || []
  const criticalActions = actions.filter((a: any) => a.importance === 'critical')
  const aggressiveActions = actions.filter((a: any) => 
    ['sued', 'criticized', 'opposed', 'attacked'].some(word => 
      a.action?.toLowerCase().includes(word)))
  
  tension += criticalActions.length * 2
  tension += aggressiveActions.length
  
  return Math.min(10, tension)
}

function calculateOpportunityLevel(intelligence: any): number {
  let opportunity = 3 // conservative baseline
  
  const actions = intelligence.entity_actions?.all || []
  const collaborativeActions = actions.filter((a: any) => 
    ['partnered', 'joined', 'announced', 'launched'].some(word => 
      a.action?.toLowerCase().includes(word)))
  
  const trends = intelligence.topic_trends?.all || []
  const hotTopics = trends.filter((t: any) => t.momentum === 'accelerating')
  
  opportunity += collaborativeActions.length
  opportunity += hotTopics.length * 2
  
  return Math.min(10, opportunity)
}

function determineSentiment(intelligence: any): string {
  const tensionLevel = calculateTensionLevel(intelligence)
  const opportunityLevel = calculateOpportunityLevel(intelligence)
  
  if (tensionLevel > 7) return 'negative'
  if (opportunityLevel > 7) return 'positive'
  if (Math.abs(tensionLevel - opportunityLevel) < 2) return 'mixed'
  
  return 'neutral'
}

function extractActiveEntities(intelligence: any): any[] {
  const entities = new Set()
  const entityDetails: any = {}
  
  const actions = intelligence.entity_actions?.all || []
  for (const action of actions) {
    entities.add(action.entity)
    if (!entityDetails[action.entity]) {
      entityDetails[action.entity] = {
        name: action.entity,
        type: action.entity_type,
        actions: []
      }
    }
    entityDetails[action.entity].actions.push(action.action)
  }
  
  return Array.from(entities).map(e => entityDetails[e as string])
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization, intelligence } = await req.json()
    
    if (!organization?.id || !intelligence) {
      throw new Error('Organization ID and intelligence data required')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Process entity actions for patterns and surprises
    const surprises = await updateEntityMemory(
      supabase,
      organization.id,
      intelligence.entity_actions?.all || []
    )
    
    // Track narrative evolution
    const narrativeUpdates = await trackNarrativeEvolution(
      supabase,
      organization.id,
      intelligence.topic_trends?.all || []
    )
    
    // Generate daily snapshot
    await generateDailySnapshot(
      supabase,
      organization.id,
      intelligence,
      surprises,
      narrativeUpdates
    )
    
    // Get historical context for comparison
    const { data: recentSnapshots } = await supabase
      .from('intelligence_snapshots')
      .select('*')
      .eq('organization_id', organization.id)
      .order('snapshot_date', { ascending: false })
      .limit(7)
    
    const { data: recentSurprises } = await supabase
      .from('intelligence_surprises')
      .select('*')
      .eq('organization_id', organization.id)
      .order('detected_at', { ascending: false })
      .limit(10)
    
    const { data: activeNarratives } = await supabase
      .from('tracked_narratives')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
    
    return new Response(
      JSON.stringify({
        success: true,
        memory_insights: {
          surprises,
          narrative_updates: narrativeUpdates,
          tension_level: calculateTensionLevel(intelligence),
          opportunity_level: calculateOpportunityLevel(intelligence),
          historical_context: {
            recent_snapshots: recentSnapshots,
            recent_surprises: recentSurprises,
            active_narratives: activeNarratives
          },
          patterns: {
            entities_breaking_pattern: surprises.map(s => s.entity),
            narratives_shifting: narrativeUpdates.map(n => n.narrative),
            overall_trajectory: determineSentiment(intelligence)
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Memory system error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})