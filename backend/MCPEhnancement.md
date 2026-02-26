Looking at your documented MCPs, you have excellent coverage but there are some critical gaps for a comprehensive PR platform. Let me analyze what you have and what's missing:
Your Current MCP Arsenal (11 MCPs):
✅ Strong Coverage Areas:

signaldesk-intelligence - Market intelligence, competitor monitoring, emerging topics
signaldesk-relationships - Journalist tracking, relationship health, influencer mapping
signaldesk-analytics - Media value, sentiment, ROI, coverage quality
signaldesk-content - Content generation, crisis statements, localization
signaldesk-campaigns - Campaign planning, task management, orchestration
signaldesk-media - Journalist discovery, pitch generation, outreach tracking
signaldesk-opportunities - Opportunity discovery, analysis, pitch suggestions
signaldesk-memory - Knowledge management, context storage
signaldesk-monitor - Real-time stakeholder monitoring
signaldesk-scraper - Web scraping, cascade prediction
playwright-mcp-server - Browser automation
organization-intelligence - automatically populates and maintains your pre-indexed organization database

🔴 Critical Gaps Identified:

1. Missing: signaldesk-entities MCP
   You need a dedicated MCP for entity management and recognition:
   typescript// signaldesk-entities/index.ts
   {
   tools: [
   "recognize_entities", // Extract entities from any text
   "enrich_entity_profile", // Get full profile from various sources
   "track_entity_evolution", // Monitor changes over time
   "find_entity_connections", // Discover relationships between entities
   "match_entities_to_org", // Auto-match relevant entities to an organization
   "update_entity_intelligence", // Update entity profiles with new information
   "predict_entity_behavior" // Predict reactions based on history
   ]
   }
2. Missing: signaldesk-crisis MCP
   Crisis management needs dedicated tools:
   typescript// signaldesk-crisis/index.ts
   {
   tools: [
   "detect_crisis_signals", // Early warning detection
   "assess_crisis_severity", // Evaluate threat level
   "generate_crisis_response", // Immediate response plan
   "coordinate_war_room", // Orchestrate crisis team
   "monitor_crisis_evolution", // Track crisis progression
   "predict_crisis_cascade", // Specific cascade predictions for crises
   "generate_holding_statement" // Immediate placeholder statements
   ]
   }
3. Missing: signaldesk-social MCP
   Social media management is notably absent:
   typescript// signaldesk-social/index.ts
   {
   tools: [
   "monitor_social_sentiment", // Real-time social monitoring
   "detect_viral_moments", // Identify viral potential
   "track_influencer_activity", // Monitor key social influencers
   "generate_social_content", // Platform-specific content
   "schedule_social_posts", // Content scheduling
   "analyze_social_engagement", // Engagement metrics
   "detect_social_crises" // Social media crisis detection
   ]
   }
4. Missing: signaldesk-stakeholder-groups MCP
   While you have relationships, you need group/coalition tracking:
   typescript// signaldesk-stakeholder-groups/index.ts
   {
   tools: [
   "detect_coalition_formation", // Identify forming groups
   "track_coalition_evolution", // Monitor group dynamics
   "predict_group_actions", // Predict coordinated actions
   "analyze_group_influence", // Calculate collective influence
   "map_stakeholder_networks", // Network analysis
   "identify_group_leaders", // Find key influencers in groups
   "monitor_group_messaging" // Track coordinated messaging
   ]
   }
5. Missing: signaldesk-narratives MCP
   Dedicated narrative management beyond just tracking:
   typescript// signaldesk-narratives/index.ts
   {
   tools: [
   "track_narrative_evolution", // How narratives change over time
   "detect_narrative_vacuum", // Find gaps in narratives
   "measure_narrative_strength", // Quantify narrative power
   "predict_narrative_spread", // Forecast how narratives will spread
   "identify_narrative_drivers", // Who's pushing what narratives
   "create_counter_narrative", // Develop response narratives
   "track_narrative_adoption" // Monitor narrative uptake
   ]
   }
