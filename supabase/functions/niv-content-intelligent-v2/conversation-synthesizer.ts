// Conversation Context Synthesizer
// Analyzes conversation history to extract key concepts, decisions, and narrative arc
// Used when user requests content "based on what we discussed"

export interface ConversationArtifact {
  type: 'concept' | 'decision' | 'research' | 'preference' | 'agreement' | 'constraint'
  title: string
  content: string
  timestamp: string
  messageId: string
  confidence: number // 0-1, how confident we are this is meaningful
  relatedTo?: string[] // IDs of other artifacts this connects to
}

export interface ConversationTheme {
  theme: string
  description: string
  artifacts: ConversationArtifact[]
  narrative: string // How this theme developed through the conversation
}

export interface ConversationSynthesis {
  summary: string // High-level overview of conversation
  themes: ConversationTheme[]
  keyDecisions: string[] // Critical decisions made
  concepts: string[] // Core concepts/ideas developed
  timeline: {
    phase: string
    description: string
    messageCount: number
  }[]
  presentationStructure?: {
    // Suggested structure for presentation based on conversation flow
    title: string
    sections: {
      title: string
      talking_points: string[]
      supportingArtifacts: ConversationArtifact[]
    }[]
  }
}

/**
 * Synthesize conversation history into structured insights
 * This is called when user says things like:
 * - "create a presentation based on what we discussed"
 * - "use the concept we agreed on"
 * - "summarize what we've been talking about"
 */
export async function synthesizeConversationContext(
  conversationHistory: any[],
  currentQuery: string,
  claudeApiKey: string
): Promise<ConversationSynthesis> {

  // Build conversation context for Claude to analyze
  const conversationText = conversationHistory
    .map(msg => `[${msg.role}]: ${msg.content}`)
    .join('\n\n')

  const SYNTHESIS_PROMPT = `You are analyzing a conversation between a user and NIV (an AI strategic consultant).

**Current User Request:** "${currentQuery}"

**Full Conversation History:**
${conversationText}

**Your Task:**
Extract the key artifacts, themes, decisions, and narrative arc from this conversation. The user wants content created "based on what we discussed" - so you need to identify what actually matters.

**Look for:**
1. **Concepts**: Ideas, strategies, approaches that were discussed and developed
2. **Decisions**: Choices the user made ("let's go with premium approach", "I prefer X over Y")
3. **Research Insights**: Key findings from any research that was presented
4. **Preferences**: User's stated likes/dislikes, requirements, constraints
5. **Agreements**: Points where user and NIV aligned on something specific

**Analyze the narrative flow:**
- How did the conversation evolve?
- What themes emerged?
- What was the user trying to accomplish?
- What did they ultimately decide/agree upon?

**CRITICAL FOR PRESENTATIONS:**
If the user is asking for a presentation based on this conversation, identify:
- What story should the presentation tell?
- What are the key messages?
- What evidence/examples support those messages?
- How should the narrative flow?

Return a JSON object with this structure:
{
  "summary": "2-3 sentence overview of the entire conversation",
  "themes": [
    {
      "theme": "Theme name",
      "description": "What this theme is about",
      "narrative": "How this theme developed through the conversation",
      "artifacts": [
        {
          "type": "concept|decision|research|preference|agreement",
          "title": "Brief title",
          "content": "The actual content/decision/concept",
          "confidence": 0.0-1.0
        }
      ]
    }
  ],
  "keyDecisions": ["Decision 1", "Decision 2"],
  "concepts": ["Core concept 1", "Core concept 2"],
  "timeline": [
    {
      "phase": "Phase name",
      "description": "What happened in this phase",
      "messageCount": number
    }
  ],
  "presentationStructure": {
    "title": "Suggested presentation title based on conversation",
    "sections": [
      {
        "title": "Section title",
        "talking_points": ["Point 1", "Point 2"],
        "supportingArtifacts": [/* relevant artifacts */]
      }
    ]
  }
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: SYNTHESIS_PROMPT
        }]
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const responseText = data.content[0].text

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const synthesis: ConversationSynthesis = JSON.parse(jsonMatch[0])

        console.log('🧠 Conversation Synthesis Complete:')
        console.log(`   - Themes: ${synthesis.themes.length}`)
        console.log(`   - Key Decisions: ${synthesis.keyDecisions.length}`)
        console.log(`   - Concepts: ${synthesis.concepts.length}`)
        console.log(`   - Timeline Phases: ${synthesis.timeline.length}`)

        return synthesis
      }
    }
  } catch (error) {
    console.error('❌ Conversation synthesis failed:', error)
  }

  // Fallback: basic synthesis
  return {
    summary: 'Unable to fully synthesize conversation. Creating content based on current request.',
    themes: [],
    keyDecisions: [],
    concepts: [],
    timeline: [{
      phase: 'Full Conversation',
      description: 'Multi-turn discussion',
      messageCount: conversationHistory.length
    }]
  }
}

/**
 * Detect if user query references conversation history
 * Signals: "based on what we discussed", "use the concept we agreed", "from our conversation"
 */
export function requiresConversationSynthesis(query: string): boolean {
  const conversationSignals = [
    /based on what we (discussed|talked about)/i,
    /the concept we (agreed|developed|created)/i,
    /from our conversation/i,
    /what we just (discussed|talked about)/i,
    /(use|include) what we (said|discussed)/i,
    /the (idea|concept|strategy|approach) we (chose|picked|decided)/i,
    /incorporate our (discussion|conversation)/i
  ]

  return conversationSignals.some(pattern => pattern.test(query))
}

/**
 * Format synthesis for presentation outline tool
 * Converts conversation synthesis into presentation-ready structure
 */
export function formatSynthesisForPresentation(synthesis: ConversationSynthesis) {
  return {
    topic: synthesis.presentationStructure?.title || 'Presentation Based on Discussion',
    keyMessages: synthesis.keyDecisions.concat(synthesis.concepts),
    narrative: synthesis.summary,
    suggestedSections: synthesis.presentationStructure?.sections || synthesis.themes.map(theme => ({
      title: theme.theme,
      talking_points: theme.artifacts.map(a => a.title),
      supportingArtifacts: theme.artifacts
    })),
    conversationContext: {
      themes: synthesis.themes.map(t => t.theme),
      timeline: synthesis.timeline
    }
  }
}
