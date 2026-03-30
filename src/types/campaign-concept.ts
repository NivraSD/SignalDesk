// Campaign Concept - The Finalized Blueprint
// This is what NIV helps create through conversation, and what drives all downstream orchestration

export interface CampaignConcept {
  // Concept Metadata
  id: string
  created: Date
  status: 'drafting' | 'finalizing' | 'approved' | 'executing'
  confidence: number // 0-100, how confident we are in the concept

  // 1. CORE CONCEPT - The Essential Campaign DNA
  core: {
    // The Big Idea
    vision: string                    // What success looks like
    mission: string                   // What we're doing
    value: string                     // Why it matters

    // The Goal
    objective: {
      primary: string                 // Main goal (measurable)
      timeframe: string               // When we'll achieve it
      metric: string                  // How we measure success
    }

    // The Story
    narrative: {
      thesis: string                  // One sentence that captures everything
      angle: string                   // Our unique perspective
      hook: string                    // What makes people care
    }
  }

  // 2. AUDIENCE DEFINITION - Who We're Talking To
  audience: {
    primary: {
      definition: string              // Who exactly (job title, demographic)
      size: number                    // Estimated reach
      characteristics: string[]       // Key attributes
      needs: string[]                 // What they care about
      channels: string[]              // Where they consume content
      influencers: string[]           // Who they listen to
    }

    secondary?: {
      definition: string
      relationship: string            // How they relate to primary
    }

    // Audience Intent
    intent: {
      awareness: string               // What we want them to know
      feeling: string                 // How we want them to feel
      action: string                  // What we want them to do
    }
  }

  // 3. MESSAGE ARCHITECTURE - What We're Saying
  message: {
    // Core Messaging
    elevator: string                  // 30-second pitch
    manifesto: string                 // 2-minute read

    // Key Messages (3-5)
    pillars: {
      theme: string                   // Message theme
      point: string                   // Key point
      evidence: string                // Proof point
      example: string                 // Concrete example
    }[]

    // Differentiation
    unique: string                    // What only we can say
    contrast: string                  // How we're different from others

    // Tone & Voice
    tone: string[]                    // Professional, bold, friendly, etc.
    voice: string                     // How we sound
    style: string[]                   // Writing style guidelines
  }

  // 4. CONTENT STRATEGY - What We'll Create
  content: {
    // Hero Content
    flagship: {
      type: string                    // Report, video, event, etc.
      title: string                   // Working title
      description: string             // What it is
      purpose: string                 // Why we're creating it
    }

    // Content Volume
    volume: {
      total: number                   // Total pieces needed
      types: {
        type: string                  // Blog, social, video, etc.
        quantity: number              // How many
        frequency: string             // How often
      }[]
    }

    // Content Themes
    themes: string[]                  // Topic areas to cover

    // Content Requirements
    requirements: {
      dataNeeded: boolean             // Need statistics/research
      visualsNeeded: boolean          // Need graphics/video
      interactiveNeeded: boolean      // Need tools/calculators
    }
  }

  // 5. CHANNEL STRATEGY - Where We'll Be
  channels: {
    // Owned Channels
    owned: {
      primary: string[]               // Main channels we control
      content: string                 // What goes where
    }

    // Earned Media
    earned: {
      targets: {
        tier1: number                 // How many top-tier placements
        tier2: number                 // How many mid-tier
        tier3: number                 // How many general
      }
      angles: string[]                // Story angles for media
      exclusives: boolean             // Will we offer exclusives
    }

    // Paid Amplification
    paid: {
      required: boolean
      budget?: string
      channels?: string[]
    }

    // Partner Channels
    partners: {
      required: boolean
      types?: string[]                // Types of partners needed
    }
  }