6. Missing: signaldesk-regulatory MCP
   Regulatory intelligence needs special attention:
   typescript// signaldesk-regulatory/index.ts
   {
   tools: [
   "monitor_regulatory_changes", // Track regulatory updates
   "predict_regulatory_trends", // Forecast regulatory direction
   "analyze_compliance_impact", // Assess impact on organization
   "track_lobbying_activity", // Monitor lobbying efforts
   "identify_regulatory_allies", // Find supportive voices
   "generate_regulatory_response", // Create regulatory submissions
   "monitor_enforcement_actions" // Track enforcement patterns
   ]
   }
   🟡 Enhancement Opportunities for Existing MCPs:
   signaldesk-intelligence - Add:

cross_reference_sources - Verify information across multiple sources
detect_disinformation - Identify false narratives
track_narrative_origins - Find where narratives start

signaldesk-scraper - Add:

monitor_dark_web - For early crisis detection
scrape_regulatory_sites - Government/regulatory monitoring
monitor_job_boards - Competitor hiring patterns

signaldesk-relationships - Add:

predict_journalist_interest - What stories will journalists want
track_journalist_beats_changes - When journalists change focus
identify_journalist_networks - Who influences whom

signaldesk-analytics - Add:

predict_campaign_success - Before launch predictions
benchmark_against_industry - Comparative analytics
calculate_narrative_roi - Value of narrative control

🟢 Integration Gaps to Address:

1.  Cross-MCP Intelligence Sharing
    Create a meta-orchestration layer:
    javascript// signaldesk-orchestrator/index.ts
    class MCPIntelligenceHub {
    async shareIntelligence(source_mcp, intelligence_type, data) {
    // Broadcast relevant intelligence to all MCPs
    const relevantMCPs = this.determineRelevantMCPs(intelligence_type);
    for (const mcp of relevantMCPs) {
    await mcp.receiveIntelligence(data);
    }
    }

async coordinatedAnalysis(query) {
// Get all MCPs to analyze from their perspective
const analyses = await Promise.all(
this.allMCPs.map(mcp => mcp.analyze(query))
);

    return this.synthesizeAnalyses(analyses);

}
} 2. Feedback Loop System
Your MCPs should learn from outcomes:
javascript// Add to each MCP
{
tools: [
"record_outcome", // What actually happened
"update_patterns", // Adjust patterns based on outcomes
"improve_predictions", // Refine prediction models
"share_learnings" // Share learnings with other MCPs
]
} 3. Priority Coordination
MCPs need to understand urgency:
javascript// Priority coordination system
{
tools: [
"assess_urgency", // How urgent is this signal?
"coordinate_response", // Which MCPs should act first?
"allocate_resources", // Where to focus attention
"escalate_critical" // Escalation protocols
]
}

AUTOMATED ORGANIZATION INTELLIGENCE MCP

// MCP Enhancement System for Automated Organization Intelligence
// This system automatically populates and maintains your pre-indexed organization database

import { createClient } from '@supabase/supabase-js';

// ============================================
// CORE MCP ENHANCEMENT: ENTITY MANAGEMENT
// ============================================

interface OrganizationProfile {
id: string;
name: string;
aliases: string[];
industry: {
primary: string;
secondary: string[];
subcategories: string[];
};
metadata: {
founded: string;
headquarters: string;
employees: string;
revenue: string;
public_private: 'public' | 'private';
ticker?: string;
website: string;
social_handles: Record<string, string>;
};
stakeholders: {
executives: StakeholderProfile[];
board_members: StakeholderProfile[];
major_investors: StakeholderProfile[];
key_customers: string[];
main_competitors: string[];
regulators: string[];
media_outlets: MediaOutlet[];
activist_groups: ActivistGroup[];
};
monitoring_config: {
keywords: string[];
rss_feeds: string[];
api_endpoints: string[];
social_accounts: string[];
regulatory_filings: boolean;
executive_changes: boolean;
ma_activity: boolean;
crisis_indicators: string[];
};
intelligence: {
narrative_themes: NarrativeTheme[];
recent_developments: Development[];
upcoming_catalysts: Catalyst[];
risk_factors: Risk[];
opportunities: Opportunity[];
cascade_triggers: CascadeTrigger[];
};
relationships: {
parent_company?: string;
subsidiaries: string[];
joint_ventures: string[];
strategic_partnerships: string[];
};
last_updated: Date;
enrichment_status: 'pending' | 'partial' | 'complete';
}

interface StakeholderProfile {
id: string;
name: string;
role: string;
influence_score: number;
sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
last_interaction?: Date;
notes?: string;
}

