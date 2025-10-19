// Fixes for research/strategy separation in NIV orchestrator

// 1. Updated buildClaudeMessage function with mode-based persona
export function buildClaudeMessage(
  userMessage: string,
  toolResults: any,
  queryType: string,
  strategy?: any,
  conversationHistory?: any[],
  shouldGenerateFramework?: boolean
): string {
  let message = ""

  // Add conversation context if available
  if (conversationHistory && conversationHistory.length > 0) {
    message += "**Recent Conversation:**\n"
    conversationHistory.forEach(msg => {
      message += `${msg.role === 'user' ? 'User' : 'NIV'}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`
    })
    message += "\n**Current User Query:**\n"
  }

  message += `User: ${userMessage}\n\n`

  // Add mode-specific instructions
  if (!shouldGenerateFramework) {
    // RESEARCH MODE - Present findings objectively
    message += `**Research Mode Instructions:**
Present the research findings clearly and objectively.
Focus on facts, trends, and newsworthy developments.
Summarize what's happening without strategic interpretation.
If the user wants strategic analysis, they'll ask for it explicitly.
Save strategic recommendations for when explicitly requested.\n\n`
  } else {
    // STRATEGY MODE - Provide strategic guidance
    message += `**Strategy Mode Instructions:**
Now provide strategic analysis and recommendations based on the research.
Share insights as you would in a strategy meeting.
Identify patterns, opportunities, and risks.
Recommend specific strategic actions.
Build a comprehensive strategic framework.\n\n`
  }

  // Add tool results if available
  if (toolResults) {
    if (toolResults.fireplexityData && toolResults.fireplexityData.length > 0) {
      message += "**Research Findings:**\n"
      toolResults.fireplexityData.forEach((article: any, index: number) => {
        if (index < 5) { // Limit to top 5 for context
          message += `\n${index + 1}. ${article.title}`
          if (article.url) message += ` (${article.url})`
          if (article.publishedDate) message += ` - ${article.publishedDate}`
          if (article.excerpt) message += `\n   ${article.excerpt.substring(0, 200)}...`
          message += "\n"
        }
      })
      if (toolResults.fireplexityData.length > 5) {
        message += `\n...and ${toolResults.fireplexityData.length - 5} more articles.\n`
      }
    }

    if (toolResults.discoveryData) {
      message += "\n**Discovery Context:**\n"
      message += `Organization: ${toolResults.discoveryData.organization || 'Unknown'}\n`
      if (toolResults.discoveryData.competitors) {
        message += `Competitors: ${toolResults.discoveryData.competitors.join(', ')}\n`
      }
      if (toolResults.discoveryData.industry) {
        message += `Industry: ${toolResults.discoveryData.industry}\n`
      }
    }
  }

  // Add query strategy if available
  if (strategy) {
    message += `\n**Search Strategy Used:**\n`
    message += `Approach: ${strategy.approach}\n`
    message += `Focus: ${strategy.searchQuery || userMessage}\n`
    if (strategy.understanding) {
      message += `Understanding: ${strategy.understanding.what_user_wants}\n`
    }
  }

  return message
}

// 2. Enhanced detectStrategicIntent function
export function detectStrategicIntent(message: string, conversationHistory?: any[]): boolean {
  const queryLower = message.toLowerCase()

  // Check if user is explicitly asking for strategy
  const explicitStrategicPhrases = [
    'develop a strategy',
    'create a strategic framework',
    'build a campaign',
    'generate a plan',
    'design a response strategy',
    'what should we do',
    'how should we respond',
    'create a pr strategy',
    'build our approach',
    'strategic recommendations'
  ]

  const hasExplicitRequest = explicitStrategicPhrases.some(phrase => queryLower.includes(phrase))

  // Check if this is a follow-up to research
  let hasResearchContext = false
  if (conversationHistory && conversationHistory.length > 0) {
    // Check if we've already provided research in this conversation
    hasResearchContext = conversationHistory.some(msg =>
      msg.role === 'assistant' &&
      (msg.content.includes('Research Findings') ||
       msg.content.includes('Key findings') ||
       msg.content.includes('analysis shows'))
    )
  }

  // Only generate framework if:
  // 1. User explicitly asks for strategy AND
  // 2. We have research context OR it's a clear strategic request
  return hasExplicitRequest && (hasResearchContext || queryLower.includes('based on'))
}

