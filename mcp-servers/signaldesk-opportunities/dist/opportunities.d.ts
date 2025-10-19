export interface OpportunityParams {
    industry?: string;
    keywords?: string[];
    limit?: number;
}
export interface Opportunity {
    id: string;
    type: string;
    title: string;
    description: string;
    score: number;
    urgency: string;
    source: string;
    timestamp: string;
}
export declare function discoverOpportunities(params: OpportunityParams): Promise<Opportunity[]>;
export declare function analyzeOpportunity(params: {
    opportunity_id: string;
}): Promise<any>;
export declare function createOpportunity(params: any): Promise<any>;
//# sourceMappingURL=opportunities.d.ts.map