interface MediaOutlet {
name: string;
journalists: string[];
beat: string;
reach: 'local' | 'national' | 'global';
relationship_health: number;
}

interface ActivistGroup {
name: string;
type: string;
focus_areas: string[];
activity_level: 'low' | 'medium' | 'high';
last_action?: Date;
}

interface NarrativeTheme {
theme: string;
sentiment: number;
volume: number;
trend: 'rising' | 'stable' | 'declining';
key_drivers: string[];
}

interface Development {
date: Date;
type: string;
description: string;
impact_score: number;
source: string;
}

interface Catalyst {
date: Date;
event: string;
potential_impact: string;
probability: number;
}

interface Risk {
category: string;
description: string;
severity: 'low' | 'medium' | 'high' | 'critical';
mitigation_strategy?: string;
}

interface Opportunity {
type: string;
description: string;
timeline: string;
potential_value: string;
}

interface CascadeTrigger {
trigger_event: string;
affected_stakeholders: string[];
cascade_probability: number;
potential_impacts: string[];
}

// ============================================
// ENTITY MCP: CORE INTELLIGENCE ENGINE
// ============================================

class EntityIntelligenceMCP {
private supabase: any;
private organizationCache: Map<string, OrganizationProfile> = new Map();
private industryTaxonomy: Map<string, any> = new Map();

constructor(supabaseUrl: string, supabaseKey: string) {
this.supabase = createClient(supabaseUrl, supabaseKey);
this.initializeTaxonomy();
}

private initializeTaxonomy() {
// Load the complete industry taxonomy from the artifact
this.industryTaxonomy.set('technology', {
subcategories: ['enterprise_software', 'consumer_software', 'infrastructure', 'ai_ml', 'data_analytics'],
organizations: ['microsoft', 'google', 'amazon', 'apple', 'meta', 'oracle', 'salesforce']
});
// ... continue for all industries
}

// ============================================
// AUTOMATIC ORGANIZATION ENRICHMENT
// ============================================

async enrichOrganization(organizationName: string): Promise<OrganizationProfile> {
console.log(`🔍 Starting enrichment for: ${organizationName}`);

    // Step 1: Create base profile
    const profile = await this.createBaseProfile(organizationName);

    // Step 2: Industry classification
    profile.industry = await this.classifyIndustry(organizationName);

    // Step 3: Gather basic metadata
    profile.metadata = await this.gatherMetadata(organizationName);

    // Step 4: Identify stakeholders
    profile.stakeholders = await this.identifyStakeholders(organizationName);

    // Step 5: Set up monitoring configuration
    profile.monitoring_config = await this.setupMonitoring(organizationName, profile.industry);

    // Step 6: Initial intelligence gathering
    profile.intelligence = await this.gatherInitialIntelligence(organizationName);

    // Step 7: Map relationships
    profile.relationships = await this.mapRelationships(organizationName);

    // Step 8: Store in database
    await this.storeOrganization(profile);

    // Step 9: Cache for performance
    this.organizationCache.set(profile.id, profile);

    console.log(`✅ Enrichment complete for: ${organizationName}`);
    return profile;

}

private async createBaseProfile(name: string): Promise<OrganizationProfile> {
const id = this.generateId(name);

    return {
      id,
      name,
      aliases: await this.findAliases(name),
      industry: { primary: '', secondary: [], subcategories: [] },
      metadata: {
        founded: '',
        headquarters: '',
        employees: '',
        revenue: '',
        public_private: 'private',
        website: '',
        social_handles: {}
      },
      stakeholders: {
        executives: [],
        board_members: [],
        major_investors: [],
        key_customers: [],
        main_competitors: [],
        regulators: [],
        media_outlets: [],
        activist_groups: []
      },
      monitoring_config: {
        keywords: [name],
        rss_feeds: [],
        api_endpoints: [],
        social_accounts: [],
        regulatory_filings: false,
        executive_changes: true,
        ma_activity: true,
        crisis_indicators: []
      },
      intelligence: {
        narrative_themes: [],
        recent_developments: [],
        upcoming_catalysts: [],
        risk_factors: [],
        opportunities: [],
        cascade_triggers: []
      },
      relationships: {
        subsidiaries: [],
        joint_ventures: [],
        strategic_partnerships: []
      },
      last_updated: new Date(),
      enrichment_status: 'pending'
    };

}

private async classifyIndustry(name: string): Promise<any> {
// Use NLP to classify based on name and context
const keywords = name.toLowerCase().split(' ');

    // Check against industry taxonomy
    for (const [industry, data] of this.industryTaxonomy) {
      if (this.matchesIndustry(keywords, data)) {
        return {
          primary: industry,
          secondary: this.identifySecondaryIndustries(name, industry),
          subcategories: this.identifySubcategories(name, industry)
        };
      }
    }

    // If no match, use AI classification
    return await this.aiClassifyIndustry(name);

}

private async identifyStakeholders(name: string): Promise<any> {
const stakeholders = {
executives: [],
board_members: [],
major_investors: [],
key_customers: [],
main_competitors: [],
regulators: [],
media_outlets: [],
activist_groups: []
};

    // Query various sources for stakeholder information
    const [executives, investors, competitors] = await Promise.all([
      this.findExecutives(name),
      this.findInvestors(name),
      this.findCompetitors(name)
    ]);

    stakeholders.executives = executives;
    stakeholders.major_investors = investors;
    stakeholders.main_competitors = competitors;

    // Identify relevant regulators based on industry
    stakeholders.regulators = await this.identifyRegulators(name);

    // Find media outlets that cover this organization
    stakeholders.media_outlets = await this.findMediaCoverage(name);

    // Identify potential activist groups
    stakeholders.activist_groups = await this.identifyActivistGroups(name);

    return stakeholders;

}

private async setupMonitoring(name: string, industry: any): Promise<any> {
const config = {
keywords: [name, ...await this.generateKeywords(name)],
rss_feeds: await this.identifyRSSFeeds(industry),
api_endpoints: await this.identifyAPIs(name),
social_accounts: await this.findSocialAccounts(name),
regulatory_filings: this.requiresRegulatoryMonitoring(industry),
executive_changes: true,
ma_activity: true,
crisis_indicators: await this.defineCrisisIndicators(industry)
};

    return config;

}

// ============================================
// INTELLIGENT QUERYING SYSTEM
// ============================================

async queryOrganizations(params: {
industry?: string;
subcategory?: string;
stakeholder_type?: string;
min_influence?: number;
has_activists?: boolean;
revenue_range?: string;
employee_range?: string;
location?: string;
public_only?: boolean;
}): Promise<OrganizationProfile[]> {
let query = this.supabase
.from('organizations')
.select('\*');

    if (params.industry) {
      query = query.eq('industry->primary', params.industry);
    }

    if (params.subcategory) {
      query = query.contains('industry->subcategories', [params.subcategory]);
    }

    if (params.public_only) {
      query = query.eq('metadata->public_private', 'public');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Apply additional filters that require computation
    let results = data;

    if (params.min_influence) {
      results = results.filter(org =>
        this.calculateInfluenceScore(org) >= params.min_influence
      );
    }

    if (params.has_activists) {
      results = results.filter(org =>
        org.stakeholders.activist_groups.length > 0
      );
    }

    return results;

}

// ============================================
// RELATIONSHIP MAPPING
// ============================================

async mapOrganizationNetwork(organizationId: string, depth: number = 2): Promise<any> {
const network = {
nodes: [],
edges: [],
clusters: []
};

    const visited = new Set<string>();
    const queue = [{ id: organizationId, level: 0 }];

    while (queue.length > 0 && queue[0].level < depth) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;

      visited.add(current.id);
      const org = await this.getOrganization(current.id);

      // Add node
      network.nodes.push({
        id: org.id,
        name: org.name,
        industry: org.industry.primary,
        level: current.level,
        influence: this.calculateInfluenceScore(org)
      });

      // Add relationships as edges and queue for exploration
      const relationships = [
        ...org.relationships.subsidiaries.map(id => ({ id, type: 'subsidiary' })),
        ...org.relationships.joint_ventures.map(id => ({ id, type: 'joint_venture' })),
        ...org.relationships.strategic_partnerships.map(id => ({ id, type: 'partnership' })),
        ...org.stakeholders.main_competitors.map(id => ({ id, type: 'competitor' }))
      ];

      for (const rel of relationships) {
        network.edges.push({
          source: org.id,
          target: rel.id,
          type: rel.type,
          weight: this.calculateRelationshipWeight(rel.type)
        });

        if (current.level < depth - 1) {
          queue.push({ id: rel.id, level: current.level + 1 });
        }
      }
    }

    // Identify clusters
    network.clusters = this.identifyClusters(network.nodes, network.edges);

    return network;

}

// ============================================
// PATTERN DETECTION & PREDICTION
// ============================================

async detectCoalitionFormation(organizationIds: string[]): Promise<any> {
const activities = [];

    for (const id of organizationIds) {
      const org = await this.getOrganization(id);
      activities.push({
        organization: id,
        recent_actions: org.intelligence.recent_developments,
        narratives: org.intelligence.narrative_themes
      });
    }

    // Analyze for coordinated activity
    const coordination = this.analyzeCoordination(activities);

    if (coordination.score > 0.7) {
      return {
        coalition_forming: true,
        probability: coordination.score,
        shared_narratives: coordination.shared_themes,
        coordinated_timing: coordination.timing_correlation,
        predicted_action: coordination.likely_next_action,
        recommended_response: this.generateCoalitionResponse(coordination)
      };
    }

    return { coalition_forming: false, probability: coordination.score };

}

async predictCascadeEffects(triggerEvent: string, organizationId: string): Promise<any> {
const org = await this.getOrganization(organizationId);
const cascades = [];

    // Check if trigger matches any cascade triggers
    for (const trigger of org.intelligence.cascade_triggers) {
      if (this.matchesTrigger(triggerEvent, trigger.trigger_event)) {
        const effects = await this.simulateCascade(trigger, org);
        cascades.push({
          trigger: trigger.trigger_event,
          probability: trigger.cascade_probability,
          timeline: this.estimateTimeline(effects),
          affected_stakeholders: effects.stakeholders,
          impacts: effects.impacts,
          mitigation_options: this.generateMitigationStrategies(effects)
        });
      }
    }

    return {
      triggered_cascades: cascades,
      overall_risk: this.calculateOverallRisk(cascades),
      recommended_actions: this.prioritizeActions(cascades)
    };

}

// ============================================
// CONTINUOUS LEARNING SYSTEM
// ============================================

async learnFromOutcome(
organizationId: string,
prediction: any,
actual_outcome: any
): Promise<void> {
// Calculate prediction accuracy
const accuracy = this.calculateAccuracy(prediction, actual_outcome);

    // Update organization profile with learning
    const org = await this.getOrganization(organizationId);

    // Add to historical patterns
    await this.supabase
      .from('prediction_history')
      .insert({
        organization_id: organizationId,
        prediction,
        actual_outcome,
        accuracy,
        timestamp: new Date()
      });

    // Update cascade triggers if applicable
    if (actual_outcome.cascade_occurred) {
      org.intelligence.cascade_triggers.push({
        trigger_event: actual_outcome.trigger,
        affected_stakeholders: actual_outcome.affected,
        cascade_probability: this.adjustProbability(prediction.probability, accuracy),
        potential_impacts: actual_outcome.impacts
      });

      await this.updateOrganization(org);
    }

    // Retrain models with new data
    await this.retrainModels(organizationId);

}

// ============================================
// HELPER METHODS
// ============================================

private generateId(name: string): string {
return name.toLowerCase().replace(/[^a-z0-9]/g, '\_');
}

private async findAliases(name: string): Promise<string[]> {
// Look for common variations, abbreviations, former names
const aliases = [];

    // Add common abbreviations
    const words = name.split(' ');
    if (words.length > 1) {
      aliases.push(words.map(w => w[0]).join(''));
    }

    // Add without common suffixes
    const suffixes = ['Inc', 'Corp', 'LLC', 'Ltd', 'Company', 'Co'];
    for (const suffix of suffixes) {
      if (name.includes(suffix)) {
        aliases.push(name.replace(suffix, '').trim());
      }
    }

    return [...new Set(aliases)];

}

private calculateInfluenceScore(org: OrganizationProfile): number {
let score = 0;

    // Size factors
    if (org.metadata.revenue.includes('B')) score += 30;
    else if (org.metadata.revenue.includes('M')) score += 10;

    // Public company bonus
    if (org.metadata.public_private === 'public') score += 20;

    // Media coverage
    score += org.stakeholders.media_outlets.length * 5;

    // Investor quality
    const topInvestors = ['blackrock', 'vanguard', 'state_street'];
    const hasTopInvestor = org.stakeholders.major_investors.some(inv =>
      topInvestors.some(top => inv.name.toLowerCase().includes(top))
    );
    if (hasTopInvestor) score += 20;

    // Regulatory attention
    score += org.stakeholders.regulators.length * 10;

    return Math.min(100, score);

}

private async storeOrganization(profile: OrganizationProfile): Promise<void> {
const { error } = await this.supabase
.from('organizations')
.upsert({
id: profile.id,
name: profile.name,
aliases: profile.aliases,
industry: profile.industry,
metadata: profile.metadata,
stakeholders: profile.stakeholders,
monitoring_config: profile.monitoring_config,
intelligence: profile.intelligence,
relationships: profile.relationships,
last_updated: profile.last_updated,
enrichment_status: profile.enrichment_status
});

    if (error) throw error;

}

private async getOrganization(id: string): Promise<OrganizationProfile> {
// Check cache first
if (this.organizationCache.has(id)) {
return this.organizationCache.get(id);
}

    // Query database
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Cache and return
    this.organizationCache.set(id, data);
    return data;

}

private async updateOrganization(profile: OrganizationProfile): Promise<void> {
profile.last_updated = new Date();
await this.storeOrganization(profile);
this.organizationCache.set(profile.id, profile);
}
}

