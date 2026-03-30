/**
 * Creative Opportunity Generation Module
 * Adapted from opportunityCreativeAgent.js for Deno/Edge Functions
 */

interface CreativeContext {
  organizationName: string;
  strengths: string[];
  competitorGaps: string[];
  topicMomentum?: any[];
  industryContext: string;
  events?: any[];
}

interface CreativeOpportunity {
  title: string;
  description: string;
  score: number;
  urgency: 'high' | 'medium' | 'low';
  time_window: string;
  category: string;
  trigger_event: string;
  pattern_matched: string;
  pr_angle: string;
  creative_approach: string;
  campaign_name?: string;
  formats?: string[];
}

export class OpportunityCreativeEnhancer {
  private creativeTechniques = {
    'thought_leadership': {
      approaches: [
        'Contrarian perspective on industry assumptions',
        'Future state vision (3-5 years out)',
        'Cross-industry innovation applications',
        'Research-backed controversial insights',
        'Technology disruption implications'
      ],
      formats: [
        'Executive manifesto series',
        'Industry transformation report',
        'Innovation lab findings',
        'Future of X whitepaper series',
        'Contrarian viewpoint campaign'
      ]
    },
    'competitive_disruption': {
      approaches: [
        'Category redefinition strategy',
        'David vs Goliath narrative',
        'New metric/standard introduction',
        'Customer advocacy uprising',
        'Industry practice challenge'
      ],
      formats: [
        'Comparison campaign',
        'Customer migration program',
        'Industry benchmark study',
        'Competitive switching guide',
        'Market education initiative'
      ]
    },
    'market_creation': {
      approaches: [
        'Blue ocean strategy',
        'Problem reframing',
        'Unserved segment focus',
        'New use case development',
        'Adjacent market entry'
      ],
      formats: [
        'Category creation campaign',
        'Market education series',
        'Use case showcase',
        'Partnership ecosystem launch',
        'Innovation challenge'
      ]
    },
    'crisis_response': {
      approaches: [
        'Proactive transparency strategy',
        'Industry leadership stance',
        'Solution-focused narrative',
        'Stakeholder reassurance',
        'Competitive differentiation in crisis'
      ],
      formats: [
        'CEO statement series',
        'Customer commitment campaign',
        'Industry coalition leadership',
        'Innovation acceleration announcement',
        'Trust-building initiative'
      ]
    },
    'viral_moment': {
      approaches: [
        'Real-time newsjacking',
        'Meme-worthy positioning',
        'Cultural moment alignment',
        'Unexpected brand voice',
        'Community-driven narrative'
      ],
      formats: [
        'Social media takeover',
        'Real-time response campaign',
        'User-generated content drive',
        'Influencer collaboration',
        'Viral challenge creation'
      ]
    }
  };

  /**
   * Enhance opportunities with creative angles
   */
  async enhanceWithCreativeAngles(
    opportunities: any[],
    context: CreativeContext,
    ANTHROPIC_API_KEY: string
  ): Promise<any[]> {
    console.log(`🎨 Enhancing ${opportunities.length} opportunities with creative angles`);

    // For each opportunity, generate creative enhancements
    const enhanced = await Promise.all(
      opportunities.map(async (opp) => {
        try {
          const creative = await this.generateCreativeAngle(opp, context, ANTHROPIC_API_KEY);
          return {
            ...opp,
            creative_approach: creative.approach,
            campaign_name: creative.campaign_name,
            key_messages: creative.key_messages,
            formats: creative.formats,
            pr_angle: creative.pr_angle || opp.pr_angle
          };
        } catch (e) {
          console.error('Error enhancing opportunity:', e);
          return opp; // Return original if enhancement fails
        }
      })
    );

    return enhanced;
  }

