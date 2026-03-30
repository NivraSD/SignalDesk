// Concept Builder - Conversational Campaign Concept Creation
// NIV uses this to progressively build a complete campaign concept through dialogue

import { CampaignConcept, ConceptState, ConceptValidation, OrchestrationPlan } from '@/types/campaign-concept'

export class ConceptBuilder {
  private concept: Partial<CampaignConcept>
  private state: ConceptState
  private conversationHistory: any[]

  constructor() {
    this.concept = this.initializeConcept()
    this.state = this.initializeState()
    this.conversationHistory = []
  }

  private initializeConcept(): Partial<CampaignConcept> {
    return {
      id: `concept-${Date.now()}`,
      created: new Date(),
      status: 'drafting',
      confidence: 0,
      core: {
        vision: '',
        mission: '',
        value: '',
        objective: { primary: '', timeframe: '', metric: '' },
        narrative: { thesis: '', angle: '', hook: '' }
      },
      audience: {
        primary: {
          definition: '',
          size: 0,
          characteristics: [],
          needs: [],
          channels: [],
          influencers: []
        },
        intent: { awareness: '', feeling: '', action: '' }
      },
      message: {
        elevator: '',
        manifesto: '',
        pillars: [],
        unique: '',
        contrast: '',
        tone: [],
        voice: '',
        style: []
      },
      triggers: {
        mediaList: { enabled: false, count: 0, criteria: [], priority: [] },
        contentGeneration: { enabled: false, pieces: [] },
        projectPlan: { enabled: false, duration: '', checkpoints: [], deliverables: [] },
        competitiveIntel: { enabled: false, competitors: [], monitoring: [], frequency: '' },
        outreachSequence: { enabled: false, waves: 0, targetsPerWave: 0, timing: '' },
        measurement: { enabled: false, metrics: [], reporting: '', dashboards: false }
      },
      intelligence: {
        background: [],
        inspiration: [],
        concerns: [],
        excitement: [],
        decisions: [],
        insights: []
      }
    }
  }

  private initializeState(): ConceptState {
    return {
      stage: 'exploring',
      elementsDiscussed: [],
      elementsConfirmed: [],
      elementsNeeded: ['objective', 'audience', 'narrative', 'timeline'],
      questionsAsked: 0,
      decisionsМейд: 0,
      researchConducted: false,
      userSatisfied: false,
      conceptComplete: false,
      validationPassed: false
    }
  }

  // CONVERSATIONAL METHODS

  // Process user input and extract concept elements
  processUserInput(input: string): void {
    this.conversationHistory.push({ role: 'user', message: input, timestamp: new Date() })

    // Extract elements based on keywords and patterns
    this.extractObjective(input)
    this.extractAudience(input)
    this.extractNarrative(input)
    this.extractConstraints(input)
    this.extractPreferences(input)

    // Update state
    this.updateState()
  }

  private extractObjective(input: string): void {
    const objectivePatterns = [
      /want to\s+([^,.\n]+)/i,
      /goal is\s+([^,.\n]+)/i,
      /need to\s+([^,.\n]+)/i,
      /trying to\s+([^,.\n]+)/i,
      /objective is\s+([^,.\n]+)/i
    ]

    for (const pattern of objectivePatterns) {
      const match = input.match(pattern)
      if (match && !this.concept.core!.objective.primary) {
        this.concept.core!.objective.primary = match[1].trim()
        this.markDiscussed('objective')
      }
    }
  }

  private extractAudience(input: string): void {
    const audiencePatterns = [
      /reach\s+([^,.\n]+)/i,
      /target\s+([^,.\n]+)/i,
      /audience is\s+([^,.\n]+)/i,
      /talking to\s+([^,.\n]+)/i,
      /for\s+([^,.\n]+)/i
    ]

    for (const pattern of audiencePatterns) {
      const match = input.match(pattern)
      if (match && !this.concept.audience!.primary.definition) {
        this.concept.audience!.primary.definition = match[1].trim()
        this.markDiscussed('audience')
      }
    }
  }

