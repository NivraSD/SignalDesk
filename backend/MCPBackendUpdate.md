1. Database Schema Design for Supabase
   sql-- Core organization profile table
   CREATE TABLE organization_profiles (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name TEXT NOT NULL,
   industry TEXT,
   created_at TIMESTAMPTZ DEFAULT NOW(),
   updated_at TIMESTAMPTZ DEFAULT NOW(),
   -- JSONB columns for complex nested data
   entity_graph JSONB DEFAULT '{}',
   stakeholder_map JSONB DEFAULT '{}',
   competitor_landscape JSONB DEFAULT '{}',
   narrative_tracking JSONB DEFAULT '{}',
   risk_profile JSONB DEFAULT '{}',
   opportunity_pipeline JSONB DEFAULT '{}',
   cascade_triggers JSONB DEFAULT '{}',
   monitoring_config JSONB DEFAULT '{}',
   -- Metadata
   enrichment_version INTEGER DEFAULT 1,
   last_enriched_at TIMESTAMPTZ,
   data_sources JSONB DEFAULT '[]',
   -- Search optimization
   search_vector tsvector GENERATED ALWAYS AS (
   to_tsvector('english',
   name || ' ' ||
   COALESCE(industry, '') || ' ' ||
   COALESCE(entity_graph::text, '')
   )
   ) STORED
   );

-- Index for fast JSONB queries
CREATE INDEX idx_org_stakeholders ON organization_profiles USING GIN (stakeholder_map);
CREATE INDEX idx_org_competitors ON organization_profiles USING GIN (competitor_landscape);
CREATE INDEX idx_org_narratives ON organization_profiles USING GIN (narrative_tracking);
CREATE INDEX idx_org_search ON organization_profiles USING GIN (search_vector);

-- Intelligence updates table (stores incremental changes)
CREATE TABLE intelligence_updates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
update_type TEXT NOT NULL, -- 'stakeholder', 'competitor', 'narrative', etc.
update_data JSONB NOT NULL,
source TEXT, -- Which MCP generated this
confidence_score DECIMAL(3,2),
requires_action BOOLEAN DEFAULT false,
processed BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW(),

-- Versioning
previous_value JSONB,
change_summary TEXT
);

-- Create index for fast queries
CREATE INDEX idx_updates_org_type ON intelligence_updates(organization_id, update_type, created_at DESC);