// ============================================
// MCP ORCHESTRATION LAYER
// ============================================

class MCPOrchestrator {
private entityMCP: EntityIntelligenceMCP;
private activeTasks: Map<string, any> = new Map();

constructor(entityMCP: EntityIntelligenceMCP) {
this.entityMCP = entityMCP;
}

async processIntelligenceSignal(signal: any): Promise<any> {
console.log(`📡 Processing signal: ${signal.type}`);

    // Step 1: Entity extraction
    const entities = await this.extractEntities(signal);

    // Step 2: Enrich any new entities
    for (const entity of entities) {
      if (!await this.isKnownEntity(entity)) {
        await this.entityMCP.enrichOrganization(entity);
      }
    }

    // Step 3: Update intelligence for affected entities
    const updates = await this.generateIntelligenceUpdates(signal, entities);

    // Step 4: Check for cascade triggers
    const cascades = await this.checkCascadeTriggers(signal, entities);

    // Step 5: Identify opportunities
    const opportunities = await this.identifyOpportunities(signal, entities);

    // Step 6: Generate recommended actions
    const actions = await this.generateActions(updates, cascades, opportunities);

    return {
      affected_entities: entities,
      intelligence_updates: updates,
      cascade_risks: cascades,
      opportunities,
      recommended_actions: actions,
      priority: this.calculatePriority(signal, cascades, opportunities)
    };

}

private async extractEntities(signal: any): Promise<string[]> {
// Use NLP to extract organization names from signal
const entities = [];

    // Simple pattern matching for now
    const patterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|Corp|LLC|Ltd|Company|Co)\b/g,
      /\b[A-Z]{2,}\b/g // Acronyms
    ];

    for (const pattern of patterns) {
      const matches = signal.content.match(pattern);
      if (matches) {
        entities.push(...matches);
      }
    }

    return [...new Set(entities)];

}