  private extractNarrative(input: string): void {
    const narrativePatterns = [
      /story is\s+([^,.\n]+)/i,
      /message is\s+([^,.\n]+)/i,
      /tell\s+([^,.\n]+)/i,
      /communicate\s+([^,.\n]+)/i,
      /position as\s+([^,.\n]+)/i
    ]

    for (const pattern of narrativePatterns) {
      const match = input.match(pattern)
      if (match && !this.concept.core!.narrative.thesis) {
        this.concept.core!.narrative.thesis = match[1].trim()
        this.markDiscussed('narrative')
      }
    }
  }

  private extractConstraints(input: string): void {
    if (input.includes("can't") || input.includes("don't") || input.includes("avoid")) {
      if (!this.concept.execution) {
        this.concept.execution = {
          timeline: { duration: '', phases: 0, milestones: [] },
          resources: { budget: {}, team: { internal: [], external: [] }, tools: [] },
          constraints: { mustHave: [], cantHave: [], deadlines: [] }
        }
      }
      this.concept.execution.constraints.cantHave.push(input)
      this.concept.intelligence!.concerns.push(input)
    }
  }

  private extractPreferences(input: string): void {
    if (input.includes("like") || input.includes("prefer") || input.includes("want")) {
      this.concept.intelligence!.excitement.push(input)
    }
  }

  // Generate NIV's next question based on concept state
  getNextQuestion(): string {
    const missing = this.getMissingElements()

    if (missing.includes('objective') && !this.concept.core?.objective.primary) {
      this.state.questionsAsked++
      return "Let's start with the goal. What's the main objective you want to achieve with this campaign? Be as specific as possible - what does success look like?"
    }

    if (missing.includes('audience') && !this.concept.audience?.primary.definition) {
      this.state.questionsAsked++
      return "Who exactly are we trying to reach? Describe your primary audience - their role, what they care about, where they spend time."
    }

    if (missing.includes('narrative') && !this.concept.core?.narrative.thesis) {
      this.state.questionsAsked++
      return "What's the core story or message? What's the one thing you want your audience to understand or believe?"
    }

    if (missing.includes('timeline') && !this.concept.execution?.timeline.duration) {
      this.state.questionsAsked++
      return "What's your timeline? When do you need to launch, and how long should the campaign run?"
    }

    if (!this.concept.content?.volume.total) {
      this.state.questionsAsked++
      return "Let's talk about content. What types of content do you envision? A hero piece like a report? Regular blog posts? Social content?"
    }

    if (!this.concept.channels?.earned.targets.tier1) {
      this.state.questionsAsked++
      return "For media coverage, what would be your dream outlets? Which publications or journalists would be perfect for this story?"
    }

    return this.generateRefinementQuestion()
  }

  private generateRefinementQuestion(): string {
    // If we have the basics, ask refinement questions
    const refinements = [
      "What makes your approach different from what's already out there?",
      "What specific action do you want your audience to take?",
      "Are there any examples or competitors we should reference or avoid?",
      "What's your budget range for this campaign?",
      "What internal resources do you have available?"
    ]

    return refinements[this.state.questionsAsked % refinements.length]
  }

  // Check what elements are missing
  private getMissingElements(): string[] {
    const missing: string[] = []

    if (!this.concept.core?.objective.primary) missing.push('objective')
    if (!this.concept.audience?.primary.definition) missing.push('audience')
    if (!this.concept.core?.narrative.thesis) missing.push('narrative')
    if (!this.concept.execution?.timeline.duration) missing.push('timeline')
    if (!this.concept.content?.volume.total) missing.push('content')
    if (!this.concept.channels?.earned.targets.tier1) missing.push('media')

    return missing
  }

  // Mark element as discussed
  private markDiscussed(element: string): void {
    if (!this.state.elementsDiscussed.includes(element)) {
      this.state.elementsDiscussed.push(element)
    }
  }

