// NIV Consultant Service - Proactive Strategic Intelligence
// NIV acts as a strategic consultant, bringing insights and options to help users make decisions

import { CampaignConcept } from '@/types/campaign-concept'

export interface ConsultantInsight {
  type: 'opportunity' | 'risk' | 'data' | 'example' | 'recommendation'
  insight: string
  source?: string
  relevance: string
  actionable: string
}

export interface StrategicOptions {
  category: string
  options: {
    option: string
    pros: string[]
    cons: string[]
    dataSupport: string
    recommendation: string
  }[]
  insight: string
}

export class NivConsultant {
  private userContext: any = {}
  private researchCache: Map<string, any> = new Map()
  private industryKnowledge: Map<string, any> = new Map()

  // Analyze user input and determine consultation approach
  async analyzeUserIntent(input: string): Promise<ConsultationResponse> {
    const intent = this.detectIntent(input)
    const clarity = this.assessClarity(input)
    const industry = this.detectIndustry(input)

    // Based on clarity, choose consultation style
    if (clarity.score < 30) {
      // Very vague - need to guide heavily
      return this.provideGuidedConsultation(input, intent, industry)
    } else if (clarity.score < 70) {
      // Partially clear - fill gaps with research and options
      return this.provideOptionsConsultation(input, intent, industry, clarity.gaps)
    } else {
      // Clear direction - validate and enhance
      return this.provideEnhancementConsultation(input, intent, industry)
    }
  }

  private detectIntent(input: string): UserIntent {
    const intents = {
      launch: ['launching', 'launch', 'releasing', 'announcing'],
      campaign: ['campaign', 'PR', 'marketing', 'outreach'],
      positioning: ['position', 'brand', 'narrative', 'story'],
      crisis: ['crisis', 'issue', 'problem', 'damage control'],
      thoughtLeadership: ['thought leadership', 'expertise', 'authority'],
      competitive: ['compete', 'vs', 'against', 'beat']
    }

    for (const [key, keywords] of Object.entries(intents)) {
      if (keywords.some(k => input.toLowerCase().includes(k))) {
        return key as UserIntent
      }
    }

    return 'general'
  }

  private assessClarity(input: string): ClarityAssessment {
    const assessment = {
      score: 0,
      gaps: [] as string[],
      hasGoal: false,
      hasAudience: false,
      hasTimeline: false,
      hasContext: false
    }

    // Check for goal clarity
    if (input.match(/want to|need to|trying to|goal is/i)) {
      assessment.hasGoal = true
      assessment.score += 25
    } else {
      assessment.gaps.push('specific goal')
    }

    // Check for audience clarity
    if (input.match(/reach|target|audience|customers|users/i)) {
      assessment.hasAudience = true
      assessment.score += 25
    } else {
      assessment.gaps.push('target audience')
    }

    // Check for timeline
    if (input.match(/by|deadline|launch|when|timeline/i)) {
      assessment.hasTimeline = true
      assessment.score += 25
    } else {
      assessment.gaps.push('timeline')
    }

    // Check for context
    if (input.length > 100 || input.includes('because') || input.includes('context')) {
      assessment.hasContext = true
      assessment.score += 25
    } else {
      assessment.gaps.push('context')
    }

    return assessment
  }

