// Strategic Framework Type Definition
// This structure ensures all campaign intelligence is captured and actionable

export interface StrategicFramework {
  // Meta information
  id: string
  created: Date
  version: number
  status: 'draft' | 'review' | 'approved' | 'active'

  // 1. CAMPAIGN FOUNDATION - The Why and What
  foundation: {
    goal: string                    // Clear, measurable objective
    vision: string                  // End state we're trying to achieve
    problemStatement: string        // What problem are we solving

    successMetrics: {
      primary: string[]             // Main KPIs (e.g., "10 tier-1 media placements")
      secondary: string[]           // Supporting metrics
      timeline: string              // Measurement period
      benchmarks: string[]          // What success looks like
    }

    context: {
      marketConditions: string      // Current landscape analysis
      triggers: string[]            // Why now? What's changed?
      constraints: string[]         // Budget, time, resource limits
      opportunities: string[]       // Gaps, weaknesses to exploit
      risks: string[]              // What could go wrong
    }
  }

  // 2. NARRATIVE ARCHITECTURE - The Story
  narrative: {
    coreThesis: string              // One powerful idea that drives everything

    positioning: {
      statement: string             // How we position the idea
      differentiation: string       // What makes this unique
      contrarian: string[]          // Counter-narrative positions
      defensible: string[]          // Why we can defend these positions
    }

    messages: {
      elevator: string              // 30-second pitch
      headlines: string[]           // Media-ready headlines
      soundbites: string[]          // Quotable moments
      talkingPoints: string[]       // Executive talking points
      dataPoints: {                // Supporting evidence
        stat: string
        source: string
        context: string
      }[]
    }

    narrativeVacuum: {
      identified: string            // What's missing in current discourse
      opportunity: string           // How we fill it
      firstMover: string[]          // Advantages of being first
    }
  }

  // 3. AUDIENCE STRATEGY - Who We're Reaching
  audience: {
    primary: {
      segment: string               // Specific definition
      psychographics: string[]      // What they believe
      painPoints: string[]          // What keeps them up
      aspirations: string[]         // What they want
      objections: string[]          // What they'll resist
      messaging: string             // How to reach them
    }

    secondary: {
      segment: string
      role: string                  // Why they matter
      messaging: string
    }

    influencers: {
      journalists: {
        name: string
        outlet: string
        beat: string
        angle: string               // Story angle for them
        priority: 'tier1' | 'tier2' | 'tier3'
      }[]

      analysts: {
        name: string
        firm: string
        focus: string
        approach: string
      }[]

      thoughtLeaders: {
        name: string
        platform: string
        audience: string
        engagement: string          // How to engage
      }[]
    }
  }

  // 4. CONTENT STRATEGY - What We Create
  content: {
    hero: {                         // Flagship content
      format: string                // Report, video, event
      title: string
      thesis: string
      distribution: string[]
      timeline: string
    }

    pillar: {                       // Major themes
      themes: string[]
      formats: string[]
      cadence: string
    }

    supporting: {                   // Regular drumbeat
      types: string[]               // Blog, social, newsletter
      topics: string[]
      frequency: string
      volume: number
    }

    reactive: {                     // Newsjacking
      triggers: string[]            // Events to watch for
      responses: string[]           // Prepared responses
      speed: string                 // Response time target
    }

    calendar: {
      week1: {
        priority: string[]
        content: string[]
        outreach: string[]
      }
      week2: {
        priority: string[]
        content: string[]
        outreach: string[]
      }
      week3: {
        priority: string[]
        content: string[]
        outreach: string[]
      }
      week4: {
        priority: string[]
        content: string[]
        outreach: string[]
      }
    }
  }

  // 5. CHANNEL STRATEGY - Where We Show Up
  channels: {
    owned: {
      website: {
        updates: string[]
        landing: string
        conversion: string
      }
      email: {
        lists: string[]
        campaigns: string[]
        automation: string[]
      }
      social: {
        platforms: string[]
        voice: string
        content: string[]
        frequency: string
        engagement: string
      }
    }

    earned: {
      media: {
        tier1: string[]             // Dream targets
        tier2: string[]             // Solid targets
        tier3: string[]             // Volume targets
      }
      angles: {
        exclusive: string           // What we offer first
        embargo: string             // Timed releases
        general: string[]           // Broad angles
      }
      assets: {
        pressRelease: boolean
        mediKit: boolean
        briefingDoc: boolean
        dataSheet: boolean
      }
    }

    paid: {
      budget: string
      allocation: {
        channel: string
        percentage: number
        objective: string
      }[]
      creative: string[]
    }

    shared: {
      partners: string[]
      coMarketing: string[]
      amplification: string[]
    }
  }

  // 6. COMPETITIVE STRATEGY - Market Dynamics
  competitive: {
    landscape: {
      direct: string[]              // Direct competitors
      indirect: string[]            // Adjacent players
      substitutes: string[]         // Alternative solutions
    }

    anticipation: {
      likelyResponses: string[]     // What they'll do
      counters: string[]            // Our responses
      preemption: string[]          // Get ahead of them
    }

    differentiation: {
      unique: string[]              // What only we can say
      superior: string[]            // Where we're better
      different: string[]           // Where we're different
    }
  }

  // 7. EXECUTION PLAN - How We Do It
  execution: {
    phases: {
      name: string                  // Phase name
      duration: string
      objectives: string[]
      deliverables: string[]
      milestones: string[]
      dependencies: string[]
      owner: string
      status: 'pending' | 'active' | 'complete'
    }[]

    resources: {
      team: string[]                // Who's involved
      tools: string[]               // What we need
      budget: string                // Cost estimate
      timeline: string              // Total duration
    }

    governance: {
      approvals: string[]           // Who signs off
      reviews: string[]             // Checkpoint meetings
      escalation: string            // Issue resolution
    }
  }

  // 8. MONITORING - How We Track
  monitoring: {
    triggers: {
      success: string[]             // Green flags
      warning: string[]             // Yellow flags
      failure: string[]             // Red flags
    }

    feedback: {
      channels: string[]            // How we listen
      frequency: string             // How often
      analysis: string              // How we process
    }

    optimization: {
      tests: string[]               // What we'll test
      iterations: string[]          // Planned improvements
      pivots: string[]              // Potential changes
    }
  }

  // 9. INTELLIGENCE - Extracted from Conversation
  intelligence: {
    userIntent: string[]            // What user really wants
    statedGoals: string[]           // Explicit objectives
    impliedNeeds: string[]          // Unstated requirements
    decisions: string[]             // Choices made in chat
    preferences: string[]           // Stated preferences
    rejections: string[]            // What they don't want
    examples: string[]              // References provided
    constraints: string[]           // Mentioned limitations
    context: string[]               // Background shared
  }
}

// Helper type for framework generation status
export interface FrameworkGenerationStatus {
  stage: 'gathering' | 'analyzing' | 'structuring' | 'validating' | 'complete'
  completeness: number            // 0-100%
  missingElements: string[]
  readyForHandoff: boolean
}

// Type for framework validation
export interface FrameworkValidation {
  isComplete: boolean
  hasGoal: boolean
  hasAudience: boolean
  hasNarrative: boolean
  hasTimeline: boolean
  hasMeasurement: boolean
  missingCritical: string[]
  missingOptional: string[]
  score: number                   // 0-100
}