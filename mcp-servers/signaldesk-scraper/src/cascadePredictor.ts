// Stable Cascade Intelligence Implementation
// Works without external dependencies for maximum stability

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

export class CascadePredictor {
  private cascadePatterns: Record<string, CascadePattern>;

  constructor() {
    // Predefined cascade patterns based on historical data
    this.cascadePatterns = {
      'regulatory_change': {
        primary: 'New regulation announced',
        firstOrder: [
          { effect: 'Competitors scramble to comply', probability: 0.9, timing: '1-3 days' },
          { effect: 'Media seeks expert commentary', probability: 0.85, timing: '24 hours' },
          { effect: 'Stock market reaction', probability: 0.7, timing: '4 hours' }
        ],
        secondOrder: [
          { effect: 'Other jurisdictions follow', probability: 0.6, timing: '1-2 weeks' },
          { effect: 'Industry associations respond', probability: 0.8, timing: '3-5 days' },
          { effect: 'Customer concerns arise', probability: 0.5, timing: '1 week' }
        ],
        thirdOrder: [
          { effect: 'Business model changes', probability: 0.4, timing: '1-3 months' },
          { effect: 'New market entrants', probability: 0.3, timing: '3-6 months' },
          { effect: 'Industry consolidation', probability: 0.25, timing: '6-12 months' }
        ]
      },
      
      'competitor_crisis': {
        primary: 'Major competitor faces crisis',
        firstOrder: [
          { effect: 'Customers seek alternatives', probability: 0.8, timing: '24-48 hours' },
          { effect: 'Media compares to other players', probability: 0.9, timing: '6-12 hours' },
          { effect: 'Investor confidence shifts', probability: 0.7, timing: '1-2 days' }
        ],
        secondOrder: [
          { effect: 'Market share redistribution', probability: 0.6, timing: '1-4 weeks' },
          { effect: 'Regulatory scrutiny increases', probability: 0.5, timing: '1-2 weeks' },
          { effect: 'Partnership opportunities emerge', probability: 0.4, timing: '2-3 weeks' }
        ],
        thirdOrder: [
          { effect: 'Industry practices change', probability: 0.3, timing: '2-6 months' },
          { effect: 'New regulations proposed', probability: 0.35, timing: '3-6 months' },
          { effect: 'Market structure shifts', probability: 0.25, timing: '6-12 months' }
        ]
      },
      
      'technology_breakthrough': {
        primary: 'Major tech breakthrough announced',
        firstOrder: [
          { effect: 'Competitors rush to respond', probability: 0.95, timing: '24 hours' },
          { effect: 'VC funding flows shift', probability: 0.7, timing: '1 week' },
          { effect: 'Talent war intensifies', probability: 0.8, timing: '2-4 weeks' }
        ],
        secondOrder: [
          { effect: 'Adjacent industries affected', probability: 0.6, timing: '1-2 months' },
          { effect: 'Consumer expectations change', probability: 0.7, timing: '2-3 months' },
          { effect: 'Supply chain adjustments', probability: 0.5, timing: '3-6 months' }
        ],
        thirdOrder: [
          { effect: 'Economic sector transformation', probability: 0.4, timing: '6-12 months' },
          { effect: 'Educational curriculum updates', probability: 0.3, timing: '1-2 years' },
          { effect: 'Societal behavior shifts', probability: 0.35, timing: '1-3 years' }
        ]
      },
      
      'supply_chain_disruption': {
        primary: 'Major supply chain disruption',
        firstOrder: [
          { effect: 'Direct competitors affected', probability: 0.8, timing: '24 hours' },
          { effect: 'Prices fluctuate', probability: 0.9, timing: '1-3 days' },
          { effect: 'Alternative suppliers sought', probability: 0.85, timing: '48 hours' }
        ],
        secondOrder: [
          { effect: 'Consumer behavior changes', probability: 0.6, timing: '1-2 weeks' },
          { effect: 'Geographic market shifts', probability: 0.5, timing: '2-4 weeks' },
          { effect: 'Innovation acceleration', probability: 0.4, timing: '1-3 months' }
        ],
        thirdOrder: [
          { effect: 'Supply chain restructuring', probability: 0.7, timing: '3-6 months' },
          { effect: 'Geopolitical implications', probability: 0.3, timing: '6-12 months' },
          { effect: 'Industry resilience standards', probability: 0.4, timing: '1-2 years' }
        ]
      },
      
      'data_breach': {
        primary: 'Major data breach disclosed',
        firstOrder: [
          { effect: 'Regulatory investigation', probability: 0.95, timing: '24 hours' },
          { effect: 'Customer trust erosion', probability: 0.8, timing: '1-3 days' },
          { effect: 'Competitor positioning', probability: 0.7, timing: '24-48 hours' }
        ],
        secondOrder: [
          { effect: 'Class action lawsuits', probability: 0.6, timing: '1-2 weeks' },
          { effect: 'Industry-wide scrutiny', probability: 0.7, timing: '1 week' },
          { effect: 'Security spending surge', probability: 0.8, timing: '2-4 weeks' }
        ],
        thirdOrder: [
          { effect: 'New privacy regulations', probability: 0.5, timing: '3-6 months' },
          { effect: 'Business model changes', probability: 0.4, timing: '6-12 months' },
          { effect: 'Consumer behavior shift', probability: 0.6, timing: '6-12 months' }
        ]
      }
    };
  }
  
