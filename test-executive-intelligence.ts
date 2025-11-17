// Standalone test of createExecutiveIntelligenceSummary function
const ANTHROPIC_API_KEY = 'test-key';

async function createExecutiveIntelligenceSummary(
  events: any[],
  entities: any[],
  profile: any,
  orgName: string,
  companyProfile: any,
  articles: any[]
) {
  if (!ANTHROPIC_API_KEY || events.length === 0) {
    console.log('Skipped');
    return null;
  }

  try {
    console.log(`Analyzing ${events.length} events and ${entities.length} entities`);

    // Extract organizational context
    const businessModel = companyProfile?.business_model || 'Not specified';
    const productLines = companyProfile?.product_lines?.join(', ') || 'Not specified';
    const keyMarkets = companyProfile?.key_markets?.join(', ') || 'Not specified';
    const strategicGoals = companyProfile?.strategic_goals?.map((g: any) => `${g.goal} (${g.timeframe}, ${g.priority} priority)`).join('; ') || 'Not specified';

    // Get intelligence targets
    const competitors = [
      ...(profile?.competition?.direct_competitors || []),
      ...(profile?.competition?.indirect_competitors || []),
      ...(profile?.competition?.emerging_threats || [])
    ].filter(Boolean).slice(0, 30);

    const stakeholders = [
      ...(profile?.stakeholders?.regulators || []),
      ...(profile?.stakeholders?.key_analysts || []),
      ...(profile?.stakeholders?.activists || []),
      ...(profile?.stakeholders?.major_investors || [])
    ].filter(Boolean).slice(0, 30);

    // Categorize events by recency
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayEvents = events.filter((e: any) => e.date && e.date >= todayStr);
    const thisWeekEvents = events.filter((e: any) => e.date && e.date >= weekAgo && e.date < todayStr);
    const olderEvents = events.filter((e: any) => !e.date || e.date < weekAgo);

    // Categorize events by type
    const competitorEvents = events.filter((e: any) =>
      e.category === 'competitive' ||
      e.type === 'competitor_move' ||
      competitors.some((c: string) => e.entity?.toLowerCase().includes(c.toLowerCase()))
    );

    const regulatoryEvents = events.filter((e: any) =>
      e.category === 'regulatory' ||
      e.type === 'regulatory' ||
      stakeholders.some((s: string) => e.entity?.toLowerCase().includes(s.toLowerCase()))
    );

    const marketEvents = events.filter((e: any) =>
      e.category === 'market' ||
      e.type === 'market_trend'
    );

    // Get competitor coverage
    const competitorsCovered = new Set();
    events.forEach((e: any) => {
      competitors.forEach((c: string) => {
        if (e.entity?.toLowerCase().includes(c.toLowerCase()) || e.description?.toLowerCase().includes(c.toLowerCase())) {
          competitorsCovered.add(c);
        }
      });
    });

    const stakeholdersCovered = new Set();
    events.forEach((e: any) => {
      stakeholders.forEach((s: string) => {
        if (e.entity?.toLowerCase().includes(s.toLowerCase()) || e.description?.toLowerCase().includes(s.toLowerCase())) {
          stakeholdersCovered.add(s);
        }
      });
    });

    // Prepare events summary for Claude (top 50 most recent/relevant)
    const sortedEvents = [
      ...todayEvents.slice(0, 20),
      ...thisWeekEvents.slice(0, 20),
      ...olderEvents.slice(0, 10)
    ];

    const eventsSummary = sortedEvents.map((e: any, idx: number) => {
      const dateLabel = e.date >= todayStr ? 'TODAY' : e.date >= weekAgo ? 'THIS WEEK' : 'OLDER';
      return `[${idx}] [${dateLabel}] ${e.entity || 'Unknown'}: ${e.description || e.title || 'No description'}`;
    }).join('\n');

    // Prepare entities summary (top 30 by mentions)
    const sortedEntities = [...entities]
      .sort((a: any, b: any) => (b.mentions?.length || 0) - (a.mentions?.length || 0))
      .slice(0, 30);

    const entitiesSummary = sortedEntities.map((e: any, idx: number) => {
      return `[${idx}] ${e.name} (${e.type || 'unknown type'}, ${e.mentions?.length || 0} mentions)`;
    }).join('\n');

    const compCount = Array.from(competitorsCovered).length;
    const totalComp = competitors.length;
    const stakCount = Array.from(stakeholdersCovered).length;
    const totalStake = stakeholders.length;
    const todayCount = todayEvents.length;
    const weekCount = thisWeekEvents.length;
    const olderCount = olderEvents.length;

    const prompt = `You are creating a DAILY EXECUTIVE INTELLIGENCE BRIEF for ${orgName}'s leadership team.

ORGANIZATIONAL CONTEXT:
Company: ${orgName}
Business Model: ${businessModel}
Product Lines: ${productLines}
Key Markets: ${keyMarkets}
Strategic Goals: ${strategicGoals}

INTELLIGENCE TARGETS:
Competitors (${competitors.length}): ${competitors.slice(0, 15).join(', ')}
Stakeholders (${stakeholders.length}): ${stakeholders.slice(0, 15).join(', ')}

---

DATA ANALYZED:
- Total Events: ${events.length}
- Events TODAY: ${todayEvents.length}
- Events THIS WEEK: ${thisWeekEvents.length}
- Older Events: ${olderEvents.length}
- Competitor Events: ${competitorEvents.length}
- Regulatory Events: ${regulatoryEvents.length}
- Market Events: ${marketEvents.length}
- Competitors Covered: ${Array.from(competitorsCovered).join(', ') || 'None'}
- Stakeholders Covered: ${Array.from(stakeholdersCovered).join(', ') || 'None'}

EVENTS TO ANALYZE (most recent first):
${eventsSummary}

KEY ENTITIES MENTIONED:
${entitiesSummary}

---

YOUR TASK:
Create a structured executive intelligence brief that synthesis can use to write the daily report.

CRITICAL REQUIREMENTS:
1. SYSTEMATICALLY COVER ALL COMPETITORS MENTIONED - no cherry-picking
2. PRIORITIZE RECENT NEWS - Today > This week > Older
3. BE SPECIFIC - "Glencore did X on [date]" not vague trends
4. ACTIONABLE - What should ${orgName} executives know for business decisions?

Extract intelligence in EXACT JSON format:

{
  "top_competitor_moves": [
    {
      "competitor": "Company name",
      "action": "What they did (specific, actionable)",
      "date": "TODAY|THIS WEEK|OLDER",
      "significance": "high|medium|low",
      "implications": "Why this matters to the organization"
    }
  ],
  "regulatory_developments": [
    {
      "regulator": "Agency/body name",
      "development": "What happened",
      "date": "TODAY|THIS WEEK|OLDER",
      "impact": "How this affects the organization's industry"
    }
  ],
  "market_trends": [
    {
      "trend": "Trend description",
      "evidence": "Supporting data points",
      "relevance": "Why this matters to the organization"
    }
  ],
  "stakeholder_activity": [
    {
      "stakeholder": "Person/org name",
      "activity": "What they did/said",
      "date": "TODAY|THIS WEEK|OLDER",
      "significance": "Why this matters"
    }
  ],
  "key_insights": [
    "Insight 1: Actionable takeaway for executives",
    "Insight 2: Another key finding",
    "Insight 3: Strategic implication"
  ],
  "coverage_summary": {
    "competitors_mentioned": ${compCount},
    "total_competitors_tracked": ${totalComp},
    "stakeholders_mentioned": ${stakCount},
    "total_stakeholders_tracked": ${totalStake},
    "recency_breakdown": {
      "today": ${todayCount},
      "this_week": ${weekCount},
      "older": ${olderCount}
    }
  }
}

Return ONLY valid JSON. This is what synthesis will use to write the executive brief - make it USABLE and ACTIONABLE.`;

    console.log('Prompt created successfully');
    return { success: true };

  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Test
createExecutiveIntelligenceSummary(
  [{ entity: 'Test', description: 'Test event', date: '2025-01-15' }],
  [{ name: 'Test Entity', type: 'company', mentions: [] }],
  { competition: { direct_competitors: ['CompA'] }, stakeholders: { regulators: ['SEC'] } },
  'Test Org',
  { business_model: 'Trading', product_lines: ['Oil'], key_markets: ['Asia'], strategic_goals: [] },
  []
).then(r => console.log('Result:', r));
