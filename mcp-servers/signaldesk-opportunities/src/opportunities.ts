// Core opportunity discovery functions
// These can be used by both MCP mode and API mode

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

// Opportunity type definitions matching your 7 types
const OPPORTUNITY_TYPES = {
  TRENDING: 'trending',
  NEWS_HOOK: 'news_hook',
  COMPETITOR_GAP: 'competitor_gap',
  JOURNALIST_INTEREST: 'journalist_interest',
  EDITORIAL_CALENDAR: 'editorial_calendar',
  AWARD: 'award',
  SPEAKING: 'speaking'
};

export async function discoverOpportunities(params: OpportunityParams): Promise<Opportunity[]> {
  const { industry = 'technology', keywords = [], limit = 10 } = params;
  
  console.log(`🔍 Discovering opportunities for ${industry} with keywords: ${keywords.join(', ')}`);
  
  // For now, return mock opportunities
  // In production, this would connect to real data sources
  const opportunities: Opportunity[] = [
    {
      id: `opp-${Date.now()}-1`,
      type: OPPORTUNITY_TYPES.TRENDING,
      title: "AI Ethics Discussion Trending in Tech Media",
      description: "Major publications covering AI ethics - opportunity for thought leadership",
      score: 85,
      urgency: "high",
      source: "Media monitoring",
      timestamp: new Date().toISOString()
    },
    {
      id: `opp-${Date.now()}-2`,
      type: OPPORTUNITY_TYPES.NEWS_HOOK,
      title: "Industry Report Release Tomorrow",
      description: "Gartner releasing annual report - chance for expert commentary",
      score: 78,
      urgency: "critical",
      source: "Industry calendar",
      timestamp: new Date().toISOString()
    },
    {
      id: `opp-${Date.now()}-3`,
      type: OPPORTUNITY_TYPES.COMPETITOR_GAP,
      title: "Competitor Facing Criticism",
      description: "Main competitor has data breach - opportunity to highlight security",
      score: 82,
      urgency: "high",
      source: "Competitive intelligence",
      timestamp: new Date().toISOString()
    },
    {
      id: `opp-${Date.now()}-4`,
      type: OPPORTUNITY_TYPES.JOURNALIST_INTEREST,
      title: "WSJ Reporter Seeking Sources",
      description: "Tech reporter looking for AI experts for upcoming feature",
      score: 75,
      urgency: "medium",
      source: "Journalist monitoring",
      timestamp: new Date().toISOString()
    },
    {
      id: `opp-${Date.now()}-5`,
      type: OPPORTUNITY_TYPES.SPEAKING,
      title: "Tech Conference Panel Opening",
      description: "Last-minute panel slot available at major conference",
      score: 70,
      urgency: "high",
      source: "Event monitoring",
      timestamp: new Date().toISOString()
    }
  ];
  
  // Filter by keywords if provided
  let filtered = opportunities;
  if (keywords.length > 0) {
    filtered = opportunities.filter(opp => {
      const text = `${opp.title} ${opp.description}`.toLowerCase();
      return keywords.some(keyword => text.includes(keyword.toLowerCase()));
    });
  }
  
  // Apply limit
  return filtered.slice(0, limit);
}

export async function analyzeOpportunity(params: { opportunity_id: string }): Promise<any> {
  console.log(`📊 Analyzing opportunity: ${params.opportunity_id}`);
  
  return {
    opportunity_id: params.opportunity_id,
    analysis: {
      relevance_score: 85,
      effort_required: "medium",
      potential_reach: "high",
      recommended_actions: [
        "Prepare expert commentary",
        "Draft press release",
        "Identify spokesperson",
        "Create supporting materials"
      ],
      time_sensitivity: "Act within 24 hours",
      success_probability: 0.75
    }
  };
}

export async function createOpportunity(params: any): Promise<any> {
  console.log(`✨ Creating custom opportunity`);
  
  return {
    id: `opp-custom-${Date.now()}`,
    ...params,
    created_at: new Date().toISOString(),
    status: "pending"
  };
}