  predictCascade(eventType: string, eventDetails: EventDetails = {}): CascadePrediction {
    const pattern = this.cascadePatterns[eventType];
    if (!pattern) {
      return this.genericCascadePrediction(eventDetails);
    }
    
    // Calculate opportunities based on cascade effects
    const opportunities = this.identifyOpportunities(pattern, eventDetails);
    
    return {
      eventType,
      prediction: pattern,
      opportunities,
      confidence: this.calculateConfidence(pattern, eventDetails),
      timestamp: new Date().toISOString()
    };
  }
  
  private identifyOpportunities(pattern: CascadePattern, eventDetails: EventDetails): Opportunity[] {
    const opportunities: Opportunity[] = [];
    
    // Immediate opportunities (from first-order effects)
    pattern.firstOrder.forEach(effect => {
      if (effect.probability > 0.7) {
        opportunities.push({
          timing: 'immediate',
          window: effect.timing,
          action: this.getOpportunityAction(effect.effect),
          confidence: effect.probability,
          priority: 'high'
        });
      }
    });
    
    // Strategic opportunities (from second-order effects)
    pattern.secondOrder.forEach(effect => {
      if (effect.probability > 0.5) {
        opportunities.push({
          timing: 'near-term',
          window: effect.timing,
          action: this.getOpportunityAction(effect.effect),
          confidence: effect.probability,
          priority: 'medium'
        });
      }
    });
    
    // Long-term positioning (from third-order effects)
    pattern.thirdOrder.forEach(effect => {
      if (effect.probability > 0.3) {
        opportunities.push({
          timing: 'long-term',
          window: effect.timing,
          action: this.getOpportunityAction(effect.effect),
          confidence: effect.probability,
          priority: 'low'
        });
      }
    });
    
    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }
  
  private getOpportunityAction(effect: string): string {
    const actionMap: Record<string, string> = {
      'Competitors scramble to comply': 'Position as already compliant',
      'Media seeks expert commentary': 'Offer executive as expert source',
      'Stock market reaction': 'Investor relations opportunity',
      'Other jurisdictions follow': 'Proactive multi-market strategy',
      'Customers seek alternatives': 'Aggressive customer acquisition',
      'Market share redistribution': 'Capture competitor defectors',
      'Regulatory scrutiny increases': 'Lead on best practices',
      'Competitors rush to respond': 'Emphasize first-mover advantage',
      'VC funding flows shift': 'Fundraising opportunity window',
      'Direct competitors affected': 'Highlight operational resilience',
      'Prices fluctuate': 'Price stability messaging',
      'Regulatory investigation': 'Proactive transparency',
      'Customer trust erosion': 'Trust-building campaign',
      'Class action lawsuits': 'Legal preparedness messaging'
    };
    
    return actionMap[effect] || 'Monitor and assess opportunity';
  }
  
  private calculateConfidence(pattern: CascadePattern, eventDetails: EventDetails): number {
    // Base confidence on pattern reliability
    let confidence = 0.7;
    
    // Adjust based on event specifics
    if (eventDetails.source === 'official') confidence += 0.1;
    if (eventDetails.magnitude === 'major') confidence += 0.1;
    if (eventDetails.geographic === 'global') confidence += 0.05;
    
    return Math.min(confidence, 0.95);
  }
  
  private genericCascadePrediction(eventDetails: EventDetails): CascadePrediction {
    // Fallback for unknown event types
    return {
      eventType: 'unknown',
      prediction: {
        primary: eventDetails.description || 'Unknown event',
        firstOrder: [
          { effect: 'Market attention shifts', probability: 0.6, timing: '24-48 hours' },
          { effect: 'Competitors monitor situation', probability: 0.7, timing: '1-3 days' }
        ],
        secondOrder: [
          { effect: 'Strategic adjustments considered', probability: 0.4, timing: '1-2 weeks' }
        ],
        thirdOrder: [
          { effect: 'Long-term implications emerge', probability: 0.3, timing: '1-3 months' }
        ]
      },
      opportunities: [
        {
          timing: 'immediate',
          window: '24-48 hours',
          action: 'Monitor and assess situation',
          confidence: 0.5,
          priority: 'medium'
        }
      ],
      confidence: 0.5,
      timestamp: new Date().toISOString()
    };
  }
  
  // Helper function to detect event type from text
  detectEventType(newsEvent: { text?: string; description?: string }): string {
    const text = (newsEvent.text || newsEvent.description || '').toLowerCase();
    
    if (text.includes('regulation') || text.includes('law') || text.includes('compliance')) {
      return 'regulatory_change';
    }
    if (text.includes('breach') || text.includes('hack') || text.includes('leak')) {
      return 'data_breach';
    }
    if (text.includes('crisis') || text.includes('scandal') || text.includes('lawsuit')) {
      return 'competitor_crisis';
    }
    if (text.includes('breakthrough') || text.includes('innovation') || text.includes('launches')) {
      return 'technology_breakthrough';
    }
    if (text.includes('supply') || text.includes('shortage') || text.includes('disruption')) {
      return 'supply_chain_disruption';
    }
    
    return 'unknown';
  }
}