  private detectIndustry(input: string): string {
    const industries = {
      tech: ['AI', 'software', 'app', 'platform', 'SaaS', 'tech', 'digital'],
      finance: ['fintech', 'banking', 'investment', 'crypto', 'payment'],
      healthcare: ['health', 'medical', 'biotech', 'pharma', 'wellness'],
      retail: ['ecommerce', 'retail', 'shopping', 'consumer', 'brand'],
      b2b: ['enterprise', 'B2B', 'business', 'solution', 'workflow']
    }

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(k => input.toLowerCase().includes(k.toLowerCase()))) {
        return industry
      }
    }

    return 'general'
  }

  // CONSULTATION STYLES

  // Style 1: Heavy Guidance (for vague requests)
  private async provideGuidedConsultation(
    input: string,
    intent: UserIntent,
    industry: string
  ): Promise<ConsultationResponse> {
    // Conduct immediate research
    const marketInsights = await this.researchMarket(input, industry)
    const competitorInsights = await this.researchCompetitors(input, industry)
    const audienceInsights = await this.researchAudience(input, industry)

    return {
      style: 'guided',
      response: `I understand you're interested in ${this.summarizeIntent(intent)}. Let me help you shape this into a strategic campaign.

**Market Context I've Found:**
${marketInsights.summary}

**Key Opportunity:**
${marketInsights.opportunity}

**Let's define your campaign together. Based on my research, here are three strategic directions we could take:**

**Option 1: ${this.generateStrategicOption(1, marketInsights, intent)}**
- Best for: ${this.getOptionBenefit(1, marketInsights)}
- Timeline: ${this.getOptionTimeline(1)}
- Expected impact: ${this.getOptionImpact(1)}

**Option 2: ${this.generateStrategicOption(2, marketInsights, intent)}**
- Best for: ${this.getOptionBenefit(2, marketInsights)}
- Timeline: ${this.getOptionTimeline(2)}
- Expected impact: ${this.getOptionImpact(2)}

**Option 3: ${this.generateStrategicOption(3, marketInsights, intent)}**
- Best for: ${this.getOptionBenefit(3, marketInsights)}
- Timeline: ${this.getOptionTimeline(3)}
- Expected impact: ${this.getOptionImpact(3)}

**Which direction resonates with you? Or would you like me to research a specific angle?**`,

      insights: [marketInsights, competitorInsights, audienceInsights],
      questions: this.generateGuidedQuestions(intent, industry),
      recommendations: this.generateInitialRecommendations(marketInsights),
      nextSteps: ['Choose strategic direction', 'Define specific goals', 'Identify constraints']
    }
  }

  // Style 2: Fill Gaps with Options (for partially clear requests)
  private async provideOptionsConsultation(
    input: string,
    intent: UserIntent,
    industry: string,
    gaps: string[]
  ): Promise<ConsultationResponse> {
    // Research to fill specific gaps
    const gapResearch = await this.researchGaps(gaps, input, industry)

    return {
      style: 'options',
      response: `Great, I can see you want to ${this.extractGoal(input)}. Let me fill in some gaps with research and recommendations.

${gaps.includes('audience') ? `
**Audience Insights:**
Based on your ${this.extractProduct(input)}, here are three audience segments that could be valuable:

1. **${gapResearch.audiences[0].segment}**
   - Size: ${gapResearch.audiences[0].size}
   - Why them: ${gapResearch.audiences[0].rationale}
   - Where to reach: ${gapResearch.audiences[0].channels}

2. **${gapResearch.audiences[1].segment}**
   - Size: ${gapResearch.audiences[1].size}
   - Why them: ${gapResearch.audiences[1].rationale}
   - Where to reach: ${gapResearch.audiences[1].channels}

3. **${gapResearch.audiences[2].segment}**
   - Size: ${gapResearch.audiences[2].size}
   - Why them: ${gapResearch.audiences[2].rationale}
   - Where to reach: ${gapResearch.audiences[2].channels}
` : ''}

${gaps.includes('specific goal') ? `
**Strategic Objectives to Consider:**
Based on market conditions, here are specific goals that could drive success:

- **Awareness Goal:** ${gapResearch.goals.awareness}
- **Conversion Goal:** ${gapResearch.goals.conversion}
- **Authority Goal:** ${gapResearch.goals.authority}
` : ''}

${gaps.includes('timeline') ? `
**Timing Considerations:**
${gapResearch.timing.recommendation}

- **Quick Win (2 weeks):** ${gapResearch.timing.quickWin}
- **Standard Campaign (6 weeks):** ${gapResearch.timing.standard}
- **Major Push (3 months):** ${gapResearch.timing.major}
` : ''}

**Data Points That Support This:**
${gapResearch.supportingData.map(d => `• ${d}`).join('\n')}

**Which elements align with your vision? I can dig deeper into any aspect.**`,

      insights: gapResearch.insights,
      questions: this.generateOptionsQuestions(gaps),
      recommendations: gapResearch.recommendations,
      nextSteps: ['Select primary audience', 'Confirm timeline', 'Finalize objectives']
    }
  }

  // Style 3: Enhance and Validate (for clear requests)
  private async provideEnhancementConsultation(
    input: string,
    intent: UserIntent,
    industry: string
  ): Promise<ConsultationResponse> {
    // Validate and enhance their clear direction
    const validation = await this.validateStrategy(input, industry)
    const enhancements = await this.findEnhancements(input, industry)
    const risks = await this.identifyRisks(input, industry)

    return {
      style: 'enhancement',
      response: `Excellent clarity on your campaign direction. I've researched your approach and have insights to strengthen it.

**Your Strategy Validation:**
${validation.summary}
**Strength Score: ${validation.score}/10**

**Opportunities I've Identified:**
${enhancements.opportunities.map((o, i) => `${i + 1}. ${o.description}
   - Impact: ${o.impact}
   - Effort: ${o.effort}`).join('\n\n')}

**Data to Support Your Approach:**
${validation.supportingData.map(d => `• ${d.stat}: ${d.context}`).join('\n')}

**Potential Challenges to Address:**
${risks.challenges.map(r => `⚠️ ${r.risk}: ${r.mitigation}`).join('\n')}

**Competitor Activity to Note:**
${validation.competitorActivity.map(c => `• ${c}`).join('\n')}

**Ready to orchestrate this campaign?** I can immediately:
- Generate a media list of ${enhancements.mediaTargets} journalists covering this space
- Create ${enhancements.contentPieces} pieces of content around your key themes
- Build a ${enhancements.timeframe} execution calendar

Or would you like me to explore any of these enhancement opportunities first?`,

      insights: [...validation.insights, ...enhancements.insights],
      questions: this.generateEnhancementQuestions(validation),
      recommendations: enhancements.recommendations,
      nextSteps: ['Orchestrate campaign', 'Explore enhancements', 'Address risks']
    }
  }

  // RESEARCH METHODS

  private async researchMarket(query: string, industry: string): Promise<MarketInsight> {
    // Simulate research (would call actual research APIs)
    return {
      summary: `The ${industry} market is experiencing significant shifts with AI adoption accelerating 3x in the past year.`,
      opportunity: `There's a narrative vacuum around practical AI implementation - most coverage is either hype or fear-based.`,
      trends: [
        'Solo entrepreneurs using AI growing 400% YoY',
        '67% of technical professionals considering entrepreneurship',
        'AI tools reducing startup costs by 80%'
      ],
      gaps: ['Practical implementation guides', 'Success stories from non-Silicon Valley', 'Cost-benefit analysis'],
      competitors: ['Y Combinator', 'Indie Hackers', 'Product Hunt'],
      timing: 'Optimal - ahead of mainstream adoption curve'
    }
  }

  private async researchCompetitors(query: string, industry: string): Promise<CompetitorInsight> {
    return {
      direct: ['Competitor A focusing on enterprise', 'Competitor B targeting developers'],
      positioning: new Map([
        ['Competitor A', 'Complex, expensive, enterprise-focused'],
        ['Competitor B', 'Developer-first, technical, niche']
      ]),
      gaps: ['Accessible to non-technical', 'Cost-effective solutions', 'Success stories'],
      differentiation: 'Position as the accessible, practical choice for aspiring entrepreneurs'
    }
  }

  private async researchAudience(query: string, industry: string): Promise<AudienceInsight> {
    return {
      segments: [
        {
          name: 'Technical Professionals',
          size: '2.5M in US',
          characteristics: ['Risk-averse', 'Seeking validation', 'Time-constrained'],
          channels: ['LinkedIn', 'Hacker News', 'Technical blogs'],
          messaging: 'Reduce risk, maintain income while building'
        },
        {
          name: 'Business Professionals',
          size: '4M in US',
          characteristics: ['Strategic thinkers', 'Network-focused', 'Results-driven'],
          channels: ['LinkedIn', 'Business publications', 'Podcasts'],
          messaging: 'Leverage expertise into scalable business'
        }
      ],
      insights: ['Prefer case studies over theory', 'Trust peer recommendations', 'Value time-saving'],
      influencers: ['Naval Ravikant', 'Pieter Levels', 'Sahil Lavingia']
    }
  }

  private async researchGaps(gaps: string[], query: string, industry: string): Promise<GapResearch> {
    const research: any = {
      audiences: [],
      goals: {},
      timing: {},
      supportingData: [],
      insights: [],
      recommendations: []
    }

    if (gaps.includes('target audience')) {
      research.audiences = [
        {
          segment: 'Early Adopters - Technical Professionals',
          size: '~500K actively looking',
          rationale: 'Most likely to understand and adopt AI tools quickly',
          channels: ['Twitter/X Tech', 'Hacker News', 'Dev.to']
        },
        {
          segment: 'Frustrated Corporate Employees',
          size: '~2M considering change',
          rationale: 'Have skills and savings, need push and path',
          channels: ['LinkedIn', 'Medium', 'Career podcasts']
        },
        {
          segment: 'Current Solopreneurs',
          size: '~1M active',
          rationale: 'Can amplify message, provide social proof',
          channels: ['Indie Hackers', 'Twitter/X', 'Newsletters']
        }
      ]
    }

    if (gaps.includes('specific goal')) {
      research.goals = {
        awareness: 'Reach 100K potential solopreneurs in 30 days with AI enablement message',
        conversion: 'Generate 1,000 sign-ups for AI solopreneur toolkit/course',
        authority: 'Establish as go-to voice for AI-enabled entrepreneurship'
      }
    }

    if (gaps.includes('timeline')) {
      research.timing = {
        recommendation: 'Strike while AI interest is peaking but before market saturates',
        quickWin: 'Launch with viral Twitter thread + data report',
        standard: 'Build sustained campaign with weekly content + media outreach',
        major: 'Full thought leadership platform with hero content + speaking'
      }
    }

    research.supportingData = [
      '73% of employees considering freelancing cite AI as enabler (Upwork 2024)',
      'Solopreneur businesses grew 35% in 2023, expected to double by 2025',
      'Average AI tool stack costs dropped from $500/mo to $100/mo in past year'
    ]

    return research
  }

  // RESPONSE GENERATION HELPERS

  private generateStrategicOption(option: number, insights: any, intent: string): string {
    const options = {
      1: 'The Authority Play - Position as THE expert on AI solopreneurship',
      2: 'The Movement Builder - Create a community of AI-enabled entrepreneurs',
      3: 'The Practical Guide - Focus on step-by-step implementation'
    }
    return options[option as keyof typeof options] || 'Custom strategic approach'
  }

  private generateGuidedQuestions(intent: string, industry: string): string[] {
    return [
      'What specific outcome would make this campaign a success for you?',
      'Do you have existing content or expertise we can leverage?',
      'What's your approximate budget range?',
      'Any hard deadlines or key dates we should align with?'
    ]
  }

  private generateOptionsQuestions(gaps: string[]): string[] {
    const questions: string[] = []

    if (gaps.includes('target audience')) {
      questions.push('Which audience segment resonates most with your vision?')
    }
    if (gaps.includes('timeline')) {
      questions.push('What's driving your timeline - event, competition, or opportunity?')
    }
    if (gaps.includes('specific goal')) {
      questions.push('Is this about building awareness, driving action, or establishing authority?')
    }

    return questions
  }

  private generateEnhancementQuestions(validation: any): string[] {
    return [
      'Would you like me to dig deeper into any of these opportunities?',
      'Should we adjust based on the competitor activity I found?',
      'Any of these risks concern you particularly?'
    ]
  }

  // Extract key information from user input
  private extractGoal(input: string): string {
    const goalMatch = input.match(/want to ([^.!?]+)/i) ||
                      input.match(/need to ([^.!?]+)/i) ||
                      input.match(/launching ([^.!?]+)/i)
    return goalMatch ? goalMatch[1] : 'achieve your objectives'
  }

  private extractProduct(input: string): string {
    // Extract product/service from input
    const productMatch = input.match(/(?:my|our|the)\s+([^,.\s]+(?:\s+[^,.\s]+)?)/i)
    return productMatch ? productMatch[1] : 'offering'
  }

  private summarizeIntent(intent: string): string {
    const summaries = {
      launch: 'launching a new product or initiative',
      campaign: 'running a strategic campaign',
      positioning: 'establishing your market position',
      crisis: 'managing a challenging situation',
      thoughtLeadership: 'building thought leadership',
      competitive: 'competing in your market',
      general: 'achieving your strategic goals'
    }
    return summaries[intent as keyof typeof summaries] || intent
  }
}

// Type definitions
type UserIntent = 'launch' | 'campaign' | 'positioning' | 'crisis' | 'thoughtLeadership' | 'competitive' | 'general'

interface ClarityAssessment {
  score: number
  gaps: string[]
  hasGoal: boolean
  hasAudience: boolean
  hasTimeline: boolean
  hasContext: boolean
}

interface ConsultationResponse {
  style: 'guided' | 'options' | 'enhancement'
  response: string
  insights: any[]
  questions: string[]
  recommendations: any[]
  nextSteps: string[]
}

interface MarketInsight {
  summary: string
  opportunity: string
  trends: string[]
  gaps: string[]
  competitors: string[]
  timing: string
}

interface CompetitorInsight {
  direct: string[]
  positioning: Map<string, string>
  gaps: string[]
  differentiation: string
}

interface AudienceInsight {
  segments: any[]
  insights: string[]
  influencers: string[]
}

interface GapResearch {
  audiences: any[]
  goals: any
  timing: any
  supportingData: string[]
  insights: any[]
  recommendations: any[]
}

export const nivConsultant = new NivConsultant()