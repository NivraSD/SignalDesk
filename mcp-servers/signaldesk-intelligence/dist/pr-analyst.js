// PR Analysis Engine - Deep strategic analysis of intelligence signals
import { Client } from "pg";
export class PRAnalyst {
    dbClient = null;
    constructor() {
        this.initDatabase();
    }
    async initDatabase() {
        if (process.env.DATABASE_URL) {
            this.dbClient = new Client({ connectionString: process.env.DATABASE_URL });
            await this.dbClient.connect();
        }
    }
    async analyzeSignals(signals, organization) {
        // 1. Individual Signal Analysis
        const signal_analysis = await this.analyzeIndividualSignals(signals, organization);
        // 2. Pattern Recognition
        const pattern_recognition = await this.identifyPatterns(signals, signal_analysis);
        // 3. Stakeholder Impact Assessment
        const stakeholder_impact = await this.assessStakeholderImpact(signal_analysis, pattern_recognition);
        // 4. Strategic Implications
        const strategic_implications = await this.deriveStrategicImplications(signal_analysis, pattern_recognition, stakeholder_impact);
        // 5. Response Strategy
        const response_strategy = await this.developResponseStrategy(strategic_implications, stakeholder_impact);
        // 6. Elite Insights (the secret sauce)
        const elite_insights = await this.generateEliteInsights(signals, pattern_recognition, strategic_implications);
        return {
            signal_analysis,
            pattern_recognition,
            stakeholder_impact,
            strategic_implications,
            response_strategy,
            elite_insights
        };
    }
    async analyzeIndividualSignals(signals, organization) {
        return signals.map(signal => {
            // Analyze each signal deeply
            const analysis = this.deepAnalyzeSignal(signal, organization);
            return {
                signal: signal.title,
                what_happened: analysis.factual,
                so_what: analysis.meaning,
                now_what: analysis.action,
                magnitude: analysis.magnitude,
                velocity: analysis.velocity,
                credibility: analysis.credibility,
                relevance: analysis.relevance
            };
        });
    }
    deepAnalyzeSignal(signal, organization) {
        // Credibility scoring based on source
        const credibility = this.scoreCredibility(signal.source);
        // Relevance scoring based on entity mentions and keywords
        const relevance = this.scoreRelevance(signal, organization);
        // Impact assessment
        const magnitude = this.assessMagnitude(signal, organization);
        // Velocity assessment (how fast is this spreading)
        const velocity = this.assessVelocity(signal);
        // Meaning extraction
        const meaning = this.extractMeaning(signal, organization);
        // Action recommendation
        const action = this.recommendAction(signal, magnitude, velocity);
        return {
            factual: this.extractFactual(signal),
            meaning,
            action,
            magnitude,
            velocity,
            credibility,
            relevance
        };
    }
    scoreCredibility(source) {
        const credibilityScores = {
            'reuters': 95,
            'bloomberg': 95,
            'wsj': 90,
            'ft': 90,
            'techcrunch': 80,
            'forbes': 75,
            'businessinsider': 70,
            'reddit': 40,
            'twitter': 30,
            'unknown': 50
        };
        const sourceLower = source.toLowerCase();
        for (const [key, score] of Object.entries(credibilityScores)) {
            if (sourceLower.includes(key))
                return score;
        }
        return 50; // default
    }
    scoreRelevance(signal, organization) {
        let score = 0;
        // Direct mention of organization
        if (signal.title?.toLowerCase().includes(organization.name.toLowerCase()))
            score += 40;
        if (signal.content?.toLowerCase().includes(organization.name.toLowerCase()))
            score += 20;
        // Competitor mention
        if (signal.entity_type === 'competitor')
            score += 30;
        // Industry relevance
        if (signal.title?.toLowerCase().includes(organization.industry?.toLowerCase()))
            score += 20;
        // Keyword matches
        const keywords = organization.keywords || [];
        keywords.forEach((keyword) => {
            if (signal.title?.toLowerCase().includes(keyword.toLowerCase()))
                score += 10;
        });
        return Math.min(score, 100);
    }
    assessMagnitude(signal, organization) {
        // Keywords that indicate magnitude
        const criticalKeywords = ['crisis', 'scandal', 'lawsuit', 'bankruptcy', 'acquisition', 'merger'];
        const highKeywords = ['major', 'significant', 'breakthrough', 'disruption', 'launch'];
        const mediumKeywords = ['update', 'announces', 'reveals', 'partnership'];
        const text = (signal.title + ' ' + signal.content).toLowerCase();
        if (criticalKeywords.some(k => text.includes(k)))
            return 'critical';
        if (highKeywords.some(k => text.includes(k)))
            return 'high';
        if (mediumKeywords.some(k => text.includes(k)))
            return 'medium';
        return 'low';
    }
    assessVelocity(signal) {
        // Time-based velocity assessment
        if (!signal.published)
            return 'moderate';
        const hoursAgo = (Date.now() - new Date(signal.published).getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 1)
            return 'viral';
        if (hoursAgo < 6)
            return 'fast';
        if (hoursAgo < 24)
            return 'moderate';
        return 'slow';
    }
    extractFactual(signal) {
        // Extract the core fact from the signal
        return signal.title || 'Unknown event occurred';
    }
    extractMeaning(signal, organization) {
        // Interpret what this means for the organization
        if (signal.entity_type === 'competitor') {
            return `Competitive landscape shift requiring strategic response`;
        }
        if (signal.type === 'regulatory') {
            return `Compliance implications requiring immediate review`;
        }
        return `Market signal indicating potential opportunity or threat`;
    }
    recommendAction(signal, magnitude, velocity) {
        if (magnitude === 'critical' && velocity === 'viral') {
            return 'Immediate crisis response required - activate war room';
        }
        if (magnitude === 'high' && (velocity === 'fast' || velocity === 'viral')) {
            return 'Rapid response needed - prepare statement within 2 hours';
        }
        if (magnitude === 'high') {
            return 'Strategic response required within 24 hours';
        }
        if (magnitude === 'medium') {
            return 'Monitor and prepare contingency messaging';
        }
        return 'Track for pattern development';
    }
    async identifyPatterns(signals, analyses) {
        const patterns = [];
        // Look for competitive acceleration
        const competitorSignals = signals.filter(s => s.entity_type === 'competitor');
        if (competitorSignals.length >= 3) {
            patterns.push({
                type: 'competitive_acceleration',
                signals_connected: competitorSignals.map(s => s.title),
                insight: 'Multiple competitors moving simultaneously - market inflection point',
                confidence: 85,
                implications: [
                    'Industry consolidation accelerating',
                    'Window for differentiation closing',
                    'Need to establish position now or risk being left behind'
                ]
            });
        }
        // Look for narrative shifts
        const trendingTopics = this.identifyTrendingTopics(signals);
        trendingTopics.forEach(topic => {
            if (topic.count >= 3) {
                patterns.push({
                    type: 'narrative_shift',
                    signals_connected: topic.signals,
                    insight: `"${topic.topic}" emerging as dominant narrative`,
                    confidence: 70 + (topic.count * 5),
                    implications: [
                        'Media looking for stories on this topic',
                        'Opportunity to lead conversation',
                        'Risk of being seen as behind if not addressing'
                    ]
                });
            }
        });
        // Look for cascade patterns
        const cascades = this.identifyCascadePatterns(signals, analyses);
        patterns.push(...cascades);
        return patterns;
    }
    identifyTrendingTopics(signals) {
        const topics = new Map();
        // Common trending keywords to look for
        const trendKeywords = [
            'AI', 'sustainability', 'privacy', 'security', 'innovation',
            'transformation', 'disruption', 'recession', 'growth', 'layoffs'
        ];
        signals.forEach(signal => {
            const text = (signal.title + ' ' + signal.content).toLowerCase();
            trendKeywords.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) {
                    const existing = topics.get(keyword) || { count: 0, signals: [] };
                    existing.count++;
                    existing.signals.push(signal.title);
                    topics.set(keyword, existing);
                }
            });
        });
        return Array.from(topics.entries()).map(([topic, data]) => ({
            topic,
            ...data
        }));
    }
    identifyCascadePatterns(signals, analyses) {
        const patterns = [];
        // Look for high-velocity, high-magnitude signals that could cascade
        const triggerSignals = analyses.filter(a => a.magnitude === 'high' || a.magnitude === 'critical');
        triggerSignals.forEach(trigger => {
            patterns.push({
                type: 'cascade_risk',
                signals_connected: [trigger.signal],
                insight: `${trigger.signal} likely to trigger media cascade within 24-48 hours`,
                confidence: trigger.velocity === 'viral' ? 90 : 70,
                implications: [
                    'Media will seek industry response',
                    'Competitors likely to comment',
                    'Analysts will publish takes',
                    'Social media amplification expected'
                ]
            });
        });
        return patterns;
    }
    async assessStakeholderImpact(analyses, patterns) {
        // Assess impact on each stakeholder group
        return {
            customers: this.assessCustomerImpact(analyses, patterns),
            investors: this.assessInvestorImpact(analyses, patterns),
            media: this.assessMediaImpact(analyses, patterns),
            employees: this.assessEmployeeImpact(analyses, patterns),
            partners: this.assessPartnerImpact(analyses, patterns),
            regulators: this.assessRegulatoryImpact(analyses, patterns)
        };
    }
    assessCustomerImpact(analyses, patterns) {
        const highMagnitudeCount = analyses.filter(a => a.magnitude === 'high' || a.magnitude === 'critical').length;
        return {
            perception_shift: highMagnitudeCount > 2 ? 'Questioning our market position' : 'Stable but watching',
            concern_level: highMagnitudeCount > 3 ? 'high' : highMagnitudeCount > 1 ? 'medium' : 'low',
            likely_questions: [
                'How does this affect our product roadmap?',
                'Are you still the right choice for us?',
                'What are you doing to stay competitive?'
            ],
            messaging_needs: [
                'Reassurance about continued innovation',
                'Proof of customer success',
                'Clear differentiation from competitors'
            ],
            proof_points_required: [
                'Recent customer wins',
                'Product roadmap highlights',
                'ROI metrics'
            ]
        };
    }
    assessInvestorImpact(analyses, patterns) {
        const competitiveThreats = patterns.filter(p => p.type === 'competitive_acceleration').length;
        return {
            perception_shift: competitiveThreats > 0 ? 'Concerned about competitive position' : 'Monitoring market dynamics',
            concern_level: competitiveThreats > 1 ? 'high' : 'medium',
            likely_questions: [
                "What's your competitive moat?",
                'How are you responding to market changes?',
                'What investments are you making?'
            ],
            messaging_needs: [
                'Clear strategic vision',
                'Competitive advantages',
                'Growth trajectory'
            ],
            proof_points_required: [
                'Market share data',
                'Financial performance',
                'Strategic partnerships'
            ]
        };
    }
    assessMediaImpact(analyses, patterns) {
        const narrativeShifts = patterns.filter(p => p.type === 'narrative_shift').length;
        return {
            perception_shift: narrativeShifts > 0 ? 'Looking for fresh angles' : 'Following established narratives',
            concern_level: 'medium',
            likely_questions: [
                "What's your take on [trending topic]?",
                'How are you different from competitors?',
                "What's next for your industry?"
            ],
            messaging_needs: [
                'Thought leadership positioning',
                'Unique perspective on trends',
                'Executive availability for comment'
            ],
            proof_points_required: [
                'Data and research',
                'Customer stories',
                'Expert commentary'
            ]
        };
    }
    assessEmployeeImpact(analyses, patterns) {
        const competitiveThreats = analyses.filter(a => a.signal.toLowerCase().includes('competitor')).length;
        return {
            perception_shift: competitiveThreats > 2 ? 'Worried about company direction' : 'Confident in leadership',
            concern_level: competitiveThreats > 3 ? 'high' : 'low',
            likely_questions: [
                'How are we responding to competition?',
                'Is my job secure?',
                "What's our strategy?"
            ],
            messaging_needs: [
                'Clear internal communication',
                'Leadership visibility',
                'Rally the troops messaging'
            ],
            proof_points_required: [
                'Strategic plan',
                'Investment in employees',
                'Company strengths'
            ]
        };
    }
    assessPartnerImpact(analyses, patterns) {
        return {
            perception_shift: 'Evaluating partnership value',
            concern_level: 'low',
            likely_questions: [
                'How does this affect our partnership?',
                'Are you still a strategic partner?'
            ],
            messaging_needs: [
                'Partnership value prop',
                'Continued commitment'
            ],
            proof_points_required: [
                'Partnership success metrics',
                'Joint roadmap'
            ]
        };
    }
    assessRegulatoryImpact(analyses, patterns) {
        return {
            perception_shift: 'Monitoring for compliance',
            concern_level: 'low',
            likely_questions: [
                'Are you compliant with new regulations?',
                'What measures are you taking?'
            ],
            messaging_needs: [
                'Compliance commitment',
                'Proactive measures'
            ],
            proof_points_required: [
                'Compliance certifications',
                'Audit results'
            ]
        };
    }
    async deriveStrategicImplications(analyses, patterns, stakeholderImpact) {
        return {
            reputation: {
                current_state: this.assessReputationState(analyses, stakeholderImpact),
                trajectory: this.assessReputationTrajectory(analyses, patterns),
                intervention_required: this.assessInterventionNeed(analyses, patterns),
                key_vulnerabilities: this.identifyVulnerabilities(analyses, patterns)
            },
            competitive_position: {
                relative_strength: this.assessCompetitiveStrength(analyses, patterns),
                momentum: this.assessCompetitiveMomentum(analyses, patterns),
                defendable_advantages: this.identifyAdvantages(analyses),
                exposed_flanks: this.identifyExposedFlanks(analyses, patterns)
            },
            market_narrative: {
                we_control: this.identifyControlledNarratives(analyses),
                they_control: this.identifyCompetitorNarratives(analyses),
                contested_ground: this.identifyContestedNarratives(analyses),
                narrative_opportunities: this.identifyNarrativeOpportunities(patterns)
            }
        };
    }
    assessReputationState(analyses, stakeholder) {
        const highConcern = Object.values(stakeholder).filter(s => s.concern_level === 'high').length;
        if (highConcern >= 3)
            return 'Under pressure from multiple stakeholders';
        if (highConcern >= 1)
            return 'Localized reputation challenges';
        return 'Generally positive reputation';
    }
    assessReputationTrajectory(analyses, patterns) {
        const criticalSignals = analyses.filter(a => a.magnitude === 'critical').length;
        if (criticalSignals > 0)
            return 'crisis';
        const highVelocity = analyses.filter(a => a.velocity === 'viral' || a.velocity === 'fast').length;
        if (highVelocity > 3)
            return 'declining';
        const cascadeRisks = patterns.filter(p => p.type === 'cascade_risk').length;
        if (cascadeRisks > 2)
            return 'declining';
        return 'stable';
    }
    assessInterventionNeed(analyses, patterns) {
        const criticalCount = analyses.filter(a => a.magnitude === 'critical').length;
        if (criticalCount > 0)
            return 'urgent';
        const highCount = analyses.filter(a => a.magnitude === 'high').length;
        if (highCount > 2)
            return 'respond';
        if (highCount > 0)
            return 'monitor';
        return 'none';
    }
    identifyVulnerabilities(analyses, patterns) {
        const vulnerabilities = [];
        if (patterns.some(p => p.type === 'competitive_acceleration')) {
            vulnerabilities.push('Falling behind competitive innovation cycle');
        }
        if (patterns.some(p => p.type === 'narrative_shift')) {
            vulnerabilities.push('Not part of emerging industry conversation');
        }
        if (analyses.some(a => a.relevance > 80 && a.magnitude === 'high')) {
            vulnerabilities.push('Direct competitive threat to core business');
        }
        return vulnerabilities;
    }
    assessCompetitiveStrength(analyses, patterns) {
        const competitorMentions = analyses.filter(a => a.signal.includes('competitor')).length;
        const ourMentions = analyses.filter(a => a.relevance > 90).length;
        if (ourMentions > competitorMentions * 2)
            return 'leader';
        if (ourMentions > competitorMentions)
            return 'challenger';
        if (competitorMentions > ourMentions * 2)
            return 'at_risk';
        return 'follower';
    }
    assessCompetitiveMomentum(analyses, patterns) {
        const recentHighImpact = analyses.filter(a => a.magnitude === 'high' && a.velocity === 'fast').length;
        if (recentHighImpact > 3)
            return 'losing';
        if (recentHighImpact > 1)
            return 'maintaining';
        return 'gaining';
    }
    identifyAdvantages(analyses) {
        // These would be pulled from organization profile
        return [
            'Established customer base',
            'Strong brand recognition',
            'Technical expertise'
        ];
    }
    identifyExposedFlanks(analyses, patterns) {
        const flanks = [];
        if (patterns.some(p => p.type === 'competitive_acceleration')) {
            flanks.push('Innovation speed');
        }
        if (analyses.some(a => a.signal.includes('pricing') || a.signal.includes('cost'))) {
            flanks.push('Pricing competitiveness');
        }
        return flanks;
    }
    identifyControlledNarratives(analyses) {
        return ['Customer success stories', 'Company culture', 'Leadership vision'];
    }
    identifyCompetitorNarratives(analyses) {
        return analyses
            .filter(a => a.signal.toLowerCase().includes('competitor'))
            .map(a => a.signal)
            .slice(0, 3);
    }
    identifyContestedNarratives(analyses) {
        return ['Market leadership', 'Innovation pace', 'Customer satisfaction'];
    }
    identifyNarrativeOpportunities(patterns) {
        return patterns
            .filter(p => p.type === 'narrative_shift')
            .map(p => `Lead conversation on: ${p.insight}`);
    }
    async developResponseStrategy(implications, stakeholder) {
        const urgency = implications.reputation.intervention_required;
        return {
            immediate_24h: this.createActionPlan('immediate', urgency, implications, stakeholder),
            short_term_7d: this.createActionPlan('short', urgency, implications, stakeholder),
            medium_term_30d: this.createActionPlan('medium', urgency, implications, stakeholder),
            long_term_90d: this.createActionPlan('long', urgency, implications, stakeholder)
        };
    }
    createActionPlan(timeframe, urgency, implications, stakeholder) {
        const priority = urgency === 'urgent' ? 'critical' :
            urgency === 'respond' ? 'high' :
                urgency === 'monitor' ? 'medium' : 'low';
        const plans = {
            immediate: {
                priority: priority,
                actions: [
                    'Executive team briefing',
                    'Prepare holding statement',
                    'Monitor social media',
                    'Alert PR team'
                ],
                messaging: [
                    'We are aware and monitoring',
                    'Customer success remains our priority',
                    'More information coming soon'
                ],
                channels: ['Internal comms', 'Social media monitoring', 'Customer service'],
                success_metrics: ['Response time < 2 hours', 'No negative viral spread', 'Customer inquiries addressed']
            },
            short: {
                priority: (priority === 'critical' ? 'high' : priority),
                actions: [
                    'Develop comprehensive response',
                    'Media outreach',
                    'Customer communication',
                    'Employee town hall'
                ],
                messaging: [
                    'Our position and differentiation',
                    'Customer value proposition',
                    'Future vision and roadmap'
                ],
                channels: ['Press release', 'Blog post', 'Customer email', 'All hands meeting'],
                success_metrics: ['Media coverage tone', 'Customer retention', 'Employee sentiment']
            },
            medium: {
                priority: 'medium',
                actions: [
                    'Thought leadership campaign',
                    'Customer success showcase',
                    'Analyst briefings',
                    'Partnership announcements'
                ],
                messaging: [
                    'Industry leadership position',
                    'Innovation and vision',
                    'Customer outcomes'
                ],
                channels: ['Tier 1 media', 'Industry events', 'Analyst relations', 'Content marketing'],
                success_metrics: ['Share of voice', 'Message penetration', 'Lead generation']
            },
            long: {
                priority: 'low',
                actions: [
                    'Strategic narrative development',
                    'Executive visibility program',
                    'Industry positioning',
                    'Awards and recognition'
                ],
                messaging: [
                    'Category definition',
                    'Vision for industry',
                    'Transformational outcomes'
                ],
                channels: ['Speaking engagements', 'Op-eds', 'Podcasts', 'Industry reports'],
                success_metrics: ['Brand perception', 'Market position', 'Thought leadership score']
            }
        };
        return plans[timeframe] || plans.immediate;
    }
    async generateEliteInsights(signals, patterns, implications) {
        // This is where the magic happens - finding non-obvious insights
        return {
            hidden_connections: this.findHiddenConnections(signals, patterns),
            non_obvious_risks: this.identifyNonObviousRisks(signals, patterns, implications),
            asymmetric_opportunities: this.findAsymmetricOpportunities(signals, patterns),
            narrative_leverage_points: this.identifyLeveragePoints(patterns, implications),
            strategic_blindspots: this.identifyBlindspots(signals, patterns, implications)
        };
    }
    findHiddenConnections(signals, patterns) {
        const connections = [];
        // Look for timing correlations
        const simultaneousEvents = this.findSimultaneousEvents(signals);
        if (simultaneousEvents.length > 0) {
            connections.push(`Coordinated competitive moves suggest industry collusion or shared intel`);
        }
        // Look for inverse correlations
        const inversePatterns = this.findInversePatterns(signals);
        if (inversePatterns.length > 0) {
            connections.push(`While competitors focus on ${inversePatterns[0]}, opportunity exists in neglected areas`);
        }
        // Look for supply chain impacts
        if (signals.some(s => s.title.includes('supply')) && signals.some(s => s.title.includes('pricing'))) {
            connections.push('Supply chain signals predict pricing pressure in 30-60 days');
        }
        return connections;
    }
    findSimultaneousEvents(signals) {
        // Group signals by time window
        const timeGroups = new Map();
        signals.forEach(signal => {
            if (signal.published) {
                const hour = new Date(signal.published).toISOString().slice(0, 13);
                const group = timeGroups.get(hour) || [];
                group.push(signal);
                timeGroups.set(hour, group);
            }
        });
        // Find groups with multiple signals
        const simultaneous = [];
        timeGroups.forEach((group, time) => {
            if (group.length > 2) {
                simultaneous.push(...group);
            }
        });
        return simultaneous;
    }
    findInversePatterns(signals) {
        // Look for what competitors are NOT doing
        const competitorFocus = signals
            .filter(s => s.entity_type === 'competitor')
            .map(s => this.extractTopic(s));
        const allTopics = ['AI', 'sustainability', 'privacy', 'customer experience', 'pricing'];
        const neglected = allTopics.filter(topic => !competitorFocus.some(focus => focus.includes(topic)));
        return neglected;
    }
    extractTopic(signal) {
        const text = (signal.title + ' ' + signal.content).toLowerCase();
        const topics = ['AI', 'sustainability', 'privacy', 'security', 'pricing', 'customer'];
        for (const topic of topics) {
            if (text.includes(topic.toLowerCase()))
                return topic;
        }
        return 'general';
    }
    identifyNonObviousRisks(signals, patterns, implications) {
        const risks = [];
        // Second-order effects
        if (patterns.some(p => p.type === 'competitive_acceleration')) {
            risks.push('Talent poaching likely as competitors scale - protect key employees now');
        }
        // Narrative hijacking
        if (implications.market_narrative.contested_ground.length > 2) {
            risks.push('Vulnerable to narrative hijacking - one misstep could flip the story');
        }
        // Coalition forming
        const competitorCount = signals.filter(s => s.entity_type === 'competitor').length;
        if (competitorCount > 3) {
            risks.push('Competitors may form coalition against market leader');
        }
        return risks;
    }
    findAsymmetricOpportunities(signals, patterns) {
        const opportunities = [];
        // Counter-narrative opportunities
        if (patterns.some(p => p.type === 'narrative_shift')) {
            opportunities.push('While everyone zigs on trendy topic, zag with contrarian but credible position');
        }
        // Speed arbitrage
        const slowMovers = signals.filter(s => s.entity_type === 'competitor' && !s.title.includes('announces'));
        if (slowMovers.length > 0) {
            opportunities.push('Competitors telegraphing moves - fast execution can capture position before they act');
        }
        // Alliance opportunities
        const commonEnemies = this.identifyCommonThreats(signals);
        if (commonEnemies.length > 0) {
            opportunities.push(`Form unexpected alliance against common threat: ${commonEnemies[0]}`);
        }
        return opportunities;
    }
    identifyCommonThreats(signals) {
        // Look for threats that affect multiple players
        const threats = signals
            .filter(s => s.title.includes('regulation') || s.title.includes('disruption'))
            .map(s => s.title);
        return [...new Set(threats)];
    }
    identifyLeveragePoints(patterns, implications) {
        const leveragePoints = [];
        // Narrative voids
        implications.market_narrative.narrative_opportunities.forEach(opp => {
            leveragePoints.push(`Narrative void: ${opp} - first credible voice wins`);
        });
        // Cascade triggers
        patterns.filter(p => p.type === 'cascade_risk').forEach(cascade => {
            leveragePoints.push(`Pre-position for cascade: ${cascade.insight}`);
        });
        // Trust arbitrage
        if (implications.competitive_position.relative_strength === 'leader') {
            leveragePoints.push('Use market leader position to set industry standards');
        }
        return leveragePoints;
    }
    identifyBlindspots(signals, patterns, implications) {
        const blindspots = [];
        // Geographic blindness
        const geoMentions = signals.filter(s => s.title.includes('Asia') || s.title.includes('Europe') || s.title.includes('America'));
        if (geoMentions.length === 0) {
            blindspots.push('No geographic diversity in intelligence - missing regional threats/opportunities');
        }
        // Stakeholder blindness
        const stakeholderTypes = new Set(signals.map(s => s.entity_type).filter(Boolean));
        if (stakeholderTypes.size < 3) {
            blindspots.push('Limited stakeholder coverage - missing signals from key audiences');
        }
        // Time horizon blindness
        const futureMentions = signals.filter(s => s.title.includes('2025') || s.title.includes('2026') || s.title.includes('future'));
        if (futureMentions.length === 0) {
            blindspots.push('All signals are present-focused - missing long-term strategic shifts');
        }
        return blindspots;
    }
}
export default PRAnalyst;
//# sourceMappingURL=pr-analyst.js.map