private async isKnownEntity(name: string): Promise<boolean> {
try {
await this.entityMCP.getOrganization(this.generateId(name));
return true;
} catch {
return false;
}
}

private generateId(name: string): string {
return name.toLowerCase().replace(/[^a-z0-9]/g, '\_');
}

private async checkCascadeTriggers(signal: any, entities: string[]): Promise<any[]> {
const cascades = [];

    for (const entity of entities) {
      const predictions = await this.entityMCP.predictCascadeEffects(
        signal.content,
        this.generateId(entity)
      );

      if (predictions.triggered_cascades.length > 0) {
        cascades.push({
          entity,
          cascades: predictions.triggered_cascades,
          overall_risk: predictions.overall_risk
        });
      }
    }

    return cascades;

}

private calculatePriority(signal: any, cascades: any[], opportunities: any[]): string {
let score = 0;

    // Signal type weight
    const signalWeights = {
      'crisis': 100,
      'regulatory': 80,
      'executive_change': 60,
      'merger': 70,
      'earnings': 40,
      'product': 30
    };
    score += signalWeights[signal.type] || 20;

    // Cascade risk weight
    const maxRisk = Math.max(...cascades.map(c => c.overall_risk), 0);
    score += maxRisk * 50;

    // Opportunity value weight
    const hasHighValueOpp = opportunities.some(o => o.value === 'high');
    if (hasHighValueOpp) score += 40;

    if (score >= 150) return 'critical';
    if (score >= 100) return 'high';
    if (score >= 50) return 'medium';
    return 'low';

}
}