  // 6. EXECUTION PARAMETERS - How We'll Do It
  execution: {
    // Timeline
    timeline: {
      duration: string                // Total campaign length
      phases: number                  // How many phases
      milestones: string[]            // Key milestones
    }

    // Resources
    resources: {
      budget: {
        total?: string
        allocation?: string           // How it's split
      }
      team: {
        internal: string[]            // Internal resources needed
        external: string[]            // External resources needed
      }
      tools: string[]                 // Platforms/tools required
    }

    // Constraints
    constraints: {
      mustHave: string[]              // Non-negotiables
      cantHave: string[]              // Things to avoid
      deadlines: string[]             // Hard deadlines
    }
  }

  // 7. ORCHESTRATION TRIGGERS - What Gets Built
  triggers: {
    // MCP Triggers - What each MCP should do
    mediaList: {
      enabled: boolean
      count: number                   // How many contacts
      criteria: string[]              // Selection criteria
      priority: string[]              // Priority beats/topics
    }

    contentGeneration: {
      enabled: boolean
      pieces: {
        type: string
        count: number
        theme: string
        deadline: string
      }[]
    }

    projectPlan: {
      enabled: boolean
      duration: string
      checkpoints: string[]
      deliverables: string[]
    }

    competitiveIntel: {
      enabled: boolean
      competitors: string[]
      monitoring: string[]
      frequency: string
    }

    outreachSequence: {
      enabled: boolean
      waves: number
      targetsPerWave: number
      timing: string
    }

    measurement: {
      enabled: boolean
      metrics: string[]
      reporting: string
      dashboards: boolean
    }
  }

  // 8. SUCCESS CRITERIA - How We Know We Won
  success: {
    // Quantitative Goals
    metrics: {
      metric: string
      target: number | string
      timeframe: string
    }[]

    // Qualitative Goals
    outcomes: string[]

    // Monitoring
    monitoring: {
      frequency: string               // How often we check
      triggers: {
        green: string[]               // Success indicators
        yellow: string[]              // Warning signs
        red: string[]                 // Failure indicators
      }
    }
  }

  // 9. CONVERSATION INTELLIGENCE - What We Learned
  intelligence: {
    // User Context
    background: string[]              // Context provided
    inspiration: string[]             // Examples referenced
    concerns: string[]                // Worries expressed
    excitement: string[]              // Enthusiasm shown

    // Decisions Made
    decisions: {
      decision: string
      rationale: string
      timestamp: Date
    }[]

    // Research Insights
    insights: {
      finding: string
      source: string
      relevance: string
    }[]
  }
}

// Concept Validation
export interface ConceptValidation {
  ready: boolean
  score: number                       // 0-100

  // Core Elements Check
  hasObjective: boolean
  hasAudience: boolean
  hasNarrative: boolean
  hasTimeline: boolean
  hasBudget: boolean

  // Quality Checks
  clarityScore: number                // How clear is the concept
  feasibilityScore: number            // How doable is it
  impactScore: number                  // Expected impact level

  // Missing Elements
  missing: string[]
  suggestions: string[]
}

// Concept State for Progressive Building
export interface ConceptState {
  stage: 'exploring' | 'defining' | 'refining' | 'finalizing' | 'ready'

  // Progress Tracking
  elementsDiscussed: string[]
  elementsConfirmed: string[]
  elementsNeeded: string[]

  // Conversation Flow
  questionsAsked: number
  decisionsМейд: number
  researchConducted: boolean

  // Ready Indicators
  userSatisfied: boolean
  conceptComplete: boolean
  validationPassed: boolean
}

// Orchestration Instructions
export interface OrchestrationPlan {
  concept: CampaignConcept

  // Execution Order
  sequence: {
    step: number
    component: string                 // Which MCP/component
    action: string                    // What to do
    input: any                        // Data to provide
    output: string                    // Expected result
    dependencies: number[]            // Which steps must complete first
  }[]

  // Parallel Execution
  parallel: {
    group: string
    components: string[]
    canRunSimultaneously: boolean
  }[]

  // Handoffs
  handoffs: {
    from: string
    to: string
    data: string
    trigger: string
  }[]
}