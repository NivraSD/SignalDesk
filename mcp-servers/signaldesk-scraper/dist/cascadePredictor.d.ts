interface CascadeEffect {
    effect: string;
    probability: number;
    timing: string;
}
interface CascadePattern {
    primary: string;
    firstOrder: CascadeEffect[];
    secondOrder: CascadeEffect[];
    thirdOrder: CascadeEffect[];
}
interface Opportunity {
    timing: string;
    window: string;
    action: string;
    confidence: number;
    priority: 'high' | 'medium' | 'low';
}
interface EventDetails {
    source?: string;
    magnitude?: string;
    geographic?: string;
    description?: string;
}
interface CascadePrediction {
    eventType: string;
    prediction: CascadePattern;
    opportunities: Opportunity[];
    confidence: number;
    timestamp: string;
}
export declare class CascadePredictor {
    private cascadePatterns;
    constructor();
    predictCascade(eventType: string, eventDetails?: EventDetails): CascadePrediction;
    private identifyOpportunities;
    private getOpportunityAction;
    private calculateConfidence;
    private genericCascadePrediction;
    detectEventType(newsEvent: {
        text?: string;
        description?: string;
    }): string;
}
export {};
//# sourceMappingURL=cascadePredictor.d.ts.map