// ============================================
// AUTOMATED POPULATION SYSTEM
// ============================================

class AutomatedPopulationSystem {
private entityMCP: EntityIntelligenceMCP;
private orchestrator: MCPOrchestrator;
private populationQueue: string[] = [];
private isProcessing: boolean = false;

constructor(supabaseUrl: string, supabaseKey: string) {
this.entityMCP = new EntityIntelligenceMCP(supabaseUrl, supabaseKey);
this.orchestrator = new MCPOrchestrator(this.entityMCP);
}

async populateFromIndustryList(industries: string[]): Promise<void> {
console.log(`🚀 Starting population for ${industries.length} industries`);

    for (const industry of industries) {
      const organizations = await this.fetchOrganizationsForIndustry(industry);
      this.populationQueue.push(...organizations);
    }

    await this.processQueue();

}

private async fetchOrganizationsForIndustry(industry: string): Promise<string[]> {
// This would connect to various data sources
const sources = [
this.fetchFromCrunchbase(industry),
this.fetchFromLinkedIn(industry),
this.fetchFromSEC(industry),
this.fetchFromIndustryAssociations(industry)
];

    const results = await Promise.all(sources);
    return [...new Set(results.flat())];

}

private async processQueue(): Promise<void> {
if (this.isProcessing) return;
this.isProcessing = true;

    const batchSize = 10;

    while (this.populationQueue.length > 0) {
      const batch = this.populationQueue.splice(0, batchSize);

      await Promise.all(
        batch.map(org => this.entityMCP.enrichOrganization(org))
      );

      console.log(`✅ Processed ${batch.length} organizations. ${this.populationQueue.length} remaining.`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
    console.log('🎉 Population complete!');

}

// Placeholder methods for data sources
private async fetchFromCrunchbase(industry: string): Promise<string[]> {
// Implementation would use Crunchbase API
return [];
}

private async fetchFromLinkedIn(industry: string): Promise<string[]> {
// Implementation would use LinkedIn API or scraping
return [];
}

private async fetchFromSEC(industry: string): Promise<string[]> {
// Implementation would use SEC EDGAR API
return [];
}

private async fetchFromIndustryAssociations(industry: string): Promise<string[]> {
// Implementation would scrape industry association websites
return [];
}
}

// ============================================
// USAGE EXAMPLE
// ============================================

async function initializeSystem() {
const system = new AutomatedPopulationSystem(
process.env.SUPABASE_URL!,
process.env.SUPABASE_KEY!
);

// Populate major industries
await system.populateFromIndustryList([
'technology',
'financial_services',
'healthcare',
'energy',
'retail',
'manufacturing',
'media',
'transportation',
'real_estate',
'telecommunications'
]);

// Query examples
const entityMCP = new EntityIntelligenceMCP(
process.env.SUPABASE_URL!,
process.env.SUPABASE_KEY!
);

// Find all tech companies with activist groups
const techWithActivists = await entityMCP.queryOrganizations({
industry: 'technology',
has_activists: true
});

// Map Microsoft's network
const microsoftNetwork = await entityMCP.mapOrganizationNetwork('microsoft', 3);

// Check for coalition formation among climate activists
const climateGroups = ['350_org', 'greenpeace', 'friends_of_earth'];
const coalition = await entityMCP.detectCoalitionFormation(climateGroups);

// Predict cascade effects of a hypothetical event
const cascades = await entityMCP.predictCascadeEffects(
'Major data breach affecting 100M users',
'meta'
);

console.log('System initialized and populated!');
}

// Export for use in your application
export {
EntityIntelligenceMCP,
MCPOrchestrator,
AutomatedPopulationSystem,
OrganizationProfile,
initializeSystem
};
