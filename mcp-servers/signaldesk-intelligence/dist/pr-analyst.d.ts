interface Signal {
    type: string;
    title: string;
    content?: string;
    source: string;
    entity?: string;
    entity_type?: string;
    url?: string;
    published?: string;
    raw?: any;
}
interface AnalysisResult {
    signal_analysis: SignalAnalysis[];
    pattern_recognition: Pattern[];
    stakeholder_impact: StakeholderMatrix;
    strategic_implications: StrategicImplications;
    response_strategy: ResponseStrategy;
    elite_insights: EliteInsights;
}
interface SignalAnalysis {
    signal: string;
    what_happened: string;
    so_what: string;
    now_what: string;
    magnitude: 'low' | 'medium' | 'high' | 'critical';
    velocity: 'slow' | 'moderate' | 'fast' | 'viral';
    credibility: number;
    relevance: number;
}
interface Pattern {
    type: string;
    signals_connected: string[];
    insight: string;
    confidence: number;
    implications: string[];
}
interface StakeholderMatrix {
    customers: StakeholderImpact;
    investors: StakeholderImpact;
    media: StakeholderImpact;
    employees: StakeholderImpact;
    partners: StakeholderImpact;
    regulators: StakeholderImpact;
}
interface StakeholderImpact {
    perception_shift: string;
    concern_level: 'low' | 'medium' | 'high' | 'critical';
    likely_questions: string[];
    messaging_needs: string[];
    proof_points_required: string[];
}
interface StrategicImplications {
    reputation: {
        current_state: string;
        trajectory: 'improving' | 'stable' | 'declining' | 'crisis';
        intervention_required: 'none' | 'monitor' | 'respond' | 'urgent';
        key_vulnerabilities: string[];
    };
    competitive_position: {
        relative_strength: 'leader' | 'challenger' | 'follower' | 'at_risk';
        momentum: 'gaining' | 'maintaining' | 'losing';
        defendable_advantages: string[];
        exposed_flanks: string[];
    };
    market_narrative: {
        we_control: string[];
        they_control: string[];
        contested_ground: string[];
        narrative_opportunities: string[];
    };
}
interface ResponseStrategy {
    immediate_24h: ActionPlan;
    short_term_7d: ActionPlan;
    medium_term_30d: ActionPlan;
    long_term_90d: ActionPlan;
}
interface ActionPlan {
    priority: 'low' | 'medium' | 'high' | 'critical';
    actions: string[];
    messaging: string[];
    channels: string[];
    success_metrics: string[];
}
interface EliteInsights {
    hidden_connections: string[];
    non_obvious_risks: string[];
    asymmetric_opportunities: string[];
    narrative_leverage_points: string[];
    strategic_blindspots: string[];
}
export declare class PRAnalyst {
    private dbClient;
    constructor();
    private initDatabase;
    analyzeSignals(signals: Signal[], organization: any): Promise<AnalysisResult>;
    private analyzeIndividualSignals;
    private deepAnalyzeSignal;
    private scoreCredibility;
    private scoreRelevance;
    private assessMagnitude;
    private assessVelocity;
    private extractFactual;
    private extractMeaning;
    private recommendAction;
    private identifyPatterns;
    private identifyTrendingTopics;
    private identifyCascadePatterns;
    private assessStakeholderImpact;
    private assessCustomerImpact;
    private assessInvestorImpact;
    private assessMediaImpact;
    private assessEmployeeImpact;
    private assessPartnerImpact;
    private assessRegulatoryImpact;
    private deriveStrategicImplications;
    private assessReputationState;
    private assessReputationTrajectory;
    private assessInterventionNeed;
    private identifyVulnerabilities;
    private assessCompetitiveStrength;
    private assessCompetitiveMomentum;
    private identifyAdvantages;
    private identifyExposedFlanks;
    private identifyControlledNarratives;
    private identifyCompetitorNarratives;
    private identifyContestedNarratives;
    private identifyNarrativeOpportunities;
    private developResponseStrategy;
    private createActionPlan;
    private generateEliteInsights;
    private findHiddenConnections;
    private findSimultaneousEvents;
    private findInversePatterns;
    private extractTopic;
    private identifyNonObviousRisks;
    private findAsymmetricOpportunities;
    private identifyCommonThreats;
    private identifyLeveragePoints;
    private identifyBlindspots;
}
export default PRAnalyst;
//# sourceMappingURL=pr-analyst.d.ts.map