// 3. Information gap detection for self-querying
export async function detectInformationGaps(
  research: any,
  userQuery: string,
  organizationContext: any
): Promise<string[]> {
  const gaps: string[] = []

  // Check for missing critical information based on query type
  const queryLower = userQuery.toLowerCase()

  if (queryLower.includes('competitor') || queryLower.includes('competitive')) {
    // Need competitor-specific information
    if (!research.competitors || research.competitors.length === 0) {
      gaps.push('Direct competitor activities and recent announcements')
    }
    if (!research.marketPosition) {
      gaps.push('Competitive market positioning and differentiation')
    }
  }

  if (queryLower.includes('crisis') || queryLower.includes('respond')) {
    // Need crisis-specific information
    if (!research.timeline) {
      gaps.push('Timeline of events and key developments')
    }
    if (!research.stakeholderReactions) {
      gaps.push('Stakeholder and public reactions to the situation')
    }
  }

  if (queryLower.includes('launch') || queryLower.includes('announce')) {
    // Need launch-specific information
    if (!research.marketTiming) {
      gaps.push('Market timing and competitive launch windows')
    }
    if (!research.mediaLandscape) {
      gaps.push('Current media coverage and journalist interest in the space')
    }
  }

  // General gaps
  if (!research.recentDevelopments || research.recentDevelopments.length < 3) {
    gaps.push('Recent industry developments and trends')
  }

  if (!research.keyInfluencers) {
    gaps.push('Key influencers and thought leaders in this space')
  }

  return gaps
}

// 4. Self-query execution
export async function fillInformationGaps(
  research: any,
  gaps: string[],
  organizationContext: any
): Promise<any> {
  const enrichedResearch = { ...research }

  for (const gap of gaps) {
    console.log(`🔍 Filling information gap: ${gap}`)

    // Call niv-fireplexity with targeted query
    try {
      const gapResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-fireplexity`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            message: gap,
            organizationId: organizationContext.organizationId,
            context: { searchType: 'targeted', limit: 5 }
          })
        }
      )

      if (gapResponse.ok) {
        const gapData = await gapResponse.json()

        // Merge gap data into research
        if (gap.includes('competitor')) {
          enrichedResearch.competitors = gapData.results
        } else if (gap.includes('timeline')) {
          enrichedResearch.timeline = gapData.results
        } else if (gap.includes('stakeholder')) {
          enrichedResearch.stakeholderReactions = gapData.results
        } else {
          enrichedResearch.additionalContext = [
            ...(enrichedResearch.additionalContext || []),
            ...gapData.results
          ]
        }
      }
    } catch (error) {
      console.error(`Failed to fill gap "${gap}":`, error)
    }
  }

  return enrichedResearch
}

// 5. Strategy structure generator
export function createStrategyStructure(
  research: any,
  userQuery: string,
  organizationContext: any
): any {
  const strategyId = crypto.randomUUID()

  return {
    id: strategyId,
    title: extractTitle(userQuery),
    created: new Date().toISOString(),

    // Research summary
    research: {
      sources: research.fireplexityData || [],
      keyFindings: extractKeyFindings(research),
      gaps: research.gaps || [],
      confidence: calculateConfidence(research)
    },

    // Strategic elements (to be filled by Claude)
    strategy: {
      objective: '',
      approach: '',
      positioning: '',
      keyMessages: [],
      narratives: [],
      timeline: '',
      urgencyLevel: 'medium'
    },

    // Metadata
    metadata: {
      organizationId: organizationContext.organizationId,
      organizationName: organizationContext.organizationName,
      created: new Date().toISOString(),
      version: 1,
      status: 'draft'
    },

    // Workflow preparation (for future use)
    workflows: {
      campaignIntelligence: { enabled: false },
      contentGeneration: { enabled: false },
      strategicPlanning: { enabled: false },
      mediaOutreach: { enabled: false }
    }
  }
}

// Helper functions
function extractTitle(query: string): string {
  // Extract a title from the user query
  const words = query.split(' ').slice(0, 10)
  return words.join(' ') + (query.split(' ').length > 10 ? '...' : '')
}

function extractKeyFindings(research: any): string[] {
  const findings: string[] = []

  if (research.fireplexityData && research.fireplexityData.length > 0) {
    // Extract top findings from articles
    research.fireplexityData.slice(0, 5).forEach((article: any) => {
      if (article.excerpt) {
        findings.push(article.excerpt.substring(0, 150))
      }
    })
  }

  return findings
}

function calculateConfidence(research: any): number {
  let confidence = 0.5 // Base confidence

  // Increase confidence based on data quality
  if (research.fireplexityData && research.fireplexityData.length > 5) {
    confidence += 0.2
  }

  if (research.discoveryData) {
    confidence += 0.1
  }

  if (research.timeline) {
    confidence += 0.1
  }

  if (research.competitors) {
    confidence += 0.1
  }

  return Math.min(confidence, 1.0)
}