  // Mark element as confirmed
  markConfirmed(element: string): void {
    if (!this.state.elementsConfirmed.includes(element)) {
      this.state.elementsConfirmed.push(element)
      this.state.elementsNeeded = this.state.elementsNeeded.filter(e => e !== element)
    }
    this.updateState()
  }

  // Update concept state based on completeness
  private updateState(): void {
    const validation = this.validate()

    // Update confidence score
    this.concept.confidence = validation.score

    // Update stage based on progress
    if (validation.score < 25) {
      this.state.stage = 'exploring'
    } else if (validation.score < 50) {
      this.state.stage = 'defining'
    } else if (validation.score < 75) {
      this.state.stage = 'refining'
    } else if (validation.score < 90) {
      this.state.stage = 'finalizing'
    } else {
      this.state.stage = 'ready'
      this.state.conceptComplete = true
    }
  }

  // Validate concept completeness
  validate(): ConceptValidation {
    const validation: ConceptValidation = {
      ready: false,
      score: 0,
      hasObjective: !!this.concept.core?.objective.primary,
      hasAudience: !!this.concept.audience?.primary.definition,
      hasNarrative: !!this.concept.core?.narrative.thesis,
      hasTimeline: !!this.concept.execution?.timeline.duration,
      hasBudget: !!this.concept.execution?.resources.budget?.total,
      clarityScore: 0,
      feasibilityScore: 0,
      impactScore: 0,
      missing: [],
      suggestions: []
    }

    // Calculate base score
    let points = 0
    if (validation.hasObjective) points += 25
    if (validation.hasAudience) points += 25
    if (validation.hasNarrative) points += 25
    if (validation.hasTimeline) points += 15
    if (validation.hasBudget) points += 10

    // Calculate quality scores
    validation.clarityScore = this.assessClarity()
    validation.feasibilityScore = this.assessFeasibility()
    validation.impactScore = this.assessImpact()

    // Add quality bonus points
    points += (validation.clarityScore + validation.feasibilityScore + validation.impactScore) / 30

    validation.score = Math.min(points, 100)
    validation.ready = validation.score >= 75

    // Identify missing elements
    if (!validation.hasObjective) validation.missing.push('Clear objective')
    if (!validation.hasAudience) validation.missing.push('Target audience')
    if (!validation.hasNarrative) validation.missing.push('Core narrative')
    if (!validation.hasTimeline) validation.missing.push('Timeline')

    return validation
  }

  private assessClarity(): number {
    let score = 0
    if (this.concept.core?.objective.primary && this.concept.core.objective.primary.length > 10) score += 30
    if (this.concept.core?.narrative.thesis && this.concept.core.narrative.thesis.length > 10) score += 30
    if (this.concept.audience?.primary.definition && this.concept.audience.primary.definition.length > 10) score += 40
    return score
  }

  private assessFeasibility(): number {
    let score = 50 // Start neutral
    if (this.concept.execution?.constraints.cantHave.length > 5) score -= 20
    if (this.concept.execution?.timeline.duration) score += 25
    if (this.concept.execution?.resources.budget?.total) score += 25
    return Math.max(0, Math.min(100, score))
  }

  private assessImpact(): number {
    let score = 0
    if (this.concept.audience?.primary.size && this.concept.audience.primary.size > 1000) score += 30
    if (this.concept.channels?.earned.targets.tier1 && this.concept.channels.earned.targets.tier1 > 5) score += 35
    if (this.concept.content?.flagship.type) score += 35
    return score
  }

  // Finalize concept and prepare for orchestration
  finalizeConcept(): CampaignConcept {
    this.concept.status = 'approved'
    this.state.userSatisfied = true
    this.state.validationPassed = true

    // Set up orchestration triggers based on concept
    this.configureOrchestrationTriggers()

    return this.concept as CampaignConcept
  }