-- Stakeholder interactions table (flattened for better querying)
CREATE TABLE stakeholders (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
name TEXT NOT NULL,
type TEXT NOT NULL, -- 'regulator', 'investor', 'activist', etc.
influence_score INTEGER CHECK (influence_score >= 0 AND influence_score <= 10),
sentiment DECIMAL(3,2), -- -1 to 1
engagement_strategy TEXT,
metadata JSONB DEFAULT '{}',
last_activity_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stakeholders_org ON stakeholders(organization_id);
CREATE INDEX idx_stakeholders_type ON stakeholders(type);
CREATE INDEX idx_stakeholders_influence ON stakeholders(influence_score DESC); 2. Supabase Edge Functions for MCP Integration
Create an Edge Function to handle MCP data storage:
typescript// supabase/functions/mcp-intelligence-sync/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
'Access-Control-Allow-Origin': '\*',
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
if (req.method === 'OPTIONS') {
return new Response('ok', { headers: corsHeaders })
}

try {
const supabase = createClient(
Deno.env.get('SUPABASE_URL') ?? '',
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

    const { action, organizationId, data, source } = await req.json()

    switch (action) {
      case 'initialize_organization':
        // Store the complete intelligence profile
        const { error: profileError } = await supabase
          .from('organization_profiles')
          .upsert({
            id: organizationId,
            name: data.name,
            industry: data.industry,
            entity_graph: data.entity_graph,
            stakeholder_map: data.stakeholders,
            competitor_landscape: data.competitors,
            narrative_tracking: data.narratives,
            risk_profile: data.risks,
            opportunity_pipeline: data.opportunities,
            cascade_triggers: data.cascade_triggers,
            monitoring_config: data.monitoring_config,
            last_enriched_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        // Also flatten and store stakeholders for easier querying
        if (data.stakeholders) {
          await storeStakeholders(supabase, organizationId, data.stakeholders)
        }

        break

      case 'update_intelligence':
        // Store incremental update
        await supabase
          .from('intelligence_updates')
          .insert({
            organization_id: organizationId,
            update_type: data.type,
            update_data: data.content,
            source: source || 'mcp',
            confidence_score: data.confidence,
            requires_action: data.requires_action
          })

        // Update the main profile with new data
        await mergeIntelligenceUpdate(supabase, organizationId, data)
        break

      case 'query_intelligence':
        // Retrieve and combine intelligence from multiple sources
        const profile = await getEnrichedProfile(supabase, organizationId)
        return new Response(JSON.stringify(profile), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

} catch (error) {
return new Response(JSON.stringify({ error: error.message }), {
status: 400,
headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})
}
})

// Helper functions
async function storeStakeholders(supabase: any, orgId: string, stakeholderMap: any) {
const stakeholders = []

for (const [category, items] of Object.entries(stakeholderMap)) {
if (Array.isArray(items)) {
for (const stakeholder of items) {
stakeholders.push({
organization_id: orgId,
name: stakeholder.name,
type: stakeholder.type || category,
influence_score: stakeholder.influence_score,
sentiment: stakeholder.sentiment,
engagement_strategy: stakeholder.engagement_strategy,
metadata: stakeholder
})
}
}
}

if (stakeholders.length > 0) {
await supabase.from('stakeholders').upsert(stakeholders)
}
}

async function mergeIntelligenceUpdate(supabase: any, orgId: string, update: any) {
// Get current profile
const { data: profile } = await supabase
.from('organization_profiles')
.select('\*')
.eq('id', orgId)
.single()

if (!profile) return

// Merge update based on type
const updatedFields: any = {}

switch (update.type) {
case 'stakeholder':
updatedFields.stakeholder_map = {
...profile.stakeholder_map,
...update.content
}
break
case 'narrative':
updatedFields.narrative_tracking = {
...profile.narrative_tracking,
...update.content
}
break
case 'competitor':
updatedFields.competitor_landscape = {
...profile.competitor_landscape,
...update.content
}
break
case 'cascade':
updatedFields.cascade_triggers = [
...(profile.cascade_triggers || []),
...update.content
]
break
}

updatedFields.updated_at = new Date().toISOString()

await supabase
.from('organization_profiles')
.update(updatedFields)
.eq('id', orgId)
}

async function getEnrichedProfile(supabase: any, orgId: string) {
// Get main profile
const { data: profile } = await supabase
.from('organization_profiles')
.select('\*')
.eq('id', orgId)
.single()

// Get recent updates
const { data: recentUpdates } = await supabase
.from('intelligence_updates')
.select('\*')
.eq('organization_id', orgId)
.order('created_at', { ascending: false })
.limit(10)

// Get stakeholders
const { data: stakeholders } = await supabase
.from('stakeholders')
.select('\*')
.eq('organization_id', orgId)
.order('influence_score', { ascending: false })

return {
...profile,
recent_updates: recentUpdates,
stakeholders_list: stakeholders
}
} 3. Real-time Subscriptions for Live Updates
javascript// Frontend subscription to intelligence updates
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseKey)

// Subscribe to intelligence updates for an organization
const subscribeToIntelligence = (organizationId) => {
const subscription = supabase
.channel(`org-${organizationId}`)
.on(
'postgres_changes',
{
event: 'INSERT',
schema: 'public',
table: 'intelligence_updates',
filter: `organization_id=eq.${organizationId}`
},
(payload) => {
console.log('New intelligence:', payload.new)
// Update UI with new intelligence
handleIntelligenceUpdate(payload.new)
}
)
.subscribe()

return subscription
} 4. Optimized Storage Patterns
JSONB Best Practices for Supabase:
javascript// Good: Store structured JSONB that can be queried
const stakeholderMap = {
critical: [
{
id: "sec-001",
name: "SEC",
type: "regulator",
influence_score: 10,
last_interaction: "2024-01-15",
sentiment: 0.0,
tags: ["compliance", "reporting", "investigation"]
}
],
high_influence: [...],
monitoring: [...]
}

// Enable JSONB queries like:
// SELECT \* FROM organization_profiles
// WHERE stakeholder_map->'critical' @> '[{"name": "SEC"}]'
Storage Size Optimization:
javascript// Implement data compression for large intelligence profiles
const compressIntelligence = (data) => {
// Store detailed data separately, keep summaries in main table
return {
summary: {
total_stakeholders: data.stakeholders.length,
critical_count: data.stakeholders.filter(s => s.critical).length,
last_updated: new Date().toISOString()
},
detailed_data_url: 'storage/intelligence/[org-id]/full-profile.json'
}
} 5. Row Level Security (RLS) Policies
sql-- Enable RLS
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization's profile"
ON organization_profiles FOR SELECT
USING (
id IN (
SELECT organization_id
FROM user_organizations
WHERE user_id = auth.uid()
)
);

CREATE POLICY "Users can update their organization's profile"
ON organization_profiles FOR UPDATE
USING (
id IN (
SELECT organization_id
FROM user_organizations
WHERE user_id = auth.uid()
AND role IN ('admin', 'manager')
)
); 6. Performance Considerations
Indexing Strategy:
sql-- Create indexes for common query patterns
CREATE INDEX idx_intel_updates_recent
ON intelligence_updates(organization_id, created_at DESC)
WHERE processed = false;

-- Partial index for high-priority items
CREATE INDEX idx_intel_high_priority
ON intelligence_updates(organization_id)
WHERE requires_action = true;

-- Full-text search on narratives
CREATE INDEX idx_narratives_search
ON organization_profiles
USING GIN (to_tsvector('english', narrative_tracking::text));
Data Archival Strategy:
javascript// Archive old intelligence updates to storage
const archiveOldIntelligence = async (organizationId) => {
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

// Move to storage bucket
const { data: oldUpdates } = await supabase
.from('intelligence_updates')
.select('\*')
.eq('organization_id', organizationId)
.lt('created_at', thirtyDaysAgo.toISOString())

if (oldUpdates && oldUpdates.length > 0) {
// Store in Supabase Storage
const { error } = await supabase.storage
.from('intelligence-archive')
.upload(
`${organizationId}/archive-${Date.now()}.json`,
JSON.stringify(oldUpdates)
)

    // Delete from main table
    if (!error) {
      await supabase
        .from('intelligence_updates')
        .delete()
        .eq('organization_id', organizationId)
        .lt('created_at', thirtyDaysAgo.toISOString())
    }

}
} 7. MCP to Supabase Data Flow
javascript// In your MCP server, send data to Supabase
class MCPSupabaseConnector {
async syncToSupabase(organizationId, intelligenceData) {
const response = await fetch(
`${SUPABASE_URL}/functions/v1/mcp-intelligence-sync`,
{
method: 'POST',
headers: {
'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({
action: 'update_intelligence',
organizationId: organizationId,
data: intelligenceData,
source: 'signaldesk-entity-graph'
})
}
)

    return response.json()

}
}
Key Recommendations:

Use JSONB liberally - Supabase PostgreSQL handles JSONB very well
Flatten critical data - Keep frequently queried data in dedicated columns
Implement versioning - Track changes over time for intelligence evolution
Use Supabase Storage - For large documents and archives
Enable real-time - For live intelligence updates to the UI
Set up proper indexes - For fast queries on JSONB fields
Use Row Level Security - To ensure data isolation between organizations

Enhanced Time-Series Architecture for Group Tracking

1. Time-Series Schema Enhancements
   sql-- Enhanced stakeholder tracking with temporal data
   CREATE TABLE stakeholder_snapshots (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
   stakeholder_id UUID REFERENCES stakeholders(id) ON DELETE CASCADE,
   snapshot_date DATE NOT NULL,
   -- Metrics that change over time
   influence_score INTEGER,
   sentiment DECIMAL(3,2),
   engagement_level TEXT, -- 'active', 'moderate', 'dormant', 'hostile'
   relationship_health INTEGER, -- 0-100 score
   -- Activity metrics
   media_mentions INTEGER DEFAULT 0,
   social_mentions INTEGER DEFAULT 0,
   regulatory_actions INTEGER DEFAULT 0,
   public_statements INTEGER DEFAULT 0,
   -- Context
   key_events JSONB DEFAULT '[]', -- What happened this period
   stance_changes JSONB DEFAULT '{}', -- Position changes on issues

created_at TIMESTAMPTZ DEFAULT NOW(),

-- Ensure one snapshot per stakeholder per day
UNIQUE(stakeholder_id, snapshot_date)
);

-- Group evolution tracking
CREATE TABLE group_evolution (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
group_type TEXT NOT NULL, -- 'activist_coalition', 'investor_group', 'regulatory_body'
group_name TEXT NOT NULL,

-- Temporal tracking
period_start DATE NOT NULL,
period_end DATE,

-- Group composition over time
members JSONB DEFAULT '[]', -- Array of member entities
member_count INTEGER,

-- Group metrics
collective_influence DECIMAL(4,2),
coordination_level TEXT, -- 'high', 'medium', 'low', 'none'
activity_level TEXT, -- 'dormant', 'monitoring', 'active', 'escalating'

-- Group dynamics
leadership JSONB DEFAULT '{}', -- Key leaders and their roles
stated_objectives JSONB DEFAULT '[]',
tactics_employed JSONB DEFAULT '[]',
success_rate DECIMAL(3,2), -- 0-1 score of achieving objectives

-- Relationships
alliances JSONB DEFAULT '[]', -- Other groups they work with
oppositions JSONB DEFAULT '[]', -- Groups they oppose

created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Narrative evolution tracking
CREATE TABLE narrative_timeseries (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
narrative_id UUID NOT NULL,
narrative_theme TEXT NOT NULL,

-- Time period
measurement_date DATE NOT NULL,

-- Metrics
sentiment_score DECIMAL(3,2), -- -1 to 1
volume INTEGER, -- Number of mentions
reach INTEGER, -- Estimated audience
engagement_rate DECIMAL(4,2), -- Interaction rate

-- Sources driving the narrative
primary_sources JSONB DEFAULT '[]', -- Top sources pushing this narrative
key_influencers JSONB DEFAULT '[]', -- People/orgs amplifying

-- Geographic and demographic spread
geographic_spread JSONB DEFAULT '{}', -- {region: intensity}
demographic_reach JSONB DEFAULT '{}', -- {demographic: percentage}

-- Cascade tracking
cascade_stage TEXT, -- 'emerging', 'spreading', 'mainstream', 'declining'
virality_score DECIMAL(3,2), -- 0-1

created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(narrative_id, measurement_date)
);

-- Relationship strength over time
CREATE TABLE relationship_history (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
stakeholder_id UUID REFERENCES stakeholders(id) ON DELETE CASCADE,

-- Interaction details
interaction_date TIMESTAMPTZ NOT NULL,
interaction_type TEXT, -- 'meeting', 'email', 'public_statement', 'media_mention'
interaction_quality TEXT, -- 'positive', 'neutral', 'negative', 'hostile'

-- Impact metrics
relationship_delta DECIMAL(3,2), -- Change in relationship score
influence_delta DECIMAL(3,2), -- Change in influence

-- Context
topic TEXT,
outcome TEXT,
notes TEXT,
documents JSONB DEFAULT '[]',

created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coalition and alliance tracking
CREATE TABLE coalition_tracking (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organization_profiles(id) ON DELETE CASCADE,
coalition_name TEXT NOT NULL,

-- Temporal data
formation_date DATE,
dissolution_date DATE,
peak_influence_date DATE,

-- Members over time (with join/leave dates)
member_timeline JSONB DEFAULT '[]',
/_ Format: [
{
"entity": "350.org",
"joined": "2024-01-15",
"left": null,
"role": "founding_member"
}
] _/

-- Coalition metrics over time
influence_history JSONB DEFAULT '[]', -- Array of {date, score}
success_history JSONB DEFAULT '[]', -- Campaign outcomes

-- Current status
current_status TEXT, -- 'forming', 'active', 'dormant', 'dissolved'
current_objective TEXT,
current_influence DECIMAL(3,2),

created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for time-series queries
CREATE INDEX idx_stakeholder_snapshots_time ON stakeholder_snapshots(stakeholder_id, snapshot_date DESC);
CREATE INDEX idx_group_evolution_time ON group_evolution(organization_id, period_start, period_end);
CREATE INDEX idx_narrative_timeseries ON narrative_timeseries(narrative_id, measurement_date DESC);
CREATE INDEX idx_relationship_history ON relationship_history(stakeholder_id, interaction_date DESC);
CREATE INDEX idx_coalition_active ON coalition_tracking(organization_id, current_status) WHERE current_status = 'active'; 2. Automated Tracking Functions
javascript// Supabase Edge Function for daily stakeholder snapshots
// supabase/functions/track-stakeholder-evolution/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
const supabase = createClient(
Deno.env.get('SUPABASE_URL') ?? '',
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Run daily snapshot for all organizations
const { data: organizations } = await supabase
.from('organization_profiles')
.select('id, name')

for (const org of organizations) {
await createDailySnapshots(supabase, org.id)
await detectGroupEvolution(supabase, org.id)
await trackNarrativeShifts(supabase, org.id)
await analyzeCoalitionFormation(supabase, org.id)
}

return new Response(JSON.stringify({ success: true }), {
headers: { 'Content-Type': 'application/json' },
})
})

async function createDailySnapshots(supabase: any, orgId: string) {
// Get all stakeholders for the organization
const { data: stakeholders } = await supabase
.from('stakeholders')
.select('\*')
.eq('organization_id', orgId)

const today = new Date().toISOString().split('T')[0]

for (const stakeholder of stakeholders) {
// Calculate current metrics (would integrate with MCPs here)
const metrics = await calculateStakeholderMetrics(stakeholder)

    // Create snapshot
    await supabase
      .from('stakeholder_snapshots')
      .upsert({
        organization_id: orgId,
        stakeholder_id: stakeholder.id,
        snapshot_date: today,
        influence_score: metrics.influence,
        sentiment: metrics.sentiment,
        engagement_level: metrics.engagement,
        relationship_health: metrics.health,
        media_mentions: metrics.media_mentions,
        key_events: metrics.events
      })

}
}

async function detectGroupEvolution(supabase: any, orgId: string) {
// Detect when stakeholders start coordinating
const query = `    WITH coordination_patterns AS (
      SELECT 
        s1.id as stakeholder1,
        s2.id as stakeholder2,
        COUNT(*) as joint_actions,
        AVG(EXTRACT(EPOCH FROM (s2.created_at - s1.created_at))) as avg_time_delta
      FROM intelligence_updates s1
      JOIN intelligence_updates s2 
        ON s1.organization_id = s2.organization_id
        AND s1.id != s2.id
        AND ABS(EXTRACT(EPOCH FROM (s2.created_at - s1.created_at))) < 86400
        AND s1.update_data->>'topic' = s2.update_data->>'topic'
      WHERE s1.organization_id = $1
        AND s1.created_at > NOW() - INTERVAL '30 days'
      GROUP BY s1.id, s2.id
      HAVING COUNT(*) > 3
    )
    SELECT * FROM coordination_patterns
 `

// This query identifies stakeholders acting in coordination
// You can use this to detect forming coalitions
}

async function trackNarrativeShifts(supabase: any, orgId: string) {
// Track how narratives evolve over time
const { data: narratives } = await supabase
.from('narrative_timeseries')
.select('\*')
.eq('organization_id', orgId)
.order('measurement_date', { ascending: false })
.limit(30)

// Analyze trends
for (const narrative of narratives) {
const trend = analyzeNarrativeTrend(narrative)

    if (trend.isEscalating) {
      // Create alert for escalating narrative
      await supabase
        .from('intelligence_updates')
        .insert({
          organization_id: orgId,
          update_type: 'narrative_escalation',
          update_data: {
            narrative: narrative.narrative_theme,
            trend: trend,
            recommended_action: 'Immediate response required'
          },
          requires_action: true
        })
    }

}
}

function analyzeNarrativeTrend(narrativeData: any) {
// Simple trend analysis
const recentSentiment = narrativeData.sentiment_score
const recentVolume = narrativeData.volume

return {
isEscalating: recentVolume > 100 && recentSentiment < -0.5,
direction: recentSentiment > 0 ? 'positive' : 'negative',
velocity: recentVolume / 30 // Messages per day
}
}

async function analyzeCoalitionFormation(supabase: any, orgId: string) {
// Detect when separate groups start working together
const coalitionSignals = {
joint_statements: await detectJointStatements(supabase, orgId),
coordinated_campaigns: await detectCoordinatedCampaigns(supabase, orgId),
shared_messaging: await detectSharedMessaging(supabase, orgId)
}

if (coalitionSignals.joint_statements.length > 0) {
// New coalition forming
await supabase
.from('coalition_tracking')
.insert({
organization_id: orgId,
coalition_name: generateCoalitionName(coalitionSignals),
formation_date: new Date().toISOString().split('T')[0],
member_timeline: coalitionSignals.joint_statements.map(s => ({
entity: s.entity,
joined: new Date().toISOString().split('T')[0],
role: s.role
})),
current_status: 'forming',
current_influence: calculateCoalitionInfluence(coalitionSignals)
})
}
} 3. Visualization Queries for Tracking Over Time
sql-- Get stakeholder influence evolution over time
CREATE OR REPLACE FUNCTION get_stakeholder_evolution(
p_organization_id UUID,
p_stakeholder_id UUID,
p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
date DATE,
influence_score INTEGER,
sentiment DECIMAL,
engagement_level TEXT,
key_events JSONB
) AS $$
BEGIN
RETURN QUERY
SELECT
snapshot_date,
ss.influence_score,
ss.sentiment,
ss.engagement_level,
ss.key_events
FROM stakeholder_snapshots ss
WHERE ss.organization_id = p_organization_id
AND ss.stakeholder_id = p_stakeholder_id
AND ss.snapshot_date > CURRENT_DATE - p_days
ORDER BY snapshot_date DESC;
END;

$$
LANGUAGE plpgsql;

-- Detect coalition growth patterns
CREATE OR REPLACE FUNCTION analyze_coalition_growth(
  p_organization_id UUID,
  p_coalition_id UUID
)
RETURNS TABLE (
  period DATE,
  member_count INTEGER,
  influence_score DECIMAL,
  activity_level TEXT
) AS
$$

BEGIN
RETURN QUERY
WITH timeline AS (
SELECT
date_trunc('week', created_at) as period,
jsonb_array_length(member_timeline) as member_count,
current_influence as influence_score,
current_status as activity_level
FROM coalition_tracking
WHERE id = p_coalition_id
AND organization_id = p_organization_id
)
SELECT \* FROM timeline
ORDER BY period;
END;

$$
LANGUAGE plpgsql;

-- Find correlated stakeholder activities
CREATE OR REPLACE FUNCTION find_correlated_activities(
  p_organization_id UUID,
  p_time_window INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
  group_entities JSONB,
  correlation_score DECIMAL,
  common_topics JSONB,
  time_pattern TEXT
) AS
$$

BEGIN
RETURN QUERY
WITH activity_clusters AS (
SELECT
array_agg(DISTINCT s.name) as entities,
array_agg(DISTINCT iu.update_data->>'topic') as topics,
COUNT(\*) as activity_count,
stddev(EXTRACT(EPOCH FROM iu.created_at)) as time_variance
FROM intelligence_updates iu
JOIN stakeholders s ON s.organization_id = iu.organization_id
WHERE iu.organization_id = p_organization_id
AND iu.created_at > NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', iu.created_at)
HAVING COUNT(DISTINCT s.id) > 2
)
SELECT
to_jsonb(entities) as group_entities,
CASE
WHEN time_variance < 3600 THEN 0.9
WHEN time_variance < 7200 THEN 0.7
ELSE 0.5
END as correlation_score,
to_jsonb(topics) as common_topics,
CASE
WHEN time_variance < 3600 THEN 'highly_coordinated'
WHEN time_variance < 7200 THEN 'loosely_coordinated'
ELSE 'possibly_coincidental'
END as time_pattern
FROM activity_clusters;
END;

$$
LANGUAGE plpgsql;
4. Frontend Components for Temporal Visualization
javascript// React component for stakeholder evolution chart
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const StakeholderEvolutionChart = ({ organizationId, stakeholderId }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch evolution data
    const fetchEvolution = async () => {
      const { data, error } = await supabase
        .rpc('get_stakeholder_evolution', {
          p_organization_id: organizationId,
          p_stakeholder_id: stakeholderId,
          p_days: 90
        })

      if (data) {
        setData(data.map(d => ({
          date: d.date,
          influence: d.influence_score,
          sentiment: (d.sentiment * 100), // Convert to percentage
          health: d.relationship_health
        })))
      }
    }

    fetchEvolution()
  }, [organizationId, stakeholderId])

  return (
    <div>
      <h3>Stakeholder Evolution - Last 90 Days</h3>
      <LineChart width={800} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="influence"
          stroke="#8884d8"
          name="Influence Score"
        />
        <Line
          type="monotone"
          dataKey="sentiment"
          stroke="#82ca9d"
          name="Sentiment %"
        />
        <Line
          type="monotone"
          dataKey="health"
          stroke="#ffc658"
          name="Relationship Health"
        />
      </LineChart>
    </div>
  );
};

// Coalition formation timeline
const CoalitionTimeline = ({ organizationId }) => {
  const [coalitions, setCoalitions] = useState([]);

  useEffect(() => {
    // Subscribe to coalition changes
    const subscription = supabase
      .channel(`coalitions-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coalition_tracking',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          // Update timeline when coalitions form or change
          fetchCoalitions()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [organizationId])

  return (
    <div>
      <h3>Coalition Formation Timeline</h3>
      {coalitions.map(coalition => (
        <CoalitionCard
          key={coalition.id}
          coalition={coalition}
          showMemberGrowth={true}
          showInfluenceChart={true}
        />
      ))}
    </div>
  );
};
5. Predictive Analytics for Group Behavior
javascript// Predict future coalition actions based on historical patterns
async function predictCoalitionBehavior(coalitionId: string) {
  // Get historical pattern
  const { data: history } = await supabase
    .from('coalition_tracking')
    .select('*')
    .eq('id', coalitionId)
    .single()

  // Analyze member timeline
  const memberGrowthRate = calculateGrowthRate(history.member_timeline)
  const influenceTrend = calculateInfluenceTrend(history.influence_history)

  // Predict next actions based on patterns
  const predictions = {
    likely_next_action: predictNextAction(history),
    growth_projection: {
      members_30_days: Math.round(history.member_timeline.length * (1 + memberGrowthRate)),
      influence_30_days: history.current_influence * (1 + influenceTrend)
    },
    escalation_probability: calculateEscalationProbability(history),
    coordination_increase: predictCoordinationLevel(history)
  }

  return predictions
}

function calculateEscalationProbability(coalitionData: any): number {
  const factors = {
    member_growth: coalitionData.member_timeline.length > 10 ? 0.3 : 0.1,
    recent_success: coalitionData.success_history.filter(s => s.outcome === 'success').length > 2 ? 0.3 : 0.1,
    media_attention: coalitionData.current_influence > 7 ? 0.2 : 0.1,
    stated_objectives: coalitionData.current_objective?.includes('escalate') ? 0.2 : 0
  }

  return Object.values(factors).reduce((a, b) => a + b, 0)
}
6. Alert System for Group Changes
sql-- Trigger for significant stakeholder changes
CREATE OR REPLACE FUNCTION notify_stakeholder_change()
RETURNS TRIGGER AS
$$

DECLARE
change_magnitude DECIMAL;
BEGIN
-- Calculate change magnitude
change_magnitude := ABS(NEW.influence_score - OLD.influence_score);

-- If significant change, create alert
IF change_magnitude > 2 OR
(NEW.sentiment < -0.5 AND OLD.sentiment > 0) OR
NEW.engagement_level = 'hostile' THEN

    INSERT INTO intelligence_updates (
      organization_id,
      update_type,
      update_data,
      requires_action,
      confidence_score
    ) VALUES (
      NEW.organization_id,
      'stakeholder_alert',
      jsonb_build_object(
        'stakeholder_id', NEW.id,
        'change_type', CASE
          WHEN change_magnitude > 2 THEN 'influence_shift'
          WHEN NEW.sentiment < OLD.sentiment THEN 'sentiment_decline'
          ELSE 'engagement_change'
        END,
        'previous_state', row_to_json(OLD),
        'current_state', row_to_json(NEW)
      ),
      true,
      0.95
    );

END IF;

RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER stakeholder_change_trigger
AFTER UPDATE ON stakeholders
FOR EACH ROW
EXECUTE FUNCTION notify_stakeholder_change();
$$
