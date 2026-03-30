// NIV Strategic Framework - Complete structure for orchestration
export interface NivStrategicFramework {
  id: string
  sessionId: string
  organizationId: string
  created_at: Date

  // Core Strategy (from NIV's research & analysis)
  strategy: {
    executive_summary: string  // 2-3 paragraph overview
    objective: string          // Primary goal
    narrative: string          // Core story/positioning
    rationale: string          // Why this approach
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  }

  // Tactical Breakdown (for downstream components)
  tactics: {
    campaign_elements: {
      media_outreach: string[]      // For PR component
      content_creation: string[]    // For content generator
      stakeholder_engagement: string[] // For comms planning
    }
    immediate_actions: string[]     // Next 24-48 hours
    week_one_priorities: string[]   // This week
    strategic_plays: string[]       // Longer-term
  }

  // Intelligence Context (from research)
  intelligence: {
    key_findings: string[]
    competitor_moves: string[]
    market_opportunities: string[]
    risk_factors: string[]
    supporting_data: {
      articles: any[]
      quotes: any[]
      metrics: any[]
    }
  }

  // Full Discovery Profile (critical for context)
  discovery: {
    organizationName: string
    industry: string
    competitors: string[]
    keywords: string[]
    stakeholders: {
      executives: string[]
      investors: string[]
      regulators: string[]
    }
    market_position: string
    recent_events: any[]
    monitoring_priorities: string[]
  }

  // Complete Conversation History (for understanding evolution)
  conversationContext: {
    originalQuery: string                    // What user originally asked
    conversationHistory: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: Date
    }>
    researchSteps: Array<{                  // How we got here
      query: string
      findings: string[]
      sources: number
    }>
    userPreferences: {                      // What user wants/doesn't want
      wants: string[]
      doesNotWant: string[]
      constraints: string[]
      examples: string[]
    }
  }

  // Orchestration Instructions
  orchestration: {
    components_to_activate: string[]  // ['media-list', 'content-gen', 'timeline']
    workflow_type: 'crisis-response' | 'opportunity' | 'competitive' | 'thought-leadership' | 'launch'
    priority: 'urgent' | 'high' | 'normal'
    dependencies: string[]
  }

  // Metadata
  metadata?: {
    version: number
    created_by: string
    last_modified: Date
    tags: string[]
  }
}

// Response type when NIV generates a framework
export interface NivFrameworkResponse {
  success: boolean
  type: 'strategic-framework'
  message: string                    // Formatted for chat display
  framework: NivStrategicFramework   // Structured for saving/orchestration
  readyForHandoff: boolean
  discovery?: any                    // Raw discovery data
  sessionId: string
  conversationId: string
  organizationName: string
}