  /**
   * Generate creative angle for a single opportunity
   */
  private async generateCreativeAngle(
    opportunity: any,
    context: CreativeContext,
    ANTHROPIC_API_KEY: string
  ): Promise<any> {
    // Determine which creative technique to use based on opportunity category
    const technique = this.selectTechnique(opportunity.category);

    const prompt = `As a creative PR strategist, enhance this opportunity with a bold creative angle:

OPPORTUNITY: ${opportunity.title}
DESCRIPTION: ${opportunity.description}
CATEGORY: ${opportunity.category}
TRIGGER: ${opportunity.trigger_event}

ORGANIZATION: ${context.organizationName}
STRENGTHS: ${context.strengths.join(', ')}

CREATIVE TECHNIQUE: ${technique}
POSSIBLE APPROACHES: ${this.creativeTechniques[technique].approaches.join(', ')}
POSSIBLE FORMATS: ${this.creativeTechniques[technique].formats.join(', ')}

Generate:
1. A provocative campaign name that will grab attention
2. A unique creative approach that differentiates from competitors
3. 3 key messages that support the narrative
4. 2-3 content formats that will maximize impact
5. An enhanced PR angle that's bold and memorable

Return as JSON:
{
  "campaign_name": "...",
  "approach": "...",
  "key_messages": ["...", "...", "..."],
  "formats": ["...", "..."],
  "pr_angle": "..."
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          temperature: 0.8, // Higher for creativity
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.content[0].text;

        // Parse JSON from response
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse creative response');
        }
      }
    } catch (e) {
      console.error('Error calling Claude for creative enhancement:', e);
    }

    // Fallback creative angle
    return {
      campaign_name: `${context.organizationName} Leadership Initiative`,
      approach: this.creativeTechniques[technique].approaches[0],
      key_messages: [
        `${context.organizationName} leads the industry response`,
        'Innovation in times of change',
        'Building trust through action'
      ],
      formats: this.creativeTechniques[technique].formats.slice(0, 2),
      pr_angle: opportunity.pr_angle
    };
  }

  /**
   * Select appropriate creative technique based on category
   */
  private selectTechnique(category: string): string {
    const mapping: Record<string, string> = {
      'COMPETITIVE': 'competitive_disruption',
      'THOUGHT_LEADERSHIP': 'thought_leadership',
      'STRATEGIC': 'market_creation',
      'DEFENSIVE': 'crisis_response',
      'VIRAL': 'viral_moment',
      'TALENT': 'thought_leadership',
      'STAKEHOLDER': 'thought_leadership'
    };

    return mapping[category] || 'thought_leadership';
  }

  /**
   * Generate completely new creative opportunities (not based on existing)
   */
  async generatePureCreativeOpportunities(
    context: CreativeContext,
    ANTHROPIC_API_KEY: string
  ): Promise<CreativeOpportunity[]> {
    console.log(`🎨 Generating pure creative opportunities for ${context.organizationName}`);

    const prompt = `As a visionary PR strategist, generate 3 breakthrough PR opportunities for ${context.organizationName}.

CONTEXT:
- Organization: ${context.organizationName}
- Industry: ${context.industryContext}
- Strengths: ${context.strengths.join(', ')}
- Competitor Gaps: ${context.competitorGaps.join(', ')}
- Recent Events: ${context.events?.slice(0, 5).map(e => e.description).join('; ')}

Generate 3 BOLD, CREATIVE PR opportunities that:
1. Challenge industry conventions
2. Create new narratives
3. Position ${context.organizationName} as an innovator
4. Are actionable within 30 days

For each opportunity, provide:
- Title: Provocative and action-oriented
- Description: Why this is a game-changer
- Campaign name: Memorable and shareable
- PR angle: The unique narrative
- Creative approach: How this breaks the mold
- Score: 70-95 based on potential impact

Return as JSON array.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          temperature: 0.9, // High creativity
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.content[0].text;

        // Parse JSON array from response
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const creative = JSON.parse(jsonMatch[0]);
            return creative.map((opp: any) => ({
              ...opp,
              urgency: 'medium',
              time_window: '30 days',
              category: 'STRATEGIC',
              trigger_event: 'Creative opportunity generation',
              pattern_matched: 'innovation',
              confidence_factors: ['Creative differentiation', 'Market gap identified']
            }));
          }
        } catch (e) {
          console.error('Failed to parse pure creative opportunities');
        }
      }
    } catch (e) {
      console.error('Error generating pure creative opportunities:', e);
    }

    return [];
  }
}

// Export for use in main detector
export const creativeEnhancer = new OpportunityCreativeEnhancer();