  private configureOrchestrationTriggers(): void {
    // Enable triggers based on what's defined in concept

    // Media list generation
    if (this.concept.audience?.influencers.journalists?.length ||
        this.concept.channels?.earned.targets.tier1) {
      this.concept.triggers!.mediaList = {
        enabled: true,
        count: (this.concept.channels?.earned.targets.tier1 || 10) +
               (this.concept.channels?.earned.targets.tier2 || 20) +
               (this.concept.channels?.earned.targets.tier3 || 30),
        criteria: ['Covers ' + this.concept.audience?.primary.definition],
        priority: this.concept.message?.pillars.map(p => p.theme) || []
      }
    }

    // Content generation
    if (this.concept.content?.volume.total) {
      this.concept.triggers!.contentGeneration = {
        enabled: true,
        pieces: this.concept.content.volume.types.map(t => ({
          type: t.type,
          count: t.quantity,
          theme: this.concept.core?.narrative.thesis || '',
          deadline: this.concept.execution?.timeline.duration || '30 days'
        }))
      }
    }

    // Project plan
    if (this.concept.execution?.timeline.duration) {
      this.concept.triggers!.projectPlan = {
        enabled: true,
        duration: this.concept.execution.timeline.duration,
        checkpoints: this.concept.execution.timeline.milestones || [],
        deliverables: []
      }
    }
  }

  // Generate orchestration plan from finalized concept
  generateOrchestrationPlan(): OrchestrationPlan {
    const plan: OrchestrationPlan = {
      concept: this.concept as CampaignConcept,
      sequence: [],
      parallel: [],
      handoffs: []
    }

    let stepNumber = 1

    // Step 1: Generate media list (if enabled)
    if (this.concept.triggers?.mediaList.enabled) {
      plan.sequence.push({
        step: stepNumber++,
        component: 'media-list-mcp',
        action: 'generate',
        input: {
          count: this.concept.triggers.mediaList.count,
          criteria: this.concept.triggers.mediaList.criteria,
          audience: this.concept.audience?.primary.definition
        },
        output: 'media_contacts.json',
        dependencies: []
      })
    }

    // Step 2: Generate content (can run in parallel with media list)
    if (this.concept.triggers?.contentGeneration.enabled) {
      this.concept.triggers.contentGeneration.pieces.forEach(piece => {
        plan.sequence.push({
          step: stepNumber++,
          component: 'content-generator-mcp',
          action: 'create',
          input: {
            type: piece.type,
            theme: piece.theme,
            narrative: this.concept.core?.narrative,
            tone: this.concept.message?.tone
          },
          output: `${piece.type}_content.json`,
          dependencies: []
        })
      })
    }

    // Step 3: Create project plan (depends on content)
    if (this.concept.triggers?.projectPlan.enabled) {
      plan.sequence.push({
        step: stepNumber++,
        component: 'project-planner-mcp',
        action: 'create',
        input: {
          duration: this.concept.triggers.projectPlan.duration,
          milestones: this.concept.execution?.timeline.milestones,
          deliverables: this.concept.triggers.projectPlan.deliverables
        },
        output: 'project_plan.json',
        dependencies: [2] // Depends on content generation
      })
    }

    // Define parallel execution groups
    plan.parallel.push({
      group: 'initial_generation',
      components: ['media-list-mcp', 'content-generator-mcp'],
      canRunSimultaneously: true
    })

    return plan
  }

  // Get current concept
  getConcept(): Partial<CampaignConcept> {
    return this.concept
  }

  // Get current state
  getState(): ConceptState {
    return this.state
  }

  // Export concept summary for display
  getSummary(): string {
    return `
**Campaign Concept Summary**

**Goal:** ${this.concept.core?.objective.primary || 'Not defined'}
**Audience:** ${this.concept.audience?.primary.definition || 'Not defined'}
**Core Message:** ${this.concept.core?.narrative.thesis || 'Not defined'}
**Timeline:** ${this.concept.execution?.timeline.duration || 'Not defined'}

**Completeness:** ${this.concept.confidence}%
**Status:** ${this.state.stage}
    `.trim()
  }
}

export const conceptBuilder = new ConceptBuilder()